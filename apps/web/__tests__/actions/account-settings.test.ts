/**
 * Unit tests for the `sendOwnPasswordReset` server action (FV-192; widened to
 * the adult_athlete self-serve role in FV-440).
 *
 * The action must derive the target email from the authenticated session
 * (auth.getUser()) and ignore formData entirely — a tampered form body must
 * not be able to direct the reset email anywhere else.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (hoisted before imports of the module under test)
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

// requireSubscriber() — mutable stub, defaulted to a parent payer. Tests
// override to an adult_athlete profile, or to a throwing implementation to
// simulate a rejected minor-athlete session (mirrors the redirect-throw
// behavior guards.test.ts exercises against the real guard).
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

const resetPasswordForEmailMock = vi.fn();
let sessionEmail: string | undefined = "parent@example.com";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: sessionEmail
            ? { id: "parent-uuid-123", email: sessionEmail }
            : { id: "parent-uuid-123" },
        },
      }),
      resetPasswordForEmail: resetPasswordForEmailMock,
    },
  }),
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks are registered
// ---------------------------------------------------------------------------

import { sendOwnPasswordReset } from "@/lib/actions/account-settings";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sendOwnPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionEmail = "parent@example.com";
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.fromvictoryapp.com";
    // Default: a parent payer session (individual tests override as needed).
    requireSubscriberImpl = async () => ({
      userId: "parent-uuid-123",
      profile: { id: "parent-uuid-123", role: "parent", first_name: "Casey" },
    });
  });

  it("sends the reset to the SESSION email, ignoring any formData value", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: null });

    // A tampered form body targeting someone else's address.
    const tampered = new FormData();
    tampered.set("email", "victim@example.com");

    const result = await sendOwnPasswordReset(null, tampered);

    expect(result).toEqual({ ok: true });
    expect(resetPasswordForEmailMock).toHaveBeenCalledOnce();
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
      "parent@example.com",
      {
        redirectTo:
          "https://app.fromvictoryapp.com/auth/callback?next=/reset-password",
      },
    );
  });

  it("returns a calm error when the session has no email", async () => {
    sessionEmail = undefined;

    const result = await sendOwnPasswordReset(null, new FormData());

    expect(result?.ok).toBe(false);
    expect(resetPasswordForEmailMock).not.toHaveBeenCalled();
  });

  it("returns a calm error when the Supabase send fails (own-account flow is honest)", async () => {
    resetPasswordForEmailMock.mockResolvedValue({
      error: { message: "rate limited", status: 429, code: "over_limit" },
    });

    const result = await sendOwnPasswordReset(null, new FormData());

    expect(result?.ok).toBe(false);
    if (result?.ok === false) {
      expect(result.error).toContain("Try again");
    }
  });

  // ---------------------------------------------------------------------------
  // FV-440: adult_athlete self-serve payer support
  // ---------------------------------------------------------------------------
  describe("adult_athlete payer (FV-440)", () => {
    it("sends the reset to the adult_athlete's own SESSION email", async () => {
      requireSubscriberImpl = async () => ({
        userId: "adult-uuid-456",
        profile: { id: "adult-uuid-456", role: "adult_athlete", first_name: "Riley" },
      });
      sessionEmail = "riley@example.com";
      resetPasswordForEmailMock.mockResolvedValue({ error: null });

      const result = await sendOwnPasswordReset(null, new FormData());

      expect(result).toEqual({ ok: true });
      expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
        "riley@example.com",
        {
          redirectTo:
            "https://app.fromvictoryapp.com/auth/callback?next=/reset-password",
        },
      );
    });

    it("rejects a minor athlete session the way requireSubscriber() rejects it (redirect-throw behavior)", async () => {
      // requireSubscriber() in production calls redirect("/signin") for a
      // minor `athlete` role, and next/navigation's real redirect() throws a
      // NEXT_REDIRECT digest (see guards.test.ts). @/lib/auth/guards is
      // mocked wholesale here, so the stub reproduces that throwing behavior
      // directly rather than re-exercising guards.ts.
      requireSubscriberImpl = async () => {
        throw new Error("NEXT_REDIRECT:/signin");
      };

      await expect(sendOwnPasswordReset(null, new FormData())).rejects.toThrow(
        "NEXT_REDIRECT:/signin",
      );
      expect(resetPasswordForEmailMock).not.toHaveBeenCalled();
    });
  });
});
