/**
 * Server action: Stripe Billing Portal session creation.
 *
 * Security contract:
 *   - requireSubscriber() gates this action to a logged-in payer — a parent
 *     OR an adult_athlete (FV-440, 18+ self-serve). A minor athlete session
 *     is rejected. subscriptions.parent_id is the payer-account id for
 *     either role (see the FV-325 migration comment on that column).
 *   - The Stripe customer ID is read server-side from the payer's own
 *     subscriptions row (RLS-scoped client — only their own row is readable).
 *     It NEVER reaches the client.
 *   - `getStripe()` is server-only (enforced by `import "server-only"` in that
 *     module). This file must never be imported from a Client Component.
 *
 * redirect() position:
 *   `redirect()` from next/navigation throws a NEXT_REDIRECT error internally.
 *   It must NOT be called inside a try/catch that could swallow it. Capture the
 *   portal URL before the try/catch exits, then call redirect() at the top
 *   level — identical to the pattern in lib/actions/subscription.ts.
 *
 * Degradation:
 *   (a) No subscription row → returns { ok: false, code: "no_subscription" }.
 *   (b) billingPortal.sessions.create throws (e.g. portal not yet configured
 *       in the Stripe dashboard) → returns { ok: false, code: "portal_unavailable" }.
 *   The UI maps these codes to calm, non-crashing messages (never a 500).
 */

"use server";

import { redirect } from "next/navigation";

import { requireSubscriber } from "@/lib/auth/guards";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BillingPortalActionState =
  | { ok: false; code: "no_subscription" | "portal_unavailable"; error: string }
  | null;

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function openBillingPortal(
  _prev: BillingPortalActionState,
  _formData: FormData,
): Promise<BillingPortalActionState> {
  // 1. Gate to an authenticated payer — a parent OR an adult_athlete (FV-440).
  //    Redirects to /signin if not authed or if the caller is a minor
  //    athlete. Never trust a client-passed parent_id.
  const { userId, profile } = await requireSubscriber();

  // 2. Read the payer's subscription row via the RLS-scoped client.
  //    The payer can only read their own row; the Stripe customer ID stays
  //    server-side and is never returned to the caller.
  const supabase = createClient();
  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("parent_id", userId)
    .maybeSingle();

  if (subError) {
    console.error(
      `[billing-portal.openBillingPortal] subscription read failed (parent=${userId}): ${subError.message}`,
    );
    deliverInBackground(
      notifyError(
        "[billing-portal] subscription read failed",
        subError.message,
        { parent_id: userId },
      ),
    );
    return {
      ok: false,
      code: "portal_unavailable",
      error:
        "Billing management is temporarily unavailable — contact support.",
    };
  }

  if (!sub?.stripe_customer_id) {
    // Payer has no subscription row or no Stripe customer yet.
    return {
      ok: false,
      code: "no_subscription",
      error: "No active subscription found.",
    };
  }

  // 3. Build return_url. The payer lands back on their own settings page
  //    after managing their subscription in the portal — a parent returns to
  //    the parent dashboard settings, an adult_athlete (FV-440) returns to
  //    their athlete settings page. The fallback is the canonical production
  //    URL (same pattern as lib/actions/auth.ts) so a missing env var never
  //    strands a payer on localhost after a billing action.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fromvictoryapp.com";
  const returnPath =
    profile.role === "adult_athlete" ? "/athlete/settings" : "/dashboard/settings";
  const returnUrl = `${siteUrl}${returnPath}`;

  // 4. Create the Stripe Billing Portal session. Capture the URL before the
  //    try block exits so redirect() is never called inside a catch.
  let portalUrl: string;
  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: returnUrl,
    });
    portalUrl = session.url;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[billing-portal.openBillingPortal] billingPortal.sessions.create failed (parent=${userId}): ${message}`,
    );
    deliverInBackground(
      notifyError(
        "[billing-portal] portal session create failed",
        message,
        { parent_id: userId },
      ),
    );
    return {
      ok: false,
      code: "portal_unavailable",
      error:
        "Billing management is temporarily unavailable — contact support.",
    };
  }

  // 5. Redirect to the Stripe Billing Portal. Called at the top level so
  //    NEXT_REDIRECT propagates correctly — never swallowed by the try/catch.
  redirect(portalUrl);
}
