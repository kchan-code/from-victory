package com.fromvictoryapp.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // FV-639: offline cold start opens the SW-cached Pregame shell instead
        // of a blank screen. Set before any load callback is dispatched.
        bridge.setWebViewClient(new OfflineEntryWebViewClient(bridge));
    }
}
