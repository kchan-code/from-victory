/**
 * Pure rate-limit decision function for account/athlete deletions (FV-14).
 *
 * This file is intentionally NOT marked `server-only` so the pure function
 * can be imported in test files (vitest node env) without triggering
 * next/headers. The file itself performs no I/O and has no side effects.
 *
 * The DB count query lives in the calling server action (account.ts), which
 * passes the already-resolved count in. This keeps the decision logic
 * independently testable — same pattern as subscriptionAccessLevel in
 * lib/subscriptions/access-level.ts.
 */

// ---------------------------------------------------------------------------
// Constants (exported for use in account.ts and tests)
// ---------------------------------------------------------------------------

/**
 * Maximum deletion events allowed per parent within the rolling window.
 *
 * 10 is calibrated for normal family use:
 *   - A parent with 5 athletes deleting all of them = 5 athlete_deleted events
 *     + 1 account_deleted event = 6 total. Well under the limit.
 *   - A parent who tries/cancels the delete flow a few times before confirming
 *     won't actually accumulate events (events are only inserted on SUCCESS).
 *   - 10 is high enough that no legitimate user ever sees the error, and low
 *     enough to blunt a compromised-session mass-delete attack meaningfully.
 */
export const DELETION_RATE_LIMIT = 10;

/**
 * Rolling window in minutes. 60 minutes (1 hour) balances protection against
 * a rapid burst attack with not penalising a parent who legitimately deletes
 * multiple athletes across a session.
 */
export const DELETION_WINDOW_MINUTES = 60;

// ---------------------------------------------------------------------------
// Pure decision function
// ---------------------------------------------------------------------------

/**
 * Returns true if the parent should be BLOCKED from performing another
 * deletion, false if they are allowed to proceed.
 *
 * @param recentCount  Count of account_deletion_events rows for this parent
 *                     in the last DELETION_WINDOW_MINUTES minutes. Caller is
 *                     responsible for the DB query; this function only makes
 *                     the accept/reject decision.
 * @param limit        The maximum allowed count (defaults to DELETION_RATE_LIMIT).
 *                     Accepts an override so tests can exercise boundaries
 *                     without relying on the module-level constant.
 */
export function isDeletionRateLimited(
  recentCount: number,
  limit: number = DELETION_RATE_LIMIT,
): boolean {
  return recentCount >= limit;
}
