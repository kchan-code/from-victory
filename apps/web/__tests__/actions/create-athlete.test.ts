/**
 * Unit tests for createAthlete (apps/web/lib/actions/athletes.ts).
 *
 * FV-448 (13-25 expansion arc, D5 turn-18 deferral mitigation): a parent may
 * now create an athlete profile for someone already 18+ (the arc removes the
 * upper age bound on parent-created athletes — 13+, no max). That still
 * inserts as `role: "athlete"` (no behavior/UI change), but the row must be
 * marked `created_as_adult_by_parent: true` so a future turn-18 consent/
 * takeover flow (FV-450) has a population to act on. A parent-created minor
 * (13-17) must NOT be marked.
 *
 * Mocking strategy mirrors account-settings.test.ts / create-athlete-direct.
 * test.ts: vi.mock() hoists before imports; requireParent is mocked directly
 * (not the full server client) since createAthlete only calls it for the
 * parent id; createServiceClient is a flexible mock that captures the
 * profiles insert payload for assertions. redirect() is mocked to throw
 * (matches Next.js's real behavior) since the happy path calls
 * redirect("/dashboard") after a successful insert.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (declared before any import of the module under test)
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireParent: async () => ({ userId: "parent-uuid-123" }),
}));

vi.mock("@/lib/stripe/sync-athlete-quantity", () => ({
  syncAthleteQuantity: vi.fn(async () => {}),
}));
vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: vi.fn(() => {}),
}));

// FV-570: the capacity gate is out of scope for the
// created_as_adult_by_parent tests below — default to always-inert (mirrors
// syncAthleteQuantity's no-op treatment above) so this file doesn't need to
// also fake apple_subscriptions query shapes on the service mock below. The
// dedicated "capacity gate" describe block at the bottom of this file
// overrides `assertAthleteCapacityResult` to exercise the blocked branch.
let assertAthleteCapacityResult:
  | { allowed: true }
  | { allowed: false; reason: "capacity_reached" } = { allowed: true };
vi.mock("@/lib/subscriptions/apple-capacity", () => ({
  assertAthleteCapacity: vi.fn(async () => assertAthleteCapacityResult),
}));

// ---------------------------------------------------------------------------
// Flexible service-client mock — captures the profiles insert payload.
// ---------------------------------------------------------------------------

let profileInsertPayload: Record<string, unknown> | null = null;
let profileInsertError: { message: string } | null = null;
let linkInsertError: { message: string } | null = null;

function makeServiceMock() {
  return {
    auth: {
      admin: {
        createUser: vi.fn(async (payload: Record<string, unknown>) => ({
          data: { user: { id: "new-athlete-uuid-001", email: payload.email as string } },
          error: null,
        })),
        deleteUser: vi.fn(async () => ({ error: null })),
      },
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          insert: async (payload: Record<string, unknown>) => {
            profileInsertPayload = payload;
            return { error: profileInsertError };
          },
          delete: () => ({
            eq: () => ({ error: null }),
          }),
        };
      }
      if (table === "parent_athlete_links") {
        return {
          insert: async () => ({ error: linkInsertError }),
          // FV-570: the count read (currentAthleteCount, before the
          // capacity gate) uses .select(..., { count, head }).eq(...).
          select: () => ({
            eq: async () => ({ count: 0, error: null }),
          }),
        };
      }
      return {
        insert: async () => ({ error: null }),
        delete: () => ({ eq: () => ({ error: null }) }),
      };
    },
  };
}

// FV-570: expose the last-created service mock instance so tests can assert
// directly on its auth.admin.createUser call count (the capacity-gate test
// below needs to prove createUser was never reached, not just infer it).
let lastServiceMockInstance: ReturnType<typeof makeServiceMock> | null = null;
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => {
    lastServiceMockInstance = makeServiceMock();
    return lastServiceMockInstance;
  },
}));

// ---------------------------------------------------------------------------
// Import module under test AFTER mocks are registered.
// ---------------------------------------------------------------------------

import { createAthlete } from "@/lib/actions/athletes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormData(
  fields: { first_name?: string; birthdate?: string; sport?: string } = {},
) {
  const defaults = {
    first_name: "Jordan",
    birthdate: "2010-01-01",
  };
  const merged = { ...defaults, ...fields };
  return {
    get: (key: string) => merged[key as keyof typeof merged] ?? null,
  } as unknown as FormData;
}

beforeEach(() => {
  profileInsertPayload = null;
  profileInsertError = null;
  linkInsertError = null;
  assertAthleteCapacityResult = { allowed: true };
});

// ===========================================================================
// FV-448 — created_as_adult_by_parent
// ===========================================================================

describe("createAthlete — created_as_adult_by_parent (FV-448)", () => {
  it("sets created_as_adult_by_parent: false for a 17-year-old", async () => {
    const year = new Date().getFullYear() - 17;
    const birthdate = `${year}-01-01`;

    await expect(
      createAthlete(null, makeFormData({ birthdate })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(profileInsertPayload?.role).toBe("athlete");
    expect(profileInsertPayload?.created_as_adult_by_parent).toBe(false);
  });

  it("sets created_as_adult_by_parent: true for an athlete who is already 18", async () => {
    const year = new Date().getFullYear() - 18;
    const birthdate = `${year}-01-01`;

    await expect(
      createAthlete(null, makeFormData({ birthdate })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(profileInsertPayload?.role).toBe("athlete");
    expect(profileInsertPayload?.created_as_adult_by_parent).toBe(true);
  });

  it("sets created_as_adult_by_parent: true for an athlete well past 18 (e.g. 21)", async () => {
    const year = new Date().getFullYear() - 21;
    const birthdate = `${year}-01-01`;

    await expect(
      createAthlete(null, makeFormData({ birthdate })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(profileInsertPayload?.created_as_adult_by_parent).toBe(true);
  });

  it("sets created_as_adult_by_parent: false for the 13+ floor (13-year-old)", async () => {
    const year = new Date().getFullYear() - 13;
    const birthdate = `${year}-01-01`;

    await expect(
      createAthlete(null, makeFormData({ birthdate })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(profileInsertPayload?.created_as_adult_by_parent).toBe(false);
  });
});

// ===========================================================================
// FV-570 — capacity gate blocks the add (qa-reviewer should-fix #2)
// ===========================================================================

describe("createAthlete — Apple-tier capacity gate (FV-570)", () => {
  it("returns { ok:false, error:'capacity_reached', code:'capacity_reached' } when the gate blocks", async () => {
    assertAthleteCapacityResult = {
      allowed: false,
      reason: "capacity_reached",
    };

    const result = await createAthlete(null, makeFormData());

    expect(result).toEqual({
      ok: false,
      error: "capacity_reached",
      code: "capacity_reached",
    });
  });

  it("never calls auth.admin.createUser when the capacity gate blocks the add", async () => {
    assertAthleteCapacityResult = {
      allowed: false,
      reason: "capacity_reached",
    };

    await createAthlete(null, makeFormData());

    expect(lastServiceMockInstance?.auth.admin.createUser).not.toHaveBeenCalled();
    // No auth user means no profile insert either — confirms nothing was
    // created downstream of the blocked gate.
    expect(profileInsertPayload).toBeNull();
  });
});
