// FV-294 positive-play visualization clips — Golf (21 clips + 1 self-talk).
//
// 21 discrete viz-{bomber|ballstriker|scrambler}-* AudioScript exports, one per
// scenario in docs/golf-positive-plays-DRAFT.md Part 1 (KC-approved, FINAL).
// Texts are verbatim from the finalized draft. Do NOT paraphrase.
//
// Each scenario = numbered speech lines + trailing silence per _(pause: Ns)_
// marker. No added intro/outro — the runtime playlist stitches opener → viz →
// hm → closing. Phase mark "rink" on the first segment (consistent with every
// other viz clip in clips-viz.ts; the runtime treats "rink" as "visualization
// started").
//
// All clips: voice ash, speed 1.1, SCRIPT_INSTRUCTIONS top-level,
// VISUALIZATION_INSTRUCTIONS per speech segment, GOLF_LOUDNORM_FILTER.
// These REPLACE the flagship viz-bomber / viz-ballstriker / viz-scrambler in
// resolvePlaylist() when the athlete picks plays from the picker.
//
// Also exports CLIP_ST_GLF_02_SCRIPT ("Stay steady. Play the next shot.") —
// the golf-correct self-talk replacing "Stay steady. Make the next play."
// (which is team-sport language). Wired via SELFTALK_OPTION_SLUGS in
// audio-mapping.ts and GOLF_CONFIG.selfTalkOptions in sport-registry.ts.

import type { AudioScript } from "./types";
import { SCRIPT_INSTRUCTIONS, VISUALIZATION_INSTRUCTIONS } from "./instructions.ts";

// Same target as CLIP_LOUDNORM_FILTER in clips.ts / GOLF_LOUDNORM_FILTER in
// clips-golf.ts. Defined locally to avoid a circular import.
const GOLF_VIZ_LOUDNORM_FILTER = "loudnorm=I=-16:TP=-1.5:LRA=11";

const SELFTALK_INSTRUCTIONS = `Voice Affect: Coach voice — direct, assured, the move being called. The athlete hears themselves being coached out of the collapse.

Tone: Confident without being loud. Grounded and repeatable, the way a trusted coach says the line on the bench.

Pacing: One phrase, natural pace. Deliver it the way it sounds inside the athlete's head when it's working.

Emotion: Steady confidence. Not urgent, not soft. This is the truth being called.

Pronunciation: Land the key operative words ("okay," "breathe," "steady," "secure") with weight, not emphasis. Clear and grounded.

Pauses: Brief, clean end. The phrase delivers and stops.`;

// ── BOMBER (7) ───────────────────────────────────────────────────────────────

export const CLIP_VIZ_BOMBER_STRIPE_THE_FAIRWAY_SCRIPT: AudioScript = {
  slug: "viz-bomber-stripe-the-fairway",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself on the tee, driver in hand, and know this one splits the middle.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The fairway opens wide in front of you. You tee it high.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One slow breath, and you pick your line — a target way out past the bunkers.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Into your routine. No steering, no holding back.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Free, full release. You let it go.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You catch it flush — the strike runs all the way up the shaft.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "The ball climbs, holds your line, and splits the middle.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "It runs out forever. Dead center, miles down there.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You pick up your tee and walk off easy. That's the one you came for.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_BOMBER_WALK_UP_TALL_SCRIPT: AudioScript = {
  slug: "viz-bomber-walk-up-tall",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the group's balls already out in the fairway, and know yours flies past them all.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You're up. You don't try to do too much — you just commit.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Pick your line. Slow breath. Tee it high.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Free, full swing. You turn through it and let it fly.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Flush. The ball jumps off the face and keeps climbing.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "It carries past every other ball out there.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "You don't say a word. You don't need to.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You pick up your tee and walk up the fairway, tall and easy. Longest one out here.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_BOMBER_HIGH_DRAW_SCRIPT: AudioScript = {
  slug: "viz-bomber-high-draw",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the dogleg bending left, and know you're going to turn the corner.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The hole bends left around the trees. You pick your start line, out over the corner.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You set up for the draw, a touch closed, and trust the shape.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Slow breath. Into your swing, free and full.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You release it hard, right-to-left.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The ball starts at the corner, climbs, and turns over.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "It draws around the trees and lands in the heart of the fairway.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You cut the hole in half. Just a wedge from here.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You called the shape, and the ball did exactly what you saw.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_BOMBER_LONG_IRON_PAR5_SCRIPT: AudioScript = {
  slug: "viz-bomber-long-iron-par5",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the green sitting out there in two, and know you've got the number to get home.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A big drive left you a long way back, but the green is reachable.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Long iron, maybe a hybrid. You pick the fat of the green, away from trouble.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Slow breath. Smooth and full, no lunge at it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You sweep it off the turf, flush.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The ball comes off low and hot, then climbs.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "It carries the front, lands soft, and settles on the green.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "On in two. An eagle look, two-putt birdie at worst.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You stayed patient and let the swing do it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_BOMBER_WEDGE_TAP_IN_SCRIPT: AudioScript = {
  slug: "viz-bomber-wedge-tap-in",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the flag close in front of you, and know this wedge stops next to it.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Your drive left a perfect number — full wedge, nothing in between.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You check the flag, the wind, and pick a landing spot short of the pin.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Slow breath. A controlled, committed swing.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You nip it clean, ball then turf.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "It flies on the flag, takes one hop, and checks.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "The ball drifts toward the hole and stops a foot away.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Tap-in birdie. You barely have to mark it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Bombed and dialed in. The whole hole, yours.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_BOMBER_RIP_IT_FIRST_TEE_SCRIPT: AudioScript = {
  slug: "viz-bomber-rip-it-first-tee",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself on the first tee, locked onto your line, and know it's flying straight.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "First tee of the round. You feel the buzz, and you go anyway.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You pick a target down the left side and lock onto it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Tee it high. One slow breath. Quiet hands.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Into your swing — you don't kill it, you just start it on line.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Free, full release. You rip it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "The ball comes off pure and tracks your line, dead center.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You're off and running. The hardest tee shot of the day, behind you.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You stepped up and committed. First swing of the day, flushed.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_BOMBER_TAKE_YOUR_MEDICINE_SCRIPT: AudioScript = {
  slug: "viz-bomber-take-your-medicine",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself in the trees, already planning the smart way out, and know you save par.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You walk in and look. The hero shot through the gap isn't there.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't chase it. You take your medicine.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You find the safe gap back to the fairway and commit to it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Punch out, low and clean. Back in play.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Now a wedge, a number you own. You knock it onto the green.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Two putts. You walk off with a par you stole.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One swing contained. No snowman, no spiral, just a smart par.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

// ── BALL-STRIKER (7) ─────────────────────────────────────────────────────────

export const CLIP_VIZ_BALLSTRIKER_SMALL_TARGET_SCRIPT: AudioScript = {
  slug: "viz-ballstriker-small-target",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the smallest target out there, and know the ball flies dead on that line.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You stand behind it and narrow your aim — not the fairway, one branch on a far tree.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You pick the smallest target and commit to it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Into your setup. Tempo, balance, nothing forced. Slow breath.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One smooth swing.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You flush it — pure contact, ball then ground.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "The ball flies dead on your line.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "It lands in the short grass, right where you looked.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Exactly the shot you saw. Small target, smooth swing.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_BALLSTRIKER_FAT_OF_THE_GREEN_SCRIPT: AudioScript = {
  slug: "viz-ballstriker-fat-of-the-green",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the fat of the green, and know your iron finds it again.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The pin is tucked, trouble short and right. The flag is bait, and you don't take it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You aim at the fat of the green — middle, safe, plenty of room.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Slow breath. Your same smooth swing.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You stripe the iron, flush off the turf.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "It flies on your number and lands safely on the green.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "Thirty feet, uphill, an easy two-putt.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Green in regulation. And you'll do it on the next one too.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Boring, repeatable golf. That's how the round stacks up.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_BALLSTRIKER_STICK_IT_PIN_HIGH_SCRIPT: AudioScript = {
  slug: "viz-ballstriker-stick-it-pin-high",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See a number you love, and know this iron finishes pin high.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Perfect distance. The exact club, the exact swing you've made a thousand times.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You pick your line at the flag and trust the number.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Slow breath. Tempo and balance.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "One smooth swing. You catch it flush.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The ball leaves on a tight, boring flight, straight at the stick.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "It lands pin high, takes a hop, and settles.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Ten feet, dead level. A clean look at birdie.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Pin high, the right distance. The flush strike said so.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_BALLSTRIKER_KNOCKDOWN_SCRIPT: AudioScript = {
  slug: "viz-ballstriker-knockdown",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the wind in the trees, and know you're flighting this one under it.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The wind is up, into your face. So you take it out of the air.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Ball back, hands forward, one more club. You know this shot.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Slow breath. A shorter, controlled swing — chest leads, hands quiet.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You pinch it off the turf, low and pure.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The ball comes out flat, boring under the wind.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "It bores through, lands, and chases toward the flag.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Pin high. The wind never touched it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You took one more club and swung easy. That's command.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_BALLSTRIKER_TWO_PUTT_WALK_SCRIPT: AudioScript = {
  slug: "viz-ballstriker-two-putt-walk",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the long putt ahead, calm and unhurried over the ball, and know two putts is plenty.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You striped it on, but you're forty feet away. This isn't about holing it — it's speed.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You read the slope, pick your line, and see the ball dying near the cup.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Slow breath. Soft hands, smooth stroke.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You roll it on your line with perfect pace.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The ball tracks up, slows, and trickles to a foot.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "You tap in for par. Stress-free, clean.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "No three-jack. Your number stays intact.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Striped it, lagged it, walked. A round that holds.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_BALLSTRIKER_LET_IT_GO_SCRIPT: AudioScript = {
  slug: "viz-ballstriker-let-it-go",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself settled over the next ball, the last shot already gone, and know this one's pure.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You let it go. One shot doesn't touch the rest of the round.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "No tinkering, no fixing, no chasing it. You trust your stock swing.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You step to this ball clean, a small target picked out. Slow breath.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The same smooth tempo as always.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You flush it, dead on line.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "Right back to striping it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "The next swing is the only one that matters, and you made it count.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_BALLSTRIKER_PAINT_THE_FAIRWAY_SCRIPT: AudioScript = {
  slug: "viz-ballstriker-paint-the-fairway",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the tight fairway ahead, and know you commit instead of steer.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Tight tee shot, trouble both sides. You don't steer — steering is how you miss.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You pick a small target down the middle and aim hard at it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Slow breath. Your normal, free, smooth swing.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You make a full, committed pass — no flinch, no holding off.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You flush it. The ball flies your line and never wavers.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "It paints the fairway, dead center.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Tight hole, full commit, fairway found.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You trusted the swing instead of protecting it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

// ── SCRAMBLER (7) ─────────────────────────────────────────────────────────────

export const CLIP_VIZ_SCRAMBLER_UP_AND_DOWN_SHORT_SIDED_SCRIPT: AudioScript = {
  slug: "viz-scrambler-up-and-down-short-sided",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself short-sided off the green, already seeing the shot, and know you get up and down.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Little green to work with. This is your ground.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You walk up and look. You see the shot before you hit it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You pick your landing spot, feel the speed, soft hands.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow breath. A smooth, accelerating little swing.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You slide the club under it. The ball pops up soft.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "It lands on your spot, checks, and trickles toward the hole.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "It settles two feet away. You tap in for par.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Up and down, the way you find a way.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_SCRAMBLER_ROLL_IN_THE_BREAKER_SCRIPT: AudioScript = {
  slug: "viz-scrambler-roll-in-the-breaker",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself reading the break, calm and certain over the line, and know it drops.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Twelve feet for par — right to left, downhill.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You crouch behind it and read the slope. You see the break.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You pick your spot up the hill and trust it. Soft hands.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Smooth stroke. You start it on your line with perfect pace.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The ball rolls out, holds the line, then takes the break.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "It curls down toward the hole and drops, dead center.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Par saved.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You read it, trusted it, and rolled it pure.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_SCRAMBLER_HOLE_THE_BUNKER_SHOT_SCRIPT: AudioScript = {
  slug: "viz-scrambler-hole-the-bunker-shot",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself stepping into the bunker, the shot already pictured, and know it's a save.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Greenside bunker, good lie, the flag close. You love this shot.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You dig your feet in, open the face, and pick your spot in the sand.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Slow breath. You commit and accelerate through.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You splash the sand. The ball rides out on a cushion.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "It floats up soft, lands just on the green, and releases.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "It tracks toward the flag — and drops.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Holed it. Par from the sand.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "There's always a way to par. Even from down there.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_SCRAMBLER_LAG_IT_STONE_DEAD_SCRIPT: AudioScript = {
  slug: "viz-scrambler-lag-it-stone-dead",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the long putt across the green, hands soft, all your focus on speed — and know it dies by the hole.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Fifty feet, two tiers. This is all feel. You're going to cozy it up.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You walk the line, feel the slope through your feet, see the ball dying by the cup.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Slow breath. Soft hands. Let the speed match the green.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You roll it with a smooth, free stroke.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The ball climbs the tier, crests, and feeds down the slope.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "It dies right next to the hole. Stone dead.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "A tap-in from there. No three-putt.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "That touch is yours. You felt it the whole way.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_SCRAMBLER_CHIP_IN_FROM_ROUGH_SCRIPT: AudioScript = {
  slug: "viz-scrambler-chip-in-from-rough",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself in the rough by the green, calm, finding the way — and know this one goes in.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Thick stuff, a tough lie. You don't get tight. You get creative.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You read the lie, see the ball pop out and release down the slope to the cup.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You pick your landing spot, soft hands, feel the speed.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow breath. A committed swing through the grass.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The ball comes out, carries onto the green, and starts rolling.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "It tracks down the slope, breaks toward the hole — and disappears.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Chipped in from trouble. Par, out of nowhere.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "There's always a shot. You found it.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_SCRAMBLER_GRIND_OUT_PAR_SCRIPT: AudioScript = {
  slug: "viz-scrambler-grind-out-par",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself already mapping your way to par, calm, and know you grind one out.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You're scrambling now. This is where you live — one smart shot at a time, no hero stuff.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You punch out to a number you love. Back in play.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Now a wedge — you pick your spot, soft hands, and pitch it on.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "It lands soft and settles fifteen feet below the hole.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Slow breath. You read the putt, trust your speed, and roll it pure.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "It drops in the side door. Par.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Wild drive, scrappy par. You stole one.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't need it perfect. You find a way and sign for the number.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

export const CLIP_VIZ_SCRAMBLER_FOUR_FOOTER_SCRIPT: AudioScript = {
  slug: "viz-scrambler-four-footer",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself over the short putt, settled, certain it's going in — and know it does.", instructions: VISUALIZATION_INSTRUCTIONS, mark: { phase: "rink" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Four feet for par. The kind you make.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "You don't rush it and you don't freeze. You go through your routine.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You read the little break, pick the edge, and see it falling.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Slow breath. Quiet hands, eyes still.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You make a smooth, confident stroke.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
    { type: "speech", text: "The ball rolls true, catches the edge you picked.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "And it drops. Center cut, bottom of the cup.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Par holds. The round stays alive.", instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 3 },
  ],
};

// ── Golf self-talk #2 — "Stay steady. Play the next shot." (FV-294) ───────────
//
// Golf-correct replacement for "Stay steady. Make the next play." (st-03),
// which carries team-sport framing ("next play" = team-sport language).
// Wired into GOLF_CONFIG.selfTalkOptions + SELFTALK_OPTION_SLUGS["Stay steady. Play the next shot."].

export const CLIP_ST_GLF_02_SCRIPT: AudioScript = {
  slug: "st-glf-02",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 1.1,
  postFilter: GOLF_VIZ_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Stay steady. Play the next shot." },
  ],
};

// ── Exports ──────────────────────────────────────────────────────────────────

export const GOLF_VIZ_CLIP_SCRIPTS: readonly AudioScript[] = [
  // Bomber (7)
  CLIP_VIZ_BOMBER_STRIPE_THE_FAIRWAY_SCRIPT,
  CLIP_VIZ_BOMBER_WALK_UP_TALL_SCRIPT,
  CLIP_VIZ_BOMBER_HIGH_DRAW_SCRIPT,
  CLIP_VIZ_BOMBER_LONG_IRON_PAR5_SCRIPT,
  CLIP_VIZ_BOMBER_WEDGE_TAP_IN_SCRIPT,
  CLIP_VIZ_BOMBER_RIP_IT_FIRST_TEE_SCRIPT,
  CLIP_VIZ_BOMBER_TAKE_YOUR_MEDICINE_SCRIPT,
  // Ball-Striker (7)
  CLIP_VIZ_BALLSTRIKER_SMALL_TARGET_SCRIPT,
  CLIP_VIZ_BALLSTRIKER_FAT_OF_THE_GREEN_SCRIPT,
  CLIP_VIZ_BALLSTRIKER_STICK_IT_PIN_HIGH_SCRIPT,
  CLIP_VIZ_BALLSTRIKER_KNOCKDOWN_SCRIPT,
  CLIP_VIZ_BALLSTRIKER_TWO_PUTT_WALK_SCRIPT,
  CLIP_VIZ_BALLSTRIKER_LET_IT_GO_SCRIPT,
  CLIP_VIZ_BALLSTRIKER_PAINT_THE_FAIRWAY_SCRIPT,
  // Scrambler (7)
  CLIP_VIZ_SCRAMBLER_UP_AND_DOWN_SHORT_SIDED_SCRIPT,
  CLIP_VIZ_SCRAMBLER_ROLL_IN_THE_BREAKER_SCRIPT,
  CLIP_VIZ_SCRAMBLER_HOLE_THE_BUNKER_SHOT_SCRIPT,
  CLIP_VIZ_SCRAMBLER_LAG_IT_STONE_DEAD_SCRIPT,
  CLIP_VIZ_SCRAMBLER_CHIP_IN_FROM_ROUGH_SCRIPT,
  CLIP_VIZ_SCRAMBLER_GRIND_OUT_PAR_SCRIPT,
  CLIP_VIZ_SCRAMBLER_FOUR_FOOTER_SCRIPT,
  // Golf self-talk #2
  CLIP_ST_GLF_02_SCRIPT,
];
