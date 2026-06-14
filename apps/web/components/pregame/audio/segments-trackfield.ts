// Track & Field pregame VIZ blocks (FV-3xx) — the per-event-group visualization
// runs, the analog of FORWARD/DEFENSE/GOALIE_VIZ (segments.ts), GUARD/WING/BIG_VIZ
// (segments-basketball.ts), PITCHER/CATCHER/INFIELD/OUTFIELD_VIZ
// (segments-baseball.ts), BOMBER/BALLSTRIKER/SCRAMBLER_VIZ (segments-golf.ts),
// SPRINT/DIST/STROKE/IM_VIZ (segments-swimming.ts), and QB/RB/WR/OL/DL/LB/DB_VIZ
// (segments-football.ts).
//
// Every track & field pregame cell is structurally:
//   [...OPENING, ...<EVENT>_VIZ, <cell-specific hardMoment>, ...CLOSING]
// OPENING and CLOSING (breath, reset plan, prayer, send-off) are the shared
// faith/structure clips — REUSED from ./segments.ts as-is, not re-authored.
//
// Event groups: Sprint / Distance / Hurdle / Jump / Throw. Track & field's
// "position" dimension maps to event group. The sensory arrival run
// (TRACKFIELD_ARRIVAL) is shared across the five groups; the first-rep rehearsal
// + role rehearsal diverge per group (ROLE_CONTENT scenes). Authored by the
// content trio + track-and-field-expert under lead orchestration. Imported with
// the ".ts" extension to match the node --strip-types audio generator convention.
//
// Phase marks reuse the engine's legacy keys ("rink" = sensory arrival,
// "firstShift" = first competitive rep) exactly as baseball/basketball/golf/
// swimming/football do, so the manifest timeline logic is sport-agnostic.
//
// Every VIZ is the POSITIVE rehearsal — a rep going right. All imagery is
// performance + technique (start, stride, rhythm, approach, ring, finish). The
// only breath language is normal, relaxed in-race breathing ("relax the
// shoulders, breathe"); never breath-control or breath-hold. No body, weight,
// leanness, or food imagery anywhere — distance and jumps are RED-S-adjacent, so
// all imagery stays on technique and competition.

import type { Segment } from "./types";
import { VISUALIZATION_INSTRUCTIONS } from "./instructions.ts";

// ── Shared sensory arrival (Mentor) — TRACK & FIELD SENSORY (shared across groups) ──
const TRACKFIELD_ARRIVAL: Segment[] = [
    { type: "speech", text: "Keep your eyes closed. See yourself walking out onto the track toward your event.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "You hear the meet PA echo across the infield, and somewhere off in the distance, a starter's whistle.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "Hear the meet settle around you. Spikes clicking on the track and the runway apron, your teammates talking low.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You see the bright chalk lines on the infield and catch the smell of it, fresh and dry.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "You feel your spikes bite into the track, firm and ready under you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "You settle into your spot — the blocks, the ring, the top of the runway — and let everything else go quiet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You tell yourself, You belong here.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.25 },
];

export const SPRINT_VIZ: Segment[] = [
  ...TRACKFIELD_ARRIVAL,

  // ── First rep (Coach) — SPRINT
    { type: "speech", text: "You back into the blocks and set your feet. Slow breath. This race is yours.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "Set position — hips up, eyes down. The gun. You explode out, driving low and powerful.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You rise up out of the drive, hit top speed, and stay loose — fast hands, loose face.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You hold your form, relaxed and powerful, every stride clean and quick.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You run all the way through the line and lean, don't reach. One race at a time — that's how it goes all meet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — SPRINT (ROLE_CONTENT scenes — "Explode and stay relaxed.")
    { type: "speech", text: "See yourself explode and stay relaxed.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Set in the blocks. React, drive, rise up. Fast hands, loose face — relaxed and powerful all the way down.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Run through the line. Lean, don't reach. And if the runner beside you goes out hard, you don't tighten up and chase — you run your own race, relaxed and fast, all the way through.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next rep.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "The final, the fastest heat, the lane next to you loaded. You don't press. You set clean, explode out, rise up, and stay loose — fast hands, loose face, leaning through the line. Your race, full speed to the end.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const DIST_VIZ: Segment[] = [
  ...TRACKFIELD_ARRIVAL,

  // ── First rep (Coach) — DISTANCE
    { type: "speech", text: "You step to the line and find your spot in the field. Slow breath. You know exactly how this race unfolds.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "The gun. You go out controlled, settle into your pace, and let the early scramble pass.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You relax the shoulders, breathe, and drop right onto your rhythm, stride after stride.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You stay in contact, stay patient, sitting easy off the leaders, the laps clicking by.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "At the bell, you make your move on time and empty the tank to the line. One lap at a time — that's how it goes all meet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — DISTANCE (ROLE_CONTENT scenes — "Run your race, your way.")
    { type: "speech", text: "See yourself run your race, your way.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Settle into your pace. Relax the shoulders, breathe. Stay in contact, stay patient — every lap, the same.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Make your move on time. Empty the tank at the bell. And when the early pace is too hot, you don't get pulled off your plan — you run your own race and trust the work to bring you back.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next rep.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "The longest race on your card, the field tearing out hard early. You don't chase it. You settle into your pace, relax the shoulders, breathe, and stay patient — then make your move on time and empty the tank at the bell, running them down to the line.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const HURDLE_VIZ: Segment[] = [
  ...TRACKFIELD_ARRIVAL,

  // ── First rep (Coach) — HURDLE
    { type: "speech", text: "You back into the blocks and set your feet. Slow breath. Your steps are dialed in.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "The gun. You drive out, hit your count, and attack the first hurdle, aggressive and tall.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Lead leg snaps down. Trail leg comes through, quick and clean, and you're back into your stride.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You run between the barriers, three steps, rhythm locked, attacking each one the same way.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You clear the last one clean and sprint off it all the way through the line. One race at a time — that's how it goes all meet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — HURDLE (ROLE_CONTENT scenes — "Trust your steps.")
    { type: "speech", text: "See yourself trust your steps.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Attack the first hurdle. Lead leg snaps down. Trail leg comes through — quick, clean, right back into the rhythm.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Run between the barriers. Sprint off the last one. And if you nick a hurdle along the way, you don't flinch or shorten up — you stay aggressive, hit your steps, and run right through it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next rep.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "The final, the field stacked, the first hurdle coming up fast. You don't stutter. You drive out, attack the first one tall, snap the lead leg down, bring the trail through, and run the rhythm between the barriers — sprinting off the last one all the way through the line.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const JUMP_VIZ: Segment[] = [
  ...TRACKFIELD_ARRIVAL,

  // ── First rep (Coach) — JUMP
    { type: "speech", text: "You stand at the top of the runway and find your mark. Slow breath. This attempt is yours.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "You start the approach, building speed, staying tall and under control down the runway.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You hit the board at full speed, right on your mark, no reaching, no chopping.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You commit and explode up, driving off the board, riding the speed into the air.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You land it clean, get up, and walk back ready for the next one. One attempt at a time — that's how it goes all meet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — JUMP (ROLE_CONTENT scenes — "Commit down the runway.")
    { type: "speech", text: "See yourself commit down the runway.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Find your mark. Build the approach, stay tall. Hit the board, full speed — no reaching, no backing off.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Commit and explode up. And if you foul or come up short, you let it go — next attempt, fresh start. Same mark, same full-speed approach, full commitment again.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next rep.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "Your last attempt, the standings on the line, the runway quiet in front of you. You don't steer it. You find your mark, build the approach tall, hit the board at full speed, and commit and explode up — and whatever the last one was, this one is a fresh start.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const THROW_VIZ: Segment[] = [
  ...TRACKFIELD_ARRIVAL,

  // ── First rep (Coach) — THROW
    { type: "speech", text: "You step into the ring and settle in. Slow breath. This throw is yours.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "You start slow and controlled, balanced at the back, building into the throw with patience.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow, then violent — you stay back, load up, and then rip it through the middle.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You finish tall and through, big and explosive, driving everything out in front of you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You stay in the ring, watch it sail, and step out clean. One throw at a time — that's how it goes all meet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — THROW (ROLE_CONTENT scenes — "Big and explosive.")
    { type: "speech", text: "See yourself be big and explosive.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Settle in the ring. Slow, then violent. Stay back, then rip it — patient at the start, all power at the finish.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Finish tall and through. And if one comes out flat or sails wide, you don't grip it tighter — next throw, let it go. Settle back in, slow then violent, and let it fly free.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next rep.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "Your last throw, the board on the line, the ring quiet around you. You don't muscle it. You settle in, start slow and balanced, stay back, then rip it violent through the middle — finishing tall and through, big and explosive, and letting the last one go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];
