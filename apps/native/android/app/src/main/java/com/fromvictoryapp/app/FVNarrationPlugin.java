package com.fromvictoryapp.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.WebViewListener;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.List;

/** App-local narration bridge; no provider, network, library, or account access. */
@CapacitorPlugin(name = "FVNarration")
public class FVNarrationPlugin extends Plugin {
    private final Handler main = new Handler(Looper.getMainLooper());
    private FVNarrationService service;
    private boolean bound;
    private boolean destroyed;
    private final List<Pending> pending = new ArrayList<>();
    private interface Command { void run(FVNarrationService service, PluginCall call) throws Exception; }
    private static final class Pending {
        final PluginCall call;
        final Command command;
        Pending(PluginCall call, Command command) { this.call = call; this.command = command; }
    }
    private final ServiceConnection connection = new ServiceConnection() {
        @Override public void onServiceConnected(ComponentName name, IBinder binder) {
            service = ((FVNarrationService.LocalBinder) binder).getService();
            for (Pending item : new ArrayList<>(pending)) execute(item);
            pending.clear();
        }
        @Override public void onServiceDisconnected(ComponentName name) {
            service = null;
            rejectPending("Narration service disconnected");
        }
    };
    private final WebViewListener navigation = new WebViewListener() {
        @Override public void onPageStarted(WebView view) { resetSession(); }
        @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            resetSession();
            return false;
        }
    };
    @Override public void load() {
        main.post(() -> {
            if (destroyed) return;
            bridge.addWebViewListener(navigation);
            bound = getContext().bindService(new Intent(getContext(), FVNarrationService.class), connection, Context.BIND_AUTO_CREATE);
            if (!bound) rejectPending("Narration service unavailable");
        });
    }
    private void resetSession() {
        main.post(() -> {
            rejectPending("Page changed");
            if (service != null) service.reset();
        });
    }
    private void rejectPending(String message) {
        for (Pending item : pending) item.call.reject(message);
        pending.clear();
    }
    private void execute(Pending item) {
        try { item.command.run(service, item.call); }
        catch (Exception exception) { item.call.reject("Narration operation failed", "NARRATION_FAILED", exception); }
    }
    private void dispatch(PluginCall call, Command command) {
        main.post(() -> {
            if (destroyed) { call.reject("Narration bridge closed"); return; }
            Pending item = new Pending(call, command);
            if (service != null) execute(item);
            else if (bound) pending.add(item);
            else call.reject("Narration service unavailable");
        });
    }
    @PluginMethod public void begin(PluginCall call) { dispatch(call, FVNarrationService::begin); }
    @PluginMethod public void append(PluginCall call) { dispatch(call, FVNarrationService::append); }
    @PluginMethod public void prepare(PluginCall call) { dispatch(call, FVNarrationService::prepare); }
    @PluginMethod public void play(PluginCall call) { dispatch(call, FVNarrationService::play); }
    @PluginMethod public void pause(PluginCall call) { dispatch(call, FVNarrationService::pause); }
    @PluginMethod public void getStatus(PluginCall call) { dispatch(call, FVNarrationService::getStatus); }
    @PluginMethod public void dispose(PluginCall call) { dispatch(call, FVNarrationService::dispose); }
    @Override protected void handleOnDestroy() {
        main.post(() -> {
            destroyed = true;
            bridge.removeWebViewListener(navigation);
            rejectPending("Narration bridge closed");
            if (service != null) service.reset();
            if (bound) getContext().unbindService(connection);
            bound = false;
            service = null;
        });
    }
}
