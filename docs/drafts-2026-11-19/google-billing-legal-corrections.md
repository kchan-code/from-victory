# Corrections to PR #684 (Google Play billing legal draft) (DRAFT for KC)

Summary line 1: PR #684 (`chore/fv-667-google-play-legal-draft`, open, DO NOT MERGE) adds Google Play text to `/privacy` and `/terms`. It does not touch `/delete-account`, it understates what the deletion alert email contains, and it sets no retention or access rule for that email.
Summary line 2: This draft gives exact before/after text for each gap, and says how each passage must read while Google billing is OFF versus after it is turned on.
Summary line 3: Four more inaccuracies found while reading the code are listed at the end (refund routing, "receive and store only", the on-screen-only notice, the billing library).

Status: draft, nothing published. Not attorney-approved.

## OPEN CHOICES KC must decide

1. **Alert email retention.** Option A: delete from the alert mailbox within 30 days of receipt. Option B: within 90 days. Either way, access limited to the owner. Neither is true until someone actually does the deleting (see section 3).
2. **Publishing before activation.** Option A: publish no Google text until `GOOGLE_PLAY_CATALOG_ACTIVE` is turned on, then publish everything in one step (the plan in #684). Option B: publish conditional wording now that is true in both states.
3. **Google refund wording in Terms 15.** Option A: keep "handled by Google under its own policies". Option B: neutral wording that does not say who decides. See section 5a. The routing itself is unverified.
4. **Order number in the alert.** Option A: keep it and disclose it (this draft). Option B: remove the order number from the alert so the alert carries no purchase identifier, and simplify the policy text. Option B is a code change, not a wording change.

## 1. What the code does (verified on origin/main)

`apps/web/lib/actions/account.ts`, step 1e, inside `deleteAccount`:

- Reads the account's Google rows. If that read fails: sends alert "Google Play cancel skipped" and sets the "unknown" notice.
- Otherwise, for each row that may still bill, calls Google's cancel up to 2 times. If both fail, it asks Google for the live purchase and builds one line per subscription.
- If any cancel failed: sends alert "Google Play cancel failed" and sets the "failed" notice.
- Deletion always continues. The user is redirected to `/signin?account_deleted=1&google_play_cancel=1` (or `google_play_cancel_unknown=1`) where `GooglePlayDeleteNotice` shows the message with an "Open Google Play" button.

Exact contents of the "cancel failed" alert email (`notifyError` in `apps/web/lib/monitoring/notify.ts`):

| Field | Value |
|---|---|
| Subject | `[FV Alert] [account.deleteAccount] Google Play cancel failed` |
| Message | Fixed sentence, then `targets=` with one entry per subscription |
| Per subscription | Android package name, product id (the plan), `order_id` = Google's latest order number for the subscription, or `unknown` if Google could not be read, `status` as stored by us, `expires` as stored by us or `null`, `token_tag` |
| `token_tag` | First 12 hex characters of an unkeyed SHA-256 of the last 8 characters of the purchase token |
| Env | Deployment environment name |

It does not contain: name, email address, From Victory account id, athlete data, or the full purchase token. No `context` argument is passed.

Exact contents of the "cancel skipped" alert: subject plus one fixed sentence. No order number, no plan, no account id.

Delivery: by email, through the email provider, to the address in `ALERT_EMAIL_TO`. Nothing is written to the database. A fixed log line with no identifiers is also written when either notice is required.

Why this matters: after the account is deleted, this email is the one place a purchase identifier tied to that person still sits. With the order number, the owner (or Google) can find the buyer in Play Console. Section 8 says we keep only a "content-free record" of a deletion. The alert is an exception to that and has to be stated as one.

## 2. Privacy Policy Section 8: alert description

### Before (PR #684)

> If you subscribed in our Android app, deleting your account deletes the Google Play purchase information we hold for it, and we ask Google to stop any Google Play subscription we have on record for the account from renewing. This does **not** refund a payment already made. If we cannot confirm that Google stopped the renewal, we tell you when the deletion finishes; in that case, cancel the subscription in the Subscriptions section of Google Play, or Google will continue to bill you. When that happens, we also receive an internal alert so we can follow up, which can include the Google order number, the plan, and the subscription's status and end date. Google keeps its own records of your purchases under its own policies.

### After (to publish at activation)

> If you subscribed in our Android app, deleting your account deletes the Google Play purchase information we hold for it, and we ask Google to stop any Google Play subscription we have on record for the account from renewing. This does **not** refund a payment already made.
>
> If we cannot confirm that Google stopped the renewal, a message on the screen tells you so when the deletion finishes. In that case, cancel the subscription in the Subscriptions section of Google Play, or Google will continue to bill you.
>
> When that happens we also send ourselves an alert by email, through our email provider, so that we can follow up. If Google refused or did not answer the request, the alert contains, for each subscription: the name of our Android app, the plan, the Google order number of the most recent payment if we could read it, the subscription's status and end date as we last recorded them, and a short one-way code made from part of the Google purchase token. It does not contain your name, your email address, or your From Victory account identifier. Because it contains a Google order number, it is the one record connected to your purchase that remains with us after your account is deleted. If instead we could not read our own records of your purchase, the alert says only that, and contains none of those details.
>
> **[OPEN CHOICE 1]** Only the owner of From Victory can read these alerts, and we delete each one within **[30 / 90]** days of receiving it. Our email provider may keep its own delivery records under its own policies.
>
> Google keeps its own records of your purchases under its own policies.

Do not publish the **[OPEN CHOICE 1]** paragraph until section 3 below is in place.

### If KC picks OPEN CHOICE 4, Option B (order number removed from the alert)

Replace the third paragraph with:

> When that happens we also send ourselves an alert by email, through our email provider, so that we can follow up. It contains the name of our Android app, the plan, the subscription's status and end date as we last recorded them, and a short one-way code made from part of the Google purchase token. It does not contain your name, your email address, your From Victory account identifier, or a Google order number.

Open point for that option: without the order number the owner may not be able to find the subscription in Play Console to cancel it by hand. That trade-off is KC's.

## 3. Retention and access for the alert email (OPEN CHOICE 1)

Nothing in the repo sets a retention period or an access rule for the alert mailbox. Proposed rule, for KC to accept or change:

- **Access:** the owner only. No shared inbox, no forwarding rule, no copy to a ticketing tool.
- **Retention:** Option A, delete within 30 days of receipt. Option B, delete within 90 days of receipt.
  - 30 days matches the deletion commitment in Section 8 and keeps the residual identifier short-lived.
  - 90 days leaves room if a Google charge after deletion is disputed later.
- **Use:** only to cancel the Google subscription by hand or answer the former account holder. Not copied into any table, log, or note.
- **How it is carried out:** a mailbox rule or a dated manual sweep. This does not exist yet. The policy sentence is only true once it does.

Could not verify: how long the email provider keeps sent-message content or logs for this alert, and whether the alert mailbox is the owner's alone today.

## 4. `/delete-account` page: Android / Google Play is missing

PR #684 changes `/privacy` and `/terms` only. `apps/web/app/delete-account/page.tsx` on `origin/main` has an iPhone note and no Android note. Play's Data safety form links to this page, so it has to cover Android.

### 4a. New subsection under Option B

Before (live): the last subsection of Option B is "If you subscribed in the iPhone app". Nothing follows it.

After, **while Google billing is OFF** (true today, can publish now):

> **If you use the Android app**
>
> The Android app does not sell subscriptions. If you subscribed on our website and use the Android app, deleting your account cancels that website subscription as described above.

After, **once Google billing is ON** (publish in the same step as activation; replaces the paragraph above):

> **If you subscribed in the Android app**
>
> A subscription bought in the Android app is billed by Google through your Google Play account. When you delete your From Victory account, we ask Google to stop that subscription from renewing. This does not refund a payment already made. If we cannot confirm that Google stopped the renewal, a message on the screen tells you so when the deletion finishes. If you see that message, open Google Play, go to Subscriptions, and cancel From Victory there, or Google will continue to bill you. A Google Play subscription cannot be automatically re-attached to a new From Victory account.

Could not verify the last sentence ("cannot be automatically re-attached") against the Google code path. It mirrors the Apple note and the `ownership_conflict` behavior described in PR #681. Confirm or drop it.

### 4b. "What happens" lines in Option B

Before (live, both the parent and the adult athlete paragraph):

> your subscription, if you bought it on our website, is canceled

After, once Google billing is ON:

> your subscription, if you bought it on our website, is canceled; if you bought it in the Android app, we ask Google to stop it from renewing

No change while OFF.

### 4c. "Deleted immediately" list

Add one item, once Google billing is ON:

> The Google Play purchase information we hold for a subscription bought in the Android app: the purchase token, the plan, and the subscription status and dates

Grounding: `docs/fv651-android-play-billing-decision-record.md` section 7 says the Google tables cascade when the profile is deleted and purchase tokens are removed with the row. I did not re-run a cascade test.

### 4d. "What we keep, and for how long"

Add one paragraph, once Google billing is ON:

> If you subscribed in the Android app and we could not confirm that Google stopped the renewal, we keep the alert email described in Section 8 of our Privacy Policy, which can include a Google order number, for up to **[30 / 90]** days. Google keeps its own records of your purchases under its own policies.

### 4e. `/help` page (same gap, outside #684)

`apps/web/app/help/page.tsx` says under "Delete an account or an athlete": "A subscription bought on our website is cancelled when you delete your account. An App Store subscription is not. Cancel it with Apple." and under "How do I cancel?" lists the website and the App Store only. Both are true while OFF. Once ON, add:

> **Google Play.** Google manages it. On your Android phone, open Google Play, tap your profile picture, then Payments and subscriptions, then Subscriptions.

and

> A Google Play subscription: we ask Google to stop it from renewing when you delete your account. If the app tells you this could not be confirmed, cancel it in Google Play.

Could not verify the exact Google Play menu names. Check on a device before publishing.

## 5. Before activation vs after activation (OPEN CHOICE 2)

Fact: on `origin/main` the Android app sells nothing, and every Google billing action refuses unless `GOOGLE_PLAY_CATALOG_ACTIVE` is exactly `1`. I could not verify the production value of that flag.

Every sentence in #684 that begins "Subscriptions bought in our Android app are sold and billed by Google" is false while the flag is off.

**Option A (the #684 plan): publish nothing early.**

- While OFF: `/privacy` 1e, 7, 8 and `/terms` 15 stay exactly as they are on `origin/main`. Only the 4a "while OFF" paragraph may go live.
- At activation: publish #684 with the corrections in this file, the `/delete-account` and `/help` changes, and the Data safety update, in one reviewed step with a new effective date.
- Risk: the text and the flag are flipped by different actions. If they drift, the policy is wrong in one direction or the other.

**Option B: publish conditional wording now.**

Replace the opening of each Google paragraph so it is true in both states:

- Privacy 1e, before (#684): "**In the Android app.** Subscriptions bought in our Android app are sold and billed by Google through your Google Play account, as an in-app purchase."
- Privacy 1e, after: "**In the Android app.** Where the Android app offers a subscription for purchase, it is sold and billed by Google through your Google Play account, as an in-app purchase. Where it does not, you subscribe on our website and the paragraph above applies."
- Privacy 7, before (#684): "Google, if you subscribe in our Android app: Google processes the purchase and tells us the status of the subscription, and we confirm the subscription with Google"
- Privacy 7, after: no change needed. "if you subscribe in our Android app" is already conditional.
- Privacy 8, before (#684): "If you subscribed in our Android app, deleting your account deletes..."
- Privacy 8, after: no change needed for the same reason.
- Terms 15, before (#684): "**Subscriptions bought in our Android app** are sold and billed by Google through your Google Play account, and Google's terms apply to the purchase."
- Terms 15, after: "**Subscriptions bought in our Android app**, where the app offers them, are sold and billed by Google through your Google Play account, and Google's terms apply to the purchase."
- Risk: users read about a purchase path they cannot use yet. The retention sentence (section 3) still cannot be published until the process exists.

## 5a. Other inaccuracies in #684 found while checking

1. **Terms 15 refund sentence (OPEN CHOICE 3).** #684: "Refund requests for Google Play purchases are handled by Google under its own policies." Whether refunds always go to Google is unverified. `docs/fv651-android-play-billing-decision-record.md` says "Refunds: Google issues them" and also notes a developer-side revoke-with-refund call exists.
   - Option A: keep the sentence as written, after KC verifies it.
   - Option B: "Google's refund policies apply to purchases made through Google Play. You can ask Google for a refund through your Google Play account."
2. **Privacy 1e "receive, and store, only".** #684: "From Google we receive, and store, only what is needed to recognize and manage the subscription". Google's answer to us contains more than we store. One example is the order number, which the code reads at deletion time and never stores.
   - After: "From Google we store only what is needed to recognize and manage the subscription: ... Google's answers to us can contain more than we keep, for example an order number. We do not store an order number in our database."
3. **Privacy 1e field list.** The list matches the `google_subscriptions` columns I read (`purchase_token`, `linked_purchase_token`, `product_id`, `base_plan_id`, `offer_id`, `status`, `expires_at`, `auto_renewing`, `acknowledged`, `is_test_purchase`, `obfuscated_account_id`) except that it omits `last_verified_at`. Suggested addition after "whether Google marked it as a test purchase": ", and when we last confirmed the subscription with Google".
4. **"we tell you when the deletion finishes".** The only notice is on-screen, on the sign-in page after the redirect. No email goes to the user (the account and its email are gone). If the app is closed before the page loads, the user never sees it. The "After" text in section 2 says "a message on the screen tells you" for that reason. Same change for Terms 15:
   - Before (#684): "If we cannot confirm that the renewal was stopped, we tell you when the deletion finishes, and you must cancel the subscription in Google Play, or Google will continue to bill you."
   - After: "If we cannot confirm that the renewal was stopped, a message on the screen tells you so when the deletion finishes, and you must cancel the subscription in Google Play, or Google will continue to bill you."
5. **Privacy Section 6 and the billing build.** Section 6 says we "do not embed third-party advertising or tracking SDKs on any signed-in surface". `apps/native/capacitor.config.ts` says an Android build with `FV_PLAY_BILLING=1` carries Google's Play Billing Library and Google components that come with it (a telemetry transport, Play services base, tasks and location, firebase-encoders), and warns not to describe that build as free of third-party or telemetry code. #684 does not touch Section 6. Proposed addition at activation, after that sentence:

   > The Android app includes Google's billing software so that Google can process purchases. That software is Google's, and it can send Google technical information about the purchase and the device under Google's own privacy policy.

   Could not verify what those components actually send. Do not publish this sentence until that is checked.

## Could not verify

- Production value of `GOOGLE_PLAY_CATALOG_ACTIVE`.
- Email provider retention of alert content.
- Who can read the `ALERT_EMAIL_TO` mailbox today.
- Whether Google or the developer handles a given refund.
- What Google's billing library transmits.
- Google Play menu names in 4e.
