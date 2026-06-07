// Pregame opener — Today's focus: "Be more Vocal."
//
// Replaces segment 1 of the locked pilot session when the athlete
// selects "Be more Vocal" on the Today's Focus screen.
//
// Verse: Romans 8:1 — no condemnation for those in Christ.
// Why: The "stay quiet / don't risk being wrong out loud" pull is a
// performance-identity problem. The gospel dissolves it: the verdict
// was settled before the game started. Freedom to speak is freedom
// that flows FROM the cross, not a confidence trick.
// Identity truth: "What anyone out there thinks of you is not the
// verdict on you. You have nothing left to protect. You are free to speak."
//
// VOICE-DELIVERY NOTE (for the by-ear pass):
// In seg 4, the clause "don't risk it, don't be the one who's wrong
// out loud" is the *quoted fear-voice's content*, not the coach's
// instruction — it should read as the voice being externalized
// ("when that voice tells you… — hear it for what it is"), not as
// a command. The coach is naming a thing, not instructing the athlete
// to do it.

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_BE_VOCAL_SCRIPT: AudioScript = {
  slug: "opener-be-vocal",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Drop your shoulders.",
      speed: 1.0,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Out there, talking is competing. The loud player moves the puck before it even arrives. Tonight, that's the job — be the one who talks.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "And here is what Paul wrote in Romans 8. For everyone in Christ, there is now no condemnation. None. The verdict on you was settled at the cross — before you ever stepped on the ice.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "So when that voice tells you to stay quiet — don't risk it, don't be the one who's wrong out loud — hear it for what it is. That is not you. That is the part of you that has to look good. And that part is already settled.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "So tonight, be the loud one. Man on. Time. Heads up. D to D on the breakout. Free to be wrong, free to speak, free to move the play before it even happens.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "What anyone out there thinks of you is not the verdict on you. You have nothing left to protect. You are free to speak.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
