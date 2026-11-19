# Support Runbook (FV-767)

**Owner:** KC (sole support person at launch). **Written:** 2026-11-19 against `main` at `04baca3e`.

Support address: `support@fromvictoryapp.com`. **This mailbox does not exist yet.** Until it does, mail arrives at `privacy@fromvictoryapp.com` (the address printed on `/terms`, `/privacy`, `/delete-account`) and through the `/contact` form, which emails `CONTACT_NOTIFICATION_TO` (`apps/web/lib/email/contact-notification.ts`). The contact form does not store messages anywhere; if the email send fails the message is lost (`apps/web/lib/actions/contact.ts`).

Anything marked `UNVERIFIED` could not be confirmed from the code or docs in this repo. Check it before relying on it.

## Ground rules

- **Support is for adults only**: parents and athletes 18 or older who own their account. Never ask a 13-17 athlete to write in, and do not carry on a support thread with one. A minor athlete's problem is handled through the parent. In-app copy already says this ("Ask your parent for a reset code", `/athlete/paused`).
- Parent-facing wording is "your athlete". Never "kid".
- **Verify the sender before changing anything.** The request should come from the email on the account. If it comes from another address, ask them to write from the account email or confirm details only the account holder has (athlete first name, signup month). Never send a password. Never ask for one.
- Never ask a parent to send card numbers or full receipts by email. An Apple or Google receipt screenshot is used only to confirm ownership and is not copied into any table or log (`docs/fv210-ios-iap-decision-record.md` section 4.7).
- From Victory is not a mental health service. If a message describes a safety concern, do not treat it as a support ticket. `UNVERIFIED`: no written procedure for this exists in the repo (see Known gaps).
- Do not promise a reply time or a refund. Both are undecided: `TODO(FV-768)`.

## Where to look

| Tool | What it tells you |
|---|---|
| **Supabase** (project ref in `reference` notes; use the dashboard or CLI `--linked`) | Authentication > Users: find the account by email, copy the user id. Tables keyed on that id: `profiles` (role: `parent`, `adult_athlete`, `athlete`), `subscriptions` (Stripe mirror, key `parent_id`), `apple_subscriptions` (key `payer_id`), `google_subscriptions` (key `payer_id`), `access_grants` (comp, key `parent_id`), `stripe_customers`, `parent_athlete_links`, `account_deletion_events`. |
| **Stripe Dashboard** (Live mode) | Customers, Subscriptions, Payments, Disputes, Developers > Webhooks > endpoint > event deliveries. |
| **App Store Connect** | Aggregate sales and subscription reports. `UNVERIFIED`: I found nothing in the repo showing a per-customer lookup in App Store Connect; assume you cannot look up one family there. |
| **Play Console** | Order management (per-order lookup, refund, cancel). `UNVERIFIED`: general Play Console behavior, not documented in this repo. |
| **`/dashboard/admin/grants`** | Comp grants (see last section). Admin pages return 404 unless you are signed in as a parent whose email is in `ADMIN_EMAILS` (`apps/web/lib/auth/admin.ts`). |
| **`/dashboard/admin/metrics`**, **`/dashboard/admin/create-athlete`** | Owner metrics; create an athlete under your own admin parent. Neither can look up or edit another family's account. |
| **Vercel logs** | Server log lines quoted in this file, for example `[apple-subscription] rejected: ...`. |
| **Alert emails** (`ALERT_EMAIL_TO`) | `notifyError` alerts: Stripe refund, Stripe dispute, duplicate billing, webhook failures (`apps/web/lib/monitoring/notify.ts`). They carry ids only, never names or emails. |

How access is decided (`apps/web/lib/subscriptions/access.ts`): an active comp grant gives full access; otherwise the best of the Stripe, Apple, and Google rows. Enforcement only happens when Vercel env `ENFORCE_SUBSCRIPTION_GATING` is exactly `true` (`apps/web/lib/subscriptions/enforce.ts`). A blocked parent or adult athlete is sent to `/subscribe`; a blocked minor athlete sees `/athlete/paused`.

A daily job (04:30 UTC, `vercel.json`, `apps/web/app/api/cron/reconcile-subscriptions/route.ts`) re-reads Stripe and Apple and repairs rows that already exist. It does not create a missing Stripe row and does not cover Google Play.

---

## (a) Paid on the web, app still locked

**Recognise it.** Parent says they paid on the website but the app shows "Start training today." / "Choose a plan", or the Android app shows "Subscribe to From Victory from a web browser at fromvictoryapp.com.", or their athlete sees "Training paused".

**Check, in this order.**

1. **Wrong account.** This is the most common cause (`apps/web/app/subscribe/page.tsx`, FV-657). In Supabase find the account for the email they wrote from, then look for a `subscriptions` row with that `parent_id`. If there is none, ask what email is on their Stripe receipt and look that account up too.
2. **Stripe.** Find the customer by receipt email. Is there a subscription, and is it `trialing` or `active`? A checkout that was opened but never completed has a customer and no subscription.
3. **Webhook delivery.** Stripe > Developers > Webhooks > the production endpoint. Find `checkout.session.completed` for that customer. Anything other than `200` means our row was not written (`apps/web/app/api/webhooks/stripe/route.ts`: 500 is retried by Stripe, 400 is not).
4. **Our row.** `subscriptions.status` for the parent. `active` / `trialing` = full access. `past_due` = still works, with a fix-payment notice. `canceled` and other ended states = blocked. (`docs/stripe-go-live-runbook.md` Part D.)
5. **Athlete-only lock.** If the parent has access but the athlete is paused with the "fewer spots" wording, that is the Apple seat limit, not web billing: the parent picks who stays active on the dashboard (`apps/web/lib/subscriptions/enforce.ts`, seat overlay). If the screen says "We couldn't check your access", the status read failed: wait a minute, tap "Try again".
6. **A second subscription.** An alert `[stripe/webhook] subscription conflict` means a second checkout completed for a payer who already had a live tracked subscription. The second one is billing them and is not tracked (FV-711). Cancel and refund the duplicate in Stripe by hand (refund subject to `TODO(FV-768)`).

**Fix.**

- Wrong account: tell them to sign out and sign in with the account they paid with. Nothing to change on our side.
- Webhook failed: in Stripe, open the failed event and resend it. The handler is idempotent. Confirm the `subscriptions` row appears.
- Row exists but stale: the daily reconcile fixes it within a day; resending the latest `customer.subscription.updated` event fixes it now.
- If they are stuck and you cannot fix it quickly, give a short dated comp grant (see Comp grants) so their athlete can train while you sort it out, then revoke it.
- The app caches pages. After a fix ask them to close the app fully and reopen it.

**Reply template.**

> Hi [name],
>
> Thanks for writing. I can see your payment. The app is showing as locked because [you are signed in with a different account than the one you paid with / our system did not record the payment the first time].
>
> [Please tap Sign out, then sign in with EMAIL. / I have fixed it on our side. Please close the app fully and open it again.]
>
> Please do not subscribe a second time. Your athlete signs in with their own username, not your email.
>
> KC, From Victory

---

## (b) Apple charged, app shows an error: the Apple subscription belongs to another account

**What is happening.** An Apple subscription is tied to the first From Victory account it was bought under. If the same Apple ID's subscription is submitted from a different From Victory account, the server refuses with `ownership_conflict` and writes nothing (`apps/web/lib/actions/apple-subscription.ts`, step 5a). Restore Purchases cannot move it either. There is no automatic re-link, by design (`docs/fv210-ios-iap-decision-record.md` sections 4.3 and 4.7).

**Recognise it.** In the iPhone app, after Apple's purchase sheet, the parent sees "We couldn't complete that purchase. Please try again." Tapping Restore Purchases shows "We couldn't check for a previous purchase. Please try again." (`apps/web/components/subscribe/AppleSubscribeSection.tsx`). The app does not say why. The same generic text is shown for other failures, so confirm with the log.

**Check.**

1. Vercel logs: `[apple-subscription] rejected: original_transaction_id already linked to a different payer (payer=<id>). Restore cannot transfer ownership.` The id is the account that was refused. No alert email is sent for this case.
   - If the log instead says `appAccountToken mismatch`, the code is `token_mismatch`: the subscription was bought under an account that has since been deleted, or under a different account whose row is gone. Same handling as below.
2. Find the owning account. The log does not name it. Ask the parent which other emails they may have signed up with (a spouse's account is common), look each up in Supabase, and check `apple_subscriptions` for a `Production` row.
3. Ask the parent to forward Apple's receipt email so you can confirm the Apple purchase is theirs. Use it to verify only; do not store it.
4. Whether Apple took a second payment or this is one existing subscription: `UNVERIFIED`. Ask what their Apple purchase history shows. Tracked as FV-706 (`UNVERIFIED`: I did not read that issue).

**Fix. Try these in order.**

1. **Sign in to the account that owns the subscription.** No change on our side. This is the right answer whenever that account is theirs and they are happy to use it. If their athletes are on the other account, see step 3.
2. **They want a refund instead.** Only Apple can refund (see (d)).
3. **Move the Apple subscription to the account they want (manual re-link, KC only).** There is no script or tested procedure for this in the repo. `UNVERIFIED` sketch, derived from the schema (`supabase/migrations/20260911120000_apple_provider_access.sql`); have backend-engineer review before the first real use:
   - Verify ownership out of band (Apple receipt) and that the parent controls both accounts.
   - With the service role, repoint the `apple_subscriptions` row (`payer_id`) to the target account. `unique (payer_id, environment)` means the target must not already have a row for that environment.
   - Renewals then follow the row, because the Apple webhook matches on `(original_transaction_id, environment)` first (`apps/web/app/api/webhooks/apple/route.ts`).
   - Expect Restore Purchases on the target account to keep failing with `token_mismatch` afterwards, because Apple still sends the old account's token. Access is unaffected. Tell the parent not to use Restore.
   - The old account loses access.
4. **Do not tell them to delete the old account to "free" the subscription.** Deleting an account does not cancel an Apple subscription and it cannot be re-attached automatically (`/delete-account`, `apps/web/lib/subscriptions/apple-delete-notice.ts`).

While this is open, a short dated comp grant on the account they want to use keeps their athlete training.

**Reply template.**

> Hi [name],
>
> Thanks for letting me know, and sorry for the confusing error. Your Apple subscription is active. It is linked to a different From Victory account than the one you are signed in to, and the app cannot move it between accounts on its own.
>
> The quickest fix: in the app, tap Sign out, then sign in with the account you first subscribed with. Do you have another From Victory account, maybe under a different email?
>
> If you would rather keep using the account you are in now, reply and tell me, and please forward the receipt email Apple sent you so I can confirm the purchase. I will link it for you.
>
> Please do not tap Subscribe again in the meantime.
>
> KC, From Victory

---

## (c) Google Play purchase not unlocking

**Current state.** The Android app on Google Play does not sell subscriptions. It shows no price and no subscribe button (`docs/gtm/product-truths.md`, 2026-11-11 entry; `apps/web/app/dashboard/page.tsx`). The Play Billing server code exists but every action refuses unless `GOOGLE_PLAY_CATALOG_ACTIVE` is exactly `1` (`apps/web/lib/actions/google-play-subscription.ts`), and no screen calls it. `UNVERIFIED`: the production value of that env var; check Vercel.

**So today, "I paid on Android and it is locked" almost always means one of:**

- They paid on the website and are signed in to a different account in the Android app. Handle as (a).
- They have not paid. A parent with no subscription sees "Subscribe to From Victory from a web browser at fromvictoryapp.com." They subscribe at fromvictoryapp.com in a browser, then sign in to the app with the same account.
- They were charged by Google for the app itself: not possible from our side; ask for the Play receipt and check the order in Play Console.

**Reply template (today).**

> Hi [name],
>
> The Android app does not take payment. Subscriptions are bought at fromvictoryapp.com in a web browser, and then the app unlocks when you sign in with that same account.
>
> If you already subscribed on the website, tap Sign out at the top of the screen and sign in with the email you used there. If you have not subscribed yet, open fromvictoryapp.com in a browser, sign in, and choose a plan.
>
> KC, From Victory

**Once Play Billing is turned on (not yet).** Check `google_subscriptions` for the payer and the server result code in Vercel logs (`[google-play-subscription] ...`; tokens and payer ids are deliberately not logged):

| Code | Meaning | Action |
|---|---|---|
| `unavailable` | Server flag is off | Flag state, not a customer problem |
| `verification_unavailable` | Could not reach Google | Ask them to reopen the app later; the same purchase can be resubmitted |
| `verification_failed` | Google did not confirm the purchase | Check the order in Play Console |
| `ownership_conflict` | Purchase already linked to another From Victory account | Same idea as (b): sign in to the owning account. No automatic re-link |
| `account_mismatch` | Purchase not bound to this account (for example bought outside the app). Not acknowledged; alert `unbound purchase refused` | Google refunds an unacknowledged purchase after 3 days (code comment). Tell them to subscribe from inside the app while signed in |
| `unknown_product`, `test_purchase_rejected` | Catalog or tester mismatch | Config, not a customer problem |
| `acknowledge_failed` | Row written, acknowledge failed | Reopening the app resubmits and finishes it |

The daily reconcile job does not cover Google Play. Before go-live, Terms section 15 must be updated: it does not describe Google Play Billing (comment in `apps/web/app/terms/page.tsx`).

---

## (d) Refund requests

**Policy: `TODO(FV-768)`.** No refund policy has been decided. Do not promise a refund, a partial refund, or a time by which a refund request will be answered until FV-768 is resolved.

What the Terms currently say (section 15, `apps/web/app/terms/page.tsx`, approved by KC 2026-11-13, FV-723):

- "Unless otherwise stated at the time of purchase or required by law, fees are non-refundable."
- Website subscriptions: "You can cancel at any time from your account settings. Cancelling stops future renewals; access continues until the end of the period you have paid for."
- iOS: "We cannot cancel, change, or refund an Apple subscription for you." and "Refund requests for App Store purchases are handled by Apple under its own policies."
- Section 15 says nothing about Google Play.

**Who can refund where.**

| Bought through | Who can refund | What happens to access |
|---|---|---|
| **Website (Stripe)** | KC, in Stripe Dashboard > Payments > the charge > Refund | **Nothing changes automatically.** The webhook only emails an alert: "Stripe charge refunded. Manual subscription access review required." (`handleChargeRefunded`). If access should end, also cancel the subscription in Stripe; the `customer.subscription.deleted` event then updates our row. |
| **iPhone app (Apple)** | Apple only. The parent asks Apple (`UNVERIFIED`: Apple's report-a-problem site is general knowledge, not in this repo). KC cannot refund. | When Apple refunds, its `REFUND` / `REVOKE` notification sets the row to `revoked` and access ends at once. `REFUND_REVERSED` restores it (`apps/web/lib/subscriptions/apple-lifecycle.ts`). |
| **Google Play** | Not sold today. When live: `UNVERIFIED`, Play Console order management can refund; Google can also refund the buyer directly. | A voided-purchase notification removes access (`apps/web/lib/subscriptions/google-play-rtdn.ts`). |

A first web subscription with exactly one athlete starts with a 7-day trial and the card is charged on day 7 (`apps/web/lib/actions/subscription.ts`). "I was charged after the trial" is the most likely refund request. (`docs/stripe-go-live-runbook.md` still says 14 days; the code is 7.)

**Reply templates.**

Website purchase:

> Hi [name],
>
> Thanks for writing. I have your refund request for the charge on [date].
>
> TODO(FV-768): refund decision wording goes here once the policy is set.
>
> Separately, if you want to stop future charges, you can cancel any time at fromvictoryapp.com under Settings, Manage subscription.
>
> KC, From Victory

Apple purchase:

> Hi [name],
>
> Your subscription was bought through the App Store, so Apple holds the payment and only Apple can refund it. I am not able to refund or cancel it from our side. You can request a refund from Apple through your Apple Account purchase history.
>
> To stop future charges, open Settings on your iPhone, tap your name, then Subscriptions.
>
> KC, From Victory

---

## (e) Cancelling a subscription

| Bought through | How the customer cancels | How KC can cancel |
|---|---|---|
| **Website (Stripe)** | In a web browser (not inside the iPhone or Android app): sign in at fromvictoryapp.com. Parent: Dashboard > Settings > Subscription > "Manage subscription". Adult athlete: gear icon > Settings > "Manage subscription". This opens the Stripe billing portal (`apps/web/lib/actions/billing-portal.ts`). `UNVERIFIED`: that cancellation is enabled in the Stripe portal configuration; check Stripe > Settings > Billing > Customer portal. | Stripe Dashboard > the subscription > Cancel. Choose end of period unless they ask otherwise. Our row follows from the webhook. |
| **iPhone app (Apple)** | Settings on the iPhone > their name > Subscriptions. Or in the app: subscription screen > "Manage Subscription", which opens Apple's sheet. | KC cannot. Apple has no server-side cancel. |
| **Google Play** | Not sold today. When live: Google Play subscription settings (`docs/fv651-android-play-billing-decision-record.md`). | When live: the server can stop renewal (used on account deletion). |

Things to know:

- Inside the native apps the Stripe portal button is replaced by "Manage your From Victory subscription from a web browser at fromvictoryapp.com." That is deliberate.
- "No active subscription found." in Settings means there is no Stripe customer on that account: wrong account, or they pay through Apple.
- Cancelling stops renewal; access runs to the end of the paid period (Terms section 15).
- An alert "Duplicate billing detected" means one payer has both a live Stripe subscription and an Apple one. One must be cancelled: you can cancel Stripe; only they can cancel Apple.

**Reply template.**

> Hi [name],
>
> Here is how to cancel.
>
> [Website: open fromvictoryapp.com in a web browser, sign in, go to Settings, and choose Manage subscription.]
> [iPhone: open Settings on your iPhone, tap your name, then Subscriptions, and choose From Victory.]
>
> Cancelling stops future charges. Your athlete keeps access until the end of the period you have already paid for.
>
> KC, From Victory

---

## (f) Forgot password, athlete username sign-in problems

**How sign-in works.** `/signin` has two tabs. Parent: email and password. Athlete: a minor athlete uses a username and password; an athlete 18+ who owns their account types their email on either tab (`apps/web/lib/actions/pairings.ts`). Minor athletes have no email on file.

**Parent or adult athlete forgot their password.**

- Self-serve: "Forgot password?" on the Parent tab, or "Reset it here" on the Athlete tab, both go to `/forgot-password`. Signed-in users can also use Settings > Password > send a reset link.
- The form always says it worked, whether or not the email matches an account (anti-enumeration, `apps/web/lib/actions/auth.ts`). "I never got the email" usually means a different email than the one on the account, or spam. Limit: 8 reset requests per email per hour.
- "Your reset link expired": request a new one.
- Check: Supabase > Authentication > Users, search the email. If there is no user, they signed up with another address.
- KC should not set passwords for people. Send them to the reset page.

**Minor athlete forgot their password or username.** The parent fixes it, not us:

- Parent: Dashboard > the athlete > create a reset code. It works once and expires in 24 hours. The athlete opens it, sees their unchanged username, and picks a new password (`apps/web/components/dashboard/InvitePanel.tsx`, `apps/web/lib/actions/invites.ts`).
- The reset screen shows the username, so this also solves a forgotten username.
- An athlete who "trains on one device" and has no username yet: the parent's dashboard shows "Needs a username" / "Add username". That invite lets the athlete choose a username and new password, keeps training history, and expires in 7 days.

**Common errors.**

- "That username, email or password isn't right." Same message for every failure. Check for a typo; usernames are lowercase letters, numbers, underscore.
- "Too many tries. Give it a few minutes, then try again." Rate limit: 15 username attempts per 15 minutes, 20 email sign-ins per 15 minutes (`apps/web/lib/actions/rate-limit.ts`). It clears by itself. There is no admin unlock.
- The screen greets the wrong person ("Welcome back"): tap "Not [name]? Sign in as someone else".
- A parent typing their email on the Athlete tab works; an athlete typing a username on the Parent tab does not.

**Reply templates.**

Parent password:

> Hi [name],
>
> You can reset your password at fromvictoryapp.com/forgot-password. Enter the email you signed up with and we will send a reset link. If it does not arrive in a few minutes, check spam, and check whether you signed up with a different email address.
>
> KC, From Victory

Athlete sign-in:

> Hi [name],
>
> You can reset your athlete's sign-in yourself. Sign in to your parent account, open your Dashboard, choose your athlete, and create a reset code. Send it to your athlete's phone. It shows their username and lets them pick a new password. The code works once and expires in 24 hours.
>
> KC, From Victory

---

## (g) Parent wants to change their email

**There is no self-serve way to change an account email. This is a gap.** Settings shows the email as "Read only" (`apps/web/app/dashboard/settings/page.tsx`), and no server action updates it (the only `auth.updateUser` call sets a password, `apps/web/lib/actions/auth.ts`).

**Check.** Verify the request comes from the current account email. If they have lost access to that mailbox, ask for details only the account holder has before doing anything, and be cautious: an email change is an account takeover if you get it wrong.

**Fix (manual, `UNVERIFIED`).** No procedure exists in the repo. The likely path is Supabase > Authentication > Users > edit the user's email. Before doing it the first time, confirm with backend-engineer:

- that the new email is not already an account;
- whether the Stripe customer email (collected by Stripe Checkout, used for receipts) also needs changing in Stripe; the app does not sync it;
- whether Supabase sends a confirmation to the new address.

An athlete 18+ has the same gap. A minor athlete has no email.

**Reply template.**

> Hi [name],
>
> The app does not have a way to change your account email yourself yet, so I will do it for you. To confirm it is your account, please reply from the email currently on the account and tell me the new address you want to use.
>
> Your password, your subscription, and your athlete's training history will stay the same.
>
> KC, From Victory

---

## (h) Account or athlete deletion

**The commitment.** Privacy Policy section 8: when a deletion request is confirmed, account data is deleted "promptly", "well within 30 days of the request". CLAUDE.md: the parent controls deletion; cascading delete within 30 days. Self-serve deletion is immediate. A request that arrives by email starts the 30-day clock on the day it arrives, so note that date.

**Self-serve (send them here first).** Steps are on the public page `/delete-account`:

- Remove one athlete: parent Dashboard > "Your athletes" > "Remove" > type the athlete's first name > "Delete permanently". The parent account stays.
- Delete a parent account: Dashboard > "Delete account" at the bottom > type `DELETE`. Cancels a website subscription, deletes every athlete that parent solely manages (an athlete also linked to another parent is kept), deletes the Stripe customer record.
- Adult athlete: gear icon > Settings > "Delete account" > type `DELETE`.
- A minor athlete has no deletion control. The parent does it.

**What deletion does not do.** It does not cancel an Apple subscription. The parent must cancel with Apple (Settings > their name > Subscriptions) or Apple keeps billing. The delete screen warns about this. Tell them again in your reply.

**Errors the customer may quote** (`apps/web/lib/actions/account.ts`):

- "Could not cancel your subscription before deleting your account." Stripe cancel failed; nothing was deleted. Check the subscription in Stripe, cancel it by hand, ask them to retry.
- "Could not clear pending checkout sessions before deleting your account." Nothing was deleted, but the subscription may already be cancelled. Ask them to retry in a few minutes.
- "Too many deletion requests." Limit is 10 per hour per account.
- Alert `[account.deleteAccount] Stripe customer delete failed` (FV-761): the account is gone but the Stripe customer remains. Delete that customer in Stripe by hand.
- Alert `Google Play cancel failed` / `skipped`: not applicable until Play Billing is live.

**They cannot sign in, so KC must delete for them.** `/delete-account` promises this. There is no admin delete tool. `UNVERIFIED` manual procedure, mirroring `deleteAccount` in order; have backend-engineer confirm before first use:

1. Verify the requester owns the account (written from the account email, or account holder's first name plus account email as the page asks).
2. Stripe: cancel the subscription, expire any open Checkout Sessions for the customer, delete the customer.
3. Supabase: for each athlete in `parent_athlete_links` for this parent that has no other parent, delete the athlete's auth user. Then delete the parent's auth user. Deleting an auth user cascades to that user's rows.
4. Insert an `account_deletion_events` row (event only, no content) so the audit trail matches self-serve.
5. If they pay through Apple, tell them to cancel with Apple.
6. Reply confirming the date of deletion.

**What we keep.** A content-free record that a deletion happened and when. Stripe keeps invoices and payment records it must keep by law (`/delete-account`).

**Reply templates.**

Can sign in:

> Hi [name],
>
> You can delete [your account / your athlete's account] yourself and it takes effect right away. The steps are at fromvictoryapp.com/delete-account.
>
> [If Apple:] One thing to do first: your subscription was bought through the App Store, and deleting your account does not cancel it. Open Settings on your iPhone, tap your name, then Subscriptions, and cancel From Victory there, or Apple will keep billing you.
>
> KC, From Victory

Deleted by KC:

> Hi [name],
>
> I have deleted your From Victory account and your athlete's account and training data as of [date]. [Your website subscription was cancelled at the same time.]
>
> We keep only a record that a deletion happened and when. It has no names or other personal details.
>
> KC, From Victory

---

## (i) Athlete invitations and adding an athlete

**How it works.** The parent adds an athlete on the dashboard, then creates an invite: a link plus a 16-character backup code. The athlete opens the link, or opens the app, taps "I have an invite", and types the code. On Android the link does not open the app; use the code. (`apps/web/lib/actions/invites.ts`, `apps/web/components/dashboard/InvitePanel.tsx`, `docs/gtm/product-truths.md`.)

**Invite problems.**

- "This code can't be used. It may have expired, been replaced, or already been used. Ask your parent to create a new one." Invites last 7 days, reset codes 24 hours, each works once, and making a new one cancels the old one immediately. Fix: parent creates a new invite and sends it.
- Parent lost the code: it is shown once and cannot be shown again. Fix: "Make a new invite".
- "You can't invite this athlete.": the athlete is not linked to that parent account. Wrong parent account.
- "Too many attempts": 30 invite creations per parent per hour; 20 claims per hour. Clears by itself.
- Athlete set up fine but then sees "Training paused": that is billing, see (a).

**Adding an athlete problems** (`apps/web/lib/actions/athletes.ts`).

- In the Android app (and older iPhone builds) the dashboard says "Add athletes from a web browser at fromvictoryapp.com." Deliberate: adding an athlete can change billing. They add the athlete in a browser.
- Athletes must be 13 or older. There is no override.
- Adding an athlete to a website subscription raises the price (first athlete one rate, each additional athlete a lower rate).
- Adding a second athlete during the 7-day one-athlete trial needs the parent to confirm that the trial ends and the paid family plan starts now. If their card fails at that point the athlete is not created (`trial_conversion_payment_failed`).
- Apple subscribers are capped by the plan size they bought (`capacity_reached`). They change plan in the iPhone app's subscription screen.
- "Could not create the athlete account. Please try again.": server error. Check Vercel logs for `[athletes.` lines.

**Check.** Supabase: `parent_athlete_links` for the parent; the athlete's `profiles` row (`role = athlete`, `username`). The dashboard shows each athlete's state: invite pending, "Needs a username", or "Set up".

**Reply template.**

> Hi [name],
>
> Invite codes work once and expire after 7 days, and making a new one cancels the old one. Please sign in to your parent account, open your Dashboard, choose your athlete, and make a new invite. Send it to your athlete's phone before you leave the page, because the code is only shown once.
>
> On an iPhone your athlete can tap the link. On Android, they open From Victory, tap "I have an invite", and type the code.
>
> KC, From Victory

---

## (j) Offline Pregame audio not playing

Reports come from the parent or an adult athlete. Ask which device and app (iPhone app, Android app, website on a home screen) and what the screen said.

**How it is meant to work** (`apps/web/components/pregame/PregameClientShell.tsx`, `apps/web/components/pregame/audio-precache.ts`, `docs/gtm/product-truths.md`):

- The athlete must open Pregame once **online** on that device. Audio for their chosen setup is saved with "Download for offline"; the saved session then shows "Play saved offline session" / "Downloaded · ready offline".
- Offline use lasts until the end of the access period last confirmed online on that device (subscription period or trial end). Free access with no end date gets 30 days from the last online open.
- Only the athlete's chosen setup is downloaded, not the whole library.

**Causes, most likely first.**

1. **iPhone app.** The App Store version (1.0.1) cannot open Pregame with no signal. A fix is in a TestFlight build and is not released or fully confirmed (FV-753). Do not tell anyone offline Pregame works in the iPhone app. Workaround: open Pregame while there is signal.
2. **Screen says "Connect first".** No valid offline window on this device: never opened online here, the window ended, the athlete signed out or a different athlete signed in (both clear it), or the device clock was moved back. Fix: open Pregame once with a connection.
3. **Audio was never downloaded, or the download failed.** Fix: online, tap "Download for offline" and wait for "Ready offline".
4. **They changed their picks.** A different position or focus needs clips that were not downloaded. Fix: download again, or use "Play saved offline session".
5. **An audio update shipped.** A `MANIFEST_VERSION` change drops every downloaded session (CLAUDE.md, FV-142). Fix: download again online.
6. **Subscription ended.** Pregame stops on the next online contact and stays stopped offline. See (a).
7. **Audio will not load at all, even online.** The app falls back to a text timer. Force-close and reopen the app; a stale app version is a known cause after a deploy.

**Check.** Nothing server-side records downloads. Confirm the account has access ((a) steps 1 and 4) and work through the list.

**Reply template.**

> Hi [name],
>
> Pregame can run with no signal, but the audio has to be saved on that phone first. While your athlete has a connection, they open Pregame, make their picks, and tap Download for offline. When it says Ready offline, it will play at the rink or field without signal.
>
> [iPhone app:] Offline Pregame is not available in the iPhone app yet. For now your athlete needs a connection when they start the session.
>
> If your athlete signs out, or changes their picks, they need to download again.
>
> KC, From Victory

---

## (k) Chargeback or dispute notice

**Recognise it.** Stripe emails you, and the app sends an alert: `[stripe/webhook] charge.dispute.created`, "Stripe charge dispute created. Response deadline requires manual follow-up.", with `dispute_id`, `charge_id`, `customer_id`, amount, reason, and `evidence_due_by` (`handleChargeDisputeCreated`). `UNVERIFIED`: that the live webhook endpoint is subscribed to `charge.dispute.created` and `charge.refunded`. `docs/stripe-go-live-runbook.md` A3 lists five events and neither of these is among them. Check Stripe > Developers > Webhooks.

**Check.**

- Stripe > Disputes: reason and the evidence deadline. Put the deadline in your calendar the day the notice arrives.
- The customer and their `subscriptions` row. Is the subscription still active and still renewing?
- Supabase and your inbox: did this customer already ask for a refund or a cancellation? Did they recently delete their account?

**Fix.**

- The app changes nothing by itself on a dispute. Access and renewal continue until you act.
- Decide whether to accept or contest in Stripe before the deadline. What counts as grounds to contest, and whether a disputing customer keeps access, is undecided: `TODO(FV-768)`.
- `UNVERIFIED` (general Stripe guidance, not in this repo): do not also refund a disputed charge from the Payments screen; accept the dispute instead, or the customer can be paid twice.
- If the subscription should not renew, cancel it in Stripe.
- Apple and Google: there is no dispute for KC to answer. Apple handles it and we see a `REFUND` or `REVOKE`, which ends access automatically. Google sends a voided purchase (when live).

**Reply template** (only if you choose to contact the customer; a dispute does not require it):

> Hi [name],
>
> I received a notice from your bank about the From Victory charge on [date]. If something went wrong with your subscription I would like to fix it with you directly.
>
> TODO(FV-768): refund and dispute wording goes here once the policy is set.
>
> KC, From Victory

---

## Comp grants via `/dashboard/admin/grants`

A comp grant gives a parent full access with no card and no checkout. It is separate from Stripe and is checked first (`apps/web/lib/actions/grants.ts`, `apps/web/lib/subscriptions/grants.ts`, `docs/stripe-go-live-runbook.md` Part C).

- Sign in as an admin parent (email in `ADMIN_EMAILS`) and open `/dashboard/admin/grants`. Anyone else gets a 404.
- Enter the parent's email (they must already have signed up), a reason (your audit trail, for example "support: webhook failure 2026-11-20"), and optionally an expiry. Blank expiry means permanent.
- Every athlete under that parent is covered.
- "Revoke" ends all active grants for that parent. They then need a paid subscription.
- For support, always set an expiry. A permanent grant that you forget is free access forever.
- **Parents only.** The console rejects any account whose role is not `parent` ("No parent account found for email ..."), so an athlete 18+ who pays for their own account cannot be comped from the console.
- A comp does not stop billing. If a comped parent also has a Stripe or Apple subscription, it keeps charging.
- A comped parent cannot start a new purchase while the grant is active (duplicate-billing guard, `apps/web/lib/subscriptions/subscribe-guard.ts`). Revoke the grant before asking them to subscribe.

---

## Known gaps

1. `support@fromvictoryapp.com` does not exist. Public pages give `privacy@fromvictoryapp.com` and the `/contact` form.
2. Refund policy, dispute policy, and reply-time commitment are undecided: `TODO(FV-768)`. The Terms only say fees are non-refundable unless stated otherwise or required by law.
3. No self-serve email change (g), and no written manual procedure.
4. No tool or tested procedure to re-link an Apple subscription to another account (b). The design record calls for one; the QA checklist names it as a KC-gated manual step without steps.
5. The iPhone app shows the same generic error for `ownership_conflict` as for every other failure, after Apple has confirmed the purchase. The parent is not told to sign in to the other account (FV-706).
6. No admin lookup. Finding a family means Supabase and Stripe by hand. Admin pages cannot view or edit another account.
7. No admin delete tool for the "can't sign in" deletion path that `/delete-account` promises (h).
8. Comp grants cannot be given to an athlete 18+ who owns their account.
9. A Stripe refund or dispute changes nothing in the app automatically. KC must cancel by hand if access should end.
10. `docs/stripe-go-live-runbook.md` is stale in two places: it says a 14-day trial (code: 7 days, one athlete) and its webhook event list omits `charge.refunded` and `charge.dispute.created`.
11. Google Play Billing is built and dormant. Before it is turned on: Terms section 15 needs Google wording, the daily reconcile job needs Google coverage, and section (c) needs a real walkthrough.
12. Offline Pregame does not work in the released iPhone app (FV-753).
13. The `/contact` form is not rate-limited and does not store messages; a failed notification email loses the message.
14. `/delete-account` tells a minor athlete who cannot reach a parent to email us. That conflicts with "support is for adults only". KC to decide how such a message is handled.
15. No written procedure for a support message that raises a safety concern.
16. There is no way for KC to clear a sign-in rate limit; the customer waits it out.
