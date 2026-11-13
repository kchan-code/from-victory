/**
 * Unit tests for lib/subscriptions/google-product-catalog.ts and
 * subscription-plan-key.ts (FV-661). Mirrors apple-product-catalog.test.ts.
 * The ids under test are PROVISIONAL (record 5.2, decision G1 not approved).
 */

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  GOOGLE_PLAY_CATALOG,
  GOOGLE_PLAY_PACKAGE_NAME,
  googleCapacityForProduct,
  googleCatalogEntry,
  googleCatalogEntryForPlan,
  isGooglePlayCatalogActive,
} from "@/lib/subscriptions/google-product-catalog";
import { APPLE_PRODUCT_CATALOG } from "@/lib/subscriptions/apple-product-catalog";
import {
  appleProductIdForPlan,
  googlePlanForPlan,
  planKeyForAppleProduct,
  planKeyForGooglePlan,
  planKeyToString,
} from "@/lib/subscriptions/subscription-plan-key";

const ENV_KEY = "GOOGLE_PLAY_CATALOG_ACTIVE";

afterEach(() => {
  delete process.env[ENV_KEY];
});

describe("GOOGLE_PLAY_CATALOG", () => {
  it("uses the Android application id", () => {
    expect(GOOGLE_PLAY_PACKAGE_NAME).toBe("com.fromvictoryapp.app");
  });

  it("has exactly 10 entries: five products x monthly/yearly", () => {
    expect(GOOGLE_PLAY_CATALOG).toHaveLength(10);
    expect(new Set(GOOGLE_PLAY_CATALOG.map((e) => e.productId))).toEqual(
      new Set(["family.1", "family.2", "family.3", "family.4", "family.5"]),
    );
    expect(new Set(GOOGLE_PLAY_CATALOG.map((e) => e.basePlanId))).toEqual(
      new Set(["monthly", "yearly"]),
    );
  });

  it("is frozen (array and each entry)", () => {
    expect(Object.isFrozen(GOOGLE_PLAY_CATALOG)).toBe(true);
    for (const e of GOOGLE_PLAY_CATALOG) expect(Object.isFrozen(e)).toBe(true);
  });

  it("has unique (product, base plan) pairs and one entry per (capacity, interval)", () => {
    const pairs = GOOGLE_PLAY_CATALOG.map((e) => `${e.productId}/${e.basePlanId}`);
    expect(new Set(pairs).size).toBe(10);
    const keys = GOOGLE_PLAY_CATALOG.map((e) => `${e.athleteCapacity}:${e.interval}`);
    expect(new Set(keys).size).toBe(10);
  });

  it("maps product family.N to an athlete ceiling of N (1 to 5)", () => {
    for (const e of GOOGLE_PLAY_CATALOG) {
      expect(e.productId).toBe(`family.${e.athleteCapacity}`);
      expect(e.athleteCapacity).toBeGreaterThanOrEqual(1);
      expect(e.athleteCapacity).toBeLessThanOrEqual(5);
    }
  });

  it("monthly base plan is interval month, yearly is year", () => {
    for (const e of GOOGLE_PLAY_CATALOG) {
      expect(e.interval).toBe(e.basePlanId === "monthly" ? "month" : "year");
    }
  });

  it("carries the trial offer trial-7d on tier 1 base plans ONLY", () => {
    for (const e of GOOGLE_PLAY_CATALOG) {
      expect(e.trialOfferId).toBe(e.athleteCapacity === 1 ? "trial-7d" : null);
    }
    expect(GOOGLE_PLAY_CATALOG.filter((e) => e.trialOfferId).map((e) => e.productId)).toEqual([
      "family.1",
      "family.1",
    ]);
  });

  it("has no price fields anywhere", () => {
    for (const e of GOOGLE_PLAY_CATALOG) {
      expect(Object.keys(e).some((k) => /price|usd|amount|cents/i.test(k))).toBe(false);
    }
  });

  it("looks entries up by (product, base plan) and rejects unknowns", () => {
    expect(googleCatalogEntry("family.3", "yearly")?.athleteCapacity).toBe(3);
    expect(googleCatalogEntry("family.3", "weekly")).toBeNull();
    expect(googleCatalogEntry("family.6", "monthly")).toBeNull();
    expect(googleCatalogEntryForPlan(2, "month").productId).toBe("family.2");
  });
});

describe("isGooglePlayCatalogActive / googleCapacityForProduct", () => {
  it("is inactive when unset", () => {
    expect(isGooglePlayCatalogActive()).toBe(false);
    expect(googleCapacityForProduct("family.2")).toBeNull();
  });

  it("is active ONLY for the exact string \"1\"", () => {
    for (const v of ["0", "true", "yes", "TRUE", " 1", "1 ", "01", "", "on"]) {
      process.env[ENV_KEY] = v;
      expect(isGooglePlayCatalogActive(), `value ${JSON.stringify(v)}`).toBe(false);
    }
    process.env[ENV_KEY] = "1";
    expect(isGooglePlayCatalogActive()).toBe(true);
  });

  it("returns ceilings only when active, null for unknown products", () => {
    process.env[ENV_KEY] = "1";
    expect(googleCapacityForProduct("family.4")).toBe(4);
    expect(googleCapacityForProduct("family.9")).toBeNull();
  });
});

describe("provider-neutral plan key", () => {
  it("maps every plan key to one Apple product id and one Play plan, and back", () => {
    for (const e of GOOGLE_PLAY_CATALOG) {
      const key = { athleteCapacity: e.athleteCapacity, interval: e.interval };
      const play = googlePlanForPlan(key);
      expect(play).toEqual({ productId: e.productId, basePlanId: e.basePlanId });
      expect(planKeyForGooglePlan(e.productId, e.basePlanId)).toEqual(key);

      const appleId = appleProductIdForPlan(key);
      expect(appleId).not.toBeNull();
      expect(planKeyForAppleProduct(appleId as string)).toEqual(key);
    }
  });

  it("covers exactly the same plan keys as the Apple catalog", () => {
    const apple = new Set(APPLE_PRODUCT_CATALOG.map((e) => `${e.athleteCapacity}:${e.interval}`));
    const google = new Set(GOOGLE_PLAY_CATALOG.map((e) => `${e.athleteCapacity}:${e.interval}`));
    expect(google).toEqual(apple);
  });

  it("formats a stable string key and returns null for unknown ids", () => {
    expect(planKeyToString({ athleteCapacity: 3, interval: "year" })).toBe("3:year");
    expect(planKeyForGooglePlan("nope", "monthly")).toBeNull();
    expect(planKeyForAppleProduct("nope")).toBeNull();
  });
});
