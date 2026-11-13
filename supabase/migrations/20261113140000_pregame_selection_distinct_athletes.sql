-- =============================================================================
-- Migration: 20261113140000_pregame_selection_distinct_athletes.sql
--
-- Purpose (FV-749): keep ABSOLUTE totals of which pregame options are chosen
--   ("what resonates, what are the common problems") while making the privacy
--   floor real: a total is readable only once at least 10 DIFFERENT athletes
--   chose that option (kids-privacy-officer MEDIUM: picks alone can come from
--   one athlete completing many pregames).
--
-- What the two counters mean (public.pregame_selection_counts, per UTC month,
--   sport, dimension, value):
--   selection_count = ALL picks: +1 for every completed pregame that chose it.
--   athlete_count   = DISTINCT ATHLETES who chose it that month.
--   The read floor is on athlete_count, NOT selection_count: a cell with 500
--   picks from 9 athletes is never readable.
--
-- How athlete_count counts each athlete once per option per month WITHOUT the
--   database ever learning who the athlete is:
--   The APPLICATION server computes, per (athlete, month, sport, dimension,
--   value), an opaque keyed one-way digest
--     marker = hex(HMAC-SHA256(secret, "pregame-selection-marker:v2:" ||
--                JSON([athleteId, period, sport, dimension, value])))
--   and sends only the digests. public.pregame_selection_contributors holds one
--   row per such digest: (marker, period_start) and NOTHING else: no athlete id,
--   no sport/dimension/value column, no FK, no timestamp. The database never
--   receives an athlete identifier. Honest limit: someone holding BOTH the
--   database AND the server secret could test a known athlete id + option
--   against the markers. Markers are deleted once their month ends.
--   record_pregame_selections() does, in ONE statement (one transaction):
--     claimed = INSERT markers ... ON CONFLICT DO NOTHING RETURNING marker
--     counts  = upsert every valid pair: selection_count + 1 ALWAYS,
--               athlete_count + 1 ONLY for pairs whose marker was newly claimed.
--   Concurrency: two simultaneous calls from the same athlete for the same
--   option insert the same marker; the second blocks on the primary key until
--   the first commits, then conflicts, so it is not "claimed": the cell ends at
--   athlete_count +1 and selection_count +2. Marker inserts and count upserts
--   both run in (dimension, value) order, so calls cannot deadlock each other.
--   If two pairs in one call carry the SAME marker, only the first (in
--   dimension, value order) can be claimed, so it cannot be exploited to add
--   athletes.
--   Month boundary: the app passes p_period (the month it used for the digests);
--   the writer counts ONLY if p_period is exactly the current UTC month's first
--   day (computed in SQL from now()); otherwise it returns 0 and writes nothing,
--   so a call straddling midnight at a month boundary is simply not counted.
--
-- Retention (public.prune_pregame_selection_totals(), run on every writer call
--   AND from the daily cron route /api/cron/prune-activity-events):
--   - Marker rows live only for the CURRENT UTC month; older ones are deleted.
--   - Cells with athlete_count below 10 are deleted once their month closes
--     (never readable, so not retained), whatever their selection_count.
--   - Cells with athlete_count of 10 or more are kept.
--   The raw table can still hold cells below 10 for the CURRENT month only.
--
-- Still true: the raw count table is NOT anonymous on its own at small counts
--   (a current-month cell can be one minor's choice), the reader below is the
--   ONLY sanctioned read path, nothing may read the raw tables for
--   display/export, and the writes are not hidden from backups / WAL / row
--   versions.
--
-- Clean slate: rows written before this migration used the earlier counting
--   rules (picks / one vote per athlete). The table is hours old and nothing
--   reads it, so every existing row is deleted below.
--
-- Also: extends auth_rate_limit_events.action to permit 'pregame_selections'
--   (the throttle on logPregameSelections reuses the existing rate-limit store).
-- =============================================================================

delete from public.pregame_selection_counts;

alter table public.pregame_selection_counts
  add column athlete_count bigint not null default 0;
alter table public.pregame_selection_counts
  add constraint pregame_selection_counts_athlete_count_check
  check (athlete_count >= 0 and athlete_count <= selection_count);

-- ---------------------------------------------------------------------------
-- Marker table: keyed one-way digest + month. NO athlete id, NO FK to profiles
-- (so nothing here cascades on account deletion, and nothing identifies an
-- account), NO sport/dimension/value column. RLS on, NO policies, no client
-- write grants (same posture as pregame_selection_counts).
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
  'One keyed one-way digest (HMAC-SHA256, computed by the application server) '
  'per (athlete, UTC month, sport, option): "this athlete was already counted '
  'for this option this month". The database holds no athlete identifier, but '
  'someone holding BOTH the database and the server secret could test a known '
  'athlete id + option against these. No sport/dimension/value/timestamp '
  'columns. Rows are deleted once their month ends (prune_pregame_selection_totals). '
  'Service-role-only: RLS enabled, no policies.';

alter table public.pregame_selection_contributors enable row level security;

revoke all privileges on table public.pregame_selection_contributors from public, anon, authenticated;
grant select on table public.pregame_selection_contributors to authenticated, anon;

comment on table public.pregame_selection_counts is
  'Monthly totals per pregame option (FV-749): selection_count = ALL picks, '
  'athlete_count = DISTINCT athletes who chose it that month (counted via keyed '
  'digest markers; the database holds no athlete identifier). The read floor is '
  'on athlete_count (>= 10). NOT anonymous on its own at small counts '
  '(current-month cells can be below 10) and not hidden from backups/row '
  'versions. The ONLY sanctioned read path is read_pregame_selection_counts() '
  '(closed months, athlete_count >= 10); never SELECT this table for display or '
  'export. Retention: cells with athlete_count < 10 are deleted when their '
  'month closes; cells with athlete_count >= 10 are kept. Service-role-only: '
  'RLS enabled, no policies.';

comment on column public.pregame_selection_counts.selection_count is
  'ALL picks: +1 for every completed pregame that chose this option.';
comment on column public.pregame_selection_counts.athlete_count is
  'DISTINCT athletes who chose this option this UTC month. The privacy floor '
  'is applied to THIS column.';

-- ---------------------------------------------------------------------------
-- Prune: retention, in its own function so the daily cron can call it too (the
-- writer also calls it). Markers before the current UTC month; closed-month
-- cells with athlete_count below 10. Returns the number of rows deleted.
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
   where period_start < v_period and athlete_count < 10;
  get diagnostics n2 = row_count;
  return n1 + n2;
end;
$$;

comment on function public.prune_pregame_selection_totals() is
  'Retention for the pregame selection tables (FV-749): deletes marker rows of '
  'closed months and closed-month cells with athlete_count below 10. '
  'Service-role-only.';

revoke all on function public.prune_pregame_selection_totals() from public, anon, authenticated;
grant execute on function public.prune_pregame_selection_totals() to service_role;

-- ---------------------------------------------------------------------------
-- Writer. Replaces increment_pregame_selection_counts (dropped below).
--
-- p_period    the UTC month's first day the app used for the digests; must equal
--             the current UTC month, else 0 and nothing is written.
-- p_selections jsonb ARRAY of {"dimension": text, "value": text, "marker": text}.
--             Dropped: unknown dimension; non-string / empty / >120-char value;
--             marker not 64 lowercase hex; entries past the first 32. One entry
--             per distinct (dimension, value) (duplicates collapse).
-- Returns the number of cells written (0 if nothing valid / wrong period).
--
-- The database never receives an athlete identifier. SECURITY INVOKER:
-- service_role already holds the table grants.
-- ---------------------------------------------------------------------------
create or replace function public.record_pregame_selections(
  p_period     date,
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
  v_valid  jsonb;
begin
  perform public.prune_pregame_selection_totals();

  if p_period is distinct from v_period
     or p_sport is null or p_sport !~ '^[a-z][a-z-]{0,31}$'
     or p_selections is null or jsonb_typeof(p_selections) <> 'array' then
    return 0;
  end if;

  select jsonb_agg(jsonb_build_object('dimension', v.dimension, 'value', v.value, 'marker', v.marker)
                   order by v.dimension, v.value)
    into v_valid
  from (
    select distinct on (s.dimension, s.value) s.dimension, s.value, s.marker
    from (
      select e.elem ->> 'dimension' as dimension,
             e.elem ->> 'value'     as value,
             e.elem ->> 'marker'    as marker
      from jsonb_array_elements(p_selections) with ordinality as e(elem, ord)
      where e.ord <= 32
        and jsonb_typeof(e.elem -> 'value') = 'string'
        and jsonb_typeof(e.elem -> 'marker') = 'string'
    ) s
    where s.dimension in (
            'need', 'role', 'adversity', 'anchor', 'self_talk',
            'prayer_style', 'positive_play'
          )
      and s.value is not null
      and char_length(s.value) between 1 and 120
      and s.marker ~ '^[0-9a-f]{64}$'
    order by s.dimension, s.value, s.marker
  ) v;

  if v_valid is null then
    return 0;
  end if;

  -- One statement, one transaction: claim markers, then count. selection_count
  -- always +1; athlete_count +1 only where THIS statement newly claimed the
  -- pair's marker. mrn = 1 limits a marker shared by several pairs in one call
  -- to its first pair (dimension, value order), so reuse cannot add athletes.
  with pairs as (
    select t.dimension, t.value, t.marker,
           row_number() over (partition by t.marker order by t.dimension, t.value) as mrn
    from jsonb_to_recordset(v_valid) as t(dimension text, value text, marker text)
  ),
  claimed as (
    insert into public.pregame_selection_contributors (marker, period_start)
    select p.marker, v_period
    from pairs p
    where p.mrn = 1
    order by p.dimension, p.value   -- same order in every call: no deadlocks
    on conflict (marker) do nothing
    returning marker
  )
  insert into public.pregame_selection_counts as c
    (period_start, sport, dimension, value, selection_count, athlete_count)
  select v_period, p_sport, p.dimension, p.value, 1,
         case when p.mrn = 1 and cl.marker is not null then 1 else 0 end
  from pairs p
  left join claimed cl on cl.marker = p.marker
  order by p.dimension, p.value
  on conflict (period_start, sport, dimension, value)
  do update set selection_count = c.selection_count + 1,
                athlete_count   = c.athlete_count + excluded.athlete_count;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function public.record_pregame_selections(date, text, jsonb) is
  'Records a completed pregame''s selections (FV-749): selection_count +1 per '
  'pair always; athlete_count +1 only when the pair''s keyed digest marker is '
  'newly claimed this month. The database never receives an athlete identifier. '
  'Counts only when p_period is the current UTC month (else 0, nothing written). '
  'Also prunes (see prune_pregame_selection_totals). Service-role-only (EXECUTE '
  'revoked from PUBLIC/anon/authenticated).';

revoke all on function public.record_pregame_selections(date, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_pregame_selections(date, text, jsonb) to service_role;

drop function public.increment_pregame_selection_counts(text, jsonb);

-- ---------------------------------------------------------------------------
-- Reader: the ONLY sanctioned read path. Closed months only; the floor is on
-- athlete_count (distinct athletes), not selection_count. The caller can raise
-- the floor but never lower it below 10 (NULL -> 10).
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
  selection_count bigint,
  athlete_count   bigint
)
language sql
stable
set search_path = public
set timezone = 'UTC'
as $$
  select c.period_start, c.sport, c.dimension, c.value, c.selection_count, c.athlete_count
  from public.pregame_selection_counts c
  where c.period_start < date_trunc('month', now())::date
    and c.athlete_count >= greatest(coalesce(p_min_athletes, 10), 10)
  order by c.period_start, c.sport, c.dimension, c.value;
$$;

comment on function public.read_pregame_selection_counts(integer) is
  'ONLY sanctioned read path for pregame_selection_counts (FV-749). Closed UTC '
  'months only; returns cells whose DISTINCT-ATHLETE count (athlete_count) is >= '
  'greatest(p_min_athletes, 10), with both counters. Service-role-only (EXECUTE '
  'revoked from PUBLIC/anon/authenticated).';

revoke all on function public.read_pregame_selection_counts(integer) from public, anon, authenticated;
grant execute on function public.read_pregame_selection_counts(integer) to service_role;

-- ---------------------------------------------------------------------------
-- Throttle vocabulary: logPregameSelections reuses the rate-limit store, whose
-- action column has a closed CHECK. Same pattern as earlier migrations.
-- ---------------------------------------------------------------------------
alter table public.auth_rate_limit_events
  drop constraint if exists auth_rate_limit_events_action_check;

alter table public.auth_rate_limit_events
  add constraint auth_rate_limit_events_action_check
  check (action in (
    'sign_in',
    'sign_up',
    'athlete_sign_in',
    'claim_pairing',
    'generate_pairing_code',
    'password_reset',
    'password_update',
    'username_sign_in',
    'preview_invite',
    'signup_verify',
    'signup_resend',
    'apple_signin',
    'apple_handoff',
    'pregame_selections'
  ));

comment on column public.auth_rate_limit_events.action is
  'The server action that generated this event: sign_in, sign_up, '
  'athlete_sign_in, claim_pairing, generate_pairing_code, password_reset, '
  'password_update, username_sign_in, preview_invite, signup_verify, '
  'signup_resend, apple_signin (reserved, FV-673), apple_handoff (reserved, '
  'FV-673) or pregame_selections (FV-749 throttle on selection totals).';
