#!/usr/bin/env node
// Export all pregame + pre-practice AudioScript spoken text to human-readable
// Markdown "script books" under docs/scripts/.
//
// Run: npm run scripts:export   (from apps/web/)
//
// Each .md file is one "sport bucket" (plus shared + pre-practice). KC edits
// the numbered prose lines; then runs `npm run scripts:apply` to push edits
// back into the TypeScript source.
//
// Files written:
//   docs/scripts/hockey.md
//   docs/scripts/basketball.md
//   docs/scripts/baseball.md
//   docs/scripts/golf.md
//   docs/scripts/football.md
//   docs/scripts/swimming.md
//   docs/scripts/track-field.md
//   docs/scripts/shared.md
//   docs/scripts/pre-practice.md
//   docs/scripts/README.md

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { CLIP_SCRIPTS } from "../components/pregame/audio/clips.ts";
import type { AudioScript, Segment } from "../components/pregame/audio/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve path relative to the apps/web root (two levels up from scripts/)
const WEB_ROOT = join(__dirname, "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const DOCS_SCRIPTS_DIR = join(REPO_ROOT, "docs", "scripts");
const SPORT_REGISTRY_PATH = join(WEB_ROOT, "components/pregame/sport-registry.ts");
const PREGAME_TYPES_PATH = join(WEB_ROOT, "components/pregame/types.ts");

// ── Parse audioScript fallback bodies from sport-registry.ts as text ─────────
// We avoid importing sport-registry.ts (it has extensionless value imports that
// break node --strip-types). Instead we extract body: strings via regex.
//
// Each const XXXX_AUDIO_SCRIPT (or export const AUDIO_SCRIPT) is a block of
// AudioSegment objects. We extract the body field value from each element.

type FallbackEntry = {
  sportLabel: string;
  constName: string; // TS const name as it appears in the file
  eyebrows: string[];
  bodies: string[]; // raw body strings (template expressions left as-is)
};

async function parseFallbacksFromRegistry(): Promise<FallbackEntry[]> {
  const registrySrc = await readFile(SPORT_REGISTRY_PATH, "utf8");
  // AUDIO_SCRIPT is declared in types.ts and imported into sport-registry.ts;
  // parse it from types.ts directly.
  const typesSrc = await readFile(PREGAME_TYPES_PATH, "utf8");

  // Map of const name → { sportLabel, fileSrc to search in }
  // Baseball uses the shared AUDIO_SCRIPT as a placeholder.
  const constMap: Array<{ constName: string; sportLabel: string; fileSrc: string }> = [
    { constName: "AUDIO_SCRIPT", sportLabel: "Hockey", fileSrc: typesSrc },
    { constName: "BASKETBALL_AUDIO_SCRIPT", sportLabel: "Basketball", fileSrc: registrySrc },
    { constName: "GOLF_AUDIO_SCRIPT", sportLabel: "Golf", fileSrc: registrySrc },
    { constName: "FOOTBALL_AUDIO_SCRIPT", sportLabel: "Football", fileSrc: registrySrc },
    { constName: "SWIMMING_AUDIO_SCRIPT", sportLabel: "Swimming", fileSrc: registrySrc },
    { constName: "TRACKFIELD_AUDIO_SCRIPT", sportLabel: "Track & Field", fileSrc: registrySrc },
  ];

  const results: FallbackEntry[] = [];

  for (const { constName, sportLabel, fileSrc } of constMap) {
    // Find the const declaration
    const declPattern = constName === "AUDIO_SCRIPT"
      ? /export const AUDIO_SCRIPT: AudioSegment\[\] = \[/
      : new RegExp(`const ${constName}: AudioSegment\\[\\] = \\[`);

    const declMatch = fileSrc.match(declPattern);
    if (!declMatch || declMatch.index === undefined) {
      console.warn(`WARN: Could not find ${constName} in source file`);
      continue;
    }

    const start = declMatch.index + declMatch[0].length;
    let depth = 1;
    let pos = start;
    while (pos < fileSrc.length && depth > 0) {
      if (fileSrc[pos] === "[") depth++;
      else if (fileSrc[pos] === "]") depth--;
      pos++;
    }
    const block = fileSrc.slice(start, pos - 1);

    // Extract eyebrow and body fields from each { startSec:..., eyebrow:..., body:... } object
    const eyebrows: string[] = [];
    const bodies: string[] = [];

    // Split block into individual segment objects by detecting { at top level
    // We'll use a simple state machine to find each {…} object
    const segmentTexts: string[] = [];
    let segDepth = 0;
    let segStart = -1;
    for (let i = 0; i < block.length; i++) {
      if (block[i] === "{") {
        if (segDepth === 0) segStart = i;
        segDepth++;
      } else if (block[i] === "}") {
        segDepth--;
        if (segDepth === 0 && segStart !== -1) {
          segmentTexts.push(block.slice(segStart, i + 1));
          segStart = -1;
        }
      }
    }

    for (const segText of segmentTexts) {
      // Extract eyebrow — always a plain double-quoted string
      const eyebrowMatch = segText.match(/eyebrow:\s*"((?:[^"\\]|\\.)*)"/);
      const eyebrow = eyebrowMatch?.[1] != null ? unescapeTs(eyebrowMatch[1]!) : "";
      eyebrows.push(eyebrow);

      // Extract body — can be double-quoted, template literal, or template literal with ${...}
      let body = "";
      const dqMatch = segText.match(/body:\s*"((?:[^"\\]|\\.)*)"/);
      if (dqMatch?.[1] != null) {
        body = unescapeTs(dqMatch[1]!);
      } else {
        // Template literal — extract everything between backticks
        const tlMatch = segText.match(/body:\s*`([\s\S]*?)`/);
        if (tlMatch?.[1] != null) {
          body = tlMatch[1]!.replace(/\\`/g, "`").replace(/\\\\/g, "\\");
        }
      }
      bodies.push(body);
    }

    results.push({ sportLabel, constName, eyebrows, bodies });
  }

  return results;
}

// Unescape a TypeScript double-quoted string literal's content
function unescapeTs(s: string): string {
  return s
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

// ── Slug → source file map ────────────────────────────────────────────────────

function sourceFileForSlug(slug: string): string {
  if (slug.startsWith("session-forward-")) return "components/pregame/audio/session-forward-" + slug.slice("session-forward-".length) + ".ts";
  if (slug.startsWith("session-defense-")) return "components/pregame/audio/session-defense-" + slug.slice("session-defense-".length) + ".ts";
  if (slug.startsWith("session-goalie-")) return "components/pregame/audio/session-goalie-" + slug.slice("session-goalie-".length) + ".ts";
  // bb-guard-* / bb-wing-* / bb-big-* slugs live in session-guard-*/session-wing-*/session-big-* files
  if (slug.startsWith("bb-guard-")) return "components/pregame/audio/session-guard-" + slug.slice("bb-guard-".length) + ".ts";
  if (slug.startsWith("bb-wing-")) return "components/pregame/audio/session-wing-" + slug.slice("bb-wing-".length) + ".ts";
  if (slug.startsWith("bb-big-")) return "components/pregame/audio/session-big-" + slug.slice("bb-big-".length) + ".ts";
  if (slug.startsWith("session-guard-")) return "components/pregame/audio/session-guard-" + slug.slice("session-guard-".length) + ".ts";
  if (slug.startsWith("session-wing-")) return "components/pregame/audio/session-wing-" + slug.slice("session-wing-".length) + ".ts";
  if (slug.startsWith("session-big-")) return "components/pregame/audio/session-big-" + slug.slice("session-big-".length) + ".ts";
  if (slug.startsWith("hm-bsb-") || slug === "viz-pitcher" || slug === "viz-catcher" || slug === "viz-infield" || slug === "viz-outfield") {
    return "components/pregame/audio/clips-baseball.ts";
  }
  if (slug.startsWith("hm-glf-") || slug === "viz-bomber" || slug === "viz-ballstriker" || slug === "viz-scrambler") {
    return "components/pregame/audio/clips-golf.ts";
  }
  if (slug.startsWith("hm-ftb-") || slug.startsWith("viz-ftb-")) {
    return "components/pregame/audio/clips-football.ts";
  }
  if (slug.startsWith("hm-swm-") || slug.startsWith("viz-swm-")) {
    return "components/pregame/audio/clips-swimming.ts";
  }
  if (slug.startsWith("hm-trf-") || slug.startsWith("viz-trf-")) {
    return "components/pregame/audio/clips-trackfield.ts";
  }
  if (
    slug.startsWith("viz-defense-") || slug.startsWith("viz-forward-") || slug.startsWith("viz-goalie-") ||
    slug.startsWith("viz-guard-") || slug.startsWith("viz-wing-") || slug.startsWith("viz-big-")
  ) {
    return "components/pregame/audio/clips-viz.ts";
  }
  if (slug.startsWith("opener-bb-")) return "components/pregame/audio/opener-bb-" + slug.slice("opener-bb-".length) + ".ts";
  if (slug.startsWith("opener-")) return "components/pregame/audio/opener-" + slug.slice("opener-".length) + ".ts";
  return "components/pregame/audio/clips.ts";
}

// ── Bucket assignment ─────────────────────────────────────────────────────────

type Bucket =
  | "hockey"
  | "basketball"
  | "baseball"
  | "golf"
  | "football"
  | "swimming"
  | "track-field"
  | "pre-practice"
  | "shared";

function bucketForSlug(slug: string): Bucket {
  if (slug.startsWith("pp-")) return "pre-practice";

  if (
    slug.startsWith("hm-bsb-") ||
    slug === "viz-pitcher" || slug === "viz-catcher" ||
    slug === "viz-infield" || slug === "viz-outfield"
  ) return "baseball";

  if (
    slug.startsWith("hm-glf-") ||
    slug === "viz-bomber" || slug === "viz-ballstriker" || slug === "viz-scrambler"
  ) return "golf";

  if (slug.startsWith("hm-ftb-") || slug.startsWith("viz-ftb-")) return "football";
  if (slug.startsWith("hm-swm-") || slug.startsWith("viz-swm-")) return "swimming";
  if (slug.startsWith("hm-trf-") || slug.startsWith("viz-trf-")) return "track-field";

  if (
    slug.startsWith("hm-bb-") ||
    slug.startsWith("bb-guard-") || slug.startsWith("bb-wing-") || slug.startsWith("bb-big-") ||
    slug.startsWith("session-guard-") || slug.startsWith("session-wing-") || slug.startsWith("session-big-") ||
    slug === "viz-guard" || slug === "viz-wing" || slug === "viz-big" ||
    slug.startsWith("viz-guard-") || slug.startsWith("viz-wing-") || slug.startsWith("viz-big-")
  ) return "basketball";

  if (slug.startsWith("opener-bb-")) return "basketball";

  if (
    slug.startsWith("hm-forward-") || slug.startsWith("hm-defense-") || slug.startsWith("hm-goalie-") ||
    slug.startsWith("session-forward-") || slug.startsWith("session-defense-") || slug.startsWith("session-goalie-") ||
    slug === "viz-forward" || slug === "viz-defense" || slug === "viz-goalie" ||
    slug.startsWith("viz-forward-") || slug.startsWith("viz-defense-") || slug.startsWith("viz-goalie-") ||
    slug.startsWith("opener-")
  ) return "hockey";

  return "shared";
}

// ── Human title derivation ────────────────────────────────────────────────────

function humanTitle(slug: string): string {
  const specials: Record<string, string> = {
    "shared-opening": "Shared · Opening",
    "shared-reset-plan": "Shared · Reset Plan",
    "shared-prayer": "Shared · Prayer (Guided)",
    "shared-prayer-selfguided": "Shared · Prayer (Self-guided)",
    "shared-sendoff": "Shared · Send-off",
    "shared-cue-word-intro-pre": "Shared · Cue Word Intro",
    "shared-cue-word-sendoff-pre": "Shared · Cue Word Send-off",
    "shared-viz-intro": "Shared · Viz Intro",
    "shared-anchor-intro": "Shared · Anchor Intro",
    "shared-selftalk-intro": "Shared · Self-Talk Intro",
    "viz-forward": "Hockey · Forward · VIZ (flagship)",
    "viz-defense": "Hockey · Defense · VIZ (flagship)",
    "viz-goalie": "Hockey · Goalie · VIZ (flagship)",
    "viz-guard": "Basketball · Guard · VIZ (flagship)",
    "viz-wing": "Basketball · Wing · VIZ (flagship)",
    "viz-big": "Basketball · Big · VIZ (flagship)",
    "viz-pitcher": "Baseball · Pitcher · VIZ",
    "viz-catcher": "Baseball · Catcher · VIZ",
    "viz-infield": "Baseball · Infield · VIZ",
    "viz-outfield": "Baseball · Outfield · VIZ",
    "viz-bomber": "Golf · Bomber · VIZ",
    "viz-ballstriker": "Golf · Ball-Striker · VIZ",
    "viz-scrambler": "Golf · Scrambler · VIZ",
  };
  if (specials[slug]) return specials[slug];

  const parts = slug.split("-");

  if (slug.startsWith("hm-forward-")) return "Hockey · Forward · " + parts.slice(2).join("-");
  if (slug.startsWith("hm-defense-")) return "Hockey · Defense · " + parts.slice(2).join("-");
  if (slug.startsWith("hm-goalie-")) return "Hockey · Goalie · " + parts.slice(2).join("-");
  if (slug.startsWith("session-forward-")) return "Hockey · Forward · " + parts.slice(2).join("-") + " (full session)";
  if (slug.startsWith("session-defense-")) return "Hockey · Defense · " + parts.slice(2).join("-") + " (full session)";
  if (slug.startsWith("session-goalie-")) return "Hockey · Goalie · " + parts.slice(2).join("-") + " (full session)";
  if (slug.startsWith("hm-bb-guard-")) return "Basketball · Guard · " + parts.slice(3).join("-");
  if (slug.startsWith("hm-bb-wing-")) return "Basketball · Wing · " + parts.slice(3).join("-");
  if (slug.startsWith("hm-bb-big-")) return "Basketball · Big · " + parts.slice(3).join("-");
  // bb-guard-* / bb-wing-* / bb-big-* = full-session basketball cells (baked path)
  if (slug.startsWith("bb-guard-")) return "Basketball · Guard · " + parts.slice(2).join("-") + " (full session)";
  if (slug.startsWith("bb-wing-")) return "Basketball · Wing · " + parts.slice(2).join("-") + " (full session)";
  if (slug.startsWith("bb-big-")) return "Basketball · Big · " + parts.slice(2).join("-") + " (full session)";
  if (slug.startsWith("session-guard-")) return "Basketball · Guard · " + parts.slice(2).join("-") + " (full session)";
  if (slug.startsWith("session-wing-")) return "Basketball · Wing · " + parts.slice(2).join("-") + " (full session)";
  if (slug.startsWith("session-big-")) return "Basketball · Big · " + parts.slice(2).join("-") + " (full session)";
  if (slug.startsWith("viz-defense-")) return "Hockey · Defense · " + parts.slice(2).join("-") + " (viz play)";
  if (slug.startsWith("viz-forward-")) return "Hockey · Forward · " + parts.slice(2).join("-") + " (viz play)";
  if (slug.startsWith("viz-goalie-")) return "Hockey · Goalie · " + parts.slice(2).join("-") + " (viz play)";
  if (slug.startsWith("viz-guard-")) return "Basketball · Guard · " + parts.slice(2).join("-") + " (viz play)";
  if (slug.startsWith("viz-wing-")) return "Basketball · Wing · " + parts.slice(2).join("-") + " (viz play)";
  if (slug.startsWith("viz-big-")) return "Basketball · Big · " + parts.slice(2).join("-") + " (viz play)";
  if (slug.startsWith("hm-bsb-pitcher-")) return "Baseball · Pitcher · " + parts.slice(3).join("-");
  if (slug.startsWith("hm-bsb-catcher-")) return "Baseball · Catcher · " + parts.slice(3).join("-");
  if (slug.startsWith("hm-bsb-infield-")) return "Baseball · Infield · " + parts.slice(3).join("-");
  if (slug.startsWith("hm-bsb-outfield-")) return "Baseball · Outfield · " + parts.slice(3).join("-");
  if (slug.startsWith("hm-glf-bomber-")) return "Golf · Bomber · " + parts.slice(3).join("-");
  if (slug.startsWith("hm-glf-ballstriker-")) return "Golf · Ball-Striker · " + parts.slice(3).join("-");
  if (slug.startsWith("hm-glf-scrambler-")) return "Golf · Scrambler · " + parts.slice(3).join("-");
  if (slug.startsWith("hm-ftb-")) {
    const rest = parts.slice(2);
    return "Football · " + (rest[0] ?? "").toUpperCase() + " · " + rest.slice(1).join("-");
  }
  if (slug.startsWith("viz-ftb-")) {
    const role = parts.slice(2).join("-").toUpperCase();
    return "Football · " + role + " · VIZ";
  }
  if (slug.startsWith("hm-swm-")) {
    const rest = parts.slice(2);
    const r0 = rest[0] ?? "";
    const specialty = r0.charAt(0).toUpperCase() + r0.slice(1);
    return "Swimming · " + specialty + " · " + rest.slice(1).join("-");
  }
  if (slug.startsWith("viz-swm-")) {
    const specialty = parts.slice(2).join("-");
    return "Swimming · " + specialty.charAt(0).toUpperCase() + specialty.slice(1) + " · VIZ";
  }
  if (slug.startsWith("hm-trf-")) {
    const rest = parts.slice(2);
    const r0 = rest[0] ?? "";
    const group = r0.charAt(0).toUpperCase() + r0.slice(1);
    return "Track & Field · " + group + " · " + rest.slice(1).join("-");
  }
  if (slug.startsWith("viz-trf-")) {
    const group = parts.slice(2).join("-");
    return "Track & Field · " + group.charAt(0).toUpperCase() + group.slice(1) + " · VIZ";
  }
  if (slug.startsWith("opener-bb-")) return "Basketball Opener · " + parts.slice(2).join("-");
  if (slug.startsWith("opener-")) return "Hockey Opener · " + parts.slice(1).join("-");
  if (slug.startsWith("anc-")) return "Anchor · " + parts.slice(1).join("-");
  if (slug.startsWith("st-bb-")) return "Self-Talk Basketball · " + parts.slice(2).join("-");
  if (slug.startsWith("st-bsb-")) return "Self-Talk Baseball · " + parts.slice(2).join("-");
  if (slug.startsWith("st-")) return "Self-Talk · " + parts.slice(1).join("-");
  if (slug.startsWith("cw-")) {
    const cueWord = parts[1];
    const phase = parts.slice(2).join("-");
    return "Cue Word · " + cueWord + " · " + phase;
  }
  if (slug.startsWith("pp-bb-")) return "Pre-Practice Basketball · " + parts.slice(2).join("-");
  if (slug.startsWith("pp-baseball-")) return "Pre-Practice Baseball · " + parts.slice(2).join("-");
  if (slug.startsWith("pp-golf-")) return "Pre-Practice Golf · " + parts.slice(2).join("-");
  if (slug.startsWith("pp-")) return "Pre-Practice Hockey · " + parts.slice(1).join("-");
  if (slug.startsWith("shared-")) return "Shared · " + parts.slice(1).join("-");

  return slug;
}

// ── Markdown rendering for a single clip ─────────────────────────────────────

function renderClip(script: AudioScript): string {
  const title = humanTitle(script.slug);
  const sourceFile = sourceFileForSlug(script.slug);
  const lines: string[] = [];

  lines.push(`### ${title}`);
  lines.push(`<!-- slug: ${script.slug} | file: ${sourceFile} -->`);
  lines.push("");

  let speechIndex = 0;

  for (const seg of script.segments) {
    if (seg.type === "silence") {
      lines.push("_(pause)_");
    } else {
      speechIndex++;
      lines.push(`${speechIndex}. ${seg.text}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

// ── Text-mode fallback section ────────────────────────────────────────────────

function renderFallbackSection(entry: FallbackEntry): string {
  const lines: string[] = [];
  lines.push(`## Text-mode fallback (${entry.sportLabel})`);
  lines.push("");
  lines.push("These lines appear on-screen in text mode (no audio). Tokens like `{{role}}`, `{{adversity}}`, etc. are substituted at runtime — edit them as-is.");
  lines.push("");

  for (let i = 0; i < entry.bodies.length; i++) {
    const eyebrow = entry.eyebrows[i] ?? "";
    const body = entry.bodies[i] ?? "";
    lines.push(`<!-- audioScript#${i} | eyebrow: ${eyebrow} -->`);
    lines.push(`${i + 1}. ${body}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ── File header ───────────────────────────────────────────────────────────────

function fileHeader(bucketLabel: string, dormant: boolean): string {
  const dormantNote = dormant
    ? "\n> **DORMANT** — no audio rendered yet for this sport. Edit freely; the first audio render is the go-live pass."
    : "";
  return `# From Victory · Script Book · ${bucketLabel}
${dormantNote}

## HOW TO EDIT

1. Edit **only** the numbered prose lines (e.g. \`1. Your sentence here.\`).
2. Do NOT change \`### titles\`, \`<!-- slug ... -->\` comments, \`_(pause)_\` markers, or line numbers.
3. One numbered line = one complete sentence (no line breaks within a numbered item).
4. For text-mode fallback lines, same rules apply to the numbered body lines.
5. When done editing, run from \`apps/web/\`:
   \`\`\`
   npm run scripts:apply            # dry-run — shows what will change
   npm run scripts:apply -- --write # write the changes into the TS source
   \`\`\`
6. For LIVE sports (hockey, basketball, golf) also run:
   \`\`\`
   npm run audio:generate -- --mode clips
   \`\`\`
   Then bump \`MANIFEST_VERSION\` per the FV-142 rule (the generator prints the new value).
7. DORMANT sports (football, swimming, track-field): just apply and wait for the audio render pass.

---

`;
}

function sectionHeader(label: string): string {
  return `## ${label}\n\n`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(DOCS_SCRIPTS_DIR, { recursive: true });

  // Parse text-mode fallback data from sport-registry.ts without importing it
  const fallbacks = await parseFallbacksFromRegistry();
  const fallbackByLabel = new Map<string, FallbackEntry>();
  for (const fb of fallbacks) {
    fallbackByLabel.set(fb.sportLabel, fb);
  }

  // Group all CLIP_SCRIPTS by bucket
  const buckets = new Map<Bucket, AudioScript[]>();
  const allBuckets: Bucket[] = [
    "hockey", "basketball", "baseball", "golf", "football",
    "swimming", "track-field", "pre-practice", "shared",
  ];
  for (const b of allBuckets) buckets.set(b, []);

  const fallthrough: string[] = [];

  for (const script of CLIP_SCRIPTS) {
    const bucket = bucketForSlug(script.slug);
    buckets.get(bucket)!.push(script);
    if (
      bucket === "shared" &&
      !script.slug.startsWith("shared-") &&
      !script.slug.startsWith("anc-") &&
      !script.slug.startsWith("st-") &&
      !script.slug.startsWith("cw-")
    ) {
      fallthrough.push(script.slug);
    }
  }

  const totalClips = CLIP_SCRIPTS.length;
  let totalLines = 0;

  async function writeBook(
    filename: string,
    label: string,
    dormant: boolean,
    sections: Array<{ header: string; scripts: AudioScript[] }>,
    fallbackSportLabel?: string,
  ): Promise<{ clipCount: number; lineCount: number }> {
    const parts: string[] = [fileHeader(label, dormant)];

    if (fallbackSportLabel) {
      const fb = fallbackByLabel.get(fallbackSportLabel);
      if (fb) {
        parts.push(renderFallbackSection(fb));
        parts.push("---\n\n");
      }
    }

    parts.push("## Audio Clips\n\n");

    let clipCount = 0;
    let lineCount = 0;

    for (const { header, scripts } of sections) {
      if (scripts.length === 0) continue;
      parts.push(sectionHeader(header));
      for (const s of scripts) {
        parts.push(renderClip(s));
        clipCount++;
        lineCount += s.segments.filter((seg) => seg.type === "speech").length;
      }
    }

    const content = parts.join("");
    await writeFile(join(DOCS_SCRIPTS_DIR, filename), content, "utf8");
    return { clipCount, lineCount };
  }

  // ── Hockey ──────────────────────────────────────────────────────────────────
  const hockeyScripts = buckets.get("hockey")!;
  const hkStats = await writeBook(
    "hockey.md", "Hockey", false,
    [
      { header: "Openers (need-specific)", scripts: hockeyScripts.filter((s) => s.slug.startsWith("opener-") && !s.slug.startsWith("opener-bb-")) },
      { header: "VIZ Clips — Flagship (position)", scripts: hockeyScripts.filter((s) => ["viz-forward", "viz-defense", "viz-goalie"].includes(s.slug)) },
      { header: "VIZ Clips — Positive Plays", scripts: hockeyScripts.filter((s) => s.slug.startsWith("viz-forward-") || s.slug.startsWith("viz-defense-") || s.slug.startsWith("viz-goalie-")) },
      { header: "Hard Moment Clips — Forward", scripts: hockeyScripts.filter((s) => s.slug.startsWith("hm-forward-")) },
      { header: "Hard Moment Clips — Defense", scripts: hockeyScripts.filter((s) => s.slug.startsWith("hm-defense-")) },
      { header: "Hard Moment Clips — Goalie", scripts: hockeyScripts.filter((s) => s.slug.startsWith("hm-goalie-")) },
      { header: "Full-Session Cells (legacy, not used in compositional path)", scripts: hockeyScripts.filter((s) => s.slug.startsWith("session-forward-") || s.slug.startsWith("session-defense-") || s.slug.startsWith("session-goalie-")) },
    ],
    "Hockey",
  );

  // ── Basketball ──────────────────────────────────────────────────────────────
  const bbScripts = buckets.get("basketball")!;
  const bbStats = await writeBook(
    "basketball.md", "Basketball", false,
    [
      { header: "Openers (need-specific)", scripts: bbScripts.filter((s) => s.slug.startsWith("opener-bb-")) },
      { header: "VIZ Clips — Flagship (position)", scripts: bbScripts.filter((s) => ["viz-guard", "viz-wing", "viz-big"].includes(s.slug)) },
      { header: "VIZ Clips — Positive Plays", scripts: bbScripts.filter((s) => s.slug.startsWith("viz-guard-") || s.slug.startsWith("viz-wing-") || s.slug.startsWith("viz-big-")) },
      { header: "Hard Moment Clips — Guard", scripts: bbScripts.filter((s) => s.slug.startsWith("hm-bb-guard-")) },
      { header: "Hard Moment Clips — Wing", scripts: bbScripts.filter((s) => s.slug.startsWith("hm-bb-wing-")) },
      { header: "Hard Moment Clips — Big", scripts: bbScripts.filter((s) => s.slug.startsWith("hm-bb-big-")) },
      { header: "Full-Session Cells (legacy, not used in compositional path)", scripts: bbScripts.filter((s) => s.slug.startsWith("session-guard-") || s.slug.startsWith("session-wing-") || s.slug.startsWith("session-big-") || s.slug.startsWith("bb-guard-") || s.slug.startsWith("bb-wing-") || s.slug.startsWith("bb-big-")) },
    ],
    "Basketball",
  );

  // ── Baseball ────────────────────────────────────────────────────────────────
  const bsbScripts = buckets.get("baseball")!;
  const bsbStats = await writeBook(
    "baseball.md", "Baseball", false,
    [
      { header: "VIZ Clips (position)", scripts: bsbScripts.filter((s) => ["viz-pitcher", "viz-catcher", "viz-infield", "viz-outfield"].includes(s.slug)) },
      { header: "Hard Moment Clips — Pitcher", scripts: bsbScripts.filter((s) => s.slug.startsWith("hm-bsb-pitcher-")) },
      { header: "Hard Moment Clips — Catcher", scripts: bsbScripts.filter((s) => s.slug.startsWith("hm-bsb-catcher-")) },
      { header: "Hard Moment Clips — Infield", scripts: bsbScripts.filter((s) => s.slug.startsWith("hm-bsb-infield-")) },
      { header: "Hard Moment Clips — Outfield", scripts: bsbScripts.filter((s) => s.slug.startsWith("hm-bsb-outfield-")) },
    ],
    "Baseball",
  );

  // ── Golf ────────────────────────────────────────────────────────────────────
  const glfScripts = buckets.get("golf")!;
  const glfStats = await writeBook(
    "golf.md", "Golf", false,
    [
      { header: "VIZ Clips (profile)", scripts: glfScripts.filter((s) => ["viz-bomber", "viz-ballstriker", "viz-scrambler"].includes(s.slug)) },
      { header: "Hard Moment Clips — Bomber", scripts: glfScripts.filter((s) => s.slug.startsWith("hm-glf-bomber-")) },
      { header: "Hard Moment Clips — Ball-Striker", scripts: glfScripts.filter((s) => s.slug.startsWith("hm-glf-ballstriker-")) },
      { header: "Hard Moment Clips — Scrambler", scripts: glfScripts.filter((s) => s.slug.startsWith("hm-glf-scrambler-")) },
    ],
    "Golf",
  );

  // ── Football ────────────────────────────────────────────────────────────────
  const ftbScripts = buckets.get("football")!;
  const ftbStats = await writeBook(
    "football.md", "Football", true,
    [
      { header: "VIZ Clips (role)", scripts: ftbScripts.filter((s) => s.slug.startsWith("viz-ftb-")) },
      { header: "Hard Moment Clips", scripts: ftbScripts.filter((s) => s.slug.startsWith("hm-ftb-")) },
    ],
    "Football",
  );

  // ── Swimming ────────────────────────────────────────────────────────────────
  const swmScripts = buckets.get("swimming")!;
  const swmStats = await writeBook(
    "swimming.md", "Swimming", true,
    [
      { header: "VIZ Clips (specialty)", scripts: swmScripts.filter((s) => s.slug.startsWith("viz-swm-")) },
      { header: "Hard Moment Clips", scripts: swmScripts.filter((s) => s.slug.startsWith("hm-swm-")) },
    ],
    "Swimming",
  );

  // ── Track & Field ───────────────────────────────────────────────────────────
  const trfScripts = buckets.get("track-field")!;
  const trfStats = await writeBook(
    "track-field.md", "Track & Field", true,
    [
      { header: "VIZ Clips (event group)", scripts: trfScripts.filter((s) => s.slug.startsWith("viz-trf-")) },
      { header: "Hard Moment Clips", scripts: trfScripts.filter((s) => s.slug.startsWith("hm-trf-")) },
    ],
    "Track & Field",
  );

  // ── Pre-Practice ────────────────────────────────────────────────────────────
  const ppScripts = buckets.get("pre-practice")!;
  const ppStats = await writeBook(
    "pre-practice.md", "Pre-Practice", false,
    [
      { header: "Hockey Pre-Practice Clips", scripts: ppScripts.filter((s) => !s.slug.startsWith("pp-bb-") && !s.slug.startsWith("pp-baseball-") && !s.slug.startsWith("pp-golf-")) },
      { header: "Basketball Pre-Practice Clips", scripts: ppScripts.filter((s) => s.slug.startsWith("pp-bb-")) },
      { header: "Baseball Pre-Practice Clips", scripts: ppScripts.filter((s) => s.slug.startsWith("pp-baseball-")) },
      { header: "Golf Pre-Practice Clips", scripts: ppScripts.filter((s) => s.slug.startsWith("pp-golf-")) },
    ],
  );

  // ── Shared ──────────────────────────────────────────────────────────────────
  const sharedScripts = buckets.get("shared")!;
  const sharedStats = await writeBook(
    "shared.md", "Shared (cross-sport)", false,
    [
      { header: "Shared Structural Clips", scripts: sharedScripts },
    ],
  );

  // ── README ──────────────────────────────────────────────────────────────────
  const readmeContent = `# From Victory · Script Books

Human-readable Markdown views of every pregame and pre-practice audio narration script.
Generated by \`npm run scripts:export\`. Updated by editing and running \`npm run scripts:apply\`.

## Files

| File | Sport / Category | Status |
|---|---|---|
| [hockey.md](./hockey.md) | Hockey openers, VIZ plays, hard-moment clips | LIVE |
| [basketball.md](./basketball.md) | Basketball openers, VIZ plays, hard-moment clips | LIVE |
| [baseball.md](./baseball.md) | Baseball VIZ + hard-moment clips | LIVE (audio = FV-95) |
| [golf.md](./golf.md) | Golf VIZ + hard-moment clips | LIVE |
| [football.md](./football.md) | Football VIZ + hard-moment clips | DORMANT (no audio yet) |
| [swimming.md](./swimming.md) | Swimming VIZ + hard-moment clips | DORMANT (no audio yet) |
| [track-field.md](./track-field.md) | Track & Field VIZ + hard-moment clips | DORMANT (no audio yet) |
| [pre-practice.md](./pre-practice.md) | All pre-practice "Lock In" clips | LIVE (hockey/bb/golf) |
| [shared.md](./shared.md) | Shared structural + anchor/self-talk/cue-word clips | LIVE |

## Workflow

\`\`\`
# 1. Read the script books
open docs/scripts/hockey.md   # or any other sport

# 2. Edit numbered prose lines only
#    DO NOT change ### titles, <!-- slug ... --> comments,
#    _(pause)_ markers, or line numbers.

# 3. Preview the diff (dry-run, no files changed)
cd apps/web
npm run scripts:apply

# 4. Write the changes into the TS source
npm run scripts:apply -- --write

# 5. For LIVE sports — regenerate audio
npm run audio:generate -- --mode clips
# (Then bump MANIFEST_VERSION per the FV-142 rule — the generator prints the new value)

# 6. For DORMANT sports (football/swimming/track-field)
#    Just apply; the first render is the go-live audio pass.
\`\`\`

## Out of scope for these script books

- **Daily training sessions** — text lives in Supabase seed SQL
  (\`supabase/migrations/\` seed files). Edit there directly.
- **Postgame "For the Ride Home" modules** — text lives in
  \`apps/web/lib/postgame/modules.ts\` and the draft Markdown files
  (\`docs/*-postgame-drafts.md\`). Edit there directly.

## Stats (at last export)

Total CLIP_SCRIPTS registered: ${totalClips}
`;
  await writeFile(join(DOCS_SCRIPTS_DIR, "README.md"), readmeContent, "utf8");

  // ── Summary ──────────────────────────────────────────────────────────────────
  const allStats = [
    { label: "hockey", ...hkStats },
    { label: "basketball", ...bbStats },
    { label: "baseball", ...bsbStats },
    { label: "golf", ...glfStats },
    { label: "football", ...ftbStats },
    { label: "swimming", ...swmStats },
    { label: "track-field", ...trfStats },
    { label: "pre-practice", ...ppStats },
    { label: "shared", ...sharedStats },
  ];

  console.log("\nScript books written to docs/scripts/:\n");
  for (const s of allStats) {
    console.log(`  ${s.label.padEnd(16)} ${String(s.clipCount).padStart(4)} clips  ${String(s.lineCount).padStart(5)} speech lines`);
    totalLines += s.lineCount;
  }
  console.log(`\n  ${"TOTAL".padEnd(16)} ${String(totalClips).padStart(4)} clips  ${String(totalLines).padStart(5)} speech lines`);

  if (fallthrough.length > 0) {
    console.log("\nWARN: The following slugs fell through to 'shared' unexpectedly:");
    for (const slug of fallthrough) {
      console.log("  " + slug);
    }
  } else {
    console.log("\nAll slugs bucketed cleanly (no unexpected shared fallthrough).");
  }
}

main().catch((err) => {
  console.error("export-scripts failed:", err);
  process.exit(1);
});
