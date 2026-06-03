/**
 * Pure mapping helpers: Stripe subscription events → `subscriptions` row shape.
 *
 * No DB writes here. The route handler calls these and then upserts the result.
 * This isolation makes the logic unit-testable without a live Stripe account or
 * a database connection.
 *
 * Allowed callers: the webhook route handler + tests. No client imports.
 */

import type Stripe from "stripe";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The subset of `subscriptions` columns that a Stripe event can populate.
 * `parent_id` is optional here because subscription.* events resolve it from
 * the existing row by `stripe_customer_id`; checkout.session.completed sets it
 * directly from Customer metadata.
 */
export type SubscriptionRow = {
  parent_id?: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  price_id: string | null;
  current_period_end: string | null; // ISO-8601 string for Supabase timestamptz
  cancel_at_period_end: boolean;
};

// Mirror the check constraint values from the migration.
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Maps a Stripe subscription status string to our internal enum.
 * Falls back to 'incomplete' for any unknown future status so the constraint
 * doesn't reject the row — a conservative default that still blocks access.
 */
export function toSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  const valid: SubscriptionStatus[] = [
    "active",
    "trialing",
    "past_due",
    "canceled",
    "incomplete",
    "incomplete_expired",
    "unpaid",
    "paused",
  ];
  if (valid.includes(stripeStatus as SubscriptionStatus)) {
    return stripeStatus as SubscriptionStatus;
  }
  console.warn(
    `[subscription-sync] Unknown Stripe status "${stripeStatus}", defaulting to "incomplete"`,
  );
  return "incomplete";
}

/**
 * Converts a Unix timestamp (seconds) or null to an ISO-8601 string for
 * Supabase's `timestamptz` columns.
 */
function unixToIso(unix: number | null | undefined): string | null {
  if (unix == null) return null;
  return new Date(unix * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Event mappers
// ---------------------------------------------------------------------------

/**
 * Builds a SubscriptionRow from a `Stripe.Subscription` object.
 *
 * Used by:
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *
 * `parent_id` is NOT set here — the caller resolves it by looking up the
 * existing row for `stripe_customer_id`. If no row exists yet for a
 * subscription.* event, the caller logs a warning and returns 200 (avoiding
 * Stripe retries) rather than creating an orphan row without a `parent_id`.
 *
 * The `stripe_customer_id` is always a string on the expanded object, but
 * Stripe types it as `string | Stripe.Customer | Stripe.DeletedCustomer` when
 * expanded. We extract the id safely.
 */
export function rowFromSubscription(sub: Stripe.Subscription): SubscriptionRow {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Use the first item's price — MVP has a single-item subscription.
  const firstItem = sub.items.data[0];
  const priceId = firstItem?.price?.id ?? null;

  return {
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: toSubscriptionStatus(sub.status),
    price_id: priceId,
    current_period_end: unixToIso(sub.current_period_end),
    cancel_at_period_end: sub.cancel_at_period_end,
  };
}

/**
 * Builds a SubscriptionRow from a `checkout.session.completed` event.
 *
 * This is the ONLY event that sets `parent_id`.
 *
 * ASSUMPTION: when creating the Stripe Checkout Session (future checkout
 * sub-issue), the caller sets:
 *   `customer_creation: 'always'` and
 *   `metadata: { parent_id: '<uuid>' }`   // session-level metadata
 * so this event carries `session.metadata.parent_id` (read below). Use
 * `metadata`, NOT `customer_metadata` — this mapper reads `session.metadata`.
 *
 * If `parent_id` is absent from metadata, this returns `undefined` for
 * `parent_id`; the caller must treat that as an unresolvable event and log
 * a warning (no DB write, return 200).
 *
 * Also note: `session.subscription` may be a string ID (not yet expanded);
 * the actual subscription object comes in via `customer.subscription.created`
 * which fires in the same webhook cycle. This mapper captures what's available
 * in the checkout event for a provisional row insert/upsert. The subscription
 * status from checkout is typically 'active' or 'trialing'.
 */
export function rowFromCheckoutSession(
  session: Stripe.Checkout.Session,
): SubscriptionRow | null {
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  if (!customerId) {
    // Checkout without a Customer object — shouldn't happen with our config,
    // but guard defensively.
    return null;
  }

  const parentId = session.metadata?.parent_id ?? undefined;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  // The checkout session carries payment_status; map to subscription status.
  // A paid subscription is 'active'. We may not have the full subscription
  // object yet — customer.subscription.created will follow and overwrite.
  const status: SubscriptionStatus =
    session.payment_status === "paid" ? "active" : "incomplete";

  return {
    parent_id: parentId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    status,
    price_id: null, // populated by the following subscription.created event
    current_period_end: null, // populated by the following subscription.created event
    cancel_at_period_end: false,
  };
}
