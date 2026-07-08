# Lacrosse Module Map — Positions × Adversities (FV-404)

**Status: DRAFT pending KC ratification (FV-404).** Decision artifact only.
Authored 2026-07-08. Lacrosse is a **v2 / DORMANT** sport (KC-directed
2026-07-08; launch stays locked hockey + basketball, FV-26). This document is
the ratified content contract the **script book (FV-405, `docs/scripts/
lacrosse.md`)** and the **engine wiring (FV-406, `LACROSSE_CONFIG` in
`apps/web/components/pregame/sport-registry.ts`)** plug into. Non-goals: the
clip scripts themselves and the audio render.

**Scope: BOYS' / MEN'S FIELD LACROSSE.** Girls'/women's lacrosse and box/indoor
lacrosse are materially different games and are **out of scope** — see §6.

Mirrors the engine shape every sport uses — **N positions × M adversities =
N×M hard-moment cells** — like hockey (Forward/Defense/Goalie), basketball
(Guard/Wing/Big), and baseball (Pitcher/Catcher/Infield/Outfield). Same
discipline as every prior taxonomy: **a position's problems are specific** — a
FOGO losing the clamp at the X ≠ a close defenseman beaten topside to GLE, and
you do not reuse one for the other.

**Authored by the trio under lead orchestration:**
- **lacrosse-expert** (`.claude/agents/lacrosse-expert.md`) — game authenticity:
  positions, VIZ libraries, the adversity list, per-position manifestations,
  slug scheme, vocabulary, age fit.
- **sports-psychologist** (to co-author FV-405) — per-position psychological
  distinctness and the clinical gate on downstream reframes (§4). The
  yips-class cells route to the sports-psychologist, not the lacrosse-expert.
- **product-strategist** — scope: 5 positions is the scope-minimal
  position-true set (§1); lacrosse does not compress to 3 or 4.

**Registry-shaped.** Every section maps onto a `SportConfig` field
(`roles`, `roleContent`, `adversities`, `roleAdversities`,
`adversitySlugFragments`, `cellSlugFor`, `vizSlugFor`). FV-406 populates
`LACROSSE_CONFIG` from §1, §2, §3, §5, and the Appendix.

---

## 1. Positions (5 — lacrosse is genuinely positional) — RATIFY

`Role = "Attack" | "Midfield" | "Defense" | "FOGO" | "Goalie"`

Hockey and basketball are continuous-flow games whose 3 buckets *compress* a
fluid role. Lacrosse, like baseball, is **discretely positional** — five
different games with five non-interchangeable emotional centers and five
different first-rep visualizations. You cannot rehearse "the dodge from X,"
"the clamp at the dot," and "the save and the outlet" in one VIZ block. 5 is
the smallest grouping that stays position-true; finer splits (O-middie vs
SSDM; close-D vs LSM) are **in-script / in-library nuance**, not new VIZ blocks
(§ the scope math).

| Position | One-line identity (13–21 competitive) | Identity fuses to | Collapse reflex (sports-psych, to confirm FV-405) |
|---|---|---|---|
| **Attack** | Lives at X and around the cage — the primary dodger, feeder, and finisher; on for offense. | *points — goals + assists are who I am* | **force it** — dodges into the double, forces the feed, presses to get "his" back |
| **Midfield** | The two-way runner — plays both ends, subbed on the fly (O-middie / SSDM / two-way); motor is the job. | *my motor; I can do it all, both ends* | **over-extend** — tries to be the hero at both ends, gasses, then presses |
| **Defense** (close D + **LSM** variant lens) | The pole — footwork, positioning, and the slide package erase the man; the LSM lens is the same pole as a transition + GB weapon. | *I lock my man down; he disappears* | **overcommit / gamble** — reaches, throws the low-percentage check, chases the highlight and gets beaten |
| **FOGO** | The face-off specialist — his whole game is the fast-twitch clamp battle at the X; often off the field right after. | *a win/loss scoreboard at the dot* | **grip / over-try** — squeezes the clamp, jumps early, chases the last loss |
| **Goalie** | The last line and the leader of the defense — he also **starts every clear**, so his day is save *and* outlet. | *save percentage; the one that gets by* | **shrink / over-anticipate** — guesses, cheats a pipe, stops leading after a soft one |

### The LSM call (RATIFY — confirming the FV-404 prior)

**Confirmed: close D and LSM are ONE "Defense" position, with LSM carried as a
variant lens — not a sixth position.** Reasoning:

- LSM shares Defense's **emotional center**: it's a pole; the wound is the same
  — footwork lost, a blown slide, a highly-visible mistake that becomes a goal
  against in front of the bench. That center — not the field zone — is what the
  VIZ block and adversity column encode.
- What's distinct about the LSM (transition, ground balls, pushing the ball as
  an offensive weapon, matching middies) is **flavor**, and it is captured
  **without a new block** by (a) a dedicated LSM-flavored positive-play library
  (§2, Defense Library B: *"Take it the other way"*) and (b) LSM script
  readings of the shared Defense adversities (§3).
- **Scope math:** a 6th position = +1 VIZ block + a full adversity column + ~10
  more renders + broken integrity-test parity, for a role that shares Defense's
  core wound. This is the exact call baseball made not splitting Infield into
  corners/middle, and basketball made not splitting 1–5.

> **Why FOGO and Goalie *are* their own positions (and LSM is not):** FOGO and
> goalie are genuinely non-interchangeable emotional centers with their own
> first-rep VIZ (the clamp at the dot; the save + the outlet) that no other
> block rehearses. The LSM's first-rep VIZ (win the GB, push it) is a *theme
> inside the pole's block*, not a new center. Distinctness of VIZ, not distinctness
> of jersey, is the test.

---

## 2. Viz positive-play libraries (RATIFY the theme names)

Per the **locked pregame scaling architecture** (2026-06-07), each (sport,
position) carries two PARALLEL selectable libraries the athlete picks from:
the **positive-play** library (this section — "see yourself do X *well*") and
the **adversity** library (§3). This section gives the positive-play side.

**Structure:** each position gets **two named-theme sub-libraries**, each with
**6–8 seeded play-moment candidates** (short phrases, not scripts). The two
themes split each position's *good imagery* into its two truest halves (e.g.
attack's beat-your-man half vs. see-the-field half). The runtime consumes a
**flat per-role `viz-lax-<role>-<play>` list** exactly as today
(`positive-plays.ts`, `POSITIVE_PLAYS`) — the themes are an **authoring/organizing
lens for FV-405**, not a new runtime axis, so this does **not** re-architect the
player. FV-405 authors each candidate as a discrete `viz-lax-<role>-<play>`
clip; FV-405 also picks the **flagship 5** per position for `roleContent.scenes`
(the text-mode / MVP one-flagship path).

`roleContent.title` (picker-card identity line) per position:
Attack → *"Take him and finish."* · Midfield → *"Both ends, full motor."* ·
Defense → *"Lock him down. Take it the other way."* · FOGO → *"Win the dot."* ·
Goalie → *"The next shot. Then start the break."*

### Attack
**Library A — "Beat your man" (dodge & finish)**
- Split dodge from X, roll back, finish low-to-high
- Question-mark dodge from up top, hands free, top cheese
- Face dodge through the alley, get to GLE, bounce it far pipe
- Bull dodge from X, absorb the check, finish through contact
- Beat the shut-off, catch and finish before the slide arrives
- Isolate a short-stick from X and take him every time
- Two-man game, slip the pick, turn the corner to the cage

**Library B — "See the field" (feed & off-ball)**
- Draw the slide, feed the crease for the finish
- Skip pass to the weakside shooter for a catch-and-shoot
- X feed to the cutter coming off the crease
- Come off a pick off-ball and bury the catch-and-shoot
- Backside cut into open space, finish the feed
- EMO — move it, find the open man, one-more it home
- Ride hard from the front, force the errant clear, win it back
- Settle it, "wind it," and run the set on time

### Midfield
**Library A — "Push the ball" (transition & dodge)**
- Win the GB in the middle and push it in transition
- Take it end-to-end off the faceoff-wing win, finish the break
- Dodge from up top, get your hands free, rip it far pipe
- Split the short-stick, get downhill to the cage
- Trail the break, catch the swing, step into a time-and-room shot
- Invert — take the pole from behind, dodge from X as a middie
- Sub on fresh, first touch, dodge before the D sets

**Library B — "Cover both ends" (two-way motor)**
- Ride your man on the clear, force the turnover, get it back
- SSDM slide over, break up the dodge, force a bad feed
- Backcheck the fast break, take away the middle, force it wide
- Win the wing battle at the faceoff, come up with the GB
- Match up on their best middie, keep him topside
- Dig in gassed at the end of a long D possession — get the stop, then get off
- Cause the turnover, scoop the man-ball, start the break the other way

### Defense (close D + LSM lens)
**Library A — "Lock him down" (on-ball D & slides)**
- Move your feet, keep him topside, force him behind the cage
- Break down, throw a good poke check, knock him off his dodge
- Take away his strong hand, force the weak-hand dodge, ride him out
- Slide over on time, wall up, force the bad shot
- Recover after the slide, find your man, deny the feed
- Approach under control — no trail check, no slide needed
- Erase your matchup for a quarter — he disappears from the game
- Communicate the slide package, quarterback the defense, get the stop

**Library B — "Take it the other way" (transition & GB — LSM lens)**
- Win the ground ball in traffic, protect it, outlet clean
- LSM push in transition — carry it past midfield, feed the break
- Caused turnover with a lift check, scoop it, go the other way
- Jump the passing lane, take away the dodge, force the errant pass
- Clean the clear — receive the outlet, beat the ride, advance it
- Long-pole GB off a faceoff wing, secure it, start the offense
- Match up on a middie in transition, stand him up, force the reset

### FOGO
**Library A — "Win the clamp" (at the X)**
- Fast clamp on the whistle, beat him to the ball
- Clamp and rake back to your wing, secure the GB
- Counter his clamp, come over the top, win the pull
- Win it clean forward, scoop, go straight to offense
- Read his tendency, adjust the counter, win the next one
- Get low, win the leverage battle, exit to open field
- Lose the clamp but battle — tie him up, let your wing win it

**Library B — "Win the wing / GB" (after the draw)**
- Win the draw and take it yourself, push it to a shot
- Clamp and feed the fast break before the D sets
- Battle for the 50/50 in the scrum, come up with it
- Win the wing exchange with your middie, secure the ball
- Draw the violation on him, win the possession clean
- Get off the field clean after the win, let the offense run
- Reset after a loss — next draw, quicker hands, win it back

### Goalie
**Library A — "Make the save" (in the cage)**
- Track the shot from the stick, drive your hands, make the save
- Set the angle, square up, take away the far pipe
- Big save on the step-down — hands beat the shot
- Read the low-to-high, drop the stick, kick out the bouncer
- Find the ball late through traffic, react, wall up
- Point-blank on the crease — desperation save, smother the rebound
- Save the man-up shot, hold your ground, control the rebound
- Read the breakaway, hold, force his hand, make the stop

**Library B — "Start the clear" (outlet & lead)**
- Make the save, secure it, outlet clean to the break
- Direct the defense, call the slide, organize before the shot
- Save-and-go — hit the middie on the wing, start the fast break
- Clear it under a hard ride, find the open man, beat the pressure
- Warm hands early — first save of the game sets the tone
- Rebound control — steer it to the corner, no second chance
- Quarterback the clear from the crease, advance it past midfield

---

## 3. Adversity taxonomy — shared 10 + per-position manifestation (RATIFY)

**Model (a), like every prior sport:** one shared canonical adversity list +
per-position *scripts* + label-only `roleAdversities` overrides and a handful
of special-case slugs. Do **not** author 5 disjoint lists (model b) — it
quintuples the surface and breaks the parameterized integrity test. A turnover
is a turnover; the Attack's turnover and the Goalie's thrown-away clear are the
*same category* read through different identities — a per-position **script**,
not a separate cell. The goalie-pulled / Big-fouled-out / pitcher-pulled
precedents prove shared-label / per-position-script is right.

### The shared 10 canonical adversities (first-person, lacrosse voice)

```ts
ADVERSITIES = [
  "I turn the ball over.",     // 1  dropped pass / caused TO / forced dodge into a double
  "I get dodged.",             // 2  beaten on-ball — Defense/Midfield home (maps hockey beaten-wide)
  "I take a bad penalty.",     // 3  slash / push / hold / cross-check → man-down (maps hockey bad-penalty)
  "I get shut off.",           // 4  taken away by a lockdown pole; disappear from the offense — LACROSSE SIGNATURE
  "I fail a clear.",           // 5  clear rode & turned; transition TO becomes a fast break — LACROSSE SIGNATURE
  "Coach yells.",              // 6  external pressure (shared motif)
  "I get benched.",            // 7  removal / minutes anxiety (shared motif)
  "I feel nervous.",           // 8  pre-performance arousal (shared motif)
  "I start slow.",             // 9  cold first quarter, out of rhythm (shared motif)
  "We fall behind early.",     // 10 the early deficit, no lead is safe (shared motif)
];
```

**Mapping to the standardized motif table** (`docs/pregame-script-style.md`):
`I get dodged` → *beaten/cooked* motif; `I take a bad penalty` → *penalty/whistle*
motif; `Coach yells`, `I get benched`, `I feel nervous`, `I start slow`,
`We fall behind early`, `I turn the ball over` → their shared motifs directly.
The two lacrosse-signature cells (`shut-off`, `failed-clear`) have no cross-sport
analog and get their own reframes authored at FV-405 in the motif *shape*
(name it over → deny it the next rep → point forward).

**What got folded (not standalone shared cells):**
- **Gassed on a long defensive possession** → a **Midfield** reading of
  `failed-clear` / `start-slow` (the two-way middie asked to push after a long
  D shift), not its own cell.
- **Losing a string of draws** → the **FOGO** reading of `dodged` (beaten at the
  X), surfaced via a special-case slug (below).
- **Soft goal / getting shelled** → the **Goalie** reading of `shut-off` (the
  goalie's version of being "taken away"), via a special-case slug.
- **Costly slash/push** = `penalty` directly; **failed ride** (attack) = the
  Attack reading of `failed-clear`.

### The 5×N grid — per-position manifestation

One line per cell (the FV-405 authoring seed). ★ = identity-level phrase FV-405
must render as a *false story to reject*, never as the label. ⚠ = ships, but the
reframe is clinically gated + sports-psych-authored (§4). Cells that reroute to
a special-case slug are marked → `slug`.

**Attack (locus: taken away / points-identity) — 9 cells** *(drops `dodged` —
attackmen are not on-ball defenders; the thin-cell / pitcher-error precedent)*
1. **Turnover** — force a dodge into a double, throw it away; feed picked off in the slide; ★"I can't be trusted with the ball."
2. **Shut off** — face-guarded by a lockdown pole, vanish from the offense for a quarter; ★"I'm invisible — I'm nothing out here." ⚠
3. **Bad penalty** — a push in the back or an off-ball hold puts your team man-down; "I cost us the possession."
4. **Coach yells** — benched a shift for forcing it / not moving off-ball; "Coach doesn't trust my hands."
5. **Benched** — subbed off after a cold stretch, watch the second midfield run your offense; ★"I lost my spot." ⚠
6. **Nervous** — pregame vs. a committed lockdown pole / college coaches on the hill; "what if he erases me today."
7. **Start slow** — first few touches feel off, nothing finds the corner; "I'm pressing already."
8. **Fall behind early** — the pull to force every dodge and get it all back yourself.
9. **Fail a clear** → `hm-lax-attack-rode-out` — rode out hard from the front, cough it up trying to clear the pressure; "I gave it right back."

**Midfield (locus: over-extension / two-way motor) — 10 cells** *(the most
complete block; everything applies)*
1. **Turnover** — stripped on the dodge / bad cross-field feed in transition; "I tried to do too much."
2. **Dodged** — as an SSDM, beaten by a bigger, faster O-middie topside; "I got cooked in front of the bench."
3. **Bad penalty** — a late slide slash / a hold on the ride hands them EMO; "my man-down now."
4. **Shut off** — a dodging middie neutralized, poled up top, can't get your hands free; "they took my dodge away."
5. **Fail a clear** — gassed at the end of a long D possession, asked to push it, cough it up; "no legs, no clear."
6. **Coach yells** — subbed off at the box for a specialist, feel like a role player; "I'm just a legs guy to him."
7. **Benched** — short-sticked out of the rotation / subbed and not called back; "I lost the run."
8. **Nervous** — first middie out, both ends, motor on display; "what if I'm gassed by the second quarter."
9. **Start slow** — flat legs early, a step behind at both ends; "get my motor going before it's a hole."
10. **Fall behind early** — the runner's urge to answer the run single-handedly, end-to-end, every possession.

**Defense (close D + LSM lens) — 10 cells + 1 gated**
1. **Turnover** — throw the outlet away / botch the clear under the ride; "I gave them a free possession."
2. **Dodged** — beaten topside to GLE, your man scores in front of the bench; ★"I'm a liability out here." ⚠
3. **Bad penalty** — the costly slash / hold / cross-check that puts the team man-down; "30 seconds of 6-on-5 on me."
4. **Shut off** — *(LSM lens)* your transition push gets stonewalled, no outlet, forced backward; "I killed our break."
5. **Fail a clear** — the caused turnover that instead becomes a fast break the other way; "I turned a stop into a goal."
6. **Coach yells** — called out for a blown slide / losing the man-ball; "I can't do anything right back here."
7. **Benched** — poled down / subbed after getting beaten twice; ★"they don't trust me on-ball." ⚠
8. **Nervous** — matched on their committed attackman / dodging star; "what if he takes me every time."
9. **Start slow** — beaten early, feet not moving, a step slow to the slide; "settle before it snowballs."
10. **Fall behind early** — the anchor weight (hold the crease, quarterback the D) lands on you.
- **⚠ GATED (withheld):** *The clear deserts you* → `hm-lax-defense-clear-yips` — the throwing yips; the routine outlet that suddenly won't go (§4).

**FOGO (locus: grip / one-job identity) — 8 cells + 1 gated** *(drops `shut-off`
— a FOGO isn't "shut off"; his world is the dot)*
1. **Turnover** — lose the GB battle after the clamp, cough up the exit; "I won the clamp and lost the ball."
2. **Dodged** → `hm-lax-fogo-lose-draws` — lose a string of draws to a quicker clamp; the team "we can't get the ball" pressure lands on you; ★"I'm losing us the game at the dot." ⚠
3. **Bad penalty** → `hm-lax-fogo-violation` — whistled for a faceoff violation (early motion, hands, withheld ball) at the worst moment; "I gave one away for free."
4. **Coach yells** — earful after three straight losses at the X; "one more and I'm done."
5. **Benched** → `hm-lax-fogo-off-the-dot` — the other FOGO goes in for the big draw; ★"I only have one job and I lost it." ⚠
6. **Nervous** — first draw vs. a committed FOGO, the whole bench watching one rep; "what if he clamps me clean."
7. **Start slow** — drop the first two draws, dig an early hole; "find the ball before it's 3-0."
8. **Fall behind early** → `hm-lax-fogo-lose-wing` — behind, and every draw now feels like it has to be a win-and-go; the pressure to be the whole comeback at the dot.
- **⚠ GATED (withheld):** *The clamp deserts you* → `hm-lax-fogo-clamp-yips` — the fast-twitch fundamental suddenly won't fire; can't win a clamp he's won ten thousand times (§4).

**Goalie (locus: exposure / last-line identity) — 10 cells + 1 gated**
1. **Turnover** → `hm-lax-goalie-throw-away` — throw the clear away, a free possession the other way; "the one job after the save."
2. **Dodged** → `hm-lax-goalie-beaten-clean` — beaten clean on a shot you should have, glove-side; "that's a save I make."
3. **Bad penalty** → `hm-lax-goalie-man-down` — scored on man-down, the 6-on-5 you couldn't hold; "they got the man-up look."
4. **Shut off** → `hm-lax-goalie-soft-goal` — the soft goal that squeaks under your stick, sits on the board; ★"I lost us that one." ⚠
5. **Fail a clear** — your clear gets rode and turned right back; "I couldn't get us out of our end."
6. **Coach yells** — called out for a soft one / not directing the D; "he's on me and I can't erase it."
7. **Benched** → `hm-lax-goalie-pulled` — pulled after getting shelled, the long walk to the bench; ★"I got yanked — I'm done." ⚠
8. **Nervous** — seeing a high-powered offense / scouts behind the cage; "what if I let in an early soft one."
9. **Start slow** — beaten early, seeing 15+ shots behind a leaky defense; "settle in, make the next one."
10. **Fall behind early** — the last-line weight (steady the D, start every clear) lands squarely on you.
- **⚠ GATED (withheld):** *The save deserts you* → `hm-lax-goalie-save-yips` — can't stop anything, the flinch/freeze, stopped seeing the ball (§4).

> **Relabel-risk note (for FV-405):** `coach-yells`, `nervous`, `start-slow`,
> and `fall-behind-early` are the cells most prone to one generic script across
> positions. Keep them, but author them position-distinct (Attack: "your hands
> are still yours"; Midfield: "get your motor going"; Defense: "settle the feet,
> next slide"; FOGO: "next whistle, quicker hands"; Goalie: "next shot, you're
> the last line").

**Authored / selectable counts:** Attack 9 · Midfield 10 · Defense 10 (+1 gated)
· FOGO 8 (+1 gated) · Goalie 10 (+1 gated) = **50 authored, 47 selectable** until
clinical sign-off. The FV-406 integrity test asserts this grid + the special-case
slugs + the three withheld yips cells.

---

## 4. Gated identity-collapse candidates (FV-119-class) — RATIFY the roster

**All 10 shared labels are normal competitive adversities, safe to ship as
SITUATIONS with reframes deferred.** The care lives in the *reframe* (FV-405).
The taxonomy is safe because it labels every cell **neutrally** (the situation)
and keeps the collapse story as a *false story to reject*. Two tiers of gate,
following the golf `first-tee` / baseball `lose-command` precedent and the
`docs/pregame-script-style.md` "gated cells" section (worth-register authorized;
never the FV-339 blockquote verbatim; never name "the yips").

### ⚠⚠ HIGHEST — the yips-class (WITHHELD from the picker until clinical sign-off)

These three are **motor-anxiety / involuntary-loss-of-a-fundamental** cells —
the lacrosse analog of the baseball throwing yips and the golf shank/putting
yips. They are **authored** in the book (so the grid + integrity test are
complete) but **withheld from the Step-02 picker** via `roleAdversities`
omission (FV-119 pattern) until a credentialed advisor (CLAUDE.md Open Items)
clears the reframe. Conservative by design — these are the **worth-wound** ones,
not merely the painful ones:

1. **FOGO — the clamp deserts you** (`hm-lax-fogo-clamp-yips`) — the fast-twitch
   clamp he's won ten thousand times suddenly won't fire. Distinct from the
   ordinary "I lose a string of draws" (losing to a quicker opponent), which
   **ships**.
2. **Goalie — the save deserts you** (`hm-lax-goalie-save-yips`) — the flinch /
   freeze / "I've stopped seeing it." Distinct from the ordinary "soft goal /
   shelled" (`hm-lax-goalie-soft-goal`), which **ships**.
3. **Defense (pole) — the clear deserts you** (`hm-lax-defense-clear-yips`) —
   the throwing yips: the routine outlet/clear pass that suddenly won't go
   (the baseball-infield `lose-command` analog). Distinct from the ordinary
   "I fail a clear" (rode-and-turned under pressure), which **ships**. *(The
   goalie also throws every clear and shares this class; the throwing-yips cell
   is anchored on the pole, with the goalie's save-yips as its goalie-specific
   sibling. FV-405 may author a goalie clear-throw variant if the advisor
   deems it warranted — flagged, not assumed.)*

**Registry mechanism:** these three carry a canonical key (`"I lose my touch."`
→ fragment `lose-touch`) in `adversitySlugFragments`; `cellSlugFor` reroutes it
per position to the three slugs above; and every role **omits** it from its
`roleAdversities` array → fully withheld. Attack and Midfield do **not** carry a
yips cell (their cold-touch stretch is a *slump* flavor of `shut-off` /
`start-slow`, which ships live, not a motor-collapse). The reframe must **never**
name "the yips," must keep the motor-failure story as a *false story to reject*,
and carries the authorized worth-register (a plain, earned worth clause or a
7th worth-truth line — never a slogan).

> **KC sub-decision (flagged):** the yips umbrella can instead be modeled as a
> baseball-exact **shared selectable adversity** ("I lose my touch") that
> *ships* for Attack/Midfield (as a non-yips cold-stretch, like baseball's
> outfield "bad throw") and is *withheld* only for FOGO/Goalie/Defense.
> Recommendation: **keep it out of the shared selectable 10** (a lacrosse
> cold-touch stretch overlaps `shut-off`/`start-slow` and adds no distinct
> non-yips VIZ), and carry the three yips cells as the withheld roster above.

### ⚠ HIGH — global-verdict / identity-level (ship, reframe gated + sports-psych-authored)

Ship live, but the FV-405 reframe must be sports-psychologist-authored, age-
calibrated, and routed past the credentialed advisor:
- **Attack × shut-off** — erased for a quarter → "I'm invisible / I'm nothing
  out here." The purest points-identity wound; heaviest-use attack cell.
- **Removal cells** — Goalie × pulled, FOGO × off-the-dot, Attack/Defense ×
  benched — the brain reads removal as "I'm not trusted / I lost my spot."
- **Goalie × soft-goal** and **Defense × dodged (beaten topside)** — the
  highly-visible, on-the-board mistake → "I lost us that one / I'm a liability."
- **FOGO × lose-draws** — the one-job identity: a whole game read as a
  scoreboard of wins and losses at the dot.

**Routing reminder (non-negotiable):** if any reframe drifts toward persistent
hopelessness, self-harm-adjacent content, disordered eating, or abuse
(including from a coach or lacrosse parent), it does NOT get hand-authored — it
routes to the crisis-resource path the kids-privacy-officer governs (Option C):
988 Suicide & Crisis Lifeline, Crisis Text Line (text HOME to 741741), and a
"talk to a trusted adult" prompt.

---

## 5. Openers — inherit the shared verse-per-need set (CONFIRM)

**Confirmed: lacrosse inherits the shared pregame openers unchanged.** The
canonical verse-per-need map (`docs/pregame-script-style.md` §"Canonical verse
map") is sport-neutral and applies as-is: Be Vocal → Psalm 118:6; Calm →
Phil 4:6–7; Compete Level → Col 3:23–24; Confidence → Heb 12:1–2 (the spine
verse); Courage → Isaiah 41:10; Decisions → Prov 3:5–6; Hope → Isaiah 40:29–31;
Joy → 1 Thess 5:16–18; Leadership → Mark 10:43–45; Reset → Romans 8:1. **When a
verse changes for one sport, it changes for all.** Lacrosse uses the shared
`opener-*` clips at launch (as baseball, golf, and the other v2 sports do).

**Future sport-specific opener clips (`opener-lax-*`) — pattern, not v1 scope.**
Basketball authored its own `opener-bb-*` set purely for sport-specific
*application language* (the last line lands on real in-game calls, not an
abstraction). Lacrosse would eventually warrant its own set for the needs whose
application language is most sport-shaped:
- **Reset** (Romans 8:1) — the ride back after a turnover / the walk back to the
  crease after a soft goal.
- **Decisions** (Prov 3:5–6) — the slide-package read; hot / second slide; feed
  vs. shoot.
- **Confidence** (Heb 12:1–2) and **Courage** (Isaiah 41:10) — stepping into a
  dodge / holding the crease / getting back on the horse at the dot.
These are a **FV-406+ follow-up**, filed only if the shared openers read generic
to a real lacrosse player; not required to ship the module.

---

## 6. Girls' lacrosse — explicit deferred stub (DO NOT BLEND)

**Girls'/women's lacrosse is a materially different sport and is out of scope
here.** Different rules, different stick, minimal stick-to-body contact,
different field roles (attack/midfield/defense but no long poles or body
checking in the men's sense), 12 a side, and a "shooting space" / "critical
scoring area" ruleset with no men's equivalent. It is a **legitimate future
variant, not a footnote** — but it **must never be silently blended into this
boys'-field-lacrosse taxonomy**, and boys' adversities must not be "translated"
onto it. If girls' lacrosse is greenlit, it gets its **own module map, its own
expert/taxonomy, and its own script book** as a **separate future Linear
issue** — not a re-skin of this one. (Box/indoor lacrosse is a third variant —
smaller, walled, different again — likewise a separate future issue, out of
scope unless KC opens it.)

---

## 7. Downstream handoff & dependencies

- **FV-405 (script book, `docs/scripts/lacrosse.md`):** authors the ~50
  hard-moment cells from the §3 grid + the 5×2 VIZ libraries (§2) + the practice-
  focus presets (Appendix), through **content-curator + lacrosse-expert**
  (voice/authenticity) and **sports-psychologist** (§4 gated reframes) +
  **youth-pastor** (scripture). Apply the ★ must-fix tags and the §4 gate.
  Reuse the sport-neutral faith clips (openers, shared-opening, reset-plan,
  prayer, sendoff, cue words, self-talk). The three yips cells are the
  must-route cells; picks the flagship-5 per position for `roleContent.scenes`.
- **FV-406 (engine wiring):** adds `lacrosse` to the `Sport` union + the DB
  sport CHECK constraint; populates `LACROSSE_CONFIG` in `sport-registry.ts`
  from §1/§2/§3/§5 and the Appendix; adds the `viz-lax-*` library to
  `positive-plays.ts`; the parameterized integrity test asserts the grid, the
  special-case slugs, and the three withheld yips cells. Lacrosse ships
  **compositional-only** (golf/football/swimming precedent): `cellSlugFor`
  returns the `hm-lax-*` hard-moment slug directly.
- **Audio render (with FV-406 or its own issue):** renders + masters the clips
  (ash voice, OpenAI TTS, EQ/master, spectral QA); derives `MANIFEST_VERSION`.
  ⚠ Dormant-manifest landmine (memory): a full `--mode clips` regen renders all
  dormant v2 sports — kill the render after the lacrosse clips write and patch
  `manifest.json` surgically.
- **Go-live gate:** founder + product-strategist launch-tier decision + clinical
  sign-off on the three yips cells before they leave the withheld state.
  Lacrosse stays **absent from `SUPPORTED_SPORTS`** (`lib/sports.ts`) + the DB
  sport CHECK until KC flips it live (baseball/football/swimming precedent).

---

## Appendix — Registry picker candidates (for FV-405 / FV-406)

Lacrosse-true analogs of the hockey/basketball/baseball picker lists, so the
`LACROSSE_CONFIG` work has them ready. Final wording confirmed by
content-curator + lacrosse-expert at FV-405.

**Slug scheme:** lacrosse owns **`lax-`** (composite key) / **`hm-lax-`**
(hard-moment) / **`viz-lax-`** (positive-play). Verified free of collision with
`session-` (hockey), `bb-`, `bsb-`, `glf-`, `ftb-`, and the swimming/track
prefixes. Role tokens (lowercased): `attack`, `midfield`, `defense`, `fogo`,
`goalie`.

**Fragment map (`LACROSSE_ADVERSITY_SLUG_FRAGMENTS`):**
```
"I turn the ball over."  → "turnover"
"I get dodged."          → "dodged"
"I take a bad penalty."  → "penalty"
"I get shut off."        → "shut-off"
"I fail a clear."        → "failed-clear"
"Coach yells."           → "coach-yells"
"I get benched."         → "benched"
"I feel nervous."        → "nervous"
"I start slow."          → "start-slow"
"We fall behind early."  → "fall-behind-early"
"I lose my touch."       → "lose-touch"   // gated umbrella; withheld (§4)
```

**Special-case slugs (`cellSlugFor`, the goalie-pulled precedent):**
```
Attack   × failed-clear → hm-lax-attack-rode-out
FOGO     × dodged       → hm-lax-fogo-lose-draws
FOGO     × penalty      → hm-lax-fogo-violation
FOGO     × benched      → hm-lax-fogo-off-the-dot
FOGO     × fall-behind  → hm-lax-fogo-lose-wing
Goalie   × turnover     → hm-lax-goalie-throw-away
Goalie   × dodged       → hm-lax-goalie-beaten-clean
Goalie   × penalty      → hm-lax-goalie-man-down
Goalie   × shut-off     → hm-lax-goalie-soft-goal
Goalie   × benched      → hm-lax-goalie-pulled
FOGO/Goalie/Defense × lose-touch → hm-lax-{fogo-clamp|goalie-save|defense-clear}-yips  // withheld
Attack drops `dodged`; FOGO drops `shut-off` (omitted from roleAdversities).
```

**`needs` (swap the one sport-specific need, keep the 9 shared):**
"Confidence", "Calm", "Compete level", "Reset after mistakes",
"Physical courage", "Better decisions with the ball" *(← lacrosse swap for
hockey "Better puck decisions")*, "Leadership", "Joy", "Hope", "Be more Vocal".
*(The `NeedToday` union is a hot type — keep it stable; confirm at FV-406.)*

**`anchors`:** "Long exhale", "Press thumb to palm", "Say cue word" are shared.
Lacrosse-specific: "Tap your stick", "Glove tap on the shaft", "Reset at the X".

**`selfTalkOptions`:** swap the sport-cadence line, keep the 6 shared.
"You're okay. Next whistle." *(lacrosse cadence — replaces "Next shift/
possession")*, "Breathe. Do your job.", "Stay steady. Make the next play.",
"You don't need to do too much.", "Compete, recover, go again.",
"Your identity is secure. Play free.".

**`practiceFocusOptions` (→ `pp-lax-focus-*`):** "Win my one-on-one",
"Full motor, both ends", "Ground balls win games", "Talk on defense",
"Next whistle, next play", "Move off-ball", "Take care of the ball".

**`cueWordHelper`:** "The one you'd say to yourself on the ride back / at the X."
**`cardShareHint`:** "Screenshot it. Open it before the first faceoff."
**`practiceOpenerSlugs`:** `"dialed-in"` → shared `pp-opener-dialed-in`;
`"not-feeling-it"` → `pp-lax-opener-get-to` (authored FV-405).
**`audioScript`:** mirror the basketball/baseball segment structure (segments
0/35/210/250/275 sport-neutral; 80/120/165 lacrosse-specific — "see the field /
first dodge or first draw or first save / play your position"); until rendered,
`LACROSSE_CONFIG` satisfies the type with the shared `AUDIO_SCRIPT` placeholder,
as `BASEBALL_CONFIG` does.

---

## Ratification block

**Status: DRAFT pending KC ratification (FV-404).** KC is specifically
ratifying:

1. **Position set (5): Attack / Midfield / Defense / FOGO / Goalie** — and the
   **LSM call** (close D + LSM as ONE Defense position, LSM as a variant lens via
   Defense Library B + LSM script readings; **not** a 6th position). (§1)
2. **Adversity model:** Model (a) — one shared **10**-adversity list + per-
   position scripts + label-only `roleAdversities` overrides and the special-case
   slugs; 50 authored / 47 selectable. (§3, Appendix)
3. **Gated roster (FV-119-class, WITHHELD until clinical sign-off):** the three
   yips-class cells — **FOGO clamp**, **Goalie save**, **Defense/pole clear
   (throwing yips)** — plus the sub-decision on whether to model the umbrella as
   a withheld roster (recommended) vs. a baseball-style shared selectable cell. (§4)
4. **Library theme names (2 per position):** Attack *Beat your man / See the
   field*; Midfield *Push the ball / Cover both ends*; Defense *Lock him down /
   Take it the other way*; FOGO *Win the clamp / Win the wing*; Goalie *Make the
   save / Start the clear*. (§2)
5. **Slug prefix `lax-` / `hm-lax-` / `viz-lax-`** and lacrosse
   **compositional-only** rendering (golf/football precedent). (Appendix)

Downstream (FV-405 script book, FV-406 engine wiring) starts only after KC
ratifies this contract.

### Files referenced
- `.claude/agents/lacrosse-expert.md` — lacrosse domain-knowledge source.
- `docs/golf-module-map.md`, `docs/baseball-taxonomy-FV-93.md`,
  `docs/basketball-taxonomy-FV-29.md` — structural precedents.
- `docs/pregame-script-style.md` — the de-corned voice + standardized reframe
  motifs + the gated-cells section this map maps onto.
- `apps/web/components/pregame/sport-registry.ts` — the `SportConfig` shape
  FV-406 populates; `apps/web/components/pregame/positive-plays.ts` — the
  `viz-lax-*` library target.
- `CLAUDE.md` — audience language (athlete/player/you, never "kid") + brand spine.
</content>
</invoke>
