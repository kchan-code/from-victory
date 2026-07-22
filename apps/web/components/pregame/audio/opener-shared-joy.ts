// Pregame opener — Today's focus: "Joy."
//
// FV-466: shared sport-neutral variant of opener-joy. Serves every
// sport that falls back to NEED_OPENER_SLUGS (football, golf, basketball
// "Calm", baseball, lacrosse, and future sports). Hockey keeps the
// original opener-joy clip via HOCKEY_OPENER_OVERRIDES in
// audio-mapping.ts — edits here must stay free of ALL sport-specific
// vocabulary (test: a golfer, a swimmer, and a linebacker all nod).
//
// Replaces segment 1 of the locked pilot session when the athlete
// selects Joy on the Today's Focus screen.
//
// Verse: 1 Thessalonians 5:16-18 — be joyful always, pray continually,
// give thanks in all circumstances.
// Why: Joy is paired with prayer and thanksgiving — Paul writes it
// as a triplet, not a standalone command. The athlete who stays
// connected to God in every shift, every loss, every win, is the
// one who carries joy that does not depend on the scoreboard.
// Identity truth: "Joy is not a mood that changes with the
// scoreboard. It is a posture you take toward the God who is always
// with you."

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_SHARED_JOY_SCRIPT: AudioScript = {
  slug: "opener-shared-joy",
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
      text: "Joy does not mean you fake a smile or pretend the hard moment did not happen. It means staying connected to God in the middle of what is hard — Paul ties joy to prayer and thanksgiving.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "So remember the gift. A body that can move. A team around you. A sport you love. A chance to compete.",
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
      text: "Compete with joy. Pray as you go. Give it everything, and take the next moment free.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
