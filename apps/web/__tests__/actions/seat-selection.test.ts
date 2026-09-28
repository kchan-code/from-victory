/**
 * Unit tests for `setActiveSeats` (apps/web/lib/actions/seat-selection.ts,
 * FV-585, KC decision D2).
 *
 * Mocking strategy mirrors create-athlete.test.ts: `requireParent` is mocked
 * directly (role enforcement itself is guards.test.ts's job — this file
 * tests that setActiveSeats calls through requireParent and never proceeds
 * past a rejection), `getPayerSeatState` is mocked so capacity recomputation
 * is fully controllable per test, and the service client is a small
 * hand-rolled double that records every write so tests can assert:
 *   - unlinked ids are refused before any write
 *   - a null capacity refuses with `selection_not_needed`
 *   - an over-sized selection refuses with `over_capacity`
 *   - a valid selection writes ONLY the caller's own linked rows
 *   - `.delete` is never reachable on the table double — proves this action
 *     cannot delete a row even by accident.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const revalidatePathMock = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}));

const requireParentMock = vi.fn();
vi.mock("@/lib/auth/guards", () => ({
  requireParent: () => requireParentMock(),
}));

const getPayerSeatStateMock = vi.fn();
vi.mock("@/lib/subscriptions/seat-state", () => ({
  getPayerSeatState: (...args: unknown[]) => getPayerSeatStateMock(...args),
}));

// ---------------------------------------------------------------------------
// Service-client double
// ---------------------------------------------------------------------------

const PARENT_ID = "eeeeeeee-0000-4000-8000-000000000005";
const ATHLETE_A = "aaaaaaaa-0000-4000-8000-000000000001";
const ATHLETE_B = "aaaaaaaa-0000-4000-8000-000000000002";
const ATHLETE_STRANGER = "aaaaaaaa-0000-4000-8000-0000000000ff";

type LinkRow = { athlete_id: string; seat_active: boolean };
let linkRows: LinkRow[];
let linksError: { message: string } | null;
let updateError: { message: string } | null;
let updateCalls: Array<{ seatActive: boolean; parentId: string; ids: string[] }>;
let deleteCalled: boolean;

function resetService() {
  linkRows = [
    { athlete_id: ATHLETE_A, seat_active: true },
    { athlete_id: ATHLETE_B, seat_active: true },
  ];
  linksError = null;
  updateError = null;
  updateCalls = [];
  deleteCalled = false;
}

function makeService() {
  return {
    from: (table: string) => {
      if (table !== "parent_athlete_links") {
        throw new Error(`unexpected table in test double: ${table}`);
      }
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: linkRows, error: linksError }),
        }),
        update: (payload: { seat_active: boolean }) => ({
          eq: (_col: string, parentId: string) => ({
            in: (_idCol: string, ids: string[]) => {
              updateCalls.push({ seatActive: payload.seat_active, parentId, ids });
              return Promise.resolve({ error: updateError });
            },
          }),
        }),
        delete: () => {
          deleteCalled = true;
          throw new Error("setActiveSeats must never call .delete()");
        },
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: minimal test double, not a real SupabaseClient
  } as any;
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => makeService(),
}));

import { setActiveSeats } from "@/lib/actions/seat-selection";

beforeEach(() => {
  resetService();
  requireParentMock.mockReset();
  requireParentMock.mockResolvedValue({ userId: PARENT_ID });
  getPayerSeatStateMock.mockReset();
  revalidatePathMock.mockClear();
});

describe("setActiveSeats", () => {
  it("refuses input that isn't an array of UUIDs (invalid_input) before touching requireParent", async () => {
    const result = await setActiveSeats(["not-a-uuid"]);
    expect(result).toEqual({ ok: false, code: "invalid_input" });
    expect(requireParentMock).not.toHaveBeenCalled();
  });

  it("propagates a non-parent's rejection (requireParent throws/redirects) without writing anything", async () => {
    requireParentMock.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(setActiveSeats([ATHLETE_A])).rejects.toThrow("NEXT_REDIRECT");

    expect(updateCalls).toHaveLength(0);
  });

  it("refuses an athlete id not linked to the calling parent (unlinked_athlete)", async () => {
    const result = await setActiveSeats([ATHLETE_A, ATHLETE_STRANGER]);
    expect(result).toEqual({ ok: false, code: "unlinked_athlete" });
    expect(updateCalls).toHaveLength(0);
    expect(getPayerSeatStateMock).not.toHaveBeenCalled();
  });

  it("refuses when the payer isn't currently over capacity (selection_not_needed)", async () => {
    getPayerSeatStateMock.mockResolvedValue({
      status: "uncapped",
      capacity: null,
      athleteCount: 2,
      activeAthleteIds: [ATHLETE_A, ATHLETE_B],
      pausedAthleteIds: [],
    });

    const result = await setActiveSeats([ATHLETE_A]);

    expect(result).toEqual({ ok: false, code: "selection_not_needed" });
    expect(updateCalls).toHaveLength(0);
  });

  it("refuses when capacity is a number but the family is within it (selection_not_needed) — direct/replayed call must not write flags", async () => {
    getPayerSeatStateMock.mockResolvedValue({
      status: "within_capacity",
      capacity: 3,
      athleteCount: 2,
      activeAthleteIds: [ATHLETE_A, ATHLETE_B],
      pausedAthleteIds: [],
    });

    const result = await setActiveSeats([ATHLETE_A]);

    expect(result).toEqual({ ok: false, code: "selection_not_needed" });
    expect(updateCalls).toHaveLength(0);
  });

  it("refuses an over-sized selection (over_capacity) without truncating it silently", async () => {
    getPayerSeatStateMock.mockResolvedValue({
      status: "selection_required",
      capacity: 1,
      athleteCount: 2,
      activeAthleteIds: [],
      pausedAthleteIds: [ATHLETE_A, ATHLETE_B],
    });

    const result = await setActiveSeats([ATHLETE_A, ATHLETE_B]);

    expect(result).toEqual({ ok: false, code: "over_capacity" });
    expect(updateCalls).toHaveLength(0);
  });

  it("happy path: activates the chosen id, deactivates the rest, scoped to the caller's own parent_id, and revalidates the dashboard", async () => {
    getPayerSeatStateMock
      .mockResolvedValueOnce({
        status: "selection_required",
        capacity: 1,
        athleteCount: 2,
        activeAthleteIds: [],
        pausedAthleteIds: [ATHLETE_A, ATHLETE_B],
      })
      .mockResolvedValueOnce({
        status: "selected",
        capacity: 1,
        athleteCount: 2,
        activeAthleteIds: [ATHLETE_A],
        pausedAthleteIds: [ATHLETE_B],
      });

    const result = await setActiveSeats([ATHLETE_A]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.activeAthleteIds).toEqual([ATHLETE_A]);
    }
    expect(updateCalls).toEqual([
      { seatActive: true, parentId: PARENT_ID, ids: [ATHLETE_A] },
      { seatActive: false, parentId: PARENT_ID, ids: [ATHLETE_B] },
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(deleteCalled).toBe(false);
  });

  it("allows a deliberate zero-selection (deactivates every owned link, activates none)", async () => {
    getPayerSeatStateMock
      .mockResolvedValueOnce({
        status: "selection_required",
        capacity: 1,
        athleteCount: 2,
        activeAthleteIds: [],
        pausedAthleteIds: [ATHLETE_A, ATHLETE_B],
      })
      .mockResolvedValueOnce({
        status: "selected",
        capacity: 1,
        athleteCount: 2,
        activeAthleteIds: [],
        pausedAthleteIds: [ATHLETE_A, ATHLETE_B],
      });

    const result = await setActiveSeats([]);

    expect(result.ok).toBe(true);
    expect(updateCalls).toEqual([
      { seatActive: false, parentId: PARENT_ID, ids: [ATHLETE_A, ATHLETE_B] },
    ]);
    expect(deleteCalled).toBe(false);
  });

  it("returns write_failed and never calls .delete when the links read itself errors", async () => {
    linksError = { message: "connection reset" };
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await setActiveSeats([ATHLETE_A]);

    expect(result).toEqual({ ok: false, code: "write_failed" });
    expect(deleteCalled).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });
});
