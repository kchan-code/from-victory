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
 * (capacity gate), `lib/actions/subscription.ts` (trial-history check),
 * `app/dashboard/settings/page.tsx` (FV-578 — Apple-vs-Stripe manage-path
 * status read, via `getActiveAppleProductId`; FV-580 — error-visible status
 * display via `getActiveAppleProductIdResult`), and
 * `app/athlete/settings/page.tsx` (FV-579 — adult_athlete provider-aware
 * manage/buy status, via `getActiveAppleProductIdResult`).
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
// getActiveAppleProductIdResult / getActiveAppleProductId
// ---------------------------------------------------------------------------

/**
 * Result shape for `getActiveAppleProductIdResult` — distinguishes "no active
 * row" from "we couldn't tell" so an error-visible caller (FV-580) can render
 * an honest degraded-status message instead of silently reading as "no
 * subscription."
 */
export type ActiveAppleProductIdResult = {
  productId: string | null;
  /** True when the DB read itself failed — `productId` is meaningless (not a
   * trustworthy "no active row") in that case; it is always `null` on error
   * so callers can't accidentally branch on a stale/default value. */
  readError: boolean;
};

/**
 * Returns the `product_id` of the payer's active Production Apple
 * subscription row (or null if they don't have one), PLUS whether the
 * underlying DB read failed — error-visible, for callers that must not
 * conflate "read failed" with "definitely no active subscription" (FV-580).
 *
 * Same query and the same "active" determination as `getActiveAppleProductId`
 * below (this function does the real work; `getActiveAppleProductId`
 * delegates to it and collapses the error case to fail-open `null`, which is
 * the ORIGINAL, still-correct contract for its caller, the capacity gate).
 *
 * "Active" here means the row exists and its status maps to `full` or
 * `degraded` via `appleSubscriptionAccessLevel` — an `expired`/`revoked` row
 * should not hold the payer to a stale product's ceiling. This is the
 * existing full/degraded determination carried over unchanged; it is not a
 * degraded-payer POLICY decision made by this issue (record §4.4's
 * degraded-payer treatment remains unresolved — see the file-level doc
 * comment on `getActiveAppleProductId` below).
 *
 * @param service  Service-role Supabase client.
 * @param payerId  UUID of the payer's profile row.
 * @param now      Current time (injected for testability).
 */
export async function getActiveAppleProductIdResult(
  service: ServiceClient,
  payerId: string,
  now: Date = new Date(),
): Promise<ActiveAppleProductIdResult> {
  const { data: row, error } = await service
    .from("apple_subscriptions")
    .select("product_id, status, expires_at, grace_period_expires_at")
    .eq("payer_id", payerId)
    .eq("environment", "Production")
    .maybeSingle();

  if (error) {
    console.error(
      `[subscriptions/apple] getActiveAppleProductIdResult read failed (payer=${payerId}):`,
      error.message,
    );
    // Error-visible: never swallow to a false "no active row" — the caller
    // decides how to fail (fail-open for the capacity gate via
    // `getActiveAppleProductId` below; fail-safe/error-visible for a status
    // display via this function directly).
    return { productId: null, readError: true };
  }

  if (!row) return { productId: null, readError: false };

  const level = appleSubscriptionAccessLevel(
    row.status as AppleSubscriptionStatus,
    row.expires_at,
    row.grace_period_expires_at,
    now,
  );

  return {
    productId: level === "full" || level === "degraded" ? row.product_id : null,
    readError: false,
  };
}

/**
 * Returns the `product_id` of the payer's active Production Apple
 * subscription row, or null if they don't have one (including on a DB read
 * error — FAIL-OPEN). Used by `./apple-capacity`'s `assertAthleteCapacity` to
 * determine whether a payer is on the Apple provider at all (a payer with no
 * Production row is not an Apple payer for capacity purposes, regardless of
 * any Sandbox test rows — capacity ceilings are a real-billing concept,
 * matching the `hasEverHeldAppleEntitlement` Production-only scoping above).
 *
 * FAIL-OPEN CONTRACT (unchanged by FV-580): this is correct for the capacity
 * gate specifically — a transient read error must not spuriously CAP an
 * otherwise-uncapped payer's athlete count, so it degrades to "not an Apple
 * payer" rather than blocking. This is NOT the right contract for a
 * status-DISPLAY caller (a transient error there must not silently read as
 * "no subscription" — see `getActiveAppleProductIdResult` above, added for
 * `app/dashboard/settings/page.tsx`, FV-580).
 *
 * Delegates to `getActiveAppleProductIdResult` for the query + the
 * full/degraded determination; this wrapper only collapses `readError` to
 * `null` to preserve the exact behavior every existing caller depends on.
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
  const { productId, readError } = await getActiveAppleProductIdResult(
    service,
    payerId,
    now,
  );
  return readError ? null : productId;
}

// ---------------------------------------------------------------------------
// getPendingAppleRenewalProductId — FV-602 read side for a SCHEDULED (not
// yet effective) renewal-product change.
// ---------------------------------------------------------------------------

/**
 * Returns the payer's PENDING Apple renewal product id — the product a
 * scheduled downgrade (DID_CHANGE_RENEWAL_PREF, subtype DOWNGRADE) will
 * apply at the payer's NEXT renewal — or `null` when there is no scheduled
 * change (including on a DB read error: fail-open, since this is purely
 * informational).
 *
 * This is DELIBERATELY separate from, and never folded into,
 * `getActiveAppleProductId`/`getActiveAppleProductIdResult`: those two
 * answer "what does the payer's CURRENT entitlement allow," and nothing
 * about a scheduled-but-not-yet-effective product may ever reduce (or
 * otherwise change) that answer or any capacity ceiling derived from it
 * (`./apple-capacity.ts`) — the FV-602 acceptance criteria are explicit that
 * this issue makes no capacity/seat-logic change. Callers wanting to render
 * "you're changing to X at your next renewal" (e.g. a future FV-585 seat
 * prompt) call this ADDITIONALLY, alongside the existing active-product
 * read, never as a replacement for it.
 *
 * Production-scoped only, matching every other read in this module — a
 * Sandbox test row's scheduled-change state is never surfaced as if it were
 * real.
 *
 * @param service  Service-role Supabase client.
 * @param payerId  UUID of the payer's profile row.
 */
export async function getPendingAppleRenewalProductId(
  service: ServiceClient,
  payerId: string,
): Promise<string | null> {
  const { data: row, error } = await service
    .from("apple_subscriptions")
    .select("auto_renew_product_id")
    .eq("payer_id", payerId)
    .eq("environment", "Production")
    .maybeSingle();

  if (error) {
    console.error(
      `[subscriptions/apple] getPendingAppleRenewalProductId read failed (payer=${payerId}):`,
      error.message,
    );
    // Fail-open: this is informational only (never a capacity/gating
    // decision), so a transient read error degrades to "nothing scheduled"
    // rather than throwing.
    return null;
  }

  return row?.auto_renew_product_id ?? null;
}
