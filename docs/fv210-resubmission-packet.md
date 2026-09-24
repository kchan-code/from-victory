# FV-210 App Review resubmission packet — DRAFT (2026-09-24)

Purpose: everything needed to resubmit From Victory 1.0 to App Review with Apple in-app purchases, prepared
ahead of the merge/deploy/submission decisions. **Nothing in this document is executed until KC decides:**
no `main` merge, no auto-merge, no production change, no App Review submission.

## A. What Apple rejected (3.1.1) and the response
- Rejection: 1.0 (3), 2026-09-11, submission `26267c34-c178-4dff-818a-fb18d080d28c`, Guideline 3.1.1 — the app accessed
  externally purchased paid digital plans not available via IAP (3.1.3(b) referenced).
- Response (reviewer notes draft): "1.0 (N) adds Apple in-app purchase for all paid plans. Subscriptions are purchased
  through StoreKit inside the app (10 auto-renewable products in one group, 7-day introductory trial on the one-athlete
  tier). Existing web subscribers are honored but the app never links out to purchase. The reviewer account below is
  allowlisted for the sandbox; purchase, restore, and manage flows are reachable from Dashboard → Settings → Manage
  subscription." (finalize wording at submission; no external-purchase links remain in the shell — verify with a grep of
  `checkout.stripe.com` / pricing links under the ios-iap gate before submitting).

## B. Reviewed PR merge order (all currently DRAFT under the release hold)
Merge bottom-up so each PR's base is already on `main`; every PR is qa + privacy APPROVED at its recorded SHA.
1. The FV-210 web arc under `test/integration-fv210-arc-main` (#516 is TEST-ONLY — do not merge #516 itself). Enumerate
   and merge its constituent issue PRs in base order (FV-570 … FV-583; `git log --first-parent origin/test/integration-fv210-arc-main`
   lists the folds) — **TBD: produce the explicit list at merge time**.
2. #527 FV-584 → #528 FV-585 (migration `20260918090000_seat_selection.sql`) → #529 FV-586 → #538 FV-593 (dormant catalog).
3. #539 FV-595 → #540 FV-596.
4. #541 FV-598 → (FV-602, in progress).
5. #543 FV-600 → #544 FV-601.
6. Native: #519 FV-573 → #532 FV-588 → #533 FV-589 → #537 FV-594 → #542 FV-599 (build 1.0 (5) content).
7. RC #534 stays unmerged (validation branch). After merges, re-run the full gates on `main`.
Also merge-adjacent: the RC-only test edit to `__tests__/dev-apple-iap-preview.test.tsx` must be replayed on the native line
when FV-600 lands (recorded on FV-600).

## C. Hosted backend readiness (production Supabase + Vercel) — TO PREPARE, NOT EXECUTE
- Migrations not yet on `main`/prod: `20260909000000_subscriptions_client_write_revoke.sql`, `20260910133456_client_grant_matrix_pin.sql`,
  `20260911120000_apple_provider_access.sql` (apple_subscriptions, apple_purchase_tokens, apple_sandbox_testers, RLS),
  `20260918090000_seat_selection.sql`, plus FV-602's `auto_renew_product_id` migration. CI auto-applies migrations on merge
  (memory: "CI auto-applies migrations"); confirm with the RLS harness green on the merged head.
- Production env (Vercel, names only): `APPLE_BUNDLE_ID=com.fromvictoryapp.app`, `APPLE_APP_APPLE_ID=6804743047`,
  `APPLE_ROOT_CA_PATHS` (Apple Root CA G3 + G2 — commit the public DER files under a server-readable path or load from
  a secure store; decide at deploy), `NEXT_PUBLIC_APPLE_PRODUCTS` = FV-593 `catalogToPublicProductsJson()` output (10 products;
  add `interval` once emitted), `APPLE_CATALOG_ACTIVE=1` (activation = Tier-2, after FV-597 allowlist hygiene),
  `APPLE_IAP_KEY_ID/ISSUER_ID/SIGNING_KEY_PATH` only if the App Store Server API reconcile path is enabled (not needed
  for purchase/webhook).
- App Store Server Notifications: set the **Production** Server URL in ASC to `https://www.fromvictoryapp.com/api/webhooks/apple`
  (V2). Keep the Sandbox URL pointing at the beta tunnel only while the beta runs; afterwards point Sandbox at production
  too (Apple sends sandbox notifications for App Review purchases).
- Sandbox isolation in production: `apple_sandbox_testers` allowlist (service-role only). Add the App Review account's
  payer id before submission; remove QA entries (FV-597). Sandbox rows never grant access to non-allowlisted payers.

## D. Review-eligible build plan (no Mac-dependent endpoint, not internal-only)
- Build 1.0 (6) from the merged `main` native content: `CAPACITOR_SERVER_URL=https://www.fromvictoryapp.com` (default in
  `capacitor.config.ts` when the env var is unset — verify), `MARKETING_VERSION 1.0`, `CURRENT_PROJECT_VERSION 6`,
  same signing path as 1.0 (4)/(5) (cloud-managed distribution cert via the ASC Team key), upload via altool, then
  attach to the App Store version and submit — **submission itself is KC's action**.
- Export compliance answered (non-exempt encryption false); minOS 15.0 (FV-588).

## E. App Store Connect state (done) and remaining
- Group 22404772 "From Victory Family"; 10 subscriptions with USA prices at/below web, availability USA, 7-day trial on
  family.1.*; localizations; review screenshots present (illustrative — **replace with real device captures before
  submission**: use KC's 1.0 (5) screenshots/recording frames of the FV-600 screen; upload via `screens … --apply` after
  swapping the file). Purchase Options: set to App Store only (KC decision pending). Grace period: 16 days, scope pending.
- Subscription review notes per product are set; the group needs an App Store-facing display name (done: "From Victory Family").

## F. Reviewer access + instructions (draft)
- Demo account: a production parent account, allowlisted in `apple_sandbox_testers` for App Review's sandbox purchases.
  Credentials go in the App Review Information "Sign-in required" fields — **create at submission time; never in this repo**.
- Steps for the reviewer: Sign in → Dashboard → Settings → Manage subscription → choose athletes/interval → Subscribe (Apple
  sandbox sheet) → return → Settings shows Active; Restore Purchases and Manage Subscription available; Terms of Use (Apple
  standard EULA) and Privacy Policy linked on the screen.

## G. Open items before the packet is final
- FV-602 merged/validated; D2 downgrade evidence; D3 trial-eligible-account evidence; FV-597 allowlist hygiene; real
  review screenshots; Purchase Options + grace scope decisions; production notification URL; enumerated #516 PR list.
