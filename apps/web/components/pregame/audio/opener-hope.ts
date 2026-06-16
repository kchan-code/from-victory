// Pregame opener — Today's focus: "Hope."
//
// Replaces segment 1 of the locked pilot session when the athlete
// selects Hope on the Today's Focus screen.
//
// Verse: Isaiah 40:31 — those who hope in the LORD will renew their
// strength.
// Why: The verse most commonly weaponized for athletic pump-up
// ("soar like eagles"). Handled in context (Isaiah 40 = comfort
// section written to Israel in exile, out of strength), it becomes
// a strong statement of source: endurance comes from God, not
// willpower. Aligns with Wiersma — strength is sourced, not summoned.
// Identity truth: "Hope is not believing in yourself. It is waiting
// on the God who is bigger than what you face."

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_HOPE_SCRIPT: AudioScript = {
  slug: "opener-hope",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Take one full breath.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hear this from Isaiah 40. God was speaking to a people in exile — worn down, far from home, and out of strength: Even youths grow tired and weary, and young men stumble and fall. But those who hope in the Lord will renew their strength. They will soar on wings like eagles. They will run and not grow weary. They will walk and not be faint.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Isaiah does not pretend you will never get tired. He says even the young grow weary. Even strong people stumble.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "But your strength is not limited to what you can manufacture in yourself. The Lord renews those who wait on Him, trust Him, and depend on Him.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "So when your legs feel heavy, when the game feels long, when you feel like you are running out — do not quit inside. Hope in the Lord.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Take the next shift. Skate the next stride. Trust the One who renews your strength.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
