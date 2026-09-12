-- =============================================================================
-- RLS assertions — full client-role GRANT matrix (FV-568)
--
-- 20260910133456_client_grant_matrix_pin.sql pins the client-role GRANT
-- matrix for every `public` relation, the one client-visible sequence
-- (activity_events_id_seq), and every trigger/cron/RPC function, closing the
-- hosted-default-privilege gap FV-507 fixed for `subscriptions` alone. This
-- file is the single source of truth verifying that pin: adding a table
-- means adding its row to section (b) below.
--
-- Sections:
--   (a) Diagnostic dump — relacl / column-acl / sequence-acl / function-acl,
--       printed to the CI log as evidence, before any hard assertion.
--   (b) Full has_table_privilege matrix: every relation x {anon,
--       authenticated, service_role} x {SELECT, INSERT, UPDATE, DELETE}.
--   (c) profiles column allowlist: has_column_privilege for the 10
--       allowed / 5 withheld columns, both roles, plus the UPDATE-stays-
--       table-level sanity check.
--   (d) Sequence: has_sequence_privilege matrix.
--   (e) Functions: has_function_privilege matrix for all 12 functions.
--   (f) Default-privilege probe: a brand-new table/sequence created inside a
--       rolled-back transaction inherits the Supabase-documented opt-out
--       (SELECT-only for tables, USAGE+SELECT for sequences) — proves the
--       `alter default privileges for role postgres` statements at the
--       bottom of the pin migration work, not just the per-object
--       REVOKE/GRANT above them. The function probe documents a DIFFERENT,
--       KC-decided, already-known result: a brand-new function still
--       inherits EXECUTE-to-PUBLIC, because that default comes from
--       Postgres's own built-in acldefault(), not the default-privileges
--       delta `alter default privileges ... revoke execute on functions`
--       can touch (see 20260709000000_function_grant_default_deny.sql
--       "Descope"). This probe pins that KNOWN gap so a change in Postgres's
--       own behaviour — not a regression in this repo — is what would ever
--       flip it, and the discipline it documents (every new
--       CREATE FUNCTION needs its own explicit REVOKE) stays visible.
--   (g) Effect probes for every service-role-only table NOT already covered
--       by an effect-based assertion file: an UPDATE/DELETE by a client role
--       must raise 42501, diagnosed by row-count fall-through where the
--       fixture has rows (real mutation vs. zero-row no-op — same pattern
--       03_subscriptions.sql AC(d) established); where the fixture has NO
--       rows, row-count fall-through is ambiguous (a real grant-layer
--       regression and "the WHERE clause matched nothing" are
--       indistinguishable at 0 rows), so those tables assert the grant pin
--       + the raw 42501 only, no row-count branch — noted inline.
--   (h) Positive control: service_role CAN write (proves the effect probes
--       in (g) are reachable, not dead code).
--   (i) "Harness can still write where it should" controls: the table-level
--       profiles UPDATE (quiz/next-game path) and the anon waitlist INSERT
--       both still work after the re-pin.
--
-- Fixture graph (from fixtures.sql):
--   PARENT         10000000-0000-4000-8000-000000000001
--   ATHLETE_A      20000000-0000-4000-8000-00000000000a
--   ATHLETE_B      20000000-0000-4000-8000-00000000000b
--   ADULT_ATHLETE  70000000-0000-4000-8000-000000000001
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (a) Diagnostic dump — printed to the CI log as evidence of the real ACL
-- state. Runs as the harness's default connection role (superuser), before
-- any `set local role` switch below.
-- ---------------------------------------------------------------------------

\echo '  [diag] relacl for every relation in the matrix:'
select relname, relacl
  from pg_class
 where relnamespace = 'public'::regnamespace
   and relname in (
     'access_grants', 'account_deletion_events', 'activity_events',
     'activity_rollup', 'athlete_session_metadata', 'athlete_sessions',
     'auth_rate_limit_events', 'device_pairings', 'journal_entries',
     'parent_athlete_links', 'profiles', 'push_subscriptions',
     'safety_events', 'subscriptions', 'training_sessions_catalog',
     'waitlist_signups', 'activity_events_id_seq'
   )
 order by relname;

\echo '  [diag] profiles column-level ACLs (non-null only):'
select attname, attacl
  from pg_attribute
 where attrelid = 'public.profiles'::regclass
   and attacl is not null
 order by attname;

\echo '  [diag] function EXECUTE ACLs:'
select p.proname, p.proacl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in (
     'set_updated_at', 'check_parent_athlete_link_roles',
     'check_device_pairing_roles', 'check_athlete_session_role',
     'check_journal_entry_consistency', 'check_safety_event_consistency',
     'enforce_birthdate_immutable', 'due_push_reminders',
     'due_game_day_reminders', 'rollup_activity_events',
     'get_own_personalization', 'get_own_username'
   )
 order by p.proname;

-- ---------------------------------------------------------------------------
-- (b) Full has_table_privilege matrix. One row per (relation, role,
-- expected S/I/U/D). service_role is asserted separately below for the
-- 15 base tables (ALL four) — athlete_session_metadata (the VIEW) is
-- excluded from the service_role loop and checked on its own for SELECT
-- only, per the header note: service_role's table-level ALL grant
-- (20260613040000) technically covers the view too, but the view's
-- aggregate SELECT (no INSTEAD OF rule) is never actually
-- INSERT/UPDATE/DELETE-able regardless of grant, so asserting those privs
-- either way is not a meaningful signal for this relation.
-- ---------------------------------------------------------------------------

do $$
declare
  rec record;
  got boolean;
begin
  for rec in
    select * from (values
      -- (relname,                    role,            sel,   ins,   upd,   del)
      ('access_grants',              'anon',           true,  false, false, false),
      ('access_grants',              'authenticated',  true,  false, false, false),
      ('account_deletion_events',    'anon',           true,  false, false, false),
      ('account_deletion_events',    'authenticated',  true,  false, false, false),
      ('activity_events',            'anon',           true,  false, false, false),
      ('activity_events',            'authenticated',  true,  false, false, false),
      ('activity_rollup',            'anon',           true,  false, false, false),
      ('activity_rollup',            'authenticated',  true,  false, false, false),
      ('athlete_session_metadata',   'anon',           false, false, false, false),
      ('athlete_session_metadata',   'authenticated',  true,  false, false, false),
      ('athlete_sessions',           'anon',           false, false, false, false),
      ('athlete_sessions',           'authenticated',  true,  true,  true,  false),
      ('auth_rate_limit_events',     'anon',           true,  false, false, false),
      ('auth_rate_limit_events',     'authenticated',  true,  false, false, false),
      ('device_pairings',            'anon',           true,  false, false, false),
      ('device_pairings',            'authenticated',  true,  false, false, false),
      ('journal_entries',            'anon',           true,  false, false, false),
      ('journal_entries',            'authenticated',  true,  true,  true,  false),
      ('parent_athlete_links',       'anon',           false, false, false, false),
      ('parent_athlete_links',       'authenticated',  true,  false, false, false),
      -- profiles: has_table_privilege(SELECT) is FALSE for authenticated —
      -- empirically verified that has_table_privilege does NOT fall back to
      -- column-level grants (unlike the additive direction: a column-level
      -- grant does not imply a table-level one). FV-361's column allowlist
      -- is a column-level-ONLY grant with no table-level SELECT re-issued,
      -- by design (the whole point of the reversed-grant model) — see (c)
      -- below for the actual column-by-column has_column_privilege boundary,
      -- which is where authenticated's real profiles SELECT access lives.
      -- anon has neither table- nor column-level SELECT.
      ('profiles',                   'anon',           false, false, false, false),
      ('profiles',                   'authenticated',  false, true,  true,  false),
      ('push_subscriptions',         'anon',           true,  false, false, false),
      ('push_subscriptions',         'authenticated',  true,  true,  true,  true),
      ('safety_events',              'anon',           true,  false, false, false),
      ('safety_events',              'authenticated',  true,  false, false, false),
      ('subscriptions',              'anon',           false, false, false, false),
      ('subscriptions',              'authenticated',  true,  false, false, false),
      ('training_sessions_catalog',  'anon',           true,  false, false, false),
      ('training_sessions_catalog',  'authenticated',  true,  false, false, false),
      ('waitlist_signups',           'anon',           false, true,  false, false),
      ('waitlist_signups',           'authenticated',  true,  false, false, false)
    ) as t(relname, rolename, sel, ins, upd, del)
  loop
    select has_table_privilege(rec.rolename, 'public.' || rec.relname, 'SELECT') into got;
    assert got = rec.sel,
      format('AC(b) FAIL: %s.%s SELECT expected %s, got %s — check 20260910133456_client_grant_matrix_pin.sql',
             rec.relname, rec.rolename, rec.sel, got);

    select has_table_privilege(rec.rolename, 'public.' || rec.relname, 'INSERT') into got;
    assert got = rec.ins,
      format('AC(b) FAIL: %s.%s INSERT expected %s, got %s — check 20260910133456_client_grant_matrix_pin.sql',
             rec.relname, rec.rolename, rec.ins, got);

    select has_table_privilege(rec.rolename, 'public.' || rec.relname, 'UPDATE') into got;
    assert got = rec.upd,
      format('AC(b) FAIL: %s.%s UPDATE expected %s, got %s — check 20260910133456_client_grant_matrix_pin.sql',
             rec.relname, rec.rolename, rec.upd, got);

    select has_table_privilege(rec.rolename, 'public.' || rec.relname, 'DELETE') into got;
    assert got = rec.del,
      format('AC(b) FAIL: %s.%s DELETE expected %s, got %s — check 20260910133456_client_grant_matrix_pin.sql',
             rec.relname, rec.rolename, rec.del, got);
  end loop;
end $$;

-- service_role: ALL four, on every base table (not the view — see header).
do $$
declare
  tbl text;
  got boolean;
begin
  foreach tbl in array array[
    'access_grants', 'account_deletion_events', 'activity_events',
    'activity_rollup', 'athlete_sessions', 'auth_rate_limit_events',
    'device_pairings', 'journal_entries', 'parent_athlete_links',
    'profiles', 'push_subscriptions', 'safety_events', 'subscriptions',
    'training_sessions_catalog', 'waitlist_signups'
  ]
  loop
    select has_table_privilege('service_role', 'public.' || tbl, 'SELECT') into got;
    assert got, format('AC(b) FAIL: service_role missing SELECT on %s — check 20260613040000_service_role_grants.sql', tbl);
    select has_table_privilege('service_role', 'public.' || tbl, 'INSERT') into got;
    assert got, format('AC(b) FAIL: service_role missing INSERT on %s — check 20260613040000_service_role_grants.sql', tbl);
    select has_table_privilege('service_role', 'public.' || tbl, 'UPDATE') into got;
    assert got, format('AC(b) FAIL: service_role missing UPDATE on %s — check 20260613040000_service_role_grants.sql', tbl);
    select has_table_privilege('service_role', 'public.' || tbl, 'DELETE') into got;
    assert got, format('AC(b) FAIL: service_role missing DELETE on %s — check 20260613040000_service_role_grants.sql', tbl);
  end loop;

  -- athlete_session_metadata (the VIEW): SELECT only.
  select has_table_privilege('service_role', 'public.athlete_session_metadata', 'SELECT') into got;
  assert got, 'AC(b) FAIL: service_role missing SELECT on athlete_session_metadata — check 20260613040000_service_role_grants.sql';
end $$;

-- ---------------------------------------------------------------------------
-- (c) profiles column allowlist (FV-361, re-pinned by FV-568). authenticated
-- SELECT true for the 10 allowed columns, false for the 5 withheld; anon
-- SELECT false for all 15; authenticated UPDATE true for the four
-- runtime-written columns (table-level UPDATE was preserved, so this is
-- also true for every OTHER column — these four are the ones the app
-- actually depends on, so they are the meaningful regression signal).
-- ---------------------------------------------------------------------------

do $$
declare
  col  text;
  got  boolean;
  allowed constant text[] := array[
    'id', 'role', 'first_name', 'birthdate', 'created_at', 'updated_at',
    'sport', 'sport_selected_at', 'digest_opt_out', 'digest_unsubscribe_token'
  ];
  withheld constant text[] := array[
    'position', 'focus_area', 'next_game_on', 'username',
    'created_as_adult_by_parent'
  ];
begin
  foreach col in array allowed loop
    select has_column_privilege('authenticated', 'public.profiles', col, 'select') into got;
    assert got, format('AC(c) FAIL: authenticated missing SELECT on profiles.%s (allowlisted column) — check 20260910133456_client_grant_matrix_pin.sql', col);
  end loop;

  foreach col in array withheld loop
    select has_column_privilege('authenticated', 'public.profiles', col, 'select') into got;
    assert not got, format('AC(c) FAIL: authenticated HAS SELECT on profiles.%s (must stay withheld — athlete-private) — check 20260910133456_client_grant_matrix_pin.sql', col);
  end loop;

  foreach col in array allowed || withheld loop
    select has_column_privilege('anon', 'public.profiles', col, 'select') into got;
    assert not got, format('AC(c) FAIL: anon HAS SELECT on profiles.%s (anon must have zero profiles SELECT, column or table) — check 20260910133456_client_grant_matrix_pin.sql', col);
  end loop;

  foreach col in array array['position', 'focus_area', 'next_game_on', 'sport'] loop
    select has_column_privilege('authenticated', 'public.profiles', col, 'update') into got;
    assert got, format('AC(c) FAIL: authenticated missing UPDATE on profiles.%s — table-level UPDATE must survive the re-pin (quiz/next-game/sport-switch write path) — check 20260910133456_client_grant_matrix_pin.sql', col);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- (d) Sequence: activity_events_id_seq. anon/authenticated get USAGE+SELECT
-- (nextval/currval introspection) but NEVER UPDATE (setval) — a client role
-- must not be able to rewind or skip the identity counter. service_role
-- keeps UPDATE (bulk/import tooling, admin backfills).
-- ---------------------------------------------------------------------------

do $$
declare got boolean;
begin
  select has_sequence_privilege('anon', 'public.activity_events_id_seq', 'usage') into got;
  assert got, 'AC(d) FAIL: anon missing USAGE on activity_events_id_seq — check 20260910133456_client_grant_matrix_pin.sql';
  select has_sequence_privilege('anon', 'public.activity_events_id_seq', 'select') into got;
  assert got, 'AC(d) FAIL: anon missing SELECT on activity_events_id_seq — check 20260910133456_client_grant_matrix_pin.sql';
  select has_sequence_privilege('anon', 'public.activity_events_id_seq', 'update') into got;
  assert not got, 'AC(d) FAIL: anon HAS UPDATE on activity_events_id_seq (can rewind/skip the identity counter) — check 20260910133456_client_grant_matrix_pin.sql';

  select has_sequence_privilege('authenticated', 'public.activity_events_id_seq', 'usage') into got;
  assert got, 'AC(d) FAIL: authenticated missing USAGE on activity_events_id_seq — check 20260910133456_client_grant_matrix_pin.sql';
  select has_sequence_privilege('authenticated', 'public.activity_events_id_seq', 'select') into got;
  assert got, 'AC(d) FAIL: authenticated missing SELECT on activity_events_id_seq — check 20260910133456_client_grant_matrix_pin.sql';
  select has_sequence_privilege('authenticated', 'public.activity_events_id_seq', 'update') into got;
  assert not got, 'AC(d) FAIL: authenticated HAS UPDATE on activity_events_id_seq (can rewind/skip the identity counter) — check 20260910133456_client_grant_matrix_pin.sql';

  select has_sequence_privilege('service_role', 'public.activity_events_id_seq', 'update') into got;
  assert got, 'AC(d) FAIL: service_role missing UPDATE on activity_events_id_seq — check 20260613040000_service_role_grants.sql';
end $$;

-- ---------------------------------------------------------------------------
-- (e) Functions: has_function_privilege matrix. Trigger functions + the
-- three service-role/cron RPCs deny every client role. get_own_username()
-- is the one INTENTIONAL positive control (safe-degrade to anon).
-- get_own_personalization() is authenticated-only.
-- ---------------------------------------------------------------------------

do $$
declare
  fn text;
  got boolean;
begin
  -- Pure client-deny functions (never callable by anon or authenticated).
  -- get_own_personalization() is deliberately NOT in this array — it is
  -- authenticated-callable by design, checked as its own positive control
  -- right below the loop, alongside its anon-denial (which IS covered here
  -- via a second, narrower array).
  foreach fn in array array[
    'public.set_updated_at()',
    'public.check_parent_athlete_link_roles()',
    'public.check_device_pairing_roles()',
    'public.check_athlete_session_role()',
    'public.check_journal_entry_consistency()',
    'public.check_safety_event_consistency()',
    'public.enforce_birthdate_immutable()',
    'public.due_push_reminders()',
    'public.due_game_day_reminders()',
    'public.rollup_activity_events(integer)'
  ]
  loop
    select has_function_privilege('anon', fn, 'execute') into got;
    assert not got, format('AC(e) FAIL: anon HAS EXECUTE on %s — check 20260910133456_client_grant_matrix_pin.sql', fn);
    select has_function_privilege('authenticated', fn, 'execute') into got;
    assert not got, format('AC(e) FAIL: authenticated HAS EXECUTE on %s — check 20260910133456_client_grant_matrix_pin.sql', fn);
    select has_function_privilege('service_role', fn, 'execute') into got;
    assert got, format('AC(e) FAIL: service_role missing EXECUTE on %s — check 20260613040000_service_role_grants.sql', fn);
  end loop;

  -- get_own_personalization(): anon denied, authenticated + service_role
  -- positive controls.
  select has_function_privilege('anon', 'public.get_own_personalization()', 'execute') into got;
  assert not got, 'AC(e) FAIL: anon HAS EXECUTE on get_own_personalization() — athlete-private self-read RPC must not be anon-callable — check 20260910133456_client_grant_matrix_pin.sql';
  select has_function_privilege('authenticated', 'public.get_own_personalization()', 'execute') into got;
  assert got, 'AC(e) FAIL: authenticated missing EXECUTE on get_own_personalization() — check 20260708120000_athlete_private_columns_grant_hardening.sql';
  select has_function_privilege('service_role', 'public.get_own_personalization()', 'execute') into got;
  assert got, 'AC(e) FAIL: service_role missing EXECUTE on get_own_personalization() — check 20260613040000_service_role_grants.sql';

  -- get_own_username(): anon + authenticated + service_role positive
  -- controls (safe-degrade contract, 10_username.sql AC(d)).
  select has_function_privilege('anon', 'public.get_own_username()', 'execute') into got;
  assert got, 'AC(e) FAIL: anon lost EXECUTE on get_own_username() — intentional safe-degrade grant, see 10_username.sql AC(d)';
  select has_function_privilege('authenticated', 'public.get_own_username()', 'execute') into got;
  assert got, 'AC(e) FAIL: authenticated lost EXECUTE on get_own_username() — check 20260624000000_athlete_username.sql';
  select has_function_privilege('service_role', 'public.get_own_username()', 'execute') into got;
  assert got, 'AC(e) FAIL: service_role missing EXECUTE on get_own_username() — check 20260613040000_service_role_grants.sql';
  select has_function_privilege('public', 'public.get_own_username()', 'execute') into got;
  assert got, 'AC(e) FAIL: PUBLIC lost EXECUTE on get_own_username() — 10_username.sql AC(d) relies on the safe-degrade being reachable by any role';
end $$;

-- ---------------------------------------------------------------------------
-- (f) Default-privilege probe: a table/sequence/function created AFTER this
-- migration must inherit the Supabase-documented opt-out, not the platform
-- default. Everything here rolls back — no lasting schema change.
-- ---------------------------------------------------------------------------

begin;
  create table public.fv568_probe (id int);

  do $$
  declare got boolean;
  begin
    select has_table_privilege('anon', 'public.fv568_probe', 'SELECT') into got;
    assert got, 'AC(f) FAIL: anon missing default SELECT on a brand-new table — 20260612000000''s SELECT-by-default intent regressed';
    select has_table_privilege('authenticated', 'public.fv568_probe', 'SELECT') into got;
    assert got, 'AC(f) FAIL: authenticated missing default SELECT on a brand-new table — 20260612000000''s SELECT-by-default intent regressed';

    select has_table_privilege('anon', 'public.fv568_probe', 'INSERT') into got;
    assert not got, 'AC(f) FAIL: anon HAS default INSERT on a brand-new table — the default-privilege opt-out regressed; check 20260910133456_client_grant_matrix_pin.sql';
    select has_table_privilege('authenticated', 'public.fv568_probe', 'INSERT') into got;
    assert not got, 'AC(f) FAIL: authenticated HAS default INSERT on a brand-new table — the default-privilege opt-out regressed; check 20260910133456_client_grant_matrix_pin.sql';
    select has_table_privilege('anon', 'public.fv568_probe', 'UPDATE') into got;
    assert not got, 'AC(f) FAIL: anon HAS default UPDATE on a brand-new table — the default-privilege opt-out regressed; check 20260910133456_client_grant_matrix_pin.sql';
    select has_table_privilege('authenticated', 'public.fv568_probe', 'UPDATE') into got;
    assert not got, 'AC(f) FAIL: authenticated HAS default UPDATE on a brand-new table — the default-privilege opt-out regressed; check 20260910133456_client_grant_matrix_pin.sql';
    select has_table_privilege('anon', 'public.fv568_probe', 'DELETE') into got;
    assert not got, 'AC(f) FAIL: anon HAS default DELETE on a brand-new table — the default-privilege opt-out regressed; check 20260910133456_client_grant_matrix_pin.sql';
    select has_table_privilege('authenticated', 'public.fv568_probe', 'DELETE') into got;
    assert not got, 'AC(f) FAIL: authenticated HAS default DELETE on a brand-new table — the default-privilege opt-out regressed; check 20260910133456_client_grant_matrix_pin.sql';

    select has_table_privilege('service_role', 'public.fv568_probe', 'INSERT') into got;
    assert got, 'AC(f) FAIL: service_role missing default INSERT on a brand-new table — 20260613040000_service_role_grants.sql''s default-privileges delta regressed';
  end $$;

  create sequence public.fv568_probe_seq;

  do $$
  declare got boolean;
  begin
    select has_sequence_privilege('anon', 'public.fv568_probe_seq', 'usage') into got;
    assert got, 'AC(f) FAIL: anon missing default USAGE on a brand-new sequence';
    select has_sequence_privilege('authenticated', 'public.fv568_probe_seq', 'usage') into got;
    assert got, 'AC(f) FAIL: authenticated missing default USAGE on a brand-new sequence';
    select has_sequence_privilege('anon', 'public.fv568_probe_seq', 'update') into got;
    assert not got, 'AC(f) FAIL: anon HAS default UPDATE on a brand-new sequence — the default-privilege opt-out regressed; check 20260910133456_client_grant_matrix_pin.sql';
    select has_sequence_privilege('authenticated', 'public.fv568_probe_seq', 'update') into got;
    assert not got, 'AC(f) FAIL: authenticated HAS default UPDATE on a brand-new sequence — the default-privilege opt-out regressed; check 20260910133456_client_grant_matrix_pin.sql';
  end $$;

  create function public.fv568_probe_fn() returns int language sql as 'select 1';

  -- KNOWN, KC-DECIDED LIMITATION (2026-07-09, see
  -- 20260709000000_function_grant_default_deny.sql "Descope" section,
  -- empirically re-verified here): `alter default privileges ... revoke
  -- execute on functions from public` is a documented Postgres no-op for
  -- PUBLIC specifically — PUBLIC's EXECUTE-on-functions default comes from
  -- Postgres's own built-in acldefault(), never from the stored
  -- default-privileges delta, so there is nothing for the REVOKE to remove.
  -- A brand-new function therefore ALWAYS inherits EXECUTE-to-PUBLIC (and so
  -- anon/authenticated, both implicitly PUBLIC members, can call it) no
  -- matter what this migration's `alter default privileges ... revoke
  -- execute on functions` statement does. The only mechanism that actually
  -- closes this for FUTURE functions is a `ddl_command_end` event trigger,
  -- which requires superuser and was explicitly deferred (see that
  -- migration's full writeup). Every EXISTING function's exposure is closed
  -- by the per-function REVOKEs in section 3 of
  -- 20260910133456_client_grant_matrix_pin.sql (asserted in (e) above) — the
  -- discipline for new functions remains manual: every migration that adds
  -- one must ship its own explicit REVOKE in the same migration (FV-419
  -- build-time lint is the deferred enforcement). This probe therefore only
  -- REPORTS the current default for a brand-new function to the CI log — it
  -- does not assert it either way, so closing the gap later (event trigger
  -- or a Postgres default change) can never turn this file red, and nothing
  -- here can be mistaken for a claim that new functions are protected.
  do $$
  declare anon_x boolean; auth_x boolean;
  begin
    select has_function_privilege('anon', 'public.fv568_probe_fn()', 'execute') into anon_x;
    select has_function_privilege('authenticated', 'public.fv568_probe_fn()', 'execute') into auth_x;
    raise notice '[diag] brand-new function default EXECUTE — anon=% authenticated=% (expected true/true under Postgres PUBLIC default; FV-419 lint is the enforcement for new functions)', anon_x, auth_x;
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (g) Effect probes for the service-role-only tables not already covered by
-- an effect-based assertion file. Parent P (authenticated) and anon each
-- attempt INSERT (expect 42501), UPDATE, and DELETE.
--
-- Fixture-backed tables (device_pairings, safety_events,
-- parent_athlete_links, activity_events, activity_rollup,
-- training_sessions_catalog): UPDATE/DELETE use the row-count fall-through
-- diagnosis (03_subscriptions.sql AC(d) pattern) — a real mutation vs. a
-- zero-row RLS no-op are different root causes with different failure
-- messages.
--
-- Empty tables (account_deletion_events, auth_rate_limit_events) and the
-- view (athlete_session_metadata): a 0-row-affected fall-through is
-- AMBIGUOUS here — the fixture has no matching row either way, so "the
-- grant layer let the statement through but nothing matched" and "RLS
-- correctly denied" are indistinguishable by row-count alone. These three
-- assert ONLY the raw 42501 denial (no row-count branch); the grant-layer
-- pin itself is already covered unambiguously in section (b) above via
-- has_table_privilege.
-- ---------------------------------------------------------------------------

-- ---- device_pairings ----
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare n int;
  begin
    begin
      insert into public.device_pairings (code_sha256, athlete_id, created_by, expires_at)
        values ('fv568probeauth', '20000000-0000-4000-8000-00000000000a',
                '10000000-0000-4000-8000-000000000001', now() + interval '1 day');
      raise exception 'AC(g) FAIL: device_pairings INSERT by authenticated unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;

    begin
      update public.device_pairings set consumed_at = now()
       where athlete_id = '20000000-0000-4000-8000-00000000000a';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: device_pairings UPDATE CHANGED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: device_pairings UPDATE was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;

    begin
      delete from public.device_pairings where athlete_id = '20000000-0000-4000-8000-00000000000a';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: device_pairings DELETE REMOVED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: device_pairings DELETE was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;
  end $$;
rollback;

begin;
  set local role anon;
  do $$
  declare n int;
  begin
    begin
      insert into public.device_pairings (code_sha256, athlete_id, created_by, expires_at)
        values ('fv568probeanon', '20000000-0000-4000-8000-00000000000a',
                '10000000-0000-4000-8000-000000000001', now() + interval '1 day');
      raise exception 'AC(g) FAIL: device_pairings INSERT by anon unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;

    begin
      update public.device_pairings set consumed_at = now()
       where athlete_id = '20000000-0000-4000-8000-00000000000a';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: device_pairings UPDATE by anon CHANGED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: device_pairings UPDATE by anon was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;
  end $$;
rollback;

-- ---- safety_events ----
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare n int;
  begin
    begin
      insert into public.safety_events (athlete_id, athlete_session_id, category)
        values ('20000000-0000-4000-8000-00000000000a', '40000000-0000-4000-8000-00000000000a', 'fv568_probe');
      raise exception 'AC(g) FAIL: safety_events INSERT by authenticated unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;

    begin
      update public.safety_events set category = 'fv568_tamper'
       where id = '60000000-0000-4000-8000-00000000000a';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: safety_events UPDATE CHANGED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: safety_events UPDATE was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;

    begin
      delete from public.safety_events where id = '60000000-0000-4000-8000-00000000000a';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: safety_events DELETE REMOVED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: safety_events DELETE was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;
  end $$;
rollback;

begin;
  set local role anon;
  do $$
  begin
    begin
      insert into public.safety_events (athlete_id, athlete_session_id, category)
        values ('20000000-0000-4000-8000-00000000000a', '40000000-0000-4000-8000-00000000000a', 'fv568_probe_anon');
      raise exception 'AC(g) FAIL: safety_events INSERT by anon unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;
  end $$;
rollback;

-- ---- parent_athlete_links ----
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare n int;
  begin
    begin
      insert into public.parent_athlete_links (parent_id, athlete_id)
        values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-00000000000b');
      raise exception 'AC(g) FAIL: parent_athlete_links INSERT by authenticated unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;

    begin
      update public.parent_athlete_links set created_at = now()
       where parent_id = '10000000-0000-4000-8000-000000000001'
         and athlete_id = '20000000-0000-4000-8000-00000000000a';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: parent_athlete_links UPDATE CHANGED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: parent_athlete_links UPDATE was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;

    begin
      delete from public.parent_athlete_links
       where parent_id = '10000000-0000-4000-8000-000000000001'
         and athlete_id = '20000000-0000-4000-8000-00000000000a';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: parent_athlete_links DELETE REMOVED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: parent_athlete_links DELETE was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;
  end $$;
rollback;

-- ---- activity_events ----
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare n int;
  begin
    begin
      insert into public.activity_events (athlete_id, event_name)
        values ('20000000-0000-4000-8000-00000000000a', 'app_open');
      raise exception 'AC(g) FAIL: activity_events INSERT by authenticated unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;

    begin
      update public.activity_events set surface = 'daily'
       where athlete_id = '20000000-0000-4000-8000-00000000000a' and event_name = 'app_open';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: activity_events UPDATE CHANGED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: activity_events UPDATE was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;

    begin
      delete from public.activity_events
       where athlete_id = '20000000-0000-4000-8000-00000000000a' and event_name = 'app_open';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: activity_events DELETE REMOVED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: activity_events DELETE was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;
  end $$;
rollback;

-- ---- activity_rollup ----
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare n int;
  begin
    begin
      insert into public.activity_rollup (grain, period_start, event_name, active_athletes, event_count)
        values ('day', current_date, 'fv568_probe', 0, 0);
      raise exception 'AC(g) FAIL: activity_rollup INSERT by authenticated unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;

    begin
      update public.activity_rollup set active_athletes = active_athletes + 1
       where grain = 'day' and period_start = current_date - 1 and event_name is null;
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: activity_rollup UPDATE CHANGED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: activity_rollup UPDATE was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;

    begin
      delete from public.activity_rollup
       where grain = 'day' and period_start = current_date - 1 and event_name is null;
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: activity_rollup DELETE REMOVED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: activity_rollup DELETE was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;
  end $$;
rollback;

-- ---- training_sessions_catalog ----
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    n int;
    probe_id uuid;
  begin
    select id into probe_id from public.training_sessions_catalog order by day_number, sport limit 1;

    begin
      insert into public.training_sessions_catalog
        (day_number, sport, title, mental_skill_md, scripture_ref, scripture_text, journal_prompt)
        values (999, 'hockey', 'fv568', 'fv568', 'fv568', 'fv568', 'fv568');
      raise exception 'AC(g) FAIL: training_sessions_catalog INSERT by authenticated unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;

    begin
      update public.training_sessions_catalog set title = 'fv568_tamper' where id = probe_id;
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: training_sessions_catalog UPDATE CHANGED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: training_sessions_catalog UPDATE was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;

    begin
      delete from public.training_sessions_catalog where id = probe_id;
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(g) FAIL: training_sessions_catalog DELETE REMOVED % ROW(S) — RLS/policy gap', n;
      else
        raise exception 'AC(g) FAIL: training_sessions_catalog DELETE was a zero-row RLS no-op — grant layer missing; check 20260910133456_client_grant_matrix_pin.sql';
      end if;
    exception when insufficient_privilege then null; end;
  end $$;
rollback;

-- ---- account_deletion_events (no fixture rows — 42501/grant-pin only) ----
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  begin
    begin
      insert into public.account_deletion_events (event_type, actor_parent_id)
        values ('athlete_deleted', '10000000-0000-4000-8000-000000000001');
      raise exception 'AC(g) FAIL: account_deletion_events INSERT by authenticated unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;

    begin
      update public.account_deletion_events set athletes_deleted = 1 where id = gen_random_uuid();
      raise exception 'AC(g) FAIL: account_deletion_events UPDATE by authenticated unexpectedly SUCCEEDED (0 rows would have matched regardless — the grant layer let the statement execute, which is itself the regression)';
    exception when insufficient_privilege then null; end;

    begin
      delete from public.account_deletion_events where id = gen_random_uuid();
      raise exception 'AC(g) FAIL: account_deletion_events DELETE by authenticated unexpectedly SUCCEEDED (0 rows would have matched regardless — the grant layer let the statement execute, which is itself the regression)';
    exception when insufficient_privilege then null; end;
  end $$;
rollback;

-- ---- auth_rate_limit_events (no fixture rows — 42501/grant-pin only) ----
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  begin
    begin
      insert into public.auth_rate_limit_events (bucket, action)
        values ('fv568_probe', 'sign_in');
      raise exception 'AC(g) FAIL: auth_rate_limit_events INSERT by authenticated unexpectedly SUCCEEDED';
    exception when insufficient_privilege then null; end;

    begin
      update public.auth_rate_limit_events set bucket = 'fv568_tamper' where id = gen_random_uuid();
      raise exception 'AC(g) FAIL: auth_rate_limit_events UPDATE by authenticated unexpectedly SUCCEEDED (0 rows would have matched regardless — the grant layer let the statement execute, which is itself the regression)';
    exception when insufficient_privilege then null; end;

    begin
      delete from public.auth_rate_limit_events where id = gen_random_uuid();
      raise exception 'AC(g) FAIL: auth_rate_limit_events DELETE by authenticated unexpectedly SUCCEEDED (0 rows would have matched regardless — the grant layer let the statement execute, which is itself the regression)';
    exception when insufficient_privilege then null; end;
  end $$;
rollback;

-- ---- athlete_session_metadata (VIEW — 42501/grant-pin only). Empirically
-- verified (this file, against a real Postgres 16 instance): an INSERT into
-- this view raises BEFORE the grant-layer permission check even runs,
-- because the view's rewriter determines at query-rewrite time (ahead of
-- ExecCheckRTPerms) that it is not auto-updatable (its defining query is a
-- GROUP BY aggregate, no INSTEAD OF rule/trigger exists) — so the denial
-- reason is always "cannot insert into view", SQLSTATE 55000
-- (object_not_in_prerequisite_state), REGARDLESS of the grant-layer state
-- this migration pins. That means this specific effect probe cannot, even
-- in principle, distinguish a grant-layer regression from correct behaviour
-- — the unambiguous check for this relation is the has_table_privilege
-- assertion in section (b) above (anon: no privilege at all; authenticated:
-- SELECT only). This block is kept anyway as a behavioural regression
-- trip-wire: if a future migration ever adds an INSTEAD OF INSERT
-- trigger/rule to this view (making it writable), the SQLSTATE changes and
-- this assertion — which accepts ONLY 55000 — starts failing loudly, which
-- is the correct outcome (a metadata-only view becoming writable is itself
-- worth a hard stop).
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  begin
    begin
      insert into public.athlete_session_metadata (athlete_id, sessions_started, sessions_completed)
        values ('20000000-0000-4000-8000-00000000000a', 1, 1);
      raise exception 'AC(g) FAIL: athlete_session_metadata INSERT by authenticated unexpectedly SUCCEEDED';
    exception
      when object_not_in_prerequisite_state then null; -- expected: "cannot insert into view" (55000), not auto-updatable
      when insufficient_privilege then null; -- would also be an acceptable denial if the rewrite/permission-check order ever changes
    end;
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (h) Positive control: service_role CAN write (proves the row-count
-- fall-through branches above are reachable and meaningful, not dead code).
-- Mirrors 03_subscriptions.sql AC(d-svc).
-- ---------------------------------------------------------------------------
begin;
  set local role service_role;
  do $$
  declare n int;
  begin
    update public.device_pairings set consumed_at = now()
     where athlete_id = '20000000-0000-4000-8000-00000000000a';
    get diagnostics n = row_count;
    assert n = 1,
      format('AC(h) FAIL: service_role UPDATE of the device_pairings fixture row affected %s row(s), expected exactly 1', n);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (i) "Harness can still write where it should" controls — the table-level
-- UPDATE on profiles (quiz/next-game/sport-switch path) and anon's
-- waitlist_signups INSERT both survived the re-pin.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare n int;
  begin
    update public.profiles set next_game_on = current_date + 1
     where id = '20000000-0000-4000-8000-00000000000a';
    get diagnostics n = row_count;
    assert n = 1,
      format('AC(i) FAIL: athlete A''s own next_game_on UPDATE affected %s row(s), expected exactly 1 — the table-level UPDATE grant on profiles must survive the column-SELECT re-pin', n);
  end $$;
rollback;

begin;
  set local role anon;
  do $$
  declare n int;
  begin
    insert into public.waitlist_signups (email, name, role, sport, note)
      values ('fv568-probe@rls.test', 'FV-568 Probe', 'athlete', 'hockey', null);
    get diagnostics n = row_count;
    assert n = 1,
      format('AC(i) FAIL: anon waitlist_signups INSERT affected %s row(s), expected exactly 1', n);
  end $$;
rollback;

\echo '  [PASS] 19_client_grant_matrix (FV-568: full client-role grant matrix pinned — tables, profiles columns, sequence, functions, default-privilege opt-out, effect + positive controls)'
