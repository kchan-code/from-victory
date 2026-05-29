// Forward × I start slow
//
// A slow start makes a forward grip the stick, force plays, and try to make up for it in one shift — which compounds the slow start.
//
// One of the 30-cell pregame audio matrix (3 positions × 10 adversities).
// Generated 2026-05-27 from the locked Forward + Defense + Goalie pilot
// templates. Segments 1-3 and 8-9 are universal lift; segments 4-6 are
// position-specific lift from the forward pilot; segment 7 is
// cell-specific.
//
// Instruction blocks now import from the shared ./instructions.ts module.
// Position segments 4-6 are still lifted from the position pilot — a future
// extraction to per-position segment modules.

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  PRAYER_INSTRUCTIONS,
  RESET_PLAN_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";

export const SESSION_FORWARD_START_SLOW_SCRIPT: AudioScript = {
  slug: "session-forward-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
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
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    // ── Enter the rink (Mentor) — SKATER SENSORY
    {
      type: "speech",
      text: "Keep your eyes closed. See yourself running onto the ice.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
      mark: { phase: "rink" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "You smell the ice, the zamboni.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Hear the skates carving in warmup.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You feel your edges. Feel your gloves.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.2 },
    {
      type: "speech",
      text: "Feel your stick.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.2 },
    {
      type: "speech",
      text: "Feel the weight of your helmet.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You tell yourself, You belong here.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },

    // ── First shift (Coach) — FORWARD
    {
      type: "speech",
      text: "Now visualize you that your line is called.",
      speed: 1.0,
      mark: { phase: "firstShift" },
    },
    { type: "silence", durationSec: 0.25 },
    {
      type: "speech",
      text: "You hop the boards. You see the play",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Three hard strides into the play.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Your Eyes are up. you shoulder check.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Take the puck and make the simple, strong play.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.5 },
    {
      type: "speech",
      text: "Get back hard on the change.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },

    // ── Role rehearsal (Coach) — FORWARD
    {
      type: "speech",
      text: "See yourself win a puck race along the wall.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "you Get there first, get low, take the body.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "you make a play, Drive inside, hard to the net, shoot, and score.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now visualize the next play.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "Your teamate has the puck, the puck turns over, you backcheck harder than everyone else and stop the goal.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    // ── Hard moment (Mentor → Coach) — cell-specific
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "First period is half over. You have not touched the puck cleanly. Your legs feel a step behind. Nothing is coming easy.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Tight grip on the stick. Shoulders up. I am not in this game.",
      speed: 1.2,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now the reset. One long exhale on the bench.",
      speed: 1.0,
    },
    { type: "silence", durationSec: 2.0 },
    // Canonical tactical reset — applies to every cell.
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    // Cell-specific tactical wisdom.
    {
      type: "speech",
      text: "Loose hands. Simple plays. Let the game come to you.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You started slow. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },

    // ── Reset plan (Coach)
    {
      type: "speech",
      text: "This is the move. Every time. Whatever happens tonight.",
      speed: 1.0,
      mark: { phase: "reset" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "See it. Feel it. Breathe. Speak truth. Take the next faithful action.",
      speed: 1.0,
      instructions: RESET_PLAN_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.5 },

    // ── Prayer / send-off (Devotional guide)
    {
      type: "speech",
      text: "Let's pray. Father, thank you that my worth was settled before this game and will hold after it. Help me compete with courage. Help me respond well when it gets hard. Help me serve my team. Whatever happens out there, help me to glorify you. In Jesus' name, Amen",
      speed: 1.0,
      instructions: PRAYER_INSTRUCTIONS,
      mark: { phase: "prayer" },
    },
    { type: "silence", durationSec: 2.5 },
    {
      type: "speech",
      text: "You are secure. Now play from victory.",
      speed: 1.0,
      mark: { phase: "done" },
    },
  ],
};
