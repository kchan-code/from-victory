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
 * status read; FV-580 — error-visible status display; FV-595 — switched to
 * the sandbox-allowlist-aware `getDisplayedAppleProductIdResult`), and
 * `app/athlete/settings/page.tsx` (FV-579 — adult_athlete provider-aware
 * manage/buy status; FV-595 — same switch to
 * `getDisplayedAppleProductIdResult`).
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
// Sandbox-allowlist membership — shared read (FV-595 factor-out)
// ---------------------------------------------------------------------------

/**
 * Reads `apple_sandbox_testers` membership for a payer. Factored out so both
 * `getAppleAccessLevelForPayer` (entitlement gate) and
 * `getDisplayedAppleProductIdResult` (status display, FV-595) apply the exact
 * same allowlist rule instead of two independently-maintained copies of the
 * same query.
 *
 * Behavior is unchanged from the inline version this replaces: an error here
 * does not throw — callers decide how to treat `readError` (the entitlement
 * gate fails closed to "not allowlisted"; a display-only caller may prefer to
 * surface the error instead of guessing).
 */
async function readSandboxAllowlistMembership(
  service: ServiceClient,
  payerId: string,
): Promise<{ isAllowlisted: boolean; readError: boolean }> {
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

  return {
    isAllowlisted: !allowlistError && allowlistRow !== null,
    readError: Boolean(allowlistError),
  };
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
  const { isAllowlisted } = await readSandboxAllowlistMembership(
    service,
    payerId,
  );

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
 * `app/dashboard/settings/page.tsx`, FV-580; superseded on that page by the
 * sandbox-allowlist-aware `getDisplayedAppleProductIdResult` below, FV-595).
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
// getDisplayedAppleProductIdResult — STATUS-DISPLAY-ONLY accessor (FV-595)
// ---------------------------------------------------------------------------

/**
 * *** STATUS-DISPLAY SURFACES ONLY (e.g. Settings pages). ***
 *
 * This accessor must NEVER feed a capacity, trial-eligibility,
 * subscribe-guard, seat-state, or any other purchase/entitlement DECISION.
 * Those all remain on the Production-only accessors above
 * (`getActiveAppleProductId`, `getActiveAppleProductIdResult`,
 * `hasEverHeldAppleEntitlement`) — that scoping is deliberate (see their doc
 * comments) and unaffected by this function.
 *
 * Root cause this fixes: the entitlement gate (`getAppleAccessLevelForPayer`
 * above, consumed by `./access`) already grants access from Production rows
 * PLUS Sandbox rows when the payer is allowlisted in `apple_sandbox_testers`.
 * A status-display accessor that instead reads Production-only (as
 * `getActiveAppleProductIdResult` does for capacity-adjacent purposes)
 * disagrees with that grant: an allowlisted sandbox tester (QA, or an App
 * Reviewer running a sandbox purchase) would see "subscribed" from the real
 * entitlement gate but "No active subscription" on a Settings-style status
 * page. This function makes status displays agree with the entitlement
 * gate's own environment rule:
 *
 *   1. Read `apple_sandbox_testers` membership (reuses
 *      `readSandboxAllowlistMembership`, the same check the entitlement gate
 *      uses).
 *   2. Read the payer's `apple_subscriptions` rows (at most one per
 *      environment — UNIQUE (payer_id, environment)).
 *   3. Eligible rows: Production rows always count; a Sandbox row counts
 *      ONLY when the payer is allowlisted.
 *   4. Among eligible rows whose status maps to `full`/`degraded` via
 *      `appleSubscriptionAccessLevel`, a Production row is preferred over a
 *      Sandbox row when both are active — a real subscription is never
 *      shadowed by test debris on a status page.
 *
 * Error-visible: a DB read error on EITHER the allowlist read or the
 * subscriptions read returns `{ productId: null, readError: true }` — never
 * a silent "no subscription." The caller decides how to render that
 * (typically a neutral "couldn't load your subscription status" note, never
 * a buy CTA on error).
 *
 * @param service  Service-role Supabase client (bypasses RLS by design).
 * @param payerId  UUID of the payer's profile row.
 * @param now      Current time (injected for testability).
 */
export async function getDisplayedAppleProductIdResult(
  service: ServiceClient,
  payerId: string,
  now: Date = new Date(),
): Promise<ActiveAppleProductIdResult> {
  const { isAllowlisted, readError: allowlistReadError } =
    await readSandboxAllowlistMembership(service, payerId);

  if (allowlistReadError) {
    // Error-visible: don't guess "not allowlisted" for a display surface —
    // that could hide a real, allowlisted sandbox tester's active status.
    return { productId: null, readError: true };
  }

  const { data: rows, error: subsError } = await service
    .from("apple_subscriptions")
    .select(
      "environment, product_id, status, expires_at, grace_period_expires_at",
    )
    .eq("payer_id", payerId);

  if (subsError) {
    console.error(
      `[subscriptions/apple] getDisplayedAppleProductIdResult read failed (payer=${payerId}):`,
      subsError.message,
    );
    return { productId: null, readError: true };
  }

  if (!rows || rows.length === 0) {
    return { productId: null, readError: false };
  }

  const eligibleRows = rows.filter(
    (row) =>
      row.environment === "Production" ||
      (row.environment === "Sandbox" && isAllowlisted),
  );

  // Production preferred over Sandbox when both are eligible+active — order
  // Production first so the loop below returns it first.
  const ordered = [...eligibleRows].sort((a, b) => {
    if (a.environment === b.environment) return 0;
    return a.environment === "Production" ? -1 : 1;
  });

  for (const row of ordered) {
    const level = appleSubscriptionAccessLevel(
      row.status as AppleSubscriptionStatus,
      row.expires_at,
      row.grace_period_expires_at,
      now,
    );
    if (level === "full" || level === "degraded") {
      return { productId: row.product_id, readError: false };
    }
  }

  return { productId: null, readError: false };
}
