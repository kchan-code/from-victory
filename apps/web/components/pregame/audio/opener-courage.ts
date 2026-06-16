// Pregame opener — Today's focus: "Physical courage."
//
// Replaces segment 1 of the locked pilot session when the athlete
// selects Physical courage on the Today's Focus screen.
//
// Verse: Isaiah 41:10 — do not fear, for I am with you.
// Why: Physical courage in hockey (taking a hit, going to the net,
// blocking a shot) requires presence, not bravado. Isaiah is speaking
// to Israel in exile facing real enemies — not pumping them up,
// promising presence. Aligns with Wiersma "normalize, don't eliminate"
// — nerves are body energy.
// Identity truth: "Courage is not the absence of fear. It is moving
// forward because the One with you is bigger than what is in front
// of you."

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_COURAGE_SCRIPT: AudioScript = {
  slug: "opener-courage",
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
      text: "So when the corner gets heavy, when coach is on you, when the matchup is hard, you do not have to back away.",
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
      text: "Play brave. Step into the battle. Compete with courage. God is with you.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
