#!/usr/bin/env node
// Snapshot the fully-resolved render plan for every clip (all CLIP_SCRIPTS +
// SCRIPTS / openers / session cells).
//
// For each clip emits the FINAL assembled render plan as canonical JSON:
//   - speech: { type:"speech", text, instructions, speed, markPhase?, markRound? }
//   - silence: { type:"silence", durationSec }
//
// "Fully resolved" means:
//   - book prose already overridden (text from .md book if present)
//   - instructions resolved: seg.instructions ?? script.instructions
//   - speed resolved: seg.speed ?? script.speed (undefined if neither set)
//   - mark phase/round lifted out of nested object for stable key order
//
// Sort by slug; stable key order per segment.
//
// Usage (from apps/web/):
//   node --experimental-strip-types scripts/snapshot-render-plan.ts > baseline.json
//   # After changes:
//   node --experimental-strip-types scripts/snapshot-render-plan.ts > after.json
//   diff baseline.json after.json  # must be empty for unchanged cells

import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { AudioScript, Segment } from "../components/pregame/audio/types";
import { CLIP_SCRIPTS } from "../components/pregame/audio/clips.ts";
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
import { loadBookProseWithPauses } from "./apply-scripts.ts";
import { applyBookProseOverrides } from "./generate-pregame-audio.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// All scripts — SCRIPTS-array items + CLIP_SCRIPTS
const SCRIPTS: AudioScript[] = [
  BREATH_THRESHOLD_SCRIPT,
  OPENER_CONFIDENCE_SCRIPT,
  OPENER_CALM_SCRIPT,
  OPENER_COMPETE_LEVEL_SCRIPT,
  OPENER_RESET_SCRIPT,
  OPENER_COURAGE_SCRIPT,
  OPENER_DECISIONS_SCRIPT,
  OPENER_LEADERSHIP_SCRIPT,
  OPENER_JOY_SCRIPT,
  OPENER_HOPE_SCRIPT,
  OPENER_BB_COURAGE_SCRIPT,
  OPENER_BB_DECISIONS_SCRIPT,
  OPENER_BB_CONFIDENCE_SCRIPT,
  OPENER_BB_COMPETE_LEVEL_SCRIPT,
  OPENER_BB_RESET_SCRIPT,
  OPENER_BB_LEADERSHIP_SCRIPT,
  OPENER_BB_JOY_SCRIPT,
  OPENER_BB_HOPE_SCRIPT,
  OPENER_BE_VOCAL_SCRIPT,
  OPENER_BB_BE_VOCAL_SCRIPT,
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
];

export const ALL_SCRIPTS: AudioScript[] = [...SCRIPTS, ...CLIP_SCRIPTS];

type RenderedSpeechSegment = {
  type: "speech";
  text: string;
  instructions: string;
  speed: number | undefined;
  markPhase: string | undefined;
  markRound: number | undefined;
};

type RenderedSilenceSegment = {
  type: "silence";
  durationSec: number;
};

type RenderedSegment = RenderedSpeechSegment | RenderedSilenceSegment;

type RenderedClip = {
  slug: string;
  segments: RenderedSegment[];
};

/**
 * Resolve the fully-assembled render plan for a single script:
 *   - text from book prose if present (matching current applyBookProseOverrides logic)
 *   - duration from book if present (matching current applyBookDurationOverrides logic)
 *   - instructions = seg.instructions ?? script.instructions
 *   - speed = seg.speed ?? script.speed (undefined if neither)
 *   - marks lifted out (markPhase, markRound)
 *
 * For the BASELINE snapshot (pre-change), bookData provides prose only (durations null).
 * For the AFTER snapshot (post-change), bookData provides prose + durations.
 *
 * The baseline uses the TS durationSec values as-is (same as the current generator).
 * The after uses migrated book durations (which must match the TS values exactly).
 */
function resolveRenderPlan(
  script: AudioScript,
  bookData: Map<string, { lines: string[]; pauses: Array<{ durationSec: number | null }> }>,
): RenderedClip {
  const entry = bookData.get(script.slug);
  const bookLines = entry?.lines;
  const bookPauses = entry?.pauses;

  // Validate prose count (mirrors applyBookProseOverrides guard logic)
  const speechCount = script.segments.filter((s) => s.type === "speech").length;
  if (bookLines && bookLines.length !== speechCount) {
    throw new Error(
      `[snapshot] MISMATCH for "${script.slug}": .md book has ${bookLines.length} speech lines, ` +
      `TS has ${speechCount} speech segments.`,
    );
  }

  // Validate pause count (mirrors applyBookDurationOverrides logic)
  const silenceCount = script.segments.filter((s) => s.type === "silence").length;
  if (bookPauses && bookPauses.filter((p) => p.durationSec !== null).length > 0) {
    if (bookPauses.length !== silenceCount) {
      throw new Error(
        `[snapshot] PAUSE MISMATCH for "${script.slug}": .md book has ${bookPauses.length} pause markers, ` +
        `TS has ${silenceCount} silence segments.`,
      );
    }
  }

  let speechIdx = 0;
  let silenceIdx = 0;
  const segments: RenderedSegment[] = [];

  for (const seg of script.segments) {
    if (seg.type === "speech") {
      const text = (bookLines && bookLines[speechIdx] !== undefined)
        ? bookLines[speechIdx]!
        : seg.text;
      const resolvedInstructions = seg.instructions ?? script.instructions;
      const resolvedSpeed = seg.speed ?? script.speed;
      const out: RenderedSpeechSegment = {
        type: "speech",
        text,
        instructions: resolvedInstructions,
        speed: resolvedSpeed,
        markPhase: seg.mark?.phase,
        markRound: seg.mark?.round,
      };
      segments.push(out);
      speechIdx++;
    } else {
      // silence — use book duration if available and non-null, else TS value
      let durationSec = seg.durationSec;
      if (bookPauses && bookPauses[silenceIdx] !== undefined) {
        const bookDur = bookPauses[silenceIdx]!.durationSec;
        if (bookDur !== null) {
          durationSec = bookDur;
        }
      }
      const out: RenderedSilenceSegment = {
        type: "silence",
        durationSec,
      };
      segments.push(out);
      silenceIdx++;
    }
  }

  return { slug: script.slug, segments };
}

// Resolve a fully-assembled Segment[] into the diffable RenderedSegment[] form
// (instructions/speed fall back to script-level; marks lifted out). Used to turn
// the REAL generator output (applyBookProseOverrides) into the same shape the
// independent resolveRenderPlan reference produces.
function renderResolve(script: AudioScript, segments: Segment[]): RenderedSegment[] {
  return segments.map((seg): RenderedSegment =>
    seg.type === "speech"
      ? {
          type: "speech",
          text: seg.text,
          instructions: seg.instructions ?? script.instructions,
          speed: seg.speed ?? script.speed,
          markPhase: seg.mark?.phase,
          markRound: seg.mark?.round,
        }
      : { type: "silence", durationSec: seg.durationSec },
  );
}

async function main(): Promise<void> {
  // Load book prose + pauses (the new combined loader)
  const bookData = await loadBookProseWithPauses();

  // Emit the REAL pipeline plan (via the generator's applyBookProseOverrides) and
  // cross-check it against the independent reference assembly (resolveRenderPlan).
  // Any divergence means the generator and the reference disagree — fail loudly.
  const mismatches: string[] = [];
  const structureClips: string[] = [];
  const clips: RenderedClip[] = ALL_SCRIPTS.map((script) => {
    const generated: RenderedClip = {
      slug: script.slug,
      segments: renderResolve(script, applyBookProseOverrides(script, bookData)),
    };
    // The reference reimplements ONLY the in-sync assembly and throws on a
    // book-defines-structure clip (book line/pause count differs from TS). Once
    // an editor changes a cell's line count that's expected — skip the
    // cross-check for those clips (the rebuild path is unit-tested) and still
    // emit the generator's plan, rather than killing the whole snapshot.
    try {
      const reference = resolveRenderPlan(script, bookData);
      if (JSON.stringify(reference.segments) !== JSON.stringify(generated.segments)) {
        mismatches.push(script.slug);
      }
    } catch {
      structureClips.push(script.slug);
    }
    return generated;
  });

  if (structureClips.length > 0) {
    process.stderr.write(
      `[snapshot] note: ${structureClips.length} clip(s) use book-defined structure ` +
      `(in-sync cross-check skipped; the rebuild path is unit-tested): ${structureClips.join(", ")}\n`,
    );
  }
  if (mismatches.length > 0) {
    process.stderr.write(
      `[snapshot] GENERATOR MISMATCH vs reference for ${mismatches.length} clip(s): ${mismatches.join(", ")}\n`,
    );
    process.exit(1);
  }

  // Sort by slug for stable order
  clips.sort((a, b) => a.slug.localeCompare(b.slug));

  // Build the output object: { slug -> segments[] } for compact, diffable JSON
  const output: Record<string, RenderedSegment[]> = {};
  for (const clip of clips) {
    output[clip.slug] = clip.segments;
  }

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}

// Auto-run only when executed directly; importing (e.g. for the migration-
// faithfulness check or unit tests) must not trigger the snapshot.
if (process.argv[1] && __filename === resolve(process.argv[1])) {
  void main().catch((err) => {
    process.stderr.write(`snapshot-render-plan failed: ${(err as Error).message}\n`);
    process.exit(1);
  });
}
