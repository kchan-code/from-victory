//
//  FVAppleIAPPlugin.swift
//  From Victory — native shell (Capacitor)
//
//  *** DRAFT — NOT YET ADDED TO THE XCODE PROJECT (FV-572). ***
//  This file is release-held code preparation only. It has never been
//  compiled. project.pbxproj was deliberately NOT touched to add it as a
//  build source — adding a new Swift file to an Xcode-managed target
//  requires a one-time step inside Xcode itself (see
//  docs/fv572-ios-bridge-notes.md for the exact steps). Compile
//  verification, on-device StoreKit testing (Sandbox), and the
//  IPHONEOS_DEPLOYMENT_TARGET bump this file needs (see the note below) are
//  all FV-573 device-QA work — nothing here has been built or run.
//
//  ---------------------------------------------------------------------
//  DEPLOYMENT TARGET GAP (flag for FV-573, not fixed here):
//  StoreKit 2's async/await APIs used throughout this file require iOS 15+.
//  apps/native/ios/App/App.xcodeproj/project.pbxproj currently pins
//  IPHONEOS_DEPLOYMENT_TARGET = 14.0 (and Podfile pins `platform :ios,
//  '14.0'`). This plugin is annotated `@available(iOS 15.0, *)` so it is
//  compiler-safe against a 14.0 deployment target, but the *feature* it
//  implements is inert until FV-573 raises the deployment target to 15.0 in
//  both project.pbxproj and Podfile — a change explicitly out of scope here
//  (this task may not touch project.pbxproj) and gated on confirming no
//  other native-shell requirement still needs iOS 14 support.
//  ---------------------------------------------------------------------
//
//  PLUGIN CONTRACT — must match apps/web/lib/native/apple-iap.ts EXACTLY.
//  See that file's header for the full JS-side contract; the summary here
//  is the native-side mirror of the same four methods:
//
//    getProducts({ productIds: [String] })
//      -> { "products": [{ "productId", "displayPrice", "displayName" }] }
//
//    purchase({ productId: String, appAccountToken: String })
//      -> { "ok": true, "signedTransactionInfo": String, "signedRenewalInfo": String? }
//       | { "ok": false, "error": "cancelled" | "pending" | "failed" }
//
//    restore()
//      -> { "ok": true, "transactions": [{ "signedTransactionInfo", "signedRenewalInfo"? }] }
//         (NEWEST-FIRST by purchaseDate — the JS side relies on this order
//         and does not re-sort)
//       | { "ok": false, "error": "failed" }
//
//    manageSubscriptions()
//      -> { "ok": true } | { "ok": false, "error": "failed" }
//
//  Every method resolves (never rejects) with one of the shapes above so a
//  plugin-contract drift is a JS-side type mismatch, not a thrown JS
//  exception the caller has to remember to catch.
//

import Capacitor
import Foundation
import StoreKit

@available(iOS 15.0, *)
@objc(FVAppleIAPPlugin)
public class FVAppleIAPPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FVAppleIAPPlugin"
    public let jsName = "FVAppleIAPPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise),
    ]

    // -----------------------------------------------------------------
    // getProducts
    // -----------------------------------------------------------------

    @objc func getProducts(_ call: CAPPluginCall) {
        let productIds = call.getArray("productIds", String.self) ?? []
        guard !productIds.isEmpty else {
            call.resolve(["products": []])
            return
        }

        Task {
            do {
                let storeProducts = try await Product.products(for: Set(productIds))
                let payload = storeProducts.map { product -> [String: String] in
                    [
                        "productId": product.id,
                        "displayPrice": product.displayPrice,
                        "displayName": product.displayName,
                    ]
                }
                call.resolve(["products": payload])
            } catch {
                // getProducts never fails the JS call — an empty result is
                // the correct "nothing to show" signal (the JS wrapper
                // falls back to its own injected config displayName).
                call.resolve(["products": []])
            }
        }
    }

    // -----------------------------------------------------------------
    // purchase
    // -----------------------------------------------------------------

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"), !productId.isEmpty else {
            call.resolve(["ok": false, "error": "failed"])
            return
        }
        guard
            let tokenString = call.getString("appAccountToken"),
            let appAccountToken = UUID(uuidString: tokenString)
        else {
            call.resolve(["ok": false, "error": "failed"])
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.resolve(["ok": false, "error": "failed"])
                    return
                }

                let result = try await product.purchase(options: [.appAccountToken(appAccountToken)])

                switch result {
                case .success(let verificationResult):
                    switch verificationResult {
                    case .verified(let transaction):
                        // `jwsRepresentation` is available on the
                        // VerificationResult regardless of verified/
                        // unverified — grab it from the already-matched
                        // `.verified` case. Server-side re-verifies
                        // independently (SignedDataVerifier) per record
                        // §4.2 — the client is never the trust boundary.
                        let signedTransactionInfo = verificationResult.jwsRepresentation
                        let signedRenewalInfo = await Self.currentRenewalInfoJWS(for: product)

                        // Finish immediately: the durable server-side
                        // record comes from submitApplePurchase's
                        // real-time server call (and, as a backstop,
                        // restore() + Notifications V2) — NOT from
                        // StoreKit's unfinished-transaction redelivery
                        // queue. Waiting to finish until after the JS
                        // layer's server round-trip would need a second
                        // bridge call with no corresponding benefit here.
                        await transaction.finish()

                        var payload: [String: Any] = [
                            "ok": true,
                            "signedTransactionInfo": signedTransactionInfo,
                        ]
                        if let signedRenewalInfo {
                            payload["signedRenewalInfo"] = signedRenewalInfo
                        }
                        call.resolve(payload)

                    case .unverified:
                        // StoreKit's own local verification failed — do not
                        // grant, do not forward, do not finish.
                        call.resolve(["ok": false, "error": "failed"])
                    }

                case .userCancelled:
                    call.resolve(["ok": false, "error": "cancelled"])

                case .pending:
                    // e.g. Ask to Buy / SCA — no transaction yet.
                    call.resolve(["ok": false, "error": "pending"])

                @unknown default:
                    call.resolve(["ok": false, "error": "failed"])
                }
            } catch {
                call.resolve(["ok": false, "error": "failed"])
            }
        }
    }

    // -----------------------------------------------------------------
    // restore
    // -----------------------------------------------------------------

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()

                var entries: [(date: Date, payload: [String: String])] = []
                for await verificationResult in Transaction.currentEntitlements {
                    guard case .verified(let transaction) = verificationResult else {
                        // Unverified entitlement — skip; never surfaced to
                        // the server as if it were trustworthy.
                        continue
                    }
                    var payload: [String: String] = [
                        "signedTransactionInfo": verificationResult.jwsRepresentation,
                    ]
                    if let product = try? await Product.products(for: [transaction.productID]).first,
                       let renewalJWS = await Self.currentRenewalInfoJWS(for: product) {
                        payload["signedRenewalInfo"] = renewalJWS
                    }
                    entries.append((date: transaction.purchaseDate, payload: payload))
                }

                // CONTRACT: newest-first — the JS wrapper reads
                // transactions[0] as "the current one" and never re-sorts.
                let transactions = entries
                    .sorted { $0.date > $1.date }
                    .map { $0.payload }

                call.resolve(["ok": true, "transactions": transactions])
            } catch {
                call.resolve(["ok": false, "error": "failed"])
            }
        }
    }

    // -----------------------------------------------------------------
    // manageSubscriptions
    // -----------------------------------------------------------------

    @objc func manageSubscriptions(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let scene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
            else {
                call.resolve(["ok": false, "error": "failed"])
                return
            }

            do {
                try await AppStore.showManageSubscriptions(in: scene)
                call.resolve(["ok": true])
            } catch {
                call.resolve(["ok": false, "error": "failed"])
            }
        }
    }

    // -----------------------------------------------------------------
    // Shared helper
    // -----------------------------------------------------------------

    /// Best-effort renewal-info JWS for `product`, via
    /// `Product.SubscriptionInfo.Status`. Returns `nil` (never throws) when
    /// the product has no subscription info or no matching status entry —
    /// callers treat a missing renewal JWS as "transaction-only," which the
    /// server already handles (`signedRenewalInfo` is optional end to end).
    private static func currentRenewalInfoJWS(for product: Product) async -> String? {
        guard let subscription = product.subscription else { return nil }
        guard let statuses = try? await subscription.status else { return nil }
        for status in statuses {
            // `.jwsRepresentation` lives on the `VerificationResult` wrapper
            // itself (see the `signedTransactionInfo` extraction above), not
            // on the unwrapped `RenewalInfo` payload — only take it once we
            // know the wrapper is the `.verified` case.
            if case .verified = status.renewalInfo {
                return status.renewalInfo.jwsRepresentation
            }
        }
        return nil
    }
}
