# FV-630 release checklist: athlete invitations + separate recovery

Status key: **DONE** (verified, with evidence), **PENDING** (not run yet),
**KC** (needs KC: account access, device, or a gate decision).

The order matters. The web/backend (and the AASA file) must be live and
compatible **before** a signed iOS build with Associated Domains ships. An
older iOS build without the entitlement is unaffected by the web deploy:
invite links simply open in Safari, and the page offers code entry and
browser setup.

## 0. What ships where

| Piece | Where | Ships with |
|---|---|---|
| `20261106120000_athlete_invitations.sql` | Supabase (CI `db-migrate` applies on merge) | PR merge |
| `/invite`, invite + recovery actions, dashboard states, `/pair` legacy | Vercel (web) | PR merge |
| `/.well-known/apple-app-site-association` (claims `/invite` only) | Vercel (web) | PR merge |
| `NativeInviteLinkHandler` (routes universal links in the WebView) | Vercel (web), runs inside the app | PR merge |
| `App.entitlements` (`applinks:www.fromvictoryapp.com`) + `CODE_SIGN_ENTITLEMENTS` | iOS binary | next signed iOS build |

## 1. Before merge

- [ ] **DONE locally / PENDING CI**: `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` in `apps/web` (see the PR body for which ran locally and their output).
- [ ] **DONE locally / PENDING CI**: migration + `supabase/tests/rls/assertions/22_athlete_invitations.sql` against a scratch Postgres 16 stub. Full RLS harness runs in CI against the real migration chain.
- [ ] **PENDING**: qa-reviewer pass, then kids-privacy-officer `VERDICT: APPROVED` (required check).
- [ ] **KC**: Tier-2 merge (DB migration + auth flow). Merge via the GitHub UI.

## 2. After the web deploy (before any iOS build)

- [ ] **PENDING**: migration applied in prod (check `db-migrate` ran, not `skipped`; confirm `select count(*) from pg_proc where proname in ('issue_athlete_invite','claim_athlete_invite','release_athlete_invite','get_athlete_invite_statuses')` returns 4).
- [ ] **PENDING**: AASA served correctly from the exact host, no redirect:
  ```bash
  curl -sSI https://www.fromvictoryapp.com/.well-known/apple-app-site-association
  ```
  Expect `HTTP/2 200` and `content-type: application/json`. Body:
  ```bash
  curl -sS https://www.fromvictoryapp.com/.well-known/apple-app-site-association
  ```
  Expect exactly one `appIDs` entry and one component `"/": "/invite"`.
- [ ] **PENDING**: Apple's CDN has picked it up (can lag up to ~24h):
  ```bash
  curl -sS https://app-site-association.cdn-apple.com/a/v1/www.fromvictoryapp.com
  ```
- [ ] **PENDING**: web smoke (any browser): parent dashboard shows "Invite athlete" / "Invite pending" / "Account ready" correctly; create invite → open link in a private window → "Continue in browser" → set username/password → lands on `/athlete` signed in.
- [ ] **PENDING**: legacy link: a `/pair?code=` link generated before the deploy (if any are still live) still completes setup.

## 3. iOS build

- [ ] **KC**: Apple Developer portal → Identifiers → `com.fromvictoryapp.app` → enable **Associated Domains**. (Automatic signing usually does this on archive; confirm it is on.)
- [ ] **PENDING**: bump `CURRENT_PROJECT_VERSION` per the normal release process (not changed in this PR).
- [ ] **PENDING**: archive, then confirm the SIGNED app carries the entitlement and the team prefix matches the AASA app ID (`lib/invites/apple-app-site-association.ts`, currently `CYQ2836PYN.com.fromvictoryapp.app`; the team ID came from `ExportOptions.plist`, so treat it as unverified until this check passes):
  ```bash
  codesign -d --entitlements :- "<path>/From Victory.app" | plutil -p -
  ```
  Expect `application-identifier` = `<TEAM>.com.fromvictoryapp.app` with `<TEAM>` equal to `APPLE_TEAM_ID`, and `com.apple.developer.associated-domains` = `applinks:www.fromvictoryapp.com`. If the team differs, fix `APPLE_TEAM_ID`, deploy web, re-check step 2, **then** ship the build.
- [ ] **PENDING**: TestFlight build installed on a physical iPhone.

## 4. Physical iPhone release gates (all required for full launch)

Use a parent account with a test athlete. Send links over Messages from
another device. Record date, build number, iOS version, and result for each.

| # | Scenario | Expected | Result |
|---|---|---|---|
| D1 | App **installed, not running** (cold): tap invite link in Messages | App opens straight to setup for that athlete; finish → training, no second sign-in | PENDING |
| D2 | App **installed, in background** (warm): tap invite link | App comes forward to setup; finish → training | PENDING |
| D3 | App installed, already on `/invite` with another code: tap a new link | Page reloads with the new code | PENDING |
| D4 | App **not installed**: tap invite link | Safari page with App Store badge, the code, and "Continue in browser" | PENDING |
| D5 | D4 → install from App Store → open app → "I have an invite" → type code | Setup → training | PENDING |
| D6 | D4 → "Continue in browser" | Setup in Safari → training | PENDING |
| D7 | Tap the **same, already-used** link again (cold and warm) | "This code can't be used…"; nothing re-opens on later app launches or reloads | PENDING |
| D8 | **Expired** code (set `expires_at` in the past on a test row) | "This code can't be used…" | PENDING |
| D9 | **Replaced** invite: create invite A, then B; open A | A refused; B works | PENDING |
| D10 | **Recovery**: set-up athlete → parent "Create reset code" → open link | Username shown read-only; new password → training; username unchanged in DB | PENDING |
| D11 | **New phone**: set-up athlete signs in with username + password on a second device | Signs in normally; no invite needed | PENDING |
| D12 | Existing athlete on an existing device (device cookie) | Password-only sign-in unchanged | PENDING |
| D13 | Kill and relaunch the app after a completed invite | Lands on training/home, not back on the invite | PENDING |
| D14 | Long-press link in Messages → "Open in Safari" | Opens Safari (Apple behavior); browser path still works | PENDING |

## 5. Rollback

- Web: revert the merge commit via a PR. The migration is additive (new
  column with default, new functions, a partial unique index, one more
  rate-limit label); the old pairing code is removed from the app, so a web
  revert alone restores the old flow against the new schema (the old
  generator's delete-then-insert stays compatible with the one-live index).
- iOS: an installed build with the entitlement but no `/invite` handling on
  the web would open the app at the WebView default; ship web first to avoid
  this (section order above).
- Do not remove the AASA route while an entitled build is in the field.

## 6. Out of scope (follow-ups, not in this PR)

- Android App Links (`assetlinks.json` + intent filter). Android is
  browser/code-entry only for invites.
- Admin metrics: "Device pairing claim rate" now counts invite and recovery
  codes together; split by `purpose` if needed.
