/**
 * Static guards for FV-671 (SSO A1). Cheap, no database: they pin the
 * invariants that are easiest to regress by a refactor.
 *
 *  - no auth-user deletion outside the locked SQL path (the legacy
 *    delete-on-insert-failure rollback must stay gone)
 *  - form fields are never written to auth user_metadata
 *  - the TS rate-limit bucket list equals the DB CHECK constraint (the latest
 *    migration that defines it) — they drifted once before
 *  - local/CI config: Confirm email ON, 15-minute OTP, `private` not exposed to
 *    PostgREST
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { RATE_LIMIT_ACTIONS, RATE_LIMIT_CONFIG } from "@/lib/actions/rate-limit";

const WEB = join(__dirname, "..", "..");
const REPO = join(WEB, "..", "..");

const read = (p: string) => readFileSync(p, "utf8");
// Source with comments removed, so prose mentioning a forbidden token is fine.
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("signup actions never delete an auth user", () => {
  const files = [
    "lib/actions/auth.ts",
    "lib/actions/auth-adult.ts",
    "lib/actions/email-signup.ts",
    "lib/actions/onboarding.ts",
    "lib/auth/pending-account.ts",
  ];
  it.each(files)("%s has no admin.deleteUser / service-role user delete", (f) => {
    const src = code(join(WEB, f));
    expect(src).not.toMatch(/deleteUser/);
    expect(src).not.toMatch(/\.from\(["']users["']\)\s*\.delete/);
  });

  it("the only delete path is the finalize_pending_deletion RPC", () => {
    const src = read(join(WEB, "lib/auth/pending-account.ts"));
    expect(src).toMatch(/finalize_pending_deletion/);
  });
});

describe("no form field reaches user_metadata", () => {
  const files = [
    "lib/actions/auth.ts",
    "lib/actions/auth-adult.ts",
    "lib/actions/email-signup.ts",
  ];
  it.each(files)("%s never passes options.data / user_metadata", (f) => {
    const src = code(join(WEB, f));
    expect(src).not.toMatch(/user_metadata/);
    expect(src).not.toMatch(/options\s*:\s*\{[^}]*\bdata\b/);
  });
});

describe("rate-limit buckets: TS list == DB CHECK", () => {
  it("matches the latest migration that defines auth_rate_limit_events_action_check", () => {
    const dir = join(REPO, "supabase", "migrations");
    const defining = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .filter((f) => /add constraint auth_rate_limit_events_action_check/.test(read(join(dir, f))));
    expect(defining.length).toBeGreaterThan(0);
    const latest = read(join(dir, defining[defining.length - 1] ?? ""));
    const block = /add constraint auth_rate_limit_events_action_check\s+check \(action in \(([\s\S]*?)\)\);/.exec(
      latest,
    );
    expect(block).not.toBeNull();
    const dbActions = [...(block?.[1] ?? "").matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
    expect(dbActions).toEqual([...RATE_LIMIT_ACTIONS].sort());
  });

  it("defines the FV-671 buckets and the two reserved for FV-673", () => {
    for (const a of ["signup_verify", "signup_resend", "apple_signin", "apple_handoff"] as const) {
      expect(RATE_LIMIT_ACTIONS).toContain(a);
      expect(RATE_LIMIT_CONFIG[a].limit).toBeGreaterThan(0);
    }
  });
});

describe("supabase/config.toml (local + CI)", () => {
  const toml = read(join(REPO, "supabase", "config.toml"));

  it("Confirm email is ON", () => {
    expect(toml).toMatch(/^enable_confirmations\s*=\s*true\s*$/m);
  });

  it("OTP is 6 digits, expires in 15 minutes, 60s resend cooldown", () => {
    expect(toml).toMatch(/^otp_length\s*=\s*6\s*$/m);
    expect(toml).toMatch(/^otp_expiry\s*=\s*900\s*$/m);
    expect(toml).toMatch(/^max_frequency\s*=\s*"60s"\s*$/m);
  });

  it("the confirmation email template carries the {{ .Token }} code", () => {
    expect(toml).toMatch(/\[auth\.email\.template\.confirmation\]/);
    const tpl = read(join(REPO, "supabase", "templates", "confirmation.html"));
    expect(tpl).toContain("{{ .Token }}");
    expect(tpl).not.toContain("ConfirmationURL");
  });

  it("the `private` schema is not exposed to PostgREST", () => {
    const m = /^\[api\][\s\S]*?^schemas\s*=\s*\[([^\]]*)\]/m.exec(toml);
    expect(m).not.toBeNull();
    expect(m?.[1]).not.toMatch(/private/);
  });
});
