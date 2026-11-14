import Capacitor
import os
import UIKit
import WebKit

/**
 * FV-718: wraps Capacitor's navigation delegate. Capacitor already owns
 * allow-list, plugin, and external-link decisions; those methods are forwarded.
 * This type adds the two cases Capacitor does not cover for a hosted
 * `server.url`: a connectivity failure (no `errorPath` race — that key is
 * intentionally unset) and a main-frame HTTP 5xx.
 *
 * Logs carry the error or status code only. Never a URL.
 */
final class FVOfflineNavigationDelegate: NSObject, WKNavigationDelegate {
    /// Capacitor's concrete delegate. Optional WKWebView methods are ordinary
    /// methods on this class, so forwarding does not depend on calling an
    /// optional protocol member through an existential.
    weak var forward: WebViewDelegationHandler?
    /// The configured server URL (`server.url`). Captured weakly by the caller.
    var appURLProvider: () -> String? = { nil }

    private var pregameRetries = 0
    private var pendingRetry: DispatchWorkItem?
    /// Set by `showOfflinePage` just before it loads the bundled HTML, and
    /// cleared by the navigation decision that consumes it. Only a load this
    /// class started is kept inside the WebView.
    private var offlinePageLoadPending = false
    private let logger = os.Logger(subsystem: Bundle.main.bundleIdentifier ?? "app", category: "offline")

    init(forward: WKNavigationDelegate?) {
        self.forward = forward as? WebViewDelegationHandler
    }

    func cancelPendingRetry() {
        pendingRetry?.cancel()
        pendingRetry = nil
    }

    deinit {
        pendingRetry?.cancel()
    }

    // MARK: WKNavigationDelegate

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        forward?.webView(webView, didFail: navigation, withError: error)
        applyConnectivityFailure(webView, error: error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        forward?.webView(webView, didFailProvisionalNavigation: navigation, withError: error)
        applyConnectivityFailure(webView, error: error)
    }

    /// The bundled offline page is loaded under `https://fv-offline.invalid/`.
    /// Capacitor's handler sees that as a top-level link outside the app and
    /// opens it in Safari, leaving the WebView blank. Allow that one load here;
    /// every other decision still goes to Capacitor (allow-list, plugins,
    /// external links).
    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        if offlinePageLoadPending,
           navigationAction.targetFrame?.isMainFrame == true,
           OfflineEntryFallback.isOfflinePageLoad(navigationAction.request.url?.absoluteString) {
            offlinePageLoadPending = false
            decisionHandler(.allow)
            return
        }
        guard let forward else {
            decisionHandler(.allow)
            return
        }
        forward.webView(webView, decidePolicyFor: navigationAction, decisionHandler: decisionHandler)
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationResponse: WKNavigationResponse,
        decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void
    ) {
        if navigationResponse.isForMainFrame,
           let http = navigationResponse.response as? HTTPURLResponse {
            let action = OfflineEntryFallback.decideHttpStatus(
                failedURL: http.url?.absoluteString,
                isMainFrame: true,
                statusCode: http.statusCode,
                appURL: appURLProvider()
            )
            if action == .showOfflinePage {
                logger.info("FV-718 main-frame HTTP \(http.statusCode, privacy: .public) -> local offline page")
                decisionHandler(.cancel)
                cancelPendingRetry()
                showOfflinePage(on: webView)
                return
            }
        }
        // Capacitor 8's WebViewDelegationHandler does not implement
        // decidePolicyFor(navigationResponse:). Allowing is the whole policy
        // for responses this class did not replace with the offline page.
        decisionHandler(.allow)
    }

    /// Optional WKWebView delegate methods Capacitor implements (navigation
    /// allow-list, TLS, process termination) must still be offered. Methods
    /// this class implements have to report `true` even when the superclass
    /// does not, or WebKit skips them.
    override func responds(to aSelector: Selector!) -> Bool {
        if FVOfflineNavigationDelegate.instancesRespond(to: aSelector),
           !NSObject.instancesRespond(to: aSelector) {
            return true
        }
        return forward?.responds(to: aSelector) ?? false
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? {
        if let forward, forward.responds(to: aSelector) {
            return forward
        }
        return super.forwardingTarget(for: aSelector)
    }

    // MARK: Actions

    private func applyConnectivityFailure(_ webView: WKWebView, error: Error) {
        let nsError = error as NSError
        // Cancellation is what we ourselves cause by rejecting a 5xx response.
        guard nsError.domain == NSURLErrorDomain, nsError.code != NSURLErrorCancelled else { return }
        let failed = (nsError.userInfo[NSURLErrorFailingURLStringErrorKey] as? String)
            ?? (nsError.userInfo[NSURLErrorFailingURLErrorKey] as? URL)?.absoluteString
        let action = OfflineEntryFallback.decide(
            failedURL: failed,
            isMainFrame: true,
            errorCode: nsError.code,
            appURL: appURLProvider(),
            pregameRetriesSoFar: pregameRetries
        )
        switch action {
        case .none:
            break
        case .openPregame:
            guard let string = OfflineEntryFallback.pregameURLString(appURLProvider()),
                  let url = URL(string: string) else { return }
            logger.info("FV-718 entry offline (code \(nsError.code, privacy: .public)) -> pregame shell")
            cancelPendingRetry()
            pregameRetries = 0
            webView.load(URLRequest(url: url))
        case .retryPregame:
            let delay = OfflineEntryFallback.retryDelayMs(pregameRetries)
            pregameRetries += 1
            logger.info("FV-718 pregame offline (code \(nsError.code, privacy: .public)) -> local page, retry \(self.pregameRetries, privacy: .public)/\(OfflineEntryFallback.maxPregameRetries, privacy: .public)")
            showOfflinePage(on: webView)
            scheduleRetry(on: webView, delayMs: delay)
        case .showOfflinePage:
            logger.info("FV-718 page offline (code \(nsError.code, privacy: .public)) -> local offline page")
            showOfflinePage(on: webView)
        }
    }

    private func scheduleRetry(on webView: WKWebView, delayMs: Int) {
        cancelPendingRetry()
        guard let string = OfflineEntryFallback.pregameURLString(appURLProvider()),
              let pregame = URL(string: string) else { return }
        let work = DispatchWorkItem { [weak self, weak webView] in
            guard let self, let webView else { return }
            self.pendingRetry = nil
            if OfflineEntryFallback.isLocalOfflinePageURL(webView.url?.absoluteString) {
                webView.load(URLRequest(url: pregame))
            } else {
                self.logger.info("FV-718 retry skipped: page already changed")
            }
        }
        pendingRetry = work
        DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(delayMs), execute: work)
    }

    private func showOfflinePage(on webView: WKWebView) {
        guard let file = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "public"),
              let raw = try? String(contentsOf: file, encoding: .utf8) else {
            logger.error("FV-718 offline page missing from the app bundle (public/index.html). Run npx cap sync before archiving.")
            return
        }
        let appURL = appURLProvider()
        let html = OfflineEntryFallback.injectOfflinePage(
            raw, retryURL: appURL, pregameURL: OfflineEntryFallback.pregameURLString(appURL))
        let onyx = UIColor(red: 5.0 / 255.0, green: 5.0 / 255.0, blue: 5.0 / 255.0, alpha: 1)
        webView.isOpaque = true
        webView.backgroundColor = onyx
        webView.scrollView.backgroundColor = onyx
        offlinePageLoadPending = true
        webView.loadHTMLString(html, baseURL: URL(string: OfflineEntryFallback.offlinePageBase))
    }
}
