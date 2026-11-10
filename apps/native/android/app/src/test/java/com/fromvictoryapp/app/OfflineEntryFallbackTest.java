package com.fromvictoryapp.app;

import static com.fromvictoryapp.app.OfflineEntryFallback.Action.NONE;
import static com.fromvictoryapp.app.OfflineEntryFallback.Action.OPEN_PREGAME;
import static com.fromvictoryapp.app.OfflineEntryFallback.Action.SHOW_OFFLINE_PAGE;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;

public class OfflineEntryFallbackTest {

    private static final String APP = "https://www.fromvictoryapp.com";
    private static final String STAGING = "https://fv-android-staging-web.vercel.app";

    private static OfflineEntryFallback.Action decide(String url, boolean main, int code, String app) {
        return OfflineEntryFallback.decide(url, main, code, app);
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
    public void otherAppPagesShowTheLocalOfflinePageNeverPregame() {
        // Pregame itself can never loop back into Pregame.
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
