-- =============================================================================
-- RLS assertions — seat_active column on parent_athlete_links  (FV-585)
--
-- KC decision D2 (2026-09-17): on a plan downgrade with no athlete selection,
-- PAUSE athlete access at renewal until the parent selects who stays active.
-- `parent_athlete_links.seat_active` (20260918090000_seat_selection.sql) is
-- the one piece of new per-athlete state that decision needs. This file
-- machine-verifies the READ/WRITE boundary around that column:
--
--   (a) Parent P can read seat_active on their OWN link (to athlete A).
--   (b) Athlete A can read seat_active on their OWN link (to parent P).
--   (c) Parent P's UPDATE of seat_active on their own link affects 0 rows —
--       parent_athlete_links has NO client UPDATE grant at all (baseline +
--       explicit_table_grants migrations); this is the SAME two-layer denial
--       03_subscriptions.sql AC(d) proves for subscriptions, repeated here
--       for the new column.
--   (d) Athlete A's UPDATE of seat_active on their own link likewise affects
--       0 rows / is permission-denied — same no-grant boundary as (c).
--   (e) An UNRELATED parent Q (no parent_athlete_links row on either side)
--       reads ZERO parent_athlete_links rows at all, so necessarily reads
--       zero seat_active values for P/A's link — the existing
--       `parent_athlete_links_select_participant` policy (parent_id =
--       auth.uid() OR athlete_id = auth.uid()) already scopes this; this
--       assertion pins that the new column doesn't widen that policy.
--
-- Writes to seat_active happen exclusively via
-- lib/actions/seat-selection.ts::setActiveSeats (service role) — this file
-- proves no client role can reach it directly, by policy OR by grant.
--
-- Fixture graph (from fixtures.sql):
--   PARENT    P  10000000-0000-4000-8000-000000000001 (linked to A only)
--   ATHLETE   A  20000000-0000-4000-8000-00000000000a (linked to P)
--   PARENT_Q  Q  10000000-0000-4000-8000-000000000002 (unrelated — no links)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a) Parent P reads seat_active = true (the column default) on their own
--     link to athlete A.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    seen boolean;
  begin
    select seat_active into seen
      from public.parent_athlete_links
     where parent_id = '10000000-0000-4000-8000-000000000001'
       and athlete_id = '20000000-0000-4000-8000-00000000000a';
    assert seen is true,
      format('AC(a) FAIL: parent P should read seat_active = true on own link, got %s', coalesce(seen::text, '<NULL/no row>'));
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (b) Athlete A reads seat_active = true on their own link to parent P.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    seen boolean;
  begin
    select seat_active into seen
      from public.parent_athlete_links
     where parent_id = '10000000-0000-4000-8000-000000000001'
       and athlete_id = '20000000-0000-4000-8000-00000000000a';
    assert seen is true,
      format('AC(b) FAIL: athlete A should read seat_active = true on own link, got %s', coalesce(seen::text, '<NULL/no row>'));
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (c) Parent P cannot UPDATE seat_active on their own link — no client
--     UPDATE grant exists on parent_athlete_links at all.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  -- EFFECT-BASED (not grant-based): on the hosted image a client role may
  -- hold a table-level UPDATE grant, in which case RLS (no UPDATE policy)
  -- makes the write a silent 0-row no-op rather than an error; with the
  -- FV-568 grant pin it raises insufficient_privilege instead. Either way the
  -- row must be UNCHANGED — that is the boundary we assert.
  do $$
  begin
    begin
      update public.parent_athlete_links
         set seat_active = false
       where parent_id = '10000000-0000-4000-8000-000000000001'
         and athlete_id = '20000000-0000-4000-8000-00000000000a';
    exception
      when insufficient_privilege then
        null;  -- acceptable: grant pin denies outright
    end;
  end $$;
  reset role;
  do $$
  declare
    still boolean;
  begin
    select seat_active into still
      from public.parent_athlete_links
     where parent_id = '10000000-0000-4000-8000-000000000001'
       and athlete_id = '20000000-0000-4000-8000-00000000000a';
    assert still is true,
      format('AC(c) FAIL: parent P''s UPDATE of seat_active took effect (now %s) — client write boundary broken', coalesce(still::text,'<NULL/no row>'));
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (d) Athlete A cannot UPDATE seat_active on their own link — same no-grant
--     boundary as (c).
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  -- EFFECT-BASED (not grant-based): on the hosted image a client role may
  -- hold a table-level UPDATE grant, in which case RLS (no UPDATE policy)
  -- makes the write a silent 0-row no-op rather than an error; with the
  -- FV-568 grant pin it raises insufficient_privilege instead. Either way the
  -- row must be UNCHANGED — that is the boundary we assert.
  do $$
  begin
    begin
      update public.parent_athlete_links
         set seat_active = false
       where parent_id = '10000000-0000-4000-8000-000000000001'
         and athlete_id = '20000000-0000-4000-8000-00000000000a';
    exception
      when insufficient_privilege then
        null;  -- acceptable: grant pin denies outright
    end;
  end $$;
  reset role;
  do $$
  declare
    still boolean;
  begin
    select seat_active into still
      from public.parent_athlete_links
     where parent_id = '10000000-0000-4000-8000-000000000001'
       and athlete_id = '20000000-0000-4000-8000-00000000000a';
    assert still is true,
      format('AC(d) FAIL: athlete A''s UPDATE of seat_active took effect (now %s) — client write boundary broken', coalesce(still::text,'<NULL/no row>'));
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (e) Unrelated parent Q reads zero parent_athlete_links rows at all — so
--     necessarily zero seat_active values for P/A's link.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible from public.parent_athlete_links;
    assert visible = 0,
      format('AC(e) FAIL: unrelated parent Q can see %s parent_athlete_links rows (must be 0)', visible);
  end $$;
rollback;


\echo '  [PASS] 21_seat_selection (AC a-e)'
