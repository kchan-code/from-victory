-- =============================================================================
-- RLS assertions — pregame_selection_counts  (FV-724 follow-up)
--
-- Anonymous monthly totals of pregame option choices. Service-role-only: RLS
-- enabled, NO policies, no client write grants. Asserts:
--   - STRUCTURAL anonymity: the column set is EXACTLY the aggregate set — no
--     athlete/user/session id and no created_at/updated_at (a row timestamp
--     would let a row be time-correlated with one athlete's event);
--   - client roles read 0 rows and cannot write (effect-based);
--   - client roles cannot EXECUTE the increment function; service_role can,
--     and the function counts per dimension, drops unknown dimensions and
--     over-long values, sums duplicates, and never stores a combination.
-- Everything that writes rolls back.
-- =============================================================================

do $$
declare cols text[];
begin
  select array_agg(column_name order by column_name) into cols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'pregame_selection_counts';

  assert cols = array['dimension','period_start','selection_count','sport','value'],
    format('FV-724 FAIL: pregame_selection_counts columns drifted from the anonymous set: %s', cols);

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
  end $$;
rollback;

\echo '  [PASS] 25_pregame_selection_counts (FV-724)'
