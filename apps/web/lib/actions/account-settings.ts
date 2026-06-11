/**
 * Server actions for the parent account/settings page (FV-192).
 *
 * sendOwnPasswordReset — sends a password-reset email to the SIGNED-IN
 * parent's own account email. The email is derived server-side from the
 * authenticated session (auth.getUser()) and the formData argument is
 * ignored entirely, so a tampered POST body cannot direct the reset email
 * anywhere else (qa finding on the prior hidden-field pattern).
 *
 * Rate limiting of reset sends is tracked in FV-185 and is NOT built here.
 */

"use server";

import { requireParent } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/actions/auth";

export async function sendOwnPasswordReset(
  _prev: AuthActionState,
  _formData: FormData,
): Promise<AuthActionState> {
  // Gate to an authenticated parent; redirects to /signin otherwise.
  await requireParent();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email;
  if (!email) {
    // A parent session without an email should not exist; fail calmly.
    return {
      ok: false,
      error: "Couldn't send the reset link right now. Try again in a moment.",
    };
  }

  // Read at call time (same pattern as billing-portal.ts) so the canonical
  // fallback applies per-request and the value is testable.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fromvictoryapp.com";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });
  if (error) {
    // Own-account flow: no enumeration concern (the email comes from the
    // session), so unlike requestPasswordReset we can be honest on failure.
    console.error(
      `[account-settings.sendOwnPasswordReset] resetPasswordForEmail failed: ${error.message} (status=${error.status ?? "n/a"} code=${error.code ?? "n/a"})`,
    );
    return {
      ok: false,
      error: "Couldn't send the reset link right now. Try again in a moment.",
    };
  }

  return { ok: true };
}
