/**
 * Subscribe-button duplicate-billing guard (FV-581).
 *
 * docs/fv210-ios-iap-decision-record.md Section 4.4 ("Duplicate-billing
 * guard"): "iOS purchase UI is HIDDEN behind a server-computed flag: a payer
 * already `full` via Stripe or comp sees management/status copy, never a buy
 * button. (Server decides; client renders.)" KC decision D1 (2026-09-17,
 * FV-584) extends this to `degraded` payers too — see the SCOPE note below.
 * This module is the single
 * shared SERVER decision both purchase-INITIATION entry points consult
 * before starting a brand-new purchase flow:
 *   - `beginApplePurchase` (lib/actions/apple-subscription.ts) — refuses to
 *     mint a fresh StoreKit purchase token.
 *   - `startSubscriptionCheckout` (lib/actions/subscription.ts) — refuses to
 *     create a new Stripe Checkout session.
 *
 * This module does NOT touch `submitApplePurchase`'s verification/persist
 * path (record Section 4.4's "always-persist" principle is unrelated —
 * it governs what happens to an already-verified Apple transaction, not
 * whether a NEW purchase attempt should be allowed to start).
 *
 * WHY NOT JUST CALL `getParentAccessLevel` DIRECTLY:
 *   `getParentAccessLevel` (./access) and its constituent reads
 *   (`hasActiveCompGrant`, the Stripe `subscriptions` read,
 *   `getAppleAccessLevelForPayer`) are all deliberately FAIL-CLOSED for
 *   access-GATING call sites: a DB read error degrades to "blocked" rather
 *   than risk granting training-content access on a read failure. That is
 *   the right default for gating content, but it is the WRONG default for a
 *   BUY button — if a read error were silently treated as "not entitled," a
 *   real Stripe/Apple/comp subscriber whose read happened to fail would be
 *   shown a fresh buy button and could be charged twice. So this module
 *   performs its own parallel, error-TRACKING read of the same underlying
 *   sources purely to detect a failure, and only defers to
 *   `getParentAccessLevel` — the single source of truth for the fold/
 *   decision logic, reused rather than re-derived, avoiding drift — once
 *   every read is known to have succeeded. See `readUnderlyingSources`.
 *
 * SCOPE — `full` OR `degraded` (KC decision D1, 2026-09-17, FV-584): a
 * `degraded` payer (past_due / paused / etc. — see access-level.ts) already
 * HAS a subscription that needs fixing/managing, not a fresh purchase. FV-584
 * extends the FV-581 guard from `full`-only to any access level that is NOT
 * `"blocked"` — i.e. `getParentAccessLevel(userId) !== "blocked"` — so a
 * degraded payer is `entitled` (blocked from starting a second purchase) and
 * routed to the SAME manage/status copy as a `full` payer. Only `"blocked"`
 * (canceled / incomplete_expired / no row at all) remains `not_entitled` and
 * free to (re)purchase.
 *
 * D3 EXCEPTION (FV-586, KC decision 2026-09-17): this module's `entitled`
 * verdict is unchanged by D3 — it still means "already full or degraded,
 * don't start a fresh purchase." The one carve-out (an Apple payer buying a
 * strictly higher-capacity product is an upgrade, not a duplicate purchase)
 * lives entirely in the CALLER (`beginApplePurchase`, via
 * `isStrictAppleCapacityUpgrade` in `./apple-capacity`), which consults this
 * module's `entitled`/`provider` verdict first and then decides whether to
 * override the refusal for that one Apple-upgrade case. This module itself
 * never needs to know about product ids or capacity ceilings.
 *
 * Allowed callers: `lib/actions/apple-subscription.ts`,
 * `lib/actions/subscription.ts`. The frontend `/subscribe` page +
 * `AppleSubscribeSection` display pass is a separate follow-up
 * (frontend-engineer) — this module only supplies the server decision.
 */
import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { getParentAccessLevel } from "./access";
import { subscriptionAccessLevel, type SubscriptionStatus } from "./access-level";
import { getActiveAppleProductId } from "./apple";

type ServiceClient = ReturnType<typeof createServiceClient>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubscribeEntitlementStatus = "entitled" | "not_entitled" | "unknown";

/** Only meaningful when `status === "entitled"` — names which provider is
 * carrying the entitlement, for the frontend's manage-subscription routing
 * (e.g. "manage on your iPhone" vs the Stripe billing portal vs no manage
 * action for a comp grant). Always `null` for `not_entitled` / `unknown`. */
export type SubscribeEntitlementProvider = "apple" | "stripe" | "comp" | null;

export interface SubscribeEntitlementState {
  status: SubscribeEntitlementStatus;
  provider: SubscribeEntitlementProvider;
}

// ---------------------------------------------------------------------------
// Error-tracking read (see module doc — never used to derive the decision)
// ---------------------------------------------------------------------------

/**
 * Reads the same underlying sources `getParentAccessLevel` folds together
 * (comp grants, the Stripe mirror, the Apple mirror + sandbox allowlist) to
 * (1) detect whether ANY of them errored — "is it safe to trust
 * `getParentAccessLevel`'s answer for this payer right now?" — and (2) carry
 * the Stripe row's `status` forward so the provider-determination step can
 * reuse it instead of re-reading `subscriptions` a second time. The other
 * three results are discarded (only their `.error` matters here); the Apple
 * provider decision goes through the centralized `getActiveAppleProductId`
 * accessor (§4.9), never a raw row read from this batch.
 */
async function readUnderlyingSources(
  service: ServiceClient,
  userId: string,
): Promise<{ anyError: boolean; stripeStatus: SubscriptionStatus | null }> {
  const [grants, stripeSub, appleSubs, allowlist] = await Promise.all([
    // Mirrors hasActiveCompGrant's query (./grants.ts).
    service
      .from("access_grants")
      .select("id")
      .eq("parent_id", userId)
      .is("revoked_at", null),
    // Mirrors getParentAccessLevel's Stripe read (./access.ts).
    service.from("subscriptions").select("status").eq("parent_id", userId).maybeSingle(),
    // Mirrors getAppleAccessLevelForPayer's row read (./apple.ts).
    service.from("apple_subscriptions").select("status").eq("payer_id", userId),
    // Mirrors getAppleAccessLevelForPayer's allowlist read (./apple.ts).
    service
      .from("apple_sandbox_testers")
      .select("payer_id")
      .eq("payer_id", userId)
      .maybeSingle(),
  ]);

  const anyError = Boolean(
    grants.error || stripeSub.error || appleSubs.error || allowlist.error,
  );
  // Only meaningful when anyError is false (caller returns "unknown" first
  // otherwise, so a null-on-error status is never consulted).
  const stripeStatus = (stripeSub.data?.status as SubscriptionStatus | undefined) ?? null;
  return { anyError, stripeStatus };
}

// ---------------------------------------------------------------------------
// getSubscribeEntitlementState
// ---------------------------------------------------------------------------

/**
 * Returns the current payer's subscribe-button entitlement state.
 *
 *   - `"entitled"`     — already `full` OR `degraded` via some provider (KC
 *                         decision D1, FV-584: a degraded payer has an
 *                         existing subscription to fix/manage, not a reason
 *                         to buy a second one). Callers MUST refuse to start
 *                         a new purchase/checkout flow. `provider` names
 *                         which one.
 *   - `"not_entitled"` — free to purchase; every underlying read succeeded
 *                         and the fold is `blocked` (canceled /
 *                         incomplete_expired / no subscription row at all).
 *   - `"unknown"`      — at least one underlying read failed. Callers MUST
 *                         treat this as "refuse to start a new purchase"
 *                         (fail safe) — NEVER as `"not_entitled"`.
 *
 * @param userId UUID of the payer's profile row (parent or adult_athlete —
 *               never an athlete; callers are expected to have already
 *               role-gated to a payer role before calling this).
 */
export async function getSubscribeEntitlementState(
  userId: string,
): Promise<SubscribeEntitlementState> {
  const service = createServiceClient();

  const { anyError, stripeStatus } = await readUnderlyingSources(service, userId);
  if (anyError) {
    return { status: "unknown", provider: null };
  }

  // Every underlying read just succeeded — safe to trust the fold. Reused
  // rather than re-derived, so the entitlement decision has exactly one
  // source of truth (record Section 4.1's resolver-fold logic).
  //
  // FV-584 (KC decision D1): entitled on ANY non-blocked level, not just
  // `full` — a `degraded` payer (past_due/paused/etc.) already has a
  // subscription that needs fixing, not a fresh purchase.
  const level = await getParentAccessLevel(userId);
  if (level === "blocked") {
    return { status: "not_entitled", provider: null };
  }

  // Entitled (full or degraded) — determine which provider is carrying it.
  // Apple goes through the centralized accessor (§4.9), which already
  // resolves to a product id for a full OR degraded Apple row (see
  // getActiveAppleProductId's doc comment); Stripe reuses the error-checked
  // status already fetched above (no second read, no unchecked-error
  // fall-through), broadened the same way so a degraded Stripe payer
  // resolves provider "stripe" rather than falling through to "comp".
  const appleProductId = await getActiveAppleProductId(service, userId);
  if (appleProductId !== null) {
    return { status: "entitled", provider: "apple" };
  }

  if (stripeStatus && subscriptionAccessLevel(stripeStatus) !== "blocked") {
    return { status: "entitled", provider: "stripe" };
  }

  // full or degraded, but neither Apple nor Stripe is the source -> a comp
  // grant (comp grants are always "full" — see hasActiveCompGrant/access.ts;
  // there is no "degraded" comp state).
  return { status: "entitled", provider: "comp" };
}
