import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "./lib/supabase/middleware";
import { isNativeShellUserAgent } from "./lib/native-shell";
import {
  UPDATE_REQUIRED_PATH,
  shouldRedirectToUpdate,
} from "./lib/native-build-gate";
import {
  NATIVE_SHELL_ROUTED_PATHS,
  resolveNativeShellEntryTarget,
} from "./lib/native-shell-router";

/**
 * Add "User-Agent" to a response's Vary header without clobbering any value
 * Next.js / updateSession() already set (FV-489). Segmenting these routed
 * paths by User-Agent is what lets a shell response and a browser response
 * for the SAME url coexist in any shared cache (a CDN edge cache, the
 * WebView's own HTTP cache, or this app's Cache Storage safelist in
 * public/sw.js) without ever being served to the wrong context.
 */
function addVaryUserAgent(headers: Headers) {
  const existing = headers.get("Vary");
  if (!existing) {
    headers.set("Vary", "User-Agent");
    return;
  }
  const values = existing.split(",").map((v) => v.trim());
  if (!values.includes("User-Agent")) {
    headers.set("Vary", `${existing}, User-Agent`);
  }
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // FV-717 minimum-supported-build gate. A store app below the server's
  // minimum for its platform (NATIVE_MIN_BUILD_IOS / NATIVE_MIN_BUILD_ANDROID;
  // unset = no gate) is sent to the update screen on every page navigation.
  // Runs before the entry-point router below so a gated shell never reaches
  // sign-in or a purchase surface. Never cached, and Vary: User-Agent, for the
  // same shared-cache reason as the routed paths (FV-489). See
  // lib/native-build-gate.ts.
  if (
    shouldRedirectToUpdate({
      method: request.method,
      pathname,
      userAgent: request.headers.get("user-agent"),
    })
  ) {
    const updateResponse = NextResponse.redirect(
      new URL(UPDATE_REQUIRED_PATH, request.url),
    );
    updateResponse.headers.set("Cache-Control", "no-store");
    addVaryUserAgent(updateResponse.headers);
    response.cookies.getAll().forEach((cookie) => {
      updateResponse.cookies.set(cookie);
    });
    return updateResponse;
  }

  // Native-shell entry-point router (Google Play "no in-app purchase"
  // compliance). apps/native/capacitor.config.ts loads the marketing site
  // root as the shell's first screen, which shows real prices — rejected by
  // Play Payments policy. In-shell only, these three marketing routes route
  // by auth state instead of ever rendering marketing/pricing content. See
  // lib/native-shell-router.ts. Outside the shell this block never runs —
  // isNativeShellUserAgent() is false for every ordinary browser request, so
  // non-shell behavior is unchanged.
  if (NATIVE_SHELL_ROUTED_PATHS.has(pathname)) {
    // FV-489: these paths must never be shared across a shell/browser cache
    // split. Vary applies to EVERY response for these paths (shell or not) —
    // a shared cache only respects Vary correctly if it sees the header on
    // every variant it might store.
    addVaryUserAgent(response.headers);

    if (isNativeShellUserAgent(request.headers.get("user-agent"))) {
      // FV-489 root cause: a shell response for one of these paths must
      // never be cached anywhere. Before this, a shell request that (for any
      // reason — a transient env-var read failure, a race, etc.) fell
      // through to a 200 render instead of the redirect below could get
      // written into this app's own Cache Storage safelist for "/"
      // (public/sw.js NAVIGATION_CACHE_SAFELIST) and replayed on every
      // future cold start, bypassing this router entirely — exactly the
      // observed bug (marketing page survives sign-out + force-stop, only
      // `pm clear` fixes it). no-store closes that off at the source; sw.js
      // additionally honors it before writing to Cache Storage.
      response.headers.set("Cache-Control", "no-store");

      const target = await resolveNativeShellEntryTarget(request, response);
      if (target) {
        const redirectResponse = NextResponse.redirect(
          new URL(target, request.url),
        );
        redirectResponse.headers.set("Cache-Control", "no-store");
        addVaryUserAgent(redirectResponse.headers);
        // Carry forward any session-refresh cookies already written onto
        // `response` (by updateSession() or the router's own client) — a fresh
        // NextResponse.redirect() would otherwise silently drop them.
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie);
        });
        return redirectResponse;
      }
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
