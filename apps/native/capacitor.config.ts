import type { CapacitorConfig } from "@capacitor/cli";

/**
 * From Victory — Capacitor native shell.
 *
 * Architecture (locked for this scaffold):
 *   The WebView loads the hosted Next.js app over HTTPS (server.url).
 *   We do NOT static-export apps/web into webDir — App Router SSR, auth
 *   middleware, server actions, and Stripe cannot ship as pure static assets
 *   without a rearchitecture. The local `www/` folder is only a cold-start /
 *   offline fallback page.
 *
 * App ID is locked to `com.fromvictoryapp.app`. Play Console already
 * registered that package (immutable). Keep Android applicationId, iOS
 * PRODUCT_BUNDLE_IDENTIFIER, and this appId identical so `cap sync`
 * does not fork the platforms.
 *
 * Plugin allowlist (product-strategist): core, app, splash-screen, status-bar,
 * android, ios. No push-notifications (device token), analytics, ads, or
 * attribution SDKs of ours. FV-664: an app-local FVPlayBillingPlugin exists ONLY
 * in FV_PLAY_BILLING=1 builds. Those builds carry Google's Play Billing Library
 * and its own transitive Google components (datatransport telemetry transport,
 * Play services base/tasks/location, firebase-encoders), so do not describe a
 * billing build as free of third-party or telemetry code (FV-667 owns the
 * Data safety form and privacy text). App-local FVNarration transfers only the assembled narration
 * WAV to the native audio player; it has no music-provider or library access.
 * App-local FVAuth is a system-browser / Sign in with Apple bridge (no
 * third-party SDK; parents and 18+ only, enforced server-side);
 * product-strategist approved FV-675, kids-privacy-officer review required.
 * Any new plugin needs a fresh product + privacy review.
 */

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? "https://www.fromvictoryapp.com";

// FV-664: the ONE Play Billing build switch. `FV_PLAY_BILLING=1` must be set for BOTH
// `npx cap sync` (this file) and Gradle (android/app/build.gradle); the Gradle task
// verifyPlayBillingSwitch fails a build where the two disagree. Unset = today's 1.0.x shell.
const playBilling = process.env.FV_PLAY_BILLING === "1";

const config: CapacitorConfig = {
  // Play Console locked this package (immutable).
  appId: "com.fromvictoryapp.app",
  appName: "From Victory",
  webDir: "www",
  server: {
    url: serverUrl,
    androidScheme: "https",
    // Top-level navigations outside this list open in the system browser.
    // Keep this narrow — a trusted-shell WebView that can roam the open web
    // is a minor-safety hole. Do not add analytics or ad domains.
    allowNavigation: ["www.fromvictoryapp.com", "fromvictoryapp.com"],
  },
  // Google Play "no in-app purchase" compliance: identifies WebView requests
  // as coming from the native shell so the Next.js app (server-side, via
  // apps/web/lib/native-shell.ts) can suppress any UI path to Stripe
  // Checkout — checkout.stripe.com is intentionally NOT in allowNavigation
  // above, so a real Stripe link would fall through to the system browser,
  // which Play Payments policy rejects for subscriptions. Do not add a Stripe
  // domain to allowNavigation to "fix" that instead.
  //
  // MUST stay at the TOP LEVEL of CapacitorConfig (or under `android`/`ios`).
  // It is NOT a key of `server` — Capacitor silently ignores unknown keys
  // there, so nesting it inside `server` compiles fine, ships, and does
  // nothing. That shipped once (FV-478) and left the whole compliance fix
  // inert on a real device while every server-side test still passed.
  appendUserAgent: "FVNativeShell/1",
  plugins: {
    // FV-502: Capacitor 8 moved system-bar control into the core SystemBars
    // plugin. "DARK" = dark bars with LIGHT icons. Without this it falls
    // back to the device day/night mode (LIGHT by day = dark icons on our
    // onyx strip). The legacy StatusBar block below stays for older-device
    // (< Android 15) color painting.
    SystemBars: {
      style: "DARK",
    },
    SplashScreen: {
      backgroundColor: "#050505",
      launchAutoHide: true,
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#050505",
      // FV-484: Android 15 (targetSdk 35, see android/variables.gradle)
      // enforces edge-to-edge windowing app-wide — the OS no longer honors a
      // plain "reserve the status bar" request at the window level on its
      // own. Capacitor 7's Android bridge reads this flag and, when false,
      // pads the WebView host view by the live system-bar inset itself, so
      // the header renders below the status bar on every device/cutout shape
      // without any web-side CSS change. Leaving this unset falls back to
      // the plugin default (`true` = overlay), which let the WebView draw
      // full-bleed under the status bar and caused the header/logo/"Sign in"
      // pill collision this fixes. `false` also makes `backgroundColor`
      // above actually render (it only paints a real, non-overlaid status
      // bar strip) — it was inert before this. Native-shell-only key: the
      // hosted Next.js app (apps/web) has no viewport-fit=cover / safe-area
      // change, so browser and installed-PWA layout is unaffected.
      overlaysWebView: false,
    },
  },
  android: {
    allowMixedContent: false,
    // FV-502: WebView background. With targetSdk 36 (Android 16) the OS
    // ignores StatusBar backgroundColor entirely — the edge-to-edge status-bar
    // strip shows whatever is behind it, so the WebView (and the window, see
    // android/app/src/main/res/values/styles.xml) must be brand onyx.
    // Android-scoped on purpose: a top-level key would also repaint the live
    // iOS WKWebView (ios.backgroundColor ?? backgroundColor) on its next build.
    backgroundColor: "#050505",
    // FV-664: additive Play Billing capability marker (FV-651 record §6), present ONLY in builds
    // made with FV_PLAY_BILLING=1 — the same builds that carry the billing plugin. Capacitor's
    // per-platform key overrides the top-level token for Android only; without the switch this
    // key is absent and Android keeps shipping the bare, byte-identical top-level token. Never
    // add this key unconditionally, and never change the top-level token.
    ...(playBilling ? { appendUserAgent: "FVNativeShell/1 (play)" } : {}),
  },
  ios: {
    contentInset: "automatic",
    // FV-735: do not set `scheme` here. In Capacitor 8, `ios.scheme` is the
    // Xcode scheme `npx cap run ios` builds (default "App", which is this
    // project's scheme). It is not a WKWebView URL scheme. The old value
    // "From Victory" matched no scheme in App.xcodeproj. A custom URL scheme
    // would be `server.iosScheme`, which stays unset so local assets keep
    // Capacitor's default `capacitor` scheme. The WebView loads `server.url`.
    // FV-572: additive, iOS-only capability marker. Capacitor's per-platform
    // keys OVERRIDE the top-level `appendUserAgent` above for that platform
    // only — Android is untouched and keeps shipping the bare, byte-identical
    // token forever (FV-478/489/492/493 depend on it never changing). Only a
    // NEW iOS build (one that ships the StoreKit 2 purchase bridge) carries
    // this value; every already-fielded iOS/TestFlight binary keeps sending
    // the bare top-level token above and is treated identically to Android by
    // the server-side classifier (apps/web/lib/native-shell.ts
    // getShellCapability(): "(ios)" marker present → `ios-iap`; bare token
    // only → `legacy-native`, restricted reader-style, unchanged). See the
    // FV-210 decision record §4.8 for the full contract. Do NOT touch the
    // top-level key or add an `android.appendUserAgent` override to "fix"
    // anything here.
    appendUserAgent: "FVNativeShell/1 (ios)",
  },
};

/**
 * FV-675 (SSO P0): staging-only FVAuth build switch.
 *
 * `FV_SSO_STAGING_BUILD=1` at `cap sync` / `cap copy` time produces a STAGING
 * shell that advertises the app-local FVAuth plugin to the server. With the
 * env unset (every production build), `config` above is exported untouched,
 * so the generated capacitor.config.json stays byte-identical to the pre-SSO
 * build and no production UA string changes (FV-620 C1 owns the production
 * Android override; the FV-569 spec §13a serializes those edits).
 *
 * What the switch changes, and nothing else:
 *   - UA: appends the `FVAuth/1` capability marker to each platform's
 *     EFFECTIVE token. iOS becomes "FVNativeShell/1 (ios) FVAuth/1". Android
 *     gets a per-platform override of its effective token plus the marker:
 *     "FVNativeShell/1 FVAuth/1", or "FVNativeShell/1 (play) FVAuth/1" when
 *     FV-664's `FV_PLAY_BILLING=1` has set the `(play)` token in `config`. The
 *     top-level bare token never changes. The marker is a presentation hint
 *     only (apps/web/lib/native-shell.ts `hasAuthCapability`), never
 *     authorization.
 *   - allowNavigation: adds the staging WEB host so the WebView can stay on
 *     the staging site. The staging Supabase host is deliberately NOT added:
 *     provider sign-in must run in the system browser (FVAuth.startSession),
 *     never inside the WebView. Still no Stripe host.
 *   - plugins.FVAuth.stagingHosts: tells the native FVAuth plugin to accept
 *     the staging hosts on top of its hard-coded production allow-list. The
 *     host lists themselves live natively (FVAuthPlugin.swift /
 *     FVAuthPlugin.java); this boolean is baked into the app bundle and is
 *     not reachable from page JavaScript.
 *
 * Staging build: FV_SSO_STAGING_BUILD=1
 *   CAPACITOR_SERVER_URL=https://fv-android-staging-web.vercel.app npx cap sync
 */
const FVAUTH_UA_MARKER = "FVAuth/1";
const SSO_STAGING_NAVIGATION_HOSTS = ["fv-android-staging-web.vercel.app"];
const SSO_STAGING_ORIGIN = "https://fv-android-staging-web.vercel.app";

export function withSsoStagingBuild(base: CapacitorConfig): CapacitorConfig {
  const globalToken = base.appendUserAgent ?? "";
  const iosToken = base.ios?.appendUserAgent ?? globalToken;
  const androidToken = base.android?.appendUserAgent ?? globalToken;
  return {
    ...base,
    server: {
      ...base.server,
      allowNavigation: [
        ...(base.server?.allowNavigation ?? []),
        ...SSO_STAGING_NAVIGATION_HOSTS,
      ],
    },
    plugins: {
      ...base.plugins,
      FVAuth: { stagingHosts: true },
    },
    android: {
      ...base.android,
      appendUserAgent: `${androidToken} ${FVAUTH_UA_MARKER}`,
    },
    ios: {
      ...base.ios,
      appendUserAgent: `${iosToken} ${FVAUTH_UA_MARKER}`,
    },
  };
}

/**
 * Build switches compose in a fixed order on top of the unchanged `config`:
 *   1. platform-token switches, which SET a platform's base UA token
 *      (FV-664's FV_PLAY_BILLING sets `android.appendUserAgent =
 *      "FVNativeShell/1 (play)"` inside `config` itself, above);
 *   2. capability-marker switches, which APPEND to whatever token is then in
 *      effect (FV_SSO_STAGING_BUILD → " FVAuth/1").
 * With every env unset, `buildConfig` is `config` itself.
 */
let buildConfig: CapacitorConfig = config;
// 1. Platform-token switches: already applied in `config` (FV-664 FV_PLAY_BILLING).
// 2. Capability markers, appended to the token in effect after step 1.
if (process.env.FV_SSO_STAGING_BUILD === "1") {
  // A staging switch on a production-URL shell would advertise FVAuth/1
  // without `(play)` and widen the native allow-list (spec §13a). Refuse.
  if (new URL(serverUrl).origin !== SSO_STAGING_ORIGIN) {
    throw new Error(
      `FV_SSO_STAGING_BUILD=1 requires CAPACITOR_SERVER_URL=${SSO_STAGING_ORIGIN}`,
    );
  }
  buildConfig = withSsoStagingBuild(buildConfig);
}

export default buildConfig;
