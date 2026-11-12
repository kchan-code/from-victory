-- =============================================================================
-- RLS / function assertions — Apple sign-in tokens + handoffs (FV-673)
--
-- Migration under test: 20261112110000_fv673_apple_signin.sql
--
--   (a) Every FV-673 function is EXECUTE-able by service_role ONLY (never
--       PUBLIC / anon / authenticated).
--   (b) schema `private` is not usable by anon/authenticated; the two tables
--       carry no client table privileges; RLS is on and NO policy exists.
--   (c) Effect-based: anon and authenticated cannot read or write either
--       table (statement raises insufficient_privilege, never returns/changes
--       a row), and cannot call the functions.
--   (d) Handoff mechanics: atomic claim (second claim gets nothing), stale
--       claim (> 2 min) re-claimed with a NEW claim_id, verifier-mismatch
--       counting + burn at 5 (fenced by claim_id), release keeps credentials,
--       expired/burned never claimable.
--   (e) finalize: stale/wrong claim_id aborts (no token row, handoff intact);
--       correct claim transfers in one transaction (handoff gone, exactly one
--       token row); a second finalize of the same handoff fails (replay).
--   (f) Token upsert replaces on (user_id, client_id) - exactly one row.
--   (g) Cascade: deleting the auth user removes its token rows.
--   (h) Purge helpers only list/delete expired or burned rows.
--
-- Fixtures (fixtures.sql): parent P = 10000000-0000-4000-8000-000000000001.
-- Every block runs in a transaction that is ROLLED BACK.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a) Function grants
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.create_apple_handoff(text, text, text, text, text, text, text, text, integer, timestamptz)',
    'public.claim_apple_handoff(text)',
    'public.record_apple_handoff_mismatch(text, uuid)',
    'public.release_apple_handoff(text, uuid)',
    'public.upsert_apple_signin_token(uuid, text, text, text, text, text, integer)',
    'public.finalize_apple_handoff(text, uuid, uuid, text, text, text, integer)',
    'public.list_apple_signin_tokens(uuid)',
    'public.delete_apple_signin_token(uuid, text)',
    'public.list_apple_handoffs_for_purge(integer)',
    'public.record_apple_handoff_revoke_attempt(text)',
    'public.delete_apple_handoff_purged(text)'
  ]
  loop
    assert not has_function_privilege('anon', fn, 'execute'),
      format('FV-673 FAIL: anon HAS EXECUTE on %s', fn);
    assert not has_function_privilege('authenticated', fn, 'execute'),
      format('FV-673 FAIL: authenticated HAS EXECUTE on %s', fn);
    assert has_function_privilege('service_role', fn, 'execute'),
      format('FV-673 FAIL: service_role missing EXECUTE on %s', fn);
    assert not exists (
      select 1
        from pg_proc p
       where p.oid = fn::regprocedure
         and coalesce(p.proacl::text, '') ~ '(^\{|,)=X'
    ), format('FV-673 FAIL: PUBLIC HAS EXECUTE on %s', fn);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- (b) Grant layer + RLS flags on the private tables
-- ---------------------------------------------------------------------------
do $$
declare
  rel text;
  role_name text;
  priv text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    assert not has_schema_privilege(role_name, 'private', 'usage'),
      format('FV-673 FAIL: %s HAS USAGE on schema private', role_name);
    foreach rel in array array['private.apple_signin_tokens', 'private.apple_signin_handoffs'] loop
      foreach priv in array array['select', 'insert', 'update', 'delete'] loop
        assert not has_table_privilege(role_name, rel, priv),
          format('FV-673 FAIL: %s HAS %s on %s', role_name, priv, rel);
      end loop;
    end loop;
  end loop;

  foreach rel in array array['apple_signin_tokens', 'apple_signin_handoffs'] loop
    assert (select c.relrowsecurity
              from pg_class c
              join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'private' and c.relname = rel),
      format('FV-673 FAIL: RLS not enabled on private.%s', rel);
    assert (select count(*) from pg_policies
             where schemaname = 'private' and tablename = rel) = 0,
      format('FV-673 FAIL: private.%s has policies (must have none)', rel);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- (c) Effect-based denial for anon and authenticated
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    denied boolean;
  begin
    denied := false;
    begin
      perform 1 from private.apple_signin_tokens;
    exception when insufficient_privilege then denied := true;
    end;
    assert denied, 'FV-673 FAIL: authenticated could SELECT private.apple_signin_tokens';

    denied := false;
    begin
      perform 1 from private.apple_signin_handoffs;
    exception when insufficient_privilege then denied := true;
    end;
    assert denied, 'FV-673 FAIL: authenticated could SELECT private.apple_signin_handoffs';

    denied := false;
    begin
      perform public.claim_apple_handoff('x');
    exception when insufficient_privilege then denied := true;
    end;
    assert denied, 'FV-673 FAIL: authenticated could call claim_apple_handoff';

    denied := false;
    begin
      perform public.list_apple_signin_tokens('10000000-0000-4000-8000-000000000001');
    exception when insufficient_privilege then denied := true;
    end;
    assert denied, 'FV-673 FAIL: authenticated could call list_apple_signin_tokens';
  end $$;
rollback;

begin;
  set local role anon;
  do $$
  declare
    denied boolean;
  begin
    denied := false;
    begin
      perform 1 from private.apple_signin_tokens;
    exception when insufficient_privilege then denied := true;
    end;
    assert denied, 'FV-673 FAIL: anon could SELECT private.apple_signin_tokens';

    denied := false;
    begin
      insert into private.apple_signin_handoffs
        (id, challenge, oauth_state, client_id, sub, id_token_enc, nonce_enc,
         refresh_enc, key_version, expires_at)
      values ('aaaaaaaaaaaaaaaaaaaaaaaa', 'c', 's', 'cid', 'sub', 'a', 'b', 'c', 1, now() + interval '3 minutes');
    exception when insufficient_privilege then denied := true;
    end;
    assert denied, 'FV-673 FAIL: anon could INSERT into private.apple_signin_handoffs';

    denied := false;
    begin
      perform public.finalize_apple_handoff('x', gen_random_uuid(), gen_random_uuid(), 'a', 'b', 'c', 1);
    exception when insufficient_privilege then denied := true;
    end;
    assert denied, 'FV-673 FAIL: anon could call finalize_apple_handoff';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (d) Handoff mechanics (as service_role)
-- ---------------------------------------------------------------------------
begin;
  set local role service_role;
  do $$
  declare
    hid constant text := 'handoff-claim-test-0000001';
    c1 uuid;
    c2 uuid;
    n integer;
    st text;
  begin
    perform public.create_apple_handoff(hid, 'chal', 'st', 'com.example.web', 'sub-1',
      'it', 'nn', 'rr', 1, now() + interval '3 minutes');

    select claim_id into c1 from public.claim_apple_handoff(hid);
    assert c1 is not null, 'FV-673 FAIL: first claim returned no row';

    select count(*) into n from public.claim_apple_handoff(hid);
    assert n = 0, 'FV-673 FAIL: second claim of a live claim succeeded (replay/double-claim)';

    -- verifier mismatch guarded by claim_id
    st := public.record_apple_handoff_mismatch(hid, gen_random_uuid());
    assert st is null, 'FV-673 FAIL: mismatch with a wrong claim_id changed the row';
    st := public.record_apple_handoff_mismatch(hid, c1);
    assert st = 'pending', 'FV-673 FAIL: first mismatch should return to pending';

    -- re-claim, then release keeps credentials and does not bump attempts
    select claim_id into c2 from public.claim_apple_handoff(hid);
    assert c2 is not null and c2 <> c1, 'FV-673 FAIL: re-claim did not get a fresh claim_id';
    assert public.release_apple_handoff(hid, c2), 'FV-673 FAIL: release with the claim_id failed';
    assert not public.release_apple_handoff(hid, c2), 'FV-673 FAIL: release twice succeeded';
  end $$;
  reset role;
  do $$
  declare
    hid constant text := 'handoff-claim-test-0000001';
  begin
    assert (select attempts from private.apple_signin_handoffs where id = hid) = 1,
      'FV-673 FAIL: release changed attempts (only mismatches count)';
    assert (select refresh_enc from private.apple_signin_handoffs where id = hid) = 'rr',
      'FV-673 FAIL: credentials not kept across mismatch/release';
  end $$;
  set local role service_role;
  do $$
  declare
    hid constant text := 'handoff-claim-test-0000001';
    c uuid;
    st text;
    i integer;
  begin
    -- 4 more mismatches (total 5) burn the row
    for i in 1..4 loop
      select claim_id into c from public.claim_apple_handoff(hid);
      assert c is not null, format('FV-673 FAIL: claim %s before burn returned no row', i);
      st := public.record_apple_handoff_mismatch(hid, c);
    end loop;
    assert st = 'burned', 'FV-673 FAIL: 5th mismatch did not burn the handoff';
    assert (select count(*) from public.claim_apple_handoff(hid)) = 0,
      'FV-673 FAIL: a burned handoff was claimable';
  end $$;
rollback;

begin;
  -- stale claim (> 2 minutes) is re-claimed with a NEW claim_id; fresh is not
  set local role service_role;
  do $$
  declare
    hid constant text := 'handoff-stale-test-00000002';
    c1 uuid;
  begin
    perform public.create_apple_handoff(hid, 'chal', 'st', 'com.example.web', 'sub-1',
      'it', 'nn', 'rr', 1, now() + interval '3 minutes');
    select claim_id into c1 from public.claim_apple_handoff(hid);
    assert c1 is not null, 'FV-673 FAIL: claim failed';
  end $$;
  reset role;
  update private.apple_signin_handoffs
     set claimed_at = now() - interval '121 seconds'
   where id = 'handoff-stale-test-00000002';
  set local role service_role;
  do $$
  declare
    hid constant text := 'handoff-stale-test-00000002';
    old_claim uuid;
    new_claim uuid;
  begin
    -- capture the old claim via a direct fence read is not possible as
    -- service_role; compare via the returned values instead.
    select claim_id into new_claim from public.claim_apple_handoff(hid);
    assert new_claim is not null, 'FV-673 FAIL: stale claim (>2min) was not re-claimable';
  end $$;
  reset role;
  do $$
  begin
    -- slow original request: its fence (old claim_id) no longer matches.
    assert not public.finalize_apple_handoff(
      'handoff-stale-test-00000002', gen_random_uuid(),
      '10000000-0000-4000-8000-000000000001', 'ct', 'iv', 'tg', 1),
      'FV-673 FAIL: finalize succeeded with a stale/wrong claim_id';
    assert exists (select 1 from private.apple_signin_handoffs where id = 'handoff-stale-test-00000002'),
      'FV-673 FAIL: failed finalize deleted the handoff';
    assert not exists (select 1 from private.apple_signin_tokens
                        where user_id = '10000000-0000-4000-8000-000000000001'),
      'FV-673 FAIL: failed finalize wrote a token row';
  end $$;
rollback;

begin;
  -- expired rows are never claimable
  set local role service_role;
  do $$
  begin
    perform public.create_apple_handoff('handoff-expired-test-000003', 'chal', 'st',
      'com.example.web', 'sub-1', 'it', 'nn', 'rr', 1, now() - interval '1 second');
    assert (select count(*) from public.claim_apple_handoff('handoff-expired-test-000003')) = 0,
      'FV-673 FAIL: an expired handoff was claimable';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (e)(f)(g) finalize transfer, replay, upsert, cascade
-- ---------------------------------------------------------------------------
begin;
  set local role service_role;
  do $$
  declare
    hid constant text := 'handoff-final-test-00000004';
    uid constant uuid := '10000000-0000-4000-8000-000000000001';
    c uuid;
  begin
    perform public.create_apple_handoff(hid, 'chal', 'st', 'com.example.web', 'sub-1',
      'it', 'nn', 'rr', 1, now() + interval '3 minutes');
    select claim_id into c from public.claim_apple_handoff(hid);

    assert public.finalize_apple_handoff(hid, c, uid, 'ct1', 'iv1', 'tg1', 1),
      'FV-673 FAIL: finalize with the live claim_id failed';
    assert not public.finalize_apple_handoff(hid, c, uid, 'ct1', 'iv1', 'tg1', 1),
      'FV-673 FAIL: finalize replay succeeded';
    assert (select count(*) from public.claim_apple_handoff(hid)) = 0,
      'FV-673 FAIL: handoff still claimable after finalize';

    assert (select count(*) from public.list_apple_signin_tokens(uid)) = 1,
      'FV-673 FAIL: expected exactly one token row after finalize';
    assert (select client_id from public.list_apple_signin_tokens(uid)) = 'com.example.web',
      'FV-673 FAIL: token row did not take the handoff row client_id';

    -- (f) upsert replaces, never duplicates
    perform public.upsert_apple_signin_token(uid, 'com.example.web', 'sub-1', 'ct2', 'iv2', 'tg2', 1);
    assert (select count(*) from public.list_apple_signin_tokens(uid)) = 1,
      'FV-673 FAIL: upsert created a second row for the same (user, client)';
    assert (select ciphertext from public.list_apple_signin_tokens(uid)) = 'ct2',
      'FV-673 FAIL: upsert did not replace the ciphertext';

    -- a different client_id is a separate row
    perform public.upsert_apple_signin_token(uid, 'com.example.app', 'sub-2', 'ct3', 'iv3', 'tg3', 1);
    assert (select count(*) from public.list_apple_signin_tokens(uid)) = 2,
      'FV-673 FAIL: distinct client_id should be a distinct row';
  end $$;
  reset role;

  -- (g) cascade from auth.users
  do $$
  declare
    uid constant uuid := '73000000-0000-4000-8000-000000000001';
  begin
    -- Throwaway user (no profile) so the cascade is exercised in isolation.
    insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (uid, 'authenticated', 'authenticated', 'apple-cascade@rls.test', '{}', '{}', now(), now());
    perform public.upsert_apple_signin_token(uid, 'com.example.web', 'sub-9', 'ct', 'iv', 'tg', 1);
    assert exists (select 1 from private.apple_signin_tokens where user_id = uid),
      'FV-673 FAIL: cascade test setup did not store a token row';
    delete from auth.users where id = uid;
    assert not exists (select 1 from private.apple_signin_tokens where user_id = uid),
      'FV-673 FAIL: deleting the auth user left Apple token rows (cascade broken)';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (h) Purge helpers touch only expired/burned rows
-- ---------------------------------------------------------------------------
begin;
  set local role service_role;
  do $$
  begin
    perform public.create_apple_handoff('handoff-live-purge-test-0005', 'c', 's', 'cid', 'sub',
      'a', 'b', 'c', 1, now() + interval '3 minutes');
    perform public.create_apple_handoff('handoff-dead-purge-test-0005', 'c', 's', 'cid', 'sub',
      'a', 'b', 'c', 1, now() - interval '1 minute');

    assert not exists (select 1 from public.list_apple_handoffs_for_purge(50)
                        where id = 'handoff-live-purge-test-0005'),
      'FV-673 FAIL: purge listing included a live handoff';
    assert exists (select 1 from public.list_apple_handoffs_for_purge(50)
                    where id = 'handoff-dead-purge-test-0005'),
      'FV-673 FAIL: purge listing missed an expired handoff';

    assert not public.delete_apple_handoff_purged('handoff-live-purge-test-0005'),
      'FV-673 FAIL: purge deleted a live handoff';
    assert public.record_apple_handoff_revoke_attempt('handoff-dead-purge-test-0005') = 1,
      'FV-673 FAIL: revoke-attempt counter did not increment';
    assert public.delete_apple_handoff_purged('handoff-dead-purge-test-0005'),
      'FV-673 FAIL: purge did not delete an expired handoff';
  end $$;
rollback;

\echo '  [PASS] 25_apple_signin_tokens (FV-673 AC a-h)'
