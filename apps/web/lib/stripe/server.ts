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

// Stripe API version pinned to the version shipped with stripe@16.x.
// Bump only with a deliberate review of changelog breaking changes — do not let
// the SDK silently choose a version.
// The `LatestApiVersion` type in stripe@16.12.0 is '2024-06-20'.
const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2024-06-20";

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
    apiVersion: STRIPE_API_VERSION,
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
