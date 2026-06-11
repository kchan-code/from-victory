-- =============================================================================
-- Migration: 20260612130000_push_subscriptions.sql
--
-- Purpose: FV-164 — opt-in daily training reminder via Web Push.
--
-- Table: push_subscriptions
--   One row per athlete (athlete_id is the primary key). When an athlete
--   re-subscribes or changes their device, the upsert replaces the row —
--   there is no multi-device fan-out in MVP scope.
--
-- Privacy model:
--   - athlete_id FK cascades with public.profiles(id) on delete cascade,
--     which itself cascades from auth.users. Athlete deletion triggered by
--     the parent via lib/actions/account.ts → auth.admin.deleteUser() removes
--     the push_subscriptions row automatically, with no bespoke deletion code
--     required. This satisfies the 30-day deletion obligation.
--   - endpoint, p256dh, auth are minimal device-linked data — no behavioral
--     analytics, no content extracted from them; used only to deliver the
--     push notification. These keys are never logged.
--   - last_sent_on is date-level send-deduplification only. It is NOT an
--     engagement metric and is never surfaced on any dashboard.
--   - No parent-facing policy. Parents cannot read push subscription data.
--     The RLS default-deny (no matching policy → 0 rows) handles this.
--   - The service-role cron (send-reminders route) bypasses RLS to read due
--     rows and update last_sent_on. This is the only server-side bypass needed.
--
-- RLS: enabled in-transaction with policies grouped at the bottom (same
--   ordering pattern as the baseline migration).
--
-- Grants: explicit grants consistent with the FV-216 harness model.
--   authenticated receives SELECT + INSERT + UPDATE + DELETE (the athlete's own
--   subscription management). anon receives SELECT (to allow the RLS harness to
--   assert 0 rows, consistent with the door=grant / lock=RLS model in FV-216).
--   No DELETE grant to anon. No write grants to anon.
--
-- Postgres version: 15+
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. push_subscriptions
-- ---------------------------------------------------------------------------

create table public.push_subscriptions (
  athlete_id    uuid        primary key
                            references public.profiles(id) on delete cascade,
  endpoint      text        not null,
  p256dh        text        not null,
  auth          text        not null,
  reminder_hour smallint    not null check (reminder_hour between 0 and 23),
  timezone      text        not null,
  -- Date-level deduplication only. Prevents re-sending the same notification
  -- within a single calendar day in the athlete's local timezone.
  -- NOT an engagement metric; never surfaced in any dashboard or report.
  last_sent_on  date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.push_subscriptions is
  'One Web Push subscription row per athlete (athlete_id PK = single latest device). '
  'Stores the minimal credential set needed to send a push notification. '
  'athlete_id FK cascades on delete — row is removed automatically when the athlete '
  'profile is deleted (via parent account deletion cascade), satisfying the 30-day '
  'deletion obligation with no bespoke code. '
  'endpoint/p256dh/auth are device-linked data for push delivery only; they are never '
  'used for behavioral analytics, advertising, or any profiling purpose. '
  'last_sent_on is a date-level send-dedup field — not an engagement metric.';

comment on column public.push_subscriptions.athlete_id is
  'References public.profiles(id). One row per athlete; upsert on this PK replaces '
  'the previous subscription when the athlete re-subscribes or changes device.';

comment on column public.push_subscriptions.endpoint is
  'Web Push endpoint URL provided by the browser PushSubscription object. '
  'Treat as sensitive device-linked data; never log.';

comment on column public.push_subscriptions.p256dh is
  'ECDH public key from PushSubscription.getKey("p256dh"), base64url-encoded. '
  'Treat as sensitive device-linked data; never log.';

comment on column public.push_subscriptions.auth is
  'Auth secret from PushSubscription.getKey("auth"), base64url-encoded. '
  'Treat as sensitive device-linked data; never log.';

comment on column public.push_subscriptions.reminder_hour is
  'Local hour (0-23) at which the athlete wants to be reminded, in their timezone. '
  'The hourly cron matches extract(hour from now() at time zone timezone) = reminder_hour.';

comment on column public.push_subscriptions.timezone is
  'IANA timezone string (e.g. "America/New_York"). Used to compute local hour '
  'for reminder delivery. Stored verbatim from the browser Intl API.';

comment on column public.push_subscriptions.last_sent_on is
  'Date (in the athlete''s local timezone) on which the most recent reminder was '
  'successfully sent. Compared against today-in-their-tz to prevent duplicate sends '
  'in a single day. '
  'Set to NULL on upsert (re-subscribe) so the next cron pass can fire again. '
  'NOT an engagement metric — never surfaced in dashboards or analytics.';

-- updated_at trigger (reuses the shared function from the baseline migration)
create trigger push_subscriptions_set_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Optional performance index: due-reminder query filters on timezone + reminder_hour.
-- A partial index on (timezone, reminder_hour) covers the cron's due-rows scan
-- without indexing last_sent_on (which varies every day and would thrash).
-- ---------------------------------------------------------------------------
create index push_subscriptions_tz_hour_idx
  on public.push_subscriptions (timezone, reminder_hour);


-- ---------------------------------------------------------------------------
-- 2. SECURITY DEFINER function: due_push_reminders()
--
-- Returns rows whose athlete's CURRENT local hour matches reminder_hour AND
-- last_sent_on is not today in their timezone (includes NULL = never sent).
--
-- SECURITY DEFINER runs as the function owner (postgres / service role), so
-- the cron can call it via .rpc() without needing RLS bypass in application
-- code. REVOKE execute from anon and authenticated so only the service-role
-- context (cron route) can call it.
--
-- Data minimality: returns only the columns the cron actually needs to send a
-- notification and update last_sent_on. No PII beyond the device keys that are
-- already necessary for push delivery.
-- ---------------------------------------------------------------------------

create or replace function public.due_push_reminders()
returns table (
  athlete_id    uuid,
  endpoint      text,
  p256dh        text,
  auth          text,
  timezone      text
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
  where
    -- Local hour in the athlete's timezone matches the requested reminder hour
    extract(hour from (now() at time zone ps.timezone))::smallint = ps.reminder_hour
    -- Not yet sent today (date comparison in their timezone)
    and ps.last_sent_on is distinct from (now() at time zone ps.timezone)::date;
$$;

comment on function public.due_push_reminders() is
  'Returns push_subscriptions rows whose reminder_hour matches the athlete''s current '
  'local hour AND have not yet been notified today. SECURITY DEFINER so the cron '
  'route can call it without holding the service-role key in application RLS context. '
  'Returns only columns needed for push delivery; does not return last_sent_on or other '
  'metadata not required by the caller. Execute revoked from anon + authenticated.';

-- Revoke execute from public roles (granted by default in Postgres)
revoke execute on function public.due_push_reminders() from anon;
revoke execute on function public.due_push_reminders() from authenticated;


-- ===========================================================================
-- 3. ROW LEVEL SECURITY
-- ===========================================================================

alter table public.push_subscriptions enable row level security;


-- ===========================================================================
-- 4. POLICIES
-- ===========================================================================

-- Athlete reads their own row only.
create policy "push_subscriptions_select_own"
  on public.push_subscriptions
  for select
  using (athlete_id = auth.uid());

-- Athlete inserts their own row only (upsert path).
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions
  for insert
  with check (athlete_id = auth.uid());

-- Athlete updates their own row only.
create policy "push_subscriptions_update_own"
  on public.push_subscriptions
  for update
  using  (athlete_id = auth.uid())
  with check (athlete_id = auth.uid());

-- Athlete deletes their own row (disables reminders from the settings UI).
-- This is defense-in-depth; the athlete's RLS session is the only client path
-- that reaches this table. The service-role cron bypasses RLS for last_sent_on
-- updates and dead-endpoint pruning.
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions
  for delete
  using (athlete_id = auth.uid());

-- NO parent policy. Parents cannot read, write, or delete push_subscriptions.
-- The RLS default-deny (no matching policy for a parent's auth.uid()) returns
-- 0 rows with no error — this is the intended behaviour.


-- ===========================================================================
-- 5. GRANTS — consistent with FV-216 door=grant / lock=RLS model
-- ===========================================================================

-- authenticated: full CRUD on own row (RLS restricts to athlete_id = auth.uid()).
-- All four operations are needed: select (read own), insert (subscribe), update
-- (change hour), delete (unsubscribe from settings).
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- anon: SELECT only so the RLS harness can assert 0 rows from the anon role.
-- Without a grant the harness gets "permission denied" (grant boundary) rather
-- than "0 rows returned" (RLS boundary) — the wrong failure mode for the test.
-- RLS has no anon-facing policy, so anon always sees 0 rows.
grant select on public.push_subscriptions to anon;
