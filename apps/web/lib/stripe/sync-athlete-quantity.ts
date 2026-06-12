/**
 * Stripe subscription-quantity sync helper — FV-283
 *
 * Keeps the Stripe subscription quantity in sync with the parent's
 * linked-athlete count. Quantity == athlete count (floor 1, never 0).
 *
 * PRICING MODEL (tiered on quantity; tiers configured on the Price object
 * in Stripe, not in code):
 *   - Quantity 1  → first-athlete price ($5/mo | $49/yr)
 *   - Quantity 2+ → graduated tier; additional athletes at $3/mo | $29/yr
 *
 * NON-BLOCKING contract:
 *   This function must NEVER throw and NEVER block or roll back the
 *   athlete create/delete that called it. A Stripe failure is logged and
 *   alerted via notifyError/deliverInBackground, but the caller proceeds.
 *   Wrap every call in a void-and-catch or inside the helper itself (done
 *   below).
 *
 * NO-OP cases (handled silently, no error):
 *   - Parent has no subscriptions row  → pre-subscribe or trial-gap; skip.
 *   - subscriptions.status is not active/trialing → degraded/canceled; skip.
 *   - Stripe secret key not configured → skip (dev/test environments).
 *
 * CALL SITES:
 *   - lib/actions/athletes.ts   : createAthlete   — after link insert succeeds
 *   - lib/actions/admin.ts      : createAthleteDirect — after link insert succeeds
 *   - lib/actions/account.ts    : deleteAthlete   — after deleteUser succeeds
 *
 * LIVE-MODE FLIP CHECKLIST (add to PR before deploying to production):
 *   1. Recreate the two tiered Prices in live-mode Stripe (Price IDs never
 *      cross modes — sandbox and live are separate namespaces).
 *   2. Update STRIPE_PRICE_ID_MONTHLY and STRIPE_PRICE_ID_ANNUAL in
 *      Vercel production env to the live-mode Price IDs.
 *   3. Repoint STRIPE_SECRET_KEY to the live-mode secret key.
 *   4. Verify STRIPE_WEBHOOK_SECRET is also live-mode (different from sandbox).
 *   5. Pricing tiers are tunable on the Price object in the Stripe dashboard
 *      without any code deploy — adjusting the per-unit amount for tier 2+
 *      takes effect immediately for new invoices.
 */

import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe/server";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";

// Statuses where billing is live; we sync quantity only when billing is
// active or trialing (the subscription will charge at period-end).
const BILLABLE_STATUSES = new Set(["active", "trialing"]);

/**
 * Syncs the Stripe subscription quantity for a parent to their current
 * linked-athlete count.
 *
 * @param parentId - The parent's auth.users UUID (never a client-supplied ID).
 *
 * Non-blocking: any failure is logged + alerted but never propagated.
 * Returns void; callers must not depend on the return value.
 */
export async function syncAthleteQuantity(parentId: string): Promise<void> {
  try {
    await _syncAthleteQuantityInner(parentId);
  } catch (err) {
    // Catch-all: the outer try/catch ensures this function never throws even
    // if _syncAthleteQuantityInner introduces an unexpected code path.
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[stripe/sync-athlete-quantity] unexpected error (parent=${parentId}): ${message}`,
    );
    deliverInBackground(
      notifyError(
        "[stripe] syncAthleteQuantity unexpected error",
        message,
        { parent_id: parentId },
      ),
    );
  }
}

async function _syncAthleteQuantityInner(parentId: string): Promise<void> {
  // Guard: if Stripe isn't configured (dev/test without env), skip silently.
  if (!process.env.STRIPE_SECRET_KEY) {
    return;
  }

  const service = createServiceClient();

  // 1. Read the parent's subscription row.
  //    We need: stripe_subscription_id + status.
  //    Service role bypasses RLS — this is intentionally server-only.
  const { data: sub, error: subError } = await service
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("parent_id", parentId)
    .maybeSingle();

  if (subError) {
    console.error(
      `[stripe/sync-athlete-quantity] subscriptions read failed (parent=${parentId}): ${subError.message}`,
    );
    deliverInBackground(
      notifyError(
        "[stripe] syncAthleteQuantity subscriptions read failed",
        subError.message,
        { parent_id: parentId },
      ),
    );
    return;
  }

  // No subscription row → parent hasn't subscribed yet (or is in a trial-gap
  // window before the checkout webhook fires). Nothing to sync.
  if (!sub) return;

  // Sub exists but is not in a billable state — canceled, past_due, etc.
  // No point syncing; Stripe won't charge on the next billing cycle anyway.
  if (!BILLABLE_STATUSES.has(sub.status)) return;

  // No stripe_subscription_id yet (checkout fired, subscription event pending)?
  // Skip — the subscription.created webhook will write the ID shortly.
  if (!sub.stripe_subscription_id) return;

  // 2. Count the parent's linked athletes.
  const { count, error: countError } = await service
    .from("parent_athlete_links")
    .select("athlete_id", { count: "exact", head: true })
    .eq("parent_id", parentId);

  if (countError) {
    console.error(
      `[stripe/sync-athlete-quantity] athlete count failed (parent=${parentId}): ${countError.message}`,
    );
    deliverInBackground(
      notifyError(
        "[stripe] syncAthleteQuantity athlete count failed",
        countError.message,
        { parent_id: parentId },
      ),
    );
    return;
  }

  // Floor at 1: never send quantity=0 to Stripe (Stripe rejects it, and a
  // parent with 0 athletes is either mid-deletion-cascade or an edge case —
  // leaving quantity at 1 is the safe billing floor).
  const quantity = Math.max(count ?? 0, 1);

  // 3. Fetch the subscription to get the single item ID.
  //    MVP has one price per subscription; we update the first item.
  let stripe;
  try {
    stripe = getStripe();
  } catch {
    // Stripe not configured — skip silently (dev/preview environments).
    return;
  }

  let stripeSub;
  try {
    stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[stripe/sync-athlete-quantity] subscriptions.retrieve failed (parent=${parentId} sub=${sub.stripe_subscription_id}): ${message}`,
    );
    deliverInBackground(
      notifyError(
        "[stripe] syncAthleteQuantity subscriptions.retrieve failed",
        message,
        { parent_id: parentId, stripe_subscription_id: sub.stripe_subscription_id },
      ),
    );
    return;
  }

  const item = stripeSub.items.data[0];
  if (!item) {
    console.warn(
      `[stripe/sync-athlete-quantity] no subscription items found (parent=${parentId} sub=${sub.stripe_subscription_id})`,
    );
    return;
  }

  // 4. Update the subscription item quantity.
  try {
    await stripe.subscriptionItems.update(item.id, { quantity });
    console.log(
      `[stripe/sync-athlete-quantity] updated quantity=${quantity} (parent=${parentId} sub=${sub.stripe_subscription_id} item=${item.id})`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[stripe/sync-athlete-quantity] subscriptionItems.update failed (parent=${parentId} item=${item.id} quantity=${quantity}): ${message}`,
    );
    deliverInBackground(
      notifyError(
        "[stripe] syncAthleteQuantity subscriptionItems.update failed",
        message,
        { parent_id: parentId, item_id: item.id, quantity: String(quantity) },
      ),
    );
  }
}
