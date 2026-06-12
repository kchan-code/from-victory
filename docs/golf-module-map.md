# Golf Taxonomy — Player Profiles × Adversities (FV-264)

**Status: RATIFIED-CANDIDATE — pending KC sign-off (kc-gate).**
Authored 2026-06-12. Golf is a **v2 / post-MVP** sport (launch is locked
hockey + basketball, FV-26). KC's 2026-06-12 directive moved golf toward a
**go-live** target (overriding the FV-272 hold), but this document is the
contract the build consumes regardless of launch timing — it defines the
taxonomy (player profiles, adversities, the matrix, slug scheme, vocabulary,
clinical gate, age fit) that FV-265 (clip scripts) and FV-266 (audio render)
depend on. Non-goals: the scripts and the audio themselves.

Mirrors the engine shape — **N profiles × M adversities = N×M hard-moment
cells** — exactly as baseball does (Pitcher/Catcher/Infield/Outfield) and
hockey/basketball before it. Golf is **non-positional**: the engine's
"position" dimension maps to **player profile**. Same discipline as the
baseball doc: a profile's problems are specific — the Bomber's two-way miss
off the tee ≠ the Scrambler's "the magic's gone" day, and you do not reuse one
for the other.

**Authored by the trio under lead orchestration:**
- **golf-expert** — game authenticity (player profiles, VIZ cues, the adversity
  list, the per-profile manifestations, slug scheme, vocabulary, age fit).
- **sports-psychologist** — per-profile psychological distinctness (the
  collapse-reflex column, §1) and the clinical gate on downstream reframes
  (§6). The shank and putting-yips content routes to the sports-psychologist,
  not the golf-expert.
- **product-strategist** — scope. Golf runs **3 profiles**, like
  hockey/basketball, because golf compresses cleanly to three (§1) and a fourth
  profile would be a flavor of one of these, not a new VIZ block.

**KC decision points (open — §9):** profiles (3 — Bomber/Ball-Striker/
Scrambler), the shared-adversity model (model a), the adversity count + the
integrity-cell IN/OUT call, the `glf-`/`hm-glf-` slug prefix, and the clinical
withholds (the first-tee / shank + putting-yips umbrella).

---

## 1. Player profiles (3 — golf is non-positional) — CANDIDATE

`Role = "Bomber" | "BallStriker" | "Scrambler"`

Golf has no positions. The meaningful split is **how you score** — which part
of the bag carries your game and, when it fails, which collapse reflex you
reach for. These three are not skill tiers (a scratch player can be any of
them); they are **identities**, which is exactly what the engine's role
dimension wants. A profile's adversity set, its first-rep VIZ, and its collapse
reflex are non-interchangeable: you cannot rehearse "the tee shot, alone, big
stick in hand" and "the up-and-down to save the round" in one VIZ block.

The **collapse reflex** is the false move the profile reaches for under
pressure — identity-protection dressed as strategy. FV-265 reframes reject it;
the VIZ (§2) pre-loads the antidote. (sports-psychologist mechanism in the
right column.)

| Profile | Covers | Identity fuses to | Collapse reflex (the mechanism) |
|---|---|---|---|
| **Bomber** | driver-led, distance-first — lives on the tee shot and the wedge in | *distance is who I am; the big drive is my edge* | **over-swing / ego-protection** — after a miss the answer is *"hit driver harder,"* chasing the lost yards instead of the smart club. Contingent self-worth is welded to clubhead speed, so backing off the big stick feels like admitting you're not *you* — the over-swing is identity defense, not strategy. Turns one bad swing into a card-wrecker (hero-ball). |
| **Ball-Striker** | irons, fairways-and-greens; control and proximity | *I control the ball; flushed contact is the proof* | **perfectionism / injustice rumination** — *"I hit 16 greens and shot 75 — I got robbed."* One loose swing or a cold putter contaminates the whole round because the standard is flawless ball-striking, not a number. The score is read as a verdict on the swing, and the gap between "I struck it great" and the card becomes a grievance that pulls focus off the next shot. |
| **Scrambler** | short game + putting; survives on saves and feel | *I always find a way; I get it up and down* | **feel-dependence / exposure anxiety** — *"the magic's gone, I've got nothing today."* Confidence lives entirely in *how it feels* and evaporates when the saves stop dropping. On a long course that exposes the ball-striking they don't trust, the fear of *being found out* ("at the next level everyone can chip") amplifies tension exactly when touch is needed most. |

Every golfer, whatever the profile, plays **the whole course and signs the same
card** — that's the universal adversity layer (§3: the three-putt, the
first-tee nerves, the blow-up hole), not a fourth profile.

> **Why 3, not more (the scope math).** Each added profile = +1 VIZ block + a
> full adversity column + that many renders + broken integrity-test parity.
> - **Split the Bomber into "tour-length" vs "long-and-wild"? (no).** That's
>   the *same* VIZ (the tee, the big stick, the two-way miss) at two skill
>   levels — register, not a new block. The wildness flavor lives inside
>   Bomber × "OB / the big miss."
> - **Add a "Grinder / course-manager" profile? (no).** Course management is a
>   *skill every profile needs*, not an identity that owns a tee shot. A pure
>   manager is a Ball-Striker who putts well — the overlap of two existing
>   profiles, not a fourth.
> - **Add a "Putter" profile? (no).** Putting is folded into the Scrambler
>   (short game + putting are one feel-based identity) and surfaces for every
>   profile in the shared three-putt cell (§3).
> Everything finer than these 3 is per-cell script nuance (FV-265).

---

## 2. ROLE_CONTENT (courage/identity title + 5 present-tense VIZ scenes)

The analog of hockey/baseball `ROLE_CONTENT`. Concrete, present-tense,
said-out-loud-able, profile-true. These are the athlete's **first-rep
rehearsal** — the good imagery, not the adversity.

```ts
Bomber: {
  title: "Step up and trust it.",
  scenes: ["Pick your line.", "Commit to the number.", "Free, full release.",
           "Take your medicine when you miss.", "Next tee, next swing."],
},
BallStriker: {
  title: "Flush it, hole to hole.",
  scenes: ["Pick a small target.", "One smooth swing.", "Hit your number.",
           "Stripe it, walk, repeat.", "Loose swing, let it go."],
},
Scrambler: {
  title: "Always a way to par.",
  scenes: ["See the shot, feel the shot.", "Soft hands, good speed.",
           "Get it up and down.", "Roll the next one pure.", "Grind out the number."],
},
```

Bomber cues = commitment / free release / discipline after the miss ("take your
medicine," "next tee"); Ball-Striker = small target / repeatable swing / let go
of the loose one; Scrambler = feel + speed + the save + the next putt ("grind
out the number"). The Bomber's "take your medicine when you miss" and the
Ball-Striker's "loose swing, let it go" are **pre-loaded reset cues** — the VIZ
names each profile's collapse reflex so the rehearsal builds the antidote in.

---

## 3. The shared adversity labels (first-person, golf voice) — 10 cells

Same first-person voice as hockey/basketball/baseball. Slot-for-slot this
preserves the engine's adversity *categories* so the `need × profile ×
adversity` resolution shape is identical to every other sport — only the
strings + fragments change. Golf balances the **universal scoring layer**
(everyone three-putts, everyone stands on the first tee) against the
**profile-specific failure shapes**.

**Count: 10** (matches hockey/basketball/baseball, keeps integrity-test
parity). Golf has more candidate adversities than slots, so the discipline is
in what gets **folded**.

```ts
ADVERSITIES = [
  "I three-putt.",                       // 1  the three-jack / lip-out — universal putting
  "I have a blow-up hole.",              // 2  the double/triple/snowman that rides in your pocket ⚠
  "I hit it OB.",                        // 3  the big miss + stroke-and-distance re-tee — compounding starts here ⚠
  "I duff a short-game shot.",           // 4  chunked/bladed chip or pitch, short-sided
  "I miss a short putt.",                // 5  the four-footer you're "supposed" to make
  "My swing leaves me on the first tee.",// 6  range-to-first-tee gap, in front of strangers ⚠⚠ (see §6)
  "I get outplayed in my group.",        // 7  partner outdrives/outscores you all day
  "I feel nervous.",                     // 8  pre-round / on-the-tee arousal (shared)
  "I start slow.",                       // 9  bogey-bogey out of the gate, cold early (shared)
  "I fall behind the number.",           // 10 behind your target / the cut line, no clock to save you
];
```

**Adversity label notes:**
- **#6 "My swing leaves me on the first tee"** is golf's signature
  practice-to-play gap **and** is the cell that, on its worst day, brushes the
  **shank / the putting yips** motor-anxiety line. It ships as the ordinary
  first-tee/range-vanishes situation, but its reframe is **clinically gated**
  and the deliberate "shank"/"yips" naming is **withheld** (§6). It is the golf
  analog of baseball's `lose-command` (throwing-yips) umbrella.

**What got folded (not standalone cells):**
- **The snowman (8) / triple** lives inside **blow-up hole (#2)** as an
  intensifier ("you walked off that hole with a snowman on the card"), not its
  own cell.
- **The penalty-area drop / fat-into-water** is a *reading of* OB (#3) — the
  big-miss-into-trouble cell covers it; the script flavors penalty area vs. OB
  per round.
- **Three-jacking from long range** vs. **missing the four-footer** split
  across #1 (the lag/speed three-putt) and #5 (the short one you "should"
  make) — distinct emotional shapes, kept separate.
- **The cold-putter day ("hit 16 greens, shot 75")** is a *profile reading* of
  #1 and #10 for the Ball-Striker (§4), not a separate cell.
- **Self-officiating / the penalty you call on yourself** — the heaviest
  brand-spine fit — is folded into the blow-up hole (#2) and the number (#10)
  as the **integrity-under-pressure layer** the FV-265 script surfaces, NOT a
  standalone selectable cell. See §9 #6 for the full reasoning, the
  sports-psych guardrails, and the recommendation.

> **Model (a), recommended (like baseball §3):** one shared 10-list + per-profile
> scripts + label-only `roleAdversities` overrides. Do NOT author 3 disjoint
> 10-lists (model b) — it triples the surface and breaks the parameterized
> integrity test (FV-271). A three-putt is a three-putt; OB is OB. The Bomber's
> three-putt and the Scrambler's three-putt are the *same situation* read
> through different identities (the Scrambler three-putting is "my one edge
> betrayed me," the Bomber three-putting is "I bombed it 40 yards past him and
> gave it all back on the green") — that distinction is a per-profile **script**,
> not a separate cell. The goalie-pulled / Big-fouled-out / pitcher-pulled
> precedents prove shared-label / per-profile-script is right.

---

## 4. The 3×10 grid — per-profile manifestation

One line per cell: how that adversity hits THAT profile, so FV-265 writes
distinct, profile-true scripts. ⚠ = clinical gate on the reframe (§6).
⚠⚠ = shank / putting-yips motor-anxiety territory (highest gate; deliberate
naming withheld pending clinical sign-off). ★ = identity-level phrase FV-265
must render as a *false story to reject*, never as the label.

All three profiles ship all 10 cells (golf has no thin-cell drop analogous to
pitcher-error; every profile plays every hole and signs the card). The
personalization is entirely in the manifestation.

### Bomber (locus: over-swing / hero-ball) — 10 cells
1. **Three-putt** — bombed it close, two-putt territory, and gave the stroke back on the green; "all that work off the tee for nothing."
2. **Blow-up hole** — the par-5 you went for in two, found the hazard, walked off with a 7; the greed cost; ★"I always blow up the big hole." ⚠
3. **OB / the big miss** — the two-way miss shows up under pressure, snap-hook or block OB, the re-tee, stroke-and-distance; the spiral of swinging harder to "make it back." ⚠
4. **Duff a short-game shot** — the part of the game he trusts least; left short-sided after the miss, chunks the chip; "I have no hands when it matters."
5. **Miss a short putt** — the four-footer after a hole he should've birdied; "I do the hard part and miss the easy one."
6. **Swing leaves me on the first tee** — the range bomb that becomes a cold-top or a wipe-OB in front of the group; the big stick is the scariest club to be lost with. ⚠⚠ *(see §6)*
7. **Outplayed in my group** — someone matches his length AND keeps it in play; his one edge neutralized; ★"if I'm not longer, what am I?"
8. **Nervous** — first tee with driver, people watching, "what if I hit the big miss right here." *(Bomber reframe: "don't kill it, just start it on line.")*
9. **Start slow** — bogey-double start chasing the perfect tee shot early; "settle the driver before it buries me."
10. **Fall behind the number** — behind his score, reaches for driver and the hero line on every hole to claw it back single-handedly; the exact opposite of what the moment needs.

### Ball-Striker (locus: over-control / perfectionism) — 10 cells
1. **Three-putt** — the cold-putter tax: striped it to 20 feet, three-jacked it; ★"I hit 16 greens and shot 75." ⚠
2. **Blow-up hole** — one loose swing into trouble snowballs because he won't accept bogey and forces the recovery; ★"one bad swing and the whole round's gone."
3. **OB / the big miss** — the rare wild one feels like a system failure, not a miss; "that's not who I am, I don't hit it there."
4. **Duff a short-game shot** — proximity is his game, so a missed green leaves a shot he resents needing; "I shouldn't even be down here."
5. **Miss a short putt** — flushed it to four feet and the putter gave it back; the proximity earned nothing; "what's the point of striping it."
6. **Swing leaves me on the first tee** — the repeatable swing he lives on is the thing that vanishes; "if I can't trust the swing, I have nothing." ⚠⚠ *(see §6)*
7. **Outplayed in my group** — loses to a scrambler who hit it everywhere and got up and down all day; the quiet resentment; ★"I'm the better player and I lost." ⚠
8. **Nervous** — fear of the ONE loose swing, "I just can't make a mistake today." *(reframe: "one good number, let the swing be the swing.")*
9. **Start slow** — one early loose iron and the perfectionism alarm goes off for the whole front nine.
10. **Fall behind the number** — tightens, aims at flags he should play away from, lets precision curdle into pressing; "I have to get it all back with my irons."

### Scrambler (locus: feel-dependence / exposure anxiety) — 10 cells
1. **Three-putt** — putting is supposed to be the *strength*; a three-jack is the floor falling out; ★"if I can't putt, I've got nothing." ⚠
2. **Blow-up hole** — usually the one who escapes with bogey; the day the recovery doesn't come and a triple lands; "I always find a way — except I didn't."
3. **OB / the big miss** — exposed off the tee, the part he doesn't trust, on a long course that demands it; "I can't scramble from out of bounds."
4. **Duff a short-game shot** — the worst one: the save fails at the thing that *is* his identity; ★"the up-and-down is the one thing I do." ⚠
5. **Miss a short putt** — his bread and butter lips out; "those are the ones I make in my sleep — what's happening."
6. **Swing leaves me on the first tee** — less the full swing, more the touch-and-feel vanishing; the soft hands go cold. ⚠⚠ *(see §6)*
7. **Outplayed in my group** — out-struck all day by a ball-striker, surviving on saves, "playing defense the whole round," waiting to get found out.
8. **Nervous** — "what if the feel isn't there today" — the scrambler's specific dread, because feel can't be willed. *(reframe: "you don't need it perfect — you need it in play, you'll save the rest.")*
9. **Start slow** — the saves don't drop early and the whole identity wobbles; "I need one to fall to feel like myself."
10. **Fall behind the number** — the long-course / next-level fear: behind the number on a track that won't let him scramble, "what if I'm found out here."

> **Relabel-risk note (sports-psych):** #8 nervous, #9 start slow, #10
> fall-behind are most prone to one generic script across profiles. Keep them,
> but FV-265 must author profile-distinct (see the per-profile reframe cues
> above). #6 (first-tee/swing-vanishes) is the relabel risk in the *other*
> direction — it must NOT be flattened into generic nerves; it is the
> practice-to-play gap and carries the §6 motor-anxiety gate.

---

## 5. Slug scheme (multi-sport-safe) + fragment map + special cases

Hockey = `session-{role}-{frag}`; basketball = `bb-{role}-{frag}`; baseball =
`bsb-{role}-{frag}`. **Golf owns its own prefix — `glf-` for the composite cell
key, `hm-glf-` for the hard-moment clip** (the same hm-/composite split baseball
uses: `cellSlugFor` returns the `glf-*` composite key; FV-266 renders both
`hm-glf-{profile}-{frag}` and the full `glf-{profile}-{frag}` composite).
Three-letter `glf-` avoids any "golf"/"ball" ambiguity; `gf-`/`g-` were rejected
as too terse.

**Profile slug tokens** (lowercased role): `bomber`, `ballstriker`, `scrambler`.

**Fragment map (`GOLF_ADVERSITY_SLUG_FRAGMENTS`):**

```
"I three-putt."                        → "three-putt"
"I have a blow-up hole."               → "blow-up"
"I hit it OB."                         → "ob"
"I duff a short-game shot."            → "duff-chip"
"I miss a short putt."                 → "short-putt"
"My swing leaves me on the first tee." → "first-tee"
"I get outplayed in my group."         → "outplayed"
"I feel nervous."                      → "nervous"
"I start slow."                        → "start-slow"
"I fall behind the number."            → "fall-behind"
```

**Profile-specific special cases:** golf needs **no canonical-key reroute** —
every profile plays every hole, so unlike a pitcher (who doesn't field errors)
or a Big (who fouls out instead of being benched), there is no cell that
doesn't exist for a profile. All special-casing is **label-only** via
`roleAdversities`, mapped to the same `key` so the same clip resolves.

```ts
cellSlugFor(adversity, role) {
  const frag = GOLF_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "three-putt";
  const roleStr = role ? role.toLowerCase() : "bomber";
  return `glf-${roleStr}-${frag}`;   // no key reroutes — golf is uniform per profile
}
```

**`roleAdversities` overrides (label-only + the §6 withhold):**
- **Bomber:** relabel `outplayed` → "Someone outdrives me," `ob` → "I hit the
  big miss" (Bomber-true wording over the same `ob` key). **Withhold `first-tee`
  from the picker until clinical sign-off** (§6).
- **Ball-Striker:** relabel `three-putt` → "I three-putt a green I striped,"
  `outplayed` → "A scrambler beats me." **Withhold `first-tee` until sign-off**
  (§6).
- **Scrambler:** relabel `duff-chip` → "I miss the up-and-down," `outplayed` →
  "I get out-struck all day." **Withhold `first-tee` until sign-off** (§6).

(All relabels keep `key` = the canonical adversity string so `cellSlugFor` +
`state.adversity` resolve the same `glf-*` cell — the FV-101 mechanism
hockey/baseball use. The withhold is the FV-119 pattern: drop the entry from the
`roleAdversities` array; the clip stays authored at `glf-{profile}-first-tee`.)

**Full slug grid (30 cells authored; 27 selectable until sign-off):**
`glf-bomber-{three-putt, blow-up, ob, duff-chip, short-putt, first-tee*, outplayed, nervous, start-slow, fall-behind}` (10) ·
`glf-ballstriker-{three-putt, blow-up, ob, duff-chip, short-putt, first-tee*, outplayed, nervous, start-slow, fall-behind}` (10) ·
`glf-scrambler-{three-putt, blow-up, ob, duff-chip, short-putt, first-tee*, outplayed, nervous, start-slow, fall-behind}` (10).
`*` = authored but withheld from the picker pending clinical sign-off (§6).

The hard-moment clips are `hm-glf-{profile}-{frag}` (30); the composite playlist
cells are `glf-{profile}-{frag}` (30). The parameterized integrity test (FV-271)
asserts this 30-slug grid and the three `first-tee` withholds.

---

## 6. Clinical gate (sports-psychologist) — for the FV-265 reframe stage

**All 10 labels are normal competitive adversities, safe to ship as SITUATIONS
with reframes deferred.** The care lives in the *reframe* (FV-265). As in
baseball, the taxonomy is safe because it labels every cell **neutrally** (the
situation), never "the shank" or "the yips," and keeps the motor-failure story
as a *false story to reject*. These cells sit nearest motor-anxiety / rumination
/ contingent-self-worth / performance-anxiety territory and their reframe **must
be sports-psychologist-authored, explicitly age-calibrated, and routed past the
credentialed advisor when seated.** *(The sports-psychologist is a drafter, not
a licensed clinician; this gate exists so that credentialed sign-off is
structurally enforced, not remembered.)*

**⚠⚠ HIGHEST — the shank + the putting yips (route; do NOT glibly
hand-author):**
1. **`first-tee` (all 3 profiles) — the swing / feel that leaves you.** This is
   golf's `lose-command` umbrella, the motor-psychology line where the
   involuntary movement *is* the affliction. On its ordinary day it is the
   practice-to-play gap (the range swing that vanishes in front of strangers)
   and ships as that. On its worst day it brushes:
   - **The shank** — the ball squirts dead right off the hosel; the terror is
     that it's contagious and inexplicable, and golfers are so superstitious
     they will not say the word aloud. Lands heaviest on the **Ball-Striker**
     (whose identity is contact) and the **Scrambler** (the chunked/shanked chip
     under pressure).
   - **The putting yips** — the involuntary stroke / flinch / freeze on a putt
     made ten thousand times. The **Scrambler** most acutely (putting is
     identity), feared across all three.

   **Withholding mechanism (explicit, FV-119 / baseball precedent):** until the
   clinical advisor (CLAUDE.md Open Items) is seated, the `first-tee` cell is
   authored carefully but **WITHHELD from the selectable adversities via
   `roleAdversities` omission** across all three profiles. The clip stays
   authored at `glf-{profile}-first-tee` so the grid is complete and the
   integrity test (FV-271) asserts the withhold; it is simply not offered to the
   athlete until a credentialed advisor clears the reframe. The script must
   **never deliberately name "the shank" or "the yips,"** must keep the
   motor-failure story as a *false story to reject*, and may offer only
   identity-anchoring ("this is happening *to* your hands; it is not a verdict
   on you") plus a real-world prompt to work the mechanics with a coach/teacher.
   Route to sports-psychologist + the pending clinical advisor; do NOT let the
   golf-expert hand-author the reframe.

**⚠ HIGH — global-verdict / identity-level risk (ship, but the reframe is
gated and must be sports-psychologist-authored + age-calibrated):**
2. **Blow-up hole (#2), all profiles** — the snowman that rides in your pocket
   for the next fifteen holes; the compounding spiral (the angry hero shot
   through the trees) is exactly contingent-self-worth + rumination. Golf's
   signature compounding cell and the single best fit for the
   compete-from-victory message. The reframe's whole job is to **break the
   compound** — stop the cascade, not erase the hole ("the triple is on the
   card; it is not on you. The next tee is a new shot.").
3. **Scrambler × three-putt + Scrambler × duff-chip** — identity-collapse cells:
   the one thing he *is* failing at ("if I can't putt / get it up and down, I've
   got nothing"). Heaviest-use Scrambler cells; the global "I've got nothing
   underneath" story is the risk, not the missed putt.
4. **Ball-Striker × three-putt + Ball-Striker × outplayed** — the "I hit 16
   greens and shot 75" / "I'm the better player and I lost" story;
   contingent-self-worth routed through "I did everything right and it didn't
   count."
5. **OB / the big miss (#3), all profiles** — the spiral after the re-tee
   (swinging harder to make it back) is the compounding mechanism; the
   heaviest-use Bomber cell.

   *Slow-arc cell (not in the 10, flagged for daily-training):* **the slump —
   "I've lost my game."** The stretch where the swing won't come back, the index
   climbs, and the feel is gone for weeks. Golf's signature rumination /
   contingent-self-worth fit. It is a slow-arc trigger, not a between-shots one,
   so it lives in **daily-training** (FV-268) with a Locate → Reclaim → Re-enter
   shape, not the pregame reset. Watch the line: "I've lost my game" is normal;
   if a script tips toward *persistent hopelessness*, it is no longer
   hand-authorable (see routing).

**Common thread:** the risk is never the *event* (everyone three-putts,
everyone snowmans a hole) — it's the *global, stable, identity-level* false
story golf is uniquely engineered to whisper, because the number is kept by
you, the round is four hours alone with your own card, and there's no teammate
to share the loss with. The taxonomy keeps those as false stories *to be
rejected*; the gate exists so FV-265 actually rejects them.

**Routing reminder (non-negotiable):** if any reframe drifts toward persistent
hopelessness, anhedonia beyond a normal post-round week, self-harm-adjacent
content, disordered eating / body-image obsession, or abuse (including from a
coach or golf parent), it does NOT get hand-authored — it routes to the
crisis-resource path the kids-privacy-officer governs (Option C): 988 Suicide &
Crisis Lifeline, Crisis Text Line (text HOME to 741741), and a "talk to a
trusted adult" prompt. We are not a clinical service; the blow-up, slump, and
recruiting-number cells are the most likely to brush this line, so their scripts
get the tightest sports-psych guardrail and a credentialed read before ship.

---

## 7. Age calibration (one note for the FV-265 authors)

The 30 cells are one taxonomy; **register and stakes** shift across the band.
(Junior-golf structures change fast — **verify current details** before any cell
cites a mechanism: AJGA performance stars, Junior Golf Scoreboard vs. WAGR
weighting, PGA Tour University rules, state high-school season timing.)

- **13–15 — local junior golf, the first real card.** Concrete, low-jargon.
  Stakes are breaking 80 (then 75), the first stroke-play event with strangers,
  a rules official, a card to sign, the first handicap index. Bind
  responsibility tightly ("your next shot, your next hole"). The **parent is
  often on the course** (caddying or walking just off the fairway), so the
  shot-by-shot parent dynamic is real here and nowhere else — and the parent is
  the buyer. The `first-tee` cell: "the swing felt strange on the first tee,"
  never a label; lean hardest on the sports-psych guardrail. Do not import
  16-18 recruiting framing.
- **16–18 — AJGA + the recruiting grind (contingent-self-worth PEAK).** The
  danger band: high-school golf (a TEAM wrapper around an individual game —
  qualifying for the five, counting scores for the team), AJGA and major
  regional tours, the scoring-differential math coaches read, Junior Golf
  Scoreboard / ranking pages refreshed too often, recruiting camps and the
  silence after them, the expense guilt (entries, travel, the coach). The index
  becomes a public name tag the way UTR is in tennis. The
  `fall-behind-the-number` and `blow-up` cells land hardest ("signing for a
  number that ends the recruiting weekend") — every identity-level cell needs
  its most careful *worth-is-not-on-the-card* reframe here, and reframes must
  never add "you wasted their money" weight.
- **18–21 — college + the am/pro fork (legal adults).** Autonomy and ownership:
  the defining grind is **weekly qualifying for the travel five** — your own
  teammates are the field, and sitting home from the tournament is golf's
  healthy scratch. Lineup politics, counting scores, a coach with opinions about
  your swing. Beyond it: the state am / US Am amateur path, PGA Tour University,
  Q-school, and the mini-tour economics that are brutally honest (entry fees vs.
  purses — you pay to find out). Fully insider vocabulary is fine; do NOT use
  18–21-only terms (the travel five, Q-school, PGA Tour U, the mini-tours) in
  13–15 content.

---

## 8. Downstream handoff & dependencies

- **FV-265 (clip scripts):** writes the 30 scripts from the §4 grid + 3 VIZ
  blocks + the §-Appendix practice-focus presets, through **content-curator +
  golf-expert** (voice/authenticity) and **sports-psychologist** (§6 gated
  reframes) + **youth-pastor** (scripture). Apply the ★ must-fix tags and the §6
  gate. Reuse the sport-neutral faith clips (openers, shared-opening, reset-plan,
  prayer, sendoff, cue words, self-talk). The `first-tee` reframe (shank/yips
  line) is the must-route cell.
- **FV-266 (audio):** renders + masters the clips (ash voice, OpenAI TTS,
  EQ/master, spectral QA); derives `MANIFEST_VERSION`.
- **FV-267 (pre-practice "Lock In"):** the golf focus presets + opener + beats
  (see Appendix practice-focus candidates).
- **FV-268 (daily training):** 30-day arc; the **slump** (§6) and the
  **self-officiating / integrity** session (§9 #6) are the two golf-distinct
  daily-training topics flagged for the content trio + youth-pastor.
- **FV-269 (enum):** adds `golf` to the `Sport` union (`sport-registry.ts`) +
  the DB sport CHECK constraint.
- **FV-270 (routing / go-live):** golf in the onboarding selector
  (`SUPPORTED_SPORTS`) + sport-aware content/pregame routing; populates
  `GOLF_CONFIG` in `sport-registry.ts` from §5 and the Appendix.
- **FV-271 (QA):** the parameterized integrity test asserts golf's 30-cell grid
  + the three `first-tee` withholds + the label-only `roleAdversities` relabels.
- **FV-272 (gate):** founder + product-strategist launch-tier decision —
  **overridden by KC's 2026-06-12 go-live directive** for this campaign; logged
  here for the audit trail.

---

## 9. KC decision points — flagged for sign-off

1. **Profiles:** 3 — **Bomber / Ball-Striker / Scrambler** (§1). Recommend
   confirm. Golf compresses cleanly to three identities; a fourth
   (Grinder/Putter) is a flavor of one of these, not a new VIZ block.
2. **Adversity model:** **Model (a)** — one shared 10-list + per-profile scripts
   + label-only `roleAdversities` overrides (§3). Recommend confirm; model (b)
   triples the surface and breaks the integrity test.
3. **Adversity count:** **10** (§3), matching the other three sports and the
   integrity-test shape. The hard call was what to fold (snowman → blow-up;
   penalty drop → OB; cold-putter day → a profile reading of three-putt).
   Recommend confirm.
4. **Slug prefix:** **`glf-`** composite / **`hm-glf-`** hard-moment (§5).
   Recommend confirm (baseball owns `bsb-`, basketball `bb-`, hockey `session-`).
5. **Clinical gate (the withholds):** the **`first-tee` cell** (the shank + the
   putting-yips / feel-deserting umbrella) authored but **withheld** across all
   3 profiles via `roleAdversities` until clinical-advisor sign-off — the FV-119
   / baseball-yips pattern (§6). Recommend confirm. This yields **27 selectable
   cells of 30 authored** until the advisor clears `first-tee`.
6. **Self-officiating / integrity adversity — IN or OUT for v1?**
   **Recommendation (lead, integrating golf-expert + sports-psychologist): OUT
   as a standalone selectable adversity cell; IN as the integrity-under-pressure
   *layer* woven through `blow-up` (#2) and `fall-behind-the-number` (#10), PLUS
   a standalone daily-training session (FV-268, youth-pastor soil).**
   - *Why it's the brand jewel:* "calling a penalty on yourself that costs you
     the round" is the single purest brand-spine fit in the app. Integrity is
     *structural* in golf — you call penalties on yourself when no one saw the
     ball move; signing a wrong card disqualifies you. The cleanest possible
     soil for "your identity is secure, not your scorecard."
   - *Why OUT as its own pregame cell (golf-expert):* it is a *moral-courage*
     moment, a different adversity *class* than an execution failure like a
     three-putt. The pregame picker rehearses "when I miss, here's my reset";
     calling a penalty on yourself isn't that shape ("I did the right hard thing
     and it cost me"). Selectable, it risks reading as "integrity is an
     adversity," which inverts the brand.
   - *The guardrails if/however it ships (sports-psychologist) — REQUIRED on the
     woven layer and the daily session:* (a) frame the call as **already-won,
     not a sacrifice** ("you didn't lose a stroke — you showed whose you are;
     the number changed, you didn't"); (b) **never moralize the cost or imply
     reward** (no prosperity "God gives the stroke back," no shaming athletes who
     haven't always made the call); (c) **keep it event-level, block the
     shame-spiral** (reject ★"my honesty cost me, so being good is a trap"); (d)
     **sports-psychologist-authored + credentialed read** before ship.
   - *Dissent on the record:* the sports-psychologist's standalone read was
     **"SHIP in v1 with the four guardrails,"** leaning toward including it
     rather than holding — i.e. both specialists agree the integrity *content*
     ships in v1; they differ only on the **vehicle** (woven layer + daily
     session vs. a guardrailed selectable cell). KC's call decides the vehicle.

---

## Appendix — Registry picker candidates (for FV-265 / FV-267 / FV-270)

Golf-true analogs of the hockey/basketball/baseball picker lists, so the
`GOLF_CONFIG` registry work has them ready. Final wording confirmed by
content-curator + golf-expert at FV-265/267.

**Practice-focus presets (`practiceFocusOptions` → `pp-golf-focus-*`):**
```
"Committed to every shot"   → "pp-golf-focus-committed-to-every-shot"
"One shot at a time"        → "pp-golf-focus-one-shot-at-a-time"
"Pick a small target"       → "pp-golf-focus-pick-a-small-target"
"Full routine, every ball"  → "pp-golf-focus-full-routine-every-ball"
"Take my medicine"          → "pp-golf-focus-take-my-medicine"     (discipline after the miss; anti-hero-ball)
"Speed on every putt"       → "pp-golf-focus-speed-on-every-putt"
"Reset between shots"       → "pp-golf-focus-reset-between-shots"   (the walk IS the work)
```
(7 presets, matching basketball/baseball's count. "Reset between shots" and
"Take my medicine" are the golf-distinct ones — they encode the between-shot
reset window and the anti-compounding discipline, which is the whole golf mental
game.)

**Reset anchors (`anchors`):** "Long exhale", "Press thumb to palm", "Say cue
word" are shared/sport-neutral. Golf-specific:
```
"Re-grip the club"
"Glove tap"
"Step back, then step in"   (re-set the pre-shot routine)
```

**Self-talk (`selfTalkOptions`):** swap the sport-cadence line, keep the 6
sport-neutral.
```
"You're okay. Next shot."          // (golf cadence — replaces "Next shift/possession/at-bat")
"Breathe. Do your job."
"Stay steady. Make the next play."
"You don't need to do too much."
"Compete, recover, go again."
"Your identity is secure. Play free."
"You are secure. Take the next faithful action."
```

**Needs (`needs`):** swap the one sport-specific need, keep the 9 shared.
```
"Confidence", "Calm", "Compete level", "Reset after mistakes",
"Physical courage", "Better course management"   // ← golf swap (hockey "Better puck decisions")
"Leadership", "Joy", "Hope", "Be more Vocal"
```
> **Flag for KC/content-curator at FV-265/270:** "Physical courage" and "Be more
> Vocal" are weaker fits in a non-contact, individual sport. Options: keep
> as-is for cross-sport `NeedToday`-union stability, or swap "Physical courage"
> → "Mental toughness" and "Be more Vocal" → "Trust my swing." The `NeedToday`
> union is a hot type — recommend keeping it stable for now and revisiting at
> FV-270.

**`cueWordHelper`:** `"The one you'd say to yourself on the walk to the next shot."`
(Golf's reset window is the walk between shots — the cue word lives there, not
"between shifts"/"at the line"/"at the plate".)

**`cardShareHint`:** `"Screenshot it. Open it before your tee time."`

**Practice openers (`practiceOpenerSlugs`):** `"dialed-in"` reuses the
sport-neutral `pp-opener-dialed-in`; `"not-feeling-it"` → `pp-golf-opener-get-to`
(authored at FV-267).

**`audioScript`:** the FV-266 golf text-mode script mirrors the
basketball/baseball segment structure (segments 0/35/210/250/275 sport-neutral;
80/120/165 golf-specific — "see the course / first tee shot / play your
profile"). Until rendered, `GOLF_CONFIG` can satisfy the type with the shared
`AUDIO_SCRIPT` placeholder, exactly as `BASEBALL_CONFIG` does today.

---

### Files referenced
- `docs/baseball-taxonomy-FV-93.md` — structural template (mirrored sections 1-9).
- `.claude/agents/golf-expert.md` — golf domain knowledge source.
- `apps/web/components/pregame/sport-registry.ts` — the `SportConfig` shape +
  `BASEBALL_CONFIG` block this taxonomy maps onto (FV-265/270 populate
  `GOLF_CONFIG` from §5 and the Appendix).
- `CLAUDE.md` — audience-language rules (athlete/player/golfer/you, never "kid")
  + brand spine.
- `docs/brand.md` — voice modes, words to use/avoid.
