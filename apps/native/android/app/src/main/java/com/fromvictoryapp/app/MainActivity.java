package com.fromvictoryapp.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    private OfflineEntryWebViewClient offlineEntryClient;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FVNarrationPlugin.class);
        registerPlayBillingIfEnabled();
        super.onCreate(savedInstanceState);
        // FV-639: offline cold start opens the SW-cached Pregame shell instead
        // of a blank screen. Set before any load callback is dispatched.
        offlineEntryClient = new OfflineEntryWebViewClient(bridge);
        bridge.setWebViewClient(offlineEntryClient);
    }

    /**
     * FV-664 build switch. BuildConfig.FV_PLAY_BILLING is true only for builds made with
     * FV_PLAY_BILLING=1 (see app/build.gradle), which are also the only builds that compile the
     * plugin. Reflection keeps the default build free of any billing class reference. With the
     * flag on, a missing class is a packaging bug and must fail loudly, not silently ship a
     * "(play)" shell that cannot sell.
     */
    @SuppressWarnings("unchecked")
    private void registerPlayBillingIfEnabled() {
        if (!BuildConfig.FV_PLAY_BILLING) return;
        try {
            registerPlugin((Class<? extends Plugin>) Class.forName("com.fromvictoryapp.app.FVPlayBillingPlugin"));
        } catch (ClassNotFoundException e) {
            throw new IllegalStateException("FV_PLAY_BILLING build is missing FVPlayBillingPlugin", e);
        }
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
