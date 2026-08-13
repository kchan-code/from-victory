# Android Play Store release checklist — From Victory

**Owner:** Kinny (KC) · **Status:** ready to execute · **Store presence:** not live

Android-first. The Capacitor shell in `apps/native` is scaffolding only until this
checklist is done. The PWA on Vercel remains the primary product; Play is additive
distribution of the same hosted app (`https://www.fromvictoryapp.com`).

Do **not** claim “on Google Play” in marketing until a listing is approved and
live (`docs/gtm/product-truths.md` stays silent until then).

Related Linear (this doc does not close them): [FV-212](https://linear.app/adeptiv/issue/FV-212)
(accounts / signing / release process), [FV-211](https://linear.app/adeptiv/issue/FV-211)
(Data safety + Families posture, kids-privacy-officer veto before production),
[FV-214](https://linear.app/adeptiv/issue/FV-214) (listing assets + first public
submission).

---

## Who does what

| Tag | Meaning |
|---|---|
| **Kinny · Console** | Only you, in [Google Play Console](https://play.google.com/console/). An agent cannot enroll, create the app, or fill policy forms. |
| **Kinny · Local** | Your machine: keystore, passwords, first signed AAB. Keep secrets out of git and out of chat logs. |
| **Agent / follow-up PR** | Repo edits (versionCode, R8, `assetlinks.json`). Do not mix those into a docs PR; several touch privacy-sensitive paths. |

Architecture, plugin allowlist, debug builds, and privacy floor:
[docs/native-capacitor.md](./native-capacitor.md). Keystore `keytool` example
(historical TWA path; the commands still apply):
[docs/android-twa-runbook.md](./android-twa-runbook.md) Steps 2–3. Do not revive
Bubblewrap / TWA — Capacitor is the Android track.

---

## Locked facts (do not revisit in the Console)

| Fact | Value |
|---|---|
| Application id / package name | `com.fromvictory.app` — **permanent** once the first AAB is uploaded. Kinny locked this. |
| Display name | `From Victory` |
| Hosted WebView URL | `https://www.fromvictoryapp.com` (`capacitor.config.ts` `server.url`) |
| Native project | `apps/native` (`@from-victory/native`) |
| Current `versionCode` / `versionName` | `1` / `1.0.0` in `apps/native/android/app/build.gradle` |
| Billing in the APK | **None.** Stripe on the web product. Do not add Play Billing / IAP in this pass. |
| Tracking / ads / crash SDKs | **None.** Do not add them to satisfy Play. |
| Age floor | 13+. Minors 13–17 are parent-managed. Not a kids app. |
| iOS / App Store | Deferred (Apple Developer enrollment not started). |

---

## Order of operations

```
1. Enroll Play Console                         Kinny · Console     ← you do not have this yet
2. Create + back up the upload keystore        Kinny · Local
3. Wire keystore.properties + build a signed AAB
4. Create the Play app + upload to Internal testing
5. Testers install via the opt-in link
6. Store listing + IARC + target audience + Data safety
7. Follow-up PRs: R8, real assetlinks fingerprints
8. Closed/open testing, then production        only after 6–7 and FV-211
```

Internal testing first. Do not promote to Production on day one.

Steps 1 and 2 can happen the same day. Step 4 is blocked on both.

---

## 1. Play Console enrollment — Kinny · Console

You do **not** have a Play Console account yet. Start here:

**https://play.google.com/console/** (~$25 USD, one-time).

### Google account that owns the publisher

The Google account that pays and verifies **owns** the developer account. Transfer
later is possible but painful. Prefer:

- A Google account you will still control in five years (Workspace under the
  business, or a dedicated account such as the one already used for
  `privacy@fromvictoryapp.com` / domain mail — not a throwaway personal Gmail).
- 2FA on that account before you pay.

### Individual vs organization

Play asks you to register as a **personal** developer or an **organization**.

| | Individual | Organization |
|---|---|---|
| Speed | Faster identity check | Business verification (legal name, address, D-U-N-S / docs). Days to weeks. |
| Listing “Offered by” | Your personal name unless Play later lets you set a developer name | The organization name (should match **From Victory LLC**, the entity on `/privacy`) |
| Fit | Fine for a private Internal-testing smoke | Better default for a product that serves minors 13–17 |

**Recommendation:** Organization under **From Victory LLC** (New Jersey limited
liability company — see the live privacy policy). If verification will block you
for weeks and you only need Internal testers, Individual on the dedicated
account is acceptable for a private track; plan to align the publisher name
with the LLC before any public listing.

Complete identity verification when Play asks. Do not share the $25 receipt or
government-id uploads into the repo.

- [ ] Developer account created and verified
- [ ] 2FA on the owning Google account
- [ ] You know whether this account is Individual or Organization / LLC

---

## 2. Create the Play app — Kinny · Console

Play Console → **Create app**.

| Field | What to enter |
|---|---|
| App name | `From Victory` |
| Default language | English (United States) |
| App or game | **App** |
| Free or paid | **Free** — users do not pay Google to *install*. Subscriptions are Stripe on the website. **Paid** would mean a download price; that is the wrong model. |
| Declarations | Accept Play policies / US export. Ads: **No**. This is not a news or government app. |

You do **not** type `com.fromvictory.app` on this screen. Play binds the
application id from the **first AAB you upload**. That id is already set in:

- `apps/native/capacitor.config.ts` → `appId`
- `apps/native/android/app/build.gradle` → `applicationId` / `namespace`
- `apps/native/android/app/src/main/res/values/strings.xml` → `package_name`

Scaffold comments in `capacitor.config.ts` / `build.gradle` may still say
“PLACEHOLDER”; the string is locked. Do not change it.

**Permanent:** if that first AAB is the wrong id, you cannot rename it. You
would create a new Play app. Do not upload an AAB until you have confirmed the
bundle’s application id is `com.fromvictory.app` (step 4).

- [ ] App record created (listing not public; no AAB yet)

---

## 3. Signing — Kinny · Local (never commit)

Play requires a signed **Android App Bundle** (`.aab`). Google Play App Signing
is mandatory: you sign with an **upload key**; Google re-signs what users
install with a separate **app signing key**.

### 3a. Create the upload keystore (one-time)

Keep the `.jks` **outside the repo** (example path from the TWA runbook).
`.jks` / `keystore.properties` are gitignored; do not force-add them.

```bash
mkdir -p ~/fromvictory-android-keys
cd ~/fromvictory-android-keys

keytool -genkey -v \
  -keystore fromvictory-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias fromvictory \
  -dname "CN=From Victory, OU=App, O=From Victory LLC, L=Unknown, ST=Unknown, C=US"
```

You will set a **keystore password** and a **key password**. Put both in a
password manager (not a plaintext file in the repo, not Slack).

Full `keytool -list` fingerprint commands:
[docs/android-twa-runbook.md](./android-twa-runbook.md) Step 3.

### 3b. Backup / recovery

| Keep | If you lose it |
|---|---|
| `fromvictory-release.jks` + both passwords, offline encrypted copy | You cannot sign the next upload. Play Console can **reset the upload key** if Play App Signing is on (you prove identity and register a new upload cert). Slow, but recoverable. |
| Google-held **app signing key** | Google keeps this after first enrollment. Users’ installs are signed with it. You never hold this file if you let Play generate it — that is the point. |

Do **not** opt out of Play App Signing. Let Google generate and hold the app
signing key. Your local `.jks` is the **upload** key only.

- [ ] Keystore created outside the repo
- [ ] Passwords in a password manager
- [ ] Second backup of the `.jks` (encrypted) somewhere that is not this git clone

### 3c. Wire signing for Capacitor (already supported)

Copy the example file; point `storeFile` at the absolute path of the `.jks`:

```bash
# from apps/native/
cp keystore.properties.example android/keystore.properties
# edit android/keystore.properties — gitignored
```

`apps/native/android/app/build.gradle` already reads `android/keystore.properties`
and applies `signingConfigs.release` when that file exists. Without it,
`bundleRelease` is unsigned and Play will reject the AAB.

- [ ] `android/keystore.properties` filled in locally (not committed)

---

## 4. Build a signed AAB — Kinny · Local (agent can run the commands)

Prerequisites: Node 20+, JDK 17+, Android SDK platform 35, `ANDROID_HOME` /
`android/local.properties` `sdk.dir`. Debug APK steps stay in
[docs/native-capacitor.md](./native-capacitor.md).

```bash
# from repo root
npm install
cd apps/native
npx cap sync android
npm run build:android:bundle
```

That script is `cd android && ./gradlew bundleRelease`. Output:

```
apps/native/android/app/build/outputs/bundle/release/app-release.aab
```

Confirm the application id before the first upload (this is what Gradle
packages — Play will bind it permanently):

```bash
grep applicationId apps/native/android/app/build.gradle
# must print: applicationId "com.fromvictory.app"
```

Do not export `CAPACITOR_SERVER_URL` for the Play AAB (production shell must
load `https://www.fromvictoryapp.com`).

Android Studio alternative: `npm run open:android` → Build → Generate Signed
Bundle / APK → Android App Bundle → the same keystore.

R8/ProGuard: `minifyEnabled` is currently **`false`** in
`android/app/build.gradle`. Internal testing can use that AAB. Enable minify in
a **follow-up PR** before Production (see §11). Do not turn it on in an
unsigned experiment and then forget to re-sign.

- [ ] Signed `app-release.aab` exists locally
- [ ] Application id is `com.fromvictory.app`
- [ ] `.aab` is not committed (android gitignore already excludes `*.aab`)

---

## 5. Internal testing first — Kinny · Console

Play Console → **Test and release** → **Testing** → **Internal testing**.

1. Create a new release → upload `app-release.aab`.
2. First upload enrolls **Play App Signing**. Let Google generate the app
   signing key. After processing, open **Test and release** → **App integrity**
   / **Setup → App signing** and copy:
   - **App signing key certificate** SHA-256 (what devices install; this is
     what a future `assetlinks.json` must list)
   - **Upload key certificate** SHA-256 (your `.jks`; keep for your records)
3. Release notes can be plain (“Internal smoke — Capacitor shell”). Not
   marketing.
4. **Review** → start rollout to Internal testing.

Internal testing: up to 100 testers, **no Play review queue**. Testers:

1. **Testers** tab → email list (family / beta; Google accounts).
2. Share the **opt-in URL** Play shows. They open it on the Android device,
   accept, then install from Play.

The web app still updates via Vercel. Testers get content changes without a new
AAB. You only need a new bundle when native config, plugins, icons, or SDK
level change — see §11.

- [ ] First AAB on Internal testing
- [ ] App signing SHA-256 saved in the password manager (not the repo)
- [ ] At least one tester installed via the opt-in link
- [ ] Shell opens `https://www.fromvictoryapp.com` (sign-in, daily training,
      pregame audio). Parent deletion still reachable at `/dashboard/settings`;
      adult self-serve deletion at `/athlete/settings` (Play account-deletion
      rule — confirm inside the WebView before any public track).

Do **not** promote this release to Closed testing, Open testing, or Production
until §6–§10 are done and [FV-211](https://linear.app/adeptiv/issue/FV-211) has
a kids-privacy-officer pass.

---

## 6. Store listing minimums — Kinny · Console

**Grow users → Store presence → Main store listing** (labels move; look for
Main store listing).

**Do not invent listing copy in this repo.** Store text follows
[docs/gtm/voice-and-guardrails.md](./gtm/voice-and-guardrails.md) and KC’s
approval gate. Canonical public tagline if you need a locked line: **Your
Identity Is Secure. Compete From Victory.** No testimonials, ratings, user
counts, or “on the App Store.” Live sports only (hockey, basketball, golf,
football, baseball, lacrosse — not soccer or other v2 books).

| Asset | Play requirement | From Victory notes |
|---|---|---|
| App name | 30 characters | `From Victory` |
| Short description | 80 characters | KC writes; parent-buyer + athlete 13+; no invented proof |
| Full description | 4000 characters | KC writes from GTM; faith + mental toughness, not a kids devotion app |
| High-res icon | 512×512 PNG | Source: `apps/native/resources/icon.png` (from PWA `icon-512.png`). Regenerating mipmaps: `apps/native/resources/README.md` |
| Feature graphic | 1024×500 PNG/JPEG, **no alpha** | Not in the repo yet. Design from the brand system (`docs/brand.md` / design kit). Required for the Play listing. |
| Phone screenshots | ≥2 (up to 8). JPEG or 24-bit PNG, no alpha. Side 320–3840px; ratio between 16:9 and 9:16 | Dark-mode athlete surfaces. Capture on a real device from Internal testing. Tablet screenshots optional. |
| App category | One primary | **KC pick.** Likely Sports or Health & Fitness — not a “Kids” category. |
| Contact email | Required | `privacy@fromvictoryapp.com` or the support inbox you actually read |
| Privacy policy | HTTPS URL | **https://www.fromvictoryapp.com/privacy** (see §8) |
| Marketing site | Optional | `https://www.fromvictoryapp.com` |

Reviewer access (needed before any public track, [FV-214](https://linear.app/adeptiv/issue/FV-214)):
notes plus credentials for a **paid parent + paired athlete** so Play can see
the real product, not the marketing site.

- [ ] Title, short, full description (KC-approved)
- [ ] Icon + feature graphic + ≥2 phone screenshots
- [ ] Category chosen
- [ ] Privacy policy URL saved on the listing
- [ ] Reviewer test account noted (before Closed/Open/Production)

---

## 7. Content rating (IARC) + target audience — Kinny · Console

### IARC questionnaire

**Policy → App content → Content ratings.** Complete the IARC form honestly
(violence, language, user interaction, etc.). This is a training app with
scripture and competitive-sport language, not a game with cartoon violence.
Do not guess the badge in git — submit the questionnaire and keep the result.

Age rating intent (product, [FV-211](https://linear.app/adeptiv/issue/FV-211)):
**13+**. Not a “Kids” category (that would imply under-13 machinery we do not
have).

- [ ] IARC questionnaire submitted
- [ ] Rating certificate applied to the app

### Target audience and Designed for Families

**Policy → App content → Target audience and content.**

| Question | Answer to aim for |
|---|---|
| Target age groups | Select **13–15**, **16–17**, and **18 and over**. Eligibility is 13+ with no upper limit. |
| Under 13 (5 and under / 6–8 / 9–12) | **Do not select.** COPPA-style kids-app rules are the wrong box. |
| Primarily designed for children? | **No.** Teens and adults; parent is the buyer for 13–17. |
| Designed for Families program | **Do not enroll.** That program is for child-directed / under-13 apps. We are 13+ (teens), not a kids app. |

Selecting 13–15 can surface extra Families-policy questions (ads, UGC, social).
Honest answers given this product:

- No ads, no ad SDKs, no mediation
- No public social feed, no athlete-to-athlete comparison, no leaderboards
- Accounts for 13–17 are parent-created; journal content is not shown to parents
- Crisis-resource copy exists in-app; we are not a mental-health service

This is the posture [FV-211](https://linear.app/adeptiv/issue/FV-211) asked
kids-privacy-officer to confirm before production. Filling the Console form is
still **Kinny · Console**; the veto is before a public track, not before
Internal testing.

- [ ] Target ages 13–15 / 16–17 / 18+ only
- [ ] Not enrolled in Designed for Families
- [ ] Ads declaration: no ads

---

## 8. Privacy policy URL

Live page (canonical `/privacy` on the production site):

**https://www.fromvictoryapp.com/privacy**

Contact on that page: `privacy@fromvictoryapp.com`.

Paste that URL into Play → **App content → Privacy policy** and into the store
listing. Play fetches it; it must stay publicly reachable over HTTPS (no auth).

The page is already on the site. Source comments still flag attorney sign-off
([FV-329](https://linear.app/adeptiv/issue/FV-329)) as a launch gate. Do not
“fix” legal copy in this native checklist. If counsel has not signed off, treat
**Production** as blocked even if Internal testers are live.

- [ ] Privacy policy URL saved in Play Console
- [ ] You opened the URL in a logged-out browser and it loads

---

## 9. Data safety form — Kinny · Console

**Policy → App content → Data safety.** Declare what the **app experience**
collects — including the hosted Next.js app inside the WebView, not only Java
APIs in the APK. Match [https://www.fromvictoryapp.com/privacy](https://www.fromvictoryapp.com/privacy).
Do not claim “no data collected.”

Source of truth for the native shell: [docs/native-capacitor.md](./native-capacitor.md)
Privacy posture. Plugin allowlist is core / app / splash-screen / status-bar
only. `INTERNET` only. `allowBackup=false`. No Advertising ID.

### Declare (typical — confirm against the live privacy policy)

Collected because the WebView is the product:

- **Personal info:** name, email (parent and 18+ athlete), user IDs
  (username / account ids), date of birth (13+ gate + 13–17 protections)
- **App activity:** in-app interactions / training rhythm metadata (not a
  public score; not journal body)
- **Financial:** purchase **history** (Stripe subscriptions). Card numbers are
  entered on Stripe Checkout, not stored by From Victory. There is **no** Google
  Play Billing SDK in `apps/native`.

### Do not declare as collected by this app

- Location, contacts, camera, microphone, photos, SMS
- Advertising ID / AAID
- Analytics, advertising, or crash-reporting SDK data (none shipped)
- Journal entry **content** (athlete-only; parent dashboard is metadata only;
  journal is dormant in production per FV-135 — do not describe it as an
  active feature)

### Other Data safety toggles

| Toggle | Intent |
|---|---|
| Encrypted in transit | Yes (HTTPS) |
| Users can request deletion | Yes — parent `/dashboard/settings`; adult `/athlete/settings` |
| Data sold | No |
| Used for advertising / tracking | No |
| Required for app functionality vs optional | Account + birthdate + billing are required to run the product; do not mark them “optional” |

**Play Billing / payments honesty:** the APK does not implement in-app products.
Parents and 18+ athletes subscribe with **Stripe on the website**. Do not add a
Play Billing SKU “to look native.” Whether Stripe Checkout may appear **inside**
the WebView vs only in the system browser is a **KC + counsel** call (Play
payments policy for digital goods). This checklist does not invent IAP work.
Until that call is written down, keep Internal testing; do not assume Production
is cleared.

- [ ] Data safety form submitted and matching `/privacy`
- [ ] Advertising ID: not used
- [ ] No Play Billing products created
- [ ] FV-211 privacy review before any public track

---

## 10. Digital Asset Links (`assetlinks.json`)

**Not a Capacitor launch blocker.** The shell loads the hosted URL in a WebView.
That is not a TWA. Chrome will not refuse the app if
`/.well-known/assetlinks.json` still has placeholder fingerprints.

The file today (`apps/web/public/.well-known/assetlinks.json`) already names
`com.fromvictory.app` but lists a **placeholder SHA-256 of zeros**. The TWA
runbook still describes how to format the JSON
([docs/android-twa-runbook.md](./android-twa-runbook.md) Step 4).

You **do** need a real fingerprint when you want verified Android App Links
(https links opening the app). Current `AndroidManifest.xml` has a LAUNCHER
filter only — no `https` App Links intent-filter yet.

When you wire it (follow-up PR, **privacy path** because it is `apps/web/**`):

1. Use the **app signing** SHA-256 from Play Console (§5), not only the upload
   key. After Play App Signing, devices see Google’s cert.
2. Include both upload and app-signing fingerprints if you want local sideloads
   and Play installs to verify.
3. Deploy to production so
   `https://www.fromvictoryapp.com/.well-known/assetlinks.json` (and the apex
   `https://fromvictoryapp.com/.well-known/assetlinks.json` if you serve it)
   returns the real certs **before** you rely on verification.
4. Check with Google’s statement list API (TWA runbook Step 11).

- [ ] Internal testing does **not** wait on this
- [ ] Follow-up issue/PR noted for real fingerprints + any App Links filters

---

## 11. R8 / ProGuard and version bumps — Agent / follow-up PR + Kinny · Local

### R8

`minifyEnabled false` in `apps/native/android/app/build.gradle` today.
[docs/native-capacitor.md](./native-capacitor.md) follow-ups: enable minify for
release AABs before the first **production** upload. Capacitor WebView apps need
keep rules for the bridge (`proguard-rules.pro` is still the default stub).

- [ ] Follow-up PR: `minifyEnabled true` + tested `bundleRelease` + Internal
      re-upload before Production
- [ ] Do not add crash-reporting “to debug R8”

### versionCode / versionName

In `apps/native/android/app/build.gradle` `defaultConfig`:

- **`versionCode`** — integer. Increment by **1** for every AAB you upload to
  Play (1 → 2 → 3). Play rejects a reuse.
- **`versionName`** — user-visible (`1.0.0`, `1.0.1`, …).

Web deploys do **not** need a new AAB. Ship a new bundle when you change:

- Native plugins, permissions, `allowNavigation`, icons/splash
- `applicationId` / SDK levels (`compileSdk` / `targetSdk` — Play requires
  annual target-API bumps)
- Signing config
- R8 / packaging options

- [ ] You know the next upload is `versionCode 2` (after this first `1`)

---

## 12. Explicitly out of scope

This checklist does **not** include:

- **iOS / App Store** — Apple Developer enrollment, TestFlight, IAP 3.1.1, 4.2
  minimum-functionality, `PrivacyInfo.xcprivacy`
- **Google Play Billing / IAP implementation** — Stripe stays the web billing
  path until KC + counsel say otherwise
- **Soccer or other v2 sport content**, listing claims for sports that are not
  live, or rewriting lacrosse/hockey (or any) training copy
- **Growth** — ASO campaigns, ads, influencer seeding, “we’re on Play” GTM
  claims, user-count proof
- **Native-only features** or extra Capacitor plugins (push/FCM, analytics,
  Crashlytics)
- **Designed for Families** enrollment or Kids category
- **TWA / Bubblewrap** as a second package id
- **Production (or Open testing) on day one**
- **Runtime changes in `apps/web`** (including real `assetlinks.json`
  fingerprints) — separate, privacy-reviewed PR
- Native CI as a required status check (remainder of FV-212)

---

## Quick reference — commands

```bash
# debug APK (not for Play)
cd apps/native
npx cap sync android
npm run build:android:debug
# android/app/build/outputs/apk/debug/app-debug.apk

# Play AAB (needs android/keystore.properties)
npm run build:android:bundle
# android/app/build/outputs/bundle/release/app-release.aab
```

Console: [https://play.google.com/console/](https://play.google.com/console/)
Privacy policy: [https://www.fromvictoryapp.com/privacy](https://www.fromvictoryapp.com/privacy)
Architecture: [docs/native-capacitor.md](./native-capacitor.md)
