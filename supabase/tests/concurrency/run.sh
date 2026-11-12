#!/usr/bin/env bash
# =============================================================================
# Pending-account concurrency tests (FV-671, SSO A1; spec §13 "Destructive paths
# and concurrency (against local Postgres, not mocks)")
#
# Two REAL database connections race the §5.2 lock functions. Session A takes the
# per-user advisory lock and HOLDS it (pg_sleep before commit); session B is
# launched only after A signals it holds the lock, so B provably queues behind A
# and decides on A's committed state. Each scenario also asserts B actually waited
# (elapsed >= MIN_WAIT_MS), so a harness that silently stopped serializing would
# fail instead of passing vacuously.
#
# Scenarios
#   1. two tabs complete at once        -> one `created`, one `already_complete`
#   2. completion (A) vs cancel (B)     -> cancel is `not_pending`, nothing deleted
#   3. cancel (A) vs completion (B)     -> completion raises `account_closing`
#   4. completion (A) vs reaper_mark (B)-> `not_pending`, nothing deleted
#   5. reaper_mark (A) vs completion (B)-> `account_closing`
#   6. finalize (A) vs completion (B)   -> user deleted; completion creates NO profile
#   7. finalize (A) vs direct profile insert (B) -> no profile resurrected
#   8. established data committed while finalize waits -> `not_pending`, nothing deleted
#
# Usage:   supabase/tests/concurrency/run.sh [DB_URL]
# DB:      the local Supabase stack (`supabase start`, migrations applied).
# SKIP:    with no reachable database the script prints SKIP and exits 0 so it can
#          sit in a job that may lack Docker. Set REQUIRE_DB=1 (CI) to make an
#          unreachable DB a hard failure.
# Needs:   psql, uuidgen, python3 (millisecond clock). Works on macOS bash 3.2.
# =============================================================================
set -u

DB_URL="${1:-${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}}"
HOLD_S=3            # seconds session A holds the lock before committing
MIN_WAIT_MS=1500    # B must have been blocked at least this long

PSQL() { psql "$DB_URL" -X -q -At -v ON_ERROR_STOP=0 "$@"; }

if ! psql "$DB_URL" -X -q -At -c 'select 1' >/dev/null 2>&1; then
  if [ "${REQUIRE_DB:-}" = "1" ]; then
    echo "::error::concurrency tests: database unreachable and REQUIRE_DB=1"
    exit 1
  fi
  echo "SKIP: pending-account concurrency tests (no database reachable at the given DB_URL)"
  exit 0
fi

# The migration must be applied.
if [ "$(PSQL -c "select to_regprocedure('public.finalize_pending_deletion(uuid)') is not null")" != "t" ]; then
  echo "::error::concurrency tests: 20261112100000_fv671_pending_accounts.sql is not applied"
  exit 1
fi

WORK="$(mktemp -d)"
FAILS=0
IDS_FILE="$WORK/ids"
: > "$IDS_FILE"

cleanup() {
  # Hard-delete every user this script created (cascades profile + tombstone).
  while read -r id; do
    [ -n "$id" ] && PSQL -c "delete from auth.users where id = '$id'" >/dev/null 2>&1
  done < "$IDS_FILE"
  rm -rf "$WORK"
}
trap cleanup EXIT

fail() { echo "  FAIL: $*"; FAILS=$((FAILS + 1)); }
ok()   { echo "  ok:   $*"; }

# new_user <n> -> echoes the uuid of a fresh, confirmed email user (no profile).
new_user() {
  local id
  id="$(uuidgen | tr 'A-Z' 'a-z')"
  echo "$id" >> "$IDS_FILE"
  PSQL -c "insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
           values ('$id','authenticated','authenticated','conc-$1-${id%%-*}@rls.test', now(),
                   '{\"provider\":\"email\",\"providers\":[\"email\"]}','{}', now(), now())" >/dev/null
  echo "$id"
}

# Session preambles (inside a transaction).
as_user()    { echo "set local request.jwt.claims to '{\"sub\":\"$1\",\"role\":\"authenticated\"}'; set local role authenticated;"; }
as_service() { echo "set local role service_role;"; }

now_ms() { python3 -c 'import time; print(int(time.time()*1000))'; }

# run_a <name> <sql-body>: in the background: begin; <body>; signal; sleep; commit.
run_a() {
  local name="$1" body="$2" i=0
  (
    PSQL <<SQL > "$WORK/$name.a.out" 2>&1
begin;
$body
\\! touch "$WORK/$name.locked"
select pg_sleep($HOLD_S);
commit;
SQL
  ) &
  A_PID=$!
  while [ ! -f "$WORK/$name.locked" ]; do
    sleep 0.05
    i=$((i + 1))
    if [ $i -gt 400 ]; then
      fail "$name: session A never signalled it holds the lock"
      return 1
    fi
  done
}

# run_b <name> <sql-body>: foreground, records elapsed ms in B_MS, then joins A.
run_b() {
  local name="$1" body="$2" t0 t1
  t0="$(now_ms)"
  PSQL <<SQL > "$WORK/$name.b.out" 2>&1
begin;
$body
commit;
SQL
  t1="$(now_ms)"
  B_MS=$((t1 - t0))
  wait "$A_PID"
}

# First non-empty scalar line of an output file (ignores BEGIN/COMMIT/SET echoes).
result_of() { grep -v '^$' "$1" | grep -v -E '^(BEGIN|COMMIT|SET)$' | tr '\n' ' ' | sed 's/ *$//'; }

expect_wait() {
  if [ "$B_MS" -lt "$MIN_WAIT_MS" ]; then
    fail "$1: session B was not serialized behind A (waited ${B_MS}ms < ${MIN_WAIT_MS}ms)"
  else
    ok "$1: B queued behind A (${B_MS}ms)"
  fi
}
expect_eq() { # <label> <got> <want>
  if [ "$2" = "$3" ]; then ok "$1 = $3"; else fail "$1: got '$2', want '$3'"; fi
}
expect_closing() { # <name>
  if grep -q "account_closing" "$WORK/$1.b.out"; then
    ok "completion raised account_closing"
  else
    fail "$1: completion did not raise account_closing: $(result_of "$WORK/$1.b.out")"
  fi
}
q() { PSQL -c "$1"; }
tombstone() { PSQL -c "insert into private.pending_account_deletions (user_id, reason) values ('$1','cancel')" >/dev/null; }

echo "== pending-account concurrency tests =="

# ---- 1. two tabs complete at the same time ---------------------------------
echo "[1] two tabs complete at once"
U="$(new_user 1)"
run_a s1 "$(as_user "$U") select public.complete_pending_profile('parent','Tab A');"
run_b s1 "$(as_user "$U") select public.complete_pending_profile('parent','Tab B');"
expect_wait s1
expect_eq "first completion"  "$(result_of "$WORK/s1.a.out")" "created"
expect_eq "second completion" "$(result_of "$WORK/s1.b.out")" "already_complete"
expect_eq "profile rows"      "$(q "select count(*) from public.profiles where id='$U'")" "1"
expect_eq "user still exists" "$(q "select count(*) from auth.users where id='$U'")" "1"

# ---- 2. completion first, cancel second ------------------------------------
echo "[2] completion (A) vs cancel (B)"
U="$(new_user 2)"
run_a s2 "$(as_user "$U") select public.complete_pending_profile('parent','P');"
run_b s2 "$(as_user "$U") select public.cancel_my_pending_account();"
expect_wait s2
expect_eq "completion" "$(result_of "$WORK/s2.a.out")" "created"
expect_eq "cancel"     "$(result_of "$WORK/s2.b.out")" "not_pending"
expect_eq "tombstones" "$(q "select count(*) from private.pending_account_deletions where user_id='$U'")" "0"
expect_eq "profile + user kept" "$(q "select (select count(*) from public.profiles where id='$U') + (select count(*) from auth.users where id='$U')")" "2"

# ---- 3. cancel first, completion second ------------------------------------
echo "[3] cancel (A) vs completion (B)"
U="$(new_user 3)"
run_a s3 "$(as_user "$U") select public.cancel_my_pending_account();"
run_b s3 "$(as_user "$U") select public.complete_pending_profile('parent','P');"
expect_wait s3
expect_eq "cancel" "$(result_of "$WORK/s3.a.out")" "marked"
expect_closing s3
expect_eq "profile rows" "$(q "select count(*) from public.profiles where id='$U'")" "0"
expect_eq "tombstone kept for finalize" "$(q "select reason from private.pending_account_deletions where user_id='$U'")" "cancel"

# ---- 4. completion first, reaper second ------------------------------------
echo "[4] completion (A) vs reaper_mark (B)"
U="$(new_user 4)"
run_a s4 "$(as_user "$U") select public.complete_pending_profile('parent','P');"
run_b s4 "$(as_service) select public.reaper_mark('$U');"
expect_wait s4
expect_eq "completion"  "$(result_of "$WORK/s4.a.out")" "created"
expect_eq "reaper_mark" "$(result_of "$WORK/s4.b.out")" "not_pending"
expect_eq "profile + user kept" "$(q "select (select count(*) from public.profiles where id='$U') + (select count(*) from auth.users where id='$U')")" "2"

# ---- 5. reaper first, completion second ------------------------------------
echo "[5] reaper_mark (A) vs completion (B)"
U="$(new_user 5)"
run_a s5 "$(as_service) select public.reaper_mark('$U');"
run_b s5 "$(as_user "$U") select public.complete_pending_profile('parent','P');"
expect_wait s5
expect_eq "reaper_mark" "$(result_of "$WORK/s5.a.out")" "marked"
expect_closing s5
expect_eq "profile rows" "$(q "select count(*) from public.profiles where id='$U'")" "0"

# ---- 6. finalize (holding the lock) vs completion ---------------------------
echo "[6] finalize (A) vs completion (B)"
U="$(new_user 6)"
tombstone "$U"
run_a s6 "$(as_service) select public.finalize_pending_deletion('$U');"
run_b s6 "$(as_user "$U") select public.complete_pending_profile('parent','P');"
expect_wait s6
expect_eq "finalize" "$(result_of "$WORK/s6.a.out")" "deleted"
expect_eq "no profile resurrected" "$(q "select count(*) from public.profiles where id='$U'")" "0"
expect_eq "user gone" "$(q "select count(*) from auth.users where id='$U'")" "0"

# ---- 7. finalize vs a DIRECT profile insert (profiles_insert_own path) -------
echo "[7] finalize (A) vs direct profile insert (B)"
U="$(new_user 7)"
tombstone "$U"
run_a s7 "$(as_service) select public.finalize_pending_deletion('$U');"
run_b s7 "insert into public.profiles (id, role, first_name) values ('$U','parent','Direct');"
expect_wait s7
expect_eq "finalize" "$(result_of "$WORK/s7.a.out")" "deleted"
expect_eq "no profile resurrected" "$(q "select count(*) from public.profiles where id='$U'")" "0"

# ---- 8. established data committed while finalize waits ----------------------
echo "[8] data appears after the tombstone, before finalize"
U="$(new_user 8)"
tombstone "$U"
# A models a path that establishes the account while holding the user lock (the
# profile insert is refused while tombstoned, so A drops the tombstone first, as
# the not_pending path would, inserts the profile, and leaves a tombstone behind
# to model the stale marker finalize then has to re-check). finalize queues
# behind A and must see the committed profile.
run_a s8 "select pg_advisory_xact_lock(hashtextextended('$U', 0));
delete from private.pending_account_deletions where user_id = '$U';
insert into public.profiles (id, role, first_name) values ('$U','parent','Late');
insert into private.pending_account_deletions (user_id, reason) values ('$U','reaper') on conflict do nothing;"
run_b s8 "$(as_service) select public.finalize_pending_deletion('$U');"
expect_wait s8
expect_eq "finalize" "$(result_of "$WORK/s8.b.out")" "not_pending"
expect_eq "user + profile kept" "$(q "select (select count(*) from public.profiles where id='$U') + (select count(*) from auth.users where id='$U')")" "2"
expect_eq "tombstone dropped" "$(q "select count(*) from private.pending_account_deletions where user_id='$U'")" "0"

echo
if [ "$FAILS" -ne 0 ]; then
  echo "== pending-account concurrency tests: $FAILS FAILURE(S) =="
  exit 1
fi
echo "== pending-account concurrency tests: ALL PASSED =="
