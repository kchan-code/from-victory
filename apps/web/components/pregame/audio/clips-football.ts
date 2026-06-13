// Football pregame compositional clips (FV-202) — 7 role VIZ clips + 67
// hard-moment cells, authored by the content trio + football-expert under lead
// orchestration from the FV-201 taxonomy (docs/football-module-map.md). The
// football analog of clips-golf.ts / clips-baseball.ts. Kept in a sibling file
// to stay out of the clips.ts hot file. Registered into CLIP_SCRIPTS via
// `...FOOTBALL_PREGAME_CLIP_SCRIPTS` in clips.ts.
//
// Per-cell structure mirrors golf/baseball: a standalone hard-moment block of
// [rehearse → scenario → body-feel/false-story → reset → tactical resets →
// truth], wrapped at runtime by the shared opener / VIZ / faith clips. Slug
// scheme: hm-ftb-{role}-{fragment} (baseball owns hm-bsb-, basketball hm-bb-,
// golf hm-glf-, hockey session-). Roles: QB/RB/WR/OL/DL/LB/DB. Audio render is
// DEFERRED (the sport is DORMANT) — this file is the TTS INPUT, no MP3s yet.
//
// CLINICAL GATES (football-expert §12): every `big-hit` cell ships as
// COMPETITIVE COURAGE only — never concussion, head-injury, playing-hurt, or
// body-comp. Any big-hit cell that cannot stay competitive-layer is the
// conditional withhold (omit from FOOTBALL_CONFIG.roleAdversities) until
// clinical sign-off. OL cells never reference body weight / mass-gain.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import {
  QB_VIZ,
  RB_VIZ,
  WR_VIZ,
  OL_VIZ,
  DL_VIZ,
  LB_VIZ,
  DB_VIZ,
} from "./segments-football.ts";

// Same target as CLIP_LOUDNORM_FILTER in clips.ts. Defined locally to avoid a
// circular import (clips.ts imports FOOTBALL_PREGAME_CLIP_SCRIPTS from here).
const FOOTBALL_LOUDNORM_FILTER = "loudnorm=I=-16:TP=-1.5:LRA=11";

// ── Football VIZ clips — one per role (FV-202) ───────────────────────────────

export const CLIP_VIZ_QB_SCRIPT: AudioScript = {
  slug: "viz-ftb-qb",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [...QB_VIZ],
};

export const CLIP_VIZ_RB_SCRIPT: AudioScript = {
  slug: "viz-ftb-rb",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [...RB_VIZ],
};

export const CLIP_VIZ_WR_SCRIPT: AudioScript = {
  slug: "viz-ftb-wr",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [...WR_VIZ],
};

export const CLIP_VIZ_OL_SCRIPT: AudioScript = {
  slug: "viz-ftb-ol",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [...OL_VIZ],
};

export const CLIP_VIZ_DL_SCRIPT: AudioScript = {
  slug: "viz-ftb-dl",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [...DL_VIZ],
};

export const CLIP_VIZ_LB_SCRIPT: AudioScript = {
  slug: "viz-ftb-lb",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [...LB_VIZ],
};

export const CLIP_VIZ_DB_SCRIPT: AudioScript = {
  slug: "viz-ftb-db",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [...DB_VIZ],
};

// ── Hard-moment cells — Offense (QB/RB/WR/OL) ──

// ── QB (9) ──

export const CLIP_HM_FTB_QB_PICK_SCRIPT: AudioScript = {
  slug: "hm-ftb-qb-pick",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You drop back and let it go over the middle. The ball hangs. The safety reads it the whole way, jumps the route, and picks it clean. The sideline goes silent, and both phones just caught it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach drops as he runs it back. Your jaw locks. And the voice lands flat — I'm the guy who can't be trusted with the ball. That's the pick talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That throw is over and it's already on the scoreboard. The walk back to the huddle is your reset — defense is on the field, and the next series is clean. Breathe out and let it go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't try to win it all back on the next throw. The hero ball is exactly how you throw a second one. Take the easy completion, get the offense moving, and do your job one snap at a time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That pick is real and it is over. It is not your identity, and it doesn't decide whether you can be trusted — you're secure before this drive and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_QB_BEAT_SCRIPT: AudioScript = {
  slug: "hm-ftb-qb-beat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "They disguised it. The look you read pre-snap rotated the second you snapped it. You stared down your first read, and the corner you never accounted for broke on the ball. They had you the whole way.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your face gets hot. You replay the coverage you missed. The thought arrives — they're a step ahead of me out here. It's frustration talking. Let it move through.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That snap is over. Getting fooled once is information, not a verdict. Walk back to the huddle, take a breath, and play the next down on its own.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now use it. Read the safeties before the snap, take what they give you, and work through your progression instead of locking on. Don't press — let the read come to you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting read out is real and it is over. It is not your identity. You're secure whether they win a down or you do — see it clean and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_QB_FILM_MISTAKE_SCRIPT: AudioScript = {
  slug: "hm-ftb-qb-film-mistake",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Monday film. The room goes quiet. Coach freezes the frame and clicks back to it twice — your receiver wide open on the back side, and you never saw him because you locked onto the wrong half of the field.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your ears go hot in the dark room. You want to sink into the chair. The voice says everybody's watching me get this wrong. That's the embarrassment talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rep is on tape and it's done. Film is where you fix it, not where you're sentenced. Sit up, look at it straight, and take the coaching.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't hide from the clip. Mark the read, see the full field on the next install, and let the correction make you better. One coaching point, owned.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That missed read is real and it is over. It is not your identity, and one frame on the screen isn't your worth. You're secure in that room. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: scoop-and-score off a strip-sack — the compound two-possession swing.
// Authored to BREAK THE COMPOUND, not relive it. Ships on the standard picker.
export const CLIP_HM_FTB_QB_BIG_PLAY_SCRIPT: AudioScript = {
  slug: "hm-ftb-qb-big-play",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're climbing the pocket and never feel the edge rusher. He rakes the ball loose, it hits the turf, and their end scoops it and runs it sixty yards the other way. Score off you. A two-possession swing with your name on it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat climbs up your neck. Your chest goes tight watching him cross the goal line. You replay the fumble on a loop — I just handed them the whole game. That's the spiral talking. It is not a fact. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here is the move. That play is over and it's on the board — it does not get the next series too. The walk to the sideline ends it. Right now, it's done.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One bad play becomes a bad half when you press to get it all back at once. Don't. There's a lot of football left and points come in drives, not in one hero throw.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "When you get the ball back, get the offense breathing. Take the checkdown, move the chains, feel the rush and get it out clean. Stack one good play, then the next. Don't press — do your job.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That turnover is real and it is over. It is not who you are, and a swing on the scoreboard doesn't change what you're worth — you compete from a victory that's already yours, ahead or behind. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_QB_PULLED_SCRIPT: AudioScript = {
  slug: "hm-ftb-qb-pulled",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Coach taps the backup and sends him in mid-series. You jog off, and now you're standing on the sideline holding your helmet, watching the offense move the ball without you under center.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your throat tightens. Your eyes drop to the grass. And the question lands hard — if I'm not the starter, who am I out here. That's the hurt talking, not the truth. Let it sit and let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That decision is a call about this game, not about you. Get on the headset, watch the coverages, and stay in the game with your guys. You're still on this team and still in this.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't sulk and don't press to prove a point when you get back in. Read what the defense is doing, log it, and be ready to lead the next drive cold. One snap, when it comes.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting pulled is real, and it stings. It is not your identity — the depth chart doesn't name you, and your worth was never the starting job. Stay ready, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_QB_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-ftb-qb-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Pregame. The whole offense rides on you tonight. Every eye in town is on the guy under center, and your hands are already sweating through warmups before a single snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart thumps. Your stomach is light. Your grip on the ball feels off. What if I come out flat with all of them watching. That's the fear talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath, feel your cleats in the grass, and step into your first read.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to be the hero on the first snap. You need your job — clean footwork, good read, completion. Hit the easy one early and let the game settle you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The crowd doesn't get to name you and neither does the first drive. Take the snap, make the read, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// COMPETITIVE-COURAGE ONLY: clean blindside sack. NO injury, symptoms, or
// "tough it out" — the rehearsal stays on standing in and throwing it again.
export const CLIP_HM_FTB_QB_BIG_HIT_SCRIPT: AudioScript = {
  slug: "hm-ftb-qb-big-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The pocket collapses faster than you read it. You set to throw and take a clean shot from the blind side you never saw coming. You go down hard and you're slow getting up off the turf.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your breath is short as you push up to your feet. There's a flicker that says I don't want to feel that again. That's fear knocking, not the truth. Notice it and let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That sack is over. You're back on your feet and back in the huddle. The test of this moment is simple — stand in the pocket and throw the next one with the same conviction.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't bail early and don't flinch the next throw. Trust your protection, climb the pocket, keep your eyes downfield, and deliver it on time. Same read, full commitment.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That hit is real and it is over. It is not your identity, and being knocked down doesn't lower your worth. You're secure on your feet — stand in and throw it again. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_QB_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-ftb-qb-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Three-and-out. Then another three-and-out. You've opened flat — no rhythm, no completion you can build on — and the crowd is restless before you've even moved the ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your grip squeezes the ball too hard. Your tempo races ahead of you. I have to flip this on the next drive before it buries us. That's the pressing talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Two quiet drives are a start, not the game. A slow open is just an open. Walk into the huddle and let the next series be a fresh one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop trying to fix it with one big throw. Slow your feet, take the completion underneath, and get the offense in rhythm. One first down, then the next.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow start is real and it is over. It is not your identity. You don't have to rescue the game to be secure — you already are. One clean read, one drive, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_QB_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-ftb-qb-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're down fourteen before you've even found the field. The sideline gets quiet, and every eye turns to you to be the one who single-handedly brings it all back.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw locks. You start hunting the home-run throw on every snap. I have to make this all up right now, by myself. That's the pressure talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop staring at the scoreboard. Fourteen doesn't come back on one play — it comes back in drives, one first down at a time. Bring your focus down to just this snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The hero ball is exactly the wrong play when you're chasing. Take what they give you, trust your guys to make plays, and don't press. Move the chains and let the game come to you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Being down two scores is real. It is not your identity, and the scoreboard doesn't get to name you. Lead the offense one snap at a time, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Running Back (10) ──

// ⚠ HIGH: the fumble that benches you — the one sin. Authored to break the
// catastrophizing, not feed it. Ships on the standard picker.
export const CLIP_HM_FTB_RB_FUMBLE_SCRIPT: AudioScript = {
  slug: "hm-ftb-rb-fumble",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You break into the open field and reach to extend the run. The ball comes loose, bounces once, and they fall on it. The one sin your coach pulls guys for, and it just happened in front of him.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach drops scrambling for it. Heat floods your chest. And the voice lands flat — one fumble and I'm done out here. That's the fear talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here is the move. That carry is over and it's on the board — it does not get the rest of your game. The jog to the sideline ends it. Right now, it's done.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One fumble doesn't write the game and it doesn't write you. The catastrophe in your head — I'm done — isn't real. There's more football, and your next carry is coming.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "When the ball's back in your hands, high and tight — five points of pressure, ball covered through the whole run. Don't run scared and don't press. Hit the hole and finish forward.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That fumble is real and it is over. It is not your identity, and one mistake doesn't decide whether you belong — you're secure before this carry and after it. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_RB_BEAT_SCRIPT: AudioScript = {
  slug: "hm-ftb-rb-beat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "It's your block to make. The linebacker comes clean off the edge because you whiffed it, and your quarterback eats the sack. You know the film room is going to land right on you for that one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your ears go hot watching your QB get up. You replay the missed block. The thought lands — I let him down. It's frustration talking. Let it move through.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rep is over. A missed block is one rep, not a verdict on your game. Walk back to the huddle, breathe, and lock into the next assignment.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now go protect him. Read the front, square up the blitz, get your feet set and deliver a strike on the next pickup. Don't press — just do your job and finish the block.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That missed block is real and it is over. It is not your identity. You're secure whether you win the rep or lose it — square up the next one and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_RB_FILM_MISTAKE_SCRIPT: AudioScript = {
  slug: "hm-ftb-rb-film-mistake",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Film session. Coach freezes the frame. The play was designed to bounce outside, you cut it back, ran straight into your own blocker, and left a wide-open touchdown on the field. Frozen there for the room.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your ears go hot in the dark. You want to slide down in the seat. The voice says everyone's watching me get this wrong. That's the embarrassment talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rep is on tape and it's done. Film is where you fix it, not where you're judged. Sit up, look at it straight, and take the coaching.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't hide from the clip. See the design, trust your read, hit the right hole on the next install. One coaching point, owned.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That wrong read is real and it is over. It is not your identity, and one frame on the screen isn't your worth. You're secure in that room. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: 4th-quarter fumble returned for six — the compound swing. Authored to
// BREAK THE COMPOUND, not relive it. Ships on the standard picker.
export const CLIP_HM_FTB_RB_BIG_PLAY_SCRIPT: AudioScript = {
  slug: "hm-ftb-rb-big-play",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Fourth quarter, you're winning, and they punch the ball out. It hits the turf, their guy scoops it, and runs it back for six. The lead you were protecting just flipped, on a play with your name on it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat floods up your neck. Your chest goes tight watching him cross the goal line. You replay the fumble on a loop — I just gave the game away. That's the spiral talking. It is not a fact. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here is the move. That play is over and it's on the board — it does not get the rest of the game too. The jog to the sideline ends it. Right now, it's done.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One play becomes a loss only if you let it drag you down with it. The game isn't over. There's time on the clock and your offense gets the ball back.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "When you're back in, ball high and tight, five points of pressure. Hit the hole hard, finish every run forward, and protect it like your life. Don't press — trust the next carry.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That fumble is real and it is over. It is not who you are, and a swing on the scoreboard doesn't change what you're worth — you compete from a victory that's already yours, win or lose. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_RB_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-ftb-rb-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The other back catches fire, and the carries start drying up. You stand on the sideline watching your touches — and your tape — go to someone else, series after series.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw tightens watching him rip off a run. Your eyes drop. The voice says they've moved on from me. That's the hurt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A hot hand is a call about this game, not about your worth. Stay locked in on the sideline, read the front, and be ready the moment your number comes back.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't press to prove a point when you get back in. Hit the hole, protect the ball, finish forward — let your next carry speak for itself. One clean rep.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Losing carries is real, and it stings. It is not your identity, and the depth chart doesn't name you. Stay ready, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_RB_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-ftb-rb-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "First carry is coming. The defense is keying on you all night, the box is loaded, and you can feel yourself gripping the ball too tight before the handoff is even in your gut.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart thumps in the stance. Your hands squeeze early. What if they stuff me right out of the gate. That's the nerves talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. One slow breath, feel your feet under you, and settle into your stance.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to break a long one on the first touch. Take the handoff clean, ball high and tight, read your blocks, and get downhill. Trust your eyes.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The defense keying on you doesn't name you. Take the rock, read it, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// COMPETITIVE-COURAGE ONLY: collision in the hole. NO injury, symptoms, or
// "tough it out" — the rehearsal stays on getting up and asking for the ball.
export const CLIP_HM_FTB_RB_BIG_HIT_SCRIPT: AudioScript = {
  slug: "hm-ftb-rb-big-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You hit the hole and lower your shoulder into the linebacker waiting there. It's a full collision, helmet to numbers, and you take the whole thing as you fight for the extra yard.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your breath is short as you climb back up. There's a flicker that says maybe I should run a little softer next time. That's fear knocking, not the truth. Notice it and let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That collision is over. You're back on your feet. The test of this moment is simple — get up, walk to the huddle, and ask for the ball again.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't tiptoe the next carry. Pad level low, run behind your shoulders, hit the hole with your eyes up and finish forward. Run downhill, full commitment.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That hit is real and it is over. It is not your identity, and getting met in the hole doesn't lower your worth. You're secure on your feet — get up and ask for the ball. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_RB_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-ftb-rb-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Stuffed on your first three carries. No creases, nothing open, the line losing the early reps. You start pressing — bouncing runs that should hit inside, instead of trusting the next one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your grip tightens on the ball. Your feet get quick and impatient. I have to break one before they give up on the run. That's the pressing talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Three stuffed carries are a start, not the game. Backs wear a defense down. Walk to the huddle and let the next carry be a fresh one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop trying to bounce everything for the home run. Be patient, press the hole, trust your blocks, and take the four yards that are there. The crease comes when you stay downhill.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow start is real and it is over. It is not your identity. You don't have to break one to be secure — you already are. One patient run, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_RB_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-ftb-rb-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Down two scores early, and the game script abandons the run. The offense goes pass-heavy, your role shrinks, and you find yourself standing on the sideline watching it happen.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest tightens watching from the grass. You feel forgotten out there. The voice says I'm not part of this anymore. That's the frustration talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The deficit and the game plan are real, but they don't shrink you. Stay locked into the game, stay warm, and be ready — your number is coming back, and one play swings the script.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "When you're in, do your job all the way. Run your routes out of the backfield, pick up the blitz clean, and protect your QB. Don't press — be reliable and the carries come back.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Falling behind early is real. It is not your identity, and a shrinking role doesn't name you. Stay ready, do your job, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_RB_TRENCH_BATTLE_SCRIPT: AudioScript = {
  slug: "hm-ftb-rb-trench-battle",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Fourth-and-one, short-yardage package, the whole stadium knows it's coming to you. You hit the hole and meet the linebacker head-on — and he stands you straight up, stops you short of the sticks.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw clamps. Your legs feel stopped cold. The voice says I couldn't get one yard when it mattered. That's the sting talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rep is over. One stop in the short yardage is one rep, not the measure of you. Walk off the field, breathe, and stay ready for the next time they hand it to you there.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next short-yardage rep — pad level lower than his, get your feet churning, run behind your shoulders and fall forward. Win the leverage, not the staredown. Don't press, just drive.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting stuffed short is real and it is over. It is not your identity. You're secure whether you got the yard or not — lower your pads and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Receiver (10) ──

export const CLIP_HM_FTB_WR_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-ftb-wr-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You catch the slant clean and turn upfield thinking yards. You never see the safety closing — and he punches the ball out from behind. A catch that became a giveaway, fumbled away in the open field.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach drops watching them recover it. Heat floods your chest. The voice says I gave it right back. That's the frustration talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That play is over and it's on the board. The jog back to the huddle ends it. Breathe out and let the giveaway go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "When the ball's in your hands again, secure it first, then go. Tuck it high and tight after the catch, get north, and protect it through contact. Don't press — finish the catch before the run.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That fumble is real and it is over. It is not your identity. You're secure before this drive and after it — tuck the next one and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_WR_BEAT_SCRIPT: AudioScript = {
  slug: "hm-ftb-wr-beat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The corner gets his hands on you at the line and rides your hip the whole route. You never come open. The QB checks it down to someone else — and on that play, you didn't exist.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw tightens jogging back. You replay getting jammed. The thought lands — I can't shake this guy. It's frustration talking. Let it move through.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rep is over. Losing one route is one rep, not a verdict on your hands or your speed. Walk back to the huddle, breathe, and reset for the next route.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now beat the jam. Vary your release, get your hands inside his, stem him off the line and stack him at the top of the route. Run it crisp — don't press, just win your leverage.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting jammed is real and it is over. It is not your identity. You're secure whether you win the rep or lose it — beat the press and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: the drop that puts the hands in your head. Authored to break the
// catastrophizing, not feed it. Ships on the standard picker.
export const CLIP_HM_FTB_WR_FILM_MISTAKE_SCRIPT: AudioScript = {
  slug: "hm-ftb-wr-film-mistake",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Third down, the ball hits you square in the hands, and it clanks straight off and onto the turf. Drive over. And now, jogging off, your hands are starting to think instead of just catch.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach sinks. Your hands feel stiff and unsure. And the voice lands flat — I've got the drops now. That's the fear talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here is the move. That drop is over and the down is gone. One ball off your hands is one rep, not a label that follows you. The jog to the huddle ends it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't let your hands start thinking. The story — I've got the drops — isn't true. You've caught ten thousand of these. Trust your hands and let them work on their own.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "On the next target — eyes all the way through it, watch it into the tuck, look it in before you run. Catch it first, then go. Don't press, just see the ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That drop is real and it is over. It is not your identity, and one ball off your hands doesn't make you a guy who can't catch — you're secure before this target and after it. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: the dropped touchdown — wide open, perfect throw. Authored to break the
// catastrophizing, not feed it. Ships on the standard picker.
export const CLIP_HM_FTB_WR_BIG_PLAY_SCRIPT: AudioScript = {
  slug: "hm-ftb-wr-big-play",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You've beaten the coverage clean, wide open down the field. The throw is perfect, right in your hands, nobody near you — and you drop the touchdown. The only clip anyone is going to replay.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat floods your face as you watch it hit the grass. Your chest goes tight. You replay it on a loop — I had it and I dropped it in front of everyone. That's the spiral talking. It is not a fact. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here is the move. That ball is over and the play is dead. One drop, even a big one, is one rep — it does not get the rest of your game. The jog to the huddle ends it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One drop becomes a bad night only if you let it. The replay in your head isn't the next play. There's more football, and your number is going to be called again.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "When it comes back your way — eyes through the ball, watch it all the way into the tuck, look it in before you think about running. Want the next one. Don't press, just catch it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That drop is real and it is over. It is not who you are, and one play on the highlight isn't your worth — you compete from a victory that's already yours, catch or drop. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_WR_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-ftb-wr-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "After the drop, the ball stops coming your way. You run great routes into a void — you're open and the quarterback looks somewhere else. Nobody benched you on paper, but the trust is gone.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw tightens coming back to the huddle uncovered again. Your shoulders drop. The voice says he doesn't trust me anymore. That's the hurt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Trust gets rebuilt one rep at a time, and it's not a verdict on who you are. Walk back to the huddle, breathe, and run the next route like the ball's coming.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Keep running everything full speed, win at the top of your routes, and finish your blocks downfield. Earn it back on tape. The targets come back to guys who keep showing up open.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Losing his trust is real, and it stings. It is not your identity, and where the ball goes doesn't name you. Keep running, stay ready, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_WR_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-ftb-wr-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "First target is coming up on the script — the route depends on you. You're standing at the line and all you can think about is your hands, worried about the catch before the ball is even snapped.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart thumps in the stance. Your hands feel tight already. What if I drop the first one with everyone watching. That's the nerves talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. One slow breath, feel your feet at the line, and lock onto your release.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't think about your hands — let them work. Get off the line clean, run the route crisp, eyes through the ball, and catch it first. Trust what you've trained.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The crowd doesn't get to name you and neither does the first target. Run it, see the ball, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// COMPETITIVE-COURAGE ONLY: the dig into coverage. NO injury, symptoms, or
// "tough it out" — the rehearsal stays on keeping eyes on the ball through the hit.
export const CLIP_HM_FTB_WR_BIG_HIT_SCRIPT: AudioScript = {
  slug: "hm-ftb-wr-big-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're running the dig into the teeth of the coverage. You know the safety is sitting right there, waiting, and the ball and the hit are going to arrive at the same time over the middle.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your eyes want to leave the ball and find the safety. Your shoulders want to brace early. That flinch is fear talking, not the truth. Notice it and let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here's the rep. The test of this moment is simple — keep your eyes on the ball all the way through the hit. Catch it first, take what comes, and hold on.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't short-arm it and don't peek at the safety. Run through the catch point, eyes on the ball, secure it, and brace late. Finish the route with full commitment.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The hit over the middle is real and it is part of the route. The fear is not your identity, and standing in there doesn't decide your worth. You're secure either way — eyes on the ball, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_WR_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-ftb-wr-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "No targets through the whole first quarter. You're cold, you've been blocking and decoying, and when your number finally gets called you realize you're not warmed into the game yet.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your hands feel a step behind. Your timing is rusty. The voice says I'm cold, I'm going to botch the one chance I get. That's the doubt talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A quiet quarter isn't a verdict on your night — it's just the game flow. Walk to the line, breathe, and treat this rep like the first one of the day.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't need to be perfect — you need to be ready. Run the route full speed, eyes through the ball, and catch the simple one to get warm. One clean rep wakes you up.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Being cold is real and it passes. It is not your identity, and a quiet quarter doesn't name you. Run it full speed, see the ball, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_WR_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-ftb-wr-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Down multiple scores, and the offense goes pass-heavy and desperate. Every throw your way suddenly feels like it has to be a big one, like you have to make a play every single snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your hands grab early. You're already thinking about running before you catch it. I have to break a big one right now to get us back. That's the pressing talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop staring at the scoreboard. The deficit doesn't come back on one catch — it comes back in drives, one first down at a time. Bring it down to just this route.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't try to do too much with every ball. Run your route clean, catch it first, then get what's there. Move the chains and let the offense climb back. Don't press.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Falling behind early is real. It is not your identity, and the scoreboard doesn't get to name you. Run clean, catch the ball, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_WR_TRENCH_BATTLE_SCRIPT: AudioScript = {
  slug: "hm-ftb-wr-trench-battle",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Perimeter run, and your job was to seal the corner. The defensive back beats you to the spot, sheds you, and drops your back for a loss. A block nobody films — but the coach grades it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your ears go hot watching the tackle behind the line. The voice says I cost my guy the run. It's frustration talking. Let it move through.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That block is over. One lost rep on the edge is one rep, not the measure of your effort. Walk back to the huddle, breathe, and lock into the next assignment.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next perimeter run — break down under control, get your hat across, stay on your feet and run your feet through the block. Win the leverage and finish him. Don't press, just sustain.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Losing that block is real and it is over. It is not your identity. You're secure whether you win the rep or lose it — get your hat across and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Offensive Line (9) ──

export const CLIP_HM_FTB_OL_BEAT_SCRIPT: AudioScript = {
  slug: "hm-ftb-ol-beat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your guy hits you with a move you watched on tape all week, and you still bite. He's past you with a free run at the quarterback. The one job — keep him clean — and you just failed it in front of everyone.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your face gets hot turning to watch the pressure. You replay the move you should have had. The thought lands — I got beat clean. It's frustration talking. Let it move through.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rep is over. Getting beat once is one rep, not a verdict on your game. Walk back to the huddle, breathe, and reset your eyes for the next snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now answer it. Set with patience, hands inside, anchor your base, and mirror his feet — you know his move now. Win the next rep clean. Don't press, just trust your technique.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting beat is real and it is over. It is not your identity. You're secure whether you win the rep or lose it — set your hands and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_OL_FILM_MISTAKE_SCRIPT: AudioScript = {
  slug: "hm-ftb-ol-film-mistake",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Film. Coach freezes it on the stunt. You and the guard both blocked the same man and left the looper unblocked, and the room watches your quarterback get crushed — on a protection call that was yours.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your ears go hot in the dark room. You want to sink into the seat. The voice says I blew the call and everyone saw it. That's the embarrassment talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rep is on tape and it's done. Film is where you fix it, not where you're sentenced. Sit up, look at the stunt straight, and take the coaching.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't hide from the clip. Communicate the front, pass off the stunt, take your man and trust the guard to take his. One coaching point, owned.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That blown assignment is real and it is over. It is not your identity, and one frame on the screen isn't your worth. You're secure in that room. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: the red-zone strip-sack. COMPETITIVE-COURAGE framing — you protect him
// by anchoring the NEXT rep. NO injury dwelling. Ships on the standard picker.
export const CLIP_HM_FTB_OL_BIG_PLAY_SCRIPT: AudioScript = {
  slug: "hm-ftb-ol-big-play",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Red zone, you get beat clean off the edge, and your quarterback goes down before he can set — strip-sack, ball on the ground. The drive dies right there, on a rep with your name on it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat climbs up your neck watching the pile. Your chest goes tight. And the voice lands flat — I let my quarterback down. That's the spiral talking. It is not a fact. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here is the move. That rep is over and it's done — it does not get the rest of the game. The walk back to the huddle ends it. The way you protect him now is the next rep, not the last one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One sack becomes a bad night only if you let it shake your set. The story in your head — I let him down — gets quiet the moment you anchor the next pass pro. He needs your eyes up and your base down.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next pass set — patient feet, hands inside, anchor against the bull and mirror the speed. Keep the pocket clean and give him his throwing lane. Don't press, just win your rep.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That sack is real and it is over. It is not who you are, and one rep doesn't decide whether you can protect him — you're secure before this drive and after it. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_OL_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-ftb-ol-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The o-line coach rotates the other tackle in — and then doesn't rotate you back. Standing on the sideline, you realize the depth-chart battle you thought you'd won is wide open again.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw tightens watching him take your reps. Your eyes drop. The voice says I'm losing my spot. That's the hurt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A rotation is a call about today, not about your worth. Stay locked in on the sideline, watch the front, and be ready the moment they send you back in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Don't press to prove a point when you get back out there. Set clean, anchor your base, finish your man — let your tape win the spot back. One solid rep at a time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Losing reps is real, and it stings. It is not your identity, and the depth chart doesn't name you. Stay ready, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_OL_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-ftb-ol-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Big rivalry game. You're matched up all night with their best edge rusher, and you're carrying it before the kickoff — the knowledge that one slip leaves your quarterback on his back.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your stomach is tight in the locker room. Your hands flex and clench. What if he wins all night and it's on me. That's the nerves talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. One slow breath, feel your base under you, and narrow it to one rep at a time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to shut him out all night in your head right now — you have to win the first rep. Patient set, hands inside, anchor your base. One snap, then the next.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The matchup doesn't get to name you. Set your hands, anchor down, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// COMPETITIVE-COURAGE ONLY: bull-rush driven back. Leverage/anchor framing.
// NO injury, NO body weight/mass — the rehearsal stays on anchoring, not folding.
export const CLIP_HM_FTB_OL_BIG_HIT_SCRIPT: AudioScript = {
  slug: "hm-ftb-ol-big-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The defensive tackle puts his hands on you and bull-rushes straight through the middle. He's walking you backward, right into the pocket, into your own quarterback. The rep is slipping.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your feet want to give ground. There's a flicker that says he's stronger than me, just give. That's the doubt talking, not the truth. Notice it and let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here's the rep. The test of this moment is simple — anchor instead of folding. Sink your hips, drop your base, and stop the ground you're giving.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Win it with leverage, not by out-muscling him. Pad level under his, hands inside on his chest, hips down, and re-anchor. Knock his hands off and reset your base. Don't fold — sit down on it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting bull-rushed is real and it is part of the rep. Giving a little ground is not your identity, and it doesn't decide your worth. You're secure either way — sink your hips, anchor, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_OL_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-ftb-ol-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "First series, and the defense's tempo and stunts have you a half-beat slow. Every snap the pocket is muddy, somebody's leaking through, and you're playing catch-up before you've settled in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your sets are rushed and your hands are late. Your feet feel heavy. I'm a step behind all of them tonight. That's the doubt talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One muddy series isn't the game — the front line settles in as the game goes. Walk to the huddle, breathe, and let the next snap be a fresh one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow yourself back down. Patient set, eyes on the front, communicate the stunt, hands inside. Win one clean rep and the tempo stops feeling fast. One snap at a time.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. A slow start is real and it is over. It is not your identity. You don't have to be perfect to be secure — you already are. One clean set, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_OL_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-ftb-ol-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Down two scores, and everyone in the stadium knows it's a passing down. You're pass-blocking a rush that's teeing off, ears pinned, coming after your quarterback on every single snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest tightens before the snap. You feel the pressure of having to hold them all by yourself. If one of us slips, he's down again. That's the pressure talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The deficit is real, but it doesn't change your job — it narrows it. You don't block the scoreboard, you block one man. Bring your eyes to your guy and breathe.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Even on a known passing down, win your one rep. Patient set, hands inside, anchor your base, mirror him. Hold the edge of the pocket and trust the four next to you. Don't press, just your man.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Falling behind early is real. It is not your identity, and the scoreboard doesn't get to name you. Win your one rep, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_OL_TRENCH_BATTLE_SCRIPT: AudioScript = {
  slug: "hm-ftb-ol-trench-battle",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You and the nose are nose-to-nose every snap. On a critical short-yardage rep he stones you at the point of attack, and the run gets blown up right there before it starts.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your jaw clamps watching the back get stopped. Your hands feel beaten to the punch. And the voice lands flat — I got moved off the ball. That's the sting talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rep is over. One lost rep at the point of attack is one rep, not the measure of you. Walk back to the huddle, breathe, and reset your eyes for the next snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Win it with leverage, not by trying to overpower him. First step low and quick, hands inside on his pads, hips through and roll — get under his pad level and drive your feet. Beat him to the punch. Don't press, just leverage.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting stood up is real and it is over. It is not your identity. You're secure whether you win the rep or lose it — get under his pads and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Hard-moment cells — Defense (DL/LB/DB) ──

// ── Defensive Line / Edge (9) ──

export const CLIP_HM_FTB_DL_BEAT_SCRIPT: AudioScript = {
  slug: "hm-ftb-dl-beat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The tackle reaches you on the snap, gets his head across, and hooks you inside. He seals you out of your gap. The back hits the lane you were supposed to own, clean, and he's into the second level.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your hands drop. Your feet feel stuck in the block. You stand there a beat watching the run hit your gap. He owned me on that one. That's the frustration talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rep is over. The walk back to the line is your reset. One block doesn't decide the next one — let it go and get your eyes back to the ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next snap, beat him off the ball. Get your hands inside first, lock him out, and hold your gap. Don't let him get his head across — strike, control, and play your edge.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That reach block is real and it is over. It is not your identity. One rep he won doesn't change who you are — you're secure before this snap and after it. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_DL_FILM_MISTAKE_SCRIPT: AudioScript = {
  slug: "hm-ftb-dl-film-mistake",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You crashed inside chasing the ball instead of staying home on the edge. The quarterback pulled it and kept it around the side you vacated. Now it's Monday, the room is dark, and the film stops on the gap you abandoned.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your face goes hot in the dark room. Your stomach sinks as the clip rewinds. You wish you could climb into the screen and stay home. How did I leave that edge. That's the embarrassment talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That snap is on the tape and it's already graded — it doesn't get to follow you to practice. The film is for learning, not for living in. See it once, own it, and let it go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here's the fix, simple and concrete. Edge is yours — stay home, squeeze, keep contain. Let the ball come to you instead of chasing it inside. Trust your run fit and make the QB give it up.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That blown run fit is real and it is over. It is not your identity. A bad rep on film doesn't name you — you're secure whether the grade is good or bad. Learn it, reset, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: the compound big-run cell. Authored to BREAK THE COMPOUND, not relive
// it. Ships on the standard picker; the HIGH flag is an emotional-intensity note
// for the clinical pass.
export const CLIP_HM_FTB_DL_BIG_PLAY_SCRIPT: AudioScript = {
  slug: "hm-ftb-dl-big-play",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You get reached and washed down the line. The edge isn't set, and the back sees it — he hits the crease and he's gone. A five-yard gain turns into sixty, all the way to the house, and it started right where you were.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat climbs up your neck as he pulls away. Your hands hang heavy. You replay getting washed down on a loop. I gave up the whole play. That's the spiral talking. It is not a fact. Let it move through.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here is the move. That play is on the scoreboard — it is not on you, and it does not get the next series. The walk back to the huddle ends it. One snap is one snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One big run becomes a bad quarter when you press to make it all back with one huge play. Don't. Eleven guys play defense, not just you. Get back to the huddle, breathe, and reset for the next snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next snap, set the edge first. Get off the ball, get your hands inside, and force it back to your help. Do your one job — they don't need a hero, they need your gap held.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That long run is real and it is over. It is not who you are, and one play doesn't change what you're worth — you compete from a victory that's already yours, stop or touchdown. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_DL_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-ftb-dl-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The rotation pulls you and sends in the fresh body. You stand on the sideline and watch the defense get a stop without you on the field. The word is rotation — but you're starting to wonder if it's becoming demotion.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your arms cross tight. Your jaw sets watching the play without you. The thought creeps in — they don't need me out there. That's the doubt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Your worth isn't measured in snap count. The sideline is part of the game tonight, not a verdict on you. Get your breath back, stay locked into the call, and be ready when your number is up.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "When you go back in, win your first rep. Don't try to make up for the bench in one play — get off the ball, hands inside, hold your gap. One clean snap earns the next one.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Sitting a series is real and it is over. It is not your identity. A snap count doesn't name you — you're secure on the field and on the bench. Stay ready, reset, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_DL_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-ftb-dl-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "First series, and you're lined up across from a tackle a full year older. You're not sure your get-off is enough to beat him to the spot tonight. The ball's about to be snapped and the doubt is loud.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart thumps in your chest. Your hands buzz in your stance. Your breath sits high. What if my first step is a tick too slow against him. That's the nerves talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath, let it settle into your stance, and lock your eyes on the ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Your edge is your get-off — so use it. Key the ball, not the count, and fire off on first movement. Be quick and be first off the line, and you're in his pads before he's set.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The guy across from you doesn't get to name you, and neither does this first series. Quick get-off, first off the ball, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// COMPETITIVE COURAGE ONLY: staying on your feet and fighting the double-team /
// cut block. Strictly competitive — never injury, symptoms, or playing hurt.
export const CLIP_HM_FTB_DL_BIG_HIT_SCRIPT: AudioScript = {
  slug: "hm-ftb-dl-big-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "They down-block and double you — two sets of hands driving from the side. Or the guard dives at your legs to cut you down. The whole rep is staying on your feet and fighting the block, not getting buried in the pile.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your weight wants to give ground. The instinct says fold up and go down easy. I can't hold two of them. That's the doubt talking, not the truth. You can fight this and stay up.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Reset between snaps. Get your eyes back to the ball and your feet back under you. The next double-team is just another rep to fight — meet it head on.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here's the move. Get your hands inside first, drop your base, and keep your feet driving — fight the cut by staying square and playing through it. Hold your ground, stay on your feet, and clog the hole so the run has nowhere to go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That double-team is real and it is over. It is not your identity. Getting matched up two-on-one doesn't name you — you're secure whether you win the rep or lose it. Fight your hands, stay on your feet. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_DL_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-ftb-dl-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your first few snaps, your get-off is late. You're a tick behind the count all series — reacting to the ball instead of jumping it. You haven't felt the backfield once. The tackle is getting set before you even move.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your steps feel heavy and a half-beat slow. You're pressing to make up the jump. I can't find my get-off tonight. That's the frustration talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those snaps are over and there's a whole game left. A slow start is just a start, not the night. Walk back to the huddle and let this next one be a fresh snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Get your get-off back the simple way. Eyes on the ball, weight loaded, and fire on first movement — first step, not first thought. Be quick off the line and you're back in the backfield.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow start is real and it is over. It is not your identity. You don't have to rescue the series to be secure — you already are. One quick get-off, one snap, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_DL_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-ftb-dl-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The offense is going up-tempo, snapping it fast, and they're gashing you while you're down. No time to sub, no time to catch your breath. Your motor is the only thing keeping you in the play, snap after snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest heaves between snaps. Your hands find your knees. They're rolling and I've got nothing left. That's the fatigue talking, not the truth — you have another snap in you.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Shrink the game down to one snap. You don't have to stop the whole drive — you have to win this rep. Get to the line, get one breath, and lock your eyes on the ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Tempo wants you to quit on your technique — don't give it that. Get in your stance, fire off the ball, and play your one gap hard. Motor on, full effort, this snap only.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Being down early is real, and it is not the final. It is not your identity, and the scoreboard doesn't get to name you. Play this one snap with everything you've got. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_DL_TRENCH_BATTLE_SCRIPT: AudioScript = {
  slug: "hm-ftb-dl-trench-battle",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Third and long. Everyone in the stadium knows you're rushing the passer. You go one-on-one with the tackle — and he stones you. Square, anchored, no push. The quarterback steps up clean and delivers, no pressure off the edge.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your hands stall against his chest. Your rush dies on contact. The thought lands flat — I can't win when they know it's coming. That's the doubt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rush is over. The walk back to the huddle ends it. One pass-rush he won doesn't decide the next one — clear it and reset your plan.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next obvious passing down, beat him with a plan, not just effort. Set up the speed, then counter inside — get him leaning and take the edge he gives you. Win with your hands and your get-off, one move to a counter.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Losing that one-on-one is real and it is over. It is not your identity. A rep he won when he knew it was coming doesn't name you — you're secure whether you get home or not. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Linebacker (10) ──

export const CLIP_HM_FTB_LB_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-ftb-lb-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You drop into the flat and the quarterback throws it right to you. The pick is in front of you, the field wide open, a pick-six waiting. The ball hits your hands — and you drop the gift. The takeaway that flips the game, gone.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your hands sting and your shoulders drop. You stare at the grass where the ball fell. I had the whole game right there. That's the regret talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That play is over. The walk back to the huddle is your reset. A dropped pick doesn't get the next snap — let it go and get your eyes back to your keys.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The takeaway is still out there to be made. Read your keys, break on the ball, and when the next one comes near you, attack it and squeeze it away. Trust your hands and finish the play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That dropped pick is real and it is over. It is not your identity. One play you didn't finish doesn't name you — you're secure whether it sticks or it slips. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_LB_BEAT_SCRIPT: AudioScript = {
  slug: "hm-ftb-lb-beat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're matched on the slot, a faster guy than you. He runs the option route, breaks one way, and you bite. By the time you flip your hips, he's wide open in the space you were supposed to cover. Easy completion.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your legs feel a step behind. You reach late as the ball arrives. He's too quick for me out here. That's the doubt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rep is over. The walk back to the huddle ends it. One route he won doesn't decide the next one — clear it and get your eyes back to your keys.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next time in coverage, don't guess — read his stem and stay patient. Keep leverage, drive on the break instead of jumping it. Play your help and let his quickness work into your leverage.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting beat on that route is real and it is over. It is not your identity. One coverage he won doesn't name you — you're secure whether you cover it or not. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_LB_FILM_MISTAKE_SCRIPT: AudioScript = {
  slug: "hm-ftb-lb-film-mistake",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You filled the wrong gap. The back read it and bounced to the one you left open. It's the film room now, the clip frozen on you out of your fit, the long run unspooling behind your mistake.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your face goes hot in the dark room. Your stomach drops as the clip rewinds. You wish you could climb in and fill the right gap. How did I blow that fit. That's the embarrassment talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That snap is graded and it's behind you — it doesn't get to follow you onto the field. The film is for learning, not for living in. See it once, own it, and let it go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here's the fix, simple and concrete. Read your keys, trust your fit, and fill your gap with your eyes — see the back, hit the right hole, and meet him in it. Be downhill and decisive when the run shows.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That blown fit is real and it is over. It is not your identity. A bad rep on film doesn't name you — you're secure whether the grade is good or bad. Learn it, reset, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: compound blown-coverage-to-the-house cell with the loneliest-walk
// image. Authored to BREAK THE COMPOUND, not relive it. Standard picker.
export const CLIP_HM_FTB_LB_BIG_PLAY_SCRIPT: AudioScript = {
  slug: "hm-ftb-lb-big-play",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You busted the coverage and lost the back out of the backfield. He slips into the open field, the ball drops in, and there's no one between him and the end zone. You watch him run it all the way in. The walk back is the loneliest one in football.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat climbs your neck on that long walk. Your hands hang heavy. You replay losing him on a loop. I cost us the game. That's the spiral talking. It is not a fact. Let it move through.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here is the move. That touchdown is on the scoreboard — it is not on you alone, and one play does not lose a game. The walk back to the huddle ends it. One snap is one snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One blown coverage becomes a lost game only if you press to win it all back yourself. Don't. Eleven guys play defense, not just you. Get back to the huddle, breathe, and reset for the next snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next snap, lock your eyes on your keys and carry your man all the way through. Communicate the call, stay on top of the back, and do your one job. They don't need a hero, they need your coverage clean.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That blown coverage is real and it is over. It is not who you are, and one play doesn't change what you're worth — you compete from a victory that's already yours, stop or touchdown. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_LB_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-ftb-lb-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "It's a passing down and the defense goes to nickel. The coach trusts the other backer in coverage and takes you off the field. You stand next to him on the sideline, watching your snaps shrink down each obvious passing situation.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your arms cross tight. Your jaw sets watching the defense without you. The thought creeps in — they don't trust me in space. That's the doubt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Your worth isn't measured in snap count. The sideline is part of the role tonight, not a verdict on you. Get your breath, stay locked into the call, and be ready when your downs come.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "When you're back in on early downs, win your fit. Don't try to prove the whole thing in one play — read your keys, fill downhill, make the tackle. One clean snap earns more snaps.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Coming off in nickel is real and it is over. It is not your identity. A package you sit doesn't name you — you're secure on the field and on the bench. Stay ready, reset, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_LB_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-ftb-lb-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You've got the green dot — the call comes through your helmet and the whole defense is yours to line up. You're pointing guys into place, checking the formation, and the weight of running all eleven sits on you before the first snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart thumps as the play clock runs. Your eyes dart across the formation. What if I get us lined up wrong with everyone watching me. That's the nerves talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath, let it settle, and trust the prep you put in all week.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to run a perfect defense — you have to make the call and play your fit. Get the front set, communicate loud, then key the ball and trigger downhill. Make the call, then go play fast.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The green dot doesn't get to name you, and neither does this first snap. Make the call, trigger fast, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// COMPETITIVE COURAGE ONLY: filling downhill and taking on the puller in the
// hole. Strictly competitive courage — never injury, symptoms, or playing hurt.
export const CLIP_HM_FTB_LB_BIG_HIT_SCRIPT: AudioScript = {
  slug: "hm-ftb-lb-big-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Power play. The guard pulls and comes for you, looking to clear the hole. Your read is clean — you've got to fill downhill and take him on in the gap. Meet force with force. The whole rep is not flinching from the collision.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Everything in you wants to drift sideways and soften the hit. The instinct says give a little ground. Take him on, take him on. That hesitation is the lie — fill it downhill.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Reset between snaps. Get your eyes back to your keys and your feet downhill. The next puller in the hole is just another rep to win — meet it square.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here's the move. See the pull, trigger downhill, and beat him to the hole — strike with your hands, drop your pads under his, and stack the gap. Be the one delivering the blow, not catching it. Fill it and close the hole.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That collision is real and it is over. It is not your identity. Whether you stuff the puller or he clears you, it doesn't name you — you're secure either way. Trigger downhill, take him on. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_LB_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-ftb-lb-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Early in the game, you're a step slow reading your keys. You're reacting to the play instead of triggering on it — seeing it late, arriving late. The offense is moving the ball right at your indecision.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your feet feel heavy and unsure. You're thinking instead of playing. I can't read it fast enough tonight. That's the frustration talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those snaps are over and the game is long. A slow read early is just a start, not the night. Walk back to the huddle and let this next snap be fresh.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Stop guessing and get back to your keys. Read the guard, read the back, and trigger downhill the second it shows. See it, trust it, and play fast — react to the read, not the doubt.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow start is real and it is over. It is not your identity. You don't have to rescue the game to be secure — you already are. Read it, trigger fast, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_LB_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-ftb-lb-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The offense is rolling and you're trying to rally ten guys who are pressing — heads down, snapping at each other in the huddle. You're the green dot, the glue, holding the defense together while it tries to fray around you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest is tight in the huddle. You feel the weight of ten guys looking at you. It's all coming apart and I can't hold it. That's the panic talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Shrink it down to one snap. You don't have to fix the whole game in the huddle — you lead the next play. Get one breath, steady your voice, and make the call.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Be the calm in the huddle. Make the call clear and loud, get everyone's eyes, then play your own fit fast. Lead by doing your job — one good snap settles the whole defense.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Being down early is real, and it is not the final. It is not your identity, and the scoreboard doesn't get to name you. Lead the next snap. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_LB_TRENCH_BATTLE_SCRIPT: AudioScript = {
  slug: "hm-ftb-lb-trench-battle",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The pulling guard kicks you out, the tackle climbs and seals you in — you get caught in the wash between two blocks. The back runs through the exact crease your fit was supposed to close. You never got off the block to make the play.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your hands get pinned in the block. Your feet stall in the wash. They washed me right out of the play. That's the frustration talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rep is over. The walk back to the huddle ends it. One block that sealed you doesn't decide the next one — clear it and get your eyes back to your keys.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next time the blocks come, beat them with your eyes and your hands. Read the puller, take on the kick-out square, and keep your outside arm free to spill it. Don't get washed — strike, shed, and find the ball.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting sealed out of the play is real and it is over. It is not your identity. One rep the blockers won doesn't name you — you're secure whether you make the tackle or not. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Defensive Back (10) ──

export const CLIP_HM_FTB_DB_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-ftb-db-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The ball's in the air and it's yours. You've read it, you've broken on it, the interception is right there to end the drive. And it goes straight through your hands. The takeaway you'll see on film all week, dropped.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your hands sting and your head drops. You stare at the turf where it fell. I had the pick and I let it go. That's the regret talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That play is over. Short memory — the next rep comes whether you're ready or not, so let this one go. Walk back to the line and get your eyes clear.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The takeaway is still out there. Trust your read, break on the next ball, and when it's in the air, attack it and look it all the way in. Catch it like it's the easiest one you'll ever get.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That dropped pick is real and it is over. It is not your identity. One play you didn't finish doesn't name you — you're secure whether it sticks or it slips. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: the island / beat-deep cell — the cornerback's core fear, no help.
// Leans into the position's short-memory mental game. Standard picker.
export const CLIP_HM_FTB_DB_BEAT_SCRIPT: AudioScript = {
  slug: "hm-ftb-db-beat",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "One step is all it takes. The receiver gets on top of you, half a stride, and the ball's already in the air over your head. There is no help — corner is football's goalie, alone on the island, and the whole stadium is watching the ball drop in behind you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your legs burn chasing. Your stomach drops as it sails over you. Everyone just saw me get beat. That's the shame talking, not the truth. Let it pass — the island demands a short memory.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Short memory required — that's the corner's whole game. The next rep comes whether you're ready or not, so the play is over the instant the whistle blows. Walk back to the line and reset your eyes.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next snap, get back on your island and trust your technique. Patient feet at the line, eyes on his hips, stay on top and don't peek. Play your leverage and run with him — you belong out there.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Getting beat deep is real and it is over. It is not your identity. One ball over your head doesn't name you — the best corners get beat and forget it by the next snap. You're secure on the island, win or lose. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_DB_FILM_MISTAKE_SCRIPT: AudioScript = {
  slug: "hm-ftb-db-film-mistake",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You played the route wrong and passed off a man you should've carried. The film room is dark, and the clip freezes on the receiver running free through the zone you blew, the open grass where you should've been.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your face goes hot in the dark room. Your stomach sinks as the clip rewinds. You wish you could climb in and carry him. How did I blow that coverage. That's the embarrassment talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That snap is graded and it's behind you — it doesn't get to follow you onto the field. The film is for learning, not for living in. See it once, own it, and let it go.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here's the fix, simple and concrete. Know your help, communicate the call, and carry your man through your zone with your eyes on his route. Pass him off clean or run with him — no in-between.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That blown coverage is real and it is over. It is not your identity. A bad rep on film doesn't name you — you're secure whether the grade is good or bad. Learn it, reset, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ⚠ HIGH: compound give-up-the-TD cell — on defense a DB's bust is always a
// touchdown. Authored to BREAK THE COMPOUND, not relive it. Standard picker.
export const CLIP_HM_FTB_DB_BIG_PLAY_SCRIPT: AudioScript = {
  slug: "hm-ftb-db-big-play",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You got beat, the safety couldn't get over in time, and it's six the other way. On defense, a DB's bust isn't a five-yard mistake — it's always a touchdown. You watch him cross the goal line and the scoreboard flips.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat climbs your neck on the long walk back. Your hands hang heavy. You replay the step you lost on a loop. My man, my fault, every time. That's the spiral talking. It is not a fact. Let it move through.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here is the move. That touchdown is on the scoreboard — it is not on you alone, and one play does not lose a game. The walk back to the line ends it. Short memory. One snap is one snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One touchdown becomes a blowout only if you press to win it all back yourself. Don't. Eleven guys play defense, not just you. Get back to your island, breathe, and reset for the next snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next snap, trust your technique and play your leverage. Patient feet, eyes on his hips, stay on top and break on the ball. Do your one job — they don't need you to gamble, they need your coverage tight.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That touchdown is real and it is over. It is not who you are, and one play doesn't change what you're worth — you compete from a victory that's already yours, stop or touchdown. Break the spiral here. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_DB_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-ftb-db-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You got beat early and the coaches lost confidence. Now they're rolling the coverage to your side or sitting you down, and the quarterback isn't even testing you anymore. The ball goes everywhere but your way.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your arms cross on the sideline. Your jaw sets watching them throw away from you. They don't trust me out there anymore. That's the doubt talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Your worth isn't measured in targets or snap count. Losing a series of trust is tonight's problem, not a verdict on you. Get your breath, stay locked in, and be ready when they call your number.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "When you're back on your island, win the first rep clean. Don't gamble to win the trust back in one play — patient feet, tight leverage, eyes on his hips. One clean snap earns the next ball thrown your way.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Losing their trust tonight is real and it is over. It is not your identity. Who they throw at doesn't name you — you're secure tested or not. Stay ready, reset, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_DB_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-ftb-db-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're matched on their number one all night, and you know he's faster than you. You're standing on the island before the first snap, and the only thought is getting beat deep with everyone watching the ball go over your head.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your heart thumps as he lines up across from you. Your stomach is light. What if he runs right by me on the first play. That's the nerves talking, not the truth.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath, settle your feet, and lock your eyes on his hips.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't have to be faster than him — you have to play your technique. Patient feet at the line, stay on top, eyes on his hips, and trust your leverage. Run with him stride for stride and live on the island.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The nerves are real, and they are not your identity. The guy across from you doesn't get to name you, and neither does this first snap. Patient feet, eyes on his hips, and go.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// COMPETITIVE COURAGE ONLY: coming downhill in run support on the perimeter,
// not giving ground. Strictly competitive courage — never injury, symptoms, or
// playing hurt.
export const CLIP_HM_FTB_DB_BIG_HIT_SCRIPT: AudioScript = {
  slug: "hm-ftb-db-big-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The run breaks to the perimeter and you're the last line. It's you and the back in open space, and he's got a full head of steam. You've got to come downhill and take him on. The whole rep is not giving ground out there in the open field.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Everything in you wants to drift back and wait. The instinct says give ground and hope for help. Come downhill, come downhill. That hesitation is the lie — trigger and meet him.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Reset between snaps. Get your eyes back to your run-pass read and your feet under you. The next perimeter run is just another rep to win — come downhill and meet it.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Here's the move. See run, trigger downhill, and break down under control — square your hips, keep good leverage to your help, and force him back inside. Be the one closing the space, not catching it. Make the tackle and close the edge.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. That open-field play is real and it is over. It is not your identity. Whether you make the tackle or he gets by, it doesn't name you — you're secure either way. Trigger downhill, don't give ground. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_DB_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-ftb-db-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "They came right at you the first two series and completed both. Now you're playing tentative, sitting back off the line, afraid to get beat — the worst way for a corner to play. They've already got my number.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your feet are flat and hesitant at the line. You're guessing instead of trusting. They've already got my number. That's the fear talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Those two snaps are over. Short memory — the next ball comes whether you're ready or not, so let them go. Walk back to your island and reset your eyes.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Play on the balls of your feet, not on your heels. Get back in his face, patient feet, eyes on his hips, and trust your technique. Play forward, not scared — a corner has to play with confidence.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. The slow start is real and it is over. It is not your identity. Two completions early don't give them your number — you're secure whether they target you or not. Play forward, reset, and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_DB_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-ftb-db-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The offense is up and throwing on you every down. The deep shots keep coming, one after another, testing your island over and over. One more beat-deep and it's a blowout. The pressure sits on every snap.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your chest is tight before the snap. Your legs feel the weight of every deep ball coming your way. One more and it's over. That's the dread talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Shrink it down to one snap. You don't have to stop the whole comeback — you cover this one rep. Get one breath, settle your feet, and lock onto his hips.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The deep shot is coming — so be ready for it and trust your technique. Patient feet, stay on top, eyes on his hips, and don't peek at the quarterback. Cover this one route clean and live on the island.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Being down early is real, and it is not the final. It is not your identity, and the scoreboard doesn't get to name you. Cover this one snap. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FTB_DB_TRENCH_BATTLE_SCRIPT: AudioScript = {
  slug: "hm-ftb-db-trench-battle",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: FOOTBALL_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The ball's in the air and you're stride for stride. You both go up at the high point — the fifty-fifty ball you have to win. He times it, reaches over you, and comes down with it. The contested rep you had to win, and didn't.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your hands grab at air as he secures it. Your shoulders drop coming back down. I had position and he still got it. That's the frustration talking, not the truth. Let it pass.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That rep is over. Short memory — the next ball comes whether you're ready or not, so let it go. Walk back to your island and reset your eyes.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Next fifty-fifty ball, win it at the top. Find the ball with your eyes, get your hands up through his, and play the ball at its highest point. Be the receiver — high-point it and take it away.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Speak the truth. Losing that fifty-fifty is real and it is over. It is not your identity. One contested ball he won doesn't name you — you're secure whether you come down with it or not. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const FOOTBALL_PREGAME_CLIP_SCRIPTS: AudioScript[] = [
  CLIP_VIZ_QB_SCRIPT,
  CLIP_VIZ_RB_SCRIPT,
  CLIP_VIZ_WR_SCRIPT,
  CLIP_VIZ_OL_SCRIPT,
  CLIP_VIZ_DL_SCRIPT,
  CLIP_VIZ_LB_SCRIPT,
  CLIP_VIZ_DB_SCRIPT,
  CLIP_HM_FTB_DL_BEAT_SCRIPT,
  CLIP_HM_FTB_DL_FILM_MISTAKE_SCRIPT,
  CLIP_HM_FTB_DL_BIG_PLAY_SCRIPT,
  CLIP_HM_FTB_DL_BENCHED_SCRIPT,
  CLIP_HM_FTB_DL_NERVOUS_SCRIPT,
  CLIP_HM_FTB_DL_BIG_HIT_SCRIPT,
  CLIP_HM_FTB_DL_START_SLOW_SCRIPT,
  CLIP_HM_FTB_DL_FALL_BEHIND_EARLY_SCRIPT,
  CLIP_HM_FTB_DL_TRENCH_BATTLE_SCRIPT,
  CLIP_HM_FTB_LB_TURNOVER_SCRIPT,
  CLIP_HM_FTB_LB_BEAT_SCRIPT,
  CLIP_HM_FTB_LB_FILM_MISTAKE_SCRIPT,
  CLIP_HM_FTB_LB_BIG_PLAY_SCRIPT,
  CLIP_HM_FTB_LB_BENCHED_SCRIPT,
  CLIP_HM_FTB_LB_NERVOUS_SCRIPT,
  CLIP_HM_FTB_LB_BIG_HIT_SCRIPT,
  CLIP_HM_FTB_LB_START_SLOW_SCRIPT,
  CLIP_HM_FTB_LB_FALL_BEHIND_EARLY_SCRIPT,
  CLIP_HM_FTB_LB_TRENCH_BATTLE_SCRIPT,
  CLIP_HM_FTB_DB_TURNOVER_SCRIPT,
  CLIP_HM_FTB_DB_BEAT_SCRIPT,
  CLIP_HM_FTB_DB_FILM_MISTAKE_SCRIPT,
  CLIP_HM_FTB_DB_BIG_PLAY_SCRIPT,
  CLIP_HM_FTB_DB_BENCHED_SCRIPT,
  CLIP_HM_FTB_DB_NERVOUS_SCRIPT,
  CLIP_HM_FTB_DB_BIG_HIT_SCRIPT,
  CLIP_HM_FTB_DB_START_SLOW_SCRIPT,
  CLIP_HM_FTB_DB_FALL_BEHIND_EARLY_SCRIPT,
  CLIP_HM_FTB_DB_TRENCH_BATTLE_SCRIPT,
  CLIP_HM_FTB_QB_PICK_SCRIPT,
  CLIP_HM_FTB_QB_BEAT_SCRIPT,
  CLIP_HM_FTB_QB_FILM_MISTAKE_SCRIPT,
  CLIP_HM_FTB_QB_BIG_PLAY_SCRIPT,
  CLIP_HM_FTB_QB_PULLED_SCRIPT,
  CLIP_HM_FTB_QB_NERVOUS_SCRIPT,
  CLIP_HM_FTB_QB_BIG_HIT_SCRIPT,
  CLIP_HM_FTB_QB_START_SLOW_SCRIPT,
  CLIP_HM_FTB_QB_FALL_BEHIND_EARLY_SCRIPT,
  CLIP_HM_FTB_RB_FUMBLE_SCRIPT,
  CLIP_HM_FTB_RB_BEAT_SCRIPT,
  CLIP_HM_FTB_RB_FILM_MISTAKE_SCRIPT,
  CLIP_HM_FTB_RB_BIG_PLAY_SCRIPT,
  CLIP_HM_FTB_RB_BENCHED_SCRIPT,
  CLIP_HM_FTB_RB_NERVOUS_SCRIPT,
  CLIP_HM_FTB_RB_BIG_HIT_SCRIPT,
  CLIP_HM_FTB_RB_START_SLOW_SCRIPT,
  CLIP_HM_FTB_RB_FALL_BEHIND_EARLY_SCRIPT,
  CLIP_HM_FTB_RB_TRENCH_BATTLE_SCRIPT,
  CLIP_HM_FTB_WR_TURNOVER_SCRIPT,
  CLIP_HM_FTB_WR_BEAT_SCRIPT,
  CLIP_HM_FTB_WR_FILM_MISTAKE_SCRIPT,
  CLIP_HM_FTB_WR_BIG_PLAY_SCRIPT,
  CLIP_HM_FTB_WR_BENCHED_SCRIPT,
  CLIP_HM_FTB_WR_NERVOUS_SCRIPT,
  CLIP_HM_FTB_WR_BIG_HIT_SCRIPT,
  CLIP_HM_FTB_WR_START_SLOW_SCRIPT,
  CLIP_HM_FTB_WR_FALL_BEHIND_EARLY_SCRIPT,
  CLIP_HM_FTB_WR_TRENCH_BATTLE_SCRIPT,
  CLIP_HM_FTB_OL_BEAT_SCRIPT,
  CLIP_HM_FTB_OL_FILM_MISTAKE_SCRIPT,
  CLIP_HM_FTB_OL_BIG_PLAY_SCRIPT,
  CLIP_HM_FTB_OL_BENCHED_SCRIPT,
  CLIP_HM_FTB_OL_NERVOUS_SCRIPT,
  CLIP_HM_FTB_OL_BIG_HIT_SCRIPT,
  CLIP_HM_FTB_OL_START_SLOW_SCRIPT,
  CLIP_HM_FTB_OL_FALL_BEHIND_EARLY_SCRIPT,
  CLIP_HM_FTB_OL_TRENCH_BATTLE_SCRIPT,
];
