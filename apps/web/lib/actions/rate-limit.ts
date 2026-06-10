/**
 * Pure rate-limit decision function and config for auth/pairing actions
 * (FV-13).
 *
 * This file is intentionally NOT marked `server-only` so the pure function
 * and config can be imported in test files (vitest node env) without
 * triggering next/headers. The file itself performs no I/O and has no side
 * effects.
 *
 * The DB count query lives in the calling server-only helper
 * (lib/actions/rate-limit-store.ts), which passes the already-resolved count
 * in. This keeps the decision logic independently testable — same pattern as
 * isDeletionRateLimited in lib/actions/deletion-rate-limit.ts.
 *
 * Calibration rationale (see each constant below for per-action reasoning):
 *   All limits are deliberately generous. A false lockout on a shared family
 *   device is a worse outcome than slow brute force — Supabase Auth applies
 *   its own credential-level throttling as the downstream control. These
 *   limits are a DoS / mass-creation / email-send-exhaustion blunt instrument,
 *   not a precision credential-brute-force defence.
 */

// ---------------------------------------------------------------------------
// Action key type — string-literal union used for type safety and the CHECK
// constraint in the DB migration.
// ---------------------------------------------------------------------------

export const RATE_LIMIT_ACTIONS = [
  "sign_in",
  "sign_up",
  "athlete_sign_in",
  "claim_pairing",
  "generate_pairing_code",
] as const;

export type RateLimitAction = (typeof RATE_LIMIT_ACTIONS)[number];

// ---------------------------------------------------------------------------
// Config — limit + window per action
// ---------------------------------------------------------------------------

export interface RateLimitConfig {
  /** Maximum events allowed in the rolling window before blocking. */
  limit: number;
  /** Rolling window duration in minutes. */
  windowMinutes: number;
}

/**
 * Per-action rate-limit configuration.
 *
 * Calibration philosophy:
 *   - A legitimate human on a shared family device must NEVER hit these.
 *   - Automated abuse (password spray, mass account creation, DoS on
 *     pairing endpoint) must be meaningfully blunted.
 *   - Supabase Auth applies its own credential-level throttling downstream;
 *     our limits are a first-pass blunt instrument only.
 */
export const RATE_LIMIT_CONFIG: Record<RateLimitAction, RateLimitConfig> = {
  /**
   * sign_in: keyed on normalized email address.
   * 20 attempts / 15 min ≈ one attempt per 45 s for 15 minutes.
   * A parent who fat-fingers their password a few times and pauses will
   * never reach 20. A credential-stuffing script will.
   */
  sign_in: { limit: 20, windowMinutes: 15 },

  /**
   * sign_up: keyed on request IP (no stable identity at signup).
   * Threat: mass-account-creation to exhaust Supabase email-send quota or
   * create spam vectors.
   * 15 signups / 60 min from one IP is generous for a household NAT but
   * blocks automated creation loops.
   */
  sign_up: { limit: 15, windowMinutes: 60 },

  /**
   * athlete_sign_in: keyed on device athlete ID (UUID from cookie).
   * 20 attempts / 15 min — mirrors sign_in. An athlete who forgets their
   * password and tries a few times won't hit it; a script on a stolen device
   * cookie will.
   */
  athlete_sign_in: { limit: 20, windowMinutes: 15 },

  /**
   * claim_pairing: keyed on request IP.
   * Threat: DoS / timing attack on the pairing endpoint.
   * The code is single-use and atomically consumed (192-bit entropy), so
   * guessing is impractical. The rate limit here is purely DoS protection.
   * 20 attempts / 60 min per IP is well above any human use case.
   */
  claim_pairing: { limit: 20, windowMinutes: 60 },

  /**
   * generate_pairing_code: keyed on parent UUID (from requireParent()).
   * Threat: a compromised parent session spinning up unlimited pairing codes.
   * 30 codes / 60 min supports a parent with many athletes re-pairing all
   * devices in a session. Well above any realistic use case.
   */
  generate_pairing_code: { limit: 30, windowMinutes: 60 },
};

// ---------------------------------------------------------------------------
// Pure decision function
// ---------------------------------------------------------------------------

/**
 * Returns true if the caller should be BLOCKED, false if they are allowed
 * to proceed.
 *
 * @param recentCount  Count of auth_rate_limit_events rows for this bucket
 *                     in the last windowMinutes. Caller is responsible for
 *                     the DB query; this function only makes the accept/reject
 *                     decision — same separation as isDeletionRateLimited.
 * @param limit        The maximum allowed count (per RATE_LIMIT_CONFIG or an
 *                     override). At-or-above is blocked.
 */
export function isRateLimited(recentCount: number, limit: number): boolean {
  return recentCount >= limit;
}
