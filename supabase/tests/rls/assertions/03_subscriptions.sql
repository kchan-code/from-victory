-- =============================================================================
-- RLS assertions — subscriptions  (FV-166 AC d)
--
-- (d) client roles cannot INSERT or UPDATE subscriptions.
--     Only the parent-own SELECT policy exists; all writes are service-role.
--
-- Both INSERT and UPDATE produce hard SQLSTATE 42501 (insufficient_privilege)
-- because the authenticated role has no INSERT or UPDATE grant on this table
-- (the two-layer model: no grant + no policy). The harness catches both with
-- the same `when insufficient_privilege` handler.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (d) Parent P (a real client role) cannot write subscriptions.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  begin
    -- INSERT must be hard-denied by RLS. parent_id points at athlete B's id
    -- (a valid profile with NO existing subscription) so that, IF the row
    -- were ever allowed through, it would SUCCEED — making a missing denial
    -- visible — rather than tripping a PK conflict and masking the result.
    begin
      insert into public.subscriptions (parent_id, stripe_customer_id, status)
        values ('20000000-0000-4000-8000-00000000000b', 'cus_attack', 'active');
      raise exception 'AC(d) FAIL: subscriptions INSERT by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then
        null;  -- expected: RLS blocked the insert (42501)
    end;

    -- UPDATE must be hard-denied by permission (no UPDATE grant). Catches the
    -- same 42501 shape as INSERT — the two-layer denial model is symmetric.
    begin
      update public.subscriptions
        set status = 'canceled'
        where parent_id = '10000000-0000-4000-8000-000000000001';
      raise exception 'AC(d) FAIL: subscriptions UPDATE by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then
        null;  -- expected: permission denied (no UPDATE grant)
    end;
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (d+) Athlete A has NO read access to subscriptions at all (own-parent
--      SELECT policy is keyed to parent_id = auth.uid(); athletes never match).
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible from public.subscriptions;
    assert visible = 0,
      format('AC(d) FAIL: athlete can read %s subscriptions rows (must be 0)', visible);
  end $$;
rollback;

\echo '  [PASS] 03_subscriptions (AC d)'
