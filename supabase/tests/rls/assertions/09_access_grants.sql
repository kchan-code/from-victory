-- =============================================================================
-- RLS assertions — access_grants  (FV-69)
--
-- Verifies the access_grants table RLS boundaries:
--   (a) A parent can SELECT their own grant row.
--   (b) A DIFFERENT parent sees 0 rows (own-only policy).
--   (c) An athlete sees 0 rows (no athlete policy exists).
--   (d) Anon sees 0 rows (no anon policy exists).
--   (e) Client INSERT is denied (no INSERT policy; service-role only).
--   (f) Client UPDATE is denied (no UPDATE policy; service-role only).
--   (g) Client DELETE is denied (no DELETE policy; service-role only).
--
-- Fixture assumptions (shared harness seed — parent P is
--   id=10000000-0000-4000-8000-000000000001; athlete A is
--   id=20000000-0000-4000-8000-00000000000a):
--
--   A grant row is seeded for parent P below, inside a transaction that
--   rolls back at the end so it does not pollute other assertions.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Seed: insert a test grant row for parent P (as service_role / superuser).
-- We open a separate transaction so we can seed inside it, run assertions,
-- then roll back the seed row cleanly.
-- ---------------------------------------------------------------------------
begin;

  -- Insert a test grant as the superuser (harness role). This bypasses RLS.
  insert into public.access_grants
    (id, parent_id, granted_by, reason, expires_at, revoked_at)
  values
    (
      'f0000000-0000-4000-8000-000000000091',
      '10000000-0000-4000-8000-000000000001',  -- parent P
      null,
      'RLS harness test grant',
      null,
      null
    );

  -- -------------------------------------------------------------------------
  -- (a) Parent P can read their own grant.
  -- -------------------------------------------------------------------------
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible
      from public.access_grants
     where id = 'f0000000-0000-4000-8000-000000000091';
    assert visible = 1,
      format('AC(a) FAIL: parent P should see 1 own grant, got %s', visible);
  end $$;

  -- -------------------------------------------------------------------------
  -- (b) A DIFFERENT parent (parent Q = athlete B's parent, or any other uuid)
  --     sees 0 grant rows for parent P.
  -- -------------------------------------------------------------------------
  set local request.jwt.claims to '{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible from public.access_grants;
    assert visible = 0,
      format('AC(b) FAIL: different parent sees %s rows (must be 0)', visible);
  end $$;

  -- -------------------------------------------------------------------------
  -- (c) Athlete A sees 0 rows (no athlete SELECT policy on access_grants).
  -- -------------------------------------------------------------------------
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible from public.access_grants;
    assert visible = 0,
      format('AC(c) FAIL: athlete sees %s access_grants rows (must be 0)', visible);
  end $$;

  -- -------------------------------------------------------------------------
  -- (d) Anon sees 0 rows.
  -- -------------------------------------------------------------------------
  set local request.jwt.claims to '{}';
  set local role anon;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible from public.access_grants;
    assert visible = 0,
      format('AC(d) FAIL: anon sees %s access_grants rows (must be 0)', visible);
  end $$;

  -- -------------------------------------------------------------------------
  -- (e) Client INSERT is denied — no INSERT policy; service-role only.
  --     Authenticated role attempting INSERT must get insufficient_privilege.
  -- -------------------------------------------------------------------------
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  begin
    begin
      insert into public.access_grants
        (parent_id, granted_by, reason)
      values
        ('10000000-0000-4000-8000-000000000001', null, 'attack');
      raise exception 'AC(e) FAIL: access_grants INSERT by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then
        null;  -- expected
    end;
  end $$;

  -- -------------------------------------------------------------------------
  -- (f) Client UPDATE is denied.
  -- -------------------------------------------------------------------------
  do $$
  begin
    begin
      update public.access_grants
        set reason = 'tampered'
       where id = 'f0000000-0000-4000-8000-000000000091';
      raise exception 'AC(f) FAIL: access_grants UPDATE by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then
        null;  -- expected
    end;
  end $$;

  -- -------------------------------------------------------------------------
  -- (g) Client DELETE is denied.
  -- -------------------------------------------------------------------------
  do $$
  begin
    begin
      delete from public.access_grants
       where id = 'f0000000-0000-4000-8000-000000000091';
      raise exception 'AC(g) FAIL: access_grants DELETE by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then
        null;  -- expected
    end;
  end $$;

rollback;  -- rolls back the seeded grant row cleanly

\echo '  [PASS] 09_access_grants (FV-69: parent sees own; different-parent/athlete/anon see 0; no client INSERT/UPDATE/DELETE)'
