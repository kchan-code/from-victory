// Guard × I miss two free throws
//
// FV-29 slot 8 — basketball's purest isolation-under-evaluation moment (it
// REPLACED hockey's "get-hit"; this is NOT a full-court-pressure cell). Tight
// game, the gym goes quiet, both free throws clank. The guard's false story is
// the closer-identity line: "I'm the guard, I'm supposed to close." Reset keeps
// to routine + breath (Gallwey interference reduction).
//
// One of the basketball pregame matrix (FV-30); authored from the FV-29
// taxonomy, mirroring the hockey cell pattern. Faith clips (OPENING/CLOSING)
// reused. Registered in clips.ts CLIP_SCRIPTS under the per-sport registry (FV-30).

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { GUARD_VIZ } from "./segments-basketball.ts";

export const SESSION_GUARD_MISSED_FTS_SCRIPT: AudioScript = {
  slug: "bb-guard-missed-fts",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...GUARD_VIZ,

    // ── Hard moment (Mentor → Coach) — GUARD × MISS TWO FREE THROWS
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Tight game, late. You're at the line to ice it. The gym goes quiet. First one is short. Second one clanks off the front rim.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach sinks. Ears ringing in the quiet. I'm the guard, I'm supposed to close.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 2.0 },
    // Canonical tactical reset — applies to every cell.
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Get back on defense. Next time at the line, same routine. Breathe, eyes on the rim, shoot it the way you always do.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. Two misses at the line is a moment in the game, not a measure of the closer. Missing the shot did not unmake you. Reset and go again.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
