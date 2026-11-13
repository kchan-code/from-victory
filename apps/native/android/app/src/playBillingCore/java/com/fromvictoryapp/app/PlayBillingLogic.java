package com.fromvictoryapp.app;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Pure (no Android, no billing-library) logic for {@link FVPlayBillingPlugin}: argument validation,
 * exact offer selection, response-code mapping, and purchase-result shaping. Kept free of framework
 * and billing types so it runs on the plain JVM (see PlayBillingLogicTest).
 *
 * This class lives in the {@code playBillingCore} source set, which is compiled into the app ONLY
 * when the FV_PLAY_BILLING build switch is on (and into the JVM unit-test source set always).
 *
 * The numeric constants below are the Play Billing Library's documented values (verified against
 * billing 9.1.0 {@code BillingResponseCode}, {@code ReplacementMode}, {@code PurchaseState}).
 */
final class PlayBillingLogic {
    private PlayBillingLogic() {}

    static final String PACKAGE_NAME = "com.fromvictoryapp.app";
    static final int MAX_ACCOUNT_ID_LENGTH = 64;
    static final int MAX_PRODUCT_IDS = 20;

    // BillingClient.BillingResponseCode
    static final int RC_SERVICE_TIMEOUT = -3;
    static final int RC_FEATURE_NOT_SUPPORTED = -2;
    static final int RC_SERVICE_DISCONNECTED = -1;
    static final int RC_OK = 0;
    static final int RC_USER_CANCELED = 1;
    static final int RC_SERVICE_UNAVAILABLE = 2;
    static final int RC_BILLING_UNAVAILABLE = 3;
    static final int RC_ITEM_UNAVAILABLE = 4;
    static final int RC_DEVELOPER_ERROR = 5;
    static final int RC_ERROR = 6;
    static final int RC_ITEM_ALREADY_OWNED = 7;
    static final int RC_ITEM_NOT_OWNED = 8;
    static final int RC_NETWORK_ERROR = 12;

    // SubscriptionUpdateParams.ReplacementMode
    static final int REPLACEMENT_CHARGE_PRORATED_PRICE = 2;
    static final int REPLACEMENT_DEFERRED = 6;

    // Purchase.PurchaseState
    static final int STATE_PURCHASED = 1;
    static final int STATE_PENDING = 2;

    // Typed statuses surfaced to JS.
    static final String ST_PURCHASED = "purchased";
    static final String ST_CANCELLED = "cancelled";
    static final String ST_PENDING = "pending";
    static final String ST_DEFERRED = "deferred";
    static final String ST_ALREADY_OWNED = "already_owned";
    static final String ST_UNAVAILABLE = "unavailable";
    static final String ST_NETWORK = "network";
    static final String ST_DEVELOPER_ERROR = "developer_error";
    static final String ST_UNKNOWN = "unknown";

    // Play subscription product ids: start [a-z0-9], then [a-z0-9._], <= 40 chars.
    private static final Pattern PRODUCT_ID = Pattern.compile("^[a-z0-9][a-z0-9._]{0,39}$");
    // Base plan / offer ids: lowercase letters, digits, hyphens, <= 63 chars.
    private static final Pattern PLAN_ID = Pattern.compile("^[a-z0-9][a-z0-9-]{0,62}$");

    /** A purchasable base plan / offer pair as reported by Play. */
    static final class Offer {
        final String basePlanId;
        final String offerId; // null = base plan with no offer
        final String offerToken;

        Offer(String basePlanId, String offerId, String offerToken) {
            this.basePlanId = basePlanId;
            this.offerId = offerId;
            this.offerToken = offerToken;
        }
    }

    /** The slice of a Play purchase this logic needs. Never logged. */
    static final class PurchaseInfo {
        final List<String> productIds;
        final int purchaseState;
        final String purchaseToken;

        PurchaseInfo(List<String> productIds, int purchaseState, String purchaseToken) {
            this.productIds = productIds;
            this.purchaseState = purchaseState;
            this.purchaseToken = purchaseToken;
        }
    }

    /** Outcome of a purchase flow, before it is turned into a JS object. */
    static final class Outcome {
        final String status;
        final String purchaseToken; // ST_PURCHASED always; ST_DEFERRED when Play reported one (else null)
        final String productId;     // the product Play reported for that token (same rule)

        Outcome(String status, String purchaseToken, String productId) {
            this.status = status;
            this.purchaseToken = purchaseToken;
            this.productId = productId;
        }
    }

    private static boolean blank(String s) {
        return s == null || s.trim().isEmpty();
    }

    static boolean isValidProductId(String id) {
        return id != null && PRODUCT_ID.matcher(id).matches();
    }

    /** Well-formed product ids only, first occurrence order, duplicates collapsed. Never null. */
    static List<String> cleanProductIds(List<?> raw) {
        LinkedHashSet<String> unique = new LinkedHashSet<>();
        if (raw != null) {
            for (Object value : raw) {
                if (value instanceof String && isValidProductId((String) value)) unique.add((String) value);
            }
        }
        return new ArrayList<>(unique);
    }

    /**
     * Validates purchase() arguments. Returns null when valid, otherwise a short message that
     * never echoes the account id or token. {@code oldPurchaseToken}/{@code replaceMode} are both
     * null when no replacement is requested.
     */
    static String validatePurchaseArgs(
            String productId,
            String basePlanId,
            String offerId,
            String obfuscatedAccountId,
            String oldPurchaseToken,
            String replaceMode) {
        if (!isValidProductId(productId)) return "productId is missing or malformed";
        if (basePlanId == null || !PLAN_ID.matcher(basePlanId).matches()) return "basePlanId is missing or malformed";
        if (offerId != null && !PLAN_ID.matcher(offerId).matches()) return "offerId is malformed";
        if (blank(obfuscatedAccountId)) return "obfuscatedAccountId is required";
        if (obfuscatedAccountId.length() > MAX_ACCOUNT_ID_LENGTH) return "obfuscatedAccountId exceeds 64 characters";
        boolean hasToken = oldPurchaseToken != null;
        boolean hasMode = replaceMode != null;
        if (hasToken != hasMode) return "replace requires both oldPurchaseToken and mode";
        if (hasToken && blank(oldPurchaseToken)) return "replace.oldPurchaseToken is empty";
        if (hasMode && replacementModeFor(replaceMode) < 0) return "replace.mode is not supported";
        return null;
    }

    /** Maps the JS replace mode string to the library constant, or -1 if unsupported. */
    static int replacementModeFor(String mode) {
        if ("CHARGE_PRORATED_PRICE".equals(mode)) return REPLACEMENT_CHARGE_PRORATED_PRICE;
        if ("DEFERRED".equals(mode)) return REPLACEMENT_DEFERRED;
        return -1;
    }

    /**
     * Exact match only: the offer whose basePlanId equals the requested one AND whose offerId
     * equals the requested one (null/empty request = the base plan with no offer). Never falls
     * back to a different offer. Returns null when nothing matches.
     */
    static Offer selectOffer(List<Offer> offers, String basePlanId, String offerId) {
        if (offers == null || basePlanId == null) return null;
        String wanted = blank(offerId) ? null : offerId;
        for (Offer offer : offers) {
            if (offer == null || !basePlanId.equals(offer.basePlanId)) continue;
            String have = blank(offer.offerId) ? null : offer.offerId;
            boolean same = wanted == null ? have == null : wanted.equals(have);
            if (same && !blank(offer.offerToken)) return offer;
        }
        return null;
    }

    /** Maps a BillingResponseCode to a typed JS status. OK maps to "ok" (callers handle it). */
    static String statusForResponseCode(int code) {
        switch (code) {
            case RC_OK: return "ok";
            case RC_USER_CANCELED: return ST_CANCELLED;
            case RC_ITEM_ALREADY_OWNED: return ST_ALREADY_OWNED;
            case RC_NETWORK_ERROR:
            case RC_SERVICE_TIMEOUT: return ST_NETWORK;
            case RC_SERVICE_UNAVAILABLE:
            case RC_BILLING_UNAVAILABLE:
            case RC_SERVICE_DISCONNECTED:
            case RC_FEATURE_NOT_SUPPORTED:
            case RC_ITEM_UNAVAILABLE: return ST_UNAVAILABLE;
            case RC_DEVELOPER_ERROR: return ST_DEVELOPER_ERROR;
            default: return ST_UNKNOWN; // RC_ERROR, RC_ITEM_NOT_OWNED, anything new
        }
    }

    /**
     * Error string for getProducts()/restore(), which have no "cancelled" or "ok" outcome: a
     * failure is always one of the typed errors the JS wrapper knows.
     */
    static String listErrorForResponseCode(int code) {
        String status = statusForResponseCode(code);
        return "ok".equals(status) || ST_CANCELLED.equals(status) ? ST_UNKNOWN : status;
    }

    /**
     * Shapes the PurchasesUpdatedListener callback into an Outcome for the requested product.
     * OK + a PURCHASED purchase for the product -> purchased; OK + PENDING -> pending; OK with no
     * matching purchase -> unknown (never claim success without a token).
     *
     * {@code deferredReplacement} is true only for a replace with mode DEFERRED. Google's guide
     * ("Handle deferred replacement") says the new purchase token stays associated with the OLD
     * product until the next renewal, and does not say whether the listener's list carries it. So
     * for that mode an OK with no purchase of the requested product is the expected success shape:
     * report "deferred", passing along a purchased token if Play did supply one (with the product
     * Play reported for it), or null so the caller collects it via restore(). The server, not this
     * code, decides what the token entitles.
     */
    static Outcome outcomeFromPurchasesUpdated(
            int responseCode, List<PurchaseInfo> purchases, String productId, boolean deferredReplacement) {
        if (responseCode != RC_OK) return new Outcome(statusForResponseCode(responseCode), null, null);
        boolean sawPending = false;
        PurchaseInfo other = null;
        if (purchases != null) {
            for (PurchaseInfo p : purchases) {
                if (p == null || p.productIds == null) continue;
                if (!p.productIds.contains(productId)) {
                    if (other == null && p.purchaseState == STATE_PURCHASED && !blank(p.purchaseToken)
                            && !p.productIds.isEmpty()) {
                        other = p;
                    }
                    continue;
                }
                if (p.purchaseState == STATE_PURCHASED && !blank(p.purchaseToken)) {
                    return new Outcome(ST_PURCHASED, p.purchaseToken, productId);
                }
                if (p.purchaseState == STATE_PENDING) sawPending = true;
            }
        }
        if (sawPending) return new Outcome(ST_PENDING, null, null);
        if (deferredReplacement) {
            return other == null
                ? new Outcome(ST_DEFERRED, null, null)
                : new Outcome(ST_DEFERRED, other.purchaseToken, other.productIds.get(0));
        }
        return new Outcome(ST_UNKNOWN, null, null);
    }

    /** Play's subscription-management page; sku is appended only for a well-formed product id. */
    static String manageSubscriptionsUrl(String productId) {
        String url = "https://play.google.com/store/account/subscriptions?package=" + PACKAGE_NAME;
        if (isValidProductId(productId)) url += "&sku=" + productId;
        return url;
    }
}
