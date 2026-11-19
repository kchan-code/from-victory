/**
 * @vitest-environment jsdom
 *
 * RTL tests for /dashboard/athletes/new — the FV-586 (KC decision D3)
 * server-side wiring: resolving the trial-conversion quote and the Apple
 * capacity ceiling, then passing them to AthleteForm.
 *
 * AthleteForm has its own dedicated test file (athlete-form.test.tsx) for
 * its rendering logic — this file stays scoped to what the PAGE computes and
 * forwards.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const {
  requireParentMock,
  trialStateMock,
  trialQuoteMock,
  athleteCountMock,
  googleRowsMock,
  entitlementStateMock,
  googleSnapshotMock,
  activeAppleProductIdMock,
  capacityForAppleProductMock,
  shellCapabilityMock,
} = vi.hoisted(() => ({
  shellCapabilityMock: vi.fn(() => null as "legacy-native" | "ios-iap" | "android-play" | null),
  requireParentMock: vi.fn(),
  trialStateMock: vi.fn(),
  trialQuoteMock: vi.fn(),
  athleteCountMock: vi.fn(async () => ({ count: 0, error: null })),
  googleRowsMock: vi.fn(
    async (): Promise<{ data: Array<Record<string, unknown>>; error: { message: string } | null }> => ({
      data: [],
      error: null,
    }),
  ),
  entitlementStateMock: vi.fn(
    async (): Promise<{
      status: "entitled" | "not_entitled" | "unknown";
      provider: "google" | "stripe" | "apple" | "comp" | null;
    }> => ({ status: "not_entitled", provider: null }),
  ),
  googleSnapshotMock: vi.fn(async () => ({
    level: "full",
    latestEnd: null,
    activeProductId: "family.1",
    readError: false,
  })),
  activeAppleProductIdMock: vi.fn(async () => null as string | null),
  capacityForAppleProductMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: shellCapabilityMock,
}));

vi.mock("@/lib/auth/guards", () => ({
  requireParent: requireParentMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "parent_athlete_links") {
        return {
          select: () => ({ eq: athleteCountMock }),
        };
      }
      if (table === "google_subscriptions") {
        return {
          select: () => ({
            eq: () => ({
              eq: googleRowsMock,
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: async () => ({ data: [], error: null }),
        }),
      };
    },
  }),
}));

vi.mock("@/lib/subscriptions/trial-conversion", () => ({
  getTrialConversionState: trialStateMock,
  getTrialConversionQuote: trialQuoteMock,
}));
vi.mock("@/lib/subscriptions/subscribe-guard", () => ({
  getSubscribeEntitlementState: entitlementStateMock,
}));
vi.mock("@/lib/subscriptions/google", () => ({
  getGoogleEntitlementSnapshotForPayer: googleSnapshotMock,
}));

// FV-745: the page reads the CAPACITY accessor (a billing-retry Apple row is
// not the ceiling for a payer who is paid elsewhere), not the raw one.
vi.mock("@/lib/subscriptions/apple-capacity", () => ({
  capacityForAppleProduct: capacityForAppleProductMock,
  getCapacityAppleProductId: activeAppleProductIdMock,
}));

vi.mock("@/components/dashboard/AthleteForm", () => ({
  AthleteForm: (props: {
    trialConversion?: unknown;
    appleCapacity?: number | null;
    googleUpgrade?: unknown;
  }) => (
    <div
      data-testid="athlete-form-stub"
      data-trial-conversion={JSON.stringify(props.trialConversion ?? null)}
      data-apple-capacity={String(props.appleCapacity ?? null)}
      data-google-upgrade={JSON.stringify(props.googleUpgrade ?? null)}
    />
  ),
}));

import NewAthletePage from "@/app/dashboard/athletes/new/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  activeAppleProductIdMock.mockResolvedValue(null);
  shellCapabilityMock.mockReturnValue(null);
  athleteCountMock.mockResolvedValue({ count: 0, error: null });
  googleRowsMock.mockResolvedValue({ data: [], error: null });
  entitlementStateMock.mockResolvedValue({
    status: "not_entitled",
    provider: null,
  });
  googleSnapshotMock.mockResolvedValue({
    level: "full",
    latestEnd: null,
    activeProductId: "family.1",
    readError: false,
  });
  delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
});

describe("NewAthletePage — legacy-native shell (FV-622, Android Path A)", () => {
  it("athlete sessions are blocked by requireParent before add-athlete purchase controls can render", async () => {
    requireParentMock.mockRejectedValueOnce(new Error("redirect:/athlete"));
    await expect(NewAthletePage()).rejects.toThrow("redirect:/athlete");
  });

  it("legacy-native: renders the plain website notice, no form, no Stripe quote read", async () => {
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    shellCapabilityMock.mockReturnValue("legacy-native");

    render(await NewAthletePage());

    const notice = screen.getByTestId("add-athlete-native-shell-notice");
    expect(notice).toHaveTextContent(
      "Add athletes from a web browser at fromvictoryapp.com.",
    );
    expect(notice.querySelector("a")).toBeNull();
    expect(screen.queryByTestId("athlete-form-stub")).toBeNull();
    expect(trialStateMock).not.toHaveBeenCalled();
    expect(trialQuoteMock).not.toHaveBeenCalled();
    expect(activeAppleProductIdMock).not.toHaveBeenCalled();
  });

  it("ios-iap: unchanged — renders the form", async () => {
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    shellCapabilityMock.mockReturnValue("ios-iap");
    trialStateMock.mockResolvedValue({ kind: "not_trialing" });

    render(await NewAthletePage());

    expect(screen.getByTestId("athlete-form-stub")).toBeInTheDocument();
    expect(
      screen.queryByTestId("add-athlete-native-shell-notice"),
    ).toBeNull();
  });
});

describe("NewAthletePage — trial-conversion wiring (FV-586)", () => {
  it("not_trialing: no trialConversion prop passed", async () => {
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    trialStateMock.mockResolvedValue({ kind: "not_trialing" });

    render(await NewAthletePage());

    const stub = screen.getByTestId("athlete-form-stub");
    expect(stub).toHaveAttribute("data-trial-conversion", "null");
    expect(trialQuoteMock).not.toHaveBeenCalled();
  });

  it("stripe_trial with zero existing athletes (first athlete, not a conversion): no trialConversion prop", async () => {
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    trialStateMock.mockResolvedValue({
      kind: "stripe_trial",
      stripeSubscriptionId: "sub_1",
      currentAthleteCount: 0,
      trialEndsAt: "2026-09-25T00:00:00Z",
    });

    render(await NewAthletePage());

    expect(
      screen.getByTestId("athlete-form-stub"),
    ).toHaveAttribute("data-trial-conversion", "null");
    expect(trialQuoteMock).not.toHaveBeenCalled();
  });

  it("stripe_trial with >=1 existing athlete + resolved quote: passes a priced trialConversion", async () => {
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    trialStateMock.mockResolvedValue({
      kind: "stripe_trial",
      stripeSubscriptionId: "sub_1",
      currentAthleteCount: 1,
      trialEndsAt: "2026-09-25T00:00:00Z",
    });
    trialQuoteMock.mockResolvedValue({
      quoteUnavailable: false,
      currency: "usd",
      interval: "month",
      currentQuantity: 1,
      nextQuantity: 2,
      totalDueTodayCents: 800,
      taxMayApply: false,
      nextRenewalLabel: "every month",
      billingScheme: "graduated",
    });

    render(await NewAthletePage());

    const stub = screen.getByTestId("athlete-form-stub");
    const passed = JSON.parse(stub.getAttribute("data-trial-conversion")!);
    expect(passed).toMatchObject({
      quoteUnavailable: false,
      nextQuantity: 2,
      interval: "month",
      nextRenewalLabel: "every month",
      totalDueTodayLabel: "$8.00",
      taxMayApply: false,
    });
  });

  it("stripe_trial with >=1 existing athlete + unavailable quote: passes quoteUnavailable with nextQuantity still known", async () => {
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    trialStateMock.mockResolvedValue({
      kind: "stripe_trial",
      stripeSubscriptionId: "sub_1",
      currentAthleteCount: 2,
      trialEndsAt: "2026-09-25T00:00:00Z",
    });
    trialQuoteMock.mockResolvedValue({ quoteUnavailable: true });

    render(await NewAthletePage());

    const stub = screen.getByTestId("athlete-form-stub");
    const passed = JSON.parse(stub.getAttribute("data-trial-conversion")!);
    expect(passed).toEqual({ quoteUnavailable: true, nextQuantity: 3 });
  });

  it("unknown trial state: no trialConversion prop (createAthlete's own fail-closed guard still applies server-side)", async () => {
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    trialStateMock.mockResolvedValue({ kind: "unknown" });

    render(await NewAthletePage());

    expect(
      screen.getByTestId("athlete-form-stub"),
    ).toHaveAttribute("data-trial-conversion", "null");
  });
});

describe("NewAthletePage — Apple capacity wiring (FV-586)", () => {
  it("not an Apple payer: appleCapacity is null", async () => {
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    trialStateMock.mockResolvedValue({ kind: "not_trialing" });
    activeAppleProductIdMock.mockResolvedValue(null);

    render(await NewAthletePage());

    expect(
      screen.getByTestId("athlete-form-stub"),
    ).toHaveAttribute("data-apple-capacity", "null");
    expect(capacityForAppleProductMock).not.toHaveBeenCalled();
  });

  it("Apple payer with a mapped product: appleCapacity is the resolved ceiling", async () => {
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    trialStateMock.mockResolvedValue({ kind: "apple" });
    activeAppleProductIdMock.mockResolvedValue("apple.tier3.monthly");
    capacityForAppleProductMock.mockReturnValue(3);

    render(await NewAthletePage());

    expect(
      screen.getByTestId("athlete-form-stub"),
    ).toHaveAttribute("data-apple-capacity", "3");
  });

  it("Apple payer with an unmapped product: appleCapacity falls back to null", async () => {
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    trialStateMock.mockResolvedValue({ kind: "apple" });
    activeAppleProductIdMock.mockResolvedValue("apple.unknown.monthly");
    capacityForAppleProductMock.mockReturnValue(null);

    render(await NewAthletePage());

    expect(
      screen.getByTestId("athlete-form-stub"),
    ).toHaveAttribute("data-apple-capacity", "null");
  });
});

describe("NewAthletePage — android-play behaves like legacy-native (FV-659)", () => {
  it("android-play + flag off: plain website notice, no form, no Stripe/Apple reads", async () => {
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    shellCapabilityMock.mockReturnValue("android-play");

    render(await NewAthletePage());

    const notice = screen.getByTestId("add-athlete-native-shell-notice");
    expect(notice).toHaveTextContent(
      "Add athletes from a web browser at fromvictoryapp.com.",
    );
    expect(notice.querySelector("a")).toBeNull();
    expect(screen.queryByTestId("athlete-form-stub")).toBeNull();
    expect(trialStateMock).not.toHaveBeenCalled();
    expect(trialQuoteMock).not.toHaveBeenCalled();
    expect(activeAppleProductIdMock).not.toHaveBeenCalled();
  });

  it("android-play + flag on + Stripe entitlement keeps legacy website notice", async () => {
    process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    shellCapabilityMock.mockReturnValue("android-play");
    entitlementStateMock.mockResolvedValue({
      status: "entitled",
      provider: "stripe",
    });

    render(await NewAthletePage());

    expect(screen.getByTestId("add-athlete-native-shell-notice")).toBeInTheDocument();
    expect(screen.queryByTestId("athlete-form-stub")).toBeNull();
  });

  it("android-play + flag on + no subscription shows the add-athlete form", async () => {
    process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    shellCapabilityMock.mockReturnValue("android-play");
    entitlementStateMock.mockResolvedValue({
      status: "not_entitled",
      provider: null,
    });
    trialStateMock.mockResolvedValue({ kind: "not_trialing" });

    render(await NewAthletePage());

    expect(screen.getByTestId("athlete-form-stub")).toBeInTheDocument();
    expect(
      screen.queryByTestId("add-athlete-native-shell-notice"),
    ).toBeNull();
  });
});

describe("NewAthletePage — Google trial detection window (FV-665)", () => {
  function nowPlusDays(daysAgo: number): string {
    return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  }

  it("day 3 from purchase start stays in trial", async () => {
    process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    shellCapabilityMock.mockReturnValue("android-play");
    entitlementStateMock.mockResolvedValue({
      status: "entitled",
      provider: "google",
    });
    trialStateMock.mockResolvedValue({ kind: "not_trialing" });
    athleteCountMock.mockResolvedValue({ count: 1, error: null });
    googleRowsMock.mockResolvedValue({
      data: [
        {
          product_id: "family.1",
          base_plan_id: "yearly",
          offer_id: "trial-7d",
          status: "active",
          acknowledged: true,
          expires_at: "2099-01-01T00:00:00.000Z",
          created_at: nowPlusDays(3),
        },
      ],
      error: null,
    });

    render(await NewAthletePage());

    const upgrade = JSON.parse(
      screen.getByTestId("athlete-form-stub").getAttribute("data-google-upgrade")!,
    );
    expect(upgrade.trialEndingToday).toBe(true);
  });

  it("day 8 from purchase start is paying", async () => {
    process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
    requireParentMock.mockResolvedValue({ userId: "parent-1" });
    shellCapabilityMock.mockReturnValue("android-play");
    entitlementStateMock.mockResolvedValue({
      status: "entitled",
      provider: "google",
    });
    trialStateMock.mockResolvedValue({ kind: "not_trialing" });
    athleteCountMock.mockResolvedValue({ count: 1, error: null });
    googleRowsMock.mockResolvedValue({
      data: [
        {
          product_id: "family.1",
          base_plan_id: "yearly",
          offer_id: "trial-7d",
          status: "active",
          acknowledged: true,
          expires_at: "2099-01-01T00:00:00.000Z",
          created_at: nowPlusDays(8),
        },
      ],
      error: null,
    });

    render(await NewAthletePage());

    const upgrade = JSON.parse(
      screen.getByTestId("athlete-form-stub").getAttribute("data-google-upgrade")!,
    );
    expect(upgrade.trialEndingToday).toBe(false);
  });
});
