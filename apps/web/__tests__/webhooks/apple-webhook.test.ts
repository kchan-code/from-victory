/**
 * Integration-style tests for POST /api/webhooks/apple (App Store Server
 * Notifications V2), mirroring __tests__/stripe/webhook-route.test.ts's
 * conventions.
 *
 * Covers the named FV-571 ACs:
 *   - JWS verify failure -> 400, no processing
 *   - the 3-branch response discipline: 200 applied / 200 benign-no-match
 *     (unmapped token) / 500 genuine failure
 *   - Sandbox notifications only upsert for an allowlisted payer
 *   - PRIVACY AC: a resolved payer whose role isn't parent|adult_athlete is
 *     refused (no write)
 *   - first-seen creation: a live minted token with no existing
 *     apple_subscriptions row creates one
 *   - grace mapping: DID_FAIL_TO_RENEW/GRACE_PERIOD sets the grace bound;
 *     GRACE_PERIOD_EXPIRED clears it and demotes to in_billing_retry
 *
 * ./apple-server and ./apple-lifecycle are mocked — no real JWS
 * verification, no network call to Apple.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextRequest } from "next/server";
import type { DecodedTransactionInfo } from "@/lib/subscriptions/apple-server";

vi.mock("server-only", () => ({}));

const verifyAndDecodeNotificationMock = vi.fn();
vi.mock("@/lib/subscriptions/apple-server", () => ({
  verifyAndDecodeNotification: (...args: unknown[]) =>
    verifyAndDecodeNotificationMock(...args),
}));

const applyAppleSnapshotMock = vi.fn();
vi.mock("@/lib/subscriptions/apple-lifecycle", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/subscriptions/apple-lifecycle")
  >("@/lib/subscriptions/apple-lifecycle");
  return {
    ...actual,
    applyAppleSnapshot: (...args: unknown[]) => applyAppleSnapshotMock(...args),
  };
});

let subRowsByOtid: Record<string, { payer_id: string } | undefined> = {};
let tokenRowsByToken: Record<string, { payer_id: string } | undefined> = {};
let sandboxAllowlistedPayers = new Set<string>();
let profileRolesByPayer: Record<string, string | undefined> = {};

function makeServiceMock() {
  return {
    from: (table: string) => {
      if (table === "apple_subscriptions") {
        return {
          select: () => ({
            eq: (_col1: string, otid: string) => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: subRowsByOtid[otid] ?? null,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "apple_purchase_tokens") {
        return {
          select: () => ({
            eq: (_col: string, token: string) => ({
              maybeSingle: async () => ({
                data: tokenRowsByToken[token] ?? null,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "apple_sandbox_testers") {
        return {
          select: () => ({
            eq: (_col: string, payerId: string) => ({
              maybeSingle: async () => ({
                data: sandboxAllowlistedPayers.has(payerId) ? { payer_id: payerId } : null,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            eq: (_col: string, payerId: string) => ({
              maybeSingle: async () => ({
                data: profileRolesByPayer[payerId]
                  ? { role: profileRolesByPayer[payerId] }
                  : null,
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  };
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => makeServiceMock(),
}));

const notifyErrorMock = vi.fn(async (..._args: unknown[]) => {});
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: (...args: unknown[]) => notifyErrorMock(...args),
}));
vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: (p: Promise<unknown>) => {
    void p;
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { POST } from "@/app/api/webhooks/apple/route";

const PAYER_ID = "cccccccc-0000-4000-8000-000000000003";

function makeRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

function makeTransaction(
  overrides: Partial<DecodedTransactionInfo> = {},
): DecodedTransactionInfo {
  return {
    originalTransactionId: "otid_1",
    transactionId: "txn_1",
    productId: "tier_1_1athlete",
    bundleId: "com.fromvictoryapp.app",
    expiresDate: 1_800_000_000_000,
    appAccountToken: "TOKEN_1",
    signedDate: 1_700_000_000_000,
    environment: "Production",
    revocationDate: null,
    revocationReason: null,
    ...overrides,
  };
}

function makeDecodedNotification(overrides: Record<string, unknown> = {}) {
  return {
    notificationType: "DID_RENEW",
    subtype: null,
    notificationUUID: "uuid-1",
    signedDate: 1_700_000_000_000,
    environment: "Production",
    transaction: makeTransaction(),
    renewal: null,
    ...overrides,
  };
}

beforeEach(() => {
  subRowsByOtid = {};
  tokenRowsByToken = { TOKEN_1: { payer_id: PAYER_ID } };
  sandboxAllowlistedPayers = new Set();
  profileRolesByPayer = { [PAYER_ID]: "parent" };
  verifyAndDecodeNotificationMock.mockReset();
  applyAppleSnapshotMock.mockReset();
  notifyErrorMock.mockClear();
  applyAppleSnapshotMock.mockResolvedValue({ applied: true, created: true });
});

describe("POST /api/webhooks/apple", () => {
  it("returns 400 when the body has no signedPayload", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect(verifyAndDecodeNotificationMock).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid JSON", async () => {
    const req = { json: async () => { throw new Error("bad json"); } } as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when verification fails — no processing, no raw payload logged", async () => {
    verifyAndDecodeNotificationMock.mockRejectedValueOnce(new Error("VerificationException(1)"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));

    expect(res.status).toBe(400);
    expect(applyAppleSnapshotMock).not.toHaveBeenCalled();
    const logged = warnSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(logged).not.toContain("ey.fake");
    warnSpy.mockRestore();
  });

  it("BRANCH 1 (200 applied): a recognized, mapped notificationType with a resolvable payer applies the snapshot", async () => {
    verifyAndDecodeNotificationMock.mockResolvedValueOnce(makeDecodedNotification());

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));

    expect(res.status).toBe(200);
    expect(applyAppleSnapshotMock).toHaveBeenCalledTimes(1);
    const call = applyAppleSnapshotMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(call.payerId).toBe(PAYER_ID);
    expect(call.status).toBe("subscribed");
  });

  it("BRANCH 2 (200 + warn, no write): a recognized-but-ignored notificationType is not acted on", async () => {
    verifyAndDecodeNotificationMock.mockResolvedValueOnce(
      makeDecodedNotification({ notificationType: "PRICE_INCREASE" }),
    );
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));

    expect(res.status).toBe(200);
    expect(applyAppleSnapshotMock).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
  });

  it("BRANCH 3 (500): a genuine internal failure causes Apple to retry", async () => {
    verifyAndDecodeNotificationMock.mockResolvedValueOnce(makeDecodedNotification());
    applyAppleSnapshotMock.mockRejectedValueOnce(new Error("db exploded"));

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));

    expect(res.status).toBe(500);
    expect(notifyErrorMock).toHaveBeenCalledTimes(1);
  });

  it("UNMAPPED TOKEN (200, benign): no existing OTID row and no matching purchase-token row -> no write", async () => {
    tokenRowsByToken = {}; // token maps to nothing
    verifyAndDecodeNotificationMock.mockResolvedValueOnce(makeDecodedNotification());

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));

    expect(res.status).toBe(200);
    expect(applyAppleSnapshotMock).not.toHaveBeenCalled();
  });

  it("FIRST-SEEN CREATION: a live minted token with no existing apple_subscriptions row creates one", async () => {
    subRowsByOtid = {}; // no existing OTID row
    tokenRowsByToken = { TOKEN_1: { payer_id: PAYER_ID } }; // but the token IS live
    verifyAndDecodeNotificationMock.mockResolvedValueOnce(
      makeDecodedNotification({ notificationType: "SUBSCRIBED" }),
    );

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));

    expect(res.status).toBe(200);
    expect(applyAppleSnapshotMock).toHaveBeenCalledTimes(1);
    const call = applyAppleSnapshotMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(call.payerId).toBe(PAYER_ID);
  });

  it("resolves the payer via an existing OTID row when one exists (preferred over the token lookup)", async () => {
    subRowsByOtid = { otid_1: { payer_id: PAYER_ID } };
    verifyAndDecodeNotificationMock.mockResolvedValueOnce(makeDecodedNotification());

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));

    expect(res.status).toBe(200);
    expect(applyAppleSnapshotMock).toHaveBeenCalledTimes(1);
  });

  it("SANDBOX: a non-allowlisted payer's Sandbox notification is a benign no-op", async () => {
    sandboxAllowlistedPayers = new Set(); // not allowlisted
    verifyAndDecodeNotificationMock.mockResolvedValueOnce(
      makeDecodedNotification({
        environment: "Sandbox",
        transaction: makeTransaction({ environment: "Sandbox" }),
      }),
    );

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));

    expect(res.status).toBe(200);
    expect(applyAppleSnapshotMock).not.toHaveBeenCalled();
  });

  it("SANDBOX: an allowlisted payer's Sandbox notification applies", async () => {
    sandboxAllowlistedPayers = new Set([PAYER_ID]);
    verifyAndDecodeNotificationMock.mockResolvedValueOnce(
      makeDecodedNotification({
        environment: "Sandbox",
        transaction: makeTransaction({ environment: "Sandbox" }),
      }),
    );

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));

    expect(res.status).toBe(200);
    expect(applyAppleSnapshotMock).toHaveBeenCalledTimes(1);
  });

  it("PRIVACY AC: a resolved payer whose role is NOT parent|adult_athlete is refused — no write", async () => {
    profileRolesByPayer[PAYER_ID] = "athlete";
    verifyAndDecodeNotificationMock.mockResolvedValueOnce(makeDecodedNotification());

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));

    expect(res.status).toBe(200);
    expect(applyAppleSnapshotMock).not.toHaveBeenCalled();
  });

  it("GRACE MAPPING: DID_FAIL_TO_RENEW + GRACE_PERIOD sets the grace bound from renewalInfo", async () => {
    verifyAndDecodeNotificationMock.mockResolvedValueOnce(
      makeDecodedNotification({
        notificationType: "DID_FAIL_TO_RENEW",
        subtype: "GRACE_PERIOD",
        renewal: {
          originalTransactionId: "otid_1",
          autoRenewStatus: true,
          gracePeriodExpiresDate: 1_750_000_000_000,
          signedDate: 1_700_000_000_000,
          environment: "Production",
          appAccountToken: "TOKEN_1",
        },
      }),
    );

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));

    expect(res.status).toBe(200);
    const call = applyAppleSnapshotMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(call.status).toBe("in_grace_period");
    expect(call.gracePeriodExpiresAt).toBe(1_750_000_000_000);
  });

  it("GRACE MAPPING: GRACE_PERIOD_EXPIRED clears the grace bound and demotes to in_billing_retry", async () => {
    verifyAndDecodeNotificationMock.mockResolvedValueOnce(
      makeDecodedNotification({
        notificationType: "GRACE_PERIOD_EXPIRED",
        subtype: null,
        renewal: {
          originalTransactionId: "otid_1",
          autoRenewStatus: false,
          gracePeriodExpiresDate: 1_750_000_000_000, // present on the payload…
          signedDate: 1_700_000_000_000,
          environment: "Production",
          appAccountToken: "TOKEN_1",
        },
      }),
    );

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));

    expect(res.status).toBe(200);
    const call = applyAppleSnapshotMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(call.status).toBe("in_billing_retry");
    // …but the mapped status is NOT in_grace_period, so the snapshot builder
    // must clear it to null regardless of what the payload carried.
    expect(call.gracePeriodExpiresAt).toBeNull();
  });

  it("MISORDERING: an older-signedDate notification arriving after a newer one is dropped by the watermark (via the real applyAppleSnapshot)", async () => {
    // Bypasses the applyAppleSnapshot MOCK entirely and calls the REAL
    // implementation (via vi.importActual) directly, to prove the watermark
    // actually protects the shared upsert path end-to-end.
    const actual = await vi.importActual<
      typeof import("@/lib/subscriptions/apple-lifecycle")
    >("@/lib/subscriptions/apple-lifecycle");

    let storedRow: { id: string; last_signed_date: string } | null = null;
    const realService = {
      from: (table: string) => {
        if (table === "apple_subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: storedRow, error: null }),
                }),
              }),
            }),
            update: (payload: Record<string, unknown>) => ({
              eq: () => ({
                // Mirrors the production atomic guard (.lt on the UPDATE's
                // WHERE): the "DB" applies the write only when the incoming
                // watermark is strictly newer than the stored one.
                lt: async () => {
                  const stored = storedRow?.last_signed_date ?? "";
                  if ((payload.last_signed_date as string) > stored) {
                    storedRow = {
                      id: "row-1",
                      last_signed_date: payload.last_signed_date as string,
                    };
                    return { error: null, count: 1 };
                  }
                  return { error: null, count: 0 };
                },
              }),
            }),
            insert: async (payload: Record<string, unknown>) => {
              storedRow = { id: "row-1", last_signed_date: payload.last_signed_date as string };
              return { error: null };
            },
          };
        }
        if (table === "apple_purchase_tokens") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: { payer_id: PAYER_ID }, error: null }) }),
            }),
          };
        }
        if (table === "apple_sandbox_testers") {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
        }
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: { role: "parent" }, error: null }) }),
            }),
          };
        }
        throw new Error(`unexpected table: ${table}`);
      },
    };

    const newerFields = actual.buildSnapshotFields(
      "revoked",
      makeTransaction({ signedDate: 1_900_000_000_000 }),
      null,
    );
    await actual.applyAppleSnapshot(realService as never, { payerId: PAYER_ID, ...newerFields });
    expect(storedRow).not.toBeNull();
    const afterNewer = storedRow as unknown as { last_signed_date: string };
    expect(afterNewer.last_signed_date).toBe(new Date(1_900_000_000_000).toISOString());

    const olderFields = actual.buildSnapshotFields(
      "subscribed",
      makeTransaction({ signedDate: 1_700_000_000_000 }),
      null,
    );
    const olderResult = await actual.applyAppleSnapshot(realService as never, {
      payerId: PAYER_ID,
      ...olderFields,
    });
    expect(olderResult).toEqual({ applied: false, reason: "stale" });
    const afterOlder = storedRow as unknown as { last_signed_date: string };
    expect(afterOlder.last_signed_date).toBe(new Date(1_900_000_000_000).toISOString());
  });
});
