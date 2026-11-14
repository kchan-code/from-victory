/**
 * Server actions: Google Play purchase binding and submission (FV-661,
 * Play Billing C3). DORMANT: every action refuses, before touching Google or
 * the database, unless `GOOGLE_PLAY_CATALOG_ACTIVE` is exactly "1"
 * (record 6.1, the server-flag lock).
 *
 * Contract (docs/fv651-android-play-billing-decision-record.md 7.1 to 7.4):
 *   1. The payer is resolved from the session. The client supplies only the
 *      purchase token. Any client product id is ignored: Google's answer about
 *      the token is the truth.
 *   2. Role gate before any write: only `parent` or `adult_athlete`.
 *   3. Nothing is granted until Google's API (`subscriptionsv2.get`) confirms
 *      the purchase.
 *   4. Google's returned obfuscated account id must equal the signed-in
 *      payer's binding id. Missing or mismatched: grant nothing, write
 *      nothing, never acknowledge (record 7.2: NO out-of-app binding fallback
 *      in v1.1), alert with no identifiers. A token already owned by another
 *      payer is refused; there is no automatic re-linking.
 *   5. A test purchase (`testPurchase` present) grants only for payers on
 *      `google_license_testers`.
 *   6. The row is written FIRST, then the purchase is acknowledged. A failed
 *      acknowledge is retried (bounded), surfaced as `acknowledge_failed`, and
 *      leaves the row unacknowledged; submitting the same token again
 *      re-verifies and finishes the acknowledge.
 *   7. LOGGING (NON-NEGOTIABLE): purchase tokens and obfuscated ids are never
 *      logged or alerted. Logs here are static event labels and Postgres error
 *      codes only; alerts carry at most an internal row id. Payer ids are
 *      deliberately not logged either.
 *   8. The client gets a minimal result, never payload fields.
 *
 * Not in this file (other issues): entitlement reading in the shared resolver,
 * duplicate-purchase guard and offline window (FV-663); RTDN webhook and the
 * full linked-token lifecycle (FV-662); cancel/revoke (FV-663); UI (FV-665).
 */

"use server";

import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { googleSubscriptionAccessLevel } from "@/lib/subscriptions/google-access-level";
import { isGooglePlayCatalogActive } from "@/lib/subscriptions/google-product-catalog";
import { getSubscriptionPurchaseV2 } from "@/lib/subscriptions/google-play-api";
import {
  GoogleDbError,
  acknowledgeAndRecord,
  alertOps,
  checkPurchaseAdmission,
  dbFail,
  readBindingId,
  refreshLinkedRow,
  writeMirrorRow,
  type GoogleServiceClient as ServiceClient,
} from "@/lib/subscriptions/google-play-sync";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const SubmitGooglePurchaseSchema = z.object({
  // The purchase token is the ONLY thing taken from the client. Google purchase
  // tokens are well under 4 KB; the cap bounds what we forward in a URL.
  purchaseToken: z.string().min(1, "Missing purchase.").max(4096),
});

export type SubmitGooglePurchaseInput = z.infer<typeof SubmitGooglePurchaseSchema>;

export type GooglePurchaseErrorCode =
  | "unavailable"
  | "invalid_input"
  | "unauthenticated"
  | "not_authorized"
  | "verification_failed"
  | "verification_unavailable"
  | "ownership_conflict"
  | "account_mismatch"
  | "unknown_product"
  | "test_purchase_rejected"
  | "acknowledge_failed"
  | "internal_error";

export type SubmitGooglePurchaseResult =
  | { ok: true; entitled: boolean; acknowledged: boolean }
  | { ok: false; error: GooglePurchaseErrorCode };

export type BeginGooglePlayPurchaseResult =
  | { ok: true; obfuscatedAccountId: string }
  | {
      ok: false;
      error: "unavailable" | "unauthenticated" | "not_authorized" | "internal_error";
    };

// ---------------------------------------------------------------------------
// Helpers (none exported: a "use server" file exports async actions only)
// ---------------------------------------------------------------------------

type PayerResolution =
  | { ok: true; payerId: string }
  | { ok: false; error: "unauthenticated" | "not_authorized" };

/** Session user + role gate (parent | adult_athlete). Writes nothing. */
async function resolvePayer(): Promise<PayerResolution> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (error || !profile) {
    console.warn("[google-play-subscription] profile lookup failed; refusing.");
    return { ok: false, error: "not_authorized" };
  }
  if (profile.role !== "parent" && profile.role !== "adult_athlete") {
    console.warn("[google-play-subscription] refused: role is not a payer role. No write performed.");
    return { ok: false, error: "not_authorized" };
  }
  return { ok: true, payerId: user.id };
}

async function getOrMintBindingId(service: ServiceClient, payerId: string): Promise<string> {
  const existing = await readBindingId(service, payerId);
  if (existing) return existing;

  // First use: mint. ignoreDuplicates covers two concurrent first taps; the
  // loser's insert is skipped and we re-read below.
  const { data: inserted, error: insertError } = await service
    .from("google_purchase_bindings")
    .upsert({ payer_id: payerId }, { onConflict: "payer_id", ignoreDuplicates: true })
    .select("binding_id")
    .maybeSingle();
  if (insertError) dbFail("binding_mint", insertError);
  if (inserted) return inserted.binding_id;

  const afterRace = await readBindingId(service, payerId);
  if (!afterRace) throw new GoogleDbError("binding_mint_race", undefined);
  return afterRace;
}

// ---------------------------------------------------------------------------
// beginGooglePlayPurchase
// ---------------------------------------------------------------------------

/**
 * Returns the signed-in payer's binding id, to be passed to Play as
 * `obfuscatedAccountId` on the client purchase call. Mints the
 * `google_purchase_bindings` row on first use (a write, so the role gate comes
 * first). The id is an opaque random UUID: not the profile id, not Apple's
 * token. There is no input: the payer is the session user.
 *
 * The duplicate-purchase guard (already entitled via another provider) is
 * FV-663; it is intentionally not wired here.
 */
export async function beginGooglePlayPurchase(): Promise<BeginGooglePlayPurchaseResult> {
  if (!isGooglePlayCatalogActive()) return { ok: false, error: "unavailable" };

  try {
    const payer = await resolvePayer();
    if (!payer.ok) return payer;
    const bindingId = await getOrMintBindingId(createServiceClient(), payer.payerId);
    return { ok: true, obfuscatedAccountId: bindingId };
  } catch (err) {
    console.error(
      `[google-play-subscription] begin failed (${err instanceof GoogleDbError ? err.message : "unexpected"}).`,
    );
    alertOps("[google-play-subscription] internal error", "beginGooglePlayPurchase failed");
    return { ok: false, error: "internal_error" };
  }
}

// ---------------------------------------------------------------------------
// submitGooglePurchase
// ---------------------------------------------------------------------------

export async function submitGooglePurchase(
  input: SubmitGooglePurchaseInput,
): Promise<SubmitGooglePurchaseResult> {
  // Lock 2 of 3 (record 6.1): refuse before touching Google or the database.
  if (!isGooglePlayCatalogActive()) return { ok: false, error: "unavailable" };

  const parsed = SubmitGooglePurchaseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const purchaseToken = parsed.data.purchaseToken;

  try {
    const payer = await resolvePayer();
    if (!payer.ok) return payer;
    const payerId = payer.payerId;

    // 3. Google is the truth. Nothing below runs unless it confirms the token.
    const got = await getSubscriptionPurchaseV2(purchaseToken);
    if (!got.ok) {
      if (got.reason === "unavailable") {
        console.warn("[google-play-subscription] Google verification unavailable.");
        return { ok: false, error: "verification_unavailable" };
      }
      console.warn(`[google-play-subscription] Google verification failed (${got.reason}).`);
      return { ok: false, error: "verification_failed" };
    }
    const purchase = got.purchase;

    const service = createServiceClient();

    // 4a. Ownership: a token already bound to a different payer is refused.
    const { data: owner, error: ownerError } = await service
      .from("google_subscriptions")
      .select("payer_id")
      .eq("purchase_token", purchaseToken)
      .maybeSingle();
    if (ownerError) dbFail("ownership_read", ownerError);
    if (owner && owner.payer_id !== payerId) {
      console.warn("[google-play-subscription] rejected: purchase already linked to a different payer.");
      return { ok: false, error: "ownership_conflict" };
    }

    // 4b. Binding: Google's returned account id must equal this payer's
    //     binding id. No mint here (a refused path writes nothing).
    const bindingId = await readBindingId(service, payerId);
    if (!bindingId || !purchase.obfuscatedAccountId || purchase.obfuscatedAccountId !== bindingId) {
      console.warn("[google-play-subscription] rejected: purchase not bound to this payer. Not acknowledged.");
      alertOps(
        "[google-play-subscription] unbound purchase refused",
        "A purchase arrived with a missing or mismatched account id; nothing granted, not acknowledged",
      );
      return { ok: false, error: "account_mismatch" };
    }

    // 5 + 6. Catalog (fail closed) and license-tester allowlist (record 7.4),
    //        shared with the webhook.
    const refused = await checkPurchaseAdmission(service, payerId, purchase);
    if (refused) return { ok: false, error: refused };

    // 7. Linked (older) token: owned by someone else is refused outright.
    let linkedRow: { id: string } | null = null;
    if (purchase.linkedPurchaseToken) {
      const { data: linked, error: linkedError } = await service
        .from("google_subscriptions")
        .select("id, payer_id")
        .eq("purchase_token", purchase.linkedPurchaseToken)
        .maybeSingle();
      if (linkedError) dbFail("linked_read", linkedError);
      if (linked && linked.payer_id !== payerId) {
        console.warn("[google-play-subscription] rejected: linked purchase belongs to a different payer.");
        return { ok: false, error: "ownership_conflict" };
      }
      linkedRow = linked ? { id: linked.id } : null;
    }

    // 8. Write the row, THEN acknowledge. Server time, always set.
    const verifiedAt = new Date();
    const written = await writeMirrorRow(service, payerId, purchaseToken, purchase, verifiedAt.toISOString());
    if (written.kind === "conflict") {
      console.warn("[google-play-subscription] rejected: purchase already linked to a different payer.");
      return { ok: false, error: "ownership_conflict" };
    }
    if (written.kind === "closed") {
      // The row is held as expired (ended, refunded or charged back). Submitting
      // the token again never restores access and never acknowledges.
      console.warn("[google-play-subscription] closed purchase re-submitted; left closed.");
      alertOps(
        "[google-play-subscription] closed purchase re-submitted",
        "Google reported a granting state for a purchase held as expired; left closed",
        { row_id: written.rowId },
      );
      return { ok: true, entitled: false, acknowledged: purchase.acknowledged };
    }

    if (purchase.linkedPurchaseToken && linkedRow) {
      await refreshLinkedRow(
        service,
        payerId,
        purchase.linkedPurchaseToken,
        linkedRow.id,
        verifiedAt.toISOString(),
      );
    }

    const entitled =
      googleSubscriptionAccessLevel(purchase.status, purchase.expiresAt, verifiedAt) === "full";

    // 9. Acknowledge only a purchase that currently grants full access and is
    //    not already acknowledged. Pending / held / expired purchases are left
    //    alone (Google refunds an unacknowledged purchase after 3 days).
    if (purchase.acknowledged || !entitled) {
      return { ok: true, entitled, acknowledged: purchase.acknowledged };
    }

    const acked = await acknowledgeAndRecord(service, written.rowId, purchase.productId, purchaseToken);
    if (!acked) return { ok: false, error: "acknowledge_failed" };

    return { ok: true, entitled, acknowledged: true };
  } catch (err) {
    console.error(
      `[google-play-subscription] internal error (${err instanceof GoogleDbError ? err.message : "unexpected"}).`,
    );
    alertOps("[google-play-subscription] internal error", "submitGooglePurchase failed");
    return { ok: false, error: "internal_error" };
  }
}
