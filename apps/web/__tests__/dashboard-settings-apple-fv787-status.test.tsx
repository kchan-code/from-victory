/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("server-only", () => ({}));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  const React = await import("react");
  return {
    ...actual,
    useFormState: (_action: unknown, initialState: unknown) =>
      React.useState(initialState),
    useFormStatus: () => ({ pending: false }),
  };
});

const {
  requireParentMock,
  shellCapabilityMock,
  getUserMock,
  maybeSingleMock,
  getDisplayedAppleProductIdResultMock,
} = vi.hoisted(() => ({
  requireParentMock: vi.fn(),
  shellCapabilityMock: vi.fn(() => "ios-iap" as "ios-iap"),
  getUserMock: vi.fn(async () => ({ data: { user: { email: "kim@example.com" } } })),
  maybeSingleMock: vi.fn(async () => ({ data: null, error: null })),
  getDisplayedAppleProductIdResultMock: vi.fn(
    async () =>
      ({
        productId: "com.fromvictoryapp.app.plan1",
        readError: false,
        autoRenewStatus: true,
        expiresAt: "2026-12-12T00:00:00.000Z",
      }) as {
        productId: string | null;
        readError: boolean;
        autoRenewStatus?: boolean | null;
        expiresAt?: string | null;
      },
  ),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireParent: requireParentMock,
}));

vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: shellCapabilityMock,
}));

vi.mock("@/lib/subscriptions/apple", () => ({
  getDisplayedAppleProductIdResult: getDisplayedAppleProductIdResultMock,
}));

vi.mock("@/lib/subscriptions/subscribe-guard", () => ({
  getSubscribeEntitlementState: vi.fn(async () => ({ status: "not_entitled", provider: null })),
}));

vi.mock("@/lib/subscriptions/google-product-catalog", () => ({
  GOOGLE_PLAY_CATALOG: [],
  isGooglePlayCatalogActive: () => false,
}));

vi.mock("@/lib/subscriptions/google", () => ({
  getGoogleEntitlementSnapshotForPayer: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
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

vi.mock("@/lib/actions/digest-preferences", () => ({
  getDigestOptOut: vi.fn(async () => false),
  setDigestOptOut: vi.fn(),
}));

vi.mock("@/lib/actions/account-settings", () => ({
  sendOwnPasswordReset: vi.fn(),
}));

import DashboardSettingsPage from "@/app/dashboard/settings/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderPage() {
  requireParentMock.mockResolvedValue({
    userId: "parent-1",
    profile: { id: "parent-1", role: "parent", first_name: "Kim" },
  });
  const jsx = await DashboardSettingsPage();
  return render(jsx);
}

describe("Dashboard Apple status copy FV-787", () => {
  it("shows 'Renews <date>' when Apple auto-renew is on", async () => {
    getDisplayedAppleProductIdResultMock.mockResolvedValue({
      productId: "com.fromvictoryapp.app.plan1",
      readError: false,
      autoRenewStatus: true,
      expiresAt: "2026-12-12T00:00:00.000Z",
    });

    await renderPage();

    expect(screen.getByTestId("subscription-status")).toHaveTextContent(
      "Renews December 12, 2026",
    );
  });

  it("shows 'Cancelled, access ends <date>' when auto-renew is off and access is still active", async () => {
    getDisplayedAppleProductIdResultMock.mockResolvedValue({
      productId: "com.fromvictoryapp.app.plan1",
      readError: false,
      autoRenewStatus: false,
      expiresAt: "2099-12-12T00:00:00.000Z",
    });

    await renderPage();

    expect(screen.getByTestId("subscription-status")).toHaveTextContent(
      "Cancelled, access ends December 12, 2099",
    );
  });
});
