# FV-210 — iOS In-App Purchase architecture: decision record + spec

**Status:** DRAFT v2 for KC + Codex. Design/spec only — no implementation of
unresolved offering choices. Prepared under a hard release hold (no merge, no
native sync/build, no App Store config, no production mutation).
v2 integrates three specialist design reviews (backend-engineer,
frontend-engineer, kids-privacy-officer — outcomes in Section 9).

**Supersedes:** the reader-style / NO-IAP posture for **iOS only** (KC approval
2026-09-11, after Apple rejected iOS 1.0 (3) under Guideline 3.1.1). The
Android/Play track keeps its reader-style posture and its shipped compliance
machinery (FV-478 / FV-489 / FV-492 / FV-493) unchanged — **byte-identical, by
construction** (Section 4.8). Repo docs that still state "NO IAP" globally
(e.g. `docs/handoff-2026-08-28-app-store-launch.md`, comments in
`apps/native/capacitor.config.ts`) describe the Android posture and the
pre-2026-09-11 iOS posture; they must not be read as overruling this record.

**Contract source:** Codex updated Linear FV-210 to the superseding
purchase/account-access contract. **This record was written without direct
access to that Linear text** (Linear connector unavailable in the authoring
session) and is built from KC's directive summary. Reconcile against FV-210's
live text before cutting downstream contracts — discrepancies resolve in favor
of the Linear contract.

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
   structurally cannot get a row here; `stripe_subscription_id`, `price_id`,
   `status` CHECK-constrained to Stripe vocabulary, `cancel_at_period_end`,
   `current_period_end`, `last_stripe_event_at`). Written only by the Stripe
   webhook (`app/api/webhooks/stripe/route.ts`) via idempotent upserts with an
   **out-of-order watermark**: incoming `event.created` is compared against
   `last_stripe_event_at` and stale events are dropped (route.ts:296-308,
   migration `20260610120000_subscriptions_event_watermark.sql`).
3. **Quantity/capacity** — Stripe uses per-seat quantity with graduated
   pricing (first athlete $5/mo|$49/yr, additional $3/mo|$29/yr).
   `lib/stripe/sync-athlete-quantity.ts` re-syncs quantity after athlete
   add/remove. **There is NO capacity ceiling or access-level gate on the
   add-athlete flow today** (`lib/actions/athletes.ts`,
   `app/dashboard/athletes/new/page.tsx` — `requireParent()` only; even a
   blocked payer can add athletes). Section 4.6's gate is net-new code.
4. **Trial** — 14-day trial is code-applied at Stripe checkout, once per
   account: trial-eligible ⇔ no `subscriptions` row has ever existed for the
   payer. A read error **aborts checkout** (fail-closed, PR #185 finding —
   `lib/actions/subscription.ts:161-198`).
5. **Deletion** — `deleteAccount()` cancels Stripe server-side FIRST (the
   ordering exists because a third-party cancel API call can fail; abort
   happens before any DB mutation), then `auth.admin.deleteUser` cascades all
   rows (`lib/actions/account.ts`).
6. **Enforcement** — per-page `requireActiveAccess()` guards
   (`lib/subscriptions/enforce.ts`), flag-gated by
   `ENFORCE_SUBSCRIPTION_GATING`; blocked minors → `/athlete/paused`, blocked
   payers → `/subscribe`. `requireSubscriber()` accepts only
   `parent | adult_athlete` — no purchase surface is reachable from a minor
   session on any platform (`lib/auth/guards.ts:105-129`).
7. **Shell gating** — server-side `isNativeShell()` reads the UA token
   `FVNativeShell/1` via substring match (`lib/native-shell.ts:36-40`; the
   guard test proves tolerance of trailing tokens). The token is one flat
   value for both platforms today (`apps/native/capacitor.config.ts:52`,
   top-level `appendUserAgent`). Purchase-surface call sites are enumerated
   in Section 4.8.
8. **Webhook routing** — the middleware matcher already excludes the whole
   `api/webhooks/*` namespace (`middleware.ts:98`), so a future
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

Thin maintained wrapper, **no backend service** (validation stays ours), no
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
NEW dependency: route through product-strategist per the Definition of Done
when contract 3 is cut (privacy review recorded no objection).

## 4. Decision 2 — server verification & provider ownership (all options)

### 4.1 Provider-separated entitlement state

- New table **`apple_subscriptions`** — a pure Apple mirror, sibling of the
  Stripe mirror. PK `payer_id` (same payer semantics: parent or
  adult_athlete). Columns:
  - `original_transaction_id` — the Apple subscription key;
    **UNIQUE on (`original_transaction_id`, `environment`)** so Sandbox rows
    (TestFlight/App Review testers legitimately purchase against the prod
    backend) can never collide with or block cleanup of Production rows;
  - `product_id`;
  - `status` — **Apple-native vocabulary**, NOT Stripe's `SubscriptionStatus`:
    `subscribed | in_grace_period | in_billing_retry | expired | revoked`
    (fresh CHECK constraint; the Stripe enum encodes Stripe dunning policy
    and must not be reused);
  - `expires_at`, `auto_renew_status`, `environment` (`Sandbox|Production`),
    `app_account_token` (persisted — durable audit trail for support
    investigations, like `last_stripe_event_at` / `account_deletion_events`),
    `last_notification_at` (**monotonic watermark**, see 4.2), timestamps.
  - RLS: payer-own SELECT, service-role-only writes — mirroring the Stripe
    mirror's shape, BUT the migration must use the **FV-507 grant pattern**
    (explicit REVOKE + minimal re-grant), not the pre-FV-507 legacy grants:
    newer hosted Supabase images ship implicit `GRANT ALL` that undermines
    the old no-grant/no-policy denial model. An RLS-harness assertion file
    (`19_apple_subscriptions.sql`, following `03_subscriptions.sql`:
    real INSERT/UPDATE as authenticated → `insufficient_privilege`;
    cross-payer and **athlete-role 0-rows** checks) is a named acceptance
    criterion, not reviewer discretion. (RLS Harness CI is non-required —
    review it manually on the PR per standing gotcha.)
- **`app_account_token` is a dedicated opaque per-payer purchase UUID**
  (minted once per payer at first purchase attempt, stored 1:1), **never the
  literal `profiles.id`** — Apple guidance wants an opaque value, and the
  Supabase Auth subject UUID must not become a durable key in Apple's
  records. (Stripe metadata already carries `parent_id`; Apple's token is a
  formal, API-returned key — a wider blast radius, hence the dedicated UUID.)
- **Pure mappers:** a new `appleSubscriptionAccessLevel()` maps Apple-native
  status directly to the SHARED output enum `AccessLevel`
  (`full | degraded | blocked`). Policy:
  - `subscribed` → `full`
  - `in_grace_period` → **`full`** — Apple's billing grace period retains
    full entitlement by Apple's own contract with the user; mapping it to
    Stripe-style `degraded` would violate that and invite review flags.
  - `in_billing_retry` (grace disabled/exhausted, retry ongoing) → `degraded`
  - `expired | revoked` → `blocked`
- **Resolver change** (`lib/subscriptions/access.ts`): resolution order
  `access_grants` → Stripe mirror → Apple mirror; return the **best** level
  across providers (full > degraded > blocked). `subscriptionAccessLevel()`
  is reused unchanged; the enum-only athlete privacy boundary is preserved —
  contract 2 must include (a) a unit test asserting the athlete path never
  touches `apple_subscriptions` columns and (b) the harness athlete-0-rows
  assertion above.
- A payer's entitlement provider (`stripe | apple | comp | none`) is
  derivable, not stored.

### 4.2 Verification paths (defense in depth, mirroring the Stripe pattern)

1. **Purchase-time:** client submits the signed transaction JWS to a new
   server action / route; server verifies signature + certificate chain with
   `@apple/app-store-server-library` (`SignedDataVerifier`), checks the
   `appAccountToken` maps to the calling payer's stored purchase UUID, bundle
   id `com.fromvictoryapp.app`, and environment, then upserts the Apple
   mirror. The client is NEVER trusted for entitlement state.
2. **Steady-state:** **App Store Server Notifications V2** endpoint
   (`app/api/webhooks/apple/route.ts`), sibling of the Stripe webhook:
   verify `signedPayload` JWS; switch on `notificationType`/`subtype`
   (SUBSCRIBED, DID_RENEW, DID_FAIL_TO_RENEW(±GRACE_PERIOD), EXPIRED,
   GRACE_PERIOD_EXPIRED, DID_CHANGE_RENEWAL_STATUS, REFUND, REVOKE,
   UPGRADE/DOWNGRADE); idempotent upsert. Explicit disciplines (named, not
   "same as Stripe"):
   - **Watermark:** compare the payload's `signedDate` against
     `last_notification_at`; drop stale/out-of-order deliveries (the analog
     of `last_stripe_event_at` — prevents a delayed `DID_RENEW` resurrecting
     an `EXPIRED` row).
   - **First-seen transactions CREATE the row.** Apple has no
     `checkout.session.completed`-lands-first guarantee: a notification can
     legitimately arrive before the client's purchase submission (app killed
     post-purchase, `Transaction.updates` on next cold launch). The route
     decodes `appAccountToken` from `signedTransactionInfo`, resolves the
     payer via the stored purchase UUID, and creates the mirror row when
     none exists. A paid subscription must never be droppable by ordering.
   - **Three visible branches, like Stripe's route:** processed (200) /
     benign-no-match — e.g. a post-deletion renewal whose token maps to no
     payer (warn + 200) / processing failure (500, Apple retries).
   - **JWS verification failure:** 400, no processing, never log the raw
     payload.
   - **Apple's redelivery contract differs from Stripe's:** bounded retry
     window, then Apple stops until you pull `Get Notification History`.
     Contract 3 ships a short runbook note for endpoint-outage recovery.
3. **Reconciliation:** on-demand App Store Server API
   `Get All Subscription Statuses` for drift repair, callable from an admin
   path; not a cron in MVP.

### 4.3 Restore & cross-account conflicts

- **Restore purchases** (required by Apple): `AppStore.sync()` client-side,
  then submit current entitlement JWS. Server links by
  (`original_transaction_id`, `environment`).
- **Conflict rule:** a transaction already linked to a DIFFERENT FV payer
  blocks the link ("This Apple subscription is already linked to another
  From Victory account — sign in to that account or contact support").
  Support-mediated relink only; the UNIQUE constraint enforces it. Rejecting
  restore outright is never acceptable — it would harm a paying user and
  fail App Review's restore requirement.
- A restore on an account with an active Stripe subscription **links** (an
  existing Apple billing reality is always recorded) and surfaces the
  duplicate-billing warning (4.4).

### 4.4 Duplicate-billing guard

- iOS purchase UI is HIDDEN behind a server-computed flag: a payer already
  `full` via Stripe or comp sees management/status copy, never a buy button.
  (Server decides; client renders.)
- Purchase-time conflict handling: **the verified Apple transaction is ALWAYS
  persisted** — recording billing truth is unconditional, exactly like the
  Stripe webhook's unconditional upserts. Only the response differs: on an
  active-Stripe conflict the user gets the double-billing warning and
  cancel-one-side instructions. (Never "reject without persisting": a user
  who then cancels Stripe would hold zero recorded entitlement while Apple
  keeps billing them — strictly worse than the double-bill.) The resolver's
  best-of fold makes the persisted row safe by design.
- The raced-conflict path fires an internal alert
  (`deliverInBackground(notifyError(...))` — the codebase's standard
  anomalous-state channel) so support learns of a double-bill proactively.
- The web `/subscribe` page mirrors the guard: an Apple-entitled payer sees
  "you're subscribed through the App Store — manage it on your iPhone"
  instead of Stripe checkout.
- No cross-provider server-side cancel exists (Apple forbids it); the
  guard's job is to make double-billing unreachable in UI and loud when
  raced.

### 4.5 Trial eligibility

- Stripe's one-trial-ever rule gains one input: a payer who has ever held an
  Apple entitlement is NOT Stripe-trial-eligible (extend the "no row has
  ever existed" check to both mirrors). **The Apple-mirror read inherits the
  exact PR-#185 fail-closed contract: a read error aborts checkout with a
  user-facing error** — it must not fall through to trial-eligible on the
  Stripe read alone.
- Apple-side intro-offer eligibility is decided by Apple per Apple ID; the
  iOS paywall shows trial copy ONLY from StoreKit eligibility APIs
  (`isEligibleForIntroOffer`), never hardcoded. Whether FV products carry an
  intro offer at all is PENDING (P3).

### 4.6 Capacity (athlete count)

- Stripe: per-seat quantity + `syncAthleteQuantity` — unchanged, no ceiling.
- Apple: no quantity on auto-renewables → **tier products in one
  subscription group**. Ceilings and product ids are PENDING (P1/P2); the
  architecture is ceiling-agnostic: a single test-pinned
  `productCapacity(product_id) → maxAthletes` map is the only place ceilings
  live.
- **The athlete-add capacity gate is NET-NEW code, not an extension** — no
  gate of any kind exists today (Section 2.3), and today even a blocked
  payer can add athletes. Contract 6 must decide placement (proactive on
  `athletes/new` vs. inside `createAthlete()` BEFORE the auth-user creation
  at athletes.ts:74, to avoid extending the existing create→rollback dance)
  — and MUST NOT silently absorb the separate product decision of whether to
  gate the currently-ungated blocked-Stripe-payer case (**P6**).
- Apple-tier ceiling reached: iOS shows an upgrade prompt (StoreKit
  upgrade within the group, Apple-prorated); web/Android shows "manage your
  plan on your iPhone" (accurate by construction — only Apple-provider
  payers have Apple ceilings, and they purchased on an iPhone).
- Downgrade below current athlete count: allowed by Apple at next renewal;
  on entitlement shrink the add flow blocks further adds; existing athletes
  are never auto-removed or individually locked — account-level access
  follows the entitlement level as today (confirm against FV-210 text, P5).
- **Family Sharing is OFF** on all FV products (`familyShareable = false` in
  App Store Connect — config-time, release-held): Apple Family Sharing
  shares the PURCHASE across an Apple family; FV capacity is athlete seats
  inside one FV account. Conflating them grants multi-household access for
  one seat price.

### 4.7 Account deletion

- Apple subscriptions cannot be canceled server-side, so — unlike Stripe —
  there is **no new sequencing logic**: the existing
  `auth.admin.deleteUser(payerId)` cascade deletes the `apple_subscriptions`
  row exactly as it deletes the Stripe mirror row today (FK → `profiles`,
  ON DELETE CASCADE). Clearing (not tombstoning) the row is deliberate: it
  frees the transaction link so a restore on a NEW account can legitimately
  relink a still-active Apple subscription.
- The genuinely new work is **copy**: deletion UI + confirmation email
  instruct "Your App Store subscription is managed by Apple — cancel it in
  Settings → Apple ID → Subscriptions" with deep link
  `https://apps.apple.com/account/subscriptions`.
- Log-retention note: `original_transaction_id` will appear in structured
  webhook/action logs and outlive the row — same accepted shape as
  `stripe_subscription_id` in `account.ts` logs today (event metadata,
  never content). Documenting the log-retention posture is a shared,
  non-blocking follow-up.

### 4.8 iOS-only UI, Android preserved by construction

- **Platform signal — asymmetric, Android untouched (frontend review's
  mechanism, adopted):** add
  `ios: { appendUserAgent: "FVNativeShell/1 (ios)" }` to
  `capacitor.config.ts`. Capacitor's per-platform key overrides the global
  one (supported since Capacitor 1.4; present in the pinned CLI's type
  declarations). **Android's token is NOT touched** — the top-level
  `appendUserAgent: "FVNativeShell/1"` stays byte-identical (optionally
  mirrored verbatim into `android.appendUserAgent` for self-documentation).
  `getShellPlatform()`: UA contains `"(ios)"` → `"ios"`; else contains the
  base token → `"android"`; else `null`. Because fielded Android binaries
  bake the UA at build time, the server must treat the bare token as Android
  forever — leaving Android's token unchanged makes the regression surface
  vanish by construction instead of by test vigilance, and requires no Play
  coordination.
- **FV-483 guard-test update is part of the same change:** the current test
  asserts `appendUserAgent` appears exactly ONCE — a second (ios) key breaks
  it, and the wrong "fix" under CI pressure is collapsing back to one shared
  token. Contract 1 rewrites the guard to structural assertions: token(s)
  only at top level or under `ios`/`android` (never inside `server`), the
  Android value pinned to today's literal string, and no `stripe.com` in
  `allowNavigation`.
- **Complete purchase-surface inventory** (from source; contract 5's
  checklist):
  - `app/subscribe/page.tsx` (price copy + purchase panel branches)
  - `app/dashboard/page.tsx` (subscribe CTA card)
  - `app/dashboard/settings/page.tsx` (BillingPortalButton swap +
    no-subscription CTA)
  - `app/athlete/settings/page.tsx` (adult-only subscription section)
  - `app/athlete/paused/page.tsx` (adult-only reactivate link)
  - `lib/actions/billing-portal.ts` (server-side refusal)
  - `lib/actions/auth-adult.ts:174-177` — **post-signup redirect**: today
    in-shell adults skip `/subscribe` (it was a dead end). On iOS with IAP,
    `/subscribe` is live again — this redirect needs the platform split or a
    fresh iOS adult lands on `/athlete` with no purchase prompt.
  - NOT to be split (platform-blind by design): the sign-out /
    delete-account redirects in `lib/actions/auth.ts` and
    `lib/actions/account.ts` (marketing-root avoidance, not purchase
    surfaces). State this triage in the contract so the split is neither
    over- nor under-applied.
  - **Open design question (contract 5):** `app/subscribe/success/page.tsx`
    is shaped around a Stripe redirect return; a StoreKit purchase does not
    round-trip a return URL. Decide: adapt the page or give iOS its own
    confirmation state.
- iOS paywall requirements: product/price strings ONLY from StoreKit
  localized prices (never hardcoded — App Review requirement); restore
  button; manage via `showManageSubscriptions`; **Terms of Use / EULA +
  Privacy Policy links are NET-NEW UI on this page** (today those links
  exist only on dashboard settings) — ties into FV-497 (EULA), which now
  also gates contract 5.
- Defense-in-depth: add `Vary: User-Agent` on routes that render
  platform-conditional content (they are cookie-dynamic today, so no live
  hazard, but the FV-489 lesson says don't rely on "happens to be dynamic").
- **Guards (test-pinned in contract 5):**
  - Role gate: the iOS paywall renders only inside
    `requireSubscriber`-gated surfaces; regression test asserts an
    `athlete`-role + iOS-platform request NEVER renders purchase UI.
  - Android bit-identity: all FV-492/493 suites pass unchanged with the bare
    Android token.
  - Price-leak guard: a CI check in the FV-483 style asserting no hardcoded
    `$`-price strings are reachable under `getShellPlatform() === "ios"`
    (all six current price literals live in the web-only branches; the
    boolean→three-way refactor is where a leak would slip in).
- Web + Android surfaces: unchanged Stripe/browser-notice behavior.
- No steering: the iOS app must not link out to web purchase
  (StoreKit-external-link entitlements are explicitly out of scope).

## 5. Sequencing & dependencies

1. **Contract 1 (platform signal) has NO dependency on PR #458.** Its
   server-side half (`getShellPlatform()` + tests) is deployable
   immediately and — being a pure re-classification of an already-fielded
   UA — is compatible with the release hold. Its native half (the
   `capacitor.config.ts` ios key) can MERGE any time, but takes effect on
   the wire only after a native sync/build — which is release-held; note
   this explicitly so nobody assumes the merged PR changed fielded UAs.
2. **PR #458 (Capacitor 8 / API 36):** not a blocker for Option A's design;
   implementation of the bridge (contract 4) should land after #458 to avoid
   double native churn. (If Option C were ever chosen, #458 becomes a hard
   prerequisite.)
3. **Offering decisions (Section 6)** gate App Store Connect product
   creation, paywall copy, capacity-map values, intro-offer copy. Everything
   else — tables, webhook, resolver, bridge interface, guards — proceeds
   independently, with placeholder product ids in tests only.
4. **App Store Server API credentials** (issuer id, key id, .p8) and
   Notifications V2 URL registration are App Store Connect config —
   **release-held**; server code ships env-var-shaped and dormant.
5. `ENFORCE_SUBSCRIPTION_GATING` and adult-signup flags: untouched.

## 6. Pending decisions (owned by KC/Codex — DO NOT implement)

| # | Decision | Owner | Blocking |
|---|---|---|---|
| P1 | Athlete tier ceilings (1–3 vs 1–5) and number of tiers | KC ↔ Codex interview (in flight) | Product creation, capacity map, paywall copy |
| P2 | Apple product ids + price points (incl. annual) | KC/Codex after P1 | App Store Connect config |
| P3 | Intro offer on Apple products (match Stripe's 14-day?) | KC | Paywall trial copy |
| P4 | Small Business Program enrollment status (15% vs 30%) | KC | Pricing economics only |
| P5 | Downgrade-below-count product rule confirmation (4.6) | FV-210 contract | Athlete-add UX copy |
| P6 | Gate the currently-ungated blocked-payer athlete-add path? (4.6/2.3) | KC | Contract 6 scope |

## 7. Proposed downstream implementation contracts (for Codex to cut)

Each one PR-sized; suggested order. Acceptance criteria named here are the
review-mandated ones — contracts must carry them verbatim.

1. **Shell platform signal** — `ios.appendUserAgent` override (Android
   top-level token byte-identical), `getShellPlatform()`, FV-483 guard-test
   rewrite (structural assertions + Android literal pin), Android
   bit-identity regression tests. No #458 dependency; wire-effect note per
   Section 5.1.
2. **Apple mirror + resolver** — `apple_subscriptions` migration with
   Apple-native status vocabulary + (`original_transaction_id`,
   `environment`) uniqueness + persisted `app_account_token` + **FV-507
   grant pattern (explicit REVOKE + minimal re-grant)**; dedicated opaque
   per-payer purchase UUID (never `profiles.id`);
   `appleSubscriptionAccessLevel()` (grace → full); resolver best-of fold;
   cross-provider trial rule with PR-#185 abort-on-read-error semantics;
   **RLS harness file `19_apple_subscriptions.sql` incl. athlete-0-rows**;
   unit test pinning the athlete path away from Apple columns. (Backend;
   privacy review required.)
3. **Verification server** — `@apple/app-store-server-library` dep
   (**product-strategist approval per DoD**), purchase-submission action
   (always-persist + conflict warning + `notifyError` alerting),
   Notifications V2 route (signedDate watermark; first-seen row creation via
   token→payer resolution; three-branch 200/200-warn/500 discipline; JWS
   failure = 400 with no raw-payload logging; Apple-redelivery runbook
   note), reconciliation helper. Dormant until URL registration
   (release-held). (Backend.)
4. **StoreKit 2 bridge plugin** — Swift plugin + TS interface in
   `apps/native`, no UI. (After #458 merges, ideally.)
5. **iOS paywall + management UI** — platform-split of the full surface
   inventory in 4.8 **including the `auth-adult.ts` post-signup redirect**;
   `/subscribe/success` decision; StoreKit-priced paywall; restore flow;
   duplicate-billing guard UI both directions; net-new Terms/EULA + Privacy
   footer (FV-497 gates); role-gate + Android-bit-identity + price-leak
   guards; `Vary: User-Agent` defense; **updates to
   `docs/fv211-app-store-privacy-pack.md` ("no StoreKit IAP" line) and
   `apps/web/app/privacy/page.tsx` (name Apple as iOS payment processor)**.
   (Frontend; needs P1–P3.)
6. **Capacity enforcement** — `productCapacity` map + net-new athlete-add
   gate (placement decision per 4.6) + upgrade prompts. (Needs P1/P5/P6.)
7. **Deletion path copy** — Apple-aware deletion UI + confirmation-email
   copy; confirm cascade covers the mirror row (no new sequencing code).
   (Backend + privacy.)

## 8. Blockers & risks (current, concrete)

- **B1:** FV-210 live Linear text unverified by this record's author
  (connector unavailable) — reconcile before contracts are cut.
- **B2:** P1–P3 pending — blocks contracts 5–6 and all App Store Connect
  config.
- **B3:** App Store Connect agreements/tax/banking must be Active for paid
  apps before any IAP testing — verify (config surface, release-held).
- **B4:** FV-497 (EULA) gates iOS submission AND contract 5's paywall
  links.
- **B5:** Sandbox/TestFlight IAP testing requires native builds + App Store
  Connect product config — both release-held; plan a KC-authorized testing
  window.
- **B6:** The FV-507 grant-pattern fix is not yet on `main`; contract 2's
  migration must adopt whichever pattern lands from FV-507 — sequencing
  dependency between FV-507 and contract 2.
- **R1:** Stripe-web + Apple-iOS coexistence is App-Review-sensitive: no
  in-app steering to web purchase; the Android-style "buy on the web"
  notice MUST NOT render on iOS once IAP ships.

## 9. Specialist review outcomes (design-stage, 2026-09-11)

- **backend-engineer — SUGGEST_REVISION → integrated.** Must-fixes adopted:
  grace-period → full (4.1); Apple-native status vocabulary (4.1);
  always-persist on purchase-time conflict (4.4); signedDate watermark
  (4.2); first-seen row creation + three-branch webhook discipline (4.2).
  Should-fixes adopted: (transaction, environment) uniqueness, persisted
  token column, PR-#185 trial fail-closed wording, `notifyError` alerting,
  deletion simplification (cascade, copy-only), Apple redelivery runbook +
  JWS-failure discipline. Confirmed Section 2 accurate line-by-line.
- **frontend-engineer — must-fixes integrated.** Asymmetric per-platform UA
  override adopted wholesale (4.8) — Android byte-identical by construction;
  FV-483 guard rewrite named in contract 1; `auth-adult.ts` redirect added
  to the surface inventory; `/subscribe/success` flagged as an open design
  question; capacity gate re-scoped as net-new (P6 raised); contract-1/#458
  independence and merge-vs-wire-effect distinction documented; net-new
  EULA/privacy footer; `Vary: User-Agent` and price-leak guards added.
- **kids-privacy-officer — VERDICT: CHANGES_REQUESTED on draft v1; all
  group-1 items integrated in v2:** FV-507 grant hardening + named RLS
  harness file (4.1, contract 2); opaque purchase UUID replacing
  `profiles.id` as `app_account_token` (4.1); fv211 pack + `/privacy` page
  updates scheduled (contract 5); role-gate regression test (4.8, contract
  5). Group-2 adopted: Section 3 reworded off the minor-specific
  non-negotiable; `@apple/app-store-server-library` routed through
  product-strategist (contract 3); log-retention posture noted (4.7).
  **Design-stage re-verdict on v2 (2026-09-11): APPROVED** — all five
  group-1 and three group-2 items confirmed present and correctly
  specified; new backend mechanics (native vocabulary, grace→full,
  always-persist, first-seen creation) introduce no new privacy concern;
  athlete enum-only boundary intact. (Design-stage verdict only — each
  implementation contract's PR still gets its own kids-privacy-officer
  review per the standing gate.)
