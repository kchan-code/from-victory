package com.fromvictoryapp.app;

import static com.fromvictoryapp.app.OfflineEntryFallback.Action.NONE;
import static com.fromvictoryapp.app.OfflineEntryFallback.Action.OPEN_PREGAME;
import static com.fromvictoryapp.app.OfflineEntryFallback.Action.RETRY_PREGAME;
import static com.fromvictoryapp.app.OfflineEntryFallback.Action.SHOW_OFFLINE_PAGE;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class OfflineEntryFallbackTest {

    private static final String APP = "https://www.fromvictoryapp.com";
    private static final String STAGING = "https://fv-android-staging-web.vercel.app";

    private static final int SPENT = OfflineEntryFallback.MAX_PREGAME_RETRIES;

    private static OfflineEntryFallback.Action decide(String url, boolean main, int code, String app) {
        return OfflineEntryFallback.decide(url, main, code, app, SPENT);
    }

    @Test
    public void offlineColdStartAtTheEntryOpensPregame() {
        assertEquals(OPEN_PREGAME, decide(APP, true, -2, APP));
        assertEquals(OPEN_PREGAME, decide(APP + "/", true, -2, APP));
        assertEquals(OPEN_PREGAME, decide(APP + "/?x=1", true, -1, APP));
        assertEquals(APP + "/athlete/pregame", OfflineEntryFallback.pregameUrl(APP));
    }

    @Test
    public void everyConnectivityErrorQualifies() {
        for (int code : new int[] {-1, -2, -6, -7, -8}) {
            assertEquals("code " + code, OPEN_PREGAME, decide(APP, true, code, APP));
        }
    }

    @Test
    public void nonConnectivityErrorsNeverAct() {
        // auth, proxy auth, redirect loop, unsupported scheme, SSL, bad URL, file, too many requests, unsafe
        for (int code : new int[] {-3, -4, -5, -9, -10, -11, -12, -13, -14, -15, -16, 0}) {
            assertEquals("code " + code, NONE, decide(APP, true, code, APP));
            assertEquals("code " + code, NONE, decide(APP + "/signin", true, code, APP));
        }
    }

    @Test
    public void subresourceFailuresNeverAct() {
        assertEquals(NONE, decide(APP, false, -2, APP));
        assertEquals(NONE, decide(APP + "/audio/pregame/clips/x.mp3", false, -2, APP));
    }

    @Test
    public void pregameIsRetriedABoundedNumberOfTimesThenTheLocalPageStays() {
        String pregame = APP + "/athlete/pregame";
        for (int done = 0; done < OfflineEntryFallback.MAX_PREGAME_RETRIES; done++) {
            assertEquals("after " + done, RETRY_PREGAME, OfflineEntryFallback.decide(pregame, true, -2, APP, done));
        }
        assertEquals(SHOW_OFFLINE_PAGE, OfflineEntryFallback.decide(pregame, true, -2, APP, SPENT));
        assertEquals(SHOW_OFFLINE_PAGE, OfflineEntryFallback.decide(pregame, true, -2, APP, SPENT + 5));
        // Retries are for Pregame only, and only for connectivity errors on the main frame.
        assertEquals(SHOW_OFFLINE_PAGE, OfflineEntryFallback.decide(APP + "/signin", true, -2, APP, 0));
        assertEquals(NONE, OfflineEntryFallback.decide(pregame, true, -11, APP, 0));
        assertEquals(NONE, OfflineEntryFallback.decide(pregame, false, -2, APP, 0));
        assertEquals(NONE, OfflineEntryFallback.decide("https://other.example/athlete/pregame", true, -2, APP, 0));
    }

    @Test
    public void retryDelaysBackOffAndStayBounded() {
        assertEquals(400L, OfflineEntryFallback.retryDelayMs(0));
        assertEquals(800L, OfflineEntryFallback.retryDelayMs(1));
        assertEquals(1600L, OfflineEntryFallback.retryDelayMs(2));
        assertEquals(1600L, OfflineEntryFallback.retryDelayMs(99));
        assertEquals(400L, OfflineEntryFallback.retryDelayMs(-1));
        long total = 0;
        for (int i = 0; i < OfflineEntryFallback.MAX_PREGAME_RETRIES; i++) total += OfflineEntryFallback.retryDelayMs(i);
        assertTrue("worst case before giving up stays under 3 s", total < 3000L);
    }

    @Test
    public void retriesOnlyReplaceTheLocalOfflinePage() {
        assertTrue(OfflineEntryFallback.isLocalOfflinePageUrl(null));
        assertTrue(OfflineEntryFallback.isLocalOfflinePageUrl("about:blank"));
        assertTrue(OfflineEntryFallback.isLocalOfflinePageUrl("data:text/html,x"));
        assertEquals(false, OfflineEntryFallback.isLocalOfflinePageUrl(APP + "/athlete/pregame"));
        assertEquals(false, OfflineEntryFallback.isLocalOfflinePageUrl(APP + "/signin"));
        assertEquals(false, OfflineEntryFallback.isLocalOfflinePageUrl("https://checkout.stripe.com/"));
    }

    @Test
    public void otherAppPagesShowTheLocalOfflinePageNeverPregame() {
        // Once retries are spent, Pregame itself can never loop back into Pregame.
        assertEquals(SHOW_OFFLINE_PAGE, decide(APP + "/athlete/pregame", true, -2, APP));
        // Signed-out offline: Pregame sends the user to /signin, which can't load.
        assertEquals(SHOW_OFFLINE_PAGE, decide(APP + "/signin", true, -2, APP));
        assertEquals(SHOW_OFFLINE_PAGE, decide(APP + "/dashboard", true, -6, APP));
    }

    @Test
    public void otherOriginsNeverAct() {
        assertEquals(NONE, decide("https://checkout.stripe.com/", true, -2, APP));
        assertEquals(NONE, decide("https://fromvictoryapp.com/", true, -2, APP));
        assertEquals(NONE, decide("http://www.fromvictoryapp.com/", true, -2, APP));
        assertEquals(NONE, decide("https://www.fromvictoryapp.com:8443/", true, -2, APP));
    }

    @Test
    public void defaultHttpsPortMatchesExplicit443() {
        assertEquals(OPEN_PREGAME, decide("https://www.fromvictoryapp.com:443/", true, -2, APP));
        assertEquals(OPEN_PREGAME, decide(APP + "/", true, -2, "https://www.fromvictoryapp.com:443"));
    }

    @Test
    public void nonHttpsAppUrlsNeverAct() {
        // Intended: local http dev servers (e.g. 10.0.2.2) get Capacitor's default behavior.
        assertEquals(NONE, decide("http://10.0.2.2:3000/", true, -2, "http://10.0.2.2:3000"));
    }

    @Test
    public void followsTheConfiguredServer() {
        assertEquals(OPEN_PREGAME, decide(STAGING + "/", true, -2, STAGING));
        assertEquals(STAGING + "/athlete/pregame", OfflineEntryFallback.pregameUrl(STAGING));
        assertEquals(NONE, decide(APP + "/", true, -2, STAGING));
    }

    @Test
    public void malformedOrMissingInputsAreIgnored() {
        assertEquals(NONE, decide(null, true, -2, APP));
        assertEquals(NONE, decide(APP, true, -2, null));
        assertEquals(NONE, decide("not a url ::", true, -2, APP));
        assertNull(OfflineEntryFallback.pregameUrl(null));
        assertNull(OfflineEntryFallback.pregameUrl("::"));
    }
}
