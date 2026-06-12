// Golf pregame compositional clips (FV-265) — 3 profile VIZ clips + 30
// hard-moment cells, authored by the content trio + golf-expert under lead
// orchestration from the FV-264 taxonomy (docs/golf-module-map.md). The golf
// analog of clips-baseball.ts. Kept in a sibling file (like clips-baseball.ts)
// to stay out of the clips.ts hot file. Registered into CLIP_SCRIPTS via
// `...GOLF_PREGAME_CLIP_SCRIPTS` in clips.ts.
//
// Per-cell structure mirrors baseball: a standalone hard-moment block of
// [rehearse → scenario → body-feel/false-story → reset → tactical resets →
// truth], wrapped at runtime by the shared opener / VIZ / faith clips. Slug
// scheme: hm-glf-{profile}-{fragment} (baseball owns hm-bsb-, basketball hm-bb-,
// hockey session-). Profiles: Bomber / Ball-Striker / Scrambler. Audio render =
// FV-266 (renders these clips + the 3×10 manifest templates + MANIFEST_VERSION).
//
// CLINICAL GATE (FV-264 §6): the three `first-tee` cells (the shank / putting-
// yips / feel-deserting umbrella) are authored carefully here but WITHHELD from
// the athlete's picker via GOLF_CONFIG.roleAdversities until clinical-advisor
// sign-off (the FV-119 / baseball-yips precedent). They never name "the shank"
// or "the yips," keep the motor failure as a false story to reject, anchor
// identity, and route the real fix to the athlete's coach.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import {
  BALLSTRIKER_VIZ,
  BOMBER_VIZ,
  SCRAMBLER_VIZ,
} from "./segments-golf.ts";

// Same target as CLIP_LOUDNORM_FILTER in clips.ts. Defined locally to avoid a
// circular import (clips.ts imports GOLF_PREGAME_CLIP_SCRIPTS from here).
const GOLF_LOUDNORM_FILTER = "loudnorm=I=-16:TP=-1.5:LRA=11";

// ── Golf VIZ clips — one per profile (FV-265) ────────────────────────────────

export const CLIP_VIZ_BOMBER_SCRIPT: AudioScript = {
  slug: "viz-bomber",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [...BOMBER_VIZ],
};

export const CLIP_VIZ_BALLSTRIKER_SCRIPT: AudioScript = {
  slug: "viz-ballstriker",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [...BALLSTRIKER_VIZ],
};

export const CLIP_VIZ_SCRAMBLER_SCRIPT: AudioScript = {
  slug: "viz-scrambler",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [...SCRAMBLER_VIZ],
};

// ── Bomber (10) ──

export const CLIP_HM_GLF_BOMBER_THREE_PUTT_SCRIPT: AudioScript = {
  slug: "hm-glf-bomber-three-putt",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You smoked the drive and left yourself a flick in for two. Then you race the first putt eight feet by, miss the comebacker, and tap in for bogey. You walk off the green shaking your head.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Jaw tightens. The putter feels heavy in your hands. Your eyes stay locked on the hole you just gave away. All that work off the tee, for nothing.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That hole is over and it's already on the card. The walk to the next tee is your reset. Take it one breath at a time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The tee shot was never the problem and it isn't the answer either. Don't go chase the three back with a bigger swing. Same tempo, smart line, commit to the next shot.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That three-putt is real and it is over. It is not your identity. You're secure before this round and after it — play the next shot free, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH (FV-264 §6): the compound blow-up cell. Authored to BREAK THE COMPOUND,
// not to relive it. Ships on the standard picker; the HIGH flag is an
// emotional-intensity note for the clinical pass.
export const CLIP_HM_GLF_BOMBER_BLOW_UP_SCRIPT: AudioScript = {
  slug: "hm-glf-bomber-blow-up",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Reachable par-5, you bombed the drive, and you go for it in two. The long iron leaks into the hazard. You drop, chunk the next one, and walk off with a seven on a hole you thought was a birdie.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat climbs up your neck. Your hands strangle the grip. You replay the greedy second shot on a loop. I always blow up the big hole. That's the anger talking, not the truth. Let it move through.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here is the move. The triple is on the card — it is not on you, and it does not get the next hole. Sign it later. Right now it is over.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One bad hole becomes a bad nine when you press to win it all back at once. Don't. The walk to the next tee ends this hole. New hole, new number, one shot.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stand on that next tee and play the percentages. The smart shot now is worth more than the hero shot you wish you'd hit back there. Pick the club that finds the fairway and commit.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That blow-up hole is real and it is over. It is not who you are, and it doesn't change what you're worth — you compete from a victory that's already yours, seven or birdie. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH (FV-264 §6): OB / stroke-and-distance spiral. The collapse reflex is
// swinging HARDER to make the lost yards back; the reframe takes the medicine.
export const CLIP_HM_GLF_BOMBER_OB_SCRIPT: AudioScript = {
  slug: "hm-glf-bomber-ob",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Pressure ratchets up and the two-way miss shows up. You snap one dead left, out of bounds. You re-tee, hitting three, stroke and distance, with the whole group watching you reload.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Pulse pounds in your ears. Your grip pressure spikes for the re-tee. Everything in you says swing harder, get the yards back right now. I have to make up for that, fast.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That ball is gone and the penalty is already counted. There is nothing to win back on this swing — there is only this swing. Step off, breathe, and re-tee like it's the first ball of the day.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take your medicine. The fastest way home is the fairway, not the hero recovery. If you're already in trouble, pitch out, take your one shot, and walk off with a number you can live with.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That OB is real and it is over. It is not your identity. The lost yards don't lower your worth — you're secure before the re-tee and after it. Smart swing, in play. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_BOMBER_DUFF_CHIP_SCRIPT: AudioScript = {
  slug: "hm-glf-bomber-duff-chip",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You missed the green and you're short-sided, no green to work with. You set up over the little chip, decelerate, and chunk it — the ball barely moves, still short of the putting surface.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach sinks. Your wrists go stiff and quick. You can't look at your playing partners. I have no hands when it actually matters.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That chip is over. You still have one in your hand. Walk up to the ball, reset your feet, and pick a clean landing spot.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't try to be a hero to erase the chunk. Soft hands, accelerate through the ball, land it on your spot and let it run. Get it on the green and take your putt.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. One chunked chip is real and it is over. It is not who you are. You're secure no matter how this one comes off the face — commit to it, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_BOMBER_SHORT_PUTT_SCRIPT: AudioScript = {
  slug: "hm-glf-bomber-short-putt",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You bombed it down there and stuffed the approach to four feet. The birdie putt is right there. You pull it, the ball slides past the edge, and you tap in for a par that feels like a loss.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your shoulders slump over the hole. The putter feels foreign in your hands. I do the hard part and miss the easy one — what is the point.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That putt is over and the par is on the card. Pull the ball out of the cup, walk to the next tee, and let the green go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't go to the next tee swinging out of your shoes to make a birdie back. The four-footer doesn't owe you the long ball. Same routine, same line, one committed stroke.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That missed putt is real and it is over. It is not your identity. You don't have to earn your standing on the next hole — you already have it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠⚠ CLINICALLY GATED (FV-264 §6): practice-to-play gap on the first tee.
// WITHHELD from the picker via GOLF_CONFIG.roleAdversities until clinical-advisor
// sign-off (FV-119 / baseball-yips precedent). Treats the motor failure as a
// false story to reject, NEVER names "shank" or "yips," anchors identity, and
// routes the real fix to the athlete's coach. No attempt to "fix" the miss on
// the tee. De-escalating throughout.
export const CLIP_HM_GLF_BOMBER_FIRST_TEE_SCRIPT: AudioScript = {
  slug: "hm-glf-bomber-first-tee",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "On the range an hour ago, you were flushing driver. Now you're on the first tee with the group watching, and the same swing comes off cold — a top, a wipe off the planet, nothing like the range.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your hands go cold and a little unsure. Your breath sits high in your chest. The thought arrives fast: my swing left me on the one tee that matters. Let it arrive. It's a feeling in this moment, not a fact about you.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That tee shot is over. This is the gap between the range and the first tee — it happens to real players, and it is happening to your hands today, not to who you are. Breathe out, and let it be just one swing.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to fix your swing standing here. Slow your pre-shot routine all the way down, pick one small target, and make an easy, committed pass — no harder, just smoother. Then walk and let the round settle you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That cold first swing is real, and it is over. It is not a verdict on you, and it is not your identity — you're secure before you ever tee it up. Take what's bugging you to your coach this week and work the mechanics there. For now, reset and play the next shot.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_BOMBER_OUTPLAYED_SCRIPT: AudioScript = {
  slug: "hm-glf-bomber-outplayed",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You step on the tee and rip it. Then your playing partner steps up and matches you, dead center, every hole — same length and he keeps it in play all day. The one edge you count on, gone.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest tightens watching his ball fly. You start trying to out-hit him on every tee. If I'm not longer than him, what am I out here.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "His drives are his round, not yours. You don't play him, you play the course and your number. Bring your eyes back to your own ball and your own line.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't reach for ten extra yards to answer him — that's how the wheels come off. Hit your shot, play your game, and let his round be his. The card only asks for your number.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting outdriven is real, and it stings. It is not your identity, and your length was never the thing that named you. You're more than your driver. Play your own game, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_BOMBER_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-glf-bomber-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "First tee, driver in your hands, the starter and the next group standing right there, waiting on the tee. You stand over the ball and the only thought is the big miss — the snipe left, the block right, in front of everybody.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart thumps. Your hands buzz on the grip. Your stomach is light. What if I hit the big one right here, with all of them watching.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath, let the buzz settle into your feet, and step into your routine.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't try to kill it. You don't need your hardest swing here — you need your shot. Pick a target down the left side, make a smooth pass, and just start it on line.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The crowd doesn't get to name you and neither does this tee shot. Smooth swing, start it on line, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_BOMBER_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-glf-bomber-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You come out of the gate chasing the perfect tee shot and you can't find it. A pulled drive, a scramble, a bogey. Then a wild one and a double. Two holes in, you're already three over.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your grip is white-knuckle tight. Your tempo is racing ahead of you. I have to settle the driver before it buries this whole round.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those two holes are over and there are plenty left. A slow start is just a start, not the round. Step on this tee and let it be a fresh hole.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop trying to swing your way back to even with one huge drive. Slow your tempo, take the club that finds the fairway, and play this one hole. The round settles when you do.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow start is real and it is over. It is not your identity. You don't have to rescue the round to be secure — you already are. One smooth swing, one hole, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_BOMBER_FALL_BEHIND_SCRIPT: AudioScript = {
  slug: "hm-glf-bomber-fall-behind",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You do the math on the back of the card and you're well over your number. So you reach for driver on every tee and take dead aim at every flag, trying to claw it all back by yourself.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw is locked. You're swinging faster every hole. Every shot becomes a hero shot. I have to make this all up right now, single-handed.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop staring at the total. The number doesn't come back in one heroic hole — it comes back in pars, one at a time. Bring your focus down to just this shot.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The hero line is exactly the wrong play when you're chasing. Take the fairway, take the fat part of the green, and make your pars. Let the round come to you instead of forcing it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Being behind your number is real. It is not your identity, and the scorecard doesn't get to name you. Play smart pars, one shot at a time, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Ball-Striker (10) ──

export const CLIP_HM_GLF_BALLSTRIKER_THREE_PUTT_SCRIPT: AudioScript = {
  slug: "hm-glf-ballstriker-three-putt",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You striped an iron in to twenty feet, dead at the flag. Then you race the first putt four feet by, and you miss the comebacker. Three-jack. A green you flushed, and you walk off with bogey.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Jaw tightens. The grip chokes the putter on the walk off. And the voice starts up — I hit sixteen greens and I'm shooting seventy-five. I got robbed. That's the injustice talking, not the truth. Let it go.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That hole is over. It's in your pocket and it doesn't get the next tee. Walk to the box and breathe out.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Drop the scorecard math. You're not owed a number — you're playing the next shot. Small target, one smooth swing, and let the three-putt go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The three-putt is real and it is over. It is not your identity, and the number on the card isn't your worth. You're secure before this round and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH (FV-264 §6): compound blow-up. BREAK THE COMPOUND. Standard picker.
export const CLIP_HM_GLF_BALLSTRIKER_BLOW_UP_SCRIPT: AudioScript = {
  slug: "hm-glf-ballstriker-blow-up",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "One loose swing puts you in the trees. The smart play is to pitch out. But you won't accept the bogey, so you go for the gap — and clip a branch back into deeper trouble. Now you're scrambling for double, maybe worse.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat climbs into your chest. The grip strangles the club. Breath goes short and quick. And the thought lands flat — one bad swing and the whole round's gone. That's the spiral talking. It is not a fact. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That swing is over. The trouble is in front of you now, not the swing that put you there. Stop the bleeding right here.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take your medicine. Accept the bogey. Pick the safe gap back to the short grass, smallest target you can find, and chip out clean. One swing in play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One bad hole is one bad hole. It does not get to write the round, and it does not write you. Get the ball back in the fairway and play the next shot from there.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The blow-up is real and it is over. It is not your identity, and one number on the card doesn't name you. You're secure no matter what this hole costs. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_BALLSTRIKER_OB_SCRIPT: AudioScript = {
  slug: "hm-glf-ballstriker-ob",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You flush it for a living, and then one leaks dead right and crosses the white stakes. Out of bounds. Stroke and distance. You're re-teeing, already lying three before the hole has even started.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Stomach drops watching it sail. Hands go stiff reaching for another ball. And the voice shows up — that's not who I am, I don't hit it there. Hear it for what it is. It's one swing, not a verdict.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That ball is gone. It's a penalty, not a referendum on your swing. Tee another one and breathe.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't steer the re-tee. Trust the swing you own. Pick a small target down the fairway and make one committed pass.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The wild one is real and it is over. It is not who you are, and one swing doesn't move your worth. Tee it up, commit, and play the next shot clean.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_BALLSTRIKER_DUFF_CHIP_SCRIPT: AudioScript = {
  slug: "hm-glf-ballstriker-duff-chip",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You missed the green — rare for you — and now you're standing over a chip you resent even needing. You decelerate, catch it fat, and the ball trickles a few feet. Still short-sided. Still not up and down.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Ears go hot. The hands fidget on the wedge. And the thought lands flat — I shouldn't even be down here. That's the resentment talking. It doesn't help you hit the next one.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That chip is over. You're here now, not where you wish you were. Read the lie in front of you and breathe out.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop fighting being down here. The up-and-down is gone — now protect the bogey so it doesn't become a double. Pick a landing spot and make one committed stroke, accelerating through the ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The duffed chip is real and it is over. It is not your identity. Accept the spot you're in, commit to the next one, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_BALLSTRIKER_SHORT_PUTT_SCRIPT: AudioScript = {
  slug: "hm-glf-ballstriker-short-putt",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You flushed it to four feet. A kick-in for birdie, the reward for striping it all day. You stand over it, push it, and it slides past the edge. The proximity earned nothing.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. The shoulders slump over the ball. The hands go tight on the grip. And the voice cuts in — what's the point of striping it if the putter gives it all back. That's the bitterness talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That putt is over. The ball-striking didn't owe you the make — both are just shots. Walk to the next tee and let it go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Quit grading your swing by the putter. Next green: pick your start line, trust your speed, and roll one ball at a time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The missed short one is real and it is over. It is not your identity, and a putter that went cold doesn't lower your worth. You're secure either way. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠⚠ CLINICALLY GATED (FV-264 §6): practice-to-play / motor-failure cell.
// WITHHELD from the picker via GOLF_CONFIG.roleAdversities until clinical-advisor
// sign-off (FV-119 / baseball-yips precedent). Never names "the shank" or "the
// yips"; motor failure stays a false story to reject; anchors identity; routes
// mechanics to a coach; no attempt to fix the miss on the tee.
export const CLIP_HM_GLF_BALLSTRIKER_FIRST_TEE_SCRIPT: AudioScript = {
  slug: "hm-glf-ballstriker-first-tee",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "First tee, strangers watching, your name just called. The swing you've made ten thousand times on the range is the one thing you live on — and standing here, you can't feel where it is.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. The grip goes tight. The hands feel far away, like they're not quite yours. The breath goes shallow. And the thought shows up fast — if I can't trust the swing, I have nothing. That's the feeling in this moment. It is not a fact about you.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "This is happening to your hands right now, on this tee. It is not a verdict on you, and it is not the swing you own. It's nerves on the first tee, nothing more.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to fix anything here. Soften the grip, breathe out long, pick the widest target you've got, and let an easy swing go. The mechanics are a coach's job for the range, not yours on this tee.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The first-tee nerves are real, and they pass. They are not your identity, and they are not your worth. You are secure standing here, however this swing comes off. Breathe, pick your target, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH (FV-264 §6): injustice rumination — "I'm the better player and I lost."
export const CLIP_HM_GLF_BALLSTRIKER_OUTPLAYED_SCRIPT: AudioScript = {
  slug: "hm-glf-ballstriker-outplayed",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You out-struck him all day. He sprayed it everywhere and got up and down from spots that should've cost him. You sign for the higher number. He's shaking hands and you're standing there knowing you hit it better.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Jaw clamps. A slow burn in your chest signing the card. And the voice keeps grinding — I'm the better player and I lost. I did everything right and it didn't count. That's the resentment talking. Let it run out.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That round is over and the card is signed. He shot the lower number today — that's golf, and it's only today. Shake his hand and mean it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Let the injustice story go. The score isn't a referee on your swing. Take what's real — your ball-striking held — and go sharpen the short game that beat you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Losing today is real, and so is how well you struck it. The number is not your identity, and being beaten doesn't name you. You're secure win or lose. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_BALLSTRIKER_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-glf-ballstriker-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "It's the round that counts, and you're standing on the first fairway already protecting the number. Every swing feels like it has to be perfect. One loose one and you think the whole card is gone.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Chest tightens. The grip squeezes before you take it back. Breath goes shallow over the ball. I just can't make a mistake today. That's the fear talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You're chasing one clean number, not a flawless round. There's only this shot. Step into your routine and breathe out.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Let the swing be the swing. The nerves are just energy — soften the grip, pick a small target, and make one smooth pass. You're allowed to miss one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real and the round matters. They are not your identity. One shot at a time, let the swing go, and play from secure. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_BALLSTRIKER_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-glf-ballstriker-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "First couple holes, one iron comes off the toe and finds a bunker. Not even a bad number — just one loose contact. And the perfectionism alarm is already screaming about the whole front nine.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders tense between shots. The grip pressure creeps up. The mind races ahead — here we go, my swing's off, it's going to be one of those days. That's the alarm talking. It's one swing, not a forecast.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That swing is over. One loose iron is information, not a sentence on the round. Walk to the next shot and breathe.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't audit your whole swing on the second hole. Small target, one smooth pass, and let the loose one go. The round is long.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. One loose iron is real and it is over. It is not your identity, and it doesn't decide the next seventeen holes. Reset your target and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_BALLSTRIKER_FALL_BEHIND_SCRIPT: AudioScript = {
  slug: "hm-glf-ballstriker-fall-behind",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're a few over, well back of the number you need, and you can feel the precision starting to curdle. You stop playing the fat of the green. You aim at a tucked flag you should be playing away from, trying to get it all back with your irons.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. The hands grab at the grip. The swing gets quick and grabby. And the thought drives it — I have to get it all back right now, with my irons. That's the pressing talking. It's how good ball-striking goes wrong.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The deficit is real, but it doesn't come back on one hero swing. Step off, breathe, and pick the smart target.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Aim at the center, not the flag. Play your shot, stack a few smooth swings, and let the pars do the work. The number comes back one good shot at a time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Being behind is real, but it is not ultimate, and it is not your identity. Trust the swing you own, play smart targets, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Scrambler (10) ──

// ⚠ HIGH (FV-264 §6): identity-collapse — "if I can't putt, I've got nothing."
export const CLIP_HM_GLF_SCRAMBLER_THREE_PUTT_SCRIPT: AudioScript = {
  slug: "hm-glf-scrambler-three-putt",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You lag the first putt to four feet — routine. You pull the next one, it slides by, and now you're standing over a three-footer coming back. You tap it in for three. A three-jack, on the green, where you never give them away.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Hands go cold over the ball. Stomach drops walking off the green. Breath gets shallow. If I can't putt, I've got nothing — the putter was the whole thing.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That hole is over. Walk to the next tee, take one breath, and play the next hole on its own.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One three-putt isn't a verdict on your stroke. See the line, free up your hands, good speed. The next short one is a fresh chance to roll it pure.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That three-putt is real and it is over. It is not your identity. The putter comes and goes; your worth never did — it was settled before you ever stood over a putt. Pick your line and roll the next one. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_SCRAMBLER_BLOW_UP_SCRIPT: AudioScript = {
  slug: "hm-glf-scrambler-blow-up",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're in trouble off the tee — usual story, and usually you escape with bogey. But the punch-out catches a branch, the next one's fat, the chip runs long, and you walk off with a triple on the card. The save just didn't come.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Jaw clenches on the walk. Grip squeezes the club. Heat climbs your neck, and the voice wants the next shot to win it all back. I always find a way — except this time I didn't. That's the blow-up talking. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That hole is done — it stays on that card and it goes no further. Break the compound right here. The next tee shot is its own shot, nothing to make up.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop chasing it back. Pick the smart play, commit, and swing easy. One good shot in the fairway is how the bleeding stops. The next save is still there for you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That triple is real and it is over. It is not your identity. One number does not say who you are — you are secure before this shot and after it. Play the smart one and move on. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_SCRAMBLER_OB_SCRIPT: AudioScript = {
  slug: "hm-glf-scrambler-ob",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Long par four, a course that makes you hit driver — the club you don't trust. You step up, the swing feels loose, and you watch it sail right, over the stakes. Out of bounds. You're re-teeing, hitting three.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders tighten reaching for another ball. Throat goes dry. Hands feel unsure on the grip. I can't scramble from out of bounds — this is the part of my game that isn't there.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That ball is gone and that swing is over. Tee the next one and give it a clear, simple target down the fairway.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't need the perfect drive — you need it in play. See the shot, soft grip, smooth tempo, and trust it. Get it in the short grass and you'll save the rest, like you always do.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That tee shot is real and it is over. It is not your identity. The big stick coming and going does not move your worth — that was secure before you pulled driver. One ball in play, then go to work. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH (FV-264 §6): identity-collapse — the save fails at the Scrambler's
// core. "★ the up-and-down is the one thing I do."
export const CLIP_HM_GLF_SCRAMBLER_DUFF_CHIP_SCRIPT: AudioScript = {
  slug: "hm-glf-scrambler-duff-chip",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Short-sided in the rough, the kind of up-and-down you live for. You set up over it — and you catch it heavy. The ball moves two feet. The chip you make in your sleep, duffed, with the green right there in front of you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Stomach drops. Hands go numb on the wedge. Face goes hot standing over it again. The up-and-down is the one thing I do — and I just missed it. If that's gone, what do I have? That's the miss talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That chip is over — one swing tonight, not the thousands you've holed. Step to the next one and read the shot fresh.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't grab the wedge tighter to make it perfect. Soft hands, see the landing spot, let the bounce do the work. The next short shot is a fresh chance to save it clean.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That duffed chip is real and it is over. It is not your identity — the short game is something you do, not the whole of who you are. Your worth held when the wedge let you down. Soft hands, see the shot, and save the next one. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_SCRAMBLER_SHORT_PUTT_SCRIPT: AudioScript = {
  slug: "hm-glf-scrambler-short-putt",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You've got three feet for par to save the hole. Your bread and butter. You read it, set the line, make your stroke — and you pull it. It slides under the hole, never touches the cup. A short one, the kind you make in your sleep, just missed.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Hands go still and cold over the next one. Brow tightens. Breath holds. Those are automatic for me — what's happening, where did the feel go.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That putt is over. Mark it, breathe, and walk to the next tee clean.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One miss doesn't take your stroke. See the line, soft hands, good speed, let it roll. The next short one is a fresh chance to pour it in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That miss is real and it is over. It is not your identity. The feel comes and goes hole to hole; your worth does not. Read the next one, trust your stroke, and roll it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠⚠ CLINICALLY GATED (FV-264 §6): touch-and-feel-vanishing cell. WITHHELD from
// the picker via GOLF_CONFIG.roleAdversities until clinical-advisor sign-off
// (FV-119 / baseball-yips precedent). Frames the practice-to-play gap as a
// PASSING FEELING to reject, never a condition. Never names "the shank" / "the
// yips" / "the putting yips." No attempt to fix the feel on the tee; reframe =
// identity-anchoring + work it with the coach.
export const CLIP_HM_GLF_SCRAMBLER_FIRST_TEE_SCRIPT: AudioScript = {
  slug: "hm-glf-scrambler-first-tee",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "First tee, strangers watching, your name just called. On the range the soft hands were right there. Now you stand over a little pitch and the touch you had an hour ago feels far away — the feel just isn't where it was.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Hands go tight and unsure on the grip. Breath gets shallow. The feel that was there on the range has gone quiet — and the voice says my hands won't do it. That's the feeling in this moment. It is not a fact about you.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "This shot is just this shot. You don't have to chase the range feel back right now. Breathe out, pick a simple, safe shot, and let it go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "This is happening to your hands. It is not a verdict on you, and it is not yours to fix standing on the tee. Take what the course gives you here, and take the feel to your coach to work — that is where it gets sorted, not under the gun.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The feel being off right now is real, and it will pass. It is not your identity, and it is not a verdict on you. You are secure before this shot and after it, hands cold or warm. Play the simple one and keep walking. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_SCRAMBLER_OUTPLAYED_SCRIPT: AudioScript = {
  slug: "hm-glf-scrambler-outplayed",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your playing partner has striped it all day — fairways, greens, pin high every time. You've been grinding out saves from everywhere, scrambling to stay close, playing defense the whole round. And you're still waiting for it to catch up to you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders ride up watching his ball fly. Jaw sets on every walk. Chest tightens. I'm getting out-struck all day — sooner or later they're going to find me out.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "His ball isn't your business. Play your number, your shot, your card — that's the only game you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Scrambling isn't surviving — it's a skill, and it's yours. See the shot, soft hands, good speed, get it up and down. Every save you make is a real shot scored. Keep stacking them.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting out-struck today is real and it is over each hole you finish. It is not your identity. How he hits it does not name you, and there is no one to be found out as — you were never hiding. Play your game. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_SCRAMBLER_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-glf-scrambler-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're on the range before the round, hitting little chips and putts, hunting for the feel. Some are crisp, some aren't. And the dread creeps in before you've even teed off: what if the touch isn't there today.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Stomach knots over a warm-up putt. Hands check the grip again and again. Breath goes shallow. If the feel isn't here, I've got nothing today.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You can't will the feel into your hands before the first tee. Stop auditing it. Breathe, and trust that it shows up shot by shot, the way it always has.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't need it perfect — you need it in play. See the shot, soft hands, good speed, and let it go. Get the ball moving and you'll save the rest as you go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and the feel comes and goes — that's the game. They are not your identity. Your worth isn't riding on whether the magic shows up today; it was settled long before the first tee. Play the shot in front of you. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_SCRAMBLER_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-glf-scrambler-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Three holes in, you've already missed two greens and the saves haven't dropped. A chip runs eight feet by, the par putt slides past. Normally one falls early and you settle in — and it just hasn't come yet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Grip tightens on the wedge. Shoulders climb. Breath gets short. I need one to fall just to feel like myself out here.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those holes are over. There's a long way to go. Walk to the next shot and play it on its own.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't need a save to feel like yourself — you already are yourself. See the shot, soft hands, good speed, commit. The next one is a fresh chance to drop one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow start is real and it is over. It is not your identity. You don't have to earn your way back to feeling like yourself — that was never on the line. Play the next shot free. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GLF_SCRAMBLER_FALL_BEHIND_SCRIPT: AudioScript = {
  slug: "hm-glf-scrambler-fall-behind",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Long, demanding course — the kind that tests the ball-striking, with no easy bailouts to scramble from. You glance at the number and you're well over, behind where you need to be. A track that won't let you save your way around it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Chest goes tight standing on the tee. Hands grip down hard. Breath goes shallow. I'm in over my head here — this is where I get found out.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The number on the card is behind you. It's not playing the next shot — you are. Step up and play this one shot, right here.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Play your game, not the scoreboard's. See the shot, soft hands, good speed, commit to the smart target. One shot, then the next. The course doesn't get to name you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Being behind the number is real, and there is no one here to be found out as. It is not your identity. Your worth is not on this card — it was secure before the first tee and it holds at the last. Play one shot, your game. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const GOLF_PREGAME_CLIP_SCRIPTS: AudioScript[] = [
  CLIP_VIZ_BOMBER_SCRIPT,
  CLIP_VIZ_BALLSTRIKER_SCRIPT,
  CLIP_VIZ_SCRAMBLER_SCRIPT,
  // Bomber (10)
  CLIP_HM_GLF_BOMBER_THREE_PUTT_SCRIPT,
  CLIP_HM_GLF_BOMBER_BLOW_UP_SCRIPT,
  CLIP_HM_GLF_BOMBER_OB_SCRIPT,
  CLIP_HM_GLF_BOMBER_DUFF_CHIP_SCRIPT,
  CLIP_HM_GLF_BOMBER_SHORT_PUTT_SCRIPT,
  CLIP_HM_GLF_BOMBER_FIRST_TEE_SCRIPT,
  CLIP_HM_GLF_BOMBER_OUTPLAYED_SCRIPT,
  CLIP_HM_GLF_BOMBER_NERVOUS_SCRIPT,
  CLIP_HM_GLF_BOMBER_START_SLOW_SCRIPT,
  CLIP_HM_GLF_BOMBER_FALL_BEHIND_SCRIPT,
  // Ball-Striker (10)
  CLIP_HM_GLF_BALLSTRIKER_THREE_PUTT_SCRIPT,
  CLIP_HM_GLF_BALLSTRIKER_BLOW_UP_SCRIPT,
  CLIP_HM_GLF_BALLSTRIKER_OB_SCRIPT,
  CLIP_HM_GLF_BALLSTRIKER_DUFF_CHIP_SCRIPT,
  CLIP_HM_GLF_BALLSTRIKER_SHORT_PUTT_SCRIPT,
  CLIP_HM_GLF_BALLSTRIKER_FIRST_TEE_SCRIPT,
  CLIP_HM_GLF_BALLSTRIKER_OUTPLAYED_SCRIPT,
  CLIP_HM_GLF_BALLSTRIKER_NERVOUS_SCRIPT,
  CLIP_HM_GLF_BALLSTRIKER_START_SLOW_SCRIPT,
  CLIP_HM_GLF_BALLSTRIKER_FALL_BEHIND_SCRIPT,
  // Scrambler (10)
  CLIP_HM_GLF_SCRAMBLER_THREE_PUTT_SCRIPT,
  CLIP_HM_GLF_SCRAMBLER_BLOW_UP_SCRIPT,
  CLIP_HM_GLF_SCRAMBLER_OB_SCRIPT,
  CLIP_HM_GLF_SCRAMBLER_DUFF_CHIP_SCRIPT,
  CLIP_HM_GLF_SCRAMBLER_SHORT_PUTT_SCRIPT,
  CLIP_HM_GLF_SCRAMBLER_FIRST_TEE_SCRIPT,
  CLIP_HM_GLF_SCRAMBLER_OUTPLAYED_SCRIPT,
  CLIP_HM_GLF_SCRAMBLER_NERVOUS_SCRIPT,
  CLIP_HM_GLF_SCRAMBLER_START_SLOW_SCRIPT,
  CLIP_HM_GLF_SCRAMBLER_FALL_BEHIND_SCRIPT,
];
