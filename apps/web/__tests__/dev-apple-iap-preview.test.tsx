/**
 * @vitest-environment jsdom
 *
 * RTL tests for /dev/apple-iap-preview (FV-573) — the local-simulator-only
 * preview of the REAL AppleSubscribeSection component.
 *
 * Mirrors the conventions in __tests__/subscribe-page.test.tsx (page-level
 * mocking + render-the-page-function-directly) and
 * __tests__/subscribe/apple-subscribe-section.test.tsx (mocking
 * apple-products / the native bridge / the server action so the REAL
 * AppleSubscribeSection can render without a live Capacitor bridge or a real
 * server action call).
 *
 * NODE_ENV is mutated with vi.stubEnv (same pattern as
 * __tests__/stripe/stripe-server-singleton.test.ts) rather than direct
 * `process.env.NODE_ENV = ...` assignment, since NODE_ENV is a readonly
 * property under this project's TS config.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { AppleProductConfig } from "@/lib/subscriptions/apple-products";

const {
  getRequestShellCapabilityMock,
  getConfiguredAppleProductsMock,
  isAppleIapBridgeAvailableMock,
  getStoreKitProductsMock,
  purchaseMock,
  restoreMock,
  manageSubscriptionsMock,
  beginApplePurchaseMock,
  submitApplePurchaseMock,
  notFoundMock,
  refreshMock,
} = vi.hoisted(() => ({
  getRequestShellCapabilityMock: vi.fn(
    (): "ios-iap" | "legacy-native" | null => "ios-iap",
  ),
  getConfiguredAppleProductsMock: vi.fn(
    (): AppleProductConfig[] => [
      { productId: "test.fv.tier1.monthly", athleteCapacity: 1, displayName: "1 Athlete" },
    ],
  ),
  isAppleIapBridgeAvailableMock: vi.fn(() => true),
  getStoreKitProductsMock: vi.fn(async () => []),
  purchaseMock: vi.fn(),
  restoreMock: vi.fn(),
  manageSubscriptionsMock: vi.fn(async () => ({ ok: true })),
  beginApplePurchaseMock: vi.fn(),
  submitApplePurchaseMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  useRouter: () => ({ refresh: refreshMock }),
}));

// lib/native-shell.ts imports "server-only" — mocked wholesale (same pattern
// as subscribe-page.test.tsx) so this file never has to also stub
// "server-only" just to exercise this page's own branching.
vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: getRequestShellCapabilityMock,
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

// No Supabase mocks should be NEEDED for this page (no auth, no data reads).
// Mocking these to throw if called — rather than omitting the mock entirely
// — proves the negative: if the page's module graph ever grew a Supabase
// call, this suite would fail loudly instead of silently passing.
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => {
    throw new Error(
      "dev/apple-iap-preview must never call lib/supabase/server createClient()",
    );
  },
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => {
    throw new Error(
      "dev/apple-iap-preview must never call lib/supabase/service createServiceClient()",
    );
  },
}));

import AppleIapPreviewPage from "@/app/dev/apple-iap-preview/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  getRequestShellCapabilityMock.mockReturnValue("ios-iap");
  getConfiguredAppleProductsMock.mockReturnValue([
    { productId: "test.fv.tier1.monthly", athleteCapacity: 1, displayName: "1 Athlete" },
  ]);
  isAppleIapBridgeAvailableMock.mockReturnValue(true);
  getStoreKitProductsMock.mockResolvedValue([]);
  manageSubscriptionsMock.mockResolvedValue({ ok: true });
});

describe("/dev/apple-iap-preview — production/gate unreachability", () => {
  it("404s (notFound) when NODE_ENV is not development, even with the preview flag set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FV_IAP_DEV_PREVIEW", "1");

    expect(() => AppleIapPreviewPage()).toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("404s (notFound) in development when FV_IAP_DEV_PREVIEW is unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FV_IAP_DEV_PREVIEW", undefined);

    expect(() => AppleIapPreviewPage()).toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("404s (notFound) in development when FV_IAP_DEV_PREVIEW is set to something other than \"1\"", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FV_IAP_DEV_PREVIEW", "true");

    expect(() => AppleIapPreviewPage()).toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("renders (does not 404) only when both NODE_ENV=development AND FV_IAP_DEV_PREVIEW=1", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FV_IAP_DEV_PREVIEW", "1");

    expect(() => AppleIapPreviewPage()).not.toThrow();
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});

describe("/dev/apple-iap-preview — renders the real AppleSubscribeSection", () => {
  function renderGated() {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FV_IAP_DEV_PREVIEW", "1");
    return render(AppleIapPreviewPage());
  }

  it("shows the dev-preview banner with the exact warning copy", () => {
    renderGated();
    const banner = screen.getByTestId("dev-iap-preview-banner");
    expect(banner.textContent).toContain("FV-573 DEV PREVIEW");
    expect(banner.textContent).toContain(
      "NOT the production /subscribe page",
    );
    expect(banner.textContent).toContain(
      "purchase submissions will fail unauthenticated by design",
    );
  });

  it("shows the REAL shell-capability classification from getRequestShellCapability()", () => {
    getRequestShellCapabilityMock.mockReturnValue("ios-iap");
    renderGated();
    expect(
      screen.getByTestId("dev-iap-preview-shell-capability").textContent,
    ).toBe("shellCapability: ios-iap");
  });

  it("shows legacy-native and null classifications too (real passthrough, not hardcoded)", () => {
    getRequestShellCapabilityMock.mockReturnValue("legacy-native");
    const { unmount } = renderGated();
    expect(
      screen.getByTestId("dev-iap-preview-shell-capability").textContent,
    ).toBe("shellCapability: legacy-native");
    unmount();
    cleanup();

    getRequestShellCapabilityMock.mockReturnValue(null);
    renderGated();
    expect(
      screen.getByTestId("dev-iap-preview-shell-capability").textContent,
    ).toBe("shellCapability: null");
  });

  it("shows the REAL configured-product count from getConfiguredAppleProducts()", () => {
    getConfiguredAppleProductsMock.mockReturnValue([
      { productId: "test.fv.tier1.monthly", athleteCapacity: 1 },
      { productId: "test.fv.tier3.monthly", athleteCapacity: 3 },
    ]);
    renderGated();
    expect(
      screen.getByTestId("dev-iap-preview-product-count").textContent,
    ).toBe("configuredProducts: 2");
  });

  it("renders the real AppleSubscribeSection plan summary (not a stub)", async () => {
    renderGated();
    // FV-600: the per-product card list was replaced by a selector + ONE plan
    // summary; pre-purchase there is nothing to manage, so no manage link.
    await waitFor(() =>
      expect(screen.getByTestId("apple-plan-summary")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("apple-purchase-submit")).toBeInTheDocument();
    expect(screen.getByTestId("apple-restore-submit")).toBeInTheDocument();
    expect(screen.queryByTestId("apple-manage-link")).not.toBeInTheDocument();
  });

  it("renders the section's unavailable state when no products are configured (same component behavior as production)", async () => {
    getConfiguredAppleProductsMock.mockReturnValue([]);
    renderGated();
    await waitFor(() =>
      expect(
        screen.getByTestId("apple-subscribe-unavailable"),
      ).toBeInTheDocument(),
    );
  });
});

describe("/dev/apple-iap-preview — no auth, no Supabase call", () => {
  it("renders without ever calling lib/supabase/server or lib/supabase/service (both mocked to throw)", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FV_IAP_DEV_PREVIEW", "1");

    // If the page (directly, or transitively through AppleSubscribeSection /
    // apple-products / apple-iap / apple-subscription) ever called either
    // Supabase entrypoint, the mocks above would throw and this would fail.
    expect(() => render(AppleIapPreviewPage())).not.toThrow();
  });
});
