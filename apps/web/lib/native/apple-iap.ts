/**
 * apple-iap.ts — TypeScript bridge wrapper around the native `FVAppleIAPPlugin`
 * Capacitor plugin (FV-572).
 *
 * WHY THIS EXISTS
 * ----------------
 * apps/web does NOT depend on `@capacitor/core` (see
 * lib/audio/cache-strategy.ts's `isNativeShell()` helper for the established
 * precedent). Inside the native iOS shell, the Capacitor bridge injects a
 * global `window.Capacitor` object before any app JavaScript runs; on the
 * web (PWA, ordinary browser, SSR) that global is simply absent. This module
 * is the single, feature-detected seam between `AppleSubscribeSection` and
 * that injected global — every call here checks for the plugin's presence
 * first and NEVER assumes `@capacitor/core` types exist.
 *
 * THE PLUGIN CONTRACT (must match
 * apps/native/ios/App/App/FVAppleIAPPlugin.swift EXACTLY — method names,
 * argument keys, result shapes, error-code strings. A drift between the two
 * sides fails silently at runtime, not at compile time, so treat this block
 * as the sole source of truth for both.)
 *
 *   window.Capacitor.Plugins.FVAppleIAPPlugin.getProducts(
 *     { productIds: string[] }
 *   ) => Promise<{ products: { productId, displayPrice, displayName }[] }>
 *     Localized product info straight from StoreKit. Never rejects — an
 *     unknown/unavailable product id is simply omitted from the result
 *     array (the caller falls back to injected config `displayName`).
 *
 *   window.Capacitor.Plugins.FVAppleIAPPlugin.purchase(
 *     { productId: string; appAccountToken: string }
 *   ) => Promise<
 *          | { ok: true; signedTransactionInfo: string; signedRenewalInfo?: string;
 *              transactionId?: string }
 *          | { ok: false; error: "cancelled" | "pending" | "failed" }
 *        >
 *     `transactionId` (FV-712) is present only on newer native binaries.
 *     Those binaries do NOT call `transaction.finish()` themselves — the web
 *     layer finishes the transaction (via `finishTransactions`) only after
 *     the server confirms it. Old binaries omit it and finish natively.
 *     `appAccountToken` is a UUID string (from `beginApplePurchase()`,
 *     apps/web/lib/actions/apple-subscription.ts) forwarded verbatim to
 *     StoreKit's `Product.PurchaseOption.appAccountToken`. The native side
 *     NEVER returns `"bridge_unavailable"` — that error code exists only on
 *     the TS side of this file, for when the plugin itself isn't present.
 *     User cancellation (`"cancelled"`) is an ordinary, expected outcome —
 *     never surfaced to the user as an alarming error.
 *
 *   window.Capacitor.Plugins.FVAppleIAPPlugin.restore()
 *     => Promise<
 *          | { ok: true; transactions: { signedTransactionInfo: string; signedRenewalInfo?: string }[] }
 *          | { ok: false; error: "cancelled" | "failed" }
 *        >
 *     Attempts `AppStore.sync()` as a best-effort refresh (NOT a
 *     precondition) then reads `Transaction.currentEntitlements` natively.
 *     If the user dismisses the sign-in/re-auth prompt `AppStore.sync()` can
 *     surface, the native side resolves `{ ok: false, error: "cancelled" }`
 *     — a calm, expected outcome, never an alarming error. Any OTHER sync
 *     failure (network, transient auth trouble, etc.) is logged natively and
 *     does NOT stop the restore — a device that already holds the
 *     entitlement locally still resolves `ok: true`. ORDERING CONTRACT: the
 *     native side returns `transactions` sorted NEWEST-FIRST by purchase
 *     date — callers that need "the current transaction" (there is normally
 *     at most one live entitlement in our single subscription group) read
 *     `transactions[0]`, never re-sort here. An empty `transactions` array
 *     (with `ok: true`) means "no purchase found for this Apple ID," which
 *     is a calm, expected empty state, not an error.
 *
 *   window.Capacitor.Plugins.FVAppleIAPPlugin.manageSubscriptions()
 *     => Promise<{ ok: true } | { ok: false; error: "failed" }>
 *     Opens Apple's native "Manage Subscriptions" sheet
 *     (`AppStore.showManageSubscriptions(in:)`). The resolved value only
 *     indicates whether the sheet was successfully presented — it carries no
 *     information about what the user does inside it (entitlement changes
 *     made there flow back to us via Notifications V2 / the next restore).
 *
 *   FV-712 ADDITIVE methods (absent on binaries already in the App Store —
 *   every one is feature-detected with `typeof bridge.x === "function"`; an
 *   old binary yields `error: "unsupported"` and behaves exactly as before):
 *
 *   window.Capacitor.Plugins.FVAppleIAPPlugin.getUnfinishedTransactions()
 *     => Promise<
 *          | { ok: true; transactions: { transactionId: string;
 *              signedTransactionInfo: string; signedRenewalInfo?: string }[] }
 *          | { ok: false; error: "failed" }
 *        >
 *     Verified-only, NEWEST-FIRST. Only the first entry may carry
 *     `signedRenewalInfo`.
 *
 *   window.Capacitor.Plugins.FVAppleIAPPlugin.finishTransactions(
 *     { transactionIds: string[] }
 *   ) => Promise<{ ok: true; finished: number } | { ok: false; error: "failed" }>
 *
 *   window.Capacitor.Plugins.FVAppleIAPPlugin.addListener(
 *     "transactionsUpdated", cb
 *   ) => handle with remove()   (empty payload; fired when StoreKit's
 *     `Transaction.updates` yields a verified transaction; may be absent)
 *
 * Every exported function here is async, is fully typed, and NEVER throws a
 * raw error across the call boundary — every native/bridge failure is caught
 * and mapped to a typed, discriminated result (or a safe empty value for
 * `getProducts`) so the UI layer can render calm, non-alarming copy without
 * its own try/catch.
 */

// ---------------------------------------------------------------------------
// Injected-global typing (scoped to this module — no `declare global`
// augmentation, so this can never collide with a future @capacitor/core
// install's own ambient types).
// ---------------------------------------------------------------------------

interface NativeGetProductsResult {
  products?: AppleStoreProductInfo[];
}

type NativePurchaseResult =
  | { ok: true; signedTransactionInfo: string; signedRenewalInfo?: string; transactionId?: unknown }
  | { ok: false; error?: string };

interface NativeRestoreTransaction {
  signedTransactionInfo: string;
  signedRenewalInfo?: string;
}

type NativeRestoreResult =
  | { ok: true; transactions?: NativeRestoreTransaction[] }
  | { ok: false; error?: string };

type NativeManageResult = { ok: true } | { ok: false; error?: string };

type NativeListenerHandle = { remove: () => Promise<void> | void };

interface FVAppleIAPPluginBridge {
  // FV-712 additive methods — optional: absent on already-shipped binaries.
  getUnfinishedTransactions?: () => Promise<unknown>;
  finishTransactions?: (options: { transactionIds: string[] }) => Promise<unknown>;
  addListener?: (
    event: "transactionsUpdated",
    cb: () => void,
  ) => Promise<NativeListenerHandle> | NativeListenerHandle;
  getProducts(options: { productIds: string[] }): Promise<NativeGetProductsResult>;
  purchase(options: {
    productId: string;
    appAccountToken: string;
  }): Promise<NativePurchaseResult>;
  restore(): Promise<NativeRestoreResult>;
  manageSubscriptions(): Promise<NativeManageResult>;
}

/** Returns the injected native plugin, or `null` when unavailable (web,
 * SSR, an Android shell, or a pre-FV-572 iOS build that never bundled it). */
function getBridge(): FVAppleIAPPluginBridge | null {
  if (typeof window === "undefined") return null;
  // reason: window.Capacitor is injected by the Capacitor bridge at runtime;
  // apps/web has no @capacitor/core dependency (see cache-strategy.ts), so
  // there is no ambient type for it — narrow via a local, module-scoped
  // shape instead of `any`.
  const injected = window as unknown as {
    Capacitor?: { Plugins?: { FVAppleIAPPlugin?: FVAppleIAPPluginBridge } };
  };
  return injected.Capacitor?.Plugins?.FVAppleIAPPlugin ?? null;
}

/** True when the native purchase bridge is present in this runtime. */
export function isAppleIapBridgeAvailable(): boolean {
  return getBridge() !== null;
}

function logBridgeWarning(method: string, err: unknown): void {
  console.warn(
    `[apple-iap] ${method} failed: ${err instanceof Error ? err.message : String(err)}`,
  );
}

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export interface AppleStoreProductInfo {
  productId: string;
  displayPrice: string;
  displayName: string;
}

export interface ApplePurchaseInput {
  productId: string;
  appAccountToken: string;
}

/** `"bridge_unavailable"` is TS-side only — see the plugin contract above. */
export type ApplePurchaseError = "cancelled" | "pending" | "bridge_unavailable" | "failed";

export type ApplePurchaseResult =
  | { ok: true; signedTransactionInfo: string; signedRenewalInfo?: string; transactionId?: string }
  | { ok: false; error: ApplePurchaseError };

export interface AppleRestoreTransaction {
  signedTransactionInfo: string;
  signedRenewalInfo?: string;
}

/**
 * Restore never resolves `"pending"` — that's a purchase-only outcome (Ask
 * to Buy / SCA on a fresh purchase). `"cancelled"` here means the user
 * dismissed the sign-in/re-auth prompt `AppStore.sync()` can surface — a
 * calm, expected outcome, not an alarming error.
 */
export type AppleRestoreError = "failed" | "cancelled" | "bridge_unavailable";

export type AppleRestoreResult =
  | { ok: true; transactions: AppleRestoreTransaction[] }
  | { ok: false; error: AppleRestoreError };

export type AppleManageResult = { ok: true } | { ok: false; error: ApplePurchaseError };

function coercePurchaseError(value: string | undefined): ApplePurchaseError {
  if (value === "cancelled" || value === "pending" || value === "failed") {
    return value;
  }
  // Unknown/missing error string from a native payload we don't control —
  // fail closed to the generic, still-calm "failed" bucket rather than
  // guessing or letting `undefined` leak into UI copy.
  return "failed";
}

function coerceRestoreError(value: string | undefined): AppleRestoreError {
  if (value === "cancelled" || value === "failed") {
    return value;
  }
  // Unknown/missing error string from a native payload we don't control —
  // fail closed to the generic, still-calm "failed" bucket rather than
  // guessing or letting `undefined` leak into UI copy.
  return "failed";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Localized product info for the given ids, straight from StoreKit. Returns
 * `[]` (never throws) when the bridge is unavailable, the call fails, or
 * StoreKit has nothing to say about any of the requested ids — callers fall
 * back to their own injected config (see apple-products.ts) for display.
 */
export async function getProducts(productIds: string[]): Promise<AppleStoreProductInfo[]> {
  const bridge = getBridge();
  if (!bridge) return [];
  try {
    const result = await bridge.getProducts({ productIds });
    return Array.isArray(result?.products) ? result.products : [];
  } catch (err) {
    logBridgeWarning("getProducts", err);
    return [];
  }
}

/**
 * Runs a StoreKit 2 purchase for `productId`, attaching `appAccountToken`
 * (from `beginApplePurchase()`) so the server can bind the resulting
 * transaction to the calling payer. Never throws.
 */
export async function purchase(input: ApplePurchaseInput): Promise<ApplePurchaseResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: "bridge_unavailable" };
  try {
    const result = await bridge.purchase(input);
    if (result?.ok === true && typeof result.signedTransactionInfo === "string") {
      return {
        ok: true,
        signedTransactionInfo: result.signedTransactionInfo,
        signedRenewalInfo: result.signedRenewalInfo,
        ...(typeof result.transactionId === "string" && result.transactionId
          ? { transactionId: result.transactionId }
          : {}),
      };
    }
    return { ok: false, error: coercePurchaseError(result?.ok === false ? result.error : undefined) };
  } catch (err) {
    logBridgeWarning("purchase", err);
    return { ok: false, error: "failed" };
  }
}

/**
 * Restores prior purchases: attempts `AppStore.sync()` as a best-effort
 * refresh (NOT a precondition), then reads `Transaction.currentEntitlements`
 * on the native side. `transactions` is ordered NEWEST-FIRST (see the plugin
 * contract above) — callers wanting "the current one" read `transactions[0]`.
 * An empty, `ok: true` array is a calm "nothing found" outcome, not an error.
 * `error: "cancelled"` means the user dismissed the sign-in/re-auth prompt
 * sync surfaced — also calm, never alarming; any other sync trouble is
 * logged natively and does NOT stop the restore.
 */
export async function restore(): Promise<AppleRestoreResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: "bridge_unavailable" };
  try {
    const result = await bridge.restore();
    if (result?.ok === true) {
      return {
        ok: true,
        transactions: Array.isArray(result.transactions) ? result.transactions : [],
      };
    }
    return { ok: false, error: coerceRestoreError(result?.ok === false ? result.error : undefined) };
  } catch (err) {
    logBridgeWarning("restore", err);
    return { ok: false, error: "failed" };
  }
}

/**
 * Opens Apple's native "Manage Subscriptions" sheet. Fire-and-forget from
 * the UI's point of view — entitlement changes made inside the sheet flow
 * back via Notifications V2 / a future restore, not via this call's result.
 */
export async function manageSubscriptions(): Promise<AppleManageResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: "bridge_unavailable" };
  try {
    const result = await bridge.manageSubscriptions();
    if (result?.ok === true) return { ok: true };
    return { ok: false, error: coercePurchaseError(result?.ok === false ? result.error : undefined) };
  } catch (err) {
    logBridgeWarning("manageSubscriptions", err);
    return { ok: false, error: "failed" };
  }
}

// ---------------------------------------------------------------------------
// FV-712 — unfinished-transaction sync API (additive; feature-detected)
// ---------------------------------------------------------------------------

export interface AppleUnfinishedTransaction {
  transactionId: string;
  signedTransactionInfo: string;
  signedRenewalInfo?: string;
}

/** `"unsupported"` = bridge present but the method is missing (old binary). */
export type AppleSyncBridgeError = "bridge_unavailable" | "unsupported" | "failed";

export type AppleUnfinishedResult =
  | { ok: true; transactions: AppleUnfinishedTransaction[] }
  | { ok: false; error: AppleSyncBridgeError };

export type AppleFinishResult =
  | { ok: true; finished: number }
  | { ok: false; error: AppleSyncBridgeError };

/**
 * Verified, unfinished StoreKit transactions, NEWEST-FIRST. Malformed
 * entries (non-string id / JWS) are dropped. Never throws.
 */
export async function getUnfinishedTransactions(): Promise<AppleUnfinishedResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: "bridge_unavailable" };
  if (typeof bridge.getUnfinishedTransactions !== "function") {
    return { ok: false, error: "unsupported" };
  }
  try {
    const result = (await bridge.getUnfinishedTransactions()) as
      | { ok?: unknown; transactions?: unknown }
      | null
      | undefined;
    if (result?.ok !== true) return { ok: false, error: "failed" };
    const raw: unknown[] = Array.isArray(result.transactions) ? result.transactions : [];
    const transactions: AppleUnfinishedTransaction[] = [];
    for (const entry of raw) {
      const e = entry as Record<string, unknown> | null;
      if (
        !e ||
        typeof e.transactionId !== "string" ||
        !e.transactionId ||
        typeof e.signedTransactionInfo !== "string" ||
        !e.signedTransactionInfo
      ) {
        continue;
      }
      transactions.push({
        transactionId: e.transactionId,
        signedTransactionInfo: e.signedTransactionInfo,
        ...(typeof e.signedRenewalInfo === "string" && e.signedRenewalInfo
          ? { signedRenewalInfo: e.signedRenewalInfo }
          : {}),
      });
    }
    return { ok: true, transactions };
  } catch (err) {
    logBridgeWarning("getUnfinishedTransactions", err);
    return { ok: false, error: "failed" };
  }
}

/** Finishes the given StoreKit transactions. No-op ok for an empty list. */
export async function finishTransactions(ids: string[]): Promise<AppleFinishResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: "bridge_unavailable" };
  if (typeof bridge.finishTransactions !== "function") {
    return { ok: false, error: "unsupported" };
  }
  if (ids.length === 0) return { ok: true, finished: 0 };
  try {
    const result = (await bridge.finishTransactions({ transactionIds: ids })) as
      | { ok?: unknown; finished?: unknown }
      | null
      | undefined;
    if (result?.ok === true) {
      return { ok: true, finished: typeof result.finished === "number" ? result.finished : 0 };
    }
    return { ok: false, error: "failed" };
  } catch (err) {
    logBridgeWarning("finishTransactions", err);
    return { ok: false, error: "failed" };
  }
}

/**
 * Subscribes to native `transactionsUpdated`. Returns an unsubscribe that is
 * safe whether the listener handle is a promise or sync, and a no-op when the
 * bridge or `addListener` is missing. Never throws.
 */
export function onTransactionsUpdated(cb: () => void): () => void {
  const bridge = getBridge();
  if (!bridge || typeof bridge.addListener !== "function") return () => {};
  let cancelled = false;
  let handle: NativeListenerHandle | null = null;
  const removeHandle = (h: NativeListenerHandle | null | undefined) => {
    try {
      void Promise.resolve(h?.remove?.()).catch(() => {});
    } catch {
      // Removal failure is harmless.
    }
  };
  try {
    Promise.resolve(bridge.addListener("transactionsUpdated", () => cb()))
      .then((h) => {
        if (cancelled) removeHandle(h);
        else handle = h;
      })
      .catch((err) => logBridgeWarning("onTransactionsUpdated", err));
  } catch (err) {
    logBridgeWarning("onTransactionsUpdated", err);
    return () => {};
  }
  return () => {
    cancelled = true;
    removeHandle(handle);
    handle = null;
  };
}
