// Shared ebur128 loudness / true-peak measurement helper.
//
// Extracted from qa-audio-levels.ts (FV-285) so bakeoff-voices.ts can reuse
// the exact same ffmpeg-stderr parsing instead of duplicating it. Behavior
// is unchanged from the pre-extraction inline version.
//
// ffmpeg's ebur128 filter writes its summary to stderr at the end of the
// analysis pass (it uses the null muxer, so no output file is needed).
//
// Example summary block:
//   Summary:
//     Integrated loudness:
//       I:         -16.4 LUFS
//       ...
//     True peak:
//       Peak:       -1.8 dBFS

import { spawn } from "node:child_process";

export type LoudnessMeasurement = {
  lufsI: number | null; // Integrated LUFS (ebur128)
  truePeak: number | null; // True-peak dBFS (ebur128=peak=true)
  error: string | null;
};

async function runCapture(
  cmd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolvePromise) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    child.on("error", (err: NodeJS.ErrnoException) => {
      const msg =
        err.code === "ENOENT"
          ? `${cmd} not found on PATH. Install ffmpeg: brew install ffmpeg`
          : err.message;
      resolvePromise({ stdout: "", stderr: msg, code: 1 });
    });
    child.on("close", (code: number | null) => {
      resolvePromise({ stdout, stderr, code: code ?? 1 });
    });
  });
}

/**
 * Measure integrated LUFS and true-peak via ffmpeg's ebur128 filter.
 * Use `-hide_banner`, not `-v error` — `-v error` suppresses the ebur128
 * summary along with everything else.
 */
export async function measureLoudness(filePath: string): Promise<LoudnessMeasurement> {
  const { stderr, code } = await runCapture("ffmpeg", [
    "-hide_banner",
    "-i",
    filePath,
    "-af",
    "ebur128=peak=true",
    "-f",
    "null",
    "/dev/null",
  ]);

  if (code !== 0 && !stderr.includes("Summary:")) {
    return {
      lufsI: null,
      truePeak: null,
      error: `ffmpeg exited ${code}: ${stderr.slice(-200)}`,
    };
  }

  // Parse integrated LUFS from the summary block only.
  // The summary line format is exactly "    I:         -16.4 LUFS" (4 leading spaces).
  // The per-100ms time-series lines also contain "I:" but they are embedded in a
  // "[Parsed_ebur128_0 @ 0x...] t: ..." prefix — we anchor to ^    I: to skip them.
  // Using the last match (global flag + pop) to handle the edge case where multiple
  // summary blocks appear (shouldn't happen, but be defensive).
  const lufsMatches = [...stderr.matchAll(/^    I:\s+([-\d.]+)\s+LUFS/gm)];
  const lufsMatch = lufsMatches[lufsMatches.length - 1];
  const lufsI = lufsMatch ? parseFloat(lufsMatch[1] as string) : null;

  // Parse true peak from the summary block: "    Peak:       -1.8 dBFS"
  // ebur128 reports "-inf" when there is no true peak above the detection
  // floor (e.g. pure silence), represented here as -Infinity.
  // Anchor to ^    Peak: to skip any per-sample FTPK/TPK lines.
  const peakMatches = [...stderr.matchAll(/^    Peak:\s+([-\d.inf]+)\s+dBFS/gim)];
  const peakMatch = peakMatches[peakMatches.length - 1];
  let truePeak: number | null = null;
  if (peakMatch) {
    const raw = (peakMatch[1] as string).toLowerCase();
    truePeak = raw === "-inf" ? -Infinity : parseFloat(raw);
  }

  if (lufsI === null || truePeak === null) {
    return {
      lufsI,
      truePeak,
      error: `Could not parse ebur128 summary. stderr snippet: ${stderr.slice(-300)}`,
    };
  }

  return { lufsI, truePeak, error: null };
}
