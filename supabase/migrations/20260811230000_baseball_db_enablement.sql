-- =============================================================================
-- Migration: 20260811230000_baseball_db_enablement.sql  (FV-97)
--
-- Purpose (baseball go-live, KC launch directive 2026-08-11):
--   1. sport_valid_values += 'baseball' — baseball becomes a storable athlete
--      sport (the app-side SUPPORTED_SPORTS flip ships with FV-98; DB widens
--      first so a deployed selector can never outrun the CHECK).
--   2. profiles_position_values is NOT restated or modified here. Baseball's
--      four position tokens ('Pitcher', 'Catcher', 'Infield', 'Outfield')
--      were already added to that constraint, dormant, in the 2026-06-13
--      lineage (20260613020000 / 20260613100000) and were carried forward
--      verbatim (still labeled "Baseball (v2 — dormant)") by the football
--      enablement migration (20260719130000), which restates the full
--      constraint value list. No position-constraint change is needed for
--      baseball go-live.
--
--      Verified against the registry before writing this migration:
--      BASEBALL_CONFIG.roles in apps/web/components/pregame/sport-registry.ts
--      is exactly ["Pitcher", "Catcher", "Infield", "Outfield"] — a verbatim
--      match to the four tokens already stored in profiles_position_values.
--      No football-style long-name/short-token mismatch exists for baseball;
--      no position-constraint edit required.
--
--   3. training_sessions_catalog.sport is unconstrained `text` (verified —
--      no CHECK constraint on that column; see 20260522000749_content_schema
--      .sql, `sport text not null default 'hockey'`). Baseball's 30 daily
--      rows were already seeded 2026-06-13
--      (20260613050000_seed_training_sessions_baseball_days_1_30.sql), so no
--      catalog migration is needed for baseball go-live.
--
-- Safety / risk:
--   Additive only. sport_valid_values gains one new allowed value; every
--   existing row's sport is already a member of the widened set, so
--   Postgres re-validates ADD CONSTRAINT with zero risk of orphaning a row.
--   profiles_position_values is untouched (no drop/re-add here) — this
--   migration cannot invalidate any position value, dormant or live.
--   No RLS change, no data migration. Mirrors 20260719130000_football_
--   db_enablement.sql (sport_valid_values half only).
--
-- Types: no Supabase type regen needed — sport remains `text` with a CHECK
--   constraint in generated types, not an enum.
-- =============================================================================

begin;

alter table public.profiles
  drop constraint if exists sport_valid_values;

alter table public.profiles
  add constraint sport_valid_values
    check (
      sport is null
      or sport in ('hockey', 'basketball', 'golf', 'football', 'baseball')
    );

commit;
