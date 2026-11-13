/**
 * @vitest-environment jsdom
 *
 * FV-712: NativeAppleTransactionSync mount/event/visibility wiring.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

const { availableMock, onUpdatedMock, syncMock, refreshMock } = vi.hoisted(() => ({
  availableMock: vi.fn(),
  onUpdatedMock: vi.fn(),
  syncMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));
vi.mock("@/lib/native/apple-iap", () => ({
  isAppleIapBridgeAvailable: availableMock,
  onTransactionsUpdated: onUpdatedMock,
}));
vi.mock("@/lib/native/apple-transaction-sync", () => ({
  syncAppleTransactions: syncMock,
}));

import { NativeAppleTransactionSync } from "@/components/native/NativeAppleTransactionSync";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function setup(result: unknown = { status: "none" }) {
  availableMock.mockReturnValue(true);
  syncMock.mockResolvedValue(result);
  const unsubscribe = vi.fn();
  let fire: () => void = () => {};
  onUpdatedMock.mockImplementation((cb: () => void) => {
    fire = cb;
    return unsubscribe;
  });
  return { unsubscribe, fire: () => fire() };
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("NativeAppleTransactionSync", () => {
  it("does nothing without the bridge", () => {
    availableMock.mockReturnValue(false);
    const { container } = render(<NativeAppleTransactionSync />);
    setVisibility("visible");
    expect(container.innerHTML).toBe("");
    expect(syncMock).not.toHaveBeenCalled();
    expect(onUpdatedMock).not.toHaveBeenCalled();
  });

  it("syncs on mount, on the native event, and when the app becomes visible", async () => {
    const { fire } = setup();
    render(<NativeAppleTransactionSync />);
    expect(syncMock).toHaveBeenCalledTimes(1);
    fire();
    expect(syncMock).toHaveBeenCalledTimes(2);
    setVisibility("hidden");
    expect(syncMock).toHaveBeenCalledTimes(2);
    setVisibility("visible");
    expect(syncMock).toHaveBeenCalledTimes(3);
  });

  it("refreshes only when synced and applied", async () => {
    setup({ status: "synced", applied: true });
    render(<NativeAppleTransactionSync />);
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    cleanup();
    refreshMock.mockClear();

    setup({ status: "synced", applied: false });
    render(<NativeAppleTransactionSync />);
    await Promise.resolve();
    await Promise.resolve();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("cleans up listeners on unmount", () => {
    const { unsubscribe } = setup();
    const { unmount } = render(<NativeAppleTransactionSync />);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    setVisibility("visible");
    expect(syncMock).toHaveBeenCalledTimes(1);
  });
});
