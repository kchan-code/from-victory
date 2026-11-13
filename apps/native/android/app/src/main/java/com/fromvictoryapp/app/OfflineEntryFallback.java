package com.fromvictoryapp.app;

import java.net.URI;
import java.net.URISyntaxException;

/**
 * FV-639: where the Android shell goes when its entry page can't load offline.
 *
 * The shell opens the hosted app at its root ({@code server.url} = "/"). The
 * Service Worker deliberately never handles "/" (FV-489: middleware routes it by
 * the shell's User-Agent, which a SW-issued fetch does not carry), so with no
 * signal the very first navigation fails and the WebView stays blank. Before
 * FV-639, an athlete who opened the app at the rink with no signal saw a black
 * screen, even with a downloaded Pregame session.
 *
 * The fix: when (and only when) that entry navigation fails for a CONNECTIVITY
 * reason, open {@code /athlete/pregame} instead. The SW serves that PII-free
 * shell from cache offline (FV-107), and PregameClientShell decides access
 * exactly as it always does: the verified offline window (FV-625), revocation
 * on the next online check, and per-account clearing on sign-out. This class
 * grants nothing; it only picks which page to try.
 *
 * Any OTHER top-level page on the app's own host that fails for a
 * connectivity reason (e.g. Pregame sending a signed-out user to /signin with
 * no signal) shows the shell's bundled offline page (www/index.html) instead
 * of Chromium's raw error page. The page has Try again (the app URL) and,
 * when the Pregame URL can be built, Open a saved session.
 *
 * FV-718: a main-frame HTTP 5xx on that same origin also shows the bundled
 * page. A 5xx is the server answering, so it does not auto-open Pregame
 * (that request would hit the same outage). The saved-session link is the
 * way into a session the Service Worker may still have cached. 4xx, SSL,
 * bad URLs, and subresources still do nothing here.
 *
 * Pregame itself gets a few bounded retries first: on an offline cold start the
 * WebView's first Pregame navigation can reach the network before the Service
 * Worker is ready to answer it (observed on the emulator: roughly half of cold
 * starts after the app had been stopped for 5+ s), while an immediate second
 * navigation is answered from the SW cache. During the retries the user sees
 * the local offline page (Try again / Open a saved session), never Chromium's error
 * page; once the retries are spent, that page simply stays. The retry budget is
 * a hard cap per offline entry (only a new entry resets it), and a retry only
 * fires while the local offline page is still showing.
 *
 * Pure Java (no android.* types) so it is unit-tested on the JVM.
 */
public final class OfflineEntryFallback {

    /** The SW-cached, PII-free offline shell (sw.js PREGAME_PATH). */
    public static final String PREGAME_PATH = "/athlete/pregame";

    /**
     * Base URL for the bundled page. Reserved {@code .invalid} host (RFC 2606),
     * so {@code loadDataWithBaseURL} can give the document an origin (absolute
     * links then navigate) without being the app origin. {@link #isLocalOfflinePageUrl}
     * treats this host as "still on the fallback", which is what gates Pregame retries.
     */
    public static final String OFFLINE_PAGE_BASE = "https://fv-offline.invalid/";

    // android.webkit.WebViewClient error codes (copied as literals so this class
    // stays JVM-testable). Only connectivity failures qualify for decide().
    // Main-frame HTTP 5xx is decideHttpStatus(). SSL failures, 4xx, bad URLs,
    // and unsafe resources never trigger a fallback.
    static final int ERROR_UNKNOWN = -1; // net::ERR_INTERNET_DISCONNECTED surfaces here
    static final int ERROR_HOST_LOOKUP = -2;
    static final int ERROR_CONNECT = -6;
    static final int ERROR_IO = -7;
    static final int ERROR_TIMEOUT = -8;

    /** How many times a failed Pregame load is retried before giving up. */
    static final int MAX_PREGAME_RETRIES = 3;

    private OfflineEntryFallback() {}

    static boolean isConnectivityError(int errorCode) {
        return errorCode == ERROR_UNKNOWN
            || errorCode == ERROR_HOST_LOOKUP
            || errorCode == ERROR_CONNECT
            || errorCode == ERROR_IO
            || errorCode == ERROR_TIMEOUT;
    }

    /** What the shell should do after a failed load. */
    public enum Action {
        /** Leave the WebView alone (Capacitor default). */
        NONE,
        /** Open {@link #PREGAME_PATH} on the app host (offline entry). */
        OPEN_PREGAME,
        /** Show the bundled offline page, then retry {@link #PREGAME_PATH} after {@link #retryDelayMs}. */
        RETRY_PREGAME,
        /** Show the bundled offline page (no network involved). */
        SHOW_OFFLINE_PAGE
    }

    /**
     * Main-frame HTTP 5xx on the app origin. Always the bundled page (with its
     * retry control). Not {@link Action#OPEN_PREGAME}: the server answered, so
     * an automatic Pregame navigation would hit the same outage. 4xx does not
     * qualify (auth and missing pages are the app's own responses).
     */
    public static Action decideHttpStatus(
        String failedUrl, boolean isMainFrame, int statusCode, String appUrl) {
        if (!isMainFrame || statusCode < 500 || statusCode > 599) {
            return Action.NONE;
        }
        if (sameHttpsAppUri(failedUrl, appUrl) == null) {
            return Action.NONE;
        }
        return Action.SHOW_OFFLINE_PAGE;
    }

    /**
     * @param failedUrl   the URL whose load failed
     * @param isMainFrame whether it was the top-level document
     * @param errorCode   WebViewClient error code
     * @param appUrl      the shell's configured app URL (Bridge#getAppUrl)
     * @param pregameRetriesSoFar Pregame retries already made in this offline sequence
     */
    public static Action decide(
        String failedUrl, boolean isMainFrame, int errorCode, String appUrl, int pregameRetriesSoFar) {
        if (!isMainFrame || !isConnectivityError(errorCode)) {
            return Action.NONE;
        }
        URI failed = sameHttpsAppUri(failedUrl, appUrl);
        if (failed == null) {
            return Action.NONE;
        }
        String path = failed.getRawPath();
        // The shell's entry page (the root it launches into) -> Pregame shell.
        if (path == null || path.isEmpty() || "/".equals(path)) {
            return Action.OPEN_PREGAME;
        }
        // Pregame: a bounded number of retries (the SW may not have been ready),
        // then the local offline page. Never more than MAX_PREGAME_RETRIES, so it
        // can never loop.
        if (PREGAME_PATH.equals(path) && pregameRetriesSoFar < MAX_PREGAME_RETRIES) {
            return Action.RETRY_PREGAME;
        }
        // Any other app page -> the local offline page.
        return Action.SHOW_OFFLINE_PAGE;
    }

    /** Delay before Pregame retry number {@code attempt} (0-based): 400, 800, 1600 ms. */
    public static long retryDelayMs(int attempt) {
        int clamped = Math.max(0, Math.min(attempt, MAX_PREGAME_RETRIES - 1));
        return 400L << clamped;
    }

    /**
     * Whether the WebView is showing the local offline page: about:blank, a
     * data URL, or {@link #OFFLINE_PAGE_BASE}.
     */
    public static boolean isLocalOfflinePageUrl(String currentUrl) {
        if (currentUrl == null || "about:blank".equals(currentUrl) || currentUrl.startsWith("data:")) {
            return true;
        }
        try {
            URI uri = new URI(currentUrl);
            return "fv-offline.invalid".equalsIgnoreCase(uri.getHost());
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private static final String SAVED_START = "<!--fv-saved-->";
    private static final String SAVED_END = "<!--/fv-saved-->";

    /**
     * Fill the bundled page's retry and saved-session links. Only https URLs
     * are written into attributes. A missing Pregame URL removes the saved-session
     * control instead of leaving a dead link.
     */
    public static String injectOfflinePage(String html, String retryUrl, String pregameUrl) {
        if (html == null) return "";
        String retry = isHttpsPageUrl(retryUrl) ? htmlAttr(retryUrl) : "#";
        String out = html.replace("__FV_RETRY_URL__", retry);
        if (isHttpsPageUrl(pregameUrl)) {
            return out.replace("__FV_PREGAME_URL__", htmlAttr(pregameUrl));
        }
        int start = out.indexOf(SAVED_START);
        int end = out.indexOf(SAVED_END);
        if (start >= 0 && end > start) {
            return out.substring(0, start) + out.substring(end + SAVED_END.length());
        }
        return out.replace("__FV_PREGAME_URL__", "#");
    }

    private static boolean isHttpsPageUrl(String url) {
        if (url == null || !url.startsWith("https://") || url.indexOf('"') >= 0 || url.indexOf('<') >= 0
            || url.indexOf(' ') >= 0) {
            return false;
        }
        try {
            URI uri = new URI(url);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null;
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private static String htmlAttr(String url) {
        return url.replace("&", "&amp;").replace("\"", "&quot;").replace("<", "&lt;");
    }

    /** https port with the default made explicit, so "host" and "host:443" match. */
    private static int httpsPort(URI uri) {
        return uri.getPort() == -1 ? 443 : uri.getPort();
    }

    /**
     * The failed URI when it is the same https origin as {@code appUrl}, else null.
     * Third-party pages, cleartext, and bad URLs are null.
     */
    private static URI sameHttpsAppUri(String failedUrl, String appUrl) {
        if (failedUrl == null || appUrl == null) return null;
        URI failed;
        URI app;
        try {
            failed = new URI(failedUrl);
            app = new URI(appUrl);
        } catch (URISyntaxException e) {
            return null;
        }
        if (!"https".equalsIgnoreCase(failed.getScheme())
            || !"https".equalsIgnoreCase(app.getScheme())
            || failed.getHost() == null
            || !failed.getHost().equalsIgnoreCase(app.getHost())
            || httpsPort(failed) != httpsPort(app)) {
            return null;
        }
        return failed;
    }

    /** Absolute Pregame URL on the app host, or null if appUrl is unusable. */
    public static String pregameUrl(String appUrl) {
        try {
            URI app = new URI(appUrl);
            if (app.getRawAuthority() == null) return null;
            return "https://" + app.getRawAuthority() + PREGAME_PATH;
        } catch (URISyntaxException | NullPointerException e) {
            return null;
        }
    }
}
