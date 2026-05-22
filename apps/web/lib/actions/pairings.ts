"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearDeviceAthleteId,
  getDeviceAthleteId,
  setDeviceAthleteId,
} from "@/lib/auth/device";
import { requireParent } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const PAIRING_CODE_BYTES = 24; // ~32 chars base64url
const PAIRING_TTL_HOURS = 24;

const ClaimSchema = z.object({
  code: z.string().min(1, "Pairing code is required."),
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
  const expiresAt = new Date(
    Date.now() + PAIRING_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { error: insertError } = await service
    .from("device_pairings")
    .insert({
      code,
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

  return { ok: true, code, expiresAt };
}

/**
 * Athlete action: consume a pairing code, set the athlete's real password,
 * bind the device cookie, sign in, redirect to /athlete.
 */
export async function claimPairing(
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const parsed = ClaimSchema.safeParse({
    code: formData.get("code"),
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

  const service = createServiceClient();

  // Atomic consume — THE LOCK. The conditional UPDATE returns a row if and
  // only if the code existed, was unconsumed, and was unexpired. Any
  // concurrent claim for the same code (network retry, link shared twice,
  // racing tabs) loses here. This must happen BEFORE we touch the password,
  // otherwise two claimants could both update the password and the second
  // one would silently win. HIGH #1 from PR #21 review.
  const nowIso = new Date().toISOString();
  const { data: claimed, error: consumeError } = await service
    .from("device_pairings")
    .update({ consumed_at: nowIso })
    .eq("code", parsed.data.code)
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
    // message — we don't expose which, both to avoid enumeration and because
    // the recovery action (ask the parent for a fresh link) is the same.
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
