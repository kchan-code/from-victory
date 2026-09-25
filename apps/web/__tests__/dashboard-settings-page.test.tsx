/**
 * @vitest-environment jsdom
 *
 * RTL tests for /dashboard/settings — native-shell billing suppression
 * (Google Play "no in-app purchase" compliance, entry-point-router follow-up
 * to FV-478).
 *
 * Scoped to the two Stripe-adjacent surfaces on this page:
 *   1. The "Manage subscription" BillingPortalButton (has-subscription
 *      branch) — replaced by a neutral, non-tappable notice in-shell.
 *   2. The "Choose a plan" → /subscribe link (no-subscription branch) —
 *      dropped for plain text in-shell, same treatment as the dashboard CTA
 *      (app/dashboard/page.tsx).
 *
 * Also covers FV-578 (record §4.4): the Apple-manage-path precedence branch
 * — an Apple-entitled ios-iap payer sees a price-free Apple status + in-app
 * manage link INSTEAD of the Stripe status/manage block, even when a Stripe
 * row also exists (Apple precedence). Discriminator is
 * `getActiveAppleProductId()` from `@/lib/subscriptions/apple`, mocked below.
 *
 * Follows the async-server-component render pattern from
 * __tests__/subscribe-page.test.tsx and the react-dom useFormState shim from
 * __tests__/athlete-settings-page.test.tsx.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("server-only", () => ({}));

// Test-env shim — BillingPortalButton, SendResetLinkButton, and DigestToggle
// all call useFormState / useFormStatus; these tests only assert on rendered
// markup and never actually submit.
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
  getActiveAppleProductIdMock,
} = vi.hoisted(() => ({
  requireParentMock: vi.fn(),
  // Google Play "no in-app purchase" compliance + FV-572/577 capability.
  // Defaults to null (ordinary web/PWA request) — individual tests override
  // per case with "legacy-native" | "ios-iap" | null.
  shellCapabilityMock: vi.fn(() => null as "legacy-native" | "ios-iap" | null),
  getUserMock: vi.fn(async () => ({ data: { user: { email: "kim@example.com" } } })),
  maybeSingleMock: vi.fn(),
  // FV-578 — the centralized `apple_subscriptions` accessor. Defaults to
  // "no active Apple entitlement"; individual tests override per case.
  getActiveAppleProductIdMock: vi.fn(async () => null as string | null),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireParent: requireParentMock,
}));

vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: shellCapabilityMock,
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

// FV-578 — the page never issues a raw `apple_subscriptions` query itself;
// it calls the ONE centralized service-role accessor. Mocking the whole
// module keeps this test file from needing real Supabase env/service-role
// wiring for a status read.
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({}),
}));

vi.mock("@/lib/subscriptions/apple", () => ({
  getActiveAppleProductId: getActiveAppleProductIdMock,
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
  // clearAllMocks keeps mockReturnValue overrides — restore defaults so
  // test order never matters.
  shellCapabilityMock.mockReturnValue(null);
  getUserMock.mockResolvedValue({ data: { user: { email: "kim@example.com" } } });
  getActiveAppleProductIdMock.mockResolvedValue(null);
});

async function renderPage() {
  requireParentMock.mockResolvedValue({
    userId: "parent-1",
    profile: { id: "parent-1", role: "parent", first_name: "Kim" },
  });
  const jsx = await DashboardSettingsPage();
  return render(jsx);
}

describe("/dashboard/settings — Billing Portal shell-capability suppression", () => {
  it("renders the real BillingPortalButton when capability is null (web)", async () => {
    shellCapabilityMock.mockReturnValue(null);
    maybeSingleMock.mockResolvedValue({
      data: {
        status: "active",
        price_id: "price_test",
        current_period_end: "2026-09-01T00:00:00Z",
        cancel_at_period_end: false,
      },
      error: null,
    });

    await renderPage();

    expect(screen.getByTestId("billing-portal-btn")).toBeInTheDocument();
    expect(
      screen.queryByTestId("billing-portal-native-shell-notice"),
    ).not.toBeInTheDocument();
  });

  it("replaces BillingPortalButton with a neutral, non-tappable notice when capability is 'legacy-native'", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");
    maybeSingleMock.mockResolvedValue({
      data: {
        status: "active",
        price_id: "price_test",
        current_period_end: "2026-09-01T00:00:00Z",
        cancel_at_period_end: false,
      },
      error: null,
    });

    await renderPage();

    expect(screen.queryByTestId("billing-portal-btn")).not.toBeInTheDocument();
    const notice = screen.getByTestId("billing-portal-native-shell-notice");
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(
      "Manage your From Victory subscription from a web browser at fromvictoryapp.com.",
    );
  });
});

describe("/dashboard/settings — FV-492 no user-visible Stripe/portal wording in-shell", () => {
  it("renders no visible 'Stripe' or 'portal' text in-shell (active subscription), keeping the browser notice", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");
    maybeSingleMock.mockResolvedValue({
      data: {
        status: "active",
        price_id: "price_test",
        current_period_end: "2026-09-01T00:00:00Z",
        cancel_at_period_end: false,
      },
      error: null,
    });

    const { container } = await renderPage();

    // User-visible text only — data-testid attributes are allowed to say
    // "portal", the rendered copy is not.
    const visibleText = container.textContent ?? "";
    expect(visibleText).not.toMatch(/stripe/i);
    expect(visibleText).not.toMatch(/portal/i);
    expect(
      screen.getByTestId("billing-portal-native-shell-notice"),
    ).toHaveTextContent(
      "Manage your From Victory subscription from a web browser at fromvictoryapp.com.",
    );
  });

  it("renders no visible 'Stripe' or 'portal' text in-shell with no subscription row", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const { container } = await renderPage();

    expect(container.textContent ?? "").not.toMatch(/stripe|portal/i);
  });
});

describe("/dashboard/settings — 'Choose a plan' shell-capability gating (no subscription row, FV-572/577)", () => {
  it("shows 'No active subscription.' + a 'Choose a plan' link to /subscribe when capability is null (web)", async () => {
    shellCapabilityMock.mockReturnValue(null);
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    await renderPage();

    expect(screen.getByTestId("no-subscription")).toHaveTextContent(
      "No active subscription.",
    );
    const link = screen.getByRole("link", { name: "Choose a plan" });
    expect(link).toHaveAttribute("href", "/subscribe");
  });

  it("drops the 'Choose a plan' link and shows browser-subscribe copy when capability is 'legacy-native'", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    await renderPage();

    expect(
      screen.queryByRole("link", { name: "Choose a plan" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("no-subscription")).toHaveTextContent(
      "Subscribe to From Victory from a web browser at fromvictoryapp.com.",
    );
  });

  it("keeps the price-free 'Choose a plan' link to /subscribe when capability is 'ios-iap' (FV-577)", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const { container } = await renderPage();

    expect(screen.getByTestId("no-subscription")).toHaveTextContent(
      "No active subscription.",
    );
    const link = screen.getByRole("link", { name: "Choose a plan" });
    expect(link).toHaveAttribute("href", "/subscribe");
    expect(container.textContent ?? "").not.toMatch(/web browser/i);
    expect(container.textContent ?? "").not.toMatch(/\$/);
  });
});

describe("/dashboard/settings — FV-578 Apple manage-path precedence (record §4.4)", () => {
  it("shows the Apple manage entry (price-free, accurate status) when ios-iap and Apple-entitled with no Stripe row", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    getActiveAppleProductIdMock.mockResolvedValue("com.fromvictoryapp.app.plan1");
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const { container } = await renderPage();

    const link = screen.getByTestId("settings-apple-manage");
    expect(link).toHaveAttribute("href", "/subscribe");
    expect(link).toHaveTextContent("Manage subscription");
    expect(screen.getByTestId("subscription-status")).toHaveTextContent("Active");
    expect(container.textContent ?? "").toMatch(/App Store/);
    expect(container.textContent ?? "").not.toMatch(/web browser/i);
    expect(container.textContent ?? "").not.toMatch(/\$/);
    expect(
      screen.queryByRole("link", { name: "Choose a plan" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("billing-portal-native-shell-notice"),
    ).not.toBeInTheDocument();
  });

  it("Apple precedence: shows the Apple manage entry even when a Stripe subscription row ALSO exists (dual-provider)", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    getActiveAppleProductIdMock.mockResolvedValue("com.fromvictoryapp.app.plan1");
    maybeSingleMock.mockResolvedValue({
      data: {
        status: "active",
        price_id: "price_test",
        current_period_end: "2026-09-01T00:00:00Z",
        cancel_at_period_end: false,
      },
      error: null,
    });

    await renderPage();

    expect(screen.getByTestId("settings-apple-manage")).toBeInTheDocument();
    expect(
      screen.queryByTestId("billing-portal-native-shell-notice"),
    ).not.toBeInTheDocument();
    // The Stripe "Renews"/"Access ends" date row belongs only to the Stripe
    // branch — it must not leak into the Apple-precedence branch.
    expect(screen.queryByTestId("subscription-period-end")).not.toBeInTheDocument();
  });

  it("ios-iap + Stripe-only (no Apple entitlement): unchanged browser notice, no Apple manage link", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    getActiveAppleProductIdMock.mockResolvedValue(null);
    maybeSingleMock.mockResolvedValue({
      data: {
        status: "active",
        price_id: "price_test",
        current_period_end: "2026-09-01T00:00:00Z",
        cancel_at_period_end: false,
      },
      error: null,
    });

    await renderPage();

    expect(screen.queryByTestId("settings-apple-manage")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("billing-portal-native-shell-notice"),
    ).toBeInTheDocument();
  });

  it("ios-iap + no subscription at all: unchanged FV-577 'Choose a plan' entry", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    getActiveAppleProductIdMock.mockResolvedValue(null);
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    await renderPage();

    expect(screen.queryByTestId("settings-apple-manage")).not.toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Choose a plan" });
    expect(link).toHaveAttribute("href", "/subscribe");
  });

  it("legacy-native + Apple-entitled: unchanged legacy-native suppression, no in-app Apple link, no Apple read issued", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    await renderPage();

    // The new branch is scoped to `iosIap` only — legacy-native must never
    // even issue the service-role Apple read.
    expect(getActiveAppleProductIdMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("settings-apple-manage")).not.toBeInTheDocument();
    expect(screen.getByTestId("no-subscription")).toHaveTextContent(
      "Subscribe to From Victory from a web browser at fromvictoryapp.com.",
    );
  });

  it("web (capability null): unchanged, no Apple read issued and no Apple manage link", async () => {
    shellCapabilityMock.mockReturnValue(null);
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    await renderPage();

    expect(getActiveAppleProductIdMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("settings-apple-manage")).not.toBeInTheDocument();
    expect(screen.getByTestId("no-subscription")).toHaveTextContent(
      "No active subscription.",
    );
  });
});
