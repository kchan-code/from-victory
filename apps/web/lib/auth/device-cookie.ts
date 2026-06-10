/**
 * Pure HMAC helpers for the device-pairing cookie (FV-13).
 *
 * Intentionally NOT marked `server-only` and has NO dependency on Next.js or
 * env vars so this module is trivially testable in vitest/node.
 *
 * The secret is injected by the caller (device.ts reads it from env and passes
 * it in), keeping these functions dependency-free and unit-testable.
 *
 * Algorithm: HMAC-SHA256 with a domain-separated input to prevent cross-context
 * signature reuse. Output is base64url (no padding) to survive URL/cookie encoding.
 */

import { createHmac, timingSafeEqual } from "crypto";

// ---------------------------------------------------------------------------
// Domain separator — keeps this cookie's signatures separate from any future
// HMAC-signed values in the same codebase.
// ---------------------------------------------------------------------------
const DOMAIN = "fv_device_athlete_id";

/**
 * Produces a signed cookie value: `${athleteId}.${sig}` where
 * `sig = base64url(HMAC_SHA256(secret, "fv_device_athlete_id:" + athleteId))`.
 *
 * The domain-separated HMAC input ensures a signature produced for one cookie
 * type cannot be transplanted to another.
 */
export function signDeviceValue(athleteId: string, secret: string): string {
  const sig = createHmac("sha256", secret)
    .update(`${DOMAIN}:${athleteId}`)
    .digest("base64url");
  return `${athleteId}.${sig}`;
}

/**
 * Verifies a signed cookie value and returns the verified athleteId, or null
 * on any failure.
 *
 * Returns null for:
 *   - undefined / null / empty input (missing cookie)
 *   - legacy unsigned bare-UUID (no `.` separator) — graceful degrade for
 *     cookies written before FV-13; these fall through to the parent sign-in
 *     form without any error or migration prompt.
 *   - malformed input (empty id segment, empty sig segment)
 *   - wrong secret (wrong environment or rotated key)
 *   - tampered id or signature
 *
 * Uses `timingSafeEqual` for the byte comparison so a valid-length signature
 * is checked in constant time (no early-exit on the first mismatching byte).
 * A length mismatch returns null without comparing — the only signal that
 * leaks is "is the signature the right length?", which for a valid HMAC-SHA256
 * is a fixed 43 base64url chars. That is an accepted limitation for a non-auth
 * convenience cookie (worst case: the wrong sign-in form is shown).
 */
export function verifyDeviceValue(
  raw: string | undefined | null,
  secret: string,
): string | null {
  if (!raw) return null;

  const dotIndex = raw.indexOf(".");
  if (dotIndex === -1) {
    // Legacy unsigned bare-UUID (no `.`) — degrade gracefully to null.
    return null;
  }

  const athleteId = raw.slice(0, dotIndex);
  const receivedSig = raw.slice(dotIndex + 1);

  if (!athleteId || !receivedSig) {
    // Malformed: empty id or empty sig segment.
    return null;
  }

  const expectedSig = createHmac("sha256", secret)
    .update(`${DOMAIN}:${athleteId}`)
    .digest("base64url");

  // timingSafeEqual throws on mismatched buffer sizes, so guard length first.
  // A wrong-length signature can never be valid (a real HMAC-SHA256 base64url
  // digest is always 43 chars), so returning null here is correct; the
  // constant-time comparison below covers the right-length case.
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  const receivedBuf = Buffer.from(receivedSig, "utf8");

  if (expectedBuf.length !== receivedBuf.length) {
    return null;
  }

  const valid = timingSafeEqual(expectedBuf, receivedBuf);
  return valid ? athleteId : null;
}
