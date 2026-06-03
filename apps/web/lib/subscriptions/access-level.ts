/**
 * Pure access-level function and shared types.
 *
 * This file is intentionally NOT marked `server-only` so the pure function
 * can be imported in test files (vitest node env) without triggering next/headers.
 * The file itself performs no I/O and has no side effects.
 *
 * For server-side DB reads, use `getParentAccessLevel` / `getAccessForCurrentUser`
 * from `@/lib/subscriptions/access` (which IS `server-only`).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The three tiers of subscription access for a parent account. */
export type AccessLevel = "full" | "degraded" | "blocked";

// Mirror of the `status` check constraint from the baseline migration.
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
// Pure access-level function
// ---------------------------------------------------------------------------

/**
 * Derives the access level from subscription state. No I/O. Unit-testable.
 *
 * Access rules (from migration column comment):
 *   - `active` / `trialing`                           → `full`
 *   - `past_due` / `incomplete` / `unpaid` / `paused` → `degraded`
 *     (read-only: can view past entries; cannot unlock new daily content)
 *   - `canceled` / `incomplete_expired`               → `blocked`
 *   - null / undefined (no row)                       → `blocked`
 *
 * `cancel_at_period_end` policy:
 *   When `cancel_at_period_end` is true the subscription is still active until
 *   `current_period_end`. The parent has paid for the remainder of the period
 *   and should retain full access until it lapses. Stripe fires a
 *   `customer.subscription.updated` event when the period ends, switching the
 *   status to `canceled` — at that point this function naturally returns
 *   `blocked`. So: access follows `status` exclusively. `cancel_at_period_end`
 *   and `current_period_end` are accepted for interface completeness and future
 *   use (e.g. surfacing a "your plan ends on <date>" banner), but they do NOT
 *   affect the returned level.
 *
 * @param status The current subscription status, or null/undefined if no row.
 * @param _cancelAtPeriodEnd Accepted; see policy note above.
 * @param _currentPeriodEnd  Accepted; reserved for future UI use.
 */
export function subscriptionAccessLevel(
  status: SubscriptionStatus | null | undefined,
  // Underscore-prefixed: accepted for interface completeness / future UI use
  // (see policy note above) but intentionally unused in the access decision.
  _cancelAtPeriodEnd?: boolean,
  _currentPeriodEnd?: string | null,
): AccessLevel {
  switch (status) {
    case "active":
    case "trialing":
      return "full";

    case "past_due":
    case "incomplete":
    case "unpaid":
    case "paused":
      return "degraded";

    case "canceled":
    case "incomplete_expired":
      return "blocked";

    case null:
    case undefined:
      // No subscription row — treat as blocked.
      return "blocked";

    default: {
      // Exhaustiveness guard: TypeScript flags this if a new status slips in
      // without being handled above.
      const _exhaustive: never = status;
      console.warn(
        `[subscriptions/access-level] Unknown status "${String(_exhaustive)}", defaulting to blocked`,
      );
      return "blocked";
    }
  }
}
