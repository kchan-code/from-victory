/**
 * Unit tests for the trial-to-family explicit-confirmation read-side helpers
 * (FV-586, KC decision D3, `apps/web/lib/subscriptions/trial-conversion.ts`).
 *
 * Covers:
 *   - getTrialConversionState: stripe_trial / not_trialing / apple / unknown
 *     (fail-closed on any read error) state derivation
 *   - getTrialConversionQuote: per-unit price -> real numbers; tiered
 *     graduated/volume prices -> deterministic totals computed from
 *     `price.tiers`; decimal-only tier/price amounts; missing tiers or an
 *     unrecognized scheme/tiers_mode -> quoteUnavailable (never guessed);
 *     taxMayApply reflects `automatic_tax.enabled`; the `items.data.price.
 *     tiers` expand param is requested; any read/API failure ->
 *     quoteUnavailable (never throws)
 *
 * The service client and the Stripe client are both mocked — no real DB, no
 * real Stripe API call.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mutable table / API state
// ---------------------------------------------------------------------------

let subRow: {
  status: string;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
} | null = null;
let subReadError: { message: string } | null = null;

let athleteCount: number | null = 0;
let athleteCountError: { message: string } | null = null;

let activeAppleProductId: string | null = null;

function makeServiceMock() {
  return {
    from: (table: string) => {
      if (table === "subscriptions") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: subRow, error: subReadError }),
            }),
          }),
        };
      }
      if (table === "parent_athlete_links") {
        return {
          select: () => ({
            eq: async () => ({ count: athleteCount, error: athleteCountError }),
          }),
        };
      }
      throw new Error(`unexpected table on service client: ${table}`);
    },
  };
}

vi.mock("@/lib/subscriptions/apple", () => ({
  getActiveAppleProductId: vi.fn(async () => activeAppleProductId),
}));

// ---------------------------------------------------------------------------
// Stripe mock
// ---------------------------------------------------------------------------

const stripeSubscriptionsRetrieveMock = vi.fn();
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    subscriptions: {
      retrieve: (...args: unknown[]) => stripeSubscriptionsRetrieveMock(...args),
    },
  }),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import {
  getTrialConversionState,
  getTrialConversionQuote,
} from "@/lib/subscriptions/trial-conversion";

const PAYER_ID = "cccccccc-0000-4000-8000-000000000003";

beforeEach(() => {
  subRow = null;
  subReadError = null;
  athleteCount = 0;
  athleteCountError = null;
  activeAppleProductId = null;
  stripeSubscriptionsRetrieveMock.mockReset();
});

// ===========================================================================
// getTrialConversionState
// ===========================================================================

describe("getTrialConversionState", () => {
  it("returns stripe_trial for a trialing subscription with an id, carrying the athlete count + trial end", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: "2026-09-25T00:00:00Z",
    };
    athleteCount = 1;

    const result = await getTrialConversionState(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({
      kind: "stripe_trial",
      stripeSubscriptionId: "sub_abc123",
      currentAthleteCount: 1,
      trialEndsAt: "2026-09-25T00:00:00Z",
    });
  });

  it("returns not_trialing when the subscription is active (not a trial)", async () => {
    subRow = {
      status: "active",
      stripe_subscription_id: "sub_abc123",
      current_period_end: "2026-10-25T00:00:00Z",
    };

    const result = await getTrialConversionState(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ kind: "not_trialing" });
  });

  it("returns not_trialing when there is no subscriptions row and no Apple product", async () => {
    subRow = null;

    const result = await getTrialConversionState(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ kind: "not_trialing" });
  });

  it("returns apple when there is no Stripe trial but the payer holds an active Apple product", async () => {
    subRow = null;
    activeAppleProductId = "tier_3_athletes";

    const result = await getTrialConversionState(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ kind: "apple" });
  });

  it("prefers stripe_trial over apple when both somehow resolve (duplicate-billing edge case) — Stripe checked first", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    activeAppleProductId = "tier_3_athletes";

    const result = await getTrialConversionState(makeServiceMock() as never, PAYER_ID);

    expect(result.kind).toBe("stripe_trial");
  });

  it("FAIL CLOSED: returns unknown when the subscriptions read errors", async () => {
    subReadError = { message: "connection reset" };

    const result = await getTrialConversionState(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ kind: "unknown" });
  });

  it("FAIL CLOSED: returns unknown when the athlete-count read errors (only reached once trialing is confirmed)", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCountError = { message: "connection reset" };

    const result = await getTrialConversionState(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ kind: "unknown" });
  });

  it("returns not_trialing (not stripe_trial) when status is trialing but stripe_subscription_id is null (webhook not yet synced)", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: null,
      current_period_end: null,
    };

    const result = await getTrialConversionState(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ kind: "not_trialing" });
  });
});

// ===========================================================================
// getTrialConversionQuote
// ===========================================================================

function makePerUnitStripeSub(overrides: Record<string, unknown> = {}) {
  return {
    items: {
      data: [
        {
          id: "si_123",
          quantity: 1,
          price: {
            billing_scheme: "per_unit",
            unit_amount: 500,
            currency: "usd",
            recurring: { interval: "month" },
          },
        },
      ],
    },
    automatic_tax: { enabled: false },
    ...overrides,
  };
}

function makeGraduatedPrice(overrides: Record<string, unknown> = {}) {
  return {
    billing_scheme: "tiered",
    tiers_mode: "graduated",
    unit_amount: null,
    currency: "usd",
    recurring: { interval: "month" },
    tiers: [
      { up_to: 1, unit_amount: 500, unit_amount_decimal: null, flat_amount: null, flat_amount_decimal: null },
      { up_to: null, unit_amount: 300, unit_amount_decimal: null, flat_amount: null, flat_amount_decimal: null },
    ],
    ...overrides,
  };
}

describe("getTrialConversionQuote", () => {
  it("computes the quote for a plain per-unit monthly price", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCount = 1;
    stripeSubscriptionsRetrieveMock.mockResolvedValue(makePerUnitStripeSub());

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({
      quoteUnavailable: false,
      currency: "usd",
      interval: "month",
      currentQuantity: 1,
      nextQuantity: 2,
      totalDueTodayCents: 1000,
      taxMayApply: false,
      nextRenewalLabel: "every month",
      billingScheme: "per_unit",
    });
    expect(stripeSubscriptionsRetrieveMock).toHaveBeenCalledWith("sub_abc123", {
      expand: ["items.data.price", "items.data.price.tiers"],
    });
  });

  it("computes the quote for a plain per-unit annual price", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCount = 0;
    stripeSubscriptionsRetrieveMock.mockResolvedValue(
      makePerUnitStripeSub({
        items: {
          data: [
            {
              id: "si_123",
              quantity: 1,
              price: {
                billing_scheme: "per_unit",
                unit_amount: 4900,
                currency: "usd",
                recurring: { interval: "year" },
              },
            },
          ],
        },
      }),
    );

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({
      quoteUnavailable: false,
      currency: "usd",
      interval: "year",
      currentQuantity: 1,
      nextQuantity: 1,
      totalDueTodayCents: 4900,
      taxMayApply: false,
      nextRenewalLabel: "every year",
      billingScheme: "per_unit",
    });
  });

  it("returns quoteUnavailable when the Price is tiered but has no tiers array (not expanded / missing data)", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    stripeSubscriptionsRetrieveMock.mockResolvedValue({
      items: {
        data: [
          {
            id: "si_123",
            quantity: 1,
            price: {
              billing_scheme: "tiered",
              tiers_mode: "graduated",
              unit_amount: null,
              currency: "usd",
              recurring: { interval: "month" },
              // no tiers array
            },
          },
        ],
      },
    });

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ quoteUnavailable: true });
  });

  it("returns quoteUnavailable for an unrecognized billing_scheme", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    stripeSubscriptionsRetrieveMock.mockResolvedValue({
      items: {
        data: [
          {
            id: "si_123",
            quantity: 1,
            price: {
              billing_scheme: "something_new_stripe_added",
              unit_amount: null,
              currency: "usd",
              recurring: { interval: "month" },
            },
          },
        ],
      },
    });

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ quoteUnavailable: true });
  });

  it("returns quoteUnavailable for tiered pricing with an unrecognized tiers_mode", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCount = 1;
    stripeSubscriptionsRetrieveMock.mockResolvedValue({
      items: {
        data: [
          {
            id: "si_123",
            quantity: 1,
            price: makeGraduatedPrice({ tiers_mode: "something_new" }),
          },
        ],
      },
    });

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ quoteUnavailable: true });
  });

  it("computes a graduated total for N=2 (tier1 500 for unit 1, tier2 300 for unit 2 -> 800)", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCount = 1; // currentAthleteCount=1 -> nextQuantity=2
    stripeSubscriptionsRetrieveMock.mockResolvedValue({
      items: { data: [{ id: "si_123", quantity: 1, price: makeGraduatedPrice() }] },
      automatic_tax: { enabled: false },
    });

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({
      quoteUnavailable: false,
      currency: "usd",
      interval: "month",
      currentQuantity: 1,
      nextQuantity: 2,
      totalDueTodayCents: 800,
      taxMayApply: false,
      nextRenewalLabel: "every month",
      billingScheme: "graduated",
    });
  });

  it("computes a graduated total for N=3 (tier1 500 for unit 1, tier2 300 x2 for units 2-3 -> 1100)", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCount = 2; // currentAthleteCount=2 -> nextQuantity=3
    stripeSubscriptionsRetrieveMock.mockResolvedValue({
      items: { data: [{ id: "si_123", quantity: 2, price: makeGraduatedPrice() }] },
    });

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toMatchObject({
      quoteUnavailable: false,
      totalDueTodayCents: 1100,
      billingScheme: "graduated",
      nextQuantity: 3,
    });
  });

  it("computes a yearly graduated total for N=2 (tier1 4900 for unit 1, tier2 2900 for unit 2 -> 7800)", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCount = 1;
    stripeSubscriptionsRetrieveMock.mockResolvedValue({
      items: {
        data: [
          {
            id: "si_123",
            quantity: 1,
            price: makeGraduatedPrice({
              recurring: { interval: "year" },
              tiers: [
                { up_to: 1, unit_amount: 4900, unit_amount_decimal: null, flat_amount: null, flat_amount_decimal: null },
                { up_to: null, unit_amount: 2900, unit_amount_decimal: null, flat_amount: null, flat_amount_decimal: null },
              ],
            }),
          },
        ],
      },
    });

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toMatchObject({
      quoteUnavailable: false,
      totalDueTodayCents: 7800,
      billingScheme: "graduated",
      interval: "year",
    });
  });

  it("computes a volume total for the single tier whose ceiling contains nextQuantity", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCount = 1; // nextQuantity=2
    stripeSubscriptionsRetrieveMock.mockResolvedValue({
      items: {
        data: [
          {
            id: "si_123",
            quantity: 1,
            price: {
              billing_scheme: "tiered",
              tiers_mode: "volume",
              unit_amount: null,
              currency: "usd",
              recurring: { interval: "month" },
              tiers: [
                { up_to: 1, unit_amount: 500, unit_amount_decimal: null, flat_amount: null, flat_amount_decimal: null },
                { up_to: null, unit_amount: 350, unit_amount_decimal: null, flat_amount: 100, flat_amount_decimal: null },
              ],
            },
          },
        ],
      },
    });

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    // nextQuantity=2 exceeds tier1's up_to=1, so it falls into the unbounded
    // tier2: 350 * 2 + 100 flat = 800.
    expect(result).toMatchObject({
      quoteUnavailable: false,
      totalDueTodayCents: 800,
      billingScheme: "volume",
    });
  });

  it("computes a graduated total using decimal-only tier amounts (unit_amount/flat_amount both null)", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCount = 1; // nextQuantity=2
    stripeSubscriptionsRetrieveMock.mockResolvedValue({
      items: {
        data: [
          {
            id: "si_123",
            quantity: 1,
            price: makeGraduatedPrice({
              tiers: [
                { up_to: 1, unit_amount: null, unit_amount_decimal: "500", flat_amount: null, flat_amount_decimal: null },
                { up_to: null, unit_amount: null, unit_amount_decimal: "300", flat_amount: null, flat_amount_decimal: "0" },
              ],
            }),
          },
        ],
      },
    });

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toMatchObject({ quoteUnavailable: false, totalDueTodayCents: 800 });
  });

  it("computes a per_unit total using decimal-only price amount (unit_amount null, unit_amount_decimal set)", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCount = 1;
    stripeSubscriptionsRetrieveMock.mockResolvedValue(
      makePerUnitStripeSub({
        items: {
          data: [
            {
              id: "si_123",
              quantity: 1,
              price: {
                billing_scheme: "per_unit",
                unit_amount: null,
                unit_amount_decimal: "500",
                currency: "usd",
                recurring: { interval: "month" },
              },
            },
          ],
        },
      }),
    );

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toMatchObject({ quoteUnavailable: false, totalDueTodayCents: 1000 });
  });

  it("returns quoteUnavailable when a tier has neither unit_amount nor unit_amount_decimal", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCount = 1;
    stripeSubscriptionsRetrieveMock.mockResolvedValue({
      items: {
        data: [
          {
            id: "si_123",
            quantity: 1,
            price: makeGraduatedPrice({
              tiers: [
                { up_to: 1, unit_amount: 500, unit_amount_decimal: null, flat_amount: null, flat_amount_decimal: null },
                { up_to: null, unit_amount: null, unit_amount_decimal: null, flat_amount: null, flat_amount_decimal: null },
              ],
            }),
          },
        ],
      },
    });

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ quoteUnavailable: true });
  });

  it("sets taxMayApply true when the subscription has Stripe Tax enabled", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCount = 1;
    stripeSubscriptionsRetrieveMock.mockResolvedValue(
      makePerUnitStripeSub({ automatic_tax: { enabled: true } }),
    );

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toMatchObject({ quoteUnavailable: false, taxMayApply: true });
  });

  it("sets taxMayApply false when automatic_tax is absent from the response", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCount = 1;
    stripeSubscriptionsRetrieveMock.mockResolvedValue({
      items: {
        data: [
          {
            id: "si_123",
            quantity: 1,
            price: {
              billing_scheme: "per_unit",
              unit_amount: 500,
              currency: "usd",
              recurring: { interval: "month" },
            },
          },
        ],
      },
      // no automatic_tax field at all
    });

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toMatchObject({ quoteUnavailable: false, taxMayApply: false });
  });

  it("returns quoteUnavailable when there is no subscriptions row", async () => {
    subRow = null;

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ quoteUnavailable: true });
    expect(stripeSubscriptionsRetrieveMock).not.toHaveBeenCalled();
  });

  it("returns quoteUnavailable when the subscriptions read errors", async () => {
    subReadError = { message: "connection reset" };

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ quoteUnavailable: true });
  });

  it("returns quoteUnavailable when the athlete-count read errors", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    athleteCountError = { message: "connection reset" };

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ quoteUnavailable: true });
    expect(stripeSubscriptionsRetrieveMock).not.toHaveBeenCalled();
  });

  it("returns quoteUnavailable when the Stripe API call fails", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    stripeSubscriptionsRetrieveMock.mockRejectedValue(new Error("Stripe API down"));

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ quoteUnavailable: true });
  });

  it("returns quoteUnavailable when the subscription has no items", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    stripeSubscriptionsRetrieveMock.mockResolvedValue({ items: { data: [] } });

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ quoteUnavailable: true });
  });

  it("returns quoteUnavailable for a non-month/year interval (e.g. week)", async () => {
    subRow = {
      status: "trialing",
      stripe_subscription_id: "sub_abc123",
      current_period_end: null,
    };
    stripeSubscriptionsRetrieveMock.mockResolvedValue(
      makePerUnitStripeSub({
        items: {
          data: [
            {
              id: "si_123",
              quantity: 1,
              price: {
                billing_scheme: "per_unit",
                unit_amount: 500,
                currency: "usd",
                recurring: { interval: "week" },
              },
            },
          ],
        },
      }),
    );

    const result = await getTrialConversionQuote(makeServiceMock() as never, PAYER_ID);

    expect(result).toEqual({ quoteUnavailable: true });
  });
});
