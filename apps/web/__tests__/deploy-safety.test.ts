import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const SCRIPT = path.join(REPO_ROOT, "bin/vercel-ignore-production-build.sh");
const WORKFLOW = path.join(REPO_ROOT, ".github/workflows/db-migrate.yml");

function run(
  args: string[],
  cwd: string,
  env: Record<string, string>,
): { status: number | null; stdout: string } {
  const result = spawnSync("bash", args, {
    cwd,
    env: {
      PATH: process.env.PATH ?? "",
      HOME: process.env.HOME ?? "",
      ...env,
    } as unknown as NodeJS.ProcessEnv,
    encoding: "utf8",
  });
  return { status: result.status, stdout: result.stdout ?? "" };
}

function runIgnore(env: Record<string, string>) {
  return run([SCRIPT], REPO_ROOT, env);
}

// The text of one workflow step, from its `- name:` line to the next step.
function step(workflow: string, name: string): string {
  const start = workflow.indexOf(`      - name: ${name}\n`);
  expect(start, `step "${name}" exists`).toBeGreaterThan(-1);
  const next = workflow.indexOf("\n      - ", start + 1);
  return workflow.slice(start, next === -1 ? undefined : next);
}

describe("migrate-before-deploy gate (FV-731, FV-777)", () => {
  it("skips every production build from the git lane when the flag is on", () => {
    // The script never reads the commit, so the answer is the same for a
    // migration commit M, a plain commit N pushed while M's migration is
    // pending or failed, a missing SHA, or an unknown one. N cannot ship
    // M's code ahead of its schema because the git lane never builds N.
    const base = { VERCEL_ENV: "production", FV_MIGRATE_BEFORE_DEPLOY: "1" };
    const commits: Record<string, string>[] = [
      {},
      { VERCEL_GIT_COMMIT_SHA: "0".repeat(40) },
      { VERCEL_GIT_COMMIT_SHA: "a".repeat(40), VERCEL_GIT_PREVIOUS_SHA: "b".repeat(40) },
    ];
    for (const commit of commits) {
      const result = runIgnore({ ...base, ...commit });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Skipping");
    }
  });

  it("does not inspect git at all", () => {
    const code = readFileSync(SCRIPT, "utf8")
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("#"))
      .join("\n");
    expect(code).not.toMatch(/\bgit\b/);
    expect(code).not.toContain("grep");
    expect(code).not.toContain("VERCEL_GIT_");
  });

  it("builds the deploy that the db-migrate workflow runs", () => {
    const result = runIgnore({
      VERCEL_ENV: "production",
      FV_MIGRATE_BEFORE_DEPLOY: "1",
      FV_DEPLOY_AFTER_MIGRATE: "1",
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("db-migrate workflow");
    expect(result.stdout).not.toContain("Skipping");
  });

  it("builds production when the opt-in flag is unset or not 1", () => {
    expect(runIgnore({ VERCEL_ENV: "production" }).status).toBe(1);
    expect(runIgnore({ VERCEL_ENV: "production", FV_MIGRATE_BEFORE_DEPLOY: "0" }).status).toBe(1);
    expect(runIgnore({ VERCEL_ENV: "production", FV_MIGRATE_BEFORE_DEPLOY: "" }).status).toBe(1);
  });

  it("builds previews and other non-production environments", () => {
    expect(runIgnore({ VERCEL_ENV: "preview", FV_MIGRATE_BEFORE_DEPLOY: "1" }).status).toBe(1);
    expect(runIgnore({ VERCEL_ENV: "development", FV_MIGRATE_BEFORE_DEPLOY: "1" }).status).toBe(1);
    expect(runIgnore({ FV_MIGRATE_BEFORE_DEPLOY: "1" }).status).toBe(1);
  });

  it("finds the script when Vercel runs the command from apps/web or the repo root", () => {
    const vercel = readFileSync(path.join(REPO_ROOT, "vercel.json"), "utf8");
    // The Vercel project root is apps/web, so the command must also find the
    // script two directories up. A missing script is exit 127, which Vercel
    // treats as a failed deployment rather than "build".
    expect(vercel).toContain("bash bin/vercel-ignore-production-build.sh");
    expect(vercel).toContain("../../bin/vercel-ignore-production-build.sh");
    const command = JSON.parse(vercel).ignoreCommand as string;
    expect(command.length).toBeLessThanOrEqual(256);

    const skip = { VERCEL_ENV: "production", FV_MIGRATE_BEFORE_DEPLOY: "1" };
    for (const cwd of [REPO_ROOT, path.join(REPO_ROOT, "apps/web")]) {
      // Preview exits 1 ("build"). Exit 0 with the skip text proves the
      // script itself ran, not the command's own `else exit 1` fallback.
      expect(run(["-c", command], cwd, { VERCEL_ENV: "preview" }).status).toBe(1);
      const skipped = run(["-c", command], cwd, skip);
      expect(skipped.status).toBe(0);
      expect(skipped.stdout).toContain("Skipping");
    }
  });

  it("keeps vercel.json in apps/web, where Vercel reads cron jobs from (FV-785)", () => {
    // The Vercel project root is apps/web. Vercel registers `crons` only from
    // the vercel.json in that directory. With the file only at the repo root,
    // production had no cron jobs at all. The repo-root copy stays because the
    // db-migrate workflow runs `vercel deploy` from the repo root. The two
    // copies must not drift.
    const rootCopy = readFileSync(path.join(REPO_ROOT, "vercel.json"), "utf8");
    const appCopy = readFileSync(path.join(REPO_ROOT, "apps/web/vercel.json"), "utf8");
    expect(appCopy).toBe(rootCopy);

    const crons = (JSON.parse(appCopy).crons ?? []) as { path: string; schedule: string }[];
    const cronDir = path.join(REPO_ROOT, "apps/web/app/api/cron");
    const routes = readdirSync(cronDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `/api/cron/${entry.name}`)
      .sort();
    // Every cron route is scheduled, and every schedule has a route.
    expect(crons.map((cron) => cron.path).sort()).toEqual(routes);
    for (const cron of crons) {
      expect(existsSync(path.join(REPO_ROOT, "apps/web/app", cron.path, "route.ts"))).toBe(true);
      expect(cron.schedule.trim().split(/\s+/)).toHaveLength(5);
    }
  });

  it("runs db-migrate as the single ordered production lane", () => {
    const workflow = readFileSync(WORKFLOW, "utf8");

    // Every push to main, plus manual runs. No paths filter.
    expect(workflow).toMatch(/^on:\n  push:\n    branches: \[main\]\n  workflow_dispatch:\n/m);
    expect(workflow).not.toMatch(/^\s*paths(-ignore)?:/m);
    // Only main may touch production.
    expect(workflow).toMatch(/^    if: github\.ref == 'refs\/heads\/main'$/m);
    // One run at a time, and a running one is never cancelled.
    expect(workflow).toMatch(
      /^concurrency:\n  group: db-migrate-prod\n  cancel-in-progress: false\n/m,
    );
  });

  it("deploys only after the migration push, and only the tip of main", () => {
    const workflow = readFileSync(WORKFLOW, "utf8");
    const pushAt = workflow.indexOf("      - name: Push migrations\n");
    const tipAt = workflow.indexOf("      - name: Check this commit is still the tip of main\n");
    const deployAt = workflow.indexOf("      - name: Deploy production after migrations\n");
    expect(pushAt).toBeGreaterThan(-1);
    expect(tipAt).toBeGreaterThan(pushAt);
    expect(deployAt).toBeGreaterThan(tipAt);

    // No step may carry on past a failed migration push.
    expect(workflow).not.toContain("continue-on-error");
    expect(workflow).not.toMatch(/always\(\)|failure\(\)|cancelled\(\)/);

    const push = step(workflow, "Push migrations");
    expect(push).toContain("supabase db push --include-all");
    expect(push).not.toMatch(/^\s+if:/m);

    const tip = step(workflow, "Check this commit is still the tip of main");
    expect(tip).toContain("id: tip");
    expect(tip).toContain("git fetch --no-tags --depth=1 origin main");
    expect(tip).toContain('"$tip" = "$GITHUB_SHA"');
    expect(tip).toContain("is_tip=yes");
    expect(tip).toContain("is_tip=no");
    expect(tip).toContain("::notice::");

    const deploy = step(workflow, "Deploy production after migrations");
    expect(deploy).toMatch(
      /^        if: steps\.vercel\.outputs\.configured == 'yes' && steps\.tip\.outputs\.is_tip == 'yes'$/m,
    );
    expect(deploy).toContain("vercel deploy --prod");
    expect(deploy).toContain("FV_DEPLOY_AFTER_MIGRATE=1");
    expect(deploy).toContain("vercel@65.15.0");
    // The only place the workflow deploys.
    expect(workflow.match(/vercel deploy/g)?.length).toBe(1 + (workflow.match(/^#.*vercel deploy/gm)?.length ?? 0));
  });
});
