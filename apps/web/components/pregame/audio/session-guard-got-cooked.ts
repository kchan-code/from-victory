// Guard × I got cooked off the dribble
//
// The on-ball defender's exposure moment: beaten clean on a crossover for a
// layup, with the whole gym watching. The false story is "everyone saw it" —
// a shame spiral that lives in being witnessed, not in the basket itself. The
// over-grip collapse reflex (FV-29 §4) is to over-gamble the next possession —
// reach, jump the steal, get cooked again. The Guard-specific tactical beat is
// to sit down and play sound, contained defense: stay in front, take the next
// one away with feet, not hands.
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

export const SESSION_GUARD_GOT_COOKED_SCRIPT: AudioScript = {
  slug: "bb-guard-got-cooked",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...GUARD_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're up on the ball. He hits you with the crossover, gets your hips turned, and blows by for the layup.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Face goes hot. Eyes want to drop to the floor. Everyone saw it. The whole gym saw me get cooked.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Next possession, get in your stance and stay in front. Take it away with your feet, not a reach.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Getting beat is real. It is not your identity. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
