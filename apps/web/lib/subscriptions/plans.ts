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

/**
 * Maps a Stripe Price ID to a human-readable plan label.
 *
 * Reads env vars at call time (server-side server action / Server Component
 * context) so the function itself stays pure and testable — callers that
 * want a resolved label pass the env var values they've already read.
 *
 * Returns "Monthly" or "Annual" when the price ID matches a known env var;
 * "Subscription" as a safe fallback if the price ID is unrecognised or the
 * env vars aren't set yet (pre-Stripe-setup state).
 *
 * @param priceId    The `price_id` column value from the subscriptions row.
 * @param monthlyId  Value of STRIPE_PRICE_ID_MONTHLY (may be undefined).
 * @param annualId   Value of STRIPE_PRICE_ID_ANNUAL  (may be undefined).
 */
export function priceIdToLabel(
  priceId: string | null | undefined,
  monthlyId: string | undefined,
  annualId: string | undefined,
): string {
  if (!priceId) return "Subscription";
  if (monthlyId && priceId === monthlyId) return "Monthly";
  if (annualId && priceId === annualId) return "Annual";
  return "Subscription";
}
