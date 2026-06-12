-- =============================================================================
-- Migration: 20260612140000_next_game_on.sql
--
-- Purpose: FV-240 — "When's your next game?" coarse game-day push timing.
--
-- Sorts AFTER 20260612130000_push_subscriptions.sql so the
-- due_game_day_reminders() function can JOIN public.push_subscriptions
-- (which is created in the preceding migration).
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
-- in the athlete''s local timezone AND the local hour is in the game-day send
-- window (15–16 local, i.e. 3–4 PM).
--
-- Dedupe note (deduplication strategy):
--   This function does NOT gate on last_sent_on. The reason: an athlete whose
--   daily reminder fires in the morning would already have last_sent_on = today
--   by 3 PM, causing the game-day nudge to be permanently suppressed — the
--   lower-value push wins. Instead, deduplication across cron runs relies on
--   next_game_on being cleared (set to NULL) after a successful game-day send
--   (the cron route does this). Stamping last_sent_on after the game-day send
--   still happens so the evening daily is replaced on game day.
--
--   Net behavior:
--     - Morning-reminder athletes: daily (AM) + game-day nudge (3–4 PM)
--     - Evening-reminder athletes: game-day only that day
--     - next_game_on cleared after game-day send → no re-send on subsequent
--       hourly cron runs.
--
-- Called by the cron route in the 15:00–16:00 local-hour window to send
-- "Big game tonight" nudges before an evening game.
--
-- SECURITY DEFINER runs as the function owner (service role), so the cron
-- can call it via .rpc() without holding the service-role key in RLS context.
-- REVOKE execute from public/anon/authenticated: only the cron uses this.
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
    -- Only the game-day send window: local hour 15 or 16 (3 PM–4 PM).
    -- Hourly cron fires at the top of the hour; we check the current hour.
    and extract(hour from (now() at time zone ps.timezone))::smallint
        between 15 and 16;
    -- NOTE: no last_sent_on gate here. Deduplication is handled by:
    --   1. Clearing next_game_on to NULL after a successful game-day send
    --      (the cron route does this immediately after each successful push).
    --   2. The app-layer athlete_id exclusion set in the cron route.
    -- This ensures morning-reminder athletes can receive BOTH their daily
    -- reminder (AM) and the game-day nudge (3–4 PM) on the same day.
    -- last_sent_on IS still stamped after game-day sends so the evening daily
    -- is replaced on game day.
$$;

comment on function public.due_game_day_reminders() is
  'Returns push_subscriptions rows whose athlete has a game today (next_game_on = '
  'today in their timezone) AND the local hour is 15 or 16 (3–4 PM). '
  'Does NOT gate on last_sent_on — deduplication relies on next_game_on being '
  'cleared after a successful game-day send (see cron route). This allows morning- '
  'reminder athletes to receive both their daily AM reminder and the game-day nudge. '
  'SECURITY DEFINER so the cron route can call it without RLS bypass in application code. '
  'Execute revoked from public, anon, and authenticated.';

-- Revoke execute from all public roles.
-- Postgres grants EXECUTE to PUBLIC by default when a function is created.
-- We must revoke from PUBLIC (which covers anon + authenticated) to prevent
-- the anon key from calling this RPC and harvesting push endpoint/key data
-- for minors. Revoking from the named roles is belt-and-suspenders.
revoke execute on function public.due_game_day_reminders() from public;
revoke execute on function public.due_game_day_reminders() from anon;
revoke execute on function public.due_game_day_reminders() from authenticated;

-- ---------------------------------------------------------------------------
-- Harden due_push_reminders() (FV-164, shipped in 20260612130000)
--
-- due_push_reminders() has the same SECURITY DEFINER gap: Postgres grants
-- EXECUTE to PUBLIC by default, so the anon key could call it and harvest
-- push endpoint/p256dh/auth keys for minors. Revoke from PUBLIC here so
-- both functions are hardened in a single db push.
--
-- The named-role revokes in the FV-164 migration (revoke from anon; revoke
-- from authenticated) are correct but insufficient — revoking from the roles
-- does not revoke the PUBLIC grant. Adding the PUBLIC revoke here closes the gap.
-- ---------------------------------------------------------------------------
revoke execute on function public.due_push_reminders() from public;
-- belt-and-suspenders: named roles already revoked in FV-164 migration,
-- repeating here is harmless and makes the intent explicit.
revoke execute on function public.due_push_reminders() from anon;
revoke execute on function public.due_push_reminders() from authenticated;
