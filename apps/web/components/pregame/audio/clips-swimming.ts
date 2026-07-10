// Swimming pregame compositional clips (FV-275) — 4 specialty VIZ clips + 38
// hard-moment cells, authored by the content trio + swimming-expert under lead
// orchestration from the FV-274 taxonomy (docs/swimming-module-map.md). The
// swimming analog of clips-golf.ts / clips-football.ts. Kept in a sibling file
// to stay out of the clips.ts hot file. Registered into CLIP_SCRIPTS via
// `...SWIMMING_PREGAME_CLIP_SCRIPTS` in clips.ts. Audio render is DEFERRED
// (the sport is DORMANT) — this file is the TTS INPUT, no MP3s yet.
//
// Per-cell structure mirrors golf/football: [rehearse → scenario →
// body-feel/false-story → reset → tactical → truth]. Slug scheme
// hm-swm-{specialty}-{fragment}. Specialties: Sprinter / Distance / Stroke / IM.
// Compositional-only (golf model). 38 distinct cells: Sprinter drops
// mind-wanders (reroute→touched-out), Distance drops touched-out
// (reroute→go-out-slow); the 4 plateau cells are authored but WITHHELD from the
// picker (SWIMMING_CONFIG.roleAdversities) until clinical sign-off.
//
// ⚠⚠ TWO HARD SAFETY RAILS (swimming-expert), enforced in every cell:
//   1. BREATH: no breath cue resembles breath-hold / hypoxic / underwater
//      training — shallow-water blackout kills swimmers. All breath/reset
//      language is DRY-LAND, behind-the-blocks calm-down breathing.
//   2. BODY-COMP: no weight / suit / body / RED-S language anywhere.
// The 4 plateau cells are the clinically-gated cells (the season-long no-drop) —
// authored to anchor identity + route the training question to the coach, never
// despair; withheld from the picker until clinical sign-off.

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
  STROKE_VIZ,
  IM_VIZ,
} from "./segments-swimming.ts";
import { CLIP_LOUDNORM_FILTER } from "./loudnorm.ts";

// ── Swimming VIZ clips — one per specialty (FV-275) ──────────────────────────

export const CLIP_VIZ_SPRINT_SCRIPT: AudioScript = {
  slug: "viz-swm-sprint",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...SPRINT_VIZ],
};

export const CLIP_VIZ_DIST_SCRIPT: AudioScript = {
  slug: "viz-swm-dist",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...DIST_VIZ],
};

export const CLIP_VIZ_STROKE_SCRIPT: AudioScript = {
  slug: "viz-swm-stroke",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...STROKE_VIZ],
};

export const CLIP_VIZ_IM_SCRIPT: AudioScript = {
  slug: "viz-swm-im",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...IM_VIZ],
};

// ── Hard-moment cells — Sprinter + Distance ──

// ── Sprinter (9) ──

export const CLIP_HM_SWM_SPRINT_TOUCHED_OUT_SCRIPT: AudioScript = {
  slug: "hm-swm-sprint-touched-out",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You and lane five are dead even at the flags. You glide a half-stroke into the wall. They punch the touch. You look up at the board, and it has them by four hundredths.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest heaves over the lane rope. Your eyes lock on that second-place number. And the voice lands flat — I glided, I gave it away by a fingertip. That's the sting talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That swim is over and the time is on the board. Pull yourself out, walk it off on the deck, and let one long exhale settle you. You have more racing today.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't replay the touch on a loop. Take it to your next race instead — finish on a full stroke into the wall, no glide, drive your hand through the touchpad. Win the last inch next time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That four hundredths is real and it is over. It is not your identity. The board reports a swim, but it cannot name a swimmer — you're secure before the touch and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: erasure — the race is gone before it's swum. Authored to keep the
// false-start a single event that is over, not a verdict. Ships on the picker.
export const CLIP_HM_SWM_SPRINT_FALSE_START_SCRIPT: AudioScript = {
  slug: "hm-swm-sprint-false-start",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The horn fires, and then a second whistle behind it. Someone twitched on the blocks, and the official's arm swings around and points at your lane. Your fifty is gone before you swam a single stroke of it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat floods up your neck as you climb back onto the deck. Your hands shake. And the voice lands flat — I never even got to race, and now it's over. That's the shock talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That call is made and it cannot be undone. Standing on the deck arguing it in your head only carries it into the next race. Breathe out long, drop your shoulders, and let this one go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take the lesson, not the spiral. Next time on the blocks, get set and go still — weight settled, eyes down, move only on the beep. You can't lose what you don't anticipate.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That false start is real and it is over. It is not your identity. A race you never got to swim cannot name you — your worth was settled before you ever stepped on the blocks. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: erasure + let-the-relay-down. Authored to break the "I cost everyone"
// catastrophizing, not feed it. Ships on the picker.
export const CLIP_HM_SWM_SPRINT_DQ_SCRIPT: AudioScript = {
  slug: "hm-swm-sprint-dq",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You touched it dropping a hand, or your relay take-off read early on the pad. The swim is a best time and it counts for nothing. And on a relay, three teammates are looking at the scratched line where your time should be.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach drops when you see the DQ. You can't look at your relay. And the voice lands flat — I cost everyone, I ruined it for the whole team. That's the guilt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here is the move. That swim is wiped from the board, and it does not get the rest of your session. Pull yourself out, breathe out long on the deck, and let it be done right now.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One DQ doesn't write your meet, and your teammates are still your teammates. The catastrophe in your head — I ruined everything — isn't real. Go find your relay, own the one detail, and move on together.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Lock the fix in for next time. Two hands on the wall, square and flat. Stay on the block until your leg-off has clearly touched. Clean and legal, every length.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That DQ is real and it is over. It is not your identity, and one scratched time doesn't decide whether you belong on this team — you're secure before the swim and after it. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠⚠ CLINICALLY GATED: season-long no-drop plateau. WITHHELD from the picker via
// SWIMMING_CONFIG.roleAdversities until clinical-advisor sign-off (FV-119 /
// baseball-yips / golf-first-tee precedent). Names the situation, anchors
// identity over the clock, routes the training question to the coach. NEVER
// despair / hopelessness; NEVER "the work was pointless." De-escalating
// throughout.
export const CLIP_HM_SWM_SPRINT_PLATEAU_SCRIPT: AudioScript = {
  slug: "hm-swm-sprint-plateau",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You've gone twenty-three four in the fifty free at four straight meets. The work has been the same. The taper came and went. You look up at the board, and the clock just will not move.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your shoulders sink looking at the same time again. There's a heaviness behind your eyes. And the thought arrives — maybe this is just as fast as I get. Let it arrive. It's a feeling in this moment, not a fact about you.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That swim is over, and a plateau is a place on the road, not the end of it. Real swimmers sit on a time and then break through — it is happening to your clock right now, not to who you are. Breathe out, and let the number be just a number.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to solve your whole race standing here. Take what's stuck — the start, the back half, the finish — to your coach this week, and let them help you find the next gear. The work isn't lost; it's a base your next drop is built on.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The plateau is real, and it is not forever. It is not a verdict on you, and it is not your identity — the clock reports a swim, but it cannot name a swimmer. You're secure whether the time drops today or not. Bring it to your coach, and for now, reset and race the next one.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_SPRINT_BAD_TURN_SCRIPT: AudioScript = {
  slug: "hm-swm-sprint-bad-turn",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "In the hundred you carry the wall too far. Your feet plant flat instead of loaded, and your push off is dead. The one turn you get bleeds away the lead you built on that first fifty.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. You feel the field pull even off the wall. Your stroke gets frantic trying to make it back. And the voice lands flat — I just gave away the whole race on one wall. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That swim is over and the turn is behind you. Climb out, walk the deck, and let one long exhale clear it. You have more racing today.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take it to your next race. See the flags, find your spot, snap the turn tight and load both feet on the wall. Explode off the push — that's where you get the lead back, on the wall, not by thrashing.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That blown turn is real and it is over. It is not your identity. The clock reports a swim; it cannot name a swimmer. Hit the next wall clean, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_SPRINT_GOGGLES_SCRIPT: AudioScript = {
  slug: "hm-swm-sprint-goggles",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You hit the water hard off the blocks, and your goggles fill instantly. Cold water sloshes against your eyes. You're racing the hundred half-blind now, sighting the lane line by feel.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your eyes sting and everything blurs. Your stroke hitches as you try to find the wall. And the voice lands flat — I can't even see, this race is wrecked. That's the frustration talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The goggles are already gone — you can't fix them mid-race. Stop fighting them. The race is still yours to swim, blurry or not, and there's nothing to do now but go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Swim by feel. You know this distance in your body. Count your strokes off the flags, trust your rhythm, find the black line under you and ride it to the wall. Race what you feel, not what you see.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The flooded goggles are real and it is over the moment you stop fighting them. It is not your identity. The clock reports a swim; it cannot name a swimmer. Swim by feel, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_SPRINT_SLOW_HEAT_SCRIPT: AudioScript = {
  slug: "hm-swm-sprint-slow-heat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're seeded out in lane one, a full second back of the fast heat. The swimmers you want to chase race later, in a different heat. You're up here racing the clock alone, with no one beside you to pull you along.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your energy sags looking at the empty lanes around you. There's a flatness in your legs. And the voice lands flat — what's the point, I'm not even in the real race. That's the seeding talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The heat sheet doesn't decide your swim — the clock takes everyone's time the same way, lane one or lane four. Breathe out, settle behind the blocks, and bring your race no matter who's beside you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Race the clock, not the lane next to you. Lock onto your own splits, attack your own walls, and drop a time that crashes the next seeding. A fast swim in a slow heat still moves you up.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The seeding is real and it does not define you. It is not your identity. The heat sheet reports where they think you are; it cannot name a swimmer. Race your own clock, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_SPRINT_READY_ROOM_SCRIPT: AudioScript = {
  slug: "hm-swm-sprint-ready-room",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "They call your heat and your legs go light underneath you. The fifty is so short there's no room to settle into it — it's over in a breath. And your hands won't stop shaking as you step up onto the block.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart slams in your chest. Your stomach is light. Your hands buzz on the front of the block. What if I'm tight off the start and it's over before I find it. That's the fear talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath out on the deck, feel your feet on the block, and let the buzz settle into power.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to manage the whole fifty — you just have to react. See the start, explode off the block, swim long and fast off the breakout. Trust the speed you trained. It's already in you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The ready room doesn't get to name you and neither does this fifty. Settle on the block, react to the start, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_SPRINT_GO_OUT_SLOW_SCRIPT: AudioScript = {
  slug: "hm-swm-sprint-go-out-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your reaction off the block is a beat late. Your break is flat, no pop off the entry, and you surface behind the field. You're chasing from stroke one in a race that's too short to chase anyone down.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. You feel the gap open in front of you. Your stroke gets frantic, spinning to claw it back. And the voice lands flat — I lost it on the start, it's already gone. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That swim is over and the slow start is behind you. Climb out, walk the deck, and let one long exhale clear it. You have more racing today.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take it to your next race. Lock in on the start — react to the beep, drive the block, sharp streamline into a clean break. Get out front early so you never have to chase.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow start is real and it is over. It is not your identity. The clock reports a swim; it cannot name a swimmer. Nail the next start, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Distance (9) ──

// ⚠ HIGH: erasure of the longest race of the meet. Authored to keep the
// false-start a single event that is over, not a verdict. Ships on the picker.
export const CLIP_HM_SWM_DIST_FALSE_START_SCRIPT: AudioScript = {
  slug: "hm-swm-dist-false-start",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "One early move on the blocks before the longest race of the meet, and the whistle cuts it dead. The official's arm points your way. The whole grind you came here to swim is over before it even began.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat floods up your neck climbing back onto the deck. Your hands shake. And the voice lands flat — all that yardage, all that prep, gone on one twitch. That's the shock talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That call is made and it cannot be undone. Replaying it on the deck only carries it into the next race. Breathe out long, drop your shoulders, and let this one go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take the lesson, not the spiral. Next time on the blocks, get set and go perfectly still — weight settled, eyes down, move only on the beep. All that training is still in you and it isn't going anywhere.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That false start is real and it is over. It is not your identity. A race you never got to swim cannot name you — your worth was settled before you ever stepped on the blocks. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: erasure of a 16-minute swim. Authored to break the "all that for
// nothing" catastrophizing, not feed it. Ships on the picker.
export const CLIP_HM_SWM_DIST_DQ_SCRIPT: AudioScript = {
  slug: "hm-swm-dist-dq",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "A flip turn somewhere in the middle eight hundred rolls past vertical, or a hand slips a wall. The official saw it. A sixteen-minute swim, length after grinding length, is wiped clean off the board.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach drops when you see the DQ. Your legs are wrecked and now they were for nothing. And the voice lands flat — sixteen minutes of pain and it all counts for zero. That's the gut-punch talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here is the move. That swim is wiped from the board, and it does not get the rest of your meet. Pull yourself out, breathe out long on the deck, and let it be done right now.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The work was never for nothing. Every length built the engine you carry into the next race — the board can erase a time, but it can't erase what that swim made you. The catastrophe in your head isn't real.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Lock the fix in for next time. Flip turns square and under control, two hands flat on every wall. Legal and clean, length after length, all the way home.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That DQ is real and it is over. It is not your identity, and one scratched swim doesn't erase what you're worth — you compete from a victory that's already yours, time or no time. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠⚠ CLINICALLY GATED: existential distance plateau. WITHHELD from the picker via
// SWIMMING_CONFIG.roleAdversities until clinical-advisor sign-off (FV-119 /
// baseball-yips / golf-first-tee precedent). Names the situation, anchors
// identity over the clock, routes the training question to the coach. NEVER
// despair / hopelessness; NEVER "the work was pointless." De-escalating
// throughout.
export const CLIP_HM_SWM_DIST_PLATEAU_SCRIPT: AudioScript = {
  slug: "hm-swm-dist-plateau",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You've held the same mile time all season while your lanemate dropped fifteen seconds. The yardage is brutal, the sets are honest, and the clock keeps saying it isn't paying out.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your shoulders sink looking at the same time again. There's a heaviness in your chest watching your lanemate drop. And the thought arrives — maybe all this yardage isn't taking me anywhere. Let it arrive. It's a feeling in this moment, not a fact about you.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That swim is over, and a plateau is a place on the road, not the end of it. Distance breakthroughs come in big steps after long flat stretches — it is happening to your clock right now, not to who you are. Breathe out, and let your lanemate's time be theirs, not a measure of you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to solve the whole mile standing here. Take what's stuck — your pacing, your back-half, your turns — to your coach this week and let them help you find the next gear. Every honest length is base your next drop is built on.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The plateau is real, and it is not forever. It is not a verdict on you, and it is not your identity — the clock reports a swim, but it cannot name a swimmer. You're secure whether the time drops today or not. Bring it to your coach, and for now, reset and race the next one.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_DIST_BAD_TURN_SCRIPT: AudioScript = {
  slug: "hm-swm-dist-bad-turn",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Somewhere around the seven hundred you misjudge the wall. You short the flip, plant flat, and push off weak. The clean rhythm you spent six lengths building falls apart in one bad turn.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stroke stutters as you scramble for the rhythm. The fatigue rushes in. And the voice lands flat — I broke my pace, the rest of this swim is a slog now. That's the doubt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That wall is behind you and there's a lot of pool left. One bad turn in a distance swim is a single length, not the whole race. Settle back into your stroke right now.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Rebuild the rhythm one length at a time. Find your stroke count, lengthen out, feel the catch and the steady tempo come back. The pace is still in your body — climb back onto it stroke by stroke.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That blown turn is real and it is over. It is not your identity. The clock reports a swim; it cannot name a swimmer. Find your rhythm again, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_DIST_MIND_WANDERS_SCRIPT: AudioScript = {
  slug: "hm-swm-dist-mind-wanders",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "At the three hundred the pool goes silent. It's just you and the black line on the bottom, length after length. And before you catch it, your mind drifts somewhere else and your pace drifts with it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stroke goes soft and absent. You realize you've stopped counting. And the voice lands flat — I checked out, I let the pace slip, I can't even stay in my own race. That's the drift talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Drifting in the long middle is normal — every distance swimmer does it. The work isn't to never drift; it's to come back. You just came back. That's the whole skill, right there.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Anchor your mind to something small and repeating. Count your strokes per length. Feel the catch, feel the finish, feel the next turn. One length at a time, back on the line and back on pace.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The drift is real and it is over the moment you notice it. It is not your identity. The clock reports a swim; it cannot name a swimmer. Come back to the line, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_DIST_GOGGLES_SCRIPT: AudioScript = {
  slug: "hm-swm-dist-goggles",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your goggles fog at the two hundred and stay fogged for thirteen more lengths. The black line blurs to a smear. You're swimming the rest of the mile reading the bottom by memory.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. You squint into the blur trying to find the wall. Your turns get tentative. And the voice lands flat — I can barely see, the rest of this swim is ruined. That's the frustration talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You can't clear them mid-race, so stop fighting them. The mile is still yours to swim, fogged or clear. There's nothing to do now but settle in and go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Swim by feel — you know this pool. Count your strokes off the flags into every wall, time your turns by rhythm, trust the line you've memorized. Race what you feel, not what you see.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The fogged goggles are real and they're over the moment you stop fighting them. It is not your identity. The clock reports a swim; it cannot name a swimmer. Swim by feel, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_DIST_SLOW_HEAT_SCRIPT: AudioScript = {
  slug: "hm-swm-dist-slow-heat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Distance heats swim slow-to-fast, so you're in the early heat with half the pool still empty. The stands are quiet, the fast swimmers are hours away, and you're chasing a pace target with no one near you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your energy sags in the empty, quiet pool. Your legs feel flat behind the blocks. And the voice lands flat — what's the point, no one's even watching this heat. That's the seeding talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The heat sheet doesn't decide your swim — the clock takes every time the same way, early heat or final. Breathe out, settle behind the blocks, and bring your race to the empty pool.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Race your pace plan, not the lanes around you. Lock onto your splits, hit your target every hundred, and drop a time that turns heads later when they read the sheet. A fast swim in an early heat still stands.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The early heat is real and it does not define you. It is not your identity. The heat sheet reports where they think you are; it cannot name a swimmer. Race your own pace, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_DIST_READY_ROOM_SCRIPT: AudioScript = {
  slug: "hm-swm-dist-ready-room",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Behind the blocks before the five hundred, your stomach turns over. You're not afraid of the swim — you're afraid of how long the next five-plus minutes of pain are going to last. The whole grind is still in front of you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach knots. Your legs feel heavy already. The mind runs ahead to the worst of it. How am I going to hold pace when it really starts to hurt. That's the dread talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath out on the deck, feel your feet on the block, and bring your focus to just the first length.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't swim the whole five hundred standing here — you can't carry all of it at once. Break it into pieces. Settle into pace, hold your splits, and take it one hundred at a time. You've trained every yard of it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The dread of the distance doesn't get to name you and neither does this race. Settle on the block, swim the first length, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_DIST_GO_OUT_SLOW_SCRIPT: AudioScript = {
  slug: "hm-swm-dist-go-out-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your first two hundred is two seconds off your pace plan. You glance at the clock on the turn and the math is already against the time you came here to swim. The swim is barely started and you're behind it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw tightens doing the math mid-stroke. The urge surges to sprint and rip it all back at once. I'm behind my pace, I have to make up the whole gap right now. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Two seconds early in a long race is not a hole you have to dig out of in one length. Sprinting to erase it now is exactly how a distance swim falls apart. Settle, and bring your focus back to your stroke.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Get back on pace, length by length — don't lunge for it all at once. Lock onto your target split, build through the middle, and trust your back-half. The time comes back in pieces, not in one heroic surge.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Going out off pace is real and that moment is over. It is not your identity. The clock reports a swim; it cannot name a swimmer. Settle onto your pace, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Hard-moment cells — Stroke + IM ──

// ── Stroke (10) ──

export const CLIP_HM_SWM_STROKE_TOUCHED_OUT_SCRIPT: AudioScript = {
  slug: "hm-swm-stroke-touched-out",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The hundred fly, and you and the next lane surge to the wall together. Your timing's a hair off the touch — you glide a stroke too long, they punch it in, and the board flips them ahead of you by a fingertip.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest heaves on the wall. Your eyes lock on their lane, then the board. And the voice lands flat — I had them and I gave it away at the touch. That's the sting talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the time is on the board. The walk back behind the blocks is your reset. Stand tall, let your shoulders drop, and take one slow, easy breath of the deck air.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A touch is won before the wall, not at it. Don't go chase the next race by tearing it apart — hold your stroke long and strong, and time the finish so you attack the wall instead of gliding into it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That touch-out is real and it is over. It is not your identity. The board reports a swim, not a swimmer — you're secure before this race and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: the false start — the event is erased before it begins. Authored to
// process the erasure, not relive it. Ships on the standard picker.
export const CLIP_HM_SWM_STROKE_FALSE_START_SCRIPT: AudioScript = {
  slug: "hm-swm-stroke-false-start",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "On the blocks for the hundred breast, your best event, keyed up and ready. You rock forward a hair early. The whistle blows, the official points, and just like that your race is scratched off the sheet before it ever started.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach drops as you climb down. Heat floods your face in front of the whole deck. And the voice lands flat — all that work, gone, and I never even swam. That's the shock talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That disqualification is real and it is final for this event — and it stays in this event. It doesn't get your next race too. Stand on the deck, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't carry the early start onto your next block by waiting a beat too long to make up for it. Set, still, eyes down, and go on the horn — react to the sound, not to the fear of jumping it again.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That false start is real and it is over. It is not your identity. A scratched race is one moment on a sheet, not a verdict on you — you're secure with no time on the board at all. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: the stroke/turn DQ — the swim happens, then the flag erases it.
// Authored to process the erasure, not relive it. Ships on the standard picker.
export const CLIP_HM_SWM_STROKE_DQ_SCRIPT: AudioScript = {
  slug: "hm-swm-stroke-dq",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You swam a clean race — felt fast, hit your splits. Then one hand touched a beat before the other on the breast turn, or one too many dolphin kicks off the fly wall. The flag goes up, and the whole swim is wiped off the sheet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest still heaves from the effort. You stare at the official as it sinks in. And the voice lands flat — I did the work and it counts for nothing. That's the injustice talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That swim is erased on the sheet and that is real — and it stays on the sheet, not on you. The race is over. Stand tall on the deck, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take the correction, not the grudge. On your next turn, square both hands to the wall and count your kicks off the break — legal first, fast second. Clean technique is how the time stays on the board.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That DQ is real and it is over. It is not your identity. An erased time still happened in your body — and a swim erased on a sheet can't name a swimmer. You're secure. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠⚠ CLINICALLY GATED: the plateau cell. WITHHELD from the picker via
// SWIMMING_CONFIG.roleAdversities until clinical-advisor sign-off (FV-119 /
// golf-plateau precedent). Anchors identity, routes the real fix to the coach,
// and never lets the stuck time read as hopeless or as a verdict on the swimmer.
export const CLIP_HM_SWM_STROKE_PLATEAU_SCRIPT: AudioScript = {
  slug: "hm-swm-stroke-plateau",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your hundred back has sat at the same time for two seasons. The stroke feels good. The work is there. And the clock keeps handing you the same number, meet after meet, no matter what you pour into it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your shoulders sink looking at the board. There's a tiredness behind your eyes. And a quiet voice says maybe this is just as far as I go. That's the discouragement talking, not the truth. Let it arrive, and let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A plateau is real, and it is not the end of your story — every swimmer hits one, and times break loose in jumps, not inches. Stand tall, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "This is not yours to crack alone today, and not on this block. Bring the stuck time to your coach this week — let them look at your walls, your tempo, your training — and let this race just be one honest swim.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The plateau is real and it is over for tonight. It is not your identity. The clock reports a time, not a ceiling on you — your worth was never the number on the board. Take it to your coach, and for now, reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_STROKE_BAD_TURN_SCRIPT: AudioScript = {
  slug: "hm-swm-stroke-bad-turn",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Two hundred breast, and your turn comes in a beat slow off the wall. The timing breaks, your tempo stalls, and the back half never finds the rhythm again — you're swimming uphill the rest of the way in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stroke feels heavy and out of sync. You can feel the lane next to you pull even. The voice says I broke my own race at the wall. That's the frustration talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That turn is over and it's behind you in the pool. The race is done, the time is on the board. Stand tall on the deck, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One slow turn doesn't define the swim. Next race, attack the wall — drive your feet down, push off tight and streamlined, and let your first two strokes set the tempo instead of chasing it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That missed turn is real and it is over. It is not your identity. The clock reports a swim, it cannot name a swimmer — you're secure whether the turn was sharp or slow. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_STROKE_MIND_WANDERS_SCRIPT: AudioScript = {
  slug: "hm-swm-stroke-mind-wanders",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Last twenty-five of the hundred fly. Your stroke shortens, your arms stop clearing the water, and your tempo falls apart. The smooth rhythm you had is gone, and it turns into pure survival just to reach the wall.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stroke rate ragged, your timing scattered. The voice says I always fall apart at the end. That's the doubt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the time is on the board. Stand tall behind the blocks, let your shoulders drop, and take one slow, easy breath of the deck air.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The back half is a tempo problem, not a willpower problem. Next race, when the burn comes, hold your stroke long — full pull, hands clearing the water — and keep your rhythm instead of chopping it short.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That fade at the end is real and it is over. It is not your identity. The clock reports a swim, it cannot name a swimmer — you're secure however the last twenty-five came. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_STROKE_GOGGLES_SCRIPT: AudioScript = {
  slug: "hm-swm-stroke-goggles",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your goggles slip on the dive and sit half-off your eyes. You swim the whole fly race half-blind, water blurring everything, guessing your turn off the flags and hunting for a wall you can't quite see.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your eyes sting and squint. Your rhythm tightens, hunting for the wall. The voice says I can't race like this. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the goggles are off now. The time is on the board, whatever it is. Stand tall on the deck, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A slipped goggle is gear, not you. Next time, snug them tight under your cap and trust your stroke count to the wall — you've felt your way home a thousand times in practice. You can swim by feel.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The goggles slipping is real and it is over. It is not your identity. The clock reports a swim, it cannot name a swimmer — and a gear slip doesn't either. You're secure. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_STROKE_SLOW_HEAT_SCRIPT: AudioScript = {
  slug: "hm-swm-stroke-slow-heat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're seeded into a slow heat off a meet where your stroke felt off. The fast swimmers are in a later heat, and you're racing the clock alone, with no one next to you to pull you down to your time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your shoulders slump on the deck. You feel a little forgotten back in this heat. The voice says I don't even belong in the real race. That's the discouragement talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The seed sheet is just a starting point, not a sentence. Times don't care which heat you swim them in. Stand tall behind the blocks, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Race the clock, not the bodies. Lock onto your own splits, hold your stroke long and strong, and chase the number you came for. A best time from a slow heat counts exactly the same.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow heat is real and it is over once you dive. It is not your identity. The clock reports a swim, it cannot name a swimmer, and a seed line can't either. You're secure. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_STROKE_READY_ROOM_SCRIPT: AudioScript = {
  slug: "hm-swm-stroke-ready-room",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Behind the blocks, your heat about to be called. You can already feel that the stroke isn't quite there today, and you can't tell if your feel for the water will show up when the horn goes.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart thumps. Your hands fidget at your cap. Your stomach is light. What if the feel just isn't there when I dive in. That's the nerves talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Stand tall behind the blocks, let your shoulders drop, roll them back once, and take one slow, easy breath of the deck air.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You can't will the feel into your hands standing here. Stop auditing it. Trust your start, hold your stroke long off the dive, and let the feel come to you the way it always has, stroke by stroke.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The feel comes and goes; your worth never did. The clock reports a swim, it cannot name a swimmer. Step up, react to the horn, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_STROKE_GO_OUT_SLOW_SCRIPT: AudioScript = {
  slug: "hm-swm-stroke-go-out-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "In warm-up the stroke wasn't there — the catch felt empty, your hands slipping through the water with nothing to grab. Now you're on the blocks, not knowing which version of your stroke shows up when you dive.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your hands feel far away, unsure on the start. Your stomach knots. The voice says my stroke left me on the day it counts. That's the fear talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Warm-up was warm-up. An empty catch in warm-up is information, not a forecast for the race. Stand tall behind the blocks, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to fix your stroke standing here. Off the dive, reach long, find the catch on your very first pull, and let the race wake it up. The feel often shows up the second the gun goes.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. A flat warm-up is real and it is over. It is not your identity. The clock reports a swim, it cannot name a swimmer — you're secure whichever version of the stroke shows up. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── IM (10) ──

export const CLIP_HM_SWM_IM_TOUCHED_OUT_SCRIPT: AudioScript = {
  slug: "hm-swm-im-touched-out",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Coming home freestyle in the two hundred IM, stroke-for-stroke with the next lane after four legs of fighting. You drive to the wall together and lose the touch by the length of a hand. So close, and second on the board.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your whole body burns from all four strokes. Your eyes snap to the board, then their lane. And the voice lands flat — I gave it everything and still came up a hand short. That's the sting talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the time is on the board. The walk back behind the blocks is your reset. Stand tall, let your shoulders drop, and take one slow, easy breath of the deck air.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The IM is won across four strokes, not just the last wall. Next time, build your free leg from the last turn so you arrive with speed — and drive the finish in long instead of gliding the last stroke.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That touch-out is real and it is over. It is not your identity. The board reports a swim, not a swimmer — you're secure before this race and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: false start scratches the 400 IM — the longest event, erased before
// it begins. Authored to process the erasure, not relive it. Standard picker.
export const CLIP_HM_SWM_IM_FALSE_START_SCRIPT: AudioScript = {
  slug: "hm-swm-im-false-start",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "On the blocks before the four hundred IM, the longest puzzle of the meet, everything you've trained for. You move early. The whistle blows, the official points, and your race is scratched before the fly even starts.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach drops climbing down off the block. Heat floods your face. And the voice lands flat — all those four-stroke sets, gone, and I never swam a stroke. That's the shock talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That disqualification is real and it is final for this event — and it stays in this event. It doesn't get your next race. Stand on the deck, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't carry the early start onto your next block by hesitating to make up for it. Set, still, eyes down, and go on the horn — react to the sound, not to the fear of jumping it again.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That false start is real and it is over. It is not your identity. A scratched race is one moment on a sheet, not a verdict on you — you're secure with no time on the board at all. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: transition DQ — four legs swum, erased on a changeover rule. Authored
// to process the erasure, not relive it. Ships on the standard picker.
export const CLIP_HM_SWM_IM_DQ_SCRIPT: AudioScript = {
  slug: "hm-swm-im-dq",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You swam all four strokes clean and fast. Then you left the wall onto your back a hair before fully touching on the back-to-breast change — or your breast kick went illegal. The flag goes up, and the whole medley is wiped out on a transition rule.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest still heaves from four legs of work. You stare at the official as it lands. And the voice says I did all of it and it counts for nothing. That's the injustice talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That swim is erased on the sheet and that is real — and it stays on the sheet, not on you. The race is over. Stand tall on the deck, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take the correction, not the grudge. The IM lives in the transitions — next race, fully touch before you turn, and keep every changeover legal. Clean transitions are how the four-stroke time stays on the board.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That DQ is real and it is over. It is not your identity. An erased time still happened in your body — and a swim erased on a sheet can't name a swimmer. You're secure. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠⚠ CLINICALLY GATED: the IM plateau cell. WITHHELD from the picker via
// SWIMMING_CONFIG.roleAdversities until clinical-advisor sign-off (FV-119 /
// golf-plateau precedent). Anchors identity, routes the real fix to the coach,
// and never lets the stuck time read as hopeless or as a verdict on the swimmer.
export const CLIP_HM_SWM_IM_PLATEAU_SCRIPT: AudioScript = {
  slug: "hm-swm-im-plateau",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your two hundred IM hasn't dropped in a year. You train four strokes against swimmers who train one, and the all-around time sits stuck while the specialists pass you in their own events. The math feels like it's against you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your shoulders sink at the board. There's a tiredness behind your eyes. And a quiet voice says maybe doing all four just means I'm never the best at any. That's the discouragement talking, not the truth. Let it arrive, and let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A plateau is real, and it is not the end of your story — the all-rounder's time breaks loose in jumps, often when one weak leg finally clicks. Stand tall, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "This is not yours to crack alone today, and not on this block. Bring the stuck time to your coach this week — let them find the leg that's leaking time — and let this race just be one honest swim.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The plateau is real and it is over for tonight. It is not your identity. The clock reports a time, not a ceiling on you — and being an all-rounder is a strength, not a verdict. Take it to your coach, and for now, reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_IM_BAD_TURN_SCRIPT: AudioScript = {
  slug: "hm-swm-im-bad-turn",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The back-to-breast transition comes a half-second clumsy — you fumble the changeover, your rhythm breaks at the wall, and you carry the stumble straight into your weakest leg, already behind before the breast even starts.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stroke feels scrambled and out of sync. You can feel the lanes pulling even. The voice says I broke my own race at the changeover. That's the frustration talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That transition is over and it's behind you in the pool. The race is done, the time is on the board. Stand tall on the deck, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One clumsy changeover doesn't define the medley. Next race, rehearse the back-to-breast in your head before you dive — touch, drop the hips, set the breast tempo on stroke one. Smooth transitions are free speed.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That blown transition is real and it is over. It is not your identity. The clock reports a swim, it cannot name a swimmer — you're secure whether the changeover was clean or clumsy. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_IM_MIND_WANDERS_SCRIPT: AudioScript = {
  slug: "hm-swm-im-mind-wanders",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Somewhere in the middle of the medley you lose the thread of the race. You forget to attack the transition, your strokes blur together, and the four-stroke shape of the swim falls apart right where it should tighten.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your tempo drifts, your focus scattered between strokes. The voice says I drift right when I need to lock in. That's the doubt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the time is on the board. Stand tall behind the blocks, let your shoulders drop, and take one slow, easy breath of the deck air.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The IM rewards a swimmer with a job for every length. Next race, give each leg one cue — long fly, steady back, snap the breast, finish the free — and ride the transitions instead of drifting through them.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Losing the thread is real and it is over. It is not your identity. The clock reports a swim, it cannot name a swimmer — you're secure however the middle of the race went. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_IM_GOGGLES_SCRIPT: AudioScript = {
  slug: "hm-swm-im-goggles",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your goggles fail off the fly dive and fill with water. You swim three strokes' worth of a four-stroke race unable to see your turns clearly, guessing every wall, fighting just to keep the medley together half-blind.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your eyes sting and squint at each wall. Your transitions tighten with the guesswork. The voice says I can't run the IM blind. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the goggles are off now. The time is on the board, whatever it is. Stand tall on the deck, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A flooded goggle is gear, not you. Next time, snug them tight under your cap and trust your stroke count into every wall — you've felt your way through all four legs a thousand times. You can swim it by feel.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The goggles failing is real and it is over. It is not your identity. The clock reports a swim, it cannot name a swimmer — and a gear failure doesn't either. You're secure. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_IM_SLOW_HEAT_SCRIPT: AudioScript = {
  slug: "hm-swm-im-slow-heat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're seeded mid-pack in a slow heat, racing a clock instead of bodies — in the one event that's supposed to be all yours, the medley where you do everything. The fast IMers are swimming later, without you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your shoulders slump on the deck. You feel forgotten in your own event. The voice says even my race isn't the real race. That's the discouragement talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The seed sheet is a starting point, not a sentence. Times don't care which heat you swim them in. Stand tall behind the blocks, let your shoulders drop, and take one slow, easy breath.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Race the clock, not the bodies. Lock onto your splits, attack every transition, and chase the number you came for. A best time in the IM from a slow heat counts exactly the same.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow heat is real and it is over once you dive. It is not your identity. The clock reports a swim, it cannot name a swimmer, and a seed line can't either. You're secure. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_IM_READY_ROOM_SCRIPT: AudioScript = {
  slug: "hm-swm-im-ready-room",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Behind the blocks before the IM, your heat about to be called. You're already bracing for the breast leg everyone can see — the part of the race you can't hide, the one where the gap always seems to open.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart thumps. Your hands fidget at your cap. Your stomach is light. What if the breast leg gives me away again, right out in the open. That's the nerves talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Stand tall behind the blocks, let your shoulders drop, roll them back once, and take one slow, easy breath of the deck air.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to swim a perfect breast leg — you have to swim your race. Set up the fly and back so you arrive strong, hold the breast tempo you own, and trust your free to bring it home.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. One exposed leg doesn't name you, and neither does the clock — it reports a swim, not a swimmer. Step up, react to the horn, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_SWM_IM_GO_OUT_SLOW_SCRIPT: AudioScript = {
  slug: "hm-swm-im-go-out-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your breast split is the slow leg again. You watch the gap open exactly where you knew it would, the lanes pulling away as you grind through the one stroke that won't come — and your weak leg costs you the race.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stroke labors through the breast. Your eyes catch the lanes slipping ahead. The voice says my weak leg always sinks me. That's the discouragement talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That race is over and the time is on the board. Stand tall behind the blocks, let your shoulders drop, and take one slow, easy breath of the deck air.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A weak leg is the all-rounder's next gain, not your ceiling. Next race, swim the breast you have with tempo and a long line — and take the work to practice, where weak legs get built. The other three legs are yours.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow leg is real and it is over. It is not your identity. The clock reports a swim, it cannot name a swimmer — one weak split doesn't lower your worth. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const SWIMMING_PREGAME_CLIP_SCRIPTS: AudioScript[] = [
  CLIP_VIZ_SPRINT_SCRIPT,
  CLIP_VIZ_DIST_SCRIPT,
  CLIP_VIZ_STROKE_SCRIPT,
  CLIP_VIZ_IM_SCRIPT,
  CLIP_HM_SWM_STROKE_TOUCHED_OUT_SCRIPT,
  CLIP_HM_SWM_STROKE_FALSE_START_SCRIPT,
  CLIP_HM_SWM_STROKE_DQ_SCRIPT,
  CLIP_HM_SWM_STROKE_PLATEAU_SCRIPT,
  CLIP_HM_SWM_STROKE_BAD_TURN_SCRIPT,
  CLIP_HM_SWM_STROKE_MIND_WANDERS_SCRIPT,
  CLIP_HM_SWM_STROKE_GOGGLES_SCRIPT,
  CLIP_HM_SWM_STROKE_SLOW_HEAT_SCRIPT,
  CLIP_HM_SWM_STROKE_READY_ROOM_SCRIPT,
  CLIP_HM_SWM_STROKE_GO_OUT_SLOW_SCRIPT,
  CLIP_HM_SWM_IM_TOUCHED_OUT_SCRIPT,
  CLIP_HM_SWM_IM_FALSE_START_SCRIPT,
  CLIP_HM_SWM_IM_DQ_SCRIPT,
  CLIP_HM_SWM_IM_PLATEAU_SCRIPT,
  CLIP_HM_SWM_IM_BAD_TURN_SCRIPT,
  CLIP_HM_SWM_IM_MIND_WANDERS_SCRIPT,
  CLIP_HM_SWM_IM_GOGGLES_SCRIPT,
  CLIP_HM_SWM_IM_SLOW_HEAT_SCRIPT,
  CLIP_HM_SWM_IM_READY_ROOM_SCRIPT,
  CLIP_HM_SWM_IM_GO_OUT_SLOW_SCRIPT,
  CLIP_HM_SWM_SPRINT_TOUCHED_OUT_SCRIPT,
  CLIP_HM_SWM_SPRINT_FALSE_START_SCRIPT,
  CLIP_HM_SWM_SPRINT_DQ_SCRIPT,
  CLIP_HM_SWM_SPRINT_PLATEAU_SCRIPT,
  CLIP_HM_SWM_SPRINT_BAD_TURN_SCRIPT,
  CLIP_HM_SWM_SPRINT_GOGGLES_SCRIPT,
  CLIP_HM_SWM_SPRINT_SLOW_HEAT_SCRIPT,
  CLIP_HM_SWM_SPRINT_READY_ROOM_SCRIPT,
  CLIP_HM_SWM_SPRINT_GO_OUT_SLOW_SCRIPT,
  CLIP_HM_SWM_DIST_FALSE_START_SCRIPT,
  CLIP_HM_SWM_DIST_DQ_SCRIPT,
  CLIP_HM_SWM_DIST_PLATEAU_SCRIPT,
  CLIP_HM_SWM_DIST_BAD_TURN_SCRIPT,
  CLIP_HM_SWM_DIST_MIND_WANDERS_SCRIPT,
  CLIP_HM_SWM_DIST_GOGGLES_SCRIPT,
  CLIP_HM_SWM_DIST_SLOW_HEAT_SCRIPT,
  CLIP_HM_SWM_DIST_READY_ROOM_SCRIPT,
  CLIP_HM_SWM_DIST_GO_OUT_SLOW_SCRIPT,
];
