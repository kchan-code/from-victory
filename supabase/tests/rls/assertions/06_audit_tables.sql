-- =============================================================================
-- RLS assertions — auth_rate_limit_events + account_deletion_events  (FV-218)
--
-- Both tables are service-role-only audit logs: RLS is enabled with NO client
-- policies (deny by default). Authenticated and anon roles receive SELECT grants
-- (door open) but see 0 rows because no policy grants a matching USING clause
-- (lock engaged). This is the same door=grant / lock=RLS pattern as
-- device_pairings and safety_events.
--
-- Surfacing these logs to any client role would be a privacy regression:
--   - auth_rate_limit_events: may contain IP addresses and user IDs tied to
--     rate-limiting events — internal ops data only.
--   - account_deletion_events: audit trail of deletion requests — data-subject
--     rights records, never readable by client roles.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- auth_rate_limit_events — athlete A
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.auth_rate_limit_events;
    assert visible = 0,
      format('FV-218 FAIL: athlete A can read %s auth_rate_limit_events rows (must be 0)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- auth_rate_limit_events — parent P
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.auth_rate_limit_events;
    assert visible = 0,
      format('FV-218 FAIL: parent P can read %s auth_rate_limit_events rows (must be 0)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- auth_rate_limit_events — anon
-- ---------------------------------------------------------------------------
begin;
  set local role anon;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.auth_rate_limit_events;
    assert visible = 0,
      format('FV-218 FAIL: anon can read %s auth_rate_limit_events rows (must be 0)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- account_deletion_events — athlete A
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.account_deletion_events;
    assert visible = 0,
      format('FV-218 FAIL: athlete A can read %s account_deletion_events rows (must be 0)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- account_deletion_events — parent P
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.account_deletion_events;
    assert visible = 0,
      format('FV-218 FAIL: parent P can read %s account_deletion_events rows (must be 0)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- account_deletion_events — anon
-- ---------------------------------------------------------------------------
begin;
  set local role anon;
  do $$
  declare visible int;
  begin
    select count(*) into visible from public.account_deletion_events;
    assert visible = 0,
      format('FV-218 FAIL: anon can read %s account_deletion_events rows (must be 0)', visible);
  end $$;
rollback;

\echo '  [PASS] 06_audit_tables (FV-218)'
