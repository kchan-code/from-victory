-- =============================================================================
-- Migration: 20260613020000_golf_db_enablement.sql
--
-- Purpose (FV-269 — "Add golf to the sport enum"):
--   Golf goes live (KC directive 2026-06-12). Two additive CHECK-constraint
--   widenings on public.profiles so a golf athlete's sport and player profile
--   are storable:
--     1. sport_valid_values      += 'golf'
--     2. profiles_position_values += 'Bomber', 'Ball-Striker', 'Scrambler'
--   Golf is non-positional — its `position` column stores the PLAYER PROFILE
--   (Bomber / Ball-Striker / Scrambler), per docs/golf-module-map.md §1, the
--   same way the engine's role dimension maps to profile for golf.
--
--   Baseball is intentionally NOT added to sport_valid_values — it remains a
--   dormant v2 sport (authored content, not athlete-selectable). Only golf is
--   enabled here. (Baseball's positions already sit in profiles_position_values
--   from 20260613010000 — a harmless defensive over-inclusion; position
--   validity is independent of the sport allowlist.)
--
--   The athlete-quiz-schema backstop test (apps/web/__tests__/
--   athlete-quiz-schema.test.ts) mirror was updated alongside the golf registry
--   roles (FV-265) and asserts registry roles ⊆ this constraint; this migration
--   makes that hold in the database.
--
-- Safety / risk:
--   Both ALTERs are additive — they only WIDEN the allowed set, so no existing
--   row can violate the new constraint. Postgres still re-validates existing
--   rows on ADD CONSTRAINT, but every current value is a strict subset of the
--   new set, so the scan passes; backward-compatible, no data migration, no RLS
--   change. The sport_role_consistency constraint is untouched (it enforces
--   not-null-for-athletes, not the value set, so it needs no edit).
--
-- Ordering:
--   Dated after 20260613010000 (which creates profiles_position_values) so the
--   DROP ... IF EXISTS / re-ADD sequence runs against the existing constraint.
--
-- Types:
--   No Supabase type regeneration needed — a CHECK constraint is not reflected
--   in generated TypeScript types (sport / position remain `string | null`).
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. sport_valid_values += 'golf'
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists sport_valid_values;

alter table public.profiles
  add constraint sport_valid_values
    check (
      sport is null
      or sport in ('hockey', 'basketball', 'golf')
    );

-- ---------------------------------------------------------------------------
-- 2. profiles_position_values += golf player profiles
-- ---------------------------------------------------------------------------
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
        -- Baseball (v2 — dormant)
        'Pitcher', 'Catcher', 'Infield', 'Outfield',
        -- Golf (v2 — going live; non-positional, player profiles)
        'Bomber', 'Ball-Striker', 'Scrambler'
      )
    );

-- ---------------------------------------------------------------------------
-- 3. Column comment refresh (golf example in the position comment)
-- ---------------------------------------------------------------------------
comment on column public.profiles.position is
  'Athlete self-identified sport position (role), e.g. "Forward", "Guard", '
  '"Pitcher", or a golf player profile ("Bomber"/"Ball-Striker"/"Scrambler"). '
  'Nullable — skipped onboarding or a no-role sport. Constrained by '
  'profiles_position_values to the union of registry roles across all sports.';

commit;
