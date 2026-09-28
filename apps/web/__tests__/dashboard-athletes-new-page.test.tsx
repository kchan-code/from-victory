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
  activeAppleProductIdMock,
  capacityForAppleProductMock,
} = vi.hoisted(() => ({
  requireParentMock: vi.fn(),
  trialStateMock: vi.fn(),
  trialQuoteMock: vi.fn(),
  activeAppleProductIdMock: vi.fn(async () => null as string | null),
  capacityForAppleProductMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/guards", () => ({
  requireParent: requireParentMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({}),
}));

vi.mock("@/lib/subscriptions/trial-conversion", () => ({
  getTrialConversionState: trialStateMock,
  getTrialConversionQuote: trialQuoteMock,
}));

vi.mock("@/lib/subscriptions/apple", () => ({
  getActiveAppleProductId: activeAppleProductIdMock,
}));

vi.mock("@/lib/subscriptions/apple-capacity", () => ({
  capacityForAppleProduct: capacityForAppleProductMock,
}));

vi.mock("@/components/dashboard/AthleteForm", () => ({
  AthleteForm: (props: {
    trialConversion?: unknown;
    appleCapacity?: number | null;
  }) => (
    <div
      data-testid="athlete-form-stub"
      data-trial-conversion={JSON.stringify(props.trialConversion ?? null)}
      data-apple-capacity={String(props.appleCapacity ?? null)}
    />
  ),
}));

import NewAthletePage from "@/app/dashboard/athletes/new/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  activeAppleProductIdMock.mockResolvedValue(null);
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
