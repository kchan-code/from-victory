/**
 * Unit tests for lib/native-shell-router.ts — the native-shell entry-point
 * router's role → home resolution (Google Play "no in-app purchase"
 * compliance, entry-point-router follow-up to FV-478).
 *
 * Mocking strategy: "server-only" is a no-op (matches native-shell.test.ts).
 * "@supabase/ssr" is mocked wholesale with a controllable auth.getUser() /
 * profiles.select().eq().single() stub — this file never touches a real
 * Supabase project or a real NextRequest/NextResponse cookie jar.
 *
 * Path-gating (NATIVE_SHELL_ROUTED_PATHS combined with the User-Agent check)
 * and the actual middleware redirect wiring are covered end-to-end in
 * __tests__/middleware-native-shell-entry.test.ts — this file is scoped to
 * resolveNativeShellEntryTarget()'s own role-mapping logic in isolation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextRequest, NextResponse } from "next/server";

vi.mock("server-only", () => ({}));

type UserResult = Record<string, unknown> | null;
type ProfileResult = { role: string } | null;

let userResult: UserResult = null;
let profileResult: ProfileResult = null;
let profileError: { message: string } | null = null;

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: userResult } }),
    },
    from: (_table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: string) => ({
          maybeSingle: async () => ({ data: profileResult, error: profileError }),
        }),
      }),
    }),
  }),
}));

import {
  resolveNativeShellEntryTarget,
  NATIVE_SHELL_SIGNED_OUT_TARGET,
  NATIVE_SHELL_PARENT_TARGET,
  NATIVE_SHELL_ATHLETE_TARGET,
  NATIVE_SHELL_ROUTED_PATHS,
} from "@/lib/native-shell-router";

// Minimal request/response stand-ins — resolveNativeShellEntryTarget only
// ever reads request.cookies.getAll() and writes via response.cookies.set(),
// neither of which these tests exercise (no cookie-refresh scenario here).
function requestWithUa(ua: string): NextRequest {
  return {
    cookies: { getAll: () => [], set: () => undefined },
    headers: new Headers({ "user-agent": ua }),
  } as unknown as NextRequest;
}
const fakeRequest = requestWithUa("Mozilla/5.0 (Linux; Android 14) FVNativeShell/1");
const fakeResponse = { cookies: { set: () => undefined } } as unknown as NextResponse;

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

beforeEach(() => {
  userResult = null;
  profileResult = null;
  profileError = null;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-test";
});

describe("NATIVE_SHELL_ROUTED_PATHS", () => {
  it("is exactly the marketing root, pricing, and parents routes", () => {
    expect(Array.from(NATIVE_SHELL_ROUTED_PATHS).sort()).toEqual(
      ["/", "/parents", "/pricing"].sort(),
    );
  });

  it("does not include other marketing pages (KC explicitly rejected gating all 11)", () => {
    expect(NATIVE_SHELL_ROUTED_PATHS.has("/teams")).toBe(false);
    expect(NATIVE_SHELL_ROUTED_PATHS.has("/about")).toBe(false);
    expect(NATIVE_SHELL_ROUTED_PATHS.has("/resources")).toBe(false);
  });
});

describe("resolveNativeShellEntryTarget", () => {
  it("routes a signed-out visitor to /signin", async () => {
    userResult = null;

    const target = await resolveNativeShellEntryTarget(fakeRequest, fakeResponse);

    expect(target).toBe(NATIVE_SHELL_SIGNED_OUT_TARGET);
    expect(target).toBe("/signin");
  });

  it("routes a signed-in parent to /dashboard", async () => {
    userResult = { id: "parent-1" };
    profileResult = { role: "parent" };

    const target = await resolveNativeShellEntryTarget(fakeRequest, fakeResponse);

    expect(target).toBe(NATIVE_SHELL_PARENT_TARGET);
    expect(target).toBe("/dashboard");
  });

  it("routes a signed-in minor athlete to /athlete", async () => {
    userResult = { id: "athlete-1" };
    profileResult = { role: "athlete" };

    const target = await resolveNativeShellEntryTarget(fakeRequest, fakeResponse);

    expect(target).toBe(NATIVE_SHELL_ATHLETE_TARGET);
    expect(target).toBe("/athlete");
  });

  it("routes a signed-in adult_athlete (18+ self-serve) to /athlete", async () => {
    userResult = { id: "adult-1" };
    profileResult = { role: "adult_athlete" };

    const target = await resolveNativeShellEntryTarget(fakeRequest, fakeResponse);

    expect(target).toBe(NATIVE_SHELL_ATHLETE_TARGET);
  });

  it("routes an authenticated session with no profiles row to /auth/signout (orphan escape hatch)", async () => {
    userResult = { id: "orphan-1" };
    profileResult = null;
    profileError = null;

    const target = await resolveNativeShellEntryTarget(fakeRequest, fakeResponse);

    expect(target).toBe("/auth/signout");
  });

  it("routes an authenticated session with a profile read error to /auth/signout", async () => {
    userResult = { id: "error-1" };
    profileResult = null;
    profileError = { message: "relation does not exist" };

    const target = await resolveNativeShellEntryTarget(fakeRequest, fakeResponse);

    expect(target).toBe("/auth/signout");
  });

  it("routes an authenticated session with an unrecognized role to /auth/signout", async () => {
    userResult = { id: "weird-1" };
    profileResult = { role: "something_unexpected" };

    const target = await resolveNativeShellEntryTarget(fakeRequest, fakeResponse);

    expect(target).toBe("/auth/signout");
  });

  it("degrades to null (no redirect) when Supabase env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    userResult = { id: "parent-1" };
    profileResult = { role: "parent" };

    const target = await resolveNativeShellEntryTarget(fakeRequest, fakeResponse);

    expect(target).toBeNull();

    process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_KEY;
  });
});

// FV-672: pending (verified, no profile) -> /welcome ONLY in FVAuth/1 builds.
describe("resolveNativeShellEntryTarget: pending session (FV-672)", () => {
  const FVAUTH_UA = "Mozilla/5.0 (iPhone) FVNativeShell/1 (ios) FVAuth/1";
  const OLD_SHELL_UA = "Mozilla/5.0 (iPhone) FVNativeShell/1 (ios)";
  const GOOGLE_USER = {
    id: "p-1",
    email: "g@example.com",
    app_metadata: { provider: "google", providers: ["google"] },
  };
  const APPLE_USER = {
    id: "p-2",
    app_metadata: { provider: "apple", providers: ["apple"] },
  };
  const ORPHAN_USER = {
    id: "o-1",
    email: "e@example.com",
    email_confirmed_at: null,
    app_metadata: { provider: "email", providers: ["email"] },
  };

  it.each([
    ["google", GOOGLE_USER],
    ["apple", APPLE_USER],
  ])("FVAuth build + %s user without a profile -> /welcome", async (_l, user) => {
    userResult = user;
    profileResult = null;
    expect(
      await resolveNativeShellEntryTarget(requestWithUa(FVAUTH_UA), fakeResponse),
    ).toBe("/welcome");
  });

  it("a shell WITHOUT FVAuth/1 keeps today's /auth/signout", async () => {
    userResult = GOOGLE_USER;
    profileResult = null;
    expect(
      await resolveNativeShellEntryTarget(requestWithUa(OLD_SHELL_UA), fakeResponse),
    ).toBe("/auth/signout");
  });

  it("FVAuth/1 alone (no shell token) is not an FVAuth build", async () => {
    userResult = GOOGLE_USER;
    profileResult = null;
    expect(
      await resolveNativeShellEntryTarget(requestWithUa("Mozilla/5.0 FVAuth/1"), fakeResponse),
    ).toBe("/auth/signout");
  });

  it("an orphan (unconfirmed email-only) stays /auth/signout even in an FVAuth build", async () => {
    userResult = ORPHAN_USER;
    profileResult = null;
    expect(
      await resolveNativeShellEntryTarget(requestWithUa(FVAUTH_UA), fakeResponse),
    ).toBe("/auth/signout");
  });

  it("a failed profile read in an FVAuth build is NEVER /welcome", async () => {
    userResult = GOOGLE_USER;
    profileResult = null;
    profileError = { message: "boom" };
    expect(
      await resolveNativeShellEntryTarget(requestWithUa(FVAUTH_UA), fakeResponse),
    ).toBe("/auth/signout");
  });

  it("an established parent in an FVAuth build still goes to /dashboard", async () => {
    userResult = GOOGLE_USER;
    profileResult = { role: "parent" };
    expect(
      await resolveNativeShellEntryTarget(requestWithUa(FVAUTH_UA), fakeResponse),
    ).toBe("/dashboard");
  });
});
