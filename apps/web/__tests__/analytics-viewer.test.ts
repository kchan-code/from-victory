/**
 * FV-727 — getAnalyticsMountContext.
 *
 * The mount decision is pure; this pins the server wiring that feeds it:
 * shell UA skips the profile read, no auth cookie stays signed-out, role
 * `athlete` is a minor, and a failed role read fails closed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const maybeSingle = vi.fn();

let cookieNames: string[] = [];
let userAgent: string | null = null;

vi.mock("next/headers", () => ({
  cookies: () => ({
    getAll: () => cookieNames.map((name) => ({ name, value: "redacted" })),
  }),
  headers: () => ({
    get: (key: string) => (key.toLowerCase() === "user-agent" ? userAgent : null),
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle,
        }),
      }),
    }),
  }),
}));

import { getAnalyticsMountContext } from "@/lib/analytics/viewer";

const SESSION_COOKIE = "sb-abcdefghijklmnop-auth-token";
const SHELL_UA =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 FVNativeShell/1";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

beforeEach(() => {
  cookieNames = [];
  userAgent = "Mozilla/5.0 (Macintosh) AppleWebKit/537.36";
  getUser.mockReset();
  maybeSingle.mockReset();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_KEY;
});

describe("getAnalyticsMountContext", () => {
  it("a native shell does not read the session", async () => {
    userAgent = SHELL_UA;
    cookieNames = [SESSION_COOKIE];
    const ctx = await getAnalyticsMountContext();
    expect(ctx).toEqual({ nativeShell: true, session: "signed-out" });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("ios and play shells are native shells", async () => {
    userAgent = "Mozilla/5.0 FVNativeShell/1 (ios)";
    expect((await getAnalyticsMountContext()).nativeShell).toBe(true);
    userAgent = "Mozilla/5.0 FVNativeShell/1 (play)";
    expect((await getAnalyticsMountContext()).nativeShell).toBe(true);
    expect(getUser).not.toHaveBeenCalled();
  });

  it("no auth cookie is signed-out and does not call getUser", async () => {
    cookieNames = ["sb-abcdefghijklmnop-auth-token-code-verifier"];
    const ctx = await getAnalyticsMountContext();
    expect(ctx).toEqual({ nativeShell: false, session: "signed-out" });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("role athlete is a signed-in minor", async () => {
    cookieNames = [SESSION_COOKIE];
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: { role: "athlete" }, error: null });
    const ctx = await getAnalyticsMountContext();
    expect(ctx).toEqual({ nativeShell: false, session: "minor" });
  });

  it("parent and adult_athlete are non-minors", async () => {
    cookieNames = [`${SESSION_COOKIE}.0`];
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: { role: "parent" }, error: null });
    expect((await getAnalyticsMountContext()).session).toBe("non-minor");

    maybeSingle.mockResolvedValue({ data: { role: "adult_athlete" }, error: null });
    expect((await getAnalyticsMountContext()).session).toBe("non-minor");
  });

  it("a profile read error fails closed", async () => {
    cookieNames = [SESSION_COOKIE];
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: null, error: { message: "rls" } });
    expect((await getAnalyticsMountContext()).session).toBe("unresolved");
  });

  it("a thrown session lookup fails closed", async () => {
    cookieNames = [SESSION_COOKIE];
    getUser.mockRejectedValue(new Error("network"));
    expect((await getAnalyticsMountContext()).session).toBe("unresolved");
  });

  it("an auth cookie with no verified user is signed-out", async () => {
    cookieNames = [SESSION_COOKIE];
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
    expect((await getAnalyticsMountContext()).session).toBe("signed-out");
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("an auth cookie without Supabase env fails closed and does not call getUser", async () => {
    cookieNames = [SESSION_COOKIE];
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect((await getAnalyticsMountContext()).session).toBe("unresolved");
    expect(getUser).not.toHaveBeenCalled();
  });
});
