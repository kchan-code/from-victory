-- =============================================================================
-- Migration: 20260612030000_next_game_on.sql
--
-- Purpose: FV-240 — "When's your next game?" coarse game-day push timing.
--
-- Adds next_game_on (date, nullable) to profiles for athlete rows only.
-- The athlete self-reports their next game with a one-tap question on the
-- daily-session completion surface. The server action maps the enum answer to
-- a concrete date (tonight→today, tomorrow→+1, this weekend→next Saturday),
-- with "not sure" stored as NULL. Overwritten on every answer.
--
-- Privacy model:
--   - Coarse date only — no time, no location, no opponent, no venue.
--   - Self-reported and ephemeral: the row is overwritten on each answer.
--   - NULL when the athlete picks "not sure" or after the cron clears a past date.
--   - Deleted automatically with the profile on parent-initiated deletion
--     (column on profiles → cascade is free).
--   - NEVER surfaced on the parent dashboard or any parent-facing query.
--     The dashboard and athlete-detail queries use explicit column lists that
--     do not include next_game_on (verified before this migration was written).
--   - NO column default — absence of value (NULL) is the correct initial state.
--   - The cron sender nulls the field opportunistically after a game-day send
--     so stale dates don't trigger spurious notifications in subsequent hours.
--
-- Constraint: athlete-only (NULL allowed for parents, but parent rows should
-- never have this set; no enforcement needed beyond app-layer requireAthlete()).
--
-- Grants: profiles already has authenticated/anon grants from the baseline.
-- No new grants needed — the column inherits the table-level grants.
--
-- Postgres version: 15+
-- =============================================================================

alter table public.profiles
  add column next_game_on date;

comment on column public.profiles.next_game_on is
  'Coarse self-reported next-game date for athlete rows. '
  'Set by the athlete via a one-tap prompt on the daily-session completion surface. '
  'Values: today (tonight), +1 day (tomorrow), next Saturday (this weekend), or NULL '
  '(not sure / cleared). Overwritten on each answer. Cleared opportunistically by '
  'the game-day cron after delivery. '
  'NEVER surfaced on the parent dashboard or any parent-facing query. '
  'Coarse date only — no time, location, opponent, or venue stored.';


-- ---------------------------------------------------------------------------
-- SECURITY DEFINER function: due_game_day_reminders()
--
-- Returns push_subscriptions rows for athletes whose next_game_on is TODAY
-- in the athlete''s local timezone AND who have not yet received any
-- notification today (last_sent_on ≠ today in their tz).
--
-- Called by the cron route in the 15:00–16:00 local-hour window to send
-- "Big game tonight" nudges before an evening game.
--
-- SECURITY DEFINER runs as the function owner (service role), so the cron
-- can call it via .rpc() without holding the service-role key in RLS context.
-- REVOKE execute from anon and authenticated: only the cron uses this.
--
-- Returns only the columns needed: same shape as due_push_reminders().
-- ---------------------------------------------------------------------------

create or replace function public.due_game_day_reminders()
returns table (
  athlete_id  uuid,
  endpoint    text,
  p256dh      text,
  auth        text,
  timezone    text
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    ps.athlete_id,
    ps.endpoint,
    ps.p256dh,
    ps.auth,
    ps.timezone
  from public.push_subscriptions ps
  join public.profiles p on p.id = ps.athlete_id
  where
    -- Athlete's next_game_on is today in their local timezone
    p.next_game_on = (now() at time zone ps.timezone)::date
    -- Not yet sent today (same dedup gate as the daily reminder)
    and ps.last_sent_on is distinct from (now() at time zone ps.timezone)::date
    -- Only the game-day send window: local hour 15 or 16 (3 PM–4 PM)
    -- Hourly cron fires at the top of the hour; we check the current hour.
    and extract(hour from (now() at time zone ps.timezone))::smallint
        between 15 and 16;
$$;

comment on function public.due_game_day_reminders() is
  'Returns push_subscriptions rows whose athlete has a game today (next_game_on = '
  'today in their timezone) AND has not been notified today AND the local hour is '
  '15 or 16 (3–4 PM). SECURITY DEFINER so the cron route can call it without RLS '
  'bypass in application code. Execute revoked from anon + authenticated.';

revoke execute on function public.due_game_day_reminders() from anon;
revoke execute on function public.due_game_day_reminders() from authenticated;
