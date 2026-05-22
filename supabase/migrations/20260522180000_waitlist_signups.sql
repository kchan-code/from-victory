-- =============================================================================
-- Migration: 20260522180000_waitlist_signups.sql
--
-- Purpose:
--   Capture pre-launch waitlist signups from the public landing page form.
--   The anon role inserts via the submitWaitlist server action (with
--   honeypot + Zod validation in TS); service-role reads only.
--
-- Privacy model (for kids-privacy-officer):
--   - The form is public-facing on the landing page. A 13-17 athlete may
--     submit. Data collection is therefore minimal:
--       name (free text, capped), email, role (athlete/parent/coach/other),
--       sport (free text from the controlled UI dropdown), optional note.
--     No birthdate, no IP, no user-agent, no third-party tracking.
--   - Email is UNIQUE — gives idempotency on resubmit and prevents
--     duplicate-fill spam from the same address.
--   - Length caps on name (120) and note (1000) prevent runaway writes.
--   - No CASCADE — waitlist_signups have no FK to profiles. The right-
--     to-be-forgotten path (documented on /privacy) deletes by email via
--     a service-role action.
--   - No analytics, no marketing pixels, no tracking on this table.
--
-- RLS:
--   - INSERT: anon role only (form submission). authenticated users could
--     also insert in principle but the form is public-facing and the
--     server action uses the anon client.
--   - SELECT/UPDATE/DELETE: service role only (RLS bypassed). No UI
--     surface reads from this table in MVP.
--
-- Postgres version: 15+
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. waitlist_signups
-- ---------------------------------------------------------------------------

create table public.waitlist_signups (
  id           uuid        primary key default gen_random_uuid(),
  email        text        not null,
  name         text        not null,
  -- Free-text + check so the role vocabulary can evolve without a
  -- migration. Mirrors the safety_events.category pattern.
  role         text        not null
                           check (role in ('athlete', 'parent', 'coach', 'other')),
  -- Free-text rather than enum so new sports can be added by editing the
  -- form's SPORTS array without a schema migration.
  sport        text        not null,
  note         text,
  created_at   timestamptz not null default now(),

  -- One signup per email. Subsequent submissions hit the unique constraint
  -- and the server action returns a friendly "already on the list" result
  -- (idempotent UX, no information disclosure).
  unique (email),

  -- Length caps. Defense against runaway writes.
  constraint waitlist_email_max_length check (length(email) <= 320),
  constraint waitlist_name_max_length  check (length(name)  <= 120),
  constraint waitlist_note_max_length  check (note is null or length(note) <= 1000),
  constraint waitlist_sport_max_length check (length(sport) <= 80)
);

comment on table public.waitlist_signups is
  'Public-facing pre-launch waitlist signups from the landing page form. '
  'Anon-insert / service-role-read. No FK to profiles (a waitlist '
  'signup is not yet an account). Right-to-be-forgotten deletes by '
  'email via a service-role action documented on /privacy.';

comment on column public.waitlist_signups.email is
  'Email address — unique. The server action treats duplicate submissions '
  'as idempotent: returns success with an "already on the list" UX result.';

comment on column public.waitlist_signups.role is
  'Free-text + check constraint. Vocabulary today: athlete / parent / '
  'coach / other. Free-text not enum so new role values can be added '
  'by updating the form and a single migration.';

comment on column public.waitlist_signups.sport is
  'Free-text from the controlled SPORTS array on the landing form. '
  'Adding a sport does NOT require a schema migration — update the '
  'WaitlistForm SPORTS constant.';

-- Index for admin "latest signups" / "signups this week" queries.
-- Service-role-only queries; low volume; trivial index cost.
create index waitlist_signups_created_idx
  on public.waitlist_signups (created_at desc);


-- ---------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table public.waitlist_signups enable row level security;

-- INSERT for anon role. The form submission server action calls the
-- supabase anon client; it must be allowed to insert.
create policy waitlist_signups_anon_insert
  on public.waitlist_signups
  for insert
  to anon
  with check (true);

-- Intentionally NO select/update/delete policies. Every read goes
-- through service-role from a server-only admin path (currently: none
-- beyond the email notification; future: an admin dashboard view).
-- A client policy here would expose the email list to anyone with the
-- anon key.
