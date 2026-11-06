/**
 * Readable athlete invite codes (FV-630) — PURE helpers, safe in client and
 * server bundles (no crypto, no I/O). Generation and hashing live in
 * ./code-server.ts.
 *
 * Shape: 16 symbols from Crockford's base32 alphabet, shown as four groups of
 * four ("7KQ2-M9XD-4HTR-PW3B"). 16 × 5 bits = 80 bits of CSPRNG entropy.
 *
 * Why 80 bits (not shorter): the code is a password-setting bearer token and
 * we store only sha256(code) at rest (FV-177 model). 80 bits keeps an offline
 * brute force against a leaked hash infeasible without adding a server-side
 * pepper secret; the online path is additionally rate-limited, single-use,
 * and expiring.
 *
 * Crockford's alphabet drops I, L, O and U so a code read aloud or typed from
 * a text is hard to get wrong. Normalization forgives the classic mix-ups
 * (O→0, I/L→1), case, spaces and hyphens.
 */

export const INVITE_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const INVITE_CODE_LENGTH = 16;
const GROUP = 4;

const CANONICAL_RE = /^[0-9A-HJKMNP-TV-Z]{16}$/;

/**
 * Normalize user/URL input to the canonical 16-symbol form, or null if it
 * cannot be a readable invite code. Never throws.
 */
export function normalizeInviteCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  // Bound the work before any regex on attacker-supplied input.
  if (input.length > 64) return null;
  const compact = input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  return CANONICAL_RE.test(compact) ? compact : null;
}

/** True when `input` normalizes to a readable invite code. */
export function isReadableInviteCode(input: unknown): boolean {
  return normalizeInviteCode(input) !== null;
}

/** "7KQ2M9XD4HTRPW3B" → "7KQ2-M9XD-4HTR-PW3B". Input must be canonical. */
export function formatInviteCode(canonical: string): string {
  const groups: string[] = [];
  for (let i = 0; i < canonical.length; i += GROUP) {
    groups.push(canonical.slice(i, i + GROUP));
  }
  return groups.join("-");
}

/** Invite (first setup) lifetime. Long enough to install the app first. */
export const INVITE_TTL_HOURS = 24 * 7;
/** Recovery (password reset) lifetime. Shorter: the account already exists. */
export const RECOVERY_TTL_HOURS = 24;
