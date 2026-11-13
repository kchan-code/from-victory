/**
 * Unit tests for lib/subscriptions/google-play-api.ts (FV-661): the pure
 * parser, the REST calls with a fake fetch and a fake token source (no live
 * Google calls), and the bounded acknowledge retry.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
// The default auth module is never reached: every call below injects a token
// source. Mocked so the real library is never needed.
vi.mock("@/lib/subscriptions/google-play-auth", () => ({
  getPlayAccessToken: async () => {
    throw new Error("default token source must not be used in tests");
  },
}));

import {
  acknowledgeSubscriptionPurchase,
  acknowledgeWithRetry,
  getSubscriptionPurchaseV2,
  parseSubscriptionPurchaseV2,
} from "@/lib/subscriptions/google-play-api";
import {
  SENTINEL_ACCOUNT_ID,
  SENTINEL_LINKED_TOKEN,
  SENTINEL_TOKEN,
  subscriptionV2Fixture,
} from "../fixtures/google-play-fixtures";

const getAccessToken = async () => "FAKE_ACCESS_TOKEN";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

let logged: string[] = [];
beforeEach(() => {
  logged = [];
  for (const m of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, m).mockImplementation((...a: unknown[]) => {
      logged.push(a.map(String).join(" "));
    });
  }
});
afterEach(() => vi.restoreAllMocks());

describe("parseSubscriptionPurchaseV2", () => {
  it("maps an active purchase to our row shape", () => {
    const r = parseSubscriptionPurchaseV2(
      subscriptionV2Fixture({ offerId: "trial-7d", linkedPurchaseToken: SENTINEL_LINKED_TOKEN }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.purchase).toEqual({
      productId: "family.1",
      basePlanId: "monthly",
      status: "active",
      expiresAt: "2026-12-12T12:00:00.000Z",
      autoRenewing: true,
      isTestPurchase: false,
      obfuscatedAccountId: SENTINEL_ACCOUNT_ID,
      linkedPurchaseToken: SENTINEL_LINKED_TOKEN,
      acknowledged: false,
      offerId: "trial-7d",
    });
  });

  it("maps every Google subscription state to the lowercase status vocabulary", () => {
    const states: Record<string, string> = {
      SUBSCRIPTION_STATE_PENDING: "pending",
      SUBSCRIPTION_STATE_ACTIVE: "active",
      SUBSCRIPTION_STATE_PAUSED: "paused",
      SUBSCRIPTION_STATE_IN_GRACE_PERIOD: "in_grace_period",
      SUBSCRIPTION_STATE_ON_HOLD: "on_hold",
      SUBSCRIPTION_STATE_CANCELED: "canceled",
      SUBSCRIPTION_STATE_EXPIRED: "expired",
      SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED: "pending_purchase_canceled",
    };
    for (const [state, status] of Object.entries(states)) {
      const r = parseSubscriptionPurchaseV2(subscriptionV2Fixture({ state }));
      expect(r.ok && r.purchase.status).toBe(status);
    }
  });

  it("fails closed on an unknown or unspecified state", () => {
    for (const state of ["SUBSCRIPTION_STATE_UNSPECIFIED", "SUBSCRIPTION_STATE_NEW", "ACTIVE"]) {
      expect(parseSubscriptionPurchaseV2(subscriptionV2Fixture({ state }))).toEqual({
        ok: false,
        reason: "unknown_state",
      });
    }
  });

  it("a missing expiry parses to null (which never grants access)", () => {
    const r = parseSubscriptionPurchaseV2(subscriptionV2Fixture({ expiryTime: null }));
    expect(r.ok && r.purchase.expiresAt).toBeNull();
  });

  it("detects a test purchase by the mere presence of testPurchase", () => {
    const test = parseSubscriptionPurchaseV2(subscriptionV2Fixture({ testPurchase: true }));
    const live = parseSubscriptionPurchaseV2(subscriptionV2Fixture({}));
    expect(test.ok && test.purchase.isTestPurchase).toBe(true);
    expect(live.ok && live.purchase.isTestPurchase).toBe(false);
  });

  it("reads acknowledged and a missing account id", () => {
    const r = parseSubscriptionPurchaseV2(subscriptionV2Fixture({ acknowledged: true, accountId: null }));
    expect(r.ok && r.purchase.acknowledged).toBe(true);
    expect(r.ok && r.purchase.obfuscatedAccountId).toBeNull();
  });

  it("takes the earliest-expiring line item as current when several are listed", () => {
    const r = parseSubscriptionPurchaseV2(
      subscriptionV2Fixture({
        productId: "family.2",
        expiryTime: "2027-01-01T00:00:00.000Z",
        extraLineItems: [
          {
            productId: "family.1",
            expiryTime: "2026-12-01T00:00:00.000Z",
            autoRenewingPlan: { autoRenewEnabled: true },
            offerDetails: { basePlanId: "monthly" },
          },
        ],
      }),
    );
    expect(r.ok && r.purchase.productId).toBe("family.1");
    expect(r.ok && r.purchase.expiresAt).toBe("2026-12-01T00:00:00.000Z");
  });

  it("scheduled change: the plan held now wins over the not-yet-owned plan, which has no expiry", () => {
    // Shape per Google's reference: the current item carries
    // deferredItemReplacement; the target has no successful order and no expiry.
    const target = {
      productId: "family.1",
      autoRenewingPlan: { autoRenewEnabled: true },
      offerDetails: { basePlanId: "monthly" },
    };
    const held = {
      productId: "family.3",
      expiryTime: "2026-12-20T00:00:00.000Z",
      latestSuccessfulOrderId: "GPA.1111-1111-1111-11111",
      deferredItemReplacement: { productId: "family.1" },
      autoRenewingPlan: { autoRenewEnabled: true },
      offerDetails: { basePlanId: "monthly" },
    };
    // Order must not matter.
    for (const lineItems of [
      [target, held],
      [held, target],
    ]) {
      const r = parseSubscriptionPurchaseV2({ ...subscriptionV2Fixture(), lineItems });
      expect(r.ok && r.purchase.productId).toBe("family.3");
      expect(r.ok && r.purchase.expiresAt).toBe("2026-12-20T00:00:00.000Z");
    }
  });

  it("scheduled change without the deferred marker: an owned item still beats an unowned one", () => {
    const r = parseSubscriptionPurchaseV2({
      ...subscriptionV2Fixture(),
      lineItems: [
        {
          productId: "family.1",
          expiryTime: "2026-11-30T00:00:00.000Z",
          autoRenewingPlan: { autoRenewEnabled: true },
          offerDetails: { basePlanId: "monthly" },
        },
        {
          productId: "family.3",
          expiryTime: "2026-12-20T00:00:00.000Z",
          latestSuccessfulOrderId: "GPA.1111-1111-1111-11111",
          autoRenewingPlan: { autoRenewEnabled: true },
          offerDetails: { basePlanId: "monthly" },
        },
      ],
    });
    expect(r.ok && r.purchase.productId).toBe("family.3");
  });

  it("an item with no expiry is chosen only when no candidate has one", () => {
    const r = parseSubscriptionPurchaseV2({
      ...subscriptionV2Fixture(),
      lineItems: [
        { productId: "family.2", autoRenewingPlan: {}, offerDetails: { basePlanId: "monthly" } },
        {
          productId: "family.1",
          expiryTime: "2026-12-01T00:00:00.000Z",
          autoRenewingPlan: { autoRenewEnabled: true },
          offerDetails: { basePlanId: "monthly" },
        },
      ],
    });
    expect(r.ok && r.purchase.productId).toBe("family.1");
    const none = parseSubscriptionPurchaseV2({
      ...subscriptionV2Fixture(),
      lineItems: [{ productId: "family.2", autoRenewingPlan: {}, offerDetails: { basePlanId: "monthly" } }],
    });
    expect(none.ok && none.purchase.expiresAt).toBeNull();
  });

  it("rejects bodies with no line items or no base plan id", () => {
    expect(parseSubscriptionPurchaseV2({ subscriptionState: "SUBSCRIPTION_STATE_ACTIVE", lineItems: [] }).ok).toBe(false);
    expect(parseSubscriptionPurchaseV2(null).ok).toBe(false);
    expect(
      parseSubscriptionPurchaseV2({
        subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
        lineItems: [{ productId: "family.1", expiryTime: "2026-12-01T00:00:00Z" }],
      }).ok,
    ).toBe(false);
  });
});

describe("getSubscriptionPurchaseV2", () => {
  it("calls the v2 endpoint with a bearer token and parses the response", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(subscriptionV2Fixture({})));
    const r = await getSubscriptionPurchaseV2(SENTINEL_TOKEN, { getAccessToken, fetchImpl });
    expect(r.ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/applications/com.fromvictoryapp.app/purchases/subscriptionsv2/tokens/");
    expect(url).toContain(SENTINEL_TOKEN);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer FAKE_ACCESS_TOKEN");
  });

  it("maps 400/404/410 to invalid_token and 5xx / network / auth errors to unavailable", async () => {
    for (const status of [400, 404, 410]) {
      const r = await getSubscriptionPurchaseV2(SENTINEL_TOKEN, {
        getAccessToken,
        fetchImpl: async () => jsonResponse({ error: { message: SENTINEL_TOKEN } }, status),
      });
      expect(r).toEqual({ ok: false, reason: "invalid_token" });
    }
    const r500 = await getSubscriptionPurchaseV2(SENTINEL_TOKEN, {
      getAccessToken,
      fetchImpl: async () => jsonResponse({}, 503),
    });
    expect(r500).toEqual({ ok: false, reason: "unavailable" });
    const net = await getSubscriptionPurchaseV2(SENTINEL_TOKEN, {
      getAccessToken,
      fetchImpl: async () => {
        throw new Error(`boom ${SENTINEL_TOKEN}`);
      },
    });
    expect(net).toEqual({ ok: false, reason: "unavailable" });
    const auth = await getSubscriptionPurchaseV2(SENTINEL_TOKEN, {
      getAccessToken: async () => {
        throw new Error("no credentials");
      },
      fetchImpl: vi.fn(),
    });
    expect(auth).toEqual({ ok: false, reason: "unavailable" });
  });

  it("never logs or returns the token or account id, even on failure", async () => {
    const results = [
      await getSubscriptionPurchaseV2(SENTINEL_TOKEN, {
        getAccessToken,
        fetchImpl: async () => {
          throw new Error(`boom ${SENTINEL_TOKEN}`);
        },
      }),
      await getSubscriptionPurchaseV2(SENTINEL_TOKEN, {
        getAccessToken,
        fetchImpl: async () => jsonResponse({ echo: SENTINEL_TOKEN }, 400),
      }),
    ];
    expect(logged.join("\n")).not.toContain(SENTINEL_TOKEN);
    expect(JSON.stringify(results)).not.toContain(SENTINEL_TOKEN);
  });
});

describe("acknowledge", () => {
  it("POSTs the v1 acknowledge endpoint keyed by product id", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    const ok = await acknowledgeSubscriptionPurchase("family.1", SENTINEL_TOKEN, { getAccessToken, fetchImpl });
    expect(ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/purchases/subscriptions/family.1/tokens/");
    expect(url.endsWith(":acknowledge")).toBe(true);
    expect(init.method).toBe("POST");
  });

  it("retries a failed acknowledge a bounded number of times, then reports failure", async () => {
    const sleeps: number[] = [];
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 500 }));
    const ok = await acknowledgeWithRetry("family.1", SENTINEL_TOKEN, { getAccessToken, fetchImpl }, {
      attempts: 3,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });
    expect(ok).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleeps).toHaveLength(2);
  });

  it("stops retrying as soon as one attempt succeeds", async () => {
    let n = 0;
    const fetchImpl = vi.fn(async () => new Response("{}", { status: ++n < 2 ? 500 : 200 }));
    const ok = await acknowledgeWithRetry("family.1", SENTINEL_TOKEN, { getAccessToken, fetchImpl }, {
      sleep: async () => {},
    });
    expect(ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("treats a thrown fetch or auth error as a failed attempt without logging the token", async () => {
    const ok = await acknowledgeSubscriptionPurchase("family.1", SENTINEL_TOKEN, {
      getAccessToken,
      fetchImpl: async () => {
        throw new Error(`boom ${SENTINEL_TOKEN}`);
      },
    });
    expect(ok).toBe(false);
    expect(logged.join("\n")).not.toContain(SENTINEL_TOKEN);
  });
});
