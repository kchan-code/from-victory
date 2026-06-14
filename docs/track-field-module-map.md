# Track & Field Taxonomy — Event Groups × Adversities (FV-TRF)

**Status: RATIFIED-CANDIDATE — pending KC sign-off (kc-gate).**
Authored 2026-06-13. Track & field is a **v2 / DORMANT** sport (launch is locked
hockey + basketball, FV-26; golf moved toward go-live on the 2026-06-12
directive). This document is the taxonomy contract the track & field build
consumes regardless of launch timing — it defines the event groups (roles),
adversities, the matrix, the slug scheme, vocabulary, the clinical gate, and age
fit that the downstream clip-script and audio-render stages depend on.
**Non-goals:** the clip scripts and the audio themselves. **The whole track is
DORMANT** pending audio render + clinical sign-off + KC go-live (see §6, §8).

Mirrors the engine shape — **N roles × M adversities = N×M hard-moment cells** —
exactly as the other sports do: hockey (Forward/Defense/Goalie), basketball
(Guard/Wing/Big), baseball (Pitcher/Catcher/Infield/Outfield), golf
(Bomber/Ball-Striker/Scrambler), swimming (Sprinter/Distance/Stroke/IM). Track &
field is **non-positional** — like golf and swimming, the engine's "position"
dimension maps to **event group**, the meaningful split being which event family
carries your identity and, when it betrays you, which collapse reflex you reach
for. Same discipline as the golf and swimming docs: a group's problems are
specific — the sprinter's twitch on the blocks ≠ the thrower's fouled-out series
in the ring, and you do not reuse one for the other.

**Authored by a standing track coach + the content trio under lead
orchestration** (see the §8 agent note — there is **no track-field-expert
agent**; recommend recruiting/creating one before go-live):
- **standing track coach (domain authenticity, in lieu of a track-field-expert
  agent)** — event-group splits, VIZ cues, the adversity list, the per-group
  manifestations, slug scheme, vocabulary, age fit. Carries the field-event foul
  conventions and the runway/ring/track vocabulary. The no-height / runway-balk
  content routes to the sports-psychologist for the reframe, not the coach.
- **sports-psychologist** — per-group psychological distinctness (the
  collapse-reflex column, §1) and the clinical gate on downstream reframes (§6).
  The no-height cell (WITHHELD across Jumper + Thrower) and the runway-balk
  reading of `nervous` route here, never to the coach.
- **content-curator + youth-pastor** — voice integration and the scripture /
  brand-spine framing the reframe stage and the postgame drafts depend on.
- **product-strategist** — scope. Track & field runs **5 event groups** because
  the sport genuinely contests five non-interchangeable event games — sprint,
  distance, hurdle, jump, throw — and neither side compresses below the splits in
  §1 without flattening a real VIZ block. (The combined-events athlete — the
  decathlete / heptathlete — is documented as a future consideration in §1 but is
  NOT in v1.)

**KC decision points (open — §9):** the 5 event groups (Sprinter/Distance/
Hurdler/Jumper/Thrower), roleLabel **"Event"**, the shared-adversity model
(model a), the adversity count (10) + the per-group drops/reroutes, the `trf-`/
`hm-trf-` slug prefix, and the clinical gate (the no-height withhold across
Jumper + Thrower + the runway-balk reading of `nervous` gated + the standing
RED-S body-composition rail).

---

## 1. Event groups (5 — track & field is non-positional) — CANDIDATE

`Role = "Sprinter" | "Distance" | "Hurdler" | "Jumper" | "Thrower"` ·
**roleLabel = "Event"**

Track & field has no positions. The meaningful split is **which event family is
your identity** — what you train for, what your mark or time is read on, and
which event's betrayal collapses you. These are not skill tiers (a
state-qualifier can be any of them); they are **identities**, which is exactly
what the engine's role dimension wants. A group's adversity set, its first-rep
VIZ, and its collapse reflex are non-interchangeable: you cannot rehearse
"explode out of the blocks, hold form through the line" (sprint) and "stand at
the back of the runway, count the steps, attack the board" (jump) in one VIZ
block.

The **collapse reflex** is the false move the group reaches for under pressure —
identity-protection dressed as strategy. The downstream reframes reject it; the
VIZ (§2) pre-loads the antidote. (sports-psychologist mechanism in the right
column.)

| Role | Token | roleLabel | Covers | Identity fuses to | Collapse reflex (the mechanism) |
|---|---|---|---|---|---|
| **Sprinter** | `sprint` | Event | 100 / 200 / 400 + sprint relays — pure speed | *I'm explosive; the start and the finish are who I am* | **over-tighten / press the line** — after a bad start or getting out-leaned, the answer is "run harder," gripping and over-striding to claw back hundredths already gone, which only shortens the turnover and adds tension. Contingent self-worth welded to the start and the lean, so a hundredth lost feels like a verdict; the press is identity defense, not speed. |
| **Distance** | `dist` | Event | 800 / 1600 / 3200 / XC crossover — pace and tolerance | *I out-grind everyone; the pace and the pain are mine* | **over-monitor / chase the pace** — after a split slips, fixates on the watch and surges early to "make it back," blowing the even-pace plan and dying in the last lap. The grind identity reads a slow split as proof the work didn't take, so the mid-race math spirals instead of settling into the rhythm. |
| **Hurdler** | `hurdle` | Event | 100H / 110H / 300H / 400H — speed plus rhythm over barriers | *I own the rhythm; clean trail leg and stride pattern are the proof* | **chase the rhythm / over-reach a barrier** — after clipping a hurdle the answer is to lunge and over-reach the next one to "make the steps work," which breaks the very rhythm that needs to stay relaxed and repeatable. The rhythm identity has a thin margin, so one hit reads as "the whole pattern's gone." |
| **Jumper** | `jump` | Event | long / triple / high jump / pole vault — the approach and the attempt | *I trust the runway; the approach and the takeoff are who I am* | **over-control the approach / steer the run-up** — after a foul or a missed height, tries to manufacture the jump by steering and decelerating into the board or the takeoff, which kills the speed the jump needs and tightens the very thing that must stay free. The runway-trust identity, once shaken, second-guesses every step — exactly when commitment matters most. |
| **Thrower** | `throw` | Event | shot / discus / javelin / hammer — power and timing in the ring | *I'm powerful; the big mark is the proof of the work* | **muscle the throw / force the big one** — after a foul or a short mark, tries to force a season-best by over-powering the implement, rushing the rhythm out of the back of the ring, which sends the mark short or out the front of the circle. Power identity reads a short series as "I've got nothing today," so the next attempt presses harder, not smoother. |

> **Future role — combined-events athlete (decathlete / heptathlete), token
> `combo` (documented, NOT in v1).** The multi-event athlete contests ten or
> seven events across two days, scoring on tables, with a genuinely different
> mental game — the cumulative-points arc, recovering from one bad event to
> protect the score, the two-day endurance of focus. It does not map cleanly onto
> the five single-event groups (it is, in effect, all of them in sequence). It is
> documented so the build reserves the `combo` token and the sixth VIZ block, but
> it is **out of v1 scope** — added only if KC greenlights a combined-events
> track.

Every track & field athlete, whatever the group, runs or competes against the
same clock or measuring tape, sits in the same heat sheet, and waits through the
same call-up — that's the universal adversity layer (§3: the bad heat/lane, the
nerves, the slow start), not a sixth group.

> **Why 5, not more (and not fewer) — the scope math.** Each group = +1 VIZ block
> + a full adversity column + that many renders + broken integrity-test parity.
> - **Fold Hurdler into Sprinter? (no).** The hurdler races a speed event, but
>   the VIZ is the *rhythm over barriers* — the stride pattern, the trail leg, the
>   clip-and-recover — which is not the flat sprinter's start-and-lean rehearsal.
>   A hit hurdle is a categorically different failure than a slow start. Distinct
>   block.
> - **Fold Jumper and Thrower into one "field events" group? (no).** They share
>   the foul / the runway-or-ring attempt structure, but the rehearsals are
>   non-interchangeable — the jumper's *approach speed and takeoff commitment* vs.
>   the thrower's *power and ring rhythm*. Two VIZ blocks, not one. (They do share
>   adversity *shapes* — the foul, the no-height — which is exactly why the §5
>   reroutes converge them, not a merged role.)
> - **Split Distance into 800 vs. 5K? (no).** Real flavor (the 800 is a
>   speed-endurance event; the 3200/XC is pure tolerance), but the shared center
>   holds — Distance is "I sit on the pace and out-grind the field." The 800
>   "kicker" vs. the 5K "metronome" flavor lives in the cell **script**, not a new
>   block.
> - **Split off a "Relay" group? (no).** The relay is the team flavor *every*
>   sprinter and most distance/hurdle athletes touch — it lives in the handoff
>   adversity (§3) and the relay-DQ reading, in-script, not a sixth identity.
> Everything finer than these 5 is per-cell script nuance.

---

## 2. ROLE_CONTENT (courage/identity title + 5 present-tense VIZ scenes)

The analog of hockey/baseball/golf/swimming `ROLE_CONTENT`. Concrete,
present-tense, said-out-loud-able, group-true. These are the athlete's
**first-rep rehearsal** — the good imagery, not the adversity. (Candidate
wording; final confirmed by content-curator + the standing track coach at the
script stage.)

```ts
Sprinter: {
  title: "Explode and hold form.",
  scenes: ["See the blocks.", "React to the gun.", "Drive phase, then tall and loose.",
           "Run through the line, don't reach.", "Out-leaned — next rep, fresh."],
},
Distance: {
  title: "Sit on the pace.",
  scenes: ["Settle into the rhythm.", "Trust the splits.", "Ride the pack, relaxed.",
           "Build the last lap.", "Pace slipped — reset, find it again."],
},
Hurdler: {
  title: "Trust the rhythm.",
  scenes: ["See the first hurdle.", "Attack, don't float.", "Trail leg snaps through.",
           "Same steps, every barrier.", "Clipped one — stay tall, keep the count."],
},
Jumper: {
  title: "Commit to the run.",
  scenes: ["Set your mark.", "Full speed at the board.", "Free and tall on the takeoff.",
           "Trust the steps, don't steer.", "Fouled — reset on the line, attack again."],
},
Thrower: {
  title: "Stay smooth, then explode.",
  scenes: ["Set your feet in the ring.", "Slow back, fast finish.", "Long through the middle.",
           "Stay in the circle, finish tall.", "Short throw — reset between attempts."],
},
```

The reset cues are pre-loaded into the VIZ on purpose — each group's collapse
reflex is named so the rehearsal builds the antidote in: Sprinter "out-leaned —
next rep, fresh" (anti-press-the-line, and the between-rounds reset is built for
this); Distance "pace slipped — reset, find it again" (anti-over-monitor);
Hurdler "clipped one — stay tall, keep the count" (anti-chase-the-rhythm);
Jumper "trust the steps, don't steer" + "reset on the line, attack again"
(anti-steer-the-run-up); Thrower "reset between attempts" + "slow back, fast
finish" (anti-muscle-the-throw). The Jumper's "don't steer" pre-loads the
runway-commitment discipline ahead of the foul / no-height cells; the Thrower's
"stay in the circle" pre-loads the ring-discipline ahead of the foul cell.

---

## 3. The shared adversity labels (first-person, track & field voice) — 10 cells

Same first-person voice as hockey/basketball/baseball/golf/swimming.
Slot-for-slot this preserves the engine's adversity *categories* so the `need ×
role × adversity` resolution shape is identical to every other sport — only the
strings + fragments change. Track & field balances the **universal layer**
(everyone draws a heat, everyone gets nervous, everyone can start slow) against
the **group-specific failure shapes** (the false start, the handoff, the foul,
the no-height).

**Count: 10** (matches hockey/basketball/baseball/golf/swimming, keeps
integrity-test parity). Track & field has more candidate adversities than slots
— and more genuine per-group *non-existence* than any prior sport — so the
discipline is in what gets **folded** and **rerouted per group** (§5).

```ts
ADVERSITIES = [
  "I false start.",                      // 1  the twitch on the blocks, DQ before you run a step (sprint/hurdle) ⚠
  "I blow the handoff.",                 // 2  the relay exchange dropped or out of the zone — letting three down ⚠
  "I get out-leaned at the line.",       // 3  beaten to the line by inches/hundredths — the sprinter's signature ⚠
  "I foul.",                             // 4  scratch the board / step out of the ring / cross the line — the mark erased ⚠
  "I no-height.",                        // 5  zero in the high jump / vault / a no-mark series — WITHHELD Jumper+Thrower (see §6) ⚠⚠
  "I draw a bad heat or lane.",          // 6  outside lane, a slow heat, a stacked heat — off the seed
  "I hit the wall.",                     // 7  the distance bonk — the legs go, the pace falls apart late ⚠
  "I feel nervous in the blocks.",       // 8  pre-race / pre-attempt arousal in the call-up (shared) ⚠
  "I start slow.",                       // 9  a flat opening, behind early with ground to make up (shared)
  "I fall off the pace.",                // 10 behind my target split / the qualifying time, the climb against the clock (shared)
];
```

**Adversity label notes:**
- **#4 "I foul"** is track & field's field-event erasure cell — the scratched
  long-jump board, the foot out the front of the throwing ring, the crossed line.
  For the **Hurdler** it relabels to **"I hit a hurdle"** (the hurdler's
  equivalent execution-erasure, the clip that costs the race), same `foul` key
  (§5). It ships as a SITUATION; the reframe is **clinically gated** (§6) where it
  brushes the foul-out-of-a-series identity spiral.
- **#5 "I no-height"** is track & field's signature contingent-self-worth cell
  for the vertical/field events — the zero, the no-mark, the series that produces
  nothing to score. It is the cell nearest the runway-balk / can't-commit
  motor-anxiety line. It ships as a SITUATION but is **WITHHELD from the picker
  across the Jumper and Thrower groups** (the clinical gate, §6). It is the track
  & field analog of golf's `first-tee` umbrella and swimming's `plateau` — the
  cell where the stakes outrun a hand-authored reframe.
- **#3 "I get out-leaned at the line" / #1 "I false start" / #2 "I blow the
  handoff"** are the **erasure / margin cells** — the three places track uniquely
  erases or steals a result (the hundredth at the lean, the twitch before the
  gun, the relay exchange that DQ's all four). They ship as situations but their
  reframes are **clinically gated** (§6) because they sit on contingent-self-worth
  + the relay letting-people-down line.

**What got folded (not standalone cells):**
- **The disqualification (lane violation, uniform, three-step rule)** is a
  *reading of* `foul` (#4) and `false-start` (#1) — the rulebook-erases-the-result
  category, flavored in-script per group, not its own cell.
- **The relay-exchange DQ** (out of the zone, disqualifying all four) is the
  team-element flavor of `handoff` (#2) — the same drop category read through the
  letting-people-down lens; flavored per group in §4, not a separate cell.
- **The PR that didn't come at the championship / the taper that didn't pay** is
  a reading of `fall-off-pace` (#10) and `start-slow` (#9) at the loaded meet, not
  a standalone cell.
- **The injury / the tweak mid-race** is NOT a cell — a real or feared injury is
  routed to the coach/trainer and (if it brushes catastrophizing) the §6 routing,
  never hand-authored as a between-rounds reset.

> **Model (a), recommended (like golf / swimming §3):** one shared 10-list +
> per-group scripts + label-only `roleAdversities` overrides + a per-group set of
> **drops + key reroutes** (§5, where a group genuinely doesn't have a cell — a
> distance runner doesn't false-start out of blocks the way a sprinter does, a
> jumper doesn't run a relay handoff). Do NOT author 5 disjoint 10-lists (model b)
> — it 5×s the surface and breaks the parameterized integrity test. A foul is a
> foul; an out-lean is an out-lean. The Sprinter out-leaned at the 100 line and
> the Hurdler out-leaned at the 110H line are the *same category* read through
> different identities — a per-group **script**, not a separate cell. The
> goalie-pulled / Big-fouled-out / pitcher-error / golf-first-tee /
> swimming-reroute precedents prove shared-label-with-per-group-override is right.

---

## 4. The 5×~? grid — per-group manifestation (38 authored cells; 36 selectable)

One line per cell: how that adversity hits THAT group, so the script stage writes
distinct, group-true scripts. ⚠ = clinical gate on the reframe (§6). ⚠⚠ =
no-height (highest gate; WITHHELD across Jumper + Thrower). ★ = identity-level
phrase the script must render as a *false story to reject*, never as the label.

**Cell counts per group (38 authored; 36 selectable):** Sprinter 8, Distance 7,
Hurdler 9, Jumper 7, Thrower 7. The drops/reroutes (§5) account for the off-count
groups; the no-height (#5) is authored for Jumper + Thrower but WITHHELD from the
picker (§6), so of the 38 authored cells, **36 are selectable** (the two
no-height withholds). The dropped cells reroute to an existing authored cell in
the same group, so they add no new clip.

### Sprinter (locus: over-tighten / press the line) — 8 cells
*(Drops `foul` and `no-height` — a flat sprinter neither scratches a board nor
no-heights; both reroute → `false-start` per §5. Faces: false-start, handoff,
out-leaned, bad-heat, hit-wall, nervous, start-slow, off-pace.)*
1. **False start** — the twitch on the blocks, gone before you ran a step, the most public erasure there is; ★"I can't be trusted to hold it." ⚠
2. **Handoff** — the relay exchange dropped or out of the zone, the leg you ran erased by the stick on the track; the letting-three-down weight. ⚠
3. **Out-leaned** — out front to the line and beaten by a chest-dip / a hundredth; "I had it and lost it on the lean." ★"I always die at the line." ⚠
4. **Bad heat / lane** — drawn lane 8 with no one to chase, or stacked into the fast heat under-seeded; "if I were really fast I'd have the inside."
5. **Hit the wall** — for the 400 sprinter: the rigor down the home straight, the legs lock up, "the last 50 always buries me." ⚠
6. **Nervous (blocks)** — the call-up to the final, body wired, "what if I miss the gun." *(reframe: "react to the gun — you don't have to force it, just be clean.")* ⚠
7. **Start slow** — a flat block start, behind at the cut-in with little track to climb back; "I left it in the blocks."
8. **Fall off the pace** — the 200/400 dying in the second half, behind the split that makes the time; "the time's already gone."

### Distance (locus: over-monitor / chase the pace) — 7 cells
*(Drops `false-start`, `foul`, and `no-height` — distance races rarely
false-start out of blocks and never foul a board or no-height; all three reroute
→ `hit-wall` per §5. Faces: handoff, out-leaned, bad-heat, hit-wall, nervous,
start-slow, off-pace.)*
1. **Handoff** — for the 4x400 / 4x800: the exchange botched after the legs are gone, the pace work undone by the stick. ⚠
2. **Out-leaned** — the 800/1600 kick that comes up a stride short at the tape; "I had the legs and lost the lean." ⚠
3. **Bad heat / lane** — seeded in a slow heat with no one to pull you, racing the clock alone in a paceless field; the longest event in the loneliest slot.
4. **Hit the wall** — *(canonical reroute target — see §5)* — the bonk: the legs go, the pace falls apart over the last lap, the grind identity's nightmare; ★"I do all the work and it disappears." ⚠
5. **Nervous (blocks)** — the dread of the grind ahead, "I have to hold this pace for four laps." *(reframe: "settle into the first lap — trust the splits, the race comes to you.")* ⚠
6. **Start slow** — out too easy and boxed, behind the pack early with a long way to move up; the climb against a field that's gone.
7. **Fall off the pace** — behind the target split through the middle laps, the math spiraling, "the PR's already gone."

### Hurdler (locus: chase the rhythm / over-reach a barrier) — 9 cells
*(`foul` relabels to "I hit a hurdle" — the hurdler's execution-erasure, same
`foul` key. Drops `no-height` only (reroute → `foul`/hit-a-hurdle per §5). Faces:
false-start, handoff, out-leaned, foul[=hit a hurdle], bad-heat, hit-wall,
nervous, start-slow, off-pace — 9.)*
1. **False start** — the twitch on the blocks in a race where the first hurdle comes fast; gone before the first barrier. ⚠
2. **Handoff** — for the rare hurdle-relay / the sprinter-hurdler's flat relay leg: the exchange dropped. ⚠
3. **Out-leaned** — the 110H/100H final decided by a lean after a clean run; "the race was even and I lost the dip." ⚠
4. **Foul → "I hit a hurdle"** — clipping a barrier mid-rhythm, the stutter that costs the race or sends one flying; ★"one hit and the whole pattern's gone." ⚠
5. **Bad heat / lane** — drawn wide where the stagger hides the field, or under-seeded into a fast heat; racing rhythm with no reference.
6. **Hit the wall** — for the 300H/400H: the legs go on the back stretch and the steps between hurdles stop working; the long-hurdle rigor. ⚠
7. **Nervous (blocks)** — the call-up dread, "what if I clip the first one and it all unravels." *(reframe: "attack the first hurdle — trust the steps you've drilled a thousand times.")* ⚠
8. **Start slow** — a flat start that throws the steps to the first hurdle off; chasing the stride pattern from behind all race.
9. **Fall off the pace** — the long-hurdle / 400H fade where the rhythm between barriers collapses late; "I tied up and the steps died."

### Jumper (locus: over-control the approach / steer the run-up) — 7 cells
*(Drops `false-start`, `handoff`, and `hit-wall` — a jumper doesn't run from
blocks, run a relay, or bonk; all three reroute → `foul` per §5. WITHHOLDS
`no-height` from the picker — clinical (§6). Faces: out-leaned*, foul,
no-height[WITHHELD], bad-heat, nervous, start-slow, off-pace — 7 authored, 6
selectable. \*out-leaned reads as the head-to-head jump-off / the
beaten-on-countback finish.)*
1. **Out-leaned → the beaten-on-countback finish** — tied on the mark, beaten on the countback / the second-attempt rule; "I jumped the same and lost on a tiebreak." ⚠
2. **Foul** — the scratched board, the toe over the line, the best jump of the day wiped because of a centimeter; ★"my best is never the one that counts." ⚠
3. **No-height** — the zero: three misses at the opening height, a no-mark series, nothing to score, the runway or the bar that produced nothing; ★"I came away with nothing — I have nothing." ⚠⚠ *(WITHHELD — see §6)*
4. **Bad heat / lane → the late/cold flight** — drawn into the last flight after a long wait, or jumping cold off the seed; "the order's against me today."
5. **Nervous (run-up)** — the standing-at-the-back-of-the-runway dread, "what if I can't find the board" — the approach can't be forced. *(reframe: "commit to the run — full speed, trust the steps, the board comes to you.")* ⚠
6. **Start slow → the slow opening attempts** — fouling or under-marking the first attempts, digging out of an early hole in the series; "I always start the series flat."
7. **Fall off the pace → behind in the series** — sitting in a non-scoring spot with attempts running out; the climb against the standard with one jump left.

### Thrower (locus: muscle the throw / force the big one) — 7 cells
*(Drops `false-start`, `handoff`, and `hit-wall` — a thrower doesn't run from
blocks, run a relay, or bonk; all three reroute → `foul` per §5. WITHHOLDS
`no-height` from the picker — the no-mark series, clinical (§6). Faces:
out-leaned*, foul, no-height[WITHHELD], bad-heat, nervous, start-slow, off-pace —
7 authored, 6 selectable. \*out-leaned reads as beaten-on-the-last-throw / the
final-round flip.)*
1. **Out-leaned → beaten on the last throw** — leading into the final round and passed by someone's last attempt; "I had it won and the last throw took it." ⚠
2. **Foul** — the foot out the front of the ring, the throw that lands long but scratched, the best mark of the day wiped; ★"my biggest throw never counts." ⚠
3. **No-height → the no-mark series** — three fouls or three short ones, a series that produces no legal mark to score; ★"I came away with nothing — I've got nothing." ⚠⚠ *(WITHHELD — see §6)*
4. **Bad heat / lane → the early/cold flight** — thrown into the early flight and forgotten, or competing cold off the seed list; "no one's watching the order I'm in."
5. **Nervous (the ring)** — the step-into-the-circle dread, "what if I press and send it out the front" — power can't be forced. *(reframe: "slow back, fast finish — let the throw build, don't force it.")* ⚠
6. **Start slow → the flat opening series** — fouling or coming up short on the first throws, digging out of an early hole; "I always open the series tight."
7. **Fall off the pace → behind in the series** — sitting outside the scoring marks with throws running out; the climb against the standard with one attempt left.

> **Relabel-risk note (sports-psych):** #8 nervous and #9 start-slow are most
> prone to one generic script across all five groups. Keep them, but the script
> stage must author group-distinct (see the per-group reframe cues above). #4 foul
> is the relabel risk in the *other* direction — the sprinter doesn't foul, the
> hurdler "hits a hurdle," the jumper scratches a board, the thrower steps out of
> the ring; these are technically different moments and must not be flattened into
> a generic "foul." The no-height (#5) is the must-NOT-flatten, must-NOT-ship cell
> — it carries the §6 withhold across Jumper + Thrower.

---

## 5. Slug scheme (multi-sport-safe) + fragment map + per-group drops/reroutes

Hockey = `session-{role}-{frag}`; basketball = `bb-{role}-{frag}`; baseball =
`bsb-{role}-{frag}`; golf = `glf-{role}-{frag}`; swimming = `swm-{role}-{frag}`.
**Track & field owns its own prefix — `trf-` for the composite cell key,
`hm-trf-` for the hard-moment clip** (the same hm-/composite split baseball,
golf, and swimming use: `cellSlugFor` returns the `trf-*` composite key; the
audio stage renders both `hm-trf-{token}-{frag}` and the full `trf-{token}-{frag}`
composite). Three-letter `trf-` avoids any "track"/"field"/"tf" ambiguity and
parallels `bsb-`/`glf-`/`swm-`. **Compositional-only** — like golf and swimming,
track & field carries no baked per-cell mono-clips; every cell resolves to a
runtime-stitched composite.

**Group slug tokens** (the seeded short tokens, NOT lowercased role): `sprint`,
`dist`, `hurdle`, `jump`, `throw`.

**Fragment map (`TRACKFIELD_ADVERSITY_SLUG_FRAGMENTS`):**

```
"I false start."                  → "false-start"
"I blow the handoff."             → "handoff"
"I get out-leaned at the line."   → "out-leaned"
"I foul."                         → "foul"
"I no-height."                    → "no-height"
"I draw a bad heat or lane."      → "bad-heat"
"I hit the wall."                 → "hit-wall"
"I feel nervous in the blocks."   → "nervous"
"I start slow."                   → "start-slow"
"I fall off the pace."            → "off-pace"
```

**Per-group drops & key reroutes** (track & field is the most non-uniform sport
yet — three groups genuinely lack cells the others have; the pitcher-error /
swimming-reroute precedent):

| Group | Drop / reroute | Mechanism |
|---|---|---|
| **Sprinter** | drops `foul` + `no-height` (a flat sprinter neither scratches a board nor no-heights) → **both reroute to `false-start`** | `cellSlugFor` maps Sprinter × `foul` and Sprinter × `no-height` to the `false-start` key so no orphan clip |
| **Distance** | drops `false-start` + `foul` + `no-height` (distance rarely blocks-false-starts and never fouls/no-heights) → **all reroute to `hit-wall`** | `cellSlugFor` maps those three to the `hit-wall` key |
| **Hurdler** | relabels `foul` → "I hit a hurdle" (label-only, same key); drops `no-height` → **reroute to `foul`** | no key reroute on `foul` (kept, relabeled); `no-height` → `foul` |
| **Jumper** | drops `false-start` + `handoff` + `hit-wall` → **all reroute to `foul`**; **WITHHOLDS `no-height`** from the picker (authored, clinical §6) | three reroutes to `foul`; `no-height` authored at `trf-jump-no-height` but omitted from `roleAdversities` |
| **Thrower** | drops `false-start` + `handoff` + `hit-wall` → **all reroute to `foul`**; **WITHHOLDS `no-height`** from the picker (authored, clinical §6) | three reroutes to `foul`; `no-height` authored at `trf-throw-no-height` but omitted from `roleAdversities` |

```ts
// Per-group reroute table (the pitcher-error / swimming-reroute precedent: a cell
// that does not exist for a group maps to that group's nearest canonical key, so
// no orphan clip and the integrity test stays parameterized).
const TRACKFIELD_KEY_REROUTES: Partial<Record<Role, Record<string, string>>> = {
  Sprinter: { "foul": "false-start", "no-height": "false-start" },
  Distance: { "false-start": "hit-wall", "foul": "hit-wall", "no-height": "hit-wall" },
  Hurdler:  { "no-height": "foul" }, // foul kept (relabeled "I hit a hurdle")
  Jumper:   { "false-start": "foul", "handoff": "foul", "hit-wall": "foul" },
  Thrower:  { "false-start": "foul", "handoff": "foul", "hit-wall": "foul" },
};

cellSlugFor(adversity, role) {
  const frag = TRACKFIELD_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "off-pace";
  const token = GROUP_TOKEN[role] ?? "sprint"; // sprint|dist|hurdle|jump|throw
  const rerouted = TRACKFIELD_KEY_REROUTES[role]?.[frag] ?? frag;
  return `trf-${token}-${rerouted}`; // e.g. trf-jump-foul for Jumper × hit-wall
}
```

**`roleAdversities` overrides (label-only relabels + the drops + the §6
withhold):**
- **Sprinter:** drop `foul` and `no-height` from the picker (rerouted to
  `trf-sprint-false-start`); relabel `hit-wall` → "I tie up in the home straight"
  (the 400 rigor, the sprint-true wording on the same key); relabel `bad-heat` →
  "I draw a bad lane."
- **Distance:** drop `false-start`, `foul`, `no-height` from the picker (rerouted
  to `trf-dist-hit-wall`); relabel `hit-wall` → "I hit the wall" (kept); relabel
  `out-leaned` → "I get out-kicked at the tape."
- **Hurdler:** relabel `foul` → "I hit a hurdle" (label-only, same `foul` key);
  drop `no-height` from the picker (rerouted to `trf-hurdle-foul`).
- **Jumper:** relabel `out-leaned` → "I lose on a countback," `foul` → "I scratch
  the board," `bad-heat` → "I'm stuck in a bad flight," `start-slow` → "I open the
  series flat," `off-pace` → "I'm behind in the series." **Withhold `no-height`**
  (§6).
- **Thrower:** relabel `out-leaned` → "I get passed on the last throw," `foul` →
  "I foul out of the ring," `bad-heat` → "I'm stuck in a bad flight," `start-slow`
  → "I open the series flat," `off-pace` → "I'm behind in the series." **Withhold
  `no-height`** (§6).

(All relabels keep `key` = the canonical adversity string so `cellSlugFor` +
`state.adversity` resolve the same `trf-*` cell — the same mechanism hockey /
baseball / golf / swimming use. Drops remove the entry from the `roleAdversities`
array; the reroute means the dropped key still resolves to a real authored clip.
The no-height withhold is the FV-119 / golf-first-tee / swimming-plateau pattern:
drop the entry from the `roleAdversities` array across Jumper + Thrower; the clip
stays authored at `trf-{token}-no-height`.)

**Authored hard-moment grid — 38 cells (36 selectable):**
- `hm-trf-sprint-{false-start, handoff, out-leaned, bad-heat, hit-wall, nervous, start-slow, off-pace}` = **8** (foul + no-height rerouted to false-start)
- `hm-trf-dist-{handoff, out-leaned, bad-heat, hit-wall, nervous, start-slow, off-pace}` = **7** (false-start + foul + no-height rerouted to hit-wall)
- `hm-trf-hurdle-{false-start, handoff, out-leaned, foul, bad-heat, hit-wall, nervous, start-slow, off-pace}` = **9** (no-height rerouted to foul; foul relabeled "I hit a hurdle")
- `hm-trf-jump-{out-leaned, foul, no-height*, bad-heat, nervous, start-slow, off-pace}` = **7** (false-start + handoff + hit-wall rerouted to foul)
- `hm-trf-throw-{out-leaned, foul, no-height*, bad-heat, nervous, start-slow, off-pace}` = **7** (false-start + handoff + hit-wall rerouted to foul)

`*` = `no-height` is authored for Jumper + Thrower but **WITHHELD from the picker
across both groups** until clinical-advisor sign-off (§6). The hard-moment clips
are `hm-trf-{token}-{frag}`; the composite playlist cells are `trf-{token}-{frag}`.
**Total: 8 + 7 + 9 + 7 + 7 = 38 distinct authored cells; 38 − 2 no-height
withholds = 36 selectable.** The parameterized integrity test asserts this
38-cell grid, the per-group reroutes, the two `no-height` withholds, and the
label-only `roleAdversities` relabels.

---

## 6. Clinical gate (sports-psychologist) + the RED-S body-composition rail — for the reframe stage

**All 10 labels are normal competitive adversities, safe to ship as SITUATIONS
with reframes deferred — EXCEPT `no-height` (#5), which is WITHHELD across the
Jumper and Thrower groups.** The care lives in the *reframe*. As in golf and
swimming, the taxonomy is safe because it labels every cell **neutrally** (the
situation), never as a medical or catastrophic event, and keeps the global false
story as a *false story to reject*. These cells sit nearest contingent-self-worth
/ rumination / performance-anxiety territory and their reframe **must be
sports-psychologist-authored, explicitly age-calibrated, and routed past the
credentialed advisor when seated.** *(The sports-psychologist is a drafter, not a
licensed clinician; this gate exists so credentialed sign-off is structurally
enforced, not remembered. Note the standing track coach is a domain authenticity
source, NOT a clinician — see §8.)*

### ⚠⚠ HARD RAIL — THE BODY-COMPOSITION / WEIGHT / RED-S RAIL (flag-and-route, NEVER a cell)

Track & field is a body-exposed, RED-S-adjacent sport — distance running and the
jumps especially carry well-documented under-fueling, leanness-pressure, and
disordered-eating risk, and the sport's culture has a long history of weight talk
tied to performance. **There is NO `body-comp`, `weight`, `leanness`, or
food/restriction cell, and no reframe may instruct, praise, imply, or normalize a
weight target, a body-for-the-event comment, restriction, "racing weight," or
body-composition talk.** The swimming body-comp rail and the football OL body-comp
precedent apply directly. If any track & field script drifts toward weight, "lean
for the event," "racing weight," the singlet and bodies, cutting, or food rules,
it is **flagged and routed** to the sports-psychologist + the crisis-resource path
the kids-privacy-officer governs (Option C) — it is never hand-authored as
content. **This is a standing guardrail on the entire track & field track, with
the heaviest watch on the Distance and Jumper groups.**

### ⚠⚠ HIGHEST CLINICAL GATE — no-height (#5, Jumper + Thrower) — WITHHELD

The no-height ("I no-height" — the zero, the no-mark series) is track & field's
`lose-command` / `first-tee` / `plateau` umbrella for the field events — the cell
where the stakes outrun a hand-authored reframe. The zero is the cruelest
scoreline the sport produces: you competed and came away with *nothing to score*,
and on its worst day it brushes the **runway-balk / can't-commit motor-anxiety
line** — the high jumper or vaulter who can no longer commit to the bar, the
thrower who freezes in the back of the ring. This is the field-event analog of
the golf first-tee shank/yips umbrella and the baseball throwing-yips
`lose-command`: the involuntary failure-to-commit *is* the affliction, and naming
it deepens it.
**Withholding mechanism (explicit, FV-119 / golf-first-tee / swimming-plateau
precedent):** until the clinical advisor (CLAUDE.md Open Items) is seated, the
`no-height` cell is authored carefully but **WITHHELD from the selectable
adversities via `roleAdversities` omission across the Jumper and Thrower groups.**
The clip stays authored at `trf-{token}-no-height` so the grid is complete and the
integrity test asserts the withhold; it is simply not offered to the athlete until
a credentialed advisor clears the reframe. The script must **never name the
runway-balk or the freeze**, must keep the "I came away with nothing / I *am*
nothing" story as a *false story to reject*, must never moralize the zero or imply
effort is owed a mark, and may offer only identity-anchoring ("the board can
report a series; it cannot name a jumper") plus a real-world prompt to work the
approach / the commitment with a coach. Route to sports-psychologist + the pending
clinical advisor; do NOT let the standing track coach hand-author the reframe.

### ⚠ GATED — the runway-balk reading of `nervous` (Jumper + Vaulter especially)

The `nervous` (#8) cell is a normal pre-attempt arousal situation across all five
groups and ships as such. **But its Jumper/vault reading — the standing-at-the-
back-of-the-runway dread where the athlete can no longer commit to the approach —
is the near neighbor of the no-height balk and is GATED:** the reframe must stay
"commit to the run, trust the steps" and must **not** name a freeze, a balk, or an
inability to go, and must not drift toward the no-height verdict. If a `nervous`
reframe tips toward "I can't make myself go down the runway," it is no longer a
between-attempts reset — it routes to the sports-psychologist + clinical advisor,
the same gate as no-height.

### ⚠ HIGH — the erasure / margin cells (ship, but the reframe is gated and must be sports-psychologist-authored + age-calibrated)

1. **Out-leaned (#3), Sprinter heaviest.** Beaten by inches/hundredths at the
   line is contingent-self-worth at its sharpest — the race was right there and
   the lean said no. The reframe must break ★"I always die at the line" without
   erasing the loss. (The Jumper countback and Thrower last-throw readings carry
   the same shape.)
2. **False start (#1) + handoff (#2), sprint/hurdle/relay specialties — the
   erasure / let-down cells.** The twitch before the gun erases the race; the
   dropped handoff erases *three other people's* races too. The reframe keeps it
   event-level and blocks ★"my own twitch / my own hands cost everyone" from
   becoming an identity verdict — and on the relay, ★"I cost the other three" must
   not curdle into a worth claim.
3. **Foul (#4), all field groups (incl. the hurdler's "I hit a hurdle").** The
   centimeter that wipes the best mark of the day, the clipped barrier that ends
   the race; ★"my best is never the one that counts" / "one hit and the pattern's
   gone." Ship, but gate the reframe to break the foul-spiral without erasing the
   foul.
4. **Hit the wall (#7), Distance heaviest.** The bonk — ★"I do all the work and it
   disappears" — is contingent-self-worth routed through the grind. Ship, gate the
   reframe to keep it event-level.
5. **Bad heat / off-pace (#6 / #10), all groups.** The "if I were really fast I'd
   have the inside" / "the time's already gone" stories are contingent-self-worth
   routed through the public seed. Ship, but gate the reframe.

*Slow-arc cell (not in the 10, flagged for daily-training):* **the no-mark
season / the mark that won't move + the taper that didn't pay.** The withheld
pregame no-height cell (#5) has a slow-arc sibling: the stretch where the mark or
time won't move for a season, the no-height keeps recurring, and the
championship-taper dread peaks. It is a slow-arc trigger, not a between-attempts
one, so it lives in daily-training with a Locate → Reclaim → Re-enter shape, not
the pregame reset — and it carries the same clinical gate. Watch the line: "my
mark won't move" is normal; if a script tips toward *persistent hopelessness*, it
is no longer hand-authorable (see routing).

**Routing reminder (non-negotiable):** if any reframe drifts toward persistent
hopelessness, anhedonia beyond a normal post-meet week, self-harm-adjacent
content, disordered eating / body-image / weight obsession (the RED-S rail above),
a runway-balk / freeze story (the no-height + gated-nervous line), or abuse
(including from a coach or track parent), it does NOT get hand-authored — it
routes to the crisis-resource path the kids-privacy-officer governs (Option C):
988 Suicide & Crisis Lifeline, Crisis Text Line (text HOME to 741741), and a
"talk to a trusted adult" prompt. We are not a clinical service; the no-height,
the erasure cells, and any body/weight drift are the most likely to brush this
line, so they get the tightest sports-psych guardrail and a credentialed read
before ship.

---

## 7. Age calibration (one note for the script authors)

The 38 cells are one taxonomy; **register and stakes** shift across the band.
(Track & field structures change fast — **verify current details** before any
cell cites a mechanism: USATF Junior Olympic / AAU age divisions, state
high-school qualifying ladders (regionals → sectionals → state), the New
Balance Nationals / Nike Outdoor circuits, NCAA recruiting rules and the
performance-list databases (MileSplit / Athletic.net), and indoor vs. outdoor
season timing all evolve.)

- **13–15 — youth / middle-school & early-HS track, the first qualifying ladder.**
  Concrete, low-jargon. Stakes are the first time standards, the first regional
  meet, making the relay, the age-up wall (moving up a division and "losing" your
  marks). Bind responsibility tightly ("your next rep, your next attempt"). The
  **parent is often in the stands all day** — track meets are long, family-filled
  days — so the track-parent dynamic is real here, and the parent is the buyer.
  The no-height is withheld at every age; at 13–15 lean hardest on the §6
  guardrail. Do **not** import 16–18 recruiting framing, and lean hardest here on
  the RED-S rail — leanness pressure starts young in distance and jumps.
- **16–18 — the qualifying grind and the recruiting math (contingent-self-worth
  PEAK).** The danger band: state qualifying (regionals → sectionals → state),
  national meets (New Balance / Nike), the performance-list databases
  (Athletic.net / MileSplit) where the entire athletic identity is a sortable
  mark or time, college coaches recruiting on a converted-marks spreadsheet, and
  the brutally public math of needing to drop X seconds or add X feet by junior
  year. The `off-pace` / `foul` / `no-height`-adjacent cells land hardest here
  ("the meet that ends the recruiting season with a no-mark") — every
  identity-level cell needs its most careful *worth-is-not-on-the-results-page*
  reframe here, and reframes must never add "you wasted the season / the travel"
  weight. RED-S risk peaks in this band; the rail is at its tightest.
- **18–21 — college track & field and the ceiling questions (legal adults).**
  Autonomy and ownership: the equivalency-scholarship reality (track scholarships
  are sliced thin — most compete for partials or walk-on), conference and NCAA
  regionals/nationals as the year's point, travel-roster and scoring-lineup cuts,
  the indoor/outdoor double season, and the USATF / Olympic-Trials standard as the
  sport's lottery dream. Fully insider vocabulary is fine; do **not** use
  18–21-only terms (the equivalency split, the scoring lineup, the Trials
  standard, redshirting) in 13–15 content.

---

## 8. Downstream handoff & dependencies (all DORMANT pending KC go-live)

- **Clip scripts:** writes the 38 scripts from the §4 grid + 5 VIZ blocks + the
  §-Appendix practice-focus presets, through **content-curator + the standing
  track coach** (voice/authenticity + the RED-S rail) and **sports-psychologist**
  (§6 gated reframes + the no-height withhold + the gated runway-balk reading of
  nervous) + **youth-pastor** (scripture). Apply the ★ must-fix tags and the §6
  gate. Reuse the sport-neutral faith clips (openers, shared-opening, reset-plan,
  prayer, sendoff, cue words, self-talk). The no-height reframe and the
  erasure-cell reframes are the must-route items.
- **Audio render:** renders + masters the 38 clips (ash voice, OpenAI TTS,
  EQ/master, spectral QA); derives `MANIFEST_VERSION`. **DORMANT** — no render
  until KC go-live + clinical sign-off.
- **Pre-practice "Lock In":** the track & field focus presets + opener + beats
  (see Appendix practice-focus candidates).
- **Daily training:** 30-day arc; the **no-mark season / the mark that won't move
  + the taper that didn't pay** (§6) is the track-distinct daily-training topic
  flagged for the content trio + youth-pastor, carrying the same clinical gate as
  the withheld pregame cell.
- **Enum:** adds `track-field` (or `trackfield`) to the `Sport` union
  (`sport-registry.ts` / `lib/sports.ts`) + the DB sport CHECK constraint — only
  at go-live. Today track & field is intentionally **not** in `SUPPORTED_SPORTS`.
  (`PostgameModule.sport` is typed against the live `Sport` union, so the
  §-postgame drafts cannot be wired until this enum lands — see the postgame
  drafts doc, `fv-trackfield-postgame-drafts.md`.)
- **Routing / go-live:** track & field in the onboarding selector
  (`SUPPORTED_SPORTS`) + sport-aware content/pregame routing; populates
  `TRACKFIELD_CONFIG` in `sport-registry.ts` from §5 and the Appendix. **Gated on
  KC go-live.**
- **QA:** the parameterized integrity test asserts track & field's 38-cell grid +
  the per-group reroutes + the two `no-height` withholds + the label-only
  `roleAdversities` relabels.
- **Founder gate:** the launch-tier decision — **track & field stays DORMANT
  until audio render + clinical sign-off (the §6 no-height withhold + erasure-cell
  reframes + the RED-S rail) + KC go-live**; logged here for the audit trail.

> **⚠ AGENT-ROSTER NOTE — no track-field-expert agent exists.** Unlike hockey,
> basketball, golf, and swimming (each of which has a dedicated sport-expert
> agent), **there is no `track-field-expert` in `.claude/agents/`.** This taxonomy
> was authored by a **standing track coach** (domain authenticity, NOT a
> clinician) working with the content trio under lead orchestration, as a stopgap.
> **Recommendation: recruit / create a `track-field-expert` agent before go-live**
> — the per-group authenticity (the field-event foul conventions, the runway and
> ring vocabulary, the qualifying-ladder mechanics, the age/division roadmap) and
> the script-verification pass (the analog of how hockey-expert / golf-expert
> verify sport-specific scripts) should run through a standing agent, not a
> one-time coach pass. The CLAUDE.md sport-expert pattern ("one sport-expert per
> launch sport; advises + verifies, NOT a clinician") applies. File this as a
> go-live prerequisite alongside the clinical sign-off.

---

## 9. KC decision points — flagged for sign-off

1. **Event groups:** 5 — **Sprinter / Distance / Hurdler / Jumper / Thrower**,
   roleLabel **"Event"** (§1). Recommend confirm. Track & field compresses cleanly
   to five event identities; a sixth (combined-events `combo`) is documented as a
   future addition but recommended **OUT of v1**.
2. **Adversity model:** **Model (a)** — one shared 10-list + per-group scripts +
   label-only `roleAdversities` overrides + a per-group drop/key-reroute table
   (§3, §5). Recommend confirm; model (b) 5×s the surface and breaks the integrity
   test.
3. **Adversity count + drops:** **10** adversities, **38 authored cells (36
   selectable)** (Sprinter 8, Distance 7, Hurdler 9, Jumper 7, Thrower 7). The hard
   calls: Sprinter drops `foul`+`no-height` (reroute → `false-start`); Distance
   drops `false-start`+`foul`+`no-height` (reroute → `hit-wall`); Hurdler relabels
   `foul`→"I hit a hurdle" and drops `no-height` (reroute → `foul`); Jumper +
   Thrower drop `false-start`+`handoff`+`hit-wall` (reroute → `foul`) and WITHHOLD
   `no-height`. Recommend confirm.
4. **Slug prefix:** **`trf-`** composite / **`hm-trf-`** hard-moment, tokens
   `sprint`/`dist`/`hurdle`/`jump`/`throw`, **compositional-only** (golf/swimming
   model) (§5). Recommend confirm (baseball owns `bsb-`, golf `glf-`, swimming
   `swm-`, basketball `bb-`, hockey `session-`).
5. **Clinical gate (the withholds + the rail):**
   - **No-height (#5):** authored but **WITHHELD across the Jumper + Thrower
     groups** via `roleAdversities` omission until clinical-advisor sign-off — the
     FV-119 / golf-first-tee / swimming-plateau pattern (§6). Recommend confirm.
     This yields **36 selectable cells of 38 authored** until the advisor clears
     `no-height`.
   - **The gated runway-balk reading of `nervous`:** ships as a normal cell, but
     its Jumper/vault runway-balk reading is gated to "commit to the run," never a
     freeze (§6). Recommend confirm.
   - **The erasure / margin cells (out-leaned / false-start / handoff / foul):**
     ship as situations, reframes **clinically gated** (§6). Recommend confirm.
   - **THE RED-S BODY-COMPOSITION RAIL:** no weight / leanness / "racing weight" /
     food content ever a cell — flag-and-route, standing guardrail on the whole
     track, heaviest on Distance + Jumper (§6). Recommend confirm.
6. **No track-field-expert agent — go-live prerequisite.** Recommend KC approve
   **recruiting / creating a `track-field-expert` agent before go-live** (§8); this
   taxonomy was authored by a standing track coach + the content trio as a stopgap.
7. **DORMANT status:** the whole track & field track stays **DORMANT** pending
   audio render + clinical sign-off + KC go-live (§8). Recommend confirm — track &
   field is NOT in `SUPPORTED_SPORTS` and ships no content until KC flips the gate.

---

## Appendix — Registry picker candidates (for the script / pre-practice / go-live work)

Track & field-true analogs of the hockey/basketball/baseball/golf/swimming picker
lists, so the `TRACKFIELD_CONFIG` registry work has them ready. Final wording
confirmed by content-curator + the standing track coach at the script stage.

**Practice-focus presets (`practiceFocusOptions` → `pp-trackfield-focus-*`):**
```
"Compete every rep"          → "pp-trackfield-focus-compete-every-rep"
"One rep at a time"          → "pp-trackfield-focus-one-rep-at-a-time"  (the between-reps/attempts reset; the whole track mental game)
"Trust my technique"         → "pp-trackfield-focus-trust-my-technique"
"Relaxed speed"              → "pp-trackfield-focus-relaxed-speed"  (the sprint/hurdle paradox — fast IS loose)
"Finish through the line"    → "pp-trackfield-focus-finish-through-the-line"
"Attack the moment"          → "pp-trackfield-focus-attack-the-moment"  (commit to the start / the run-up / the throw)
"Reset between attempts"     → "pp-trackfield-focus-reset-between-attempts"  (the field-event series reset)
```
(7 presets, matching the other sports' count. "One rep at a time" and "Reset
between attempts" are the track-distinct ones — they encode the between-reps reset
and the field-event series-reset window, which is the whole track & field mental
game. "Relaxed speed" is the sprint/hurdle paradox the coach flagged: the harder
you try, the slower you go.)

**Reset anchors (`anchors`):** "Long exhale", "Press thumb to palm", "Say cue
word" are shared/sport-neutral. Track & field-specific:
```
"Shake out the legs"
"Reset on the line"      (step back behind the line / the mark, then re-set)
"Set your feet"          (the thrower in the ring / the jumper at the mark)
```
(Final anchor list per the brief: **Long exhale / Press thumb to palm / Shake out
the legs / Reset on the line / Set your feet / Say cue word** — three
sport-neutral, three track-specific.)

**Self-talk (`selfTalkOptions`):** swap the sport-cadence line, keep the 6
sport-neutral.
```
"You're okay. Next rep."           // (track & field cadence — replaces "Next shift/possession/at-bat/shot/race")
"Breathe. Do your job."
"Stay steady. Make the next play."
"You don't need to do too much."
"Compete, recover, go again."
"Your identity is secure. Compete free."
"You are secure. Take the next faithful action."
```

**Needs (`needs`):** swap the one sport-specific need, keep the 9 shared.
```
"Confidence", "Calm", "Compete level", "Reset after mistakes",
"Physical courage",                 // (weaker native fit in a non-contact sport — flagged like golf/swimming; see note)
"Better race execution"             // ← track & field swap (hockey "Better puck decisions")
"Leadership", "Joy", "Hope", "Be more Vocal"
```
> **Flag for KC/content-curator at the script/registry stage:** "Physical
> courage" and "Be more Vocal" are weaker fits in a non-contact, largely
> individual sport (the golf / swimming precedent). Options: keep as-is for
> cross-sport `NeedToday`-union stability, or swap "Physical courage" → "Mental
> toughness" and "Be more Vocal" → "Trust my technique." The `NeedToday` union is
> a hot type — recommend keeping it stable for now and revisiting at go-live.
> **The track & field swap is "Better race execution"** (the start/lean/pace/
> attempt discipline), replacing hockey's "Better puck decisions."

**`cueWordHelper`:** `"The one you'd say to yourself in the blocks."`
(Track & field's reset window is in the blocks / at the mark waiting for the gun
or the call — the cue word lives there, not "between shifts"/"at the line"/"on
the walk to the next shot"/"behind the blocks".)

**`cardShareHint`:** `"Screenshot it. Open it before they call your heat."`

**Practice openers (`practiceOpenerSlugs`):** `"dialed-in"` reuses the
sport-neutral `pp-opener-dialed-in`; `"not-feeling-it"` →
`pp-trackfield-opener-get-to` (authored at the pre-practice stage).

**`audioScript`:** the track & field text-mode script mirrors the
basketball/baseball/golf/swimming segment structure (segments 0/35/210/250/275
sport-neutral; 80/120/165 track-specific — "see the race / first rep off the line
or the runway / compete your event"). Until rendered, `TRACKFIELD_CONFIG` can
satisfy the type with the shared `AUDIO_SCRIPT` placeholder, exactly as
`BASEBALL_CONFIG` does today.

---

### Files referenced
- `docs/baseball-taxonomy-FV-93.md` — structural template (mirrored sections 1-9).
- `docs/golf-module-map.md` — non-positional precedent (event-group maps onto the
  role dimension exactly as golf's player-profile does) + the clinical-withhold
  pattern.
- `docs/swimming-module-map.md` — most recent same-format non-positional
  individual-sport precedent + the per-role drop/reroute table, the
  conditional-withhold, and the body-composition (RED-S) safety-rail patterns
  (mirrored shape).
- `apps/web/components/pregame/sport-registry.ts` — the `SportConfig` shape the
  go-live work populates `TRACKFIELD_CONFIG` onto from §5 and the Appendix.
- `apps/web/lib/sports.ts` — the `SUPPORTED_SPORTS` / `Sport` union track & field
  joins only at go-live (today: NOT a member; track & field is DORMANT).
- `apps/web/lib/postgame/modules.ts` — where the 5 "For the Ride Home" postgame
  drafts (see `fv-trackfield-postgame-drafts.md`) get wired at go-live, once
  `Sport` includes track & field.
- `.claude/agents/` — **no `track-field-expert` agent exists** (§8); recommend
  creating one before go-live. Authenticity here was a standing track coach +
  content trio.
- `CLAUDE.md` — audience-language rules (athlete/runner/jumper/thrower/you, never
  "kid") + brand spine.
- `docs/brand.md` — voice modes, words to use/avoid.
