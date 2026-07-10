-- FV-415 reshape (follow-up to 20260710000000): minimal year-over-year
-- usage shape. Drops narrow per-minor dims (surface/sport/audio_mode/
-- network_mode); rollup_activity_events() uses GROUPING SETS so event_name
-- IS NULL rows carry the EXACT all-events distinct (DAU/WAU/MAU).
-- Safe drop+recreate: rollup is fresh (raw not yet pruned), re-rolled from
-- raw on the next cron run. KC 2026-07-10 'year-over-year usage only'.
drop table if exists public.activity_rollup cascade;
drop function if exists public.rollup_activity_events(integer) cascade;

create table public.activity_rollup (
  -- Time grain of the aggregate row.
  grain           text        not null check (grain in ('day', 'week', 'month')),
  -- Start of the aggregated period (date_trunc(grain, occurred_at)::date):
  -- the day, the ISO-week Monday, or the 1st of the month.
  period_start    date        not null,

  -- The single retained dimension. NULLABLE by design: a NULL event_name marks
  -- the "all-events" super-aggregate row for the period — the exact DAU/WAU/MAU
  -- headline. Because activity_events.event_name is NOT NULL, a NULL here is
  -- UNAMBIGUOUS — it can only ever mean "all events", never a missing value, so
  -- no sentinel string is needed.
  event_name      text,

  -- The two aggregates.
  --   active_athletes = count(distinct athlete_id), computed PER GRAIN from raw
  --     (never summed across grains, never summed across events).
  --   event_count     = count(*).
  active_athletes integer     not null,
  event_count     integer     not null,

  updated_at      timestamptz not null default now(),

  -- Idempotency: one row per (grain, period_start, event_name) so the rollup
  -- function can UPSERT and re-rolling a still-retained period reproduces the
  -- same counts instead of duplicating rows. NULLS NOT DISTINCT (PG15) is
  -- REQUIRED — event_name is nullable (the all-events rows), and default
  -- NULL-distinct semantics would let two all-events rows for the same period
  -- both insert (NULL <> NULL), silently breaking the upsert and doubling the
  -- headline count every run.
  constraint activity_rollup_grain_period_event_key
    unique nulls not distinct (grain, period_start, event_name)
);

comment on table public.activity_rollup is
  'Aggregate (NO athlete_id, no PII) rollup of activity_events at day/week/month '
  'grains, computed BEFORE the 90-day raw prune (FV-382), for year-over-year '
  'usage. Rows with event_name IS NULL are the exact all-events DAU/WAU/MAU; '
  'rows with event_name set are per-event volume/active. No narrow (surface/'
  'sport/audio/network) breakdown is retained. active_athletes is '
  'count(distinct athlete_id) per grain (NOT additive) captured while raw exists. '
  'Service-role-only: RLS enabled, no policies; authenticated/anon see 0 rows.';

comment on column public.activity_rollup.event_name is
  'NULL = the all-events super-aggregate (exact DAU/WAU/MAU headline for the '
  'period). Non-NULL = a single activity_events.event_name. NULL is unambiguous '
  'because activity_events.event_name is NOT NULL.';

comment on column public.activity_rollup.active_athletes is
  'count(distinct athlete_id) for this (grain, period_start, event_name) — '
  'computed per grain directly from raw activity_events. The event_name-NULL '
  'value is a TRUE distinct over all events (a GROUPING SETS super-aggregate), '
  'NOT a sum of the per-event rows. Never summed across grains or events.';

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
-- Rollup function: UPSERT aggregate rows for every COMPLETE, FULLY-RETAINED
-- period still covered by raw, at day/week/month grains. GROUPING SETS emits
-- TWO row shapes per (grain, period):
--   1. (grain, period_start, event_name) — per-event volume/active.
--   2. (grain, period_start)             — the all-events super-aggregate;
--        event_name collapses to NULL and active_athletes is the EXACT
--        distinct-athlete count over ALL events (the DAU/WAU/MAU headline).
--        This is a real super-aggregate, NOT sum(per-event active) — you cannot
--        sum per-event distincts into an all-events distinct.
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
-- running the function twice back-to-back produces identical rows (not doubled)
-- for BOTH the per-event and the all-events (event_name IS NULL) rows.
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
    (grain, period_start, event_name, active_athletes, event_count, updated_at)
  select
    g.grain,
    date_trunc(g.grain, e.occurred_at)::date               as period_start,
    e.event_name,                                          -- NULL in the all-events grouping set
    count(distinct e.athlete_id)                           as active_athletes,
    count(*)                                               as event_count,
    now()                                                  as updated_at
  from public.activity_events e
  cross join (values ('day'), ('week'), ('month')) as g(grain)
  where date_trunc(g.grain, e.occurred_at) >= cutoff                    -- (B) fully retained
    and date_trunc(g.grain, e.occurred_at) < date_trunc(g.grain, now()) -- (A) complete only
  group by grouping sets (
    -- per-event volume/active
    (g.grain, date_trunc(g.grain, e.occurred_at)::date, e.event_name),
    -- all-events exact distinct (event_name collapses to NULL) = DAU/WAU/MAU
    (g.grain, date_trunc(g.grain, e.occurred_at)::date)
  )
  on conflict (grain, period_start, event_name)
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
  'at day/week/month grains via GROUPING SETS (idempotent UPSERT). Emits per-event '
  'rows AND an all-events (event_name IS NULL) super-aggregate that is the EXACT '
  'DAU/WAU/MAU distinct — not a sum of per-event rows. Run BEFORE the FV-382 prune '
  'so a distinct-athlete count is never lost. Service-role-only (EXECUTE revoked '
  'from PUBLIC/anon/authenticated).';

revoke execute on function public.rollup_activity_events(integer) from public, anon, authenticated;
grant execute on function public.rollup_activity_events(integer) to service_role;
