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

const { accessMock, seatMock, redirectMock } = vi.hoisted(() => ({
  accessMock: vi.fn(),
  seatMock: vi.fn(),
  redirectMock: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`);
  }),
}));

vi.mock("@/lib/subscriptions/access", () => ({
  getAccessForCurrentUser: accessMock,
}));
vi.mock("@/lib/subscriptions/seat-state", () => ({
  getAthleteSeatStatusForCurrentUser: seatMock,
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import {
  requireActiveAccess,
  resolveTrainingAccess,
  type CallerRole,
} from "@/lib/subscriptions/enforce";
import { isTrainingBlockedRedirect } from "@/lib/subscriptions/training-redirects";

const ORIGINAL_FLAG = process.env.ENFORCE_SUBSCRIPTION_GATING;

beforeEach(() => {
  process.env.ENFORCE_SUBSCRIPTION_GATING = "true";
  seatMock.mockResolvedValue("active");
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
