# FV-572 — iOS StoreKit 2 bridge: notes for the one-time Xcode add + FV-573 device QA

Status: **DRAFT CODE PREPARATION**, written under the release hold from
`docs/fv210-ios-iap-decision-record.md`. Nothing in this arc has been built,
synced (`npx cap sync`), or run on a device or simulator. This doc is the
handoff to whoever does FV-573 (device QA / first real build).

## 1. What shipped in this slice (FV-572)

- `apps/web/lib/subscriptions/apple-products.ts` — client-safe, env-injected
  Apple product config (`NEXT_PUBLIC_APPLE_PRODUCTS`). Empty by default —
  this IS the shipped production state today.
- `apps/web/lib/native/apple-iap.ts` — TypeScript wrapper around the
  injected `window.Capacitor.Plugins.FVAppleIAPPlugin` global. See its file
  header for the full JS-side plugin contract.
- `apps/web/components/subscribe/AppleSubscribeSection.tsx` — the purchase /
  restore / manage UI, rendered by `apps/web/app/subscribe/page.tsx` only
  when `getRequestShellCapability()` (`apps/web/lib/native-shell.ts`)
  resolves to `"ios-iap"`.
- `apps/native/ios/App/App/FVAppleIAPPlugin.swift` — the Swift plugin DRAFT.
  **Not yet a build source in the Xcode project** — see Step 2 below.

None of this is reachable in production yet: `NEXT_PUBLIC_APPLE_PRODUCTS` is
unset, so `AppleSubscribeSection` always renders its neutral "not available"
state, and the iOS build shipped to TestFlight today does not carry the
`FVAppleIAPPlugin.swift` source at all (Step 2 hasn't happened).

## 2. The one-time Xcode add-file step (do this once, in Xcode)

`project.pbxproj` was deliberately **not** touched by this slice — hand-editing
the Xcode project file's file-reference/build-phase entries outside of Xcode
itself is exactly the kind of edit that silently corrupts the project (FV-478
already burned the team once on a config file that "compiled fine, shipped,
and did nothing" — see `apps/native/capacitor.config.ts`'s `appendUserAgent`
comment). So:

1. Open `apps/native/ios/App/App.xcworkspace` in Xcode (NOT the `.xcodeproj`
   — Capacitor projects use CocoaPods, so the workspace is the one with the
   Pods target wired in).
2. In the Project Navigator, right-click the `App` group (same group that
   already contains `AppDelegate.swift`) → **Add Files to "App"…**
3. Select `FVAppleIAPPlugin.swift`. Ensure "Copy items if needed" is
   unchecked (the file is already inside the `App` folder on disk) and the
   `App` target's checkbox is checked.
4. Raise the deployment target to iOS 15.0 (see Section 3 — required before
   this file does anything useful) in both:
   - `App.xcodeproj` → target `App` → Build Settings →
     `IPHONEOS_DEPLOYMENT_TARGET` (all three configs currently read `14.0`).
   - `apps/native/ios/App/Podfile` → `platform :ios, '14.0'`.
   Then re-run `pod install` from `apps/native/ios/App/`.
5. Build. Fix any compiler diagnostics Xcode surfaces — this file has never
   been compiled (see Section 4 for the specific things to verify).

## 3. Deployment-target gap (flag, not fixed here)

StoreKit 2's `Product` / `Transaction` / `AppStore` async APIs require
**iOS 15+**. The current project pins **iOS 14.0**
(`IPHONEOS_DEPLOYMENT_TARGET` in `project.pbxproj`, `platform :ios, '14.0'`
in `Podfile`). `FVAppleIAPPlugin` is annotated `@available(iOS 15.0, *)` so
it compiles cleanly against a 14.0 deployment target, but the feature is
inert until the deployment target is actually raised — that's an explicit
`project.pbxproj`/`Podfile` change this task was not authorized to make
(hot-file / release-hold discipline). Before raising it, confirm no other
native-shell requirement still needs iOS 14 device support (check current
TestFlight install base / Play min-SDK parity intent, if any).

## 4. What FV-573 (device QA) must verify

This code has been written carefully against Apple's documented StoreKit 2
API, but it is unverified — nobody has compiled or run it. Named
verification items:

1. **Compiles clean** against the raised iOS 15.0 deployment target, with the
   plugin registered (Capacitor auto-discovers local plugins that conform to
   `CAPBridgedPlugin` and are compiled into the `App` target — no separate
   registration file/array is needed for a local, non-npm plugin like this
   one; confirm this is still true for the installed Capacitor 7 version in
   `apps/native/package.json`).
2. **`window.Capacitor.Plugins.FVAppleIAPPlugin` is reachable from the
   WebView** after a real `npx cap sync ios` + build — i.e.
   `isAppleIapBridgeAvailable()` (`apps/web/lib/native/apple-iap.ts`) returns
   `true` on-device.
3. **`getProducts`** returns real StoreKit metadata for Sandbox test product
   ids configured in App Store Connect (Section 4.6 P2 — pending KC pricing
   decision) once `NEXT_PUBLIC_APPLE_PRODUCTS` is set for a test build.
4. **`purchase` — the full StoreKit purchase sheet flow**, all four
   branches: `.success(.verified)` (normal purchase), `.userCancelled`
   (dismiss the sheet — confirm the UI resets quietly, no error), `.pending`
   (Ask to Buy on a Sandbox family-organizer account, if testable), and a
   forced `.success(.unverified)` if there's a way to simulate it (jailbroken
   Sandbox tooling / StoreKit Testing configuration with a corrupted
   receipt) — confirm it is rejected, not forwarded.
5. **`appAccountToken` round-trip**: confirm the UUID passed from
   `beginApplePurchase()` (`apps/web/lib/actions/apple-subscription.ts`)
   survives the `Product.PurchaseOption.appAccountToken` → purchased
   `Transaction.appAccountToken` round trip byte-for-byte, and that the
   server's token-mismatch check
   (`submitApplePurchase`, Section 5b of the decision record) passes for a
   genuine purchase.
6. **`signedRenewalInfo` availability**: confirm whether
   `Product.SubscriptionInfo.Status.renewalInfo` is reliably populated
   immediately after a fresh purchase (before the first renewal cycle) on a
   real device/Sandbox — if it's frequently absent at purchase-time, that's
   fine (the field is optional end-to-end, server-side too), but worth
   noting for future debugging rather than treating as a bug.
7. **`restore`** — confirm `Transaction.currentEntitlements` on-device
   returns transactions in an order the plugin's `sorted { $0.date >
   $1.date }` actually needs (i.e. StoreKit doesn't already guarantee
   newest-first) and that a genuine restore (delete + reinstall app, same
   Apple ID) round-trips through `submitApplePurchase` correctly.
8. **`manageSubscriptions`** — confirm `AppStore.showManageSubscriptions(in:)`
   presents correctly from the plugin's `UIWindowScene` lookup (the
   `.foregroundActive` scene lookup is a best-effort default for a
   single-window app — revisit if the app ever supports multiple scenes).
9. **Finish-transaction timing** (documented decision, not a question, but
   verify no regression): the plugin calls `transaction.finish()`
   immediately after capturing the JWS, before the JS layer's
   `submitApplePurchase` server round-trip completes. Confirm this doesn't
   cause any observable "missing transaction" issue in practice — the
   fallback path (restore + Notifications V2) exists precisely because
   finish-timing here is a deliberate, documented tradeoff (see the plugin's
   inline comment), not an oversight.

## 5. Plugin contract quick-reference

| Method | Input | Success | Failure |
|---|---|---|---|
| `getProducts` | `{ productIds: string[] }` | `{ products: { productId, displayPrice, displayName }[] }` | never fails — empty array on any problem |
| `purchase` | `{ productId, appAccountToken }` | `{ ok: true, signedTransactionInfo, signedRenewalInfo? }` | `{ ok: false, error: "cancelled" \| "pending" \| "failed" }` |
| `restore` | — | `{ ok: true, transactions: { signedTransactionInfo, signedRenewalInfo? }[] }` (newest-first; may be empty) | `{ ok: false, error: "failed" }` |
| `manageSubscriptions` | — | `{ ok: true }` | `{ ok: false, error: "failed" }` |

The TS-side `"bridge_unavailable"` error code never comes from native — it's
what `apps/web/lib/native/apple-iap.ts` returns locally when
`window.Capacitor.Plugins.FVAppleIAPPlugin` isn't present at all.
