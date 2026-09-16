/**
 * @vitest-environment jsdom
 *
 * RTL tests for /athlete/settings (FV-441).
 *
 * FV-441 adds a "Subscription" section (BillingPortalButton) and a
 * "Delete account" section (DeleteAccountSection, copy-neutral variant) to
 * the athlete settings page — gated to `profile.role === "adult_athlete"`
 * ONLY. A minor athlete (role: "athlete") must never see Stripe/billing or
 * self-delete UI; that boundary is the single assertion kids-privacy-officer
 * will check hardest, so it gets its own dedicated test (case 1).
 *
 * Follows the async-server-component render pattern from
 * __tests__/subscribe-page.test.tsx (await the page function, render the
 * returned JSX) and the react-dom useFormState shim from
 * __tests__/subscribe-form.test.tsx (Next aliases react-dom to a canary
 * build with useFormState/useFormStatus that the plain npm package Vitest
 * resolves does not export).
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Belt-and-suspenders: some transitively-imported server module reaches the
// real "server-only" package even with the mocks below in place (it throws
// outside a true server/webpack context). See account-settings.test.ts for
// the same pattern.
vi.mock("server-only", () => ({}));

// Test-env shim — see subscribe-form.test.tsx for the full rationale.
// BillingPortalButton and DeleteAccountSection both call useFormState /
// useFormStatus; these tests only assert on rendered markup and never
// actually submit, so a no-dispatch useState passthrough is enough.
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
  requireAthleteMock,
  maybeSingleMock,
  subscriptionsMaybeSingleMock,
  shellCapabilityMock,
  getActiveAppleProductIdResultMock,
} = vi.hoisted(() => ({
  requireAthleteMock: vi.fn(),
  // push_subscriptions read (the "Daily reminder" row).
  maybeSingleMock: vi.fn(),
  // FV-579: subscriptions read (`.eq("parent_id", userId)`), consulted ONLY
  // when `isAdult && iosIap` — see subscriptions-read-gating tests below.
  // Defaults to "no Stripe row" so tests that don't care about the Stripe
  // branch don't need to stub it explicitly.
  subscriptionsMaybeSingleMock: vi.fn(
    async () =>
      ({ data: null, error: null }) as {
        data: { status: string } | null;
        error: { message: string } | null;
      },
  ),
  // Google Play "no in-app purchase" compliance + FV-572/577 capability.
  // Defaults to null (ordinary web/PWA request) — the shell-capability
  // describe block below overrides it per test with
  // "legacy-native" | "ios-iap" | null.
  shellCapabilityMock: vi.fn(() => null as "legacy-native" | "ios-iap" | null),
  // FV-579/FV-580 — the centralized `apple_subscriptions` accessor. Defaults
  // to "no active Apple entitlement, read succeeded"; individual tests
  // override per case.
  getActiveAppleProductIdResultMock: vi.fn(
    async () =>
      ({ productId: null, readError: false }) as {
        productId: string | null;
        readError: boolean;
      },
  ),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAthlete: requireAthleteMock,
}));

vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: shellCapabilityMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle:
            table === "subscriptions" ? subscriptionsMaybeSingleMock : maybeSingleMock,
        }),
      }),
    }),
  }),
}));

// FV-579 — the page never issues a raw `apple_subscriptions` query itself;
// it calls the ONE centralized service-role accessor. Mocking the whole
// module keeps this test file from needing real Supabase env/service-role
// wiring for a status read.
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({}),
}));

vi.mock("@/lib/subscriptions/apple", () => ({
  getActiveAppleProductIdResult: getActiveAppleProductIdResultMock,
}));

// The BillingPortalButton and DeleteAccountSection Client Components import
// these actions directly — stub them so the test never pulls in Stripe /
// requireSubscriber / service-role Supabase wiring.
vi.mock("@/lib/actions/billing-portal", () => ({
  openBillingPortal: vi.fn(),
}));
vi.mock("@/lib/actions/account", () => ({
  deleteAccount: vi.fn(),
}));

import AthleteSettingsPage from "@/app/athlete/settings/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // clearAllMocks keeps mockReturnValue overrides — restore defaults so
  // test order never matters.
  shellCapabilityMock.mockReturnValue(null);
  subscriptionsMaybeSingleMock.mockResolvedValue({ data: null, error: null });
  getActiveAppleProductIdResultMock.mockResolvedValue({
    productId: null,
    readError: false,
  });
});

const BASE_PROFILE = {
  id: "athlete-1",
  first_name: "Jordan",
  sport: "hockey" as const,
  sport_selected_at: "2026-01-01T00:00:00Z",
  position: null,
  focus_area: null,
};

async function renderSettings(role: "athlete" | "adult_athlete") {
  requireAthleteMock.mockResolvedValue({
    userId: "athlete-1",
    profile: { ...BASE_PROFILE, role },
  });
  maybeSingleMock.mockResolvedValue({ data: null, error: null });

  const jsx = await AthleteSettingsPage({ searchParams: {} });
  return render(jsx);
}

describe("/athlete/settings — Subscription + Delete account gating (FV-441)", () => {
  it("a minor athlete sees NO billing or delete-account UI (critical assertion)", async () => {
    await renderSettings("athlete");

    expect(screen.queryByTestId("billing-portal-btn")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Subscription" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Delete account" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /delete my account/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/manage or cancel your subscription/i)).not.toBeInTheDocument();
  });

  it("an adult_athlete sees both the Subscription and Delete account sections", async () => {
    await renderSettings("adult_athlete");

    expect(
      screen.getByRole("heading", { name: "Subscription" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("billing-portal-btn")).toBeInTheDocument();
    expect(screen.getByText(/manage or cancel your subscription/i)).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Delete account" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /deletes your account, training history, and subscription\. this cannot be undone\./i,
      ),
    ).toBeInTheDocument();
  });

  it("the delete control is a real form with typed DELETE confirmation", async () => {
    await renderSettings("adult_athlete");

    const openButton = screen.getByRole("button", { name: /delete my account/i });
    fireEvent.click(openButton);

    const confirmInput = screen.getByLabelText(/type\s+delete\s+to confirm/i);
    expect(confirmInput).toBeInTheDocument();
    expect(confirmInput.tagName).toBe("INPUT");

    // The page also renders the Subscription section's own <form> (Billing
    // Portal submit) — assert the delete confirmation lives in ITS OWN real
    // <form> ancestor, not just anywhere in the container.
    const form = confirmInput.closest("form");
    expect(form).not.toBeNull();
    expect(form).toContainElement(confirmInput);

    // Confirm button starts disabled until the typed value matches "DELETE".
    const confirmButton = screen.getByRole("button", { name: /^delete my account$/i });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(confirmInput, { target: { value: "DELETE" } });
    expect(confirmButton).not.toBeDisabled();
  });
});

describe("/athlete/settings — shell-capability billing-portal suppression (Google Play compliance, FV-572/577)", () => {
  it("replaces BillingPortalButton with a neutral, non-tappable notice when capability is 'legacy-native'", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");
    await renderSettings("adult_athlete");

    expect(screen.queryByTestId("billing-portal-btn")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-subscribe-btn"),
    ).not.toBeInTheDocument();
    const notice = screen.getByTestId("billing-portal-native-shell-notice");
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(
      "Manage your From Victory subscription from a web browser at fromvictoryapp.com.",
    );
  });

  it("drops the 'Manage or cancel your subscription.' helper line in-shell (FV-492)", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");
    const { container } = await renderSettings("adult_athlete");

    expect(
      screen.queryByText(/manage or cancel your subscription/i),
    ).not.toBeInTheDocument();
    // No user-visible Stripe/portal wording anywhere in-shell; the neutral
    // browser notice is the only subscription copy.
    expect(container.textContent ?? "").not.toMatch(/stripe|portal/i);
    expect(
      screen.getByTestId("billing-portal-native-shell-notice"),
    ).toBeInTheDocument();
  });

  it("still renders the real BillingPortalButton when capability is null (web)", async () => {
    shellCapabilityMock.mockReturnValue(null);
    await renderSettings("adult_athlete");

    expect(screen.getByTestId("billing-portal-btn")).toBeInTheDocument();
    expect(
      screen.queryByTestId("billing-portal-native-shell-notice"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-subscribe-btn"),
    ).not.toBeInTheDocument();
  });

  it("a minor athlete never sees the native-shell notice either (no billing UI at all)", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");
    await renderSettings("athlete");

    expect(
      screen.queryByTestId("billing-portal-native-shell-notice"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("billing-portal-btn")).not.toBeInTheDocument();
  });

  it("shows a price-free 'Manage subscription' entry to /subscribe when capability is 'ios-iap' and Apple-active (FV-577, gated by FV-579)", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    getActiveAppleProductIdResultMock.mockResolvedValue({
      productId: "com.fromvictoryapp.app.plan1",
      readError: false,
    });
    const { container } = await renderSettings("adult_athlete");

    expect(screen.queryByTestId("billing-portal-btn")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("billing-portal-native-shell-notice"),
    ).not.toBeInTheDocument();
    const link = screen.getByTestId("settings-subscribe-btn");
    expect(link).toHaveAttribute("href", "/subscribe");
    expect(link).toHaveTextContent("Manage subscription");
    expect(container.textContent ?? "").not.toMatch(/web browser/i);
    expect(container.textContent ?? "").not.toMatch(/\$/);
  });

  it("a minor athlete never sees the ios-iap subscribe entry either (no billing UI at all)", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    await renderSettings("athlete");

    expect(
      screen.queryByTestId("settings-subscribe-btn"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("billing-portal-btn")).not.toBeInTheDocument();
  });
});

describe("/athlete/settings — ios-iap provider-aware, error-visible subscription control (FV-579)", () => {
  it("Apple-active (no Stripe) → 'Manage subscription' link; no stripe-notice/choose-plan/neutral", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    getActiveAppleProductIdResultMock.mockResolvedValue({
      productId: "com.fromvictoryapp.app.plan1",
      readError: false,
    });
    subscriptionsMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    await renderSettings("adult_athlete");

    const link = screen.getByTestId("settings-subscribe-btn");
    expect(link).toHaveAttribute("href", "/subscribe");
    expect(link).toHaveTextContent("Manage subscription");
    expect(
      screen.queryByTestId("settings-stripe-manage-notice"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-choose-plan")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-subscription-status-unavailable"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/manage or cancel your subscription/i)).toBeInTheDocument();
  });

  it("Stripe-active (no Apple) → browser manage notice; no manage link/choose-plan", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    getActiveAppleProductIdResultMock.mockResolvedValue({
      productId: null,
      readError: false,
    });
    subscriptionsMaybeSingleMock.mockResolvedValue({
      data: { status: "active" },
      error: null,
    });

    await renderSettings("adult_athlete");

    const notice = screen.getByTestId("settings-stripe-manage-notice");
    expect(notice).toHaveAttribute("role", "status");
    expect(notice).toHaveTextContent(
      "Manage your From Victory subscription from a web browser at fromvictoryapp.com.",
    );
    expect(screen.queryByTestId("settings-subscribe-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-choose-plan")).not.toBeInTheDocument();
    expect(screen.getByText(/manage or cancel your subscription/i)).toBeInTheDocument();
  });

  it("Stripe DEGRADED status (no Apple) → still counts as active, shows browser manage notice (pins full/degraded-both-active semantics)", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    getActiveAppleProductIdResultMock.mockResolvedValue({
      productId: null,
      readError: false,
    });
    subscriptionsMaybeSingleMock.mockResolvedValue({
      data: { status: "past_due" },
      error: null,
    });

    await renderSettings("adult_athlete");

    const notice = screen.getByTestId("settings-stripe-manage-notice");
    expect(notice).toHaveAttribute("role", "status");
    expect(notice).toHaveTextContent(
      "Manage your From Victory subscription from a web browser at fromvictoryapp.com.",
    );
    expect(screen.queryByTestId("settings-subscribe-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-choose-plan")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-subscription-status-unavailable"),
    ).not.toBeInTheDocument();
  });

  it("Apple precedence: dual-provider (Apple-active AND Stripe-active) still shows the Apple manage link", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    getActiveAppleProductIdResultMock.mockResolvedValue({
      productId: "com.fromvictoryapp.app.plan1",
      readError: false,
    });
    subscriptionsMaybeSingleMock.mockResolvedValue({
      data: { status: "active" },
      error: null,
    });

    await renderSettings("adult_athlete");

    expect(screen.getByTestId("settings-subscribe-btn")).toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-stripe-manage-notice"),
    ).not.toBeInTheDocument();
  });

  it("no subscription at all (both none, no errors) → 'Choose a plan'; no manage link, no notice, no helper line", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    getActiveAppleProductIdResultMock.mockResolvedValue({
      productId: null,
      readError: false,
    });
    subscriptionsMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    await renderSettings("adult_athlete");

    const link = screen.getByTestId("settings-choose-plan");
    expect(link).toHaveAttribute("href", "/subscribe");
    expect(link).toHaveTextContent("Choose a plan");
    expect(screen.queryByTestId("settings-subscribe-btn")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-stripe-manage-notice"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-subscription-status-unavailable"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/manage or cancel your subscription/i),
    ).not.toBeInTheDocument();
  });

  it("Apple read-error (no Stripe) → neutral 'couldn't load' status; no choose-plan, no $", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    getActiveAppleProductIdResultMock.mockResolvedValue({
      productId: null,
      readError: true,
    });
    subscriptionsMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    const { container } = await renderSettings("adult_athlete");

    const notice = screen.getByTestId("settings-subscription-status-unavailable");
    expect(notice).toHaveAttribute("role", "status");
    expect(notice).toHaveTextContent(
      "We couldn’t load your subscription status. Please try again.",
    );
    expect(screen.queryByTestId("settings-choose-plan")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-subscribe-btn")).not.toBeInTheDocument();
    expect(container.textContent ?? "").not.toMatch(/\$/);
    expect(
      screen.queryByText(/manage or cancel your subscription/i),
    ).not.toBeInTheDocument();
  });

  it("Stripe read-error (no Apple) → neutral 'couldn't load' status", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");
    getActiveAppleProductIdResultMock.mockResolvedValue({
      productId: null,
      readError: false,
    });
    subscriptionsMaybeSingleMock.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    const { container } = await renderSettings("adult_athlete");

    expect(
      screen.getByTestId("settings-subscription-status-unavailable"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("settings-choose-plan")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-subscribe-btn")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-stripe-manage-notice"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/manage or cancel your subscription/i),
    ).not.toBeInTheDocument();
    expect(container.textContent ?? "").not.toMatch(/\$/);
  });

  it("web (capability null): reads are NOT consulted, BillingPortalButton unchanged", async () => {
    shellCapabilityMock.mockReturnValue(null);

    await renderSettings("adult_athlete");

    expect(getActiveAppleProductIdResultMock).not.toHaveBeenCalled();
    expect(subscriptionsMaybeSingleMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("billing-portal-btn")).toBeInTheDocument();
    expect(screen.getByText(/manage or cancel your subscription/i)).toBeInTheDocument();
  });

  it("legacy-native: reads are NOT consulted, browser notice unchanged", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");

    await renderSettings("adult_athlete");

    expect(getActiveAppleProductIdResultMock).not.toHaveBeenCalled();
    expect(subscriptionsMaybeSingleMock).not.toHaveBeenCalled();
    expect(
      screen.getByTestId("billing-portal-native-shell-notice"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/manage or cancel your subscription/i),
    ).not.toBeInTheDocument();
  });

  it("minor athlete (role 'athlete') in ios-iap: Subscription section not rendered, reads never consulted", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");

    await renderSettings("athlete");

    expect(
      screen.queryByRole("heading", { name: "Subscription" }),
    ).not.toBeInTheDocument();
    expect(getActiveAppleProductIdResultMock).not.toHaveBeenCalled();
    expect(subscriptionsMaybeSingleMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("settings-subscribe-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-choose-plan")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-stripe-manage-notice"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-subscription-status-unavailable"),
    ).not.toBeInTheDocument();
  });
});
