/**
 * Unit tests for the account-deletion server actions (FV-375; deleteAccount
 * widened to the adult_athlete self-serve role in FV-440).
 *
 * Covers `lib/actions/account.ts`:
 *   - deleteAthlete: non-owner rejection (+ ownership-check-before-delete
 *     ordering), owner success (deletes the right athlete id), missing
 *     profile, wrong confirmation text, rate-limit-at-threshold.
 *     PARENT-ONLY — untouched by FV-440; still gated by requireParent().
 *   - deleteAccount: happy path (deletes caller's own id, signs out,
 *     redirects), auth-guard rejection, rate-limit (no side effects), wrong
 *     confirmation (nothing happens, requireSubscriber never even called),
 *     co-parented athlete preserved (sole-managed deleted, shared kept), and
 *     (FV-440) an adult_athlete self-delete path: deletes only the caller's
 *     own row, cancels Stripe first, respects the rate limit, and never
 *     touches a parent_athlete_links-linked athlete (structurally empty for
 *     an adult — see the trigger invariant documented in account.ts).
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

import Stripe from "stripe";
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

// Auth guards — controllable per test. Default: a fixed parent id. Tests that
// need to simulate an unauthenticated / non-parent caller swap in a rejecting
// implementation (mirroring how requireParent()/requireSubscriber() really
// redirect on failure — in real Next.js that throws NEXT_REDIRECT and halts
// the action).
//
// deleteAthlete is PARENT-ONLY (requireParent, untouched by FV-440).
// deleteAccount is widened to requireSubscriber (FV-440) so an adult_athlete
// can self-delete; requireSubscriberMock defaults to the same fixed id so
// every existing "parent" deleteAccount test keeps passing unchanged.
const PARENT_ID = "parent-uuid-123";
const requireParentMock = vi.fn(async () => ({ userId: PARENT_ID }));
const requireSubscriberMock = vi.fn(async () => ({ userId: PARENT_ID }));
vi.mock("@/lib/auth/guards", () => ({
  requireParent: () => requireParentMock(),
  requireSubscriber: () => requireSubscriberMock(),
}));

const {
  notifyErrorMock,
  cancelGoogleRenewalMock,
  googleCancelableRowsMock,
  getSubscriptionPurchaseV2Mock,
} = vi.hoisted(() => ({
  notifyErrorMock: vi.fn(async (..._args: unknown[]) => undefined),
  cancelGoogleRenewalMock: vi.fn(async (..._args: unknown[]) => true),
  getSubscriptionPurchaseV2Mock: vi.fn(
    async (): Promise<
      | {
          ok: true;
          purchase: {
            latestOrderId: string | null;
            status: string;
          };
        }
      | { ok: false; reason: string }
    > => ({
      ok: true,
      purchase: { latestOrderId: "GPA.1111-2222-3333-44444", status: "active" },
    }),
  ),
  googleCancelableRowsMock: vi.fn(
    async (): Promise<{
      rows: Array<{
        product_id: string;
        purchase_token: string;
        status: string;
        expires_at: string | null;
      }>;
      readError: boolean;
    }> => ({
      rows: [],
      readError: false,
    }),
  ),
}));

// Stripe client — only deleteAccount's cancel-before-delete step touches
// this. Tests that don't reach the cancel step never call it.
const stripeCancelMock = vi.fn(async (..._args: unknown[]) => ({}));
const stripeCheckoutListMock = vi.fn(
  async (..._args: unknown[]) => ({ data: [], has_more: false }),
);
const stripeCheckoutExpireMock = vi.fn(async (sessionId: string) => {
  callOrder.push(`stripe_checkout_expire:${sessionId}`);
  return { id: sessionId, object: "checkout.session" };
});
// FV-726: customers.del runs right after the cancel, before any DB delete.
const stripeCustomerDelMock = vi.fn(async (..._args: unknown[]) => {
  callOrder.push("stripe_customer_del");
  return { deleted: true };
});
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    subscriptions: { cancel: stripeCancelMock },
    checkout: {
      sessions: {
        list: (...args: unknown[]) => {
          callOrder.push("stripe_checkout_list");
          return stripeCheckoutListMock(...args);
        },
        expire: (sessionId: string) => stripeCheckoutExpireMock(sessionId),
      },
    },
    customers: { del: stripeCustomerDelMock },
  }),
}));

// Stripe quantity sync — non-blocking fire-and-forget; no-op in tests.
const syncAthleteQuantityMock = vi.fn(async (..._args: unknown[]) => {});
vi.mock("@/lib/stripe/sync-athlete-quantity", () => ({
  syncAthleteQuantity: (...args: unknown[]) => syncAthleteQuantityMock(...args),
}));
vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: (p: Promise<unknown>) => {
    // Swallow so an unawaited rejection never fails the test run.
    void p.catch(() => {});
  },
}));
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: (...args: unknown[]) => notifyErrorMock(...args),
}));

vi.mock("@/lib/subscriptions/google-play-api", () => ({
  cancelSubscriptionRenewal: (...args: unknown[]) =>
    cancelGoogleRenewalMock(...args),
  getSubscriptionPurchaseV2: (...args: unknown[]) =>
    getSubscriptionPurchaseV2Mock(...(args as [])),
}));
vi.mock("@/lib/subscriptions/google", () => ({
  getGoogleCancelableSubscriptionsForPayer: googleCancelableRowsMock,
}));

// Anon server client — used only for deleteAccount's final signOut().
const signOutMock = vi.fn(async () => ({ error: null }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { signOut: signOutMock },
  }),
}));

// Native-shell detector (FV-489) — controllable per test. Default: browser
// (not in-shell), matching every existing test below that asserts
// redirect("/").
const isNativeShellMock = vi.fn(() => false);
vi.mock("@/lib/native-shell", () => ({
  isNativeShell: () => isNativeShellMock(),
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
  subscriptionRow?: {
    stripe_subscription_id: string | null;
    stripe_customer_id?: string | null;
  } | null;
  mirroredStripeCustomerId?: string | null;
  mirroredStripeCustomerReadError?: { message: string } | null;
  subscriptionDeleteError?: { message: string } | null;
  stripeCustomerDeleteError?: { message: string } | null;
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
    mirroredStripeCustomerId = null,
    mirroredStripeCustomerReadError = null,
    subscriptionDeleteError = null,
    stripeCustomerDeleteError = null,
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
          delete: () => ({
            eq: async (_c: string, _v: unknown) => {
              callOrder.push("subscriptions_row_delete");
              return { error: subscriptionDeleteError };
            },
          }),
        };
      }

      if (table === "stripe_customers") {
        return {
          select: (_cols: string) => ({
            eq: (_c: string, _v: unknown) => ({
              maybeSingle: async () => {
                callOrder.push("stripe_customer_mirror_check");
                if (mirroredStripeCustomerReadError) {
                  return { data: null, error: mirroredStripeCustomerReadError };
                }
                return {
                  data: mirroredStripeCustomerId
                    ? { stripe_customer_id: mirroredStripeCustomerId }
                    : null,
                  error: null,
                };
              },
            }),
          }),
          delete: () => ({
            eq: async (_c: string, _v: unknown) => {
              callOrder.push("stripe_customers_row_delete");
              return { error: stripeCustomerDeleteError };
            },
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
  requireSubscriberMock.mockImplementation(async () => ({ userId: PARENT_ID }));
  serviceMockImpl = makeServiceMock();
  isNativeShellMock.mockReturnValue(false);
  googleCancelableRowsMock.mockResolvedValue({ rows: [], readError: false });
  cancelGoogleRenewalMock.mockResolvedValue(true);
  getSubscriptionPurchaseV2Mock.mockResolvedValue({
    ok: true,
    purchase: { latestOrderId: "GPA.1111-2222-3333-44444", status: "active" },
  });
  stripeCheckoutListMock.mockResolvedValue({ data: [], has_more: false });
  stripeCheckoutExpireMock.mockResolvedValue({
    id: "cs_default",
    object: "checkout.session",
  });
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
    expect(redirectMock).toHaveBeenCalledWith("/?account_deleted=1");
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

  it("cancels every Google row that may still bill before deleting the parent", async () => {
    googleCancelableRowsMock.mockResolvedValue({
      rows: [
        {
          product_id: "family.5",
          purchase_token: "tok_google_active",
          status: "active",
          expires_at: "2099-12-12T12:00:00.000Z",
        },
        {
          product_id: "family.5",
          purchase_token: "tok_google_hold",
          status: "on_hold",
          expires_at: "2099-12-10T12:00:00.000Z",
        },
        {
          product_id: "family.5",
          purchase_token: "tok_google_paused",
          status: "paused",
          expires_at: "2099-12-09T12:00:00.000Z",
        },
        {
          product_id: "family.5",
          purchase_token: "tok_google_null_expiry",
          status: "expired",
          expires_at: null,
        },
      ],
      readError: false,
    });
    serviceMockImpl = makeServiceMock({
      subscriptionRow: null,
      parentLinks: [],
    });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(cancelGoogleRenewalMock).toHaveBeenCalledTimes(4);
    expect(cancelGoogleRenewalMock).toHaveBeenCalledWith("tok_google_active");
    expect(cancelGoogleRenewalMock).toHaveBeenCalledWith("tok_google_hold");
    expect(cancelGoogleRenewalMock).toHaveBeenCalledWith("tok_google_paused");
    expect(cancelGoogleRenewalMock).toHaveBeenCalledWith("tok_google_null_expiry");
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
    expect(signOutMock).toHaveBeenCalledOnce();
  });

  it("Google cancel failure does not block deletion, raises an alert, and adds a post-signout notice", async () => {
    googleCancelableRowsMock.mockResolvedValue({
      rows: [
        {
          product_id: "family.2",
          purchase_token: "tok_google_live",
          status: "active",
          expires_at: "2099-12-12T12:00:00.000Z",
        },
      ],
      readError: false,
    });
    cancelGoogleRenewalMock.mockResolvedValue(false);
    serviceMockImpl = makeServiceMock({
      subscriptionRow: null,
      parentLinks: [],
    });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(cancelGoogleRenewalMock).toHaveBeenCalledTimes(2);
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
    expect(signOutMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith(
      "/?account_deleted=1&google_play_cancel=1",
    );
    expect(notifyErrorMock).toHaveBeenCalledWith(
      "[account.deleteAccount] Google Play cancel failed",
      expect.stringContaining("cancel in Google Play"),
    );
    expect(notifyErrorMock).toHaveBeenCalledWith(
      "[account.deleteAccount] Google Play cancel failed",
      expect.stringContaining("com.fromvictoryapp.app/family.2"),
    );
    expect(notifyErrorMock).toHaveBeenCalledWith(
      "[account.deleteAccount] Google Play cancel failed",
      expect.stringContaining("order_id=GPA.1111-2222-3333-44444"),
    );
  });

  it("Google read error does not block deletion and adds the post-signout notice", async () => {
    googleCancelableRowsMock.mockResolvedValue({
      rows: [],
      readError: true,
    });
    serviceMockImpl = makeServiceMock({
      subscriptionRow: null,
      parentLinks: [],
    });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(cancelGoogleRenewalMock).not.toHaveBeenCalled();
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
    expect(redirectMock).toHaveBeenCalledWith(
      "/?account_deleted=1&google_play_cancel_unknown=1",
    );
    expect(notifyErrorMock).toHaveBeenCalledWith(
      "[account.deleteAccount] Google Play cancel skipped",
      expect.stringContaining("check Google Play subscriptions manually"),
    );
  });
});

describe("deleteAccount — auth-guard rejection", () => {
  it("does NOT delete anything when requireSubscriber rejects (unauthenticated / minor athlete)", async () => {
    requireSubscriberMock.mockImplementation(async () => {
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
  it("returns an error and never even calls requireSubscriber (nothing happens)", async () => {
    const result = await deleteAccount(null, makeFormData({ confirm: "delete" }));

    expect(result).toMatchObject({ ok: false, error: 'Type "DELETE" to confirm.' });
    expect(requireSubscriberMock).not.toHaveBeenCalled();
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
    expect(stripeCancelMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("deleteAccount — in-shell redirect target (FV-489)", () => {
  it("redirects to /signin (not the gated marketing root) when isNativeShell() is true", async () => {
    isNativeShellMock.mockReturnValue(true);
    serviceMockImpl = makeServiceMock({ subscriptionRow: null, parentLinks: [] });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(signOutMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith("/signin?account_deleted=1");
    expect(redirectMock).not.toHaveBeenCalledWith("/?account_deleted=1");
  });

  it("still redirects to / when isNativeShell() is false (browser/PWA unchanged)", async () => {
    isNativeShellMock.mockReturnValue(false);
    serviceMockImpl = makeServiceMock({ subscriptionRow: null, parentLinks: [] });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(redirectMock).toHaveBeenCalledWith("/?account_deleted=1");
    expect(redirectMock).not.toHaveBeenCalledWith("/signin?account_deleted=1");
  });

  it("includes the Google-cancel notice flag in the in-shell redirect when Play cancel fails", async () => {
    isNativeShellMock.mockReturnValue(true);
    googleCancelableRowsMock.mockResolvedValue({
      rows: [
        {
          product_id: "family.1",
          purchase_token: "tok_google_live",
          status: "active",
          expires_at: "2099-12-12T12:00:00.000Z",
        },
      ],
      readError: false,
    });
    cancelGoogleRenewalMock.mockResolvedValue(false);
    serviceMockImpl = makeServiceMock({ subscriptionRow: null, parentLinks: [] });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(redirectMock).toHaveBeenCalledWith(
      "/signin?account_deleted=1&google_play_cancel=1",
    );
  });

  it("uses the softer in-shell unknown flag when Google entitlement state could not be read", async () => {
    isNativeShellMock.mockReturnValue(true);
    googleCancelableRowsMock.mockResolvedValue({ rows: [], readError: true });
    serviceMockImpl = makeServiceMock({ subscriptionRow: null, parentLinks: [] });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(redirectMock).toHaveBeenCalledWith(
      "/signin?account_deleted=1&google_play_cancel_unknown=1",
    );
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

// ===========================================================================
// deleteAccount — adult_athlete self-serve payer (FV-440)
// ===========================================================================
//
// An adult_athlete never appears as parent_id in parent_athlete_links (the
// check_parent_athlete_link_roles() trigger only accepts role='parent' on
// that side — see 20260625000000_adult_athlete_role.sql). So for every test
// below, `parentLinks` is left at its default `[]`: the links-fetch query
// naturally returns nothing for an adult caller, and the sole-managed-
// athletes loop runs zero iterations. These tests assert that reduced shape
// end-to-end rather than re-deriving the DB invariant.

const ADULT_ID = "adult-uuid-789";

describe("deleteAccount — adult_athlete self-delete (FV-440)", () => {
  it("deletes only the caller's own account, signs out, and redirects home", async () => {
    requireSubscriberMock.mockImplementation(async () => ({ userId: ADULT_ID }));
    serviceMockImpl = makeServiceMock({ subscriptionRow: null, parentLinks: [] });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(serviceMockImpl.__deleteUserCalls()).toEqual([ADULT_ID]);
    expect(signOutMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith("/?account_deleted=1");
  });

  it("cancels the Stripe subscription before deleting an adult_athlete with a live subscription", async () => {
    requireSubscriberMock.mockImplementation(async () => ({ userId: ADULT_ID }));
    serviceMockImpl = makeServiceMock({
      subscriptionRow: { stripe_subscription_id: "sub_adult_123" },
      parentLinks: [],
    });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(stripeCancelMock).toHaveBeenCalledWith("sub_adult_123");
    const cancelIdx = callOrder.indexOf("subscription_check");
    const deleteIdx = callOrder.indexOf(`delete_user:${ADULT_ID}`);
    expect(cancelIdx).toBeLessThan(deleteIdx);
  });

  it("applies the deletion rate limit to the adult self-delete path (no side effects when at limit)", async () => {
    requireSubscriberMock.mockImplementation(async () => ({ userId: ADULT_ID }));
    serviceMockImpl = makeServiceMock({
      recentEventCount: 10,
      subscriptionRow: { stripe_subscription_id: "sub_should_not_be_touched" },
      parentLinks: [],
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

  it("never queries or deletes any parent_athlete_links-linked athlete for an adult caller", async () => {
    requireSubscriberMock.mockImplementation(async () => ({ userId: ADULT_ID }));
    serviceMockImpl = makeServiceMock({ subscriptionRow: null, parentLinks: [] });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    // The links-fetch query runs (it's unconditional), but resolves empty for
    // an adult — no co-parent-count query and no athlete delete ever happen.
    expect(callOrder).toContain("links_fetch");
    expect(callOrder.some((c) => c.startsWith("co_parent_count:"))).toBe(false);
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([ADULT_ID]);

    const audit = serviceMockImpl.__auditInsertPayloads();
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      event_type: "account_deleted",
      actor_parent_id: ADULT_ID,
      athletes_deleted: 0,
    });
  });
});

// ===========================================================================
// deleteAccount — Stripe customer deletion (FV-726)
// ===========================================================================

function stripeInvalid(code: string) {
  return new Stripe.errors.StripeInvalidRequestError({
    type: "invalid_request_error",
    message: `Error: ${code}`,
    code,
  });
}

const SUB = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_1" };

describe("deleteAccount — Stripe customer delete (FV-726)", () => {
  it("expires open checkout sessions before deleting the customer and before any DB delete", async () => {
    stripeCheckoutListMock.mockResolvedValueOnce({
      data: [{ id: "cs_open_1" }],
      has_more: false,
    });
    serviceMockImpl = makeServiceMock({ subscriptionRow: SUB });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(stripeCancelMock).toHaveBeenCalledWith("sub_1");
    expect(stripeCheckoutListMock).toHaveBeenCalledWith({
      customer: "cus_1",
      status: "open",
      limit: 100,
    });
    expect(stripeCheckoutExpireMock).toHaveBeenCalledWith("cs_open_1");
    expect(stripeCustomerDelMock).toHaveBeenCalledWith("cus_1");
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
    const checkoutExpireIdx = callOrder.indexOf("stripe_checkout_expire:cs_open_1");
    const del = callOrder.indexOf("stripe_customer_del");
    const subDeleteIdx = callOrder.indexOf("subscriptions_row_delete");
    expect(del).toBeGreaterThan(callOrder.indexOf("subscription_check"));
    expect(checkoutExpireIdx).toBeGreaterThan(callOrder.indexOf("stripe_checkout_list"));
    expect(checkoutExpireIdx).toBeLessThan(del);
    expect(checkoutExpireIdx).toBeLessThan(subDeleteIdx);
    expect(del).toBeLessThan(callOrder.indexOf("links_fetch"));
    expect(del).toBeLessThan(callOrder.indexOf(`delete_user:${PARENT_ID}`));
  });

  it("proceeds when no open checkout sessions exist", async () => {
    stripeCheckoutListMock.mockResolvedValueOnce({ data: [], has_more: false });
    serviceMockImpl = makeServiceMock({ subscriptionRow: SUB });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(stripeCheckoutListMock).toHaveBeenCalledTimes(1);
    expect(stripeCheckoutExpireMock).not.toHaveBeenCalled();
    expect(stripeCustomerDelMock).toHaveBeenCalledWith("cus_1");
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
  });

  it("treats already-expired/completed Checkout Sessions as benign and proceeds", async () => {
    stripeCheckoutListMock.mockResolvedValueOnce({
      data: [{ id: "cs_open_1" }],
      has_more: false,
    });
    stripeCheckoutExpireMock.mockRejectedValueOnce(
      stripeInvalid("session_not_expireable"),
    );
    serviceMockImpl = makeServiceMock({ subscriptionRow: SUB });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(stripeCustomerDelMock).toHaveBeenCalledWith("cus_1");
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
    expect(redirectMock).toHaveBeenCalledWith("/?account_deleted=1");
  });

  it("aborts with NO database delete when checkout-session expiry fails non-benignly", async () => {
    stripeCheckoutListMock.mockResolvedValueOnce({
      data: [{ id: "cs_open_1" }],
      has_more: false,
    });
    stripeCheckoutExpireMock.mockRejectedValueOnce(new Error("Stripe is down"));
    serviceMockImpl = makeServiceMock({
      subscriptionRow: SUB,
      parentLinks: [{ athlete_id: ATHLETE_ID }],
      coParentCountFor: { [ATHLETE_ID]: 1 },
    });

    const result = await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringContaining("pending checkout sessions"),
    });
    expect(stripeCustomerDelMock).not.toHaveBeenCalled();
    expect(callOrder).not.toContain("links_fetch");
    expect(callOrder).not.toContain("subscriptions_row_delete");
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
    expect(signOutMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("dedupes customer ids found in both mirrors and deletes once", async () => {
    serviceMockImpl = makeServiceMock({
      subscriptionRow: SUB,
      mirroredStripeCustomerId: "cus_1",
    });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(stripeCustomerDelMock).toHaveBeenCalledTimes(1);
    expect(stripeCustomerDelMock).toHaveBeenCalledWith("cus_1");
  });

  it("deletes both customer ids when subscriptions and stripe_customers hold different ids", async () => {
    serviceMockImpl = makeServiceMock({
      subscriptionRow: { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_sub" },
      mirroredStripeCustomerId: "cus_mirror",
    });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(stripeCustomerDelMock).toHaveBeenCalledTimes(2);
    expect(stripeCustomerDelMock).toHaveBeenNthCalledWith(1, "cus_sub");
    expect(stripeCustomerDelMock).toHaveBeenNthCalledWith(2, "cus_mirror");
  });

  it("skips the customer delete when there is no stripe_customer_id", async () => {
    serviceMockImpl = makeServiceMock({
      subscriptionRow: { stripe_subscription_id: "sub_1", stripe_customer_id: null },
    });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(stripeCustomerDelMock).not.toHaveBeenCalled();
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
  });

  it("skips the customer delete when there is no subscriptions row (comp / App Store / never subscribed)", async () => {
    serviceMockImpl = makeServiceMock({ subscriptionRow: null });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(stripeCustomerDelMock).not.toHaveBeenCalled();
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
  });

  it("deletes the customer even when the row has no subscription id", async () => {
    serviceMockImpl = makeServiceMock({
      subscriptionRow: { stripe_subscription_id: null, stripe_customer_id: "cus_1" },
    });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(stripeCancelMock).not.toHaveBeenCalled();
    expect(stripeCustomerDelMock).toHaveBeenCalledWith("cus_1");
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
  });

  it("abandoned-checkout customer is removed at account deletion (no sub id persisted yet)", async () => {
    serviceMockImpl = makeServiceMock({
      subscriptionRow: { stripe_subscription_id: null, stripe_customer_id: null },
      mirroredStripeCustomerId: "cus_abandoned",
    });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(stripeCancelMock).not.toHaveBeenCalled();
    expect(stripeCustomerDelMock).toHaveBeenCalledWith("cus_abandoned");
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
  });

  it("proceeds when the customer is already gone (resource_missing)", async () => {
    stripeCustomerDelMock.mockRejectedValueOnce(stripeInvalid("resource_missing"));
    serviceMockImpl = makeServiceMock({ subscriptionRow: SUB });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
    expect(redirectMock).toHaveBeenCalledWith("/?account_deleted=1");
  });

  it("aborts with NO database delete when the customer delete fails non-benignly", async () => {
    stripeCustomerDelMock.mockRejectedValueOnce(new Error("Stripe is down"));
    serviceMockImpl = makeServiceMock({
      subscriptionRow: SUB,
      parentLinks: [{ athlete_id: ATHLETE_ID }],
      coParentCountFor: { [ATHLETE_ID]: 1 },
    });

    const result = await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringContaining("billing profile"),
    });
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
    expect(callOrder).not.toContain("links_fetch");
    expect(signOutMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("clears the dead subscriptions row and stripe_customers row before deleting anyone", async () => {
    serviceMockImpl = makeServiceMock({ subscriptionRow: SUB, parentLinks: [] });

    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    const subDeleteIdx = callOrder.indexOf("subscriptions_row_delete");
    const mirrorDeleteIdx = callOrder.indexOf("stripe_customers_row_delete");
    const linksFetchIdx = callOrder.indexOf("links_fetch");
    const parentDeleteIdx = callOrder.indexOf(`delete_user:${PARENT_ID}`);
    expect(subDeleteIdx).toBeGreaterThan(callOrder.indexOf("stripe_customer_del"));
    expect(mirrorDeleteIdx).toBeGreaterThan(subDeleteIdx);
    expect(linksFetchIdx).toBeGreaterThan(mirrorDeleteIdx);
    expect(parentDeleteIdx).toBeGreaterThan(mirrorDeleteIdx);
  });

  it("aborts without deleting anyone if the dead row cannot be cleared (subscriptions)", async () => {
    serviceMockImpl = makeServiceMock({
      subscriptionRow: SUB,
      subscriptionDeleteError: { message: "sub delete failed" },
      parentLinks: [{ athlete_id: ATHLETE_ID }],
      coParentCountFor: { [ATHLETE_ID]: 1 },
    });

    const result = await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(result).toMatchObject({ ok: false });
    expect(callOrder).not.toContain("links_fetch");
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
  });

  it("aborts without deleting anyone if the dead row cannot be cleared (stripe_customers)", async () => {
    serviceMockImpl = makeServiceMock({
      subscriptionRow: SUB,
      stripeCustomerDeleteError: { message: "mirror delete failed" },
      parentLinks: [{ athlete_id: ATHLETE_ID }],
      coParentCountFor: { [ATHLETE_ID]: 1 },
    });

    const result = await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(result).toMatchObject({ ok: false });
    expect(callOrder).not.toContain("links_fetch");
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
  });

  it("treats a non-resource_missing invalid-request error as fatal", async () => {
    stripeCustomerDelMock.mockRejectedValueOnce(stripeInvalid("parameter_invalid_empty"));
    serviceMockImpl = makeServiceMock({ subscriptionRow: SUB });

    const result = await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(result).toMatchObject({ ok: false });
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
  });

  it("does not attempt the customer delete when the subscription cancel fails", async () => {
    stripeCancelMock.mockRejectedValueOnce(new Error("Stripe is down"));
    serviceMockImpl = makeServiceMock({ subscriptionRow: SUB });

    const result = await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(result).toMatchObject({ ok: false });
    expect(stripeCustomerDelMock).not.toHaveBeenCalled();
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
  });

  it("aborts without deleting anyone if stripe_customers mirror read fails", async () => {
    serviceMockImpl = makeServiceMock({
      subscriptionRow: SUB,
      mirroredStripeCustomerReadError: { message: "db down" },
    });

    const result = await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    expect(result).toMatchObject({ ok: false });
    expect(stripeCustomerDelMock).not.toHaveBeenCalled();
    expect(serviceMockImpl.__deleteUserCalls()).toHaveLength(0);
  });

  it("retry after a later-step failure succeeds (cancel + customer both benign the second time)", async () => {
    // Attempt 1: customer deleted, then the sole-managed athlete fails.
    serviceMockImpl = makeServiceMock({
      subscriptionRow: SUB,
      parentLinks: [{ athlete_id: ATHLETE_ID }],
      coParentCountFor: { [ATHLETE_ID]: 1 },
      deleteUserErrorFor: { [ATHLETE_ID]: { message: "boom" } },
    });
    const first = await deleteAccount(null, makeFormData({ confirm: "DELETE" }));
    expect(first).toMatchObject({ ok: false });
    expect(serviceMockImpl.__deleteUserCalls()).not.toContain(PARENT_ID);

    // Attempt 2: the row is gone (cleared), so Step 1/1b skip entirely.
    callOrder = [];
    stripeCustomerDelMock.mockClear();
    serviceMockImpl = makeServiceMock({
      subscriptionRow: null,
      parentLinks: [{ athlete_id: ATHLETE_ID }],
      coParentCountFor: { [ATHLETE_ID]: 1 },
    });
    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));
    expect(stripeCustomerDelMock).not.toHaveBeenCalled();
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([ATHLETE_ID, PARENT_ID]);

    // Attempt 2 (alt): the row survived (clear failed earlier) — both Stripe
    // calls hit already-gone objects and are benign.
    callOrder = [];
    stripeCancelMock.mockRejectedValueOnce(stripeInvalid("resource_missing"));
    stripeCustomerDelMock.mockRejectedValueOnce(stripeInvalid("resource_missing"));
    serviceMockImpl = makeServiceMock({ subscriptionRow: SUB });
    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));
    expect(serviceMockImpl.__deleteUserCalls()).toEqual([PARENT_ID]);
  });

  it("logs ids only — no email or name — across success, benign and failure paths", async () => {
    const logs: string[] = [];
    const spies = (["log", "warn", "error"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation((...a: unknown[]) => {
        logs.push(a.map(String).join(" "));
      }),
    );
    // A Stripe error message could echo the customer; ours must not add PII.
    stripeCustomerDelMock.mockRejectedValueOnce(new Error("Stripe is down"));
    serviceMockImpl = makeServiceMock({ subscriptionRow: SUB });
    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));

    serviceMockImpl = makeServiceMock({ subscriptionRow: SUB });
    await deleteAccount(null, makeFormData({ confirm: "DELETE" }));
    spies.forEach((s) => s.mockRestore());

    const joined = logs.join("\n");
    expect(joined).toContain("cus_1");
    expect(joined).not.toMatch(/@/);
    expect(joined).not.toMatch(/\bemail\b|\bname\b/i);
  });
});
