// Swimming pregame VIZ blocks (FV-3xx) — the per-specialty visualization runs,
// the analog of FORWARD/DEFENSE/GOALIE_VIZ (segments.ts), GUARD/WING/BIG_VIZ
// (segments-basketball.ts), PITCHER/CATCHER/INFIELD/OUTFIELD_VIZ
// (segments-baseball.ts), BOMBER/BALLSTRIKER/SCRAMBLER_VIZ (segments-golf.ts),
// and QB/RB/WR/OL/DL/LB/DB_VIZ (segments-football.ts).
//
// Every swimming pregame cell is structurally:
//   [...OPENING, ...<SPECIALTY>_VIZ, <cell-specific hardMoment>, ...CLOSING]
// OPENING and CLOSING (breath, reset plan, prayer, send-off) are the shared
// faith/structure clips — REUSED from ./segments.ts as-is, not re-authored.
//
// Specialties: Sprint / Distance / Stroke / IM. Swimming's "position" dimension
// maps to race specialty. The sensory arrival run (SWIMMING_ARRIVAL) is shared
// across the four specialties; the first-rep rehearsal + role rehearsal diverge
// per specialty (ROLE_CONTENT scenes). Authored by the content trio +
// swimming-expert under lead orchestration. Imported with the ".ts" extension
// to match the node --strip-types audio generator convention.
//
// Phase marks reuse the engine's legacy keys ("rink" = sensory arrival,
// "firstShift" = first competitive rep) exactly as baseball/basketball/golf/
// football do, so the manifest timeline logic is sport-agnostic.
//
// Every VIZ is the POSITIVE rehearsal — a race going right. All imagery is
// performance + technique (start, stroke, line, turn, finish); the only breath
// language is DRY-LAND, behind-the-blocks calm-down breathing ("Slow breath")
// and relaxed in-race breathing ("breathe easy"). No breath-hold, no hypoxic /
// underwater breath-control framing anywhere. No body, suit, or weight imagery.

import type { Segment } from "./types";
import { VISUALIZATION_INSTRUCTIONS } from "./instructions.ts";

// ── Shared sensory arrival (Mentor) — SWIMMER SENSORY (shared across specialties) ──
const SWIMMING_ARRIVAL: Segment[] = [
    { type: "speech", text: "Keep your eyes closed. See yourself walking onto the pool deck toward your lane.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "You hear the natatorium hum — water lapping the gutters, a whistle echoing off the far wall.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "Hear the meet settle around you. A starter's voice somewhere, your teammates talking low.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You smell the chlorine, sharp and clean, and feel the warm, damp air on your skin.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "You snap your cap into place and feel it settle snug over your ears.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "You seat your goggles, press them firm, and the deck goes quiet and clear.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You step up behind the blocks. You tell yourself, You belong here.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.25 },
];

export const SPRINT_VIZ: Segment[] = [
  ...SWIMMING_ARRIVAL,

  // ── First rep (Coach) — SPRINT
    { type: "speech", text: "You step up onto the block and find your set position. Slow breath. This race is yours.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "The horn. You explode off the block, arms driving, into a tight, clean entry.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You break out powerful and on top of the water, already into your stroke.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You hold your form — high tempo, no spin, every stroke clean and connected.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You drive through the finish, reach long, and touch the wall. One race at a time — that's how it goes all meet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — SPRINT (ROLE_CONTENT scenes — "Explode and hold the touch.")
    { type: "speech", text: "See yourself explode and hold the touch.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Quick to the blocks. Rip the start, clean break. Hold your stroke, no spin — every length, top speed.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Drive through the finish, reach for the wall. And if the swimmer beside you goes out fast, you don't chase their race — you swim your own, full speed, all the way through the touch.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next race.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "The final, the fastest heat, the lane next to you loaded. You don't tighten up. You rip the start, break out clean, hold your tempo with no spin, and drive long through the wall — your race, your touch, full speed to the end.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const DIST_VIZ: Segment[] = [
  ...SWIMMING_ARRIVAL,

  // ── First rep (Coach) — DISTANCE
    { type: "speech", text: "You step up onto the block and settle into your set. Slow breath. You know exactly how this race unfolds.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "The horn. You start smooth, break out controlled, and drop right onto your rhythm.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You lock the pace, stroke long and relaxed, breathing easy and steady on the line.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You stay right on the black line, turn after turn, the rhythm carrying you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You build through the back half, find another gear, and bring it home strong to the wall. One length at a time — that's how it goes all meet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — DISTANCE (ROLE_CONTENT scenes — "Settle in, hold the pace.")
    { type: "speech", text: "See yourself settle in and hold the pace.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Find your rhythm early. Lock the pace, breathe easy and relaxed. Stay on the line — every length, the same.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Build through the back half, bring it home strong. And when it starts to hurt in the middle, you don't panic — you stay on your pace, stay on the line, and trust the work to carry you to the wall.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next race.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "The longest race on your card, the field going out hard early. You don't get pulled off your plan. You settle onto your rhythm, hold your pace, breathe easy on the line, and build through the back half — passing them late, home strong to the wall.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const STROKE_VIZ: Segment[] = [
  ...SWIMMING_ARRIVAL,

  // ── First rep (Coach) — STROKE
    { type: "speech", text: "You step up onto the block and find your set. Slow breath. You own this stroke.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "The horn. You start clean and break out into the stroke you've drilled a thousand times.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You feel the water — long, clean, holding your tempo, the stroke smooth and powerful.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Into the wall — a legal turn, hands and feet right, and a sharp, powerful breakout off the wall.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You finish the stroke full and strong, reach long, and touch with two hands, clean. One race at a time — that's how it goes all meet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — STROKE (ROLE_CONTENT scenes — "Trust the stroke you own.")
    { type: "speech", text: "See yourself trust the stroke you own.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Feel the water, long and clean. Hold your tempo. Legal turn, sharp breakout — every wall, dialed in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Finish the stroke, full and strong. Two hands, clean touch. You make every turn legal and every finish legal — nothing left to chance, the race is yours on technique.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next race.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "The race on the line, tight to the wall at every turn. You don't rush it sloppy. You feel the water, hold your tempo, hit each turn legal, break out sharp, and finish full and strong — two hands, clean touch, your stroke all the way through.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const IM_VIZ: Segment[] = [
  ...SWIMMING_ARRIVAL,

  // ── First rep (Coach) — INDIVIDUAL MEDLEY
    { type: "speech", text: "You step up onto the block and find your set. Slow breath. Four strokes, one race, all yours.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "The horn. You fly out controlled — smooth and rhythmic, not over-spent, riding clean on top of the water.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Legal turn, and you roll smooth into the backstroke, steady and long on the line.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Into your breast leg — you own it, strong pull, clean timing, holding ground or making it up.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You bring it home freestyle, every transition clean, and drive through to the wall. One race at a time — that's how it goes all meet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — INDIVIDUAL MEDLEY (ROLE_CONTENT scenes — "Master the whole race.")
    { type: "speech", text: "See yourself master the whole race.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Fly out controlled. Smooth into the back. Own your breast leg — each stroke its own job, done right.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Bring it home freestyle. Clean every transition. And if one stroke isn't your strongest, you don't lose the race there — you hold steady through it and make it up where you're strong.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next race.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "The final, a deep field, every leg a battle. You don't get rushed off your plan. You fly out controlled, roll smooth into the back, own your breast leg, and bring it home freestyle — every transition clean, driving through to the wall.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];
