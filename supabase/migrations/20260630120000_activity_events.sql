-- =============================================================================
-- Migration: 20260630120000_activity_events.sql
--
-- Purpose:
--   Add the single, append-only, EVENT-ONLY product-analytics table. Today the
--   daily-training loop (athlete_sessions) is the ONLY persisted engagement
--   signal — the pregame guided audio, pre-practice primer, and postgame
--   debrief write nothing, so true DAU/WAU/MAU, pregame-funnel, push
--   click-through, and honest retention cohorts are impossible. This table is
--   the foundation that unlocks all of them (it backfills from first write).
--
-- Privacy model (reviewed by kids-privacy-officer; mirrors safety_events):
--   - EVENT-ONLY, NO CONTENT. No journal text, no narration, no raw cue words,
--     no free text. `meta` carries ONLY an enforced allow-list of
--     low-cardinality slugs / ints / bools (enforced in the server action;
--     see lib/activity/event-core.ts). The DB shape cannot hold content.
--   - Service-role-only: RLS is ENABLED with NO policies. authenticated/anon
--     get SELECT (so the RLS boundary returns 0 rows rather than "permission
--     denied" — keeps the FV-166 harness meaningful) but NO insert/update/delete.
--     The only writer is the service-role server action; the only reader is the
--     owner metrics dashboard (also service-role).
--   - athlete_id FK cascades on profile delete, so the deletion promise is
--     honored automatically (no extra cleanup path).
--
-- Postgres version: 15+
-- =============================================================================

create table public.activity_events (
  id            bigint generated always as identity primary key,
  athlete_id    uuid        not null references public.profiles(id) on delete cascade,

  -- Closed enum (CHECK, not a Postgres enum type, so the vocabulary can grow
  -- without a type migration — same rationale as safety_events.category).
  event_name    text        not null
                            check (event_name in (
                              'app_open',
                              'daily_start', 'daily_complete',
                              'pregame_start', 'pregame_complete',
                              'practice_start', 'practice_complete',
                              'postgame_open',
                              'push_click'
                            )),

  -- Low-cardinality dimensions. All nullable; none are PII.
  surface       text        check (surface in ('hub','daily','pregame','practice','postgame','push')),
  -- sport is intentionally UNCONSTRAINED at the DB level (no CHECK), unlike
  -- profiles.sport. Same rationale as waitlist_signups.sport / catalog.sport:
  -- a new launch sport can be added without a schema migration. The value is a
  -- low-cardinality slug, app-layer length-capped (lib/activity/event-core.ts);
  -- it is a dimension, never PII.
  sport         text,
  audio_mode    text        check (audio_mode in ('clip','timer')),
  network_mode  text        check (network_mode in ('online','offline')),

  -- Allow-listed low-cardinality slugs / ints / bools ONLY. The server action
  -- rejects any key not on the allow-list and any non-primitive value. NEVER
  -- journal/narration content, never free text.
  meta          jsonb,

  occurred_at   timestamptz not null default now()
);

comment on table public.activity_events is
  'Append-only, EVENT-ONLY product-analytics log. No content ever. '
  'Service-role-only writes (server action) + reads (owner dashboard). '
  'RLS enabled with no policies; authenticated/anon see 0 rows. '
  'athlete_id cascades on profile delete (deletion promise honored).';

comment on column public.activity_events.meta is
  'Allow-listed low-cardinality slugs/ints/bools only (enforced in the server '
  'action). NEVER journal text, narration, raw cue words, or any free text.';

-- Indexes: per-athlete lookups (RLS predicate + retention cohorts) and the
-- (event_name, time) access pattern the dashboard aggregates over.
create index activity_events_athlete_idx   on public.activity_events (athlete_id);
create index activity_events_name_time_idx on public.activity_events (event_name, occurred_at);

-- ---------------------------------------------------------------------------
-- RLS: enabled, NO policies → service-role-only. Same two-layer model as
-- safety_events (grant SELECT so the harness sees the RLS 0-row boundary, but
-- no INSERT/UPDATE/DELETE grant to client roles).
-- ---------------------------------------------------------------------------
alter table public.activity_events enable row level security;

-- Explicit SELECT for authenticated (idempotent — keeps the schema self-contained
-- regardless of default-privilege initialization; see 20260612000000_explicit_
-- table_grants.sql). NOTE: anon ALSO receives SELECT via that migration's
-- ALTER DEFAULT PRIVILEGES, but because RLS is enabled with NO policies, anon
-- (and authenticated) see 0 rows — identical two-layer model to safety_events.
-- No INSERT/UPDATE/DELETE is granted to any client role: the only writer is the
-- service-role server action.
grant select on public.activity_events to authenticated;

-- RETENTION: this table is append-only with no TTL. A pruning policy (e.g. a
-- pg_cron job deleting rows older than ~90 days, sufficient for DAU/WAU/MAU and
-- retention cohorts) is a kc-gated follow-up — appropriate purpose-limited
-- retention for minor (13-17) activity data under state AADC guidance. Confirm
-- the window with counsel before enabling in production. (Follow-up issue.)
