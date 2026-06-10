"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { isSyntheticAthleteEmail } from "@/lib/auth/athlete-email";
import { rateLimitGate, getRequestIp } from "@/lib/actions/rate-limit-store";
import { notifyError } from "@/lib/monitoring/notify";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

const SignUpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long."),
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(50, "First name is too long."),
  consent: z.literal("on", {
    message:
      "You need to agree to the Terms of Use and acknowledge the Privacy Policy.",
  }),
});

const SignInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export type AuthActionState =
  | { ok: true }
  | { ok: false; error: string; field?: string }
  | null;

export async function signUp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    first_name: formData.get("first_name"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
    };
  }

  // Rate limiting (FV-13): keyed on request IP — no stable identity at signup
  // yet. Threat: mass-account creation / email-send-quota exhaustion.
  const ip = await getRequestIp();
  const { limited } = await rateLimitGate("sign_up", ip);
  if (limited) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    // Generic message: returning Supabase's raw error (e.g. "User already
    // registered", "over_email_send_rate_limit") enables account enumeration.
    // Log full diagnostic info server-side so Vercel logs surface code+status
    // when something breaks.
    console.error(
      `[auth.signUp] supabase.auth.signUp failed: ${error.message} (status=${error.status ?? "n/a"} code=${error.code ?? "n/a"})`,
    );
    return {
      ok: false,
      error:
        "We couldn't create that account. Try signing in, or use a different email.",
    };
  }
  if (!data.user) {
    console.error("[auth.signUp] no user returned from supabase.auth.signUp");
    return {
      ok: false,
      error:
        "We couldn't create that account. Try signing in, or use a different email.",
    };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    role: "parent",
    first_name: parsed.data.first_name,
    birthdate: null,
  });
  if (profileError) {
    // Atomic rollback: delete the orphan auth.users row so the email is freed
    // for a retry. Closes HIGH #2 from PR #19's kids-privacy-officer review.
    const service = createServiceClient();
    const userId = data.user.id;
    const { error: rollbackError } =
      await service.auth.admin.deleteUser(userId);
    console.error(
      `[auth.signUp] profile insert failed (userId=${userId}); rolled back auth.users (rollback_ok=${!rollbackError}): ${profileError.message}${
        rollbackError ? ` | rollback error: ${rollbackError.message}` : ""
      }`,
    );
    void notifyError(
      "[auth] signUp profile insert failed",
      profileError.message,
      { rollback_ok: String(!rollbackError) },
    );
    return {
      ok: false,
      error: "Could not create your profile. Please try again.",
    };
  }

  redirect("/dashboard");
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
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    // Generic user-facing message (no enumeration). Server-side log carries
    // the diagnostic — distinguishes "invalid_credentials" from rate-limit
    // / network / Supabase-down conditions.
    console.error(
      `[auth.signIn] signInWithPassword failed: ${error.message} (status=${error.status ?? "n/a"} code=${error.code ?? "n/a"})`,
    );
    return { ok: false, error: "Email or password is incorrect." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
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

// Athletes paired via the parent flow (PR-04c) have synthetic emails;
// they recover via a new parent-generated pairing link, not this flow.
// Direct-signup athletes (admin-created beta path) have real emails and
// DO go through this flow. isSyntheticAthleteEmail() distinguishes them
// — see lib/auth/athlete-email.ts for the canonical domain.

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
