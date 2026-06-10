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
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what Isaiah wrote in chapter 40. He was speaking to a people in exile, out of strength, far from home. Even youths grow tired and weary, and young men stumble and fall. But those who hope in the LORD will renew their strength. They will soar on wings like eagles. They will run and not grow weary. They will walk and not be faint.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Soar on wings like eagles does not mean you will never feel tired in your shift. It does not mean prayer is a performance hack. Look at what Isaiah just said — even young men stumble and fall. The source of endurance is not your willpower. It is the God who renews you when you depend on him.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Hope is not believing in yourself. It is waiting on the God who is bigger than what you face.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
