-- =============================================================================
-- RLS assertions — safety_events  (FV-166 AC f)
--
-- (f) safety_events unreadable by BOTH athlete and parent roles.
--     RLS enabled, NO policies → service-role-only. Surfacing this log to the
--     athlete (shame mechanic) or the parent (violates "no parent alert") is
--     vetoed by design in CLAUDE.md Journal Safety Architecture (Option C).
-- =============================================================================

-- Athlete A (the subject of the event) — zero rows.
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.safety_events;
    assert visible = 0,
      format('AC(f) FAIL: athlete can read %s safety_events rows (must be 0)', visible);
  end $$;
rollback;

-- Parent P (linked to A) — zero rows.
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.safety_events;
    assert visible = 0,
      format('AC(f) FAIL: parent can read %s safety_events rows (must be 0)', visible);
  end $$;
rollback;

-- Anon — zero rows.
begin;
  set local role anon;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.safety_events;
    assert visible = 0,
      format('AC(f) FAIL: anon can read %s safety_events rows (must be 0)', visible);
  end $$;
rollback;

\echo '  [PASS] 05_safety_events (AC f)'
