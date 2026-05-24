// Builds the AudioTimeline JSON from per-segment durations.
//
// Inputs: the original script's segments (with optional `mark`s) + the
// measured duration of each segment after TTS / silence generation.
// Output: { durationSec, phases } where each phase entry has the absolute
// start time of that phase.

import type { AudioScript, AudioTimeline } from "../../components/pregame/audio/types.ts";

export type SegmentDuration = {
  segmentIndex: number;
  durationSec: number;
};

export function buildTimeline(
  script: AudioScript,
  durations: SegmentDuration[],
): AudioTimeline {
  if (durations.length !== script.segments.length) {
    throw new Error(
      `buildTimeline: durations length (${durations.length}) does not match segments length (${script.segments.length})`,
    );
  }

  const phases: AudioTimeline["phases"] = [];
  let cursor = 0;
  for (let i = 0; i < script.segments.length; i++) {
    const seg = script.segments[i];
    const dur = durations[i];
    if (!seg || !dur) continue;
    if (seg.mark) {
      const entry: AudioTimeline["phases"][number] = {
        phase: seg.mark.phase,
        startSec: round3(cursor),
      };
      if (typeof seg.mark.round === "number") entry.round = seg.mark.round;
      phases.push(entry);
    }
    cursor += dur.durationSec;
  }

  return {
    slug: script.slug,
    durationSec: round3(cursor),
    phases,
  };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
