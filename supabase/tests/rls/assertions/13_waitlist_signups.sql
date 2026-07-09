-- =============================================================================
-- RLS assertions — waitlist_signups  (FV-378)
--
-- waitlist_signups holds landing-page waitlist emails (PII). Migration
-- 20260522180000_waitlist_signups.sql grants only:
--   - anon:          INSERT (the public form, `with check (true)`)
--   - authenticated: SELECT (grant only — no SELECT policy exists, so RLS
--                    denies every row: the "door open, lock engaged" pattern
--                    used elsewhere in this harness, e.g. safety_events).
-- There is NO SELECT grant for anon and NO INSERT grant for authenticated
-- (20260612000000_explicit_table_grants.sql). Those two absent grants must
-- surface as a hard permission-layer denial (SQLSTATE 42501), not a soft
-- 0-row RLS result — this file asserts BOTH denial shapes so a future grant
-- migration can't silently loosen either boundary without turning this red.
--
--   (a) anon CAN insert a waitlist signup (the public form path).
--   (b) anon CANNOT select ANY row — including the one it just inserted —
--       because it has no SELECT grant on the table at all.
--   (c) authenticated (parent P) sees 0 rows — SELECT grant exists but no
--       policy does, so RLS denies every row.
--   (d) authenticated (parent P) CANNOT insert — no INSERT grant for
--       authenticated at all.
--   (e) Superuser (service-role-equivalent) confirms the row from (a) is a
--       real row, not a phantom the earlier assertions imagined.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a)+(b) anon inserts a signup, then cannot read it back (or anything else).
-- ---------------------------------------------------------------------------
begin;
  set local role anon;
  do $$
  declare
    affected int;
  begin
    insert into public.waitlist_signups (email, name, role, sport, note)
      values ('rls-harness-anon@rls.test', 'RLS Harness Anon', 'athlete', 'hockey', null);
    get diagnostics affected = row_count;
    assert affected = 1,
      format('AC(a) FAIL: anon INSERT into waitlist_signups should affect exactly 1 row, got %s', affected);
  end $$;

  do $$
  declare
    ok boolean := false;
  begin
    begin
      perform count(*) from public.waitlist_signups;
    exception
      when insufficient_privilege then
        ok := true;  -- expected: anon has no SELECT grant on this table
    end;
    assert ok,
      'AC(b) FAIL: anon should be permission-denied (42501) reading waitlist_signups, but the SELECT succeeded';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (c) Authenticated (parent P) sees 0 rows (SELECT grant present, no policy).
--     Seed one row as superuser first so "0 visible" is a real RLS denial,
--     not an empty-table artifact.
-- ---------------------------------------------------------------------------
begin;
  insert into public.waitlist_signups (email, name, role, sport, note)
    values ('rls-harness-seed@rls.test', 'RLS Harness Seed', 'parent', 'basketball', null);

  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible from public.waitlist_signups;
    assert visible = 0,
      format('AC(c) FAIL: parent can read %s waitlist_signups rows (must be 0)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (d) Authenticated (parent P) cannot INSERT — no INSERT grant at all, so
--     this must be a hard permission-layer denial (42501), same shape as
--     the subscriptions client-write denial in 03_subscriptions.sql.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  begin
    begin
      insert into public.waitlist_signups (email, name, role, sport, note)
        values ('rls-harness-authenticated@rls.test', 'Attack', 'parent', 'hockey', null);
      raise exception 'AC(d) FAIL: waitlist_signups INSERT by authenticated unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then
        null;  -- expected: authenticated has no INSERT grant on this table
    end;
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (e) Superuser sanity check: the anon INSERT from (a) really landed (in its
--     own rolled-back transaction) — proves (b)'s denial was a real RLS/grant
--     boundary, not a masking side effect of the row never existing.
-- ---------------------------------------------------------------------------
begin;
  set local role anon;
  insert into public.waitlist_signups (email, name, role, sport, note)
    values ('rls-harness-anon-e@rls.test', 'RLS Harness Anon', 'athlete', 'hockey', null);
reset role;
  do $$
  declare
    seen int;
  begin
    select count(*) into seen
      from public.waitlist_signups
      where email = 'rls-harness-anon-e@rls.test';
    assert seen = 1,
      format('AC(e) FAIL: expected the anon-inserted row to exist under superuser read, saw %s', seen);
  end $$;
rollback;

\echo '  [PASS] 13_waitlist_signups (FV-378: anon insert-only; no anon select; authenticated select-0/no-insert)'
