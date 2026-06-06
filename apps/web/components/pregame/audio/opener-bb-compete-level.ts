// Pregame opener — Today's focus: "Compete level." (Basketball variant)
//
// Basketball-specific application of Colossians 3:23-24 — same scripture,
// same identity truth, basketball language: possessions, defense, loose balls.
// Clone of opener-compete-level.ts with basketball-specific seg-3 application.
//
// Verse: Colossians 3:23-24 — whatever you do, work at it with all
// your heart, as working for the Lord.
// Identity truth: "You are not competing for an audience. You are
// competing for an Audience of One who already calls you His."
//
// Youth-pastor APPROVED (FV-120). Audio rendering = FV-120.

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_BB_COMPETE_LEVEL_SCRIPT: AudioScript = {
  slug: "opener-bb-compete-level",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Sit forward.",
      speed: 1.0,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what Paul wrote in Colossians 3. Whatever you do, work at it with all your heart, as working for the Lord, not for human masters, since you know that you will receive an inheritance from the Lord as a reward. It is the Lord Christ you are serving.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Working for the Lord does not mean playing harder to earn his love. You already have it. It means every possession you guard, every sprint back on defense, every loose ball you dive for is offered up to the One who gave you the body to play. Effort becomes worship. The coach is not your final audience. God is.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "You are not competing for an audience. You are competing for an Audience of One who already calls you His.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
