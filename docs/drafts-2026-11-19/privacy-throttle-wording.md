# Privacy Policy 1g / 1h: throttle-record wording (DRAFT for KC)

Summary line 1: Section 1g says our security records are "non-identifying" and contain no IP addresses. That is not accurate: the rate limiter stores a keyed one-way code derived from an IP address, an email address, or an account.
Summary line 2: This draft gives exact replacement text for 1g and 1h that is true on `origin/main` today. It does not claim that hashing makes the data anonymous.
Summary line 3: One sentence in 1g depends on FV-775 (scheduled deletion for actions other than the contact form). It is marked, with the text to switch to once FV-775 ships.

Status: draft, nothing published. Not attorney-approved. Publishing it means a new effective date on `/privacy` (KC's call).

## OPEN CHOICES KC must decide

1. **How much detail 1g carries.** Option A: the full text below (names the identifiers and says the codes are personal information). Option B: the short text below (same facts, fewer words).
2. **When to publish.** Option A: publish now with the "no fixed schedule yet" sentence, then tighten after FV-775. Option B: wait for FV-775 and publish only the final text. Note for Option B: the current live sentence stays inaccurate until then.

## What the code does (verified on origin/main)

- `apps/web/lib/actions/rate-limit-store.ts`: every throttled action writes one row to `auth_rate_limit_events` with `action`, `created_at`, and `bucket`. `bucket` is the hex HMAC-SHA256 of `"<action>:<identifier>"` using the server secret `RATE_LIMIT_HASH_SECRET`. The raw identifier is not stored.
- Identifier per action, from the comments in `apps/web/lib/actions/rate-limit.ts` (I did not open each caller to confirm):
  - IP address: `sign_up`, `claim_pairing`, `password_update`, `preview_invite`, `contact_form` (`apple_signin` and `apple_handoff` are reserved and not live).
  - Username together with IP address: `username_sign_in`.
  - Email address typed: `sign_in`, `password_reset`, `signup_verify`, `signup_resend`.
  - Account or device athlete id: `athlete_sign_in`, `generate_pairing_code`, `pregame_selections`.
- `apps/web/lib/actions/contact.ts`: the contact form calls `rateLimitGate("contact_form", ip)`. No name, email, or message goes into the row.
- Windows are 15 or 60 minutes.
- Deletion today:
  - Any action: after an allowed attempt, rows for that same code that are older than the window are deleted (same file, "opportunistic prune"). A code that is never used again is not deleted by this path.
  - `contact_form`: `supabase/migrations/20261119120000_fv774_contact_form_rate_limit_prune.sql` deletes rows older than 2 hours. It is called from the daily cron route `/api/cron/prune-activity-events` (schedule `20 4 * * *` in `vercel.json`). Normal maximum age is 2 hours plus about a day; longer if a run is missed.
  - `pregame_selections`: already covered by 1i ("deleted within about a day"). There is a delete on `auth_rate_limit_events` in `20261113140000_pregame_selection_distinct_athletes.sql`. I did not re-verify its bound.
  - Every other action: no scheduled deletion verified. Tracked as FV-775.

Why "non-identifying" is wrong: a keyed digest of an IP address or email address is pseudonymous personal data. Anyone holding the key and the identifier can recompute the code and match the row. Deletion is the control, not the hashing.

## 1g. Sign-in and security data

### Before (live on origin/main)

> To keep accounts secure we use authentication session cookies, and, on an athlete's device, an optional sign-in helper cookie that remembers which sign-in screen to show. To prevent abuse we keep short-lived, non-identifying security records (for example, one-way, irreversible counters used for rate limiting) that do not contain raw email addresses, usernames, or IP addresses.

### After, Option A (full)

> To keep accounts secure we use authentication session cookies, and, on an athlete's device, an optional sign-in helper cookie that remembers which sign-in screen to show.
>
> To prevent abuse we limit how often certain actions can be repeated, such as sign-in attempts, sign-ups, password resets, entering an invite code, and sending the contact form. Each time one of these actions is attempted we keep a security record. The record contains the kind of action, the time, and a one-way code. We make the code with a secret key held on our servers, from one of the following: the email address that was typed, the account, or the IP address the request came from. For a username sign-in the code is made from the username together with the IP address.
>
> These records do not contain the raw email address, username, or IP address. They are not anonymous. Someone who holds our secret key and already knows an email address or IP address could check whether a record was made from it, so we treat these records as personal information.
>
> **[DEPENDS ON FV-775]** A record is removed the next time the same action is allowed for the same email address, account, or IP address after its time window (15 to 60 minutes) has passed. Contact form records, and the pregame record described in "App usage activity" below, are also deleted by a daily job. For the other actions we do not yet delete these records on a fixed schedule, so a record that is never matched again can stay longer.

### After, Option B (short)

> To keep accounts secure we use authentication session cookies, and, on an athlete's device, an optional sign-in helper cookie that remembers which sign-in screen to show.
>
> To prevent abuse we limit how often actions such as sign-in, sign-up, password reset, and the contact form can be repeated. For each attempt we keep the kind of action, the time, and a one-way code made with a secret key from the email address typed, the account, or the IP address of the request. We do not store the raw email address, username, or IP address in these records, but the codes are not anonymous and we treat them as personal information.
>
> **[DEPENDS ON FV-775]** A record is removed the next time the same action is allowed for the same email address, account, or IP address after its 15 to 60 minute window. Contact form records are also deleted by a daily job (see "Contact form"). For other actions there is not yet a fixed deletion schedule.

### The FV-775 sentence: what to switch to

Do not publish the replacement below until FV-775 is merged, applied in production, and the bound is confirmed from the migration.

Replace the paragraph marked **[DEPENDS ON FV-775]** with:

> A daily job deletes these records once they are older than **[N hours, from the FV-775 migration]**, so one normally lasts no more than about **[bound]**. If a daily run is missed, a record can last until the next run.

Words to keep out of 1g until FV-775 ships: "short-lived", "deleted within", "automatically deleted" (for anything except the contact form and the pregame record).

## 1h. Contact form

### Before (live on origin/main)

> If you use our contact form, we collect the name, email address, and message you submit so we can respond. Contact messages are delivered to our team by email through our email provider; we do not store contact submissions in a separate database. Please do not include sensitive personal, medical, or financial information in your message.

### After

> If you use our contact form, we collect the name, email address, and message you submit so we can respond. Contact messages are delivered to our team by email through our email provider; we do not store contact submissions in a separate database. Please do not include sensitive personal, medical, or financial information in your message.
>
> To limit spam, each time the form is sent we also keep a security record of the kind described in "Sign-in and security data" above: the time, and a one-way code made with a secret key from the IP address the message was sent from. It does not contain your name, email address, or message. A daily job deletes these records once they are more than 2 hours old, so a record normally lasts no more than about a day. If a daily run is missed, a record can last until the next run.

This 1h text is true today and does not depend on FV-775.

## Other places that carry the same claim (not customer-facing, listed so they change together)

- Header comment block in `apps/web/app/privacy/page.tsx`: add a line that 1g and 1h describe `auth_rate_limit_events`, and that the retention sentence must match FV-774 and FV-775.
- `apps/web/lib/actions/rate-limit-store.ts` comment says "no cron required". That is now out of date for `contact_form`. Engineering follow-up, not part of this wording change.
- Section 8 (deletion): these records are not linked to an account id in the clear, so account deletion does not remove them. Section 8 does not claim otherwise today. If KC wants that stated, it is one added sentence; I have not drafted it because it is a scope choice.

## Could not verify

- That the FV-774 migration has been applied in production and the cron call is live there (read from `origin/main` only).
- Each caller's identifier (taken from config comments).
- Whether the hosting provider keeps its own request logs with IP addresses, and for how long. Section 1g does not speak to that today; neither does this draft.
- How long contact-form emails stay in the receiving mailbox. No stated retention exists; out of scope here.
