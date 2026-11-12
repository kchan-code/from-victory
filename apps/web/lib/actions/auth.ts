"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { isSyntheticAthleteEmail } from "@/lib/auth/athlete-email";
import { rateLimitGate, getRequestIp } from "@/lib/actions/rate-limit-store";
import { startEmailSignup } from "@/lib/actions/email-signup";
import { isNativeShell } from "@/lib/native-shell";
import { createClient } from "@/lib/supabase/server";

const SignInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

/**
 * Action state shared by every auth form action.
 *
 * FV-671 (SSO A1): a verified email signup / unconfirmed sign-in is a TWO-STEP
 * flow, so besides `{ ok: true }` (nothing more to show) and `{ ok: false }`
 * (render `error`, optionally against `field`), an action can return
 * `{ ok: true, step: "verify_code" }`: the UI must now render the 6-digit code
 * screen for `email` (with resend), and submit it to `completeEmailSignup`
 * (purpose "signup") or `verifyEmailOnly` (purpose "signin").
 */
export type VerifyCodeStep = {
  ok: true;
  step: "verify_code";
  /** The normalized address the code was sent to (echoed so the UI needn't keep it). */
  email: string;
  /** signup -> completeEmailSignup; signin (legacy / unconfirmed account) -> verifyEmailOnly. */
  purpose: "signup" | "signin";
  /** Only for purpose "signup": the role being created. */
  role?: "parent" | "adult_athlete";
};

export type AuthActionState =
  | { ok: true }
  | VerifyCodeStep
  | { ok: false; error: string; field?: string }
  | null;

/**
 * @deprecated FV-671 — the legacy parent signup entry point, kept so existing
 * forms keep compiling. It is now step 1 of the verified two-step signup: it
 * delegates to startEmailSignup (role "parent") and returns the same
 * `{ ok: true, step: "verify_code" }` state. There is NO profile insert and NO
 * delete-on-failure rollback any more (profiles are created by
 * complete_pending_profile after the code is verified). New UI should call
 * startEmailSignup / completeEmailSignup directly.
 */
export async function signUp(
  prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const f = new FormData();
  for (const [k, v] of formData.entries()) f.append(k, v);
  f.set("role", "parent");
  return startEmailSignup(prev, f);
}

export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
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

  // Rate limiting (FV-13): keyed on normalized email (already lowercased/trimmed
  // by the Zod schema). Threat: credential stuffing / password spray.
  const { limited } = await rateLimitGate("sign_in", parsed.data.email);
  if (limited) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    // FV-671: GoTrue reports `email_not_confirmed` ONLY after the password was
    // correct (bad credentials always win), so this branch cannot be used to
    // enumerate accounts — a caller without the password still gets the generic
    // message below. A legacy account whose email is unconfirmed (or a signup
    // whose code was never entered) is sent a fresh code and the UI shows the
    // code screen (-> verifyEmailOnly).
    if (error.code === "email_not_confirmed") {
      const { limited: resendLimited } = await rateLimitGate(
        "signup_resend",
        parsed.data.email,
      );
      if (!resendLimited) {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email: parsed.data.email,
        });
        if (resendError) {
          // Includes the 60s cooldown (the previous code is still valid).
          console.error(
            `[auth.signIn] resend after email_not_confirmed failed: ${resendError.message} (status=${resendError.status ?? "n/a"} code=${resendError.code ?? "n/a"})`,
          );
        }
      }
      return {
        ok: true,
        step: "verify_code",
        email: parsed.data.email,
        purpose: "signin",
      };
    }
    // Generic user-facing message (no enumeration). Server-side log carries
    // the diagnostic — distinguishes "invalid_credentials" from rate-limit
    // / network / Supabase-down conditions.
    console.error(
      `[auth.signIn] signInWithPassword failed: ${error.message} (status=${error.status ?? "n/a"} code=${error.code ?? "n/a"})`,
    );
    return { ok: false, error: "Email or password is incorrect." };
  }

  // Role-aware landing (FV-326). An adult_athlete signs in here (real email,
  // via the "Athlete 18+/Parent" email tab) but trains in the athlete app —
  // sending them to /dashboard would loop through requireParent() back to
  // /signin. Mirrors redirectIfAuthed(): athlete roles → /athlete, else
  // /dashboard. Parents are unaffected.
  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    if (profile?.role === "athlete" || profile?.role === "adult_athlete") {
      redirect("/athlete");
    }
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  // Inside the native shell, "/" is the gated marketing root — real prices,
  // "Start your athlete's 14-day free trial" — a Google Play Payments policy
  // violation the moment it renders post-sign-out (FV-489). Route to /signin
  // instead, mirroring the native-shell entry-point router's own signed-out
  // target (NATIVE_SHELL_SIGNED_OUT_TARGET in lib/native-shell-router.ts).
  // Browser/PWA sign-out is unchanged — still lands on "/".
  redirect(isNativeShell() ? "/signin" : "/");
}

// -----------------------------------------------------------------------------
// Password reset (parent flow only — athletes have no email; their recovery
// path is "ask your parent for a new pairing link")
// -----------------------------------------------------------------------------

const RequestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
});

const UpdatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long."),
});

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fromvictoryapp.com";

// ALL athletes — parent-paired OR admin direct-created (FV-323) — have synthetic
// emails and recover via a new parent-generated pairing link, not this flow.
// isSyntheticAthleteEmail() short-circuits a reset targeting that domain so we
// don't burn sends on undeliverable inboxes — see lib/auth/athlete-email.ts.

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = RequestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
    };
  }

  // Anti-enumeration: return ok:true whether the email is a parent account,
  // an athlete synthetic address, or doesn't exist at all. But short-circuit
  // the actual Supabase call when we recognize an athlete address so we
  // don't burn an email send on an undeliverable inbox.
  if (isSyntheticAthleteEmail(parsed.data.email)) {
    return { ok: true };
  }

  // Rate limiting (FV-185): keyed on the normalized email. resetPasswordForEmail
  // sends a real email on every call and this action returns ok:true regardless
  // (anti-enumeration), so without a gate a bot can spam a known inbox and drain
  // the email-send quota. The limit keys on the submitted email — not on account
  // existence — so it leaks nothing. Placed after the synthetic short-circuit
  // because synthetic athlete addresses never trigger a send.
  const { limited } = await rateLimitGate("password_reset", parsed.data.email);
  if (limited) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
    },
  );
  if (error) {
    // Log diagnostic; user-facing response stays generic to prevent
    // account enumeration (we return ok:true whether or not the email
    // matched an existing account).
    console.error(
      `[auth.requestPasswordReset] resetPasswordForEmail failed: ${error.message} (status=${error.status ?? "n/a"} code=${error.code ?? "n/a"})`,
    );
  }
  return { ok: true };
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = UpdatePasswordSchema.safeParse({
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

  // Rate limiting (FV-185): keyed on request IP — the form carries no stable
  // identity (the recovery session does, but we avoid a round-trip). Lower risk
  // than the reset path since a valid recovery session is required; gated for
  // completeness against a session-replay/abuse loop.
  const ip = await getRequestIp();
  const { limited } = await rateLimitGate("password_update", ip);
  if (limited) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    console.error(
      `[auth.updatePassword] updateUser failed: ${error.message} (status=${error.status ?? "n/a"} code=${error.code ?? "n/a"})`,
    );
    if (error.message?.toLowerCase().includes("session")) {
      return {
        ok: false,
        error:
          "Your reset link expired. Request a new one from the forgot-password page.",
      };
    }
    return {
      ok: false,
      error: "We couldn't update your password. Try again in a minute.",
    };
  }

  redirect("/dashboard");
}
