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

---

## FV-573 simulator run findings (2026-09-12, KC-authorized local-simulator scope)

Executed on: Xcode 26.6 (17F113), iOS 26.5 simulator runtime; iPhone 17 Pro
(57886019-49EF-413F-9F1A-1EE42C27D8BD) and iPad Pro 11-inch (M5)
(803DAFAD-464C-4BDB-9C81-F395AB032AE2); Capacitor pods 7.6.8; source
7c8283d + the FV-573 native commits. Evidence: docs/fv573-evidence/.

**Answers to this doc's open verification items:**
1. **Plugin registration:** Capacitor 7's auto-registration reads ONLY the
   generated capacitor.config.json `packageClassList`, and the CLI
   OVERWRITES a user-supplied `packageClassList` from capacitor.config.ts
   with its detected-npm-packages list on every sync/copy (verified
   empirically). App-local plugins therefore register via the
   `FVBridgeViewController` (CAPBridgeViewController subclass) hook, wired
   in Main.storyboard — verified working: `window.Capacitor.Plugins
   .FVAppleIAPPlugin` visible, all four methods callable, both devices.
2. **First compile:** the draft Swift plugin compiled with ZERO fixes.
3. **Restore ordering / renewal-info presence:** restore returned the
   current entitlement; `signedRenewalInfo` WAS present immediately after
   purchase in the local test environment (both JWS well-formed,
   3 segments). Keep treating it as optional server-side regardless.
4. **finish() timing:** no observable issue locally; still verify against
   Apple sandbox at device QA.

**StoreKit-configuration mechanics (hard-won; do not rediscover):**
- `xcrun simctl launch` CANNOT apply a .storekit configuration — only an
  Xcode scheme launch pushes it (storekitd log line "Saving Octane
  configuration for <bundle>"; a run without a resolvable reference logs
  "StoreKit/Octane/LegacyDeleteConfiguration" and CLEARS any config).
- The scheme's `StoreKitConfigurationFileReference identifier` resolves
  RELATIVE TO THE .xcodeproj BUNDLE — for a file sitting next to
  App.xcodeproj the correct value is `../FVStoreKitTest.storekit`.
  An ABSOLUTE path CRASHES Xcode (assertion in
  dvt_stringByMakingAbsolutePathWithBasePath via
  IDESchemeOptionReference.resolvedReference — SIGABRT, reproduced twice).
- Xcode caches the loaded scheme: after editing the .xcscheme on disk,
  RESTART Xcode (or close/reopen the workspace) before trusting a re-run.
- Driving Xcode headlessly: the AppleScript dictionary works
  (`set active run destination`, `run`, `stop`, `last scheme action
  result`), with gotchas: variable names `rd`/`target` collide with
  dictionary terms; same-named workspace documents ALIAS in AppleScript
  addressing (close other App.xcworkspace docs first); `loaded of ws`
  must be true before queries.
- StoreKit test fixture format: numeric-string `internalID`/group `id`
  and a UUID `identifier` are required — non-numeric IDs make Xcode
  silently treat the file as unparseable (config deleted, no error
  surfaced anywhere).
- `groupNumber` = subscription LEVEL (lower number = higher service
  level). Capacity order MUST map to level order or upgrades become
  at-renewal downgrades — verified live both ways; the real ASC config
  (P2) must rank tier5 highest…tier1 lowest.
- Ask-to-Buy (`settings._askToBuyEnabled: true`) produces the PENDING
  path ("Ask Permission" sheet → bridge returns
  `{ok:false,error:"pending"}` — verified on iPad).

**Local matrix results (all typed contract codes verified on-device-sim):**
registration ✓ (both devices) · boot vs production site ✓ (read-only; the
new `(ios)` UA classified native by LIVE prod middleware) · unavailable
config → `{"products":[]}` ✓ · unknown-product purchase → `failed` ✓ ·
purchase success → txn+renewal JWS ✓ · cancel → `cancelled` ✓ · pending →
`pending` ✓ (iPad) · restore 0-state → `failed` after sign-in cancel ✓ ·
restore with entitlement → 1 transaction ✓ · manage sheet ✓ · in-group
immediate UPGRADE ("starts today, prorated refund") ✓ · in-group
DOWNGRADE ("starts when current expires") ✓ · post-upgrade
currentEntitlements = single (supersession) ✓.

**NOT proven locally (honest limits):** local StoreKit test JWS is signed
by a LOCAL test authority — it is NOT Apple-sandbox evidence and our
server verifier (Apple root CAs) would correctly reject it, so the
web-layer round-trip (beginApplePurchase → submitApplePurchase →
apple_subscriptions row) remains unit-test-covered only until Apple
sandbox QA; Notifications V2 delivery, renewals/expiry/refund lifecycle
timing, physical-device behavior, and the real /subscribe UI in-shell
(needs a served build of the FV-572 web slice + test backend) are all
device-QA/sandbox items. Harness runs used a local static page via
`CAPACITOR_SERVER_URL=http://localhost:8787` (existing env override) —
production was never written to; the only prod interaction was read-only
page loads.

---

## FV-573 UI-in-shell pass (2026-09-13, PR #519 continuation — Codex-monitor directive)

Actual `AppleSubscribeSection` (real component import, zero modifications)
observed in-shell via the hard-gated `/dev/apple-iap-preview` route
(NODE_ENV=development + FV_IAP_DEV_PREVIEW=1; structurally unreachable in any
deployed build), served by a local Next dev server; shell pointed at it with
the pre-existing `CAPACITOR_SERVER_URL` override. Runtime: Xcode 26.6,
iOS 26.5, iPhone 17 Pro (57886019) + iPad Pro 11" (803DAFAD), commit range
d66cca5..this commit.

**Matrix (REAL component + REAL classifier + REAL bridge + REAL server
action; synthetic product config only):**

| Path | Result | Stubbed or real? |
|---|---|---|
| Render/layout, iPhone | PASS — cards, capacity labels, selection ring, buttons (`iphone17pro-ui-preview-cards.png`) | Real component; localized prices via REAL bridge getProducts from the .storekit fixture |
| Render/layout, iPad | PASS (`ipadpro11-ui-preview-cards-probe.png`) | Same; probe line shows `MOUNT@318MS: BRIDGE PRESENT | RECHECK@1823MS: PRESENT` |
| shellCapability in-shell | `ios-iap` on both devices (server-rendered from the real request UA) | Real |
| Empty-product neutral state | PASS in-shell on iPhone (`iphone17pro-ui-preview-neutral-state.png`): no price, no purchase affordance, no external steering | Real component, env unset |
| Selection interaction | PASS on-device tap moves aria-checked + ring (`iphone17pro-ui-preview-selection-and-real-action-error.png`) | Real |
| Purchase tap → error presentation | PASS: REAL `beginApplePurchase` server-action round-trip (POST visible in dev-server log), refused `unauthenticated` by design → calm parent-facing error copy; ZERO writes | REAL action; auth refusal path — NOT a purchase-success path |
| Loading presentation | Transient "Completing purchase…" disabled state exercised in the same flow | Real |
| Cancel / pending presentation through the REAL component | NOT run here — requires an authed `beginApplePurchase` to reach `bridge.purchase` | See missing prerequisite below; both paths ARE proven at bridge level (this doc, 2026-09-12) and at component level with mocked actions (PR #518 RTL) |

**iPad anomaly (recorded honestly):** the first two iPad runs rendered the
SSR "unavailable" state despite `configuredProducts: 2`
(`ipadpro11-ui-preview-unavailable-anomaly.png`), while the bridge harness on
the same device showed `plugin: REGISTERED`. After the probe edit forced a
dev-server recompile (new chunk hashes), the same page renders fully and the
probe shows the bridge present AT MOUNT (318ms). Interpretation: dev-mode
chunk staleness in the WKWebView cache on first-ever load (the iPad's first
hit raced the route's first compile), NOT a bridge/registration defect and
NOT a mount-time race — both alternative theories were tested and
contradicted. Dev-server-only artifact; production builds serve immutable
hashed assets. If it ever reproduces against a production build at FV-573
sandbox QA, re-open.

**Exact missing prerequisite for the untested composite** (authed real
/subscribe page, and purchase→sheet→cancel/pending through the real
component): a local/test Supabase backend + signed-in payer session. This
host has NO container runtime (no local `supabase start`), the app has NO
synthetic-auth mode (verified by grep — signin is the only path), and
building one would weaken the production auth surface — out of bounds by
directive. First honest opportunity: Apple-sandbox QA on TestFlight builds
against a disposable Supabase project (checklist §6), or any dev machine
with Docker where `supabase start` + a seeded parent makes the real
/subscribe page loadable in-shell with zero app changes.

**Distinction ledger:** everything above is LOCAL evidence — local StoreKit
fixture, dev server, unauthenticated action refusals. None of it is Apple
sandbox, App Store server, or real-backend verification evidence.
