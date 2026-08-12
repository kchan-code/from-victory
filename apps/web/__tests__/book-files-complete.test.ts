/**
 * FV-471 — BOOK_FILES completeness + soccer export-bucketing guards.
 *
 * Same class of bug twice: a sport book landed on disk (lacrosse FV-406,
 * soccer PR #411) but apply-scripts.ts BOOK_FILES omitted it, so loadBookProse
 * never saw the clips at render time. This test fails if any docs/scripts/*.md
 * book (except README.md) is missing from BOOK_FILES.
 *
 * Also locks the export-scripts.ts pp-soc- Hockey-catch-all exclusion and the
 * dedicated "Soccer Pre-Practice Clips" section header (verbatim from
 * docs/scripts/pre-practice.md). export-scripts.ts is a CLI that runs main()
 * on import, so we assert against source text rather than importing it.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { BOOK_FILES, unlistedScriptBooks } from "../scripts/apply-scripts.ts";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const DOCS_SCRIPTS_DIR = join(REPO_ROOT, "docs", "scripts");
const EXPORT_SCRIPTS_PATH = join(WEB_ROOT, "scripts", "export-scripts.ts");
const PRE_PRACTICE_BOOK_PATH = join(DOCS_SCRIPTS_DIR, "pre-practice.md");

describe("unlistedScriptBooks", () => {
  it("returns on-disk books that BOOK_FILES omits, ignoring README.md", () => {
    expect(
      unlistedScriptBooks(["hockey.md", "soccer.md", "README.md"], ["hockey.md"]),
    ).toEqual(["soccer.md"]);
  });

  it("returns empty when every on-disk book is listed", () => {
    expect(
      unlistedScriptBooks(["hockey.md", "README.md"], ["hockey.md"]),
    ).toEqual([]);
  });
});

describe("BOOK_FILES completeness (FV-471)", () => {
  it("lists every docs/scripts/*.md book except README.md", () => {
    const onDisk = readdirSync(DOCS_SCRIPTS_DIR);
    expect(unlistedScriptBooks(onDisk)).toEqual([]);
  });

  it("includes soccer.md (the book that was inert at render before FV-471)", () => {
    expect(BOOK_FILES).toContain("soccer.md");
  });
});

describe("export-scripts soccer pre-practice bucketing (FV-471)", () => {
  const exportSrc = readFileSync(EXPORT_SCRIPTS_PATH, "utf8");
  const prePracticeBook = readFileSync(PRE_PRACTICE_BOOK_PATH, "utf8");

  it("pre-practice.md uses the Soccer Pre-Practice Clips section header", () => {
    expect(prePracticeBook).toMatch(/^## Soccer Pre-Practice Clips$/m);
  });

  it("excludes pp-soc- from the Hockey catch-all and buckets it under that header", () => {
    expect(exportSrc).toContain('!s.slug.startsWith("pp-soc-")');
    expect(exportSrc).toContain('header: "Soccer Pre-Practice Clips"');
    expect(exportSrc).toContain('s.slug.startsWith("pp-soc-")');
  });
});
