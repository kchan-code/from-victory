package com.fromvictoryapp.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private OfflineEntryWebViewClient offlineEntryClient;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FVNarrationPlugin.class);
        // FV-675: app-local sign-in bridge (Auth Tab / Custom Tab). Host allow-list and the
        // callback scheme are hard-coded in FVAuthPlugin; product + privacy reviewed.
        registerPlugin(FVAuthPlugin.class);
        super.onCreate(savedInstanceState);
        // FV-639: offline cold start opens the SW-cached Pregame shell instead
        // of a blank screen. Set before any load callback is dispatched.
        offlineEntryClient = new OfflineEntryWebViewClient(bridge);
        bridge.setWebViewClient(offlineEntryClient);
    }

    @Override
    public void onDestroy() {
        // Never let a scheduled offline retry run against a torn-down WebView.
        if (offlineEntryClient != null) {
            offlineEntryClient.cancelPendingRetry();
        }
        super.onDestroy();
    }
}
