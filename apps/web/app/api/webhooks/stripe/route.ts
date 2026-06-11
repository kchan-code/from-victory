/**
 * Stripe webhook handler.
 *
 * POST /api/webhooks/stripe
 *
 * Security contract:
 *   - Every request is signature-verified against `STRIPE_WEBHOOK_SECRET`
 *     before any payload is processed. Missing secret or invalid signature →
 *     400 immediately (no processing, no DB write).
 *   - The raw request body is read as text before any transformation so
 *     Stripe's byte-exact HMAC verification passes. The middleware matcher in
 *     middleware.ts already excludes `api/webhooks` from session-refresh, which
 *     would otherwise buffer/transform the body and break the signature.
 *   - No PII is logged. Billing identifiers (cus_*, sub_*) may appear in logs;
 *     user names, emails, birthdates, journal content, and IP-derived data are
 *     never logged.
 *
 * Idempotency:
 *   All writes are Supabase upserts (merge on primary key or unique index).
 *   Stripe may re-deliver the same event; re-processing overwrites the row
 *   with identical data, which is safe.
 *
 *   Ordering / out-of-order protection:
 *   Stripe does NOT guarantee delivery order. A redelivered stale
 *   `customer.subscription.*` event (older `event.created`) could overwrite a
 *   newer status with an older one. To prevent this, the `subscriptions` table
 *   stores a `last_stripe_event_at` watermark (added in migration
 *   20260610120000). The `handleSubscriptionUpsert` path reads the watermark
 *   and skips any event whose `event.created` (ms) is older than the stored
 *   value. `checkout.session.completed` is intentionally excluded from this
 *   check — it must never advance the watermark, so a legitimately-redelivered
 *   `subscription.created` (carrying `price_id`) is never wrongly skipped.
 *
 * Retry semantics:
 *   - 200: event processed successfully, OR event type ignored intentionally.
 *     Stripe will NOT retry.
 *   - 400: permanent error (bad signature, missing secret). Stripe will NOT
 *     retry (it considers 4xx client errors terminal).
 *   - 500: transient error (DB write failed, unexpected throw). Stripe WILL
 *     retry with backoff — appropriate for infrastructure-level failures.
 *
 * `parent_id` ↔ `stripe_customer_id` association:
 *   When the parent initiates checkout (future sub-issue), the Checkout
 *   Session must be created with `metadata: { parent_id: '<uuid>' }`. The
 *   `checkout.session.completed` event carries that metadata, and this handler
 *   reads it to link the Stripe Customer to the parent row on first write.
 *   Subsequent subscription.* events resolve `parent_id` from the existing row
 *   by matching on `stripe_customer_id`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getStripe } from "@/lib/stripe/server";
import {
  rowFromCheckoutSession,
  rowFromSubscription,
} from "@/lib/stripe/subscription-sync";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { createServiceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Verify the webhook secret is configured.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Log clearly (no sensitive values) and return 400. This is a
    // configuration error, not a transient one — retries won't fix it.
    console.error(
      "[stripe/webhook] STRIPE_WEBHOOK_SECRET is not configured. " +
        "Webhook cannot be verified. Set this env var and redeploy.",
    );
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 400 },
    );
  }

  // 2. Read the raw body as text (byte-exact, required for HMAC verification).
  const rawBody = await req.text();

  // 3. Extract the Stripe-Signature header.
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  // 4. Verify the signature. Throws on failure.
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (err) {
    // Invalid signature — could be a replay, tampering, or misconfiguration.
    // Log the message only (no secret, no signature, no body).
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[stripe/webhook] Signature verification failed: ${message}`);
    return NextResponse.json(
      { error: "Webhook signature verification failed." },
      { status: 400 },
    );
  }

  // 5. Dispatch to the appropriate handler. Wrap in try/catch so unexpected
  //    throws return 500 (Stripe retries) rather than crashing the process.
  try {
    await handleEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[stripe/webhook] Error processing event type="${event.type}" id="${event.id}": ${message}`,
    );
    deliverInBackground(notifyError("[stripe/webhook] handleEvent failed", message, {
      event_type: event.type,
      event_id: event.id,
    }));
    // 500 tells Stripe to retry — appropriate for transient DB/infra failures.
    return NextResponse.json(
      { error: "Internal error processing webhook." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Event dispatcher
// ---------------------------------------------------------------------------

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(
        event.data.object as Stripe.Subscription,
        event.type,
        event.created,
      );
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription,
        event.created,
      );
      break;

    case "invoice.payment_failed":
      // Update status to reflect the billing failure — the subscription's own
      // status field is the authoritative source of truth (Stripe will set it
      // to `past_due` or `unpaid`), so we sync from the subscription object
      // embedded in the invoice when available.
      await handleInvoicePaymentFailed(
        event.data.object as Stripe.Invoice,
        event.created,
      );
      break;

    default:
      // Intentionally ignored. Return 200 so Stripe doesn't retry.
      console.info(
        `[stripe/webhook] Ignored unhandled event type="${event.type}" id="${event.id}"`,
      );
      break;
  }
}

// ---------------------------------------------------------------------------
// Individual event handlers
// ---------------------------------------------------------------------------

/**
 * checkout.session.completed
 *
 * First event that binds a Stripe Customer to a parent row. Reads
 * `session.metadata.parent_id` (set during checkout session creation — see
 * file-level comment above).
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const row = rowFromCheckoutSession(session);

  if (!row) {
    console.warn(
      `[stripe/webhook] checkout.session.completed: could not extract customer — ` +
        `session id="${session.id}". Ignoring.`,
    );
    return;
  }

  if (!row.parent_id) {
    console.warn(
      `[stripe/webhook] checkout.session.completed: metadata.parent_id missing for ` +
        `customer="${row.stripe_customer_id}" session="${session.id}". ` +
        `Checkout session must include metadata: { parent_id: '<uuid>' }. Ignoring.`,
    );
    return;
  }

  const service = createServiceClient();
  const { error } = await service.from("subscriptions").upsert(
    {
      parent_id: row.parent_id,
      stripe_customer_id: row.stripe_customer_id,
      stripe_subscription_id: row.stripe_subscription_id,
      status: row.status,
      price_id: row.price_id,
      current_period_end: row.current_period_end,
      cancel_at_period_end: row.cancel_at_period_end,
    },
    {
      // Upsert on parent_id (the PK). If a row exists, overwrite the
      // Stripe-sourced fields. This is naturally idempotent.
      onConflict: "parent_id",
    },
  );

  if (error) {
    throw new Error(
      `[stripe/webhook] checkout.session.completed DB upsert failed: ${error.message}`,
    );
  }

  console.info(
    `[stripe/webhook] checkout.session.completed: upserted subscription row ` +
      `for customer="${row.stripe_customer_id}"`,
  );
}

/**
 * customer.subscription.created / customer.subscription.updated
 *
 * Resolves `parent_id` from the existing row by `stripe_customer_id`.
 * If no row exists yet, we cannot safely create one (no `parent_id`).
 * In practice `checkout.session.completed` fires first and creates the row.
 *
 * `eventCreated` is the Unix-seconds timestamp from the Stripe event. It is
 * written to `last_stripe_event_at` and used as a watermark to skip stale
 * redeliveries — see file-level comment on ordering / out-of-order protection.
 */
async function handleSubscriptionUpsert(
  sub: Stripe.Subscription,
  eventType: string,
  eventCreated: number,
): Promise<void> {
  const row = rowFromSubscription(sub);
  const service = createServiceClient();

  // Resolve parent_id and the existing watermark for this customer.
  const { data: existing, error: lookupError } = await service
    .from("subscriptions")
    .select("parent_id, last_stripe_event_at")
    .eq("stripe_customer_id", row.stripe_customer_id)
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      `[stripe/webhook] ${eventType}: lookup by stripe_customer_id failed: ${lookupError.message}`,
    );
  }

  if (!existing) {
    // No row yet — checkout event hasn't landed or was not handled. Log and
    // return 200 to avoid infinite retries. The issue will self-heal when the
    // checkout event is re-delivered or when the parent completes checkout.
    console.warn(
      `[stripe/webhook] ${eventType}: no subscription row found for ` +
        `customer="${row.stripe_customer_id}" sub="${row.stripe_subscription_id}". ` +
        `Ignoring — row should be created by checkout.session.completed first.`,
    );
    return;
  }

  // Out-of-order protection: skip events older than the watermark.
  const incomingMs = eventCreated * 1000;
  const storedMs = existing.last_stripe_event_at
    ? Date.parse(existing.last_stripe_event_at)
    : NaN;
  if (Number.isFinite(storedMs) && incomingMs < storedMs) {
    console.warn(
      `[stripe/webhook] ${eventType}: skipping stale event (created=${eventCreated}) ` +
        `for sub="${row.stripe_subscription_id}" — newer state already applied. ` +
        `No write.`,
    );
    return;
  }

  const { error } = await service.from("subscriptions").upsert(
    {
      parent_id: existing.parent_id,
      stripe_customer_id: row.stripe_customer_id,
      stripe_subscription_id: row.stripe_subscription_id,
      status: row.status,
      price_id: row.price_id,
      current_period_end: row.current_period_end,
      cancel_at_period_end: row.cancel_at_period_end,
      last_stripe_event_at: new Date(eventCreated * 1000).toISOString(),
    },
    { onConflict: "parent_id" },
  );

  if (error) {
    throw new Error(
      `[stripe/webhook] ${eventType} DB upsert failed: ${error.message}`,
    );
  }

  console.info(
    `[stripe/webhook] ${eventType}: synced sub="${row.stripe_subscription_id}" ` +
      `status="${row.status}"`,
  );
}

/**
 * customer.subscription.deleted
 *
 * Stripe sets the status to `canceled` before firing this event. The
 * `rowFromSubscription` mapper will produce `status: 'canceled'`, which is
 * what we upsert. The row stays in the DB for audit; cascading delete from
 * `auth.users` → `profiles` → `subscriptions` handles final cleanup when the
 * parent account is deleted.
 */
async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
  eventCreated: number,
): Promise<void> {
  // Reuse the upsert path — the status will be 'canceled'.
  await handleSubscriptionUpsert(sub, "customer.subscription.deleted", eventCreated);
}

/**
 * invoice.payment_failed
 *
 * Stripe will also fire `customer.subscription.updated` alongside this event
 * with the updated status (typically `past_due`). We sync from the invoice's
 * embedded subscription if present, otherwise log and return — the subscription
 * update event will handle it.
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  eventCreated: number,
): Promise<void> {
  // The subscription object may be expanded on the invoice or may be an ID.
  // If it's an object, sync it directly. If it's just an ID, the accompanying
  // subscription.updated event will handle it — don't make an extra API call.
  const subData = invoice.subscription;

  if (typeof subData === "object" && subData !== null) {
    await handleSubscriptionUpsert(
      subData as Stripe.Subscription,
      "invoice.payment_failed",
      eventCreated,
    );
    return;
  }

  console.info(
    `[stripe/webhook] invoice.payment_failed: subscription not expanded on invoice ` +
      `id="${invoice.id}". customer.subscription.updated will handle status sync.`,
  );
}
