-- =============================================================================
-- RLS assertions — device_pairings  (FV-166 AC e)
--
-- (e) device_pairings rows are not readable cross-user (in fact not readable
--     by ANY client role — the table has RLS enabled with NO policies, so it
--     is service-role-only). We prove the two client-relevant angles:
--       - the athlete the pairing belongs to (A) cannot read it
--       - an unrelated client (athlete B) cannot read it cross-user
--       - the parent who issued it (P) cannot read it
--       - anon cannot read it
-- =============================================================================

-- Athlete A (the pairing's own athlete) — still zero rows.
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.device_pairings;
    assert visible = 0,
      format('AC(e) FAIL: athlete A can read %s device_pairings rows (must be 0)', visible);
  end $$;
rollback;

-- Athlete B (unrelated) — cross-user read must be zero.
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000b","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible
      from public.device_pairings
      where athlete_id = '20000000-0000-4000-8000-00000000000a';
    assert visible = 0,
      format('AC(e) FAIL: athlete B can read athlete A device_pairings cross-user (%s rows)', visible);
  end $$;
rollback;

-- Parent P (the issuer) — also zero (reads flow through service role only).
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.device_pairings;
    assert visible = 0,
      format('AC(e) FAIL: parent can read %s device_pairings rows (must be 0)', visible);
  end $$;
rollback;

-- Anon — zero.
begin;
  set local role anon;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.device_pairings;
    assert visible = 0,
      format('AC(e) FAIL: anon can read %s device_pairings rows (must be 0)', visible);
  end $$;
rollback;

\echo '  [PASS] 04_device_pairings (AC e)'
