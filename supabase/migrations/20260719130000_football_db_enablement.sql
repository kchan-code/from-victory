-- =============================================================================
-- Migration: 20260719130000_football_db_enablement.sql  (FV-205)
--
-- Purpose (football go-live, KC launch directive 2026-07-19):
--   1. sport_valid_values += 'football' — football becomes a storable athlete
--      sport (the app-side SUPPORTED_SPORTS flip ships with FV-206; DB widens
--      first so a deployed selector can never outrun the CHECK).
--   2. profiles_position_values += the RATIFIED short football role tokens
--      ('QB','RB','WR','OL','DL','LB','DB') per docs/football-module-map.md §1
--      and FOOTBALL_CONFIG.roles. The 2026-06-13 dormant migration
--      (20260613100000) stored LONG display names ('Running Back', 'Receiver',
--      …) which never matched the ratified registry roles; no football athlete
--      rows can exist yet (sport was gated), so the long names are dropped in
--      favor of the short canon. Everything else is restated verbatim.
--
-- Safety / risk:
--   Additive for every value that can exist in a row today (football sport was
--   not selectable; long football position names were unreachable for the same
--   reason — dropping them cannot orphan a row). Postgres re-validates on
--   ADD CONSTRAINT; all current values are a strict subset. No data migration,
--   no RLS change. Mirrors 20260613020000_golf_db_enablement.sql.
--
-- Types: no Supabase type regen needed for CHECK constraints (sport/position
--   remain text in generated types).
-- =============================================================================

begin;

alter table public.profiles
  drop constraint if exists sport_valid_values;

alter table public.profiles
  add constraint sport_valid_values
    check (
      sport is null
      or sport in ('hockey', 'basketball', 'golf', 'football')
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
        -- Baseball (v2 — dormant)
        'Pitcher', 'Catcher', 'Infield', 'Outfield',
        -- Golf (live; non-positional, player profiles)
        'Bomber', 'Ball-Striker', 'Scrambler',
        -- Football (going live — ratified short role tokens, module map §1;
        -- replaces the never-used long names from 20260613100000)
        'QB', 'RB', 'WR', 'OL', 'DL', 'LB', 'DB',
        -- Swimming (v2 — dormant; event specialties)
        'Sprinter', 'Distance', 'Stroke', 'IM',
        -- Track & Field (v2 — dormant; event groups; Sprinter + Distance
        -- shared with swimming, listed once above)
        'Hurdler', 'Jumper', 'Thrower'
      )
    );

comment on column public.profiles.position is
  'Athlete self-identified sport position (role), e.g. "Forward", "Guard", '
  '"QB", or a golf player profile ("Bomber"/"Ball-Striker"/"Scrambler"). '
  'Nullable — skipped onboarding or a no-role sport. Constrained by '
  'profiles_position_values to the union of registry roles across all sports.';

commit;
