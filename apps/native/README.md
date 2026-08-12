# `@from-victory/native`

Capacitor shell for App Store / Google Play distribution of the hosted From
Victory web app. **Not** a rewrite — the WebView loads production (or
`CAPACITOR_SERVER_URL`).

Full architecture, privacy rules, Android/iOS build steps, and KC store
prerequisites: **[docs/native-capacitor.md](../../docs/native-capacitor.md)**.

```bash
npm install          # from repo root
cd apps/native
npx cap sync
npm run build:android:debug
```
