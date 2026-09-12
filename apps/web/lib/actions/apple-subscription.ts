/**
 * Server action: Apple purchase submission (FV-571).
 *
 * Called by the future iOS StoreKit 2 bridge immediately after a purchase OR
 * a user-initiated restore. The client submits the signed transaction (and,
 * when available, the signed renewal info) JWS strings it received from
 * StoreKit; this action verifies them server-side and, if every check
 * passes, persists the payer's `apple_subscriptions` row.
 *
 * Security / privacy contract (docs/fv210-ios-iap-decision-record.md, kids-
 * privacy-officer review):
 *   1. The signed-in user is resolved server-side (`auth.getUser()`) — the
 *      client never supplies a payer id.
 *   2. PRIVACY AC — role gate BEFORE ANY WRITE: only `parent` or
 *      `adult_athlete` may submit a purchase. Any other role (an `athlete`
 *      session, most importantly) is refused with a generic error, writes
 *      NOTHING, and the refusal is logged as an event only (payer id + role
 *      — never any payload content).
 *   3. The JWS is verified server-side via ./apple-server.ts. A verification
 *      failure logs ONLY that verification failed + the payer id — never the
 *      raw JWS string.
 *   4. Environment is read from the VERIFIED payload only, never trusted
 *      from the client. A Sandbox submission from a payer who isn't on the
 *      `apple_sandbox_testers` allowlist is rejected outright (record
 *      Section 4.9, risk R2) — no row is written.
 *   5. Token binding (record Section 4.1) — the payer's `apple_purchase_tokens`
 *      row is get-or-minted, and the verified payload's `appAccountToken`
 *      must equal it exactly. A mismatch (or an absent token on the payload)
 *      is rejected; there is no auto-relink path, ever — relinking an
 *      orphaned transaction is support-mediated only (record Section 4.7).
 *      The ownership-conflict check (a different LIVE payer already owns
 *      this original_transaction_id/environment) runs FIRST and is a
 *      distinct rejection: "restore cannot transfer ownership."
 *   6. Duplicate-billing guard (record Section 4.4) — after a successful
 *      persist, if the payer ALSO holds an active/trialing Stripe row, the
 *      Apple row is kept (never rolled back) and an internal ops alert
 *      fires via the same `notifyError` + `deliverInBackground` mechanism
 *      the Stripe integration uses elsewhere. This is warning-only; it never
 *      turns into a thrown error or a client-visible failure.
 *   7. The client never receives payload fields back — only a minimal
 *      discriminated result.
 */

"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import {
  verifySignedTransaction,
  verifySignedRenewalInfo,
  type DecodedTransactionInfo,
  type DecodedRenewalInfo,
} from "@/lib/subscriptions/apple-server";
import {
  applyAppleSnapshot,
  buildSnapshotFields,
  deriveActionSubmissionStatus,
} from "@/lib/subscriptions/apple-lifecycle";

// ---------------------------------------------------------------------------
// Input / result types
// ---------------------------------------------------------------------------

const SubmitApplePurchaseSchema = z.object({
  signedTransactionInfo: z.string().min(1, "Missing signed transaction."),
  signedRenewalInfo: z.string().min(1).optional(),
});

export type SubmitApplePurchaseInput = z.infer<typeof SubmitApplePurchaseSchema>;

/**
 * Coarse, code-shaped error identifiers only — never a sentence that could
 * leak payload/internal detail to the client. The iOS bridge maps these to
 * its own user-facing copy.
 */
export type SubmitApplePurchaseErrorCode =
  | "invalid_input"
  | "unauthenticated"
  | "not_authorized"
  | "verification_failed"
  | "environment_rejected"
  | "ownership_conflict"
  | "token_mismatch"
  | "internal_error";

export type SubmitApplePurchaseResult =
  | { ok: true; applied: boolean }
  | { ok: false; error: SubmitApplePurchaseErrorCode };

// ---------------------------------------------------------------------------
// Purchase-token get-or-mint (service role)
// ---------------------------------------------------------------------------

type ServiceClient = ReturnType<typeof createServiceClient>;

async function getOrMintPurchaseToken(
  service: ServiceClient,
  payerId: string,
): Promise<string> {
  const { data: existing, error: readError } = await service
    .from("apple_purchase_tokens")
    .select("token")
    .eq("payer_id", payerId)
    .maybeSingle();
  if (readError) {
    throw new Error(`purchase token read failed: ${readError.message}`);
  }
  if (existing) return existing.token;

  // First purchase attempt for this payer — mint one. `ignoreDuplicates`
  // guards the race where two concurrent submissions both miss the read
  // above; the loser's insert is silently skipped and we re-read below.
  const { data: inserted, error: insertError } = await service
    .from("apple_purchase_tokens")
    .upsert({ payer_id: payerId }, { onConflict: "payer_id", ignoreDuplicates: true })
    .select("token")
    .maybeSingle();
  if (insertError) {
    throw new Error(`purchase token mint failed: ${insertError.message}`);
  }
  if (inserted) return inserted.token;

  const { data: afterRace, error: afterRaceError } = await service
    .from("apple_purchase_tokens")
    .select("token")
    .eq("payer_id", payerId)
    .single();
  if (afterRaceError || !afterRace) {
    throw new Error(
      `purchase token mint race unresolved: ${afterRaceError?.message ?? "no row after race"}`,
    );
  }
  return afterRace.token;
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function submitApplePurchase(
  input: SubmitApplePurchaseInput,
): Promise<SubmitApplePurchaseResult> {
  const parsed = SubmitApplePurchaseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  // 1. Resolve the signed-in user server-side. Never trust a client-passed id.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "unauthenticated" };
  }
  const payerId = user.id;

  // 2. PRIVACY AC — role gate BEFORE ANY WRITE. Only parent | adult_athlete
  //    may submit a purchase. Refusal is logged as an event only (payer id +
  //    role), never any payload content, and writes nothing.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", payerId)
    .single();

  if (profileError || !profile) {
    console.warn(
      `[apple-subscription] profile lookup failed (payer=${payerId}) — refusing.`,
    );
    return { ok: false, error: "not_authorized" };
  }

  if (profile.role !== "parent" && profile.role !== "adult_athlete") {
    console.warn(
      `[apple-subscription] refused: role="${profile.role}" is not a payer role (payer=${payerId}). No write performed.`,
    );
    return { ok: false, error: "not_authorized" };
  }

  // 3. Verify the JWS server-side. On failure: log ONLY that verification
  //    failed + the payer id — never the raw JWS.
  let transaction: DecodedTransactionInfo;
  try {
    transaction = await verifySignedTransaction(parsed.data.signedTransactionInfo);
  } catch (err) {
    console.warn(
      `[apple-subscription] transaction JWS verification failed (payer=${payerId}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return { ok: false, error: "verification_failed" };
  }

  let renewal: DecodedRenewalInfo | null = null;
  if (parsed.data.signedRenewalInfo) {
    try {
      renewal = await verifySignedRenewalInfo(parsed.data.signedRenewalInfo);
    } catch (err) {
      console.warn(
        `[apple-subscription] renewal JWS verification failed (payer=${payerId}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return { ok: false, error: "verification_failed" };
    }
  }

  const service = createServiceClient();

  try {
    // 4. Environment policy (record Section 4.9) — read from the VERIFIED
    //    payload only. A Sandbox submission from a non-allowlisted payer is
    //    rejected outright: no row, no entitlement.
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
        console.warn(
          `[apple-subscription] rejected: Sandbox submission from non-allowlisted payer=${payerId}.`,
        );
        deliverInBackground(
          notifyError(
            "[apple-subscription] Sandbox submission rejected",
            "Non-allowlisted payer submitted a Sandbox transaction",
            { payer_id: payerId },
          ),
        );
        return { ok: false, error: "environment_rejected" };
      }
    }

    // 5a. Restore-ownership check FIRST: a different LIVE payer already
    //     owns this (original_transaction_id, environment)? Ownership never
    //     transfers via restore — support-mediated relink only.
    const { data: conflictRow, error: conflictError } = await service
      .from("apple_subscriptions")
      .select("payer_id")
      .eq("original_transaction_id", transaction.originalTransactionId)
      .eq("environment", transaction.environment)
      .maybeSingle();
    if (conflictError) {
      throw new Error(`ownership conflict read failed: ${conflictError.message}`);
    }
    if (conflictRow && conflictRow.payer_id !== payerId) {
      console.warn(
        `[apple-subscription] rejected: original_transaction_id already linked to a different payer (payer=${payerId}). Restore cannot transfer ownership.`,
      );
      return { ok: false, error: "ownership_conflict" };
    }

    // 5b. Token binding (record Section 4.1). Get-or-mint the payer's row,
    //     then require the verified payload's appAccountToken to match it
    //     exactly. No auto-relink, ever.
    const mintedToken = await getOrMintPurchaseToken(service, payerId);
    if (!transaction.appAccountToken || transaction.appAccountToken !== mintedToken) {
      console.warn(
        `[apple-subscription] rejected: appAccountToken mismatch (payer=${payerId}).`,
      );
      return { ok: false, error: "token_mismatch" };
    }

    // 6. Upsert — a client submission carries no `notificationType`, so the
    //    status is DERIVED from the verified payload itself
    //    (deriveActionSubmissionStatus): revoked if Apple's revocation
    //    fields are present; in_grace_period when the renewal payload's own
    //    gracePeriodExpiresDate evidence says so; expired when a lapsed
    //    subscription is restored (mirrors truthfully rather than claiming
    //    subscribed); else subscribed. `in_billing_retry` is deliberately
    //    NEVER inferred here — it is indistinguishable from a plain lapse
    //    without a Notifications V2 `notificationType`, and is only ever
    //    learned from Apple's own webhook payloads.
    const derivedStatus = deriveActionSubmissionStatus(transaction, renewal);
    const fields = buildSnapshotFields(derivedStatus, transaction, renewal);
    const result = await applyAppleSnapshot(service, { payerId, ...fields });

    // 7. Duplicate-billing guard (record Section 4.4) — warning only, never
    //    blocks and never rolls back the just-persisted Apple row.
    const { data: stripeRow, error: stripeReadError } = await service
      .from("subscriptions")
      .select("status")
      .eq("parent_id", payerId)
      .maybeSingle();
    if (!stripeReadError && stripeRow && (stripeRow.status === "active" || stripeRow.status === "trialing")) {
      deliverInBackground(
        notifyError(
          "[apple-subscription] Duplicate billing detected",
          "Payer holds both an active/trialing Stripe subscription and a persisted Apple subscription",
          { payer_id: payerId, environment: transaction.environment },
        ),
      );
    }

    return { ok: true, applied: result.applied };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[apple-subscription] internal error processing submission (payer=${payerId}): ${message}`,
    );
    deliverInBackground(
      notifyError("[apple-subscription] internal error", message, {
        payer_id: payerId,
      }),
    );
    return { ok: false, error: "internal_error" };
  }
}

// ---------------------------------------------------------------------------
// beginApplePurchase — the sanctioned token handoff for the iOS bridge
// ---------------------------------------------------------------------------

export type BeginApplePurchaseResult =
  | { ok: true; appAccountToken: string }
  | { ok: false; error: "unauthenticated" | "not_authorized" | "internal_error" };

/**
 * Returns the signed-in payer's opaque `app_account_token` so the iOS
 * StoreKit bridge can attach it to `purchase(appAccountToken:)` (FV-572).
 *
 * WHY THIS EXISTS (record Section 4.1): `apple_purchase_tokens` is
 * deliberately zero-grant at the DB layer — a payer must never be able to
 * BROWSE the binding table client-side. But the purchase flow requires the
 * token to transit the client exactly once per purchase call, because Apple
 * only echoes back what StoreKit was given. This action is the SOLE
 * sanctioned handoff:
 *   - role-gated to parent | adult_athlete (same privacy AC as
 *     submitApplePurchase — and minting IS a write, so the gate precedes it);
 *   - returns ONLY the caller's own token, resolved from the authenticated
 *     session — there is no payer-id input to tamper with;
 *   - the token is an opaque UUID with no meaning outside this backend; the
 *     durable link key remains (original_transaction_id, environment).
 *
 * Mint-on-first-use: reuses getOrMintPurchaseToken (race-safe upsert), so a
 * payer's first tap of the purchase button creates their token row.
 */
export async function beginApplePurchase(): Promise<BeginApplePurchaseResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "unauthenticated" };
  }
  const payerId = user.id;

  // PRIVACY AC — role gate BEFORE the mint write, same rule as
  // submitApplePurchase. Refusal logs role + payer id only.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", payerId)
    .single();

  if (profileError || !profile) {
    console.warn(
      `[apple-subscription] beginApplePurchase profile lookup failed (payer=${payerId}) — refusing.`,
    );
    return { ok: false, error: "not_authorized" };
  }
  if (profile.role !== "parent" && profile.role !== "adult_athlete") {
    console.warn(
      `[apple-subscription] beginApplePurchase refused: role="${profile.role}" is not a payer role (payer=${payerId}). No write performed.`,
    );
    return { ok: false, error: "not_authorized" };
  }

  try {
    const service = createServiceClient();
    const token = await getOrMintPurchaseToken(service, payerId);
    return { ok: true, appAccountToken: token };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[apple-subscription] beginApplePurchase failed (payer=${payerId}): ${message}`,
    );
    deliverInBackground(
      notifyError("[apple-subscription] beginApplePurchase failed", message, {
        payer_id: payerId,
      }),
    );
    return { ok: false, error: "internal_error" };
  }
}
