/**
 * Athlete-capacity ceilings (FV-570), per
 * docs/fv210-ios-iap-decision-record.md Section 4.6 ("Capacity (athlete
 * count) — DECIDED").
 *
 * INVARIANT: Stripe and comp-grant families are NEVER capped. The capacity
 * ceiling is an Apple-tier concept only — Stripe uses per-seat quantity with
 * no ceiling, by explicit KC decision + test AC (record Section 4.6:
 * "existing (and future) Stripe families above five athletes are NEVER
 * silently capped").
 *
 * This module is `server-only` transitively (it imports `./apple`, which is
 * `server-only`) — it is only ever used from server actions
 * (`lib/actions/athletes.ts`, and — for the D3 upgrade allowance below —
 * `lib/actions/apple-subscription.ts`).
 *
 * Also home to `isStrictAppleCapacityUpgrade` (FV-586, KC decision D3): the
 * mirror-image "may this Apple payer purchase a HIGHER-capacity product"
 * check consulted by the FV-581/584 duplicate-purchase guard. See that
 * function's doc comment.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

import { getActiveAppleProductId } from "./apple";

type ServiceClient = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Capacity map
// ---------------------------------------------------------------------------

/** Apple paid tiers are 1-5 athletes (record Section 4.6, P1 DECIDED). */
export type AppleTierCeiling = 1 | 2 | 3 | 4 | 5;

/**
 * Maps an Apple product id (App Store Connect config, Open Item P2) to its
 * athlete-count ceiling. Starts EMPTY: product ids are not assigned yet
 * (release-held App Store Connect config). The shape (string keys, values
 * constrained to 1-5) is test-pinned now so wiring in real product ids later
 * is a pure data change with no code change.
 *
 * This is the SINGLE place ceilings live — do not duplicate this map or
 * hardcode a ceiling value anywhere else.
 */
export const APPLE_PRODUCT_CAPACITY: Readonly<Record<string, AppleTierCeiling>> =
  Object.freeze({});

/**
 * Looks up the athlete-count ceiling for an Apple product id.
 *
 * Returns `null` for an unknown product id — this is a deliberate
 * FAIL-OPEN-FOR-ADDS choice, not a bug: with the map currently empty (P2 not
 * yet decided), every real Apple product id is "unknown" today, and a payer
 * who legitimately purchased a real Apple subscription must not be blocked
 * from adding an athlete because our internal config lag hasn't caught up
 * yet. Blocking a paying family's athlete-add on a mapping gap would punish
 * them for OUR config debt, not theirs. Callers MUST treat a `null` return
 * as "no ceiling data — do not block" and log a warning so the gap is
 * visible operationally.
 *
 * @param productId  The Apple product/price identifier from the payer's
 *                    active `apple_subscriptions` row.
 */
export function capacityForAppleProduct(productId: string): number | null {
  const ceiling = APPLE_PRODUCT_CAPACITY[productId];
  if (ceiling === undefined) {
    console.warn(
      `[subscriptions/apple-capacity] Unknown Apple product id "${productId}" — no ceiling data, not blocking (fail-open-for-adds).`,
    );
    return null;
  }
  return ceiling;
}

// ---------------------------------------------------------------------------
// Provider-aware ceiling resolution
// ---------------------------------------------------------------------------

export type CapacityProvider = "stripe" | "comp" | "apple" | "none";

/**
 * Resolves the athlete-count ceiling for a payer's provider.
 *
 * INVARIANT (record Section 4.6): stripe and comp are NEVER capped — always
 * returns `null` ("uncapped"), regardless of athlete count. Only `apple`
 * ever returns a numeric ceiling (via `capacityForAppleProduct`), and even
 * then only when the product id is in the (currently empty) capacity map.
 *
 * @param input.provider        The payer's resolved entitlement provider.
 * @param input.appleProductId  The payer's active Apple product id, if
 *                               provider === "apple". Ignored otherwise.
 */
export function payerCapacityCeiling(input: {
  provider: CapacityProvider;
  appleProductId?: string | null;
}): number | null {
  if (input.provider === "stripe" || input.provider === "comp") {
    // Stripe families are never capped — explicit invariant (record §4.6).
    return null;
  }

  if (input.provider === "apple") {
    if (!input.appleProductId) return null;
    return capacityForAppleProduct(input.appleProductId);
  }

  // "none" — no provider at all (e.g. a payer who hasn't subscribed yet).
  // Not this module's concern to block; the existing blocked-Stripe-payer
  // non-goal (record §4.6) already leaves athlete creation unchanged for
  // payers with no active provider.
  return null;
}

// ---------------------------------------------------------------------------
// assertAthleteCapacity — the add-gate helper wired into createAthlete()
// ---------------------------------------------------------------------------

export type AssertAthleteCapacityResult =
  | { allowed: true }
  | { allowed: false; reason: "capacity_reached" };

/**
 * Server-side add-gate: determines whether a payer may add another athlete.
 *
 * Resolves the payer's provider by checking for an active Production Apple
 * subscription row via the centralized `./apple` accessor
 * (`getActiveAppleProductId`) — the ONLY allowed reader of
 * `apple_subscriptions` outside `./apple` itself. A payer with no active
 * Apple row is treated as "apple: none" for this gate — this function does
 * NOT gate blocked-Stripe payers or payers with no subscription at all
 * (record Section 4.6: "Blocked-Stripe-payer athlete creation stays
 * UNCHANGED in this arc" — an explicit non-goal). Stripe/comp payers are
 * never capped by this function regardless of athlete count, per the
 * invariant above.
 *
 * With `APPLE_PRODUCT_CAPACITY` currently empty, this function is INERT: no
 * Apple product id maps to a ceiling yet, so `capacityForAppleProduct`
 * always returns `null` and every call resolves `{ allowed: true }`.
 *
 * @param service             Service-role Supabase client.
 * @param payerId             UUID of the payer's profile row.
 * @param currentAthleteCount The payer's athlete count BEFORE this add
 *                             (caller-supplied — this function performs no
 *                             athlete-count query itself, matching the
 *                             single-responsibility shape of the other
 *                             accessor functions in this file).
 */
export async function assertAthleteCapacity(
  service: ServiceClient,
  payerId: string,
  currentAthleteCount: number,
): Promise<AssertAthleteCapacityResult> {
  const appleProductId = await getActiveAppleProductId(service, payerId);

  if (!appleProductId) {
    // No active Apple subscription — not an Apple payer for capacity
    // purposes (Stripe/comp/none payers are never capped here).
    return { allowed: true };
  }

  const ceiling = payerCapacityCeiling({
    provider: "apple",
    appleProductId,
  });

  if (ceiling === null) {
    // No ceiling data for this product id (empty map, or an unmapped
    // product) — fail open for adds. See capacityForAppleProduct's doc
    // comment for the rationale.
    return { allowed: true };
  }

  if (currentAthleteCount >= ceiling) {
    return { allowed: false, reason: "capacity_reached" };
  }

  return { allowed: true };
}

// ---------------------------------------------------------------------------
// isStrictAppleCapacityUpgrade — D3 upgrade allowance for the duplicate-
// purchase guard (FV-586, KC decision D3)
// ---------------------------------------------------------------------------

/**
 * D3 (FV-586, KC decision 2026-09-17): Apple's server-side purchase pipeline
 * gives us no equivalent of Stripe's `trial_end: "now"` conversion call — the
 * ONLY mechanism to add athletes to an Apple-billed family mid-cycle is the
 * parent purchasing a higher-capacity product through Apple's OWN purchase
 * sheet, which is itself the "explicit confirmation" D3 requires (Apple, not
 * us, shows the price and charges the card). So for Apple — and Apple only —
 * the FV-581/584 duplicate-purchase guard in `beginApplePurchase`
 * (lib/actions/apple-subscription.ts) carves out a strict upgrade: a
 * currently-entitled Apple payer purchasing a product whose capacity ceiling
 * is STRICTLY GREATER than their current product's ceiling may mint a fresh
 * purchase token. Any other purchase attempt by an Apple-entitled payer — the
 * same product (accidental re-tap), a lower/equal product (a downgrade —
 * that's the separate, gated seat-selection flow in `./seat-state.ts`, not a
 * purchase), or a product either side can't resolve a ceiling for — is
 * refused.
 *
 * FAIL-CLOSED (the OPPOSITE of `capacityForAppleProduct`'s fail-OPEN
 * default): a `null` ceiling on EITHER side — no active current product, or
 * either product id missing from `APPLE_PRODUCT_CAPACITY` — refuses the
 * upgrade. `capacityForAppleProduct`'s fail-open stance exists so a config
 * lag never blocks an athlete ADD for a real paying family; here the
 * asymmetric risk runs the other way — minting a purchase token we can't
 * prove is actually a capacity increase risks a same-or-lower "upgrade"
 * slipping past the duplicate-purchase guard. Refusing is always safe (the
 * payer's existing entitlement is untouched either way), and once real
 * product ids are assigned (Open Item P2) genuine upgrades work immediately
 * with no code change.
 *
 * @param service            Service-role Supabase client.
 * @param payerId            UUID of the payer's profile row.
 * @param requestedProductId The Apple product id the payer is attempting to
 *                            purchase right now.
 */
export async function isStrictAppleCapacityUpgrade(
  service: ServiceClient,
  payerId: string,
  requestedProductId: string,
): Promise<boolean> {
  const currentProductId = await getActiveAppleProductId(service, payerId);
  if (!currentProductId) return false;

  const currentCeiling = capacityForAppleProduct(currentProductId);
  const requestedCeiling = capacityForAppleProduct(requestedProductId);
  if (currentCeiling === null || requestedCeiling === null) return false;

  return requestedCeiling > currentCeiling;
}
