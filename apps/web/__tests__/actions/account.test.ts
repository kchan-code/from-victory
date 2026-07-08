/**
 * Unit tests for the account-deletion server actions (FV-375).
 *
 * Covers `lib/actions/account.ts`:
 *   - deleteAthlete: non-owner rejection (+ ownership-check-before-delete
 *     ordering), owner success (deletes the right athlete id), missing
 *     profile, wrong confirmation text, rate-limit-at-threshold.
 *   - deleteAccount: happy path (deletes caller's own id, signs out,
 *     redirects), auth-guard rejection, rate-limit (no side effects), wrong
 *     confirmation (nothing happens, requireParent never even called),
 *     co-parented athlete preserved (sole-managed deleted, shared kept).
 *
 * Mocking strategy mirrors create-athlete-direct.test.ts / billing-portal.test.ts:
 *   - vi.mock() hoists before imports.
 *   - A shared, mutable `callOrder` array records the name of every
 *     significant step the mocked service client sees, in the order the
 *     action under test invokes them. This lets us assert real ordering
 *     guarantees (e.g. "ownership check runs before the destructive delete
 *     call") rather than just final state.
 *   - `serviceOptions` is a mutable bag swapped per-test to control what the
 *     mocked service client returns at each query site.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (hoisted before imports of the module under test)
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

// next/cache — revalidatePath is a no-op side effect, not under test.
const revalidatePathMock = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}));

// next/navigation — capture redirect() calls without throwing (matches
// billing-portal.test.ts convention: account.ts never runs code after its
// one redirect() call, so a non-throwing mock is safe here).
const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    redirectMock(path);
  },
}));

// Auth guard — controllable per test. Default: a fixed parent id. Tests that
// need to simulate an unauthenticated / non-parent caller swap in a rejecting
// implementation (mirroring how requireParent() really redirects on failure —
// in real Next.js that throws NEXT_REDIRECT and halts the action).
const PARENT_ID = "parent-uuid-123";
const requireParentMock = vi.fn(async () => ({ userId: PARENT_ID }));
vi.mock("@/lib/auth/guards", () => ({
  requireParent: () => requireParentMock(),
}));

// Stripe client — only deleteAccount's cancel-before-delete step touches
// this. Tests that don't reach the cancel step never call it.
const stripeCancelMock = vi.fn(async () => ({}));
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    subscriptions: { cancel: stripeCancelMock },
  }),
}));

// Stripe quantity sync — non-blocking fire-and-forget; no-op in tests.
const syncAthleteQuantityMock = vi.fn(async () => {});
vi.mock("@/lib/stripe/sync-athlete-quantity", () => ({
  syncAthleteQuantity: (...args: unknown[]) => syncAthleteQuantityMock(...args),
}));
vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: (p: Promise<unknown>) => {
    // Swallow so an unawaited rejection never fails the test run.
    void p.catch(() => {});
  },
}));

// Anon server client — used only for deleteAccount's final signOut().
const signOutMock = vi.fn(async () => ({ error: null }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { signOut: signOutMock },
  }),
}));

// ---------------------------------------------------------------------------
// Flexible service-client mock
// ---------------------------------------------------------------------------

/** Shared ordering ledger — reset in beforeEach, read by assertions. */
let callOrder: string[] = [];

interface ServiceOptions {
  // deleteAthlete — ownership check (parent_athlete_links)
  linkExists?: boolean;
  // deleteAthlete — confirm-step profile lookup
  athleteProfile?: { first_name: string; role: string } | null;
  // both actions — rolling-window rate-limit count
  recentEventCount?: number;
  // both actions — auth.admin.deleteUser outcome (keyed by id, default ok)
  deleteUserErrorFor?: Record<string, { message: string } | undefined>;
  // deleteAccount — subscription row for the pre-delete Stripe cancel step
  subscriptionRow?: { stripe_subscription_id: string | null } | null;
  // deleteAccount — this parent's athlete links
  parentLinks?: { athlete_id: string }[];
  // deleteAccount — co-parent count per athlete id (>1 means shared/kept)
  coParentCountFor?: Record<string, number>;
}

function makeServiceMock(opts: ServiceOptions = {}) {
  const {
    linkExists = true,
    athleteProfile = { first_name: "Jordan", role: "athlete" },
    recentEventCount = 0,
    deleteUserErrorFor = {},
    subscriptionRow = null,
    parentLinks = [],
    coParentCountFor = {},
  } = opts;

  const deleteUserCalls: string[] = [];
  const auditInsertPayloads: Record<string, unknown>[] = [];

  const client = {
    __deleteUserCalls: () => deleteUserCalls,
    __auditInsertPayloads: () => auditInsertPayloads,

    auth: {
      admin: {
        deleteUser: vi.fn(async (id: string) => {
          deleteUserCalls.push(id);
          callOrder.push(`delete_user:${id}`);
          return { error: deleteUserErrorFor[id] ?? null };
        }),
      },
    },

    from: (table: string) => {
      if (table === "parent_athlete_links") {
        return {
          // Two shapes hit this table:
          //   deleteAthlete ownership check:
          //     .select("athlete_id").eq("parent_id", p).eq("athlete_id", a).maybeSingle()
          //   deleteAccount links list:
          //     .select("athlete_id").eq("parent_id", p)                 (awaited directly)
          //   deleteAccount co-parent count:
          //     .select("parent_id", {count:"exact",head:true}).eq("athlete_id", a)  (awaited directly)
          select: (_cols: string, countOpts?: { count?: string; head?: boolean }) => {
            if (countOpts?.count) {
              // co-parent count query
              return {
                eq: (_c: string, athleteId: string) => ({
                  then: (resolve: (v: { count: number; error: null }) => void) => {
                    callOrder.push(`co_parent_count:${athleteId}`);
                    resolve({ count: coParentCountFor[athleteId] ?? 1, error: null });
                  },
                }),
              };
            }
            return {
              eq: (_c1: string, _parentId: string) => ({
                // deleteAthlete: chained second .eq(...).maybeSingle()
                eq: (_c2: string, athleteId: string) => ({
                  maybeSingle: async () => {
                    callOrder.push("ownership_check");
                    return {
                      data: linkExists ? { athlete_id: athleteId } : null,
                      error: null,
                    };
                  },
                }),
                // deleteAccount: awaited directly (no second .eq)
                then: (resolve: (v: { data: typeof parentLinks; error: null }) => void) => {
                  callOrder.push("links_fetch");
                  resolve({ data: parentLinks, error: null });
                },
              }),
            };
          },
        };
      }

      if (table === "profiles") {
        return {
          // deleteAthlete confirm step: .select("first_name, role").eq("id", a).maybeSingle()
          select: (_cols: string) => ({
            eq: (_c: string, _v: unknown) => ({
              maybeSingle: async () => {
                callOrder.push("confirm_check");
                return { data: athleteProfile, error: null };
              },
            }),
          }),
        };
      }

      if (table === "subscriptions") {
        return {
          // deleteAccount: .select("stripe_subscription_id").eq("parent_id", p).maybeSingle()
          select: (_cols: string) => ({
            eq: (_c: string, _v: unknown) => ({
              maybeSingle: async () => {
                callOrder.push("subscription_check");
                return { data: subscriptionRow, error: null };
              },
            }),
          }),
        };
      }

      if (table === "account_deletion_events") {
        return {
          // rate-limit count: .select("id", {count:"exact",head:true}).eq(...).gt(...)
          select: (_cols: string, _countOpts?: unknown) => ({
            eq: (_c: string, _v: unknown) => ({
              gt: (_c2: string, _v2: unknown) => ({
                then: (resolve: (v: { count: number; error: null }) => void) => {
                  callOrder.push("rate_limit_check");
                  resolve({ count: recentEventCount, error: null });
                },
              }),
            }),
          }),
          insert: async (payload: Record<string, unknown>) => {
            callOrder.push("audit_insert");
            auditInsertPayloads.push(payload);
            return { error: null };
          },
        };
      }

      // Fallback for any unexpected table access.
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
            gt: () => ({ then: (r: (v: unknown) => void) => r({ count: 0, error: null }) }),
            then: (r: (v: unknown) => void) => r({ data: [], error: null }),
          }),
        }),
        insert: async () => ({ error: null }),
      };
    },
  };

  return client;
}

let serviceMockImpl: ReturnType<typeof makeServiceMock>;
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => serviceMockImpl,
}));

// ---------------------------------------------------------------------------
// Import module under test AFTER mocks are registered.
// ---------------------------------------------------------------------------

import { deleteAthlete, deleteAccount } from "@/lib/actions/account";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormData(fields: Record<string, string> = {}) {
  return {
    get: (key: string) => fields[key] ?? null,
  } as unknown as FormData;
}

const ATHLETE_ID = "athlete-uuid-001";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  callOrder = [];
  requireParentMock.mockImplementation(async () => ({ userId: PARENT_ID }));
  serviceMockImpl = makeServiceMock();
});

// ===========================================================================
// deleteAthlete
// ===========================================================================

describe("deleteAthlete — non-owner caller", () => {
  it("returns an error and does NOT delete when the athlete isn't linked to this parent", async () => {
    serviceMockImpl = makeServiceMock({ linkExists: false });

    const result = await deleteAthlete(
      null,
      makeFormData({ athlete_id: ATHLETE_ID, confirm: "Jordan" }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: "That athlete isn't on your account.",
    });
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
  });
});

describe("deleteAthlete — owner caller (success + ordering)", () => {
  it("deletes the correct athlete id", async () => {
    serviceMockImpl = makeServiceMock({ linkExists: true });

    const result = await deleteAthlete(
      null,
      makeFormData({ athlete_id: ATHLETE_ID, confirm: "Jordan" }),
    );

    expect(result).toBeNull();
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([ATHLETE_ID]);
  });

  it("runs the ownership check BEFORE the destructive delete call", async () => {
    serviceMockImpl = makeServiceMock({ linkExists: true });

    await deleteAthlete(
      null,
      makeFormData({ athlete_id: ATHLETE_ID, confirm: "Jordan" }),
    );

    const ownershipIdx = callOrder.indexOf("ownership_check");
    const deleteIdx = callOrder.indexOf(`delete_user:${ATHLETE_ID}`);
    expect(ownershipIdx).toBeGreaterThanOrEqual(0);
    expect(deleteIdx).toBeGreaterThanOrEqual(0);
    expect(ownershipIdx).toBeLessThan(deleteIdx);
  });

  it("also runs the rate-limit check BEFORE the destructive delete call", async () => {
    serviceMockImpl = makeServiceMock({ linkExists: true, recentEventCount: 0 });

    await deleteAthlete(
      null,
      makeFormData({ athlete_id: ATHLETE_ID, confirm: "Jordan" }),
    );

    const rateLimitIdx = callOrder.indexOf("rate_limit_check");
    const deleteIdx = callOrder.indexOf(`delete_user:${ATHLETE_ID}`);
    expect(rateLimitIdx).toBeGreaterThanOrEqual(0);
    expect(rateLimitIdx).toBeLessThan(deleteIdx);
  });
});

describe("deleteAthlete — missing profile", () => {
  it("returns 'Athlete not found.' and does NOT delete when the profile lookup is empty", async () => {
    serviceMockImpl = makeServiceMock({ linkExists: true, athleteProfile: null });

    const result = await deleteAthlete(
      null,
      makeFormData({ athlete_id: ATHLETE_ID, confirm: "Jordan" }),
    );

    expect(result).toMatchObject({ ok: false, error: "Athlete not found." });
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
  });
});

describe("deleteAthlete — wrong confirmation text", () => {
  it("returns a confirmation error and does NOT delete", async () => {
    serviceMockImpl = makeServiceMock({
      linkExists: true,
      athleteProfile: { first_name: "Jordan", role: "athlete" },
    });

    const result = await deleteAthlete(
      null,
      makeFormData({ athlete_id: ATHLETE_ID, confirm: "notjordan" }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringContaining('Type "Jordan"'),
    });
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
  });
});

describe("deleteAthlete — rate limit at threshold", () => {
  it("blocks and does NOT delete when recentCount is exactly at the limit (10)", async () => {
    serviceMockImpl = makeServiceMock({ linkExists: true, recentEventCount: 10 });

    const result = await deleteAthlete(
      null,
      makeFormData({ athlete_id: ATHLETE_ID, confirm: "Jordan" }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/too many|wait/i),
    });
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
  });

  it("still allows deletion when recentCount is one below the limit (9)", async () => {
    serviceMockImpl = makeServiceMock({ linkExists: true, recentEventCount: 9 });

    const result = await deleteAthlete(
      null,
      makeFormData({ athlete_id: ATHLETE_ID, confirm: "Jordan" }),
    );

    expect(result).toBeNull();
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([ATHLETE_ID]);
  });
});

// ===========================================================================
// deleteAccount
// ===========================================================================

describe("deleteAccount — happy path", () => {
  it("deletes the caller's own id, signs out, and redirects home", async () => {
    serviceMockImpl = makeServiceMock({
      subscriptionRow: null,
      parentLinks: [],
    });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
    expect(signOutMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("cancels the Stripe subscription before deleting the parent, when one exists", async () => {
    serviceMockImpl = makeServiceMock({
      subscriptionRow: { stripe_subscription_id: "sub_123" },
      parentLinks: [],
    });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(stripeCancelMock).toHaveBeenCalledWith("sub_123");
    const cancelIdx = callOrder.indexOf("subscription_check");
    const deleteIdx = callOrder.indexOf(`delete_user:${PARENT_ID}`);
    expect(cancelIdx).toBeLessThan(deleteIdx);
  });
});

describe("deleteAccount — auth-guard rejection", () => {
  it("does NOT delete anything when requireParent rejects (unauthenticated / non-parent)", async () => {
    requireParentMock.mockImplementation(async () => {
      throw new Error("NEXT_REDIRECT");
    });
    serviceMockImpl = makeServiceMock();

    await expect(
      deleteAccount(null, makeFormData({ confirm: "DELETE" })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
    expect(stripeCancelMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("deleteAccount — rate limit", () => {
  it("blocks with no side effects when recentCount is at the limit (no Stripe cancel, no delete)", async () => {
    serviceMockImpl = makeServiceMock({
      recentEventCount: 10,
      subscriptionRow: { stripe_subscription_id: "sub_should_not_be_touched" },
      parentLinks: [{ athlete_id: ATHLETE_ID }],
    });

    const result = await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/too many|wait/i),
    });
    expect(stripeCancelMock).not.toHaveBeenCalled();
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
    expect(signOutMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("deleteAccount — wrong confirmation text", () => {
  it("returns an error and never even calls requireParent (nothing happens)", async () => {
    const result = await deleteAccount(null, makeFormData({ confirm: "delete" }));

    expect(result).toMatchObject({ ok: false, error: 'Type "DELETE" to confirm.' });
    expect(requireParentMock).not.toHaveBeenCalled();
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
    expect(stripeCancelMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("deleteAccount — co-parented athlete preserved", () => {
  it("deletes the sole-managed athlete but keeps the athlete shared with a co-parent", async () => {
    const SOLE_ATHLETE = "athlete-sole-001";
    const SHARED_ATHLETE = "athlete-shared-002";
    serviceMockImpl = makeServiceMock({
      parentLinks: [{ athlete_id: SOLE_ATHLETE }, { athlete_id: SHARED_ATHLETE }],
      coParentCountFor: { [SOLE_ATHLETE]: 1, [SHARED_ATHLETE]: 2 },
      subscriptionRow: null,
    });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    const deletedIds = serviceMockImpl.__deleteUserCalls();
    expect(deletedIds).toContain(SOLE_ATHLETE);
    expect(deletedIds).not.toContain(SHARED_ATHLETE);
    // Parent is deleted last, after both athletes are considered.
    expect(deletedIds).toContain(PARENT_ID);
    expect(deletedIds.indexOf(PARENT_ID)).toBe(deletedIds.length - 1);

    // Audit write records the sole-managed count, not the shared one.
    const audit = serviceMockImpl.__auditInsertPayloads();
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      event_type: "account_deleted",
      actor_parent_id: PARENT_ID,
      athletes_deleted: 1,
    });
  });
});
