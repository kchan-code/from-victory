/**
 * FV-625 — GET /api/athlete/access (pregame's training-entitlement check).
 *
 * Pins: auth/role handling, that the body carries ONLY a redirect path
 * (privacy: no level/status/plan/provider/date ever reaches the athlete), and
 * that the answer is never cacheable.
 */
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const { getUserMock, singleMock, resolveMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  singleMock: vi.fn(),
  resolveMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    from: () => ({ select: () => ({ eq: () => ({ single: singleMock }) }) }),
  }),
}));
vi.mock("@/lib/subscriptions/enforce", () => ({
  resolveTrainingAccess: resolveMock,
}));

import { GET } from "@/app/api/athlete/access/route";

afterEach(() => vi.clearAllMocks());

function signedIn(role: string) {
  getUserMock.mockResolvedValue({ data: { user: { id: "u-1" } } });
  singleMock.mockResolvedValue({ data: { role }, error: null });
}

function expectNoStore(res: Response) {
  const cc = res.headers.get("cache-control") ?? "";
  expect(cc).toContain("no-store");
  expect(cc).toContain("private");
}

describe("GET /api/athlete/access", () => {
  it("401 with no session, never consults entitlement", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
    expectNoStore(res);
    expect(resolveMock).not.toHaveBeenCalled();
  });

  it("401 when the profile row can't be read", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u-1" } } });
    singleMock.mockResolvedValue({ data: null, error: { message: "x" } });
    const res = await GET();
    expect(res.status).toBe(401);
    expect(resolveMock).not.toHaveBeenCalled();
  });

  it("403 for a parent (no training surface)", async () => {
    signedIn("parent");
    const res = await GET();
    expect(res.status).toBe(403);
    expectNoStore(res);
    expect(resolveMock).not.toHaveBeenCalled();
  });

  it("entitled athlete → { redirect: null } and nothing else", async () => {
    signedIn("athlete");
    resolveMock.mockResolvedValue({ allowed: true, level: "full" });
    const res = await GET();
    expect(res.status).toBe(200);
    expectNoStore(res);
    expect(await res.json()).toEqual({ redirect: null });
    expect(resolveMock).toHaveBeenCalledWith({ role: "athlete" });
  });

  it("degraded is still entitled and the level never crosses the wire", async () => {
    signedIn("athlete");
    resolveMock.mockResolvedValue({ allowed: true, level: "degraded" });
    const res = await GET();
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ redirect: null });
    expect(text).not.toMatch(/degraded|full|blocked|level/);
  });

  it("canceled family → { redirect: '/athlete/paused' } only", async () => {
    signedIn("athlete");
    resolveMock.mockResolvedValue({ allowed: false, redirectTo: "/athlete/paused" });
    const res = await GET();
    expect(res.status).toBe(200);
    expectNoStore(res);
    expect(await res.json()).toEqual({ redirect: "/athlete/paused" });
  });

  it("seat-paused athlete → /athlete/paused?reason=seats", async () => {
    signedIn("athlete");
    resolveMock.mockResolvedValue({
      allowed: false,
      redirectTo: "/athlete/paused?reason=seats",
    });
    expect(await (await GET()).json()).toEqual({
      redirect: "/athlete/paused?reason=seats",
    });
  });

  it("adult_athlete passes its own role through (blocked → /subscribe)", async () => {
    signedIn("adult_athlete");
    resolveMock.mockResolvedValue({ allowed: false, redirectTo: "/subscribe" });
    expect(await (await GET()).json()).toEqual({ redirect: "/subscribe" });
    expect(resolveMock).toHaveBeenCalledWith({ role: "adult_athlete" });
  });
});
