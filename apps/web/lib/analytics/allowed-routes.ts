/**
 * FV-395 — Vercel Web Analytics route allowlist.
 *
 * Analytics on this app is scoped STRICTLY to public marketing surfaces.
 * Athletes (13-17) must see ZERO analytics on any signed-in or
 * athlete-reachable route. This module is DENY BY DEFAULT: an unknown or
 * newly-added route emits nothing unless it is explicitly added below.
 *
 * Kept as a pure, dependency-free module (no "use client", no React, no
 * @vercel/analytics import) so it's trivially unit-testable and so the
 * allowlist is reviewable in one place without digging through the
 * Analytics mount component.
 */

/** Paths that must match exactly (no sub-path tracking). */
const ALLOWED_EXACT_PATHS: readonly string[] = ["/"];

/**
 * Path prefixes that are allowed, including any sub-path (e.g. article
 * slugs under /resources/<slug>). A prefix match requires either an exact
 * match on the prefix itself or the next character to be "/", so
 * "/pricing" does not accidentally allow "/pricing-secret".
 */
const ALLOWED_PREFIXES: readonly string[] = [
  "/pricing",
  "/parents",
  "/teams",
  "/about",
  "/contact",
  "/resources",
  "/privacy",
  "/terms",
  "/pregame-ritual-christian-athlete",
  "/christian-athlete-apps",
];

/**
 * Returns true only for public marketing pathnames explicitly on the
 * allowlist. Everything else — including any future route not yet added
 * here — is denied by default. This is what guarantees /athlete,
 * /dashboard, /pair, /signup, /signin, /subscribe, and any signed-in
 * surface stay silent even if a new route is added elsewhere and someone
 * forgets to update this file.
 */
export function isAllowedAnalyticsPath(pathname: string): boolean {
  // Strip query string / hash defensively — callers should already pass a
  // bare pathname, but analytics event URLs are an external contract.
  const path = pathname.split("?")[0]?.split("#")[0] ?? "";

  if (ALLOWED_EXACT_PATHS.includes(path)) {
    return true;
  }

  return ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * Minimal shape this module depends on from @vercel/analytics's
 * BeforeSendEvent — kept local so this file has zero import from the
 * analytics package (pure + trivially testable, no client-only code).
 */
export interface AnalyticsPathEvent {
  url: string;
}

/**
 * Vercel's BeforeSendEvent.url is a FULL URL ("https://site.com/pricing?x=1"),
 * not a bare pathname — extract the pathname before matching, or the
 * allowlist (which matches on leading "/") would drop every event.
 * Falls back to the raw string for non-URL input (e.g. bare pathnames).
 */
function toPathname(url: string): string {
  try {
    return new URL(url, "http://localhost").pathname;
  } catch {
    return url;
  }
}

/**
 * beforeSend filter for @vercel/analytics. Pure and deterministic: reads
 * event.url synchronously and returns the event unchanged when the path is
 * on the public-marketing allowlist, or null to drop it entirely.
 *
 * No PII or identifiers are read or attached here — pageview URL only.
 */
export function filterAnalyticsEvent<T extends AnalyticsPathEvent>(
  event: T,
): T | null {
  return isAllowedAnalyticsPath(toPathname(event.url)) ? event : null;
}
