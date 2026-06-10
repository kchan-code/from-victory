-- =============================================================================
-- RLS assertions — journal_entries  (FV-166 AC a, b)
--
-- (a) athlete A cannot SELECT athlete B's journal_entries rows
-- (b) parent role cannot SELECT journal_entries at all
--     + anon role cannot SELECT journal_entries at all
--
-- Mechanism: we set `request.jwt.claims` (the session state PostgREST
-- establishes AFTER it verifies a JWT) and `role` (the DB role PostgREST
-- switches to). RLS + table grants are then enforced exactly as in
-- production, without any JWT-signing machinery. Each check runs in its own
-- transaction so the role/claims reset cleanly between roles.
--
-- A failed `assert` raises SQLSTATE P0004; psql is run with -v ON_ERROR_STOP=1
-- so the first failure exits non-zero and turns the CI job red.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a) Athlete A: sees exactly their OWN journal row, never athlete B's.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    total int;
    leaked int;
  begin
    select count(*) into total from public.journal_entries;
    assert total = 1,
      format('AC(a) FAIL: athlete A should see exactly 1 journal row (own), saw %s', total);

    select count(*) into leaked
      from public.journal_entries
      where content = 'ATHLETE_B_PRIVATE_JOURNAL';
    assert leaked = 0,
      'AC(a) FAIL: athlete A can read athlete B private journal content';

    -- Targeted read by B's athlete_id must also return nothing.
    select count(*) into leaked
      from public.journal_entries
      where athlete_id = '20000000-0000-4000-8000-00000000000b';
    assert leaked = 0,
      'AC(a) FAIL: athlete A can read rows scoped to athlete B';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (b) Parent P: cannot read journal_entries at all (no parent policy).
--     P is linked to athlete A, yet must still see zero journal rows.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible from public.journal_entries;
    assert visible = 0,
      format('AC(b) FAIL: parent can read %s journal_entries rows (must be 0)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (b+) Anon (the unauthenticated anon-key path): zero journal rows.
-- ---------------------------------------------------------------------------
begin;
  set local role anon;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible from public.journal_entries;
    assert visible = 0,
      format('AC(b) FAIL: anon can read %s journal_entries rows (must be 0)', visible);
  end $$;
rollback;

\echo '  [PASS] 01_journal_entries (AC a, b)'
