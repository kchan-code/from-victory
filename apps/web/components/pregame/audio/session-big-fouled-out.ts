// Big × Fouled out  ⚠ CLINICAL GATE + SPECIAL CASE (removal cell)
//
// The Big's "benched" slot — but the big is removed by the RULES (sixth
// foul), not by the coach's choice. Scenario: the sixth foul, walking off,
// can't return. The brain reads removal as "I'm not trusted / I don't
// belong" (FV-29 §6 removal cells). ★false story = "I let my team down /
// I'm the weak link," named ONCE and rejected. Reframe: fouling out from
// competing hard is not failing; your team still needs your voice and
// presence from the bench. There is no on-court tactical beat — the big is
// out — so the "tactical" slot resolves to a bench-presence move. 13-15
// calibrated. FV-29 §4 + §6. Reuses OPENING/BIG_VIZ/CLOSING.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { BIG_VIZ } from "./segments-basketball.ts";

export const SESSION_BIG_FOULED_OUT_SCRIPT: AudioScript = {
  slug: "bb-big-fouled-out",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...BIG_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The whistle blows. Number six. You're done. You walk off, the game still going, and you can't go back in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. The walk off the floor feels long and slow. A lump rising in your throat. I let my team down.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're still in this game. On your feet on the bench. Loud on defense, talking coverages, lifting the next big up. Your team needs your voice and your presence.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Fouling out is real. It cost you the floor — it did not cost you who you are. Your team still needs you. Reset, and go again with your voice.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
