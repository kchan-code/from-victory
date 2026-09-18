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

const { requireAthleteMock, isNativeShellMock } = vi.hoisted(() => ({
  requireAthleteMock: vi.fn(),
  // Google Play "no in-app purchase" compliance. Defaults to false
  // (ordinary web/PWA request) — individual tests override per case.
  isNativeShellMock: vi.fn(() => false),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAthlete: requireAthleteMock,
}));

vi.mock("@/lib/native-shell", () => ({
  isNativeShell: isNativeShellMock,
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
  isNativeShellMock.mockReturnValue(false);
});

async function renderPage(
  role: "athlete" | "adult_athlete",
  searchParams?: { reason?: string | string[] },
) {
  requireAthleteMock.mockResolvedValue({
    userId: "athlete-1",
    profile: { id: "athlete-1", role, first_name: "Jordan" },
  });
  const jsx = await AthletePausedPage({ searchParams });
  return render(jsx);
}

describe("/athlete/paused — reactivate-link native-shell branch (adult_athlete)", () => {
  it("shows the real 'Reactivate subscription' link to /subscribe when isNativeShell() is false", async () => {
    isNativeShellMock.mockReturnValue(false);

    await renderPage("adult_athlete");

    const link = screen.getByTestId("paused-reactivate-link");
    expect(link).toHaveAttribute("href", "/subscribe");
    expect(link).toHaveTextContent("Reactivate subscription");
    expect(
      screen.queryByTestId("paused-native-shell-notice"),
    ).not.toBeInTheDocument();
  });

  it("replaces the reactivate link with a neutral, non-tappable notice when isNativeShell() is true", async () => {
    isNativeShellMock.mockReturnValue(true);

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
});

describe("/athlete/paused — minor athlete boundary (untouched by native-shell branching)", () => {
  it("a minor athlete sees neither the reactivate link nor the native-shell notice, in-shell or not", async () => {
    isNativeShellMock.mockReturnValue(true);
    await renderPage("athlete");

    expect(
      screen.queryByTestId("paused-reactivate-link"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("paused-native-shell-notice"),
    ).not.toBeInTheDocument();
  });
});

describe("/athlete/paused — seat-pause copy variant (FV-585, KC decision D2)", () => {
  it("shows the seat-pause copy for a minor athlete when reason=seats", async () => {
    await renderPage("athlete", { reason: "seats" });

    expect(screen.getByTestId("paused-body-copy")).toHaveTextContent(
      "Your family's plan has fewer spots right now. Ask your parent to choose who's active from their dashboard.",
    );
    // Never billing details for a seat pause.
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    expect(screen.getByText("Your data is safe. Nothing has been removed.")).toBeInTheDocument();
  });

  it("keeps the default copy unchanged when there is no reason param", async () => {
    await renderPage("athlete");

    expect(screen.getByTestId("paused-body-copy")).toHaveTextContent(
      "Your training is on hold right now. To get back in, ask your parent to reactivate access from their dashboard.",
    );
  });

  it("keeps the default copy unchanged for an unrecognized reason value", async () => {
    await renderPage("athlete", { reason: "billing" });

    expect(screen.getByTestId("paused-body-copy")).toHaveTextContent(
      "Your training is on hold right now. To get back in, ask your parent to reactivate access from their dashboard.",
    );
  });

  it("an adult_athlete falls back to the existing adult copy even if reason=seats reaches them defensively", async () => {
    await renderPage("adult_athlete", { reason: "seats" });

    expect(screen.getByTestId("paused-body-copy")).toHaveTextContent(
      "Your training is on hold right now. You can reactivate any time from your subscription.",
    );
  });

  it("never uses 'kid' in the seat-pause copy (audience-language guard)", async () => {
    await renderPage("athlete", { reason: "seats" });

    expect(screen.getByTestId("paused-body-copy").textContent).not.toMatch(
      /\bkid\b/i,
    );
  });
});
