// Lacrosse pregame compositional clips (FV-406, v2 DORMANT) — 10 library VIZ
// clips (2 per position, FV-404 §2) + 50 hard-moment cells, wired from the
// KC-ratified FV-404 taxonomy
// (docs/lacrosse-module-map.md). The lacrosse analog of clips-football.ts /
// clips-swimming.ts. Kept in a sibling file to stay out of the clips.ts hot
// file. Registered into CLIP_SCRIPTS via `...LACROSSE_PREGAME_CLIP_SCRIPTS`
// in clips.ts.
//
// PRE-BOOK STRUCTURAL SEEDS: the FV-405 script book (docs/scripts/lacrosse.md,
// authored in parallel by content-curator + lacrosse-expert +
// sports-psychologist + youth-pastor) is the SOURCE OF TRUTH for this prose.
// The generator reads book prose (and structure — FV-302) at render time via
// loadBookProse, so these strings are the scaffold the book overrides, seeded
// from the module map's per-cell manifestation lines in the de-corned 6-line
// HM shape (docs/pregame-script-style.md Part 1):
//   1. Now rehearse the hard moment.            [0.4s]
//   2. <Scene — present-tense, sport-true.>     [1.5s]
//   3. <Observed body detail.> The thought hits: <intrusive self-talk>. [2s]
//   4. Now the reset. Return to your anchor.    [2s — golf/baseball value]
//   5. <Reframe — short, grounded, standardized motif where one exists.> [2s]
//   6. Next <rep>, <concrete sport-true actions>. [2s]
// Only the three clinically gated yips cells carry a 7th worth-truth line
// (the baseball lose-command register). Slug scheme: hm-lax-{position}-{frag}
// (lacrosse owns lax- / hm-lax- / viz-lax- — FV-404 Appendix). Positions:
// attack / midfield / defense / fogo / goalie. Audio render is DEFERRED (the
// sport is DORMANT) — this file is the TTS INPUT, no MP3s yet.
//
// CLINICAL GATES (FV-404 §4 — the FV-119 pattern):
//   ⚠⚠ WITHHELD (yips-class, motor-anxiety — authored here, absent from the
//   Step-02 picker until clinical sign-off; the "I lose my touch." umbrella
//   key is NOT in LACROSSE_CONFIG.adversities and no roleAdversities carries
//   it, so all three are fully unreachable from the picker):
//     hm-lax-fogo-clamp-yips    — the clamp deserts you
//     hm-lax-goalie-save-yips   — the save deserts you
//     hm-lax-defense-clear-yips — the throwing yips (the routine clear)
//   ⚠ SHIP-GATED (live + selectable; the reframe is sports-psychologist-
//   authored and advisor-routed at FV-405): attack shut-off, the removal
//   cells (goalie-pulled, fogo-off-the-dot, attack/defense benched),
//   goalie-soft-goal, defense dodged, fogo-lose-draws.
//   Never name "the yips". The ★ identity phrases from the map render only
//   as intrusive thoughts to reject ("The thought hits: ..."), never as labels.
//
// SCOPE: boys'/men's FIELD lacrosse only (FV-404 §6).

import type { AudioScript, Segment } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import {
  ATTACK_BEAT_YOUR_MAN_VIZ,
  ATTACK_SEE_THE_FIELD_VIZ,
  MIDFIELD_PUSH_THE_BALL_VIZ,
  MIDFIELD_COVER_BOTH_ENDS_VIZ,
  DEFENSE_LOCK_HIM_DOWN_VIZ,
  DEFENSE_TAKE_IT_THE_OTHER_WAY_VIZ,
  FOGO_WIN_THE_CLAMP_VIZ,
  FOGO_WIN_THE_WING_VIZ,
  GOALIE_MAKE_THE_SAVE_VIZ,
  GOALIE_START_THE_CLEAR_VIZ,
} from "./segments-lacrosse.ts";

// Same target as CLIP_LOUDNORM_FILTER in clips.ts. Defined locally to avoid a
// circular import (clips.ts imports LACROSSE_PREGAME_CLIP_SCRIPTS from here).
const LACROSSE_LOUDNORM_FILTER = "loudnorm=I=-16:TP=-1.5:LRA=11";

// ── Lacrosse VIZ clips — two per position (FV-404 §2 two-libraries rule) ─────
// Slugs match the FV-405 book exactly: viz-lax-<position>-<theme>. There is
// deliberately NO flagship viz-lax-<position> clip — the two library themes
// ARE the selectable viz axis; at go-live they wire into POSITIVE_PLAYS
// (positive-plays.ts) as each position's play list (dormant precedent: no
// entries until the audio renders, so the picker step stays gated off).

function lacrosseVizScript(slug: string, segments: readonly Segment[]): AudioScript {
  return {
    slug,
    voice: "ash",
    instructions: SCRIPT_INSTRUCTIONS,
    speed: 1.1,
    postFilter: LACROSSE_LOUDNORM_FILTER,
    segments: [...segments],
  };
}

export const CLIP_VIZ_LAX_ATTACK_BEAT_YOUR_MAN_SCRIPT = lacrosseVizScript("viz-lax-attack-beat-your-man", ATTACK_BEAT_YOUR_MAN_VIZ);
export const CLIP_VIZ_LAX_ATTACK_SEE_THE_FIELD_SCRIPT = lacrosseVizScript("viz-lax-attack-see-the-field", ATTACK_SEE_THE_FIELD_VIZ);
export const CLIP_VIZ_LAX_MIDFIELD_PUSH_THE_BALL_SCRIPT = lacrosseVizScript("viz-lax-midfield-push-the-ball", MIDFIELD_PUSH_THE_BALL_VIZ);
export const CLIP_VIZ_LAX_MIDFIELD_COVER_BOTH_ENDS_SCRIPT = lacrosseVizScript("viz-lax-midfield-cover-both-ends", MIDFIELD_COVER_BOTH_ENDS_VIZ);
export const CLIP_VIZ_LAX_DEFENSE_LOCK_HIM_DOWN_SCRIPT = lacrosseVizScript("viz-lax-defense-lock-him-down", DEFENSE_LOCK_HIM_DOWN_VIZ);
export const CLIP_VIZ_LAX_DEFENSE_TAKE_IT_THE_OTHER_WAY_SCRIPT = lacrosseVizScript("viz-lax-defense-take-it-the-other-way", DEFENSE_TAKE_IT_THE_OTHER_WAY_VIZ);
export const CLIP_VIZ_LAX_FOGO_WIN_THE_CLAMP_SCRIPT = lacrosseVizScript("viz-lax-fogo-win-the-clamp", FOGO_WIN_THE_CLAMP_VIZ);
export const CLIP_VIZ_LAX_FOGO_WIN_THE_WING_SCRIPT = lacrosseVizScript("viz-lax-fogo-win-the-wing", FOGO_WIN_THE_WING_VIZ);
export const CLIP_VIZ_LAX_GOALIE_MAKE_THE_SAVE_SCRIPT = lacrosseVizScript("viz-lax-goalie-make-the-save", GOALIE_MAKE_THE_SAVE_VIZ);
export const CLIP_VIZ_LAX_GOALIE_START_THE_CLEAR_SCRIPT = lacrosseVizScript("viz-lax-goalie-start-the-clear", GOALIE_START_THE_CLEAR_VIZ);

// Grouped for the export + the coverage test (2 per position, library order A/B).
const LACROSSE_VIZ_CLIP_SCRIPTS: AudioScript[] = [
  CLIP_VIZ_LAX_ATTACK_BEAT_YOUR_MAN_SCRIPT,
  CLIP_VIZ_LAX_ATTACK_SEE_THE_FIELD_SCRIPT,
  CLIP_VIZ_LAX_MIDFIELD_PUSH_THE_BALL_SCRIPT,
  CLIP_VIZ_LAX_MIDFIELD_COVER_BOTH_ENDS_SCRIPT,
  CLIP_VIZ_LAX_DEFENSE_LOCK_HIM_DOWN_SCRIPT,
  CLIP_VIZ_LAX_DEFENSE_TAKE_IT_THE_OTHER_WAY_SCRIPT,
  CLIP_VIZ_LAX_FOGO_WIN_THE_CLAMP_SCRIPT,
  CLIP_VIZ_LAX_FOGO_WIN_THE_WING_SCRIPT,
  CLIP_VIZ_LAX_GOALIE_MAKE_THE_SAVE_SCRIPT,
  CLIP_VIZ_LAX_GOALIE_START_THE_CLEAR_SCRIPT,
];

// ── Hard-moment cell factory ─────────────────────────────────────────────────
// All 50 cells share the de-corned 6-line structure (7 lines for the gated
// yips cells). The factory keeps the engineering metadata (marks, instructions,
// pauses) uniform so the FV-405 book's in-sync override maps 1:1 per line.

type LacrosseHmSeed = {
  slug: string;
  /** Line 2 — the scene. */
  scene: string;
  /** Line 3 — observed body detail + "The thought hits: ..." framing. */
  feel: string;
  /** Line 5 — the reframe (standardized motif where one exists). */
  reframe: string;
  /** Line 6 — the concrete next-rep cue. */
  next: string;
  /** Optional 7th worth-truth line — GATED yips cells ONLY (FV-404 §4). */
  worth?: string;
};

function lacrosseHmScript(seed: LacrosseHmSeed): AudioScript {
  const segments: AudioScript["segments"] = [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: seed.scene, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: seed.feel, speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: seed.reframe, speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: seed.next, speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
  ];
  if (seed.worth) {
    segments.push(
      { type: "speech", text: seed.worth, speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
      { type: "silence", durationSec: 2 },
    );
  }
  return {
    slug: seed.slug,
    voice: "ash",
    instructions: SCRIPT_INSTRUCTIONS,
    speed: 1.1,
    postFilter: LACROSSE_LOUDNORM_FILTER,
    segments,
  };
}

// ── Attack — 9 cells (drops `dodged`; failed-clear → rode-out) — FV-404 §3 ──

const ATTACK_HM_SEEDS: LacrosseHmSeed[] = [
  {
    slug: "hm-lax-attack-turnover",
    scene: "You force the dodge into the double. Two poles collapse, and the ball pops loose off your gloves. They scoop it and it is gone the other way.",
    feel: "Your stick feels heavy and your feet stop under you as the play runs away. The thought hits: I can't be trusted with the ball.",
    reframe: "That turnover is over and it is already down the field. It does not follow you into the next possession.",
    next: "Next touch, move it early — take the open look, make the simple feed, and let the offense breathe.",
  },
  {
    // ⚠ SHIP-GATED reframe (FV-404 §4 HIGH — the purest points-identity wound).
    slug: "hm-lax-attack-shut-off",
    scene: "Their pole face-guards you from the whistle. No touches, no looks. A full quarter goes by and the offense runs five-on-five without you.",
    feel: "Your hands squeeze the shaft with nothing to do, and your eyes keep checking the clock. The thought hits: I'm invisible — I'm nothing out here.",
    reframe: "He took your touches for a quarter. He did not take your game, and a shut-off means they fear it.",
    next: "Next possession, make him work — set the pick, seal for the cutter, ride hard on the clear. Off-ball wins are still wins.",
  },
  {
    slug: "hm-lax-attack-penalty",
    scene: "You shove him in the back on the ride, right in front of the official. Flag down. You jog to the box and your team goes man-down.",
    feel: "Your face is hot under the helmet on the walk to the box. The thought hits: I cost us the possession.",
    reframe: "The whistle happened. Learn from it, then compete clean.",
    next: "When you step back on, play the next possession straight up — ride with your feet, not your hands.",
  },
  {
    slug: "hm-lax-attack-coach-yells",
    scene: "You force a dodge into a slide instead of moving it, and Coach pulls you for a shift. You hear your name loud from the sideline.",
    feel: "Your jaw tightens and you replay the dodge on a loop. The thought hits: Coach doesn't trust my hands.",
    reframe: "The volume is not the verdict. Take the correction. Leave the shame.",
    next: "Next shift, show him the read — dodge when it is there, move it when it is not. Your hands are still yours.",
  },
  {
    // ⚠ SHIP-GATED reframe (FV-404 §4 HIGH — removal cell).
    slug: "hm-lax-attack-benched",
    scene: "Cold stretch — nothing falling. Coach subs you off, and you watch from the sideline while another line runs your offense.",
    feel: "Your gloves hang at your sides and you stand a step apart from the bench. The thought hits: I lost my spot.",
    reframe: "The sideline has your body for a stretch. It does not have your mind.",
    next: "Stay in the game from the bench — track their slides, find the matchup you want, and be ready when your number comes back.",
  },
  {
    slug: "hm-lax-attack-nervous",
    scene: "Warm-ups before the big one. Their lockdown pole is across the field, and there are college coaches standing on the hill.",
    feel: "Your first few cradles feel tight and your mouth is dry. The thought hits: what if he erases me today.",
    reframe: "These nerves are energy, not danger. Let them sharpen you.",
    next: "First possession, do one simple thing at full speed — one hard cut, one clean catch. The game will come to your hands.",
  },
  {
    slug: "hm-lax-attack-start-slow",
    scene: "First quarter and nothing is clean. Your first shot sails high, your feed skips low, and every touch feels a beat off.",
    feel: "You grip the shaft tighter with every miss. The thought hits: I'm pressing already.",
    reframe: "A cold start is a few touches, not the game. Your hands are still yours.",
    next: "Shrink the next touch — one good catch, one on-time pass, one shot picked before you wind up. Rhythm follows simple.",
  },
  {
    slug: "hm-lax-attack-fall-behind-early",
    scene: "Down three before the first quarter ends. Every ride feels urgent, and you can feel yourself wanting to force every dodge to get it all back.",
    feel: "Your legs want to go a hundred miles an hour and your brain is doing scoreboard math. The thought hits: I have to get these back myself.",
    reframe: "That run is over. Get one good possession, then get the next one.",
    next: "Next possession, take what the defense gives — the open feed counts the same as the hero dodge.",
  },
  {
    slug: "hm-lax-attack-rode-out",
    scene: "You are the front of the ride, then the clear comes back to you under pressure. Their pole runs you down and you cough it up right where you caught it.",
    feel: "Your feet tangle as the ball comes loose, and you watch them go the other way. The thought hits: I gave it right back.",
    reframe: "That clear is dead and done. The ride runs both ways — the next loose ball is still anyone's.",
    next: "Next clear, want the ball anyway — show early, catch over your back shoulder, and move it before the pressure lands.",
  },
];

// ── Midfield — 10 cells (the complete block) — FV-404 §3 ────────────────────

const MIDFIELD_HM_SEEDS: LacrosseHmSeed[] = [
  {
    slug: "hm-lax-midfield-turnover",
    scene: "You try to split two guys in transition and get stripped, or the cross-field feed you force gets picked at midfield. Either way, it is going the other way.",
    feel: "Your legs keep running but your head drops for a step. The thought hits: I tried to do too much.",
    reframe: "That turnover is over. Doing your job is enough — it always was.",
    next: "Next touch, make the simple play first — ground ball, outlet, sprint to your spot. Let the game open up on its own.",
  },
  {
    slug: "hm-lax-midfield-dodged",
    scene: "You are the short-stick they hunt. Their best middie isolates you up top, hits one hard split, and beats you topside for a shot — right in front of your bench.",
    feel: "Your hips felt a half-second late and you heard the bench go quiet. The thought hits: I got cooked in front of everyone.",
    reframe: "He won that rep. He does not own the next one.",
    next: "Next matchup, sit lower and trust your approach — angle him wide, stay on his gloves, and force the help-side look.",
  },
  {
    slug: "hm-lax-midfield-penalty",
    scene: "Your slide is late so you reach — slash across his arms. Flag. Thirty seconds in the box and their extra-man unit trots on.",
    feel: "You watch the EMO set up from the box, helmet in your hands. The thought hits: if they score, that's my man-down.",
    reframe: "The whistle happened. Learn from it, then compete clean.",
    next: "Next slide, leave a step earlier so your feet make the play — take away the shot with position, not with your stick.",
  },
  {
    slug: "hm-lax-midfield-shut-off",
    scene: "They put a pole on you up top and take your dodge away. Every time you catch it, he is in your gloves and you have nowhere to go downhill.",
    feel: "Your first step keeps getting cut off and the frustration builds in your grip. The thought hits: they took my whole game away.",
    reframe: "They took one look away. They did not take your legs or your motor.",
    next: "Move without it — sprint the exchange, pick for the shorty matchup, push transition where no pole can follow you.",
  },
  {
    slug: "hm-lax-midfield-failed-clear",
    scene: "End of a long defensive possession and you are gassed. The outlet comes to you anyway, and your clearing pass dies in the ride. Fast break the other way.",
    feel: "Your lungs are burning and your legs feel like sandbags. The thought hits: no legs, no clear — I've got nothing left.",
    reframe: "That clear is over. Tired is a condition, not a verdict — your next honest sprint still counts.",
    next: "Next clear, buy a beat — move it to the open man early, or carry it hard for three steps and let the angles open.",
  },
  {
    slug: "hm-lax-midfield-coach-yells",
    scene: "Coach subs you off at the box for the offensive specialist, again, and barks about your spacing on the way past.",
    feel: "You strip your gloves slow and stare at the turf. The thought hits: I'm just a legs guy to him.",
    reframe: "The volume is not the verdict. Take the correction. Leave the shame.",
    next: "Next shift, get your motor going where he can see it — first one back on defense, first one to the ground ball.",
  },
  {
    slug: "hm-lax-midfield-benched",
    scene: "The rotation tightens and your line stops going over the boards. You get short-sticked out of the run and nobody calls your name.",
    feel: "You keep your helmet on so nobody sees your face. The thought hits: I lost the run.",
    reframe: "The sideline has your body for a stretch. It does not have your mind.",
    next: "Be ready, not bitter — stay warm, watch their middies for tendencies, and make your next shift impossible to sit.",
  },
  {
    slug: "hm-lax-midfield-nervous",
    scene: "You are first middie out tonight — both ends, your motor on display from the opening whistle.",
    feel: "Your stomach is tight on the sideline and your legs feel buzzy. The thought hits: what if I'm gassed by the second quarter.",
    reframe: "These nerves are energy, not danger. Let them sharpen you.",
    next: "First shift, spend it all — sprint on, sprint off. The legs recharge. The motor is the job, and it is yours.",
  },
  {
    slug: "hm-lax-midfield-start-slow",
    scene: "Flat legs early. You are a step behind your man on defense and a step late to every ground ball at both ends.",
    feel: "Everything feels one gear down and you notice yourself jogging where you usually sprint. The thought hits: I have to wake up before this becomes a hole.",
    reframe: "A slow start is a start. Get your motor going one sprint at a time.",
    next: "Next shift, pick one all-out play — one ground ball run through at full speed — and let it drag the rest of your game up with it.",
  },
  {
    slug: "hm-lax-midfield-fall-behind-early",
    scene: "Down early, and the runner in you wants to answer the whole deficit yourself — end to end, every possession, both ways.",
    feel: "Your motor redlines and your decisions speed up past your feet. The thought hits: I have to fix this whole game myself.",
    reframe: "That run is over. Get one stop, then get one goal.",
    next: "Play the next sixty seconds, not the scoreboard — win your matchup, win your wing, and let the game come back one shift at a time.",
  },
];

// ── Defense (close D + LSM lens) — 10 cells + 1 gated — FV-404 §3 ───────────

const DEFENSE_HM_SEEDS: LacrosseHmSeed[] = [
  {
    slug: "hm-lax-defense-turnover",
    scene: "The ride comes hard and your outlet pass sails over the middie's head and out of bounds. Free possession, and they set up their offense off your throw.",
    feel: "You watch the ball roll dead and your stick drops to your hip. The thought hits: I gave them a free possession.",
    reframe: "That throw is over. One bad outlet is a play, not a pattern.",
    next: "Next clear, pick your target before the save — know your first look, step into the throw, and make the easy one.",
  },
  {
    // ⚠ SHIP-GATED reframe (FV-404 §4 HIGH — the on-the-board visible mistake).
    slug: "hm-lax-defense-dodged",
    scene: "Their attackman splits you topside and gets to the goal line. You chase, the slide is late, and he scores — right in front of your bench.",
    feel: "You hear the horn and feel every eye on your number. The thought hits: I'm a liability out here.",
    reframe: "He won that rep. He does not own the next one.",
    next: "Next approach, break down earlier — feet under you, force him topside into your help, and trust the slide behind you.",
  },
  {
    slug: "hm-lax-defense-penalty",
    scene: "You get beat a half-step and swing a slash across his hands. One-minute personal foul, and your team plays a full minute of six-on-five with the game tight.",
    feel: "The box feels like a spotlight and the minute crawls. The thought hits: a whole minute on me.",
    reframe: "The whistle happened. Learn from it, then compete clean.",
    next: "When you step back on, defend with your feet first — position, angle, then the stick. Clean checks come from good feet.",
  },
  {
    slug: "hm-lax-defense-shut-off",
    scene: "You win the ground ball and push transition like you always do — and their ride stonewalls you at midfield. No outlet, forced backward, the break dies with the ball in your stick.",
    feel: "You are stuck on the wrong side of the line holding a dead play. The thought hits: I killed our break.",
    reframe: "They stopped one push. The next ground ball is still yours to take the other way.",
    next: "Next push, read it earlier — if the lane closes, move it early to the shorty and trail the play instead of forcing the carry.",
  },
  {
    slug: "hm-lax-defense-failed-clear",
    scene: "You cause the turnover — perfect lift check — and then the clear goes wrong. They pick it off and score four seconds later. Your stop turned into their goal.",
    feel: "You did the hard part and lost the easy part, and your helmet tilts back at the sky. The thought hits: I turned a stop into a goal.",
    reframe: "That sequence is over. The stop was real — keep the stop, throw away the throw.",
    next: "Next clear, slow it down one beat — strong hand to the ball, eyes up, hit the safe outlet and let the break build itself.",
  },
  {
    slug: "hm-lax-defense-coach-yells",
    scene: "You get called out by name for a blown slide, loud enough for both benches to hear it, while their goal still sits on the board.",
    feel: "Your shoulders square up like you want to argue, then drop. The thought hits: I can't do anything right back here.",
    reframe: "The volume is not the verdict. Take the correction. Leave the shame.",
    next: "Settle the feet, next slide — call it early, leave on time, and let the communication be the answer.",
  },
  {
    // ⚠ SHIP-GATED reframe (FV-404 §4 HIGH — removal cell).
    slug: "hm-lax-defense-benched",
    scene: "Beaten twice in one quarter, and Coach sits you. Another pole takes your matchup, and you watch your man from the bench.",
    feel: "You count the shifts you are missing and grip your shaft across your knees. The thought hits: they don't trust me on-ball anymore.",
    reframe: "The bench has your body for a stretch. It does not have your mind.",
    next: "Scout while you sit — learn his favorite move, his release hand, his tell. Come back on knowing him better than he knows you.",
  },
  {
    slug: "hm-lax-defense-nervous",
    scene: "Tonight you draw their committed attackman — the one everybody talks about. He is across the field taking warm-up rips.",
    feel: "You check your gloves twice and your first slides in warm-ups feel stiff. The thought hits: what if he takes me every time.",
    reframe: "These nerves are energy, not danger. Let them sharpen you.",
    next: "First possession, win one hard thing — one approach under control, one clean poke. You set the tone, not him.",
  },
  {
    slug: "hm-lax-defense-start-slow",
    scene: "Beaten early, feet not moving, a step slow to the first two slides. Nothing has gone in yet, but you can feel it coming.",
    feel: "Your legs feel stuck in the turf and your calls are a beat late. The thought hits: settle this before it snowballs.",
    reframe: "Cold feet warm up. One good slide resets the whole night.",
    next: "Settle the feet — next possession, break down early, talk loud, and make one on-time rotation. The rest follows.",
  },
  {
    slug: "hm-lax-defense-fall-behind-early",
    scene: "Down three early, and the whole back end looks at you. Hold the crease, quarterback the slides, steady the goalie — the anchor weight lands on you.",
    feel: "Your voice wants to go quiet right when the defense needs it loudest. The thought hits: this is all on me now.",
    reframe: "That run is over. Get one stop, then get the next one.",
    next: "One possession of great defense — early talk, on-time slides, finish with the ground ball. Stops stack. Start the first one.",
  },
];

// ── FOGO — 8 cells + 1 gated (drops shut-off + failed-clear) — FV-404 §3 ────

const FOGO_HM_SEEDS: LacrosseHmSeed[] = [
  {
    slug: "hm-lax-fogo-turnover",
    scene: "You win the clamp — the hard part — then lose the ground-ball battle in the scrum and cough up the exit. All that work, and they walk away with it.",
    feel: "Your forearms are burning from the battle and you come up empty-handed. The thought hits: I won the clamp and lost the ball.",
    reframe: "That scrum is over. The clamp was real — the exit is a skill you sharpen, not a verdict you carry.",
    next: "Next draw, finish the play — clamp, protect it with your body, and pop it to space or your wing before the scrum forms.",
  },
  {
    // ⚠ SHIP-GATED reframe (FV-404 §4 HIGH — the one-job identity).
    slug: "hm-lax-fogo-lose-draws",
    scene: "He is quicker to the clamp, and it is not close. Three draws in a row go the other way, and every loss hands them the ball with your whole team watching the dot.",
    feel: "Your hands feel a tick late on every whistle and the pressure stacks with each loss. The thought hits: I'm losing us the game at the dot.",
    reframe: "He won those draws. He does not own the next whistle.",
    next: "Next whistle, change the fight — new counter, lower pad level, win it to your wing instead of to yourself. One adjustment beats ten replays.",
  },
  {
    slug: "hm-lax-fogo-violation",
    scene: "You jump the cadence — faceoff violation, at the worst possible moment. The official waves it off and hands them the ball for free.",
    feel: "You back away from the dot shaking your head. The thought hits: I gave one away for free.",
    reframe: "The whistle happened. Clean it up, then win the next one clean.",
    next: "Next draw, sit dead-still through the cadence — let the whistle move your hands, nothing else.",
  },
  {
    slug: "hm-lax-fogo-coach-yells",
    scene: "Three straight losses at the X, and Coach lets you hear about it on the way past the box.",
    feel: "You retape a glove that does not need retaping just to have somewhere to look. The thought hits: one more loss and I'm done out there.",
    reframe: "The volume is not the verdict. Take the correction. Leave the shame.",
    next: "Next whistle, quicker hands — one clean rep answers louder than anything you could say back.",
  },
  {
    // ⚠ SHIP-GATED reframe (FV-404 §4 HIGH — removal cell).
    slug: "hm-lax-fogo-off-the-dot",
    scene: "Big draw, tight game — and Coach sends the other FOGO out for it. You watch someone else take your whistle.",
    feel: "You stand at the box with your stick upside down, watching your one job happen without you. The thought hits: I only have one job and I lost it.",
    reframe: "He has the dot for a draw. He does not have your hands or your next whistle.",
    next: "Watch the rep like a scout — his clamp, their counter — and take the dot back one clean draw at a time.",
  },
  {
    slug: "hm-lax-fogo-nervous",
    scene: "First draw against a committed FOGO — the one with the college hat picked out. The whole bench is watching one rep: yours.",
    feel: "Your hands hover over the shaft and your breath sits high in your chest. The thought hits: what if he clamps me clean.",
    reframe: "These nerves are energy, not danger. Let them sharpen you.",
    next: "One whistle at a time — get low, fire your hands, and battle for the fifty-fifty. The dot rewards the ready, not the calm.",
  },
  {
    slug: "hm-lax-fogo-start-slow",
    scene: "You drop the first two draws and they turn both into goals. The early hole has your fingerprints on it.",
    feel: "You walk back to the dot slower each time. The thought hits: find the ball before it's three-nothing.",
    reframe: "Two draws are two draws. The dot resets to even every single whistle.",
    next: "Next whistle, first move faster — trust the clamp you have hit ten thousand times in practice and let your wings do their job.",
  },
  {
    slug: "hm-lax-fogo-behind-at-the-dot",
    scene: "Down three, and now every draw feels like it has to be a win-and-go. The comeback keeps landing on your whistle.",
    feel: "You squeeze the shaft harder each trip to the X and your first move gets tighter instead of quicker. The thought hits: every one of these is on me.",
    reframe: "That run is over. Win one draw, then the next one — possessions, not miracles.",
    next: "One clamp at a time — your job is the ball, not the scoreboard. Win the whistle in front of you and get off clean.",
  },
];

// ── Goalie — 10 cells + 1 gated — FV-404 §3 ─────────────────────────────────

const GOALIE_HM_SEEDS: LacrosseHmSeed[] = [
  {
    slug: "hm-lax-goalie-throw-away",
    scene: "You make the save — then throw the clear right to their attackman. Ten seconds later it is back on your doorstep, a free possession you handed them.",
    feel: "You set your feet again while the crowd is still groaning at your throw. The thought hits: the one job after the save, and I botched it.",
    reframe: "That throw is over. The save was real — keep the save, learn the throw.",
    next: "Next clear, pick your outlet before the shot ever comes — first look wing, second look over the top, and step into it.",
  },
  {
    slug: "hm-lax-goalie-beaten-clean",
    scene: "Step-down from up top, the kind you eat all practice — and it beats you clean, glove side. No screen, no deflection, just by you.",
    feel: "You dig the ball out of the net and flip it back without looking at anyone. The thought hits: that's a save I make.",
    reframe: "He won that shot. He does not own the next one.",
    next: "Next shot, back to your base — set the angle, hands out front, track it from the stick all the way in.",
  },
  {
    slug: "hm-lax-goalie-man-down",
    scene: "Man-down, and their extra-man unit whips it around the horn until the far-pipe look opens. The shot goes where you cannot be.",
    feel: "You chase the ball movement until your feet cross and the net ripples. The thought hits: they got the man-up look and I couldn't hold it.",
    reframe: "Man-up goals happen to every goalie in the game. Six-on-five math is not a verdict on your cage.",
    next: "Next penalty kill, steal one — read the extra pass, cheat late not early, and take away the shooter's first choice.",
  },
  {
    // ⚠ SHIP-GATED reframe (FV-404 §4 HIGH — the on-the-board mistake).
    slug: "hm-lax-goalie-soft-goal",
    scene: "A shot you should have — bounces once and squeaks under your stick. The kind that sits on the scoreboard and stares back at you.",
    feel: "You feel your teammates not looking at you, which is worse than looking. The thought hits: I lost us that one.",
    reframe: "That goal is on the board and it is done. It does not get a vote on the next shot.",
    next: "Next bouncer, body behind it — drop the stick head, smother the hop, and give up nothing off the carpet.",
  },
  {
    slug: "hm-lax-goalie-failed-clear",
    scene: "Your clear gets rode down and turned over three straight trips. You cannot get your defense off the field, and the shots keep coming.",
    feel: "Every failed clear puts the ball right back in your end and the weight stacks. The thought hits: I can't get us out of our own end.",
    reframe: "Those clears are over. One clean outlet flips the whole field.",
    next: "Next save, slow the first two seconds — ball secure, eyes up, hit the safety valve. A boring clear is a perfect clear.",
  },
  {
    slug: "hm-lax-goalie-coach-yells",
    scene: "Coach calls out the soft one — and your quiet defense — loud, from the sideline, while the goal is still fresh.",
    feel: "You want to point at the screen that was not there and swallow it instead. The thought hits: he's on me and I can't erase it.",
    reframe: "The volume is not the verdict. Take the correction. Leave the shame.",
    next: "Answer with your voice — next possession, run the defense loud: call the ball, call the slide, own the cage out loud.",
  },
  {
    // ⚠ SHIP-GATED reframe (FV-404 §4 HIGH — removal cell; the FV-405 pass may
    // author the hm-goalie-pulled worth-clause register here — KC + clinical call).
    slug: "hm-lax-goalie-pulled",
    scene: "They shell you for five goals and Coach makes the change. The long walk from the crease to the bench, helmet still on, backup jogging past you.",
    feel: "You sit at the end of the bench and watch someone else stand in your cage. The thought hits: I got yanked — I'm done here.",
    reframe: "The bench has your body for now. It does not have your mind.",
    next: "Stay a goalie from the bench — track their shooters' releases, talk to your poles at the break, and be ready the second the cage is yours again.",
  },
  {
    slug: "hm-lax-goalie-nervous",
    scene: "Their offense averages fourteen a game, and there are scouts standing behind your cage with clipboards.",
    feel: "Your warm-up hands feel small and every rip in warm-ups looks faster than usual. The thought hits: what if I let in an early soft one.",
    reframe: "These nerves are energy, not danger. Let them sharpen you.",
    next: "Win the first save — track one ball all the way into your stick, and let your hands remember who they belong to.",
  },
  {
    slug: "hm-lax-goalie-start-slow",
    scene: "Beaten early, twice, behind a defense that keeps losing its matchups. You are on pace to see fifteen-plus shots and it is not even the half.",
    feel: "You reset your feet in the crease and your stick taps the pipes on both sides. The thought hits: settle in and make the next one.",
    reframe: "A busy cage is a chance to be great. Next shot, you are the last line — that is the job you asked for.",
    next: "One save at a time — angle, hands, track. Let save two follow save one until the game turns.",
  },
  {
    slug: "hm-lax-goalie-fall-behind-early",
    scene: "Down four in the first quarter, and the whole field looks at the crease. Steady the defense, start every clear — the last-line weight lands square on you.",
    feel: "Your chest tightens under the pads with every restart whistle. The thought hits: if I don't fix this, nobody will.",
    reframe: "That run is over. Make one save, then start one clean clear.",
    next: "Shrink the game to your crease — next shot saved, next clear completed. The comeback starts in your stick.",
  },
];

// ── ⚠⚠ WITHHELD yips-class cells (FV-404 §4 HIGHEST — clinical gate) ─────────
// Authored so the grid + integrity test are complete; UNREACHABLE from the
// Step-02 picker ("I lose my touch." is not in LACROSSE_CONFIG.adversities and
// no roleAdversities entry carries it). The reframe keeps the motor-failure
// story as a false story to reject, never names "the yips", and carries the
// authorized worth register (a plain, earned 7th worth-truth line — the
// baseball hm-bsb-catcher-lose-command precedent). Final prose is
// sports-psychologist-authored + advisor-routed at FV-405; do NOT surface
// these cells in the picker without KC + clinical sign-off.

const GATED_HM_SEEDS: LacrosseHmSeed[] = [
  {
    slug: "hm-lax-defense-clear-yips",
    scene: "The routine outlet — the pass you have made ten thousand times — suddenly will not leave your stick clean. Short one trip, wide the next, and now you are looking for someone else to carry it.",
    feel: "Your top hand strangles the shaft and the easy throw feels like a test you are failing. The thought hits: I can't even make the easy one anymore.",
    reframe: "This is happening to your hands right now, on this clear — pressure sitting on a skill, not a verdict on the defenseman you are.",
    next: "Next clear, shrink the throw — pick one target early, step into it, and throw it like warm-ups: one pass, not a referendum.",
    worth: "Your worth was settled before that pass and it holds after it, so your hands can throw free.",
  },
  {
    slug: "hm-lax-fogo-clamp-yips",
    scene: "The clamp you have won since youth ball suddenly will not fire. Whistle after whistle your hands hesitate a beat, and a move you never had to think about now will not come when you call it.",
    feel: "Your hands hover over the shaft like they belong to someone else. The thought hits: my hands are gone.",
    reframe: "This is happening at the dot right now — pressure sitting on a fast-twitch skill, not a verdict on the FOGO you are.",
    next: "Next whistle, shrink the job — low pad, one simple first move, win it anywhere: forward, back, or to your wing. One clean rep brings the hands home.",
    worth: "Your worth was settled before that whistle and it holds after it, so your hands can fire free.",
  },
  {
    slug: "hm-lax-goalie-save-yips",
    scene: "You have stopped seeing it. The flinch shows up on the step-down, your feet freeze on the bouncer, and three shots in a row go by that you never really tracked.",
    feel: "Your eyes want to close at release and your body turns before the shot arrives. The thought hits: I can't stop anything anymore.",
    reframe: "This is happening in the cage right now — a flinch under pressure, not a verdict on the goalie you are.",
    next: "Next shot, shrink the job to your eyes — watch the ball leave the stick and follow it as far as you can. Seeing it is the whole rep; the saves ride in behind.",
    worth: "Your worth was settled before that shot and it holds after it, so you can stand in free.",
  },
];

// ── Assembled export ─────────────────────────────────────────────────────────

const LACROSSE_HM_CLIP_SCRIPTS: AudioScript[] = [
  ...ATTACK_HM_SEEDS,
  ...MIDFIELD_HM_SEEDS,
  ...DEFENSE_HM_SEEDS,
  ...FOGO_HM_SEEDS,
  ...GOALIE_HM_SEEDS,
  ...GATED_HM_SEEDS,
].map(lacrosseHmScript);

// 10 library VIZ (2 per position) + 50 hard-moment cells (47 grid + 3
// withheld yips) = 60.
export const LACROSSE_PREGAME_CLIP_SCRIPTS: AudioScript[] = [
  ...LACROSSE_VIZ_CLIP_SCRIPTS,
  ...LACROSSE_HM_CLIP_SCRIPTS,
];
