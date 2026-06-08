#!/usr/bin/env node
// Pregame audio level QA — FV-143
//
// Reads the clip manifest (clips/manifest.json) plus the top-level legacy
// MP3s (breath-threshold, opener-*, session-*), measures each file's
// loudness and true-peak via ffmpeg, and emits a per-clip report.
//
// Measurements:
//   - Integrated LUFS (I) via ffmpeg ebur128 filter — this is the
//     broadcast-standard "loudness" metric; the pipeline targets -16 LUFS.
//   - True-peak dBFS via ebur128=peak=true — EBU R128 inter-sample peak.
//     Target: < -0.5 dBFS (flags anything with clipping risk).
//
// Note: volumedetect's mean_volume is RMS-average dB, NOT integrated LUFS.
// This script uses ebur128 for the correct measurement.
//
// Flags:
//   --manifest-only   Measure only clips in the manifest (skip legacy top-level MP3s)
//   --clips-only      Measure only clips/manifest.json entries
//   --legacy-only     Measure only top-level legacy MP3s (no manifest read)
//   --csv             Emit output as CSV (slug,lufs_i,true_peak_dbfs,lufs_flag,peak_flag)
//   --out <file>      Write CSV/table output to a file (in addition to stdout)
//   --public-dir <p>  Override the public/ directory path (default: public/)
//   --help            Show this help
//
// Run (from apps/web/):
//   node --experimental-strip-types scripts/qa-audio-levels.ts
//   node --experimental-strip-types scripts/qa-audio-levels.ts --csv
//   node --experimental-strip-types scripts/qa-audio-levels.ts --csv --out qa-report.csv
//
// Prereqs: ffmpeg on PATH (brew install ffmpeg).

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------

const LUFS_TARGET = -16;
const LUFS_TOLERANCE = 2; // ±2 dB → flag outside [-18, -14]
const PEAK_FLAG_THRESHOLD = -0.5; // max_volume > -0.5 dBFS → clipping risk

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClipCatalogEntry = {
  url: string;
  durationSec: number;
};

type ClipManifest = {
  version: string;
  clips: Record<string, ClipCatalogEntry>;
};

type MeasureResult = {
  slug: string;
  filePath: string;
  lufsI: number | null; // Integrated LUFS (ebur128)
  truePeak: number | null; // True-peak dBFS (ebur128=peak=true)
  lufsFlag: boolean; // true = outside ±2 dB of -16 LUFS
  peakFlag: boolean; // true = true-peak > -0.5 dBFS
  error: string | null;
};

// ---------------------------------------------------------------------------
// ffmpeg helpers
// ---------------------------------------------------------------------------

/**
 * Run a command, capturing both stdout and stderr.
 * Returns { stdout, stderr, code }.
 */
async function runCapture(
  cmd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve2) => {
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
      resolve2({ stdout: "", stderr: msg, code: 1 });
    });
    child.on("close", (code: number | null) => {
      resolve2({ stdout, stderr, code: code ?? 1 });
    });
  });
}

/**
 * Measure integrated LUFS and true-peak via ebur128.
 *
 * ffmpeg's ebur128 filter writes its summary to stderr at the end of the
 * analysis pass (it uses null muxer so no output file is needed).
 *
 * Example summary block:
 *   Summary:
 *     Integrated loudness:
 *       I:         -16.4 LUFS
 *       ...
 *     True peak:
 *       Peak:       -1.8 dBFS
 */
async function measureFile(
  filePath: string,
): Promise<{ lufsI: number | null; truePeak: number | null; error: string | null }> {
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

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

/**
 * Convert a manifest URL like "/audio/pregame/clips/foo.mp3" to an absolute
 * filesystem path under the given publicDir.
 * Strips the leading "/" before joining.
 */
function urlToPath(url: string, publicDir: string): string {
  // Remove any ?v= cache-bust query string that may be present.
  const noQuery = url.split("?")[0] as string;
  // Strip leading slash so join works correctly.
  const relative = noQuery.startsWith("/") ? noQuery.slice(1) : noQuery;
  return join(publicDir, relative);
}

// ---------------------------------------------------------------------------
// Measurement runner
// ---------------------------------------------------------------------------

async function measureSlug(
  slug: string,
  filePath: string,
): Promise<MeasureResult> {
  if (!existsSync(filePath)) {
    return {
      slug,
      filePath,
      lufsI: null,
      truePeak: null,
      lufsFlag: false,
      peakFlag: false,
      error: `File not found: ${filePath}`,
    };
  }

  const { lufsI, truePeak, error } = await measureFile(filePath);

  const lufsFlag =
    lufsI !== null && Math.abs(lufsI - LUFS_TARGET) > LUFS_TOLERANCE;
  const peakFlag =
    truePeak !== null && isFinite(truePeak) && truePeak > PEAK_FLAG_THRESHOLD;

  return {
    slug,
    filePath,
    lufsI,
    truePeak,
    lufsFlag,
    peakFlag,
    error,
  };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function formatLufs(v: number | null): string {
  if (v === null) return "ERR";
  return v.toFixed(1);
}

function formatPeak(v: number | null): string {
  if (v === null) return "ERR";
  if (!isFinite(v)) return "-inf";
  return v.toFixed(1);
}

function renderTable(results: MeasureResult[]): string {
  const lines: string[] = [];
  const header =
    "slug".padEnd(52) +
    "  " +
    "LUFS-I".padStart(8) +
    "  " +
    "TruePeak".padStart(9) +
    "  " +
    "flags";
  lines.push(header);
  lines.push("-".repeat(header.length));

  for (const r of results) {
    const flags: string[] = [];
    if (r.error) {
      flags.push("ERROR");
    } else {
      if (r.lufsFlag) flags.push(`LUFS(${formatLufs(r.lufsI)}, target -16±2)`);
      if (r.peakFlag) flags.push(`PEAK(${formatPeak(r.truePeak)} > -0.5)`);
    }
    const flagStr = flags.length > 0 ? flags.join("; ") : "ok";
    const line =
      r.slug.padEnd(52) +
      "  " +
      formatLufs(r.lufsI).padStart(8) +
      "  " +
      formatPeak(r.truePeak).padStart(9) +
      "  " +
      flagStr;
    lines.push(line);
  }
  return lines.join("\n");
}

function renderCsv(results: MeasureResult[]): string {
  const rows: string[] = [
    "slug,lufs_integrated_ebur128,true_peak_dbfs_ebur128,lufs_flag,peak_flag,error",
  ];
  for (const r of results) {
    rows.push(
      [
        r.slug,
        r.lufsI !== null ? r.lufsI.toFixed(2) : "",
        r.truePeak !== null ? (isFinite(r.truePeak) ? r.truePeak.toFixed(2) : "-inf") : "",
        r.lufsFlag ? "1" : "0",
        r.peakFlag ? "1" : "0",
        r.error ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
  }
  return rows.join("\n");
}

function renderSummary(results: MeasureResult[]): string {
  const flagged = results.filter((r) => r.lufsFlag || r.peakFlag || r.error);
  const errors = results.filter((r) => r.error);
  const lufsFlagged = results.filter((r) => r.lufsFlag);
  const peakFlagged = results.filter((r) => r.peakFlag);

  const lines: string[] = [];
  lines.push("");
  lines.push(`=== QA SUMMARY ===`);
  lines.push(`Total clips measured : ${results.length}`);
  lines.push(`Passed               : ${results.length - flagged.length}`);
  lines.push(`Flagged total        : ${flagged.length}`);
  lines.push(`  LUFS off-target    : ${lufsFlagged.length}  (outside -16 ±2 dB)`);
  lines.push(`  True-peak risk     : ${peakFlagged.length}  (> -0.5 dBFS)`);
  lines.push(`  Errors             : ${errors.length}`);

  if (lufsFlagged.length > 0) {
    lines.push("");
    lines.push("LUFS-flagged clips:");
    for (const r of lufsFlagged) {
      lines.push(`  ${r.slug.padEnd(52)} I=${formatLufs(r.lufsI)} LUFS  (Δ${(r.lufsI! - LUFS_TARGET).toFixed(1)} from -16)`);
    }
  }

  if (peakFlagged.length > 0) {
    lines.push("");
    lines.push("True-peak-flagged clips:");
    for (const r of peakFlagged) {
      lines.push(`  ${r.slug.padEnd(52)} Peak=${formatPeak(r.truePeak)} dBFS`);
    }
  }

  if (errors.length > 0) {
    lines.push("");
    lines.push("Errors:");
    for (const r of errors) {
      lines.push(`  ${r.slug}: ${r.error}`);
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

type Flags = {
  manifestOnly: boolean;
  clipsOnly: boolean;
  legacyOnly: boolean;
  csv: boolean;
  outFile: string | null;
  publicDir: string;
  help: boolean;
};

function parseFlags(argv: string[]): Flags {
  const f: Flags = {
    manifestOnly: false,
    clipsOnly: false,
    legacyOnly: false,
    csv: false,
    outFile: null,
    publicDir: "public",
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;
    if (a === "--help" || a === "-h") f.help = true;
    else if (a === "--manifest-only") f.manifestOnly = true;
    else if (a === "--clips-only") f.clipsOnly = true;
    else if (a === "--legacy-only") f.legacyOnly = true;
    else if (a === "--csv") f.csv = true;
    else if (a === "--out" && argv[i + 1]) {
      f.outFile = argv[++i] as string;
    } else if (a === "--public-dir" && argv[i + 1]) {
      f.publicDir = argv[++i] as string;
    }
  }
  return f;
}

const HELP = `
qa-audio-levels — Pregame audio loudness QA (FV-143)

Run from apps/web/:
  node --experimental-strip-types scripts/qa-audio-levels.ts [flags]

Flags:
  --manifest-only   Measure only clips listed in clips/manifest.json (same as --clips-only for now)
  --clips-only      Measure only clips/manifest.json entries
  --legacy-only     Measure only top-level legacy MP3s (breath-threshold, opener-*, session-*)
  --csv             Emit output as CSV
  --out <file>      Write CSV/table to a file (also printed to stdout)
  --public-dir <p>  Override public/ directory (default: public/)
  --help            Show this help

Columns (table mode):
  slug              Clip slug as it appears in the manifest or on disk
  LUFS-I            Integrated loudness in LUFS, measured via ffmpeg ebur128 filter.
                    Target: -16 LUFS. Flagged if outside -16 ±2 dB (i.e. < -18 or > -14).
  TruePeak          True-peak dBFS via ebur128=peak=true (EBU R128 inter-sample peak).
                    Flagged if > -0.5 dBFS (clipping risk).
  flags             "ok" | LUFS(...) | PEAK(...) | ERROR

Measurement note:
  ebur128 Integrated LUFS is the correct broadcast-standard metric for perceived
  loudness targeting (not volumedetect's mean_volume, which is RMS-average dB and
  lacks the gating that makes LUFS track perception). True-peak is the EBU R128
  inter-sample peak estimator, more accurate than sample-max for compressed audio.
`.trim();

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));

  if (flags.help) {
    console.log(HELP);
    return;
  }

  const publicDir = resolve(process.cwd(), flags.publicDir);
  const pregameDir = join(publicDir, "audio", "pregame");
  const clipsDir = join(pregameDir, "clips");
  const manifestPath = join(clipsDir, "manifest.json");

  // ── Collect targets ────────────────────────────────────────────────────────
  const targets: Array<{ slug: string; filePath: string }> = [];

  // Manifest clips (clips/manifest.json)
  if (!flags.legacyOnly) {
    if (!existsSync(manifestPath)) {
      console.error(
        `Manifest not found: ${manifestPath}\n` +
          `Run audio:generate --mode clips first, or use --legacy-only to skip the manifest.`,
      );
      process.exit(1);
    }
    const raw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw) as ClipManifest;
    for (const [slug, entry] of Object.entries(manifest.clips)) {
      targets.push({
        slug,
        filePath: urlToPath(entry.url, publicDir),
      });
    }
  }

  // Top-level legacy MP3s (breath-threshold, opener-*, session-*)
  if (!flags.clipsOnly && !flags.manifestOnly) {
    const legacySlugs: string[] = [];
    // Discover all .mp3 files directly under pregameDir (not in clips/).
    // We use a node:fs readdir approach so we don't add a glob dep.
    const { readdirSync } = await import("node:fs");
    const entries = readdirSync(pregameDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isFile() && ent.name.endsWith(".mp3")) {
        const slug = ent.name.slice(0, -4); // strip .mp3
        legacySlugs.push(slug);
      }
    }
    legacySlugs.sort();
    for (const slug of legacySlugs) {
      targets.push({
        slug: `[legacy] ${slug}`,
        filePath: join(pregameDir, `${slug}.mp3`),
      });
    }
  }

  if (targets.length === 0) {
    console.error("No audio files to measure. Check --public-dir and flags.");
    process.exit(1);
  }

  console.log(
    `\nMeasuring ${targets.length} clips (integrated LUFS + true-peak via ebur128)...\n`,
  );

  // ── Measure in sequence (ffmpeg spawns many processes; parallel has no
  //    throughput gain on a single SSD read path and clutters the terminal).
  const results: MeasureResult[] = [];
  let done = 0;
  for (const t of targets) {
    const r = await measureSlug(t.slug, t.filePath);
    results.push(r);
    done++;
    if (done % 20 === 0 || done === targets.length) {
      process.stderr.write(`  ${done}/${targets.length} measured\r`);
    }
  }
  process.stderr.write("\n");

  // ── Output ─────────────────────────────────────────────────────────────────
  let output: string;
  if (flags.csv) {
    output = renderCsv(results);
    console.log(output);
  } else {
    output = renderTable(results);
    console.log(output);
  }

  const summary = renderSummary(results);
  console.log(summary);

  if (flags.outFile) {
    const outPath = resolve(process.cwd(), flags.outFile);
    await writeFile(outPath, output + "\n" + summary + "\n");
    console.log(`\nOutput written to ${outPath}`);
  }

  // Exit 1 if any clips were flagged or errored, so CI can detect regressions.
  const anyFlagged = results.some((r) => r.lufsFlag || r.peakFlag || r.error);
  if (anyFlagged) {
    process.exit(1);
  }
}

void main();
