// Guard × we fall behind early
//
// The leadership-weight cell: down early and the whole team turns to the guard
// to stop the bleeding. The false story isn't a single mistake — it's the
// deficit landing on you as a verdict, the over-responsibility of feeling like
// the comeback is yours to author alone. This is the over-grip collapse reflex
// (FV-29 §4) scaled up to the scoreboard. The Guard-specific tactical beat
// shrinks the task back to size: you don't owe the team the whole deficit, you
// owe them the NEXT possession — one stop, one good look, one at a time.
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

export const SESSION_GUARD_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "bb-guard-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    ...OPENING,
    ...GUARD_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "They go on a quick run. You're down early, and you can feel the whole team look to you to stop the bleeding.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders climb toward your ears. A weight settles across your back. This whole deficit is on me to fix.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You don't owe them the whole deficit. You owe them the next possession. One stop. One good look. One at a time.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The deficit is real. It is not yours alone to carry, and it is not who you are. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
