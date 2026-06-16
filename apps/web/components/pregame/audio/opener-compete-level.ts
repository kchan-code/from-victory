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
      text: "This is about who your effort is for. Every wall battle. Every backcheck. Every loose puck. Every shift.",
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
      text: "So bring your full compete. Win the wall. Finish your routes. Backcheck hard. Give the next shift everything you have.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
