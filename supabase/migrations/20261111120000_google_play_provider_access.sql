-- =============================================================================
-- Migration: 20261111120000_google_play_provider_access.sql
--
-- Purpose: FV-660 (Play Billing C2) — Google Play entitlement state, per
--   `docs/fv651-android-play-billing-decision-record.md` Sections 7.1, 7.2,
--   7.4 and 10.2. Schema ONLY: no verification, no webhook, no client code
--   reads these tables yet. Purely additive — no existing table, policy or
--   grant is changed.
--
-- Tables:
--   1. google_subscriptions     — pure Google mirror (sibling of `subscriptions`
--                                 for Stripe and `apple_subscriptions`).
--   2. google_purchase_bindings — one opaque random UUID per payer, passed to
--                                 Play as obfuscatedAccountId. Service-role only.
--   3. google_license_testers   — allowlist of payers whose license-tester
--                                 purchases may grant access. Service-role only,
--                                 empty by default (this migration seeds nothing).
--
-- Privacy model (kids-privacy-officer reviews this migration):
--   - No table stores a name, an email, an athlete id or payment details.
--     purchase_token / obfuscated_account_id / binding_id are opaque provider
--     or binding identifiers, never personal data. Purchase tokens and
--     obfuscated ids must never be logged (record 7.1).
--   - All three tables FK to profiles(id) ON DELETE CASCADE, so
--     auth.admin.deleteUser removes tokens, binding and allowlist membership
--     with the payer. Tokens are not retained for refund/dispute handling.
--   - google_purchase_bindings.binding_id is gen_random_uuid(): not derived from
--     profiles.id and independent of apple_purchase_tokens (never copied from it).
--
-- Payer-own reads — WHY COLUMN-LEVEL GRANTS (deliberate departure from Apple):
--   apple_subscriptions uses a payer-own row policy on top of a TABLE-level
--   SELECT grant, so a payer can read every column of their own row. That is
--   not sufficient here: record 7.1 lets the client read only product_id,
--   base_plan_id, status, expires_at and auto_renewing, and never
--   purchase_token, linked_purchase_token, obfuscated_account_id or
--   is_test_purchase. A row policy filters ROWS, not columns, so we use BOTH
--   layers: (1) column-level GRANT SELECT (...) for exactly those five
--   columns to `authenticated`, (2) the payer-own row policy. A view would
--   also work but would add a second object to keep in the grant matrix; the
--   column grant fails closed (42501) on any other column, including
--   `select *`, and on columns added in future migrations unless granted.
--   Consequence: client code must name its columns explicitly (no select('*')).
--   The row policy's payer_id = auth.uid() qualifier needs no column privilege
--   on payer_id; clients cannot filter on payer_id either — the policy already
--   scopes rows to the caller.
--
-- Postgres version: 15+
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. google_subscriptions
-- ---------------------------------------------------------------------------

create table public.google_subscriptions (
  id                     uuid        primary key default gen_random_uuid(),

  -- The payer (parent or adult_athlete). Cascades on account deletion.
  payer_id               uuid        not null
                                     references public.profiles(id)
                                     on delete cascade,

  -- Google's purchase token. Bearer-style identifier: never client readable,
  -- never logged. Globally unique: one Play purchase = one row.
  purchase_token         text        not null,

  product_id             text        not null,
  base_plan_id           text        not null,

  -- Google's own vocabulary (purchases.subscriptionsv2 SubscriptionState),
  -- stored lowercase with the SUBSCRIPTION_STATE_ prefix dropped. Mapping:
  --   SUBSCRIPTION_STATE_PENDING                   -> pending
  --   SUBSCRIPTION_STATE_ACTIVE                    -> active
  --   SUBSCRIPTION_STATE_PAUSED                    -> paused
  --   SUBSCRIPTION_STATE_IN_GRACE_PERIOD           -> in_grace_period
  --   SUBSCRIPTION_STATE_ON_HOLD                   -> on_hold
  --   SUBSCRIPTION_STATE_CANCELED                  -> canceled
  --   SUBSCRIPTION_STATE_EXPIRED                   -> expired
  --   SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED -> pending_purchase_canceled
  -- Deliberately NOT shared with Apple or Stripe vocabularies (record 7.1);
  -- the access-level mapping is application code, not this table's concern.
  status                 text        not null
                                     check (status in (
                                       'pending',
                                       'active',
                                       'paused',
                                       'in_grace_period',
                                       'on_hold',
                                       'canceled',
                                       'expired',
                                       'pending_purchase_canceled'
                                     )),

  -- Nullable on purpose: Google reports no expiry for a purchase that is
  -- still pending payment. A NULL expiry never grants access; the
  -- access-level mapping in application code must fail closed on it.
  expires_at             timestamptz,
  auto_renewing          boolean     not null default true,

  -- Google marks license-tester purchases. Access from a test purchase is
  -- granted only to payers on google_license_testers (record 7.4). Never
  -- client readable.
  is_test_purchase       boolean     not null default false,

  -- The obfuscatedExternalAccountId Google returned (what the purchase was
  -- actually bound to). Compared server-side with the payer's binding_id.
  -- Nullable: purchases started outside the app may arrive without it
  -- (record 7.2 known gap). Never client readable, never logged.
  obfuscated_account_id  text,

  -- Google's linkedPurchaseToken: the token this purchase replaced
  -- (upgrade/downgrade/resubscribe). Never client readable.
  linked_purchase_token  text,

  acknowledged           boolean     not null default false,

  -- The offer actually used (introductory/trial offer), if any.
  offer_id               text,

  last_verified_at       timestamptz not null,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint google_subscriptions_purchase_token_unique
    unique (purchase_token)
);

-- Uniqueness decision: apple_subscriptions is UNIQUE (payer_id, environment)
-- because an Apple upgrade updates the existing row in place. Under Google a
-- token REPLACEMENT (upgrade/downgrade/resubscribe) mints a new purchase token
-- that points back via linked_purchase_token, so a payer legitimately holds
-- more than one row over time (old token expired/replaced, new one active).
-- A UNIQUE (payer_id) or (payer_id, product_id) constraint would break that.
-- The only hard uniqueness is purchase_token itself; the non-unique payer
-- index below supports the payer lookup. Which row is current is resolved by
-- application code via the linked-token chain and status/expiry.
create index google_subscriptions_payer_id_idx
  on public.google_subscriptions (payer_id);

comment on table public.google_subscriptions is
  'Pure Google Play mirror of subscription entitlement (FV-660; record 7.1). '
  'Service-role writes only. A payer may have several rows over time because '
  'token replacement links to the previous token (linked_purchase_token); '
  'therefore only purchase_token is unique. Clients read five columns of '
  'their own rows via column-level grant + row policy; everything else is '
  'service-role only.';

comment on column public.google_subscriptions.purchase_token is
  'Google purchase token. Never client readable, never logged or alerted.';
comment on column public.google_subscriptions.status is
  'Google-native subscriptionsv2 state, lowercased, SUBSCRIPTION_STATE_ prefix '
  'dropped (pending, active, paused, in_grace_period, on_hold, canceled, '
  'expired, pending_purchase_canceled). Not shared with Apple or Stripe.';
comment on column public.google_subscriptions.is_test_purchase is
  'Google license-tester flag. Grants access only for payers on '
  'google_license_testers (record 7.4). Never client readable.';
comment on column public.google_subscriptions.obfuscated_account_id is
  'obfuscatedExternalAccountId as returned by Google. Compared to the '
  'payer''s google_purchase_bindings.binding_id. Never client readable or logged.';
comment on column public.google_subscriptions.linked_purchase_token is
  'linkedPurchaseToken: the previous token this purchase replaced. Never client readable.';

create trigger google_subscriptions_set_updated_at
  before update on public.google_subscriptions
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 2. google_purchase_bindings — one opaque random UUID per payer.
-- ---------------------------------------------------------------------------

create table public.google_purchase_bindings (
  payer_id    uuid        primary key
                          references public.profiles(id)
                          on delete cascade,

  -- Random v4 UUID, passed to Play as obfuscatedAccountId. Not derived from
  -- profiles.id; separate from apple_purchase_tokens.token (never copied).
  binding_id  uuid        not null unique default gen_random_uuid(),

  created_at  timestamptz not null default now()
);

comment on table public.google_purchase_bindings is
  'Opaque per-payer Play obfuscatedAccountId (FV-660; record 7.2). Service-role '
  'only: no client policy and no client grant. binding_id is random, not '
  'derived from profiles.id, and independent of apple_purchase_tokens.';


-- ---------------------------------------------------------------------------
-- 3. google_license_testers — allowlist, empty by default.
-- ---------------------------------------------------------------------------

create table public.google_license_testers (
  payer_id    uuid        primary key
                          references public.profiles(id)
                          on delete cascade,

  -- Admin-only context (e.g. "Play reviewer account"). Never surfaced.
  -- Must not contain a name, an email or an athlete identifier; the length
  -- bound keeps it to a short label.
  note        text
              check (note is null or char_length(note) <= 120),

  created_at  timestamptz not null default now()
);

comment on table public.google_license_testers is
  'Allowlist of payers whose Google license-tester purchases may grant access '
  'on the production backend (FV-660; record 7.4). Service-role only so a '
  'payer cannot probe their own membership. Empty by default; review and '
  'clear QA/reviewer entries after use (FV-597-style runbook discipline).';


-- ===========================================================================
-- RLS — enabled on all three
-- ===========================================================================

alter table public.google_subscriptions     enable row level security;
alter table public.google_purchase_bindings enable row level security;
alter table public.google_license_testers   enable row level security;


-- ===========================================================================
-- POLICIES
-- ===========================================================================

-- google_subscriptions: payer-own SELECT only (row scope; column scope is the
-- GRANT below). No write policies — all writes are service-role.
create policy "google_subscriptions_select_own_payer"
  on public.google_subscriptions
  for select
  using (payer_id = auth.uid());

-- google_purchase_bindings / google_license_testers: NO policies, by design.


-- ===========================================================================
-- GRANT LAYER — FV-507 / FV-568 pattern
--
-- The hosted image (and the pin migration's default privileges) can hand a new
-- public table SELECT/ALL to anon/authenticated at CREATE time, so revoke
-- explicitly and re-grant the minimum. service_role is untouched (it receives
-- ALL via the 20260613040000 default privileges).
-- ===========================================================================

revoke all privileges on table public.google_subscriptions     from public, anon, authenticated;
revoke all privileges on table public.google_purchase_bindings from public, anon, authenticated;
revoke all privileges on table public.google_license_testers   from public, anon, authenticated;

-- Column-level SELECT: exactly the five record-7.1 columns, authenticated only.
-- anon gets nothing. No INSERT/UPDATE/DELETE for any client role.
grant select (product_id, base_plan_id, status, expires_at, auto_renewing)
  on table public.google_subscriptions to authenticated;

-- No grant-back for bindings or testers: absence of a grant is the control.
