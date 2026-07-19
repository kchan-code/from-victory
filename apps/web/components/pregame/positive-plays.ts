// FV-144 — Positive-play taxonomy for the athlete-selectable picker.
//
// The 52 viz-<role>-<play> clips authored in FV-136 (audio/clips-viz.ts) are a
// per-position LIBRARY. Until FV-144 the session played one hardcoded flagship
// per position (the vizSlug baked into each manifest template). This module is
// the runtime taxonomy that lets the athlete SEE every play for their position
// (by title) and pick up to MAX_POSITIVE_PLAYS of them; resolvePlaylist() then
// plays each picked clip in sequence in place of the flagship.
//
// Titles are CANONICAL, copied verbatim from docs/pregame-scripts.md §1 (the
// same source the audio narration was generated from). Do not paraphrase — keep
// this list and that doc in lockstep. Every slug here must exist in the clip
// catalog; the playlist-integrity test asserts both directions.
//
// This is pure data + helpers — no React, no audio imports — so it is shared by
// the picker (screens-a), the Review row (screens-b), the player (useClipPlayer
// → audio-playlist), and the offline precache without coupling them.

export type PositivePlay = {
  /** The viz clip slug — `viz-<role>-<play>`. Matches clips-viz.ts + the manifest catalog. */
  slug: string;
  /** Athlete-facing role (matches PregameState.role / SportConfig.roles, e.g. "Forward"). */
  role: string;
  /** Human-readable title shown in the picker + Review. Canonical from pregame-scripts.md §1. */
  title: string;
};

// Max plays an athlete may select in one session (FV-144 — KC by-ear call,
// 2026-06-09: "up to 3, none pre-picked"). Each play ≈ POSITIVE_PLAY_EST_SEC,
// so 3 keeps the session near its ~5-min identity rather than ballooning.
export const MAX_POSITIVE_PLAYS = 3;

// Rough per-play playback length, used only for the picker's session-length
// hint. The real durations live in the manifest (read at playback time); this
// is a deliberately coarse estimate so the picker stays a pure setup screen.
export const POSITIVE_PLAY_EST_SEC = 65;

// Ordered to match clips-viz.ts / pregame-scripts.md §1 (the order the athlete
// sees in the picker). Grouped by role for readability; positivePlaysFor()
// filters by the `role` field, so group order within a role is the only thing
// that matters for display.
export const POSITIVE_PLAYS: readonly PositivePlay[] = [
  // ── QB — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-qb-rhythm-throw", role: "QB", title: "Rhythm throw, on time" },
  { slug: "viz-ftb-qb-play-action-shot", role: "QB", title: "Play-action shot down the field" },
  { slug: "viz-ftb-qb-rpo-read", role: "QB", title: "RPO read \u2014 give or throw it" },
  { slug: "viz-ftb-qb-scramble", role: "QB", title: "Pocket breaks down, keep it alive" },
  { slug: "viz-ftb-qb-take-the-checkdown", role: "QB", title: "Take the checkdown, live to the next down" },
  { slug: "viz-ftb-qb-two-minute-drive", role: "QB", title: "Two-minute drive, manage the situation" },
  { slug: "viz-ftb-qb-bounce-back-throw", role: "QB", title: "Miss one, complete the next" },

  // ── RB — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-rb-inside-zone", role: "RB", title: "Inside zone, hit it downhill" },
  { slug: "viz-ftb-rb-outside-zone", role: "RB", title: "Outside zone, read the edge" },
  { slug: "viz-ftb-rb-check-release-screen", role: "RB", title: "Screen pass, catch and go" },
  { slug: "viz-ftb-rb-blitz-pickup", role: "RB", title: "Pick up the blitz, protect the QB" },
  { slug: "viz-ftb-rb-short-yardage", role: "RB", title: "Short yardage, finish forward" },
  { slug: "viz-ftb-rb-take-what-is-there", role: "RB", title: "Take the tough yards, ball secure" },
  { slug: "viz-ftb-rb-next-carry-clean", role: "RB", title: "Stuffed once, stay patient on the next carry" },

  // ── WR — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-wr-beat-the-press", role: "WR", title: "Beat the press, win the release" },
  { slug: "viz-ftb-wr-slant-yac", role: "WR", title: "Slant, catch, and turn upfield" },
  { slug: "viz-ftb-wr-deep-ball", role: "WR", title: "Track the deep ball, look it in" },
  { slug: "viz-ftb-wr-contested-catch", role: "WR", title: "High-point the contested catch" },
  { slug: "viz-ftb-wr-stalk-block", role: "WR", title: "Stalk block, spring the run" },
  { slug: "viz-ftb-wr-third-down-move-chains", role: "WR", title: "Third down, find the sticks" },
  { slug: "viz-ftb-wr-run-the-next-one-clean", role: "WR", title: "Drop one, finish the next catch" },

  // ── OL — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-ol-pass-set-anchor", role: "OL", title: "Pass set, hands inside, anchor" },
  { slug: "viz-ftb-ol-drive-block", role: "OL", title: "Fire off, drive him off the ball" },
  { slug: "viz-ftb-ol-reach-block", role: "OL", title: "Reach block, seal the edge" },
  { slug: "viz-ftb-ol-pull-and-kick", role: "OL", title: "Pull, lead, and kick out the edge" },
  { slug: "viz-ftb-ol-pass-off-the-stunt", role: "OL", title: "Pass off the stunt, no free rusher" },
  { slug: "viz-ftb-ol-combo-climb", role: "OL", title: "Combo block, climb to the linebacker" },
  { slug: "viz-ftb-ol-win-the-next-rep", role: "OL", title: "Lose one, win the next rep" },

  // ── DL — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-dl-get-off", role: "DL", title: "Win the get-off and the rep" },
  { slug: "viz-ftb-dl-stack-shed", role: "DL", title: "Stack the block, shed, make the tackle" },
  { slug: "viz-ftb-dl-win-the-edge", role: "DL", title: "Speed rush, win the edge, get home" },
  { slug: "viz-ftb-dl-hands-up", role: "DL", title: "Can't get home \u2014 get your hands up" },
  { slug: "viz-ftb-dl-goal-line", role: "DL", title: "Goal-line stand, hold your gap" },
  { slug: "viz-ftb-dl-contain-scramble", role: "DL", title: "Keep your lane, corral the scramble" },
  { slug: "viz-ftb-dl-pursue-backside", role: "DL", title: "Reached on the run \u2014 chase it down" },

  // ── LB — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-lb-read-and-fill", role: "LB", title: "Read your keys, trigger, fill" },
  { slug: "viz-ftb-lb-take-on-lead", role: "LB", title: "Take on the lead block, force it back inside" },
  { slug: "viz-ftb-lb-zone-drop", role: "LB", title: "Drop, read the QB, break on the ball" },
  { slug: "viz-ftb-lb-cover-the-back", role: "LB", title: "Carry the back out of the backfield" },
  { slug: "viz-ftb-lb-blitz", role: "LB", title: "Time the blitz and get home" },
  { slug: "viz-ftb-lb-goal-line", role: "LB", title: "Goal-line stop, fill the hole" },
  { slug: "viz-ftb-lb-recover-play-action", role: "LB", title: "Bite the fake, recover, break on it" },

  // ── DB — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-db-press-man", role: "DB", title: "Press, mirror, play the ball" },
  { slug: "viz-ftb-db-off-break", role: "DB", title: "Read it off, break on the throw" },
  { slug: "viz-ftb-db-pick", role: "DB", title: "Read the route, jump it, take it away" },
  { slug: "viz-ftb-db-run-support", role: "DB", title: "Fill the alley, tackle in space" },
  { slug: "viz-ftb-db-set-the-edge", role: "DB", title: "Set the edge, force it back inside" },
  { slug: "viz-ftb-db-clutch-deep", role: "DB", title: "Late deep ball, stay in phase" },
  { slug: "viz-ftb-db-recover-in-phase", role: "DB", title: "Hips flipped early \u2014 recover and play the ball" },

  // ── Defense — Hockey (9) ──────────────────────────────────────────────────
  { slug: "viz-defense-retrieval", role: "Defense", title: "Clean puck retrieval" },
  { slug: "viz-defense-walk-the-line", role: "Defense", title: "Walk the blue line" },
  { slug: "viz-defense-gap-up", role: "Defense", title: "Gap up and stand him up" },
  { slug: "viz-defense-breakout", role: "Defense", title: "Calm breakout, D-to-D" },
  { slug: "viz-defense-long-shift", role: "Defense", title: "Long D-zone shift — dig deep, get it out, change" },
  { slug: "viz-defense-pinch-score", role: "Defense", title: "Step up, pinch, and finish" },
  { slug: "viz-defense-penalty-kill-clear", role: "Defense", title: "Kill a penalty shift" },
  { slug: "viz-defense-vocal-breakout", role: "Defense", title: "Communicate and quarterback the breakout" },
  { slug: "viz-defense-angle-wide-boxout", role: "Defense", title: "Defend the rush, force a bad shot, win the rebound" },

  // ── Forward — Hockey (10) ─────────────────────────────────────────────────
  { slug: "viz-forward-win-the-wall", role: "Forward", title: "Win the wall and bury it" },
  { slug: "viz-forward-give-and-go", role: "Forward", title: "Give-and-go through the seam" },
  { slug: "viz-forward-backcheck-strip", role: "Forward", title: "Backcheck and strip" },
  { slug: "viz-forward-net-front", role: "Forward", title: "Net-front tip and bury the rebound" },
  { slug: "viz-forward-faceoff-win-shot", role: "Forward", title: "Clean faceoff win to a shot" },
  { slug: "viz-forward-2on1-pass-finish", role: "Forward", title: "2-on-1 read, pass and finish" },
  { slug: "viz-forward-forecheck-strip", role: "Forward", title: "F1 forecheck, angle and strip" },
  { slug: "viz-forward-cycle-low-high", role: "Forward", title: "Offensive-zone cycle and low-to-high play" },
  { slug: "viz-forward-3on2-middle-drive", role: "Forward", title: "3-on-2 rush with a smart middle-lane drive" },
  { slug: "viz-forward-dzone-faceoff-win", role: "Forward", title: "Win a defensive-zone faceoff responsibility" },

  // ── Goalie — Hockey (9) ───────────────────────────────────────────────────
  { slug: "viz-goalie-track-and-save", role: "Goalie", title: "Track and save" },
  { slug: "viz-goalie-rebound-control", role: "Goalie", title: "Rebound control to the corner" },
  { slug: "viz-goalie-post-to-post", role: "Goalie", title: "Save your ground, post to post" },
  { slug: "viz-goalie-breakaway", role: "Goalie", title: "Read the breakaway" },
  { slug: "viz-goalie-glove-freeze", role: "Goalie", title: "Clean glove save and freeze" },
  { slug: "viz-goalie-scramble-save", role: "Goalie", title: "Scramble, desperation post save" },
  { slug: "viz-goalie-screen-traffic", role: "Goalie", title: "Track the shot through traffic" },
  { slug: "viz-goalie-play-puck-breakout", role: "Goalie", title: "Play the puck and start the breakout" },
  { slug: "viz-goalie-pk-seam-save", role: "Goalie", title: "Penalty kill lateral read through seam" },

  // ── Guard — Basketball (8) ────────────────────────────────────────────────
  { slug: "viz-guard-pick-and-roll", role: "Guard", title: "Pick-and-roll downhill" },
  { slug: "viz-guard-transition-pullup", role: "Guard", title: "Pull-up in transition" },
  { slug: "viz-guard-live-steal", role: "Guard", title: "On-ball pressure, live-ball steal" },
  { slug: "viz-guard-drive-and-kick", role: "Guard", title: "Drive and kick" },
  { slug: "viz-guard-press-break", role: "Guard", title: "Press break — calm, simple, advance" },
  { slug: "viz-guard-run-the-set", role: "Guard", title: "Settle the team and run the set" },
  { slug: "viz-guard-clutch-free-throws", role: "Guard", title: "Clutch free throws — split a tie" },
  { slug: "viz-guard-ices-it-late", role: "Guard", title: "Ice the game from the line, off the press" },

  // ── Wing — Basketball (8) ─────────────────────────────────────────────────
  { slug: "viz-wing-catch-and-shoot", role: "Wing", title: "Catch-and-shoot off the closeout" },
  { slug: "viz-wing-attack-closeout", role: "Wing", title: "Attack the closeout" },
  { slug: "viz-wing-denial-deflection", role: "Wing", title: "Wing denial, deflection, get-out" },
  { slug: "viz-wing-backdoor-cut", role: "Wing", title: "Backdoor cut and finish" },
  { slug: "viz-wing-closeout-contain", role: "Wing", title: "Closeout, contain, contest" },
  { slug: "viz-wing-relocate-catch-shoot", role: "Wing", title: "Pass, relocate, catch ready" },
  { slug: "viz-wing-clutch-free-throws", role: "Wing", title: "Clutch free throws — and-1 on the road" },
  { slug: "viz-wing-late-jumper", role: "Wing", title: "Pull-up late-game shot over the closeout" },

  // ── Big — Basketball (8) ──────────────────────────────────────────────────
  { slug: "viz-big-roll-and-finish", role: "Big", title: "Roll to the rim and finish" },
  { slug: "viz-big-post-seal-dropstep", role: "Big", title: "Deep post seal and drop step" },
  { slug: "viz-big-boxout-outlet", role: "Big", title: "Box out, rebound, outlet" },
  { slug: "viz-big-rim-protect-and-go", role: "Big", title: "Rim protection, contest, start the break" },
  { slug: "viz-big-rescreen-roll", role: "Big", title: "Set the screen, re-screen, create the advantage" },
  { slug: "viz-big-short-roll-read", role: "Big", title: "Short roll — catch, read, pass" },
  { slug: "viz-big-clutch-free-throws", role: "Big", title: "Clutch free throws — the hack didn't work" },
  { slug: "viz-big-game-sealing-block", role: "Big", title: "Late rim protection — wall up, no foul" },

  // ── Bomber — Golf (7) ─────────────────────────────────────────────────────
  { slug: "viz-bomber-stripe-the-fairway", role: "Bomber", title: "Stripe a drive down the middle" },
  { slug: "viz-bomber-walk-up-tall", role: "Bomber", title: "Bomb it past the group, walk up tall" },
  { slug: "viz-bomber-high-draw", role: "Bomber", title: "Flush a high draw around the corner" },
  { slug: "viz-bomber-long-iron-par5", role: "Bomber", title: "Reach the par 5 in two" },
  { slug: "viz-bomber-wedge-tap-in", role: "Bomber", title: "Stuff a wedge to tap-in range" },
  { slug: "viz-bomber-rip-it-first-tee", role: "Bomber", title: "Rip it on your line, first tee" },
  { slug: "viz-bomber-take-your-medicine", role: "Bomber", title: "Take your medicine, punch out, save par" },

  // ── Ball-Striker — Golf (7) ───────────────────────────────────────────────
  { slug: "viz-ballstriker-small-target", role: "Ball-Striker", title: "Pick a small target and flush it" },
  { slug: "viz-ballstriker-fat-of-the-green", role: "Ball-Striker", title: "Hit the fat of the green, hole after hole" },
  { slug: "viz-ballstriker-stick-it-pin-high", role: "Ball-Striker", title: "Stick an iron to ten feet, pin high" },
  { slug: "viz-ballstriker-knockdown", role: "Ball-Striker", title: "Pure a knockdown under the wind" },
  { slug: "viz-ballstriker-two-putt-walk", role: "Ball-Striker", title: "Two-putt from distance, walk to the next tee" },
  { slug: "viz-ballstriker-let-it-go", role: "Ball-Striker", title: "Trust the stock swing, let a loose one go" },
  { slug: "viz-ballstriker-paint-the-fairway", role: "Ball-Striker", title: "Paint the fairway off a tight tee" },

  // ── Scrambler — Golf (7) ──────────────────────────────────────────────────
  { slug: "viz-scrambler-up-and-down-short-sided", role: "Scrambler", title: "Get up and down from short-sided" },
  { slug: "viz-scrambler-roll-in-the-breaker", role: "Scrambler", title: "Roll in a breaking putt from twelve feet" },
  { slug: "viz-scrambler-hole-the-bunker-shot", role: "Scrambler", title: "Hole a bunker shot to save par" },
  { slug: "viz-scrambler-lag-it-stone-dead", role: "Scrambler", title: "Lag it stone dead from across the green" },
  { slug: "viz-scrambler-chip-in-from-rough", role: "Scrambler", title: "Chip in from the rough" },
  { slug: "viz-scrambler-grind-out-par", role: "Scrambler", title: "Grind out a par after a wild drive" },
  { slug: "viz-scrambler-four-footer", role: "Scrambler", title: "Drain the four-footer to keep the round alive" },
];

// Fast slug → title lookup (built once at module load).
const TITLE_BY_SLUG: Record<string, string> = Object.fromEntries(
  POSITIVE_PLAYS.map((p) => [p.slug, p.title]),
);

/**
 * The positive plays available to a given role, in canonical (display) order.
 * Returns [] for a null/unknown role (no-position sports never reach the picker;
 * the flow gates the step on sportConfig.roles, but [] keeps callers safe).
 */
export function positivePlaysFor(role: string | null): readonly PositivePlay[] {
  if (!role) return [];
  return POSITIVE_PLAYS.filter((p) => p.role === role);
}

/**
 * The display title for a viz slug, or the slug itself as a defensive fallback
 * (so a future/unknown slug never renders blank in Review). Used by the Review
 * row to turn stored slugs back into athlete-facing titles.
 */
export function positivePlayTitle(slug: string): string {
  return TITLE_BY_SLUG[slug] ?? slug;
}

/**
 * True only when the sport has authored positive plays for EVERY one of its
 * roles — i.e. the picker is guaranteed non-empty no matter which role the
 * athlete picks.
 *
 * The flow gates the positivePlays step on this rather than on "does the sport
 * declare roles". A sport can declare roles but ship no plays yet (golf — the
 * Bomber/Ball-Striker/Scrambler profiles exist but have zero viz plays until
 * FV-294). Showing the step then renders an empty picker the athlete can never
 * satisfy (the step is `required: (s) => s.positivePlays.length > 0`), trapping
 * them on Step 04. Gating here skips the step cleanly until plays exist, and
 * re-enables it automatically once every role has them — no flow change needed
 * when the golf plays land.
 *
 * `every` (not `some`) is deliberate: the athlete could pick any role, so the
 * step is only safe to show when no role yields an empty picker.
 */
export function sportHasPositivePlays(roles: readonly string[] | undefined): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.every((role) => positivePlaysFor(role).length > 0);
}
