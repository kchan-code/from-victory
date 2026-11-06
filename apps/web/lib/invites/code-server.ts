import "server-only";

import { createHash, randomBytes } from "crypto";

import { INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH } from "./code";

/**
 * Generate a canonical readable invite code from the CSPRNG (FV-630).
 *
 * 32-symbol alphabet and 256 possible byte values: `byte & 31` maps bytes to
 * symbols with zero modulo bias (256 is an exact multiple of 32).
 */
export function generateInviteCode(): string {
  let out = "";
  for (const byte of randomBytes(INVITE_CODE_LENGTH)) {
    out += INVITE_CODE_ALPHABET.charAt(byte & 31);
  }
  return out;
}

/**
 * sha256 hex of a code for storage/lookup. Same at-rest model as the legacy
 * pairing code (FV-177): the raw code is never written to the DB or logs.
 *
 * Callers pass the CANONICAL readable code (normalizeInviteCode) or, for the
 * legacy /pair flow, the raw base64url code exactly as issued. The two input
 * namespaces cannot collide (16 Crockford symbols vs 32 base64url chars).
 */
export function hashInviteCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
