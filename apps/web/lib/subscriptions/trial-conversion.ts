/**
 * Trial-to-family explicit-confirmation support (FV-586, KC decision D3,
 * 2026-09-17): adding an athlete during the 7-day one-athlete Stripe FREE
 * TRIAL (FV-574) requires EXPLICIT parent confirmation that ENDS the trial
 * and STARTS the paid family plan IMMEDIATELY. We never silently charge or
 * convert a trial. The 7-day/1-athlete trial and its existing promised
 * terms (FV-574 AC2 grandfathering, etc.) are otherwise unchanged.
 *
 * This module supplies the READ-SIDE building blocks the confirmation flow
 * needs:
 *   - `getTrialConversionState`  — "is this payer's add about to silently
 *     convert a trial?" Consulted by `createAthlete` (lib/actions/
 *     athletes.ts) BEFORE any write, and by the frontend to decide whether
 *     to render the confirming control at all.
 *   - `getTrialConversionQuote`  — the live disclosure numbers ("you'll be
 *     charged $X today, then $Y every month") for the confirming control.
 *     Stripe-only; Apple has no equivalent quote (see below).
 *
 * The WRITE side (actually calling `stripe.subscriptions.update` with
 * `trial_end: "now"`) lives in `lib/actions/athletes.ts`'s `createAthlete`
 * guard, not here — this module never mutates Stripe or the database.
 *
 * PROVIDER SCOPE:
 *   - Stripe: fully supported. `subscriptions.status === "trialing"` with a
 *     `stripe_subscription_id` is unambiguous trial state we can read
 *     directly.
 *   - Apple: our server can NEVER end an Apple trial or charge the payer —
 *     Apple owns that state entirely. The ONLY mechanism to add athletes to
 *     an Apple-billed family mid-cycle is the parent purchasing a
 *     higher-capacity product through Apple's OWN purchase sheet (which
 *     Apple itself treats as the explicit confirmation). So `kind: "apple"`
 *     here is a coarse "this payer is on the Apple provider" signal, NOT a
 *     trial-specific one — we cannot reliably read Apple trial-ness at all,
 *     and the caller doesn't need to: the existing Apple athlete-capacity
 *     gate (`./apple-capacity`'s `assertAthleteCapacity`) already stops an
 *     over-ceiling add, and the FV-581/584 duplicate-purchase guard (see
 *     `./apple-capacity`'s `isStrictAppleCapacityUpgrade` and
 *     `lib/actions/apple-subscription.ts`'s `beginApplePurchase`) is what
 *     lets an Apple payer buy their way to a higher capacity. Callers must
 *     NOT treat `kind: "apple"` as "needs Stripe-style confirmation" — it's
 *     informational only.
 *
 * FAIL-CLOSED CONTRACT: any DB read error resolves to `{ kind: "unknown" }`
 * — never thrown, never defaulted to `"not_trialing"`. `createAthlete`'s
 * guard treats `"unknown"` as "refuse the add" (`trial_conversion_required`)
 * exactly like an un-confirmed trial-crossing add: a read failure must never
 * let a silent conversion slip through undetected.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { Database } from "@/lib/supabase/types";

import { getStripe } from "@/lib/stripe/server";
import { getActiveAppleProductId } from "./apple";

type ServiceClient = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// getTrialConversionState
// ---------------------------------------------------------------------------

export type TrialConversionState =
  | { kind: "not_trialing" }
  | {
      kind: "stripe_trial";
      stripeSubscriptionId: string;
      /** Athlete count BEFORE this add (mirrors assertAthleteCapacity's
       * caller-supplied-count shape elsewhere in this codebase). */
      currentAthleteCount: number;
      /** Stripe's `current_period_end` mirror column — during `trialing`
       * this equals the trial's `trial_end`. Null if not yet synced by the
       * webhook (should not happen for a row already `trialing`, but the
       * column is nullable in the schema). */
      trialEndsAt: string | null;
    }
  | { kind: "apple" }
  | { kind: "unknown" };

/**
 * Resolves whether `payerId` is presently on a Stripe trial that an athlete
 * add would silently convert, per D3 (see module doc).
 *
 * Read-only — performs no writes. Fail-closed: any Supabase read error
 * resolves to `{ kind: "unknown" }` (see module doc).
 *
 * @param service Service-role Supabase client.
 * @param payerId UUID of the payer's profile row (parent only — adult_athlete
 *                self-serve never adds athletes, so this is never called for
 *                that role in practice; callers are expected to have already
 *                role-gated to a parent).
 */
export async function getTrialConversionState(
  service: ServiceClient,
  payerId: string,
): Promise<TrialConversionState> {
  const { data: sub, error: subError } = await service
    .from("subscriptions")
    .select("status, stripe_subscription_id, current_period_end")
    .eq("parent_id", payerId)
    .maybeSingle();

  if (subError) {
    console.error(
      `[subscriptions/trial-conversion] subscriptions read failed (payer=${payerId}): ${subError.message}`,
    );
    return { kind: "unknown" };
  }

  if (sub && sub.status === "trialing" && sub.stripe_subscription_id) {
    const { count, error: countError } = await service
      .from("parent_athlete_links")
      .select("athlete_id", { count: "exact", head: true })
      .eq("parent_id", payerId);

    if (countError) {
      console.error(
        `[subscriptions/trial-conversion] athlete count read failed (payer=${payerId}): ${countError.message}`,
      );
      return { kind: "unknown" };
    }

    return {
      kind: "stripe_trial",
      stripeSubscriptionId: sub.stripe_subscription_id,
      currentAthleteCount: count ?? 0,
      trialEndsAt: sub.current_period_end,
    };
  }

  // Not a Stripe trial (no row, or a row in some other status — active,
  // canceled, past_due, etc.). Check whether this payer is on the Apple
  // provider at all — informational only, see module doc.
  const appleProductId = await getActiveAppleProductId(service, payerId);
  if (appleProductId !== null) {
    return { kind: "apple" };
  }

  return { kind: "not_trialing" };
}

// ---------------------------------------------------------------------------
// getTrialConversionQuote
// ---------------------------------------------------------------------------

export type TrialConversionQuote =
  | {
      quoteUnavailable: false;
      currency: string;
      interval: "month" | "year";
      /** The subscription item's quantity today (before conversion). */
      currentQuantity: number;
      /** currentAthleteCount + 1 — the quantity Stripe will bill going
       * forward once the trial ends and this add is confirmed. */
      nextQuantity: number;
      /** The total Stripe will charge TODAY the moment the parent confirms
       * (trial_end: "now" + quantity bump in one Stripe call), computed
       * deterministically from the Price's `billing_scheme` — see
       * `computeTotalDueTodayCents` below. Never a guess: if the scheme,
       * tiers_mode, or tier data can't be resolved deterministically, the
       * whole quote is `quoteUnavailable: true` instead. */
      totalDueTodayCents: number;
      /** True when the subscription has Stripe Tax enabled
       * (`automatic_tax.enabled`), so the confirming control can append
       * "plus applicable tax" instead of implying `totalDueTodayCents` is
       * the final, tax-inclusive charge. */
      taxMayApply: boolean;
      /** Plain-language renewal cadence for the confirming control's copy. */
      nextRenewalLabel: string;
      /** Which Stripe billing scheme produced `totalDueTodayCents`, in case
       * the caller wants scheme-aware copy (e.g. showing the per-additional-
       * athlete rate for "graduated"). */
      billingScheme: "per_unit" | "graduated" | "volume";
    }
  | { quoteUnavailable: true };

/**
 * Resolves a Stripe Price tier's per-unit amount in cents, preferring the
 * integer field and falling back to parsing the decimal-string field.
 * Returns null if neither is present/parseable — the tier can't be quoted.
 */
function tierUnitAmountCents(tier: Stripe.Price.Tier): number | null {
  if (tier.unit_amount != null) return tier.unit_amount;
  if (tier.unit_amount_decimal != null) {
    const parsed = Number(tier.unit_amount_decimal);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }
  return null;
}

/**
 * Resolves a Stripe Price tier's flat amount in cents. Unlike
 * `tierUnitAmountCents`, a tier legitimately has NO flat fee — both fields
 * null means 0, not "unknown". Only an unparseable decimal string is
 * treated as a failure.
 */
function tierFlatAmountCents(tier: Stripe.Price.Tier): number | null {
  if (tier.flat_amount != null) return tier.flat_amount;
  if (tier.flat_amount_decimal != null) {
    const parsed = Number(tier.flat_amount_decimal);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }
  return 0;
}

/**
 * Sums a `tiers_mode: "graduated"` Price's total for `nextQuantity`: each
 * tier in ascending `up_to` order covers the units from just after the
 * previous tier's ceiling through its own ceiling (the last tier's
 * `up_to` is `null` = unbounded), charged at that tier's `unit_amount`
 * per unit plus its `flat_amount` once, for every tier actually reached.
 */
function computeGraduatedTotalCents(
  tiers: Stripe.Price.Tier[],
  nextQuantity: number,
): number | null {
  let total = 0;
  let previousUpTo = 0;
  for (const tier of tiers) {
    if (previousUpTo >= nextQuantity) break;
    const tierUpTo = tier.up_to; // null = unbounded (last tier)
    const rangeEnd = tierUpTo === null ? nextQuantity : Math.min(tierUpTo, nextQuantity);
    const unitsInTier = rangeEnd - previousUpTo;
    if (unitsInTier > 0) {
      const unitAmount = tierUnitAmountCents(tier);
      const flatAmount = tierFlatAmountCents(tier);
      if (unitAmount == null || flatAmount == null) return null;
      total += unitAmount * unitsInTier + flatAmount;
    }
    previousUpTo = tierUpTo === null ? nextQuantity : tierUpTo;
  }
  return total;
}

/**
 * Resolves a `tiers_mode: "volume"` Price's total for `nextQuantity`: the
 * single tier whose ceiling (`up_to`, ascending, `null` = unbounded) first
 * reaches `nextQuantity` prices EVERY unit — `unit_amount * nextQuantity +
 * flat_amount`.
 */
function computeVolumeTotalCents(
  tiers: Stripe.Price.Tier[],
  nextQuantity: number,
): number | null {
  for (const tier of tiers) {
    const tierUpTo = tier.up_to;
    if (tierUpTo === null || nextQuantity <= tierUpTo) {
      const unitAmount = tierUnitAmountCents(tier);
      const flatAmount = tierFlatAmountCents(tier);
      if (unitAmount == null || flatAmount == null) return null;
      return unitAmount * nextQuantity + flatAmount;
    }
  }
  return null; // no tier's ceiling reaches nextQuantity — malformed tiers
}

/**
 * Deterministically computes the total Stripe will charge today for
 * `nextQuantity` units of `price`, per its `billing_scheme`. Returns null
 * (never a guess) whenever the scheme, `tiers_mode`, or tier/amount data
 * can't be resolved — the caller degrades to `quoteUnavailable: true`.
 */
function computeTotalDueTodayCents(
  price: Stripe.Price,
  nextQuantity: number,
): { billingScheme: "per_unit" | "graduated" | "volume"; totalDueTodayCents: number } | null {
  if (price.billing_scheme === "per_unit") {
    const unitAmount = priceUnitAmountCents(price);
    if (unitAmount == null) return null;
    return { billingScheme: "per_unit", totalDueTodayCents: unitAmount * nextQuantity };
  }

  if (price.billing_scheme === "tiered") {
    if (!price.tiers || price.tiers.length === 0) return null;
    // Defensive: Stripe returns tiers in ascending `up_to` order in practice,
    // but both helpers below depend on that ordering, so sort a copy (null
    // `up_to` = unbounded top tier) rather than trust the wire order.
    const tiers = [...price.tiers].sort(
      (a, b) => (a.up_to ?? Number.POSITIVE_INFINITY) - (b.up_to ?? Number.POSITIVE_INFINITY),
    );

    if (price.tiers_mode === "graduated") {
      const total = computeGraduatedTotalCents(tiers, nextQuantity);
      return total == null ? null : { billingScheme: "graduated", totalDueTodayCents: total };
    }
    if (price.tiers_mode === "volume") {
      const total = computeVolumeTotalCents(tiers, nextQuantity);
      return total == null ? null : { billingScheme: "volume", totalDueTodayCents: total };
    }
    return null; // unknown/absent tiers_mode — refuse to guess
  }

  return null; // unknown billing_scheme — refuse to guess
}

/** Same integer-preferred/decimal-fallback resolution as
 * `tierUnitAmountCents`, but for a plain `per_unit` Price's own
 * `unit_amount`/`unit_amount_decimal` fields (not a tier's). */
function priceUnitAmountCents(price: Stripe.Price): number | null {
  if (price.unit_amount != null) return price.unit_amount;
  if (price.unit_amount_decimal != null) {
    const parsed = Number(price.unit_amount_decimal);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }
  return null;
}

/**
 * Builds the live disclosure numbers for the trial-to-family confirming
 * control: "ends your trial now; charges $X today; renews at $X every
 * month/year going forward."
 *
 * Stripe-only (see module doc for why Apple has no equivalent quote —
 * Apple's OWN purchase sheet shows Apple's own price disclosure).
 *
 * TIERED/GRADUATED PRICING: the real From Victory Price object bills
 * quantity 1 at the first-athlete rate and quantity 2+ at a graduated
 * per-additional-athlete rate configured on the Price itself (see
 * `lib/stripe/sync-athlete-quantity.ts`'s module doc) — i.e.
 * `billing_scheme: "tiered"`, `tiers_mode: "graduated"`, not `"per_unit"`.
 * Stripe's `price.tiers` (only present when the Price is retrieved with
 * `expand: ["items.data.price.tiers"]`) make the per-quantity total
 * deterministic — `computeTotalDueTodayCents` above sums across tiers in
 * ascending `up_to` order rather than guessing. `tiers_mode: "volume"` is
 * also supported (single matching tier prices every unit). Any scheme this
 * function can't resolve deterministically (missing tiers, an unrecognized
 * `billing_scheme`/`tiers_mode`, or an interval other than month/year)
 * returns `{ quoteUnavailable: true }` instead of a wrong number — the
 * caller falls back to non-numeric confirmation copy ("you'll be charged
 * today at your plan's rate").
 *
 * Fail-safe: any read/API failure (no subscription row, Stripe API error,
 * missing item, unresolvable pricing) returns `{ quoteUnavailable: true }`
 * rather than throwing — a missing quote degrades the confirming control's
 * copy, it never blocks or corrupts the conversion decision itself (that's
 * `getTrialConversionState`'s job).
 *
 * @param service Service-role Supabase client.
 * @param payerId UUID of the payer's profile row.
 */
export async function getTrialConversionQuote(
  service: ServiceClient,
  payerId: string,
): Promise<TrialConversionQuote> {
  const { data: sub, error: subError } = await service
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("parent_id", payerId)
    .maybeSingle();

  if (subError || !sub?.stripe_subscription_id) {
    if (subError) {
      console.error(
        `[subscriptions/trial-conversion] getTrialConversionQuote: subscriptions read failed (payer=${payerId}): ${subError.message}`,
      );
    }
    return { quoteUnavailable: true };
  }

  const { count, error: countError } = await service
    .from("parent_athlete_links")
    .select("athlete_id", { count: "exact", head: true })
    .eq("parent_id", payerId);

  if (countError) {
    console.error(
      `[subscriptions/trial-conversion] getTrialConversionQuote: athlete count read failed (payer=${payerId}): ${countError.message}`,
    );
    return { quoteUnavailable: true };
  }
  const currentAthleteCount = count ?? 0;

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    console.error(
      `[subscriptions/trial-conversion] getTrialConversionQuote: Stripe not configured: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return { quoteUnavailable: true };
  }

  let stripeSub;
  try {
    stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id, {
      // "items.data.price.tiers" is required to get Stripe's `Price.tiers`
      // array back at all — it's omitted by default even when the price
      // itself is expanded. Keep the plain price expansion too so
      // `item.price` is the full object rather than just an id.
      expand: ["items.data.price", "items.data.price.tiers"],
    });
  } catch (err) {
    console.error(
      `[subscriptions/trial-conversion] getTrialConversionQuote: subscriptions.retrieve failed (payer=${payerId}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return { quoteUnavailable: true };
  }

  const item = stripeSub.items.data[0];
  const price = item?.price;
  if (!item || !price) {
    console.warn(
      `[subscriptions/trial-conversion] getTrialConversionQuote: no subscription item/price found (payer=${payerId})`,
    );
    return { quoteUnavailable: true };
  }

  const rawInterval = price.recurring?.interval;
  if (rawInterval !== "month" && rawInterval !== "year") {
    return { quoteUnavailable: true };
  }
  // Stripe's `Recurring.Interval` type includes a forward-compat `OtherString`
  // catch-all alongside the literal union, so TS can't narrow the `!==`
  // check above on its own — the runtime check just above is the actual
  // guarantee; this cast just tells TS what we already verified.
  const interval = rawInterval as "month" | "year";

  const currentQuantity = item.quantity ?? currentAthleteCount;
  const nextQuantity = currentAthleteCount + 1;

  // Tiered/graduated pricing is the real production shape (see module doc
  // above `computeTotalDueTodayCents`) — this refuses to guess whenever the
  // scheme, tiers_mode, or tier data can't be resolved deterministically.
  const totalDue = computeTotalDueTodayCents(price, nextQuantity);
  if (totalDue == null) {
    return { quoteUnavailable: true };
  }

  const taxMayApply = stripeSub.automatic_tax?.enabled === true;

  return {
    quoteUnavailable: false,
    currency: price.currency,
    interval,
    currentQuantity,
    nextQuantity,
    totalDueTodayCents: totalDue.totalDueTodayCents,
    taxMayApply,
    nextRenewalLabel: interval === "month" ? "every month" : "every year",
    billingScheme: totalDue.billingScheme,
  };
}
