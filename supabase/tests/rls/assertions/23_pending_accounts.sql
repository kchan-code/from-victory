-- =============================================================================
-- RLS / function assertions — pending accounts + lock functions (FV-671, SSO A1)
--
-- Migration under test: 20261112100000_fv671_pending_accounts.sql
-- Spec: docs/fv-569-apple-google-signin-spec.md §5.1, §5.2, §13 "RLS harness".
--
--   (a) The `private` schema and the tombstone table are inaccessible to anon,
--       authenticated and service_role — by grant AND by effect (a real SELECT
--       fails). RLS is on with no policies.
--   (b) EXECUTE grants are exactly as specified:
--         complete_pending_profile / cancel_my_pending_account -> authenticated
--         reaper_mark / finalize_pending_deletion              -> service_role
--         private.is_unestablished, the profile trigger fn     -> nobody
--       PUBLIC and anon never hold EXECUTE. Effect probes: authenticated cannot
--       call reaper_mark / finalize; anon cannot call anything.
--       cancel_my_pending_account() takes NO parameters (cannot target another
--       user).
--   (c) Sequenced behavior of every lock function (the true two-connection
--       races live in supabase/tests/concurrency/run.sh):
--         created / already_complete / account_closing / reject_underage,
--         cancel vs complete, reaper_mark vs complete, finalize re-check
--         (established data appears after the tombstone -> not_pending, nothing
--         deleted), under-18 resubmission on an ESTABLISHED account never
--         deletes, finalize cascades identities + sessions, synthetic athlete
--         accounts and unknown ids are never deletable, a tombstone blocks a
--         direct profile insert.
--
-- Every scenario runs in a transaction that is ROLLED BACK. The simulated
-- payer rows (no profile) drop the profile FK inside the rolled-back
-- transaction so the predicate's data checks are exercised independently of
-- the FK.
-- =============================================================================

-- Session-scoped helpers (pg_temp). run(): execute one statement as a given DB
-- role with the given auth.uid(); returns the scalar result or 'ERR:<message>'.
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

create function pg_temp.mk_user(p_id uuid, p_email text, p_confirmed boolean, p_providers jsonb)
returns void
language plpgsql
as $$
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (p_id, 'authenticated', 'authenticated', p_email,
          case when p_confirmed then now() end,
          jsonb_build_object('provider', 'email', 'providers', p_providers),
          '{}', now(), now());
end $$;

-- ---------------------------------------------------------------------------
-- (a) private schema + tombstone: no client access of any kind
-- ---------------------------------------------------------------------------
do $$
declare
  r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role']
  loop
    assert not has_schema_privilege(r, 'private', 'usage'),
      format('FV-671 FAIL: %s has USAGE on schema private', r);
    assert not has_schema_privilege(r, 'private', 'create'),
      format('FV-671 FAIL: %s has CREATE on schema private', r);
    assert not has_table_privilege(r, 'private.pending_account_deletions', 'select')
       and not has_table_privilege(r, 'private.pending_account_deletions', 'insert')
       and not has_table_privilege(r, 'private.pending_account_deletions', 'update')
       and not has_table_privilege(r, 'private.pending_account_deletions', 'delete'),
      format('FV-671 FAIL: %s holds a privilege on private.pending_account_deletions', r);
  end loop;

  assert (select relrowsecurity from pg_class where oid = 'private.pending_account_deletions'::regclass),
    'FV-671 FAIL: RLS is not enabled on private.pending_account_deletions';
  assert (select count(*) from pg_policy where polrelid = 'private.pending_account_deletions'::regclass) = 0,
    'FV-671 FAIL: private.pending_account_deletions has policies (must be deny-all, no policies)';
end $$;

-- Effect: a real SELECT / call by each client role fails.
do $$
begin
  assert pg_temp.run('anon', null, 'select count(*)::text from private.pending_account_deletions') like 'ERR:%',
    'FV-671 FAIL: anon could SELECT private.pending_account_deletions';
  assert pg_temp.run('authenticated', '10000000-0000-4000-8000-000000000001',
                     'select count(*)::text from private.pending_account_deletions') like 'ERR:%',
    'FV-671 FAIL: authenticated could SELECT private.pending_account_deletions';
  assert pg_temp.run('service_role', null, 'select count(*)::text from private.pending_account_deletions') like 'ERR:%',
    'FV-671 FAIL: service_role could SELECT private.pending_account_deletions';
  assert pg_temp.run('authenticated', '10000000-0000-4000-8000-000000000001',
                     'select private.is_unestablished(''10000000-0000-4000-8000-000000000001'')::text') like 'ERR:%',
    'FV-671 FAIL: authenticated could call private.is_unestablished';
  assert pg_temp.run('service_role', null,
                     'select private.is_unestablished(''10000000-0000-4000-8000-000000000001'')::text') like 'ERR:%',
    'FV-671 FAIL: service_role could call private.is_unestablished';
end $$;

-- ---------------------------------------------------------------------------
-- (b) EXECUTE grants — exactly as specified
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
  -- fn, anon, authenticated, service_role
  m jsonb := jsonb_build_array(
    jsonb_build_array('public.complete_pending_profile(text, text, date, text)', false, true,  false),
    jsonb_build_array('public.cancel_my_pending_account()',                      false, true,  false),
    jsonb_build_array('public.reaper_mark(uuid)',                                false, false, true),
    jsonb_build_array('public.finalize_pending_deletion(uuid)',                  false, false, true),
    jsonb_build_array('public.block_profile_when_pending_deletion()',            false, false, false),
    jsonb_build_array('private.is_unestablished(uuid)',                          false, false, false)
  );
  e jsonb;
begin
  for e in select * from jsonb_array_elements(m)
  loop
    fn := e ->> 0;
    assert has_function_privilege('anon', fn, 'execute') = (e ->> 1)::boolean,
      format('FV-671 FAIL: anon EXECUTE on %s should be %s', fn, e ->> 1);
    assert has_function_privilege('authenticated', fn, 'execute') = (e ->> 2)::boolean,
      format('FV-671 FAIL: authenticated EXECUTE on %s should be %s', fn, e ->> 2);
    assert has_function_privilege('service_role', fn, 'execute') = (e ->> 3)::boolean,
      format('FV-671 FAIL: service_role EXECUTE on %s should be %s', fn, e ->> 3);
    -- PUBLIC: pg_proc.proacl must carry no "=X" (empty-grantee) entry.
    assert not exists (
      select 1 from pg_proc p, unnest(coalesce(p.proacl, '{}'::aclitem[])) a
       where p.oid = fn::regprocedure and a::text like '=%'),
      format('FV-671 FAIL: PUBLIC holds EXECUTE on %s', fn);
  end loop;

  -- SECURITY DEFINER + pinned empty search_path on every function.
  assert not exists (
    select 1 from pg_proc p
     where p.oid in (
       'public.complete_pending_profile(text, text, date, text)'::regprocedure,
       'public.cancel_my_pending_account()'::regprocedure,
       'public.reaper_mark(uuid)'::regprocedure,
       'public.finalize_pending_deletion(uuid)'::regprocedure,
       'public.block_profile_when_pending_deletion()'::regprocedure,
       'private.is_unestablished(uuid)'::regprocedure)
       and not (p.prosecdef and coalesce(p.proconfig, '{}') @> array['search_path=""'])),
    'FV-671 FAIL: a lock function is not SECURITY DEFINER with search_path = ''''';

  -- cancel_my_pending_account takes no parameters (cannot name another user).
  assert (select pronargs from pg_proc where oid = 'public.cancel_my_pending_account()'::regprocedure) = 0,
    'FV-671 FAIL: cancel_my_pending_account must take NO parameters';
end $$;

-- Effect probes.
do $$
declare
  p uuid := '10000000-0000-4000-8000-000000000001';
begin
  assert pg_temp.run('authenticated', p, format('select public.reaper_mark(%L)', p)) like 'ERR:%',
    'FV-671 FAIL: authenticated can call reaper_mark';
  assert pg_temp.run('authenticated', p, format('select public.finalize_pending_deletion(%L)', p)) like 'ERR:%',
    'FV-671 FAIL: authenticated can call finalize_pending_deletion';
  assert pg_temp.run('anon', null, 'select public.cancel_my_pending_account()') like 'ERR:%',
    'FV-671 FAIL: anon can call cancel_my_pending_account';
  assert pg_temp.run('anon', null, 'select public.complete_pending_profile(''parent'', ''X'')') like 'ERR:%',
    'FV-671 FAIL: anon can call complete_pending_profile';
  assert pg_temp.run('anon', null, format('select public.reaper_mark(%L)', p)) like 'ERR:%',
    'FV-671 FAIL: anon can call reaper_mark';
  assert pg_temp.run('service_role', null, 'select public.complete_pending_profile(''parent'', ''X'')') like 'ERR:%',
    'FV-671 FAIL: service_role can call complete_pending_profile (must act only for authenticated callers)';
end $$;

-- ---------------------------------------------------------------------------
-- (c1) Completion: created, then the two-tab case -> already_complete
-- ---------------------------------------------------------------------------
begin;
  select pg_temp.mk_user('91000000-0000-4000-8000-000000000001', 'pend1@rls.test', true, '["email"]');
  do $$
  declare u uuid := '91000000-0000-4000-8000-000000000001'; r text;
  begin
    r := pg_temp.run('authenticated', u, 'select public.complete_pending_profile(''parent'', ''  Pat  '')');
    assert r = 'created', format('FV-671 FAIL: first completion returned %s', r);
    r := pg_temp.run('authenticated', u, 'select public.complete_pending_profile(''parent'', ''Other'')');
    assert r = 'already_complete', format('FV-671 FAIL: second completion returned %s', r);
    assert (select count(*) from public.profiles where id = u) = 1
       and (select first_name from public.profiles where id = u) = 'Pat'
       and (select role from public.profiles where id = u) = 'parent',
      'FV-671 FAIL: two-tab completion wrote more than one / the wrong profile row';
    assert not exists (select 1 from private.pending_account_deletions where user_id = u),
      'FV-671 FAIL: completion left a tombstone';
  end $$;
rollback;

-- Adult: created with birthdate + sport + sport_selected_at.
begin;
  select pg_temp.mk_user('91000000-0000-4000-8000-000000000002', 'pend2@rls.test', true, '["email"]');
  do $$
  declare u uuid := '91000000-0000-4000-8000-000000000002'; r text;
  begin
    r := pg_temp.run('authenticated', u,
      'select public.complete_pending_profile(''adult_athlete'', ''Sam'', date ''1990-05-05'', ''hockey'')');
    assert r = 'created', format('FV-671 FAIL: adult completion returned %s', r);
    assert (select birthdate = date '1990-05-05' and sport = 'hockey' and sport_selected_at is not null
              from public.profiles where id = u),
      'FV-671 FAIL: adult profile fields not written';
  end $$;
rollback;

-- Validation + verification backstops.
begin;
  select pg_temp.mk_user('91000000-0000-4000-8000-000000000003', 'pend3@rls.test', true, '["email"]');
  select pg_temp.mk_user('91000000-0000-4000-8000-000000000004', 'pend4@rls.test', false, '["email"]');
  select pg_temp.mk_user('91000000-0000-4000-8000-000000000005', 'pend5@relay.test', false, '["apple"]');
  do $$
  declare r text;
  begin
    -- 'athlete' is never self-service; empty/over-long names; parent with a birthdate.
    r := pg_temp.run('authenticated', '91000000-0000-4000-8000-000000000003',
      'select public.complete_pending_profile(''athlete'', ''X'', date ''2010-01-01'', ''hockey'')');
    assert r = 'ERR:invalid_input', format('FV-671 FAIL: athlete self-completion returned %s', r);
    r := pg_temp.run('authenticated', '91000000-0000-4000-8000-000000000003',
      'select public.complete_pending_profile(''parent'', ''   '')');
    assert r = 'ERR:invalid_input', format('FV-671 FAIL: blank first_name returned %s', r);
    r := pg_temp.run('authenticated', '91000000-0000-4000-8000-000000000003',
      format('select public.complete_pending_profile(''parent'', %L)', repeat('a', 51)));
    assert r = 'ERR:invalid_input', format('FV-671 FAIL: 51-char first_name returned %s', r);
    r := pg_temp.run('authenticated', '91000000-0000-4000-8000-000000000003',
      'select public.complete_pending_profile(''parent'', ''P'', date ''1980-01-01'')');
    assert r = 'ERR:invalid_input', format('FV-671 FAIL: parent with birthdate returned %s', r);
    r := pg_temp.run('authenticated', '91000000-0000-4000-8000-000000000003',
      'select public.complete_pending_profile(''adult_athlete'', ''P'', null, ''hockey'')');
    assert r = 'ERR:invalid_input', format('FV-671 FAIL: adult without birthdate returned %s', r);
    assert not exists (select 1 from public.profiles where id = '91000000-0000-4000-8000-000000000003'),
      'FV-671 FAIL: an invalid completion wrote a profile';
    assert not exists (select 1 from private.pending_account_deletions),
      'FV-671 FAIL: an invalid completion wrote a tombstone';

    -- Unverified email, no provider -> refused. Apple provider, unconfirmed email -> allowed.
    r := pg_temp.run('authenticated', '91000000-0000-4000-8000-000000000004',
      'select public.complete_pending_profile(''parent'', ''P'')');
    assert r = 'ERR:account_unverified', format('FV-671 FAIL: unverified account returned %s', r);
    r := pg_temp.run('authenticated', '91000000-0000-4000-8000-000000000005',
      'select public.complete_pending_profile(''parent'', ''P'')');
    assert r = 'created', format('FV-671 FAIL: apple-provider account returned %s', r);

    -- No session at all.
    r := pg_temp.run('authenticated', null, 'select public.complete_pending_profile(''parent'', ''P'')');
    assert r like 'ERR:%', 'FV-671 FAIL: completion without auth.uid() succeeded';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (c2) Under-18 adult on a PENDING account -> tombstone, account_closing,
--      direct profile insert blocked, finalize deletes (and cascades).
-- ---------------------------------------------------------------------------
begin;
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000001', 'under1@rls.test', true, '["email"]');
  insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
    values ('92000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001',
            '{"sub":"92000000-0000-4000-8000-000000000001"}', 'email', now(), now());
  insert into auth.sessions (id, user_id, created_at, updated_at)
    values ('92100000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001', now(), now());
  do $$
  declare u uuid := '92000000-0000-4000-8000-000000000001'; r text;
  begin
    r := pg_temp.run('authenticated', u,
      format('select public.complete_pending_profile(''adult_athlete'', ''Kid'', %L::date, ''hockey'')',
             (current_date - interval '17 years')::date));
    assert r = 'reject_underage', format('FV-671 FAIL: under-18 returned %s', r);
    assert (select reason from private.pending_account_deletions where user_id = u) = 'underage',
      'FV-671 FAIL: under-18 tombstone reason is not underage';
    assert not exists (select 1 from public.profiles where id = u),
      'FV-671 FAIL: an under-18 adult completion wrote a profile';
    assert not exists (select 1 from information_schema.columns
                        where table_schema = 'private' and table_name = 'pending_account_deletions'
                          and column_name ilike '%birth%'),
      'FV-671 FAIL: the tombstone stores a birthdate';
    -- exactly 18 today is an adult (boundary), exactly one day short is not.
    r := pg_temp.run('authenticated', u, 'select public.complete_pending_profile(''parent'', ''P'')');
    assert r = 'ERR:account_closing', format('FV-671 FAIL: completion after tombstone returned %s', r);
    begin
      insert into public.profiles (id, role, first_name) values (u, 'parent', 'Direct');
      assert false, 'FV-671 FAIL: a direct profile insert succeeded while tombstoned';
    exception when others then
      assert sqlerrm = 'account_closing', format('FV-671 FAIL: direct insert failed with %s', sqlerrm);
    end;

    -- cancel is idempotent and keeps the underage reason
    r := pg_temp.run('authenticated', u, 'select public.cancel_my_pending_account()');
    assert r = 'marked', format('FV-671 FAIL: cancel on tombstoned returned %s', r);
    assert (select reason from private.pending_account_deletions where user_id = u) = 'underage',
      'FV-671 FAIL: cancel overwrote the underage reason';

    -- finalize: only service_role may; it deletes the user and cascades.
    r := pg_temp.run('service_role', null, format('select public.finalize_pending_deletion(%L)', u));
    assert r = 'deleted', format('FV-671 FAIL: finalize returned %s', r);
    assert not exists (select 1 from auth.users where id = u), 'FV-671 FAIL: user survived finalize';
    assert not exists (select 1 from auth.identities where user_id = u), 'FV-671 FAIL: identity survived finalize';
    assert not exists (select 1 from auth.sessions where user_id = u), 'FV-671 FAIL: session survived finalize';
    assert not exists (select 1 from private.pending_account_deletions where user_id = u),
      'FV-671 FAIL: tombstone survived finalize';
  end $$;
rollback;

-- Age boundary: exactly 18 today is allowed; 18 years minus one day is rejected.
begin;
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000002', 'edge1@rls.test', true, '["email"]');
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000003', 'edge2@rls.test', true, '["email"]');
  select pg_temp.mk_user('92000000-0000-4000-8000-000000000004', 'edge3@rls.test', true, '["email"]');
  do $$
  declare r text;
  begin
    r := pg_temp.run('authenticated', '92000000-0000-4000-8000-000000000002',
      format('select public.complete_pending_profile(''adult_athlete'', ''E'', %L::date, ''golf'')',
             (current_date - interval '18 years')::date));
    assert r = 'created', format('FV-671 FAIL: exactly-18 returned %s', r);
    r := pg_temp.run('authenticated', '92000000-0000-4000-8000-000000000003',
      format('select public.complete_pending_profile(''adult_athlete'', ''E'', %L::date, ''golf'')',
             (current_date - interval '18 years' + interval '1 day')::date));
    assert r = 'reject_underage', format('FV-671 FAIL: 18-years-minus-a-day returned %s', r);
    r := pg_temp.run('authenticated', '92000000-0000-4000-8000-000000000004',
      format('select public.complete_pending_profile(''adult_athlete'', ''E'', %L::date, ''golf'')',
             (current_date + interval '1 day')::date));
    assert r = 'reject_underage', format('FV-671 FAIL: a future birthdate returned %s', r);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (c3) An under-18 resubmission against an ESTABLISHED account never deletes.
-- ---------------------------------------------------------------------------
begin;
  select pg_temp.mk_user('93000000-0000-4000-8000-000000000001', 'est1@rls.test', true, '["email"]');
  insert into public.profiles (id, role, first_name) values ('93000000-0000-4000-8000-000000000001', 'parent', 'Est');
  do $$
  declare u uuid := '93000000-0000-4000-8000-000000000001'; r text;
  begin
    r := pg_temp.run('authenticated', u,
      format('select public.complete_pending_profile(''adult_athlete'', ''Kid'', %L::date, ''hockey'')',
             (current_date - interval '15 years')::date));
    assert r = 'already_complete', format('FV-671 FAIL: under-18 resubmission on established account returned %s', r);
    assert not exists (select 1 from private.pending_account_deletions where user_id = u),
      'FV-671 FAIL: resubmission on an established account wrote a tombstone';
    -- cancel / reaper_mark / finalize on an established account: not_pending / no_tombstone
    r := pg_temp.run('authenticated', u, 'select public.cancel_my_pending_account()');
    assert r = 'not_pending', format('FV-671 FAIL: cancel on established returned %s', r);
    r := pg_temp.run('service_role', null, format('select public.reaper_mark(%L)', u));
    assert r = 'not_pending', format('FV-671 FAIL: reaper_mark on established returned %s', r);
    r := pg_temp.run('service_role', null, format('select public.finalize_pending_deletion(%L)', u));
    assert r = 'no_tombstone', format('FV-671 FAIL: finalize on established returned %s', r);
    assert exists (select 1 from auth.users where id = u), 'FV-671 FAIL: established account deleted';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (c4) Cancel vs complete (sequenced): cancel first -> completion is
--      account_closing; completion first -> cancel is not_pending, nothing
--      deleted. Same for reaper_mark.
-- ---------------------------------------------------------------------------
begin;
  select pg_temp.mk_user('94000000-0000-4000-8000-000000000001', 'cc1@rls.test', true, '["email"]');
  select pg_temp.mk_user('94000000-0000-4000-8000-000000000002', 'cc2@rls.test', true, '["email"]');
  select pg_temp.mk_user('94000000-0000-4000-8000-000000000003', 'cc3@rls.test', true, '["email"]');
  select pg_temp.mk_user('94000000-0000-4000-8000-000000000004', 'cc4@rls.test', true, '["email"]');
  do $$
  declare r text; u uuid;
  begin
    -- cancel first
    u := '94000000-0000-4000-8000-000000000001';
    r := pg_temp.run('authenticated', u, 'select public.cancel_my_pending_account()');
    assert r = 'marked', format('FV-671 FAIL: cancel returned %s', r);
    assert (select reason from private.pending_account_deletions where user_id = u) = 'cancel', 'FV-671 FAIL: cancel reason';
    r := pg_temp.run('authenticated', u, 'select public.complete_pending_profile(''parent'', ''P'')');
    assert r = 'ERR:account_closing', format('FV-671 FAIL: completion after cancel returned %s', r);
    -- finalize deletes
    r := pg_temp.run('service_role', null, format('select public.finalize_pending_deletion(%L)', u));
    assert r = 'deleted', format('FV-671 FAIL: finalize after cancel returned %s', r);
    -- finalize again: nothing left
    r := pg_temp.run('service_role', null, format('select public.finalize_pending_deletion(%L)', u));
    assert r = 'no_tombstone', format('FV-671 FAIL: second finalize returned %s', r);

    -- completion first
    u := '94000000-0000-4000-8000-000000000002';
    r := pg_temp.run('authenticated', u, 'select public.complete_pending_profile(''parent'', ''P'')');
    assert r = 'created';
    r := pg_temp.run('authenticated', u, 'select public.cancel_my_pending_account()');
    assert r = 'not_pending', format('FV-671 FAIL: cancel after completion returned %s', r);
    assert exists (select 1 from auth.users where id = u) and exists (select 1 from public.profiles where id = u),
      'FV-671 FAIL: cancel after completion deleted something';

    -- reaper first
    u := '94000000-0000-4000-8000-000000000003';
    r := pg_temp.run('service_role', null, format('select public.reaper_mark(%L)', u));
    assert r = 'marked', format('FV-671 FAIL: reaper_mark returned %s', r);
    assert (select reason from private.pending_account_deletions where user_id = u) = 'reaper', 'FV-671 FAIL: reaper reason';
    r := pg_temp.run('authenticated', u, 'select public.complete_pending_profile(''parent'', ''P'')');
    assert r = 'ERR:account_closing', format('FV-671 FAIL: completion after reaper_mark returned %s', r);

    -- completion first, then reaper
    u := '94000000-0000-4000-8000-000000000004';
    r := pg_temp.run('authenticated', u, 'select public.complete_pending_profile(''parent'', ''P'')');
    assert r = 'created';
    r := pg_temp.run('service_role', null, format('select public.reaper_mark(%L)', u));
    assert r = 'not_pending', format('FV-671 FAIL: reaper_mark after completion returned %s', r);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (c5) Finalize re-check: established data appears between the tombstone and
--      finalize -> not_pending, tombstone removed, NO user deleted, completion
--      works afterwards. One scenario per data source the predicate lists.
--      (The profile FK is dropped inside the rolled-back transaction so the row
--      can exist without a profile — i.e. the predicate is exercised on its own.)
-- ---------------------------------------------------------------------------
create function pg_temp.est_scenario(p_n int, p_setup text, p_label text)
returns void
language plpgsql
as $$
declare
  u uuid := ('95000000-0000-4000-8000-' || lpad(p_n::text, 12, '0'))::uuid;
  r text;
begin
  perform pg_temp.mk_user(u, 'est' || p_n || '@rls.test', true, '["email"]');
  r := pg_temp.run('authenticated', u, 'select public.cancel_my_pending_account()');
  assert r = 'marked', format('FV-671 FAIL [%s]: cancel returned %s', p_label, r);
  execute replace(p_setup, '$uid', quote_literal(u::text));
  r := pg_temp.run('service_role', null, format('select public.finalize_pending_deletion(%L)', u));
  assert r = 'not_pending', format('FV-671 FAIL [%s]: finalize returned %s (data appeared -> must be not_pending)', p_label, r);
  assert exists (select 1 from auth.users where id = u), format('FV-671 FAIL [%s]: user was deleted', p_label);
  assert not exists (select 1 from private.pending_account_deletions where user_id = u),
    format('FV-671 FAIL [%s]: tombstone not removed on not_pending', p_label);
  -- and marking paths refuse an account that already has the data
  r := pg_temp.run('authenticated', u, 'select public.cancel_my_pending_account()');
  assert r = 'not_pending', format('FV-671 FAIL [%s]: cancel on established returned %s', p_label, r);
  r := pg_temp.run('service_role', null, format('select public.reaper_mark(%L)', u));
  assert r = 'not_pending', format('FV-671 FAIL [%s]: reaper_mark on established returned %s', p_label, r);
end $$;

begin;
  alter table public.subscriptions         drop constraint subscriptions_parent_id_fkey;
  alter table public.apple_subscriptions   drop constraint apple_subscriptions_payer_id_fkey;
  alter table public.apple_purchase_tokens drop constraint apple_purchase_tokens_payer_id_fkey;
  alter table public.apple_sandbox_testers drop constraint apple_sandbox_testers_payer_id_fkey;
  alter table public.access_grants         drop constraint access_grants_parent_id_fkey;
  alter table public.parent_athlete_links  drop constraint parent_athlete_links_parent_id_fkey;
  alter table public.parent_athlete_links  drop constraint parent_athlete_links_athlete_id_fkey;
  alter table public.parent_athlete_links  disable trigger user;
  select pg_temp.est_scenario(1, 'insert into public.subscriptions (parent_id, stripe_customer_id, status) values ($uid, ''cus_x'', ''active'')', 'stripe subscription');
  select pg_temp.est_scenario(2, 'insert into public.apple_subscriptions (payer_id, environment, original_transaction_id, product_id, status, expires_at, app_account_token, last_signed_date) values ($uid, ''Production'', ''otx1'', ''p'', ''subscribed'', now() + interval ''1 day'', gen_random_uuid(), now())', 'apple subscription');
  select pg_temp.est_scenario(3, 'insert into public.apple_purchase_tokens (payer_id) values ($uid)', 'apple purchase token');
  select pg_temp.est_scenario(4, 'insert into public.apple_sandbox_testers (payer_id) values ($uid)', 'apple sandbox tester');
  select pg_temp.est_scenario(5, 'insert into public.access_grants (parent_id) values ($uid)', 'comp grant');
  select pg_temp.est_scenario(6, 'insert into public.parent_athlete_links (parent_id, athlete_id) values ($uid, gen_random_uuid())', 'athlete link (as parent)');
  select pg_temp.est_scenario(7, 'insert into public.parent_athlete_links (parent_id, athlete_id) values (gen_random_uuid(), $uid)', 'athlete link (as athlete)');
  -- The trigger would (correctly) refuse this insert; disable it to prove that the
  -- finalize re-check is an independent second line of defense.
  alter table public.profiles disable trigger profiles_block_pending_deletion;
  select pg_temp.est_scenario(8, 'insert into public.profiles (id, role, first_name) values ($uid, ''parent'', ''Late'')', 'profile appears after the tombstone');
rollback;

-- A tombstone that finalize drops on not_pending does not block completion.
begin;
  select pg_temp.mk_user('96000000-0000-4000-8000-000000000001', 'again@rls.test', true, '["email"]');
  do $$
  declare u uuid := '96000000-0000-4000-8000-000000000001'; r text;
  begin
    -- mark, then make it non-deletable by synthetic-ifying the email, finalize -> not_pending
    r := pg_temp.run('authenticated', u, 'select public.cancel_my_pending_account()');
    assert r = 'marked';
    update auth.users set email = 'athlete-96@athletes.fromvictory.app' where id = u;
    r := pg_temp.run('service_role', null, format('select public.finalize_pending_deletion(%L)', u));
    assert r = 'not_pending', format('FV-671 FAIL: synthetic athlete finalize returned %s', r);
    assert exists (select 1 from auth.users where id = u), 'FV-671 FAIL: synthetic athlete account deleted';
    r := pg_temp.run('authenticated', u, 'select public.complete_pending_profile(''parent'', ''P'')');
    assert r = 'created', format('FV-671 FAIL: completion after not_pending returned %s', r);
  end $$;
rollback;

-- Unknown ids and synthetic athletes are never markable.
begin;
  select pg_temp.mk_user('97000000-0000-4000-8000-000000000001', 'athlete-97@athletes.fromvictory.app', true, '["email"]');
  do $$
  declare r text;
  begin
    r := pg_temp.run('service_role', null, 'select public.reaper_mark(''97000000-0000-4000-8000-000000000001'')');
    assert r = 'not_pending', format('FV-671 FAIL: reaper_mark on a synthetic athlete returned %s', r);
    r := pg_temp.run('authenticated', '97000000-0000-4000-8000-000000000001', 'select public.cancel_my_pending_account()');
    assert r = 'not_pending', format('FV-671 FAIL: cancel on a synthetic athlete returned %s', r);
    r := pg_temp.run('service_role', null, 'select public.reaper_mark(gen_random_uuid())');
    assert r = 'not_pending', format('FV-671 FAIL: reaper_mark on an unknown id returned %s', r);
    r := pg_temp.run('service_role', null, 'select public.finalize_pending_deletion(gen_random_uuid())');
    assert r = 'no_tombstone', format('FV-671 FAIL: finalize on an unknown id returned %s', r);
    assert not exists (select 1 from private.pending_account_deletions), 'FV-671 FAIL: stray tombstone';
  end $$;
rollback;

-- Existing real sign-up shape still works: the legacy direct profile insert
-- (no tombstone) is unaffected by the new trigger.
begin;
  select pg_temp.mk_user('98000000-0000-4000-8000-000000000001', 'legacy@rls.test', true, '["email"]');
  do $$
  declare u uuid := '98000000-0000-4000-8000-000000000001'; r text;
  begin
    r := pg_temp.run('authenticated', u, format(
      'with i as (insert into public.profiles (id, role, first_name) values (%L, ''parent'', ''L'') returning 1) select count(*)::text from i', u));
    assert r = '1', format('FV-671 FAIL: a plain profile insert is broken by the trigger: %s', r);
  end $$;
rollback;

\echo '  [PASS] 23_pending_accounts (FV-671: private schema deny-all, exact EXECUTE grants, lock-function behavior, finalize re-check)'
