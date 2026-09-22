# TestFlight beta runbook — FV-210 candidate, build 1.0 (4) (FV-594)

Authorization (KC 2026-09-21): prepare/sign/archive/upload a **TestFlight beta** when the
prerequisites below are satisfied. NOT authorized: App Review submission/release, production
deploy, main merge, real charges, legal-agreement acceptance, Xcode reinstall by the agent,
device install by the agent. Never upload a build whose billing is knowingly non-functional:
the shell must point at a backend running the RC web code, not production.

## Source (record exactly at archive time)
- Native: this branch (`chore/fv-594-testflight-beta-build`, on #533 tip `8d8d1f8` = #519 → #532 FV-588 → #533 FV-589) — `MARKETING_VERSION 1.0`, `CURRENT_PROJECT_VERSION 4`.
- Web served to the phone: RC `test/release-candidate-fv210-web-native` @ **`d2f76d6`** (= `3252101` + FV-593 dormant catalog e55de13, folded 2026-09-21; qa + privacy APPROVED on #538). Re-record if the RC moves again.
- Team ID `CYQ2836PYN` (from the local project used for 1.0 (3)); bundle id `com.fromvictoryapp.app`; ASC app already has 1.0 (3) on internal TestFlight.

## Backend reachable from a physical iPhone (localhost is unusable)
Plan: cloudflared **named tunnel** with a stable hostname → local RC web server → disposable local Supabase.
1. KC: `cloudflared tunnel login` (Cloudflare account owning fromvictoryapp.com DNS).
2. Agent (after KC approves the DNS record): `cloudflared tunnel create fv-beta` → `cloudflared tunnel route dns fv-beta beta.fromvictoryapp.com` → config ingress `beta.fromvictoryapp.com → http://localhost:3590` → `cloudflared tunnel run fv-beta` (kept running for the test window).
3. Local RC web server (`rc-web-local`, :3590) with LOCAL Supabase demo keys plus, for Apple verification: `APPLE_BUNDLE_ID=com.fromvictoryapp.app`, `APPLE_APP_APPLE_ID=<from ASC>`, `APPLE_ROOT_CA_PATHS=<G3.cer>,<G2.cer>` (downloaded from apple.com/certificateauthority — needs KC permission), `APPLE_IAP_SIGNING_KEY_PATH/APPLE_IAP_KEY_ID/APPLE_IAP_ISSUER_ID` (In-App Purchase key — KC creates when ASC config is ready), `NEXT_PUBLIC_APPLE_PRODUCTS=<FV-593 catalog JSON>` (the only catalog gate on this branch), and `APPLE_CATALOG_ACTIVE=1` LOCAL ONLY — that flag is introduced by FV-593 (`lib/subscriptions/apple-product-catalog.ts`); it is NOT on this native branch but IS in the RC from `d2f76d6` onward — the served web tree is the RC, so verify the reader exists there (`grep -r APPLE_CATALOG_ACTIVE apps/web/lib`) before relying on it, `NEXT_PUBLIC_SITE_URL=https://beta.fromvictoryapp.com`. Sandbox Notifications V2 URL in ASC = `https://beta.fromvictoryapp.com/api/webhooks/apple`. Test parents seeded via service role; payer allowlisted in `apple_sandbox_testers`.
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

## ASC read-only preflight — 2026-09-22 (App Store Connect API, Team key `4Q3C9W7QU6`, Admin; key at `~/.private_keys`, ids in `~/.private_keys/fv-asc.env`, never in the repo)
- App: "From Victory" `com.fromvictoryapp.app`, **App Apple ID 6804743047** (→ `APPLE_APP_APPLE_ID`), SKU from-victory-ios. Bundle id registered (UNIVERSAL).
- Builds: 1.0 (1) 08-24, 1.0 (2) 08-28, 1.0 (3) 09-01 — all VALID, not expired, minOS 14.0. Next upload must be build 4 (this branch).
- TestFlight: one internal group "First testers" (isInternalGroup, hasAccessToAllBuilds = true) with 2 testers INSTALLED (Kinny, Parker) → a processed build 4 is automatically available to KC's TestFlight app; no group changes needed.
- **App Store 1.0 version state: REJECTED; review submission of 2026-09-08 is UNRESOLVED_ISSUES.** Public App Review was submitted and rejected (not exposed via the API — KC reads the reason in App Store Connect → App → 1.0 → App Review / Resolution Center). Does NOT block TestFlight internal testing.
- Apple billing config is greenfield: subscription groups NONE, in-app purchases NONE, sandbox testers NONE → the approved proposal's ids/group name have no conflicts to reconcile.
- Signing on the team: one DEVELOPMENT certificate (KINNY WAI CHAN, exp 2027-08-24), NO Apple Distribution certificate, NO provisioning profiles. Cloud signing via `-allowProvisioningUpdates` + this Admin key can create the distribution certificate + App Store profile at archive time — that is an ASC mutation and needs KC's explicit go (the agent's dry-run attempt was blocked by policy for that reason).
- Paid Apps Agreement status is not exposed by the API → KC checks App Store Connect → Business → Agreements (must be Active with banking + tax complete before any paid subscription can be created/sold).

## App Review context — recorded 2026-09-22 (from KC via Codex; confirmed read-only against the API)
- The REJECTED state above is the **known FV-210 rejection, not a new one**: Apple reviewed 1.0 (3) on 2026-09-11 (submission `26267c34-c178-4dff-818a-fb18d080d28c`, iPad Air 11-inch M3) under **Guideline 3.1.1** — the app accessed externally purchased paid digital plans not available via IAP; Apple requires those subscriptions to be purchasable with IAP (ref 3.1.3(b); US-storefront external-link exception noted). This is the reason the FV-210 Apple-IAP arc exists.
- API check 2026-09-22: exactly one review submission exists (26267c34, state UNRESOLVED_ISSUES, version 1.0 ↔ build 3). No newer submission or version. App Review message bodies are not exposed by the API; if Apple sends a newer message it will appear in ASC only.
- Consequence for this beta: the TestFlight build must present the Apple purchase path for real, which means the served backend needs `NEXT_PUBLIC_APPLE_PRODUCTS` (from FV-593 `catalogToPublicProductsJson()`) + `APPLE_CATALOG_ACTIVE=1` LOCALLY, **and the subscription group + products must exist in App Store Connect** — TestFlight/sandbox purchases resolve products from ASC, not from a local StoreKit configuration. Creating them is an ASC mutation that is NOT yet authorized; KC's on-phone purchase/restore test cannot happen until it is.
- Paid Apps Agreement: KC completed the W-9 (2026-09-22). That does not establish the agreement as **Active** or banking as complete; not API-visible; still to be confirmed in ASC → Business → Agreements.
- Apple Root CA G3 (583 B) + G2 (1430 B) downloaded from apple.com/certificateauthority into the session scratchpad and wired into the `rc-web-local` launch entry's `APPLE_ROOT_CA_PATHS`; they are public certificates, not secrets.
- Distribution certificate / App Store profile creation via cloud signing: initially blocked by the agent's tool policy; KC resolved it explicitly on 2026-09-22 (see next section).

## Archive + export DONE locally — 2026-09-22; upload HELD
- Source: native `chore/fv-594-testflight-beta-build` @ `4c45345` (native content = #533 tip `8d8d1f8` + build bump; later commits docs-only); web to serve = RC `d2f76d6`. Worktree built fresh: `npm ci` at the worktree root, `CAPACITOR_SERVER_URL=https://beta.fromvictoryapp.com npx cap copy ios`, `pod install` (FV-588 Podfile floor applied; no deployment-target override).
- `xcodebuild archive … -allowProvisioningUpdates` with the ASC key → **ARCHIVE SUCCEEDED** (1.0 (4), team CYQ2836PYN, `capacitor.config.json` server.url = `https://beta.fromvictoryapp.com`).
- `xcodebuild -exportArchive` (ExportOptions with `destination` = `export` for this local step) → **EXPORT SUCCEEDED**: `App.ipa` 1.18 MB, signed **Apple Distribution: From Victory LLC (CYQ2836PYN)**, embedded profile "iOS Team Store Provisioning Profile: com.fromvictoryapp.app" (exp 2027-08-24), `get-task-allow=false`, `beta-reports-active=true`, CFBundleVersion 4. Cloud-managed signing created the distribution certificate + store profile; the ASC `/v1/certificates` listing still shows only the DEVELOPMENT cert (cloud-managed distribution certs are Xcode-managed and not listed there).
- Artifacts are in the session scratchpad (`build/FromVictory-1.0-4.xcarchive`, `build/export/App.ipa`); nothing committed. Re-export the same archive with `destination` = `upload` once the gates open; re-archive only if the served hostname changes.
- **Upload gates (both closed):** (1) `beta.fromvictoryapp.com` does not resolve — needs `cloudflared tunnel login` by KC, then tunnel create + DNS record; (2) the subscription group/products do not exist in ASC, so the beta's purchase UI would be non-functional. The API mutation was refused twice by the agent's approval reviewer and was not bypassed. The idempotent configuration script is at `~/.private_keys/fv-asc-config.mjs` (outside the repo): `node ~/.private_keys/fv-asc-config.mjs status | group | subs | prices [--apply] | offers [--apply] | grace <ALL_RENEWALS|PAID_TO_PAID_RENEWALS>`. USA base territory only in this pass; grace scope left pending KC's choice; Family Sharing hard-coded false.
