// Shared constants for the Apple web / Android route handlers. Not
// "server-only" so route tests can import it without extra mocks.

export const APPLE_STATE_COOKIE = "__Host-fv_apple_state";
export const APPLE_NONCE_COOKIE = "__Host-fv_apple_nonce";
export const APPLE_CHALLENGE_COOKIE = "__Host-fv_apple_challenge";
export const APPLE_COOKIE_NAMES = [
  APPLE_STATE_COOKIE,
  APPLE_NONCE_COOKIE,
  APPLE_CHALLENGE_COOKIE,
] as const;

/**
 * `__Host-` cookies must be Secure, Path=/, no Domain. SameSite=None is
 * required because Apple's form_post is a cross-site POST that must still
 * carry them. 10 minutes; consumed (cleared) on every callback outcome.
 */
export function appleCookieOptions(maxAge = 600) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    path: "/",
    maxAge,
  };
}

export function appleRedirectUri(base: string): string {
  return `${base.replace(/\/$/, "")}/auth/apple/callback`;
}
