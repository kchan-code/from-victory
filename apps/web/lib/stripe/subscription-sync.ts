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
    current_period_end: unixToIso(periodEndUnix(sub)),
    cancel_at_period_end: sub.cancel_at_period_end,
  };
}

/**
 * The Stripe-sourced `subscriptions` columns written for a subscription.*
 * sync. Shared by the webhook upsert and the reconcile cron (FV-709) so both
 * write the identical field set; callers add `parent_id` / the
 * `last_stripe_event_at` watermark themselves.
 */
export function stripeFieldsFromRow(row: SubscriptionRow) {
  return {
    stripe_customer_id: row.stripe_customer_id,
    stripe_subscription_id: row.stripe_subscription_id,
    status: row.status,
    price_id: row.price_id,
    current_period_end: row.current_period_end,
    cancel_at_period_end: row.cancel_at_period_end,
  };
}

/** Statuses after which a subscription is over; a different one may replace it. */
export const TERMINAL_STATUSES: ReadonlySet<string> = new Set(["canceled", "incomplete_expired"]);
/** Statuses that grant full access (see lib/subscriptions/access-level.ts). */
export const ENTITLING_STATUSES: ReadonlySet<string> = new Set(["active", "trialing"]);
/**
 * Statuses in which a subscription is still a live, billable relationship.
 * `incomplete` is deliberately NOT live: nothing has been charged and it
 * expires on its own, so it must not block a paid replacement.
 */
export const LIVE_STATUSES: ReadonlySet<string> = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);

/**
 * A customer's tracked subscription has ended. If the customer still has
 * another live subscription, return it so the row can move to it instead of
 * going `canceled` while the family is still paying (FV-711). Entitling
 * subscriptions win, then the newest.
 *
 * Throws on a Stripe error — callers must not write `canceled` on a guess.
 */
export async function findSurvivingSubscription(
  stripe: Stripe,
  customerId: string,
  endedSubscriptionId: string,
  options?: Stripe.RequestOptions,
): Promise<Stripe.Subscription | null> {
  const subs = await stripe.subscriptions.list(
    { customer: customerId, status: "all", limit: 20 },
    options,
  );
  const live = subs.data.filter(
    (s) => s.id !== endedSubscriptionId && LIVE_STATUSES.has(s.status),
  );
  if (live.length === 0) return null;
  const rank = (s: Stripe.Subscription) => (ENTITLING_STATUSES.has(s.status) ? 1 : 0);
  live.sort((a, b) => rank(b) - rank(a) || b.created - a.created);
  return live[0] ?? null;
}

/**
 * Resolves the subscription reference on an invoice.
 *
 * Stripe API 2025-03-31.basil removed `Invoice.subscription` in favor of
 * `invoice.parent.subscription_details.subscription` (when `parent.type ===
 * "subscription_details"`). Dashboard webhook endpoints still pinned to
 * `2024-06-20` send the legacy top-level field. Read the basil location
 * first, then fall back so an expanded object is not missed under either
 * payload shape.
 *
 * Returns the expanded Subscription object, a subscription ID string, or
 * null when the invoice is not subscription-generated.
 */
export function subscriptionFromInvoice(
  invoice: Stripe.Invoice,
): string | Stripe.Subscription | null {
  if (invoice.parent?.type === "subscription_details") {
    const fromParent = invoice.parent.subscription_details?.subscription;
    if (fromParent) return fromParent;
  }

  const legacy = (invoice as InvoiceWithLegacySubscription).subscription;
  return legacy ?? null;
}

/**
 * Stripe API 2025-03-31.basil moved `current_period_end` from the
 * Subscription object onto each SubscriptionItem. Webhook payloads on
 * `2024-06-20` still send it on the subscription. Prefer the typed
 * item-level field, then the legacy subscription-level field.
 */
function periodEndUnix(sub: Stripe.Subscription): number | null | undefined {
  const fromItem = sub.items?.data?.[0]?.current_period_end;
  if (typeof fromItem === "number") return fromItem;
  return (sub as SubscriptionWithLegacyPeriodEnd).current_period_end;
}

/** Pre-basil Invoice still carried `subscription` at the top level. */
type InvoiceWithLegacySubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

/** Pre-basil Subscription still carried `current_period_end` at the top level. */
type SubscriptionWithLegacyPeriodEnd = Stripe.Subscription & {
  current_period_end?: number | null;
};

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
