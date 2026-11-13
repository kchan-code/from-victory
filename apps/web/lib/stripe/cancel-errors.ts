/**
 * Pure helper: classify Stripe errors that arise when cancelling a subscription.
 *
 * Exported as a standalone module so this logic can be unit-tested in vitest's
 * node environment without touching `server-only` imports, `next/headers`, or
 * any DB/network boundary.
 *
 * Callers: `lib/actions/account.ts` → `deleteAccount`.
 */

import Stripe from "stripe";

/**
 * Returns `true` for Stripe errors that are safe to swallow during an account-
 * deletion cancellation, meaning the subscription is provably already gone and
 * there is nothing left to cancel:
 *
 *   - `resource_missing`   — the subscription ID does not exist in Stripe
 *                            (already purged, was never created, or the ID is
 *                            stale from a test/migration).
 *   - `subscription_canceled` — the subscription was already in a terminal
 *                               canceled state when we tried to cancel it.
 *                               (Stripe uses this code on some SDK versions;
 *                               guard it defensively.)
 *
 * For ANY other error (network, auth, 5xx, rate-limit, etc.) this returns
 * `false` — the caller must abort the deletion so a live billing subscription
 * is never orphaned.
 */
export function isBenignCancelError(err: unknown): boolean {
  if (!(err instanceof Stripe.errors.StripeInvalidRequestError)) {
    // Connection errors, API errors, auth errors, etc. are all fatal — abort.
    return false;
  }

  const benignCodes = new Set(["resource_missing", "subscription_canceled"]);
  return benignCodes.has(err.code ?? "");
}

/**
 * Returns `true` when deleting a Stripe CUSTOMER failed only because the
 * customer is already gone (`resource_missing`) — e.g. a retry after a partial
 * account-deletion failure, or a customer removed from the Stripe dashboard.
 * There is nothing left to delete, so account deletion may proceed.
 *
 * The SDK (`customers.del`) resolves with `{ deleted: true }` on success and
 * throws a `StripeInvalidRequestError` for a missing customer. Every other
 * error (network, auth, 5xx, rate-limit) returns `false` — the caller must
 * abort so the payer's email/name is never silently left behind in Stripe.
 *
 * Callers: `lib/actions/account.ts` → `deleteAccount`.
 */
export function isBenignCustomerDeleteError(err: unknown): boolean {
  return (
    err instanceof Stripe.errors.StripeInvalidRequestError &&
    err.code === "resource_missing"
  );
}
