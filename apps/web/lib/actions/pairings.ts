"use server";

/**
 * Athlete sign-in actions (device cookie + username) and forgetDevice.
 *
 * FV-630: the parent-issued pairing link generator and claim moved to
 * lib/actions/invites.ts (readable invite codes, atomic issue/claim RPCs,
 * separate recovery). Legacy /pair?code= links are claimed there too.
 */

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearDeviceAthleteId,
  getDeviceAthleteId,
  setDeviceAthleteId,
} from "@/lib/auth/device";
import { rateLimitGate, getRequestIp } from "@/lib/actions/rate-limit-store";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const AthleteSignInSchema = z.object({
  password: z.string().min(1, "Password is required."),
});

// FV-657: the Athlete tab accepts a username or (FV-654) an email, so its one
// generic failure message names both. Same message for every failure — no
// enumeration oracle.
const ATHLETE_TAB_GENERIC_ERROR = "That username, email or password isn't right.";

const AthleteUsernameSignInSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

export type AthleteSignInState =
  | { ok: true }
  | { ok: false; error: string; field?: string }
  | null;

/**
 * Athlete action: subsequent sign-ins on a paired device. Device cookie
 * tells us which athlete; only the password is collected.
 */
export async function athleteSignIn(
  _prev: AthleteSignInState,
  formData: FormData,
): Promise<AthleteSignInState> {
  const athleteId = await getDeviceAthleteId();
  if (!athleteId) {
    return {
      ok: false,
      error: "This device isn't paired yet. Sign in with your username, or ask your parent for an invite code.",
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

  const supabase = await createClient();
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
 * ATHLETE_TAB_GENERIC_ERROR — no enumeration oracle. The
 * timing is not perfectly equalised (username lookup is an extra DB call) but
 * the rate-limit is the primary DoS/brute-force control; timing-oracle
 * protection is a FV-251 follow-up.
 *
 * On success: sets the device cookie (same as claimPairing / athleteSignIn)
 * so subsequent visits on this device show the password-only form.
 *
 * FV-654: an 18+ self-serve athlete has a real email and no username, and the
 * sign-in screen's only tabs are "Parent" and "Athlete". An adult who picks
 * Athlete and types their email used to get the generic error with no way
 * forward. A value containing "@" is now an email: it signs in exactly like
 * the Parent tab's signIn (same `sign_in` rate-limit bucket keyed on the
 * email, same role-aware landing), with this form's generic error. The device
 * cookie is set only for a minor athlete, as on the username path.
 *
 * FormData fields:
 *   username — the athlete's username (case-insensitive), or an email
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

  // FV-654: usernames are [a-z0-9_] only (USERNAME_PATTERN in
  // lib/auth/athlete-username.ts, and the claim RPC's DB check), so a value
  // with "@" can only be an email — an 18+ athlete (or a parent) on this tab.
  if (lowercasedUsername.includes("@")) {
    return emailSignInFromAthleteTab(lowercasedUsername, parsed.data.password);
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
      error: ATHLETE_TAB_GENERIC_ERROR,
    };
  }

  if (!profile) {
    // Username not found. Return the SAME message as wrong-password so the
    // caller cannot enumerate valid usernames.
    return {
      ok: false,
      error: ATHLETE_TAB_GENERIC_ERROR,
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
      error: ATHLETE_TAB_GENERIC_ERROR,
    };
  }

  // Attempt sign-in with the synthetic email + supplied password.
  const supabase = await createClient();
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
      error: ATHLETE_TAB_GENERIC_ERROR,
    };
  }

  // Bind the device cookie so subsequent visits on this device show the
  // password-only form (same UX as claimPairing / athleteSignIn).
  await setDeviceAthleteId(athleteId);

  redirect("/athlete");
}

const EmailSchema = z.string().email();

/**
 * FV-654: the email branch of athleteUsernameSignIn. Mirrors signIn
 * (lib/actions/auth.ts) — the `sign_in` rate-limit bucket keyed on the email,
 * signInWithPassword, then role-aware landing — but keeps this form's generic
 * error so the Athlete tab never reveals whether an email has an account.
 * Not exported: a "use server" module's exports are callable actions.
 */
async function emailSignInFromAthleteTab(
  email: string,
  password: string,
): Promise<AthleteSignInState> {
  if (!EmailSchema.safeParse(email).success) {
    return { ok: false, error: ATHLETE_TAB_GENERIC_ERROR };
  }

  const { limited } = await rateLimitGate("sign_in", email);
  if (limited) {
    return {
      ok: false,
      error: "Too many tries. Give it a few minutes, then try again.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data?.user) {
    console.error(
      `[pairings.athleteUsernameSignIn] email sign-in failed: ${error?.message ?? "no user"} (status=${error?.status ?? "n/a"} code=${error?.code ?? "n/a"})`,
    );
    return { ok: false, error: ATHLETE_TAB_GENERIC_ERROR };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role === "athlete") {
    // A minor athlete who typed their synthetic email: same device binding
    // as the username path.
    await setDeviceAthleteId(data.user.id);
    redirect("/athlete");
  }
  if (profile?.role === "adult_athlete") {
    redirect("/athlete");
  }
  // Parent (or anything else): same landing as signIn.
  redirect("/dashboard");
}

/**
 * Clears both the Supabase session and the device-pairing cookie, so the
 * next /signin shows the parent form again. Used by the "Not {name}?
 * Sign in as someone else" link on the athlete sign-in screen.
 */
export async function forgetDevice() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearDeviceAthleteId();
  redirect("/signin");
}
