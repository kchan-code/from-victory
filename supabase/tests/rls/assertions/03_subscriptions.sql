-- =============================================================================
-- RLS assertions — subscriptions  (FV-166 AC d)
--
-- (d) client roles cannot INSERT or UPDATE subscriptions.
--     Only the parent-own SELECT policy exists; all writes are service-role.
--
-- Note the two distinct denial shapes RLS produces, and why each assertion
-- checks what it checks:
--   - INSERT with NO insert policy  → hard error, SQLSTATE 42501
--     (insufficient_privilege). We expect and catch exactly that.
--   - UPDATE with NO update policy   → NO error; 0 rows match the (absent)
--     USING clause, so the statement silently affects 0 rows. We assert
--     ROW_COUNT = 0 and that the value is unchanged.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (d) Parent P (a real client role) cannot write subscriptions.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    affected int;
    cur_status text;
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

    -- UPDATE must affect 0 rows (no UPDATE policy), leaving status intact.
    update public.subscriptions
      set status = 'canceled'
      where parent_id = '10000000-0000-4000-8000-000000000001';
    get diagnostics affected = row_count;
    assert affected = 0,
      format('AC(d) FAIL: subscriptions UPDATE by client affected %s rows (must be 0)', affected);

    select status into cur_status
      from public.subscriptions
      where parent_id = '10000000-0000-4000-8000-000000000001';
    assert cur_status = 'active',
      format('AC(d) FAIL: subscription status mutated by client to %s (must remain active)', cur_status);
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
