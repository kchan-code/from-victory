import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const { verifyAndDecodeNotificationMock, describeVerificationFailureMock } = vi.hoisted(() => ({
  verifyAndDecodeNotificationMock: vi.fn(),
  describeVerificationFailureMock: vi.fn((err: unknown) =>
    err instanceof Error ? err.message : String(err),
  ),
}));

vi.mock("@/lib/subscriptions/apple-server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/subscriptions/apple-server")>(
    "@/lib/subscriptions/apple-server",
  );
  return {
    ...actual,
    verifyAndDecodeNotification: (...args: unknown[]) => verifyAndDecodeNotificationMock(...args),
    describeVerificationFailure: (...args: unknown[]) => describeVerificationFailureMock(...args),
  };
});

vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: vi.fn(async () => {}),
}));
vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: (p: Promise<unknown>) => {
    void p;
  },
}));

import { POST } from "@/app/api/webhooks/apple/route";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/types";
import type { DecodedNotification, DecodedRenewalInfo, DecodedTransactionInfo } from "@/lib/subscriptions/apple-server";

const hasDbEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const describeDb = hasDbEnv ? describe : describe.skip;

const PAYER_ID = "10000000-0000-4000-8000-000000000001";
const APP_ACCOUNT_TOKEN = "11111111-1111-4111-8111-111111111111";
const ENVIRONMENT = "Production";
const APPLE_OTID = "fv713-db-webhook-otid";
const PRODUCT_ID = "fv.test.tier1.monthly";
const EXPIRES_AT_ISO = "2028-01-01T00:00:00.000Z";
const GRACE_EXPIRES_AT_ISO = "2028-01-02T00:00:00.000Z";

type AppleSubscriptionRow = Database["public"]["Tables"]["apple_subscriptions"]["Row"];

function makeRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

function makeTransaction(
  overrides: Partial<DecodedTransactionInfo> = {},
): DecodedTransactionInfo {
  return {
    originalTransactionId: APPLE_OTID,
    transactionId: "fv713-db-webhook-txn",
    productId: PRODUCT_ID,
    bundleId: "com.fromvictoryapp.app",
    expiresDate: Date.parse(EXPIRES_AT_ISO),
    appAccountToken: APP_ACCOUNT_TOKEN,
    signedDate: 1_800_000_000_000,
    environment: ENVIRONMENT,
    revocationDate: null,
    revocationReason: null,
    ...overrides,
  };
}

function makeRenewal(
  overrides: Partial<DecodedRenewalInfo> = {},
): DecodedRenewalInfo {
  return {
    originalTransactionId: APPLE_OTID,
    autoRenewStatus: true,
    gracePeriodExpiresDate: Date.parse(GRACE_EXPIRES_AT_ISO),
    signedDate: 1_800_000_000_000,
    environment: ENVIRONMENT,
    appAccountToken: APP_ACCOUNT_TOKEN,
    autoRenewProductId: null,
    ...overrides,
  };
}

function makeNotification(
  overrides: Partial<DecodedNotification> = {},
): DecodedNotification {
  const transaction = makeTransaction();
  return {
    notificationType: "DID_RENEW",
    subtype: null,
    notificationUUID: "fv713-db-notification",
    signedDate: transaction.signedDate,
    environment: transaction.environment,
    transaction,
    renewal: null,
    ...overrides,
  };
}

async function clearAppleRow() {
  const service = createServiceClient();
  const { error } = await service
    .from("apple_subscriptions")
    .delete()
    .eq("payer_id", PAYER_ID)
    .eq("environment", ENVIRONMENT)
    .eq("original_transaction_id", APPLE_OTID);
  if (error) {
    throw new Error(`test setup cleanup failed: ${error.message}`);
  }
}

async function seedAppleRow(
  row: Database["public"]["Tables"]["apple_subscriptions"]["Insert"],
) {
  const service = createServiceClient();
  const { error } = await service.from("apple_subscriptions").insert(row);
  if (error) {
    throw new Error(`test setup seed failed: ${error.message}`);
  }
}

async function readAppleRow(): Promise<AppleSubscriptionRow> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("apple_subscriptions")
    .select("*")
    .eq("payer_id", PAYER_ID)
    .eq("environment", ENVIRONMENT)
    .eq("original_transaction_id", APPLE_OTID)
    .maybeSingle();
  if (error) {
    throw new Error(`test read failed: ${error.message}`);
  }
  if (!data) {
    throw new Error("expected apple_subscriptions row to exist");
  }
  return data;
}

describeDb("POST /api/webhooks/apple (DB-backed)", () => {
  beforeEach(async () => {
    verifyAndDecodeNotificationMock.mockReset();
    describeVerificationFailureMock.mockClear();
    await clearAppleRow();
  });

  afterAll(async () => {
    await clearAppleRow();
  });

  it("REFUND_REVERSED restores revoked row to subscribed and advances last_signed_date", async () => {
    const oldSignedIso = new Date(1_700_000_000_000).toISOString();
    await seedAppleRow({
      payer_id: PAYER_ID,
      environment: ENVIRONMENT,
      original_transaction_id: APPLE_OTID,
      product_id: PRODUCT_ID,
      status: "revoked",
      expires_at: EXPIRES_AT_ISO,
      grace_period_expires_at: null,
      auto_renew_status: false,
      auto_renew_product_id: null,
      app_account_token: APP_ACCOUNT_TOKEN,
      last_signed_date: oldSignedIso,
    });

    verifyAndDecodeNotificationMock.mockResolvedValueOnce(
      makeNotification({
        notificationType: "REFUND_REVERSED",
        transaction: makeTransaction({ signedDate: 1_800_000_000_000 }),
      }),
    );

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));
    expect(res.status).toBe(200);

    const row = await readAppleRow();
    expect(row.status).toBe("subscribed");
    expect(Date.parse(row.last_signed_date)).toBe(1_800_000_000_000);
    expect(Date.parse(row.last_signed_date)).toBeGreaterThan(Date.parse(oldSignedIso));
  });

  it("DID_CHANGE_RENEWAL_STATUS on in_grace_period updates only auto_renew_status + last_signed_date", async () => {
    const oldSignedIso = new Date(1_700_000_000_000).toISOString();
    await seedAppleRow({
      payer_id: PAYER_ID,
      environment: ENVIRONMENT,
      original_transaction_id: APPLE_OTID,
      product_id: PRODUCT_ID,
      status: "in_grace_period",
      expires_at: EXPIRES_AT_ISO,
      grace_period_expires_at: GRACE_EXPIRES_AT_ISO,
      auto_renew_status: true,
      auto_renew_product_id: null,
      app_account_token: APP_ACCOUNT_TOKEN,
      last_signed_date: oldSignedIso,
    });

    verifyAndDecodeNotificationMock.mockResolvedValueOnce(
      makeNotification({
        notificationType: "DID_CHANGE_RENEWAL_STATUS",
        subtype: "AUTO_RENEW_DISABLED",
        transaction: makeTransaction({ signedDate: 1_800_000_000_000 }),
        renewal: makeRenewal({ autoRenewStatus: false, signedDate: 1_800_000_000_000 }),
      }),
    );

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));
    expect(res.status).toBe(200);

    const row = await readAppleRow();
    expect(row.status).toBe("in_grace_period");
    expect(row.product_id).toBe(PRODUCT_ID);
    expect(row.expires_at).toBe(EXPIRES_AT_ISO);
    expect(row.grace_period_expires_at).toBe(GRACE_EXPIRES_AT_ISO);
    expect(row.auto_renew_status).toBe(false);
    expect(Date.parse(row.last_signed_date)).toBe(1_800_000_000_000);
    expect(Date.parse(row.last_signed_date)).toBeGreaterThan(Date.parse(oldSignedIso));
  });

  it("stale DID_CHANGE_RENEWAL_STATUS (older signedDate) changes nothing", async () => {
    const storedSignedIso = new Date(1_900_000_000_000).toISOString();
    await seedAppleRow({
      payer_id: PAYER_ID,
      environment: ENVIRONMENT,
      original_transaction_id: APPLE_OTID,
      product_id: PRODUCT_ID,
      status: "in_grace_period",
      expires_at: EXPIRES_AT_ISO,
      grace_period_expires_at: GRACE_EXPIRES_AT_ISO,
      auto_renew_status: true,
      auto_renew_product_id: null,
      app_account_token: APP_ACCOUNT_TOKEN,
      last_signed_date: storedSignedIso,
    });

    verifyAndDecodeNotificationMock.mockResolvedValueOnce(
      makeNotification({
        notificationType: "DID_CHANGE_RENEWAL_STATUS",
        subtype: "AUTO_RENEW_DISABLED",
        transaction: makeTransaction({ signedDate: 1_800_000_000_000 }),
        renewal: makeRenewal({ autoRenewStatus: false, signedDate: 1_800_000_000_000 }),
      }),
    );

    const res = await POST(makeRequest({ signedPayload: "ey.fake" }));
    expect(res.status).toBe(200);

    const row = await readAppleRow();
    expect(row.status).toBe("in_grace_period");
    expect(row.auto_renew_status).toBe(true);
    expect(row.last_signed_date).toBe(storedSignedIso);
    expect(row.grace_period_expires_at).toBe(GRACE_EXPIRES_AT_ISO);
  });
});
