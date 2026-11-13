-- =============================================================================
-- RLS assertions — google_subscriptions / google_purchase_bindings /
--                  google_license_testers  (FV-660; FV-651 record 7.1/7.2/7.4/10.2)
--
-- Migration 20261111120000_google_play_provider_access.sql:
--   - google_subscriptions:     payer-own SELECT of FIVE columns only
--                               (product_id, base_plan_id, status, expires_at,
--                               auto_renewing) via column-level GRANT + row
--                               policy. No client writes.
--   - google_purchase_bindings: no client grants or policies at all.
--   - google_license_testers:   no client grants or policies at all.
--
-- Fixture identities (fixtures.sql):
--   PARENT        P  = 10000000-0000-4000-8000-000000000001
--   ATHLETE       A  = 20000000-0000-4000-8000-00000000000a
--   ADULT_ATHLETE AA = 70000000-0000-4000-8000-000000000001
-- Each section seeds as superuser INSIDE its own transaction and rolls back.
-- Denials are asserted by EFFECT: seeded rows make UPDATE/DELETE non-vacuous
-- (a missing grant would produce a visible success, not a zero-row no-op).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a) Own-row read: exactly the five allowed columns; column-level denial for
--     every other column; cross-payer and athlete see nothing.
-- ---------------------------------------------------------------------------
begin;
  insert into public.google_subscriptions
    (payer_id, purchase_token, product_id, base_plan_id, status, expires_at,
     auto_renewing, is_test_purchase, obfuscated_account_id,
     linked_purchase_token, acknowledged, offer_id, last_verified_at)
  values
    ('10000000-0000-4000-8000-000000000001', 'rls-gtoken-p-1',
     'fv.test.tier1', 'monthly', 'active', now() + interval '30 days',
     true, true, 'rls-obfuscated-p', 'rls-gtoken-p-0', true, 'rls-offer', now()),
    ('70000000-0000-4000-8000-000000000001', 'rls-gtoken-aa-1',
     'fv.test.tier1', 'annual', 'active', now() + interval '30 days',
     true, false, 'rls-obfuscated-aa', null, true, null, now());

  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    n int; v_product text; v_plan text; v_status text; v_exp timestamptz; v_auto boolean;
    col text;
  begin
    -- Positive control: the five allowed columns, own row only (1 row of 2).
    select count(*) into n from (select product_id from public.google_subscriptions) s;
    assert n = 1, format('FV-660 FAIL: payer P should see exactly 1 own google_subscriptions row, saw %s', n);

    select product_id, base_plan_id, status, expires_at, auto_renewing
      into v_product, v_plan, v_status, v_exp, v_auto
      from public.google_subscriptions;
    assert v_product = 'fv.test.tier1' and v_plan = 'monthly' and v_status = 'active'
       and v_exp > now() and v_auto,
      'FV-660 FAIL: payer P could not read the five allowed columns of their own row';

    -- Column-level denial: each forbidden column must raise 42501.
    foreach col in array array[
      'purchase_token', 'linked_purchase_token', 'obfuscated_account_id',
      'is_test_purchase', 'payer_id', 'id', 'acknowledged', 'offer_id',
      'last_verified_at', 'created_at', 'updated_at'
    ] loop
      begin
        execute format('select %I from public.google_subscriptions', col);
        raise exception 'FV-660 FAIL: payer read forbidden column google_subscriptions.%', col;
      exception
        when insufficient_privilege then null;  -- expected
      end;
    end loop;

    -- select * must fail closed too (no table-level SELECT).
    begin
      perform * from public.google_subscriptions;
      raise exception 'FV-660 FAIL: select * on google_subscriptions unexpectedly SUCCEEDED for payer';
    exception
      when insufficient_privilege then null;
    end;

    -- Forbidden columns must not be usable as a filter oracle either.
    begin
      perform product_id from public.google_subscriptions where is_test_purchase;
      raise exception 'FV-660 FAIL: is_test_purchase usable in WHERE by client';
    exception
      when insufficient_privilege then null;
    end;
  end $$;

  -- Cross-payer: AA sees only AA's own row, never P's.
  set local request.jwt.claims to '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare n int; v_plan text;
  begin
    select count(*) into n from (select product_id from public.google_subscriptions) s;
    assert n = 1, format('FV-660 FAIL: cross-payer leak — AA sees %s google_subscriptions rows, expected exactly their own 1', n);
    select base_plan_id into v_plan from public.google_subscriptions;
    assert v_plan = 'annual', 'FV-660 FAIL: AA read a row that is not their own';
  end $$;

  -- Athlete A (dependent) sees nothing.
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare n int;
  begin
    select count(*) into n from (select product_id from public.google_subscriptions) s;
    assert n = 0, format('FV-660 FAIL: athlete A sees %s google_subscriptions row(s); expected 0', n);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (b) No client INSERT / UPDATE / DELETE on google_subscriptions.
-- ---------------------------------------------------------------------------
begin;
  insert into public.google_subscriptions
    (payer_id, purchase_token, product_id, base_plan_id, status, expires_at, last_verified_at)
  values
    ('10000000-0000-4000-8000-000000000001', 'rls-gtoken-p-1',
     'fv.test.tier1', 'monthly', 'expired', now() - interval '1 day', now());

  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  begin
    begin
      insert into public.google_subscriptions
        (payer_id, purchase_token, product_id, base_plan_id, status, expires_at, last_verified_at)
      values
        ('10000000-0000-4000-8000-000000000001', 'rls-gtoken-attack',
         'fv.test.tier1', 'monthly', 'active', now() + interval '30 days', now());
      raise exception 'FV-660 FAIL: google_subscriptions INSERT by client unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;

    begin
      update public.google_subscriptions set status = 'active'
        where payer_id = '10000000-0000-4000-8000-000000000001';
      raise exception 'FV-660 FAIL: google_subscriptions UPDATE by client unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;

    begin
      delete from public.google_subscriptions
        where payer_id = '10000000-0000-4000-8000-000000000001';
      raise exception 'FV-660 FAIL: google_subscriptions DELETE by client unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (c) google_purchase_bindings and google_license_testers: ZERO client access
--     (SELECT/INSERT/UPDATE/DELETE) for the owning payer, and for anon.
-- ---------------------------------------------------------------------------
begin;
  insert into public.google_purchase_bindings (payer_id)
  values ('10000000-0000-4000-8000-000000000001');
  insert into public.google_license_testers (payer_id, note)
  values ('10000000-0000-4000-8000-000000000001', 'rls-harness seed');

  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  begin
    begin
      perform * from public.google_purchase_bindings;
      raise exception 'FV-660 FAIL: google_purchase_bindings SELECT by owning payer unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;
    begin
      insert into public.google_purchase_bindings (payer_id)
      values ('70000000-0000-4000-8000-000000000001');
      raise exception 'FV-660 FAIL: google_purchase_bindings INSERT by client unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;
    begin
      update public.google_purchase_bindings set binding_id = gen_random_uuid()
        where payer_id = '10000000-0000-4000-8000-000000000001';
      raise exception 'FV-660 FAIL: google_purchase_bindings UPDATE by client unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;
    begin
      delete from public.google_purchase_bindings
        where payer_id = '10000000-0000-4000-8000-000000000001';
      raise exception 'FV-660 FAIL: google_purchase_bindings DELETE by client unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;

    begin
      perform * from public.google_license_testers;
      raise exception 'FV-660 FAIL: google_license_testers SELECT by allowlisted payer unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;
    begin
      insert into public.google_license_testers (payer_id)
      values ('70000000-0000-4000-8000-000000000001');
      raise exception 'FV-660 FAIL: google_license_testers INSERT by client unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;
    begin
      update public.google_license_testers set note = 'attacker'
        where payer_id = '10000000-0000-4000-8000-000000000001';
      raise exception 'FV-660 FAIL: google_license_testers UPDATE by client unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;
    begin
      delete from public.google_license_testers
        where payer_id = '10000000-0000-4000-8000-000000000001';
      raise exception 'FV-660 FAIL: google_license_testers DELETE by client unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;
  end $$;

  -- anon: nothing on any of the three (including the five allowed columns).
  set local role anon;
  do $$
  begin
    begin
      perform product_id from public.google_subscriptions;
      raise exception 'FV-660 FAIL: google_subscriptions SELECT by anon unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;
    begin
      perform * from public.google_purchase_bindings;
      raise exception 'FV-660 FAIL: google_purchase_bindings SELECT by anon unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;
    begin
      perform * from public.google_license_testers;
      raise exception 'FV-660 FAIL: google_license_testers SELECT by anon unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (d) Cascade: deleting the payer's profile removes rows in all three tables.
--     Also proves a payer may hold more than one google_subscriptions row
--     (token replacement) and that binding_id is not the profile id.
-- ---------------------------------------------------------------------------
begin;
  insert into public.google_subscriptions
    (payer_id, purchase_token, product_id, base_plan_id, status, expires_at,
     linked_purchase_token, last_verified_at)
  values
    ('70000000-0000-4000-8000-000000000001', 'rls-gtoken-cascade-1',
     'fv.test.tier1', 'monthly', 'expired', now() - interval '1 day', null, now()),
    ('70000000-0000-4000-8000-000000000001', 'rls-gtoken-cascade-2',
     'fv.test.tier2', 'monthly', 'active', now() + interval '30 days',
     'rls-gtoken-cascade-1', now());
  insert into public.google_purchase_bindings (payer_id)
  values ('70000000-0000-4000-8000-000000000001');
  insert into public.google_license_testers (payer_id, note)
  values ('70000000-0000-4000-8000-000000000001', 'cascade seed');

  do $$
  declare n int;
  begin
    select count(*) into n from public.google_subscriptions
      where payer_id = '70000000-0000-4000-8000-000000000001';
    assert n = 2, format('FV-660 FAIL: payer should be allowed 2 google_subscriptions rows (token replacement), got %s', n);

    assert (select binding_id::text from public.google_purchase_bindings
              where payer_id = '70000000-0000-4000-8000-000000000001')
           <> '70000000-0000-4000-8000-000000000001',
      'FV-660 FAIL: binding_id equals the profile id';

    delete from public.profiles where id = '70000000-0000-4000-8000-000000000001';

    select count(*) into n from public.google_subscriptions
      where payer_id = '70000000-0000-4000-8000-000000000001';
    assert n = 0, format('FV-660 FAIL: google_subscriptions did not cascade on profile delete (%s left)', n);
    select count(*) into n from public.google_purchase_bindings
      where payer_id = '70000000-0000-4000-8000-000000000001';
    assert n = 0, format('FV-660 FAIL: google_purchase_bindings did not cascade on profile delete (%s left)', n);
    select count(*) into n from public.google_license_testers
      where payer_id = '70000000-0000-4000-8000-000000000001';
    assert n = 0, format('FV-660 FAIL: google_license_testers did not cascade on profile delete (%s left)', n);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (e) Positive control: service_role can write all three (so the denials above
--     are not an artefact of an unreachable table), and the testers allowlist
--     is empty by default.
-- ---------------------------------------------------------------------------
begin;
  do $$
  declare n int;
  begin
    select count(*) into n from public.google_license_testers;
    assert n = 0, format('FV-660 FAIL: google_license_testers must be empty by default, has %s row(s)', n);
  end $$;

  set local role service_role;
  do $$
  declare n int;
  begin
    insert into public.google_subscriptions
      (payer_id, purchase_token, product_id, base_plan_id, status, expires_at, last_verified_at)
    values ('10000000-0000-4000-8000-000000000001', 'rls-gtoken-svc', 'fv.test.tier1',
            'monthly', 'active', now() + interval '30 days', now());
    update public.google_subscriptions set status = 'on_hold' where purchase_token = 'rls-gtoken-svc';
    get diagnostics n = row_count;
    assert n = 1, 'FV-660 FAIL: service_role could not UPDATE google_subscriptions';
    insert into public.google_purchase_bindings (payer_id) values ('10000000-0000-4000-8000-000000000001');
    insert into public.google_license_testers (payer_id) values ('10000000-0000-4000-8000-000000000001');
    delete from public.google_subscriptions where purchase_token = 'rls-gtoken-svc';
    get diagnostics n = row_count;
    assert n = 1, 'FV-660 FAIL: service_role could not DELETE google_subscriptions';
  end $$;

  -- Status CHECK pins Google's vocabulary (Apple/Stripe values are rejected).
  reset role;
  do $$
  begin
    begin
      insert into public.google_subscriptions
        (payer_id, purchase_token, product_id, base_plan_id, status, expires_at, last_verified_at)
      values ('10000000-0000-4000-8000-000000000001', 'rls-gtoken-bad', 'p', 'b',
              'subscribed', now(), now());
      raise exception 'FV-660 FAIL: status CHECK accepted an Apple-vocabulary value';
    exception when check_violation then null; end;
  end $$;
rollback;

\echo '  [PASS] 23_google_subscriptions (a: 5-column own-row read + column denial + cross-payer, b: write denial, c: bindings/testers zero-grant + anon, d: cascade, e: service_role control + empty allowlist + status CHECK)'
