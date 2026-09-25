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
 * (`lib/actions/athletes.ts`).
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
