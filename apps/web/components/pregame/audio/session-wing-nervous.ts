// Wing × I feel nervous
//
// Psychological center: confidence / withdrawal. ⚠ CLINICAL GATE — arousal
// reframe, same lineage as the approved Guard-nervous cell. Pregame nerves,
// doubting the stroke against a ranked opponent with scouts in the gym. This
// is the body's STATE before the first possession, not a mid-game error, so the
// reframe is "this is energy, not a verdict" — and for the Wing it routes that
// energy back into staying aggressive rather than shrinking. FV-29 §4 (Wing
// grid, nervous). Reset beat and faith clips reused verbatim.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { WING_VIZ } from "./segments-basketball.ts";

export const SESSION_WING_NERVOUS_SCRIPT: AudioScript = {
  slug: "bb-wing-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...WING_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're in warmups against a ranked team. Scouts are in the gym. Your stroke feels tight and you start doubting the shot before tip-off.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shallow breath. Hands light. I'm not ready for this.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "This is energy, not a warning. Let it sharpen you — get to your spots, hunt your first catch, and let the first shot go free.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Your body is awake. It is not your identity. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
