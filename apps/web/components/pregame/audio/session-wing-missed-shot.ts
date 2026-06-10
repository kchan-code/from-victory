// Wing × I miss the shot
//
// Psychological center: confidence / withdrawal. ⚠ CLINICAL GATE (FV-29 §6,
// the FRO-11 cell). Cold catch-and-shoot brick; the real danger is the NEXT
// one — the make-equals-worth contingency ("only as good as my last make")
// that talks the shooter out of shooting and makes them disappear. The global
// story "I'm bricking, I shouldn't shoot" is voiced ONCE, flat, as the false
// story; the reframe BREAKS the make→worth contingency and sends them back
// into the next shot — staying aggressive, not withdrawing. 13-15 register.
// FV-29 §4 + §6. Reset beat and faith clips reused verbatim.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { WING_VIZ } from "./segments-basketball.ts";

export const SESSION_WING_MISSED_SHOT_SCRIPT: AudioScript = {
  slug: "bb-wing-missed-shot",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...WING_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You catch it open in your spot. Clean look. Cold off the bench, you brick it. Front rim, nothing.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Hands go cold. A flush of doubt up the back of your neck. I'm bricking, I shouldn't shoot.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your make doesn't decide your worth, so the miss can't either. Relocate, show your hands, and take the next open one with the same confidence.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The miss is real. It does not vote on whether you take the next one, and it does not name you. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
