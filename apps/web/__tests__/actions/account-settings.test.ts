/**
 * Unit tests for the `sendOwnPasswordReset` server action (FV-192).
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

vi.mock("@/lib/auth/guards", () => ({
  requireParent: async () => ({ userId: "parent-uuid-123" }),
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
});
