# Play Billing console and Cloud setup runbook (FV-666, "C8")

**Written:** 2026-11-19. **Who runs it:** KC, in Google's consoles and in
Vercel. An agent cannot do any of it.

**What this gets you:** the Google-side setup that must exist before Google
Play subscriptions can be tested on license testers (FV-668). It does not turn
anything on for families. Two of the three locks in the decision record stay
closed when you finish (the build switch and the server flag, record 6.1).

**Source of truth:** `docs/fv651-android-play-billing-decision-record.md` (v4),
called "the record" below. Where this runbook and the record disagree, the
record wins and this file is wrong.

## How to read this runbook

- **`CHECK IN CONSOLE`** means: the step depends on what Google's screens look
  like, and whoever wrote this could not see them. Menu names and labels below
  are descriptions of what to look for, not verified paths. If the screen does
  not match, stop on that step and note what you saw. Do not guess.
- **`TO DECIDE (id)`** means the record does not settle it. Decide it, write
  the answer on FV-666, then continue. The id is the decision in record
  Section 13, or "not in record" when the record is silent.
- **Secrets.** This file never shows a secret and you should never paste one
  into chat, Linear, a PR, or a commit. Values go from Google's screen
  straight into Vercel.
- **Limits that still apply (record, top of file).** Each of these needs your
  own decision at the moment you do it: accepting an agreement, creating a
  credential, widening a permission, a real charge, and creating a permanent
  product before its ID is approved.
- **Any setting this runbook does not mention:** leave it at Google's default
  and write down what the default was.

## Before you start

| Needed first | Why | Where it comes from |
|---|---|---|
| G1 approved (step 1 of this runbook) | Product IDs are permanent | Record 5.2, 13 |
| You know the trial is 7 days, not 14 | So nobody types 14 into the trial offer. `CLAUDE.md` and the code say 7; `docs/stripe-go-live-runbook.md` said 14 until it was corrected under FV-769. | Record 5.2 "Trial" |
| G7 decided (key file or keyless) | Decides what you create in step 3 and set in step 5 | Record 13 |
| The grace-period list read in the console (G4) | The record expects 14 days but could not confirm the list | Record 13, risk 7 |
| Owner access to the Play Console developer account | Only the owner can set up payments and invite users | `docs/android-play-release.md` section 1 |

You can start step 2 (merchant account) at any time. It has its own waiting
time and is the longest external dependency (record 10.3).

**Worksheet.** As you go, write these non-secret values on FV-666. Later steps
and the activation runbook need them.

| Item | Value |
|---|---|
| Google Cloud project ID | |
| Pub/Sub topic, full name (`projects/.../topics/...`) | |
| Push subscription name | |
| Push endpoint URL | |
| Push audience string | |
| Push service account email | |
| Play API service account email | |
| Grace period chosen (days) and the full list the console offered | |
| Account hold default shown (days) | |

---

## Step 1. Sign off the product IDs and prices (decision G1)

**WARNING: a Play product ID can never be changed and can never be reused,
even after the product is deleted.** Nothing in step 4 may be created until you
have approved the exact strings below. Display names and prices can be edited
later. IDs cannot.

The IDs come from the code, which marks them "PROVISIONAL IDS, NOT APPROVED":
`apps/web/lib/subscriptions/google-product-catalog.ts` (constants block, lines
22 to 36). They match record 5.2. The code holds no prices; prices are from the
record's G2 table (Section 5, decided by KC on 2026-11-11).

App package name: `com.fromvictoryapp.app`
(`google-product-catalog.ts` line 26; also `docs/android-play-release.md`
"Locked facts").

| Athletes | Subscription product ID | Name shown by Google Play | Base plan ID | Billing period | US price | Offer ID |
|---|---|---|---|---|---|---|
| 1 | `family.1` | 1 athlete | `monthly` | 1 month | $5.00 | `trial-7d` |
| 1 | `family.1` | 1 athlete | `yearly` | 1 year | $49.00 | `trial-7d` |
| 2 | `family.2` | Up to 2 athletes | `monthly` | 1 month | $8.00 | none |
| 2 | `family.2` | Up to 2 athletes | `yearly` | 1 year | $78.00 | none |
| 3 | `family.3` | Up to 3 athletes | `monthly` | 1 month | $11.00 | none |
| 3 | `family.3` | Up to 3 athletes | `yearly` | 1 year | $106.99 | none |
| 4 | `family.4` | Up to 4 athletes | `monthly` | 1 month | $14.00 | none |
| 4 | `family.4` | Up to 4 athletes | `yearly` | 1 year | $135.99 | none |
| 5 | `family.5` | Up to 5 athletes | `monthly` | 1 month | $17.00 | none |
| 5 | `family.5` | Up to 5 athletes | `yearly` | 1 year | $164.99 | none |

That is 5 subscription products, 10 base plans, and 2 trial offers (one on
each base plan of `family.1`).

Trial offer `trial-7d`: free, 7 days, one-athlete tier only (record 5.2).

Open items to settle here, before step 4:

1. **G1.** Approve the IDs exactly as in the table. Record it as one line on
   FV-666, for example "G1 approved: IDs as in
   `docs/play-billing-console-runbook.md` step 1".
2. **TO DECIDE (Names).** Whether the names carry a "From Victory" prefix
   (record 13, "Names"). Names can be edited later.
3. **TO DECIDE (G2, scope).** G2 fixes the US dollar prices only. The record
   does not say which countries the subscriptions are sold in or what the
   non-US prices are. It notes Canada is the app's other launch market
   (record Section 9) and that Apple's trial offer was set up for USA only
   (record 5.2). Decide the country list and whether non-US prices are typed
   by hand or left to Google's conversion.
4. **TO DECIDE (not in record).** Any description or benefits text Google asks
   for on a subscription. If you write any, it is customer-facing copy and
   follows `docs/gtm/voice-and-guardrails.md`.

After you approve G1, tell the lead agent. A follow-up PR removes the
"PROVISIONAL" wording from the catalog file. That is not your task.

**Check:** FV-666 carries the G1 line and answers to items 2 to 4.
**Undo:** fully reversible until step 4. Nothing exists in Google yet.

---

## Step 2. Google Payments merchant account

The record says this was missing as of 2026-11-03 (record Section 8). You
cannot create a paid subscription without it.

**Status 2026-11-19 (reported from the live console, not re-checked here):**
merchant enrollment was submitted and accepted. The payments profile shows
Google Play Apps / FROM VICTORY LLC with an earnings dashboard. Still open:
- A payout bank account has been added; Google's verification of it is
  pending.
- Enrollment in the 15% service fee program is complete (the fee question in
  item 7 below).
- Verification and tax readiness are not confirmed.
- A trader-status declaration is due by 2027-02-01. It is separate from this
  runbook.

An accepted merchant account is not approval to create products. Step 1 (the
ID sign-off) still gates step 4.

1. Sign in to Play Console as the account owner. `CHECK IN CONSOLE`
2. Find out whether a merchant account (Google calls it a payments profile)
   is already linked. Look in the developer account's settings for a payments
   or "payments profile" entry, and open the app's subscriptions page under
   the monetization area: if no merchant account exists, Google normally shows
   a prompt to set one up there instead of a "create subscription" button.
   `CHECK IN CONSOLE`
3. If one is linked, note the legal name on it and skip to the check below.
4. If none is linked, follow Google's prompt to create it. Use the legal
   entity that owns the developer account (From Victory LLC). Google will ask
   for business details, a bank account for payouts, and tax information. Type
   these yourself. Do not send them to an agent. `CHECK IN CONSOLE`
5. Creating the profile includes accepting Google's payments terms. That is an
   agreement, so it is your decision at that moment (record, top of file).
6. Google may verify the bank account with a small test deposit or ask for
   documents. That wait is outside our control. `CHECK IN CONSOLE`
7. The record could not confirm whether the 10% + 5% subscription fee needs
   any enrollment (record Section 9). Once the merchant account exists, look
   for any fee program prompt and note what it says. Do not enroll in
   anything new without deciding it first. `CHECK IN CONSOLE`

**Check:** the subscriptions page for the app lets you start creating a
subscription (do not finish creating one yet), and the payments profile shows
the LLC's legal name with no outstanding verification banner.
**Undo:** there is no clean undo. A payments profile can be closed through
Google, but treat linking as permanent for the developer account.

---

## Step 3. Google Cloud: project, API, Pub/Sub, service accounts, notifications

What the server needs from this step (all from code):

- A credential that can call the Android Publisher API. The server reads it
  from `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` and asks for the scope
  `https://www.googleapis.com/auth/androidpublisher`
  (`apps/web/lib/subscriptions/google-play-auth.ts`, `buildAuth()` and
  `ANDROID_PUBLISHER_SCOPE`).
- A Pub/Sub push to `POST /api/webhooks/google-play` that carries a
  Google-signed token (`apps/web/app/api/webhooks/google-play/route.ts`).
  The server accepts a push only when all of these hold
  (`google-play-auth.ts`, `verifyPubSubPush`):
  - the request has an `Authorization: Bearer <token>` header;
  - the token's signature verifies against Google's certificates;
  - the token's audience equals `GOOGLE_PLAY_PUBSUB_AUDIENCE` exactly;
  - the issuer is Google (`accounts.google.com`);
  - the token's `email` equals `GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT`
    (letter case is ignored);
  - `email_verified` is true.
  If either variable is missing the push is refused with 403.

Names of the project, topic and subscription are your choice. No code refers
to them. Write them on the worksheet.

### 3a. Project

1. Sign in to Google Cloud console with a Google account you will still
   control in five years. The record's proposal is that KC owns Cloud as well
   as Play Console (G6). `CHECK IN CONSOLE`
2. **TO DECIDE (G6):** confirm that ownership in one line on FV-666 (record
   13). It also decides which Google account owns this project.
3. Create a new project used only for From Victory Play billing. Note the
   project ID. A project ID cannot be changed after creation.
   `CHECK IN CONSOLE`
4. If Google asks you to attach a billing account before you can use Pub/Sub,
   that is a new cost commitment and an agreement. Decide it at that moment.
   The record does not cover it. `CHECK IN CONSOLE`

### 3b. Enable the Android Publisher API

1. In the project, open the API library and search for "Google Play Android
   Developer API" (this is the Android Publisher API,
   `androidpublisher.googleapis.com`; record 7.6). `CHECK IN CONSOLE`
2. Enable it for this project only.
3. In the same place, confirm the Cloud Pub/Sub API is enabled. Enable it if
   it is not. `CHECK IN CONSOLE`

### 3c. Service accounts (decision G7, least privilege)

Create two service accounts, each with one job. The record requires least
privilege (7.6) but does not say one account or two. Two is the smaller
grant: the push identity then holds no Play permission at all.
**TO DECIDE (G7):** confirm two accounts, or choose one shared account.

1. **Push identity.** Create a service account whose only use is signing
   Pub/Sub pushes. Give it no project roles and no Play Console access. Never
   create a key for it. Write its email on the worksheet. `CHECK IN CONSOLE`
2. **Play API identity.** Create a second service account for the server's
   calls to Google Play. Give it no project roles in Cloud. Its rights come
   from Play Console in step 3f. Write its email on the worksheet.
   `CHECK IN CONSOLE`
3. **TO DECIDE (G7): key file or keyless federation.** The record prefers
   keyless federation from the hosting platform "if it works in testing",
   otherwise a key held as a server-only secret (record 7.6, 13).
   - The code on `main` supports only the key file today:
     `google-play-auth.ts` `buildAuth()` reads
     `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` and nothing else. Keyless would need a
     code change first. Tell the lead agent if you choose keyless, and do not
     create a key.
   - If you choose the key file: create one JSON key for the Play API identity
     only. Creating a credential is your decision at that moment. Your browser
     downloads a file. Keep it out of the repo folder, do not open it in a
     shared screen, and do not paste it anywhere except Vercel in step 5.
     After step 5, delete the downloaded file and empty the trash.
     `CHECK IN CONSOLE`

### 3d. Pub/Sub topic

1. Create one topic in the project. Leave encryption and schema settings at
   their defaults. If the console offers to add a default subscription, turn
   that off; you create the one subscription yourself in 3e.
   `CHECK IN CONSOLE`
2. Write the full topic name on the worksheet. Its form is
   `projects/<project-id>/topics/<topic-name>`.
3. Give Google Play's notification sender the right to publish to this topic,
   and only this topic. On the topic's permissions, add Google's Play
   notifications service account as a principal with the Pub/Sub Publisher
   role (record Section 8, "confirmed steps"). Copy the principal's address
   from Google's current real-time developer notifications setup page rather
   than from memory. At the time of writing it is expected to be
   `google-play-developer-notifications@system.gserviceaccount.com`, which is
   not verified here. `CHECK IN CONSOLE`

### 3e. Push subscription

1. On the topic, create one subscription. `CHECK IN CONSOLE`
2. Delivery type: **Push**.
3. Endpoint URL: `https://www.fromvictoryapp.com/api/webhooks/google-play`
   - Use the `www` host. It is the app's production host
     (`apps/native/capacitor.config.ts` `server.url`;
     `docs/android-play-release.md` "Locked facts"). A push that gets
     redirected to another host fails, so do not use the bare domain.
   - No trailing slash.
4. Turn on **authentication** for the push. `CHECK IN CONSOLE`
   - Service account: the **push identity** from 3c.
   - Audience: type the same string as the endpoint URL in line 3, exactly.
     Do not leave it blank and rely on a default. Write the exact string on
     the worksheet. It must equal `GOOGLE_PLAY_PUBSUB_AUDIENCE` character for
     character in step 5.
5. If the console says Pub/Sub needs permission to create tokens for that
   service account and offers to grant it (a "Service Account Token Creator"
   grant to Google's own Pub/Sub service agent), accept that grant. It is
   what lets Google sign the push. `CHECK IN CONSOLE`
6. Leave acknowledgement deadline, retention, expiry, retry policy and
   dead-lettering at their defaults. The record does not specify them. Note
   the defaults on FV-666.
7. Until step 5 is done and deployed, the server refuses every push with 403
   ("not configured"). That is expected and harmless at this point. Pub/Sub
   retries and then drops the messages.

### 3f. Play Console access for the Play API identity

1. In Play Console, open the users and permissions area for the developer
   account and invite a new user. The "email" is the **Play API identity**
   service account address from 3c. `CHECK IN CONSOLE`
2. Restrict it to the From Victory app only (app-level permissions, not
   account-level), if the console offers that choice. `CHECK IN CONSOLE`
3. Grant exactly one permission: **"Manage orders and subscriptions"**
   (record 7.6, v4 note). The label may be worded slightly differently.
   `CHECK IN CONSOLE`
4. Do **not** grant "View financial data" (record 7.6, product-strategist
   condition). Do not grant release, store listing, or admin rights.
5. **TO DECIDE (G7 / record 7.6):** the record could not confirm which
   permission each server method needs (record 7.3, risk 7). The server calls
   three methods (`apps/web/lib/subscriptions/google-play-api.ts`): read a
   subscription, acknowledge it, and cancel renewal. If testing in FV-668
   shows the read failing with a permission error, adding "View financial
   data" is a wider permission and needs your decision then. Do not add it in
   advance.
6. The push identity gets no Play Console access. Do not invite it.
7. New Play Console permissions for a service account can take time to start
   working. A failure in the first hours is not proof the setup is wrong.
   `CHECK IN CONSOLE`

### 3g. Real-time developer notifications in Play Console

1. In Play Console, open the app, then the monetization setup page (record
   Section 8 calls it "Monetization setup"). Find the real-time developer
   notifications section. `CHECK IN CONSOLE`
2. Enable notifications and paste the full topic name from the worksheet.
3. If the console asks which notifications to send, choose subscriptions and
   voided purchases (the server learns of refunds from voided-purchase
   notices, record 7.3). If there is no such choice, leave the default and
   note it. `CHECK IN CONSOLE`
4. Save. Do not press "send test notification" yet. That is part of the
   check in step 6, after Vercel is configured.

**Check for step 3 (before Vercel):**
- Cloud console shows the project, both APIs enabled, one topic, one push
  subscription with authentication on, and two service accounts.
- The topic's permissions list Google's notification sender as Publisher and
  nothing unexpected.
- The Play API identity has at most one key (zero if keyless). The push
  identity has zero keys.
- Play Console lists the Play API identity as a user with one permission on
  one app.

**Undo for step 3:** everything here can be removed. Delete the push
subscription, the topic, and any key; remove the service account from Play
Console users; clear the topic name from the notifications setting; delete
the service accounts; shut down the project. A deleted key cannot be
recovered, which is the point. A project ID is not reusable after the project
is shut down.

---

## Step 4. Play Console: subscriptions, base plans, trial offer, license testers

**Stop if G1 is not on FV-666.** See the warning in step 1.

Creating products opens the third lock in record 6.1 ("Play Console: no
products exist"). That is intended, so testers can buy. Families still cannot
see a purchase: the build switch and the server flag stay closed.

**If the console refuses to create a subscription until a build with the
billing permission has been uploaded:** stop and report it on FV-666. Do not
upload a billing build to get past it. `docs/android-play-release.md`
("Locked facts") says no `FV_PLAY_BILLING=1` build is uploaded before the
FV-669 release package is approved, while record 10.3 (M5) has KC upload an
internal-track build for FV-668. That ordering needs your call before any
upload. `CHECK IN CONSOLE`

### 4a. Create the five subscriptions

Do `family.1` completely first (4a to 4c), check it, then repeat for the
other four.

1. Open the app's subscriptions page and start a new subscription.
   `CHECK IN CONSOLE`
2. Product ID: type it from the step 1 table. Read it back character by
   character before you save. Lowercase, with a dot: `family.1`.
3. Name: from the step 1 table, with or without the prefix you decided.
4. Save. From this moment the ID is permanent.

### 4b. Base plans

For each subscription, add two base plans. `CHECK IN CONSOLE`

1. Base plan ID: `monthly` or `yearly`, exactly, lowercase.
2. Type: auto-renewing.
3. Billing period: 1 month for `monthly`, 1 year for `yearly`.
4. Price: type the US price from the step 1 table. Google accepts any US
   price from $0.05 to $999.99 (record 5.2), so $106.99, $135.99 and $164.99
   can be typed exactly. Countries and non-US prices: as you decided in
   step 1, item 3.
5. **Grace period (G4):** choose the option closest to 16 days without going
   over 16. The record expects that to be 14 days but could not confirm the
   list. Write the full list of options and your choice on the worksheet.
6. **Account hold (G4):** leave at Google's default. Write the default on the
   worksheet. The record notes an unresolved point here (risk 7): one Google
   page says hold can be disabled, another says grace plus hold must total
   30 to 60 days. If the console forces a choice that conflicts with "default
   hold, grace of 14", stop and note what it offered.
7. **Resubscribe: off** on every base plan (record 5.2, 7.2). This is the
   setting that lets a lapsed subscriber buy again from Google Play's own
   screens. It must be off on all ten. `CHECK IN CONSOLE`
8. **Pause: off** (record 5.2, G4). It may be a per-base-plan or a
   per-subscription setting. Turn it off wherever it appears.
   `CHECK IN CONSOLE`
9. Anything else on the base plan screen (for example a tag, a
   backwards-compatibility option, or a price-change setting): leave the
   default and note it.
10. Activate the base plan when the console asks. A draft base plan cannot be
    bought by a tester.

### 4c. Trial offer (on `family.1` only)

Add one offer to each of the two `family.1` base plans. Do not add any offer
to `family.2` through `family.5`. `CHECK IN CONSOLE`

1. Offer ID: `trial-7d`, on both base plans.
   - If the console will not accept the same offer ID on the second base
     plan, stop and report it. Do not invent a second ID. The code has one
     trial offer ID for both
     (`google-product-catalog.ts`, `TRIAL_OFFER_ID`).
2. Eligibility: new customer acquisition, with the option that means **the
   Google account has never had any subscription in this app** (record 5.2).
   Not "never had this subscription": that would give a second trial to
   someone who held a different tier.
3. Phases: one phase, free trial, 7 days. Not 14. No second discounted phase.
4. Countries: as decided in step 1, item 3.
5. Activate the offer.

### 4d. Promo codes

Create none (record 5.2, 7.2). Do not open a promo code campaign for this
app. If any already exist for subscriptions, note it on FV-666.

### 4e. License testers

License testers are Google accounts whose purchases are test purchases: no
real charge, and fast renewals (monthly renews in 5 minutes, yearly in 30,
the trial lasts 3 minutes; record Section 8).

1. Decide which Google accounts will test. Use accounts you control. The
   developer account owner's own Google account usually cannot make a normal
   test purchase of its own app, so add a different account.
   `CHECK IN CONSOLE`
2. In Play Console, find the license testing setting. It is a developer
   account setting, not an app setting. `CHECK IN CONSOLE`
3. Add the tester email addresses and save. If there is a "license response"
   choice, leave the default and note it.
4. The same Google accounts must also be testers on the app's internal
   testing track to install the build later
   (`docs/android-play-release.md` section 5).
5. This list is only Google's half. The server grants access from a test
   purchase only to payers on its own allowlist, the `google_license_testers`
   table, which is empty by default (record 7.4;
   `supabase/migrations/20261111120000_google_play_provider_access.sql`).
   Adding rows there is not part of this runbook. See "Not covered".

**Check for step 4:**
- The subscriptions page lists exactly five products with the IDs
  `family.1` to `family.5`.
- Each has exactly two base plans, `monthly` and `yearly`, both active, with
  the prices in the step 1 table.
- Only `family.1` has offers: one `trial-7d` on each base plan, free for 7
  days, eligibility "never had any subscription".
- Open three base plans at random and confirm resubscribe is off, pause is
  off, and the grace period matches the worksheet. Then check the other
  seven.
- No promo codes exist.
- The license testing list shows the tester accounts.

**Undo for step 4:**
- **Product IDs cannot be undone.** A subscription can be deactivated or
  deleted, but its ID stays used forever. A wrong ID means a new ID and a
  code change in `google-product-catalog.ts`.
- Base plan and offer IDs: treat as permanent too. A base plan or offer can
  be deactivated, and the record does not confirm whether its ID can be
  reused. `CHECK IN CONSOLE`
- Reversible at any time: names, prices (no live subscribers exist yet),
  grace, hold, pause and resubscribe settings, deactivating a base plan or an
  offer, and the license tester list.

---

## Step 5. Vercel environment variables

Set these on the From Victory web project, **Production** environment only.
The push endpoint is the production host. Names come from
`apps/web/.env.example` (lines 192 to 221). Mark each one as sensitive if
Vercel offers that. Never put them in a `NEXT_PUBLIC_` variable.

| Variable name | Set it? | Where the value comes from |
|---|---|---|
| `GOOGLE_PLAY_PUBSUB_AUDIENCE` | Yes | The audience string you typed on the push subscription in step 3e (worksheet). Must match exactly. |
| `GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT` | Yes | The email of the push identity service account from step 3c (worksheet). |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Yes, if G7 = key file | The whole contents of the key file downloaded in step 3c, pasted as is. If G7 = keyless, leave it unset and wait for the code change. |
| `GOOGLE_PLAY_CATALOG_ACTIVE` | **No. Leave it unset.** | Nothing. See below. |

1. Add the variables in Vercel's project settings. `CHECK IN CONSOLE`
   (Vercel's screens change too.)
2. **Leave `GOOGLE_PLAY_CATALOG_ACTIVE` unset.** Do not set it to `0`,
   `false`, or anything else "to be safe". Only the exact string `1` turns
   the Play server paths on (`google-product-catalog.ts`,
   `isGooglePlayCatalogActive`), and it is set only when the activation
   runbook (FV-669) says so.
3. Redeploy production. A changed variable does not reach the running site
   until the next deployment.
4. If you used a key file: delete the downloaded file now.

What you should expect after this step: the webhook authenticates each push
and answers 200, and does nothing else. While the flag is unset it does not
read the message, call Google, or write to the database (`route.ts`,
"DORMANT").

**Check:** Vercel shows three variables (two if keyless) for Production and
no `GOOGLE_PLAY_CATALOG_ACTIVE`. The newest production deployment is later
than the last variable edit.
**Undo:** delete the variables and redeploy. With the two Pub/Sub variables
gone, every push is refused with 403 again. If a key was ever pasted
somewhere it should not be, delete that key in Cloud console (step 3 undo)
and create a new one.

---

## Step 6. Verification without code

Run these after step 5 has deployed.

### 6a. The endpoint is where the push expects it

1. Open `https://www.fromvictoryapp.com/api/webhooks/google-play` in a
   browser.
2. Correct: the address bar stays on the `www` host and the page is a bare
   "method not allowed" error (HTTP 405). The route accepts POST only.
3. Wrong: a 404 (route not deployed), a redirect to another host, or the
   sign-in page.

### 6b. A test notification is delivered and accepted

1. In Play Console, on the notifications setting from step 3g, press the
   button that sends a test notification. `CHECK IN CONSOLE`
2. In Cloud console, open the push subscription and look at its metrics for
   the last few minutes. `CHECK IN CONSOLE`
   - Correct: one message delivered, a success (2xx) push response, and the
     count of unacknowledged messages back at zero.
   - Wrong: push responses of 401, 403 or 503, or an unacknowledged count
     that stays above zero.
3. In Vercel, open the production logs and filter for
   `google-play/webhook`.
   - Correct: no line at all for the test. An accepted push logs nothing
     while dormant.
   - Wrong: a line `push rejected (<reason>)`. Use the table.

| Reason in the log | Response | What it means | Fix |
|---|---|---|---|
| `not_configured` | 403 | One or both Pub/Sub variables are missing in the running deployment | Step 5, then redeploy |
| `missing_token` | 401 | The push carries no token | Authentication is off on the subscription (step 3e, line 4) |
| `invalid_token` | 401 | Signature or audience did not verify | The audience in Vercel does not equal the audience on the subscription |
| `wrong_identity` | 403 | The token is from a different service account | The email in Vercel is not the push identity on the subscription |
| `email_unverified` | 403 | Google did not mark the account email verified | Recreate the push identity; report it |
| `wrong_issuer` | 401 | Token not issued by Google | Report it; do not change settings |
| `push verifier unavailable` | 503 | The server could not fetch Google's certificates | Wait and resend; if it repeats, report it |

Reason codes are from `apps/web/lib/subscriptions/google-play-auth.ts`
(`PushAuthFailure`).

What this proves: Google Play can publish to the topic, Pub/Sub can sign and
deliver, and the server accepts the signature, audience and sender. It proves
nothing about purchases.

### 6c. The Play API credential

There is no way to prove this without code. What you can confirm by eye:
Play Console lists the Play API identity with "Manage orders and
subscriptions" on the From Victory app, and Cloud console shows the Android
Publisher API enabled in the same project the service account belongs to.
The real proof is the first verified test purchase in FV-668.

### 6d. Products

Use the step 4 check list. Reading prices on a device needs a billing build
and is part of FV-668.

### 6e. Record it

Put on FV-666: the completed worksheet, every `TO DECIDE` answer, every
default you noted, and anything where the console did not match this
runbook.

---

## What this runbook does NOT cover

| Not covered | Where it lives |
|---|---|
| Privacy policy and terms text naming Google Play as a payment processor; attorney review | FV-667 (C9). An activation blocker (record Section 8). |
| Data safety form, content rating answer for digital purchases, target audience and Families declaration | FV-667 (C9), with kids-privacy-officer (record 8.1) |
| Reviewer access to the purchase flow: a second reviewer account with no comp grant (G8). `apps/web/scripts/provision-play-review-account.ts` creates only the existing comped reviewer account, which never sees a purchase screen. | FV-667 (C9) |
| Adding payers to the server's test-purchase allowlist (`google_license_testers`), and clearing it before activation | FV-668 (C10) for testing, FV-669 (C11) for the pre-activation review (record 7.4) |
| Building and uploading an internal-track build with the billing switch on (`FV_PLAY_BILLING=1`) | Build switch: FV-664 (C6). Upload for testing: FV-668 (C10), KC's action. |
| Device QA on license testers: purchase, trial, upgrade, downgrade, hold, refund, restore, proof that resubscribe is unavailable | FV-668 (C10) |
| Setting `GOOGLE_PLAY_CATALOG_ACTIVE`, the rollback test, the release package, public release | FV-669 (C11), then KC's release decision |
| Scheduling the notification stall check. `apps/web/lib/subscriptions/google-play-health.ts` is written but not wired to any schedule; its header says to wire it at activation. | No issue named in the record. Raise it with FV-669. |
| Purchase screen, manage and delete-account wording | FV-665 (C7), KC approves the copy |
| Trial length stale copy (14 versus 7 days) | FV-609 |
| Yearly check of Google's billing library deprecation table (G6) | Created at activation, not before (record 10.4) |
| Sign in with Google | FV-569, a separate stream (record 6.2) |

## Open decisions collected

| Id | Question | Needed before |
|---|---|---|
| G1 | Approve the product, base plan and offer IDs | Step 4 |
| Names | "From Victory" prefix on product names | Step 4a |
| G2 (scope) | Countries sold in, and non-US prices | Step 4b |
| Not in record | Any subscription description or benefits text | Step 4a |
| G4 | The actual grace period option (expected 14 days); what the console shows for account hold | Step 4b |
| G6 | Confirm KC owns Play Console and Google Cloud | Step 3a |
| G7 | Key file or keyless federation | Step 3c, step 5 |
| G7 | One service account or two | Step 3c |
| G7 / 7.6 | Whether any method needs "View financial data" | Only if FV-668 testing shows a permission error |
| Not in record | Attaching a Cloud billing account, if Google requires one | Step 3a |
| Not in record | Upload order if the console demands a billing build before products can be created | Step 4 |
