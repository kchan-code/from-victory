-- =============================================================================
-- RLS assertions — prune_contact_form_rate_limit_events() (FV-774)
--
-- 'contact_form' throttle rows in auth_rate_limit_events hold an HMAC digest of
-- the visitor IP. The gate only prunes a bucket on that bucket's next
-- submission, so the daily cron calls this function to delete expired rows of
-- buckets that never submit again. Only action = 'contact_form' is touched.
-- Everything that writes rolls back.
-- =============================================================================

begin;
  delete from public.auth_rate_limit_events where bucket like 'fv774%';
  insert into public.auth_rate_limit_events (bucket, action, created_at)
  values
    -- an inactive bucket: one old submission, never seen again
    ('fv774-inactive-old',  'contact_form', now() - interval '3 hours'),
    ('fv774-ancient',       'contact_form', now() - interval '40 days'),
    ('fv774-fresh',         'contact_form', now() - interval '10 minutes'),
    ('fv774-old-signin',    'sign_in',      now() - interval '3 hours'),
    ('fv774-old-signup',    'sign_up',      now() - interval '30 days'),
    ('fv774-old-pregame',   'pregame_selections', now() - interval '3 hours');

  set local role service_role;
  do $$
  declare deleted int;
  begin
    deleted := public.prune_contact_form_rate_limit_events();
    assert deleted >= 2, format('FV-774 FAIL: prune must report the expired contact_form rows, reported %s', deleted);
    assert (select count(*) from public.auth_rate_limit_events where bucket in ('fv774-inactive-old', 'fv774-ancient')) = 0,
      'FV-774 FAIL: expired contact_form rows of buckets that never submit again must be deleted';
    assert (select count(*) from public.auth_rate_limit_events where bucket = 'fv774-fresh') = 1,
      'FV-774 FAIL: a fresh contact_form row must be kept';
    assert (select count(*) from public.auth_rate_limit_events
             where bucket in ('fv774-old-signin', 'fv774-old-signup', 'fv774-old-pregame')) = 3,
      'FV-774 FAIL: rows of other actions must be untouched, however old';
    assert public.prune_contact_form_rate_limit_events() = 0, 'FV-774 FAIL: prune must be idempotent';
  end $$;
rollback;

begin;
  set local role authenticated;
  do $$
  declare ok boolean := false;
  begin
    begin perform public.prune_contact_form_rate_limit_events();
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-774 FAIL: authenticated was able to EXECUTE prune_contact_form_rate_limit_events';
  end $$;
rollback;

begin;
  set local role anon;
  do $$
  declare ok boolean := false;
  begin
    begin perform public.prune_contact_form_rate_limit_events();
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-774 FAIL: anon was able to EXECUTE prune_contact_form_rate_limit_events';
  end $$;
rollback;

\echo '  [PASS] 26_contact_form_rate_limit_prune (FV-774)'
