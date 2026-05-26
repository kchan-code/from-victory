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
// CLI flags:
//   --slug <name>     Generate only the script with this slug
//   --dry-run         Validate scripts + estimate cost, no API calls
//   --keep-segments   Don't delete the per-segment temp files
//   --out-dir <path>  Override the default output directory

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import type {
  AudioScript,
  Segment,
} from "../components/pregame/audio/types.ts";
import { BREATH_THRESHOLD_SCRIPT } from "../components/pregame/audio/breath-threshold.ts";
import {
  clearSilenceCache,
  concatMp3s,
  probeDurationSec,
  silenceMp3,
  type ConcatInput,
} from "./lib/ffmpeg.ts";
import { buildTimeline, type SegmentDuration } from "./lib/timeline.ts";
import { estimateCostUsd, synthesizeSpeech } from "./lib/tts.ts";

const SCRIPTS: AudioScript[] = [
  BREATH_THRESHOLD_SCRIPT,
  // Future: BREATH_QUICKRESET_SCRIPT, PREGAME_SESSION_SCRIPTS (30 of them), ...
];

const DEFAULT_OUT_DIR = "public/audio/pregame";

type Flags = {
  slug?: string;
  dryRun: boolean;
  keepSegments: boolean;
  outDir: string;
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
    else if (a === "--slug" && argv[i + 1]) {
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

  // 2. Concat into one MP3
  await concatMp3s(concatInputs, outMp3, workDir);
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

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  await tryLoadEnvLocal();

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
