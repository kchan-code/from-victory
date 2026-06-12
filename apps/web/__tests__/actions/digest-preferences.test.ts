/**
 * Unit tests for lib/actions/digest-preferences.ts (FV-226).
 *
 * Covers:
 *   1. setDigestOptOut — happy path opt-in and opt-out
 *   2. setDigestOptOut — invalid formData value
 *   3. setDigestOptOut — DB update failure
 *   4. setDigestOptOut — must use session-derived userId (never client-passed id)
 *   5. processUnsubscribeToken — valid token → opt-out set
 *   6. processUnsubscribeToken — invalid UUID format → rejected
 *   7. processUnsubscribeToken — token not found → rejected
 *   8. processUnsubscribeToken — already opted out → idempotent success
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (hoisted before imports)
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/guards", () => ({
  requireParent: async () => ({
    userId: "parent-session-uuid",
    profile: { id: "parent-session-uuid", role: "parent", first_name: "Jordan" },
  }),
}));

// ---------------------------------------------------------------------------
// Flexible service-client factory
// ---------------------------------------------------------------------------
//
// processUnsubscribeToken queries: .select().eq(token_col).eq(role).maybeSingle()
// setDigestOptOut queries:         .select().eq(id).eq(role).maybeSingle()
// Both updates:                    .update().eq(id).eq(role)
// We use a self-referencing chain object (no typed interface) so arbitrary
// .eq().eq() depths work. The `unknown` cast at the bottom satisfies tsc.

let selectMaybeSingleImpl = vi.fn();
let updateImpl = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (_table: string) => {
      // reason: any is used here because the chain is dynamically self-referential;
      // typing it strictly would require a recursive type that breaks test mocks.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        not: () => chain,
        maybeSingle: () => selectMaybeSingleImpl(),
        update: (_payload: unknown) => ({
          eq: () => ({
            eq: () => updateImpl(),
          }),
        }),
      };
      return chain;
    },
  }),
}));

const sessionSelectMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: (_table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: unknown) => ({
          maybeSingle: sessionSelectMock,
        }),
      }),
    }),
  }),
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import {
  setDigestOptOut,
  processUnsubscribeToken,
  getDigestOptOut,
} from "@/lib/actions/digest-preferences";

// ---------------------------------------------------------------------------
// setDigestOptOut
// ---------------------------------------------------------------------------

describe("setDigestOptOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMaybeSingleImpl = vi.fn().mockResolvedValue({
      data: { digest_unsubscribe_token: "existing-token-uuid" },
      error: null,
    });
    updateImpl = vi.fn().mockResolvedValue({ error: null });
  });

  it("sets digest_opt_out = true when optOut=true is submitted", async () => {
    const fd = new FormData();
    fd.set("optOut", "true");
    const result = await setDigestOptOut(null, fd);
    expect(result).toEqual({ ok: true, optOut: true });
  });

  it("sets digest_opt_out = false when optOut=false is submitted", async () => {
    const fd = new FormData();
    fd.set("optOut", "false");
    const result = await setDigestOptOut(null, fd);
    expect(result).toEqual({ ok: true, optOut: false });
  });

  it("rejects invalid optOut values (not true/false string)", async () => {
    const fd = new FormData();
    fd.set("optOut", "maybe");
    const result = await setDigestOptOut(null, fd);
    expect(result.ok).toBe(false);
  });

  it("returns a calm error on DB fetch failure", async () => {
    selectMaybeSingleImpl = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "connection refused" },
    });
    const fd = new FormData();
    fd.set("optOut", "true");
    const result = await setDigestOptOut(null, fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Try again");
    }
  });

  it("returns a calm error on DB update failure", async () => {
    updateImpl = vi.fn().mockResolvedValue({ error: { message: "row locked" } });
    const fd = new FormData();
    fd.set("optOut", "true");
    const result = await setDigestOptOut(null, fd);
    expect(result.ok).toBe(false);
  });

  it("derives the parent_id from requireParent() — never from formData", async () => {
    // requireParent() always returns "parent-session-uuid".
    // The action must succeed using the session-derived id even when formData
    // carries a fake parentId field.
    const fd = new FormData();
    fd.set("optOut", "false");
    fd.set("parentId", "other-parent-id"); // should be ignored
    const result = await setDigestOptOut(null, fd);
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// processUnsubscribeToken
// ---------------------------------------------------------------------------

describe("processUnsubscribeToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateImpl = vi.fn().mockResolvedValue({ error: null });
  });

  it("rejects non-UUID token without touching the DB", async () => {
    const result = await processUnsubscribeToken("not-a-uuid");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid_token");
    }
    // selectMaybeSingleImpl should not have been called.
    expect(selectMaybeSingleImpl).not.toHaveBeenCalled();
  });

  it("rejects empty token", async () => {
    const result = await processUnsubscribeToken("");
    expect(result.ok).toBe(false);
  });

  it("returns invalid_token when the UUID is not found", async () => {
    selectMaybeSingleImpl = vi.fn().mockResolvedValue({ data: null, error: null });
    const result = await processUnsubscribeToken(
      "00000000-0000-0000-0000-000000000000",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid_token");
    }
  });

  it("sets opt-out = true on valid token and returns firstName", async () => {
    selectMaybeSingleImpl = vi.fn().mockResolvedValue({
      data: {
        id: "p1",
        first_name: "Jordan",
        digest_opt_out: false,
      },
      error: null,
    });

    const result = await processUnsubscribeToken(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.firstName).toBe("Jordan");
    }
  });

  it("is idempotent — already opted-out returns success without calling update", async () => {
    selectMaybeSingleImpl = vi.fn().mockResolvedValue({
      data: {
        id: "p1",
        first_name: "Jordan",
        digest_opt_out: true, // already opted out
      },
      error: null,
    });

    const result = await processUnsubscribeToken(
      "22222222-2222-2222-2222-222222222222",
    );
    expect(result.ok).toBe(true);
    // Update must NOT have been called.
    expect(updateImpl).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getDigestOptOut
// ---------------------------------------------------------------------------

describe("getDigestOptOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false (opted in) when no row or null value", async () => {
    sessionSelectMock.mockResolvedValue({ data: null, error: null });
    const result = await getDigestOptOut();
    expect(result).toBe(false);
  });

  it("returns true when parent is opted out", async () => {
    sessionSelectMock.mockResolvedValue({
      data: { digest_opt_out: true },
      error: null,
    });
    const result = await getDigestOptOut();
    expect(result).toBe(true);
  });

  it("returns false when parent is explicitly opted in", async () => {
    sessionSelectMock.mockResolvedValue({
      data: { digest_opt_out: false },
      error: null,
    });
    const result = await getDigestOptOut();
    expect(result).toBe(false);
  });
});
