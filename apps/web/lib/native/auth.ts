/**
 * auth.ts — TypeScript bridge wrapper around the app-local native `FVAuth`
 * Capacitor plugin (FV-675, FV-569 spec §5.3, §5.4, §6).
 *
 * Same seam as lib/native/apple-iap.ts: apps/web does NOT depend on
 * `@capacitor/core`. Inside the native shell the bridge injects
 * `window.Capacitor`; on the web (PWA, browser, SSR) it is absent. Every call
 * here feature-detects the plugin first and NEVER throws — each native/bridge
 * failure maps to a typed result the UI can render calmly.
 *
 * Only builds whose User-Agent carries `FVAuth/1` should reach these calls
 * (`hasAuthCapability()` in lib/native-shell.ts gates the buttons server-side).
 * Older installed builds have no plugin, so a stray call resolves
 * `bridge_unavailable`.
 *
 * THE PLUGIN CONTRACT (must match apps/native/ios/App/App/FVAuthPlugin.swift
 * and apps/native/android/app/src/main/java/com/fromvictoryapp/app/FVAuthPlugin.java
 * EXACTLY — a drift fails silently at runtime, not at compile time):
 *
 *   window.Capacitor.Plugins.FVAuth.startSession({ url: string })
 *     => Promise<
 *          | { ok: true; url: string }   // com.fromvictoryapp.app://auth/callback?…
 *          | { ok: false; error: "cancelled" | "busy" | "rejected_url" | "failed" }
 *        >
 *     Opens `url` in the system browser (iOS ASWebAuthenticationSession,
 *     non-ephemeral; Android Auth Tab, else a Custom Tab) and resolves with the
 *     custom-scheme callback URL. The native side only opens https URLs on its
 *     own host allow-list and hard-codes the callback scheme; neither is
 *     configurable from here. The returned URL carries an OAuth code or an
 *     Apple handoff id — useless without the verifier this WebView holds, and
 *     NEVER logged.
 *
 *   window.Capacitor.Plugins.FVAuth.signInWithApple({ nonceHash: string })
 *     => Promise<
 *          | { ok: true; identityToken: string; authorizationCode: string }
 *          | { ok: false; error: "cancelled" | "busy" | "invalid_nonce" | "unsupported" | "failed" }
 *        >
 *     iOS only (the Sign in with Apple sheet, scope email). `nonceHash` is the
 *     hex SHA-256 (64 characters) of a raw nonce that stays in this
 *     WebView's JS. Android resolves `unsupported` (it uses the §5.4 Auth Tab +
 *     handoff flow through `startSession` instead).
 *
 * Every function maps onto one public error vocabulary:
 *   - `bridge_unavailable` — no plugin in this runtime (web, SSR, old build).
 *   - `cancelled` — the athlete/parent closed the sheet or tab. Calm, expected.
 *   - `unsupported` — this platform/build cannot do this method.
 *   - `error` — anything else; `reason` says which native outcome it was.
 */

// ---------------------------------------------------------------------------
// Injected-global typing (module-scoped; no `declare global`).
// ---------------------------------------------------------------------------

type NativeStartSessionResult =
  | { ok: true; url?: unknown }
  | { ok: false; error?: string };

type NativeAppleResult =
  | { ok: true; identityToken?: unknown; authorizationCode?: unknown }
  | { ok: false; error?: string };

interface FVAuthPluginBridge {
  startSession?(options: { url: string }): Promise<NativeStartSessionResult>;
  signInWithApple?(options: { nonceHash: string }): Promise<NativeAppleResult>;
}

/** The only callback shape the native side hands back (hard-coded natively). */
export const NATIVE_AUTH_CALLBACK_PREFIX = "com.fromvictoryapp.app://auth/callback";

function getBridge(): FVAuthPluginBridge | null {
  if (typeof window === "undefined") return null;
  // reason: window.Capacitor is injected by the Capacitor bridge at runtime;
  // apps/web has no @capacitor/core dependency, so narrow via a local shape.
  const injected = window as unknown as {
    Capacitor?: { Plugins?: { FVAuth?: FVAuthPluginBridge } };
  };
  return injected.Capacitor?.Plugins?.FVAuth ?? null;
}

/** True when the native sign-in bridge is present in this runtime. */
export function isNativeAuthBridgeAvailable(): boolean {
  return getBridge() !== null;
}

/**
 * Logs the method and an error CODE only — never `err.message`, which a
 * native or bridge layer could someday fill with a URL carrying a code.
 */
function logBridgeWarning(method: string, err: unknown): void {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : err instanceof Error
        ? err.name
        : typeof err;
  console.warn(`[native-auth] ${method} failed (${code})`);
}

/** Capacitor rejects a call to a method the native plugin lacks with this code. */
function isUnimplemented(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "UNIMPLEMENTED"
  );
}

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export type NativeAuthError = "bridge_unavailable" | "cancelled" | "unsupported" | "error";

/** Which native outcome an `error` result came from (diagnostics only). */
export type NativeAuthErrorReason =
  | "busy"
  | "rejected_url"
  | "invalid_nonce"
  | "invalid_response"
  | "failed";

export type NativeAuthFailure =
  | { ok: false; error: Exclude<NativeAuthError, "error"> }
  | { ok: false; error: "error"; reason: NativeAuthErrorReason };

export type StartSessionResult = { ok: true; url: string } | NativeAuthFailure;

export type AppleSignInResult =
  | { ok: true; identityToken: string; authorizationCode: string }
  | NativeAuthFailure;

function mapNativeError(value: string | undefined): NativeAuthFailure {
  switch (value) {
    case "cancelled":
      return { ok: false, error: "cancelled" };
    case "unsupported":
      return { ok: false, error: "unsupported" };
    case "busy":
    case "rejected_url":
    case "invalid_nonce":
      return { ok: false, error: "error", reason: value };
    default:
      // Unknown/missing error string from a payload we don't control — fail
      // closed to the generic bucket rather than leak `undefined` into UI.
      return { ok: false, error: "error", reason: "failed" };
  }
}

const NONCE_HASH_PATTERN = /^[0-9a-fA-F]{64}$/;

/** Exactly the hard-coded callback, followed by nothing or a query/fragment. */
function isExpectedCallbackUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.startsWith(NATIVE_AUTH_CALLBACK_PREFIX)) return false;
  const rest = value.slice(NATIVE_AUTH_CALLBACK_PREFIX.length);
  return rest === "" || rest.startsWith("?") || rest.startsWith("#");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Opens `url` (a Supabase authorize URL, or our own /auth/apple/start route on
 * Android) in the system browser and resolves with the custom-scheme callback
 * URL. The caller then navigates the WebView to /auth/callback (or completes
 * the Apple handoff) with its own verifier. Never throws.
 */
export async function startSession(url: string): Promise<StartSessionResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: "bridge_unavailable" };
  if (typeof bridge.startSession !== "function") return { ok: false, error: "unsupported" };
  try {
    const result = await bridge.startSession({ url });
    if (result?.ok === true) {
      return isExpectedCallbackUrl(result.url)
        ? { ok: true, url: result.url }
        : { ok: false, error: "error", reason: "invalid_response" };
    }
    return mapNativeError(result?.ok === false ? result.error : undefined);
  } catch (err) {
    if (isUnimplemented(err)) return { ok: false, error: "unsupported" };
    logBridgeWarning("startSession", err);
    return { ok: false, error: "error", reason: "failed" };
  }
}

/**
 * Presents the native Sign in with Apple sheet (iOS) with `nonceHash` as the
 * request nonce, and resolves with the credential's identity token and
 * authorization code, which come from the same credential (spec §5.4). The raw
 * nonce never leaves the caller. Never throws.
 */
export async function signInWithApple(nonceHash: string): Promise<AppleSignInResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: "bridge_unavailable" };
  if (typeof bridge.signInWithApple !== "function") return { ok: false, error: "unsupported" };
  if (!NONCE_HASH_PATTERN.test(nonceHash)) {
    return { ok: false, error: "error", reason: "invalid_nonce" };
  }
  try {
    const result = await bridge.signInWithApple({ nonceHash });
    if (result?.ok === true) {
      const { identityToken, authorizationCode } = result;
      if (
        typeof identityToken === "string" &&
        identityToken.length > 0 &&
        typeof authorizationCode === "string" &&
        authorizationCode.length > 0
      ) {
        return { ok: true, identityToken, authorizationCode };
      }
      return { ok: false, error: "error", reason: "invalid_response" };
    }
    return mapNativeError(result?.ok === false ? result.error : undefined);
  } catch (err) {
    if (isUnimplemented(err)) return { ok: false, error: "unsupported" };
    logBridgeWarning("signInWithApple", err);
    return { ok: false, error: "error", reason: "failed" };
  }
}
