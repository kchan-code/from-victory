/**
 * subscription-plan-key.ts — provider-neutral plan key (FV-661).
 *
 * A plan is identified by (athlete capacity, billing interval). This maps that
 * key to the Apple product id and to the Google Play (product id, base plan
 * id), so later work (the shared resolver and the duplicate-purchase guard,
 * FV-663; the UI, FV-665) can talk about "3 athletes, yearly" without caring
 * which store sold it. Purely additive: it only reads the two catalogs and
 * changes neither.
 *
 * Reads catalog DATA only, so it works while both catalogs are dormant. It does
 * not itself check any activation flag.
 */
import "server-only";

import { APPLE_PRODUCT_CATALOG } from "./apple-product-catalog";
import {
  GOOGLE_PLAY_CATALOG,
  googleCatalogEntry,
  type GoogleBillingInterval,
  type GoogleTierCeiling,
} from "./google-product-catalog";

export interface PlanKey {
  readonly athleteCapacity: GoogleTierCeiling;
  readonly interval: GoogleBillingInterval;
}

/** Stable string form, e.g. "3:year". */
export function planKeyToString(key: PlanKey): string {
  return `${key.athleteCapacity}:${key.interval}`;
}

/** Apple product id for a plan key, or null if the Apple catalog has none. */
export function appleProductIdForPlan(key: PlanKey): string | null {
  const entry = APPLE_PRODUCT_CATALOG.find(
    (e) => e.athleteCapacity === key.athleteCapacity && e.interval === key.interval,
  );
  return entry ? entry.productId : null;
}

/** Play (product id, base plan id) for a plan key, or null. */
export function googlePlanForPlan(
  key: PlanKey,
): { productId: string; basePlanId: string } | null {
  const entry = GOOGLE_PLAY_CATALOG.find(
    (e) => e.athleteCapacity === key.athleteCapacity && e.interval === key.interval,
  );
  return entry ? { productId: entry.productId, basePlanId: entry.basePlanId } : null;
}

/** Plan key for a Play (product id, base plan id), or null if unknown. */
export function planKeyForGooglePlan(
  productId: string,
  basePlanId: string,
): PlanKey | null {
  const entry = googleCatalogEntry(productId, basePlanId);
  return entry ? { athleteCapacity: entry.athleteCapacity, interval: entry.interval } : null;
}

/** Plan key for an Apple product id, or null if unknown. */
export function planKeyForAppleProduct(productId: string): PlanKey | null {
  const entry = APPLE_PRODUCT_CATALOG.find((e) => e.productId === productId);
  return entry ? { athleteCapacity: entry.athleteCapacity, interval: entry.interval } : null;
}
