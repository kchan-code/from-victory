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
 *   Checkout / subscription.created race (FV-182):
 *   Stripe emits `checkout.session.completed` and `customer.subscription.created`
 *   within the same second, in either order. If subscription.created lands first
 *   there is no row yet (parent_id is only known from checkout metadata), so it
 *   is ignored. To keep the checkout-created row correct regardless of order,
 *   `handleCheckoutSessionCompleted` does a compensating read: it retrieves the
 *   Subscription from Stripe and maps it with `rowFromSubscription`, so status
 *   (e.g. `trialing`), price_id and current_period_end are authoritative rather
 *   than provisional. A retrieve failure throws → 500 → Stripe retries.
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
  ENTITLING_STATUSES,
  LIVE_STATUSES,
  TERMINAL_STATUSES,
  findSurvivingSubscription,
  rowFromSubscription,
  stripeFieldsFromRow,
  subscriptionFromInvoice,
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
        event.id,
      );
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(
        event.data.object as Stripe.Subscription,
        event.type,
        event.created,
        event.id,
      );
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription,
        event.created,
        event.id,
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
        event.id,
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
// Tracked-subscription guard (FV-711)
// ---------------------------------------------------------------------------

type TrackedRow = {
  stripe_subscription_id?: string | null;
  status?: string | null;
};

type AdoptionDecision =
  // `replaced` is set when E displaced a tracked subscription that Stripe
  // still reports as billable-but-unpaid (past_due / unpaid / paused).
  | { action: "adopt"; replaced?: string }
  // `terminal`: the non-tracked subscription's event says it is over.
  | { action: "skip"; reason: "non_entitling" | "duplicate"; terminal?: boolean };

function isResourceMissing(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === "resource_missing"
  );
}

/**
 * Decides whether the subscription an event carries (E) may be written over
 * the row's tracked subscription (S). See FV-711.
 *
 *   E === S, or S null            -> adopt (unchanged behaviour)
 *   S terminal                    -> adopt (normal re-subscribe)
 *   S non-terminal, E not
 *     active/trialing             -> skip: an event about a different
 *                                    subscription must not touch tracked S
 *   S non-terminal, E entitling   -> retrieve S from Stripe (the row may be
 *                                    stale):
 *                                      S active/trialing -> skip (duplicate)
 *                                      S past_due/unpaid/paused -> adopt E
 *                                        (a paid replacement for a failed
 *                                        subscription is a re-subscribe;
 *                                        refusing it would leave a paying
 *                                        family degraded) and alert, since S
 *                                        may still bill if it recovers
 *                                      S over / missing -> adopt E
 *
 * A Stripe error other than resource_missing is rethrown (route -> 500 ->
 * Stripe retries). Never guesses.
 */
async function decideAdoption(
  tracked: TrackedRow | null | undefined,
  incoming: { stripe_subscription_id: string | null; status: string },
): Promise<AdoptionDecision> {
  const storedId = tracked?.stripe_subscription_id ?? null;
  if (!storedId || storedId === incoming.stripe_subscription_id) {
    return { action: "adopt" };
  }
  if (tracked?.status && TERMINAL_STATUSES.has(tracked.status)) {
    return { action: "adopt" };
  }
  if (!ENTITLING_STATUSES.has(incoming.status)) {
    return {
      action: "skip",
      reason: "non_entitling",
      terminal: TERMINAL_STATUSES.has(incoming.status),
    };
  }
  try {
    const stored = await getStripe().subscriptions.retrieve(storedId);
    if (ENTITLING_STATUSES.has(stored.status)) {
      return { action: "skip", reason: "duplicate" };
    }
    return TERMINAL_STATUSES.has(stored.status) || stored.status === "incomplete"
      ? { action: "adopt" }
      : { action: "adopt", replaced: stored.status };
  } catch (err) {
    if (isResourceMissing(err)) return { action: "adopt" };
    throw err;
  }
}

/** One alert per event. Opaque ids only: no emails, names or athlete data. */
function alertSubscriptionConflict(
  message: string,
  context: Record<string, string>,
): void {
  deliverInBackground(
    notifyError("[stripe/webhook] subscription conflict", message, context),
  );
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
 *
 * `customer.subscription.created` may be delivered BEFORE this event (no row
 * yet → it is ignored). So when the session has a subscription we fetch it
 * from Stripe and take status / price / period end / cancel flag from it
 * (FV-182), instead of the provisional checkout-derived values. `parent_id`
 * still comes from session metadata. This path never writes
 * `last_stripe_event_at` (FV-63) — a later subscription.* event must not be
 * skipped by the watermark.
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  eventId: string,
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

  // Compensating read (FV-182). Throws on failure → route returns 500 and
  // Stripe retries; we never write a row with fabricated values.
  let synced = row;
  if (row.stripe_subscription_id) {
    const sub = await getStripe().subscriptions.retrieve(
      row.stripe_subscription_id,
    );
    synced = { ...rowFromSubscription(sub), parent_id: row.parent_id };
  }

  const service = createServiceClient();

  // FV-711: never replace a genuinely live tracked subscription with a
  // different one. The second checkout's payer is then billed for a
  // subscription we do not track; ops is alerted (no auto-cancel/refund).
  if (synced.stripe_subscription_id) {
    const { data: tracked, error: trackedError } = await service
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("parent_id", row.parent_id)
      .maybeSingle();
    if (trackedError) {
      throw new Error(
        `[stripe/webhook] checkout.session.completed: lookup by parent_id failed: ${trackedError.message}`,
      );
    }
    const decision = await decideAdoption(tracked, synced);
    if (decision.action === "skip") {
      console.warn(
        `[stripe/webhook] checkout.session.completed: not replacing tracked ` +
          `sub="${tracked?.stripe_subscription_id}" with sub="${synced.stripe_subscription_id}" ` +
          `(${decision.reason}). No write.`,
      );
      alertSubscriptionConflict(
        decision.reason === "duplicate"
          ? "checkout completed for a second live subscription on one customer; row kept on the tracked subscription"
          : "checkout completed with a non-entitling subscription while another is tracked; row not changed",
        {
          event_type: "checkout.session.completed",
          event_id: eventId,
          customer: row.stripe_customer_id,
          tracked_sub: tracked?.stripe_subscription_id ?? "",
          incoming_sub: synced.stripe_subscription_id,
          incoming_status: synced.status,
          reason: decision.reason,
        },
      );
      return;
    }
  }

  const { error } = await service.from("subscriptions").upsert(
    {
      parent_id: row.parent_id,
      // Customer id stays the checkout session's (same customer by definition).
      stripe_customer_id: row.stripe_customer_id,
      stripe_subscription_id: synced.stripe_subscription_id,
      status: synced.status,
      price_id: synced.price_id,
      current_period_end: synced.current_period_end,
      cancel_at_period_end: synced.cancel_at_period_end,
      // NOTE: last_stripe_event_at is intentionally NOT written (FV-63).
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
      `for customer="${row.stripe_customer_id}" status="${synced.status}"`,
  );

  // FV-711: advisory duplicate check. Best-effort: the row is already
  // correct, so a failed list must not 500 the event.
  try {
    const subs = await getStripe().subscriptions.list({
      customer: row.stripe_customer_id,
      status: "all",
      limit: 20,
    });
    const live = subs.data.filter((s) => LIVE_STATUSES.has(s.status)).length;
    if (live > 1) {
      alertSubscriptionConflict(
        "customer has more than one live subscription in Stripe",
        {
          event_type: "checkout.session.completed",
          event_id: eventId,
          customer: row.stripe_customer_id,
          live_subscriptions: String(live),
        },
      );
    }
  } catch (err) {
    console.warn(
      `[stripe/webhook] checkout.session.completed: duplicate-subscription check failed: ` +
        `${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * customer.subscription.created / customer.subscription.updated
 *
 * Resolves `parent_id` from the existing row by `stripe_customer_id`.
 * If no row exists yet, we cannot safely create one (no `parent_id`).
 * `checkout.session.completed` creates the row, but Stripe may deliver this
 * event first (same-second race). In that case it is ignored here and the
 * checkout handler's compensating read (FV-182) populates the row instead.
 *
 * `eventCreated` is the Unix-seconds timestamp from the Stripe event. It is
 * written to `last_stripe_event_at` and used as a watermark to skip stale
 * redeliveries — see file-level comment on ordering / out-of-order protection.
 */
async function handleSubscriptionUpsert(
  sub: Stripe.Subscription,
  eventType: string,
  eventCreated: number,
  eventId: string,
): Promise<void> {
  const row = rowFromSubscription(sub);
  const service = createServiceClient();

  // Resolve parent_id and the existing watermark for this customer.
  const { data: existing, error: lookupError } = await service
    .from("subscriptions")
    .select("parent_id, last_stripe_event_at, stripe_subscription_id, status")
    .eq("stripe_customer_id", row.stripe_customer_id)
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      `[stripe/webhook] ${eventType}: lookup by stripe_customer_id failed: ${lookupError.message}`,
    );
  }

  if (!existing) {
    // No row yet — checkout event hasn't landed (or was not handled). Log and
    // return 200 to avoid infinite retries. Checkout's compensating read
    // (FV-182) fills the row from Stripe when it arrives.
    console.warn(
      `[stripe/webhook] ${eventType}: no subscription row found for ` +
        `customer="${row.stripe_customer_id}" sub="${row.stripe_subscription_id}". ` +
        `Ignoring — checkout.session.completed will create the row from a ` +
        `fresh subscription read (FV-182).`,
    );
    return;
  }

  // FV-711: an event about a subscription other than the tracked one must not
  // overwrite the row. A skip never writes, so the watermark (which belongs to
  // the tracked subscription) is untouched.
  const decision = await decideAdoption(existing, row);
  if (decision.action === "skip") {
    console.warn(
      `[stripe/webhook] ${eventType}: sub="${row.stripe_subscription_id}" is not the ` +
        `tracked sub="${existing.stripe_subscription_id}" (${decision.reason}). No write.`,
    );
    // A non-tracked subscription ending is the duplicate resolving itself
    // (or a late redelivery after a re-subscribe): nothing for ops to do, so
    // log only. Everything else is a live second subscription: alert.
    if (!decision.terminal) {
      alertSubscriptionConflict(
        decision.reason === "duplicate"
          ? "second live subscription on one customer; row kept on the tracked subscription"
          : "event for a non-tracked subscription ignored; tracked subscription untouched",
        {
          event_type: eventType,
          event_id: eventId,
          customer: row.stripe_customer_id,
          tracked_sub: existing.stripe_subscription_id ?? "",
          incoming_sub: row.stripe_subscription_id ?? "",
          incoming_status: row.status,
          reason: decision.reason,
        },
      );
    }
    return;
  }
  if (decision.replaced) {
    alertSubscriptionConflict(
      "new paid subscription replaced an unpaid tracked one; the old subscription still exists in Stripe",
      {
        event_type: eventType,
        event_id: eventId,
        customer: row.stripe_customer_id,
        replaced_sub: existing.stripe_subscription_id ?? "",
        replaced_status: decision.replaced,
        adopted_sub: row.stripe_subscription_id ?? "",
        reason: "replaced_unpaid",
      },
    );
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

  // FV-711: when the TRACKED subscription ends, do not strand a family that
  // is still paying for another live subscription on the same customer (the
  // duplicate kept off the row above, e.g. after ops cancels the older one).
  // The survivor is read fresh from Stripe, so stamping this event's time as
  // the watermark is safe: any survivor event older than it is already
  // reflected in what we write.
  let toWrite = row;
  if (
    existing.stripe_subscription_id &&
    existing.stripe_subscription_id === row.stripe_subscription_id &&
    TERMINAL_STATUSES.has(row.status)
  ) {
    const survivor = await findSurvivingSubscription(
      getStripe(),
      row.stripe_customer_id,
      existing.stripe_subscription_id,
    );
    if (survivor) {
      toWrite = rowFromSubscription(survivor);
      alertSubscriptionConflict(
        "tracked subscription ended; row moved to the customer's other live subscription",
        {
          event_type: eventType,
          event_id: eventId,
          customer: row.stripe_customer_id,
          ended_sub: existing.stripe_subscription_id,
          adopted_sub: survivor.id,
          adopted_status: survivor.status,
          reason: "survivor_adopted",
        },
      );
    }
  }

  const { error } = await service.from("subscriptions").upsert(
    {
      parent_id: existing.parent_id,
      ...stripeFieldsFromRow(toWrite),
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
    `[stripe/webhook] ${eventType}: synced sub="${toWrite.stripe_subscription_id}" ` +
      `status="${toWrite.status}"`,
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
  eventId: string,
): Promise<void> {
  // Reuse the upsert path — the status will be 'canceled'.
  await handleSubscriptionUpsert(
    sub,
    "customer.subscription.deleted",
    eventCreated,
    eventId,
  );
}

/**
 * invoice.payment_failed
 *
 * Stripe will also fire `customer.subscription.updated` alongside this event
 * with the updated status (typically `past_due`). We sync from the invoice's
 * embedded subscription if present, otherwise log and return — the subscription
 * update event will handle it.
 *
 * Basil (2025-03-31) moved the reference to
 * `invoice.parent.subscription_details.subscription`. `subscriptionFromInvoice`
 * also reads the pre-basil `invoice.subscription` field so a Dashboard webhook
 * still pinned to 2024-06-20 keeps working.
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  eventCreated: number,
  eventId: string,
): Promise<void> {
  // The subscription object may be expanded on the invoice or may be an ID.
  // If it's an object, sync it directly. If it's just an ID, the accompanying
  // subscription.updated event will handle it — don't make an extra API call.
  const subData = subscriptionFromInvoice(invoice);

  if (typeof subData === "object" && subData !== null) {
    await handleSubscriptionUpsert(
      subData,
      "invoice.payment_failed",
      eventCreated,
      eventId,
    );
    return;
  }

  console.info(
    `[stripe/webhook] invoice.payment_failed: subscription not expanded on invoice ` +
      `id="${invoice.id}". customer.subscription.updated will handle status sync.`,
  );
}
