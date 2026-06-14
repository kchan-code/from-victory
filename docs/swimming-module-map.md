# Swimming Taxonomy — Event Specialties × Adversities (FV-274)

**Status: RATIFIED-CANDIDATE — pending KC sign-off (kc-gate).**
Authored 2026-06-13. Swimming is a **v2 / DORMANT** sport (launch is locked
hockey + basketball, FV-26; golf moved toward go-live on the 2026-06-12
directive). This document is the taxonomy contract the swimming build consumes
regardless of launch timing — it defines the event specialties (roles),
adversities, the matrix, the slug scheme, vocabulary, the clinical gate, and age
fit that the downstream clip-script and audio-render stages depend on.
**Non-goals:** the clip scripts and the audio themselves. **The whole track is
DORMANT** pending audio render + clinical sign-off + KC go-live (see §6, §8).

Mirrors the engine shape — **N roles × M adversities = N×M hard-moment cells** —
exactly as the other sports do: hockey (Forward/Defense/Goalie), basketball
(Guard/Wing/Big), baseball (Pitcher/Catcher/Infield/Outfield), golf
(Bomber/Ball-Striker/Scrambler), football (QB/RB/WR/OL/DL/LB/DB). Swimming is
**non-positional** — like golf, the engine's "position" dimension maps to
**event specialty**, the meaningful split being which event carries your
identity and, when it betrays you, which collapse reflex you reach for. Same
discipline as the golf doc: a specialty's problems are specific — the sprinter's
touched-out-by-hundredths ≠ the distance swimmer's wandering mind at the 300,
and you do not reuse one for the other.

**Authored by the trio under lead orchestration:**
- **swimming-expert** — game authenticity (event specialties, VIZ cues, the
  adversity list, the per-specialty manifestations, slug scheme, vocabulary, age
  fit). Carries the two hard swimming safety rails (§6): the breath rail and the
  body-comp rail. The plateau / DQ-erasure / false-start content routes to the
  sports-psychologist for the reframe, not the swimming-expert.
- **sports-psychologist** — per-specialty psychological distinctness (the
  collapse-reflex column, §1) and the clinical gate on downstream reframes (§6).
  The plateau cell (withheld across all 4) and the erasure cells
  (touched-out / false-start / DQ) route here, never to the swimming-expert.
- **product-strategist** — scope. Swimming runs **4 event specialties**, like
  baseball's four, because swimming genuinely races four non-interchangeable
  event games — sprint, distance, single-stroke, and IM — and neither side
  compresses below the splits in §1 without flattening a real VIZ block. The
  Marathon / open-water swimmer is documented as a future fifth (§1) but is NOT
  in v1.

**KC decision points (open — §9):** the 4 specialties (Sprinter/Distance/
Stroke/IM), the shared-adversity model (model a), the adversity count (10) + the
per-specialty drops/reroutes, the `swm-`/`hm-swm-` slug prefix, and the clinical
gate (the plateau withhold across all 4 + the erasure-cell reframe gate + the
two standing swimming safety rails).

---

## 1. Event specialties (4 — swimming is non-positional) — CANDIDATE

`Role = "Sprinter" | "Distance" | "Stroke" | "IM"` · **roleLabel = "Event"**

Swimming has no positions. The meaningful split is **which event is your
identity** — what you train for, what your seed time is read on, and which
event's betrayal collapses you. These are not skill tiers (a national-cut
swimmer can be any of them); they are **identities**, which is exactly what the
engine's role dimension wants. A specialty's adversity set, its first-rep VIZ,
and its collapse reflex are non-interchangeable: you cannot rehearse "explode
off the blocks, hold form to the touch" (sprint) and "sit on the pace, ride the
lonely middle" (distance) in one VIZ block.

The **collapse reflex** is the false move the specialty reaches for under
pressure — identity-protection dressed as strategy. The downstream reframes
reject it; the VIZ (§2) pre-loads the antidote. (sports-psychologist mechanism
in the right column.)

| Role | Token | roleLabel | Covers | Identity fuses to | Collapse reflex (the mechanism) |
|---|---|---|---|---|---|
| **Sprinter** | `sprint` | Event | 50 / 100 free + sprint of any stroke | *I'm explosive; the start and the touch are who I am* | **over-tighten / muscle-the-water** — after a bad start or a touched-out finish, the answer is "swim harder," gripping the water and over-kicking to claw back tenths that are already gone, which only shortens the stroke and adds drag. Contingent self-worth welded to the start and the touch, so a hundredth lost feels like a verdict; the panic-tighten is identity defense, not speed. |
| **Distance** | `dist` | Event | 500 / 1000 / the mile (1650) + 400+ of any stroke | *I out-grind everyone; the pace and the tolerance are mine* | **over-monitor / chase-the-pace-clock** — after the pace slips at the 300, fixates on the clock and surges early to "make it back," blowing the negative split and dying in the last 150. The grind identity reads a slow split as proof the work didn't take, so the mid-race math spirals instead of settling into the pace. |
| **Stroke** | `stroke` | Event | fly / back / breast specialist (the single-stroke identity) | *I own this stroke; the feel and the technique are the proof* | **over-control / chase-the-feel** — when the stroke "isn't there" in warm-up, tries to manufacture the feel by forcing tempo and muscling technique, which tightens the very thing that needs to stay long and loose. The narrow single-stroke identity has no fallback, so a fragile-feel day reads as "I have nothing today." |
| **IM** | `im` | Event | the 200 / 400 IM — the all-rounder | *I'm complete; I race all four and survive the weak leg* | **brace-for-the-weak-leg / pre-concede** — going into the leg they're worst at (usually the breaststroke or back split everyone can see), mentally concedes the split before it starts, swimming defensively and losing more than the gap they feared. Versatility identity quietly fears being "best at nothing," so the weak leg becomes a referendum instead of one quarter of a race. |

> **Future role — Marathon / open-water swimmer, token `ow` (documented, NOT in
> v1).** Open-water (the 5K/10K, no walls, no lane lines, navigation, drafting,
> feeds, and a genuinely different fear set — the pack, the chop, sighting) is a
> distinct emotional game that does not map cleanly onto the four pool
> specialties. It is documented so the build reserves the `ow` token and the
> fifth VIZ block, but it is **out of v1 scope** — added only if KC greenlights
> an open-water track.

Every swimmer, whatever the specialty, races the same clock, stands in the same
ready room, and reads the same heat sheet — that's the universal adversity layer
(§3: the ready-room nerves, the slow heat, the goggle failure), not a fifth
specialty.

> **Why 4, not more (and not 2) — the scope math.** Each specialty = +1 VIZ
> block + a full adversity column + that many renders + broken integrity-test
> parity.
> - **Collapse sprint + distance into "free" and stroke + IM into "form"? (no).**
>   That fuses the sprinter's explosion-and-touch game with the distance
>   swimmer's pace-and-tolerance game, and the single-stroke feel game with the
>   IM's transitions game — four non-interchangeable VIZ blocks crushed into two.
>   The whole point of the role dimension is the first-rep rehearsal, and those
>   rehearsals are distinct.
> - **Split Stroke into fly / back / breast? (no).** Real flavor, but the shared
>   center holds — Stroke is "I own one stroke; the feel is fragile and the
>   rulebook can erase me." The fly-vs-breast-vs-back flavor (fly fatigue, the
>   breaststroke pullout, the backstroke flags-and-finish) lives in the cell
>   **script**, not a new block. A standalone fly block would duplicate the
>   Stroke column.
> - **Split off a "Mid-distance / 200" specialist? (no).** The 200 is the
>   overlap of sprint speed and distance tolerance — it reads cleanly as a
>   Sprinter who can extend or a Distance swimmer with a gear, in-script, not a
>   fifth identity.
> Everything finer than these 4 is per-cell script nuance.

---

## 2. ROLE_CONTENT (courage/identity title + 5 present-tense VIZ scenes)

The analog of hockey/baseball/golf/football `ROLE_CONTENT`. Concrete,
present-tense, said-out-loud-able, specialty-true. These are the athlete's
**first-rep rehearsal** — the good imagery, not the adversity. (Candidate
wording; final confirmed by content-curator + swimming-expert at the script
stage.)

> **⚠ BREATH RAIL applies to every VIZ scene below (§6).** No scene names a
> breath count, a held breath, an underwater distance, or a hypoxic cue. Reset
> breathing in the VIZ is **dry-land, behind-the-blocks, calm-down** breathing
> only — never anything a swimmer could carry into the water as a breath-hold
> challenge. The Sprinter's "breakout" scene is deliberately worded **"Sharp
> breakouts"** (a clean, fast surfacing), NOT "Underwaters strong" / "hold the
> dolphin kicks longer" — see the §6 rail and the slug-fragment note.

```ts
Sprinter: {
  title: "Explode and hold form.",
  scenes: ["See the start.", "React to the beep.", "Long and clean off the wall.",
           "Sharp breakouts, hold the stroke.", "Touched out — next race, fresh."],
},
Distance: {
  title: "Sit on the pace.",
  scenes: ["Settle into the rhythm.", "Trust the splits.", "Ride the lonely middle.",
           "Build the back half.", "Pace slipped — reset, find it again."],
},
Stroke: {
  title: "Own my stroke.",
  scenes: ["Find the feel.", "Long and loose, not forced.", "Legal turn, clean touch.",
           "Hold the form when it's hard.", "Feel's off — swim it anyway, simple."],
},
IM: {
  title: "Race all four free.",
  scenes: ["Strong fly, settle the back.", "Smooth transitions.", "Trust the weak leg.",
           "Build into the free.", "Bad split — the next stroke is new."],
},
```

The reset cues are pre-loaded into the VIZ on purpose — each specialty's
collapse reflex is named so the rehearsal builds the antidote in: Sprinter
"touched out — next race, fresh" (anti-panic-tighten, and the one-tap re-run is
built for this between-events reset); Distance "pace slipped — reset, find it
again" (anti-over-monitor); Stroke "feel's off — swim it anyway, simple"
(anti-chase-the-feel); IM "bad split — the next stroke is new" (anti-pre-concede
on the weak leg). The Stroke's "legal turn, clean touch" pre-loads the
DQ-discipline ahead of the DQ / bad-turn cells.

---

## 3. The shared adversity labels (first-person, swimming voice) — 10 cells

Same first-person voice as hockey/basketball/baseball/golf/football. Slot-for-slot
this preserves the engine's adversity *categories* so the `need × role ×
adversity` resolution shape is identical to every other sport — only the strings
+ fragments change. Swimming balances the **universal layer** (everyone false-
starts, everyone's mind can wander, everyone stands in the ready room) against
the **specialty-specific failure shapes**.

**Count: 10** (matches hockey/basketball/baseball/golf/football, keeps
integrity-test parity). Swimming has more candidate adversities than slots, so
the discipline is in what gets **folded** and **rerouted per specialty** (§5).

```ts
ADVERSITIES = [
  "I get touched out.",                  // 1  beaten to the wall by hundredths — the sprinter's signature ⚠
  "I false start.",                      // 2  the twitch on the blocks, the DQ before the race begins ⚠
  "I get DQ'd.",                         // 3  one-hand touch / illegal turn / kick violation — the swim erased ⚠
  "I'm stuck on the same time.",         // 4  the season-long no-drop / plateau — WITHHELD all 4 (see §6) ⚠⚠
  "I blow a turn.",                      // 5  a botched flip/open turn that kills the wall and the breakout
  "My mind wanders mid-race.",           // 6  the focus that drifts in the lonely middle — the distance signature
  "My goggles fail.",                    // 7  goggles fill / slip on the dive — race blind, the gear betrayal
  "I'm seeded in a slow heat.",          // 8  off the psych sheet, racing the clock alone with no one beside me
  "I feel nervous in the ready room.",   // 9  pre-race arousal in the holding pen (shared)
  "I go out too slow.",                  // 10 behind my pace at the first split, the climb against the clock (shared)
];
```

**Adversity label notes:**
- **#4 "I'm stuck on the same time" (the plateau)** is swimming's signature
  contingent-self-worth cell **and** the one nearest persistent-hopelessness /
  rumination territory, because the verdict is *public, numeric, and
  season-long* — the clock is the whole story and a no-drop season reads as "the
  work didn't count." It ships as a SITUATION but is **WITHHELD from the picker
  across all four specialties** (the clinical gate, §6). It is swimming's analog
  of golf's `first-tee` umbrella and football's `big-hit` — the cell where the
  stakes outrun a hand-authored reframe.
- **#1 touched-out / #2 false-start / #3 DQ** are the **erasure cells** — the
  three places swimming uniquely erases a swim (the hundredth at the touch, the
  twitch before the gun, the rulebook wiping the time entirely). They ship as
  situations but their reframes are **clinically gated** (§6) because they sit on
  contingent-self-worth + the relay letting-people-down line.

**What got folded (not standalone cells):**
- **The taper not paying off** is a *reading of* the plateau (#4) and going-out-
  slow (#10) at championship time — the most loaded version of "the work didn't
  show," flavored in-script at the taper, not its own cell.
- **The relay take-off DQ** (disqualifying all four) is the team-element flavor
  of `get DQ'd` (#3) — the same erasure category read through the
  letting-people-down lens; flavored per specialty in §4, not a separate cell.
- **Adding time / a slower swim than seed** is a reading of going-out-slow (#10)
  and the plateau (#4), not a standalone cell.
- **The fly dying in the last 25 / the breaststroke pullout** are the Stroke
  specialty's readings of blow-a-turn (#5) and go-out-slow (#10), flavored in
  §4, not separate cells.

> **Model (a), recommended (like golf / football §3):** one shared 10-list +
> per-specialty scripts + label-only `roleAdversities` overrides + a small set of
> per-specialty **key reroutes** (§5, where a specialty genuinely doesn't have a
> cell — a sprinter's mind doesn't wander in a 22-second race the way a distance
> swimmer's does over the mile). Do NOT author 4 disjoint 10-lists (model b) — it
> 4×s the surface and breaks the parameterized integrity test. A touched-out
> finish is a touched-out finish; a DQ is a DQ. The Sprinter touched out by a
> hundredth and the Stroke specialist touched out at the flags are the *same
> category* read through different identities — a per-specialty **script**, not a
> separate cell. The goalie-pulled / Big-fouled-out / pitcher-error /
> golf-first-tee / football-QB-pick precedents prove shared-label-with-per-
> specialty-override is right.

---

## 4. The 4×~10 grid — per-specialty manifestation (38 authored cells)

One line per cell: how that adversity hits THAT specialty, so the script stage
writes distinct, specialty-true scripts. ⚠ = clinical gate on the reframe (§6).
⚠⚠ = plateau (highest gate; WITHHELD across all four). ★ = identity-level phrase
the script must render as a *false story to reject*, never as the label.

**Cell counts per specialty (38 authored; 34 selectable):** Sprinter 9, Distance
9, Stroke 10, IM 10. The drops/reroutes (§5) account for the off-10 specialties:
**Sprinter drops `mind-wanders`** (no lonely middle in a 22-second race —
reroute → `hm-swm-sprint-touched-out`), and **Distance drops `touched-out`** (the
mile isn't won or lost at the touch — reroute → `hm-swm-dist-go-out-slow`). The
**plateau (#4) is authored in all four columns but WITHHELD from the picker
across all four** (§6), so: 40 grid slots − 4 plateau withholds − 2 drops = **34
selectable** of **38 distinct authored cells** (the two dropped cells reroute to
an existing authored cell, so they add no new clip).

### Sprinter (locus: over-tighten / muscle-the-water) — 9 cells
1. **Touched out** — the heaviest sprint cell: out front to the flags, beaten to the wall by a hundredth, "I had it and lost it on the finish." ★"I always die at the touch." ⚠
2. **False start** — the twitch on the blocks, gone before you swam a stroke, the most public erasure there is. ⚠
3. **DQ'd** — the relay take-off that DQ's all four, or a sprint-stroke violation; the swim that didn't count. ⚠
4. **Plateau** — the 50/100 that won't drop, the explosive event where everyone else found tenths; ★"my one gift stopped working." ⚠⚠ *(WITHHELD — see §6)*
5. **Blow a turn** — the one wall in a 100 botched, a slow breakout, the half-second a sprint can't afford to give back.
6. **Goggles fail** — goggles fill on the dive in a race measured in seconds; no time to fix it, race blind to the touch.
7. **Slow heat** — seeded in an early heat with no one beside you to chase, racing the clock alone in an empty-feeling pool. ★"if I were really fast I'd be in the fast heat."
8. **Nervous (ready room)** — the holding pen before the final, the body wired, "what if I miss the start." *(reframe: "react to the beep — you don't have to force it, just be clean.")*
9. **Go out too slow** — a flat start, behind at the 50 turn with almost no race left to climb back; "I left it on the blocks."
   *(Sprinter drops `mind-wanders` — there is no lonely middle in a 22-second race; that pressure reroutes to `touched-out`. See §5.)*

### Distance (locus: over-monitor / chase-the-pace-clock) — 9 cells
1. **False start** — rare for a distance swimmer but total when it happens: a whole mile of preparation gone on the blocks. ⚠
2. **DQ'd** — an illegal turn deep in the mile when the legs are gone, the swim that won't count after all that work. ⚠
3. **Plateau** — the mile time that won't move all season while the yardage climbs; the grind identity's nightmare; ★"I do all the work and it doesn't show." ⚠⚠ *(WITHHELD — see §6)*
4. **Blow a turn** — a botched flip at the 300 that kills the rhythm and the pace you'd settled into; the wall you take 33 times and miss once.
5. **Mind wanders mid-race** — the distance signature: focus drifts in the lonely middle, no teammate or ball to snap it back, and a length goes by you didn't swim with intent. ⚠
6. **Goggles fail** — goggles slip a third of the way into the mile; can't stop, swim the rest half-blind off the lane lines and the black line.
7. **Slow heat** — the distance event scheduled when teammates have raced four; alone in a slow heat, racing only the clock, the longest event in the loneliest slot.
8. **Nervous (ready room)** — the dread of the grind ahead, "I have to hold pace for sixteen hundred yards." *(reframe: "settle into the first 100 — trust the splits, the race comes to you.")*
9. **Go out too slow** — *(canonical reroute target — see §5)* — behind the pace at the first split, the climb against the clock over a long way; the distance swimmer's core adversity; ★"the time's already gone." ⚠
   *(Distance drops `touched-out` — the mile isn't won or lost by a hundredth at the wall; that pressure reroutes to `go-out-slow`. See §5.)*

### Stroke (locus: over-control / chase-the-feel) — 10 cells
1. **Touched out** — beaten to the wall in a stroke final, often at the flags on the timing of the last stroke; "my touch was off by a beat."
2. **False start** — the twitch on the blocks in your one event, the single-stroke identity erased before it raced. ⚠
3. **DQ'd** — the cell the Stroke specialist fears most: one-hand touch on fly or breast, a kick violation, an illegal turn — the rulebook erases the swim. ★"my own stroke got me disqualified." ⚠
4. **Plateau** — the stroke time stuck while specialists in other strokes drop; the narrow identity with no fallback; ★"if this stroke isn't there, I have nothing." ⚠⚠ *(WITHHELD — see §6)*
5. **Blow a turn** — a botched turn in your stroke (the breaststroke pullout timing, the backstroke flags-and-turn), the wall that's technical and unforgiving.
6. **Mind wanders mid-race** — focus drifts and the technique that needs attention goes ragged; "I stopped swimming it and started just moving."
7. **Goggles fail** — goggles fill on a dive or a flip; for backstroke, losing the flags and the count is its own specific blindness.
8. **Slow heat** — your one stroke seeded in a slow heat, no one to race, "the swim that's supposed to be me, alone against the clock."
9. **Nervous (ready room)** — the fragile-feel dread, "what if the stroke isn't there today" — feel can't be willed. *(reframe: "you don't need it perfect — long and loose, swim it simple.")*
10. **Go out too slow** — out too easy and the back half (fly especially) becomes survival; "I held back and the stroke fell apart at the end anyway."

### IM (locus: brace-for-the-weak-leg / pre-concede) — 10 cells
1. **Touched out** — beaten at the wall after racing all four, the free leg that didn't quite get there; "I built it the whole way and lost it at the touch."
2. **False start** — the longest, most complete event gone on the blocks before a single stroke. ⚠
3. **DQ'd** — a transition violation, an illegal turn between strokes, the medley-relay take-off; the four-stroke race erased on a technicality. ⚠
4. **Plateau** — the IM time stuck because the weak leg won't come; ★"I'm a jack of all strokes and master of none, and now not even that." ⚠⚠ *(WITHHELD — see §6)*
5. **Blow a turn** — a botched transition turn between strokes, the IM-specific wall where the stroke changes and the timing is its own skill.
6. **Mind wanders mid-race** — the focus slips during the leg you're best at and you don't set up the weak leg; "I coasted the back and paid for it on the breast."
7. **Goggles fail** — goggles go on the dive in a race with four turns and four breakouts to navigate half-blind.
8. **Slow heat** — the IM seeded slow, racing the clock alone, the event that proves versatility with no one beside you to prove it against.
9. **Nervous (ready room)** — the dread of the weak leg the whole heat can see, "what if the breaststroke split buries me again." *(reframe: "trust the weak leg — it's one quarter of the race, not the verdict.")*
10. **Go out too slow** — out flat on the fly and behind the whole way, no single stroke strong enough to bail you out; the all-rounder's specific climb.
    *(★"I'm best at nothing" — the pre-concede story — is the IM's signature false story to reject across the plateau and the weak-leg cells.)*

> **Relabel-risk note (sports-psych):** #9 ready-room nerves and #10 go-out-slow
> are most prone to one generic script across all four specialties. Keep them,
> but the script stage must author specialty-distinct (see the per-specialty
> reframe cues above). #5 blow-a-turn is the relabel risk in the *other*
> direction — the sprinter's one-wall-in-a-100, the distance flip at the 300, the
> Stroke pullout/flags turn, and the IM transition turn are technically different
> moments and must not be flattened. The plateau (#4) is the must-NOT-flatten,
> must-NOT-ship cell — it carries the §6 withhold across all four.

---

## 5. Slug scheme (multi-sport-safe) + fragment map + per-specialty drops/reroutes

Hockey = `session-{role}-{frag}`; basketball = `bb-{role}-{frag}`; baseball =
`bsb-{role}-{frag}`; golf = `glf-{role}-{frag}`; football = `ftb-{role}-{frag}`.
**Swimming owns its own prefix — `swm-` for the composite cell key, `hm-swm-` for
the hard-moment clip** (the same hm-/composite split baseball, golf, and football
use: `cellSlugFor` returns the `swm-*` composite key; the audio stage renders both
`hm-swm-{token}-{frag}` and the full `swm-{token}-{frag}` composite). Three-letter
`swm-` avoids any "swim"/"swimming" verb ambiguity and parallels
`bsb-`/`glf-`/`ftb-`. **Compositional-only** — like golf, swimming carries no
baked per-cell mono-clips; every cell resolves to a runtime-stitched composite.

**Specialty slug tokens** (the seeded short tokens, NOT lowercased role): `sprint`,
`dist`, `stroke`, `im`.

**Fragment map (`SWIMMING_ADVERSITY_SLUG_FRAGMENTS`):**

```
"I get touched out."                  → "touched-out"
"I false start."                      → "false-start"
"I get DQ'd."                         → "dq"
"I'm stuck on the same time."         → "plateau"
"I blow a turn."                      → "bad-turn"
"My mind wanders mid-race."           → "mind-wanders"
"My goggles fail."                    → "goggles"
"I'm seeded in a slow heat."          → "slow-heat"
"I feel nervous in the ready room."   → "ready-room"
"I go out too slow."                  → "go-out-slow"
```

**Per-specialty drops & key reroutes** (like football, swimming is NOT uniform —
two specialties genuinely don't have a cell, the pitcher-error precedent):

| Specialty | Drop / reroute | Mechanism |
|---|---|---|
| **Sprinter** | drops `mind-wanders` (no lonely middle in a 22-second race) → **reroute to `touched-out`** | `cellSlugFor` maps Sprinter × `mind-wanders` to the `touched-out` key so no orphan clip |
| **Distance** | drops `touched-out` (the mile isn't won or lost at the touch) → **reroute to `go-out-slow`** | `cellSlugFor` maps Distance × `touched-out` to the `go-out-slow` key so no orphan clip |

```ts
// Per-specialty reroute table (the pitcher-error precedent: a cell that does not
// exist for a specialty maps to that specialty's nearest canonical key, so no
// orphan clip and the integrity test stays parameterized).
const SWIMMING_KEY_REROUTES: Partial<Record<Role, Record<string, string>>> = {
  Sprinter: { "mind-wanders": "touched-out" }, // no lonely middle in a sprint
  Distance: { "touched-out": "go-out-slow" },  // the mile isn't won at the touch
};

cellSlugFor(adversity, role) {
  const frag = SWIMMING_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "go-out-slow";
  const token = SPECIALTY_TOKEN[role] ?? "sprint"; // sprint|dist|stroke|im
  const rerouted = SWIMMING_KEY_REROUTES[role]?.[frag] ?? frag;
  return `swm-${token}-${rerouted}`; // e.g. swm-sprint-touched-out for Sprinter × mind-wanders
}
```

**`roleAdversities` overrides (label-only relabels + the drops + the §6
withhold):**
- **Sprinter:** drop `mind-wanders` from the picker (rerouted to
  `swm-sprint-touched-out`; no selectable mind-wanders cell for the sprinter).
  **Withhold `plateau`** (§6).
- **Distance:** drop `touched-out` from the picker (rerouted to
  `swm-dist-go-out-slow`); relabel `go-out-slow` → "I go out off my pace" (the
  distance-true wording on the same key). **Withhold `plateau`** (§6).
- **Stroke:** relabel `dq` → "My stroke gets me DQ'd," `bad-turn` → "I blow the
  turn on my stroke" (Stroke-true wording on the same keys). **Withhold
  `plateau`** (§6).
- **IM:** relabel `bad-turn` → "I blow a transition turn." **Withhold `plateau`**
  (§6).

(All relabels keep `key` = the canonical adversity string so `cellSlugFor` +
`state.adversity` resolve the same `swm-*` cell — the same mechanism hockey /
baseball / golf / football use. Drops remove the entry from the `roleAdversities`
array; the reroute means the dropped key still resolves to a real authored clip.
The plateau withhold is the FV-119 / golf-first-tee / football-big-hit pattern:
drop the entry from the `roleAdversities` array across all four specialties; the
clip stays authored at `swm-{token}-plateau`.)

**Authored hard-moment grid — 38 cells (34 selectable):**
- `hm-swm-sprint-{touched-out, false-start, dq, plateau*, bad-turn, goggles, slow-heat, ready-room, go-out-slow}` = **9** (mind-wanders rerouted to touched-out)
- `hm-swm-dist-{false-start, dq, plateau*, bad-turn, mind-wanders, goggles, slow-heat, ready-room, go-out-slow}` = **9** (touched-out rerouted to go-out-slow)
- `hm-swm-stroke-{touched-out, false-start, dq, plateau*, bad-turn, mind-wanders, goggles, slow-heat, ready-room, go-out-slow}` = **10**
- `hm-swm-im-{touched-out, false-start, dq, plateau*, bad-turn, mind-wanders, goggles, slow-heat, ready-room, go-out-slow}` = **10**

`*` = `plateau` is authored for every specialty but **WITHHELD from the picker
across all four** until clinical-advisor sign-off (§6). The hard-moment clips are
`hm-swm-{token}-{frag}`; the composite playlist cells are `swm-{token}-{frag}`.
The parameterized integrity test asserts this 38-cell grid, the Sprinter/Distance
reroutes, the four `plateau` withholds, and the label-only `roleAdversities`
relabels.

---

## 6. Clinical gate (sports-psychologist) + the two swimming safety rails — for the reframe stage

**All 10 labels are normal competitive adversities, safe to ship as SITUATIONS
with reframes deferred — EXCEPT the plateau (#4), which is WITHHELD across all
four specialties.** The care lives in the *reframe*. As in golf and football, the
taxonomy is safe because it labels every cell **neutrally** (the situation),
never as a medical or catastrophic event, and keeps the global false story as a
*false story to reject*. These cells sit nearest contingent-self-worth /
rumination / performance-anxiety territory and their reframe **must be
sports-psychologist-authored, explicitly age-calibrated, and routed past the
credentialed advisor when seated.** *(The sports-psychologist is a drafter, not a
licensed clinician; this gate exists so credentialed sign-off is structurally
enforced, not remembered.)*

### ⚠⚠ HARD RAIL 1 — THE BREATH RAIL (standing, whole-track, NON-NEGOTIABLE)

**No breath-hold, hypoxic, or underwater breath language appears anywhere in the
swimming track — ever.** Swimmers are routinely assigned hypoxic sets by coaches,
and shallow-water blackout kills real swimmers every year; a breath cue a swimmer
can carry into the water is a real-world safety hazard, not a copy nit.
**Hard rules:**
1. **Every breath / reset cue is dry-land, behind-the-blocks, calm-down breathing
   only.** A long exhale on the pool deck before the heat is called — never "hold
   it longer," never an underwater distance, never lung-training framing, never
   anything that reads as a breath-hold challenge.
2. **The Sprinter's breakout VIZ scene is worded "Sharp breakouts" (a clean, fast
   surfacing), deliberately NOT "Underwaters strong" / "hold the dolphin kicks"** —
   the latter invites the swimmer to extend the underwater/breath-hold phase,
   which brushes the hypoxic line. This wording choice is a rail decision, not a
   stylistic one; do not "improve" it back toward underwater language.
3. **Audit every REUSED sport-neutral clip's breath lines before render.** The
   shared openers, reset-plan, prayer, and self-talk clips were authored for
   contact/field sports and may contain a "take a deep breath and hold it for a
   beat" line that is harmless for a hockey player and hazardous for a swimmer.
   The breath-line audit of every reused clip is a **required pre-render step**
   (the audio stage / FV-282), not optional.
4. Route any ambiguous breath wording to the sports-psychologist + the pending
   clinical advisor; do NOT let the swimming-expert hand-resolve it.

### ⚠⚠ HARD RAIL 2 — THE BODY-COMPOSITION / SUIT / WEIGHT RAIL (flag-and-route, NEVER a cell)

Swimming is a body-exposed, RED-S-adjacent sport. **There is NO `body-comp`,
`suit`, `weight`, or food/restriction cell, and no reframe may instruct, praise,
imply, or normalize a weight target, a suit-body comment, restriction, or
body-composition talk.** The football OL body-comp precedent applies directly. If
any swimming script drifts toward weight, the tech suit and bodies, "lean for
the taper," cutting, or food rules, it is **flagged and routed** to the
sports-psychologist + the crisis-resource path the kids-privacy-officer governs
(Option C) — it is never hand-authored as content. This is a standing guardrail
on the entire swimming track.

### ⚠⚠ HIGHEST CLINICAL GATE — the plateau (#4, all 4 specialties) — WITHHELD

The plateau ("I'm stuck on the same time") is swimming's `lose-command` /
`first-tee` / `big-hit` umbrella — the cell where the stakes outrun a
hand-authored reframe. The clock is the whole, public, numeric verdict, and a
season-long no-drop is the single deepest contingent-self-worth wound the sport
produces ("the work didn't count; *I* don't have it"). It sits nearest
persistent-hopelessness / rumination territory.
**Withholding mechanism (explicit, FV-119 / golf-first-tee / football-big-hit
precedent):** until the clinical advisor (CLAUDE.md Open Items) is seated, the
`plateau` cell is authored carefully but **WITHHELD from the selectable
adversities via `roleAdversities` omission across all four specialties.** The clip
stays authored at `swm-{token}-plateau` so the grid is complete and the integrity
test asserts the withhold; it is simply not offered to the athlete until a
credentialed advisor clears the reframe. The script must keep the "the work
didn't count / I don't have it" story as a *false story to reject*, must never
moralize the no-drop or imply effort is owed a result, and may offer only
identity-anchoring ("the clock can report a swim; it cannot name a swimmer")
plus a real-world prompt to work the plan with a coach. Route to
sports-psychologist + the pending clinical advisor; do NOT let the
swimming-expert hand-author the reframe.

### ⚠ HIGH — the erasure cells (ship, but the reframe is gated and must be sports-psychologist-authored + age-calibrated)

1. **Touched out (#1), Sprinter heaviest.** Beaten by a hundredth at the wall is
   contingent-self-worth at its sharpest — the swim was right there and the clock
   said no. The reframe must break ★"I always die at the touch" without erasing
   the loss.
2. **False start (#2) + DQ'd (#3), all specialties — the erasure cells.** These
   are the places swimming uniquely *erases* a swim: the twitch before the gun,
   the rulebook wiping the time. The DQ carries the relay letting-people-down
   line (a take-off DQ's all four). The reframe keeps it event-level and blocks
   ★"my own body / my own stroke disqualified me" from becoming an identity
   verdict — and, on the relay, ★"I cost the other three" must not curdle into a
   worth claim.
3. **Slow heat (#8) + go-out-slow (#10), all specialties.** The "if I were really
   fast I'd be in the fast heat" / "the time's already gone" stories are
   contingent-self-worth routed through the public seed. Ship, but gate the
   reframe.

*Slow-arc cell (not in the 10, flagged for daily-training):* **the plateau as a
season-long arc + the taper that didn't pay.** The withheld pregame plateau cell
(#4) has a slow-arc sibling: the stretch where the time won't move for months,
the index climbs nowhere, and the taper-doesn't-pay dread peaks. It is a
slow-arc trigger, not a between-events one, so it lives in daily-training with a
Locate → Reclaim → Re-enter shape, not the pregame reset — and it carries the
same clinical gate. Watch the line: "my time won't drop" is normal; if a script
tips toward *persistent hopelessness*, it is no longer hand-authorable (see
routing).

**Routing reminder (non-negotiable):** if any reframe drifts toward persistent
hopelessness, anhedonia beyond a normal post-meet week, self-harm-adjacent
content, disordered eating / body-image / weight obsession (RAIL 2), any
breath-hold / hypoxic framing (RAIL 1), or abuse (including from a coach or swim
parent), it does NOT get hand-authored — it routes to the crisis-resource path
the kids-privacy-officer governs (Option C): 988 Suicide & Crisis Lifeline,
Crisis Text Line (text HOME to 741741), and a "talk to a trusted adult" prompt.
We are not a clinical service; the plateau, the erasure cells, and any
body/breath drift are the most likely to brush this line, so they get the
tightest sports-psych guardrail and a credentialed read before ship.

---

## 7. Age calibration (one note for the script authors)

The 38 cells are one taxonomy; **register and stakes** shift across the band.
(Swimming structures change fast — **verify current details** before any cell
cites a mechanism: USA Swimming motivational standards (B → BB → A → AAA),
Futures / Junior Nationals / Winter Juniors cuts, NCAA recruiting rules, SCY vs
LCM season timing, and state high-school season structure all evolve.)

- **13–15 — age-group swimming, the standards ladder.** Concrete, low-jargon.
  Stakes are chasing motivational time standards (the first number that decides
  which meet you're allowed to enter), the first state cut, the 13-14 to 15-16
  age-up wall (racing older swimmers and "losing" your standards). Bind
  responsibility tightly ("your next race, your next length"). The **parent is
  often inside the meet** — timing, officiating, volunteering on deck — so the
  swim-parent dynamic is real here, and the parent is the buyer. The plateau is
  withheld at every age; at 13–15 lean hardest on the §6 guardrail and the
  dry-land breath rail. Do not import 16–18 recruiting framing.
- **16–18 — the cuts and the recruiting math (contingent-self-worth PEAK).** The
  danger band: sectionals → Futures → Junior Nationals / Winter Juniors as the
  ladder, high-school season layered on club (and the club-vs-HS loyalty
  tension), SwimCloud rankings and recruiting databases where the entire athletic
  identity is sortable times, college coaches recruiting on a spreadsheet, and
  the brutally public math of needing to drop X.X seconds by junior year. The
  plateau and go-out-slow cells land hardest here ("the season that didn't drop,
  with the recruiting clock running") — every identity-level cell needs its most
  careful *worth-is-not-on-the-heat-sheet* reframe here, and reframes must never
  add "you wasted the taper / the season" weight.
- **18–21 — college swimming and the ceiling questions (legal adults).** Autonomy
  and ownership: the equivalency-scholarship reality (swimming scholarships are
  sliced thin — most swim for partials or nothing), conference championships as
  the year's whole point, travel-squad and championship-roster cuts, the
  one-taper-a-year economy, and the Trials cut as the sport's lottery dream.
  Fully insider vocabulary is fine; do NOT use 18–21-only terms (the
  equivalency split, the championship roster, the Trials cut, the one-taper
  economy) in 13–15 content.

---

## 8. Downstream handoff & dependencies (all DORMANT pending KC go-live)

- **Clip scripts:** writes the 38 scripts from the §4 grid + 4 VIZ blocks + the
  §-Appendix practice-focus presets, through **content-curator + swimming-expert**
  (voice/authenticity + the two safety rails) and **sports-psychologist** (§6
  gated reframes + the plateau withhold) + **youth-pastor** (scripture). Apply the
  ★ must-fix tags and the §6 gate. Reuse the sport-neutral faith clips (openers,
  shared-opening, reset-plan, prayer, sendoff, cue words, self-talk) **only after
  the RAIL 1 breath-line audit** of each reused clip. The plateau reframe and the
  erasure-cell reframes are the must-route items.
- **Audio render (FV-282):** renders + masters the 38 clips (ash voice, OpenAI
  TTS, EQ/master, spectral QA); derives `MANIFEST_VERSION`. The RAIL 1 breath-line
  audit of every reused clip is a **required pre-render step**. **DORMANT** — no
  render until KC go-live + clinical sign-off.
- **Pre-practice "Lock In":** the swimming focus presets + opener + beats (see
  Appendix practice-focus candidates).
- **Daily training:** 30-day arc; the **plateau / the-taper-that-didn't-pay** (§6)
  is the swimming-distinct daily-training topic flagged for the content trio +
  youth-pastor, carrying the same clinical gate as the withheld pregame cell.
- **Enum:** adds `swimming` to the `Sport` union (`sport-registry.ts` /
  `lib/sports.ts`) + the DB sport CHECK constraint — only at go-live. Today
  swimming is intentionally **not** in `SUPPORTED_SPORTS`. (`PostgameModule.sport`
  is typed against the live `Sport` union, so the §-postgame drafts cannot be
  wired until this enum lands — see the postgame drafts doc.)
- **Routing / go-live:** swimming in the onboarding selector (`SUPPORTED_SPORTS`)
  + sport-aware content/pregame routing; populates `SWIMMING_CONFIG` in
  `sport-registry.ts` from §5 and the Appendix. **Gated on KC go-live.**
- **QA:** the parameterized integrity test asserts swimming's 38-cell grid + the
  Sprinter/Distance reroutes + the four `plateau` withholds + the label-only
  `roleAdversities` relabels.
- **Founder gate:** the launch-tier decision — **swimming stays DORMANT until
  audio render + clinical sign-off (the §6 plateau withhold + erasure-cell
  reframes + BOTH safety rails) + KC go-live**; logged here for the audit trail.

---

## 9. KC decision points — flagged for sign-off

1. **Specialties:** 4 — **Sprinter / Distance / Stroke / IM**, roleLabel **"Event"**
   (§1). Recommend confirm. Swimming compresses cleanly to four event identities;
   a fifth (a Mid-distance 200 specialist) is a flavor of two of these, and
   open-water (`ow`) is documented as a future fifth but recommended **OUT of v1**.
2. **Adversity model:** **Model (a)** — one shared 10-list + per-specialty scripts
   + label-only `roleAdversities` overrides + a small per-specialty key-reroute
   table (§3, §5). Recommend confirm; model (b) 4×s the surface and breaks the
   integrity test.
3. **Adversity count + drops:** **10** adversities, **38 authored cells (34
   selectable)** (Sprinter 9, Distance 9, Stroke 10, IM 10). The hard calls:
   Sprinter drops `mind-wanders` (reroute → `touched-out`, no lonely middle in a
   sprint); Distance drops `touched-out` (reroute → `go-out-slow`, the mile isn't
   won at the touch); plateau WITHHELD across all four. Recommend confirm.
4. **Slug prefix:** **`swm-`** composite / **`hm-swm-`** hard-moment, tokens
   `sprint`/`dist`/`stroke`/`im`, **compositional-only** (golf model) (§5).
   Recommend confirm (baseball owns `bsb-`, golf `glf-`, football `ftb-`,
   basketball `bb-`, hockey `session-`).
5. **Clinical gate (the withholds + the two rails):**
   - **Plateau (#4):** authored but **WITHHELD across all four specialties** via
     `roleAdversities` omission until clinical-advisor sign-off — the FV-119 /
     golf-first-tee / football-big-hit pattern (§6). Recommend confirm. This
     yields **34 selectable cells of 38 authored** until the advisor clears
     `plateau`.
   - **The erasure cells (touched-out / false-start / DQ):** ship as situations,
     reframes **clinically gated** (§6). Recommend confirm.
   - **RAIL 1 — the breath rail:** no breath-hold / hypoxic / underwater language
     ever; all breath cues dry-land; "Sharp breakouts" not "Underwaters strong";
     audit every reused clip's breath lines before render (§6). Recommend confirm.
   - **RAIL 2 — the body-comp rail:** no weight / suit / RED-S / food content
     ever a cell — flag-and-route, standing guardrail on the whole track (§6).
     Recommend confirm.
6. **DORMANT status:** the whole swimming track stays **DORMANT** pending audio
   render + clinical sign-off + KC go-live (§8). Recommend confirm — swimming is
   NOT in `SUPPORTED_SPORTS` and ships no content until KC flips the gate.

---

## Appendix — Registry picker candidates (for the script / pre-practice / go-live work)

Swimming-true analogs of the hockey/basketball/baseball/golf/football picker
lists, so the `SWIMMING_CONFIG` registry work has them ready. Final wording
confirmed by content-curator + swimming-expert at the script stage.

**Practice-focus presets (`practiceFocusOptions` → `pp-swimming-focus-*`):**
```
"Best average"               → "pp-swimming-focus-best-average"
"Hold my pace"               → "pp-swimming-focus-hold-my-pace"
"Streamline off every wall"  → "pp-swimming-focus-streamline-off-every-wall"
"Race-pace turns"            → "pp-swimming-focus-race-pace-turns"
"Finish every length"        → "pp-swimming-focus-finish-every-length"
"Sharp breakouts"            → "pp-swimming-focus-sharp-breakouts"  (⚠ RAIL 1 — NOT "Underwaters strong"; a clean, fast surface, never a breath-hold cue)
"One length at a time"       → "pp-swimming-focus-one-length-at-a-time"  (the between-lengths reset; the whole swimming mental game)
```
(7 presets, matching the other sports' count. **"Sharp breakouts" is the
RAIL-1 wording** — it deliberately replaces any "Underwaters strong" / "hold the
dolphin kicks" preset, which would invite extending the breath-hold phase.
"Best average" and "One length at a time" are the swimming-distinct ones — best
average is the practice-set discipline, and one-length-at-a-time encodes the
length-by-length reset.)

**Reset anchors (`anchors`):** "Long exhale", "Press thumb to palm", "Say cue
word" are shared/sport-neutral (⚠ "Long exhale" is the dry-land, deck-side
exhale — RAIL 1: never a held breath). Swimming-specific:
```
"Adjust the goggles"
"Shake out the arms"
"Step up, then settle"   (re-set behind the blocks)
```

**Self-talk (`selfTalkOptions`):** swap the sport-cadence line, keep the 6
sport-neutral.
```
"You're okay. Next race."          // (swimming cadence — replaces "Next shift/possession/at-bat/shot/play")
"Breathe. Do your job."            // (⚠ RAIL 1 — dry-land calm breath, never a breath-hold)
"Stay steady. Make the next play."
"You don't need to do too much."
"Compete, recover, go again."
"Your identity is secure. Race free."
"You are secure. Take the next faithful action."
```

**Needs (`needs`):** swap the one sport-specific need, keep the 9 shared.
```
"Confidence", "Calm", "Compete level", "Reset after mistakes",
"Physical courage",                 // (weaker native fit in a non-contact sport — flagged like golf; see note)
"Better race execution"             // ← swimming swap (hockey "Better puck decisions")
"Leadership", "Joy", "Hope", "Be more Vocal"
```
> **Flag for KC/content-curator at the script/registry stage:** "Physical
> courage" and "Be more Vocal" are weaker fits in a non-contact, individual sport
> (the golf precedent). Options: keep as-is for cross-sport `NeedToday`-union
> stability, or swap "Physical courage" → "Mental toughness" and "Be more Vocal"
> → "Trust my race." The `NeedToday` union is a hot type — recommend keeping it
> stable for now and revisiting at go-live. **The swimming swap is "Better race
> execution"** (the start/turn/pace/finish discipline), replacing hockey's
> "Better puck decisions."

**`cueWordHelper`:** `"The one you'd say to yourself behind the blocks."`
(Swimming's reset window is behind the blocks waiting for your heat — the cue
word lives there, not "between shifts"/"at the line"/"on the walk to the next
shot"/"walking back to the huddle".)

**`cardShareHint`:** `"Screenshot it. Open it before they call your heat."`

**Practice openers (`practiceOpenerSlugs`):** `"dialed-in"` reuses the
sport-neutral `pp-opener-dialed-in`; `"not-feeling-it"` → `pp-swimming-opener-get-to`
(authored at the pre-practice stage).

**`audioScript`:** the swimming text-mode script mirrors the
basketball/baseball/golf/football segment structure (segments 0/35/210/250/275
sport-neutral; 80/120/165 swimming-specific — "see the race / first start off the
blocks / race your event"). **All breath segments are dry-land, deck-side calm
breathing (RAIL 1).** Until rendered, `SWIMMING_CONFIG` can satisfy the type with
the shared `AUDIO_SCRIPT` placeholder, exactly as `BASEBALL_CONFIG` does today.

---

### Files referenced
- `docs/baseball-taxonomy-FV-93.md` — structural template (mirrored sections 1-9).
- `docs/golf-module-map.md` — non-positional precedent (event-specialty maps onto
  the role dimension exactly as golf's player-profile does).
- `docs/football-module-map.md` — most recent same-format precedent + the
  conditional-withhold / flag-and-route safety-rail patterns (mirrored shape).
- `.claude/agents/swimming-expert.md` — swimming domain knowledge source + the
  two hard safety rails (breath, body-comp).
- `apps/web/components/pregame/sport-registry.ts` — the `SportConfig` shape the
  go-live work populates `SWIMMING_CONFIG` onto from §5 and the Appendix.
- `apps/web/lib/sports.ts` — the `SUPPORTED_SPORTS` / `Sport` union swimming joins
  only at go-live (today: NOT a member; swimming is DORMANT).
- `apps/web/lib/postgame/modules.ts` — where the 5 "For the Ride Home" postgame
  drafts (see `docs/swimming-postgame-drafts.md`) get wired at go-live, once
  `Sport` includes `swimming`.
- `CLAUDE.md` — audience-language rules (athlete/swimmer/you, never "kid") + brand
  spine.
- `docs/brand.md` — voice modes, words to use/avoid.
