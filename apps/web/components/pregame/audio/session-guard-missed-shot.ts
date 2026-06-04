// Guard × I miss a wide-open shot
//
// The shooter's identity wobble: a clean, wide-open pull-up rims out and the
// guard starts running scared math — "now they'll sag off me, now I'm not a
// threat." The over-grip collapse reflex (FV-29 §4) is to either go cold and
// refuse the next open look, or force a worse one to "make up for it." The
// Guard-specific tactical beat is to keep taking the SAME good shot, not a
// different one — the read was right; honor the read.
//
// One of the basketball pregame matrix (FV-30, 3 positions × 10 adversities),
// authored under content-curator orchestration from the FV-29 taxonomy and
// mirroring the hockey cell pattern. Faith clips (OPENING/CLOSING) reused.
// Registered in clips.ts CLIP_SCRIPTS under the per-sport registry (FV-30).

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { GUARD_VIZ } from "./segments-basketball.ts";

export const SESSION_GUARD_MISSED_SHOT_SCRIPT: AudioScript = {
  slug: "bb-guard-missed-shot",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    ...OPENING,
    ...GUARD_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You come off the screen wide open. Feet set, clean look, the shot you've made a thousand times. It rims out.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders drop. A flush climbs up your neck. Now they'll sag off me. I'm not a shooter today.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The read was right. Same shot, next time it's open. Don't shrink it, don't force a worse one.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. One miss is real. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
