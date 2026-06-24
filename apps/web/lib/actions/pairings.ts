"use server";

import { createHash, randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearDeviceAthleteId,
  getDeviceAthleteId,
  setDeviceAthleteId,
} from "@/lib/auth/device";
import { requireParent } from "@/lib/auth/guards";
import { validateUsername } from "@/lib/auth/athlete-username";
import { rateLimitGate, getRequestIp } from "@/lib/actions/rate-limit-store";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const PAIRING_CODE_BYTES = 24; // ~32 chars base64url
const PAIRING_TTL_HOURS = 24;

/**
 * Hash a raw pairing code for storage/lookup (FV-177).
 *
 * The pairing code is a password-reset-class bearer token: claiming one sets
 * the athlete's password. We store ONLY sha256(code) (hex) at rest — the raw
 * code is shown to the parent exactly once at generation and is never written
 * to the database or logged. The /pair claim hashes the inbound code and
 * matches on this value. sha256 (not a slow password hash) is appropriate
 * because the input is 192 bits of CSPRNG entropy — there is no low-entropy
 * password to protect against offline brute force; the threat being closed is
 * at-rest disclosure of a replayable live token (leaked backup, mis-scoped
 * read, Studio session), and a 64-bit-plus preimage on sha256 is infeasible.
 */
function hashPairingCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

const ClaimSchema = z.object({
  code: z.string().min(1, "Pairing code is required."),
  username: z.string().min(1, "Username is required."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long."),
  password_confirm: z.string().min(1, "Please confirm your password."),
}).refine((d) => d.password === d.password_confirm, {
  message: "Passwords do not match.",
  path: ["password_confirm"],
});

const AthleteSignInSchema = z.object({
  password: z.string().min(1, "Password is required."),
});

const AthleteUsernameSignInSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

export type GenerateState =
  | { ok: true; code: string; expiresAt: string }
  | { ok: false; error: string }
  | null;

export type ClaimState =
  | { ok: true }
  | { ok: false; error: string; field?: string }
  | null;

export type AthleteSignInState =
  | { ok: true }
  | { ok: false; error: string; field?: string }
  | null;

/**
 * Parent action: generate a one-time pairing code for an athlete linked
 * to the calling parent. Returns the code (caller composes the URL).
 */
export async function generatePairingCode(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const athleteId = formData.get("athlete_id");
  if (typeof athleteId !== "string" || athleteId.length === 0) {
    return { ok: false, error: "Missing athlete id." };
  }

  const { userId: parentId } = await requireParent();

  // Rate limiting (FV-13): keyed on parentId (non-spoofable — derived from
  // the verified session by requireParent()). Threat: a compromised parent
  // session spinning up an unlimited number of pairing codes.
  const { limited } = await rateLimitGate("generate_pairing_code", parentId);
  if (limited) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const service = createServiceClient();

  // App-layer link check (DB trigger is the backstop).
  const { data: link, error: linkError } = await service
    .from("parent_athlete_links")
    .select("athlete_id")
    .eq("parent_id", parentId)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  if (linkError || !link) {
    console.error(
      `[pairings.generate] parent not linked to athlete (parentId=${parentId} athleteId=${athleteId}): ${linkError?.message ?? "no link row"}`,
    );
    return { ok: false, error: "You can't pair this athlete." };
  }

  const code = randomBytes(PAIRING_CODE_BYTES).toString("base64url");
  const codeHash = hashPairingCode(code);
  const expiresAt = new Date(
    Date.now() + PAIRING_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  // Void any prior unused codes for this athlete before issuing a new one
  // (FV-177 AC3). Generating a fresh link invalidates older ones so a parent
  // who regenerates can't leave multiple live claim URLs in the wild (e.g. a
  // forwarded text). Only unconsumed rows are deleted — consumed rows are an
  // audit trail the reaper ages out separately, and deleting them here would
  // also be a no-op for security (a consumed code can't be claimed again). A
  // failure here is non-fatal: worst case an older unused code stays live
  // until its 24h TTL, so we log and proceed rather than block pairing.
  const { error: voidError } = await service
    .from("device_pairings")
    .delete()
    .eq("athlete_id", athleteId)
    .is("consumed_at", null);

  if (voidError) {
    console.error(
      `[pairings.generate] voiding prior codes failed (parentId=${parentId} athleteId=${athleteId}): ${voidError.message}`,
    );
    // Non-fatal — continue to issue the new code.
  }

  const { error: insertError } = await service
    .from("device_pairings")
    .insert({
      code_sha256: codeHash,
      athlete_id: athleteId,
      created_by: parentId,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error(
      `[pairings.generate] insert failed (parentId=${parentId} athleteId=${athleteId}): ${insertError.message}`,
    );
    return { ok: false, error: "Could not create a pairing link. Try again." };
  }

  // The raw code is returned to the parent for the claim URL and is NEVER
  // persisted or logged — only code_sha256 is stored above.
  return { ok: true, code, expiresAt };
}

/**
 * Athlete action: consume a pairing code, set a username + real password,
 * bind the device cookie, sign in, redirect to /athlete.
 *
 * FV-320: now also accepts `username` in the FormData. The username
 * uniqueness check happens BEFORE the pairing code is consumed so a taken
 * username returns a field error without burning the single-use code.
 *
 * FormData fields:
 *   code             — the raw pairing code from the URL
 *   username         — the athlete's chosen username (3-20 chars, [a-z0-9_])
 *   password         — the athlete's chosen password (min 8 chars)
 *   password_confirm — must match password
 */
export async function claimPairing(
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const parsed = ClaimSchema.safeParse({
    code: formData.get("code"),
    username: formData.get("username"),
    password: formData.get("password"),
    password_confirm: formData.get("password_confirm"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
    };
  }

  // Validate and normalise the username with the pure helper.
  const usernameResult = validateUsername(parsed.data.username);
  if (!usernameResult.ok) {
    return { ok: false, error: usernameResult.error, field: "username" };
  }
  const normalizedUsername = usernameResult.normalized;

  // Rate limiting (FV-13): keyed on request IP. Place BEFORE the atomic
  // consume so we don't burn the single-use code on a rate-limited request.
  // Threat: DoS / timing attack on the pairing endpoint.
  const ip = await getRequestIp();
  const { limited } = await rateLimitGate("claim_pairing", ip);
  if (limited) {
    return {
      ok: false,
      error: "Too many tries. Give it a few minutes, then try again.",
    };
  }

  const service = createServiceClient();

  // ---------------------------------------------------------------------------
  // FV-320 UNIQUENESS CHECK — before consuming the pairing code.
  //
  // We check username uniqueness HERE (before the atomic consume) so that a
  // taken username returns a field error WITHOUT burning the single-use code.
  // The consume is the irreversible step; all reversible validations must
  // precede it.
  //
  // Re-claim of the SAME athlete: if this athlete already has this username
  // set on their profile (a retry / page refresh after a partial claim), we
  // allow it. We resolve the athlete_id from the code hash ONLY for the
  // re-claim check — we do NOT consume the code here.
  //
  // Implementation: look up the athlete from the code_sha256 WITHOUT
  // consuming (no update, just a select on the unconsumed + unexpired row).
  // If the username is taken by SOMEONE ELSE, return a field error.
  // If it's taken by THIS athlete (a re-claim), proceed normally.
  // ---------------------------------------------------------------------------

  const codeHash = hashPairingCode(parsed.data.code);
  const nowIsoForLookup = new Date().toISOString();

  // Non-consuming peek: find the athlete_id this code belongs to.
  const { data: peekedPairing, error: peekError } = await service
    .from("device_pairings")
    .select("athlete_id")
    .eq("code_sha256", codeHash)
    .is("consumed_at", null)
    .gt("expires_at", nowIsoForLookup)
    .maybeSingle();

  if (peekError) {
    console.error(
      `[pairings.claim] pre-consume peek failed: ${peekError.message}`,
    );
    return { ok: false, error: "Could not complete pairing. Please try again." };
  }

  if (!peekedPairing) {
    // Code is invalid/expired/consumed — return the same message the consume
    // would return so behaviour is identical to the pre-FV-320 flow.
    return {
      ok: false,
      error: "This pairing link is invalid, expired, or already used.",
    };
  }

  const peekedAthleteId = peekedPairing.athlete_id;

  // Check if the normalised username is already taken by another athlete.
  const { data: takenProfile, error: takenError } = await service
    .from("profiles")
    .select("id")
    .eq("username", normalizedUsername) // DB index is lower(username), exact match on pre-normalised value
    .eq("role", "athlete")
    .maybeSingle();

  if (takenError) {
    console.error(
      `[pairings.claim] username uniqueness check failed: ${takenError.message}`,
    );
    return { ok: false, error: "Could not complete pairing. Please try again." };
  }

  if (takenProfile && takenProfile.id !== peekedAthleteId) {
    // Taken by a DIFFERENT athlete. Return field error without burning the code.
    return {
      ok: false,
      error: "That username is already taken. Choose a different one.",
      field: "username",
    };
  }
  // If takenProfile.id === peekedAthleteId: this athlete already owns this
  // username (re-claim case). Proceed — the consume + password update will
  // succeed (username update is idempotent).

  // ---------------------------------------------------------------------------
  // Atomic consume — THE LOCK. (FV-177 + pre-FV-320 behaviour preserved.)
  // The conditional UPDATE returns a row if and only if the code existed, was
  // unconsumed, and was unexpired. Any concurrent claim for the same code loses
  // here. This must happen AFTER all reversible validations (username check
  // above) and BEFORE any irreversible mutations (password set below).
  // ---------------------------------------------------------------------------

  const nowIso = new Date().toISOString();
  const { data: claimed, error: consumeError } = await service
    .from("device_pairings")
    .update({ consumed_at: nowIso })
    .eq("code_sha256", codeHash)
    .is("consumed_at", null)
    .gt("expires_at", nowIso)
    .select("athlete_id")
    .maybeSingle();

  if (consumeError) {
    console.error(
      `[pairings.claim] atomic consume failed: ${consumeError.message}`,
    );
    return { ok: false, error: "Could not complete pairing. Please try again." };
  }
  if (!claimed) {
    // Either the code doesn't exist, has been used, or has expired. Single
    // message — we don't expose which; both to avoid enumeration and because
    // the recovery action (ask the parent for a fresh link) is the same.
    // Note: a race condition between the peek and the consume hitting this
    // branch is handled correctly — the code is treated as consumed/expired.
    return {
      ok: false,
      error: "This pairing link is invalid, expired, or already used.",
    };
  }

  const athleteId = claimed.athlete_id;

  // Fetch the athlete's synthetic email (lives on auth.users, not profiles).
  const { data: userData, error: userError } =
    await service.auth.admin.getUserById(athleteId);
  if (userError || !userData.user?.email) {
    console.error(
      `[pairings.claim] post-consume getUserById failed (athleteId=${athleteId}); code is burned, athlete needs a fresh pairing link: ${userError?.message ?? "no email"} (status=${userError?.status ?? "n/a"} code=${userError?.code ?? "n/a"})`,
    );
    return { ok: false, error: "Could not complete pairing. Please try again." };
  }
  const syntheticEmail = userData.user.email;

  // Update the athlete's password from the random temp set in PR-04c.
  // If this fails, the code is already burned (consumed_at set) so the
  // athlete must request a fresh pairing link. Logged loudly for forensics.
  const { error: pwError } = await service.auth.admin.updateUserById(
    athleteId,
    { password: parsed.data.password },
  );
  if (pwError) {
    console.error(
      `[pairings.claim] post-consume updateUserById failed (athleteId=${athleteId}); code is burned, athlete needs a fresh pairing link: ${pwError.message} (status=${pwError.status ?? "n/a"} code=${pwError.code ?? "n/a"})`,
    );
    return { ok: false, error: "Could not set the password. Please try again." };
  }

  // Set the username on the athlete's profile (service role — bypasses RLS
  // column grant gap per FV-251). Using upsert semantics (update where id =
  // athleteId) via a targeted UPDATE — the profile row already exists.
  // If this fails the password was already set; the athlete can still sign in
  // with the device-cookie path (which doesn't require a username). Logged
  // for forensics and the athlete can re-claim a fresh code to set a username.
  const { error: usernameError } = await service
    .from("profiles")
    .update({ username: normalizedUsername })
    .eq("id", athleteId)
    .eq("role", "athlete");

  if (usernameError) {
    // Check if it's a uniqueness violation (race condition between uniqueness
    // check above and the write here — extremely rare but possible).
    if (usernameError.message?.includes("unique") || usernameError.code === "23505") {
      return {
        ok: false,
        error: "That username was just taken. Choose a different one.",
        field: "username",
      };
    }
    console.error(
      `[pairings.claim] username set failed (athleteId=${athleteId}); code is burned. Athlete can sign in with device cookie but has no username for cross-device sign-in: ${usernameError.message}`,
    );
    // Non-fatal for the claim itself: athlete gets the cookie + session below.
    // They will need to set a username later (FV-320 follow-up: "set username"
    // flow for athletes who have no username yet).
  }

  // Bind device cookie to this athlete BEFORE redirect.
  setDeviceAthleteId(athleteId);

  // Sign in via the anon-key client (sets the Supabase session cookies).
  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: parsed.data.password,
  });
  if (signInError) {
    console.error(
      `[pairings.claim] post-consume signInWithPassword failed (athleteId=${athleteId}); cookie is set, athlete can retry from /signin: ${signInError.message} (status=${signInError.status ?? "n/a"} code=${signInError.code ?? "n/a"})`,
    );
    // Cookie is set; athlete can retry from /signin which will show
    // password-only form with the device cookie binding.
    redirect("/signin");
  }

  redirect("/athlete");
}

/**
 * Athlete action: subsequent sign-ins on a paired device. Device cookie
 * tells us which athlete; only the password is collected.
 */
export async function athleteSignIn(
  _prev: AthleteSignInState,
  formData: FormData,
): Promise<AthleteSignInState> {
  const athleteId = getDeviceAthleteId();
  if (!athleteId) {
    return {
      ok: false,
      error: "This device isn't paired. Ask your parent to send a pairing link.",
    };
  }

  const parsed = AthleteSignInSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
    };
  }

  // Rate limiting (FV-13): keyed on the device athlete ID (UUID from cookie —
  // already verified above as non-null). Threat: password brute-force against
  // a stolen device cookie.
  const { limited } = await rateLimitGate("athlete_sign_in", athleteId);
  if (limited) {
    return {
      ok: false,
      error: "Too many tries. Give it a few minutes, then try again.",
    };
  }

  const service = createServiceClient();
  const { data: userData, error: userError } =
    await service.auth.admin.getUserById(athleteId);
  if (userError || !userData.user?.email) {
    console.error(
      `[pairings.athleteSignIn] getUserById failed (athleteId=${athleteId}): ${userError?.message ?? "no email"} (status=${userError?.status ?? "n/a"} code=${userError?.code ?? "n/a"})`,
    );
    return { ok: false, error: "Sign-in is unavailable. Please try again." };
  }

  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: parsed.data.password,
  });
  if (signInError) {
    // Generic user-facing message (no enumeration). Server-side log carries
    // the diagnostic — distinguishes wrong-password from rate-limit /
    // network conditions.
    console.error(
      `[pairings.athleteSignIn] signInWithPassword failed (athleteId=${athleteId}): ${signInError.message} (status=${signInError.status ?? "n/a"} code=${signInError.code ?? "n/a"})`,
    );
    return { ok: false, error: "Password is incorrect." };
  }

  redirect("/athlete");
}

/**
 * Athlete action: any-device sign-in using username + password (FV-320).
 *
 * This is the new entry point for athletes signing in on a device they have
 * not previously paired. It resolves the athlete's synthetic email from their
 * username (via service role) then calls the existing signInWithPassword flow.
 *
 * Rate-limiting: keyed on HMAC(lower(username) + ":" + clientIP) so both
 * per-username and per-IP signals are captured in a single bucket. See
 * rate-limit.ts "username_sign_in" config.
 *
 * Generic failure message: BOTH unknown-username and wrong-password return
 * "That username or password isn't right." — no enumeration oracle. The
 * timing is not perfectly equalised (username lookup is an extra DB call) but
 * the rate-limit is the primary DoS/brute-force control; timing-oracle
 * protection is a FV-251 follow-up.
 *
 * On success: sets the device cookie (same as claimPairing / athleteSignIn)
 * so subsequent visits on this device show the password-only form.
 *
 * FormData fields:
 *   username — the athlete's username (case-insensitive)
 *   password — the athlete's password
 */
export async function athleteUsernameSignIn(
  _prev: AthleteSignInState,
  formData: FormData,
): Promise<AthleteSignInState> {
  const parsed = AthleteUsernameSignInSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
    };
  }

  const lowercasedUsername = parsed.data.username.trim().toLowerCase();

  // Rate-limit FIRST — before any DB call that could reveal whether the
  // username exists. Keyed on a composite of lower(username) + ":" + IP so
  // a spray attack across IPs and a focused attack on one username both hit
  // their respective limits.
  const ip = await getRequestIp();
  // Combine username + IP into one identifier string. The rate-limit store
  // HMAC-digests this so neither value is stored in plaintext.
  const rateLimitIdentifier = ip
    ? `${lowercasedUsername}:${ip}`
    : lowercasedUsername;

  const { limited } = await rateLimitGate("username_sign_in", rateLimitIdentifier);
  if (limited) {
    return {
      ok: false,
      error: "Too many tries. Give it a few minutes, then try again.",
    };
  }

  const service = createServiceClient();

  // Resolve athlete_id from username (case-insensitive lookup via lower()).
  // Service role is required: the `authenticated` role cannot read username
  // from another athlete's profile (column-level gap — FV-251), but more
  // importantly, the caller is NOT authenticated yet, so we must use service
  // role for the lookup entirely.
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("id")
    .eq("username", lowercasedUsername)
    .eq("role", "athlete")
    .maybeSingle();

  if (profileError) {
    console.error(
      `[pairings.athleteUsernameSignIn] username lookup failed: ${profileError.message}`,
    );
    // Generic error — do NOT distinguish "DB error" from "not found".
    return {
      ok: false,
      error: "That username or password isn't right.",
    };
  }

  if (!profile) {
    // Username not found. Return the SAME message as wrong-password so the
    // caller cannot enumerate valid usernames.
    return {
      ok: false,
      error: "That username or password isn't right.",
    };
  }

  const athleteId = profile.id;

  // Resolve the synthetic email via auth.admin.getUserById (service role).
  const { data: userData, error: userError } =
    await service.auth.admin.getUserById(athleteId);
  if (userError || !userData.user?.email) {
    console.error(
      `[pairings.athleteUsernameSignIn] getUserById failed (athleteId=${athleteId}): ${userError?.message ?? "no email"} (status=${userError?.status ?? "n/a"} code=${userError?.code ?? "n/a"})`,
    );
    return {
      ok: false,
      error: "That username or password isn't right.",
    };
  }

  // Attempt sign-in with the synthetic email + supplied password.
  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: parsed.data.password,
  });

  if (signInError) {
    // Wrong password (or any other signInWithPassword failure). Generic message.
    console.error(
      `[pairings.athleteUsernameSignIn] signInWithPassword failed (athleteId=${athleteId}): ${signInError.message} (status=${signInError.status ?? "n/a"} code=${signInError.code ?? "n/a"})`,
    );
    return {
      ok: false,
      error: "That username or password isn't right.",
    };
  }

  // Bind the device cookie so subsequent visits on this device show the
  // password-only form (same UX as claimPairing / athleteSignIn).
  setDeviceAthleteId(athleteId);

  redirect("/athlete");
}

/**
 * Clears both the Supabase session and the device-pairing cookie, so the
 * next /signin shows the parent form again. Used by the "Not {name}?
 * Sign in as someone else" link on the athlete sign-in screen.
 */
export async function forgetDevice() {
  const supabase = createClient();
  await supabase.auth.signOut();
  clearDeviceAthleteId();
  redirect("/signin");
}
