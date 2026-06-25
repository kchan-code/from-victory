/**
 * Unit tests for `createCheckoutSession` (FV-217).
 *
 * Verifies the 14-day free trial logic:
 *   (a) No subscriptions row → session includes trial_period_days:14 +
 *       payment_method_collection:"always".
 *   (b) Row exists with status "canceled" → NO trial fields.
 *   (c) Row exists with status "active"   → NO trial fields + existing
 *       behavior preserved (customer reuse, redirect).
 *
 * Also confirms existing behavior: customer reuse, redirect on success,
 * plan env-var resolution, and Stripe-API-error handling.
 *
 * Mocks:
 *   - server-only              → no-op (Next.js guard not in vitest/node)
 *   - next/navigation          → captures redirect() without throwing
 *   - @/lib/auth/guards        → requireParent() returns fixed parent UUID
 *   - @/lib/stripe/server      → controlled sessions.create stub
 *   - @/lib/supabase/server    → chainable Supabase client stub
 *   - @/lib/monitoring/deliver → no-op
 *   - @/lib/monitoring/notify  → no-op
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — must be declared before importing the module under test
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirectMock(url);
  },
}));

vi.mock("@/lib/auth/guards", () => ({
  requireParent: async () => ({ userId: "parent-uuid-test" }),
  requireSelfPayer: async () => ({ userId: "adult-uuid-test" }),
}));

vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: () => undefined,
}));
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: async () => undefined,
}));

// Mutable Stripe sessions.create stub — replaced per test.
const sessionsCreateMock = vi.fn();
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: sessionsCreateMock,
      },
    },
  }),
}));

// Mutable Supabase server-client stub — replaced per test via makeSubMock().
let supabaseMockImpl: ReturnType<typeof makeSubMock>;
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => supabaseMockImpl,
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import { createCheckoutSession, createAdultCheckoutSession } from "@/lib/actions/subscription";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SubRow = { stripe_customer_id: string } | null;

/**
 * Builds a minimal chainable Supabase client stub.
 *
 * @param row         - Row returned by subscriptions.maybeSingle()
 * @param athleteCount - Count returned by parent_athlete_links count query
 *                       (default 1; null simulates a count-read error → falls
 *                       back to 1 in the action)
 */
function makeSubMock(row: SubRow, athleteCount: number | null = 1) {
  const subChain = {
    select: () => subChain,
    eq: () => subChain,
    maybeSingle: async () => ({ data: row, error: null }),
  };

  // The athlete-count query uses { count: "exact", head: true } — the chain
  // resolves to { count, error: null } (or { count: null, error: {...} }).
  const countResult =
    athleteCount === null
      ? { count: null, error: { message: "count error" } }
      : { count: athleteCount, error: null };
  const countChain = {
    select: () => ({
      eq: () => Promise.resolve(countResult),
    }),
  };

  return {
    from: (table: string) => {
      if (table === "subscriptions") return subChain;
      // parent_athlete_links
      return countChain;
    },
  };
}

/** FormData with a valid plan value. */
function makeFormData(plan: "monthly" | "annual"): FormData {
  const fd = new FormData();
  fd.append("plan", plan);
  return fd;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createCheckoutSession — 14-day trial logic (FV-217)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.fromvictoryapp.com";
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_500";
    process.env.STRIPE_PRICE_ID_ANNUAL = "price_annual_4900";

    // Default Stripe response — the test that needs a specific URL overrides.
    sessionsCreateMock.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/cs_test",
    });
  });

  // -------------------------------------------------------------------------
  // (a) No subscriptions row → trial fields present
  // -------------------------------------------------------------------------
  it("(a) includes trial_period_days:14 and payment_method_collection:'always' when no row exists", async () => {
    supabaseMockImpl = makeSubMock(null); // no row → first-time subscriber

    await createCheckoutSession(null, makeFormData("monthly"));

    expect(sessionsCreateMock).toHaveBeenCalledOnce();
    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;

    // Trial fields must be present.
    expect(
      (params.subscription_data as Record<string, unknown>).trial_period_days,
    ).toBe(14);
    expect(params.payment_method_collection).toBe("always");
  });

  it("(a) annual plan with no row also gets the trial", async () => {
    supabaseMockImpl = makeSubMock(null);

    await createCheckoutSession(null, makeFormData("annual"));

    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(
      (params.subscription_data as Record<string, unknown>).trial_period_days,
    ).toBe(14);
    expect(params.payment_method_collection).toBe("always");
  });

  it("(a) preserves parent_id metadata in subscription_data when trial is applied", async () => {
    supabaseMockImpl = makeSubMock(null);

    await createCheckoutSession(null, makeFormData("monthly"));

    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    const subData = params.subscription_data as Record<string, unknown>;
    // parent_id metadata must still be present alongside trial_period_days.
    expect((subData.metadata as Record<string, unknown>).parent_id).toBe(
      "parent-uuid-test",
    );
    expect(subData.trial_period_days).toBe(14);
  });

  // -------------------------------------------------------------------------
  // (b) Row exists with status "canceled" → NO trial fields
  // -------------------------------------------------------------------------
  it("(b) omits trial fields when a canceled row exists (cancel-and-resubscribe blocked)", async () => {
    // Row exists (status=canceled → has already had a trial).
    supabaseMockImpl = makeSubMock({ stripe_customer_id: "cus_canceled" });

    await createCheckoutSession(null, makeFormData("monthly"));

    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;

    // trial_period_days must NOT be on subscription_data.
    expect(
      (params.subscription_data as Record<string, unknown>).trial_period_days,
    ).toBeUndefined();
    // payment_method_collection must NOT be set to "always" by our code.
    expect(params.payment_method_collection).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // (c) Row exists with status "active" → NO trial + existing behavior preserved
  // -------------------------------------------------------------------------
  it("(c) omits trial fields when an active row exists", async () => {
    supabaseMockImpl = makeSubMock({ stripe_customer_id: "cus_active_123" });

    await createCheckoutSession(null, makeFormData("annual"));

    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(
      (params.subscription_data as Record<string, unknown>).trial_period_days,
    ).toBeUndefined();
    expect(params.payment_method_collection).toBeUndefined();
  });

  it("(c) reuses existing customer ID when row exists (existing behavior)", async () => {
    supabaseMockImpl = makeSubMock({ stripe_customer_id: "cus_existing_456" });

    await createCheckoutSession(null, makeFormData("monthly"));

    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(params.customer).toBe("cus_existing_456");
    // customer_creation should NOT be set when we already have a customer.
    expect(params.customer_creation).toBeUndefined();
  });

  it("(c) redirects to the Stripe checkout URL on success (existing behavior)", async () => {
    supabaseMockImpl = makeSubMock({ stripe_customer_id: "cus_active_123" });
    sessionsCreateMock.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/cs_active",
    });

    await createCheckoutSession(null, makeFormData("monthly"));

    expect(redirectMock).toHaveBeenCalledWith(
      "https://checkout.stripe.com/pay/cs_active",
    );
  });

  // -------------------------------------------------------------------------
  // No-row path: NO customer params at all. Stripe rejects `customer_creation`
  // in subscription mode ("only valid in payment mode") — regression test for
  // the live-checkout hotfix. Checkout auto-creates the Customer; the webhook
  // binds it via metadata.parent_id.
  // -------------------------------------------------------------------------
  it("sends neither customer nor customer_creation when no row exists", async () => {
    supabaseMockImpl = makeSubMock(null);

    await createCheckoutSession(null, makeFormData("monthly"));

    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(params.customer_creation).toBeUndefined();
    expect(params.customer).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Correct price IDs are resolved
  // -------------------------------------------------------------------------
  it("uses the monthly price ID for plan=monthly", async () => {
    supabaseMockImpl = makeSubMock(null);

    await createCheckoutSession(null, makeFormData("monthly"));

    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    const lineItems = params.line_items as Array<{ price: string }>;
    expect(lineItems[0]?.price).toBe("price_monthly_500");
  });

  it("uses the annual price ID for plan=annual", async () => {
    supabaseMockImpl = makeSubMock(null);

    await createCheckoutSession(null, makeFormData("annual"));

    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    const lineItems = params.line_items as Array<{ price: string }>;
    expect(lineItems[0]?.price).toBe("price_annual_4900");
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------
  it("returns an error state when STRIPE_PRICE_ID_MONTHLY is not set", async () => {
    supabaseMockImpl = makeSubMock(null);
    delete process.env.STRIPE_PRICE_ID_MONTHLY;

    const result = await createCheckoutSession(null, makeFormData("monthly"));

    expect(result).not.toBeNull();
    expect(result?.ok).toBe(false);
    expect(sessionsCreateMock).not.toHaveBeenCalled();

    // Restore for subsequent tests.
    process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_500";
  });

  it("returns an error state when Stripe sessions.create throws", async () => {
    supabaseMockImpl = makeSubMock(null);
    sessionsCreateMock.mockRejectedValue(new Error("Stripe API failure"));

    const result = await createCheckoutSession(null, makeFormData("monthly"));

    expect(result?.ok).toBe(false);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns an error state when Stripe returns a session with no URL", async () => {
    supabaseMockImpl = makeSubMock(null);
    sessionsCreateMock.mockResolvedValue({ id: "cs_test_nurl", url: null });

    const result = await createCheckoutSession(null, makeFormData("monthly"));

    expect(result?.ok).toBe(false);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("fails CLOSED when the subscriptions read errors — no trial granted, no Stripe call", async () => {
    // qa finding (PR #185): a transient DB error must not be treated as
    // "no row" — that would hand a returning parent a second trial.
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => ({
        data: null,
        error: { message: "connection timeout" },
      }),
    };
    // reason: the stub intentionally diverges from makeSubMock's shape
    // (error non-null) — cast through unknown for the error-path fixture.
    supabaseMockImpl = { from: (_table: string) => chain } as unknown as ReturnType<
      typeof makeSubMock
    >;

    const result = await createCheckoutSession(null, makeFormData("monthly"));

    expect(result?.ok).toBe(false);
    expect(sessionsCreateMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns a validation error for an invalid plan value", async () => {
    supabaseMockImpl = makeSubMock(null);
    const fd = new FormData();
    fd.append("plan", "enterprise"); // not in the enum

    const result = await createCheckoutSession(null, fd);

    expect(result?.ok).toBe(false);
    expect(sessionsCreateMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// FV-283: quantity = athlete count
// ---------------------------------------------------------------------------

describe("createCheckoutSession — quantity from athlete count (FV-283)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.fromvictoryapp.com";
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_500";
    process.env.STRIPE_PRICE_ID_ANNUAL = "price_annual_4900";

    sessionsCreateMock.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/cs_test",
    });
  });

  it("passes quantity=3 when the parent has 3 linked athletes", async () => {
    supabaseMockImpl = makeSubMock(null, 3); // 3 athletes, no existing sub

    await createCheckoutSession(null, makeFormData("monthly"));

    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    const lineItems = params.line_items as Array<{ price: string; quantity: number }>;
    expect(lineItems[0]?.quantity).toBe(3);
  });

  it("passes quantity=1 when the parent has 0 linked athletes (floor)", async () => {
    supabaseMockImpl = makeSubMock(null, 0); // 0 athletes → floor at 1

    await createCheckoutSession(null, makeFormData("monthly"));

    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    const lineItems = params.line_items as Array<{ price: string; quantity: number }>;
    expect(lineItems[0]?.quantity).toBe(1);
  });

  it("defaults quantity to 1 when the athlete count query fails", async () => {
    supabaseMockImpl = makeSubMock(null, null); // count query errors

    await createCheckoutSession(null, makeFormData("monthly"));

    // Session is still created (count error is non-fatal).
    expect(sessionsCreateMock).toHaveBeenCalledOnce();
    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    const lineItems = params.line_items as Array<{ price: string; quantity: number }>;
    expect(lineItems[0]?.quantity).toBe(1);
  });

  it("passes quantity=1 when the parent has exactly 1 athlete", async () => {
    supabaseMockImpl = makeSubMock({ stripe_customer_id: "cus_existing" }, 1);

    await createCheckoutSession(null, makeFormData("annual"));

    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    const lineItems = params.line_items as Array<{ price: string; quantity: number }>;
    expect(lineItems[0]?.quantity).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// FV-327: createAdultCheckoutSession — adult self-serve checkout
// ---------------------------------------------------------------------------

describe("createAdultCheckoutSession (FV-327)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.fromvictoryapp.com";
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_500";
    process.env.STRIPE_PRICE_ID_ANNUAL = "price_annual_4900";

    sessionsCreateMock.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/cs_test_adult",
    });
  });

  // -------------------------------------------------------------------------
  // (a) No row → trial + payment_method_collection + quantity 1 + metadata
  // -------------------------------------------------------------------------
  it("(a) no row → trial_period_days:14, payment_method_collection:'always', quantity:1, metadata.parent_id is adult uuid", async () => {
    supabaseMockImpl = makeSubMock(null);

    await createAdultCheckoutSession(null, makeFormData("monthly"));

    expect(sessionsCreateMock).toHaveBeenCalledOnce();
    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;

    // Trial fields.
    expect(
      (params.subscription_data as Record<string, unknown>).trial_period_days,
    ).toBe(14);
    expect(params.payment_method_collection).toBe("always");

    // Quantity is always 1 for adults.
    const lineItems = params.line_items as Array<{ price: string; quantity: number }>;
    expect(lineItems[0]?.quantity).toBe(1);

    // Metadata payer key uses the adult uuid.
    expect((params.metadata as Record<string, unknown>).parent_id).toBe(
      "adult-uuid-test",
    );
  });

  // -------------------------------------------------------------------------
  // (b) Existing row → no trial + customer reuse + quantity 1
  // -------------------------------------------------------------------------
  it("(b) existing row → no trial, customer reuse, quantity:1", async () => {
    supabaseMockImpl = makeSubMock({ stripe_customer_id: "cus_adult_existing" });

    await createAdultCheckoutSession(null, makeFormData("annual"));

    expect(sessionsCreateMock).toHaveBeenCalledOnce();
    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;

    // No trial fields.
    expect(
      (params.subscription_data as Record<string, unknown>).trial_period_days,
    ).toBeUndefined();
    expect(params.payment_method_collection).toBeUndefined();

    // Customer reuse.
    expect(params.customer).toBe("cus_adult_existing");

    // Quantity still 1.
    const lineItems = params.line_items as Array<{ price: string; quantity: number }>;
    expect(lineItems[0]?.quantity).toBe(1);
  });

  // -------------------------------------------------------------------------
  // (c) quantity is ALWAYS 1 — even if makeSubMock says 3 athletes
  //     (proves the adult path never reads parent_athlete_links)
  // -------------------------------------------------------------------------
  it("(c) quantity is always 1 even when athlete-count mock would say 3", async () => {
    // makeSubMock(null, 3) — the 3 is the parent_athlete_links mock, which the
    // adult action must never consult. If it did, quantity would be 3.
    supabaseMockImpl = makeSubMock(null, 3);

    await createAdultCheckoutSession(null, makeFormData("monthly"));

    expect(sessionsCreateMock).toHaveBeenCalledOnce();
    const params = sessionsCreateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    const lineItems = params.line_items as Array<{ price: string; quantity: number }>;

    // Must be 1, proving parent_athlete_links was never consulted.
    expect(lineItems[0]?.quantity).toBe(1);
  });
});
