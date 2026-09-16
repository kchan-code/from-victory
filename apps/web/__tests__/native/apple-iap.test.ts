/**
 * @vitest-environment jsdom
 *
 * Unit tests for lib/native/apple-iap.ts (FV-572) — the TS bridge wrapper
 * around the injected `window.Capacitor.Plugins.FVAppleIAPPlugin` native
 * plugin. No real Capacitor runtime is available in jsdom, so every test
 * injects (or omits) a fake `window.Capacitor` global to exercise both the
 * "bridge present" and "bridge absent" paths.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getProducts,
  isAppleIapBridgeAvailable,
  manageSubscriptions,
  purchase,
  restore,
} from "@/lib/native/apple-iap";

type FakeWindow = typeof window & {
  Capacitor?: { Plugins?: { FVAppleIAPPlugin?: Record<string, unknown> } };
};

function installBridge(plugin: Record<string, unknown>): void {
  (window as FakeWindow).Capacitor = { Plugins: { FVAppleIAPPlugin: plugin } };
}

afterEach(() => {
  delete (window as FakeWindow).Capacitor;
  vi.restoreAllMocks();
});

describe("isAppleIapBridgeAvailable", () => {
  it("returns false when window.Capacitor is absent", () => {
    expect(isAppleIapBridgeAvailable()).toBe(false);
  });

  it("returns false when Capacitor is present but the plugin is not", () => {
    (window as FakeWindow).Capacitor = { Plugins: {} };
    expect(isAppleIapBridgeAvailable()).toBe(false);
  });

  it("returns true when the plugin is present", () => {
    installBridge({});
    expect(isAppleIapBridgeAvailable()).toBe(true);
  });
});

describe("getProducts", () => {
  it("returns [] when the bridge is unavailable", async () => {
    expect(await getProducts(["test.fv.tier1.monthly"])).toEqual([]);
  });

  it("returns the native products array when the bridge resolves", async () => {
    const products = [
      { productId: "test.fv.tier1.monthly", displayPrice: "$4.99", displayName: "1 Athlete" },
    ];
    installBridge({ getProducts: vi.fn(async () => ({ products })) });
    expect(await getProducts(["test.fv.tier1.monthly"])).toEqual(products);
  });

  it("returns [] and does not throw when the native call rejects", async () => {
    installBridge({
      getProducts: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    await expect(getProducts(["x"])).resolves.toEqual([]);
  });

  it("returns [] when the native result has no products field", async () => {
    installBridge({ getProducts: vi.fn(async () => ({})) });
    expect(await getProducts(["x"])).toEqual([]);
  });
});

describe("purchase", () => {
  const input = { productId: "test.fv.tier1.monthly", appAccountToken: "token-1" };

  it("returns bridge_unavailable when the bridge is missing", async () => {
    expect(await purchase(input)).toEqual({ ok: false, error: "bridge_unavailable" });
  });

  it("passes through a successful native result", async () => {
    installBridge({
      purchase: vi.fn(async () => ({
        ok: true,
        signedTransactionInfo: "jws-txn",
        signedRenewalInfo: "jws-renewal",
      })),
    });
    expect(await purchase(input)).toEqual({
      ok: true,
      signedTransactionInfo: "jws-txn",
      signedRenewalInfo: "jws-renewal",
    });
  });

  it("passes through cancelled without treating it as failed", async () => {
    installBridge({ purchase: vi.fn(async () => ({ ok: false, error: "cancelled" })) });
    expect(await purchase(input)).toEqual({ ok: false, error: "cancelled" });
  });

  it("passes through pending", async () => {
    installBridge({ purchase: vi.fn(async () => ({ ok: false, error: "pending" })) });
    expect(await purchase(input)).toEqual({ ok: false, error: "pending" });
  });

  it("coerces an unrecognized native error string to failed", async () => {
    installBridge({ purchase: vi.fn(async () => ({ ok: false, error: "some_unmapped_code" })) });
    expect(await purchase(input)).toEqual({ ok: false, error: "failed" });
  });

  it("returns failed and does not throw when the native call rejects", async () => {
    installBridge({
      purchase: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    await expect(purchase(input)).resolves.toEqual({ ok: false, error: "failed" });
  });
});

describe("restore", () => {
  it("returns bridge_unavailable when the bridge is missing", async () => {
    expect(await restore()).toEqual({ ok: false, error: "bridge_unavailable" });
  });

  it("passes through the transactions array unmodified (native owns ordering)", async () => {
    const transactions = [
      { signedTransactionInfo: "jws-newest" },
      { signedTransactionInfo: "jws-older", signedRenewalInfo: "jws-renewal" },
    ];
    installBridge({ restore: vi.fn(async () => ({ ok: true, transactions })) });
    expect(await restore()).toEqual({ ok: true, transactions });
  });

  it("returns an empty transactions array as a calm ok:true result", async () => {
    installBridge({ restore: vi.fn(async () => ({ ok: true, transactions: [] })) });
    expect(await restore()).toEqual({ ok: true, transactions: [] });
  });

  it("returns failed and does not throw when the native call rejects", async () => {
    installBridge({
      restore: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    await expect(restore()).resolves.toEqual({ ok: false, error: "failed" });
  });
});

describe("manageSubscriptions", () => {
  it("returns bridge_unavailable when the bridge is missing", async () => {
    expect(await manageSubscriptions()).toEqual({ ok: false, error: "bridge_unavailable" });
  });

  it("returns ok:true when the native sheet opens successfully", async () => {
    installBridge({ manageSubscriptions: vi.fn(async () => ({ ok: true })) });
    expect(await manageSubscriptions()).toEqual({ ok: true });
  });

  it("returns failed and does not throw when the native call rejects", async () => {
    installBridge({
      manageSubscriptions: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    await expect(manageSubscriptions()).resolves.toEqual({ ok: false, error: "failed" });
  });
});
