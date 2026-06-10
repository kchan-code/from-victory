/**
 * Unit tests for the `isRateLimited` pure function and config constants
 * (FV-13).
 *
 * Mirrors the conventions in __tests__/account-deletion-rate-limit.test.ts.
 * No `server-only` guard, no `next/headers` import chain. Pure logic only,
 * safe to run under vitest's node environment without a DB or Next.js runtime.
 */

import { describe, it, expect } from "vitest";

import {
  isRateLimited,
  RATE_LIMIT_CONFIG,
  RATE_LIMIT_ACTIONS,
} from "@/lib/actions/rate-limit";

describe("isRateLimited", () => {
  // -------------------------------------------------------------------------
  // Core boundary behaviour
  // -------------------------------------------------------------------------

  it("allows when recentCount is 0", () => {
    expect(isRateLimited(0, 10)).toBe(false);
  });

  it("allows when recentCount is 1 below the limit", () => {
    expect(isRateLimited(9, 10)).toBe(false);
  });

  it("blocks when recentCount equals the limit (at-limit is blocked)", () => {
    expect(isRateLimited(10, 10)).toBe(true);
  });

  it("blocks when recentCount exceeds the limit", () => {
    expect(isRateLimited(11, 10)).toBe(true);
  });

  it("blocks on a large count well above the limit", () => {
    expect(isRateLimited(100, 10)).toBe(true);
  });

  it("allows when recentCount=0 and limit=1", () => {
    expect(isRateLimited(0, 1)).toBe(false);
  });

  it("blocks when recentCount=1 and limit=1 (boundary)", () => {
    expect(isRateLimited(1, 1)).toBe(true);
  });

  it("allows when recentCount=4 and limit=5", () => {
    expect(isRateLimited(4, 5)).toBe(false);
  });

  it("blocks when recentCount=5 and limit=5 (boundary)", () => {
    expect(isRateLimited(5, 5)).toBe(true);
  });
});

describe("RATE_LIMIT_CONFIG", () => {
  // -------------------------------------------------------------------------
  // Sanity-check: every action in RATE_LIMIT_ACTIONS has a config entry
  // -------------------------------------------------------------------------

  it("has a config entry for every action in RATE_LIMIT_ACTIONS", () => {
    for (const action of RATE_LIMIT_ACTIONS) {
      expect(RATE_LIMIT_CONFIG).toHaveProperty(action);
      const config = RATE_LIMIT_CONFIG[action];
      expect(config.limit).toBeGreaterThan(0);
      expect(config.windowMinutes).toBeGreaterThan(0);
    }
  });

  // -------------------------------------------------------------------------
  // Constants sanity-check: verify the designed calibration values are in
  // place so a future change requires an intentional test update.
  // -------------------------------------------------------------------------

  it("sign_in: limit=20, window=15min (credential-stuffing blunt)", () => {
    expect(RATE_LIMIT_CONFIG.sign_in.limit).toBe(20);
    expect(RATE_LIMIT_CONFIG.sign_in.windowMinutes).toBe(15);
  });

  it("sign_up: limit=15, window=60min (mass-creation / email-send-exhaustion blunt)", () => {
    expect(RATE_LIMIT_CONFIG.sign_up.limit).toBe(15);
    expect(RATE_LIMIT_CONFIG.sign_up.windowMinutes).toBe(60);
  });

  it("athlete_sign_in: limit=20, window=15min (stolen-cookie brute-force blunt)", () => {
    expect(RATE_LIMIT_CONFIG.athlete_sign_in.limit).toBe(20);
    expect(RATE_LIMIT_CONFIG.athlete_sign_in.windowMinutes).toBe(15);
  });

  it("claim_pairing: limit=20, window=60min (DoS on pairing endpoint)", () => {
    expect(RATE_LIMIT_CONFIG.claim_pairing.limit).toBe(20);
    expect(RATE_LIMIT_CONFIG.claim_pairing.windowMinutes).toBe(60);
  });

  it("generate_pairing_code: limit=30, window=60min (compromised session spinning codes)", () => {
    expect(RATE_LIMIT_CONFIG.generate_pairing_code.limit).toBe(30);
    expect(RATE_LIMIT_CONFIG.generate_pairing_code.windowMinutes).toBe(60);
  });

  // -------------------------------------------------------------------------
  // Generous-calibration invariants: normal family use should never hit these.
  // A parent retrying sign-in 5 times is well below any of the limits.
  // -------------------------------------------------------------------------

  it("all limits are high enough that a normal user retrying 5 times is safe", () => {
    for (const action of RATE_LIMIT_ACTIONS) {
      expect(isRateLimited(5, RATE_LIMIT_CONFIG[action].limit)).toBe(false);
    }
  });

  it("all limits block at the configured threshold", () => {
    for (const action of RATE_LIMIT_ACTIONS) {
      const { limit } = RATE_LIMIT_CONFIG[action];
      expect(isRateLimited(limit, limit)).toBe(true);
    }
  });
});
