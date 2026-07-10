-- =============================================================================
-- RLS assertions — activity_rollup  (FV-415)
--
-- activity_rollup is a service-role-only, AGGREGATE-ONLY analytics table. RLS is
-- enabled with NO policies, so authenticated (athlete or parent) and anon must
-- all see ZERO rows. Writes are service-role-only (no INSERT grant to client
-- roles); only the owner metrics dashboard reads it (also service-role).
--
-- Same two-layer model as activity_events (12_activity_events.sql): the SELECT
-- grant is present (door open) so the 0-row result is a real RLS denial (lock
-- engaged), not a "permission denied" that never reaches the boundary.
--
-- Also asserts the STRUCTURAL privacy invariant: the table exposes ONLY the
-- aggregate-only column set — no athlete_id, no PII column may ever drift in.
-- The fixtures seed one aggregate row so "0 visible" is a real denial and the
-- service_role read is a real read.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Structural: activity_rollup columns are EXACTLY the aggregate-only set.
-- No athlete_id, no PII. Runs as superuser (catalog introspection, no role).
-- ---------------------------------------------------------------------------
do $$
declare cols text[];
begin
  select array_agg(column_name order by column_name) into cols
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'activity_rollup';

  assert cols = array[
    'active_athletes','audio_mode','event_count','event_name','grain',
    'network_mode','period_start','sport','surface','updated_at'
  ],
    format('FV-415 FAIL: activity_rollup columns drifted from aggregate-only set: %s', cols);

  assert not ('athlete_id' = any(cols)),
    'FV-415 FAIL: activity_rollup must NOT have an athlete_id column';
end $$;

-- ---------------------------------------------------------------------------
-- Athlete A — zero rows.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.activity_rollup;
    assert visible = 0,
      format('FV-415 FAIL: athlete can read %s activity_rollup rows (must be 0)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Parent P (linked to A) — zero rows.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.activity_rollup;
    assert visible = 0,
      format('FV-415 FAIL: parent can read %s activity_rollup rows (must be 0)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Anon — zero rows.
-- ---------------------------------------------------------------------------
begin;
  set local role anon;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.activity_rollup;
    assert visible = 0,
      format('FV-415 FAIL: anon can read %s activity_rollup rows (must be 0)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Authenticated cannot INSERT (no grant + no policy → permission denied).
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare ok boolean := false;
  begin
    begin
      insert into public.activity_rollup
        (grain, period_start, event_name, active_athletes, event_count)
        values ('day', current_date - 2, 'app_open', 1, 1);
    exception when insufficient_privilege then
      ok := true; -- permission denied = the expected denial
    end;
    assert ok, 'FV-415 FAIL: authenticated was able to INSERT into activity_rollup (must be denied)';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- service_role CAN read the aggregate (bypasses RLS + has the grant). Confirms
-- the table is not merely locked to everyone.
-- ---------------------------------------------------------------------------
begin;
  set local role service_role;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.activity_rollup;
    assert visible >= 1,
      format('FV-415 FAIL: service_role must read activity_rollup, saw %s (expected >=1)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Client roles cannot EXECUTE the rollup function (service-role-only).
-- ---------------------------------------------------------------------------
do $$
begin
  assert not has_function_privilege('authenticated', 'public.rollup_activity_events(integer)', 'execute'),
    'FV-415 FAIL: authenticated must NOT have EXECUTE on rollup_activity_events';
  assert not has_function_privilege('anon', 'public.rollup_activity_events(integer)', 'execute'),
    'FV-415 FAIL: anon must NOT have EXECUTE on rollup_activity_events';
  assert has_function_privilege('service_role', 'public.rollup_activity_events(integer)', 'execute'),
    'FV-415 FAIL: service_role must have EXECUTE on rollup_activity_events';
end $$;

\echo '  [PASS] 17_activity_rollup (FV-415)'
