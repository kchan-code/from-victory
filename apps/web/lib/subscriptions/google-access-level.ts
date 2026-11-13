/**
 * Pure Google Play access-level function and shared types (FV-661).
 *
 * Sibling of `./apple-access-level` and, like it, intentionally NOT
 * `server-only`: no I/O, no side effects, importable from vitest node tests.
 * Decision record: `docs/fv651-android-play-billing-decision-record.md` 7.3.
 */

import type { AccessLevel } from "./access-level";

/**
 * Google-native lifecycle vocabulary: mirrors the `status` CHECK constraint on
 * `google_subscriptions` (migration 20261111120000). Deliberately not shared
 * with the Stripe or Apple vocabularies.
 */
export type GoogleSubscriptionStatus =
  | "pending"
  | "active"
  | "paused"
  | "in_grace_period"
  | "on_hold"
  | "canceled"
  | "expired"
  | "pending_purchase_canceled";

/**
 * Same renewal-processing skew the Apple code uses (record 4.2: <= 6h), so
 * server time is compared with Google's expiry the same way on both stores.
 */
export const DEFAULT_GOOGLE_SKEW_MS = 6 * 60 * 60 * 1000;

/**
 * Derives the AccessLevel from Google-native state. No I/O.
 *
 *   - `expiresAt` null or unparseable: ALWAYS `blocked`, for every status
 *     (fail closed: an absent bound is never "full forever").
 *   - `active`: full while now <= expiresAt; degraded within the skew after it
 *     (renewal-processing latency, same as Apple `subscribed`); else blocked.
 *   - `in_grace_period`: same shape. Google reports the extended expiry while
 *     in grace, so `expiresAt` is the grace bound. Grace keeps access.
 *   - `canceled` (auto-renew off, paid through the period): full while
 *     now <= expiresAt, then blocked. No skew: nothing is renewing.
 *   - `on_hold` (account hold: payment failed and grace is over): `blocked`,
 *     the same as Apple `in_billing_retry` (decision G3, settled by KC in
 *     FV-710 on 2026-11-13: grace keeps access, hold does not). A recovered
 *     charge returns the row to `active`.
 *   - `pending`, `pending_purchase_canceled`, `paused`, `expired`: `blocked`.
 *
 * @param status    `google_subscriptions.status`.
 * @param expiresAt `google_subscriptions.expires_at` (may be null).
 * @param now       Current SERVER time (injected for testability).
 */
export function googleSubscriptionAccessLevel(
  status: GoogleSubscriptionStatus,
  expiresAt: string | Date | null,
  now: Date,
  skewMs: number = DEFAULT_GOOGLE_SKEW_MS,
): AccessLevel {
  if (expiresAt === null) return "blocked";
  const bound = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  if (Number.isNaN(bound)) return "blocked";
  const nowMs = now.getTime();

  switch (status) {
    case "active":
    case "in_grace_period":
      if (nowMs <= bound) return "full";
      if (nowMs <= bound + skewMs) return "degraded";
      return "blocked";

    case "canceled":
      return nowMs <= bound ? "full" : "blocked";

    case "on_hold":
    case "pending":
    case "pending_purchase_canceled":
    case "paused":
    case "expired":
      return "blocked";

    default: {
      const _exhaustive: never = status;
      void _exhaustive;
      return "blocked";
    }
  }
}
