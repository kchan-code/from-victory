/**
 * Apple notification-type -> lifecycle-status mapping (pure, no I/O — unit
 * testable without mocking `server-only` or Supabase), the action-path
 * status derivation (`deriveActionSubmissionStatus`, for when there is no
 * `notificationType` to map), plus the shared snapshot-upsert function used
 * by ALL THREE Apple write paths:
 *   1. the purchase-submission action (lib/actions/apple-subscription.ts)
 *   2. the Notifications V2 webhook (app/api/webhooks/apple/route.ts)
 *   3. the reconciliation helper (`reconcileAppleSubscription`, below)
 *
 * This file does NOT import `@apple/app-store-server-library` — the FV-571
 * scope fence reserves that import for ./apple-server.ts alone. Everything
 * here operates on the plain, DB-shaped types ./apple-server.ts exports.
 *
 * docs/fv210-ios-iap-decision-record.md Section 4.2 governs the watermark
 * discipline; Section 4.1 governs the supersession-safe upsert keying.
 *
 * APPLE-DOC VERIFIED ANSWERS (record Section 4.2 items a-g; checked against
 * Apple's primary documentation 2026-09-12 — evidence archived with the
 * FV-210 overnight report). These are the platform facts this module's
 * behavior rests on; do not re-derive them from behavior:
 *   a. Grace period = KEEP access: "Continue to provide access to the
 *      subscription during the grace period." (in_grace_period maps to
 *      full access while its own bound holds — apple-access-level.ts.)
 *   b. transactionInfo.expiresDate is STATIC — it does NOT extend during
 *      grace; a renewal creates a NEW transaction with a new expiresDate.
 *      Hence grace_period_expires_at is a SEPARATE column sourced ONLY from
 *      renewalInfo.gracePeriodExpiresDate (the renewal payload). The
 *      access-level mapper fails closed (degraded) if the bound is ever
 *      absent while status is in_grace_period.
 *   c. Same-group UPGRADE "goes into effect immediately, starting a new
 *      billing period, and the customer receives a prorated refund" — and
 *      may mint a NEW originalTransactionId, which is why applyAppleSnapshot
 *      keys on (payer_id, environment) and updates the OTID in place.
 *   d. Notifications V2 retries: production retries failed deliveries five
 *      times at 1, 12, 24, 48, and 72 hours; "in the sandbox environment,
 *      the App Store server attempts to send the notification one time."
 *      The webhook's 500-only-for-retryable discipline exists for this.
 *   e. GRACE_PERIOD_EXPIRED means "turn off access"; billing retry can
 *      continue up to 60 days (mapper: in_billing_retry, grace bound
 *      cleared; time-aware access then blocks).
 *   f. originalTransactionId is the durable subscription identity across
 *      renewals — subject to the upgrade caveat in (c).
 *   g. Missed-notification recovery = Get Notification History / Get All
 *      Subscription Statuses (reconcileAppleSubscription below).
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

import type { AppleSubscriptionStatus } from "./apple-access-level";
import {
  getAllSubscriptionStatuses,
  type AppleEnvironment,
  type DecodedTransactionInfo,
  type DecodedRenewalInfo,
} from "./apple-server";

type ServiceClient = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Notification-type -> status mapping (pure)
// ---------------------------------------------------------------------------

/**
 * Maps an App Store Server Notification V2 (notificationType, subtype) pair
 * to our Apple-native status vocabulary, per the FV-571 acceptance table:
 *
 *   SUBSCRIBED | DID_RENEW | DID_CHANGE_RENEWAL_STATUS | OFFER_REDEEMED
 *     -> subscribed (this also covers a same-group UPGRADE, which Apple
 *        delivers as SUBSCRIBED with subtype UPGRADE — the supersession-safe
 *        OTID update happens in applyAppleSnapshot, not here)
 *   DID_CHANGE_RENEWAL_PREF + subtype UPGRADE -> subscribed (FV-602: a
 *     same-group UPGRADE takes effect IMMEDIATELY — Apple's
 *     signedTransactionInfo on this payload is the new, already-effective
 *     transaction, so it is applied through this exact same full-snapshot
 *     path, not treated as a scheduled change)
 *   DID_CHANGE_RENEWAL_PREF + subtype DOWNGRADE, or empty subtype (a
 *     scheduled downgrade being cancelled) -> null. Unlike every other null
 *     case below, the webhook does NOT simply ignore these — a DOWNGRADE is
 *     SCHEDULED, not effective, so it is routed to the narrow
 *     `applyPendingRenewalProduct` path (auto_renew_product_id only) instead
 *     of this function's full-snapshot caller. See the webhook route's
 *     `processRenewalPreferenceChange`.
 *   DID_FAIL_TO_RENEW + subtype GRACE_PERIOD -> in_grace_period
 *   DID_FAIL_TO_RENEW (any other/no subtype) -> in_billing_retry
 *   GRACE_PERIOD_EXPIRED -> in_billing_retry (grace bound cleared by the
 *     caller — see buildSnapshotFromNotification)
 *   EXPIRED -> expired
 *   REVOKE | REFUND -> revoked
 *
 * Returns `null` for every other notificationType — these are either
 * genuinely unknown or recognized-but-intentionally-not-acted-on (e.g.
 * PRICE_INCREASE, CONSUMPTION_REQUEST, TEST, …). The caller (the webhook)
 * treats `null` as the "200 + warn, no write" branch for those — never a
 * processing failure. (DID_CHANGE_RENEWAL_PREF non-UPGRADE is the one
 * exception, handled specially — see above.)
 */
export function mapAppleNotificationToStatus(
  notificationType: string,
  subtype: string | null | undefined,
): AppleSubscriptionStatus | null {
  switch (notificationType) {
    case "SUBSCRIBED":
    case "DID_RENEW":
    case "DID_CHANGE_RENEWAL_STATUS":
    case "OFFER_REDEEMED":
      return "subscribed";

    case "DID_CHANGE_RENEWAL_PREF":
      // Only an UPGRADE is an immediately-effective entitlement change.
      // DOWNGRADE (and cancellation, empty subtype) is SCHEDULED-only and is
      // handled by the webhook's separate applyPendingRenewalProduct path —
      // see the doc comment above.
      return subtype === "UPGRADE" ? "subscribed" : null;

    case "DID_FAIL_TO_RENEW":
      return subtype === "GRACE_PERIOD" ? "in_grace_period" : "in_billing_retry";

    case "GRACE_PERIOD_EXPIRED":
      return "in_billing_retry";

    case "EXPIRED":
      return "expired";

    case "REVOKE":
    case "REFUND":
      return "revoked";

    default:
      return null;
  }
}

/**
 * Maps Apple's raw numeric Status enum (from the Get All Subscription
 * Statuses API — 1=ACTIVE, 2=EXPIRED, 3=BILLING_RETRY, 4=BILLING_GRACE_PERIOD,
 * 5=REVOKED) to our vocabulary. Used only by the reconciliation path, which
 * reads a DIFFERENT status representation than notifications/transactions.
 */
export function mapAppleStatusEnum(status: number): AppleSubscriptionStatus {
  switch (status) {
    case 1:
      return "subscribed";
    case 2:
      return "expired";
    case 3:
      return "in_billing_retry";
    case 4:
      return "in_grace_period";
    case 5:
      return "revoked";
    default:
      console.warn(
        `[subscriptions/apple-lifecycle] Unknown Apple status enum ${status} — treating as expired (fail-closed).`,
      );
      return "expired";
  }
}

// ---------------------------------------------------------------------------
// Action-path status derivation — for the purchase-submission action ONLY.
// The webhook always has an authoritative `notificationType` and must keep
// using `mapAppleNotificationToStatus` for that; this function exists
// because a client purchase/restore submission carries no notificationType
// at all, so "always subscribed" (the FV-571 assumption this closes) is
// wrong for a restore of a lapsed or revoked subscription.
// ---------------------------------------------------------------------------

/**
 * Derives the lifecycle status for a CLIENT SUBMISSION (the purchase/restore
 * action) from the verified transaction (+ optional renewal) alone — there is
 * no `notificationType` on this path to hang a mapping on.
 *
 *   1. Revoked (record Section 4.2: a definitively closed state, never
 *      re-opened) — either `revocationDate` or `revocationReason` present on
 *      the verified transaction. Checked with `!= null` because
 *      `revocationReason` legitimately carries `0`
 *      (`REFUNDED_FOR_OTHER_REASON`), a valid-but-falsy value.
 *   2. In grace — evidence-based, NOT notification-based: `apple-server.ts`
 *      documents that `renewalInfo.gracePeriodExpiresDate` is populated ONLY
 *      while Apple currently has the account in grace, so its presence is
 *      itself the grace signal a client submission can safely use. Gated on
 *      its OWN bound (`now <= gracePeriodExpiresDate`), never on
 *      `expiresDate` — record Section 4.2's status-conditional time rule:
 *      `expiresDate` has, by definition, already passed once grace begins,
 *      so a restore submitted mid-grace must not be misread as "expired."
 *      This is the one grace/billing-retry state this derivation can safely
 *      infer. It deliberately NEVER returns `in_billing_retry`: a plain
 *      lapse (grace never entered, or already exhausted) and an active
 *      billing-retry are indistinguishable from a client submission alone —
 *      that distinction is only ever knowable from a Notifications V2
 *      `DID_FAIL_TO_RENEW` / `GRACE_PERIOD_EXPIRED` payload.
 *   3. Expired — `expiresDate` strictly before `now` and neither of the
 *      above applied. A restore of a lapsed subscription must mirror
 *      truthfully rather than claim `subscribed` (the always-persist
 *      principle, record Section 4.4, is about NEVER dropping a write, not
 *      about what status the write records).
 *   4. Otherwise — `subscribed`.
 */
export function deriveActionSubmissionStatus(
  transaction: DecodedTransactionInfo,
  renewal: DecodedRenewalInfo | null,
  now: number = Date.now(),
): AppleSubscriptionStatus {
  if (transaction.revocationDate != null || transaction.revocationReason != null) {
    return "revoked";
  }

  if (renewal?.gracePeriodExpiresDate != null && now <= renewal.gracePeriodExpiresDate) {
    return "in_grace_period";
  }

  if (transaction.expiresDate < now) {
    return "expired";
  }

  return "subscribed";
}

// ---------------------------------------------------------------------------
// Snapshot builder — combines a mapped status with the verified
// transaction/renewal payloads into the exact row shape applyAppleSnapshot
// persists. Shared by the action, the webhook, and the reconciler.
// ---------------------------------------------------------------------------

export interface AppleSnapshotFields {
  environment: AppleEnvironment;
  status: AppleSubscriptionStatus;
  originalTransactionId: string;
  productId: string;
  /** UNIX ms. */
  expiresAt: number;
  /** UNIX ms, or null. Only ever non-null while status === "in_grace_period". */
  gracePeriodExpiresAt: number | null;
  autoRenewStatus: boolean;
  /** The token OBSERVED on this payload. Null only when the payload itself
   *  omitted it (defensive — see applyAppleSnapshot's update-only-if-present
   *  handling). Never the literal profiles.id. */
  appAccountToken: string | null;
  /** UNIX ms — the payload-staleness watermark (record Section 4.2). */
  signedDate: number;
  /** FV-602: the product this subscription is scheduled to renew INTO at
   *  its next renewal, or null when there is none (renewing into the same
   *  product this snapshot already carries as `productId`). Derived from
   *  `renewal.autoRenewProductId`, collapsed to null whenever it's absent OR
   *  equal to `productId` — a full-snapshot apply is always the current
   *  authoritative state, so this always OVERWRITES any previously-persisted
   *  value (never preserved-if-absent, unlike appAccountToken above): an
   *  UPGRADE (whose signedTransactionInfo already reflects the new product)
   *  correctly clears a stale scheduled downgrade, and a DID_RENEW that just
   *  made a scheduled downgrade effective correctly clears it too, since by
   *  then `renewal.autoRenewProductId` (if still present at all) equals the
   *  just-renewed `productId`. */
  autoRenewProductId: string | null;
}

/**
 * Builds the snapshot fields for a mapped status + verified transaction (+
 * optional renewal). The grace-period bound is populated ONLY when the
 * mapped status is `in_grace_period` — any other status (including a demote
 * FROM grace, e.g. GRACE_PERIOD_EXPIRED -> in_billing_retry) clears it to
 * null, per record Section 4.2 ("by definition expires_at has already
 * passed once grace begins... gating grace on expires_at would wrongly
 * demote a legitimate grace-period user").
 */
export function buildSnapshotFields(
  status: AppleSubscriptionStatus,
  transaction: DecodedTransactionInfo,
  renewal: DecodedRenewalInfo | null,
): AppleSnapshotFields {
  return {
    environment: transaction.environment,
    status,
    originalTransactionId: transaction.originalTransactionId,
    productId: transaction.productId,
    expiresAt: transaction.expiresDate,
    gracePeriodExpiresAt:
      status === "in_grace_period" ? renewal?.gracePeriodExpiresDate ?? null : null,
    autoRenewStatus: renewal?.autoRenewStatus ?? true,
    appAccountToken: transaction.appAccountToken,
    signedDate: transaction.signedDate,
    autoRenewProductId:
      renewal?.autoRenewProductId && renewal.autoRenewProductId !== transaction.productId
        ? renewal.autoRenewProductId
        : null,
  };
}

// ---------------------------------------------------------------------------
// applyAppleSnapshot — the single shared upsert, watermark-guarded and
// supersession-safe. Used by the action, the webhook, and the reconciler.
// ---------------------------------------------------------------------------

export type ApplyAppleSnapshotResult =
  | { applied: true; created: boolean }
  | { applied: false; reason: "stale" };

/**
 * Upserts a payer's `apple_subscriptions` row for (payer_id, environment).
 *
 * Supersession-safe (record Section 4.1): locates the existing row by
 * (payer_id, environment) — NEVER by original_transaction_id — so an
 * in-group UPGRADE that mints a new OTID updates the row in place instead of
 * colliding with the UNIQUE (payer_id, environment) constraint.
 *
 * Watermark-guarded (record Section 4.2): if an existing row's
 * `last_signed_date` is >= the incoming `signedDate`, the payload is dropped
 * as stale (older delivery, duplicate redelivery, or an equal-signedDate
 * replay) — the row is left untouched and `{ applied: false, reason: "stale" }`
 * is returned. This is what makes out-of-order Notifications V2 delivery
 * safe: a delayed old renewal arriving after a newer revocation can never
 * regress the row.
 *
 * `appAccountToken` is written only when the incoming payload carries one —
 * if it's null (a payload anomaly on an UPDATE), the existing value is left
 * untouched rather than being overwritten with null. On INSERT (first-seen
 * row), a null token is a hard error: the caller must never create a new row
 * without an observed token (both the action and the webhook only reach the
 * insert path after resolving a live payer via a token match).
 *
 * Throws on any DB error — callers (the action, the webhook, the reconciler)
 * catch and map to their own error/500 handling. Never throws for a
 * business-logic outcome (stale, applied) — those are return values.
 */
export async function applyAppleSnapshot(
  service: ServiceClient,
  input: { payerId: string } & AppleSnapshotFields,
): Promise<ApplyAppleSnapshotResult> {
  const { data: existing, error: readError } = await service
    .from("apple_subscriptions")
    .select("id, last_signed_date")
    .eq("payer_id", input.payerId)
    .eq("environment", input.environment)
    .maybeSingle();

  if (readError) {
    throw new Error(
      `[subscriptions/apple-lifecycle] apple_subscriptions read failed (payer=${input.payerId}): ${readError.message}`,
    );
  }

  const incomingSignedIso = new Date(input.signedDate).toISOString();
  const expiresIso = new Date(input.expiresAt).toISOString();
  const graceIso =
    input.gracePeriodExpiresAt !== null
      ? new Date(input.gracePeriodExpiresAt).toISOString()
      : null;

  if (existing) {
    const storedMs = Date.parse(existing.last_signed_date);
    if (Number.isFinite(storedMs) && input.signedDate <= storedMs) {
      // Stale, duplicate, or equal-signedDate replay — drop it. No write.
      return { applied: false, reason: "stale" };
    }

    const updatePayload: Database["public"]["Tables"]["apple_subscriptions"]["Update"] = {
      original_transaction_id: input.originalTransactionId,
      product_id: input.productId,
      status: input.status,
      expires_at: expiresIso,
      grace_period_expires_at: graceIso,
      auto_renew_status: input.autoRenewStatus,
      // FV-602: always overwrite (never preserve-if-absent) — a full
      // snapshot apply is always the current authoritative state, so any
      // previously-scheduled renewal-product change is resolved by it
      // (superseded by an UPGRADE, or made effective by the DID_RENEW that
      // follows it). See AppleSnapshotFields.autoRenewProductId's doc
      // comment for why buildSnapshotFields already collapsed this to null
      // whenever there's nothing to schedule.
      auto_renew_product_id: input.autoRenewProductId,
      last_signed_date: incomingSignedIso,
    };
    // Only overwrite the token if this payload actually carried one.
    if (input.appAccountToken) {
      updatePayload.app_account_token = input.appAccountToken;
    }

    // Optimistic-concurrency backstop (qa review, PR #515): the SELECT above
    // and this UPDATE are two round-trips, so a concurrent writer (action vs
    // webhook, or two webhook deliveries) could apply a newer-or-equal
    // signedDate in between. The `.lt` re-checks the watermark ATOMICALLY
    // inside the UPDATE's own WHERE clause — the loser of the race matches
    // 0 rows instead of regressing the row, and is treated exactly like the
    // read-path stale drop.
    const { error: updateError, count: updatedCount } = await service
      .from("apple_subscriptions")
      .update(updatePayload, { count: "exact" })
      .eq("id", existing.id)
      .lt("last_signed_date", incomingSignedIso);

    if (updateError) {
      throw new Error(
        `[subscriptions/apple-lifecycle] apple_subscriptions update failed (payer=${input.payerId}): ${updateError.message}`,
      );
    }
    if (updatedCount === 0) {
      return { applied: false, reason: "stale" };
    }
    return { applied: true, created: false };
  }

  if (!input.appAccountToken) {
    throw new Error(
      `[subscriptions/apple-lifecycle] refusing to insert a new apple_subscriptions row without an app_account_token (payer=${input.payerId}).`,
    );
  }

  const { error: insertError } = await service.from("apple_subscriptions").insert({
    payer_id: input.payerId,
    environment: input.environment,
    original_transaction_id: input.originalTransactionId,
    product_id: input.productId,
    status: input.status,
    expires_at: expiresIso,
    grace_period_expires_at: graceIso,
    auto_renew_status: input.autoRenewStatus,
    auto_renew_product_id: input.autoRenewProductId,
    app_account_token: input.appAccountToken,
    last_signed_date: incomingSignedIso,
  });

  if (insertError) {
    throw new Error(
      `[subscriptions/apple-lifecycle] apple_subscriptions insert failed (payer=${input.payerId}): ${insertError.message}`,
    );
  }
  return { applied: true, created: true };
}

// ---------------------------------------------------------------------------
// applyPendingRenewalProduct — the narrow, SCHEDULED-only sibling of
// applyAppleSnapshot (FV-602). Used exclusively by the webhook's
// DID_CHANGE_RENEWAL_PREF handling for subtype DOWNGRADE (schedule) and
// empty subtype (cancellation) — see mapAppleNotificationToStatus's doc
// comment. NEVER touches product_id / status / expires_at / grace bound /
// auto_renew_status / app_account_token: a scheduled renewal-product change
// is explicitly NOT an entitlement change (record: capacity and access-level
// are derived only from status/expires_at, which this function leaves
// untouched).
// ---------------------------------------------------------------------------

export type ApplyPendingRenewalProductResult =
  | { applied: true }
  | { applied: false; reason: "stale" | "no_row" };

/**
 * Persists (or clears) `apple_subscriptions.auto_renew_product_id` for a
 * (payer, environment) row, WITHOUT touching any entitlement column.
 *
 * Mirrors applyAppleSnapshot's watermark discipline exactly (same stale/
 * duplicate/equal-signedDate drop, same atomic re-check via `.lt` on the
 * UPDATE's own WHERE clause to close the same read-then-write race) so the
 * two write paths — full-snapshot and renewal-preference-only — can never
 * let an out-of-order Apple delivery regress `last_signed_date` against each
 * other; they share one watermark column.
 *
 * Unlike applyAppleSnapshot, this function never creates a row: a renewal-
 * preference change for a (payer, environment) with no existing subscription
 * snapshot is not a state this product models (there is nothing to schedule
 * a change relative to) — returns `{ applied: false, reason: "no_row" }`
 * rather than inserting a partial row.
 *
 * Throws on any DB error, matching applyAppleSnapshot's contract — the
 * caller (the webhook) catches and maps to its own 500 handling.
 *
 * @param input.autoRenewProductId  The value to persist: a target product id
 *   (DOWNGRADE scheduled) or `null` (no scheduled change / cancellation) —
 *   the caller has already resolved which one applies.
 * @param input.signedDate          UNIX ms — the payload-staleness watermark
 *   for this write (the transaction's own signedDate, the same clock/column
 *   applyAppleSnapshot watermarks against).
 */
export async function applyPendingRenewalProduct(
  service: ServiceClient,
  input: {
    payerId: string;
    environment: AppleEnvironment;
    autoRenewProductId: string | null;
    signedDate: number;
  },
): Promise<ApplyPendingRenewalProductResult> {
  const { data: existing, error: readError } = await service
    .from("apple_subscriptions")
    .select("id, last_signed_date")
    .eq("payer_id", input.payerId)
    .eq("environment", input.environment)
    .maybeSingle();

  if (readError) {
    throw new Error(
      `[subscriptions/apple-lifecycle] apple_subscriptions read failed (renewal-pref, payer=${input.payerId}): ${readError.message}`,
    );
  }

  if (!existing) {
    return { applied: false, reason: "no_row" };
  }

  const incomingSignedIso = new Date(input.signedDate).toISOString();
  const storedMs = Date.parse(existing.last_signed_date);
  if (Number.isFinite(storedMs) && input.signedDate <= storedMs) {
    // Stale, duplicate, or equal-signedDate replay — drop it. No write.
    return { applied: false, reason: "stale" };
  }

  const updatePayload: Database["public"]["Tables"]["apple_subscriptions"]["Update"] = {
    auto_renew_product_id: input.autoRenewProductId,
    last_signed_date: incomingSignedIso,
  };

  // Same atomic-watermark backstop as applyAppleSnapshot (qa review, PR
  // #515): re-checks the watermark inside the UPDATE's own WHERE clause so a
  // concurrent writer between the SELECT and this UPDATE can't regress the
  // row — the loser matches 0 rows and is treated as stale.
  const { error: updateError, count: updatedCount } = await service
    .from("apple_subscriptions")
    .update(updatePayload, { count: "exact" })
    .eq("id", existing.id)
    .lt("last_signed_date", incomingSignedIso);

  if (updateError) {
    throw new Error(
      `[subscriptions/apple-lifecycle] apple_subscriptions update failed (renewal-pref, payer=${input.payerId}): ${updateError.message}`,
    );
  }
  if (updatedCount === 0) {
    return { applied: false, reason: "stale" };
  }
  return { applied: true };
}

// ---------------------------------------------------------------------------
// reconcileAppleSubscription — on-demand drift repair (Get All Subscription
// Statuses). Callable + tested with a mocked client in this slice; the
// recovery/runbook wiring (when to call it, alerting on drift) is FV-573.
// ---------------------------------------------------------------------------

export type ReconcileAppleSubscriptionResult =
  | { ok: true; applied: boolean }
  | { ok: false; reason: "no_row" | "no_data" };

/**
 * Re-fetches a payer's authoritative Apple subscription state via the App
 * Store Server API and runs it through the SAME upsert path as the action
 * and the webhook (`applyAppleSnapshot`) — so reconciliation can never
 * diverge from steady-state processing.
 *
 * SELECTION NOTE (FV-573 to refine): a payer's Get All Subscription Statuses
 * response can carry multiple subscription groups and multiple
 * lastTransactions. Apple's array ordering is not a documented contract, so
 * selection does not depend on it: candidates are filtered to those whose
 * VERIFIED transaction environment matches the requested `environment`
 * (defense-in-depth beyond the API credential's own environment scoping,
 * record Section 4.9), then the one with the NEWEST transaction `signedDate`
 * is applied (record Section 4.2 — `signedDate` is the payload-staleness
 * watermark; `applyAppleSnapshot`'s watermark guard makes this safe even if
 * selection were wrong, but selection should not rely on that backstop).
 * This remains sufficient for a single-group, single-tier product line (the
 * only shape FV-570/571 ship); a future multi-group / multi-household
 * reconciliation redesign (picking the right GROUP, not just the right
 * environment) is FV-573's runbook item, not a gap introduced here.
 */
export async function reconcileAppleSubscription(
  service: ServiceClient,
  payerId: string,
  environment: AppleEnvironment,
): Promise<ReconcileAppleSubscriptionResult> {
  const { data: existing, error } = await service
    .from("apple_subscriptions")
    .select("original_transaction_id")
    .eq("payer_id", payerId)
    .eq("environment", environment)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[subscriptions/apple-lifecycle] reconcile read failed (payer=${payerId}): ${error.message}`,
    );
  }
  if (!existing) {
    return { ok: false, reason: "no_row" };
  }

  const items = await getAllSubscriptionStatuses(
    existing.original_transaction_id,
    environment,
  );

  // Keep only candidates whose VERIFIED transaction environment matches the
  // environment we're reconciling for, then pick the one with the newest
  // transaction signedDate — never Apple's array ordering (see SELECTION
  // NOTE above).
  const matching = items.filter((candidate) => candidate.transaction.environment === environment);
  if (matching.length === 0) {
    return { ok: false, reason: "no_data" };
  }

  const item = matching.reduce((newest, candidate) =>
    candidate.transaction.signedDate > newest.transaction.signedDate ? candidate : newest,
  );

  const status = mapAppleStatusEnum(item.status);
  const fields = buildSnapshotFields(status, item.transaction, item.renewal);

  const result = await applyAppleSnapshot(service, { payerId, ...fields });
  return { ok: true, applied: result.applied };
}
