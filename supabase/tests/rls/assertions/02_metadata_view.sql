-- =============================================================================
-- RLS assertions — athlete_session_metadata view  (FV-166 AC c)
--
-- (c) the view returns aggregates only — no journal/content columns reachable.
--
-- Two layers:
--   c.1 STRUCTURAL — pin the view's exact column set. If a future migration
--       adds a content-bearing column to the view, this fails. This is the
--       seam FV-171's column-restriction assertions extend.
--   c.2 BEHAVIOURAL — parent P (linked to A only) reads aggregate rows for A
--       and nothing else; athlete A reads their own aggregate; the values are
--       counts/timestamps, never content.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- c.1 Structural: the view exposes EXACTLY the aggregate columns, no more.
--     Runs as superuser (catalog introspection needs no role switch).
-- ---------------------------------------------------------------------------
do $$
declare
  cols text[];
begin
  select array_agg(column_name order by column_name) into cols
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'athlete_session_metadata';

  assert cols = array['athlete_id','last_completed_at','sessions_completed','sessions_started'],
    format('AC(c) FAIL: athlete_session_metadata columns drifted from aggregate-only set: %s', cols);
end $$;

-- ---------------------------------------------------------------------------
-- c.2 Behavioural: parent P sees ONLY linked athlete A's aggregate row.
--     (security_invoker=true → RLS on athlete_sessions applies to the view.)
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    rows_seen int;
    started   int;
    completed int;
  begin
    select count(*) into rows_seen from public.athlete_session_metadata;
    assert rows_seen = 1,
      format('AC(c) FAIL: parent should see exactly 1 athlete aggregate (A), saw %s', rows_seen);

    select sessions_started, sessions_completed
      into started, completed
      from public.athlete_session_metadata
      where athlete_id = '20000000-0000-4000-8000-00000000000a';
    assert started = 1,
      format('AC(c) FAIL: athlete A sessions_started expected 1, got %s', started);
    assert completed = 1,
      format('AC(c) FAIL: athlete A sessions_completed expected 1, got %s', completed);

    -- Parent must NOT see unlinked athlete B's aggregate.
    select count(*) into rows_seen
      from public.athlete_session_metadata
      where athlete_id = '20000000-0000-4000-8000-00000000000b';
    assert rows_seen = 0,
      'AC(c) FAIL: parent can see aggregates for an UNLINKED athlete (B)';
  end $$;
rollback;

-- ---------------------------------------------------------------------------
-- c.2b Behavioural: athlete A sees only their own aggregate via the view.
-- ---------------------------------------------------------------------------
begin;
  set local request.jwt.claims to '{"sub":"20000000-0000-4000-8000-00000000000a","role":"authenticated"}';
  set local role authenticated;
  do $$
  declare
    rows_seen int;
  begin
    select count(*) into rows_seen from public.athlete_session_metadata;
    assert rows_seen = 1,
      format('AC(c) FAIL: athlete A should see exactly their own aggregate, saw %s', rows_seen);
  end $$;
rollback;

\echo '  [PASS] 02_metadata_view (AC c)'
