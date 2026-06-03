/**
 * Pure subscription-plan helpers.
 *
 * Intentionally NOT `server-only` and free of any server/Stripe/Supabase
 * imports, so it can be unit-tested (vitest node env) and imported from either
 * server or client code. The `"use server"` action module imports from here;
 * the reverse must never happen.
 */

export type SubscriptionPlan = "monthly" | "annual";

/**
 * Maps a plan to the env-var name holding its Stripe Price ID.
 * Keep in sync with the `z.enum(["monthly","annual"])` in the checkout action
 * and the `STRIPE_PRICE_ID_*` placeholders in `.env.example`.
 */
export function planToPriceEnvVar(plan: SubscriptionPlan): string {
  return plan === "monthly"
    ? "STRIPE_PRICE_ID_MONTHLY"
    : "STRIPE_PRICE_ID_ANNUAL";
}
