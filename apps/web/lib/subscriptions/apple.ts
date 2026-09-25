/**
 * The ONE centralized accessor for `apple_subscriptions` entitlement reads
 * (FV-570, docs/fv210-ios-iap-decision-record.md Section 4.9 mandate:
 * "Mandate a single centralized accessor for apple_subscriptions
 * entitlement reads (one function; no ad hoc reads elsewhere)").
 *
 * No other file may query `apple_subscriptions` directly. This module is
 * `server-only` and always reads via the service-role client — the
 * environment wall (Production-only unless allowlisted) is APPLICATION
 * CODE, not RLS (record Section 4.9: "Enforcement locus is application
 * code, not RLS — centralize it").
 *
 * Allowed callers: `./access` (the resolver fold), `./apple-capacity`
 * (capacity gate), `lib/actions/subscription.ts` (trial-history check).
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

import {
  appleSubscriptionAccessLevel,
  type AppleSubscriptionStatus,
} from "./apple-access-level";
import type { AccessLevel } from "./access-level";

type ServiceClient = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Best-of ordering helper
// ---------------------------------------------------------------------------

const LEVEL_RANK: Record<AccessLevel, number> = {
  full: 2,
  degraded: 1,
  blocked: 0,
};

function bestLevel(a: AccessLevel, b: AccessLevel): AccessLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

// ---------------------------------------------------------------------------
// getAppleAccessLevelForPayer
// ---------------------------------------------------------------------------

/**
 * Returns the effective Apple-derived AccessLevel for a payer.
 *
 * Environment scoping (record Section 4.9 — security-critical): Sandbox JWS
 * payloads are freely obtainable, so a Sandbox row must never grant access
 * for a payer who isn't explicitly allowlisted. This function:
 *   1. Reads `apple_sandbox_testers` for the payer (membership check).
 *   2. Reads the payer's `apple_subscriptions` rows scoped to
 *      `environment = 'Production'`, PLUS `environment = 'Sandbox'` rows
 *      ONLY if the payer is allowlisted.
 *   3. Maps each row via `appleSubscriptionAccessLevel()` and returns the
 *      BEST level across rows (full > degraded > blocked) — a payer with,
 *      say, a stale expired Sandbox test row and a valid Production row
 *      must not have their real entitlement dragged down by test debris.
 *
 * Fail-closed on DB error (mirrors `./grants` and `./access` style): logs
 * and returns "blocked" rather than risking granting access on an error
 * path. Callers (the resolver fold) treat this as "no Apple entitlement" and
 * fall back to whatever the other providers say.
 *
 * @param service  Service-role Supabase client (bypasses RLS by design —
 *                 this is the one function allowed to query the table).
 * @param payerId  UUID of the payer's profile row (parent or adult_athlete).
 * @param now      Current time (injected for testability).
 */
export async function getAppleAccessLevelForPayer(
  service: ServiceClient,
  payerId: string,
  now: Date = new Date(),
): Promise<AccessLevel> {
  const { data: allowlistRow, error: allowlistError } = await service
    .from("apple_sandbox_testers")
    .select("payer_id")
    .eq("payer_id", payerId)
    .maybeSingle();

  if (allowlistError) {
    console.error(
      `[subscriptions/apple] allowlist read failed (payer=${payerId}):`,
      allowlistError.message,
    );
    // Fail closed: on error, treat as NOT allowlisted (the more restrictive
    // branch) rather than accidentally widening Sandbox access.
  }
  const isAllowlisted = !allowlistError && allowlistRow !== null;

  const { data: rows, error: subsError } = await service
    .from("apple_subscriptions")
    .select(
      "environment, status, expires_at, grace_period_expires_at",
    )
    .eq("payer_id", payerId);

  if (subsError) {
    console.error(
      `[subscriptions/apple] apple_subscriptions read failed (payer=${payerId}):`,
      subsError.message,
    );
    // Fail closed: a DB error must never risk granting access.
    return "blocked";
  }

  if (!rows || rows.length === 0) {
    return "blocked";
  }

  const eligibleRows = rows.filter(
    (row) => row.environment === "Production" || (row.environment === "Sandbox" && isAllowlisted),
  );

  let best: AccessLevel = "blocked";
  for (const row of eligibleRows) {
    const level = appleSubscriptionAccessLevel(
      row.status as AppleSubscriptionStatus,
      row.expires_at,
      row.grace_period_expires_at,
      now,
    );
    best = bestLevel(best, level);
  }

  return best;
}

// ---------------------------------------------------------------------------
// hasEverHeldAppleEntitlement — trial-history mechanics (record Section 4.5)
// ---------------------------------------------------------------------------

/**
 * Returns true if the payer has EVER held an Apple entitlement — used by the
 * cross-provider one-trial rule (record Section 4.5: "trial-eligible iff no
 * Stripe row has ever existed AND no Apple entitlement has ever existed for
 * the payer").
 *
 * SCOPE DECISION — Production rows only: a QA payer's Sandbox test purchase
 * must never burn a real family's trial eligibility. Sandbox transactions
 * cost nothing and are created freely during development/testing; counting
 * them here would let an engineer's or App Reviewer's Sandbox test
 * permanently mark a real production account (if the allowlisted payer ever
 * becomes a real paying customer under the same profile id) as
 * trial-ineligible for no legitimate reason. Trial history is a Production
 * billing concept — it tracks whether Apple has ever actually sold this
 * payer a real subscription, not whether they've ever touched a test
 * environment.
 *
 * FAIL-CLOSED CONTRACT (PR-#185 semantics, mirrored exactly): unlike
 * `getAppleAccessLevelForPayer`, this function THROWS on a DB error rather
 * than returning a default. The caller (`lib/actions/subscription.ts`)
 * aborts checkout on any error from this call — a transient read error must
 * never risk granting a trial the payer isn't entitled to.
 *
 * @param service  Service-role Supabase client.
 * @param payerId  UUID of the payer's profile row.
 * @throws Error   If the DB read fails. The caller MUST catch this and fail
 *                 checkout closed (same shape as the existing Stripe
 *                 subscriptions read in startSubscriptionCheckout).
 */
export async function hasEverHeldAppleEntitlement(
  service: ServiceClient,
  payerId: string,
): Promise<boolean> {
  const { count, error } = await service
    .from("apple_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("payer_id", payerId)
    .eq("environment", "Production");

  if (error) {
    throw new Error(
      `[subscriptions/apple] hasEverHeldAppleEntitlement read failed (payer=${payerId}): ${error.message}`,
    );
  }

  return (count ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// getActiveAppleProductId — narrow helper for the capacity gate
// ---------------------------------------------------------------------------

/**
 * Returns the `product_id` of the payer's active Production Apple
 * subscription row, or null if they don't have one. Used by
 * `./apple-capacity`'s `assertAthleteCapacity` to determine whether a payer
 * is on the Apple provider at all (a payer with no Production row is not an
 * Apple payer for capacity purposes, regardless of any Sandbox test rows —
 * capacity ceilings are a real-billing concept, matching the
 * `hasEverHeldAppleEntitlement` Production-only scoping above).
 *
 * "Active" here means the row exists and its status maps to `full` or
 * `degraded` via `appleSubscriptionAccessLevel` — an `expired`/`revoked` row
 * should not hold the payer to a stale product's ceiling.
 *
 * @param service  Service-role Supabase client.
 * @param payerId  UUID of the payer's profile row.
 * @param now      Current time (injected for testability).
 */
export async function getActiveAppleProductId(
  service: ServiceClient,
  payerId: string,
  now: Date = new Date(),
): Promise<string | null> {
  const { data: row, error } = await service
    .from("apple_subscriptions")
    .select("product_id, status, expires_at, grace_period_expires_at")
    .eq("payer_id", payerId)
    .eq("environment", "Production")
    .maybeSingle();

  if (error) {
    console.error(
      `[subscriptions/apple] getActiveAppleProductId read failed (payer=${payerId}):`,
      error.message,
    );
    return null;
  }

  if (!row) return null;

  const level = appleSubscriptionAccessLevel(
    row.status as AppleSubscriptionStatus,
    row.expires_at,
    row.grace_period_expires_at,
    now,
  );

  return level === "full" || level === "degraded" ? row.product_id : null;
}
