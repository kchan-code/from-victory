-- =============================================================================
-- Migration: 20260812010000_lacrosse_db_enablement.sql  (FV-407)
--
-- Purpose (lacrosse go-live, KC founder sign-off 2026-08-11):
--   1. sport_valid_values += 'lacrosse' — lacrosse becomes a storable athlete
--      sport (the app-side SUPPORTED_SPORTS flip ships alongside/after this;
--      DB widens first so a deployed selector can never outrun the CHECK).
--   2. profiles_position_values is restated with lacrosse's net-new position
--      tokens added under a new "-- Lacrosse (going live)" comment.
--
--      Verified against the registry before writing this migration:
--      LACROSSE_CONFIG.roles in apps/web/components/pregame/sport-registry.ts
--      is exactly ["Attack", "Midfield", "Defense", "FOGO", "Goalie"] (FV-404
--      §1, the scope-minimal position-true set).
--
--      Of those five tokens, 'Defense' and 'Goalie' are ALREADY present in
--      profiles_position_values — but as HOCKEY's tokens (see the "-- Hockey"
--      line, last restated by 20260719130000_football_db_enablement.sql).
--      These are shared strings across the two sports, not lacrosse-specific
--      grants; noted explicitly here so a future reader doesn't mistake their
--      presence for prior lacrosse enablement. Only 'Attack', 'Midfield', and
--      'FOGO' are net-new additions to the constraint's value list.
--
--      No stored-long-name mismatch is possible here (the football gotcha
--      from 20260613100000 / 20260719130000, where dormant long display
--      names were stored and had to be swapped for short ratified tokens at
--      go-live, does not apply to lacrosse): grepped supabase/migrations/**
--      for "lacrosse" before writing this migration and found zero prior
--      hits anywhere in the migration history. No lacrosse position token —
--      long name or short — was ever added to profiles_position_values or
--      storable on any profiles row (sport itself was never in
--      sport_valid_values, and profiles_position_values never listed any
--      lacrosse-only token). This is lacrosse's first appearance in the
--      constraint.
--
-- Safety / risk:
--   Additive only. sport_valid_values gains one new allowed value; every
--   existing row's sport is already a member of the widened set, so
--   Postgres re-validates ADD CONSTRAINT with zero risk of orphaning a row.
--   profiles_position_values gains three net-new tokens ('Attack', 'Midfield',
--   'FOGO') and restates two already-present tokens ('Defense', 'Goalie')
--   unchanged; every existing row's position value is a strict subset of the
--   new set. No RLS change, no data migration. Mirrors
--   20260719130000_football_db_enablement.sql (both halves: sport_valid_values
--   + profiles_position_values restatement) and
--   20260811230000_baseball_db_enablement.sql (sport_valid_values half,
--   header structure).
--
-- Types: no Supabase type regen needed for CHECK constraints (sport/position
--   remain text in generated types, not an enum).
--
-- Order (FV-407 go-live PR chain):
--   Merges after FV-406 (dormant lacrosse wiring), the lacrosse render, and
--   this file's companion content-seed migration
--   (20260812000000_seed_training_sessions_lacrosse_days_1_30.sql), and
--   before/with the SUPPORTED_SPORTS app-side flip.
-- =============================================================================

begin;

alter table public.profiles
  drop constraint if exists sport_valid_values;

alter table public.profiles
  add constraint sport_valid_values
    check (
      sport is null
      or sport in ('hockey', 'basketball', 'golf', 'football', 'baseball', 'lacrosse')
    );

alter table public.profiles
  drop constraint if exists profiles_position_values;

alter table public.profiles
  add constraint profiles_position_values
    check (
      position is null
      or position in (
        -- Hockey
        'Forward', 'Defense', 'Goalie',
        -- Basketball
        'Guard', 'Wing', 'Big',
        -- Baseball (live — FV-97/FV-98 go-live 2026-08-11)
        'Pitcher', 'Catcher', 'Infield', 'Outfield',
        -- Golf (live; non-positional, player profiles)
        'Bomber', 'Ball-Striker', 'Scrambler',
        -- Football (live — ratified short role tokens, module map §1)
        'QB', 'RB', 'WR', 'OL', 'DL', 'LB', 'DB',
        -- Swimming (v2 — dormant; event specialties)
        'Sprinter', 'Distance', 'Stroke', 'IM',
        -- Track & Field (v2 — dormant; event groups; Sprinter + Distance
        -- shared with swimming, listed once above)
        'Hurdler', 'Jumper', 'Thrower',
        -- Lacrosse (going live) — LACROSSE_CONFIG.roles, FV-404 §1. 'Defense'
        -- and 'Goalie' are already listed above (hockey); only the three
        -- lacrosse-only tokens are net-new here.
        'Attack', 'Midfield', 'FOGO'
      )
    );

comment on column public.profiles.position is
  'Athlete self-identified sport position (role), e.g. "Forward", "Guard", '
  '"QB", "Attack", or a golf player profile ("Bomber"/"Ball-Striker"/'
  '"Scrambler"). Nullable — skipped onboarding or a no-role sport. '
  'Constrained by profiles_position_values to the union of registry roles '
  'across all sports.';

commit;
