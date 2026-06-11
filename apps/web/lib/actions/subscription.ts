/**
 * Server action: Stripe Checkout session creation.
 *
 * Security contract:
 *   - requireParent() gates the action to a logged-in parent only. No athlete
 *     data ever touches Stripe. Only the parent UUID and price ID are passed.
 *   - The session carries `metadata: { parent_id }` and
 *     `subscription_data.metadata: { parent_id }` so the webhook handler can
 *     bind the Stripe Customer to the parent row on checkout.session.completed.
 *   - No PII in logs. Parent UUID and Stripe IDs (cus_*, price_*) are ok;
 *     names, emails, birthdates, journal content are never logged here.
 *   - `getStripe()` is server-only (enforced by `import "server-only"` in that
 *     module). This action file must never be imported from a Client Component.
 *
 * Customer reuse strategy:
 *   If the parent already has a `subscriptions` row with a `stripe_customer_id`,
 *   we pass `customer: <id>` to Checkout so Stripe links the new session to the
 *   existing Customer record. If no row exists yet, we pass
 *   `customer_creation: "always"` and let Stripe create the Customer; the
 *   webhook upserts the row on checkout.session.completed. We do NOT create a
 *   Customer ourselves here — Checkout does it, the webhook records it.
 *
 * 14-day free trial strategy:
 *   The trial is applied conditionally in code — NOT baked into the Stripe Price
 *   object — so we can enforce a one-trial-per-parent rule. A parent is
 *   trial-eligible if and only if they have NO `subscriptions` row at checkout
 *   time. The webhook writes the row when checkout.session.completed fires, so
 *   any subsequent checkout attempt (cancel-and-resubscribe, plan change) finds
 *   an existing row and receives no trial. We reuse the `existingSub` read
 *   (step 4) — no second DB query.
 *
 *   When trial-eligible:
 *     subscription_data.trial_period_days: 14
 *     payment_method_collection: "always"   ← card collected up front; auto-charges on day 14.
 *   When not eligible (row exists, any status): no trial fields emitted.
 *
 * redirect() position:
 *   `redirect()` from next/navigation throws a NEXT_REDIRECT error internally.
 *   It must NOT be called inside a try/catch block that could swallow it. The
 *   session URL is captured in a variable before the try block exits, then
 *   redirect() is called at the top level after all try/catch blocks complete.
 */

"use server";

import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { z } from "zod";

import { requireParent } from "@/lib/auth/guards";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { planToPriceEnvVar } from "@/lib/subscriptions/plans";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubscriptionActionState = { ok: false; error: string } | null;

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const CheckoutSchema = z.object({
  plan: z.enum(["monthly", "annual"], {
    message: "Choose a plan to continue.",
  }),
});

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function createCheckoutSession(
  _prev: SubscriptionActionState,
  formData: FormData,
): Promise<SubscriptionActionState> {
  // 1. Gate to authenticated parent. Redirects to /signin if not authed or
  //    if the caller is an athlete — never trust a client-passed parent_id.
  const { userId } = await requireParent();

  // 2. Validate plan selection.
  const parsed = CheckoutSchema.safeParse({ plan: formData.get("plan") });
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Choose a plan to continue.",
    };
  }
  const { plan } = parsed.data;

  // 3. Resolve the price ID from env. Both vars must be set before checkout
  //    can work; they are populated in .env.local by KC during Stripe setup.
  const envVar = planToPriceEnvVar(plan);
  const priceId = process.env[envVar];
  if (!priceId) {
    console.error(
      `[subscription.createCheckoutSession] ${envVar} is not set. ` +
        "Populate this env var before accepting subscriptions. " +
        "See .env.example for the full list of required Stripe vars.",
    );
    deliverInBackground(notifyError(
      "[subscription] Stripe price env var missing",
      `${envVar} is not set — checkout is broken`,
      { env_var: envVar, plan },
    ));
    return {
      ok: false,
      error:
        "Subscriptions aren't available right now. Please try again later.",
    };
  }

  // 4. Check for an existing subscription row on this parent.
  //    Uses the RLS-scoped client — the parent can only read their own row.
  //    This single read serves two purposes:
  //    (a) customer reuse: pass the existing Stripe customer ID if present.
  //    (b) trial eligibility: no row → first-time subscriber → trial offered.
  const supabase = createClient();
  const { data: existingSub, error: subReadError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("parent_id", userId)
    .maybeSingle();

  if (subReadError) {
    // Fail CLOSED: a transient read error must never grant a trial the
    // parent shouldn't have (qa finding, PR #185). Mirrors billing-portal's
    // handling — log + alert with opaque ids only, return a calm error.
    console.error(
      `[subscription.createCheckoutSession] subscriptions read failed (parent=${userId}): ${subReadError.message}`,
    );
    deliverInBackground(
      notifyError(
        "[checkout] subscriptions read failed",
        subReadError.message,
        { parent_id: userId },
      ),
    );
    return {
      ok: false,
      error: "Couldn't start checkout right now. Try again in a moment.",
    };
  }

  const existingCustomerId = existingSub?.stripe_customer_id ?? null;
  // Trial is ONLY offered when there is no existing row. If ANY row exists
  // (any status — active, canceled, trialing) the parent has already had a trial.
  const isTrialEligible = existingSub === null;

  // 5. Build site URL for success/cancel redirects.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // 6. Create the Stripe Checkout Session. Capture the URL in a variable so
  //    redirect() can be called after the try block (never inside it).
  let checkoutUrl: string;
  try {
    const stripe = getStripe();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // Required: the webhook reads session.metadata.parent_id to bind the
      // Stripe Customer to the parent row on checkout.session.completed.
      metadata: { parent_id: userId },
      // Belt-and-suspenders: also set on the subscription object itself so
      // subscription.* events also carry the parent_id if ever needed.
      subscription_data: { metadata: { parent_id: userId } },
      success_url: `${siteUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/subscribe?status=canceled`,
      allow_promotion_codes: true,
      // Convenience for Stripe dashboard filtering / audit.
      client_reference_id: userId,
    };

    // 14-day free trial — first-time subscribers only.
    // No row exists → isTrialEligible → add trial fields.
    // Row exists (any status) → no trial (prevents repeat trials on
    // cancel-and-resubscribe flows).
    if (isTrialEligible) {
      sessionParams.subscription_data = {
        ...sessionParams.subscription_data,
        trial_period_days: 14,
      };
      // Collect card up front so it auto-charges on day 14.
      sessionParams.payment_method_collection = "always";
    }

    // Customer reuse: pass the existing Stripe customer ID if present so
    // Checkout links to the existing record; otherwise let Checkout create one.
    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId;
    } else {
      sessionParams.customer_creation = "always";
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      console.error(
        "[subscription.createCheckoutSession] Stripe returned a session with no URL. " +
          `session_id="${session.id}"`,
      );
      deliverInBackground(notifyError(
        "[subscription] Stripe checkout session missing URL",
        "Stripe returned a checkout session with no URL",
        { session_id: session.id, plan },
      ));
      return {
        ok: false,
        error: "We couldn't start checkout. Please try again.",
      };
    }

    checkoutUrl = session.url;
  } catch (err) {
    // Log the Stripe error message for debugging; no PII in this log line.
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[subscription.createCheckoutSession] Stripe API call failed: ${message}`,
    );
    deliverInBackground(notifyError(
      "[subscription] Stripe API call failed",
      message,
      { plan },
    ));
    return {
      ok: false,
      error: "We couldn't start checkout. Please try again.",
    };
  }

  // 7. Redirect to Stripe Checkout. Called at the top level so NEXT_REDIRECT
  //    propagates correctly — never swallowed by the try/catch above.
  redirect(checkoutUrl);
}
