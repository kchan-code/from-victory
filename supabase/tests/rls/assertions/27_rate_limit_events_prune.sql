-- =============================================================================
-- RLS assertions — prune_rate_limit_events() (FV-775)
--
-- Every auth_rate_limit_events row holds a keyed digest of an email address,
-- an account id, a request IP, or a username plus IP. The gate only prunes a
-- bucket on that bucket's next write, so the daily cron calls this function to
-- delete expired rows of EVERY action, with no further request needed.
-- Everything that writes rolls back.
-- =============================================================================

begin;
  delete from public.auth_rate_limit_events where bucket like 'fv775%';
  insert into public.auth_rate_limit_events (bucket, action, created_at)
  values
    -- buckets that are never written again, one per identifier kind
    ('fv775-old-signin',    'sign_in',            now() - interval '3 hours'),
    ('fv775-old-signup',    'sign_up',            now() - interval '30 days'),
    ('fv775-old-username',  'username_sign_in',   now() - interval '3 hours'),
    ('fv775-old-athlete',   'athlete_sign_in',    now() - interval '5 hours'),
    ('fv775-old-reset',     'password_reset',     now() - interval '2 days'),
    ('fv775-old-contact',   'contact_form',       now() - interval '3 hours'),
    ('fv775-old-pregame',   'pregame_selections', now() - interval '3 hours'),
    -- still inside the longest (60 minute) limiter window: must be kept
    ('fv775-fresh-signup',  'sign_up',            now() - interval '59 minutes'),
    ('fv775-fresh-signin',  'sign_in',            now() - interval '10 minutes'),
    -- past the window but inside the 2 hour margin: kept until the next run
    ('fv775-margin-reset',  'password_reset',     now() - interval '90 minutes');

  set local role service_role;
  do $$
  declare deleted int;
  begin
    deleted := public.prune_rate_limit_events();
    assert deleted >= 7, format('FV-775 FAIL: prune must report at least the 7 expired rows, reported %s', deleted);
    assert (select count(*) from public.auth_rate_limit_events where bucket like 'fv775-old-%') = 0,
      'FV-775 FAIL: expired rows of every action must be deleted with no further request';
    assert (select count(*) from public.auth_rate_limit_events
             where bucket in ('fv775-fresh-signup', 'fv775-fresh-signin', 'fv775-margin-reset')) = 3,
      'FV-775 FAIL: rows newer than 2 hours must be kept (the limiter may still count them)';
    assert (select count(*) from public.auth_rate_limit_events
             where created_at < now() - interval '2 hours') = 0,
      'FV-775 FAIL: no row older than 2 hours may survive a prune';
    assert public.prune_rate_limit_events() = 0, 'FV-775 FAIL: prune must be idempotent';
  end $$;
rollback;

begin;
  set local role authenticated;
  do $$
  declare ok boolean := false;
  begin
    begin perform public.prune_rate_limit_events();
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-775 FAIL: authenticated was able to EXECUTE prune_rate_limit_events';
  end $$;
rollback;

begin;
  set local role anon;
  do $$
  declare ok boolean := false;
  begin
    begin perform public.prune_rate_limit_events();
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-775 FAIL: anon was able to EXECUTE prune_rate_limit_events';
  end $$;
rollback;

\echo '  [PASS] 27_rate_limit_events_prune (FV-775)'
