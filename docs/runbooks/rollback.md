# Production rollback

**Linear:** FV-731 · **Owner:** KC

One page for a bad production deploy. The app is live in the App Store and
on Google Play, so a promotion reaches every open WebView.

Who to tell: KC. If athletes cannot sign in or train, say so in the same
note — do not wait for the next digest.

## 1. Instant rollback (code only)

Vercel keeps previous production deployments.

1. Vercel → the From Victory project → Deployments.
2. Find the last production deployment that was healthy. Instant Rollback
   (or Promote, on layouts that still call it that) assigns production to
   that deployment. It does not rebuild.
3. Confirm `GET https://www.fromvictoryapp.com/api/health` returns
   `{"ok":true}` and that `/signin` loads.

This puts the previous server build back on the production domain. It does
not revert Git. The next push to `main` ships `main` again, so revert or
fix-forward the commit or the bad build returns.

## 2. Migrations do not roll back

`supabase db push` applies forward only. Instant Rollback does not run a
down migration. There is no down-migration file in this repo.

Rules when the bad deploy included a migration:

- **Additive migration** (new nullable column, new table, new index): rolling
  the code back is safe. Old code ignores the new objects. Leave the schema
  in place and fix forward.
- **Migration the new code requires** (a column the shipped server selects):
  do not roll the code back behind a schema you then revert by hand. Fix
  forward with a new migration, or roll the code back only after you are
  sure the previous code still matches the current schema.
- **Destructive migration** (drop column, drop table, rewrite rows): a code
  rollback cannot restore the data. Restoring from a Supabase point-in-time
  backup is a KC decision. Do it only with a named restore point and a plan
  for writes that landed after that point. Do not `DROP` your way backward
  from a laptop.

The 2026-06-12 login outage and FV-680 were the other direction: code went
out before the migration. Prefer that class of fix (schema first) over
trying to undo a migration in production.

## 3. Migrate before deploy

`.github/workflows/db-migrate.yml` applies `supabase/migrations/**` on push
to `main`. `vercel.json` `ignoreCommand` runs
`bin/vercel-ignore-production-build.sh`.

The gate is off until KC opts in. While it is off, Vercel still builds in
parallel with the migration job (the old race).

Turn it on in this order:

1. GitHub Actions secrets on this repo: `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
   `VERCEL_PROJECT_ID`. The org and project ids are in Vercel → Project →
   Settings. The token is a Vercel account token that can deploy that project.
2. Confirm a migration commit: the workflow's "Deploy production after
   migrations" step goes green, and the deployment is Ready (not Canceled).
3. Only then set Vercel env `FV_MIGRATE_BEFORE_DEPLOY=1` on Production.
   After that, a production git build that contains new migration files is
   skipped. The workflow applies SQL, then `vercel deploy --prod` with
   build env `FV_DEPLOY_AFTER_MIGRATE=1`, which is the signal the ignore
   script uses to build that second deploy instead of skipping it again.

Do not set `FV_DEPLOY_AFTER_MIGRATE` as a project env var. That would force
every production build through and the gate would never skip.

If step 2 shows the CLI deploy Canceled, the build env is not visible to
`ignoreCommand`. Unset `FV_MIGRATE_BEFORE_DEPLOY` so git auto-deploy keeps
shipping, and do not leave the project in the skip state.

Preview deployments are not gated (`VERCEL_ENV` is not `production`).

## 4. Skew Protection is a dashboard setting

`next.config.mjs` sets `deploymentId` from `VERCEL_DEPLOYMENT_ID` when Vercel
provides it, so a stale server-action error is detectable. The error
boundaries reload once when they see that error.

Keeping the previous deployment alive so the open WebView never hits the
error is Vercel Skew Protection: Project → Settings → Advanced. Kinny turns
that on. This repo cannot.

## 5. Afterward

- Say what rolled back (deployment id, and whether a migration was in it).
- If athletes were blocked, note the window.
- File the fix-forward as its own issue. Do not hot-patch production from a laptop.
