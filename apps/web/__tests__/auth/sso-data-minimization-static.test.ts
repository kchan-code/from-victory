/**
 * FV-674 / spec FV-569 §5.8 CI grep guard (data minimization).
 *
 * Provider name / photo / profile claims can live in Supabase auth
 * (`user_metadata`, `raw_user_meta_data`, `identity_data`, ...). We never read
 * them: scopes are Apple `email` and Google `openid email`, and nothing from a
 * provider profile may reach our code, logs or alerts.
 *
 * This scans apps/web/{app,lib,components} (production source; comments and
 * test files excluded) and FAILS on any of those identifiers outside the
 * explicit ALLOW list below. To add an exception, add the file + the reason
 * here in the same PR and get the kids-privacy-officer's sign-off; a bare
 * match is never acceptable.
 *
 * `picture` is also ordinary English in marketing copy ("a picture of
 * tomorrow's first tee"), so it only matches code-shaped uses: property access
 * (`.picture`), a quoted key (`"picture"`) or an object/type key (`picture:`).
 * Generated DB types (lib/supabase/types.ts) never contain these columns.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const WEB = join(__dirname, "..", "..");
const ROOTS = ["app", "lib", "components"];

/**
 * file (relative to apps/web) -> why it may match. Empty on purpose: as of
 * FV-674 there is no legitimate code use. Comments that merely forbid the
 * identifiers (lib/actions/email-signup.ts, lib/auth/guards.ts,
 * lib/auth/email-signup-schema.ts) are stripped before matching.
 */
const ALLOW: Record<string, string> = {};

const PATTERNS: { name: string; re: RegExp }[] = [
  { name: "user_metadata", re: /user_metadata/ },
  { name: "raw_user_meta_data", re: /raw_user_meta_data/ },
  { name: "identity_data", re: /identity_data/ },
  { name: "full_name", re: /full_name/ },
  { name: "avatar_url", re: /avatar_url/ },
  { name: "picture", re: /\.picture\b|["'`]picture["'`]|\bpicture\s*\??\s*:/ },
];

const SKIP_FILES = new Set(["lib/supabase/types.ts"]);

function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "__tests__") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name) && !/\.(test|spec)\./.test(name)) out.push(p);
  }
  return out;
}

export function findViolations(files: { rel: string; src: string }[]): string[] {
  const hits: string[] = [];
  for (const { rel, src } of files) {
    if (SKIP_FILES.has(rel) || rel in ALLOW) continue;
    const code = stripComments(src);
    for (const { name, re } of PATTERNS) {
      if (re.test(code)) hits.push(`${rel}: ${name}`);
    }
  }
  return hits;
}

describe("SSO data minimization (spec §5.8): no provider profile reads", () => {
  it("scans a non-trivial number of files", () => {
    const files = ROOTS.flatMap((r) => walk(join(WEB, r)));
    expect(files.length).toBeGreaterThan(100);
  });

  it("no production source touches user_metadata / provider profile fields", () => {
    const files = ROOTS.flatMap((r) => walk(join(WEB, r))).map((p) => ({
      rel: relative(WEB, p).split("\\").join("/"),
      src: readFileSync(p, "utf8"),
    }));
    expect(findViolations(files)).toEqual([]);
  });

  it("every allow-list entry carries a reason", () => {
    for (const [file, reason] of Object.entries(ALLOW)) {
      expect(reason.length, file).toBeGreaterThan(10);
    }
  });

  it("the matcher itself catches code uses and ignores comments and prose", () => {
    const bad = (src: string) => findViolations([{ rel: "x.ts", src }]).length > 0;
    expect(bad("const n = user.user_metadata.full_name;")).toBe(true);
    expect(bad("const p = identity.identity_data?.picture;")).toBe(true);
    expect(bad("select('raw_user_meta_data')")).toBe(true);
    expect(bad("console.log(u.avatar_url)")).toBe(true);
    expect(bad("const o = { picture: url };")).toBe(true);
    expect(bad("// never read user_metadata here\nconst a = 1;")).toBe(false);
    expect(bad("/* full_name avatar_url */ const a = 1;")).toBe(false);
    expect(bad('const t = "One mental skill, then a picture of tomorrow.";')).toBe(false);
  });
});
