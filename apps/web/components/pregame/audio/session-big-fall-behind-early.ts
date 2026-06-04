// Big × Fall behind early
//
// Psychological center: the relabel-risk version of "team falls behind" for
// the Big (FV-29 §4) — the anchor-of-the-defense weight (protect the rim,
// control the glass) lands squarely on the big when the deficit opens.
// Big-distinct thread: "it's on me to hold the paint," which can throttle
// into over-pressing or shrinking. Tactical beat resolves toward owning the
// job play by play — wall up the rim, win the glass — not carrying the
// scoreboard. FV-29 §4 (Big grid). Reuses OPENING/BIG_VIZ/CLOSING.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { BIG_VIZ } from "./segments-basketball.ts";

export const SESSION_BIG_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "bb-big-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    ...OPENING,
    ...BIG_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Down ten early. They're scoring in the paint and crashing the offensive glass, and you're the one back there. It feels like the rim is yours to hold and it's slipping.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. The weight of the paint settles on your shoulders. Breath shortening as the lead grows. It's all on me to hold the paint.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You don't carry the scoreboard. You own the next possession. Wall up the rim, contest vertical, secure one rebound. Then the next one.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The deficit is real. The paint is your job, not your worth, and it is not who you are. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
