# TestFlight beta runbook — FV-210 candidate, build 1.0 (4) (FV-594)

Authorization (KC 2026-09-21): prepare/sign/archive/upload a **TestFlight beta** when the
prerequisites below are satisfied. NOT authorized: App Review submission/release, production
deploy, main merge, real charges, legal-agreement acceptance, Xcode reinstall by the agent,
device install by the agent. Never upload a build whose billing is knowingly non-functional:
the shell must point at a backend running the RC web code, not production.

## Source (record exactly at archive time)
- Native: this branch (`chore/fv-594-testflight-beta-build`, on #533 tip `8d8d1f8` = #519 → #532 FV-588 → #533 FV-589) — `MARKETING_VERSION 1.0`, `CURRENT_PROJECT_VERSION 4`.
- Web served to the phone: RC `test/release-candidate-fv210-web-native` @ `3252101` (+ FV-593 dormant catalog once reviewed and folded → new RC SHA; record it).
- Team ID `CYQ2836PYN` (from the local project used for 1.0 (3)); bundle id `com.fromvictoryapp.app`; ASC app already has 1.0 (3) on internal TestFlight.

## Backend reachable from a physical iPhone (localhost is unusable)
Plan: cloudflared **named tunnel** with a stable hostname → local RC web server → disposable local Supabase.
1. KC: `cloudflared tunnel login` (Cloudflare account owning fromvictoryapp.com DNS).
2. Agent (after KC approves the DNS record): `cloudflared tunnel create fv-beta` → `cloudflared tunnel route dns fv-beta beta.fromvictoryapp.com` → config ingress `beta.fromvictoryapp.com → http://localhost:3590` → `cloudflared tunnel run fv-beta` (kept running for the test window).
3. Local RC web server (`rc-web-local`, :3590) with LOCAL Supabase demo keys plus, for Apple verification: `APPLE_BUNDLE_ID=com.fromvictoryapp.app`, `APPLE_APP_APPLE_ID=<from ASC>`, `APPLE_ROOT_CA_PATHS=<G3.cer>,<G2.cer>` (downloaded from apple.com/certificateauthority — needs KC permission), `APPLE_IAP_SIGNING_KEY_PATH/APPLE_IAP_KEY_ID/APPLE_IAP_ISSUER_ID` (In-App Purchase key — KC creates when ASC config is ready), `NEXT_PUBLIC_APPLE_PRODUCTS=<FV-593 catalog JSON>` (the only catalog gate on this branch), and `APPLE_CATALOG_ACTIVE=1` LOCAL ONLY — that flag is introduced by FV-593 (`lib/subscriptions/apple-product-catalog.ts`) and does NOT exist in the tree until FV-593 is folded into the RC; verify the reader exists (`grep -r APPLE_CATALOG_ACTIVE apps/web/lib`) before relying on it, `NEXT_PUBLIC_SITE_URL=https://beta.fromvictoryapp.com`. Sandbox Notifications V2 URL in ASC = `https://beta.fromvictoryapp.com/api/webhooks/apple`. Test parents seeded via service role; payer allowlisted in `apple_sandbox_testers`.
4. Isolation: the disposable local Supabase only; never production Supabase; Stripe not involved in the Apple path.

## Archive + upload (CLI; Xcode 27 has no GUI)
```
cd apps/native && CAPACITOR_SERVER_URL=https://beta.fromvictoryapp.com npx cap copy ios
cd ios/App && LANG=en_US.UTF-8 pod install
xcodebuild archive -workspace App.xcworkspace -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath ../../build/FromVictory-1.0-4.xcarchive \
  DEVELOPMENT_TEAM=CYQ2836PYN -allowProvisioningUpdates \
  -authenticationKeyPath <AuthKey_XXXX.p8> -authenticationKeyID <KEY_ID> -authenticationKeyIssuerID <ISSUER_ID>
xcodebuild -exportArchive -archivePath ../../build/FromVictory-1.0-4.xcarchive \
  -exportOptionsPlist ExportOptions.plist -exportPath ../../build/export \
  -allowProvisioningUpdates -authenticationKeyPath <AuthKey_XXXX.p8> -authenticationKeyID <KEY_ID> -authenticationKeyIssuerID <ISSUER_ID>
```
`ExportOptions.plist` = app-store-connect / upload / automatic / team CYQ2836PYN / internal-testing-only. Keys never logged; paths only.
Verify: `xcrun altool --list-builds --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>` (with the .p8 in `~/.appstoreconnect/private_keys`) or ASC → TestFlight → processing → add to the internal group → KC installs via the TestFlight app.

## Prerequisites (owner) — archive only when ALL are true
1. Signing (KC): App Store Connect API **Team** key (App Manager/Admin) for `-allowProvisioningUpdates`; today only an Apple Development identity and zero profiles exist and Xcode 27 has no Organizer. Alternative: full Xcode reinstall + Organizer per docs/ios-app-store-release.md §4a/§5.
2. ASC (KC, read-only preflight first by signing in): Paid Apps Agreement Active; group + 10 products + intro offers (family.1 monthly+yearly) + 16-day grace (scope: recommend Only Paid to Paid) + Family Sharing OFF per the approved policy; sandbox tester account; App Apple ID for `APPLE_APP_APPLE_ID`.
3. Tunnel (KC login + DNS approval) and root CA files (KC permission to download).
4. In-App Purchase API key (KC) for the server verifier + test notification.
5. Reviews: FV-593 folded into the RC and re-validated; this branch qa-reviewed; the served RC SHA recorded.

## Verification once the build is on TestFlight (KC on iPhone, guided)
Sign in (test parent) → dashboard → Choose a plan → 10 products render from the catalog → Subscribe → Apple sandbox sheet → complete → server verifies the JWS (Apple root) → `apple_subscriptions` row → entitlement → Restore Purchases → Manage → sandbox renewal (accelerated) → Notifications V2 received at the beta URL (`SUBSCRIBED`, `DID_RENEW`, …). Then D3 timing (upgrade during trial) and D2 (downgrade at renewal) per the checklist D15. Record every observed payload type; no success inferred from product loading.

## Independent preparation evidence (2026-09-21)
- Release configuration compiles for a physical-iOS target without signing: `xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO build` on the RC tree (native content = #533 tip `8d8d1f8`, web `3252101`) → `** BUILD SUCCEEDED **`, producing `App.app` + `App.app.dSYM`. This proves compile only; signing, archive export, upload, and Apple sandbox billing remain unproven.
- Signing inventory on this Mac: one "Apple Development" identity, zero provisioning profiles, no Apple Distribution certificate, Xcode 27 without Organizer → archive requires an App Store Connect API Team key (`-allowProvisioningUpdates`) or a complete Xcode install.
