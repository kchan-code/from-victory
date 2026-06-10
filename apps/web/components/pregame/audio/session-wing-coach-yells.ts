// Wing × Coach gets on me
//
// Psychological center: confidence / withdrawal. Called out for not closing out
// or for passing up an open shot — position-distinct: the Wing hears "you're
// not producing." The false story "I can't do anything right" pushes the Wing
// to play smaller to avoid the next correction. Tactical beat resolves toward
// staying engaged: take the message, then keep cutting and shooting. FV-29 §4
// (Wing grid, coach-yells). Reset beat and faith clips reused verbatim.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { WING_VIZ } from "./segments-basketball.ts";

export const SESSION_WING_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "bb-wing-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...WING_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Coach stops the play and barks your name. You didn't close out. You passed up the open one. The whole gym hears it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Ears go hot. Your eyes drop to your shoes. I can't do anything right.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Coach is coaching what you do, not deciding who you are. Take the note, close out hard, and shoot the next open one without flinching.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The correction is real. It is not your identity. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
