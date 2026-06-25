-- =============================================================================
-- Migration: 20260625170000_athlete_birthdate_immutable.sql
--
-- Purpose (FV-349):
--   Make profiles.birthdate IMMUTABLE for athlete-class rows after initial
--   account creation. Birthdate drives two permanent, security-critical
--   classifications:
--     1. The 13+ age floor (athlete_min_age_13 CHECK).
--     2. The 13-17 minor protections (no behavioral analytics, no third-party
--        tracking, no ads).
--   If birthdate were mutable, a post-creation UPDATE could silently reclassify
--   a minor as an adult (or vice-versa), bypassing those protections.
--
-- Mechanism:
--   A BEFORE UPDATE trigger on public.profiles raises an exception whenever
--   NEW.birthdate IS DISTINCT FROM OLD.birthdate for any row whose role is in
--   ('athlete', 'adult_athlete'). Both athlete-class roles carry a birthdate
--   with a meaningful age floor; both must be immutable for the same reason.
--
-- Parent rows:
--   Parent rows have birthdate = NULL per the birthdate_role_consistency CHECK
--   and that constraint already prevents a parent from supplying a birthdate.
--   The trigger ignores parent rows (role = 'parent') — there is nothing to
--   protect there, and locking NULL → NULL is harmless noise that would
--   confuse future readers.
--
-- Controlled bypass (mediated correction):
--   The trigger checks current_setting('is_superuser', true) and the currently
--   active DB role. When the caller is the service_role user (or any role with
--   BYPASSRLS / superuser privileges — i.e. the postgres role used by Supabase
--   Studio and the CLI), the trigger returns NEW without raising. This allows:
--     a. A future mediated-correction path in a service-role server action.
--     b. The migration itself (run as postgres) to seed or backfill rows.
--     c. The RLS harness fixtures (also run as postgres / superuser) to set up
--        test state without being blocked.
--   The service-role client in apps/web/lib/supabase/service.ts connects as
--   the Supabase service_role JWT, which maps to the `service_role` Postgres
--   role — a role with BYPASSRLS. Any correction via that path is mediated by
--   a server action, which applies its own authorization before calling the DB,
--   so the bypass does not reduce the real-world security surface.
--
-- Effect on existing update paths (no regression):
--   Every profiles UPDATE in the application writes ONLY non-birthdate columns:
--     - athlete-sport.ts:   sport, sport_selected_at, position
--     - athlete-quiz.ts:    position, focus_area, quiz_completed_at
--     - next-game.ts:       next_game_on
--     - pairings.ts:        username
--     - push-reminder.ts:   reminder_hour
--     - digest-preferences.ts: digest_opt_out, digest_unsubscribe_token
--   None of these include birthdate, so the trigger never fires for normal
--   self-updates and profiles_update_own is entirely unaffected.
--
-- Backfill safety:
--   This migration adds a trigger, not a constraint with NOT VALID/VALIDATE.
--   Triggers are DDL-only and never scan existing rows, so there is no
--   backfill risk regardless of row count.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Trigger function: reject any attempt to change birthdate for
--    athlete-class rows, with a controlled bypass for superuser/service_role.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_birthdate_immutable()
returns trigger
language plpgsql
-- SECURITY INVOKER (the default) is REQUIRED here: the bypass below keys on
-- current_role / current_setting('is_superuser'), which must reflect the REAL
-- caller. Under SECURITY DEFINER, current_role would resolve to the function
-- owner (postgres), so the service_role/postgres bypass would ALWAYS fire and
-- the guard would be a silent no-op. Invoker semantics make an authenticated
-- athlete's birthdate update RAISE, while service_role / postgres (migrations
-- and mediated corrections) bypass correctly. The function reads only NEW/OLD
-- and session GUCs — no table access — so invoker needs no extra privilege.
set search_path = ''
as $$
begin
  -- Only guard athlete-class rows. Parent rows have NULL birthdate by
  -- constraint, so there is nothing age-classification-sensitive to protect.
  if new.role not in ('athlete', 'adult_athlete') then
    return new;
  end if;

  -- If birthdate has not changed, nothing to enforce.
  if new.birthdate is not distinct from old.birthdate then
    return new;
  end if;

  -- Controlled bypass for the service_role user (Supabase service key) and
  -- the postgres superuser (CLI, Studio, migration runner).
  --
  -- current_setting('is_superuser', true) returns 'on' when the SESSION user
  -- is a superuser; the second argument (true) suppresses the "unrecognized
  -- parameter" error on non-superuser sessions rather than raising.
  --
  -- current_role is the active role AFTER any SET ROLE — this is the
  -- role Supabase's service_role JWT maps to. We check both 'service_role'
  -- and 'postgres' to cover the Supabase-hosted and local-dev cases.
  if current_setting('is_superuser', true) = 'on'
     or current_role in ('service_role', 'postgres') then
    return new;
  end if;

  -- All other callers (the `authenticated` role, which covers both athlete
  -- self-updates via profiles_update_own and any parent session) are blocked.
  raise exception
    'profiles: birthdate is immutable for athlete-class rows (role=%). '
    'Age classification (13+ floor, 13-17 minor protections) must not drift '
    'post-creation. A mediated correction requires a service-role action.',
    new.role
    using errcode = 'P0001';
end;
$$;

comment on function public.enforce_birthdate_immutable() is
  'BEFORE UPDATE trigger that prevents post-creation changes to birthdate for '
  'athlete and adult_athlete profile rows. Birthdate is the immutable anchor '
  'for the 13+ age floor and 13-17 minor protections (FV-349). '
  'Bypass: service_role and postgres roles (mediated corrections only).';

-- ---------------------------------------------------------------------------
-- 2. Attach the trigger to profiles.
--    BEFORE UPDATE so we can raise before any row is modified.
--    FOR EACH ROW so we see OLD and NEW per row.
--    The set_updated_at() trigger is also BEFORE UPDATE; Postgres fires
--    multiple BEFORE triggers in the order they were created — both run, with
--    set_updated_at() stamping updated_at and this trigger guarding birthdate.
--    That ordering is fine: if this trigger raises, set_updated_at never
--    committed either, and if this trigger returns NEW, updated_at is already
--    stamped before the row lands.
-- ---------------------------------------------------------------------------

create trigger profiles_birthdate_immutable
  before update on public.profiles
  for each row execute function public.enforce_birthdate_immutable();
