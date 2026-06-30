-- =============================================================================
-- RLS assertions — activity_events
--
-- activity_events is a service-role-only, EVENT-ONLY analytics log. RLS is
-- enabled with NO policies, so authenticated (athlete or parent) and anon must
-- all see ZERO rows. Writes are service-role-only (no INSERT grant to client
-- roles); only the owner metrics dashboard reads it (also service-role).
--
-- Mirrors 05_safety_events.sql. The fixtures seed one app_open row for ATHLETE_A
-- so "0 visible" is a real RLS denial, not an empty-table artifact.
-- =============================================================================

-- Athlete A (the subject of the event) — zero rows.
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.activity_events;
    assert visible = 0,
      format('activity_events FAIL: athlete can read %s rows (must be 0)', visible);
  end $$;
rollback;

-- Parent P (linked to A) — zero rows.
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.activity_events;
    assert visible = 0,
      format('activity_events FAIL: parent can read %s rows (must be 0)', visible);
  end $$;
rollback;

-- Anon — zero rows.
begin;
  set local role anon;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.activity_events;
    assert visible = 0,
      format('activity_events FAIL: anon can read %s rows (must be 0)', visible);
  end $$;
rollback;

-- Authenticated cannot INSERT (no grant + no policy → permission denied OR
-- 0-row write). Assert the row count does not increase from an athlete-role
-- insert attempt.
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare ok boolean := false;
  begin
    begin
      insert into public.activity_events (athlete_id, event_name)
        values ('20000000-0000-4000-8000-00000000000a', 'app_open');
    exception when insufficient_privilege then
      ok := true; -- permission denied = the expected denial
    end;
    assert ok, 'activity_events FAIL: authenticated was able to INSERT (must be denied)';
  end $$;
rollback;

\echo '  [PASS] 07_activity_events'
