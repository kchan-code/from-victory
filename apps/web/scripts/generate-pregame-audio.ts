#!/usr/bin/env node
// Pregame audio generator.
//
// Reads typed AudioScript objects, calls OpenAI gpt-4o-mini-tts for each
// speech segment, generates silence MP3s at requested durations,
// concatenates with ffmpeg into one final per-script MP3, and emits a
// sidecar JSON timeline that the runtime uses to sync visuals.
//
// Run: `npm run audio:generate` (from apps/web).
// Prereqs: OPENAI_API_KEY in apps/web/.env.local + ffmpeg on PATH.
//
// CLI flags (legacy baked-cell path):
//   --slug <name>     Generate only the script(s) with this slug. Repeatable
//                     (--slug a --slug b) and/or comma-separated (--slug a,b).
//   --dry-run         Validate scripts + estimate cost, no API calls
//   --keep-segments   Don't delete the per-segment temp files
//   --out-dir <path>  Override the default output directory
//
// CLI flags (clip-playlist path):
//   --mode clips      Render CLIP_SCRIPTS into public/audio/pregame/clips/,
//                     loudnorm-pass the openers, and write clips/manifest.json.
//   --slug <name>     TARGETED RENDER (FV-401): render only the named clip
//                     slug(s) — repeatable and/or comma-separated, same as the
//                     legacy path. Re-renders the named slug even if a hashed
//                     mp3 already exists for it (generateOne's own stale-file
//                     cleanup replaces it). Every OTHER clip is left
//                     completely untouched: its existing manifest.json catalog
//                     entry is carried over verbatim (no re-probe, no
//                     re-render), so a targeted render can never trigger a
//                     render for clips outside the target set — this is the
//                     safe way to re-cut a handful of cells without touching
//                     unrelated (incl. dormant v2-track) clips. Requires an
//                     existing clips/manifest.json to seed the baseline
//                     catalog from. Bare `--mode clips` (no --slug) renders
//                     the full catalog and is unchanged.
//   --dry-run         Validate clip scripts + estimate cost, no API calls
//   --keep-segments   Don't delete the per-segment temp files

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  AudioScript,
  AudioTimeline,
  Phase,
  Segment,
} from "../components/pregame/audio/types.ts";
import {
  CLIP_SCRIPTS,
} from "../components/pregame/audio/clips.ts";
import { syncFromBooks, loadBookProse, loadBookProseWithPauses, type BookEntry } from "./apply-scripts.ts";
import type { ClipManifest, ClipPhaseEntry } from "../components/pregame/audio-playlist.ts";
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
import { OPENER_SHARED_CONFIDENCE_SCRIPT } from "../components/pregame/audio/opener-shared-confidence.ts";
import { OPENER_SHARED_CALM_SCRIPT } from "../components/pregame/audio/opener-shared-calm.ts";
import { OPENER_SHARED_COMPETE_LEVEL_SCRIPT } from "../components/pregame/audio/opener-shared-compete-level.ts";
import { OPENER_SHARED_RESET_SCRIPT } from "../components/pregame/audio/opener-shared-reset.ts";
import { OPENER_SHARED_COURAGE_SCRIPT } from "../components/pregame/audio/opener-shared-courage.ts";
import { OPENER_SHARED_DECISIONS_SCRIPT } from "../components/pregame/audio/opener-shared-decisions.ts";
import { OPENER_SHARED_LEADERSHIP_SCRIPT } from "../components/pregame/audio/opener-shared-leadership.ts";
import { OPENER_SHARED_JOY_SCRIPT } from "../components/pregame/audio/opener-shared-joy.ts";
import { OPENER_SHARED_HOPE_SCRIPT } from "../components/pregame/audio/opener-shared-hope.ts";
import { OPENER_SHARED_BE_VOCAL_SCRIPT } from "../components/pregame/audio/opener-shared-be-vocal.ts";
import {
  clearSilenceCache,
  concatMp3s,
  probeDurationSec,
  reEncodeMp3,
  silenceMp3,
  type ConcatInput,
} from "./lib/ffmpeg.ts";
import { buildTimeline, type SegmentDuration } from "./lib/timeline.ts";
import { estimateCostUsd, synthesizeSpeech } from "./lib/tts.ts";

// ──────────────────────────────────────────────────────────────────────
// Content-hash helpers (FV-142 per-clip content-addressed filenames)

/**
 * Compute the first 8 hex chars of sha256 of a file's bytes.
 * Used to produce content-addressed filenames: <slug>.<hash8>.mp3
 */
async function hash8OfFile(filePath: string): Promise<string> {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex").slice(0, 8);
}

/**
 * Compute the manifest version hash: sha256 of the JSON-serialised
 * { slug: hash8 } map (keys sorted) → first 8 hex chars.
 * This changes if ANY clip changes, so the manifest URL is also busted.
 */
function computeManifestVersion(slugHashMap: Record<string, string>): string {
  const sorted = JSON.stringify(
    Object.fromEntries(
      Object.entries(slugHashMap).sort(([a], [b]) => a.localeCompare(b)),
    ),
    null,
    0,
  );
  return createHash("sha256").update(sorted).digest("hex").slice(0, 8);
}

/**
 * Find the content-addressed filename for a slug in a directory.
 * Looks for any file matching `<slug>.<8hexchars>.mp3` — used by the
 * resume path to locate an already-rendered hashed clip without re-hashing.
 * Returns null when no hashed file is found.
 */
async function findHashedMp3(dir: string, slug: string): Promise<string | null> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return null;
  }
  const pattern = new RegExp(`^${slug}\\.[0-9a-f]{8}\\.mp3$`);
  const match = entries.find((f) => pattern.test(f));
  return match ? join(dir, match) : null;
}

const SCRIPTS: AudioScript[] = [
  BREATH_THRESHOLD_SCRIPT,
  // Need-specific identity openers — stitched at runtime in front of
  // the cell-specific session MP3. Selected by athlete's "today's focus"
  // setup tap.
  OPENER_CONFIDENCE_SCRIPT,
  OPENER_CALM_SCRIPT,
  OPENER_COMPETE_LEVEL_SCRIPT,
  OPENER_RESET_SCRIPT,
  OPENER_COURAGE_SCRIPT,
  OPENER_DECISIONS_SCRIPT,
  OPENER_LEADERSHIP_SCRIPT,
  OPENER_JOY_SCRIPT,
  OPENER_HOPE_SCRIPT,
  // Basketball openers (FV-115/FV-120) — sport-variant rewrites of hockey openers.
  // courage + decisions rendered in FV-116; remaining 6 rendered in FV-120.
  OPENER_BB_COURAGE_SCRIPT,
  OPENER_BB_DECISIONS_SCRIPT,
  OPENER_BB_CONFIDENCE_SCRIPT,
  OPENER_BB_COMPETE_LEVEL_SCRIPT,
  OPENER_BB_RESET_SCRIPT,
  OPENER_BB_LEADERSHIP_SCRIPT,
  OPENER_BB_JOY_SCRIPT,
  OPENER_BB_HOPE_SCRIPT,
  // FV-124: Be more Vocal openers — hockey + basketball variants.
  OPENER_BE_VOCAL_SCRIPT,
  OPENER_BB_BE_VOCAL_SCRIPT,
  // FV-466: sport-neutral shared openers (fallback for all non-hockey/non-bb sports).
  OPENER_SHARED_CONFIDENCE_SCRIPT,
  OPENER_SHARED_CALM_SCRIPT,
  OPENER_SHARED_COMPETE_LEVEL_SCRIPT,
  OPENER_SHARED_RESET_SCRIPT,
  OPENER_SHARED_COURAGE_SCRIPT,
  OPENER_SHARED_DECISIONS_SCRIPT,
  OPENER_SHARED_LEADERSHIP_SCRIPT,
  OPENER_SHARED_JOY_SCRIPT,
  OPENER_SHARED_HOPE_SCRIPT,
  OPENER_SHARED_BE_VOCAL_SCRIPT,
  // Cell-specific session scripts — selected by (position, adversity).
  // Forward (10 cells)
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
  // Defense (10 cells)
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
  // Goalie (10 cells)
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
  // Future: BREATH_QUICKRESET_SCRIPT.
];

const DEFAULT_OUT_DIR = "public/audio/pregame";

type Flags = {
  // Named-slug targeting. Empty array = no targeting (render everything —
  // unchanged bare-mode behavior in both the legacy and clips paths).
  // Populated from repeatable and/or comma-separated --slug flags.
  slugs: string[];
  dryRun: boolean;
  keepSegments: boolean;
  outDir: string;
  // Clip-playlist generation mode. Renders CLIP_SCRIPTS into clips/
  // subdirectory, loudnorm-passes the opener, writes manifest.json.
  mode?: "clips";
  // --sync-only: run syncFromBooks (md→TS fallback sync) then exit without TTS/ffmpeg.
  // Useful for CI validation ("do the fallback bodies match the .md books?").
  syncOnly: boolean;
  // --check: load all scripts + book prose, report per-clip differences between
  // the .md books and the TS seed text (which clips will render with edited prose),
  // run count-mismatch guard, then exit without TTS/ffmpeg.
  check: boolean;
};

function parseFlags(argv: string[]): Flags {
  const out: Flags = {
    slugs: [],
    dryRun: false,
    keepSegments: false,
    outDir: DEFAULT_OUT_DIR,
    syncOnly: false,
    check: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--keep-segments") out.keepSegments = true;
    else if (a === "--sync-only") out.syncOnly = true;
    else if (a === "--check") out.check = true;
    else if (a === "--mode" && argv[i + 1] === "clips") {
      out.mode = "clips";
      i++;
    } else if (a === "--slug" && argv[i + 1]) {
      // Repeatable (--slug a --slug b) and/or comma-separated (--slug a,b).
      for (const raw of (argv[i + 1] as string).split(",")) {
        const s = raw.trim();
        if (s) out.slugs.push(s);
      }
      i++;
    } else if (a === "--out-dir" && argv[i + 1]) {
      out.outDir = argv[i + 1] as string;
      i++;
    }
  }
  return out;
}

async function tryLoadEnvLocal(): Promise<void> {
  // Tiny .env.local loader so we don't need dotenv as a dep. Only reads
  // OPENAI_API_KEY; ignores everything else.
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const raw = await readFile(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1] as string;
    if (key !== "OPENAI_API_KEY") continue;
    let val = m[2] as string;
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function totalSpeechChars(script: AudioScript): number {
  return script.segments
    .filter((s): s is Extract<Segment, { type: "speech" }> => s.type === "speech")
    .reduce((sum, s) => sum + s.text.length, 0);
}

function speechSegmentCount(script: AudioScript): number {
  return script.segments.filter((s) => s.type === "speech").length;
}

/**
 * Apply book-prose AND book-structure overrides to a script's segments.
 *
 * The .md book is the authoritative source of a clip's prose, pause durations,
 * AND line count (FV-302). Two paths:
 *
 *  1. IN-SYNC (book line + pause counts match the TS): substitute each speech
 *     segment's text and each silence's duration by position; the TS segments
 *     keep their instructions + phase marks. Byte-identical to the TS assembly
 *     for every clip whose book mirrors the TS (the zero-drift invariant
 *     verified by snapshot-render-plan).
 *
 *  2. BOOK-DEFINES-STRUCTURE (counts differ — an editor changed a cell's line
 *     count in the book): the book wins, with NO TS reconcile. The segment list
 *     is rebuilt from the book's interleaved `items`. instructions/speed/mark
 *     for each book line are pulled from the TS speech segment with the SAME
 *     text (matched in occurrence order) — so a phase mark stays on its anchor
 *     line even when other lines are inserted/removed. New/edited lines inherit
 *     the script-level instructions + speed (via `seg.x ?? script.x` at render)
 *     and carry no mark. A warning is emitted; --check lists these clips.
 *
 * Returns a new array — the original AudioScript is not mutated.
 */
export function applyBookProseOverrides(
  script: AudioScript,
  bookData: Map<string, BookEntry>,
): Segment[] {
  const entry = bookData.get(script.slug);
  if (!entry) return script.segments; // no book entry → use TS segments as-is

  const bookLines = entry.lines;
  const bookPauses = entry.pauses;
  const bookItems = entry.items;

  // Count speech and silence segments in the assembled script
  const speechCount = script.segments.filter((s) => s.type === "speech").length;
  const silenceCount = script.segments.filter((s) => s.type === "silence").length;
  const hasMigratedPauses = bookPauses.some((p) => p.durationSec !== null);

  const speechMatches = bookLines.length === speechCount;
  // Pause structure only counts as a mismatch once the book carries explicit
  // (migrated) durations — a fully-bare book defers entirely to the TS pauses.
  const pausesMatch = !hasMigratedPauses || bookPauses.length === silenceCount;

  // ── Path 1: in-sync — book mirrors TS structure. Substitute text + durations
  //    by position; TS segments keep their marks/instructions (zero-drift).
  if (speechMatches && pausesMatch) {
    let speechIdx = 0;
    let silenceIdx = 0;
    const overridden: Segment[] = [];
    for (const seg of script.segments) {
      if (seg.type === "speech") {
        const bookText = bookLines[speechIdx++];
        if (bookText !== undefined && bookText !== seg.text) {
          overridden.push({ ...seg, text: bookText });
        } else {
          overridden.push(seg);
        }
      } else {
        // Silence — apply book duration if available and non-null
        if (hasMigratedPauses && bookPauses[silenceIdx] !== undefined) {
          const bookDur = bookPauses[silenceIdx]!.durationSec;
          if (bookDur !== null && bookDur !== seg.durationSec) {
            overridden.push({ ...seg, durationSec: bookDur });
            silenceIdx++;
            continue;
          }
        }
        overridden.push(seg);
        silenceIdx++;
      }
    }
    return overridden;
  }

  // Safety: an empty book entry (slug present but zero numbered lines) is never
  // an intentional structure change — rebuilding from it would ship a silent,
  // audio-less clip. Fall back to the TS script so a malformed or half-written
  // book section can't render as silence. (A real structure change has ≥1 line.)
  if (bookLines.length === 0) {
    console.warn(
      `[book-prose] WARN: "${script.slug}": book entry has no prose lines — ` +
      `falling back to the TS script (a real structure change needs ≥1 line).`,
    );
    return script.segments;
  }

  // ── Path 2: book defines structure — counts differ, the book wins.
  console.warn(
    `[book-prose] WARN: "${script.slug}": book structure ` +
    `(${bookLines.length} speech / ${bookPauses.length} pause) differs from TS ` +
    `(${speechCount} speech / ${silenceCount} silence) — rendering with the ` +
    `book-defined structure (no TS reconcile needed).`,
  );

  const tsSpeech = script.segments.filter(
    (s): s is Extract<Segment, { type: "speech" }> => s.type === "speech",
  );
  const tsSilence = script.segments.filter(
    (s): s is Extract<Segment, { type: "silence" }> => s.type === "silence",
  );
  // Occurrence counter so duplicate texts (e.g. "Inhale.") match the TS speech
  // segments in order and keep their distinct marks/rounds.
  const seenByText = new Map<string, number>();

  const rebuilt: Segment[] = [];
  let pauseIdx = 0;
  for (const item of bookItems) {
    if (item.type === "speech") {
      const occ = seenByText.get(item.text) ?? 0;
      const tsMatch = tsSpeech.filter((s) => s.text === item.text)[occ];
      if (tsMatch) seenByText.set(item.text, occ + 1);
      const out: Extract<Segment, { type: "speech" }> = { type: "speech", text: item.text };
      // Carry instructions/speed/mark from the matching TS line; a new or edited
      // line (no text match) leaves them unset → render falls back to the
      // script-level instructions/speed and emits no phase mark.
      if (tsMatch?.instructions !== undefined) out.instructions = tsMatch.instructions;
      if (tsMatch?.speed !== undefined) out.speed = tsMatch.speed;
      if (tsMatch?.mark !== undefined) out.mark = tsMatch.mark;
      rebuilt.push(out);
    } else {
      // Pause — use the book duration; a bare _(pause)_ (null) falls back to the
      // TS silence at this position, else a 1s default (warned, since a bare
      // pause with no TS counterpart can't infer a real gap length).
      let dur = item.durationSec;
      if (dur === null) {
        const tsDur = tsSilence[pauseIdx]?.durationSec;
        if (tsDur === undefined) {
          console.warn(
            `[book-prose] WARN: "${script.slug}": bare _(pause)_ #${pauseIdx + 1} ` +
            `has no TS silence to inherit — defaulting to 1s (add an explicit ` +
            `_(pause: Ns)_ to set the gap).`,
          );
        }
        dur = tsDur ?? 1;
      }
      const out: Extract<Segment, { type: "silence" }> = { type: "silence", durationSec: dur };
      if (tsSilence[pauseIdx]?.mark !== undefined) out.mark = tsSilence[pauseIdx]!.mark;
      rebuilt.push(out);
      pauseIdx++;
    }
  }
  return rebuilt;
}

/**
 * Render one AudioScript. In clip mode (flags.mode === "clips") the MP3 is
 * content-addressed: after render the file is renamed from <slug>.mp3 to
 * <slug>.<hash8>.mp3 and the hash8 is returned.
 *
 * In legacy baked-cell mode (no mode flag) no rename happens; returns null
 * (the caller never uses the hash for legacy files).
 *
 * `bookData` — the render-time book-data map (slug → { lines, pauses }).
 * If the slug has an entry, its speech texts and (if migrated) silence durations
 * override the TS values. This is the authoritative prose + structure source for
 * ALL clip types (inline, spread, shared, viz).
 */
async function generateOne(
  script: AudioScript,
  flags: Flags,
  bookData: Map<string, BookEntry>,
): Promise<{ hash8: string } | null> {
  const outDir = resolve(process.cwd(), flags.outDir);
  await mkdir(outDir, { recursive: true });
  const outMp3 = join(outDir, `${script.slug}.mp3`);
  const outJson = join(outDir, `${script.slug}.json`);

  const workDir = join(outDir, `.work-${script.slug}`);
  await mkdir(workDir, { recursive: true });

  // Apply book-prose + book-duration overrides. This replaces speech text and
  // silence durations for any clip whose slug appears in the .md books.
  // GUARD: count mismatch warns (not hard error) in live render path.
  const effectiveSegments = applyBookProseOverrides(script, bookData);
  // Wrap in a minimal script-like object for the render loop.
  const effectiveScript: AudioScript = { ...script, segments: effectiveSegments };

  console.log(`\n── ${script.slug} ─────────────────────────────────────`);
  console.log(
    `   voice=${effectiveScript.voice}  segments=${effectiveScript.segments.length}  speech=${speechSegmentCount(effectiveScript)}  chars=${totalSpeechChars(effectiveScript)}`,
  );
  if (bookData.has(script.slug)) {
    // Check if any speech segment text changed (comparing effective vs original).
    let hasOverride = false;
    for (let i = 0; i < script.segments.length; i++) {
      const orig = script.segments[i];
      const eff = effectiveSegments[i];
      if (orig?.type === "speech" && eff?.type === "speech" && orig.text !== eff.text) {
        hasOverride = true;
        break;
      }
    }
    if (hasOverride) {
      const entry = bookData.get(script.slug)!;
      console.log(`   [book-prose] rendering with .md prose (${entry.lines.length} speech lines)`);
    }
  }

  // 1. Generate per-segment files (speech → TTS, silence → cached silence)
  const concatInputs: ConcatInput[] = [];
  const durations: SegmentDuration[] = [];

  for (let i = 0; i < effectiveScript.segments.length; i++) {
    const seg = effectiveScript.segments[i];
    if (!seg) continue;
    if (seg.type === "silence") {
      const silPath = await silenceMp3(seg.durationSec, workDir);
      concatInputs.push({ kind: "file", path: silPath });
      durations.push({ segmentIndex: i, durationSec: seg.durationSec });
      process.stdout.write("·");
      continue;
    }
    const segPath = join(workDir, `${String(i).padStart(3, "0")}.mp3`);
    await synthesizeSpeech({
      text: seg.text,
      voice: effectiveScript.voice,
      instructions: seg.instructions ?? effectiveScript.instructions,
      // Per-segment speed wins; falls back to script-level default.
      speed: seg.speed ?? effectiveScript.speed,
      outPath: segPath,
    });
    const dur = await probeDurationSec(segPath);
    concatInputs.push({ kind: "file", path: segPath });
    durations.push({ segmentIndex: i, durationSec: dur });
    process.stdout.write("♪");
  }
  process.stdout.write("\n");

  // 2. Concat into one MP3 (re-encode through postFilter if the script
  // declares one — e.g. breath-threshold's warming EQ).
  await concatMp3s(concatInputs, outMp3, workDir, effectiveScript.postFilter);
  const finalDur = await probeDurationSec(outMp3);

  // 3. Build + write sidecar timeline
  const timeline = buildTimeline(effectiveScript, durations);
  // The probed final duration is the authoritative total; replace the
  // accumulator value (they should match within rounding).
  timeline.durationSec = Math.round(finalDur * 1000) / 1000;
  await writeFile(outJson, JSON.stringify(timeline, null, 2) + "\n");

  // 4. In clip mode: rename to content-addressed filename <slug>.<hash8>.mp3.
  //    Any stale hashed file for this slug is removed so only one copy exists.
  let hash8: string | null = null;
  if (flags.mode === "clips") {
    hash8 = await hash8OfFile(outMp3);
    const hashedPath = join(outDir, `${script.slug}.${hash8}.mp3`);

    // Remove any previous hashed file for this slug (from an earlier render
    // whose bytes differed). This prevents stale hashed files accumulating.
    const staleHashed = await findHashedMp3(outDir, script.slug);
    if (staleHashed && staleHashed !== hashedPath) {
      await rm(staleHashed, { force: true });
    }

    if (staleHashed !== hashedPath) {
      await rename(outMp3, hashedPath);
    } else {
      // Same hash → bytes unchanged, no rename needed; remove the plain copy.
      await rm(outMp3, { force: true });
    }

    console.log(
      `   ✓ ${script.slug}.${hash8}.mp3  duration=${timeline.durationSec.toFixed(2)}s  phases=${timeline.phases.length}`,
    );
  } else {
    console.log(
      `   ✓ ${script.slug}.mp3  duration=${timeline.durationSec.toFixed(2)}s  phases=${timeline.phases.length}`,
    );
  }

  // 5. Cleanup
  if (!flags.keepSegments) {
    await rm(workDir, { recursive: true, force: true });
  } else {
    console.log(`   (kept per-segment files in ${workDir})`);
  }

  return hash8 !== null ? { hash8 } : null;
}

// ──────────────────────────────────────────────────────────────────────
// Clip-playlist generation path

// All 9 need-specific openers. Each is loudnorm-passed (no re-TTS) from
// the existing top-level opener-*.mp3 into clips/opener-*.mp3.
const OPENER_SLUGS = [
  "opener-confidence",
  "opener-calm",
  "opener-compete-level",
  "opener-reset",
  "opener-courage",
  "opener-decisions",
  "opener-leadership",
  "opener-joy",
  "opener-hope",
  // Basketball openers (FV-115) — rendered from SCRIPTS above, then
  // loudnorm-passed to clips/ like the hockey openers.
  "opener-bb-courage",
  "opener-bb-decisions",
  // Basketball openers (FV-120) — remaining 6 sport-variant openers.
  "opener-bb-confidence",
  "opener-bb-compete-level",
  "opener-bb-reset",
  "opener-bb-leadership",
  "opener-bb-joy",
  "opener-bb-hope",
  // FV-124: Be more Vocal openers — hockey + basketball.
  "opener-be-vocal",
  "opener-bb-be-vocal",
  // FV-466: sport-neutral shared openers — the NEED_OPENER_SLUGS fallback
  // for every sport without its own opener set. Rendered from SCRIPTS above,
  // then loudnorm-passed to clips/ like the hockey/basketball openers.
  "opener-shared-confidence",
  "opener-shared-calm",
  "opener-shared-compete-level",
  "opener-shared-reset",
  "opener-shared-courage",
  "opener-shared-decisions",
  "opener-shared-leadership",
  "opener-shared-joy",
  "opener-shared-hope",
  "opener-shared-be-vocal",
] as const;

// Keep the Phase 1 const for backward compat references inside generateClips.
const OPENER_CONFIDENCE_SLUG = "opener-confidence";

// Clip subdirectory relative to DEFAULT_OUT_DIR.
const CLIPS_SUBDIR = "clips";

/**
 * Convert an AudioTimeline's phases (absolute startSec from clip start)
 * into ClipCatalogEntry phases (offsetSec = startSec within the clip).
 * Since for a single-clip timeline startSec IS the offset, this is a
 * rename + optional round passthrough.
 */
function timelineToClipPhases(timeline: AudioTimeline): ClipPhaseEntry[] {
  return timeline.phases.map((p) => {
    const entry: ClipPhaseEntry = {
      phase: p.phase as Phase,
      offsetSec: p.startSec,
    };
    if (typeof p.round === "number") entry.round = p.round;
    return entry;
  });
}

// The 30 (position × adversity) template definitions for the Phase 2 manifest.
// Keyed by position + adversity — NO `need`, opener is prepended by resolver.
// viz slug chosen by position; hm slug per cell mapping incl. goalie-pulled.
// FV-136: MVP default viz slugs — one "flagship" play per position, used until
// the v2 selection picker (FV-144) lets athletes choose. These point to discrete
// clips in clips-viz.ts; the old monolithic slugs ("viz-forward" etc.) remain
// in CLIP_SCRIPTS for backward compat but are no longer referenced here.
//
// Rationale for defaults:
//   Forward  → viz-forward-win-the-wall   (wall battle: most universal forward play)
//   Defense  → viz-defense-retrieval      (puck retrieval: first and most generic)
//   Goalie   → viz-goalie-track-and-save  (bread-and-butter: track + stop)
//   Guard    → viz-guard-pick-and-roll    (quintessential guard play)
//   Wing     → viz-wing-catch-and-shoot   (quintessential wing play)
//   Big      → viz-big-roll-and-finish    (quintessential big play)
//
// To swap a default: change the vizSlug string and re-run the generator.
// FV-144 (v2 picker) will make this per-session when the athlete selects.
const PHASE2_TEMPLATES: Array<{
  position: string;
  adversity: string;
  vizSlug: string;
  hmSlug: string;
}> = [
  // Forward × 10 adversities (FV-136: discrete viz-forward-win-the-wall default)
  { position: "Forward", adversity: "I feel nervous.",          vizSlug: "viz-forward-win-the-wall", hmSlug: "hm-forward-nervous" },
  { position: "Forward", adversity: "I miss a scoring chance.", vizSlug: "viz-forward-win-the-wall", hmSlug: "hm-forward-missed-chance" },
  { position: "Forward", adversity: "I turn the puck over.",    vizSlug: "viz-forward-win-the-wall", hmSlug: "hm-forward-turnover" },
  { position: "Forward", adversity: "I get beaten wide.",       vizSlug: "viz-forward-win-the-wall", hmSlug: "hm-forward-beaten-wide" },
  { position: "Forward", adversity: "I take a bad penalty.",    vizSlug: "viz-forward-win-the-wall", hmSlug: "hm-forward-bad-penalty" },
  { position: "Forward", adversity: "Coach yells.",             vizSlug: "viz-forward-win-the-wall", hmSlug: "hm-forward-coach-yells" },
  { position: "Forward", adversity: "I get benched.",           vizSlug: "viz-forward-win-the-wall", hmSlug: "hm-forward-benched" },
  { position: "Forward", adversity: "I get hit.",               vizSlug: "viz-forward-win-the-wall", hmSlug: "hm-forward-get-hit" },
  { position: "Forward", adversity: "I start slow.",            vizSlug: "viz-forward-win-the-wall", hmSlug: "hm-forward-start-slow" },
  { position: "Forward", adversity: "We give up the first goal.", vizSlug: "viz-forward-win-the-wall", hmSlug: "hm-forward-first-goal-against" },
  // Defense × 10 adversities (FV-136: discrete viz-defense-retrieval default)
  { position: "Defense", adversity: "I get beaten wide.",       vizSlug: "viz-defense-retrieval", hmSlug: "hm-defense-beaten-wide" },
  { position: "Defense", adversity: "I turn the puck over.",    vizSlug: "viz-defense-retrieval", hmSlug: "hm-defense-turnover" },
  { position: "Defense", adversity: "I miss a scoring chance.", vizSlug: "viz-defense-retrieval", hmSlug: "hm-defense-missed-chance" },
  { position: "Defense", adversity: "I take a bad penalty.",    vizSlug: "viz-defense-retrieval", hmSlug: "hm-defense-bad-penalty" },
  { position: "Defense", adversity: "Coach yells.",             vizSlug: "viz-defense-retrieval", hmSlug: "hm-defense-coach-yells" },
  { position: "Defense", adversity: "I get benched.",           vizSlug: "viz-defense-retrieval", hmSlug: "hm-defense-benched" },
  { position: "Defense", adversity: "I feel nervous.",          vizSlug: "viz-defense-retrieval", hmSlug: "hm-defense-nervous" },
  { position: "Defense", adversity: "I get hit.",               vizSlug: "viz-defense-retrieval", hmSlug: "hm-defense-get-hit" },
  { position: "Defense", adversity: "I start slow.",            vizSlug: "viz-defense-retrieval", hmSlug: "hm-defense-start-slow" },
  { position: "Defense", adversity: "We give up the first goal.", vizSlug: "viz-defense-retrieval", hmSlug: "hm-defense-first-goal-against" },
  // Goalie × 10 adversities (benched → pulled special case; FV-136: viz-goalie-track-and-save)
  { position: "Goalie", adversity: "Coach yells.",              vizSlug: "viz-goalie-track-and-save", hmSlug: "hm-goalie-coach-yells" },
  { position: "Goalie", adversity: "I turn the puck over.",     vizSlug: "viz-goalie-track-and-save", hmSlug: "hm-goalie-turnover" },
  { position: "Goalie", adversity: "I miss a scoring chance.",  vizSlug: "viz-goalie-track-and-save", hmSlug: "hm-goalie-missed-chance" },
  { position: "Goalie", adversity: "I get beaten wide.",        vizSlug: "viz-goalie-track-and-save", hmSlug: "hm-goalie-soft-goal" },
  { position: "Goalie", adversity: "I take a bad penalty.",     vizSlug: "viz-goalie-track-and-save", hmSlug: "hm-goalie-bad-penalty" },
  { position: "Goalie", adversity: "I get benched.",            vizSlug: "viz-goalie-track-and-save", hmSlug: "hm-goalie-pulled" },
  { position: "Goalie", adversity: "I feel nervous.",           vizSlug: "viz-goalie-track-and-save", hmSlug: "hm-goalie-nervous" },
  { position: "Goalie", adversity: "I get hit.",                vizSlug: "viz-goalie-track-and-save", hmSlug: "hm-goalie-get-hit" },
  { position: "Goalie", adversity: "I start slow.",             vizSlug: "viz-goalie-track-and-save", hmSlug: "hm-goalie-start-slow" },
  { position: "Goalie", adversity: "We give up the first goal.", vizSlug: "viz-goalie-track-and-save", hmSlug: "hm-goalie-first-goal-against" },
  // Basketball — Guard × 10 adversities (FV-113; FV-136: viz-guard-pick-and-roll)
  { position: "Guard", adversity: "I turn the ball over.",      vizSlug: "viz-guard-pick-and-roll", hmSlug: "hm-bb-guard-turnover" },
  { position: "Guard", adversity: "I miss an open shot.",       vizSlug: "viz-guard-pick-and-roll", hmSlug: "hm-bb-guard-missed-shot" },
  { position: "Guard", adversity: "I get cooked off the dribble.", vizSlug: "viz-guard-pick-and-roll", hmSlug: "hm-bb-guard-got-cooked" },
  { position: "Guard", adversity: "I get into foul trouble.",   vizSlug: "viz-guard-pick-and-roll", hmSlug: "hm-bb-guard-foul-trouble" },
  { position: "Guard", adversity: "Coach yells.",               vizSlug: "viz-guard-pick-and-roll", hmSlug: "hm-bb-guard-coach-yells" },
  { position: "Guard", adversity: "I get benched.",             vizSlug: "viz-guard-pick-and-roll", hmSlug: "hm-bb-guard-benched" },
  { position: "Guard", adversity: "I feel nervous.",            vizSlug: "viz-guard-pick-and-roll", hmSlug: "hm-bb-guard-nervous" },
  { position: "Guard", adversity: "I miss two free throws.",    vizSlug: "viz-guard-pick-and-roll", hmSlug: "hm-bb-guard-missed-fts" },
  { position: "Guard", adversity: "I start slow.",              vizSlug: "viz-guard-pick-and-roll", hmSlug: "hm-bb-guard-start-slow" },
  { position: "Guard", adversity: "We fall behind early.",      vizSlug: "viz-guard-pick-and-roll", hmSlug: "hm-bb-guard-fall-behind-early" },
  // Basketball — Wing × 10 adversities (FV-113; FV-136: viz-wing-catch-and-shoot)
  { position: "Wing", adversity: "I turn the ball over.",       vizSlug: "viz-wing-catch-and-shoot", hmSlug: "hm-bb-wing-turnover" },
  { position: "Wing", adversity: "I miss an open shot.",        vizSlug: "viz-wing-catch-and-shoot", hmSlug: "hm-bb-wing-missed-shot" },
  { position: "Wing", adversity: "I get cooked off the dribble.", vizSlug: "viz-wing-catch-and-shoot", hmSlug: "hm-bb-wing-got-cooked" },
  { position: "Wing", adversity: "I get into foul trouble.",    vizSlug: "viz-wing-catch-and-shoot", hmSlug: "hm-bb-wing-foul-trouble" },
  { position: "Wing", adversity: "Coach yells.",                vizSlug: "viz-wing-catch-and-shoot", hmSlug: "hm-bb-wing-coach-yells" },
  { position: "Wing", adversity: "I get benched.",              vizSlug: "viz-wing-catch-and-shoot", hmSlug: "hm-bb-wing-benched" },
  { position: "Wing", adversity: "I feel nervous.",             vizSlug: "viz-wing-catch-and-shoot", hmSlug: "hm-bb-wing-nervous" },
  { position: "Wing", adversity: "I miss two free throws.",     vizSlug: "viz-wing-catch-and-shoot", hmSlug: "hm-bb-wing-missed-fts" },
  { position: "Wing", adversity: "I start slow.",               vizSlug: "viz-wing-catch-and-shoot", hmSlug: "hm-bb-wing-start-slow" },
  { position: "Wing", adversity: "We fall behind early.",       vizSlug: "viz-wing-catch-and-shoot", hmSlug: "hm-bb-wing-fall-behind-early" },
  // Basketball — Big × 10 adversities (FV-113; benched → fouled-out; FV-136: viz-big-roll-and-finish)
  { position: "Big", adversity: "I turn the ball over.",        vizSlug: "viz-big-roll-and-finish", hmSlug: "hm-bb-big-turnover" },
  { position: "Big", adversity: "I miss an open shot.",         vizSlug: "viz-big-roll-and-finish", hmSlug: "hm-bb-big-missed-shot" },
  { position: "Big", adversity: "I get cooked off the dribble.", vizSlug: "viz-big-roll-and-finish", hmSlug: "hm-bb-big-got-cooked" },
  { position: "Big", adversity: "I get into foul trouble.",     vizSlug: "viz-big-roll-and-finish", hmSlug: "hm-bb-big-foul-trouble" },
  { position: "Big", adversity: "Coach yells.",                 vizSlug: "viz-big-roll-and-finish", hmSlug: "hm-bb-big-coach-yells" },
  { position: "Big", adversity: "I get benched.",               vizSlug: "viz-big-roll-and-finish", hmSlug: "hm-bb-big-fouled-out" },
  { position: "Big", adversity: "I feel nervous.",              vizSlug: "viz-big-roll-and-finish", hmSlug: "hm-bb-big-nervous" },
  { position: "Big", adversity: "I miss two free throws.",      vizSlug: "viz-big-roll-and-finish", hmSlug: "hm-bb-big-missed-fts" },
  { position: "Big", adversity: "I start slow.",                vizSlug: "viz-big-roll-and-finish", hmSlug: "hm-bb-big-start-slow" },
  { position: "Big", adversity: "We fall behind early.",        vizSlug: "viz-big-roll-and-finish", hmSlug: "hm-bb-big-fall-behind-early" },
  // Golf — compositional-only (no baked composite): viz-{profile} + hm-glf-{profile}-{frag} (FV-266).
  // All 30 cells rendered for grid parity; the 3 first-tee cells are withheld
  // from the athlete picker via GOLF_CONFIG.roleAdversities (clinical gate).
  // Bomber × 10
  { position: "Bomber", adversity: "I three-putt.",                   vizSlug: "viz-bomber", hmSlug: "hm-glf-bomber-three-putt" },
  { position: "Bomber", adversity: "I have a blow-up hole.",          vizSlug: "viz-bomber", hmSlug: "hm-glf-bomber-blow-up" },
  { position: "Bomber", adversity: "I hit it OB.",                    vizSlug: "viz-bomber", hmSlug: "hm-glf-bomber-ob" },
  { position: "Bomber", adversity: "I duff a short-game shot.",       vizSlug: "viz-bomber", hmSlug: "hm-glf-bomber-duff-chip" },
  { position: "Bomber", adversity: "I miss a short putt.",            vizSlug: "viz-bomber", hmSlug: "hm-glf-bomber-short-putt" },
  { position: "Bomber", adversity: "My swing leaves me on the first tee.", vizSlug: "viz-bomber", hmSlug: "hm-glf-bomber-first-tee" },
  { position: "Bomber", adversity: "I get outplayed in my group.",    vizSlug: "viz-bomber", hmSlug: "hm-glf-bomber-outplayed" },
  { position: "Bomber", adversity: "I feel nervous.",                 vizSlug: "viz-bomber", hmSlug: "hm-glf-bomber-nervous" },
  { position: "Bomber", adversity: "I start slow.",                   vizSlug: "viz-bomber", hmSlug: "hm-glf-bomber-start-slow" },
  { position: "Bomber", adversity: "I fall behind the number.",       vizSlug: "viz-bomber", hmSlug: "hm-glf-bomber-fall-behind" },
  // Ball-Striker × 10
  { position: "Ball-Striker", adversity: "I three-putt.",             vizSlug: "viz-ballstriker", hmSlug: "hm-glf-ballstriker-three-putt" },
  { position: "Ball-Striker", adversity: "I have a blow-up hole.",    vizSlug: "viz-ballstriker", hmSlug: "hm-glf-ballstriker-blow-up" },
  { position: "Ball-Striker", adversity: "I hit it OB.",              vizSlug: "viz-ballstriker", hmSlug: "hm-glf-ballstriker-ob" },
  { position: "Ball-Striker", adversity: "I duff a short-game shot.", vizSlug: "viz-ballstriker", hmSlug: "hm-glf-ballstriker-duff-chip" },
  { position: "Ball-Striker", adversity: "I miss a short putt.",      vizSlug: "viz-ballstriker", hmSlug: "hm-glf-ballstriker-short-putt" },
  { position: "Ball-Striker", adversity: "My swing leaves me on the first tee.", vizSlug: "viz-ballstriker", hmSlug: "hm-glf-ballstriker-first-tee" },
  { position: "Ball-Striker", adversity: "I get outplayed in my group.", vizSlug: "viz-ballstriker", hmSlug: "hm-glf-ballstriker-outplayed" },
  { position: "Ball-Striker", adversity: "I feel nervous.",           vizSlug: "viz-ballstriker", hmSlug: "hm-glf-ballstriker-nervous" },
  { position: "Ball-Striker", adversity: "I start slow.",             vizSlug: "viz-ballstriker", hmSlug: "hm-glf-ballstriker-start-slow" },
  { position: "Ball-Striker", adversity: "I fall behind the number.", vizSlug: "viz-ballstriker", hmSlug: "hm-glf-ballstriker-fall-behind" },
  // Scrambler × 10
  { position: "Scrambler", adversity: "I three-putt.",                vizSlug: "viz-scrambler", hmSlug: "hm-glf-scrambler-three-putt" },
  { position: "Scrambler", adversity: "I have a blow-up hole.",       vizSlug: "viz-scrambler", hmSlug: "hm-glf-scrambler-blow-up" },
  { position: "Scrambler", adversity: "I hit it OB.",                 vizSlug: "viz-scrambler", hmSlug: "hm-glf-scrambler-ob" },
  { position: "Scrambler", adversity: "I duff a short-game shot.",    vizSlug: "viz-scrambler", hmSlug: "hm-glf-scrambler-duff-chip" },
  { position: "Scrambler", adversity: "I miss a short putt.",         vizSlug: "viz-scrambler", hmSlug: "hm-glf-scrambler-short-putt" },
  { position: "Scrambler", adversity: "My swing leaves me on the first tee.", vizSlug: "viz-scrambler", hmSlug: "hm-glf-scrambler-first-tee" },
  { position: "Scrambler", adversity: "I get outplayed in my group.", vizSlug: "viz-scrambler", hmSlug: "hm-glf-scrambler-outplayed" },
  { position: "Scrambler", adversity: "I feel nervous.",              vizSlug: "viz-scrambler", hmSlug: "hm-glf-scrambler-nervous" },
  { position: "Scrambler", adversity: "I start slow.",                vizSlug: "viz-scrambler", hmSlug: "hm-glf-scrambler-start-slow" },
  { position: "Scrambler", adversity: "I fall behind the number.",    vizSlug: "viz-scrambler", hmSlug: "hm-glf-scrambler-fall-behind" },
  // Football × 7 roles (FV-206 go-live; canonical adversity keys, module map §3/§5.
  // Reroutes mirror cellSlugFor: QB turnover/trench→pick, QB benched→pulled,
  //  OL/DL turnover→their trench-battle, RB turnover→fumble. big-hit rows exist
  //  for grid parity but the adversity is picker-WITHHELD (§6 clinical gate).
  //  Default vizSlug = one discrete positive play per role (FV-136 pattern);
  //  athlete picks replace it at runtime (FV-144).
  { position: "QB", adversity: "I turn the ball over.", vizSlug: "viz-ftb-qb-rhythm-throw", hmSlug: "hm-ftb-qb-pick" },
  { position: "QB", adversity: "I get beat.", vizSlug: "viz-ftb-qb-rhythm-throw", hmSlug: "hm-ftb-qb-beat" },
  { position: "QB", adversity: "I make a mistake on film.", vizSlug: "viz-ftb-qb-rhythm-throw", hmSlug: "hm-ftb-qb-film-mistake" },
  { position: "QB", adversity: "I give up the big play.", vizSlug: "viz-ftb-qb-rhythm-throw", hmSlug: "hm-ftb-qb-big-play" },
  { position: "QB", adversity: "I get benched.", vizSlug: "viz-ftb-qb-rhythm-throw", hmSlug: "hm-ftb-qb-pulled" },
  { position: "QB", adversity: "I feel nervous.", vizSlug: "viz-ftb-qb-rhythm-throw", hmSlug: "hm-ftb-qb-nervous" },
  { position: "QB", adversity: "I take a big hit.", vizSlug: "viz-ftb-qb-rhythm-throw", hmSlug: "hm-ftb-qb-big-hit" },
  { position: "QB", adversity: "I start slow.", vizSlug: "viz-ftb-qb-rhythm-throw", hmSlug: "hm-ftb-qb-start-slow" },
  { position: "QB", adversity: "We fall behind early.", vizSlug: "viz-ftb-qb-rhythm-throw", hmSlug: "hm-ftb-qb-fall-behind-early" },
  { position: "QB", adversity: "I lose a battle in the trenches.", vizSlug: "viz-ftb-qb-rhythm-throw", hmSlug: "hm-ftb-qb-pick" },
  { position: "RB", adversity: "I turn the ball over.", vizSlug: "viz-ftb-rb-inside-zone", hmSlug: "hm-ftb-rb-fumble" },
  { position: "RB", adversity: "I get beat.", vizSlug: "viz-ftb-rb-inside-zone", hmSlug: "hm-ftb-rb-beat" },
  { position: "RB", adversity: "I make a mistake on film.", vizSlug: "viz-ftb-rb-inside-zone", hmSlug: "hm-ftb-rb-film-mistake" },
  { position: "RB", adversity: "I give up the big play.", vizSlug: "viz-ftb-rb-inside-zone", hmSlug: "hm-ftb-rb-big-play" },
  { position: "RB", adversity: "I get benched.", vizSlug: "viz-ftb-rb-inside-zone", hmSlug: "hm-ftb-rb-benched" },
  { position: "RB", adversity: "I feel nervous.", vizSlug: "viz-ftb-rb-inside-zone", hmSlug: "hm-ftb-rb-nervous" },
  { position: "RB", adversity: "I take a big hit.", vizSlug: "viz-ftb-rb-inside-zone", hmSlug: "hm-ftb-rb-big-hit" },
  { position: "RB", adversity: "I start slow.", vizSlug: "viz-ftb-rb-inside-zone", hmSlug: "hm-ftb-rb-start-slow" },
  { position: "RB", adversity: "We fall behind early.", vizSlug: "viz-ftb-rb-inside-zone", hmSlug: "hm-ftb-rb-fall-behind-early" },
  { position: "RB", adversity: "I lose a battle in the trenches.", vizSlug: "viz-ftb-rb-inside-zone", hmSlug: "hm-ftb-rb-trench-battle" },
  { position: "WR", adversity: "I turn the ball over.", vizSlug: "viz-ftb-wr-beat-the-press", hmSlug: "hm-ftb-wr-turnover" },
  { position: "WR", adversity: "I get beat.", vizSlug: "viz-ftb-wr-beat-the-press", hmSlug: "hm-ftb-wr-beat" },
  { position: "WR", adversity: "I make a mistake on film.", vizSlug: "viz-ftb-wr-beat-the-press", hmSlug: "hm-ftb-wr-film-mistake" },
  { position: "WR", adversity: "I give up the big play.", vizSlug: "viz-ftb-wr-beat-the-press", hmSlug: "hm-ftb-wr-big-play" },
  { position: "WR", adversity: "I get benched.", vizSlug: "viz-ftb-wr-beat-the-press", hmSlug: "hm-ftb-wr-benched" },
  { position: "WR", adversity: "I feel nervous.", vizSlug: "viz-ftb-wr-beat-the-press", hmSlug: "hm-ftb-wr-nervous" },
  { position: "WR", adversity: "I take a big hit.", vizSlug: "viz-ftb-wr-beat-the-press", hmSlug: "hm-ftb-wr-big-hit" },
  { position: "WR", adversity: "I start slow.", vizSlug: "viz-ftb-wr-beat-the-press", hmSlug: "hm-ftb-wr-start-slow" },
  { position: "WR", adversity: "We fall behind early.", vizSlug: "viz-ftb-wr-beat-the-press", hmSlug: "hm-ftb-wr-fall-behind-early" },
  { position: "WR", adversity: "I lose a battle in the trenches.", vizSlug: "viz-ftb-wr-beat-the-press", hmSlug: "hm-ftb-wr-trench-battle" },
  { position: "OL", adversity: "I turn the ball over.", vizSlug: "viz-ftb-ol-drive-block", hmSlug: "hm-ftb-ol-trench-battle" },
  { position: "OL", adversity: "I get beat.", vizSlug: "viz-ftb-ol-drive-block", hmSlug: "hm-ftb-ol-beat" },
  { position: "OL", adversity: "I make a mistake on film.", vizSlug: "viz-ftb-ol-drive-block", hmSlug: "hm-ftb-ol-film-mistake" },
  { position: "OL", adversity: "I give up the big play.", vizSlug: "viz-ftb-ol-drive-block", hmSlug: "hm-ftb-ol-big-play" },
  { position: "OL", adversity: "I get benched.", vizSlug: "viz-ftb-ol-drive-block", hmSlug: "hm-ftb-ol-benched" },
  { position: "OL", adversity: "I feel nervous.", vizSlug: "viz-ftb-ol-drive-block", hmSlug: "hm-ftb-ol-nervous" },
  { position: "OL", adversity: "I take a big hit.", vizSlug: "viz-ftb-ol-drive-block", hmSlug: "hm-ftb-ol-big-hit" },
  { position: "OL", adversity: "I start slow.", vizSlug: "viz-ftb-ol-drive-block", hmSlug: "hm-ftb-ol-start-slow" },
  { position: "OL", adversity: "We fall behind early.", vizSlug: "viz-ftb-ol-drive-block", hmSlug: "hm-ftb-ol-fall-behind-early" },
  { position: "OL", adversity: "I lose a battle in the trenches.", vizSlug: "viz-ftb-ol-drive-block", hmSlug: "hm-ftb-ol-trench-battle" },
  { position: "DL", adversity: "I turn the ball over.", vizSlug: "viz-ftb-dl-get-off", hmSlug: "hm-ftb-dl-trench-battle" },
  { position: "DL", adversity: "I get beat.", vizSlug: "viz-ftb-dl-get-off", hmSlug: "hm-ftb-dl-beat" },
  { position: "DL", adversity: "I make a mistake on film.", vizSlug: "viz-ftb-dl-get-off", hmSlug: "hm-ftb-dl-film-mistake" },
  { position: "DL", adversity: "I give up the big play.", vizSlug: "viz-ftb-dl-get-off", hmSlug: "hm-ftb-dl-big-play" },
  { position: "DL", adversity: "I get benched.", vizSlug: "viz-ftb-dl-get-off", hmSlug: "hm-ftb-dl-benched" },
  { position: "DL", adversity: "I feel nervous.", vizSlug: "viz-ftb-dl-get-off", hmSlug: "hm-ftb-dl-nervous" },
  { position: "DL", adversity: "I take a big hit.", vizSlug: "viz-ftb-dl-get-off", hmSlug: "hm-ftb-dl-big-hit" },
  { position: "DL", adversity: "I start slow.", vizSlug: "viz-ftb-dl-get-off", hmSlug: "hm-ftb-dl-start-slow" },
  { position: "DL", adversity: "We fall behind early.", vizSlug: "viz-ftb-dl-get-off", hmSlug: "hm-ftb-dl-fall-behind-early" },
  { position: "DL", adversity: "I lose a battle in the trenches.", vizSlug: "viz-ftb-dl-get-off", hmSlug: "hm-ftb-dl-trench-battle" },
  { position: "LB", adversity: "I turn the ball over.", vizSlug: "viz-ftb-lb-read-and-fill", hmSlug: "hm-ftb-lb-turnover" },
  { position: "LB", adversity: "I get beat.", vizSlug: "viz-ftb-lb-read-and-fill", hmSlug: "hm-ftb-lb-beat" },
  { position: "LB", adversity: "I make a mistake on film.", vizSlug: "viz-ftb-lb-read-and-fill", hmSlug: "hm-ftb-lb-film-mistake" },
  { position: "LB", adversity: "I give up the big play.", vizSlug: "viz-ftb-lb-read-and-fill", hmSlug: "hm-ftb-lb-big-play" },
  { position: "LB", adversity: "I get benched.", vizSlug: "viz-ftb-lb-read-and-fill", hmSlug: "hm-ftb-lb-benched" },
  { position: "LB", adversity: "I feel nervous.", vizSlug: "viz-ftb-lb-read-and-fill", hmSlug: "hm-ftb-lb-nervous" },
  { position: "LB", adversity: "I take a big hit.", vizSlug: "viz-ftb-lb-read-and-fill", hmSlug: "hm-ftb-lb-big-hit" },
  { position: "LB", adversity: "I start slow.", vizSlug: "viz-ftb-lb-read-and-fill", hmSlug: "hm-ftb-lb-start-slow" },
  { position: "LB", adversity: "We fall behind early.", vizSlug: "viz-ftb-lb-read-and-fill", hmSlug: "hm-ftb-lb-fall-behind-early" },
  { position: "LB", adversity: "I lose a battle in the trenches.", vizSlug: "viz-ftb-lb-read-and-fill", hmSlug: "hm-ftb-lb-trench-battle" },
  { position: "DB", adversity: "I turn the ball over.", vizSlug: "viz-ftb-db-press-man", hmSlug: "hm-ftb-db-turnover" },
  { position: "DB", adversity: "I get beat.", vizSlug: "viz-ftb-db-press-man", hmSlug: "hm-ftb-db-beat" },
  { position: "DB", adversity: "I make a mistake on film.", vizSlug: "viz-ftb-db-press-man", hmSlug: "hm-ftb-db-film-mistake" },
  { position: "DB", adversity: "I give up the big play.", vizSlug: "viz-ftb-db-press-man", hmSlug: "hm-ftb-db-big-play" },
  { position: "DB", adversity: "I get benched.", vizSlug: "viz-ftb-db-press-man", hmSlug: "hm-ftb-db-benched" },
  { position: "DB", adversity: "I feel nervous.", vizSlug: "viz-ftb-db-press-man", hmSlug: "hm-ftb-db-nervous" },
  { position: "DB", adversity: "I take a big hit.", vizSlug: "viz-ftb-db-press-man", hmSlug: "hm-ftb-db-big-hit" },
  { position: "DB", adversity: "I start slow.", vizSlug: "viz-ftb-db-press-man", hmSlug: "hm-ftb-db-start-slow" },
  { position: "DB", adversity: "We fall behind early.", vizSlug: "viz-ftb-db-press-man", hmSlug: "hm-ftb-db-fall-behind-early" },
  { position: "DB", adversity: "I lose a battle in the trenches.", vizSlug: "viz-ftb-db-press-man", hmSlug: "hm-ftb-db-trench-battle" },
];

async function generateClips(flags: Flags, bookData: Map<string, BookEntry>): Promise<void> {
  const baseDir = resolve(process.cwd(), DEFAULT_OUT_DIR);
  const clipsDir = join(baseDir, CLIPS_SUBDIR);
  await mkdir(clipsDir, { recursive: true });

  // ── Targeted render (FV-401) ──────────────────────────────────────────
  // targetSlugs === null → bare `--mode clips`, unchanged full-catalog behavior.
  // targetSlugs !== null → only these slugs are rendered/re-rendered; every
  // other clip's manifest entry is carried over verbatim from the existing
  // manifest.json (no re-probe, no touch), so scripts outside the target set
  // — including any unrendered dormant v2-track clip — are never visited by
  // the render loop at all.
  const targetSlugs = flags.slugs.length > 0 ? new Set(flags.slugs) : null;

  let baselineCatalog: ClipManifest["clips"] = {};
  if (targetSlugs) {
    const manifestPath0 = join(clipsDir, "manifest.json");
    if (!existsSync(manifestPath0)) {
      console.error(
        `[clips] --slug targeted render requires an existing ${manifestPath0} to seed the baseline catalog from (none found). ` +
        `Run a full \`--mode clips\` render first, or omit --slug to render the full catalog.`,
      );
      process.exit(1);
    }
    const raw = await readFile(manifestPath0, "utf8");
    baselineCatalog = (JSON.parse(raw) as ClipManifest).clips;
    const unknown = [...targetSlugs].filter(
      (slug) => !CLIP_SCRIPTS.some((s) => s.slug === slug) && !OPENER_SLUGS.includes(slug as (typeof OPENER_SLUGS)[number]),
    );
    if (unknown.length > 0) {
      console.error(`[clips] --slug targeted render: unknown slug(s), not in CLIP_SCRIPTS or OPENER_SLUGS: ${unknown.join(", ")}`);
      process.exit(1);
    }
    console.log(`[clips] Targeted render (FV-401): ${[...targetSlugs].join(", ")}`);
    console.log(`[clips] All other clips reuse their existing manifest.json entries untouched.`);
  }

  const clipScriptsToProcess = targetSlugs
    ? CLIP_SCRIPTS.filter((s) => targetSlugs.has(s.slug))
    : CLIP_SCRIPTS;
  const openerSlugsToProcess = targetSlugs
    ? OPENER_SLUGS.filter((s) => targetSlugs.has(s))
    : OPENER_SLUGS;

  const totalChars = clipScriptsToProcess.reduce((n, s) => n + totalSpeechChars(s), 0);
  const cost = estimateCostUsd(totalChars);
  console.log(
    `[clips] Phase 2 — ${clipScriptsToProcess.length} TTS clip scripts + ${openerSlugsToProcess.length} loudnorm opener passes.`,
  );
  console.log(
    `[clips] TTS chars: ${totalChars}, est. $${cost.toFixed(4)}.`,
  );

  if (flags.dryRun) {
    console.log("\n--dry-run: validating clip scripts, no API calls.");
    for (const s of clipScriptsToProcess) {
      console.log(
        `  ${s.slug}: ${s.segments.length} segs, ${speechSegmentCount(s)} speech, ${totalSpeechChars(s)} chars`,
      );
    }
    for (const slug of OPENER_SLUGS) {
      if (targetSlugs && !targetSlugs.has(slug)) continue;
      const src = join(baseDir, `${slug}.mp3`);
      const exists = existsSync(src);
      console.log(
        `  ${slug}: loudnorm pass from top-level (no TTS)${exists ? "" : " — WARNING: source not found"}`,
      );
    }
    console.log(`\n[clips] Templates: ${PHASE2_TEMPLATES.length}`);
    if (targetSlugs) {
      console.log(`\n[clips] Targeted dry-run — ${targetSlugs.size} slug(s) would render; all others reused from manifest.json.`);
    } else {
      console.log(
        `[clips] Catalog will have: ${CLIP_SCRIPTS.length} TTS + ${OPENER_SLUGS.length} openers = ` +
        `${CLIP_SCRIPTS.length + OPENER_SLUGS.length} total entries (240 expected: 183 + 3 prayer clips + 52 viz + 2 cue-word pre, templates: 60)`,
      );
    }
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error(
      "\nOPENAI_API_KEY is not set. Add it to apps/web/.env.local:\n  OPENAI_API_KEY=sk-...\nthen re-run.",
    );
    process.exit(1);
  }

  // Collect manifest data as we go. Seeded from the baseline catalog in
  // targeted mode so untouched slugs keep their exact existing entries.
  // clips catalog: slug → { url, durationSec, phases }
  const catalog: ClipManifest["clips"] = { ...baselineCatalog };

  // ── Step 1: Render TTS clip scripts in batches of ≤10 to limit quota exposure.
  // clearSilenceCache() is called before each clip so the silence cache doesn't
  // carry stale paths from a previous clip's work dir (deleted after each clip).
  const clipsFlags: Flags = { ...flags, outDir: join(DEFAULT_OUT_DIR, CLIPS_SUBDIR) };

  // Batch TTS scripts in groups of ≤10. If a 429/quota error hits mid-batch,
  // the generator exits with the completed clips written and the remaining
  // slugs printed so the run can resume with --slug targeting.
  const BATCH_SIZE = 10;
  const batches: AudioScript[][] = [];
  for (let i = 0; i < clipScriptsToProcess.length; i += BATCH_SIZE) {
    batches.push(clipScriptsToProcess.slice(i, i + BATCH_SIZE));
  }

  const completedSlugs: string[] = [];
  const remainingSlugs: string[] = [];

  console.log(
    `\n[clips] Rendering ${clipScriptsToProcess.length} TTS scripts in ${batches.length} batches of ≤${BATCH_SIZE}.`,
  );

  let batchIndex = 0;
  batchLoop:
  for (const batch of batches) {
    batchIndex++;
    const batchSlugs = batch.map((s) => s.slug).join(", ");
    console.log(`\n[clips] Batch ${batchIndex}/${batches.length}: ${batchSlugs}`);

    for (const script of batch) {
      // Skip if a content-addressed clip already exists on disk (resume support).
      // With FV-142 hashed filenames, the resume check is: does any file matching
      // <slug>.<8hex>.mp3 exist? We no longer look for the plain <slug>.mp3.
      //
      // FV-401: a targeted slug (--slug) is force-rendered even if a hashed file
      // already exists — generateOne()'s own stale-hashed-file cleanup (see its
      // step 4) deletes the old hash and replaces it, so no manual pre-deletion
      // is needed here.
      const isTargeted = targetSlugs?.has(script.slug) ?? false;
      const existingHashedMp3 = isTargeted ? null : await findHashedMp3(clipsDir, script.slug);
      if (existingHashedMp3) {
        const existingHash8 = existingHashedMp3.replace(/^.*\.([0-9a-f]{8})\.mp3$/, "$1");
        console.log(`  [skip] ${script.slug}.${existingHash8}.mp3 already exists — skipping (resume).`);
        const jsonPath = join(clipsDir, `${script.slug}.json`);
        if (existsSync(jsonPath)) {
          // Preferred path: read the sidecar timeline for exact duration + phases.
          const rawJson = await readFile(jsonPath, "utf8");
          const timeline = JSON.parse(rawJson) as AudioTimeline;
          catalog[script.slug] = {
            url: `/audio/pregame/${CLIPS_SUBDIR}/${script.slug}.${existingHash8}.mp3`,
            durationSec: timeline.durationSec,
            phases: timelineToClipPhases(timeline),
          };
        } else {
          // Fallback: no sidecar (e.g. short personalization clips committed
          // before sidecar generation was added). Probe the MP3 for duration
          // and derive phases from the script's segment marks.
          const dur = await probeDurationSec(existingHashedMp3);
          const phaseMarks: ClipPhaseEntry[] = [];
          let cursor = 0;
          for (const seg of script.segments) {
            if (seg.mark) {
              phaseMarks.push({ phase: seg.mark.phase as Phase, offsetSec: cursor });
            }
            // We don't know exact per-segment durations without TTS, so
            // phase offsets are approximations. For clips with no phase marks
            // (anc, st, cw, pp) this produces an empty phases array, which is
            // the correct catalog value (phases: []).
            break; // Only the first mark is at offset 0; remaining are unknown.
          }
          catalog[script.slug] = {
            url: `/audio/pregame/${CLIPS_SUBDIR}/${script.slug}.${existingHash8}.mp3`,
            durationSec: Math.round(dur * 1000) / 1000,
            phases: phaseMarks.length > 0 ? phaseMarks : [],
          };
        }
        completedSlugs.push(script.slug);
        continue;
      }

      clearSilenceCache();
      let renderResult: { hash8: string } | null = null;
      try {
        renderResult = await generateOne(script, clipsFlags, bookData);
      } catch (err) {
        const msg = (err as Error).message;
        const isQuota = msg.includes("429") || msg.includes("quota") || msg.includes("insufficient");
        if (isQuota) {
          console.error(
            `\n[clips] QUOTA LIMIT hit on ${script.slug}.\n` +
            `  Completed: ${completedSlugs.join(", ") || "(none)"}\n` +
            `  Remaining: ${script.slug}, ` +
            clipScriptsToProcess.slice(clipScriptsToProcess.indexOf(script) + 1)
              .map((s) => s.slug)
              .join(", ") + "\n" +
            `  Top up the OpenAI quota then resume — already-generated clips are\n` +
            `  written to disk and will be skipped on next run (resume support).`,
          );
        } else {
          console.error(`\n[clips] Failed on ${script.slug}: ${msg}`);
        }
        // Mark all remaining as not done.
        const failIdx = clipScriptsToProcess.indexOf(script);
        for (let i = failIdx; i < clipScriptsToProcess.length; i++) {
          remainingSlugs.push(clipScriptsToProcess[i]!.slug);
        }
        break batchLoop;
      }

      // Read back sidecar timeline to build catalog.
      // renderResult.hash8 is the content-hash of the newly-written file.
      // In --mode clips generateOne() always returns { hash8 } or throws, so the
      // "00000000" fallback is unreachable here; it exists only to satisfy the
      // type. If it ever appears in a catalog URL, treat it as a generator bug.
      const renderedHash8 = renderResult?.hash8 ?? "00000000";
      const jsonPath = join(clipsDir, `${script.slug}.json`);
      const rawJson = await readFile(jsonPath, "utf8");
      const timeline = JSON.parse(rawJson) as AudioTimeline;
      catalog[script.slug] = {
        url: `/audio/pregame/${CLIPS_SUBDIR}/${script.slug}.${renderedHash8}.mp3`,
        durationSec: timeline.durationSec,
        phases: timelineToClipPhases(timeline),
      };
      completedSlugs.push(script.slug);
    }
  }

  if (remainingSlugs.length > 0) {
    console.error(
      `\n[clips] Aborted — ${remainingSlugs.length} clips not generated.\n` +
      `  Re-run after topping up quota; completed clips are on disk and will be skipped.`,
    );
    process.exit(1);
  }

  // ── Step 2: Opener MP3s → clips/opener-*.mp3 (level-match -16 LUFS).
  //
  // Each opener is processed by comparing its book prose (from .md books, already
  // loaded in `bookProse`) to the source AudioScript's speech texts (from SCRIPTS):
  //
  //   - MATCHES source prose → fast loudnorm-pass of the existing top-level
  //     opener-*.mp3 (no re-TTS, no churn). Same resume behavior as before.
  //   - DIFFERS from source prose (KC edited the .md book) → re-TTS that opener
  //     from the book prose (same pipeline as CLIP_SCRIPTS), then apply loudnorm.
  //     The stale clips/<slug>.<hash8>.mp3 is removed so the updated one takes over.
  //
  // This means unedited openers are byte-stable (no MANIFEST_VERSION churn) and
  // edited openers actually change. The count-mismatch guard runs for edited openers.
  //
  // Resume support (FV-123): if a hashed clips/<slug>.<hash8>.mp3 already exists AND
  // the opener has NOT been edited in the books, REUSE it (skip re-encode). If the
  // opener HAS been edited, the existing hashed file is stale and is deleted so the
  // new re-TTS render replaces it.
  const loudnormFilter = "loudnorm=I=-16:TP=-1.5:LRA=11";

  // Build a slug→AudioScript map for the openers (for prose comparison).
  const openerScriptMap = new Map<string, AudioScript>();
  for (const s of SCRIPTS) {
    if (s.slug.startsWith("opener-")) {
      openerScriptMap.set(s.slug, s);
    }
  }

  console.log(`\n[clips] Processing ${openerSlugsToProcess.length} opener MP3s (loudnorm or re-TTS if edited)...`);

  for (const slug of OPENER_SLUGS) {
    // FV-401: targeted render — skip openers outside the target set entirely;
    // their baseline catalog entry (seeded above) is left untouched.
    if (targetSlugs && !targetSlugs.has(slug)) continue;
    const openerSrc = join(baseDir, `${slug}.mp3`);
    const existingHashedOpener = await findHashedMp3(clipsDir, slug);

    // Check if book prose differs from source (edit detection).
    const openerScript = openerScriptMap.get(slug);
    const bookEntry = bookData.get(slug);
    const bookLines = bookEntry?.lines;
    let bookEdited = false;
    if (openerScript && bookLines) {
      const sourceSpeechTexts = openerScript.segments
        .filter((s): s is Extract<Segment, { type: "speech" }> => s.type === "speech")
        .map((s) => s.text);
      // Count-mismatch guard: same as applyBookProseOverrides
      if (bookLines.length !== sourceSpeechTexts.length) {
        console.error(
          `[opener] MISMATCH for "${slug}": .md book has ${bookLines.length} speech lines, ` +
          `source has ${sourceSpeechTexts.length} speech segments. Fix before rendering.`,
        );
        process.exit(1);
      }
      bookEdited = bookLines.some((line, i) => line !== sourceSpeechTexts[i]);
    }

    let openerHashedPath: string;

    if (existingHashedOpener && !bookEdited) {
      // Unedited + already loudnorm-passed → reuse.
      console.log(`  [skip] ${slug} unedited + already loudnorm-passed — reusing (resume).`);
      openerHashedPath = existingHashedOpener;
    } else if (bookEdited) {
      // Book prose differs → re-TTS, then loudnorm.
      console.log(`\n── ${slug} (book edited → re-TTS + loudnorm) ──────────────────`);
      if (!openerScript) {
        console.error(`  ERROR: no AudioScript found for edited opener "${slug}".`);
        process.exit(1);
      }
      // Remove stale hashed file (if any) so the new render replaces it.
      if (existingHashedOpener) {
        await rm(existingHashedOpener, { force: true });
        console.log(`  Removed stale ${existingHashedOpener}`);
      }
      // Re-TTS into top-level opener-*.mp3 (same location as legacy TTS render).
      clearSilenceCache();
      const ttsFlags: Flags = { ...flags, outDir: DEFAULT_OUT_DIR, mode: undefined };
      await generateOne(openerScript, ttsFlags, bookData);
      // Now loudnorm-pass the freshly-TTS'd file to clips/.
      const tempPath = join(clipsDir, `${slug}.mp3`);
      await reEncodeMp3(openerSrc, tempPath, loudnormFilter);
      const openerHash8 = await hash8OfFile(tempPath);
      openerHashedPath = join(clipsDir, `${slug}.${openerHash8}.mp3`);
      await rename(tempPath, openerHashedPath);
    } else {
      // Unedited + no existing clip → loudnorm-pass from top-level source.
      if (!existsSync(openerSrc)) {
        console.error(
          `  ERROR: ${openerSrc} not found. Run the legacy path first to generate ${slug}.mp3.`,
        );
        process.exit(1);
      }
      console.log(`\n── ${slug} (loudnorm pass) ───────────────────`);
      const tempPath = join(clipsDir, `${slug}.mp3`);
      await reEncodeMp3(openerSrc, tempPath, loudnormFilter);
      const openerHash8 = await hash8OfFile(tempPath);
      openerHashedPath = join(clipsDir, `${slug}.${openerHash8}.mp3`);
      await rename(tempPath, openerHashedPath);
    }

    const openerHash8ForUrl = openerHashedPath.replace(/^.*\.([0-9a-f]{8})\.mp3$/, "$1");
    const openerDur = await probeDurationSec(openerHashedPath);
    catalog[slug] = {
      url: `/audio/pregame/${CLIPS_SUBDIR}/${slug}.${openerHash8ForUrl}.mp3`,
      durationSec: Math.round(openerDur * 1000) / 1000,
      phases: [{ phase: "intro", offsetSec: 0 }],
    };
  }

  // ── Step 3: Write Phase 3 manifest.json (version "p3").
  // Templates: 30 entries keyed by (position × adversity) ONLY — no `need`,
  // no opener in clips list. Opener is prepended by resolver per-need.
  // Phase 3b adds personalization sentinels at lean-structure positions:
  //   {{anchor}} {{selfTalk}} {{cueReset}} after the hm clip;
  //   {{cueSendoff}} between shared-prayer and shared-sendoff.
  // The resolver in audio-playlist.ts substitutes these with the athlete's
  // chosen anchor/self-talk/cue-word slugs, dropping them gracefully if absent.
  const templates = PHASE2_TEMPLATES.map((t) => {
    return {
      position: t.position,
      adversity: t.adversity,
      clips: [
        "shared-opening",
        t.vizSlug,
        t.hmSlug,
        "{{anchor}}",
        "{{selfTalk}}",
        "{{cueReset}}",
        "shared-reset-plan",
        "shared-prayer",
        "{{cueSendoff}}",
        "shared-sendoff",
      ],
    };
  });

  // Pre-practice "Lock In" — sport-keyed state-aware playlist (FV-30, p6).
  // practiceState is keyed by sport then by state:
  //   practiceState[sport][state] = shared-tail slug list (Beats 2–6, no opener/focus).
  // The opener and focus clip are resolved at runtime by resolvePracticePlaylist.
  // Beat 4 lead/tail sandwich the injected focus clip; the resolver detects
  // pp-choose-focus-lead and injects the sport-specific focus slug immediately after it.
  //
  // pp-choose-focus-lead and pp-choose-focus-tail are sport-neutral and shared.
  // Hockey Beats 2/3/5/6 use the pp-* slugs; basketball uses the pp-bb-* variants.
  const hockeySharedTail = [
    "pp-name-standard",
    "pp-goal-fusion",
    "pp-choose-focus-lead",
    // focus clip injected by resolver between lead and tail
    "pp-choose-focus-tail",
    "pp-be-vocal",
    "pp-see-it-go",
  ];

  const basketballSharedTail = [
    "pp-bb-name-standard",
    "pp-bb-goal-fusion",
    "pp-choose-focus-lead",
    // focus clip injected by resolver between lead and tail
    "pp-choose-focus-tail",
    "pp-bb-be-vocal",
    "pp-bb-see-it-go",
  ];

  // Golf Beats 2/3/5/6 — Beat 5 is pp-golf-full-routine (routine-discipline;
  // golf is individual so baseball's team "be-vocal" doesn't transfer). FV-267.
  const golfSharedTail = [
    "pp-golf-name-standard",
    "pp-golf-goal-fusion",
    "pp-choose-focus-lead",
    // focus clip injected by resolver between lead and tail
    "pp-choose-focus-tail",
    "pp-golf-full-routine",
    "pp-golf-see-it-go",
  ];

  const footballSharedTail = [
    "pp-football-name-standard",
    "pp-football-goal-fusion",
    "pp-choose-focus-lead",
    // focus clip injected by resolver between lead and tail
    "pp-choose-focus-tail",
    "pp-football-be-vocal",
    "pp-football-see-it-go",
  ];

  const practiceStatePlaylist = {
    hockey: {
      "dialed-in": hockeySharedTail,
      "not-feeling-it": hockeySharedTail,
    },
    basketball: {
      "dialed-in": basketballSharedTail,
      "not-feeling-it": basketballSharedTail,
    },
    golf: {
      "dialed-in": golfSharedTail,
      "not-feeling-it": golfSharedTail,
    },
    football: {
      "dialed-in": footballSharedTail,
      "not-feeling-it": footballSharedTail,
    },
  };

  // Compute the manifest version from the catalog slug→hash8 map.
  // This is the stable identity of THIS set of clip bytes: if a single clip
  // changes its hash8 changes → the catalog changes → manifestVersion changes
  // → the manifest URL (bust param or filename) atomically invalidates.
  const slugHashMap: Record<string, string> = {};
  for (const [slug, entry] of Object.entries(catalog)) {
    // Extract the hash8 from the hashed URL: /…/<slug>.<hash8>.mp3
    const match = /\.([0-9a-f]{8})\.mp3$/.exec(entry.url);
    slugHashMap[slug] = match ? match[1]! : "00000000";
  }
  const manifestVersion = computeManifestVersion(slugHashMap);

  const manifest: ClipManifest = {
    version: "p6",
    manifestVersion,
    clips: catalog,
    templates,
    practiceState: practiceStatePlaylist,
  };

  const manifestPath = join(clipsDir, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`[clips] manifestVersion=${manifestVersion}`);

  // ── Step 4: Validate catalog count and report.
  const catalogCount = Object.keys(catalog).length;
  const templateCount = templates.length;
  console.log(`\n[clips] manifest.json written: ${catalogCount} catalog entries, ${templateCount} templates.`);

  // p6 (FV-124): catalog breakdown:
  //   46 structural (shared + hockey viz/hm + closing)
  //   32 personalization (hockey anc/st/cw)
  //   16 hockey-practice (pp-*) — +1 pp-focus-talk-every-shift (FV-121)
  //   12 basketball-practice (pp-bb-*)
  //   30 legacy basketball baked cells (bb-{role}-{frag})
  //   39 new basketball compositional clips (viz-guard/wing/big + hm-bb-* + anc-bb + st-bb)
  //   + 6 more basketball openers (FV-120: opener-bb-confidence/compete-level/reset/leadership/joy/hope)
  //   − 2 retired mid-session be-vocal beats (FV-124: be-vocal + bb-be-vocal removed from templates)
  //   + 2 new Be more Vocal openers (FV-124: opener-be-vocal + opener-bb-be-vocal)
  //   = 183 total (net 0: −2 retired beats +2 new openers)
  //   + 3 prayer clips (shared-prayer-selfguided, pp-prayer, pp-prayer-selfguided) = 186
  //   + 52 viz positive-play clips (FV-136) + 2 cue-word pre clips = 240 total
  // These fixed-total checks describe a full bare `--mode clips` catalog and
  // are not meaningful for a targeted render (which intentionally leaves the
  // rest of the catalog untouched at whatever size it already is).
  if (!targetSlugs) {
    if (catalogCount !== 240) {
      console.warn(`  WARNING: expected 240 catalog entries, got ${catalogCount}.`);
    }
    if (templateCount !== 160) {
      console.warn(`  WARNING: expected 160 templates (hockey 30 + basketball 30 + golf 30 + football 70), got ${templateCount}.`);
    }
  }

  // Per-clip level spot-checks for one clip per position group.
  console.log(`\n[clips] Spot-check: measure LUFS/peak on representative clips via`);
  console.log(`  ffmpeg -hide_banner -i clips/hm-forward-nervous.mp3 -af volumedetect -f null /dev/null`);
  console.log(`  ffmpeg -hide_banner -i clips/hm-defense-beaten-wide.mp3 -af volumedetect -f null /dev/null`);
  console.log(`  ffmpeg -hide_banner -i clips/hm-goalie-pulled.mp3 -af volumedetect -f null /dev/null`);

  console.log(`\n[clips] Done. git add apps/web/public/audio/pregame/clips/`);
}

// ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  await tryLoadEnvLocal();

  // ── Step 0a: Sync audioScript fallback body text (md → TS inline strings).
  // These are the text-mode RUNTIME strings in sport-registry.ts / types.ts
  // that the app reads at runtime. They remain inline TS strings so they must
  // be written back when KC edits them in the .md books.
  //
  // In --dry-run / --check mode we run the sync in dry-run mode (no writes).
  // In --sync-only mode we exit after this sync.
  console.log("[sync] Syncing text-mode fallback bodies from .md books to TS sources...");
  const syncSummary = await syncFromBooks({ write: !flags.dryRun && !flags.check });
  if (syncSummary.fallbackChanged > 0) {
    console.log(`[sync] Applied: ${syncSummary.fallbackChanged} fallback body line(s).`);
  } else {
    console.log("[sync] Fallback bodies already match .md books — nothing synced.");
  }

  if (flags.syncOnly) {
    console.log("[sync] --sync-only: exiting before TTS/ffmpeg.");
    return;
  }

  // ── Step 0b: Load book prose + pause durations for render-time override.
  // KC edits docs/scripts/*.md; the generator reads speech-segment texts and
  // (post-migration) silence durations from those books at render time.
  // Works uniformly for inline, spread, shared, and viz clips.
  console.log("[book-prose] Loading .md book prose + pause durations for render-time clip override...");
  let bookData: Map<string, BookEntry>;
  try {
    bookData = await loadBookProseWithPauses();
  } catch (err) {
    console.error(`[book-prose] Failed to load book data: ${(err as Error).message}`);
    process.exit(1);
  }
  console.log(`[book-prose] Loaded prose for ${bookData.size} clip slug(s).`);

  // ── --check mode: report which clips will render with edited .md prose ────
  // No TTS/ffmpeg. Reports per clip: prose edits (book text differs from TS),
  // book-defined structure (book line/pause count differs — valid, book wins,
  // FV-302), and the one true failure — a spoken clip with NO book entry (exits
  // non-zero so that gap can't ship).
  // For openers: reports whether book matches source (→ loudnorm pass) or differs
  // (→ will re-TTS). For wordless audio (none currently exist, but future-proof):
  // lists them explicitly as intentionally excluded from books.
  if (flags.check) {
    console.log("\n[check] Comparing .md book prose to TS seed text per clip...\n");
    const allScripts = [...SCRIPTS, ...CLIP_SCRIPTS];
    const openerSlugSet = new Set<string>(OPENER_SLUGS);
    let editedCount = 0;
    // Clips whose book line/pause count differs from the TS — the book DEFINES
    // the structure (FV-302), which is valid, not a failure. Reported, not fatal.
    const structureOverrides: string[] = [];
    const noBookSpoken: string[] = [];  // spoken clips with no book entry (gap)
    const noBookWordless: string[] = []; // wordless audio, intentionally no entry
    for (const script of allScripts) {
      const entry = bookData.get(script.slug);
      const bookLines = entry?.lines;
      if (!bookLines) {
        // Determine if this is a spoken clip or a wordless audio target.
        const hasSpokenWords = script.segments.some((s) => s.type === "speech");
        if (hasSpokenWords) {
          noBookSpoken.push(script.slug);
        } else {
          noBookWordless.push(script.slug);
        }
        continue;
      }
      // Structure check — a book line/pause count that differs from the TS means
      // the book DEFINES the structure (FV-302). This is valid, not an error: the
      // render rebuilds the clip from the book. Report it so the operator can
      // confirm the change is intentional, then skip the per-line prose diff
      // (positions no longer align).
      const speechCount = script.segments.filter((s) => s.type === "speech").length;
      const silenceCount = script.segments.filter((s) => s.type === "silence").length;
      const bookPauses = entry.pauses;
      const hasMigratedPauses = bookPauses.some((p) => p.durationSec !== null);
      if (bookLines.length !== speechCount || (hasMigratedPauses && bookPauses.length !== silenceCount)) {
        structureOverrides.push(
          `${script.slug} (book ${bookLines.length} speech / ${bookPauses.length} pause vs TS ${speechCount} speech / ${silenceCount} silence)`,
        );
        console.log(
          `  [structure] ${script.slug} — book defines structure (book ${bookLines.length} speech / ${bookPauses.length} pause, TS ${speechCount} speech / ${silenceCount} silence) → renders with book structure`,
        );
        continue;
      }
      // Diff check
      let speechIdx = 0;
      const diffs: Array<{ lineNum: number; ts: string; md: string }> = [];
      for (const seg of script.segments) {
        if (seg.type !== "speech") continue;
        const mdText = bookLines[speechIdx];
        if (mdText !== undefined && mdText !== seg.text) {
          diffs.push({ lineNum: speechIdx + 1, ts: seg.text, md: mdText });
        }
        speechIdx++;
      }
      if (diffs.length > 0) {
        editedCount++;
        // For openers: annotate with the render path (re-TTS vs loudnorm-pass).
        if (openerSlugSet.has(script.slug)) {
          console.log(`  [edited] ${script.slug} — ${diffs.length} line(s) differ → will RE-TTS (book differs from source)`);
        } else {
          console.log(`  [edited] ${script.slug} — ${diffs.length} line(s) differ (will render with .md prose)`);
        }
        for (const d of diffs) {
          console.log(`    speech[${d.lineNum}]:`);
          console.log(`      TS:  ${d.ts}`);
          console.log(`      .md: ${d.md}`);
        }
      } else if (openerSlugSet.has(script.slug)) {
        // Opener matches source → loudnorm-pass only (informational, only shown if verbose needed)
        // Suppress per-opener "matches" lines to keep output clean; summary covers it.
      }
    }
    console.log(`\n[check] Summary:`);
    console.log(`  Clips with .md edits (will render with .md prose): ${editedCount}`);
    const openerEdits = [...openerSlugSet].filter((slug) => {
      const entry = bookData.get(slug);
      const bookLines = entry?.lines;
      if (!bookLines) return false;
      const script = SCRIPTS.find((s) => s.slug === slug);
      if (!script) return false;
      const speechTexts = script.segments
        .filter((s): s is Extract<Segment, { type: "speech" }> => s.type === "speech")
        .map((s) => s.text);
      return bookLines.some((line, i) => line !== speechTexts[i]);
    });
    const openerMatches = [...openerSlugSet].filter((slug) => !openerEdits.includes(slug) && bookData.has(slug));
    if (openerEdits.length > 0) {
      console.log(`    Of which openers (will RE-TTS):                  ${openerEdits.length} — ${openerEdits.join(", ")}`);
    }
    if (openerMatches.length > 0) {
      console.log(`  Openers matching source (loudnorm pass, no re-TTS): ${openerMatches.length}`);
    }
    if (structureOverrides.length > 0) {
      console.log(`  Clips with book-defined structure (book wins, no TS reconcile): ${structureOverrides.length}`);
      for (const s of structureOverrides) console.log(`    - ${s}`);
    } else {
      console.log(`  Clips with book-defined structure:                  0  (all books match TS structure)`);
    }
    if (noBookSpoken.length > 0) {
      console.error(`  Spoken clips with NO book entry (gap — add to books): ${noBookSpoken.length} — ${noBookSpoken.join(", ")}`);
    } else {
      console.log(`  Spoken clips with no book entry:                    0  (all spoken clips are in books)`);
    }
    if (noBookWordless.length > 0) {
      console.log(`  Wordless audio targets — no script, intentionally not in books: ${noBookWordless.length} — ${noBookWordless.join(", ")}`);
    }
    if (noBookSpoken.length > 0) {
      console.error("\n[check] FAIL: spoken clips with no book entry — run npm run scripts:export -- --force to seed them.");
      process.exit(1);
    }
    console.log("\n[check] OK — exiting before TTS/ffmpeg.");
    return;
  }

  // Clip-playlist generation path.
  if (flags.mode === "clips") {
    await generateClips(flags, bookData);
    return;
  }

  const scripts = flags.slugs.length > 0
    ? SCRIPTS.filter((s) => flags.slugs.includes(s.slug))
    : SCRIPTS;

  if (scripts.length === 0) {
    console.error(
      `No scripts matched. Available slugs: ${SCRIPTS.map((s) => s.slug).join(", ")}`,
    );
    process.exit(1);
  }

  const totalChars = scripts.reduce((n, s) => n + totalSpeechChars(s), 0);
  const cost = estimateCostUsd(totalChars);
  console.log(
    `Generating ${scripts.length} script(s) — ${totalChars} total chars, est. $${cost.toFixed(4)} OpenAI cost.`,
  );

  if (flags.dryRun) {
    console.log("\n--dry-run: validating scripts, no API calls.");
    for (const s of scripts) {
      console.log(
        `  ${s.slug}: ${s.segments.length} segments, ${speechSegmentCount(s)} speech, ${totalSpeechChars(s)} chars`,
      );
    }
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error(
      "\nOPENAI_API_KEY is not set. Add it to apps/web/.env.local:\n  OPENAI_API_KEY=sk-...\nthen re-run.",
    );
    process.exit(1);
  }

  clearSilenceCache();
  for (const s of scripts) {
    try {
      await generateOne(s, flags, bookData);
    } catch (err) {
      console.error(`\nFailed on ${s.slug}: ${(err as Error).message}`);
      process.exit(1);
    }
  }

  console.log(
    `\nDone. Committed deliverables live in ${flags.outDir}. Don't forget to git add the .mp3 + .json files.`,
  );
}

// Auto-run only when this file is executed directly (e.g.
// `node scripts/generate-pregame-audio.ts`). When imported — such as by the
// unit tests that exercise applyBookProseOverrides — main() must NOT fire.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  void main();
}
