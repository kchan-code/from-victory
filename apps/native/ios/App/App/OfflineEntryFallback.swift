import Foundation

/**
 * FV-718: iOS twin of Android `OfflineEntryFallback.java`.
 *
 * The JVM tests on the Java class are the spec for origin checks, the Pregame
 * retry budget, HTTP 5xx, and link injection. This file uses NSURLError codes
 * instead of WebViewClient codes because those are what WKWebView reports.
 * Keep the two decisions in step: connectivity failure of the entry URL opens
 * Pregame; Pregame gets a bounded retry; any other app page, and any main-frame
 * 5xx, shows the bundled page. 4xx and TLS failures do not.
 *
 * A 5xx does not auto-open Pregame. The server answered, so that navigation
 * would hit the same outage. The bundled page's saved-session link is the way
 * into a session the Service Worker may still have cached.
 */
enum OfflineEntryFallback {
    static let pregamePath = "/athlete/pregame"
    static let maxPregameRetries = 3
    /// Reserved `.invalid` host (RFC 2606). Gives the bundled page an origin so
    /// absolute links navigate, without being the app origin.
    static let offlinePageBase = "https://fv-offline.invalid/"

    enum Action {
        case none
        case openPregame
        case retryPregame
        case showOfflinePage
    }

    /// Airplane-mode and "no route to host" failures. Not TLS, not cancellation.
    static func isConnectivityError(_ code: Int) -> Bool {
        switch code {
        case NSURLErrorTimedOut,
             NSURLErrorCannotFindHost,
             NSURLErrorCannotConnectToHost,
             NSURLErrorNetworkConnectionLost,
             NSURLErrorDNSLookupFailed,
             NSURLErrorNotConnectedToInternet,
             NSURLErrorInternationalRoamingOff,
             NSURLErrorDataNotAllowed:
            return true
        default:
            return false
        }
    }

    static func decideHttpStatus(
        failedURL: String?, isMainFrame: Bool, statusCode: Int, appURL: String?
    ) -> Action {
        if !isMainFrame || statusCode < 500 || statusCode > 599 { return .none }
        if sameHttpsApp(failedURL, appURL) == nil { return .none }
        return .showOfflinePage
    }

    static func decide(
        failedURL: String?, isMainFrame: Bool, errorCode: Int, appURL: String?, pregameRetriesSoFar: Int
    ) -> Action {
        if !isMainFrame || !isConnectivityError(errorCode) { return .none }
        guard let failed = sameHttpsApp(failedURL, appURL) else { return .none }
        let path = failed.path
        if path.isEmpty || path == "/" { return .openPregame }
        if path == pregamePath && pregameRetriesSoFar < maxPregameRetries { return .retryPregame }
        return .showOfflinePage
    }

    /// Delay before Pregame retry number `attempt` (0-based): 400, 800, 1600 ms.
    static func retryDelayMs(_ attempt: Int) -> Int {
        let clamped = max(0, min(attempt, maxPregameRetries - 1))
        return 400 << clamped
    }

    static func isLocalOfflinePageURL(_ currentURL: String?) -> Bool {
        guard let currentURL else { return true }
        if currentURL == "about:blank" || currentURL.hasPrefix("data:") { return true }
        return URLComponents(string: currentURL)?.host?.lowercased() == "fv-offline.invalid"
    }

    static func pregameURLString(_ appURL: String?) -> String? {
        guard let appURL, let app = URLComponents(string: appURL), let host = app.host, !host.isEmpty else {
            return nil
        }
        if let port = app.port {
            return "https://\(host):\(port)\(pregamePath)"
        }
        return "https://\(host)\(pregamePath)"
    }

    static func injectOfflinePage(_ html: String?, retryURL: String?, pregameURL: String?) -> String {
        guard let html else { return "" }
        let retry = isHttpsPageURL(retryURL) ? htmlAttr(retryURL!) : "#"
        var out = html.replacingOccurrences(of: "__FV_RETRY_URL__", with: retry)
        if isHttpsPageURL(pregameURL) {
            return out.replacingOccurrences(of: "__FV_PREGAME_URL__", with: htmlAttr(pregameURL!))
        }
        let startMark = "<!--fv-saved-->"
        let endMark = "<!--/fv-saved-->"
        if let start = out.range(of: startMark), let end = out.range(of: endMark), start.lowerBound < end.lowerBound {
            out.removeSubrange(start.lowerBound..<end.upperBound)
            return out
        }
        return out.replacingOccurrences(of: "__FV_PREGAME_URL__", with: "#")
    }

    private static func sameHttpsApp(_ failedURL: String?, _ appURL: String?) -> URLComponents? {
        guard let failedURL, let appURL,
              let failed = URLComponents(string: failedURL),
              let app = URLComponents(string: appURL),
              failed.scheme?.lowercased() == "https",
              app.scheme?.lowercased() == "https",
              let failedHost = failed.host, let appHost = app.host,
              failedHost.lowercased() == appHost.lowercased(),
              (failed.port ?? 443) == (app.port ?? 443) else {
            return nil
        }
        return failed
    }

    private static func isHttpsPageURL(_ url: String?) -> Bool {
        guard let url, url.hasPrefix("https://"), !url.contains("\""), !url.contains("<"), !url.contains(" "),
              let parts = URLComponents(string: url),
              parts.scheme?.lowercased() == "https", parts.host != nil else {
            return false
        }
        return true
    }

    private static func htmlAttr(_ url: String) -> String {
        url.replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "\"", with: "&quot;")
            .replacingOccurrences(of: "<", with: "&lt;")
    }
}
