// Big × Missed free throws (hack-a target)
//
// Psychological center: bigs get targeted (hack-a) precisely because they're
// the weakest shooter on the floor. Sent to the line in the bonus, both
// free throws miss, and the lie weaponizes the strategy: "they fouled me on
// purpose because I'm the weak link." Collapse = shrink, stop demanding the
// ball (throttled aggression). Tactical beat resolves toward owning the
// next possession physically. FV-29 §4 (Big grid). Reuses
// OPENING/BIG_VIZ/CLOSING.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { BIG_VIZ } from "./segments-basketball.ts";

export const SESSION_BIG_MISSED_FTS_SCRIPT: AudioScript = {
  slug: "bb-big-missed-fts",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...BIG_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "They grab you off the ball on purpose. Bonus. Two shots. You step to the line and both clang off the rim.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. The hush of the gym presses on you. Your hands go heavy at the line. They fouled me on purpose because I'm the weak link.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You make them pay the other way. Get back, protect the rim, then seal deep and demand the ball. Make being fouled cost them.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The misses are real. They are not your identity. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
