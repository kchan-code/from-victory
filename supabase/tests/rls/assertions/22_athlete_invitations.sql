-- =============================================================================
-- RLS / function assertions — athlete invitations + recovery (FV-630)
--
-- Migration under test: 20261106120000_athlete_invitations.sql
--
--   (a) Grants: issue/claim/release are service-role only; the status read is
--       authenticated + service_role, never anon.
--   (b) Status read is scoped to auth.uid()'s linked athletes and carries no
--       code, hash, or username (shape check).
--   (c) Issue: unlinked parent refused; replacement leaves exactly one live
--       code; a replaced code cannot be claimed.
--   (d) Claim: missing / taken username rolls back WITHOUT burning the code;
--       a good claim sets the username; replay returns nothing.
--   (e) Recovery: a set-up account's code is purpose=recovery and the claim
--       never changes the username, whatever is sent.
--   (f) Expiry: an expired code cannot be claimed and cannot be released
--       back to life; release never revives a code once replaced. Releasing
--       a failed FIRST setup clears the username it set (no false
--       "account ready"); releasing a recovery keeps it.
--   (h) signed_in_before flags pre-username (FV-320) accounts that train on
--       a device, so the dashboard doesn't call them "not invited".
--   (g) The one-live-code invariant holds even for a direct insert.
--
-- Fixtures (fixtures.sql): parent P links athlete A; parent Q and athlete B
-- are unrelated. Every block runs in a transaction that is ROLLED BACK.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a) Grants
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.issue_athlete_invite(uuid, uuid, text, timestamptz, timestamptz)',
    'public.claim_athlete_invite(text, text)',
    'public.release_athlete_invite(text, timestamptz, boolean)'
  ]
  loop
    assert not has_function_privilege('anon', fn, 'execute'),
      format('FV-630 FAIL: anon HAS EXECUTE on %s (must be service-role only)', fn);
    assert not has_function_privilege('authenticated', fn, 'execute'),
      format('FV-630 FAIL: authenticated HAS EXECUTE on %s (must be service-role only)', fn);
    assert has_function_privilege('service_role', fn, 'execute'),
      format('FV-630 FAIL: service_role missing EXECUTE on %s', fn);
  end loop;

  assert not has_function_privilege('anon', 'public.get_athlete_invite_statuses()', 'execute'),
    'FV-630 FAIL: anon HAS EXECUTE on get_athlete_invite_statuses()';
  assert has_function_privilege('authenticated', 'public.get_athlete_invite_statuses()', 'execute'),
    'FV-630 FAIL: authenticated missing EXECUTE on get_athlete_invite_statuses()';
end $$;

-- ---------------------------------------------------------------------------
-- (b) Status read scoping + shape
-- ---------------------------------------------------------------------------
do $$
declare
  cols text[];
begin
  select array_agg(a.attname::text order by a.attname)
    into cols
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral unnest(p.proargnames, p.proargmodes) as a(attname, mode)
   where n.nspname = 'public'
     and p.proname = 'get_athlete_invite_statuses'
     and a.mode = 't';
  assert cols = array['account_ready', 'athlete_id', 'pending_expires_at', 'pending_purpose', 'signed_in_before'],
    format('FV-630 FAIL: get_athlete_invite_statuses() columns changed to %s — it must never return a code, hash, or username', cols);
end $$;

-- Parent P sees exactly their one linked athlete (A).
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare n int; a uuid;
  begin
    select count(*), min(athlete_id::text)::uuid into n, a from public.get_athlete_invite_statuses();
    assert n = 1 and a = '20000000-0000-4000-8000-00000000000a',
      format('FV-630 FAIL: parent P status rows = %s (expected only athlete A)', n);
  end $$;
rollback;

-- Unrelated parent Q, athlete A, and athlete B each see zero rows.
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
  set local role authenticated;
  do $$ begin
    assert (select count(*) from public.get_athlete_invite_statuses()) = 0,
      'FV-630 FAIL: unrelated parent Q can read invite status';
  end $$;
rollback;

begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$ begin
    assert (select count(*) from public.get_athlete_invite_statuses()) = 0,
      'FV-630 FAIL: athlete A can read invite status rows';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (c)–(g) Issue / claim / recovery / expiry, as service_role
-- ---------------------------------------------------------------------------
begin;
  set local role service_role;
  do $$
  declare
    r record;
    p constant uuid := '10000000-0000-4000-8000-000000000001';
    q constant uuid := '10000000-0000-4000-8000-000000000002';
    a constant uuid := '20000000-0000-4000-8000-00000000000a';
  begin
    -- Start A as "not set up" regardless of earlier files.
    update public.profiles set username = null where id = a;

    -- (c) unlinked parent refused
    begin
      perform public.issue_athlete_invite(q, a, repeat('a', 64), now() + interval '7 days', now() + interval '1 day');
      raise exception 'FV-630 FAIL: unlinked parent Q issued a code for athlete A';
    exception when insufficient_privilege then null;
    end;

    -- (c) issue + replace
    select * into r from public.issue_athlete_invite(p, a, repeat('a', 64), now() + interval '7 days', now() + interval '1 day');
    assert r.purpose = 'invite', format('FV-630 FAIL: expected invite purpose, got %s', r.purpose);
    perform public.issue_athlete_invite(p, a, repeat('b', 64), now() + interval '7 days', now() + interval '1 day');
    assert (select count(*) from public.device_pairings where athlete_id = a and consumed_at is null) = 1,
      'FV-630 FAIL: replacement left more than one live code';
    assert not exists (select 1 from public.claim_athlete_invite(repeat('a', 64), 'ava_rls')),
      'FV-630 FAIL: a replaced code was claimable';

    -- (d) missing username: rolls back, code not burned
    begin
      perform * from public.claim_athlete_invite(repeat('b', 64), null);
      raise exception 'FV-630 FAIL: invite claim without username succeeded';
    exception when invalid_parameter_value then null;
    end;
    assert (select consumed_at from public.device_pairings where code_sha256 = repeat('b', 64)) is null,
      'FV-630 FAIL: missing-username claim burned the code';

    -- (d) taken username: rolls back, code not burned, username unchanged
    update public.profiles set username = 'rls_taken' where id = '20000000-0000-4000-8000-00000000000b';
    begin
      perform * from public.claim_athlete_invite(repeat('b', 64), 'rls_taken');
      raise exception 'FV-630 FAIL: claim with a taken username succeeded';
    exception when unique_violation then null;
    end;
    assert (select consumed_at from public.device_pairings where code_sha256 = repeat('b', 64)) is null,
      'FV-630 FAIL: taken-username claim burned the code';
    assert (select username from public.profiles where id = a) is null,
      'FV-630 FAIL: taken-username claim left a username behind';

    -- (d) good claim + replay
    select * into r from public.claim_athlete_invite(repeat('b', 64), 'ava_rls');
    assert r.athlete_id = a and r.username = 'ava_rls' and r.purpose = 'invite',
      'FV-630 FAIL: good invite claim did not return athlete A / ava_rls';
    assert not exists (select 1 from public.claim_athlete_invite(repeat('b', 64), 'ava_rls')),
      'FV-630 FAIL: replay of a consumed code returned a row';

    -- (f) failed FIRST setup: release with clear → username gone, code live
    update public.profiles set username = null where id = a;
    perform public.issue_athlete_invite(p, a, repeat('8', 64), now() + interval '7 days', now() + interval '1 day');
    select * into r from public.claim_athlete_invite(repeat('8', 64), 'ava_first');
    assert public.release_athlete_invite(repeat('8', 64), r.consumed_at, true) = true,
      'FV-630 FAIL: release after a failed first setup did not revive the code';
    assert (select username from public.profiles where id = a) is null,
      'FV-630 FAIL: release after a failed first setup left the username set';
    select * into r from public.claim_athlete_invite(repeat('8', 64), 'ava_rls');
    assert r.username = 'ava_rls' and r.purpose = 'invite',
      'FV-630 FAIL: retry after a failed first setup could not choose a new username';

    -- (e) recovery keeps the username
    select * into r from public.issue_athlete_invite(p, a, repeat('c', 64), now() + interval '7 days', now() + interval '1 day');
    assert r.purpose = 'recovery' and r.expires_at < now() + interval '2 days',
      'FV-630 FAIL: set-up account did not get a short-lived recovery code';
    select * into r from public.claim_athlete_invite(repeat('c', 64), 'someone_else');
    assert r.purpose = 'recovery' and r.username = 'ava_rls',
      'FV-630 FAIL: recovery claim changed or lost the username';
    assert (select username from public.profiles where id = a) = 'ava_rls',
      'FV-630 FAIL: recovery claim modified profiles.username';

    -- (f) release revives exactly this claim once; never after replacement
    assert public.release_athlete_invite(repeat('c', 64), r.consumed_at, false) = true,
      'FV-630 FAIL: exact release did not revive the code';
    assert (select username from public.profiles where id = a) = 'ava_rls',
      'FV-630 FAIL: releasing a recovery claim cleared the username';
    assert public.release_athlete_invite(repeat('c', 64), r.consumed_at, false) = false,
      'FV-630 FAIL: release was not idempotent';
    select * into r from public.claim_athlete_invite(repeat('c', 64), null);
    perform public.issue_athlete_invite(p, a, repeat('d', 64), now() + interval '7 days', now() + interval '1 day');
    assert public.release_athlete_invite(repeat('c', 64), r.consumed_at, false) = false,
      'FV-630 FAIL: release revived a code after a replacement was issued';

    -- (f) expired code is dead
    update public.device_pairings
       set created_at = now() - interval '2 days', expires_at = now() - interval '1 second'
     where code_sha256 = repeat('d', 64);
    assert not exists (select 1 from public.claim_athlete_invite(repeat('d', 64), null)),
      'FV-630 FAIL: expired code was claimable';

    -- (g) one live code per athlete, even for a direct insert
    perform public.issue_athlete_invite(p, a, repeat('e', 64), now() + interval '7 days', now() + interval '1 day');
    begin
      insert into public.device_pairings (code_sha256, athlete_id, created_by, expires_at)
      values (repeat('f', 64), a, p, now() + interval '1 day');
      raise exception 'FV-630 FAIL: a second live code was insertable for one athlete';
    exception when unique_violation then null;
    end;
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (h) signed_in_before: false for a never-signed-in athlete, true once the
--     auth user has signed in (boolean only — no timestamp is exposed).
-- ---------------------------------------------------------------------------
begin;
  update public.profiles set username = null where id = '20000000-0000-4000-8000-00000000000a';
  update auth.users set last_sign_in_at = null where id = '20000000-0000-4000-8000-00000000000a';
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$ begin
    assert (select signed_in_before from public.get_athlete_invite_statuses()
             where athlete_id = '20000000-0000-4000-8000-00000000000a') = false,
      'FV-630 FAIL: signed_in_before true for an athlete who never signed in';
  end $$;
  reset role;
  update auth.users set last_sign_in_at = now() where id = '20000000-0000-4000-8000-00000000000a';
  set local role authenticated;
  do $$ begin
    assert (select signed_in_before from public.get_athlete_invite_statuses()
             where athlete_id = '20000000-0000-4000-8000-00000000000a') = true,
      'FV-630 FAIL: signed_in_before false for a legacy athlete who signs in on a device';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (i) FV-634: case-insensitive collision at the DB layer. A username stored
--     with capitals still blocks its lowercase form (lower() unique index);
--     the claim rolls back, the invite stays live, and a mixed-case value can
--     never be written through the claim (the app lowercases first; the RPC
--     refuses anything outside [a-z0-9_]).
-- ---------------------------------------------------------------------------
begin;
  set local role service_role;
  do $$
  declare
    p constant uuid := '10000000-0000-4000-8000-000000000001';
    a constant uuid := '20000000-0000-4000-8000-00000000000a';
    r record;
  begin
    update public.profiles set username = 'RLS_Mixed' where id = '20000000-0000-4000-8000-00000000000b';
    update public.profiles set username = null where id = a;
    perform public.issue_athlete_invite(p, a, repeat('6', 64), now() + interval '7 days', now() + interval '1 day');

    begin
      perform * from public.claim_athlete_invite(repeat('6', 64), 'rls_mixed');
      raise exception 'FV-634 FAIL: lowercase claim of a mixed-case-stored username succeeded';
    exception when unique_violation then null;
    end;
    assert (select consumed_at from public.device_pairings where code_sha256 = repeat('6', 64)) is null,
      'FV-634 FAIL: case-insensitive collision consumed the invite';

    begin
      perform * from public.claim_athlete_invite(repeat('6', 64), 'Ava_Upper');
      raise exception 'FV-634 FAIL: a mixed-case username was accepted by the claim RPC';
    exception when invalid_parameter_value then null;
    end;

    -- Same invite, a fresh choice, still works after two failed attempts.
    select * into r from public.claim_athlete_invite(repeat('6', 64), 'steady_comet412');
    assert r.athlete_id = a and r.username = 'steady_comet412',
      'FV-634 FAIL: invite unusable after a collision';
  end $$;
rollback;

\echo '  [PASS] 22_athlete_invitations (FV-630 AC a-h, FV-634 i)'
