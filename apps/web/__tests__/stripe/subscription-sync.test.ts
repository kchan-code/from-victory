/**
 * Unit tests for the subscription-sync pure mapper functions.
 *
 * No DB, no network, no live Stripe — inputs are plain objects shaped like
 * Stripe types. The tests verify that the mapper correctly transforms Stripe
 * event payloads into the row shape the webhook route will upsert.
 */

import { describe, it, expect } from "vitest";
import type Stripe from "stripe";

import {
  rowFromSubscription,
  rowFromCheckoutSession,
  toSubscriptionStatus,
  subscriptionFromInvoice,
} from "@/lib/stripe/subscription-sync";

// ---------------------------------------------------------------------------
// Helpers: minimal Stripe object factories (only the fields our mappers use)
// ---------------------------------------------------------------------------

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
    id = "sub_test123",
    customer = "cus_test456",
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
    cancel_at_period_end,
    items: {
      object: "list",
      data: [
        {
          id: "si_test",
          object: "subscription_item",
          current_period_end,
          price: {
            id: priceId,
            object: "price",
          } as Stripe.Price,
        } as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: "",
    },
  } as unknown as Stripe.Subscription;
}

function makeCheckoutSession(
  overrides: Partial<{
    id: string;
    customer: string;
    subscription: string;
    payment_status: Stripe.Checkout.Session.PaymentStatus;
    parentId: string;
  }> = {},
): Stripe.Checkout.Session {
  const {
    id = "cs_test789",
    customer = "cus_test456",
    subscription = "sub_test123",
    payment_status = "paid",
    parentId = "00000000-0000-0000-0000-000000000001",
  } = overrides;

  return {
    id,
    object: "checkout.session",
    customer,
    subscription,
    payment_status,
    metadata: parentId ? { parent_id: parentId } : {},
  } as unknown as Stripe.Checkout.Session;
}

// ---------------------------------------------------------------------------
// toSubscriptionStatus
// ---------------------------------------------------------------------------

describe("toSubscriptionStatus", () => {
  it("passes through all known valid statuses unchanged", () => {
    const valid = [
      "active",
      "trialing",
      "past_due",
      "canceled",
      "incomplete",
      "incomplete_expired",
      "unpaid",
      "paused",
    ] as const;

    for (const s of valid) {
      expect(toSubscriptionStatus(s)).toBe(s);
    }
  });

  it("falls back to 'incomplete' for an unknown status", () => {
    expect(toSubscriptionStatus("some_future_stripe_status")).toBe("incomplete");
  });
});

// ---------------------------------------------------------------------------
// rowFromSubscription
// ---------------------------------------------------------------------------

describe("rowFromSubscription", () => {
  it("maps an active subscription to the correct row shape", () => {
    const sub = makeSubscription({
      id: "sub_abc",
      customer: "cus_xyz",
      status: "active",
      current_period_end: 1800000000,
      cancel_at_period_end: false,
      priceId: "price_monthly_899",
    });

    const row = rowFromSubscription(sub);

    expect(row.stripe_customer_id).toBe("cus_xyz");
    expect(row.stripe_subscription_id).toBe("sub_abc");
    expect(row.status).toBe("active");
    expect(row.price_id).toBe("price_monthly_899");
    expect(row.current_period_end).toBe(
      new Date(1800000000 * 1000).toISOString(),
    );
    expect(row.cancel_at_period_end).toBe(false);
    // parent_id is NOT set by this mapper — caller resolves it.
    expect(row.parent_id).toBeUndefined();
  });

  it("maps a canceled subscription correctly", () => {
    const sub = makeSubscription({
      status: "canceled",
      cancel_at_period_end: false,
    });

    const row = rowFromSubscription(sub);

    expect(row.status).toBe("canceled");
    expect(row.cancel_at_period_end).toBe(false);
  });

  it("maps cancel_at_period_end=true correctly", () => {
    const sub = makeSubscription({
      status: "active",
      cancel_at_period_end: true,
    });

    const row = rowFromSubscription(sub);

    expect(row.status).toBe("active");
    expect(row.cancel_at_period_end).toBe(true);
  });

  it("maps past_due status correctly", () => {
    const sub = makeSubscription({ status: "past_due" });
    const row = rowFromSubscription(sub);
    expect(row.status).toBe("past_due");
  });

  it("handles an expanded customer object (extracts id)", () => {
    const sub = makeSubscription();
    // Replace string customer with an expanded Customer object.
    (sub as unknown as Record<string, unknown>).customer = {
      id: "cus_expanded",
      object: "customer",
    };

    const row = rowFromSubscription(sub);
    expect(row.stripe_customer_id).toBe("cus_expanded");
  });

  it("maps current_period_end unix timestamp to ISO-8601 string", () => {
    // Unix 0 = 1970-01-01T00:00:00.000Z — basil: field lives on the item.
    const sub = makeSubscription({ current_period_end: 0 });
    const row = rowFromSubscription(sub);
    expect(row.current_period_end).toBe("1970-01-01T00:00:00.000Z");
  });

  it("falls back to pre-basil subscription.current_period_end when the item lacks it", () => {
    const sub = makeSubscription({ current_period_end: 1800000000 });
    delete (sub.items.data[0] as { current_period_end?: number }).current_period_end;
    (sub as unknown as { current_period_end: number }).current_period_end = 1_700_000_000;

    const row = rowFromSubscription(sub);
    expect(row.current_period_end).toBe(
      new Date(1_700_000_000 * 1000).toISOString(),
    );
  });
});

// ---------------------------------------------------------------------------
// rowFromCheckoutSession
// ---------------------------------------------------------------------------

describe("rowFromCheckoutSession", () => {
  it("maps a completed checkout session with parent_id metadata", () => {
    const session = makeCheckoutSession({
      customer: "cus_abc",
      subscription: "sub_abc",
      payment_status: "paid",
      parentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    });

    const row = rowFromCheckoutSession(session);

    expect(row).not.toBeNull();
    expect(row!.stripe_customer_id).toBe("cus_abc");
    expect(row!.stripe_subscription_id).toBe("sub_abc");
    expect(row!.parent_id).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(row!.status).toBe("active");
    expect(row!.cancel_at_period_end).toBe(false);
  });

  it("returns parent_id=undefined when metadata.parent_id is missing", () => {
    const session = makeCheckoutSession({ parentId: "" });
    // Override metadata to be empty.
    (session as unknown as Record<string, unknown>).metadata = {};

    const row = rowFromCheckoutSession(session);

    // Row is returned (customer is present) but parent_id is undefined.
    expect(row).not.toBeNull();
    expect(row!.parent_id).toBeUndefined();
  });

  it("returns null when no customer on the session", () => {
    const session = makeCheckoutSession();
    (session as unknown as Record<string, unknown>).customer = null;

    const row = rowFromCheckoutSession(session);
    expect(row).toBeNull();
  });

  it("maps payment_status=unpaid to status=incomplete", () => {
    const session = makeCheckoutSession({ payment_status: "unpaid" });
    const row = rowFromCheckoutSession(session);
    expect(row!.status).toBe("incomplete");
  });

  it("sets price_id and current_period_end to null (populated by subscription.created)", () => {
    const session = makeCheckoutSession();
    const row = rowFromCheckoutSession(session);
    expect(row!.price_id).toBeNull();
    expect(row!.current_period_end).toBeNull();
  });

  it("maps payment_status='no_payment_required' to status='incomplete'", () => {
    const session = makeCheckoutSession({
      payment_status: "no_payment_required" as Stripe.Checkout.Session.PaymentStatus,
    });
    const row = rowFromCheckoutSession(session);
    expect(row!.status).toBe("incomplete");
  });
});

// ---------------------------------------------------------------------------
// subscriptionFromInvoice (basil parent field + pre-basil fallback)
// ---------------------------------------------------------------------------

describe("subscriptionFromInvoice", () => {
  function makeInvoice(
    overrides: Partial<{
      parentSubscription: string | Stripe.Subscription | null;
      parentType: "subscription_details" | "quote_details";
      legacySubscription: string | Stripe.Subscription | null;
    }> = {},
  ): Stripe.Invoice {
    const {
      parentSubscription,
      parentType = "subscription_details",
      legacySubscription,
    } = overrides;

    const invoice: Record<string, unknown> = {
      id: "in_test",
      object: "invoice",
      parent: null,
    };

    if (parentSubscription != null) {
      invoice.parent = {
        type: parentType,
        subscription_details:
          parentType === "subscription_details"
            ? { subscription: parentSubscription }
            : null,
        quote_details: parentType === "quote_details" ? { quote: "qt_test" } : null,
      };
    }

    if (legacySubscription !== undefined) {
      invoice.subscription = legacySubscription;
    }

    return invoice as unknown as Stripe.Invoice;
  }

  it("returns the expanded object from parent.subscription_details", () => {
    const sub = makeSubscription({ id: "sub_expanded" });
    const found = subscriptionFromInvoice(
      makeInvoice({ parentSubscription: sub }),
    );
    expect(found).toBe(sub);
  });

  it("returns a string ID from parent.subscription_details", () => {
    const found = subscriptionFromInvoice(
      makeInvoice({ parentSubscription: "sub_id_only" }),
    );
    expect(found).toBe("sub_id_only");
  });

  it("returns null when parent is not subscription_details", () => {
    const found = subscriptionFromInvoice(
      makeInvoice({
        parentSubscription: "sub_ignored",
        parentType: "quote_details",
      }),
    );
    expect(found).toBeNull();
  });

  it("falls back to pre-basil invoice.subscription", () => {
    const sub = makeSubscription({ id: "sub_legacy" });
    const found = subscriptionFromInvoice(
      makeInvoice({ legacySubscription: sub }),
    );
    expect(found).toBe(sub);
  });

  it("prefers the basil parent field over a legacy top-level subscription", () => {
    const parentSub = makeSubscription({ id: "sub_parent" });
    const legacySub = makeSubscription({ id: "sub_legacy" });
    const found = subscriptionFromInvoice(
      makeInvoice({
        parentSubscription: parentSub,
        legacySubscription: legacySub,
      }),
    );
    expect(found).toBe(parentSub);
  });
});
