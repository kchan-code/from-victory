# Native Capacitor Shell — From Victory

**Status:** scaffolding only. Store presence is NOT live. The product remains a
PWA on Vercel; this package is an additive App Store / Play distribution shell.

**Android Play (human checklist):** Kinny-executable steps — enrollment, signing,
Internal testing, listing, Data safety — live in
[docs/android-play-release.md](./android-play-release.md). iOS / App Store remains
deferred.

**Tier:** KC-gated (product-scope + privacy path). Do not auto-merge PRs that
change native plugins, permissions, or WebView navigation policy.

---

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
| Android `applicationId` | `com.fromvictory.app` | **Locked (Kinny).** Same string in `assetlinks.json` / old TWA runbook. **Permanent once the first AAB is uploaded to Play.** |
| iOS bundle id | `com.fromvictory.app` | Same string in the scaffold. Confirm again before any App Store Connect record (Apple enrollment is deferred). |
| Display name | `From Victory` | Locked to brand. |

Play Console app creation: follow [docs/android-play-release.md](./android-play-release.md).
Do not create an App Store Connect app until Apple enrollment is a real next step.

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
  [docs/android-play-release.md](./android-play-release.md) §7–§9.
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
4. **Developer accounts:** Google Play Console enrollment is the next human
   step — [docs/android-play-release.md](./android-play-release.md) §1. Apple
   Developer Program remains deferred (Android-first).

---

## Local setup

### Prerequisites

- Node 20+ / npm 10+ (repo root)
- **Android:** JDK 17+, Android SDK (platform 35), Android Studio optional
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

### iOS — Mac follow-up (copy-paste)

This runner scaffolds `apps/native/ios/` but cannot archive. On a Mac:

```bash
# one-time
sudo gem install cocoapods   # or brew install cocoapods
cd /path/to/from-victory
npm install
cd apps/native
npx cap sync ios
npx cap open ios             # opens Xcode
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities**.
2. Set Team to the From Victory Apple Developer team.
3. Confirm Bundle Identifier = the KC-approved id (placeholder
   `com.fromvictory.app`).
4. Add capabilities only when product+privacy approve them (Associated Domains
   later; **do not** add Push Notifications yet).
5. Product → Archive → Distribute App → App Store Connect.

App Store Connect prerequisites (human):

- Enroll in Apple Developer Program
- Create the app record **after** bundle id confirmation
- Privacy nutrition labels = no tracking
- Age rating / kids category decisions with counsel
- Resolve 3.1.1 / 4.2 strategy above before first review submission

### Icons / splash

Source PNGs live in `apps/native/resources/` (copied from the PWA icons).
Default Capacitor launcher assets ship in `android/` / `ios/`; regenerate brand
assets on a Mac/dev machine with `@capacitor/assets` when preparing store
screenshots — not required for the scaffold to build.

---

## Follow-ups (not in this PR)

- Soften the MVP “no native iOS/Android” lines in `CLAUDE.md` / `AGENTS.md` to
  match this additive-shell constraint (deferred from the scaffold PR so the
  `privacy-verdict` gate is not blocked on a cloud-agent `cursor[bot]` comment —
  that gate only accepts OWNER/MEMBER/COLLABORATOR authors). README + this doc
  already state the rule: PWA primary; native shell only; no native-only features.
- iOS `PrivacyInfo.xcprivacy` host-app manifest before App Store submission
- ~~Play Families / Data Safety pre-flight before Play Console app creation~~
  → Kinny checklist: [docs/android-play-release.md](./android-play-release.md)
  §7–§9. Console fill + [FV-211](https://linear.app/adeptiv/issue/FV-211)
  kids-privacy-officer veto still required before a **public** track.
- Decide whether to commit `ios/App/Podfile.lock` for reproducible CocoaPods
- Extend `athlete-no-tracking` CI to scan `apps/native` manifests/deps
- Enable R8/ProGuard minify for release AABs before first **production** Play
  upload ([docs/android-play-release.md](./android-play-release.md) §11)
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
