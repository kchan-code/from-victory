/**
 * google-play-sync.ts — shared server-only rules for writing a verified Google
 * Play purchase into `google_subscriptions` (FV-661 action, FV-662 webhook).
 *
 * Both entry points (the `submitGooglePurchase` server action and the Pub/Sub
 * webhook) must apply the SAME rules: row-write shape, ownership, catalog,
 * license-tester allowlist, linked-token refresh, and write-then-acknowledge.
 * They live here once so the two paths cannot drift. Behaviour is unchanged
 * from the code that was extracted out of the action.
 *
 * LOGGING (NON-NEGOTIABLE, record 7.1): purchase tokens, obfuscated account ids
 * and payer ids are never logged or alerted. Logs here are static labels and
 * Postgres error codes only; alerts carry at most an internal row id. A
 * database error's `message`/`details` can quote the token, so only `code` is
 * ever read from one.
 */
import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { googleSubscriptionAccessLevel } from "@/lib/subscriptions/google-access-level";
import { googleCatalogEntry } from "@/lib/subscriptions/google-product-catalog";
import {
  acknowledgeWithRetry,
  getSubscriptionPurchaseV2,
  type ParsedGooglePurchase,
} from "@/lib/subscriptions/google-play-api";

export type GoogleServiceClient = ReturnType<typeof createServiceClient>;

/** Log/alert prefix of the original action; the webhook passes its own. */
export const ACTION_LOG_PREFIX = "[google-play-subscription]";

export class GoogleDbError extends Error {
  constructor(label: string, code: string | undefined) {
    super(`${label}:${code ?? "unknown"}`);
    this.name = "GoogleDbError";
  }
}

export function dbFail(label: string, error: { code?: string }): never {
  // Only the Postgres code: `message`/`details` can quote the purchase token.
  throw new GoogleDbError(label, error.code);
}

export function alertOps(label: string, message: string, context?: Record<string, string>): void {
  deliverInBackground(notifyError(label, message, context));
}

export async function readBindingId(
  service: GoogleServiceClient,
  payerId: string,
): Promise<string | null> {
  const { data, error } = await service
    .from("google_purchase_bindings")
    .select("binding_id")
    .eq("payer_id", payerId)
    .maybeSingle();
  if (error) dbFail("binding_read", error);
  return data ? data.binding_id : null;
}

export function mirrorFields(purchase: ParsedGooglePurchase, verifiedAtIso: string) {
  return {
    product_id: purchase.productId,
    base_plan_id: purchase.basePlanId,
    status: purchase.status,
    expires_at: purchase.expiresAt,
    auto_renewing: purchase.autoRenewing,
    is_test_purchase: purchase.isTestPurchase,
    obfuscated_account_id: purchase.obfuscatedAccountId,
    linked_purchase_token: purchase.linkedPurchaseToken,
    acknowledged: purchase.acknowledged,
    offer_id: purchase.offerId,
    // Always set (never inherited from an earlier pass).
    last_verified_at: verifiedAtIso,
  };
}

export type WriteMirrorRowResult =
  | { kind: "ok"; rowId: string }
  | { kind: "conflict" }
  /** The payer's row is held as `expired` and stays closed; nothing but `last_verified_at` was written. */
  | { kind: "closed"; rowId: string };

/**
 * Writes the mirror row for (payer, token). Never overwrites `payer_id` of an
 * existing row: a row owned by another payer yields "conflict".
 *
 * A row this payer already holds as `expired` is never re-opened. `expired` is
 * terminal at Google, and it is also the state a refund or chargeback forces
 * (FV-662), so re-submitting the same token while Google still reports a
 * granting state must not restore access. That yields "closed".
 */
export async function writeMirrorRow(
  service: GoogleServiceClient,
  payerId: string,
  purchaseToken: string,
  purchase: ParsedGooglePurchase,
  verifiedAtIso: string,
): Promise<WriteMirrorRowResult> {
  const fields = mirrorFields(purchase, verifiedAtIso);

  const update = async (): Promise<{ kind: "ok"; rowId: string } | { kind: "conflict" }> => {
    const { data, error } = await service
      .from("google_subscriptions")
      .update(fields)
      .eq("purchase_token", purchaseToken)
      .eq("payer_id", payerId)
      .select("id")
      .maybeSingle();
    if (error) dbFail("subscription_update", error);
    // No row matched (payer, token): someone else owns the token.
    return data ? { kind: "ok", rowId: data.id } : { kind: "conflict" };
  };

  const { data: existing, error: readError } = await service
    .from("google_subscriptions")
    .select("id, payer_id, status")
    .eq("purchase_token", purchaseToken)
    .maybeSingle();
  if (readError) dbFail("subscription_read", readError);
  if (existing) {
    if (existing.payer_id !== payerId) return { kind: "conflict" };
    const wouldGrant =
      googleSubscriptionAccessLevel(purchase.status, purchase.expiresAt, new Date(verifiedAtIso)) !== "blocked";
    if (existing.status === "expired" && wouldGrant) {
      const { error: touchError } = await service
        .from("google_subscriptions")
        .update({ last_verified_at: verifiedAtIso })
        .eq("id", existing.id);
      if (touchError) dbFail("subscription_touch", touchError);
      return { kind: "closed", rowId: existing.id };
    }
    return update();
  }

  const { data: inserted, error: insertError } = await service
    .from("google_subscriptions")
    .insert({ payer_id: payerId, purchase_token: purchaseToken, ...fields })
    .select("id")
    .single();
  if (insertError) {
    // 23505: a concurrent insert for the same token won the race.
    if (insertError.code === "23505") return update();
    dbFail("subscription_insert", insertError);
  }
  if (!inserted) throw new GoogleDbError("subscription_insert_empty", undefined);
  return { kind: "ok", rowId: inserted.id };
}

/**
 * Catalog + license-tester admission for a verified purchase about to be
 * written for `payerId` (record 7.4). Returns the refusal, or null when the
 * purchase may be written. Alerts carry no identifiers.
 */
export async function checkPurchaseAdmission(
  service: GoogleServiceClient,
  payerId: string,
  purchase: ParsedGooglePurchase,
  logPrefix: string = ACTION_LOG_PREFIX,
): Promise<"unknown_product" | "test_purchase_rejected" | null> {
  // The catalog must know what was bought (fail closed; ids are Google's).
  if (!googleCatalogEntry(purchase.productId, purchase.basePlanId)) {
    console.warn(`${logPrefix} rejected: product not in catalog.`);
    alertOps(
      `${logPrefix} unknown product refused`,
      "A verified purchase named a product or base plan outside the catalog; nothing granted",
    );
    return "unknown_product";
  }

  // Test purchases grant only for allowlisted payers.
  if (purchase.isTestPurchase) {
    const { data: tester, error: testerError } = await service
      .from("google_license_testers")
      .select("payer_id")
      .eq("payer_id", payerId)
      .maybeSingle();
    if (testerError) dbFail("tester_read", testerError);
    if (!tester) {
      console.warn(`${logPrefix} rejected: test purchase from non-allowlisted payer.`);
      alertOps(
        `${logPrefix} test purchase rejected`,
        "A license-tester purchase came from a payer not on the allowlist; nothing granted",
      );
      return "test_purchase_rejected";
    }
  }
  return null;
}

/**
 * Linked (older) token handling (record 7.3). Re-reads the old token from
 * Google and refreshes its row (scoped to the same payer), so the old row stops
 * granting exactly when Google says the old purchase ended. Non-fatal: a
 * failure here never fails the new purchase; access stays bounded by the old
 * row's own `expires_at`.
 */
export async function refreshLinkedRow(
  service: GoogleServiceClient,
  payerId: string,
  linkedToken: string,
  linkedRowId: string,
  verifiedAtIso: string,
  logPrefix: string = ACTION_LOG_PREFIX,
): Promise<void> {
  const got = await getSubscriptionPurchaseV2(linkedToken);
  if (!got.ok) {
    console.warn(`${logPrefix} linked purchase refresh failed (Google).`);
    alertOps(
      `${logPrefix} linked purchase refresh failed`,
      "Could not re-read the previous purchase from Google",
      { row_id: linkedRowId },
    );
    return;
  }
  const { error } = await service
    .from("google_subscriptions")
    .update({
      status: got.purchase.status,
      expires_at: got.purchase.expiresAt,
      auto_renewing: got.purchase.autoRenewing,
      acknowledged: got.purchase.acknowledged,
      last_verified_at: verifiedAtIso,
    })
    .eq("purchase_token", linkedToken)
    .eq("payer_id", payerId);
  if (error) {
    console.warn(`${logPrefix} linked purchase refresh write failed (${error.code ?? "unknown"}).`);
    alertOps(
      `${logPrefix} linked purchase refresh failed`,
      "Could not write the refreshed previous purchase",
      { row_id: linkedRowId },
    );
  }
}

/**
 * Acknowledge AFTER the row is written (record 7.3), bounded retry, then record
 * the acknowledgement. Returns false when Google never accepted it (the row
 * stays unacknowledged for a later pass; an alert carries the row id only).
 */
export async function acknowledgeAndRecord(
  service: GoogleServiceClient,
  rowId: string,
  productId: string,
  purchaseToken: string,
  logPrefix: string = ACTION_LOG_PREFIX,
): Promise<boolean> {
  const acked = await acknowledgeWithRetry(productId, purchaseToken);
  if (!acked) {
    console.error(`${logPrefix} acknowledge failed after retries; row left unacknowledged.`);
    alertOps(
      `${logPrefix} acknowledge failed`,
      "Acknowledge failed after retries; row left unacknowledged for a later pass",
      { row_id: rowId },
    );
    return false;
  }

  const { error } = await service.from("google_subscriptions").update({ acknowledged: true }).eq("id", rowId);
  if (error) {
    // The purchase IS acknowledged at Google; only our flag is stale. A later
    // verification pass corrects it from Google's own state.
    console.warn(`${logPrefix} could not record acknowledgement (${error.code ?? "unknown"}).`);
  }
  return true;
}
