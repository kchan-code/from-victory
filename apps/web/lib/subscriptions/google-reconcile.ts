/**
 * Google Play reconcile pass (FV-662/663), called by the daily
 * /api/cron/reconcile-subscriptions route ONLY when `isGooglePlayCatalogActive()`.
 *
 * The Pub/Sub webhook is the primary path; this is the backstop for a missed
 * notification. It adds no mapping logic: each row is re-read from Google by
 * its purchase token and written through `processGoogleNotification`, the exact
 * path the webhook uses (so `expired` stays terminal, voids and catalog /
 * ownership rules are identical, and `last_verified_at` is refreshed).
 *
 * Rows: statuses that can still change (active, in_grace_period, canceled,
 * on_hold, paused) whose `expires_at` is within the next 24h or already past,
 * but not more than 30 days past. `expired` rows are never listed (terminal).
 * Rows with a null expiry are not listed (they never grant access).
 *
 * Bounded like the Apple pass: GOOGLE_BATCH_CAP rows, daily rotation, shared
 * wall-clock deadline, sequential calls, per-row try/catch and timeout.
 *
 * LOGGING (record 7.1): the purchase token is selected so it can be sent to
 * Google, and goes nowhere else. Logs are static labels; results are COUNTS
 * ONLY; database errors are reduced to their `code`.
 */
import "server-only";

import type { createServiceClient } from "@/lib/supabase/service";
import { processGoogleNotification } from "@/lib/subscriptions/google-play-rtdn";
import { listAllowlistedPayerIds } from "@/lib/subscriptions/google-play-pilot";
import {
  isGooglePlayCatalogActive,
  isGooglePlayPilotActive,
} from "@/lib/subscriptions/google-product-catalog";
import {
  emptyCounts,
  rotateWindow,
  withTimeout,
  type PassCounts,
} from "@/lib/subscriptions/reconcile";

type ServiceClient = ReturnType<typeof createServiceClient>;

export const GOOGLE_BATCH_CAP = 100;
/** Rows expiring within this window are reconciled before they lapse. */
export const GOOGLE_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
/** Rows are reconciled for this long after their expiry. */
export const GOOGLE_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
export const GOOGLE_CALL_TIMEOUT_MS = 15_000;
const PAGE_SIZE = 1000;
const MAX_PAGES = 10;

export const GOOGLE_RECONCILE_STATUSES = [
  "active",
  "in_grace_period",
  "canceled",
  "on_hold",
  "paused",
] as const;

type GoogleRowLite = {
  id: string;
  purchase_token: string;
  status: string;
  product_id: string;
  base_plan_id: string;
  expires_at: string | null;
  auto_renewing: boolean;
};

const COLS = "id, purchase_token, status, product_id, base_plan_id, expires_at, auto_renewing";

function sameInstant(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return a === b;
  return Date.parse(a) === Date.parse(b);
}

function dbError(label: string, error: { code?: string }): Error {
  // Only the code: a database message can quote the purchase token.
  return new Error(`${label}:${error.code ?? "unknown"}`);
}

async function listGoogleRows(
  service: ServiceClient,
  now: Date,
  /** Pilot mode only (FV-669): restrict to these payers' TEST rows. */
  pilotPayerIds: string[] | null = null,
): Promise<{ batch: GoogleRowLite[]; deferred: number }> {
  const horizon = new Date(now.getTime() + GOOGLE_LOOKAHEAD_MS).toISOString();
  const floor = new Date(now.getTime() - GOOGLE_LOOKBACK_MS).toISOString();
  const out: GoogleRowLite[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    let query = service
      .from("google_subscriptions")
      .select(COLS)
      .in("status", [...GOOGLE_RECONCILE_STATUSES])
      .lte("expires_at", horizon)
      .gt("expires_at", floor);
    if (pilotPayerIds) {
      query = query.in("payer_id", pilotPayerIds).eq("is_test_purchase", true);
    }
    const { data, error } = await query
      .order("id", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw dbError("google row list failed", error);
    const rows = (data ?? []) as GoogleRowLite[];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  const batch = rotateWindow(out, GOOGLE_BATCH_CAP, now).slice(0, GOOGLE_BATCH_CAP);
  return { batch, deferred: Math.max(0, out.length - batch.length) };
}

/** Did the reconcile change anything that affects access? (Same idea as Apple.) */
async function googleRowChanged(service: ServiceClient, before: GoogleRowLite): Promise<boolean> {
  const { data, error } = await service
    .from("google_subscriptions")
    .select(COLS)
    .eq("id", before.id)
    .maybeSingle();
  if (error) throw dbError("google row re-read failed", error);
  if (!data) return true;
  const after = data as GoogleRowLite;
  return !(
    after.status === before.status &&
    after.product_id === before.product_id &&
    after.base_plan_id === before.base_plan_id &&
    after.auto_renewing === before.auto_renewing &&
    sameInstant(after.expires_at, before.expires_at)
  );
}

/**
 * Outcome mapping (counts only):
 *   applied + access-relevant column changed -> corrected
 *   applied, unchanged                       -> in sync (only last_verified_at moved)
 *   ignored (Google does not know / cannot read the token) -> missing
 *   retry (Google or acknowledge unavailable) or a throw   -> failed
 */
export async function reconcileGooglePass(
  service: ServiceClient,
  deadlineMs: number,
  now: Date = new Date(),
): Promise<PassCounts> {
  const counts = emptyCounts();

  // FV-669 pilot mode (global flag off): reconcile ONLY allowlisted payers'
  // test rows. An unreadable allowlist, or an empty one, processes nothing.
  let pilotPayerIds: string[] | null = null;
  if (!isGooglePlayCatalogActive()) {
    if (!isGooglePlayPilotActive()) return counts;
    pilotPayerIds = await listAllowlistedPayerIds(service);
    if (pilotPayerIds === null) {
      counts.failed++;
      return counts;
    }
    if (pilotPayerIds.length === 0) return counts;
  }

  const { batch, deferred } = await listGoogleRows(service, now, pilotPayerIds);
  counts.deferred = deferred;

  for (const [i, row] of batch.entries()) {
    if (Date.now() > deadlineMs) {
      counts.deferred += batch.length - i;
      break;
    }
    counts.checked++;
    try {
      const outcome = await withTimeout(
        processGoogleNotification(
          { kind: "subscription", purchaseToken: row.purchase_token },
          { now: () => now },
        ),
        GOOGLE_CALL_TIMEOUT_MS,
      );
      if (outcome === "applied") {
        if (await googleRowChanged(service, row)) counts.corrected++;
      } else if (outcome === "ignored") {
        counts.missing++;
      } else {
        counts.failed++;
        console.error("[reconcile-subscriptions] google row failed");
      }
    } catch {
      counts.failed++;
      console.error("[reconcile-subscriptions] google row failed");
    }
  }
  return counts;
}
