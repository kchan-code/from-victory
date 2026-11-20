# Support policy and reply templates (DRAFT for KC)

Summary line 1: A short support policy and five reply templates, cut down from PR #681 (`docs/support-runbook.md`, FV-767, open) and adjusted to KC's constraints.
Summary line 2: Every reply is written and sent by a person. There are no auto-replies. Support is for parents and adults only.
Summary line 3: Refund terms, Apple and Google refund routing, and any reply-time promise are not decided. They appear as OPEN CHOICES and as bracketed slots in the templates, not as settled text.

Status: draft. Nothing here is published or sent.

## OPEN CHOICES KC must decide

1. **Refund policy for website (Stripe) purchases.** Option A: decided case by case, no stated window. Option B: a stated guideline with no hard cutoff, for example "we generally refund the most recent charge when you ask soon after it". Not an option: an absolute 14-day cutoff. The Terms today say fees are non-refundable unless stated at purchase or required by law.
2. **Apple refund routing (to verify).** Option A: send the customer to Apple, as Terms section 15 already says. Option B: same, plus KC offers a goodwill credit or comp period from our side where Apple declines. Verify that the template matches what Apple actually offers before use.
3. **Google Play refund routing (to verify, applies only once Play Billing is on).** Option A: send the customer to Google first. Option B: the owner refunds from Play Console order management. Unverified which is correct or allowed in each case. Do not tell anyone that Google refunds always go to Google.
4. **Reply-time promise.** Option A: promise nothing; templates say nothing about timing. Option B: state a target, for example two business days. If Option B, decide whether it is internal only or shown to customers.
5. **A message that appears to come from a 13-17 athlete.** Option A: one short reply that asks them to have a parent or guardian contact us, then stop. Option B: no reply to the athlete; reply only if a parent address is known. Related: `/delete-account` currently tells a minor athlete who cannot reach a parent to email us, which conflicts with "support is for adults only". Option A there: change the page to say a parent or guardian contacts us. Option B: keep it as a privacy-rights channel and treat it as the one exception.
6. **A message that raises a safety concern.** Option A: a fixed reply that says we are not a mental health service and gives 988 and Crisis Text Line. Option B: no template until a clinical advisor has reviewed the wording. No procedure exists in the repo today.

## Support policy

1. **Who support is for.** Parents and guardians, and athletes 18 or older who own their account. Nothing we publish or send invites a 13-17 athlete to contact support. A minor athlete's problem is handled through the parent.
2. **A person sends every reply.** These templates are drafts for the sender to edit. No auto-reply, no auto-acknowledgement, no bot.
3. **Reply address.** Outbound mail from `support@fromvictoryapp.com` is not working yet. Templates do not name an address we will reply from and do not tell anyone to write to that address. Replies go out from whatever mailbox works; the customer is asked to "reply to this message".
4. **Verify before changing anything.** The request should come from the email on the account. If it does not, ask them to write from that email. Never send a password. Never ask for one. Never ask for a card number.
5. **Receipts.** An Apple or Google receipt is used only to confirm a purchase belongs to the sender. It is not copied into any table, log, or note.
6. **Refunds.** No refund, partial refund, or credit is promised until OPEN CHOICE 1 to 3 are decided.
7. **Timing.** No reply time is promised until OPEN CHOICE 4 is decided.
8. **Not a mental health service.** Support does not give medical, psychological, or crisis advice. See OPEN CHOICE 6.
9. **Wording.** Parent-facing: "your athlete". Legal or data context: "minor" (13-17), "adult" (18+). Plain sentences.
10. **Deletion requests.** A request by email starts the 30-day period in Privacy Policy section 8 on the day it arrives. Record that date.

Unverified: whether `support@fromvictoryapp.com` receives mail today. PR #681 says the mailbox did not exist when it was written and that mail arrives at the privacy address and through the contact form.

## Template conventions

- `[square brackets]` are slots the sender fills or removes.
- `[OPEN CHOICE n]` marks a slot that cannot be filled until KC decides.
- Sign-off is `[sender name], From Victory`.

---

## 1. Billing question

### 1a. Website purchase (Stripe)

> Hi [name],
>
> Thanks for writing. Your subscription was bought on our website.
>
> [I can see your subscription. It is [active / in its free trial / past due]. The next charge is [amount] on [date].]
> [I could not find a subscription under this email. Which email did you use when you paid?]
>
> To see your plan, update your card, or cancel, open fromvictoryapp.com in a web browser, sign in, go to Settings, and choose Manage subscription. Inside the iPhone or Android app that screen sends you to the website.
>
> [If the app is locked after paying:] Please check that you are signed in with the account you paid with. If you used a different email, sign out and sign in with that one. Please do not subscribe a second time.
>
> [sender name], From Victory

Sender notes: the trial is 7 days for a first subscription with one athlete; the card is charged when it ends. A Stripe refund does not change access by itself (PR #681 section d).

### 1b. iPhone app purchase (Apple)

> Hi [name],
>
> Thanks for writing. Your subscription was bought in the iPhone app, so Apple bills it through your Apple Account. We do not see your payment details, and we cannot change or cancel an Apple subscription from our side.
>
> To see the plan, the renewal date, or to cancel: open Settings on your iPhone, tap your name, then Subscriptions, and choose From Victory.
>
> [If the app is locked after paying:] In the app, open the subscription screen and select Restore Purchases. If that does not work, reply to this message and tell me what the screen says.
>
> [sender name], From Victory

### 1c. Android app (Google Play)

Use the first version while Play Billing is off. That is the state on `origin/main`; the production flag value is unverified.

While Play Billing is OFF:

> Hi [name],
>
> Thanks for writing. The Android app does not take payment. Subscriptions are bought at fromvictoryapp.com in a web browser, and the app unlocks when you sign in with that same account.
>
> If you already subscribed on the website, sign out of the app and sign in with the email you used there. If you have not subscribed yet, open fromvictoryapp.com in a browser, sign in, and choose a plan.
>
> [sender name], From Victory

Once Play Billing is ON (do not use before):

> Hi [name],
>
> Thanks for writing. Your subscription was bought in the Android app, so Google bills it through your Google Play account. We do not see your payment details.
>
> To see the plan, the renewal date, or to cancel, open Google Play and go to Subscriptions.
>
> [If the app is locked after paying:] Please close the app fully and open it again while signed in to the account you bought with. If it is still locked, reply to this message and tell me what the screen says.
>
> [sender name], From Victory

Unverified: the Google Play menu path, and whether reopening the app resubmits a purchase in every failure case (PR #681 says it does for `acknowledge_failed`).

---

## 2. Refund request

No template promises a refund. Each has a slot that stays empty until KC decides.

### 2a. Website purchase (Stripe)

> Hi [name],
>
> Thanks for writing. I have your refund request for the charge of [amount] on [date].
>
> [OPEN CHOICE 1: the decision sentence goes here. Until the policy is set, the sender writes the decision for this case by hand, or says: "I am looking at this and will write back with an answer."]
>
> If you also want to stop future charges, you can cancel any time: open fromvictoryapp.com in a web browser, sign in, go to Settings, and choose Manage subscription. Cancelling stops renewals. Access continues to the end of the period already paid for.
>
> [sender name], From Victory

Do not write: any fixed number of days as a cutoff.

### 2b. iPhone app purchase (Apple)

> Hi [name],
>
> Thanks for writing. Your subscription was bought through the App Store, so Apple holds the payment.
>
> [OPEN CHOICE 2, Option A: "Refund requests for App Store purchases are handled by Apple under its own policies. You can ask Apple from your Apple Account purchase history."]
> [OPEN CHOICE 2, Option B: Option A text, plus the sentence KC approves about what we can offer from our side.]
>
> To stop future charges, open Settings on your iPhone, tap your name, then Subscriptions, and cancel From Victory there.
>
> [sender name], From Victory

Grounding: Terms section 15 (approved by KC 2026-11-13) says "We cannot cancel, change, or refund an Apple subscription for you" and that refund requests are handled by Apple. To verify: the exact place in Apple's screens where a customer asks.

### 2c. Android app purchase (Google Play), only once Play Billing is ON

> Hi [name],
>
> Thanks for writing. Your subscription was bought in the Android app, so the payment went through Google Play.
>
> [OPEN CHOICE 3, Option A: "You can ask Google for a refund from your Google Play account, under Google's refund policies."]
> [OPEN CHOICE 3, Option B: "I am looking at your order and will write back with an answer."]
>
> To stop future charges, open Google Play, go to Subscriptions, and cancel From Victory there.
>
> [sender name], From Victory

Do not write: that Google refunds always go to Google, or that we cannot refund a Google purchase. Neither is verified.

---

## 3. Cannot sign in

### 3a. Parent or adult athlete forgot their password

> Hi [name],
>
> You can reset your password at fromvictoryapp.com/forgot-password. Enter the email on your account and we send a reset link if we find a match.
>
> If the email does not arrive in a few minutes, check your spam folder, and check whether you signed up with a different email address. If the link says it has expired, request a new one.
>
> [sender name], From Victory

Sender notes: the form shows the same message whether or not the email matches an account. Limit is 8 requests per email per hour. Do not set a password for anyone.

### 3b. Parent writing about their athlete's sign-in

> Hi [name],
>
> You can reset your athlete's sign-in yourself. Sign in to your parent account, open your Dashboard, select Manage next to your athlete, then Create reset code. Send the code to your athlete's phone. It shows their username and lets them pick a new password. It works once and expires in 24 hours.
>
> [sender name], From Victory

### 3c. "Too many tries"

> Hi [name],
>
> That message appears after several sign-in attempts in a short time. It clears by itself, usually within 15 minutes. After that, please try again, or use Forgot password on the sign-in screen.
>
> [sender name], From Victory

Sender notes: there is no way for us to clear a sign-in limit. Limits are 15 username attempts or 20 email sign-ins per 15 minutes.

---

## 4. Account deletion

### 4a. They can sign in

> Hi [name],
>
> You can delete [your account / your athlete's account] yourself, and it takes effect right away. The steps are at fromvictoryapp.com/delete-account. Deletion cannot be undone.
>
> [Website subscription:] Deleting your account also cancels your website subscription.
> [Apple:] Your subscription was bought through the App Store, and deleting your account does not cancel it. Open Settings on your iPhone, tap your name, then Subscriptions, and cancel From Victory there, or Apple will keep billing you.
> [Google, only once Play Billing is ON:] Your subscription was bought in the Android app. When you delete your account we ask Google to stop it from renewing. If the app shows a message that this could not be confirmed, open Google Play, go to Subscriptions, and cancel From Victory there.
>
> [sender name], From Victory

### 4b. They cannot sign in and ask us to delete

First reply, to verify:

> Hi [name],
>
> I can delete the account for you. To confirm it is yours, please reply to this message from the email address on the account, and tell me the account holder's first name.
>
> [sender name], From Victory

After deletion:

> Hi [name],
>
> I have deleted your From Victory account [and your athlete's account and training data] as of [date]. [Your website subscription was cancelled at the same time.]
>
> We keep only a record that a deletion happened and when. It has no names, email addresses, or birthdates.
>
> [Apple:] Your App Store subscription is not cancelled by this. Please cancel it in Settings on your iPhone, under your name, then Subscriptions.
> [Google, only once Play Billing is ON:] Please check Subscriptions in Google Play and cancel From Victory there if it still appears.
>
> [sender name], From Victory

Sender notes: there is no admin delete tool. PR #681 section (h) has a manual procedure marked unverified; have it reviewed before first use. Record the date the request arrived. The "we keep only" sentence quotes Privacy Policy section 8; once Play Billing is on, the cancel-failure alert email is an exception (see `google-billing-legal-corrections.md`), so adjust that sentence if an alert was raised for this account.

---

## 5. Purchase linked to another account

### 5a. Apple

> Hi [name],
>
> Thanks for letting me know, and sorry for the unclear error. Your Apple subscription is active. It is linked to a different From Victory account than the one you are signed in to, and the app cannot move it between accounts by itself.
>
> The quickest fix is to sign out in the app, then sign in with the account you first subscribed with. Do you have another From Victory account, maybe under a different email?
>
> If you would rather keep using the account you are in now, reply to this message and tell me, and attach the receipt email Apple sent you so I can confirm the purchase. I will look at what is possible and write back.
>
> Please do not tap Subscribe again in the meantime.
>
> [sender name], From Victory

Sender notes: there is no automatic re-link and no tested manual procedure (PR #681 section b, FV-706). Do not tell them to delete the other account to free the subscription; deleting does not cancel an Apple subscription and it cannot be re-attached. Whether Apple charged a second time is unverified per case; ask what their Apple purchase history shows.

### 5b. Google Play, only once Play Billing is ON

> Hi [name],
>
> Thanks for letting me know. Your Google Play purchase is linked to a different From Victory account than the one you are signed in to, and the app cannot move it between accounts by itself.
>
> Please sign out in the app, then sign in with the account you first subscribed with. Do you have another From Victory account, maybe under a different email?
>
> If you cannot find it, reply to this message and attach the receipt email Google sent you so I can confirm the purchase. I will look at what is possible and write back.
>
> Please do not subscribe again in the meantime.
>
> [sender name], From Victory

Unverified: the on-screen behavior for a Google `ownership_conflict`, since no released build sells through Google Play.

### 5c. Website purchase on a different account

> Hi [name],
>
> I can see a subscription, but it is on a different account than the one you are signed in to: [it was paid with EMAIL / which email did you pay with?].
>
> Please sign out, then sign in with that account. Your athlete signs in with their own username, not your email. Please do not subscribe a second time.
>
> [sender name], From Victory

---

## What these templates do not do

- Promise a refund, a credit, or a reply time.
- Name an address the reply will come from, or tell anyone to write to `support@fromvictoryapp.com`.
- Address or invite a 13-17 athlete.
- Give medical, psychological, or crisis advice.
- Say Google refunds always go to Google.

## Could not verify

- Whether the support mailbox receives mail.
- Apple and Google refund request paths and who decides in each case.
- Google Play menu names and Google error behavior on a device.
- That cancellation is enabled in the Stripe billing portal configuration (flagged in PR #681).
- The manual deletion and Apple re-link procedures (flagged unverified in PR #681).
