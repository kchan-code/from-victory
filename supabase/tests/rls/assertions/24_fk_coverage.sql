-- =============================================================================
-- FK-coverage assertion for private.is_unestablished (FV-671, SSO A1;
-- spec §13a "Shared surfaces", invariant 1 "Identity never moves an entitlement")
--
-- private.is_unestablished(uid) decides whether an account may be deleted by the
-- onboarding-cancel / reaper / under-18 paths. If a NEW table that stores
-- account-established data (a billing mirror, a purchase binding, a grant, ...)
-- references auth.users or public.profiles and the predicate is not updated,
-- those paths could delete a paying account's user. This file makes that
-- impossible to forget: it enumerates EVERY foreign key that references
-- auth.users or public.profiles (from pg_constraint) and fails unless the
-- referencing table is
--
--   (1) covered by private.is_unestablished — i.e. the table's schema-qualified
--       name appears in the function source (so a Play Billing PR that adds
--       google_subscriptions / google_purchase_bindings MUST add them to the
--       predicate or this file goes red), or
--   (2) on the explicit ALLOWLIST below, each entry with its reason.
--
-- Tables owned by the Supabase platform (auth, storage, realtime, vault, ...)
-- are out of scope: deleting the auth user cascades them by design.
--
-- ALLOWLIST POLICY: add a table here ONLY if a row in it can never be the first
-- sign that an account is established AND cannot exist without a profile row
-- (profiles are created before any of this data). Everything that records
-- payment, entitlement, comp access, or an athlete relationship belongs in the
-- predicate instead.
-- =============================================================================

create function pg_temp.fk_uncovered()
returns text[]
language plpgsql
as $$
declare
  predicate_src text := pg_get_functiondef('private.is_unestablished(uuid)'::regprocedure);
  -- relation -> reason
  allow jsonb := jsonb_build_object(
    'public.profiles',
      'the profile row itself: the predicate checks it directly (FK profiles.id -> auth.users)',
    'private.pending_account_deletions',
      'the tombstone this predicate guards (FK -> auth.users, cascades on delete)',
    'public.athlete_sessions',
      'athlete training data; created only after the profile exists, never a payer/entitlement marker',
    'public.journal_entries',
      'athlete-private journal (dormant, FV-135); requires a profile, never a payer/entitlement marker',
    'public.safety_events',
      'event-only safety log; requires a profile, never a payer/entitlement marker',
    'public.activity_events',
      'athlete activity metadata; requires a profile, never a payer/entitlement marker',
    'public.push_subscriptions',
      'athlete web-push endpoints; requires a profile, never a payer/entitlement marker',
    'public.device_pairings',
      'athlete device pairing; requires a profile on both ends, never a payer/entitlement marker',
    'public.pregame_selection_contributors',
      'FV-749 once-per-month counting marker (athlete_id, period_start only); requires a profile, never a payer/entitlement marker'
  );
  -- schemas owned by the Supabase platform
  platform_schemas text[] := array[
    'auth', 'storage', 'realtime', 'vault', 'extensions', 'graphql', 'graphql_public',
    'pgsodium', 'pgsodium_masks', 'supabase_functions', 'supabase_migrations',
    'net', 'cron', '_realtime', '_analytics', 'pg_catalog', 'information_schema'
  ];
  rec record;
  rel text;
  uncovered text[] := '{}';
  checked int := 0;
begin
  for rec in
    select distinct n.nspname || '.' || c.relname as rel
      from pg_constraint k
      join pg_class     c on c.oid = k.conrelid
      join pg_namespace n on n.oid = c.relnamespace
     where k.contype = 'f'
       and k.confrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
       and n.nspname <> all (platform_schemas)
     order by 1
  loop
    checked := checked + 1;
    rel := rec.rel;
    if predicate_src ~ ('\m' || replace(rel, '.', '\.') || '\M') then
      continue;   -- (1) covered by the predicate
    end if;
    if allow ? rel then
      continue;   -- (2) explicitly allowlisted
    end if;
    uncovered := uncovered || rel;
  end loop;

  assert checked > 0, 'FV-671 FAIL: found no foreign keys to auth.users/profiles — the enumeration is broken';

  -- Stale-allowlist hygiene (notice only: a dropped table must not break unrelated PRs).
  for rel in select jsonb_object_keys(allow)
  loop
    if to_regclass(rel) is null then
      raise notice '[diag] 24_fk_coverage: allowlisted table % no longer exists — remove it from the allowlist', rel;
    end if;
  end loop;

  return uncovered;
end $$;

do $$
declare
  uncovered text[] := pg_temp.fk_uncovered();
  predicate_src text := pg_get_functiondef('private.is_unestablished(uuid)'::regprocedure);
begin
  assert cardinality(uncovered) = 0,
    format('FV-671 FK-COVERAGE FAIL: %s references auth.users or public.profiles but is neither covered '
           'by private.is_unestablished nor on the allowlist in 24_fk_coverage.sql. Decide: if it records '
           'payment/entitlement/comp/athlete data, add it to the predicate (new migration, CREATE OR '
           'REPLACE) so cancel/reaper/under-18 can never delete an account that has it; otherwise add it '
           'to the allowlist with a reason.', uncovered);

  -- The predicate itself must name the data sources it is documented to cover.
  assert predicate_src ~ '\mpublic\.subscriptions\M'
     and predicate_src ~ '\mpublic\.apple_subscriptions\M'
     and predicate_src ~ '\mpublic\.apple_purchase_tokens\M'
     and predicate_src ~ '\mpublic\.google_subscriptions\M'
     and predicate_src ~ '\mpublic\.google_purchase_bindings\M'
     and predicate_src ~ '\mpublic\.google_license_testers\M'
     and predicate_src ~ '\mpublic\.access_grants\M'
     and predicate_src ~ '\mpublic\.parent_athlete_links\M'
     and predicate_src ~ '\mpublic\.profiles\M',
    'FV-671 FAIL: private.is_unestablished no longer lists the spec §5.1 baseline data sources (incl. the FV-660 Google Play tables)';
end $$;

-- Negative control (runs every time): a brand-new table referencing
-- public.profiles (and one referencing auth.users) that is in neither list MUST
-- be reported by the very same check. Rolled back.
begin;
  create table public.fv671_fk_probe (
    id uuid primary key default gen_random_uuid(),
    payer_id uuid not null references public.profiles(id) on delete cascade
  );
  create table public.fv671_fk_probe_auth (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade
  );
  do $$
  declare
    flagged text[] := pg_temp.fk_uncovered();
  begin
    assert flagged @> array['public.fv671_fk_probe', 'public.fv671_fk_probe_auth'],
      format('FV-671 FAIL: the FK-coverage check did not flag new tables (got %s)', flagged);
  end $$;
rollback;

\echo '  [PASS] 24_fk_coverage (FV-671: every FK to auth.users/profiles is covered by is_unestablished or allowlisted)'
