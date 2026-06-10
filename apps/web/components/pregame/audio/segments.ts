// Shared segment runs for the pregame session-cell scripts.
//
// Every (position × adversity) cell is structurally:
//   [...OPENING, ...<POSITION>_VIZ, <cell-specific hardMoment>, ...CLOSING]
//
// OPENING  = settle + two breath rounds + "remember what is true" (Mentor /
//            Devotional-guide register). Identical across all cells.
// <POS>_VIZ = enter-the-rink sensory + first-shift + role rehearsal. Shared
//            within a position; skaters (forward/defense) differ from goalie.
// CLOSING  = reset plan + prayer + send-off. Identical across all cells.
//
// The hardMoment block stays inline in each cell — it is the one section
// that is genuinely cell-specific (the scene, its false-story lines, the
// truth that answers it). Three cells also keep a LOCAL copy of the run
// they tune (forward-missed-chance: OPENING; defense-beaten-wide and
// goalie-coach-yells: VIZ) — that divergence is intentional, see each file.
//
// Segments with no `instructions` fall back to the importing script's
// top-level `instructions` at generation time, so a cell with a local
// SCRIPT override (goalie-coach-yells) still resolves these shared runs
// against its own register. Imported with the ".ts" extension because
// these files are loaded only by the node --strip-types audio generator.

import type { Segment } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  PRAYER_INSTRUCTIONS,
  RESET_PLAN_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENING: Segment[] = [

    // ── Regulate breath (Mentor, meditative)
    // Cell starts at breath section. Segment 1 (identity) is delivered by
    // the need-specific opener.mp3 stitched in front of this file at
    // runtime. See compositional architecture in audio/types.ts.
    {
      type: "speech",
      text: "Now, take two breaths. Four in. Six out.",
      mark: { phase: "settle" },
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "Inhale.",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "inhale", round: 0 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale.",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "exhale", round: 0 },
    },
    { type: "silence", durationSec: 6 },
    {
      type: "speech",
      text: "Inhale.",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "inhale", round: 1 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale.",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "exhale", round: 1 },
    },
    { type: "silence", durationSec: 6 },

    // ── Remember what is true (Devotional guide)
    {
      type: "speech",
      text: "Remember what is true.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 }
];

export const FORWARD_VIZ: Segment[] = [

    // ── Enter the rink (Mentor) — SKATER SENSORY
    {
      type: "speech",
      text: "Keep your eyes closed. See yourself running onto the ice.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
      mark: { phase: "rink" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "You smell the ice, the zamboni.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Hear the skates carving in warmup.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You feel your edges. Feel your gloves.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.2 },
    {
      type: "speech",
      text: "Feel your stick.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.2 },
    {
      type: "speech",
      text: "Feel the weight of your helmet.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You tell yourself, You belong here.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },

    // ── First shift (Coach) — FORWARD
    {
      type: "speech",
      text: "Now visualize that your line is called.",
      speed: 1.1,
      mark: { phase: "firstShift" },
    },
    { type: "silence", durationSec: 0.25 },
    {
      type: "speech",
      text: "You hop the boards. You see the play.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Three hard strides into the play.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Your eyes are up. You shoulder check.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Take the puck and make the simple, strong play.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.5 },
    {
      type: "speech",
      text: "Get back hard on the change.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },

    // ── Role rehearsal (Coach) — FORWARD
    {
      type: "speech",
      text: "See yourself win a puck race along the wall.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You get there first, get low, take the body.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You make a play. Drive inside, hard to the net. Shoot, and score.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now visualize the next play.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "Your teammate has the puck. It turns over. You backcheck harder than everyone else and stop the goal.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 }
];

export const DEFENSE_VIZ: Segment[] = [

    // ── Enter the rink (Mentor) — SKATER SENSORY
    {
      type: "speech",
      text: "Keep your eyes closed. See yourself running onto the ice.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
      mark: { phase: "rink" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "You smell the ice, the zamboni.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Hear the skates carving in warmup.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You feel your edges. Feel your gloves.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.2 },
    {
      type: "speech",
      text: "Feel your stick.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.2 },
    {
      type: "speech",
      text: "Feel the weight of your helmet.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You tell yourself, You belong here.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },

    // ── First shift (Coach) — DEFENSE
    {
      type: "speech",
      text: "Now visualize that your line is called.",
      speed: 1.1,
      mark: { phase: "firstShift" },
    },
    { type: "silence", durationSec: 0.25 },
    {
      type: "speech",
      text: "You hop the boards. Get to your gap.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Shoulder check before the puck arrives.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "See the play develop.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Hold your line. Make a simple first pass.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Box out at the net front. Go again.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },

    // ── Role rehearsal (Coach) — DEFENSE
    {
      type: "speech",
      text: "See yourself shoulder check before you pick up the puck.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You retrieve the puck, calm and strong.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You make the first pass, clean and on the tape.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now visualize the next play.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "You hold your gap, you stay between the man and the net, and you box out in front.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 }
];

export const GOALIE_VIZ: Segment[] = [

    // ── Enter the rink (Mentor) — GOALIE SENSORY
    {
      type: "speech",
      text: "See the crease.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
      mark: { phase: "rink" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "The blue paint under your skates.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "The crossbar behind your head.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Hear the anthem fade out.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Feel your glove.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.2 },
    {
      type: "speech",
      text: "Feel your blocker.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.2 },
    {
      type: "speech",
      text: "Feel the weight of your pads, settled and ready.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You belong here.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },

    // ── First save (Coach) — GOALIE
    {
      type: "speech",
      text: "Puck drops.",
      speed: 1.1,
      mark: { phase: "firstShift" },
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Set your feet in the crease.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Square to the shooter.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Track the puck all the way in.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Make the first save, calm and big.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Control the rebound. Cover, or steer it to the corner.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Reset. Eyes back to the puck.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },

    // ── Role rehearsal (Coach) — GOALIE
    {
      type: "speech",
      text: "Set your feet.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Track the puck.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Control the rebound.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Reset after traffic.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Next shot only.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 }
];

// ── CLOSING sub-arrays — single source of truth for each phase of the
// shared CLOSING run. Legacy cells import CLOSING unchanged; the clip
// generator imports the individual sub-arrays to render each as its own
// independently-leveled MP3.
export const RESET_PLAN_SEGMENTS: Segment[] = [

    // ── Reset plan (Mentor) — finalized in docs/pregame-scripts.md §4
    {
      type: "speech",
      text: "When the moment hits, come back to what is true.",
      speed: 1.1,
      mark: { phase: "reset" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Breathe. Reset your body. Say the truth. Make the next play.",
      speed: 1.1,
      instructions: RESET_PLAN_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
];

export const PRAYER_SEGMENTS: Segment[] = [

    // ── Prayer — finalized in docs/pregame-scripts.md §4
    {
      type: "speech",
      text: "Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.",
      speed: 1.1,
      instructions: PRAYER_INSTRUCTIONS,
      mark: { phase: "prayer" },
    },
    { type: "silence", durationSec: 2.0 },
];

export const SENDOFF_SEGMENTS: Segment[] = [

    // ── Send-off (Mentor)
    {
      type: "speech",
      text: "You are secure. Now play from victory.",
      speed: 1.1,
      mark: { phase: "done" },
    },
];

// CLOSING is the concatenation of the three sub-arrays. All legacy cells
// import this unchanged — single source of truth preserved.
export const CLOSING: Segment[] = [
  ...RESET_PLAN_SEGMENTS,
  ...PRAYER_SEGMENTS,
  ...SENDOFF_SEGMENTS,
];
