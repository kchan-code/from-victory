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
-- How "counted once" is enforced (atomically, in the database):
--   public.pregame_selection_contributors holds (athlete_id, period_start) and
--   NOTHING else: no sport, no selections, no timestamp. It is NOT a record of
--   selections; it only says "this athlete has already been counted this
--   month". record_pregame_selections() inserts the marker with ON CONFLICT DO
--   NOTHING and only if a row was actually inserted does it upsert the counts,
--   all in one function call (one transaction). Two concurrent calls for the
--   same athlete serialise on the marker's unique index: the second waits for
--   the first to commit, then its insert conflicts and it writes nothing. If the
--   count upsert fails, the marker insert rolls back with it.
--   The athlete id is used ONLY for the marker. It is never written to
--   pregame_selection_counts, never returned, never logged.
--
-- Retention (run on every record_pregame_selections() call, cheap):
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
-- Marker table. FK to profiles with ON DELETE CASCADE so deleting an account
-- removes its marker. Service-role-only in effect: RLS on, NO policies, no
-- client write grants (same posture as pregame_selection_counts).
-- ---------------------------------------------------------------------------
create table public.pregame_selection_contributors (
  athlete_id   uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  primary key (athlete_id, period_start)
);

comment on table public.pregame_selection_contributors is
  'Marker only (FV-749): athlete X was already counted in pregame_selection_counts '
  'for UTC month M. No sport, no selections, no timestamps; NOT a record of what '
  'was chosen. Rows exist only for the current UTC month (older rows are deleted '
  'by record_pregame_selections). Service-role-only: RLS enabled, no policies.';

alter table public.pregame_selection_contributors enable row level security;

revoke all privileges on table public.pregame_selection_contributors from public, anon, authenticated;
grant select on table public.pregame_selection_contributors to authenticated, anon;

comment on table public.pregame_selection_counts is
  'Monthly counts of DISTINCT ATHLETES per chosen pregame option (FV-749): each '
  'athlete counted at most once per UTC month. No account identifier, no row '
  'timestamps, one dimension per row. NOT anonymous on its own at small counts '
  '(current-month cells can be below 10) and not hidden from backups/row '
  'versions. The ONLY sanctioned read path is read_pregame_selection_counts() '
  '(closed months, count >= 10); never SELECT this table for display or export. '
  'Retention: totals below 10 are deleted when their month closes; totals of 10 '
  'or more are kept. Service-role-only: RLS enabled, no policies.';

-- ---------------------------------------------------------------------------
-- Writer. Replaces increment_pregame_selection_counts (dropped below).
--
-- p_athlete_id is used ONLY for the once-per-month marker. It is never written
-- to pregame_selection_counts, never returned, never logged.
--
-- p_selections: jsonb ARRAY of {"dimension": text, "value": text}. Validation
-- is unchanged: unknown dimension, non-string / empty / >120-char value, and
-- entries past the first 32 are dropped. Each distinct (dimension, value) adds
-- exactly 1 (duplicates inside one call collapse), so a cell never gets more
-- than +1 from one athlete.
--
-- Returns the number of cells written; 0 if the athlete was already counted
-- this UTC month (or the input was invalid / empty).
--
-- SECURITY INVOKER: service_role already holds the table grants.
-- ---------------------------------------------------------------------------
create or replace function public.record_pregame_selections(
  p_athlete_id uuid,
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
begin
  -- Housekeeping (every call): markers are only needed for the current month;
  -- small cells of closed months are never readable, so do not retain them.
  delete from public.pregame_selection_contributors where period_start < v_period;
  delete from public.pregame_selection_counts
   where period_start < v_period and selection_count < 10;

  if p_athlete_id is null
     or p_sport is null or p_sport !~ '^[a-z][a-z-]{0,31}$'
     or p_selections is null or jsonb_typeof(p_selections) <> 'array' then
    return 0;
  end if;

  -- Atomic "count this athlete once this month". A concurrent call for the same
  -- athlete blocks on the unique index until we commit, then conflicts -> 0.
  insert into public.pregame_selection_contributors (athlete_id, period_start)
  values (p_athlete_id, v_period)
  on conflict (athlete_id, period_start) do nothing;
  get diagnostics v_marked = row_count;
  if v_marked = 0 then
    return 0;
  end if;

  insert into public.pregame_selection_counts as c
    (period_start, sport, dimension, value, selection_count)
  select v_period, p_sport, s.dimension, s.value, 1
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
  group by s.dimension, s.value
  -- Deterministic lock order so concurrent calls (different athletes) upsert
  -- rows in the same order and cannot deadlock.
  order by s.dimension, s.value
  on conflict (period_start, sport, dimension, value)
  do update set selection_count = c.selection_count + 1;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function public.record_pregame_selections(uuid, text, jsonb) is
  'Counts an athlete''s pregame selections AT MOST ONCE per UTC month (FV-749). '
  'The athlete id is used only for the once-per-month marker; it is never '
  'stored with the counts, returned or logged. Also deletes old markers and '
  'closed-month cells below 10. Service-role-only (EXECUTE revoked from '
  'PUBLIC/anon/authenticated).';

revoke all on function public.record_pregame_selections(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_pregame_selections(uuid, text, jsonb) to service_role;

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
