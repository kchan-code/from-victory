# Google Play Data safety form: proposed answers (DRAFT for KC)

Summary line 1: Proposed Data safety answers that match the Privacy Policy once the 1g/1h and Google billing corrections in this folder are applied. Starting point is the set already live since 2026-11-13 (`docs/android-play-release.md` section 9, FV-722).
Summary line 2: Two changes are proposed now (a security purpose for the throttle records, and the contact form message). A second set applies only when a Play Billing build is uploaded.
Summary line 3: Anything not confirmed from code or the policy is marked UNVERIFIED. I did not open Play Console or Google's current form help, so category names are from the existing repo doc and memory of the form.

Status: draft. KC enters answers in Play Console; nothing here is submitted.

## OPEN CHOICES KC must decide

1. **How to declare the IP-derived throttle code.** Option A: add "Device or other IDs", collected, purpose "Fraud prevention, security, and compliance". Option B: do not add a data type; add the security purpose to Email address and User IDs only, and rely on the Privacy Policy for the IP-derived code. Which one Google expects is UNVERIFIED.
2. **Contact form message.** Option A: declare "Other user-generated content" (optional, App functionality). Option B: do not declare it, on the basis that it is a web contact form and not an app feature. The form is reachable inside the Android WebView, so Option B is the weaker reading.
3. **"Delete some data without deleting the account" (Data deletion section).** Option A: answer Yes and cite removing one athlete from a parent account. Option B: answer No and list only full account deletion.

## 1. What "the app" covers

The Android app is a WebView that loads `https://www.fromvictoryapp.com` (`apps/native/capacitor.config.ts`). The existing repo guidance is to declare what the hosted app collects, not only what the APK does. All answers below follow that.

## 2. Top-level answers

| Question | Answer | Basis |
|---|---|---|
| Does the app collect or share any required user data types? | Yes | Accounts, activity record, purchases |
| Is all collected data encrypted in transit? | Yes | `android:usesCleartextTraffic="false"` in the manifest; server URL is HTTPS; `allowNavigation` limited to our own domain |
| Do you provide a way for users to request that their data is deleted? | Yes | In-app delete for parents and adult athletes; public page `/delete-account` |
| Account deletion URL | `https://www.fromvictoryapp.com/delete-account` | Page is public and has no auth guard (file header comment) |
| Is any data shared with third parties? | No | Policy Section 7: service providers only. See note 6 |
| Is data sold | No | Policy Section 2 |
| Independent security review | No | None found in repo |

## 3. Data types collected

"Now" = the live build with no Play Billing. All are collected, not shared, not processed ephemerally.

| Play data type | Collected | Required or optional | Purposes | What it is in our system | Basis |
|---|---|---|---|---|---|
| Name | Yes | Required | App functionality, Account management | First name of parent, athlete, adult athlete. No last name | Policy 1b, 1c, 1d |
| Email address | Yes | Required | App functionality, Account management, Developer communications, **Fraud prevention, security, and compliance (new)** | Parent and adult athlete email. A minor athlete has no real email. Sign-in throttle code made from the email typed | Policy 1b, 1d, 1g as corrected |
| User IDs | Yes | Required | App functionality, Account management, **Fraud prevention, security, and compliance (new)** | Athlete username, internal account ids, throttle codes made from an account id | Policy 1c, 1g as corrected |
| Other info | Yes | Required | App functionality, Personalization, Account management | Birthdate (13+ check, minor protections), sport, optional position and focus area, optional game date | Policy 1c, 1d |
| Purchase history | Yes | Required | App functionality, Account management | Website: Stripe customer and subscription ids, plan, status, period end. See section 4 for Google | Policy 1e |
| App interactions | Yes | Required | App functionality, Analytics, Personalization | First-party activity record (app opened, session started or finished), monthly option totals | Policy 1i |
| Diagnostics | Yes | Required | App functionality | Automated error report: screen, app version and type, short error text. No account id. Emailed, not stored in the database | Policy 1j |
| Device or other IDs | **OPEN CHOICE 1** | Required | Fraud prevention, security, and compliance | Keyed one-way code made from the request IP address, stored per throttled action. Not a device id. Not anonymous | `rate-limit-store.ts`; Policy 1g as corrected |
| Other user-generated content | **OPEN CHOICE 2** | Optional | App functionality | Contact form name, email, and message, delivered by email, not stored in the database | `contact.ts`; Policy 1h |

Notes on the two changes:

- **Security purpose.** The current live declaration lists no "Fraud prevention, security, and compliance" purpose. The rate limiter is exactly that purpose, and it derives stored codes from email, account, and IP. This is the Data safety counterpart of the 1g correction.
- **IP address.** Play's form has no "IP address" data type that I know of. UNVERIFIED which type Google wants for a stored IP-derived code. The raw IP address is used only in the request and is not stored by our code. Whether the hosting provider logs it, and for how long, is UNVERIFIED.
- **Ephemeral.** Do not mark the throttle code as ephemeral. It is stored. For actions other than the contact form there is no verified scheduled deletion yet (FV-775).

## 4. Changes that apply only when a Play Billing build is uploaded

Do not make these while the live build has no Play Billing. Make them in the same step as the policy text and the flag.

| Item | Answer after activation | Basis |
|---|---|---|
| Purchase history | Still declared. Now also covers: Google Play purchase token (and a linked earlier token), plan and offer, status, renewal or expiration date, auto-renew flag, acknowledged flag, test-purchase flag, last-verified time, and an account-linking id we generate | `google_subscriptions` and `google_purchase_bindings` columns; #684 Privacy 1e |
| Payment info (card details) | Not declared | We never receive it. `docs/fv651-android-play-billing-decision-record.md` records as confirmed that payment data collected by Google Play itself need not be declared if the app never accesses it |
| Google order number | Covered under Purchase history. Read from Google only when a cancel at deletion fails, and placed in an owner alert email. Not stored in the database | `account.ts` step 1e |
| Is data shared? | Proposed: still No. UNVERIFIED | We pass an account-linking id to Google Play when a purchase starts. Whether Google treats that as "sharing" or as a user-initiated action with a platform is not confirmed |
| Data collected by Google's billing library and the Google components it brings | UNVERIFIED | `capacitor.config.ts` says a billing build carries a telemetry transport, Play services base, tasks and location, and firebase-encoders. What they collect, and what Google requires the developer to declare for them, was not checked. Check Google's own guidance for the Play Billing Library before submitting |
| Location | Proposed: not declared. UNVERIFIED | No location permission in the manifest (`INTERNET`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `WAKE_LOCK` only). A Play services location component is listed as a transitive dependency of the billing build; confirm the merged manifest adds no location permission |
| Content rating questionnaire | Digital purchases becomes Yes | Decision record section 7. Separate form, listed so it is not missed |

## 5. Data types to answer No

| Play data type | Answer | Basis |
|---|---|---|
| Location (approximate, precise) | No | No permission; policy 1c and 1d say no precise location. See section 4 for the billing-build caveat |
| Address, phone number | No | Policy 1b, 1c, 1d |
| Race, political or religious beliefs, sexual orientation | No | Not collected as a data field. UNVERIFIED how Google views a faith-based app whose users are not asked their beliefs; the app stores no belief field that I found |
| Health and fitness | No | Not a health service; no health fields. Policy and Terms say it is not a mental health service |
| Financial info other than purchase history | No | Card details go to Stripe or Google |
| Messages (email, SMS, in-app) | No | No messaging feature. Contact form handled under OPEN CHOICE 2 |
| Photos, videos, audio, files, calendar, contacts | No | No such permission or upload. Audio is played, not recorded |
| Web browsing history, search history, installed apps | No | Not collected |
| Crash logs | No, covered by Diagnostics | No crash SDK. The error report is a short text report |
| Advertising ID | No | Manifest comment: no analytics or ad SDK permissions; existing doc says not used |
| Device or other IDs (as a device identifier) | No, unless KC picks OPEN CHOICE 1 Option A | Existing doc: removed 2026-11-13 because nothing in the Android app collects one; web push endpoints are web only |

## 6. Sharing

Answer: no data shared.

- Policy Section 7 lists service providers only: database and auth, payment processor, Apple, hosting, email, browser push service. A service provider processing on our behalf is not "sharing" under Play's definition as described in the existing repo doc. I did not re-read Google's definition. UNVERIFIED.
- The marketing-channel label is recorded on the adult buyer's checkout record with the payment processor (Policy Section 7). That is on the website checkout, not in the Android app.
- Cookieless web analytics run on public marketing pages only and, per Policy Section 6, never in the mobile apps. I did not verify the gating in code. UNVERIFIED.

## 7. Deletion answers

| Question | Answer | Basis |
|---|---|---|
| Can users request deletion? | Yes | |
| How | In the app: parent Dashboard, "Delete account"; adult athlete Settings, "Delete account". Removing one athlete: parent Dashboard, "Remove". A minor athlete has no delete control; the parent deletes | `/delete-account`, `/help` |
| Without signing in | Email to the privacy address shown on `/delete-account` | `/delete-account` |
| Timing | Immediate for self-serve; within 30 days for a request by email | Policy Section 8 |
| What is kept | A content-free record that a deletion happened and when. Payment processor records it must keep by law. After activation: a Google cancel-failure alert email for up to [30 / 90] days (open choice in `google-billing-legal-corrections.md`) | Policy Section 8 |
| Not removed by account deletion | Throttle records, which carry no account id in the clear. Contact-form rows are deleted within about a day; other actions have no verified schedule (FV-775) | `privacy-throttle-wording.md` |
| Delete some data without deleting the account | **OPEN CHOICE 3** | |

Known gap to fix before relying on the deletion answer for Android: `/delete-account` has no Android or Google Play section. Text is proposed in `google-billing-legal-corrections.md` section 4.

## 8. UNVERIFIED list (collected)

- Current category names and questions in the live Play Console form.
- The right data type for a stored IP-derived code.
- Whether passing our account-linking id to Google Play counts as sharing.
- What Google's billing library and its components collect, and what must be declared for them.
- Whether the merged manifest of a billing build adds any permission.
- Hosting provider request-log retention (IP addresses).
- That web analytics never load inside the Android WebView.
- That the contact form is reachable in the released Android build (the `/help` page links to it and `/help` is linked from adult settings; not checked on a device).
- Target audience and Families policy answers. Not part of this draft.
