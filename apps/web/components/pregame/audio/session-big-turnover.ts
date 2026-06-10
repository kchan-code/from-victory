// Big × Turnover
//
// Psychological center: the Big's turnover (charge on a roll, offensive
// foul backing down, stripped in the post) triggers throttled aggression —
// "keep it out of my hands," so the big stops sealing and rolling and the
// game shrinks. Tactical beat resolves toward re-demanding the ball and
// playing physical: seal hard, finish strong. FV-29 §4 (Big grid, locus:
// aggression-throttling / spatial exposure). Reuses OPENING/BIG_VIZ/CLOSING.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { BIG_VIZ } from "./segments-basketball.ts";

export const SESSION_BIG_TURNOVER_SCRIPT: AudioScript = {
  slug: "bb-big-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...BIG_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You roll to the rim and the help steps in. You bowl him over. Whistle. Charge. The ball goes the other way.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders curl inward. A heavy thud of frustration in your chest. Keep it out of my hands.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You want the ball again. Seal your man, call for it, roll hard, and finish strong through contact.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The turnover is real. It is not your identity. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
