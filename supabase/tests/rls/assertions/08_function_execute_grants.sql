-- =============================================================================
-- RLS assertions — SECURITY DEFINER function EXECUTE grants  (FV-240 / FV-164)
--
-- Verifies that due_game_day_reminders() and due_push_reminders() have
-- EXECUTE revoked from the anon and authenticated roles.
--
-- Why this matters: Postgres grants EXECUTE to PUBLIC by default when a
-- function is created. A SECURITY DEFINER function callable by anon can be
-- invoked via the Supabase anon key, harvesting push endpoint/p256dh/auth
-- keys for minors without any RLS check. The migrations explicitly revoke
-- from public, anon, and authenticated; these assertions machine-verify that
-- the revokes are in effect.
--
-- Approach: use has_function_privilege(role_name, function_signature, 'execute')
-- which returns TRUE if the role has execute on the function. We assert FALSE
-- (i.e. no execute privilege) for anon and authenticated.
-- Runs as the harness superuser role, which can query privilege metadata.
-- =============================================================================

do $$
declare
  anon_can_exec_game_day  bool;
  auth_can_exec_game_day  bool;
  anon_can_exec_daily     bool;
  auth_can_exec_daily     bool;
begin
  -- due_game_day_reminders()
  select has_function_privilege('anon',           'public.due_game_day_reminders()', 'execute')
    into anon_can_exec_game_day;
  select has_function_privilege('authenticated',  'public.due_game_day_reminders()', 'execute')
    into auth_can_exec_game_day;

  assert not anon_can_exec_game_day,
    'FV-240 SECURITY FAIL: anon role has EXECUTE on due_game_day_reminders() '
    '— revoke execute on function public.due_game_day_reminders() from public; must be present';

  assert not auth_can_exec_game_day,
    'FV-240 SECURITY FAIL: authenticated role has EXECUTE on due_game_day_reminders() '
    '— revoke execute on function public.due_game_day_reminders() from public; must be present';

  -- due_push_reminders()
  select has_function_privilege('anon',           'public.due_push_reminders()', 'execute')
    into anon_can_exec_daily;
  select has_function_privilege('authenticated',  'public.due_push_reminders()', 'execute')
    into auth_can_exec_daily;

  assert not anon_can_exec_daily,
    'FV-164 SECURITY FAIL: anon role has EXECUTE on due_push_reminders() '
    '— revoke execute on function public.due_push_reminders() from public; must be present '
    '(shipped in 20260612140000_next_game_on.sql)';

  assert not auth_can_exec_daily,
    'FV-164 SECURITY FAIL: authenticated role has EXECUTE on due_push_reminders() '
    '— revoke execute on function public.due_push_reminders() from public; must be present '
    '(shipped in 20260612140000_next_game_on.sql)';
end $$;

\echo '  [PASS] 08_function_execute_grants (FV-240 due_game_day_reminders + FV-164 due_push_reminders: EXECUTE revoked from anon + authenticated)'
