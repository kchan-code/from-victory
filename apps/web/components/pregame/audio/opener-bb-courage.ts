// Pregame opener — Today's focus: "Physical courage." (Basketball variant)
//
// Basketball-specific application of Isaiah 41:10 — same scripture,
// same identity truth, basketball contact language: taking a charge,
// driving into the trees, going up strong with a body on you.
//
// Verse: Isaiah 41:10 — do not fear, for I am with you.
// Identity truth: "Courage is not the absence of fear. It is moving
// forward because the One with you is bigger than what is in front
// of you."
//
// Youth-pastor APPROVED (FV-115). Audio rendering = FV-116.

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_BB_COURAGE_SCRIPT: AudioScript = {
  slug: "opener-bb-courage",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Plant both feet on the floor.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hear this from Isaiah 41:10. God spoke to His people in exile, facing real enemies and real fear: Do not fear, for I am with you. Do not be dismayed, for I am your God. I will strengthen you and help you. I will uphold you with my righteous right hand.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "God knows the pressure is real. He does not downplay it. Instead, He says you are not alone in it. He strengthens. He helps. He upholds.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "So when the contact comes, when the lane is crowded, when the matchup is hard, you do not have to back away.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Courage is not pretending fear is gone. Courage is moving forward because the One with you is greater than what is in front of you.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Play brave. Take the charge. Go up strong. Compete with courage. God is with you.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
