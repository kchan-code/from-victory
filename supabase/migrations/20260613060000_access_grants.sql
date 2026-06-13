-- =============================================================================
-- Migration: 20260613060000_access_grants.sql
--
-- Purpose: FV-69 — comp/free access grants.
--   Adds the `access_grants` table so KC can comp accounts without touching
--   the subscriptions table (which is a pure Stripe mirror).
--
--   Entitlement logic:
--     active comp grant → full access (overrides subscription status)
--     expired or revoked grant → falls back to underlying subscription status
--
-- Structure:
--   - Section 1: access_grants table + index + trigger
--   - Section 2: ENABLE RLS
--   - Section 3: POLICIES (parent SELECT own; no client INSERT/UPDATE/DELETE)
--
-- Privacy model (reviewed by kids-privacy-officer):
--   - A parent may read their own grant row (reason text is benign "comp" copy).
--   - Athletes cannot read grant rows at all. The parent RLS policy is keyed to
--     parent_id = auth.uid(); athletes never match.
--   - Anon has no access (no anon grant here — selects require authenticated).
--   - All writes are service-role only (no client INSERT / UPDATE / DELETE
--     policies), mirroring the subscriptions table pattern.
--   - granted_by references profiles(id) on delete set null so deleting the
--     admin account does not cascade-delete grants.
--   - parent_id → profiles(id) on delete cascade: deleting the parent account
--     removes their grants automatically (satisfies the cascading-delete rule).
--
-- Postgres version: 15+
-- set_updated_at() trigger function exists from the baseline migration.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. access_grants
--    One row = one grant for a parent. Multiple active grants are allowed
--    (re-granting inserts a fresh row; revoke sets revoked_at on all active
--    rows). The reader checks for ANY active row.
-- ---------------------------------------------------------------------------

create table public.access_grants (
  id           uuid        primary key default gen_random_uuid(),

  -- The parent this grant covers. Cascades on account deletion.
  parent_id    uuid        not null
                           references public.profiles(id)
                           on delete cascade,

  -- Who issued the grant (the admin parent at the time). If that admin's
  -- account is later deleted, we null this out rather than cascade-deleting
  -- the grant itself (grants should outlive the admin who issued them).
  granted_by   uuid        references public.profiles(id)
                           on delete set null,

  -- Human-readable context for the grant (e.g. "beta tester", "team coach").
  -- Never exposed to athletes; admin-only surface.
  reason       text,

  -- Null = perpetual grant. Non-null = grant expires at this timestamp.
  expires_at   timestamptz,

  -- Null = active. Non-null = revoked at this timestamp.
  revoked_at   timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.access_grants is
  'Comp / free-access grants for parent accounts. '
  'An active grant (revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())) '
  'grants full access regardless of Stripe subscription status. '
  'Written exclusively by admin server actions via service role. '
  'Parents may read their own grant row; athletes and anon cannot.';

comment on column public.access_grants.parent_id is
  'Parent account that receives the grant. Cascades on account deletion.';

comment on column public.access_grants.granted_by is
  'Admin profile that issued the grant. Set null if admin account is deleted.';

comment on column public.access_grants.reason is
  'Human-readable note (e.g. "beta tester"). Admin-only; never surfaced to athletes.';

comment on column public.access_grants.expires_at is
  'Grant expiry. NULL = perpetual. Evaluated in DB time (not app time).';

comment on column public.access_grants.revoked_at is
  'Set to now() when the grant is revoked. NULL = active.';

-- Index: fast lookup of a parent's active grants (the common read path).
create index access_grants_parent_id_active_idx
  on public.access_grants (parent_id)
  where revoked_at is null;

-- updated_at trigger (reuses the shared set_updated_at() from the baseline migration)
create trigger access_grants_set_updated_at
  before update on public.access_grants
  for each row execute function public.set_updated_at();


-- ===========================================================================
-- 2. ROW LEVEL SECURITY
-- ===========================================================================

alter table public.access_grants enable row level security;


-- ===========================================================================
-- 3. POLICIES
-- ===========================================================================

-- Parents may read their own grant rows only. This is their own data
-- (entitlement status) and carries no third-party PII. No athlete policy
-- exists here — athletes derive access level from a service-role-mediated
-- enum path that never exposes this table to them.
create policy "access_grants_select_own_parent"
  on public.access_grants
  for select
  using (parent_id = auth.uid());

-- No INSERT / UPDATE / DELETE policies for clients.
-- All writes are via admin server actions using service role (service role
-- bypasses RLS entirely). This mirrors the subscriptions table's write model:
-- no client should ever be able to grant themselves access.
