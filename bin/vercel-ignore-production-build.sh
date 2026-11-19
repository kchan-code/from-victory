#!/usr/bin/env bash
# FV-731 / FV-777 — Vercel ignoreCommand (see vercel.json).
#
# Exit 0 = skip this build.
# Exit 1 (or any non-zero) = build.
# Vercel treats 0 as "Ignored" and anything else as "proceed". Do not invert these.
#
# vercel.json runs this from the project root. That root is apps/web, so the
# command tries bin/ (repo root) and ../../bin/ (apps/web). A missing file is
# exit 127, which Vercel records as a failed deployment, not as "build".
#
# The rule, in full:
#   - Not a production build (preview, development): build.
#   - FV_DEPLOY_AFTER_MIGRATE=1 (the deploy db-migrate.yml runs): build.
#   - FV_MIGRATE_BEFORE_DEPLOY is not 1 on the Vercel project: build. This is
#     the legacy behaviour, where Vercel's git integration deploys every push
#     and can race the migration job.
#   - Otherwise (production, flag on, not the workflow's deploy): SKIP. Always.
#
# With the flag on, EVERY production deploy comes from the db-migrate workflow,
# including commits that touch no migration. Vercel's git integration never
# builds production. The workflow runs on every push to main, one run at a
# time: it applies pending migrations, then runs
# `vercel deploy --prod --build-env FV_DEPLOY_AFTER_MIGRATE=1`.
#
# This script does not look at git. An earlier version skipped only when the
# pushed commit itself changed supabase/migrations. That let a plain commit
# pushed right after a migration commit build on the git lane while the
# migration was still pending or had failed, shipping the migration commit's
# code ahead of its schema. Only a single ordered lane closes that.
#
# The flag stays off until GitHub has VERCEL_TOKEN, VERCEL_ORG_ID, and
# VERCEL_PROJECT_ID. With the flag on and those secrets missing, nothing
# deploys to production at all. Do not set FV_DEPLOY_AFTER_MIGRATE in the
# Vercel project settings or the gate never skips. See docs/runbooks/rollback.md.

set -euo pipefail

if [ "${VERCEL_ENV:-}" != "production" ]; then
  exit 1
fi

if [ "${FV_DEPLOY_AFTER_MIGRATE:-}" = "1" ]; then
  echo "FV migrate-before-deploy: deploy from the db-migrate workflow. Building."
  exit 1
fi

if [ "${FV_MIGRATE_BEFORE_DEPLOY:-}" != "1" ]; then
  exit 1
fi

echo "FV migrate-before-deploy: Skipping this production build. With FV_MIGRATE_BEFORE_DEPLOY=1, production is deployed only by the db-migrate workflow, after migrations apply."
exit 0
