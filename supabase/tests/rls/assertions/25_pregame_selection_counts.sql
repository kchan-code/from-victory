-- =============================================================================
-- RLS assertions — pregame_selection_counts + pregame_selection_contributors
-- (FV-724 follow-up, reworked for FV-749)
--
-- selection_count is a count of DISTINCT ATHLETES: record_pregame_selections()
-- counts each opaque marker at most once per UTC month. The marker is a keyed
-- one-way digest computed by the APPLICATION; the database never receives an
-- athlete identifier and neither table has an athlete column or an FK to
-- profiles. read_pregame_selection_counts() is the ONLY sanctioned read path:
-- closed months only, cells with count >= greatest(p_min_athletes, 10).
-- prune_pregame_selection_totals() is the retention function (also run daily by
-- the cron route).
--
-- Both tables are service-role-only: RLS enabled, NO policies, no client write
-- grants. Everything that writes rolls back.
-- NOT covered here: a true two-connection race (the guarantee rests on the
-- marker's primary-key unique index; see the migration header).
-- =============================================================================

create function pg_temp.fv749_cur() returns date language sql as
  $$ select date_trunc('month', now() at time zone 'utc')::date $$;

create function pg_temp.fv749_marker() returns text language sql as
  $$ select encode(sha256(gen_random_uuid()::text::bytea), 'hex') $$;

-- ---------------------------------------------------------------------------
-- Structure.
-- ---------------------------------------------------------------------------
do $$
declare cols text[]; mcols text[];
begin
  select array_agg(column_name order by column_name) into cols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'pregame_selection_counts';
  assert cols = array['dimension','period_start','selection_count','sport','value'],
    format('FV-724 FAIL: pregame_selection_counts columns drifted from the identifier-free set: %s', cols);

  select array_agg(column_name order by column_name) into mcols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'pregame_selection_contributors';
  assert mcols = array['marker','period_start'],
    format('FV-749 FAIL: pregame_selection_contributors must hold ONLY (marker, period_start), got %s', mcols);

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

  assert to_regprocedure('public.increment_pregame_selection_counts(text, jsonb)') is null,
    'FV-749 FAIL: the old increment_pregame_selection_counts must be dropped';
  assert to_regprocedure('public.read_pregame_selection_counts(integer, integer)') is null,
    'FV-749 FAIL: the old two-argument reader must be dropped';
  assert to_regprocedure('public.record_pregame_selections(text, text, jsonb)') is null,
    'FV-749 FAIL: no function may accept an athlete uuid';
end $$;

-- ---------------------------------------------------------------------------
-- Writer: once per marker per UTC month.
-- ---------------------------------------------------------------------------
begin;
  delete from public.pregame_selection_counts;
  delete from public.pregame_selection_contributors;

  set local role service_role;
  do $$
  declare
    x text := pg_temp.fv749_marker();
    y text := pg_temp.fv749_marker();
    n int; cnt bigint; markers int; i int;
    cur date := date_trunc('month', now() at time zone 'utc')::date;
  begin
    -- First call: +1 per distinct cell, duplicate pair in one call adds 1, bad
    -- entries dropped, plus exactly one marker.
    select public.record_pregame_selections(x, pg_temp.fv749_cur(), 'hockey', jsonb_build_array(
      jsonb_build_object('dimension','need',          'value','Confidence'),
      jsonb_build_object('dimension','role',          'value','Goalie'),
      jsonb_build_object('dimension','positive_play', 'value','viz-a'),
      jsonb_build_object('dimension','positive_play', 'value','viz-a'),
      jsonb_build_object('dimension','cue_word',      'value','Faithful'),
      jsonb_build_object('dimension','need',          'value', repeat('x', 121)),
      jsonb_build_object('dimension','need',          'value', ''),
      jsonb_build_object('dimension','need',          'value', 5)
    )) into n;
    assert n = 3, format('FV-749 FAIL: first call must write 3 cells (need, role, positive_play), got %s', n);
    select selection_count into cnt from public.pregame_selection_counts
     where dimension = 'positive_play' and value = 'viz-a' and sport = 'hockey' and period_start = cur;
    assert cnt = 1, format('FV-749 FAIL: a duplicate pair in one call must add 1, got %s', cnt);
    select count(*) into markers from public.pregame_selection_contributors
     where marker = x and period_start = cur;
    assert markers = 1, 'FV-749 FAIL: first call must record exactly one marker';
    assert (select count(*) from public.pregame_selection_counts
             where dimension = 'cue_word' or char_length(value) > 120 or value = '' or value = '5') = 0,
      'FV-724 FAIL: unknown dimension / bad value was stored';

    -- Second call, same marker, same month, DIFFERENT selections: nothing.
    select public.record_pregame_selections(x, pg_temp.fv749_cur(), 'hockey', jsonb_build_array(
      jsonb_build_object('dimension','need','value','Calm'),
      jsonb_build_object('dimension','need','value','Confidence'))) into n;
    assert n = 0, format('FV-749 FAIL: second call in the month must return 0, got %s', n);
    assert (select count(*) from public.pregame_selection_counts where value = 'Calm') = 0,
      'FV-749 FAIL: second call in the month wrote a cell';

    -- The same marker calling many times leaves every cell at 1.
    for i in 1..5 loop
      perform public.record_pregame_selections(x, pg_temp.fv749_cur(), 'hockey', jsonb_build_array(
        jsonb_build_object('dimension','need','value','Confidence'),
        jsonb_build_object('dimension','role','value','Goalie')));
    end loop;
    assert (select max(selection_count) from public.pregame_selection_counts) = 1,
      'FV-749 FAIL: repeated calls with one marker must leave every cell at 1';
    select count(*) into markers from public.pregame_selection_contributors where marker = x;
    assert markers = 1, 'FV-749 FAIL: marker duplicated';

    -- A different marker adds +1 to the same cell.
    select public.record_pregame_selections(y, pg_temp.fv749_cur(), 'hockey', jsonb_build_array(
      jsonb_build_object('dimension','need','value','Confidence'))) into n;
    assert n = 1, format('FV-749 FAIL: a different marker must write 1 cell, got %s', n);
    select selection_count into cnt from public.pregame_selection_counts
     where dimension = 'need' and value = 'Confidence' and sport = 'hockey' and period_start = cur;
    assert cnt = 2, format('FV-749 FAIL: two distinct markers must give 2, got %s', cnt);

    -- Invalid input is a no-op, never an error, and never claims a marker.
    assert public.record_pregame_selections(null, pg_temp.fv749_cur(), 'hockey', '[]'::jsonb) = 0, 'FV-749 FAIL: null marker must be a no-op';
    assert public.record_pregame_selections('not-a-digest', pg_temp.fv749_cur(), 'hockey',
      jsonb_build_array(jsonb_build_object('dimension','need','value','Hope'))) = 0,
      'FV-749 FAIL: a malformed marker must be a no-op';
    assert public.record_pregame_selections(pg_temp.fv749_marker(), pg_temp.fv749_cur(), 'Bad Sport', '[]'::jsonb) = 0, 'FV-749 FAIL: bad sport must be a no-op';
    assert public.record_pregame_selections(pg_temp.fv749_marker(), pg_temp.fv749_cur(), 'hockey', '{"a":1}'::jsonb) = 0, 'FV-749 FAIL: non-array must be a no-op';
    assert (select count(*) from public.pregame_selection_contributors) = 2,
      'FV-749 FAIL: invalid input must not record a marker';

    -- The marker is NOT claimed when nothing valid is counted, so a later call
    -- with valid selections still counts.
    declare z text := pg_temp.fv749_marker(); begin
      assert public.record_pregame_selections(z, pg_temp.fv749_cur(), 'hockey', jsonb_build_array(
        jsonb_build_object('dimension','cue_word','value','Faithful'),
        jsonb_build_object('dimension','need','value',''))) = 0,
        'FV-749 FAIL: nothing valid must return 0';
      assert (select count(*) from public.pregame_selection_contributors where marker = z) = 0,
        'FV-749 FAIL: a call with nothing valid must not claim the marker';
      assert public.record_pregame_selections(z, pg_temp.fv749_cur(), 'hockey',
        jsonb_build_array(jsonb_build_object('dimension','need','value','Hope'))) = 1,
        'FV-749 FAIL: the month must still be available after an empty call';
    end;

    -- The current month is never readable, however high the count.
    update public.pregame_selection_counts set selection_count = 500;
    assert (select count(*) from public.read_pregame_selection_counts()) = 0,
      'FV-749 FAIL: the current (open) month must never be readable';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Period guard: the writer counts ONLY when p_period is the current UTC month.
-- A last-month / next-month / null / garbage period returns 0, claims no
-- marker and writes nothing (so a call straddling a month boundary is simply
-- not counted, and the same athlete's next-month call counts normally).
-- ---------------------------------------------------------------------------
begin;
  delete from public.pregame_selection_counts;
  delete from public.pregame_selection_contributors;
  set local role service_role;
  do $$
  declare
    m text := pg_temp.fv749_marker();
    sel jsonb := jsonb_build_array(jsonb_build_object('dimension','need','value','Hope'));
    p date;
  begin
    foreach p in array array[
      (pg_temp.fv749_cur() - interval '1 month')::date,
      (pg_temp.fv749_cur() + interval '1 month')::date,
      pg_temp.fv749_cur() + 1,
      null::date] loop
      assert public.record_pregame_selections(m, p, 'hockey', sel) = 0,
        format('FV-749 FAIL: period %s must return 0', p);
    end loop;
    assert (select count(*) from public.pregame_selection_contributors) = 0,
      'FV-749 FAIL: a wrong period must not claim a marker';
    assert (select count(*) from public.pregame_selection_counts) = 0,
      'FV-749 FAIL: a wrong period must not write counts';
    -- The same marker still counts with the right period afterwards.
    assert public.record_pregame_selections(m, pg_temp.fv749_cur(), 'hockey', sel) = 1,
      'FV-749 FAIL: a correct-period call after a rejected one must count';
  end $$;
  -- Garbage period text cannot even be cast.
  do $$
  declare ok boolean := false;
  begin
    begin
      perform public.record_pregame_selections(pg_temp.fv749_marker(), 'garbage'::date, 'hockey', '[]'::jsonb);
    exception when invalid_datetime_format or datatype_mismatch or invalid_text_representation then ok := true; end;
    assert ok, 'FV-749 FAIL: a garbage period must be rejected';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Month rollover: last month's marker row does not stop the same athlete's
-- NEW-month digest (a different value) from counting.
-- ---------------------------------------------------------------------------
begin;
  delete from public.pregame_selection_counts;
  delete from public.pregame_selection_contributors;
  insert into public.pregame_selection_contributors (marker, period_start)
  values (pg_temp.fv749_marker(), (date_trunc('month', now() at time zone 'utc') - interval '1 month')::date);
  set local role service_role;
  do $$
  begin
    assert public.record_pregame_selections(pg_temp.fv749_marker(), pg_temp.fv749_cur(), 'hockey',
      jsonb_build_array(jsonb_build_object('dimension','need','value','Joy'))) = 1,
      'FV-749 FAIL: a new-month digest must count even when last month has a marker row';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Reader floor: 10 distinct markers make a cell readable once the month has
-- closed; 9 do not; the floor cannot be lowered below 10.
-- ---------------------------------------------------------------------------
begin;
  delete from public.pregame_selection_counts;
  delete from public.pregame_selection_contributors;

  set local role service_role;
  do $$
  declare i int; vals text[]; vals_low text[]; n int;
  begin
    for i in 1..10 loop
      perform public.record_pregame_selections(pg_temp.fv749_marker(), pg_temp.fv749_cur(), 'hockey',
        jsonb_build_array(jsonb_build_object('dimension','need','value','Calm')));
    end loop;
    for i in 1..9 loop
      perform public.record_pregame_selections(pg_temp.fv749_marker(), pg_temp.fv749_cur(), 'hockey',
        jsonb_build_array(jsonb_build_object('dimension','need','value','Joy')));
    end loop;

    assert (select count(*) from public.read_pregame_selection_counts()) = 0,
      'FV-749 FAIL: nothing may be readable before the month closes';

    -- Simulate the month closing: move the cells (and markers) back a month.
    update public.pregame_selection_counts set period_start = (period_start - interval '1 month')::date;
    update public.pregame_selection_contributors set period_start = (period_start - interval '1 month')::date;

    select array_agg(value order by value) into vals from public.read_pregame_selection_counts();
    assert vals = array['Calm'],
      format('FV-749 FAIL: only the 10-athlete cell may be readable, got %s', vals);

    select array_agg(value order by value) into vals_low from public.read_pregame_selection_counts(1);
    assert vals_low = vals, format('FV-749 FAIL: floor 1 returned more rows: %s', vals_low);
    select array_agg(value order by value) into vals_low from public.read_pregame_selection_counts(0);
    assert vals_low = vals, format('FV-749 FAIL: floor 0 returned more rows: %s', vals_low);
    select array_agg(value order by value) into vals_low from public.read_pregame_selection_counts(-5);
    assert vals_low = vals, format('FV-749 FAIL: negative floor returned more rows: %s', vals_low);
    select array_agg(value order by value) into vals_low from public.read_pregame_selection_counts(null);
    assert vals_low = vals, format('FV-749 FAIL: NULL floor returned more rows: %s', vals_low);

    select count(*) into n from public.read_pregame_selection_counts(11);
    assert n = 0, format('FV-749 FAIL: a caller must be able to RAISE the floor to 11, got %s rows', n);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Retention: prune_pregame_selection_totals() (and the writer, which calls it)
-- deletes old markers and closed-month cells < 10; keeps closed-month cells
-- >= 10 and all current-month rows.
-- ---------------------------------------------------------------------------
begin;
  delete from public.pregame_selection_counts;
  delete from public.pregame_selection_contributors;
  insert into public.pregame_selection_contributors (marker, period_start)
  values (pg_temp.fv749_marker(), (date_trunc('month', now() at time zone 'utc') - interval '2 months')::date),
         (pg_temp.fv749_marker(), (date_trunc('month', now() at time zone 'utc') - interval '1 month')::date),
         (pg_temp.fv749_marker(), date_trunc('month', now() at time zone 'utc')::date);
  insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count)
  values
    ((date_trunc('month', now() at time zone 'utc') - interval '1 month')::date, 'hockey', 'need', 'SmallClosed', 9),
    ((date_trunc('month', now() at time zone 'utc') - interval '1 month')::date, 'hockey', 'need', 'BigClosed',  10),
    ((date_trunc('month', now() at time zone 'utc') - interval '3 months')::date, 'hockey', 'need', 'SmallOld',   3),
    (date_trunc('month', now() at time zone 'utc')::date,                        'hockey', 'need', 'SmallOpen',   2);

  set local role service_role;
  do $$
  declare vals text[]; deleted int;
  begin
    deleted := public.prune_pregame_selection_totals();
    assert deleted = 4, format('FV-749 FAIL: prune must delete 2 markers + 2 small closed cells, reported %s', deleted);
    assert (select count(*) from public.pregame_selection_contributors) = 1,
      'FV-749 FAIL: only the current-month marker may remain';
    select array_agg(value order by value) into vals from public.pregame_selection_counts;
    assert vals = array['BigClosed','SmallOpen'],
      format('FV-749 FAIL: prune must keep closed cells >= 10 and open-month cells, got %s', vals);
    assert public.prune_pregame_selection_totals() = 0, 'FV-749 FAIL: prune must be idempotent';
  end $$;
rollback;

-- The writer prunes too (so retention happens whenever anyone completes a pregame).
begin;
  delete from public.pregame_selection_counts;
  delete from public.pregame_selection_contributors;
  insert into public.pregame_selection_contributors (marker, period_start)
  values (pg_temp.fv749_marker(), (date_trunc('month', now() at time zone 'utc') - interval '2 months')::date);
  insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count)
  values ((date_trunc('month', now() at time zone 'utc') - interval '1 month')::date, 'hockey', 'need', 'SmallClosed', 9);
  set local role service_role;
  do $$
  begin
    perform public.record_pregame_selections(pg_temp.fv749_marker(), pg_temp.fv749_cur(), 'hockey',
      jsonb_build_array(jsonb_build_object('dimension','need','value','Hope')));
    assert (select count(*) from public.pregame_selection_counts where value = 'SmallClosed') = 0,
      'FV-749 FAIL: the writer must also prune closed-month cells < 10';
    assert (select count(*) from public.pregame_selection_contributors
             where period_start < date_trunc('month', now() at time zone 'utc')::date) = 0,
      'FV-749 FAIL: the writer must also prune old markers';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Client roles: zero rows, no writes, no EXECUTE on any of the functions.
-- ---------------------------------------------------------------------------
begin;
  insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count)
  values ((date_trunc('month', now() at time zone 'utc') - interval '1 month')::date, 'hockey', 'need', 'Probe', 50);
  insert into public.pregame_selection_contributors (marker, period_start)
  values (pg_temp.fv749_marker(), current_date);
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare ok boolean; m text := repeat('b', 64);
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
      insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count)
        values (current_date, 'hockey', 'need', 'x', 1);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-724 FAIL: authenticated INSERT into counts was not denied';

    ok := false;
    begin perform public.record_pregame_selections(m, pg_temp.fv749_cur(), 'hockey', '[]'::jsonb);
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
  declare ok boolean; m text := repeat('c', 64);
  begin
    assert (select count(*) from public.pregame_selection_counts) = 0, 'FV-724 FAIL: anon can read counts';
    assert (select count(*) from public.pregame_selection_contributors) = 0, 'FV-749 FAIL: anon can read markers';

    ok := false;
    begin
      insert into public.pregame_selection_contributors (marker, period_start) values (m, current_date);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: anon INSERT into the marker table was not denied';

    ok := false;
    begin perform public.record_pregame_selections(m, pg_temp.fv749_cur(), 'hockey', '[]'::jsonb);
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
