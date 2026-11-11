# FV-651: Android Google Play Billing (v1.1) decision record

**Status:** DRAFT v3 for KC (product-strategist and kids-privacy-officer
reviews applied, Section 14; **G0 decided by KC on 2026-11-11**; G2 direction
given but figures unresolved, Sections 5 and 13).
Discovery only. Nothing in this record authorizes
a build, a native sync, a Play Console change, a Google Cloud change, an
agreement, a production mutation, or a release.

**Mode:** discovery (CLAUDE.md "Two modes"). The deliverable is this record
plus scoped child issues under FV-620. No code ships from FV-651.

**Decision this record serves:** KC recorded GO on FV-620 on 2026-11-11:
publish the approved consumption-only Android build now, then add Google Play
Billing as the next Android version ("v1.1"). This record does not re-argue
that decision. Section 12 lists what would count as material new evidence.

**Supersedes, when implemented:** the consumption-only ("Path A", reader-style)
posture for **new Android builds only**. Every Android build already in the
field keeps today's consumption-only behavior, by construction (Section 6).
`docs/android-play-release.md` still says "do not add Play Billing". That
describes the 1.0.x release and stays true for it.

**Separate from the approved release:** FV-619 / build 10 (1.0.1) is not
blocked by, and not modified by, anything here.

Inspected: `origin/main` @ 6790398 (2026-11-11). Store facts were read from
Google's own pages on 2026-11-11; each is marked confirmed or not.

---

## 1. The model

- **Android app (new builds):** Google Play auto-renewing subscriptions bought
  and managed inside the app. Google is the merchant of record for those.
- **iOS app:** Apple subscriptions, unchanged (FV-210 record).
- **Web:** Stripe checkout and billing portal, unchanged.
- **One account, one entitlement:** a family that pays through any provider
  has access on every platform. The app shows the existing subscription and
  never offers a second purchase to a payer who is already entitled.
- **No third-party purchase SDK.** Google's own Play Billing Library on the
  device and Google's own APIs on the server. RevenueCat stays rejected
  (FV-210 record, Section 3).
- **No link-out or alternative billing on Android** in this design. Section 9
  compares the two routes honestly.

## 2. Customer friction this removes

Today, for a family that finds From Victory in Google Play:

| Step | Today (1.0.x, consumption-only) | With Play Billing |
|---|---|---|
| Install | Works | Works |
| Create an account | Not possible in the app. The sign-in screen shows plain-text guidance to sign up on the website, with no link (FV-621). | In the app |
| See a price | Hidden in the app | Shown, from Google Play's own price data |
| Pay | Not possible in the app. Must find the website on their own. | Google Play purchase sheet |
| Add an athlete | Blocked in the app (FV-622) | In the app, with a tier upgrade when needed |
| Manage or cancel | On the website | Google Play subscription settings, linked from the app |

A new Android family currently has to leave the app, find the site, sign up
and pay there, then come back and sign in. Android earns nothing directly.

## 3. Current system truth (what exists to build on)

All paths are under `apps/web` unless noted.

**Access resolver.** `getParentAccessLevel` (`lib/subscriptions/access.ts:107-154`)
checks comp grants first, then maps the Stripe row, then folds in Apple with
`bestOf`. Levels are `full | degraded | blocked` and it fails closed to
`blocked`. A third provider is one more accessor and one more fold, plus a
pure status-to-level function beside `apple-access-level.ts`.

**Apple data model** (migrations `20260911120000`, `20260918090000`,
`20260924120000`): `apple_subscriptions` (Apple-native status vocabulary,
`environment`, unique per payer and per original transaction, payer-own
SELECT policy, service-role writes), `apple_purchase_tokens` (one opaque UUID
per payer, service-role only), `apple_sandbox_testers` (allowlist, service-role
only). The migration states the Apple status vocabulary must not be reused
for another provider. `parent_athlete_links.seat_active` (FV-585) is generic.

**Payer binding on Apple.** The server mints an opaque per-payer UUID, the app
attaches it to the purchase, and the server accepts a transaction only when
the verified payload carries that same UUID. A transaction already owned by a
different payer is refused (`lib/actions/apple-subscription.ts:245-270`).

**Shared rules a new provider must join.**
- One trial per account across providers: `isTrialEligible` in
  `lib/actions/subscription.ts:302-335` (no Stripe row, never held an Apple
  entitlement, single seat; fails closed).
- Duplicate-purchase guard: `getSubscribeEntitlementState`
  (`lib/subscriptions/subscribe-guard.ts`), provider `apple | stripe | comp`.
- Athlete ceiling and seat selection: `assertAthleteCapacity`
  (`lib/subscriptions/apple-capacity.ts:176`), `seat-state.ts`,
  `lib/actions/seat-selection.ts`. Stripe families are never capped.
- Offline pregame window: `getParentOfflineEntitlementUntil`
  (`access.ts:268-301`) takes the latest end date across providers.
- Account deletion: `lib/actions/account.ts:214-265` cancels Stripe first;
  Apple cannot be cancelled server-side, so the delete flow warns (FV-652).

**Shell capability.** `lib/native-shell.ts` classifies the User-Agent:
`FVNativeShell/1 (ios)` is `ios-iap`; the bare `FVNativeShell/1` is
`legacy-native` (every Android build ever shipped, and old iOS builds);
anything else is the browser. `apps/native/capacitor.config.ts:54` sets the
bare token at top level and `:116` sets the iOS override.

**What `legacy-native` hides today** (the sites a new capability must
revisit): `dashboard/page.tsx:83,203,266`; `dashboard/athletes/new/page.tsx:41`
and `lib/actions/athletes.ts:102` (add-athlete block); `dashboard/settings/page.tsx:108,405`;
`subscribe/page.tsx:289,319`; `athlete/settings/page.tsx:57,313,327`;
`athlete/paused/page.tsx:78`; `signin/page.tsx:127` and
`components/auth/SignInForm.tsx` (signup hidden); `lib/actions/auth-adult.ts:181`.
Also `isNativeShell()` redirects in `auth.ts`, `account.ts`,
`billing-portal.ts`, and `middleware.ts`.

**iOS bridge shape.** `lib/native/apple-iap.ts` wraps
`window.Capacitor.Plugins.FVAppleIAPPlugin`: `getProducts`, `purchase`,
`restore`, `manageSubscriptions`. Wrappers never throw. The Swift plugin is
registered by hand in `FVBridgeViewController.swift`.

**Android shell.** Capacitor 8, `compileSdk`/`targetSdk` 36, `minSdk` 24,
`versionCode 10`, `versionName 1.0.1`. No Play Billing dependency. One custom
plugin exists and is registered in `MainActivity.java`
(`registerPlugin(FVNarrationPlugin.class)`), so the pattern for a second
custom plugin is already in the project.

**Size of the provider surface.** About 36 source files and about 37 test
files branch on provider or on Apple specifically. That is the surface a third
provider has to be threaded through and re-tested.

**Webhooks.** `middleware.ts` already excludes `api/webhooks` from the session
matcher, so a new webhook route needs no matcher change.

**Privacy policy.** `/privacy` names Stripe as the payment processor
(`app/privacy/page.tsx:202`). A search of that page finds no mention of Apple
or Google as a processor. Adding Google needs a policy update; whether Apple
is already covered elsewhere should be checked at the same time (Section 11).

## 4. Decision 1: client purchase layer

**Recommended: a custom Capacitor plugin on Google's Play Billing Library.**

- `FVPlayBillingPlugin.java` in `apps/native/android`, registered in
  `MainActivity.java` next to `FVNarrationPlugin`. Dependency:
  `com.android.billingclient:billing` (Google first-party).
- JS wrapper `lib/native/play-billing.ts`, same contract style as
  `apple-iap.ts`: never throws, reports `bridge_unavailable`.
- Methods mirror iOS so the purchase UI can share structure:
  - `getProducts({ productIds })` returns each base plan and offer with
    Google's formatted price and the offer token needed to buy it.
  - `purchase({ productId, basePlanId, offerId?, obfuscatedAccountId, replace? })`
    returns the purchase token.
  - `restore()` returns current purchases from Play.
  - `manageSubscriptions()` opens Play's subscription page
    (`https://play.google.com/store/account/subscriptions?sku=...&package=...`,
    confirmed).
- **Library version: start on v9.** Google's deprecation table (confirmed):
  v7 can no longer ship in updates; v8 must be replaced by 2027-08-31; v9 by
  2028-08-31. Starting on v9 gives the longest runway before a forced upgrade.
- Prices shown in the app come only from Play's product details. No hardcoded
  USD figure, same rule as iOS.

**Rejected: RevenueCat or any other third-party purchase SDK.** Same reasons
as the FV-210 record: a new SDK on signed-in surfaces contradicts the privacy
page's claim, adds a processor and a revenue share, and the iOS side already
proves the direct approach works.

**Not chosen: link-out to Stripe or alternative billing.** KC decided G0 for
Play Billing on 2026-11-11 with the corrected comparison in Section 9 in
front of him.

## 5. Decision 2: products, prices, trial

**Play's product model (confirmed).** A subscription contains base plans; a
base plan contains offers. Product IDs: start with a digit or lowercase
letter, then lowercase letters, digits, `_` and `.`, at most 40 characters,
and they cannot be changed. Base plan and offer IDs: lowercase letters,
digits and hyphens.

**Recommended scheme: five subscriptions, two base plans each.**

| Athletes | Subscription ID | Base plans | Offer |
|---|---|---|---|
| 1 | `family.1` | `monthly`, `yearly` | `trial-7d` on both base plans |
| 2 | `family.2` | `monthly`, `yearly` | none |
| 3 | `family.3` | `monthly`, `yearly` | none |
| 4 | `family.4` | `monthly`, `yearly` | none |
| 5 | `family.5` | `monthly`, `yearly` | none |

- Apple's IDs embed `.monthly` / `.yearly`. Play expresses the interval as a
  base plan, so the IDs cannot be copied as they are. The server keeps one
  provider-neutral key, (athlete capacity, interval), and maps each store's
  IDs to it.
- A typed catalog file like `apple-product-catalog.ts`, dormant behind its
  own activation flag, is the single place the IDs and ceilings live.
- IDs are permanent. KC confirms the scheme before anything is created in
  Play Console (decision G1).

**Prices.** KC's standing decision: store prices equal web prices.

*Apple's actual schedule, verified 2026-11-11 from Apple's public US App
Store listing (all ten in-app purchases shown) and matching the App Store
Connect configuration recorded on 2026-09-22
(`docs/testflight-beta-runbook-fv210.md`):*

| Athletes | Apple monthly | Apple yearly | Website monthly | Website yearly |
|---|---|---|---|---|
| 1 | $5.00 | $49.00 | $5 | $49 |
| 2 | $8.00 | $78.00 | $8 | $78 |
| 3 | $11.00 | $106.99 | $11 | $107 |
| 4 | $14.00 | $135.99 | $14 | $136 |
| 5 | $17.00 | $164.99 | $17 | $165 |

Apple already equals the website on seven of ten prices. The three larger
yearly tiers are one cent lower because Apple had no exact price point.

**Correction.** An earlier draft of this record said "Apple is at .99
points", and this session told KC the stores were at $4.99 / $49.99. Both
were wrong. They came from the *proposed* mapping in the FV-210 record
(Section 4.6), not from what was configured.

**G2 status: direction given, figures unresolved.** On 2026-11-11 KC directed
that Play use "Apple-style" prices, citing $4.99 / $49.99 for one athlete,
with the website to follow, and asked that Apple's actual schedule be
verified first. The verification shows Apple is at $5.00 / $49.00. Those two
instructions now point in different directions, so nothing is recorded as
decided until KC picks one:

- **Option A: Play matches Apple's actual schedule** (the table above). The
  website already matches, so there is no website or Stripe change at all.
  All three places a family can pay show the same price today.
- **Option B: move to $4.99 / $49.99.** Then Apple has to change too, along
  with the website and Stripe. Scope in Section 5.1.

Play lets a developer enter a price rather than pick from fixed points (to
confirm in Console when products are created), so either option can be
matched exactly on Play.

### 5.1 Scope if KC chooses Option B (not approved; nothing here is started)

A one-cent drop on monthly and a 99-cent rise on yearly, applied in three
systems. KC would first have to set the full tier schedule, for example
$4.99 / $7.99 / $10.99 / $13.99 / $16.99 monthly and $49.99 / $78.99 /
$107.99 / $136.99 / $165.99 yearly.

- **Stripe (new purchases only).** Stripe prices cannot be edited. Create two
  new graduated prices (monthly and yearly) and point
  `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_ANNUAL` at them. Existing
  subscribers stay on their current price automatically; adding an athlete
  keeps them on it.
  - Code that recognises a plan by price id must learn the old ids too, or
    existing subscribers lose their "Monthly" / "Annual" label and drop out of
    the owner dashboard's plan mix and revenue estimate
    (`lib/subscriptions/plans.ts` `priceIdToLabel`, `lib/admin/metrics-core.ts`).
    That needs two "legacy price id" settings and tests.
  - Any hardcoded amount in checkout or trial-conversion copy is updated
    (`lib/actions/subscription.ts`, `lib/stripe/sync-athlete-quantity.ts`,
    `components/subscribe/SubscribeForm.tsx`, `app/subscribe/page.tsx`).
- **Website price display.** 26 source files state a price today: the pricing
  page, the home page sections (hero, pricing summary, FAQ, structured data
  for search engines, waitlist), the parents, athletes and seven sport pages,
  two article pages, both sign-up pages, the dashboard subscribe prompt, and
  `public/llms.txt`. Five test files pin the figures.
  - Marketing copy is owned by the GTM engine (CLAUDE.md "GTM source of
    truth"): `docs/gtm/brand.md`, `copy-paste-sheet.md`, two ready pages and
    `voice-and-guardrails.md` carry the price. KC updates those through the
    engine; this repo then implements them. The repo does not rewrite them.
  - A dated `product-truths.md` entry.
- **Apple.** Ten price changes in App Store Connect. The yearly change is an
  increase, so Apple's rules on notifying or preserving existing subscribers
  apply; preserving current subscribers' prices is the safe default. KC's
  action.
- **Preserving existing subscribers:** Stripe by leaving them on the old
  price; Apple by choosing to preserve current prices; no one's price changes
  unless KC says so.
- Gates: Tier 2 throughout (payments, public pricing). product-strategist,
  kids-privacy-officer, KC.

**Trial.** 7 days, one-athlete tier only, same as web and iOS. Seven days is
KC's decision (FV-574; FV-210 record 4.5) and is what the code does
(`lib/actions/subscription.ts`). CLAUDE.md's MVP-scope line still says 14
days; that is stale copy tracked on FV-609 and should be reconciled before
any Play product is created, so nobody configures 14 by mistake.
- In Play the trial is an offer with "new customer" eligibility. Recommended
  setting: eligible only if the Google account has never had any subscription
  in this app (confirmed that this option exists).
- Cross-provider rule: the app requests the trial offer only when the server
  says the From Victory account is trial-eligible (never had a Stripe
  subscription, an Apple entitlement, or a Google entitlement). Otherwise it
  buys the base plan with no offer.
- `isTrialEligible` for Stripe checkout gains "never held a Google
  entitlement", and the Apple side gains the same check where it exists.
- Residual: a tampered client could request the trial offer when our server
  said no. Google would still enforce once per Google account. The server
  records the offer actually used and alerts. Accepted, same class as iOS.

**Tier changes (confirmed modes; behavior to prove in testing).**
- **v1.1 supports same-interval tier changes only** (monthly to monthly,
  yearly to yearly). This is a product-strategist condition: adding or
  removing athletes never needs an interval change, and cross-interval
  proration is the least certain part of Google's behavior. Switching between
  monthly and yearly in the app is deferred. Cost of the cut: a family that
  wants to switch interval cancels in Google Play and re-subscribes.
- Adding an athlete beyond the tier is an upgrade to a different subscription.
  Recommended mode: `CHARGE_PRORATED_PRICE` (immediate, charges the
  difference). Google's docs say this ends a free trial, which matches the
  existing rule that adding a second athlete during a trial starts the paid
  family plan at once, after explicit parent confirmation (FV-586).
- Moving to a smaller tier: `DEFERRED` (takes effect at renewal). This matches
  the existing downgrade rule: access continues to renewal, then the parent
  chooses which athletes keep access (FV-585). Never auto-select.
- **To prove on license testers before any of this is promised:** what
  purchase tokens and notifications a `DEFERRED` change produces and when,
  and how an upgrade during a trial is charged and reported.

## 6. Decision 3: which Android builds can sell (capability signal)

- **Every Android build already shipped stays `legacy-native` forever.** The
  top-level `appendUserAgent: "FVNativeShell/1"` does not change. Those builds
  have no billing plugin and must keep showing no price and no purchase path.
- **New Android builds add their own marker**, the same way iOS did:
  `android: { appendUserAgent: "FVNativeShell/1 (play)" }` in
  `capacitor.config.ts`. `getShellCapability()` gains a third value,
  `android-play`, checked before the bare token.
- The marker changes presentation only. It is never authorization. A forged
  marker gets a different page and nothing else; purchases are accepted only
  on server-side verification tied to the signed-in account.
- The config guard test (FV-483, rewritten for iOS) is extended: base token
  pinned, tokens only at top level or under `ios` / `android`, no Stripe host
  in `allowNavigation`.
- Under `android-play` only: sign-up is restored, add-athlete is restored
  behind the capacity gate, `/subscribe` renders the Play purchase UI, and the
  settings pages show Play-aware manage controls. Under `legacy-native`
  everything stays byte-identical, pinned by the existing test suites.
- **Role rule (architectural, not just a test).** Purchase, manage,
  add-athlete and Play deep-link UI render only for a `parent` or an
  `adult_athlete`. The `athlete` role (a minor) never reaches any of them
  under any capability. This is the same boundary iOS and web already hold
  (`/subscribe` is behind `requireSubscriber`, which rejects the `athlete`
  role); Android adds no new path around it.
- **Sign-up rule.** Restoring sign-up on Android restores the existing flows
  unchanged: the 13+ birthdate floor, parent sign-up, and the 18+ adult
  sign-up with its attestation. There is no Android-only sign-up path and
  nothing that skips the age gate.
- Guards to pin in tests: an `athlete` session never sees purchase, manage or
  add-athlete UI under `android-play`; no hardcoded `$` reachable under
  `android-play`; all FV-492/493 legacy suites pass unchanged.
- Families on 1.0.x keep the consumption-only app until they update. There is
  no forced-update mechanism today, and this record does not add one
  (decision G9).

## 7. Decision 4: server verification and provider ownership

### 7.1 Provider-separated state (new tables, sketch only)

- `google_subscriptions`: payer (FK to profiles, cascade), purchase token,
  product id, base plan id, Google-native status, expiry, auto-renewing flag,
  test-purchase flag, the obfuscated account id that came back, linked
  previous token, acknowledged flag, last verified time. Service-role writes,
  same grant pattern as `apple_subscriptions`.
  - The client role may read, for its own row only: product id, base plan id,
    status, expiry, auto-renewing flag. Nothing else.
  - The client role may never read: the purchase token, the linked previous
    token, the obfuscated account id, the test-purchase flag.
- `google_purchase_bindings`: one opaque UUID per payer, service-role only.
- `google_license_testers`: allowlist of payers whose test purchases may
  grant access on the production backend, service-role only.
- Status vocabulary is Google's own. It is not shared with Apple or Stripe.
- **Retention and deletion.** All three tables cascade when the profile is
  deleted. Purchase tokens are removed with the row at deletion; they are not
  kept for refund or dispute handling. No table stores a name, an email, an
  athlete id, or payment details.
- **Logging.** Purchase tokens and obfuscated account ids are never written
  to logs or alerts. Alerts identify a row by its internal row id only.
- Schema design and RLS are the backend child issue. kids-privacy-officer
  reviews the migration.

### 7.2 Binding a purchase to the right family

- The server mints an opaque per-payer UUID (never a profile id, never an
  email). The app passes it as Play's `obfuscatedAccountId` (confirmed: at
  most 64 characters, must not be cleartext personal data).
- Google returns it on the server side in the subscription record
  (`externalAccountIdentifiers.obfuscatedExternalAccountId`, confirmed).
- The server grants access only when the value Google returns equals the
  signed-in payer's minted UUID. A token already bound to a different payer
  is refused. No automatic re-linking.
- **Play promo codes stay off in Console for v1.1** (product-strategist
  condition). That removes one of the two out-of-app paths below.
- **Known gap to design for:** purchases that start outside the app
  (re-subscribing from the Play Store's own subscription screen, and promo
  codes if they were ever enabled). These may arrive without the id. The intended rule is to follow
  Google's `linkedPurchaseToken` back to a row we already own and otherwise
  grant nothing and alert (the alert carries no purchase token and no payer
  id in plain text). This must be proven on license testers. The Apple
  offer-code problem (FV-649) is the same class of issue.

### 7.3 Verification, lifecycle, time

- Verify every purchase token with Google's API
  (`purchases.subscriptionsv2.get`, confirmed) before granting anything.
- **Acknowledge on the server**, after the entitlement row is written.
  Unacknowledged purchases are refunded and revoked by Google after 3 days
  (confirmed). Pending purchases do not apply to auto-renewing subscriptions
  (confirmed).
- **Real-time Developer Notifications** (confirmed): Google publishes to a
  Cloud Pub/Sub topic; a push subscription delivers to
  `/api/webhooks/google-play`. The message carries only a notification type
  and the purchase token. The webhook authenticates the push (Google-signed
  token), then re-reads the subscription from Google and upserts. State always
  comes from Google's API, so duplicate or out-of-order messages are harmless.
- **Status to access level (proposed):**

| Google state | Access | Note |
|---|---|---|
| ACTIVE | full | |
| CANCELED, not yet expired | full | Paid through the period |
| IN_GRACE_PERIOD | full | Same as Apple grace |
| ON_HOLD | decision G3 | Google's guidance is no access during hold. Stripe past-due and Apple billing retry are `degraded` (not blocked) today. |
| PAUSED | blocked | Recommend turning the pause feature off in Play Console |
| EXPIRED, revoked, voided | blocked | Refunds and chargebacks arrive as revoke / voided-purchase notices |
| PENDING | blocked | Not expected for auto-renewing plans |

- Refunds: Google issues them. The server learns of them from the revoke and
  voided-purchase notifications (confirmed) and removes access.
- Grace period and account hold are configured per base plan in Play Console.
  Account hold is on by default (confirmed). Length options need to be read
  in Console (decision G4).

### 7.4 Test purchases on the production backend

License-tester purchases must not grant real access to ordinary accounts.
Google marks them on the subscription record; the server grants access from a
test purchase only for allowlisted payers. This mirrors the Apple sandbox
rule (FV-210 record 4.9) and its runbook discipline (FV-597): review the
allowlist before activation and remove QA and reviewer entries afterwards.

### 7.5 Shared rules, extended to three providers

- **Resolver:** Google folds into `getParentAccessLevel` with `bestOf`, and
  into the offline window as a fourth contributor.
- **Duplicate-purchase guard:** `getSubscribeEntitlementState` gains provider
  `google`. A payer entitled through Stripe, Apple or a comp grant never sees
  a Play purchase button. A Google-entitled payer on iOS or web sees status
  and "manage it on your Android phone".
- **Capacity:** Google tiers carry the same 1 to 5 ceiling as Apple. Stripe
  stays uncapped. At the ceiling on Android: the upgrade prompt. At the
  ceiling on web or iOS for a Google payer: "manage your plan on your Android
  phone".
- **Families with more than five athletes** cannot be served by a Play tier.
  The Android app may not steer them to the website. Handle it the way iOS
  does today, and confirm that handling in the UI child issue.
- **Seat selection after a downgrade:** unchanged rules, driven by Google's
  deferred change taking effect.
- **Account deletion:** unlike Apple, Google offers a server-side cancel.
  Recommended: cancel the Play subscription as part of deletion, the way
  Stripe is cancelled. Whether to cancel only (no further renewals) or revoke
  with a refund is decision G5, and the delete-screen wording needs KC's
  approval.
  - A failed cancel call must never leave the account undeleted past the
    30-day deletion commitment. Proposed handling: retry; if Google still
    cannot be reached, complete the deletion, show the user a "cancel it in
    Google Play" message (the same shape as the Apple notice, FV-652), and
    raise an alert so the subscription is cancelled by hand.

### 7.6 New infrastructure and dependencies (stack additions)

These need product-strategist approval before any child issue starts:

- A Google Cloud project with the Android Publisher API enabled, one Pub/Sub
  topic and one push subscription.
- A service account with the minimum Play Console permissions to read and
  acknowledge subscriptions. Cancel permission is added only if G5 chooses
  server-side cancel.
- Credential handling: prefer keyless federation from the hosting platform if
  it works; otherwise a service-account key held as a server-only secret
  (decision G7).
- Server dependency: Google's own auth library, calling the REST endpoints
  directly. Not the full API client bundle. Server-only; it must never reach
  a client bundle.
- Native dependency: Play Billing Library v9.

product-strategist reviewed these on 2026-11-11 and approved all four, with
the conditions written into the bullets above (Section 14).

## 8. Store setup and paperwork (KC actions; nothing here is authorized yet)

- Google Payments merchant account (missing as of 2026-11-03).
- Subscriptions, base plans and the trial offer per Section 5.
- License testers; accelerated renewals for testing are built in (confirmed:
  monthly renews in 5 minutes, yearly in 30, trial lasts 3 minutes).
- Pub/Sub topic wired in Play Console under Monetization setup; Google's
  notification service account granted publisher rights (confirmed steps).
- Data safety: purchase history is a declared data type (confirmed that the
  category exists; what must be declared when Play handles payment needs a
  careful read). Account creation in the app also changes the answers.
- Content rating questionnaire: digital purchases becomes yes.
- Review access: the current Play reviewer account has a permanent comp
  grant, so it would never see the purchase flow. Reviewers need a way to
  reach it (decision G8).
- Privacy policy and terms: name Google Play as a payment processor for
  Android purchases. Attorney review per the usual gate.
- **Activation blocker, not paperwork.** No Android build carrying the
  `android-play` marker is released until `/privacy`, the processors list and
  the Data safety form all describe Google Play purchases and in-app account
  creation. They change together, in one reviewed step.

## 9. Fees and why not link-out

Read from Google's and Apple's own pages on 2026-11-11. Fees differ by
market, program and date; there is no single universal rate.

| Route | Fee on a subscription | Market / date | Confirmed |
|---|---|---|---|
| Play Billing | 10% service fee + 5% billing fee = 15% | US, EEA, UK from 2026-06-30; Australia, Japan from 2026-09-30 | Yes |
| Play Billing | 15% flat | Other markets until the change rolls out | Yes |
| US external link to buy on our website | 10% service fee to Google (the page's fee table did not extract cleanly; re-read it in a browser), plus our own processor's fee. Optional program; enrollment must be completed first; transaction reporting and payment to Google from 2026-10-01 | US only | Yes, with that caveat |
| US external link to download an app outside Play | Fixed per-install fee ($2.85 per app install). **Does not apply to purchase links.** | US only | Yes |
| Alternative billing / billing choice | 10% service fee; enrollment and 24-hour reporting | EEA, UK from 2026-06-30; Australia, Japan from 2026-09-30 | Yes |
| US alternative billing rate | Not read from a primary page | US | No |
| Apple, for comparison | 15% with the Small Business Program; otherwise 30% in a subscriber's first paid year and 15% after | Global | Yes |

- **Correction (2026-11-11).** An earlier note on FV-620 said the US
  link-out route carries the $2.85 per-install fee and therefore costs more
  than Play Billing. That was wrong: the per-install fee applies only to links
  that download an app from outside Play. FV-620 has been corrected.
- **Corrected comparison on a $49 yearly plan.** Play Billing: Google keeps
  $7.35. US link-out to Stripe: Google keeps $4.90 and Stripe about $1.72,
  about $6.62 in total. Link-out is cheaper by roughly $0.73 per subscriber
  per year. The fee difference is too small to decide anything.
- **What actually separates the two routes:**

| | Play Billing (this record) | US link-out to Stripe |
|---|---|---|
| Checkout | Google Play sheet inside the app | Google's notice screen, then a browser, then Stripe Checkout |
| Manage / cancel | Google Play subscriptions | Website billing portal |
| Markets | Every market the app is in | US only. Canada (the app's other launch market) would stay consumption-only |
| Depends on | Standard Play policy | An optional program created under a US court order |
| Build | This record: about 33 to 52 working days, a third provider to maintain | Much smaller: no billing plugin, no third provider. Needs enrollment, Google's link requirements, and a transaction-reporting integration. Not estimated here. |
| Sign-up in the app | Restored | Would also need restoring |

- **DECIDED (KC, 2026-11-11): Google Play Billing with Google's in-app
  checkout.** KC's stated reason: a better user experience from the start.
  The link-out route is not pursued. The reason is experience, not cost.
- Whether the Play Billing rate needs any enrollment was not confirmed on
  Google's service-fee page. Check it in Play Console once the merchant
  account exists.
- Play's payments policy requires Play Billing for in-app digital
  subscriptions (confirmed). US exception programs exist under a court order
  and are not used here.

Sources: [Play service fees](https://support.google.com/googleplay/android-developer/answer/112622),
[US external content links](https://support.google.com/googleplay/android-developer/answer/16470497),
[Play Billing deprecation FAQ](https://developer.android.com/google/play/billing/deprecation-faq),
[subscriptions guide](https://developer.android.com/google/play/billing/subscriptions),
[integration guide](https://developer.android.com/google/play/billing/integrate),
[subscriptionsv2 API](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2),
[RTDN reference](https://developer.android.com/google/play/billing/rtdn-reference),
[testing](https://developer.android.com/google/play/billing/test),
[payments policy](https://support.google.com/googleplay/android-developer/answer/10281818),
[Apple subscriptions](https://developer.apple.com/app-store/subscriptions/).

## 10. Effort, sequencing, maintenance

"v1.1" is a release label. It says nothing about size. The iOS arc ran from
approval on 2026-09-11 to the first real production purchase on 2026-11-03,
across roughly 30 issues and one App Review rejection.

### 10.1 Proposed child issues (filed under FV-620 after KC acknowledges)

Estimates are working days of agent effort and are rough. Elapsed time is
longer because every item is Tier 2 (payments, migrations, auth) and waits on
KC, reviews, and Google.

| # | Child issue | Area | Estimate | Depends on |
|---|---|---|---|---|
| C1 | `android-play` capability signal, config marker, guard-test rewrite. Dormant: no fielded build carries the marker yet. | web + native config | 1-2 | Record acknowledged |
| C2 | Data model: three tables, RLS, grants, RLS harness assertions | supabase | 2-4 | Record acknowledged, G1 |
| C3 | Server verification: Google auth, subscription read, acknowledge, typed catalog (dormant flag) | backend | 4-6 | C2, G7, Cloud project approved |
| C4 | Notifications webhook: Pub/Sub push auth, re-read and upsert, lifecycle mapping, and an alert when the pipeline stalls or errors (release blocker) | backend | 3-5 | C3 |
| C5 | Three-provider integration: resolver, capacity, seat state, trial rule, duplicate guard, offline window, deletion cancel | backend (hot shared files, serialize) | 4-6 | C3, G3, G5 |
| C6 | Native plugin and JS bridge on Play Billing Library v9 | apps/native (independent area) | 4-6 | Record acknowledged |
| C0 | Policy check: read Google's current Families and teen policies against a 13+ app where parents buy; record what they require. Docs only. | privacy + docs | 1 | Record acknowledged |
| C7 | Android purchase UI, manage surfaces, restored sign-up and add-athlete under `android-play`, delete-flow wording | frontend (hot files, serialize) | 5-8 | C0, C1, C5, C6, KC copy |
| C8 | Console and Cloud setup runbook, executed by KC: merchant account, products, testers, Pub/Sub, service account | KC + docs | 1 (KC) + waits | G1, G2, G4, G7 |
| C9 | Store paperwork: Data safety, content rating, reviewer access, privacy policy and terms update | KC + privacy + attorney | 1-2 + waits | C7 design known |
| C10 | Integrated device QA on license testers: purchase, trial, upgrade in trial, deferred downgrade and seat selection, hold, refund, restore, out-of-app re-subscribe, account switch, cross-provider | qa + native | 5-8 | C4-C8 |
| C11 | Activation runbook, release build, product truths, doc updates (`android-play-release.md`, CLAUDE.md) | docs + release (KC) | 2-3 | C10 |

**Total: about 33 to 52 working days.** With gates, that supports the rough
6 to 10 weeks elapsed already recorded on FV-620, and it could run longer if
Play review or the out-of-app binding problem bites.

### 10.2 Acceptance criteria the child issues must carry

From the kids-privacy-officer review of this record. Each is copied onto the
named child issue when it is filed.

- **C2:** RLS harness assertions that the client role cannot read tokens,
  bindings or the tester allowlist, cannot read another payer's rows, and can
  read only the columns listed in 7.1. A cascade-delete test.
- **C2, C3:** the binding id is a fresh random UUID per payer, not derived
  from the profile id, and not the same value used for Apple.
- **C2, C4:** tokens and obfuscated ids are never logged. Pub/Sub payloads and
  webhook logs carry no personal data.
- **C3, C4:** webhook push authentication is verified and tested. A test
  purchase from a payer who is not on the allowlist grants nothing, with a
  test. The allowlist is empty by default.
- **C6, C7:** Play Billing is the only new SDK. The Gradle dependency tree is
  checked to confirm it pulls in no ads or analytics library. No analytics or
  attribution is added.
- **C7:** tests show an `athlete` session never reaches `/subscribe`, manage,
  add-athlete or a Play deep link under `android-play`. Sign-up keeps the 13+
  floor and existing rules.
- **C9:** Data safety, the privacy policy and the processors list are
  reconciled in the same change: purchase history, any new identifier,
  in-app account creation, Google Play as a processor, Apple's coverage
  checked. Attorney review.
- **C0, then C9:** Google's current Families and teen policies are read
  before any UI work (C0) and applied before release (C9): target-audience
  declaration, content rating, and that a minor cannot purchase. This closes
  Risk 6.
- **C10:** account deletion with an active Play subscription; account switch
  on a shared device; proof that a binding cannot leak across payers.

### 10.3 Order and timing

product-strategist's recommendation (2026-11-11), adopted here as the
proposed plan. KC decides the timing (decision G10).

**Stage 1, can start once the record is acknowledged. Everything dormant,
none of it touches files other work is using:**
1. KC answers G1 to G10 (G0 is decided). FV-609 (trial copy) reconciled.
2. C0 (policy check), C1 (capability signal), C2 (data model), C6 (native
   plugin), in parallel.
3. KC starts the Google Payments merchant account (C8), which has its own
   waiting time.

**Stage 2, held until KC releases it.** C3, C4, then C5 and C7 (shared
billing and purchase-surface files, one at a time), C9, C10, C11.
- Suggested trigger for Stage 2: Android 1.0.1 is published, the open iOS and
  Android release blockers are cleared, and there is some sign of Android
  families arriving (installs, or outreach families asking to pay in the
  app). At 0 to 10 subscribers with outreach-led acquisition, the strategist's
  view is that starting the full arc now is premature.
- **Scope check after C3:** if measured effort is running past 1.5 times the
  estimate, stop and report to KC (Section 12).

Everything merges dormant: catalog flag off, no fielded build carries the
marker, no Console products live, until KC activates.

### 10.4 Maintenance (ongoing cost of the Go)

- **Library upgrades on Google's clock.** v9 must be replaced by 2028-08-31;
  Google has moved roughly one major version a year. Each upgrade is a native
  build, a device pass and a Play release.
- **Three providers in every billing change.** About 36 source files and 37
  test files branch on provider today. Every future pricing, trial, capacity
  or deletion change is designed and tested three ways.
- **Notification pipeline.** A Pub/Sub subscription and a webhook that must
  stay healthy. Silent failure means stale access, in either direction. It
  needs an alert.
- **Credentials.** A service account or federation setup to rotate and audit.
- **Store upkeep.** Data safety answers, Play policy changes, fee program
  changes.

**Who carries it.** Not assigned today. Proposal for KC to confirm
(decision G6): KC owns Play Console, Google Cloud, agreements and releases, as
with Apple. Code maintenance is done by the engineering agents under KC's
Tier 2 gate. A recurring Linear issue each June checks Google's deprecation
table and files the upgrade if one is due; it is created at activation, not
before.

## 11. Risks and open questions

1. **Out-of-app purchases may arrive without the account id** (7.2). If
   Google's linked-token chain does not cover it, re-subscribing from the
   Play Store could charge a family and grant nothing. Must be proven in C10
   before release, and the design must fail safe (no wrong-family grant).
2. **Tier-change behavior is documented but unproven for our shape** (5):
   cross-interval upgrades, deferred downgrades, upgrade during trial.
3. **Reviewer path** (8): reviewers must be able to reach the purchase flow.
4. **Hot-file collisions.** C5 and C7 touch `subscribe/page.tsx`, the
   dashboard and settings pages, and the shared subscription modules. Other
   work on those files must be serialized (CLAUDE.md "Stream Boundaries").
5. **Privacy policy** names only Stripe as a processor today. Google must be
   added, and Apple's coverage checked. This blocks activation (Section 8).
6. **Policy for younger users.** The app's audience is 13 and up and parents
   buy for minors. What Play's Families and teen policies require of an app
   that sells subscriptions was not confirmed from Google's pages. C9 must
   settle this with kids-privacy-officer before release.
7. **Not confirmed from primary sources:** default grace-period length and
   the available options; whether an in-app cancel or manage control is
   mandatory (the manage deep link is included regardless); maximum length of
   base plan and offer ids; the minimum library version is inferred from the
   deadline table.
8. **Old builds linger.** Families who never update stay consumption-only.

## 12. What would reopen the Go decision

Only material new evidence, reported to KC, not acted on quietly. Examples:
Google changes fees or policy so the economics or the allowed purchase paths
differ from Section 9; license-tester evidence shows purchases cannot be
bound to the right family safely; Play policy for apps with users under 18
forbids or heavily restricts the purchase flow; or the measured effort in the
first child issues runs far past Section 10.

## 13. Decisions needed from KC

**G0 is decided. It settles the approach only.** It does not approve the
timing (G10), the permanent product IDs (G1), any change to the trial, any
merge, or any Play Console or Google Cloud configuration. On G2, KC gave a
direction (match Apple) but the figures he cited do not match Apple's
verified prices, so G2 is not recorded as decided. No Play product is created
and no live price is changed by anything in this record. G1 and G3 to G10
remain open, and the child issues are still not filed.

| # | Decision | Recommendation |
|---|---|---|
| G0 | Play Billing or a US-only link-out to Stripe (Section 9) | **DECIDED by KC, 2026-11-11: Google Play Billing with Google's in-app checkout**, for a better user experience from the start |
| G1 | Product ID scheme (permanent once created) | Five subscriptions `family.1` to `family.5`, base plans `monthly` / `yearly`, offer `trial-7d` on tier 1 |
| G2 | Play prices | **Direction given by KC 2026-11-11 (match Apple, website to follow), figures unresolved.** KC cited $4.99 / $49.99; Apple's verified prices are $5.00 / $49.00 and already equal the website (Section 5). Recommendation: Option A, match Apple's actual schedule, which needs no website or Stripe change. |
| G3 | Access during Google "account hold" | Follow whatever KC decides for the still-open billing-retry policy, so all three providers behave the same |
| G4 | Grace period length; pause feature | Closest available to Apple's 16 days; pause off |
| G5 | On account deletion: cancel only, or revoke with refund | Cancel only, with clear wording on the delete screen |
| G6 | Maintenance ownership (10.4) | As proposed |
| G7 | Server credential method | Keyless federation if it works, otherwise a server-only key |
| G8 | How Play reviewers reach the purchase flow | A second reviewer account with no comp grant, allowlisted for test purchases |
| G9 | Prompt 1.0.x users to update? | Not in this arc |
| G10 | Timing: start Stage 1 now and hold Stage 2 (10.3), or run the whole arc now | Stage 1 now, Stage 2 on KC's release |

## 14. Reviews (2026-11-11)

**product-strategist: APPROVED WITH CONDITIONS.**
- Scope: C1 to C11 is close to the minimum. Cuts applied in this record:
  same-interval tier changes only (Section 5); Play promo codes off (7.2);
  the recurring deprecation-check issue is created at activation (10.4).
  Kept: server-side cancel on deletion, and in-app sign-up under
  `android-play` (without it there is no purchase path).
- Stack additions (7.6): all four approved. Conditions: least-privilege
  service account, keyless credentials preferred, auth library server-only.
- G0: backs Play Billing over link-out. Its own words on cost: at 0 to 10
  subscribers the cheapest option is neither route, it is staying
  consumption-only. KC's Go stands, and KC has since decided G0 for Play
  Billing.
- Timing: starting the full arc now is premature. Start the dormant,
  independent pieces and the merchant account; hold the shared-file work
  (10.3, decision G10).
- Other conditions, applied: settle the trial length in writing before
  products are created (Section 5); teen-policy check before UI work (C0);
  scope check after C3 at 1.5 times the estimate (10.3); a notification
  pipeline alert is a release blocker (C4).

**kids-privacy-officer: CHANGES_REQUESTED on the first draft; changes
applied in this version.**
- Applied to the record: the role rule and the sign-up rule stated as
  architecture (Section 6); client-readable columns listed, retention,
  deletion and logging rules (7.1, 7.2); deletion never stalls past the
  30-day commitment (7.5); policy and Data safety updates are an activation
  blocker (Section 8, Risk 5).
- Copied to child issues as acceptance criteria: Section 10.2.
- Fine as proposed: opaque UUID binding; test-purchase allowlist; Google's
  first-party billing library as a disclosed payment processor rather than a
  third-party tracking SDK; the capability marker as presentation only.
- Re-review of this revised version: APPROVED, all seven items resolved, no
  new concern from the product-strategist changes. Posted on the PR.
