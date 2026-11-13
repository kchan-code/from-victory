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
 * (Gradle task `stampNativeBuildMarker`, apps/native/android/app/build.gradle);
 * iOS adds it at runtime from the bundle (FVBridgeViewController.swift).
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
 *
 * KNOWN LIMIT: a navigation the service worker re-issues loses the shell's
 * appended User-Agent (FV-489/FV-493, device-verified), so it reaches the
 * server looking like a browser and is NOT gated. Every sign-in, account and
 * purchase route is on the worker's bypass list and so IS gated; what can
 * slip through are the worker-handled public pages and the cached, PII-free
 * /athlete/pregame shell. For the same reason /update-required is on the
 * bypass list, and the redirect carries the platform in the query string so
 * the screen still renders if the UA is lost anyway (for example under a
 * service worker installed before FV-717).
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

/** Query parameter that carries the platform to the update screen. */
export const UPDATE_PLATFORM_PARAM = "p";

/**
 * Where middleware should send this request, or null to let it through.
 * Only page navigations are redirected: API routes, auth callbacks and
 * non-GET requests (server actions, form posts) pass through, so an
 * in-flight sign-in or purchase submission is never cut off mid-request.
 * The next navigation is gated.
 *
 * The target carries the platform (`/update-required?p=android`) because the
 * request for the update screen itself may arrive without the shell's UA
 * (see KNOWN LIMIT above); the screen then still knows which store to link.
 */
export function resolveUpdateRedirect(input: {
  method: string;
  pathname: string;
  userAgent: string | null | undefined;
  env?: Record<string, string | undefined>;
}): string | null {
  if (input.method !== "GET" && input.method !== "HEAD") return null;
  const { pathname } = input;
  if (pathname === UPDATE_REQUIRED_PATH) return null;
  if (pathname === "/api" || pathname.startsWith("/api/")) return null;
  if (pathname === "/auth" || pathname.startsWith("/auth/")) return null;
  const platform = resolveUpdateRequired(input.userAgent, input.env);
  if (platform === null) return null;
  return `${UPDATE_REQUIRED_PATH}?${UPDATE_PLATFORM_PARAM}=${platform}`;
}

/** The platform named by the update screen's query parameter, if valid. */
export function parseUpdatePlatformParam(
  value: string | string[] | undefined,
): NativePlatform | null {
  const single = Array.isArray(value) ? value[0] : value;
  return single === "ios" || single === "android" ? single : null;
}
