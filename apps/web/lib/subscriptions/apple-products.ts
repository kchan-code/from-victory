/**
 * apple-products.ts — client-safe Apple IAP product configuration (FV-572).
 *
 * WHY THIS EXISTS
 * ----------------
 * `AppleSubscribeSection` (components/subscribe/AppleSubscribeSection.tsx)
 * needs to know which App Store Connect products it may offer, WITHOUT ever
 * hardcoding a product id into the shipped bundle. App Store Connect product
 * ids and pricing are release-held, App-Store-Connect-config-time decisions
 * (docs/fv210-ios-iap-decision-record.md Section 4.6, Open Item P2) — no
 * agent, this file included, may invent a real-looking id and present it as
 * if it were live. So the product list is entirely INJECTED via the
 * `NEXT_PUBLIC_APPLE_PRODUCTS` build-time env var, parsed defensively, with
 * an EMPTY array as the safe, correct default.
 *
 * SHIPPED STATE: `NEXT_PUBLIC_APPLE_PRODUCTS` is unset today. That means
 * `getConfiguredAppleProducts()` returns `[]` in production right now, and
 * `AppleSubscribeSection` renders its neutral "not available yet" state.
 * This is intentional — the purchase surface goes live purely by setting
 * this env var once App Store Connect config + KC's P2 pricing decision
 * land, with NO code change and NO redeploy of this file required.
 *
 * FORMAT
 * ------
 * A JSON array of objects:
 *   [{ "productId": "...", "athleteCapacity": 1, "displayName": "..." }]
 *
 *   - `productId`       (required, non-empty string) — the App Store Connect
 *                        product identifier, passed verbatim to
 *                        `FVAppleIAPPlugin.getProducts` / `.purchase`.
 *   - `athleteCapacity` (required, positive integer) — PRESENTATIONAL ONLY.
 *                        Used to label a card ("up to 3 athletes"), nothing
 *                        more. The real entitlement ceiling for a purchased
 *                        product is resolved server-side, from
 *                        `lib/subscriptions/apple-capacity.ts`'s
 *                        `APPLE_PRODUCT_CAPACITY` map — that map, not this
 *                        field, is the single source of truth for how many
 *                        athlete seats a purchase actually grants. Do not
 *                        wire this field into any capacity/gating decision.
 *   - `displayName`     (optional string) — fallback label shown until/unless
 *                        `FVAppleIAPPlugin.getProducts` returns a localized
 *                        `displayName` from StoreKit for the same product id.
 *
 * NEVER hardcode a real Apple product id in this file or anywhere else in
 * production code — see the header above. Tests use obviously-fake ids
 * (e.g. "test.fv.tier1.monthly").
 *
 * Any malformed shape — absent env var, invalid JSON, non-array JSON, or an
 * array entry missing a required field / wrong type — is dropped (per-entry
 * for array-entry issues; the whole value for a non-array/unparseable value)
 * and logged with `console.warn`, never thrown. A misconfigured env var must
 * never crash the subscribe page — it must always degrade to the safe empty
 * (not-available) state.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppleProductConfig {
  productId: string;
  /** Presentational label only — see file header. Never a gating value. */
  athleteCapacity: number;
  displayName?: string;
}

// ---------------------------------------------------------------------------
// Defensive parsing
// ---------------------------------------------------------------------------

function isValidProductConfig(value: unknown): value is AppleProductConfig {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.productId !== "string" ||
    candidate.productId.trim().length === 0
  ) {
    return false;
  }

  if (
    typeof candidate.athleteCapacity !== "number" ||
    !Number.isInteger(candidate.athleteCapacity) ||
    candidate.athleteCapacity < 1
  ) {
    return false;
  }

  if (
    candidate.displayName !== undefined &&
    typeof candidate.displayName !== "string"
  ) {
    return false;
  }

  return true;
}

/**
 * Parses and validates `NEXT_PUBLIC_APPLE_PRODUCTS`. Never throws.
 *
 * NOTE: the env var is read via a literal `process.env.NEXT_PUBLIC_...`
 * expression (not a dynamic/bracket lookup) so Next.js's build-time
 * inlining can statically replace it in the client bundle — a dynamic
 * `process.env[name]` lookup would not be inlined and would read `undefined`
 * in the browser.
 */
export function getConfiguredAppleProducts(): AppleProductConfig[] {
  const raw = process.env.NEXT_PUBLIC_APPLE_PRODUCTS;
  if (raw === undefined || raw.trim().length === 0) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(
      "[apple-products] NEXT_PUBLIC_APPLE_PRODUCTS is not valid JSON — treating as unconfigured (no products offered).",
    );
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.warn(
      "[apple-products] NEXT_PUBLIC_APPLE_PRODUCTS did not parse to an array — treating as unconfigured (no products offered).",
    );
    return [];
  }

  const valid = parsed.filter(isValidProductConfig);
  if (valid.length !== parsed.length) {
    console.warn(
      `[apple-products] NEXT_PUBLIC_APPLE_PRODUCTS dropped ${
        parsed.length - valid.length
      } malformed entr${parsed.length - valid.length === 1 ? "y" : "ies"} (missing/invalid productId, athleteCapacity, or displayName).`,
    );
  }

  return valid;
}
