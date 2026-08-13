# iOS App Store release checklist — From Victory

**Owner:** Kinny (KC) · **Status:** checklist ready, enrollment not started · **Store presence:** not live

TestFlight-first. The Capacitor shell in `apps/native` is scaffolding only until
this checklist is done. The PWA on Vercel remains the primary product; App Store
is additive distribution of the same hosted app (`https://www.fromvictoryapp.com`).

Do **not** claim “on the App Store” in marketing until a listing is approved and
live (`docs/gtm/product-truths.md` stays silent until then).

Android Play is a separate, already-documented track:
[docs/android-play-release.md](./android-play-release.md). Do not duplicate it
here. This doc is iOS only.

Related Linear (this doc does not close them): [FV-212](https://linear.app/adeptiv/issue/FV-212)
(accounts / signing / release process), [FV-211](https://linear.app/adeptiv/issue/FV-211)
(privacy nutrition labels + age / Kids Category, kids-privacy-officer veto before
production), [FV-214](https://linear.app/adeptiv/issue/FV-214) (listing assets +
first public submission).

---

## Who does what

| Tag | Meaning |
|---|---|
| **Kinny · Console** | Only you, in [Apple Developer](https://developer.apple.com/account/) ($99/yr) and [App Store Connect](https://appstoreconnect.apple.com/). An agent cannot enroll, create the app, or fill privacy / age forms. 2FA on the owning Apple ID. |
| **Kinny · Mac** | A Mac with Xcode: Team, automatic signing, Archive, upload to TestFlight. Keep `.p12` / `AuthKey_*.p8` / `.mobileprovision` out of git and out of chat logs. |
| **Agent / follow-up PR** | Repo edits (`PrivacyInfo.xcprivacy`, committing `Podfile.lock`, any future CI). Do not mix those into a docs PR; several touch privacy-sensitive paths. |

Architecture, plugin allowlist, debug/Mac copy-paste, and privacy floor:
[docs/native-capacitor.md](./native-capacitor.md). Linux CI cannot archive an IPA.

---

## Locked facts (do not revisit in App Store Connect)

| Fact | Value |
|---|---|
| Bundle identifier | `com.fromvictory.app` — **permanent** once the App Store Connect app record exists. Same string Kinny locked for Android. Confirm it in Apple Developer Identifiers **before** creating the Connect app. Do not change it in a docs PR. |
| Display name | `From Victory` (`CFBundleDisplayName` in `apps/native/ios/App/App/Info.plist`) |
| Hosted WebView URL | `https://www.fromvictoryapp.com` (`capacitor.config.ts` `server.url`) |
| Native project | `apps/native` (`@from-victory/native`) |
| Current build / marketing version | `CURRENT_PROJECT_VERSION = 1` / `MARKETING_VERSION = 1.0` in `apps/native/ios/App/App.xcodeproj/project.pbxproj` |
| Billing in the IPA | **None.** Stripe on the web product. Do not add Apple IAP / StoreKit in this pass. KC has **not** decided otherwise. |
| Tracking / ads / crash SDKs | **None.** Do not add them to satisfy App Review. |
| Age floor | 13+. Minors 13–17 are parent-managed. **Not** Kids Category. |
| Encryption export flag | `ITSAppUsesNonExemptEncryption = false` already (HTTPS/TLS only). |
| Android / Play | Separate checklist: [docs/android-play-release.md](./android-play-release.md). |

If Apple enrollment (Organization / team) cannot register that exact bundle id
and instead forces a different string (rare; a Team ID shown *next to* the id is
normal and is **not** a different bundle id), **stop**. Do not create the App
Store Connect record. Do not patch `appId` in this checklist PR. Confirm with KC
before any identifier change.

---

## Order of operations

```
1. Enroll Apple Developer Program ($99/yr)     Kinny · Console     ← you do not have this yet
2. Confirm bundle id is exactly com.fromvictory.app
3. Create the App Store Connect app record     AFTER step 2
4. Mac: Team + automatic signing, Archive, upload
5. Testers install via TestFlight (internal)
6. Listing + age rating + privacy nutrition labels
7. Follow-up PRs: PrivacyInfo.xcprivacy, Podfile.lock
8. Production submission                       only after 6–7, FV-211, and 3.1.1 / 4.2
```

Internal TestFlight first. Do not submit for App Review / Production on day one.

Steps 1 and 2 can happen the same day. Step 3 is blocked on both. Step 4 is
blocked on a Mac + a Team that can sign `com.fromvictory.app`.

---

## 1. Apple Developer enrollment — Kinny · Console

You do **not** have an Apple Developer Program membership yet. Start here:

**https://developer.apple.com/programs/enroll/** (~$99 USD / year, auto-renews).

### Apple ID that owns the membership

The Apple ID that pays and verifies **owns** the developer account. Transfer
later is possible (Account Holder transfer) but painful. Prefer:

- An Apple ID you will still control in five years (Workspace / domain mail such
  as the account already used for `privacy@fromvictoryapp.com` — not a throwaway
  iCloud).
- **2FA on that Apple ID before you pay.** Apple requires it.

### Individual vs Organization

Enrollment asks whether you are an **Individual** or an **Organization**.

| | Individual | Organization |
|---|---|---|
| Speed | Faster identity check (Apple ID + government id) | Business verification: legal entity, address, **D-U-N-S**. Days to weeks (D-U-N-S issuance alone can stall). |
| Listing “Seller” | Your personal legal name | The organization name (should match **From Victory LLC**, the entity on `/privacy`) |
| Fit | Fine for a private Internal TestFlight smoke | Better default for a product that serves minors 13–17 |

**Recommendation:** Organization under **From Victory LLC** (New Jersey limited
liability company — see the live privacy policy). If D-U-N-S / entity
verification will block you for weeks and you only need Internal testers,
Individual on the dedicated Apple ID is acceptable for a private track; plan to
align the seller name with the LLC before any **public** listing. A future
entity change (PBC conversion runbook) would mean re-doing Apple enrollment
under the new name — do not pre-solve that here.

Complete identity verification when Apple asks. Do not share the $99 receipt,
government-id uploads, or D-U-N-S docs into the repo.

- [ ] Developer Program enrolled and paid
- [ ] 2FA on the owning Apple ID
- [ ] You know whether this account is Individual or Organization / LLC
- [ ] If Organization: D-U-N-S requested / approved (expect delay)

---

## 2. Confirm the bundle id — Kinny · Console (before Connect)

Bundle ids are **permanent** on the App Store Connect app record. Confirm in
the repo, then in Apple Developer, **then** create the Connect app.

Repo sources of truth (already `com.fromvictory.app`):

- `apps/native/capacitor.config.ts` → `appId`
- `apps/native/ios/App/App.xcodeproj/project.pbxproj` → `PRODUCT_BUNDLE_IDENTIFIER`
- Android uses the same string (`applicationId`) — Kinny locked it for Play

Apple Developer → **Certificates, Identifiers & Profiles** → **Identifiers** →
register an **App ID** (explicit) with Bundle ID `com.fromvictory.app`.

Xcode automatic signing can register the App ID for you on first archive. That
is fine **only if** you have already verified the Xcode target’s bundle id is
exactly `com.fromvictory.app` (step 4). Prefer registering it in the portal so
you see the string before Connect.

**Permanent:** if the first App Store Connect app is created with the wrong
bundle id, you cannot rename it. You would create a new app. Do not create the
Connect record until this string is confirmed.

- [ ] Portal App ID (or Xcode target) is exactly `com.fromvictory.app`
- [ ] No surprise prefix became part of the bundle id itself
- [ ] You have **not** created the Connect app yet (next step)

---

## 3. Create the App Store Connect app — Kinny · Console

[App Store Connect](https://appstoreconnect.apple.com/) → **Apps** → **+** →
**New App**. Do this **after** §2.

| Field | What to enter |
|---|---|
| Platforms | **iOS** (do not add macOS / tvOS / visionOS in this pass) |
| Name | `From Victory` (the App Store name; 30 characters) |
| Primary language | English (U.S.) |
| Bundle ID | **`com.fromvictory.app`** — pick the Identifier from §2. This dropdown is the permanent bind. |
| SKU | Internal, not user-visible. Something stable such as `fromvictory`. Not marketing copy. |
| User access | Full Access is fine for a solo Account Holder |

You do **not** type a different reverse-DNS id on this screen. If `com.fromvictory.app`
is missing from the Bundle ID list, go back to §2. Do not invent a new one.

- [ ] App record created (listing not public; no build yet)

---

## 4. Signing — Kinny · Mac (never commit)

TestFlight / App Store builds must be signed with an **Apple Distribution**
certificate and an App Store provisioning profile. Debug-on-device uses an
**Apple Development** certificate.

### 4a. First TestFlight: Xcode automatic signing

On the Mac, after `npx cap open ios` (step 5):

1. Select the **App** target → **Signing & Capabilities**.
2. Check **Automatically manage signing**.
3. Set **Team** to the From Victory Apple Developer team from §1.
4. Confirm **Bundle Identifier** = `com.fromvictory.app`.

Xcode creates the Development cert, Distribution cert, and App Store profile in
the developer portal and installs them in the local Keychain. That is the
intended path for the first upload. You do **not** need to export a `.p12` for
this.

Do **not** add capabilities yet (Push Notifications, Associated Domains). Those
need product-strategist + kids-privacy-officer review. Plugin allowlist stays
core / app / splash-screen / status-bar.

### 4b. App Store Connect API keys (later — not this pass)

CI / fastlane (remainder of [FV-212](https://linear.app/adeptiv/issue/FV-212))
would use an App Store Connect **API key**: Issuer ID, Key ID, and an
`AuthKey_*.p8` file. **No such secrets exist in this repo.** Do not invent
GitHub Environment secret names in this checklist. When a CI PR is written, that
PR documents the secret layout.

If you create an API key now for yourself: download the `.p8` once, store it in
a password manager, and **never commit it**. Apple will not show the file again.

### 4c. What never enters git

`.gitignore` already excludes `*.p12`, `*.mobileprovision`, `*.cer`, and
`AuthKey*.p8`. Do not force-add them.

| Keep | If you lose it |
|---|---|
| Local Keychain certs + this Mac’s login | Revoke and let Xcode automatic signing recreate Development / Distribution certs. Painful if you had also exported a `.p12` for a second machine and lost both. |
| `AuthKey_*.p8` (only if you created one) | Revoke the key in App Store Connect Users and Access → Integrations and mint a new one. |
| Account Holder Apple ID + 2FA recovery | You cannot upload or manage the app. |

- [ ] Team selected; automatic signing on; bundle id confirmed in Xcode
- [ ] No `.p12` / `AuthKey_*.p8` in the working tree

---

## 5. Archive on a Mac and upload — Kinny · Mac

**macOS + Xcode required. Linux CI cannot archive.** This repo does not document
a Cursor cloud `mobile-ios-mac` (or any other) Mac pool; do not assume one
exists. Use your Mac.

Prerequisites: Node 20+, Xcode (current stable), CocoaPods (`brew install cocoapods`
or `gem install cocoapods`). Debug / simulator notes stay in
[docs/native-capacitor.md](./native-capacitor.md).

```bash
# from repo root
npm install
cd apps/native
npx cap sync ios
npx cap open ios
```

`npm run open:ios` is the same open command.

In Xcode:

1. Select the **Any iOS Device (arm64)** destination (not a simulator).
2. Signing & Capabilities — §4a.
3. **Product → Archive**.
4. Organizer → **Distribute App** → **App Store Connect** → **Upload**.
5. Wait for processing (email / Connect → TestFlight).

Do not export `CAPACITOR_SERVER_URL` for the store archive (production shell
must load `https://www.fromvictoryapp.com`).

`ios/App/Podfile.lock` is currently **gitignored**. Local `pod install` (via
`cap sync`) is enough for this first archive. Committing the lockfile for
reproducible CI is an **Agent / follow-up PR** (see §11). Do not add it in a
docs change.

- [ ] Archive succeeded
- [ ] Build appeared in App Store Connect → TestFlight (processing finished)
- [ ] Bundle id on that build is `com.fromvictory.app`

---

## 6. TestFlight first (internal testers) — Kinny · Console

App Store Connect → **TestFlight**.

**Internal testers** (App Store Connect Users, up to 100): no Beta App Review.
This is the first track.

1. Users and Access → add testers as App Store Connect users (Admin / Developer
   / App Manager / Marketing / Account Holder — not “Customer Support” only).
2. TestFlight → Internal Testing → add the group / enable the latest build.
3. Testers install the **TestFlight** app from the App Store, accept the invite,
   install From Victory.

External TestFlight (public link, up to 10,000) **does** go through Beta App
Review. Do not turn that on until §7–§10 and
[FV-211](https://linear.app/adeptiv/issue/FV-211) are done — Beta Review applies
the same 3.1.1 / 4.2 / privacy bars as Production.

The web app still updates via Vercel. Testers get content changes without a new
IPA. You only need a new archive when native config, plugins, icons, or
Info.plist change — see §11.

- [ ] First build on Internal TestFlight
- [ ] At least one tester installed via TestFlight
- [ ] Shell opens `https://www.fromvictoryapp.com` (sign-in, daily training,
      pregame audio). Parent deletion still reachable at `/dashboard/settings`;
      adult self-serve deletion at `/athlete/settings` (Apple 5.1.1(v) — confirm
      **inside the WebView** before any public or external-TestFlight track).

Do **not** submit this build for App Review / Production until §7–§10 are done,
[FV-211](https://linear.app/adeptiv/issue/FV-211) has a kids-privacy-officer
pass, and KC + counsel have a written 3.1.1 / 4.2 call.

---

## 7. Pre-submission blockers (document honestly — do not “solve” here)

These are product / legal calls. Internal TestFlight can proceed. **App Review
and External TestFlight cannot.**

### 7a. Apple 3.1.1 — IAP / Stripe external purchase — KC + counsel

Subscriptions today are **Stripe on the website**. The IPA has no StoreKit
products. Guideline 3.1.1 generally requires In-App Purchase for digital goods
consumed in the app. Options (pick one; this checklist does not implement any):

1. **US external-purchase-link entitlement** (StoreKit External Purchase Link /
   the current US program name in Apple’s docs at the time you enroll) — counsel
   confirms eligibility and disclosure UX.
2. **Add Apple IAP** — commission vs the $5/mo / $49/yr web price; new native
   plugin + privacy review; **out of this pass**.
3. **Ship Android-first and defer iOS review** — Play checklist is already
   executable; iOS stays Internal TestFlight / unpublished.

Until that call is written down, keep Internal TestFlight. Do not assume
Production is cleared. Do not add IAP “to look native.”

### 7b. Apple 4.2 — minimum functionality

A thin remote-URL WebView is a common rejection pattern (4.2: apps that are
just a website). Do **not** add native-only features to game the review. The
justification is the existing athlete product inside the shell: daily mental
skill + scripture training, sport-specific pregame audio (hockey, basketball,
golf, football, baseball, lacrosse, soccer), parent-managed minor accounts.
Be ready to say that in Review Notes ([FV-214](https://linear.app/adeptiv/issue/FV-214)).
Accept Android-first if counsel / KC would rather not spend a review cycle yet.

### 7c. Apple 5.1.1(v) — account deletion reachability

Both stores require in-app account deletion that is easy to find. Confirm
**inside the Capacitor WebView** (not only Safari):

- Parent: `/dashboard/settings`
- Adult 18+: `/athlete/settings`

If a signed-in tester cannot reach deletion without leaving the app, that is a
follow-up product PR — not copy-paste native chrome.

### 7d. Privacy nutrition labels + age (preview; fill in §9–§10)

No tracking, no ads. Match
[https://www.fromvictoryapp.com/privacy](https://www.fromvictoryapp.com/privacy).
Age 13+, **not** Kids Category. kids-privacy-officer veto on
[FV-211](https://linear.app/adeptiv/issue/FV-211) before any public track.

- [ ] 3.1.1 option chosen in writing (or iOS review explicitly deferred)
- [ ] 4.2 justification (or Android-first) chosen in writing
- [ ] Deletion reachable inside the WebView
- [ ] FV-211 still open until nutrition + age are reviewed

---

## 8. Store listing minimums — Kinny · Console

App Store Connect → the app → **App Store** tab → listing for the iOS version.

**Do not invent listing copy in this repo.** Store text follows
[docs/gtm/voice-and-guardrails.md](./gtm/voice-and-guardrails.md) and KC’s
approval gate. Canonical public tagline if you need a locked line: **Your
Identity Is Secure. Compete From Victory.** No testimonials, ratings, user
counts, or “on Google Play.” Live sports only (hockey, basketball, golf,
football, baseball, lacrosse, soccer — not swimming or other v2 books).

| Asset | App Store need | From Victory notes |
|---|---|---|
| App name | 30 characters | `From Victory` |
| Subtitle | 30 characters | KC writes; parent-buyer + athlete 13+; no invented proof |
| Description | 4000 characters | KC writes from GTM; faith + mental toughness, not a kids devotion app |
| Keywords | 100 characters, comma-separated | KC / GTM; do not invent here |
| Privacy policy URL | HTTPS, required | **https://www.fromvictoryapp.com/privacy** |
| Support URL | HTTPS, required | `https://www.fromvictoryapp.com` until a dedicated support page exists |
| Marketing URL | Optional | `https://www.fromvictoryapp.com` |
| Support email | App Store Connect account + listing contact | `privacy@fromvictoryapp.com` (the live inbox on `/privacy` and `/terms`). `hello@fromvictoryapp.com` is **not** live (FV-249). |
| Category | Primary (+ optional secondary) | **KC pick.** Likely Sports or Health & Fitness — **not** Kids. |
| App Store icon | 1024×1024 PNG, no alpha | Source: `apps/native/resources/icon.png` (from PWA `icon-512.png`). Regenerating iOS AppIcon: `apps/native/resources/README.md` |
| Screenshots | Required size classes for devices you support (typically 6.7-inch iPhone in Connect’s current form) | Dark-mode athlete surfaces. Capture on a real device from Internal TestFlight. Do not mock marketing scenes. |
| Review notes | Needed before App Review ([FV-214](https://linear.app/adeptiv/issue/FV-214)) | Credentials for a **paid parent + paired athlete** so Apple sees the real product, not the marketing site. Include the 4.2 justification and where deletion lives. |

Pricing: **Free** to install. Subscriptions are Stripe on the website. Do not
set a paid download price. Do not create IAP products in Connect in this pass.

- [ ] Name, subtitle, description (KC-approved)
- [ ] Icon + required iPhone screenshots
- [ ] Category chosen (not Kids)
- [ ] Privacy policy URL saved
- [ ] Support URL + `privacy@fromvictoryapp.com`
- [ ] Reviewer test account noted (before App Review / External TestFlight)

---

## 9. Privacy nutrition labels — Kinny · Console

App Store Connect → App Privacy. Declare what the **app experience** collects —
including the hosted Next.js app inside the WKWebView, not only native APIs.
Match [https://www.fromvictoryapp.com/privacy](https://www.fromvictoryapp.com/privacy).
Do not claim “no data collected.”

Source of truth for the native shell: [docs/native-capacitor.md](./native-capacitor.md)
Privacy posture. Plugin allowlist is core / app / splash-screen / status-bar
only. No Advertising Identifier. `ITSAppUsesNonExemptEncryption` is already
false.

### Declare (typical — confirm against the live privacy policy)

Collected because the WebView is the product:

- **Contact info:** name, email (parent and 18+ athlete)
- **Identifiers:** user IDs (username / account ids)
- **Sensitive / other:** date of birth (13+ gate + 13–17 protections) — pick the
  App Privacy type that matches `/privacy`, do not hide DOB
- **Usage data:** product interaction / training rhythm metadata (not a public
  score; not journal body)
- **Purchases:** purchase **history** (Stripe subscriptions). Card numbers are
  entered on Stripe Checkout, not stored by From Victory. There is **no**
  StoreKit IAP in `apps/native`.

### Do not declare as collected by this app

- Location, contacts, camera, microphone, photos
- Device ID / Advertising Identifier used for tracking
- Analytics, advertising, or crash-reporting SDK data (none shipped)
- Journal entry **content** (athlete-only; parent dashboard is metadata only;
  journal is dormant in production per FV-135 — do not describe it as an
  active feature)

### Tracking / ads toggles

| Toggle | Intent |
|---|---|
| Used for tracking (ATT) | **No.** Do not show an ATT prompt. No tracking SDKs. |
| Used for third-party advertising | **No** |
| Used for analytics | **No** native analytics SDK. Do not mark “tracking.” |
| Linked to the user’s identity | Account + birthdate + billing are linked; do not mark them “not linked” |
| Data sold | No |

**3.1.1 honesty belongs in Review Notes, not as a fake IAP product.** Until KC +
counsel pick an option in §7a, do not create Consumable / Auto-Renewable
products in Connect.

The `/privacy` page is already live. Source comments still flag attorney
sign-off ([FV-329](https://linear.app/adeptiv/issue/FV-329)) as a launch gate.
Do not “fix” legal copy in this native checklist. If counsel has not signed off,
treat **Production** as blocked even if Internal testers are live.

- [ ] App Privacy answers submitted and matching `/privacy`
- [ ] Tracking: no; ads: no
- [ ] You opened https://www.fromvictoryapp.com/privacy logged-out and it loads
- [ ] FV-211 privacy review before any public or External TestFlight track

---

## 10. Age rating — not Kids Category — Kinny · Console

App Store Connect → Age Rating questionnaire. Answer honestly (violence,
unrestricted web access, user-generated content, etc.). This is a training app
with scripture and competitive-sport language, not a game with cartoon violence.
Do not guess the badge in git — submit the questionnaire and keep the result.

Age rating intent (product, [FV-211](https://linear.app/adeptiv/issue/FV-211)):
**13+**. **Do not** enroll in **Kids Category** (that would imply under-13
machinery we do not have: parental gates, COPPA-style consent, restricted
entitlements).

Unrestricted web access: the shell is a WebView onto our allowlisted origin,
not an open browser. Do not claim “made for kids.”

- [ ] Age rating questionnaire submitted
- [ ] Not in Kids Category
- [ ] 13+ posture matches Play ([docs/android-play-release.md](./android-play-release.md) §7)

---

## 11. PrivacyInfo, Podfile.lock, version bumps — Agent / follow-up PR + Kinny · Mac

### `PrivacyInfo.xcprivacy`

Not in the repo today. Apple requires a privacy manifest for App Store
submission (and it will be needed before External TestFlight / App Review).
Internal TestFlight can proceed without it. Add the host-app manifest in a
**follow-up PR** (privacy path: it will live under `apps/native/ios/**`).
Declare required-reason APIs the Capacitor shell actually uses; do not copy a
generic template that claims APIs we do not call. Do not add tracking domains.

- [ ] Follow-up PR: `PrivacyInfo.xcprivacy` before App Review
- [ ] Do not add crash-reporting “to fill the manifest”

### `Podfile.lock`

`apps/native/.gitignore` currently ignores `ios/App/Podfile.lock`. First Mac
archive does not need it committed. Reproducible CocoaPods / any future CI
should commit it in a **follow-up PR** (listed in
[docs/native-capacitor.md](./native-capacitor.md) Follow-ups).

### Build number / marketing version

In `apps/native/ios/App/App.xcodeproj/project.pbxproj`:

- **`CURRENT_PROJECT_VERSION`** — integer build. Increment by **1** for every
  IPA you upload to Connect (1 → 2 → 3). Connect rejects a reuse.
- **`MARKETING_VERSION`** — user-visible (`1.0`, `1.0.1`, …).

Web deploys do **not** need a new IPA. Ship a new archive when you change:

- Native plugins, Info.plist, `allowNavigation`, icons/splash
- Bundle id / capabilities / encryption flag
- Privacy manifest / CocoaPods

- [ ] You know the next upload is build `2` (after this first `1`)

### CI

Remainder of [FV-212](https://linear.app/adeptiv/issue/FV-212). There is **no**
iOS archive job and **no** App Store Connect API key in GitHub today. Linux
runners cannot produce a signed IPA. Do not invent a secret layout here.

---

## 12. Explicitly out of scope

This checklist does **not** include:

- **Google Play** — already documented in
  [docs/android-play-release.md](./android-play-release.md)
- **Play Billing or Apple IAP implementation** — Stripe stays the web billing
  path until KC + counsel say otherwise
- **Push / APNs** — no `@capacitor/push-notifications`; Web Push remains MVP
- **`NativeCacheStrategy` / Filesystem audio cache**
- **Swimming or other v2 sport content**, listing claims for sports that are not
  live, or rewriting training copy
- **Growth** — ASO campaigns, ads, influencer seeding, “we’re on the App Store”
  GTM claims, user-count proof
- **Native-only features** or extra Capacitor plugins (analytics, Crashlytics,
  Associated Domains)
- **Kids Category**
- **Production (or External TestFlight) on day one**
- **Runtime changes in `apps/web`** — separate, privacy-reviewed PR
- **Native CI as a required status check** (remainder of FV-212), including any
  undocumented Mac cloud pool

---

## Quick reference — commands

```bash
# Mac only — Linux cannot archive
cd apps/native
npx cap sync ios
npx cap open ios
# Xcode: Team → Any iOS Device → Product → Archive → Distribute → App Store Connect
```

Developer: [https://developer.apple.com/account/](https://developer.apple.com/account/)
App Store Connect: [https://appstoreconnect.apple.com/](https://appstoreconnect.apple.com/)
Privacy policy: [https://www.fromvictoryapp.com/privacy](https://www.fromvictoryapp.com/privacy)
Architecture: [docs/native-capacitor.md](./native-capacitor.md)
Android (do not duplicate): [docs/android-play-release.md](./android-play-release.md)
