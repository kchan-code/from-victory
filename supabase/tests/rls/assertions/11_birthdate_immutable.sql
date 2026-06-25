-- =============================================================================
-- RLS assertions — profiles.birthdate immutability (FV-349)
--
-- Verifies three properties introduced by the profiles_birthdate_immutable
-- trigger (migration 20260625170000):
--
--   (a) An athlete updating their own row (profiles_update_own RLS, role
--       'authenticated') CANNOT change their birthdate. The trigger must raise.
--
--   (b) A normal self-update (sport or username — fields the athlete is allowed
--       to change) still succeeds. The trigger must NOT fire on a birthdate-
--       unchanged UPDATE, leaving profiles_update_own unaffected.
--
--   (c) The service_role / superuser bypass works: a postgres-role UPDATE of
--       birthdate on an athlete row succeeds (mediated correction path).
--
-- Fixture graph (from fixtures.sql):
--   ATHLETE_A  20000000-0000-4000-8000-00000000000a  (role=athlete, hockey)
--
-- Mechanism: same pattern as the other assertions — set request.jwt.claims
-- + set role authenticated to simulate a PostgREST authenticated session;
-- use DO $$ ... assert ... $$ for the assertion body so the first failure
-- aborts the run via ON_ERROR_STOP=1.
--
-- Important: the trigger itself is guarded per-row. Assertions (a) and (b)
-- both run as the authenticated role (simulating the athlete's own session).
-- Assertion (c) runs as postgres (the superuser) — the same role used by the
-- migration runner, Studio, and the RLS harness fixture seeder.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a) Athlete A: updating OWN row — attempt to change birthdate must FAIL.
--
--    We expect an exception (SQLSTATE P0001) raised by
--    enforce_birthdate_immutable(). We capture it with an EXCEPTION handler
--    and assert it was raised; if the UPDATE succeeds without raising, the
--    assertion fails.
-- ---------------------------------------------------------------------------

begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    blocked boolean := false;
  begin
    begin
      -- Attempt to shift birthdate by one year. Any non-identical value should
      -- be blocked regardless of direction.
      update public.profiles
         set birthdate = birthdate - interval '1 year'
       where id = '20000000-0000-4000-8000-00000000000a';
    exception
      when others then
        -- Any exception here means the trigger fired and blocked the update.
        -- SQLSTATE P0001 is what enforce_birthdate_immutable() raises, but we
        -- accept any exception so a renamed errcode doesn't produce a false pass.
        blocked := true;
    end;

    assert blocked = true,
      'AC(a) FAIL: athlete self-update of birthdate should be blocked by '
      'enforce_birthdate_immutable(), but the UPDATE succeeded without raising.';
  end $$;
rollback;


-- ---------------------------------------------------------------------------
-- (b) Athlete A: a normal self-update (sport switch) must SUCCEED.
--
--    The trigger only fires when NEW.birthdate IS DISTINCT FROM OLD.birthdate.
--    A sport-only update leaves birthdate unchanged, so the trigger returns NEW
--    without raising. This asserts that profiles_update_own is not broken.
--
--    We toggle sport hockey→basketball and back within the transaction.
-- ---------------------------------------------------------------------------

begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    updated_sport text;
  begin
    -- Athlete A starts as hockey (fixtures.sql). Switch to basketball.
    update public.profiles
       set sport = 'basketball',
           sport_selected_at = now()
     where id = '20000000-0000-4000-8000-00000000000a';

    -- Read back to confirm the write landed.
    select sport into updated_sport
      from public.profiles
     where id = '20000000-0000-4000-8000-00000000000a';

    assert updated_sport = 'basketball',
      format('AC(b) FAIL: athlete sport update should succeed (birthdate unchanged), '
             'but sport is "%s" not "basketball". '
             'The birthdate immutability trigger may be blocking non-birthdate updates.',
             coalesce(updated_sport, '<NULL>'));
  end $$;
rollback;
-- NOTE: rollback restores athlete A's sport to 'hockey' (as seeded in fixtures.sql),
-- so downstream assertions are unaffected.


-- ---------------------------------------------------------------------------
-- (c) Postgres superuser (service_role bypass): changing birthdate on an
--     athlete row must SUCCEED.
--
--    Runs as the default postgres login role (superuser), which is what the
--    migration runner, Studio, and the RLS harness fixture seeder use.
--    The trigger checks current_setting('is_superuser', true) = 'on' and
--    returns NEW without raising. This proves the mediated-correction bypass
--    is functional.
-- ---------------------------------------------------------------------------

begin;
  -- No SET ROLE here — running as the postgres superuser (the default for the
  -- harness). current_setting('is_superuser', true) = 'on' for this session.
  do $$
  declare
    new_birthdate date;
    original_birthdate date;
  begin
    -- Save original birthdate to restore after the test.
    select birthdate into original_birthdate
      from public.profiles
     where id = '20000000-0000-4000-8000-00000000000a';

    -- Attempt a birthdate change as postgres. This must NOT raise.
    update public.profiles
       set birthdate = original_birthdate + interval '1 year'
     where id = '20000000-0000-4000-8000-00000000000a';

    select birthdate into new_birthdate
      from public.profiles
     where id = '20000000-0000-4000-8000-00000000000a';

    assert new_birthdate = original_birthdate + interval '1 year',
      format('AC(c) FAIL: service_role/postgres bypass should allow birthdate update, '
             'but birthdate is still "%s" (expected "%s").',
             coalesce(new_birthdate::text, '<NULL>'),
             coalesce((original_birthdate + interval '1 year')::text, '<NULL>'));
  end $$;
rollback;
-- ROLLBACK restores athlete A's birthdate to the fixture value (2010-01-01).


\echo '  [PASS] 11_birthdate_immutable (AC a, b, c)'
