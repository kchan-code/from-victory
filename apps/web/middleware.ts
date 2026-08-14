import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "./lib/supabase/middleware";
import { isNativeShellUserAgent } from "./lib/native-shell";
import {
  NATIVE_SHELL_ROUTED_PATHS,
  resolveNativeShellEntryTarget,
} from "./lib/native-shell-router";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Native-shell entry-point router (Google Play "no in-app purchase"
  // compliance). apps/native/capacitor.config.ts loads the marketing site
  // root as the shell's first screen, which shows real prices — rejected by
  // Play Payments policy. In-shell only, these three marketing routes route
  // by auth state instead of ever rendering marketing/pricing content. See
  // lib/native-shell-router.ts. Outside the shell this block never runs —
  // isNativeShellUserAgent() is false for every ordinary browser request, so
  // non-shell behavior is unchanged.
  if (
    NATIVE_SHELL_ROUTED_PATHS.has(request.nextUrl.pathname) &&
    isNativeShellUserAgent(request.headers.get("user-agent"))
  ) {
    const target = await resolveNativeShellEntryTarget(request, response);
    if (target) {
      const redirectResponse = NextResponse.redirect(
        new URL(target, request.url),
      );
      // Carry forward any session-refresh cookies already written onto
      // `response` (by updateSession() or the router's own client) — a fresh
      // NextResponse.redirect() would otherwise silently drop them.
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static assets, image optimization, favicon,
    // any path ending in a static file extension, and webhook routes.
    //
    // `api/webhooks` is excluded because session-refresh middleware reads the
    // request and would break Stripe's byte-exact webhook signature
    // verification — and webhooks carry no user session to refresh anyway
    // (FRO-6). Scoped to `api/webhooks` only — the `(?:/|$)` boundary excludes
    // exactly `/api/webhooks` and `/api/webhooks/*` (not a fuzzy prefix like
    // `/api/webhooks-foo`); all other routes still get session refresh.
    // Matcher values must be inline string literals (Next.js
    // ignores variable references in static analysis); the regression test in
    // __tests__/middleware-matcher.test.ts mirrors this pattern — keep in sync.
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?)$).*)",
  ],
};
