/**
 * @vitest-environment jsdom
 *
 * FV-712: syncAppleTransactions — finish-after-confirm, single-flight, backoff.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getUnfinishedMock, finishMock, submitMock } = vi.hoisted(() => ({
  getUnfinishedMock: vi.fn(),
  finishMock: vi.fn(),
  submitMock: vi.fn(),
}));

vi.mock("@/lib/native/apple-iap", () => ({
  getUnfinishedTransactions: getUnfinishedMock,
  finishTransactions: finishMock,
}));
vi.mock("@/lib/actions/apple-subscription", () => ({
  submitApplePurchase: submitMock,
}));

import {
  __resetAppleSyncStateForTests,
  syncAppleTransactions,
} from "@/lib/native/apple-transaction-sync";

const TXNS = [
  {
    transactionId: "id-new",
    originalTransactionId: "orig-1",
    signedTransactionInfo: "SECRET.JWS.NEW",
    signedRenewalInfo: "SECRET.RENEW",
  },
  { transactionId: "id-old", originalTransactionId: "orig-1", signedTransactionInfo: "SECRET.JWS.OLD" },
];

beforeEach(() => {
  __resetAppleSyncStateForTests();
  getUnfinishedMock.mockResolvedValue({ ok: true, transactions: TXNS });
  finishMock.mockResolvedValue({ ok: true, finished: 2 });
  submitMock.mockResolvedValue({ ok: true, applied: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("syncAppleTransactions", () => {
  it("unsupported when the bridge is missing or old", async () => {
    getUnfinishedMock.mockResolvedValue({ ok: false, error: "unsupported" });
    expect(await syncAppleTransactions()).toEqual({ status: "unsupported" });
    getUnfinishedMock.mockResolvedValue({ ok: false, error: "bridge_unavailable" });
    expect(await syncAppleTransactions({ force: true })).toEqual({ status: "unsupported" });
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("none for an empty list", async () => {
    getUnfinishedMock.mockResolvedValue({ ok: true, transactions: [] });
    expect(await syncAppleTransactions()).toEqual({ status: "none" });
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("submits only the newest, then finishes ALL ids", async () => {
    expect(await syncAppleTransactions()).toEqual({ status: "synced", applied: true });
    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(submitMock).toHaveBeenCalledWith({
      signedTransactionInfo: "SECRET.JWS.NEW",
      signedRenewalInfo: "SECRET.RENEW",
    });
    expect(finishMock).toHaveBeenCalledWith(["id-new", "id-old"]);
  });

  it("reports applied:false and still finishes", async () => {
    submitMock.mockResolvedValue({ ok: true, applied: false });
    expect(await syncAppleTransactions()).toEqual({ status: "synced", applied: false });
    expect(finishMock).toHaveBeenCalledTimes(1);
  });

  it("a failed finish does not change a synced result", async () => {
    finishMock.mockResolvedValue({ ok: false, error: "failed" });
    expect(await syncAppleTransactions()).toEqual({ status: "synced", applied: true });
  });

  it("deferred and finishes nothing when submit is not ok", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    submitMock.mockResolvedValue({ ok: false, error: "internal_error" });
    expect(await syncAppleTransactions()).toEqual({ status: "deferred", error: "internal_error" });
    expect(finishMock).not.toHaveBeenCalled();
  });

  it("deferred when the action throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    submitMock.mockRejectedValue(new Error("network"));
    expect(await syncAppleTransactions()).toEqual({ status: "deferred", error: "thrown" });
    expect(finishMock).not.toHaveBeenCalled();
  });

  it("single-flight: concurrent calls share one run", async () => {
    let release: (v: unknown) => void = () => {};
    submitMock.mockImplementation(() => new Promise((r) => (release = r)));
    const a = syncAppleTransactions();
    const b = syncAppleTransactions({ force: true });
    expect(a).toBe(b);
    await vi.waitFor(() => expect(submitMock).toHaveBeenCalled());
    release({ ok: true, applied: true });
    await a;
    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(getUnfinishedMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    "unauthenticated",
    "not_authorized",
    "token_mismatch",
    "ownership_conflict",
    "environment_rejected",
    "invalid_input",
    "verification_failed",
  ])("rejection %s waits 15 minutes, then tries again; force bypasses", async (code) => {
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    submitMock.mockResolvedValue({ ok: false, error: code });
    expect(await syncAppleTransactions()).toEqual({ status: "deferred", error: code });

    vi.advanceTimersByTime(14 * 60_000);
    expect(await syncAppleTransactions()).toEqual({ status: "skipped" });
    expect(submitMock).toHaveBeenCalledTimes(1);

    expect(await syncAppleTransactions({ force: true })).toEqual({ status: "deferred", error: code });
    expect(submitMock).toHaveBeenCalledTimes(2);

    // The forced attempt restarted the wait; once it passes, a plain call runs.
    vi.advanceTimersByTime(15 * 60_000 + 1);
    expect(await syncAppleTransactions()).toEqual({ status: "deferred", error: code });
    expect(submitMock).toHaveBeenCalledTimes(3);
  });

  it("a successful forced run clears the wait (sign-in recovery)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    submitMock.mockResolvedValue({ ok: false, error: "unauthenticated" });
    await syncAppleTransactions();
    expect(await syncAppleTransactions()).toEqual({ status: "skipped" });

    submitMock.mockResolvedValue({ ok: true, applied: true });
    expect(await syncAppleTransactions({ force: true })).toEqual({ status: "synced", applied: true });
    expect(window.sessionStorage.getItem("fv_apple_sync_not_before")).toBeNull();
    expect(await syncAppleTransactions()).toEqual({ status: "synced", applied: true });
  });

  it("the wait survives a fresh module load in the same app process", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    submitMock.mockResolvedValue({ ok: false, error: "internal_error" });
    await syncAppleTransactions();
    const stored = window.sessionStorage.getItem("fv_apple_sync_not_before");
    expect(Number(stored)).toBeGreaterThan(Date.now());

    vi.resetModules();
    const fresh = await import("@/lib/native/apple-transaction-sync");
    expect(await fresh.syncAppleTransactions()).toEqual({ status: "skipped" });
    expect(submitMock).toHaveBeenCalledTimes(1);
  });

  it("stores only a timestamp, never transaction data", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    submitMock.mockResolvedValue({ ok: false, error: "token_mismatch" });
    await syncAppleTransactions();
    const dump = JSON.stringify({ ...window.sessionStorage });
    expect(dump).not.toContain("SECRET");
    expect(dump).not.toContain("id-new");
    expect(Object.keys(window.sessionStorage)).toEqual(["fv_apple_sync_not_before"]);
  });

  it("the wait still applies when storage throws (in-memory fallback)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    submitMock.mockResolvedValue({ ok: false, error: "unauthenticated" });
    await syncAppleTransactions();
    expect(await syncAppleTransactions()).toEqual({ status: "skipped" });
  });

  it("finishes only the submitted subscription's transactions", async () => {
    getUnfinishedMock.mockResolvedValue({
      ok: true,
      transactions: [
        { transactionId: "a3", originalTransactionId: "A", signedTransactionInfo: "SECRET.A3" },
        { transactionId: "b1", originalTransactionId: "B", signedTransactionInfo: "SECRET.B1" },
        { transactionId: "a2", originalTransactionId: "A", signedTransactionInfo: "SECRET.A2" },
      ],
    });
    await syncAppleTransactions();
    expect(submitMock).toHaveBeenCalledWith({
      signedTransactionInfo: "SECRET.A3",
      signedRenewalInfo: undefined,
    });
    expect(finishMock).toHaveBeenCalledWith(["a3", "a2"]);
  });

  it("finishes only the submitted transaction when the native payload has no original id", async () => {
    getUnfinishedMock.mockResolvedValue({
      ok: true,
      transactions: [
        { transactionId: "n1", signedTransactionInfo: "SECRET.N1" },
        { transactionId: "n0", signedTransactionInfo: "SECRET.N0" },
      ],
    });
    await syncAppleTransactions();
    expect(finishMock).toHaveBeenCalledWith(["n1"]);
  });

  it("transient errors throttle non-forced calls to one per 60s; force bypasses", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    submitMock.mockResolvedValue({ ok: false, error: "internal_error" });
    await syncAppleTransactions();
    expect(await syncAppleTransactions()).toEqual({ status: "skipped" });

    vi.advanceTimersByTime(59_000);
    expect(await syncAppleTransactions()).toEqual({ status: "skipped" });
    expect(submitMock).toHaveBeenCalledTimes(1);

    expect(await syncAppleTransactions({ force: true })).toEqual({
      status: "deferred",
      error: "internal_error",
    });
    expect(submitMock).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(60_001);
    await syncAppleTransactions();
    expect(submitMock).toHaveBeenCalledTimes(3);
  });

  it("never logs JWS content or transaction ids", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    submitMock.mockResolvedValue({ ok: false, error: "verification_failed" });
    await syncAppleTransactions();
    submitMock.mockRejectedValue(new Error("SECRET.JWS.NEW id-new"));
    await syncAppleTransactions({ force: true });
    const out = JSON.stringify([...warn.mock.calls, ...log.mock.calls, ...error.mock.calls]);
    expect(out).not.toMatch(/SECRET|id-new|id-old/);
    expect(out).toContain("verification_failed");
  });
});
