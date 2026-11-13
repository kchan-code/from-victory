#!/usr/bin/env bash
# =============================================================================
# FV-634 — atomic username uniqueness under CONCURRENT invite claims.
#
# The assertions/*.sql files run in one session, so they cannot prove a race.
# This script opens two real sessions:
#   1. Session 1 claims athlete C's invite with username "race_name_634" and
#      holds its transaction open (pg_sleep) before committing.
#   2. Once session 1 is visibly sleeping (pg_stat_activity), session 2 claims
#      athlete D's invite with the SAME username. It must BLOCK on the unique
#      index until session 1 commits, then fail with 23505.
# Then: exactly one profile owns the name, D's invite is still unconsumed, and
# D has no username. Uses its own throwaway rows; cleanup deletes them.
#
# Usage: 01_username_claim_race.sh DB_URL   (called by ../run.sh)
# =============================================================================
set -euo pipefail

DB_URL="$1"
PSQL=(psql "$DB_URL" -v ON_ERROR_STOP=1 --no-psqlrc --quiet -tA)

P='10000000-0000-4000-8000-000000000001'
C='20000000-0000-4000-8000-0000000006c1'
D='20000000-0000-4000-8000-0000000006c2'
HC=$(printf 'c%.0s' {1..64})
HD=$(printf 'd%.0s' {1..64})
NAME='race_name_634'
S1=""
CLEANED=0

DB_HOST="$(python3 - "$DB_URL" <<'PY'
import sys
from urllib.parse import urlparse

url = urlparse(sys.argv[1])
print(url.hostname or "")
PY
)"

case "$DB_HOST" in
  ""|localhost|127.0.0.1|::1)
    ;;
  *)
    echo "::error::FV-634 race harness refused non-local DB host '$DB_HOST'. Use localhost or 127.0.0.1."
    exit 1
    ;;
esac

cleanup() {
  if [ "$CLEANED" -eq 1 ]; then
    return
  fi
  CLEANED=1
  if [ -n "${S1:-}" ] && kill -0 "$S1" >/dev/null 2>&1; then
    kill "$S1" >/dev/null 2>&1 || true
    wait "$S1" >/dev/null 2>&1 || true
  fi
  "${PSQL[@]}" >/dev/null <<SQL || true
set role service_role;
delete from public.parent_athlete_links where parent_id = '$P' and athlete_id in ('$C', '$D');
delete from public.device_pairings where code_sha256 in ('$HC', '$HD');
delete from public.profiles where id in ('$C', '$D');
delete from auth.users where id in ('$C', '$D');
SQL
}
trap cleanup EXIT INT TERM
cleanup

"${PSQL[@]}" >/dev/null <<SQL
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('$C','authenticated','authenticated','race-c@rls.test','{}','{}',now(),now()),
       ('$D','authenticated','authenticated','race-d@rls.test','{}','{}',now(),now());
insert into public.profiles (id, role, first_name, birthdate, sport)
values ('$C','athlete','Cora',date '2010-03-03','hockey'),
       ('$D','athlete','Dani',date '2010-04-04','basketball');
insert into public.parent_athlete_links (parent_id, athlete_id) values ('$P','$C'), ('$P','$D');
set role service_role;
select 1 from public.issue_athlete_invite('$P','$C','$HC', now() + interval '7 days', now() + interval '1 day');
select 1 from public.issue_athlete_invite('$P','$D','$HD', now() + interval '7 days', now() + interval '1 day');
SQL

# Session 1: claim, then hold the transaction open for 4s before committing.
PGAPPNAME=fv634-race-1 "${PSQL[@]}" >/dev/null <<SQL &
begin;
set local role service_role;
select username from public.claim_athlete_invite('$HC', '$NAME');
select pg_sleep(4);
commit;
SQL
S1=$!

# Wait until session 1 holds the row (it is inside pg_sleep).
for _ in $(seq 1 100); do
  n=$("${PSQL[@]}" -c "select count(*) from pg_stat_activity where application_name = 'fv634-race-1' and query like '%pg_sleep%';")
  [ "$n" = "1" ] && break
  sleep 0.1
done
[ "$n" = "1" ] || { echo "::error::FV-634 race: session 1 never reached its hold point"; exit 1; }

# Session 2: same username, different athlete. Must block, then fail 23505.
start=$(date +%s)
set +e
out=$(PGAPPNAME=fv634-race-2 psql "$DB_URL" --no-psqlrc --quiet -tA -v ON_ERROR_STOP=1 \
  -c "set role service_role; select username from public.claim_athlete_invite('$HD', '$NAME');" 2>&1)
rc=$?
set -e
elapsed=$(( $(date +%s) - start ))
wait "$S1"
S1=""

if [ "$rc" -eq 0 ]; then
  echo "::error::FV-634 race FAIL: second concurrent claim of the same username SUCCEEDED: $out"; exit 1
fi
echo "$out" | grep -q "profiles_username_lower_key" \
  || { echo "::error::FV-634 race FAIL: second claim failed for the wrong reason: $out"; exit 1; }
[ "$elapsed" -ge 1 ] \
  || { echo "::error::FV-634 race FAIL: second claim did not block on the first (elapsed ${elapsed}s) — not a real race"; exit 1; }

"${PSQL[@]}" >/dev/null <<SQL
do \$\$ begin
  assert (select count(*) from public.profiles where lower(username) = '$NAME') = 1,
    'FV-634 race FAIL: username owned by more than one profile';
  assert (select username from public.profiles where id = '$C') = '$NAME',
    'FV-634 race FAIL: first claimer does not own the username';
  assert (select username from public.profiles where id = '$D') is null,
    'FV-634 race FAIL: losing athlete got a username';
  assert (select consumed_at from public.device_pairings where code_sha256 = '$HD') is null,
    'FV-634 race FAIL: losing athlete''s invite was consumed';
end \$\$;
SQL

echo "  [PASS] concurrency/01_username_claim_race (FV-634: second claim blocked ${elapsed}s, then 23505; invite kept)"

cleanup
