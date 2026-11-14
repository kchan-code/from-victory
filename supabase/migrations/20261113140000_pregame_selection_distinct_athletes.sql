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
--   athletes_2plus / athletes_4plus / athletes_8plus = how many of those athletes
--   picked the option at least 2 / 4 / 8 times that month (cumulative, so
--   athletes_8plus <= athletes_4plus <= athletes_2plus <= athlete_count).
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
--     claimed = INSERT markers ... ON CONFLICT DO UPDATE pick_count + 1
--               RETURNING marker, pick_count
--     counts  = upsert every valid pair: selection_count + 1 ALWAYS,
--               athlete_count + 1 when the marker's pick_count is now 1,
--               athletes_2plus / 4plus / 8plus + 1 when it is now exactly 2 / 4 / 8,
--               so each threshold counter moves once per athlete per option per
--               month, at the crossing. The marker row also holds how many times
--               that athlete picked that option this month (pick_count).
--   Concurrency: two simultaneous calls from the same athlete for the same
--   option insert the same marker; the second blocks on the primary key until
--   the first commits, then updates the same row (pick_count 2): the cell ends at
--   athlete_count +1, athletes_2plus +1 and selection_count +2. Marker inserts and count upserts
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
--   - Throttle rows: the 'pregame_selections' rows in auth_rate_limit_events
--     (a per-athlete timestamped record of each pregame completion, written by
--     the rate-limit store) are deleted once older than 2 hours (the limiter
--     window is 60 minutes, RATE_LIMIT_CONFIG.pregame_selections), so they live
--     at most about a day (the prune runs on every write and daily). Rows of
--     every other action are untouched.
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
alter table public.pregame_selection_counts
  add column athletes_2plus integer not null default 0,
  add column athletes_4plus integer not null default 0,
  add column athletes_8plus integer not null default 0;
alter table public.pregame_selection_counts
  add constraint pregame_selection_counts_repeat_check
  check (athletes_8plus >= 0
         and athletes_8plus <= athletes_4plus
         and athletes_4plus <= athletes_2plus
         and athletes_2plus <= athlete_count);

-- ---------------------------------------------------------------------------
-- Marker table: keyed one-way digest + month. NO athlete id, NO FK to profiles
-- (so nothing here cascades on account deletion, and nothing identifies an
-- account), NO sport/dimension/value column. RLS on, NO policies, no client
-- write grants (same posture as pregame_selection_counts).
-- ---------------------------------------------------------------------------
create table public.pregame_selection_contributors (
  marker       text not null check (marker ~ '^[0-9a-f]{64}$'),
  period_start date not null,
  -- How many times this keyed digest (athlete + option + month) has been picked
  -- this month. Opaque: no athlete id and no option in the clear.
  pick_count   integer not null default 1 check (pick_count >= 1),
  primary key (marker)
);

-- The primary key cannot serve the prune's range predicate on period_start.
create index pregame_selection_contributors_period_idx
  on public.pregame_selection_contributors (period_start);

comment on table public.pregame_selection_contributors is
  'One keyed one-way digest (HMAC-SHA256, computed by the application server) '
  'per (athlete, UTC month, sport, option): "this athlete was already counted '
  'for this option this month" and how many times (pick_count). The database '
  'holds no athlete identifier, but '
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
comment on column public.pregame_selection_counts.athletes_2plus is
  'Athletes who picked this option at least 2 times this UTC month (<= athlete_count).';
comment on column public.pregame_selection_counts.athletes_4plus is
  'Athletes who picked this option at least 4 times this UTC month (<= athletes_2plus).';
comment on column public.pregame_selection_counts.athletes_8plus is
  'Athletes who picked this option at least 8 times this UTC month (<= athletes_4plus).';
comment on column public.pregame_selection_counts.athlete_count is
  'DISTINCT athletes who chose this option this UTC month. The privacy floor '
  'is applied to THIS column.';

-- ---------------------------------------------------------------------------
-- Prune: retention, in its own function so the daily cron can call it too (the
-- writer also calls it). Markers before the current UTC month; closed-month
-- cells with athlete_count below 10; 'pregame_selections' throttle rows older
-- than 2 hours. Returns the number of rows deleted.
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
  n3 integer;
begin
  delete from public.pregame_selection_contributors where period_start < v_period;
  get diagnostics n1 = row_count;
  delete from public.pregame_selection_counts
   where period_start < v_period and athlete_count < 10;
  get diagnostics n2 = row_count;
  -- Throttle rows: 2h = the 60-minute limiter window plus a safe margin. ONLY
  -- this action; every other auth_rate_limit_events row is left alone.
  delete from public.auth_rate_limit_events
   where action = 'pregame_selections'
     and created_at < now() - interval '2 hours';
  get diagnostics n3 = row_count;
  return n1 + n2 + n3;
end;
$$;

comment on function public.prune_pregame_selection_totals() is
  'Retention for the pregame selection tables (FV-749): deletes marker rows of '
  'closed months, closed-month cells with athlete_count below 10, and '
  'pregame_selections throttle rows in auth_rate_limit_events older than 2 hours '
  '(no other action). Service-role-only.';

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

  -- One statement, one transaction: bump markers, then count. selection_count
  -- always +1. The marker upsert returns the athlete's pick_count for the option
  -- THIS month; the threshold counters move exactly at the crossing: athlete_count
  -- at 1, athletes_2plus at 2, athletes_4plus at 4, athletes_8plus at 8. mrn = 1
  -- limits a marker shared by several pairs in one call to its first pair
  -- (dimension, value order), so a duplicate marker increments pick_count once.
  -- The where clause on the update keeps a row from another period untouched
  -- (cannot happen: the digest includes the period); it then counts picks only.
  with pairs as (
    select t.dimension, t.value, t.marker,
           row_number() over (partition by t.marker order by t.dimension, t.value) as mrn
    from jsonb_to_recordset(v_valid) as t(dimension text, value text, marker text)
  ),
  claimed as (
    insert into public.pregame_selection_contributors as m (marker, period_start, pick_count)
    select p.marker, v_period, 1
    from pairs p
    where p.mrn = 1
    order by p.dimension, p.value   -- same order in every call: no deadlocks
    on conflict (marker) do update set pick_count = m.pick_count + 1
      where m.period_start = excluded.period_start
    returning m.marker, m.pick_count
  )
  insert into public.pregame_selection_counts as c
    (period_start, sport, dimension, value, selection_count,
     athlete_count, athletes_2plus, athletes_4plus, athletes_8plus)
  -- The proposed tuple is CUMULATIVE (pick 2 -> athlete_count 1, 2plus 1, ...),
  -- because the table CHECK (8plus <= 4plus <= 2plus <= athlete_count) is
  -- evaluated on the proposed row BEFORE conflict handling. The DO UPDATE then
  -- converts the cumulative proposal back into per-counter deltas by
  -- differencing: pick 1 -> (+1,0,0,0); 2 -> (0,+1,0,0); 4 -> (0,0,+1,0);
  -- 8 -> (0,0,0,+1); any other pick -> (0,0,0,0).
  select v_period, p_sport, p.dimension, p.value, 1,
         case when p.mrn = 1 and cl.pick_count in (1, 2, 4, 8) then 1 else 0 end,
         case when p.mrn = 1 and cl.pick_count in (2, 4, 8)    then 1 else 0 end,
         case when p.mrn = 1 and cl.pick_count in (4, 8)       then 1 else 0 end,
         case when p.mrn = 1 and cl.pick_count = 8             then 1 else 0 end
  from pairs p
  left join claimed cl on cl.marker = p.marker
  order by p.dimension, p.value
  on conflict (period_start, sport, dimension, value)
  do update set selection_count = c.selection_count + 1,
                athlete_count   = c.athlete_count  + (excluded.athlete_count  - excluded.athletes_2plus),
                athletes_2plus  = c.athletes_2plus + (excluded.athletes_2plus - excluded.athletes_4plus),
                athletes_4plus  = c.athletes_4plus + (excluded.athletes_4plus - excluded.athletes_8plus),
                athletes_8plus  = c.athletes_8plus + excluded.athletes_8plus;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function public.record_pregame_selections(date, text, jsonb) is
  'Records a completed pregame''s selections (FV-749): selection_count +1 per '
  'pair always; athlete_count +1 when the pair''s keyed digest marker is first '
  'seen this month, and athletes_2plus/4plus/8plus +1 when its pick_count reaches '
  '2/4/8. The database never receives an athlete identifier. '
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
  athlete_count   bigint,
  athletes_2plus  integer,
  athletes_4plus  integer,
  athletes_8plus  integer
)
language sql
stable
set search_path = public
set timezone = 'UTC'
as $$
  select c.period_start, c.sport, c.dimension, c.value, c.selection_count, c.athlete_count,
         c.athletes_2plus, c.athletes_4plus, c.athletes_8plus
  from public.pregame_selection_counts c
  where c.period_start < date_trunc('month', now())::date
    and c.athlete_count >= greatest(coalesce(p_min_athletes, 10), 10)
  order by c.period_start, c.sport, c.dimension, c.value;
$$;

comment on function public.read_pregame_selection_counts(integer) is
  'ONLY sanctioned read path for pregame_selection_counts (FV-749). Closed UTC '
  'months only; returns cells whose DISTINCT-ATHLETE count (athlete_count) is >= '
  'greatest(p_min_athletes, 10), with all counters (picks, athletes, and the '
  '2+/4+/8+ repeat breakdown). Service-role-only (EXECUTE '
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
