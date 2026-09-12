# FV-573 — Apple billing: device QA & release checklist

**Status: PREPARATION + LOCAL-SIMULATOR ONLY.** KC narrowed the hold on
2026-09-12: LOCAL simulator build/install/test is authorized; everything else
stays held — no merge/auto-merge, no production deployment/migration/data
change, no distribution archive/upload, no physical-device install, no App
Store Connect (ASC) mutation, no message to Apple.

**Local-simulator results (2026-09-12, PR #519 — Xcode 26.6, iOS 26.5,
iPhone 17 Pro + iPad Pro 11"):** bridge compiled (zero fixes) + registered
(FVBridgeViewController path); deployment target raised to 15.0; full local
StoreKit matrix green with typed contract codes — products/purchase/cancel/
PENDING (Ask-to-Buy)/restore/manage, plus immediate-UPGRADE and at-renewal-
DOWNGRADE semantics observed live and post-upgrade single-entitlement
supersession. Evidence: docs/fv573-evidence/ (on that branch); mechanics in
docs/fv572-ios-bridge-notes.md. Local StoreKit JWS is NOT Apple-sandbox
evidence — §6 remains required against sandbox on TestFlight builds. Each section below is either (a) a KC decision still open,
(b) a KC-performed account/config action, or (c) an executable QA/release step
that becomes runnable only after (a) and (b) and an explicit hold lift.

Contract: FV-573 (parent FV-210). Architecture source of truth:
`docs/fv210-ios-iap-decision-record.md` (referenced by section below).
Code under test: PR #511 (FV-570), #515 (FV-571), #512 + the FV-572 UI slice,
#513 (FV-574). Integration evidence: PR #516 (all real CI checks green:
build/typecheck, 2476 unit tests, lint, RLS harness 20/20 incl.
`20_apple_subscriptions`, E2E 49 passed).

---

## 1. Open KC decisions (nothing proceeds past its gate without these)

| # | Decision | Gates | Recommendation on file (NOT a decision) |
|---|---|---|---|
| P2 | ASC product IDs + price points for tiers 1–5 | ASC product config (§3), capacity map (`apple-capacity.ts`), product-config env (§4), paywall activation | Record §4.6 proposes the tier→price mapping closest to sibling economics ($5+$3 / $49+$29). Suggested ID scheme: `fv.sub.tier<N>.monthly` / `.annual` — pick once, IDs are immutable in ASC. |
| P7 | No-selection handling at downgrade effective date + trial-to-family conversion timing/charge disclosure | Seat-designation schema, downgrade-selection UI, conversion UI/disclosure (none built) | Recommendations recorded on FV-210/PR #510 §6: fail-closed "selection required" paused-UX state (never auto-select/delete); immediate conversion with mandatory pre-confirm charge disclosure (Apple forces immediacy; web matches). **Explicitly NOT approved — KC words it.** |
| P4 | Apple Small Business Program enrollment | Net revenue only; nothing technical | Enroll if eligible (15% vs 30%); non-blocking. |
| P8 | GTM copy 14→7 days via Delvox | FV-574 deploy window (privacy-named gate on PR #513) | Delvox engine run scheduled so the 7-day/one-athlete copy ships in the SAME launch window as FV-574 — the product-truths entry triggers it but is not the gate. |
| — | Apple intro-offer eligibility asymmetry (a prior Stripe trial cannot deny a qualifying Apple intro offer) | App Review posture + trial economics | Accept-and-document per-Apple-ID asymmetry (StoreKit cannot deny a qualifying intro offer). Awaiting KC/Codex ack. |
| — | FV-574 reading confirmation | Nothing (implemented, gated at merge) | Implemented: 7-day trial ONLY when checkout quantity === 1. Alternative reading (trial with athletes 2+ billed during it) NOT implemented. Confirm. |
| — | Intro-offer shape in ASC (interacts with P2) | ASC product config | Configure the 7-day free intro offer on TIER-1 products only, mirroring "7 days for one athlete" on the web. Tiers 2–5 get no intro offer. Needs KC ack with P2. |

## 2. Apple account / business prerequisites (KC-performed; blocker B3)

- [ ] ASC **Paid Apps agreement** accepted; **tax + banking** complete (nothing sells without it).
- [ ] **App Store Server API key** created (ASC → Users and Access → Integrations): record Issuer ID, Key ID, download the `.p8` once — store in the secret manager, never in the repo.
- [ ] **Apple Root CA certificates** downloaded from Apple PKI (all current G-series roots) — strategist condition 6; used by `SignedDataVerifier` via `APPLE_ROOT_CA_PATHS`. Note rotation: re-check Apple PKI at every FV-573 rerun.
- [ ] **App Store Server Notifications V2** URLs set in ASC (production URL + sandbox URL both → `https://<prod-host>/api/webhooks/apple`; sandbox notifications get ONE delivery attempt — verified Apple doc). *ASC mutation → hold-gated.*
- [ ] P4 Small Business Program (optional, §1).

## 3. ASC product configuration (blocked on P2; hold-gated)

- [ ] One subscription group ("From Victory"). In-group tier ranking set so athlete-capacity order = upgrade order (tier 5 highest).
- [ ] 10 products: tiers 1–5 × monthly/annual at the P2-approved price points.
- [ ] Intro offer per §1 (recommendation: tier-1 only, 7-day free, per-Apple-ID eligibility asymmetry documented).
- [ ] **Group-level ranking trap (demonstrated live, PR #519):** `groupNumber`/ASC subscription LEVEL — lower number = higher service level. Capacity order MUST map to level order (tier 5 = level 1 … tier 1 = level 5) or tier increases become at-renewal downgrades instead of immediate prorated upgrades. Verified both behaviors in the local StoreKit environment.
- [ ] Localized display names/descriptions (parent-facing language rules: "athlete", never "kid").
- [ ] App Privacy nutrition labels updated for IAP: "Purchases" data type becomes collected/linked — update the FV-211 privacy pack (`docs/fv211-app-store-privacy-pack.md`) BEFORE submission; kids-privacy-officer re-review of the pack delta.

## 4. Backend provisioning (Vercel env; production mutation → hold-gated)

Env vars consumed by `apps/web/lib/subscriptions/apple-server.ts` (all read lazily):

| Var | Value source |
|---|---|
| `APPLE_BUNDLE_ID` | `com.fromvictoryapp.app` (verify against Xcode project) |
| `APPLE_APP_APPLE_ID` | Numeric App ID from ASC (production verifier only) |
| `APPLE_ROOT_CA_PATHS` | Comma-separated DER cert paths (§2) — decide delivery: bundled-at-build vs mounted secret; FV-573 owns the choice |
| `APPLE_IAP_SIGNING_KEY_PATH` | `.p8` path (§2) — secret-manager delivery preferred over filesystem; swap is isolated to one function |
| `APPLE_IAP_KEY_ID` / `APPLE_IAP_ISSUER_ID` | From §2 |
| `NEXT_PUBLIC_APPLE_PRODUCTS` | JSON product config (P2) — EMPTY until P2; empty = UI shows not-available state |

- [ ] `apple_sandbox_testers` allowlist ops: KC-gated service-role INSERT for (a) internal QA payer(s), (b) the App Review demo account's payer. Removal equally KC-gated. No client path exists (RLS zero-grant, proven by harness file 20).
- [ ] Apple migration applies via the normal CI db-migrate flow when PR #511 merges — precondition satisfied: `20_apple_subscriptions.sql` landed in the same branch and has an executed `[PASS]` (PRs #514/#516).

## 5. Build & distribution prerequisites (ALL hold-gated)

- [ ] Merge order: #506/#508 (FV-507/568) and #505 (FV-508) per their own gates → #511 (FV-570) → retarget + merge #515 (FV-571), #513 (FV-574) → #512 (FV-572 signal) → FV-572 UI slice PR. Re-run the #516-style integration stack green BEFORE the first merge if sources moved.
- [x] **iOS deployment target 14.0 → 15.0** — DONE on the FV-573 branch (PR #519), pbxproj ×4 + Podfile. Fielded-impact check before release still owed (iOS 14 devices lose updates).
- [ ] `npx cap sync ios` (first native sync since the pivot).
- [x] `FVAppleIAPPlugin.swift` in the Xcode project — DONE (PR #519); first compile passed with ZERO fixes. Registration answer: Capacitor 7 auto-registration does NOT pick up app-local plugins (CLI overwrites packageClassList) — registered via FVBridgeViewController subclass, verified working on iPhone + iPad. `signedRenewalInfo` WAS present right after purchase locally (keep optional server-side); restore returned the current entitlement; finish() timing showed no local issue — re-verify all three against Apple sandbox.
- [ ] Archive → TestFlight internal build; bump build number past the rejected 1.0 (3).

## 6. Device QA matrix (FV-573 ACs; sandbox + disposable DB only — never production data)

Environment: TestFlight build on iPhone + iPad; sandbox Apple ID(s); staging/disposable Supabase project with the full migration chain; QA payer on the `apple_sandbox_testers` allowlist; a second payer NOT allowlisted.

| # | Scenario | Expect |
|---|---|---|
| 1 | Purchase tier 1 (intro offer if configured) on iPhone | Row `subscribed`, correct `expires_at`, token bound; parent dashboard reflects access |
| 2 | Athlete cross-device access after parent purchase | Athlete session gains access via resolver fold; athlete sees ONLY the level (no billing shape) |
| 3 | App restart / re-login | Entitlement stable, no re-purchase prompt |
| 4 | Restore on second device (same Apple ID) | Restores; ownership NEVER transfers to a different FV payer (reject path) |
| 5 | Sandbox accelerated renewal | `DID_RENEW` webhook advances `expires_at`; watermark drops replays |
| 6 | Expiry (let sandbox sub lapse) | `expired` → blocked, no skew re-open |
| 7 | Billing retry / grace (sandbox toggles) | `in_grace_period` keeps FULL access until its OWN bound; `GRACE_PERIOD_EXPIRED` → blocked |
| 8 | Refund/revoke (ASC sandbox refund) | `REVOKE` → blocked immediately |
| 9 | Upgrade tier mid-cycle | Immediate new billing period; supersession-safe OTID update in place (no duplicate row) |
| 10 | Downgrade below current athlete count | Access until renewal; **selection UX = P7 — expect the gated/paused state, nothing auto-selected/deleted** |
| 11 | Roster change vs capacity | `assertAthleteCapacity` blocks athlete-add past tier ceiling with calm error; Stripe/comp payers NEVER capped |
| 12 | Duplicate billing (active Stripe + Apple purchase) | Apple row persists + ops alert fires; nothing blocked |
| 13 | Non-allowlisted sandbox payer submits | Rejected, no row, no entitlement (R2) |
| 14 | Unmapped-token notification | Webhook 200 benign branch, no raw payload logged |
| 15 | Account deletion | Cascade removes mirror + token + allowlist rows; re-created account never auto-relinks |
| 16 | Reconciliation helper run | Matches steady-state after a deliberately-missed notification |
| 17 | Web checkout still intact (regression) | Stripe flow + 7-day/one-athlete trial per FV-574; Android/reader posture byte-identical |

Sequence: qa-reviewer executes/verifies → kids-privacy-officer re-review → KC by-ear/device pass.

## 7. App Review package

- [ ] Reviewer notes: demo parent account (sandbox-allowlisted), how to purchase in sandbox, what changed since the 3.1.1 rejection (IAP now offered in-app; no external purchase steering on iOS).
- [ ] EULA — **FV-497 (open, gates the paywall)**; standard Apple EULA vs custom — KC/attorney.
- [ ] Insurance — FV-496 status check before submission.
- [ ] Privacy labels delta (§3) + `/privacy` page statement review (server-side Apple verification, no new third-party SDK on signed-in surfaces — already verified true in PR #515 review).
- [ ] Screenshots/metadata refresh if the subscribe surface shows in any screenshot.

## 8. Operational runbooks (referenced by code comments in PR #515)

- **Missed notifications:** Get Notification History after any webhook outage; run `reconcileAppleSubscription(payer, env)` for affected payers. Retries: production 5× at 1/12/24/48/72h; sandbox ONE attempt (expect gaps in QA; recovery path is the point).
- **Support-mediated token relink** (record §4.7): KC-gated manual procedure; artifact never persisted; never auto-relink.
- **Root CA rotation:** re-pull Apple PKI roots on Apple notice; redeploy env paths.
- **Library upgrades:** `@apple/app-store-server-library` bumps are Tier-2 (strategist condition 2).

## 9. Hold-lift checklist (the actual gate list for KC)

1. P2 decided + ASC configured; P7 worded by KC; P8/Delvox copy staged for the same window (privacy-named condition, PR #513).
2. FV-497 EULA resolved; FV-496 insurance bound.
3. §2 account prerequisites complete; §4 env provisioned.
4. Fresh integration stack (PR #516 pattern) green on the day's heads.
5. FV-575 (Stripe atomic watermark guard) landed or explicitly waived before FV-572's live caller ships.
6. Merge order per §5; then sync/build/TestFlight; then §6 matrix; then §7 submission.
