// ffmpeg + ffprobe wrappers. Shells out to the user's installed binaries
// (brew install ffmpeg). No npm deps.

import { spawn } from "node:child_process";
import { join } from "node:path";

export type ConcatInput =
  | { kind: "file"; path: string }
  | { kind: "silence"; durationSec: number };

// Sentinel value used by the silence-MP3 path so generateSilence only
// produces each distinct duration once per run.
const SILENCE_CACHE = new Map<number, string>();

export async function probeDurationSec(filePath: string): Promise<number> {
  const args = [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ];
  const out = await runCapture("ffprobe", args);
  const n = Number.parseFloat(out.trim());
  if (!Number.isFinite(n)) {
    throw new Error(`ffprobe produced non-numeric duration for ${filePath}: ${out}`);
  }
  return n;
}

// Generate a silent MP3 of the given duration. Cached per duration so
// "silence 4s" only renders once per generator run.
export async function silenceMp3(
  durationSec: number,
  workDir: string,
): Promise<string> {
  const key = Math.round(durationSec * 1000) / 1000;
  const cached = SILENCE_CACHE.get(key);
  if (cached) return cached;

  const path = join(workDir, `silence-${key}s.mp3`);
  // anullsrc generates silence at the requested sample rate. -t caps the
  // length. Mono 24kHz matches OpenAI TTS output so concat doesn't have
  // to resample.
  const args = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=channel_layout=mono:sample_rate=24000",
    "-t",
    String(durationSec),
    "-acodec",
    "libmp3lame",
    "-b:a",
    "64k",
    path,
  ];
  await runVoid("ffmpeg", args);
  SILENCE_CACHE.set(key, path);
  return path;
}

// Short edge fade applied to every input before the join (see concatMp3s).
// Long enough to guarantee no input can splice in/out on a non-zero,
// non-decayed sample; short enough to be inaudible as a fade.
const EDGE_FADE_SEC = 0.008;

// Concatenate a sequence of MP3 inputs into one output file.
//
// PCM-domain join via ffmpeg's concat FILTER (`-filter_complex`), not the
// concat DEMUXER's raw-frame stream copy. FV-285 follow-up: the demuxer
// path spliced independently-encoded MP3 segments (TTS speech at 128k,
// generated silence beds at 64k) at the compressed-frame level, which does
// two bad things — (1) MP3 frame boundaries / LAME encoder delay+padding
// don't line up cleanly across separately-encoded files the way the concat
// demuxer handles them, and (2) a segment can end on a non-zero,
// non-decayed sample (this is inaudible with OpenAI "ash", whose renders
// happen to trail off near zero, but audible as a click/pop with some
// ElevenLabs candidates, which can cut off mid-waveform). Decoding every
// input as its own `-i` (not through the concat demuxer) lets ffmpeg apply
// each file's own LAME gapless info correctly, and a short edge fade on
// every input guarantees the join always crosses zero — even if a future
// TTS provider's segment doesn't decay naturally. The fade is a no-op on
// silence beds (already at 0 amplitude at their edges), so no caller needs
// to tell us which inputs are "speech" vs "silence" file paths.
export async function concatMp3s(
  inputs: ConcatInput[],
  outPath: string,
  workDir: string,
  // Optional ffmpeg audio-filter chain, applied once after the join (24kHz
  // mono, matching the TTS source) — used to correct a render's tonal
  // balance (see AudioScript.postFilter).
  filter?: string,
): Promise<void> {
  // Resolve every silence to a generated MP3 path first.
  const resolved: string[] = [];
  for (const inp of inputs) {
    if (inp.kind === "file") resolved.push(inp.path);
    else resolved.push(await silenceMp3(inp.durationSec, workDir));
  }

  if (resolved.length === 0) {
    throw new Error("concatMp3s: no inputs to concatenate");
  }

  const durations = await Promise.all(resolved.map((p) => probeDurationSec(p)));

  const inputArgs: string[] = [];
  const filterParts: string[] = [];
  resolved.forEach((p, i) => {
    inputArgs.push("-i", p);
    const dur = durations[i] ?? 0;
    // Clamp so in/out fades never overlap on a very short input.
    const fade = Math.max(0, Math.min(EDGE_FADE_SEC, dur / 2));
    const fadeOutStart = Math.max(0, dur - fade);
    filterParts.push(
      `[${i}:a]afade=t=in:st=0:d=${fade.toFixed(4)},` +
        `afade=t=out:st=${fadeOutStart.toFixed(4)}:d=${fade.toFixed(4)}[a${i}]`,
    );
  });
  const concatLabels = resolved.map((_, i) => `[a${i}]`).join("");
  filterParts.push(`${concatLabels}concat=n=${resolved.length}:v=0:a=1[joined]`);
  if (filter) filterParts.push(`[joined]${filter}[final]`);
  const outLabel = filter ? "[final]" : "[joined]";

  const args = [
    "-y",
    ...inputArgs,
    "-filter_complex",
    filterParts.join(";"),
    "-map",
    outLabel,
    "-ar",
    "24000",
    "-ac",
    "1",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "128k",
    outPath,
  ];
  await runVoid("ffmpeg", args);
}

export function clearSilenceCache(): void {
  SILENCE_CACHE.clear();
}

// Re-encode a single MP3 through an ffmpeg audio-filter chain.
// Used to loudnorm-pass an existing file (e.g. an opener MP3) to match
// the clip loudness target without re-running TTS.
export async function reEncodeMp3(
  inPath: string,
  outPath: string,
  filter: string,
): Promise<void> {
  const args = [
    "-y",
    "-i",
    inPath,
    "-af",
    filter,
    "-ar",
    "24000",
    "-ac",
    "1",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "128k",
    outPath,
  ];
  await runVoid("ffmpeg", args);
}

// Transcode an arbitrary MP3 (e.g. ElevenLabs' 44.1kHz output) down to
// 24kHz mono — the sample rate the rest of the pipeline (silence MP3s,
// concatMp3s' decode-and-join) requires. See scripts/lib/tts.ts's
// ElevenLabs path (FV-285).
export async function transcodeTo24kMonoMp3(
  inPath: string,
  outPath: string,
): Promise<void> {
  const args = [
    "-y",
    "-i",
    inPath,
    "-ar",
    "24000",
    "-ac",
    "1",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "128k",
    outPath,
  ];
  await runVoid("ffmpeg", args);
}

// ──────────────────────────────────────────────────────────────────────
// Process helpers

export async function runVoid(cmd: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            `${cmd} not found on PATH. Install ffmpeg first: brew install ffmpeg`,
          ),
        );
      } else {
        reject(err);
      }
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `${cmd} ${args.join(" ")} exited ${code}\n${stderr.slice(-800)}`,
          ),
        );
    });
  });
}

async function runCapture(cmd: string, args: string[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            `${cmd} not found on PATH. Install ffmpeg first: brew install ffmpeg`,
          ),
        );
      } else {
        reject(err);
      }
    });
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${cmd} exited ${code}: ${stderr.slice(-400)}`));
    });
  });
}
