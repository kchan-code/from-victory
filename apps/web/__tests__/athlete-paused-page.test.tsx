/**
 * @vitest-environment jsdom
 *
 * RTL tests for the native-shell reactivate-link branch on /athlete/paused
 * (Google Play "no in-app purchase" compliance, FV-478).
 *
 * QA-flagged gap: FV-478 shipped nativeShell branching on this page (the
 * adult_athlete "Reactivate subscription" link) with no direct test
 * coverage. This file closes that gap using the
 * vi.mock("@/lib/native-shell") pattern from __tests__/subscribe-page.test.tsx.
 * A minor athlete never sees this link at all (untouched by FV-478 — no
 * pricing/Stripe for minors) so that boundary gets its own assertion too.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("server-only", () => ({}));

const { requireAthleteMock, shellCapabilityMock } = vi.hoisted(() => ({
  requireAthleteMock: vi.fn(),
  // Google Play "no in-app purchase" compliance + FV-572/577 capability.
  // Defaults to null (ordinary web/PWA request) — individual tests override
  // per case with "legacy-native" | "ios-iap" | null.
  shellCapabilityMock: vi.fn(() => null as "legacy-native" | "ios-iap" | null),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAthlete: requireAthleteMock,
}));

vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: shellCapabilityMock,
}));

// SignOutButton pulls in localStorage-clearing helpers + the signOut server
// action; not under test here — a real render is fine, but stub the action
// module to keep this test scoped and dependency-light.
vi.mock("@/lib/actions/auth", () => ({
  signOut: vi.fn(),
}));

import AthletePausedPage from "@/app/athlete/paused/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // clearAllMocks keeps mockReturnValue overrides — restore the
  // native-shell default so test order never matters.
  shellCapabilityMock.mockReturnValue(null);
});

async function renderPage(role: "athlete" | "adult_athlete") {
  requireAthleteMock.mockResolvedValue({
    userId: "athlete-1",
    profile: { id: "athlete-1", role, first_name: "Jordan" },
  });
  const jsx = await AthletePausedPage();
  return render(jsx);
}

describe("/athlete/paused — reactivate-link shell-capability branch (adult_athlete, FV-572/577)", () => {
  it("shows the real 'Reactivate subscription' link to /subscribe when capability is null (web)", async () => {
    shellCapabilityMock.mockReturnValue(null);

    await renderPage("adult_athlete");

    const link = screen.getByTestId("paused-reactivate-link");
    expect(link).toHaveAttribute("href", "/subscribe");
    expect(link).toHaveTextContent("Reactivate subscription");
    expect(
      screen.queryByTestId("paused-native-shell-notice"),
    ).not.toBeInTheDocument();
  });

  it("replaces the reactivate link with a neutral, non-tappable notice when capability is 'legacy-native'", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");

    await renderPage("adult_athlete");

    expect(
      screen.queryByTestId("paused-reactivate-link"),
    ).not.toBeInTheDocument();
    const notice = screen.getByTestId("paused-native-shell-notice");
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(
      "Manage your From Victory subscription from a web browser at fromvictoryapp.com.",
    );
  });

  it("keeps the real, price-free 'Reactivate subscription' link to /subscribe when capability is 'ios-iap'", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");

    const { container } = await renderPage("adult_athlete");

    const link = screen.getByTestId("paused-reactivate-link");
    expect(link).toHaveAttribute("href", "/subscribe");
    expect(link).toHaveTextContent("Reactivate subscription");
    expect(
      screen.queryByTestId("paused-native-shell-notice"),
    ).not.toBeInTheDocument();
    expect(container.textContent ?? "").not.toMatch(/web browser/i);
    expect(container.textContent ?? "").not.toMatch(/\$/);
  });
});

describe("/athlete/paused — minor athlete boundary (untouched by shell-capability branching)", () => {
  it("a minor athlete sees neither the reactivate link nor the native-shell notice, in-shell or not", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");
    await renderPage("athlete");

    expect(
      screen.queryByTestId("paused-reactivate-link"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("paused-native-shell-notice"),
    ).not.toBeInTheDocument();
  });
});
