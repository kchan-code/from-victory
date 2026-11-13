-- =============================================================================
-- RLS assertions — pregame_selection_counts + pregame_selection_contributors
-- (FV-724 follow-up, reworked for FV-749)
--
-- pregame_selection_counts carries TWO counters per (month, sport, dimension,
-- value): selection_count = ALL picks, athlete_count = DISTINCT athletes. The
-- read floor is on athlete_count. Distinctness is per cell: the application
-- sends one keyed one-way digest ("marker") per (athlete, month, sport, option);
-- the database never receives an athlete identifier. The marker table holds only
-- (marker, period_start). read_pregame_selection_counts() is the ONLY sanctioned
-- read path (closed months, athlete_count >= greatest(p_min_athletes, 10)).
-- prune_pregame_selection_totals() is the retention function (also run daily by
-- the cron route).
--
-- Both tables are service-role-only: RLS enabled, NO policies, no client write
-- grants. Everything that writes rolls back.
-- NOT covered here: a true two-connection race (checked manually; the guarantee
-- rests on the marker's primary-key unique index, see the migration header).
-- =============================================================================

create function pg_temp.fv749_cur() returns date language sql as
  $$ select date_trunc('month', now() at time zone 'utc')::date $$;

-- Deterministic 64-hex marker from a label: same label = same athlete+option.
create function pg_temp.fv749_m(label text) returns text language sql as
  $$ select encode(sha256(convert_to(label, 'UTF8')), 'hex') $$;

create function pg_temp.fv749_sel(dim text, val text, marker text) returns jsonb language sql as
  $$ select jsonb_build_object('dimension', dim, 'value', val, 'marker', marker) $$;

-- ---------------------------------------------------------------------------
-- Structure.
-- ---------------------------------------------------------------------------
do $$
declare cols text[]; mcols text[];
begin
  select array_agg(column_name order by column_name) into cols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'pregame_selection_counts';
  assert cols = array['athlete_count','dimension','period_start','selection_count','sport','value'],
    format('FV-749 FAIL: pregame_selection_counts columns drifted: %s', cols);

  select array_agg(column_name order by column_name) into mcols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'pregame_selection_contributors';
  assert mcols = array['marker','period_start'],
    format('FV-749 FAIL: marker table must hold ONLY (marker, period_start) — no athlete/sport/dimension/value column, got %s', mcols);

  assert not exists (select 1 from pg_constraint
                      where conrelid = 'public.pregame_selection_contributors'::regclass and contype = 'f'),
    'FV-749 FAIL: the marker table must have NO foreign key (it holds no athlete identifier)';
  assert exists (select 1 from pg_indexes
                  where schemaname = 'public' and tablename = 'pregame_selection_contributors'
                    and indexdef ~ '\(period_start\)'),
    'FV-749 FAIL: the marker table needs an index on period_start for the prune';

  assert (select relrowsecurity from pg_class where oid = 'public.pregame_selection_counts'::regclass),
    'FV-724 FAIL: pregame_selection_counts must have RLS enabled';
  assert (select relrowsecurity from pg_class where oid = 'public.pregame_selection_contributors'::regclass),
    'FV-749 FAIL: pregame_selection_contributors must have RLS enabled';
  assert not exists (select 1 from pg_policies
                      where schemaname = 'public'
                        and tablename in ('pregame_selection_counts', 'pregame_selection_contributors')),
    'FV-724/749 FAIL: the selection tables must have NO policies';

  assert to_regprocedure('public.increment_pregame_selection_counts(text, jsonb)') is null
     and to_regprocedure('public.read_pregame_selection_counts(integer, integer)') is null
     and to_regprocedure('public.record_pregame_selections(uuid, text, jsonb)') is null
     and to_regprocedure('public.record_pregame_selections(text, text, jsonb)') is null
     and to_regprocedure('public.record_pregame_selections(text, date, text, jsonb)') is null,
    'FV-749 FAIL: old function signatures (incl. any accepting a uuid or a single marker) must not exist';
  assert not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                      where n.nspname = 'public' and p.proname = 'record_pregame_selections'
                        and 'uuid'::regtype = any (p.proargtypes::oid[]::regtype[])),
    'FV-749 FAIL: no function may accept an athlete uuid';
end $$;

-- ---------------------------------------------------------------------------
-- Writer: selection_count always +1; athlete_count +1 only for a new marker.
-- ---------------------------------------------------------------------------
begin;
  delete from public.pregame_selection_counts;
  delete from public.pregame_selection_contributors;

  set local role service_role;
  do $$
  declare
    n int; i int; r record; markers int;
    cur date := pg_temp.fv749_cur();
    a_need text := pg_temp.fv749_m('athleteA|need|Calm');
    b_need text := pg_temp.fv749_m('athleteB|need|Calm');
  begin
    -- Athlete A picks the same option 5 times: 5 picks, 1 athlete, 1 marker.
    for i in 1..5 loop
      select public.record_pregame_selections(cur, 'hockey',
        jsonb_build_array(pg_temp.fv749_sel('need', 'Calm', a_need))) into n;
      assert n = 1, format('FV-749 FAIL: each completed pregame writes its cell, got %s', n);
    end loop;
    select * into r from public.pregame_selection_counts where dimension = 'need' and value = 'Calm';
    assert r.selection_count = 5 and r.athlete_count = 1,
      format('FV-749 FAIL: same athlete x5 must give selection_count 5 / athlete_count 1, got %s / %s', r.selection_count, r.athlete_count);
    assert (select count(*) from public.pregame_selection_contributors) = 1,
      'FV-749 FAIL: one athlete + one option must leave exactly one marker';

    -- A second athlete choosing it: athlete_count 2.
    perform public.record_pregame_selections(cur, 'hockey',
      jsonb_build_array(pg_temp.fv749_sel('need', 'Calm', b_need)));
    select * into r from public.pregame_selection_counts where dimension = 'need' and value = 'Calm';
    assert r.selection_count = 6 and r.athlete_count = 2,
      format('FV-749 FAIL: second athlete must give 6 / 2, got %s / %s', r.selection_count, r.athlete_count);

    -- A different option by athlete A is a new marker for that option.
    perform public.record_pregame_selections(cur, 'hockey',
      jsonb_build_array(pg_temp.fv749_sel('need', 'Joy', pg_temp.fv749_m('athleteA|need|Joy'))));
    select * into r from public.pregame_selection_counts where dimension = 'need' and value = 'Joy';
    assert r.selection_count = 1 and r.athlete_count = 1, 'FV-749 FAIL: a new option must start at 1 / 1';

    -- Wrong / missing period: nothing written, no marker claimed.
    select count(*) into markers from public.pregame_selection_contributors;
    assert public.record_pregame_selections((cur - interval '1 month')::date, 'hockey',
      jsonb_build_array(pg_temp.fv749_sel('need', 'Hope', pg_temp.fv749_m('x1')))) = 0, 'FV-749 FAIL: last-month period must return 0';
    assert public.record_pregame_selections((cur + interval '1 month')::date, 'hockey',
      jsonb_build_array(pg_temp.fv749_sel('need', 'Hope', pg_temp.fv749_m('x1')))) = 0, 'FV-749 FAIL: next-month period must return 0';
    assert public.record_pregame_selections(null, 'hockey',
      jsonb_build_array(pg_temp.fv749_sel('need', 'Hope', pg_temp.fv749_m('x1')))) = 0, 'FV-749 FAIL: null period must return 0';
    assert (select count(*) from public.pregame_selection_counts where value = 'Hope') = 0
       and (select count(*) from public.pregame_selection_contributors) = markers,
      'FV-749 FAIL: a wrong period must write no counts and claim no marker';

    -- Missing / malformed markers: the entry is dropped and does not count.
    select public.record_pregame_selections(cur, 'hockey', jsonb_build_array(
      jsonb_build_object('dimension','need','value','NoMarker'),
      pg_temp.fv749_sel('need', 'ShortMarker', 'abc'),
      pg_temp.fv749_sel('need', 'UpperMarker', upper(pg_temp.fv749_m('u'))),
      jsonb_build_object('dimension','need','value','NumMarker','marker', 5),
      pg_temp.fv749_sel('need', 'Valid', pg_temp.fv749_m('v')))) into n;
    assert n = 1, format('FV-749 FAIL: only the entry with a valid marker may count, got %s', n);
    assert (select count(*) from public.pregame_selection_counts
             where value in ('NoMarker','ShortMarker','UpperMarker','NumMarker')) = 0,
      'FV-749 FAIL: entries with a missing/malformed marker must be dropped';

    -- The SAME marker reused for two different pairs in one call: both picks
    -- count, but at most ONE new athlete.
    select public.record_pregame_selections(cur, 'hockey', jsonb_build_array(
      pg_temp.fv749_sel('need',   'Reuse1', pg_temp.fv749_m('shared')),
      pg_temp.fv749_sel('anchor', 'Reuse2', pg_temp.fv749_m('shared')))) into n;
    assert n = 2, format('FV-749 FAIL: both pairs are written, got %s', n);
    assert (select sum(athlete_count) from public.pregame_selection_counts where value in ('Reuse1','Reuse2')) = 1,
      'FV-749 FAIL: a marker reused across pairs in one call must add at most one athlete';
    assert (select sum(selection_count) from public.pregame_selection_counts where value in ('Reuse1','Reuse2')) = 2,
      'FV-749 FAIL: both reuse pairs still count as picks';

    -- A duplicate (dimension, value) pair inside one call counts once.
    perform public.record_pregame_selections(cur, 'hockey', jsonb_build_array(
      pg_temp.fv749_sel('need', 'Dup', pg_temp.fv749_m('d')),
      pg_temp.fv749_sel('need', 'Dup', pg_temp.fv749_m('d'))));
    select * into r from public.pregame_selection_counts where value = 'Dup';
    assert r.selection_count = 1 and r.athlete_count = 1, 'FV-749 FAIL: a duplicate pair in one call must count once';

    -- Invalid vocabulary / input is dropped or a no-op, never an error.
    select public.record_pregame_selections(cur, 'hockey', jsonb_build_array(
      pg_temp.fv749_sel('cue_word', 'Faithful', pg_temp.fv749_m('c')),
      pg_temp.fv749_sel('need', repeat('x', 121), pg_temp.fv749_m('l')),
      pg_temp.fv749_sel('need', '', pg_temp.fv749_m('e')))) into n;
    assert n = 0, 'FV-749 FAIL: unknown dimension / bad value must not be written';
    assert public.record_pregame_selections(cur, 'Bad Sport', '[]'::jsonb) = 0, 'FV-749 FAIL: bad sport must be a no-op';
    assert public.record_pregame_selections(cur, 'hockey', '{"a":1}'::jsonb) = 0, 'FV-749 FAIL: non-array must be a no-op';

    -- Invariant: athlete_count never exceeds selection_count.
    assert not exists (select 1 from public.pregame_selection_counts where athlete_count > selection_count),
      'FV-749 FAIL: athlete_count exceeded selection_count';

    -- The current (open) month is never readable, however high the counts.
    update public.pregame_selection_counts set selection_count = 500, athlete_count = 500;
    assert (select count(*) from public.read_pregame_selection_counts()) = 0,
      'FV-749 FAIL: the current (open) month must never be readable';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Reader floor is on athlete_count: 500 picks from 9 athletes is NOT readable;
-- 10 athletes is, and both numbers are returned. Floor cannot be lowered.
-- ---------------------------------------------------------------------------
begin;
  delete from public.pregame_selection_counts;
  delete from public.pregame_selection_contributors;

  set local role service_role;
  do $$
  declare i int; j int; r record; vals text[]; vals_low text[]; n int;
  begin
    -- 9 athletes x 3 picks of Joy; 10 athletes x 3 picks of Calm (via the writer).
    for i in 1..9 loop for j in 1..3 loop
      perform public.record_pregame_selections(pg_temp.fv749_cur(), 'hockey',
        jsonb_build_array(pg_temp.fv749_sel('need', 'Joy', pg_temp.fv749_m('joy' || i))));
    end loop; end loop;
    for i in 1..10 loop for j in 1..3 loop
      perform public.record_pregame_selections(pg_temp.fv749_cur(), 'hockey',
        jsonb_build_array(pg_temp.fv749_sel('need', 'Calm', pg_temp.fv749_m('calm' || i))));
    end loop; end loop;
    -- One athlete hammering a third option: huge picks, one athlete.
    for j in 1..40 loop
      perform public.record_pregame_selections(pg_temp.fv749_cur(), 'hockey',
        jsonb_build_array(pg_temp.fv749_sel('need', 'Solo', pg_temp.fv749_m('solo'))));
    end loop;

    assert (select count(*) from public.read_pregame_selection_counts()) = 0,
      'FV-749 FAIL: nothing may be readable before the month closes';

    -- Simulate the month closing.
    update public.pregame_selection_counts set period_start = (period_start - interval '1 month')::date;
    update public.pregame_selection_contributors set period_start = (period_start - interval '1 month')::date;

    select array_agg(value order by value) into vals from public.read_pregame_selection_counts();
    assert vals = array['Calm'],
      format('FV-749 FAIL: only the 10-athlete cell may be readable (not 9 athletes, not 40 solo picks), got %s', vals);
    select * into r from public.read_pregame_selection_counts() where value = 'Calm';
    assert r.selection_count = 30 and r.athlete_count = 10,
      format('FV-749 FAIL: reader must return both counters (30 picks / 10 athletes), got %s / %s', r.selection_count, r.athlete_count);

    -- A cell with 500 picks but 9 athletes stays suppressed.
    update public.pregame_selection_counts set selection_count = 500 where value = 'Joy';
    assert (select count(*) from public.read_pregame_selection_counts() where value = 'Joy') = 0,
      'FV-749 FAIL: 500 picks from 9 athletes must NOT be readable';

    foreach n in array array[1, 0, -5] loop
      select array_agg(value order by value) into vals_low from public.read_pregame_selection_counts(n);
      assert vals_low = vals, format('FV-749 FAIL: floor %s returned more rows: %s', n, vals_low);
    end loop;
    select array_agg(value order by value) into vals_low from public.read_pregame_selection_counts(null);
    assert vals_low = vals, format('FV-749 FAIL: NULL floor returned more rows: %s', vals_low);

    select count(*) into n from public.read_pregame_selection_counts(11);
    assert n = 0, format('FV-749 FAIL: a caller must be able to RAISE the floor to 11, got %s rows', n);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Retention: prune_pregame_selection_totals() (and the writer, which calls it)
-- deletes old markers and closed-month cells with athlete_count < 10 (even with
-- large selection_count); keeps closed cells with athlete_count >= 10 and all
-- current-month rows.
-- ---------------------------------------------------------------------------
begin;
  delete from public.pregame_selection_counts;
  delete from public.pregame_selection_contributors;
  insert into public.pregame_selection_contributors (marker, period_start)
  values (pg_temp.fv749_m('m2'), (pg_temp.fv749_cur() - interval '2 months')::date),
         (pg_temp.fv749_m('m1'), (pg_temp.fv749_cur() - interval '1 month')::date),
         (pg_temp.fv749_m('m0'), pg_temp.fv749_cur());
  insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count, athlete_count)
  values
    ((pg_temp.fv749_cur() - interval '1 month')::date, 'hockey', 'need', 'SmallBigPicks', 900, 9),
    ((pg_temp.fv749_cur() - interval '1 month')::date, 'hockey', 'need', 'BigClosed',      10, 10),
    ((pg_temp.fv749_cur() - interval '3 months')::date, 'hockey', 'need', 'SmallOld',        3, 3),
    (pg_temp.fv749_cur(),                               'hockey', 'need', 'SmallOpen',       2, 1);

  set local role service_role;
  do $$
  declare vals text[]; deleted int;
  begin
    deleted := public.prune_pregame_selection_totals();
    assert deleted = 4, format('FV-749 FAIL: prune must delete 2 markers + 2 closed cells < 10 athletes, reported %s', deleted);
    assert (select count(*) from public.pregame_selection_contributors) = 1,
      'FV-749 FAIL: only the current-month marker may remain';
    select array_agg(value order by value) into vals from public.pregame_selection_counts;
    assert vals = array['BigClosed','SmallOpen'],
      format('FV-749 FAIL: prune must keep closed cells with athlete_count >= 10 and open-month cells, got %s', vals);
    assert public.prune_pregame_selection_totals() = 0, 'FV-749 FAIL: prune must be idempotent';
  end $$;
rollback;

-- Throttle rows: 'pregame_selections' rows in auth_rate_limit_events are
-- per-athlete timestamps, so the prune deletes those older than 2 hours, keeps
-- recent ones, and never touches any other action.
begin;
  delete from public.auth_rate_limit_events where bucket like 'fv749%';
  insert into public.auth_rate_limit_events (bucket, action, created_at)
  values
    ('fv749-old-pregame',    'pregame_selections', now() - interval '3 hours'),
    ('fv749-recent-pregame', 'pregame_selections', now() - interval '30 minutes'),
    ('fv749-old-signin',     'sign_in',            now() - interval '3 hours'),
    ('fv749-old-signup',     'sign_up',            now() - interval '30 days');
  set local role service_role;
  do $$
  declare deleted int;
  begin
    deleted := public.prune_pregame_selection_totals();
    assert deleted >= 1, 'FV-749 FAIL: prune must report the deleted throttle row';
    assert (select count(*) from public.auth_rate_limit_events where bucket = 'fv749-old-pregame') = 0,
      'FV-749 FAIL: an old pregame_selections throttle row must be deleted';
    assert (select count(*) from public.auth_rate_limit_events where bucket = 'fv749-recent-pregame') = 1,
      'FV-749 FAIL: a recent pregame_selections throttle row must be kept';
    assert (select count(*) from public.auth_rate_limit_events where bucket in ('fv749-old-signin', 'fv749-old-signup')) = 2,
      'FV-749 FAIL: rows of other actions must be untouched, however old';
  end $$;
rollback;

-- The writer prunes too.
begin;
  delete from public.pregame_selection_counts;
  delete from public.pregame_selection_contributors;
  insert into public.pregame_selection_contributors (marker, period_start)
  values (pg_temp.fv749_m('old'), (pg_temp.fv749_cur() - interval '2 months')::date);
  insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count, athlete_count)
  values ((pg_temp.fv749_cur() - interval '1 month')::date, 'hockey', 'need', 'SmallClosed', 50, 9);
  set local role service_role;
  do $$
  begin
    perform public.record_pregame_selections(pg_temp.fv749_cur(), 'hockey',
      jsonb_build_array(pg_temp.fv749_sel('need', 'Hope', pg_temp.fv749_m('new'))));
    assert (select count(*) from public.pregame_selection_counts where value = 'SmallClosed') = 0,
      'FV-749 FAIL: the writer must also prune closed-month cells below 10 athletes';
    assert (select count(*) from public.pregame_selection_contributors where period_start < pg_temp.fv749_cur()) = 0,
      'FV-749 FAIL: the writer must also prune old markers';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Client roles: zero rows, no writes, no EXECUTE on any of the functions.
-- ---------------------------------------------------------------------------
begin;
  insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count, athlete_count)
  values ((pg_temp.fv749_cur() - interval '1 month')::date, 'hockey', 'need', 'Probe', 50, 50);
  insert into public.pregame_selection_contributors (marker, period_start)
  values (pg_temp.fv749_m('probe'), current_date);
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare ok boolean; m text := repeat('b', 64); cur date := date_trunc('month', now())::date;
  begin
    assert (select count(*) from public.pregame_selection_counts) = 0, 'FV-724 FAIL: authenticated can read counts';
    assert (select count(*) from public.pregame_selection_contributors) = 0, 'FV-749 FAIL: authenticated can read markers';

    ok := false;
    begin
      insert into public.pregame_selection_contributors (marker, period_start) values (m, current_date);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: authenticated INSERT into the marker table was not denied';

    ok := false;
    begin
      insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count, athlete_count)
        values (current_date, 'hockey', 'need', 'x', 1, 1);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-724 FAIL: authenticated INSERT into counts was not denied';

    ok := false;
    begin perform public.record_pregame_selections(cur, 'hockey', '[]'::jsonb);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: authenticated was able to EXECUTE record_pregame_selections';

    ok := false;
    begin perform * from public.read_pregame_selection_counts();
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: authenticated was able to EXECUTE read_pregame_selection_counts';

    ok := false;
    begin perform public.prune_pregame_selection_totals();
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: authenticated was able to EXECUTE prune_pregame_selection_totals';
  end $$;
rollback;

begin;
  set local role anon;
  do $$
  declare ok boolean; m text := repeat('c', 64); cur date := date_trunc('month', now())::date;
  begin
    assert (select count(*) from public.pregame_selection_counts) = 0, 'FV-724 FAIL: anon can read counts';
    assert (select count(*) from public.pregame_selection_contributors) = 0, 'FV-749 FAIL: anon can read markers';

    ok := false;
    begin
      insert into public.pregame_selection_contributors (marker, period_start) values (m, current_date);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: anon INSERT into the marker table was not denied';

    ok := false;
    begin perform public.record_pregame_selections(cur, 'hockey', '[]'::jsonb);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: anon was able to EXECUTE record_pregame_selections';

    ok := false;
    begin perform * from public.read_pregame_selection_counts();
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: anon was able to EXECUTE read_pregame_selection_counts';

    ok := false;
    begin perform public.prune_pregame_selection_totals();
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: anon was able to EXECUTE prune_pregame_selection_totals';
  end $$;
rollback;

\echo '  [PASS] 25_pregame_selection_counts (FV-724, FV-749)'
