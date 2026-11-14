/**
 * google-play-rtdn.ts — Real-time Developer Notification handling (FV-662,
 * Play Billing C4). Server-only; called by `app/api/webhooks/google-play`
 * AFTER the push has been authenticated.
 *
 * THE RULE THAT MAKES THIS SAFE: a notification is only a hint that a purchase
 * token changed. It carries a type and a token, and we never act on the type.
 * Every handled message re-reads the subscription from Google
 * (`subscriptionsv2.get`) and writes what Google says now. So a duplicate, a
 * late, or an out-of-order message just re-writes the same current truth.
 *
 * Token handling (record 7.2 / 7.3):
 *   a. Row exists for the token: refresh it from Google (scoped by row id,
 *      `last_verified_at` always set). If it now grants full access and Google
 *      says it is not acknowledged, acknowledge (row written first).
 *   b. No row, and Google's obfuscated account id equals a
 *      `google_purchase_bindings.binding_id`: a correctly bound purchase whose
 *      client submit never arrived. Same checks as `submitGooglePurchase`
 *      (catalog, license-tester allowlist, linked-token ownership), write the
 *      row for that binding's payer, acknowledge when it grants full access.
 *   c. No row, no usable binding, but `linkedPurchaseToken` names a row we
 *      already own (a plan change): write the new row for the SAME payer and
 *      refresh the old row. Never for a linked token we do not own.
 *   d. Otherwise: grant nothing, write nothing, NEVER acknowledge, alert with
 *      no identifiers. There is no out-of-app binding fallback in v1.1; Google
 *      refunds an unacknowledged purchase after 3 days.
 *
 * Voided purchases (refund / chargeback) and revokes remove access for a row
 * we own, and removal does not depend on Google's read succeeding.
 *
 * LOGGING (NON-NEGOTIABLE): tokens, obfuscated ids, payer ids, the JWT and
 * message bodies never reach a log, alert or response. Static labels, enum
 * reasons and Postgres codes only; alert context is at most an internal row id.
 */
import "server-only";

import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/service";
import type { TablesUpdate } from "@/lib/supabase/types";
import { googleSubscriptionAccessLevel } from "@/lib/subscriptions/google-access-level";
import { GOOGLE_PLAY_PACKAGE_NAME, googleCatalogEntry } from "@/lib/subscriptions/google-product-catalog";
import { getSubscriptionPurchaseV2, type ParsedGooglePurchase } from "@/lib/subscriptions/google-play-api";
import {
  acknowledgeAndRecord,
  alertOps,
  checkPurchaseAdmission,
  dbFail,
  mirrorFields,
  refreshLinkedRow,
  writeMirrorRow,
  type GoogleServiceClient,
} from "@/lib/subscriptions/google-play-sync";

const P = "[google-play-webhook]";

// ---------------------------------------------------------------------------
// Message parsing (pure)
// ---------------------------------------------------------------------------

const TokenSchema = z.string().min(1).max(4096);

const NotificationSchema = z.looseObject({
  packageName: z.string(),
  subscriptionNotification: z.looseObject({ purchaseToken: TokenSchema }).optional(),
  voidedPurchaseNotification: z
    .looseObject({ purchaseToken: TokenSchema, productType: z.number().optional() })
    .optional(),
});

export type ParsedNotification =
  | { kind: "subscription"; purchaseToken: string }
  | { kind: "voided"; purchaseToken: string }
  | { kind: "ignored"; reason: "unparseable" | "wrong_package" | "not_a_subscription_event" };

/** Google's VoidedPurchaseNotification.productType: 1 = subscription. */
const PRODUCT_TYPE_ONE_TIME = 2;

/** Decodes Pub/Sub's base64 `message.data` into one of the handled shapes. No I/O. */
export function parseDeveloperNotification(encodedData: string): ParsedNotification {
  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(encodedData, "base64").toString("utf8"));
  } catch {
    return { kind: "ignored", reason: "unparseable" };
  }
  const parsed = NotificationSchema.safeParse(json);
  if (!parsed.success) return { kind: "ignored", reason: "unparseable" };
  const n = parsed.data;
  if (n.packageName !== GOOGLE_PLAY_PACKAGE_NAME) return { kind: "ignored", reason: "wrong_package" };

  if (n.subscriptionNotification) {
    return { kind: "subscription", purchaseToken: n.subscriptionNotification.purchaseToken };
  }
  if (n.voidedPurchaseNotification && n.voidedPurchaseNotification.productType !== PRODUCT_TYPE_ONE_TIME) {
    return { kind: "voided", purchaseToken: n.voidedPurchaseNotification.purchaseToken };
  }
  // testNotification, oneTimeProductNotification, a voided one-time product, ...
  return { kind: "ignored", reason: "not_a_subscription_event" };
}

// ---------------------------------------------------------------------------
// Processing
// ---------------------------------------------------------------------------

/**
 * applied/ignored: 2xx (Pub/Sub is done with the message).
 * retry: non-2xx so Pub/Sub redelivers (Google or an acknowledge was unavailable).
 * A thrown `GoogleDbError` is also retryable (the route maps it to 5xx).
 */
export type RtdnOutcome = "applied" | "ignored" | "retry";

export interface RtdnDeps {
  /** Injected clock; defaults to server time. */
  readonly now?: () => Date;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface OwnedRow {
  readonly id: string;
  readonly payer_id: string;
  readonly status: string;
}

export async function processGoogleNotification(
  notification: Extract<ParsedNotification, { kind: "subscription" | "voided" }>,
  deps: RtdnDeps = {},
): Promise<RtdnOutcome> {
  const now = (deps.now ?? (() => new Date()))();
  const token = notification.purchaseToken;
  const voided = notification.kind === "voided";
  const service = createServiceClient();

  const { data: row, error: rowError } = await service
    .from("google_subscriptions")
    .select("id, payer_id, status")
    .eq("purchase_token", token)
    .maybeSingle();
  if (rowError) dbFail("row_read", rowError);

  // Only a genuinely transient failure (`unavailable`) may be retried. Anything
  // else is permanent for this message, and retrying it would loop forever.
  const got = await getSubscriptionPurchaseV2(token);
  if (!got.ok) {
    if (voided) {
      if (row) {
        // Access removal must not depend on Google's read succeeding. An
        // already-expired row is left alone (its expiry is not rewritten).
        await forceNonGranting(service, row.id, now);
        const transient = got.reason === "unavailable";
        console.error(`${P} voided purchase: Google read failed (${got.reason}); access removed.`);
        alertOps(
          `${P} voided purchase read failed`,
          transient
            ? "Google read failed for a voided purchase; access removed, will retry"
            : "Google could not be read for a voided purchase; access removed, not retrying",
          { row_id: row.id, reason: got.reason },
        );
        return transient ? "retry" : "applied";
      }
      // A void for a token we do not hold yet: only a transient failure retries.
      if (got.reason === "unavailable") {
        console.error(`${P} voided purchase: Google read failed (${got.reason}).`);
        alertOps(`${P} voided purchase read failed`, "Google read failed for a voided purchase we do not hold yet; will retry", {
          reason: got.reason,
        });
        return "retry";
      }
      return "ignored";
    }
    if (got.reason === "invalid_token") {
      // Google does not know the token: not retryable. For a row we own that is
      // odd (the stall checker will catch it if it keeps granting past expiry).
      console.warn(`${P} Google does not recognise a notified token.`);
      if (row) {
        alertOps(`${P} owned token unknown to Google`, "Google no longer recognises a purchase token we hold", {
          row_id: row.id,
        });
      }
      return "ignored";
    }
    if (got.reason === "unavailable") {
      // Pub/Sub redelivers with backoff; the stall checker is the backstop, so
      // no alert email per delivery.
      console.warn(`${P} Google read unavailable; will be redelivered.`);
      return "retry";
    }
    // unparseable / unknown_state: permanent. A new Google state must not turn
    // into an endless redelivery loop.
    console.error(`${P} Google read failed (${got.reason}); not retrying.`);
    alertOps(`${P} Google answer unreadable`, "Google returned a subscription we cannot read; message dropped", {
      reason: got.reason,
      ...(row ? { row_id: row.id } : {}),
    });
    return "ignored";
  }

  const purchase = got.purchase;
  return row
    ? applyToOwnedRow(service, row, token, purchase, voided, now)
    : applyToUnownedToken(service, token, purchase, now, voided);
}

/**
 * Sets a row to a non-granting state with an expiry that is not in the future.
 * Skips a row that is already `expired` so its expiry is never rewritten.
 */
async function forceNonGranting(service: GoogleServiceClient, rowId: string, now: Date): Promise<void> {
  const { error } = await service
    .from("google_subscriptions")
    .update({ status: "expired", expires_at: now.toISOString(), auto_renewing: false })
    .eq("id", rowId)
    .neq("status", "expired");
  if (error) dbFail("force_non_granting", error);
}

// -- rule a ------------------------------------------------------------------

async function applyToOwnedRow(
  service: GoogleServiceClient,
  row: OwnedRow,
  token: string,
  purchase: ParsedGooglePurchase,
  voided: boolean,
  now: Date,
): Promise<RtdnOutcome> {
  const nowIso = now.toISOString();
  let fields: TablesUpdate<"google_subscriptions"> = mirrorFields(purchase, nowIso);

  if (!googleCatalogEntry(purchase.productId, purchase.basePlanId)) {
    // Refresh the lifecycle only; never write a product we do not recognise.
    fields = {
      status: purchase.status,
      expires_at: purchase.expiresAt,
      auto_renewing: purchase.autoRenewing,
      acknowledged: purchase.acknowledged,
      last_verified_at: nowIso,
    };
    alertOps(`${P} unknown product on refresh`, "A refreshed purchase named a product outside the catalog; product not updated", {
      row_id: row.id,
    });
  }

  let level = googleSubscriptionAccessLevel(purchase.status, purchase.expiresAt, now);
  const googleGrants = level !== "blocked";

  // `expired` is TERMINAL for a row (see writeMirrorRow): once expired, only
  // `last_verified_at` is ever written again. That holds for an expiry Google
  // reported and for one a refund forced, and whatever Google says now, so no
  // intermediate state (paused, pending) can lead back to a granting row.
  let conditional = true;
  if (row.status === "expired") {
    fields = { last_verified_at: nowIso };
    level = "blocked";
    conditional = false;
    if (googleGrants) {
      console.warn(`${P} expired row not re-opened by a later message.`);
      alertOps(`${P} expired row not re-opened`, "Google reported a granting state for a row held as expired; left closed", {
        row_id: row.id,
      });
    }
  } else if (voided && purchase.status !== "expired") {
    // A refund or chargeback always ends the row as `expired`, whatever Google
    // still reports (active, paused, on hold): force it, with an expiry that
    // is not in the future (the status vocabulary is fixed by the table CHECK).
    // This is the only write that is not conditional on the row being open.
    fields = { ...fields, status: "expired", expires_at: nowIso, auto_renewing: false };
    level = "blocked";
    conditional = false;
    if (googleGrants) {
      console.warn(`${P} voided purchase still granting at Google; forced non-granting.`);
      alertOps(`${P} voided purchase forced non-granting`, "Google still reported a granting state for a voided purchase", {
        row_id: row.id,
      });
    }
  }

  // Every other write is conditional IN SQL on the row not having been closed
  // since we read it (a refund can land between the read and this write).
  let query = service.from("google_subscriptions").update(fields).eq("id", row.id);
  if (conditional) query = query.neq("status", "expired");
  const { data: written, error } = await query.select("id").maybeSingle();
  if (error) dbFail("subscription_refresh", error);
  if (conditional && !written) {
    // Closed concurrently: it stays closed. Nothing written, nothing acknowledged.
    console.warn(`${P} expired row not re-opened by a later message.`);
    if (googleGrants) {
      alertOps(`${P} expired row not re-opened`, "Google reported a granting state for a row held as expired; left closed", {
        row_id: row.id,
      });
    }
    return "applied";
  }

  // Acknowledge only what Google says is unacknowledged and grants full access
  // (closes "started pending, became active later").
  if (level === "full" && !purchase.acknowledged) {
    const acked = await acknowledgeAndRecord(service, row.id, purchase.productId, token, P);
    if (!acked) return "retry";
  }
  return "applied";
}

// -- rules b, c, d -----------------------------------------------------------

async function applyToUnownedToken(
  service: GoogleServiceClient,
  token: string,
  googlePurchase: ParsedGooglePurchase,
  now: Date,
  voided: boolean,
): Promise<RtdnOutcome> {
  // A void that arrives before the row exists writes the row ALREADY CLOSED, so
  // a later client submit or ordinary message cannot create a granting row for
  // a refunded purchase. It is never acknowledged.
  const purchase: ParsedGooglePurchase = voided
    ? { ...googlePurchase, status: "expired", expiresAt: now.toISOString(), autoRenewing: false }
    : googlePurchase;

  // Linked token we may already own (rule c).
  let linkedRow: { id: string; payer_id: string } | null = null;
  if (purchase.linkedPurchaseToken) {
    const { data, error } = await service
      .from("google_subscriptions")
      .select("id, payer_id")
      .eq("purchase_token", purchase.linkedPurchaseToken)
      .maybeSingle();
    if (error) dbFail("linked_read", error);
    linkedRow = data ? { id: data.id, payer_id: data.payer_id } : null;
  }

  // Binding match (rule b). A non-UUID account id cannot be a binding id; do
  // not send it to the database.
  let bindingPayerId: string | null = null;
  if (purchase.obfuscatedAccountId && UUID_RE.test(purchase.obfuscatedAccountId)) {
    const { data, error } = await service
      .from("google_purchase_bindings")
      .select("payer_id")
      .eq("binding_id", purchase.obfuscatedAccountId)
      .maybeSingle();
    if (error) dbFail("binding_lookup", error);
    bindingPayerId = data ? data.payer_id : null;
  }

  const payerId = bindingPayerId ?? linkedRow?.payer_id ?? null;
  if (!payerId) {
    // Rule d. (Nothing can be written later for an unbound purchase either, so
    // an unbound void needs no alert of its own.)
    console.warn(`${P} rejected: purchase not bound to a payer. Not acknowledged.`);
    if (!voided) {
      alertOps(
        `${P} unbound purchase refused`,
        "A purchase arrived with a missing or unmatched account id; nothing granted, not acknowledged",
      );
    }
    return "ignored";
  }

  // A linked token owned by a DIFFERENT payer is refused outright.
  if (linkedRow && linkedRow.payer_id !== payerId) {
    console.warn(`${P} rejected: linked purchase belongs to a different payer.`);
    alertOps(`${P} linked purchase ownership conflict`, "A purchase named a linked token owned by another payer; nothing written");
    return "ignored";
  }

  // The payer must still be a payer role (mirrors the action's session gate).
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("role")
    .eq("id", payerId)
    .maybeSingle();
  if (profileError) dbFail("payer_read", profileError);
  if (!profile || (profile.role !== "parent" && profile.role !== "adult_athlete")) {
    console.warn(`${P} rejected: resolved payer is not a payer role. No write performed.`);
    alertOps(`${P} payer role refused`, "A purchase resolved to an account that is not a payer; nothing written");
    return "ignored";
  }

  const refused = await checkPurchaseAdmission(service, payerId, purchase, P);
  if (refused) return "ignored";

  const nowIso = now.toISOString();
  const written = await writeMirrorRow(service, payerId, token, purchase, nowIso);
  if (written.kind === "conflict") {
    console.warn(`${P} rejected: purchase already linked to a different payer.`);
    return "ignored";
  }
  if (written.kind === "closed") {
    // A row appeared between the first read and the write and is held as
    // expired: it stays closed (see writeMirrorRow).
    console.warn(`${P} expired row not re-opened by a later message.`);
    return "applied";
  }

  if (linkedRow && purchase.linkedPurchaseToken) {
    await refreshLinkedRow(service, payerId, purchase.linkedPurchaseToken, linkedRow.id, nowIso, P);
  }

  // A closed (voided) write has status `expired`, so level is blocked and this
  // never acknowledges.
  const level = googleSubscriptionAccessLevel(purchase.status, purchase.expiresAt, now);
  if (level === "full" && !purchase.acknowledged) {
    const acked = await acknowledgeAndRecord(service, written.rowId, purchase.productId, token, P);
    if (!acked) return "retry";
  }
  return "applied";
}
