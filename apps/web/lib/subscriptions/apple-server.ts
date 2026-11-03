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
 * Verify-both-environments strategy (docs/fv210-ios-iap-decision-record.md
 * Section 4.9): `SignedDataVerifier` is constructed against a SINGLE fixed
 * environment. Because this backend must accept BOTH Sandbox (TestFlight /
 * App Review) and Production submissions from one endpoint, two DIFFERENT
 * strategies are used depending on payload shape:
 *
 *   - Transactions and renewal-info JWS (`verifySignedTransaction`,
 *     `verifySignedRenewalInfo`): try the Production verifier first and fall
 *     back to the Sandbox verifier only on an `INVALID_ENVIRONMENT` failure
 *     (`verifyWithFallback`, below) — Apple's own documented pattern. These
 *     payloads carry no `appAppleId` check, so `INVALID_ENVIRONMENT` really is
 *     the only failure mode a wrong-environment verifier produces.
 *
 *   - App Store Server Notifications V2 (`verifyAndDecodeNotification`): the
 *     SDK checks bundleId and (Production-verifier only) `appAppleId` BEFORE
 *     it checks environment. A Sandbox notification carries no `appAppleId`,
 *     so running it through the Production-first fallback above throws
 *     `INVALID_APP_IDENTIFIER` (status 3) — never `INVALID_ENVIRONMENT` — and
 *     the fallback to Sandbox never triggers. Every real Sandbox App Store
 *     Server Notification was rejected with HTTP 400 as a result (proven with
 *     a real Apple-signed Sandbox TEST notification, FV-598, 2026-09-22).
 *     Fix: `peekNotificationEnvironment` reads the payload's OWN `environment`
 *     claim WITHOUT verifying it first, purely to pick which single verifier
 *     to run — a selection hint, not a trust decision. The chosen verifier
 *     then does the real work in one pass: it verifies the signature AND
 *     re-checks that SAME environment claim (plus bundleId) after signature
 *     verification succeeds, so a forged or mismatched claim is rejected by
 *     the verifier itself, never by the peek. A malformed/unparseable payload
 *     defaults the peek to Production, where it fails the verifier's own
 *     signature or identifier check like any other bad payload.
 *
 * Neither fallback is ever used to grant access — the environment wall
 * (Production-only unless allowlisted) is enforced entirely by application
 * code in `lib/actions/apple-subscription.ts` and the Notifications V2
 * webhook, reading the VERIFIED payload's own `environment` field.
 *
 * Root-CA certificate loading (FV-603): two supported sources, checked in
 * this precedence order —
 *
 *   1. `APPLE_ROOT_CA_BASE64` — a comma-separated list of base64-encoded
 *      DER Apple root CA certificates, decoded in-process. This is what
 *      PRODUCTION uses (Vercel's serverless functions have no bundled
 *      certificate files on disk to read at runtime).
 *   2. `APPLE_ROOT_CA_PATHS` — a comma-separated list of absolute file
 *      paths to DER-encoded Apple root CA certificates, read via
 *      `readFileSync`. This is what BETA/LOCAL DEV use, where the certs
 *      live on the filesystem.
 *
 * If `APPLE_ROOT_CA_BASE64` is set to a non-empty (post-trim) value it wins
 * outright — `APPLE_ROOT_CA_PATHS` is never consulted, even if also set. If
 * neither is set, `loadRootCertificates` throws the same clear
 * "not configured" error as any other required env var.
 *
 * This module only reads whatever is configured — it does not fetch, embed,
 * or rotate certificates itself. CA acquisition and rotation is FV-573's
 * runbook item.
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
  /** The product id this subscription will renew INTO at its next renewal
   *  (Apple: renewalInfo.autoRenewProductId), or null when the payload
   *  doesn't carry one — which per Apple's docs means "no scheduled
   *  product change" (renewing into the same product). FV-602: the
   *  SCHEDULED (not-yet-effective) signal for a DID_CHANGE_RENEWAL_PREF
   *  DOWNGRADE. */
  autoRenewProductId: string | null;
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

/**
 * Decodes one `APPLE_ROOT_CA_BASE64` list entry into a DER certificate
 * `Buffer`, rejecting anything that isn't plausibly a real certificate:
 * empty (post-trim), non-base64 characters, or a decoded length too small
 * to be a real DER-encoded X.509 certificate (Apple's root CAs are several
 * hundred bytes to ~1.5KB; 100 bytes is a generous floor that only catches
 * garbage/truncated input, never a legitimate cert).
 */
function decodeBase64RootCertificate(entry: string, index: number): Buffer {
  const position = `entry ${index + 1}`;
  if (entry.length === 0) {
    throw new Error(
      `[subscriptions/apple-server] APPLE_ROOT_CA_BASE64 ${position} is empty.`,
    );
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(entry)) {
    throw new Error(
      `[subscriptions/apple-server] APPLE_ROOT_CA_BASE64 ${position} is not valid base64.`,
    );
  }
  const decoded = Buffer.from(entry, "base64");
  if (decoded.length < 100) {
    throw new Error(
      `[subscriptions/apple-server] APPLE_ROOT_CA_BASE64 ${position} decoded to ${decoded.length} bytes, which is too small to be a valid DER certificate.`,
    );
  }
  return decoded;
}

function loadRootCertificates(): Buffer[] {
  const base64Raw = process.env.APPLE_ROOT_CA_BASE64;
  if (base64Raw !== undefined && base64Raw.trim().length > 0) {
    return base64Raw
      .split(",")
      .map((entry) => entry.trim())
      .map((entry, index) => decodeBase64RootCertificate(entry, index));
  }

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

// Numeric VerificationStatus -> enum name, maintained by hand rather than via
// reverse-enum indexing (`VerificationStatus[n]`) — the real SDK enum has a
// generated reverse map, but that's an implementation detail we don't want
// this log-formatting helper to depend on. Values per
// @apple/app-store-server-library's VerificationStatus (0-7).
const VERIFICATION_STATUS_NAMES: Record<number, string> = {
  0: "OK",
  1: "VERIFICATION_FAILURE",
  2: "RETRYABLE_VERIFICATION_FAILURE",
  3: "INVALID_APP_IDENTIFIER",
  4: "INVALID_ENVIRONMENT",
  5: "INVALID_CHAIN_LENGTH",
  6: "INVALID_CERTIFICATE",
  7: "FAILURE",
};

/**
 * Formats a verification failure for a log line: `status=<n> <ENUM_NAME>`
 * (plus `: <cause message>` when the SDK attached a wrapped low-level error,
 * e.g. a cert-parsing failure) when `err` is a `VerificationException`, else
 * the plain error message. NEVER includes payload content —
 * `VerificationException` carries no payload data, only a status code and an
 * optional wrapped diagnostic error. Exported so callers outside this module
 * (the Notifications V2 webhook route) can log a triage-useful status code
 * without importing `@apple/app-store-server-library` themselves — this file
 * stays the ONE module that imports that package.
 */
export function describeVerificationFailure(err: unknown): string {
  if (err instanceof VerificationException) {
    const name = VERIFICATION_STATUS_NAMES[err.status] ?? "UNKNOWN";
    const causeSuffix = err.cause instanceof Error ? `: ${err.cause.message}` : "";
    return `status=${err.status} ${name}${causeSuffix}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Peeks a Notifications V2 `signedPayload`'s UNVERIFIED `environment` claim
 * (checking `data.environment`, then `summary.environment`, then
 * `appData.environment` — the shapes the SDK itself recognizes, in the same
 * precedence order) purely to choose which single `SignedDataVerifier` to
 * run against it. See the file header for why this replaces the
 * Production-first fallback for notifications specifically. This is a
 * selection hint only: no signature has been checked yet, so the returned
 * value must never be trusted for anything beyond "which verifier to try" —
 * the chosen verifier re-derives and re-checks this same claim (and
 * bundleId) AFTER verifying the signature. Defaults to Production when the
 * payload is malformed, has no recognizable data/summary/appData shape, or
 * the claim isn't literally `"Sandbox"`.
 */
function peekNotificationEnvironment(signedPayload: string): Environment {
  try {
    const payloadSegment = signedPayload.split(".")[1];
    if (!payloadSegment) return Environment.PRODUCTION;
    const body = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8")) as {
      data?: { environment?: string };
      summary?: { environment?: string };
      appData?: { environment?: string };
    };
    const raw = body.data?.environment ?? body.summary?.environment ?? body.appData?.environment;
    return raw === Environment.SANDBOX ? Environment.SANDBOX : Environment.PRODUCTION;
  } catch {
    return Environment.PRODUCTION;
  }
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
    autoRenewProductId: decoded.autoRenewProductId ?? null,
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
 *
 * Single verification pass (see file header, FV-598): peeks the payload's
 * unverified `environment` claim to pick ONE verifier (Production or
 * Sandbox), then lets that verifier enforce signature + bundleId +
 * environment together. No fallback retry — a wrong-environment guess still
 * fails correctly, because the chosen verifier re-checks the real claim
 * post-signature-verification and a forged claim can't pass signature
 * verification in the first place.
 */
export async function verifyAndDecodeNotification(
  signedPayload: string,
): Promise<DecodedNotification> {
  const verifier =
    peekNotificationEnvironment(signedPayload) === Environment.SANDBOX
      ? getSandboxVerifier()
      : getProductionVerifier();
  const decoded: ResponseBodyV2DecodedPayload =
    await verifier.verifyAndDecodeNotification(signedPayload);

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
