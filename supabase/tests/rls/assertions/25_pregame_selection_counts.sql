-- =============================================================================
-- RLS assertions — pregame_selection_counts + pregame_selection_contributors
-- (FV-724 follow-up, reworked for FV-749)
--
-- selection_count is a count of DISTINCT ATHLETES: record_pregame_selections()
-- counts each athlete at most once per UTC month (first pregame of the month),
-- using a marker table (athlete_id, period_start) and nothing else.
-- read_pregame_selection_counts() is the ONLY sanctioned read path: closed
-- months only, cells with count >= greatest(p_min_athletes, 10).
--
-- Both tables are service-role-only: RLS enabled, NO policies, no client write
-- grants. Everything that writes rolls back. Tests that need many synthetic
-- athletes drop the marker FK to profiles INSIDE the rolled-back transaction;
-- the real FK + ON DELETE CASCADE is asserted separately (metadata + effect).
-- NOT covered here: a true two-connection race (the guarantee rests on the
-- marker's primary-key unique index; see the migration header).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Structure.
-- ---------------------------------------------------------------------------
do $$
declare cols text[]; mcols text[]; fk record;
begin
  select array_agg(column_name order by column_name) into cols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'pregame_selection_counts';
  assert cols = array['dimension','period_start','selection_count','sport','value'],
    format('FV-724 FAIL: pregame_selection_counts columns drifted from the identifier-free set: %s', cols);

  select array_agg(column_name order by column_name) into mcols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'pregame_selection_contributors';
  assert mcols = array['athlete_id','period_start'],
    format('FV-749 FAIL: pregame_selection_contributors must hold ONLY (athlete_id, period_start), got %s', mcols);

  assert (select relrowsecurity from pg_class where oid = 'public.pregame_selection_counts'::regclass),
    'FV-724 FAIL: pregame_selection_counts must have RLS enabled';
  assert (select relrowsecurity from pg_class where oid = 'public.pregame_selection_contributors'::regclass),
    'FV-749 FAIL: pregame_selection_contributors must have RLS enabled';
  assert not exists (select 1 from pg_policies
                      where schemaname = 'public'
                        and tablename in ('pregame_selection_counts', 'pregame_selection_contributors')),
    'FV-724/749 FAIL: the selection tables must have NO policies';

  select * into fk from pg_constraint
   where conrelid = 'public.pregame_selection_contributors'::regclass and contype = 'f';
  assert fk.confrelid = 'public.profiles'::regclass and fk.confdeltype = 'c',
    'FV-749 FAIL: marker athlete_id must reference public.profiles ON DELETE CASCADE';

  assert to_regprocedure('public.increment_pregame_selection_counts(text, jsonb)') is null,
    'FV-749 FAIL: the old increment_pregame_selection_counts must be dropped';
  assert to_regprocedure('public.read_pregame_selection_counts(integer, integer)') is null,
    'FV-749 FAIL: the old two-argument reader must be dropped';
end $$;

-- ---------------------------------------------------------------------------
-- Writer: once per athlete per UTC month.
-- ---------------------------------------------------------------------------
begin;
  do $$
  declare fk record;
  begin
    for fk in select conname from pg_constraint
               where conrelid = 'public.pregame_selection_contributors'::regclass and contype = 'f'
    loop
      execute format('alter table public.pregame_selection_contributors drop constraint %I', fk.conname);
    end loop;
  end $$;
  delete from public.pregame_selection_counts;

  set local role service_role;
  do $$
  declare
    x uuid := gen_random_uuid();
    y uuid := gen_random_uuid();
    n int; cnt bigint; markers int;
    cur date := date_trunc('month', now() at time zone 'utc')::date;
  begin
    -- First call: +1 per distinct cell, duplicate pair in one call adds 1, bad
    -- entries dropped, plus exactly one marker.
    select public.record_pregame_selections(x, 'hockey', jsonb_build_array(
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
     where athlete_id = x and period_start = cur;
    assert markers = 1, 'FV-749 FAIL: first call must record exactly one marker';
    assert (select count(*) from public.pregame_selection_counts
             where dimension = 'cue_word' or char_length(value) > 120 or value = '' or value = '5') = 0,
      'FV-724 FAIL: unknown dimension / bad value was stored';

    -- Second call, same athlete, same month, DIFFERENT selections: nothing.
    select public.record_pregame_selections(x, 'hockey', jsonb_build_array(
      jsonb_build_object('dimension','need','value','Calm'),
      jsonb_build_object('dimension','need','value','Confidence'))) into n;
    assert n = 0, format('FV-749 FAIL: second call in the month must return 0, got %s', n);
    assert (select count(*) from public.pregame_selection_counts where value = 'Calm') = 0,
      'FV-749 FAIL: second call in the month wrote a cell';
    select selection_count into cnt from public.pregame_selection_counts
     where dimension = 'need' and value = 'Confidence' and sport = 'hockey' and period_start = cur;
    assert cnt = 1, format('FV-749 FAIL: second call incremented Confidence to %s', cnt);
    select count(*) into markers from public.pregame_selection_contributors where athlete_id = x;
    assert markers = 1, 'FV-749 FAIL: marker duplicated';

    -- A different athlete adds +1 to the same cell.
    select public.record_pregame_selections(y, 'hockey', jsonb_build_array(
      jsonb_build_object('dimension','need','value','Confidence'))) into n;
    assert n = 1, format('FV-749 FAIL: a different athlete must write 1 cell, got %s', n);
    select selection_count into cnt from public.pregame_selection_counts
     where dimension = 'need' and value = 'Confidence' and sport = 'hockey' and period_start = cur;
    assert cnt = 2, format('FV-749 FAIL: two distinct athletes must give 2, got %s', cnt);

    -- Invalid input is a no-op, never an error, and never writes a marker.
    assert public.record_pregame_selections(null, 'hockey', '[]'::jsonb) = 0, 'FV-749 FAIL: null athlete must be a no-op';
    assert public.record_pregame_selections(gen_random_uuid(), 'Bad Sport', '[]'::jsonb) = 0, 'FV-749 FAIL: bad sport must be a no-op';
    assert public.record_pregame_selections(gen_random_uuid(), 'hockey', '{"a":1}'::jsonb) = 0, 'FV-749 FAIL: non-array must be a no-op';
    assert (select count(*) from public.pregame_selection_contributors) = 2,
      'FV-749 FAIL: invalid input must not record a marker';

    -- The count table never carries an athlete id (structure) and the current
    -- month is never readable, however high the count.
    update public.pregame_selection_counts set selection_count = 500;
    assert (select count(*) from public.read_pregame_selection_counts()) = 0,
      'FV-749 FAIL: the current (open) month must never be readable';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Reader floor: 10 distinct athletes make a cell readable once the month has
-- closed; 9 do not; the floor cannot be lowered below 10.
-- ---------------------------------------------------------------------------
begin;
  do $$
  declare fk record;
  begin
    for fk in select conname from pg_constraint
               where conrelid = 'public.pregame_selection_contributors'::regclass and contype = 'f'
    loop
      execute format('alter table public.pregame_selection_contributors drop constraint %I', fk.conname);
    end loop;
  end $$;
  delete from public.pregame_selection_counts;

  set local role service_role;
  do $$
  declare i int; vals text[]; vals_low text[]; n int;
  begin
    for i in 1..10 loop
      perform public.record_pregame_selections(gen_random_uuid(), 'hockey',
        jsonb_build_array(jsonb_build_object('dimension','need','value','Calm')));
    end loop;
    for i in 1..9 loop
      perform public.record_pregame_selections(gen_random_uuid(), 'hockey',
        jsonb_build_array(jsonb_build_object('dimension','need','value','Joy')));
    end loop;

    -- Still the open month: nothing readable.
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
-- Housekeeping on every call: old markers deleted; closed-month cells < 10
-- deleted; closed-month cells >= 10 kept; current month untouched.
-- ---------------------------------------------------------------------------
begin;
  do $$
  declare fk record;
  begin
    for fk in select conname from pg_constraint
               where conrelid = 'public.pregame_selection_contributors'::regclass and contype = 'f'
    loop
      execute format('alter table public.pregame_selection_contributors drop constraint %I', fk.conname);
    end loop;
  end $$;
  delete from public.pregame_selection_counts;

  insert into public.pregame_selection_contributors (athlete_id, period_start)
  values (gen_random_uuid(), (date_trunc('month', now() at time zone 'utc') - interval '2 months')::date),
         (gen_random_uuid(), (date_trunc('month', now() at time zone 'utc') - interval '1 month')::date);
  insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count)
  values
    ((date_trunc('month', now() at time zone 'utc') - interval '1 month')::date, 'hockey', 'need', 'SmallClosed', 9),
    ((date_trunc('month', now() at time zone 'utc') - interval '1 month')::date, 'hockey', 'need', 'BigClosed',  10),
    ((date_trunc('month', now() at time zone 'utc') - interval '3 months')::date, 'hockey', 'need', 'SmallOld',   3),
    (date_trunc('month', now() at time zone 'utc')::date,                        'hockey', 'need', 'SmallOpen',   2);

  set local role service_role;
  do $$
  declare newbie uuid := gen_random_uuid(); vals text[];
  begin
    perform public.record_pregame_selections(newbie, 'hockey',
      jsonb_build_array(jsonb_build_object('dimension','need','value','Hope')));

    assert (select count(*) from public.pregame_selection_contributors
             where period_start < date_trunc('month', now() at time zone 'utc')::date) = 0,
      'FV-749 FAIL: markers before the current month must be deleted';
    assert (select count(*) from public.pregame_selection_contributors where athlete_id = newbie) = 1,
      'FV-749 FAIL: the current-month marker must be kept';

    select array_agg(value order by value) into vals from public.pregame_selection_counts;
    assert vals = array['BigClosed','Hope','SmallOpen'],
      format('FV-749 FAIL: housekeeping must drop closed cells < 10 and keep >= 10 and open-month cells, got %s', vals);
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Marker rows cascade when the profile is deleted (effect). Uses the real FK
-- and a fixture profile; skipped with a notice if the fixture is absent.
-- ---------------------------------------------------------------------------
begin;
  do $$
  declare aa constant uuid := '70000000-0000-4000-8000-000000000001';
  begin
    if not exists (select 1 from public.profiles where id = aa) then
      raise notice '[diag] 25_pregame_selection_counts: fixture profile missing, cascade effect test skipped';
      return;
    end if;
    perform public.record_pregame_selections(aa, 'golf',
      jsonb_build_array(jsonb_build_object('dimension','need','value','Calm')));
    assert (select count(*) from public.pregame_selection_contributors where athlete_id = aa) = 1,
      'FV-749 FAIL: marker was not recorded for a real profile';
    delete from public.profiles where id = aa;
    assert (select count(*) from public.pregame_selection_contributors where athlete_id = aa) = 0,
      'FV-749 FAIL: marker did not cascade when the profile was deleted';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- Client roles: zero rows, no writes, no EXECUTE on either function.
-- ---------------------------------------------------------------------------
begin;
  insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count)
  values ((date_trunc('month', now() at time zone 'utc') - interval '1 month')::date, 'hockey', 'need', 'Probe', 50);
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare ok boolean;
  begin
    assert (select count(*) from public.pregame_selection_counts) = 0, 'FV-724 FAIL: authenticated can read counts';
    assert (select count(*) from public.pregame_selection_contributors) = 0, 'FV-749 FAIL: authenticated can read markers';

    ok := false;
    begin
      insert into public.pregame_selection_contributors (athlete_id, period_start)
        values ('20000000-0000-4000-8000-00000000000a', current_date);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: authenticated INSERT into the marker table was not denied';

    ok := false;
    begin
      insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count)
        values (current_date, 'hockey', 'need', 'x', 1);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-724 FAIL: authenticated INSERT into counts was not denied';

    ok := false;
    begin
      perform public.record_pregame_selections('20000000-0000-4000-8000-00000000000a', 'hockey', '[]'::jsonb);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: authenticated was able to EXECUTE record_pregame_selections';

    ok := false;
    begin
      perform * from public.read_pregame_selection_counts();
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: authenticated was able to EXECUTE read_pregame_selection_counts';
  end $$;
rollback;

begin;
  set local role anon;
  do $$
  declare ok boolean;
  begin
    assert (select count(*) from public.pregame_selection_counts) = 0, 'FV-724 FAIL: anon can read counts';
    assert (select count(*) from public.pregame_selection_contributors) = 0, 'FV-749 FAIL: anon can read markers';

    ok := false;
    begin
      insert into public.pregame_selection_contributors (athlete_id, period_start)
        values (gen_random_uuid(), current_date);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: anon INSERT into the marker table was not denied';

    ok := false;
    begin
      perform public.record_pregame_selections(gen_random_uuid(), 'hockey', '[]'::jsonb);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: anon was able to EXECUTE record_pregame_selections';

    ok := false;
    begin
      perform * from public.read_pregame_selection_counts();
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-749 FAIL: anon was able to EXECUTE read_pregame_selection_counts';
  end $$;
rollback;

\echo '  [PASS] 25_pregame_selection_counts (FV-724, FV-749)'
