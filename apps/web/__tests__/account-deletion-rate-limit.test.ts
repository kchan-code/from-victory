/**
 * Unit tests for the `isDeletionRateLimited` pure function (FV-14).
 *
 * Imports from `lib/actions/deletion-rate-limit` — no `server-only` guard,
 * no `next/headers` import chain. Pure logic only, safe to run under vitest's
 * node environment without a DB or Next.js runtime.
 *
 * Mirrors the conventions in __tests__/stripe/subscription-access.test.ts.
 */

import { describe, it, expect } from "vitest";

import {
  isDeletionRateLimited,
  DELETION_RATE_LIMIT,
  DELETION_WINDOW_MINUTES,
} from "@/lib/actions/deletion-rate-limit";

describe("isDeletionRateLimited", () => {
  // -------------------------------------------------------------------------
  // Default limit behaviour (uses the module-level DELETION_RATE_LIMIT)
  // -------------------------------------------------------------------------

  it("allows when recentCount is 0 (no prior events)", () => {
    expect(isDeletionRateLimited(0)).toBe(false);
  });

  it("allows when recentCount is 1", () => {
    expect(isDeletionRateLimited(1)).toBe(false);
  });

  it("allows when recentCount is one below the default limit", () => {
    expect(isDeletionRateLimited(DELETION_RATE_LIMIT - 1)).toBe(false);
  });

  it("blocks when recentCount equals the default limit (boundary — at-limit is blocked)", () => {
    expect(isDeletionRateLimited(DELETION_RATE_LIMIT)).toBe(true);
  });

  it("blocks when recentCount exceeds the default limit", () => {
    expect(isDeletionRateLimited(DELETION_RATE_LIMIT + 1)).toBe(true);
  });

  it("blocks on a large count well above the limit", () => {
    expect(isDeletionRateLimited(DELETION_RATE_LIMIT * 10)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Explicit limit override (boundary tests independent of constant value)
  // -------------------------------------------------------------------------

  it("allows when recentCount=0 and limit=1", () => {
    expect(isDeletionRateLimited(0, 1)).toBe(false);
  });

  it("blocks when recentCount=1 and limit=1 (at boundary)", () => {
    expect(isDeletionRateLimited(1, 1)).toBe(true);
  });

  it("allows when recentCount=4 and limit=5", () => {
    expect(isDeletionRateLimited(4, 5)).toBe(false);
  });

  it("blocks when recentCount=5 and limit=5 (at boundary)", () => {
    expect(isDeletionRateLimited(5, 5)).toBe(true);
  });

  it("blocks when recentCount=6 and limit=5 (over boundary)", () => {
    expect(isDeletionRateLimited(6, 5)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Sanity-check the exported constants match the designed parameters
  // -------------------------------------------------------------------------

  it("DELETION_RATE_LIMIT is 10 (as designed — high enough for family use, low enough to blunt burst attack)", () => {
    expect(DELETION_RATE_LIMIT).toBe(10);
  });

  it("DELETION_WINDOW_MINUTES is 60 (rolling 1-hour window)", () => {
    expect(DELETION_WINDOW_MINUTES).toBe(60);
  });

  // -------------------------------------------------------------------------
  // Normal-family-use scenario: 5 athletes + 1 account row = well under limit
  // -------------------------------------------------------------------------

  it("does not block a parent who deletes 5 athletes (5 events)", () => {
    // 5 athlete_deleted events for a family with 5 athletes — all under limit.
    expect(isDeletionRateLimited(5)).toBe(false);
  });

  it("does not block a parent who deletes 5 athletes then their account (6 events total)", () => {
    // 5 athlete_deleted + 1 account_deleted = 6. Still under the limit of 10.
    expect(isDeletionRateLimited(6)).toBe(false);
  });
});
