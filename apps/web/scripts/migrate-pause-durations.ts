#!/usr/bin/env node
// Standalone migration: write _(pause: Ns)_ durations into all docs/scripts/*.md books.
//
// Strategy: for each clip entry in each book, positionally match the _(pause)_ markers
// in the book to the silence segments in the corresponding TS AudioScript, then rewrite
// each bare _(pause)_ to _(pause: Ns)_ with the exact TS durationSec value.
//
// NON-GOALS:
//   - Does NOT use scripts:export --force (would clobber book prose edits).
//   - Does NOT change any prose, headers, slug comments, or existing _(pause: Ns)_ markers.
//   - Does NOT change durations that are already written (idempotent: re-running is safe).
//
// Usage (from apps/web/):
//   node --experimental-strip-types scripts/migrate-pause-durations.ts
//
// After running, verify with:
//   npm run audio:check   (must be GREEN)
//   node --experimental-strip-types scripts/snapshot-render-plan.ts > after.json
//   diff baseline.json after.json  (must be empty)

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { CLIP_SCRIPTS } from "../components/pregame/audio/clips.ts";
import type { AudioScript } from "../components/pregame/audio/types";
import { BREATH_THRESHOLD_SCRIPT } from "../components/pregame/audio/breath-threshold.ts";
import { SESSION_FORWARD_MISSED_CHANCE_SCRIPT } from "../components/pregame/audio/session-forward-missed-chance.ts";
import { SESSION_GOALIE_COACH_YELLS_SCRIPT } from "../components/pregame/audio/session-goalie-coach-yells.ts";
import { SESSION_DEFENSE_BEATEN_WIDE_SCRIPT } from "../components/pregame/audio/session-defense-beaten-wide.ts";
import { SESSION_FORWARD_TURNOVER_SCRIPT } from "../components/pregame/audio/session-forward-turnover.ts";
import { SESSION_FORWARD_BEATEN_WIDE_SCRIPT } from "../components/pregame/audio/session-forward-beaten-wide.ts";
import { SESSION_FORWARD_BAD_PENALTY_SCRIPT } from "../components/pregame/audio/session-forward-bad-penalty.ts";
import { SESSION_FORWARD_COACH_YELLS_SCRIPT } from "../components/pregame/audio/session-forward-coach-yells.ts";
import { SESSION_FORWARD_BENCHED_SCRIPT } from "../components/pregame/audio/session-forward-benched.ts";
import { SESSION_FORWARD_NERVOUS_SCRIPT } from "../components/pregame/audio/session-forward-nervous.ts";
import { SESSION_FORWARD_GET_HIT_SCRIPT } from "../components/pregame/audio/session-forward-get-hit.ts";
import { SESSION_FORWARD_START_SLOW_SCRIPT } from "../components/pregame/audio/session-forward-start-slow.ts";
import { SESSION_FORWARD_FIRST_GOAL_AGAINST_SCRIPT } from "../components/pregame/audio/session-forward-first-goal-against.ts";
import { SESSION_DEFENSE_TURNOVER_SCRIPT } from "../components/pregame/audio/session-defense-turnover.ts";
import { SESSION_DEFENSE_MISSED_CHANCE_SCRIPT } from "../components/pregame/audio/session-defense-missed-chance.ts";
import { SESSION_DEFENSE_BAD_PENALTY_SCRIPT } from "../components/pregame/audio/session-defense-bad-penalty.ts";
import { SESSION_DEFENSE_COACH_YELLS_SCRIPT } from "../components/pregame/audio/session-defense-coach-yells.ts";
import { SESSION_DEFENSE_BENCHED_SCRIPT } from "../components/pregame/audio/session-defense-benched.ts";
import { SESSION_DEFENSE_NERVOUS_SCRIPT } from "../components/pregame/audio/session-defense-nervous.ts";
import { SESSION_DEFENSE_GET_HIT_SCRIPT } from "../components/pregame/audio/session-defense-get-hit.ts";
import { SESSION_DEFENSE_START_SLOW_SCRIPT } from "../components/pregame/audio/session-defense-start-slow.ts";
import { SESSION_DEFENSE_FIRST_GOAL_AGAINST_SCRIPT } from "../components/pregame/audio/session-defense-first-goal-against.ts";
import { SESSION_GOALIE_TURNOVER_SCRIPT } from "../components/pregame/audio/session-goalie-turnover.ts";
import { SESSION_GOALIE_MISSED_CHANCE_SCRIPT } from "../components/pregame/audio/session-goalie-missed-chance.ts";
import { SESSION_GOALIE_BEATEN_WIDE_SCRIPT } from "../components/pregame/audio/session-goalie-beaten-wide.ts";
import { SESSION_GOALIE_BAD_PENALTY_SCRIPT } from "../components/pregame/audio/session-goalie-bad-penalty.ts";
import { SESSION_GOALIE_PULLED_SCRIPT } from "../components/pregame/audio/session-goalie-pulled.ts";
import { SESSION_GOALIE_NERVOUS_SCRIPT } from "../components/pregame/audio/session-goalie-nervous.ts";
import { SESSION_GOALIE_GET_HIT_SCRIPT } from "../components/pregame/audio/session-goalie-get-hit.ts";
import { SESSION_GOALIE_START_SLOW_SCRIPT } from "../components/pregame/audio/session-goalie-start-slow.ts";
import { SESSION_GOALIE_FIRST_GOAL_AGAINST_SCRIPT } from "../components/pregame/audio/session-goalie-first-goal-against.ts";
import { OPENER_CONFIDENCE_SCRIPT } from "../components/pregame/audio/opener-confidence.ts";
import { OPENER_CALM_SCRIPT } from "../components/pregame/audio/opener-calm.ts";
import { OPENER_COMPETE_LEVEL_SCRIPT } from "../components/pregame/audio/opener-compete-level.ts";
import { OPENER_RESET_SCRIPT } from "../components/pregame/audio/opener-reset.ts";
import { OPENER_COURAGE_SCRIPT } from "../components/pregame/audio/opener-courage.ts";
import { OPENER_DECISIONS_SCRIPT } from "../components/pregame/audio/opener-decisions.ts";
import { OPENER_LEADERSHIP_SCRIPT } from "../components/pregame/audio/opener-leadership.ts";
import { OPENER_JOY_SCRIPT } from "../components/pregame/audio/opener-joy.ts";
import { OPENER_HOPE_SCRIPT } from "../components/pregame/audio/opener-hope.ts";
import { OPENER_BB_COURAGE_SCRIPT } from "../components/pregame/audio/opener-bb-courage.ts";
import { OPENER_BB_DECISIONS_SCRIPT } from "../components/pregame/audio/opener-bb-decisions.ts";
import { OPENER_BB_CONFIDENCE_SCRIPT } from "../components/pregame/audio/opener-bb-confidence.ts";
import { OPENER_BB_COMPETE_LEVEL_SCRIPT } from "../components/pregame/audio/opener-bb-compete-level.ts";
import { OPENER_BB_RESET_SCRIPT } from "../components/pregame/audio/opener-bb-reset.ts";
import { OPENER_BB_LEADERSHIP_SCRIPT } from "../components/pregame/audio/opener-bb-leadership.ts";
import { OPENER_BB_JOY_SCRIPT } from "../components/pregame/audio/opener-bb-joy.ts";
import { OPENER_BB_HOPE_SCRIPT } from "../components/pregame/audio/opener-bb-hope.ts";
import { OPENER_BE_VOCAL_SCRIPT } from "../components/pregame/audio/opener-be-vocal.ts";
import { OPENER_BB_BE_VOCAL_SCRIPT } from "../components/pregame/audio/opener-bb-be-vocal.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WEB_ROOT = join(__dirname, "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const DOCS_SCRIPTS_DIR = join(REPO_ROOT, "docs", "scripts");

const BOOK_FILES = [
  "hockey.md", "basketball.md", "baseball.md", "golf.md",
  "football.md", "swimming.md", "track-field.md",
  "pre-practice.md", "shared.md",
];

// Build the complete slug → AudioScript lookup (all scripts including SCRIPTS + CLIP_SCRIPTS)
const ALL_SCRIPTS: AudioScript[] = [
  BREATH_THRESHOLD_SCRIPT,
  OPENER_CONFIDENCE_SCRIPT,
  OPENER_CALM_SCRIPT,
  OPENER_COMPETE_LEVEL_SCRIPT,
  OPENER_RESET_SCRIPT,
  OPENER_COURAGE_SCRIPT,
  OPENER_DECISIONS_SCRIPT,
  OPENER_LEADERSHIP_SCRIPT,
  OPENER_JOY_SCRIPT,
  OPENER_HOPE_SCRIPT,
  OPENER_BB_COURAGE_SCRIPT,
  OPENER_BB_DECISIONS_SCRIPT,
  OPENER_BB_CONFIDENCE_SCRIPT,
  OPENER_BB_COMPETE_LEVEL_SCRIPT,
  OPENER_BB_RESET_SCRIPT,
  OPENER_BB_LEADERSHIP_SCRIPT,
  OPENER_BB_JOY_SCRIPT,
  OPENER_BB_HOPE_SCRIPT,
  OPENER_BE_VOCAL_SCRIPT,
  OPENER_BB_BE_VOCAL_SCRIPT,
  SESSION_FORWARD_MISSED_CHANCE_SCRIPT,
  SESSION_FORWARD_TURNOVER_SCRIPT,
  SESSION_FORWARD_BEATEN_WIDE_SCRIPT,
  SESSION_FORWARD_BAD_PENALTY_SCRIPT,
  SESSION_FORWARD_COACH_YELLS_SCRIPT,
  SESSION_FORWARD_BENCHED_SCRIPT,
  SESSION_FORWARD_NERVOUS_SCRIPT,
  SESSION_FORWARD_GET_HIT_SCRIPT,
  SESSION_FORWARD_START_SLOW_SCRIPT,
  SESSION_FORWARD_FIRST_GOAL_AGAINST_SCRIPT,
  SESSION_DEFENSE_BEATEN_WIDE_SCRIPT,
  SESSION_DEFENSE_TURNOVER_SCRIPT,
  SESSION_DEFENSE_MISSED_CHANCE_SCRIPT,
  SESSION_DEFENSE_BAD_PENALTY_SCRIPT,
  SESSION_DEFENSE_COACH_YELLS_SCRIPT,
  SESSION_DEFENSE_BENCHED_SCRIPT,
  SESSION_DEFENSE_NERVOUS_SCRIPT,
  SESSION_DEFENSE_GET_HIT_SCRIPT,
  SESSION_DEFENSE_START_SLOW_SCRIPT,
  SESSION_DEFENSE_FIRST_GOAL_AGAINST_SCRIPT,
  SESSION_GOALIE_COACH_YELLS_SCRIPT,
  SESSION_GOALIE_TURNOVER_SCRIPT,
  SESSION_GOALIE_MISSED_CHANCE_SCRIPT,
  SESSION_GOALIE_BEATEN_WIDE_SCRIPT,
  SESSION_GOALIE_BAD_PENALTY_SCRIPT,
  SESSION_GOALIE_PULLED_SCRIPT,
  SESSION_GOALIE_NERVOUS_SCRIPT,
  SESSION_GOALIE_GET_HIT_SCRIPT,
  SESSION_GOALIE_START_SLOW_SCRIPT,
  SESSION_GOALIE_FIRST_GOAL_AGAINST_SCRIPT,
  ...CLIP_SCRIPTS,
];

const SCRIPT_MAP = new Map<string, AudioScript>();
for (const s of ALL_SCRIPTS) {
  SCRIPT_MAP.set(s.slug, s);
}

// Grammar for detecting existing pause markers (to skip already-migrated markers)
const PAUSE_WITH_DURATION_RE = /^_\(pause:\s*([\d.]+)s?\)_$/;
const PAUSE_BARE_RE = /^_\(pause\)_$/;

/**
 * Format a duration as a string for the book marker.
 * Uses minimal precision: integers as "N", decimals as "N.M" etc.
 * Examples: 1 → "1", 1.5 → "1.5", 0.25 → "0.25"
 */
function formatDuration(d: number): string {
  // Remove trailing zeros but keep significant decimals
  return d.toString();
}

type MigrationResult = {
  bookFile: string;
  clipsProcessed: number;
  markersWritten: number;
  markersAlreadyMigrated: number;
  skippedNoScript: number;
  skippedCountMismatch: number;
  errors: string[];
};

async function migrateBook(bookFile: string): Promise<MigrationResult> {
  const bookPath = join(DOCS_SCRIPTS_DIR, bookFile);
  const result: MigrationResult = {
    bookFile,
    clipsProcessed: 0,
    markersWritten: 0,
    markersAlreadyMigrated: 0,
    skippedNoScript: 0,
    skippedCountMismatch: 0,
    errors: [],
  };

  if (!existsSync(bookPath)) {
    result.errors.push(`File not found: ${bookPath}`);
    return result;
  }

  const content = await readFile(bookPath, "utf8");
  const lines = content.split("\n");
  let modified = false;
  const outputLines: string[] = [];

  // State machine tracking current clip context
  let currentSlug: string | null = null;
  let currentSilences: number[] = []; // ordered silence durations from TS script
  let silenceIdx = 0; // index into currentSilences for the next pause marker
  let inFallbackZone = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    // Detect fallback zone
    if (line.startsWith("## Text-mode fallback")) {
      inFallbackZone = true;
      currentSlug = null;
      outputLines.push(line);
      continue;
    }
    if (line.startsWith("## ") && !line.startsWith("## Text-mode fallback")) {
      inFallbackZone = false;
      // Don't reset currentSlug here — a new ## section might still have clips under ###
      outputLines.push(line);
      continue;
    }

    if (inFallbackZone) {
      outputLines.push(line);
      continue;
    }

    // ### heading resets the current clip (new clip block coming)
    if (line.startsWith("### ")) {
      // Save accumulated result for previous clip before resetting
      currentSlug = null;
      currentSilences = [];
      silenceIdx = 0;
      outputLines.push(line);
      continue;
    }

    // Slug comment opens a clip
    const metaMatch = line.match(/<!--\s*slug:\s*([^\s|]+)\s*\|\s*file:\s*([^\s>]+)\s*-->/);
    if (metaMatch?.[1] != null) {
      const slug = metaMatch[1]!;
      const script = SCRIPT_MAP.get(slug);
      if (!script) {
        result.skippedNoScript++;
        currentSlug = null;
        currentSilences = [];
        silenceIdx = 0;
        outputLines.push(line);
        continue;
      }

      // Extract silence durations in order from the TS script
      const silences = script.segments
        .filter((s) => s.type === "silence")
        .map((s) => (s as Extract<typeof s, { type: "silence" }>).durationSec);

      currentSlug = slug;
      currentSilences = silences;
      silenceIdx = 0;
      result.clipsProcessed++;
      outputLines.push(line);
      continue;
    }

    // Pause marker handling — only within a known clip context
    if (currentSlug !== null) {
      // Check for already-migrated form first
      if (PAUSE_WITH_DURATION_RE.test(line)) {
        result.markersAlreadyMigrated++;
        silenceIdx++;
        outputLines.push(line); // preserve as-is
        continue;
      }

      // Bare pause marker — rewrite
      if (PAUSE_BARE_RE.test(line)) {
        if (silenceIdx >= currentSilences.length) {
          result.errors.push(
            `[${bookFile}] "${currentSlug}": more _(pause)_ markers than TS silence segments (marker #${silenceIdx + 1}, only ${currentSilences.length} silences in TS). ` +
            `Leaving as bare _(pause)_.`,
          );
          outputLines.push(line); // leave unchanged
          // Don't advance silenceIdx — this marker is an extra/unexpected one
          continue;
        }

        const dur = currentSilences[silenceIdx]!;
        const newLine = `_(pause: ${formatDuration(dur)}s)_`;
        outputLines.push(newLine);
        if (newLine !== line) {
          modified = true;
          result.markersWritten++;
        } else {
          result.markersAlreadyMigrated++;
        }
        silenceIdx++;
        continue;
      }
    }

    outputLines.push(line);
  }

  if (modified) {
    await writeFile(bookPath, outputLines.join("\n"), "utf8");
    console.log(`  WROTE: ${bookFile} (${result.markersWritten} markers updated, ${result.markersAlreadyMigrated} already migrated)`);
  } else {
    console.log(`  SKIP:  ${bookFile} (${result.markersAlreadyMigrated} already migrated — no changes needed)`);
  }

  return result;
}

async function main(): Promise<void> {
  console.log("Migrating _(pause)_ → _(pause: Ns)_ in all docs/scripts/*.md books...\n");

  const results: MigrationResult[] = [];
  let totalMarkersWritten = 0;
  let totalMarkersAlreadyMigrated = 0;
  let totalErrors = 0;

  for (const bookFile of BOOK_FILES) {
    const result = await migrateBook(bookFile);
    results.push(result);
    totalMarkersWritten += result.markersWritten;
    totalMarkersAlreadyMigrated += result.markersAlreadyMigrated;
    totalErrors += result.errors.length;
  }

  console.log("\n─────────────────────────────────────────────────────");
  console.log("Per-book summary:\n");

  for (const r of results) {
    const total = r.markersWritten + r.markersAlreadyMigrated;
    const status = r.errors.length > 0 ? "ERRORS" : r.markersWritten > 0 ? "UPDATED" : "OK";
    console.log(
      `  [${status}] ${r.bookFile.padEnd(18)}` +
      ` clips:${r.clipsProcessed}` +
      ` markers:${String(total).padStart(4)}` +
      ` written:${String(r.markersWritten).padStart(4)}` +
      ` already:${String(r.markersAlreadyMigrated).padStart(4)}` +
      (r.skippedNoScript > 0 ? ` skip-no-script:${r.skippedNoScript}` : "") +
      (r.skippedCountMismatch > 0 ? ` skip-mismatch:${r.skippedCountMismatch}` : ""),
    );
    for (const err of r.errors) {
      console.error(`    ERROR: ${err}`);
    }
  }

  const grandTotal = totalMarkersWritten + totalMarkersAlreadyMigrated;
  console.log(`\n  TOTAL markers: ${grandTotal} (${totalMarkersWritten} written, ${totalMarkersAlreadyMigrated} already migrated)`);

  if (totalErrors > 0) {
    console.error(`\n${totalErrors} error(s) encountered. Fix and re-run to complete migration.`);
    process.exit(1);
  }

  console.log("\nMigration complete.");
  console.log("Next steps:");
  console.log("  1. npm run audio:check   (must be GREEN)");
  console.log("  2. node --experimental-strip-types scripts/snapshot-render-plan.ts > after.json");
  console.log("  3. diff baseline.json after.json   (must be empty)");
}

void main().catch((err) => {
  console.error("migrate-pause-durations failed:", (err as Error).message);
  process.exit(1);
});
