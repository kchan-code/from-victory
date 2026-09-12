-- =============================================================================
-- RLS assertions — apple_subscriptions / apple_purchase_tokens /
--                  apple_sandbox_testers  (FV-570; FV-210 record §4.1/§4.9)
--
-- Three Apple-provider tables land together (migration
-- 20260911120000_apple_provider_access.sql) with the FV-507 grant posture:
--   - apple_subscriptions:   payer-own SELECT policy only; writes are
--                            service-role-only (no client INSERT/UPDATE/DELETE
--                            grant OR policy).
--   - apple_purchase_tokens: NO client grants or policies at all — the opaque
--                            per-payer app_account_token must not be readable
--                            client-side.
--   - apple_sandbox_testers: NO client grants or policies at all — a payer
--                            must not be able to probe their own QA-allowlist
--                            membership (privacy re-review, design v3 HIGH).
--
-- Kids-privacy condition (PR #511 verdict): this file must exist and run
-- BEFORE the migration is applied to ANY real Supabase project, local/CI
-- included. It ships in the same branch as the migration.
--
-- File index: 19_ is taken by FV-507's client_grant_matrix (draft PR #506/#508
-- at authoring time); this file takes 20_. If FV-507 lands with a different
-- final index map, renumber at integration — the runner globs assertions/*.sql
-- in sorted order and each file is self-contained.
--
-- Fixture identities (fixtures.sql):
--   PARENT        P  = 10000000-0000-4000-8000-000000000001
--   ATHLETE       A  = 20000000-0000-4000-8000-00000000000a
--   ADULT_ATHLETE AA = 70000000-0000-4000-8000-000000000001
-- No Apple fixture rows are seeded globally; each section seeds what it needs
-- as the superuser INSIDE its own transaction and rolls back — self-cleaning.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a) Client role cannot INSERT / UPDATE / DELETE apple_subscriptions.
--     Real-mutation attempts (FV-507 effect-based style): if a denial were
--     missing, the statement would SUCCEED — visible — rather than trip a
--     constraint that masks the result.
-- ---------------------------------------------------------------------------
begin;
  -- Seed (as superuser) a Production row for P so UPDATE/DELETE have a real
  -- target row and cannot pass vacuously as zero-row no-ops.
  insert into public.apple_subscriptions
    (payer_id, environment, original_transaction_id, product_id, status,
     expires_at, app_account_token, last_signed_date)
  values
    ('10000000-0000-4000-8000-000000000001', 'Production', 'rls-otid-p-1',
     'fv.test.tier1.monthly', 'subscribed',
     now() + interval '30 days',
     'aaaaaaaa-0000-4000-8000-000000000001', now());

  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  begin
    begin
      insert into public.apple_subscriptions
        (payer_id, environment, original_transaction_id, product_id, status,
         expires_at, app_account_token, last_signed_date)
      values
        ('10000000-0000-4000-8000-000000000001', 'Sandbox', 'rls-otid-attack',
         'fv.test.tier1.monthly', 'subscribed',
         now() + interval '30 days',
         'aaaaaaaa-0000-4000-8000-00000000000f', now());
      raise exception 'FV-570 FAIL: apple_subscriptions INSERT by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;  -- expected (42501: no INSERT grant)
    end;

    begin
      update public.apple_subscriptions
        set status = 'revoked'
        where payer_id = '10000000-0000-4000-8000-000000000001';
      raise exception 'FV-570 FAIL: apple_subscriptions UPDATE by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;  -- expected (42501: no UPDATE grant)
    end;

    begin
      delete from public.apple_subscriptions
        where payer_id = '10000000-0000-4000-8000-000000000001';
      raise exception 'FV-570 FAIL: apple_subscriptions DELETE by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;  -- expected (42501: no DELETE grant)
    end;
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (b) SELECT boundary on apple_subscriptions:
--     payer sees ONLY their own row (positive control proving the policy
--     works at all); a different payer sees 0; an athlete sees 0.
-- ---------------------------------------------------------------------------
begin;
  insert into public.apple_subscriptions
    (payer_id, environment, original_transaction_id, product_id, status,
     expires_at, app_account_token, last_signed_date)
  values
    ('10000000-0000-4000-8000-000000000001', 'Production', 'rls-otid-p-1',
     'fv.test.tier1.monthly', 'subscribed',
     now() + interval '30 days',
     'aaaaaaaa-0000-4000-8000-000000000001', now());

  -- Positive control: payer P reads exactly their own row.
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.apple_subscriptions;
    assert visible = 1,
      format('FV-570 FAIL: payer P should see exactly their own apple_subscriptions row, saw %s', visible);
  end $$;

  -- Cross-payer: adult_athlete AA (a different payer identity) sees 0 rows.
  set local request.jwt.claims to '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.apple_subscriptions;
    assert visible = 0,
      format('FV-570 FAIL: cross-payer leak — AA sees %s apple_subscriptions row(s)', visible);
  end $$;

  -- Athlete-0-rows (FV-210 record §4.1 named AC): a dependent athlete session
  -- must never see any payer's Apple billing row.
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.apple_subscriptions;
    assert visible = 0,
      format('FV-570 FAIL: athlete A sees %s apple_subscriptions row(s); expected 0', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (c) apple_purchase_tokens has ZERO client access — even the owning payer
--     cannot SELECT their own token (no grant at all → hard 42501, not a
--     zero-row RLS no-op).
-- ---------------------------------------------------------------------------
begin;
  insert into public.apple_purchase_tokens (payer_id)
  values ('10000000-0000-4000-8000-000000000001');

  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  begin
    begin
      perform * from public.apple_purchase_tokens;
      raise exception 'FV-570 FAIL: apple_purchase_tokens SELECT by owning payer unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;  -- expected: zero-grant table
    end;

    begin
      insert into public.apple_purchase_tokens (payer_id)
      values ('70000000-0000-4000-8000-000000000001');
      raise exception 'FV-570 FAIL: apple_purchase_tokens INSERT by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;  -- expected
    end;

    -- UPDATE/DELETE too: the migration's REVOKE is a blanket revoke today,
    -- but assert every verb so a future migration that narrows the REVOKE
    -- to specific privileges cannot slip through undetected (qa delta
    -- review, PR #511). The seeded row above makes these non-vacuous.
    begin
      update public.apple_purchase_tokens
        set token = gen_random_uuid()
        where payer_id = '10000000-0000-4000-8000-000000000001';
      raise exception 'FV-570 FAIL: apple_purchase_tokens UPDATE by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;  -- expected
    end;

    begin
      delete from public.apple_purchase_tokens
        where payer_id = '10000000-0000-4000-8000-000000000001';
      raise exception 'FV-570 FAIL: apple_purchase_tokens DELETE by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;  -- expected
    end;
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (d) apple_sandbox_testers has ZERO client access — a payer cannot probe
--     their own allowlist membership (design-review v3 HIGH), and no client
--     can write it.
-- ---------------------------------------------------------------------------
begin;
  insert into public.apple_sandbox_testers (payer_id, note)
  values ('70000000-0000-4000-8000-000000000001', 'rls-harness seed');

  -- The allowlisted payer themselves cannot read their membership.
  set local request.jwt.claims to '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  begin
    begin
      perform * from public.apple_sandbox_testers;
      raise exception 'FV-570 FAIL: apple_sandbox_testers SELECT by allowlisted payer unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;  -- expected: zero-grant table
    end;

    begin
      insert into public.apple_sandbox_testers (payer_id)
      values ('10000000-0000-4000-8000-000000000001');
      raise exception 'FV-570 FAIL: apple_sandbox_testers INSERT by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;  -- expected
    end;

    -- UPDATE/DELETE too — same every-verb rationale as apple_purchase_tokens
    -- above (qa delta review, PR #511); the seeded row makes these
    -- non-vacuous.
    begin
      update public.apple_sandbox_testers
        set note = 'attacker note'
        where payer_id = '70000000-0000-4000-8000-000000000001';
      raise exception 'FV-570 FAIL: apple_sandbox_testers UPDATE by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;  -- expected
    end;

    begin
      delete from public.apple_sandbox_testers
        where payer_id = '70000000-0000-4000-8000-000000000001';
      raise exception 'FV-570 FAIL: apple_sandbox_testers DELETE by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;  -- expected
    end;
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (e) anon has no access to any of the three tables (REVOKE covers anon too).
-- ---------------------------------------------------------------------------
begin;
  set local role anon;
  do $$
  begin
    begin
      perform * from public.apple_subscriptions;
      raise exception 'FV-570 FAIL: apple_subscriptions SELECT by anon unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;  -- expected: no anon grant
    end;
    begin
      perform * from public.apple_purchase_tokens;
      raise exception 'FV-570 FAIL: apple_purchase_tokens SELECT by anon unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;
    end;
    begin
      perform * from public.apple_sandbox_testers;
      raise exception 'FV-570 FAIL: apple_sandbox_testers SELECT by anon unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then null;
    end;
  end $$;
rollback;

\echo '  [PASS] 20_apple_subscriptions (a: mirror write-denial, b: payer/cross-payer/athlete SELECT boundary, c: tokens zero-grant, d: allowlist zero-grant, e: anon)'
