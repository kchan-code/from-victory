-- =============================================================================
-- Migration: 20260521200232_device_pairings.sql
--
-- Purpose:
--   Athlete device-pairing flow (PR-04d). A parent generates a one-time
--   pairing code; the athlete opens fromvictoryapp.com/pair?code=<code> on
--   their device, sets a password, and the device cookie binds the device
--   to that athlete for subsequent sign-ins.
--
-- Privacy model:
--   - device_pairings is service-role-only. No client RLS policies.
--     All writes/reads flow through server actions that already enforce
--     parent ↔ athlete authorisation.
--   - Codes are short-lived (24h default, set by application code).
--   - The pairing code is the only auth on the claim URL; it grants the
--     right to SET a password on the athlete account, so:
--       a) it must be cryptographically random (set by app)
--       b) it must be single-use (consumed_at enforces)
--       c) it must expire (expires_at enforces)
--   - The trigger below enforces that:
--       a) athlete_id references a profile with role='athlete'
--       b) created_by references a profile with role='parent'
--       c) created_by is actually linked to athlete_id via
--          parent_athlete_links (a parent cannot pair an athlete they
--          don't have rights to)
--
-- Postgres version: 15+
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. device_pairings table
-- ---------------------------------------------------------------------------

create table public.device_pairings (
  code        text        primary key,
  athlete_id  uuid        not null references public.profiles(id) on delete cascade,
  created_by  uuid        not null references public.profiles(id) on delete cascade,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now(),

  -- Defense-in-depth: refuse to insert an already-expired code.
  constraint expires_after_creation check (expires_at > created_at)
);

comment on table public.device_pairings is
  'One-time codes that let an athlete claim a device and set their password. '
  'Service-role only — no client RLS policies. Writes happen in '
  'apps/web/lib/actions/pairings.ts.';

comment on column public.device_pairings.code is
  'URL-safe single-use code. Cryptographically random, set by application. '
  'Primary key so the lookup at /pair?code=… is a single index seek.';

comment on column public.device_pairings.athlete_id is
  'The athlete account this code can claim. Trigger enforces role=athlete.';

comment on column public.device_pairings.created_by is
  'The parent who issued the code. Trigger enforces role=parent AND that '
  'this parent is linked to athlete_id via parent_athlete_links.';

comment on column public.device_pairings.consumed_at is
  'Timestamp of the claim. Null until the athlete uses the code. The '
  'claim server action atomically checks this is null before proceeding.';

-- Index: athlete_id for listing or revoking pairings per athlete (future).
create index device_pairings_athlete_idx on public.device_pairings (athlete_id);

-- Partial index: unconsumed codes for the reaper job that'll prune
-- expired-and-never-used rows.
create index device_pairings_unconsumed_expires_idx
  on public.device_pairings (expires_at)
  where consumed_at is null;


-- ---------------------------------------------------------------------------
-- 2. Role-enforcement trigger
--    Enforces three invariants the app layer also enforces, as a backstop
--    against a buggy server action or a direct Studio insert:
--      - athlete_id refers to a 'athlete' profile
--      - created_by refers to a 'parent' profile
--      - created_by is linked to athlete_id via parent_athlete_links
-- ---------------------------------------------------------------------------

create or replace function public.check_device_pairing_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_athlete_role text;
  v_parent_role  text;
  v_link_exists  boolean;
begin
  select role into v_athlete_role
    from public.profiles
   where id = new.athlete_id;

  select role into v_parent_role
    from public.profiles
   where id = new.created_by;

  if v_athlete_role is distinct from 'athlete' then
    raise exception
      'device_pairings: athlete_id (%) must reference a profile with role = ''athlete''',
      new.athlete_id;
  end if;

  if v_parent_role is distinct from 'parent' then
    raise exception
      'device_pairings: created_by (%) must reference a profile with role = ''parent''',
      new.created_by;
  end if;

  select exists (
    select 1
      from public.parent_athlete_links pal
     where pal.parent_id  = new.created_by
       and pal.athlete_id = new.athlete_id
  ) into v_link_exists;

  if not v_link_exists then
    raise exception
      'device_pairings: created_by (%) is not linked to athlete_id (%) via parent_athlete_links',
      new.created_by, new.athlete_id;
  end if;

  return new;
end;
$$;

comment on function public.check_device_pairing_roles() is
  'Before-insert trigger that verifies athlete_id is an athlete profile, '
  'created_by is a parent profile, and the parent is actually linked to '
  'the athlete. Backstop for the server action''s checks.';

create trigger device_pairings_role_check
  before insert on public.device_pairings
  for each row execute function public.check_device_pairing_roles();


-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
--    Enabled with NO policies — service-role only.
-- ---------------------------------------------------------------------------

alter table public.device_pairings enable row level security;

-- Intentional: no CREATE POLICY statements. Every read and write to
-- device_pairings goes through a server action using the service-role
-- client, which bypasses RLS. Adding a client-readable policy here would
-- let an athlete enumerate active codes for their account — a feature
-- with no current use case and a non-zero abuse surface.
