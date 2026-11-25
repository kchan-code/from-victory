/**
 * google-play-health.ts — pipeline stall detection for the Play notification
 * path (FV-662; a release blocker per the issue).
 *
 * If Pub/Sub, the push subscription or our endpoint silently stops, the first
 * symptom is rows that still claim a granting status after their expiry with
 * nothing having re-verified them (a renewal or expiry notification should have
 * arrived). This module finds those rows and alerts with a COUNT ONLY: no row
 * id, token, payer id or product.
 *
 * STATUS: wired into the daily /api/cron/reconcile-subscriptions route, which
 * calls it only when `isGooglePlayCatalogActive()` and after the Google
 * reconcile pass. The 24h threshold matches the daily cadence, so no separate
 * cron entry is needed.
 */
import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import type { GoogleSubscriptionStatus } from "@/lib/subscriptions/google-access-level";
import {
  isGooglePlayCatalogActive,
  isGooglePlayPilotActive,
} from "@/lib/subscriptions/google-product-catalog";
import { listAllowlistedPayerIds } from "@/lib/subscriptions/google-play-pilot";

/** Hours past expiry (with no fresh verification) before a row counts as stalled. */
export const GOOGLE_STALL_THRESHOLD_HOURS = 24;

/**
 * Statuses that grant access and so must be re-verified at expiry. `on_hold` is
 * deliberately NOT watched: a held row has a past expiry by definition and
 * receives no notification for the length of the hold, so it would false-alarm.
 */
export const GOOGLE_STALL_WATCHED_STATUSES: readonly GoogleSubscriptionStatus[] = [
  "active",
  "in_grace_period",
  "canceled",
];

export interface StallCandidate {
  readonly status: string;
  readonly expires_at: string | null;
  readonly last_verified_at: string | null;
}

/**
 * Pure. True when the row claims a watched (granting) status, its expiry
 * passed more than `thresholdHours` ago, and it has not been verified against
 * Google within the last `thresholdHours`.
 */
export function isGoogleRowStalled(
  row: StallCandidate,
  now: Date,
  thresholdHours: number = GOOGLE_STALL_THRESHOLD_HOURS,
): boolean {
  if (!(GOOGLE_STALL_WATCHED_STATUSES as readonly string[]).includes(row.status)) return false;
  if (row.expires_at === null) return false;
  const cutoff = now.getTime() - thresholdHours * 60 * 60 * 1000;
  const expiry = new Date(row.expires_at).getTime();
  if (Number.isNaN(expiry) || expiry >= cutoff) return false;
  if (row.last_verified_at === null) return true;
  const verified = new Date(row.last_verified_at).getTime();
  return Number.isNaN(verified) || verified < cutoff;
}

export interface StallCheckDeps {
  readonly now?: () => Date;
  readonly thresholdHours?: number;
}

/**
 * Counts stalled rows and alerts (count only) when there are any. Returns the
 * count, or null when dormant or the read failed (the failure is alerted
 * without detail). Makes no database call while dormant.
 */
export async function checkGooglePipelineStalls(deps: StallCheckDeps = {}): Promise<number | null> {
  const globalActive = isGooglePlayCatalogActive();
  if (!globalActive && !isGooglePlayPilotActive()) return null;

  const now = (deps.now ?? (() => new Date()))();
  const hours = deps.thresholdHours ?? GOOGLE_STALL_THRESHOLD_HOURS;
  const cutoffIso = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

  const service = createServiceClient();
  // FV-669 pilot mode: no payer is in scope here, so only allowlisted payers'
  // test rows are checked. An unreadable or empty allowlist checks nothing.
  let pilotPayerIds: string[] | null = null;
  if (!globalActive) {
    pilotPayerIds = await listAllowlistedPayerIds(service);
    if (pilotPayerIds === null) return null;
    if (pilotPayerIds.length === 0) return 0;
  }

  let query = service
    .from("google_subscriptions")
    .select("status, expires_at, last_verified_at")
    .in("status", [...GOOGLE_STALL_WATCHED_STATUSES])
    .lt("expires_at", cutoffIso);
  if (pilotPayerIds) query = query.in("payer_id", pilotPayerIds).eq("is_test_purchase", true);
  const { data, error } = await query.limit(1000);
  if (error) {
    console.error(`[google-play-health] stall check read failed (${error.code ?? "unknown"}).`);
    deliverInBackground(
      notifyError("[google-play-health] stall check failed", "Could not read subscriptions to check the Play pipeline", {
        error: error.code ?? "unknown",
      }),
    );
    return null;
  }

  const stalled = (data ?? []).filter((r) => isGoogleRowStalled(r, now, hours)).length;
  if (stalled > 0) {
    deliverInBackground(
      notifyError(
        "[google-play-health] stalled subscriptions",
        "Rows claim a granting status past expiry without a recent re-verification; the notification pipeline may be down",
        { count: String(stalled) },
      ),
    );
  }
  return stalled;
}
