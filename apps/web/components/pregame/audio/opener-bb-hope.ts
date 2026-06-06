// Pregame opener — Today's focus: "Hope." (Basketball variant)
//
// Basketball-specific application of Isaiah 40:31 — same scripture,
// same identity truth, basketball language: legs going late in the game.
// Clone of opener-hope.ts with basketball-specific seg-3 application.
//
// Verse: Isaiah 40:31 — those who hope in the LORD will renew their
// strength.
// Identity truth: "Hope is not believing in yourself. It is waiting
// on the God who is bigger than what you face."
//
// Youth-pastor APPROVED (FV-120). Audio rendering = FV-120.

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_BB_HOPE_SCRIPT: AudioScript = {
  slug: "opener-bb-hope",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Take one full breath.",
      speed: 1.0,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what Isaiah wrote in chapter 40. He was speaking to a people in exile, out of strength, far from home. Even youths grow tired and weary, and young men stumble and fall. But those who hope in the LORD will renew their strength. They will soar on wings like eagles. They will run and not grow weary. They will walk and not be faint.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Soar on wings like eagles does not mean you will never feel your legs go late in the game. It does not mean prayer is a performance hack. Look at what Isaiah just said — even young men stumble and fall. The source of endurance is not your willpower. It is the God who renews you when you depend on him.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Hope is not believing in yourself. It is waiting on the God who is bigger than what you face.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
