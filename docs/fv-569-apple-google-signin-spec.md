# FV-569: Sign in with Apple + Google (parents and 18+ athletes), spec

**Status:** DRAFT v2 for KC approval (discovery deliverable). Nothing here is built.
**Date:** 2026-11-11.
**Reviews:** backend-engineer, frontend-engineer, qa-reviewer and kids-privacy-officer reviewed v1. Their findings are folded in (see §13).
**Issue:** FV-569 (discovery). The delivery issues in §11 are filed only after KC approves this spec and signs the decisions in §9.

## 1. Decision and scope

**KC decision (2026-11-11):** add Sign in with Apple and Sign in with Google for **parents** and **18+ self-serve athletes** (`adult_athlete`). The goal is to make getting into the app easier for the people who hold real email accounts.

**Product-strategist (2026-11-11):** approved with conditions, **website first**.

| | In scope (Phase A, web) | Out of scope |
|---|---|---|
| Who | `parent`, `adult_athlete` | Minor athletes (13-17), in any form, ever in MVP. No linking a minor account, no SSO on invites or the username login, no "upgrade at 18" path. |
| Where | Web browsers: the `/signin` Parent tab, `/signup`, `/signup/athlete`, and a new `/welcome` completion step | Inside the iOS and Android shells (Phase B, its own issue). Social and other in-app browsers. |
| Providers | Apple and Google, through Supabase Auth's built-in providers | Facebook, Microsoft, X, or any other provider. No Clerk, Auth0, Firebase, or new SDK. |
| Linking | Supabase's automatic same-email linking, hardened per §8.1 | A manual `linkIdentity` UI, account merging |
| Data | Email and provider identity only | Copying the provider name or photo into profiles; sign-in analytics beyond counts |

Email and password stays. SSO is an extra way in, not a replacement.

**Evidence of friction.** The 2026-11-11 device QA found that 18+ athletes don't know which sign-in tab is theirs ([FV-654], fixed; [FV-657], in review). SSO helps the people who forget passwords or abandon signup. It doesn't fix tab confusion. FV-657 touches `SignInChooser` and must merge first; Phase A builds on its copy.

## 2. How it works today (verified on `main` @ 6790398)

**Sign-in and signup.** Parent and adult accounts use email and password.
- `lib/actions/auth.ts` `signUp` (`:41-129`) collects first_name and consent. The parent profile has `birthdate` null (a DB constraint), and **there is no parent age check**.
- `lib/actions/auth-adult.ts` `signUpAdultAthlete` (`:82-185`) collects first_name, birthdate (a ≥18 zod refine), sport, age attestation and consent. It is gated by `isAdultSignupEnabled()` (`lib/flags.ts:17`).
- Both insert the profile **with the session `auth.signUp` returns** (`auth.ts:97-102`). If the insert fails, they delete the auth user.

**Email confirmation is OFF in production.** The code proves it: the profile insert relies on `auth.uid()` from that fresh session, and with confirmations on there would be no session and the insert would fail RLS. Local `config.toml:207` agrees. Consequence: nobody's email is ever verified by a click (see §8.1).

**Consent is checked, not stored.** No column or table records terms acceptance. This is an existing gap; SSO keeps parity, with a follow-up filed (§9 Q7).

**No trigger on `auth.users`.** Profiles are created only by the signup actions.

**A session with no profile is treated as orphaned and signed out:**
- `redirectIfAuthed` sends it to `/auth/signout` (`lib/auth/guards.ts:230`).
- Every `require*` guard sends it to `/signin` (`:59,90,121,147`).
- The native-shell router signs it out (`lib/native-shell-router.ts:114`).

The guards use `.single()` and treat **any** error as "no profile". **This is the main code change:** an OAuth user arrives with an `auth.users` row and no profile.

**Auth callback.** `app/auth/callback/route.ts` exchanges the PKCE code, enforces a same-origin `next`, and doesn't look at the profile. Every failure goes to `/signin?reset=invalid`, which is reset-specific wording. Today's only callers are password reset (`auth.ts:270`, `account-settings.ts:48`).

**Account deletion.** `deleteAccount` (`lib/actions/account.ts:169`) is immediate and hard. It is gated by `requireSubscriber()`, so a user with no profile can't call it. It cancels Stripe, then `auth.admin.deleteUser`, and the cascade also removes `auth.identities`.

**Stripe.** It maps by account id (`subscriptions.parent_id`, `metadata.parent_id`, `client_reference_id`). There is no email matching, so two auth users sharing an email can't collide in our DB.

**Native shell.**
- `getRequestShellCapability()` (`lib/native-shell.ts:143`) is already used on `/signin`; the signup pages don't read shell state.
- The service worker never caches `signin`, `signup`, `forgot` or `reset`. The bypass list is in `public/sw.js` `BYPASS_PREFIXES` (`:171`), hand-mirrored in `lib/sw/route-strategy.ts` with a sync test. The cache version is `fv-shell-v7` (`sw.js:44`).
- The SW strips the shell UA on intercepted navigations (FV-489), which is why the auth pages must stay in the bypass list.

**Email.**
- Supabase Auth sends auth email. No custom SMTP is in the repo config; **the hosted setting is unverified**.
- App email goes through Resend (digest, waitlist, contact, alerts), with sender domains set by env.

**Config** (`supabase/config.toml`):
- `[auth.external.apple]` is stubbed and disabled; there is no Google block.
- `enable_manual_linking = false`.
- Redirect URLs are localhost only.

**Rate limits.** The `sign_up` bucket is per-IP, 15/h; `sign_in` is per-email, 20/15m. Action names are a DB CHECK constraint, so a new bucket needs a migration. **Reuse `sign_up`.**

**Crons** (root `vercel.json`): reminders, digest, `reap-pairings` and `prune-activity-events`. Nothing reaps auth users with no profile.

**Privacy policy.** `app/privacy/page.tsx` names only Stripe as a processor.

## 3. User flows

### 3.1 New user, web

1. On `/signup` (parent) or `/signup/athlete` (adult), the user taps **Continue with Apple** or **Continue with Google**.
2. The page calls `signInWithOAuth({ provider, options: { redirectTo: <origin>/auth/callback?next=/welcome&as=parent|adult } })`. `as` only preselects the choice on `/welcome`; it grants nothing.
3. Supabase → provider → Supabase → `/auth/callback`, which exchanges the code and sets the session cookie.
4. The callback resolves session state (§4.2). `needs_onboarding` → `/welcome` (a server redirect, so Back doesn't return to the provider screen).
5. **`/welcome`** is the completion step. It is server-rendered, `noindex`, has no analytics, and uses the existing auth components.
   - **"Signed in as <email>"**. This is the auth email, not provider name or avatar.
   - **Account type:** two large tap cards (≥56px), "Parent" and "Athlete 18+", preselected from `as`. When `ENABLE_ADULT_SIGNUP` is off there is no chooser, only the parent path.
   - **Parent path:** first_name, consent, plus **one new attestation checkbox**, "I'm a parent or guardian and I'm 18 or older". It is not stored, just like consent (privacy finding).
   - **Adult path:** the same fields and zod schema as `signUpAdultAthlete`: first_name, birthdate (native date input, `autocomplete="bday"`), sport, age attestation, consent. It uses the existing `AuthStep` step pattern so the phone keyboard doesn't bury the form. It shows the same trial / card-required disclosure as `AdultSignUpForm`.
   - **Submit** inserts the profile with the user's own session (`profiles_insert_own`, no service role). It then routes exactly as the password signups do: parent → `/dashboard`; adult → `/subscribe`, or `/athlete` in the legacy-native shell.
   - **Adult birthdate under 18:** service-role `auth.admin.deleteUser(user.id)`, sign out, then `/signup?error=age` with the existing ≥18 wording. No fallback to a minor or parent path, and nothing is stored or logged beyond a count. The birthdate is never logged.
   - **"Use a different account"** is a quiet text link, not a button next to Submit. It asks for confirmation, then deletes the auth user and signs out. An account with no profile has nothing else to delete.
   - **Relay line:** *"Signed in with a hidden Apple email and already have an account? Use a different account, then sign in with your usual email."* KC approves the copy.
   - The first field is autofocused.
6. Name fields start empty. **Never prefill from provider metadata.**

### 3.2 Existing user signs in with SSO

- **Same email as an existing password account.** Supabase links the identity to the existing user. Because confirmations are off, §8.1's hardening runs **once**, on that first link:
  - the password is rotated to a random value;
  - other sessions are revoked;
  - the user sees *"For your security we reset your password. Keep using Apple/Google, or set a new password with Forgot password."*

  After that they land on their role home. This is the main "easier" win for current parents and adults, at the cost of a one-time password reset.
- **Apple "Hide My Email".** The relay address matches no one, so this becomes a **new** user and goes to `/welcome` with the relay line above. The support path is privacy@ or the contact form. Support never merges accounts without re-verifying both; this goes in the support runbook.

### 3.3 Sign-in page placement

- **Recommended:** the SSO buttons sit at the top of the **Parent tab**, above the email form. They don't appear on the Athlete tab, so minors aren't invited to try them; privacy endorsed this.
- The Athlete tab's 18+ paragraph (FV-657) gets a **button that switches to the Parent tab**, not just text, so a confused adult is one tap from the buttons.
- **Alternative (KC decision D4):** render the buttons **above the tab toggle**, shared by both tabs. That's better for confused adults. It is safe because `/welcome` blocks under-18s, but a minor who tries leaves an `auth.users` row for up to the reaper TTL (§4.2).

### 3.4 Native apps (Phase A)

- There are no SSO buttons in either shell (§4.4).
- **An SSO-only user** (no password) who opens the app needs a password. The intended path is **Forgot password** with their email. **Unverified:** that Supabase recovery sets a usable password on an OAuth-only user. This must be proven in A4 before launch copy promises it.
- `/signin` in the shell keeps today's website-guidance text.
- Apple relay users only get the reset email if auth email can reach relay addresses (C6).

### 3.5 Errors

- **Provider cancel or error.** The provider's `error` / `error_description` (handled before the `!code` check) → `/signin?error=oauth`. The message: *"Sign-in with Apple/Google didn't finish. Try again or use your email."* It reuses the existing `role="alert"` banner, focus moves to the banner, and provider text is never echoed. The `searchParams` type gains `error: "oauth"`.
- **Bad or expired code, or a different browser.** PKCE codes are single-use, last 5 minutes, and need the same browser. These get the same `error=oauth` message.
- **Recovery-flow errors** keep `?reset=invalid`; the callback branches on `next` starting with `/reset-password`.

## 4. Changes by layer

### 4.1 Supabase config

**Hosted:**
- Enable Apple and Google (§7).
- Redirect allow-list: the **exact** path `https://www.fromvictoryapp.com/auth/callback`. Previews would use the documented `https://*-<slug>.vercel.app/**` pattern, but only if Preview ever gets Supabase env; it doesn't today.

**Local `config.toml`:**
- Add `[auth.external.apple]` and `[auth.external.google]` with `env(...)` secrets, `enabled = false` by default.
- Add `http://127.0.0.1:3000/auth/callback` to `additional_redirect_urls`.

**Also:**
- The Apple **Services ID must be first** in Client IDs, or web sign-in is rejected (Supabase docs).
- `enable_manual_linking` stays `false`.
- **Scopes (minimum):**
  - Apple: request **no `name` scope**, `email` only, if Supabase's hosted flow allows it.
  - Google: `openid email`, plus `profile` only if Supabase requires it.
  - Verify the scopes actually sent (C3).

### 4.2 Server (backend-engineer)

**1. `getSessionState()` resolver.** Returns `none | orphan | needs_onboarding | parent | athlete | adult_athlete | error`.
- Uses `.maybeSingle()`. A **query error returns `error`**, never `needs_onboarding` or `orphan`; callers show a retryable error rather than routing a real user into onboarding.
- `needs_onboarding` = authenticated, no profile row, **and** `app_metadata.providers` includes `apple` or `google`. `app_metadata` is server-controlled, so users can't forge it, and it is seedable in E2E (§12).
- A profile-less user with only `email` stays `orphan`, with today's sign-out behaviour. That case is a failed password signup.

**2. Guards.**
- `redirectIfAuthed` and every `require*` send `needs_onboarding` → `/welcome`.
- New `requireOnboarding()` for `/welcome`: `orphan` → `/auth/signout` (not `/signin`, which would loop); a role → its home.
- The **native-shell router is unchanged**: in the shell, `needs_onboarding` signs out, because the shell can't complete OAuth.

**3. `/auth/callback`.**
- Handle provider `error` params first, then the code exchange.
- Validate `next` against an allow-list: `/welcome`, `/dashboard`, `/athlete`, `/subscribe`, `/reset-password`. Anything else → the role home. This keeps the same-origin check.
- After the exchange, resolve state. `needs_onboarding` → `/welcome` (pass the `as` hint). A role → `next` or the role home.
- **Then run the §8.1 first-link hardening** when it applies.

**4. `completeOnboarding` server action** (POST Server Action; never a GET route).
- Reuses the two existing zod schemas (plus the parent attestation) and the `sign_up` rate-limit bucket (by IP).
- Inserts the profile with the user's own session, using the **exact column set** of the matching password signup. The DB backstops are `birthdate_role_consistency`, the 18+ check and `sport_role_consistency` (`20260625000000_adult_athlete_role.sql:85-149`).
- **Double submit:** rely on the `profiles.id` PK. Map `23505` → "already done", redirect to the role home.
- **Never delete the user when the insert fails.** Do NOT copy the signup rollback, because a second submit would delete the account the first one just created.
- **Only** the under-18 adult branch deletes the user.
- `as=adult` with the flag off → rejected. `as` never grants a role.

**5. `cancelOnboarding` server action** (POST).
- The id comes from `getUser()`.
- Immediately before `deleteUser`, re-check with the service client that **no profile exists**. If one does, it's a no-op that redirects to the role home.
- Then sign out. It is idempotent.

**6. Orphan reaper (new cron)**, `/api/cron/reap-incomplete-oauth`. It copies the `reap-pairings` pattern: `CRON_SECRET` `timingSafeEqual`, count-only logs.
- **TTL 1 hour, cron every 15 minutes** (privacy ruling; worst case about 75 minutes).
- **Dry-run mode** (`REAPER_DRY_RUN=true`) for the first week: log candidate counts, delete nothing.
- **Per-run cap:** for example 100.
- **Re-check before each delete:** a service-client profile lookup per id immediately before `deleteUser`. The residual race (the user completes in the gap between the re-check and the delete) is accepted as negligible at a 1h TTL.
- **Finder function** (migration):
  - `security definer`, `set search_path = ''`, returns ids only;
  - candidates are `auth.users` with an apple/google provider, no `profiles` row, and `created_at < now() - interval '1 hour'`;
  - `revoke all ... from public, anon, authenticated`, then `grant execute ... to service_role`;
  - an **effect-based** RLS-harness assertion (FV-507 / `15_function_grant_default_deny` / `19_client_grant_matrix` pattern).
- Entry in the **root** `vercel.json`. Rollback = remove that entry.

**7. Account deletion (D1).**
- `deleteAccount` computes `hasAppleIdentity` **before** deleting, because afterwards the user no longer exists. It passes this to the confirmation page as a redirect param.
- The confirmation then shows the Apple revoke instruction (TN3194): *Settings → [your name] → Sign-In & Security → Sign in with Apple → From Victory → Stop Using*, with a link to https://support.apple.com/en-us/102571.
- The same instruction goes in the privacy policy.
- No token storage in Phase A.

**8. Provider metadata.** Provider name, avatar and email land in `auth.users.raw_user_meta_data` and `auth.identities.identity_data`. GoTrue rewrites them on every sign-in, so a scrub isn't durable and isn't required (privacy ruling). Controls:
- **CI grep guard** (not just a unit test): fail on any read of `user_metadata`, `raw_user_meta_data`, `identity_data`, `full_name`, `avatar_url` or `picture` outside an allow-list. This covers the logging and error-capture paths (`lib/monitoring/notify.ts`).
- **Deletion proof test:** after `deleteAccount` and after the reaper, no `auth.users` or `auth.identities` row remains for that id.
- **Documented exception:** for SSO users, Supabase auth holds provider name, photo and email. This is a deviation from the "no photos" minimal-PII rule. It's acceptable only because it's parent or adult data, held in auth and never read or shown. **KC signs this** (§9) and the privacy policy states it.

**9. Apple client-secret expiry alert.**
- Store the expiry date in env `APPLE_CLIENT_SECRET_EXPIRES_AT`.
- A weekly check (fold it into an existing cron) calls `notifyError` 30 days before expiry.
- This is in addition to the runbook and a Linear reminder.

### 4.3 Web UI (frontend-engineer)

**`components/auth/OAuthButtons.tsx`** is a client component, because it calls `supabase.auth.signInWithOAuth`.
- **Apple:** the **white** variant on onyx (black disappears on black). Apple logo, exact wording "Continue with Apple". Apple HIG minimum height and corner-radius ranges.
- **Google:** the dark theme: `#131314` fill, `1px #8E918F` border, white text, and the multicolour G kept.
- **Both:**
  - pill radius (`rounded-pill`, as the existing buttons use), `min-h-[48px]`;
  - order Apple then Google, equal prominence;
  - neutral: gold stays reserved for the single primary `SubmitButton`;
  - logos are SVGs in `public/`, `aria-hidden`; the visible text carries the provider name.
- **Focus:** the existing **gold ring** (`focus-visible:ring-2 ring-gold/60 ring-offset-onyx`, as in `SubmitButton.tsx:23`). No cobalt.
- **While redirecting:** set `disabled`, which stops a double tap from overwriting the PKCE verifier cookie. Also set `aria-busy`, plus `aria-live="polite"` text such as "Opening Apple…".
- **Divider** *"or use email"*. It must render correctly with one or two buttons, since the flags are per provider.
- **Placement:** on the signup pages, above the email form. Check the 375px fold with `TrialDisclosure`, and keep the gold CTA reachable.

**Render rule (server-side, per request).** The page passes `showOAuth(provider)`, which is true only when **all** of these hold:
1. The provider flag is on. `ENABLE_SSO_APPLE` / `ENABLE_SSO_GOOGLE` take `off | preview | on`, the same shape as `isAdultSignupEnabled`. `preview` shows the buttons only when an admin-set `fv_sso_preview` cookie is present (§10).
2. `getRequestShellCapability() === null`.
3. The UA is not an in-app browser. This uses a **deny-list plus heuristics**:
   - Instagram, `FBAN` / `FBAV`, TikTok (`musical_ly`, `BytedanceWebview`), `Line/`, Snapchat, `TwitterAndroid`, `LinkedInApp`, Pinterest;
   - the generic Android WebView marker `; wv)`;
   - an iOS WebKit UA without `Safari/`.

   This is a presentation hint only, like `native-shell.ts`. The helper lives next to `native-shell.ts`, with unit tests.

Where buttons are hidden by rule 3 (not rule 2), show one line: *"Open this page in Safari or Chrome to use Apple or Google."* KC approves the copy.

**Service worker.**
- Add `/welcome` (and confirm `/auth/`) to `BYPASS_PREFIXES` in **both** `public/sw.js` and `lib/sw/route-strategy.ts`.
- Bump `CACHE_VERSION` (`fv-shell-v7` → `v8`) so installed shells pick it up.
- Extend `sw-route-strategy.test.ts`.
- `MANIFEST_VERSION` doesn't change, because no mp3 changes.

**Copy.** Every new string follows `docs/gtm/voice-and-guardrails.md`, and KC approves it at PR review. The `/welcome` adult path passes the existing audience-language ("kid") assertion.

### 4.4 Native shell (Phase A)

There are no native code changes and no new Capacitor plugin. Hiding is proven three ways. **The checks must run with the flags ON**, because with them off the buttons are hidden by the flag and a pass proves nothing:

1. **Automated.** A Vitest route test plus a Playwright spec, with the flags on. Each sends the real `ios-iap` and `legacy-native` UA strings and asserts the **SSR HTML contains no OAuth button** on `/signin`, `/signup` and `/signup/athlete`.
   - The UA fixtures include **older shipped builds** (Android build 9 and 10, iOS 1.0 (3) and current) and the in-app-browser UAs.
   - Also a regression test that `/signin` and `/signup` stay in the SW bypass list.
2. **Deployed.** `curl` with each shell UA against production during the gated preview window (§10 step 3). This rules out CDN caching of a buttons-on page.
3. **Device**, on the iOS (ios-iap) and Android (legacy-native) shells against production, with the preview cookie set:
   - no buttons on `/signin`, `/signup` or `/signup/athlete`;
   - a deep link to `/signup?as=adult` shows no buttons;
   - `/welcome` signs out or goes to the role home.

   Device QA is the final confirmation, not the guarantee.

## 5. App Store / Play exposure

- **Guideline 4.8** applies to login the *app* offers. With the buttons hidden in the shell, the iOS app offers none. This is our reading; Apple doesn't address web-only login. The residual risk is detection failing, mitigated by §4.4.
- **App Review notes:** state that the iOS app does not offer third-party login and that account deletion is in-app. A reviewer may otherwise read the shell's account deletion as implying Sign in with Apple account creation.
- **Google OAuth in the Android WebView** would fail with `disallowed_useragent` anyway; hiding prevents a broken button.
- **Merge timing:** the shell loads production. Don't merge the UI PR while an App Store or Play review is pending. The flags default **off**.

## 6. Apple-specific requirements

**Client secret.**
- Supabase doesn't generate or rotate it. It's an ES256 JWT signed with our `.p8`, valid for **at most 6 months**, and Apple sign-in silently breaks when it expires.
- Mitigation:
  - a rotation runbook in `docs/`: generate it with Supabase's tool (not in Safari), then paste it into Auth settings or `PATCH /v1/projects/$REF/config/auth`;
  - the expiry alert (§4.2 item 9);
  - a recurring Linear reminder at 5 months.

**Token revocation on deletion: D1, recommended TN3194 manual path.**
- **Facts:**
  - Apple's REST revoke needs a refresh or access token.
  - **Supabase doesn't store provider tokens.** `provider_refresh_token` exists only at the moment of the code exchange and may be empty for Apple.
  - Apple's revoke expectation is tied to App Store apps that support account creation, and it's worded "should".
  - TN3194 (2025-10) says that with no token you still delete the account and tell the user how to revoke manually.
- **Privacy ruling:** TN3194 is accepted for Phase A, on conditions:
  1. the instruction appears on the deletion confirmation **and** in the privacy policy;
  2. Phase B implements real revocation;
  3. **KC signs the deviation** from the strategist's "launch blocker" condition, in writing on the A4 issue.
- Storing encrypted long-lived provider tokens for a web-only flow would add a new class of secret for little gain.

**Private Email Relay.** Mail to `@privaterelay.appleid.com` bounces unless the sending domain or address is registered with Apple (Certificates, Identifiers & Profiles → Services → Sign in with Apple for Email Communication). Registration needs SPF passing on the Return-Path domain and/or DKIM `d=` matching the `From:` domain. Affected senders:
- **Resend `send.*`** (digest, alerts): register the domain.
- **Supabase Auth email** (password reset, which SSO-only users need to get a password for the app): if production uses Supabase's default sender, we **can't** register it. Move auth email to custom SMTP via Resend on our domain first (C6). **C6 is a precondition for turning Apple on.**
- **Stripe receipts:** these come from Stripe's domain unless Stripe's custom email domain is set up. Verify it (C7), or relay users won't get receipts.
- **Recovery limit:** a relay user who loses access to their relay address can't recover the account. `/welcome`'s relay line and the privacy policy say so.

**Name.** Apple web OAuth returns no name. That's fine; we don't use it.

## 7. Configuration checklist (KC, manual; the consoles need his login)

| # | Item | Where | Notes |
|---|---|---|---|
| C1 | Apple: confirm the App ID has Sign in with Apple. Create a **Services ID** (e.g. `com.fromvictoryapp.web`) with domain `www.fromvictoryapp.com` and return URL `https://kumrgeosgzdlxgljbyju.supabase.co/auth/v1/callback`. Create a **Sign in with Apple key** (.p8) and note the Key ID and Team ID | developer.apple.com | Store the .p8 in the password manager, never in the repo |
| C2 | Generate the Apple client-secret JWT (≤6 months). Enable Apple in Supabase, **Services ID first** in Client IDs, server-to-server endpoint blank. Set `APPLE_CLIENT_SECRET_EXPIRES_AT` in Vercel | Supabase → Auth → Providers; Vercel | |
| C3 | Google: OAuth consent screen (External; app name, logo, support email, privacy policy URL on fromvictoryapp.com, authorized domain). OAuth client type **Web application**, authorized JS origin `https://www.fromvictoryapp.com`, redirect URI = the Supabase callback. Minimum scopes (§4.1) | console.cloud.google.com | The privacy policy must be updated first (§7a) |
| C4 | **Google brand verification**, required for production. Needs Search Console ownership of fromvictoryapp.com and the privacy policy on the same domain | Google Cloud | Takes days. Start right after §7a |
| C5 | Supabase redirect allow-list: `https://www.fromvictoryapp.com/auth/callback` (exact). Confirm the Site URL. Confirm hosted **email confirmations = off** (the code says so; record it) | Supabase dashboard | |
| C6 | Confirm the hosted auth email sender. If it's Supabase's default, set up custom SMTP via Resend on our domain and register it with Apple Private Email Relay | Supabase, Resend, Apple | **Precondition for Apple on** |
| C7 | Register the Resend sending domain with Apple Private Email Relay (SPF/DKIM aligned). Decide on a Stripe custom email domain for receipts | Apple, Stripe | |
| C8 | Vercel env (Production): `ENABLE_SSO_APPLE` and `ENABLE_SSO_GOOGLE` = `off` | Vercel | Env changes need a redeploy to take effect |
| C9 | Decide on a Supabase custom auth domain (paid add-on) so consent screens show fromvictoryapp.com instead of `kumrgeosgzdlxgljbyju.supabase.co` | Supabase | D3 |

### 7a. Privacy policy and store disclosures (before any flag leaves `off`)

- **`app/privacy/page.tsx`** today names only Stripe. Add:
  - Google and Apple as sign-in providers;
  - what we receive: email and provider ID, plus possibly name and photo held by our auth provider and never used or shown;
  - that minors (13-17) don't use SSO;
  - that an unfinished sign-up's data is deleted within about an hour;
  - the Apple revoke instruction;
  - the relay-address recovery limit.

  This is a privacy-path change: kids-privacy-officer review, and KC approves the wording.
- **App Store privacy labels:** re-check "Contact Info: Email" and "Identifiers". The iOS app itself offers no SSO, so expect no change; record the check.
- **Play Data safety:** declare email collected via Google sign-in, not shared. Coordinate with the open Data safety Analytics item.

## 8. Security review points

### 8.1 Pre-account takeover via automatic linking (D2): live risk, must close before launch

**The attack.** Confirmations are off (§2), so anyone can create a password account with a victim's email. When the victim later signs in with Google or Apple using that email, Supabase links them **into the attacker-created account**, and the attacker still knows its password. Parent accounts hold minors' data, so accepting the risk is rejected (privacy, HIGH). Supabase's "remove unconfirmed identities on link" protection doesn't apply, because with confirmations off every identity counts as confirmed (backend). Q8 is therefore moot.

**Chosen mitigation: first-link hardening in the callback** (backend recommendation; satisfies privacy's "re-verify before dashboard access").
- **Detect:** after the exchange, the user has a profile, has an `email` identity, and the `apple`/`google` identity used for this sign-in was created within the last 10 minutes, later than the email identity.
- **Then:**
  1. Service-role `auth.admin.updateUserById(id, { password: <random 32 bytes> })`. This kills any password someone else knows.
  2. `supabase.auth.signOut({ scope: "others" })` with the user's own session. This revokes every other session.
  3. Land on the role home with a one-time notice: *"For your security we reset your password. Keep using Apple/Google, or set a new password with Forgot password."* KC approves the copy.
- **Why this is enough:** proving control of the email through Google or Apple is the re-verification. Rotating the password and revoking sessions removes the attacker's access.
- **Leftover risk:** athletes the attacker pre-created under that parent account remain visible to the victim. That's rare and visible, so support handles it; it goes in the support runbook.
- **Cost:** a legitimate parent who links Google once loses their old password and must use SSO or reset it.
- **Root-cause follow-up (not this issue):** turn on email confirmation for password signups using a code entered in the same session, so the profile insert still works.

**Tests:**
- unit and integration tests for the detection predicate and both side effects;
- a manual production check in A6 (KC's own accounts).

### 8.2 Other points

- **Open redirect:** the `next` allow-list (§4.2 item 3).
- **Role from the client:** `as` is a hint only. The role comes from the user's own validated completion submit; provider data never grants a role or entitlement.
- **A minor never ends up with a stored adult profile:** the zod check and the DB 18+ constraint.
- **A minor attempting SSO:** they hold an `auth.users` + `auth.identities` row (email, provider ID, maybe name/photo) only until they enter an under-18 birthdate (deleted immediately), cancel (deleted immediately) or abandon (reaped within about 75 minutes). No birthdate or profile is ever stored. This is disclosed in the privacy policy.
- **Parent path age:** today there's no check (parity). `/welcome` adds the 18+ parent/guardian attestation. A follow-up adds the same to password `signUp`.
- **Server Actions only:** `completeOnboarding` and `cancelOnboarding` are POST Server Actions (Origin-checked), never GET routes. User ids come from `getUser()`, never from the client.
- **Rate limits:** the completion action uses the `sign_up` IP bucket; the OAuth round trip is rate-limited by Supabase.

## 9. Decisions and open questions

| # | Item | Status / recommendation | Who signs |
|---|---|---|---|
| D1 | Apple revocation | TN3194 manual instruction (no token storage). Privacy accepted, with conditions | **KC, in writing**: deviates from the strategist's condition |
| D2 | Pre-account takeover | First-link hardening (§8.1) | KC approves; backend + privacy agreed |
| D3 | Custom auth domain (paid) vs supabase.co on consent screens | Recommend accepting supabase.co for launch and revisiting on uptake | KC |
| D4 | Sign-in button placement | Parent tab + a switch-tab button in the Athlete tab's 18+ paragraph (recommended), vs shared above the tabs | KC |
| D5 | Provider-metadata exception (auth holds name/photo for SSO users, never read) | Accept, with a CI guard + deletion proof + policy disclosure | **KC, in writing** |
| Q3 | Scrub provider metadata? | **Resolved:** no scrub (not durable); controls in §4.2 item 8 | Privacy (done) |
| Q4 | Orphan TTL | **Resolved:** 1h TTL, cron every 15 min | Privacy (done) |
| Q6 | All new copy (buttons, `/welcome`, errors, relay line, revoke note, reset notice, in-app-browser line) | Drafts in the A3 PR | KC at PR review |
| Q7 | Consent is never stored for any signup | Parity here. Prioritised follow-up: record terms version + timestamp for all signups, included in the deletion cascade | KC (file follow-up) |
| Q8 | Password after an unconfirmed user links Google | **Moot:** confirmations are off (§8.1) | — |
| Q9 | Does Forgot password give an OAuth-only user a usable password? | Unverified; prove it in A4 before any copy promises it | backend / QA |

## 10. Rollout and rollback

**Rollout.**
1. Write the §7a privacy policy update. Do config C1–C7. Get KC's sign-off on D1, D2, D4 and D5.
2. Ship A1 (backend) **with E2E run green by hand**. The `E2E Tests (non-required)` job isn't a merge gate, so run it before merging A1, or make it required for this arc. Ship A2 with the reaper in **dry-run** mode. Ship A3 (UI) with the flags **off**.
3. **Gated preview.** Set the flags to `preview`, so only browsers with the admin-set `fv_sso_preview` cookie see the buttons; everyone else sees nothing. Then:
   - run the §4.4 checks 2–3 with the cookie set;
   - KC tests a new Google user (parent);
   - KC tests a new Apple user with Hide My Email (adult);
   - KC tests an existing password parent linking Google (expect the password-reset notice);
   - KC tests an SSO-only user using Forgot password, then signing in inside the app;
   - KC tests deleting the Apple account and seeing the revoke instruction.
4. KC sets `ENABLE_SSO_GOOGLE=on`, then `ENABLE_SSO_APPLE=on` (Apple only once C6 is done). Each change is a redeploy. Add a dated `docs/gtm/product-truths.md` entry the same day.
5. **Watch for a week:**
   - reaper dry-run counts, then switch it to live;
   - `/welcome` drop-off;
   - the `error=oauth` rate in Vercel logs;
   - the first-link reset count;
   - support mail.

**Rollback.**
- **UI only:** set the flags to `off` (a redeploy). The buttons disappear and the backend paths stay harmless.
- **A1 regression** (the resolver and guards run on every authenticated request, flag or not): **Vercel instant rollback**, promoting the previous deployment. A flag flip does not undo A1.
- **Reaper:** set `REAPER_DRY_RUN=true`, or remove its `vercel.json` entry.
- **Provider disabled in Supabase:** SSO users keep their accounts and recover via Forgot password. That only works for Apple relay users if C6 is done, which is why C6 gates Apple on. Disabling a provider doesn't delete users.

**Counts (optional, within the strategist's limit):** an admin-metrics tile with SSO vs password signups, derived from `auth.identities.provider` joined to `profiles`. No new event table. This is a follow-up, not Phase A.

## 11. Delivery breakdown (filed after approval; Tier 2 unless noted)

| Issue | Owner | Contents | Depends on |
|---|---|---|---|
| A0 Provider, email and policy setup | KC (manual) + lead | C1–C9; the §7a privacy-policy PR (privacy path); App Review notes text | — |
| A1 OAuth session handling + first-link hardening | backend-engineer | §4.2 items 1–5, 8, 9; callback; `completeOnboarding` / `cancelOnboarding`; §8.1; CI metadata guard; tests | D2, D5 |
| A2 Orphan reaper | backend-engineer | §4.2 item 6: migration (finder function, grants, RLS harness), cron route, root `vercel.json`, dry-run flag | A1 |
| A3 SSO buttons + `/welcome` UI | frontend-engineer | §4.3: `off`/`preview`/`on` flags + admin preview cookie; the `showOAuth` helper; SW bypass in both files + cache bump; `/welcome`; copy drafts for KC | A1, FV-657 merged, D4 |
| A4 Deletion + app-password path | backend-engineer + frontend-engineer | Apple revoke notice (§4.2 item 7); prove Q9 and wire the Forgot-password guidance | A1, D1, C6 |
| A5 Docs + runbook | lead | Apple secret rotation runbook + reminder. CLAUDE.md "Out of scope" line → *"social sign-in for minors (13-17) and native/in-app SSO"*, with the same edit in `.claude/agents/product-strategist.md:67` (privacy path). Support runbook: relay accounts, no manual merges, attacker-created athletes | KC approves this spec |
| A6 Device QA + launch | qa-reviewer + KC | §4.4 checks; §10 steps 3–5; product-truths entry | A0–A4 |
| Follow-ups | — | Persist consent for all signups (Q7); 18+ parent attestation on password `signUp`; email confirmation by code for password signups (§8.1 root cause); SSO-vs-password admin tile | — |
| B Native SSO (Phase B) | discovery, KC opens | Native Sign in with Apple on iOS + `signInWithIdToken`, **real revocation** (token storage); Google via the system browser / Android Credential Manager; new-plugin review. Ships with the next app builds; iOS must offer Apple alongside Google | Phase A live + uptake data |

**Review chain for every code PR:** `/review` → qa-reviewer → kids-privacy-officer → KC merge.

## 12. Test matrix

### Unit (Vitest)

**Resolver:**
- none
- email-only orphan → sign-out (unchanged)
- `app_metadata.providers` containing google or apple with no profile → `needs_onboarding`
- each role
- **query error → `error`** (not onboarding)

**Guards:**
- each `require*` and `redirectIfAuthed` with `needs_onboarding` → `/welcome`
- `requireOnboarding` with orphan → `/auth/signout`
- the native-shell router is unchanged for `needs_onboarding` (it signs out)
- **keep** the existing `guards.test.ts` case "no profile row → /signin" for the email-only orphan

**Callback:**
- success with a profile → role home or an allowed `next`
- success with no profile → `/welcome`
- provider `error` → `/signin?error=oauth`
- bad code → `/signin?error=oauth`
- `next` = `//evil`, `/admin`, an absolute URL or a backslash → role home
- recovery flow → `/reset-password`; a recovery error → `?reset=invalid`
- recovery for a user with no profile

**First-link hardening (§8.1):**
- the predicate is true only for a fresh OAuth identity on an existing user that has an email identity and a profile
- it rotates the password and revokes other sessions
- it does not run on later sign-ins
- it does not run for OAuth-first users

**`completeOnboarding`:**
- parent success, including the attestation requirement
- adult success
- adult under 18 → user deleted and signed out, birthdate never logged
- adult with the flag off → rejected
- `as=adult` can't grant a role
- double submit / PK `23505` → redirect, **no delete**
- account deleted mid-flow
- missing consent → field error
- rate limit
- never reads provider metadata

**`cancelOnboarding`:**
- deletes only a `needs_onboarding` user
- re-check: a profile created in between → no-op
- idempotent

**`showOAuth`:**
- web UA with the flag on → true
- `ios-iap` / `legacy-native` UAs (current and older builds) → false
- each deny-listed in-app UA, `; wv)`, and iOS without `Safari/` → false
- flag `off` → false
- `preview` without the cookie → false; `preview` with the cookie → true

**Reaper:**
- selects only OAuth users with no profile older than the TTL
- never touches a user with a profile, and never an email-only user
- respects dry-run and the per-run cap
- re-checks before deleting
- `CRON_SECRET` auth

**Static and CI:**
- the provider-metadata grep guard
- `sw-route-strategy.test.ts` includes `/welcome`
- `middleware-matcher.test.ts` and `native-shell-router.test.ts` cover `/welcome`

**Existing tests to update:** `signin-native-shell.test.tsx` and `signup-routing.test.tsx` mock `@/lib/native-shell` with only `getRequestShellCapability`. Add the new helper to those mocks.

### RLS harness

- The finder function: `EXECUTE` is revoked from `PUBLIC`, `anon` and `authenticated`, and is service_role only. This is effect-based.
- A behavioural reaper test with `fixtures.sql` users, with and without a profile.

### Deletion proof

After `deleteAccount` and after the reaper, no `auth.users` or `auth.identities` row remains.

### E2E (Playwright, local Supabase, no real providers in CI)

**Seeding:**
- A user with `auth.admin.createUser({ app_metadata: { provider: "google", providers: ["google"] } })` and no profile. The resolver keys on `app_metadata.providers`, so no `auth.identities` row is needed.
- **Fresh seed per test:** the scenarios consume the user.

**Session:**
- A Node-side `signInWithPassword` (seeded password) plus `@supabase/ssr` cookie injection into the Playwright context.
- **No app route** for this. Note the coupling to the cookie-chunk format.
- It's a new pattern next to `global-setup`'s UI-driven login.

**Projects:** a new Playwright project with its own `testMatch`, plus an auth-less project for injected cookies.

**Cleanup:** `global-setup` and `global-teardown` delete these users. Paginate `listUsers()`.

**Env:** set `ENABLE_ADULT_SIGNUP` and `ENABLE_SSO_*=on` in `ci.yml` (CI runs a prod build). The shared `sign_up` IP bucket (15/h) must not starve the existing signup tests: clear `auth_rate_limit_events` for the test IP between tests, or seed below the limit.

**Scenarios:**
- `/welcome` parent completion → `/dashboard`
- adult completion → `/subscribe`
- adult under 18 → deleted
- "Use a different account" → deleted
- guarded routes → `/welcome`
- shell UAs (flags on) → no OAuth button in the SSR HTML (§4.4 check 1)

### Accessibility (manual WCAG pass until axe is wired)

- buttons: focus, labels, contrast on onyx, `aria-live`
- `/welcome`: tap cards, focus order, autofocus
- error banners: `role="alert"`, focus moves to them

### Manual / device (A6, flags at `preview` with the cookie)

| Case | Web (Safari, Chrome) | iOS shell | Android shell |
|---|---|---|---|
| Buttons on /signin Parent tab, /signup, /signup/athlete | ✅ visible | ❌ none | ❌ none |
| Deep link /signup?as=adult and /welcome | works | no buttons; /welcome → sign-out / home | same |
| `curl` with each shell UA against production | — | no button markup | no button markup |
| New user via Google → /welcome → parent | ✅ | n/a | n/a |
| New user via Apple (Hide My Email) → /welcome → adult | ✅ | n/a | n/a |
| Existing password parent signs in with Google (same email) → reset notice, lands on /dashboard, old password no longer works, other sessions signed out | ✅ | other session signed out ✅ | ✅ |
| SSO-only user → Forgot password → sets a password → signs in inside the app (incl. an Apple relay address) | ✅ | ✅ | ✅ |
| Delete account (Apple identity) → revoke instruction shown | ✅ | ✅ | ✅ |
| Cancel at Google consent → friendly error, focus on the banner | ✅ | n/a | n/a |
| Instagram in-app browser → no buttons, "open in Safari/Chrome" line | ✅ | n/a | n/a |

## 13. Review log (v1 → v2)

- **backend-engineer:** SUGGEST_REVISION.
  - Confirmations are off in production, so the takeover risk is live; first-link hardening adopted.
  - No rollback-delete in `completeOnboarding`.
  - TOCTOU re-checks before deletes.
  - Finder-function hardening.
  - `maybeSingle` + error state.
  - The `next` allow-list must include `/reset-password` and `/subscribe`.
  - `hasAppleIdentity` computed before deletion.
  - Q9 moved to unverified.
- **frontend-engineer:** SUGGEST_REVISION.
  - SW bypass in both files + cache bump.
  - Gold focus ring, not cobalt.
  - Concrete provider-button specs.
  - Placement for confused adults (D4).
  - `/welcome` phone UX.
  - A fuller in-app-browser list.
  - Disable while redirecting.
  - Error-banner focus.
- **qa-reviewer:**
  - The device check with flags off proved nothing; now flags on, with automated SSR UA tests and older-build fixtures.
  - Rollback for A1 = Vercel instant rollback.
  - E2E is non-required: run it by hand.
  - Reaper dry-run, cap and re-check.
  - The gated preview replaces a public "test window".
  - C6 gates Apple on.
  - E2E seeding via `app_metadata.providers`.
  - Additional unit cases, and the existing mocks to update.
- **kids-privacy-officer** (spec review, not a PR verdict):
  - D2 option (b) rejected.
  - Metadata: no scrub, plus a CI guard, deletion proof and a KC-signed exception.
  - Privacy policy and store disclosures added (§7a).
  - TTL 1h with a 15-minute cron.
  - Parent 18+ attestation on `/welcome`.
  - TN3194 accepted with conditions.
  - Consent persistence as a prioritised follow-up.

[FV-654]: https://linear.app/adeptiv/issue/FV-654
[FV-657]: https://linear.app/adeptiv/issue/FV-657

## Sources

**Supabase:**
- Apple: https://supabase.com/docs/guides/auth/social-login/auth-apple
- Google: https://supabase.com/docs/guides/auth/social-login/auth-google
- Provider tokens not stored: https://supabase.com/docs/guides/auth/social-login
- Identity linking: https://supabase.com/docs/guides/auth/auth-identity-linking
- Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- PKCE: https://supabase.com/docs/guides/auth/sessions/pkce-flow

**Apple:**
- Revoke tokens: https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens
- TN3194: https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple
- Account deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Private Email Relay: https://developer.apple.com/help/account/capabilities/configure-private-email-relay-service/
- App Review Guidelines 4.8 / 5.1.1(v): https://developer.apple.com/app-store/review/guidelines/
- Manual revoke: https://support.apple.com/en-us/102571

**Google:**
- OAuth policies (embedded user agents, brand verification): https://developers.google.com/identity/protocols/oauth2/policies
- Brand verification: https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- Embedded WebView change: https://developers.googleblog.com/en/upcoming-security-changes-to-googles-oauth-20-authorization-endpoint-in-embedded-webviews/

**Unverified (confirm during A0/A1/A4):**
- the exact Apple and Google scopes Supabase's hosted flow sends;
- whether `provider_refresh_token` is populated for Apple web sign-in;
- whether Forgot password gives an OAuth-only user a usable password (Q9);
- the hosted email-confirmation and SMTP settings (C5, C6).
