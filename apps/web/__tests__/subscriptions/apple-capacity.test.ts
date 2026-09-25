/**
 * Unit tests for the athlete-capacity ceiling helpers (FV-570,
 * `apps/web/lib/subscriptions/apple-capacity.ts`), per
 * docs/fv210-ios-iap-decision-record.md Section 4.6.
 *
 * Covers:
 *   - APPLE_PRODUCT_CAPACITY shape pin (empty object, frozen)
 *   - AppleTierCeiling type range (1-5) — compile-time pin via assignment
 *   - capacityForAppleProduct: unknown product -> null + warns
 *   - payerCapacityCeiling: stripe/comp -> null invariant ("never capped")
 *   - assertAthleteCapacity: inert with the current empty map, for both an
 *     Apple payer and a non-Apple payer
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// getActiveAppleProductId stub — controls what assertAthleteCapacity sees as
// the payer's active Apple product id.
const getActiveAppleProductIdMock = vi.fn();
vi.mock("@/lib/subscriptions/apple", () => ({
  getActiveAppleProductId: (...args: unknown[]) =>
    getActiveAppleProductIdMock(...args),
}));

import {
  APPLE_PRODUCT_CAPACITY,
  capacityForAppleProduct,
  getAppleProductCapacity,
  payerCapacityCeiling,
  assertAthleteCapacity,
  isStrictAppleCapacityUpgrade,
  type AppleTierCeiling,
} from "@/lib/subscriptions/apple-capacity";
import { APPLE_PRODUCT_CATALOG } from "@/lib/subscriptions/apple-product-catalog";

const PAYER_ID = "eeeeeeee-0000-4000-8000-000000000005";
const CATALOG_FLAG = "APPLE_CATALOG_ACTIVE";

beforeEach(() => {
  getActiveAppleProductIdMock.mockReset();
  delete process.env[CATALOG_FLAG];
});

// ---------------------------------------------------------------------------
// APPLE_PRODUCT_CAPACITY — shape pin
// ---------------------------------------------------------------------------

describe("APPLE_PRODUCT_CAPACITY", () => {
  it("is an object (Record<string, AppleTierCeiling>)", () => {
    expect(typeof APPLE_PRODUCT_CAPACITY).toBe("object");
    expect(APPLE_PRODUCT_CAPACITY).not.toBeNull();
  });

  it("starts empty — no Apple product ids are mapped yet (Open Item P2)", () => {
    expect(Object.keys(APPLE_PRODUCT_CAPACITY)).toHaveLength(0);
  });

  it("is frozen (Object.isFrozen) so it cannot be mutated at runtime", () => {
    expect(Object.isFrozen(APPLE_PRODUCT_CAPACITY)).toBe(true);
  });

  it("type-pins the ceiling range to 1-5 (compile-time; this assignment must typecheck)", () => {
    const values: AppleTierCeiling[] = [1, 2, 3, 4, 5];
    expect(values).toHaveLength(5);
    // @ts-expect-error — 6 is out of the 1-5 range, proving the type is pinned.
    const invalid: AppleTierCeiling = 6;
    expect(invalid).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// capacityForAppleProduct
// ---------------------------------------------------------------------------

describe("capacityForAppleProduct", () => {
  it("returns null for an unknown product id (fail-open-for-adds)", () => {
    expect(capacityForAppleProduct("unmapped_product_id")).toBeNull();
  });

  it("warns when the product id is unknown", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    capacityForAppleProduct("unmapped_product_id");
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0]?.[0]).toMatch(/unmapped_product_id/);
    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// payerCapacityCeiling — provider invariant
// ---------------------------------------------------------------------------

describe("payerCapacityCeiling", () => {
  it("returns null for provider 'stripe' regardless of any appleProductId noise (never capped)", () => {
    expect(
      payerCapacityCeiling({ provider: "stripe", appleProductId: "anything" }),
    ).toBeNull();
  });

  it("returns null for provider 'comp' (never capped)", () => {
    expect(payerCapacityCeiling({ provider: "comp" })).toBeNull();
  });

  it("returns null for provider 'none'", () => {
    expect(payerCapacityCeiling({ provider: "none" })).toBeNull();
  });

  it("returns null for provider 'apple' with no product id supplied", () => {
    expect(payerCapacityCeiling({ provider: "apple" })).toBeNull();
  });

  it("returns null for provider 'apple' with an unmapped product id (empty map today)", () => {
    expect(
      payerCapacityCeiling({ provider: "apple", appleProductId: "tier_1" }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// assertAthleteCapacity — inert with the current empty map
// ---------------------------------------------------------------------------

describe("assertAthleteCapacity", () => {
  it("allows the add when the payer has no active Apple subscription (non-Apple payer)", async () => {
    getActiveAppleProductIdMock.mockResolvedValue(null);
    const result = await assertAthleteCapacity({} as never, PAYER_ID, 10);
    expect(result).toEqual({ allowed: true });
  });

  it("allows the add for an Apple payer too, since the capacity map is currently empty (inert)", async () => {
    getActiveAppleProductIdMock.mockResolvedValue("tier_3_placeholder");
    const result = await assertAthleteCapacity({} as never, PAYER_ID, 4);
    expect(result).toEqual({ allowed: true });
  });

  it("still allows even at a very high athlete count (no ceiling data to enforce)", async () => {
    getActiveAppleProductIdMock.mockResolvedValue("tier_5_placeholder");
    const result = await assertAthleteCapacity({} as never, PAYER_ID, 999);
    expect(result).toEqual({ allowed: true });
  });

  it("passes the service client and payerId through to getActiveAppleProductId", async () => {
    getActiveAppleProductIdMock.mockResolvedValue(null);
    const service = { marker: "service" };
    await assertAthleteCapacity(service as never, PAYER_ID, 0);
    expect(getActiveAppleProductIdMock).toHaveBeenCalledWith(service, PAYER_ID);
  });
});

// ---------------------------------------------------------------------------
// isStrictAppleCapacityUpgrade (FV-586, KC decision D3) — fail-closed with
// the current empty APPLE_PRODUCT_CAPACITY map. A true "real upgrade" case
// needs a populated map (Open Item P2, not yet decided) — the caller-facing
// allow/refuse behavior with real product ids is covered by the mocked unit
// tests in __tests__/actions/apple-subscription.test.ts.
// ---------------------------------------------------------------------------

describe("isStrictAppleCapacityUpgrade", () => {
  it("refuses (false) when the payer has no active Apple product", async () => {
    getActiveAppleProductIdMock.mockResolvedValue(null);
    const result = await isStrictAppleCapacityUpgrade(
      {} as never,
      PAYER_ID,
      "tier_5_athletes",
    );
    expect(result).toBe(false);
  });

  it("refuses (false) when both the current and requested product ids are unmapped (fail-closed, empty map today)", async () => {
    getActiveAppleProductIdMock.mockResolvedValue("tier_1_athlete");
    const result = await isStrictAppleCapacityUpgrade(
      {} as never,
      PAYER_ID,
      "tier_5_athletes",
    );
    expect(result).toBe(false);
  });

  it("refuses (false) requesting the SAME product id the payer already holds", async () => {
    getActiveAppleProductIdMock.mockResolvedValue("tier_1_athlete");
    const result = await isStrictAppleCapacityUpgrade(
      {} as never,
      PAYER_ID,
      "tier_1_athlete",
    );
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// FV-593 — catalog activation via APPLE_CATALOG_ACTIVE
// ---------------------------------------------------------------------------

function catalogProductId(capacity: AppleTierCeiling, interval: "month" | "year"): string {
  const entry = APPLE_PRODUCT_CATALOG.find(
    (e) => e.athleteCapacity === capacity && e.interval === interval,
  );
  if (!entry) throw new Error(`no catalog entry for capacity ${capacity}/${interval}`);
  return entry.productId;
}

describe("getAppleProductCapacity / capacityForAppleProduct — flag unset (default)", () => {
  it("getAppleProductCapacity() is an empty, frozen object", () => {
    const map = getAppleProductCapacity();
    expect(Object.keys(map)).toHaveLength(0);
    expect(Object.isFrozen(map)).toBe(true);
  });

  it("every catalog product id resolves to null", () => {
    for (const entry of APPLE_PRODUCT_CATALOG) {
      expect(capacityForAppleProduct(entry.productId)).toBeNull();
    }
  });

  it("assertAthleteCapacity stays { allowed: true } for a payer holding a real catalog product id, at any count", async () => {
    getActiveAppleProductIdMock.mockResolvedValue(catalogProductId(1, "month"));
    const result = await assertAthleteCapacity({} as never, PAYER_ID, 50);
    expect(result).toEqual({ allowed: true });
  });
});

describe("getAppleProductCapacity / capacityForAppleProduct — flag set to \"1\"", () => {
  beforeEach(() => {
    process.env[CATALOG_FLAG] = "1";
  });

  it("capacityForAppleProduct returns the catalog capacity for every catalog id", () => {
    for (const entry of APPLE_PRODUCT_CATALOG) {
      expect(capacityForAppleProduct(entry.productId)).toBe(entry.athleteCapacity);
    }
  });

  it("capacityForAppleProduct still returns null for an unknown id", () => {
    expect(capacityForAppleProduct("not.a.real.product")).toBeNull();
  });

  it("assertAthleteCapacity blocks at the ceiling and allows below it", async () => {
    const oneAthleteProduct = catalogProductId(1, "month");
    getActiveAppleProductIdMock.mockResolvedValue(oneAthleteProduct);

    const atCeiling = await assertAthleteCapacity({} as never, PAYER_ID, 1);
    expect(atCeiling).toEqual({ allowed: false, reason: "capacity_reached" });

    const belowCeiling = await assertAthleteCapacity({} as never, PAYER_ID, 0);
    expect(belowCeiling).toEqual({ allowed: true });
  });

  describe("isStrictAppleCapacityUpgrade semantics (D3)", () => {
    it("1 -> 2 athletes is an allowed upgrade", async () => {
      getActiveAppleProductIdMock.mockResolvedValue(catalogProductId(1, "month"));
      const result = await isStrictAppleCapacityUpgrade(
        {} as never,
        PAYER_ID,
        catalogProductId(2, "month"),
      );
      expect(result).toBe(true);
    });

    it("2 -> 1 athletes is refused (a downgrade, not an upgrade)", async () => {
      getActiveAppleProductIdMock.mockResolvedValue(catalogProductId(2, "month"));
      const result = await isStrictAppleCapacityUpgrade(
        {} as never,
        PAYER_ID,
        catalogProductId(1, "month"),
      );
      expect(result).toBe(false);
    });

    it("2 -> 2 athletes (e.g. monthly -> yearly crossgrade) is refused (not strictly greater)", async () => {
      getActiveAppleProductIdMock.mockResolvedValue(catalogProductId(2, "month"));
      const result = await isStrictAppleCapacityUpgrade(
        {} as never,
        PAYER_ID,
        catalogProductId(2, "year"),
      );
      expect(result).toBe(false);
    });
  });
});
