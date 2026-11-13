/**
 * FV-710: getPayerBillingIssue — combines the Stripe mirror and the Apple
 * accessor into the one payer-facing "payment problem" answer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { hasGrantMock, accessLevelMock, appleMock, state } = vi.hoisted(() => ({
  hasGrantMock: vi.fn(async () => false),
  accessLevelMock: vi.fn(async () => "blocked" as "full" | "degraded" | "blocked"),
  appleMock: vi.fn(),
  state: {
    sub: null as { status: string } | null,
    subError: null as { message: string } | null,
  },
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: state.sub, error: state.subError }),
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/subscriptions/grants", () => ({ hasActiveCompGrant: hasGrantMock }));
vi.mock("@/lib/subscriptions/access", () => ({ getParentAccessLevel: accessLevelMock }));
vi.mock("@/lib/subscriptions/apple", () => ({
  getAppleBillingIssueForPayer: appleMock,
}));

import { getPayerBillingIssue } from "@/lib/subscriptions/billing-issue";

const noApple = { stage: null, cleanlyPaid: false, readError: false };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  state.sub = null;
  state.subError = null;
  hasGrantMock.mockResolvedValue(false);
  accessLevelMock.mockResolvedValue("blocked");
  appleMock.mockResolvedValue(noApple);
});

describe("getPayerBillingIssue", () => {
  it("nothing wrong -> null", async () => {
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });

  it("Stripe past_due -> stripe grace", async () => {
    state.sub = { status: "past_due" };
    accessLevelMock.mockResolvedValue("degraded");
    expect(await getPayerBillingIssue("p1")).toEqual({ provider: "stripe", stage: "grace" });
  });

  it("Stripe canceled -> null (no invented Stripe lapsed stage)", async () => {
    state.sub = { status: "canceled" };
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });

  it("Apple grace -> apple grace", async () => {
    appleMock.mockResolvedValue({ ...noApple, stage: "grace" });
    accessLevelMock.mockResolvedValue("full");
    expect(await getPayerBillingIssue("p1")).toEqual({ provider: "apple", stage: "grace" });
  });

  it("Apple lapsed and overall blocked -> apple lapsed", async () => {
    appleMock.mockResolvedValue({ ...noApple, stage: "lapsed" });
    expect(await getPayerBillingIssue("p1")).toEqual({ provider: "apple", stage: "lapsed" });
  });

  it("Apple lapsed but overall level is not blocked -> null", async () => {
    appleMock.mockResolvedValue({ ...noApple, stage: "lapsed" });
    accessLevelMock.mockResolvedValue("full");
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });

  it("active comp grant -> null even with a failing payment", async () => {
    hasGrantMock.mockResolvedValue(true);
    state.sub = { status: "past_due" };
    appleMock.mockResolvedValue({ ...noApple, stage: "lapsed" });
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });

  it("Stripe past_due suppressed when Apple is cleanly subscribed", async () => {
    state.sub = { status: "past_due" };
    appleMock.mockResolvedValue({ ...noApple, cleanlyPaid: true });
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });

  it("Apple grace suppressed when Stripe is active or trialing", async () => {
    appleMock.mockResolvedValue({ ...noApple, stage: "grace" });
    for (const status of ["active", "trialing"]) {
      state.sub = { status };
      expect(await getPayerBillingIssue("p1")).toBeNull();
    }
  });

  it("Apple lapsed suppressed when Stripe is active (overall full)", async () => {
    state.sub = { status: "active" };
    appleMock.mockResolvedValue({ ...noApple, stage: "lapsed" });
    accessLevelMock.mockResolvedValue("full");
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });

  it("Stripe read error -> null, logs payer id and message only", async () => {
    state.subError = { message: "stripe boom" };
    appleMock.mockResolvedValue({ ...noApple, stage: "lapsed" });
    expect(await getPayerBillingIssue("p1")).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("payer=p1"),
      "stripe boom",
    );
  });

  it("Apple read error -> null even if Stripe is past_due", async () => {
    state.sub = { status: "past_due" };
    appleMock.mockResolvedValue({ ...noApple, readError: true });
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });

  it("an unexpected throw -> null", async () => {
    appleMock.mockRejectedValue(new Error("kaput"));
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });
});
