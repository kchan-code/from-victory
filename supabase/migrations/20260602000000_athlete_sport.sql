-- =============================================================================
-- Migration: 20260602000000_athlete_sport.sql
--
-- Purpose (FV-27):
--   Add a `sport` column to public.profiles so that athlete accounts record
--   which sport they train. The content schema already uses sport as a
--   first-class dimension (training_sessions_catalog.sport, unique on
--   (day_number, sport)); this migration brings the athlete profile into
--   alignment.
--
-- Column design:
--   - Type: text — matches training_sessions_catalog.sport (text not null
--     default 'hockey'), keeping the type vocabulary identical and trivially
--     joinable.
--   - Allowed values (CHECK): 'hockey', 'basketball'. Tennis is v2 — the
--     CHECK is a simple IN() list so adding 'tennis' later is a one-liner
--     ALTER. NOT using a Postgres enum: enums require ALTER TYPE to extend,
--     which can't run in a transaction alongside DDL in some hosting configs.
--   - Role-consistency constraint (mirrors birthdate_role_consistency):
--     athlete rows => sport NOT NULL and in set.
--     parent rows  => sport IS NULL (parents are not athletes; storing a
--     sport on a parent row has no semantic value and would violate
--     data-minimisation).
--   - Column is updatable (no trigger preventing UPDATE) so a future edit-
--     sport action (FV-33) can do a plain UPDATE via service role. The
--     existing profiles_update_own RLS policy already allows athletes to
--     update their own row.
--
-- Existing-row hazard:
--   There are already athlete rows in prod with no sport value. Adding a NOT
--   NULL column directly with the role-consistency check would fail. Safe
--   ordering:
--     1. Add column as nullable (no default, so it's clear about intent).
--     2. Backfill existing athlete rows to 'hockey' (the only launched sport
--        so far; any athlete row created before this migration is a hockey
--        athlete by definition).
--     3. Add the value-check constraint (sport_valid_values) — now all rows
--        in the allowed set.
--     4. Add the role-consistency check (sport_role_consistency) — now all
--        athlete rows have a non-null in-set value, all parent rows are null.
--   All four steps run in one transaction so they either all commit or all
--   roll back — the table is never in a half-migrated state.
--
-- RLS impact:
--   None. sport rides the existing profiles RLS policies without change:
--     - "profiles_select_own": athlete reads own row (includes sport). No
--       change needed.
--     - "profiles_parent_select_linked_athlete": parent reads linked
--       athlete's full profile row (includes sport). This is intentional —
--       a parent dashboard may display which sport their athlete trains.
--       sport is low-sensitivity operational data, not PII.
--     - "profiles_insert_own": parent self-inserts their own profile (sport
--       will be NULL; CHECK enforces this).
--     - "profiles_update_own": athlete may update own row (including sport
--       for a future edit-sport flow).
--   No new policies are required. No journal-content exposure is created or
--   widened by this migration.
--
-- Cascading delete: unchanged. profiles cascades from auth.users; sport is
--   just a column on that same row.
--
-- Postgres version: 15+
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Step 1: Add the column as nullable — allows the backfill step to run
--         against existing rows before the NOT NULL constraints land.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column sport text;

comment on column public.profiles.sport is
  'The sport the athlete trains for. Required for athlete rows; NULL for '
  'parent rows (data-minimisation — sport is not a meaningful attribute '
  'on a parent account). Constrained to the launched set (hockey, basketball) '
  'by sport_valid_values check; extensible by adding values to that CHECK. '
  'FV-27 introduced this column; FV-33 will add the edit-sport UI.';

-- ---------------------------------------------------------------------------
-- Step 2: Backfill existing athlete rows.
--         Any athlete created before this migration was a hockey athlete —
--         hockey was the only launched sport through the time of this commit.
--         Parent rows are left NULL (correct per the role-consistency rule).
-- ---------------------------------------------------------------------------

update public.profiles
   set sport = 'hockey'
 where role = 'athlete'
   and sport is null;

-- ---------------------------------------------------------------------------
-- Step 3: Add the value-check constraint.
--         All athlete rows now have 'hockey'; parent rows are NULL.
--         NULL is allowed here — the role-consistency check (step 4) will
--         enforce "athlete => not null" without duplicating the NULL
--         exclusion in this constraint.
--         Extensibility note: to add tennis in v2, ALTER TABLE profiles
--         DROP CONSTRAINT sport_valid_values and re-add with the new IN list.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add constraint sport_valid_values
    check (
      sport is null
      or sport in ('hockey', 'basketball')
    );

-- ---------------------------------------------------------------------------
-- Step 4: Add the role-consistency constraint.
--         Mirrors birthdate_role_consistency from the baseline migration.
--         Semantics:
--           athlete rows => sport is not null AND in the valid set
--                           (sport_valid_values already enforces the set;
--                            this constraint enforces not-null for athletes)
--           parent rows  => sport is null
-- ---------------------------------------------------------------------------

alter table public.profiles
  add constraint sport_role_consistency
    check (
      (role = 'athlete' and sport is not null)
      or
      (role = 'parent'  and sport is null)
    );

commit;
