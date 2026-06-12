// Golf pregame VIZ blocks (FV-265) — the per-profile visualization runs, the
// analog of FORWARD/DEFENSE/GOALIE_VIZ (segments.ts), GUARD/WING/BIG_VIZ
// (segments-basketball.ts), and PITCHER/CATCHER/INFIELD/OUTFIELD_VIZ
// (segments-baseball.ts).
//
// Every golf pregame cell is structurally:
//   [...OPENING, ...<PROFILE>_VIZ, <cell-specific hardMoment>, ...CLOSING]
// OPENING and CLOSING (breath, reset plan, prayer, send-off) are the shared
// faith/structure clips — REUSED from ./segments.ts as-is, not re-authored.
//
// Profiles: Bomber / Ball-Striker / Scrambler (FV-264 taxonomy,
// docs/golf-module-map.md §1-§2). Golf is non-positional — the engine's
// "position" dimension maps to player profile. The sensory arrival run
// (GOLF_ARRIVAL) is shared across the three profiles; the first-tee rehearsal +
// role rehearsal diverge per profile (§2 ROLE_CONTENT scenes). Authored by the
// content trio + golf-expert under lead orchestration. Imported with the ".ts"
// extension to match the node --strip-types audio generator convention.
//
// Phase marks reuse the engine's legacy keys ("rink" = sensory arrival,
// "firstShift" = first competitive rep) exactly as baseball/basketball do, so
// the manifest timeline logic is sport-agnostic.

import type { Segment } from "./types";
import { VISUALIZATION_INSTRUCTIONS } from "./instructions.ts";

// ── Shared sensory arrival (Mentor) — GOLFER SENSORY (shared across profiles) ──
const GOLF_ARRIVAL: Segment[] = [
    { type: "speech", text: "Keep your eyes closed. See yourself walking to the first tee.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "You hear the range behind you — the clean strike of a ball, then quiet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "Hear the morning settle. A cart somewhere far off, your group talking low.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You feel the cool air, the dew still on the grass.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "Feel the grip of the club settle into your hands.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: "Feel the strap of your bag, light on your shoulder.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You tell yourself, You belong here.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.25 },
];

export const BOMBER_VIZ: Segment[] = [
  ...GOLF_ARRIVAL,

  // ── First tee (Coach) — BOMBER
    { type: "speech", text: "You step onto the first tee and tee it high. Slow breath. The fairway is wide, and it's yours.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "Into your swing. Free, full, nothing held back — you've hit this a thousand times.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You catch it flush. The ball climbs and splits the fairway, long and straight.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You feel the strike all the way up the shaft. You walk off the tee in control.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Wedge in for your second. You pick your number, commit, and knock it close. One swing at a time — that's how it goes all day.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — BOMBER (ROLE_CONTENT scenes)
    { type: "speech", text: "See yourself step up and trust it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You pick your line, commit to the number, and make a free, full release — every tee, all day. No steering, no backing off.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "And when you miss — because you will — you take your medicine. You pitch out, take your bogey, and you don't chase it. Next tee, next swing.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next shot.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "A tight driving hole, trouble down both sides, the group watching. You don't overswing and you don't bail out. You pick a smaller target, commit all the way, and trust it — fairway found, still in control.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const BALLSTRIKER_VIZ: Segment[] = [
  ...GOLF_ARRIVAL,

  // ── First tee (Coach) — BALL-STRIKER
    { type: "speech", text: "You step onto the first tee. Pick the smallest target you can find. Slow breath.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "One smooth swing — tempo, balance, nothing forced. You flush it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The ball flies on your line and settles in the short grass, right where you looked.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Second shot, you've got a number. Pick the spot, repeat the swing, stripe the iron.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "It covers the flag, pin high. You walk after it knowing exactly what you did. Stripe it, walk, repeat.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — BALL-STRIKER (ROLE_CONTENT scenes)
    { type: "speech", text: "See yourself flush it, hole to hole.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You pick a small target, make one smooth swing, hit your number, and walk. Fairways and greens, the same swing every time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "And the one loose swing that shows up — you let it go. One shot doesn't touch the rest of the round. You step to the next ball clean.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next shot.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "A long iron to a tucked pin, water short. You don't aim at the flag. You pick the fat of the green, make your smooth swing, and take your two-putt par — precise, patient, nothing forced.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];

export const SCRAMBLER_VIZ: Segment[] = [
  ...GOLF_ARRIVAL,

  // ── First tee (Coach) — SCRAMBLER
    { type: "speech", text: "You step onto the first tee. You see the shot before you hit it. Slow breath.", speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: "Smooth swing, just get it in play — you find the short grass.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Your approach drifts a touch and you miss the green. No problem. This is your ground.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You see the chip, feel the speed, soft hands — the ball checks and trickles to a foot.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You tap in for par. Up and down, the way you always find a way. That's your game.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },

  // ── Role rehearsal (Coach) — SCRAMBLER (ROLE_CONTENT scenes)
    { type: "speech", text: "See yourself find a way to par.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You see the shot and feel the shot. Soft hands, good speed. You get it up and down from anywhere, and you roll the next one pure.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "And when the saves don't fall early, you don't panic. The feel comes back. You keep grinding out the number, one shot at a time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now visualize the next shot.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: "Short-sided in the rough, little green to work with, the round on the line. You don't force the hero shot. You see it, trust your hands, land it soft, and watch it release to gimme range — another save, another par.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
];
