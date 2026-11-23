/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("server-only", () => ({}));

const {
  requireSubscriberMock,
  maybeSingleMock,
  shellCapabilityMock,
  entitlementStateMock,
  hasAnyAppleSubscriptionHistoryMock,
} = vi.hoisted(() => ({
  requireSubscriberMock: vi.fn(),
  maybeSingleMock: vi.fn(async () => ({ data: null, error: null })),
  shellCapabilityMock: vi.fn(() => "ios-iap" as "ios-iap" | null),
  entitlementStateMock: vi.fn(
    async (): Promise<{
      status: "entitled" | "not_entitled" | "unknown";
      provider: "apple" | "stripe" | "google" | "comp" | null;
      accessPaused?: true;
    }> => ({ status: "not_entitled", provider: null }),
  ),
  hasAnyAppleSubscriptionHistoryMock: vi.fn(async () => false),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireSubscriber: requireSubscriberMock,
}));

vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: shellCapabilityMock,
}));

vi.mock("@/lib/native-shell-restricted", () => ({
  isRestrictedShell: () => false,
}));

vi.mock("@/lib/subscriptions/subscribe-guard", () => ({
  getSubscribeEntitlementState: entitlementStateMock,
}));

vi.mock("@/lib/subscriptions/apple", () => ({
  getActiveAppleProductId: vi.fn(async () => null),
  hasEverHeldAppleEntitlement: vi.fn(async () => false),
  hasAnyAppleSubscriptionHistory: hasAnyAppleSubscriptionHistoryMock,
}));

vi.mock("@/lib/subscriptions/google", () => ({
  hasEverHeldGoogleEntitlement: vi.fn(async () => false),
}));

vi.mock("@/lib/subscriptions/google-product-catalog", () => ({
  GOOGLE_PLAY_CATALOG: [],
  isGooglePlayCatalogActive: () => false,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: maybeSingleMock,
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({}),
}));

vi.mock("@/lib/subscriptions/access", () => ({
  getParentAccessLevel: vi.fn(async () => "full"),
}));

vi.mock("@/lib/subscriptions/enforce", () => ({
  isSubscriptionEnforcementEnabled: () => false,
}));

vi.mock("@/lib/subscriptions/billing-issue", () => ({
  getPayerBillingIssue: vi.fn(async () => null),
}));

vi.mock("@/components/subscribe/AppleSubscribeSection", () => ({
  AppleSubscribeSection: ({
    hasPriorAppleSubscription,
  }: {
    hasPriorAppleSubscription?: boolean;
  }) => (
    <div
      data-testid="apple-subscribe-section-stub"
      data-prior-apple={String(hasPriorAppleSubscription ?? false)}
    />
  ),
}));

vi.mock("@/components/subscribe/GooglePlaySubscribeSection", () => ({
  GooglePlaySubscribeSection: () => <div data-testid="google-play-subscribe-section-stub" />,
}));

vi.mock("@/components/subscribe/SubscribeForm", () => ({
  SubscribeForm: () => <div data-testid="subscribe-form-stub" />,
}));

vi.mock("@/components/pregame/ClearOfflinePregameOnMount", () => ({
  ClearOfflinePregameOnMount: () => null,
}));

vi.mock("@/lib/actions/subscription", () => ({
  createCheckoutSession: vi.fn(),
  createAdultCheckoutSession: vi.fn(),
}));

vi.mock("@/components/auth/SignOutButton", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

import SubscribePage from "@/app/subscribe/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderPage() {
  requireSubscriberMock.mockResolvedValue({
    userId: "parent-1",
    profile: { id: "parent-1", role: "parent", first_name: "Kim" },
  });
  const jsx = await SubscribePage({ searchParams: Promise.resolve({}) });
  return render(jsx);
}

describe("Subscribe page FV-787 Apple history wiring", () => {
  it("passes returning status from server-side Apple history check into Apple paywall copy", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    entitlementStateMock.mockResolvedValue({ status: "not_entitled", provider: null });
    hasAnyAppleSubscriptionHistoryMock.mockResolvedValue(true);

    await renderPage();

    expect(hasAnyAppleSubscriptionHistoryMock).toHaveBeenCalled();
    expect(screen.getByTestId("apple-subscribe-section-stub")).toHaveAttribute(
      "data-prior-apple",
      "true",
    );
  });

  it("does not run the Apple history check when not on ios-iap purchase flow", async () => {
    shellCapabilityMock.mockReturnValue(null);
    entitlementStateMock.mockResolvedValue({ status: "not_entitled", provider: null });

    await renderPage();

    expect(hasAnyAppleSubscriptionHistoryMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("apple-subscribe-section-stub")).not.toBeInTheDocument();
  });

  it("falls back to first-time copy and logs when the history read fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    shellCapabilityMock.mockReturnValue("ios-iap");
    entitlementStateMock.mockResolvedValue({ status: "not_entitled", provider: null });
    hasAnyAppleSubscriptionHistoryMock.mockRejectedValue(new Error("read failed"));

    await renderPage();

    expect(screen.getByTestId("apple-subscribe-section-stub")).toHaveAttribute(
      "data-prior-apple",
      "false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "[subscribe] Apple subscription history read failed; defaulting to first-time copy.",
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });
});
