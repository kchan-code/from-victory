// Pregame opener — Today's focus: "Joy." (Basketball variant)
//
// Basketball-specific application of 1 Thessalonians 5:16-18 — same scripture,
// same identity truth, basketball language: possessions, bad possession.
// Clone of opener-joy.ts with basketball-specific seg-3 application.
//
// Verse: 1 Thessalonians 5:16-18 — be joyful always, pray continually,
// give thanks in all circumstances.
// Identity truth: "Joy is not a mood that changes with the
// scoreboard. It is a posture you take toward the God who is always
// with you."
//
// Youth-pastor APPROVED (FV-120). Audio rendering = FV-120.

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_BB_JOY_SCRIPT: AudioScript = {
  slug: "opener-bb-joy",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Let your face soften.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hear this from 1 Thessalonians 5. Paul was writing to a young church facing real hardship: Rejoice always. Pray continually. Give thanks in all circumstances. For this is God’s will for you in Christ Jesus.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Joy does not mean you fake a smile or pretend the bad possession did not happen. Paul ties joy to prayer and thanksgiving — staying connected to God in the middle of what is hard.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "So remember the gift. A body that can move. A team to play with. A ball in your hands. A game you love. A chance to compete.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "The scoreboard matters, but it is not the whole story. Keep perspective. Give thanks. You get to do this today.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Play with joy. Pray as you go. Compete hard, and take the next possession free.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
