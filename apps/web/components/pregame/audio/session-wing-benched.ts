// Wing × I get benched  ⚠ CLINICAL-GATE CELL (make-equals-worth contingency)
//
// Psychological center: confidence / withdrawal. Pulled because the shot isn't
// falling — shares the make-equals-worth contingency with the FV-29 §6 cells
// ("I'm only as good as my last make"), so it's handled with the same care: the
// contingency is voiced ONCE, flat, as the false story and broken in the
// reframe. The Wing collapse reflex on the bench is to check out; the reframe
// re-engages — stay ready, stay loud, be first off the bench. FV-29 §4 (Wing
// grid, benched). Reset beat and faith clips reused verbatim.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { WING_VIZ } from "./segments-basketball.ts";

export const SESSION_WING_BENCHED_SCRIPT: AudioScript = {
  slug: "bb-wing-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    ...OPENING,
    ...WING_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your shot isn't falling, so coach pulls you. You sit down at the end of the bench and watch the game go on without you.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. A hollow drop behind your ribs. Your gaze fixed on the floor in front of the bench. I'm only as good as my last make.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your worth wasn't on the scoreboard, so the bench can't take it. Stay locked in, talk on defense from your seat, and be ready the second your name is called.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Sitting down is real. The bench can hold your spot, but it cannot hold your worth — that was never on the scoreboard. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
