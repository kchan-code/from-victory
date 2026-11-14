/**
 * FV-710: "does this payer have a payment problem, and which kind" — the
 * server-side read behind the payer-facing PaymentIssueNotice.
 *
 * Stages:
 *   - "grace"  — payment failed but the store/Stripe is still retrying and
 *     training continues (Apple `in_grace_period`, Stripe `past_due`).
 *   - "lapsed" — payment failed and access is blocked (Apple
 *     `in_billing_retry`, or Apple grace that has run out). Stripe has no
 *     lapsed stage: it cancels the subscription after its retries, which then
 *     reads as an ordinary "not subscribed".
 *
 * Rules (conservative: a notice is only ever shown on a positive, fully-read
 * finding):
 *   - An active comp grant → null.
 *   - Any read error → null (logged: payer id + message only).
 *   - "lapsed" only when the payer's OVERALL level is `blocked`. Decided from
 *     the reads made here (best of the Stripe level and Apple's grantsAccess,
 *     as `getParentAccessLevel` computes) — never a second, fail-closed
 *     re-read that would turn a read error into `blocked` (FV-746).
 *   - "grace" only when no other provider is cleanly paid (Stripe
 *     `active`/`trialing`, or Apple `subscribed`).
 *
 * Payer-only: callers pass the payer id of a parent or adult_athlete, never a
 * minor athlete. Apple rows are read ONLY through the centralized accessor in
 * `./apple`.
 */
import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { subscriptionAccessLevel, type SubscriptionStatus } from "./access-level";
import { getAppleBillingIssueForPayer } from "./apple";
import { getActiveCompGrantSummary } from "./grants";

export type PayerBillingIssue =
  | null
  | {
      provider: "apple" | "stripe";
      stage: "grace" | "lapsed";
    };

export async function getPayerBillingIssue(
  payerId: string,
): Promise<PayerBillingIssue> {
  try {
    const service = createServiceClient();

    const grant = await getActiveCompGrantSummary(service, payerId);
    if (grant.readError || grant.active) return null;

    const { data: sub, error: subError } = await service
      .from("subscriptions")
      .select("status, cancel_at_period_end, current_period_end")
      .eq("parent_id", payerId)
      .maybeSingle();
    if (subError) {
      console.error(
        `[subscriptions/billing-issue] subscriptions read failed (payer=${payerId}):`,
        subError.message,
      );
      return null;
    }

    const apple = await getAppleBillingIssueForPayer(service, payerId);
    if (apple.readError) return null;

    const stripeStatus = sub?.status ?? null;
    const stripeCleanlyPaid =
      stripeStatus === "active" || stripeStatus === "trialing";
    const stripeGrace = stripeStatus === "past_due";

    if (
      (stripeGrace || apple.stage === "grace") &&
      !stripeCleanlyPaid &&
      !apple.cleanlyPaid
    ) {
      return { provider: stripeGrace ? "stripe" : "apple", stage: "grace" };
    }

    if (apple.stage === "lapsed") {
      // Same best-of the resolver computes when no read fails: Stripe level
      // (no row = blocked) vs Apple. Lapsed only when neither grants access.
      const stripeLevel = sub
        ? subscriptionAccessLevel(
            sub.status as SubscriptionStatus,
            sub.cancel_at_period_end,
            sub.current_period_end,
          )
        : "blocked";
      if (stripeLevel === "blocked" && !apple.grantsAccess) {
        return { provider: "apple", stage: "lapsed" };
      }
    }

    return null;
  } catch (err) {
    console.error(
      `[subscriptions/billing-issue] unexpected failure (payer=${payerId}):`,
      err instanceof Error ? err.message : "unknown error",
    );
    return null;
  }
}
