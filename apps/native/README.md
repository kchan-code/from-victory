# `@from-victory/native`

Capacitor shell for App Store / Google Play distribution of the hosted From
Victory web app. **Not** a rewrite — the WebView loads production (or
`CAPACITOR_SERVER_URL`).

Full architecture, privacy rules, Android/iOS build steps, and store
prerequisites: **[docs/native-capacitor.md](../../docs/native-capacitor.md)**.

Android Play release (enrollment, keystore, signed AAB, Internal testing, Data
safety): **[docs/android-play-release.md](../../docs/android-play-release.md)**.
iOS / App Store (TestFlight-first; Apple enrollment not started):
**[docs/ios-app-store-release.md](../../docs/ios-app-store-release.md)**.
Application / bundle id is locked: `com.fromvictoryapp.app` (Play Console).

```bash
npm install          # from repo root
cd apps/native
npx cap sync
npm run build:android:debug
```

## Staging SSO build (FV-675)

`FV_SSO_STAGING_BUILD=1` makes a **staging-only** shell that advertises the
app-local `FVAuth` sign-in plugin (`FVAuth/1` in the User-Agent) and accepts
the staging hosts. It refuses to build unless the server URL is the staging
site:

```bash
LANG=en_US.UTF-8 FV_SSO_STAGING_BUILD=1 CAPACITOR_SERVER_URL=https://fv-android-staging-web.vercel.app npx cap sync
```

Re-run `npx cap sync` **without** the env before any production build. Signed
iOS builds need the Sign in with Apple capability on the App ID and a refreshed
provisioning profile (the entitlement is in every build).

