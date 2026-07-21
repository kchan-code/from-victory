-- =============================================================================
-- RLS assertions — adult_athlete vs athlete boundary  (FV-443)
--
-- Mechanical backstop before the ENABLE_ADULT_SIGNUP flip (13-25 expansion
-- arc). role='adult_athlete' (FV-325, 20260625000000_adult_athlete_role.sql)
-- is a distinct third profile role: BOTH the Stripe payer AND the trainee on
-- one account, with NO parent and NO parent_athlete_links row. This file
-- machine-verifies that role never leaks into the parent-linked-athlete
-- surface and never gets a wider grant than the athlete self-read pattern.
--
--   (a) ADULT_ATHLETE (AA) is invisible to a parent session.
--       profiles_parent_select_linked_athlete requires role = 'athlete' AND a
--       parent_athlete_links row; AA's role is 'adult_athlete', so parent P
--       (and any other caller acting as a linked-parent-shaped session) sees
--       zero rows for AA regardless of any link — there both isn't and can't
--       be one (AC b proves the "can't be one" half).
--
--   (b) parent_athlete_links can NEVER contain AA on either side.
--       check_parent_athlete_link_roles() (baseline migration) requires
--       parent_id -> role='parent' and athlete_id -> role='athlete'; AA is
--       role='adult_athlete', matching neither branch. Verified by attempting
--       both orientations as the postgres superuser — RLS/grants are bypassed
--       for postgres, but BEFORE triggers still fire (same principle as
--       11_birthdate_immutable.sql AC(c)), so this isolates the trigger
--       invariant from the client grant layer tested elsewhere.
--
--   (c) An ADULT_ATHLETE session:
--       (c1) cannot SELECT another profile (athlete A's row) — 0 rows.
--       (c2) cannot UPDATE another profile (athlete A's row) — 0 rows affected
--            (profiles_update_own's USING clause filters it out entirely).
--       (c3) cannot SELECT any parent_athlete_links row — 0 rows (AA is never
--            parent_id nor athlete_id in any row, per AC(b)).
--       (c4) cannot SELECT another account's subscriptions row (parent P's) —
--            sees exactly 1 row total (their own), not P's.
--       (c5) CAN SELECT their own subscriptions row (parent_id = their own
--            id) — subscriptions_select_own_parent is keyed on
--            `parent_id = auth.uid()`, role-agnostic, so an adult_athlete
--            (its own payer) is covered by the same policy a parent uses.
--       (c6) cannot UPDATE even their OWN subscriptions row — subscriptions
--            has no client UPDATE grant at all (service-role/webhook-only,
--            20260520200000 + 20260612000000); this is the same two-layer
--            denial 03_subscriptions.sql AC(d) proves for a parent, repeated
--            here for the adult_athlete-as-payer path.
--
--   (d) Cross-check with the EXISTING minor-athlete boundary
--       (03_subscriptions.sql AC(d)): a minor `athlete` session (A) reads 0
--       subscriptions rows — confirmed against the actual policy
--       (subscriptions_select_own_parent: `parent_id = auth.uid()`; no
--       athlete row's id is ever a subscriptions.parent_id, so this is a
--       structural 0, not a special case). This file re-affirms that 0 in the
--       same breath as AA's 1, to make the adult-vs-minor contrast explicit
--       under the FV-443 boundary this file is named for. AC(d) is NOT a new
--       boundary — it is already primary-tested by 03_subscriptions.sql
--       AC(d); no policy change was needed or made.
--
--   (e) ADULT_ATHLETE self-access to athlete-private columns (position,
--       focus_area) matches the athlete personalization RPC pattern
--       (get_own_personalization(), FV-361/20260708120000) — no table-wide
--       grant bypass:
--       (e1) get_own_personalization() returns AA's own sentinel values.
--       (e2) A direct SELECT of position on AA's own row is STILL denied
--            (insufficient_privilege) — `authenticated`'s column-restricted
--            SELECT grant on profiles omits position/focus_area for EVERY
--            caller, adult_athlete included; only the SECURITY DEFINER RPC
--            can read it back. Mirrors 16_profile_private_columns.sql AC(d)
--            (athlete A's own next_game_on is likewise column-denied).
--
-- Fixture graph (from fixtures.sql):
--   PARENT         P  10000000-0000-4000-8000-000000000001 (linked to A only)
--   ATHLETE        A  20000000-0000-4000-8000-00000000000a (minor, linked to P)
--   ADULT_ATHLETE AA  70000000-0000-4000-8000-000000000001 (18+, own subscription,
--                     no parent, no link)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a) Parent P: SELECT of ADULT_ATHLETE's profile row returns 0 rows.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible
      from public.profiles
     where id = '70000000-0000-4000-8000-000000000001';
    assert visible = 0,
      format('AC(a) FAIL: parent P can see %s rows for ADULT_ATHLETE (must be 0)', visible);
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (b) check_parent_athlete_link_roles() rejects ADULT_ATHLETE on either side.
--     Runs as the postgres superuser (bypasses RLS + grants, matching
--     fixtures.sql and 11_birthdate_immutable.sql AC(c)) so the assertion
--     isolates the trigger invariant, not the client-grant denial tested
--     elsewhere (parent_athlete_links has no client INSERT grant at all).
-- ---------------------------------------------------------------------------

-- (b1) AA as athlete_id (parent_id = a real parent P).
begin;
  do $$
  declare
    blocked boolean := false;
  begin
    begin
      insert into public.parent_athlete_links (parent_id, athlete_id)
        values (
          '10000000-0000-4000-8000-000000000001',  -- P, role='parent'
          '70000000-0000-4000-8000-000000000001'    -- AA, role='adult_athlete'
        );
    exception
      when others then
        -- check_parent_athlete_link_roles() raises a plain `raise exception`
        -- (SQLSTATE P0001 / raise_exception); catch broadly so a message or
        -- errcode edit doesn't produce a false pass, matching
        -- 11_birthdate_immutable.sql AC(a)'s convention.
        blocked := true;
    end;
    assert blocked,
      'AC(b1) FAIL: parent_athlete_links accepted ADULT_ATHLETE as athlete_id '
      '— check_parent_athlete_link_roles() should have rejected a non-athlete role.';
  end $$;
rollback;

-- (b2) AA as parent_id (athlete_id = a real athlete A).
begin;
  do $$
  declare
    blocked boolean := false;
  begin
    begin
      insert into public.parent_athlete_links (parent_id, athlete_id)
        values (
          '70000000-0000-4000-8000-000000000001',  -- AA, role='adult_athlete'
          '20000000-0000-4000-8000-00000000000a'    -- A, role='athlete'
        );
    exception
      when others then
        blocked := true;
    end;
    assert blocked,
      'AC(b2) FAIL: parent_athlete_links accepted ADULT_ATHLETE as parent_id '
      '— check_parent_athlete_link_roles() should have rejected a non-parent role.';
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (c1) ADULT_ATHLETE cannot SELECT another profile (athlete A's row).
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible
      from public.profiles
     where id = '20000000-0000-4000-8000-00000000000a';
    assert visible = 0,
      format('AC(c1) FAIL: ADULT_ATHLETE can see %s rows for athlete A (must be 0)', visible);
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (c2) ADULT_ATHLETE's UPDATE aimed at athlete A's profile affects 0 rows —
--      profiles_update_own's USING clause filters A's row out of AA's
--      updatable set entirely (same GET DIAGNOSTICS idiom as
--      14_parent_digest_preferences.sql AC(d)).
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    affected int;
  begin
    update public.profiles
       set first_name = 'Hijacked'
     where id = '20000000-0000-4000-8000-00000000000a';
    get diagnostics affected = row_count;
    assert affected = 0,
      format('AC(c2) FAIL: ADULT_ATHLETE''s UPDATE touched %s rows of athlete A''s profile (must be 0)', affected);
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (c3) ADULT_ATHLETE cannot SELECT any parent_athlete_links row (AA is never
--      parent_id nor athlete_id in any row — AC(b) proves it never can be).
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible from public.parent_athlete_links;
    assert visible = 0,
      format('AC(c3) FAIL: ADULT_ATHLETE can see %s parent_athlete_links rows (must be 0)', visible);
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (c4) + (c5) ADULT_ATHLETE sees exactly ITS OWN subscriptions row (1), never
--      parent P's — subscriptions_select_own_parent is `parent_id = auth.uid()`,
--      role-agnostic, so it grants AA (its own payer) the same self-read a
--      parent gets, and nothing more.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    total_visible int;
    own_status    text;
  begin
    select count(*) into total_visible from public.subscriptions;
    assert total_visible = 1,
      format('AC(c4) FAIL: ADULT_ATHLETE can see %s subscriptions rows (must be exactly 1, its own)', total_visible);

    select status into own_status
      from public.subscriptions
     where parent_id = '70000000-0000-4000-8000-000000000001';
    assert own_status = 'active',
      format('AC(c5) FAIL: ADULT_ATHLETE should read own subscriptions.status = "active", got "%s"',
             coalesce(own_status, '<NULL>'));

    -- Belt-and-suspenders: confirm parent P's row specifically is NOT among
    -- the visible set (distinct from "can see 1 row" which could in theory
    -- be a mis-scoped policy returning the wrong row).
    perform 1 from public.subscriptions where parent_id = '10000000-0000-4000-8000-000000000001';
    if found then
      raise exception 'AC(c4) FAIL: ADULT_ATHLETE can see parent P''s subscriptions row';
    end if;
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (c6) ADULT_ATHLETE cannot UPDATE even its OWN subscriptions row — no client
--      UPDATE grant exists on subscriptions (service-role/webhook-only,
--      same two-layer denial 03_subscriptions.sql AC(d) proves for a parent).
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  begin
    begin
      update public.subscriptions
         set status = 'canceled'
       where parent_id = '70000000-0000-4000-8000-000000000001';
      raise exception 'AC(c6) FAIL: ADULT_ATHLETE UPDATE of own subscriptions row unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then
        null;  -- expected: no UPDATE grant on subscriptions for any client role
    end;
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (d) Cross-check: minor athlete A reads 0 subscriptions rows (already the
--     primary assertion in 03_subscriptions.sql AC(d) — re-affirmed here,
--     alongside AC(c4)'s "AA sees 1," to make the adult-vs-minor payer
--     distinction explicit for FV-443. NOT a new boundary; no policy exists
--     or was added that would let a minor athlete read subscriptions, so this
--     asserts CURRENT actual behavior per the task brief, not a change.
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
      format('AC(d) FAIL: minor athlete A can read %s subscriptions rows (must be 0; see 03_subscriptions.sql AC(d))', visible);
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (e) ADULT_ATHLETE self-access to position/focus_area matches the athlete
--     personalization RPC pattern (get_own_personalization()) — no
--     table-wide grant bypass. Sentinel values set as postgres (bypasses
--     RLS, same idiom as 16_profile_private_columns.sql), cleaned up after.
-- ---------------------------------------------------------------------------

begin;
  update public.profiles
     set position   = 'Bomber',
         focus_area = 'focus'
   where id = '70000000-0000-4000-8000-000000000001';
commit;

-- (e1) get_own_personalization() returns AA's own sentinel values.
begin;
  set local request.jwt.claims to '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    own_position   text;
    own_focus_area text;
  begin
    select position, focus_area into own_position, own_focus_area
      from public.get_own_personalization();
    assert own_position = 'Bomber',
      format('AC(e1) FAIL: ADULT_ATHLETE should see own position "Bomber" via get_own_personalization(), got "%s"',
             coalesce(own_position, '<NULL>'));
    assert own_focus_area = 'focus',
      format('AC(e1) FAIL: ADULT_ATHLETE should see own focus_area "focus" via get_own_personalization(), got "%s"',
             coalesce(own_focus_area, '<NULL>'));
  end $$;
rollback;

-- (e2) A direct SELECT of position on AA's OWN row is still column-denied —
--      no table-wide bypass just because the role is adult_athlete.
begin;
  set local request.jwt.claims to '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    seen text;
  begin
    select position into seen
      from public.profiles
     where id = '70000000-0000-4000-8000-000000000001';
    raise exception
      'AC(e2) FAIL: ADULT_ATHLETE read own position via direct SELECT (got "%s") '
      '— expected insufficient_privilege (column-restricted grant omits '
      'position/focus_area for every caller; get_own_personalization() is the only path).',
      coalesce(seen, '<NULL>');
  exception
    when insufficient_privilege then
      null; -- expected
  end $$;
rollback;

-- Cleanup: clear the sentinel values so they don't leak into any later file.
begin;
  update public.profiles
     set position = null,
         focus_area = null
   where id = '70000000-0000-4000-8000-000000000001';
commit;


\echo '  [PASS] 18_adult_athlete_boundary (AC a, b1, b2, c1-c6, d, e1, e2)'
