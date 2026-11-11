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

const { requireAthleteMock, shellCapabilityMock, clearAthleteCacheMock } = vi.hoisted(() => ({
  requireAthleteMock: vi.fn(),
  // FV-625 — the paused page revokes offline pregame on mount.
  clearAthleteCacheMock: vi.fn(),
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

vi.mock("@/lib/pregame/athlete-cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/pregame/athlete-cache")>()),
  clearAthleteCache: clearAthleteCacheMock,
}));

import AthletePausedPage from "@/app/athlete/paused/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // clearAllMocks keeps mockReturnValue overrides — restore the
  // native-shell default so test order never matters.
  shellCapabilityMock.mockReturnValue(null);
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

describe("/athlete/paused — FV-625 offline pregame revocation", () => {
  it.each<[string, "athlete" | "adult_athlete", { reason?: string } | undefined]>([
    ["billing pause (minor)", "athlete", undefined],
    ["seat pause (minor)", "athlete", { reason: "seats" }],
    ["adult self-payer", "adult_athlete", undefined],
  ])("clears the offline-pregame cache on mount — %s", async (_label, role, params) => {
    await renderPage(role, params);
    expect(clearAthleteCacheMock).toHaveBeenCalledTimes(1);
  });
});

describe("/athlete/paused?reason=unavailable — status couldn't be read (FV-656)", () => {
  it.each<["athlete" | "adult_athlete"]>([["athlete"], ["adult_athlete"]])(
    "%s: neutral copy, a Try again back to the hub, no parent/billing wording",
    async (role) => {
      const { container } = await renderPage(role, { reason: "unavailable" });
      const text = container.textContent ?? "";

      expect(screen.getByText("Access check")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 1 }),
      ).toHaveTextContent("We couldn’t check your access.");
      expect(screen.getByTestId("paused-body-copy")).toHaveTextContent("Please try again.");
      expect(screen.getByTestId("paused-try-again-link")).toHaveAttribute("href", "/athlete");
      // Never presented as a lapse, and no path to buying or reactivating.
      expect(text).not.toMatch(/paused|on hold|reactivate|ask your parent|subscription|\$/i);
      expect(screen.queryByTestId("paused-reactivate-link")).toBeNull();
      expect(screen.queryByTestId("paused-native-shell-notice")).toBeNull();
      // Exits stay.
      expect(screen.getByTestId("paused-settings-link")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    },
  );

  it("does NOT clear the offline-pregame cache (an unreadable status revokes nothing)", async () => {
    await renderPage("athlete", { reason: "unavailable" });
    expect(clearAthleteCacheMock).not.toHaveBeenCalled();
  });

  it("the default (confirmed lapse) copy and revocation are unchanged", async () => {
    await renderPage("athlete");
    expect(screen.getByText("Training paused")).toBeInTheDocument();
    expect(screen.queryByTestId("paused-try-again-link")).toBeNull();
    expect(clearAthleteCacheMock).toHaveBeenCalledTimes(1);
  });
});
