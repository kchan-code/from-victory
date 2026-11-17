-- =============================================================================
-- Migration: 20261117163000_fv751_stripe_customers.sql
--
-- Purpose: FV-751 follow-up hardening — persist pre-checkout Stripe customer
--   ids WITHOUT writing placeholder rows to public.subscriptions.
--
-- Why:
--   Pre-checkout customer persistence previously inserted an
--   `incomplete` placeholder into public.subscriptions so abandoned checkout
--   customers could be deleted later. That placeholder could be interpreted as
--   degraded entitlement by runtime access checks. This migration introduces a
--   dedicated service-role-only mirror for payer -> stripe customer id.
--
-- Data model:
--   public.stripe_customers
--     payer_id            uuid primary key -> public.profiles(id) on delete cascade
--     stripe_customer_id  text not null unique
--     created_at          timestamptz not null default now()
--
-- Privacy / access:
--   - Contains only opaque billing identifiers (no names, no emails).
--   - RLS enabled, NO policies.
--   - Client roles (anon/authenticated) receive no grants.
--   - service_role retains write/read through the existing service-role grant
--     baseline migration.
-- =============================================================================

create table public.stripe_customers (
  payer_id uuid primary key
    references public.profiles(id)
    on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.stripe_customers is
  'Service-role-only payer -> Stripe customer mirror (FV-751). Used to '
  'delete abandoned-checkout customers without writing placeholder rows in '
  'subscriptions.';

comment on column public.stripe_customers.stripe_customer_id is
  'Opaque Stripe customer id (cus_*). Never client readable.';

alter table public.stripe_customers enable row level security;

-- Deny client access explicitly even if hosted defaults grant broad privileges.
revoke all privileges on table public.stripe_customers from public, anon, authenticated;

-- Keep pending-account deletion safety in sync with new payer-linked data.
create or replace function private.is_unestablished(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select
        exists (select 1 from auth.users u
                 where u.id = p_user_id
                   and lower(coalesce(u.email, '')) not like '%@athletes.fromvictory.app')
    and not exists (select 1 from public.profiles               where id        = p_user_id)
    and not exists (select 1 from public.subscriptions          where parent_id = p_user_id)
    and not exists (select 1 from public.stripe_customers       where payer_id  = p_user_id)
    and not exists (select 1 from public.apple_subscriptions    where payer_id  = p_user_id)
    and not exists (select 1 from public.apple_purchase_tokens  where payer_id  = p_user_id)
    and not exists (select 1 from public.apple_sandbox_testers  where payer_id  = p_user_id)
    and not exists (select 1 from public.google_subscriptions     where payer_id = p_user_id)
    and not exists (select 1 from public.google_purchase_bindings where payer_id = p_user_id)
    and not exists (select 1 from public.google_license_testers   where payer_id = p_user_id)
    and not exists (select 1 from public.access_grants          where parent_id = p_user_id)
    and not exists (select 1 from public.parent_athlete_links
                     where parent_id = p_user_id or athlete_id = p_user_id)
$$;
