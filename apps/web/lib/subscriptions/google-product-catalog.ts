/**
 * google-product-catalog.ts — Google Play subscription catalog (FV-661, Play
 * Billing C3), per `docs/fv651-android-play-billing-decision-record.md`
 * Section 5.2.
 *
 * PROVISIONAL IDS — NOT APPROVED. KC has NOT yet approved these product /
 * base-plan / offer ids (record decision G1). Play product ids can never be
 * changed or reused once created in Play Console, so nothing may be created
 * there until KC signs off. Every id lives in the CONSTANTS BLOCK below and
 * nowhere else in the repo, so a change is a one-line edit here.
 *
 * STATUS: DORMANT BY DEFAULT. This file is DATA ONLY. Nothing consults the
 * catalog as active, and the Play server actions refuse, until the server env
 * var `GOOGLE_PLAY_CATALOG_ACTIVE` is the exact string `"1"` (record 6.1,
 * the "server flag" lock). Same pattern as `apple-product-catalog.ts`.
 *
 * PRICES ARE NOT IN THIS FILE. Play prices live in Play Console only.
 */
import "server-only";

// ---------------------------------------------------------------------------
// Constants block — the single place Play ids live. PROVISIONAL (see header).
// ---------------------------------------------------------------------------

/** Android application id (Play package name). */
export const GOOGLE_PLAY_PACKAGE_NAME = "com.fromvictoryapp.app";

/** Product id for a tier: `family.<athletes>`. PROVISIONAL. */
const PRODUCT_ID_PREFIX = "family.";

/** Base plan ids. PROVISIONAL. */
const BASE_PLAN_MONTHLY = "monthly";
const BASE_PLAN_YEARLY = "yearly";

/** Free-trial offer id, tier 1 base plans only. PROVISIONAL. */
const TRIAL_OFFER_ID = "trial-7d";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Athlete ceiling per Play tier: 1 to 5, same as Apple (record 7.5). */
export type GoogleTierCeiling = 1 | 2 | 3 | 4 | 5;

export type GoogleBillingInterval = "month" | "year";

export interface GooglePlayCatalogEntry {
  readonly productId: string;
  readonly basePlanId: string;
  readonly athleteCapacity: GoogleTierCeiling;
  readonly interval: GoogleBillingInterval;
  /** Offer id of the free trial, or null. Tier 1 only. */
  readonly trialOfferId: string | null;
  /** Parent-facing label. Never "kid". */
  readonly displayName: string;
}

// ---------------------------------------------------------------------------
// The catalog (5 products x 2 base plans = 10 entries)
// ---------------------------------------------------------------------------

const CAPACITIES: readonly GoogleTierCeiling[] = [1, 2, 3, 4, 5];
const INTERVALS: readonly GoogleBillingInterval[] = ["month", "year"];

function athleteWord(capacity: GoogleTierCeiling): string {
  return capacity === 1 ? "1 athlete" : `Up to ${capacity} athletes`;
}

function buildCatalog(): readonly GooglePlayCatalogEntry[] {
  const entries: GooglePlayCatalogEntry[] = [];
  for (const capacity of CAPACITIES) {
    for (const interval of INTERVALS) {
      entries.push(
        Object.freeze({
          productId: `${PRODUCT_ID_PREFIX}${capacity}`,
          basePlanId: interval === "month" ? BASE_PLAN_MONTHLY : BASE_PLAN_YEARLY,
          athleteCapacity: capacity,
          interval,
          trialOfferId: capacity === 1 ? TRIAL_OFFER_ID : null,
          displayName: `${athleteWord(capacity)} · ${interval === "month" ? "monthly" : "yearly"}`,
        }),
      );
    }
  }
  return Object.freeze(entries);
}

/** Frozen, read-only. DATA ONLY: see the file header for the activation gate. */
export const GOOGLE_PLAY_CATALOG: readonly GooglePlayCatalogEntry[] = buildCatalog();

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/** Catalog entry for a (product id, base plan id) pair, or null if unknown. */
export function googleCatalogEntry(
  productId: string,
  basePlanId: string,
): GooglePlayCatalogEntry | null {
  return (
    GOOGLE_PLAY_CATALOG.find(
      (e) => e.productId === productId && e.basePlanId === basePlanId,
    ) ?? null
  );
}

/** Catalog entry for a provider-neutral (capacity, interval) key. */
export function googleCatalogEntryForPlan(
  athleteCapacity: GoogleTierCeiling,
  interval: GoogleBillingInterval,
): GooglePlayCatalogEntry {
  const entry = GOOGLE_PLAY_CATALOG.find(
    (e) => e.athleteCapacity === athleteCapacity && e.interval === interval,
  );
  if (!entry) {
    // Unreachable for the typed inputs; guards a future catalog edit.
    throw new Error("google catalog has no entry for the requested plan");
  }
  return entry;
}

/**
 * Athlete ceiling for a Play product id. Returns null for an unknown product,
 * and ALWAYS null while the catalog is inactive (so no gate can consult a
 * dormant catalog).
 */
export function googleCapacityForProduct(productId: string): GoogleTierCeiling | null {
  if (!isGooglePlayCatalogActive()) return null;
  const entry = GOOGLE_PLAY_CATALOG.find((e) => e.productId === productId);
  return entry ? entry.athleteCapacity : null;
}

// ---------------------------------------------------------------------------
// Activation gate
// ---------------------------------------------------------------------------

/**
 * Whether the Play catalog is ACTIVE. Reads `GOOGLE_PLAY_CATALOG_ACTIVE` fresh
 * on every call; the value must be the EXACT string `"1"`. Anything else
 * (unset, "0", "true", "yes", " 1") is inactive.
 */
export function isGooglePlayCatalogActive(): boolean {
  return process.env.GOOGLE_PLAY_CATALOG_ACTIVE === "1";
}
