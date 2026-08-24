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
 * attribution SDKs. Any new plugin needs a fresh product + privacy review.
 */

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? "https://www.fromvictoryapp.com";

const config: CapacitorConfig = {
  // Play Console locked this package (immutable).
  appId: "com.fromvictoryapp.app",
  appName: "From Victory",
  webDir: "www",
  // FV-502: WebView background. With targetSdk 36 (Android 16) the OS
  // ignores StatusBar backgroundColor entirely — the edge-to-edge status-bar
  // strip shows whatever is behind it, so the WebView (and the window, see
  // android/app/src/main/res/values/styles.xml) must be brand onyx.
  backgroundColor: "#050505",
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
  },
  ios: {
    contentInset: "automatic",
    // Prefer HTTPS scheme parity with Android when Cap supports it.
    scheme: "From Victory",
  },
};

export default config;
