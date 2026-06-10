// Guard × I'm in foul trouble
//
// The defender's handcuffed identity: two quick reach-in fouls and now the
// guard's whole defensive game is throttled — can't pick up full-court, can't
// pressure, has to guard soft and hope. The false story is "I can't even play
// D without fouling." The over-grip collapse reflex (FV-29 §4) is to either
// keep reaching (and foul out) or disappear defensively out of fear. The
// Guard-specific tactical beat carries the position-true fix: play angles and
// verticality, beat the offense to the spot, contest straight up — defend with
// position, not with hands. This is the basketball analog of the hockey D-man
// "don't back up" addition.
//
// One of the basketball pregame matrix (FV-30, 3 positions × 10 adversities),
// authored under content-curator orchestration from the FV-29 taxonomy and
// mirroring the hockey cell pattern. Faith clips (OPENING/CLOSING) reused.
// Registered in clips.ts CLIP_SCRIPTS under the per-sport registry (FV-30).

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { GUARD_VIZ } from "./segments-basketball.ts";

export const SESSION_GUARD_FOUL_TROUBLE_SCRIPT: AudioScript = {
  slug: "bb-guard-foul-trouble",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...GUARD_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Two quick reach-ins and the whistle's on you. Now you're guarding soft, can't pick up full-court, playing scared of the third.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Hands pull back on their own. A jolt of caution down your arms. I can't even play D without fouling.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Play angles, not reaches. Beat them to the spot, contest straight up, hands high. Defend with your feet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The fouls are real. They are not your identity. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
