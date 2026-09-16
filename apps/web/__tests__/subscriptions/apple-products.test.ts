/**
 * Unit tests for lib/subscriptions/apple-products.ts (FV-572).
 *
 * Covers the defensive-parsing contract for NEXT_PUBLIC_APPLE_PRODUCTS:
 * absent / malformed JSON / non-array / empty array / per-entry validation,
 * and the "no hardcoded product ids in production code" invariant.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { getConfiguredAppleProducts } from "@/lib/subscriptions/apple-products";

const ENV_KEY = "NEXT_PUBLIC_APPLE_PRODUCTS";

afterEach(() => {
  delete process.env[ENV_KEY];
});

describe("getConfiguredAppleProducts", () => {
  it("returns [] when the env var is absent entirely (shipped state today)", () => {
    delete process.env[ENV_KEY];
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("returns [] for an empty string", () => {
    process.env[ENV_KEY] = "";
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("returns [] for a whitespace-only string", () => {
    process.env[ENV_KEY] = "   ";
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("returns [] for malformed JSON", () => {
    process.env[ENV_KEY] = "{not valid json";
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("returns [] when the JSON parses but is not an array", () => {
    process.env[ENV_KEY] = JSON.stringify({ productId: "test.fv.tier1.monthly" });
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("returns [] for a valid empty array", () => {
    process.env[ENV_KEY] = "[]";
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("parses a valid single-entry array", () => {
    process.env[ENV_KEY] = JSON.stringify([
      { productId: "test.fv.tier1.monthly", athleteCapacity: 1, displayName: "1 Athlete" },
    ]);
    expect(getConfiguredAppleProducts()).toEqual([
      { productId: "test.fv.tier1.monthly", athleteCapacity: 1, displayName: "1 Athlete" },
    ]);
  });

  it("parses a valid multi-entry array and preserves config order", () => {
    process.env[ENV_KEY] = JSON.stringify([
      { productId: "test.fv.tier2.monthly", athleteCapacity: 2 },
      { productId: "test.fv.tier1.monthly", athleteCapacity: 1, displayName: "1 Athlete" },
    ]);
    const result = getConfiguredAppleProducts();
    expect(result.map((p) => p.productId)).toEqual([
      "test.fv.tier2.monthly",
      "test.fv.tier1.monthly",
    ]);
  });

  it("allows displayName to be omitted", () => {
    process.env[ENV_KEY] = JSON.stringify([
      { productId: "test.fv.tier1.monthly", athleteCapacity: 1 },
    ]);
    expect(getConfiguredAppleProducts()).toEqual([
      { productId: "test.fv.tier1.monthly", athleteCapacity: 1 },
    ]);
  });

  it("drops an entry with a missing productId", () => {
    process.env[ENV_KEY] = JSON.stringify([{ athleteCapacity: 1 }]);
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("drops an entry with an empty-string productId", () => {
    process.env[ENV_KEY] = JSON.stringify([{ productId: "   ", athleteCapacity: 1 }]);
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("drops an entry with a non-string productId", () => {
    process.env[ENV_KEY] = JSON.stringify([{ productId: 123, athleteCapacity: 1 }]);
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("drops an entry with a missing athleteCapacity", () => {
    process.env[ENV_KEY] = JSON.stringify([{ productId: "test.fv.tier1.monthly" }]);
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("drops an entry with a non-integer athleteCapacity", () => {
    process.env[ENV_KEY] = JSON.stringify([
      { productId: "test.fv.tier1.monthly", athleteCapacity: 1.5 },
    ]);
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("drops an entry with athleteCapacity < 1", () => {
    process.env[ENV_KEY] = JSON.stringify([
      { productId: "test.fv.tier1.monthly", athleteCapacity: 0 },
    ]);
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("drops an entry with a non-string displayName", () => {
    process.env[ENV_KEY] = JSON.stringify([
      { productId: "test.fv.tier1.monthly", athleteCapacity: 1, displayName: 42 },
    ]);
    expect(getConfiguredAppleProducts()).toEqual([]);
  });

  it("keeps valid entries and drops only the malformed ones in a mixed array", () => {
    process.env[ENV_KEY] = JSON.stringify([
      { productId: "test.fv.tier1.monthly", athleteCapacity: 1 },
      { athleteCapacity: 2 }, // missing productId
      { productId: "test.fv.tier3.monthly", athleteCapacity: 3 },
    ]);
    const result = getConfiguredAppleProducts();
    expect(result.map((p) => p.productId)).toEqual([
      "test.fv.tier1.monthly",
      "test.fv.tier3.monthly",
    ]);
  });

  it("drops non-object array entries (string, number, null, array)", () => {
    process.env[ENV_KEY] = JSON.stringify(["nope", 1, null, []]);
    expect(getConfiguredAppleProducts()).toEqual([]);
  });
});

describe("apple-products.ts — no hardcoded production Apple product ids", () => {
  it("the module source never contains a real-looking App Store Connect product id literal", () => {
    const source = readFileSync(
      resolve(__dirname, "../../lib/subscriptions/apple-products.ts"),
      "utf8",
    );
    // Real App Store Connect product ids for this app would follow the
    // bundle-id-prefixed reverse-DNS convention, e.g.
    // "com.fromvictoryapp.app.<tier>.<period>". Fail the test if any such
    // literal ever gets pasted in here — the whole point of this file is
    // that product ids come from the environment, never from source.
    expect(source).not.toMatch(/com\.fromvictoryapp\.app\.\S*(monthly|annual|yearly)/i);
  });
});
