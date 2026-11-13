/**
 * FV-727 — whether the Vercel Analytics script may mount.
 *
 * The route allowlist (allowed-routes.ts) is necessary but not sufficient.
 * /privacy and /terms are public marketing pages AND linked from in-app
 * Settings, so a decision that looks only at the path loads the script for
 * a signed-in minor and inside the store apps.
 *
 * This module is pure (no React, no next/headers) so the matrix is unit
 * tested directly. The client mount re-checks the path on navigation and
 * re-resolves the session whenever Supabase auth state changes.
 */

import { isAllowedAnalyticsPath } from "./allowed-routes";

/**
 * - `signed-out` — no session. Marketing allowlist applies.
 * - `minor` — signed-in profile role `athlete` (parent-managed, 13–17).
 * - `non-minor` — signed-in `parent` or `adult_athlete` (18+).
 * - `unresolved` — a cookie or client session is present but the user was
 *   not verified, or the role could not be confirmed. Fail closed: do not
 *   mount. This includes getUser() returning an error or a null user while
 *   an auth cookie is still present.
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
 * Call this only after getUser() returned a user. A cookie with no verified
 * user is `unresolved`, not signed-out — that decision lives in
 * `resolveAnalyticsViewer`. A verified user with a missing, empty, or
 * unrecognized role is also `unresolved`.
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

/** Same token as lib/native-shell.ts. The (ios) and (play) markers contain it. */
const NATIVE_SHELL_UA_TOKEN = "FVNativeShell/1";

/** True for every store shell (legacy, ios-iap, android-play). */
export function isAnalyticsNativeShell(userAgent: string | null | undefined): boolean {
  return (userAgent ?? "").includes(NATIVE_SHELL_UA_TOKEN);
}

export type AnalyticsAuthLookup = {
  userId: string | null;
  /** getUser() returned an error or threw before this result was built. */
  error: boolean;
  role: string | null;
  roleError: boolean;
};

/**
 * Fail closed unless the visitor is a confirmed signed-out browser or a
 * confirmed non-minor (parent / adult_athlete). A native shell never
 * mounts. A cookie or in-memory session whose getUser() errors or returns
 * no user is `unresolved` — analytics stays off.
 */
export async function resolveAnalyticsViewer(input: {
  userAgent: string | null | undefined;
  cookieNames: readonly string[];
  /** True when the auth client already handed us a session object. */
  sessionPresent: boolean;
  lookup: () => Promise<AnalyticsAuthLookup>;
}): Promise<AnalyticsViewer> {
  if (isAnalyticsNativeShell(input.userAgent)) {
    return { nativeShell: true, session: "unresolved" };
  }

  const hasCookie = hasSupabaseAuthSessionCookie(input.cookieNames);
  if (!hasCookie && !input.sessionPresent) {
    return { nativeShell: false, session: "signed-out" };
  }

  try {
    const result = await input.lookup();
    if (result.error || result.userId === null || result.roleError) {
      return { nativeShell: false, session: "unresolved" };
    }
    return {
      nativeShell: false,
      session: classifyAnalyticsSession({
        hasSessionUser: true,
        role: result.role,
      }),
    };
  } catch {
    return { nativeShell: false, session: "unresolved" };
  }
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
