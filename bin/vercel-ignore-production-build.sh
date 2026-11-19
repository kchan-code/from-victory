#!/usr/bin/env bash
# FV-731 — Vercel ignoreCommand (see vercel.json).
#
# Exit 0 = skip this automatic build.
# Exit 1 (or any non-zero) = build.
# Vercel treats 0 as "Ignored" and anything else as "proceed". Do not invert these.
#
# vercel.json runs this from the project root. That root is apps/web, so the
# command tries bin/ (repo root) and ../../bin/ (apps/web). A missing file is
# exit 127, which Vercel records as a failed deployment, not as "build".
#
# Production builds are skipped only when ALL of these are true:
#   1. VERCEL_ENV=production
#   2. This is not the post-migration deploy (FV_DEPLOY_AFTER_MIGRATE!=1)
#   3. The opt-in flag FV_MIGRATE_BEFORE_DEPLOY=1 is set on the Vercel project
#   4. The commit being built changes supabase/migrations itself
#      (diff of its first parent against it)
#
# The decision reads the pushed commit only, never VERCEL_GIT_PREVIOUS_SHA.
# That SHA is the last successful GIT deployment. The CLI deploy that
# db-migrate.yml runs does not advance it, so after one skipped migration
# commit a previous-SHA diff still contained that migration and every later
# push was skipped too, with nothing left to deploy it (2026-11-19).
#
# Known limitation: main takes squash merges, one commit per push. A push of
# several commits whose tip has no migration but an earlier commit does is
# built right away while db-migrate also runs (the pre-FV-731 race), and
# db-migrate then deploys again.
#
# The flag stays off until GitHub has VERCEL_TOKEN, VERCEL_ORG_ID, and
# VERCEL_PROJECT_ID. Skipping without those secrets strands the commit:
# nothing else promotes it. db-migrate.yml applies the schema, then
# `vercel deploy --prod --build-env FV_DEPLOY_AFTER_MIGRATE=1`. That env is
# what lets the second deploy through this script. Do not set
# FV_DEPLOY_AFTER_MIGRATE in the Vercel project settings or the gate never
# skips. See docs/runbooks/rollback.md.

set -euo pipefail

if [ "${VERCEL_ENV:-}" != "production" ]; then
  exit 1
fi

if [ "${FV_DEPLOY_AFTER_MIGRATE:-}" = "1" ]; then
  echo "FV migrate-before-deploy: post-migration deploy. Building."
  exit 1
fi

if [ "${FV_MIGRATE_BEFORE_DEPLOY:-}" != "1" ]; then
  exit 1
fi

CUR="${VERCEL_GIT_COMMIT_SHA:-}"
if [ -z "$CUR" ]; then
  echo "FV migrate-before-deploy: missing git SHA. Building (fail open)."
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! git -C "$ROOT" cat-file -e "${CUR}^{commit}" 2>/dev/null; then
  git -C "$ROOT" fetch --no-tags --depth=50 origin "$CUR" || true
fi
# A shallow clone can end at CUR, which leaves its parent out.
if ! git -C "$ROOT" cat-file -e "${CUR}^1^{commit}" 2>/dev/null; then
  git -C "$ROOT" fetch --no-tags --depth=2 origin "$CUR" || true
fi
if ! git -C "$ROOT" cat-file -e "${CUR}^{commit}" 2>/dev/null \
  || ! git -C "$ROOT" cat-file -e "${CUR}^1^{commit}" 2>/dev/null; then
  echo "FV migrate-before-deploy: commit or its parent not available. Building (fail open)."
  exit 1
fi

if git -C "$ROOT" diff --name-only "${CUR}^1" "$CUR" | grep -q '^supabase/migrations/'; then
  echo "FV migrate-before-deploy: this commit changes supabase/migrations. Skipping the automatic production build so db-migrate can apply schema first."
  exit 0
fi

exit 1
