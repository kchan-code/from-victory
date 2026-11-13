/**
 * Subscription drift repair (FV-709). Called by the daily
 * /api/cron/reconcile-subscriptions route. Pure orchestration over the
 * existing write paths; no new mapping logic lives here.
 *
 * Privacy: results are COUNTS ONLY. Nothing here logs or returns customer
 * ids, emails, names or athlete data.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import type { Database } from "@/lib/supabase/types";
import { getStripe } from "@/lib/stripe/server";
import { rowFromSubscription, stripeFieldsFromRow } from "@/lib/stripe/subscription-sync";
import { reconcileAppleSubscription } from "./apple-lifecycle";

type ServiceClient = SupabaseClient<Database>;

export const STRIPE_BATCH_CAP = 100;
export const APPLE_BATCH_CAP = 100;
/** Stop starting new rows once this much wall-clock has elapsed. */
export const TIME_BUDGET_MS = 40_000;
/** Apple rows expiring within this window are reconciled before they lapse. */
export const APPLE_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;
const MAX_PAGES = 10;
const STRIPE_CONCURRENCY = 4;

export type PassCounts = {
  checked: number;
  corrected: number;
  failed: number;
  missing: number;
  /** Rows skipped because a webhook wrote concurrently. Not an error. */
  raced: number;
  /** Eligible rows not reached this run (cap / time budget). Picked up on later days. */
  deferred: number;
};

const emptyCounts = (): PassCounts => ({
  checked: 0,
  corrected: 0,
  failed: 0,
  missing: 0,
  raced: 0,
  deferred: 0,
});

/**
 * Deterministic daily rotation so rows beyond the cap are not starved: the
 * window start advances by `cap` each UTC day (wrapping).
 */
export function rotateWindow<T>(rows: T[], cap: number, now: Date): T[] {
  if (rows.length <= cap) return rows;
  const day = Math.floor(now.getTime() / 86_400_000);
  const start = (day * cap) % rows.length;
  return [...rows.slice(start), ...rows.slice(0, start)];
}

function isResourceMissing(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === "resource_missing"
  );
}

// ---------------------------------------------------------------------------
// Stripe
// ---------------------------------------------------------------------------

type StripeRowLite = {
  parent_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string;
  status: string;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  last_stripe_event_at: string | null;
};

const STRIPE_COLS =
  "parent_id, stripe_subscription_id, stripe_customer_id, status, price_id, current_period_end, cancel_at_period_end, last_stripe_event_at";

function sameInstant(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return a === b;
  return Date.parse(a) === Date.parse(b);
}

async function listStripeRows(service: ServiceClient): Promise<StripeRowLite[]> {
  const out: StripeRowLite[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await service
      .from("subscriptions")
      .select(STRIPE_COLS)
      .not("stripe_subscription_id", "is", null)
      .not("status", "in", "(canceled,incomplete_expired)")
      .order("parent_id", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw new Error(`stripe row list failed: ${error.message}`);
    const rows = (data ?? []) as StripeRowLite[];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}

/**
 * Re-apply Stripe truth to one row.
 *
 * WATERMARK: `retrievedAtMs` is captured BEFORE the Stripe retrieve call
 * (floored to the second). The write sets last_stripe_event_at to that
 * instant (never lower than the stored value), guarded by an optimistic
 * compare on the watermark value we read.
 *  - The snapshot reflects every event created before the retrieve began, so
 *    marking the row "current as of retrievedAt" never hides one.
 *  - The webhook discards only events with created < watermark. An event
 *    created after our retrieve started is still accepted and its write then
 *    overwrites ours. Writing "now" at write time would wrongly discard an
 *    event created between retrieve and write.
 *  - If the stored watermark is already newer than retrievedAt, a webhook has
 *    applied something later than our snapshot: no write (raced).
 *  - If a webhook writes between our read and update, the guarded update
 *    matches 0 rows and counts as raced instead of clobbering it.
 */
async function reconcileStripeRow(
  service: ServiceClient,
  stripe: Stripe,
  row: StripeRowLite,
): Promise<"in_sync" | "corrected" | "missing" | "raced"> {
  const retrievedAtMs = Math.floor(Date.now() / 1000) * 1000;
  let sub: Stripe.Subscription;
  try {
    sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id as string);
  } catch (err) {
    if (isResourceMissing(err)) return "missing";
    throw err;
  }

  const truth = rowFromSubscription(sub);
  const inSync =
    truth.status === row.status &&
    truth.price_id === row.price_id &&
    truth.cancel_at_period_end === row.cancel_at_period_end &&
    truth.stripe_customer_id === row.stripe_customer_id &&
    sameInstant(truth.current_period_end, row.current_period_end);
  if (inSync) return "in_sync";

  const storedMs = row.last_stripe_event_at ? Date.parse(row.last_stripe_event_at) : NaN;
  if (Number.isFinite(storedMs) && storedMs > retrievedAtMs) return "raced";

  const newWatermarkMs = Number.isFinite(storedMs)
    ? Math.max(storedMs, retrievedAtMs)
    : retrievedAtMs;

  let q = service
    .from("subscriptions")
    .update({
      ...stripeFieldsFromRow(truth),
      last_stripe_event_at: new Date(newWatermarkMs).toISOString(),
    })
    .eq("parent_id", row.parent_id);
  q =
    row.last_stripe_event_at === null
      ? q.is("last_stripe_event_at", null)
      : q.eq("last_stripe_event_at", row.last_stripe_event_at);
  const { data, error } = await q.select("parent_id");
  if (error) throw new Error(`stripe row update failed: ${error.message}`);
  return (data?.length ?? 0) === 0 ? "raced" : "corrected";
}

export async function reconcileStripePass(
  service: ServiceClient,
  deadlineMs: number,
  now: Date = new Date(),
): Promise<PassCounts> {
  const counts = emptyCounts();
  const all = rotateWindow(await listStripeRows(service), STRIPE_BATCH_CAP, now);
  const batch = all.slice(0, STRIPE_BATCH_CAP);
  counts.deferred = Math.max(0, all.length - batch.length);
  const stripe = getStripe();

  for (let i = 0; i < batch.length; i += STRIPE_CONCURRENCY) {
    if (Date.now() > deadlineMs) {
      counts.deferred += batch.length - i;
      break;
    }
    const chunk = batch.slice(i, i + STRIPE_CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map((r) => reconcileStripeRow(service, stripe, r)),
    );
    for (const res of results) {
      counts.checked++;
      if (res.status === "rejected") {
        counts.failed++;
        console.error("[reconcile-subscriptions] stripe row failed");
      } else if (res.value === "corrected") counts.corrected++;
      else if (res.value === "missing") counts.missing++;
      else if (res.value === "raced") counts.raced++;
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Apple
// ---------------------------------------------------------------------------

/** Statuses that grant (full or degraded) access — see apple-access-level.ts. */
const APPLE_LIVE_STATUSES = ["subscribed", "in_grace_period", "in_billing_retry"];

type AppleRowLite = {
  payer_id: string;
  status: string;
  product_id: string | null;
  expires_at: string | null;
  grace_period_expires_at: string | null;
};

const APPLE_COLS = "payer_id, status, product_id, expires_at, grace_period_expires_at";

/**
 * Did the reconcile change anything that affects access?
 *
 * `applied: true` alone is NOT drift: applyAppleSnapshot writes whenever the
 * snapshot's signedDate is newer than the stored watermark, and a freshly
 * fetched status can carry a new signedDate with identical state. Counting
 * those would alert on every in-sync row near renewal, every day. So compare
 * the access-relevant columns before and after instead.
 */
async function appleRowChanged(service: ServiceClient, before: AppleRowLite): Promise<boolean> {
  const { data, error } = await service
    .from("apple_subscriptions")
    .select(APPLE_COLS)
    .eq("payer_id", before.payer_id)
    .eq("environment", "Production")
    .maybeSingle();
  if (error) throw new Error(`apple row re-read failed: ${error.message}`);
  if (!data) return true;
  const after = data as AppleRowLite;
  return !(
    after.status === before.status &&
    after.product_id === before.product_id &&
    sameInstant(after.expires_at, before.expires_at) &&
    sameInstant(after.grace_period_expires_at, before.grace_period_expires_at)
  );
}

async function listAppleRows(service: ServiceClient, now: Date): Promise<AppleRowLite[]> {
  const horizon = new Date(now.getTime() + APPLE_LOOKAHEAD_MS).toISOString();
  const out: AppleRowLite[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await service
      .from("apple_subscriptions")
      .select(APPLE_COLS)
      .eq("environment", "Production")
      .in("status", APPLE_LIVE_STATUSES)
      .lte("expires_at", horizon)
      .order("payer_id", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw new Error(`apple row list failed: ${error.message}`);
    const rows = (data ?? []) as AppleRowLite[];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}

export async function reconcileApplePass(
  service: ServiceClient,
  deadlineMs: number,
  now: Date = new Date(),
): Promise<PassCounts> {
  const counts = emptyCounts();
  const all = rotateWindow(await listAppleRows(service, now), APPLE_BATCH_CAP, now);
  const batch = all.slice(0, APPLE_BATCH_CAP);
  counts.deferred = Math.max(0, all.length - batch.length);

  for (const [i, row] of batch.entries()) {
    if (Date.now() > deadlineMs) {
      counts.deferred += batch.length - i;
      break;
    }
    counts.checked++;
    try {
      const res = await reconcileAppleSubscription(service, row.payer_id, "Production");
      if (res.ok) {
        if (res.applied && (await appleRowChanged(service, row))) counts.corrected++;
      } else {
        counts.missing++; // no_row / no_data: nothing to apply, never guessed
      }
    } catch {
      counts.failed++;
      console.error("[reconcile-subscriptions] apple row failed");
    }
  }
  return counts;
}
