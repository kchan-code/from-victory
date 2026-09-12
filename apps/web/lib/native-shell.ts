import "server-only";

import { headers } from "next/headers";

/**
 * Native-shell compliance + capability helper.
 *
 * Google Play "no in-app purchase" fix: inside the Android/iOS Capacitor
 * shell, `checkout.stripe.com` is deliberately NOT in `allowNavigation` (see
 * apps/native/capacitor.config.ts), so a real Stripe Checkout link falls
 * through to the system browser — a pattern Google Play Payments policy
 * rejects for subscription apps. This helper lets checkout-adjacent Server
 * Components detect "we're rendering inside the app shell" and suppress any
 * price, button, or link that could lead toward Stripe.
 *
 * iOS StoreKit capability signal (FV-572, FV-210 decision record §4.8): the
 * global token below is fielded on BOTH platforms and is frozen forever for
 * Android. A NEW, additive iOS-only marker (`ios: { appendUserAgent: ... }`
 * in capacitor.config.ts) lets `getShellCapability()` distinguish a new
 * iOS build (capable of a future StoreKit purchase surface) from every
 * existing Android build AND every existing pre-IAP iOS build, without ever
 * touching the frozen Android token. See `getShellCapability()` below for
 * the full classification contract and its authorization boundary.
 *
 * Detection: the shell's WebView requests carry an extra token on the
 * User-Agent header (`appendUserAgent` in capacitor.config.ts). Reading the
 * raw request header server-side is the only signal used — there is no
 * client-side / `navigator.userAgent` equivalent. Client-side sniffing can't
 * gate a Server Component's initial render anyway, and would risk a
 * flash-of-wrong-state on a checkout-adjacent surface.
 */
const NATIVE_SHELL_UA_TOKEN = "FVNativeShell/1";

/**
 * The additive, iOS-only capability marker (FV-572). Only appears on a NEW
 * iOS build shipped after the StoreKit 2 purchase bridge lands
 * (`ios.appendUserAgent` in apps/native/capacitor.config.ts). Every existing
 * Android binary (forever) and every existing pre-IAP iOS binary carries
 * only the bare `NATIVE_SHELL_UA_TOKEN` above and never this marker.
 */
const IOS_SHELL_UA_TOKEN = "FVNativeShell/1 (ios)";

/** The two "we're inside the native shell" classifications a request's
 * User-Agent can resolve to (see `getShellCapability()`). A `null` result
 * means "not the shell" — an ordinary browser or the installed PWA. */
export type ShellCapability = "ios-iap" | "legacy-native";

/**
 * Classifies a raw User-Agent string into a shell capability.
 *
 * ORDER MATTERS: the `(ios)` marker is checked BEFORE the bare token. The
 * marker string CONTAINS the bare token as a substring
 * (`"FVNativeShell/1 (ios)".includes("FVNativeShell/1")` is `true`), so
 * checking the bare token first would misclassify every `ios-iap` UA as
 * `legacy-native`.
 *
 *   - `"ios-iap"` — UA carries `FVNativeShell/1 (ios)`. A new-enough iOS
 *     build that CAN present a StoreKit purchase surface once one ships in a
 *     later FV-572 slice. This slice does not build any purchase UI.
 *   - `"legacy-native"` — UA carries the bare `FVNativeShell/1` WITHOUT the
 *     `(ios)` marker. Fielded on BOTH every Android build (forever — the
 *     Android token is intentionally frozen, FV-478/489/492/493) AND every
 *     iOS build shipped before this capability marker existed. **This value
 *     must NEVER be read as "this is Android."** Treat it as "restricted,
 *     reader-style shell, platform unknown" — exactly how the single flat
 *     token was always treated before this classifier existed, for both
 *     platforms.
 *   - `null` — no token present: an ordinary browser or the installed PWA.
 *
 * *** UA IS A PRESENTATION HINT ONLY — NEVER AUTHORIZATION. ***
 * A `User-Agent` header is client-supplied and trivially spoofable. This
 * classifier may hide/show a button, a notice, or pick a redirect target —
 * nothing more. No entitlement decision, purchase-submission acceptance, or
 * access-level read may ever branch on it (the real, server-side boundary is
 * the authenticated session + `lib/subscriptions/access.ts` / the Apple
 * purchase-verification path). A forged `ios-iap` UA gains an attacker
 * nothing but a different page rendering; the failure direction is always
 * "wrong UI," never "unauthorized access."
 */
export function getShellCapability(
  userAgent: string | null | undefined,
): ShellCapability | null {
  const ua = userAgent ?? "";
  if (ua.includes(IOS_SHELL_UA_TOKEN)) return "ios-iap";
  if (ua.includes(NATIVE_SHELL_UA_TOKEN)) return "legacy-native";
  return null;
}

/**
 * Pure "is this the native shell at all?" check against a raw User-Agent
 * string. Routes through `getShellCapability()` above — `true` for BOTH
 * `ios-iap` and `legacy-native`, exactly as the single flat-token substring
 * check behaved before this classifier existed. No existing call site of
 * this function (or of `isNativeShell()` below) gains any iOS-specific
 * behavior from this change; they all still key off a single boolean.
 *
 * Exported separately from `isNativeShell()` below because Edge Middleware
 * (see middleware.ts / lib/native-shell-router.ts, the entry-point router)
 * reads the header directly off `NextRequest` rather than through
 * `next/headers`' request-scoped `headers()` — `headers()` only works inside
 * a rendered Server Component / Route Handler / Server Action, not
 * Middleware. This function is the single source of truth for the token so
 * both call sites can never drift.
 */
export function isNativeShellUserAgent(
  userAgent: string | null | undefined,
): boolean {
  return getShellCapability(userAgent) !== null;
}

/**
 * True when the current request's `User-Agent` header identifies the native
 * app shell.
 *
 * Reliability note: a `User-Agent` header is client-supplied and therefore
 * spoofable in principle. The failure direction is safe either way — this
 * signal only ever REMOVES a checkout affordance, never grants one. A
 * spoofed "native shell" UA from a real browser would just hide a link that
 * user could otherwise reach (an availability annoyance, not a security or
 * privacy issue); it can never be used to bypass a restriction. Treat this
 * as a UX/compliance signal, not an authorization boundary.
 */
export function isNativeShell(): boolean {
  const userAgent = headers().get("user-agent") ?? "";
  return isNativeShellUserAgent(userAgent);
}

/**
 * The current request's shell CAPABILITY (not just the flat "is it the
 * shell" boolean above) — `"ios-iap"` | `"legacy-native"` | `null`. Mirrors
 * `isNativeShell()`'s exact shape (reads the raw `user-agent` request header
 * via `next/headers`, safe only inside a rendered Server Component / Route
 * Handler / Server Action) but routes through `getShellCapability()` so a
 * checkout-adjacent Server Component (FV-572: `app/subscribe/page.tsx`) can
 * branch three ways — render the iOS purchase surface, the legacy-native
 * compliance notice, or the ordinary web flow — without re-deriving the
 * classification logic at each call site.
 *
 * Same authorization caveat as `isNativeShell()`: this is a UI/presentation
 * hint only, never an entitlement or authorization boundary (see
 * `getShellCapability()`'s doc comment above).
 */
export function getRequestShellCapability(): ShellCapability | null {
  const userAgent = headers().get("user-agent") ?? "";
  return getShellCapability(userAgent);
}
