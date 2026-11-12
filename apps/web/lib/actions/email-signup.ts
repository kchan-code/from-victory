"use server";

import { redirect } from "next/navigation";

import { getRequestIp, rateLimitGate } from "@/lib/actions/rate-limit-store";
import {
  ADULT_COMPLETE_KEYS,
  ADULT_START_KEYS,
  CompleteAdultSchema,
  CompleteParentSchema,
  PARENT_COMPLETE_KEYS,
  PARENT_START_KEYS,
  ResendSchema,
  StartAdultSchema,
  StartParentSchema,
  VerifyOnlySchema,
  firstIssue,
  parseSignupRole,
  pick,
  type SignupRole,
} from "@/lib/auth/email-signup-schema";
import { closePendingAccount } from "@/lib/auth/pending-account";
import { isAdultSignupEnabled } from "@/lib/flags";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { getRequestShellCapability } from "@/lib/native-shell";
import { createClient } from "@/lib/supabase/server";

import type { AuthActionState } from "./auth";

/**
 * Verified email signup (FV-671, SSO A1; spec §4 + §5.2).
 *
 * Confirm email is ON permanently, so `auth.signUp` returns NO session: the
 * owner must enter the 6-digit code first. Profile creation therefore happens
 * AFTER verification, in the locked `complete_pending_profile` transaction.
 *
 *   startEmailSignup     validate everything -> rate limit -> auth.signUp
 *                        (no options.data) -> { step: "verify_code" }
 *   completeEmailSignup  verifyOtp -> complete_pending_profile RPC -> redirect
 *   verifyEmailOnly      verifyOtp for an EXISTING account (legacy / unconfirmed
 *                        sign-in): no insert
 *   resendSignupCode     resend the code (per-email rate limit)
 *
 * Invariants: the form fields are never written to user_metadata; a failed
 * profile insert NEVER deletes the user (the legacy rollback is gone — every
 * destructive path goes through finalize_pending_deletion, which re-checks
 * under the lock); nothing here logs an email, birthdate, or code.
 *
 * UI contract (see AuthActionState in ./auth): the code screen needs, on the
 * `completeEmailSignup` submit, the SAME fields as step 1 minus `password`
 * (role, email, first_name, [birthdate, sport, age_attestation |
 * guardian_attestation], consent) plus `token`. Keep them in client state.
 */

const START_ERROR =
  "We couldn't create that account. Try signing in, or use a different email.";
const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
const BAD_CODE =
  "That code didn't work. Check it, or request a new one.";

function roleHome(role: string | null | undefined): string {
  return role === "athlete" || role === "adult_athlete"
    ? "/athlete"
    : "/dashboard";
}

/** Where a brand-new adult goes: same routing as the legacy signUpAdultAthlete. */
function newAccountHome(role: SignupRole): string {
  if (role === "parent") return "/dashboard";
  // Inside the legacy-native shell /subscribe is a no-purchase dead end
  // (FV-478/FV-482), so a legacy-native adult lands on /athlete; an ios-iap
  // shell (FV-577) and the web go to /subscribe.
  return getRequestShellCapability() === "legacy-native"
    ? "/athlete"
    : "/subscribe";
}

// ---------------------------------------------------------------------------
// Step 1
// ---------------------------------------------------------------------------

export async function startEmailSignup(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const role = parseSignupRole(formData.get("role"));
  if (!role) return { ok: false, error: "Choose an account type." , field: "role" };
  if (role === "adult_athlete" && !isAdultSignupEnabled()) {
    return { ok: false, error: "Self-serve signup isn't available yet." };
  }

  // Validate the WHOLE form (18+ birthdate for adults / guardian attestation
  // for parents, consent, password) BEFORE anything is created or sent: a bad
  // submission leaves no auth row and sends no email.
  const parsed =
    role === "parent"
      ? StartParentSchema.safeParse(pick(formData, PARENT_START_KEYS))
      : StartAdultSchema.safeParse(pick(formData, ADULT_START_KEYS));
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };
  const { email, password } = parsed.data;

  // Mass-account creation / email-send-quota exhaustion: keyed on request IP.
  const ip = await getRequestIp();
  const { limited } = await rateLimitGate("sign_up", ip);
  if (limited) return { ok: false, error: TOO_MANY };

  const supabase = createClient();
  // No options.data: nothing from the form is written to user_metadata.
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) {
    // Generic message — the raw Supabase error would enable enumeration.
    console.error(
      `[email-signup.start] auth.signUp failed: ${error?.message ?? "no user returned"} (status=${error?.status ?? "n/a"} code=${error?.code ?? "n/a"})`,
    );
    return { ok: false, error: START_ERROR };
  }

  if (data.session) {
    // Confirm email is meant to be ON permanently. A session here means the
    // project is mis-configured (autoconfirm): never continue on an unverified
    // address — end the session and alert.
    await supabase.auth.signOut();
    console.error(
      "[email-signup.start] auth.signUp returned a session: Confirm email is OFF. Refusing to continue.",
    );
    deliverInBackground(
      notifyError(
        "[auth] signUp returned a session",
        "Confirm email appears to be OFF. Verified email signup is refusing to proceed.",
        {},
      ),
    );
    return { ok: false, error: START_ERROR };
  }

  // Same response whether the address is new, unconfirmed (code re-sent) or
  // already registered (no email) — no enumeration.
  return { ok: true, step: "verify_code", email, purpose: "signup", role };
}

// ---------------------------------------------------------------------------
// Step 2
// ---------------------------------------------------------------------------

export async function completeEmailSignup(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const role = parseSignupRole(formData.get("role"));
  if (!role) return { ok: false, error: "Choose an account type.", field: "role" };
  if (role === "adult_athlete" && !isAdultSignupEnabled()) {
    return { ok: false, error: "Self-serve signup isn't available yet." };
  }

  // Re-validate the full schema: this is a separate request carrying
  // client-held values, so nothing from step 1 is trusted.
  const parsed =
    role === "parent"
      ? CompleteParentSchema.safeParse(pick(formData, PARENT_COMPLETE_KEYS))
      : CompleteAdultSchema.safeParse(pick(formData, ADULT_COMPLETE_KEYS));
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };
  const fields = parsed.data;

  const supabase = createClient();

  // A retry after the code was already accepted (e.g. the profile RPC failed
  // transiently) must not need the spent one-time code again: when this
  // browser already holds a session for this exact, confirmed email, go
  // straight to profile completion (QA #600 1b).
  let userId: string | null = null;
  const { data: current } = await supabase.auth.getUser();
  if (
    current?.user &&
    current.user.email_confirmed_at &&
    (current.user.email ?? "").toLowerCase() === fields.email
  ) {
    userId = current.user.id;
  } else {
    // Per-email cap on code guesses. The per-IP `sign_up` budget was already
    // charged in step 1 (startEmailSignup), so it is not charged again here.
    const { limited: verifyLimited } = await rateLimitGate(
      "signup_verify",
      fields.email,
    );
    if (verifyLimited) return { ok: false, error: TOO_MANY };

    const { data: verified, error: verifyError } = await supabase.auth.verifyOtp({
      email: fields.email,
      token: fields.token,
      type: "email",
    });
    if (verifyError || !verified.user) {
      console.error(
        `[email-signup.complete] verifyOtp failed: ${verifyError?.message ?? "no user returned"} (status=${verifyError?.status ?? "n/a"} code=${verifyError?.code ?? "n/a"})`,
      );
      return { ok: false, error: BAD_CODE, field: "token" };
    }
    userId = verified.user.id;
  }

  const { data: result, error: rpcError } = await supabase.rpc(
    "complete_pending_profile",
    {
      p_role: role,
      p_first_name: "first_name" in fields ? fields.first_name : "",
      p_birthdate: "birthdate" in fields ? fields.birthdate : null,
      p_sport: "sport" in fields ? fields.sport : null,
    },
  );

  if (rpcError) {
    if (rpcError.message?.includes("account_closing")) {
      // A tombstone exists: this signup was closed (cancel / under-18 / reaper).
      await supabase.auth.signOut();
      return {
        ok: false,
        error: "This sign-up was closed. Please start again.",
      };
    }
    // NEVER delete on failure: the user stays verified-and-pending and can
    // retry (or the reaper cleans up later through the lock).
    console.error(
      `[email-signup.complete] complete_pending_profile failed (code=${rpcError.code ?? "n/a"}): ${rpcError.message}`,
    );
    deliverInBackground(
      notifyError(
        "[auth] complete_pending_profile failed",
        rpcError.message,
        { code: rpcError.code ?? "n/a" },
      ),
    );
    return {
      ok: false,
      error: "Could not create your profile. Please try again.",
    };
  }

  if (result === "reject_underage") {
    // Counts only — never the birthdate. Tombstone is already written; close
    // the account (revoke hook -> finalize -> sign out).
    console.info("[email-signup.complete] under-18 adult signup rejected");
    await closePendingAccount(userId);
    redirect("/signup?error=age");
  }

  if (result === "already_complete") {
    // Two tabs / a retry: the profile exists. Route by the REAL role.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    redirect(roleHome(profile?.role));
  }

  if (result === "created") {
    redirect(newAccountHome(role));
  }

  console.error(
    `[email-signup.complete] unexpected complete_pending_profile result (${String(result)})`,
  );
  return {
    ok: false,
    error: "Could not create your profile. Please try again.",
  };
}

// ---------------------------------------------------------------------------
// Legacy / unconfirmed sign-in: verify only, no insert
// ---------------------------------------------------------------------------

export async function verifyEmailOnly(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = VerifyOnlySchema.safeParse(
    pick(formData, ["email", "token"] as const),
  );
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const { limited } = await rateLimitGate("signup_verify", parsed.data.email);
  if (limited) return { ok: false, error: TOO_MANY };

  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });
  if (error || !data.user) {
    console.error(
      `[email-signup.verifyOnly] verifyOtp failed: ${error?.message ?? "no user returned"} (status=${error?.status ?? "n/a"} code=${error?.code ?? "n/a"})`,
    );
    return { ok: false, error: BAD_CODE, field: "token" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  // No profile: a signup that was verified but never finished. The /welcome
  // completion page (A3) handles it; until it ships the guards sign the
  // orphan session out. TODO(FV-671 A3): /welcome.
  if (!profile) redirect("/welcome");
  redirect(roleHome(profile.role));
}

// ---------------------------------------------------------------------------
// Resend
// ---------------------------------------------------------------------------

export async function resendSignupCode(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = ResendSchema.safeParse(pick(formData, ["email"] as const));
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const rawPurpose = formData.get("purpose");
  const purpose = rawPurpose === "signin" ? "signin" : "signup";
  const role = parseSignupRole(formData.get("role")) ?? undefined;

  const { limited } = await rateLimitGate("signup_resend", parsed.data.email);
  if (limited) return { ok: false, error: TOO_MANY };

  const supabase = createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
  });
  if (error) {
    // Includes the 60 s resend cooldown. Stay generic: same answer whether or
    // not an account exists (no enumeration).
    console.error(
      `[email-signup.resend] auth.resend failed: ${error.message} (status=${error.status ?? "n/a"} code=${error.code ?? "n/a"})`,
    );
  }
  return {
    ok: true,
    step: "verify_code",
    email: parsed.data.email,
    purpose,
    ...(purpose === "signup" && role ? { role } : {}),
  };
}
