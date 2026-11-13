import UIKit
import WebKit
import Capacitor
import os

/**
 * FV-573: app-local plugin registration.
 *
 * Capacitor's auto-registration reads ONLY the generated
 * capacitor.config.json `packageClassList`, which the CLI rebuilds from
 * detected npm plugin packages on every sync/copy — a user-supplied
 * `packageClassList` in capacitor.config.ts is overwritten (verified
 * empirically against Capacitor CLI 7.4.x output). App-local plugins that
 * are not npm packages therefore register here, via the documented
 * CAPBridgeViewController subclass hook. Main.storyboard's view controller
 * class points at this subclass (customModule "App").
 *
 * Adding a plugin here is a privacy-reviewed act — the same allowlist
 * discipline as capacitor.config.ts's plugin list applies.
 */
class FVBridgeViewController: CAPBridgeViewController {
    /// Strong owner of the fallback delegate. WKWebView.navigationDelegate is
    /// weak, so this property is what keeps the retry timer alive.
    private var offlineNavigation: FVOfflineNavigationDelegate?

    override open func capacitorDidLoad() {
        // Deployment target is iOS 15.0 (StoreKit 2 floor), so the
        // availability guard is belt-and-suspenders for the annotated class.
        if #available(iOS 15.0, *) {
            bridge?.registerPluginInstance(FVAppleIAPPlugin())
        }
        bridge?.registerPluginInstance(FVNarrationPlugin())
        // FV-675: app-local sign-in bridge (system-browser OAuth + the Sign
        // in with Apple sheet). Host allow-list and callback scheme are
        // hard-coded in FVAuthPlugin.swift; product + privacy reviewed.
        bridge?.registerPluginInstance(FVAuthPlugin())
        // FV-589: CLI-verifiable evidence (via unified log, not stdout)
        // that the storyboard's FVBridgeViewController actually ran under
        // the new SceneDelegate and finished plugin registration.
        os.Logger(subsystem: Bundle.main.bundleIdentifier ?? "app", category: "scene")
            .info("FVBridgeViewController.capacitorDidLoad: registered FVAppleIAPPlugin, FVNarrationPlugin, FVAuthPlugin")
        // FV-718: install before viewDidLoad starts the server.url load.
        installOfflineEntryFallback()
    }

    /// FV-717: tell the server which build this is, so it can require an
    /// update (apps/web/lib/native-build-gate.ts). Appends a whole
    /// `FVBuild/<CFBundleVersion>` token AFTER the tokens Capacitor already
    /// added from `ios.appendUserAgent`; nothing existing is changed or
    /// removed, so every server-side check on `FVNativeShell/1 (ios)` still
    /// matches. Read from the running bundle, so the number can never drift
    /// from the build App Store Connect has. A build number that is not a
    /// plain positive integer (this project uses 1, 2, 3...) adds nothing:
    /// the server then treats the app as having no build number.
    override open func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let configuration = super.webViewConfiguration(for: instanceConfiguration)
        guard let marker = Self.buildMarker(
            bundleVersion: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String
        ) else {
            return configuration
        }
        if let existing = configuration.applicationNameForUserAgent, !existing.isEmpty {
            configuration.applicationNameForUserAgent = "\(existing) \(marker)"
        } else {
            configuration.applicationNameForUserAgent = marker
        }
        return configuration
    }

    /// `FVBuild/<n>` for a plain positive-integer build number, else nil.
    static func buildMarker(bundleVersion: String?) -> String? {
        guard let raw = bundleVersion?.trimmingCharacters(in: .whitespaces),
              !raw.isEmpty, raw.count <= 9,
              raw.allSatisfy({ $0.isASCII && $0.isNumber }),
              let number = Int(raw), number > 0 else {
            return nil
        }
        return "FVBuild/\(number)"
    }

    /// Capacitor's delegate stays in front for allow-list and plugin decisions.
    /// `server.errorPath` is left unset so Capacitor does not start a second
    /// local load that races this one.
    private func installOfflineEntryFallback() {
        guard let webView else { return }
        let proxy = FVOfflineNavigationDelegate(forward: webView.navigationDelegate)
        proxy.appURLProvider = { [weak self] in
            self?.bridge?.config.serverURL.absoluteString
        }
        offlineNavigation = proxy
        webView.navigationDelegate = proxy
    }

    deinit {
        offlineNavigation?.cancelPendingRetry()
    }
}
