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
  "password_reset",
  "password_update",
  "username_sign_in",
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

  /**
   * password_reset: keyed on normalized email (FV-185).
   * Threat: resetPasswordForEmail sends a real email on every call and the
   * action returns ok:true regardless (anti-enumeration), so without a gate a
   * bot can spam a known parent's inbox and drain Supabase's outbound email
   * quota — the same family as sign_up. 8 / 60 min is generous for a human who
   * mistypes or doesn't receive the first email (and stays above the project's
   * "a normal user retrying 5 times is never locked out" floor — see
   * is-rate-limited.test.ts), while blunting automated loops. Keying on the
   * submitted email (not on account existence) leaks nothing.
   */
  password_reset: { limit: 8, windowMinutes: 60 },

  /**
   * password_update: keyed on request IP (FV-185).
   * Lower-risk than the reset path — a valid recovery session is required — but
   * gated for completeness against a session-replay/abuse loop. 10 / 15 min is
   * well above any human password-change use case.
   */
  password_update: { limit: 10, windowMinutes: 15 },

  /**
   * username_sign_in: keyed on HMAC(lower(username) + IP) (FV-320).
   * Threat: password brute-force against a known or guessed username from any
   * device. The identifier is a hash of BOTH username AND IP so a distributed
   * attack across IPs with the same username still counts per-IP, while a
   * single IP brute-forcing many usernames still counts per-username.
   * Keying on the hash (not the plain username) means the bucket column never
   * stores the athlete's identifier — consistent with the existing pattern.
   * 15 attempts / 15 min mirrors athlete_sign_in. A legitimate athlete who
   * misremembers their password and tries a few times will not hit this.
   */
  username_sign_in: { limit: 15, windowMinutes: 15 },
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
