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
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Sit forward.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hear this from Colossians 3:23–24. Whatever you do, work at it with all your heart, as working for the Lord and not for people. It is the Lord Christ you are serving.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "This is not about earning God’s love. In Christ, you already have it.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "This is about who your effort is for. Every possession you guard. Every sprint back. Every box out. Every loose ball. Every cut.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "The coach is not your final audience. The crowd is not your final audience. You compete before the Lord, who already calls you His.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "So bring your full compete. Sprint the floor. Guard the possession. Hit first on the glass. Cut hard. Give the next play everything you have.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
