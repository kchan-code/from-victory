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
  server: {
    url: serverUrl,
    androidScheme: "https",
    // Top-level navigations outside this list open in the system browser.
    // Keep this narrow — a trusted-shell WebView that can roam the open web
    // is a minor-safety hole. Do not add analytics or ad domains.
    allowNavigation: ["www.fromvictoryapp.com", "fromvictoryapp.com"],
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#050505",
      launchAutoHide: true,
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#050505",
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
