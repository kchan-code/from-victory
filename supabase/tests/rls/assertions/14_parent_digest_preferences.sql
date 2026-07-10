-- =============================================================================
-- RLS assertions — parent digest preferences  (FV-378)
--
-- Migration 20260612010000_parent_digest_preferences.sql adds no new table —
-- it adds two columns to public.profiles (digest_opt_out, digest_unsubscribe_
-- token), relying entirely on the EXISTING profiles_select_own /
-- profiles_update_own policies (id = auth.uid()) for protection. This file
-- machine-verifies that reliance is sound:
--
--   (a) Parent P can SELECT their own digest_opt_out / digest_unsubscribe_token.
--   (b) Parent P can UPDATE their own digest_opt_out / digest_unsubscribe_token
--       (the settings-toggle / unsubscribe-link write path), and reads back
--       the new values.
--   (c) A DIFFERENT parent Q cannot SELECT parent P's row at all — 0 rows —
--       so Q has no path to P's digest prefs (own-row policy, not
--       role-scoped: profiles_select_own has no "read other parents" branch).
--   (d) Parent Q's UPDATE aimed at P's row (by id) affects 0 rows — RLS's
--       USING clause filters the target row out of Q's writable set entirely,
--       so nothing changes (verified via GET DIAGNOSTICS, not a soft no-op
--       that quietly wrote through).
--   (e) Athlete A (linked to P) cannot SELECT parent P's row — there is no
--       athlete-reads-parent policy (profiles_parent_select_linked_athlete
--       is parent-reads-athlete only) — so the athlete side of the link has
--       no visibility into the parent's digest prefs either.
--   (f) Anon cannot SELECT profiles at all (no anon SELECT grant on
--       public.profiles in 20260612000000_explicit_table_grants.sql) — a
--       hard permission-layer denial (42501), not a soft 0-row result.
--   (g) Bonus — the digest_prefs_role_consistency CHECK constraint itself:
--       athlete A cannot set digest_opt_out on their own row even though
--       profiles_update_own would otherwise allow the self-update. This is
--       the data-integrity backstop behind "digest fields are parent-only."
--
-- Fixture graph (from fixtures.sql): PARENT P is
--   10000000-0000-4000-8000-000000000001, linked to ATHLETE_A
--   (20000000-0000-4000-8000-00000000000a) only. Fixtures do not set
--   digest_opt_out / digest_unsubscribe_token, so P's values start NULL
--   (the documented "NULL = opted in" state) — every block below restores
--   that starting state via rollback.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a) Parent P reads their own digest_opt_out / digest_unsubscribe_token.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    opt_out boolean;
  begin
    select digest_opt_out into opt_out
      from public.profiles
     where id = '10000000-0000-4000-8000-000000000001';
    assert opt_out is null,
      format('AC(a) FAIL: parent P digest_opt_out should start NULL (opted in), got %s', opt_out);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (b) Parent P updates their own digest_opt_out + token; read-back confirms.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    opt_out boolean;
    token   uuid;
    fixed_token constant uuid := 'aaaaaaaa-0000-4000-8000-000000000099';
  begin
    update public.profiles
       set digest_opt_out = true,
           digest_unsubscribe_token = fixed_token
     where id = '10000000-0000-4000-8000-000000000001';

    select digest_opt_out, digest_unsubscribe_token
      into opt_out, token
      from public.profiles
     where id = '10000000-0000-4000-8000-000000000001';

    assert opt_out = true,
      format('AC(b) FAIL: parent P self-update of digest_opt_out did not stick, got %s', opt_out);
    assert token = fixed_token,
      format('AC(b) FAIL: parent P self-update of digest_unsubscribe_token did not stick, got %s', token);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (c) A DIFFERENT parent Q sees 0 rows for parent P (own-row policy, no
--     "read other parents" branch exists).
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible
      from public.profiles
     where id = '10000000-0000-4000-8000-000000000001';
    assert visible = 0,
      format('AC(c) FAIL: a different parent can see %s rows for parent P (must be 0)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (d) A DIFFERENT parent Q's UPDATE aimed at parent P's row affects 0 rows —
--     RLS filters P's row out of Q's updatable set entirely.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    affected int;
  begin
    update public.profiles
       set digest_opt_out = true
     where id = '10000000-0000-4000-8000-000000000001';
    get diagnostics affected = row_count;
    assert affected = 0,
      format('AC(d) FAIL: a different parent''s UPDATE touched %s rows of parent P''s profile (must be 0)', affected);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (e) Athlete A (linked to P) cannot SELECT parent P's row — the link only
--     grants parent-reads-athlete, never the reverse.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible
      from public.profiles
     where id = '10000000-0000-4000-8000-000000000001';
    assert visible = 0,
      format('AC(e) FAIL: linked athlete A can see %s rows for parent P (must be 0)', visible);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (f) Anon cannot SELECT profiles at all — no anon SELECT grant on
--     public.profiles, so this must be a hard permission denial (42501).
-- ---------------------------------------------------------------------------
begin;
  set local role anon;
  do $$
  declare
    ok boolean := false;
  begin
    begin
      perform count(*) from public.profiles;
    exception
      when insufficient_privilege then
        ok := true;  -- expected: anon has no SELECT grant on profiles
    end;
    assert ok,
      'AC(f) FAIL: anon should be permission-denied (42501) reading profiles, but the SELECT succeeded';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (g) Bonus — digest_prefs_role_consistency CHECK constraint: athlete A
--     cannot set digest_opt_out on their own row, even though
--     profiles_update_own's RLS would otherwise permit the self-update.
--     This is the data-integrity backstop keeping digest fields parent-only.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    blocked boolean := false;
  begin
    begin
      update public.profiles
         set digest_opt_out = true
       where id = '20000000-0000-4000-8000-00000000000a';
    exception
      when check_violation then
        blocked := true;  -- expected: digest_prefs_role_consistency fires
    end;
    assert blocked,
      'AC(g) FAIL: athlete A was able to set digest_opt_out on their own row '
      '(digest_prefs_role_consistency should have raised a check_violation)';
  end $$;
rollback;

\echo '  [PASS] 14_parent_digest_preferences (FV-378: parent own-read/write; cross-parent + athlete + anon denied; role-consistency guard)'
