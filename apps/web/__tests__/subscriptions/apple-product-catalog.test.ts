/**
 * Unit tests for lib/subscriptions/apple-product-catalog.ts (FV-593),
 * per the KC-approved configuration policy in
 * docs/fv210-apple-product-config-PROPOSAL-2026-09-17.md.
 *
 * The catalog is DATA ONLY and dormant by default (`isAppleCatalogActive()`
 * gated on `APPLE_CATALOG_ACTIVE === "1"`). These tests pin its shape and
 * the ordering invariants the proposal's "P2 ordering trap" section depends
 * on (D2/D3), without activating anything in production.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  APPLE_GROUP_REFERENCE_NAME,
  APPLE_PRODUCT_CATALOG,
  catalogCapacityMap,
  catalogToPublicProductsJson,
  isAppleCatalogActive,
} from "@/lib/subscriptions/apple-product-catalog";
import { getConfiguredAppleProducts } from "@/lib/subscriptions/apple-products";

const ENV_KEY = "APPLE_CATALOG_ACTIVE";
const PUBLIC_ENV_KEY = "NEXT_PUBLIC_APPLE_PRODUCTS";

afterEach(() => {
  delete process.env[ENV_KEY];
  delete process.env[PUBLIC_ENV_KEY];
});

// ---------------------------------------------------------------------------
// APPLE_GROUP_REFERENCE_NAME
// ---------------------------------------------------------------------------

describe("APPLE_GROUP_REFERENCE_NAME", () => {
  it("matches the KC-approved group name", () => {
    expect(APPLE_GROUP_REFERENCE_NAME).toBe("From Victory Family");
  });
});

// ---------------------------------------------------------------------------
// APPLE_PRODUCT_CATALOG — shape invariants
// ---------------------------------------------------------------------------

describe("APPLE_PRODUCT_CATALOG", () => {
  it("has exactly 10 entries", () => {
    expect(APPLE_PRODUCT_CATALOG).toHaveLength(10);
  });

  it("is frozen (array and each entry)", () => {
    expect(Object.isFrozen(APPLE_PRODUCT_CATALOG)).toBe(true);
    for (const entry of APPLE_PRODUCT_CATALOG) {
      expect(Object.isFrozen(entry)).toBe(true);
    }
  });

  it("has unique product ids", () => {
    const ids = APPLE_PRODUCT_CATALOG.map((e) => e.productId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every product id starts with the shipped bundle id prefix", () => {
    for (const entry of APPLE_PRODUCT_CATALOG) {
      expect(entry.productId.startsWith("com.fromvictoryapp.app.family.")).toBe(true);
    }
  });

  it("has capacities 1-5, each with exactly one month + one year entry", () => {
    for (const capacity of [1, 2, 3, 4, 5] as const) {
      const entries = APPLE_PRODUCT_CATALOG.filter((e) => e.athleteCapacity === capacity);
      expect(entries).toHaveLength(2);
      const intervals = entries.map((e) => e.interval).sort();
      expect(intervals).toEqual(["month", "year"]);
    }
  });

  it("ranks level strictly DECREASING as capacity increases (capacity 5 -> level 1, capacity 1 -> level 5)", () => {
    const levelByCapacity = new Map<number, number>();
    for (const entry of APPLE_PRODUCT_CATALOG) {
      levelByCapacity.set(entry.athleteCapacity, entry.level);
    }
    expect(levelByCapacity.get(5)).toBe(1);
    expect(levelByCapacity.get(4)).toBe(2);
    expect(levelByCapacity.get(3)).toBe(3);
    expect(levelByCapacity.get(2)).toBe(4);
    expect(levelByCapacity.get(1)).toBe(5);

    // Strictly decreasing across the full capacity range.
    const levelsAscendingByCapacity = [1, 2, 3, 4, 5].map(
      (capacity) => levelByCapacity.get(capacity)!,
    );
    for (let i = 1; i < levelsAscendingByCapacity.length; i++) {
      const curr = levelsAscendingByCapacity[i]!;
      const prev = levelsAscendingByCapacity[i - 1]!;
      expect(curr).toBeLessThan(prev);
    }
  });

  it("month and year of the same tier share the same level", () => {
    for (const capacity of [1, 2, 3, 4, 5] as const) {
      const entries = APPLE_PRODUCT_CATALOG.filter((e) => e.athleteCapacity === capacity);
      const levels = new Set(entries.map((e) => e.level));
      expect(levels.size).toBe(1);
    }
  });

  it("introOffer is true if and only if athleteCapacity === 1", () => {
    for (const entry of APPLE_PRODUCT_CATALOG) {
      expect(entry.introOffer).toBe(entry.athleteCapacity === 1);
    }
  });

  it("displayName never uses an em dash and never says 'kid'", () => {
    for (const entry of APPLE_PRODUCT_CATALOG) {
      expect(entry.displayName).not.toMatch(/—/);
      expect(entry.displayName.toLowerCase()).not.toMatch(/kid/);
    }
  });

  it("displayName is parent-facing and readable (spot check)", () => {
    const oneMonthly = APPLE_PRODUCT_CATALOG.find(
      (e) => e.athleteCapacity === 1 && e.interval === "month",
    );
    expect(oneMonthly?.displayName).toBe("1 athlete · monthly");

    const threeYearly = APPLE_PRODUCT_CATALOG.find(
      (e) => e.athleteCapacity === 3 && e.interval === "year",
    );
    expect(threeYearly?.displayName).toBe("Up to 3 athletes · yearly");
  });
});

// ---------------------------------------------------------------------------
// catalogCapacityMap
// ---------------------------------------------------------------------------

describe("catalogCapacityMap", () => {
  it("has exactly 10 entries matching the catalog's productId -> athleteCapacity", () => {
    const map = catalogCapacityMap();
    expect(Object.keys(map)).toHaveLength(10);
    for (const entry of APPLE_PRODUCT_CATALOG) {
      expect(map[entry.productId]).toBe(entry.athleteCapacity);
    }
  });

  it("is frozen", () => {
    expect(Object.isFrozen(catalogCapacityMap())).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// catalogToPublicProductsJson — round-trips through getConfiguredAppleProducts
// ---------------------------------------------------------------------------

describe("catalogToPublicProductsJson", () => {
  it("produces valid JSON that round-trips through getConfiguredAppleProducts into 10 valid entries", () => {
    const json = catalogToPublicProductsJson();
    process.env[PUBLIC_ENV_KEY] = json;

    const parsed = getConfiguredAppleProducts();
    expect(parsed).toHaveLength(10);

    for (const entry of APPLE_PRODUCT_CATALOG) {
      const match = parsed.find((p) => p.productId === entry.productId);
      expect(match).toBeDefined();
      expect(match?.athleteCapacity).toBe(entry.athleteCapacity);
      expect(match?.displayName).toBe(entry.displayName);
    }
  });
});

// ---------------------------------------------------------------------------
// isAppleCatalogActive
// ---------------------------------------------------------------------------

describe("isAppleCatalogActive", () => {
  it("is false when unset", () => {
    delete process.env[ENV_KEY];
    expect(isAppleCatalogActive()).toBe(false);
  });

  it.each(["0", "true", "yes", "TRUE", "1 ", " 1", ""])(
    "is false for %j (only the exact string \"1\" activates)",
    (value) => {
      process.env[ENV_KEY] = value;
      expect(isAppleCatalogActive()).toBe(false);
    },
  );

  it('is true only for the exact string "1"', () => {
    process.env[ENV_KEY] = "1";
    expect(isAppleCatalogActive()).toBe(true);
  });
});
