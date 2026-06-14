#!/usr/bin/env node
// Apply edited script-book prose back into the TypeScript AudioScript sources.
//
// Run: npm run scripts:apply            (dry-run — prints diff, no changes)
//      npm run scripts:apply -- --write (writes changes into the TS files)
//
// Safety guards:
//   (a) If the edited numbered-line COUNT for a clip != its current speech-segment
//       count, the clip is REFUSED and the run fails with a clear message.
//   (b) Silence segments and audio-engineering metadata (instructions, mark, speed,
//       postFilter, voice) are never touched.
//   (c) A unified-diff-style preview is always printed; --write is required to apply.
//   (d) Apply is idempotent: if export→apply with no edits, diff is empty.
//   (e) Template-literal bodies containing ${...} expressions are refused; they
//       must be edited directly in the TS source.
//
// NOTE ON CLIP PROSE (VIZ / shared / spread clips):
//   Clip-prose edits (text: lines in CLIP_SCRIPTS) are NO LONGER applied to TS
//   source files by this tool. The generator reads clip prose directly from the
//   .md books at render time (render-time override via loadBookProse). This is
//   the authoritative mechanism for ALL clip types — inline, spread, shared, and
//   viz clips. This tool now only syncs audioScript fallback body text (the
//   text-mode RUNTIME strings in sport-registry.ts / types.ts), which remain
//   inline TS strings that must be written back.
//
// The core logic is exported as syncFromBooks({ write }) so generate-pregame-audio.ts
// can call it at startup (auto-sync .md edits before TTS rendering).

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { CLIP_SCRIPTS } from "../components/pregame/audio/clips.ts";
import type { Segment } from "../components/pregame/audio/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WEB_ROOT = join(__dirname, "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const DOCS_SCRIPTS_DIR = join(REPO_ROOT, "docs", "scripts");
const SPORT_REGISTRY_PATH = join(WEB_ROOT, "components/pregame/sport-registry.ts");
const PREGAME_TYPES_PATH = join(WEB_ROOT, "components/pregame/types.ts");

// ── Parse audioScript fallback current bodies from sport-registry.ts as text ─
// We avoid importing sport-registry.ts (it has extensionless value imports).

type FallbackCurrent = {
  sportLabel: string;
  constName: string;
  bodies: string[];  // current body strings (resolved, NOT escaped)
};

async function parseFallbackBodiesFromRegistry(): Promise<FallbackCurrent[]> {
  const registrySrc = await readFile(SPORT_REGISTRY_PATH, "utf8");
  const typesSrc = await readFile(PREGAME_TYPES_PATH, "utf8");

  // AUDIO_SCRIPT lives in types.ts; all others live in sport-registry.ts
  const constMap: Array<{ constName: string; sportLabel: string; fileSrc: string }> = [
    { constName: "AUDIO_SCRIPT", sportLabel: "Hockey", fileSrc: typesSrc },
    { constName: "BASKETBALL_AUDIO_SCRIPT", sportLabel: "Basketball", fileSrc: registrySrc },
    { constName: "GOLF_AUDIO_SCRIPT", sportLabel: "Golf", fileSrc: registrySrc },
    { constName: "FOOTBALL_AUDIO_SCRIPT", sportLabel: "Football", fileSrc: registrySrc },
    { constName: "SWIMMING_AUDIO_SCRIPT", sportLabel: "Swimming", fileSrc: registrySrc },
    { constName: "TRACKFIELD_AUDIO_SCRIPT", sportLabel: "Track & Field", fileSrc: registrySrc },
  ];

  const results: FallbackCurrent[] = [];

  for (const { constName, sportLabel, fileSrc } of constMap) {
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

    // Extract each {…} object
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

    const bodies: string[] = [];
    for (const segText of segmentTexts) {
      let body = "";
      const dqMatch = segText.match(/body:\s*"((?:[^"\\]|\\.)*)"/);
      if (dqMatch?.[1] != null) {
        body = unescapeTs(dqMatch[1]!);
      } else {
        const tlMatch = segText.match(/body:\s*`([\s\S]*?)`/);
        if (tlMatch?.[1] != null) {
          body = tlMatch[1]!.replace(/\\`/g, "`").replace(/\\\\/g, "\\");
        }
      }
      bodies.push(body);
    }

    results.push({ sportLabel, constName, bodies });
  }

  return results;
}

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
  if (slug.startsWith("hm-ftb-") || slug.startsWith("viz-ftb-")) return "components/pregame/audio/clips-football.ts";
  if (slug.startsWith("hm-swm-") || slug.startsWith("viz-swm-")) return "components/pregame/audio/clips-swimming.ts";
  if (slug.startsWith("hm-trf-") || slug.startsWith("viz-trf-")) return "components/pregame/audio/clips-trackfield.ts";
  if (
    slug.startsWith("viz-defense-") || slug.startsWith("viz-forward-") || slug.startsWith("viz-goalie-") ||
    slug.startsWith("viz-guard-") || slug.startsWith("viz-wing-") || slug.startsWith("viz-big-")
  ) return "components/pregame/audio/clips-viz.ts";
  if (slug.startsWith("opener-bb-")) return "components/pregame/audio/opener-bb-" + slug.slice("opener-bb-".length) + ".ts";
  if (slug.startsWith("opener-")) return "components/pregame/audio/opener-" + slug.slice("opener-".length) + ".ts";
  return "components/pregame/audio/clips.ts";
}

// ── Build current-state index from CLIP_SCRIPTS ───────────────────────────────

type CurrentClip = {
  slug: string;
  sourceFile: string;
  speechTexts: string[];
};

function buildCurrentIndex(): Map<string, CurrentClip> {
  const index = new Map<string, CurrentClip>();
  for (const script of CLIP_SCRIPTS) {
    const speechTexts = script.segments
      .filter((seg): seg is Extract<Segment, { type: "speech" }> => seg.type === "speech")
      .map((seg) => seg.text);
    index.set(script.slug, {
      slug: script.slug,
      sourceFile: sourceFileForSlug(script.slug),
      speechTexts,
    });
  }
  return index;
}

// ── Parse a script book .md ───────────────────────────────────────────────────

type ParsedClip = {
  slug: string;
  file: string;
  lines: string[]; // numbered prose lines in order
};

type ParsedFallback = {
  index: number; // audioScript#<index>
  body: string;
};

type ParsedBook = {
  clips: ParsedClip[];
  fallbackLines: ParsedFallback[];
};

export function parseBook(content: string): ParsedBook {
  const clips: ParsedClip[] = [];
  const fallbackLines: ParsedFallback[] = [];

  const lines = content.split("\n");
  let currentClip: ParsedClip | null = null;
  let inFallback = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    if (line.startsWith("## Text-mode fallback")) {
      inFallback = true;
      currentClip = null;
      continue;
    }

    // Any top-level ## heading (other than fallback) ends the fallback zone
    if (line.startsWith("## ") && !line.startsWith("## Text-mode fallback")) {
      inFallback = false;
      continue;
    }

    if (inFallback) {
      const fallbackMeta = line.match(/<!--\s*audioScript#(\d+)\s*\|/);
      if (fallbackMeta?.[1] != null) {
        const idx = parseInt(fallbackMeta[1]!, 10);
        let j = i + 1;
        while (j < lines.length && (lines[j] ?? "").trim() === "") j++;
        if (j < lines.length) {
          const bodyLine = lines[j] ?? "";
          const bodyMatch = bodyLine.match(/^\d+\.\s+(.+)$/);
          if (bodyMatch?.[1] != null) {
            fallbackLines.push({ index: idx, body: bodyMatch[1]! });
            i = j;
          }
        }
      }
      continue;
    }

    if (line.startsWith("### ")) {
      currentClip = null;
      continue;
    }

    const metaMatch = line.match(/<!--\s*slug:\s*([^\s|]+)\s*\|\s*file:\s*([^\s>]+)\s*-->/);
    if (metaMatch?.[1] != null && metaMatch?.[2] != null) {
      currentClip = { slug: metaMatch[1]!, file: metaMatch[2]!, lines: [] };
      clips.push(currentClip);
      continue;
    }

    if (currentClip) {
      const numbered = line.match(/^(\d+)\.\s+(.+)$/);
      if (numbered?.[2] != null) {
        currentClip.lines.push(numbered[2]!);
      }
      // _(pause)_ lines are ignored
    }
  }

  return { clips, fallbackLines };
}

// ── Escape a string for a TS double-quoted string literal ─────────────────────

function escapeForTs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ── Replace a text value within a bounded source region ──────────────────────
// Finds the FIRST occurrence of the old text (in its quoted form) within
// blockContent starting at searchFrom. Returns updated block + new search pos.

function replaceTextInBlock(
  blockContent: string,
  oldText: string,
  newText: string,
  searchFrom: number = 0,
): { result: string; pos: number } | null {
  const oldEscaped = escapeForTs(oldText);
  const newEscaped = escapeForTs(newText);
  const searchFor = `"${oldEscaped}"`;
  const replaceWith = `"${newEscaped}"`;

  const idx = blockContent.indexOf(searchFor, searchFrom);
  if (idx === -1) return null;

  const result = blockContent.slice(0, idx) + replaceWith + blockContent.slice(idx + searchFor.length);
  return { result, pos: idx + replaceWith.length };
}

// ── Replace a body value in sport-registry.ts (double-quoted or template) ─────

function replaceBodyInBlock(
  blockContent: string,
  oldBody: string,
  newBody: string,
  searchFrom: number = 0,
): { result: string; pos: number } | null {
  // Try double-quoted first
  const dqResult = replaceTextInBlock(blockContent, oldBody, newBody, searchFrom);
  if (dqResult) return dqResult;

  // Try template literal
  const escapedOld = oldBody.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
  const searchFor = "`" + escapedOld + "`";
  const idx = blockContent.indexOf(searchFor, searchFrom);
  if (idx !== -1) {
    const escapedNew = newBody.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
    const replaceWith = "`" + escapedNew + "`";
    const result = blockContent.slice(0, idx) + replaceWith + blockContent.slice(idx + searchFor.length);
    return { result, pos: idx + replaceWith.length };
  }

  return null;
}

// ── Diff display ──────────────────────────────────────────────────────────────

function showDiff(slug: string, oldTexts: string[], newTexts: string[]): void {
  console.log(`\n  clip: ${slug}`);
  for (let i = 0; i < oldTexts.length; i++) {
    if (oldTexts[i] !== newTexts[i]) {
      console.log(`    speech[${i + 1}]:`);
      console.log(`      - ${oldTexts[i]}`);
      console.log(`      + ${newTexts[i]}`);
    }
  }
}

function showBodyDiff(sportLabel: string, idx: number, oldBody: string, newBody: string): void {
  console.log(`\n  fallback: ${sportLabel} audioScript#${idx}`);
  console.log(`    - ${oldBody}`);
  console.log(`    + ${newBody}`);
}

// ── loadBookProse: parse all docs/scripts/*.md into a prose override map ──────
//
// Returns a Map<slug, string[]> where the value is the ordered list of speech
// segment texts for that clip, as parsed from the .md books. Used by the
// generator to override clip prose at render time — works uniformly for all
// clip types (inline, spread, shared, viz) because it operates on the assembled
// AudioScript's segments array, not the TS source file text.
//
// This is the authoritative runtime text source for all clip rendering.

const BOOK_FILES = [
  "hockey.md", "basketball.md", "baseball.md", "golf.md",
  "football.md", "swimming.md", "track-field.md",
  "pre-practice.md", "shared.md",
];

export async function loadBookProse(): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  for (const bookFile of BOOK_FILES) {
    const bookPath = join(DOCS_SCRIPTS_DIR, bookFile);
    if (!existsSync(bookPath)) continue;
    const content = await readFile(bookPath, "utf8");
    const { clips } = parseBook(content);
    for (const parsed of clips) {
      result.set(parsed.slug, parsed.lines);
    }
  }
  return result;
}

// ── syncFromBooks: core md→TS sync logic (exported for generate-pregame-audio) ─
//
// Reads every docs/scripts/*.md book and syncs ONLY the audioScript fallback
// body text (the inline body: strings in sport-registry.ts / types.ts that the
// RUNTIME text-mode path reads). Clip-prose (text: lines in CLIP_SCRIPTS) is
// NO LONGER synced to TS here — the generator reads clip prose directly from
// the .md books at render time via loadBookProse(). That mechanism handles all
// clip types uniformly (inline, spread, shared, viz).
//
// Returns a summary object so the caller can log or act on the result.
// Throws (process.exit(1)) on fallback refusals (count mismatch / ${...}).
// Clip-prose count mismatches are still detected here as a GUARD (to surface
// structure drift early) but are reported as warnings, not fatal errors, since
// the generator's render-time guard will catch them at render time.

export type SyncSummary = {
  clipsChanged: number;     // unused (clip prose no longer synced to TS)
  linesChanged: number;     // unused (clip prose no longer synced to TS)
  fallbackChanged: number;
  refused: number;
  refusedDetails: Array<{ slug: string; reason: string }>;
  filesWritten: number;
  // Clip-prose count mismatches detected (informational, not fatal here;
  // the generator's render-time guard will catch them per-slug at render time).
  clipCountMismatches: number;
};

export async function syncFromBooks({ write }: { write: boolean }): Promise<SyncSummary> {
  // Clip-prose is no longer synced to TS. Only fallback bodies are written.
  const currentIndex = buildCurrentIndex();
  const fallbackCurrents = await parseFallbackBodiesFromRegistry();
  const fallbackByLabel = new Map<string, FallbackCurrent>();
  for (const fb of fallbackCurrents) {
    fallbackByLabel.set(fb.sportLabel, fb);
  }

  // Sport label → book file (for fallback routing)
  const sportToBook: Record<string, string> = {
    Hockey: "hockey.md",
    Basketball: "basketball.md",
    Baseball: "baseball.md",
    Golf: "golf.md",
    Football: "football.md",
    Swimming: "swimming.md",
    "Track & Field": "track-field.md",
  };

  let totalFallbackChanged = 0;
  let totalRefused = 0;
  let totalClipCountMismatches = 0;

  type PendingBodyEdit = {
    sportLabel: string;
    constName: string;
    idx: number;
    oldBody: string;
    newBody: string;
  };

  const pendingBodyEdits: PendingBodyEdit[] = [];
  const refusedClips: Array<{ slug: string; reason: string }> = [];

  for (const bookFile of BOOK_FILES) {
    const bookPath = join(DOCS_SCRIPTS_DIR, bookFile);
    if (!existsSync(bookPath)) {
      console.warn(`WARN: ${bookFile} not found — run npm run scripts:export first.`);
      continue;
    }

    const content = await readFile(bookPath, "utf8");
    const { clips, fallbackLines } = parseBook(content);

    // Determine which sport fallback (if any) lives in this book
    for (const [sportLabel, cfg] of fallbackByLabel) {
      if (sportToBook[sportLabel] !== bookFile) continue;

      for (const fb of fallbackLines) {
        const oldBody = cfg.bodies[fb.index];
        if (oldBody === undefined) {
          refusedClips.push({
            slug: `${sportLabel} audioScript#${fb.index}`,
            reason: `index ${fb.index} out of range (current length ${cfg.bodies.length})`,
          });
          totalRefused++;
          continue;
        }
        if (fb.body === oldBody) continue; // no change

        // Refuse template-literal bodies with expressions (can't safely rewrite)
        if (oldBody.includes("${")) {
          refusedClips.push({
            slug: `${sportLabel} audioScript#${fb.index}`,
            reason: "body contains a template literal expression (\\${...}) — cannot safely rewrite. Edit sport-registry.ts directly.",
          });
          totalRefused++;
          continue;
        }

        showBodyDiff(sportLabel, fb.index, oldBody, fb.body);
        pendingBodyEdits.push({ sportLabel, constName: cfg.constName, idx: fb.index, oldBody, newBody: fb.body });
        totalFallbackChanged++;
      }
    }

    // Clip-prose: detect count mismatches (structural drift) as informational warnings.
    // Text differences are intentionally not applied here — the generator reads
    // clip prose directly from the .md books at render time via loadBookProse().
    for (const parsed of clips) {
      const current = currentIndex.get(parsed.slug);
      if (!current) continue; // unknown slug — generator will handle/warn

      if (parsed.lines.length !== current.speechTexts.length) {
        console.warn(
          `WARN: clip "${parsed.slug}" — .md has ${parsed.lines.length} numbered lines, ` +
          `TS source has ${current.speechTexts.length} speech segments. ` +
          `The generator will fail fast on this mismatch at render time.`,
        );
        totalClipCountMismatches++;
      }
      // Text diffs are fine — the generator will use the .md prose at render time.
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────────────────");
  console.log(`Fallback lines changed: ${totalFallbackChanged}`);
  console.log(`Fallback lines refused: ${totalRefused}`);
  if (totalClipCountMismatches > 0) {
    console.log(`Clip count mismatches:  ${totalClipCountMismatches} (generator will guard these at render time)`);
  }

  if (refusedClips.length > 0) {
    console.log("\nREFUSED fallback lines (will NOT be applied):");
    for (const r of refusedClips) {
      console.log(`  ${r.slug}: ${r.reason}`);
    }
    // Fail fast on fallback refusals so the caller (generate) stops before TTS.
    console.error(
      `\nFATAL: ${totalRefused} fallback line(s) refused. Fix the issues above before rendering.`,
    );
    process.exit(1);
  }

  if (!write) {
    console.log("\nDRY-RUN — no files changed. Run with --write to apply.");
    return {
      clipsChanged: 0,
      linesChanged: 0,
      fallbackChanged: totalFallbackChanged,
      refused: totalRefused,
      refusedDetails: refusedClips,
      filesWritten: 0,
      clipCountMismatches: totalClipCountMismatches,
    };
  }

  if (pendingBodyEdits.length === 0) {
    console.log("\nNothing to write — fallback bodies already match .md books.");
    return {
      clipsChanged: 0,
      linesChanged: 0,
      fallbackChanged: 0,
      refused: 0,
      refusedDetails: [],
      filesWritten: 0,
      clipCountMismatches: totalClipCountMismatches,
    };
  }

  let filesWritten = 0;

  // ── Apply fallback body edits (types.ts for AUDIO_SCRIPT, sport-registry.ts for others) ──
  if (pendingBodyEdits.length > 0) {
    // Separate edits by target file
    const audioScriptEdits = pendingBodyEdits.filter((e) => e.constName === "AUDIO_SCRIPT");
    const registryEdits = pendingBodyEdits.filter((e) => e.constName !== "AUDIO_SCRIPT");

    // Apply AUDIO_SCRIPT edits to types.ts
    if (audioScriptEdits.length > 0) {
      if (!existsSync(PREGAME_TYPES_PATH)) {
        console.error(`ERROR: types.ts not found at ${PREGAME_TYPES_PATH}`);
      } else {
        let typesContent = await readFile(PREGAME_TYPES_PATH, "utf8");
        for (const edit of audioScriptEdits) {
          const constAnchor = "export const AUDIO_SCRIPT: AudioSegment[] = [";
          const constPos = typesContent.indexOf(constAnchor);
          if (constPos === -1) {
            console.error(`ERROR: AUDIO_SCRIPT anchor not found in types.ts`);
            continue;
          }
          let dep = 0; let p = constPos + constAnchor.length - 1;
          while (p < typesContent.length) {
            if (typesContent[p] === "[") dep++;
            else if (typesContent[p] === "]") { dep--; if (dep === 0) { p++; break; } }
            p++;
          }
          const blockContent = typesContent.slice(constPos, p);
          const result = replaceBodyInBlock(blockContent, edit.oldBody, edit.newBody, 0);
          if (!result) {
            console.error(`ERROR: could not find body text for Hockey (AUDIO_SCRIPT) #${edit.idx}`);
            continue;
          }
          typesContent = typesContent.slice(0, constPos) + result.result + typesContent.slice(p);
          console.log(`  APPLIED: Hockey audioScript#${edit.idx} body`);
        }
        await writeFile(PREGAME_TYPES_PATH, typesContent, "utf8");
        filesWritten++;
        console.log(`  WROTE: ${PREGAME_TYPES_PATH}`);
      }
    }

    if (registryEdits.length > 0) {
      if (!existsSync(SPORT_REGISTRY_PATH)) {
        console.error(`ERROR: sport-registry.ts not found at ${SPORT_REGISTRY_PATH}`);
      } else {
        let regContent = await readFile(SPORT_REGISTRY_PATH, "utf8");

        for (const edit of registryEdits) {
          const constAnchor = edit.constName === "AUDIO_SCRIPT"
            ? "export const AUDIO_SCRIPT: AudioSegment[] = ["
            : `const ${edit.constName}: AudioSegment[] = [`;

          const constPos = regContent.indexOf(constAnchor);
          if (constPos === -1) {
            console.error(`ERROR: const anchor "${constAnchor}" not found in sport-registry.ts for ${edit.sportLabel} #${edit.idx}`);
            continue;
          }

          // Find the end of this const's array block
          let depth = 0;
          let pos = constPos + constAnchor.length - 1; // position of the "["
          while (pos < regContent.length) {
            if (regContent[pos] === "[") depth++;
            else if (regContent[pos] === "]") {
              depth--;
              if (depth === 0) { pos++; break; }
            }
            pos++;
          }
          const searchEnd = pos;

          const blockContent = regContent.slice(constPos, searchEnd);
          const result = replaceBodyInBlock(blockContent, edit.oldBody, edit.newBody, 0);

          if (!result) {
            console.error(`ERROR: could not find body text for ${edit.sportLabel} audioScript#${edit.idx}`);
            console.error(`  Body: "${edit.oldBody}"`);
            continue;
          }

          regContent = regContent.slice(0, constPos) + result.result + regContent.slice(searchEnd);
          console.log(`  APPLIED: ${edit.sportLabel} audioScript#${edit.idx} body`);
        }

        await writeFile(SPORT_REGISTRY_PATH, regContent, "utf8");
        filesWritten++;
        console.log(`  WROTE: ${SPORT_REGISTRY_PATH}`);
      }
    }
  }

  console.log(`\n${filesWritten} file(s) written.`);

  return {
    clipsChanged: 0,
    linesChanged: 0,
    fallbackChanged: totalFallbackChanged,
    refused: totalRefused,
    refusedDetails: refusedClips,
    filesWritten,
    clipCountMismatches: totalClipCountMismatches,
  };
}

// ── Standalone CLI entrypoint ─────────────────────────────────────────────────
// Invoked by `npm run scripts:apply` (maintenance / optional preview).
// KC's primary workflow is to run `npm run audio:generate`, which calls
// syncFromBooks automatically at startup.
//
// Guard: only run main() when this file is the direct entry point, not when
// it is imported as a module by generate-pregame-audio.ts. Node sets
// process.argv[1] to the entry-point file path; compare against __filename.

async function main() {
  const write = process.argv.includes("--write");
  const summary = await syncFromBooks({ write });

  if (!write && summary.fallbackChanged === 0) {
    console.log("\nFallback bodies already match .md books — nothing to apply.");
    console.log("(Clip prose is read directly from .md at generator render time — no apply step needed.)");
  }
}

// Only run the CLI when this file is the direct entry point.
// When imported by generate-pregame-audio.ts, process.argv[1] will point
// to the generator, not this file — so main() is skipped.
const isEntryPoint = process.argv[1] != null &&
  (process.argv[1].endsWith("apply-scripts.ts") || process.argv[1].endsWith("apply-scripts.js"));
if (isEntryPoint) {
  main().catch((err) => {
    console.error("apply-scripts failed:", err);
    process.exit(1);
  });
}
