/**
 * deleteAccount x Apple token revocation (FV-673, spec §5.5 / §13a).
 *
 * Order per deleted user: Stripe cancel -> (future Play cancel, not built) ->
 * Apple revoke -> auth delete. Revoke is retried 3x inline; if every try fails
 * the account is deleted anyway, the manual instruction is surfaced and an
 * alert (internal id only) is raised. Revoke is never flag-gated.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const redirectMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect: (p: string) => redirectMock(p) }));

const PAYER = "payer-uuid";
vi.mock("@/lib/auth/guards", () => ({
  requireParent: async () => ({ userId: PAYER }),
  requireSubscriber: async () => ({ userId: PAYER }),
}));

const order = vi.hoisted(() => [] as string[]);

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({ subscriptions: { cancel: vi.fn(async () => void order.push("stripe_cancel")) } }),
}));
vi.mock("@/lib/stripe/sync-athlete-quantity", () => ({ syncAthleteQuantity: vi.fn(async () => {}) }));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: (p: Promise<unknown>) => void p.catch(() => {}) }));
vi.mock("@/lib/native-shell", () => ({ isNativeShell: () => false }));

const revoke = vi.hoisted(() => ({
  revokeAppleTokensWithRetry: vi.fn(),
  alertAppleRevokeFailure: vi.fn(),
}));
vi.mock("@/lib/auth/apple/revoke", () => revoke);

const session = vi.hoisted(() => ({ identities: [] as { provider: string }[] }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn(async () => void order.push("sign_out")),
      getUser: vi.fn(async () => ({ data: { user: { identities: session.identities } } })),
    },
  }),
}));

const links = vi.hoisted(() => ({ athletes: [] as string[] }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    auth: { admin: { deleteUser: vi.fn(async (id: string) => (order.push(`delete:${id}`), { error: null })) } },
    from: (table: string) => {
      if (table === "account_deletion_events") {
        return {
          select: () => ({ eq: () => ({ gt: async () => ({ count: 0 }) }) }),
          insert: async () => ({ error: null }),
        };
      }
      if (table === "subscriptions") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { stripe_subscription_id: "sub_1" } }) }) }) };
      }
      if (table === "parent_athlete_links") {
        return {
          select: (_c: string, o?: { count?: string }) =>
            o?.count
              ? { eq: () => ({ then: (r: (v: unknown) => void) => r({ count: 1, error: null }) }) }
              : { eq: () => ({ then: (r: (v: unknown) => void) => r({ data: links.athletes.map((a) => ({ athlete_id: a })), error: null }) }) },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import { deleteAccount } from "@/lib/actions/account";

const form = () => {
  const f = new FormData();
  f.set("confirm", "DELETE");
  return f;
};

beforeEach(() => {
  order.length = 0;
  vi.clearAllMocks();
  links.athletes = [];
  session.identities = [{ provider: "apple" }];
  revoke.revokeAppleTokensWithRetry.mockImplementation(async (uid: string) => {
    order.push(`apple_revoke:${uid}`);
    return { rows: [], allOk: true };
  });
});

describe("deleteAccount + Apple revoke", () => {
  it("orders Stripe cancel -> Apple revoke -> delete (payer)", async () => {
    await deleteAccount(null, form());
    expect(order.slice(0, 3)).toEqual(["stripe_cancel", `apple_revoke:${PAYER}`, `delete:${PAYER}`]);
    expect(revoke.revokeAppleTokensWithRetry).toHaveBeenCalledWith(PAYER, 3);
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("revokes each deleted user immediately before that user's delete (payer + athletes)", async () => {
    links.athletes = ["ath-1", "ath-2"];
    await deleteAccount(null, form());
    expect(order.filter((e) => e !== "sign_out")).toEqual([
      "stripe_cancel",
      "apple_revoke:ath-1", "delete:ath-1",
      "apple_revoke:ath-2", "delete:ath-2",
      `apple_revoke:${PAYER}`, `delete:${PAYER}`,
    ]);
  });

  it("all revoke attempts fail: deletes anyway, returns the manual instruction, alerts with the internal id only", async () => {
    revoke.revokeAppleTokensWithRetry.mockResolvedValue({ rows: [{ clientId: "c", ok: false }], allOk: false });
    const r = await deleteAccount(null, form());
    expect(r).toEqual({ ok: true, appleRevokeManual: true });
    expect(order).toContain(`delete:${PAYER}`);
    expect(redirectMock).not.toHaveBeenCalled();
    expect(revoke.alertAppleRevokeFailure).toHaveBeenCalledTimes(1);
    const [label, ctx] = revoke.alertAppleRevokeFailure.mock.calls[0]!;
    expect(ctx).toEqual({ user_id: PAYER });
    expect(JSON.stringify([label, ctx])).not.toMatch(/@|token/i);
  });

  it("revoke failure for a user with no Apple identity still deletes and redirects normally", async () => {
    session.identities = [{ provider: "email" }];
    revoke.revokeAppleTokensWithRetry.mockResolvedValue({ rows: [], allOk: false });
    const r = await deleteAccount(null, form());
    expect(r).toBeUndefined();
    expect(redirectMock).toHaveBeenCalledWith("/");
    expect(revoke.alertAppleRevokeFailure).toHaveBeenCalled();
  });

  it("a thrown revoke error never blocks the deletion", async () => {
    revoke.revokeAppleTokensWithRetry.mockRejectedValue(new Error("boom"));
    const r = await deleteAccount(null, form());
    expect(r).toEqual({ ok: true, appleRevokeManual: true });
    expect(order).toContain(`delete:${PAYER}`);
  });

  it("runs with every SSO flag off (revoke is never gated)", async () => {
    process.env.SSO_WEB = "off";
    process.env.SSO_IOS = "off";
    process.env.SSO_ANDROID = "off";
    await deleteAccount(null, form());
    expect(revoke.revokeAppleTokensWithRetry).toHaveBeenCalledWith(PAYER, 3);
  });
});
