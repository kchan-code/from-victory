/**
 * The ONE module that imports `@apple/app-store-server-library` (FV-571,
 * product-strategist scope fence). No other file in this codebase may import
 * that package — everything downstream (the purchase-submission action, the
 * Notifications V2 webhook, the reconciliation helper) calls through the
 * plain, DB-shaped types exported here instead of Apple's SDK types.
 *
 * `server-only` — this module signs no client bundle and must never be
 * imported from a Client Component.
 *
 * ENV IS READ LAZILY, INSIDE FUNCTIONS, NEVER AT MODULE TOP LEVEL — so this
 * module can be imported (and its pure helpers exercised) in a test process
 * with no APPLE_* env configured. The verifier/API-client instances are
 * built and cached on first real use only.
 *
 * Verify-both-environments fallback (docs/fv210-ios-iap-decision-record.md
 * Section 4.9): `SignedDataVerifier` is constructed against a SINGLE fixed
 * environment and throws `INVALID_ENVIRONMENT` if the decoded payload's
 * `environment` field doesn't match it. Because this backend must accept
 * BOTH Sandbox (TestFlight / App Review) and Production submissions from one
 * endpoint, every verify call tries the Production verifier first and falls
 * back to the Sandbox verifier only on an `INVALID_ENVIRONMENT` failure —
 * Apple's own documented pattern for this exact situation. This fallback
 * determines WHICH environment signed the payload; it is never used to grant
 * access — the environment wall (Production-only unless allowlisted) is
 * enforced entirely by application code in `lib/actions/apple-subscription.ts`
 * and the Notifications V2 webhook, reading the VERIFIED payload's own
 * `environment` field.
 *
 * Root-CA certificate loading: configurable via `APPLE_ROOT_CA_PATHS` (a
 * comma-separated list of absolute file paths to DER-encoded Apple root CA
 * certificates). This module only reads whatever is configured — it does not
 * fetch, embed, or rotate certificates itself. CA acquisition and rotation is
 * FV-573's runbook item.
 */
import "server-only";

import { readFileSync } from "node:fs";

import {
  SignedDataVerifier,
  VerificationException,
  VerificationStatus,
  Environment,
  AppStoreServerAPIClient,
  type JWSTransactionDecodedPayload,
  type JWSRenewalInfoDecodedPayload,
  type ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";

// ---------------------------------------------------------------------------
// Plain, DB-shaped return types — deliberately NOT re-exports of the Apple
// SDK's own interfaces, so no downstream file needs to reference SDK types
// (keeps the "only this file touches the SDK" boundary crisp even in the
// type system, not just at runtime).
// ---------------------------------------------------------------------------

export type AppleEnvironment = "Sandbox" | "Production";

export interface DecodedTransactionInfo {
  originalTransactionId: string;
  transactionId: string;
  productId: string;
  bundleId: string;
  /** UNIX ms — transactionInfo.expiresDate. */
  expiresDate: number;
  /** The opaque per-payer purchase UUID, or null if absent on this payload. */
  appAccountToken: string | null;
  /** UNIX ms — transactionInfo.signedDate. The payload-staleness watermark. */
  signedDate: number;
  environment: AppleEnvironment;
  /** UNIX ms, or null if not revoked. */
  revocationDate: number | null;
  /** Apple's `RevocationReason` enum (0|1), or null if the transaction isn't
   *  revoked. Apple's docs describe this as accompanying `revocationDate` on
   *  a refund; it is a defensive companion signal only — FV-571's
   *  action-path status derivation (./apple-lifecycle's
   *  `deriveActionSubmissionStatus`) treats EITHER field being non-null as
   *  sufficient evidence of a revoked transaction, since `0` (
   *  REFUNDED_FOR_OTHER_REASON) is a valid-but-falsy enum value that must
   *  not be mistaken for "absent". */
  revocationReason: number | null;
}

export interface DecodedRenewalInfo {
  originalTransactionId: string;
  autoRenewStatus: boolean;
  /** UNIX ms, or null (populated only while Apple has the account in grace). */
  gracePeriodExpiresDate: number | null;
  /** UNIX ms — renewalInfo.signedDate. */
  signedDate: number;
  environment: AppleEnvironment;
  appAccountToken: string | null;
}

export interface DecodedNotification {
  notificationType: string;
  subtype: string | null;
  notificationUUID: string;
  /** UNIX ms — the notification envelope's own signedDate. */
  signedDate: number;
  environment: AppleEnvironment | null;
  /** Verified + decoded, following data.signedTransactionInfo, if present. */
  transaction: DecodedTransactionInfo | null;
  /** Verified + decoded, following data.signedRenewalInfo, if present. */
  renewal: DecodedRenewalInfo | null;
}

export interface ReconciledSubscriptionItem {
  /** Apple's raw numeric Status enum (1=ACTIVE .. 5=REVOKED) — mapped to our
   *  vocabulary by `mapAppleStatusEnum` in ./apple-lifecycle. */
  status: number;
  transaction: DecodedTransactionInfo;
  renewal: DecodedRenewalInfo | null;
}

// ---------------------------------------------------------------------------
// Env helpers — read lazily, inside functions only.
// ---------------------------------------------------------------------------

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[subscriptions/apple-server] ${name} is not configured. Set this env var before accepting Apple purchases (see FV-573's runbook).`,
    );
  }
  return value;
}

function loadRootCertificates(): Buffer[] {
  const raw = requiredEnv("APPLE_ROOT_CA_PATHS");
  const paths = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (paths.length === 0) {
    throw new Error(
      "[subscriptions/apple-server] APPLE_ROOT_CA_PATHS is set but contains no paths.",
    );
  }
  return paths.map((p) => readFileSync(p));
}

function toDbEnvironment(env: string | undefined): AppleEnvironment {
  if (env === "Sandbox" || env === "Production") return env;
  throw new Error(
    `[subscriptions/apple-server] Unexpected environment "${String(env)}" on a verified payload.`,
  );
}

// ---------------------------------------------------------------------------
// SignedDataVerifier — lazily constructed, cached per environment.
// ---------------------------------------------------------------------------

let productionVerifier: SignedDataVerifier | null = null;
let sandboxVerifier: SignedDataVerifier | null = null;

function buildVerifier(environment: Environment): SignedDataVerifier {
  const bundleId = requiredEnv("APPLE_BUNDLE_ID");
  const roots = loadRootCertificates();
  // appAppleId is required by the SDK when environment === PRODUCTION, and
  // omitted (undefined) for Sandbox — mirrors the SDK's own constructor
  // contract (it throws if PRODUCTION + no appAppleId).
  const appAppleId =
    environment === Environment.PRODUCTION
      ? Number(requiredEnv("APPLE_APP_APPLE_ID"))
      : undefined;
  return new SignedDataVerifier(roots, true, environment, bundleId, appAppleId);
}

function getProductionVerifier(): SignedDataVerifier {
  if (!productionVerifier) productionVerifier = buildVerifier(Environment.PRODUCTION);
  return productionVerifier;
}

function getSandboxVerifier(): SignedDataVerifier {
  if (!sandboxVerifier) sandboxVerifier = buildVerifier(Environment.SANDBOX);
  return sandboxVerifier;
}

function isInvalidEnvironment(err: unknown): boolean {
  return (
    err instanceof VerificationException &&
    err.status === VerificationStatus.INVALID_ENVIRONMENT
  );
}

/**
 * Verify-both-environments fallback — see file header. Tries Production
 * first; on `INVALID_ENVIRONMENT` only, retries against Sandbox. Any other
 * verification failure (bad signature, wrong bundle id, expired cert chain,
 * malformed JWS, …) propagates immediately without a Sandbox retry.
 */
async function verifyWithFallback<T>(
  verify: (verifier: SignedDataVerifier) => Promise<T>,
): Promise<T> {
  try {
    return await verify(getProductionVerifier());
  } catch (err) {
    if (isInvalidEnvironment(err)) {
      return verify(getSandboxVerifier());
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Decoding helpers — SDK payload -> plain DB-shaped types.
// ---------------------------------------------------------------------------

function toDecodedTransaction(
  decoded: JWSTransactionDecodedPayload,
): DecodedTransactionInfo {
  if (!decoded.originalTransactionId || !decoded.productId || decoded.expiresDate === undefined || decoded.signedDate === undefined) {
    throw new Error(
      "[subscriptions/apple-server] Verified transaction payload is missing required fields.",
    );
  }
  return {
    originalTransactionId: decoded.originalTransactionId,
    transactionId: decoded.transactionId ?? decoded.originalTransactionId,
    productId: decoded.productId,
    bundleId: decoded.bundleId ?? "",
    expiresDate: decoded.expiresDate,
    appAccountToken: decoded.appAccountToken ?? null,
    signedDate: decoded.signedDate,
    environment: toDbEnvironment(decoded.environment as string | undefined),
    revocationDate: decoded.revocationDate ?? null,
    revocationReason:
      decoded.revocationReason === undefined ? null : Number(decoded.revocationReason),
  };
}

function toDecodedRenewal(
  decoded: JWSRenewalInfoDecodedPayload,
): DecodedRenewalInfo {
  if (!decoded.originalTransactionId || decoded.signedDate === undefined) {
    throw new Error(
      "[subscriptions/apple-server] Verified renewal payload is missing required fields.",
    );
  }
  return {
    originalTransactionId: decoded.originalTransactionId,
    // AutoRenewStatus.ON === 1, .OFF === 0 (numeric SDK enum).
    autoRenewStatus: decoded.autoRenewStatus === 1,
    gracePeriodExpiresDate: decoded.gracePeriodExpiresDate ?? null,
    signedDate: decoded.signedDate,
    environment: toDbEnvironment(decoded.environment as string | undefined),
    appAccountToken: decoded.appAccountToken ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public verification API
// ---------------------------------------------------------------------------

/**
 * Verifies + decodes a signedTransactionInfo JWS (from a client purchase
 * submission, a Notifications V2 payload, or the Get All Subscription
 * Statuses API). Throws on any verification failure — callers must never log
 * the raw JWS string, only the thrown error's message (which carries no
 * payload content, just a verification-status code/description).
 */
export async function verifySignedTransaction(
  signedTransactionInfo: string,
): Promise<DecodedTransactionInfo> {
  const decoded = await verifyWithFallback((v) =>
    v.verifyAndDecodeTransaction(signedTransactionInfo),
  );
  return toDecodedTransaction(decoded);
}

/** Verifies + decodes a signedRenewalInfo JWS. Throws on verification failure. */
export async function verifySignedRenewalInfo(
  signedRenewalInfo: string,
): Promise<DecodedRenewalInfo> {
  const decoded = await verifyWithFallback((v) =>
    v.verifyAndDecodeRenewalInfo(signedRenewalInfo),
  );
  return toDecodedRenewal(decoded);
}

/**
 * Verifies + decodes an App Store Server Notifications V2 `signedPayload`.
 * Also verifies the nested `data.signedTransactionInfo` /
 * `data.signedRenewalInfo` JWS strings (each independently signed) so the
 * caller receives fully-verified transaction/renewal snapshots, not merely
 * the outer envelope. Throws on ANY verification failure (outer or nested).
 */
export async function verifyAndDecodeNotification(
  signedPayload: string,
): Promise<DecodedNotification> {
  const decoded: ResponseBodyV2DecodedPayload = await verifyWithFallback((v) =>
    v.verifyAndDecodeNotification(signedPayload),
  );

  const transactionJws = decoded.data?.signedTransactionInfo ?? null;
  const renewalJws = decoded.data?.signedRenewalInfo ?? null;

  const transaction = transactionJws
    ? await verifySignedTransaction(transactionJws)
    : null;
  const renewal = renewalJws ? await verifySignedRenewalInfo(renewalJws) : null;

  const rawEnvironment = decoded.data?.environment as string | undefined;

  return {
    notificationType: decoded.notificationType ?? "",
    subtype: decoded.subtype ?? null,
    notificationUUID: decoded.notificationUUID ?? "",
    signedDate: decoded.signedDate ?? Date.now(),
    environment:
      rawEnvironment === "Sandbox" || rawEnvironment === "Production"
        ? rawEnvironment
        : null,
    transaction,
    renewal,
  };
}

// ---------------------------------------------------------------------------
// App Store Server API client — reconciliation only (Get All Subscription
// Statuses). Separate credential set from the verifier (a private-key-signed
// JWT bearer token, not root-cert verification).
// ---------------------------------------------------------------------------

let productionApiClient: AppStoreServerAPIClient | null = null;
let sandboxApiClient: AppStoreServerAPIClient | null = null;

function buildApiClient(environment: Environment): AppStoreServerAPIClient {
  const signingKeyPath = requiredEnv("APPLE_IAP_SIGNING_KEY_PATH");
  const signingKey = readFileSync(signingKeyPath, "utf8");
  const keyId = requiredEnv("APPLE_IAP_KEY_ID");
  const issuerId = requiredEnv("APPLE_IAP_ISSUER_ID");
  const bundleId = requiredEnv("APPLE_BUNDLE_ID");
  return new AppStoreServerAPIClient(signingKey, keyId, issuerId, bundleId, environment);
}

function getApiClient(environment: AppleEnvironment): AppStoreServerAPIClient {
  if (environment === "Production") {
    if (!productionApiClient) productionApiClient = buildApiClient(Environment.PRODUCTION);
    return productionApiClient;
  }
  if (!sandboxApiClient) sandboxApiClient = buildApiClient(Environment.SANDBOX);
  return sandboxApiClient;
}

/**
 * Calls Apple's "Get All Subscription Statuses" endpoint for the given
 * transaction id and verifies + decodes every returned lastTransactionsItem.
 * Used by the reconciliation helper (./apple-lifecycle's
 * `reconcileAppleSubscription`) for drift repair. Not a cron in this slice —
 * on-demand only (FV-573 owns the recovery runbook).
 */
export async function getAllSubscriptionStatuses(
  anyTransactionId: string,
  environment: AppleEnvironment,
): Promise<ReconciledSubscriptionItem[]> {
  const client = getApiClient(environment);
  const response = await client.getAllSubscriptionStatuses(anyTransactionId);

  const items: ReconciledSubscriptionItem[] = [];
  for (const group of response.data ?? []) {
    for (const last of group.lastTransactions ?? []) {
      if (!last.signedTransactionInfo) continue;
      const transaction = await verifySignedTransaction(last.signedTransactionInfo);
      const renewal = last.signedRenewalInfo
        ? await verifySignedRenewalInfo(last.signedRenewalInfo)
        : null;
      const status =
        typeof last.status === "number" ? last.status : Number(last.status);
      items.push({ status, transaction, renewal });
    }
  }
  return items;
}
