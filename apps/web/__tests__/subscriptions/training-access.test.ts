/**
 * FV-625 — resolveTrainingAccess() is the single training-entitlement decision
 * behind requireActiveAccess() (server redirect on hub/daily/practice/
 * postgame/journey) and GET /api/athlete/access (pregame's client-side gate).
 *
 * Pins: (a) the decision table, (b) requireActiveAccess() behaviour is
 * unchanged by the refactor, (c) every redirect it can produce is on the
 * client allowlist in lib/subscriptions/training-redirects.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const { accessMock, untilMock, seatMock, redirectMock, payerMock, entitlementMock } = vi.hoisted(() => ({
  // FV-656: the blocked path asks the error-tracking entitlement read whether
  // the status was actually readable. Default: readable and not entitled.
  payerMock: vi.fn(),
  entitlementMock: vi.fn(),
  accessMock: vi.fn(),
  untilMock: vi.fn(),
  seatMock: vi.fn(),
  redirectMock: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`);
  }),
}));

vi.mock("@/lib/subscriptions/access", () => ({
  getAccessForCurrentUser: accessMock,
  getOfflineEntitlementUntilForCurrentUser: untilMock,
  getPayerIdForCurrentUser: payerMock,
}));
vi.mock("@/lib/subscriptions/subscribe-guard", () => ({
  getSubscribeEntitlementState: entitlementMock,
}));
vi.mock("@/lib/subscriptions/seat-state", () => ({
  getAthleteSeatStatusForCurrentUser: seatMock,
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import {
  requireActiveAccess,
  resolveOfflineEntitlementUntil,
  resolveTrainingAccess,
  type CallerRole,
} from "@/lib/subscriptions/enforce";
import { isTrainingBlockedRedirect } from "@/lib/subscriptions/training-redirects";

const ORIGINAL_FLAG = process.env.ENFORCE_SUBSCRIPTION_GATING;

beforeEach(() => {
  process.env.ENFORCE_SUBSCRIPTION_GATING = "true";
  seatMock.mockResolvedValue("active");
  payerMock.mockResolvedValue("payer-1");
  entitlementMock.mockResolvedValue({ status: "not_entitled", provider: null });
});
afterEach(() => {
  vi.clearAllMocks();
  if (ORIGINAL_FLAG === undefined) delete process.env.ENFORCE_SUBSCRIPTION_GATING;
  else process.env.ENFORCE_SUBSCRIPTION_GATING = ORIGINAL_FLAG;
});

describe("resolveTrainingAccess — decision table", () => {
  it("flag off → allowed without reading entitlement", async () => {
    process.env.ENFORCE_SUBSCRIPTION_GATING = "false";
    await expect(resolveTrainingAccess({ role: "athlete" })).resolves.toEqual({
      allowed: true,
      level: "full",
    });
    expect(accessMock).not.toHaveBeenCalled();
  });

  it.each<["full" | "degraded"]>([["full"], ["degraded"]])(
    "%s (active/trialing/comp, or past_due etc.) → allowed for a minor athlete with an active seat",
    async (level) => {
      accessMock.mockResolvedValue(level);
      await expect(resolveTrainingAccess({ role: "athlete" })).resolves.toEqual({
        allowed: true,
        level,
      });
    },
  );

  it("blocked (canceled / no row / no grant) minor athlete → /athlete/paused", async () => {
    accessMock.mockResolvedValue("blocked");
    await expect(resolveTrainingAccess({ role: "athlete" })).resolves.toEqual({
      allowed: false,
      redirectTo: "/athlete/paused",
    });
  });

  it.each<[CallerRole]>([["adult_athlete"], ["parent"]])(
    "blocked self-payer (%s) → /subscribe",
    async (role) => {
      accessMock.mockResolvedValue("blocked");
      await expect(resolveTrainingAccess({ role })).resolves.toEqual({
        allowed: false,
        redirectTo: "/subscribe",
      });
    },
  );

  it("entitled payer but seat-paused minor athlete → /athlete/paused?reason=seats (FV-585 overlay)", async () => {
    accessMock.mockResolvedValue("full");
    seatMock.mockResolvedValue("paused_not_selected");
    await expect(resolveTrainingAccess({ role: "athlete" })).resolves.toEqual({
      allowed: false,
      redirectTo: "/athlete/paused?reason=seats",
    });
  });

  it("seat overlay never applies to an adult_athlete", async () => {
    accessMock.mockResolvedValue("full");
    seatMock.mockResolvedValue("paused_not_selected");
    await expect(resolveTrainingAccess({ role: "adult_athlete" })).resolves.toEqual({
      allowed: true,
      level: "full",
    });
    expect(seatMock).not.toHaveBeenCalled();
  });

  it("every redirect the decision can produce is on the client allowlist", async () => {
    const produced = new Set<string>();
    for (const [level, seat, role] of [
      ["blocked", "active", "athlete"],
      ["blocked", "active", "adult_athlete"],
      ["blocked", "active", "parent"],
      ["full", "paused_selection_required", "athlete"],
    ] as const) {
      accessMock.mockResolvedValue(level);
      seatMock.mockResolvedValue(seat);
      const d = await resolveTrainingAccess({ role });
      if (!d.allowed) produced.add(d.redirectTo);
    }
    expect(produced.size).toBe(3);
    for (const r of produced) expect(isTrainingBlockedRedirect(r)).toBe(true);
  });
});

describe("requireActiveAccess — unchanged behaviour after the FV-625 refactor", () => {
  it("returns the level when allowed (no redirect)", async () => {
    accessMock.mockResolvedValue("degraded");
    await expect(requireActiveAccess({ role: "athlete" })).resolves.toBe("degraded");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects a blocked minor athlete to /athlete/paused", async () => {
    accessMock.mockResolvedValue("blocked");
    await expect(requireActiveAccess({ role: "athlete" })).rejects.toThrow(
      "NEXT_REDIRECT:/athlete/paused",
    );
  });

  it("redirects a blocked adult_athlete to /subscribe", async () => {
    accessMock.mockResolvedValue("blocked");
    await expect(requireActiveAccess({ role: "adult_athlete" })).rejects.toThrow(
      "NEXT_REDIRECT:/subscribe",
    );
  });

  it("redirects a seat-paused minor athlete to /athlete/paused?reason=seats", async () => {
    accessMock.mockResolvedValue("full");
    seatMock.mockResolvedValue("paused_not_selected");
    await expect(requireActiveAccess({ role: "athlete" })).rejects.toThrow(
      "NEXT_REDIRECT:/athlete/paused?reason=seats",
    );
  });
});

describe("isTrainingBlockedRedirect — client allowlist", () => {
  it.each([
    "/athlete",
    "https://evil.example/athlete/paused",
    "//evil.example",
    "/athlete/paused?reason=other",
    "",
    null,
    undefined,
    42,
  ])("rejects %s", (v) => {
    expect(isTrainingBlockedRedirect(v)).toBe(false);
  });
});

describe("resolveOfflineEntitlementUntil (FV-625 offline bound)", () => {
  it("gating off → null without reading anything (online-only, never unbounded)", async () => {
    process.env.ENFORCE_SUBSCRIPTION_GATING = "false";
    await expect(resolveOfflineEntitlementUntil()).resolves.toBeNull();
    expect(untilMock).not.toHaveBeenCalled();
  });

  it("gating on → the current user's verified period end", async () => {
    untilMock.mockResolvedValue("2026-12-09T12:00:00.000Z");
    await expect(resolveOfflineEntitlementUntil()).resolves.toBe("2026-12-09T12:00:00.000Z");
  });

  it("gating on, no end date → null", async () => {
    untilMock.mockResolvedValue(null);
    await expect(resolveOfflineEntitlementUntil()).resolves.toBeNull();
  });
});

describe("FV-656 — an unreadable status is a block, but not a lapse", () => {
  beforeEach(() => {
    accessMock.mockResolvedValue("blocked"); // fail-closed level on a read error
    entitlementMock.mockResolvedValue({ status: "unknown", provider: null });
  });

  it("minor athlete → /athlete/paused?reason=unavailable, flagged statusUnknown", async () => {
    await expect(resolveTrainingAccess({ role: "athlete" })).resolves.toEqual({
      allowed: false,
      redirectTo: "/athlete/paused?reason=unavailable",
      statusUnknown: true,
    });
    expect(entitlementMock).toHaveBeenCalledWith("payer-1");
  });

  it.each<[CallerRole]>([["adult_athlete"], ["parent"]])(
    "self-payer (%s) → /subscribe (its unknown card), flagged statusUnknown",
    async (role) => {
      await expect(resolveTrainingAccess({ role })).resolves.toEqual({
        allowed: false,
        redirectTo: "/subscribe",
        statusUnknown: true,
      });
    },
  );

  it("is still a block: requireActiveAccess redirects, never returns a level", async () => {
    await expect(requireActiveAccess({ role: "athlete" })).rejects.toThrow(
      "NEXT_REDIRECT:/athlete/paused?reason=unavailable",
    );
  });

  it.each([
    ["stripe", "entitled"],
    ["apple", "entitled"],
    ["comp", "entitled"],
  ] as const)(
    "reads disagree (level blocked, status %s/%s — a transient first read): couldn't verify, never a lapse",
    async (provider, status) => {
      entitlementMock.mockResolvedValue({ status, provider });
      await expect(resolveTrainingAccess({ role: "athlete" })).resolves.toEqual({
        allowed: false,
        redirectTo: "/athlete/paused?reason=unavailable",
        statusUnknown: true,
      });
      await expect(resolveTrainingAccess({ role: "adult_athlete" })).resolves.toEqual({
        allowed: false,
        redirectTo: "/subscribe",
        statusUnknown: true,
      });
    },
  );

  it("only a CONFIRMED not_entitled is a lapse", async () => {
    entitlementMock.mockResolvedValue({ status: "not_entitled", provider: null });
    await expect(resolveTrainingAccess({ role: "athlete" })).resolves.toEqual({
      allowed: false,
      redirectTo: "/athlete/paused",
    });
  });

  it("a throw from the status check counts as unknown (couldn't check), still blocked", async () => {
    entitlementMock.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(resolveTrainingAccess({ role: "athlete" })).resolves.toMatchObject({
      allowed: false,
      statusUnknown: true,
    });
  });

  it("an unresolvable payer (no session / no link) is a confirmed block, not unknown", async () => {
    payerMock.mockResolvedValue(null);
    await expect(resolveTrainingAccess({ role: "athlete" })).resolves.toEqual({
      allowed: false,
      redirectTo: "/athlete/paused",
    });
    expect(entitlementMock).not.toHaveBeenCalled();
  });

  it("an allowed decision never consults the status check (no extra reads on the happy path)", async () => {
    accessMock.mockResolvedValue("full");
    await resolveTrainingAccess({ role: "athlete" });
    expect(payerMock).not.toHaveBeenCalled();
    expect(entitlementMock).not.toHaveBeenCalled();
  });

  it("the unavailable redirect is on the client allowlist", () => {
    expect(isTrainingBlockedRedirect("/athlete/paused?reason=unavailable")).toBe(true);
  });
});
