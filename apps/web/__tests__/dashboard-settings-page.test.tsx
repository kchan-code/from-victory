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
  isNativeShellMock,
  getUserMock,
  maybeSingleMock,
} = vi.hoisted(() => ({
  requireParentMock: vi.fn(),
  // Google Play "no in-app purchase" compliance. Defaults to false
  // (ordinary web/PWA request) — individual tests override per case.
  isNativeShellMock: vi.fn(() => false),
  getUserMock: vi.fn(async () => ({ data: { user: { email: "kim@example.com" } } })),
  maybeSingleMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireParent: requireParentMock,
}));

vi.mock("@/lib/native-shell", () => ({
  isNativeShell: isNativeShellMock,
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
  isNativeShellMock.mockReturnValue(false);
  getUserMock.mockResolvedValue({ data: { user: { email: "kim@example.com" } } });
});

async function renderPage() {
  requireParentMock.mockResolvedValue({
    userId: "parent-1",
    profile: { id: "parent-1", role: "parent", first_name: "Kim" },
  });
  const jsx = await DashboardSettingsPage();
  return render(jsx);
}

describe("/dashboard/settings — Billing Portal native-shell suppression", () => {
  it("renders the real BillingPortalButton when isNativeShell() is false", async () => {
    isNativeShellMock.mockReturnValue(false);
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

  it("replaces BillingPortalButton with a neutral, non-tappable notice when isNativeShell() is true", async () => {
    isNativeShellMock.mockReturnValue(true);
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

describe("/dashboard/settings — 'Choose a plan' native-shell gating (no subscription row)", () => {
  it("shows 'No active subscription.' + a 'Choose a plan' link to /subscribe when isNativeShell() is false", async () => {
    isNativeShellMock.mockReturnValue(false);
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    await renderPage();

    expect(screen.getByTestId("no-subscription")).toHaveTextContent(
      "No active subscription.",
    );
    const link = screen.getByRole("link", { name: "Choose a plan" });
    expect(link).toHaveAttribute("href", "/subscribe");
  });

  it("drops the 'Choose a plan' link and shows browser-subscribe copy when isNativeShell() is true", async () => {
    isNativeShellMock.mockReturnValue(true);
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    await renderPage();

    expect(
      screen.queryByRole("link", { name: "Choose a plan" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("no-subscription")).toHaveTextContent(
      "Subscribe to From Victory from a web browser at fromvictoryapp.com.",
    );
  });
});
