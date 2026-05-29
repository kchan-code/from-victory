// ffmpeg + ffprobe wrappers. Shells out to the user's installed binaries
// (brew install ffmpeg). No npm deps.

import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
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

// Concatenate a sequence of MP3 inputs into one output file.
// Uses ffmpeg's concat demuxer, which requires identical codec/sample-rate
// across inputs — that's why silence is generated at 24kHz mono.
export async function concatMp3s(
  inputs: ConcatInput[],
  outPath: string,
  workDir: string,
  // Optional ffmpeg audio-filter chain. When set, the concatenated stream is
  // re-encoded through this filter (24kHz mono, matching the TTS source)
  // instead of being stream-copied — used to correct a render's tonal
  // balance (see AudioScript.postFilter).
  filter?: string,
): Promise<void> {
  // Resolve every silence to a generated MP3 path first.
  const resolved: string[] = [];
  for (const inp of inputs) {
    if (inp.kind === "file") resolved.push(inp.path);
    else resolved.push(await silenceMp3(inp.durationSec, workDir));
  }

  const listPath = join(workDir, "concat-list.txt");
  const listBody = resolved.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  await writeFile(listPath, listBody);

  const args = filter
    ? [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listPath,
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
      ]
    : [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listPath,
        "-c",
        "copy",
        outPath,
      ];
  await runVoid("ffmpeg", args);
}

export function clearSilenceCache(): void {
  SILENCE_CACHE.clear();
}

// ──────────────────────────────────────────────────────────────────────
// Process helpers

async function runVoid(cmd: string, args: string[]): Promise<void> {
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
