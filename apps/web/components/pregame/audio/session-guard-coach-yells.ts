// Guard × my coach gets on me
//
// The lead guard's trust wound: called out for a bad pick-and-roll read and
// pulled to the sideline. The trigger is an OUTSIDE voice, so the hard-moment
// narration names the spiral flatly without adjudicating whether coach was
// right (per HARD_MOMENT_NARRATION_INSTRUCTIONS). The ★ false story is "Coach
// doesn't trust me to run this." The over-grip collapse reflex (FV-29 §4) is
// to over-control the next reps to "prove it" — and play tight, slow, scared.
// The Guard-specific tactical beat is to take the read coach gave and run it
// clean: the correction is information about the play, not a verdict on you.
//
// One of the basketball pregame matrix (FV-30, 3 positions × 10 adversities),
// authored under content-curator orchestration from the FV-29 taxonomy and
// mirroring the hockey cell pattern. Faith clips (OPENING/CLOSING) reused.
// NOT yet wired into clips.ts — that is the FV-28 registry refactor.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { GUARD_VIZ } from "./segments-basketball.ts";

export const SESSION_GUARD_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "bb-guard-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    ...OPENING,
    ...GUARD_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You make a bad read on the pick-and-roll. Coach yells your name and pulls you to the sideline. You're standing there while the game goes on.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Neck goes hot. Chest tightens against the breath. Coach doesn't trust me to run this.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The correction is about the read, not about you. Take it, run it clean, get the team into the next one.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Coach reads the play. He doesn't write the player. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
