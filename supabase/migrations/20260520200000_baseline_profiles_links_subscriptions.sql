-- =============================================================================
-- Migration: 20260520200000_baseline_profiles_links_subscriptions.sql
--
-- Purpose:
--   Establishes the three foundational tables for From Victory MVP:
--     1. profiles        — identity record for both parents and athletes
--     2. parent_athlete_links — many-to-many parent ↔ athlete relationship
--     3. subscriptions   — mirror of Stripe billing state, keyed to parent
--
-- Privacy model summary (reviewed by kids-privacy-officer):
--   - Athlete PII is minimal: first_name, birthdate, parent link only.
--     No email, phone, address, photos, or geolocation on athlete rows.
--   - Journal content is NOT in this migration (PR-04).
--   - RLS is enabled on every table in the same transaction that creates it.
--   - Policies follow least-privilege: each role sees exactly what it needs.
--   - Parents cannot read athlete rows via this migration beyond their own
--     linked athletes' minimal PII (first_name, birthdate, role) — already
--     the minimal set stored.
--   - Cascading delete is configured at every FK so a "delete my athlete's
--     data" request propagates automatically.
--
-- Postgres version: 15+
-- Supabase extensions assumed present: pgcrypto (gen_random_uuid available
--   natively in Postgres 13+), uuid-ossp not required.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Shared trigger function: keep updated_at current on every mutation
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Generic before-update trigger that stamps updated_at to now(). '
  'Attached to every table that carries an updated_at column.';


-- ---------------------------------------------------------------------------
-- 1. profiles
--    Single table for both parents and athletes. Athlete rows contain
--    only the PII fields permitted by the From Victory privacy model:
--    first_name, birthdate, and the auth.users foreign key (id).
--    Email/phone/address/geolocation are NOT stored here — those fields
--    live on auth.users (Supabase Auth) and are only accessible to
--    service-role code.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  role        text        not null
                          check (role in ('parent', 'athlete')),
  first_name  text        not null,
  -- birthdate: required for athletes (enforced by constraint below),
  -- null for parents. Used to confirm 13+ floor at account creation and
  -- to apply 13-17 minor protections at the application layer.
  birthdate   date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Athlete rows must have a birthdate; parent rows must NOT supply one
  -- (parents are authenticated adults — birthdate is not required and
  -- storing it needlessly violates data-minimisation. Forbidding it at
  -- the schema level makes the constraint match the documented intent.)
  constraint birthdate_role_consistency
    check (
      (role = 'athlete' and birthdate is not null)
      or
      (role = 'parent'  and birthdate is null)
    )
);

comment on table public.profiles is
  'Identity record for both parents and athletes. '
  'Athlete rows carry only the PII permitted by the From Victory privacy model: '
  'first_name, birthdate, and the auth.users foreign key. '
  'Email and other auth fields remain in auth.users, accessible only via service role.';

comment on column public.profiles.role is
  'Discriminates parent vs athlete. Drives RLS policy branches across the schema.';

comment on column public.profiles.birthdate is
  'Required for athletes; null for parents. '
  'Confirms 13+ age floor and drives 13-17 minor protections. '
  'GDPR / state AADC note: treat as sensitive PII — do not surface in logs or webhooks.';

-- Index for role-filtered queries (e.g., "all athletes linked to this parent")
create index profiles_role_idx on public.profiles (role);

-- updated_at trigger
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 1a. profiles — Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

-- Own-row read: any authenticated user can read their own profile.
create policy "profiles_select_own"
  on public.profiles
  for select
  using (id = auth.uid());

-- Parent reads linked athletes' profiles.
-- Scope: only athlete rows where a parent_athlete_links row ties the
-- calling user (as parent) to that athlete. Parents see the athlete's
-- full row — but the row contains only first_name, birthdate, and role,
-- all of which are needed by the parent dashboard.
-- Athletes do NOT get an equivalent policy; they cannot look up their
-- parent's profile from the client.
create policy "profiles_parent_select_linked_athlete"
  on public.profiles
  for select
  using (
    role = 'athlete'
    and exists (
      select 1
      from public.parent_athlete_links pal
      where pal.athlete_id = profiles.id
        and pal.parent_id  = auth.uid()
    )
  );

-- Own-row insert: users can only insert a profile row for themselves.
-- Creating an athlete account on behalf of a child is handled by a
-- server action using service role (PR-04). This policy prevents a
-- client from fabricating a profile for a different auth.users id.
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (id = auth.uid());

-- Own-row update: users may update their own profile only.
-- Service role (server actions) can update any row without a policy.
create policy "profiles_update_own"
  on public.profiles
  for update
  using  (id = auth.uid())
  with check (id = auth.uid());

-- No client DELETE policy. Deletion flows through:
--   a) auth.users cascade (Supabase Auth delete → profiles delete)
--   b) a server action using service role for parent-initiated child deletion.
-- Omitting a client DELETE policy is intentional — not an oversight.


-- ---------------------------------------------------------------------------
-- 2. parent_athlete_links
--    Many-to-many between parent profiles and athlete profiles.
--    Supports multi-parent households and (future) multi-athlete families.
--    All writes go through server actions using service role; the RLS
--    policies here are read-only for clients.
-- ---------------------------------------------------------------------------

create table public.parent_athlete_links (
  parent_id   uuid        not null references public.profiles(id) on delete cascade,
  athlete_id  uuid        not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),

  primary key (parent_id, athlete_id),

  -- Prevent self-linking (an athlete cannot be their own parent)
  constraint no_self_link
    check (parent_id <> athlete_id)
);

comment on table public.parent_athlete_links is
  'Many-to-many association between parent and athlete profiles. '
  'Supports multiple parents per athlete and multiple athletes per parent. '
  'All writes are via service-role server actions only; no client write policies.';

comment on column public.parent_athlete_links.parent_id is
  'Must reference a profile with role = ''parent''. '
  'Enforced via trigger (see parent_athlete_links_role_check trigger).';

comment on column public.parent_athlete_links.athlete_id is
  'Must reference a profile with role = ''athlete''. '
  'Enforced via trigger (see parent_athlete_links_role_check trigger).';

-- Index for parent-side lookup (dashboard: "give me all athletes for this parent")
create index parent_athlete_links_parent_idx  on public.parent_athlete_links (parent_id);
-- Index for athlete-side lookup (app: "give me this athlete's parent(s)")
create index parent_athlete_links_athlete_idx on public.parent_athlete_links (athlete_id);

-- Role-enforcement trigger: ensures parent_id points to a 'parent' profile
-- and athlete_id points to an 'athlete' profile. A check constraint cannot
-- reference another table, so a trigger is the idiomatic Postgres approach.
create or replace function public.check_parent_athlete_link_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent_role text;
  v_athlete_role text;
begin
  select role into v_parent_role
    from public.profiles
   where id = new.parent_id;

  select role into v_athlete_role
    from public.profiles
   where id = new.athlete_id;

  if v_parent_role is distinct from 'parent' then
    raise exception
      'parent_athlete_links: parent_id (%) must reference a profile with role = ''parent''',
      new.parent_id;
  end if;

  if v_athlete_role is distinct from 'athlete' then
    raise exception
      'parent_athlete_links: athlete_id (%) must reference a profile with role = ''athlete''',
      new.athlete_id;
  end if;

  return new;
end;
$$;

comment on function public.check_parent_athlete_link_roles() is
  'Before-insert/update trigger that verifies parent_id references a parent '
  'profile and athlete_id references an athlete profile. '
  'Prevents mis-wiring (e.g., linking two parents together).';

create trigger parent_athlete_links_role_check
  before insert or update on public.parent_athlete_links
  for each row execute function public.check_parent_athlete_link_roles();

-- ---------------------------------------------------------------------------
-- 2a. parent_athlete_links — Row Level Security
-- ---------------------------------------------------------------------------

alter table public.parent_athlete_links enable row level security;

-- Either side of the link can read the row: a parent sees all their linked
-- athletes; an athlete can see who their parent(s) are (needed so the
-- athlete app can surface "your parent manages this subscription").
create policy "parent_athlete_links_select_participant"
  on public.parent_athlete_links
  for select
  using (
    parent_id  = auth.uid()
    or
    athlete_id = auth.uid()
  );

-- No INSERT / UPDATE / DELETE policies for clients.
-- All link management (creating athlete accounts, unlinking) is performed
-- by server actions via service role. Service role bypasses RLS entirely.


-- ---------------------------------------------------------------------------
-- 3. subscriptions
--    One row per parent, mirroring the Stripe billing state.
--    Written exclusively by the Stripe webhook handler (service role, PR-05).
--    Parents can read their own subscription status; athletes cannot.
--    price_id records which Stripe price the parent is on (monthly vs annual)
--    so the frontend can display the correct plan without an extra Stripe API
--    call.
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  parent_id                uuid        primary key
                                        references public.profiles(id)
                                        on delete cascade,

  stripe_customer_id       text        not null unique,
  stripe_subscription_id   text        unique,           -- null until first checkout completes

  -- Status mirrors Stripe's subscription status enum.
  -- Access logic: 'active' and 'trialing' → full access.
  -- All other statuses → read-only past entries, no new content unlock.
  status                   text        not null
                                        check (status in (
                                          'active',
                                          'trialing',
                                          'past_due',
                                          'canceled',
                                          'incomplete',
                                          'incomplete_expired',
                                          'unpaid',
                                          'paused'
                                        )),

  -- price_id: the Stripe price ID the subscription is on.
  -- Populated by the webhook handler. Null until checkout.
  -- Values will be e.g. price_monthly_899 / price_annual_7900 once
  -- Stripe products are created (see Open Items in CLAUDE.md).
  price_id                 text,

  current_period_end       timestamptz,
  cancel_at_period_end     boolean     not null default false,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.subscriptions is
  'Mirror of Stripe billing state for each parent account. '
  'Written exclusively by the Stripe webhook handler via service role. '
  'Drives athlete access: status IN (''active'', ''trialing'') = full access; '
  'all other statuses = read-only past entries, no new daily content unlock.';

comment on column public.subscriptions.stripe_customer_id is
  'Stripe Customer ID (cus_*). Created lazily at first checkout. '
  'Never expose this to client-side code; it is read server-side only.';

comment on column public.subscriptions.stripe_subscription_id is
  'Stripe Subscription ID (sub_*). Null until first checkout completes. '
  'Unique constraint enforces one active subscription object per row.';

comment on column public.subscriptions.status is
  'Mirrors Stripe''s subscription status enum. '
  'Application access gate: active + trialing = full access; '
  'past_due / incomplete / unpaid = degraded; canceled / incomplete_expired = blocked.';

comment on column public.subscriptions.price_id is
  'Stripe Price ID the parent is subscribed to. '
  'Distinguishes monthly ($8.99) from annual ($79) plan. '
  'Populated by webhook handler; null until checkout.';

comment on column public.subscriptions.cancel_at_period_end is
  'True when the parent has requested cancellation but the period has not '
  'yet ended. Athlete access continues until current_period_end.';

-- updated_at trigger
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3a. subscriptions — Row Level Security
-- ---------------------------------------------------------------------------

alter table public.subscriptions enable row level security;

-- Parents read their own subscription row.
-- This is the only client-readable policy. Athletes have no access —
-- access-gating decisions are made server-side from the parent's
-- subscription row, not by handing that data to the athlete client.
create policy "subscriptions_select_own_parent"
  on public.subscriptions
  for select
  using (parent_id = auth.uid());

-- No INSERT / UPDATE / DELETE policies for clients.
-- All writes come from the Stripe webhook handler via service role (PR-05).
-- Restricting these operations to service role is intentional: no client
-- should ever be able to manually set their own subscription status to
-- 'active'.
