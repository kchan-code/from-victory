/**
 * Unit tests for lib/subscriptions/google-access-level.ts (FV-661).
 */

import { describe, expect, it } from "vitest";

import {
  DEFAULT_GOOGLE_SKEW_MS,
  googleSubscriptionAccessLevel as level,
  type GoogleSubscriptionStatus,
} from "@/lib/subscriptions/google-access-level";
import { appleSubscriptionAccessLevel } from "@/lib/subscriptions/apple-access-level";
import { subscriptionAccessLevel } from "@/lib/subscriptions/access-level";

const NOW = new Date("2026-11-12T12:00:00.000Z");
const FUTURE = "2026-12-12T12:00:00.000Z";
const JUST_PAST = new Date(NOW.getTime() - 60_000).toISOString();
const LONG_PAST = new Date(NOW.getTime() - DEFAULT_GOOGLE_SKEW_MS - 60_000).toISOString();

const ALL: GoogleSubscriptionStatus[] = [
  "pending",
  "active",
  "paused",
  "in_grace_period",
  "on_hold",
  "canceled",
  "expired",
  "pending_purchase_canceled",
];

describe("googleSubscriptionAccessLevel", () => {
  it("null expires_at NEVER grants access, for every status (fail closed)", () => {
    for (const s of ALL) expect(level(s, null, NOW), s).toBe("blocked");
  });

  it("unparseable expires_at is blocked", () => {
    expect(level("active", "not-a-date", NOW)).toBe("blocked");
  });

  it("active: full before expiry, degraded within the skew, then blocked", () => {
    expect(level("active", FUTURE, NOW)).toBe("full");
    expect(level("active", JUST_PAST, NOW)).toBe("degraded");
    expect(level("active", LONG_PAST, NOW)).toBe("blocked");
  });

  it("grace period keeps access (full until the grace bound)", () => {
    expect(level("in_grace_period", FUTURE, NOW)).toBe("full");
    expect(level("in_grace_period", LONG_PAST, NOW)).toBe("blocked");
  });

  it("canceled but not yet expired keeps access; past expiry grants nothing", () => {
    expect(level("canceled", FUTURE, NOW)).toBe("full");
    expect(level("canceled", JUST_PAST, NOW)).toBe("blocked");
  });

  it("on_hold is degraded: the same level Apple billing retry and Stripe past_due map to", () => {
    expect(level("on_hold", FUTURE, NOW)).toBe("degraded");
    expect(level("on_hold", FUTURE, NOW)).toBe(
      appleSubscriptionAccessLevel("in_billing_retry", FUTURE, null, NOW),
    );
    expect(level("on_hold", FUTURE, NOW)).toBe(subscriptionAccessLevel("past_due"));
  });

  it("pending, paused, expired and pending_purchase_canceled grant nothing even with a future expiry", () => {
    for (const s of ["pending", "paused", "expired", "pending_purchase_canceled"] as const) {
      expect(level(s, FUTURE, NOW), s).toBe("blocked");
    }
  });

  it("uses the injected server clock against Google's expiry (accepts Date or string)", () => {
    expect(level("active", new Date(FUTURE), NOW)).toBe("full");
    const exactly = new Date(NOW);
    expect(level("active", exactly, NOW)).toBe("full");
    expect(level("canceled", exactly, new Date(NOW.getTime() + 1))).toBe("blocked");
  });

  it("uses the same skew constant as Apple (6h)", () => {
    expect(DEFAULT_GOOGLE_SKEW_MS).toBe(6 * 60 * 60 * 1000);
  });
});
