/**
 * Unit tests for `appleSubscriptionAccessLevel` (FV-570).
 *
 * Pure function, no I/O, no mocks required. Exercises the full
 * status/time matrix from docs/fv210-ios-iap-decision-record.md Section
 * 4.2 ("Verification, lifecycle state, and time (v3-revised)").
 */

import { describe, it, expect } from "vitest";

import {
  appleSubscriptionAccessLevel,
  DEFAULT_APPLE_SKEW_MS,
} from "@/lib/subscriptions/apple-access-level";

const NOW = new Date("2026-09-11T12:00:00.000Z");

const HOUR = 60 * 60 * 1000;

function hoursFromNow(hours: number): Date {
  return new Date(NOW.getTime() + hours * HOUR);
}

// ---------------------------------------------------------------------------
// subscribed
// ---------------------------------------------------------------------------

describe("appleSubscriptionAccessLevel — subscribed", () => {
  it("is full while now is well before expiresAt", () => {
    const expiresAt = hoursFromNow(24 * 30); // 30 days out
    expect(
      appleSubscriptionAccessLevel("subscribed", expiresAt, null, NOW),
    ).toBe("full");
  });

  it("is full at the exact expiresAt boundary (now === expiresAt)", () => {
    const expiresAt = NOW;
    expect(
      appleSubscriptionAccessLevel("subscribed", expiresAt, null, NOW),
    ).toBe("full");
  });

  it("is degraded just past expiresAt, within the skew window", () => {
    const expiresAt = hoursFromNow(-1); // expired 1h ago
    expect(
      appleSubscriptionAccessLevel("subscribed", expiresAt, null, NOW),
    ).toBe("degraded");
  });

  it("is degraded at the exact skew boundary (now === expiresAt + skewMs)", () => {
    const expiresAt = new Date(NOW.getTime() - DEFAULT_APPLE_SKEW_MS);
    expect(
      appleSubscriptionAccessLevel("subscribed", expiresAt, null, NOW),
    ).toBe("degraded");
  });

  it("is blocked just past the skew window", () => {
    const expiresAt = new Date(NOW.getTime() - DEFAULT_APPLE_SKEW_MS - 1);
    expect(
      appleSubscriptionAccessLevel("subscribed", expiresAt, null, NOW),
    ).toBe("blocked");
  });

  it("is blocked long past expiry", () => {
    const expiresAt = hoursFromNow(-24 * 90); // 90 days ago
    expect(
      appleSubscriptionAccessLevel("subscribed", expiresAt, null, NOW),
    ).toBe("blocked");
  });

  it("accepts ISO strings as well as Date objects", () => {
    const expiresAt = hoursFromNow(24).toISOString();
    expect(
      appleSubscriptionAccessLevel("subscribed", expiresAt, null, NOW),
    ).toBe("full");
  });

  it("respects a custom skewMs override", () => {
    const expiresAt = hoursFromNow(-2); // 2h past expiry
    // Default 6h skew would be "degraded"; a 1h skew pushes this to blocked.
    expect(
      appleSubscriptionAccessLevel("subscribed", expiresAt, null, NOW, HOUR),
    ).toBe("blocked");
  });
});

// ---------------------------------------------------------------------------
// in_grace_period — gated on its OWN bound, not expires_at
// ---------------------------------------------------------------------------

describe("appleSubscriptionAccessLevel — in_grace_period", () => {
  it("is full while now <= gracePeriodExpiresAt, even when expiresAt is long past", () => {
    const expiresAt = hoursFromNow(-24 * 30); // expired 30 days ago
    const graceExpiresAt = hoursFromNow(24 * 5); // grace bound 5 days in the future
    expect(
      appleSubscriptionAccessLevel(
        "in_grace_period",
        expiresAt,
        graceExpiresAt,
        NOW,
      ),
    ).toBe("full");
  });

  it("is full at the exact grace-bound boundary", () => {
    const expiresAt = hoursFromNow(-24);
    const graceExpiresAt = NOW;
    expect(
      appleSubscriptionAccessLevel(
        "in_grace_period",
        expiresAt,
        graceExpiresAt,
        NOW,
      ),
    ).toBe("full");
  });

  it("is degraded within skew past the grace bound", () => {
    const expiresAt = hoursFromNow(-48);
    const graceExpiresAt = hoursFromNow(-1);
    expect(
      appleSubscriptionAccessLevel(
        "in_grace_period",
        expiresAt,
        graceExpiresAt,
        NOW,
      ),
    ).toBe("degraded");
  });

  it("is blocked beyond skew past the grace bound", () => {
    const expiresAt = hoursFromNow(-48);
    const graceExpiresAt = new Date(NOW.getTime() - DEFAULT_APPLE_SKEW_MS - 1);
    expect(
      appleSubscriptionAccessLevel(
        "in_grace_period",
        expiresAt,
        graceExpiresAt,
        NOW,
      ),
    ).toBe("blocked");
  });

  it("fails CLOSED to degraded when gracePeriodExpiresAt is null (data anomaly)", () => {
    const expiresAt = hoursFromNow(-24);
    expect(
      appleSubscriptionAccessLevel("in_grace_period", expiresAt, null, NOW),
    ).toBe("degraded");
  });

  it("is NOT gated on expires_at at all — a future expiresAt with a past grace bound still degrades/blocks correctly", () => {
    // Deliberately unusual snapshot: expiresAt still in the future (stale data)
    // but grace bound already passed. Grace's own bound governs regardless.
    const expiresAt = hoursFromNow(24);
    const graceExpiresAt = new Date(NOW.getTime() - DEFAULT_APPLE_SKEW_MS - 1);
    expect(
      appleSubscriptionAccessLevel(
        "in_grace_period",
        expiresAt,
        graceExpiresAt,
        NOW,
      ),
    ).toBe("blocked");
  });
});

// ---------------------------------------------------------------------------
// in_billing_retry — always degraded, no time gate
// ---------------------------------------------------------------------------

describe("appleSubscriptionAccessLevel — in_billing_retry", () => {
  it("is degraded regardless of expiresAt being in the future", () => {
    const expiresAt = hoursFromNow(24 * 30);
    expect(
      appleSubscriptionAccessLevel("in_billing_retry", expiresAt, null, NOW),
    ).toBe("degraded");
  });

  it("is degraded regardless of expiresAt being long past", () => {
    const expiresAt = hoursFromNow(-24 * 90);
    expect(
      appleSubscriptionAccessLevel("in_billing_retry", expiresAt, null, NOW),
    ).toBe("degraded");
  });
});

// ---------------------------------------------------------------------------
// expired | revoked — always blocked, never re-opened by skew
// ---------------------------------------------------------------------------

describe("appleSubscriptionAccessLevel — expired | revoked", () => {
  it("expired is blocked even when expiresAt is far in the future (corrected/stale snapshot)", () => {
    const expiresAt = hoursFromNow(24 * 365);
    expect(
      appleSubscriptionAccessLevel("expired", expiresAt, null, NOW),
    ).toBe("blocked");
  });

  it("revoked is blocked even when expiresAt is far in the future", () => {
    const expiresAt = hoursFromNow(24 * 365);
    expect(
      appleSubscriptionAccessLevel("revoked", expiresAt, null, NOW),
    ).toBe("blocked");
  });

  it("expired is blocked with a grace bound in the future too — skew never re-opens a closed state", () => {
    const expiresAt = hoursFromNow(-1);
    const graceExpiresAt = hoursFromNow(24);
    expect(
      appleSubscriptionAccessLevel("expired", expiresAt, graceExpiresAt, NOW),
    ).toBe("blocked");
  });

  it("revoked ignores a custom (larger) skewMs entirely", () => {
    const expiresAt = hoursFromNow(24 * 365);
    expect(
      appleSubscriptionAccessLevel(
        "revoked",
        expiresAt,
        null,
        NOW,
        24 * HOUR,
      ),
    ).toBe("blocked");
  });
});
