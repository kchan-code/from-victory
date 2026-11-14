import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

import type { AccessLevel } from "./access-level";
import {
  googleSubscriptionAccessLevel,
  type GoogleSubscriptionStatus,
} from "./google-access-level";
import { isGooglePlayCatalogActive } from "./google-product-catalog";

type ServiceClient = SupabaseClient<Database>;

const LEVEL_RANK: Record<AccessLevel, number> = {
  full: 2,
  degraded: 1,
  blocked: 0,
};

type GoogleEntitlementRow = {
  product_id: string;
  status: GoogleSubscriptionStatus;
  expires_at: string | null;
};

type GoogleCancelableSubscriptionRow = {
  product_id: string;
  purchase_token: string;
  status: GoogleSubscriptionStatus;
  expires_at: string | null;
};

export interface GoogleEntitlementSnapshot {
  level: AccessLevel;
  latestEnd: string | null;
  activeProductId: string | null;
  readError: boolean;
}

export interface GoogleCancelableSubscriptionsResult {
  rows: GoogleCancelableSubscriptionRow[];
  readError: boolean;
}

function bestLevel(a: AccessLevel, b: AccessLevel): AccessLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

export async function getGoogleEntitlementSnapshotForPayer(
  service: ServiceClient,
  payerId: string,
  now: Date = new Date(),
): Promise<GoogleEntitlementSnapshot> {
  if (!isGooglePlayCatalogActive()) {
    return {
      level: "blocked",
      latestEnd: null,
      activeProductId: null,
      readError: false,
    };
  }

  const { data, error } = await service
    .from("google_subscriptions")
    .select("product_id, status, expires_at")
    .eq("payer_id", payerId);

  if (error) {
    console.error(
      `[subscriptions/google] google_subscriptions read failed (payer=${payerId}):`,
      error.message,
    );
    return {
      level: "blocked",
      latestEnd: null,
      activeProductId: null,
      readError: true,
    };
  }

  let level: AccessLevel = "blocked";
  let latestEndMs: number | null = null;
  let latestEnd: string | null = null;
  let activeProductId: string | null = null;
  let activeLevelRank = -1;
  let activeExpiryMs = -1;

  for (const row of (data ?? []) as GoogleEntitlementRow[]) {
    const rowLevel = googleSubscriptionAccessLevel(
      row.status,
      row.expires_at,
      now,
    );
    level = bestLevel(level, rowLevel);

    if (rowLevel === "blocked") continue;
    if (row.expires_at !== null) {
      const endMs = new Date(row.expires_at).getTime();
      if (Number.isFinite(endMs) && (latestEndMs === null || endMs > latestEndMs)) {
        latestEndMs = endMs;
        latestEnd = new Date(endMs).toISOString();
      }
    }
    const rowLevelRank = LEVEL_RANK[rowLevel];
    const rowExpiryMs =
      row.expires_at === null ? Number.NEGATIVE_INFINITY : new Date(row.expires_at).getTime();

    if (
      rowLevelRank > activeLevelRank ||
      (rowLevelRank === activeLevelRank && rowExpiryMs > activeExpiryMs)
    ) {
      activeLevelRank = rowLevelRank;
      activeExpiryMs = rowExpiryMs;
      activeProductId = row.product_id;
    }
  }

  return {
    level,
    latestEnd,
    activeProductId,
    readError: false,
  };
}

export async function getGoogleAccessLevelForPayer(
  service: ServiceClient,
  payerId: string,
  now: Date = new Date(),
): Promise<AccessLevel> {
  return (await getGoogleEntitlementSnapshotForPayer(service, payerId, now)).level;
}

export async function getGoogleEntitlementEndForPayer(
  service: ServiceClient,
  payerId: string,
  now: Date = new Date(),
): Promise<string | null> {
  return (await getGoogleEntitlementSnapshotForPayer(service, payerId, now))
    .latestEnd;
}

export async function hasEverHeldGoogleEntitlement(
  service: ServiceClient,
  payerId: string,
): Promise<boolean> {
  if (!isGooglePlayCatalogActive()) return false;

  const { count, error } = await service
    .from("google_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("payer_id", payerId)
    .eq("is_test_purchase", false)
    .eq("acknowledged", true)
    .not("status", "in", "(pending,pending_purchase_canceled)");

  if (error) {
    throw new Error(
      `[subscriptions/google] hasEverHeldGoogleEntitlement read failed (payer=${payerId}): ${error.message}`,
    );
  }

  return (count ?? 0) > 0;
}

function shouldCancelGoogleSubscription(
  row: GoogleCancelableSubscriptionRow,
  nowMs: number,
): boolean {
  if (row.expires_at === null) return true;

  const expiryMs = new Date(row.expires_at).getTime();
  const hasFutureExpiry = Number.isFinite(expiryMs) && expiryMs > nowMs;

  if (
    row.status === "active" ||
    row.status === "in_grace_period" ||
    row.status === "on_hold" ||
    row.status === "paused"
  ) {
    return true;
  }

  // Cancel-pending and still paid through.
  if (row.status === "canceled" && hasFutureExpiry) {
    return true;
  }

  return false;
}

export async function getGoogleCancelableSubscriptionsForPayer(
  service: ServiceClient,
  payerId: string,
  now: Date = new Date(),
): Promise<GoogleCancelableSubscriptionsResult> {
  if (!isGooglePlayCatalogActive()) {
    return { rows: [], readError: false };
  }

  const { data, error } = await service
    .from("google_subscriptions")
    .select("product_id, purchase_token, status, expires_at")
    .eq("payer_id", payerId);

  if (error) {
    console.error(
      `[subscriptions/google] google_subscriptions cancel-read failed (payer=${payerId}):`,
      error.message,
    );
    return { rows: [], readError: true };
  }

  const nowMs = now.getTime();
  const rows = ((data ?? []) as GoogleCancelableSubscriptionRow[]).filter((row) =>
    shouldCancelGoogleSubscription(row, nowMs),
  );
  return { rows, readError: false };
}
