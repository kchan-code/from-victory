/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const {
  beginGooglePlayPurchaseMock,
  submitGooglePurchaseMock,
  getProductsMock,
  purchaseMock,
  restoreMock,
  manageSubscriptionsMock,
  refreshMock,
} = vi.hoisted(() => ({
  beginGooglePlayPurchaseMock: vi.fn(async () => ({
    ok: true,
    obfuscatedAccountId: "bind_1",
  })),
  submitGooglePurchaseMock: vi.fn(async () => ({ ok: true, entitled: true, acknowledged: true } as any)),
  getProductsMock: vi.fn(async () => ({
    ok: true,
    products: [
      {
        productId: "family.1",
        name: "1 athlete",
        title: "1 athlete",
        offers: [
          {
            basePlanId: "yearly",
            offerId: null,
            offerToken: "token-year",
            pricingPhases: [{ formattedPrice: "$49.00", priceAmountMicros: 0, priceCurrencyCode: "USD", billingPeriod: "P1Y", billingCycleCount: 0, recurrenceMode: 0 }],
          },
          {
            basePlanId: "yearly",
            offerId: "trial-7d",
            offerToken: "token-trial",
            pricingPhases: [
              { formattedPrice: "$0.00", priceAmountMicros: 0, priceCurrencyCode: "USD", billingPeriod: "P7D", billingCycleCount: 1, recurrenceMode: 0 },
              { formattedPrice: "$49.00", priceAmountMicros: 0, priceCurrencyCode: "USD", billingPeriod: "P1Y", billingCycleCount: 0, recurrenceMode: 0 },
            ],
          },
          {
            basePlanId: "monthly",
            offerId: null,
            offerToken: "token-month",
            pricingPhases: [{ formattedPrice: "$5.00", priceAmountMicros: 0, priceCurrencyCode: "USD", billingPeriod: "P1M", billingCycleCount: 0, recurrenceMode: 0 }],
          },
        ],
      },
      {
        productId: "family.2",
        name: "2 athletes",
        title: "2 athletes",
        offers: [
          {
            basePlanId: "yearly",
            offerId: null,
            offerToken: "token-year-2",
            pricingPhases: [{ formattedPrice: "$78.00", priceAmountMicros: 0, priceCurrencyCode: "USD", billingPeriod: "P1Y", billingCycleCount: 0, recurrenceMode: 0 }],
          },
        ],
      },
    ],
  })),
  purchaseMock: vi.fn(async () => ({
    status: "purchased",
    purchaseToken: "tok_1",
    productId: "family.1",
  }) as any),
  restoreMock: vi.fn(async () => ({ ok: true as const, purchases: [] })),
  manageSubscriptionsMock: vi.fn(async () => ({ ok: true as const })),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/lib/actions/google-play-subscription", () => ({
  beginGooglePlayPurchase: beginGooglePlayPurchaseMock,
  submitGooglePurchase: submitGooglePurchaseMock,
}));

vi.mock("@/lib/native/play-billing", () => ({
  getProducts: getProductsMock,
  purchase: purchaseMock,
  restore: restoreMock,
  manageSubscriptions: manageSubscriptionsMock,
}));

import { GooglePlaySubscribeSection } from "@/components/subscribe/GooglePlaySubscribeSection";

const CATALOG = [
  { productId: "family.1", basePlanId: "yearly", athleteCapacity: 1, interval: "year" as const, trialOfferId: "trial-7d" },
  { productId: "family.1", basePlanId: "monthly", athleteCapacity: 1, interval: "month" as const, trialOfferId: "trial-7d" },
  { productId: "family.2", basePlanId: "yearly", athleteCapacity: 2, interval: "year" as const, trialOfferId: null },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
});

describe("GooglePlaySubscribeSection purchase mode", () => {
  it("defaults to yearly and shows the trial block for a trial-eligible 1-athlete selection", async () => {
    render(
      <GooglePlaySubscribeSection
        mode="purchase"
        trialEligible
        catalog={CATALOG}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled(),
    );
    expect(screen.getByText("Yearly")).toBeInTheDocument();
    expect(screen.getByText("7-day free trial")).toBeInTheDocument();
    expect(screen.getByTestId("google-subscribe-submit")).toHaveTextContent(
      "Start 7-day free trial",
    );
    expect(screen.getByText("$49.00")).toBeInTheDocument();
  });

  it("hides the trial when selecting 2 athletes even when trial eligible", async () => {
    render(
      <GooglePlaySubscribeSection
        mode="purchase"
        trialEligible
        catalog={CATALOG}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.queryByText("7-day free trial")).toBeNull();
    expect(screen.getByText("Starts today")).toBeInTheDocument();
    expect(screen.getByTestId("google-subscribe-submit")).toHaveTextContent(
      "Subscribe with Google Play",
    );
  });

  it("renders runtime prices from Play product details", async () => {
    render(
      <GooglePlaySubscribeSection
        mode="purchase"
        trialEligible={false}
        catalog={CATALOG}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled(),
    );
    expect(screen.getByText("$49.00")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Monthly"));
    expect(screen.getByText("$5.00")).toBeInTheDocument();
  });

  it("uses the recurring phase for trial-offer display pricing", async () => {
    render(
      <GooglePlaySubscribeSection
        mode="purchase"
        trialEligible
        catalog={CATALOG}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled(),
    );
    expect(screen.getByText("$49.00")).toBeInTheDocument();
    expect(screen.queryByText("$0.00")).toBeNull();
  });

  it("getProducts failure enters the unavailable state and does not render the design placeholder", async () => {
    getProductsMock.mockResolvedValueOnce({ ok: false, error: "unavailable" } as any);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() =>
      expect(screen.getByTestId("google-state-play_unavailable")).toBeInTheDocument(),
    );
    expect(screen.queryByText("{price from Google Play}")).toBeNull();
  });

  it("Try again reruns product fetch and enables purchase after a transient fetch failure", async () => {
    getProductsMock.mockReset();
    getProductsMock
      .mockResolvedValueOnce({ ok: false, error: "unavailable" } as any)
      .mockResolvedValueOnce({
        ok: true,
        products: [
          {
            productId: "family.1",
            name: "1 athlete",
            title: "1 athlete",
            offers: [
              {
                basePlanId: "yearly",
                offerId: null,
                offerToken: "token-year",
                pricingPhases: [{ formattedPrice: "$49.00" }],
              },
            ],
          },
        ],
      } as any);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() =>
      expect(screen.getByTestId("google-state-play_unavailable")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("google-state-primary"));
    await waitFor(() =>
      expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled(),
    );
    expect(getProductsMock).toHaveBeenCalledTimes(2);
  });
});

describe("GooglePlaySubscribeSection purchase states", () => {
  it("shows pending state", async () => {
    purchaseMock.mockResolvedValueOnce({ status: "pending" } as unknown);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() => expect(screen.getByTestId("google-state-pending")).toBeInTheDocument());
    expect(screen.getByText("Purchase pending")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your purchase is waiting on Google Play. Training unlocks when Google Play confirms it. This can take a little while.",
      ),
    ).toBeInTheDocument();
  });

  it("shows cancelled state", async () => {
    purchaseMock.mockResolvedValueOnce({ status: "cancelled" } as unknown);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() => expect(screen.getByTestId("google-state-cancelled")).toBeInTheDocument());
    expect(screen.getByText("Purchase cancelled")).toBeInTheDocument();
    expect(
      screen.getByText("You weren't charged. You can subscribe whenever you're ready."),
    ).toBeInTheDocument();
  });

  it("shows already-owned restore state", async () => {
    purchaseMock.mockResolvedValueOnce({ status: "error", error: "already_owned" } as unknown);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() =>
      expect(screen.getByTestId("google-state-already_owned_restore")).toBeInTheDocument(),
    );
    expect(screen.getByText("Already subscribed")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This Google account already has a From Victory subscription. If that's your purchase, restore it here.",
      ),
    ).toBeInTheDocument();
  });

  it("shows already-owned other-account state", async () => {
    submitGooglePurchaseMock.mockResolvedValueOnce({ ok: false, error: "account_mismatch" } as any);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() =>
      expect(screen.getByTestId("google-state-already_owned_other_account")).toBeInTheDocument(),
    );
    expect(
      screen.getByText(
        "This Google Play subscription belongs to another From Victory account. Sign in to that account to use it.",
      ),
    ).toBeInTheDocument();
  });

  it("shows Play unavailable, offline, and generic error states", async () => {
    purchaseMock.mockResolvedValueOnce({ status: "error", error: "unavailable" } as unknown);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() =>
      expect(screen.getByTestId("google-state-play_unavailable")).toBeInTheDocument(),
    );
    expect(
      screen.getByText(
        "Google Play isn't available on this device right now, so you can't subscribe or restore a purchase here.",
      ),
    ).toBeInTheDocument();

    Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
    purchaseMock.mockResolvedValueOnce({ status: "error", error: "network" } as unknown);
    fireEvent.click(screen.getByTestId("google-state-primary"));
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() => expect(screen.getByTestId("google-state-offline")).toBeInTheDocument());
    expect(
      screen.getByText("Connect to the internet to subscribe or restore a purchase."),
    ).toBeInTheDocument();

    Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
    purchaseMock.mockResolvedValueOnce({ status: "error", error: "unknown" } as unknown);
    fireEvent.click(screen.getByTestId("google-state-primary"));
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() => expect(screen.getByTestId("google-state-error")).toBeInTheDocument());
    expect(
      screen.getByText("Google Play couldn't complete this. Please try again."),
    ).toBeInTheDocument();
  });

  it("restore with zero purchases shows the explicit no-purchases message", async () => {
    restoreMock.mockReset();
    purchaseMock.mockResolvedValueOnce({ status: "error", error: "already_owned" } as unknown);
    restoreMock.mockResolvedValueOnce({ ok: true, purchases: [] });
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() => screen.getByTestId("google-state-already_owned_restore"));
    fireEvent.click(screen.getByText("Restore purchases"));
    await waitFor(() =>
      expect(screen.getByTestId("google-state-no_purchases_to_restore")).toBeInTheDocument(),
    );
    expect(
      screen.getByText("No purchases to restore on this Google account."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "No purchases to restore" }),
    ).toBeNull();
  });

  async function openRestore() {
    purchaseMock.mockResolvedValueOnce({ status: "error", error: "already_owned" } as unknown);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() => screen.getByTestId("google-state-already_owned_restore"));
    fireEvent.click(screen.getByText("Restore purchases"));
  }

  it("restore skips a non-entitled first purchase and restores the second, in order", async () => {
    restoreMock.mockReset();
    submitGooglePurchaseMock.mockReset();
    restoreMock.mockResolvedValueOnce({
      ok: true,
      purchases: [
        { purchaseToken: "tok_a", purchaseState: "purchased", productIds: ["family.1"] },
        { purchaseToken: "tok_b", purchaseState: "purchased", productIds: ["family.1"] },
      ],
    } as never);
    submitGooglePurchaseMock
      .mockResolvedValueOnce({ ok: true, entitled: false } as unknown)
      .mockResolvedValueOnce({ ok: true, entitled: true } as unknown);
    await openRestore();
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect((submitGooglePurchaseMock.mock.calls as unknown as Array<[{ purchaseToken: string }]>).map((c) => c[0].purchaseToken)).toEqual(["tok_a", "tok_b"]);
    expect(screen.queryByTestId("google-state-pending")).toBeNull();
    expect(screen.queryByTestId("google-state-error")).toBeNull();
  });

  it("restore with a single entitled purchase succeeds", async () => {
    restoreMock.mockReset();
    submitGooglePurchaseMock.mockReset();
    refreshMock.mockClear();
    restoreMock.mockResolvedValueOnce({
      ok: true,
      purchases: [{ purchaseToken: "tok_a", purchaseState: "purchased", productIds: ["family.1"] }],
    } as never);
    submitGooglePurchaseMock.mockResolvedValueOnce({ ok: true, entitled: true } as unknown);
    await openRestore();
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(submitGooglePurchaseMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("google-state-pending")).toBeNull();
  });

  it("restore with only pending and not-entitled purchases ends in the pending state", async () => {
    restoreMock.mockReset();
    submitGooglePurchaseMock.mockReset();
    restoreMock.mockResolvedValueOnce({
      ok: true,
      purchases: [
        { purchaseToken: "tok_a", purchaseState: "pending", productIds: ["family.1"] },
        { purchaseToken: "tok_b", purchaseState: "purchased", productIds: ["family.1"] },
      ],
    } as never);
    submitGooglePurchaseMock.mockResolvedValueOnce({ ok: true, entitled: false } as unknown);
    await openRestore();
    await waitFor(() => expect(screen.getByTestId("google-state-pending")).toBeInTheDocument());
    expect(submitGooglePurchaseMock).toHaveBeenCalledTimes(1);
  });

  it("restore stops on an ownership conflict", async () => {
    restoreMock.mockReset();
    submitGooglePurchaseMock.mockReset();
    restoreMock.mockResolvedValueOnce({
      ok: true,
      purchases: [
        { purchaseToken: "tok_a", purchaseState: "purchased", productIds: ["family.1"] },
        { purchaseToken: "tok_b", purchaseState: "purchased", productIds: ["family.1"] },
      ],
    } as never);
    submitGooglePurchaseMock.mockResolvedValueOnce({ ok: false, error: "ownership_conflict" } as unknown);
    await openRestore();
    await waitFor(() =>
      expect(screen.getByTestId("google-state-already_owned_other_account")).toBeInTheDocument(),
    );
    expect(submitGooglePurchaseMock).toHaveBeenCalledTimes(1);
  });

  it("bridge_unavailable shows the Play unavailable state", async () => {
    purchaseMock.mockResolvedValueOnce({ status: "error", error: "bridge_unavailable" } as unknown);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() =>
      expect(screen.getByTestId("google-state-play_unavailable")).toBeInTheDocument(),
    );
  });
});

describe("GooglePlaySubscribeSection manage and entitled-elsewhere modes", () => {
  it("renders manage mode with Play controls and no Stripe checkout links", async () => {
    render(
      <GooglePlaySubscribeSection
        mode="manage"
        catalog={CATALOG}
        manageState={{
          statusLabel: "Free trial",
          productId: "family.1",
          basePlanId: "yearly",
          athleteCapacity: 1,
          interval: "year",
          offerId: "trial-7d",
          priceSuffix: "/ year",
          expiresAtLabel: "November 21, 2026",
          trial: true,
        }}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("google-manage-open-play")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("google-manage-restore")).toBeInTheDocument();
    expect(screen.queryByText(/stripe/i)).toBeNull();
  });

  it("manage mode shows no-purchases restore feedback", async () => {
    restoreMock.mockReset();
    restoreMock.mockResolvedValueOnce({ ok: true, purchases: [] });
    render(
      <GooglePlaySubscribeSection
        mode="manage"
        catalog={CATALOG}
        manageState={{
          statusLabel: "Active",
          productId: "family.1",
          basePlanId: "yearly",
          athleteCapacity: 1,
          interval: "year",
          offerId: null,
          priceSuffix: "/ year",
          expiresAtLabel: "November 21, 2026",
          trial: false,
        }}
      />,
    );
    fireEvent.click(screen.getByTestId("google-manage-restore"));
    await waitFor(() =>
      expect(screen.getByTestId("google-state-no_purchases_to_restore")).toBeInTheDocument(),
    );
    expect(screen.getByText("No purchases to restore on this Google account.")).toBeInTheDocument();
  });

  it("manage mode shows pending, offline, and error restore feedback", async () => {
    restoreMock.mockReset();
    restoreMock
      .mockResolvedValueOnce({
        ok: true,
        purchases: [{ purchaseToken: "token_1", productId: "family.1", purchaseState: "pending" }],
      } as any)
      .mockResolvedValueOnce({ ok: false, error: "network" } as any)
      .mockResolvedValueOnce({ ok: false, error: "unknown" } as any);
    render(
      <GooglePlaySubscribeSection
        mode="manage"
        catalog={CATALOG}
        manageState={{
          statusLabel: "Active",
          productId: "family.1",
          basePlanId: "yearly",
          athleteCapacity: 1,
          interval: "year",
          offerId: null,
          priceSuffix: "/ year",
          expiresAtLabel: "November 21, 2026",
          trial: false,
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("google-manage-restore"));
    await waitFor(() => expect(screen.getByTestId("google-state-pending")).toBeInTheDocument());
    expect(
      screen.getByText(
        "Your purchase is waiting on Google Play. Training unlocks when Google Play confirms it. This can take a little while.",
      ),
    ).toBeInTheDocument();

    Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
    fireEvent.click(screen.getByTestId("google-state-primary"));
    fireEvent.click(screen.getByTestId("google-manage-restore"));
    await waitFor(() => expect(screen.getByTestId("google-state-offline")).toBeInTheDocument());
    expect(screen.getByText("Connect to the internet to subscribe or restore a purchase.")).toBeInTheDocument();

    Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
    fireEvent.click(screen.getByTestId("google-state-primary"));
    fireEvent.click(screen.getByTestId("google-manage-restore"));
    await waitFor(() => expect(screen.getByTestId("google-state-error")).toBeInTheDocument());
    expect(screen.getByText("Google Play couldn't complete this. Please try again.")).toBeInTheDocument();
  });

  it("renders entitled-elsewhere status-only card with no purchase or restore buttons", () => {
    render(
      <GooglePlaySubscribeSection
        mode="entitled_elsewhere"
        entitledElsewhereProvider="stripe"
        catalog={CATALOG}
      />,
    );
    expect(screen.getByTestId("google-entitled-elsewhere")).toBeInTheDocument();
    expect(screen.queryByText("Subscription")).toBeNull();
    expect(screen.queryByText("Settings")).toBeNull();
    expect(screen.queryByText("Subscribe with Google Play")).toBeNull();
    expect(screen.queryByText("Restore purchases")).toBeNull();
  });
});
