/**
 * Integration-style tests for POST /api/webhooks/stripe.
 *
 * Mocks:
 *   - server-only           → no-op (Next.js guard not available in vitest/node)
 *   - @/lib/stripe/server   → controlled constructEvent stub
 *   - @/lib/supabase/service → configurable chainable stub
 *
 * The handler only calls req.text() and req.headers.get(), so we cast a minimal
 * object as NextRequest.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";

// ---------------------------------------------------------------------------
// Module mocks (must be hoisted before imports of the module under test)
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

// Mutable constructEvent mock — replaced per test.
const constructEventMock = vi.fn();
const subscriptionsRetrieveMock = vi.fn();
const subscriptionsListMock = vi.fn();
const notifyErrorMock = vi.fn(async (..._args: unknown[]) => {});
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: (...args: unknown[]) => notifyErrorMock(...args),
}));
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: constructEventMock,
    },
    subscriptions: {
      retrieve: subscriptionsRetrieveMock,
      list: subscriptionsListMock,
    },
  }),
}));

// Mutable service mock — replaced per test via makeServiceMock().
let upsertCalls: unknown[] = [];
let selectCalls: { cols: string; col: string; val: unknown }[] = [];
let serviceMockImpl: ReturnType<typeof makeServiceMock>;

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => serviceMockImpl,
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks are registered
// ---------------------------------------------------------------------------

import { POST } from "@/app/api/webhooks/stripe/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal fake NextRequest. The handler only uses req.text() and
 * req.headers.get(k), so this is sufficient.
 */
function makeRequest(
  rawBody: string,
  headers: Record<string, string | null>,
): NextRequest {
  return {
    text: async () => rawBody,
    headers: {
      get: (k: string) => headers[k] ?? null,
    },
  } as unknown as NextRequest;
}

/**
 * Builds a minimal Stripe.Event-shaped object safe to pass to the handler.
 */
function makeEvent(
  type: string,
  dataObject: unknown,
  created = 2000,
  id = "evt_test",
): Stripe.Event {
  return {
    id,
    type,
    created,
    data: { object: dataObject },
  } as unknown as Stripe.Event;
}

/**
 * Builds a minimal Stripe.Subscription-shaped object.
 */
function makeSubscription(
  overrides: Partial<{
    id: string;
    customer: string;
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
    priceId: string;
  }> = {},
): Stripe.Subscription {
  const {
    id = "sub_test",
    customer = "cus_test",
    status = "active",
    current_period_end = 1800000000,
    cancel_at_period_end = false,
    priceId = "price_monthly_899",
  } = overrides;
  return {
    id,
    object: "subscription",
    customer,
    status,
    current_period_end,
    cancel_at_period_end,
    items: {
      object: "list",
      data: [
        {
          id: "si_test",
          object: "subscription_item",
          current_period_end,
          price: { id: priceId, object: "price" },
        },
      ],
      has_more: false,
      url: "",
    },
  } as unknown as Stripe.Subscription;
}

/**
 * Builds a minimal Stripe.Invoice-shaped object.
 */
function makeInvoice(
  overrides: Partial<{
    id: string;
    subscription: string | Stripe.Subscription | null;
    legacySubscription: string | Stripe.Subscription | null;
  }> = {},
): Stripe.Invoice {
  const { id = "in_test", subscription, legacySubscription } = overrides;
  const invoice: Record<string, unknown> = {
    id,
    object: "invoice",
    parent: null,
  };

  if (subscription != null) {
    invoice.parent = {
      type: "subscription_details",
      subscription_details: { subscription },
      quote_details: null,
    };
  }

  if (legacySubscription !== undefined) {
    invoice.subscription = legacySubscription;
  }

  return invoice as unknown as Stripe.Invoice;
}

/**
 * Builds a configurable service-client stub.
 *
 * Supports two access patterns the route uses:
 *   1. service.from("subscriptions").upsert(row, opts)  → resolves { error }
 *   2. service.from("subscriptions").select(cols).eq(col, val).maybeSingle()
 *        → resolves { data, error }
 *
 * `upsertCalls` (outer array) is reset by the caller in beforeEach so tests
 * can assert "upsert was called" / "upsert NOT called" / inspect the row.
 */
interface ServiceMockOptions {
  /** Data returned by maybeSingle(). Defaults to a row with parent_id + null watermark. */
  existingRow?: Record<string, unknown> | null;
  /** Error returned by upsert(). Defaults to null (success). */
  upsertError?: { message: string } | null;
  /** Error returned by maybeSingle(). Defaults to null (success). */
  lookupError?: { message: string } | null;
}

function makeServiceMock(opts: ServiceMockOptions = {}) {
  const {
    existingRow = {
      parent_id: "parent-uuid-001",
      last_stripe_event_at: null,
    },
    upsertError = null,
    lookupError = null,
  } = opts;

  return {
    from: (_table: string) => ({
      upsert: vi.fn(async (row: unknown) => {
        upsertCalls.push(row);
        return { error: upsertError };
      }),
      select: (cols: string) => ({
        eq: (col: string, val: unknown) => ({
          maybeSingle: async () => (selectCalls.push({ cols, col, val }), {
            data: existingRow,
            error: lookupError,
          }),
        }),
      }),
    }),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/stripe", () => {
  const DUMMY_SECRET = "whsec_test_dummy";

  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = DUMMY_SECRET;
    constructEventMock.mockReset();
    subscriptionsRetrieveMock.mockReset();
    // Default: retrieve returns an active subscription matching the checkout tests.
    subscriptionsRetrieveMock.mockResolvedValue(makeSubscription());
    // Default: the customer has exactly one subscription (no duplicate alert).
    subscriptionsListMock.mockReset();
    subscriptionsListMock.mockResolvedValue({ data: [makeSubscription()] });
    notifyErrorMock.mockClear();
    selectCalls = [];
    upsertCalls = [];
    // Default service mock: existing row present, all operations succeed.
    serviceMockImpl = makeServiceMock();
  });

  // -------------------------------------------------------------------------
  // 1. Missing STRIPE_WEBHOOK_SECRET
  // -------------------------------------------------------------------------
  it("returns 400 and does NOT call constructEvent when STRIPE_WEBHOOK_SECRET is absent", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const req = makeRequest("body", { "stripe-signature": "sig_abc" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(constructEventMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 2. Missing stripe-signature header
  // -------------------------------------------------------------------------
  it("returns 400 when stripe-signature header is absent", async () => {
    const req = makeRequest("body", { "stripe-signature": null });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(constructEventMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 3. Bad signature — constructEvent throws
  // -------------------------------------------------------------------------
  it("returns 400 when constructEvent throws (bad signature)", async () => {
    constructEventMock.mockImplementationOnce(() => {
      throw new Error("No signatures found matching the expected signature");
    });

    const req = makeRequest("body", { "stripe-signature": "bad_sig" });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  // -------------------------------------------------------------------------
  // 4. Happy path — checkout.session.completed → 200, upsert called
  // -------------------------------------------------------------------------
  it("returns 200 and upserts a row with parent_id on checkout.session.completed", async () => {
    const session = {
      id: "cs_test",
      object: "checkout.session",
      customer: "cus_test",
      subscription: "sub_test",
      payment_status: "paid",
      metadata: { parent_id: "parent-uuid-001" },
    };
    const event = makeEvent("checkout.session.completed", session, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", {
      "stripe-signature": "sig_valid",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    const upsertedRow = upsertCalls[0] as Record<string, unknown>;
    expect(upsertedRow.parent_id).toBe("parent-uuid-001");
    // Checkout path must NOT write last_stripe_event_at.
    expect(upsertedRow).not.toHaveProperty("last_stripe_event_at");
  });

  // -------------------------------------------------------------------------
  // 5. Happy path — customer.subscription.updated → 200, upsert called
  // -------------------------------------------------------------------------
  it("returns 200 and upserts on customer.subscription.updated with resolved parent_id", async () => {
    serviceMockImpl = makeServiceMock({
      existingRow: { parent_id: "parent-uuid-002", last_stripe_event_at: null },
    });

    const sub = makeSubscription({ customer: "cus_test", status: "active" });
    const event = makeEvent("customer.subscription.updated", sub, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", {
      "stripe-signature": "sig_valid",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    const upsertedRow = upsertCalls[0] as Record<string, unknown>;
    expect(upsertedRow.parent_id).toBe("parent-uuid-002");
    // Must include watermark.
    expect(upsertedRow.last_stripe_event_at).toBe(
      new Date(2000 * 1000).toISOString(),
    );
  });

  // -------------------------------------------------------------------------
  // 6. DB write fails → 500
  // -------------------------------------------------------------------------
  it("returns 500 when the DB upsert fails (checkout path)", async () => {
    serviceMockImpl = makeServiceMock({
      upsertError: { message: "boom" },
    });

    const session = {
      id: "cs_boom",
      object: "checkout.session",
      customer: "cus_boom",
      subscription: "sub_boom",
      payment_status: "paid",
      metadata: { parent_id: "parent-uuid-003" },
    };
    const event = makeEvent("checkout.session.completed", session, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });

  // -------------------------------------------------------------------------
  // 7. No existing row for subscription.updated → warn + 200, upsert NOT called
  // -------------------------------------------------------------------------
  it("returns 200 and does NOT upsert when no existing row for subscription.updated", async () => {
    serviceMockImpl = makeServiceMock({ existingRow: null });

    const sub = makeSubscription({ customer: "cus_new" });
    const event = makeEvent("customer.subscription.updated", sub, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 8. invoice.payment_failed with unexpanded subscription ID → 200, no upsert
  //     (basil: parent.subscription_details.subscription is a string)
  // -------------------------------------------------------------------------
  it("returns 200 and skips upsert when invoice.subscription is a string ID", async () => {
    const invoice = makeInvoice({ subscription: "sub_unexpanded_id" });
    const event = makeEvent("invoice.payment_failed", invoice, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 9. invoice.payment_failed with inline subscription object → 200, upsert called
  //     (basil: parent.subscription_details.subscription is an object)
  // -------------------------------------------------------------------------
  it("returns 200 and upserts when invoice.subscription is an inline object", async () => {
    serviceMockImpl = makeServiceMock({
      existingRow: { parent_id: "parent-uuid-004", last_stripe_event_at: null },
    });

    const sub = makeSubscription({
      customer: "cus_inline",
      status: "past_due",
    });
    const invoice = makeInvoice({ subscription: sub });
    const event = makeEvent("invoice.payment_failed", invoice, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    const upsertedRow = upsertCalls[0] as Record<string, unknown>;
    expect(upsertedRow.parent_id).toBe("parent-uuid-004");
  });

  it("returns 200 and skips upsert when a pre-basil invoice.subscription is a string ID", async () => {
    const invoice = makeInvoice({ legacySubscription: "sub_legacy_id" });
    const event = makeEvent("invoice.payment_failed", invoice, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(0);
  });

  it("returns 200 and upserts when a pre-basil invoice.subscription is an inline object", async () => {
    serviceMockImpl = makeServiceMock({
      existingRow: { parent_id: "parent-uuid-004b", last_stripe_event_at: null },
    });

    const sub = makeSubscription({
      customer: "cus_legacy_inline",
      status: "past_due",
    });
    const invoice = makeInvoice({ legacySubscription: sub });
    const event = makeEvent("invoice.payment_failed", invoice, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    const upsertedRow = upsertCalls[0] as Record<string, unknown>;
    expect(upsertedRow.parent_id).toBe("parent-uuid-004b");
  });

  // -------------------------------------------------------------------------
  // 10a. Watermark proof — stale event (created < watermark) is skipped
  // -------------------------------------------------------------------------
  it("skips upsert when subscription.updated event is older than the stored watermark", async () => {
    // Existing row has watermark = ISO for unix 2000 (i.e. the last applied event was at t=2000).
    serviceMockImpl = makeServiceMock({
      existingRow: {
        parent_id: "parent-uuid-005",
        last_stripe_event_at: new Date(2000 * 1000).toISOString(),
      },
    });

    const sub = makeSubscription({ status: "past_due", customer: "cus_stale" });
    // Older event: created=1000 < stored watermark at 2000.
    const event = makeEvent("customer.subscription.updated", sub, 1000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    // Stale event must NOT overwrite the row.
    expect(upsertCalls).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 10b. Watermark proof — newer event (created > watermark) still applied
  // -------------------------------------------------------------------------
  it("applies upsert when subscription.updated event is newer than the stored watermark", async () => {
    serviceMockImpl = makeServiceMock({
      existingRow: {
        parent_id: "parent-uuid-006",
        last_stripe_event_at: new Date(2000 * 1000).toISOString(),
      },
    });

    const sub = makeSubscription({ status: "active", customer: "cus_newer" });
    // Newer event: created=3000 > stored watermark at 2000.
    const event = makeEvent("customer.subscription.updated", sub, 3000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    const upsertedRow = upsertCalls[0] as Record<string, unknown>;
    // Watermark advances to the new event.
    expect(upsertedRow.last_stripe_event_at).toBe(
      new Date(3000 * 1000).toISOString(),
    );
  });

  // -------------------------------------------------------------------------
  // 10c. Watermark boundary — equal timestamp (created == watermark) APPLIES
  //      (idempotent same-second redelivery; guards against `<` → `<=` drift)
  // -------------------------------------------------------------------------
  it("applies upsert when subscription.updated event timestamp equals the watermark", async () => {
    serviceMockImpl = makeServiceMock({
      existingRow: {
        parent_id: "parent-uuid-007",
        last_stripe_event_at: new Date(2000 * 1000).toISOString(),
      },
    });

    const sub = makeSubscription({ status: "active", customer: "cus_equal" });
    // Equal event: created=2000 == stored watermark at 2000 → must still apply.
    const event = makeEvent("customer.subscription.updated", sub, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // 11. Dispatch coverage — customer.subscription.created → 200, upsert called
  //     (the created/updated case-fallthrough is exercised explicitly)
  // -------------------------------------------------------------------------
  it("returns 200 and upserts on customer.subscription.created", async () => {
    serviceMockImpl = makeServiceMock({
      existingRow: { parent_id: "parent-uuid-008", last_stripe_event_at: null },
    });

    const sub = makeSubscription({ customer: "cus_created", status: "active" });
    const event = makeEvent("customer.subscription.created", sub, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    const upsertedRow = upsertCalls[0] as Record<string, unknown>;
    expect(upsertedRow.parent_id).toBe("parent-uuid-008");
  });

  // -------------------------------------------------------------------------
  // 12. Dispatch coverage — customer.subscription.deleted → 200, upsert called
  //     (delegates to the upsert path; eventCreated threading is exercised)
  // -------------------------------------------------------------------------
  it("returns 200 and upserts on customer.subscription.deleted", async () => {
    serviceMockImpl = makeServiceMock({
      existingRow: { parent_id: "parent-uuid-009", last_stripe_event_at: null },
    });

    const sub = makeSubscription({ customer: "cus_deleted", status: "canceled" });
    const event = makeEvent("customer.subscription.deleted", sub, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    const upsertedRow = upsertCalls[0] as Record<string, unknown>;
    expect(upsertedRow.parent_id).toBe("parent-uuid-009");
    expect(upsertedRow.last_stripe_event_at).toBe(
      new Date(2000 * 1000).toISOString(),
    );
  });

  // -------------------------------------------------------------------------
  // 13. Retry contract — lookup failure on the subscription path → 500
  // -------------------------------------------------------------------------
  it("returns 500 when the parent_id lookup fails (subscription.updated)", async () => {
    serviceMockImpl = makeServiceMock({
      lookupError: { message: "db timeout" },
    });

    const sub = makeSubscription({ customer: "cus_lookupfail" });
    const event = makeEvent("customer.subscription.updated", sub, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(upsertCalls).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 14. Retry contract — upsert failure on the subscription path → 500
  //     (distinct from test 6, which covers the checkout path)
  // -------------------------------------------------------------------------
  it("returns 500 when the upsert fails on the subscription path", async () => {
    serviceMockImpl = makeServiceMock({
      existingRow: { parent_id: "parent-uuid-010", last_stripe_event_at: null },
      upsertError: { message: "boom" },
    });

    const sub = makeSubscription({ customer: "cus_subupsertfail" });
    const event = makeEvent("customer.subscription.updated", sub, 2000);
    constructEventMock.mockReturnValueOnce(event);

    const req = makeRequest("raw_body", { "stripe-signature": "sig_valid" });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });

  // -------------------------------------------------------------------------
  // 15. FV-182 — checkout/subscription.created race (compensating read)
  // -------------------------------------------------------------------------
  const raceSession = {
    id: "cs_race",
    object: "checkout.session",
    customer: "cus_race",
    subscription: "sub_race",
    payment_status: "paid",
    metadata: { parent_id: "parent-uuid-race" },
  };

  it("out-of-order: subscription.created with no row writes nothing; checkout then writes the real trialing row", async () => {
    // 1. subscription.created first — no row yet.
    serviceMockImpl = makeServiceMock({ existingRow: null });
    const trialing = makeSubscription({
      id: "sub_race",
      customer: "cus_race",
      status: "trialing",
      priceId: "price_trial_49",
      current_period_end: 1800000000,
    });
    constructEventMock.mockReturnValueOnce(
      makeEvent("customer.subscription.created", trialing, 2000),
    );
    const res1 = await POST(
      makeRequest("raw_body", { "stripe-signature": "sig_valid" }),
    );
    expect(res1.status).toBe(200);
    expect(upsertCalls).toHaveLength(0);

    // 2. checkout.session.completed — compensating read.
    subscriptionsRetrieveMock.mockResolvedValueOnce(trialing);
    constructEventMock.mockReturnValueOnce(
      makeEvent("checkout.session.completed", raceSession, 2000),
    );
    const res2 = await POST(
      makeRequest("raw_body", { "stripe-signature": "sig_valid" }),
    );
    expect(res2.status).toBe(200);
    expect(subscriptionsRetrieveMock).toHaveBeenCalledWith("sub_race");
    expect(upsertCalls).toHaveLength(1);
    const row = upsertCalls[0] as Record<string, unknown>;
    expect(row.parent_id).toBe("parent-uuid-race");
    expect(row.stripe_customer_id).toBe("cus_race");
    expect(row.stripe_subscription_id).toBe("sub_race");
    expect(row.status).toBe("trialing");
    expect(row.price_id).toBe("price_trial_49");
    expect(row.current_period_end).toBe(
      new Date(1800000000 * 1000).toISOString(),
    );
    expect(row.cancel_at_period_end).toBe(false);
    expect(row).not.toHaveProperty("last_stripe_event_at");
  });

  it("normal order: checkout first, then a later subscription event still applies (watermark null)", async () => {
    const trialing = makeSubscription({
      id: "sub_race",
      customer: "cus_race",
      status: "trialing",
    });
    subscriptionsRetrieveMock.mockResolvedValueOnce(trialing);
    constructEventMock.mockReturnValueOnce(
      makeEvent("checkout.session.completed", raceSession, 2000),
    );
    const res1 = await POST(
      makeRequest("raw_body", { "stripe-signature": "sig_valid" }),
    );
    expect(res1.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0]).not.toHaveProperty("last_stripe_event_at");

    // Row now exists with a null watermark (checkout never advances it).
    serviceMockImpl = makeServiceMock({
      existingRow: { parent_id: "parent-uuid-race", last_stripe_event_at: null },
    });
    constructEventMock.mockReturnValueOnce(
      makeEvent(
        "customer.subscription.updated",
        makeSubscription({ id: "sub_race", customer: "cus_race", status: "active" }),
        1500, // even an "older" created time applies: watermark is null
      ),
    );
    const res2 = await POST(
      makeRequest("raw_body", { "stripe-signature": "sig_valid" }),
    );
    expect(res2.status).toBe(200);
    expect(upsertCalls).toHaveLength(2);
    const second = upsertCalls[1] as Record<string, unknown>;
    expect(second.status).toBe("active");
    expect(second.last_stripe_event_at).toBe(
      new Date(1500 * 1000).toISOString(),
    );
  });

  it("returns 500 and writes no row when the subscription retrieve fails (Stripe retries)", async () => {
    subscriptionsRetrieveMock.mockRejectedValueOnce(new Error("stripe down"));
    constructEventMock.mockReturnValueOnce(
      makeEvent("checkout.session.completed", raceSession, 2000),
    );
    const res = await POST(
      makeRequest("raw_body", { "stripe-signature": "sig_valid" }),
    );
    expect(res.status).toBe(500);
    expect(upsertCalls).toHaveLength(0);
  });

  it("checkout session without a subscription skips the retrieve and behaves as before", async () => {
    constructEventMock.mockReturnValueOnce(
      makeEvent(
        "checkout.session.completed",
        { ...raceSession, subscription: null },
        2000,
      ),
    );
    const res = await POST(
      makeRequest("raw_body", { "stripe-signature": "sig_valid" }),
    );
    expect(res.status).toBe(200);
    expect(subscriptionsRetrieveMock).not.toHaveBeenCalled();
    const row = upsertCalls[0] as Record<string, unknown>;
    expect(row.status).toBe("active");
    expect(row.price_id).toBeNull();
    expect(row.stripe_subscription_id).toBeNull();
    expect(row).not.toHaveProperty("last_stripe_event_at");
  });

  // -------------------------------------------------------------------------
  // 16. FV-711 — events for a subscription other than the tracked one
  // -------------------------------------------------------------------------
  const WATERMARK = new Date(2000 * 1000).toISOString();
  const trackedRow = (over: Record<string, unknown> = {}) => ({
    parent_id: "parent-uuid-711",
    last_stripe_event_at: WATERMARK,
    stripe_subscription_id: "sub_S",
    status: "active",
    ...over,
  });
  const send = async (event: Stripe.Event) => {
    constructEventMock.mockReturnValueOnce(event);
    return POST(makeRequest("raw_body", { "stripe-signature": "sig_valid" }));
  };
  const alertCtx = () =>
    notifyErrorMock.mock.calls[0]![2] as Record<string, string>;

  describe("tracked subscription ends while another is live (survivor adoption)", () => {
    it("tracked S deleted, customer has a live sub_E: row moves to E, one alert", async () => {
      serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
      subscriptionsListMock.mockResolvedValueOnce({
        data: [
          makeSubscription({ id: "sub_S", status: "canceled" }),
          makeSubscription({ id: "sub_old", status: "past_due" }),
          makeSubscription({ id: "sub_E", status: "active" }),
        ],
      });
      const res = await send(
        makeEvent(
          "customer.subscription.deleted",
          makeSubscription({ id: "sub_S", status: "canceled" }),
          3000,
          "evt_surv",
        ),
      );
      expect(res.status).toBe(200);
      expect(upsertCalls).toHaveLength(1);
      const row = upsertCalls[0] as Record<string, unknown>;
      // Entitling beats merely-live: sub_E (active), not sub_old (past_due).
      expect(row.stripe_subscription_id).toBe("sub_E");
      expect(row.status).toBe("active");
      expect(row.last_stripe_event_at).toBe(new Date(3000 * 1000).toISOString());
      expect(notifyErrorMock).toHaveBeenCalledTimes(1);
      expect(alertCtx()).toMatchObject({
        ended_sub: "sub_S",
        adopted_sub: "sub_E",
        reason: "survivor_adopted",
      });
    });

    it("tracked S deleted, no other live sub: row goes canceled, no alert", async () => {
      serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
      subscriptionsListMock.mockResolvedValueOnce({
        data: [makeSubscription({ id: "sub_S", status: "canceled" })],
      });
      const res = await send(
        makeEvent(
          "customer.subscription.deleted",
          makeSubscription({ id: "sub_S", status: "canceled" }),
          3000,
        ),
      );
      expect(res.status).toBe(200);
      const row = upsertCalls[0] as Record<string, unknown>;
      expect(row.stripe_subscription_id).toBe("sub_S");
      expect(row.status).toBe("canceled");
      expect(notifyErrorMock).not.toHaveBeenCalled();
    });

    it("tracked S deleted but listing the customer's subscriptions fails: 500, no write", async () => {
      serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
      subscriptionsListMock.mockRejectedValueOnce(new Error("stripe down"));
      const res = await send(
        makeEvent(
          "customer.subscription.deleted",
          makeSubscription({ id: "sub_S", status: "canceled" }),
          3000,
        ),
      );
      expect(res.status).toBe(500);
      expect(upsertCalls).toHaveLength(0);
    });

    it("stale deleted event for tracked S (older than watermark): dropped before any Stripe call", async () => {
      serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
      const res = await send(
        makeEvent(
          "customer.subscription.deleted",
          makeSubscription({ id: "sub_S", status: "canceled" }),
          1000,
        ),
      );
      expect(res.status).toBe(200);
      expect(upsertCalls).toHaveLength(0);
      expect(subscriptionsListMock).not.toHaveBeenCalled();
    });

    it("tracked S updated (still active): no survivor lookup", async () => {
      serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
      await send(
        makeEvent(
          "customer.subscription.updated",
          makeSubscription({ id: "sub_S", status: "active" }),
          3000,
        ),
      );
      expect(subscriptionsListMock).not.toHaveBeenCalled();
      expect((upsertCalls[0] as Record<string, unknown>).stripe_subscription_id).toBe("sub_S");
    });
  });

  it("(a) deleted event for a non-tracked sub while tracked S is live: no write, watermark untouched, one alert", async () => {
    serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
    const res = await send(
      makeEvent(
        "customer.subscription.deleted",
        makeSubscription({ id: "sub_E", status: "canceled" }),
        3000,
        "evt_a",
      ),
    );
    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(0);
    expect(subscriptionsRetrieveMock).not.toHaveBeenCalled();
    expect(notifyErrorMock).toHaveBeenCalledTimes(1);
    expect(alertCtx()).toMatchObject({
      event_id: "evt_a",
      tracked_sub: "sub_S",
      incoming_sub: "sub_E",
      reason: "non_entitling",
    });
  });

  it.each(["incomplete", "past_due", "unpaid", "paused", "incomplete_expired"])(
    "non-entitling %s event for a non-tracked sub: no write, alert",
    async (status) => {
      serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
      const res = await send(
        makeEvent(
          "customer.subscription.updated",
          makeSubscription({ id: "sub_E", status }),
          3000,
        ),
      );
      expect(res.status).toBe(200);
      expect(upsertCalls).toHaveLength(0);
      expect(notifyErrorMock).toHaveBeenCalledTimes(1);
    },
  );

  it("(b) active event for a different sub while stored S is genuinely live: no write, alert", async () => {
    serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
    subscriptionsRetrieveMock.mockResolvedValueOnce(
      makeSubscription({ id: "sub_S", status: "active" }),
    );
    const res = await send(
      makeEvent(
        "customer.subscription.updated",
        makeSubscription({ id: "sub_E", status: "active" }),
        3000,
      ),
    );
    expect(res.status).toBe(200);
    expect(subscriptionsRetrieveMock).toHaveBeenCalledWith("sub_S");
    expect(upsertCalls).toHaveLength(0);
    expect(notifyErrorMock).toHaveBeenCalledTimes(1);
    expect(alertCtx().reason).toBe("duplicate");
  });

  it("(c) active E while Stripe says S is canceled: row adopts E, watermark advances to E's event", async () => {
    serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
    subscriptionsRetrieveMock.mockResolvedValueOnce(
      makeSubscription({ id: "sub_S", status: "canceled" }),
    );
    const res = await send(
      makeEvent(
        "customer.subscription.updated",
        makeSubscription({ id: "sub_E", status: "trialing" }),
        3000,
      ),
    );
    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    const row = upsertCalls[0] as Record<string, unknown>;
    expect(row.parent_id).toBe("parent-uuid-711");
    expect(row.stripe_subscription_id).toBe("sub_E");
    expect(row.status).toBe("trialing");
    expect(row.last_stripe_event_at).toBe(new Date(3000 * 1000).toISOString());
    expect(notifyErrorMock).not.toHaveBeenCalled();
  });

  it("(c2) active E while S is missing in Stripe (resource_missing): adopts E", async () => {
    serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
    subscriptionsRetrieveMock.mockRejectedValueOnce(
      Object.assign(new Error("No such subscription"), {
        code: "resource_missing",
      }),
    );
    const res = await send(
      makeEvent(
        "customer.subscription.created",
        makeSubscription({ id: "sub_E", status: "active" }),
        3000,
      ),
    );
    expect(res.status).toBe(200);
    expect(
      (upsertCalls[0] as Record<string, unknown>).stripe_subscription_id,
    ).toBe("sub_E");
  });

  it("(d) retrieving S throws: 500 so Stripe retries, no write", async () => {
    serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
    subscriptionsRetrieveMock.mockRejectedValueOnce(new Error("stripe down"));
    const res = await send(
      makeEvent(
        "customer.subscription.updated",
        makeSubscription({ id: "sub_E", status: "active" }),
        3000,
      ),
    );
    expect(res.status).toBe(500);
    expect(upsertCalls).toHaveLength(0);
  });

  it.each(["canceled", "incomplete_expired"])(
    "(e) different sub while stored row is %s: adopted as a re-subscribe, no retrieve, no alert",
    async (status) => {
      serviceMockImpl = makeServiceMock({ existingRow: trackedRow({ status }) });
      const res = await send(
        makeEvent(
          "customer.subscription.created",
          makeSubscription({ id: "sub_E", status: "active" }),
          3000,
        ),
      );
      expect(res.status).toBe(200);
      expect(subscriptionsRetrieveMock).not.toHaveBeenCalled();
      expect(upsertCalls).toHaveLength(1);
      expect(
        (upsertCalls[0] as Record<string, unknown>).stripe_subscription_id,
      ).toBe("sub_E");
      expect(notifyErrorMock).not.toHaveBeenCalled();
    },
  );

  it("(f) E === S and S null are unchanged: written, no retrieve, no alert", async () => {
    serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
    let res = await send(
      makeEvent(
        "customer.subscription.updated",
        makeSubscription({ id: "sub_S", status: "past_due" }),
        3000,
      ),
    );
    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);

    serviceMockImpl = makeServiceMock({
      existingRow: trackedRow({ stripe_subscription_id: null }),
    });
    res = await send(
      makeEvent(
        "customer.subscription.updated",
        makeSubscription({ id: "sub_E", status: "active" }),
        3000,
      ),
    );
    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(2);
    expect(subscriptionsRetrieveMock).not.toHaveBeenCalled();
    expect(notifyErrorMock).not.toHaveBeenCalled();
  });

  it("looks up the row by customer and reads the tracked subscription columns", async () => {
    serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
    await send(
      makeEvent(
        "customer.subscription.updated",
        makeSubscription({ id: "sub_S", customer: "cus_x" }),
        3000,
      ),
    );
    expect(selectCalls).toHaveLength(1);
    expect(selectCalls[0]).toMatchObject({
      col: "stripe_customer_id",
      val: "cus_x",
    });
    expect(selectCalls[0]!.cols).toContain("stripe_subscription_id");
    expect(selectCalls[0]!.cols).toContain("status");
  });

  // -------------------------------------------------------------------------
  // 17. FV-711 — checkout.session.completed
  // -------------------------------------------------------------------------
  const coSession = {
    id: "cs_711",
    object: "checkout.session",
    customer: "cus_711",
    subscription: "sub_E",
    payment_status: "paid",
    metadata: { parent_id: "parent-uuid-711" },
  };

  it("(g) checkout with two live subscriptions on the customer: row written, alert; with one: no alert", async () => {
    subscriptionsRetrieveMock.mockResolvedValueOnce(
      makeSubscription({ id: "sub_E", customer: "cus_711" }),
    );
    subscriptionsListMock.mockResolvedValueOnce({
      data: [
        makeSubscription({ id: "sub_E", status: "active" }),
        makeSubscription({ id: "sub_X", status: "trialing" }),
        makeSubscription({ id: "sub_old", status: "canceled" }),
      ],
    });
    let res = await send(
      makeEvent("checkout.session.completed", coSession, 2000, "evt_g"),
    );
    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    expect(subscriptionsListMock).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_711" }),
    );
    expect(notifyErrorMock).toHaveBeenCalledTimes(1);
    expect(alertCtx()).toMatchObject({
      event_id: "evt_g",
      live_subscriptions: "2",
    });

    notifyErrorMock.mockClear();
    subscriptionsRetrieveMock.mockResolvedValueOnce(
      makeSubscription({ id: "sub_E", customer: "cus_711" }),
    );
    res = await send(makeEvent("checkout.session.completed", coSession, 2000));
    expect(res.status).toBe(200);
    expect(notifyErrorMock).not.toHaveBeenCalled();
  });

  it("checkout for a different sub while the row tracks a genuinely live S: no write, one alert", async () => {
    serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
    subscriptionsRetrieveMock
      .mockResolvedValueOnce(makeSubscription({ id: "sub_E", customer: "cus_711" }))
      .mockResolvedValueOnce(makeSubscription({ id: "sub_S", status: "active" }));
    const res = await send(
      makeEvent("checkout.session.completed", coSession, 2000),
    );
    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(0);
    expect(selectCalls[0]).toMatchObject({
      col: "parent_id",
      val: "parent-uuid-711",
    });
    expect(subscriptionsListMock).not.toHaveBeenCalled();
    expect(notifyErrorMock).toHaveBeenCalledTimes(1);
    expect(alertCtx().reason).toBe("duplicate");
  });

  it("checkout for a different sub while Stripe says S is canceled: adopts E", async () => {
    serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
    subscriptionsRetrieveMock
      .mockResolvedValueOnce(makeSubscription({ id: "sub_E", customer: "cus_711" }))
      .mockResolvedValueOnce(makeSubscription({ id: "sub_S", status: "canceled" }));
    const res = await send(
      makeEvent("checkout.session.completed", coSession, 2000),
    );
    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    expect(
      (upsertCalls[0] as Record<string, unknown>).stripe_subscription_id,
    ).toBe("sub_E");
  });

  it("checkout: a failing customer list does not fail the event", async () => {
    subscriptionsRetrieveMock.mockResolvedValueOnce(
      makeSubscription({ id: "sub_E", customer: "cus_711" }),
    );
    subscriptionsListMock.mockRejectedValueOnce(new Error("list down"));
    const res = await send(
      makeEvent("checkout.session.completed", coSession, 2000),
    );
    expect(res.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    expect(notifyErrorMock).not.toHaveBeenCalled();
  });

  it("(h) alert payloads contain only opaque ids and counts (no email/name)", async () => {
    serviceMockImpl = makeServiceMock({ existingRow: trackedRow() });
    await send(
      makeEvent(
        "customer.subscription.deleted",
        makeSubscription({ id: "sub_E", status: "canceled" }),
        3000,
      ),
    );
    const [, , ctx] = notifyErrorMock.mock.calls[0]!;
    expect(JSON.stringify(notifyErrorMock.mock.calls[0])).not.toMatch(/@/);
    expect(Object.keys(ctx as object).sort()).toEqual([
      "customer",
      "event_id",
      "event_type",
      "incoming_status",
      "incoming_sub",
      "reason",
      "tracked_sub",
    ]);
  });
});
