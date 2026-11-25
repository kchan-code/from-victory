# Handoff: Google Play billing launch validation (2026-11-19)

For a fresh session. One coordinator only; Codex owns Play Console / Cloudflare / outbound email console work. Do not duplicate it.

## Goal

Get Google Play billing for the already-published Android app (`com.fromvictoryapp.app`) ready to turn on. Deliver a compact ledger: verified evidence, blockers, ONE KC decision at a time.

## Hard limits (KC)

- Billing flag stays OFF. No production release. Internal testing track only, each upload with KC's go-ahead (`docs/android-play-release.md`).
- No new paid services, legal acceptance, or unapproved policy published. Do not invent product, market or policy decisions.
- Never print secret values; name/boolean checks only.
- Lead owns all git. QA, then privacy; `VERDICT: APPROVED` unbolded with the full head SHA on the next line; any push voids it. The gate only honours comments from the owner or a collaborator, not bots. KC (2026-11-19): use Cursor, not Codex, for secondary reviews; never post an approval on KC's behalf.
- KC has no Android device. Do not disturb emulators 5554/5558/5562.
- Do not `npm install` at the primary repo root; CI is the typecheck authority.

## State at handoff (updated after the merges)

Merged to main today:
- Earlier: #688, #678, #683 (Google reconcile cron), #680, #685, #682 (versionCode 11), #686.
- #655 Android purchase UI, merge `381e866a450904bfaf7dc411ab66ac8e1fcd56c8`. #687 was folded into it by fast-forward. Reviewed head `72a493d9`; Claude QA + privacy and Codex privacy approved.
- #677 contact rate limit + FV-774 scheduled cleanup, merge `1fb03183df068fbd994e3e5aa86a287d7c66200b`. Migrations applied.

- #679 contact form honest failure, merge `361f81327a308954f811993dca889782a6a16fc9` (Claude + Codex QA/privacy at head `45a7f8a4`). CI on main green.

- #689 deploy lane fix (FV-777), merge `663d4f19df40f23f4b33c4c0a936460c032210f0`. With `FV_MIGRATE_BEFORE_DEPLOY=1`, Vercel no longer auto-builds production; `db-migrate.yml` runs on every push to main, applies migrations, checks the commit is still the tip, then deploys.

LIVE: run 44636275305 on `663d4f19` succeeded (migrations, tip check, production deploy). Vercel deployment Ready, `/api/health` 200. This put #679 live (it had been skipped). Contact form smoke test on production returned "Thanks. We'll be in touch." and the email arrived in KC's inbox ("From Victory contact · Smoke Test", 6:20 PM Nov 19; confirmed by Codex in Gmail). FV-777, FV-770, FV-774, FV-334 are Done in Linear.

Not yet exercised: a commit containing a migration has not gone through the new lane. Watch the first one. QA's non-blocking notes are in FV-778 (`[skip ci]` commits never deploy; a failing migration blocks all deploys including hotfixes; `production` environment rules apply to every push; others).

Held: #684 (legal wording, DO NOT MERGE), #681 (support runbook with unapproved templates).

Billing: `GOOGLE_PLAY_CATALOG_ACTIVE` is OFF in production and stays off. All merged Google code is dormant behind it.

Merchant: enrollment accepted, 15% fee enrollment complete, bank added, verification pending 1-2 days (from 2026-11-19). Label tests that need it.

Support email: `support@fromvictoryapp.com` incoming (forwards to KC) and outbound (Gmail send-as, test delivered to KC) both verified 2026-11-19, as reported by Codex.

KC-approved purchase decisions (2026-11-19, recorded on #655 and #687):
1. A 7-day free trial is shown ONLY when Google returns an eligible 7-day free offer; otherwise price, billing period, and payment starts today.
2. Android sign-in shows "New here? Create a parent account" (appears only once the billing flag is on).
3. After account deletion with unconfirmed renewal cancellation: clear warning and an "Open Google Play" button.
4. Approved prices and trial: $5/$49, $8/$78, $11/$106.99, $14/$135.99, $17/$164.99; `trial-7d` on tier 1 only.

Follow-ups filed: FV-775, FV-776, FV-778.

Readiness audit so far (read-only): the catalog file matches the approved base plans and trial; it holds no prices (Play supplies them). No `GOOGLE_PLAY_*` variables exist in Vercel production (code reads `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `GOOGLE_PLAY_PUBSUB_AUDIENCE`, `GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT`). Code fails closed without them. Real Google calls cannot be proven without console products, a service account and a licence tester. The flag is global, not per track. Unreviewed drafts for items 5-7 are in `docs/drafts-2026-11-19/` (untracked, this worktree).

## Work to do

1. **Catalog check.** Compare `apps/web/lib/subscriptions/google-product-catalog.ts` with `docs/fv651-android-play-billing-decision-record.md` and `docs/play-billing-console-runbook.md`. Base plans `monthly`/`yearly`. No console products exist; creating them needs KC.
2. **Server readiness.** By code and env names only: service account credentials, purchase validation route, real-time notifications webhook, reconciliation (`google-reconcile.ts`, `/api/cron/reconcile-subscriptions`), health and alerts (`google-play-health.ts`). List what cannot be proven without credentials.
3. **Build.** `FV_PLAY_BILLING=1`, versionCode 11, per `docs/android-play-release.md`. Trap: primary `node_modules` has `@capacitor/android` 7.6.8 vs locked 8.6.0; symlink a scratch install; `cap sync` rewrites `capacitor.settings.gradle`.
4. **Test.** FV-763 (`docs/fv763-minified-billing-check.md`) and the FV-668 matrix on an emulator. Purchases need licence testers and console products; say which rows are blocked and why.
5. **Legal drafts.** Correct #684 (delete-account page omits Android; alert-email contents incomplete; add alert-email retention/access policy) and matching Data Safety answers. Draft only.
6. **Throttle wording.** Privacy Policy 1g says "non-identifying" though the IP digest is pseudonymous personal data; 1h omits the throttle record (kept about a day). Scoped correction draft.
7. **Support.** Prepare #681 policy and templates. No absolute 14-day refund cutoff; do not say "always send Google refunds to Google" until verified. Drafts-only, adults-only, no third-party widget.

## Open KC decisions (ask one at a time; do not invent answers)

Catalog:
- Product IDs `family.1`..`family.5` (G1): not approved. No products may be created until they are.
- Markets/countries for the subscriptions: not approved.
- Grace period (G4).
- Service account setup and who creates it (G7).

Legal (exact wording needs KC's approval before anything is published):
- #684 Privacy Policy and Terms text for Google billing, including the Android line on the delete-account page.
- Retention and access policy for deletion-alert emails.
- Play Data Safety answers matching that text.
- Privacy Policy sections 1g/1h correction for the IP-derived throttle record.

Support and payments:
- Refund stance and response time (FV-768); reply templates (#681).
- Stripe receipt emails (off, yet the success page promises one) and refund/dispute webhook events.
- Trader-status declaration, due 2027-02-01.
- Whether to act on the deploy lane notes in FV-778.

Blockers that are not decisions: bank verification (pending, 1-2 days from 2026-11-19; check in the console whether it gates product creation); no console products, service account or licence tester yet; internal-track upload needs KC's go-ahead per upload.

## Next-session prompt (paste as the first message)

> You are the single coordinator for Google Play billing launch validation on From Victory. Read `docs/handoff-2026-11-19-google-play-launch-validation.md` in the worktree `/Users/kinnychanhome/Claude/FromVictory/.claude/worktrees/combined-reliability-validation-bcc3f6` first and follow its limits. Create a fresh worktree from `origin/main` for any edits (`git worktree add ../lead-play-validation origin/main`); do not reuse the contact or Android worktrees. First actions, in order: (1) confirm `origin/main` contains `663d4f19` and that `/api/health` is 200; (2) review the four drafts in `docs/drafts-2026-11-19/` of that worktree against the handoff's work items 5-7 and list the open choices for KC; (3) build per `docs/android-play-release.md` with `FV_PLAY_BILLING=1`, then run FV-763 and the FV-668 matrix on an emulator, stating which rows are blocked and why. The catalog and env audit is already recorded in the handoff; do not repeat it. Billing flag stays OFF; internal testing track only; no production release. Report a compact ledger of verified evidence and blockers, and ask KC one decision at a time. Codex owns Play Console and Cloudflare console work; do not duplicate it. Use Cursor for secondary reviews.
