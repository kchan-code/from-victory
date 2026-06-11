/**
 * Unit tests for `priceIdToLabel` (FV-192) — the pure helper that maps a
 * subscriptions.price_id to the plan label shown on the settings page.
 */

import { describe, it, expect } from "vitest";

import { priceIdToLabel } from "@/lib/subscriptions/plans";

const MONTHLY = "price_monthly_123";
const ANNUAL = "price_annual_456";

describe("priceIdToLabel", () => {
  it("returns Monthly when the price id matches the monthly env value", () => {
    expect(priceIdToLabel(MONTHLY, MONTHLY, ANNUAL)).toBe("Monthly");
  });

  it("returns Annual when the price id matches the annual env value", () => {
    expect(priceIdToLabel(ANNUAL, MONTHLY, ANNUAL)).toBe("Annual");
  });

  it("falls back to Subscription for an unrecognized price id", () => {
    expect(priceIdToLabel("price_other_789", MONTHLY, ANNUAL)).toBe(
      "Subscription",
    );
  });

  it("falls back to Subscription when the price id is null or undefined", () => {
    expect(priceIdToLabel(null, MONTHLY, ANNUAL)).toBe("Subscription");
    expect(priceIdToLabel(undefined, MONTHLY, ANNUAL)).toBe("Subscription");
  });

  it("falls back to Subscription when env values are unset (pre-Stripe-setup)", () => {
    expect(priceIdToLabel(MONTHLY, undefined, undefined)).toBe("Subscription");
  });
});
