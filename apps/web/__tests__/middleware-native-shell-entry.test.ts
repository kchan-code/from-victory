/**
 * Integration tests for the native-shell entry-point router as wired into
 * middleware.ts (Google Play "no in-app purchase" compliance, entry-point-
 * router follow-up to FV-478).
 *
 * Exercises the REAL `middleware()` export end-to-end against real
 * NextRequest / NextResponse instances (both are plain, constructible
 * outside the Edge runtime — no shimming needed). Only "server-only" and
 * "@supabase/ssr" are mocked, matching __tests__/native-shell-router.test.ts
 * and __tests__/middleware-matcher.test.ts's note that middleware.ts pulls
 * in "server-only" transitively (via lib/supabase/middleware.ts).
 *
 * Covers, for each of "/", "/pricing", "/parents":
 *   - in-shell + signed out       → redirect to /signin
 *   - in-shell + parent           → redirect to /dashboard
 *   - in-shell + athlete          → redirect to /athlete
 *   - NOT in-shell (any auth state) → no redirect (pass-through, unchanged)
 * Plus: a non-gated marketing route ("/teams") is never redirected even
 * in-shell, and a redirect carries forward any session-refresh cookie that
 * updateSession() wrote onto the response.
 *
 * FV-489 regression coverage: a shell response for one of these paths must
 * never be cacheable anywhere (Cache-Control: no-store), and every response
 * — shell or browser — must carry Vary: User-Agent so a shared cache (CDN,
 * WebView HTTP cache, or this app's own Cache Storage safelist in
 * public/sw.js) can never conflate a shell response with a browser response
 * for the same URL. See public/sw.js's networkFirstWithOfflineFallback,
 * which is the other half of this fix (it honors no-store before writing to
 * Cache Storage) and __tests__/sw-route-strategy.test.ts / a dedicated sw.js
 * cache-write test for that side.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

type UserResult = { id: string } | null;
type ProfileResult = { role: string } | null;

let userResult: UserResult = null;
let profileResult: ProfileResult = null;
// Simulates the real supabase-js client's behavior of writing a refreshed
// session cookie back through the adapter's setAll() when getUser() is
// called — this is how updateSession() (lib/supabase/middleware.ts) is
// supposed to end up with a Set-Cookie header on its response.
let simulateCookieRefresh = false;

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    config: {
      cookies: {
        setAll?: (
          cookies: { name: string; value: string; options: Record<string, unknown> }[],
        ) => void;
      };
    },
  ) => ({
    auth: {
      getUser: async () => {
        if (simulateCookieRefresh) {
          config.cookies.setAll?.([
            { name: "sb-refreshed", value: "yes", options: {} },
          ]);
        }
        return { data: { user: userResult } };
      },
    },
    from: (_table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: string) => ({
          single: async () => ({ data: profileResult, error: null }),
        }),
      }),
    }),
  }),
}));

import { middleware } from "@/middleware";

const NATIVE_SHELL_UA =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 FVNativeShell/1";
const ORDINARY_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15";

function makeRequest(pathname: string, userAgent: string): NextRequest {
  return new NextRequest(`https://www.fromvictoryapp.com${pathname}`, {
    headers: { "user-agent": userAgent },
  });
}

beforeEach(() => {
  userResult = null;
  profileResult = null;
  simulateCookieRefresh = false;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-test";
});

describe.each(["/", "/pricing", "/parents"])(
  "middleware — native-shell entry router on %s",
  (path) => {
    it("in-shell + signed out → redirects to /signin", async () => {
      userResult = null;

      const response = await middleware(makeRequest(path, NATIVE_SHELL_UA));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://www.fromvictoryapp.com/signin",
      );
    });

    it("in-shell (any auth state) → the redirect response is never cacheable and varies by User-Agent (FV-489)", async () => {
      userResult = null;

      const response = await middleware(makeRequest(path, NATIVE_SHELL_UA));

      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("vary")).toContain("User-Agent");
    });

    it("in-shell + parent → redirects to /dashboard", async () => {
      userResult = { id: "parent-1" };
      profileResult = { role: "parent" };

      const response = await middleware(makeRequest(path, NATIVE_SHELL_UA));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://www.fromvictoryapp.com/dashboard",
      );
    });

    it("in-shell + minor athlete → redirects to /athlete", async () => {
      userResult = { id: "athlete-1" };
      profileResult = { role: "athlete" };

      const response = await middleware(makeRequest(path, NATIVE_SHELL_UA));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://www.fromvictoryapp.com/athlete",
      );
    });

    it("in-shell + adult_athlete → redirects to /athlete", async () => {
      userResult = { id: "adult-1" };
      profileResult = { role: "adult_athlete" };

      const response = await middleware(makeRequest(path, NATIVE_SHELL_UA));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://www.fromvictoryapp.com/athlete",
      );
    });

    it("NOT in-shell (ordinary browser), signed out → no redirect", async () => {
      userResult = null;

      const response = await middleware(makeRequest(path, ORDINARY_UA));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("NOT in-shell (ordinary browser), signed-in parent → no redirect (marketing page renders normally)", async () => {
      userResult = { id: "parent-1" };
      profileResult = { role: "parent" };

      const response = await middleware(makeRequest(path, ORDINARY_UA));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("NOT in-shell → still carries Vary: User-Agent, but Cache-Control is left unchanged (browser/PWA caching unaffected, FV-489)", async () => {
      userResult = null;

      const response = await middleware(makeRequest(path, ORDINARY_UA));

      expect(response.headers.get("vary")).toContain("User-Agent");
      // Middleware itself never forces no-store for a browser request — that
      // decision (if any) is left entirely to the page/route, unchanged.
      expect(response.headers.get("cache-control")).not.toBe("no-store");
    });
  },
);

describe("middleware — native-shell entry router scope", () => {
  it("never redirects a non-gated marketing route, even in-shell", async () => {
    userResult = null;

    const response = await middleware(makeRequest("/teams", NATIVE_SHELL_UA));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not add the FV-489 no-store/Vary treatment to a non-gated marketing route", async () => {
    userResult = null;

    const response = await middleware(makeRequest("/teams", NATIVE_SHELL_UA));

    expect(response.headers.get("cache-control")).not.toBe("no-store");
    expect(response.headers.get("vary")).toBeNull();
  });

  it("carries forward a session-refresh cookie onto the redirect response", async () => {
    userResult = { id: "parent-1" };
    profileResult = { role: "parent" };
    simulateCookieRefresh = true;

    const response = await middleware(makeRequest("/", NATIVE_SHELL_UA));

    expect(response.status).toBe(307);
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("sb-refreshed=yes");
  });
});
