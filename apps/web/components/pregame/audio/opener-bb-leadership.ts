// Pregame opener — Today's focus: "Leadership." (Basketball variant)
//
// Basketball-specific application of Mark 10:45 — same scripture,
// same identity truth, basketball language: captain's role, starting
// spot, last one off the bench, practice player.
// Clone of opener-leadership.ts with basketball-specific seg-3 application.
//
// Verse: Mark 10:45 — the Son of Man came to serve.
// Identity truth: "Real leadership is not standing above your team.
// It is standing under them — the way Christ stood under you."
//
// Youth-pastor APPROVED (FV-120). Audio rendering = FV-120.

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_BB_LEADERSHIP_SCRIPT: AudioScript = {
  slug: "opener-bb-leadership",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Take a long breath.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hear this from Mark 10. The disciples were arguing about who would be greatest. Jesus called them over and said, Whoever wants to become great among you must be your servant. For even the Son of Man did not come to be served, but to serve, and to give His life as a ransom for many.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Jesus does not call leaders to be soft. He calls them to serve. To use what they have been given — a captain’s role, a starting spot, a voice, a possession — to lift the people around them.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "So lead by serving. Talk on defense. Pull a teammate into the huddle. Pick him up after a bad possession. Make the extra pass that helps the group.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "The role, the minutes, the starting spot — none of it is for standing above the team. It is for helping the team move forward.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Lead like Christ. Strong enough to serve. Free enough to put the team first.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
