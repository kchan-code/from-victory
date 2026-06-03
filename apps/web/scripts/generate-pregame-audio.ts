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

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
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

async function generateOne(script: AudioScript, flags: Flags): Promise<void> {
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

  console.log(
    `   ✓ ${script.slug}.mp3  duration=${timeline.durationSec.toFixed(2)}s  phases=${timeline.phases.length}`,
  );

  // 4. Cleanup
  if (!flags.keepSegments) {
    await rm(workDir, { recursive: true, force: true });
  } else {
    console.log(`   (kept per-segment files in ${workDir})`);
  }
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
const PHASE2_TEMPLATES: Array<{
  position: string;
  adversity: string;
  vizSlug: string;
  hmSlug: string;
}> = [
  // Forward × 10 adversities
  { position: "Forward", adversity: "I feel nervous.",          vizSlug: "viz-forward", hmSlug: "hm-forward-nervous" },
  { position: "Forward", adversity: "I miss a scoring chance.", vizSlug: "viz-forward", hmSlug: "hm-forward-missed-chance" },
  { position: "Forward", adversity: "I turn the puck over.",    vizSlug: "viz-forward", hmSlug: "hm-forward-turnover" },
  { position: "Forward", adversity: "I get beaten wide.",       vizSlug: "viz-forward", hmSlug: "hm-forward-beaten-wide" },
  { position: "Forward", adversity: "I take a bad penalty.",    vizSlug: "viz-forward", hmSlug: "hm-forward-bad-penalty" },
  { position: "Forward", adversity: "Coach yells.",             vizSlug: "viz-forward", hmSlug: "hm-forward-coach-yells" },
  { position: "Forward", adversity: "I get benched.",           vizSlug: "viz-forward", hmSlug: "hm-forward-benched" },
  { position: "Forward", adversity: "I get hit.",               vizSlug: "viz-forward", hmSlug: "hm-forward-get-hit" },
  { position: "Forward", adversity: "I start slow.",            vizSlug: "viz-forward", hmSlug: "hm-forward-start-slow" },
  { position: "Forward", adversity: "We give up the first goal.", vizSlug: "viz-forward", hmSlug: "hm-forward-first-goal-against" },
  // Defense × 10 adversities
  { position: "Defense", adversity: "I get beaten wide.",       vizSlug: "viz-defense", hmSlug: "hm-defense-beaten-wide" },
  { position: "Defense", adversity: "I turn the puck over.",    vizSlug: "viz-defense", hmSlug: "hm-defense-turnover" },
  { position: "Defense", adversity: "I miss a scoring chance.", vizSlug: "viz-defense", hmSlug: "hm-defense-missed-chance" },
  { position: "Defense", adversity: "I take a bad penalty.",    vizSlug: "viz-defense", hmSlug: "hm-defense-bad-penalty" },
  { position: "Defense", adversity: "Coach yells.",             vizSlug: "viz-defense", hmSlug: "hm-defense-coach-yells" },
  { position: "Defense", adversity: "I get benched.",           vizSlug: "viz-defense", hmSlug: "hm-defense-benched" },
  { position: "Defense", adversity: "I feel nervous.",          vizSlug: "viz-defense", hmSlug: "hm-defense-nervous" },
  { position: "Defense", adversity: "I get hit.",               vizSlug: "viz-defense", hmSlug: "hm-defense-get-hit" },
  { position: "Defense", adversity: "I start slow.",            vizSlug: "viz-defense", hmSlug: "hm-defense-start-slow" },
  { position: "Defense", adversity: "We give up the first goal.", vizSlug: "viz-defense", hmSlug: "hm-defense-first-goal-against" },
  // Goalie × 10 adversities (benched → pulled special case)
  { position: "Goalie", adversity: "Coach yells.",              vizSlug: "viz-goalie", hmSlug: "hm-goalie-coach-yells" },
  { position: "Goalie", adversity: "I turn the puck over.",     vizSlug: "viz-goalie", hmSlug: "hm-goalie-turnover" },
  { position: "Goalie", adversity: "I miss a scoring chance.",  vizSlug: "viz-goalie", hmSlug: "hm-goalie-missed-chance" },
  { position: "Goalie", adversity: "I get beaten wide.",        vizSlug: "viz-goalie", hmSlug: "hm-goalie-beaten-wide" },
  { position: "Goalie", adversity: "I take a bad penalty.",     vizSlug: "viz-goalie", hmSlug: "hm-goalie-bad-penalty" },
  { position: "Goalie", adversity: "I get benched.",            vizSlug: "viz-goalie", hmSlug: "hm-goalie-pulled" },
  { position: "Goalie", adversity: "I feel nervous.",           vizSlug: "viz-goalie", hmSlug: "hm-goalie-nervous" },
  { position: "Goalie", adversity: "I get hit.",                vizSlug: "viz-goalie", hmSlug: "hm-goalie-get-hit" },
  { position: "Goalie", adversity: "I start slow.",             vizSlug: "viz-goalie", hmSlug: "hm-goalie-start-slow" },
  { position: "Goalie", adversity: "We give up the first goal.", vizSlug: "viz-goalie", hmSlug: "hm-goalie-first-goal-against" },
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
      `${CLIP_SCRIPTS.length + OPENER_SLUGS.length} total entries (p5: 93 expected)`,
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
      // Skip if clip already exists on disk (resume support).
      const existingMp3 = join(clipsDir, `${script.slug}.mp3`);
      if (existsSync(existingMp3)) {
        console.log(`  [skip] ${script.slug} already exists — skipping (resume).`);
        const jsonPath = join(clipsDir, `${script.slug}.json`);
        if (existsSync(jsonPath)) {
          // Preferred path: read the sidecar timeline for exact duration + phases.
          const rawJson = await readFile(jsonPath, "utf8");
          const timeline = JSON.parse(rawJson) as AudioTimeline;
          catalog[script.slug] = {
            url: `/audio/pregame/${CLIPS_SUBDIR}/${script.slug}.mp3`,
            durationSec: timeline.durationSec,
            phases: timelineToClipPhases(timeline),
          };
        } else {
          // Fallback: no sidecar (e.g. short personalization clips committed
          // before sidecar generation was added). Probe the MP3 for duration
          // and derive phases from the script's segment marks.
          const dur = await probeDurationSec(existingMp3);
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
            url: `/audio/pregame/${CLIPS_SUBDIR}/${script.slug}.mp3`,
            durationSec: Math.round(dur * 1000) / 1000,
            phases: phaseMarks.length > 0 ? phaseMarks : [],
          };
        }
        completedSlugs.push(script.slug);
        continue;
      }

      clearSilenceCache();
      try {
        await generateOne(script, clipsFlags);
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
      const jsonPath = join(clipsDir, `${script.slug}.json`);
      const rawJson = await readFile(jsonPath, "utf8");
      const timeline = JSON.parse(rawJson) as AudioTimeline;
      catalog[script.slug] = {
        url: `/audio/pregame/${CLIPS_SUBDIR}/${script.slug}.mp3`,
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

  // ── Step 2: Loudnorm-pass all 9 opener MP3s → clips/opener-*.mp3.
  // No re-TTS — filter-only pass to level-match at -16 LUFS.
  const loudnormFilter = "loudnorm=I=-16:TP=-1.5:LRA=11";
  console.log(`\n[clips] Loudnorm-passing ${OPENER_SLUGS.length} opener MP3s...`);

  for (const slug of OPENER_SLUGS) {
    const openerSrc = join(baseDir, `${slug}.mp3`);
    const openerDst = join(clipsDir, `${slug}.mp3`);

    if (!existsSync(openerSrc)) {
      console.error(
        `  ERROR: ${openerSrc} not found. Run the legacy path first to generate ${slug}.mp3.`,
      );
      process.exit(1);
    }

    console.log(`\n── ${slug} (loudnorm pass) ───────────────────`);
    await reEncodeMp3(openerSrc, openerDst, loudnormFilter);
    const openerDur = await probeDurationSec(openerDst);
    console.log(`   ✓ clips/${slug}.mp3  duration=${openerDur.toFixed(3)}s`);

    catalog[slug] = {
      url: `/audio/pregame/${CLIPS_SUBDIR}/${slug}.mp3`,
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
  const templates = PHASE2_TEMPLATES.map((t) => ({
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
  }));

  // Pre-practice "Lock In" — state-aware practice playlist (FRO-22, p5).
  // practiceState holds the shared-tail slugs (Beats 2–6) for each state.
  // The opener and focus clip are resolved at runtime by resolvePracticePlaylist.
  // Beat 4 lead/tail sandwich the injected focus clip; the resolver detects
  // pp-choose-focus-lead and injects the focus slug immediately after it.
  //
  // Backward compat: practice key is retained (empty legacy sentinel) so p4
  // consumers that check manifest.practice are not broken.
  const sharedTail = [
    "pp-name-standard",
    "pp-goal-fusion",
    "pp-choose-focus-lead",
    // focus clip injected by resolver between lead and tail
    "pp-choose-focus-tail",
    "pp-be-vocal",
    "pp-see-it-go",
  ];

  const practiceStatePlaylist = {
    "dialed-in": sharedTail,
    "not-feeling-it": sharedTail,
  };

  const manifest: ClipManifest = {
    version: "p5",
    clips: catalog,
    templates,
    practiceState: practiceStatePlaylist,
  };

  const manifestPath = join(clipsDir, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  // ── Step 4: Validate catalog count and report.
  const catalogCount = Object.keys(catalog).length;
  const templateCount = templates.length;
  console.log(`\n[clips] manifest.json written: ${catalogCount} catalog entries, ${templateCount} templates.`);

  // p5 (FRO-22): 46 structural + 32 personalization + 15 practice = 93 total
  // (old pp-settle-receive + pp-choose-focus retired; 12 new pp-* clips added)
  if (catalogCount !== 93) {
    console.warn(`  WARNING: expected 93 catalog entries (46 structural + 32 personalization + 15 practice), got ${catalogCount}.`);
  }
  if (templateCount !== 30) {
    console.warn(`  WARNING: expected 30 templates (3 positions × 10 adversities), got ${templateCount}.`);
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
