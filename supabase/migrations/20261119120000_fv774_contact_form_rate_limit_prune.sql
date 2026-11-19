-- FV-774: scheduled retention for 'contact_form' throttle rows.
--
-- The public /contact limiter (FV-334) writes one auth_rate_limit_events row
-- per submission, keyed by an HMAC digest of the visitor IP. rateLimitGate only
-- prunes a bucket's expired rows when that same bucket submits again, so a
-- visitor who never returns would leave a row indefinitely. This function is
-- called by the daily cron route /api/cron/prune-activity-events, independent
-- of any submission.
--
-- Retention bound: rows older than 2 hours are deleted (the limiter window is
-- 60 minutes; 2h is the window plus a safe margin, matching
-- prune_pregame_selection_totals). The cron runs daily, so a row can live up to
-- 2 hours + about one day (the gap between runs), and longer if a run is missed.
-- Not "anonymized": the bucket is a keyed digest of the IP, which is pseudonymous
-- personal data; deletion is the control, not the hashing.
--
-- ONLY action = 'contact_form' is touched; every other action's rows are left
-- alone. Returns the number of rows deleted. Service-role only.
create or replace function public.prune_contact_form_rate_limit_events()
returns integer
language plpgsql
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.auth_rate_limit_events
   where action = 'contact_form'
     and created_at < now() - interval '2 hours';
  get diagnostics n = row_count;
  return n;
end;
$$;

comment on function public.prune_contact_form_rate_limit_events() is
  'Retention for contact_form throttle rows in auth_rate_limit_events (FV-774): '
  'deletes rows older than 2 hours (limiter window 60 min + margin); no other '
  'action. Run daily by the prune-activity-events cron route, so max age is '
  '2 hours + up to about one day. Service-role-only.';

revoke all on function public.prune_contact_form_rate_limit_events() from public, anon, authenticated;
grant execute on function public.prune_contact_form_rate_limit_events() to service_role;
