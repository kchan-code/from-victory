-- =============================================================================
-- Migration: 20261113120000_pregame_selection_counts.sql
--
-- Purpose (FV-724 follow-up): keep knowing WHICH pregame options are chosen
--   most and least, as aggregate totals with NO account identifier, readable
--   only above a contributor floor. FV-724 stopped storing an athlete's pregame
--   selections in activity_events.meta (that was per-athlete). This table is
--   the replacement: monthly totals per (sport, dimension, value).
--
-- IMPORTANT — what this table is and is not:
--   - The RAW table is NOT anonymous on its own at small counts. With a small
--     user base a (sport, month) cell can be exactly one minor's choices, and
--     that could be re-linked to the athlete through activity_events
--     (athlete_id + sport + timestamp). Do NOT treat the raw rows as anonymous.
--   - read_pregame_selection_counts() below is the ONLY sanctioned read path.
--     It enforces the floors in the database. Nothing may SELECT the raw table
--     for display, export, analysis or ad-hoc reporting.
--   - The +1 writes are NOT hidden from backups / WAL / row versions: a small
--     cell's history of increments exists there until those age out.
--
-- Design:
--   - NO athlete id, NO user id, NO session id, NO row-level timestamp. A
--     created_at / updated_at here would let a row be time-correlated with one
--     athlete's pregame_complete event, so they are deliberately absent. The
--     only time column is `period_start`, the first day of the UTC month.
--   - Each dimension is counted INDEPENDENTLY. A row never holds a combination
--     of two selections, so no per-athlete "profile" can be reconstructed.
--   - Values come from fixed vocabularies validated server-side
--     (apps/web/lib/activity/pregame-selection-core.ts); free text (cue word,
--     anything typed) is never counted. The table CHECKs and the write function
--     re-validate dimension + value length (defense in depth).
--   - Service-role-only, same posture as activity_rollup: RLS enabled with NO
--     policies, no INSERT/UPDATE/DELETE grant to any client role. The only
--     writer is increment_pregame_selection_counts(); the only reader is
--     read_pregame_selection_counts(). EXECUTE: service_role only.
--   - No FK to profiles/auth.users by design: nothing here is user data, so
--     account deletion has nothing to cascade (and nothing to retain).
--
-- Read-path floors (read_pregame_selection_counts): a cell is returned ONLY if
--   (a) its selection_count >= greatest(p_min_count, 10), AND
--   (b) that sport + month has >= greatest(p_min_athletes, 10) DISTINCT
--       athletes who completed a pregame, AND
--   (c) the month is complete and has been captured in activity_rollup
--       (month grain, event_name = 'pregame_complete').
--   The caller cannot lower either floor below 10.
--
--   Source of the distinct-athlete figure: activity_rollup CANNOT give a
--   per-sport distinct (the FV-415 reshape in 20260711000000 dropped `sport`;
--   it keeps only (grain, period_start, event_name), and its distincts are not
--   additive across splits). So the per-sport distinct is count(distinct
--   athlete_id) over the RAW activity_events pregame_complete rows for that
--   sport and UTC month. That is exact while the raw rows are retained; once
--   FV-382 prunes raw (90 days) it can only UNDER-count, never over-count. A
--   lower bound is the safe direction here (it can only suppress), so old
--   months may disappear from the read path; they never leak. The rollup month
--   row is used as the completeness gate (the month has closed and been
--   captured) and as an additional necessary condition (all-sports distinct
--   must also meet the floor).
--
-- Nothing in the app reads this table yet (no dashboard in this change).
-- =============================================================================

create table public.pregame_selection_counts (
  -- First day of the UTC month the selections were made in.
  period_start    date   not null,
  -- Sport slug (e.g. 'hockey'). Format-checked, not enum-checked, so adding a
  -- sport needs no migration (same reasoning as activity_events.sport).
  sport           text   not null
    check (sport ~ '^[a-z][a-z-]{0,31}$'),
  -- Closed list of countable pregame dimensions.
  dimension       text   not null
    check (dimension in (
      'need', 'role', 'adversity', 'anchor', 'self_talk',
      'prayer_style', 'positive_play'
    )),
  -- The chosen option: a stable slug/id where one exists, else the validated
  -- config string. Bounded.
  value           text   not null
    check (char_length(value) between 1 and 120),
  selection_count bigint not null check (selection_count >= 0),

  constraint pregame_selection_counts_pkey
    primary key (period_start, sport, dimension, value)
);

comment on table public.pregame_selection_counts is
  'Monthly aggregate totals of which pregame options are chosen (FV-724): no '
  'account identifier, no row timestamps, one dimension per row. NOT anonymous '
  'on its own at small counts and not hidden from backups/row versions. The '
  'ONLY sanctioned read path is read_pregame_selection_counts(), which enforces '
  'a contributor floor; never SELECT this table for display or export. '
  'Service-role-only: RLS enabled, no policies; authenticated/anon see 0 rows.';

-- ---------------------------------------------------------------------------
-- RLS: enabled, NO policies -> service-role-only. Explicit grant layer pinned
-- per 20260910133456_client_grant_matrix_pin.sql: the platform may auto-grant
-- ALL to anon/authenticated on new tables, so REVOKE first, then re-add only
-- SELECT (door open, RLS lock engaged -> 0 rows, same as activity_rollup).
-- service_role keeps ALL via default privileges (20260613040000).
-- ---------------------------------------------------------------------------
alter table public.pregame_selection_counts enable row level security;

revoke all privileges on table public.pregame_selection_counts from public, anon, authenticated;
grant select on table public.pregame_selection_counts to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Writer: UPSERT +1 per (dimension, value) for the CURRENT UTC month.
--
-- p_selections is a jsonb ARRAY of {"dimension": text, "value": text}. Entries
-- with an unknown dimension, a non-string / empty / over-long value, or beyond
-- the first 32 entries are silently dropped. Duplicate pairs inside one call
-- are summed (a single INSERT cannot hit the same key twice).
--
-- SECURITY INVOKER (default): unlike rollup_activity_events this function reads
-- no other table, and service_role already holds the table grants, so no
-- privilege elevation is needed. search_path is locked; the month is computed
-- in UTC. EXECUTE: service_role only.
-- ---------------------------------------------------------------------------
create or replace function public.increment_pregame_selection_counts(
  p_sport      text,
  p_selections jsonb
)
returns integer
language plpgsql
set search_path = public
set timezone = 'UTC'
as $$
declare
  affected integer;
  v_period date := date_trunc('month', now())::date;
begin
  if p_sport is null or p_sport !~ '^[a-z][a-z-]{0,31}$' then
    return 0;
  end if;
  if p_selections is null or jsonb_typeof(p_selections) <> 'array' then
    return 0;
  end if;

  insert into public.pregame_selection_counts as c
    (period_start, sport, dimension, value, selection_count)
  select v_period, p_sport, s.dimension, s.value, count(*)
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
  -- Deterministic lock order: concurrent calls upsert rows in the same order,
  -- so they cannot deadlock on each other.
  order by s.dimension, s.value
  on conflict (period_start, sport, dimension, value)
  do update set selection_count = c.selection_count + excluded.selection_count;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function public.increment_pregame_selection_counts(text, jsonb) is
  '+1 per (dimension, value) for the current UTC month (FV-724). '
  'Takes NO athlete identifier. Re-validates dimension + value length. '
  'Service-role-only (EXECUTE revoked from PUBLIC/anon/authenticated).';

revoke all on function public.increment_pregame_selection_counts(text, jsonb) from public, anon, authenticated;
grant execute on function public.increment_pregame_selection_counts(text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Reader: the ONLY sanctioned read path. Enforces the contributor floors in the
-- database (see header). STABLE, SECURITY INVOKER (service_role holds the table
-- grants; no elevation needed), search_path locked, UTC month math.
--
-- A cell is returned only if selection_count >= greatest(p_min_count, 10) AND
-- the cell's sport+month has >= greatest(p_min_athletes, 10) distinct athletes
-- with a pregame_complete event (raw activity_events — exact, or a lower bound
-- after the 90-day prune) AND the month is complete with a month-grain
-- activity_rollup row for pregame_complete whose all-sports distinct also meets
-- the floor. greatest() ignores NULL, so NULL arguments fall back to 10.
-- ---------------------------------------------------------------------------
create or replace function public.read_pregame_selection_counts(
  p_min_athletes integer default 10,
  p_min_count    integer default 10
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
  where c.selection_count >= greatest(p_min_count, 10)
    and c.period_start < date_trunc('month', now())::date
    and exists (
      select 1
      from public.activity_rollup r
      where r.grain = 'month'
        and r.period_start = c.period_start
        and r.event_name = 'pregame_complete'
        and r.active_athletes >= greatest(p_min_athletes, 10)
    )
    and (
      select count(distinct e.athlete_id)
      from public.activity_events e
      where e.event_name = 'pregame_complete'
        and e.sport = c.sport
        and e.occurred_at >= c.period_start::timestamptz
        and e.occurred_at <  (c.period_start + interval '1 month')::timestamptz
    ) >= greatest(p_min_athletes, 10)
  order by c.period_start, c.sport, c.dimension, c.value;
$$;

comment on function public.read_pregame_selection_counts(integer, integer) is
  'ONLY sanctioned read path for pregame_selection_counts (FV-724). Returns a '
  'cell only when its count AND the sport+month distinct-athlete count each '
  'meet a floor of at least 10 (caller cannot lower it) and the month is '
  'complete and rolled up. Service-role-only (EXECUTE revoked from '
  'PUBLIC/anon/authenticated).';

revoke all on function public.read_pregame_selection_counts(integer, integer) from public, anon, authenticated;
grant execute on function public.read_pregame_selection_counts(integer, integer) to service_role;
