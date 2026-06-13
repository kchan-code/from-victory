// Football pregame VIZ blocks (FV-202) — the per-role visualization runs, the
// analog of FORWARD/DEFENSE/GOALIE_VIZ (segments.ts), GUARD/WING/BIG_VIZ
// (segments-basketball.ts), PITCHER/CATCHER/INFIELD/OUTFIELD_VIZ
// (segments-baseball.ts), and BOMBER/BALLSTRIKER/SCRAMBLER_VIZ
// (segments-golf.ts).
//
// Every football pregame cell is structurally:
//   [...OPENING, ...<ROLE>_VIZ, <cell-specific hardMoment>, ...CLOSING]
// OPENING and CLOSING (breath, reset plan, prayer, send-off) are the shared
// faith/structure clips — REUSED from ./segments.ts as-is, not re-authored.
//
// Roles: QB / RB / WR / OL / DL / LB / DB (FV-201 taxonomy). The sensory arrival
// run (FOOTBALL_ARRIVAL) is shared across the seven roles; the first-rep
// rehearsal + role rehearsal diverge per role (FV-201 §2 ROLE_CONTENT scenes).
// Authored by the content trio + football-expert under lead orchestration.
// Imported with the ".ts" extension to match the node --strip-types audio
// generator convention.
//
// Phase marks reuse the engine's legacy keys ("rink" = sensory arrival,
// "firstShift" = first competitive rep) exactly as baseball/basketball/golf do,
// so the manifest timeline logic is sport-agnostic.
//
// Every VIZ is the POSITIVE rehearsal — a great rep going right. All contact is
// competitive technique (leverage, fits, finishing); no injury, no playing hurt,
// no body weight/mass.

import type { Segment } from "./types";
import { VISUALIZATION_INSTRUCTIONS } from "./instructions.ts";

// ── Shared sensory arrival (Mentor) — FOOTBALL SENSORY (shared across roles) ──
const FOOTBALL_ARRIVAL: Segment[] = [
    { type: "speech", text: "Keep your eyes closed. See yourself walking out of the locker room toward the field.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "You hear your cleats on the concrete — sharp, even — then the soft give of turf under your feet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "Hear the crowd settling in, the low hum under the Friday-night lights.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You snap your chinstrap and feel it tighten under your jaw.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "Feel the weight of your pads settle square on your shoulders.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "Feel the cool air on your face mask, your jersey loose across your chest.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You tell yourself, You belong here.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.25 },
];

export const QB_VIZ: Segment[] = [
  ...FOOTBALL_ARRIVAL,

  // ── First rep (Coach) — QB
    { type: "speech", text: "You break the huddle and walk it to the line. Slow breath. The offense is yours.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "You get under center, eyes up, reading the defense — you've seen this look a thousand times.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Snap. You drop clean, feet set, and step into the pocket.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Your first read is open. You don't hesitate — you trust it and let it go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The ball comes off your hand with conviction, tight spiral, right on the numbers.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Caught, first down. You jog back to the huddle in command. One play at a time — that's how it goes all night.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — QB (ROLE_CONTENT scenes — "Own the huddle.")
    { type: "speech", text: "See yourself own the huddle.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Eyes up, read it out. You trust your first read and throw it with conviction — every snap, all night.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You protect the football, and when a play breaks down, you don't carry it. Next play, you lead them — calm voice, clear eyes, back to the line.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "Third and long, the blitz is coming, the whole stadium loud. You don't panic. You read it pre-snap, slide the protection, take your drop, and find the open man underneath — first down, still in control.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const RB_VIZ: Segment[] = [
  ...FOOTBALL_ARRIVAL,

  // ── First rep (Coach) — RUNNING BACK
    { type: "speech", text: "You set in the backfield, eyes on the front. Slow breath. You see the whole field.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "Snap. The handoff is clean — you secure it, two hands, high and tight.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You read your blocks, press the hole, and let it open in front of you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You plant and cut downhill, hitting it fast, getting north and south.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You break into the second level, lower your pad level, and finish the run forward.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Five extra yards after contact. You pop up, flip the ball to the ref, and jog back. One carry at a time — that's how it goes all night.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — RUNNING BACK (ROLE_CONTENT scenes — "Downhill, ball secure.")
    { type: "speech", text: "See yourself run downhill, ball secure.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You read your blocks and hit the hole fast — two hands, high and tight, every carry.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You finish every run forward, and when they need you in protection, you pick up the blitz — square up, deliver the punch, and seal the edge.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "Short yardage, everyone in the box, the game on the line. You don't dance. You take the handoff, secure it tight, press the hole, and finish forward through the line — first down, chains move.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const WR_VIZ: Segment[] = [
  ...FOOTBALL_ARRIVAL,

  // ── First rep (Coach) — RECEIVER
    { type: "speech", text: "You line up wide, toe on the line, eyes inside to the corner. Slow breath. This route is yours.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "Snap. You explode off the line and win at the release, clean and fast.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You stem upfield, sell it vertical, then stick your foot and break — full speed, no drifting.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You come open. The ball is in the air, and you look it all the way in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Snatch it out of the air with your hands, tuck it away, and turn upfield.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You get vertical and finish the run. First down. You hand the ball back and reset. One route at a time — that's how it goes all night.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — RECEIVER (ROLE_CONTENT scenes — "Run it, catch it, finish.")
    { type: "speech", text: "See yourself run it, catch it, finish.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You win at the line and run the route full speed — no tipping it off, every rep the same.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You look it all the way in, catch it, tuck it, and go. Next route, you find the soft spot and stay open.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "Press coverage, the corner jamming you at the line, the throw coming your way. You don't get rattled. You beat the jam with your hands, stack him, run through the catch point, and look it in — chains move, your ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const OL_VIZ: Segment[] = [
  ...FOOTBALL_ARRIVAL,

  // ── First rep (Coach) — OFFENSIVE LINE
    { type: "speech", text: "You get in your stance, hand in the dirt, eyes on your man. Slow breath. This is your phone booth.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "You hear the cadence and know your assignment cold — you've run this block a thousand times.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Snap. You fire off low and hard, set your feet, and punch with both hands inside.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You get your hat across, take leverage, and move your man off the ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You feel the back run off your hip, and you drive your feet, finishing to the whistle.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The whistle blows. You let go, help a teammate up, and walk back. One rep at a time — that's how it goes all night.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — OFFENSIVE LINE (ROLE_CONTENT scenes — "Protect the man behind you.")
    { type: "speech", text: "See yourself protect the man behind you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You set your feet and punch, you know your assignment, and you move people off the ball — every snap, the same.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You finish to the whistle, and you play it as five as one — all five hats moving together, no gaps, no one left free.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "Third and long, they're bringing pressure off the edge, the crowd loud. You don't get beat. You set quick, anchor strong, keep your eyes inside-out, and pass off the stunt clean — pocket stays firm, the throw gets out.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const DL_VIZ: Segment[] = [
  ...FOOTBALL_ARRIVAL,

  // ── First rep (Coach) — DEFENSIVE LINE
    { type: "speech", text: "You get in your stance across the ball, eyes on the football. Slow breath. You live in their backfield.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "You key the ball, coiled and ready — the second it moves, you're gone.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Snap. You get off first, low and fast, beating the lineman off the ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You work your hands, shed the block, and stay square in your gap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You find the ball, run to it, and arrive with everyone — full motor to the whistle.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Play dead. You peel off, get back to the huddle, and reset. One rep at a time — that's how it goes all night.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — DEFENSIVE LINE (ROLE_CONTENT scenes — "Get off, win the rep.")
    { type: "speech", text: "See yourself get off and win the rep.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "First off the ball, you beat your man and stay in your gap — disciplined, every snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You run to the football, and you bring it every snap — full motor, never a play off, chasing it down sideline to sideline.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "Third and short, they're trying to run it right at you, the line firing out. You don't get moved. You get off low, take on the double team, hold your gap, and shed to the back — stop short of the sticks, off the field.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const LB_VIZ: Segment[] = [
  ...FOOTBALL_ARRIVAL,

  // ── First rep (Coach) — LINEBACKER
    { type: "speech", text: "You walk into the box and get everyone lined up. Slow breath. You're the quarterback of this defense.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "You read your keys — the guard, the backfield — diagnosing it before the snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Snap. It's run. You see your key pull and trigger downhill, no hesitation.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You fill your fit, take on the blocker, and keep your shoulders square.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You shed, find the back, and run through the tackle — wrap up, drive your feet, finish.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop for a short gain. You pop up, signal the call, and reset the front. One rep at a time — that's how it goes all night.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — LINEBACKER (ROLE_CONTENT scenes — "Be the quarterback of the D.")
    { type: "speech", text: "See yourself be the quarterback of the D.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You read your keys and fill your fit downhill, and on pass you cover with your eyes — never fooled, every snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Before the snap you get everyone lined up, and when the ball's loose you run and hit — square, wrapped, finished.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "They show run and try to fool you with play action, the crowd roaring. You stay disciplined. You read your key, see the pull is a fake, drop into your zone, eyes on the quarterback, and break on the throw — pass broken up, third down stop.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const DB_VIZ: Segment[] = [
  ...FOOTBALL_ARRIVAL,

  // ── First rep (Coach) — DEFENSIVE BACK
    { type: "speech", text: "You line up over your man, press alignment, eyes on his hips. Slow breath. This is your island.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "You trust your technique — patient feet, eyes on the man, not the noise.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Snap. He releases. You mirror him, stay in phase, hip to hip down the field.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "He breaks. You plant, drive on the ball, and close the cushion.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The ball comes. You find it late through his hands, and you break it up clean.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Incomplete. You flip your hips, jog back to the line, and lock in again. One rep at a time — that's how it goes all night.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — DEFENSIVE BACK (ROLE_CONTENT scenes — "Lock down your island.")
    { type: "speech", text: "See yourself lock down your island.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You trust your technique, keep your eyes on your man, and drive on the ball — patient, in phase, every snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "And if one gets caught on you, short memory — next rep, you're right back on him. When it's run, you come up and make the tackle in space, square and sure.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "Their best receiver, the game on the line, the throw going up to your side. You don't gamble. You stay in phase, eyes back to find it, high-point the ball at the catch point, and knock it away — incomplete, your island holds.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];
