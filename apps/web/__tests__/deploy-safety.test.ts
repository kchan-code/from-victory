import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, it, expect, afterEach } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const SCRIPT = path.join(REPO_ROOT, "bin/vercel-ignore-production-build.sh");

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

function runIgnore(
  cwd: string,
  env: Record<string, string>,
): { status: number | null; stdout: string } {
  const result = spawnSync("bash", [path.join(cwd, "bin/vercel-ignore-production-build.sh")], {
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

describe("migrate-before-deploy gate (FV-731)", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function tempRepo(): { dir: string; prev: string; cur: string; curNoMigration: string } {
    const dir = mkdtempSync(path.join(tmpdir(), "fv-ignore-"));
    dirs.push(dir);
    mkdirSync(path.join(dir, "bin"));
    writeFileSync(
      path.join(dir, "bin/vercel-ignore-production-build.sh"),
      readFileSync(SCRIPT),
    );
    chmodSync(path.join(dir, "bin/vercel-ignore-production-build.sh"), 0o755);
    git(dir, ["init", "-b", "main"]);
    git(dir, ["config", "user.email", "dev@example.com"]);
    git(dir, ["config", "user.name", "Test"]);
    writeFileSync(path.join(dir, "README.md"), "one\n");
    git(dir, ["add", "README.md"]);
    git(dir, ["commit", "-m", "base"]);
    const prev = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();

    writeFileSync(path.join(dir, "README.md"), "two\n");
    git(dir, ["add", "README.md"]);
    git(dir, ["commit", "-m", "no migration"]);
    const curNoMigration = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: dir,
      encoding: "utf8",
    }).trim();

    mkdirSync(path.join(dir, "supabase/migrations"), { recursive: true });
    writeFileSync(path.join(dir, "supabase/migrations/001.sql"), "select 1;\n");
    git(dir, ["add", "supabase/migrations/001.sql"]);
    git(dir, ["commit", "-m", "migration"]);
    const cur = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
    return { dir, prev, cur, curNoMigration };
  }

  it("builds unless production, the opt-in flag, and a migration diff all agree", () => {
    const { dir, prev, cur, curNoMigration } = tempRepo();
    const shas = { VERCEL_GIT_PREVIOUS_SHA: prev, VERCEL_GIT_COMMIT_SHA: cur };

    expect(runIgnore(dir, { ...shas, VERCEL_ENV: "preview", FV_MIGRATE_BEFORE_DEPLOY: "1" }).status).toBe(1);
    expect(runIgnore(dir, { ...shas, VERCEL_ENV: "production" }).status).toBe(1);
    expect(
      runIgnore(dir, {
        VERCEL_ENV: "production",
        FV_MIGRATE_BEFORE_DEPLOY: "1",
        VERCEL_GIT_PREVIOUS_SHA: prev,
        VERCEL_GIT_COMMIT_SHA: curNoMigration,
      }).status,
    ).toBe(1);

    const skipped = runIgnore(dir, {
      ...shas,
      VERCEL_ENV: "production",
      FV_MIGRATE_BEFORE_DEPLOY: "1",
    });
    expect(skipped.status).toBe(0);
    expect(skipped.stdout).toContain("Skipping");

    const forced = runIgnore(dir, {
      ...shas,
      VERCEL_ENV: "production",
      FV_MIGRATE_BEFORE_DEPLOY: "1",
      FV_DEPLOY_AFTER_MIGRATE: "1",
    });
    expect(forced.status).toBe(1);
    expect(forced.stdout).toContain("post-migration");
  });

  it("fails open when the SHAs are missing", () => {
    const { dir } = tempRepo();
    expect(
      runIgnore(dir, { VERCEL_ENV: "production", FV_MIGRATE_BEFORE_DEPLOY: "1" }).status,
    ).toBe(1);
  });

  it("wires ignoreCommand and deploys only after the migration push", () => {
    const vercel = readFileSync(path.join(REPO_ROOT, "vercel.json"), "utf8");
    expect(vercel).toContain("bash bin/vercel-ignore-production-build.sh");

    const workflow = readFileSync(
      path.join(REPO_ROOT, ".github/workflows/db-migrate.yml"),
      "utf8",
    );
    const pushAt = workflow.indexOf("name: Push migrations");
    const deployAt = workflow.indexOf("name: Deploy production after migrations");
    expect(pushAt).toBeGreaterThan(-1);
    expect(deployAt).toBeGreaterThan(pushAt);
    expect(workflow).toContain("FV_DEPLOY_AFTER_MIGRATE=1");
    expect(workflow).toContain("vercel@65.15.0");
  });
});
