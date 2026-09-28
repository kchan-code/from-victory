/**
 * Unit tests for `apps/web/lib/subscriptions/seat-state.ts` (FV-585, KC
 * decision D2).
 *
 * Covers:
 *   - `deriveSeatState` — the pure derivation table (uncapped, within
 *     capacity, over-capacity-no-selection, valid selection, over-selected,
 *     zero-selected).
 *   - `getPayerSeatState` — the service-role read: capacity resolution via
 *     the Apple accessors (mocked), links read, fail-OPEN on read error.
 *   - `getAthleteSeatStatusForCurrentUser` — the narrow athlete-facing enum,
 *     fail-open on no session / no link.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const getActiveAppleProductIdMock = vi.fn();
vi.mock("@/lib/subscriptions/apple", () => ({
  getActiveAppleProductId: (...args: unknown[]) =>
    getActiveAppleProductIdMock(...args),
}));

const payerCapacityCeilingMock = vi.fn();
vi.mock("@/lib/subscriptions/apple-capacity", () => ({
  payerCapacityCeiling: (...args: unknown[]) =>
    payerCapacityCeilingMock(...args),
}));

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => getUserMock() },
  }),
}));

import {
  deriveSeatState,
  getPayerSeatState,
  getAthleteSeatStatusForCurrentUser,
} from "@/lib/subscriptions/seat-state";

const PARENT_ID = "eeeeeeee-0000-4000-8000-000000000005";
const ATHLETE_A = "aaaaaaaa-0000-4000-8000-000000000001";
const ATHLETE_B = "aaaaaaaa-0000-4000-8000-000000000002";
const ATHLETE_C = "aaaaaaaa-0000-4000-8000-000000000003";

beforeEach(() => {
  getActiveAppleProductIdMock.mockReset();
  payerCapacityCeilingMock.mockReset();
  getUserMock.mockReset();
});

// ---------------------------------------------------------------------------
// deriveSeatState — pure derivation table
// ---------------------------------------------------------------------------

describe("deriveSeatState", () => {
  it("capacity null (uncapped provider) -> everyone active regardless of flags", () => {
    const result = deriveSeatState({
      capacity: null,
      links: [
        { athleteId: ATHLETE_A, seatActive: false },
        { athleteId: ATHLETE_B, seatActive: false },
      ],
    });
    expect(result).toEqual({
      status: "uncapped",
      capacity: null,
      athleteCount: 2,
      activeAthleteIds: [ATHLETE_A, ATHLETE_B],
      pausedAthleteIds: [],
    });
  });

  it("athleteCount <= capacity -> within_capacity, everyone active, flags ignored", () => {
    const result = deriveSeatState({
      capacity: 3,
      links: [
        { athleteId: ATHLETE_A, seatActive: false },
        { athleteId: ATHLETE_B, seatActive: true },
      ],
    });
    expect(result).toEqual({
      status: "within_capacity",
      capacity: 3,
      athleteCount: 2,
      activeAthleteIds: [ATHLETE_A, ATHLETE_B],
      pausedAthleteIds: [],
    });
  });

  it("over capacity, no selection made (all seat_active default true) -> selection_required, ALL paused", () => {
    const result = deriveSeatState({
      capacity: 1,
      links: [
        { athleteId: ATHLETE_A, seatActive: true },
        { athleteId: ATHLETE_B, seatActive: true },
      ],
    });
    expect(result).toEqual({
      status: "selection_required",
      capacity: 1,
      athleteCount: 2,
      activeAthleteIds: [],
      pausedAthleteIds: [ATHLETE_A, ATHLETE_B],
    });
  });

  it("over capacity, over-selected (more true flags than capacity) -> selection_required, ALL paused", () => {
    const result = deriveSeatState({
      capacity: 1,
      links: [
        { athleteId: ATHLETE_A, seatActive: true },
        { athleteId: ATHLETE_B, seatActive: true },
        { athleteId: ATHLETE_C, seatActive: false },
      ],
    });
    expect(result.status).toBe("selection_required");
    expect(result.activeAthleteIds).toEqual([]);
    expect(result.pausedAthleteIds).toEqual([ATHLETE_A, ATHLETE_B, ATHLETE_C]);
  });

  it("over capacity, a valid selection made -> selected, chosen active, rest paused", () => {
    const result = deriveSeatState({
      capacity: 1,
      links: [
        { athleteId: ATHLETE_A, seatActive: true },
        { athleteId: ATHLETE_B, seatActive: false },
        { athleteId: ATHLETE_C, seatActive: false },
      ],
    });
    expect(result).toEqual({
      status: "selected",
      capacity: 1,
      athleteCount: 3,
      activeAthleteIds: [ATHLETE_A],
      pausedAthleteIds: [ATHLETE_B, ATHLETE_C],
    });
  });

  it("over capacity, ZERO selected -> selected, everyone paused (deliberate parent choice, not treated as selection_required)", () => {
    const result = deriveSeatState({
      capacity: 1,
      links: [
        { athleteId: ATHLETE_A, seatActive: false },
        { athleteId: ATHLETE_B, seatActive: false },
      ],
    });
    expect(result).toEqual({
      status: "selected",
      capacity: 1,
      athleteCount: 2,
      activeAthleteIds: [],
      pausedAthleteIds: [ATHLETE_A, ATHLETE_B],
    });
  });
});

// ---------------------------------------------------------------------------
// getPayerSeatState — service-role read
// ---------------------------------------------------------------------------

function makeService(linksResult: { data: unknown; error: { message: string } | null }) {
  return {
    from: (table: string) => {
      if (table !== "parent_athlete_links") {
        throw new Error(`unexpected table in test double: ${table}`);
      }
      return {
        select: () => ({
          eq: () => Promise.resolve(linksResult),
        }),
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: minimal test double, not a real SupabaseClient
  } as any;
}

describe("getPayerSeatState", () => {
  it("resolves uncapped when the payer has no active Apple product", async () => {
    getActiveAppleProductIdMock.mockResolvedValue(null);
    const service = makeService({
      data: [{ athlete_id: ATHLETE_A, seat_active: true }],
      error: null,
    });

    const result = await getPayerSeatState(service, PARENT_ID);

    expect(payerCapacityCeilingMock).not.toHaveBeenCalled();
    expect(result.status).toBe("uncapped");
    expect(result.readError).toBeUndefined();
  });

  it("folds a numeric Apple ceiling through deriveSeatState", async () => {
    getActiveAppleProductIdMock.mockResolvedValue("apple.tier.two");
    payerCapacityCeilingMock.mockReturnValue(2);
    const service = makeService({
      data: [
        { athlete_id: ATHLETE_A, seat_active: true },
        { athlete_id: ATHLETE_B, seat_active: true },
        { athlete_id: ATHLETE_C, seat_active: true },
      ],
      error: null,
    });

    const result = await getPayerSeatState(service, PARENT_ID);

    expect(result.status).toBe("selection_required");
    expect(result.capacity).toBe(2);
    expect(result.pausedAthleteIds).toEqual([ATHLETE_A, ATHLETE_B, ATHLETE_C]);
  });

  it("fails OPEN (uncapped, readError=true) when the links read errors — never locks an athlete out on a transient failure", async () => {
    getActiveAppleProductIdMock.mockResolvedValue("apple.tier.two");
    payerCapacityCeilingMock.mockReturnValue(2);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const service = makeService({
      data: null,
      error: { message: "connection reset" },
    });

    const result = await getPayerSeatState(service, PARENT_ID);

    expect(result.status).toBe("uncapped");
    expect(result.readError).toBe(true);
    expect(result.activeAthleteIds).toEqual([]);
    expect(result.pausedAthleteIds).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("adult_athlete payer (no active Apple product, no links) resolves uncapped, never paused", async () => {
    getActiveAppleProductIdMock.mockResolvedValue(null);
    const service = makeService({ data: [], error: null });

    const result = await getPayerSeatState(service, PARENT_ID);

    expect(result.status).toBe("uncapped");
    expect(result.athleteCount).toBe(0);
    expect(result.pausedAthleteIds).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getAthleteSeatStatusForCurrentUser
// ---------------------------------------------------------------------------

describe("getAthleteSeatStatusForCurrentUser", () => {
  it("returns 'active' when there is no signed-in user (fail open)", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const status = await getAthleteSeatStatusForCurrentUser();
    expect(status).toBe("active");
  });
});
