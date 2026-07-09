-- =============================================================================
-- RLS assertions — function EXECUTE default-deny  (FV-363)
--
-- 20260709000000_function_grant_default_deny.sql flips the schema's function-
-- EXECUTE posture from grant-to-all to deny-by-default, so a future
-- SECURITY DEFINER (or any) function is not silently callable by anon /
-- authenticated the moment it's created. This file machine-verifies:
--
--   (a) a brand-new function created with NO explicit grant is NOT
--       executable by anon or authenticated (the ALTER DEFAULT PRIVILEGES
--       flip is actually in effect) — and that an explicit GRANT still
--       works as the escape hatch for functions that DO need to be RPC-
--       callable.
--   (b) every EXISTING trigger function (never meant to be called directly)
--       has had its Postgres-automatic PUBLIC EXECUTE grant revoked — this
--       was the live gap the migration closed (enforce_birthdate_immutable()
--       had held an unrevoked anon/authenticated grant since 2026-06-25).
--   (c) get_own_username() — the one function legitimately RPC-called by
--       authenticated — still has its explicit grant (the default-deny flip
--       must not silently take away a grant that's supposed to exist).
--   (d) due_push_reminders() / due_game_day_reminders() remain revoked for
--       anon/authenticated (also covered by 08_function_execute_grants.sql;
--       re-checked here so this file is a single self-contained record of
--       the whole function-grant posture).
--
-- Runs as the harness superuser role, which can create/drop objects and
-- query privilege metadata. Part (a) creates and drops a throwaway function
-- inside a rolled-back transaction — it never persists.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a) New-function default + explicit-grant escape hatch
-- ---------------------------------------------------------------------------
begin;
  create function public.__fv363_throwaway_test_fn()
  returns int
  language sql
  as $$ select 1 $$;

  do $$
  declare
    anon_can_exec bool;
    auth_can_exec bool;
  begin
    select has_function_privilege('anon', 'public.__fv363_throwaway_test_fn()', 'execute')
      into anon_can_exec;
    select has_function_privilege('authenticated', 'public.__fv363_throwaway_test_fn()', 'execute')
      into auth_can_exec;

    assert not anon_can_exec,
      'FV-363 SECURITY FAIL: a newly created function is executable by anon by default '
      '— the default-deny ALTER DEFAULT PRIVILEGES flip is not in effect';
    assert not auth_can_exec,
      'FV-363 SECURITY FAIL: a newly created function is executable by authenticated by '
      'default — the default-deny ALTER DEFAULT PRIVILEGES flip is not in effect';
  end $$;

  -- The escape hatch: an explicit GRANT still makes a function callable when
  -- a migration decides it should be RPC-callable.
  grant execute on function public.__fv363_throwaway_test_fn() to authenticated;

  do $$
  declare auth_can_exec bool;
  begin
    select has_function_privilege('authenticated', 'public.__fv363_throwaway_test_fn()', 'execute')
      into auth_can_exec;
    assert auth_can_exec,
      'FV-363 harness FAIL: an explicit GRANT EXECUTE did not take effect '
      '(harness/environment bug, not a product security bug)';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (b) Existing trigger functions — PUBLIC EXECUTE must be revoked
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
  anon_can_exec bool;
  auth_can_exec bool;
begin
  foreach fn in array array[
    'public.set_updated_at()',
    'public.check_parent_athlete_link_roles()',
    'public.check_device_pairing_roles()',
    'public.check_athlete_session_role()',
    'public.check_journal_entry_consistency()',
    'public.check_safety_event_consistency()',
    'public.enforce_birthdate_immutable()'
  ]
  loop
    select has_function_privilege('anon', fn, 'execute') into anon_can_exec;
    select has_function_privilege('authenticated', fn, 'execute') into auth_can_exec;

    assert not anon_can_exec,
      format('FV-363 SECURITY FAIL: anon role has EXECUTE on trigger function %s '
             '— it must never be directly RPC-callable', fn);
    assert not auth_can_exec,
      format('FV-363 SECURITY FAIL: authenticated role has EXECUTE on trigger function %s '
             '— it must never be directly RPC-callable', fn);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- (c) get_own_username() — authenticated retains EXECUTE; anon INTENTIONALLY
--     retains it too as a safe-degrade (SECURITY DEFINER, auth.uid()-scoped →
--     NULL for anon), per 10_username.sql AC(d). This migration must NOT strip
--     either grant.
-- ---------------------------------------------------------------------------
do $$
declare
  anon_can_exec bool;
  auth_can_exec bool;
begin
  select has_function_privilege('anon', 'public.get_own_username()', 'execute')
    into anon_can_exec;
  select has_function_privilege('authenticated', 'public.get_own_username()', 'execute')
    into auth_can_exec;

  assert anon_can_exec,
    'FV-363 REGRESSION: anon lost EXECUTE on get_own_username() — it is intentionally '
    'anon-callable as a safe-degrade (returns NULL for anon); see 10_username.sql AC(d)';
  assert auth_can_exec,
    'FV-363 REGRESSION: authenticated lost EXECUTE on get_own_username() — the default-deny flip '
    'must not silently remove a grant a live feature (device-pairing claim UI) depends on';
end $$;

-- ---------------------------------------------------------------------------
-- (d) due_push_reminders() / due_game_day_reminders() — must stay revoked
--     (service-role/cron only; also asserted in 08_function_execute_grants.sql)
-- ---------------------------------------------------------------------------
do $$
declare
  anon_can_exec bool;
  auth_can_exec bool;
begin
  select has_function_privilege('anon', 'public.due_push_reminders()', 'execute') into anon_can_exec;
  select has_function_privilege('authenticated', 'public.due_push_reminders()', 'execute') into auth_can_exec;
  assert not anon_can_exec and not auth_can_exec,
    'FV-363 SECURITY FAIL: due_push_reminders() is executable by a client role (must be service-role only)';

  select has_function_privilege('anon', 'public.due_game_day_reminders()', 'execute') into anon_can_exec;
  select has_function_privilege('authenticated', 'public.due_game_day_reminders()', 'execute') into auth_can_exec;
  assert not anon_can_exec and not auth_can_exec,
    'FV-363 SECURITY FAIL: due_game_day_reminders() is executable by a client role (must be service-role only)';
end $$;

\echo '  [PASS] 15_function_grant_default_deny (FV-363: function EXECUTE default flipped to deny; trigger functions closed; get_own_username + service-role RPCs unaffected)'
