-- =============================================================================
-- Migration: 20260709000000_activity_rollup.sql
--
-- Purpose (FV-415, part 1 of 2 — the CAPTURE half):
--   FV-382 prunes raw `activity_events` older than 90 days. That raw table is
--   per-minor (keyed by athlete_id), so we CANNOT retain 3 years of it to power
--   long-horizon analytics. Instead we roll the raw window up into an AGGREGATE
--   table at day / week / month grains BEFORE the prune runs, then let the
--   prune delete the raw rows. This table (`activity_rollup`) holds those
--   aggregates.
--
--   The dashboard-READ wiring is a separate follow-up PR — this migration only
--   creates the capture surface (table + rollup function). Nothing reads it yet.
--
-- Privacy model (mirrors activity_events / safety_events):
--   - AGGREGATE-ONLY. There is NO athlete_id and NO PII here — only
--     count(distinct athlete_id) as `active_athletes` and count(*) as
--     `event_count`, grouped by low-cardinality, non-PII dimensions that are
--     copied verbatim from activity_events (event_name, surface, sport,
--     audio_mode, network_mode). `meta` (variable jsonb) is intentionally NOT
--     rolled up — it is not a stable dimension and could raise cardinality.
--   - Service-role-only, same two-layer posture as activity_events: RLS is
--     ENABLED with NO policies. authenticated/anon retain the SELECT grant
--     (via ALTER DEFAULT PRIVILEGES in 20260612000000 + the explicit grant
--     below) purely so the RLS boundary returns 0 rows rather than
--     "permission denied" — which keeps the FV-166 harness meaningful. No
--     INSERT/UPDATE/DELETE is granted to any client role. The only writer is
--     the rollup function below (invoked by the service-role cron); the only
--     reader will be the owner metrics dashboard (also service-role).
--
-- Distinct-count correctness (the reason this table must exist at all):
--   DAU/WAU/MAU are count(distinct athlete_id) and are NOT additive — you
--   cannot sum daily distincts into a weekly distinct. So `active_athletes` is
--   computed independently PER GRAIN directly from raw, while raw still exists.
--   Once raw is pruned the distinct count can never be recovered, which is
--   exactly why the rollup runs before the prune.
--
-- Postgres version: 15+ (uses UNIQUE ... NULLS NOT DISTINCT).
-- =============================================================================

create table public.activity_rollup (
  -- Time grain of the aggregate row.
  grain           text        not null check (grain in ('day', 'week', 'month')),
  -- Start of the aggregated period (date_trunc(grain, occurred_at)::date):
  -- the day, the ISO-week Monday, or the 1st of the month.
  period_start    date        not null,

  -- Low-cardinality dimensions copied verbatim from activity_events. All
  -- nullable (matching the source), none are PII. See activity_events for the
  -- rationale behind each CHECK / the deliberately-unconstrained `sport` slug.
  event_name      text        not null,
  surface         text,
  sport           text,
  audio_mode      text,
  network_mode    text,

  -- The two aggregates. active_athletes = count(distinct athlete_id) computed
  -- from raw PER GRAIN (never summed across grains). event_count = count(*).
  active_athletes integer     not null,
  event_count     integer     not null,

  updated_at      timestamptz not null default now(),

  -- Idempotency: one row per (grain, period_start, full dimension tuple) so the
  -- rollup function can UPSERT and re-rolling a still-retained period reproduces
  -- the same counts instead of duplicating rows. NULLS NOT DISTINCT (PG15) is
  -- REQUIRED — the dimensions are nullable, and default NULL-distinct semantics
  -- would let two rows with a NULL dim both insert (NULL <> NULL), silently
  -- breaking the upsert and doubling counts every run.
  constraint activity_rollup_grain_period_dims_key
    unique nulls not distinct
      (grain, period_start, event_name, surface, sport, audio_mode, network_mode)
);

comment on table public.activity_rollup is
  'Aggregate (NO athlete_id, no PII) rollup of activity_events at day/week/month '
  'grains, computed BEFORE the 90-day raw prune (FV-382). active_athletes is '
  'count(distinct athlete_id) per grain (NOT additive) captured while raw exists. '
  'Service-role-only: RLS enabled, no policies; authenticated/anon see 0 rows.';

comment on column public.activity_rollup.active_athletes is
  'count(distinct athlete_id) for this (grain, period_start, dims) — computed '
  'per grain directly from raw activity_events. Never summed across grains.';

-- The unique constraint's index leads with (grain, period_start), so it already
-- serves the (grain, period_start) range-scan access pattern the dashboard read
-- will use — a standalone (grain, period_start) index would be a redundant
-- left-prefix and is intentionally omitted (index hygiene).

-- ---------------------------------------------------------------------------
-- RLS: enabled, NO policies -> service-role-only. Identical two-layer model to
-- activity_events / safety_events. The explicit SELECT grant to authenticated
-- keeps the schema self-contained (0-row RLS boundary, not "permission denied",
-- so the FV-166 harness verifies the boundary). anon inherits SELECT via
-- ALTER DEFAULT PRIVILEGES (20260612000000); service_role inherits ALL via
-- 20260613040000. No INSERT/UPDATE/DELETE grant to any client role.
-- ---------------------------------------------------------------------------
alter table public.activity_rollup enable row level security;

grant select on public.activity_rollup to authenticated;

-- ---------------------------------------------------------------------------
-- Rollup function: UPSERT one aggregate row per (grain, period_start, dims) for
-- every COMPLETE, FULLY-RETAINED period still covered by raw, at day/week/month.
--
-- Two guards make re-running each cron tick safe and self-healing:
--   (A) complete-only  : date_trunc(grain, occurred_at) < date_trunc(grain, now())
--       excludes the in-progress current day/week/month, so we never freeze a
--       partial count for a period that is still accumulating rows.
--   (B) fully-retained : date_trunc(grain, occurred_at) >= (now() - retention)
--       only rolls periods whose raw rows are ENTIRELY inside the retention
--       window. This is critical: once a period straddles the prune boundary
--       (some of its raw already deleted), re-rolling it would recompute an
--       UNDERCOUNT and overwrite the good value. (A period is captured while
--       fully retained by earlier daily runs, then frozen once it ages out —
--       the upsert stops touching it.)
--
-- Because both guards + the NULLS-NOT-DISTINCT unique upsert are deterministic,
-- running the function twice back-to-back produces identical rows (not doubled).
--
-- SECURITY DEFINER + locked-down EXECUTE: the function reads raw activity_events
-- and must run regardless of the caller's RLS view; EXECUTE is revoked from
-- PUBLIC/anon/authenticated and granted only to service_role, so no client can
-- trigger it. `set search_path = public` hardens the definer context; `set
-- timezone = 'UTC'` makes date_trunc bucketing deterministic and consistent
-- with the route's UTC cutoff math.
-- ---------------------------------------------------------------------------
create or replace function public.rollup_activity_events(retention_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
set timezone = 'UTC'
as $$
declare
  affected integer;
  cutoff   timestamptz := now() - make_interval(days => retention_days);
begin
  insert into public.activity_rollup as r
    (grain, period_start, event_name, surface, sport, audio_mode, network_mode,
     active_athletes, event_count, updated_at)
  select
    g.grain,
    date_trunc(g.grain, e.occurred_at)::date               as period_start,
    e.event_name,
    e.surface,
    e.sport,
    e.audio_mode,
    e.network_mode,
    count(distinct e.athlete_id)                           as active_athletes,
    count(*)                                               as event_count,
    now()                                                  as updated_at
  from public.activity_events e
  cross join (values ('day'), ('week'), ('month')) as g(grain)
  where date_trunc(g.grain, e.occurred_at) >= cutoff                    -- (B) fully retained
    and date_trunc(g.grain, e.occurred_at) < date_trunc(g.grain, now()) -- (A) complete only
  group by
    g.grain,
    date_trunc(g.grain, e.occurred_at)::date,
    e.event_name,
    e.surface,
    e.sport,
    e.audio_mode,
    e.network_mode
  on conflict (grain, period_start, event_name, surface, sport, audio_mode, network_mode)
  do update set
    active_athletes = excluded.active_athletes,
    event_count     = excluded.event_count,
    updated_at      = now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function public.rollup_activity_events(integer) is
  'Rolls complete, fully-retained activity_events periods up into activity_rollup '
  'at day/week/month grains (idempotent UPSERT). Run BEFORE the FV-382 prune so a '
  'distinct-athlete count is never lost. Service-role-only (EXECUTE revoked from '
  'PUBLIC/anon/authenticated).';

revoke execute on function public.rollup_activity_events(integer) from public, anon, authenticated;
grant execute on function public.rollup_activity_events(integer) to service_role;
