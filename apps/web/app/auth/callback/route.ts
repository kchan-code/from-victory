import { NextResponse, type NextRequest } from "next/server";

import { isRecoveryNext, sanitizeCallbackNext } from "@/lib/auth/callback-next";
import { getSessionState, homeForState } from "@/lib/auth/session-state";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect that Supabase Auth issues after:
//   - the user clicks a recovery link (resetPasswordForEmail with redirectTo
//     /auth/callback?next=/reset-password), and
//   - Google sign-in (Supabase-hosted OAuth with PKCE; FV-672, spec FV-569
//     §5.3). The PKCE verifier lives in this browser/WebView's cookies, so the
//     exchange happens here, in the same context that started the flow.
//
// Order: provider `error` params first -> exchangeCodeForSession -> `next`
// allow-list -> session state. Failures NEVER leak diagnostics:
//   - recovery (next=/reset-password) keeps `/signin?reset=invalid` exactly;
//   - everything else goes to `/signin?error=oauth`.
// A verified user without a profile (`pending`) always lands on /welcome; a
// profile-read failure (`error`) is never routed to /welcome or /subscribe.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next");
  const recovery = isRecoveryNext(rawNext);
  const failure = () =>
    NextResponse.redirect(
      new URL(recovery ? "/signin?reset=invalid" : "/signin?error=oauth", url.origin),
    );

  // 1. Provider error params (user cancelled, access_denied, ...). The values
  //    are never echoed or logged.
  if (
    url.searchParams.has("error") ||
    url.searchParams.has("error_code") ||
    url.searchParams.has("error_description")
  ) {
    return failure();
  }

  if (!code) {
    // Preserved: a recovery link with no code is `reset=invalid`. A bare hit
    // with neither a code nor a recovery `next` is a failed OAuth round trip.
    return NextResponse.redirect(
      new URL(
        rawNext === null || recovery ? "/signin?reset=invalid" : "/signin?error=oauth",
        url.origin,
      ),
    );
  }

  // 2. Exchange.
  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error(
      `[auth.callback] exchangeCodeForSession failed: ${error.message} (status=${error.status ?? "n/a"} code=${error.code ?? "n/a"})`,
    );
    return failure();
  }

  const safeNext = sanitizeCallbackNext(rawNext);

  // Recovery: unchanged — straight to the reset page, no profile check.
  if (recovery && safeNext) {
    return NextResponse.redirect(new URL(safeNext, url.origin));
  }

  // 3. Where does this session belong?
  const { state } = await getSessionState();

  if (state === "pending") {
    // Carry only the `as` account-type hint, and only its two valid values.
    const as = safeNext
      ? new URL(safeNext, url.origin).searchParams.get("as")
      : null;
    const dest =
      as === "parent" || as === "adult" ? `/welcome?as=${as}` : "/welcome";
    return NextResponse.redirect(new URL(dest, url.origin));
  }

  if (state === "athlete") {
    // Defense in depth (privacy review #601): a minor (13-17) athlete account
    // never holds a provider (SSO) session. Sign out and fail closed.
    console.error("[auth.callback] provider session resolved to a minor athlete; signing out");
    await supabase.auth.signOut();
    return failure();
  }

  const home = homeForState(state);
  if (home) {
    return NextResponse.redirect(new URL(safeNext ?? home, url.origin));
  }

  if (state === "orphan") {
    return NextResponse.redirect(new URL("/auth/signout", url.origin));
  }

  // `error` / `none`: we could not establish where this user belongs. Never
  // /welcome and never /subscribe.
  return NextResponse.redirect(new URL("/signin?error=oauth", url.origin));
}
