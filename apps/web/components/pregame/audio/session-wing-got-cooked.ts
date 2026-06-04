// Wing × I get cooked on defense
//
// Psychological center: confidence / withdrawal. ⚠ CLINICAL GATE (FV-29 §6).
// Guarding their best scorer, beaten on a closeout, ending up on someone's
// highlight. The global verdict "I'm a liability" is the danger — it spreads
// from one closeout to the whole game and the Wing checks out. That verdict is
// voiced ONCE, flat, as the false story; the reframe REJECTS the global
// "liability" label and sends them back to the very next closeout — staying
// engaged, not hiding. FV-29 §4 + §6. Reset beat and faith clips reused
// verbatim.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { WING_VIZ } from "./segments-basketball.ts";

export const SESSION_WING_GOT_COOKED_SCRIPT: AudioScript = {
  slug: "bb-wing-got-cooked",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    ...OPENING,
    ...WING_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're on their best scorer. You close out, he rips by you, and finishes over the help. The bench reacts. That one's on the highlight.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat floods your face. Your feet feel stuck to the floor. I'm a liability.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "One beat doesn't make you a liability. Get into your stance, take the matchup again, and contest the very next closeout.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Getting beat on one closeout is real. It does not make you a liability, and it is not who you are. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
