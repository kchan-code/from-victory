/**
 * apple-product-catalog.ts — Apple subscription-group product catalog
 * (FV-593), per the KC-approved CONFIGURATION POLICY in
 * `docs/fv210-apple-product-config-PROPOSAL-2026-09-17.md` ("APPROVED —
 * 2026-09-21 (KC, item 1: configuration policy)").
 *
 * STATUS: DORMANT BY DEFAULT. This file defines the 10-product catalog as
 * DATA — it does NOT activate anything. `APPLE_PRODUCT_CAPACITY`
 * (`./apple-capacity.ts`) stays an empty map, the capacity gate (FV-570) and
 * the FV-585 seat-selection pause stay inert, and `isStrictAppleCapacityUpgrade`
 * (FV-586, D3) keeps refusing every upgrade, UNTIL the server env var
 * `APPLE_CATALOG_ACTIVE` is set to the exact string `"1"`.
 *
 * ACTIVATION IS A SEPARATE, LATER, TIER-2 STEP — do not flip it as part of
 * landing this file. Per the proposal doc, activation requires, in order:
 *   1. The 10 products actually created in App Store Connect with the ids
 *      below (reconciled against any existing ASC product first).
 *   2. ASC price-point confirmation for every price in the proposal (§4).
 *   3. The sandbox proof required by the config checklist
 *      (`docs/fv210-apple-config-checklist-2026-09-21.md`, item D15) —
 *      upgrade-during-trial, downgrade-at-renewal, and cancel-of-downgrade
 *      all observed against a real Apple sandbox environment.
 *   4. THEN, in production: set `APPLE_CATALOG_ACTIVE=1` (this requires a
 *      process restart / redeploy to take effect for any code path that
 *      caches a value read at module load — see `apple-capacity.ts`'s
 *      `getAppleProductCapacity()` for the one path that re-reads live) and
 *      set `NEXT_PUBLIC_APPLE_PRODUCTS` to `catalogToPublicProductsJson()`'s
 *      output (build-time env — needs a redeploy to reach the client bundle).
 *
 * PRICES ARE NOT IN THIS FILE. Per the proposal, Apple subscription prices
 * live in App Store Connect only — StoreKit/the purchase sheet is the price
 * source of truth at runtime; this repo never hardcodes a USD figure that
 * could drift from what Apple actually charges. See the proposal doc §4 for
 * the price points KC approved (informational only, for configuring ASC).
 */
import "server-only";

import type { AppleTierCeiling } from "./apple-capacity";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppleBillingInterval = "month" | "year";

/** Subscription-group level, 1 (most athletes / ranked highest) to 5 (least). */
export type AppleCatalogLevel = 1 | 2 | 3 | 4 | 5;

export interface AppleCatalogEntry {
  /** App Store Connect product id, reverse-DNS under the shipped bundle id. */
  readonly productId: string;
  readonly athleteCapacity: AppleTierCeiling;
  readonly interval: AppleBillingInterval;
  /**
   * Subscription-group rank. Capacity 5 -> level 1 (highest), capacity 1 ->
   * level 5 (lowest) — see the proposal doc §3 ("the P2 ordering trap") for
   * why more athletes MUST rank as a numerically LOWER level: it makes
   * adding an athlete an Apple UPGRADE (immediate, D3) and removing athletes
   * an Apple DOWNGRADE (at renewal, D2).
   */
  readonly level: AppleCatalogLevel;
  /**
   * Whether this product carries the 7-day free-trial introductory offer.
   * KC-approved: `family.1.monthly` and `family.1.yearly` ONLY (capacity 1).
   * No trial on tiers 2-5.
   */
  readonly introOffer: boolean;
  /** Parent-facing label. Never "kid"; no em dashes. */
  readonly displayName: string;
}

// ---------------------------------------------------------------------------
// Group reference name
// ---------------------------------------------------------------------------

/**
 * Subscription-group reference name shown in App Store Connect and (as the
 * group display name) on Apple's purchase sheet. Per the proposal doc §2/§6.
 */
export const APPLE_GROUP_REFERENCE_NAME = "From Victory Family";

// ---------------------------------------------------------------------------
// The catalog (10 products, one subscription group)
// ---------------------------------------------------------------------------

const BUNDLE_PREFIX = "com.fromvictoryapp.app.family";

function productId(capacity: AppleTierCeiling, interval: AppleBillingInterval): string {
  const suffix = interval === "month" ? "monthly" : "yearly";
  return `${BUNDLE_PREFIX}.${capacity}.${suffix}`;
}

function athleteWord(capacity: AppleTierCeiling): string {
  return capacity === 1 ? "1 athlete" : `Up to ${capacity} athletes`;
}

function displayName(capacity: AppleTierCeiling, interval: AppleBillingInterval): string {
  const cadence = interval === "month" ? "monthly" : "yearly";
  return `${athleteWord(capacity)} · ${cadence}`;
}

/**
 * Capacity -> subscription-group level. More athletes ranks numerically
 * LOWER (level 1 = 5 athletes, level 5 = 1 athlete) — see `AppleCatalogEntry.level`.
 */
const LEVEL_BY_CAPACITY: Readonly<Record<AppleTierCeiling, AppleCatalogLevel>> =
  Object.freeze({ 5: 1, 4: 2, 3: 3, 2: 4, 1: 5 });

const CAPACITIES: readonly AppleTierCeiling[] = [1, 2, 3, 4, 5];
const INTERVALS: readonly AppleBillingInterval[] = ["month", "year"];

function buildCatalog(): readonly AppleCatalogEntry[] {
  const entries: AppleCatalogEntry[] = [];
  for (const capacity of CAPACITIES) {
    for (const interval of INTERVALS) {
      entries.push(
        Object.freeze({
          productId: productId(capacity, interval),
          athleteCapacity: capacity,
          interval,
          level: LEVEL_BY_CAPACITY[capacity],
          introOffer: capacity === 1,
          displayName: displayName(capacity, interval),
        }),
      );
    }
  }
  return Object.freeze(entries);
}

/**
 * The 10-product Apple subscription-group catalog. Frozen, read-only.
 * DATA ONLY — see file header for the activation gate.
 */
export const APPLE_PRODUCT_CATALOG: readonly AppleCatalogEntry[] = buildCatalog();

// ---------------------------------------------------------------------------
// Derived views
// ---------------------------------------------------------------------------

/** Product id -> athlete-capacity ceiling, derived from the catalog. */
export function catalogCapacityMap(): Readonly<Record<string, AppleTierCeiling>> {
  const map: Record<string, AppleTierCeiling> = {};
  for (const entry of APPLE_PRODUCT_CATALOG) {
    map[entry.productId] = entry.athleteCapacity;
  }
  return Object.freeze(map);
}

/**
 * Serializes the catalog into the exact JSON string that
 * `NEXT_PUBLIC_APPLE_PRODUCTS` must be set to on activation — an array of
 * `{ productId, athleteCapacity, displayName }` objects, matching
 * `AppleProductConfig` in `./apple-products.ts`.
 */
export function catalogToPublicProductsJson(): string {
  return JSON.stringify(
    APPLE_PRODUCT_CATALOG.map((entry) => ({
      productId: entry.productId,
      athleteCapacity: entry.athleteCapacity,
      displayName: entry.displayName,
    })),
  );
}

// ---------------------------------------------------------------------------
// Activation gate
// ---------------------------------------------------------------------------

/**
 * Whether the Apple product catalog is ACTIVE, i.e. whether
 * `APPLE_PRODUCT_CAPACITY` (`./apple-capacity.ts`) should be populated from
 * this catalog instead of staying an empty map.
 *
 * Reads `process.env.APPLE_CATALOG_ACTIVE` fresh on every call — server-side
 * only (this whole module is `server-only`). The value must be the EXACT
 * string `"1"`; anything else (unset, `"0"`, `"true"`, `"yes"`, ...) is
 * treated as inactive. This is a build/deploy-time flag, not a live toggle —
 * flipping it in a running process only affects code paths that call this
 * function fresh each time (see `apple-capacity.ts`'s
 * `getAppleProductCapacity()`); a production activation is done via env var
 * + redeploy, per the file header's activation checklist.
 */
export function isAppleCatalogActive(): boolean {
  return process.env.APPLE_CATALOG_ACTIVE === "1";
}
