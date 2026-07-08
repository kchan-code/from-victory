/**
 * First-touch UTM attribution (FV-396).
 *
 * Pure helpers shared by the client capture component
 * (components/marketing/AttributionCapture.tsx) and the Stripe checkout
 * server action (lib/actions/subscription.ts). Kept dependency-free (no
 * "use client" / "use server" / next/headers imports) so it is safe to
 * import from either side and to unit-test in isolation.
 *
 * Privacy contract: only the five UTM strings + a landed_at timestamp are
 * ever captured. No identifiers, no PII, no free-text beyond the UTM query
 * values themselves (and those are sanitized — see sanitizeAttribution).
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Name of the first-party attribution cookie. */
export const ATTRIBUTION_COOKIE_NAME = "fv_attribution";

/** 90 days, in seconds — used as the cookie's max-age. */
export const ATTRIBUTION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

/** The only UTM query-param keys we ever read or persist. */
export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

/** Every key the sanitized/stored attribution payload may contain. */
export type AttributionField = UtmKey | "landed_at";

/** Sanitized attribution payload — only known keys, only strings. */
export type Attribution = Partial<Record<UtmKey, string>> & {
  landed_at?: string;
};

/**
 * Public marketing routes eligible for first-touch capture. Deny by
 * default — any pathname not in this set is ignored by the capture
 * component. Athlete/parent app surfaces (/athlete, /dashboard, /pair,
 * /signin, /signup, /subscribe, etc.) are intentionally excluded.
 */
export const ATTRIBUTION_ELIGIBLE_PATHS: readonly string[] = [
  "/",
  "/pricing",
  "/parents",
  "/teams",
  "/about",
  "/contact",
  "/resources",
  "/privacy",
  "/terms",
];

/** Max length (chars) retained per attribution field value. */
const MAX_FIELD_LENGTH = 100;

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Accepts anything URLSearchParams-shaped (URLSearchParams itself, or a
 * plain object of string values) and pulls out only the known UTM keys
 * that are present and non-empty. Returns an empty object if none present.
 */
export function parseUtmParams(
  searchParams: URLSearchParams | Record<string, string | null | undefined>,
): Partial<Record<UtmKey, string>> {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const value = searchParams[key];
    return typeof value === "string" ? value : null;
  };

  const result: Partial<Record<UtmKey, string>> = {};
  for (const key of UTM_KEYS) {
    const value = get(key);
    if (typeof value === "string" && value.length > 0) {
      result[key] = value;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

/**
 * Strips non-printable/control characters and truncates a single field
 * value to MAX_FIELD_LENGTH. Printable = basic Latin printable range plus
 * common Unicode letters/symbols; we conservatively strip C0/C1 control
 * characters and DEL, which is enough to prevent header/cookie injection
 * and log-noise without being overly aggressive about legitimate UTM
 * values (e.g. accented characters, emoji in campaign names).
 */
function sanitizeValue(value: string): string {
  const stripped = value.replace(/\p{Cc}/gu, "");
  return stripped.slice(0, MAX_FIELD_LENGTH);
}

/**
 * Defensively parses + sanitizes an arbitrary value that is *supposed* to
 * be an Attribution payload (e.g. JSON.parse'd from a cookie, which is
 * client-writable and therefore untrusted). Never throws — malformed or
 * unexpected input yields an empty object.
 *
 * Behavior:
 *   - Drops any key that isn't a known UTM key or "landed_at".
 *   - Drops any value that isn't a non-empty string.
 *   - Truncates + strips control characters from each retained value.
 *   - landed_at is additionally validated as a parseable ISO date string;
 *     an invalid timestamp is dropped rather than passed through.
 */
export function sanitizeAttribution(raw: unknown): Attribution {
  if (typeof raw !== "object" || raw === null) return {};

  const input = raw as Record<string, unknown>;
  const result: Attribution = {};

  for (const key of UTM_KEYS) {
    const value = input[key];
    if (typeof value === "string" && value.length > 0) {
      const clean = sanitizeValue(value);
      if (clean.length > 0) {
        result[key] = clean;
      }
    }
  }

  const landedAt = input.landed_at;
  if (typeof landedAt === "string" && landedAt.length > 0) {
    const clean = sanitizeValue(landedAt);
    const parsed = new Date(clean);
    if (!Number.isNaN(parsed.getTime())) {
      result.landed_at = clean;
    }
  }

  return result;
}

/** True if the given pathname is one of the public marketing routes. */
export function isAttributionEligiblePath(pathname: string): boolean {
  return ATTRIBUTION_ELIGIBLE_PATHS.includes(pathname);
}

/** True if a parsed/sanitized attribution payload has at least one UTM field. */
export function hasUtmFields(attribution: Attribution): boolean {
  return UTM_KEYS.some((key) => typeof attribution[key] === "string");
}

/**
 * Defensively parses a raw cookie string value (JSON) into a sanitized
 * Attribution object. Never throws — malformed JSON or unexpected shape
 * yields an empty object, which callers should treat as "no attribution".
 */
export function parseAttributionCookieValue(value: string | undefined | null): Attribution {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return sanitizeAttribution(parsed);
  } catch {
    return {};
  }
}
