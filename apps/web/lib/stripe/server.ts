/**
 * Server-only Stripe client singleton.
 *
 * NEVER import this file from a Client Component or any file that can be
 * bundled for the browser. The `STRIPE_SECRET_KEY` env var has no
 * `NEXT_PUBLIC_` prefix so it won't be inlined by Next.js, but the explicit
 * `server-only` guard below throws at import time if this module somehow ends
 * up in a client bundle (e.g. via an accidental import chain).
 *
 * Allowed callers: server actions, route handlers, server-only utilities.
 */
import "server-only";

import Stripe from "stripe";

/**
 * Outbound `Stripe-Version` header for API requests this process makes
 * (Checkout, retrieve, cancel, quantity updates).
 *
 * stripe@22 types `LatestApiVersion` as only the SDK pin (`2026-07-29.dahlia`).
 * Runtime still honors an older pin: the constructor copies `apiVersion` onto
 * the request header. Keep `2024-06-20` until FV-473 migrates request +
 * Dashboard webhook endpoint versions together.
 *
 * Webhook *payload* shapes are NOT controlled by this pin — they follow the
 * API version configured on the Stripe Dashboard webhook endpoint.
 */
const STRIPE_API_VERSION = "2024-06-20";

let _stripe: Stripe | null = null;

/**
 * Returns the Stripe client singleton. Lazily initialized so that the module
 * can be imported at build time without crashing when `STRIPE_SECRET_KEY` is
 * not yet set. The key is validated at first USE, not at module load.
 *
 * Throws if `STRIPE_SECRET_KEY` is absent at call time (during actual request
 * handling). Groundwork phase: the key is a placeholder — the lazy pattern
 * ensures the build does not break before keys are provisioned.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "[stripe/server] STRIPE_SECRET_KEY is not set. " +
        "Populate this env var before making Stripe API calls. " +
        "See .env.example for the full list of required Stripe vars.",
    );
  }

  _stripe = new Stripe(secretKey, {
    // stripe@22's StripeConfig.apiVersion only types the SDK pin; runtime
    // still sends whatever string we pass as Stripe-Version.
    apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
    // Identify our platform in Stripe dashboard logs.
    appInfo: {
      name: "From Victory",
      version: "0.1.0",
    },
    // Disable telemetry to avoid unexpected outbound traffic in tests.
    telemetry: false,
  });

  return _stripe;
}

/**
 * Test-only: clear the cached singleton so the next getStripe() rebuilds.
 * Lets route/integration tests exercise the lazy-init path deterministically.
 *
 * Guarded so a stray import can never clear the live Stripe client singleton in
 * a production code path: throws unless running under the test environment
 * (`NODE_ENV === "test"` or Vitest's `VITEST` flag).
 */
export function __resetStripeForTests(): void {
  if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
    throw new Error(
      "[stripe/server] __resetStripeForTests() is a test-only hook and must " +
        "never be invoked outside the test environment (NODE_ENV=test).",
    );
  }
  _stripe = null;
}
