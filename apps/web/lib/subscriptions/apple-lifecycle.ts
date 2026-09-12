/**
 * Apple notification-type -> lifecycle-status mapping (pure, no I/O — unit
 * testable without mocking `server-only` or Supabase), plus the shared
 * snapshot-upsert function used by ALL THREE Apple write paths:
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
 *   DID_FAIL_TO_RENEW + subtype GRACE_PERIOD -> in_grace_period
 *   DID_FAIL_TO_RENEW (any other/no subtype) -> in_billing_retry
 *   GRACE_PERIOD_EXPIRED -> in_billing_retry (grace bound cleared by the
 *     caller — see buildSnapshotFromNotification)
 *   EXPIRED -> expired
 *   REVOKE | REFUND -> revoked
 *
 * Returns `null` for every other notificationType — these are either
 * genuinely unknown or recognized-but-intentionally-not-acted-on (e.g.
 * DID_CHANGE_RENEWAL_PREF, PRICE_INCREASE, CONSUMPTION_REQUEST, TEST, …).
 * The caller (the webhook) treats `null` as the "200 + warn, no write"
 * branch — never a processing failure.
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
 * lastTransactions. This slice takes the first-returned item as the
 * authoritative current state — sufficient for a single-group, single-tier
 * product line (the only shape FV-570/571 ship). A future multi-group /
 * multi-household reconciliation redesign is FV-573's runbook item, not a
 * gap introduced here.
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
  if (items.length === 0) {
    return { ok: false, reason: "no_data" };
  }

  const item = items[0];
  if (!item) {
    return { ok: false, reason: "no_data" };
  }
  const status = mapAppleStatusEnum(item.status);
  const fields = buildSnapshotFields(status, item.transaction, item.renewal);

  const result = await applyAppleSnapshot(service, { payerId, ...fields });
  return { ok: true, applied: result.applied };
}
