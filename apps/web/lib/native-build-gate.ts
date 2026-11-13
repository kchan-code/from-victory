import { getShellCapability } from "./native-shell";

/**
 * Minimum-supported-build gate for the store apps (FV-717).
 *
 * Every installed binary loads the live site, so a push to `main` reaches
 * every store user at once on whatever app version they have. This module
 * lets the server (a) read which build a shell is, and (b) decide whether
 * that build is below a per-platform minimum, in which case middleware.ts
 * sends it to /update-required.
 *
 * Build marker: a whole whitespace-delimited `FVBuild/<n>` User-Agent token,
 * where <n> is the store build number (Android `versionCode`, iOS
 * `CFBundleVersion`). It is appended AFTER the platform token and never
 * changes the frozen `FVNativeShell/1` token. Android stamps it at build time
 * (apps/native/scripts/stamp-build-marker.mjs, enforced by Gradle); iOS adds
 * it at runtime from the bundle (FVBridgeViewController.swift).
 *
 * VERSION-LESS SHELLS COUNT AS THE OLDEST (KC decision 2026-11-13). Every
 * binary shipped before FV-717 sends no marker. They are treated as build 0,
 * so setting ANY minimum for a platform gates all of them. That is the point
 * (those are the builds a minimum most needs to reach), and it is why a
 * minimum must not be set for a platform until a build that reports its
 * number is live in that store: before then there is nothing to update to.
 *
 * The minimum is unset by default. Unset, empty, or not a positive whole
 * number means NO gate (fail open: a typo must never lock every user out).
 *
 * Like everything UA-derived, this is a presentation/routing hint, never
 * authorization. A forged UA can only show or skip the update screen.
 */

export type NativePlatform = "ios" | "android";

export const UPDATE_REQUIRED_PATH = "/update-required";

/** Env var names, per platform. Server-side only (never NEXT_PUBLIC_). */
export const MIN_BUILD_ENV: Record<NativePlatform, string> = {
  ios: "NATIVE_MIN_BUILD_IOS",
  android: "NATIVE_MIN_BUILD_ANDROID",
};

/**
 * The two minimums, read with STATIC `process.env.X` references: middleware
 * runs on the Edge runtime, where a computed `process.env[name]` lookup is not
 * guaranteed to resolve. A changed value takes effect on the next deploy.
 */
export function readMinimumBuildEnv(): Record<string, string | undefined> {
  return {
    NATIVE_MIN_BUILD_IOS: process.env.NATIVE_MIN_BUILD_IOS,
    NATIVE_MIN_BUILD_ANDROID: process.env.NATIVE_MIN_BUILD_ANDROID,
  };
}

/** `FVBuild/<digits>` as a whole token, so `XFVBuild/3` or `FVBuild/3a` never match. */
const BUILD_MARKER_PATTERN = /(?:^|\s)FVBuild\/(\d{1,9})(?=\s|$)/;

/**
 * The build number a shell reports, or null when it reports none (every
 * binary shipped before FV-717) or the request is not from the shell.
 */
export function getShellBuild(userAgent: string | null | undefined): number | null {
  const ua = userAgent ?? "";
  if (getShellCapability(ua) === null) return null;
  const match = BUILD_MARKER_PATTERN.exec(ua);
  return match ? Number(match[1]) : null;
}

/**
 * Which store a shell request comes from, or null when it is not the shell
 * (or the platform can't be told, in which case nothing is gated).
 *
 * The platform markers decide when present. A bare `FVNativeShell/1` is
 * fielded on BOTH platforms (see lib/native-shell.ts: `legacy-native` must
 * never be read as "this is Android"), so for it the platform comes from the
 * WebView's own UA: Android WebViews say "Android"; iOS WKWebViews say
 * iPhone / iPad / iPod (or "Macintosh" for an iPad in desktop-class mode).
 */
export function getShellPlatform(
  userAgent: string | null | undefined,
): NativePlatform | null {
  const ua = userAgent ?? "";
  const capability = getShellCapability(ua);
  if (capability === null) return null;
  if (capability === "ios-iap") return "ios";
  if (capability === "android-play") return "android";
  if (/\bAndroid\b/.test(ua)) return "android";
  if (/\b(?:iPhone|iPad|iPod|Macintosh)\b/.test(ua)) return "ios";
  return null;
}

/** A positive whole number, or null (= no minimum). */
export function parseMinimumBuild(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  if (!/^\d{1,9}$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value > 0 ? value : null;
}

/**
 * The platform whose update screen this request must see, or null when it is
 * not gated (not the shell, platform unknown, no minimum set, or the build
 * meets the minimum). A shell that reports no build counts as build 0.
 */
export function resolveUpdateRequired(
  userAgent: string | null | undefined,
  env: Record<string, string | undefined> = readMinimumBuildEnv(),
): NativePlatform | null {
  const platform = getShellPlatform(userAgent);
  if (platform === null) return null;
  const minimum = parseMinimumBuild(env[MIN_BUILD_ENV[platform]]);
  if (minimum === null) return null;
  const build = getShellBuild(userAgent) ?? 0;
  return build < minimum ? platform : null;
}

/**
 * Whether middleware should send this request to the update screen. Only
 * page navigations are redirected: API routes, auth callbacks and non-GET
 * requests (server actions, form posts) pass through, so an in-flight
 * sign-in or purchase submission is never cut off mid-request. The next
 * navigation is gated.
 */
export function shouldRedirectToUpdate(input: {
  method: string;
  pathname: string;
  userAgent: string | null | undefined;
  env?: Record<string, string | undefined>;
}): boolean {
  if (input.method !== "GET" && input.method !== "HEAD") return false;
  const { pathname } = input;
  if (pathname === UPDATE_REQUIRED_PATH) return false;
  if (pathname === "/api" || pathname.startsWith("/api/")) return false;
  if (pathname === "/auth" || pathname.startsWith("/auth/")) return false;
  return resolveUpdateRequired(input.userAgent, input.env) !== null;
}
