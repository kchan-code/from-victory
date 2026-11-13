/**
 * @vitest-environment jsdom
 *
 * FV-712: bridge wrappers for unfinished-transaction sync, plus the
 * additive `transactionId` on purchase().
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  finishTransactions,
  getUnfinishedTransactions,
  onTransactionsUpdated,
  purchase,
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

describe("purchase transactionId pass-through", () => {
  it("passes a string transactionId through", async () => {
    installBridge({
      purchase: vi.fn(async () => ({ ok: true, signedTransactionInfo: "j", transactionId: "t1" })),
    });
    expect(await purchase({ productId: "p", appAccountToken: "a" })).toMatchObject({
      ok: true,
      transactionId: "t1",
    });
  });

  it("omits transactionId on old binaries and ignores non-string values", async () => {
    installBridge({ purchase: vi.fn(async () => ({ ok: true, signedTransactionInfo: "j" })) });
    const old = await purchase({ productId: "p", appAccountToken: "a" });
    expect(old.ok && "transactionId" in old).toBe(false);

    installBridge({
      purchase: vi.fn(async () => ({ ok: true, signedTransactionInfo: "j", transactionId: 5 })),
    });
    const bad = await purchase({ productId: "p", appAccountToken: "a" });
    expect(bad.ok && "transactionId" in bad).toBe(false);
  });
});

describe("getUnfinishedTransactions", () => {
  it("bridge_unavailable without a bridge", async () => {
    expect(await getUnfinishedTransactions()).toEqual({ ok: false, error: "bridge_unavailable" });
  });

  it("unsupported on an old binary", async () => {
    installBridge({});
    expect(await getUnfinishedTransactions()).toEqual({ ok: false, error: "unsupported" });
  });

  it("returns entries in order and drops malformed ones", async () => {
    installBridge({
      getUnfinishedTransactions: vi.fn(async () => ({
        ok: true,
        transactions: [
          { transactionId: "2", signedTransactionInfo: "jws2", signedRenewalInfo: "r" },
          { transactionId: 3, signedTransactionInfo: "x" },
          { transactionId: "4", signedTransactionInfo: 9 },
          null,
          { transactionId: "1", signedTransactionInfo: "jws1" },
        ],
      })),
    });
    expect(await getUnfinishedTransactions()).toEqual({
      ok: true,
      transactions: [
        { transactionId: "2", signedTransactionInfo: "jws2", signedRenewalInfo: "r" },
        { transactionId: "1", signedTransactionInfo: "jws1" },
      ],
    });
  });

  it("maps ok:false, junk payloads, and rejection to failed", async () => {
    installBridge({ getUnfinishedTransactions: vi.fn(async () => ({ ok: false, error: "failed" })) });
    expect(await getUnfinishedTransactions()).toEqual({ ok: false, error: "failed" });
    installBridge({ getUnfinishedTransactions: vi.fn(async () => undefined) });
    expect(await getUnfinishedTransactions()).toEqual({ ok: false, error: "failed" });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    installBridge({
      getUnfinishedTransactions: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    expect(await getUnfinishedTransactions()).toEqual({ ok: false, error: "failed" });
  });

  it("ok with non-array transactions yields an empty list", async () => {
    installBridge({ getUnfinishedTransactions: vi.fn(async () => ({ ok: true })) });
    expect(await getUnfinishedTransactions()).toEqual({ ok: true, transactions: [] });
  });
});

describe("finishTransactions", () => {
  it("bridge_unavailable / unsupported", async () => {
    expect(await finishTransactions(["1"])).toEqual({ ok: false, error: "bridge_unavailable" });
    installBridge({});
    expect(await finishTransactions(["1"])).toEqual({ ok: false, error: "unsupported" });
  });

  it("empty list is a no-op ok without calling native", async () => {
    const fn = vi.fn();
    installBridge({ finishTransactions: fn });
    expect(await finishTransactions([])).toEqual({ ok: true, finished: 0 });
    expect(fn).not.toHaveBeenCalled();
  });

  it("forwards ids and returns the finished count", async () => {
    const fn = vi.fn(async () => ({ ok: true, finished: 2 }));
    installBridge({ finishTransactions: fn });
    expect(await finishTransactions(["1", "2"])).toEqual({ ok: true, finished: 2 });
    expect(fn).toHaveBeenCalledWith({ transactionIds: ["1", "2"] });
  });

  it("maps ok:false and rejection to failed", async () => {
    installBridge({ finishTransactions: vi.fn(async () => ({ ok: false, error: "failed" })) });
    expect(await finishTransactions(["1"])).toEqual({ ok: false, error: "failed" });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    installBridge({
      finishTransactions: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    expect(await finishTransactions(["1"])).toEqual({ ok: false, error: "failed" });
  });
});

describe("onTransactionsUpdated", () => {
  it("returns a safe no-op without a bridge or addListener", () => {
    expect(() => onTransactionsUpdated(() => {})()).not.toThrow();
    installBridge({});
    expect(() => onTransactionsUpdated(() => {})()).not.toThrow();
  });

  it("invokes the callback and removes a promise handle on unsubscribe", async () => {
    const remove = vi.fn();
    let fire: () => void = () => {};
    installBridge({
      addListener: vi.fn((_e: string, cb: () => void) => {
        fire = cb;
        return Promise.resolve({ remove });
      }),
    });
    const cb = vi.fn();
    const off = onTransactionsUpdated(cb);
    await Promise.resolve();
    await Promise.resolve();
    fire();
    expect(cb).toHaveBeenCalledTimes(1);
    off();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("removes a sync handle, and one that resolves after unsubscribe", async () => {
    const removeSync = vi.fn();
    installBridge({ addListener: vi.fn(() => ({ remove: removeSync })) });
    const off = onTransactionsUpdated(() => {});
    await Promise.resolve();
    await Promise.resolve();
    off();
    expect(removeSync).toHaveBeenCalledTimes(1);

    const removeLate = vi.fn();
    installBridge({ addListener: vi.fn(() => Promise.resolve({ remove: removeLate })) });
    onTransactionsUpdated(() => {})();
    await Promise.resolve();
    await Promise.resolve();
    expect(removeLate).toHaveBeenCalledTimes(1);
  });

  it("swallows a rejecting addListener", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    installBridge({ addListener: vi.fn(() => Promise.reject(new Error("x"))) });
    const off = onTransactionsUpdated(() => {});
    await Promise.resolve();
    await Promise.resolve();
    expect(() => off()).not.toThrow();
  });
});
