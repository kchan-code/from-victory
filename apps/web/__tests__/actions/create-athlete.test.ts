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
  syncAthleteQuantity: (...args: unknown[]) => syncAthleteQuantityMock(...args),
}));
const syncAthleteQuantityMock = vi.fn(async (..._args: unknown[]) => {});
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

// FV-586: the D3 trial-conversion guard is out of scope for the
// created_as_adult_by_parent + capacity-gate tests above — default to
// "not_trialing" (a no-op for this guard) so those tests don't need to also
// fake a `subscriptions` row on the service mock below. The dedicated
// "trial-conversion guard" describe block further down overrides
// `trialConversionStateResult` to exercise stripe_trial/unknown branches.
let trialConversionStateResult:
  | { kind: "not_trialing" }
  | { kind: "apple" }
  | { kind: "unknown" }
  | {
      kind: "stripe_trial";
      stripeSubscriptionId: string;
      currentAthleteCount: number;
      trialEndsAt: string | null;
    } = { kind: "not_trialing" };
const getTrialConversionStateMock = vi.fn(async (..._args: unknown[]) => trialConversionStateResult);
vi.mock("@/lib/subscriptions/trial-conversion", () => ({
  getTrialConversionState: (...args: unknown[]) => getTrialConversionStateMock(...args),
}));

// FV-586: Stripe client mock for the trial-conversion Stripe update. Default
// happy-path retrieve/update; the guard's own describe block below
// overrides `stripeSubscriptionsUpdateMock` to simulate a payment failure.
const stripeSubscriptionsRetrieveMock = vi.fn(async (..._args: unknown[]) => ({
  items: { data: [{ id: "si_existing_item" }] },
}));
let stripeSubscriptionsUpdateMock = vi.fn(async (..._args: unknown[]) => ({}));
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    subscriptions: {
      retrieve: (...args: unknown[]) => stripeSubscriptionsRetrieveMock(...args),
      update: (...args: unknown[]) => stripeSubscriptionsUpdateMock(...args),
    },
  }),
}));
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: vi.fn(async () => {}),
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
  fields: {
    first_name?: string;
    birthdate?: string;
    sport?: string;
    trialConversionConfirmed?: string;
  } = {},
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
  trialConversionStateResult = { kind: "not_trialing" };
  getTrialConversionStateMock.mockClear();
  syncAthleteQuantityMock.mockClear();
  stripeSubscriptionsRetrieveMock.mockClear();
  stripeSubscriptionsRetrieveMock.mockResolvedValue({
    items: { data: [{ id: "si_existing_item" }] },
  });
  stripeSubscriptionsUpdateMock = vi.fn(async (..._args: unknown[]) => ({}));
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

// ===========================================================================
// FV-586 — trial-to-family explicit confirmation (KC decision D3)
// ===========================================================================

describe("createAthlete — trial-conversion guard (FV-586, KC decision D3)", () => {
  it("stripe_trial + count>=1 + NOT confirmed -> trial_conversion_required, no createUser, no Stripe call, no sync", async () => {
    trialConversionStateResult = {
      kind: "stripe_trial",
      stripeSubscriptionId: "sub_trial_123",
      currentAthleteCount: 1,
      trialEndsAt: "2026-09-25T00:00:00Z",
    };

    const result = await createAthlete(null, makeFormData());

    expect(result).toEqual({
      ok: false,
      error: "trial_conversion_required",
      code: "trial_conversion_required",
    });
    expect(lastServiceMockInstance?.auth.admin.createUser).not.toHaveBeenCalled();
    expect(stripeSubscriptionsRetrieveMock).not.toHaveBeenCalled();
    expect(stripeSubscriptionsUpdateMock).not.toHaveBeenCalled();
    expect(syncAthleteQuantityMock).not.toHaveBeenCalled();
    expect(profileInsertPayload).toBeNull();
  });

  it("stripe_trial + count>=1 + CONFIRMED -> Stripe update called with exact params BEFORE createUser, then athlete created", async () => {
    trialConversionStateResult = {
      kind: "stripe_trial",
      stripeSubscriptionId: "sub_trial_123",
      currentAthleteCount: 1,
      trialEndsAt: "2026-09-25T00:00:00Z",
    };
    const callOrder: string[] = [];
    stripeSubscriptionsUpdateMock = vi.fn(async (..._args: unknown[]) => {
      callOrder.push("stripe_update");
      return {};
    });
    stripeSubscriptionsRetrieveMock.mockImplementationOnce(async (..._args: unknown[]) => {
      callOrder.push("stripe_retrieve");
      return { items: { data: [{ id: "si_existing_item" }] } };
    });

    await expect(
      createAthlete(null, makeFormData({ trialConversionConfirmed: "true" })),
    ).rejects.toThrow("NEXT_REDIRECT");

    const createUserCalled = Boolean(
      (lastServiceMockInstance?.auth.admin.createUser as ReturnType<typeof vi.fn>)
        ?.mock.calls.length,
    );
    expect(createUserCalled).toBe(true);
    callOrder.push("create_user_returned");

    expect(stripeSubscriptionsRetrieveMock).toHaveBeenCalledWith("sub_trial_123");
    expect(stripeSubscriptionsUpdateMock).toHaveBeenCalledWith("sub_trial_123", {
      trial_end: "now",
      items: [{ id: "si_existing_item", quantity: 2 }],
      payment_behavior: "error_if_incomplete",
    });
    // Stripe conversion happens BEFORE createUser.
    expect(callOrder).toEqual(["stripe_retrieve", "stripe_update", "create_user_returned"]);
    expect(profileInsertPayload).not.toBeNull();
  });

  it("Stripe error (e.g. 402 card_error) on conversion -> trial_conversion_payment_failed, no createUser, no athlete created", async () => {
    trialConversionStateResult = {
      kind: "stripe_trial",
      stripeSubscriptionId: "sub_trial_123",
      currentAthleteCount: 1,
      trialEndsAt: null,
    };
    stripeSubscriptionsUpdateMock = vi.fn(async (..._args: unknown[]) => {
      throw new Error("Your card was declined.");
    });

    const result = await createAthlete(
      null,
      makeFormData({ trialConversionConfirmed: "true" }),
    );

    expect(result).toEqual({
      ok: false,
      error: "trial_conversion_payment_failed",
      code: "trial_conversion_payment_failed",
    });
    expect(lastServiceMockInstance?.auth.admin.createUser).not.toHaveBeenCalled();
    expect(profileInsertPayload).toBeNull();
  });

  it("trial-conversion state 'unknown' (read error) -> refused, fail closed, no createUser", async () => {
    trialConversionStateResult = { kind: "unknown" };

    const result = await createAthlete(null, makeFormData());

    expect(result).toEqual({
      ok: false,
      error: "trial_conversion_required",
      code: "trial_conversion_required",
    });
    expect(lastServiceMockInstance?.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("not_trialing -> unchanged path, no Stripe call, athlete created normally", async () => {
    trialConversionStateResult = { kind: "not_trialing" };

    await expect(createAthlete(null, makeFormData())).rejects.toThrow("NEXT_REDIRECT");

    expect(stripeSubscriptionsRetrieveMock).not.toHaveBeenCalled();
    expect(stripeSubscriptionsUpdateMock).not.toHaveBeenCalled();
    expect(profileInsertPayload).not.toBeNull();
  });

  it("apple -> unchanged path (informational only), no Stripe call, athlete created normally", async () => {
    trialConversionStateResult = { kind: "apple" };

    await expect(createAthlete(null, makeFormData())).rejects.toThrow("NEXT_REDIRECT");

    expect(stripeSubscriptionsRetrieveMock).not.toHaveBeenCalled();
    expect(stripeSubscriptionsUpdateMock).not.toHaveBeenCalled();
    expect(profileInsertPayload).not.toBeNull();
  });

  it("stripe_trial + count 0 (the FIRST athlete) -> no conversion needed, athlete created normally, no Stripe call", async () => {
    trialConversionStateResult = {
      kind: "stripe_trial",
      stripeSubscriptionId: "sub_trial_123",
      currentAthleteCount: 0,
      trialEndsAt: "2026-09-25T00:00:00Z",
    };

    await expect(createAthlete(null, makeFormData())).rejects.toThrow("NEXT_REDIRECT");

    expect(stripeSubscriptionsRetrieveMock).not.toHaveBeenCalled();
    expect(stripeSubscriptionsUpdateMock).not.toHaveBeenCalled();
    expect(profileInsertPayload).not.toBeNull();
  });
});
