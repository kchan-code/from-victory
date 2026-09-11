# FV-210 — iOS In-App Purchase architecture: decision record + spec

**Status:** DRAFT v5 for KC + Codex. Prepared under a hard release hold:
**ALL work in this record — including every merge and deploy of any part of
it — is held until KC lifts the hold.** No native sync/build, no App Store
config, no production mutation.
v2 integrated three specialist design reviews. v3 integrated Codex's
FV-210 reconciliation (resolves B1; contracts map onto canonical
FV-570/571/572/573). v4 applied the backend + privacy re-reviews of those
corrections. **v5 records KC's OFFERING APPROVAL (recorded by Codex on
FV-210/570/572/573): 7-day/1-athlete trials on both providers (existing
trials keep their terms), Apple paid tiers 1–5 preserving first-athlete +
sibling economics, no silent cap on >5-athlete Stripe families, and the
parent-selects downgrade contract — plus the two pre-ship definitions KC
required (safe no-selection handling; trial-to-family conversion timing +
charge disclosure) and the remaining open decisions (Section 6: P2, P4, P7,
P8; Section 10).** FV-570 implementation begins on its own branch under
these terms.

**Supersedes:** the reader-style / NO-IAP posture for **iOS only** (KC
approval 2026-09-11, after Apple rejected iOS 1.0 (3) under Guideline 3.1.1).
The Android/Play track keeps its reader-style posture and its shipped
compliance machinery (FV-478 / FV-489 / FV-492 / FV-493) unchanged —
byte-identical, by construction (Section 4.8). Repo docs that still state
"NO IAP" globally describe the Android posture and the pre-2026-09-11 iOS
posture; they must not be read as overruling this record.

---

## 1. The approved model

- **iOS app:** Apple auto-renewable subscriptions (StoreKit 2) purchase and
  manage FV access inside the app. Apple is the merchant of record for
  iOS-originated subscriptions.
- **Web:** Stripe checkout and billing portal continue unchanged. Existing
  Stripe subscribers and comp-grant holders keep access everywhere, including
  inside the iOS app, with no migration and no re-purchase.
- **Android shell:** unchanged reader-style. No purchase surface, no prices,
  browser-notice copy only.
- **Not in scope / not enabled by this work:** adult-signup flag changes,
  social login, Apple Family Sharing as a substitute for FV athlete capacity,
  any Play Billing work.

## 2. Current system truth (inspected 2026-09-11, `origin/main` @ 6d01dd8)

Verified line-by-line by backend + frontend review; no factual drift found.

1. **Resolver** — `apps/web/lib/subscriptions/access.ts`
   `getParentAccessLevel(payerId)`: (a) active `access_grants` row → `full`
   (comp grants, checked first, fail-closed); (b) else read `subscriptions`
   mirror row by `parent_id` (the payer id — a parent or an `adult_athlete`)
   and map status via the pure `subscriptionAccessLevel()`
   (`active|trialing → full`, `past_due|incomplete|unpaid|paused → degraded`,
   `canceled|incomplete_expired|none → blocked`). Athletes resolve to their
   payer via `parent_athlete_links`; they receive ONLY the enum
   (`access.ts:123-127` privacy contract).
2. **Mirror** — `subscriptions` is a **pure Stripe mirror**
   (PK `parent_id`; `stripe_customer_id` NOT NULL UNIQUE — an Apple-only payer
   structurally cannot get a row here; `status` CHECK-constrained to Stripe
   vocabulary; `last_stripe_event_at`). Written only by the Stripe webhook
   via idempotent upserts with an out-of-order watermark
   (route.ts:296-308, migration `20260610120000`).
3. **Quantity/capacity** — Stripe uses per-seat quantity with graduated
   pricing. `lib/stripe/sync-athlete-quantity.ts` re-syncs quantity after
   athlete add/remove. **There is NO capacity ceiling or access-level gate on
   the add-athlete flow today** (`lib/actions/athletes.ts`,
   `app/dashboard/athletes/new/page.tsx` — `requireParent()` only; even a
   blocked payer can add athletes). Per FV-210 reconciliation this stays
   **unchanged** in this arc (Section 4.6).
4. **Trial** — 14-day trial is code-applied at Stripe checkout, once per
   account: trial-eligible ⇔ no `subscriptions` row has ever existed for the
   payer. A read error **aborts checkout** (fail-closed, PR #185 —
   `lib/actions/subscription.ts:161-198`).
5. **Deletion** — `deleteAccount()` cancels Stripe server-side FIRST, then
   `auth.admin.deleteUser` cascades all rows (`lib/actions/account.ts`).
6. **Enforcement** — `requireActiveAccess()` guards, flag-gated by
   `ENFORCE_SUBSCRIPTION_GATING`; `requireSubscriber()` accepts only
   `parent | adult_athlete` — no purchase surface is reachable from a minor
   session on any platform (`lib/auth/guards.ts:105-129`).
7. **Shell signal** — server-side `isNativeShell()` reads the UA token
   `FVNativeShell/1` via substring match (`lib/native-shell.ts:36-40`). The
   token is one flat value for both platforms today
   (`apps/native/capacitor.config.ts:52`, top-level `appendUserAgent`) —
   **and it is baked into every fielded binary on BOTH platforms, including
   all current iOS/TestFlight builds.** Purchase-surface call sites are
   enumerated in Section 4.8.
8. **Webhook routing** — the middleware matcher already excludes the whole
   `api/webhooks/*` namespace (`middleware.ts:98`); a future
   `/api/webhooks/apple` route needs no middleware change.

## 3. Decision 1 — client purchase layer

Three candidates, evaluated on compatibility, privacy, lifecycle reliability,
and cost. In every option, **server-side verification and entitlement state
are ours** (Section 4) — no option outsources the access decision.

### Option A — direct StoreKit 2 bridge (custom Capacitor plugin) — DECIDED

A small Swift plugin in `apps/native/ios` exposing exactly what FV needs:
`getProducts(ids)`, `purchase(productId, appAccountToken)` (returns the signed
transaction JWS), `currentEntitlements()`, `restore()` (`AppStore.sync()`),
`showManageSubscriptions()`, and a `Transaction.updates` listener forwarding
JWS payloads to the web layer for server submission. StoreKit 2's async Swift
API makes this a few hundred lines; the app has ONE subscription group and
(pending tiers) 2–4 products.

- **Compatibility:** no third-party peer deps; the Capacitor plugin bridge API
  is stable across Capacitor 7 (today's shipped iOS app) and 8 (PR #458) —
  the only option with no hard dependency on #458. StoreKit 2 floor is
  iOS 15+, matching the app's deployment target (verify at implementation).
- **Privacy:** zero new third-party data processors. Purchase data flows
  device → Apple → our server only. Concretely load-bearing: the public
  privacy policy's claim that FV embeds no third-party SDKs on any signed-in
  surface (`app/privacy/page.tsx` ~line 365) **remains true**, the App Store
  privacy label gains no new third-party disclosure, and no DPA is needed.
  (Note: the purchase surface is payer-only — `requireSubscriber()` excludes
  minors — so a vendor SDK here would be a *payer*-data question, not a
  literal breach of the 13-17 non-negotiables. The rejection of Option B does
  not rest on the minor-specific rule; see its verdict below.)
- **Lifecycle reliability:** the hard states (renewal, billing retry, grace,
  revocation, upgrade, refund) are handled server-side via App Store Server
  Notifications V2 + Apple's official server library — identical in every
  option. We own a small Swift surface; mitigated by its size and the
  existing native-shell maintenance practice.
- **Cost:** $0 beyond Apple's commission (15% expected via Small Business
  Program — verify enrollment; else 30%/15% year-2).

### Option B — RevenueCat (`@revenuecat/purchases-capacitor` 13.5.1) — REJECTED for MVP

- Actively maintained (2026-09-10) but requires `@capacitor/core >= 8` →
  hard-blocks on PR #458, and adds RevenueCat's native SDK.
- Introduces a third-party **data processor** receiving receipt data, app
  user ids, device metadata, and purchase history for every payer: requires a
  DPA, a new App Store privacy-label disclosure, and a material rewrite of
  the public privacy policy's no-third-party-SDK claim.
- Rejected on: the Definition-of-Done rule (no new third-party SDK without
  product-strategist approval) applied to the repo's deliberate zero-SDK
  posture; the disclosure/DPA overhead vs. marginal benefit (Section 4 is
  required work in all options); the #458 hard dependency; and a permanent
  ~1% revenue share above $2.5k MTR/mo. Its lifecycle maturity is real —
  revisit only if Option A's maintenance proves materially expensive.

### Option C — Capgo `@capgo/native-purchases` (8.7.0) — FALLBACK

Thin maintained wrapper, no backend service (validation stays ours), no
third-party data flow. Requires Capacitor ≥ 8 (blocks on #458) and adds an
externally-roadmapped dependency for an API surface barely larger than Option
A's. Fallback if Option A stalls, by explicit KC decision only.

### Community plugins — rejected outright

`capacitor-subscriptions` (1.0.3-alpha, stale since 2024, Cap 6) and
`@squareetlabs/capacitor-subscriptions` (Cap 6/7, low adoption): not
acceptable for a payments path.

### Server library

`@apple/app-store-server-library` (3.1.0, Apple-official, server-side-only,
pure JWS/certificate verification — no data collection of its own). It is a
NEW dependency: **not installed in this arc**; route through
product-strategist per the Definition of Done when FV-571 implementation
begins (privacy review recorded no objection).

## 4. Decision 2 — server verification & provider ownership (all options)

### 4.1 Provider-separated entitlement state

- New table **`apple_subscriptions`** — a pure Apple mirror, sibling of the
  Stripe mirror.
  - **Keying (v3, per FV-210 reconciliation):** surrogate PK, with
    `UNIQUE (payer_id, environment)` and
    `UNIQUE (original_transaction_id, environment)`. A bare `payer_id` PK
    cannot host the required Sandbox/Production coexistence (a QA payer
    legitimately holds one row per environment); environment isolation is a
    hard requirement (Section 4.9), not a convenience.
  - Columns: `payer_id` (FK → profiles, ON DELETE CASCADE — payer is a
    parent or adult_athlete), `environment` (`Sandbox | Production`),
    `original_transaction_id`, `product_id`,
    `status` — **Apple-native vocabulary**, NOT Stripe's
    `SubscriptionStatus`: `subscribed | in_grace_period | in_billing_retry |
    expired | revoked` (fresh CHECK constraint; the Stripe enum encodes
    Stripe dunning policy and must not be reused);
    `expires_at` (NOT NULL — load-bearing for time-aware access, 4.2,
    sourced from `transactionInfo.expiresDate`),
    `grace_period_expires_at` (nullable — populated on transition to
    `in_grace_period` from `renewalInfo.gracePeriodExpiresDate`, which
    lives on the RENEWAL payload, not the transaction payload; the grace
    bound is NOT `expires_at`, see 4.2),
    `auto_renew_status`, `app_account_token` (persisted — durable audit
    trail), `last_signed_date` (**payload-staleness watermark**, see 4.2 —
    explicitly NOT a business-event ordering key), timestamps.
  - **Same-group tier changes (UPGRADE/DOWNGRADE) and keying:** whether an
    in-group product change mints a NEW `original_transaction_id` is an
    FV-571 Apple-doc verification item. The upsert logic must be written
    supersession-safe either way: locate the payer's existing
    (`payer_id`, `environment`) row and update its
    `original_transaction_id`/`product_id` in place when Apple supersedes
    the transaction — never blind-INSERT by transaction id into a
    `UNIQUE (payer_id, environment)` collision.
  - RLS: payer-own SELECT, service-role-only writes — mirroring the Stripe
    mirror's shape, BUT the migration must use the **FV-507 grant pattern**
    (explicit REVOKE + minimal re-grant), not the pre-FV-507 legacy grants.
    An RLS-harness assertion file is a named acceptance criterion —
    **`19_client_grant_matrix.sql` already exists on the FV-507 branch, so
    the file takes the next free index at implementation time (expected
    `20_apple_subscriptions.sql`; verify free against the merged harness
    before naming)** — following the `03_subscriptions.sql` template: real
    INSERT/UPDATE as authenticated → `insufficient_privilege`; cross-payer
    and **athlete-role 0-rows** checks. (RLS Harness CI is non-required —
    review it manually on the PR per standing gotcha.)
- **`app_account_token` is a dedicated opaque per-payer purchase UUID**
  (minted once per payer at first purchase attempt, stored 1:1), **never the
  literal `profiles.id`**. Note its lifecycle constraint (Section 4.7): the
  token is **immutable on the Apple side for the life of the original
  transaction** — renewals carry the token set at first purchase — so the
  token is a *binding hint*, not a durable bidirectional key.
- **Pure mappers:** `appleSubscriptionAccessLevel()` maps
  (Apple-native status, `expires_at`, `now`) — **time-aware, see 4.2** — to
  the SHARED output enum `AccessLevel`. Status policy:
  - `subscribed` → `full` (while within time bounds)
  - `in_grace_period` → **`full`** — Apple's billing grace period retains
    full entitlement by Apple's own contract with the user.
  - `in_billing_retry` (grace disabled/exhausted) → `degraded`
  - `expired | revoked` → `blocked`
- **Resolver change** (`lib/subscriptions/access.ts`): resolution order
  `access_grants` → Stripe mirror → Apple mirror; return the **best** level
  across providers. In production, the Apple read is
  **environment-scoped** (4.9). The enum-only athlete privacy boundary is
  preserved — FV-570 must include (a) a unit test asserting the athlete path
  never touches `apple_subscriptions` columns and (b) the harness
  athlete-0-rows assertion.
- A payer's entitlement provider (`stripe | apple | comp | none`) is
  derivable, not stored.

### 4.2 Verification, lifecycle state, and time (v3-revised)

**Principles (per FV-210 reconciliation):**
- **Access is time-aware, never notification-dependent — and the time bound
  is STATUS-CONDITIONAL:**
  - `subscribed`: full while `now ≤ expires_at`; past `expires_at`, a small
    configured skew allowance (e.g. ≤ 6h, for renewal-processing latency)
    yields `degraded`, beyond it `blocked` — **even if no notification ever
    arrived**. Missed notifications can never extend access.
  - `in_grace_period`: full while `now ≤ grace_period_expires_at` (its OWN
    bound with its own skew) — NOT gated on `expires_at`, which by
    definition has already passed when grace begins. Gating grace on
    `expires_at` would wrongly demote legitimate grace users immediately.
  - `expired | revoked`: `blocked`, **no time dimension and no skew** — a
    definitively closed state is never re-opened by clock allowances.
  - Exact skew bounds are an FV-570/571 acceptance criterion.
- **`signedDate` is payload staleness, not business ordering.** Apple does
  not guarantee notification delivery order, and `signedDate` is a signing
  timestamp. Upserts apply the payload's *absolute state snapshot*
  (`transactionInfo.expiresDate`, `revocationDate`,
  `renewalInfo.autoRenewStatus`, `renewalInfo.gracePeriodExpiresDate`, …)
  guarded by the `last_signed_date` watermark to drop older payloads.
  **Scope of the safety claim:** time-awareness makes *missed* notifications
  (silence) harmless; it does NOT make watermark *comparison* bugs harmless
  — a stale `subscribed` snapshot wrongly overwriting a newer `revoked` row
  corrupts both inputs to the time-aware read, and `expired|revoked` have no
  time-based safety net at all. **Named FV-571 AC: explicit
  watermark-misordering test cases** (delayed old renewal vs newer
  revocation, duplicate redelivery, equal-signedDate payloads) — distinct
  from, and in addition to, the Apple-doc verification below. Business
  transitions are never inferred from notification arrival order.
- **Client-submission vs notification races:** both paths write the same
  absolute snapshots through the same watermark, so either order converges;
  a stale client submission after a newer notification is dropped by the
  watermark; a newer client submission after an older notification wins. An
  explicit **FV-571 acceptance criterion: verify against Apple's
  authoritative documentation** — specifically: (a) whether
  `renewalInfo.gracePeriodExpiresDate` is populated on every grace-entry
  notification; (b) whether `transactionInfo.expiresDate` extends during
  grace (if it does, the separate grace column is redundant — the spec must
  record which case holds, not stay ambiguous); (c) whether a same-group
  UPGRADE/DOWNGRADE mints a new `original_transaction_id` (drives the
  supersession-safe upsert in 4.1); (d) Notifications V2 "Receiving
  notifications" ordering caveats and `signedDate` semantics;
  (e) JWSTransaction vs JWSRenewalInfo field authority; (f) sandbox
  notification behavior; (g) upgrade-during-intro-offer behavior (trial
  forfeiture + proration on in-group upgrade, backing §4.5's
  trial-to-family conversion contract) — and encode the verified answers
  as code comments + tests.

**Paths:**
1. **Purchase-time:** client submits the signed transaction JWS; server
   verifies signature + certificate chain (`SignedDataVerifier`), checks the
   `appAccountToken` maps to the calling payer's stored purchase UUID,
   bundle id `com.fromvictoryapp.app`, and **environment policy (4.9)**,
   then upserts the mirror. The client is NEVER trusted for entitlement
   state, **and the UA/shell signal is NEVER part of authorization (4.8)**.
2. **Steady-state:** App Store Server Notifications V2 endpoint
   (`app/api/webhooks/apple/route.ts`): verify `signedPayload` JWS; switch
   on `notificationType`/`subtype`; idempotent snapshot upsert under the
   watermark. Explicit disciplines:
   - **First-seen transactions CREATE the row** when the decoded
     `appAccountToken` resolves to a **live** payer's purchase UUID (no
     checkout-lands-first guarantee exists on Apple).
   - **Unmapped tokens never create or relink anything** (deleted-account
     renewals, unknown tokens): benign-no-match branch, warn + 200
     (see 4.7 — no silent relinking, ever).
   - Three visible branches: processed (200) / benign-no-match (warn + 200)
     / processing failure (500, Apple retries).
   - JWS verification failure: 400, no processing, never log the raw
     payload.
   - Apple's redelivery contract differs from Stripe's (bounded retry
     window, then recovery via `Get Notification History`) — FV-571 ships a
     runbook note for endpoint-outage recovery.
3. **Reconciliation:** on-demand App Store Server API
   `Get All Subscription Statuses` for drift repair (admin path; also the
   bounded on-read repair option when a row lapses past `expires_at` with
   auto-renew on). Not a cron in MVP.

### 4.3 Restore & cross-account conflicts (v3-revised)

- **Restore purchases** (required by Apple): `AppStore.sync()` client-side,
  then submit current-entitlement JWS from an **authenticated, user-initiated
  restore flow**. Server links by (`original_transaction_id`, `environment`).
- **Ownership rules:**
  - Transaction linked to the SAME payer → refresh snapshot.
  - Transaction linked to a DIFFERENT **live** payer → block ("This Apple
    subscription is already linked to another From Victory account…");
    support-mediated relink only. The UNIQUE constraint enforces it.
  - Transaction linked to **no** payer (typically post-deletion, 4.7) →
    **no automatic relink.** See 4.7 for the only permitted paths.
- Rejecting restore for the same-payer case is never acceptable (App Review
  requirement + paying-user harm); the conflict and orphan cases above are
  deliberate, narrow exceptions with explicit user-facing copy.
- A restore on an account with an active Stripe subscription links (an
  existing Apple billing reality is always recorded) and surfaces the
  duplicate-billing warning (4.4).

### 4.4 Duplicate-billing guard

- iOS purchase UI is HIDDEN behind a server-computed flag: a payer already
  `full` via Stripe or comp sees management/status copy, never a buy button.
  (Server decides; client renders.)
- Purchase-time conflict handling: **the verified Apple transaction is ALWAYS
  persisted** (recording billing truth is unconditional); only the response
  differs — on an active-Stripe conflict the user gets the double-billing
  warning and cancel-one-side instructions. (Never "reject without
  persisting": a user who then cancels Stripe would hold zero recorded
  entitlement while Apple keeps billing them.) The resolver's best-of fold
  makes the persisted row safe by design.
- The raced-conflict path fires an internal alert
  (`deliverInBackground(notifyError(...))`).
- The web `/subscribe` page mirrors the guard: an Apple-entitled payer sees
  "you're subscribed through the App Store — manage it on your iPhone"
  instead of Stripe checkout.
- No cross-provider server-side cancel exists (Apple forbids it).

### 4.5 Trial policy (DECIDED by KC 2026-09-xx, recorded on FV-210/570/572/573)

- **New trials are SEVEN days for ONE athlete, on BOTH providers.** Apple:
  a 7-day introductory free trial on the 1-athlete tier. Web/Stripe: the
  checkout trial changes from 14 days to 7, and the trial covers one
  athlete.
- **Existing trials keep their promised duration and their existing seat
  terms** — no retroactive shortening; the 7-day/1-athlete rule applies to
  trials that START after the change ships.
- **Cross-provider one-trial rule (mechanics):** trial-eligible ⇔ no Stripe
  row has ever existed AND no Apple entitlement has ever existed for the
  payer, with the exact PR-#185 fail-closed contract — **an Apple-mirror
  read error aborts checkout**. (Apple-side intro-offer eligibility is
  additionally Apple-enforced per Apple ID; the iOS paywall shows trial
  copy ONLY from StoreKit eligibility APIs — `isEligibleForIntroOffer` —
  never hardcoded.)
- **Trial-to-family upgrade (defined pre-ship, per KC's requirement):**
  adding a second athlete during an active trial **converts the
  subscription to the paid multi-athlete tier immediately and ends the
  trial**, on both providers — Apple forces this (an in-group upgrade
  during an intro offer forfeits the remaining trial), and web matches for
  cross-provider parity. **Charge disclosure is mandatory BEFORE the
  confirming tap/click**: the add-athlete flow must show, on the
  confirmation control itself, that the free trial ends now, the plan
  charged, the amount, and the billing date ("Adding a second athlete
  starts your paid N-athlete plan today and ends your free trial — you'll
  be charged $X now"). No silent conversion, ever. (Verification that
  Apple's upgrade-during-intro-offer proration behaves as documented is
  item (g) on the FV-571 Apple-doc list.)
- **Consequence flag (cross-system, KC/Codex):** public marketing copy and
  the GTM artifacts state "14 days free" — the 7-day change must route
  through the Delvox GTM engine per the GTM source-of-truth rule; app-side
  `/subscribe` copy changes ride the web trial-policy work. See Section 10
  (issue-split recommendation).

### 4.6 Capacity (athlete count) — DECIDED (KC, recorded on FV-210/570/572/573)

- Stripe: per-seat quantity + `syncAthleteQuantity` — unchanged, **no
  ceiling. Explicit invariant + test AC: existing (and future) Stripe
  families above five athletes are NEVER silently capped** — the capacity
  ceiling is an Apple-tier concept only.
- Comp grants: uncapped (no seat concept), unchanged.
- **Apple paid tiers: 1–5 athletes**, one product per tier in one
  subscription group, monthly + annual. **Pricing contract: retain the
  current first-athlete/sibling economics as closely as available Apple
  price points permit** — base $5/mo | $49/yr for athlete 1, +$3/mo |
  +$29/yr per additional athlete. Proposed mapping (FINAL price points are
  App Store Connect config, release-held, P2):
  monthly ≈ $4.99 / $7.99 / $10.99 / $13.99 / $16.99;
  annual ≈ $49.99 / $78.99 / $107.99 / $136.99 / $165.99.
  The test-pinned `productCapacity(product_id) → maxAthletes` map remains
  the single place ceilings live (1…5).
- The athlete-add capacity gate is NET-NEW code (Section 2.3). Placement
  (proactive on `athletes/new` vs. inside `createAthlete()` before the
  auth-user creation) is an FV-570 design point. At an Apple ceiling: iOS
  shows the tier-upgrade prompt (Apple-prorated in-group upgrade);
  web/Android shows "manage your plan on your iPhone."
- **Blocked-Stripe-payer athlete creation stays UNCHANGED in this arc**
  (settled non-goal).
- **Downgrade below current athlete count — DECIDED (was P5):**
  - Existing paid access continues **until renewal** (Apple applies the
    lower tier at the next renewal date — matching Apple's own downgrade
    semantics).
  - Before/at renewal, **the parent selects which athletes retain paid
    access** under the smaller plan. **Never auto-select. Never delete.**
    All athlete profiles, journals, and history are preserved regardless of
    seat status — seat status affects entitlement only.
  - **Safe no-selection handling (defined pre-ship, per KC's
    requirement):** if renewal arrives with more athletes than the new
    capacity and no parental selection recorded, the account enters a
    fail-closed **selection-required state**: NO athlete is auto-chosen;
    all of the payer's athletes see the existing paused/notice experience
    (the `/athlete/paused` machinery — encouragement-framed, no data loss)
    until the parent completes selection, which takes effect immediately
    and reversibly. Rationale: any auto-selection rule (oldest? most
    recent? first-created?) silently decides which child keeps training —
    that is a family decision, not an algorithm's. The parent dashboard
    surfaces the selection prompt prominently from the moment the
    downgrade is scheduled (not just at renewal).
  - Selection persistence (per-athlete seat designation, consulted ONLY in
    over-capacity states) is FV-570 data design; the selection UI is
    FV-572. Implementation of the seat-designation schema waits for KC's
    ack of this no-selection contract (Section 10).
- **Family Sharing is OFF** on all FV products (`familyShareable = false` in
  App Store Connect — config-time, release-held): Apple Family Sharing
  shares the PURCHASE across an Apple family; FV capacity is athlete seats
  inside one FV account.

### 4.7 Account deletion & the immutable-token problem (v3-revised)

Deletion is **not** copy-only; it has a real identity-lifecycle design point:

- **DB mechanics:** the existing `auth.admin.deleteUser(payerId)` cascade
  deletes the `apple_subscriptions` row (FK → profiles) exactly as it
  deletes the Stripe mirror row — no new sequencing code (Apple has no
  server-side cancel to order around).
- **The token problem:** `app_account_token` is set at first purchase and is
  **immutable for the life of the original transaction** — every renewal
  carries the deleted payer's token forever. Post-deletion:
  - The token maps to nothing (the payer and their purchase-UUID mapping are
    gone). **Webhook rule:** notifications carrying an unmapped token take
    the benign-no-match branch — warn + 200, **no row creation, no silent
    relinking** (4.2).
  - **Relinking an orphaned transaction to a new FV account is
    support-mediated ONLY.** An automatic restore-based relink is rejected:
    a signed JWS is bearer-shaped evidence (possession of the payload, not
    proof of Apple-account ownership), and the token can never be re-pointed
    on Apple's side — silently binding it to whichever authenticated session
    presents it first is an account-takeover-shaped risk (anti-replay).
    Support verifies ownership out-of-band (Apple receipt email / purchase
    history) before a service-role relink that mints a fresh internal
    mapping (`original_transaction_id` → new payer; the on-Apple token
    remains the old opaque UUID, recorded as historical — which is why the
    token is a binding *hint*, not the durable key: the durable key is
    (`original_transaction_id`, `environment`)). **Handling rules for this
    manual path (privacy re-review):** the verification artifact
    (receipt/screenshot) is used only to confirm the ownership match — it
    is never persisted into `apple_subscriptions`, any FV table, or logs
    beyond the support ticket itself; the relink action is KC/founder-gated
    pre-scale; FV-573's runbook names the verification method and a target
    resolution SLA (the friction on the legitimate "deleted my account,
    resubscribed on the same iPhone" path is a deliberate anti-replay
    tradeoff — the server cannot distinguish a genuine repeat purchaser's
    bearer JWS from a replayed one without device attestation, which is out
    of scope). **Audit-clarity note:** the historical token is an opaque
    UUID carrying no PII; once the deleted payer's cascade completes,
    nothing in FV's DB links it to their identity — "recorded as
    historical" is not residual personal data (cascading-delete Rule 9
    satisfied).
  - Deletion UX copy must say so: "Your App Store subscription is managed by
    Apple — cancel it in Settings → Apple ID → Subscriptions
    (apps.apple.com/account/subscriptions). Deleting your From Victory
    account does not cancel it, and it cannot be automatically re-attached
    to a new account."
- Log-retention note: `original_transaction_id` will appear in structured
  logs and outlive the row — same accepted shape as `stripe_subscription_id`
  today (event metadata, never content). Documenting log-retention posture
  is a shared, non-blocking follow-up.

### 4.8 Shell capability signal — legacy-safe classification (v3-revised)

- **The bare token `FVNativeShell/1` is fielded on BOTH platforms** — every
  Android binary AND every existing iOS/TestFlight binary bakes it at build
  time. It therefore classifies as **`legacy-native`: platform UNKNOWN,
  behavior RESTRICTED** (today's reader-style surfaces, byte-identical). It
  must never be interpreted as "Android."
- **Explicit iOS capability marker, additive:** new iOS builds set
  `ios: { appendUserAgent: "FVNativeShell/1 (ios)" }` in
  `capacitor.config.ts` (Capacitor's per-platform key overrides the global
  one; supported on the pinned CLI). **Android's token is NOT touched** —
  the top-level `appendUserAgent: "FVNativeShell/1"` stays byte-identical
  (optionally mirrored into `android.appendUserAgent` verbatim for
  self-documentation).
- Classification: `getShellCapability()`:
  UA contains `"(ios)"` → `ios-iap` (IAP-capable iOS build);
  else contains the bare token → `legacy-native` (restricted reader-style —
  covers all fielded Android forever and all pre-IAP iOS builds);
  else → `null` (browser/PWA). Legacy iOS builds correctly show no purchase
  UI (they have no bridge); they converge as users update. (Metrics note:
  anything counting `legacy-native` as "Android users" over-counts until
  pre-IAP iOS builds roll off.)
- **The UA signal is presentation/capability ONLY — never authorization.**
  Entitlement decisions and purchase-submission acceptance rest on the
  authenticated session + server-side checks (4.2, 4.9); a forged `(ios)`
  UA gains an attacker nothing but a different page rendering.
- **FV-483 guard-test rewrite is part of the same change:** the current test
  asserts `appendUserAgent` appears exactly once — a second key breaks it,
  and the wrong "fix" is collapsing back to one token. Rewrite to structural
  assertions: token(s) only at top level or under `ios`/`android` (never
  inside `server`), the base token pinned to today's literal string, no
  `stripe.com` in `allowNavigation`.
- **Complete purchase-surface inventory** (FV-572's checklist):
  `app/subscribe/page.tsx`; `app/dashboard/page.tsx`;
  `app/dashboard/settings/page.tsx`; `app/athlete/settings/page.tsx`;
  `app/athlete/paused/page.tsx`; `lib/actions/billing-portal.ts` (server
  refusal); **`lib/actions/auth-adult.ts:174-177`** (post-signup redirect —
  on `ios-iap`, `/subscribe` is live again; `legacy-native` keeps today's
  `/athlete` redirect). NOT split (platform-blind by design): sign-out /
  delete-account redirects in `lib/actions/auth.ts` / `account.ts`. Open
  design question: `app/subscribe/success/page.tsx` (Stripe-return-shaped;
  StoreKit purchases don't round-trip a return URL — adapt or new iOS
  confirmation state).
- iOS paywall requirements: product/price strings ONLY from StoreKit
  localized prices; restore button; `showManageSubscriptions`;
  **Terms/EULA + Privacy links are NET-NEW UI on this page** (FV-497 gates).
- Defense-in-depth: `Vary: User-Agent` on routes rendering
  capability-conditional content.
- **Guards (test-pinned in FV-572):** role gate (an `athlete`-role +
  `ios-iap` request NEVER renders purchase UI); legacy bit-identity (all
  FV-492/493 suites pass unchanged with the bare token — which now also
  covers legacy iOS); price-leak guard (no hardcoded `$` reachable under
  `ios-iap`).
- No steering: the iOS app must not link out to web purchase
  (StoreKit-external-link entitlements are out of scope).

### 4.9 Sandbox / Production isolation (v3, new — security-critical)

Sandbox JWS payloads are freely obtainable (sandbox purchases cost nothing),
so **a sandbox transaction must never grant production access to an
arbitrary account**:

- Rows carry `environment`; keying allows one row per (payer, environment)
  (4.1).
- **Production entitlement reads are environment-scoped:** the resolver
  counts only `environment = 'Production'` rows — UNLESS the payer is on an
  explicit, KC-gated **sandbox-tester allowlist** (expected members:
  internal QA payers and the App Review account). Allowlisted payers may
  derive access from Sandbox rows (this is what makes TestFlight /
  App Review IAP flows work against the production backend).
- **The allowlist is itself a user-data structure and gets full RLS
  treatment (privacy re-review, named AC):** if implemented as a table (the
  expected shape — resolver and webhook both look it up per-payer), it
  requires `ENABLE ROW LEVEL SECURITY`, the FV-507 grant pattern, and its
  own harness assertion file, with **service-role-only reads AND writes —
  no payer or athlete SELECT** (a payer must not be able to probe their own
  QA-membership). Reviewed with the same rigor as `apple_subscriptions`.
- **Enforcement locus is application code, not RLS — centralize it:** the
  resolver's Apple read runs under the service-role client (like the Stripe
  read today), so RLS cannot supply the environment wall; the
  `WHERE environment = 'Production' OR allowlisted` clause IS the wall.
  Mandate a **single centralized accessor** for `apple_subscriptions`
  entitlement reads (one function; no ad hoc reads elsewhere), and the
  named tests below are a **hard, explicitly-required gate on the FV-570
  PR**, not advisory.
- **Purchase-time policy:** a verified-but-Sandbox submission from a
  non-allowlisted payer is **rejected with a clear error and logged**
  (`notifyError`) — no row, no entitlement. (Verify-both-environments
  fallback per Apple guidance applies only to determining which environment
  signed the payload, not to granting access.) **Reconciliation with 4.4's
  always-persist principle:** that principle is scoped to *real Production
  billing truth* — its risk is "Apple keeps charging while we hold no
  record." A Sandbox transaction carries no real charge, so rejecting it
  drops no billing truth; no legitimate non-allowlisted payer submits a
  Sandbox JWS from a shipped App Store build.
- **Webhook policy:** Sandbox-environment notifications upsert only rows for
  allowlisted payers; otherwise benign-no-match (warn + 200).
- **Allowlist lifecycle:** additions AND removals are KC-gated; FV-573's
  runbook includes a removal step when a QA window closes and a periodic
  membership audit — a lingering entry widens the blast radius of a
  compromised QA-account session indefinitely.
- **External TestFlight beta testers transact in Sandbox** by Apple's
  platform behavior: as scoped, a non-allowlisted external beta tester's
  purchase is rejected at purchase time. This is the intended security
  default — FV-573's test plan must state it up front (and deliberately
  allowlist any external testers who need purchase flows) so it isn't
  rediscovered mid-beta as an apparent bug.
- **Named test policy (FV-570/571 ACs, hard gate):** unit + harness
  assertions that (a) a Sandbox row never yields `full` for a
  non-allowlisted payer through the resolver; (b) a Sandbox purchase-time
  submission by a non-allowlisted payer is rejected; (c) an allowlisted
  payer's Sandbox row grants access in the expected window; (d) the
  allowlist table itself rejects client-role reads/writes
  (`insufficient_privilege`).

## 5. Sequencing & dependencies

**HOLD GOVERNS EVERYTHING: no part of this record — server-side or native,
however "inert" — merges or deploys until KC lifts the release hold.** The
notes below are dependency analysis only, to inform ordering when the hold
lifts; they do not authorize any action.

1. **Capability signal (FV-572 slice):** no dependency on PR #458. Note the
   merge-vs-wire distinction for later planning: the server-side classifier
   affects only how already-fielded UAs are treated; the
   `capacitor.config.ts` ios key changes fielded UAs only after a native
   build ships.
2. **PR #458 (Capacitor 8 / API 36):** not a blocker for Option A's design;
   the bridge implementation should land after #458 to avoid double native
   churn. (If Option C were ever chosen, #458 becomes a hard prerequisite.)
3. **Offering decisions (Section 6)** gate App Store Connect product
   creation, paywall copy, capacity-map values, trial copy. Everything else
   — tables, webhook, resolver, bridge interface, guards — can be designed
   and prepared independently, with placeholder product ids in tests only.
4. **App Store Server API credentials** and Notifications V2 URL
   registration are App Store Connect config — release-held; server code is
   designed env-var-shaped and dormant.
5. `ENFORCE_SUBSCRIPTION_GATING` and adult-signup flags: untouched.

## 6. Pending decisions (owned by KC/Codex — DO NOT implement)

| # | Decision | Owner | Status |
|---|---|---|---|
| P1 | Athlete tier ceilings | KC | **DECIDED: 1–5**, sibling economics preserved (4.6) |
| P2 | Apple product ids + exact ASC price points (proposed mapping in 4.6) | KC/Codex | OPEN — App Store Connect config, release-held; does NOT block code prep |
| P3 | Trial policy | KC | **DECIDED: 7 days / 1 athlete, both providers; existing trials keep terms** (4.5) |
| P4 | Small Business Program enrollment status (15% vs 30%) | KC | OPEN — pricing economics only; explicitly NOT a blocker for code preparation |
| P5 | Downgrade-below-count | KC | **DECIDED: paid until renewal; parent selects retained seats; never auto-select/delete; fail-closed selection-required state** (4.6) |
| P7 | KC ack of the two pre-ship definitions this record supplies: the no-selection contract (4.6) and the trial-to-family immediate-conversion + disclosure contract (4.5) | KC | OPEN — gates the seat-designation schema + conversion UI slices |
| P8 | "14 days free" → 7-day marketing copy | KC via Delvox GTM engine | OPEN — GTM-owned artifacts; app copy rides the trial-policy issue (Section 10) |

(Resolved earlier: blocked-Stripe-payer athlete creation stays unchanged —
a non-goal, formerly P6.)

## 7. Mapping onto the canonical downstream contracts (FV-570…FV-573)

Codex owns Linear; **FV-570/571/572/573 already exist and are canonical.**
This record proposes no new issues; v2's "contracts 1–7" are superseded by
this mapping. Review-mandated acceptance criteria travel with their items.

| Canonical issue | This record's scope that maps to it |
|---|---|
| **FV-570 — provider access/capacity** | `apple_subscriptions` migration (4.1: surrogate PK, per-environment uniqueness, Apple-native vocabulary incl. `grace_period_expires_at`, FV-507 grant pattern, harness file at next free index — athlete-0-rows); allowlist + purchase-token tables (4.9/4.1, same RLS rigor); `appleSubscriptionAccessLevel()` (time-aware, status-conditional, grace→full); resolver fold + environment-scoped centralized accessor (4.9); cross-provider trial-HISTORY mechanics with PR-#185 fail-closed (7-day policy itself = the web trial-policy issue, §10); capacity map (tiers 1–5) + net-new add-gate + Stripe-never-capped invariant test; seat-designation schema for the downgrade selection contract (WAITS on P7 ack); deletion access semantics incl. orphan-token rules (4.7) |
| **FV-571 — verification/lifecycle** | Purchase-submission action (always-persist, conflict warning, `notifyError`, environment policy 4.9); Notifications V2 route (snapshot upserts, `last_signed_date` watermark, first-seen creation for live tokens only, unmapped-token benign branch, 3-branch discipline, JWS-failure 400, redelivery runbook); reconciliation helper; **AC: verify ordering/`signedDate`/sandbox semantics against Apple authoritative docs** (4.2); `@apple/app-store-server-library` dependency (product-strategist approval; NOT installed in this arc) |
| **FV-572 — native purchase/UI** | Shell capability signal (4.8: `ios.appendUserAgent` additive marker, `legacy-native` classification, FV-483 guard rewrite, UA-not-authorization); StoreKit 2 bridge plugin (post-#458 preferred); iOS paywall + management UI (full surface inventory incl. `auth-adult.ts` redirect; `/subscribe/success` decision; StoreKit-priced; restore flow; duplicate-billing UI both directions; net-new EULA/Privacy footer — FV-497 gates); role-gate / legacy-bit-identity / price-leak guards; `Vary: User-Agent`; deletion UX copy (4.7); `docs/fv211-app-store-privacy-pack.md` + `apps/web/app/privacy/page.tsx` updates |
| **FV-573 — QA/submission** | Sandbox-tester allowlist runbook: KC-gated adds AND removals, periodic membership audit, external-TestFlight-tester policy stated up front (4.9); the allowlist table's RLS/grant/harness treatment travels with FV-570's migration work but its ops runbook lives here; support-relink verification method + SLA (4.7); TestFlight/App Review IAP test plan (needs a KC-authorized window — builds + ASC config are held); ASC configuration execution (products, `familyShareable=false`, Server API credentials, Notifications URL registration, agreements/tax/banking verification); submission itself |

## 8. Blockers & risks (current, concrete)

- ~~**B1** — FV-210 live text unverified~~ **RESOLVED 2026-09-11: Codex
  reconciled this record against FV-210; v3 applies all required
  corrections.**
- **B2:** P1–P3/P5 pending — blocks FV-570's capacity/trial slices, FV-572's
  paywall copy, and all App Store Connect config.
- **B3:** App Store Connect agreements/tax/banking must be Active for paid
  apps before any IAP testing — verification itself is release-held
  (FV-573).
- **B4:** FV-497 (EULA) gates iOS submission AND FV-572's paywall links.
- **B5:** Sandbox/TestFlight IAP testing requires native builds + ASC
  product config — both release-held; plan a KC-authorized testing window
  (FV-573).
- **B6:** The FV-507 grant-pattern fix is not yet on `main`; FV-570's
  migration must adopt whichever pattern lands from FV-507 — sequencing
  dependency. (Harness file index also depends on FV-507's merged state —
  4.1.)
- **R1:** Stripe-web + Apple-iOS coexistence is App-Review-sensitive: no
  in-app steering to web purchase; the "buy on the web" notice must not
  render under `ios-iap`.
- **R2 (new, 4.9):** sandbox-JWS privilege escalation is a real attack shape
  — the environment-scoped resolver + allowlist + named tests are the
  mitigation; treat any weakening of 4.9 as a privacy/security regression.

## 9. Specialist review outcomes

**Design-stage reviews of v1→v2 (2026-09-11):**
- **backend-engineer — SUGGEST_REVISION → integrated** (grace→full;
  Apple-native vocabulary; always-persist duplicate-billing; watermark;
  first-seen creation; (txn, environment) uniqueness; PR-#185 trial
  fail-closed; `notifyError`; deletion cascade simplification; redelivery
  runbook; JWS-failure discipline). Confirmed Section 2 accurate.
- **frontend-engineer — must-fixes integrated** (asymmetric per-platform UA
  override; FV-483 guard rewrite; `auth-adult.ts` redirect; `/subscribe/
  success` question; capacity gate re-scoped as net-new; #458 independence;
  net-new EULA/privacy footer; `Vary: User-Agent`; price-leak guard).
- **kids-privacy-officer — v1 CHANGES_REQUESTED → v2 VERDICT: APPROVED**
  (FV-507 grants + named harness file; opaque purchase UUID; fv211 pack +
  `/privacy` page updates scheduled; role-gate test; Section 3 reworded;
  server-library via product-strategist; log-retention noted). Design-stage
  verdict only — every implementation PR still gets its own review.

**FV-210 reconciliation → v3 (2026-09-11, Codex):** resolves B1. Corrections
applied: (1) hold language — nothing merges/deploys under the hold (§5);
(2) bare token = `legacy-native` (unknown platform, restricted), explicit
`(ios)` capability marker, UA never authorization (§4.8); (3) surrogate-key
mirror + environment-scoped entitlement + sandbox-tester allowlist + named
sandbox-escalation tests (§4.1/4.9, R2); (4) deletion re-specified around the
immutable `appAccountToken` — unmapped tokens never auto-relink,
support-mediated relink only, durable key = (transaction, environment)
(§4.7); (5) time-aware expiry/grace independent of notifications;
`signedDate` demoted to payload staleness; race convergence + Apple-doc
verification AC (§4.2); (6) harness file renamed to next free index
(expected `20_`, verify at implementation) (§4.1); (7) trial policy and
below-count downgrade moved to PENDING (P3/P5, no defaults assumed);
blocked-Stripe athlete creation confirmed unchanged (§4.5/4.6). Contracts
remapped onto canonical FV-570…573 (§7).

**Re-review of the corrections → v4 (2026-09-11):**
- **backend-engineer on v3:** two correctness bugs found and fixed in v4 —
  (a) `in_grace_period` had no time bound of its own: grace's bound is
  `renewalInfo.gracePeriodExpiresDate` (renewal payload), NOT
  `transactionInfo.expiresDate` which has already passed when grace begins;
  v4 adds the `grace_period_expires_at` column and makes the time-aware rule
  status-conditional, with `expired|revoked` never re-opened by skew (§4.1,
  §4.2); (b) same-group UPGRADE may mint a new `original_transaction_id`,
  colliding with `UNIQUE(payer_id, environment)` on blind insert — v4
  mandates supersession-safe upserts and adds the OTID question to the
  FV-571 Apple-doc list (§4.1, §4.2c). Also applied: the watermark safety
  claim re-scoped (time-awareness neutralizes missed notifications, not
  comparison bugs; named watermark-misordering test AC), the §4.4↔§4.9
  always-persist reconciliation sentence (Production-billing-truth scope),
  centralized-accessor mandate + hard test gate, allowlist lifecycle
  (removals + audits), external-TestFlight-tester policy callout, and the
  legacy-native metrics note. Backend's verdict on v3 ("not yet sound to
  hand to FV-570/571 as-is") is answered by these v4 fixes.
- **kids-privacy-officer on v3: VERDICT: CHANGES_REQUESTED** — three items,
  all applied in v4: (HIGH) the sandbox-tester allowlist defined as a
  user-data table with RLS + FV-507 grants + its own harness assertion,
  service-role-only, no payer/athlete SELECT (§4.9); (MEDIUM) support-relink
  verification artifact never persisted beyond the ticket, KC-gated
  pre-scale, method + SLA in FV-573 (§4.7); (LOW) explicit statement that
  the historical token is opaque and unlinkable post-cascade — Rule 9
  satisfied (§4.7). Items 2–4 of its review (deletion design, legacy-native
  classification, v2-commitment carry-through in the §7 remap) were
  confirmed clean.
- Final confirmation passes on v4: backend "SOUND TO HAND TO FV-570/571";
  privacy design-stage VERDICT: APPROVED (both on the draft PR).

**Offering approval → v5 (KC, recorded by Codex on FV-210/570/572/573):**
P1/P3/P5 resolved as recorded in §4.5/§4.6; §6 table updated (P2/P4 remain
open but non-blocking for code prep; P7 = KC ack of the two pre-ship
definitions; P8 = GTM copy). FV-570 implementation authorized to proceed
scoped, on its own branch, under the standing release hold.

## 10. Issue-split recommendation + outstanding decisions (for Codex)

- **Recommend a dedicated web trial-policy issue** (Codex to cut/assign —
  not filed from here): Stripe checkout trial 14→7 days, one-athlete trial
  semantics, trial-to-family immediate conversion + pre-confirmation charge
  disclosure on the web add-athlete flow, `/subscribe` copy, and
  coordination of the GTM "14 days free" copy change (P8). This is
  web-checkout + marketing-surface work that fits none of FV-570
  (provider access data/resolver), FV-571 (Apple verification), or FV-572
  (iOS UI) cleanly — implementing it inside any of them would broaden an
  untracked diff. FV-570 implements only the cross-provider
  trial-HISTORY mechanics (4.5).
- **Outstanding decisions:** P2 (ASC product ids/price points — config,
  release-held), P4 (SBP status — economics only), P7 (KC ack of the
  no-selection contract and the trial-conversion disclosure contract —
  gates the seat-designation schema and conversion-UI slices), P8 (GTM
  copy via the Delvox engine).
- **Genuinely unresolved product choices flagged per KC's ask:** (i) the
  post-renewal selection window's exact UX cadence (how loudly/when the
  dashboard re-prompts during selection-required) — cosmetic latitude
  inside the decided fail-closed contract, FV-572 can propose; (ii) whether
  a scheduled-downgrade cancellation (parent re-upgrades before renewal)
  clears recorded selections — recommend yes (selections are per-downgrade,
  not durable preferences); encode at FV-570 seat-schema time under P7.
