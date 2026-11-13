/**
 * FV-727 — whether the Vercel Analytics script may mount.
 *
 * The route allowlist (allowed-routes.ts) is necessary but not sufficient.
 * /privacy and /terms are public marketing pages AND linked from in-app
 * Settings, so a decision that looks only at the path loads the script for
 * a signed-in minor and inside the store apps.
 *
 * This module is pure (no React, no next/headers) so the matrix is unit
 * tested directly. The server resolves `nativeShell` and `session` once
 * per request; the client mount re-checks on navigation via `usePathname`.
 */

import { isAllowedAnalyticsPath } from "./allowed-routes";

/**
 * - `signed-out` — no session. Marketing allowlist applies.
 * - `minor` — signed-in profile role `athlete` (parent-managed, 13–17).
 * - `non-minor` — signed-in `parent` or `adult_athlete` (18+).
 * - `unresolved` — a session cookie is present but the role could not be
 *   confirmed. Fail closed: do not mount.
 */
export type AnalyticsSession =
  | "signed-out"
  | "minor"
  | "non-minor"
  | "unresolved";

export type AnalyticsViewer = {
  /** Request User-Agent is any native store shell (legacy, ios-iap, play). */
  nativeShell: boolean;
  session: AnalyticsSession;
};

/** Supabase SSR session cookie, including chunked `.0`, `.1`, … names. */
const SUPABASE_AUTH_COOKIE = /^sb-[a-z0-9-]+-auth-token(?:\.\d+)?$/i;

/**
 * True when `names` includes a Supabase auth session cookie.
 * The PKCE code-verifier cookie (`…-auth-token-code-verifier`) does not
 * match: it exists before a session does.
 */
export function hasSupabaseAuthSessionCookie(names: readonly string[]): boolean {
  return names.some((name) => SUPABASE_AUTH_COOKIE.test(name));
}

const NON_MINOR_ROLES: ReadonlySet<string> = new Set([
  "parent",
  "adult_athlete",
]);

/**
 * Map a verified session to the analytics audience.
 * `hasSessionUser` false → signed out, even if a stale cookie was present.
 * A verified user with a missing, empty, or unrecognized role is
 * `unresolved` (fail closed) rather than treated as signed out.
 */
export function classifyAnalyticsSession(input: {
  hasSessionUser: boolean;
  role: string | null;
}): AnalyticsSession {
  if (!input.hasSessionUser) return "signed-out";
  if (input.role === "athlete") return "minor";
  if (input.role !== null && NON_MINOR_ROLES.has(input.role)) return "non-minor";
  return "unresolved";
}

/**
 * Mount Vercel Analytics only for a signed-out or non-minor browser visitor
 * on an allowlisted marketing path. Native shells and signed-in minors
 * never mount, on any route. An unresolved session never mounts.
 */
export function shouldMountAnalytics(
  pathname: string,
  viewer: AnalyticsViewer,
): boolean {
  if (viewer.nativeShell) return false;
  if (viewer.session === "minor" || viewer.session === "unresolved") return false;
  return isAllowedAnalyticsPath(pathname);
}
