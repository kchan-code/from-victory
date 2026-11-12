//
//  FVAuthPlugin.swift
//  From Victory — native shell (Capacitor)
//
//  FV-675 (SSO P0, FV-569 spec §5.3, §5.4, §6): app-local sign-in bridge.
//  No third-party SDK. Google runs as Supabase-hosted OAuth in the system
//  browser (ASWebAuthenticationSession); Apple runs as the native Sign in with
//  Apple sheet. Both hand their result back to the WebView, which finishes
//  the exchange on the server with ITS OWN verifier (PKCE / handoff), so a
//  callback URL is useless on its own (RFC 8252 §8.1).
//
//  PLUGIN CONTRACT — must match apps/web/lib/native/auth.ts EXACTLY.
//  Every method RESOLVES (never rejects) with one of these shapes:
//
//    startSession({ url: String })
//      -> { "ok": true, "url": String }   // the com.fromvictoryapp.app://auth/callback… URL
//       | { "ok": false, "error": "cancelled" | "busy" | "rejected_url" | "failed" }
//
//    signInWithApple({ nonceHash: String })   // 64 hex chars, SHA-256 of the raw nonce
//      -> { "ok": true, "identityToken": String, "authorizationCode": String }
//       | { "ok": false, "error": "cancelled" | "busy" | "invalid_nonce" | "failed" }
//
//  HARDENING (spec §6, §9):
//    - The callback scheme is hard-coded here and never read from JS.
//    - startSession only opens https URLs whose host is on the native
//      allow-list below; staging hosts are added only when the build was
//      synced with FV_SSO_STAGING_BUILD=1 (plugins.FVAuth.stagingHosts in the
//      bundled capacitor.config.json — not reachable from page JS).
//    - One sign-in interaction at a time across both methods; a second call
//      while one is open resolves `busy`.
//    - Nothing here logs a URL, code, or token — only outcome categories.
//    - No email or name is requested beyond scope `.email`, and the plugin
//      returns neither: the server reads the email from the verified token.
//

import AuthenticationServices
import Capacitor
import Foundation
import os

@objc(FVAuthPlugin)
public class FVAuthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FVAuthPlugin"
    public let jsName = "FVAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signInWithApple", returnType: CAPPluginReturnPromise),
    ]

    /// Hard-coded; matches CFBundleURLTypes in Info.plist and the Supabase
    /// redirect `com.fromvictoryapp.app://auth/callback`.
    static let callbackScheme = "com.fromvictoryapp.app"
    static let callbackHost = "auth"
    static let callbackPath = "/callback"

    /// Production: the Supabase auth host and the site (Apple web start route).
    static let productionHosts: Set<String> = [
        "kumrgeosgzdlxgljbyju.supabase.co",
        "www.fromvictoryapp.com",
    ]
    /// Added only in builds synced with FV_SSO_STAGING_BUILD=1.
    static let stagingHosts: Set<String> = [
        "xmznvajmljhfmexjthlz.supabase.co",
        "fv-android-staging-web.vercel.app",
    ]

    private static let logger = os.Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "app",
        category: "auth"
    )

    // All mutable state below is main-queue confined.
    private var allowedHosts: Set<String> = FVAuthPlugin.productionHosts
    private var busy = false
    private var webSession: ASWebAuthenticationSession?
    private var appleController: ASAuthorizationController?
    private var appleCall: CAPPluginCall?

    public override func load() {
        let staging = getConfig().getBoolean("stagingHosts", false)
        let hosts = staging
            ? FVAuthPlugin.productionHosts.union(FVAuthPlugin.stagingHosts)
            : FVAuthPlugin.productionHosts
        DispatchQueue.main.async { self.allowedHosts = hosts }
        FVAuthPlugin.logger.info("FVAuth loaded; staging allow-list: \(staging, privacy: .public)")
    }

    // -----------------------------------------------------------------
    // Validation (pure; unit-testable shape)
    // -----------------------------------------------------------------

    /// https only, host on the allow-list, no userinfo, default port only.
    static func isAllowedStartURL(_ url: URL, allowedHosts: Set<String>) -> Bool {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              components.scheme?.lowercased() == "https",
              let host = components.host?.lowercased(), !host.isEmpty,
              allowedHosts.contains(host),
              components.user == nil, components.password == nil
        else { return false }
        if let port = components.port, port != 443 { return false }
        return true
    }

    /// The only callback the plugin hands back: com.fromvictoryapp.app://auth/callback…
    static func isExpectedCallback(_ url: URL) -> Bool {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return false }
        return components.scheme?.lowercased() == callbackScheme
            && components.host?.lowercased() == callbackHost
            && components.path == callbackPath
    }

    /// SHA-256 hex: exactly 64 hex characters.
    static func isValidNonceHash(_ value: String) -> Bool {
        value.count == 64 && value.allSatisfy { $0.isHexDigit && $0.isASCII }
    }

    // -----------------------------------------------------------------
    // startSession
    // -----------------------------------------------------------------

    @objc func startSession(_ call: CAPPluginCall) {
        let raw = call.getString("url") ?? ""
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            if self.busy {
                call.resolve(["ok": false, "error": "busy"])
                return
            }
            guard let url = URL(string: raw),
                  FVAuthPlugin.isAllowedStartURL(url, allowedHosts: self.allowedHosts)
            else {
                FVAuthPlugin.logger.info("FVAuth.startSession: rejected_url")
                call.resolve(["ok": false, "error": "rejected_url"])
                return
            }
            self.busy = true

            let completion: ASWebAuthenticationSession.CompletionHandler = { [weak self] callbackURL, error in
                DispatchQueue.main.async {
                    self?.finishWebSession(call: call, callbackURL: callbackURL, error: error)
                }
            }
            let session: ASWebAuthenticationSession
            if #available(iOS 17.4, *) {
                session = ASWebAuthenticationSession(
                    url: url,
                    callback: .customScheme(FVAuthPlugin.callbackScheme),
                    completionHandler: completion
                )
            } else {
                session = ASWebAuthenticationSession(
                    url: url,
                    callbackURLScheme: FVAuthPlugin.callbackScheme,
                    completionHandler: completion
                )
            }
            // Shared (non-ephemeral) browser session: the athlete's existing
            // Google sign-in is reused. Disclosed in the App Review notes.
            session.prefersEphemeralWebBrowserSession = false
            session.presentationContextProvider = self
            self.webSession = session
            if !session.start() {
                FVAuthPlugin.logger.error("FVAuth.startSession: session failed to start")
                self.webSession = nil
                self.busy = false
                call.resolve(["ok": false, "error": "failed"])
            }
        }
    }

    private func finishWebSession(call: CAPPluginCall, callbackURL: URL?, error: Error?) {
        webSession = nil
        busy = false
        if let error {
            if let authError = error as? ASWebAuthenticationSessionError,
               authError.code == .canceledLogin {
                call.resolve(["ok": false, "error": "cancelled"])
            } else {
                FVAuthPlugin.logger.error("FVAuth.startSession: failed (\((error as NSError).code, privacy: .public))")
                call.resolve(["ok": false, "error": "failed"])
            }
            return
        }
        guard let callbackURL, FVAuthPlugin.isExpectedCallback(callbackURL) else {
            FVAuthPlugin.logger.error("FVAuth.startSession: unexpected callback shape")
            call.resolve(["ok": false, "error": "failed"])
            return
        }
        call.resolve(["ok": true, "url": callbackURL.absoluteString])
    }

    // -----------------------------------------------------------------
    // signInWithApple
    // -----------------------------------------------------------------

    @objc func signInWithApple(_ call: CAPPluginCall) {
        let nonceHash = call.getString("nonceHash") ?? ""
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            if self.busy {
                call.resolve(["ok": false, "error": "busy"])
                return
            }
            guard FVAuthPlugin.isValidNonceHash(nonceHash) else {
                call.resolve(["ok": false, "error": "invalid_nonce"])
                return
            }
            self.busy = true
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.email]
            request.nonce = nonceHash
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            self.appleController = controller
            self.appleCall = call
            controller.performRequests()
        }
    }

    private func finishApple(_ result: [String: Any]) {
        let call = appleCall
        appleCall = nil
        appleController = nil
        busy = false
        call?.resolve(result)
    }

    private var presentationWindow: ASPresentationAnchor {
        if let window = bridge?.webView?.window { return window }
        if let window = bridge?.viewController?.view.window { return window }
        return ASPresentationAnchor()
    }
}

// MARK: - ASWebAuthenticationSession presentation

extension FVAuthPlugin: ASWebAuthenticationPresentationContextProviding {
    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        presentationWindow
    }
}

// MARK: - Sign in with Apple

extension FVAuthPlugin: ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        presentationWindow
    }

    public func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithAuthorization authorization: ASAuthorization) {
        DispatchQueue.main.async {
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let identityToken = String(data: tokenData, encoding: .utf8),
                  let codeData = credential.authorizationCode,
                  let authorizationCode = String(data: codeData, encoding: .utf8),
                  !identityToken.isEmpty, !authorizationCode.isEmpty
            else {
                FVAuthPlugin.logger.error("FVAuth.signInWithApple: credential missing token or code")
                self.finishApple(["ok": false, "error": "failed"])
                return
            }
            // The token and the code come from the SAME credential — the
            // spec §5.4 same-transaction rule for iOS.
            self.finishApple([
                "ok": true,
                "identityToken": identityToken,
                "authorizationCode": authorizationCode,
            ])
        }
    }

    public func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithError error: Error) {
        DispatchQueue.main.async {
            if let authError = error as? ASAuthorizationError, authError.code == .canceled {
                self.finishApple(["ok": false, "error": "cancelled"])
            } else {
                FVAuthPlugin.logger.error("FVAuth.signInWithApple: failed (\((error as NSError).code, privacy: .public))")
                self.finishApple(["ok": false, "error": "failed"])
            }
        }
    }
}
