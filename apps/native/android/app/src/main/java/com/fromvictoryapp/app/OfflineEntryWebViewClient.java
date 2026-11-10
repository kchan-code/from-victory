package com.fromvictoryapp.app;

import android.graphics.Bitmap;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;
import com.getcapacitor.Logger;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * FV-639: Capacitor's client plus offline handling for top-level loads on the
 * app's own host (see {@link OfflineEntryFallback}). Everything else is
 * Capacitor's default.
 */
public class OfflineEntryWebViewClient extends BridgeWebViewClient {

    /** Capacitor copies apps/native/www into the APK at this asset path. */
    private static final String OFFLINE_PAGE_ASSET = "public/index.html";

    private final Bridge bridge;

    /** Pregame retries made in the current offline sequence (main thread only). */
    private int pregameRetries = 0;
    /** The scheduled Pregame retry, if any, so a new entry can cancel it. */
    private Runnable pendingRetry = null;
    /** Whether the current top-level load reported an error. */
    private boolean mainFrameFailed = false;

    public OfflineEntryWebViewClient(Bridge bridge) {
        super(bridge);
        this.bridge = bridge;
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        mainFrameFailed = false;
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        // A Pregame load that finished without a top-level error ends the
        // offline sequence: the next failure starts with a fresh retry budget.
        if (!mainFrameFailed && url != null && url.equals(OfflineEntryFallback.pregameUrl(bridge.getAppUrl()))) {
            pregameRetries = 0;
        }
    }

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        super.onReceivedError(view, request, error);
        if (request.isForMainFrame()) {
            mainFrameFailed = true;
        }
        OfflineEntryFallback.Action action = OfflineEntryFallback.decide(
            request.getUrl().toString(),
            request.isForMainFrame(),
            error.getErrorCode(),
            bridge.getAppUrl(),
            pregameRetries
        );
        // Log the action and error code only — never URLs or user data.
        switch (action) {
            case OPEN_PREGAME:
                String pregame = OfflineEntryFallback.pregameUrl(bridge.getAppUrl());
                if (pregame != null) {
                    Logger.info("FV-639", "entry offline (code " + error.getErrorCode() + ") -> pregame shell");
                    cancelPendingRetry(view);
                    pregameRetries = 0;
                    view.loadUrl(pregame);
                }
                break;
            case RETRY_PREGAME:
                long delay = OfflineEntryFallback.retryDelayMs(pregameRetries);
                pregameRetries++;
                Logger.info("FV-639", "pregame offline (code " + error.getErrorCode() + ") -> local page, retry "
                    + pregameRetries + "/" + OfflineEntryFallback.MAX_PREGAME_RETRIES + " in " + delay + "ms");
                showOfflinePage(view);
                scheduleRetry(view, delay);
                break;
            case SHOW_OFFLINE_PAGE:
                Logger.info("FV-639", "page offline (code " + error.getErrorCode() + ") -> local offline page");
                showOfflinePage(view);
                break;
            default:
                break;
        }
    }

    private void scheduleRetry(WebView view, long delayMs) {
        cancelPendingRetry(view);
        final String pregame = OfflineEntryFallback.pregameUrl(bridge.getAppUrl());
        if (pregame == null) return;
        pendingRetry = () -> {
            pendingRetry = null;
            view.loadUrl(pregame);
        };
        view.postDelayed(pendingRetry, delayMs);
    }

    private void cancelPendingRetry(WebView view) {
        if (pendingRetry != null) {
            view.removeCallbacks(pendingRetry);
            pendingRetry = null;
        }
    }

    private static void showOfflinePage(WebView view) {
        String html = readOfflinePage(view);
        if (html != null) {
            view.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
        } else {
            Logger.warn("FV-639", "offline page asset missing (" + OFFLINE_PAGE_ASSET + "); leaving default error page");
        }
    }

    private static String readOfflinePage(WebView view) {
        try (InputStream in = view.getContext().getAssets().open(OFFLINE_PAGE_ASSET)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int n;
            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
            }
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            return null;
        }
    }
}
