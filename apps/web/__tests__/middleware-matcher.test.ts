// Middleware matcher regression guard (FRO-6).
//
// The Next.js middleware matcher MUST exclude `/api/webhooks` so session-refresh
// middleware never touches a Stripe webhook request body — signature
// verification is byte-exact and middleware would break it. Webhooks also carry
// no user session to refresh, so running middleware there is pointless.
//
// We can't import `config` from middleware.ts: Next.js requires matcher values
// to be inline string literals (it ignores variable references in build-time
// static analysis), and middleware.ts pulls in `server-only` (which throws
// under vitest's node env). So we read the REAL matcher literal from the source
// file and derive the regex from it — the test validates exactly what ships,
// with zero drift.
//
// Node env, no browser APIs, no mocking.

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// __dirname resolves to apps/web/__tests__
const MIDDLEWARE_PATH = path.resolve(__dirname, "..", "middleware.ts");
const source = fs.readFileSync(MIDDLEWARE_PATH, "utf8");

// Pull out the first matcher string literal (the one beginning with `/((?!`),
// including its surrounding quotes, then JSON.parse it so the JS escapes in the
// source (`\\.` -> `\.`) become the real regex pattern the matcher represents.
const literalMatch = source.match(/"(\/\(\(\?![^"]*)"/);
if (!literalMatch) {
  throw new Error(
    "Could not find the middleware matcher literal in middleware.ts — did the matcher shape change?",
  );
}
const pattern = JSON.parse(literalMatch[0]) as string;
const matcher = new RegExp(`^${pattern}$`);

/** True when middleware (updateSession) WOULD run for this pathname. */
function middlewareRuns(pathname: string): boolean {
  return matcher.test(pathname);
}

describe("middleware matcher (FRO-6)", () => {
  it("includes the api/webhooks exclusion in the shipped literal", () => {
    expect(pattern).toContain("api/webhooks");
  });

  it("SKIPS middleware for webhook routes (protects Stripe signature)", () => {
    expect(middlewareRuns("/api/webhooks")).toBe(false);
    expect(middlewareRuns("/api/webhooks/stripe")).toBe(false);
  });

  it("still RUNS middleware on app + auth routes (session refresh preserved)", () => {
    expect(middlewareRuns("/")).toBe(true);
    expect(middlewareRuns("/athlete")).toBe(true);
    expect(middlewareRuns("/athlete/practice")).toBe(true);
    expect(middlewareRuns("/auth/callback")).toBe(true);
  });

  it("scopes the exclusion to webhooks only — other /api routes still refresh", () => {
    // Guards against accidentally broadening the exclusion to all of /api,
    // which would silently drop session refresh from future API routes.
    expect(middlewareRuns("/api/other")).toBe(true);
  });

  it("matches the webhook path on a boundary, not as a fuzzy prefix", () => {
    // The `(?:/|$)` terminator means only `/api/webhooks` and `/api/webhooks/*`
    // are excluded — a sibling like `/api/webhooks-data` still gets refresh.
    expect(middlewareRuns("/api/webhooks-data")).toBe(true);
    expect(middlewareRuns("/api/webhooksXYZ")).toBe(true);
  });

  it("still SKIPS static assets, image optimization, and favicon", () => {
    expect(middlewareRuns("/_next/static/chunk.js")).toBe(false);
    expect(middlewareRuns("/_next/image")).toBe(false);
    expect(middlewareRuns("/favicon.ico")).toBe(false);
    expect(middlewareRuns("/logo.svg")).toBe(false);
    expect(middlewareRuns("/photo.png")).toBe(false);
  });
});
