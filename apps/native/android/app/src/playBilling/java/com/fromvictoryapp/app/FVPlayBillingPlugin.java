package com.fromvictoryapp.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import com.android.billingclient.api.AccountIdentifiers;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.WebViewListener;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.json.JSONObject;

/**
 * Google Play Billing bridge (FV-664). Compiled and registered ONLY when the FV_PLAY_BILLING build
 * switch is on (see android/app/build.gradle).
 *
 * Contract (mirrors apps/web/lib/native/play-billing.ts, the source of truth for the JS side):
 *   getProducts({ productIds })  -> { ok:true, products:[...] } | { ok:false, error }
 *       (malformed ids are dropped, duplicates collapsed; more than 20 ids is INVALID_ARGUMENT)
 *   purchase({ productId, basePlanId, offerId?, obfuscatedAccountId, replace? })
 *       -> { status:"purchased", purchaseToken, productId } | { status:"cancelled" }
 *        | { status:"pending" } | { status:"error", error }
 *        | { status:"deferred", purchaseToken|null, productId|null }   (replace mode DEFERRED only)
 *       (malformed arguments are REJECTED with code INVALID_ARGUMENT; an error may also carry
 *        a non-sensitive `reason` slug, which the JS wrapper ignores)
 *   restore()                    -> { ok:true, purchases:[...] } | { ok:false, error }
 *   manageSubscriptions({ productId? }) -> { ok:true } | { ok:false, error }
 *
 * Hard rules: never acknowledges or consumes a purchase (the server does), makes no network calls
 * of its own, persists nothing, and never logs a purchase token or the obfuscated account id.
 * Prices come only from Play's ProductDetails.
 */
@CapacitorPlugin(name = "FVPlayBillingPlugin")
public class FVPlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private final Handler main = new Handler(Looper.getMainLooper());

    // All fields below are touched on the main thread only.
    private BillingClient client;
    private boolean connecting;
    private boolean destroyed;
    private final List<Waiter> waiters = new ArrayList<>();
    private PluginCall purchaseCall;
    private String purchaseProductId;
    private boolean purchaseDeferred;

    private interface Ready { void run(BillingClient c); }
    private interface Failed { void run(int responseCode); }
    private static final class Waiter {
        final Ready ready;
        final Failed failed;
        Waiter(Ready ready, Failed failed) { this.ready = ready; this.failed = failed; }
    }
    private static final class PurchaseRequest {
        String productId;
        String basePlanId;
        String offerId;
        String obfuscatedAccountId;
        String oldPurchaseToken;
        int replacementMode;
    }

    private final WebViewListener navigation = new WebViewListener() {
        // A full page navigation kills the JS promise; drop our reference so a stuck flow can
        // never block future purchases. The server learns of any completed purchase via restore().
        @Override public void onPageStarted(WebView view) { main.post(() -> clearPurchase()); }
    };

    private void clearPurchase() {
        purchaseCall = null;
        purchaseProductId = null;
        purchaseDeferred = false;
    }

    /** Runs {@code body} now; an unexpected exception runs {@code onError} instead of crashing the app. */
    private static void guarded(Runnable body, Runnable onError) {
        try {
            body.run();
        } catch (RuntimeException e) {
            // Deliberately not logged: the exception may carry call data.
            try { onError.run(); } catch (RuntimeException ignored) { /* nothing left to do */ }
        }
    }

    /**
     * Billing callbacks are not guaranteed to arrive on the main thread, and launchBillingFlow
     * must be called from it. Every callback body goes through here so plugin state really is
     * main-thread only and a thrown exception resolves the call rather than killing the process.
     */
    private void onMain(Runnable body, Runnable onError) {
        main.post(() -> guarded(body, onError));
    }

    @Override public void load() {
        main.post(() -> {
            if (!destroyed) bridge.addWebViewListener(navigation);
        });
    }

    // ---------------------------------------------------------------- connection lifecycle

    /** Connects on demand; coalesces concurrent callers; retries once on SERVICE_DISCONNECTED. */
    private void connect(Ready ready, Failed failed) {
        if (destroyed) { failed.run(PlayBillingLogic.RC_SERVICE_UNAVAILABLE); return; }
        if (client != null && client.isReady()) { ready.run(client); return; }
        waiters.add(new Waiter(ready, failed));
        if (connecting) return;
        connecting = true;
        attemptConnect(true);
    }

    private void attemptConnect(final boolean mayRetry) {
        if (client == null) {
            client = BillingClient.newBuilder(getContext().getApplicationContext())
                .setListener(this)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .build();
        }
        final BillingClient attempt = client;
        attempt.startConnection(new BillingClientStateListener() {
            private boolean done;
            private void settle(int code) {
                if (done) return;
                done = true;
                if (code == PlayBillingLogic.RC_SERVICE_DISCONNECTED && mayRetry && !destroyed) {
                    attempt.endConnection();
                    if (client == attempt) client = null;
                    attemptConnect(false);
                    return;
                }
                finishConnect(code);
            }
            @Override public void onBillingSetupFinished(BillingResult result) {
                final int code = result.getResponseCode();
                onMain(() -> settle(code), () -> finishConnect(PlayBillingLogic.RC_ERROR));
            }
            @Override public void onBillingServiceDisconnected() {
                onMain(() -> settle(PlayBillingLogic.RC_SERVICE_DISCONNECTED), () -> finishConnect(PlayBillingLogic.RC_ERROR));
            }
        });
    }

    private void finishConnect(int code) {
        connecting = false;
        List<Waiter> batch = new ArrayList<>(waiters);
        waiters.clear();
        for (Waiter w : batch) {
            if (code == PlayBillingLogic.RC_OK && client != null) w.ready.run(client);
            else w.failed.run(code);
        }
    }

    // ---------------------------------------------------------------- getProducts

    @PluginMethod public void getProducts(PluginCall call) {
        JSArray raw = call.getArray("productIds");
        if (raw == null) { call.reject("productIds must be an array of strings", "INVALID_ARGUMENT"); return; }
        List<Object> values = new ArrayList<>();
        for (int i = 0; i < raw.length(); i++) values.add(raw.opt(i));
        // Malformed ids are dropped and duplicates collapsed (Play rejects a duplicated product list).
        List<String> ids = PlayBillingLogic.cleanProductIds(values);
        if (ids.size() > PlayBillingLogic.MAX_PRODUCT_IDS) { call.reject("too many productIds", "INVALID_ARGUMENT"); return; }
        Runnable failed = () -> call.resolve(listError(PlayBillingLogic.RC_ERROR));
        onMain(() -> queryProducts(call, ids, false), failed);
    }

    private void queryProducts(PluginCall call, List<String> ids, boolean retried) {
        if (ids.isEmpty()) { call.resolve(productsOk(Collections.emptyList())); return; }
        Runnable failed = () -> call.resolve(listError(PlayBillingLogic.RC_ERROR));
        connect(c -> guarded(() -> {
            List<QueryProductDetailsParams.Product> products = new ArrayList<>();
            for (String id : ids) {
                products.add(QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(id).setProductType(BillingClient.ProductType.SUBS).build());
            }
            c.queryProductDetailsAsync(
                QueryProductDetailsParams.newBuilder().setProductList(products).build(),
                (result, queryResult) -> onMain(() -> {
                    int code = result.getResponseCode();
                    if (code == PlayBillingLogic.RC_SERVICE_DISCONNECTED && !retried) { queryProducts(call, ids, true); return; }
                    if (code != PlayBillingLogic.RC_OK) { call.resolve(listError(code)); return; }
                    call.resolve(productsOk(queryResult.getProductDetailsList()));
                }, failed));
        }, failed), code -> call.resolve(listError(code)));
    }

    private static JSObject productsOk(List<ProductDetails> details) {
        JSArray products = new JSArray();
        for (ProductDetails pd : details) {
            JSObject p = new JSObject();
            p.put("productId", pd.getProductId());
            p.put("name", pd.getName());
            p.put("title", pd.getTitle());
            JSArray offers = new JSArray();
            List<ProductDetails.SubscriptionOfferDetails> subOffers = pd.getSubscriptionOfferDetails();
            if (subOffers != null) {
                for (ProductDetails.SubscriptionOfferDetails o : subOffers) {
                    JSObject offer = new JSObject();
                    offer.put("basePlanId", o.getBasePlanId());
                    // JSONObject.put(key, null) REMOVES the key; use NULL so the field is always present.
                    offer.put("offerId", o.getOfferId() == null ? JSONObject.NULL : o.getOfferId());
                    offer.put("offerToken", o.getOfferToken());
                    JSArray phases = new JSArray();
                    for (ProductDetails.PricingPhase ph : o.getPricingPhases().getPricingPhaseList()) {
                        JSObject phase = new JSObject();
                        phase.put("formattedPrice", ph.getFormattedPrice());
                        phase.put("priceAmountMicros", ph.getPriceAmountMicros());
                        phase.put("priceCurrencyCode", ph.getPriceCurrencyCode());
                        phase.put("billingPeriod", ph.getBillingPeriod()); // ISO 8601 as Play reports it
                        phase.put("billingCycleCount", ph.getBillingCycleCount());
                        phase.put("recurrenceMode", ph.getRecurrenceMode());
                        phases.put(phase);
                    }
                    offer.put("pricingPhases", phases);
                    offers.put(offer);
                }
            }
            p.put("offers", offers);
            products.put(p);
        }
        JSObject out = new JSObject();
        out.put("ok", true);
        out.put("products", products);
        return out;
    }

    // ---------------------------------------------------------------- purchase

    @PluginMethod public void purchase(PluginCall call) {
        String replaceToken = null;
        String replaceMode = null;
        Object rawReplace = call.getData().opt("replace");
        if (rawReplace != null && rawReplace != JSONObject.NULL) {
            JSObject replace = call.getObject("replace");
            if (replace == null) { call.reject("replace must be an object", "INVALID_ARGUMENT"); return; }
            replaceToken = replace.getString("oldPurchaseToken");
            replaceMode = replace.getString("mode");
        }
        PurchaseRequest req = new PurchaseRequest();
        req.productId = call.getString("productId");
        req.basePlanId = call.getString("basePlanId");
        req.offerId = call.getString("offerId");
        req.obfuscatedAccountId = call.getString("obfuscatedAccountId");
        req.oldPurchaseToken = replaceToken;
        String invalid = PlayBillingLogic.validatePurchaseArgs(
            req.productId, req.basePlanId, req.offerId, req.obfuscatedAccountId, replaceToken, replaceMode);
        if (invalid != null) { call.reject(invalid, "INVALID_ARGUMENT"); return; }
        if (replaceMode != null) req.replacementMode = PlayBillingLogic.replacementModeFor(replaceMode);
        onMain(() -> {
            if (destroyed) { call.resolve(purchaseError(PlayBillingLogic.ST_UNAVAILABLE, "plugin_closed")); return; }
            if (purchaseCall != null) {
                call.resolve(purchaseError(PlayBillingLogic.ST_UNKNOWN, "purchase_in_progress"));
                return;
            }
            purchaseCall = call;
            purchaseProductId = req.productId;
            purchaseDeferred = req.oldPurchaseToken != null
                && req.replacementMode == PlayBillingLogic.REPLACEMENT_DEFERRED;
            beginPurchase(call, req, false);
        }, () -> failPurchase(call));
    }

    /** Unexpected failure inside a purchase step: resolve the call and free the plugin for the next one. */
    private void failPurchase(PluginCall call) {
        finishPurchase(call, purchaseError(PlayBillingLogic.ST_UNKNOWN, "internal_error"));
    }

    /** A non-OK response before or at launch. A user cancel is "cancelled", never an error. */
    private static JSObject purchaseResultForCode(int code) {
        String status = PlayBillingLogic.statusForResponseCode(code);
        if (PlayBillingLogic.ST_CANCELLED.equals(status)) {
            JSObject out = new JSObject();
            out.put("status", status);
            return out;
        }
        return purchaseError("ok".equals(status) ? PlayBillingLogic.ST_UNKNOWN : status, null);
    }

    private void beginPurchase(PluginCall call, PurchaseRequest req, boolean retried) {
        Runnable failed = () -> failPurchase(call);
        connect(c -> guarded(() -> {
            // The page navigated away or the activity was destroyed while connecting: never
            // launch a purchase sheet nobody is waiting for.
            if (purchaseCall != call) return;
            QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
                .setProductId(req.productId).setProductType(BillingClient.ProductType.SUBS).build();
            c.queryProductDetailsAsync(
                QueryProductDetailsParams.newBuilder().setProductList(Collections.singletonList(product)).build(),
                (result, queryResult) -> onMain(() -> {
                    if (purchaseCall != call) return;
                    int code = result.getResponseCode();
                    if (code == PlayBillingLogic.RC_SERVICE_DISCONNECTED && !retried) { beginPurchase(call, req, true); return; }
                    if (code != PlayBillingLogic.RC_OK) { finishPurchase(call, purchaseResultForCode(code)); return; }
                    launch(c, call, req, queryResult.getProductDetailsList());
                }, failed));
        }, failed), code -> finishPurchase(call, purchaseResultForCode(code)));
    }

    private void launch(BillingClient c, PluginCall call, PurchaseRequest req, List<ProductDetails> details) {
        ProductDetails match = null;
        for (ProductDetails pd : details) if (req.productId.equals(pd.getProductId())) match = pd;
        if (match == null) { finishPurchase(call, purchaseError(PlayBillingLogic.ST_UNAVAILABLE, "product_not_found")); return; }

        List<PlayBillingLogic.Offer> offers = new ArrayList<>();
        List<ProductDetails.SubscriptionOfferDetails> subOffers = match.getSubscriptionOfferDetails();
        if (subOffers != null) {
            for (ProductDetails.SubscriptionOfferDetails o : subOffers) {
                offers.add(new PlayBillingLogic.Offer(o.getBasePlanId(), o.getOfferId(), o.getOfferToken()));
            }
        }
        // Exact base plan + offer only; NEVER fall back to a different offer.
        PlayBillingLogic.Offer chosen = PlayBillingLogic.selectOffer(offers, req.basePlanId, req.offerId);
        if (chosen == null) { finishPurchase(call, purchaseError(PlayBillingLogic.ST_UNAVAILABLE, "offer_not_found")); return; }

        Activity activity = getActivity();
        if (activity == null || activity.isFinishing()) {
            finishPurchase(call, purchaseError(PlayBillingLogic.ST_UNAVAILABLE, "no_activity"));
            return;
        }
        BillingFlowParams.Builder flow = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(Collections.singletonList(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(match).setOfferToken(chosen.offerToken).build()))
            .setObfuscatedAccountId(req.obfuscatedAccountId);
        if (req.oldPurchaseToken != null) {
            flow.setSubscriptionUpdateParams(BillingFlowParams.SubscriptionUpdateParams.newBuilder()
                .setOldPurchaseToken(req.oldPurchaseToken)
                .setSubscriptionReplacementMode(req.replacementMode)
                .build());
        }
        BillingResult launched = c.launchBillingFlow(activity, flow.build());
        if (launched.getResponseCode() != PlayBillingLogic.RC_OK) {
            finishPurchase(call, purchaseResultForCode(launched.getResponseCode()));
        }
        // On OK the result arrives in onPurchasesUpdated.
    }

    @Override public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        // Play does not say which flow an update belongs to: any update that arrives while a call
        // is waiting answers it. That is why a result is only ever a token for the server to
        // verify (or a prompt to restore()), never proof of what was bought.
        onMain(() -> {
            PluginCall call = purchaseCall;
            if (call == null) return; // not our flow (or page navigated away); the server reconciles via restore()
            List<PlayBillingLogic.PurchaseInfo> infos = new ArrayList<>();
            if (purchases != null) {
                for (Purchase p : purchases) {
                    infos.add(new PlayBillingLogic.PurchaseInfo(p.getProducts(), p.getPurchaseState(), p.getPurchaseToken()));
                }
            }
            PlayBillingLogic.Outcome outcome =
                PlayBillingLogic.outcomeFromPurchasesUpdated(
                    result.getResponseCode(), infos, purchaseProductId, purchaseDeferred);
            JSObject out = new JSObject();
            if (PlayBillingLogic.ST_PURCHASED.equals(outcome.status)) {
                out.put("status", outcome.status);
                out.put("purchaseToken", outcome.purchaseToken);
                out.put("productId", outcome.productId);
            } else if (PlayBillingLogic.ST_DEFERRED.equals(outcome.status)) {
                // Scheduled change accepted. Token/product are present only if Play supplied them.
                out.put("status", outcome.status);
                out.put("purchaseToken", outcome.purchaseToken == null ? JSONObject.NULL : outcome.purchaseToken);
                out.put("productId", outcome.productId == null ? JSONObject.NULL : outcome.productId);
            } else if (PlayBillingLogic.ST_CANCELLED.equals(outcome.status) || PlayBillingLogic.ST_PENDING.equals(outcome.status)) {
                out.put("status", outcome.status);
            } else {
                out = purchaseError(outcome.status, null);
            }
            finishPurchase(call, out);
        }, () -> { if (purchaseCall != null) failPurchase(purchaseCall); });
    }

    /** Resolves the live purchase call exactly once; a call that was already abandoned is left alone. */
    private void finishPurchase(PluginCall call, JSObject out) {
        if (purchaseCall != call) return;
        clearPurchase();
        call.resolve(out);
    }

    private static JSObject purchaseError(String error, String reason) {
        JSObject out = new JSObject();
        out.put("status", "error");
        out.put("error", error);
        if (reason != null) out.put("reason", reason); // non-sensitive diagnostic slug only
        return out;
    }

    private static JSObject listError(int code) {
        JSObject out = new JSObject();
        out.put("ok", false);
        out.put("error", PlayBillingLogic.listErrorForResponseCode(code));
        return out;
    }

    // ---------------------------------------------------------------- restore

    @PluginMethod public void restore(PluginCall call) {
        onMain(() -> queryPurchases(call, false), () -> call.resolve(listError(PlayBillingLogic.RC_ERROR)));
    }

    private void queryPurchases(PluginCall call, boolean retried) {
        Runnable failed = () -> call.resolve(listError(PlayBillingLogic.RC_ERROR));
        connect(c -> guarded(() -> c.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(),
            (result, purchases) -> onMain(() -> {
                int code = result.getResponseCode();
                if (code == PlayBillingLogic.RC_SERVICE_DISCONNECTED && !retried) { queryPurchases(call, true); return; }
                if (code != PlayBillingLogic.RC_OK) { call.resolve(listError(code)); return; }
                JSArray list = new JSArray();
                for (Purchase p : purchases) {
                    JSObject o = new JSObject();
                    o.put("purchaseToken", p.getPurchaseToken());
                    JSArray ids = new JSArray();
                    for (String id : p.getProducts()) ids.put(id);
                    o.put("productIds", ids);
                    o.put("purchaseState", stateName(p.getPurchaseState()));
                    o.put("acknowledged", p.isAcknowledged());
                    o.put("autoRenewing", p.isAutoRenewing());
                    AccountIdentifiers ai = p.getAccountIdentifiers();
                    String account = ai == null ? null : ai.getObfuscatedAccountId();
                    o.put("obfuscatedAccountId", account == null ? JSONObject.NULL : account);
                    list.put(o);
                }
                JSObject out = new JSObject();
                out.put("ok", true);
                out.put("purchases", list);
                call.resolve(out);
            }, failed)), failed), code -> call.resolve(listError(code)));
    }

    private static String stateName(int state) {
        if (state == PlayBillingLogic.STATE_PURCHASED) return "purchased";
        if (state == PlayBillingLogic.STATE_PENDING) return "pending";
        return "unspecified";
    }

    // ---------------------------------------------------------------- manage

    @PluginMethod public void manageSubscriptions(PluginCall call) {
        String productId = call.getString("productId");
        main.post(() -> {
            Activity activity = getActivity();
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(PlayBillingLogic.manageSubscriptionsUrl(productId)));
            JSObject out = new JSObject();
            try {
                if (activity != null) activity.startActivity(intent);
                else getContext().startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                out.put("ok", true);
            } catch (RuntimeException e) { // ActivityNotFoundException, SecurityException, ...
                out.put("ok", false);
                out.put("error", PlayBillingLogic.ST_UNAVAILABLE);
            }
            call.resolve(out);
        });
    }

    // ---------------------------------------------------------------- activity lifecycle

    @Override protected void handleOnDestroy() {
        main.post(() -> {
            destroyed = true;
            if (bridge != null) bridge.removeWebViewListener(navigation);
            PluginCall call = purchaseCall;
            clearPurchase();
            if (call != null) call.resolve(purchaseError(PlayBillingLogic.ST_UNKNOWN, "activity_destroyed"));
            List<Waiter> batch = new ArrayList<>(waiters);
            waiters.clear();
            connecting = false;
            for (Waiter w : batch) w.failed.run(PlayBillingLogic.RC_SERVICE_UNAVAILABLE);
            if (client != null) client.endConnection();
            client = null;
        });
    }
}
