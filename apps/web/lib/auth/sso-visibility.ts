import "server-only";

import { cookies, headers } from "next/headers";

import {
  getSsoLevel,
  isSsoPreviewCookieValid,
  SSO_PREVIEW_COOKIE,
  type SsoSurface,
} from "@/lib/auth/apple/config";

// =============================================================================
// showSSO (FV-674, spec FV-569 §3 "Visibility rule").
//
// Server-rendered per request. The result is a PRESENTATION hint only: every
// SSO route/action re-checks its own flag server-side (isAppleSignInEntryAllowed,
// the callback). A spoofed UA gains the buttons on a page, never access.
// Apple and Google are always shown together (guideline 4.8): one boolean.
// =============================================================================

const NATIVE_SHELL_TOKEN = "FVNativeShell/1";
const IOS_SHELL_MARKER = "(ios)";
// TODO(FV-675): replace with hasAuthCapability() from lib/native-shell.ts once
// PR #602 lands. Orthogonal to ShellCapability; never changes it.
const AUTH_CAPABILITY_TOKEN = "FVAuth/1";

/** In-app browsers that block or break Google/Apple OAuth (spec §3). */
const IN_APP_BROWSER_DENYLIST =
  /Instagram|FBAN|FBAV|TikTok|\bLine\/|Snapchat|TwitterAndroid|LinkedInApp|Pinterest/;
const ANDROID_WEBVIEW = /Android[^)]*; wv\)/;
const APPLE_MOBILE = /iPhone|iPad|iPod/;

export type SsoEntry = {
  /** Render the Apple + Google buttons. */
  show: boolean;
  /** Which sign-in implementation the client runs. */
  surface: SsoSurface;
  /** Show "Open in Safari or Chrome..." instead of the buttons. */
  browserHint: boolean;
};

export function hasAuthCapabilityUserAgent(ua: string): boolean {
  return ua.includes(AUTH_CAPABILITY_TOKEN);
}

export function isDenylistedInAppBrowser(ua: string): boolean {
  if (IN_APP_BROWSER_DENYLIST.test(ua) || ANDROID_WEBVIEW.test(ua)) return true;
  // iOS WebKit without "Safari/" is an embedded WKWebView.
  return APPLE_MOBILE.test(ua) && ua.includes("AppleWebKit") && !ua.includes("Safari/");
}

function flagAllows(surface: SsoSurface, previewCookie: string | undefined | null): boolean {
  const level = getSsoLevel(surface);
  if (level === "on") return true;
  if (level === "preview") return isSsoPreviewCookieValid(previewCookie);
  return false;
}

/** Pure core (UA + cookie in, decision out) so the matrix is unit-testable. */
export function resolveSsoEntry(
  userAgent: string | null | undefined,
  previewCookie: string | undefined | null,
): SsoEntry {
  const ua = userAgent ?? "";

  if (ua.includes(NATIVE_SHELL_TOKEN)) {
    const surface: SsoSurface = ua.includes(IOS_SHELL_MARKER) ? "ios" : "android";
    // Older installed shells (no FVAuth/1) never show SSO.
    const show = hasAuthCapabilityUserAgent(ua) && flagAllows(surface, previewCookie);
    return { show, surface, browserHint: false };
  }

  const allowed = flagAllows("web", previewCookie);
  if (allowed && isDenylistedInAppBrowser(ua)) {
    return { show: false, surface: "web", browserHint: true };
  }
  return { show: allowed, surface: "web", browserHint: false };
}

/** Request-bound entry for Server Components (reads UA + preview cookie). */
export function showSSO(): SsoEntry {
  return resolveSsoEntry(
    headers().get("user-agent"),
    cookies().get(SSO_PREVIEW_COOKIE)?.value,
  );
}
