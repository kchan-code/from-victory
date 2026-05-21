-- =============================================================================
-- Migration: 20260521193030_athlete_age_floor_check.sql
--
-- Purpose:
--   Add a DB-level check that enforces the 13+ age floor on athlete profile
--   rows. Today the floor is enforced only by Zod in createAthlete, which
--   leaves zero defense-in-depth against:
--     - a future server-action bug
--     - a manual "edit row" in Supabase Studio
--     - any misconfigured admin tool that talks to Postgres directly
--   Service-role bypasses RLS, so app-layer enforcement is the only gate
--   currently between an under-13 birthdate and a row in profiles.
--
-- Flagged HIGH by kids-privacy-officer on PR #20.
--
-- Constraint semantics:
--   For role = 'athlete', birthdate must be at most current_date - 13 years.
--   We use `current_date` (no time component) so the check matches the date-
--   only semantics of profiles.birthdate. Parent rows are skipped (parents
--   already have birthdate NULL per birthdate_role_consistency).
--
-- Backfill safety:
--   The migration adds a NOT VALID constraint first, then validates. With
--   no existing < 13 athlete rows in the live DB (verified by counting
--   profiles where role='athlete'), the validate step succeeds immediately.
-- =============================================================================

alter table public.profiles
  add constraint athlete_min_age_13
    check (
      role <> 'athlete'
      or birthdate <= current_date - interval '13 years'
    )
    not valid;

alter table public.profiles
  validate constraint athlete_min_age_13;

comment on constraint athlete_min_age_13 on public.profiles is
  'Defense-in-depth for the 13+ age floor. Application-layer enforcement '
  'lives in apps/web/lib/actions/athletes.ts; this constraint is the DB '
  'backstop against bugs, Studio edits, and any direct Postgres write. '
  'CLAUDE.md: Minor Data Protection (13-17), all athletes are 13+.';
