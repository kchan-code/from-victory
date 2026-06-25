import "server-only";

/**
 * Server-side feature flags. Tiny + explicit, mirroring the
 * isSubscriptionGatingEnforced() pattern in lib/subscriptions/enforce.ts.
 * server-only so an accidental client import fails loudly rather than silently
 * reading `undefined` (these env vars carry no NEXT_PUBLIC_ prefix).
 */

/**
 * ENABLE_ADULT_SIGNUP — gates the entire 18+ self-serve signup path: the entry
 * link on /signup, the /signup/athlete route, and the signUpAdultAthlete action.
 * OFF unless the env var is exactly "true". Adult self-serve must not be exposed
 * until the pre-ENABLE gating clears (attorney sign-off + adult-aware
 * enforcement / paused-state copy) — see FV-328 / FV-329.
 */
export function isAdultSignupEnabled(): boolean {
  return process.env.ENABLE_ADULT_SIGNUP === "true";
}
