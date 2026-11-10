package com.fromvictoryapp.app;

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

    public OfflineEntryWebViewClient(Bridge bridge) {
        super(bridge);
        this.bridge = bridge;
    }

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        super.onReceivedError(view, request, error);
        OfflineEntryFallback.Action action = OfflineEntryFallback.decide(
            request.getUrl().toString(),
            request.isForMainFrame(),
            error.getErrorCode(),
            bridge.getAppUrl()
        );
        // Log the action and error code only — never URLs or user data.
        switch (action) {
            case OPEN_PREGAME:
                String pregame = OfflineEntryFallback.pregameUrl(bridge.getAppUrl());
                if (pregame != null) {
                    Logger.info("FV-639", "entry offline (code " + error.getErrorCode() + ") -> pregame shell");
                    view.loadUrl(pregame);
                }
                break;
            case SHOW_OFFLINE_PAGE:
                String html = readOfflinePage(view);
                if (html != null) {
                    Logger.info("FV-639", "page offline (code " + error.getErrorCode() + ") -> local offline page");
                    view.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
                } else {
                    Logger.warn("FV-639", "offline page asset missing (" + OFFLINE_PAGE_ASSET + "); leaving default error page");
                }
                break;
            default:
                break;
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
