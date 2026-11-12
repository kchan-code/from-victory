-- =============================================================================
-- RLS / function assertions — cleanup reaper (FV-674, SSO A5)
--
-- Migration under test: 20261112120000_fv674_reaper.sql
-- Spec: docs/fv-569-apple-google-signin-spec.md §5.7.
--
--   (a) EXECUTE grants: reaper_find_candidates / reaper_bump_attempts are
--       service_role only (PUBLIC, anon, authenticated hold nothing), both
--       SECURITY DEFINER with search_path = ''. Effect probes by role.
--   (b) Finder behaviour (each scenario ROLLED BACK):
--       returns an old pending (confirmed email / apple / google) account and an
--       old orphan (unconfirmed email-only); returns tombstoned accounts;
--       NEVER returns an established user (profile), a synthetic athlete, an
--       account younger than 1 hour, or a tombstoned account that became
--       established; honours the limit.
--   (c) reaper_bump_attempts increments a tombstone, returns NULL without one.
-- =============================================================================

create function pg_temp.run(p_role text, p_uid uuid, p_sql text)
returns text
language plpgsql
as $$
declare
  r text;
begin
  perform set_config('request.jwt.claims',
    case when p_uid is null then '{}' else
      json_build_object('sub', p_uid, 'role', p_role)::text end, true);
  execute format('set local role %I', p_role);
  execute p_sql into r;
  execute 'reset role';
  return r;
exception when others then
  execute 'reset role';
  return 'ERR:' || sqlerrm;
end $$;

create function pg_temp.mk_user(p_id uuid, p_email text, p_confirmed boolean,
                                p_providers jsonb, p_age interval)
returns void
language plpgsql
as $$
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data,
                          raw_user_meta_data, created_at, updated_at)
  values (p_id, 'authenticated', 'authenticated', p_email,
          case when p_confirmed then now() end,
          jsonb_build_object('provider', 'email', 'providers', p_providers),
          '{}', now() - p_age, now());
end $$;

create function pg_temp.found(p_id uuid)
returns boolean
language sql
as $$
  select exists (select 1 from public.reaper_find_candidates(100) c where c.user_id = p_id)
$$;

-- ---------------------------------------------------------------------------
-- (a) grants
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
  e jsonb;
  m jsonb := jsonb_build_array(
    'public.reaper_find_candidates(integer)',
    'public.reaper_bump_attempts(uuid)');
begin
  for e in select * from jsonb_array_elements(m)
  loop
    fn := e #>> '{}';
    assert not has_function_privilege('anon', fn, 'execute'),
      format('FV-674 FAIL: anon EXECUTE on %s', fn);
    assert not has_function_privilege('authenticated', fn, 'execute'),
      format('FV-674 FAIL: authenticated EXECUTE on %s', fn);
    assert has_function_privilege('service_role', fn, 'execute'),
      format('FV-674 FAIL: service_role lacks EXECUTE on %s', fn);
    assert not exists (
      select 1 from pg_proc p, unnest(coalesce(p.proacl, '{}'::aclitem[])) a
       where p.oid = fn::regprocedure and a::text like '=%'),
      format('FV-674 FAIL: PUBLIC holds EXECUTE on %s', fn);
    assert exists (
      select 1 from pg_proc p
       where p.oid = fn::regprocedure and p.prosecdef
         and coalesce(p.proconfig, '{}') @> array['search_path=""']),
      format('FV-674 FAIL: %s is not SECURITY DEFINER with search_path = ''''', fn);
  end loop;
end $$;

do $$
declare
  p uuid := '10000000-0000-4000-8000-000000000001';
begin
  assert pg_temp.run('anon', null, 'select count(*)::text from public.reaper_find_candidates(5)') like 'ERR:%',
    'FV-674 FAIL: anon can call reaper_find_candidates';
  assert pg_temp.run('authenticated', p, 'select count(*)::text from public.reaper_find_candidates(5)') like 'ERR:%',
    'FV-674 FAIL: authenticated can call reaper_find_candidates';
  assert pg_temp.run('authenticated', p, format('select public.reaper_bump_attempts(%L)::text', p)) like 'ERR:%',
    'FV-674 FAIL: authenticated can call reaper_bump_attempts';
  assert pg_temp.run('anon', null, format('select public.reaper_bump_attempts(%L)::text', p)) like 'ERR:%',
    'FV-674 FAIL: anon can call reaper_bump_attempts';
  assert pg_temp.run('service_role', null, 'select count(*)::text from public.reaper_find_candidates(5)') not like 'ERR:%',
    'FV-674 FAIL: service_role cannot call reaper_find_candidates';
end $$;

-- ---------------------------------------------------------------------------
-- (b1) who is returned
-- ---------------------------------------------------------------------------
begin;
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000001', 'old-confirmed@rls.test', true,  '["email"]',  interval '2 hours');
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000002', 'old-orphan@rls.test',    false, '["email"]',  interval '2 hours');
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000003', 'old-apple@rls.test',     false, '["apple"]',  interval '2 hours');
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000004', 'old-google@rls.test',    true,  '["google"]', interval '2 hours');
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000005', 'new-confirmed@rls.test', true,  '["email"]',  interval '10 minutes');
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000006', 'new-orphan@rls.test',    false, '["email"]',  interval '10 minutes');
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000007', 'est@rls.test',           true,  '["email"]',  interval '2 hours');
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000008', 'athlete-92@athletes.fromvictory.app', true, '["email"]', interval '2 hours');
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000009', 'tomb-new@rls.test',      true,  '["email"]',  interval '5 minutes');
  select pg_temp.mk_user('92000000-0000-4000-8000-00000000000a', 'tomb-est@rls.test',      true,  '["email"]',  interval '2 hours');
  select pg_temp.mk_user('92000000-0000-4000-8000-00000000000b', 'tomb-athlete@athletes.fromvictory.app', true, '["email"]', interval '2 hours');

  insert into public.profiles (id, role, first_name)
  values ('92000000-0000-4000-8000-000000000007', 'parent', 'Est'),
         ('92000000-0000-4000-8000-00000000000a', 'parent', 'TombEst');

  -- tombstones: a young pending one (returned: tombstoned), one that became
  -- established, and a synthetic athlete (neither returned). The established
  -- one is inserted as a tombstone BEFORE its profile in real life; insert the
  -- row directly here (as the owner) since the trigger only guards profiles.
  insert into private.pending_account_deletions (user_id, reason)
  values ('92000000-0000-4000-8000-000000000009', 'cancel'),
         ('92000000-0000-4000-8000-00000000000a', 'cancel'),
         ('92000000-0000-4000-8000-00000000000b', 'cancel');

  do $$
  declare
    r text;
  begin
    assert pg_temp.found('92000000-0000-4000-8000-000000000001'),
      'FV-674 FAIL: old confirmed-email pending account not returned';
    assert pg_temp.found('92000000-0000-4000-8000-000000000002'),
      'FV-674 FAIL: old unconfirmed email-only orphan not returned';
    assert pg_temp.found('92000000-0000-4000-8000-000000000003'),
      'FV-674 FAIL: old apple pending account not returned';
    assert pg_temp.found('92000000-0000-4000-8000-000000000004'),
      'FV-674 FAIL: old google pending account not returned';
    assert pg_temp.found('92000000-0000-4000-8000-000000000009'),
      'FV-674 FAIL: a tombstoned account (even if young) must be returned';

    assert not pg_temp.found('92000000-0000-4000-8000-000000000005'),
      'FV-674 FAIL: account younger than 1h (confirmed) returned';
    assert not pg_temp.found('92000000-0000-4000-8000-000000000006'),
      'FV-674 FAIL: account younger than 1h (orphan) returned';
    assert not pg_temp.found('92000000-0000-4000-8000-000000000007'),
      'FV-674 FAIL: established user (has a profile) returned';
    assert not pg_temp.found('92000000-0000-4000-8000-000000000008'),
      'FV-674 FAIL: synthetic athlete returned';
    assert not pg_temp.found('92000000-0000-4000-8000-00000000000a'),
      'FV-674 FAIL: tombstoned-but-established user returned';
    assert not pg_temp.found('92000000-0000-4000-8000-00000000000b'),
      'FV-674 FAIL: tombstoned synthetic athlete returned';

    -- flags are exposed correctly
    assert (select tombstoned from public.reaper_find_candidates(100)
             where user_id = '92000000-0000-4000-8000-000000000009'),
      'FV-674 FAIL: tombstoned flag not set for a tombstoned account';
    assert not (select tombstoned from public.reaper_find_candidates(100)
                 where user_id = '92000000-0000-4000-8000-000000000001'),
      'FV-674 FAIL: tombstoned flag set for an untombstoned account';

    -- limit honoured; callable as service_role through the real grant
    assert (select count(*) from public.reaper_find_candidates(2)) <= 2,
      'FV-674 FAIL: limit not honoured';
    r := pg_temp.run('service_role', null, 'select count(*)::text from public.reaper_find_candidates(100)');
    assert r not like 'ERR:%' and r::int >= 5, format('FV-674 FAIL: service_role finder returned %s', r);
  end $$;
rollback;

-- An account that gains a payer row without a profile (FK dropped in the
-- rolled-back transaction) is rejected by is_unestablished, so never returned.
begin;
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000010', 'payer@rls.test', true, '["email"]', interval '2 hours');
  alter table public.access_grants drop constraint if exists access_grants_parent_id_fkey;
  insert into public.access_grants (parent_id)
  values ('92000000-0000-4000-8000-000000000010');
  do $$
  begin
    assert not pg_temp.found('92000000-0000-4000-8000-000000000010'),
      'FV-674 FAIL: an account with comp/payer data and no profile was returned';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (c) reaper_bump_attempts
-- ---------------------------------------------------------------------------
begin;
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000020', 'bump@rls.test', true, '["email"]', interval '2 hours');
  do $$
  declare
    u uuid := '92000000-0000-4000-8000-000000000020';
    r text;
  begin
    r := pg_temp.run('service_role', null, format('select coalesce(public.reaper_bump_attempts(%L)::text, ''null'')', u));
    assert r = 'null', format('FV-674 FAIL: bump without a tombstone returned %s', r);

    r := pg_temp.run('service_role', null, format('select public.reaper_mark(%L)', u));
    assert r = 'marked', format('FV-674 FAIL: reaper_mark returned %s', r);

    r := pg_temp.run('service_role', null, format('select public.reaper_bump_attempts(%L)::text', u));
    assert r = '1', format('FV-674 FAIL: first bump returned %s', r);
    r := pg_temp.run('service_role', null, format('select public.reaper_bump_attempts(%L)::text', u));
    assert r = '2', format('FV-674 FAIL: second bump returned %s', r);
    assert (select attempts from private.pending_account_deletions where user_id = u) = 2,
      'FV-674 FAIL: attempts not persisted';
    assert (select attempts from public.reaper_find_candidates(100) where user_id = u) = 2,
      'FV-674 FAIL: finder does not report attempts';
  end $$;
rollback;
