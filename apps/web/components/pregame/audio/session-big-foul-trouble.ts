// Big × Foul trouble  ⚠ CLINICAL GATE
//
// The Big's DEFINING adversity and heaviest-use cell (FV-29 §6). Two early
// fouls → benched; back in, the big plays tentative, stops contesting and
// boxing out, and the whole game shrinks (throttled aggression at its
// purest). The ★false story is the global "I'm the weak link" verdict —
// named ONCE and rejected. Reframe restores CONTROLLED aggression: stay
// vertical, keep boxing out — physical AND disciplined, not passive. 13-15
// calibrated. FV-29 §4 + §6. Reuses OPENING/BIG_VIZ/CLOSING.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { BIG_VIZ } from "./segments-basketball.ts";

export const SESSION_BIG_FOUL_TROUBLE_SCRIPT: AudioScript = {
  slug: "bb-big-foul-trouble",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...BIG_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Two quick fouls and the coach sits you. You come back in scared to touch anybody. You stop contesting. You stop boxing out.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your arms go stiff and cautious. A cold hesitation before every box out. I'm the weak link.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You can compete hard and stay disciplined at the same time. Stay vertical, hands straight up, beat them to the spot and box out clean. That's how you stay on the floor and help your team.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The fouls are real. They put you in foul trouble, not in question — they do not make you the weak link. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
