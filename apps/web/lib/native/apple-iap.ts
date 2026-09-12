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
 *          | { ok: true; signedTransactionInfo: string; signedRenewalInfo?: string }
 *          | { ok: false; error: "cancelled" | "pending" | "failed" }
 *        >
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
 *          | { ok: false; error: "failed" }
 *        >
 *     Runs `AppStore.sync()` then reads `Transaction.currentEntitlements`
 *     natively. ORDERING CONTRACT: the native side returns `transactions`
 *     sorted NEWEST-FIRST by purchase date — callers that need "the current
 *     transaction" (there is normally at most one live entitlement in our
 *     single subscription group) read `transactions[0]`, never re-sort here.
 *     An empty `transactions` array (with `ok: true`) means "no purchase
 *     found for this Apple ID," which is a calm, expected empty state, not
 *     an error.
 *
 *   window.Capacitor.Plugins.FVAppleIAPPlugin.manageSubscriptions()
 *     => Promise<{ ok: true } | { ok: false; error: "failed" }>
 *     Opens Apple's native "Manage Subscriptions" sheet
 *     (`AppStore.showManageSubscriptions(in:)`). The resolved value only
 *     indicates whether the sheet was successfully presented — it carries no
 *     information about what the user does inside it (entitlement changes
 *     made there flow back to us via Notifications V2 / the next restore).
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
  | { ok: true; signedTransactionInfo: string; signedRenewalInfo?: string }
  | { ok: false; error?: string };

interface NativeRestoreTransaction {
  signedTransactionInfo: string;
  signedRenewalInfo?: string;
}

type NativeRestoreResult =
  | { ok: true; transactions?: NativeRestoreTransaction[] }
  | { ok: false; error?: string };

type NativeManageResult = { ok: true } | { ok: false; error?: string };

interface FVAppleIAPPluginBridge {
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
  | { ok: true; signedTransactionInfo: string; signedRenewalInfo?: string }
  | { ok: false; error: ApplePurchaseError };

export interface AppleRestoreTransaction {
  signedTransactionInfo: string;
  signedRenewalInfo?: string;
}

export type AppleRestoreResult =
  | { ok: true; transactions: AppleRestoreTransaction[] }
  | { ok: false; error: ApplePurchaseError };

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
      };
    }
    return { ok: false, error: coercePurchaseError(result?.ok === false ? result.error : undefined) };
  } catch (err) {
    logBridgeWarning("purchase", err);
    return { ok: false, error: "failed" };
  }
}

/**
 * Restores prior purchases: `AppStore.sync()` + `Transaction.currentEntitlements`
 * on the native side. `transactions` is ordered NEWEST-FIRST (see the plugin
 * contract above) — callers wanting "the current one" read `transactions[0]`.
 * An empty, `ok: true` array is a calm "nothing found" outcome, not an error.
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
    return { ok: false, error: coercePurchaseError(result?.ok === false ? result.error : undefined) };
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
