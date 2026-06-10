#!/usr/bin/env bash
# =============================================================================
# RLS verification harness runner (FV-166)
#
# Seeds fixtures, then runs every assertions/*.sql file in sorted order against
# a local Supabase Postgres. Any failed `assert` (SQLSTATE P0004) or unexpected
# error aborts immediately because psql runs with -v ON_ERROR_STOP=1, so the
# process exits non-zero and the CI job goes red.
#
# Usage:
#   supabase/tests/rls/run.sh [DB_URL]
#
# DB_URL resolution order:
#   1. first CLI argument
#   2. $DB_URL environment variable
#   3. the default local Supabase connection string
#
# In CI, pass the value of `supabase status -o env`'s DB_URL.
# =============================================================================
set -euo pipefail

# NOTE: the fallback below is the Supabase CLI's ephemeral local-only default
# (`supabase start` recreates it every run). It is NEVER a production
# credential — production never runs this harness.
DB_URL="${1:-${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PSQL=(psql "$DB_URL" -v ON_ERROR_STOP=1 --no-psqlrc --quiet)

echo "== RLS harness =="
echo "Seeding fixtures..."
"${PSQL[@]}" -f "$DIR/fixtures.sql"

echo "Running role-scoped RLS assertions:"
shopt -s nullglob
mapfile -t ASSERTIONS < <(printf '%s\n' "$DIR"/assertions/*.sql)
# Guard against a vacuous pass: an empty assertions/ dir would otherwise run
# zero checks and still report success — the exact false-green this harness
# exists to prevent. Fail loudly instead.
if [ "${#ASSERTIONS[@]}" -eq 0 ]; then
  echo "::error::No assertion files in $DIR/assertions — refusing to pass with zero checks run."
  exit 1
fi
for f in "${ASSERTIONS[@]}"; do
  "${PSQL[@]}" -f "$f"
done

echo "== RLS harness: ${#ASSERTIONS[@]} assertion file(s), ALL ASSERTIONS PASSED =="
