import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Handles the redirect that Supabase Auth issues after the user clicks
// a recovery / verification link. Exchanges the one-time `code` for a
// real session cookie and redirects to the `next` path (or /).
//
// Currently used by: password-reset flow (resetPasswordForEmail with
//   redirectTo set to /auth/callback?next=/reset-password).
//
// Failure modes (no code, malformed code, expired link) redirect to
// /signin with a generic error rather than leaking diagnostics.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/signin?reset=invalid", url.origin));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error(
      `[auth.callback] exchangeCodeForSession failed: ${error.message} (status=${error.status ?? "n/a"} code=${error.code ?? "n/a"})`,
    );
    return NextResponse.redirect(new URL("/signin?reset=invalid", url.origin));
  }

  // Only allow internal (same-origin, leading-slash) redirects to defeat
  // open-redirect via the next param.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
