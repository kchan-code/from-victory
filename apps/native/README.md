# `@from-victory/native`

Capacitor shell for App Store / Google Play distribution of the hosted From
Victory web app. **Not** a rewrite — the WebView loads production (or
`CAPACITOR_SERVER_URL`).

Full architecture, privacy rules, Android/iOS build steps, and store
prerequisites: **[docs/native-capacitor.md](../../docs/native-capacitor.md)**.

Android Play release (enrollment, keystore, signed AAB, Internal testing, Data
safety): **[docs/android-play-release.md](../../docs/android-play-release.md)**.
Application id is locked: `com.fromvictoryapp.app` (Play Console).

```bash
npm install          # from repo root
cd apps/native
npx cap sync
npm run build:android:debug
```
