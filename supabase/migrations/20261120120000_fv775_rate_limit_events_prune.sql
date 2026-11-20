-- FV-775: scheduled retention for EVERY action's throttle rows.
--
-- auth_rate_limit_events holds one row per allowed attempt: the action, the
-- time, and a keyed digest of an email address, an account id, a request IP,
-- or a username plus IP. rateLimitGate only deletes a bucket's expired rows
-- when that same bucket is written again, so a visitor or account that never
-- repeats the action left its rows behind with no upper bound. FV-774 fixed
-- that for 'contact_form' only; FV-749 for 'pregame_selections' only. This
-- function covers the whole table.
--
-- Retention bound: rows older than 2 hours are deleted. The longest limiter
-- window is 60 minutes (RATE_LIMIT_CONFIG; a unit test fails if any window
-- exceeds it), so 2 hours never removes a row the limiter still counts. The
-- daily cron route /api/cron/prune-activity-events calls it, so a row lives at
-- most 2 hours + about one day (the gap between runs), longer only if a run is
-- missed.
--
-- Not "anonymized": the bucket is a keyed digest, which is pseudonymous
-- personal data. Deletion is the control, not the hashing.
--
-- prune_contact_form_rate_limit_events() (FV-774) is left in place so a
-- rollback to the previous deployment still has the function it calls. It is
-- now a subset of this one and can be dropped in a later migration.
--
-- Returns the number of rows deleted. Service-role only.
create or replace function public.prune_rate_limit_events()
returns integer
language plpgsql
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.auth_rate_limit_events
   where created_at < now() - interval '2 hours';
  get diagnostics n = row_count;
  return n;
end;
$$;

comment on function public.prune_rate_limit_events() is
  'Retention for auth_rate_limit_events (FV-775): deletes rows of every action '
  'older than 2 hours (longest limiter window 60 min + margin). Run daily by '
  'the prune-activity-events cron route, so max age is 2 hours + up to about '
  'one day. Service-role-only.';

revoke all on function public.prune_rate_limit_events() from public, anon, authenticated;
grant execute on function public.prune_rate_limit_events() to service_role;
