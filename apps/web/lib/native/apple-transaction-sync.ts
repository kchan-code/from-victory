/**
 * apple-transaction-sync.ts — FV-712. Reconciles StoreKit's unfinished
 * transactions with the server. A transaction is finished ONLY after
 * `submitApplePurchase` confirms it; otherwise StoreKit keeps redelivering.
 *
 * Only the NEWEST entry is submitted. On success, that entry and every older
 * entry of the SAME subscription (same `originalTransactionId`, i.e. its
 * superseded renewals) are finished. Entries of a different subscription
 * (another Apple purchase made on a shared device) are left alone: they
 * become "newest" on a later run and get their own server verdict.
 *
 * Nothing here logs JWS content or transaction ids — error codes only — and
 * the backoff state stores no transaction data (one timestamp).
 */

import { submitApplePurchase } from "@/lib/actions/apple-subscription";
import {
  finishTransactions,
  getUnfinishedTransactions,
} from "@/lib/native/apple-iap";

export type SyncResult =
  | { status: "unsupported" }
  | { status: "none" }
  | { status: "skipped" }
  | { status: "synced"; applied: boolean }
  | { status: "deferred"; error: string };

/** Wait after an error that may clear by itself (network, server fault). */
export const TRANSIENT_RETRY_MS = 60_000;
/**
 * Wait after a rejection that will not change for the signed-in user (signed
 * out, wrong role, another payer's purchase, a JWS the server cannot verify).
 * Not permanent: the user may sign in as the right payer without restarting
 * the app, so the next attempt still happens, just not on every page.
 */
export const REJECTED_RETRY_MS = 15 * 60_000;

const NOT_BEFORE_KEY = "fv_apple_sync_not_before";

const REJECTED_ERRORS = new Set([
  "unauthenticated",
  "not_authorized",
  "token_mismatch",
  "ownership_conflict",
  "environment_rejected",
  "invalid_input",
  "verification_failed",
]);

let inFlight: Promise<SyncResult> | null = null;
let notBeforeInMemory: number | null = null;

/**
 * The wait is kept in sessionStorage as well as memory because every full
 * page load in the WebView starts this module fresh; sessionStorage lasts
 * for the app process.
 */
function readNotBefore(): number | null {
  let stored: number | null = null;
  try {
    const raw = window.sessionStorage.getItem(NOT_BEFORE_KEY);
    const parsed = raw === null ? NaN : Number(raw);
    if (Number.isFinite(parsed)) stored = parsed;
  } catch {
    // Storage unavailable: the in-memory value covers this page life.
  }
  if (stored === null) return notBeforeInMemory;
  if (notBeforeInMemory === null) return stored;
  return Math.max(stored, notBeforeInMemory);
}

function writeNotBefore(value: number | null): void {
  notBeforeInMemory = value;
  try {
    if (value === null) window.sessionStorage.removeItem(NOT_BEFORE_KEY);
    else window.sessionStorage.setItem(NOT_BEFORE_KEY, String(value));
  } catch {
    // In-memory value still applies.
  }
}

async function run(): Promise<SyncResult> {
  const listed = await getUnfinishedTransactions();
  if (!listed.ok) {
    if (listed.error === "failed") return { status: "deferred", error: "bridge_failed" };
    return { status: "unsupported" };
  }
  const newest = listed.transactions[0];
  if (!newest) return { status: "none" };

  let submitted: Awaited<ReturnType<typeof submitApplePurchase>>;
  try {
    submitted = await submitApplePurchase({
      signedTransactionInfo: newest.signedTransactionInfo,
      signedRenewalInfo: newest.signedRenewalInfo,
    });
  } catch {
    console.warn("[apple-sync] submit failed: thrown");
    return { status: "deferred", error: "thrown" };
  }

  if (!submitted.ok) {
    console.warn(`[apple-sync] submit failed: ${submitted.error}`);
    return { status: "deferred", error: submitted.error };
  }

  const sameSubscription = listed.transactions.filter(
    (t) =>
      t === newest ||
      (newest.originalTransactionId !== undefined &&
        t.originalTransactionId === newest.originalTransactionId),
  );
  // Best-effort: a failed finish just means StoreKit redelivers next time.
  await finishTransactions(sameSubscription.map((t) => t.transactionId));
  return { status: "synced", applied: submitted.applied };
}

/**
 * Single-flight. After a failed attempt, non-forced calls are skipped until a
 * wait has passed (60s for a transient error, 15 min for a rejection). A
 * successful or empty run clears the wait. `force` bypasses it.
 */
export function syncAppleTransactions(
  options: { force?: boolean } = {},
): Promise<SyncResult> {
  if (inFlight) return inFlight;
  if (!options.force) {
    const notBefore = readNotBefore();
    if (notBefore !== null && Date.now() < notBefore) {
      return Promise.resolve({ status: "skipped" });
    }
  }
  inFlight = (async () => {
    try {
      const result = await run();
      if (result.status === "deferred") {
        const wait = REJECTED_ERRORS.has(result.error)
          ? REJECTED_RETRY_MS
          : TRANSIENT_RETRY_MS;
        writeNotBefore(Date.now() + wait);
      } else if (result.status === "synced" || result.status === "none") {
        writeNotBefore(null);
      }
      return result;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Test-only reset of module state. */
export function __resetAppleSyncStateForTests(): void {
  inFlight = null;
  writeNotBefore(null);
}
