-- =============================================================================
-- Migration: 20260812230000_soccer_db_enablement.sql  (FV-77/FV-81)
--
-- Purpose (soccer go-live, KC founder sign-off 2026-08-12):
--   1. sport_valid_values += 'soccer' — soccer becomes a storable athlete
--      sport (the app-side SUPPORTED_SPORTS flip ships alongside/after this;
--      DB widens first so a deployed selector can never outrun the CHECK).
--   2. profiles_position_values is restated with soccer's net-new position
--      tokens added under a new "-- Soccer (going live)" comment.
--
--      Verified against docs/soccer-module-map.md §1 (RATIFIED — KC
--      review-bundle round-trip, 2026-08-10) before writing this migration:
--      `Role = "Forward" | "Midfielder" | "Defender" | "Goalkeeper"`, and
--      the map's own "DB note for the wiring issue" states this exactly:
--      "`Forward` already exists in the `profiles_position_values`
--      whitelist (hockey). `Midfielder`, `Defender`, and `Goalkeeper` are
--      new values — note that soccer says Defender (not hockey's
--      'Defense') and Goalkeeper (not hockey's 'Goalie'). Do not reuse
--      hockey's strings."
--
--      Of those four tokens, only 'Forward' is ALREADY present in
--      profiles_position_values — but as HOCKEY's token (see the
--      "-- Hockey" line, last restated by
--      20260719130000_football_db_enablement.sql). This is a shared
--      string across the two sports, not a soccer-specific grant; noted
--      explicitly here so a future reader doesn't mistake its presence
--      for prior soccer enablement. 'Midfielder', 'Defender', and
--      'Goalkeeper' are net-new additions to the constraint's value list
--      and are distinct strings from hockey's 'Defense' and 'Goalie' —
--      the map is explicit that these are NOT the same tokens and must
--      not be conflated or reused.
--
--      No stored-long-name mismatch is possible here (the football gotcha
--      from 20260613100000 / 20260719130000, where dormant long display
--      names were stored and had to be swapped for short ratified tokens at
--      go-live, does not apply to soccer): grepped supabase/migrations/**
--      for "soccer", "Midfielder", "Goalkeeper", and "Defender" before
--      writing this migration and found zero prior hits anywhere in the
--      migration history. No soccer position token — long name or short —
--      was ever added to profiles_position_values or storable on any
--      profiles row (sport itself was never in sport_valid_values, and
--      profiles_position_values never listed any soccer-only token). This
--      is soccer's first appearance in the constraint.
--
-- Safety / risk:
--   Additive only. sport_valid_values gains one new allowed value; every
--   existing row's sport is already a member of the widened set, so
--   Postgres re-validates ADD CONSTRAINT with zero risk of orphaning a row.
--   profiles_position_values gains three net-new tokens ('Midfielder',
--   'Defender', 'Goalkeeper') and restates one already-present token
--   ('Forward') unchanged; every existing row's position value is a strict
--   subset of the new set. No RLS change, no data migration. Mirrors
--   20260812010000_lacrosse_db_enablement.sql and
--   20260719130000_football_db_enablement.sql (both halves:
--   sport_valid_values + profiles_position_values restatement).
--
-- Types: no Supabase type regen needed for CHECK constraints (sport/position
--   remain text in generated types, not an enum).
--
-- Order (FV-77/FV-81 go-live PR chain):
--   Merges after the soccer content authoring wave and the soccer render,
--   and before/with this file's companion content-seed migration
--   (20260812220000_seed_training_sessions_soccer_days_1_30.sql) and the
--   SUPPORTED_SPORTS app-side flip. DB-before-app order: this migration
--   must land before or with the app deploy that adds soccer to
--   SUPPORTED_SPORTS, never after.
-- =============================================================================

begin;

alter table public.profiles
  drop constraint if exists sport_valid_values;

alter table public.profiles
  add constraint sport_valid_values
    check (
      sport is null
      or sport in ('hockey', 'basketball', 'golf', 'football', 'baseball', 'lacrosse', 'soccer')
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
        -- Lacrosse (live — LACROSSE_CONFIG.roles, FV-404 §1. 'Defense' and
        -- 'Goalie' are already listed above (hockey); only the three
        -- lacrosse-only tokens are net-new there.)
        'Attack', 'Midfield', 'FOGO',
        -- Soccer (going live) — docs/soccer-module-map.md §1 (RATIFIED
        -- 2026-08-10). 'Forward' is already listed above (hockey); only
        -- 'Midfielder', 'Defender', and 'Goalkeeper' are net-new soccer
        -- tokens here. Note these are distinct strings from hockey's
        -- 'Defense' and 'Goalie' and from lacrosse's 'Midfield' — do not
        -- conflate or reuse across sports.
        'Midfielder', 'Defender', 'Goalkeeper'
      )
    );

comment on column public.profiles.position is
  'Athlete self-identified sport position (role), e.g. "Forward", "Guard", '
  '"QB", "Attack", "Goalkeeper", or a golf player profile '
  '("Bomber"/"Ball-Striker"/"Scrambler"). Nullable — skipped onboarding or a '
  'no-role sport. Constrained by profiles_position_values to the union of '
  'registry roles across all sports.';

commit;
