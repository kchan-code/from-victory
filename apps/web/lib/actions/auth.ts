"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

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
