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
//   --slug <name>     Generate only the script with this slug
//   --dry-run         Validate scripts + estimate cost, no API calls
//   --keep-segments   Don't delete the per-segment temp files
//   --out-dir <path>  Override the default output directory
//
// CLI flags (clip-playlist path):
//   --mode clips      Render the 6 forward-nervous clip scripts into
//                     public/audio/pregame/clips/, loudnorm-pass the
//                     opener, and write clips/manifest.json.
//   --dry-run         Validate clip scripts + estimate cost, no API calls
//   --keep-segments   Don't delete the per-segment temp files

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import type {
  AudioScript,
  AudioTimeline,
  Phase,
  Segment,
} from "../components/pregame/audio/types.ts";
import {
  CLIP_SCRIPTS,
} from "../components/pregame/audio/clips.ts";
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
  slug?: string;
  dryRun: boolean;
  keepSegments: boolean;
  outDir: string;
  // Clip-playlist generation mode. Renders CLIP_SCRIPTS into clips/
  // subdirectory, loudnorm-passes the opener, writes manifest.json.
  mode?: "clips";
};

function parseFlags(argv: string[]): Flags {
  const out: Flags = {
    dryRun: false,
    keepSegments: false,
    outDir: DEFAULT_OUT_DIR,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--keep-segments") out.keepSegments = true;
    else if (a === "--mode" && argv[i + 1] === "clips") {
      out.mode = "clips";
      i++;
    } else if (a === "--slug" && argv[i + 1]) {
      out.slug = argv[i + 1];
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
 * Render one AudioScript. In clip mode (flags.mode === "clips") the MP3 is
 * content-addressed: after render the file is renamed from <slug>.mp3 to
 * <slug>.<hash8>.mp3 and the hash8 is returned.
 *
 * In legacy baked-cell mode (no mode flag) no rename happens; returns null
 * (the caller never uses the hash for legacy files).
 */
async function generateOne(
  script: AudioScript,
  flags: Flags,
): Promise<{ hash8: string } | null> {
  const outDir = resolve(process.cwd(), flags.outDir);
  await mkdir(outDir, { recursive: true });
  const outMp3 = join(outDir, `${script.slug}.mp3`);
  const outJson = join(outDir, `${script.slug}.json`);

  const workDir = join(outDir, `.work-${script.slug}`);
  await mkdir(workDir, { recursive: true });

  console.log(`\n── ${script.slug} ─────────────────────────────────────`);
  console.log(
    `   voice=${script.voice}  segments=${script.segments.length}  speech=${speechSegmentCount(script)}  chars=${totalSpeechChars(script)}`,
  );

  // 1. Generate per-segment files (speech → TTS, silence → cached silence)
  const concatInputs: ConcatInput[] = [];
  const durations: SegmentDuration[] = [];

  for (let i = 0; i < script.segments.length; i++) {
    const seg = script.segments[i];
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
      voice: script.voice,
      instructions: seg.instructions ?? script.instructions,
      // Per-segment speed wins; falls back to script-level default.
      speed: seg.speed ?? script.speed,
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
  await concatMp3s(concatInputs, outMp3, workDir, script.postFilter);
  const finalDur = await probeDurationSec(outMp3);

  // 3. Build + write sidecar timeline
  const timeline = buildTimeline(script, durations);
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
  { position: "Goalie", adversity: "I get beaten wide.",        vizSlug: "viz-goalie-track-and-save", hmSlug: "hm-goalie-beaten-wide" },
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
];

async function generateClips(flags: Flags): Promise<void> {
  const baseDir = resolve(process.cwd(), DEFAULT_OUT_DIR);
  const clipsDir = join(baseDir, CLIPS_SUBDIR);
  await mkdir(clipsDir, { recursive: true });

  const totalChars = CLIP_SCRIPTS.reduce((n, s) => n + totalSpeechChars(s), 0);
  const cost = estimateCostUsd(totalChars);
  console.log(
    `[clips] Phase 2 — ${CLIP_SCRIPTS.length} TTS clip scripts + ${OPENER_SLUGS.length} loudnorm opener passes.`,
  );
  console.log(
    `[clips] TTS chars: ${totalChars}, est. $${cost.toFixed(4)}.`,
  );

  if (flags.dryRun) {
    console.log("\n--dry-run: validating clip scripts, no API calls.");
    for (const s of CLIP_SCRIPTS) {
      console.log(
        `  ${s.slug}: ${s.segments.length} segs, ${speechSegmentCount(s)} speech, ${totalSpeechChars(s)} chars`,
      );
    }
    for (const slug of OPENER_SLUGS) {
      const src = join(baseDir, `${slug}.mp3`);
      const exists = existsSync(src);
      console.log(
        `  ${slug}: loudnorm pass from top-level (no TTS)${exists ? "" : " — WARNING: source not found"}`,
      );
    }
    console.log(`\n[clips] Templates: ${PHASE2_TEMPLATES.length}`);
    console.log(
      `[clips] Catalog will have: ${CLIP_SCRIPTS.length} TTS + ${OPENER_SLUGS.length} openers = ` +
      `${CLIP_SCRIPTS.length + OPENER_SLUGS.length} total entries (240 expected: 183 + 3 prayer clips + 52 viz + 2 cue-word pre, templates: 60)`,
    );
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error(
      "\nOPENAI_API_KEY is not set. Add it to apps/web/.env.local:\n  OPENAI_API_KEY=sk-...\nthen re-run.",
    );
    process.exit(1);
  }

  // Collect manifest data as we go.
  // clips catalog: slug → { url, durationSec, phases }
  const catalog: ClipManifest["clips"] = {};

  // ── Step 1: Render TTS clip scripts in batches of ≤10 to limit quota exposure.
  // clearSilenceCache() is called before each clip so the silence cache doesn't
  // carry stale paths from a previous clip's work dir (deleted after each clip).
  const clipsFlags: Flags = { ...flags, outDir: join(DEFAULT_OUT_DIR, CLIPS_SUBDIR) };

  // Batch TTS scripts in groups of ≤10. If a 429/quota error hits mid-batch,
  // the generator exits with the completed clips written and the remaining
  // slugs printed so the run can resume with --slug targeting.
  const BATCH_SIZE = 10;
  const batches: AudioScript[][] = [];
  for (let i = 0; i < CLIP_SCRIPTS.length; i += BATCH_SIZE) {
    batches.push(CLIP_SCRIPTS.slice(i, i + BATCH_SIZE));
  }

  const completedSlugs: string[] = [];
  const remainingSlugs: string[] = [];

  console.log(
    `\n[clips] Rendering ${CLIP_SCRIPTS.length} TTS scripts in ${batches.length} batches of ≤${BATCH_SIZE}.`,
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
      const existingHashedMp3 = await findHashedMp3(clipsDir, script.slug);
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
        renderResult = await generateOne(script, clipsFlags);
      } catch (err) {
        const msg = (err as Error).message;
        const isQuota = msg.includes("429") || msg.includes("quota") || msg.includes("insufficient");
        if (isQuota) {
          console.error(
            `\n[clips] QUOTA LIMIT hit on ${script.slug}.\n` +
            `  Completed: ${completedSlugs.join(", ") || "(none)"}\n` +
            `  Remaining: ${script.slug}, ` +
            CLIP_SCRIPTS.slice(CLIP_SCRIPTS.indexOf(script) + 1)
              .map((s) => s.slug)
              .join(", ") + "\n" +
            `  Top up the OpenAI quota then resume — already-generated clips are\n` +
            `  written to disk and will be skipped on next run (resume support).`,
          );
        } else {
          console.error(`\n[clips] Failed on ${script.slug}: ${msg}`);
        }
        // Mark all remaining as not done.
        const failIdx = CLIP_SCRIPTS.indexOf(script);
        for (let i = failIdx; i < CLIP_SCRIPTS.length; i++) {
          remainingSlugs.push(CLIP_SCRIPTS[i]!.slug);
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

  // ── Step 2: Loudnorm-pass opener MP3s → clips/opener-*.mp3 (level-match -16 LUFS).
  // Resume support (FV-123): if clips/<slug>.<hash8>.mp3 already exists, REUSE it
  // and skip the re-encode — mirroring the CLIP_SCRIPTS resume skip above.
  // Single-pass loudnorm is not guaranteed byte-identical across runs/ffmpeg
  // versions, so re-encoding committed openers on every run produced spurious
  // diffs. The catalog entry is computed from the on-disk hashed file either way.
  // To re-render an opener after changing its source, delete
  // clips/<slug>.<hash8>.mp3 first (same model as the TTS clips).
  const loudnormFilter = "loudnorm=I=-16:TP=-1.5:LRA=11";
  console.log(`\n[clips] Loudnorm-passing ${OPENER_SLUGS.length} opener MP3s (existing reused)...`);

  for (const slug of OPENER_SLUGS) {
    const openerSrc = join(baseDir, `${slug}.mp3`);
    const existingHashedOpener = await findHashedMp3(clipsDir, slug);

    let openerHashedPath: string;
    if (existingHashedOpener) {
      console.log(`  [skip] ${slug} already loudnorm-passed — reusing (resume).`);
      openerHashedPath = existingHashedOpener;
    } else {
      if (!existsSync(openerSrc)) {
        console.error(
          `  ERROR: ${openerSrc} not found. Run the legacy path first to generate ${slug}.mp3.`,
        );
        process.exit(1);
      }
      console.log(`\n── ${slug} (loudnorm pass) ───────────────────`);
      // Encode to a temporary plain path first, then rename to hashed.
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
  if (catalogCount !== 240) {
    console.warn(`  WARNING: expected 240 catalog entries, got ${catalogCount}.`);
  }
  if (templateCount !== 60) {
    console.warn(`  WARNING: expected 60 templates (6 positions × 10 adversities — 3 hockey + 3 basketball), got ${templateCount}.`);
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

  // Clip-playlist generation path.
  if (flags.mode === "clips") {
    await generateClips(flags);
    return;
  }

  const scripts = flags.slug
    ? SCRIPTS.filter((s) => s.slug === flags.slug)
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
      await generateOne(s, flags);
    } catch (err) {
      console.error(`\nFailed on ${s.slug}: ${(err as Error).message}`);
      process.exit(1);
    }
  }

  console.log(
    `\nDone. Committed deliverables live in ${flags.outDir}. Don't forget to git add the .mp3 + .json files.`,
  );
}

void main();
