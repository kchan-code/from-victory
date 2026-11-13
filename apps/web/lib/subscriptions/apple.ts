/**
 * The ONE centralized accessor for `apple_subscriptions` entitlement reads
 * (FV-570, docs/fv210-ios-iap-decision-record.md Section 4.9 mandate:
 * "Mandate a single centralized accessor for apple_subscriptions
 * entitlement reads (one function; no ad hoc reads elsewhere)").
 *
 * No other file may query `apple_subscriptions` directly. This module is
 * `server-only` and always reads via the service-role client — the
 * environment wall (Production, or Sandbox for allowlisted payers —
 * `apple_sandbox_testers`, record §4.9) is APPLICATION CODE, not RLS
 * (record Section 4.9: "Enforcement locus is application code, not RLS —
 * centralize it").
 *
 * FV-596: every decision accessor in this module (`getActiveAppleProductId`
 * / `getActiveAppleProductIdResult`) now applies the exact same environment
 * rule as the entitlement gate (`getAppleAccessLevelForPayer`): Production
 * rows always count; a Sandbox row counts only for an allowlisted payer;
 * Production is preferred when both exist; a read error on either the
 * allowlist or the subscriptions table is error-visible
 * (`{ productId: null, readError: true }`), never a silent "no
 * subscription." Previously these accessors were Production-only, which
 * meant an allowlisted Sandbox tester could pass the entitlement gate but
 * still get refused/uncapped/etc. by capacity, seat-state, the
 * subscribe-button guard, and trial-conversion — all of which read through
 * this accessor. That disagreement is now closed. The sole, deliberate
 * exception is `hasEverHeldAppleEntitlement` below — trial history stays
 * Production-only; see its doc comment for why.
 *
 * Allowed callers: `./access` (the resolver fold), `./apple-capacity`
 * (capacity gate), `./seat-state` (seat/capacity read), `./subscribe-guard`
 * (duplicate-purchase guard), `./trial-conversion` (trial-history/quote
 * read), `lib/actions/subscription.ts` (trial-history check),
 * `app/subscribe/page.tsx` (D3 upgrade-capacity resolution),
 * `app/dashboard/settings/page.tsx` (FV-578 — Apple-vs-Stripe manage-path
 * status read; FV-580 — error-visible status display; FV-595/FV-596 —
 * status display reads through the shared accessor via the
 * `getDisplayedAppleProductIdResult` alias), and `app/athlete/settings/page.tsx`
 * (FV-579 — adult_athlete provider-aware manage/buy status; FV-595/FV-596 —
 * same alias).
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
 * Reads `apple_sandbox_testers` membership for a payer. Factored out so
 * `getAppleAccessLevelForPayer` (entitlement gate), `getActiveAppleProductIdResult`
 * (the decision accessor, FV-596), and its `getDisplayedAppleProductIdResult`
 * alias (FV-595/FV-596) all apply the exact same allowlist rule instead of
 * independently-maintained copies of the same query.
 *
 * Behavior is unchanged from the inline version this replaces: an error here
 * does not throw — callers decide how to treat `readError` (the entitlement
 * gate fails closed to "not allowlisted"; `getActiveAppleProductIdResult`
 * surfaces the error instead of guessing — see its doc comment).
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
  return (await readAppleEntitlementForPayer(service, payerId, now)).level;
}

/**
 * FV-625 offline Pregame bound: the latest time-bound END across the payer's
 * eligible Apple rows that currently grant access — same environment scoping
 * and the same single read as `getAppleAccessLevelForPayer`.
 *
 *   - `subscribed` (not blocked)        → `expires_at`
 *   - `in_grace_period` (not blocked)   → `grace_period_expires_at`
 *   - `in_billing_retry`                → no end date (Apple is still
 *     retrying; there is no forward bound) — contributes nothing
 *   - `expired` / `revoked` / blocked   → nothing
 *
 * The 6h renewal-latency skew (`DEFAULT_APPLE_SKEW_MS`) is NOT added: the
 * offline bound is the period end itself, not a grace window. Returns null
 * when no eligible row has a usable end, or on a read error (fail closed —
 * a shorter offline window, never a longer one).
 */
export async function getAppleEntitlementEndForPayer(
  service: ServiceClient,
  payerId: string,
  now: Date = new Date(),
): Promise<string | null> {
  return (await readAppleEntitlementForPayer(service, payerId, now)).latestEnd;
}

/**
 * FV-710: result of the payer-facing "payment problem" read for Apple.
 *
 *   - `stage: "grace"`  — an eligible row is `in_grace_period` and still
 *     grants access (Apple is retrying the charge; training continues).
 *   - `stage: "lapsed"` — an eligible row is `in_billing_retry`, or an
 *     `in_grace_period` row whose bound has passed (access is blocked while
 *     Apple keeps retrying).
 *   - `stage: null`     — no Apple payment problem to report.
 *   - `cleanlyPaid`     — an eligible row is `subscribed` with non-blocked
 *     access. Takes precedence: stage is then always null.
 *   - `readError`       — a read failed; `stage` is null and callers must
 *     show nothing (never a payment warning on a guess).
 */
export type AppleBillingIssueResult = {
  stage: "grace" | "lapsed" | null;
  cleanlyPaid: boolean;
  readError: boolean;
};

/**
 * Reads whether the payer has an Apple payment problem, using the SAME
 * environment-eligibility rule as `getAppleAccessLevelForPayer` /
 * `getActiveAppleProductIdResult` (Production rows always; Sandbox rows only
 * for an allowlisted payer — record §4.9). Error-visible like
 * `getActiveAppleProductIdResult`: a failed allowlist or subscriptions read
 * returns `readError: true`, never a silent "no issue" the caller could
 * mistake for a verified one.
 */
export async function getAppleBillingIssueForPayer(
  service: ServiceClient,
  payerId: string,
  now: Date = new Date(),
): Promise<AppleBillingIssueResult> {
  const { isAllowlisted, readError: allowlistReadError } =
    await readSandboxAllowlistMembership(service, payerId);
  if (allowlistReadError) {
    return { stage: null, cleanlyPaid: false, readError: true };
  }

  const { data: rows, error: subsError } = await service
    .from("apple_subscriptions")
    .select("environment, status, expires_at, grace_period_expires_at")
    .eq("payer_id", payerId);

  if (subsError) {
    console.error(
      `[subscriptions/apple] getAppleBillingIssueForPayer read failed (payer=${payerId}):`,
      subsError.message,
    );
    return { stage: null, cleanlyPaid: false, readError: true };
  }

  const eligibleRows = (rows ?? []).filter(
    (row) =>
      row.environment === "Production" ||
      (row.environment === "Sandbox" && isAllowlisted),
  );

  let cleanlyPaid = false;
  let grace = false;
  let lapsed = false;
  for (const row of eligibleRows) {
    const status = row.status as AppleSubscriptionStatus;
    const level = appleSubscriptionAccessLevel(
      status,
      row.expires_at,
      row.grace_period_expires_at,
      now,
    );
    if (status === "subscribed" && level !== "blocked") {
      cleanlyPaid = true;
    } else if (status === "in_grace_period") {
      if (level !== "blocked") grace = true;
      else lapsed = true;
    } else if (status === "in_billing_retry") {
      lapsed = true;
    }
  }

  if (cleanlyPaid) return { stage: null, cleanlyPaid: true, readError: false };
  // A row that still grants access (grace) outranks one that doesn't.
  return {
    stage: grace ? "grace" : lapsed ? "lapsed" : null,
    cleanlyPaid: false,
    readError: false,
  };
}

async function readAppleEntitlementForPayer(
  service: ServiceClient,
  payerId: string,
  now: Date,
): Promise<{ level: AccessLevel; latestEnd: string | null }> {
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
    return { level: "blocked", latestEnd: null };
  }

  if (!rows || rows.length === 0) {
    return { level: "blocked", latestEnd: null };
  }

  const eligibleRows = rows.filter(
    (row) => row.environment === "Production" || (row.environment === "Sandbox" && isAllowlisted),
  );

  let best: AccessLevel = "blocked";
  let latestEndMs: number | null = null;
  let latestEnd: string | null = null;
  for (const row of eligibleRows) {
    const level = appleSubscriptionAccessLevel(
      row.status as AppleSubscriptionStatus,
      row.expires_at,
      row.grace_period_expires_at,
      now,
    );
    best = bestLevel(best, level);

    if (level === "blocked") continue;
    const end =
      row.status === "subscribed"
        ? row.expires_at
        : row.status === "in_grace_period"
          ? row.grace_period_expires_at
          : null;
    if (end === null) continue;
    const endMs = new Date(end).getTime();
    if (Number.isFinite(endMs) && (latestEndMs === null || endMs > latestEndMs)) {
      latestEndMs = endMs;
      latestEnd = new Date(endMs).toISOString();
    }
  }

  return { level: best, latestEnd };
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
  /**
   * FV-710: true when the returned row is `in_billing_retry` — the
   * subscription still exists at Apple (it is retrying the charge and can
   * bill again without notice) but grants NO training access. Callers that
   * decide ACCESS must not read `productId !== null` as "has access"; that
   * decision is `getAppleAccessLevelForPayer`. Absent/false otherwise.
   */
  paymentLapsed?: boolean;
};

/**
 * Returns the `product_id` of the payer's active Apple subscription row
 * (Production, or Sandbox for allowlisted payers — `apple_sandbox_testers`,
 * record §4.9 — Production preferred when both exist), PLUS whether the
 * underlying DB read failed — error-visible, for callers that must not
 * conflate "read failed" with "definitely no active subscription" (FV-580).
 *
 * FV-596: this applies the SAME eligibility rule as the entitlement gate
 * (`getAppleAccessLevelForPayer` above) — every downstream decision that
 * used to read Production-only through this accessor (capacity, seat-state,
 * the subscribe-button guard, trial-conversion, all via
 * `getActiveAppleProductId` below) now agrees with what actually grants
 * access, so an allowlisted Sandbox tester (QA, or an App Reviewer)
 * exercises the real decision surface end to end instead of only the
 * entitlement gate. This function absorbed the sandbox-allowlist logic that
 * previously lived only in `getDisplayedAppleProductIdResult` (FV-595),
 * which is now a thin alias of this function (see below).
 *
 * "Active" here means an eligible row exists and its status maps to `full`
 * or `degraded` via `appleSubscriptionAccessLevel` — an `expired`/`revoked`
 * row should not hold the payer to a stale product's ceiling. This is the
 * existing full/degraded determination carried over unchanged; it is not a
 * degraded-payer POLICY decision made by this issue (record §4.4's
 * degraded-payer treatment remains unresolved — see the file-level doc
 * comment on `getActiveAppleProductId` below).
 *
 * Error-visible: a DB read error on EITHER the allowlist read or the
 * subscriptions read returns `{ productId: null, readError: true }` — never
 * a silent "no subscription." `getActiveAppleProductId` below collapses this
 * to fail-open `null`; a status-display caller reading this function (or its
 * `getDisplayedAppleProductIdResult` alias) directly gets the honest
 * error-visible contract.
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
  const { isAllowlisted, readError: allowlistReadError } =
    await readSandboxAllowlistMembership(service, payerId);

  if (allowlistReadError) {
    // Error-visible: don't guess "not allowlisted" — that could hide a real,
    // allowlisted sandbox tester's active status from a decision that should
    // see it (see module doc, FV-596).
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
      `[subscriptions/apple] getActiveAppleProductIdResult read failed (payer=${payerId}):`,
      subsError.message,
    );
    // Error-visible: never swallow to a false "no active row" — the caller
    // decides how to fail (fail-open for the capacity gate via
    // `getActiveAppleProductId` below; fail-safe/error-visible for a status
    // display via this function directly).
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

  // FV-710: no row grants access. A row in billing retry is still a LIVE
  // Apple subscription: Apple keeps retrying the charge for up to 60 days and
  // only the payer can cancel it. It therefore still counts as "this payer
  // subscribes through Apple" for everything this accessor feeds (the
  // delete-account warning, the manage screen, the seat ceiling, and the
  // duplicate-purchase guard), even though training access is blocked.
  for (const row of ordered) {
    if (row.status === "in_billing_retry") {
      return { productId: row.product_id, readError: false, paymentLapsed: true };
    }
  }

  return { productId: null, readError: false };
}

/**
 * Returns the `product_id` of the payer's active Apple subscription row
 * (Production, or Sandbox for allowlisted payers — record §4.9), or null if
 * they don't have one (including on a DB read error — FAIL-OPEN). Used by
 * `./apple-capacity`'s `assertAthleteCapacity` / `isStrictAppleCapacityUpgrade`,
 * `./seat-state`'s `getPayerSeatState`, `./subscribe-guard`'s
 * `getSubscribeEntitlementState`, and `./trial-conversion`'s
 * `getTrialConversionState` to determine whether a payer is on the Apple
 * provider at all (and, for capacity/upgrade purposes, which product).
 *
 * FAIL-OPEN CONTRACT (unchanged by FV-580/FV-596): this is correct for the
 * capacity gate specifically — a transient read error must not spuriously
 * CAP an otherwise-uncapped payer's athlete count, so it degrades to "not an
 * Apple payer" rather than blocking. This is NOT the right contract for a
 * status-DISPLAY caller (a transient error there must not silently read as
 * "no subscription" — see `getActiveAppleProductIdResult` above, which this
 * function delegates to; a display surface should read that function, or
 * its `getDisplayedAppleProductIdResult` alias, directly instead of through
 * this fail-open wrapper).
 *
 * Delegates to `getActiveAppleProductIdResult` for the query + the
 * full/degraded + environment-eligibility determination; this wrapper only
 * collapses `readError` to `null` to preserve the exact behavior every
 * existing caller depends on.
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
// getDisplayedAppleProductIdResult — status-display alias (FV-595/FV-596)
// ---------------------------------------------------------------------------

/**
 * *** STATUS-DISPLAY SURFACES (e.g. Settings pages). ***
 *
 * FV-596: originally a separate sandbox-allowlist-aware implementation
 * (FV-595), added because the decision accessors above were Production-only
 * and disagreed with the entitlement gate's environment rule. That gap is
 * now closed — `getActiveAppleProductIdResult` applies the identical rule
 * (Production, or Sandbox for allowlisted payers, Production preferred when
 * both exist, error-visible on any read failure) — so this name is now a
 * thin alias of `getActiveAppleProductIdResult`, kept only so the two
 * Settings pages (`app/dashboard/settings/page.tsx`,
 * `app/athlete/settings/page.tsx`) and their existing tests keep compiling
 * under the display-specific name. New callers should prefer
 * `getActiveAppleProductIdResult` directly.
 *
 * @param service  Service-role Supabase client (bypasses RLS by design).
 * @param payerId  UUID of the payer's profile row.
 * @param now      Current time (injected for testability).
 */
export const getDisplayedAppleProductIdResult = getActiveAppleProductIdResult;

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
