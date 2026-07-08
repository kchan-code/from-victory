/**
 * Server actions: Stripe Checkout session creation.
 *
 * Two entry points share the same core checkout logic (startSubscriptionCheckout):
 *
 *   createCheckoutSession      — parent buyer; quantity = number of linked athletes
 *   createAdultCheckoutSession — adult_athlete (18+ self-serve); quantity always 1
 *
 * Payer-key semantics:
 *   `subscriptions.parent_id` is the canonical payer foreign key for BOTH flows.
 *   For a parent it is the parent's profile id. For an adult_athlete it is the
 *   adult's own profile id. The webhook reads session.metadata.parent_id to bind
 *   the Stripe Customer to the correct subscriptions row.
 *
 * Security contract:
 *   - requireParent() / requireSelfPayer() gate each action to the correct role.
 *     No athlete data ever touches Stripe. Only the account UUID and price ID
 *     are passed.
 *   - The session carries `metadata: { parent_id }` and
 *     `subscription_data.metadata: { parent_id }` so the webhook handler can
 *     bind the Stripe Customer on checkout.session.completed.
 *   - No PII in logs. Account UUID and Stripe IDs (cus_*, price_*) are ok;
 *     names, emails, birthdates, journal content are never logged here.
 *   - `getStripe()` is server-only (enforced by `import "server-only"` in that
 *     module). This action file must never be imported from a Client Component.
 *
 * Customer reuse strategy:
 *   If the account already has a `subscriptions` row with a `stripe_customer_id`,
 *   we pass `customer: <id>` to Checkout so Stripe links the new session to the
 *   existing Customer record. If no row exists yet, we pass no customer params and
 *   let Checkout create the Customer; the webhook upserts the row on
 *   checkout.session.completed. We do NOT create a Customer ourselves here —
 *   Checkout does it, the webhook records it.
 *
 * 14-day free trial strategy:
 *   The trial is applied conditionally in code — NOT baked into the Stripe Price
 *   object — so we can enforce a one-trial-per-account rule. An account is
 *   trial-eligible if and only if they have NO `subscriptions` row at checkout
 *   time. The webhook writes the row when checkout.session.completed fires, so
 *   any subsequent checkout attempt (cancel-and-resubscribe, plan change) finds
 *   an existing row and receives no trial. We reuse the `existingSub` read —
 *   no second DB query.
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
 *
 * First-touch UTM attribution (FV-396):
 *   If the client wrote a `fv_attribution` cookie (see
 *   components/marketing/AttributionCapture.tsx) on an earlier visit to a
 *   public marketing page, we read + defensively sanitize it here
 *   (lib/attribution.ts) and fold the present utm_* fields + `landed_at`
 *   into BOTH `metadata` and `subscription_data.metadata`, alongside
 *   `parent_id`. A missing or malformed cookie silently yields no
 *   attribution fields — checkout is never blocked or altered by this.
 */

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { z } from "zod";

import {
  ATTRIBUTION_COOKIE_NAME,
  parseAttributionCookieValue,
  type Attribution,
} from "@/lib/attribution";
import { requireParent, requireSelfPayer } from "@/lib/auth/guards";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { planToPriceEnvVar } from "@/lib/subscriptions/plans";

// ---------------------------------------------------------------------------
// First-touch UTM attribution (FV-396)
// ---------------------------------------------------------------------------

/**
 * Reads the fv_attribution cookie (set client-side by
 * components/marketing/AttributionCapture.tsx on a public marketing page)
 * and returns a sanitized attribution payload, or an empty object.
 *
 * Defensive by design: the cookie is client-writable, so a malformed or
 * tampered value must never throw or block checkout — it's silently
 * ignored (sanitizeAttribution / parseAttributionCookieValue already
 * never throw; this wrapper adds one more belt-and-suspenders try/catch
 * around the cookies() read itself).
 */
function readAttributionFromCookie(): Attribution {
  try {
    const value = cookies().get(ATTRIBUTION_COOKIE_NAME)?.value;
    return parseAttributionCookieValue(value);
  } catch {
    return {};
  }
}

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
// Shared core — called by both parent and adult checkout actions
// ---------------------------------------------------------------------------

/**
 * Core Stripe checkout session creation. Called by createCheckoutSession (parent)
 * and createAdultCheckoutSession (adult_athlete) with the resolved accountId and
 * quantity. Reads subscriptions keyed on accountId for customer reuse and trial
 * eligibility; never reads parent_athlete_links (the caller handles that).
 */
async function startSubscriptionCheckout(
  accountId: string,
  quantity: number,
  plan: "monthly" | "annual",
): Promise<SubscriptionActionState> {
  // 3. Resolve the price ID from env. Both vars must be set before checkout
  //    can work; they are populated in .env.local by KC during Stripe setup.
  const envVar = planToPriceEnvVar(plan);
  const priceId = process.env[envVar];
  if (!priceId) {
    console.error(
      `[subscription.startSubscriptionCheckout] ${envVar} is not set. ` +
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

  // 4. Check for an existing subscription row on this account.
  //
  //    Uses the RLS-scoped client — the account can only read their own rows.
  //    The subscription read serves two purposes:
  //    (a) customer reuse: pass the existing Stripe customer ID if present.
  //    (b) trial eligibility: no row → first-time subscriber → trial offered.
  const supabase = createClient();

  const { data: existingSub, error: subReadError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("parent_id", accountId)
    .maybeSingle();

  if (subReadError) {
    // Fail CLOSED: a transient read error must never grant a trial the
    // account shouldn't have (qa finding, PR #185). Log + alert with opaque
    // ids only, return a calm error.
    console.error(
      `[subscription.startSubscriptionCheckout] subscriptions read failed (account=${accountId}): ${subReadError.message}`,
    );
    deliverInBackground(
      notifyError(
        "[checkout] subscriptions read failed",
        subReadError.message,
        { parent_id: accountId },
      ),
    );
    return {
      ok: false,
      error: "Couldn't start checkout right now. Try again in a moment.",
    };
  }

  const existingCustomerId = existingSub?.stripe_customer_id ?? null;
  // Trial is ONLY offered when there is no existing row. If ANY row exists
  // (any status — active, canceled, trialing) the account has already had a trial.
  const isTrialEligible = existingSub === null;

  // 5. Build site URL for success/cancel redirects.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // First-touch UTM attribution (FV-396) — read + sanitize the
  // fv_attribution cookie (if any) so "where did they come from" rides
  // along on the Stripe objects. Absent/malformed cookie → empty object →
  // no attribution fields added; checkout proceeds unaffected either way.
  const attribution = readAttributionFromCookie();
  // Metadata values must be strings; Attribution's fields already are, so
  // this is just a type-narrowing spread (no undefined keys survive).
  const attributionMetadata: Record<string, string> = { ...attribution };

  // 6. Create the Stripe Checkout Session. Capture the URL in a variable so
  //    redirect() can be called after the try block (never inside it).
  let checkoutUrl: string;
  try {
    const stripe = getStripe();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity }],
      // Required: the webhook reads session.metadata.parent_id to bind the
      // Stripe Customer to the account row on checkout.session.completed.
      // Also carries first-touch UTM attribution (FV-396), if present.
      // parent_id AFTER the spread: the cookie-derived fields are
      // whitelisted, but parent_id must win no matter what.
      metadata: { ...attributionMetadata, parent_id: accountId },
      // Belt-and-suspenders: also set on the subscription object itself so
      // subscription.* events also carry the parent_id (and attribution)
      // if ever needed.
      subscription_data: {
        metadata: { ...attributionMetadata, parent_id: accountId },
      },
      success_url: `${siteUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/subscribe?status=canceled`,
      allow_promotion_codes: true,
      // Convenience for Stripe dashboard filtering / audit.
      client_reference_id: accountId,
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
    }
    // No `else`: in subscription mode Checkout ALWAYS creates a Customer, and
    // Stripe rejects the `customer_creation` param outright ("only valid in
    // payment mode") — the first live API call failed on it (hotfix, FV-217).
    // The webhook binds the created Customer to the account via metadata.

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      console.error(
        "[subscription.startSubscriptionCheckout] Stripe returned a session with no URL. " +
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
      `[subscription.startSubscriptionCheckout] Stripe API call failed: ${message}`,
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

// ---------------------------------------------------------------------------
// Parent checkout action (existing — behavior unchanged)
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

  // Read linked athlete count to drive checkout quantity for graduated pricing.
  //   quantity 1  → first-athlete price tier ($5/mo | $49/yr)
  //   quantity 2+ → additional athletes at the graduated tier ($3/mo | $29/yr)
  // Floor at 1: a parent with 0 linked athletes still buys at least 1 seat.
  const supabase = createClient();
  const athleteCountResult = await supabase
    .from("parent_athlete_links")
    .select("athlete_id", { count: "exact", head: true })
    .eq("parent_id", userId);

  const quantity = athleteCountResult.error
    ? 1
    : Math.max(athleteCountResult.count ?? 0, 1);

  if (athleteCountResult.error) {
    console.warn(
      `[subscription.createCheckoutSession] athlete count read failed (parent=${userId}): ${athleteCountResult.error.message} — defaulting quantity to 1`,
    );
  }

  return startSubscriptionCheckout(userId, quantity, plan);
}

// ---------------------------------------------------------------------------
// Adult self-serve checkout action (FV-327)
// ---------------------------------------------------------------------------

/**
 * Stripe Checkout for an 18+ adult_athlete account (FV-327).
 * The adult is BOTH the payer and the athlete — quantity is always 1
 * (no athlete count query; no syncAthleteQuantity). The subscriptions row
 * is keyed on the adult's own profile id (same parent_id column as parents).
 */
export async function createAdultCheckoutSession(
  _prev: SubscriptionActionState,
  formData: FormData,
): Promise<SubscriptionActionState> {
  // 1. Gate to authenticated adult_athlete. Redirects to /signin if not
  //    authed or if the caller is a parent or minor athlete.
  const { userId } = await requireSelfPayer();

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

  // Adults always buy exactly 1 seat — no athlete roster, no count query.
  return startSubscriptionCheckout(userId, 1, plan);
}
