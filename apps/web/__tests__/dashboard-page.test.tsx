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

const { requireParentMock, shellCapabilityMock, accessLevelMock, entitlementStateMock } =
  vi.hoisted(() => ({
    // FV-655: the dashboard consults the error-tracking entitlement read when
    // the access level isn't "full". Default: a readable, not-entitled payer.
    entitlementStateMock: vi.fn(async () => ({
      status: "not_entitled" as "entitled" | "not_entitled" | "unknown",
      provider: null as "apple" | "stripe" | "comp" | null,
    })),
    requireParentMock: vi.fn(),
    // Google Play "no in-app purchase" compliance + FV-572/577 capability.
    // Defaults to null (ordinary web/PWA request) — individual tests
    // override per case with "legacy-native" | "ios-iap" | null.
    shellCapabilityMock: vi.fn(() => null as "legacy-native" | "ios-iap" | "android-play" | null),
    accessLevelMock: vi.fn(async () => "blocked"),
  }));

vi.mock("@/lib/auth/guards", () => ({
  requireParent: requireParentMock,
}));

vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: shellCapabilityMock,
}));

vi.mock("@/lib/subscriptions/access", () => ({
  getParentAccessLevel: accessLevelMock,
}));

vi.mock("@/lib/subscriptions/subscribe-guard", () => ({
  getSubscribeEntitlementState: entitlementStateMock,
}));

// FV-585 (KC decision D2): the seat-selection banner is out of scope for this
// file (dashboard-seat-selection.test.tsx owns it) — stub the "everyone
// active" default so these native-shell tests never render it.
vi.mock("@/lib/subscriptions/seat-state", () => ({
  getPayerSeatStateForCurrentParent: vi.fn(async () => ({
    status: "uncapped",
    capacity: null,
    athleteCount: 0,
    activeAthleteIds: [],
    pausedAthleteIds: [],
  })),
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

// FV-652: the dashboard reads Apple subscription status (service-role,
// centralized accessor) to decide whether the Delete account section warns
// an App Store subscriber. Default: no Apple subscription.
const { appleLookupMock } = vi.hoisted(() => ({
  appleLookupMock: vi.fn(
    async (): Promise<{ productId: string | null; readError: boolean }> => ({
      productId: null,
      readError: false,
    }),
  ),
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({}),
}));
vi.mock("@/lib/subscriptions/apple", () => ({
  getDisplayedAppleProductIdResult: appleLookupMock,
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
  shellCapabilityMock.mockReturnValue(null);
  accessLevelMock.mockResolvedValue("blocked");
  appleLookupMock.mockResolvedValue({ productId: null, readError: false });
  entitlementStateMock.mockResolvedValue({ status: "not_entitled", provider: null });
});

async function renderPage() {
  requireParentMock.mockResolvedValue({
    userId: "parent-1",
    profile: { id: "parent-1", role: "parent", first_name: "Kim" },
  });
  const jsx = await DashboardPage();
  return render(jsx);
}

describe("/dashboard — subscribe CTA shell-capability branch (Google Play compliance, FV-572/577)", () => {
  it("shows the real 'Choose a plan' CTA with price copy when capability is null (web)", async () => {
    shellCapabilityMock.mockReturnValue(null);

    await renderPage();

    const link = screen.getByTestId("dashboard-subscribe-cta");
    expect(link).toHaveAttribute("href", "/subscribe");
    expect(link).toHaveTextContent("Choose a plan");
    expect(
      screen.getByText(/\$5\/mo for your first athlete/i),
    ).toBeInTheDocument();
  });

  it("drops the CTA link and shows browser-subscribe copy when capability is 'legacy-native'", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");

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

  it("shows a price-free in-app 'Choose a plan' entry to /subscribe when capability is 'ios-iap' (FV-577)", async () => {
    shellCapabilityMock.mockReturnValue("ios-iap");

    const { container } = await renderPage();

    const link = screen.getByTestId("dashboard-subscribe-cta");
    expect(link).toHaveAttribute("href", "/subscribe");
    expect(link).toHaveTextContent("Choose a plan");
    expect(container.textContent ?? "").not.toMatch(/web browser/i);
    expect(container.textContent ?? "").not.toMatch(/\$/);
  });

  it("never shows the subscribe CTA section at all when access is full, regardless of shell capability", async () => {
    accessLevelMock.mockResolvedValue("full");
    shellCapabilityMock.mockReturnValue("legacy-native");

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

describe("/dashboard — Add athlete shell-capability branch (FV-622, Android Path A)", () => {
  it("legacy-native: plain website text instead of the Add athlete link", async () => {
    accessLevelMock.mockResolvedValue("full");
    shellCapabilityMock.mockReturnValue("legacy-native");

    await renderPage();

    const notice = screen.getByTestId("add-athlete-native-shell-notice");
    expect(notice).toHaveTextContent(
      "Add athletes from a web browser at fromvictoryapp.com.",
    );
    expect(notice.querySelector("a")).toBeNull();
    expect(
      screen
        .queryAllByRole("link")
        .filter((a) => a.getAttribute("href") === "/dashboard/athletes/new"),
    ).toHaveLength(0);
  });

  it.each(["ios-iap", null] as const)(
    "%s: unchanged — the Add athlete link is present",
    async (capability) => {
      accessLevelMock.mockResolvedValue("full");
      shellCapabilityMock.mockReturnValue(capability);

      await renderPage();

      expect(screen.getByRole("link", { name: "Add athlete" })).toHaveAttribute(
        "href",
        "/dashboard/athletes/new",
      );
      expect(
        screen.queryByTestId("add-athlete-native-shell-notice"),
      ).toBeNull();
    },
  );
});

describe("/dashboard — App Store subscriber delete notice (FV-652)", () => {
  const NOTICE = /your app store subscription is managed by apple/i;

  it("a parent with an active Apple subscription is told deleting does not cancel it", async () => {
    appleLookupMock.mockResolvedValue({
      productId: "com.fromvictoryapp.app.family.2.yearly",
      readError: false,
    });

    await renderPage();

    const notice = screen.getByTestId("delete-account-apple-notice");
    expect(notice).toHaveTextContent(NOTICE);
    expect(notice).toHaveTextContent(/tap your name, then subscriptions/i);
    expect(notice).toHaveTextContent(/does not cancel it/i);
    expect(notice).toHaveTextContent(/cannot be automatically re-attached/i);
    expect(appleLookupMock).toHaveBeenCalledWith(expect.anything(), "parent-1");
  });

  it("the notice comes before the Delete button, so it is read before any confirmation", async () => {
    appleLookupMock.mockResolvedValue({
      productId: "com.fromvictoryapp.app.family.1.monthly",
      readError: false,
    });

    await renderPage();

    const notice = screen.getByTestId("delete-account-apple-notice");
    const button = screen.getByRole("button", { name: /delete my account/i });
    expect(
      notice.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("Apple status read error → a hedged notice shows (fail toward warning, without asserting a subscription)", async () => {
    appleLookupMock.mockResolvedValue({ productId: null, readError: true });

    await renderPage();

    const notice = screen.getByTestId("delete-account-apple-notice");
    expect(notice).toHaveAttribute("data-variant", "unknown");
    expect(notice).toHaveTextContent(
      /^if you subscribed through the app store, that subscription is managed by apple\./i,
    );
    expect(notice).not.toHaveTextContent(NOTICE);
    expect(notice).toHaveTextContent(/does not cancel it/i);
  });

  it("a parent with no Apple subscription sees no notice and the unchanged delete copy", async () => {
    await renderPage();

    expect(
      screen.queryByTestId("delete-account-apple-notice"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/permanently delete your account and every athlete you manage/i),
    ).toBeInTheDocument();
  });

  it("the notice appears inside the legacy-native shell too, with no price or checkout text", async () => {
    shellCapabilityMock.mockReturnValue("legacy-native");
    appleLookupMock.mockResolvedValue({
      productId: "com.fromvictoryapp.app.family.1.monthly",
      readError: false,
    });

    await renderPage();

    const text = screen.getByTestId("delete-account-apple-notice").textContent ?? "";
    expect(text).toMatch(NOTICE);
    expect(text).not.toMatch(/\$|stripe|checkout/i);
  });
});

describe("/dashboard — subscription status can't be read (FV-655)", () => {
  // getParentAccessLevel fails closed ("blocked") on a read error, so before
  // FV-655 a paying family saw "Start training today / Choose a plan" during
  // an outage. An unreadable status now shows /subscribe's neutral line.
  it.each([null, "legacy-native", "ios-iap"] as const)(
    "shell %s: shows the neutral status line, no purchase prompt",
    async (capability) => {
      shellCapabilityMock.mockReturnValue(capability);
      accessLevelMock.mockResolvedValue("blocked");
      entitlementStateMock.mockResolvedValue({ status: "unknown", provider: null });

      const { container } = await renderPage();

      expect(
        screen.getByTestId("dashboard-subscription-status-unknown"),
      ).toHaveTextContent("We couldn’t check your access. Please try again. If you already subscribe, don’t purchase another subscription.");
      // FV-656: a retry back to the dashboard, which re-reads the status.
      expect(
        screen.getByTestId("dashboard-subscription-status-unknown-retry"),
      ).toHaveAttribute("href", "/dashboard");
      expect(screen.queryByTestId("dashboard-subscribe-cta")).not.toBeInTheDocument();
      expect(container.textContent ?? "").not.toMatch(/start training today/i);
      expect(container.textContent ?? "").not.toMatch(/subscribe to from victory/i);
      expect(container.textContent ?? "").not.toMatch(/\$/);
    },
  );

  it("a readable not-entitled payer still gets the subscribe banner (unchanged)", async () => {
    accessLevelMock.mockResolvedValue("blocked");
    entitlementStateMock.mockResolvedValue({ status: "not_entitled", provider: null });

    await renderPage();

    expect(screen.getByTestId("dashboard-subscribe-cta")).toHaveTextContent("Choose a plan");
    expect(screen.queryByTestId("dashboard-subscription-status-unknown")).not.toBeInTheDocument();
  });

  it("a fully entitled parent never triggers the extra read", async () => {
    accessLevelMock.mockResolvedValue("full");

    await renderPage();

    expect(entitlementStateMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("dashboard-subscription-status-unknown")).not.toBeInTheDocument();
  });
});

describe("/dashboard — android-play renders exactly like legacy-native (FV-659)", () => {
  async function htmlFor(capability: "legacy-native" | "android-play") {
    shellCapabilityMock.mockReturnValue(capability);
    const { container } = await renderPage();
    const html = container.innerHTML;
    cleanup();
    return html;
  }

  it.each(["blocked", "full"] as const)(
    "access %s: identical markup, including the subscribe + Add athlete notices",
    async (level) => {
      accessLevelMock.mockResolvedValue(level);
      const legacy = await htmlFor("legacy-native");
      const play = await htmlFor("android-play");
      expect(play).toBe(legacy);
    },
  );

  it("android-play: no subscribe CTA, browser-subscribe copy, plain-text Add athlete", async () => {
    accessLevelMock.mockResolvedValue("blocked");
    shellCapabilityMock.mockReturnValue("android-play");
    await renderPage();
    expect(screen.queryByTestId("dashboard-subscribe-cta")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Subscribe to From Victory from a web browser at fromvictoryapp.com.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("add-athlete-native-shell-notice")).toBeInTheDocument();
  });

  it("android-play: unknown subscription status shows the neutral line, no purchase prompt (FV-655)", async () => {
    shellCapabilityMock.mockReturnValue("android-play");
    accessLevelMock.mockResolvedValue("blocked");
    entitlementStateMock.mockResolvedValue({ status: "unknown", provider: null });
    await renderPage();
    expect(screen.getByTestId("dashboard-subscription-status-unknown")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-subscribe-cta")).not.toBeInTheDocument();
  });
});
