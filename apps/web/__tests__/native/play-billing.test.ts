/**
 * @vitest-environment jsdom
 *
 * Unit tests for lib/native/play-billing.ts (FV-664) — the TS wrapper around
 * the injected `window.Capacitor.Plugins.FVPlayBillingPlugin`. Mirrors the
 * apple-iap tests: a fake `window.Capacitor` is installed (or omitted).
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getProducts,
  isPlayBillingBridgeAvailable,
  manageSubscriptions,
  purchase,
  restore,
} from "@/lib/native/play-billing";

type FakeWindow = typeof window & {
  Capacitor?: { Plugins?: { FVPlayBillingPlugin?: Record<string, unknown> } };
};

function installBridge(plugin: Record<string, unknown>): void {
  (window as FakeWindow).Capacitor = { Plugins: { FVPlayBillingPlugin: plugin } };
}

afterEach(() => {
  delete (window as FakeWindow).Capacitor;
  vi.restoreAllMocks();
});

const ACCOUNT = "0b3c2f5e9a7d4c1e8f6a5b4c3d2e1f00";
const TOKEN = "tok-SECRET-purchase-token";
const INPUT = { productId: "family.1", basePlanId: "monthly", obfuscatedAccountId: ACCOUNT };

describe("isPlayBillingBridgeAvailable", () => {
  it("is false without window.Capacitor, and without the plugin", () => {
    expect(isPlayBillingBridgeAvailable()).toBe(false);
    (window as FakeWindow).Capacitor = { Plugins: {} };
    expect(isPlayBillingBridgeAvailable()).toBe(false);
  });

  it("is true when the plugin is present", () => {
    installBridge({});
    expect(isPlayBillingBridgeAvailable()).toBe(true);
  });
});

describe("bridge_unavailable (plugin missing)", () => {
  it("every method resolves bridge_unavailable and never throws", async () => {
    expect(await getProducts(["family.1"])).toEqual({ ok: false, error: "bridge_unavailable" });
    expect(await purchase(INPUT)).toEqual({ status: "error", error: "bridge_unavailable" });
    expect(await restore()).toEqual({ ok: false, error: "bridge_unavailable" });
    expect(await manageSubscriptions()).toEqual({ ok: false, error: "bridge_unavailable" });
  });
});

describe("getProducts", () => {
  const phase = {
    formattedPrice: "$4.99",
    priceAmountMicros: 4_990_000,
    priceCurrencyCode: "USD",
    billingPeriod: "P1M",
    billingCycleCount: 0,
    recurrenceMode: 1,
  };

  it("parses products, offers (offerId null for no offer) and pricing phases from Play", async () => {
    const getProductsNative = vi.fn(async () => ({
      ok: true,
      products: [
        {
          productId: "family.1",
          name: "1 Athlete",
          title: "1 Athlete (From Victory)",
          offers: [
            { basePlanId: "monthly", offerId: null, offerToken: "tok-m", pricingPhases: [phase] },
            {
              basePlanId: "yearly",
              offerId: "trial-7d",
              offerToken: "tok-y-trial",
              pricingPhases: [
                { ...phase, formattedPrice: "Free", priceAmountMicros: 0, billingPeriod: "P7D", billingCycleCount: 1, recurrenceMode: 3 },
                { ...phase, formattedPrice: "$49.00", priceAmountMicros: 49_000_000, billingPeriod: "P1Y" },
              ],
            },
          ],
        },
      ],
    }));
    installBridge({ getProducts: getProductsNative });
    const result = await getProducts(["family.1"]);
    expect(getProductsNative).toHaveBeenCalledWith({ productIds: ["family.1"] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const product = result.products[0];
    expect(product?.productId).toBe("family.1");
    expect(product?.offers[0]).toMatchObject({ basePlanId: "monthly", offerId: null, offerToken: "tok-m" });
    expect(product?.offers[1]?.pricingPhases.map((p) => p.billingPeriod)).toEqual(["P7D", "P1Y"]);
    expect(product?.offers[1]?.pricingPhases[0]?.formattedPrice).toBe("Free");
  });

  it("drops malformed products/offers/phases instead of passing garbage through", async () => {
    installBridge({
      getProducts: vi.fn(async () => ({
        ok: true,
        products: [
          null,
          { productId: 5 },
          {
            productId: "family.2",
            offers: [
              { basePlanId: "monthly", offerToken: "t", pricingPhases: [] },
              { basePlanId: "monthly", pricingPhases: [phase] },
              { basePlanId: "yearly", offerToken: "t2", pricingPhases: [{ formattedPrice: "$1" }, phase] },
            ],
          },
        ],
      })),
    });
    const result = await getProducts(["family.2"]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.offers).toHaveLength(1);
    expect(result.products[0]?.offers[0]?.pricingPhases).toHaveLength(1);
  });

  it("maps native errors, unknown error strings, junk payloads and rejections", async () => {
    installBridge({ getProducts: vi.fn(async () => ({ ok: false, error: "network" })) });
    expect(await getProducts(["a"])).toEqual({ ok: false, error: "network" });
    installBridge({ getProducts: vi.fn(async () => ({ ok: false, error: "weird" })) });
    expect(await getProducts(["a"])).toEqual({ ok: false, error: "unknown" });
    installBridge({ getProducts: vi.fn(async () => "nope") });
    expect(await getProducts(["a"])).toEqual({ ok: false, error: "unknown" });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    installBridge({ getProducts: vi.fn(async () => { throw new Error("boom"); }) });
    expect(await getProducts(["a"])).toEqual({ ok: false, error: "unknown" });
  });
});

describe("purchase", () => {
  it("sends the exact base plan + offer + account id (offer omitted when absent/null)", async () => {
    const native = vi.fn(async () => ({ status: "cancelled" }));
    installBridge({ purchase: native });
    await purchase(INPUT);
    expect(native).toHaveBeenLastCalledWith({ productId: "family.1", basePlanId: "monthly", obfuscatedAccountId: ACCOUNT });
    await purchase({ ...INPUT, offerId: null });
    expect(native).toHaveBeenLastCalledWith({ productId: "family.1", basePlanId: "monthly", obfuscatedAccountId: ACCOUNT });
    await purchase({ ...INPUT, basePlanId: "yearly", offerId: "trial-7d" });
    expect(native).toHaveBeenLastCalledWith({ productId: "family.1", basePlanId: "yearly", offerId: "trial-7d", obfuscatedAccountId: ACCOUNT });
  });

  it("forwards replace and returns the purchased token", async () => {
    const native = vi.fn(async () => ({ status: "purchased", purchaseToken: "tok", productId: "family.2" }));
    installBridge({ purchase: native });
    const replace = { oldPurchaseToken: "old", mode: "DEFERRED" as const };
    const result = await purchase({ ...INPUT, productId: "family.2", replace });
    expect(native).toHaveBeenCalledWith(expect.objectContaining({ replace }));
    expect(result).toEqual({ status: "purchased", purchaseToken: "tok", productId: "family.2" });
  });

  it("passes cancelled and pending through", async () => {
    installBridge({ purchase: vi.fn(async () => ({ status: "pending" })) });
    expect(await purchase(INPUT)).toEqual({ status: "pending" });
    installBridge({ purchase: vi.fn(async () => ({ status: "cancelled" })) });
    expect(await purchase(INPUT)).toEqual({ status: "cancelled" });
  });

  it("reports a scheduled (DEFERRED) change, with the token only when Play supplied a token and product together", async () => {
    installBridge({
      purchase: vi.fn().mockResolvedValue({ status: "deferred", purchaseToken: "new-tok", productId: "family.3" }),
    });
    expect(await purchase(INPUT)).toEqual({ status: "deferred", purchaseToken: "new-tok", productId: "family.3" });
    for (const payload of [
      { status: "deferred", purchaseToken: null, productId: null },
      { status: "deferred" },
      { status: "deferred", purchaseToken: "new-tok", productId: null },
      { status: "deferred", purchaseToken: "", productId: "family.3" },
    ]) {
      installBridge({ purchase: vi.fn().mockResolvedValue(payload) });
      expect(await purchase(INPUT)).toEqual({ status: "deferred", purchaseToken: null, productId: null });
    }
  });

  it("passes each typed error through and coerces unknown ones", async () => {
    for (const error of ["already_owned", "unavailable", "network", "developer_error", "unknown"]) {
      installBridge({ purchase: vi.fn(async () => ({ status: "error", error })) });
      expect(await purchase(INPUT)).toEqual({ status: "error", error });
    }
    installBridge({ purchase: vi.fn(async () => ({ status: "error", error: "???" })) });
    expect(await purchase(INPUT)).toEqual({ status: "error", error: "unknown" });
  });

  it("never reports success without a token and product id", async () => {
    installBridge({ purchase: vi.fn(async () => ({ status: "purchased", productId: "family.1" })) });
    expect(await purchase(INPUT)).toEqual({ status: "error", error: "unknown" });
    installBridge({ purchase: vi.fn(async () => undefined) });
    expect(await purchase(INPUT)).toEqual({ status: "error", error: "unknown" });
  });

  it("requires obfuscatedAccountId (1..64 chars) without calling the bridge", async () => {
    const native = vi.fn(async () => ({ status: "cancelled" }));
    installBridge({ purchase: native });
    expect(await purchase({ ...INPUT, obfuscatedAccountId: "" })).toEqual({ status: "error", error: "developer_error" });
    expect(await purchase({ ...INPUT, obfuscatedAccountId: "   " })).toEqual({ status: "error", error: "developer_error" });
    expect(await purchase({ ...INPUT, obfuscatedAccountId: "a".repeat(65) })).toEqual({ status: "error", error: "developer_error" });
    expect(native).not.toHaveBeenCalled();
    expect(await purchase({ ...INPUT, obfuscatedAccountId: "a".repeat(64) })).toEqual({ status: "cancelled" });
  });

  it("maps a native INVALID_ARGUMENT rejection to developer_error, others to unknown, never leaking secrets to the console", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    installBridge({ purchase: vi.fn(async () => { throw { code: "INVALID_ARGUMENT", message: `bad ${ACCOUNT}` }; }) });
    expect(await purchase(INPUT)).toEqual({ status: "error", error: "developer_error" });
    installBridge({ purchase: vi.fn(async () => { throw new Error(`boom ${ACCOUNT}`); }) });
    expect(await purchase(INPUT)).toEqual({ status: "error", error: "unknown" });
    installBridge({ purchase: vi.fn(async () => { throw { code: "INVALID_ARGUMENT", message: `bad ${TOKEN}` }; }) });
    expect(
      await purchase({ ...INPUT, replace: { oldPurchaseToken: TOKEN, mode: "DEFERRED" } }),
    ).toEqual({ status: "error", error: "developer_error" });
    expect(warn).toHaveBeenCalled();
    // Every argument of every console call, not just the first.
    const logged = warn.mock.calls.flat().map(String).join(" ");
    expect(logged).not.toContain(ACCOUNT);
    expect(logged).not.toContain(TOKEN);
  });

  it("never throws on a non-object input, even with the bridge present", async () => {
    const native = vi.fn();
    installBridge({ purchase: native });
    for (const bad of [undefined, null, "family.1", 7, []]) {
      // reason: deliberately violating the type to prove the runtime guard.
      expect(await purchase(bad as never)).toEqual({ status: "error", error: "developer_error" });
    }
    expect(native).not.toHaveBeenCalled();
  });
});

describe("restore", () => {
  it("parses purchases with the obfuscated account id when present", async () => {
    installBridge({
      restore: vi.fn(async () => ({
        ok: true,
        purchases: [
          { purchaseToken: "t1", productIds: ["family.1"], purchaseState: "purchased", acknowledged: true, autoRenewing: true, obfuscatedAccountId: ACCOUNT },
          { purchaseToken: "t2", productIds: ["family.2"], purchaseState: "weird", acknowledged: "yes", autoRenewing: false, obfuscatedAccountId: null },
          { productIds: ["x"] },
        ],
      })),
    });
    expect(await restore()).toEqual({
      ok: true,
      purchases: [
        { purchaseToken: "t1", productIds: ["family.1"], purchaseState: "purchased", acknowledged: true, autoRenewing: true, obfuscatedAccountId: ACCOUNT },
        { purchaseToken: "t2", productIds: ["family.2"], purchaseState: "unspecified", acknowledged: false, autoRenewing: false, obfuscatedAccountId: null },
      ],
    });
  });

  it("treats an empty list as ok, and maps errors and rejections", async () => {
    installBridge({ restore: vi.fn(async () => ({ ok: true, purchases: [] })) });
    expect(await restore()).toEqual({ ok: true, purchases: [] });
    installBridge({ restore: vi.fn(async () => ({ ok: false, error: "unavailable" })) });
    expect(await restore()).toEqual({ ok: false, error: "unavailable" });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    installBridge({ restore: vi.fn(async () => { throw new Error("x"); }) });
    expect(await restore()).toEqual({ ok: false, error: "unknown" });
  });
});

describe("manageSubscriptions", () => {
  it("passes productId only when given and reports ok", async () => {
    const native = vi.fn(async () => ({ ok: true }));
    installBridge({ manageSubscriptions: native });
    expect(await manageSubscriptions()).toEqual({ ok: true });
    expect(native).toHaveBeenLastCalledWith({});
    expect(await manageSubscriptions("family.1")).toEqual({ ok: true });
    expect(native).toHaveBeenLastCalledWith({ productId: "family.1" });
  });

  it("maps failures and rejections", async () => {
    installBridge({ manageSubscriptions: vi.fn(async () => ({ ok: false, error: "unavailable" })) });
    expect(await manageSubscriptions()).toEqual({ ok: false, error: "unavailable" });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    installBridge({ manageSubscriptions: vi.fn(async () => { throw new Error("x"); }) });
    expect(await manageSubscriptions()).toEqual({ ok: false, error: "unknown" });
  });
});
