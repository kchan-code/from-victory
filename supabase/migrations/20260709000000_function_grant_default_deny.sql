-- =============================================================================
-- Migration: 20260709000000_function_grant_default_deny.sql
--
-- Purpose: FV-363 — flip the function-EXECUTE default from grant-to-all to
--   deny-by-default, so a future SECURITY DEFINER (or any) function is not
--   silently callable by anon/authenticated the moment it's created.
--
-- Root cause (two separate grant-to-everyone mechanisms, both wrong-default):
--   1. Postgres itself grants EXECUTE to PUBLIC automatically on every
--      CREATE FUNCTION, unless explicitly revoked. This is a Postgres
--      built-in, independent of ALTER DEFAULT PRIVILEGES, and it means every
--      function ever created in this schema — including trigger functions
--      never meant to be called directly — currently has EXECUTE granted to
--      PUBLIC (and therefore to anon + authenticated) unless a migration
--      explicitly revoked it. Only due_push_reminders() and
--      due_game_day_reminders() ever did that (FV-164 / FV-240).
--   2. 20260612000000_explicit_table_grants.sql additionally set
--      `alter default privileges in schema public grant execute on functions
--      to authenticated, anon;` — meaning every function created AFTER that
--      migration inherits an explicit authenticated/anon EXECUTE grant on
--      creation, on top of the Postgres PUBLIC default. Belt AND suspenders,
--      both in the wrong direction.
--
--   Net effect found while auditing (see inventory below): the trigger
--   function public.enforce_birthdate_immutable() (created 2026-06-25, after
--   the FV-216 default-privileges statement) currently has EXECUTE granted to
--   anon and authenticated with no migration ever revoking it — reachable via
--   PostgREST as POST /rest/v1/rpc/enforce_birthdate_immutable by anyone
--   holding the anon key. Postgres would reject a direct call (a function
--   declared `returns trigger` can only be invoked by the trigger manager,
--   SQLSTATE 42809), so this was not a live data-access hole, but it is
--   exactly the "silently callable" gap this migration exists to close.
--
-- Function inventory (every public function across all prior migrations) —
-- for each: whether it's ever called directly (RPC) by a client role, and
-- the grant decision applied below.
--
--   TRIGGER FUNCTIONS (never called directly — invoked only by the trigger
--   manager, which does not consult the invoking session's EXECUTE privilege
--   at all; a `returns trigger` function additionally cannot be called via
--   ordinary SQL/RPC — Postgres raises "trigger functions can only be called
--   as triggers"). REVOKE execute from PUBLIC on all of these; this cannot
--   break the triggers that use them, and closes the accidental RPC surface:
--     - public.set_updated_at()                    (20260520200000)
--     - public.check_parent_athlete_link_roles()    (20260520200000)
--     - public.check_device_pairing_roles()         (20260521200232)
--     - public.check_athlete_session_role()         (20260522000749, redefined
--                                                     20260625000000 — CREATE
--                                                     OR REPLACE preserves
--                                                     existing privileges, so
--                                                     the redefinition did not
--                                                     re-grant anything)
--     - public.check_journal_entry_consistency()    (20260522000749)
--     - public.check_safety_event_consistency()     (20260522002717)
--     - public.enforce_birthdate_immutable()        (20260625170000 — the
--                                                     live gap described above)
--
--   SECURITY DEFINER, RPC-STYLE, SERVICE-ROLE-ONLY (already explicitly
--   revoked from public/anon/authenticated in their own migrations —
--   re-affirmed here, idempotent, so this migration is self-contained):
--     - public.due_push_reminders()       (20260612130000 / FV-164)
--     - public.due_game_day_reminders()   (20260612140000 / FV-240)
--   Called only via createServiceClient().rpc(...) from
--   apps/web/app/api/cron/send-reminders/route.ts, which authenticates with
--   the service_role key (service_role has its own independent EXECUTE grant
--   via 20260613040000_service_role_grants.sql — unaffected by this migration).
--
--   SECURITY DEFINER, RPC-STYLE, LEGITIMATELY CALLED BY authenticated
--   (already explicitly granted in its own migration — re-affirmed here):
--     - public.get_own_username()  (20260624000000 / FV-320) — self-guarded:
--       the function body derives the caller's own id from auth.uid() and
--       returns only that row's username; there is no parameter an attacker
--       could vary to read someone else's data. authenticated needs EXECUTE
--       so an athlete can call it via PostgREST RPC after claiming a device
--       pairing code, per that migration's own comment.
--
-- Nothing above changes: no table grant, no RLS policy. Functions only.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Flip the default for FUTURE functions: anon/authenticated get NOTHING
--    on a bare `create function`, unless a later migration explicitly grants
--    it. (This does not retroactively touch functions that already exist —
--    ALTER DEFAULT PRIVILEGES only governs objects created after it runs —
--    hence the explicit per-function revokes/re-grants below for the
--    functions that exist today.)
-- ---------------------------------------------------------------------------
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Close the gap on EXISTING functions: revoke the Postgres-automatic
--    PUBLIC EXECUTE grant from every trigger function. None of these are
--    meant to be called directly by any client role; trigger firing is
--    unaffected because the trigger manager invokes the function directly,
--    bypassing the EXECUTE privilege check entirely.
--    (enforce_birthdate_immutable was created AFTER 20260612000000's
--    grant-to-all default, so it also carries explicit anon/authenticated
--    grants — revoke those too, not just PUBLIC.)
-- ---------------------------------------------------------------------------
revoke execute on function public.set_updated_at()                 from public;
revoke execute on function public.check_parent_athlete_link_roles() from public;
revoke execute on function public.check_device_pairing_roles()      from public;
revoke execute on function public.check_athlete_session_role()      from public;
revoke execute on function public.check_journal_entry_consistency() from public;
revoke execute on function public.check_safety_event_consistency()  from public;
revoke execute on function public.enforce_birthdate_immutable()     from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Re-affirm the SECURITY DEFINER functions that are NOT RPC-called by
--    anon/authenticated stay revoked (idempotent — already revoked in their
--    own migrations; repeated here so this migration is self-contained and
--    the deny-by-default posture is visible in one place).
-- ---------------------------------------------------------------------------
revoke execute on function public.due_push_reminders()     from public, anon, authenticated;
revoke execute on function public.due_game_day_reminders() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Re-affirm the one function that IS legitimately RPC-called by
--    authenticated, so the new default-deny posture does not silently take
--    this away on a future re-create. (Idempotent — already granted in
--    20260624000000_athlete_username.sql; this grant is a role-specific
--    GRANT, not inherited via ALTER DEFAULT PRIVILEGES, so step 1 above does
--    not touch it either way. Restated here for an exhaustive, self-
--    contained record of every RPC-callable function's grant.)
--    NOTE: get_own_username is INTENTIONALLY anon-callable as a safe-degrade
--    (SECURITY DEFINER scoped to auth.uid() → returns NULL for anon), a
--    contract pinned by 10_username.sql AC(d). So we only re-affirm its
--    authenticated grant and deliberately do NOT revoke anon here.
-- ---------------------------------------------------------------------------
grant execute on function public.get_own_username() to authenticated;
