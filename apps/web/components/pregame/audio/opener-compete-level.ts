// Pregame opener — Today's focus: "Compete level."
//
// Replaces segment 1 of the locked pilot session when the athlete
// selects Compete level on the Today's Focus screen.
//
// Verse: Colossians 3:23-24 — whatever you do, work at it with all
// your heart, as working for the Lord.
// Why: The cleanest scriptural foundation for compete-level. Reframes
// effort as worship — not for the coach's approval, not for the stat
// line, but unto the Lord. Removes the audience pressure that makes
// athletes hold back. Vocation framework (Keller, "Every Good
// Endeavor").
// Identity truth: "You are not competing for an audience. You are
// competing for an Audience of One who already calls you His."

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_COMPETE_LEVEL_SCRIPT: AudioScript = {
  slug: "opener-compete-level",
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
      text: "Working for the Lord does not mean playing harder to earn his love. You already have it. It means every battle on the wall, every backcheck, every shift is offered up to the One who gave you the body to play. Effort becomes worship. The coach is not your final audience. God is.",
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
