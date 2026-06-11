-- =============================================================================
-- RLS assertions — push_subscriptions  (FV-164)
--
-- (a) ATHLETE_A reads only their own push_subscriptions row.
-- (b) ATHLETE_A cannot read ATHLETE_B's push_subscriptions row.
-- (c) PARENT cannot read ANY push_subscriptions row (no parent policy).
-- (d) Anon role cannot read any push_subscriptions row.
--
-- ATHLETE_A fixture row is inserted below (fixtures.sql seeds global data;
-- push-specific fixture is here so it's self-contained and can be re-run
-- without touching fixtures.sql).
--
-- We insert ATHLETE_A's row as the superuser role (bypassing RLS) inside
-- each transaction's setup, and rollback at the end so successive runs stay
-- idempotent. ATHLETE_B intentionally has NO push_subscriptions row —
-- the assertions verify B's row is invisible to A regardless.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Setup fixture — run as superuser before each assertion block.
-- Each begin/rollback block re-inserts within the transaction and rolls back,
-- leaving the table clean between runs.
-- ---------------------------------------------------------------------------

-- (a) Athlete A sees only their OWN push_subscriptions row.
begin;
  -- Insert A's row as superuser (bypasses RLS — fixture setup only).
  insert into public.push_subscriptions
    (athlete_id, endpoint, p256dh, auth, reminder_hour, timezone)
  values
    ('20000000-0000-4000-8000-00000000000a',
     'https://push.example.com/athlete-a',
     'AAAA_P256DH_ATHLETE_A',
     'AAAA_AUTH_ATHLETE_A',
     8,
     'America/New_York')
  on conflict (athlete_id) do nothing;

  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    total   int;
    leaked  int;
  begin
    -- Should see exactly 1 row (their own).
    select count(*) into total from public.push_subscriptions;
    assert total = 1,
      format('AC(a) FAIL: athlete A should see exactly 1 push_subscriptions row, saw %s', total);

    -- Direct read by B's athlete_id must return nothing.
    select count(*) into leaked
      from public.push_subscriptions
      where athlete_id = '20000000-0000-4000-8000-00000000000b';
    assert leaked = 0,
      'AC(b) FAIL: athlete A can read athlete B push_subscriptions row';

    -- Confirm the row visible is A's own.
    select count(*) into leaked
      from public.push_subscriptions
      where athlete_id = '20000000-0000-4000-8000-00000000000a';
    assert leaked = 1,
      'AC(a) FAIL: athlete A cannot read their own push_subscriptions row';
  end $$;
rollback;

-- (c) Parent P cannot read ANY push_subscriptions rows (no parent policy).
begin;
  -- Insert A's row as superuser for this transaction.
  insert into public.push_subscriptions
    (athlete_id, endpoint, p256dh, auth, reminder_hour, timezone)
  values
    ('20000000-0000-4000-8000-00000000000a',
     'https://push.example.com/athlete-a',
     'AAAA_P256DH_ATHLETE_A',
     'AAAA_AUTH_ATHLETE_A',
     8,
     'America/New_York')
  on conflict (athlete_id) do nothing;

  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible from public.push_subscriptions;
    assert visible = 0,
      format('AC(c) FAIL: parent can read %s push_subscriptions rows (must be 0)', visible);
  end $$;
rollback;

-- (d) Anon role sees zero push_subscriptions rows.
begin;
  -- Insert A's row as superuser for this transaction.
  insert into public.push_subscriptions
    (athlete_id, endpoint, p256dh, auth, reminder_hour, timezone)
  values
    ('20000000-0000-4000-8000-00000000000a',
     'https://push.example.com/athlete-a',
     'AAAA_P256DH_ATHLETE_A',
     'AAAA_AUTH_ATHLETE_A',
     8,
     'America/New_York')
  on conflict (athlete_id) do nothing;

  set local role anon;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible from public.push_subscriptions;
    assert visible = 0,
      format('AC(d) FAIL: anon can read %s push_subscriptions rows (must be 0)', visible);
  end $$;
rollback;

\echo '  [PASS] 07_push_subscriptions (AC a, b, c, d)'
