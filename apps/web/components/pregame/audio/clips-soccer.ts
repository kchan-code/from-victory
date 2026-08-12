// Soccer pregame compositional clips (FV-76 prerequisite wiring, v2 DORMANT)
// — 45 hard-moment cells, wired from the KC-ratified soccer taxonomy
// (docs/soccer-module-map.md). The soccer analog of clips-lacrosse.ts /
// clips-football.ts. Kept in a sibling file to stay out of the clips.ts hot
// file. Registered into CLIP_SCRIPTS via `...SOCCER_PREGAME_CLIP_SCRIPTS`
// in clips.ts. The 32 VIZ clips (4 position flagships + 28 positive-play
// library entries) live in clips-viz-soccer.ts, registered separately via
// `...SOCCER_VIZ_CLIP_SCRIPTS`.
//
// SOURCE OF TRUTH: docs/scripts/soccer.md. The generator reads book prose
// (and structure — FV-302) at render time via loadBookProse, so these
// strings are the scaffold the book overrides, seeded from the book's
// numbered lines in the de-corned 6-line HM shape
// (docs/pregame-script-style.md Part 1):
//   1. Now rehearse the hard moment.            [0.4s]
//   2. <Scene — present-tense, sport-true.>     [1.5s]
//   3. <Observed body detail.> The thought hits: <intrusive self-talk>. [2s]
//   4. Now the reset. Return to your anchor.    [2s]
//   5. <Reframe — short, grounded.>             [2s]
//   6. Next <rep>, <concrete sport-true actions>. [2s]
// The five clinically gated cells (4 shootout + GK handling collapse)
// carry a 7th worth-truth line. Slug scheme: hm-soc-{fwd|mid|def|gk}-{frag}
// (soccer owns soc- / hm-soc- / viz-soc- / pp-soc-). Positions: Forward /
// Midfielder / Defender / Goalkeeper. Audio render is DEFERRED (the sport
// is DORMANT, not in SUPPORTED_SPORTS) — this file is the TTS INPUT, no
// MP3s yet. FV-76 owns the render pass; FV-78/79 own go-live enablement.
//
// CLINICAL GATES (docs/soccer-module-map.md §4 — the FV-119 pattern):
//   ⚠⚠ WITHHELD (authored here, absent from every roleAdversities array
//   until clinical sign-off):
//     hm-soc-fwd-shootout / hm-soc-mid-shootout / hm-soc-def-shootout /
//     hm-soc-gk-shootout  — the shootout miss (no next-rep architecture)
//     hm-soc-gk-handling-yips — the hands desert you (yips-class)
//   Never name "the yips". The ★ identity phrases from the map render only
//   as intrusive thoughts to reject ("The thought hits: ..."), never as labels.
//
// SCOPE: outdoor 11-a-side soccer, boys' and girls' (one taxonomy). Futsal
// and indoor/arena soccer are out of scope.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";

// Same target as CLIP_LOUDNORM_FILTER in clips.ts. Defined locally to avoid a
// circular import (clips.ts imports SOCCER_PREGAME_CLIP_SCRIPTS from here).
const SOCCER_LOUDNORM_FILTER = "loudnorm=I=-16:TP=-1.5:LRA=11";

// ── Hard-moment cell factory ─────────────────────────────────────────────────
// All 45 cells share the de-corned 6-line structure (7 lines for the gated
// cells). The factory keeps the engineering metadata (marks, instructions,
// pauses) uniform so the book's in-sync override maps 1:1 per line.

type SoccerHmSeed = {
  slug: string;
  /** Line 2 — the scene. */
  scene: string;
  /** Line 3 — observed body detail + "The thought hits: ..." framing. */
  feel: string;
  /** Line 5 — the reframe (standardized motif where one exists). */
  reframe: string;
  /** Line 6 — the concrete next-rep cue. */
  next: string;
  /** Optional 7th worth-truth line — GATED cells ONLY (module map §4). */
  worth?: string;
};

function soccerHmScript(seed: SoccerHmSeed): AudioScript {
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
    postFilter: SOCCER_LOUDNORM_FILTER,
    segments,
  };
}

// ── Forward — 10 cells (uniform 4×10 grid, no drops) ──

const FWD_HM_SEEDS: SoccerHmSeed[] = [
  {
    slug: "hm-soc-fwd-giveaway",
    scene: "The ball comes into your feet with a center back tight behind you. Your first touch gets away from you, and the defender steps around you and takes it. Possession gone in their half, and your whole team turns and runs back.",
    feel: "Your second step is a stretch you never reach, and your arm is still up asking for the ball that's already gone the other way. The thought hits: I took that touch before I set my body.",
    reframe: "That was your touch and it's gone. Losing one ball is a correction to make, not a case against you.",
    next: "Next ball into your feet, set your body before it arrives, take the first touch away from pressure, and lay it simple. Then check the line and make the next useful run.",
  },
  {
    slug: "hm-soc-fwd-sitter",
    scene: "The cross comes low across the six. The goalkeeper is beaten and the net is open in front of you. You lean back, and you put it over the bar. The noise from the sideline stops all at once, and the goal kick is already being placed.",
    feel: "Your hands go to the top of your head and you stay bent over, looking at the patch of grass where the ball was. The thought hits: I leaned back and snatched at it.",
    reframe: "That chance was yours and you missed it. The correction is to stay over the ball; take that note and get set for the goal kick.",
    next: "The next chance may be twenty minutes away, so don't go chasing it. Check the line, keep your runs honest, and attack the near post when the next ball comes in.",
  },
  {
    slug: "hm-soc-fwd-marked-out",
    scene: "Forty minutes gone and your marker has won every duel in them. Every ball into your feet gets nicked away before it settles. You drift wide, then deep, then wide again, and it still doesn't find you. The one time you got outside, the cross hit the first defender.",
    feel: "You're standing with your hands on your hips on the far side of the field, watching the game happen forty yards away. The thought hits: I'm drifting and doing nothing out here.",
    reframe: "Forty quiet minutes tell you the movement has not worked yet. Treat it as a matchup problem, not a judgment about you.",
    next: "Next ball, change the picture you're giving them. Check the line, run across your marker's shoulder instead of into their feet, and make them turn and defend the space behind.",
  },
  {
    slug: "hm-soc-fwd-booked",
    scene: "You've been held and kicked all half. On the next one you go through the back of the defender out of frustration, and the whistle goes. The card is out before the free kick is even set. Sixty minutes left, and one more takes you off.",
    feel: "You back away with your hands up and your legs feel hot on the walk to the restart. The thought hits: I let the frustration make that challenge.",
    reframe: "That was frustration, not competing, and the card is real. The yellow narrows what you can do in a tackle — it does not take you off the field.",
    next: "Do your competing in front of them now. Press with your angle, not with a tackle, check the line, and make the run that makes them turn and chase.",
  },
  {
    slug: "hm-soc-fwd-goal-on-me",
    scene: "You try to turn on the halfway line and you lose it. Twelve seconds later the ball is in the back of your own net. You see the last of it from forty yards behind the play, still running back.",
    feel: "Your hands are on your knees at the top of the center circle and you can hear the other side celebrating behind you. The thought hits: I turned into pressure with no support around me.",
    reframe: "That started with your decision to turn into pressure. Name it plainly, then stop adding a larger judgment to it.",
    next: "Kickoff restarts the game for everybody, including you. Check the line, hold the first ball up instead of turning into traffic, and make the next run the useful one.",
  },
  {
    slug: "hm-soc-fwd-coach-yells",
    scene: "You jog back into shape and the shout comes off the touchline. Press the angle. You're holding nothing up. It carries across the whole field. The parents behind the bench heard it, and so did the defender marking you.",
    feel: "You keep your eyes on the ball and don't look over, and your jaw is tight as you walk to the restart. The thought hits: I've been late to the press twice now.",
    reframe: "The coach's volume does not change the instruction. You were late to the press; correct the angle and timing without adding a judgment about yourself.",
    next: "The correction is a run, so give them the run. Press on the angle that kills the inside pass, check the line, and make the next useful run.",
  },
  {
    slug: "hm-soc-fwd-benched",
    scene: "The team sheet goes up and you're not in the eleven. You warm up down the touchline twice, jog back past both sets of parents, and sit down again. Sixty minutes gone, and the board has gone up for somebody else.",
    feel: "You've got your jacket zipped now and you've stopped stretching between the warm-ups. The thought hits: I've stopped getting ready.",
    reframe: "The team sheet decides your minutes tonight. It does not decide whether you stay prepared or how you respond.",
    next: "Stay ready without watching the board. Keep your legs warm, watch what their center back gives away when they get stretched, and if your number does go up, check the line and make the first run a hard one.",
  },
  {
    slug: "hm-soc-fwd-nervous",
    scene: "Showcase weekend. There are college coaches standing along the touchline with folders, and you can see them from the center circle. Kickoff is a minute away and you're already thinking about your first touch as if it's the whole impression.",
    feel: "Your feet keep tapping the grass and you retie a cleat that was already tied. The thought hits: I'm treating the first touch like the whole showcase.",
    reframe: "The nerves are real. They do not require you to force the first chance. Give yourself one simple action to enter the game.",
    next: "First five minutes, get into the game with your legs. Run the channel early, press the first pass back to their keeper, and check the line and make the next useful run before you go looking for the finish.",
  },
  {
    slug: "hm-soc-fwd-drought",
    scene: "Five games without one. Tonight the ball still won't fall for you — a shot deflected wide, a header you got under, and the flag up on the one run that got in behind. Every time the ball goes wide you're already counting.",
    feel: "You catch yourself checking the scoreboard every time the ball goes out, and your last touch was heavy because you were shooting before you'd settled it. The thought hits: I'm forcing everything.",
    reframe: "Five games without a goal is a real stretch. Your job tonight is not to erase it with one shot; it is to keep making useful runs and taking the right chances.",
    next: "Check the line, attack the near post when the cross is on, and hit the first-time shot instead of taking the extra touch.",
  },
  {
    slug: "hm-soc-fwd-fall-behind-early",
    scene: "Ten minutes in and you're a goal down. The ball has spent the whole opening in your half and you've touched it twice. You can already feel yourself wanting to drop into midfield and go find it.",
    feel: "You're jogging backward with your hands out, asking for it thirty yards from where you're supposed to be. The thought hits: I'm doing too much and it's only been ten minutes.",
    reframe: "One goal at ten minutes is one goal. Do not try to erase it with one run or one touch; give the team a reliable option on the next possession.",
    next: "Stay high and make them defend you. Check the line, hold your position on the last shoulder, and threaten in behind so your team has somewhere to play.",
  },
];

// ── Midfielder — 10 cells (uniform 4×10 grid, no drops) ──

const MID_HM_SEEDS: SoccerHmSeed[] = [
  {
    slug: "hm-soc-mid-giveaway",
    scene: "You receive twenty yards in front of your own box, half-turned, and you try to play it through the middle. It gets cut out. Two passes later they're shooting from the edge of your area and your center back has to throw a body in front of it.",
    feel: "You're the last one turning to run back, and your arm is still out pointing at the pass you meant to make. The thought hits: I forced that one.",
    reframe: "That was your pass, in a bad area, and it's gone. One loose ball is a correction to make, not a case against you.",
    next: "Next one, get your head up before it arrives. Show for the ball, take your touch out of your feet, and play the simple forward option — earn the harder one later.",
  },
  {
    slug: "hm-soc-mid-missed-chance",
    scene: "You time the late run and arrive right on the edge of the six as the cross comes in — the chance a midfielder gets twice a season. You snatch at it. It goes over the bar and over the fence behind the goal.",
    feel: "You stay bent over with your hands on your shorts and don't look up while the goal kick gets placed. The thought hits: I snatched at it instead of setting my feet.",
    reframe: "You snatched at that strike. The correction is to arrive under control and set your feet; the goal kick ends the play.",
    next: "Go back and do your first job. Show for the ball, play the simple forward option, and keep making the run — the arrival is worth it even when the finish isn't there.",
  },
  {
    slug: "hm-soc-mid-beaten",
    scene: "The runner takes it past you in the middle and the field opens up behind you. Your back four has to step and cover the space you were standing in. You get back late, and the attack is already three passes further on.",
    feel: "Your first step goes the wrong way and you spend the next thirty yards recovering from behind. The thought hits: I dove in flat-footed.",
    reframe: "That duel is gone and it doesn't carry into the next one. You were square and too close — the fix is your distance and your body position, not more effort.",
    next: "Next time they run at you, stay on your feet and show them wide. Then get back into the line, show for the ball, and play the simple forward option.",
  },
  {
    slug: "hm-soc-mid-booked",
    scene: "Twenty minutes in, you go a step late on the counter and the whistle goes. The card comes out. There are seventy minutes left, and every tackle from here is one that can end your night.",
    feel: "You keep your hands behind your back walking away from the referee, and you're already thinking about your next challenge instead of the restart. The thought hits: I went in late and gave away the free kick.",
    reframe: "That challenge was late and the card is real. The yellow narrows your tackle — it doesn't narrow your game, and it doesn't take you off the field.",
    next: "Defend with your feet and your position now. Get across early, force the pass backward instead of reaching for it, and when you win it, show for the ball and play the simple forward option.",
  },
  {
    slug: "hm-soc-mid-goal-on-me",
    scene: "The corner comes out to the edge of the box and you're watching the ball instead of the runner behind you. They arrive onto the second ball and it's in the net. That was your job to pick up.",
    feel: "You turn and look at the spot you were standing in a second earlier, and your hand goes up before anyone has said anything. The thought hits: I ball-watched and lost the runner.",
    reframe: "That was your runner, and the correction is specific: find the player before tracking the second ball. Do not add a larger judgment to it.",
    next: "Next set piece, take the job first. Find the runner before you find the ball, hold the edge of the box, and when it comes out, show for it and play the simple forward option.",
  },
  {
    slug: "hm-soc-mid-coach-yells",
    scene: "The ball goes out for a throw and the shout comes across the field. Show for it. You're hiding. The whole group hears it — your teammates, both benches, and the parents behind them.",
    feel: "You clap once and turn back to your position without looking over, and your face is hot walking to the restart. The thought hits: I've been taking the safe angle all half.",
    reframe: "The instruction is specific: show on a better angle. Take that correction without turning the shout into a judgment about yourself.",
    next: "Then take the instruction literally. Show for the next ball on an angle where you can turn, get your head up before it arrives, and play the simple forward option.",
  },
  {
    slug: "hm-soc-mid-benched",
    scene: "Halftime. The team talk ends, the group breaks, and your name gets read out with a substitution attached to it. You pull a jacket on and walk back out knowing the second half starts without you.",
    feel: "You sit down on the end of the bench and push your socks down over shin guards you don't need anymore. The thought hits: I stopped showing for the ball before halftime.",
    reframe: "A halftime change evaluates the first half and changes your minutes tonight. It does not settle what the coach will see in the next session.",
    next: "Be useful from where you're standing. Watch where the space is between their lines, tell the player going on what you saw, and take your standard into the next session — show for the ball, play it forward, do your job first.",
  },
  {
    slug: "hm-soc-mid-nervous",
    scene: "First start in the middle at this level. You've watched this team play, and the ball moves faster than anything you've played in. Kickoff is a minute out and you're replaying your first touch before you've taken it.",
    feel: "You're bouncing on your toes in the center circle and you keep pulling at your sleeves. The thought hits: I'm rushing before the ball has even moved.",
    reframe: "The nerves are real. They do not require you to play faster than the game. Start with one clean touch.",
    next: "Get your first touch out of the way early. Show for the ball off the kickoff, take the easy one, and play the simple forward option — the speed slows down once you've touched it.",
  },
  {
    slug: "hm-soc-mid-cant-get-into-it",
    scene: "Twenty-five minutes and you've had four touches. Every time the ball comes near you, somebody gets there first, or it's gone by the time you turn. You're running as hard as anyone on the field and you have nothing to show for it.",
    feel: "You're arriving half a second after every ball, and your touches are rushed because you're taking them while you're still turning. The thought hits: I'm a step behind everything.",
    reframe: "Quiet stretches are what this game does — long spells of work with nothing to show for them. Being a step late is a timing problem, and timing is fixable inside this half.",
    next: "Get one easy touch, then get another. Show for the ball on an angle where you can see the field, scan before it arrives, and play the simple forward option — take the easy one twice before you look for the hard one.",
  },
  {
    slug: "hm-soc-mid-fall-behind-early",
    scene: "Two goals down inside twenty minutes. Every ball you get, you're looking for the pass that fixes it, and the last two have been cut out. You've started pressing on your own, and the gap behind you is getting bigger every time.",
    feel: "You're first out of the shape every time they get it, and your passes are going forward before your head comes up. The thought hits: I'm forcing things.",
    reframe: "Two goals in twenty minutes doesn't come back on one pass. It comes back the boring way — one clean spell on the ball, then the next one.",
    next: "Press with the group, not on your own. Show for the ball, play the simple forward option, and let the game come back through your touches instead of one ball over the top.",
  },
];

// ── Defender — 10 cells (uniform 4×10 grid, no drops) ──

const DEF_HM_SEEDS: SoccerHmSeed[] = [
  {
    slug: "hm-soc-def-giveaway",
    scene: "The goalkeeper rolls it to you and their forward is already closing you down. You look up late and try to squeeze the pass into midfield. It's read the whole way and cut out twenty yards from your own goal.",
    feel: "Your feet stop underneath you for half a second and your head snaps around to find the runner. The thought hits: I played that one straight into the press.",
    reframe: "That pass is gone. Playing out costs you one sometimes — the answer is a better picture, not a longer ball.",
    next: "Next ball into your feet, scan before it arrives, open your body, and give it to the free player. Simple and forward.",
  },
  {
    slug: "hm-soc-def-missed-chance",
    scene: "The corner comes to the back post and it's yours. You get across your marker, free, six yards out with the goal open in front of you. You put the header wide of the post — the one chance a defender gets all game.",
    feel: "Your hands go to the back of your head and the jog back to halfway feels twice as long as it is. The thought hits: I was wide open and I missed it.",
    reframe: "That header is over. It cost a chance, not the job you're actually out here to do — and that job starts again on the restart.",
    next: "Next set piece, lose your marker early, attack the flight of the ball, and get your head over it. Then get straight back into the line.",
  },
  {
    slug: "hm-soc-def-turned",
    scene: "The striker holds the run on your shoulder, then spins in behind on the first ball over the top. You turn late, and the half-yard is a full one before your second step. You're chasing all the way to the box, and everybody on the field watched it happen.",
    feel: "Your first two steps go nowhere and your head drops on the jog back into the line. The thought hits: I got turned and I couldn't get back.",
    reframe: "You started too close and turned late. The next duel needs better starting distance and body position, not more speed.",
    next: "Next duel, start a yard deeper with your partner, get side-on early, and show the striker away from goal. Stay on your feet until the cover arrives.",
  },
  {
    slug: "hm-soc-def-booked",
    scene: "You mistime the recovery challenge and clip the attacker's ankle with your partner covering inside. The whistle goes, the free kick is given, and the card comes out. There's an hour left, and now every duel you go into has a second yellow attached to it.",
    feel: "Your hands come up before the card is even out and your jog back into the line is stiff. The thought hits: I dove into that one.",
    reframe: "The whistle happened. Learn from it, then compete clean — you can still defend hard on a yellow, you just can't defend late.",
    next: "Next duel, get there early or don't go at all. Stay on your feet, show the attacker wide, and win it with position instead of a tackle.",
  },
  {
    slug: "hm-soc-def-goal-on-me",
    scene: "The cross comes low across the six-yard box. You stretch to cut it out, and it comes off your shin and past your own keeper. They celebrate it like any other one — it counts exactly the same.",
    feel: "You stay down in the six for a second, then your eyes go to your keeper and back to the ball sitting in the net. The thought hits: that came off me.",
    reframe: "That one came off you and it counts. It counts as a goal — it does not count as a verdict on the defender you are.",
    next: "On the restart, get your voice back first. Set the line with your partner, win the next ball into your box, and clear it long and wide.",
  },
  {
    slug: "hm-soc-def-coach-yells",
    scene: "The ball goes in and the head coach is already off the bench pointing at your line. Who has the runner. It's loud, it's your name, and both sidelines heard it. The scoreboard already changed, so there's nothing you can say back.",
    feel: "Your jaw sets and you keep your eyes on the center circle so you don't look over. The thought hits: I let the runner go.",
    reframe: "The correction is specific: find the runner earlier and organize the line. Take it without carrying the coach's volume into the next play.",
    next: "Next ball, answer it with your voice. Step the line together, call the runner early, and settle your feet before the first duel.",
  },
  {
    slug: "hm-soc-def-benched",
    scene: "The team sheet goes up and your name isn't in the eleven. You were beaten twice last week and you know that's why. You warm up with the subs and watch somebody else line up in your spot.",
    feel: "You lace your cleats slowly, and your eyes keep going to the back line all through the warmup. The thought hits: I was late to both of those duels.",
    reframe: "You were left out after two poor duels. That selection may not change today, but how you prepare and train next is still yours.",
    next: "If the board goes up with your number, win your first duel simple. Take the safe pass, settle your feet, and manage the distance from the very first ball.",
  },
  {
    slug: "hm-soc-def-nervous",
    scene: "Kickoff is a few minutes out and you already know who you've got — the striker everybody's been talking about all week. There are coaches standing behind your goal. The first ball into your box is the first thing anyone sees you do.",
    feel: "Your warmup touches are coming out short and quick, and your hands keep pulling at your sleeves. The thought hits: I'm thinking about who is watching instead of the first ball.",
    reframe: "The nerves are real. They do not change the first job: read the flight and make the simple decision.",
    next: "First ball into your half, be early. Get there first, head it clear or take the simple pass, and settle your feet before the second one comes.",
  },
  {
    slug: "hm-soc-def-start-slow",
    scene: "Ten minutes in and you've been second to both duels. The winger has already knocked one past you and won a throw deep in your half. Your feet aren't moving yet, and that whole side of the field can feel it.",
    feel: "Your first step keeps arriving after the ball does, and you're reaching in instead of moving your feet. The thought hits: I'm second to everything so far.",
    reframe: "Those ten minutes are over. Feet are the fastest thing on the field to fix — start there, not with a big tackle.",
    next: "Next time it comes down your side, settle your feet first. Short steps, hold the distance, show the winger outside, and let the ball come to you.",
  },
  {
    slug: "hm-soc-def-fall-behind-early",
    scene: "Twenty minutes gone and you're a goal down. You can feel the game pulling at you already — push the line up, go long, step out and try to win it high. Every time you do, the space behind you gets bigger.",
    feel: "You catch yourself standing five yards higher than the rest of the line, eyes locked on their forward instead of on your center back partner. The thought hits: I'm doing too much back here.",
    reframe: "One goal is one goal. You don't get it back with a gamble from the back line — you get it back by not conceding the second.",
    next: "Next ball forward, hold the line with your partner. Step together, say it out loud, and play the first pass simple and forward.",
  },
];

// ── Goalkeeper — 10 cells (uniform 4×10 grid, no drops) ──

const GK_HM_SEEDS: SoccerHmSeed[] = [
  {
    slug: "hm-soc-gk-played-into-trouble",
    scene: "You're asked to play out, so you take the short goal kick with their forward already closing. The pass is heavy, the touch is heavier, and it's picked off eighteen yards from your own goal. Now you're setting for a shot that never should have existed.",
    feel: "You're already backpedaling toward your line and your hands come up late. The thought hits: I put us in that.",
    reframe: "That ball is on you, and it's finished. Playing out costs you one sometimes — the answer is a better look before you play, not a longer ball.",
    next: "Next goal kick, look before you play. Pick the free player, weight it to their back foot, and tell your back line what's on before you strike it.",
  },
  {
    slug: "hm-soc-gk-dropped-cross",
    scene: "The corner swings in and you call for it and go. You get there half a step late and the ball drops through the crowd behind you. It's scrambled off the line, and everyone in the box knows whose ball that was.",
    feel: "Your gloves close on nothing and your feet land flat as you turn to find where the ball went. The thought hits: I called for that one and didn't get there.",
    reframe: "That cross is over, and it stayed out. Going for it is still the right call — the fix is when you start, not whether you come.",
    next: "Next ball into your box, call it early and loud, start on the flight, and take it at the top of your jump. Clean hands, or punch it high, wide and long.",
  },
  {
    slug: "hm-soc-gk-beaten-near-post",
    scene: "The winger drives at you down the outside and shoots early from a tight angle. You're a step off your near post when it leaves the foot. It goes in on that side, under your hands, inside the post you're supposed to own.",
    feel: "You're still reaching as it crosses the line, and your knees stay planted a beat too long. The thought hits: I was a step off the near post and my hands were late.",
    reframe: "That shot is in. You were a step off the near post; correct the starting position without turning one goal into a judgment on your hands.",
    next: "Next shot, be set before the strike. Take the near post first, hands out in front, stay big through the ball — then set your angle again and get your line talking.",
  },
  {
    slug: "hm-soc-gk-penalty-conceded",
    scene: "The ball goes over the top and you come for it. You get a piece of the striker before you get a piece of the ball. The whistle goes, the referee points to the spot, and the card comes out. The kick is still to come, and you face it alone.",
    feel: "You stay on your knees a second longer than you mean to, gloves pressed flat into the grass. The thought hits: I came through the striker there.",
    reframe: "The whistle happened. Learn from it, then compete clean — the kick still has to be taken, and you're the one facing it.",
    next: "Set on your line, stay still until the strike, and drive at the ball. And the next one over the top, decide early — come and take it clean, or stay and set your angle. On a yellow, you can't decide late.",
  },
  {
    slug: "hm-soc-gk-soft-goal",
    scene: "The shot comes from twenty-five yards and you see it the whole way. It skips once and squirms under your body, and it's in. You pick it out of the net yourself — nobody else walks in there to do it — and the walk back to your line is long.",
    feel: "Your gloves feel useless carrying the ball out, and your eyes go to the scoreboard before you can stop them. The thought hits: I should have had that one.",
    reframe: "That one is yours, and the scoreboard keeps it. It keeps the goal — it does not keep your worth.",
    next: "Next ball into your box, be set early. Get your angle, get your calls out loud so the back line hears you, and take the first one cleanly with both hands.",
  },
  {
    slug: "hm-soc-gk-coach-yells",
    scene: "The ball goes out for a corner and your whole back line turns around to look at you, waiting. Then the head coach's voice comes across the field about the last one, loud enough for both benches. There's nowhere on this field to look but back at them.",
    feel: "Your gloves come together in front of you and your first call comes out quieter than you wanted it. The thought hits: I went quiet right when they needed me loud.",
    reframe: "The correction is specific: organize earlier and louder. Take it without carrying the coach's volume into the next set piece.",
    next: "Next set piece, talk first. Set your posts, call the near one, and get one clear instruction out before the ball comes in.",
  },
  {
    slug: "hm-soc-gk-dropped",
    scene: "The team sheet goes up and the other keeper's name is on it. You take your shots in the warmup, then you sit in your warmups for ninety minutes. There's no rotation for keepers — there is one shirt, and this week it isn't yours.",
    feel: "You pull your gloves on out of habit during the warmup, then peel them off again on the bench. The thought hits: I'm putting gloves on for nothing today.",
    reframe: "The other keeper was selected this week. That decision may not change today, but it does not decide how you prepare or what you do with the role.",
    next: "Today your reps are the warmup and the next training session. Take each shot with the same setup, keep communicating with the back line from the touchline, and ask what the coach needs to see from you.",
  },
  {
    slug: "hm-soc-gk-nervous",
    scene: "Warmups are done and you're alone in your six-yard box waiting for kickoff. They've scored four in each of their last three games and everybody on your sideline knows it. The first shot of the night is coming, and you have no idea when.",
    feel: "You keep resetting your gloves and tapping your posts, and your first steps across the goal feel short. The thought hits: I'm waiting for the mistake before a shot has come.",
    reframe: "The nerves are real. They do not require you to guess at the first shot. Get set and read the ball.",
    next: "First ball that comes, keep it simple. Set before the strike, take it into your body, and get your voice out to the line straight away.",
  },
  {
    slug: "hm-soc-gk-start-slow",
    scene: "Half an hour gone and you haven't made a save. The play's been at the other end the whole time, it's cold, and your gloves are wet. Then it turns over in midfield in one pass and three of them break on your last two — your first real moment of the night, arriving at full speed.",
    feel: "Your first two steps off your line come out stiff and your hands are still down by your hips. The thought hits: I've been standing here for thirty minutes and now this.",
    reframe: "This is the position: long stretches of nothing, then one moment. Cold doesn't decide the next ball — being set does.",
    next: "As it comes, get moving before the ball does. Feet early, hands out in front, angle set — and between the quiet stretches, keep talking and keep your feet alive so the first one finds you already there.",
  },
  {
    slug: "hm-soc-gk-fall-behind-early",
    scene: "Two down inside twenty-five minutes and the back four in front of you is rattled. They're pointing at each other, the line drops deeper every ball, and the game is coming at you in waves. Every attack your team makes now starts with you.",
    feel: "You catch yourself standing deeper on your line, and your calls are landing after the runs instead of before them. The thought hits: it's all coming through me now.",
    reframe: "That start is over. You don't get it back with one big save or one long ball — you get the next ball clean, and then the one after it.",
    next: "Next ball in, push the line back up and get your calls out early. Name the runner, take what's yours, and start the next attack with a simple pass.",
  },
];

// ── ⚠⚠ WITHHELD (authored, omitted from every picker) — 5 cells ──

const GATED_HM_SEEDS: SoccerHmSeed[] = [
  {
    slug: "hm-soc-fwd-shootout",
    scene: "Shootout. Your name is on the list, and the walk from the center circle to the spot is the longest one you've made. You pick your side on the walk, place the ball, run up — and put it over the bar. The net never moves.",
    feel: "Your hands go to the back of your head and your legs feel like they belong to someone else. The thought hits: that's the one thing I'm for, and I missed it.",
    reframe: "Your chest is pounding and your face is hot — that's what caring this much feels like with nowhere to put it, and it drains off. A penalty went over the bar. That is the whole of what happened.",
    next: "There's no next kick for you tonight, so this is the rep: turn before you feel ready to, head up, and walk the whole way back to your team at the center circle. Get in the line and put your arm back around the two next to you.",
    worth: "You were loved before you placed that ball and you're loved on the walk back from it. That spot was never holding your worth.",
  },
  {
    slug: "hm-soc-mid-shootout",
    scene: "Shootout. When the coach asked who wanted one, you put your hand up, and you take the fourth. You strike it clean and low to your side — and the keeper goes the right way and pushes it wide.",
    feel: "Your breath won't go all the way down and you can't take your eyes off the spot where the ball was. The thought hits: I asked for that one.",
    reframe: "Your throat is tight and the noise has gone far away — that's your body carrying something you cared about. Stepping up was the part that was actually yours, and you did it.",
    next: "The kick is gone; the walk back is the rep. Head up, get to the line, and be the first voice the next taker hears when they walk past you.",
    worth: "Volunteering didn't earn you anything you didn't already have, and missing didn't spend any of it.",
  },
  {
    slug: "hm-soc-def-shootout",
    scene: "Shootout. The coach needs a fifth and nobody's hand is up, so it lands on you. You've taken maybe three penalties in your life. You strike it well — and it comes back off the post.",
    feel: "You hear the post before you see where the ball went, and your hands drop to your knees. The thought hits: I'm not a taker, I never should have been up there.",
    reframe: "Your legs have gone hollow and your hands are shaking — that's adrenaline with nowhere left to go, and it drains off. An inch of the post decided that, not the player who was willing to take it.",
    next: "Turn around before you feel ready to. They score the next one. Walk back with your head up, and go straight to your keeper — after that last kick they're standing alone in that goal, and you can be the first one there.",
    worth: "Your worth wasn't out on the spot with the ball. It was settled long before tonight, and it's still settled on the walk back.",
  },
  {
    slug: "hm-soc-gk-shootout",
    scene: "Shootout. You face five kicks and you go the right way on two of them — both times the ball is already in the corner. On the last one you're still on the ground when their team runs past you.",
    feel: "You push yourself up off the grass slower than you want to, gloves full of turf. The thought hits: this is the one I'm supposed to win for them.",
    reframe: "Your arms are heavy and your breath is going fast and shallow — that's a body that just went all in, five times. A shootout is built for the shooter. Going the right way twice was you doing your job, not you failing it.",
    next: "Get up before you're ready to. Then walk all the way back up the field to your team, and go to the ones who missed first — you're the only player out there who knows exactly what that walk felt like.",
    worth: "No save was ever what made you worth something, and no goal takes it back.",
  },
  {
    slug: "hm-soc-gk-handling-yips",
    scene: "A shot comes in chest high, straight at you — the easiest ball in the game — and it goes through your hands and you scramble back for it. Ten minutes later a routine one skips off your gloves too. When the next cross comes in, you stay on your line.",
    feel: "Your hands are setting late and hard, and you're pushing away balls you'd normally take clean. The thought hits: my hands are gone tonight.",
    reframe: "Two balls got through tonight — not the hands that have caught ten thousand of them. Tight hands catch late, and that's the nerves in them. Tonight, these two. That's all this is.",
    next: "Nobody's coming on for you, so you don't have to fix it in one save. Make it small: get your body behind the very next ball — a shot straight at you, a rolling ball you can get down and gather, a header back from your center back — take that one clean, and build from it.",
    worth: "Your worth was settled before you pulled these gloves on and it holds when you take them off, so you can go after the next ball free.",
  },
];

// ── Assembled export ─────────────────────────────────────────────────────────

const SOCCER_HM_CLIP_SCRIPTS: AudioScript[] = [
  ...FWD_HM_SEEDS,
  ...MID_HM_SEEDS,
  ...DEF_HM_SEEDS,
  ...GK_HM_SEEDS,
  ...GATED_HM_SEEDS,
].map(soccerHmScript);

// 45 hard-moment cells (40 grid + 5 withheld). The 32 VIZ clips (4
// flagships + 28 positive plays) are registered separately from
// clips-viz-soccer.ts via `...SOCCER_VIZ_CLIP_SCRIPTS` in clips.ts.
export const SOCCER_PREGAME_CLIP_SCRIPTS: AudioScript[] = [
  ...SOCCER_HM_CLIP_SCRIPTS,
];
