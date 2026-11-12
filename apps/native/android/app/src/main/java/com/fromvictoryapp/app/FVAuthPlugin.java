package com.fromvictoryapp.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import androidx.activity.result.ActivityResultLauncher;
import androidx.browser.auth.AuthTabIntent;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsIntent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * FV-675 (SSO P0, FV-569 spec §5.3, §5.4, §6): app-local sign-in bridge. No third-party SDK.
 *
 * <p>Google runs as Supabase-hosted OAuth and Apple as our own /auth/apple/start route, both in
 * the system browser: an Auth Tab (androidx.browser 1.9) when the browser supports it, otherwise
 * a Custom Tab whose custom-scheme redirect reaches MainActivity (singleTask) through the {@code
 * com.fromvictoryapp.app://auth/callback} VIEW intent-filter and {@link #handleOnNewIntent}. The
 * WebView then finishes the exchange with ITS OWN verifier (PKCE / handoff), so a callback URL is
 * useless on its own (RFC 8252 §8.1).
 *
 * <p>PLUGIN CONTRACT — must match apps/web/lib/native/auth.ts EXACTLY. Every method RESOLVES
 * (never rejects):
 *
 * <pre>
 *   startSession({ url })
 *     -> { ok: true, url }   // the com.fromvictoryapp.app://auth/callback… URL
 *      | { ok: false, error: "cancelled" | "busy" | "rejected_url" | "failed" }
 *   signInWithApple({ nonceHash })
 *     -> { ok: false, error: "unsupported" }   // Android uses the §5.4 handoff instead
 * </pre>
 *
 * <p>HARDENING: the callback scheme is hard-coded here (never read from JS); startSession only
 * opens https URLs whose host is on the native allow-list (staging hosts only when the build was
 * synced with FV_SSO_STAGING_BUILD=1, i.e. plugins.FVAuth.stagingHosts in the bundled config);
 * one session at a time; nothing logs a URL, code or token.
 */
@CapacitorPlugin(name = "FVAuth")
public class FVAuthPlugin extends Plugin {
    private static final String TAG = "FVAuth";

    static final String CALLBACK_SCHEME = "com.fromvictoryapp.app";
    static final String CALLBACK_HOST = "auth";
    static final String CALLBACK_PATH = "/callback";

    static final Set<String> PRODUCTION_HOSTS =
            Collections.unmodifiableSet(
                    new HashSet<>(
                            java.util.Arrays.asList(
                                    "kumrgeosgzdlxgljbyju.supabase.co", "www.fromvictoryapp.com")));
    static final Set<String> STAGING_HOSTS =
            Collections.unmodifiableSet(
                    new HashSet<>(
                            java.util.Arrays.asList(
                                    "xmznvajmljhfmexjthlz.supabase.co",
                                    "fv-android-staging-web.vercel.app")));

    /** How long after returning to the app, without a callback, a Custom Tab counts as closed. */
    private static final long CUSTOM_TAB_CANCEL_GRACE_MS = 750;

    private enum Mode {
        AUTH_TAB,
        CUSTOM_TAB
    }

    // All mutable state below is main-thread confined.
    private final Handler main = new Handler(Looper.getMainLooper());
    private Set<String> allowedHosts = PRODUCTION_HOSTS;
    private ActivityResultLauncher<Intent> authTabLauncher;
    private PluginCall pendingCall;
    private Mode pendingMode;
    private boolean pausedSinceLaunch;
    private final Runnable customTabCancelCheck =
            () -> {
                if (pendingCall != null && pendingMode == Mode.CUSTOM_TAB) {
                    finish(error("cancelled"));
                }
            };

    @Override
    public void load() {
        boolean staging = getConfig().getBoolean("stagingHosts", false);
        if (staging) {
            Set<String> hosts = new HashSet<>(PRODUCTION_HOSTS);
            hosts.addAll(STAGING_HOSTS);
            allowedHosts = Collections.unmodifiableSet(hosts);
        }
        // load() runs inside BridgeActivity.onCreate, before the activity is STARTED — the only
        // point an ActivityResultLauncher may be registered.
        // A registration failure must never crash a production cold start for a
        // feature that may not be in use: leave the launcher null and start()
        // falls back to a Custom Tab.
        try {
            authTabLauncher =
                    AuthTabIntent.registerActivityResultLauncher(getActivity(), this::onAuthTabResult);
        } catch (RuntimeException e) {
            authTabLauncher = null;
            Log.w(TAG, "Auth Tab launcher unavailable; Custom Tab fallback only");
        }
        Log.i(TAG, "loaded; staging allow-list: " + staging);
    }

    // -------------------------------------------------------------------------------------------
    // Validation (pure)
    // -------------------------------------------------------------------------------------------

    /** https only, host on the allow-list, no userinfo, default port only, strict RFC 3986 parse. */
    static boolean isAllowedStartUrl(String raw, Set<String> allowedHosts) {
        if (raw == null || raw.isEmpty()) return false;
        java.net.URI strict;
        try {
            strict = new java.net.URI(raw);
        } catch (java.net.URISyntaxException e) {
            return false;
        }
        String scheme = strict.getScheme();
        String host = strict.getHost();
        if (scheme == null || !scheme.equalsIgnoreCase("https")) return false;
        if (host == null || host.isEmpty()) return false;
        if (strict.getRawUserInfo() != null) return false;
        if (strict.getPort() != -1 && strict.getPort() != 443) return false;
        String normalized = host.toLowerCase(java.util.Locale.ROOT);
        if (!allowedHosts.contains(normalized)) return false;
        // The browser receives android.net.Uri's view of the same string; refuse any parser
        // disagreement on the host rather than trust either one alone.
        Uri lenient = Uri.parse(raw);
        String lenientHost = lenient.getHost();
        return lenientHost != null
                && lenientHost.toLowerCase(java.util.Locale.ROOT).equals(normalized)
                && lenient.getUserInfo() == null;
    }

    /** The only callback the plugin hands back: com.fromvictoryapp.app://auth/callback… */
    static boolean isExpectedCallback(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme();
        String host = uri.getHost();
        return scheme != null
                && scheme.equalsIgnoreCase(CALLBACK_SCHEME)
                && host != null
                && host.equalsIgnoreCase(CALLBACK_HOST)
                && CALLBACK_PATH.equals(uri.getPath());
    }

    // -------------------------------------------------------------------------------------------
    // startSession
    // -------------------------------------------------------------------------------------------

    @PluginMethod
    public void startSession(PluginCall call) {
        final String raw = call.getString("url", "");
        main.post(() -> start(call, raw));
    }

    private void start(PluginCall call, String raw) {
        if (pendingCall != null) {
            call.resolve(error("busy"));
            return;
        }
        if (!isAllowedStartUrl(raw, allowedHosts)) {
            Log.i(TAG, "startSession: rejected_url");
            call.resolve(error("rejected_url"));
            return;
        }
        Uri uri = Uri.parse(raw);
        String browser = CustomTabsClient.getPackageName(getContext(), null);
        boolean authTab =
                browser != null
                        && authTabLauncher != null
                        && CustomTabsClient.isAuthTabSupported(getContext(), browser);
        pendingCall = call;
        pausedSinceLaunch = false;
        try {
            if (authTab) {
                pendingMode = Mode.AUTH_TAB;
                AuthTabIntent intent = new AuthTabIntent.Builder().build();
                intent.intent.setPackage(browser);
                intent.launch(authTabLauncher, uri, CALLBACK_SCHEME);
            } else {
                pendingMode = Mode.CUSTOM_TAB;
                CustomTabsIntent intent = new CustomTabsIntent.Builder().build();
                if (browser != null) intent.intent.setPackage(browser);
                intent.launchUrl(getActivity(), uri);
            }
            Log.i(TAG, "startSession: launched " + pendingMode);
        } catch (ActivityNotFoundException | IllegalStateException e) {
            Log.w(TAG, "startSession: launch failed (" + e.getClass().getSimpleName() + ")");
            finish(error("failed"));
        }
    }

    private void onAuthTabResult(AuthTabIntent.AuthResult result) {
        // Delivered on the main thread by the Activity Result API.
        if (pendingCall == null || pendingMode != Mode.AUTH_TAB) return;
        if (result.resultCode == AuthTabIntent.RESULT_OK) {
            deliverCallback(result.resultUri);
        } else if (result.resultCode == AuthTabIntent.RESULT_CANCELED) {
            finish(error("cancelled"));
        } else {
            Log.w(TAG, "startSession: auth tab result " + result.resultCode);
            finish(error("failed"));
        }
    }

    /** Custom Tab fallback: the custom-scheme redirect re-enters MainActivity (singleTask). */
    @Override
    protected void handleOnNewIntent(Intent intent) {
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction())) return;
        Uri data = intent.getData();
        if (!isExpectedCallback(data)) return;
        main.post(
                () -> {
                    // Only a Custom Tab session accepts the VIEW route; an Auth Tab session returns
                    // through its activity result only, so a stray intent cannot answer it.
                    if (pendingCall == null || pendingMode != Mode.CUSTOM_TAB) return;
                    deliverCallback(data);
                });
    }

    @Override
    protected void handleOnPause() {
        main.post(
                () -> {
                    if (pendingCall != null) pausedSinceLaunch = true;
                });
    }

    /**
     * Back in the app with no callback = the athlete closed the Custom Tab. onNewIntent is
     * delivered before onResume, so a real callback has already resolved by now; the grace period
     * only absorbs ordering quirks.
     */
    @Override
    protected void handleOnResume() {
        main.post(
                () -> {
                    if (pendingCall != null && pendingMode == Mode.CUSTOM_TAB && pausedSinceLaunch) {
                        main.removeCallbacks(customTabCancelCheck);
                        main.postDelayed(customTabCancelCheck, CUSTOM_TAB_CANCEL_GRACE_MS);
                    }
                });
    }

    @Override
    protected void handleOnDestroy() {
        main.removeCallbacks(customTabCancelCheck);
        if (pendingCall != null) finish(error("cancelled"));
    }

    private void deliverCallback(Uri uri) {
        if (!isExpectedCallback(uri)) {
            Log.w(TAG, "startSession: unexpected callback shape");
            finish(error("failed"));
            return;
        }
        JSObject ok = new JSObject();
        ok.put("ok", true);
        ok.put("url", uri.toString());
        finish(ok);
    }

    private void finish(JSObject result) {
        main.removeCallbacks(customTabCancelCheck);
        PluginCall call = pendingCall;
        pendingCall = null;
        pendingMode = null;
        pausedSinceLaunch = false;
        if (call != null) call.resolve(result);
    }

    // -------------------------------------------------------------------------------------------
    // signInWithApple — iOS only. Android Apple sign-in is the §5.4 Auth Tab + handoff flow.
    // -------------------------------------------------------------------------------------------

    @PluginMethod
    public void signInWithApple(PluginCall call) {
        call.resolve(error("unsupported"));
    }

    private static JSObject error(String code) {
        JSObject result = new JSObject();
        result.put("ok", false);
        result.put("error", code);
        return result;
    }
}
