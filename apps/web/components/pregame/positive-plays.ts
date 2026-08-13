// FV-144 — Positive-play taxonomy for the athlete-selectable picker.
//
// The viz-<role>-<play> clips authored per sport (audio/clips-viz*.ts) are a
// per-position LIBRARY. Until FV-144 the session played one hardcoded flagship
// per position (the vizSlug baked into each manifest template). This module is
// the runtime taxonomy that lets the athlete SEE every play for their position
// (by title) and pick up to MAX_POSITIVE_PLAYS of them; resolvePlaylist() then
// plays each picked clip in sequence in place of the flagship.
//
// Titles are CANONICAL. Hockey/basketball/baseball/golf/football titles are
// copied verbatim from docs/pregame-scripts.md §1 (the source the audio
// narration was generated from); lacrosse titles are copied verbatim from the
// `### ... VIZ — <title>` headers in docs/scripts/lacrosse.md (its script
// book — lacrosse has no entry in pregame-scripts.md §1). Do not paraphrase —
// keep this list and its source doc in lockstep. Every slug here must exist
// in the clip catalog for sports that have rendered (the playlist-integrity
// test asserts both directions, gated by manifest.practiceState for dormant
// sports — see SPORT_SLUG_TOKENS / RENDERED_SPORT_CONFIGS there).
//
// FV-406 — added the `sport` field. Role names collide across sports (hockey
// "Defense"/"Goalie" vs. lacrosse "Defense"/"Goalie", etc.), so `role` alone
// could not disambiguate positivePlaysFor(); every entry now carries its
// sport and both `positivePlaysFor` / `sportHasPositivePlays` filter on
// (sport, role) together. `slug` stays globally unique across sports, so
// `TITLE_BY_SLUG` / `positivePlayTitle` are unaffected.
//
// This is pure data + helpers — no React, no audio imports — so it is shared by
// the picker (screens-a), the Review row (screens-b), the player (useClipPlayer
// → audio-playlist), and the offline precache without coupling them.

import type { Sport } from "./sport-registry";

export type PositivePlay = {
  /** The viz clip slug — `viz-<role>-<play>`. Matches the per-sport clips-viz*.ts + the manifest catalog. */
  slug: string;
  /** The sport this play belongs to (FV-406 — disambiguates role names that collide across sports). */
  sport: Sport;
  /** Athlete-facing role (matches PregameState.role / SportConfig.roles, e.g. "Forward"). */
  role: string;
  /** Human-readable title shown in the picker + Review. Canonical from the sport's script book. */
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

// Ordered to match each sport's clip catalog / script book (the order the
// athlete sees in the picker). Grouped by sport, then role, for readability;
// positivePlaysFor() filters by the (sport, role) pair, so group order within
// a role is the only thing that matters for display.
export const POSITIVE_PLAYS: readonly PositivePlay[] = [
  // ── QB — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-qb-rhythm-throw", sport: "football", role: "QB", title: "Rhythm throw, on time" },
  { slug: "viz-ftb-qb-play-action-shot", sport: "football", role: "QB", title: "Play-action shot down the field" },
  { slug: "viz-ftb-qb-rpo-read", sport: "football", role: "QB", title: "RPO read \u2014 give or throw it" },
  { slug: "viz-ftb-qb-scramble", sport: "football", role: "QB", title: "Pocket breaks down, keep it alive" },
  { slug: "viz-ftb-qb-take-the-checkdown", sport: "football", role: "QB", title: "Take the checkdown, live to the next down" },
  { slug: "viz-ftb-qb-two-minute-drive", sport: "football", role: "QB", title: "Two-minute drive, manage the situation" },
  { slug: "viz-ftb-qb-bounce-back-throw", sport: "football", role: "QB", title: "Miss one, complete the next" },

  // ── RB — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-rb-inside-zone", sport: "football", role: "RB", title: "Inside zone, hit it downhill" },
  { slug: "viz-ftb-rb-outside-zone", sport: "football", role: "RB", title: "Outside zone, read the edge" },
  { slug: "viz-ftb-rb-check-release-screen", sport: "football", role: "RB", title: "Screen pass, catch and go" },
  { slug: "viz-ftb-rb-blitz-pickup", sport: "football", role: "RB", title: "Pick up the blitz, protect the QB" },
  { slug: "viz-ftb-rb-short-yardage", sport: "football", role: "RB", title: "Short yardage, finish forward" },
  { slug: "viz-ftb-rb-take-what-is-there", sport: "football", role: "RB", title: "Take the tough yards, ball secure" },
  { slug: "viz-ftb-rb-next-carry-clean", sport: "football", role: "RB", title: "Stuffed once, stay patient on the next carry" },

  // ── WR — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-wr-beat-the-press", sport: "football", role: "WR", title: "Beat the press, win the release" },
  { slug: "viz-ftb-wr-slant-yac", sport: "football", role: "WR", title: "Slant, catch, and turn upfield" },
  { slug: "viz-ftb-wr-deep-ball", sport: "football", role: "WR", title: "Track the deep ball, look it in" },
  { slug: "viz-ftb-wr-contested-catch", sport: "football", role: "WR", title: "High-point the contested catch" },
  { slug: "viz-ftb-wr-stalk-block", sport: "football", role: "WR", title: "Stalk block, spring the run" },
  { slug: "viz-ftb-wr-third-down-move-chains", sport: "football", role: "WR", title: "Third down, find the sticks" },
  { slug: "viz-ftb-wr-run-the-next-one-clean", sport: "football", role: "WR", title: "Drop one, finish the next catch" },

  // ── OL — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-ol-pass-set-anchor", sport: "football", role: "OL", title: "Pass set, hands inside, anchor" },
  { slug: "viz-ftb-ol-drive-block", sport: "football", role: "OL", title: "Fire off, drive him off the ball" },
  { slug: "viz-ftb-ol-reach-block", sport: "football", role: "OL", title: "Reach block, seal the edge" },
  { slug: "viz-ftb-ol-pull-and-kick", sport: "football", role: "OL", title: "Pull, lead, and kick out the edge" },
  { slug: "viz-ftb-ol-pass-off-the-stunt", sport: "football", role: "OL", title: "Pass off the stunt, no free rusher" },
  { slug: "viz-ftb-ol-combo-climb", sport: "football", role: "OL", title: "Combo block, climb to the linebacker" },
  { slug: "viz-ftb-ol-win-the-next-rep", sport: "football", role: "OL", title: "Lose one, win the next rep" },

  // ── DL — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-dl-get-off", sport: "football", role: "DL", title: "Win the get-off and the rep" },
  { slug: "viz-ftb-dl-stack-shed", sport: "football", role: "DL", title: "Stack the block, shed, make the tackle" },
  { slug: "viz-ftb-dl-win-the-edge", sport: "football", role: "DL", title: "Speed rush, win the edge, get home" },
  { slug: "viz-ftb-dl-hands-up", sport: "football", role: "DL", title: "Can't get home \u2014 get your hands up" },
  { slug: "viz-ftb-dl-goal-line", sport: "football", role: "DL", title: "Goal-line stand, hold your gap" },
  { slug: "viz-ftb-dl-contain-scramble", sport: "football", role: "DL", title: "Keep your lane, corral the scramble" },
  { slug: "viz-ftb-dl-pursue-backside", sport: "football", role: "DL", title: "Reached on the run \u2014 chase it down" },

  // ── LB — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-lb-read-and-fill", sport: "football", role: "LB", title: "Read your keys, trigger, fill" },
  { slug: "viz-ftb-lb-take-on-lead", sport: "football", role: "LB", title: "Take on the lead block, force it back inside" },
  { slug: "viz-ftb-lb-zone-drop", sport: "football", role: "LB", title: "Drop, read the QB, break on the ball" },
  { slug: "viz-ftb-lb-cover-the-back", sport: "football", role: "LB", title: "Carry the back out of the backfield" },
  { slug: "viz-ftb-lb-blitz", sport: "football", role: "LB", title: "Time the blitz and get home" },
  { slug: "viz-ftb-lb-goal-line", sport: "football", role: "LB", title: "Goal-line stop, fill the hole" },
  { slug: "viz-ftb-lb-recover-play-action", sport: "football", role: "LB", title: "Bite the fake, recover, break on it" },

  // ── DB — Football (7) — FV-423. DORMANT: football roles enter the
  // registry with FV-206; until then these entries are unreachable.
  { slug: "viz-ftb-db-press-man", sport: "football", role: "DB", title: "Press, mirror, play the ball" },
  { slug: "viz-ftb-db-off-break", sport: "football", role: "DB", title: "Read it off, break on the throw" },
  { slug: "viz-ftb-db-pick", sport: "football", role: "DB", title: "Read the route, jump it, take it away" },
  { slug: "viz-ftb-db-run-support", sport: "football", role: "DB", title: "Fill the alley, tackle in space" },
  { slug: "viz-ftb-db-set-the-edge", sport: "football", role: "DB", title: "Set the edge, force it back inside" },
  { slug: "viz-ftb-db-clutch-deep", sport: "football", role: "DB", title: "Late deep ball, stay in phase" },
  { slug: "viz-ftb-db-recover-in-phase", sport: "football", role: "DB", title: "Hips flipped early \u2014 recover and play the ball" },

  // ── Pitcher — Baseball (7) — FV-424. DORMANT: baseball is not in
  // SUPPORTED_SPORTS; these entries become reachable at the FV-100 go-live.
  { slug: "viz-bsb-pitcher-attack-first-inning", sport: "baseball", role: "Pitcher", title: "First inning, establish the zone" },
  { slug: "viz-bsb-pitcher-strikeout-sequence", sport: "baseball", role: "Pitcher", title: "Change speed and location" },
  { slug: "viz-bsb-pitcher-escape-the-jam", sport: "baseball", role: "Pitcher", title: "Get the ground-ball double play" },
  { slug: "viz-bsb-pitcher-hold-and-field", sport: "baseball", role: "Pitcher", title: "Hold the runner, field the comebacker" },
  { slug: "viz-bsb-pitcher-putaway-pitch", sport: "baseball", role: "Pitcher", title: "Finish an 0-2 count" },
  { slug: "viz-bsb-pitcher-deep-outing-rhythm", sport: "baseball", role: "Pitcher", title: "Sixth inning, repeat your delivery" },
  { slug: "viz-bsb-pitcher-bounce-back", sport: "baseball", role: "Pitcher", title: "Home run, reset for the next hitter" },

  // ── Catcher — Baseball (7) — FV-424. DORMANT: baseball is not in
  // SUPPORTED_SPORTS; these entries become reachable at the FV-100 go-live.
  { slug: "viz-bsb-catcher-frame-the-zone", sport: "baseball", role: "Catcher", title: "Receive the low corner cleanly" },
  { slug: "viz-bsb-catcher-block-in-the-dirt", sport: "baseball", role: "Catcher", title: "Block the pitch, keep the runner at third" },
  { slug: "viz-bsb-catcher-throw-out-the-runner", sport: "baseball", role: "Catcher", title: "Quick transfer, throw to second" },
  { slug: "viz-bsb-catcher-call-the-game", sport: "baseball", role: "Catcher", title: "Call the sequence, one pitch at a time" },
  { slug: "viz-bsb-catcher-play-at-the-plate", sport: "baseball", role: "Catcher", title: "Receive the throw and apply the tag" },
  { slug: "viz-bsb-catcher-clutch-at-bat", sport: "baseball", role: "Catcher", title: "Runner in scoring position, drive him in" },
  { slug: "viz-bsb-catcher-bounce-back", sport: "baseball", role: "Catcher", title: "Passed ball, reset for the next pitch" },

  // ── Infield — Baseball (7) — FV-424. DORMANT: baseball is not in
  // SUPPORTED_SPORTS; these entries become reachable at the FV-100 go-live.
  { slug: "viz-bsb-infield-turn-two", sport: "baseball", role: "Infield", title: "Field it clean and turn two" },
  { slug: "viz-bsb-infield-backhand-hole", sport: "baseball", role: "Infield", title: "Backhand deep in the hole" },
  { slug: "viz-bsb-infield-diving-stop", sport: "baseball", role: "Infield", title: "Diving stop, recover and throw" },
  { slug: "viz-bsb-infield-drive-in-run", sport: "baseball", role: "Infield", title: "Runner on third, use the middle" },
  { slug: "viz-bsb-infield-work-count-single", sport: "baseball", role: "Infield", title: "Stay disciplined through a full count" },
  { slug: "viz-bsb-infield-two-strike-battle", sport: "baseball", role: "Infield", title: "Two strikes, shorten the swing" },
  { slug: "viz-bsb-infield-next-ball-clean", sport: "baseball", role: "Infield", title: "Error, reset for the next ground ball" },

  // ── Outfield — Baseball (7) — FV-424. DORMANT: baseball is not in
  // SUPPORTED_SPORTS; these entries become reachable at the FV-100 go-live.
  { slug: "viz-bsb-outfield-run-down-gap", sport: "baseball", role: "Outfield", title: "Take the angle to the gap" },
  { slug: "viz-bsb-outfield-throw-out-runner", sport: "baseball", role: "Outfield", title: "Field the single, throw to third" },
  { slug: "viz-bsb-outfield-diving-catch", sport: "baseball", role: "Outfield", title: "Sinking liner, decide early" },
  { slug: "viz-bsb-outfield-play-the-wall", sport: "baseball", role: "Outfield", title: "Read the wall and hit the relay" },
  { slug: "viz-bsb-outfield-drive-the-gap", sport: "baseball", role: "Outfield", title: "Drive the fastball into the gap" },
  { slug: "viz-bsb-outfield-two-strike-single", sport: "baseball", role: "Outfield", title: "Two strikes, shorten and stay in the zone" },
  { slug: "viz-bsb-outfield-next-at-bat-clean", sport: "baseball", role: "Outfield", title: "Called strike three, adjust next time up" },

  // ── Defense — Hockey (9) ──────────────────────────────────────────────────
  { slug: "viz-defense-retrieval", sport: "hockey", role: "Defense", title: "Clean puck retrieval" },
  { slug: "viz-defense-walk-the-line", sport: "hockey", role: "Defense", title: "Walk the blue line" },
  { slug: "viz-defense-gap-up", sport: "hockey", role: "Defense", title: "Gap up and stand him up" },
  { slug: "viz-defense-breakout", sport: "hockey", role: "Defense", title: "Calm breakout, D-to-D" },
  { slug: "viz-defense-long-shift", sport: "hockey", role: "Defense", title: "Long D-zone shift — dig deep, get it out, change" },
  { slug: "viz-defense-pinch-score", sport: "hockey", role: "Defense", title: "Step up, pinch, and finish" },
  { slug: "viz-defense-penalty-kill-clear", sport: "hockey", role: "Defense", title: "Kill a penalty shift" },
  { slug: "viz-defense-vocal-breakout", sport: "hockey", role: "Defense", title: "Communicate and quarterback the breakout" },
  { slug: "viz-defense-angle-wide-boxout", sport: "hockey", role: "Defense", title: "Defend the rush, force a bad shot, win the rebound" },

  // ── Forward — Hockey (10) ─────────────────────────────────────────────────
  { slug: "viz-forward-win-the-wall", sport: "hockey", role: "Forward", title: "Win the wall and bury it" },
  { slug: "viz-forward-give-and-go", sport: "hockey", role: "Forward", title: "Give-and-go through the seam" },
  { slug: "viz-forward-backcheck-strip", sport: "hockey", role: "Forward", title: "Backcheck and strip" },
  { slug: "viz-forward-net-front", sport: "hockey", role: "Forward", title: "Net-front tip and bury the rebound" },
  { slug: "viz-forward-faceoff-win-shot", sport: "hockey", role: "Forward", title: "Clean faceoff win to a shot" },
  { slug: "viz-forward-2on1-pass-finish", sport: "hockey", role: "Forward", title: "2-on-1 read, pass and finish" },
  { slug: "viz-forward-forecheck-strip", sport: "hockey", role: "Forward", title: "F1 forecheck, angle and strip" },
  { slug: "viz-forward-cycle-low-high", sport: "hockey", role: "Forward", title: "Offensive-zone cycle and low-to-high play" },
  { slug: "viz-forward-3on2-middle-drive", sport: "hockey", role: "Forward", title: "3-on-2 rush with a smart middle-lane drive" },
  { slug: "viz-forward-dzone-faceoff-win", sport: "hockey", role: "Forward", title: "Win a defensive-zone faceoff responsibility" },

  // ── Goalie — Hockey (9) ───────────────────────────────────────────────────
  { slug: "viz-goalie-track-and-save", sport: "hockey", role: "Goalie", title: "Track and save" },
  { slug: "viz-goalie-rebound-control", sport: "hockey", role: "Goalie", title: "Rebound control to the corner" },
  { slug: "viz-goalie-post-to-post", sport: "hockey", role: "Goalie", title: "Save your ground, post to post" },
  { slug: "viz-goalie-breakaway", sport: "hockey", role: "Goalie", title: "Read the breakaway" },
  { slug: "viz-goalie-glove-freeze", sport: "hockey", role: "Goalie", title: "Clean glove save and freeze" },
  { slug: "viz-goalie-scramble-save", sport: "hockey", role: "Goalie", title: "Scramble, desperation post save" },
  { slug: "viz-goalie-screen-traffic", sport: "hockey", role: "Goalie", title: "Track the shot through traffic" },
  { slug: "viz-goalie-play-puck-breakout", sport: "hockey", role: "Goalie", title: "Play the puck and start the breakout" },
  { slug: "viz-goalie-pk-seam-save", sport: "hockey", role: "Goalie", title: "Penalty kill lateral read through seam" },

  // ── Guard — Basketball (8) ────────────────────────────────────────────────
  { slug: "viz-guard-pick-and-roll", sport: "basketball", role: "Guard", title: "Pick-and-roll downhill" },
  { slug: "viz-guard-transition-pullup", sport: "basketball", role: "Guard", title: "Pull-up in transition" },
  { slug: "viz-guard-live-steal", sport: "basketball", role: "Guard", title: "On-ball pressure, live-ball steal" },
  { slug: "viz-guard-drive-and-kick", sport: "basketball", role: "Guard", title: "Drive and kick" },
  { slug: "viz-guard-press-break", sport: "basketball", role: "Guard", title: "Press break — calm, simple, advance" },
  { slug: "viz-guard-run-the-set", sport: "basketball", role: "Guard", title: "Settle the team and run the set" },
  { slug: "viz-guard-clutch-free-throws", sport: "basketball", role: "Guard", title: "Clutch free throws — split a tie" },
  { slug: "viz-guard-ices-it-late", sport: "basketball", role: "Guard", title: "Ice the game from the line, off the press" },

  // ── Wing — Basketball (8) ─────────────────────────────────────────────────
  { slug: "viz-wing-catch-and-shoot", sport: "basketball", role: "Wing", title: "Catch-and-shoot off the closeout" },
  { slug: "viz-wing-attack-closeout", sport: "basketball", role: "Wing", title: "Attack the closeout" },
  { slug: "viz-wing-denial-deflection", sport: "basketball", role: "Wing", title: "Wing denial, deflection, get-out" },
  { slug: "viz-wing-backdoor-cut", sport: "basketball", role: "Wing", title: "Backdoor cut and finish" },
  { slug: "viz-wing-closeout-contain", sport: "basketball", role: "Wing", title: "Closeout, contain, contest" },
  { slug: "viz-wing-relocate-catch-shoot", sport: "basketball", role: "Wing", title: "Pass, relocate, catch ready" },
  { slug: "viz-wing-clutch-free-throws", sport: "basketball", role: "Wing", title: "Clutch free throws — and-1 on the road" },
  { slug: "viz-wing-late-jumper", sport: "basketball", role: "Wing", title: "Pull-up late-game shot over the closeout" },

  // ── Big — Basketball (8) ──────────────────────────────────────────────────
  { slug: "viz-big-roll-and-finish", sport: "basketball", role: "Big", title: "Roll to the rim and finish" },
  { slug: "viz-big-post-seal-dropstep", sport: "basketball", role: "Big", title: "Deep post seal and drop step" },
  { slug: "viz-big-boxout-outlet", sport: "basketball", role: "Big", title: "Box out, rebound, outlet" },
  { slug: "viz-big-rim-protect-and-go", sport: "basketball", role: "Big", title: "Rim protection, contest, start the break" },
  { slug: "viz-big-rescreen-roll", sport: "basketball", role: "Big", title: "Set the screen, re-screen, create the advantage" },
  { slug: "viz-big-short-roll-read", sport: "basketball", role: "Big", title: "Short roll — catch, read, pass" },
  { slug: "viz-big-clutch-free-throws", sport: "basketball", role: "Big", title: "Clutch free throws — the hack didn't work" },
  { slug: "viz-big-game-sealing-block", sport: "basketball", role: "Big", title: "Late rim protection — wall up, no foul" },

  // ── Bomber — Golf (7) ─────────────────────────────────────────────────────
  { slug: "viz-bomber-stripe-the-fairway", sport: "golf", role: "Bomber", title: "Stripe a drive down the middle" },
  { slug: "viz-bomber-walk-up-tall", sport: "golf", role: "Bomber", title: "Bomb it past the group, walk up tall" },
  { slug: "viz-bomber-high-draw", sport: "golf", role: "Bomber", title: "Flush a high draw around the corner" },
  { slug: "viz-bomber-long-iron-par5", sport: "golf", role: "Bomber", title: "Reach the par 5 in two" },
  { slug: "viz-bomber-wedge-tap-in", sport: "golf", role: "Bomber", title: "Stuff a wedge to tap-in range" },
  { slug: "viz-bomber-rip-it-first-tee", sport: "golf", role: "Bomber", title: "Rip it on your line, first tee" },
  { slug: "viz-bomber-take-your-medicine", sport: "golf", role: "Bomber", title: "Take your medicine, punch out, save par" },

  // ── Ball-Striker — Golf (7) ───────────────────────────────────────────────
  { slug: "viz-ballstriker-small-target", sport: "golf", role: "Ball-Striker", title: "Pick a small target and flush it" },
  { slug: "viz-ballstriker-fat-of-the-green", sport: "golf", role: "Ball-Striker", title: "Hit the fat of the green, hole after hole" },
  { slug: "viz-ballstriker-stick-it-pin-high", sport: "golf", role: "Ball-Striker", title: "Stick an iron to ten feet, pin high" },
  { slug: "viz-ballstriker-knockdown", sport: "golf", role: "Ball-Striker", title: "Pure a knockdown under the wind" },
  { slug: "viz-ballstriker-two-putt-walk", sport: "golf", role: "Ball-Striker", title: "Two-putt from distance, walk to the next tee" },
  { slug: "viz-ballstriker-let-it-go", sport: "golf", role: "Ball-Striker", title: "Trust the stock swing, let a loose one go" },
  { slug: "viz-ballstriker-paint-the-fairway", sport: "golf", role: "Ball-Striker", title: "Paint the fairway off a tight tee" },

  // ── Scrambler — Golf (7) ──────────────────────────────────────────────────
  { slug: "viz-scrambler-up-and-down-short-sided", sport: "golf", role: "Scrambler", title: "Get up and down from short-sided" },
  { slug: "viz-scrambler-roll-in-the-breaker", sport: "golf", role: "Scrambler", title: "Roll in a breaking putt from twelve feet" },
  { slug: "viz-scrambler-hole-the-bunker-shot", sport: "golf", role: "Scrambler", title: "Hole a bunker shot to save par" },
  { slug: "viz-scrambler-lag-it-stone-dead", sport: "golf", role: "Scrambler", title: "Lag it stone dead from across the green" },
  { slug: "viz-scrambler-chip-in-from-rough", sport: "golf", role: "Scrambler", title: "Chip in from the rough" },
  { slug: "viz-scrambler-grind-out-par", sport: "golf", role: "Scrambler", title: "Grind out a par after a wild drive" },
  { slug: "viz-scrambler-four-footer", sport: "golf", role: "Scrambler", title: "Drain the four-footer to keep the round alive" },

  // ── Attack — Lacrosse (7) — FV-406, live per FV-407
  // (KC 2026-08-11 go-live).
  { slug: "viz-lax-attack-beat-your-man", sport: "lacrosse", role: "Attack", title: "Beat your man" },
  { slug: "viz-lax-attack-see-the-field", sport: "lacrosse", role: "Attack", title: "See the field" },
  { slug: "viz-lax-attack-finish-on-crease", sport: "lacrosse", role: "Attack", title: "Finish on the crease" },
  { slug: "viz-lax-attack-time-and-room", sport: "lacrosse", role: "Attack", title: "Time and room, step in and rip" },
  { slug: "viz-lax-attack-ride-force-turnover", sport: "lacrosse", role: "Attack", title: "Ride hard, force the turnover" },
  { slug: "viz-lax-attack-man-up-finish", sport: "lacrosse", role: "Attack", title: "Bury the man-up look" },
  { slug: "viz-lax-attack-next-look-clean", sport: "lacrosse", role: "Attack", title: "Miss the doorstep, bury the next" },

  // ── Midfield — Lacrosse (7) — FV-406, live per FV-407
  // (KC 2026-08-11 go-live).
  { slug: "viz-lax-midfield-push-the-ball", sport: "lacrosse", role: "Midfield", title: "Push the ball" },
  { slug: "viz-lax-midfield-cover-both-ends", sport: "lacrosse", role: "Midfield", title: "Cover both ends" },
  { slug: "viz-lax-midfield-shoot-on-the-run", sport: "lacrosse", role: "Midfield", title: "Shoot it on the run" },
  { slug: "viz-lax-midfield-both-ends-shift", sport: "lacrosse", role: "Midfield", title: "Both ends in one shift" },
  { slug: "viz-lax-midfield-ground-ball-scrum", sport: "lacrosse", role: "Midfield", title: "Win the ground-ball scrum" },
  { slug: "viz-lax-midfield-slide-and-rotate", sport: "lacrosse", role: "Midfield", title: "Slide early, rotate, get the stop" },
  { slug: "viz-lax-midfield-next-clear-clean", sport: "lacrosse", role: "Midfield", title: "Cough one up, clear the next clean" },

  // ── Defense — Lacrosse (7) — FV-406, live per FV-407
  // (KC 2026-08-11 go-live).
  { slug: "viz-lax-defense-lock-him-down", sport: "lacrosse", role: "Defense", title: "Lock him down" },
  { slug: "viz-lax-defense-take-it-the-other-way", sport: "lacrosse", role: "Defense", title: "Take it the other way" },
  { slug: "viz-lax-defense-shutdown-1v1-x", sport: "lacrosse", role: "Defense", title: "Shut down the 1v1 at X" },
  { slug: "viz-lax-defense-slide-recover", sport: "lacrosse", role: "Defense", title: "Slide, recover, deny the feed" },
  { slug: "viz-lax-defense-ground-ball-clear", sport: "lacrosse", role: "Defense", title: "Win the gritty ground ball, clear it" },
  { slug: "viz-lax-defense-man-down-hold", sport: "lacrosse", role: "Defense", title: "Man-down, hold the middle" },
  { slug: "viz-lax-defense-win-next-matchup", sport: "lacrosse", role: "Defense", title: "Beaten once, win the next matchup" },

  // ── FOGO — Lacrosse (7) — FV-406, live per FV-407
  // (KC 2026-08-11 go-live).
  { slug: "viz-lax-fogo-win-the-clamp", sport: "lacrosse", role: "FOGO", title: "Win the clamp" },
  { slug: "viz-lax-fogo-win-the-wing", sport: "lacrosse", role: "FOGO", title: "Win the wing" },
  { slug: "viz-lax-fogo-counter-the-clamp", sport: "lacrosse", role: "FOGO", title: "Counter and win the pull" },
  { slug: "viz-lax-fogo-win-and-go", sport: "lacrosse", role: "FOGO", title: "Win it forward, push the break" },
  { slug: "viz-lax-fogo-close-it-out", sport: "lacrosse", role: "FOGO", title: "Close it out at the dot" },
  { slug: "viz-lax-fogo-read-and-adjust", sport: "lacrosse", role: "FOGO", title: "Read the counter and adjust" },
  { slug: "viz-lax-fogo-win-the-next-one", sport: "lacrosse", role: "FOGO", title: "Win the next one clean" },

  // ── Goalie — Lacrosse (7) — FV-406, live per FV-407
  // (KC 2026-08-11 go-live).
  { slug: "viz-lax-goalie-make-the-save", sport: "lacrosse", role: "Goalie", title: "Make the save" },
  { slug: "viz-lax-goalie-start-the-clear", sport: "lacrosse", role: "Goalie", title: "Start the clear" },
  { slug: "viz-lax-goalie-doorstep", sport: "lacrosse", role: "Goalie", title: "Stone the doorstep" },
  { slug: "viz-lax-goalie-low-bouncer", sport: "lacrosse", role: "Goalie", title: "Stop the low bouncer" },
  { slug: "viz-lax-goalie-man-down-kill", sport: "lacrosse", role: "Goalie", title: "Hold the man-down kill" },
  { slug: "viz-lax-goalie-command-the-defense", sport: "lacrosse", role: "Goalie", title: "Command the defense, no shot" },
  { slug: "viz-lax-goalie-next-save", sport: "lacrosse", role: "Goalie", title: "Soft one behind you, next save" },

  // ── Forward — Soccer (7) — FV-76 wiring; athlete-selectable as of
  // FV-78/FV-79 go-live.
  { slug: "viz-soc-fwd-run-in-behind", sport: "soccer", role: "Forward", title: "Run in behind" },
  { slug: "viz-soc-fwd-near-post-finish", sport: "soccer", role: "Forward", title: "Attack the near post" },
  { slug: "viz-soc-fwd-take-on", sport: "soccer", role: "Forward", title: "Take on the fullback" },
  { slug: "viz-soc-fwd-hold-and-spin", sport: "soccer", role: "Forward", title: "Hold it up and spin" },
  { slug: "viz-soc-fwd-press-and-finish", sport: "soccer", role: "Forward", title: "Angle the press" },
  { slug: "viz-soc-fwd-penalty", sport: "soccer", role: "Forward", title: "The penalty" },
  { slug: "viz-soc-fwd-next-chance", sport: "soccer", role: "Forward", title: "Miss the sitter, get back in the match" },

  // ── Midfielder — Soccer (7) — FV-76 prerequisite wiring. DORMANT until FV-78/79.
  { slug: "viz-soc-mid-half-turn", sport: "soccer", role: "Midfielder", title: "Receive on the half-turn" },
  { slug: "viz-soc-mid-switch-play", sport: "soccer", role: "Midfielder", title: "Switch the play" },
  { slug: "viz-soc-mid-through-ball", sport: "soccer", role: "Midfielder", title: "Play the ball through the line" },
  { slug: "viz-soc-mid-win-it-back", sport: "soccer", role: "Midfielder", title: "Win it back in front of the back four" },
  { slug: "viz-soc-mid-late-run-finish", sport: "soccer", role: "Midfielder", title: "Arrive late in the box" },
  { slug: "viz-soc-mid-beat-the-press", sport: "soccer", role: "Midfielder", title: "Turn out of the press" },
  { slug: "viz-soc-mid-next-touch", sport: "soccer", role: "Midfielder", title: "Give it away, recover the shape" },

  // ── Defender — Soccer (7) — FV-76 prerequisite wiring. DORMANT until FV-78/79.
  { slug: "viz-soc-def-one-v-one-stand", sport: "soccer", role: "Defender", title: "Stand up the 1v1" },
  { slug: "viz-soc-def-win-the-header", sport: "soccer", role: "Defender", title: "Attack the header" },
  { slug: "viz-soc-def-read-and-intercept", sport: "soccer", role: "Defender", title: "Read it early, step in" },
  { slug: "viz-soc-def-play-out", sport: "soccer", role: "Defender", title: "Play out under pressure" },
  { slug: "viz-soc-def-overlap-cross", sport: "soccer", role: "Defender", title: "Overlap and deliver" },
  { slug: "viz-soc-def-recovery-tackle", sport: "soccer", role: "Defender", title: "Recover the run, win it clean" },
  { slug: "viz-soc-def-next-duel", sport: "soccer", role: "Defender", title: "Beaten once, reset the matchup" },

  // ── Goalkeeper — Soccer (7) — FV-76 prerequisite wiring. DORMANT until FV-78/79.
  { slug: "viz-soc-gk-set-and-save", sport: "soccer", role: "Goalkeeper", title: "Set the angle, control the shot" },
  { slug: "viz-soc-gk-claim-the-cross", sport: "soccer", role: "Goalkeeper", title: "Call it early, claim the cross" },
  { slug: "viz-soc-gk-off-your-line", sport: "soccer", role: "Goalkeeper", title: "Close the space on the through ball" },
  { slug: "viz-soc-gk-distribution", sport: "soccer", role: "Goalkeeper", title: "Collect it, start the next attack" },
  { slug: "viz-soc-gk-wall-and-freekick", sport: "soccer", role: "Goalkeeper", title: "Set the wall, save the free kick" },
  { slug: "viz-soc-gk-penalty-save", sport: "soccer", role: "Goalkeeper", title: "Set on the line, read the strike" },
  { slug: "viz-soc-gk-next-save", sport: "soccer", role: "Goalkeeper", title: "Soft goal, reset for the next shot" },
];

// Fast slug → title lookup (built once at module load).
const TITLE_BY_SLUG: Record<string, string> = Object.fromEntries(
  POSITIVE_PLAYS.map((p) => [p.slug, p.title]),
);

/**
 * The positive plays available to a given sport + role, in canonical (display)
 * order. Returns [] for a null/unknown role (no-position sports never reach
 * the picker; the flow gates the step on sportConfig.roles, but [] keeps
 * callers safe).
 *
 * FV-406: both `sport` and `role` are required — role names collide across
 * sports (e.g. hockey "Defense"/"Goalie" and lacrosse "Defense"/"Goalie" are
 * different roles with different play libraries), so filtering on `role`
 * alone would silently mix libraries.
 */
export function positivePlaysFor(sport: Sport, role: string | null): readonly PositivePlay[] {
  if (!role) return [];
  return POSITIVE_PLAYS.filter((p) => p.sport === sport && p.role === role);
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
 *
 * FV-406: takes `sport` explicitly (role names collide across sports — see
 * positivePlaysFor).
 */
export function sportHasPositivePlays(sport: Sport, roles: readonly string[] | undefined): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.every((role) => positivePlaysFor(sport, role).length > 0);
}
