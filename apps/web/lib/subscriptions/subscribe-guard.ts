/**
 * Subscribe-button duplicate-billing guard (FV-581).
 *
 * docs/fv210-ios-iap-decision-record.md Section 4.4 ("Duplicate-billing
 * guard"): "iOS purchase UI is HIDDEN behind a server-computed flag: a payer
 * already `full` via Stripe or comp sees management/status copy, never a buy
 * button. (Server decides; client renders.)" This module is the single
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
 *   every read is known to have succeeded. See `anyUnderlyingReadErrored`.
 *
 * SCOPE — `full` ONLY: record Section 4.4 says, verbatim, "a payer already
 * `full`." Whether a `degraded` payer (past_due / in_billing_retry / etc.)
 * should also be refused a fresh purchase is NOT decided by this record —
 * inventing that policy here would go beyond what KC recorded. A `degraded`
 * payer therefore reads as `not_entitled` and is allowed to (re)purchase,
 * same as today.
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
 *   - `"entitled"`     — already `full` via some provider. Callers MUST
 *                         refuse to start a new purchase/checkout flow.
 *                         `provider` names which one.
 *   - `"not_entitled"` — free to purchase; every underlying read succeeded
 *                         and the fold is below `full`.
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
  const level = await getParentAccessLevel(userId);
  if (level !== "full") {
    return { status: "not_entitled", provider: null };
  }

  // Entitled — determine which provider is carrying it. Apple goes through
  // the centralized accessor (§4.9); Stripe reuses the error-checked status
  // already fetched above (no second read, no unchecked-error fall-through).
  const appleProductId = await getActiveAppleProductId(service, userId);
  if (appleProductId !== null) {
    return { status: "entitled", provider: "apple" };
  }

  if (stripeStatus && subscriptionAccessLevel(stripeStatus) === "full") {
    return { status: "entitled", provider: "stripe" };
  }

  // full, but neither Apple nor Stripe is the source -> a comp grant.
  return { status: "entitled", provider: "comp" };
}
