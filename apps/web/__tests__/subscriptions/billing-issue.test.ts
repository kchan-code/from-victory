/**
 * FV-710: getPayerBillingIssue — combines the Stripe mirror and the Apple
 * accessor into the one payer-facing "payment problem" answer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { grantMock, appleMock, state } = vi.hoisted(() => ({
  grantMock: vi.fn(),
  appleMock: vi.fn(),
  state: {
    sub: null as { status: string } | null,
    subReads: 0,
    subError: null as { message: string } | null,
  },
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            state.subReads += 1;
            return {
              data: state.sub && {
                cancel_at_period_end: false,
                current_period_end: null,
                ...state.sub,
              },
              error: state.subError,
            };
          },
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/subscriptions/grants", () => ({
  getActiveCompGrantSummary: grantMock,
}));
vi.mock("@/lib/subscriptions/apple", () => ({
  getAppleBillingIssueForPayer: appleMock,
}));

import { getPayerBillingIssue } from "@/lib/subscriptions/billing-issue";

const noApple = {
  stage: null,
  cleanlyPaid: false,
  grantsAccess: false,
  readError: false,
};
const noGrant = {
  active: false,
  latestFiniteEnd: null,
  hasOpenEnded: false,
  readError: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  state.sub = null;
  state.subError = null;
  state.subReads = 0;
  grantMock.mockResolvedValue(noGrant);
  appleMock.mockResolvedValue(noApple);
});

describe("getPayerBillingIssue", () => {
  it("nothing wrong -> null", async () => {
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });

  it("Stripe past_due -> stripe grace", async () => {
    state.sub = { status: "past_due" };
    expect(await getPayerBillingIssue("p1")).toEqual({ provider: "stripe", stage: "grace" });
  });

  it("Stripe canceled -> null (no invented Stripe lapsed stage)", async () => {
    state.sub = { status: "canceled" };
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });

  it("Apple grace -> apple grace", async () => {
    appleMock.mockResolvedValue({ ...noApple, stage: "grace", grantsAccess: true });
    expect(await getPayerBillingIssue("p1")).toEqual({ provider: "apple", stage: "grace" });
  });

  it("Apple lapsed and overall blocked -> apple lapsed", async () => {
    appleMock.mockResolvedValue({ ...noApple, stage: "lapsed" });
    expect(await getPayerBillingIssue("p1")).toEqual({ provider: "apple", stage: "lapsed" });
  });

  it("Apple lapsed but overall level is not blocked -> null", async () => {
    appleMock.mockResolvedValue({ ...noApple, stage: "lapsed" });
    state.sub = { status: "paused" }; // degraded Stripe level is not blocked
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });

  it("active comp grant -> null even with a failing payment", async () => {
    grantMock.mockResolvedValue({ ...noGrant, active: true });
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

  it("comp-grant read error -> null even with a lapsed Apple row (FV-746)", async () => {
    grantMock.mockResolvedValue({ ...noGrant, readError: true });
    appleMock.mockResolvedValue({ ...noApple, stage: "lapsed" });
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });

  it("Stripe read error with a lapsed Apple row -> null, no second re-read (FV-746)", async () => {
    state.subError = { message: "stripe boom" };
    appleMock.mockResolvedValue({ ...noApple, stage: "lapsed" });
    expect(await getPayerBillingIssue("p1")).toBeNull();
    expect(state.subReads).toBe(1);
  });

  it("Apple read error (allowlist or subscriptions) with a lapsed-looking payer -> null", async () => {
    appleMock.mockResolvedValue({ ...noApple, readError: true });
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });

  it("Apple lapsed, Stripe active, subscriptions read fine -> null; reads subscriptions once", async () => {
    state.sub = { status: "active" };
    appleMock.mockResolvedValue({ ...noApple, stage: "lapsed" });
    expect(await getPayerBillingIssue("p1")).toBeNull();
    expect(state.subReads).toBe(1);
  });

  it("Apple lapsed, Stripe canceled -> lapsed", async () => {
    state.sub = { status: "canceled" };
    appleMock.mockResolvedValue({ ...noApple, stage: "lapsed" });
    expect(await getPayerBillingIssue("p1")).toEqual({ provider: "apple", stage: "lapsed" });
  });

  it("an unexpected throw -> null", async () => {
    appleMock.mockRejectedValue(new Error("kaput"));
    expect(await getPayerBillingIssue("p1")).toBeNull();
  });
});
