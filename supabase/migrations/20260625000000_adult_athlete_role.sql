-- =============================================================================
-- Migration: 20260625000000_adult_athlete_role.sql
--
-- Purpose:
--   Introduce a third profile role, 'adult_athlete', for the 18+ self-serve
--   path (FV-325, project "Adult Self-Serve (18+)"). An adult_athlete is BOTH
--   the Stripe payer AND the trainee on a single account:
--     - real email in auth.users (like a parent; NOT a synthetic athlete email)
--     - birthdate NOT NULL, age >= 18 (proves legal adulthood)
--     - sport NOT NULL (they train, like an athlete)
--     - their OWN subscriptions row (their profile id is the payer key)
--     - NO parent, NO parent_athlete_links row
--
--   This migration is the DATA + ACCESS foundation only. The self-serve signup
--   UI, the adult checkout action, and the ENABLE_ADULT_SIGNUP flag land in
--   follow-up issues. After this migration nothing creates an adult_athlete row
--   yet, so every new/redefined constraint validates immediately.
--
-- Why a new role (not reuse 'parent' or 'athlete'):
--   The schema makes parent and athlete mutually exclusive via
--   birthdate_role_consistency (parent => no birthdate; athlete => birthdate)
--   and sport_role_consistency (athlete => sport; parent => no sport). An
--   account that is simultaneously payer and trainee fits neither. A distinct
--   role keeps both existing invariants intact rather than loosening them, and
--   keeps the parent/athlete privacy boundary unambiguous.
--
-- Role-enforcement surfaces audited and UPDATED here (every place that gates on
-- role and would otherwise reject or mis-handle an adult_athlete row):
--   1. profiles role CHECK            -> add 'adult_athlete'
--   2. birthdate_role_consistency     -> adult_athlete requires a birthdate
--   3. sport_role_consistency         -> adult_athlete requires a sport
--   4. digest_prefs_role_consistency  -> adult_athlete: digest fields NULL
--                                        (no parent-dashboard digest applies)
--   5. NEW adult_athlete_min_age_18   -> 18+ DB backstop (mirrors the 13+ one)
--   6. check_athlete_session_role()   -> accept athlete OR adult_athlete, so an
--                                        adult_athlete can start training sessions
--
-- Role-enforcement surfaces audited and INTENTIONALLY NOT changed:
--   - check_parent_athlete_link_roles() / check_device_pairing_roles(): an
--     adult_athlete never writes parent_athlete_links or device_pairings
--     (email+password login, no parent), so these triggers never fire for them.
--   - profiles_parent_select_linked_athlete RLS: scoped to role='athlete' WITH a
--     parent link; an adult_athlete has no link, so they are correctly invisible
--     to every parent.
--   - profiles_insert_own / profiles_update_own RLS: keyed on id = auth.uid(),
--     role-agnostic — an adult_athlete self-inserts their own row at signup.
--   - athlete_sessions RLS (select/insert own): keyed on athlete_id = auth.uid(),
--     role-agnostic — only the trigger above gated on role.
--   - athlete_min_age_13: 'role <> athlete' is true for adult_athlete, so it
--     passes vacuously; the 13+ floor for parent-created athletes is left as-is.
--   - get_own_username() (role='athlete'): an adult_athlete logs in by email and
--     does not use the username handle; left unchanged. (Adult usernames, if ever
--     wanted, are a separate change.)
--
-- subscriptions.parent_id: semantics widen from "the parent" to "the payer
--   account" (a parent OR an adult_athlete profile id). NO column rename in this
--   migration — the FK to profiles(id) is role-agnostic and a rename has large
--   blast radius (webhook, sync helpers, access layer, access_grants, fixtures).
--   Tracked as a follow-up. Comment updated below to document the new semantics.
--
-- Privacy / Tier: privacy-path + Tier-2 (auth / RLS / migration). Reviewed by
--   kids-privacy-officer + qa-reviewer. No prod `db push` without KC.
--
-- Backfill safety: no existing row has role='adult_athlete', so every redefined
--   or added constraint validates immediately. All DDL runs in one transaction.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Widen the role enum.
--    The baseline defines `role text not null check (role in ('parent',
--    'athlete'))` as an INLINE column constraint, which Postgres auto-names
--    `profiles_role_check`. If the drop fails on a name mismatch the whole
--    migration aborts loudly (safe, not silent) — verify the name on db push.
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
    check (role in ('parent', 'athlete', 'adult_athlete'));

-- ---------------------------------------------------------------------------
-- 2. birthdate_role_consistency — adult_athlete requires a birthdate (18+).
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint birthdate_role_consistency;

alter table public.profiles
  add constraint birthdate_role_consistency
    check (
      (role = 'athlete'       and birthdate is not null)
      or
      (role = 'adult_athlete' and birthdate is not null)
      or
      (role = 'parent'        and birthdate is null)
    );

-- ---------------------------------------------------------------------------
-- 3. sport_role_consistency — adult_athlete trains, so requires a sport.
--    (sport_valid_values already permits any non-null sport in the launched
--    set regardless of role, so no change needed there.)
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint sport_role_consistency;

alter table public.profiles
  add constraint sport_role_consistency
    check (
      (role = 'athlete'       and sport is not null)
      or
      (role = 'adult_athlete' and sport is not null)
      or
      (role = 'parent'        and sport is null)
    );

-- ---------------------------------------------------------------------------
-- 4. digest_prefs_role_consistency — the digest is a parent-dashboard email
--    feature. An adult_athlete has no parent dashboard, so their digest fields
--    stay NULL (the same shape the constraint already requires of athletes).
--    Without this, an adult_athlete row satisfies neither existing branch and
--    every adult signup fails at insert.
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint digest_prefs_role_consistency;

alter table public.profiles
  add constraint digest_prefs_role_consistency
    check (
      (role = 'athlete'       and digest_opt_out is null and digest_unsubscribe_token is null)
      or
      (role = 'adult_athlete' and digest_opt_out is null and digest_unsubscribe_token is null)
      or
      (role = 'parent')
    );

-- ---------------------------------------------------------------------------
-- 5. 18+ age floor for adult_athlete rows (DB backstop, mirrors
--    athlete_min_age_13). Application-layer enforcement will live in the adult
--    signup action; this is defense-in-depth against bugs / Studio edits /
--    direct Postgres writes. NOT VALID then VALIDATE: no adult_athlete rows
--    exist yet, so validation is immediate.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add constraint adult_athlete_min_age_18
    check (
      role <> 'adult_athlete'
      or birthdate <= current_date - interval '18 years'
    )
    not valid;

alter table public.profiles
  validate constraint adult_athlete_min_age_18;

comment on constraint adult_athlete_min_age_18 on public.profiles is
  'Defense-in-depth for the 18+ age floor on self-serve adult accounts. '
  'Application-layer enforcement lives in the adult signup action; this is '
  'the DB backstop against bugs, Studio edits, and any direct Postgres write. '
  'Mirrors athlete_min_age_13 (the 13+ floor for parent-created athletes).';

-- ---------------------------------------------------------------------------
-- 6. check_athlete_session_role() — accept adult_athlete so a self-serve adult
--    can start training sessions. Faithful replace of the content-schema
--    function; only the role predicate changes. security definer + empty
--    search_path are preserved exactly. The existing
--    athlete_sessions_role_check trigger keeps pointing at this function.
-- ---------------------------------------------------------------------------
create or replace function public.check_athlete_session_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  select role into v_role
    from public.profiles
   where id = new.athlete_id;

  if v_role is distinct from 'athlete'
     and v_role is distinct from 'adult_athlete' then
    raise exception
      'athlete_sessions: athlete_id (%) must reference a profile with role in (athlete, adult_athlete)',
      new.athlete_id;
  end if;

  return new;
end;
$$;

comment on function public.check_athlete_session_role() is
  'Before-insert/update trigger that verifies athlete_id references a profile '
  'with role in (athlete, adult_athlete). Backstop against a buggy server '
  'action. FV-325 widened this from athlete-only to also allow adult_athlete '
  '(the 18+ self-serve role, who trains on their own account).';

-- ---------------------------------------------------------------------------
-- 7. subscriptions.parent_id semantics: now "the payer account" — a parent OR
--    an adult_athlete profile id. No rename (follow-up); comment documents it.
-- ---------------------------------------------------------------------------
comment on column public.subscriptions.parent_id is
  'The payer account: a profile with role=''parent'' (parent-led flow) or '
  'role=''adult_athlete'' (18+ self-serve flow). FK to profiles(id) on delete '
  'cascade; one row per payer. The Stripe webhook writes this from checkout '
  'session metadata.parent_id. Rename to account_id is a tracked follow-up.';

commit;
