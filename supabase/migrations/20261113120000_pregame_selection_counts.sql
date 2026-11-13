-- =============================================================================
-- Migration: 20261113120000_pregame_selection_counts.sql
--
-- Purpose (FV-724 follow-up): keep knowing WHICH pregame options are chosen
--   most and least, ANONYMOUSLY. FV-724 stopped storing an athlete's pregame
--   selections in activity_events.meta (that was per-athlete). This table is
--   the replacement: pure anonymous TOTALS per UTC month.
--
-- Privacy model (athletes are 13+, many are minors 13-17):
--   - NO athlete id, NO user id, NO session id, NO row-level timestamp. A
--     created_at / updated_at here would let a row be time-correlated with one
--     athlete's pregame_complete event, so they are deliberately absent. The
--     only time column is `period_start`, the first day of the UTC month.
--   - Each dimension is counted INDEPENDENTLY. A row never holds a combination
--     of two selections, so no per-athlete "profile" can be reconstructed.
--   - Values come from fixed vocabularies validated server-side
--     (apps/web/lib/activity/pregame-selection-core.ts); free text (cue word,
--     anything typed) is never counted. The table CHECKs and the function below
--     re-validate dimension + value length (defense in depth).
--   - Service-role-only, same posture as activity_rollup: RLS enabled with NO
--     policies, no INSERT/UPDATE/DELETE grant to any client role. The only
--     writer is increment_pregame_selection_counts(), EXECUTE service_role only.
--   - No FK to profiles/auth.users by design: nothing here is user data, so
--     account deletion has nothing to cascade (and nothing to retain).
--
-- Nothing reads this table yet (no dashboard in this change).
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
  'ANONYMOUS monthly totals of which pregame options are chosen (FV-724). No '
  'athlete/user/session id, no row timestamps, one dimension per row. Service-'
  'role-only: RLS enabled, no policies; authenticated/anon see 0 rows.';

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
  on conflict (period_start, sport, dimension, value)
  do update set selection_count = c.selection_count + excluded.selection_count;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function public.increment_pregame_selection_counts(text, jsonb) is
  'Anonymous +1 per (dimension, value) for the current UTC month (FV-724). '
  'Takes NO athlete identifier. Re-validates dimension + value length. '
  'Service-role-only (EXECUTE revoked from PUBLIC/anon/authenticated).';

revoke all on function public.increment_pregame_selection_counts(text, jsonb) from public, anon, authenticated;
grant execute on function public.increment_pregame_selection_counts(text, jsonb) to service_role;
