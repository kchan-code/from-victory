/**
 * @vitest-environment jsdom
 *
 * RTL tests for AppleSubscribeSection (FV-572; simplified selection UI
 * FV-600) — the iOS StoreKit purchase surface rendered by
 * app/subscribe/page.tsx when the shell capability is "ios-iap".
 * lib/subscriptions/apple-products, lib/native/apple-iap, and
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
  getStoreKitProductsMock: vi.fn(
    async (): Promise<{ productId: string; displayPrice: string; displayName: string }[]> => [],
  ),
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

// A single-tier catalog: no interval field, no ambiguity to pick between —
// the athlete-count/interval pickers hide entirely and only the plan
// summary + Subscribe/Restore show (today's shipped-config-gap shape).
const ONE_TIER = [{ productId: "test.fv.tier1.monthly", athleteCapacity: 1 }];
const ONE_TIER_LIVE = [
  { productId: "test.fv.tier1.monthly", displayPrice: "$4.99", displayName: "1 Athlete" },
];

// The real target shape (5 athlete-count tiers x 2 intervals = 10 products)
// per FV-600's `com.fromvictoryapp.app.family.<n>.<monthly|yearly>` naming —
// used to prove the selector resolves every combination to exactly one
// product id, and that "Change plan" never offers a cross-interval switch.
const FULL_CATALOG = [1, 2, 3, 4, 5].flatMap((n) => [
  { productId: `test.fv.family.${n}.monthly`, athleteCapacity: n, interval: "month" as const },
  { productId: `test.fv.family.${n}.yearly`, athleteCapacity: n, interval: "year" as const },
]);
const FULL_CATALOG_LIVE = FULL_CATALOG.map((product, index) => ({
  productId: product.productId,
  displayPrice: `$${index + 1}.99`,
  displayName: product.productId,
}));

// The LIVE beta shape today: the FV-593 catalog emitter serves real
// `com.fromvictoryapp.app.family.<n>.<monthly|yearly>` ids but does NOT set
// an `interval` field yet — `resolveInterval`'s id-suffix fallback is the
// only thing standing between this catalog and a missing Monthly/Yearly
// control (yearly plans unreachable).
const NO_INTERVAL_FIELD_CATALOG = [1, 2, 3, 4, 5].flatMap((n) => [
  { productId: `com.fromvictoryapp.app.family.${n}.monthly`, athleteCapacity: n },
  { productId: `com.fromvictoryapp.app.family.${n}.yearly`, athleteCapacity: n },
]);
const NO_INTERVAL_FIELD_CATALOG_LIVE = NO_INTERVAL_FIELD_CATALOG.map((product, index) => ({
  productId: product.productId,
  displayPrice: `$${index + 1}.99`,
  displayName: product.productId,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  getStoreKitProductsMock.mockResolvedValue([]);
  manageSubscriptionsMock.mockResolvedValue({ ok: true });
});

/** Renders the default (purchase) mode with a single configured tier and a
 * matching StoreKit price, then waits until the Subscribe button is
 * interactive — i.e. the price has resolved and the button isn't disabled by
 * the "unavailable" gate. Using "enabled" (not just "present") as the ready
 * signal avoids a race between the async StoreKit price merge and an
 * immediate `fireEvent.click` in the caller. */
async function renderReady() {
  getConfiguredAppleProductsMock.mockReturnValue(ONE_TIER);
  isAppleIapBridgeAvailableMock.mockReturnValue(true);
  getStoreKitProductsMock.mockResolvedValue(ONE_TIER_LIVE);
  render(<AppleSubscribeSection />);
  await waitFor(() => expect(screen.getByTestId("apple-purchase-submit")).not.toBeDisabled());
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

describe("AppleSubscribeSection — first purchase, single-tier catalog", () => {
  it("shows one plan summary with the StoreKit price and no picker for a single tier", async () => {
    await renderReady();

    expect(screen.queryByRole("radiogroup")).toBeNull();
    const summary = screen.getByTestId("apple-plan-summary");
    expect(summary.textContent).toContain("1 athlete");
    expect(screen.getByTestId("apple-plan-summary-price").textContent).toBe("$4.99");
  });

  it("never renders trial/free-trial language in first-purchase mode", async () => {
    await renderReady();
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/free|trial/i);
  });

  it("shows the neutral Apple-terms note, not a price/trial promise", async () => {
    await renderReady();
    expect(screen.getByTestId("apple-purchase-note").textContent).toBe(
      "Apple shows the final price and terms before you confirm.",
    );
  });

  it("shows a loading placeholder before StoreKit prices resolve", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(ONE_TIER);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    let resolvePrices: (value: typeof ONE_TIER_LIVE) => void = () => {};
    getStoreKitProductsMock.mockReturnValue(
      new Promise((resolve) => {
        resolvePrices = resolve;
      }),
    );

    render(<AppleSubscribeSection />);

    await waitFor(() => expect(screen.getByTestId("apple-plan-summary")).toBeInTheDocument());
    expect(screen.getByTestId("apple-plan-summary-price-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("apple-plan-summary-price")).toBeNull();
    // The button must not be disabled purely because prices are loading —
    // only a CONFIRMED-missing product disables it (see the dedicated test
    // below).
    expect(screen.getByTestId("apple-purchase-submit")).not.toBeDisabled();

    resolvePrices(ONE_TIER_LIVE);
    await waitFor(() =>
      expect(screen.getByTestId("apple-plan-summary-price")).toHaveTextContent("$4.99"),
    );
  });

  it("shows a calm unavailable state and disables Subscribe when StoreKit doesn't return the selected product", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(ONE_TIER);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getStoreKitProductsMock.mockResolvedValue([]);

    render(<AppleSubscribeSection />);

    await waitFor(() =>
      expect(screen.getByTestId("apple-product-unavailable")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("apple-purchase-submit")).toBeDisabled();
    expect(screen.queryByTestId("apple-plan-summary-price")).toBeNull();
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

  it("restore cancellation (dismissed sign-in prompt) resets quietly — no error shown", async () => {
    restoreMock.mockResolvedValue({ ok: false, error: "cancelled" });

    await renderReady();
    fireEvent.click(screen.getByTestId("apple-restore-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("apple-restore-submit").textContent).toBe("Restore Purchases"),
    );

    expect(screen.queryByTestId("apple-subscribe-error")).toBeNull();
    expect(screen.queryByTestId("apple-restore-empty")).toBeNull();
    expect(submitApplePurchaseMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("does not render a Manage Subscription affordance before a first purchase", async () => {
    await renderReady();
    expect(screen.queryByTestId("apple-manage-link")).toBeNull();
  });
});

describe("AppleSubscribeSection — selector (FV-600)", () => {
  const TWO_BY_TWO = [
    { productId: "test.fv.family.1.monthly", athleteCapacity: 1, interval: "month" as const },
    { productId: "test.fv.family.1.yearly", athleteCapacity: 1, interval: "year" as const },
    { productId: "test.fv.family.3.monthly", athleteCapacity: 3, interval: "month" as const },
    { productId: "test.fv.family.3.yearly", athleteCapacity: 3, interval: "year" as const },
  ];
  const TWO_BY_TWO_LIVE = TWO_BY_TWO.map((product, index) => ({
    productId: product.productId,
    displayPrice: `$${index + 1}.99`,
    displayName: product.productId,
  }));

  async function renderSelector() {
    getConfiguredAppleProductsMock.mockReturnValue(TWO_BY_TWO);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getStoreKitProductsMock.mockResolvedValue(TWO_BY_TWO_LIVE);
    render(<AppleSubscribeSection />);
    await waitFor(() => expect(screen.getByTestId("apple-purchase-submit")).not.toBeDisabled());
  }

  it("defaults to 1 athlete · Monthly and resolves exactly one product id", async () => {
    await renderSelector();

    expect(screen.getByTestId("apple-athlete-count-1")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("apple-interval-month")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("apple-plan-summary").textContent).toContain("1 athlete");
    expect(screen.getByTestId("apple-plan-summary").textContent).toContain("Monthly");

    fireEvent.click(screen.getByTestId("apple-purchase-submit"));
    await waitFor(() => expect(beginApplePurchaseMock).toHaveBeenCalled());
    expect(beginApplePurchaseMock).toHaveBeenCalledWith("test.fv.family.1.monthly");
  });

  it("switching athlete count and interval resolves the matching product id", async () => {
    beginApplePurchaseMock.mockResolvedValue({ ok: true, appAccountToken: "token-abc" });
    purchaseMock.mockResolvedValue({ ok: false, error: "cancelled" });
    await renderSelector();

    fireEvent.click(screen.getByTestId("apple-athlete-count-3"));
    fireEvent.click(screen.getByTestId("apple-interval-year"));

    expect(screen.getByTestId("apple-plan-summary").textContent).toContain("Up to 3 athletes");
    expect(screen.getByTestId("apple-plan-summary").textContent).toContain("Yearly");

    fireEvent.click(screen.getByTestId("apple-purchase-submit"));
    await waitFor(() => expect(beginApplePurchaseMock).toHaveBeenCalled());
    expect(beginApplePurchaseMock).toHaveBeenCalledWith("test.fv.family.3.yearly");
  });

  it("arrow keys move the athlete-count selection (keyboard-only path)", async () => {
    await renderSelector();

    const group = screen.getByRole("radiogroup", { name: "Athletes" });
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(screen.getByTestId("apple-athlete-count-3")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("apple-athlete-count-1")).toHaveAttribute("aria-checked", "false");

    // Wraps from the last option back to the first.
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(screen.getByTestId("apple-athlete-count-1")).toHaveAttribute("aria-checked", "true");

    fireEvent.keyDown(group, { key: "ArrowLeft" });
    expect(screen.getByTestId("apple-athlete-count-3")).toHaveAttribute("aria-checked", "true");
  });

  it("moves DOM focus to the newly-selected option on arrow-key navigation (roving tabindex)", async () => {
    await renderSelector();

    const group = screen.getByRole("radiogroup", { name: "Athletes" });
    const first = screen.getByTestId("apple-athlete-count-1");
    const second = screen.getByTestId("apple-athlete-count-3");

    // The selector starts on option 1, but focus must be moved there
    // explicitly by a real user tabbing in — fireEvent.keyDown alone
    // doesn't imply focus, so start from a known focused state.
    first.focus();
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(second).toHaveAttribute("aria-checked", "true");
    // Regression (QA finding): aria-checked/tabIndex updating is not enough
    // — real keyboard focus must track the selection too, or a
    // keyboard-only parent's focus ring visibly lags behind.
    expect(document.activeElement).toBe(second);

    fireEvent.keyDown(group, { key: "ArrowLeft" });
    expect(first).toHaveAttribute("aria-checked", "true");
    expect(document.activeElement).toBe(first);
  });

  it("hides the athlete-count/interval pickers entirely for a single-tier catalog", async () => {
    await renderReady();
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("resolves the correct product id for every combination in a full 5-capacity x 2-interval catalog", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(FULL_CATALOG);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getStoreKitProductsMock.mockResolvedValue(FULL_CATALOG_LIVE);
    beginApplePurchaseMock.mockResolvedValue({ ok: true, appAccountToken: "token-abc" });
    // "cancelled" quietly resets to idle after each check so the button is
    // re-enabled for the next combination in the loop.
    purchaseMock.mockResolvedValue({ ok: false, error: "cancelled" });

    render(<AppleSubscribeSection />);
    await waitFor(() => expect(screen.getByTestId("apple-purchase-submit")).not.toBeDisabled());

    for (const capacity of [1, 2, 3, 4, 5] as const) {
      fireEvent.click(screen.getByTestId(`apple-athlete-count-${capacity}`));
      for (const interval of ["month", "year"] as const) {
        fireEvent.click(screen.getByTestId(`apple-interval-${interval}`));
        const expectedId = `test.fv.family.${capacity}.${interval === "month" ? "monthly" : "yearly"}`;
        fireEvent.click(screen.getByTestId("apple-purchase-submit"));
        await waitFor(() => expect(beginApplePurchaseMock).toHaveBeenLastCalledWith(expectedId));
        await waitFor(() => expect(screen.getByTestId("apple-purchase-submit")).not.toBeDisabled());
      }
    }

    expect(beginApplePurchaseMock).toHaveBeenCalledTimes(10);
  });

  it("exposes both Monthly and Yearly and resolves the exact product id even when the catalog has no `interval` field (FV-593 emitter gap)", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(NO_INTERVAL_FIELD_CATALOG);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getStoreKitProductsMock.mockResolvedValue(NO_INTERVAL_FIELD_CATALOG_LIVE);
    beginApplePurchaseMock.mockResolvedValue({ ok: true, appAccountToken: "token-abc" });
    purchaseMock.mockResolvedValue({ ok: false, error: "cancelled" });

    render(<AppleSubscribeSection />);
    await waitFor(() => expect(screen.getByTestId("apple-purchase-submit")).not.toBeDisabled());

    // Both interval options render — the missing `interval` field must not
    // hide the toggle and strand yearly plans as unreachable.
    expect(screen.getByTestId("apple-interval-month")).toBeInTheDocument();
    expect(screen.getByTestId("apple-interval-year")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("apple-athlete-count-3"));
    fireEvent.click(screen.getByTestId("apple-interval-year"));

    const expectedProductId = "com.fromvictoryapp.app.family.3.yearly";
    const expectedPrice = NO_INTERVAL_FIELD_CATALOG_LIVE.find(
      (product) => product.productId === expectedProductId,
    )!.displayPrice;
    await waitFor(() =>
      expect(screen.getByTestId("apple-plan-summary-price")).toHaveTextContent(expectedPrice),
    );

    fireEvent.click(screen.getByTestId("apple-purchase-submit"));
    await waitFor(() => expect(beginApplePurchaseMock).toHaveBeenCalledWith(expectedProductId));
  });
});

describe("AppleSubscribeSection — mode='manage' (FV-581 duplicate-billing guard)", () => {
  it("renders Manage + Restore, NOT a selector or Subscribe button, when the bridge is available", async () => {
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    // Manage mode must not depend on the product catalog — leave it
    // unconfigured (today's shipped default) to prove that.
    getConfiguredAppleProductsMock.mockReturnValue([]);

    render(<AppleSubscribeSection mode="manage" />);

    await waitFor(() =>
      expect(screen.getByTestId("apple-manage-status")).toBeInTheDocument(),
    );
    expect(screen.getByRole("heading", { name: "Manage your plan" })).toBeInTheDocument();
    expect(screen.getByTestId("apple-manage-status").textContent).toBe(
      "You’re subscribed. Manage or restore below.",
    );
    expect(screen.getByTestId("apple-manage-link")).toBeInTheDocument();
    expect(screen.getByTestId("apple-restore-submit")).toBeInTheDocument();
    expect(screen.queryByTestId("apple-purchase-submit")).toBeNull();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.queryByTestId("apple-change-plan-toggle")).toBeNull();
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

  it("shows a Current Plan block with capacity and price when the current product is known", async () => {
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getConfiguredAppleProductsMock.mockReturnValue([]);
    getStoreKitProductsMock.mockResolvedValue([
      { productId: "apple.tier3.monthly", displayPrice: "$8.99", displayName: "3 Athletes" },
    ]);

    render(
      <AppleSubscribeSection
        mode="manage"
        currentAppleCapacity={3}
        currentAppleProductId="apple.tier3.monthly"
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("apple-current-plan")).toBeInTheDocument(),
    );
    const block = screen.getByTestId("apple-current-plan");
    expect(block.textContent).toContain("Up to 3 athletes");
    expect(block.textContent).toContain("Monthly");
    expect(block.textContent).toContain("$8.99");
    expect(screen.queryByTestId("apple-manage-status")).toBeNull();
  });

  it("prefers the catalog's declared interval over the id-suffix guess for the Current Plan block", async () => {
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    // "legacy" has no "month"/"year" substring — an id-suffix guess would
    // resolve nothing. The catalog's declared `interval: "year"` must win.
    getConfiguredAppleProductsMock.mockReturnValue([
      { productId: "apple.tier3.legacy", athleteCapacity: 3, interval: "year" },
    ]);
    getStoreKitProductsMock.mockResolvedValue([
      { productId: "apple.tier3.legacy", displayPrice: "$89.99", displayName: "3 Athletes" },
    ]);

    render(
      <AppleSubscribeSection
        mode="manage"
        currentAppleCapacity={3}
        currentAppleProductId="apple.tier3.legacy"
      />,
    );

    await waitFor(() => expect(screen.getByTestId("apple-current-plan")).toBeInTheDocument());
    expect(screen.getByTestId("apple-current-plan").textContent).toContain("Yearly");
  });

  it("degrades calmly (no invented capacity) when neither capacity nor product id is known", async () => {
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getConfiguredAppleProductsMock.mockReturnValue([]);

    render(<AppleSubscribeSection mode="manage" />);

    await waitFor(() =>
      expect(screen.getByTestId("apple-manage-status")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("apple-current-plan")).toBeNull();
  });
});

describe("AppleSubscribeSection — mode default ('purchase') is unchanged", () => {
  it("renders the purchase UI (summary + Subscribe) when mode is omitted", async () => {
    await renderReady();

    expect(screen.getByTestId("apple-purchase-submit")).toBeInTheDocument();
    expect(screen.getByTestId("apple-plan-summary")).toBeInTheDocument();
    expect(screen.queryByTestId("apple-manage-status")).toBeNull();
  });

  it("renders the purchase UI identically when mode is explicitly 'purchase'", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(ONE_TIER);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getStoreKitProductsMock.mockResolvedValue(ONE_TIER_LIVE);
    render(<AppleSubscribeSection mode="purchase" />);

    await waitFor(() => expect(screen.getByTestId("apple-purchase-submit")).not.toBeDisabled());
    expect(screen.getByTestId("apple-plan-summary")).toBeInTheDocument();
    expect(screen.queryByTestId("apple-manage-status")).toBeNull();
  });
});

describe("AppleSubscribeSection — mode='upgrade' (FV-586, KC decision D3; FV-600 change-plan disclosure)", () => {
  const THREE_TIERS = [
    { productId: "test.fv.tier1.monthly", athleteCapacity: 1 },
    { productId: "test.fv.tier3.monthly", athleteCapacity: 3 },
    { productId: "test.fv.tier5.monthly", athleteCapacity: 5 },
  ];
  const THREE_TIERS_LIVE = [
    { productId: "test.fv.tier1.monthly", displayPrice: "$4.99", displayName: "1 Athlete" },
    { productId: "test.fv.tier3.monthly", displayPrice: "$8.99", displayName: "3 Athletes" },
    { productId: "test.fv.tier5.monthly", displayPrice: "$12.99", displayName: "5 Athletes" },
  ];

  async function openChangePlan() {
    await waitFor(() =>
      expect(screen.getByTestId("apple-change-plan-toggle")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("apple-change-plan-toggle"));
    await waitFor(() => expect(screen.getByTestId("apple-upgrade-submit")).not.toBeDisabled());
  }

  it("renders the manage base view collapsed, with the upgrade offer behind a secondary Change plan disclosure", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(THREE_TIERS);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getStoreKitProductsMock.mockResolvedValue(THREE_TIERS_LIVE);

    render(
      <AppleSubscribeSection
        mode="upgrade"
        currentAppleCapacity={1}
        currentAppleProductId="test.fv.tier1.monthly"
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("apple-change-plan-toggle")).toBeInTheDocument(),
    );
    expect(screen.getByRole("heading", { name: "Manage your plan" })).toBeInTheDocument();
    expect(screen.getByTestId("apple-manage-link")).toBeInTheDocument();
    expect(screen.getByTestId("apple-restore-submit")).toBeInTheDocument();
    expect(screen.queryByTestId("apple-upgrade-submit")).toBeNull();
    expect(screen.queryByTestId("apple-upgrade-disclosure")).toBeNull();
    expect(screen.queryByTestId("apple-purchase-submit")).toBeNull();
  });

  it("expanding Change plan offers only strictly-higher-capacity products, with the disclosure and an Add Athletes button", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(THREE_TIERS);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getStoreKitProductsMock.mockResolvedValue(THREE_TIERS_LIVE);

    render(
      <AppleSubscribeSection
        mode="upgrade"
        currentAppleCapacity={1}
        currentAppleProductId="test.fv.tier1.monthly"
      />,
    );
    await openChangePlan();

    // The equal-or-lower tier is filtered out entirely.
    expect(screen.queryByTestId("apple-athlete-count-1")).toBeNull();
    expect(screen.getByTestId("apple-athlete-count-3")).toBeInTheDocument();
    expect(screen.getByTestId("apple-athlete-count-5")).toBeInTheDocument();

    expect(screen.getByTestId("apple-upgrade-disclosure").textContent).toBe(
      "Confirming with Apple switches you to this plan right away and ends any free trial. Apple bills the new plan on its own schedule and shows the price before you confirm.",
    );
    expect(screen.getByTestId("apple-upgrade-submit")).toHaveTextContent("Add Athletes");
  });

  it("selects the first eligible (lowest strictly-higher) product by default", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(THREE_TIERS);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getStoreKitProductsMock.mockResolvedValue(THREE_TIERS_LIVE);

    render(
      <AppleSubscribeSection
        mode="upgrade"
        currentAppleCapacity={1}
        currentAppleProductId="test.fv.tier1.monthly"
      />,
    );
    await openChangePlan();

    expect(screen.getByTestId("apple-athlete-count-3")).toHaveAttribute("aria-checked", "true");
  });

  it("falls back to the unavailable state when no configured product exceeds the current capacity", async () => {
    getConfiguredAppleProductsMock.mockReturnValue([THREE_TIERS[2]!]); // capacity 5
    isAppleIapBridgeAvailableMock.mockReturnValue(true);

    render(
      <AppleSubscribeSection
        mode="upgrade"
        currentAppleCapacity={5}
        currentAppleProductId="test.fv.tier5.monthly"
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("apple-subscribe-unavailable")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("apple-upgrade-submit")).toBeNull();
    expect(screen.queryByTestId("apple-change-plan-toggle")).toBeNull();
  });

  it("purchasing an upgrade passes the selected product id through beginApplePurchase and shows upgrade success copy", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(THREE_TIERS);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getStoreKitProductsMock.mockResolvedValue(THREE_TIERS_LIVE);
    beginApplePurchaseMock.mockResolvedValue({ ok: true, appAccountToken: "token-abc" });
    purchaseMock.mockResolvedValue({
      ok: true,
      signedTransactionInfo: "jws-txn",
      signedRenewalInfo: undefined,
    });
    submitApplePurchaseMock.mockResolvedValue({ ok: true, applied: true });

    render(
      <AppleSubscribeSection
        mode="upgrade"
        currentAppleCapacity={1}
        currentAppleProductId="test.fv.tier1.monthly"
      />,
    );
    await openChangePlan();
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

  it("shows the payer's current plan above the collapsed Change plan disclosure", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(THREE_TIERS);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getStoreKitProductsMock.mockResolvedValue([
      { productId: "apple.tier1.monthly", displayPrice: "$4.99", displayName: "1 Athlete" },
      ...THREE_TIERS_LIVE,
    ]);

    render(
      <AppleSubscribeSection
        mode="upgrade"
        currentAppleCapacity={1}
        currentAppleProductId="apple.tier1.monthly"
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("apple-current-plan")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("apple-current-plan").textContent).toContain("1 athlete");
    expect(screen.getByTestId("apple-current-plan").textContent).toContain("$4.99");
  });

  it("Change plan offers only the SAME interval as the current product, even in a mixed-interval catalog (FV-600 narrowing)", async () => {
    getConfiguredAppleProductsMock.mockReturnValue(FULL_CATALOG);
    isAppleIapBridgeAvailableMock.mockReturnValue(true);
    getStoreKitProductsMock.mockResolvedValue(FULL_CATALOG_LIVE);
    beginApplePurchaseMock.mockResolvedValue({ ok: true, appAccountToken: "token-abc" });
    purchaseMock.mockResolvedValue({ ok: false, error: "cancelled" });

    render(
      <AppleSubscribeSection
        mode="upgrade"
        currentAppleCapacity={2}
        currentAppleProductId="test.fv.family.2.monthly"
      />,
    );
    await openChangePlan();

    // Same-interval, strictly-higher capacities are offered...
    expect(screen.getByTestId("apple-athlete-count-3")).toBeInTheDocument();
    expect(screen.getByTestId("apple-athlete-count-4")).toBeInTheDocument();
    expect(screen.getByTestId("apple-athlete-count-5")).toBeInTheDocument();
    // ...but capacity 1-2 (equal-or-lower) is filtered out...
    expect(screen.queryByTestId("apple-athlete-count-1")).toBeNull();
    expect(screen.queryByTestId("apple-athlete-count-2")).toBeNull();
    // ...and no yearly product at ANY capacity — this surface never offers
    // a monthly<->yearly switch (that's Manage Subscription's job).
    expect(screen.queryByRole("radiogroup", { name: "Billing interval" })).toBeNull();
    expect(screen.queryByTestId("apple-interval-year")).toBeNull();

    fireEvent.click(screen.getByTestId("apple-upgrade-submit"));
    await waitFor(() => expect(beginApplePurchaseMock).toHaveBeenCalled());
    expect(beginApplePurchaseMock).toHaveBeenCalledWith("test.fv.family.3.monthly");
  });
});
