import "server-only";

import { headers } from "next/headers";

/**
 * Native-shell compliance helper (Google Play "no in-app purchase" fix).
 *
 * Inside the Android/iOS Capacitor shell, `checkout.stripe.com` is
 * deliberately NOT in `allowNavigation` (see apps/native/capacitor.config.ts),
 * so a real Stripe Checkout link falls through to the system browser — a
 * pattern Google Play Payments policy rejects for subscription apps. This
 * helper lets checkout-adjacent Server Components detect "we're rendering
 * inside the app shell" and suppress any price, button, or link that could
 * lead toward Stripe.
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
 * Pure token check against a raw User-Agent string.
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
  return (userAgent ?? "").includes(NATIVE_SHELL_UA_TOKEN);
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
