// Lacrosse pregame VIZ blocks (FV-406, v2 DORMANT) — the per-position
// visualization runs, the analog of FORWARD/DEFENSE/GOALIE_VIZ (segments.ts),
// GUARD/WING/BIG_VIZ (segments-basketball.ts), and QB..DB_VIZ
// (segments-football.ts). Taxonomy = docs/lacrosse-module-map.md (FV-404,
// KC-ratified).
//
// TEN blocks — TWO per position, one per FV-404 §2 library theme (the ratified
// two-libraries rule): the athlete's selectable viz axis, matching the FV-405
// script book (docs/scripts/lacrosse.md) slug-for-slug. Prose here is seeded
// VERBATIM from the FV-405 book, which is the SOURCE OF TRUTH — the generator
// reads book prose (and structure — FV-302) at render time via loadBookProse,
// so these strings are the in-sync scaffold, not an independent voice.
//
// Every block carries the book's 17-line flagship shape: a 7-line sensory
// arrival + a first-rep run + the library-theme rehearsal. The arrival varies
// per position (a pole grips a long pole; a goalie feels crease dirt and a
// chest pad) — built via lacrosseArrival() so the variants stay structurally
// identical.
//
// Phase marks reuse the engine's legacy keys ("rink" = sensory arrival,
// "firstShift" = first competitive rep) exactly as baseball/basketball/golf/
// football do, so the manifest timeline logic is sport-agnostic. The book
// does not carry marks — TS owns the engineering metadata.
//
// Every VIZ is the POSITIVE rehearsal — a great rep going right. All contact
// is competitive technique (footwork, leverage, finishing through a check);
// no injury, no playing hurt.
//
// SCOPE: boys'/men's FIELD lacrosse only (FV-404 §6 — girls'/box lacrosse are
// separate future modules, never blended into this taxonomy).

import type { Segment } from "./types";
import { VISUALIZATION_INSTRUCTIONS } from "./instructions.ts";

// ── Shared sensory arrival (Mentor) — position-variant lines 4–6 ────────────
function lacrosseArrival(opts: {
  /** Line 4 — what the feet feel ("the field" / "the crease dirt"). */
  ground: string;
  /** Line 5 — what the gloves close around ("the shaft" / "the long pole"). */
  grip: string;
  /** Line 6 — the gear settling ("your helmet settle, the chin strap snug"). */
  gear: string;
}): Segment[] {
  return [
    { type: "speech", text: "Keep your eyes closed. See yourself walking onto the field.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "You hear the ball snapping into pockets in warmups.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1 },
    { type: "speech", text: "Hear cleats on the turf, a coach calling out the lines.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: `You feel ${opts.ground} under your feet.`, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: `Feel your gloves close around ${opts.grip}.`, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.2 },
    { type: "speech", text: `Feel ${opts.gear}.`, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You tell yourself, You belong here.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.25 },
  ];
}

const FIELD_ARRIVAL = { ground: "the field", grip: "the shaft", gear: "your helmet settle, the chin strap snug" };
const POLE_ARRIVAL = { ground: "the field", grip: "the long pole", gear: "your helmet settle, the chin strap snug" };
const CAGE_ARRIVAL = { ground: "the crease dirt", grip: "the shaft", gear: "your chest pad settle, the helmet snug" };

// ── Theme-run tail (lines 8–17): first rep (marked) + library rehearsal ─────
// Book pause interleave after the arrival: 0.25 / 2 ×7 / 0.8 / 2 (trailing).
function lacrosseThemeRun(lines: [string, string, string, string, string, string, string, string, string, string]): Segment[] {
  const [l8, l9, l10, l11, l12, l13, l14, l15, l16, l17] = lines;
  return [
    { type: "speech", text: l8, speed: 1.1, mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 0.25 },
    { type: "speech", text: l9, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: l10, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: l11, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: l12, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: l13, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: l14, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: l15, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: l16, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 0.8 },
    { type: "speech", text: l17, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
  ];
}

// ── Attack — Library A: "Beat your man" (dodge & finish) ─────────────────────
export const ATTACK_BEAT_YOUR_MAN_VIZ: Segment[] = [
  ...lacrosseArrival(FIELD_ARRIVAL),
  ...lacrosseThemeRun([
    "You set up at X, ball in your stick. Slow breath. Your matchup is on you, and that's exactly how you want it.",
    "You split dodge from X, get your feet past him, and roll back the moment he overplays.",
    "You turn the corner at GLE, hands free, and finish low to high — far pipe.",
    "The net snaps. You beat him clean, and everyone on the field knows it.",
    "Next possession, the two-man game — you slip the pick, turn the corner, and bury it through contact.",
    "See yourself take your man, again and again.",
    "Question-mark from up top, bull dodge from X, face dodge through the alley — you get to your spots, absorb the check, and finish with your hands free.",
    "And when the slide comes early and the lane closes, you don't force it. You pull it out, move it, and take him again next time.",
    "Now visualize the next play.",
    "Late game, they put their best pole on you and shade the double. You beat the shut-off, catch on the move, and finish before the slide arrives — one dodge, one finish, still yours.",
  ]),
];

// ── Attack — Library B: "See the field" (feed & off-ball) ────────────────────
export const ATTACK_SEE_THE_FIELD_VIZ: Segment[] = [
  ...lacrosseArrival(FIELD_ARRIVAL),
  ...lacrosseThemeRun([
    "You set up at X, ball in your stick. Slow breath. You see the whole offense in front of you.",
    "You drive hard from X and feel the defense tilt — the slide is coming.",
    "You draw the pole all the way in, then snap the feed to the crease.",
    "Your man catches and finishes in one touch. You made that goal happen.",
    "Next trip, you skip it to the weakside shooter for a catch-and-shoot — right on his hands, top shelf.",
    "See yourself run the offense.",
    "You hit the cutter coming off the crease, you come off a pick off-ball and bury the catch-and-shoot, you one-more it on the man-up until the open man has it.",
    "And when the defense takes the feed away, you don't press. You settle it, wind it, and run the set on time.",
    "Now visualize the next play.",
    "Their clear breaks out and you ride hard from the front — you force the errant pass, win it back, and find the open man before their defense can breathe.",
  ]),
];

// ── Midfield — Library A: "Push the ball" (transition & dodge) ───────────────
export const MIDFIELD_PUSH_THE_BALL_VIZ: Segment[] = [
  ...lacrosseArrival(FIELD_ARRIVAL),
  ...lacrosseThemeRun([
    "You break the midline on the fly, fresh legs. Slow breath. The middle of the field is yours.",
    "A ground ball squirts loose at the midline. You get low, scoop it clean through traffic, and push.",
    "You're up the field in three strides, drawing a pole, numbers ahead.",
    "You hit the trailer, fill the lane, and the break ends in the back of the net.",
    "Next shift, you dodge from up top, split the short-stick, get downhill, and rip it far pipe off the run.",
    "See yourself push the pace.",
    "Off the faceoff wing you take it end to end, you invert and dodge the pole from X, you sub on fresh and go before the defense sets.",
    "And when the break isn't there, you don't force the hero pass. You slow it down, settle it, and let the offense work.",
    "Now visualize the next play.",
    "Tie game, you trail the break — you catch the swing pass, step into a time-and-room shot, and put it away like you've done it a thousand times.",
  ]),
];

// ── Midfield — Library B: "Cover both ends" (two-way motor) ──────────────────
export const MIDFIELD_COVER_BOTH_ENDS_VIZ: Segment[] = [
  ...lacrosseArrival(FIELD_ARRIVAL),
  ...lacrosseThemeRun([
    "You pick up your man at the midline as the ball turns over. Slow breath. Both ends of this field belong to you.",
    "Their middie dodges and you slide over, break up the lane, and force the bad feed.",
    "The ball hits the turf and you're on it — man-ball, scoop, protect it.",
    "You start the break the other way and hit the outlet before their ride can set.",
    "Deep in the fourth, gassed at the end of a long defensive possession, you dig in, keep your feet moving, and get the stop.",
    "See yourself own both ends.",
    "You ride your man hard on the clear and force the turnover, you win the wing battle at the faceoff, you match their best middie and keep him topside all night.",
    "And when your legs are screaming, you don't cheat the backcheck. One more sprint, take away the middle, then get off and recover.",
    "Now visualize the next play.",
    "Their fast break is coming downhill — you backcheck through the middle, force it wide, and turn their best chance into a low-angle nothing shot.",
  ]),
];

// ── Defense — Library A: "Lock him down" (on-ball D & slides) ────────────────
export const DEFENSE_LOCK_HIM_DOWN_VIZ: Segment[] = [
  ...lacrosseArrival(POLE_ARRIVAL),
  ...lacrosseThemeRun([
    "You pick up their attackman at X, pole out in front. Slow breath. This matchup is yours all night.",
    "He drives topside and you move your feet, stay in his hands, and force him back behind the cage.",
    "He tries again — you break down, throw one clean poke, and knock the ball off his bottom hand.",
    "You take away his strong hand, ride him off his spot, and the possession dies with him standing at X.",
    "The slide call comes and you're there on time — you wall up, force the bad shot, and your goalie eats it easy.",
    "See yourself erase your man.",
    "You approach under control, no wild trail check, keep him topside where your help lives, and quarterback the slide package loud enough for the whole defense to hear.",
    "And when he does beat you a step, you don't panic and you don't chase the highlight check. You recover to his hands, trust the slide, and win the next one.",
    "Now visualize the next play.",
    "Last two minutes, one-goal game, their best dodger isolates on you — you move your feet, force him to his weak hand, deny the shot he wants, and the stop is yours.",
  ]),
];

// ── Defense — Library B: "Take it the other way" (transition & GB — LSM lens) ─
export const DEFENSE_TAKE_IT_THE_OTHER_WAY_VIZ: Segment[] = [
  ...lacrosseArrival(POLE_ARRIVAL),
  ...lacrosseThemeRun([
    "You line up on the faceoff wing, long pole in your gloves. Slow breath. The ground ball is about to be yours.",
    "The ball spills to the wing and you win it in traffic — low hips, two hands, scoop through.",
    "You protect it through the check, look up, and the field opens in front of you.",
    "You push past midfield, draw a short stick, and feed the break — shot, goal, started by your stick.",
    "Next possession you throw a lift check at the perfect moment, strip it clean, and go the other way with it.",
    "See yourself turn defense into offense.",
    "You jump the passing lane, you clean up the clear under a hard ride, you stand a middie up in transition and force the reset — your pole is a weapon at both ends.",
    "And when the numbers aren't there, you don't force the carry. You find the outlet, move it smart, and get back to your end.",
    "Now visualize the next play.",
    "A caused turnover in your own end — you scoop it, beat the first rider, carry it over midfield with your head up, and hit the open middie in stride for the finish.",
  ]),
];

// ── FOGO — Library A: "Win the clamp" (at the X) ─────────────────────────────
export const FOGO_WIN_THE_CLAMP_VIZ: Segment[] = [
  ...lacrosseArrival(FIELD_ARRIVAL),
  ...lacrosseThemeRun([
    "You walk to the X and set your feet at the dot. Slow breath. This draw is one rep, and it's yours.",
    "Down, set — the whistle blows and your clamp fires first.",
    "You beat him to the ball and rake it back to your wing side, clean.",
    "Your wing scoops it, and your offense has the ball because of you.",
    "Next draw he counters fast, so you adjust — over the top, win the pull, exit to open field with it on your stick.",
    "See yourself win the dot.",
    "You read his tendency between draws, get lower than him on the whistle, win the leverage battle, and come out clean, draw after draw.",
    "And when he wins the clamp, you don't quit on the rep. You tie him up, let your wing win the fifty-fifty, and reset for the next whistle.",
    "Now visualize the next play.",
    "Fourth quarter, one-goal game, the big draw — quick hands on the whistle, clamp, pop it to space, scoop, and your team has the ball when it matters most.",
  ]),
];

// ── FOGO — Library B: "Win the wing / GB" (after the draw) ───────────────────
export const FOGO_WIN_THE_WING_VIZ: Segment[] = [
  ...lacrosseArrival(FIELD_ARRIVAL),
  ...lacrosseThemeRun([
    "You crouch at the dot with your wings set. Slow breath. Whatever happens on this whistle, the ball comes out yours.",
    "The whistle blows, the clamp battle stalls, and the ball squirts into the scrum.",
    "You stay on it — low hips, feet churning, and you come out of the pile with the ball in your stick.",
    "You hit your outlet, get off the field clean, and let the offense run.",
    "Next draw you win it forward, scoop it in stride, and push it yourself — the defense isn't set, and you feed the fast break before they can slide.",
    "See yourself win the battle after the whistle.",
    "You win the wing exchange with your middie, you battle the fifty-fifty until it's yours, you draw the violation and take the free possession.",
    "And after a loss at the dot, you reset fast — next whistle, quicker hands, and the last draw stays behind you.",
    "Now visualize the next play.",
    "The ball is loose on the wing with their pole bearing down — you get there first, body between him and the ball, scoop through clean, and turn one ground ball into the possession that becomes a goal.",
  ]),
];

// ── Goalie — Library A: "Make the save" (in the cage) ────────────────────────
export const GOALIE_MAKE_THE_SAVE_VIZ: Segment[] = [
  ...lacrosseArrival(CAGE_ARRIVAL),
  ...lacrosseThemeRun([
    "You step into the cage and set your angle. Slow breath. The next shot is all that exists.",
    "Their shooter winds up from twelve yards and you track it all the way off the stick.",
    "Your hands drive to the ball — stick-side high, and you smother it.",
    "Save. You hear your defense exhale, and your eyes are already up the field.",
    "Next possession, a low bouncer through traffic — you find it late, drop the stick, and kick it out to the corner, no rebound.",
    "See yourself own the cage.",
    "You set your angle early, square up to every shot, take away the far pipe, and beat the step-down shooters with your hands, quarter after quarter.",
    "And when one gets by you, you don't replay it. You set your feet, call out the defense, and take the next shot as its own.",
    "Now visualize the next play.",
    "Man-down, point-blank on the crease — you hold your ground, force his hands, make the desperation save, and steer the rebound to the corner where your pole cleans it up.",
  ]),
];

// ── Goalie — Library B: "Start the clear" (outlet & lead) ────────────────────
export const GOALIE_START_THE_CLEAR_VIZ: Segment[] = [
  ...lacrosseArrival(CAGE_ARRIVAL),
  ...lacrosseThemeRun([
    "You set up in the cage and call out the defense — who's hot, who has two. Slow breath. This defense runs on your voice.",
    "The shot comes and you make the save, ball socked away in your stick.",
    "Your eyes are up before the whistle — the break middie is streaking up the wing.",
    "You hit him in stride. Save and go, and four seconds later it's a scoring chance at the other end.",
    "Next stop, their ride comes hard — you stay patient behind the cage, find the open man through the pressure, and the clear goes off clean.",
    "See yourself run the field from the crease.",
    "You direct the slide package before the shot, you control every rebound to the corner, you quarterback the clear past midfield — the whole field organized from your voice.",
    "And when a clear gets rode and turned, you don't go quiet. You reset the defense, call the next slide, and take the next save.",
    "Now visualize the next play.",
    "First save of the game, early — warm hands, clean catch, one crisp outlet to the wing, and the whole defense settles because you did.",
  ]),
];
