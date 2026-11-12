# FV-569: Sign in with Apple + Google (parents and 18+ athletes), spec

**Status:** v4 + §13a billing coordination (2026-11-11), for KC approval (discovery deliverable). Nothing is built, configured, or changed in any account. No spend is introduced.
**Date:** 2026-11-11.
**Supersedes:** v1–v3. Superseded decisions are in §14 and are not open options.
**Issue:** FV-569. Delivery issues (§12) are filed on approval.

## 1. Scope (settled)

| | In scope | Out of scope |
|---|---|---|
| Who | `parent`, `adult_athlete` (18+) | Minor athletes (13–17): username/password and parent invites are unchanged. No SSO, no linking, no "upgrade at 18". |
| Where | Web browsers, the **iOS app**, and the **Android app**. Native is required scope. Web may reach production first as an internal milestone. | Embedded-WebView OAuth. Social in-app browsers on the web. |
| Providers | Apple and Google, through Supabase Auth plus Apple's REST API (code redemption and revocation) | Any other provider. No third-party auth SDK. |
| Accounts | One Supabase user per person across web, iOS and Android, so subscriptions and athletes follow the user id | A manual link/merge UI |
| Users today | **Beta/test only.** A one-time transition replaces customer migration UX (§8). | — |

Email/password stays available for parents and 18+ athletes. New password signups prove email ownership with a typed code (§4).

## 2. Facts this design rests on (verified 2026-11-11)

### Code (`main` @ 6790398)

**Auth and session behaviour**
- **Email confirmation is OFF in production.**
  - Signup inserts the profile using the session that `auth.signUp` returns (`lib/actions/auth.ts:97-102`).
  - With autoconfirm on, GoTrue treats provider emails as verified when linking (supabase/auth `internal/models/linking.go`).
- **A session with no profile is treated as an orphan:**
  - `redirectIfAuthed` sends it to `/auth/signout` (`lib/auth/guards.ts:230`).
  - The `require*` guards send it to `/signin`.
  - The shell router signs it out (`lib/native-shell-router.ts:114`).
  - The guards use `.single()`, so any error reads as "no profile".
- **Every server gate uses `auth.getUser()`.** That is 18 call sites, including middleware. None uses `getClaims` or `getSession`. `jwt_expiry = 3600`.
- **Synthetic athlete accounts are created already confirmed** (`email_confirm: true`, `lib/actions/athletes.ts:287`), and so are the e2e seeds (`e2e/global-setup.ts:263,341`). Turning Confirm email ON does not block athletes.
- `signIn` collapses every error to one generic message (`auth.ts:168-174`).
- The signup rollback deletes the user if the profile insert fails (`auth.ts:99-122`, `auth-adult.ts:150-165`).

**Accounts, billing and deletion**
- **Entitlements and data key on the account id:**
  - Stripe uses `parent_id` / `client_reference_id`.
  - Apple IAP uses `appAccountToken` → `payer_id`.
  - Profiles use `profiles.id` = `auth.users.id`.
- **Deletion.** `deleteAccount` (`lib/actions/account.ts:169`) deletes immediately. It is gated by `requireSubscriber()` and cascades from `auth.users`.
- **Reviewer accounts exist and must be preserved:**
  - the App Review demo (`docs/fv210-resubmission-packet.md` §F);
  - the Play reviewer (`apps/web/scripts/provision-play-review-account.ts`).
- `app/privacy/page.tsx` names only Stripe.

**Native shell (Capacitor 8)**
- Plugins: core, app, splash-screen and status-bar. App-local plugins: `FVAppleIAPPlugin` (iOS) and `FVNarration`, called through `window.Capacitor.Plugins.*`.
- iOS 15.0. Android minSdk 24.
- The UA token is `FVNativeShell/1` (plus `(ios)`). There is no build version in it.
- An `appUrlOpen` listener exists.
- There is no Sign in with Apple entitlement, no custom URL scheme, and no Play Billing plugin yet.

### Staging (existing, reused, no new spend)

Source: KC's 2026-11-06 Google Play readiness record, lines 9–17. Rechecked read-only on 2026-11-11.

**Supabase `fv-android-staging`**
- Project `xmznvajmljhfmexjthlz`, Free org "FV Staging" (`fadrmxjnicoiobgwyjum`), us-east-1. Isolated from production.
- 56 migrations applied; all public tables have RLS. The 21-file RLS harness passed with synthetic users.
- "No auth settings changed."
- The Supabase MCP connector can't see this org. The dashboard and CLI can: `supabase projects list` shows it on 2026-11-11.

**Vercel `fv-android-staging-web`**
- https://fv-android-staging-web.vercel.app. `/signin` returned 200 on 2026-11-11.
- Test credentials only; Stripe test mode.
- No Git integration and no crons. It deploys a chosen branch through the CLI.

**Gaps to close before use (setup, not spend)**
- Apply the one newer migration, `20261106120000_athlete_invitations.sql`.
- Configure auth providers, SMTP and OTP.
- Unpause the Free project before each validation window (Free projects pause when inactive).
- Invoke the reaper manually with `CRON_SECRET`, since staging has no crons.
- Point native staging builds' `CAPACITOR_SERVER_URL` at the staging site, and add the staging hosts to their allow-lists.

### Providers (sources in §15)

**Supabase**
- **PKCE:** the verifier lives in the cookies of the browser or WebView that started the flow. The code is single-use and lasts 5 minutes. Custom URL schemes are allowed redirect URLs.
- **`signInWithIdToken`:** accepts Apple and Google ID tokens. The nonce goes SHA-256 to the provider and raw to Supabase. The Apple `aud` may be any listed Client ID, Services ID first. Supabase **does not redeem Apple authorization codes**.
- **Email OTP:** the template uses `{{ .Token }}`, and `verifyOtp({ type: "email" })` confirms. **Built-in SMTP only delivers to project team members, at 2 per hour**, so custom SMTP is required.
- **Identity linking:** the same email links automatically. Linking "remove[s] any other unconfirmed identities", which depends on Confirm email being ON.
- **Sessions:** no `signOut` scope invalidates access JWTs that were already issued. `getUser()` rejects a deleted user or a revoked session; `getClaims()` with asymmetric keys does not. JWT expiry ≥5 minutes is recommended.
- **Hiding buttons does not disable** Supabase's `/authorize` endpoint or our routes (§13 rollback).

**Apple**
- Codes are single-use, last 5 minutes, and are redeemed at `/auth/token` with `client_id` = the App ID (native) or the Services ID (web).
- The token response includes an `id_token` and a `refresh_token`.
- Revoke must use the same `client_id`.
- TN3194: validate the code server-side and **securely store the token response** for new accounts. Manual revocation is the fallback only when no credential exists.
- The private relay email is per developer team, and `sub` is team-scoped (to be verified).

**Native**
- `@capacitor/browser` uses SFSafariViewController on iOS, which is not an auth session.
- `ASWebAuthenticationSession` with a custom scheme works on iOS 15 and delivers only to the calling app.
- Chrome may not hand an auto-redirect to an app. Auth Tab (Chrome 137+, `androidx.browser` 1.9) fixes this, with a Custom Tab fallback.

## 3. Entry points (one door for both adult roles)

### `/signin`
- **Primary section, "Parent or Athlete 18+":**
  1. Continue with Apple
  2. Continue with Google
  3. "or use email"
  4. Email + password
- **Secondary section, "Athlete under 18? Sign in with your username":** the existing username form and invite help. No SSO.
- This replaces the Parent/Athlete tabs. FV-657 merges first.

### `/signup`
- The FV-515 chooser stays: "Parent" / "Athlete 18+".
- Each form shows Apple, Google, then "or use email".

### Apps
- The same pages render natively-handled buttons (§6) **only** in builds whose UA carries `FVAuth/1`. Older installed builds never show SSO.

### Visibility rule
`showSSO(surface)` is server-rendered per request. It is true only when the surface flag is on **and** the surface is capable:
- **Web:** not a shell UA, and not a denylisted in-app browser. The denylist is Instagram, `FBAN/FBAV`, TikTok, `Line/`, Snapchat, `TwitterAndroid`, `LinkedInApp`, Pinterest, Android `; wv)`, and iOS WebKit without `Safari/`. Denylisted browsers show the line "Open in Safari or Chrome to use Apple or Google."
- **Shell:** the UA contains `FVAuth/1`.

### Flags
- `SSO_WEB`, `SSO_IOS` and `SSO_ANDROID`, each `off | preview | on`.
- `preview` shows the buttons only when an admin-set `fv_sso_preview` cookie is present.
- Apple and Google are always enabled together per surface (guideline 4.8).

## 4. Verified email/password signups (before any SSO launch)

### Settings
- **Confirm email: ON, permanently, once A1 ships** (§13 rollback).
- Code template: a 6-digit `{{ .Token }}`. Expiry 15 minutes. Resend cooldown 60 seconds.
- **Custom SMTP through the existing Resend account.** Production uses our verified domain. Staging uses the **same verified domain** with a distinct From address, so no new domain or plan. The domain is registered with Apple Private Email Relay (SPF/DKIM aligned).

### Two-step signup
Both `signUp` and `signUpAdultAthlete` convert.

1. **`startEmailSignup` (server action):**
   - Validates the full schema **before** calling `auth.signUp`: the adult 18+ birthdate or the parent 18+ guardian attestation, consent, and the `sign_up` rate limit.
   - On failure: **no auth row and no email.**
   - Calls `auth.signUp` without `options.data`. No session comes back.
   - The form fields stay in client state and are never written to `user_metadata`.
2. **`completeEmailSignup` (server action):**
   - Calls `verifyOtp({ email, token, type: "email" })`.
   - Then runs the completion transaction (§5.2): re-validation, under-18 handling, profile insert.
   - **Never deletes on an insert failure.** The legacy rollback is removed.

### Legacy accounts with a profile (§8)
- **`verifyEmailOnly`:** `verifyOtp`, with no insert.
- `signIn` gains one branch: after a correct password, `email_not_confirmed` → "Enter the code we sent" (with resend) → `verifyEmailOnly`. The branch appears only after a correct password, so it doesn't enable enumeration.

### Rate limits
New `signup_verify` and `signup_resend` buckets, per email. They need the CHECK migration.

### Result
- Every new password account has a verified owner.
- Supabase removes an unconfirmed password identity when the real owner links Apple or Google.
- No extra code is asked after a verified Apple or Google sign-in.

## 5. Server design (all surfaces)

### 5.1 Session state and gates

`getSessionState()` returns `none | orphan | pending | parent | athlete | adult_athlete | error`. It uses `.maybeSingle()`; a query error returns `error`.

**One deletability predicate, used everywhere:** `private.is_unestablished(uid)`. It is true when there is:
- **no profile row**, and
- **no established-account data**: no `subscriptions`, `apple_subscriptions` or `apple_purchase_tokens` row as payer, no comp grant, and no athletes.

Two routing states build on it. Both are deletable by the §5.2 paths, and nothing else is:
- **`pending`**: `is_unestablished`, plus either an `apple`/`google` provider in `app_metadata.providers` or an email identity with `email_confirmed_at` set. It routes to `/welcome`.
- **`orphan`**: `is_unestablished`, plus an email-only identity with `email_confirmed_at` null (an unverified signup). It keeps today's sign-out.

**Gates:**
- `redirectIfAuthed` and every `require*` send `pending` to `/welcome`.
- `requireOnboarding()` sends `orphan` to `/auth/signout`.
- The shell router sends `pending` to `/welcome` only in `FVAuth/1` builds.

**Invariant:** gates use `getUser()`. `getClaims()` alone never gates access.

### 5.2 Completion, cancellation and the pending-account lock

**Rule: every destructive path requires deletability, re-checked in the same locked transaction that deletes.**
- Onboarding, cancel and reaper code may delete a user **only** when `is_unestablished(uid)` is true.
- That check runs **inside the same locked transaction that performs the delete**.
- An established account is never deleted by these paths, whatever fields were resubmitted.

**Lock and tombstone** (migration; `security definer`, `search_path = ''`)
- **Per-user lock.** Every function below takes `pg_advisory_xact_lock(hashtextextended(user_id::text, 0))`. This serializes completion, cancellation and reaping for each user.
- **`private.pending_account_deletions` (tombstone).** Columns: `user_id` PK, `reason` (`underage | cancel | reaper`), `created_at`, `attempts`. While a tombstone exists, completion is refused.
- **`complete_pending_profile(...)`** (granted to `authenticated`; acts only on `auth.uid()`). Under the lock:
  1. A tombstone exists → raise `account_closing`.
  2. A profile exists → return `already_complete` and insert nothing (the two-tab case).
  3. Validate the role-specific fields. DB constraints are the backstop: 18+ for adults, `birthdate_role_consistency`, `sport_role_consistency`.
  4. An adult under 18 **and** pending → write a tombstone (`underage`) and return `reject_underage`.
  5. Otherwise, insert the profile and return `created`.
- **Marking a pending deletion: two separate functions, so callers can't spoof the target or the reason.**
  - **`cancel_my_pending_account()`** (`authenticated`). Takes **no parameters**: it acts only on `auth.uid()`, and the reason is fixed to `cancel`.
  - **`reaper_mark(user_id)`** (`service_role` only; execute revoked from everyone else). The reason is fixed to `reaper`.
  - Both run under the lock: `is_unestablished` false → return `not_pending`, nothing is deleted. True → insert a tombstone and return `marked`.
  - Underage tombstones are written only inside `complete_pending_profile`.
- **`finalize_pending_deletion(user_id)`** (`service_role` only). This is the **only** delete path. Under the lock, in one transaction:
  1. If there is no tombstone, return `no_tombstone`.
  2. If `is_unestablished` is false, delete the tombstone and return `not_pending`. Nothing is deleted.
  3. Otherwise run `delete from auth.users where id = $1`. The cascade removes identities, sessions, refresh tokens, Apple token rows and the tombstone. Return `deleted`.

  The delete is done in SQL, not with `auth.admin.deleteUser`, so the re-check and the delete are atomic. Gate S11 proves that this cascade matches what the admin API removes.

**Defence in depth.** Established data can't appear without a profile:
- the `/subscribe`, Apple purchase-token and athlete creation paths all require a profile;
- a tombstone blocks profile creation.

The finalize re-check catches anything else.

**App side, after `reject_underage` or `marked`:**
1. Revoke Apple tokens (§5.5). This is an external call; the tombstone holds completion meanwhile.
2. Call `finalize_pending_deletion(uid)`.
3. Sign out. For underage, go to `/signup?error=age`. Log counts only; never log the birthdate.

**If revoke or finalize fails, the tombstone stays and the reaper retries:**
- up to 3 revoke attempts per run;
- after 5 failed revoke runs, call `finalize_pending_deletion` without revoking (TN3194: the deletion must be fulfilled). **It still re-checks under the lock.** Raise an alert.
- User-facing paths show the manual Apple-revoke instruction whenever revoke didn't succeed.

**`/welcome`** is server-rendered, `noindex` and has no analytics. It is in the SW bypass list, in both `public/sw.js` and `lib/sw/route-strategy.ts` (bump `CACHE_VERSION`). It shows:
- "Signed in as <email>" (the auth email only).
- Two account-type cards, preselected by the `as` hint. When the adult flag is off, it is parent-only.
- **Parent:** first_name, consent, and the "parent or guardian, 18 or older" attestation.
- **Adult:** first_name, birthdate (`autocomplete="bday"`), sport, attestation and consent, in `AuthStep` steps.
- "Use a different account": a quiet link with a confirm step. It runs `cancelOnboarding`, which calls `cancel_my_pending_account()`.
- A relay line: "Signed in with a hidden Apple email and already have an account? Use a different account, then sign in your usual way."

**`completeOnboarding` / `completeEmailSignup`** both call `complete_pending_profile`. They are POST Server Actions and use the `sign_up` IP bucket. Results:
- `created` → the role home. Routing is as today; legacy-native Android sends adults to `/athlete`.
- `already_complete` → the role home.
- `account_closing` → sign out.

### 5.3 Google (all surfaces): Supabase-hosted OAuth with PKCE

**Flow:**
1. JS in the browser or WebView calls `signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: inApp, scopes: "openid email" } })`. The verifier lands in that context's cookies.
2. **Web:** `redirectTo` = `https://www.fromvictoryapp.com/auth/callback?next=…`.
3. **Apps:**
   - `redirectTo` = `com.fromvictoryapp.app://auth/callback`.
   - `FVAuth.startSession` opens the provider URL and returns the callback URL.
   - The WebView then navigates to `/auth/callback?code=…&next=…`, so the exchange uses the WebView's verifier.
   - An intercepted custom-scheme URL is useless without that verifier (RFC 8252 §8.1).

**`/auth/callback`:**
1. Handle provider `error` params first.
2. Exchange the code.
3. `next` allow-list: `/welcome`, `/dashboard`, `/athlete`, `/subscribe`, `/reset-password`. Anything else → the role home.
4. Errors → `/signin?error=oauth`. Recovery errors keep `?reset=invalid`.
5. `pending` → `/welcome`.

### 5.4 Apple (all surfaces): we redeem and bind the code; Supabase signs in by ID token

**Fail-closed rule:** every Apple sign-in must end with a **bound, stored** refresh token, or the sign-in fails.

#### Binding rule (`bindAppleGrant`)
All of these must hold before any token is stored for a user:
1. **The supplied ID token** (native sheet or Apple `form_post`) is verified against Apple's JWKS:
   - `iss = https://appleid.apple.com`;
   - `aud` = the client expected for this flow: the bundle ID on iOS native, the Services ID on web and Android;
   - `exp` is in the future;
   - `nonce` = SHA-256 of this transaction's raw nonce.
2. **The code is redeemed** at `/auth/token` with that **same** `client_id`.
3. **The response's `id_token`** is verified the same way. It must also match the supplied token:
   - **Strictly:** `sub` equals the supplied token's `sub`, and `aud` equals the redemption `client_id`.
   - **`nonce`** is **required** to match on every flow where S5 shows Apple returns it. The S5 result is recorded in this spec and becomes a hard rule.
   - **`auth_time`** must match when present.
4. **The Supabase session user's** `apple` identity `provider_id` equals that `sub` (checked after `signInWithIdToken`).
5. **Same transaction:**
   - web and Android: `state` matches the cookie or handoff row;
   - iOS: the code and token come from the same `ASAuthorizationAppleIDCredential` within one `appleNativeSignIn` request.

#### Failure handling
- **Any binding failure or a redemption failure:**
  1. Revoke the redeemed refresh token, if one was obtained.
  2. Sign out any session just created.
  3. Redirect to `/signin?error=oauth`.
- **Token storage fails after sign-in:** revoke, sign out, error.
- **Result:** no Apple account is left signed in without a stored credential.

#### iOS app (native sheet)
1. `FVAuth.signInWithApple({ nonceHash })` uses `ASAuthorizationAppleIDProvider` with scope `email`. It returns `identityToken` and `authorizationCode`. The raw nonce stays in WebView JS.
2. `appleNativeSignIn` (POST Server Action):
   1. Verify the supplied token.
   2. Redeem with `client_id` = the bundle ID.
   3. Bind.
   4. `signInWithIdToken` (cookie client).
   5. Identity check.
   6. Store.
   7. Resolve state.

#### Web (our own routes, no Apple JS SDK)
1. **`/auth/apple/start`:**
   - Generates `state` and a raw nonce, stored in `__Host-` cookies (HttpOnly, Secure, `SameSite=None`, 10 minutes, single-use).
   - Redirects to Apple `authorize` with the Services ID, `response_type=code id_token`, `response_mode=form_post`, `scope=email`, `nonce=SHA256(raw)` and `state`.
2. **`/auth/apple/callback`** (POST):
   - Exempt from Origin/CSRF middleware, because Apple posts from `appleid.apple.com`. `state` is its CSRF defence.
   - Verifies `state`, then: verify → redeem → bind → `signInWithIdToken` → identity check → store.
   - Clears the cookies and redirects.

#### Android app (Auth Tab, with a handoff into the WebView)
1. **Start.** The WebView generates a handoff `verifier` and keeps it in JS memory. It opens `/auth/apple/start?app=android&challenge=SHA256(verifier)` in `FVAuth.startSession`.
2. **Callback.** `/auth/apple/callback` verifies `state`, then verify/redeem/bind (steps 1–3 and 5). It does **not** create a session. It writes a handoff row to `private.apple_signin_handoffs`:
   - `id` (≥128 bits of entropy), `state` = `pending`;
   - the challenge and `state`;
   - the encrypted supplied ID token and raw nonce;
   - the encrypted refresh token, `client_id` and `sub`;
   - `attempts` = 0, `expires_at` = now + 3 minutes.

   It then redirects to `com.fromvictoryapp.app://auth/callback?handoff=<id>`.
3. **`appleHandoffComplete({ handoff, verifier })`** (POST, IP rate-limited):
   1. **Atomic claim with a fencing token:**

      ```sql
      update … set state='claimed', claim_id=gen_random_uuid(), claimed_at=now()
      where id=$1 and state='pending' and expires_at>now()
      returning *
      ```

      If no row comes back, the handoff was replayed, is already claimed, or has expired. Return an error.
   2. **Verifier check.** If SHA256(verifier) ≠ challenge:
      - `attempts += 1` and `state = 'pending'`, guarded by `claim_id`. The encrypted credentials are kept.
      - At 5 mismatches, `state = 'burned'`. The purge revokes a burned row, then deletes it.
      - **Only verifier mismatches count toward attempts.** Transient failures (steps 3–4) don't.
      - **Accepted limit:** whoever intercepts the custom-scheme URL can burn the handoff with 5 bad verifiers. That is a denial of service only, never a takeover, and the user simply signs in again.
   3. **Sign-in.** `signInWithIdToken` with the stored ID token and raw nonce (WebView cookie client), then the identity check.
   4. **Durable transfer.** `finalize_apple_handoff(handoff_id, claim_id, user_id, ciphertext…)` runs in **one transaction**:
      - `delete … where id=$1 and claim_id=$2 and state='claimed' returning`. **If no row comes back, abort**: the claim went stale or was purged.
      - Then upsert the token (§5.5).
   5. **If step 3 or 4 fails** (sign-in error, storage error, stale fence, or an interrupted request):
      - **Sign out any session created in step 3.** The fail-closed rule applies.
      - If the row still exists with this `claim_id`, reset it to `pending` with its credentials kept, so the WebView can retry with the same verifier.
      - A `claimed` row older than 2 minutes is treated as interrupted. It is reset to `pending` with a new `claim_id` on the next claim, or purged once it expires. A slow original request then fails its fence in step 4 and signs out.
      - **The refresh token is never deleted until it has been either transferred (step 4) or revoked.**
4. **Purge** (opportunistic, plus the reaper). Expired, burned and stale-claimed rows are revoked with the stored refresh token first, then deleted. If revoke fails, the row is kept and retried. After 5 runs it is deleted and an alert is raised.
5. **Why this is safe:**
   - a stolen handoff id is useless without the verifier;
   - replaying the stored ID token is blocked by single-use claiming and the server-held nonce.

#### Secrets
- `APPLE_TEAM_ID`, `APPLE_KEY_ID` and `APPLE_SIGNIN_P8`: Vercel Sensitive, separate for production and staging.
- Client secrets are minted per request with a 5-minute expiry. **There is no 6-month rotation.**
- Supabase's Apple provider holds Client IDs only, the Services ID first, then the bundle ID.
- The Services ID is grouped with the primary App ID.

### 5.5 Apple token storage and revocation

**`private.apple_signin_tokens`**
- Columns: `user_id` (FK to `auth.users`, on delete cascade), `client_id`, `sub`, ciphertext, `iv`, `tag`, `key_version`, `created_at`. Primary key `(user_id, client_id)`.
- RLS is on with **no policies**. `revoke all` from `public`, `anon` and `authenticated`.
- The `private` schema is not exposed to PostgREST, and `usage` is revoked. The harness asserts both.
- Encryption: AES-256-GCM. The key is `APPLE_TOKEN_KEY`, separate for staging and production.
- AAD: `"token|"+user_id+"|"+client_id`. Handoff rows use `"handoff|"+id`.
- Tokens are never logged.
- **Only the refresh token is stored.** That is enough for its sole purpose, revocation.
- **Storing on every path is an upsert** on `(user_id, client_id)`. Every Apple redemption issues a new refresh token, so a second sign-in replaces the row.
  - **The replaced token is not revoked.** Apple's revoke ends the user's whole authorization for the app, so revoking the old token would also kill the new one.
  - Revoking the current token at deletion ends the authorization, which also invalidates older tokens. S5 proves this; if S5 disproves it, the spec switches to keeping every token and revoking each one at deletion.

**Revoke before every delete.** `revokeAppleTokens(userId)` uses each row's `client_id` and runs before:
- `deleteAccount`, per deleted user: the payer and any adult athletes (`account.ts:291-322`);
- the §5.2 under-18, cancel and reaper paths;
- the handoff purge.

**Failure:**
- §5.2 covers tombstone retries; §5.4 covers handoff retries.
- `deleteAccount`: 3 retries inline. If they all fail, delete anyway, show the manual instruction and raise an alert.
- `hasAppleIdentity` is computed before the delete.

### 5.6 Residual access

- **Server-rendered pages and actions:** `getUser()` rejects revoked sessions and deleted users immediately.
- **Direct PostgREST with an access JWT that is still held:** the JWT works until it expires. After deletion the cascade has removed the rows and FKs block inserts. After sign-out, only a copied token keeps working.
- **`jwt_expiry` 3600 → 900** after S7. This is project-wide, so it also shortens how long the offline pregame can reuse a token.
- **Revoking another user's sessions** (§8): service-role SQL `delete from auth.sessions where user_id = any($1)`. `admin.signOut` can't do this because it needs that user's JWT.

### 5.7 Cleanup reaper (`/api/cron/reap-incomplete-signups`)

**Schedule:** every 15 minutes in production. On staging it is invoked manually.

**Each run:**
1. A `security definer` finder returns ids that are either:
   - `pending` or `orphan`, older than 1 hour, with no tombstone; or
   - already tombstoned.
2. For each id:
   1. If the id has no tombstone yet, call `reaper_mark(id)` under the lock. If it returns `not_pending`, skip the id.
   2. Revoke the user's Apple tokens.
   3. Call `finalize_pending_deletion(id)`, which re-checks under the lock.
3. Purge handoff rows (§5.4).

**The reaper, the purge and every deletion path stay active when the `SSO_*` flags are off.** Only the sign-in entry routes are gated (§13).

**Safety and access:**
- Dry-run for the first week; cap of 100 per run.
- `CRON_SECRET` checked with `timingSafeEqual`. Logs record counts only.
- Execute is revoked from `public`, `anon` and `authenticated` and granted to `service_role` only (harness assertion).

### 5.8 Data minimization

- **Scopes:** Apple `email`; Google `openid email`. S4 confirms what is actually sent.
- **Provider name/photo:** Supabase auth may still hold them. A **CI grep guard** blocks reads of `user_metadata`, `raw_user_meta_data`, `identity_data`, `full_name`, `avatar_url` and `picture` outside an allow-list, including the log and alert paths.
- **Deletion proof test:** after any delete, no `auth.users`, `auth.identities`, token, handoff or tombstone row remains.
- **KC signs this exception (E2).**

## 6. Native apps

### Plugin `FVAuth`
App-local, with no third-party SDK. It needs product-strategist and kids-privacy-officer review under the plugin-allowlist rule.

| Method | iOS | Android |
|---|---|---|
| `startSession({ url })` → `{ url }` | `ASWebAuthenticationSession(url:callbackURLScheme:)` (iOS 12+), `prefersEphemeralWebBrowserSession = false` | Auth Tab (`androidx.browser` 1.9.x), falling back to a Custom Tab |
| `signInWithApple({ nonceHash })` → `{ identityToken, authorizationCode }` | `ASAuthorizationAppleIDProvider`, scope `email` | — (§5.4 handoff) |

**Hardening:**
- The callback scheme `com.fromvictoryapp.app` is hard-coded natively.
- `startSession` rejects hosts outside a native allow-list. Production allows the Supabase auth host and `www.fromvictoryapp.com`. Staging builds add `xmznvajmljhfmexjthlz.supabase.co` and `fv-android-staging-web.vercel.app`.
- Only one session runs at a time.
- The non-ephemeral setting is disclosed in the review notes.

### Builds
- **iOS:**
  - the Sign in with Apple entitlement and a new provisioning profile;
  - a `CFBundleURLTypes` entry for `com.fromvictoryapp.app`;
  - registration in `FVBridgeViewController`;
  - UA `FVNativeShell/1 (ios) FVAuth/1`.
- **Android:**
  - `androidx.browser` 1.9;
  - a custom-scheme `VIEW` intent-filter (for the Custom Tab fallback);
  - registration in `MainActivity`;
  - `FVAuth/1` appended to the UA.
- **Both:**
  - `allowNavigation` is unchanged in production builds; staging builds add the staging site.
  - Web wrapper: `lib/native/auth.ts`.

### Callbacks
iOS 15 can't use https callbacks, so both platforms use the custom scheme. App Links aren't needed, so the placeholder `assetlinks.json` fingerprint doesn't block this work.

### Stores
- **iOS:** a new build, with review notes (demo account, how to reach SSO, in-app deletion) and updated App Privacy labels. Guideline 4.8 is met because Apple ships alongside Google.
- **Android:** a new build, with an updated Data safety form.
- **Order:**
  1. The server deploys first, with flags off.
  2. Test builds point at staging.
  3. Production review builds ship with the surface flag at `preview`.
  4. Enabling SSO is a server flag change.

### Android release dependency (E1)
- **Technical readiness is built and validated now, on the same schedule as iOS:** in-app signup and sign-in, the access state, and cross-surface identity.
- **Public release** of Android SSO depends on the Play Billing build (FV-620 chain), so new Android users can subscribe in-app.
- These are separate gates (§12). Native scope is not deferred.

## 7. Configuration checklist (KC; the consoles need his login)

| # | Item |
|---|---|
| C1 | **Staging reuse (no spend):**<br>• apply `20261106120000_athlete_invitations.sql` to `fv-android-staging` via the existing migration path;<br>• configure staging auth with the C3–C6 staging values;<br>• set `fv-android-staging-web` env: separate `APPLE_*` and `APPLE_TOKEN_KEY`, and `SSO_*` = `preview`;<br>• unpause the Free project before each window. |
| C2 | **Resend SMTP** on production and staging Supabase: the same verified domain, with distinct From addresses. The domain is registered with Apple Private Email Relay. |
| C3 | **Apple:**<br>• Sign in with Apple on App ID `com.fromvictoryapp.app` (primary);<br>• Services IDs for production and staging, **grouped** with the App ID, with return URLs `https://www.fromvictoryapp.com/auth/apple/callback` plus the staging host's equivalent;<br>• a key (.p8). |
| C4 | **Supabase Apple provider** (each project): Client IDs = that project's Services ID first, then the bundle ID. |
| C5 | **Google:**<br>• production consent screen (External; privacy policy; scopes `openid email`) and **brand verification**, which takes days, so start first;<br>• a production Web client;<br>• for **staging, a separate Google Cloud project in Testing mode** (test users only, no verification, no cost) with its own Web client. |
| C6 | **Supabase** (each project):<br>• the Google provider;<br>• Confirm email ON with the OTP template (production only at A1 go-live);<br>• OTP expiry 900s;<br>• exact redirect allow-list: the site's `/auth/callback` and `com.fromvictoryapp.app://auth/callback`. |
| C7 | **Production Vercel:** `APPLE_*`, `APPLE_TOKEN_KEY`, `SSO_*` = `off`, `REAPER_DRY_RUN=true`. |
| C8 | **Privacy policy (§10)** published before any production flag leaves `off`. |
| C9 | **Optional:** a Supabase custom auth domain. Not required and not proposed. |

## 8. One-time beta-account transition

**Purpose:** close the legacy path. Legacy real-email accounts were autoconfirmed and never proven.

**This spec authorizes no account change.** T3 and T4 each need KC's explicit go on a named list, **only after gate V1 passes** (§13).

### T1. Inventory (read-only, production)
The output is stored encrypted with KC-only access, never in the repo, Linear, PRs or chat. It records an email *class*, not addresses. Fields:
- id;
- email class (synthetic / real / relay);
- role;
- created, last sign-in and confirmed timestamps;
- providers;
- subscription provider and status;
- comp grant;
- athlete count;
- admin flag;
- reviewer flag.

### T2. Classify (KC)
Each real-email account is one of:
- **keep, KC-controlled:** KC's own accounts, the App Review demo, the Play reviewer;
- **keep, beta tester;**
- **disposable.**

Synthetic athlete accounts are unaffected.

### T3. Prove ownership
Requires A1 live in production and V1 green.

**KC-controlled accounts.** KC re-proves each one himself: a reset via the email code, then he updates the credentials stored outside the repo and the review notes.

**Beta testers.** One SQL transaction, rehearsed first:
- **Scope:**
  - an explicit id list, excluding `%@athletes.fromvictory.app`;
  - the T1 query asserts that no synthetic address is in the set.
- **Steps:**
  1. `email_confirmed_at = null`.
  2. `identity_data.email_verified = false` on their email identities. Whether this is required is settled by V1/S8.
  3. `delete from auth.sessions`.

Their next password sign-in uses the code (`verifyEmailOnly`). If they link Google or Apple first, Supabase drops the unproven password identity.

**Locked-out parent** (unreachable inbox):
1. Verify the person out of band.
2. Run the service-side deletion, with Apple revoke.
3. Complete it within 30 days.

### T4. Disposable accounts
1. Until deletion is authorized, treat them like T3: unconfirmed, sessions revoked.
2. Once authorized: cancel any test/sandbox subscriptions.
3. Delete through the app's deletion path, so the cascade and revoke both run.

### T5. Close
- Before any SSO surface leaves `off` in production, a query must show **zero** real-email accounts (synthetic excluded) that are confirmed but not proven.
- Confirm email stays ON.
- The T1 snapshot is deleted 30 days after launch.

## 9. Security points

- **Pre-registration takeover:**
  - closed for new accounts by §4 and for legacy accounts by §8;
  - proven early on staging (V1: S2, S8), not assumed.
- **Destructive onboarding:**
  - only `pending` accounts can be deleted, under the per-user lock, behind a tombstone;
  - completion is refused while a tombstone exists;
  - established accounts are never deleted by onboarding, cancel or reaper code (§5.2).
- **Apple credentials:**
  - the supplied ID token, the redeemed code response and the session identity must agree on `sub`, `aud`/client and transaction;
  - credentials are retained until transferred or revoked (§5.4).
- **Untrusted inputs:**
  - `next` is checked against an allow-list;
  - `as` is only a hint;
  - the role comes only from the validated completion;
  - provider data never grants a role or entitlement.
- **Minors:**
  - no SSO on the under-18 section;
  - an under-18 *pending* adult is tombstoned and deleted, with Apple revoked first;
  - no birthdate is stored or logged;
  - the parent path has the 18+ guardian attestation.
- **Server Actions only** (Origin-checked POST): `startEmailSignup`, `completeEmailSignup`, `verifyEmailOnly`, `completeOnboarding`, `cancelOnboarding`, `appleNativeSignIn`, `appleHandoffComplete`.
  - `/auth/apple/callback` is the only Origin-exempt route; `state` protects it.
- **Plugin:** host allow-list and a hard-coded callback scheme.

## 10. Privacy, policy and store disclosures

`app/privacy/page.tsx` must say:
- Apple and Google are sign-in providers, each an independent controller of its own sign-in.
- **Resend** sends our email, including sign-in codes. Stripe and the other processors stay named.
- We receive email and the provider user ID. A name or photo may be held by our auth provider; it is never used or shown.
- We keep an **encrypted Apple refresh token**, solely to revoke Sign in with Apple when the account is deleted.
- Apple and Google learn that a parent or adult uses From Victory. They get **no athlete data**.
- A parent's sign-in method controls access to, and deletion of, their athlete's data. The athlete keeps their own username login.
- Minors (13–17) don't use SSO.
- Unfinished signups are deleted within about an hour.
- How to revoke Apple access manually.
- Accounts tied to an Apple relay address can't be recovered if the relay inbox is lost.
- New email signups are verified by code.

This is a privacy-path change: kids-privacy-officer review, then KC's wording.

**Store disclosures:** App Privacy and Data safety describe email and user ID as collected **from parents and adult athletes only**.

**Support runbook:**
- Hide My Email duplicates: no merge without re-verifying both inboxes.
- Losing the relay inbox means the account can't be recovered.
- The locked-out-parent deletion path (§8).

### Added by the kids-privacy-officer review of #600–#602 (2026-11-11)
The privacy-policy PR must also say:
- **Android handoff:** it holds the Apple ID token, including its email claim, encrypted, for at most 3 minutes.
- **Under-18 on the adult path:** the attempt is rejected and the account is deleted. The birthdate is never stored, and until deletion the tombstone holds only an internal id and a reason.
- **Failed Apple revoke:** if revoke fails during deletion, the account is still deleted and the user is shown how to revoke manually.
- **Rate-limit records:** they store irreversible HMACs of the email or IP.

Store forms:
- **App Privacy (Apple):** Email Address and User ID, linked to the user, used for App Functionality only, not for tracking. Do not declare Name.
- **Data safety (Play):** email and user IDs, collected from parents and adult athletes only, encrypted in transit, with deletion supported.

The App Review notes disclose the non-ephemeral iOS auth session. The Supabase Google provider sets the scopes `openid email` explicitly.

## 11. Essential decisions (KC)

| # | Decision | Recommendation |
|---|---|---|
| E1 | **Android public-release dependency.** Android SSO is built and validated now (V2, V3). Should its *public release* wait for the Play Billing build, so new Android accounts can subscribe in-app? | Yes: release with the Play Billing v1.1 build (FV-620 chain). Technical readiness is not deferred. |
| E2 | **Provider-metadata exception** (§5.8) | Sign it, with the CI guard, deletion proof and disclosure. |
| E3 | **Transition lists and authorization** (§8 T2–T4, after V1) | Classify after T1. Authorize T3/T4 by named list. |
| E4 | **Copy:** sign-in sections, buttons, `/welcome`, code screens, errors, relay line, revoke note, in-app-browser line | Approve at PR review. |
| E5 | **Duplicate-account residual.** An Apple Hide My Email address or a different Google email creates a second account, and there is no merge (§1). That account cannot reach the first account's subscription. It could take a second web (Stripe) trial; store trials are limited per Apple ID or Google account by the stores. Accept this at beta scale? | Accept. Keep the `/welcome` relay line and the cancellable pending state. Revisit if the T1-style inventory shows repeat trials. |

Staging spend is no longer a decision, because the existing staging is reused (§2).

**Engineering defaults:** `jwt_expiry` 900 (after S7); reaper TTL 1 hour, every 15 minutes; OTP 15 minutes.

## 12. Implementation sequence (Tier 2 unless noted)

**Validation is staged.** Early proofs run **before** any production confirmation setting or account change.

| Step | Work | Gate to proceed |
|---|---|---|
| **A0** | **Setup:**<br>• C1 (staging reuse), C2, and the staging parts of C3–C6;<br>• the C5 brand-verification request;<br>• product-strategist + kids-privacy-officer review of `FVAuth` and `androidx.browser`;<br>• the privacy-policy PR (§10). | Staging configured |
| **P0** | **Two-provider, two-phone proof.** A throwaway spike branch, staging only. Minimal `FVAuth` on debug builds of iOS and Android against `fv-android-staging-web`:<br>• a Google round trip into a WebView session on each phone;<br>• the Apple native sheet on iOS, and Apple via Auth Tab + handoff on Android;<br>• code redemption with binding;<br>• the same Supabase user for the same Apple/Google identity across both phones and the web. | **V0**: S3, S4, S5, S6, S9 green |
| **A1** | Verified email signups (§4) plus **all** §5.2 database functions:<br>• `is_unestablished`<br>• `complete_pending_profile`<br>• `cancel_my_pending_account`<br>• `reaper_mark`<br>• `finalize_pending_deletion`<br><br>Also the concurrency tests. Deployed to **staging only** (CLI deploy of the branch). | **V1**: S1, S2, S8, S10 and S11 green on staging, plus the A1 unit, concurrency and E2E tests. **Then** merge A1 and turn Confirm email ON in production. |
| **A2** | Beta transition (§8): T1, T2, then T3/T4 on KC's named authorization. | V1 green and A1 live in production. T5 = 0. |
| **A3** | Session core (§5.1), `/welcome` UI wiring onto the A1 functions, `/auth/callback` (§5.3), `jwt_expiry`. | A1 |
| **A4** | Apple core (§5.4–5.5): routes, binding, handoff state machine, token store, deletion integration. | A3, V0 |
| **A5** | Reaper (§5.7). | A3, A4 |
| **A6** | Web UI and entry points (§3), after FV-657. | A3, A4 |
| **A8 / A9** | iOS build / Android build (§6), from the P0 plugin. | A3, A4 deployed (flags off) |
| **A7** | **Full regression (V2)** on staging: every S gate re-run on the real code, plus unit, RLS and E2E tests, plus **app-first acceptance on staging** (§13). | All of the above |
| **A10** | **Launch:**<br>• Web: `preview` → production acceptance → `on`.<br>• iOS: App Review with `preview` → **V3 app-first acceptance on production** → `on`.<br>• Android: the same V3; **public `on` per E1** (Play Billing build). | A2 T5 = 0, V2 green, store approvals |
| **A11** | **Docs:**<br>• the CLAUDE.md Out-of-scope line becomes "social sign-in for minors (13–17)";<br>• the same edit at `.claude/agents/product-strategist.md:67`;<br>• the support and Apple-key runbooks. | Spec approval |

**Order:** A0 → P0/V0 → A1 → V1 → A1 to production → A2 ∥ A3 → A4 → A5 ∥ A6 ∥ A8 ∥ A9 → A7/V2 → A10/V3.

**Reviews:** `/review` → qa-reviewer → kids-privacy-officer → KC merge.

**Hot files:** `SignInChooser`, `guards.ts`, `sw.js`/`route-strategy.ts`. Serialize A3/A6. With Play Billing (§13a): the billing C1 PR owns the `android` UA block and lands before A8/A9. A6 lands before billing C7. `deleteAccount` changes in A4 and billing C5 are serialized in the fixed order.

## 13. Validation and tests

### Staging gates

| Gate | When | Proves |
|---|---|---|
| S1 | V1 | The signup OTP confirms with `type:"email"`. Resend delivers to Gmail, iCloud and an Apple relay address. An unconfirmed sign-in leads to the code screen. `startEmailSignup` with an under-18 birthdate or a missing attestation creates no auth row and sends no email. |
| S2 | V1 | Linking Google onto:<br>(a) a confirmed password user → same id, and the password still works;<br>(b) an unconfirmed password user → linked, and the **password identity is removed**;<br>(c) an autoconfirmed legacy-style user → linked, and the password is kept. Case (c) is why §8 is needed. |
| S3 | V0 | The Apple `sub` and relay email are the same via the Services ID (web, Android) and the bundle ID (iOS), giving one Supabase user. |
| S4 | V0 | `signInWithIdToken` accepts Apple `aud` = Services ID and `aud` = bundle ID (raw nonce), **rejects an unknown `aud`**, and needs no Supabase Apple secret. Record the Google scopes actually sent. |
| S5 | V0 | Redemption returns a refresh token and an `id_token` for both `client_id`s.<br>• Record which claims appear (`nonce`, `auth_time`). This makes the §5.4 nonce rule hard.<br>• **A valid code paired with a different valid ID token (another user, or another transaction) is rejected.**<br>• Revoke succeeds, and a revoked user sees Apple's consent again.<br>• **Revoking the newest refresh token also invalidates an older one** from an earlier sign-in (§5.5 upsert rule). |
| S6 | V0 | iOS `ASWebAuthenticationSession` and Android Auth Tab/Custom Tab (Chrome < 137) return the custom-scheme URL, including on a **second** sign-in with an existing Google session (no user gesture). The WebView exchange succeeds. |
| S7 | V2 | `getUser()` rejects revoked and deleted users. `jwt_expiry` 900 keeps the offline pregame and app resume working. |
| S8 | **V1** | Transition rehearsal on staging copies: password sign-in needs the code; a real Google link removes the password identity (if that only happens with `email_verified=false`, that step is mandatory); the `auth.sessions` delete ends server access; no synthetic account is touched. |
| S9 | V0 | Apple `form_post` with `SameSite=None` state cookies works in Safari (ITP) and Chrome. Apple accepts the staging return URL. If Apple rejects the `vercel.app` host, map a free `staging.` subdomain of fromvictoryapp.com (Cloudflare) to the staging project instead. |
| S10 | V1 | Recovery: an SSO-only user sets a usable password through Forgot password and signs in by email in each app, including with a relay address. An unconfirmed legacy user gets a usable recovery code. |
| S11 | V1 | `finalize_pending_deletion`'s SQL delete removes the same rows as `auth.admin.deleteUser`: identities, sessions, refresh tokens, MFA factors. Afterwards GoTrue treats the user as gone (`getUser` → `user_not_found`), and the same email can sign up again. |

V0, V1 and V2 must each be green before the next production step in §12. V2 re-runs all of them on the final code.

### App-first acceptance (V2 on staging, V3 on production)

**Matrix:**
- **Phones:** iPhone on iOS 15 and on the current iOS; Android with Chrome < 137 and with the current Chrome.
- **Providers:** Apple and Google.
- **Adult roles:** parent and adult athlete.

**For each combination:**
1. Fresh install: the staging build via TestFlight/Play internal for V2; the review build for V3.
2. Open the app, choose "Parent or Athlete 18+", then Continue with Apple or Google. **This is the signup, done inside the app.**
3. On `/welcome`: role, age (adult) or attestation (parent), and consent.
4. Check access:
   - **iOS:** StoreKit sandbox subscribe (V2) or the review path (V3) unlocks paid features.
   - **Android:** before the Play Billing build, the existing not-entitled notice shows. With it, a Play Billing test subscribe unlocks.
   - A comp grant gives the correct access.
5. **Parent only:** create an athlete in the app (invite flow). The athlete signs in with their username on the other phone and completes a daily session, so history exists.
6. Kill the app, reopen it, and **sign in again** with the same provider. The account, subscription, athletes and history are all present.
7. **Cross-surface:** sign in on the **other** phone and on the web with the same provider. Expect the same user id, subscription, athletes and history.
   - Apple with a real email on iOS, then Google with the same email on Android → one account.
   - Apple with Hide My Email → a separate account. The relay line and support recovery work.

**Cancellation, interruption and resume:**
- Cancel at the provider sheet → back at sign-in with a friendly error, no account.
- Cancel on `/welcome` ("Use a different account") → account deleted, Apple grant revoked.
- Kill the app during the browser session → no account, or a pending account reaped later.
- Kill the app on `/welcome`, then reopen → resumes at `/welcome`; completing it gives access.
- Background then foreground during Auth Tab → the callback still completes.
- Network loss after the provider step → retry works, and the handoff can be reclaimed within its TTL.
- Under-18 adult in the app → rejected, nothing remains, Apple grant revoked.
- Older installed builds (no `FVAuth/1`) → no SSO buttons.

**Deletion:** deleting an Apple-created account in the app → the token is revoked (check Apple ID settings). No auth, identity, token, handoff or tombstone rows remain.

Web-created accounts are part of the cross-surface step only. They never substitute for in-app signup.

### Unit tests (Vitest)

**Resolver, routing and visibility**
- The resolver covers every state, including the established-data exclusions and query errors.
- Guards and the shell router: `FVAuth/1` versus older UAs.
- The callback:
  - `next` allow-list cases: `//evil`, `/admin`, an absolute URL, a backslash;
  - provider errors;
  - recovery.
- `showSSO` across surfaces, flags and UAs.

**Email signup**
- `startEmailSignup`: under-18 → no auth row and no email.
- `completeEmailSignup` and `verifyEmailOnly`: wrong, expired and resent codes; rate limits.
- `signIn`: the code branch appears only after a correct password.

**Destructive paths and concurrency** (against local Postgres, not mocks)
- Two tabs complete at the same time → one `created`, one `already_complete`, no delete.
- Completion vs cancel → exactly one wins:
  - if the cancel's tombstone comes first, completion returns `account_closing`;
  - if completion comes first, cancel returns `not_pending` and nothing is deleted.
- Completion vs the reaper → the same.
- **Established data appears between the tombstone and finalize** (simulated payer row) → `finalize_pending_deletion` returns `not_pending`, deletes the tombstone, and deletes no user.
- The revoke-failure cap path still re-checks: `not_pending` → no delete.
- `cancel_my_pending_account` can't target another user (it takes no parameter). `reaper_mark` and `finalize_pending_deletion` are denied to `authenticated`.
- A `not_pending` result removes the tombstone, so completion works afterwards.
- An under-18 resubmission against an **established** account → `already_complete`, never deleted.
- Under-18 on a pending account → tombstone, then revoke, then delete.
- `cancel_my_pending_account`, `reaper_mark` or `finalize_pending_deletion` on an account with a subscription, an Apple purchase, a comp grant or athletes → `not_pending`.
- A revoke failure → the tombstone is kept; the reaper retries, then deletes at the cap and raises an alert.

**Apple binding**
- A valid supplied token plus a valid code from **another user** → rejected, the redeemed token revoked, no session.
- A valid pair from **another transaction** (nonce, state or `auth_time` mismatch) → rejected.
- `aud` ≠ the redemption `client_id` → rejected.
- Identity `provider_id` ≠ `sub` → rejected and signed out.
- A redemption failure → fails closed.
- A storage failure after sign-in → revoke and sign out.

**Android handoff**
- Atomic claim: under concurrent claims exactly one wins.
- Replay after finalize → rejected.
- Verifier mismatch → back to `pending` with credentials kept; burned at 5 attempts.
- `signInWithIdToken` failure → back to `pending`, credentials kept.
- `finalize_apple_handoff` failure → the session is signed out, the token is not lost, and the row resets to `pending` under its `claim_id`.
- **Stale fence:** the original request is slow, a stale reset and re-claim happen, then the original finalizes → the fence fails, the original request signs out, and the second claim succeeds. Exactly one token row results.
- **Purge during an in-flight request:** the row expires and is purged with revoke while sign-in is mid-flight → finalize aborts and the session is signed out. No user is left signed in with a revoked, unstored credential.
- A second Apple sign-in for the same user and client → the token row is upserted, and the old token is not revoked.
- Transient failures don't increment `attempts`.
- Interrupted request (claimed, then the process dies) → reclaimable, or purged with revoke.
- Expired, burned and stale rows are purged **with revoke first**; if revoke fails, the row is kept.
- An AAD mismatch → decryption fails.

**Native plugin and tokens**
- `FVAuth` native tests: hosts outside the allow-list are rejected, and the callback scheme can't be overridden.
- Token encryption round-trips, and `key_version` is respected.
- `revokeAppleTokens` uses the matching `client_id` and retries.

**Static checks**
- The metadata grep guard.
- The SW bypass sync.
- The existing `native-shell` mocks, extended.

### RLS harness
- The `private` schema, tokens, handoffs and tombstones, and the lock functions, are inaccessible to `anon` and `authenticated`. The exceptions are `complete_pending_profile` and `cancel_my_pending_account`, which act on `auth.uid()` only. `reaper_mark` and `finalize_pending_deletion` are callable by `service_role` only. All checks are effect-based.
- `EXECUTE` is denied to `PUBLIC`.
- Deletion proof.

### E2E (local Supabase; no real providers in CI)

**Setup:**
- `enable_confirmations = true` in the local `config.toml` (`:207`).
- Seed OAuth users through `app_metadata.providers`, with a fresh user per test.
- Inject Node-side cookies (no app route).
- A separate Playwright project, with paginated cleanup.
- Flags set in `ci.yml`.
- Clear rate-limit rows per test.

**Scenarios:**
- The two-step signup, with the OTP read from local Mailpit.
- `/welcome` as parent, adult and under-18, and cancel.
- **Two simultaneous completions in two browser contexts.**
- Shell UAs with and without `FVAuth/1` → the buttons are absent or present in the SSR HTML.

The `E2E (non-required)` job is run green by hand before merging A1, A3, A4 and A6.

### Accessibility
A manual WCAG pass: focus, labels, contrast on onyx, `aria-live`, banner focus.

### Rollback (each layer)

**Floor: Confirm email stays ON permanently once A1 ships, including during any rollback.**
- A rollback never returns to a state that accepts unverified password accounts.
- A pre-A1 deployment is **never promoted**, because its signup depends on autoconfirm.

**Safe rollback version (SRV):** the latest production deployment at or after A1 that passed V1. A1 contains every §5.2 database function, so any SRV can complete or cancel pending accounts. The SRV keeps:
- verified email signups;
- the code sign-in branch;
- Forgot-password recovery;
- `/welcome` completion through the lock RPCs, so pending users can finish or cancel.

| Layer | How | Notes |
|---|---|---|
| Exposure, level 1 | Set `SSO_*` = `off`. This hides the buttons on the web **and** in shipped apps, because they are server-rendered. **Our Apple routes and `appleNativeSignIn` also return 404 when all `SSO_*` flags are off.** | Supabase's Google `/authorize` still answers. A crafted Google sign-in still lands in `/welcome`, which is safe because every gate is server-side and any new account is real and verified. |
| Exposure, level 2 (a security issue in a provider flow) | Level 1, **plus disable the Google and Apple providers in Supabase** and remove the Apple Services ID return URL. | SSO-only users get back in through **verified-email recovery** (S10), which the SRV keeps. **Apple relay users can recover only if relay delivery works.** That makes C2's relay registration and S1/S10's relay delivery preconditions for enabling Apple at all. Re-enabling restores identities; no users are deleted. **Level 1 and level 2 never disable the reaper, the handoff purge, revoke, or deletion.** |
| Server code | Vercel instant rollback, **only to the SRV or newer**. | The SRV ignores newer data (tokens, handoffs and tombstones sit inert) and pending users still complete. Run the reaper once after rolling forward again. |
| Email confirmation | Never turned OFF. A §4 UI bug is fixed forward, or the deployment rolls back to the SRV. | Consistent with §8 T5. |
| Apple credentials | Never drop tokens, handoffs or tombstones while rows exist. Revoke first, via the purge or deletion paths. | A level-2 rollback still keeps tokens, so later deletions can revoke. |
| Migrations | Additive only. Left in place on rollback. | — |
| Transition (§8) | Not reversible. | This is why T3/T4 require V1 and a named authorization. |
| Native builds | Can't be rolled back. Server flags and route disablement neutralize them; the plugin stays dormant. | — |
| Reaper | `REAPER_DRY_RUN=true`, or remove its `vercel.json` entry. | Tombstoned accounts wait. |

## 13a. Coordination with Play Billing (FV-620 / FV-651) and combined regression evidence

Added 2026-11-11 at the PM's request (Codex coordinating SSO and Play Billing for KC). It changes no SSO scope and approves nothing in the billing record. Billing references are to `docs/fv651-android-play-billing-decision-record.md` on `main` @ a0e882f (C1–C11, G0–G10).

### Invariants both arcs hold
1. **Identity never moves an entitlement.** Linking Apple or Google to an account never changes `auth.users.id`. There is no merge, so a family's subscription, comp grant, athletes and seats stay attached to the same id.
2. **SSO code never writes billing state.** It never writes `subscriptions`, `apple_*`, comp grants, `parent_athlete_links`, or the future `google_*` tables. Billing code never writes `auth.identities` or the §5 pending-account tables.
3. **Purchase binding stays per payer.** Apple's `appAccountToken` and Play's `obfuscatedAccountId` are opaque UUIDs minted for the payer's user id. Because of invariant 1, an account that later links SSO keeps them. A duplicate account (Hide My Email, different Google email) gets its own UUID and can never claim another account's Apple or Play transaction (`apple-subscription.ts:245-270`; billing record 7.2).
4. **The capability markers are presentation only.** `FVAuth/1` and `(play)` gate which buttons render. Authorization stays server-side.
5. **An unreadable status is never a lapse (FV-656).** On a return from Apple or Google, a subscription read that fails shows "couldn't check". It never routes to `/subscribe`. A failed profile read is `error`, never `pending`, so no deletion path can start from a read failure.

### Shared surfaces: one owner, serialized

| Surface | SSO (FV-569) | Play Billing (FV-620) | Rule |
|---|---|---|---|
| `apps/native/capacitor.config.ts` and the FV-483 config guard test | Adds `FVAuth/1` to the iOS override. **Android needs a new `android.appendUserAgent` override**, because a platform key replaces the top-level value. | C1 adds `android: { appendUserAgent: "FVNativeShell/1 (play)" }`. | C1 owns the `android` block and lands first (G10 Stage 1). The SSO native PR (A8/A9) then appends ` FVAuth/1` to both overrides. Final strings: iOS `FVNativeShell/1 (ios) FVAuth/1`, Android `FVNativeShell/1 (play) FVAuth/1`. The top-level bare token never changes. The guard test pins both strings. |
| `lib/native-shell.ts` | Adds an orthogonal `hasAuthCapability(ua)` (`FVAuth/1`). It never changes `ShellCapability`. | C1 adds `android-play`, checked before the bare token. | One test table covers every combination: browser, bare, `(ios)`, `(play)`, each with and without `FVAuth/1`. |
| Android account creation | `/welcome` creates a profile in the app. | C7 restores sign-up only under `android-play`. | **Production Android builds carry `FVAuth/1` only together with `(play)`**, pinned by the guard test. Staging and debug builds may carry `FVAuth/1` alone for V0–V2. This makes E1 structural rather than a release-day reminder. |
| `/signin`, `SignInForm`/`SignInChooser`, `/signup` | A6 restructures the entry points (§3). | C7 un-hides sign-up under `android-play`. | A6 lands first; C7 rebases onto it (C7 already waits on C5 and C6). The secondary "under 18" section keeps FV-654: it still accepts an 18+ athlete's email. |
| `lib/actions/account.ts` `deleteAccount` | A4 adds the Apple sign-in revoke (§5.5). | C5 adds the Play cancel (G5). | One fixed order: Stripe cancel → Play cancel (G5) → Apple sign-in revoke → delete the user. Each step retries, and none can hold deletion past the 30-day commitment (alert plus manual instruction). **Revoking Sign in with Apple does not cancel an App Store subscription.** The FV-652 notice stays, and no copy may suggest otherwise. |
| `private.is_unestablished` (§5.1) | Lists the provider tables. | C2 adds `google_subscriptions` and `google_purchase_bindings`. | An RLS-harness assertion lists every foreign key to `auth.users` or `profiles` from `pg_constraint`. It fails when a table is neither covered by the predicate nor on an explicit allowlist. C2 cannot forget the predicate. |
| `lib/subscriptions/*`: resolver, subscribe guard, trial, capacity, offline window | No change. | C5 adds Google. | SSO PRs must leave these files untouched (checked with `gh pr diff --name-only`). |
| Staging `fv-android-staging` | V1 turns Confirm email ON and adds providers. | May use staging for non-Play checks. Play test purchases run on license testers (record 7.4). | Announce staging auth changes on FV-569 and FV-620 before making them. Test accounts are created already confirmed (`email_confirm: true`). |

### Baseline evidence (before any SSO or billing code)
Recorded 2026-11-11 against `main` @ a0e882f:
- **CI run 43100944720** on PR #594 head d1ad0df (tree identical to a0e882f):
  - Tests: 170 files, 3359 passed.
  - E2E: 50 passed. The two skipped steps were the cached browser install and the failure-only report upload.
  - RLS harness: 22 assertion files, all passed. These include `03_subscriptions`, `18_adult_athlete_boundary`, `20_apple_subscriptions`, `21_seat_selection` and `22_athlete_invitations`.
- **A local targeted run** (detached worktree at a0e882f) covered 42 auth, access and billing suites:
  - 41 passed, with 919 tests.
  - One suite, `apple-server.real-fixture`, could not import `@apple/app-store-server-library`. This is the known gap where a worktree resolves the primary checkout's stale `node_modules`, not a product failure. The same suite is green in the CI run above.
- **Covered today:**
  - password parent signup and sign-in (E2E global setup);
  - 18+ adult signup (`auth-adult`);
  - minor username sign-in, and an 18+ email on the Athlete tab (`username-sign-in`, `athlete-username`);
  - guards, shell and router;
  - access resolution across Stripe, Apple, comp and unknown (`training-access`, `apple-access`, `grants-resolver`);
  - the duplicate-purchase guard, capacity and seats, the offline window, and deletion notices.
- **Not covered today**, so the delivering PRs add it: more than one identity per user, identity linking, the pending state, and Apple or Google identities.

### Combined regression matrix
Each delivering PR and gate produces the evidence in its row. The **snapshot** is a read-only, content-free record taken before and after on staging (V1/V2) and production (V3). It holds:
- the user id and identity providers (no emails or tokens);
- the role;
- `getParentAccessLevel` and `getSubscribeEntitlementState`;
- the linked athlete ids with `seat_active`;
- the offline-until date.

A row passes only when the after-snapshot matches the before-snapshot, except for the fields the row says change.

| # | Cohort | Must hold | Proven by |
|---|---|---|---|
| R1 | Existing password parent with Stripe and linked athletes | Password sign-in is unchanged on web, iOS and legacy Android. Adding Google with the same verified email gives the same id, and the only change is one more provider. Access, guard state, athletes, seats and offline window are unchanged. The athletes' sessions and training access are unaffected. | Unit (A3); E2E (A3); V1 S2/S8; V2; V3 |
| R2 | Existing password parent with an Apple subscription | As R1, plus Restore still binds to the same payer. Linking Sign in with Apple keeps the id. | Unit (A4); V2 on a sandbox tester; V3 |
| R3 | Comp-granted parent | The comp grant still applies after linking. | Unit (A3); V3 (KC's admin account) |
| R4 | 18+ athlete, password | Both the new primary door and the FV-654 Athlete tab sign in. After SSO is added, the role stays `adult_athlete` and lands on `/athlete`. | Unit (A6); E2E (A6); V2 |
| R5 | Minor athlete (username) | No SSO buttons appear in the secondary section. A synthetic address never links. The parent link and training access follow the parent's entitlement before and after the parent adds SSO (`/api/athlete/access`). | Unit; RLS `18_`/`22_`; E2E (A6); V2 |
| R6 | New Google account (web, iOS, Android) | `pending` → `/welcome` → profile, then not entitled → that surface's purchase path: Stripe on web, Apple on iOS. On Android, the not-entitled notice before `(play)` builds and Play purchase with them. Trial-eligible exactly once. | V2 app-first (§13); billing C10 for the Android purchase |
| R7 | New Apple account, including Hide My Email | As R6, plus the token is stored, relay mail is delivered, and S10 recovery works. | V0 S3/S5; V1 S1/S10; V2 |
| R8 | Duplicates and linkage | (a) The same verified email links. (b) An unverified pre-registration is dropped and the real owner keeps the account (S2/S8). (c) A relay or different email creates a separate, not-entitled account that cannot claim another account's Stripe, Apple or Play purchase (E5). (d) One identity gives one id across iOS, Android and web (S3). (e) The §8 transition changes no billing rows (snapshot before T3, after T5). | Unit; V0; V1; A2 snapshot |
| R9 | Deletion with an entitlement | A subscribed, comp or athlete-linked account always reads `not_pending` (S11). `deleteAccount` runs the fixed order in the table above. The FV-652 notice shows for App Store payers. | Unit; concurrency tests (A1); RLS FK-coverage assertion; V2 |
| R10 | Read failure on return | An access-read failure after SSO shows "couldn't check". There is no `/subscribe` and no `/welcome`. | Unit (A3) |
| R11 | Legacy installed builds | Bare-token Android and older iOS builds show no SSO and no purchase path. The FV-492/493 legacy suites pass unchanged. | Unit (A6, C1); guard test |

The combined report for the PM uses this table: one line per row per gate, with the PR or run id and the date.

## 14. Superseded (do not reopen)

| Superseded | Replaced by |
|---|---|
| Web-first, with native deferred to Phase B | Native in scope; technical readiness ungated (§6, §12) |
| Permanent first-link password rotation; the password-or-reset screen | §4 + §8 |
| TN3194 manual revoke as the primary path | Bound, stored tokens (§5.4–5.5); manual revoke is the failure fallback only |
| Parent-tab-only SSO | The "Parent or Athlete 18+" section (§3) |
| Supabase-hosted Apple OAuth with 6-month secret rotation | Our own redemption (§5.4) |
| A new staging project (old E2) | Reusing `fv-android-staging` (§2) |
| "Check for no profile, then delete" | The lock + tombstone protocol (§5.2) |
| Deleting the handoff row on a mismatch or before transfer | Atomic claim with retained credentials (§5.4) |
| One late validation gate (A7) | Staged V0/V1/V2/V3 (§12–13) |
| Acceptance via web-created accounts | App-first acceptance (§13) |
| A rollback table that allowed Confirm email to be turned OFF | The permanent ON floor and the SRV (§13) |

## 14a. Review log

**v1 → v2 (backend, frontend, QA, privacy).** Carried forward:
- SW bypass and cache bump;
- gold focus ring;
- provider button specs;
- `maybeSingle`;
- the `23505` no-delete rule;
- reaper safety;
- the metadata guard;
- the 1-hour TTL;
- the parent attestation.

**v3 (KC clarification: native in scope, beta users only; backend and privacy reviews):**
- session revoke via SQL;
- `email_verified` in T3;
- the verify-only path;
- no delete on insert failure;
- the `signIn` code branch;
- handoff hardening;
- the Origin exemption;
- `aud` tests;
- per-user revoke;
- local confirmations;
- age validation before `signUp`;
- the Resend disclosure;
- minors disclosures;
- the locked-out-parent path;
- the plugin allow-list;
- AAD binding;
- the `private` schema not exposed.

**v4 (KC's six findings):**
1. Reuse the existing staging, with no new spend.
2. Staged V0/V1/V2/V3, with S8 and the related tests before any production confirmation or account change, starting from a two-provider, two-phone proof.
3. Apple code/ID-token binding, and an atomic handoff that retains credentials.
4. A concurrency-safe pending-account lock and tombstone; no deletion of established accounts.

**v4 focused backend review:**
- The deletion re-check and the delete run in one locked transaction (`finalize_pending_deletion`, SQL delete, S11).
- The tombstone functions are split so callers can't spoof the target.
- One deletability predicate (`is_unestablished`).
- A `not_pending` result clears the tombstone.
- A handoff `claim_id` fence; any finalize failure signs out.
- Token upsert, without revoking the replaced token (S5 proves this).
- The nonce rule is made strict by S5.
- The attempts DoS is accepted, and transient failures don't count.
- All §5.2 functions ship in A1, so the SRV includes them.
- Rollback never disables revoke, purge or the reaper.
- Relay delivery is a precondition for enabling Apple.
5. A permanent Confirm-email floor, the SRV, level-2 provider disablement, and route disablement.
6. App-first acceptance, with Android billing as an explicit release dependency.

## 15. Sources

**Supabase:**
- Identity linking: https://supabase.com/docs/guides/auth/auth-identity-linking
- Apple: https://supabase.com/docs/guides/auth/social-login/auth-apple
- Google: https://supabase.com/docs/guides/auth/social-login/auth-google
- Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Native deep linking: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- PKCE: https://supabase.com/docs/guides/auth/sessions/pkce-flow
- Email OTP: https://supabase.com/docs/guides/auth/auth-email-passwordless
- SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Sessions: https://supabase.com/docs/guides/auth/sessions
- signOut: https://supabase.com/docs/reference/javascript/auth-signout
- getClaims: https://supabase.com/docs/reference/javascript/auth-getclaims
- supabase/auth source: `internal/models/linking.go`, `internal/api/external.go`, `internal/api/verify.go`, `internal/api/auth.go`

**Apple:**
- TN3194: https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple
- Generate and validate tokens: https://developer.apple.com/documentation/signinwithapplerestapi/generate-and-validate-tokens
- Revoke tokens: https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens
- Private Email Relay: https://developer.apple.com/documentation/signinwithapple/communicating-using-the-private-email-relay-service
- Grouping: https://developer.apple.com/help/account/capabilities/group-apps-for-sign-in-with-apple
- ASWebAuthenticationSession: https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Manual revoke: https://support.apple.com/en-us/102571

**Google / Android:**
- OAuth policies: https://developers.google.com/identity/protocols/oauth2/policies
- Brand verification: https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- Auth Tab: https://developer.chrome.com/docs/android/custom-tabs/guide-auth-tab
- Android intents: https://developer.chrome.com/docs/android/intents

**Other:**
- RFC 8252 §8.1: https://www.rfc-editor.org/rfc/rfc8252#section-8.1
- Capacitor Browser: https://capacitorjs.com/docs/apis/browser

**Staging record:** KC's 2026-11-06 Google Play readiness record (local, outside the repo), lines 9–17.

**Unverified, and gated:**
- Apple `sub` across client IDs (S3).
- That no Supabase Apple secret is needed (S4).
- Which claims Apple's code response includes (S5).
- Chrome's custom-scheme handoff (S6).
- Apple accepting the `vercel.app` staging return URL (S9).
- SSO-only recovery (S10).
