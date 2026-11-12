/**
 * Shared Stripe `Stripe-Version` pin.
 *
 * Extracted from `lib/stripe/server.ts` (FV-590) so that a plain Node script
 * (e.g. `scripts/stripe-test-clock-d3.ts`) can import the SAME pin without
 * importing `lib/stripe/server.ts` itself — that module starts with
 * `import "server-only"`, and the `server-only` package's default export
 * unconditionally throws when required/imported outside a bundler's
 * `react-server`/browser condition (i.e. it throws immediately under plain
 * `node --experimental-strip-types ...`). This file has no such guard: it is
 * a bare string constant, safe to import from server code, client code (it
 * is not a secret), or a standalone script.
 *
 * `lib/stripe/server.ts` re-exports nothing new here — it imports this
 * constant instead of declaring its own copy, so there is exactly one place
 * that sets the API version and both call sites can never drift apart.
 *
 * stripe@22 types `Stripe.LatestApiVersion` as only the SDK's own pin
 * (`2026-07-29.dahlia`). Runtime still honors an older pin: the constructor
 * copies whatever string we pass as `apiVersion` onto the outbound
 * `Stripe-Version` request header. Keep `2024-06-20` until FV-473 migrates
 * request + Dashboard webhook endpoint versions together.
 *
 * Webhook *payload* shapes are NOT controlled by this pin — they follow the
 * API version configured on the Stripe Dashboard webhook endpoint.
 */
export const STRIPE_API_VERSION = "2024-06-20";
