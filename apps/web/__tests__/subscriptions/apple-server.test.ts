/**
 * Unit tests for the ONE module that imports `@apple/app-store-server-library`
 * (FV-571, product-strategist scope fence): `apps/web/lib/subscriptions/apple-server.ts`.
 *
 * Covers:
 *   - the server-only guard (source-text assertion — the scope-fence
 *     condition product-strategist required)
 *   - the verify-both-environments fallback (record Section 4.9): Production
 *     tried first, Sandbox retried ONLY on INVALID_ENVIRONMENT
 *   - decode mapping (SDK payload -> plain DB-shaped types), including the
 *     AutoRenewStatus numeric -> boolean mapping
 *   - notification decoding, including the nested transaction/renewal
 *     re-verification
 *   - getAllSubscriptionStatuses (reconciliation), fully mocked
 *
 * `@apple/app-store-server-library` and `node:fs` are mocked at the module
 * boundary — no real certs, no real network calls to Apple, ever.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mock @apple/app-store-server-library
//
// vi.mock(...) factories are hoisted above ALL top-level code in this file
// (including const declarations), so anything the factory closes over must
// be created via vi.hoisted() rather than a plain top-level const.
// ---------------------------------------------------------------------------

const {
  verifyAndDecodeTransactionMock,
  verifyAndDecodeRenewalInfoMock,
  verifyAndDecodeNotificationMock,
  getAllSubscriptionStatusesMock,
  signedDataVerifierCtorMock,
  apiClientCtorMock,
  FakeVerificationException,
  FakeVerificationStatus,
} = vi.hoisted(() => {
  class FakeVerificationExceptionImpl extends Error {
    status: number;
    constructor(status: number) {
      super(`VerificationException(${status})`);
      this.status = status;
    }
  }
  return {
    verifyAndDecodeTransactionMock: vi.fn(),
    verifyAndDecodeRenewalInfoMock: vi.fn(),
    verifyAndDecodeNotificationMock: vi.fn(),
    getAllSubscriptionStatusesMock: vi.fn(),
    signedDataVerifierCtorMock: vi.fn(),
    apiClientCtorMock: vi.fn(),
    FakeVerificationException: FakeVerificationExceptionImpl,
    FakeVerificationStatus: {
      OK: 0,
      VERIFICATION_FAILURE: 1,
      RETRYABLE_VERIFICATION_FAILURE: 2,
      INVALID_APP_IDENTIFIER: 3,
      INVALID_ENVIRONMENT: 4,
      INVALID_CHAIN_LENGTH: 5,
      INVALID_CERTIFICATE: 6,
      FAILURE: 7,
    },
  };
});

vi.mock("@apple/app-store-server-library", () => ({
  Environment: {
    SANDBOX: "Sandbox",
    PRODUCTION: "Production",
    XCODE: "Xcode",
    LOCAL_TESTING: "LocalTesting",
  },
  VerificationStatus: FakeVerificationStatus,
  VerificationException: FakeVerificationException,
  // Regular `function` expressions (NOT arrow functions) — the module under
  // test calls these with `new`, and an arrow function can never be a valid
  // constructor even when wrapped in vi.fn().mockImplementation(...).
  SignedDataVerifier: vi.fn().mockImplementation(function (...args: unknown[]) {
    signedDataVerifierCtorMock(...args);
    return {
      verifyAndDecodeTransaction: verifyAndDecodeTransactionMock,
      verifyAndDecodeRenewalInfo: verifyAndDecodeRenewalInfoMock,
      verifyAndDecodeNotification: verifyAndDecodeNotificationMock,
    };
  }),
  AppStoreServerAPIClient: vi.fn().mockImplementation(function (...args: unknown[]) {
    apiClientCtorMock(...args);
    return {
      getAllSubscriptionStatuses: getAllSubscriptionStatusesMock,
    };
  }),
}));

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(() => Buffer.from("fake-cert-or-key")),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import {
  verifySignedTransaction,
  verifySignedRenewalInfo,
  verifyAndDecodeNotification,
  getAllSubscriptionStatuses,
} from "@/lib/subscriptions/apple-server";

const TRANSACTION_JWS = "ey.fake.transaction";
const RENEWAL_JWS = "ey.fake.renewal";
const NOTIFICATION_JWS = "ey.fake.notification";

function makeSdkTransaction(overrides: Record<string, unknown> = {}) {
  return {
    originalTransactionId: "otid_1",
    transactionId: "txn_1",
    productId: "tier_1_1athlete",
    bundleId: "com.fromvictoryapp.app",
    expiresDate: 1_800_000_000_000,
    appAccountToken: "11111111-1111-4111-8111-111111111111",
    signedDate: 1_700_000_000_000,
    environment: "Production",
    revocationDate: undefined,
    ...overrides,
  };
}

function makeSdkRenewal(overrides: Record<string, unknown> = {}) {
  return {
    originalTransactionId: "otid_1",
    autoRenewStatus: 1,
    gracePeriodExpiresDate: undefined,
    signedDate: 1_700_000_000_000,
    environment: "Production",
    appAccountToken: "11111111-1111-4111-8111-111111111111",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.APPLE_BUNDLE_ID = "com.fromvictoryapp.app";
  process.env.APPLE_APP_APPLE_ID = "123456789";
  process.env.APPLE_ROOT_CA_PATHS = "/fake/root1.cer,/fake/root2.cer";
  process.env.APPLE_IAP_SIGNING_KEY_PATH = "/fake/signing-key.p8";
  process.env.APPLE_IAP_KEY_ID = "KEYID123";
  process.env.APPLE_IAP_ISSUER_ID = "issuer-123";
});

// ---------------------------------------------------------------------------
// Server-only guard
// ---------------------------------------------------------------------------

describe("server-only guard", () => {
  it("apple-server.ts carries the server-only import (the ONLY module allowed to import @apple/app-store-server-library)", async () => {
    // node:fs is mocked module-wide above (so the module under test never
    // touches the real filesystem) — bypass that mock for this one read via
    // vi.importActual, so we assert against the REAL source text on disk.
    const realFs = await vi.importActual<typeof import("node:fs")>("node:fs");
    const source = realFs.readFileSync(
      new URL("../../lib/subscriptions/apple-server.ts", import.meta.url),
      "utf8",
    );
    const serverOnlyIndex = source.indexOf('import "server-only";');
    const appleImportIndex = source.indexOf('"@apple/app-store-server-library"');
    expect(serverOnlyIndex).toBeGreaterThan(-1);
    expect(appleImportIndex).toBeGreaterThan(-1);
    // The server-only guard must precede the Apple SDK import.
    expect(serverOnlyIndex).toBeLessThan(appleImportIndex);
  });

  it("no other file in lib/subscriptions or lib/actions imports @apple/app-store-server-library", async () => {
    const realFs = await vi.importActual<typeof import("node:fs")>("node:fs");
    const realPath = await vi.importActual<typeof import("node:path")>("node:path");
    const dirs = ["../../lib/subscriptions", "../../lib/actions"].map((d) =>
      realPath.resolve(new URL(d, import.meta.url).pathname),
    );
    const offenders: string[] = [];
    for (const dir of dirs) {
      for (const entry of realFs.readdirSync(dir)) {
        if (!entry.endsWith(".ts") || entry === "apple-server.ts") continue;
        const full = realPath.join(dir, entry);
        const text = realFs.readFileSync(full, "utf8");
        // Match an actual import/require specifier, not a doc-comment
        // mention of the package name (apple-lifecycle.ts's header comment
        // explicitly documents that it does NOT import the SDK).
        if (/from\s+["']@apple\/app-store-server-library["']|require\(\s*["']@apple\/app-store-server-library["']\s*\)/.test(text)) {
          offenders.push(full);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// verifySignedTransaction — verify-both-environments fallback
// ---------------------------------------------------------------------------

describe("verifySignedTransaction", () => {
  it("verifies against Production and decodes the payload", async () => {
    verifyAndDecodeTransactionMock.mockResolvedValueOnce(makeSdkTransaction());

    const result = await verifySignedTransaction(TRANSACTION_JWS);

    expect(result.originalTransactionId).toBe("otid_1");
    expect(result.environment).toBe("Production");
    expect(result.appAccountToken).toBe("11111111-1111-4111-8111-111111111111");
    expect(verifyAndDecodeTransactionMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to Sandbox ONLY on INVALID_ENVIRONMENT (record Section 4.9)", async () => {
    verifyAndDecodeTransactionMock
      .mockRejectedValueOnce(
        new FakeVerificationException(FakeVerificationStatus.INVALID_ENVIRONMENT),
      )
      .mockResolvedValueOnce(makeSdkTransaction({ environment: "Sandbox" }));

    const result = await verifySignedTransaction(TRANSACTION_JWS);

    expect(result.environment).toBe("Sandbox");
    expect(verifyAndDecodeTransactionMock).toHaveBeenCalledTimes(2);
  });

  it("propagates a non-INVALID_ENVIRONMENT verification failure WITHOUT a Sandbox retry", async () => {
    verifyAndDecodeTransactionMock.mockRejectedValueOnce(
      new FakeVerificationException(FakeVerificationStatus.VERIFICATION_FAILURE),
    );

    await expect(verifySignedTransaction(TRANSACTION_JWS)).rejects.toThrow(
      /VerificationException/,
    );
    expect(verifyAndDecodeTransactionMock).toHaveBeenCalledTimes(1);
  });

  it("throws when the verified payload is missing required fields", async () => {
    verifyAndDecodeTransactionMock.mockResolvedValueOnce(
      makeSdkTransaction({ expiresDate: undefined }),
    );

    await expect(verifySignedTransaction(TRANSACTION_JWS)).rejects.toThrow(
      /missing required fields/,
    );
  });
});

// ---------------------------------------------------------------------------
// verifySignedRenewalInfo
// ---------------------------------------------------------------------------

describe("verifySignedRenewalInfo", () => {
  it("maps AutoRenewStatus 1 -> true", async () => {
    verifyAndDecodeRenewalInfoMock.mockResolvedValueOnce(makeSdkRenewal({ autoRenewStatus: 1 }));
    const result = await verifySignedRenewalInfo(RENEWAL_JWS);
    expect(result.autoRenewStatus).toBe(true);
  });

  it("maps AutoRenewStatus 0 -> false", async () => {
    verifyAndDecodeRenewalInfoMock.mockResolvedValueOnce(makeSdkRenewal({ autoRenewStatus: 0 }));
    const result = await verifySignedRenewalInfo(RENEWAL_JWS);
    expect(result.autoRenewStatus).toBe(false);
  });

  it("passes through gracePeriodExpiresDate when present", async () => {
    verifyAndDecodeRenewalInfoMock.mockResolvedValueOnce(
      makeSdkRenewal({ gracePeriodExpiresDate: 1_750_000_000_000 }),
    );
    const result = await verifySignedRenewalInfo(RENEWAL_JWS);
    expect(result.gracePeriodExpiresDate).toBe(1_750_000_000_000);
  });
});

// ---------------------------------------------------------------------------
// verifyAndDecodeNotification — outer + nested verification
// ---------------------------------------------------------------------------

describe("verifyAndDecodeNotification", () => {
  it("decodes the envelope and verifies the nested transaction + renewal JWS", async () => {
    verifyAndDecodeNotificationMock.mockResolvedValueOnce({
      notificationType: "DID_RENEW",
      subtype: undefined,
      notificationUUID: "uuid-1",
      signedDate: 1_700_000_000_500,
      data: {
        environment: "Production",
        signedTransactionInfo: TRANSACTION_JWS,
        signedRenewalInfo: RENEWAL_JWS,
      },
    });
    verifyAndDecodeTransactionMock.mockResolvedValueOnce(makeSdkTransaction());
    verifyAndDecodeRenewalInfoMock.mockResolvedValueOnce(makeSdkRenewal());

    const result = await verifyAndDecodeNotification(NOTIFICATION_JWS);

    expect(result.notificationType).toBe("DID_RENEW");
    expect(result.environment).toBe("Production");
    expect(result.transaction?.originalTransactionId).toBe("otid_1");
    expect(result.renewal?.autoRenewStatus).toBe(true);
  });

  it("returns null transaction/renewal when the notification carries neither", async () => {
    verifyAndDecodeNotificationMock.mockResolvedValueOnce({
      notificationType: "TEST",
      subtype: undefined,
      notificationUUID: "uuid-2",
      signedDate: 1_700_000_000_500,
      data: { environment: "Production" },
    });

    const result = await verifyAndDecodeNotification(NOTIFICATION_JWS);

    expect(result.transaction).toBeNull();
    expect(result.renewal).toBeNull();
  });

  it("propagates a verification failure on the OUTER envelope", async () => {
    verifyAndDecodeNotificationMock.mockRejectedValueOnce(
      new FakeVerificationException(FakeVerificationStatus.VERIFICATION_FAILURE),
    );

    await expect(verifyAndDecodeNotification(NOTIFICATION_JWS)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getAllSubscriptionStatuses — reconciliation
// ---------------------------------------------------------------------------

describe("getAllSubscriptionStatuses", () => {
  it("verifies + decodes every lastTransactionsItem across all groups", async () => {
    getAllSubscriptionStatusesMock.mockResolvedValueOnce({
      environment: "Production",
      data: [
        {
          subscriptionGroupIdentifier: "group_1",
          lastTransactions: [
            {
              status: 1,
              originalTransactionId: "otid_1",
              signedTransactionInfo: TRANSACTION_JWS,
              signedRenewalInfo: RENEWAL_JWS,
            },
          ],
        },
      ],
    });
    verifyAndDecodeTransactionMock.mockResolvedValueOnce(makeSdkTransaction());
    verifyAndDecodeRenewalInfoMock.mockResolvedValueOnce(makeSdkRenewal());

    const items = await getAllSubscriptionStatuses("otid_1", "Production");

    expect(items).toHaveLength(1);
    expect(items[0]?.status).toBe(1);
    expect(items[0]?.transaction.originalTransactionId).toBe("otid_1");
    expect(items[0]?.renewal?.autoRenewStatus).toBe(true);
  });

  it("skips items with no signedTransactionInfo", async () => {
    getAllSubscriptionStatusesMock.mockResolvedValueOnce({
      environment: "Production",
      data: [
        {
          subscriptionGroupIdentifier: "group_1",
          lastTransactions: [{ status: 2 }],
        },
      ],
    });

    const items = await getAllSubscriptionStatuses("otid_1", "Production");
    expect(items).toHaveLength(0);
  });
});
