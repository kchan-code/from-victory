import type { NextRequest } from "next/server";

import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
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
