// Basketball pregame VIZ blocks (FV-30) — the per-position visualization runs,
// the analog of FORWARD_VIZ / DEFENSE_VIZ / GOALIE_VIZ in ./segments.ts.
//
// Every basketball pregame cell is structurally:
//   [...OPENING, ...<POSITION>_VIZ, <cell-specific hardMoment>, ...CLOSING]
// OPENING and CLOSING (breath, reset plan, prayer, send-off) are the shared
// faith/structure clips — REUSED from ./segments.ts as-is, not re-authored.
//
// Positions: Guard / Wing / Big (FV-29 taxonomy). Authored to mirror the hockey
// VIZ format/length/register beat-for-beat so runtime length holds. The sensory
// arrival run is shared across the three positions; first-possession + role
// rehearsal diverge per position (FV-29 §2 ROLE_CONTENT scenes).
//
// NOT yet wired into the engine (clips.ts) — that is the FV-28 per-sport
// registry refactor (FV-30 authors the scripts; FV-28 registers them; FV-31
// renders the audio). Imported with the ".ts" extension to match the
// node --strip-types audio generator convention used across this dir.

import type { Segment } from "./types";
import { VISUALIZATION_INSTRUCTIONS } from "./instructions.ts";

export const GUARD_VIZ: Segment[] = [
  // ── Enter the gym (Mentor) — HOOPER SENSORY
  {
    type: "speech",
    text: "Keep your eyes closed. See yourself walking into the gym.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
    mark: { phase: "rink" },
  },
  { type: "silence", durationSec: 1.0 },
  {
    type: "speech",
    text: "You hear the ball on the floor in warmups.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 1.0 },
  {
    type: "speech",
    text: "Hear the squeak of shoes, the rim after a shot.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You feel the ball in your hands. Feel the grip.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.2 },
  {
    type: "speech",
    text: "Feel your feet under you.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.2 },
  {
    type: "speech",
    text: "Feel your jersey, light on your shoulders.",
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

  // ── First possession (Coach) — GUARD
  {
    type: "speech",
    text: "Now visualize the tip. You bring the ball up.",
    speed: 1.0,
    mark: { phase: "firstShift" },
  },
  { type: "silence", durationSec: 0.25 },
  {
    type: "speech",
    text: "You push the pace up the floor.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "Your eyes are up. You see the floor.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You take care of the rock. Strong with the ball.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "Get downhill. Make the simple, strong play.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.5 },
  {
    type: "speech",
    text: "Get back on defense. Talk, be loud.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },

  // ── Role rehearsal (Coach) — GUARD (ROLE_CONTENT scenes)
  {
    type: "speech",
    text: "See yourself run the team with poise.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You push the pace, you see the floor, you take care of the rock.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You get downhill, draw two, and hit the open man.",
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
    text: "They push the ball back at you. You pick up early, you talk, and you turn them away.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
];

export const WING_VIZ: Segment[] = [
  // ── Enter the gym (Mentor) — HOOPER SENSORY (shared with Guard)
  {
    type: "speech",
    text: "Keep your eyes closed. See yourself walking into the gym.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
    mark: { phase: "rink" },
  },
  { type: "silence", durationSec: 1.0 },
  {
    type: "speech",
    text: "You hear the ball on the floor in warmups.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 1.0 },
  {
    type: "speech",
    text: "Hear the squeak of shoes, the rim after a shot.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You feel the ball in your hands. Feel the grip.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.2 },
  {
    type: "speech",
    text: "Feel your feet under you.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.2 },
  {
    type: "speech",
    text: "Feel your jersey, light on your shoulders.",
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

  // ── First possession (Coach) — WING
  {
    type: "speech",
    text: "Now visualize the first possession. You spot up on the wing.",
    speed: 1.0,
    mark: { phase: "firstShift" },
  },
  { type: "silence", durationSec: 0.25 },
  {
    type: "speech",
    text: "The ball swings to you. Feet set, shoot it.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You sprint the lane in transition.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You take the next open shot. No hesitation.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You lock up your man. Stay in front.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.5 },
  {
    type: "speech",
    text: "Box out, then close out hard.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },

  // ── Role rehearsal (Coach) — WING (ROLE_CONTENT scenes)
  {
    type: "speech",
    text: "See yourself stay ready and stay aggressive.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "Feet set, you shoot it. You sprint the lane.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You take the next open shot, and you lock up your man.",
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
    text: "Your man catches it. You stay down, you contest, and you crash the glass.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
];

export const BIG_VIZ: Segment[] = [
  // ── Enter the gym (Mentor) — HOOPER SENSORY (shared)
  {
    type: "speech",
    text: "Keep your eyes closed. See yourself walking into the gym.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
    mark: { phase: "rink" },
  },
  { type: "silence", durationSec: 1.0 },
  {
    type: "speech",
    text: "You hear the ball on the floor in warmups.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 1.0 },
  {
    type: "speech",
    text: "Hear the squeak of shoes, the rim after a shot.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You feel the ball in your hands. Feel the grip.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.2 },
  {
    type: "speech",
    text: "Feel your feet under you.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.2 },
  {
    type: "speech",
    text: "Feel your jersey, light on your shoulders.",
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

  // ── First possession (Coach) — BIG
  {
    type: "speech",
    text: "Now visualize the tip. You go up and win it.",
    speed: 1.0,
    mark: { phase: "firstShift" },
  },
  { type: "silence", durationSec: 0.25 },
  {
    type: "speech",
    text: "You seal your man and post strong.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You hit the glass. Two hands, strong.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You roll hard to the rim and finish.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "On defense, you move your feet and stay vertical.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.5 },
  {
    type: "speech",
    text: "You protect the rim. Straight up, no foul.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },

  // ── Role rehearsal (Coach) — BIG (ROLE_CONTENT scenes)
  {
    type: "speech",
    text: "See yourself own the paint.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You seal and post strong, you hit the glass, you protect the rim.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
  {
    type: "speech",
    text: "You roll hard and finish through contact.",
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
    text: "They attack the paint. You move your feet, you stay vertical, and you wall up without fouling.",
    speed: 1.0,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 2.0 },
];
