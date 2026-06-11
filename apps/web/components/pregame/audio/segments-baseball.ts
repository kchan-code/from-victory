// Baseball pregame VIZ blocks (FV-94) — the per-position visualization runs,
// the analog of FORWARD/DEFENSE/GOALIE_VIZ (segments.ts) and GUARD/WING/BIG_VIZ
// (segments-basketball.ts).
//
// Every baseball pregame cell is structurally:
//   [...OPENING, ...<POSITION>_VIZ, <cell-specific hardMoment>, ...CLOSING]
// OPENING and CLOSING (breath, reset plan, prayer, send-off) are the shared
// faith/structure clips — REUSED from ./segments.ts as-is, not re-authored.
//
// Positions: Pitcher / Catcher / Infield / Outfield (FV-93 taxonomy). The sensory
// arrival run is shared across the four positions; first-inning + role rehearsal
// diverge per position (FV-93 §2 ROLE_CONTENT scenes). Authored by the content
// trio + baseball-expert under lead orchestration. Imported with the ".ts"
// extension to match the node --strip-types audio generator convention.

import type { Segment } from "./types";
import { VISUALIZATION_INSTRUCTIONS } from "./instructions.ts";

export const PITCHER_VIZ: Segment[] = [
  // ── Enter the ballpark (Mentor) — BALLPLAYER SENSORY (shared)
    { type: "speech", text: "Keep your eyes closed. See yourself walking onto the field.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "You hear the ball popping into leather in warmups.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "Hear the chatter across the infield, a bat in the rack.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You feel the dirt under your cleats.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "Feel your glove on your hand.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "Feel your jersey, light on your shoulders.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You tell yourself, You belong here.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.25 },

  // ── First inning (Coach) — PITCHER
    { type: "speech", text: "You step on the rubber, get your sign, and come set. Slow breath. The mound is yours.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "Into your windup. Smooth, balanced, nothing rushed — you've thrown this a thousand times.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "First pitch. Fastball down the middle, right where you want it. You attack the zone.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "It pops the mitt. Strike one. Your catcher fires it back, and you're already locked on the next one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Curveball, two strikes. You stay tall, trust the grip, and snap it off clean.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "He swings through it. Strike three. One pitch at a time — that's how it goes all night.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — PITCHER (ROLE_CONTENT scenes)
    { type: "speech", text: "See yourself own the mound.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You win the first pitch, every hitter, all night — get ahead, attack the zone, work downhill. Your catcher puts down the sign, and you trust it without a second thought.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "When a hit drops or a guy reaches, you don't carry it. You step back on the rubber, take your breath, and go again. Next pitch, next out.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "Runner on, three-ball count, the lineup's best hitter digging in. You don't try to be perfect. You trust your stuff, hit your spot, and get the soft ground ball — out of the inning, still in command.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const CATCHER_VIZ: Segment[] = [
  // ── Enter the ballpark (Mentor) — BALLPLAYER SENSORY (shared)
    { type: "speech", text: "Keep your eyes closed. See yourself walking onto the field.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "You hear the ball popping into leather in warmups.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "Hear the chatter across the infield, a bat in the rack.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You feel the dirt under your cleats.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "Feel your glove on your hand.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "Feel your jersey, light on your shoulders.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You tell yourself, You belong here.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.25 },

  // ── First inning (Coach) — CATCHER
    { type: "speech", text: "Now visualize the first pitch. You set up behind the plate, give the target low and away.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "The pitch comes. You receive it quiet, stick the borderline strike, and frame it back to the zone.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next one's in the dirt. You drop and block it, keep it in front, and it dies right there.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You catch the clean one, snap it back to the mound, and reset the sign.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Runner takes a lead. You stay low, ready, the whole field in front of you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "He goes. You come up clean, footwork quick, and throw a strike down to the bag.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — CATCHER (ROLE_CONTENT scenes)
    { type: "speech", text: "See yourself run the game back there.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You frame the borderline and steal the strike, you block everything in the dirt, and you call each pitch with conviction.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You control the run game, you keep the staff calm, and you lead from behind the plate.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "Runner on third, contact play on. The ball comes home, you catch it clean, hold the tag, and you make the out.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const INFIELD_VIZ: Segment[] = [
  // ── Enter the ballpark (Mentor) — BALLPLAYER SENSORY (shared)
    { type: "speech", text: "Keep your eyes closed. See yourself walking onto the field.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "You hear the ball popping into leather in warmups.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "Hear the chatter across the infield, a bat in the rack.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You feel the dirt under your cleats.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "Feel your glove on your hand.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "Feel your jersey, light on your shoulders.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You tell yourself, You belong here.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.25 },

  // ── First inning (Coach) — INFIELD
    { type: "speech", text: "The pitcher comes set. You take your ready hop as he releases, weight forward, on the balls of your feet.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "It's hit your way — a two-hopper into the hole. You read the bounce early and get a good hop.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You field it clean, soft hands, the ball into your glove and out, working through it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You set your feet, line up the throw, and let it go with intent across the diamond.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "It beats the runner by a step. One out. You reset and find the ball again.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You exhale, glance to your pitcher, and get back on your toes for the next one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — INFIELD (ROLE_CONTENT scenes)
    { type: "speech", text: "See yourself quiet hands, sure feet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The routine play is your play — you stay down, field it clean, and throw with intent, the same every time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A grounder up the middle, you flip it to the bag, turn two, and the inning is over before it starts.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "A tough in-between hop with the runner going — you stay down, take what the ball gives you, knock it down, and still get your out.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const OUTFIELD_VIZ: Segment[] = [
  // ── Enter the ballpark (Mentor) — BALLPLAYER SENSORY (shared)
    { type: "speech", text: "Keep your eyes closed. See yourself walking onto the field.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "You hear the ball popping into leather in warmups.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "Hear the chatter across the infield, a bat in the rack.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You feel the dirt under your cleats.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "Feel your glove on your hand.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "Feel your jersey, light on your shoulders.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You tell yourself, You belong here.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.25 },

  // ── First inning (Coach) — OUTFIELD
    { type: "speech", text: "You jog out to your spot as the first inning starts, settling in, eyes in on the hitter.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "The first one's hit your way — you read it off the bat and your first step is back.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You take the route, no drifting, square to the ball the whole way.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You catch it at full speed and come up throwing.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You hit the cutoff man clean, right on line.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Loud, ready, you reset for the next pitch.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — OUTFIELD (ROLE_CONTENT scenes)
    { type: "speech", text: "See yourself track it, run it down.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You read it off the bat, take the right route, and catch it at full speed.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You come up and hit the cutoff — then you stay loud, stay ready, locked in through the quiet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "One gets into the gap and tests you — you read it, run it down, and play it clean off the wall to the cutoff.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];
