import "server-only";

import { cookies } from "next/headers";

import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { signDeviceValue, verifyDeviceValue } from "./device-cookie";

/**
 * Device-pairing cookie. Binds a physical device (browser) to a single
 * athlete account so that subsequent /signin visits can show
 * "Welcome back, Jordan" + password-only instead of an email field.
 *
 * Important: this cookie is NOT auth. It only tells the UI which sign-in
 * form to render. Real authentication is the Supabase session cookies
 * managed by @supabase/ssr. The cookie value is HMAC-SHA256 signed
 * (FV-13) so a forged or legacy unsigned cookie is rejected by
 * verifyDeviceValue() and yields null, preventing an unsigned cookie
 * from being used to trigger the service-role athlete name lookup in
 * /signin. Legacy unsigned cookies degrade gracefully to the parent
 * sign-in form without any error.
 *
 * Cookie naming:
 *   Production (HTTPS):  __Host-fv_device_athlete_id
 *     The __Host- prefix requires Secure + Path=/ + no Domain attribute,
 *     giving the strongest same-origin binding available in the browser.
 *   Development (HTTP):  fv_device_athlete_id
 *     __Host- is rejected on non-HTTPS, so the plain name is used here.
 *
 * clearDeviceAthleteId() deletes BOTH names so a legacy plain-name cookie
 * is cleaned up when the athlete signs out or forgets the device.
 */

// ---------------------------------------------------------------------------
// Cookie names
// ---------------------------------------------------------------------------

/** Used in production (HTTPS). __Host- prefix requires Secure + Path=/ + no Domain. */
const COOKIE_NAME_PROD = "__Host-fv_device_athlete_id";

/** Used in development (HTTP) and as the legacy name to clear on sign-out. */
const COOKIE_NAME_DEV = "fv_device_athlete_id";

const COOKIE_NAME =
  process.env.NODE_ENV === "production" ? COOKIE_NAME_PROD : COOKIE_NAME_DEV;

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// ---------------------------------------------------------------------------
// Secret resolver
// ---------------------------------------------------------------------------

/**
 * Dev fallback — used ONLY when NODE_ENV !== 'production' and
 * DEVICE_COOKIE_HMAC_SECRET is unset. Clearly marked so it is never mistaken
 * for a real secret. In production, the absence of the env var is treated as a
 * configuration error and degrades safely (no cookie written or trusted).
 */
const DEV_FALLBACK_SECRET = "dev-only-device-cookie-hmac-secret-not-for-prod";

function resolveSecret(): string | null {
  const envSecret = process.env.DEVICE_COOKIE_HMAC_SECRET;
  if (envSecret) return envSecret;

  if (process.env.NODE_ENV !== "production") {
    return DEV_FALLBACK_SECRET;
  }

  // Production with no secret configured — log loudly and degrade.
  console.error(
    "[device.resolveSecret] DEVICE_COOKIE_HMAC_SECRET is not set in production. " +
      "Device-pairing cookies cannot be signed or verified. " +
      "Athletes will see the generic parent sign-in form until this is configured.",
  );
  deliverInBackground(notifyError(
    "device-cookie.missing-secret",
    "DEVICE_COOKIE_HMAC_SECRET is not set in production",
    { node_env: process.env.NODE_ENV ?? "unknown" },
  ));
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the verified athleteId from the device-pairing cookie, or null.
 *
 * Read order: production __Host- name first, then plain dev/legacy name.
 * The raw value is passed through verifyDeviceValue() — only an HMAC-valid
 * signed value returns a non-null id. An unsigned legacy cookie (bare UUID,
 * no `.` separator) silently returns null and the caller falls through to the
 * generic parent sign-in form.
 */
export function getDeviceAthleteId(): string | null {
  const secret = resolveSecret();
  if (!secret) return null;

  const store = cookies();
  const raw =
    store.get(COOKIE_NAME_PROD)?.value ?? store.get(COOKIE_NAME_DEV)?.value;

  return verifyDeviceValue(raw, secret);
}

/**
 * Signs `athleteId` and writes it to the device-pairing cookie.
 *
 * In production: writes under __Host-fv_device_athlete_id (Secure, no Domain).
 * In development: writes under the plain fv_device_athlete_id name.
 *
 * If the secret is unavailable in production, the cookie is NOT written (to
 * prevent an unsigned value being trusted later). Real Supabase-session auth
 * is unaffected; the athlete just won't get the "Welcome back" convenience.
 *
 * __Host- requirements satisfied:
 *   - httpOnly: true (XSS protection; JS cannot read it)
 *   - secure: true in production (required by __Host-)
 *   - sameSite: "lax"
 *   - path: "/" (required by __Host-)
 *   - NO domain attribute (required by __Host-)
 */
export function setDeviceAthleteId(athleteId: string): void {
  const secret = resolveSecret();
  if (!secret) return; // Degrade: no cookie written in prod without secret.

  const store = cookies();
  const isProduction = process.env.NODE_ENV === "production";

  store.set(COOKIE_NAME, signDeviceValue(athleteId, secret), {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
    // NO `domain` attribute — required for __Host- prefix in production.
  });
}

/**
 * Deletes the device-pairing cookie.
 *
 * Deletes BOTH the __Host- production name and the plain dev/legacy name so
 * that a cookie written before FV-13 (or in a different environment) is also
 * cleared on sign-out / forgetDevice.
 */
export function clearDeviceAthleteId(): void {
  const store = cookies();
  store.delete(COOKIE_NAME_PROD);
  store.delete(COOKIE_NAME_DEV);
}
