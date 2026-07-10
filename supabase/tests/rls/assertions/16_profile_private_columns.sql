-- =============================================================================
-- RLS assertions — profiles athlete-private column hardening (FV-361)
--
-- Verifies the column-level REVOKE + get_own_personalization() RPC shipped in
-- 20260708120000_athlete_private_columns_grant_hardening.sql, closing the
-- FV-251 gap for position, focus_area, and next_game_on (username is covered
-- separately in 10_username.sql AC(c2)):
--
--   (a) Athlete A reads their OWN position/focus_area via
--       get_own_personalization().
--   (b) Athlete B (no sentinel set) gets NULL/NULL from
--       get_own_personalization() — proves the function scopes to
--       auth.uid(), never leaks athlete A's values to a different athlete.
--   (c) A parent (P, linked to A) attempting a DIRECT SELECT of
--       position/focus_area on athlete A's row gets insufficient_privilege
--       (SQLSTATE 42501) — the row is RLS-visible, but the column is not.
--   (d) The athlete's OWN direct SELECT of next_game_on is ALSO blocked
--       (intentional — nothing in the app reads it back via the RLS-scoped
--       client; write-only from the client, read via service role /
--       SECURITY DEFINER for the cron path).
--   (e) has_column_privilege confirms SELECT is revoked from BOTH
--       authenticated and anon for all four athlete-private columns.
--   (f) Sanity: the revoke does NOT collateral-damage parent-visible
--       columns — athlete A's own full parent-visible read and the linked
--       parent's read of first_name/birthdate/sport both still work.
--
-- Fixture graph (from fixtures.sql):
--   PARENT    10000000-0000-4000-8000-000000000001
--   ATHLETE_A 20000000-0000-4000-8000-00000000000a  (linked to P)
--   ATHLETE_B 20000000-0000-4000-8000-00000000000b  (NOT linked to P)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Setup: give athlete A sentinel position/focus_area/next_game_on values.
--         Runs as postgres (superuser / RLS + grants bypassed).
-- ---------------------------------------------------------------------------

begin;
  update public.profiles
     set position   = 'Forward',
         focus_area = 'confidence',
         next_game_on = current_date + 1
   where id = '20000000-0000-4000-8000-00000000000a';
  -- Athlete B keeps NULLs — tests get_own_personalization() returns the
  -- CALLER's own (empty) values, not athlete A's.
commit;


-- ---------------------------------------------------------------------------
-- (a) Athlete A: get_own_personalization() returns their own sentinel values.
-- ---------------------------------------------------------------------------

begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    own_position   text;
    own_focus_area text;
  begin
    select position, focus_area into own_position, own_focus_area
      from public.get_own_personalization();
    assert own_position = 'Forward',
      format('AC(a) FAIL: athlete A should see own position "Forward", got "%s"',
             coalesce(own_position, '<NULL>'));
    assert own_focus_area = 'confidence',
      format('AC(a) FAIL: athlete A should see own focus_area "confidence", got "%s"',
             coalesce(own_focus_area, '<NULL>'));
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (b) Athlete B: get_own_personalization() returns NULL/NULL (their own
--     unset values) — never athlete A's sentinel values.
-- ---------------------------------------------------------------------------

begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000b","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    own_position   text;
    own_focus_area text;
  begin
    select position, focus_area into own_position, own_focus_area
      from public.get_own_personalization();
    assert own_position is null,
      format('AC(b) FAIL: athlete B''s position should be NULL, got "%s"',
             coalesce(own_position, '<NULL>'));
    assert own_focus_area is null,
      format('AC(b) FAIL: athlete B''s focus_area should be NULL, got "%s"',
             coalesce(own_focus_area, '<NULL>'));
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (c) Parent P (linked to A): direct SELECT of position/focus_area on A's
--     row must raise insufficient_privilege, not return the sentinel value.
--     The row IS RLS-visible to P (profiles_parent_select_linked_athlete);
--     the column REVOKE must deny it anyway.
-- ---------------------------------------------------------------------------

begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    seen text;
  begin
    select position into seen
      from public.profiles
     where id = '20000000-0000-4000-8000-00000000000a';
    raise exception
      'AC(c) FAIL: parent read athlete A''s position via direct SELECT (got "%s")',
      coalesce(seen, '<NULL>');
  exception
    when insufficient_privilege then
      null; -- expected
  end $$;
rollback;

begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    seen text;
  begin
    select focus_area into seen
      from public.profiles
     where id = '20000000-0000-4000-8000-00000000000a';
    raise exception
      'AC(c) FAIL: parent read athlete A''s focus_area via direct SELECT (got "%s")',
      coalesce(seen, '<NULL>');
  exception
    when insufficient_privilege then
      null; -- expected
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (d) Athlete A's OWN direct SELECT of next_game_on is ALSO blocked. This is
--     intentional (see migration notes): nothing in the app reads
--     next_game_on back via the RLS-scoped client, so there is no
--     self-read RPC for it, and the column is revoked from every client role
--     without exception.
-- ---------------------------------------------------------------------------

begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    seen date;
  begin
    select next_game_on into seen
      from public.profiles
     where id = '20000000-0000-4000-8000-00000000000a';
    raise exception
      'AC(d) FAIL: athlete A read own next_game_on via direct SELECT (got "%s") '
      '— expected insufficient_privilege (no self-read RPC exists for this column '
      'because the RLS-scoped client never reads it back).',
      coalesce(seen::text, '<NULL>');
  exception
    when insufficient_privilege then
      null; -- expected
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (e) has_column_privilege: SELECT is revoked from BOTH authenticated and
--     anon for all four athlete-private columns. Runs as the harness
--     superuser role (no role switch needed — has_column_privilege takes an
--     explicit role name argument), mirroring 08_function_execute_grants.sql.
-- ---------------------------------------------------------------------------

do $$
declare
  col text;
  auth_can_select bool;
  anon_can_select bool;
begin
  foreach col in array array['position', 'focus_area', 'next_game_on', 'username']
  loop
    select has_column_privilege('authenticated', 'public.profiles', col, 'select')
      into auth_can_select;
    select has_column_privilege('anon', 'public.profiles', col, 'select')
      into anon_can_select;

    assert not auth_can_select,
      format('AC(e) FAIL: authenticated role still has SELECT on profiles.%s '
             '— revoke select (%s) on public.profiles from authenticated, anon; must be present',
             col, col);
    assert not anon_can_select,
      format('AC(e) FAIL: anon role still has SELECT on profiles.%s '
             '— revoke select (%s) on public.profiles from authenticated, anon; must be present',
             col, col);
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- (f) Sanity — the revoke does NOT collateral-damage parent-visible columns.
--     (f1) Athlete A still reads their own full parent-visible row.
--     (f2) Parent P still reads athlete A's parent-visible metadata.
-- ---------------------------------------------------------------------------

begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    seen_name text;
  begin
    select first_name into seen_name
      from public.profiles
     where id = '20000000-0000-4000-8000-00000000000a';
    assert seen_name = 'Ava',
      format('AC(f1) FAIL: athlete A should still read own first_name "Ava", got "%s"',
             coalesce(seen_name, '<NULL>'));
  end $$;
rollback;

begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    seen_name  text;
    seen_sport text;
  begin
    select first_name, sport into seen_name, seen_sport
      from public.profiles
     where id = '20000000-0000-4000-8000-00000000000a';
    assert seen_name = 'Ava',
      format('AC(f2) FAIL: parent should still read linked athlete A''s first_name "Ava", got "%s"',
             coalesce(seen_name, '<NULL>'));
    assert seen_sport = 'hockey',
      format('AC(f2) FAIL: parent should still read linked athlete A''s sport "hockey", got "%s"',
             coalesce(seen_sport, '<NULL>'));
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- Cleanup: clear the sentinel values so other assertions are not affected.
-- ---------------------------------------------------------------------------

begin;
  update public.profiles
     set position = null,
         focus_area = null,
         next_game_on = null
   where id = '20000000-0000-4000-8000-00000000000a';
commit;


\echo '  [PASS] 16_profile_private_columns (AC a, b, c, d, e, f1, f2)'
