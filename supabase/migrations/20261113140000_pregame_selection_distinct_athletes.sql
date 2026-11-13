-- =============================================================================
-- Migration: 20261113140000_pregame_selection_distinct_athletes.sql
--
-- Purpose (FV-749): make every pregame_selection_counts cell a count of
--   DISTINCT ATHLETES, not picks. Before this, one athlete completing a pregame
--   10+ times in a month could alone fill a cell that
--   read_pregame_selection_counts() then released (kids-privacy-officer MEDIUM).
--
-- What a count means now:
--   selection_count = the number of distinct athletes whose FIRST completed
--   pregame of that UTC month chose this (sport, dimension, value). Each athlete
--   is counted AT MOST ONCE PER UTC MONTH (across all sports and dimensions): a
--   later pregame in the same month, with any selections, adds nothing. A cell
--   with selection_count >= 10 therefore implies >= 10 distinct athletes, which
--   is why the reader no longer needs activity_events / activity_rollup (and so
--   is no longer limited to ~90 days of history).
--
-- How "counted once" is enforced (atomically, in the database) WITHOUT the
--   database ever learning who the athlete is:
--   The APPLICATION server computes an opaque keyed one-way digest
--     marker = hex(HMAC-SHA256(secret, "pregame-selection-marker:v1:" ||
--                              athleteId || ":" || periodStartISO))
--   (the UTC month is part of the input, so an athlete's marker differs every
--   month) and passes ONLY that digest. Neither table holds an athlete
--   identifier, and the database never receives one; the digest can be computed
--   only by the application server, which holds the secret.
--   public.pregame_selection_contributors holds (marker, period_start) and
--   NOTHING else: no athlete id, no FK, no sport, no selections, no timestamp.
--   It is NOT a record of selections; it only says "this keyed digest has
--   already been counted this month". record_pregame_selections() claims the
--   marker with INSERT ... ON CONFLICT DO NOTHING and only if a row was inserted
--   does it upsert the counts, all in one function call (one transaction). Two
--   concurrent calls with the same marker serialise on the marker's primary key:
--   the second waits for the first to commit, then conflicts and writes nothing.
--   The marker is claimed only when at least one valid (dimension, value)
--   survives the SQL filters, so an empty/invalid call never consumes the month.
--   Month boundary: the row's month is computed here in SQL (UTC); the app
--   computes the same UTC month for the digest. A call straddling midnight UTC at
--   a month boundary may count under either month; that is acceptable.
--
-- Retention (public.prune_pregame_selection_totals(), run on every writer call
--   AND from the daily cron route /api/cron/prune-activity-events):
--   - Marker rows live only for the CURRENT UTC month; older ones are deleted.
--   - Totals below 10 are deleted once their month closes (a small cell of a
--     closed month is never readable, so it is not retained).
--   - Totals of 10 or more are kept.
--   The raw table can still hold cells below 10 for the CURRENT month only.
--
-- Still true from 20261113120000: the raw count table is NOT anonymous on its
--   own at small counts (a current-month cell can be one minor's choice), the
--   reader below is the ONLY sanctioned read path, nothing may read the raw
--   tables for display/export, and the +1 writes are not hidden from backups /
--   WAL / row versions.
--
-- Clean slate: rows written before this migration are PICK counts, not
--   distinct-athlete counts. The table is hours old and nothing reads it, so
--   every existing row is deleted below.
-- =============================================================================

delete from public.pregame_selection_counts;

-- ---------------------------------------------------------------------------
-- Marker table: keyed one-way digest + month. NO athlete id, NO FK to profiles
-- (so nothing here cascades on account deletion, and nothing identifies an
-- account). RLS on, NO policies, no client write grants (same posture as
-- pregame_selection_counts).
-- ---------------------------------------------------------------------------
create table public.pregame_selection_contributors (
  marker       text not null check (marker ~ '^[0-9a-f]{64}$'),
  period_start date not null,
  primary key (marker)
);

-- The primary key cannot serve the prune's range predicate on period_start.
create index pregame_selection_contributors_period_idx
  on public.pregame_selection_contributors (period_start);

comment on table public.pregame_selection_contributors is
  'Marker only (FV-749): a keyed one-way digest (HMAC-SHA256, computed by the '
  'application server; the database holds no athlete identifier) saying "already '
  'counted for UTC month M". No athlete id, sport, selections or timestamps; NOT '
  'a record of what was chosen. Rows live only for the current UTC month (older '
  'rows are deleted by prune_pregame_selection_totals). Service-role-only: RLS '
  'enabled, no policies.';

alter table public.pregame_selection_contributors enable row level security;

revoke all privileges on table public.pregame_selection_contributors from public, anon, authenticated;
grant select on table public.pregame_selection_contributors to authenticated, anon;

comment on table public.pregame_selection_counts is
  'Monthly counts of DISTINCT ATHLETES per chosen pregame option (FV-749): each '
  'athlete counted at most once per UTC month (via a keyed digest marker; the '
  'database holds no athlete identifier). No account identifier, no row '
  'timestamps, one dimension per row. NOT anonymous on its own at small counts '
  '(current-month cells can be below 10) and not hidden from backups/row '
  'versions. The ONLY sanctioned read path is read_pregame_selection_counts() '
  '(closed months, count >= 10); never SELECT this table for display or export. '
  'Retention: totals below 10 are deleted when their month closes; totals of 10 '
  'or more are kept. Service-role-only: RLS enabled, no policies.';

-- ---------------------------------------------------------------------------
-- Prune: retention, in its own function so the daily cron can call it too (the
-- writer also calls it, so it runs whenever anyone completes a pregame).
-- Markers before the current UTC month; closed-month cells below 10.
-- Returns the number of rows deleted (an opaque count).
-- ---------------------------------------------------------------------------
create or replace function public.prune_pregame_selection_totals()
returns integer
language plpgsql
set search_path = public
set timezone = 'UTC'
as $$
declare
  v_period date := date_trunc('month', now())::date;
  n1 integer;
  n2 integer;
begin
  delete from public.pregame_selection_contributors where period_start < v_period;
  get diagnostics n1 = row_count;
  delete from public.pregame_selection_counts
   where period_start < v_period and selection_count < 10;
  get diagnostics n2 = row_count;
  return n1 + n2;
end;
$$;

comment on function public.prune_pregame_selection_totals() is
  'Retention for the pregame selection tables (FV-749): deletes marker rows of '
  'closed months and closed-month totals below 10. Service-role-only.';

revoke all on function public.prune_pregame_selection_totals() from public, anon, authenticated;
grant execute on function public.prune_pregame_selection_totals() to service_role;

-- ---------------------------------------------------------------------------
-- Writer. Replaces increment_pregame_selection_counts (dropped below).
--
-- p_marker is an opaque keyed digest computed by the APPLICATION (see header).
-- The database never receives an athlete identifier. It is used only as the
-- once-per-month marker and never written to pregame_selection_counts.
--
-- p_selections: jsonb ARRAY of {"dimension": text, "value": text}. Validation:
-- unknown dimension, non-string / empty / >120-char value, and entries past the
-- first 32 are dropped. Each distinct (dimension, value) adds exactly 1, so a
-- cell never gets more than +1 from one athlete per month.
--
-- The marker is claimed ONLY if at least one valid pair remains; otherwise the
-- call returns 0 without consuming the month. Returns the number of cells
-- written; 0 if already counted this UTC month (or nothing valid).
--
-- SECURITY INVOKER: service_role already holds the table grants.
-- ---------------------------------------------------------------------------
create or replace function public.record_pregame_selections(
  p_marker     text,
  p_sport      text,
  p_selections jsonb
)
returns integer
language plpgsql
set search_path = public
set timezone = 'UTC'
as $$
declare
  affected integer := 0;
  v_period date := date_trunc('month', now())::date;
  v_marked integer;
  v_valid  jsonb;
begin
  perform public.prune_pregame_selection_totals();

  if p_marker is null or p_marker !~ '^[0-9a-f]{64}$'
     or p_sport is null or p_sport !~ '^[a-z][a-z-]{0,31}$'
     or p_selections is null or jsonb_typeof(p_selections) <> 'array' then
    return 0;
  end if;

  select jsonb_agg(jsonb_build_object('dimension', v.dimension, 'value', v.value)
                   order by v.dimension, v.value)
    into v_valid
  from (
    select distinct s.dimension, s.value
    from (
      select e.elem ->> 'dimension' as dimension,
             e.elem ->> 'value'     as value
      from jsonb_array_elements(p_selections) with ordinality as e(elem, ord)
      where e.ord <= 32
        and jsonb_typeof(e.elem -> 'value') = 'string'
    ) s
    where s.dimension in (
            'need', 'role', 'adversity', 'anchor', 'self_talk',
            'prayer_style', 'positive_play'
          )
      and s.value is not null
      and char_length(s.value) between 1 and 120
  ) v;

  -- Nothing countable: do not consume the athlete's month.
  if v_valid is null then
    return 0;
  end if;

  -- Atomic "count this marker once this month". A concurrent call with the same
  -- marker blocks on the primary key until we commit, then conflicts -> 0.
  insert into public.pregame_selection_contributors (marker, period_start)
  values (p_marker, v_period)
  on conflict (marker) do nothing;
  get diagnostics v_marked = row_count;
  if v_marked = 0 then
    return 0;
  end if;

  insert into public.pregame_selection_counts as c
    (period_start, sport, dimension, value, selection_count)
  select v_period, p_sport, x.dimension, x.value, 1
  from jsonb_array_elements(v_valid) as e(elem),
       lateral (select e.elem ->> 'dimension' as dimension, e.elem ->> 'value' as value) x
  -- Deterministic lock order so concurrent calls (different markers) upsert
  -- rows in the same order and cannot deadlock.
  order by x.dimension, x.value
  on conflict (period_start, sport, dimension, value)
  do update set selection_count = c.selection_count + 1;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function public.record_pregame_selections(text, text, jsonb) is
  'Counts a pregame''s selections AT MOST ONCE per opaque marker per UTC month '
  '(FV-749). The marker is a keyed one-way digest computed by the application; '
  'the database never receives an athlete identifier. Does not consume the month '
  'when nothing valid is counted. Also prunes (see prune_pregame_selection_totals). '
  'Service-role-only (EXECUTE revoked from PUBLIC/anon/authenticated).';

revoke all on function public.record_pregame_selections(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_pregame_selections(text, text, jsonb) to service_role;

drop function public.increment_pregame_selection_counts(text, jsonb);

-- ---------------------------------------------------------------------------
-- Reader: the ONLY sanctioned read path. Closed months only; a cell's count is
-- a distinct-athlete count, so count >= floor implies >= floor athletes. The
-- caller can raise the floor but never lower it below 10 (NULL -> 10).
-- ---------------------------------------------------------------------------
drop function public.read_pregame_selection_counts(integer, integer);

create function public.read_pregame_selection_counts(
  p_min_athletes integer default 10
)
returns table (
  period_start    date,
  sport           text,
  dimension       text,
  value           text,
  selection_count bigint
)
language sql
stable
set search_path = public
set timezone = 'UTC'
as $$
  select c.period_start, c.sport, c.dimension, c.value, c.selection_count
  from public.pregame_selection_counts c
  where c.period_start < date_trunc('month', now())::date
    and c.selection_count >= greatest(coalesce(p_min_athletes, 10), 10)
  order by c.period_start, c.sport, c.dimension, c.value;
$$;

comment on function public.read_pregame_selection_counts(integer) is
  'ONLY sanctioned read path for pregame_selection_counts (FV-749). Closed UTC '
  'months only; returns cells with selection_count (distinct athletes) >= '
  'greatest(p_min_athletes, 10). Service-role-only (EXECUTE revoked from '
  'PUBLIC/anon/authenticated).';

revoke all on function public.read_pregame_selection_counts(integer) from public, anon, authenticated;
grant execute on function public.read_pregame_selection_counts(integer) to service_role;
