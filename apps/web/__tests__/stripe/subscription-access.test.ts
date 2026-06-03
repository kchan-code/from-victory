/**
 * Unit tests for the `subscriptionAccessLevel` pure function.
 *
 * Imports from `lib/subscriptions/access-level` (not `access`) so there is
 * no `server-only` guard and no `next/headers` import chain — pure logic only,
 * safe to run under vitest's node environment.
 */

import { describe, it, expect } from "vitest";

import {
  subscriptionAccessLevel,
} from "@/lib/subscriptions/access-level";
import type { SubscriptionStatus } from "@/lib/subscriptions/access-level";

describe("subscriptionAccessLevel", () => {
  // -------------------------------------------------------------------------
  // Full-access statuses
  // -------------------------------------------------------------------------

  it("returns 'full' for status=active", () => {
    expect(subscriptionAccessLevel("active")).toBe("full");
  });

  it("returns 'full' for status=trialing", () => {
    expect(subscriptionAccessLevel("trialing")).toBe("full");
  });

  // -------------------------------------------------------------------------
  // Degraded-access statuses
  // -------------------------------------------------------------------------

  it("returns 'degraded' for status=past_due", () => {
    expect(subscriptionAccessLevel("past_due")).toBe("degraded");
  });

  it("returns 'degraded' for status=incomplete", () => {
    expect(subscriptionAccessLevel("incomplete")).toBe("degraded");
  });

  it("returns 'degraded' for status=unpaid", () => {
    expect(subscriptionAccessLevel("unpaid")).toBe("degraded");
  });

  it("returns 'degraded' for status=paused", () => {
    expect(subscriptionAccessLevel("paused")).toBe("degraded");
  });

  // -------------------------------------------------------------------------
  // Blocked statuses
  // -------------------------------------------------------------------------

  it("returns 'blocked' for status=canceled", () => {
    expect(subscriptionAccessLevel("canceled")).toBe("blocked");
  });

  it("returns 'blocked' for status=incomplete_expired", () => {
    expect(subscriptionAccessLevel("incomplete_expired")).toBe("blocked");
  });

  // -------------------------------------------------------------------------
  // No-row case
  // -------------------------------------------------------------------------

  it("returns 'blocked' when status is null (no subscription row)", () => {
    expect(subscriptionAccessLevel(null)).toBe("blocked");
  });

  it("returns 'blocked' when status is undefined (no subscription row)", () => {
    expect(subscriptionAccessLevel(undefined)).toBe("blocked");
  });

  // -------------------------------------------------------------------------
  // cancel_at_period_end policy: access follows status, not cancellation flag
  // -------------------------------------------------------------------------

  it("returns 'full' when active AND cancel_at_period_end=true (period not yet ended)", () => {
    // The parent has cancelled but is still within the paid period.
    // Access remains full until Stripe changes the status to 'canceled'.
    const futureEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(subscriptionAccessLevel("active", true, futureEnd)).toBe("full");
  });

  it("returns 'blocked' when status=canceled even if cancel_at_period_end=false", () => {
    // Status is the authority; once Stripe fires the canceled status, block.
    expect(subscriptionAccessLevel("canceled", false, null)).toBe("blocked");
  });

  it("returns 'full' when trialing AND cancel_at_period_end=true", () => {
    const futureEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(subscriptionAccessLevel("trialing", true, futureEnd)).toBe("full");
  });

  // -------------------------------------------------------------------------
  // All valid statuses covered (completeness guard)
  // -------------------------------------------------------------------------

  it("covers all valid statuses defined in the DB check constraint", () => {
    const allStatuses: SubscriptionStatus[] = [
      "active",
      "trialing",
      "past_due",
      "canceled",
      "incomplete",
      "incomplete_expired",
      "unpaid",
      "paused",
    ];

    const results = allStatuses.map((s) => ({
      status: s,
      level: subscriptionAccessLevel(s),
    }));

    // Each status must map to a known level — no undefined/null/throws.
    for (const { status, level } of results) {
      expect(
        ["full", "degraded", "blocked"],
        `status "${status}" should map to a valid AccessLevel`,
      ).toContain(level);
    }
  });
});
