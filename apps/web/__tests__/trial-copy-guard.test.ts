/**
 * FV-609: the live free trial is 7 days. Fail if a 14-day, fourteen-day,
 * or two-week trial claim comes back in apps/web user-facing copy.
 *
 * Scans pages, components, public machine-readable files (llms.txt),
 * resource articles, and the two comments that quote the live trial CTA.
 * Does not scan tests, billing logic, or historical notes such as
 * "originally 14-day" in lib/actions/subscription.ts.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_ROOT = resolve(__dirname, "..");

const SCAN_DIRS = ["app", "components", "public", "lib/resources"] as const;

const EXTRA_FILES = [
  "lib/native-shell-router.ts",
  "lib/actions/auth.ts",
] as const;

const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".md",
  ".txt",
  ".html",
  ".json",
]);

const SKIP_DIRS = new Set(["node_modules", ".next", "__tests__", "coverage"]);

const BANNED: readonly RegExp[] = [
  /\b14-day\b/i,
  /\b14 day\b/i,
  /\b14 days\b/i,
  /\bfourteen-day\b/i,
  /\bfourteen day\b/i,
  /\bfourteen days\b/i,
  /\bfirst two weeks\b/i,
  /\btwo-week free trial\b/i,
  /\b2-week free trial\b/i,
];

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) continue;
    const dot = entry.lastIndexOf(".");
    if (dot === -1 || !TEXT_EXT.has(entry.slice(dot))) continue;
    out.push(full);
  }
}

describe("trial copy guard (FV-609)", () => {
  it("does not advertise a 14-day or two-week free trial in user-facing copy", () => {
    const files: string[] = [];
    for (const dir of SCAN_DIRS) walk(resolve(WEB_ROOT, dir), files);
    for (const rel of EXTRA_FILES) files.push(resolve(WEB_ROOT, rel));

    expect(files.length).toBeGreaterThan(10);

    const offenders: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, index) => {
        for (const pattern of BANNED) {
          if (pattern.test(line)) {
            offenders.push(
              `${relative(WEB_ROOT, file)}:${index + 1}: ${line.trim()}`,
            );
          }
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
