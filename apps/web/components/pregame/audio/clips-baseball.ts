// Baseball pregame compositional clips (FV-94) — 4 position VIZ clips + 39
// hard-moment cells, authored by the content trio + baseball-expert under lead
// orchestration from the FV-93 taxonomy. The baseball analog of the
// CLIP_VIZ_* / CLIP_HM_BB_* blocks in clips.ts, kept in a sibling file (like
// clips-viz.ts) to stay out of the clips.ts hot file. Registered into
// CLIP_SCRIPTS via `...BASEBALL_PREGAME_CLIP_SCRIPTS` in clips.ts.
//
// Per-cell structure mirrors basketball: a standalone hard-moment block of
// [rehearse → scenario → body-feel/false-story → reset → two tactical resets →
// truth], wrapped at runtime by the shared opener / VIZ / faith clips. Slug
// scheme: hm-bsb-{position}-{fragment} (basketball owns hm-bb-, hockey session-).
// Audio render = FV-95.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import {
  CATCHER_VIZ,
  INFIELD_VIZ,
  OUTFIELD_VIZ,
  PITCHER_VIZ,
} from "./segments-baseball.ts";
import { CLIP_LOUDNORM_FILTER } from "./loudnorm.ts";

// ── Baseball VIZ clips — one per position (FV-94) ────────────────────────────

export const CLIP_VIZ_PITCHER_SCRIPT: AudioScript = {
  slug: "viz-pitcher",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...PITCHER_VIZ],
};

export const CLIP_VIZ_CATCHER_SCRIPT: AudioScript = {
  slug: "viz-catcher",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...CATCHER_VIZ],
};

export const CLIP_VIZ_INFIELD_SCRIPT: AudioScript = {
  slug: "viz-infield",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...INFIELD_VIZ],
};

export const CLIP_VIZ_OUTFIELD_SCRIPT: AudioScript = {
  slug: "viz-outfield",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...OUTFIELD_VIZ],
};

// ── Baseball HM clips — Pitcher (9 cells) (FV-94) ──────────────────────────

export const CLIP_HM_BSB_PITCHER_STRIKEOUT_SCRIPT: AudioScript = {
  slug: "hm-bsb-pitcher-strikeout",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are up with a runner on. The pitch looks low, you hold off, and the ump rings you up. You drop the bat and start the walk back to the dugout.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Face gets hot. Shoulders drop on the walk back. I can't get anything done up here.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That at-bat is over. Grab your glove and get your head back on the mound.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You hit on the mound, not in the box. Next inning, one pitch at a time, trust your stuff.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That strikeout is real and it is over. It is not your identity. Get back on the mound and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_PITCHER_SLUMP_SCRIPT: AudioScript = {
  slug: "hm-bsb-pitcher-slump",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You take the mound for another start. The ERA is climbing, the last three outings were rough, and before you even throw a pitch you feel it — here we go again.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Grip tightens on the ball. Shoulders ride up. Breath goes short. And the voice shows up right on cue — \"I've lost it, it's gone.\" That's the slump talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The slump is real, but it isn't on the mound with you right now. Right now there's one hitter, one pitch. That's the whole job. Throw it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop steering it. Loosen the grip, trust your stuff, find the mitt, and let it go. One target, one pitch — nothing past that.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. This is a rough stretch, and a rough stretch is real. It is not who you are. Your worth was never riding on this outing — you're secure before the first pitch and after the last one, win or lose. One pitch at a time. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_PITCHER_BIG_HIT_SCRIPT: AudioScript = {
  slug: "hm-bsb-pitcher-big-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are one strike away. You come back to the fastball, and he turns on it — barrels it. You watch it carry, all the way over the fence. Walk-off.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders drop. The ball goes heavy in your hand. Your throat tightens, and the thought shows up — I lost us the game.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That pitch is over — it's one pitch, not the whole night. You made him earn it and he did, and that's baseball. The next time the ball is in your hand, you compete again.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow it down. You don't have to be perfect — you have to throw one good pitch. Find the mitt, trust your stuff, and let the rest go. The mitt, not the fence.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That pitch tonight is real, and it's over. It doesn't decide what you're worth, and it is not your identity. You're secure no matter how that ball carried. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_PITCHER_LOSE_COMMAND_SCRIPT: AudioScript = {
  slug: "hm-bsb-pitcher-lose-command",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You miss with the fastball, then miss again. You start aiming it, guiding it to the mitt, and the next two go to the backstop. Ball four. Bases loaded on walks.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your grip squeezes the seams. Your shoulders ride up toward your ears. Your breath goes shallow. And the thought shows up: the zone is gone and I can't find it. Notice that thought. It's loud right now, but it's not a fact — it's just the miss talking.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That walk is over. There's nothing left to fix in it. Get back on the rubber, take the sign, and give this one pitch everything — just to the mitt.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Loosen the grip and slow it down. You're not aiming it tonight. Quit steering the ball — trust your arm and let it go to the glove. One target, one pitch.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Losing the zone tonight is real, and it's only tonight — it is not who you are. Your worth doesn't ride on this inning; you're already secure, so you can throw free. One pitch, trust your arm. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_PITCHER_PULLED_SCRIPT: AudioScript = {
  slug: "hm-bsb-pitcher-pulled",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are walking off the mound. You hand the manager the ball. The bullpen door swings open behind you, and the dugout is quiet as you sit down.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Throat tightens. Eyes drop to the dirt. Shoulders cave. I'm not good enough to be out there.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That outing is over — it ends at the mound, not in the rest of your night. Coming out tonight is a call about this game, not about you. Sit tall and stay in it with your guys.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't grip the next chance and try to be perfect to make up for this. The next time the ball's in your hand, it's one pitch — slow it down, trust your stuff, hit the mitt.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting pulled tonight is real, and it stings. It is not who you are, and it does not touch your worth — you are secure no matter how tonight goes. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_PITCHER_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-bsb-pitcher-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are on the bump, first pitch against the top of a stacked lineup. The gun is up behind the plate. You miss with the first three, and now it's 3-0 on the leadoff guy.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Chest tightens. Grip squeezes the ball. Shoulders climb up toward your ears. I'm going to walk the yard and they'll see I don't belong here.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That count is over. Step off, get the sign, and throw the next one to the mitt.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop steering it. Slow your tempo, pick the glove, and let one clean pitch go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real and the gun is real. They are not your identity. Reset and go again, one pitch.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_PITCHER_HIT_BATTER_SCRIPT: AudioScript = {
  slug: "hm-bsb-pitcher-hit-batter",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You come inside and miss. The pitch rides in and drills the batter. He goes down, shakes it off, and takes his base. Now you have to throw the next one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Chest tightens. Grip squeezes the ball. Front shoulder flies open early. I can't trust myself inside — what if I do it again.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That pitch is over. He took his base. Get the sign, get back on the rubber, and throw the next one with conviction.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't aim it. Aiming is what misses. Pick your spot, trust your mechanics, and let it go — full, not careful.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Hitting him is real. It is not your identity. Commit to the next pitch and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_PITCHER_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-bsb-pitcher-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You walk the leadoff hitter on four pitches. Now you are behind in the count again, the zone feels small, and the game is speeding up on you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Grip tightens on the ball. Breath gets short. Tempo races. I don't have it today.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That walk is over. Step off the rubber, get the sign, and throw one good pitch to your spot.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow it down. One pitch, your tempo, and trust the mitt where it sets up.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. A rough start is real. It is not your identity. Slow your tempo, hit your spot, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_PITCHER_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-bsb-pitcher-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You hang a fastball and they line it into the gap. Two more cross before you get the third out. You walk off the mound down four in the first.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Grip tightens on the seams. Shoulders climb toward your ears. I already lost this game for us.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That inning is over. Get the next hitter — down in the zone, one pitch, trust the mitt.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow your tempo. Stop trying to get all four runs back with one pitch. Just compete for this one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That inning is real, and it is over. It is not your identity. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Baseball HM clips — Catcher (10 cells) (FV-94) ──────────────────────────

export const CLIP_HM_BSB_CATCHER_STRIKEOUT_SCRIPT: AudioScript = {
  slug: "hm-bsb-catcher-strikeout",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're up with two outs to end the inning. The pitch breaks, you swing through it, and the ump punches you out. Now you've got to strap the gear back on and go run the staff.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Jaw sets. Chest goes tight pulling the mask down. I just failed, and now they need me to lead this.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That at-bat is over. Get the gear on, get behind the plate, and run the next half-inning.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow it down. Don't carry the strikeout into your sequence. One sign, one pitch, work with your guy.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That strikeout is real and it's over. It is not who you are. Get behind the plate and call the next pitch.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_CATCHER_SLUMP_SCRIPT: AudioScript = {
  slug: "hm-bsb-catcher-slump",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You ground into the third inning-ender, 0-for-20 now. You jog out, strap the gear back on, and squat to call the next half-inning with the whole staff on your shoulders.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders sag behind the plate. Your grip tightens on the bat in your head, not the mitt in your hand. The voice says I'm gone, I've got nothing tonight. That's the slump talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That at-bat is over, and the offense isn't your job right now. Put down a sign and catch this pitch.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to carry the whole game. One pitch, one target, frame it clean — that's the only job behind the plate right now.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Tonight's slump is real. It is not who you are, and it doesn't move what you're worth — you're secure whether the hits fall or not. Catch this pitch, call this game. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_CATCHER_ERROR_SCRIPT: AudioScript = {
  slug: "hm-bsb-catcher-error",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You set up for the curveball and it short-hops you. The ball kicks off your chest protector to the backstop, and the runner scores from third before you can get to it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Throat tightens. Hands grip the mitt harder. That run is on me.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That run is over. Get back behind the plate and call the next pitch.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't try to be perfect on every block. Body in front, chin down, smother the next one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That run is over. It is not who you are. Get back behind the plate and run the game.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_CATCHER_BIG_HIT_SCRIPT: AudioScript = {
  slug: "hm-bsb-catcher-big-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You put down the sign. He sat dead-red on it and put it over the wall. You watch him round the bases as the run scores.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Mask feels heavy. Throat tightens. Glove hand drops. I called the wrong pitch.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That pitch is over. Get a new ball, set the target, and call the next one with conviction.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop hunting the perfect pitch. Trust the sequence, trust your guy, and put down the next sign clean.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That home run is real. It is not your identity. Reset the count and call the next pitch.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


// ⚠ CLINICAL GATE (FV-93 §6): throwing-yips cell. Authored + sports-psych-refined,
// but WITHHELD from the picker via BASEBALL_CONFIG.roleAdversities until the
// clinical advisor signs off (FV-119 pattern). Never names "the yips".
export const CLIP_HM_BSB_CATCHER_LOSE_COMMAND_SCRIPT: AudioScript = {
  slug: "hm-bsb-catcher-lose-command",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You drop into the crouch, catch strike three, and go to throw it back to your pitcher. The easy toss. It sails over his head to the screen.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. The hand grips the seams too tight. The shoulder locks up. The throat goes dry. And the thought shows up fast: my throw is gone. Let it show up. You don't have to believe it.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That throw is over. One throw tonight got away from you — not the throw you've made ten thousand times. Tonight, this one. That's all this is.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't speed up to fix it. Speeding up is what got loose. Slow down, breathe out, find his glove, and let this next one go easy to the target.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That throw tonight got away. It is not your identity, and it is not your worth — you are secure before this throw and after it. Find the glove. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_CATCHER_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-bsb-catcher-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are catching a tight game. Coach calls time, walks out, and sends in the other catcher. You hand off the gear and walk back to the dugout.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Throat tightens. Shoulders drop. Eyes go to the ground. I lost the staff. They don't trust me back there.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That call is over. Get on the rail, lock onto the pitcher, and stay in the game from here.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't press to prove a point. Read every sequence, log what's working, and be ready when your name is called.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting benched is real. It is not your identity. Stay locked in, stay ready, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_CATCHER_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-bsb-catcher-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You set up low and away. He uncorks one harder than anything you've caught, and it tails late. You stab at it and it clanks off the heel of your glove to the backstop.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders creep up. Hands get tight. Breath goes shallow. I can't handle this guy.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That ball is over. Reset behind the plate and call the next one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Soft hands. Let it travel, give him a quiet target, and trust your glove to do the work.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That ball got by you, and it is over. It is not who you are. Get back behind the plate and catch the next one.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_CATCHER_FOUL_TIP_SCRIPT: AudioScript = {
  slug: "hm-bsb-catcher-foul-tip",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You set up low and away. The pitch crosses you up and catches you flush on the bare hand. It stings and you come out of your crouch.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Hand throbs. Jaw clenches. Shoulders pull in. I'm going to flinch on the next one.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That pitch is over. Shake the hand out, get back down, and put down the next sign.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't catch soft. Give him a firm target, sit behind it, and stick the next strike.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The sting is real and it's over. It is not who you are. Get back down, call the next one, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_CATCHER_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-bsb-catcher-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You set up inside, the fastball runs in on you, and it handcuffs you and skips to the backstop. The runner moves up. First inning, and you still can't feel the ball in your mitt.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Hands grip tight. Shoulders climb. Breathing goes shallow. I'm too slow back here, the pitcher can't trust me.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That ball in the dirt is over. New ball, fresh sign, give him a steady target down the middle.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Soft hands. Stop reaching for it — let the ball travel and receive it quiet. One pitch, frame it clean.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That ball getting by you is real. It is not who you are. Reset your target and catch the next one.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_CATCHER_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-bsb-catcher-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are behind the plate, down three in the second. Your pitcher just walked the bases loaded, and you can see his shoulders drop. He looks in at you for the sign and he's shaking his head before you even put it down.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Chest tightens under the gear. Your hand grips the ball too hard on the throwback. If I can't settle him, this whole thing is on me.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That inning is still going, but the last pitch is over. Step out, call time, and walk it out to the mound.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow it down. You don't have to fix the score. Give him one target, one pitch, and trust your glove to hold it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Falling behind early is real. It is not your identity. Get back there, steady him one pitch at a time, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Baseball HM clips — Infield (10 cells) (FV-94) ──────────────────────────

export const CLIP_HM_BSB_INFIELD_STRIKEOUT_SCRIPT: AudioScript = {
  slug: "hm-bsb-infield-strikeout",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are up with a chance to put one in play. The pitch starts middle and breaks down, and you wave over the top of it. Strike three. Third punch-out of the night, walking back to the dugout.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Jaw sets. Hands grip the bat too tight. Shoulders drop on the walk back. I can't buy a hit tonight.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That at-bat is over. Glove on, get your feet moving, and be ready on the next pitch.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't carry the bat into the field. Reset between the lines, read the hop, and trust your hands on the next ball hit your way.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Three strikeouts is real. It is not your identity. Get back in the field, win the next play, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_INFIELD_SLUMP_SCRIPT: AudioScript = {
  slug: "hm-bsb-infield-slump",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You step in 0-for-20. You barber a fastball you should crush, but you roll over it and beat it into the ground, right at the shortstop. Another loud out.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders tighten. Your hands choke up hard on the knob. And the voice shows up: I'm lost. I can't hit anymore. Hear it for what it is — a thought, not a fact. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That at-bat is over. It's one at-bat tonight — not a verdict, not who you are. Step out of the box, one slow breath, and step back in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Loosen your grip. This pitch only: stay inside the ball, shorten your swing, drive a strike back up the middle. One good swing, nothing more.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slump is real, but it's this stretch — not forever, and not who you are. Your worth was settled before this at-bat and it holds after it, whatever the scoreboard says. You're secure. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_INFIELD_ERROR_SCRIPT: AudioScript = {
  slug: "hm-bsb-infield-error",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You take a routine grounder, and it kicks off the heel of your glove. Or the throw sails, pulls the first baseman off the bag — and the E lights up on the board with your number on it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Ears go hot. Hands feel stiff in the glove. Everyone saw it, and it's up there for good.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That error is over. Get your feet ready and want the next ball hit to you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't play scared of the next one. Stay low, charge it, and trust your hands.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That error is real, and it's on the board. It is not your identity. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_INFIELD_BIG_HIT_SCRIPT: AudioScript = {
  slug: "hm-bsb-infield-big-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are holding at double-play depth. A ball gets ripped on the dirt to your backhand side, just past your dive, through the hole. It rolls to the wall and the go-ahead run scores.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Stomach drops. Feet plant and go heavy. Shoulders sink as you watch it skip past. I should have had that. I cost us the game.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That ball is over. Get back on your toes and expect the next one hit right at you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop replaying the dive. Get low, move your feet, and trust your first step on the next one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That hit is real, and it is over. It is not who you are. Reset, get ready, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


// ⚠ CLINICAL GATE (FV-93 §6): throwing-yips cell. Authored + sports-psych-refined,
// but WITHHELD from the picker via BASEBALL_CONFIG.roleAdversities until the
// clinical advisor signs off (FV-119 pattern). Never names "the yips".
export const CLIP_HM_BSB_INFIELD_LOSE_COMMAND_SCRIPT: AudioScript = {
  slug: "hm-bsb-infield-lose-command",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You field a routine grounder and set to throw to first. The throw you've made ten thousand times sails wide, or dies in the dirt halfway there.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. The grip goes tight. The shoulder locks. The hands start to shake, and the thought shows up fast: \"My hands won't work right now.\" That's the feeling in this moment. It is not a fact about you.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That throw is over — it doesn't get the next one. Field the next ball clean and make the simple throw to first.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow it down. Loosen the grip, pick a small target on the chest, and throw through it instead of aiming at it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. One bad throw tonight is real. It is not who you are, and it doesn't change that you're secure. Loosen up, trust your hands, and make the next one. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_INFIELD_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-bsb-infield-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You boot the ground ball, or you go down again at the plate. An inning later, coach reads a new name at your spot. You walk to the bench and watch someone else take the field.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat in your face. Stomach drops. Eyes stuck on the dirt. And the voice shows up fast: I lost my spot. I'm done here. Hear it for what it is — a loud thought after a hard inning, not a fact.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That at-bat is over, and so is that inning. They are behind you now. You are still in this dugout, still in this game. Read the hitters, talk the situation out loud, and be ready when your name comes back.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow it down. This is one night, not the season — one inning, not your career. Stay loud on the rail, keep your glove warm, and be the first one up when they need you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The bench tonight is real. It is not who you are. Your spot can be lost and earned back, but your worth was never on that line — you compete from a victory that is already yours, win or sit. Reset and go again when they call you.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_INFIELD_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-bsb-infield-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You set up before the first pitch, hoping it goes anywhere but to you. Then the batter chops a routine two-hopper right at you, and you feel your hands tighten before the ball even gets there.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Hands grip tight. Breath goes shallow. Weight sinks back onto your heels. I can't be trusted with a routine ball.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That play is over. Get back in your ready position and want the next one hit to you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Soft hands. Stay low, charge the ball, and field it out front instead of waiting on your heels.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and one ground ball does not decide who you are. It is not your identity. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_INFIELD_HBP_SCRIPT: AudioScript = {
  slug: "hm-bsb-infield-hbp",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are dug in at the plate. A fastball rides up and in, and you can't get the hands out. It catches you on the elbow and drops you back.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Elbow stings. Breath catches. Hands clamp down. I flinched, I should've gotten out of the way.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That at-bat is over. Drop the bat, take your base, and run.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Shake the arm out and loosen the hands. The ball off you doesn't change how you field — soft hands, stay low, play the next ground ball clean.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That sting is real. It is not your identity. Take your base, loosen up, and play the next ball clean.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_INFIELD_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-bsb-infield-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You take the field still feeling slow, and the first grounder is on you fast. You're late getting your feet going, the ball eats you up on a short hop, and it kicks off your glove into the grass.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Hands tighten. Feet feel stuck in cement. I can't get going today.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That error is over. Reset your feet and get ready for the next ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't press to make it up. Stay low, work through the ball, and let the next hop come to you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That error is over. Get your feet moving early and field the next one clean.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_INFIELD_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-bsb-infield-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are at short, down three in the second. A routine two-hopper comes right at you and you rush it to make something happen. The ball kicks off the heel of your glove into the outfield.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Chest tightens. Hands start to grip. Feet get quick and sloppy. I have to fix this whole game by myself.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That error is over. Reset your feet and play the next ground ball clean.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow it down. You do not have to answer the deficit on one play. Stay back, field it through, make the routine throw.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That error is real and it is over. It is not your identity. Get back in your stance, breathe, and play the next one clean.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Baseball HM clips — Outfield (10 cells) (FV-94) ──────────────────────────

export const CLIP_HM_BSB_OUTFIELD_STRIKEOUT_SCRIPT: AudioScript = {
  slug: "hm-bsb-outfield-strikeout",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You take strike three looking, frozen on a pitch you should have hammered. You drop your head and start the long walk out to your position, and you carry the 0-fer out there with you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders drop. Feet go flat in the grass. Eyes drift in. I'm not a hitter today.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That at-bat is over. You play defense now — read the hitter, get on your toes before the pitch.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't drift out here. Every pitch, move your feet and expect the ball off the bat.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That strikeout is real and it's over. It is not who you are. Get your feet moving, win the next pitch, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_OUTFIELD_SLUMP_SCRIPT: AudioScript = {
  slug: "hm-bsb-outfield-slump",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are 0-for-20 and pressing. The pitcher spins one low and away, off the plate, and you chase it — out in front, rolling it over to short. The long walk back to the dugout.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Hands grip tighter. Shoulders climb up by your ears. And the voice shows up: I'm just an out now. Hear it — that's the slump talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That at-bat is over. Shrink the zone back down and hunt one good pitch to drive.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop pressing. You don't fix twenty swings in one. Let the ball travel, take your walk if it's there, and go run one down in the gap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slump is real, but it's tonight, not forever — and it is not who you are. Your name doesn't change with your line. Shrink the zone, control this at-bat, reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_OUTFIELD_ERROR_SCRIPT: AudioScript = {
  slug: "hm-bsb-outfield-error",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You drift back on a routine fly to the gap. You lose it in the lights for a half-second, get your glove up late, and it clanks off the heel and drops. The runner is already rounding second.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Throat tightens. Glove hand goes stiff. Feet stop moving. How do you miss that.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That error is over. Hit your cutoff, get back to depth, and read the next one off the bat.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't play scared out there. First step in, trust your read, and let your feet take you to the ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That error is real and it is over. It is not who you are. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_OUTFIELD_BIG_HIT_SCRIPT: AudioScript = {
  slug: "hm-bsb-outfield-big-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You read it in. The ball carries over your head and splits the gap. You turn and run, and by the time you hit the cutoff, two have scored and they're standing on third.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Chest tightens. First step locks. Throat goes dry. I can't read a ball off the bat.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That ball is over. Reset your depth and play the next pitch off the bat.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow your first read. Trust your break going back, find the wall early, and hit your cutoff.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That gapper is over. It is not who you are. Reset your feet, trust the next read, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_OUTFIELD_LOSE_COMMAND_SCRIPT: AudioScript = {
  slug: "hm-bsb-outfield-lose-command",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You run down the ball in the gap and come up throwing. The throw sails high over the cutoff man, and the runner reads it and takes the extra base.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulder tightens. Your grip squeezes the seams. I can't trust my arm when it matters.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That throw is over. Back up the play, then get yourself behind the next ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow it down. Next ball, throw on a line through the cutoff man and let the relay do the work.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That throw is over. It is not your identity. Hit the cutoff man and make the next play.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_OUTFIELD_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-bsb-outfield-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are jogging in from right field. The coach is sending a defensive replacement out for the last two innings. You pass him on the warning track and take the long walk to the dugout.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Face goes hot. Shoulders drop on the walk in. Hands feel useless without a glove. I'm a liability out there now.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That decision is made, and it's over. Stay in the game from the rail — read the count, talk up the next guy, be ready.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't press to earn it back. When you get back out there, trust your first read, take the clean route, hit the cutoff.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting pulled is real. It is not your identity. Stay locked in, take the next route clean, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_OUTFIELD_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-bsb-outfield-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are tracking a deep fly ball with the scouts' guns on you. You take a bad first step in, drift back too late, and the ball drops behind you for a double.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Chest tightens. Feet get heavy reading the ball. I can't trust my reads with them watching.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That misplay is over. Get behind the next ball and hit your cutoff.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop drifting. Read it off the bat, trust your first step, and run.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That misplay is real. It is not your identity. Trust the read, run hard, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_OUTFIELD_HBP_SCRIPT: AudioScript = {
  slug: "hm-bsb-outfield-hbp",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are dug in at the plate. The pitch rides in on your hands and catches you on the elbow. The sting shoots up your arm and you drop the bat.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Elbow throbs. Breath catches. Shoulders pull in. I'm rattled now, I'll bail on the next inside pitch.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That pitch is over, and the base is yours. Shake out the arm and take your base.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't carry the sting out to the grass. Settle the breath, get your lead, and put your eyes back on the ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The pitch stung, and now you're on base. It is not who you are. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_OUTFIELD_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-bsb-outfield-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are in left, first inning. The ball jumps off the bat and you read it late, take a flat-footed first step, and have to drift back on your heels to glove it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders tense. Feet feel stuck in the grass. I'm not even awake out here yet.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That read is over. Get on your toes and play the next one off the bat.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop pressing. First step back, trust your read, and get behind the ball early.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. One slow read is real, and it is over. It is not who you are. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};


export const CLIP_HM_BSB_OUTFIELD_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-bsb-outfield-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are in right field, down a few early. A ball drops in front of you and you charge it hard, trying to make something happen, and it skips past your glove to the wall.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Chest tightens. Hands start gripping for a throw before you have the ball. I have to get all these runs back myself.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That misplay is over. Get behind the next ball, field it clean, and hit the cutoff man.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow it down. You don't have to get it all back on one play. Stay back, take the sure out, trust your throw.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Falling behind is real, and so is that misplay. It is not your identity. Stay back, make the next clean play, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const BASEBALL_PREGAME_CLIP_SCRIPTS: AudioScript[] = [
  CLIP_VIZ_PITCHER_SCRIPT,
  CLIP_VIZ_CATCHER_SCRIPT,
  CLIP_VIZ_INFIELD_SCRIPT,
  CLIP_VIZ_OUTFIELD_SCRIPT,
  // Pitcher (9)
  CLIP_HM_BSB_PITCHER_STRIKEOUT_SCRIPT,
  CLIP_HM_BSB_PITCHER_SLUMP_SCRIPT,
  CLIP_HM_BSB_PITCHER_BIG_HIT_SCRIPT,
  CLIP_HM_BSB_PITCHER_LOSE_COMMAND_SCRIPT,
  CLIP_HM_BSB_PITCHER_PULLED_SCRIPT,
  CLIP_HM_BSB_PITCHER_NERVOUS_SCRIPT,
  CLIP_HM_BSB_PITCHER_HIT_BATTER_SCRIPT,
  CLIP_HM_BSB_PITCHER_START_SLOW_SCRIPT,
  CLIP_HM_BSB_PITCHER_FALL_BEHIND_EARLY_SCRIPT,
  // Catcher (10)
  CLIP_HM_BSB_CATCHER_STRIKEOUT_SCRIPT,
  CLIP_HM_BSB_CATCHER_SLUMP_SCRIPT,
  CLIP_HM_BSB_CATCHER_ERROR_SCRIPT,
  CLIP_HM_BSB_CATCHER_BIG_HIT_SCRIPT,
  CLIP_HM_BSB_CATCHER_LOSE_COMMAND_SCRIPT,
  CLIP_HM_BSB_CATCHER_BENCHED_SCRIPT,
  CLIP_HM_BSB_CATCHER_NERVOUS_SCRIPT,
  CLIP_HM_BSB_CATCHER_FOUL_TIP_SCRIPT,
  CLIP_HM_BSB_CATCHER_START_SLOW_SCRIPT,
  CLIP_HM_BSB_CATCHER_FALL_BEHIND_EARLY_SCRIPT,
  // Infield (10)
  CLIP_HM_BSB_INFIELD_STRIKEOUT_SCRIPT,
  CLIP_HM_BSB_INFIELD_SLUMP_SCRIPT,
  CLIP_HM_BSB_INFIELD_ERROR_SCRIPT,
  CLIP_HM_BSB_INFIELD_BIG_HIT_SCRIPT,
  CLIP_HM_BSB_INFIELD_LOSE_COMMAND_SCRIPT,
  CLIP_HM_BSB_INFIELD_BENCHED_SCRIPT,
  CLIP_HM_BSB_INFIELD_NERVOUS_SCRIPT,
  CLIP_HM_BSB_INFIELD_HBP_SCRIPT,
  CLIP_HM_BSB_INFIELD_START_SLOW_SCRIPT,
  CLIP_HM_BSB_INFIELD_FALL_BEHIND_EARLY_SCRIPT,
  // Outfield (10)
  CLIP_HM_BSB_OUTFIELD_STRIKEOUT_SCRIPT,
  CLIP_HM_BSB_OUTFIELD_SLUMP_SCRIPT,
  CLIP_HM_BSB_OUTFIELD_ERROR_SCRIPT,
  CLIP_HM_BSB_OUTFIELD_BIG_HIT_SCRIPT,
  CLIP_HM_BSB_OUTFIELD_LOSE_COMMAND_SCRIPT,
  CLIP_HM_BSB_OUTFIELD_BENCHED_SCRIPT,
  CLIP_HM_BSB_OUTFIELD_NERVOUS_SCRIPT,
  CLIP_HM_BSB_OUTFIELD_HBP_SCRIPT,
  CLIP_HM_BSB_OUTFIELD_START_SLOW_SCRIPT,
  CLIP_HM_BSB_OUTFIELD_FALL_BEHIND_EARLY_SCRIPT,
];
