package com.fromvictoryapp.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FVNarrationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
