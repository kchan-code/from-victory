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

const { requireAthleteMock, maybeSingleMock, isNativeShellMock } = vi.hoisted(
  () => ({
    requireAthleteMock: vi.fn(),
    maybeSingleMock: vi.fn(),
    // Google Play "no in-app purchase" compliance. Defaults to false
    // (ordinary web/PWA request) — the native-shell describe block below
    // overrides it per test.
    isNativeShellMock: vi.fn(() => false),
  }),
);

vi.mock("@/lib/auth/guards", () => ({
  requireAthlete: requireAthleteMock,
}));

vi.mock("@/lib/native-shell", () => ({
  isNativeShell: isNativeShellMock,
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
  // clearAllMocks keeps mockReturnValue overrides — restore the
  // native-shell default so test order never matters.
  isNativeShellMock.mockReturnValue(false);
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

describe("/athlete/settings — native-shell billing-portal suppression (Google Play compliance)", () => {
  it("replaces BillingPortalButton with a neutral, non-tappable notice when isNativeShell() is true", async () => {
    isNativeShellMock.mockReturnValue(true);
    await renderSettings("adult_athlete");

    expect(screen.queryByTestId("billing-portal-btn")).not.toBeInTheDocument();
    const notice = screen.getByTestId("billing-portal-native-shell-notice");
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(
      "Manage your From Victory subscription from a web browser at fromvictoryapp.com.",
    );
  });

  it("drops the 'Manage or cancel your subscription.' helper line in-shell (FV-492)", async () => {
    isNativeShellMock.mockReturnValue(true);
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

  it("still renders the real BillingPortalButton when isNativeShell() is false", async () => {
    isNativeShellMock.mockReturnValue(false);
    await renderSettings("adult_athlete");

    expect(screen.getByTestId("billing-portal-btn")).toBeInTheDocument();
    expect(
      screen.queryByTestId("billing-portal-native-shell-notice"),
    ).not.toBeInTheDocument();
  });

  it("a minor athlete never sees the native-shell notice either (no billing UI at all)", async () => {
    isNativeShellMock.mockReturnValue(true);
    await renderSettings("athlete");

    expect(
      screen.queryByTestId("billing-portal-native-shell-notice"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("billing-portal-btn")).not.toBeInTheDocument();
  });
});
