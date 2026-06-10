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
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what God said through Isaiah 41 to a people in exile, facing real enemies, real loss. So do not fear, for I am with you. Do not be dismayed, for I am your God. I will strengthen you and help you. I will uphold you with my righteous right hand.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Do not fear does not mean stop feeling nervous. The contact is still coming. The lane is still crowded. It means you are not alone in the moment. The God who upheld Israel in exile upholds you taking the charge, driving into the trees, going up strong with a body on you.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Courage is not the absence of fear. It is moving forward because the One with you is bigger than what is in front of you.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
