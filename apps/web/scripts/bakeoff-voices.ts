#!/usr/bin/env node
// ElevenLabs voice bake-off — FV-285.
//
// Renders a fixed "backbone" set of pregame AudioScripts through one or more
// candidate ElevenLabs voices, level-matches them against the currently
// shipped (OpenAI "ash") master via the same loudnorm pass the live pipeline
// uses, measures loudness/true-peak, and writes a README so KC can A/B by
// ear. This tool never touches apps/web/public/audio/pregame/** — it only
// READS the committed masters (to copy a level-matched reference) and writes
// candidates to a separate docs/audio-ab-* directory.
//
// Never calls OpenAI. Only calls ElevenLabs (POST /v1/text-to-speech,
// GET /v1/voices), both build-time-only, matching the athlete-data-never-
// reaches-TTS-vendors rule in CLAUDE.md.
//
// Run (from apps/web/, Node >= 22.6):
//   npm run audio:bakeoff -- --list-voices
//   npm run audio:bakeoff -- --dry-run
//   npm run audio:bakeoff -- --dry-run --voices 21m00Tcm4TlvDq8ikWAM:Bella
//   npm run audio:bakeoff -- --voices 21m00Tcm4TlvDq8ikWAM:Bella,pNInz6obpgDQGcFmaJgB:Adam
//   npm run audio:bakeoff -- --voices <id>:<label> --model eleven_v3
//   npm run audio:bakeoff -- --voices <id>:<label> --slugs breath-threshold,shared-opening
//   npm run audio:bakeoff -- --voices <id>:<label> --out docs/audio-ab-fv285 --keep-segments
//   (--out is repo-root-relative unless absolute, so the root .gitignore covers the MP3s)
//
// Prereqs: ELEVENLABS_API_KEY in apps/web/.env.local (only for --list-voices
// and real renders — --dry-run works with no key) + ffmpeg on PATH.

import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { AudioScript, Segment } from "../components/pregame/audio/types.ts";
import { CLIP_SCRIPTS } from "../components/pregame/audio/clips.ts";
import { CLIP_LOUDNORM_FILTER } from "../components/pregame/audio/loudnorm.ts";
import {
  applyBookProseOverrides,
  SCRIPTS,
} from "./generate-pregame-audio.ts";
import { loadBookProseWithPauses, type BookEntry } from "./apply-scripts.ts";
import {
  clearSilenceCache,
  concatMp3s,
  probeDurationSec,
  reEncodeMp3,
  silenceMp3,
  type ConcatInput,
} from "./lib/ffmpeg.ts";
import { estimateCostUsd, listElevenLabsVoices, synthesizeSpeech } from "./lib/tts.ts";
import { measureLoudness } from "./lib/ebur128.ts";

// ──────────────────────────────────────────────────────────────────────
// Backbone slugs (FV-224/FV-285) — a short, representative slice of the
// pipeline: the meditative breath-threshold, the shared opening/prayer/
// send-off structural clips, one hard-moment narration, and one opener.
const DEFAULT_SLUGS = [
  "breath-threshold",
  "shared-opening",
  "shared-prayer",
  "shared-sendoff",
  "hm-forward-nervous",
  "opener-shared-confidence",
] as const;

const DEFAULT_MODEL = "eleven_multilingual_v2";
// Relative to the REPO ROOT (not cwd): the script runs from apps/web/, but
// the A/B folder lives beside the FV-224 precedent at <repo>/docs/audio-ab-*,
// which is where the root .gitignore excludes the rendered MP3s.
const DEFAULT_OUT_DIR = "docs/audio-ab-fv285";
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** Absolute output dir: absolute `--out` as-is; relative `--out` (and the default) resolve against the repo root. */
export function resolveOutDir(outDir: string): string {
  return isAbsolute(outDir) ? outDir : resolve(REPO_ROOT, outDir);
}

// ──────────────────────────────────────────────────────────────────────
// CLI flags

export type VoiceCandidate = { id: string; label: string };

export type Flags = {
  voices: VoiceCandidate[];
  model: string;
  slugs: string[];
  outDir: string;
  dryRun: boolean;
  listVoices: boolean;
  keepSegments: boolean;
};

/** Parse "<voiceId[:label]>[,<voiceId[:label]>...]" into candidates. */
export function parseVoicesArg(raw: string): VoiceCandidate[] {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf(":");
      if (idx === -1) return { id: entry, label: entry };
      const id = entry.slice(0, idx).trim();
      const label = entry.slice(idx + 1).trim();
      return { id, label: label || id };
    });
}

export function parseFlags(argv: string[]): Flags {
  const out: Flags = {
    voices: [],
    model: DEFAULT_MODEL,
    slugs: [],
    outDir: DEFAULT_OUT_DIR,
    dryRun: false,
    listVoices: false,
    keepSegments: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--list-voices") out.listVoices = true;
    else if (a === "--keep-segments") out.keepSegments = true;
    else if (a === "--voices" && argv[i + 1]) {
      out.voices.push(...parseVoicesArg(argv[i + 1] as string));
      i++;
    } else if (a === "--model" && argv[i + 1]) {
      out.model = argv[i + 1] as string;
      i++;
    } else if (a === "--slugs" && argv[i + 1]) {
      for (const raw of (argv[i + 1] as string).split(",")) {
        const s = raw.trim();
        if (s) out.slugs.push(s);
      }
      i++;
    } else if (a === "--out" && argv[i + 1]) {
      out.outDir = argv[i + 1] as string;
      i++;
    }
  }
  return out;
}

/** Filesystem-safe form of a voice label, for filenames. */
export function slugifyLabel(label: string): string {
  const safe = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || "voice";
}

// ──────────────────────────────────────────────────────────────────────
// .env.local loader (ElevenLabs keys only)

const ENV_KEYS = ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "ELEVENLABS_MODEL_ID"];

async function tryLoadEnvLocal(): Promise<void> {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const raw = await readFile(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1] as string;
    if (!ENV_KEYS.includes(key)) continue;
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

// ──────────────────────────────────────────────────────────────────────
// Script resolution

/** Find an AudioScript by slug across the legacy SCRIPTS + CLIP_SCRIPTS. */
export function findScriptBySlug(slug: string): AudioScript {
  const all: AudioScript[] = [...SCRIPTS, ...CLIP_SCRIPTS];
  const found = all.find((s) => s.slug === slug);
  if (!found) {
    throw new Error(
      `bakeoff-voices: no AudioScript found for slug "${slug}" in SCRIPTS or CLIP_SCRIPTS.`,
    );
  }
  return found;
}

function totalSpeechChars(segments: Segment[]): number {
  return segments
    .filter((s): s is Extract<Segment, { type: "speech" }> => s.type === "speech")
    .reduce((sum, s) => sum + s.text.length, 0);
}

// ──────────────────────────────────────────────────────────────────────
// Current-master resolution (read-only — never writes into public/audio/**)

async function resolveCurrentMasterPath(slug: string, publicDir: string): Promise<string> {
  // breath-threshold + the opener-* scripts are top-level (non-hashed) files.
  const topLevelPath = join(publicDir, "audio", "pregame", `${slug}.mp3`);
  if (existsSync(topLevelPath)) return topLevelPath;

  // Everything else is a content-addressed clip in clips/manifest.json.
  const manifestPath = join(publicDir, "audio", "pregame", "clips", "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(
      `bakeoff-voices: no top-level ${slug}.mp3 and no clips/manifest.json found at ${manifestPath}`,
    );
  }
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw) as { clips: Record<string, { url: string }> };
  const entry = manifest.clips[slug];
  if (!entry) {
    throw new Error(`bakeoff-voices: slug "${slug}" not found in clips/manifest.json`);
  }
  const noQuery = entry.url.split("?")[0] as string;
  const rel = noQuery.startsWith("/") ? noQuery.slice(1) : noQuery;
  return join(publicDir, rel);
}

// ──────────────────────────────────────────────────────────────────────
// Rendering

type VariantResult = {
  label: string;
  isCurrent: boolean;
  durationSec: number;
  chars: number;
  costUsd: number | null;
  lufsI: number | null;
  truePeak: number | null;
};

type SlugResult = {
  slug: string;
  variants: VariantResult[];
};

/** Render one (script × ElevenLabs voice) variant into `<slugDir>/<label>.mp3`. */
async function renderCandidate(
  script: AudioScript,
  segments: Segment[],
  voice: VoiceCandidate,
  model: string,
  slugDir: string,
  workDir: string,
): Promise<VariantResult> {
  const labelSafe = slugifyLabel(voice.label);
  console.log(`\n[bakeoff] ${script.slug} × ${voice.label} (${voice.id}) ...`);

  const speechSegs = segments
    .map((seg, idx) => ({ seg, idx }))
    .filter(
      (x): x is { seg: Extract<Segment, { type: "speech" }>; idx: number } =>
        x.seg.type === "speech",
    );

  const concatInputs: ConcatInput[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg) continue;
    if (seg.type === "silence") {
      const silPath = await silenceMp3(seg.durationSec, workDir);
      concatInputs.push({ kind: "file", path: silPath });
      process.stdout.write("·");
      continue;
    }
    const segPath = join(workDir, `${labelSafe}-${String(i).padStart(3, "0")}.mp3`);
    const pos = speechSegs.findIndex((x) => x.idx === i);
    const previousText = pos > 0 ? speechSegs[pos - 1]?.seg.text : undefined;
    const nextText =
      pos >= 0 && pos < speechSegs.length - 1 ? speechSegs[pos + 1]?.seg.text : undefined;
    await synthesizeSpeech({
      text: seg.text,
      voice: voice.id,
      provider: "elevenlabs",
      speed: seg.speed ?? script.speed,
      outPath: segPath,
      previousText,
      nextText,
    });
    concatInputs.push({ kind: "file", path: segPath });
    process.stdout.write("♪");
  }
  process.stdout.write("\n");

  // Same shape as generateOne: concat through the script's own postFilter
  // (e.g. breath-threshold's warming EQ), THEN a loudnorm pass so every
  // candidate — and the current master — lands at the same target level.
  const rawOut = join(workDir, `${labelSafe}-raw.mp3`);
  await concatMp3s(concatInputs, rawOut, workDir, script.postFilter);
  const finalOut = join(slugDir, `${labelSafe}.mp3`);
  await reEncodeMp3(rawOut, finalOut, CLIP_LOUDNORM_FILTER);

  const durationSec = await probeDurationSec(finalOut);
  const { lufsI, truePeak } = await measureLoudness(finalOut);
  const chars = totalSpeechChars(segments);
  const costUsd = estimateCostUsd(chars, "elevenlabs", model);

  return { label: voice.label, isCurrent: false, durationSec, chars, costUsd, lufsI, truePeak };
}

async function renderCurrentMaster(
  script: AudioScript,
  segments: Segment[],
  publicDir: string,
  slugDir: string,
): Promise<VariantResult | null> {
  try {
    const masterSrc = await resolveCurrentMasterPath(script.slug, publicDir);
    const currentOut = join(slugDir, "current-ash.mp3");
    // Loudnorm-passed the same way as the candidates so the A/B is level-matched.
    await reEncodeMp3(masterSrc, currentOut, CLIP_LOUDNORM_FILTER);
    const durationSec = await probeDurationSec(currentOut);
    const { lufsI, truePeak } = await measureLoudness(currentOut);
    const chars = totalSpeechChars(segments);
    return { label: "current-ash", isCurrent: true, durationSec, chars, costUsd: null, lufsI, truePeak };
  } catch (err) {
    console.warn(
      `[bakeoff] WARN: could not resolve current master for "${script.slug}": ${(err as Error).message}`,
    );
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Reporting

function fmtLufs(v: number | null): string {
  if (v === null) return "ERR";
  return v.toFixed(1);
}

function fmtPeak(v: number | null): string {
  if (v === null) return "ERR";
  if (!isFinite(v)) return "-inf";
  return v.toFixed(1);
}

function fmtCost(v: number | null): string {
  if (v === null) return "—";
  return `$${v.toFixed(4)}`;
}

function printVoicesTable(
  voices: Awaited<ReturnType<typeof listElevenLabsVoices>>,
): void {
  console.log(`\n${voices.length} ElevenLabs voice(s):\n`);
  for (const v of voices) {
    const labels = v.labels
      ? Object.entries(v.labels)
          .map(([k, val]) => `${k}=${val}`)
          .join(", ")
      : "";
    console.log(`  ${v.voiceId}  ${v.name.padEnd(24)}  [${v.category ?? "?"}]  ${labels}`);
  }
}

function printDryRun(
  resolved: Array<{ script: AudioScript; segments: Segment[] }>,
  flags: Flags,
): void {
  console.log(`[bakeoff] dry-run — ${resolved.length} slug(s), model=${flags.model}\n`);
  let totalChars = 0;
  for (const { script, segments } of resolved) {
    const chars = totalSpeechChars(segments);
    totalChars += chars;
    const openaiCost = estimateCostUsd(chars, "openai");
    const elevenCost = estimateCostUsd(chars, "elevenlabs", flags.model);
    console.log(
      `  ${script.slug.padEnd(28)} chars=${String(chars).padStart(5)}  ` +
        `openai=$${openaiCost.toFixed(4)}  elevenlabs(${flags.model})=$${elevenCost.toFixed(4)}`,
    );
  }
  console.log(`\n  TOTAL chars=${totalChars}`);
  console.log(`  TOTAL openai est.      = $${estimateCostUsd(totalChars, "openai").toFixed(4)}`);
  console.log(
    `  TOTAL elevenlabs est.  = $${estimateCostUsd(totalChars, "elevenlabs", flags.model).toFixed(4)} (per voice, model=${flags.model})`,
  );

  if (flags.voices.length > 0) {
    console.log(`\n  Per-voice estimate (elevenlabs, model=${flags.model}):`);
    const perVoiceCost = estimateCostUsd(totalChars, "elevenlabs", flags.model);
    for (const v of flags.voices) {
      console.log(`    ${v.label.padEnd(24)} (${v.id})  est=$${perVoiceCost.toFixed(4)}`);
    }
  }
}

async function writeReadme(
  outDirAbs: string,
  results: SlugResult[],
  flags: Flags,
): Promise<void> {
  const lines: string[] = [];
  lines.push(`# ElevenLabs voice bake-off — FV-285`);
  lines.push("");
  lines.push(`Run date: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`Model: ${flags.model}`);
  lines.push(
    `Voices: ${flags.voices.map((v) => `${v.label} (${v.id})`).join(", ") || "(none — current master only)"}`,
  );
  lines.push("");

  const totalsByLabel = new Map<
    string,
    { durationSec: number; chars: number; costUsd: number | null }
  >();

  for (const { slug, variants } of results) {
    lines.push(`## ${slug}`);
    lines.push("");
    lines.push("| Variant | Duration (s) | Chars | Est. cost | LUFS-I | dBTP |");
    lines.push("|---|---|---|---|---|---|");
    for (const v of variants) {
      lines.push(
        `| ${v.label} | ${v.durationSec.toFixed(2)} | ${v.chars} | ${fmtCost(v.costUsd)} | ${fmtLufs(v.lufsI)} | ${fmtPeak(v.truePeak)} |`,
      );
      const prior = totalsByLabel.get(v.label) ?? { durationSec: 0, chars: 0, costUsd: v.isCurrent ? null : 0 };
      prior.durationSec += v.durationSec;
      prior.chars += v.chars;
      if (!v.isCurrent) prior.costUsd = (prior.costUsd ?? 0) + (v.costUsd ?? 0);
      totalsByLabel.set(v.label, prior);
    }
    lines.push("");
  }

  lines.push(`## Totals per voice`);
  lines.push("");
  lines.push("| Voice | Total duration (s) | Total chars | Est. total cost |");
  lines.push("|---|---|---|---|");
  for (const [label, t] of totalsByLabel) {
    lines.push(`| ${label} | ${t.durationSec.toFixed(2)} | ${t.chars} | ${fmtCost(t.costUsd)} |`);
  }
  lines.push("");

  lines.push(`## How to listen`);
  lines.push("");
  lines.push(
    `Open \`${flags.outDir}/\` and A/B each slug's files back-to-back — ideally on phone ` +
      `headphones, since that's the actual delivery surface. \`current-ash.mp3\` is the ` +
      `currently-shipped OpenAI/ash master, loudnorm-passed the same way as the candidates so ` +
      `the comparison is level-matched. These numbers only rule out clipping (dBTP should be ` +
      `< 0) and gross level mismatches — the final call is by ear, and it's KC's.`,
  );
  lines.push("");

  await writeFile(join(outDirAbs, "README.md"), lines.join("\n") + "\n");
}

// ──────────────────────────────────────────────────────────────────────
// Main

async function main(): Promise<void> {
  await tryLoadEnvLocal();
  const flags = parseFlags(process.argv.slice(2));

  if (flags.listVoices) {
    const voices = await listElevenLabsVoices();
    printVoicesTable(voices);
    return;
  }

  const bookData: Map<string, BookEntry> = await loadBookProseWithPauses();
  const slugs = flags.slugs.length > 0 ? flags.slugs : [...DEFAULT_SLUGS];
  const resolved = slugs.map((slug) => {
    const script = findScriptBySlug(slug);
    const segments = applyBookProseOverrides(script, bookData);
    return { script, segments };
  });

  if (flags.dryRun) {
    printDryRun(resolved, flags);
    return;
  }

  if (flags.voices.length === 0) {
    console.error(
      "bakeoff-voices: --voices <voiceId[:label]>[,...] is required " +
        "(or pass --dry-run / --list-voices).",
    );
    process.exit(1);
  }

  // Model is env-driven inside tts.ts (matches how TTS_PROVIDER is
  // env-driven) so --model flows through without extending TtsOptions.
  process.env.ELEVENLABS_MODEL_ID = flags.model;

  const outDirAbs = resolveOutDir(flags.outDir);
  const publicDir = resolve(process.cwd(), "public");
  await mkdir(outDirAbs, { recursive: true });

  const results: SlugResult[] = [];

  for (const { script, segments } of resolved) {
    const slugDir = join(outDirAbs, script.slug);
    const workDir = join(slugDir, ".work");
    await mkdir(slugDir, { recursive: true });
    await mkdir(workDir, { recursive: true });

    const variants: VariantResult[] = [];

    const currentMaster = await renderCurrentMaster(script, segments, publicDir, slugDir);
    if (currentMaster) variants.push(currentMaster);

    for (const voice of flags.voices) {
      const result = await renderCandidate(script, segments, voice, flags.model, slugDir, workDir);
      variants.push(result);
    }

    results.push({ slug: script.slug, variants });

    if (!flags.keepSegments) {
      await rm(workDir, { recursive: true, force: true });
    } else {
      console.log(`   (kept per-segment files in ${workDir})`);
    }
    // Silence is cached by duration only, not by workDir — clear between
    // slugs so a later slug never reuses a path from a workDir we just
    // deleted (or, with --keep-segments, a now-stale different directory).
    clearSilenceCache();
  }

  await writeReadme(outDirAbs, results, flags);

  console.log(`\n[bakeoff] Done. Candidates + README written to ${outDirAbs}/`);
  console.log(`[bakeoff] These MP3s are NOT committed (see root .gitignore) — listen locally.`);
}

// import.meta guard (matches generate-pregame-audio.ts) so importing this
// module for tests never fires main().
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  void main();
}
