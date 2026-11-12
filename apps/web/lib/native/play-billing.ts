/**
 * play-billing.ts — TypeScript bridge wrapper around the native
 * `FVPlayBillingPlugin` Capacitor plugin (FV-664, Android Google Play Billing).
 *
 * Same contract style as apple-iap.ts: apps/web has no `@capacitor/core`
 * dependency, so this is the single feature-detected seam over the injected
 * `window.Capacitor.Plugins.FVPlayBillingPlugin`. Every exported function is
 * async, fully typed, and NEVER throws — bridge/native failures become typed
 * results. Nothing imports this module yet (UI lands in a later issue).
 *
 * The plugin only exists in Android builds made with FV_PLAY_BILLING=1 (the
 * "FVNativeShell/1 (play)" shell). Everywhere else (web, iOS, 1.0.x Android)
 * the plugin is absent and every call resolves `bridge_unavailable`.
 *
 * THE PLUGIN CONTRACT (must match
 * apps/native/android/app/src/playBilling/java/com/fromvictoryapp/app/FVPlayBillingPlugin.java
 * EXACTLY; drift fails silently at runtime, so this block is the source of
 * truth for both sides):
 *
 *   getProducts({ productIds: string[] })
 *     => { ok: true, products: [{ productId, name, title, offers: [{
 *            basePlanId, offerId: string|null, offerToken,
 *            pricingPhases: [{ formattedPrice, priceAmountMicros,
 *              priceCurrencyCode, billingPeriod (ISO 8601), billingCycleCount,
 *              recurrenceMode }] }] }] }
 *      | { ok: false, error }
 *     Prices exist ONLY here, straight from Play. Never hardcode them.
 *
 *   purchase({ productId, basePlanId, offerId?, obfuscatedAccountId,
 *              replace?: { oldPurchaseToken, mode } })
 *     => { status: "purchased", purchaseToken, productId }
 *      | { status: "cancelled" } | { status: "pending" }
 *      | { status: "error", error }
 *      | { status: "deferred", purchaseToken: string|null, productId: string|null }
 *     "deferred" only answers a replace with mode DEFERRED: Play accepted a
 *     change that takes effect at the next renewal. Google keeps the new
 *     token on the OLD product until then, so `productId` (when present) is
 *     the product Play reported, not the one requested. When the token is
 *     null, call restore() and send what it returns to the server.
 *     `obfuscatedAccountId` is REQUIRED (1..64 chars). The plugin buys the
 *     offer matching EXACTLY basePlanId + offerId (absent = the base plan
 *     with no offer) and never falls back to another offer. Malformed
 *     arguments are REJECTED natively with code INVALID_ARGUMENT (mapped to
 *     `developer_error` here). The plugin never acknowledges: the server does.
 *
 *   restore()
 *     => { ok: true, purchases: [{ purchaseToken, productIds, purchaseState:
 *          "purchased"|"pending"|"unspecified", acknowledged, autoRenewing,
 *          obfuscatedAccountId: string|null }] } | { ok: false, error }
 *
 *   manageSubscriptions({ productId? })
 *     => { ok: true } | { ok: false, error }
 *     Opens Play's subscription page for com.fromvictoryapp.app.
 *
 * Purchase tokens and obfuscated account ids are secrets: this module never
 * logs them.
 */

// ---------------------------------------------------------------------------
// Injected-global typing (module-scoped; no `declare global`)
// ---------------------------------------------------------------------------

interface FVPlayBillingPluginBridge {
  getProducts(options: { productIds: string[] }): Promise<unknown>;
  purchase(options: NativePurchaseOptions): Promise<unknown>;
  restore(): Promise<unknown>;
  manageSubscriptions(options: { productId?: string }): Promise<unknown>;
}

interface NativePurchaseOptions {
  productId: string;
  basePlanId: string;
  offerId?: string;
  obfuscatedAccountId: string;
  replace?: { oldPurchaseToken: string; mode: PlayReplacementMode };
}

function getBridge(): FVPlayBillingPluginBridge | null {
  if (typeof window === "undefined") return null;
  // reason: window.Capacitor is injected by the Capacitor bridge at runtime;
  // apps/web has no @capacitor/core dependency, so narrow via a local shape.
  const injected = window as unknown as {
    Capacitor?: { Plugins?: { FVPlayBillingPlugin?: FVPlayBillingPluginBridge } };
  };
  return injected.Capacitor?.Plugins?.FVPlayBillingPlugin ?? null;
}

/** True when the native Play Billing bridge is present in this runtime. */
export function isPlayBillingBridgeAvailable(): boolean {
  return getBridge() !== null;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** `"bridge_unavailable"` is TS-side only (plugin absent). */
export type PlayBillingError =
  | "already_owned"
  | "unavailable"
  | "network"
  | "developer_error"
  | "unknown"
  | "bridge_unavailable";

export type PlayReplacementMode = "CHARGE_PRORATED_PRICE" | "DEFERRED";

export interface PlayPricingPhase {
  formattedPrice: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  /** ISO 8601 duration exactly as Play reports it, e.g. "P1M", "P1Y", "P7D". */
  billingPeriod: string;
  billingCycleCount: number;
  recurrenceMode: number;
}

export interface PlayOffer {
  basePlanId: string;
  offerId: string | null;
  offerToken: string;
  pricingPhases: PlayPricingPhase[];
}

export interface PlayProduct {
  productId: string;
  name: string;
  title: string;
  offers: PlayOffer[];
}

export type PlayGetProductsResult =
  | { ok: true; products: PlayProduct[] }
  | { ok: false; error: PlayBillingError };

export interface PlayPurchaseInput {
  productId: string;
  basePlanId: string;
  /** Omit/null = the base plan with no offer. */
  offerId?: string | null;
  /** Required, 1..64 chars. Opaque, non-identifying (server-issued). */
  obfuscatedAccountId: string;
  replace?: { oldPurchaseToken: string; mode: PlayReplacementMode };
}

export type PlayPurchaseResult =
  | { status: "purchased"; purchaseToken: string; productId: string }
  | { status: "cancelled" }
  | { status: "pending" }
  /** Scheduled (next-renewal) change accepted. Null token: collect it via restore(). */
  | { status: "deferred"; purchaseToken: string | null; productId: string | null }
  | { status: "error"; error: PlayBillingError };

export type PlayPurchaseState = "purchased" | "pending" | "unspecified";

export interface PlayRestoredPurchase {
  purchaseToken: string;
  productIds: string[];
  purchaseState: PlayPurchaseState;
  acknowledged: boolean;
  autoRenewing: boolean;
  obfuscatedAccountId: string | null;
}

export type PlayRestoreResult =
  | { ok: true; purchases: PlayRestoredPurchase[] }
  | { ok: false; error: PlayBillingError };

export type PlayManageResult = { ok: true } | { ok: false; error: PlayBillingError };

// ---------------------------------------------------------------------------
// Defensive parsing helpers (native payloads are untrusted shapes)
// ---------------------------------------------------------------------------

const KNOWN_ERRORS: readonly PlayBillingError[] = [
  "already_owned",
  "unavailable",
  "network",
  "developer_error",
  "unknown",
];

function coerceError(value: unknown): PlayBillingError {
  return typeof value === "string" && (KNOWN_ERRORS as readonly string[]).includes(value)
    ? (value as PlayBillingError)
    : "unknown";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parsePhase(raw: unknown): PlayPricingPhase | null {
  if (!isRecord(raw)) return null;
  const formattedPrice = str(raw.formattedPrice);
  const billingPeriod = str(raw.billingPeriod);
  const priceAmountMicros = num(raw.priceAmountMicros);
  if (formattedPrice === null || billingPeriod === null || priceAmountMicros === null) return null;
  return {
    formattedPrice,
    priceAmountMicros,
    priceCurrencyCode: str(raw.priceCurrencyCode) ?? "",
    billingPeriod,
    billingCycleCount: num(raw.billingCycleCount) ?? 0,
    recurrenceMode: num(raw.recurrenceMode) ?? 0,
  };
}

function parseOffer(raw: unknown): PlayOffer | null {
  if (!isRecord(raw)) return null;
  const basePlanId = str(raw.basePlanId);
  const offerToken = str(raw.offerToken);
  if (basePlanId === null || offerToken === null) return null;
  const phases = (Array.isArray(raw.pricingPhases) ? raw.pricingPhases : [])
    .map(parsePhase)
    .filter((p): p is PlayPricingPhase => p !== null);
  // An offer with no readable price is not safe to show or buy.
  if (phases.length === 0) return null;
  return { basePlanId, offerId: str(raw.offerId), offerToken, pricingPhases: phases };
}

function parseProduct(raw: unknown): PlayProduct | null {
  if (!isRecord(raw)) return null;
  const productId = str(raw.productId);
  if (productId === null) return null;
  const offers = (Array.isArray(raw.offers) ? raw.offers : [])
    .map(parseOffer)
    .filter((o): o is PlayOffer => o !== null);
  return { productId, name: str(raw.name) ?? "", title: str(raw.title) ?? "", offers };
}

function parsePurchaseState(value: unknown): PlayPurchaseState {
  return value === "purchased" || value === "pending" ? value : "unspecified";
}

function parseRestored(raw: unknown): PlayRestoredPurchase | null {
  if (!isRecord(raw)) return null;
  const purchaseToken = str(raw.purchaseToken);
  if (purchaseToken === null) return null;
  const productIds = (Array.isArray(raw.productIds) ? raw.productIds : []).filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );
  return {
    purchaseToken,
    productIds,
    purchaseState: parsePurchaseState(raw.purchaseState),
    acknowledged: raw.acknowledged === true,
    autoRenewing: raw.autoRenewing === true,
    obfuscatedAccountId: str(raw.obfuscatedAccountId),
  };
}

/** Maps a native rejection (Capacitor rejects with `{ code, message }`). Never logs the message. */
function errorFromRejection(method: string, err: unknown): PlayBillingError {
  const code = isRecord(err) && typeof err.code === "string" ? err.code : undefined;
  // Only the method name and a short code: never the payload, token, or account id.
  console.warn(`[play-billing] ${method} rejected${code ? ` (${code})` : ""}`);
  return code === "INVALID_ARGUMENT" ? "developer_error" : "unknown";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Play's localized subscription products, base plans, offers and prices. Never throws. */
export async function getProducts(productIds: string[]): Promise<PlayGetProductsResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: "bridge_unavailable" };
  try {
    const result = await bridge.getProducts({ productIds });
    if (isRecord(result) && result.ok === true) {
      const products = (Array.isArray(result.products) ? result.products : [])
        .map(parseProduct)
        .filter((p): p is PlayProduct => p !== null);
      return { ok: true, products };
    }
    return { ok: false, error: coerceError(isRecord(result) ? result.error : undefined) };
  } catch (err) {
    return { ok: false, error: errorFromRejection("getProducts", err) };
  }
}

/**
 * Launches the Play purchase sheet. Never throws. `obfuscatedAccountId` is
 * required; a missing/oversized value resolves `developer_error` without
 * touching the bridge. "cancelled" is an ordinary outcome, not an alarm.
 */
export async function purchase(input: PlayPurchaseInput): Promise<PlayPurchaseResult> {
  const bridge = getBridge();
  if (!bridge) return { status: "error", error: "bridge_unavailable" };
  const account = input.obfuscatedAccountId;
  if (typeof account !== "string" || account.trim().length === 0 || account.length > 64) {
    return { status: "error", error: "developer_error" };
  }
  const options: NativePurchaseOptions = {
    productId: input.productId,
    basePlanId: input.basePlanId,
    obfuscatedAccountId: account,
  };
  if (typeof input.offerId === "string" && input.offerId.length > 0) options.offerId = input.offerId;
  if (input.replace) options.replace = input.replace;
  try {
    const result = await bridge.purchase(options);
    if (isRecord(result)) {
      if (result.status === "purchased") {
        const purchaseToken = str(result.purchaseToken);
        const productId = str(result.productId);
        if (purchaseToken !== null && productId !== null) {
          return { status: "purchased", purchaseToken, productId };
        }
        return { status: "error", error: "unknown" };
      }
      if (result.status === "cancelled") return { status: "cancelled" };
      if (result.status === "pending") return { status: "pending" };
      if (result.status === "deferred") {
        // Token and product travel together or not at all.
        const purchaseToken = str(result.purchaseToken);
        const productId = str(result.productId);
        const paired = purchaseToken !== null && productId !== null;
        return {
          status: "deferred",
          purchaseToken: paired ? purchaseToken : null,
          productId: paired ? productId : null,
        };
      }
      if (result.status === "error") return { status: "error", error: coerceError(result.error) };
    }
    return { status: "error", error: "unknown" };
  } catch (err) {
    return { status: "error", error: errorFromRejection("purchase", err) };
  }
}

/** Current subscription purchases from Play. An empty `ok: true` list is a calm "nothing found". */
export async function restore(): Promise<PlayRestoreResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: "bridge_unavailable" };
  try {
    const result = await bridge.restore();
    if (isRecord(result) && result.ok === true) {
      const purchases = (Array.isArray(result.purchases) ? result.purchases : [])
        .map(parseRestored)
        .filter((p): p is PlayRestoredPurchase => p !== null);
      return { ok: true, purchases };
    }
    return { ok: false, error: coerceError(isRecord(result) ? result.error : undefined) };
  } catch (err) {
    return { ok: false, error: errorFromRejection("restore", err) };
  }
}

/** Opens Play's subscription-management page. Fire-and-forget from the UI's view. */
export async function manageSubscriptions(productId?: string): Promise<PlayManageResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: "bridge_unavailable" };
  try {
    const result = await bridge.manageSubscriptions(productId ? { productId } : {});
    if (isRecord(result) && result.ok === true) return { ok: true };
    return { ok: false, error: coerceError(isRecord(result) ? result.error : undefined) };
  } catch (err) {
    return { ok: false, error: errorFromRejection("manageSubscriptions", err) };
  }
}
