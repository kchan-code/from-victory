# FV-569 / FV-670: staging provider setup for Apple + Google sign-in

**For:** KC (each step needs your console login or creates a credential).
**Target:** staging only: Supabase `fv-android-staging` (`xmznvajmljhfmexjthlz`) and Vercel `fv-android-staging-web`.
**Production:** nothing here touches it. The production setup is a separate, later checklist (spec §7) and stays gated.
**Cost:** none. All of these are free tiers or accounts you already pay for.

Rules for secrets:
- Paste them only into the target console, or pipe them with the commands below.
- Never paste a secret into chat, Linear, GitHub or a file in the repo.
- Agents don't need to see any value. They only check that the variable exists.

When a step is done, tick it on FV-670. Then tell me which steps are finished. Steps are ordered by what unblocks work soonest.

---

## Step 1. Resend: staging email sender (unblocks the verified-email signup checks, V1)

1. In Resend → **API Keys**, create a key named `fv-staging-supabase-auth`:
   - **Permission:** Sending access.
   - **Domain:** the domain already verified for From Victory.
2. In Supabase (org **FV Staging** → `fv-android-staging`) → **Authentication → Emails → SMTP Settings**:
   - Enable custom SMTP.
   - Host `smtp.resend.com`, port `465`, username `resend`.
   - Password: the key from step 1.
   - Sender email: a staging-only address on the verified domain, for example `auth-staging@fromvictoryapp.com`.
   - Sender name: `From Victory (staging)`.
3. Tell me the sender address you chose. It isn't a secret.

## Step 2. Google Cloud: staging OAuth client (unblocks Google, V0)

1. In Google Cloud console, create a **new project** `fv-sso-staging`. No billing account is needed.
2. Go to **APIs & Services → OAuth consent screen** (Google Auth Platform):
   - **User type:** External. **Publishing status:** Testing.
   - **App name:** `From Victory (staging)`. Use your support email.
   - **Scopes:** `openid` and `.../auth/userinfo.email` only.
   - **Test users:** the Google accounts you'll test with. Use test accounts, not family accounts.
3. Go to **Credentials → Create credentials → OAuth client ID → Web application**, and name it `supabase-staging`:
   - **Authorized redirect URI:** `https://xmznvajmljhfmexjthlz.supabase.co/auth/v1/callback`
   - Leave the JavaScript origins empty.
4. In Supabase staging → **Authentication → Sign In / Providers → Google**:
   - Enable it.
   - Paste the Client ID and Client Secret.
   - Leave "Skip nonce check" **off**.

The apps use this same web client, because they open Supabase's sign-in page in the phone's system browser (spec §5.3). No iOS or Android OAuth client is needed.

## Step 3. Apple: Sign in with Apple for staging (unblocks Apple, V0)

Use developer.apple.com → **Certificates, Identifiers & Profiles**.

1. **App ID.** Open `com.fromvictoryapp.app`, tick **Sign in with Apple**, choose "Enable as a primary App ID", and save.
   - Installed builds are not affected.
   - New builds that include the entitlement need a refreshed provisioning profile; automatic signing handles this.
2. **Services ID.** Go to Identifiers → **+** → Services IDs:
   - **Identifier:** `com.fromvictoryapp.signin.staging`. **Description:** `From Victory sign-in (staging)`.
   - Tick **Sign in with Apple → Configure**:
     - Primary App ID: `com.fromvictoryapp.app`.
     - **Domains:** `fv-android-staging-web.vercel.app`.
     - **Return URL:** `https://fv-android-staging-web.vercel.app/auth/apple/callback`.
   - **If Apple rejects the `vercel.app` domain (gate S9),** stop and tell me. The fallback is a free `staging.fromvictoryapp.com` subdomain:
     - a CNAME to `cname.vercel-dns.com` in Cloudflare, DNS-only (grey cloud);
     - the domain added to the `fv-android-staging-web` Vercel project;
     - then use `https://staging.fromvictoryapp.com/auth/apple/callback` as the return URL.
3. **Key.** Go to Keys → **+**:
   - **Name:** `FV Sign in with Apple staging`. Tick **Sign in with Apple** → Configure → primary App ID `com.fromvictoryapp.app`.
   - Download the `.p8` file (Apple allows this **once**) and keep it somewhere safe outside the repo.
   - Note the **Key ID** and your **Team ID**. Neither is secret.
   - If Apple refuses a separate staging key, tell me. Don't reuse a production key for staging.
4. **Private Email Relay.** Go to Services → **Sign in with Apple for Email Communication → Configure**. Register the sending domain (and the step-1 sender address) so mail reaches Hide My Email addresses.
   - Apple checks SPF, and Resend sends through the `send.` subdomain.
   - Register `fromvictoryapp.com` and `send.fromvictoryapp.com`, then tell me which ones Apple marks as verified.
   - Apple sign-in can't be turned on anywhere until relay delivery works (spec §13 rollback).
5. In Supabase staging → **Authentication → Sign In / Providers → Apple**:
   - Enable it.
   - **Client IDs:** `com.fromvictoryapp.signin.staging,com.fromvictoryapp.app`.
   - Leave the secret-key field **empty**. Our server redeems Apple's codes itself, and gate S4 checks that Supabase never needs the secret.

## Step 4. Staging site secrets (Vercel `fv-android-staging-web`, Production scope of that project only)

Run these in a **throwaway folder**, never in the repo. Linking the repo would repoint its Vercel link. Each value goes from a file or `printf` into Vercel and is never printed:

```bash
mkdir -p ~/fv-staging-env && cd ~/fv-staging-env && vercel link --yes --project fv-android-staging-web
```

```bash
printf %s "<TEAM_ID>" | vercel env add APPLE_TEAM_ID production
```

```bash
printf %s "<KEY_ID>" | vercel env add APPLE_KEY_ID production
```

```bash
vercel env add APPLE_SIGNIN_P8 production --sensitive < ~/path/to/AuthKey_<KEY_ID>.p8
```

```bash
printf %s "com.fromvictoryapp.signin.staging" | vercel env add APPLE_SERVICES_ID production
```

```bash
openssl rand -base64 32 | tr -d '\n' | vercel env add APPLE_TOKEN_KEY production --sensitive
```

Afterwards:
- Delete the folder, which removes the link and any token file: `rm -rf ~/fv-staging-env`.
- I check that the variables exist, not their values.

`APPLE_TOKEN_KEY` encrypts stored Apple tokens. Staging and production must never share it, so production gets its own key later.

## Step 5. What the agent does after steps 1–4 (staging prep you've already authorized)

These are staging auth settings, not new credentials. I make them in the Supabase staging dashboard, from your Chrome session, and record a screenshot for each on FV-670:

- **URL configuration:**
  - Site URL `https://fv-android-staging-web.vercel.app`.
  - Redirect URLs `https://fv-android-staging-web.vercel.app/auth/callback` and `com.fromvictoryapp.app://auth/callback`.
- **Email:** Confirm email **ON**. OTP length 6, expiry 900 s. The "Confirm signup" template uses `{{ .Token }}`.
- **Staging site flags:** `SSO_WEB`, `SSO_IOS` and `SSO_ANDROID` set to `preview`.
- **Deploy:** the integrated SSO branch to `fv-android-staging-web` through the CLI. There is no Git link, so this can't reach production.
- **Notice:** I post on FV-569 and FV-620 before turning Confirm email on, because staging is shared.

## Not in this runbook (separately gated)

- Production Supabase auth settings, providers and SMTP.
- The production Services ID and key.
- Google brand verification for the production consent screen. Request it a few days before production launch; it is not needed for Testing mode.
- Store submissions, and any production deploy or merge.
