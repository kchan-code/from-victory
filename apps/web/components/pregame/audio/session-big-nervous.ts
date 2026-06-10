// Big × Nervous (vs a bigger, more physical matchup)
//
// Position-distinct relabel-risk cell (FV-29 §4): the Big's pre-game nerve
// is NOT generic — it's "what if I get bullied inside" against a bigger,
// stronger post. Arousal reframe (same lineage as the approved
// Guard-nervous and hockey defense-nervous): the body is awake, not a
// verdict. Tactical beat resolves toward meeting force with force early —
// establish position first, hit first. ⚠ CLINICAL GATE (arousal reframe;
// confirm approach-not-avoidance for a genuinely smaller 13-15 big).
// FV-29 §4 (Big grid). Reuses OPENING/BIG_VIZ/CLOSING.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { BIG_VIZ } from "./segments-basketball.ts";

export const SESSION_BIG_NERVOUS_SCRIPT: AudioScript = {
  slug: "bb-big-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...BIG_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Warmups. You watch their big across the floor. He's taller, he's heavier, and he's already pushing your teammates around.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. A buzz of adrenaline through your arms. Pulse loud in your chest. What if I get bullied inside.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You get to the spot first. Beat him to your position, get your body low, and hold your ground with your feet and base — not by reaching. Be ready for the contact instead of bracing against it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Your body is awake. It is not your identity. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
