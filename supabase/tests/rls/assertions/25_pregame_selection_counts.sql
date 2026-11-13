-- =============================================================================
-- RLS assertions — pregame_selection_counts  (FV-724 follow-up)
--
-- Monthly aggregate totals of pregame option choices (no account identifier;
-- readable only above the contributor floor). Service-role-only: RLS
-- enabled, NO policies, no client write grants. Asserts:
--   - STRUCTURAL: the column set is EXACTLY the aggregate set — no
--     athlete/user/session id and no created_at/updated_at (a row timestamp
--     would let a row be time-correlated with one athlete's event);
--   - client roles read 0 rows and cannot write (effect-based);
--   - client roles cannot EXECUTE the increment function; service_role can,
--     and the function counts per dimension, drops unknown dimensions and
--     over-long values, sums duplicates, and never stores a combination.
-- Also asserts read_pregame_selection_counts() (the ONLY sanctioned read path):
-- service-role-only EXECUTE; suppresses cells below the count floor; suppresses
-- every cell of a sport+month below the distinct-athlete floor even at high
-- counts; returns a cell when both floors hold; floors cannot be lowered below
-- 10 by the caller. Everything that writes rolls back.
-- =============================================================================

do $$
declare cols text[];
begin
  select array_agg(column_name order by column_name) into cols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'pregame_selection_counts';

  assert cols = array['dimension','period_start','selection_count','sport','value'],
    format('FV-724 FAIL: pregame_selection_counts columns drifted from the identifier-free set: %s', cols);

  assert (select relrowsecurity from pg_class where oid = 'public.pregame_selection_counts'::regclass),
    'FV-724 FAIL: pregame_selection_counts must have RLS enabled';
  assert not exists (select 1 from pg_policies
                      where schemaname = 'public' and tablename = 'pregame_selection_counts'),
    'FV-724 FAIL: pregame_selection_counts must have NO policies';
end $$;

-- service_role: write via the function, then verify behaviour. Rolled back.
begin;
  set local role service_role;
  do $$
  declare n int; total bigint; cnt bigint;
  begin
    select public.increment_pregame_selection_counts('hockey', jsonb_build_array(
      jsonb_build_object('dimension','need',          'value','Confidence'),
      jsonb_build_object('dimension','role',          'value','Goalie'),
      jsonb_build_object('dimension','positive_play', 'value','viz-a'),
      jsonb_build_object('dimension','positive_play', 'value','viz-a'),
      jsonb_build_object('dimension','cue_word',      'value','Faithful'),
      jsonb_build_object('dimension','need',          'value', repeat('x', 121)),
      jsonb_build_object('dimension','need',          'value', ''),
      jsonb_build_object('dimension','need',          'value', 5)
    )) into n;
    assert n = 3, format('FV-724 FAIL: expected 3 rows upserted (need, role, positive_play), got %s', n);

    select selection_count into cnt from public.pregame_selection_counts
     where dimension = 'positive_play' and value = 'viz-a' and sport = 'hockey';
    assert cnt = 2, format('FV-724 FAIL: duplicate pairs in one call must sum, got %s', cnt);

    -- Second call increments the same current-month rows (idempotent shape).
    perform public.increment_pregame_selection_counts('hockey',
      jsonb_build_array(jsonb_build_object('dimension','need','value','Confidence')));
    select selection_count into cnt from public.pregame_selection_counts
     where dimension = 'need' and value = 'Confidence' and sport = 'hockey';
    assert cnt = 2, format('FV-724 FAIL: second call must increment to 2, got %s', cnt);

    select count(*) into total from public.pregame_selection_counts
     where dimension = 'cue_word' or char_length(value) > 120 or value = '';
    assert total = 0, 'FV-724 FAIL: unknown dimension / bad value was stored';

    assert (select bool_and(period_start = date_trunc('month', now() at time zone 'utc')::date)
              from public.pregame_selection_counts),
      'FV-724 FAIL: period_start must be the first day of the current UTC month';

    -- Non-array / bad sport are no-ops, never errors.
    assert public.increment_pregame_selection_counts('hockey', '{"a":1}'::jsonb) = 0, 'FV-724 FAIL: non-array must be a no-op';
    assert public.increment_pregame_selection_counts('Bad Sport', '[]'::jsonb) = 0, 'FV-724 FAIL: bad sport must be a no-op';
  end $$;
rollback;

-- Read path: floors enforced in the database. Rolled back.
begin;
  do $$
  declare fk record;
  begin
    -- Test-only: lets us seed raw events for synthetic athletes. Rolled back.
    for fk in select conname from pg_constraint
               where conrelid = 'public.activity_events'::regclass and contype = 'f'
    loop
      execute format('alter table public.activity_events drop constraint %I', fk.conname);
    end loop;
  end $$;

  -- A closed month two months back: 12 distinct hockey athletes, 3 basketball.
  insert into public.activity_events (athlete_id, event_name, surface, sport, occurred_at)
  select gen_random_uuid(), 'pregame_complete', 'pregame', 'hockey',
         date_trunc('month', now() at time zone 'utc') - interval '2 months' + interval '3 days'
  from generate_series(1, 12);
  insert into public.activity_events (athlete_id, event_name, surface, sport, occurred_at)
  select gen_random_uuid(), 'pregame_complete', 'pregame', 'basketball',
         date_trunc('month', now() at time zone 'utc') - interval '2 months' + interval '3 days'
  from generate_series(1, 3);

  -- Month-grain rollup row for that month (all-sports distinct = 15).
  insert into public.activity_rollup (grain, period_start, event_name, active_athletes, event_count)
  values ('month', date_trunc('month', now() at time zone 'utc')::date - interval '2 months', 'pregame_complete', 15, 15)
  on conflict (grain, period_start, event_name) do update set active_athletes = 15;

  insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count)
  values
    ((date_trunc('month', now() at time zone 'utc') - interval '2 months')::date, 'hockey',     'need', 'AboveFloor', 50),
    ((date_trunc('month', now() at time zone 'utc') - interval '2 months')::date, 'hockey',     'need', 'BelowCount',  5),
    ((date_trunc('month', now() at time zone 'utc') - interval '2 months')::date, 'basketball', 'need', 'FewAthletes', 500),
    (date_trunc('month', now() at time zone 'utc')::date,                          'hockey',     'need', 'CurrentMonth', 500);

  set local role service_role;
  do $$
  declare vals text[]; vals_low text[]; n int;
  begin
    select array_agg(value order by value) into vals from public.read_pregame_selection_counts();
    assert vals = array['AboveFloor'],
      format('FV-724 FAIL: read path must return only the cell meeting BOTH floors, got %s', vals);

    -- Floors cannot be lowered: asking for 1/1 (or 0, or NULL) returns the same.
    select array_agg(value order by value) into vals_low from public.read_pregame_selection_counts(1, 1);
    assert vals_low = vals, format('FV-724 FAIL: floors lowered by caller returned more rows: %s', vals_low);
    select array_agg(value order by value) into vals_low from public.read_pregame_selection_counts(0, -5);
    assert vals_low = vals, format('FV-724 FAIL: non-positive floors returned more rows: %s', vals_low);
    select array_agg(value order by value) into vals_low from public.read_pregame_selection_counts(null, null);
    assert vals_low = vals, format('FV-724 FAIL: NULL floors returned more rows: %s', vals_low);

    -- Caller CAN raise the floors: 13 athletes suppresses hockey (12).
    select count(*) into n from public.read_pregame_selection_counts(13, 10);
    assert n = 0, format('FV-724 FAIL: raising the athlete floor to 13 must suppress the 12-athlete sport, got %s', n);
    select count(*) into n from public.read_pregame_selection_counts(10, 51);
    assert n = 0, format('FV-724 FAIL: raising the count floor to 51 must suppress the 50-count cell, got %s', n);
  end $$;
rollback;

-- No rollup row for the month -> nothing returned, even with high counts and
-- enough raw athletes.
begin;
  do $$
  declare fk record;
  begin
    for fk in select conname from pg_constraint
               where conrelid = 'public.activity_events'::regclass and contype = 'f'
    loop
      execute format('alter table public.activity_events drop constraint %I', fk.conname);
    end loop;
  end $$;
  insert into public.activity_events (athlete_id, event_name, surface, sport, occurred_at)
  select gen_random_uuid(), 'pregame_complete', 'pregame', 'hockey',
         date_trunc('month', now() at time zone 'utc') - interval '5 months' + interval '3 days'
  from generate_series(1, 12);
  insert into public.pregame_selection_counts (period_start, sport, dimension, value, selection_count)
  values ((date_trunc('month', now() at time zone 'utc') - interval '5 months')::date, 'hockey', 'need', 'NoRollup', 99);
  set local role service_role;
  do $$
  declare n int;
  begin
    select count(*) into n from public.read_pregame_selection_counts() where value = 'NoRollup';
    assert n = 0, 'FV-724 FAIL: a month without a rollup row must return nothing';
  end $$;
rollback;

-- authenticated + anon: zero rows visible, EXECUTE denied.
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare visible int; ok boolean := false;
  begin
    select count(*) into visible from public.pregame_selection_counts;
    assert visible = 0, format('FV-724 FAIL: authenticated can read %s pregame_selection_counts rows', visible);
    begin
      perform public.increment_pregame_selection_counts('hockey', '[]'::jsonb);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-724 FAIL: authenticated was able to EXECUTE increment_pregame_selection_counts';
    ok := false;
    begin
      perform * from public.read_pregame_selection_counts();
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-724 FAIL: authenticated was able to EXECUTE read_pregame_selection_counts';
  end $$;
rollback;

begin;
  set local role anon;
  do $$
  declare visible int; ok boolean := false;
  begin
    select count(*) into visible from public.pregame_selection_counts;
    assert visible = 0, format('FV-724 FAIL: anon can read %s pregame_selection_counts rows', visible);
    begin
      perform public.increment_pregame_selection_counts('hockey', '[]'::jsonb);
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-724 FAIL: anon was able to EXECUTE increment_pregame_selection_counts';
    ok := false;
    begin
      perform * from public.read_pregame_selection_counts();
    exception when insufficient_privilege then ok := true; end;
    assert ok, 'FV-724 FAIL: anon was able to EXECUTE read_pregame_selection_counts';
  end $$;
rollback;

\echo '  [PASS] 25_pregame_selection_counts (FV-724)'
