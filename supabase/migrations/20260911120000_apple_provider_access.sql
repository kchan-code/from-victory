-- =============================================================================
-- Migration: 20260911120000_apple_provider_access.sql
--
-- Purpose: FV-570 (foundation slice) — Apple provider entitlement state, per
--   the KC/Codex-approved decision record
--   `docs/fv210-ios-iap-decision-record.md` (Sections 4.1, 4.2, 4.5, 4.6, 4.9).
--   This is schema ONLY. No webhook, no verification, no purchase submission
--   route, no client UI. Everything here is dormant until FV-571/572 wire it —
--   this migration is safe to apply under the standing release hold because it
--   creates no reachable purchase surface.
--
-- Tables:
--   1. apple_subscriptions   — pure Apple mirror, sibling of the Stripe mirror
--                              (`subscriptions`). One row per (payer,
--                              environment) — Sandbox/Production coexistence
--                              is a hard requirement, not a convenience
--                              (record §4.1, §4.9).
--   2. apple_purchase_tokens — the opaque per-payer `app_account_token` a
--                              payer's client submits to StoreKit at purchase
--                              time. Never the literal profiles.id (record
--                              §4.1).
--   3. apple_sandbox_testers — KC-gated allowlist. Sandbox rows only grant
--                              entitlement for a payer on this list (App
--                              Review / internal QA) — the security control
--                              that stops a freely-obtainable Sandbox JWS from
--                              escalating to Production access (record §4.9,
--                              risk R2).
--
-- Structure:
--   - Section 1: apple_subscriptions table + comments + trigger
--   - Section 2: apple_purchase_tokens table + comments
--   - Section 3: apple_sandbox_testers table + comments
--   - Section 4: ENABLE RLS on all three
--   - Section 5: POLICIES (apple_subscriptions: payer-own SELECT only; the
--     other two: NO policies — service-role only)
--   - Section 6: GRANT layer, FV-507 pattern (explicit REVOKE ALL, then
--     minimal re-GRANT) — see `20260909000000_subscriptions_client_write_revoke.sql`
--     for the precedent this mirrors.
--
-- Privacy model (kids-privacy-officer review pending on the FV-570 PR):
--   - `apple_subscriptions`: payer may read their OWN row only
--     (payer_id = auth.uid()). No write policies — all writes are
--     service-role (the future FV-571 purchase-submission action + webhook).
--     Mirrors the Stripe `subscriptions` table's shape exactly.
--   - `apple_purchase_tokens`: NO client policies at all. A payer must never
--     be able to read their own `app_account_token` client-side — it is an
--     internal binding artifact, not user-facing data. Enforcement lives at
--     the service-role-only layer (record §4.1).
--   - `apple_sandbox_testers`: NO client policies at all. A payer must not be
--     able to probe their own QA-allowlist membership (record §4.9 — reviewed
--     with the same rigor as `apple_subscriptions`). Additions AND removals
--     to this table are KC-gated ops (FV-573's runbook); this migration does
--     not seed any rows.
--   - No journal content, no PII beyond what already exists on `profiles`, is
--     introduced by this migration. `original_transaction_id` and
--     `app_account_token` are opaque provider/binding identifiers, not
--     personal data (record §4.7's "audit-clarity" note, satisfied
--     structurally: both columns cascade-delete with the payer's `profiles`
--     row).
--   - Cascading delete: all three tables FK to `profiles(id) on delete
--     cascade`. Deleting a payer's account (auth.admin.deleteUser cascade)
--     removes their Apple mirror row, purchase-token row, and allowlist
--     membership automatically — no new sequencing code (record §4.7).
--
-- Postgres version: 15+
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. apple_subscriptions
--    Surrogate PK (record §4.1 v3): a bare payer_id PK cannot host the
--    required Sandbox/Production coexistence — a QA payer legitimately holds
--    one row per environment. Keying is UNIQUE (payer_id, environment) +
--    UNIQUE (original_transaction_id, environment); environment isolation is
--    a security-critical hard requirement (§4.9), not a convenience.
--
--    Written exclusively by future service-role code (FV-571 purchase
--    submission action + Notifications V2 webhook) — no client write path.
-- ---------------------------------------------------------------------------

create table public.apple_subscriptions (
  id                       uuid        primary key default gen_random_uuid(),

  -- The payer this Apple subscription belongs to — a parent or an
  -- adult_athlete (18+ self-serve), same payer concept as the Stripe mirror's
  -- `subscriptions.parent_id`. Cascades on account deletion (record §4.7).
  payer_id                 uuid        not null
                                       references public.profiles(id)
                                       on delete cascade,

  -- Sandbox JWS payloads are freely obtainable (sandbox purchases cost
  -- nothing) — environment is a first-class column, never inferred, so the
  -- resolver can enforce the Production-only default (record §4.9, risk R2).
  environment              text        not null
                                       check (environment in ('Sandbox', 'Production')),

  -- Apple's transaction identifier for the original purchase. NOT the sole
  -- key: a same-subscription-group tier UPGRADE may mint a NEW
  -- original_transaction_id (record §4.1/§4.2c) — future upsert logic must
  -- locate the existing (payer_id, environment) row and update this column
  -- in place rather than blind-INSERT by transaction id.
  original_transaction_id  text        not null,

  -- The Apple product/price identifier the payer is on (tier 1-5, record
  -- §4.6). Values are App Store Connect config (Open Item P2) — no CHECK
  -- constraint here; the capacity map in
  -- apps/web/lib/subscriptions/apple-capacity.ts is the single place ceiling
  -- values live, and starts empty pending P2.
  product_id               text        not null,

  -- Apple-native status vocabulary — deliberately NOT the Stripe
  -- `SubscriptionStatus` enum, which encodes Stripe's own dunning policy and
  -- must not be reused for a different provider's lifecycle model (record
  -- §4.1). Access-level mapping lives in
  -- apps/web/lib/subscriptions/apple-access-level.ts.
  status                   text        not null
                                       check (status in (
                                         'subscribed',
                                         'in_grace_period',
                                         'in_billing_retry',
                                         'expired',
                                         'revoked'
                                       )),

  -- Sourced from transactionInfo.expiresDate. Load-bearing for time-aware
  -- access (record §4.2): access is time-aware, never
  -- notification-dependent — a missed Apple notification can never extend
  -- access past this bound (plus a small configured skew allowance).
  expires_at               timestamptz not null,

  -- Populated on transition to `in_grace_period`, sourced from
  -- renewalInfo.gracePeriodExpiresDate — which lives on the RENEWAL payload,
  -- NOT the transaction payload. This is deliberately a SEPARATE column from
  -- expires_at: by definition expires_at has already passed once grace
  -- begins, so gating grace on expires_at would wrongly demote a legitimate
  -- grace-period user immediately (record §4.2, the v3→v4 correction).
  -- Nullable: null except while status = 'in_grace_period'.
  grace_period_expires_at  timestamptz,

  -- Sourced from renewalInfo.autoRenewStatus. Informational for now — not
  -- consulted by the access-level mapper in this slice.
  auto_renew_status        boolean     not null default true,

  -- The opaque per-payer purchase UUID this row's `app_account_token`
  -- referenced at purchase/renewal time — persisted here as a durable audit
  -- trail of which token minted this subscription. This is NOT the same
  -- column as `apple_purchase_tokens.token` (that table is the current
  -- per-payer minted value; this column is the historical value actually
  -- observed on the JWS payload, which may lag it after a support-mediated
  -- relink — record §4.7). Never the literal profiles.id.
  app_account_token        uuid        not null,

  -- signedDate off the most recently applied JWS payload. Explicitly a
  -- PAYLOAD-STALENESS WATERMARK, NOT a business-event ordering key: Apple
  -- does not guarantee notification delivery order, so upserts apply the
  -- payload's absolute state snapshot guarded by this watermark to drop
  -- older payloads. It must never be read as "when did this business event
  -- happen" (record §4.2).
  last_signed_date         timestamptz not null,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- Sandbox/Production coexistence: a QA payer legitimately holds one row
  -- per environment (record §4.1, §4.9 — a hard requirement).
  constraint apple_subscriptions_payer_environment_unique
    unique (payer_id, environment),

  -- Apple's own transaction identity, scoped per environment (a sandbox and
  -- a production transaction id are never comparable across environments).
  constraint apple_subscriptions_otid_environment_unique
    unique (original_transaction_id, environment)
);

comment on table public.apple_subscriptions is
  'Pure Apple mirror of App Store subscription entitlement state, sibling of '
  'the Stripe mirror (public.subscriptions). Written exclusively by future '
  'service-role code (FV-571 purchase-submission action + App Store Server '
  'Notifications V2 webhook) — no client write path exists. '
  'Keying: UNIQUE (payer_id, environment) + UNIQUE (original_transaction_id, '
  'environment) — a bare payer_id PK cannot host Sandbox/Production '
  'coexistence, which a QA payer legitimately needs. '
  'See docs/fv210-ios-iap-decision-record.md Sections 4.1, 4.2, 4.9.';

comment on column public.apple_subscriptions.payer_id is
  'The parent or adult_athlete who purchased this subscription. Cascades on '
  'account deletion (FV-210 record §4.7 — no new sequencing code needed, '
  'Apple has no server-side cancel to order around).';

comment on column public.apple_subscriptions.environment is
  'Sandbox | Production. Sandbox JWS payloads are freely obtainable at no '
  'cost, so production entitlement reads are environment-scoped to '
  'Production rows UNLESS the payer is on the apple_sandbox_testers '
  'allowlist (FV-210 record §4.9, risk R2). This is a security-critical '
  'column — never collapse it or infer it from another field.';

comment on column public.apple_subscriptions.original_transaction_id is
  'Apple''s identifier for the original transaction. A same-group tier '
  'UPGRADE may mint a NEW original_transaction_id (FV-571 Apple-doc '
  'verification item, FV-210 record §4.1/§4.2c) — upsert logic must be '
  'supersession-safe: locate the existing (payer_id, environment) row and '
  'update this column in place, never blind-INSERT by transaction id.';

comment on column public.apple_subscriptions.product_id is
  'Apple product/price identifier (App Store Connect config, Open Item P2). '
  'Athlete-tier capacity ceilings (1-5, FV-210 record §4.6) are looked up '
  'via apps/web/lib/subscriptions/apple-capacity.ts, not a DB constraint — '
  'the map starts empty pending P2 so this column accepts any value here.';

comment on column public.apple_subscriptions.status is
  'Apple-native lifecycle vocabulary: subscribed | in_grace_period | '
  'in_billing_retry | expired | revoked. Deliberately NOT the Stripe '
  '`subscriptions.status` vocabulary, which encodes Stripe''s own dunning '
  'policy and must not be reused for a different provider (FV-210 record '
  'Section 4.1). Mapped to the shared AccessLevel enum by the pure '
  'appleSubscriptionAccessLevel() function — see '
  'apps/web/lib/subscriptions/apple-access-level.ts.';

comment on column public.apple_subscriptions.expires_at is
  'Sourced from transactionInfo.expiresDate. Load-bearing for time-aware '
  'access (FV-210 record Section 4.2): access is time-aware, never '
  'notification-dependent — full while now <= expires_at, degraded within a '
  'configured skew window past it, blocked beyond. A missed Apple '
  'notification can never extend access past this bound.';

comment on column public.apple_subscriptions.grace_period_expires_at is
  'Populated on transition to in_grace_period, sourced from '
  'renewalInfo.gracePeriodExpiresDate (the RENEWAL payload, NOT the '
  'transaction payload). This bound is deliberately separate from '
  'expires_at: by definition expires_at has already passed once grace '
  'begins, so gating grace on expires_at would wrongly demote a legitimate '
  'grace-period user immediately (FV-210 record Section 4.2, the v3->v4 '
  'correction). Null except while status = ''in_grace_period''.';

comment on column public.apple_subscriptions.auto_renew_status is
  'Sourced from renewalInfo.autoRenewStatus. Informational audit trail in '
  'this foundation slice — not consulted by the access-level mapper.';

comment on column public.apple_subscriptions.app_account_token is
  'The opaque per-payer purchase UUID observed on the most recently applied '
  'JWS payload for this row — durable audit trail, never the literal '
  'profiles.id (FV-210 record Section 4.1). Immutable on Apple''s side for '
  'the life of the original transaction; see apple_purchase_tokens for the '
  'CURRENT per-payer minted value, which is the source of truth going '
  'forward after a support-mediated relink (record Section 4.7).';

comment on column public.apple_subscriptions.last_signed_date is
  'signedDate off the most recently applied JWS payload. Explicitly a '
  'PAYLOAD-STALENESS WATERMARK, NOT a business-event ordering key — Apple '
  'does not guarantee notification delivery order. Future upsert code drops '
  'any payload whose signedDate is not newer than this column''s current '
  'value; it must never be read as "when the business event happened" '
  '(FV-210 record Section 4.2).';

-- updated_at trigger (reuses the shared set_updated_at() from the baseline
-- migration).
create trigger apple_subscriptions_set_updated_at
  before update on public.apple_subscriptions
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 2. apple_purchase_tokens
--    The opaque per-payer app_account_token a payer's client submits to
--    StoreKit at purchase time — minted once per payer at first purchase
--    attempt, stored 1:1. Never the literal profiles.id (record §4.1).
--    A payer must NEVER see this value client-side — see RLS below.
-- ---------------------------------------------------------------------------

create table public.apple_purchase_tokens (
  payer_id    uuid        primary key
                          references public.profiles(id)
                          on delete cascade,

  token       uuid        not null unique default gen_random_uuid(),

  created_at  timestamptz not null default now()
);

comment on table public.apple_purchase_tokens is
  'Opaque per-payer app_account_token, minted once at first purchase attempt '
  'and passed to StoreKit 2''s purchase(productId, appAccountToken) call '
  '(FV-571). The payer''s Supabase id (profiles.id) must NEVER be sent to '
  'Apple directly — this table is the indirection layer. Service-role only: '
  'no client SELECT/INSERT/UPDATE/DELETE policy exists. A payer must not be '
  'able to read their own purchase token client-side (FV-210 record Section 4.1).';

comment on column public.apple_purchase_tokens.token is
  'The opaque UUID submitted to Apple as appAccountToken. Immutable on '
  'Apple''s side for the life of an original transaction once used (record '
  'Section 4.1/4.7) — a binding hint, not a durable bidirectional key. The '
  'durable key for linking is (original_transaction_id, environment) on '
  'apple_subscriptions.';


-- ---------------------------------------------------------------------------
-- 3. apple_sandbox_testers
--    KC-gated allowlist (record §4.9). Membership lets Sandbox-environment
--    rows on apple_subscriptions grant entitlement — this is what makes
--    TestFlight / App Review IAP flows work against the production backend
--    (expected members: internal QA payers and the App Review account).
--    Additions AND removals are KC-gated ops (FV-573's runbook); this
--    migration seeds no rows.
-- ---------------------------------------------------------------------------

create table public.apple_sandbox_testers (
  payer_id   uuid        primary key
                         references public.profiles(id)
                         on delete cascade,

  -- Human-readable context (e.g. "App Review account", "KC's iPhone QA").
  -- Admin-only; never surfaced to the payer.
  note       text,

  added_at   timestamptz not null default now()
);

comment on table public.apple_sandbox_testers is
  'KC-gated allowlist (FV-210 record Section 4.9): membership lets '
  'Sandbox-environment apple_subscriptions rows grant entitlement (App '
  'Review / internal QA against the production backend). Additions AND '
  'removals are KC-gated operational actions (FV-573''s runbook), not a '
  'self-service surface. This is itself a user-data structure and gets the '
  'same RLS rigor as apple_subscriptions: service-role-only reads AND '
  'writes — no payer or athlete SELECT, so a payer cannot probe their own '
  'QA-membership status (record Section 4.9, privacy re-review finding).';

comment on column public.apple_sandbox_testers.note is
  'Human-readable context for why this payer is allowlisted. Admin-only; '
  'never surfaced to the payer or any client-facing UI.';


-- ===========================================================================
-- 4. ROW LEVEL SECURITY — enable on all three tables
-- ===========================================================================

alter table public.apple_subscriptions  enable row level security;
alter table public.apple_purchase_tokens enable row level security;
alter table public.apple_sandbox_testers enable row level security;


-- ===========================================================================
-- 5. POLICIES
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 5a. apple_subscriptions — ONE policy: payer-own SELECT. No write policies.
--     Mirrors the Stripe `subscriptions` table's shape exactly: all writes
--     are service-role only (the future purchase-submission action + the
--     Notifications V2 webhook, FV-571) — no client should ever be able to
--     manually set their own Apple subscription status.
-- ---------------------------------------------------------------------------

create policy "apple_subscriptions_select_own_payer"
  on public.apple_subscriptions
  for select
  using (payer_id = auth.uid());

-- No INSERT / UPDATE / DELETE policies for clients — intentional, not an
-- oversight (see table comment).


-- ---------------------------------------------------------------------------
-- 5b. apple_purchase_tokens — NO policies at all.
--     Service-role-only: a payer must not be able to read their own purchase
--     token client-side (it is an internal binding artifact, not user-facing
--     data — FV-210 record Section 4.1). RLS with zero policies means every
--     client-role query returns 0 rows (the correct RLS-mediated rejection).
-- ---------------------------------------------------------------------------

-- (No CREATE POLICY statements for this table by design.)


-- ---------------------------------------------------------------------------
-- 5c. apple_sandbox_testers — NO policies at all.
--     Service-role-only reads AND writes — no payer or athlete SELECT. A
--     payer must not be able to probe their own QA-allowlist membership
--     (FV-210 record Section 4.9, privacy re-review finding, HIGH item
--     resolved in v4 of the decision record).
-- ---------------------------------------------------------------------------

-- (No CREATE POLICY statements for this table by design.)


-- ===========================================================================
-- 6. GRANT LAYER — FV-507 pattern, exactly
--
--    PostgreSQL privileges are purely additive (there is no "deny" ACL
--    entry, only the presence or absence of a grant). A hosted Supabase
--    project's cluster-initialization default privileges
--    (`alter default privileges in schema public grant all on tables to
--    postgres, anon, authenticated, service_role`, per the FV-507 root-cause
--    writeup) mean a freshly CREATE TABLE'd object can inherit
--    anon=arwdDxt / authenticated=arwdDxt at creation time — regardless of
--    what any RLS policy above says the intended access model is. An
--    explicit REVOKE-then-GRANT is the only way to pin the privilege set
--    regardless of what a given stack's default-privilege inheritance
--    handed the table at CREATE TABLE time. See
--    `20260909000000_subscriptions_client_write_revoke.sql` (FV-507) for the
--    precedent this migration mirrors.
--
--    service_role is unaffected by any REVOKE below: none of the REVOKE
--    statements name service_role, and
--    `20260613040000_service_role_grants.sql`'s
--    `alter default privileges in schema public grant all on tables to
--    service_role` already covers every table created afterward, including
--    these three — no explicit service_role grant is needed here.
--
--    apple_subscriptions gets a re-grant (SELECT to authenticated) because
--    it has a client-readable RLS policy (5a). apple_purchase_tokens and
--    apple_sandbox_testers get NO re-grant at all — service-role is the only
--    intended reader or writer of either table (5b, 5c), so the grant layer
--    should deny client roles just as completely as the RLS layer does.
-- ===========================================================================

revoke all privileges on table public.apple_subscriptions  from public, anon, authenticated;
revoke all privileges on table public.apple_purchase_tokens from public, anon, authenticated;
revoke all privileges on table public.apple_sandbox_testers from public, anon, authenticated;

grant select on table public.apple_subscriptions to authenticated;
-- No grant-back for apple_purchase_tokens or apple_sandbox_testers — the
-- absence of a grant IS the intended control for both tables.
