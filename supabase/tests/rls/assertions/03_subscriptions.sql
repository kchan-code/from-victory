-- =============================================================================
-- RLS assertions — subscriptions  (FV-166 AC d, hardened by FV-507)
--
-- (d) client roles cannot write subscriptions.
--     Only the parent-own SELECT policy exists; all writes are service-role
--     (Stripe webhook handler via createServiceClient()).
--
-- FV-507 story — why this file checks EFFECT + PRIVILEGE, not error SHAPE:
--   The original version of this file expected a hard SQLSTATE 42501 from
--   EVERY write attempt and treated anything else as "unexpectedly
--   SUCCEEDED." That assumption broke silently when the CI Postgres image
--   moved (17.6.1.159 -> 17.6.1.165, 2026-08-27, zero repo changes) to a
--   local stack that reproduces Supabase's HOSTED default privileges
--   (`alter default privileges in schema public grant all on tables to
--   ... anon, authenticated ...`, from the platform's own
--   `00000000000000-initial-schema.sql`). On that stack `authenticated`
--   held UPDATE/DELETE on `subscriptions` at the GRANT layer with no
--   matching RLS policy at the POLICY layer — so a client UPDATE/DELETE was
--   never a data leak (RLS's default-deny still filtered every row out of
--   the target set), but it was also not a 42501 error: it was a *silent,
--   successful, zero-row no-op*. A shape-only assertion (`when
--   insufficient_privilege`) has no branch for "the statement executed
--   without error and changed nothing," so it misreported a harmless no-op
--   as a passed-through mutation.
--
--   `20260909000000_subscriptions_client_write_revoke.sql` closes the grant
--   gap so this can never recur (REVOKE ALL, then GRANT back only SELECT to
--   authenticated) — restoring the two-layer model (no grant + no policy)
--   deterministically on any stack. This file now verifies BOTH layers
--   directly: (d0) pins the actual `has_table_privilege` matrix as a
--   pre-check (so a grant-layer regression is caught by name, immediately,
--   before any role-scoped statement even runs), and (d)/(d-anon) use
--   `get diagnostics ... row_count` on fall-through to tell a real mutation
--   ("CHANGED N ROW(S)" — a policy gap) apart from a zero-row RLS no-op ("a
--   grant-layer regression with no matching policy") — two different root
--   causes that call for two different fixes, so the failure message says
--   which one happened. (d-svc) is a positive control proving the harness
--   itself is capable of observing a real 1-row UPDATE when the assertions
--   in (d) don't fire.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (d0) Grant-layer pin — runs as the connection's default role (the
-- migration-owning superuser psql connects as), BEFORE any `set local role`
-- switch below, so this reflects the schema's actual privilege state, not a
-- role-scoped session. Diagnostic output first (printed to the CI log as
-- evidence of the real ACL), then hard assertions.
-- ---------------------------------------------------------------------------
\echo '  [diag] public.subscriptions relacl:'
select relacl from pg_class where oid = 'public.subscriptions'::regclass;

\echo '  [diag] has_table_privilege matrix (anon / authenticated / service_role x S/I/U/D):'
select
  r.rolename,
  has_table_privilege(r.rolename, 'public.subscriptions', 'SELECT') as sel,
  has_table_privilege(r.rolename, 'public.subscriptions', 'INSERT') as ins,
  has_table_privilege(r.rolename, 'public.subscriptions', 'UPDATE') as upd,
  has_table_privilege(r.rolename, 'public.subscriptions', 'DELETE') as del
from (values ('anon'), ('authenticated'), ('service_role')) as r(rolename)
order by r.rolename;

do $$
begin
  -- anon: NONE of SELECT/INSERT/UPDATE/DELETE.
  assert not has_table_privilege('anon', 'public.subscriptions', 'SELECT'),
    'AC(d0) FAIL: anon holds SELECT on subscriptions — check 20260909000000_subscriptions_client_write_revoke.sql';
  assert not has_table_privilege('anon', 'public.subscriptions', 'INSERT'),
    'AC(d0) FAIL: anon holds INSERT on subscriptions — check 20260909000000_subscriptions_client_write_revoke.sql';
  assert not has_table_privilege('anon', 'public.subscriptions', 'UPDATE'),
    'AC(d0) FAIL: anon holds UPDATE on subscriptions — check 20260909000000_subscriptions_client_write_revoke.sql';
  assert not has_table_privilege('anon', 'public.subscriptions', 'DELETE'),
    'AC(d0) FAIL: anon holds DELETE on subscriptions — check 20260909000000_subscriptions_client_write_revoke.sql';

  -- authenticated: SELECT only.
  assert has_table_privilege('authenticated', 'public.subscriptions', 'SELECT'),
    'AC(d0) FAIL: authenticated is missing SELECT on subscriptions — check 20260909000000_subscriptions_client_write_revoke.sql';
  assert not has_table_privilege('authenticated', 'public.subscriptions', 'INSERT'),
    'AC(d0) FAIL: authenticated holds INSERT on subscriptions — check 20260909000000_subscriptions_client_write_revoke.sql';
  assert not has_table_privilege('authenticated', 'public.subscriptions', 'UPDATE'),
    'AC(d0) FAIL: authenticated holds UPDATE on subscriptions — check 20260909000000_subscriptions_client_write_revoke.sql';
  assert not has_table_privilege('authenticated', 'public.subscriptions', 'DELETE'),
    'AC(d0) FAIL: authenticated holds DELETE on subscriptions — check 20260909000000_subscriptions_client_write_revoke.sql';

  -- service_role: all four (Stripe webhook handler writes via this role).
  assert has_table_privilege('service_role', 'public.subscriptions', 'SELECT'),
    'AC(d0) FAIL: service_role is missing SELECT on subscriptions — check 20260613040000_service_role_grants.sql';
  assert has_table_privilege('service_role', 'public.subscriptions', 'INSERT'),
    'AC(d0) FAIL: service_role is missing INSERT on subscriptions — check 20260613040000_service_role_grants.sql';
  assert has_table_privilege('service_role', 'public.subscriptions', 'UPDATE'),
    'AC(d0) FAIL: service_role is missing UPDATE on subscriptions — check 20260613040000_service_role_grants.sql';
  assert has_table_privilege('service_role', 'public.subscriptions', 'DELETE'),
    'AC(d0) FAIL: service_role is missing DELETE on subscriptions — check 20260613040000_service_role_grants.sql';
end $$;

-- ---------------------------------------------------------------------------
-- (d) Parent P (a real client role) cannot write subscriptions. Each
--     operation asserts EFFECT, not just error shape: if the grant layer
--     denies as intended (per AC(d0) above), Postgres raises 42501 before
--     RLS ever runs — caught below, expected. If a future regression ever
--     restores a client write grant WITHOUT restoring a matching allow
--     policy, the statement "succeeds" as a zero-row RLS no-op; `get
--     diagnostics ... row_count` distinguishes that from an actual mutation
--     so the two different root causes get two different, named failures.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    n int;
  begin
    -- INSERT must be hard-denied by the grant layer. parent_id points at
    -- athlete B's id (a valid profile with NO existing subscription) so
    -- that, IF the row were ever allowed through, it would SUCCEED — making
    -- a missing denial visible — rather than tripping a PK conflict and
    -- masking the result. (INSERT's WITH CHECK, unlike UPDATE/DELETE's
    -- USING, always raises on denial rather than silently matching zero
    -- rows, so no row-count fall-through is needed here.)
    begin
      insert into public.subscriptions (parent_id, stripe_customer_id, status)
        values ('20000000-0000-4000-8000-00000000000b', 'cus_attack', 'active');
      raise exception 'AC(d) FAIL: subscriptions INSERT by client unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then
        null;  -- expected: grant layer denies INSERT (authenticated holds SELECT only)
    end;

    -- UPDATE own row.
    begin
      update public.subscriptions
        set status = 'canceled'
        where parent_id = '10000000-0000-4000-8000-000000000001';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(d) FAIL: subscriptions UPDATE CHANGED % ROW(S) — RLS/policy gap, client can mutate billing state', n;
      else
        raise exception 'AC(d) FAIL: subscriptions UPDATE was a zero-row RLS no-op — grant layer missing (authenticated holds UPDATE); two-layer denial regressed';
      end if;
    exception
      when insufficient_privilege then
        null;  -- expected: grant layer denies UPDATE (authenticated holds SELECT only)
    end;

    -- Cross-account UPDATE: P attempts to mutate ADULT_ATHLETE AA's row.
    -- Same grant-layer denial should fire before RLS is ever consulted; the
    -- distinct diagnosis matters even more here, since a hypothetical
    -- grant-layer regression combined with a mis-scoped policy could leak a
    -- cross-account write, not merely a self-write.
    begin
      update public.subscriptions
        set status = 'canceled'
        where parent_id = '70000000-0000-4000-8000-000000000001';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(d) FAIL: subscriptions cross-account UPDATE (P -> AA) CHANGED % ROW(S) — RLS/policy gap, client can mutate another account''s billing state', n;
      else
        raise exception 'AC(d) FAIL: subscriptions cross-account UPDATE (P -> AA) was a zero-row RLS no-op — grant layer missing (authenticated holds UPDATE); two-layer denial regressed';
      end if;
    exception
      when insufficient_privilege then
        null;  -- expected: grant layer denies UPDATE (authenticated holds SELECT only)
    end;

    -- DELETE own row.
    begin
      delete from public.subscriptions
        where parent_id = '10000000-0000-4000-8000-000000000001';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(d) FAIL: subscriptions DELETE REMOVED % ROW(S) — RLS/policy gap, client can delete billing state', n;
      else
        raise exception 'AC(d) FAIL: subscriptions DELETE was a zero-row RLS no-op — grant layer missing (authenticated holds DELETE); two-layer denial regressed';
      end if;
    exception
      when insufficient_privilege then
        null;  -- expected: grant layer denies DELETE (authenticated holds SELECT only)
    end;
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (d-anon) anon cannot write subscriptions either — same grant-layer
--     denial (AC(d0) proved anon holds none of SELECT/INSERT/UPDATE/DELETE),
--     same distinct-diagnosis fall-through for UPDATE.
-- ---------------------------------------------------------------------------
begin;
  set local role anon;
  do $$
  declare
    n int;
  begin
    begin
      insert into public.subscriptions (parent_id, stripe_customer_id, status)
        values ('20000000-0000-4000-8000-00000000000b', 'cus_attack_anon', 'active');
      raise exception 'AC(d-anon) FAIL: subscriptions INSERT by anon unexpectedly SUCCEEDED';
    exception
      when insufficient_privilege then
        null;  -- expected: anon holds no grant on subscriptions at all
    end;

    begin
      update public.subscriptions
        set status = 'canceled'
        where parent_id = '10000000-0000-4000-8000-000000000001';
      get diagnostics n = row_count;
      if n > 0 then
        raise exception 'AC(d-anon) FAIL: subscriptions UPDATE by anon CHANGED % ROW(S) — RLS/policy gap, anon can mutate billing state', n;
      else
        raise exception 'AC(d-anon) FAIL: subscriptions UPDATE by anon was a zero-row RLS no-op — grant layer missing (anon holds UPDATE); two-layer denial regressed';
      end if;
    exception
      when insufficient_privilege then
        null;  -- expected: anon holds no grant on subscriptions at all
    end;
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (d-svc) Positive control: service_role CAN write subscriptions (bypasses
--     RLS and holds the real grant, per AC(d0)). Proves the harness itself
--     is capable of observing a real 1-row UPDATE — the fall-through
--     branches above are reachable and meaningful, not dead code. Fixtures
--     stay intact: rollback at the end, mirroring 17_activity_rollup.sql's
--     `set local role service_role` pattern.
-- ---------------------------------------------------------------------------
begin;
  set local role service_role;
  do $$
  declare
    n     int;
    total int;
  begin
    update public.subscriptions
      set status = 'canceled'
      where parent_id = '10000000-0000-4000-8000-000000000001';
    get diagnostics n = row_count;
    assert n = 1,
      format('AC(d-svc) FAIL: service_role UPDATE of P''s subscriptions row affected %s row(s), expected exactly 1', n);

    select count(*) into total from public.subscriptions;
    assert total = 2,
      format('AC(d-svc) FAIL: service_role sees %s subscriptions rows, expected exactly 2 (P + AA fixtures)', total);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- (d+) Athlete A has NO read access to subscriptions at all (own-parent
--      SELECT policy is keyed to parent_id = auth.uid(); athletes never
--      match). Parent P reads exactly its own row, and only its own.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible int;
  begin
    select count(*) into visible from public.subscriptions;
    assert visible = 0,
      format('AC(d) FAIL: athlete can read %s subscriptions rows (must be 0)', visible);
  end $$;
rollback;

begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    visible    int;
    own_status text;
  begin
    select count(*) into visible from public.subscriptions;
    assert visible = 1,
      format('AC(d+) FAIL: parent P can read %s subscriptions rows (must be exactly 1, its own)', visible);

    select status into own_status
      from public.subscriptions
     where parent_id = '10000000-0000-4000-8000-000000000001';
    assert own_status = 'active',
      format('AC(d+) FAIL: parent P should read own subscriptions.status = "active", got "%s"',
             coalesce(own_status, '<NULL>'));
  end $$;
rollback;

\echo '  [PASS] 03_subscriptions (AC d)'
