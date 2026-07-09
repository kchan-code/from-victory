// Track & Field pregame compositional clips (FV-TRF, v2 DORMANT) — 5 event-group
// VIZ clips + 38 hard-moment cells, authored by the content trio + a standing
// track coach from the docs/track-field-module-map.md taxonomy. The track analog
// of clips-golf.ts / clips-swimming.ts. Kept in a sibling file to stay out of the
// clips.ts hot file. Registered into CLIP_SCRIPTS via
// `...TRACKFIELD_PREGAME_CLIP_SCRIPTS` in clips.ts. Audio render is DEFERRED
// (the sport is DORMANT) — this file is the TTS INPUT, no MP3s yet.
//
// Per-cell structure mirrors golf/swimming: [rehearse → scenario →
// body-feel/false-story → reset → tactical → truth]. Slug scheme
// hm-trf-{group}-{fragment}. Event groups: Sprinter / Distance / Hurdler /
// Jumper / Thrower. Compositional-only (golf model). 38 distinct cells; the 2
// no-height cells (Jumper/Thrower) are authored but WITHHELD from the picker
// (TRACKFIELD_CONFIG.roleAdversities) until clinical sign-off.
//
// CLINICAL (the no-height cells): the fouling-out / runway-balk spiral — authored
// to treat the motor failure as a FALSE STORY to reject, anchor identity, and
// route the mechanics fix to the coach. They NEVER name "the yips"/"the balk".
// SAFETY: no body-composition / weight / RED-S language anywhere (distance +
// jumps are RED-S-adjacent).

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import {
  SPRINT_VIZ,
  DIST_VIZ,
  HURDLE_VIZ,
  JUMP_VIZ,
  THROW_VIZ,
} from "./segments-trackfield.ts";
import { CLIP_LOUDNORM_FILTER } from "./loudnorm";

// ── Track & Field VIZ clips — one per event group ────────────────────────────

export const CLIP_VIZ_TRF_SPRINT_SCRIPT: AudioScript = {
  slug: "viz-trf-sprint",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...SPRINT_VIZ],
};

export const CLIP_VIZ_TRF_DIST_SCRIPT: AudioScript = {
  slug: "viz-trf-dist",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...DIST_VIZ],
};

export const CLIP_VIZ_TRF_HURDLE_SCRIPT: AudioScript = {
  slug: "viz-trf-hurdle",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...HURDLE_VIZ],
};

export const CLIP_VIZ_TRF_JUMP_SCRIPT: AudioScript = {
  slug: "viz-trf-jump",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...JUMP_VIZ],
};

export const CLIP_VIZ_TRF_THROW_SCRIPT: AudioScript = {
  slug: "viz-trf-throw",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...THROW_VIZ],
};

// ── Hard-moment cells — Sprinter + Distance + Hurdler ──

// ── Sprinter (8) ──

// ⚠ HIGH: erasure — the race is gone before a step is run. Authored to keep the
// false start a single event that is over, not a verdict. Adds a 4th tactical
// beat (golf compound precedent). Ships on the picker.
export const CLIP_HM_TRF_SPRINT_FALSE_START_SCRIPT: AudioScript = {
  slug: "hm-trf-sprint-false-start",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The gun cracks and your body twitches a hair early. Then a second shot. The official's arm comes up and points down your lane. You're out — months of work erased before you ran a single step.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat floods up your neck as you straighten up out of the blocks. Your hands shake. And the voice lands flat — I never even got to run, and now it's gone. That's the shock talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That call is made and it cannot be undone. Standing on the track arguing it in your head only carries it into the next race. Breathe out long, drop your shoulders, and let this one go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take the lesson, not the spiral. Next time you set in the blocks, get still and wait for the gun — weight settled, eyes down the track, move only on the shot. You can't jump what you don't anticipate.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "All that training is still in you and it isn't going anywhere. The work didn't disappear with the call — it's in your legs, ready for the next gun.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That false start is real and it is over. It is not your identity. A race you never got to run cannot name you — your worth was settled before you ever stepped into the blocks. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_SPRINT_HANDOFF_SCRIPT: AudioScript = {
  slug: "hm-trf-sprint-handoff",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're flying into the exchange zone and you reach back for the stick. It isn't there. The timing breaks, the pass dies in your hand, and three teammates' race dies with it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach drops as your hand closes on nothing. You can't look at the relay. And the voice lands flat — I cost everyone, I ruined it for the whole team. That's the guilt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That exchange is over and it's behind you on the track. The catastrophe in your head — I ruined everything — isn't real, and your teammates are still your teammates. Breathe out long and let it be done right now.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take it to your next handoff. Run your acceleration, trust the call, reach back on the cue and feel the stick hit your palm. An exchange is won in the rhythm, not the panic — settle it and own your leg.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That blown handoff is real and it is over. It is not your identity, and one bad exchange doesn't decide whether you belong on this relay — you're secure before the pass and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_SPRINT_OUT_LEANED_SCRIPT: AudioScript = {
  slug: "hm-trf-sprint-out-leaned",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You ran dead even with them the whole hundred. You hit the line together, you throw your chest, and the photo says you lost by inches. Second, by a lean.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest heaves past the line. Your eyes lock on the place beside your name. And the voice lands flat — I had them and I gave it away at the tape. That's the sting talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the time is on the board. Walk it off on the infield and let one long exhale settle you. You have more racing today.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't replay the tape on a loop. Take it to your next race instead — run all the way through the line, drive your last steps, time the lean so you win the last inch instead of giving it away.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That lean at the line is real and it is over. It is not your identity. The tape reports a race, but it cannot name a runner — you're secure before the finish and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_SPRINT_BAD_HEAT_SCRIPT: AudioScript = {
  slug: "hm-trf-sprint-bad-heat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "They put you in lane one on the tight inside turn while the runner you have to beat drew lane four with the gentle curve. The draw feels rigged against you before the gun even fires.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw tightens looking down the cramped lane. You start running their race in your head instead of yours. And the voice lands flat — the draw beat me before I ran. That's the excuse talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The lane assignment doesn't decide your race — the clock takes everyone's time the same way, lane one or lane four. Breathe out, settle into your blocks, and bring your race no matter what's beside you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Run your own lane, not theirs. Stay low and patient through the tight turn, run the inside line clean, and unload on the straight. A great race out of lane one still crashes the next seeding.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The bad draw is real and it does not define you. It is not your identity. The lane sheet reports where they think you are; it cannot name a runner. Run your own race, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: the wall — form collapses, the field comes back. Adds a 4th tactical
// beat (golf compound precedent). Authored to break the spiral, not relive it.
export const CLIP_HM_TRF_SPRINT_HIT_WALL_SCRIPT: AudioScript = {
  slug: "hm-trf-sprint-hit-wall",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're out front at eighty meters and then your arms turn to concrete. Your form falls apart, your stride shortens, and everyone you passed comes streaming back at you over the last twenty.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your shoulders climb up around your ears. Your arms thrash to find the speed that left. And the voice lands flat — I always tie up at the end, I can't finish. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the time is on the board. Climb down off the effort, walk the infield, and let one long exhale clear it. You have more racing today.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Tying up is a relaxation problem, not a willpower problem. When the burn hits, you don't grip harder — you stay tall and loose: drop the shoulders, relax the face and hands, and let the speed flow instead of forcing it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take it to your next race. Run the first part within yourself so you have something left, then carry your form through the line. Speed comes from staying smooth, not from clenching.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That tie-up is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure however the last fifty came. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_SPRINT_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-trf-sprint-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're walking to the blocks and the stadium goes quiet. The starter is waiting. You settle your feet on the pedals and your legs feel like they belong to someone else.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart slams in your chest. Your hands buzz against the track. Your stomach is light. What if I'm tight off the gun and it's over before I find my speed. That's the fear talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath out behind the blocks, feel your feet on the pedals, and let the buzz settle into power.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to manage the whole race standing here — you just have to react. See the start, drive low out of the blocks, and let your speed come up underneath you. Trust the work. It's already in your legs.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The stadium doesn't get to name you and neither does this race. Settle in the blocks, react to the gun, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_SPRINT_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-trf-sprint-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The gun goes and you're a beat behind everyone. Your first steps are heavy, you come up out of your drive too soon, and you're already buried in the field before you've hit top speed.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. You feel the gap open in front of you. Your stride gets frantic, pressing to claw it back. And the voice lands flat — I lost it on the start, it's already gone. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the slow start is behind you. Walk the infield and let one long exhale clear it. You have more racing today.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Pressing to make it back is exactly what kept you behind. Take it to your next race: react to the gun, stay low and patient through your drive phase, and let the speed build under you. Get out clean so you never have to chase.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow start is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure however you came off the line. Nail the next start, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_SPRINT_OFF_PACE_SCRIPT: AudioScript = {
  slug: "hm-trf-sprint-off-pace",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You hit two hundred of the four hundred feeling great, right on the runner ahead. Then the last hundred the bottom drops out — your legs flood, your turnover dies, and the field swallows you down the home straight.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your legs go to lead and your stride collapses inward. You feel them coming past on both sides. And the voice lands flat — I went out too hard, I always fade. That's the doubt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the fade is behind you. Walk the infield, let one long exhale settle you, and let the home straight go. You have more racing today.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The four hundred is won by pace, not by the first two hundred. Next race, run the opening within yourself, stay tall and relaxed at the two-fifty, and save the gear that carries you through the line. Distribute the effort and the back half holds.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That fade is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure however the last hundred came. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Distance (7) ──

// ⚠ HIGH: the wall — the pace held all year goes impossible mid-race. Adds a 4th
// tactical beat (golf compound precedent). Authored to break the spiral.
export const CLIP_HM_TRF_DIST_HIT_WALL_SCRIPT: AudioScript = {
  slug: "hm-trf-dist-hit-wall",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "At the twelve hundred of the sixteen hundred your legs flood and your lungs close down. The pace you've held all year is suddenly impossible, and the pack you were tucked into starts to inch away.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stride shortens and your shoulders creep up. The lungs scream and the legs go heavy. And the voice lands flat — I'm done, I can't hold this, I'm falling off. That's the pain talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "This is the part of the race you trained for — the wall is the test, not the end. It comes for everyone here, and it's happening to your legs right now, not to who you are. Breathe out long and bring your focus back to this one lap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't try to win it all back at once — that's how a distance race falls apart. Stay tall, relax your face and shoulders, and shorten the race down to the next hundred meters. Just get to the next mark, then the next.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Then ride the bell. When the last lap comes, you don't need a hero surge — you need your rhythm back. Find your turnover, lock onto the runner ahead, and reel them in stride by stride.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That wall is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure whether you held the pace or not. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_DIST_HANDOFF_SCRIPT: AudioScript = {
  slug: "hm-trf-dist-handoff",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "On the distance medley exchange your timing is off. You come in hot, your incoming runner is gassed, you stutter in the zone — and the lead you were handed leaks away in the fumble.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach drops in the bobble of the pass. You can't look at the runner who handed it off clean. And the voice lands flat — I cost everyone, I let the whole relay down. That's the guilt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That exchange is over and you still have a whole leg to run. The catastrophe in your head — I ruined it for everyone — isn't real, and your teammates are still your teammates. Breathe out long and bring your focus to the race in front of you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Run the leg you've still got. Settle into your pace, hunt the runners ahead one at a time, and give your team back the ground in the only place you can — on the track now. A clean leg answers a sloppy exchange.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That blown handoff is real and it is over. It is not your identity, and one bad exchange doesn't decide whether you belong on this relay — you're secure before the pass and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_DIST_OUT_LEANED_SCRIPT: AudioScript = {
  slug: "hm-trf-dist-out-leaned",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You led the whole last lap, you held the front, and you can hear them coming. In the final fifty someone with a fresher gear blows past you, and you cross the line a step behind after leading all the way.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your whole body burns from the front-running. Your eyes lock on the back that just passed you. And the voice lands flat — I did all the work and they stole it at the end. That's the sting talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the time is on the board. Walk it off on the infield and let one long exhale settle you. Leading takes guts — the kick is just a skill you build next.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take it to your next race. If you're going to lead, lead honest and start your drive earlier so there's no gear left to out-kick. Or sit one stride back and time your own finish. Either way, you train the closing speed that beat you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That out-kick at the line is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure before the finish and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_DIST_BAD_HEAT_SCRIPT: AudioScript = {
  slug: "hm-trf-dist-bad-heat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're trapped on the rail in lane one, bodies stacked on your shoulder and a runner right on your back. The pace is winding up, the move is going, and you have nowhere to go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your shoulders tense, hemmed in by the pack. You start to panic, looking for a gap that isn't there. And the voice lands flat — I'm boxed, I'm stuck, the race is leaving without me. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Being boxed is a position, not a verdict — it changes every few strides. Don't spend your race fighting the wall of bodies. Stay relaxed on the rail, hold your rhythm, and wait for the gap to open.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Be patient, then decisive. Ease back a half-step to find the lane, swing wide off the turn when it clears, and go through clean. The runner who keeps their head in the box is the one who's there at the bell.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting boxed in is real and it is over. It is not your identity. The pack reports a moment in a race; it cannot name a runner. Find your gap, run your race, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_DIST_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-trf-dist-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're on the starting line, the field crowds in around you, elbows close. You're not afraid of the race — you're afraid of how much the next few laps are going to hurt. The whole grind is still in front of you, and your stomach is in your throat.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart thumps. Your legs feel heavy already. The mind runs ahead to the worst of it. How am I going to hold pace when it really starts to hurt. That's the dread talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath out on the line, feel your feet under you, and bring your focus to just the first lap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't run the whole race standing here — you can't carry all of it at once. Break it into laps. Settle into pace, hold your rhythm, and take it one lap at a time. You've trained every meter of it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The dread of the distance doesn't get to name you and neither does this race. Settle on the line, run the first lap, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_DIST_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-trf-dist-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The gun goes and the pace crawls. The pack jogs the first lap, you're stuck in the middle of it with nowhere to run, and the leaders start to string out and gap the field while you're trapped behind the crawl.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stride feels choppy and bottled up. The frustration rises as the leaders pull away. And the voice lands flat — the slow start trapped me, the race is gone up front. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A slow first lap is a tactic, not a sentence — the race always comes back together. Don't burn a panicked surge to chase a gap this early. Stay relaxed, hold your position, and let the pace come to you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Move with purpose, not panic. Stay out of the box on the rail, drift up to the leaders over the next lap, and be there when the real racing starts. A slow start rewards the runner who's patient and positioned.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow start is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure however the pace went out. Settle into position, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_DIST_OFF_PACE_SCRIPT: AudioScript = {
  slug: "hm-trf-dist-off-pace",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You glance at your watch at the mile mark and you're four seconds off the split you needed for the standard. The math is already against the time you came here to run, and there's a long way still to go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw tightens doing the math mid-stride. The urge surges to sprint and rip the gap back all at once. I'm off pace, I have to make up the whole gap right now. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Four seconds off is not a hole you dig out of in one lap. Sprinting to erase it now is exactly how a distance race falls apart. Settle, and bring your focus back to your rhythm.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Claw it back in pieces, lap by lap — don't lunge for it all at once. Lock onto your target split, build through the middle, and trust your finish. The time comes back in increments, not in one heroic surge.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Being off pace is real and that moment is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure whether you hit the standard today or not. Settle onto your pace, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Hurdler (9) ──

// ⚠ HIGH: erasure — DQ before the first barrier. Adds a 4th tactical beat (golf
// compound precedent). Authored to keep the false start a single event that is
// over, not a verdict. Ships on the picker.
export const CLIP_HM_TRF_HURDLE_FALSE_START_SCRIPT: AudioScript = {
  slug: "hm-trf-hurdle-false-start",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You break a hair early at the gun. The second shot fires and the official's arm points down your lane. You're disqualified before you ever reached the first barrier — the whole race gone in a twitch.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat floods up your neck as you come out of the blocks. Your hands shake. And the voice lands flat — I never even cleared a hurdle, and now it's over. That's the shock talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That call is made and it cannot be undone. Standing on the track arguing it in your head only carries it into the next race. Breathe out long, drop your shoulders, and let this one go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take the lesson, not the spiral. Next time you set, get still and wait for the gun — weight settled, eyes on the first hurdle, move only on the shot. You can't jump what you don't anticipate.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "All that work on your steps and your trail leg is still in you. The call didn't take your training — it's in your legs, ready for the next gun.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That false start is real and it is over. It is not your identity. A race you never got to run cannot name you — your worth was settled before you ever stepped into the blocks. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_HURDLE_HANDOFF_SCRIPT: AudioScript = {
  slug: "hm-trf-hurdle-handoff",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "On the relay your exchange is sloppy. The timing's off, the stick bobbles between your legs, you fight to hang onto it — and the smooth pass you drilled all season turns into a scramble.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach drops as the stick juggles in your hands. You can't look at your teammate. And the voice lands flat — I cost us the race, I let the whole team down. That's the guilt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That exchange is over and it's behind you. The catastrophe in your head — I ruined it for everyone — isn't real, and your teammates are still your teammates. Breathe out long and let the bobble go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take it to your next handoff. Hit your acceleration, trust the cue, and feel the stick settle clean in your palm. A pass is won in the rhythm, not the grab — settle the exchange and run your leg free.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That blown handoff is real and it is over. It is not your identity, and one bad exchange doesn't decide whether you belong on this relay — you're secure before the pass and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_HURDLE_OUT_LEANED_SCRIPT: AudioScript = {
  slug: "hm-trf-hurdle-out-leaned",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You and the next lane clear the last hurdle dead even and sprint for the line together. You throw everything you have at the tape, and they get the lean. Second, by the length of a chest.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest heaves past the line. Your eyes lock on the place beside your name. And the voice lands flat — I cleared it with them and gave it away at the tape. That's the sting talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the time is on the board. Walk it off on the infield and let one long exhale settle you. You have more racing today.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't replay the tape on a loop. Take it to your next race — clear that last barrier clean and sprint your steps all the way through the line, and time the lean so you win the last inch instead of giving it away.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That lean at the line is real and it is over. It is not your identity. The tape reports a race, but it cannot name a runner — you're secure before the finish and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_HURDLE_FOUL_SCRIPT: AudioScript = {
  slug: "hm-trf-hurdle-foul",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You clip the seventh barrier hard. It cracks against your lead leg, knocks you off your rhythm, and you stumble sideways — out of the race you were winning, fighting just to stay on your feet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stride scatters as you catch your balance. The field pulls past while you reset. And the voice lands flat — I just threw away the whole race on one hurdle. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That hurdle is behind you and there are barriers left. Hitting one is a single mistake, not the whole race. Get your stride back and attack the next one right now.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't chop and reach in fear of the next barrier — that's how you clip another. Find your steps, run tall at the hurdle, and snap the lead leg down. Rhythm beats hesitation, every time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That hit hurdle is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure however that barrier came. Attack the next one, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_HURDLE_BAD_HEAT_SCRIPT: AudioScript = {
  slug: "hm-trf-hurdle-bad-heat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You drew the outside lane, way out wide. You can't see the field to gauge your rhythm off anyone — no one beside you to run with, just you and ten barriers stretching out alone.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your eyes keep darting inward, looking for someone to chase. You feel exposed and alone out there. And the voice lands flat — I can't run blind, the draw beat me. That's the excuse talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The lane assignment doesn't decide your race — the clock takes every time the same way, lane eight or lane four. Breathe out, settle into your blocks, and bring your race no matter who you can see.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You never needed to race anyone else's rhythm — you race the hurdles. Lock onto your own steps, attack each barrier on your count, and run your pattern. Out front and blind is just you against the clock, the way it always was.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The bad draw is real and it does not define you. It is not your identity. The lane sheet reports where they think you are; it cannot name a runner. Run your own steps, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_HURDLE_HIT_WALL_SCRIPT: AudioScript = {
  slug: "hm-trf-hurdle-hit-wall",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Coming off hurdle eight in the four hundred hurdles your legs lock up. The lactic floods in, your steps to the next barrier fall apart, and the stagger you built over the first three hundred evaporates as the field closes.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your legs go to stone and your stride pattern scatters. The barriers seem to rush up too fast. And the voice lands flat — I'm dying, I can't hold my steps, it's all coming back. That's the pain talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "This is the part of the race you trained for — the back-half lockup is the test, not the end. It comes for every four-hundred hurdler, and it's happening to your legs right now, not to who you are. Breathe out and bring your focus to the next barrier.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't panic over the steps when they shorten — that's normal this late. Stay tall, relax your shoulders, and commit hard to the next hurdle. Clear it, get to the one after, and run the race two barriers at a time to the line.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That back-half lockup is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure whether your steps held or not. Attack the next barrier, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_HURDLE_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-trf-hurdle-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're setting in the blocks staring down ten barriers stretching away from you. The first one looks close and tall. Your trail leg feels like it forgot the pattern you've drilled a thousand times.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart slams. Your hands buzz on the track. Your stomach is light. What if I'm off my steps to the first one and the whole rhythm's gone. That's the fear talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath out behind the blocks, feel your feet on the pedals, and let the buzz settle into power.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to think about all ten hurdles standing here — you just have to get to the first one. Drive low out of the blocks, hit your steps to barrier one, and let the pattern take over. Your body knows it. Trust the reps.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The ten barriers don't get to name you and neither does this race. Settle in the blocks, attack the first hurdle, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_HURDLE_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-trf-hurdle-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You come out of the blocks flat. Your steps to the first hurdle are wrong — you're too close, crowded on the barrier — and you have to stutter and chop just to get up and over it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your rhythm jams up at the first barrier. You feel the stutter cost you a beat on the field. And the voice lands flat — my steps are off, the whole race is wrecked now. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the rough start is behind you. Walk the infield and let one long exhale clear it. One bad approach doesn't erase the pattern you own. You have more racing today.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take it to your next race. Drive hard and tall out of the blocks, trust your count to the first barrier, and hit it in stride — when the first hurdle is clean, the whole rhythm follows. Set the pattern early and ride it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Being off your steps early is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure however you came off the line. Nail the next approach, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_HURDLE_OFF_PACE_SCRIPT: AudioScript = {
  slug: "hm-trf-hurdle-off-pace",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Mid-race your three-step pattern between the hurdles falls apart. You're caught between steps at every barrier now, reaching and reaching, jamming the takeoff, fighting the spacing instead of flowing through it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stride goes ragged, stretching for each hurdle. Every barrier feels like a fresh fight. And the voice lands flat — I've lost my rhythm, I can't get it back. That's the doubt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Losing the rhythm is a tempo problem, not a verdict — and you can rebuild it one barrier at a time. Don't fight the whole race in your head. Bring your focus down to the very next hurdle.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Climb back onto the pattern barrier by barrier. Run tall, snap the lead leg down, and re-establish your count to the next one — then the one after that. The rhythm is still in your body; reach back for it stride by stride.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Losing your rhythm is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure whether the pattern held or not. Find your count again, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Hard-moment cells — Jumper + Thrower ──

// ── Jumper (7) ──

export const CLIP_HM_TRF_JUMP_FOUL_SCRIPT: AudioScript = {
  slug: "hm-trf-jump-foul",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You hit the board flying, the jump feels huge, the best one all day. Then you look back and the red flag goes up. Your toe was over the line. No mark — it counts for nothing.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach drops watching that flag. Your eyes stay locked on the board, replaying the steps. And the voice lands flat — my best jump and it doesn't even count. That's the sting talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That jump is over and the flag is up — nothing left to argue. You have attempts left in this round. Walk back to the top of the runway, breathe out long, and let the scratch go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take it one attempt at a time. The distance is clearly in you — you just showed it. Don't pull back scared of the board; settle your steps, trust your mark, and hit it clean on the next attempt.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That scratch is real and it is over. It is not your identity. The board reports an attempt, but it cannot name an athlete — you're secure before the jump and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠⚠ CLINICALLY GATED (withheld until clinical sign-off): the no-height /
// fouling-out spiral. WITHHELD from the picker (authored here, OMITTED from
// TRACKFIELD_CONFIG.roleAdversities) until clinical-advisor sign-off (the
// FV-119 / baseball-yips / golf-first-tee precedent). Names the situation
// (no fair mark / fouling out); treats any "I can't commit to the approach"
// motor failure as a FALSE STORY to reject — NEVER names "the yips," "the
// balk," "choking," or "freezing"; anchors identity ("this is happening to
// your run-up today; it is not a verdict on you"); routes the mechanics fix to
// the COACH, never coaches mechanics in-app; refuses hopelessness.
// De-escalating throughout.
export const CLIP_HM_TRF_JUMP_NO_HEIGHT_SCRIPT: AudioScript = {
  slug: "hm-trf-jump-no-height",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You passed up to a higher mark, and you've missed your first two. Now one attempt stands between you and no mark for the whole meet — and standing at the top, the approach you've run a thousand times suddenly feels far away.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your breath sits high in your chest. Your steps feel unsure, like you can't quite find the start of the run-up. And the thought arrives fast — I can't make myself commit to it. Let it arrive. It's a feeling in this moment, not a fact about you.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow everything down. This is the gap between the warm-up and the one attempt that counts — it happens to real jumpers, and it is happening to your run-up today, not to who you are. Breathe out, and let this be just one attempt.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to fix your approach standing here. Take your medicine — one attempt at a time. Slow your routine all the way down, pick one small target down the runway, and run through it, not at it. Then walk and let the round settle you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. This hard attempt is real, and it is over once you take it. It is not a verdict on you, and it is not your identity — you're secure before you ever step on the runway. Take what's bugging your approach to your coach this week and work it there. For now, reset and run the next one.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_JUMP_OUT_LEANED_SCRIPT: AudioScript = {
  slug: "hm-trf-jump-out-leaned",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're sitting in first, your mark holding up all flight. Then the last jumper steps up on their final attempt, hits it perfect, and buries your mark by a couple centimeters. First place, gone on the last jump of the day.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest tightens watching them celebrate. Your jaw sets. And the voice lands flat — I had it, I was right there, and it got taken at the buzzer. That's the disappointment talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That flight is over and their jump was theirs. You can't out-jump a mark that's already landed. Breathe out, let your shoulders drop, and bring your eyes back to your own day.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take what's real — you jumped well enough to lead a whole flight. Carry that forward. The next meet you control your own attempts; you can't control theirs, so spend nothing replaying the one that beat you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting jumped on the last attempt is real, and it stings. It is not your identity. Their mark reports their attempt; it cannot name you — you're secure win or lose. Hold your head up, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_JUMP_BAD_HEAT_SCRIPT: AudioScript = {
  slug: "hm-trf-jump-bad-heat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You drew the early flight. You're jumping cold while the seeded athletes wait their turn, and the runway feels foreign — no one ahead of you to chase, no big marks on the board to measure against.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your energy sags looking at the empty board. Your legs feel a little flat at the top of the runway. And the voice lands flat — what's the point, the real flight hasn't even started. That's the seeding talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The flight order doesn't decide your mark — the board takes every jump the same way, early flight or late. Breathe out, settle at the top of the runway, and bring your jump no matter who's watching.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Bring your own runway with you. Run your full approach, hit your steps, attack the board — a big mark in an early flight still stands, and it forces the seeded jumpers to come find you. Set the bar instead of chasing it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The early flight is real and it does not define you. It is not your identity. The seeding reports where they think you are; it cannot name an athlete. Run your own runway, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_JUMP_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-trf-jump-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You stand at the top of the runway, the board sixty feet away, the flight watching from the side. You rock onto your steps and for a second you can't feel where they are — just your heart pounding and the long strip of track in front of you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart thumps. Your hands buzz at your sides. Your legs feel light and quick underneath you. What if I'm off my steps with everyone watching. That's the fear talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath, let the buzz settle into your legs, and find your start mark under your feet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to force the jump — you just have to run your approach. Lock your eyes down the runway, hit your rhythm off the first step, and let the speed carry you to the board. Trust the steps you've drilled a thousand times.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The flight doesn't get to name you and neither does this jump. Settle on your steps, run your approach, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_JUMP_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-trf-jump-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your first attempt comes out flat and short, well under your average. You feel it the second you land — that wasn't you. And now you're chasing the round, sitting near the bottom of the board with two attempts left.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw tightens looking at the short mark. The urge surges to swing for a huge one to make it all back at once. I have to get it all back on the next jump. That's the pressing talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That attempt is over and it's just one mark on the board. A flat opener is a start, not the round. Walk back to the top of the runway and let it be a fresh attempt.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't try to win the round back with one giant leap — that's how you press the board and scratch. Take it one attempt at a time. Settle your steps, hit your rhythm, trust your approach, and the distance comes back on its own.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow start is real and it is over. It is not your identity. The board reports an attempt, but it cannot name an athlete — you don't have to rescue the round to be secure. One clean approach, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_JUMP_OFF_PACE_SCRIPT: AudioScript = {
  slug: "hm-trf-jump-off-pace",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "All day your steps are off. You're either way behind the board and leaving distance on the runway, or you're reaching and fouling. You can't find your approach, and every attempt feels like a guess instead of a rhythm.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your shoulders climb between attempts. Your run-up feels rushed and stuttery. And the voice lands flat — I can't even find my own steps today. That's the frustration talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those attempts are behind you. Steps drift in a meet — that's normal, and the fix is one attempt, not the whole day. Walk back to your start mark and breathe out long.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Simplify the next one. Set your start mark, run through your first few steps with confidence, and let the speed build into the board — don't steer it, just run it. Find the rhythm on one attempt and the rest follow.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The off day is real and each attempt is over when it lands. It is not your identity. The board reports an attempt; it cannot name an athlete. Find your rhythm on the next one, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Thrower (7) ──

export const CLIP_HM_TRF_THROW_FOUL_SCRIPT: AudioScript = {
  slug: "hm-trf-throw-foul",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The throw rockets out there, your best of the day, way past your marks. And then your momentum carries your foot over the toe board — red flag, no mark. The biggest throw of the meet, and it counts for nothing.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach drops watching that flag go up. Your eyes stay locked on the ring, replaying the finish. And the voice lands flat — my biggest throw and I fouled it away. That's the sting talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That throw is over and the flag is up — nothing left to argue. You have throws left in this round. Step out of the ring, shake out your arms, breathe out long, and let the scratch go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take it one throw at a time. The distance is clearly in you — you just showed it. Don't pull back scared of the board; stay tall, control your finish, keep it behind the toe board, and let the next one go clean.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That scratch is real and it is over. It is not your identity. The board reports an attempt, but it cannot name an athlete — you're secure before the throw and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠⚠ CLINICALLY GATED (withheld until clinical sign-off): the foul-out /
// no-fair-mark spiral (incl. the javelin run-up balk). WITHHELD from the
// picker (authored here, OMITTED from TRACKFIELD_CONFIG.roleAdversities) until
// clinical-advisor sign-off (the FV-119 / baseball-yips / golf-first-tee
// precedent). Names the situation (fouling out / leaving with no mark); treats
// any "I can't commit to the run-up" motor failure as a FALSE STORY to reject
// — NEVER names "the yips," "the balk," "choking," or "freezing"; anchors
// identity ("this is happening to your run-up today; it is not a verdict on
// you"); routes the mechanics fix to the COACH, never coaches mechanics
// in-app; refuses hopelessness. De-escalating throughout.
export const CLIP_HM_TRF_THROW_NO_HEIGHT_SCRIPT: AudioScript = {
  slug: "hm-trf-throw-no-height",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You've fouled your first two. The third is your last chance at a fair mark, and a scratch means you leave with nothing on the board — and standing in the ring, the throw you've made a thousand times suddenly feels far away.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your breath sits high in your chest. Your run-up feels unsure, like you can't quite commit to it. And the thought arrives fast — I can't make myself drive through it. Let it arrive. It's a feeling in this moment, not a fact about you.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow everything down. This is the gap between the warm-up and the one throw that counts — it happens to real throwers, and it is happening to your run-up today, not to who you are. Breathe out, and let this be just one throw.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to fix your technique standing here. Take your medicine — one throw at a time. Slow your setup all the way down, pick one simple thing, stay inside the ring, and let an easy, committed throw go. Then step out and let the round settle you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. This hard attempt is real, and it is over once you take it. It is not a verdict on you, and it is not your identity — you're secure before you ever step in the ring. Take what's bugging your run-up to your coach this week and work it there. For now, reset and throw the next one.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_THROW_OUT_LEANED_SCRIPT: AudioScript = {
  slug: "hm-trf-throw-out-leaned",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're winning into the final round, your mark holding all day. Then the thrower behind you steps into the ring and uncorks a bomb — a personal best, right at the end — and bumps you out of first on the last throw of the competition.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest tightens watching it land. Your jaw sets. And the voice lands flat — I led the whole comp and it got taken on the last throw. That's the disappointment talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That round is over and their throw was theirs. You can't out-throw a mark that's already landed. Breathe out, let your shoulders drop, and bring your eyes back to your own day.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take what's real — you threw well enough to lead a whole competition. Carry that forward. Next meet you control your own throws; you can't control theirs, so spend nothing replaying the one that beat you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting out-thrown on the last throw is real, and it stings. It is not your identity. Their mark reports their attempt; it cannot name you — you're secure win or lose. Hold your head up, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_THROW_BAD_HEAT_SCRIPT: AudioScript = {
  slug: "hm-trf-throw-bad-heat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You throw first in the order, cold, with no big marks ahead of you to chase or measure against. The board is empty, the seeded throwers are waiting their turn, and the ring feels foreign with no rhythm set yet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your energy sags looking at the empty board. Your arm feels a little flat warming up. And the voice lands flat — what's the point, the real throwers haven't even gone. That's the seeding talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The throwing order doesn't decide your mark — the board takes every throw the same way, first in the order or last. Breathe out, settle in the ring, and bring your throw no matter who's watching.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Bring your own ring with you. Run your full setup, drive through your finish, attack the board — a big mark thrown first still stands, and it forces the seeded throwers to come find you. Set the mark instead of chasing it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Throwing first is real and it does not define you. It is not your identity. The order reports where they think you are; it cannot name an athlete. Throw your own mark, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_THROW_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-trf-throw-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You step into the ring, chalk on your hands, the competition watching from the side. You settle the implement against your neck, and suddenly it feels heavy and unfamiliar — like your body forgot a motion it knows cold.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart thumps. Your hands buzz against the implement. Your legs feel light underneath you in the ring. What if I rush it and let go too early with everyone watching. That's the fear talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath, let the buzz settle into your legs, and feel your feet planted in the back of the ring.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to force the throw — you just have to run your sequence. Stay patient in the back, build through your feet and hips, and let the finish rip on its own. Trust the motion you've drilled a thousand times.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The competition doesn't get to name you and neither does this throw. Settle in the ring, run your sequence, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_THROW_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-trf-throw-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your opener is well short of your average. You feel it leave your hand wrong, and it lands soft. Now you're pressing to make the final, sitting near the bottom of the board with your throws running out.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw tightens looking at the short mark. The urge surges to muscle the next one as hard as you can to make it all back. I have to get it all back on the next throw. That's the pressing talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That throw is over and it's just one mark on the board. A short opener is a start, not the round. Step back to the ring and let it be a fresh throw.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't try to win it back by throwing harder — muscling it is exactly how the throw gets short and the foot drifts over the board. Take it one throw at a time. Stay smooth, trust your sequence, let it build, and the distance comes back.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow start is real and it is over. It is not your identity. The board reports an attempt, but it cannot name an athlete — you don't have to rescue the round to be secure. One smooth throw, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_TRF_THROW_OFF_PACE_SCRIPT: AudioScript = {
  slug: "hm-trf-throw-off-pace",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Attempt after attempt comes out flat and short. You know the big throw is in you — you've hit it in practice all week — but today you can't reach the mark you know you have, and the round is slipping by.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your shoulders climb between throws. Your sequence feels rushed and disconnected. And the voice lands flat — the big one just isn't coming today. That's the frustration talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those throws are behind you. Distance comes and goes within a comp — that's normal, and the fix is one throw, not the whole day. Step back to the ring and breathe out long.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Simplify the next one. Stay patient in the back, build smooth through your feet, and let the finish do the work — don't force the distance, just run the sequence. Find the rhythm on one throw and the big one shows up.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The off day is real and each attempt is over when it lands. It is not your identity. The board reports an attempt; it cannot name an athlete. Find your rhythm on the next one, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const TRACKFIELD_PREGAME_CLIP_SCRIPTS: AudioScript[] = [
  CLIP_VIZ_TRF_SPRINT_SCRIPT,
  CLIP_VIZ_TRF_DIST_SCRIPT,
  CLIP_VIZ_TRF_HURDLE_SCRIPT,
  CLIP_VIZ_TRF_JUMP_SCRIPT,
  CLIP_VIZ_TRF_THROW_SCRIPT,
  CLIP_HM_TRF_JUMP_FOUL_SCRIPT,
  CLIP_HM_TRF_JUMP_NO_HEIGHT_SCRIPT,
  CLIP_HM_TRF_JUMP_OUT_LEANED_SCRIPT,
  CLIP_HM_TRF_JUMP_BAD_HEAT_SCRIPT,
  CLIP_HM_TRF_JUMP_NERVOUS_SCRIPT,
  CLIP_HM_TRF_JUMP_START_SLOW_SCRIPT,
  CLIP_HM_TRF_JUMP_OFF_PACE_SCRIPT,
  CLIP_HM_TRF_THROW_FOUL_SCRIPT,
  CLIP_HM_TRF_THROW_NO_HEIGHT_SCRIPT,
  CLIP_HM_TRF_THROW_OUT_LEANED_SCRIPT,
  CLIP_HM_TRF_THROW_BAD_HEAT_SCRIPT,
  CLIP_HM_TRF_THROW_NERVOUS_SCRIPT,
  CLIP_HM_TRF_THROW_START_SLOW_SCRIPT,
  CLIP_HM_TRF_THROW_OFF_PACE_SCRIPT,
  CLIP_HM_TRF_SPRINT_FALSE_START_SCRIPT,
  CLIP_HM_TRF_SPRINT_HANDOFF_SCRIPT,
  CLIP_HM_TRF_SPRINT_OUT_LEANED_SCRIPT,
  CLIP_HM_TRF_SPRINT_BAD_HEAT_SCRIPT,
  CLIP_HM_TRF_SPRINT_HIT_WALL_SCRIPT,
  CLIP_HM_TRF_SPRINT_NERVOUS_SCRIPT,
  CLIP_HM_TRF_SPRINT_START_SLOW_SCRIPT,
  CLIP_HM_TRF_SPRINT_OFF_PACE_SCRIPT,
  CLIP_HM_TRF_DIST_HIT_WALL_SCRIPT,
  CLIP_HM_TRF_DIST_HANDOFF_SCRIPT,
  CLIP_HM_TRF_DIST_OUT_LEANED_SCRIPT,
  CLIP_HM_TRF_DIST_BAD_HEAT_SCRIPT,
  CLIP_HM_TRF_DIST_NERVOUS_SCRIPT,
  CLIP_HM_TRF_DIST_START_SLOW_SCRIPT,
  CLIP_HM_TRF_DIST_OFF_PACE_SCRIPT,
  CLIP_HM_TRF_HURDLE_FALSE_START_SCRIPT,
  CLIP_HM_TRF_HURDLE_HANDOFF_SCRIPT,
  CLIP_HM_TRF_HURDLE_OUT_LEANED_SCRIPT,
  CLIP_HM_TRF_HURDLE_FOUL_SCRIPT,
  CLIP_HM_TRF_HURDLE_BAD_HEAT_SCRIPT,
  CLIP_HM_TRF_HURDLE_HIT_WALL_SCRIPT,
  CLIP_HM_TRF_HURDLE_NERVOUS_SCRIPT,
  CLIP_HM_TRF_HURDLE_START_SLOW_SCRIPT,
  CLIP_HM_TRF_HURDLE_OFF_PACE_SCRIPT,
];
