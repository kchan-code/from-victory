/**
 * apple-transaction-sync.ts — FV-712. Reconciles StoreKit's unfinished
 * transactions with the server. A transaction is finished ONLY after
 * `submitApplePurchase` confirms it; otherwise StoreKit keeps redelivering.
 *
 * Only the NEWEST entry is submitted (older ones are superseded renewals of
 * the single subscription group); on success ALL returned ids are finished.
 * Nothing here logs JWS content or transaction ids — error codes only — and
 * the backoff state stores no transaction data (a boolean + a timestamp).
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

export const TRANSIENT_RETRY_MS = 60_000;
const BLOCKED_KEY = "fv_apple_sync_blocked";

const DEFINITIVE_ERRORS = new Set([
  "unauthenticated",
  "not_authorized",
  "token_mismatch",
  "ownership_conflict",
  "environment_rejected",
  "invalid_input",
]);

let inFlight: Promise<SyncResult> | null = null;
let blockedInMemory = false;
let lastAttemptAt: number | null = null;

function isBlocked(): boolean {
  if (blockedInMemory) return true;
  try {
    return window.sessionStorage.getItem(BLOCKED_KEY) === "1";
  } catch {
    return false;
  }
}

function markBlocked(): void {
  blockedInMemory = true;
  try {
    window.sessionStorage.setItem(BLOCKED_KEY, "1");
  } catch {
    // In-memory flag still covers this page life.
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
    if (DEFINITIVE_ERRORS.has(submitted.error)) markBlocked();
    return { status: "deferred", error: submitted.error };
  }

  // Best-effort: a failed finish just means StoreKit redelivers next time.
  await finishTransactions(listed.transactions.map((t) => t.transactionId));
  return { status: "synced", applied: submitted.applied };
}

/**
 * Single-flight. Non-forced calls are skipped after a definitive error (until
 * the app process restarts) and throttled to one attempt per 60s after a
 * deferred outcome. `force` bypasses both.
 */
export function syncAppleTransactions(
  options: { force?: boolean } = {},
): Promise<SyncResult> {
  if (inFlight) return inFlight;
  if (!options.force) {
    if (isBlocked()) return Promise.resolve({ status: "skipped" });
    if (lastAttemptAt !== null && Date.now() - lastAttemptAt < TRANSIENT_RETRY_MS) {
      return Promise.resolve({ status: "skipped" });
    }
  }
  inFlight = (async () => {
    try {
      const result = await run();
      lastAttemptAt = result.status === "deferred" ? Date.now() : null;
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
  blockedInMemory = false;
  lastAttemptAt = null;
  try {
    window.sessionStorage.removeItem(BLOCKED_KEY);
  } catch {
    // ignore
  }
}
