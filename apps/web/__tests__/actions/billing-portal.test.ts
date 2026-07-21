/**
 * Unit tests for the `openBillingPortal` server action.
 *
 * Mocks:
 *   - server-only              → no-op (Next.js guard not available in vitest/node)
 *   - next/navigation           → captures redirect() calls without throwing
 *   - @/lib/auth/guards         → controlled requireSubscriber() stub (FV-440)
 *   - @/lib/stripe/server       → controlled billingPortal.sessions.create stub
 *   - @/lib/supabase/server     → controlled chainable Supabase client stub
 *   - @/lib/monitoring/deliver  → no-op (fire-and-forget, not under test)
 *   - @/lib/monitoring/notify   → no-op (side-effect, not under test)
 *
 * Cases covered:
 *   1. Happy path — subscription row exists, portal session created → redirect
 *   2. No subscription row → { ok: false, code: "no_subscription" }
 *   3. portal sessions.create throws → { ok: false, code: "portal_unavailable" }
 *   4. Supabase read error → { ok: false, code: "portal_unavailable" }
 *   5. (FV-440) adult_athlete payer can open the portal; return_url branches
 *      by role (parent → /dashboard/settings, adult_athlete → /athlete/settings);
 *      a minor athlete session is rejected the same way requireSubscriber()
 *      rejects it in guards.test.ts — the stub throws to mimic redirect()
 *      throwing NEXT_REDIRECT in production.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (hoisted before imports of the module under test)
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

// Capture redirect calls without throwing NEXT_REDIRECT.
const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirectMock(url);
  },
}));

// requireSubscriber() — mutable stub, defaulted to a parent payer in
// beforeEach. Individual tests swap in an adult_athlete profile or a
// rejecting (throwing) implementation to simulate a minor athlete session.
type SubscriberResult = {
  userId: string;
  profile: { id: string; role: "parent" | "adult_athlete"; first_name: string };
};
let requireSubscriberImpl: () => Promise<SubscriberResult> = async () => ({
  userId: "parent-uuid-123",
  profile: { id: "parent-uuid-123", role: "parent", first_name: "Casey" },
});
vi.mock("@/lib/auth/guards", () => ({
  requireSubscriber: () => requireSubscriberImpl(),
}));

// Monitoring: fire-and-forget; not under test here.
vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: () => undefined,
}));
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: async () => undefined,
}));

// Mutable Stripe mock — replaced per test via makeStripeMock().
const billingPortalCreateMock = vi.fn();
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    billingPortal: {
      sessions: {
        create: billingPortalCreateMock,
      },
    },
  }),
}));

// Mutable Supabase server-client mock — replaced per test via makeSupabaseMock().
let supabaseMockImpl: ReturnType<typeof makeSupabaseMock>;
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => supabaseMockImpl,
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks are registered
// ---------------------------------------------------------------------------

import {
  openBillingPortal,
  type BillingPortalActionState,
} from "@/lib/actions/billing-portal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SubRow = { stripe_customer_id: string } | null;

/**
 * Builds a minimal chainable Supabase client stub that returns `row` for
 * any .from("subscriptions").select(...).eq(...).maybeSingle() chain.
 */
function makeSupabaseMock(
  row: SubRow,
  error: { message: string } | null = null,
) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => ({ data: row, error }),
  };
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: "parent-uuid-123" } } }),
    },
    from: (_table: string) => chain,
  };
}

/** Minimal FormData stand-in (the action ignores the formData argument). */
const emptyFormData = new FormData();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("openBillingPortal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: env var set for stable test env
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.fromvictoryapp.com";
    // Default: a parent payer session (individual tests override as needed).
    requireSubscriberImpl = async () => ({
      userId: "parent-uuid-123",
      profile: { id: "parent-uuid-123", role: "parent", first_name: "Casey" },
    });
  });

  // -------------------------------------------------------------------------
  // Case 1: Happy path — subscription row with customer id, portal creates ok
  // -------------------------------------------------------------------------
  it("redirects to the portal URL on success", async () => {
    supabaseMockImpl = makeSupabaseMock({ stripe_customer_id: "cus_abc123" });
    billingPortalCreateMock.mockResolvedValue({
      url: "https://billing.stripe.com/session/bps_test",
    });

    const result = await openBillingPortal(null, emptyFormData);

    // Action redirects — returns undefined (NEXT_REDIRECT swallowed by mock).
    expect(result).toBeUndefined();
    expect(redirectMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith(
      "https://billing.stripe.com/session/bps_test",
    );
  });

  it("passes the correct customer ID and return_url to billingPortal.sessions.create", async () => {
    supabaseMockImpl = makeSupabaseMock({ stripe_customer_id: "cus_xyz999" });
    billingPortalCreateMock.mockResolvedValue({
      url: "https://billing.stripe.com/session/bps_test2",
    });

    await openBillingPortal(null, emptyFormData);

    expect(billingPortalCreateMock).toHaveBeenCalledWith({
      customer: "cus_xyz999",
      return_url: "https://app.fromvictoryapp.com/dashboard/settings",
    });
  });

  // -------------------------------------------------------------------------
  // Case 2: No subscription row → no_subscription error state
  // -------------------------------------------------------------------------
  it("returns no_subscription when the subscriptions row is missing", async () => {
    supabaseMockImpl = makeSupabaseMock(null); // row = null

    const result = (await openBillingPortal(
      null,
      emptyFormData,
    )) as BillingPortalActionState;

    expect(result).not.toBeNull();
    expect(result?.ok).toBe(false);
    if (result?.ok === false) {
      expect(result.code).toBe("no_subscription");
    }
    expect(redirectMock).not.toHaveBeenCalled();
    expect(billingPortalCreateMock).not.toHaveBeenCalled();
  });

  it("returns no_subscription when the row has no stripe_customer_id", async () => {
    // Simulate a row where stripe_customer_id is empty string (shouldn't exist
    // in practice but guard defensively).
    supabaseMockImpl = makeSupabaseMock(
      { stripe_customer_id: "" },
    );

    const result = (await openBillingPortal(
      null,
      emptyFormData,
    )) as BillingPortalActionState;

    expect(result?.ok).toBe(false);
    if (result?.ok === false) {
      expect(result.code).toBe("no_subscription");
    }
    expect(redirectMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Case 3: billingPortal.sessions.create throws → portal_unavailable
  // -------------------------------------------------------------------------
  it("returns portal_unavailable when billingPortal.sessions.create throws", async () => {
    supabaseMockImpl = makeSupabaseMock({ stripe_customer_id: "cus_abc123" });
    billingPortalCreateMock.mockRejectedValue(
      new Error("No such configuration: bpc_xxx"),
    );

    const result = (await openBillingPortal(
      null,
      emptyFormData,
    )) as BillingPortalActionState;

    expect(result?.ok).toBe(false);
    if (result?.ok === false) {
      expect(result.code).toBe("portal_unavailable");
      expect(result.error).toContain("temporarily unavailable");
    }
    expect(redirectMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Case 4: Supabase DB read error → portal_unavailable
  // -------------------------------------------------------------------------
  it("returns portal_unavailable when the Supabase read errors", async () => {
    supabaseMockImpl = makeSupabaseMock(null, {
      message: "relation does not exist",
    });

    const result = (await openBillingPortal(
      null,
      emptyFormData,
    )) as BillingPortalActionState;

    expect(result?.ok).toBe(false);
    if (result?.ok === false) {
      expect(result.code).toBe("portal_unavailable");
    }
    expect(redirectMock).not.toHaveBeenCalled();
    expect(billingPortalCreateMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Return URL uses NEXT_PUBLIC_SITE_URL fallback
  // -------------------------------------------------------------------------
  it("falls back to the canonical production return_url when NEXT_PUBLIC_SITE_URL is unset", async () => {
    const original = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;

    supabaseMockImpl = makeSupabaseMock({ stripe_customer_id: "cus_fallback" });
    billingPortalCreateMock.mockResolvedValue({
      url: "https://billing.stripe.com/session/bps_fallback",
    });

    await openBillingPortal(null, emptyFormData);

    expect(billingPortalCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url: "https://www.fromvictoryapp.com/dashboard/settings",
      }),
    );

    // Restore
    process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  // -------------------------------------------------------------------------
  // FV-440: adult_athlete self-serve payer support
  // -------------------------------------------------------------------------
  describe("adult_athlete payer (FV-440)", () => {
    it("allows an adult_athlete payer to open the portal", async () => {
      requireSubscriberImpl = async () => ({
        userId: "adult-uuid-456",
        profile: { id: "adult-uuid-456", role: "adult_athlete", first_name: "Riley" },
      });
      supabaseMockImpl = makeSupabaseMock({ stripe_customer_id: "cus_adult456" });
      billingPortalCreateMock.mockResolvedValue({
        url: "https://billing.stripe.com/session/bps_adult",
      });

      const result = await openBillingPortal(null, emptyFormData);

      expect(result).toBeUndefined();
      expect(redirectMock).toHaveBeenCalledWith(
        "https://billing.stripe.com/session/bps_adult",
      );
    });

    it("uses /athlete/settings as the return_url for an adult_athlete payer", async () => {
      requireSubscriberImpl = async () => ({
        userId: "adult-uuid-456",
        profile: { id: "adult-uuid-456", role: "adult_athlete", first_name: "Riley" },
      });
      supabaseMockImpl = makeSupabaseMock({ stripe_customer_id: "cus_adult456" });
      billingPortalCreateMock.mockResolvedValue({
        url: "https://billing.stripe.com/session/bps_adult2",
      });

      await openBillingPortal(null, emptyFormData);

      expect(billingPortalCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          return_url: "https://app.fromvictoryapp.com/athlete/settings",
        }),
      );
    });

    it("uses /dashboard/settings as the return_url for a parent payer", async () => {
      // requireSubscriberImpl defaults to a parent in beforeEach.
      supabaseMockImpl = makeSupabaseMock({ stripe_customer_id: "cus_parent789" });
      billingPortalCreateMock.mockResolvedValue({
        url: "https://billing.stripe.com/session/bps_parent",
      });

      await openBillingPortal(null, emptyFormData);

      expect(billingPortalCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          return_url: "https://app.fromvictoryapp.com/dashboard/settings",
        }),
      );
    });

    it("rejects a minor athlete session the way requireSubscriber() rejects it (redirect-throw behavior)", async () => {
      // requireSubscriber() in production calls redirect("/signin") for a
      // minor `athlete` role, and next/navigation's real redirect() throws a
      // NEXT_REDIRECT digest to unwind the render (see guards.test.ts). Since
      // @/lib/auth/guards is mocked wholesale here, the stub reproduces that
      // throwing behavior directly rather than re-exercising guards.ts.
      requireSubscriberImpl = async () => {
        throw new Error("NEXT_REDIRECT:/signin");
      };

      await expect(openBillingPortal(null, emptyFormData)).rejects.toThrow(
        "NEXT_REDIRECT:/signin",
      );
      expect(billingPortalCreateMock).not.toHaveBeenCalled();
      expect(redirectMock).not.toHaveBeenCalled();
    });
  });
});
