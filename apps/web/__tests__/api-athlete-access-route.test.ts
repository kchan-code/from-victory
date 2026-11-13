/**
 * FV-625 — GET /api/athlete/access (pregame's training-entitlement check).
 *
 * Pins: auth/role handling, that the body carries ONLY a redirect path plus
 * the offline bound `offlineUntil` (KC policy: until the last verified period
 * ends) — never a level/status/plan/provider — that the bound is computed
 * only when allowed, and that the answer is never cacheable.
 */
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const { getUserMock, singleMock, resolveMock, untilMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  singleMock: vi.fn(),
  resolveMock: vi.fn(),
  untilMock: vi.fn(),
}));

const UNTIL = "2026-12-09T12:00:00.000Z";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    from: () => ({ select: () => ({ eq: () => ({ single: singleMock }) }) }),
  }),
}));
vi.mock("@/lib/subscriptions/enforce", () => ({
  resolveTrainingAccess: resolveMock,
  resolveOfflineEntitlementUntil: untilMock,
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

  it("entitled athlete → { redirect: null, offlineUntil } and nothing else", async () => {
    signedIn("athlete");
    resolveMock.mockResolvedValue({ allowed: true, level: "full" });
    untilMock.mockResolvedValue(UNTIL);
    const res = await GET();
    expect(res.status).toBe(200);
    expectNoStore(res);
    expect(await res.json()).toEqual({ redirect: null, offlineUntil: UNTIL });
    expect(resolveMock).toHaveBeenCalledWith({ role: "athlete" });
  });

  it("entitled with no end date (perpetual comp grant / gating off) → offlineUntil: null", async () => {
    signedIn("athlete");
    resolveMock.mockResolvedValue({ allowed: true, level: "full" });
    untilMock.mockResolvedValue(null);
    expect(await (await GET()).json()).toEqual({ redirect: null, offlineUntil: null });
  });

  it("degraded is still entitled and the level never crosses the wire", async () => {
    signedIn("athlete");
    resolveMock.mockResolvedValue({ allowed: true, level: "degraded" });
    untilMock.mockResolvedValue(UNTIL);
    const res = await GET();
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ redirect: null, offlineUntil: UNTIL });
    expect(text).not.toMatch(/degraded|full|blocked|level|status|plan|provider|stripe|apple|grant/i);
  });

  it("canceled family → { redirect: '/athlete/paused' } only", async () => {
    signedIn("athlete");
    resolveMock.mockResolvedValue({ allowed: false, redirectTo: "/athlete/paused" });
    const res = await GET();
    expect(res.status).toBe(200);
    expectNoStore(res);
    expect(await res.json()).toEqual({ redirect: "/athlete/paused", offlineUntil: null });
    // The bound is never computed (or sent) for a blocked user.
    expect(untilMock).not.toHaveBeenCalled();
  });

  it("seat-paused athlete → /athlete/paused?reason=seats", async () => {
    signedIn("athlete");
    resolveMock.mockResolvedValue({
      allowed: false,
      redirectTo: "/athlete/paused?reason=seats",
    });
    expect(await (await GET()).json()).toEqual({
      redirect: "/athlete/paused?reason=seats",
      offlineUntil: null,
    });
    expect(untilMock).not.toHaveBeenCalled();
  });

  it("adult_athlete passes its own role through (blocked → /subscribe)", async () => {
    signedIn("adult_athlete");
    resolveMock.mockResolvedValue({ allowed: false, redirectTo: "/subscribe" });
    expect(await (await GET()).json()).toEqual({ redirect: "/subscribe", offlineUntil: null });
    expect(resolveMock).toHaveBeenCalledWith({ role: "adult_athlete" });
  });

  it("FV-636: an entitled adult_athlete gets an offline bound like a minor athlete", async () => {
    signedIn("adult_athlete");
    resolveMock.mockResolvedValue({ allowed: true, level: "full" });
    untilMock.mockResolvedValue(UNTIL);
    expect(await (await GET()).json()).toEqual({ redirect: null, offlineUntil: UNTIL });
  });

  it("FV-656: an unreadable status → 503 'unavailable' (can't verify), never a redirect or a bound", async () => {
    signedIn("athlete");
    resolveMock.mockResolvedValue({
      allowed: false,
      redirectTo: "/athlete/paused?reason=unavailable",
      statusUnknown: true,
    });
    const res = await GET();
    expect(res.status).toBe(503);
    expectNoStore(res);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ error: "unavailable" });
    // No redirect for the shell to follow (so nothing is revoked) and no
    // offline bound (so nothing is granted or extended).
    expect(text).not.toMatch(/redirect|offlineUntil|paused|subscribe/);
    expect(untilMock).not.toHaveBeenCalled();
  });

  it("FV-656: a self-payer with an unreadable status also gets 503", async () => {
    signedIn("adult_athlete");
    resolveMock.mockResolvedValue({ allowed: false, redirectTo: "/subscribe", statusUnknown: true });
    expect((await GET()).status).toBe(503);
  });
});
