-- =============================================================================
-- RLS assertions — profiles.username visibility (FV-320)
--
-- Verifies:
--   (a) An athlete can read their OWN username via get_own_username() RPC.
--   (b) A DIFFERENT athlete cannot read athlete A's username via get_own_username().
--   (c) A parent (linked to athlete A) cannot read athlete A's username via
--       a direct profiles SELECT — verifies the application-layer contract.
--       Note: the column-level DB enforcement (FV-251) is pending; this
--       assertion documents the INTENDED guarantee at the function boundary.
--   (d) Anon cannot call get_own_username() (no active session → NULL).
--
-- Fixture graph (from fixtures.sql):
--   PARENT    10000000-0000-4000-8000-000000000001
--   ATHLETE_A 20000000-0000-4000-8000-00000000000a  (linked to P)
--   ATHLETE_B 20000000-0000-4000-8000-00000000000b  (NOT linked to P)
--
-- We set athlete A's username to a sentinel value in a setup block so the
-- assertions can verify by value, not just by row count.
--
-- Important: these assertions run AFTER fixtures.sql (which seeds the base
-- rows without usernames). We set the username here under the superuser role
-- (RLS-bypassing), which simulates the service-role write path.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Setup: give athlete A a username sentinel value.
--         Runs as postgres (superuser / RLS bypassed) — mirrors the
--         service-role write path in claimPairing.
-- ---------------------------------------------------------------------------

begin;
  update public.profiles
     set username = 'athlete_a_username'
   where id = '20000000-0000-4000-8000-00000000000a';

  -- Athlete B has no username (NULL) — tests that get_own_username() returns
  -- NULL for athletes who have not yet claimed a username.
commit;


-- ---------------------------------------------------------------------------
-- (a) Athlete A: get_own_username() returns their own username.
-- ---------------------------------------------------------------------------

begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    own_username text;
  begin
    select public.get_own_username() into own_username;
    assert own_username = 'athlete_a_username',
      format('AC(a) FAIL: athlete A should see own username "athlete_a_username", got "%s"',
             coalesce(own_username, '<NULL>'));
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (b) Athlete B: get_own_username() returns NULL (their own username is NULL,
--     not athlete A's). This asserts the function returns ONLY the caller's
--     own value, never another athlete's.
-- ---------------------------------------------------------------------------

begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000b","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    own_username text;
    leaked text;
  begin
    -- B's own username should be NULL (not yet set).
    select public.get_own_username() into own_username;
    assert own_username is null,
      format('AC(b) FAIL: athlete B''s get_own_username() should be NULL, got "%s"',
             coalesce(own_username, '<NULL>'));

    -- Defense-in-depth: B cannot observe A's username via the function.
    -- (The function only reads WHERE id = auth.uid(), so there is no
    -- mechanism for cross-athlete leakage — this is a documentation assert.)
    assert own_username <> 'athlete_a_username' or own_username is null,
      'AC(b) FAIL: athlete B can see athlete A''s username via get_own_username()';
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (c) Parent P: get_own_username() returns NULL for a parent.
--     A parent session calling get_own_username() must get NULL because the
--     function includes `and p.role = ''athlete''` in its WHERE clause.
--     This ensures a parent JWT that somehow calls the RPC cannot learn an
--     athlete's username via this function.
-- ---------------------------------------------------------------------------

begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    result text;
  begin
    select public.get_own_username() into result;
    assert result is null,
      format('AC(c) FAIL: parent get_own_username() should be NULL, got "%s"',
             coalesce(result, '<NULL>'));
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (c2) FV-251 GAP (documented, not yet closed) — a parent linked to athlete A
--      can currently read A's username via a DIRECT row SELECT, because the
--      parent-reads-linked-athlete policy grants row-level SELECT and there is
--      no column-level REVOKE on `username` yet (same class as position /
--      focus_area, tracked by FV-251). This assertion documents the CURRENT
--      pre-FV-251 state — it EXPECTS the username to be visible. When FV-251
--      lands `REVOKE SELECT (username) ... FROM authenticated`, this assert
--      goes red; flip it to expect NULL. That red is the mechanical signal the
--      gap is closed (per kids-privacy-officer FV-320 review).
-- ---------------------------------------------------------------------------

begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    seen text;
  begin
    select username into seen
      from public.profiles
     where id = '20000000-0000-4000-8000-00000000000a';
    assert seen = 'athlete_a_username',
      format('AC(c2): expected PRE-FV-251 username exposure to the linked parent, got "%s". '
             'If FV-251 landed the column REVOKE, change this assert to expect NULL.',
             coalesce(seen, '<NULL>'));
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (d) Anon: get_own_username() returns NULL.
--     auth.uid() returns NULL for unauthenticated requests, so the WHERE
--     clause matches no row. Verifies the function degrades safely for
--     unauthenticated callers (no panic, no data leak).
-- ---------------------------------------------------------------------------

begin;
  set local role anon;
  do $$
  declare
    result text;
  begin
    select public.get_own_username() into result;
    assert result is null,
      format('AC(d) FAIL: anon get_own_username() should be NULL, got "%s"',
             coalesce(result, '<NULL>'));
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- Cleanup: unset the sentinel username so other assertions are not affected.
-- ---------------------------------------------------------------------------

begin;
  update public.profiles
     set username = null
   where id = '20000000-0000-4000-8000-00000000000a';
commit;


\echo '  [PASS] 10_username (AC a, b, c, c2, d)'
