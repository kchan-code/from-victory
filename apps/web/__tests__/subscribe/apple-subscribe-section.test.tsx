/**
 * @vitest-environment jsdom
 *
 * RTL tests for AppleSubscribeSection (FV-572) — the iOS StoreKit purchase
 * surface rendered by app/subscribe/page.tsx when the shell capability is
 * "ios-iap". lib/subscriptions/apple-products, lib/native/apple-iap, and
 * lib/actions/apple-subscription are all mocked — no real Capacitor bridge,
 * no real server action.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const {
  getConfiguredAppleProductsMock,
  getStoreKitProductsMock,
  isAppleIapBridgeAvailableMock,
  purchaseMock,
  restoreMock,
  manageSubscriptionsMock,
  beginApplePurchaseMock,
  submitApplePurchaseMock,
  refreshMock,
} = vi.hoisted(() => ({
  getConfiguredAppleProductsMock: vi.fn(),
  getStoreKitProductsMock: vi.fn(async () => []),
  isAppleIapBridgeAvailableMock: vi.fn(),
  purchaseMock: vi.fn(),
  restoreMock: vi.fn(),
  manageSubscriptionsMock: vi.fn(async () => ({ ok: true })),
  beginApplePurchaseMock: vi.fn(),
  submitApplePurchaseMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/lib/subscriptions/apple-products", () => ({
  getConfiguredAppleProducts: getConfiguredAppleProductsMock,
}));

vi.mock("@/lib/native/apple-iap", () => ({
  getProducts: getStoreKitProductsMock,
  isAppleIapBridgeAvailable: isAppleIapBridgeAvailableMock,
  purchase: purchaseMock,
  restore: restoreMock,
  manageSubscriptions: manageSubscriptionsMock,
}));

vi.mock("@/lib/actions/apple-subscription", () => ({
  beginApplePurchase: beginApplePurchaseMock,
  submitApplePurchase: submitApplePurchaseMock,
}));

import { AppleSubscribeSection } from "@/components/subscribe/AppleSubscribeSection";

const ONE_TIER = [{ productId: "test.fv.tier1.monthly", athleteCapacity: 1, displayName: "1 Athlete" }];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  getStoreKitProductsMock.mockResolvedValue([]);
  manageSubscriptionsMock.mockResolvedValue({ ok: true });
});

async function renderReady() {
  getConfiguredAppleProductsMock.mockReturnValue(ONE_TIER);
  isAppleIapBridgeAvailableMock.mockReturnValue(true);
  render(<AppleSubscribeSection />);
  await waitFor(() =>
    expect(screen.getByTestId(`apple-plan-card-${ONE_TIER[0]!.productId}`)).toBeInTheDocument(),
  );
}

describe("AppleSubscribeSection — unavailable state", () => {
  it("shows the calm unavailable state with no price when no products are configured", async () => {
    getConfiguredAppleProductsMock.mockReturnValue([]);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);

    render(<AppleSubscribeSection />);

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-unavailable")).toBeInTheDocument(),
    );
    const text = screen.getByTestId("apple-subscribe-unavailable").textContent ?? "";
    expect(text).toContain("Subscriptions aren’t available in this version yet.");
    expect(text).not.toMatch(/\$\d/);
    expect(text).not.toMatch(/fromvictoryapp\.com/i);
    expect(screen.queryByTestId("apple-purchase-submit")).toBeNull();
    expect(screen.queryByTestId("apple-restore-submit")).toBeNull();
    expect(screen.queryByTestId("apple-manage-link")).toBeNull();
  });

  it("shows the unavailable state when products are configured but the bridge is unavailable", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(ONE_TIER);
    isAppleIapBridgeAvailableMock.mockReturnValue(false);

    render(<AppleSubscribeSection />);

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-unavailable")).toBeInTheDocument(),
    );
    expect(getStoreKitProductsMock).not.toHaveBeenCalled();
  });
});

describe("AppleSubscribeSection — configured + bridge available", () => {
  it("renders a product card per configured product and selects the first by default", async () => {
    await renderReady();
    const card = screen.getByTestId(`apple-plan-card-${ONE_TIER[0]!.productId}`);
    expect(card).toHaveAttribute("aria-checked", "true");
    expect(card.textContent).toContain("1 Athlete");
  });

  it("happy path: calls beginApplePurchase, then bridge.purchase, then submitApplePurchase, in order, then shows success and refreshes", async () => {
    const calls: string[] = [];
    beginApplePurchaseMock.mockImplementation(async () => {
      calls.push("beginApplePurchase");
      return { ok: true, appAccountToken: "token-abc" };
    });
    purchaseMock.mockImplementation(async () => {
      calls.push("purchase");
      return { ok: true, signedTransactionInfo: "jws-txn", signedRenewalInfo: "jws-renewal" };
    });
    submitApplePurchaseMock.mockImplementation(async () => {
      calls.push("submitApplePurchase");
      return { ok: true, applied: true };
    });

    await renderReady();
    fireEvent.click(screen.getByTestId("apple-purchase-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-success")).toBeInTheDocument(),
    );

    expect(calls).toEqual(["beginApplePurchase", "purchase", "submitApplePurchase"]);
    expect(purchaseMock).toHaveBeenCalledWith({
      productId: ONE_TIER[0]!.productId,
      appAccountToken: "token-abc",
    });
    expect(submitApplePurchaseMock).toHaveBeenCalledWith({
      signedTransactionInfo: "jws-txn",
      signedRenewalInfo: "jws-renewal",
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("apple-subscribe-error")).toBeNull();
  });

  it("user cancellation resets quietly — no error shown", async () => {
    beginApplePurchaseMock.mockResolvedValue({ ok: true, appAccountToken: "token-abc" });
    purchaseMock.mockResolvedValue({ ok: false, error: "cancelled" });

    await renderReady();
    fireEvent.click(screen.getByTestId("apple-purchase-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("apple-purchase-submit").textContent).toBe("Subscribe"),
    );

    expect(screen.queryByTestId("apple-subscribe-error")).toBeNull();
    expect(screen.queryByTestId("apple-subscribe-success")).toBeNull();
    expect(submitApplePurchaseMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("a pending purchase (e.g. Ask to Buy) shows calm status copy, not an alarming error", async () => {
    beginApplePurchaseMock.mockResolvedValue({ ok: true, appAccountToken: "token-abc" });
    purchaseMock.mockResolvedValue({ ok: false, error: "pending" });

    await renderReady();
    fireEvent.click(screen.getByTestId("apple-purchase-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-pending")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("apple-subscribe-error")).toBeNull();
  });

  it("a bridge/native failure shows calm parent-facing error copy — no codes, no Apple jargon", async () => {
    beginApplePurchaseMock.mockResolvedValue({ ok: true, appAccountToken: "token-abc" });
    purchaseMock.mockResolvedValue({ ok: false, error: "failed" });

    await renderReady();
    fireEvent.click(screen.getByTestId("apple-purchase-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-error")).toBeInTheDocument(),
    );
    const message = screen.getByTestId("apple-subscribe-error").textContent ?? "";
    expect(message).not.toMatch(/error|code|apple|storekit|jws/i);
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("a beginApplePurchase failure shows calm error and never calls the native bridge", async () => {
    beginApplePurchaseMock.mockResolvedValue({ ok: false, error: "not_authorized" });

    await renderReady();
    fireEvent.click(screen.getByTestId("apple-purchase-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-error")).toBeInTheDocument(),
    );
    expect(purchaseMock).not.toHaveBeenCalled();
    expect(submitApplePurchaseMock).not.toHaveBeenCalled();
  });

  it("restore path: calls bridge.restore then submits the newest transaction, then refreshes", async () => {
    restoreMock.mockResolvedValue({
      ok: true,
      transactions: [
        { signedTransactionInfo: "jws-newest" },
        { signedTransactionInfo: "jws-older" },
      ],
    });
    submitApplePurchaseMock.mockResolvedValue({ ok: true, applied: true });

    await renderReady();
    fireEvent.click(screen.getByTestId("apple-restore-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-success")).toBeInTheDocument(),
    );

    expect(submitApplePurchaseMock).toHaveBeenCalledWith({
      signedTransactionInfo: "jws-newest",
      signedRenewalInfo: undefined,
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("restore with nothing found shows a calm empty message, not an error", async () => {
    restoreMock.mockResolvedValue({ ok: true, transactions: [] });

    await renderReady();
    fireEvent.click(screen.getByTestId("apple-restore-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("apple-restore-empty")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("apple-subscribe-error")).toBeNull();
    expect(submitApplePurchaseMock).not.toHaveBeenCalled();
  });

  it("restore failure shows calm error copy", async () => {
    restoreMock.mockResolvedValue({ ok: false, error: "failed" });

    await renderReady();
    fireEvent.click(screen.getByTestId("apple-restore-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-error")).toBeInTheDocument(),
    );
  });

  it("manage invocation calls bridge.manageSubscriptions", async () => {
    await renderReady();
    fireEvent.click(screen.getByTestId("apple-manage-link"));

    await waitFor(() => expect(manageSubscriptionsMock).toHaveBeenCalledTimes(1));
  });
});

describe("AppleSubscribeSection — qa follow-ups (PR #518)", () => {
  const TWO_TIERS = [
    { productId: "test.fv.tier1.monthly", athleteCapacity: 1, displayName: "1 Athlete" },
    { productId: "test.fv.tier3.monthly", athleteCapacity: 3, displayName: "3 Athletes" },
  ];

  async function renderTwoTiers() {
    getConfiguredAppleProductsMock.mockReturnValue(TWO_TIERS);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    render(<AppleSubscribeSection />);
    await waitFor(() =>
      expect(
        screen.getByTestId("apple-plan-card-test.fv.tier3.monthly"),
      ).toBeInTheDocument(),
    );
  }

  it("arrow keys move the selection across plan cards (keyboard-only path)", async () => {
    await renderTwoTiers();

    const group = screen.getByRole("radiogroup");
    const first = screen.getByTestId("apple-plan-card-test.fv.tier1.monthly");
    const second = screen.getByTestId("apple-plan-card-test.fv.tier3.monthly");

    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-checked", "true");

    fireEvent.keyDown(group, { key: "ArrowDown" });
    expect(second).toHaveAttribute("aria-checked", "true");
    expect(first).toHaveAttribute("aria-checked", "false");

    // Wraps from the last card back to the first.
    fireEvent.keyDown(group, { key: "ArrowDown" });
    expect(first).toHaveAttribute("aria-checked", "true");

    fireEvent.keyDown(group, { key: "ArrowUp" });
    expect(second).toHaveAttribute("aria-checked", "true");
  });

  it("renders the presentational capacity label per card (singular and plural)", async () => {
    await renderTwoTiers();

    expect(
      screen.getByTestId("apple-plan-capacity-test.fv.tier1.monthly").textContent,
    ).toBe("1 athlete");
    expect(
      screen.getByTestId("apple-plan-capacity-test.fv.tier3.monthly").textContent,
    ).toBe("Up to 3 athletes");
  });
});
