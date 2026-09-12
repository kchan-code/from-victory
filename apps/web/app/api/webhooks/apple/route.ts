/**
 * App Store Server Notifications V2 webhook (FV-571).
 *
 * POST /api/webhooks/apple
 *
 * The middleware matcher in middleware.ts already excludes `api/webhooks`
 * (generically, not Stripe-specific) — this route needs no matcher change
 * (verified: the exclusion pattern is `api/webhooks(?:/|$)`, which covers
 * `/api/webhooks/apple` the same way it covers `/api/webhooks/stripe`).
 *
 * Security contract:
 *   - Every request's `signedPayload` is verified via
 *     ./apple-server.ts:verifyAndDecodeNotification() before any processing.
 *     Verification failure -> 400, no processing, NEVER logs the raw payload
 *     (only that verification failed).
 *   - No PII, and NO purchase content, is ever logged. Only opaque
 *     identifiers (payer id, notificationType/subtype, environment,
 *     original_transaction_id) may appear in logs — matching the existing
 *     Stripe webhook's log discipline.
 *
 * Payer resolution (record Section 4.2/4.7):
 *   1. (original_transaction_id, environment) match on `apple_subscriptions`.
 *   2. Else, appAccountToken -> `apple_purchase_tokens.token` -> payer_id
 *      (first-seen transaction creates the row for a LIVE payer — Apple
 *      gives no checkout-lands-first guarantee).
 *   3. No match at all (deleted account, unknown token) -> benign no-op:
 *      no row created, no relink, ever. Warn + 200 (Apple stops retrying a
 *      permanently unmappable event).
 *
 * PRIVACY AC: the resolved payer's role is verified to be parent |
 * adult_athlete BEFORE any write — mirrors the purchase-submission action's
 * gate exactly.
 *
 * Sandbox policy (record Section 4.9): a Sandbox-environment notification
 * only upserts for an allowlisted payer; otherwise benign no-op (warn + 200).
 *
 * Response discipline (three branches):
 *   200 — applied, OR dropped-as-stale by the watermark, OR a benign
 *         unmapped-token/no-payer/non-allowlisted-Sandbox no-op.
 *   200 + warn log — a recognized notificationType we intentionally don't
 *         act on (mapAppleNotificationToStatus returns null).
 *   500 — a genuine internal failure (DB error) so Apple retries (5 retries
 *         at 1/12/24/48/72h in production).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { verifyAndDecodeNotification } from "@/lib/subscriptions/apple-server";
import type { DecodedNotification, DecodedTransactionInfo } from "@/lib/subscriptions/apple-server";
import {
  applyAppleSnapshot,
  buildSnapshotFields,
  mapAppleNotificationToStatus,
} from "@/lib/subscriptions/apple-lifecycle";
import { createServiceClient } from "@/lib/supabase/service";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";

const WebhookBodySchema = z.object({
  signedPayload: z.string().min(1),
});

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsedBody = WebhookBodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Missing signedPayload." }, { status: 400 });
  }

  let decoded: DecodedNotification;
  try {
    decoded = await verifyAndDecodeNotification(parsedBody.data.signedPayload);
  } catch (err) {
    // Verification failure — NEVER log the raw payload, only that it failed.
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[apple/webhook] signature verification failed: ${message}`);
    return NextResponse.json({ error: "Verification failed." }, { status: 400 });
  }

  try {
    await processNotification(decoded);
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[apple/webhook] processing failed (notificationType="${decoded.notificationType}"): ${message}`,
    );
    deliverInBackground(
      notifyError("[apple/webhook] processing failed", message, {
        notification_type: decoded.notificationType,
      }),
    );
    // 500 tells Apple to retry — appropriate for transient DB/infra failures.
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Processing
// ---------------------------------------------------------------------------

async function processNotification(decoded: DecodedNotification): Promise<void> {
  const mappedStatus = mapAppleNotificationToStatus(
    decoded.notificationType,
    decoded.subtype,
  );

  if (mappedStatus === null) {
    // Recognized-but-ignored (or genuinely unknown) notificationType —
    // 200 + warn, no write. This is NOT a processing failure.
    console.info(
      `[apple/webhook] ignoring notificationType="${decoded.notificationType}" subtype="${decoded.subtype ?? ""}" — not acted on.`,
    );
    return;
  }

  if (!decoded.transaction) {
    // Should not happen for the notification types we act on (Apple always
    // includes signedTransactionInfo for subscription lifecycle events), but
    // fail safe rather than throw: nothing to apply.
    console.warn(
      `[apple/webhook] notificationType="${decoded.notificationType}" carried no transaction payload — nothing to apply.`,
    );
    return;
  }

  const { transaction, renewal } = decoded;
  const service = createServiceClient();

  const payerId = await resolvePayerId(service, transaction);
  if (!payerId) {
    // Unmapped token: benign no-op. No row creation, no relink, ever
    // (record Section 4.2/4.7 — deleted-account renewals, unknown tokens).
    console.info(
      `[apple/webhook] notificationType="${decoded.notificationType}" environment="${transaction.environment}" — no payer resolved (unmapped token or deleted account). Benign no-op.`,
    );
    return;
  }

  // Sandbox policy (record Section 4.9): only upsert for an allowlisted payer.
  if (transaction.environment === "Sandbox") {
    const { data: allowlisted, error: allowlistError } = await service
      .from("apple_sandbox_testers")
      .select("payer_id")
      .eq("payer_id", payerId)
      .maybeSingle();
    if (allowlistError) {
      throw new Error(`sandbox allowlist read failed: ${allowlistError.message}`);
    }
    if (!allowlisted) {
      console.info(
        `[apple/webhook] Sandbox notification for non-allowlisted payer=${payerId} — benign no-op (record Section 4.9).`,
      );
      return;
    }
  }

  // PRIVACY AC — verify the resolved payer's role BEFORE any write. Mirrors
  // the purchase-submission action's gate exactly.
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("role")
    .eq("id", payerId)
    .maybeSingle();
  if (profileError) {
    throw new Error(`profile role read failed: ${profileError.message}`);
  }
  if (!profile || (profile.role !== "parent" && profile.role !== "adult_athlete")) {
    console.warn(
      `[apple/webhook] resolved payer role is not parent|adult_athlete — refusing write (payer=${payerId}). No write performed.`,
    );
    return;
  }

  const fields = buildSnapshotFields(mappedStatus, transaction, renewal);
  const result = await applyAppleSnapshot(service, { payerId, ...fields });

  if (!result.applied) {
    console.info(
      `[apple/webhook] dropped stale/duplicate notificationType="${decoded.notificationType}" for payer=${payerId} — newer state already applied.`,
    );
  }
}

/**
 * Resolves the payer for a verified transaction payload:
 *   1. (original_transaction_id, environment) match on apple_subscriptions.
 *   2. appAccountToken -> apple_purchase_tokens.token -> payer_id (first-seen
 *      creation for a live payer — Apple gives no checkout-lands-first
 *      guarantee).
 *   3. No match -> null (benign no-op branch, handled by the caller).
 */
async function resolvePayerId(
  service: ReturnType<typeof createServiceClient>,
  transaction: DecodedTransactionInfo,
): Promise<string | null> {
  const { data: existingSub, error: subError } = await service
    .from("apple_subscriptions")
    .select("payer_id")
    .eq("original_transaction_id", transaction.originalTransactionId)
    .eq("environment", transaction.environment)
    .maybeSingle();
  if (subError) {
    throw new Error(`apple_subscriptions payer lookup failed: ${subError.message}`);
  }
  if (existingSub) return existingSub.payer_id;

  if (!transaction.appAccountToken) return null;

  const { data: tokenRow, error: tokenError } = await service
    .from("apple_purchase_tokens")
    .select("payer_id")
    .eq("token", transaction.appAccountToken)
    .maybeSingle();
  if (tokenError) {
    throw new Error(`apple_purchase_tokens lookup failed: ${tokenError.message}`);
  }
  return tokenRow?.payer_id ?? null;
}
