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
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: constructEventMock,
    },
  }),
}));

// Mutable service mock — replaced per test via makeServiceMock().
let upsertCalls: unknown[] = [];
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
  }> = {},
): Stripe.Invoice {
  const { id = "in_test", subscription = null } = overrides;
  return { id, object: "invoice", subscription } as unknown as Stripe.Invoice;
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
      select: (_cols: string) => ({
        eq: (_col: string, _val: unknown) => ({
          maybeSingle: async () => ({
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
});
