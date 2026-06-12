-- =============================================================================
-- Migration: 20260613010000_athlete_personalization_quiz.sql
--
-- Purpose: FV-228 — Athlete personalization quiz ("what's hard for you right now").
--   Two new nullable columns on public.profiles for athlete rows:
--     - position:   their sport position (role). Nullable — skipped onboarding
--                   or sports with no roles leave this NULL.
--     - focus_area: their self-identified mental challenge. Nullable — skipped
--                   onboarding or first-launch athletes leave this NULL.
--
-- These are the athlete's OWN framing of their training. They are:
--   - Never surfaced on the parent dashboard (no parent-facing policy/view reads
--     them; the existing parent_athlete_links view and dashboard queries are
--     untouched by this migration).
--   - NOT behavioral profiling — they are static self-report stored on the
--     athlete's own profile row, readable/writable only by that athlete.
--   - Minimal PII: structured enum values only, no free text.
--
-- CHECK constraint design:
--   - position: constrained to the union of roles across all MVP sports
--     (hockey: Forward/Defense/Goalie; basketball: Guard/Wing/Big;
--      baseball: Pitcher/Catcher/Infield/Outfield) plus NULL.
--     Using a single list allows a simple CHECK expression. The application
--     layer (Zod schema + SPORT_REGISTRY roles) further narrows which values
--     are valid for a given sport — the DB constraint is the outer bound.
--   - focus_area: constrained to the 5 allowed quiz values plus NULL.
--
-- NO DEFAULT on either column (the digest_prefs migration learned this the
-- hard way — defaults backfill the wrong rows). Both columns start NULL for
-- all existing rows; athletes who completed the quiz will have non-null values
-- after first submission.
--
-- RLS: these columns live on public.profiles which already has RLS enabled
--   and the profiles_update_own policy permits the athlete to UPDATE their own
--   row. No new policy needed — the existing policy already covers these
--   columns.
--
-- Grants: public.profiles already has the explicit INSERT/UPDATE grant to
--   authenticated from the 20260612000000 migration. No new grants needed.
--
-- Postgres version: 15+
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add columns to profiles
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists position   text,
  add column if not exists focus_area text;

-- ---------------------------------------------------------------------------
-- 2. CHECK constraints
--
-- position: union of all MVP sport roles. NULL = skipped or no-role sport.
--   Hockey roles: Forward, Defense, Goalie
--   Basketball roles: Guard, Wing, Big
--   Baseball roles (v2): Pitcher, Catcher, Infield, Outfield
--
-- focus_area: the 5 quiz options. NULL = skipped or not yet set.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add constraint profiles_position_values
    check (
      position is null
      or position in (
        -- Hockey
        'Forward', 'Defense', 'Goalie',
        -- Basketball
        'Guard', 'Wing', 'Big',
        -- Baseball (v2)
        'Pitcher', 'Catcher', 'Infield', 'Outfield'
      )
    );

alter table public.profiles
  add constraint profiles_focus_area_values
    check (
      focus_area is null
      or focus_area in (
        'nerves',
        'bouncing-back',
        'confidence',
        'focus',
        'faith'
      )
    );

-- ---------------------------------------------------------------------------
-- 3. Column comments
-- ---------------------------------------------------------------------------

comment on column public.profiles.position is
  'Athlete self-identified sport position (role), e.g. "Forward", "Guard", "Pitcher". '
  'NULL when the athlete skipped the onboarding quiz or plays a sport with no role picker. '
  'Constrained to the union of all MVP sport roles via CHECK. '
  'NEVER surfaced on the parent dashboard — athlete-private framing of their own training.';

comment on column public.profiles.focus_area is
  'Athlete self-identified mental training focus from the onboarding quiz. '
  'One of: nerves | bouncing-back | confidence | focus | faith. '
  'NULL when skipped. Used to personalise the Daily hub card subtitle and the '
  'pregame "Today''s Focus" default. '
  'NEVER surfaced on the parent dashboard — athlete-private framing of their own training.';
