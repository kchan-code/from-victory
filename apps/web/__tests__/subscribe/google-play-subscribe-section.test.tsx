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
    ok: true as const,
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
            pricingPhases: [{ formattedPrice: "$49.00", priceAmountMicros: 0, priceCurrencyCode: "USD", billingPeriod: "P1Y", billingCycleCount: 0, recurrenceMode: 0 }],
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
});

describe("GooglePlaySubscribeSection purchase states", () => {
  it("shows pending state", async () => {
    purchaseMock.mockResolvedValueOnce({ status: "pending" } as unknown);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() => expect(screen.getByTestId("google-state-pending")).toBeInTheDocument());
  });

  it("shows cancelled state", async () => {
    purchaseMock.mockResolvedValueOnce({ status: "cancelled" } as unknown);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() => expect(screen.getByTestId("google-state-cancelled")).toBeInTheDocument());
  });

  it("shows already-owned restore state", async () => {
    purchaseMock.mockResolvedValueOnce({ status: "error", error: "already_owned" } as unknown);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() =>
      expect(screen.getByTestId("google-state-already_owned_restore")).toBeInTheDocument(),
    );
  });

  it("shows already-owned other-account state", async () => {
    submitGooglePurchaseMock.mockResolvedValueOnce({ ok: false, error: "account_mismatch" } as any);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() =>
      expect(screen.getByTestId("google-state-already_owned_other_account")).toBeInTheDocument(),
    );
  });

  it("shows Play unavailable, offline, and generic error states", async () => {
    purchaseMock.mockResolvedValueOnce({ status: "error", error: "unavailable" } as unknown);
    render(<GooglePlaySubscribeSection mode="purchase" catalog={CATALOG} />);
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() =>
      expect(screen.getByTestId("google-state-play_unavailable")).toBeInTheDocument(),
    );

    Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
    purchaseMock.mockResolvedValueOnce({ status: "error", error: "network" } as unknown);
    fireEvent.click(screen.getByTestId("google-state-primary"));
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() => expect(screen.getByTestId("google-state-offline")).toBeInTheDocument());

    Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
    purchaseMock.mockResolvedValueOnce({ status: "error", error: "unknown" } as unknown);
    fireEvent.click(screen.getByTestId("google-state-primary"));
    await waitFor(() => expect(screen.getByTestId("google-subscribe-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("google-subscribe-submit"));
    await waitFor(() => expect(screen.getByTestId("google-state-error")).toBeInTheDocument());
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

  it("renders entitled-elsewhere status-only card with no purchase or restore buttons", () => {
    render(
      <GooglePlaySubscribeSection
        mode="entitled_elsewhere"
        entitledElsewhereProvider="stripe"
        catalog={CATALOG}
      />,
    );
    expect(screen.getByTestId("google-entitled-elsewhere")).toBeInTheDocument();
    expect(screen.queryByText("Subscribe with Google Play")).toBeNull();
    expect(screen.queryByText("Restore purchases")).toBeNull();
  });
});
