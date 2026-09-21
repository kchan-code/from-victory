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

describe("AppleSubscribeSection — mode='manage' (FV-581 duplicate-billing guard)", () => {
  it("renders Manage + Restore, NOT plan cards or the Subscribe button, when the bridge is available", async () => {
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    // Manage mode must not depend on the product catalog — leave it
    // unconfigured (today's shipped default) to prove that.
    getConfiguredAppleProductsMock.mockReturnValue([]);

    render(<AppleSubscribeSection mode="manage" />);

    await waitFor(() =>
      expect(screen.getByTestId("apple-manage-status")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("apple-manage-status").textContent).toBe(
      "You’re subscribed. Manage or restore below.",
    );
    expect(screen.getByTestId("apple-manage-link")).toBeInTheDocument();
    expect(screen.getByTestId("apple-restore-submit")).toBeInTheDocument();
    expect(screen.queryByTestId("apple-purchase-submit")).toBeNull();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(getStoreKitProductsMock).not.toHaveBeenCalled();
  });

  it("still falls back to the calm unavailable state when the bridge is absent", async () => {
    isAppleIapBridgeAvailableMock.mockReturnValue(false);
    getConfiguredAppleProductsMock.mockReturnValue([]);

    render(<AppleSubscribeSection mode="manage" />);

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-unavailable")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("apple-manage-status")).toBeNull();
    expect(screen.queryByTestId("apple-manage-link")).toBeNull();
    expect(screen.queryByTestId("apple-restore-submit")).toBeNull();
  });

  it("manage tap calls the bridge's manageSubscriptions", async () => {
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getConfiguredAppleProductsMock.mockReturnValue([]);

    render(<AppleSubscribeSection mode="manage" />);
    await waitFor(() =>
      expect(screen.getByTestId("apple-manage-link")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("apple-manage-link"));

    await waitFor(() => expect(manageSubscriptionsMock).toHaveBeenCalledTimes(1));
  });

  it("restore path works the same as purchase mode (success, empty, error)", async () => {
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getConfiguredAppleProductsMock.mockReturnValue([]);
    restoreMock.mockResolvedValue({
      ok: true,
      transactions: [{ signedTransactionInfo: "jws-newest" }],
    });
    submitApplePurchaseMock.mockResolvedValue({ ok: true, applied: true });

    render(<AppleSubscribeSection mode="manage" />);
    await waitFor(() =>
      expect(screen.getByTestId("apple-restore-submit")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("apple-restore-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-success")).toBeInTheDocument(),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});

describe("AppleSubscribeSection — mode default ('purchase') is unchanged", () => {
  it("renders the purchase UI (plan cards + Subscribe) when mode is omitted", async () => {
    await renderReady();

    expect(screen.getByTestId("apple-purchase-submit")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.queryByTestId("apple-manage-status")).toBeNull();
  });

  it("renders the purchase UI identically when mode is explicitly 'purchase'", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(ONE_TIER);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    render(<AppleSubscribeSection mode="purchase" />);

    await waitFor(() =>
      expect(screen.getByTestId(`apple-plan-card-${ONE_TIER[0]!.productId}`)).toBeInTheDocument(),
    );
    expect(screen.getByTestId("apple-purchase-submit")).toBeInTheDocument();
    expect(screen.queryByTestId("apple-manage-status")).toBeNull();
  });
});

describe("AppleSubscribeSection — mode='upgrade' (FV-586, KC decision D3)", () => {
  const THREE_TIERS = [
    { productId: "test.fv.tier1.monthly", athleteCapacity: 1, displayName: "1 Athlete" },
    { productId: "test.fv.tier3.monthly", athleteCapacity: 3, displayName: "3 Athletes" },
    { productId: "test.fv.tier5.monthly", athleteCapacity: 5, displayName: "5 Athletes" },
  ];

  it("offers only strictly-higher-capacity products, with the disclosure and an Add Athletes button", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(THREE_TIERS);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);

    render(<AppleSubscribeSection mode="upgrade" currentAppleCapacity={1} />);

    await waitFor(() =>
      expect(
        screen.getByTestId("apple-plan-card-test.fv.tier3.monthly"),
      ).toBeInTheDocument(),
    );

    // The equal-or-lower tier is filtered out entirely.
    expect(
      screen.queryByTestId("apple-plan-card-test.fv.tier1.monthly"),
    ).toBeNull();
    expect(
      screen.getByTestId("apple-plan-card-test.fv.tier5.monthly"),
    ).toBeInTheDocument();

    expect(screen.getByTestId("apple-upgrade-disclosure").textContent).toBe(
      "Confirming with Apple switches you to this plan right away and ends any free trial. Apple bills the new plan on its own schedule and shows the price before you confirm.",
    );
    expect(screen.getByTestId("apple-upgrade-submit")).toHaveTextContent(
      "Add Athletes",
    );
    expect(screen.queryByTestId("apple-purchase-submit")).toBeNull();
  });

  it("selects the first eligible (lowest strictly-higher) product by default", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(THREE_TIERS);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);

    render(<AppleSubscribeSection mode="upgrade" currentAppleCapacity={1} />);

    await waitFor(() =>
      expect(
        screen.getByTestId("apple-plan-card-test.fv.tier3.monthly"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByTestId("apple-plan-card-test.fv.tier3.monthly"),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("falls back to the unavailable state when no configured product exceeds the current capacity", async () => {
    getConfiguredAppleProductsMock.mockReturnValue([THREE_TIERS[2]!]); // capacity 5
    isAppleIapBridgeAvailableMock.mockReturnValue(true);

    render(<AppleSubscribeSection mode="upgrade" currentAppleCapacity={5} />);

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-unavailable")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("apple-upgrade-submit")).toBeNull();
  });

  it("purchasing an upgrade passes the selected product id through beginApplePurchase and shows upgrade success copy", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(THREE_TIERS);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    beginApplePurchaseMock.mockResolvedValue({ ok: true, appAccountToken: "token-abc" });
    purchaseMock.mockResolvedValue({
      ok: true,
      signedTransactionInfo: "jws-txn",
      signedRenewalInfo: undefined,
    });
    submitApplePurchaseMock.mockResolvedValue({ ok: true, applied: true });

    render(<AppleSubscribeSection mode="upgrade" currentAppleCapacity={1} />);
    await waitFor(() =>
      expect(screen.getByTestId("apple-upgrade-submit")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("apple-upgrade-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-success")).toBeInTheDocument(),
    );
    expect(beginApplePurchaseMock).toHaveBeenCalledWith("test.fv.tier3.monthly");
    expect(screen.getByTestId("apple-subscribe-success").textContent).toBe(
      "You’re upgraded. Welcome to your family plan.",
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
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
