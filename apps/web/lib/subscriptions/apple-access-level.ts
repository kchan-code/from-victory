/**
 * Pure Apple access-level function and shared types (FV-570).
 *
 * This file is intentionally NOT marked `server-only` — mirrors
 * `./access-level` — so the pure function can be imported in test files
 * (vitest node env) without triggering next/headers. The file itself
 * performs no I/O and has no side effects.
 *
 * For server-side DB reads, use the centralized accessor in `./apple`
 * (which IS `server-only` — the FV-570/571 hard mandate, per
 * docs/fv210-ios-iap-decision-record.md Section 4.9: "single centralized
 * accessor for apple_subscriptions entitlement reads — no ad hoc reads
 * elsewhere").
 */

import type { AccessLevel } from "./access-level";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Apple-native lifecycle vocabulary — mirrors the `status` CHECK constraint
 * on `apple_subscriptions` (migration 20260911120000). Deliberately NOT the
 * Stripe `SubscriptionStatus` enum: it encodes Stripe's own dunning policy
 * and must not be reused for a different provider's lifecycle model.
 * See docs/fv210-ios-iap-decision-record.md Section 4.1.
 */
export type AppleSubscriptionStatus =
  | "subscribed"
  | "in_grace_period"
  | "in_billing_retry"
  | "expired"
  | "revoked";

/**
 * Default skew allowance: how long past a time bound access degrades (rather
 * than blocking outright) to absorb renewal-processing latency. Six hours,
 * per docs/fv210-ios-iap-decision-record.md Section 4.2 ("a small configured
 * skew allowance (e.g. <= 6h, for renewal-processing latency)"). Exported so
 * callers/tests share one source of truth for the constant.
 */
export const DEFAULT_APPLE_SKEW_MS = 6 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Pure access-level function
// ---------------------------------------------------------------------------

/**
 * Derives the AccessLevel from Apple-native subscription state. No I/O.
 * Unit-testable. Time-aware, never notification-dependent, and the time
 * bound is STATUS-CONDITIONAL — see
 * docs/fv210-ios-iap-decision-record.md Section 4.2 ("Verification,
 * lifecycle state, and time (v3-revised)"):
 *
 *   - `subscribed`:
 *       full      while now <= expiresAt
 *       degraded  while expiresAt < now <= expiresAt + skewMs
 *       blocked   beyond that
 *     (A missed Apple notification can never extend access past expiresAt +
 *     skew — access is time-aware, never notification-dependent.)
 *
 *   - `in_grace_period`:
 *       Gated on its OWN bound (gracePeriodExpiresAt), NOT on expiresAt —
 *       by definition expiresAt has already passed once grace begins, so
 *       gating grace on expiresAt would wrongly demote a legitimate
 *       grace-period user immediately (the v3->v4 correction to this
 *       record). Same full/degraded/blocked shape, with its own skew:
 *         full      while now <= gracePeriodExpiresAt
 *         degraded  while gracePeriodExpiresAt < now <= gracePeriodExpiresAt + skewMs
 *         blocked   beyond that
 *       If `gracePeriodExpiresAt` is null while status is `in_grace_period`
 *       (a data anomaly — Apple's renewal payload should always populate it
 *       on grace entry), this fails CLOSED to `degraded` rather than either
 *       trusting an absent bound as "full forever" or dropping straight to
 *       `blocked` on a payload shape we didn't expect.
 *
 *   - `in_billing_retry` (grace disabled or exhausted): always `degraded`.
 *     No time gate — Apple itself is still retrying the charge, so there is
 *     no forward-looking bound to gate against.
 *
 *   - `expired` | `revoked`: always `blocked`. No time dimension and no
 *     skew — a definitively closed state is never re-opened by a clock
 *     allowance, even if `expiresAt` happens to be in the future (e.g. a
 *     stale/corrected snapshot).
 *
 * @param status               Apple-native status for this row.
 * @param expiresAt            `apple_subscriptions.expires_at` — the
 *                              `subscribed` time bound (transactionInfo.expiresDate).
 * @param gracePeriodExpiresAt `apple_subscriptions.grace_period_expires_at` —
 *                              the `in_grace_period` time bound
 *                              (renewalInfo.gracePeriodExpiresDate), or null.
 * @param now                  Current time (injected for testability).
 * @param skewMs               Renewal-processing-latency allowance in
 *                              milliseconds. Defaults to `DEFAULT_APPLE_SKEW_MS`
 *                              (6h, record Section 4.2).
 */
export function appleSubscriptionAccessLevel(
  status: AppleSubscriptionStatus,
  expiresAt: string | Date,
  gracePeriodExpiresAt: string | Date | null,
  now: Date,
  skewMs: number = DEFAULT_APPLE_SKEW_MS,
): AccessLevel {
  switch (status) {
    case "subscribed":
      return levelFromBound(toTime(expiresAt), now.getTime(), skewMs);

    case "in_grace_period": {
      if (gracePeriodExpiresAt === null) {
        // Data anomaly: Apple's renewal payload should always populate
        // gracePeriodExpiresDate on transition into grace. Fail CLOSED to
        // degraded rather than granting full on a bound we don't have, or
        // blocking outright on a payload shape we didn't expect.
        console.warn(
          "[subscriptions/apple-access-level] in_grace_period with null grace_period_expires_at — failing closed to degraded",
        );
        return "degraded";
      }
      return levelFromBound(toTime(gracePeriodExpiresAt), now.getTime(), skewMs);
    }

    case "in_billing_retry":
      // No time gate: Apple is actively retrying the charge.
      return "degraded";

    case "expired":
    case "revoked":
      // No time dimension, no skew — a closed state is never re-opened by
      // a clock allowance.
      return "blocked";

    default: {
      // Exhaustiveness guard: TypeScript flags this if a new status slips
      // in without being handled above.
      const _exhaustive: never = status;
      console.warn(
        `[subscriptions/apple-access-level] Unknown status "${String(_exhaustive)}", defaulting to blocked`,
      );
      return "blocked";
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toTime(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/** full while now <= bound; degraded while bound < now <= bound + skewMs; else blocked. */
function levelFromBound(
  boundMs: number,
  nowMs: number,
  skewMs: number,
): AccessLevel {
  if (nowMs <= boundMs) return "full";
  if (nowMs <= boundMs + skewMs) return "degraded";
  return "blocked";
}
