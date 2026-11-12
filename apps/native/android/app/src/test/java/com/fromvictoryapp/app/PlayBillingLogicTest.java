package com.fromvictoryapp.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Test;

public class PlayBillingLogicTest {
    private static final String ACCOUNT = "0b3c2f5e9a7d4c1e8f6a5b4c3d2e1f00";

    private static String validate(String productId, String basePlan, String offer, String account, String oldToken, String mode) {
        return PlayBillingLogic.validatePurchaseArgs(productId, basePlan, offer, account, oldToken, mode);
    }

    // ---- validation -------------------------------------------------------------------------

    @Test public void acceptsMinimalAndOfferAndReplaceArgs() {
        assertNull(validate("family.1", "monthly", null, ACCOUNT, null, null));
        assertNull(validate("family.1", "yearly", "trial-7d", ACCOUNT, null, null));
        assertNull(validate("family.2", "monthly", null, ACCOUNT, "old-token", "CHARGE_PRORATED_PRICE"));
        assertNull(validate("family.2", "monthly", null, ACCOUNT, "old-token", "DEFERRED"));
    }

    @Test public void rejectsMissingOrOverlongObfuscatedAccountId() {
        assertNotNull(validate("family.1", "monthly", null, null, null, null));
        assertNotNull(validate("family.1", "monthly", null, "", null, null));
        assertNotNull(validate("family.1", "monthly", null, "   ", null, null));
        StringBuilder sixtyFive = new StringBuilder();
        for (int i = 0; i < 65; i++) sixtyFive.append('a');
        assertNotNull(validate("family.1", "monthly", null, sixtyFive.toString(), null, null));
        assertNull(validate("family.1", "monthly", null, sixtyFive.substring(0, 64), null, null));
    }

    @Test public void validationMessagesNeverEchoSecrets() {
        String msg = validate("family.1", "monthly", null, "", "tok-SECRET", null);
        assertNotNull(msg);
        assertTrue(!msg.contains("SECRET"));
        String msg2 = validate("family.1", "monthly", null, ACCOUNT, "tok-SECRET", "BOGUS");
        assertNotNull(msg2);
        assertTrue(!msg2.contains("SECRET") && !msg2.contains(ACCOUNT));
    }

    @Test public void rejectsMalformedIds() {
        assertNotNull(validate(null, "monthly", null, ACCOUNT, null, null));
        assertNotNull(validate("Family.1", "monthly", null, ACCOUNT, null, null));
        assertNotNull(validate("family 1", "monthly", null, ACCOUNT, null, null));
        assertNotNull(validate("family.1", null, null, ACCOUNT, null, null));
        assertNotNull(validate("family.1", "Monthly", null, ACCOUNT, null, null));
        assertNotNull(validate("family.1", "monthly", "Trial_7d", ACCOUNT, null, null));
    }

    @Test public void replaceRequiresTokenAndSupportedMode() {
        assertNotNull(validate("family.2", "monthly", null, ACCOUNT, "t", null));
        assertNotNull(validate("family.2", "monthly", null, ACCOUNT, null, "DEFERRED"));
        assertNotNull(validate("family.2", "monthly", null, ACCOUNT, "", "DEFERRED"));
        assertNotNull(validate("family.2", "monthly", null, ACCOUNT, "t", "WITH_TIME_PRORATION"));
    }

    @Test public void mapsReplacementModes() {
        assertEquals(2, PlayBillingLogic.replacementModeFor("CHARGE_PRORATED_PRICE"));
        assertEquals(6, PlayBillingLogic.replacementModeFor("DEFERRED"));
        assertEquals(-1, PlayBillingLogic.replacementModeFor("CHARGE_FULL_PRICE"));
        assertEquals(-1, PlayBillingLogic.replacementModeFor(null));
    }

    // ---- exact offer selection ----------------------------------------------------------------

    private static final List<PlayBillingLogic.Offer> OFFERS = Arrays.asList(
        new PlayBillingLogic.Offer("monthly", null, "tok-monthly"),
        new PlayBillingLogic.Offer("monthly", "trial-7d", "tok-monthly-trial"),
        new PlayBillingLogic.Offer("yearly", null, "tok-yearly"),
        new PlayBillingLogic.Offer("yearly", "trial-7d", "tok-yearly-trial"));

    @Test public void selectsBasePlanWithNoOfferWhenOfferAbsent() {
        assertEquals("tok-monthly", PlayBillingLogic.selectOffer(OFFERS, "monthly", null).offerToken);
        assertEquals("tok-yearly", PlayBillingLogic.selectOffer(OFFERS, "yearly", "").offerToken);
    }

    @Test public void selectsExactOffer() {
        assertEquals("tok-yearly-trial", PlayBillingLogic.selectOffer(OFFERS, "yearly", "trial-7d").offerToken);
    }

    @Test public void neverFallsBackToADifferentOffer() {
        // Requested no-offer base plan, but only the trial offer exists: must NOT pick the trial.
        List<PlayBillingLogic.Offer> trialOnly = Collections.singletonList(
            new PlayBillingLogic.Offer("monthly", "trial-7d", "tok-trial"));
        assertNull(PlayBillingLogic.selectOffer(trialOnly, "monthly", null));
        // Requested an offer that is not there: must NOT fall back to the plain base plan.
        List<PlayBillingLogic.Offer> plainOnly = Collections.singletonList(
            new PlayBillingLogic.Offer("monthly", null, "tok-plain"));
        assertNull(PlayBillingLogic.selectOffer(plainOnly, "monthly", "trial-7d"));
        assertNull(PlayBillingLogic.selectOffer(OFFERS, "weekly", null));
        assertNull(PlayBillingLogic.selectOffer(OFFERS, "monthly", "trial-30d"));
        assertNull(PlayBillingLogic.selectOffer(null, "monthly", null));
        assertNull(PlayBillingLogic.selectOffer(Collections.<PlayBillingLogic.Offer>emptyList(), "monthly", null));
    }

    @Test public void ignoresOffersWithoutAToken() {
        List<PlayBillingLogic.Offer> noToken = Collections.singletonList(new PlayBillingLogic.Offer("monthly", null, ""));
        assertNull(PlayBillingLogic.selectOffer(noToken, "monthly", null));
    }

    // ---- response-code mapping ----------------------------------------------------------------

    @Test public void mapsResponseCodes() {
        assertEquals("ok", PlayBillingLogic.statusForResponseCode(0));
        assertEquals("cancelled", PlayBillingLogic.statusForResponseCode(1));
        assertEquals("already_owned", PlayBillingLogic.statusForResponseCode(7));
        assertEquals("network", PlayBillingLogic.statusForResponseCode(12));
        assertEquals("network", PlayBillingLogic.statusForResponseCode(-3));
        assertEquals("unavailable", PlayBillingLogic.statusForResponseCode(2));
        assertEquals("unavailable", PlayBillingLogic.statusForResponseCode(3));
        assertEquals("unavailable", PlayBillingLogic.statusForResponseCode(-1));
        assertEquals("unavailable", PlayBillingLogic.statusForResponseCode(-2));
        assertEquals("unavailable", PlayBillingLogic.statusForResponseCode(4));
        assertEquals("developer_error", PlayBillingLogic.statusForResponseCode(5));
        assertEquals("unknown", PlayBillingLogic.statusForResponseCode(6));
        assertEquals("unknown", PlayBillingLogic.statusForResponseCode(8));
        assertEquals("unknown", PlayBillingLogic.statusForResponseCode(9999));
    }

    // ---- result shaping -----------------------------------------------------------------------

    private static PlayBillingLogic.PurchaseInfo purchase(int state, String token, String... products) {
        return new PlayBillingLogic.PurchaseInfo(Arrays.asList(products), state, token);
    }

    @Test public void shapesPurchased() {
        PlayBillingLogic.Outcome o = PlayBillingLogic.outcomeFromPurchasesUpdated(
            0, Collections.singletonList(purchase(1, "tok", "family.1")), "family.1", false);
        assertEquals("purchased", o.status);
        assertEquals("tok", o.purchaseToken);
        assertEquals("family.1", o.productId);
    }

    @Test public void shapesPendingCancelledAndErrors() {
        assertEquals("pending", PlayBillingLogic.outcomeFromPurchasesUpdated(
            0, Collections.singletonList(purchase(2, "tok", "family.1")), "family.1", false).status);
        PlayBillingLogic.Outcome cancelled = PlayBillingLogic.outcomeFromPurchasesUpdated(1, null, "family.1", false);
        assertEquals("cancelled", cancelled.status);
        assertNull(cancelled.purchaseToken);
        assertEquals("already_owned", PlayBillingLogic.outcomeFromPurchasesUpdated(7, null, "family.1", false).status);
        assertEquals("developer_error", PlayBillingLogic.outcomeFromPurchasesUpdated(5, null, "family.1", false).status);
    }

    @Test public void neverClaimsSuccessWithoutAMatchingPurchasedToken() {
        assertEquals("unknown", PlayBillingLogic.outcomeFromPurchasesUpdated(0, null, "family.1", false).status);
        assertEquals("unknown", PlayBillingLogic.outcomeFromPurchasesUpdated(
            0, Collections.singletonList(purchase(1, "tok", "family.2")), "family.1", false).status);
        assertEquals("unknown", PlayBillingLogic.outcomeFromPurchasesUpdated(
            0, Collections.singletonList(purchase(1, "", "family.1")), "family.1", false).status);
        assertEquals("unknown", PlayBillingLogic.outcomeFromPurchasesUpdated(
            0, Collections.singletonList(purchase(0, "tok", "family.1")), "family.1", false).status);
    }

    @Test public void deferredReplacementReportsDeferredNotUnknown() {
        // Play keeps the new token on the OLD product until renewal: pass it through as deferred.
        PlayBillingLogic.Outcome withToken = PlayBillingLogic.outcomeFromPurchasesUpdated(
            0, Collections.singletonList(purchase(1, "new-tok", "family.3")), "family.2", true);
        assertEquals("deferred", withToken.status);
        assertEquals("new-tok", withToken.purchaseToken);
        assertEquals("family.3", withToken.productId);
        // The listener may also deliver nothing: still deferred, token collected via restore().
        PlayBillingLogic.Outcome empty = PlayBillingLogic.outcomeFromPurchasesUpdated(0, null, "family.2", true);
        assertEquals("deferred", empty.status);
        assertNull(empty.purchaseToken);
        assertNull(empty.productId);
        // A token-less or non-purchased other product is never passed along.
        assertNull(PlayBillingLogic.outcomeFromPurchasesUpdated(
            0, Collections.singletonList(purchase(1, "", "family.3")), "family.2", true).purchaseToken);
        assertNull(PlayBillingLogic.outcomeFromPurchasesUpdated(
            0, Collections.singletonList(purchase(2, "tok", "family.3")), "family.2", true).purchaseToken);
    }

    @Test public void deferredFlagNeverMasksFailureOrChangesOtherShapes() {
        assertEquals("cancelled", PlayBillingLogic.outcomeFromPurchasesUpdated(1, null, "family.2", true).status);
        assertEquals("developer_error", PlayBillingLogic.outcomeFromPurchasesUpdated(5, null, "family.2", true).status);
        assertEquals("purchased", PlayBillingLogic.outcomeFromPurchasesUpdated(
            0, Collections.singletonList(purchase(1, "tok", "family.2")), "family.2", true).status);
        assertEquals("pending", PlayBillingLogic.outcomeFromPurchasesUpdated(
            0, Collections.singletonList(purchase(2, "tok", "family.2")), "family.2", true).status);
        // Without the flag, a purchase of a different product is still never success.
        assertEquals("unknown", PlayBillingLogic.outcomeFromPurchasesUpdated(
            0, Collections.singletonList(purchase(1, "tok", "family.3")), "family.2", false).status);
    }

    // ---- manage URL ---------------------------------------------------------------------------

    @Test public void buildsManageUrl() {
        assertEquals("https://play.google.com/store/account/subscriptions?package=com.fromvictoryapp.app",
            PlayBillingLogic.manageSubscriptionsUrl(null));
        assertEquals("https://play.google.com/store/account/subscriptions?package=com.fromvictoryapp.app&sku=family.1",
            PlayBillingLogic.manageSubscriptionsUrl("family.1"));
        // A malformed id must never be spliced into the URL.
        assertEquals("https://play.google.com/store/account/subscriptions?package=com.fromvictoryapp.app",
            PlayBillingLogic.manageSubscriptionsUrl("x&evil=1"));
    }
}
