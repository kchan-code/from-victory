/**
 * Unit tests for `syncAthleteQuantity` (FV-283).
 *
 * Verifies the non-blocking quantity-sync helper:
 *   (a) Updates Stripe quantity on create/delete (quantity = athlete count).
 *   (b) Floors quantity at 1 when athlete count is 0.
 *   (c) No-ops (without throwing) when no active subscription row exists.
 *   (d) Stripe error → notifyError called, function resolves (does not throw).
 *   (e) No-ops when STRIPE_SECRET_KEY is absent.
 *   (f) No-ops when subscription status is not active/trialing.
 *
 * Mocks:
 *   - server-only                     → no-op
 *   - @/lib/supabase/service          → chainable stub
 *   - @/lib/stripe/server             → controlled Stripe stub
 *   - @/lib/monitoring/deliver        → no-op
 *   - @/lib/monitoring/notify         → captured spy
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — declared before importing the module under test
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: () => undefined,
}));

// Use vi.hoisted() so the mock reference is safe inside the vi.mock factory.
const { notifyErrorMock } = vi.hoisted(() => ({
  notifyErrorMock: vi.fn(async () => undefined),
}));

vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: notifyErrorMock,
}));

// Mutable Stripe stubs — replaced per test.
const subscriptionsRetrieveMock = vi.fn();
const subscriptionItemsUpdateMock = vi.fn();

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    subscriptions: {
      retrieve: subscriptionsRetrieveMock,
    },
    subscriptionItems: {
      update: subscriptionItemsUpdateMock,
    },
  }),
}));

// Mutable Supabase service-client stub.
let supabaseMockImpl: ReturnType<typeof makeServiceMock>;
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => supabaseMockImpl,
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import { syncAthleteQuantity } from "@/lib/stripe/sync-athlete-quantity";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SubRow = {
  stripe_subscription_id: string | null;
  status: string;
} | null;

type CountResult = { count: number | null; error: null } | { count: null; error: { message: string } };

/**
 * Builds a minimal chainable Supabase service-client stub.
 *
 * @param subRow    - Row returned by subscriptions.maybeSingle()
 * @param count     - Athlete count (or an error object)
 * @param stripeSubItems - Stripe subscription items to return from retrieve()
 */
function makeServiceMock(subRow: SubRow, countResult: CountResult) {
  // Two separate chain objects — one for the subscriptions query,
  // one for the parent_athlete_links count query. We distinguish by
  // which table name is passed to .from().
  const subChain = {
    select: () => subChain,
    eq: () => subChain,
    maybeSingle: async () => ({ data: subRow, error: null }),
  };

  const countChain = {
    select: () => countChain,
    eq: () => countChain,
    // head: true uses this — return count in the shape Supabase produces
    then: undefined as unknown,
  };
  // Override to return our count fixture.
  // The actual call is .select("athlete_id", { count: "exact", head: true })
  // which returns { count, error }. We simulate that here.
  const countChainFinal = {
    select: () => countChainFinal,
    eq: () => countChainFinalResult,
  };
  const countChainFinalResult = {
    ...countResult,
  };
  // Patch: make eq return an object that looks like a resolved query
  // (Supabase count queries resolve via the promise chain, not maybeSingle).
  const countChainFinalResultPromise = Promise.resolve(countResult);

  return {
    from: (table: string) => {
      if (table === "subscriptions") return subChain;
      // parent_athlete_links count
      return {
        select: () => ({
          eq: () => countChainFinalResultPromise,
        }),
      };
    },
  };
}

/** Makes a minimal Stripe subscription with one item. */
function makeStripeSub(itemId = "si_test_item") {
  return {
    id: "sub_test123",
    items: {
      data: [{ id: itemId }],
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("syncAthleteQuantity (FV-283)", () => {
  const PARENT_ID = "parent-uuid-fv283";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";

    // Default Stripe happy-path stubs.
    subscriptionsRetrieveMock.mockResolvedValue(makeStripeSub());
    subscriptionItemsUpdateMock.mockResolvedValue({});
  });

  // -------------------------------------------------------------------------
  // (a) Updates quantity on create (3 athletes → quantity 3)
  // -------------------------------------------------------------------------
  it("(a) updates Stripe quantity to the linked-athlete count (3 athletes → quantity 3)", async () => {
    supabaseMockImpl = makeServiceMock(
      { stripe_subscription_id: "sub_abc", status: "active" },
      { count: 3, error: null },
    );

    await syncAthleteQuantity(PARENT_ID);

    expect(subscriptionsRetrieveMock).toHaveBeenCalledWith("sub_abc");
    expect(subscriptionItemsUpdateMock).toHaveBeenCalledWith("si_test_item", {
      quantity: 3,
    });
  });

  it("(a) updates Stripe quantity to the linked-athlete count (1 athlete → quantity 1)", async () => {
    supabaseMockImpl = makeServiceMock(
      { stripe_subscription_id: "sub_abc", status: "active" },
      { count: 1, error: null },
    );

    await syncAthleteQuantity(PARENT_ID);

    expect(subscriptionItemsUpdateMock).toHaveBeenCalledWith("si_test_item", {
      quantity: 1,
    });
  });

  // -------------------------------------------------------------------------
  // (b) Floors quantity at 1 when count is 0
  // -------------------------------------------------------------------------
  it("(b) floors quantity at 1 when athlete count is 0", async () => {
    supabaseMockImpl = makeServiceMock(
      { stripe_subscription_id: "sub_floor", status: "active" },
      { count: 0, error: null },
    );

    await syncAthleteQuantity(PARENT_ID);

    expect(subscriptionItemsUpdateMock).toHaveBeenCalledWith("si_test_item", {
      quantity: 1,
    });
  });

  // -------------------------------------------------------------------------
  // (c) No-ops when no subscription row exists
  // -------------------------------------------------------------------------
  it("(c) no-ops (does not call Stripe) when no subscription row exists", async () => {
    supabaseMockImpl = makeServiceMock(null, { count: 2, error: null });

    await syncAthleteQuantity(PARENT_ID);

    expect(subscriptionsRetrieveMock).not.toHaveBeenCalled();
    expect(subscriptionItemsUpdateMock).not.toHaveBeenCalled();
    expect(notifyErrorMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // (f) No-ops when status is not active/trialing
  // -------------------------------------------------------------------------
  it("(f) no-ops when subscription status is 'canceled'", async () => {
    supabaseMockImpl = makeServiceMock(
      { stripe_subscription_id: "sub_canceled", status: "canceled" },
      { count: 2, error: null },
    );

    await syncAthleteQuantity(PARENT_ID);

    expect(subscriptionsRetrieveMock).not.toHaveBeenCalled();
    expect(subscriptionItemsUpdateMock).not.toHaveBeenCalled();
  });

  it("(f) no-ops when subscription status is 'past_due'", async () => {
    supabaseMockImpl = makeServiceMock(
      { stripe_subscription_id: "sub_pd", status: "past_due" },
      { count: 1, error: null },
    );

    await syncAthleteQuantity(PARENT_ID);

    expect(subscriptionItemsUpdateMock).not.toHaveBeenCalled();
  });

  it("(f) syncs when status is 'trialing'", async () => {
    supabaseMockImpl = makeServiceMock(
      { stripe_subscription_id: "sub_trial", status: "trialing" },
      { count: 2, error: null },
    );

    await syncAthleteQuantity(PARENT_ID);

    expect(subscriptionItemsUpdateMock).toHaveBeenCalledWith("si_test_item", {
      quantity: 2,
    });
  });

  // -------------------------------------------------------------------------
  // (d) Stripe error → alert called, function resolves without throwing
  // -------------------------------------------------------------------------
  it("(d) calls notifyError and resolves (does not throw) when subscriptionItems.update fails", async () => {
    supabaseMockImpl = makeServiceMock(
      { stripe_subscription_id: "sub_err", status: "active" },
      { count: 2, error: null },
    );
    subscriptionItemsUpdateMock.mockRejectedValue(
      new Error("Stripe update failed"),
    );

    // Must not throw.
    await expect(syncAthleteQuantity(PARENT_ID)).resolves.toBeUndefined();

    expect(notifyErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("syncAthleteQuantity subscriptionItems.update"),
      expect.stringContaining("Stripe update failed"),
      expect.objectContaining({ parent_id: PARENT_ID }),
    );
  });

  it("(d) calls notifyError and resolves (does not throw) when subscriptions.retrieve fails", async () => {
    supabaseMockImpl = makeServiceMock(
      { stripe_subscription_id: "sub_bad", status: "active" },
      { count: 2, error: null },
    );
    subscriptionsRetrieveMock.mockRejectedValue(new Error("retrieve failed"));

    await expect(syncAthleteQuantity(PARENT_ID)).resolves.toBeUndefined();

    expect(notifyErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("subscriptions.retrieve failed"),
      expect.stringContaining("retrieve failed"),
      expect.anything(),
    );
    expect(subscriptionItemsUpdateMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // (e) No-ops when STRIPE_SECRET_KEY is absent
  // -------------------------------------------------------------------------
  it("(e) no-ops when STRIPE_SECRET_KEY is not set", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    supabaseMockImpl = makeServiceMock(
      { stripe_subscription_id: "sub_nokey", status: "active" },
      { count: 2, error: null },
    );

    await expect(syncAthleteQuantity(PARENT_ID)).resolves.toBeUndefined();

    expect(subscriptionItemsUpdateMock).not.toHaveBeenCalled();

    // Restore for subsequent tests.
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
  });

  // -------------------------------------------------------------------------
  // No-ops when stripe_subscription_id is null (checkout fired, sub event pending)
  // -------------------------------------------------------------------------
  it("no-ops when stripe_subscription_id is null", async () => {
    supabaseMockImpl = makeServiceMock(
      { stripe_subscription_id: null, status: "active" },
      { count: 2, error: null },
    );

    await syncAthleteQuantity(PARENT_ID);

    expect(subscriptionsRetrieveMock).not.toHaveBeenCalled();
    expect(subscriptionItemsUpdateMock).not.toHaveBeenCalled();
  });
});
