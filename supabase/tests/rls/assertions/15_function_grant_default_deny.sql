-- =============================================================================
-- RLS assertions — function EXECUTE grant closure on EXISTING functions
-- (FV-363)
--
-- 20260709000000_function_grant_default_deny.sql closes the live
-- function-EXECUTE grant gap on EXISTING functions (most notably
-- enforce_birthdate_immutable()) and undoes a stray default-privileges
-- escalation. This file machine-verifies:
--
--   (a) every EXISTING trigger function (never meant to be called directly)
--       has had its Postgres-automatic PUBLIC EXECUTE grant revoked — this
--       was the live gap the migration closed (enforce_birthdate_immutable()
--       had held an unrevoked anon/authenticated grant since 2026-06-25).
--   (b) get_own_username() — the one function legitimately RPC-called by
--       authenticated — still has its explicit grant (this migration's
--       clean-up must not silently take away a grant that's supposed to
--       exist).
--   (c) due_push_reminders() / due_game_day_reminders() remain revoked for
--       anon/authenticated (also covered by 08_function_execute_grants.sql;
--       re-checked here so this file is a single self-contained record of
--       the whole function-grant posture).
--
-- Descoped (KC decision, 2026-07-09): this file previously also asserted
-- that a brand-new function created with no explicit grant is denied by
-- default (i.e. that the schema enforces default-deny for FUTURE
-- functions). That assertion is REMOVED here along with the runtime
-- mechanism it was testing (a `ddl_command_end` event trigger) — event
-- triggers require the creating role to be a Postgres superuser, which
-- hosted Supabase's `postgres` connection role likely lacks, and CI (which
-- only ever runs against a genuinely-superuser local Docker Postgres) could
-- not have caught that gap before it broke the hosted db-migrate job on
-- merge. Enforcement of future-function default-deny is deferred to a
-- follow-up build-time CI migration-lint (no superuser, no runtime DB
-- dependency) — see 20260709000000_function_grant_default_deny.sql's
-- "Descope" section for the full writeup, including why
-- `ALTER DEFAULT PRIVILEGES ... REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`
-- cannot achieve this on its own (documented Postgres no-op, verified
-- empirically).
--
-- Runs as the harness superuser role, which can query privilege metadata.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a) Existing trigger functions — PUBLIC EXECUTE must be revoked
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
-- (b) get_own_username() — authenticated retains EXECUTE; anon INTENTIONALLY
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
    'FV-363 REGRESSION: authenticated lost EXECUTE on get_own_username() — this migration''s '
    'clean-up must not silently remove a grant a live feature (device-pairing claim UI) depends on';
end $$;

-- ---------------------------------------------------------------------------
-- (c) due_push_reminders() / due_game_day_reminders() — must stay revoked
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

\echo '  [PASS] 15_function_grant_default_deny (FV-363: existing-function EXECUTE grant gap closed; get_own_username + service-role RPCs unaffected; future-function default-deny deferred to a CI migration-lint follow-up)'
