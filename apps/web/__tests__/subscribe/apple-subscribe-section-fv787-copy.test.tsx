/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const {
  getConfiguredAppleProductsMock,
  getStoreKitProductsMock,
  isAppleIapBridgeAvailableMock,
} = vi.hoisted(() => ({
  getConfiguredAppleProductsMock: vi.fn(),
  getStoreKitProductsMock: vi.fn(
    async (): Promise<{ productId: string; displayPrice: string; displayName: string }[]> => [],
  ),
  isAppleIapBridgeAvailableMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/subscriptions/apple-products", () => ({
  getConfiguredAppleProducts: getConfiguredAppleProductsMock,
}));

vi.mock("@/lib/native/apple-iap", () => ({
  getProducts: getStoreKitProductsMock,
  isAppleIapBridgeAvailable: isAppleIapBridgeAvailableMock,
  purchase: vi.fn(),
  restore: vi.fn(),
  manageSubscriptions: vi.fn(),
  finishTransactions: vi.fn(),
}));

vi.mock("@/lib/native/apple-transaction-sync", () => ({
  syncAppleTransactions: vi.fn(async () => ({ status: "none" })),
}));

vi.mock("@/lib/actions/apple-subscription", () => ({
  beginApplePurchase: vi.fn(async () => ({ ok: true, appAccountToken: "token" })),
  submitApplePurchase: vi.fn(async () => ({ ok: true })),
}));

import { AppleSubscribeSection } from "@/components/subscribe/AppleSubscribeSection";

const CATALOG = [{ productId: "test.fv.tier1.monthly", athleteCapacity: 1 }];
const LIVE_PRODUCTS = [
  { productId: "test.fv.tier1.monthly", displayPrice: "$4.99", displayName: "1 Athlete" },
];

async function renderPurchaseSection(hasPriorAppleSubscription = false) {
  getConfiguredAppleProductsMock.mockReturnValue(CATALOG);
  isAppleIapBridgeAvailableMock.mockReturnValue(true);
  getStoreKitProductsMock.mockResolvedValue(LIVE_PRODUCTS);

  render(
    <AppleSubscribeSection hasPriorAppleSubscription={hasPriorAppleSubscription} />,
  );

  await waitFor(() => expect(screen.getByTestId("apple-purchase-submit")).toBeInTheDocument());
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AppleSubscribeSection FV-787 copy", () => {
  it("keeps first-time wording unchanged", async () => {
    await renderPurchaseSection(false);

    expect(screen.getByTestId("apple-purchase-note")).toHaveTextContent(
      "Apple shows the final price and terms before you confirm.",
    );
    expect(screen.getByTestId("apple-purchase-note")).not.toHaveTextContent(
      "Your free trial has been used. Subscribing starts a paid plan today.",
    );
  });

  it("shows returning-subscriber wording when the payer has Apple history", async () => {
    await renderPurchaseSection(true);

    expect(screen.getByTestId("apple-purchase-note")).toHaveTextContent(
      "Your free trial has been used. Subscribing starts a paid plan today.",
    );
    expect(screen.getByTestId("apple-purchase-note")).not.toHaveTextContent(
      "Apple shows the final price and terms before you confirm.",
    );
  });
});
