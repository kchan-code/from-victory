// Wing × I start slow
//
// Psychological center: confidence / withdrawal. The pure withdrawal cell —
// first touches feel off and the trap is going quiet for the whole half. The
// false story "I'm invisible" becomes self-fulfilling as the Wing stops asking
// for the ball. Tactical beat resolves toward the OPPOSITE of disappearing:
// sprint the lanes, demand the next touch, stay in it. FV-29 §4 (Wing grid,
// start-slow). Reset beat and faith clips reused verbatim.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { WING_VIZ } from "./segments-basketball.ts";

export const SESSION_WING_START_SLOW_SCRIPT: AudioScript = {
  slug: "bb-wing-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...WING_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your first few touches feel off. The ball isn't finding you and the half is slipping by. You can feel yourself going quiet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your body goes quiet and small. Energy draining from your legs. I'm invisible out here.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Don't disappear — get loud. Sprint the lanes, cut hard, call for the ball, and demand your next touch.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The slow start is real. It is not your identity. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
