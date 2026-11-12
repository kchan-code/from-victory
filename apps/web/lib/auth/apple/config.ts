import "server-only";

import { timingSafeEqual } from "node:crypto";

// =============================================================================
// Apple sign-in configuration (FV-673, spec FV-569 §5.4).
//
// Nothing here logs. Secrets are read lazily so a missing value makes the
// routes refuse cleanly instead of crashing at import time.
// =============================================================================

export const APPLE_ISSUER = "https://appleid.apple.com";
export const APPLE_AUTHORIZE_URL = "https://appleid.apple.com/auth/authorize";
export const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
export const APPLE_REVOKE_URL = "https://appleid.apple.com/auth/revoke";
export const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";

/** Custom scheme the Android shell registers (hard-coded; never request-derived). */
export const ANDROID_CALLBACK_SCHEME_URL = "com.fromvictoryapp.app://auth/callback";

/**
 * Nonce-in-response rule (spec §5.4 binding rule 3).
 *
 * false (today): the redeemed `id_token`'s `nonce` must match whenever the
 *   response CARRIES a nonce; an absent nonce is tolerated.
 * true: an absent nonce also rejects. Flip this to `true` once gate S5 records
 *   that Apple returns the nonce on every flow (web, Android, iOS).
 */
export const APPLE_RESPONSE_NONCE_ALWAYS_REQUIRED = false;

/** Verifier mismatches that burn a handoff. */
export const HANDOFF_MAX_ATTEMPTS = 5;
/** Handoff lifetime. */
export const HANDOFF_TTL_MS = 3 * 60 * 1000;
/** Revoke attempts inline before giving up (deleteAccount / pending deletion). */
export const REVOKE_INLINE_ATTEMPTS = 3;
/** Failed purge-revoke runs before a handoff row is force-deleted + alerted. */
export const PURGE_MAX_REVOKE_ATTEMPTS = 5;

export type SsoSurface = "web" | "ios" | "android";
export type SsoLevel = "off" | "preview" | "on";

const SURFACE_ENV: Record<SsoSurface, string> = {
  web: "SSO_WEB",
  ios: "SSO_IOS",
  android: "SSO_ANDROID",
};

export function getSsoLevel(surface: SsoSurface): SsoLevel {
  const raw = (process.env[SURFACE_ENV[surface]] ?? "").trim().toLowerCase();
  return raw === "on" || raw === "preview" ? raw : "off";
}

/** Admin preview cookie (spec §3 "Flags"). Its value must equal SSO_PREVIEW_TOKEN. */
export const SSO_PREVIEW_COOKIE = "fv_sso_preview";

/** FV-674: the same constant-time token check, shared with the entry-point UI. */
export function isSsoPreviewCookieValid(cookieValue: string | undefined | null): boolean {
  return previewTokenMatches(cookieValue);
}

function previewTokenMatches(cookieValue: string | undefined | null): boolean {
  const expected = (process.env.SSO_PREVIEW_TOKEN ?? "").trim();
  const got = (cookieValue ?? "").trim();
  if (expected.length < 32 || got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

/**
 * Gate for STARTING a new Apple sign-in (start route, iOS native action).
 * `on` → allowed. `preview` → allowed only with the admin preview cookie
 * (spec §3), on any deployment, including the staging project whose Vercel
 * environment is "production". `off` → refused (rollback level 1, spec §13).
 */
export function isAppleSignInEntryAllowed(
  surface: SsoSurface,
  previewCookie: string | undefined | null,
): boolean {
  const level = getSsoLevel(surface);
  if (level === "on") return true;
  if (level === "preview") return previewTokenMatches(previewCookie);
  return false;
}

/**
 * Gate for CONTINUING a flow that the entry gate already admitted (Apple's
 * form_post callback, the Android handoff completion). Apple's cross-site
 * POST does not carry the Lax preview cookie, so these check only that the
 * surface is not `off`; the single-use state/handoff binding is what ties
 * them to an admitted start. Revoke, purge and deletion code is NEVER gated.
 */
export function isAppleSignInEnabled(surface: SsoSurface): boolean {
  return getSsoLevel(surface) !== "off";
}

/** Client (aud) expected for a flow: Services ID on web/Android, bundle ID on iOS. */
export function expectedClientId(surface: SsoSurface): string | null {
  if (surface === "ios") {
    return (process.env.APPLE_BUNDLE_ID ?? "").trim() || "com.fromvictoryapp.app";
  }
  return (process.env.APPLE_SERVICES_ID ?? "").trim() || null;
}

export type AppleSigningConfig = {
  teamId: string;
  keyId: string;
  privateKeyPem: string;
};

/** Returns null when any signing secret is missing (callers refuse cleanly). */
export function getAppleSigningConfig(): AppleSigningConfig | null {
  const teamId = (process.env.APPLE_TEAM_ID ?? "").trim();
  const keyId = (process.env.APPLE_KEY_ID ?? "").trim();
  // Env UIs often store the PEM with literal "\n"; normalise.
  const pem = (process.env.APPLE_SIGNIN_P8 ?? "").replace(/\\n/g, "\n").trim();
  if (!teamId || !keyId || !pem) return null;
  return { teamId, keyId, privateKeyPem: pem };
}

export function isAppleServerConfigured(surface: SsoSurface): boolean {
  return (
    getAppleSigningConfig() !== null &&
    expectedClientId(surface) !== null &&
    Boolean(process.env.APPLE_TOKEN_KEY)
  );
}
