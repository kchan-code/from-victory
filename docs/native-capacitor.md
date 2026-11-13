# Native Capacitor Shell — From Victory

**Status:** scaffolding only. Store presence is NOT live. The product remains a
PWA on Vercel; this package is an additive App Store / Play distribution shell.

**Android Play (human checklist):** Kinny-executable steps — enrollment, signing,
Internal testing, listing, Data safety — live in
[docs/android-play-release.md](./android-play-release.md).

**iOS / App Store (human checklist):** TestFlight-first steps — enrollment,
signing, archive, nutrition labels — live in
[docs/ios-app-store-release.md](./ios-app-store-release.md). Checklist ready;
Apple Developer enrollment is **not** started. Not a live listing.

**Tier:** KC-gated (product-scope + privacy path). Do not auto-merge PRs that
change native plugins, permissions, or WebView navigation policy.

---

## External music with narration

The proposed app-local `FVNarration` bridge plays the existing guided narration
through native audio sessions so external music can continue. It accepts only
bounded temporary WAV bytes and playback commands, not provider accounts,
library permissions, file paths, or network URLs. iOS adds the audio background
mode; Android adds a non-exported foreground media-playback service and wake
lock for screen-off playback. Review and device-test requirements are recorded
in [external-music-narration.md](./external-music-narration.md). This feature is
not enabled by a hosted-web deployment alone; new native builds are required.

## Architecture choice

| Option | Fit for this codebase | Decision |
|---|---|---|
| **Capacitor WebView → hosted Next.js URL** (`server.url`) | Works with App Router SSR, auth middleware, server actions, Stripe, Supabase | **Chosen** |
| Capacitor + static `webDir` export | Next.js 14 App Router cannot static-export this app without dropping SSR/auth/Stripe surfaces | Rejected |
| Android TWA only (Bubblewrap) | Android-only; no iOS path; duplicates package id with Capacitor | **Demoted** — see `docs/android-twa-runbook.md` |
| Cordova / React Native rewrite | Cordova is legacy; RN rewrite is out of scope | Rejected |

**Why remote URL, not bundled assets**

`apps/web` is a server-rendered Next.js app on Vercel. Auth cookies, server
actions, Stripe Checkout, and cron-backed APIs all assume a real origin. Shipping
a static snapshot into the APK/IPA would require a separate architecture and would
drift from production immediately.

The Capacitor shell therefore loads `https://www.fromvictoryapp.com` (override
with `CAPACITOR_SERVER_URL` for staging). The local `apps/native/www/` folder is
only a cold-start / offline fallback page.

**Implication for audio packs:** `docs/audio-pack-design.md` assumed assets over
`capacitor://` (no service worker). Under the remote-URL model the WebView is on
a normal HTTPS origin, so the existing PWA Cache Storage + SW path may work
without a Filesystem rewrite. Re-validate empirically before implementing
`NativeCacheStrategy`.

**Coexistence with the PWA**

| Channel | Role |
|---|---|
| Browser / installed PWA | Primary mobile path today; unchanged Vercel deploy |
| Capacitor Android / iOS | Store distribution of the *same* web product |
| Native-only features / content | **Forbidden** in MVP — shell only |

---

## Package layout

```
apps/native/
├── capacitor.config.ts   # appId, server.url, allowNavigation, plugins
├── www/                  # offline fallback HTML (not the Next.js app)
├── resources/            # source icons/splash for later asset generation
├── android/              # committed Capacitor Android project
└── ios/                  # committed Capacitor iOS project (build on macOS)
```

Workspace name: `@from-victory/native`. Root `npm run build` / Vercel still
target `apps/web` only — native is never part of the required CI build path.

---

## IDs

| Field | Value in repo | Notes |
|---|---|---|
| Android `applicationId` | `com.fromvictoryapp.app` | **Locked by Play Console.** Same string in `assetlinks.json` / Capacitor `appId`. Immutable. |
| iOS bundle id | `com.fromvictoryapp.app` | Kept in sync with Capacitor `appId` so one `cap sync` does not fork platforms. Confirm in Apple Developer Identifiers **before** any App Store Connect record (permanent; enrollment not started). |
| Display name | `From Victory` | Locked to brand. |

Play Console app creation: follow [docs/android-play-release.md](./android-play-release.md).
App Store Connect app creation: follow [docs/ios-app-store-release.md](./ios-app-store-release.md)
after enrollment and bundle-id confirmation.

---

## Privacy posture (non-negotiable)

This product serves athletes 13–17. The native shell must not weaken the web
privacy floor:

- **No analytics, attribution, ads, crash-reporting, or session-replay SDKs** in
  the native project — ever for MVP, and not as a casual dependency bump later.
- **No `@capacitor/push-notifications`** (FCM device token = new persistent
  identifier). Web Push remains the MVP notification path.
- **Plugin allowlist today:** `@capacitor/core`, `@capacitor/cli`,
  `@capacitor/android`, `@capacitor/ios`, `@capacitor/app`,
  `@capacitor/splash-screen`, `@capacitor/status-bar`. Any addition needs
  product-strategist + kids-privacy-officer review.
- **WebView navigation** is allowlisted to `fromvictoryapp.com` /
  `www.fromvictoryapp.com`. Other top-level URLs open in the system browser.
- **Android:** `INTERNET` only; `allowBackup=false`; no camera/mic/location.
- **iOS:** no file sharing; non-exempt encryption flag false (HTTPS only).
  Exclude future on-device audio caches from iCloud backup when/if Filesystem
  caching lands.
- App Store privacy nutrition labels and Play Data safety must declare
  **no tracking** and match reality.
- Play “target audience” includes 13–17 (Families-adjacent obligations). Console
  answers and Designed-for-Families **non**-enrollment:
  [docs/android-play-release.md](./android-play-release.md) §7–§9. App Store
  nutrition labels + 13+ / not Kids Category:
  [docs/ios-app-store-release.md](./ios-app-store-release.md) §9–§10.
- Do **not** claim “on the App Store / Google Play” in marketing until a listing
  is approved and live (`docs/gtm/product-truths.md` stays silent until then).

---

## Pre-submission blockers (KC decisions — not solved in code)

1. **Apple 3.1.1 (IAP / external purchase).** Subscriptions today are Stripe.
   Options: US external-purchase-link entitlement, add Apple IAP (commission vs
   $5/mo), or **Android-first / defer iOS**. Pick before iOS review.
2. **Apple 4.2 (minimum functionality).** A thin remote-URL WebView is a common
   rejection pattern. Be ready to justify athlete-specific value (or accept
   Android-first).
3. **Account deletion reachability** (Apple 5.1.1(v) + Play). Parent-controlled
   deletion exists in the product model — confirm the path is reachable from
   inside the shell before submission.
4. **Developer accounts:** Google Play Console — [docs/android-play-release.md](./android-play-release.md)
   §1. Apple Developer Program — [docs/ios-app-store-release.md](./ios-app-store-release.md)
   §1. Play is executable today; iOS enrollment is **not started** (checklist
   ready). Android-first remains a valid 3.1.1 option.

---

## Local setup

### Prerequisites

- Node 20+ / npm 10+ (repo root)
- **Android:** JDK 21 (capacitor.build.gradle pins JavaVersion.VERSION_21; JDK 17 fails the build), Android SDK (platform 35), Android Studio optional
- **iOS:** macOS + Xcode + CocoaPods (not available on Linux CI runners)

```bash
# from repo root
npm install
cd apps/native
npx cap sync
```

Point at staging/dev instead of production:

```bash
export CAPACITOR_SERVER_URL=https://your-preview.vercel.app
npx cap sync
```

### Android — debug build

```bash
cd apps/native
npx cap sync android
# requires ANDROID_HOME / local.properties sdk.dir
npm run build:android:debug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Open in Android Studio:

```bash
npm run open:android
```

### Android — Play-ready release bundle (human + keystore)

Execute the ordered checklist in
[docs/android-play-release.md](./android-play-release.md) (keystore,
`keystore.properties`, `npm run build:android:bundle`, Internal testing).
Keytool commands remain in [docs/android-twa-runbook.md](./android-twa-runbook.md)
Steps 2–3. Digital Asset Links fingerprints are **not** a Capacitor WebView
blocker; real SHA-256 values are a follow-up `apps/web` PR after Play App Signing.

### Requiring an app update (FV-717)

Every installed app loads the live site, so a change on `main` reaches every
store user at once, on whatever build they have. The server can now refuse
builds that are too old.

**How a build reports its number.** Each shell adds a `FVBuild/<n>` token to
its User-Agent, after its other tokens. The frozen `FVNativeShell/1` token is
unchanged.

| Platform | Number | Where it is added |
|---|---|---|
| Android | `versionCode` | Gradle task `stampNativeBuildMarker` (`android/app/build.gradle`) rewrites the generated `capacitor.config.json` before assets are merged. Nothing to run by hand. |
| iOS | `CFBundleVersion` (the Xcode build number) | `FVBridgeViewController.webViewConfiguration(for:)` at runtime. |

**First builds that report a number:** any build made from a commit that
includes FV-717. The builds live in the stores when it merged do not: Android
`versionCode` 10 (1.0.1) and iOS build 7 (1.0.1). Record the first reporting
build numbers here when they ship:

- Android: _(fill in)_
- iOS: _(fill in)_

**Turning the gate on.** Set `NATIVE_MIN_BUILD_ANDROID` and/or
`NATIVE_MIN_BUILD_IOS` in Vercel (Production) to the lowest build still
allowed, then redeploy. An app below it is sent to `/update-required`, which
links to its store listing. Unset (the default) means no gate.

**Apps that report no number count as the oldest** (KC decision 2026-11-13).
Setting any minimum for a platform sends every pre-FV-717 app on that platform
to the update screen. So:

1. Ship a build that reports its number and wait until it is live in the store.
2. Check it: open the app, then look for `FVBuild/` in the request User-Agent
   (Vercel runtime logs).
3. Only then set that platform's minimum.

Setting a minimum before step 1 leaves those users on the update screen with
nothing to update to. To undo, clear the variable and redeploy.

**What is and is not gated.** Page navigations from a gated app are
redirected. API routes, auth callbacks and form/server-action posts are not,
so a request already in flight finishes; the next navigation is gated. This is
a routing hint from a client-supplied header, not a security boundary.

### iOS — Mac follow-up (copy-paste)

This runner scaffolds `apps/native/ios/` but cannot archive. **macOS + Xcode
required; Linux CI cannot archive.** Ordered TestFlight checklist (enrollment,
signing, Connect record, nutrition labels):
[docs/ios-app-store-release.md](./ios-app-store-release.md).

On a Mac:

```bash
# one-time
sudo gem install cocoapods   # or brew install cocoapods
cd /path/to/from-victory
npm install
cd apps/native
npx cap sync ios
npx cap open ios             # opens Xcode
```

In Xcode (detail in the iOS checklist §4–§5):

1. Select the **App** target → **Signing & Capabilities**.
2. Set Team to the From Victory Apple Developer team (after enrollment).
3. Confirm Bundle Identifier = Capacitor `appId` / Play-locked package
   (`com.fromvictoryapp.app`). No App Store record yet — keep iOS in sync
   so `cap sync` does not fork the two platforms.
4. Add capabilities only when product+privacy approve them (Associated Domains
   later; **do not** add Push Notifications yet).
5. Product → Archive → Distribute App → App Store Connect → TestFlight
   (internal testers first; not Production).

### Icons / splash

Source PNGs live in `apps/native/resources/` (copied from the PWA icons).
Brand-rendered launcher/splash assets ship in `android/` / `ios/` (see
`apps/native/resources/README.md` for what's derived from which brand SVG);
regenerate with `@capacitor/assets` on a Mac/dev machine when preparing store
screenshots — not required for the scaffold to build.

---

## Follow-ups (not in this PR)

- Soften the MVP “no native iOS/Android” lines in `CLAUDE.md` / `AGENTS.md` to
  match this additive-shell constraint (deferred from the scaffold PR so the
  `privacy-verdict` gate is not blocked on a cloud-agent `cursor[bot]` comment —
  that gate only accepts OWNER/MEMBER/COLLABORATOR authors). README + this doc
  already state the rule: PWA primary; native shell only; no native-only features.
- ~~iOS `PrivacyInfo.xcprivacy`~~ added in FV-721. Kinny still generates the
  privacy report from an archive and compares it to App Store Connect
  ([docs/ios-app-store-release.md](./ios-app-store-release.md) §11).
- ~~Play Families / Data Safety pre-flight before Play Console app creation~~
  → Kinny checklist: [docs/android-play-release.md](./android-play-release.md)
  §7–§9. Console fill + [FV-211](https://linear.app/adeptiv/issue/FV-211)
  kids-privacy-officer veto still required before a **public** track.
- `ios/App/Podfile.lock`: commit it when `pod install` has been run on a Mac
  (Linux cannot reproduce the lockfile here). Steps in
  [docs/ios-app-store-release.md](./ios-app-store-release.md) §11.
- ~~Extend `athlete-no-tracking` CI to scan `apps/native`~~ done in FV-728.
  Play Billing is the documented allow-list entry.
- R8 stays off until [FV-740](https://linear.app/adeptiv/issue/FV-740/enable-r8-for-the-android-release-build-after-keep-rules-and-a-device).
  `proguard-rules.pro` is still the Capacitor stub. Do not flip
  `minifyEnabled` in a store upload.
- Rename Capacitor sample unit/instrumented tests off `com.getcapacitor.myapp`
- Replace placeholder zeros in `apps/web/public/.well-known/assetlinks.json`
  with Play **app signing** SHA-256 (privacy-path PR; not a Capacitor
  Internal-testing blocker)

## What this PR does *not* do

- Store listing copy, screenshots, or marketing claims
- Apple / Google paid enrollment
- `NativeCacheStrategy` Filesystem implementation
- Runtime changes inside `apps/web`
- Adding native CI as a required status check
- Stripe / IAP integration
