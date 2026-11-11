# FV-569 — Sign in with Apple + Google (parents and 18+ athletes): spec

**Status:** v3 for KC approval (discovery deliverable). Nothing is built, deployed, or changed in any account.
**Date:** 2026-11-11.
**Supersedes:** v1/v2 of this file. Superseded decisions are listed in §14; they are not open options.
**Issue:** FV-569. The delivery issues in §12 are filed once KC approves this spec.

## 1. Scope (settled)

**Goal:** make getting in easy for the people who hold real email accounts, on every surface.

| | In scope | Out of scope |
|---|---|---|
| Who | `parent` and `adult_athlete` (18+) | Minor athletes (13–17). They keep username/password and parent invites, unchanged. No SSO, no linking, no "upgrade at 18". |
| Where | Web browsers, the **iOS app**, and the **Android app**. Web may go live first as an internal milestone. Native is required scope, not a deferred phase. | Embedded-WebView OAuth (blocked by Google, unsafe). Social in-app browsers on the web. |
| Providers | Apple and Google, through Supabase Auth plus Apple's REST API for token redemption and revocation | Any other provider. No Clerk, Auth0, Firebase, or third-party auth SDK. |
| Accounts | One Supabase user per person across web, iOS, and Android, so subscriptions and athletes follow the user id | A manual link/merge UI |
| Users today | **Beta and test accounts only.** No customer migration UX is built; there is a one-time transition instead (§8). | — |

Email/password stays available for parents and 18+ athletes. **New** email/password signups now prove email ownership with a typed code (§4).

## 2. Facts this design rests on (verified 2026-11-11)

### Code (`main` @ 6790398)

- **Email confirmation is OFF in production.**
  - Signup inserts the profile using the session that `auth.signUp` returns (`lib/actions/auth.ts:97-102`). That only works with autoconfirm.
  - With autoconfirm, Supabase treats provider emails as verified when linking (`if email.Verified || config.Mailer.Autoconfirm`, supabase/auth `internal/models/linking.go`).
  - So today anyone could pre-register a victim's email and be linked to them later. This is closed in §4 and §8.
- **Profile-less sessions are treated as orphans and signed out.**
  - `redirectIfAuthed` → `/auth/signout` (`lib/auth/guards.ts:230`).
  - The `require*` guards → `/signin`.
  - The shell router → sign-out (`lib/native-shell-router.ts:114`).
  - The guards use `.single()`, so any error looks like "no profile".
- **Every server gate uses `auth.getUser()`.** That is 18 call sites, with no `getClaims`/`getSession`. Middleware too (`lib/supabase/middleware.ts:72`). `jwt_expiry = 3600`.
- **Entitlements and data key on the account id:**
  - Stripe: `parent_id`, `metadata.parent_id`, `client_reference_id`.
  - Apple IAP: `appAccountToken` → `payer_id`.
  - Profiles and athletes hang off `profiles.id` = `auth.users.id`.
  - So one user id across platforms gives subscription and athlete continuity.
- **Deletion.** `deleteAccount` (`lib/actions/account.ts:169`) is immediate. It is gated by `requireSubscriber()` and cascades from `auth.users`.
- **Consent is checked but never stored.** There is no parent age check.
- **Native shell (Capacitor 8):**
  - Plugins: core, app, splash-screen, status-bar.
  - App-local plugins: `FVAppleIAPPlugin` (iOS) and `FVNarration`. The web code calls them through `window.Capacitor.Plugins.*` (`lib/native/apple-iap.ts:124`).
  - iOS target 15.0. Android minSdk 24.
  - UA token is `FVNativeShell/1` (plus `(ios)` on iOS). There is no build version in the UA.
  - The `appUrlOpen` listener exists (`components/native/NativeInviteLinkHandler.tsx:152`).
  - AASA serves `/invite` only. `assetlinks.json` has a **placeholder** fingerprint.
  - There is no Sign in with Apple entitlement and no custom URL scheme.
  - Android has **no** Play Billing plugin yet (Path A, consumption-only).
- **There is no staging Supabase project.** Production `kumrgeosgzdlxgljbyju` is the only cloud project (`docs/fv572-ios-bridge-notes.md:274`).
- **Reviewer accounts exist and must be preserved:**
  - App Review demo: `docs/fv210-resubmission-packet.md` §F.
  - Play reviewer: `apps/web/scripts/provision-play-review-account.ts`.
- `app/privacy/page.tsx` names only Stripe as a processor.

### Providers (sources in §15)

- **PKCE (Supabase):**
  - The verifier lives in the initiating client's storage. With `@supabase/ssr` that is the cookies of **the WebView or browser that started the flow**.
  - The code is single-use and valid for 5 minutes.
  - Custom URL schemes are allowed redirect URLs.
- **`signInWithIdToken` (Supabase):**
  - Accepts Apple and Google ID tokens. Apple's audience can be any listed Client ID; the Services ID must be first for web.
  - The nonce goes SHA-256 to the provider and raw to Supabase.
  - Supabase **does not redeem Apple's authorization code**, so it holds no Apple refresh token.
- **Apple:**
  - Authorization codes are single-use, valid 5 minutes, and redeemed at `/auth/token` with `client_id` = the App ID (native) or the Services ID (web).
  - Revocation must use the **same** `client_id`.
  - TN3194 "Securely store user tokens for account creations": send the identity token and code to your server, validate the code at `/auth/token`, and **securely store the token response**. Manual revocation is the fallback when no token exists.
  - Private relay email is the same across one developer team's apps. The `sub` is team-scoped (to be verified, S3).
- **Supabase email OTP:**
  - The template uses `{{ .Token }}`. `verifyOtp({ type: "email" })` confirms a signup.
  - **Built-in SMTP only delivers to project team members, at 2 per hour.** Custom SMTP is a hard prerequisite.
- **Identity linking:**
  - Same email links automatically.
  - Linking "remove[s] any other unconfirmed identities linked to an existing user". This holds only when confirmations are ON.
- **Sessions:**
  - `signOut` (any scope) does not invalidate issued access JWTs. They stay valid until expiry.
  - `getUser()` rejects a deleted user (`user_not_found`) and a revoked session (`session_not_found`). `getClaims()` with asymmetric keys does not.
  - JWT expiry should be ≥5 minutes; the default is 1 hour.
- **Native browsers:**
  - `@capacitor/browser` uses SFSafariViewController on iOS, which is not an auth session. So we need an app-local plugin.
  - `ASWebAuthenticationSession` with a custom scheme is available on iOS 15. It delivers the callback only to the calling app.
  - Android: Chrome may not hand a redirect to an app without a user gesture. **Auth Tab** (Chrome 137+, `androidx.browser` 1.9) is Google's fix and falls back to a Custom Tab.

## 3. Entry points (one clear door for both adult roles)

### `/signin`

- **Primary section, "Parent or Athlete 18+":**
  1. Continue with Apple
  2. Continue with Google
  3. A divider: "or use email"
  4. The email + password form
- **Secondary section, "Athlete under 18? Sign in with your username":** the existing username form and invite help. No SSO here.
- This replaces today's Parent/Athlete tab pair. FV-657 (tab copy) merges first; this work then supersedes the tab labels.
- KC approves all strings.

### `/signup`

- The FV-515 chooser stays: "Parent" / "Athlete 18+".
- Each form shows Apple, Google, then "or use email" above its fields.

### Inside the apps

- The same pages render natively-handled buttons (§6) **only** in builds that advertise the new capability token `FVAuth/1`.
- Older installed builds never show SSO.
- In the Android app, new-account creation depends on decision **E1** (§11).

### Web visibility rule (server-rendered, per request)

`showSSO(surface)` is true when all of these hold:
- the surface flag is on;
- the request is from a capable surface:
  - web: not a shell UA, and not a denylisted in-app browser (Instagram, `FBAN/FBAV`, TikTok, `Line/`, Snapchat, `TwitterAndroid`, `LinkedInApp`, Pinterest, Android `; wv)`, iOS WebKit without `Safari/`);
  - iOS/Android shell: UA contains `FVAuth/1`.

When a denylisted in-app web browser hides the buttons, the page shows one line: "Open in Safari or Chrome to use Apple or Google."

Flags: `SSO_WEB`, `SSO_IOS` and `SSO_ANDROID`, each `off | preview | on`.
- `preview` shows the buttons only when an admin-set `fv_sso_preview` cookie is present.
- Apple and Google are always enabled together per surface. Guideline 4.8 on iOS requires Apple whenever Google is offered.

## 4. Email/password signups verify email ownership (before any SSO launch)

- **Supabase "Confirm email": ON.**
  - The email template uses a 6-digit `{{ .Token }}` code, not a link. A typed code works in the apps; a link would open the wrong browser.
  - OTP expiry is 15 minutes, with a resend cooldown of 60s.
- **Custom SMTP through Resend on our domain**, for production and staging.
  - Register it with Apple Private Email Relay (SPF + DKIM aligned to `From:`) so relay addresses receive codes.
  - Prerequisite: the built-in SMTP can't serve real users.
- **Signup becomes two steps.** Both `signUp` (`lib/actions/auth.ts`) and `signUpAdultAthlete` (`lib/actions/auth-adult.ts`) are converted.
  1. **Details → `startEmailSignup` server action.**
     - The server validates the full zod schema **before** calling `auth.signUp`: the adult 18+ birthdate, or the parent 18+ guardian attestation; consent; and the `sign_up` rate limit.
     - A failed check creates **no auth row and sends no email**.
     - `auth.signUp` is called without `options.data`. No session is returned.
     - The fields stay in client form state and are **never** written to `user_metadata`, so no birthdate lands in auth.
  2. **Code → `completeEmailSignup` server action.**
     - `verifyOtp({ email, token, type: "email" })` creates the session.
     - The resubmitted fields are re-validated with the same schemas. An adult under 18 → service `deleteUser` → sign out → `/signup?error=age`, the same outcome as §5.2.
     - The profile is inserted. A PK `23505` → redirect to the role home.
     - **Never** delete the user on an insert failure: the legacy rollback at `auth.ts:99-122` / `auth-adult.ts:150-165` is removed. A failure leaves a verified, profile-less user, who goes to `/welcome` (§5.1).
- **Sign-in when unconfirmed: a verify-only path.**
  - `signIn` today collapses every error to "Email or password is incorrect" (`auth.ts:168-174`). It gains one branch: `email_not_confirmed` → "Enter the code we sent" (with resend) → `verifyEmailOnly`.
  - `verifyEmailOnly` runs `verifyOtp` and **no profile insert**. This is the path for legacy beta accounts in §8, which already have profiles.
  - To avoid account enumeration, the branch shows only after a correct password.
- **Rate limits:**
  - New `signup_verify` (per email) and `signup_resend` (per email) buckets need the action-name CHECK migration.
  - Supabase's own OTP limits apply as well.
- **Abandoned unverified signups** are covered by the cleanup reaper (§7).
- **Result:** every new password account has a verified owner. Supabase's linking safeguard then applies. An unconfirmed password identity is **removed** when the real owner links Apple or Google. **No extra code is asked after a verified Apple/Google sign-in.**

## 5. Server design (shared by all surfaces)

### 5.1 Session state and gates

`getSessionState()` returns one of: `none | orphan | needs_onboarding | parent | athlete | adult_athlete | error`.
- It uses `.maybeSingle()`. A query error is `error`, never onboarding.
- **`needs_onboarding`:** authenticated, **no profile row**, and either:
  - `app_metadata.providers` includes `apple` or `google`; or
  - an email identity with `email_confirmed_at` set (the §4 code was verified but the profile insert didn't land).

  Both fields are server-controlled.
- **`orphan`:** authenticated, no profile row, and an email-only identity with `email_confirmed_at` null. It keeps today's sign-out behaviour.
- Synthetic athlete emails (`athletes.fromvictory.app`) always have a profile, so they never reach either state.

Gates:
- `redirectIfAuthed` and every `require*` send `needs_onboarding` → `/welcome`.
- `requireOnboarding()` sends `orphan` → `/auth/signout`.
- The shell router sends `needs_onboarding` → `/welcome` **only in `FVAuth/1` builds**. Older builds keep the sign-out.

**Invariant:** gates keep using `getUser()`. `getClaims()` alone must never gate access, because it can't see revoked sessions.

### 5.2 `/welcome` (completion, every surface)

The page is server-rendered, `noindex`, has no analytics, and is in the service-worker bypass list (both `public/sw.js` and `lib/sw/route-strategy.ts`; bump `CACHE_VERSION`).

It contains:
- "Signed in as <email>". This is the auth email, never the provider name or avatar.
- Account type: two tap cards, "Parent" / "Athlete 18+". The `as` hint preselects one. When `ENABLE_ADULT_SIGNUP` is off, only the parent path shows.
- **Parent:** first_name, consent, plus "I'm a parent or guardian and I'm 18 or older".
- **Adult:** the `signUpAdultAthlete` fields and schema (birthdate with `autocomplete="bday"`, sport, attestation, consent), in `AuthStep` steps.

`completeOnboarding` (POST Server Action):
- Rate limit: the `sign_up` bucket (IP).
- Inserts the profile with the user's own session, using the exact column sets of the password signups.
- A PK `23505` conflict → redirect to the role home. **Never** delete on an insert failure.
- An adult birthdate under 18 → `revokeAppleTokens` (§5.4) → service `deleteUser` → sign out → `/signup?error=age`. Only the count is logged; the birthdate is never logged.

"Use a different account" is a quiet link with a confirm step. It calls `cancelOnboarding`:
- re-checks that no profile exists;
- revokes Apple tokens;
- deletes the user;
- signs out.

The relay line reads: "Signed in with a hidden Apple email and already have an account? Use a different account, then sign in your usual way."

Routing after completion matches today's signups. In the legacy-native Android shell, adults go to `/athlete`.

### 5.3 Google (all surfaces): Supabase-hosted OAuth with PKCE

1. JS in the page (browser or WebView) calls `signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: inApp, scopes: "openid email" } })`. The verifier cookie lands in that browser's or WebView's jar.
2. **Web:** a normal redirect, with `redirectTo` = `https://www.fromvictoryapp.com/auth/callback?next=…`.
3. **Apps:** `redirectTo` = `com.fromvictoryapp.app://auth/callback`. The returned provider URL opens in `FVAuth.startSession` (§6). The plugin returns the callback URL, and JS navigates the **WebView** to `https://www.fromvictoryapp.com/auth/callback?code=…&next=…`. The exchange therefore happens with the WebView's verifier.
4. Interception of the custom-scheme URL yields only a code that is useless without the WebView's verifier (RFC 8252 §8.1). On iOS, `ASWebAuthenticationSession` delivers the callback only to our app.

`/auth/callback`:
- Handle provider `error` params first, then the exchange.
- `next` allow-list: `/welcome`, `/dashboard`, `/athlete`, `/subscribe`, `/reset-password`. Anything else → the role home.
- Errors → `/signin?error=oauth`. Recovery errors keep `?reset=invalid`.
- Resolve state: `needs_onboarding` → `/welcome`.

### 5.4 Apple (all surfaces): we redeem the code, Supabase signs in by ID token

One path everywhere, so every Apple sign-in yields a stored refresh token for revocation (TN3194).

**iOS app (native sheet).**
1. `FVAuth.signInWithApple({ nonceHash })` uses `ASAuthorizationAppleIDProvider`, scope `email` (no `name`). It returns `identityToken` and `authorizationCode`. The raw nonce is generated in the WebView JS and kept there.
2. POST Server Action `appleNativeSignIn({ identityToken, authorizationCode, rawNonce })`:
   1. `signInWithIdToken({ provider: "apple", token, nonce: rawNonce })` with the cookie client sets the session in the WebView.
   2. Redeem the code at `https://appleid.apple.com/auth/token` with `client_id` = `com.fromvictoryapp.app` and a server-minted client-secret JWT.
   3. Store the refresh token (§5.5).
   4. Resolve state → `/welcome` or the role home.

**Web.** These are our own routes (no Apple JS SDK).
1. `/auth/apple/start`:
   - generates `state` and a raw nonce;
   - sets them in `__Host-` cookies (HttpOnly, Secure, `SameSite=None`, 10 min), because Apple's `form_post` is a cross-site POST;
   - redirects to Apple `authorize` with `client_id` = the Services ID, `response_type=code id_token`, `response_mode=form_post`, `scope=email`, `nonce=SHA256(raw)` and `state`.
2. `/auth/apple/callback` (POST). Apple posts from `Origin: https://appleid.apple.com`, so this route is exempt from any Origin/CSRF check in `middleware.ts` and route config. `state` is its CSRF defence.
   1. Verify `state` against the cookie.
   2. `signInWithIdToken` with the raw nonce.
   3. Redeem the code (`client_id` = Services ID).
   4. Store the token.
   5. Clear the cookies.
   6. Redirect → `/welcome` or the role home.
   7. Errors → `/signin?error=oauth`.

**Android app.** The same web routes, run inside `FVAuth.startSession`, plus a bound handoff. The session must land in the WebView, not the Auth Tab.
1. The WebView generates a handoff `verifier`, keeps it in JS memory, and opens `/auth/apple/start?app=android&challenge=SHA256(verifier)` in `FVAuth.startSession`.
2. `/auth/apple/callback` verifies `state`, verifies the ID token **without** creating a session, and redeems the code. It then writes a single-use **handoff row** in `private.apple_signin_handoffs` (service-role only, TTL 3 min). The row holds:
   - the challenge;
   - the `state`;
   - the encrypted ID token and raw nonce;
   - the encrypted refresh token and `client_id`.

   It then redirects to `com.fromvictoryapp.app://auth/callback?handoff=<id>`. The id has at least 128 bits of entropy.
3. The plugin returns the URL. The WebView POSTs `{ handoff, verifier }` to `appleHandoffComplete`, which is rate-limited per IP. The action:
   1. Opportunistically purges expired rows.
   2. Checks that SHA256(verifier) = challenge and that the row is unused and unexpired. **Any mismatch deletes the row**, so a guess burns it.
   3. On success, deletes the row and calls `signInWithIdToken` with the cookie client, so the session lands in the WebView.
   4. Stores the token.
4. A stolen handoff id is useless without the verifier.
5. **Replaying the stored ID token is defended only by the nonce check**: the raw nonce never leaves the server row, and the row is single-use.
6. **An unused handoff still holds a live Apple grant.** The purge (here and in the reaper) calls `/auth/revoke` with the stored refresh token **before** deleting the row.

**Secrets.**
- Server env: `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_SIGNIN_P8` (Vercel, Sensitive). Client secrets are minted per request with a 5-minute expiry, so **there is no 6-month manual rotation**.
- Supabase's Apple provider holds **Client IDs only** (Services ID first, then the bundle ID) for ID-token audience checks. Gate S4 confirms that no Supabase-side secret is needed when hosted Apple OAuth is unused.
- **Grouping:** the Services ID is grouped under the primary App ID, so web, Android, and iOS share one Apple `sub` and relay email (S3).

### 5.5 Apple token storage and revocation

**Table `private.apple_signin_tokens`:**
- Columns: `user_id` (FK → `auth.users` on delete cascade), `client_id`, `refresh_token_ct`, `iv`, `tag`, `key_version`, `created_at`. Primary key `(user_id, client_id)`.
- RLS is on with **no policies**. `revoke all` from `public`, `anon` and `authenticated`. Service role only.
- There is an effect-based RLS-harness assertion (FV-507 pattern).

**Encryption:**
- AES-256-GCM at the application level. The key is `APPLE_TOKEN_KEY` (32 bytes, Vercel Sensitive; staging has its own key). `key_version` supports rotation.
- AAD binds each ciphertext to its row:
  - token rows: `"token|" + user_id + "|" + client_id`;
  - handoff rows: `"handoff|" + id`.

  A ciphertext copied to another row then fails to decrypt.
- Tokens are never logged; the error-capture paths scrub them.
- **The `private` schema is not exposed through PostgREST.** It is not in the API's exposed schemas, and `usage` is revoked from `anon` and `authenticated`. The harness asserts both.

**Minimization:** store the refresh token only. The ID token (which contains the email) and the access token are not stored. This narrows TN3194's "store the token response". It is sufficient for revocation, which is the only use.

**Revoke paths.** `revokeAppleTokens(userId)` calls `POST /auth/revoke` with the matching `client_id` for each row. It runs **before** every user delete:
- `deleteAccount`;
- the under-18 rejection;
- `cancelOnboarding`;
- the reaper.

**Failure:**
- 3 retries with backoff.
- If revocation still fails, **deletion proceeds anyway** (TN3194). The confirmation page shows the manual instruction (Settings → [name] → Sign-In & Security → Sign in with Apple → From Victory → Stop Using; https://support.apple.com/en-us/102571), and an alert counter increments.
- The deletion confirmation shows the manual instruction whenever no token row existed.
- **Accepted limit:** retries happen only within the request. Once the user is deleted, the cascade removes the only copy of the token, so the manual instruction plus the alert counter is the remedy.

`deleteAccount` determines `hasAppleIdentity` **before** deleting, since the user is gone afterwards. It revokes **per deleted user**: the payer and any adult athletes, following the existing deletion order (`account.ts:291-322`).

### 5.6 Residual access after sign-out, deletion, or rejection

**Server-rendered and server-action paths:** `getUser()` rejects revoked sessions and deleted users immediately. This already holds and is now an invariant (§5.1).

**Direct PostgREST from a still-held access JWT** remains valid until `exp`. RLS reads `auth.uid()` from the JWT.
- **Deleted users and rejected under-18s:** their rows cascade away, and FKs block inserts. Nothing is reachable.
- **Shared-device sign-out:** the token leaves that device. A copied token works until expiry.

**Change:** `jwt_expiry` 3600 → **900**, after S7 confirms the offline pregame and app resume refresh cleanly. This is a project-wide setting, so it also shortens how long the offline pregame can reuse a token.

**Revoking another user's sessions.** `auth.admin.signOut(jwt, scope)` needs that user's live JWT, which we don't hold. So the beta transition (§8) revokes sessions with service-role SQL:

```sql
delete from auth.sessions where user_id = any($1);
```

Refresh tokens cascade. This is rehearsed in S8. The 15-minute residual window then bounds any leftover access.

### 5.7 Cleanup reaper (`/api/cron/reap-incomplete-signups`)

**Targets.** Users with **no profile** older than 1 hour that are either:
- OAuth (`app_metadata.providers` apple/google); or
- email signups whose code was never verified (`email_confirmed_at` null).

**Schedule and safety:**
- Runs every 15 minutes.
- Dry-run (`REAPER_DRY_RUN`) for the first week.
- A per-run cap of 100.
- **Re-checks** that no profile exists right before each delete.
- Revokes Apple tokens, then deletes.

**Mechanics:**
- The finder is a `security definer` function with `search_path = ''`. It returns ids only, has `revoke all … from public, anon, authenticated`, and grants `execute` to `service_role` only. Harness assertion.
- `CRON_SECRET` is checked with `timingSafeEqual`. Logs are counts only.
- The entry goes in the root `vercel.json`.
- It also purges expired handoff rows, revoking each stored refresh token first (§5.4).

### 5.8 Data minimization

- Scopes: Apple `email`; Google `openid email`. S4 verifies what Supabase actually sends.
- Provider name, avatar, and photo may still sit in `auth.users.raw_user_meta_data` / `auth.identities.identity_data` (GoTrue rewrites them on each sign-in).
- **A CI grep guard** fails on any read of `user_metadata`, `raw_user_meta_data`, `identity_data`, `full_name`, `avatar_url`, or `picture` outside an allow-list, including the logging and alert paths.
- A deletion proof test checks that no `auth.users`, `auth.identities`, or `private.apple_signin_tokens` row survives deletion or reaping.
- **KC signs the exception** (E3): Supabase auth may hold a provider name or photo for SSO adults, never read or shown. This is a deviation from the "no photos" minimal-PII rule, limited to parent and adult data.

## 6. Native apps

### New app-local plugin `FVAuth` (iOS + Android)

No third-party SDK. It needs product-strategist and kids-privacy-officer review under the `capacitor.config.ts` plugin-allowlist rule.

| Method | iOS | Android |
|---|---|---|
| `startSession({ url })` → `{ url }` | `ASWebAuthenticationSession(url:callbackURLScheme:)` (iOS 12+, fine on target 15), `prefersEphemeralWebBrowserSession = false` | **Auth Tab** (`androidx.browser:browser:1.9.x`) with a Custom Tab fallback; returns the callback URL |
| `signInWithApple({ nonceHash })` → `{ identityToken, authorizationCode }` | `ASAuthorizationAppleIDProvider`, scope `email` | not provided (Android uses `startSession` + the handoff, §5.4) |

**Plugin hardening** (it must not become a general browser launcher):
- The callback scheme is **hard-coded natively** (`com.fromvictoryapp.app`), never taken from JS.
- `startSession` rejects any `url` whose host isn't on a native allow-list:
  - the Supabase auth host (`kumrgeosgzdlxgljbyju.supabase.co`, plus the staging ref);
  - `www.fromvictoryapp.com`, for the Apple start route.
- Only one session runs at a time.
- `prefersEphemeralWebBrowserSession = false` (it shares Safari's provider login) is used only in adult flows, and is disclosed in the App Review notes.

### Build changes

- **iOS:**
  - the Sign in with Apple capability in `App.entitlements` plus a regenerated provisioning profile;
  - the URL scheme `com.fromvictoryapp.app` (`CFBundleURLTypes`);
  - register `FVAuth` in `FVBridgeViewController`;
  - UA → `FVNativeShell/1 (ios) FVAuth/1`.
- **Android:**
  - `androidx.browser` 1.9;
  - a custom-scheme `VIEW` intent-filter for the Custom Tab fallback;
  - register `FVAuth` in `MainActivity`;
  - append `FVAuth/1` to the UA.
- **Capacitor config:** `allowNavigation` is unchanged. The WebView never visits provider domains; the system browser does.
- **Web code:** a `lib/native/auth.ts` wrapper reads `window.Capacitor.Plugins.FVAuth`, in the same pattern as `apple-iap.ts`.

### Callbacks and deep links

- Both platforms use the custom scheme `com.fromvictoryapp.app://auth/callback`. iOS 15 can't use https callbacks (they need 17.4+).
- Android Universal/App Links are not used, so the placeholder `assetlinks.json` fingerprint is not a blocker for this work. Fix it separately if App Links are adopted.
- Safety comes from PKCE (Google) or the bound handoff (Android Apple), plus `ASWebAuthenticationSession`'s per-app delivery.

### Store rollout

- **iOS:**
  - a new build;
  - App Review notes covering the demo account, how to see Apple/Google sign-in, and that in-app account deletion exists (5.1.1(v));
  - App Privacy labels updated (email, user ID linked to identity for sign-in).
  - Guideline 4.8 is met because Sign in with Apple ships alongside Google.
- **Android:**
  - a new build;
  - the Data safety form updated (email and user ID collected via Google/Apple sign-in, not shared).
  - Timing per E1.
- **The server deploys first, with flags off.** Builds go to TestFlight / Play internal testing pointed at staging (`CAPACITOR_SERVER_URL`), then production review with `SSO_IOS`/`SSO_ANDROID` = `preview`. Turning a surface on is a server flag flip. No app update is needed after approval.

## 7. Configuration checklist (KC; the consoles need his login)

| # | Item |
|---|---|
| C1 | **Staging Supabase project** (`from-victory-staging`) + a Vercel environment wired to it (this also closes the Preview env gap). Migrations are applied via CI to staging. |
| C2 | **Custom SMTP (Resend)** for production and staging auth email. Registered with Apple Private Email Relay (SPF/DKIM aligned). |
| C3 | **Apple:** <br>• enable Sign in with Apple on App ID `com.fromvictoryapp.app` (primary); <br>• Services IDs for production and staging, **grouped** with the primary App ID, with return URLs `https://www.fromvictoryapp.com/auth/apple/callback` (+ staging); <br>• a Sign in with Apple key (.p8) → Vercel `APPLE_SIGNIN_P8`, `APPLE_KEY_ID`, `APPLE_TEAM_ID`. |
| C4 | **Supabase Apple provider:** enabled, Client IDs = Services ID (first), then the bundle ID. |
| C5 | **Google:** <br>• OAuth consent screen (External; privacy policy on fromvictoryapp.com; scopes `openid email`); <br>• a Web OAuth client with the redirect = the Supabase callback for production and staging; <br>• **brand verification** (Search Console ownership; takes days, start first). |
| C6 | **Supabase:** <br>• the Google provider; <br>• **Confirm email ON** with the OTP template (production only after §4 ships); <br>• OTP expiry 900s; <br>• redirect allow-list (exact): `https://www.fromvictoryapp.com/auth/callback` and `com.fromvictoryapp.app://auth/callback` (+ staging). |
| C7 | Vercel env: `APPLE_TOKEN_KEY`, `SSO_WEB`, `SSO_IOS`, `SSO_ANDROID` = `off`, `REAPER_DRY_RUN=true`. |
| C8 | Privacy policy (§10) published before any flag leaves `off`; it is also the consent-screen URL. |
| C9 | Optional: a Supabase custom auth domain (~$10/mo) so Google's consent screen shows our domain. Not required. |

## 8. One-time beta-account transition

**Purpose:** close the unsafe legacy path. Existing real-email accounts were autoconfirmed and never proven, so Supabase treats them as verified. Do this without building customer migration UX.

**This spec authorizes none of the account changes below.** Steps T3–T4 each need KC's explicit go on a named list.

**T1 — Inventory (read-only).** The lead runs it with KC on production.

The output stays **out of the repo**, Linear, PRs and chat. It is stored encrypted with KC-only access, because it contains PII. It holds an email *class*, not addresses; KC looks up addresses in the dashboard as needed.

For every `auth.users` row:
- id;
- email class (synthetic athlete / real / relay);
- role;
- `created_at`, `last_sign_in_at`, `email_confirmed_at`;
- providers;
- subscription provider and status;
- comp grant;
- number of athletes;
- admin flag;
- reviewer-account flag.

**T2 — Classify (KC).** Every real-email account is either:
- **Keep, KC-controlled:** KC's own accounts, the App Review demo account, the Play reviewer account; or
- **Keep, beta tester:** has athletes, history, or a subscription worth keeping; or
- **Disposable.**

Minor athletes (synthetic emails) are kept under their parent's decision and are unaffected by SSO.

**T3 — Prove ownership for kept accounts** (after §4 is live):
- **KC-controlled accounts:** KC resets each password himself via the email code and updates the reviewer credentials stored outside the repo and the review notes.
- **Beta testers:** one service-role SQL transaction, rehearsed on staging first (S8). It runs against an explicit id list. The predicate also **excludes `%@athletes.fromvictory.app`**, and the T1 query asserts that no synthetic address is in the set. The transaction:
  1. `update auth.users set email_confirmed_at = null`;
  2. sets `identity_data.email_verified = false` on their `email` identities. S8 proves whether linking reads this flag; if it doesn't, the step is harmless;
  3. `delete from auth.sessions` for those users (§5.6).

  On their next password sign-in they enter the emailed code (§4 verify-only path). If they use Google/Apple first, Supabase removes the unproven password identity on linking.
- This is built-in behaviour. No new UI beyond §4's "enter the code" screen.
- **Locked-out parent** (unreachable or mistyped inbox): they can't reach in-app deletion. Support runbook:
  1. verify the person out of band;
  2. run the service-side deletion cascade, including Apple revoke;
  3. honor the request within 30 days.

**T4 — Disposable accounts:**
- cancel any sandbox/test subscriptions;
- delete through the app's deletion path, so cascades and Apple revocation run.

Until KC authorizes that deletion, treat them like T3 accounts: unconfirmed, with sessions revoked. They then can't sign in without proving the inbox.

**T5 — Close and verify:**
- before enabling any SSO surface, a query must show **zero** real-email accounts (synthetic athlete addresses excluded) that are confirmed but not in the T3 "proven" list;
- Confirm email stays ON permanently (see rollback);
- a privately stored T1 snapshot is kept until 30 days after launch, then deleted.

## 9. Security points

- **Pre-registration takeover:**
  - closed for new accounts by §4 (verified email + Supabase's unconfirmed-identity removal);
  - closed for legacy accounts by §8;
  - validated in staging (S2, S8), not assumed.
- **Open redirect:** the `next` allow-list (§5.3).
- **Role from client:** `as` is a hint. Roles are set only by the validated completion. Provider data never grants a role or entitlement.
- **Minors:**
  - no SSO entry on the under-18 section;
  - an adult birthdate under 18 is deleted immediately (Apple tokens revoked first);
  - abandoned attempts are reaped within ~75 minutes;
  - no birthdate is stored or logged;
  - the parent path adds the 18+ guardian attestation.
- **Server Actions only** (Origin-checked POST) for:
  - `startEmailSignup`, `completeEmailSignup`, `verifyEmailOnly`;
  - `completeOnboarding`, `cancelOnboarding`;
  - `appleNativeSignIn`, `appleHandoffComplete`.

  Ids come from `getUser()`.
- **Apple `form_post`:**
  - the `state` and nonce cookies are `__Host-`, `SameSite=None`, Secure, 10-minute and single-use;
  - `/auth/apple/callback` is exempt from Origin checks, and `state` is its CSRF defence.
- **Handoff rows:**
  - single-use, 3-minute TTL, an id of ≥128 bits;
  - verifier- and state-bound, burned on any mismatch, rate-limited;
  - encrypted with row-bound AAD;
  - Apple grant revoked before an unused row is purged.
- **Native plugin:** host allow-list and a hard-coded callback scheme (§6).

## 10. Privacy, policy, and store disclosures

`app/privacy/page.tsx` must say:
- Google and Apple are sign-in providers. Each acts as an independent controller of its own sign-in;
- **Resend** delivers our email, including sign-in codes. Name it as a processor alongside Stripe and our hosting and auth providers;
- what we receive: email and the provider user ID. A name or photo may be held by our auth provider and is never used or shown;
- Apple and Google learn that a parent or adult uses From Victory. They **receive no athlete data**;
- a parent's sign-in method (including Apple or Google) controls access to their athlete's data and its deletion. The athlete keeps their own username login;
- we keep an **encrypted Apple refresh token** solely to revoke Sign in with Apple when an account is deleted;
- minors (13–17) don't use SSO;
- unfinished sign-ups are deleted within about an hour;
- how to revoke Apple access manually;
- the relay-address recovery limit;
- new email signups are verified by code.

This is a privacy-path change: kids-privacy-officer review, then KC wording.

Store disclosures:
- iOS App Privacy labels and Play Data safety, as in §6. Both describe email and user ID as collected **from parents and adult athletes only**.
- **Support runbook:**
  - Hide My Email duplicates: the user picks the account that holds their subscription. No manual merges without re-verifying both inboxes.
  - Relay users who lose their relay inbox cannot recover the account.

## 11. Essential decisions (KC)

| # | Decision | Recommendation |
|---|---|---|
| E1 | **Android new-account creation via SSO.** Today the Android app has no signup (Path A, consumption-only) and no Play Billing. | Ship Android SSO in the **Play Billing v1.1 build** (FV-620 chain), so new Android users can create *and* subscribe in-app. Sign-in for existing accounts is in the same build. |
| E2 | **Staging Supabase project spend** (≈ one extra project's compute on the current plan; confirm on the billing page) | Approve. S1–S10 can't run safely on production. |
| E3 | **Provider-metadata exception** (§5.8) | Sign it, with the CI guard + deletion proof + policy disclosure. |
| E4 | **Transition lists and authorization** (§8 T2–T4) | Classify after T1. Authorize T3/T4 separately, by named list. |
| E5 | **Copy:** sign-in sections, buttons, `/welcome`, code screens, errors, relay line, Apple revoke note, in-app-browser line | Approve at PR review. |

**Engineering defaults (not decisions):**
- `jwt_expiry` 900 after S7;
- reaper TTL 1h, every 15 min;
- OTP 15 min.

**Product-strategist and privacy re-review:**
- native scope plus the new `FVAuth` plugin and `androidx.browser` dependency are reviewed at A0;
- KC's settled scope stands, and the reviews check implementation, not scope.

## 12. Implementation sequence and delivery issues (Tier 2 unless noted)

| # | Issue | Owner | Contents | Depends on |
|---|---|---|---|---|
| A0 | Setup + reviews | KC + lead | C1–C9; product-strategist + kids-privacy-officer review of `FVAuth`/`androidx.browser`; privacy-policy PR (§10) | — |
| A1 | **Verified email signups** | backend + frontend | §4: two-step signup, `completeEmailSignup`, unconfirmed sign-in path, rate-limit migration, OTP template; Confirm email ON in prod at merge | C1, C2 |
| A2 | **Beta transition** | lead + KC | §8 T1→T5 (T3/T4 on KC's named authorization) | A1 live, S8 |
| A3 | Session core | backend | §5.1, §5.2, §5.6 (`jwt_expiry` after S7), `/auth/callback` (§5.3) | A1 |
| A4 | Apple core + token store | backend | §5.4 web routes, `appleNativeSignIn`, `appleHandoffComplete`, §5.5 table/encryption/revoke + deletion integration | A3, C3, C4 |
| A5 | Reaper | backend | §5.7 migration, harness, cron | A3, A4 |
| A6 | Web UI + entry points | frontend | §3 (after FV-657 merges), `/welcome`, SW bypass, flags + preview cookie, error states | A3, A4 |
| A7 | **Staging validation** | qa + lead | S1–S10 on staging, web plus TestFlight and Play-internal builds pointed at staging | A1–A6, A8, A9 |
| A8 | iOS build | frontend (native) | §6 iOS plugin + entitlements + UA; TestFlight | A3, A4 deployed (flags off) |
| A9 | Android build | frontend (native) | §6 Android plugin + UA; ships in the Play Billing v1.1 build per E1 | A3, A4 deployed; FV-620 chain |
| A10 | Launch | KC + qa | web `preview` → `on`; iOS review → `preview` → `on`; Android same; product-truths entry; one-week watch | A2 T5 done, A7 green, store approvals |
| A11 | Docs | lead | CLAUDE.md Out-of-scope line → "social sign-in for minors (13–17)"; same at `.claude/agents/product-strategist.md:67`; support runbook; Apple key/secret runbook | KC approves this spec |

**Order:** A0 → A1 → (A2 ∥ A3) → A4 → (A5 ∥ A6 ∥ A8 ∥ A9) → A7 → A10.

Web can reach `on` before the native builds are approved (the internal milestone). iOS and Android follow their own reviews.

**Review chain** for every code PR: `/review` → qa-reviewer → kids-privacy-officer → KC merge.

**Hot files:** `SignInChooser` (after FV-657), `guards.ts`, `sw.js` + `route-strategy.ts`. Serialize A3/A6.

## 13. Validation and tests

### Staging gates (A7). All must pass (S1–S10) before any production flag leaves `preview`.

| # | Proves |
|---|---|
| S1 | The OTP signup confirms with `type: "email"`; Resend delivers the code to Gmail, iCloud, and an Apple relay address; unconfirmed sign-in → code screen. |
| S2 | Linking: Google onto (a) a confirmed password user → same user id, password still works; (b) an unconfirmed password user → linked, **password identity removed**; (c) an autoconfirmed legacy-style user → linked, password kept (this demonstrates why §8 is required). |
| S3 | The Apple `sub` and relay email are identical via the Services ID (web, Android) and the bundle ID (iOS) → one Supabase user. |
| S4 | `signInWithIdToken` accepts Apple tokens with `aud` = the Services ID **and** `aud` = the bundle ID (raw nonce), and **rejects an unknown `aud`**, with no Supabase Apple secret configured. Record the scopes Supabase sends for Google. |
| S5 | Code redemption returns a refresh token for both `client_id`s; revoke succeeds; a revoked user sees Apple's consent again. |
| S6 | App callbacks: iOS `ASWebAuthenticationSession` and Android Auth Tab, plus the Custom Tab fallback (Chrome < 137), return the custom-scheme URL, including a **second** sign-in with an existing Google session (an auto-redirect without a gesture). The WebView exchange succeeds. The Android Apple handoff completes; a replayed handoff fails. |
| S7 | `getUser()` rejects a revoked session and a deleted user on the server routes. `jwt_expiry` 900 doesn't break the offline pregame or the app's resume refresh. |
| S8 | Transition rehearsal (the §8 T3 transaction on staging copies):<br>• password sign-in then requires the code;<br>• a real Google link **removes the password identity**. If it only does so with `identity_data.email_verified=false`, that step is mandatory;<br>• `delete from auth.sessions` ends server access on the next request;<br>• no synthetic athlete account is touched. |
| S9 | Apple `form_post` with `SameSite=None` state cookies works in Safari (ITP) and Chrome. |
| S10 | Recovery:<br>• an SSO-only user (no password) uses Forgot password with a verified email → sets a usable password → signs in with email in each app (also with an Apple relay address);<br>• an **unconfirmed** legacy beta user who forgot their password gets a usable recovery code, not just a confirmation resend. |

### Acceptance test (A10, production, KC's real accounts, per role)

Create an account on the web with Apple, then with Google (parent and adult), then:
- sign into the **iOS app** with the same provider;
- sign into the **Android app** with the same provider;
- see the **same subscription state** (Stripe and Apple IAP) and the **same athletes and history** on all three.

Also:
- Apple on iOS with a real email, then Google on Android with that same email → one account.
- Apple with Hide My Email → a separate account. The relay line and support recovery work.
- Deleting an Apple-created account → the token is revoked (check in Apple ID settings), and no auth, identity, or token rows remain.

### Unit tests (Vitest)

**Session and routing:**
- resolver (all states, including query error);
- guards and shell router (`FVAuth/1` vs older UA);
- callback (allow-list, `//evil`, `/admin`, absolute URL, backslash, provider error, recovery).

**Signup and onboarding:**
- `startEmailSignup`: under-18 adult or missing attestation → **no auth row and no email**;
- `completeEmailSignup`: wrong, expired or resent code; rate limits; profile insert; `23505` → redirect; insert failure → **no delete**; under-18 → delete;
- `verifyEmailOnly`: no insert, for an existing profile;
- `signIn`: the `email_not_confirmed` branch appears only after a correct password;
- `completeOnboarding` (parent attestation, adult, under-18 delete with revoke-first, flag off, `23505` no-delete);
- `cancelOnboarding` (re-check, idempotent).

**Apple:**
- `appleNativeSignIn` and the web callback (state mismatch, nonce mismatch, redemption failure → sign-in proceeds and the deletion fallback is noted);
- the handoff:
  - bad verifier **burns the row**;
  - expired;
  - replay;
  - rate limit;
  - an unused row's purge **revokes first**;
  - AAD mismatch fails to decrypt;
- `/auth/apple/callback` is not blocked by the Origin checks;
- `FVAuth` host allow-list: native unit tests reject non-allow-listed hosts;
- `revokeAppleTokens` (matching `client_id`, retries, failure → delete proceeds);
- encryption round trip and key version.

**Visibility and reaper:**
- `showSSO` (each surface, UA, flag, preview cookie, denylist);
- reaper (targets, dry-run, cap, re-check, revoke-first).

**Static:** the metadata grep guard; SW bypass sync. Extend the existing `native-shell` mocks in `signin-native-shell.test.tsx` and `signup-routing.test.tsx`.

### RLS harness

- `private.apple_signin_tokens`, the handoff table, and the reaper finder: no access for `anon`/`authenticated`; `EXECUTE` denied to `PUBLIC`.
- Deletion proof.

### E2E (local Supabase; no real providers in CI)

- Set `enable_confirmations = true` in the local `supabase/config.toml` (it is `false` today, `:207`) so CI exercises §4. The existing seeds already use `email_confirm: true` (`e2e/global-setup.ts:263,341`).
- Seed OAuth users with `app_metadata.providers` and fresh users per test.
- Node-side session cookie injection (no app route).
- A separate Playwright project.
- Paginated cleanup.
- `ci.yml` sets the flags.
- Clear the rate-limit rows per test.

Scenarios:
- `/welcome` parent/adult/under-18/cancel;
- the two-step email signup with an OTP read from local Inbucket/Mailpit;
- shell UAs with and without `FVAuth/1` → buttons absent/present in the SSR HTML.

The `E2E (non-required)` job must be run green by hand before merging A1/A3/A6.

### Device QA (A7/A10)

iPhone (iOS 15 + current) and Android (Chrome < 137 + current), on staging builds, then production review builds:
- buttons present only in `FVAuth/1` builds;
- each provider × role;
- the cancel paths;
- deletion with Apple;
- older installed builds show no SSO.

Plus a manual WCAG pass: focus, labels, contrast on onyx, `aria-live`, banner focus.

### Rollback (each layer)

| Layer | How | Caveat |
|---|---|---|
| UI exposure | Set `SSO_WEB` / `SSO_IOS` / `SSO_ANDROID` to `off` (a redeploy). This hides buttons on web **and** in shipped apps (server-rendered). | Native plugins stay dormant; app builds can't be rolled back. |
| Server code | Vercel instant rollback to the previous deployment | The previous code signs out `needs_onboarding` users (acceptable), ignores the token table, and may lack the reaper route. Run the reaper after roll-forward. |
| Provider config | **Keep the providers enabled** in Supabase even with flags off. Disabling strands SSO-only users; recovery is Forgot password via verified email. | Recovery for an SSO-only user is gate S10: prove that the recovery email sets a usable password (add to A7). |
| Email confirmation | **Never turn it OFF while any SSO surface is on.** If §4 must be rolled back, set the SSO flags to `off` first. | Turning it OFF reopens pre-registration takeover. |
| Data and migrations | Additive (token, handoff, finder, rate-limit actions). Leave them in place on rollback. Never drop the token table while it holds tokens for live accounts; revoke first. | — |
| Transition (§8) | Not reversible. The T1 snapshot exists for reference only. That is why T3/T4 need separate named authorization. | — |
| Reaper | `REAPER_DRY_RUN=true`, or remove the `vercel.json` entry | — |

## 14. Superseded (do not reopen)

- **"Website-first, native deferred to Phase B":** replaced by native in scope (§6). Web-first is only an internal milestone.
- **Permanent first-link password rotation / "password or reset" screen:** replaced by verified email signups (§4) plus the one-time beta transition (§8).
- **TN3194 manual-revoke-only for Apple:** replaced by stored tokens and real revocation (§5.5). Manual revocation remains only as the failure fallback.
- **Parent-tab-only SSO with a "switch tab" button:** replaced by the single "Parent or Athlete 18+" section (§3).
- **Supabase-hosted Apple OAuth with a 6-month client-secret rotation:** replaced by our own code redemption with per-request client secrets (§5.4).
- **The custom auth domain as a decision:** now optional (C9).

## 14a. Review log

**v1 → v2:** backend, frontend, QA and privacy reviews (web-only design). Their findings carried forward where still applicable:
- the SW bypass sync plus cache bump;
- the gold focus ring;
- provider button specs;
- `maybeSingle` and the error state;
- the `23505` no-delete rule;
- the reaper safety measures;
- the CI metadata guard;
- the 1h TTL;
- the parent attestation.

**v3** (KC clarification: native in scope, beta users only):

**Backend:**
- session revocation by SQL (`admin.signOut` needs the user's JWT);
- clear `identity_data.email_verified` in T3 and prove it in S8;
- a verify-only path for legacy accounts;
- `completeEmailSignup` never deletes;
- the `needs_onboarding` definition fixed;
- the `signIn` error branch;
- the handoff burned on mismatch and rate-limited;
- `/auth/apple/callback` exempt from Origin checks;
- `aud` tests;
- revoke per deleted user;
- local `enable_confirmations` for CI.

**Privacy:**
- step 1 validates age and attestation **before** `auth.signUp`;
- an unused handoff revokes its Apple grant before purge;
- Resend named as a processor;
- disclosures covering minors of SSO parents;
- an out-of-band deletion path for locked-out parents;
- synthetic accounts excluded from T3;
- plugin host allow-list and hard-coded scheme;
- AAD binding;
- `private` schema not exposed.

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
- Source: `internal/models/linking.go`, `internal/api/external.go`, `internal/api/verify.go`, `internal/api/auth.go` at github.com/supabase/auth

**Apple:**
- TN3194: https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple
- Generate and validate tokens: https://developer.apple.com/documentation/signinwithapplerestapi/generate-and-validate-tokens
- Revoke tokens: https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens
- Private Email Relay: https://developer.apple.com/documentation/signinwithapple/communicating-using-the-private-email-relay-service
- Group apps: https://developer.apple.com/help/account/capabilities/group-apps-for-sign-in-with-apple
- ASWebAuthenticationSession: https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession
- App Review Guidelines 4.8 / 5.1.1(v): https://developer.apple.com/app-store/review/guidelines/
- Manual revoke: https://support.apple.com/en-us/102571

**Google and Android:**
- OAuth policies: https://developers.google.com/identity/protocols/oauth2/policies
- Brand verification: https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- Auth Tab: https://developer.chrome.com/docs/android/custom-tabs/guide-auth-tab
- Android intents in Chrome: https://developer.chrome.com/docs/android/intents

**Other:**
- RFC 8252 §8.1: https://www.rfc-editor.org/rfc/rfc8252#section-8.1
- Capacitor Browser (uses SFSafariViewController): https://capacitorjs.com/docs/apis/browser

**Unverified, gated in staging:**
- Apple `sub` identity across client IDs (S3);
- whether Supabase needs no Apple secret for ID-token-only use (S4);
- Chrome custom-scheme handoff on auto-redirect (S6);
- recovery giving an SSO-only user a usable password (S10).
