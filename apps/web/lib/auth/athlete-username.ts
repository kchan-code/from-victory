/**
 * Username validation for athlete any-device sign-in (FV-320).
 *
 * Athletes claim a username at first device pairing. The username is a PUBLIC
 * lookup handle: it is used to resolve the athlete's synthetic auth email at
 * sign-in time. It is NOT displayed publicly to other users — it is the
 * athlete's own credential key.
 *
 * Design contract:
 *   - Intentionally NOT marked `server-only` — these are pure functions with
 *     no I/O, testable in vitest/node without triggering next/headers.
 *   - All secrets and DB I/O live in the calling server actions (pairings.ts).
 *   - Case-normalisation is applied here: inputs are lowercased before
 *     validation so "Jordan7" and "jordan7" are the same username. This
 *     matches the DB index (lower(username) UNIQUE).
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/**
 * Pattern: lowercase letters, digits, underscores only.
 * Applied AFTER lowercasing, so this effectively accepts [a-z0-9_] only.
 *
 * Why no hyphens: consistent with the "handles are safe across case-sensitive
 * contexts" goal; underscores are universally safe in URLs and identifiers.
 */
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/**
 * Reserved words that may not be used as usernames.
 *
 * Rules for additions:
 *   - Add any word that could be confused with an operator/admin identity.
 *   - Do NOT add sport-specific words — athletes named "hockey" or "forward"
 *     are fine.
 *   - Keep this list short; overly aggressive blocking frustrates real users.
 *
 * All entries MUST be lowercase (the comparison lowercases the input first).
 */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  "admin",
  "administrator",
  "parent",
  "fromvictory",
  "from_victory",
  "support",
  "root",
  "superuser",
  "system",
  "moderator",
  "staff",
  "help",
  "info",
  "contact",
  "api",
  "webhook",
  "null",
  "undefined",
  "test",
]);

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type UsernameValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// validateUsername
// ---------------------------------------------------------------------------

/**
 * Validates and normalises a username string.
 *
 * Steps:
 *   1. Trim whitespace.
 *   2. Lowercase (case-insensitive — "Jordan7" → "jordan7").
 *   3. Check length (3-20 chars after normalisation).
 *   4. Check pattern (only [a-z0-9_]).
 *   5. Reject reserved words.
 *
 * Returns `{ ok: true, normalized }` on success, `{ ok: false, error }` on
 * any failure. The `normalized` value is what must be written to the DB.
 *
 * Pure function — no I/O, no DB calls, no env access.
 * Uniqueness is checked in the calling server action (requires a DB round-trip).
 */
export function validateUsername(input: unknown): UsernameValidationResult {
  if (typeof input !== "string") {
    return { ok: false, error: "Username must be a string." };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { ok: false, error: "Username is required." };
  }

  const normalized = trimmed.toLowerCase();

  if (normalized.length < USERNAME_MIN_LENGTH) {
    return {
      ok: false,
      error: `Username must be at least ${USERNAME_MIN_LENGTH} characters.`,
    };
  }

  if (normalized.length > USERNAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Username must be ${USERNAME_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return {
      ok: false,
      error:
        "Username can only contain letters, numbers, and underscores (no spaces or special characters).",
    };
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return {
      ok: false,
      error: "That username isn't available. Try something else.",
    };
  }

  return { ok: true, normalized };
}
