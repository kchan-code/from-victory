/**
 * @vitest-environment jsdom
 *
 * RTL tests for the native-shell subscribe-CTA branch on /dashboard
 * (Google Play "no in-app purchase" compliance, FV-478).
 *
 * QA-flagged gap: FV-478 shipped nativeShell branching on this page (the
 * "Choose a plan" CTA banner) with no direct test coverage. This file closes
 * that gap using the vi.mock("@/lib/native-shell") pattern from
 * __tests__/subscribe-page.test.tsx. Scoped to the native-shell branch only —
 * broader dashboard behavior (athlete cards, rhythm, delete) is out of scope
 * here.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("server-only", () => ({}));

// Test-env shim — DeleteAccountSection (always rendered) calls useFormState /
// useFormStatus; these tests never submit it.
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

const { requireParentMock, isNativeShellMock, accessLevelMock } = vi.hoisted(
  () => ({
    requireParentMock: vi.fn(),
    // Google Play "no in-app purchase" compliance. Defaults to false
    // (ordinary web/PWA request) — individual tests override per case.
    isNativeShellMock: vi.fn(() => false),
    accessLevelMock: vi.fn(async () => "blocked"),
  }),
);

vi.mock("@/lib/auth/guards", () => ({
  requireParent: requireParentMock,
}));

vi.mock("@/lib/native-shell", () => ({
  isNativeShell: isNativeShellMock,
}));

vi.mock("@/lib/subscriptions/access", () => ({
  getParentAccessLevel: accessLevelMock,
}));

// No linked athletes for these tests — keeps RhythmRing / DeleteAthleteButton
// out of scope; DeleteAccountSection still renders regardless (page bottom).
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: [], error: null }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/dashboard/rhythm", () => ({
  getAthleteMetadataMap: vi.fn(async () => new Map()),
  ZERO_RHYTHM: {
    sessionsCompleted: 0,
    sessionsStarted: 0,
    progressPct: 0,
    ringLabel: "rhythm starts today",
    lastCompletedAt: null,
  },
}));

vi.mock("@/lib/actions/account", () => ({
  deleteAccount: vi.fn(),
  deleteAthlete: vi.fn(),
}));

import DashboardPage from "@/app/dashboard/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // clearAllMocks keeps mockReturnValue overrides — restore defaults so
  // test order never matters.
  isNativeShellMock.mockReturnValue(false);
  accessLevelMock.mockResolvedValue("blocked");
});

async function renderPage() {
  requireParentMock.mockResolvedValue({
    userId: "parent-1",
    profile: { id: "parent-1", role: "parent", first_name: "Kim" },
  });
  const jsx = await DashboardPage();
  return render(jsx);
}

describe("/dashboard — subscribe CTA native-shell branch (Google Play compliance)", () => {
  it("shows the real 'Choose a plan' CTA with price copy when isNativeShell() is false", async () => {
    isNativeShellMock.mockReturnValue(false);

    await renderPage();

    const link = screen.getByTestId("dashboard-subscribe-cta");
    expect(link).toHaveAttribute("href", "/subscribe");
    expect(link).toHaveTextContent("Choose a plan");
    expect(
      screen.getByText(/\$5\/mo for your first athlete/i),
    ).toBeInTheDocument();
  });

  it("drops the CTA link and shows browser-subscribe copy when isNativeShell() is true", async () => {
    isNativeShellMock.mockReturnValue(true);

    await renderPage();

    expect(
      screen.queryByTestId("dashboard-subscribe-cta"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Subscribe to From Victory from a web browser at fromvictoryapp.com.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\$5\/mo for your first athlete/i)).toBeNull();
  });

  it("never shows the subscribe CTA section at all when access is full, regardless of native-shell state", async () => {
    accessLevelMock.mockResolvedValue("full");
    isNativeShellMock.mockReturnValue(true);

    await renderPage();

    expect(
      screen.queryByTestId("dashboard-subscribe-cta"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Subscribe to From Victory from a web browser at fromvictoryapp.com.",
      ),
    ).not.toBeInTheDocument();
  });
});
