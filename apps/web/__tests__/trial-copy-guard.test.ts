/**
 * FV-609: the live free trial is 7 days. Fail if a 14-day, fourteen-day,
 * or two-week trial claim comes back in apps/web user-facing copy.
 *
 * Scans pages, components, public machine-readable files (llms.txt),
 * resource articles, email templates under lib/email, and the two comments
 * that quote the live trial CTA. Does not scan tests, billing logic, or
 * historical notes such as "originally 14-day" in lib/actions/subscription.ts.
 *
 * "two weeks" counts only inside a sentence that is a trial claim, so rhythm
 * copy such as "Two weeks strong" does not trip the guard.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_ROOT = resolve(__dirname, "..");

const SCAN_DIRS = ["app", "components", "public", "lib/resources", "lib/email"] as const;

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

const STALE_DAY_COUNT: readonly RegExp[] = [
  /\b14-day\b/i,
  /\b14 day\b/i,
  /\b14 days\b/i,
  /\bfourteen-day\b/i,
  /\bfourteen day\b/i,
  /\bfourteen days\b/i,
];

const TWO_WEEK_PHRASE = /\b(?:two[- ]weeks?|2[- ]weeks?)\b/i;

/** "free for the first two weeks" / "two weeks free", without needing the word trial. */
const FREE_FOR_TWO_WEEKS =
  /\bfree\s+(?:for\s+)?(?:the\s+)?(?:first\s+)?(?:two[- ]weeks?|2[- ]weeks?)\b/i;
const TWO_WEEKS_FREE = /\b(?:two[- ]weeks?|2[- ]weeks?)\s+free\b/i;

const SPORT_PAGES = [
  "hockey",
  "basketball",
  "golf",
  "football",
  "baseball",
  "lacrosse",
  "soccer",
] as const;

/**
 * A line is a stale trial-duration claim when it names 14 days, or when a
 * sentence pairs "two weeks" with a trial (or with "free" as the duration).
 */
function lineClaimsStaleTrial(line: string): boolean {
  if (STALE_DAY_COUNT.some((pattern) => pattern.test(line))) return true;
  return line.split(/[.!?]/).some((sentence) => {
    if (!TWO_WEEK_PHRASE.test(sentence)) return false;
    return (
      /\btrial\b/i.test(sentence) ||
      FREE_FOR_TWO_WEEKS.test(sentence) ||
      TWO_WEEKS_FREE.test(sentence)
    );
  });
}

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

    expect(files.some((file) => file.includes(`${join("lib", "email")}`))).toBe(
      true,
    );
    expect(files.length).toBeGreaterThan(10);

    const offenders: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, "utf8").split("\n");
      let fileHit = false;
      lines.forEach((line, index) => {
        if (lineClaimsStaleTrial(line)) {
          fileHit = true;
          offenders.push(
            `${relative(WEB_ROOT, file)}:${index + 1}: ${line.trim()}`,
          );
        }
      });
      // A claim split across lines ("14" at the end of one line, "days" at
      // the start of the next) used to hide from the per-line scan. That is
      // how /signup/athlete kept a 14-day sentence after FV-609.
      if (!fileHit && lineClaimsStaleTrial(lines.join(" "))) {
        offenders.push(
          `${relative(WEB_ROOT, file)}: wrapped 14-day or two-week trial claim`,
        );
      }
    }

    expect(offenders).toEqual([]);
  });

  it("treats two weeks as a trial claim only in trial context", () => {
    expect(
      lineClaimsStaleTrial("Two weeks strong. Your rhythm is taking shape."),
    ).toBe(false);
    expect(
      lineClaimsStaleTrial("the first two weeks of the season"),
    ).toBe(false);
    expect(
      lineClaimsStaleTrial(
        "Download it free. The first two weeks of the season matter.",
      ),
    ).toBe(false);
    expect(lineClaimsStaleTrial("free for the first two weeks")).toBe(true);
    expect(lineClaimsStaleTrial("two weeks free, then $5/mo")).toBe(true);
    expect(lineClaimsStaleTrial("a two-week free trial")).toBe(true);
    expect(lineClaimsStaleTrial("a 2-week free trial")).toBe(true);
    expect(lineClaimsStaleTrial("try the 14-day trial")).toBe(true);
    expect(lineClaimsStaleTrial("fourteen days free")).toBe(true);
    // Wrapped the way /signup/athlete used to hide it from the line scanner.
    expect(
      lineClaimsStaleTrial(
        "head to checkout. 14\ndays free for first-time subscribers".replace(
          /\s+/g,
          " ",
        ),
      ),
    ).toBe(true);
    expect(lineClaimsStaleTrial("14")).toBe(false);
    expect(lineClaimsStaleTrial("days free")).toBe(false);
  });

  it("qualifies the sport-page trial line as a one-athlete start", () => {
    for (const sport of SPORT_PAGES) {
      const src = readFileSync(
        resolve(WEB_ROOT, `app/${sport}/page.tsx`),
        "utf8",
      );
      expect(src).toContain(
        "7 days free when you start with one athlete, then $5/mo or $49/yr for the",
      );
      expect(src).not.toContain("7 days free, then $5/mo or $49/yr for the");
    }
  });
});
