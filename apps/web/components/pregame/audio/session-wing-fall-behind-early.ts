// Wing × We fall behind early
//
// Psychological center: confidence / withdrawal. Down early, the Wing pull is to
// force shots and single-handedly answer the run — a different face of the
// withdrawal locus: trying to do everything alone instead of trusting the team.
// The false story "I have to fix this myself" leads to hero-ball. Tactical beat
// resolves toward staying aggressive WITHIN the offense: take the open one in
// rhythm, don't force it. FV-29 §4 (Wing grid, fall-behind-early). Reset beat
// and faith clips reused verbatim.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { WING_VIZ } from "./segments-basketball.ts";

export const SESSION_WING_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "bb-wing-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...WING_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "They go on a run and you're down early. You can feel the pull to force a shot, to answer it all by yourself, right now.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. A hot urgency surges through your chest. Your hands itch for the ball. I have to fix this myself.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You don't have to hero-ball this. Stay aggressive inside the offense — move the ball, trust your read, and take the open one in rhythm.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The deficit is real. It is not yours to answer alone, and it is not who you are. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
