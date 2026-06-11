# Baseball Taxonomy — Positions × Adversities (FV-93)

**Status: RATIFIED — KC sign-off 2026-06-10 (kc-gate). Decision artifact.**
Authored 2026-06-10. Baseball is a **v2 / post-MVP** sport (launch is locked
hockey + basketball, FV-26); the launch-tier-vs-v2 call stays open in FV-100.
Non-goals: the clip scripts (FV-94) and audio render (FV-95) — this defines the
taxonomy they consume (positions, adversities, the matrix, slug scheme,
vocabulary, age fit).

Mirrors the engine shape — **N positions × 10 adversities = N×10 hard-moment
cells** — like hockey (Forward/Defense/Goalie) and basketball
(Guard/Wing/Big). Same discipline as FRO-10: a position's problems are
specific — a pitcher giving up the bomb ≠ an outfielder dropping a fly.

**Authored by the trio under lead orchestration:**
- **baseball-expert** — game authenticity (positions, VIZ cues, the 10
  adversities, the per-position manifestations, slug scheme, vocabulary, age
  fit).
- **sports-psychologist** — per-position psychological distinctness and the
  clinical gate on downstream reframes (§6). The throwing-yips cells route to
  the sports-psychologist, not the baseball-expert.
- **product-strategist** — scope. Baseball intentionally runs **4 positions
  (39 cells)**, one block more than hockey/basketball, because baseball is
  genuinely positional and does not compress to 3 (§1).

**KC decisions (2026-06-10):** ✅ 4 positions (Pitcher/Catcher/Infield/
Outfield). ✅ Shared 10-adversity model with per-position scripts. ✅ Pitcher
ships **9** (drops the thin fielding-error cell). ✅ `bsb-` slug prefix
(basketball owns `bb-`). ✅ Throwing-yips cells gated pending clinical sign-off.

---

## 1. Positions (4 — baseball is genuinely positional) — ✅ CONFIRMED

`Role = "Pitcher" | "Catcher" | "Infield" | "Outfield"`

Hockey and basketball are continuous-flow games whose 3 buckets *compress* a
fluid role. Baseball is **discrete and positional** — the pitcher, catcher,
infielder, and outfielder live four different games with four
non-interchangeable emotional centers and four different first-rep
visualizations (you cannot rehearse "the mound" and "tracking it off the bat"
in one VIZ block). 4 is the smallest grouping that stays position-true; finer
splits are *in-script nuance*, not new VIZ blocks.

| Position | Covers | Identity fuses to | Collapse reflex (per sports-psych) |
|---|---|---|---|
| **Pitcher** | SP / RP / closer | the whole game flows through my hand; alone on the mound | **over-grip** — overthrows, aims it, loses the zone trying *not* to fail |
| **Catcher** | C | I'm responsible for everyone out there; the field general | **over-control** — carries the staff + the dirt + the run game as personal fault |
| **Infield** | 1B / 2B / SS / 3B | quick hands, the *routine* play that must be made | **tension** — the booted routine ball; the throwing yips live here |
| **Outfield** | LF / CF / RF | track it, read it, run it down; long nothing, then one play | **drift / passivity** — disengaged through dead innings, then exposed |

Every position player is also a **hitter** — that's the universal adversity
layer (§3), not a fifth bucket.

> **Why not split (the scope math).** Each added position = +1 VIZ block + 10
> more cells + 10 renders + broken integrity-test parity.
> - **Pitcher → SP/RP/Closer (no):** one VIZ (the mound, alone, 1-on-1 with the
>   hitter) and a near-identical adversity set. The closer's distinctness (the
>   blown save) lives *inside* Pitcher × "give up the big hit," not as a
>   position.
> - **Infield → Corners/Middle (no):** the throwing yips are middle/3B-heavy,
>   but the shared center — "the routine play I'm expected to make, recorded as
>   an E with my number on the board" — holds across all four spots. The
>   corner/middle flavor lives in the cell script (E6 for a shortstop, a
>   scoop-miss for a first baseman).
> Everything finer than these 4 is per-cell script nuance (FV-94).

---

## 2. ROLE_CONTENT (courage/identity title + 5 present-tense VIZ scenes)

The analog of hockey's `ROLE_CONTENT`. Concrete, present-tense,
said-out-loud-able, position-true.

```ts
Pitcher: {
  title: "Own the mound.",
  scenes: ["Win the first pitch.", "Trust your catcher.", "One pitch at a time.",
           "Attack the zone.", "Next pitch, next out."],
},
Catcher: {
  title: "Run the game back there.",
  scenes: ["Frame the borderline.", "Block everything.", "Call it with conviction.",
           "Control the run game.", "Lead the staff."],
},
Infield: {
  title: "Quiet hands, sure feet.",
  scenes: ["Get a good hop.", "Field it clean.", "Make the routine play.",
           "Turn two.", "Throw with intent."],
},
Outfield: {
  title: "Track it, run it down.",
  scenes: ["Read it off the bat.", "Take the right route.", "Catch it at full speed.",
           "Hit the cutoff.", "Stay loud, stay ready."],
},
```

Pitcher cues = command/tempo/next-pitch amnesia; Catcher = receiving + leading
the staff + the run game; Infield = the clean routine play + the throw;
Outfield = reads/routes + staying engaged through the quiet ("stay loud, stay
ready").

---

## 3. The 10 shared adversity labels (first-person, baseball)

Same first-person voice as hockey/basketball. Slot-for-slot this preserves the
engine's adversity *categories* so the `need × position × adversity`
resolution shape is identical — only the strings + fragments change. Baseball
balances the **universal hitting layer** (every position bats) against the
**fielding/pitching layer**.

```ts
ADVERSITIES = [
  "I strike out.",            // 1  the K (looking is worse) — universal hitting
  "I'm in a slump.",          // 2  the 0-for-20; baseball's signature rumination ⚠
  "I make an error.",         // 3  the recorded, public E — your number on the board
  "I give up the big hit.",   // 4  pitcher's HR / the run that scores — "I let it in" ⚠
  "I lose my command.",       // 5  the throw/release deserts me — yips umbrella ⚠⚠
  "I get benched.",           // 6  removal (shared w/ hockey + basketball)
  "I feel nervous.",          // 7  pre-performance arousal (shared)
  "I get hit by a pitch.",    // 8  physical courage — get back in the box
  "I start slow.",            // 9  out of rhythm / cold early (shared)
  "We fall behind early.",    // 10 the early deficit; no clock, no lead is safe
];
```

**What got folded (not standalone cells):**
- **Golden sombrero (4 K's)** lives inside **slump (#2)** + **strikeout (#1)**
  as an intensifier ("you punched out four times tonight").
- **Clutch AB / RISP** is a *pressure context*, not an adversity — it's the
  stakes inside #1, #4, and #10 ("tying run on second, two outs, dugout
  watching"), never its own cell.
- The catcher's *passed ball*, OF *misread route*, IF *misplayed DP*, and
  pitcher's *blown save* are **per-position readings** of #3/#4/#5 (§4), not
  separate cells.

> **Model (a), confirmed:** one shared 10-list + per-position scripts +
> targeted overrides. Do NOT author 4 disjoint 10-lists (model b) — it triples
> the surface and breaks the parameterized integrity test. The goalie-pulled /
> Big-fouled-out precedents prove shared-label / per-position-script is right.

---

## 4. The 4×10 grid — per-position manifestation (the FRO-10 discipline)

One line per cell: how that adversity hits THAT position, so FV-94 writes
distinct, position-true scripts. ⚠ = clinical gate (§6). ⚠⚠ = throwing-yips
(highest gate; withheld pending clinical sign-off). ★ = identity-level phrase
FV-94 must render as a *false story to reject*, never as the label.

**Pitcher ships 9 — drops #3 "I make an error"** (the goalie-bad-penalty
precedent: the thinnest cell; pitchers field rarely).

### Pitcher (locus: command / over-grip) — 9 cells
1. **Strikeout** — get rung up looking at the plate with a runner on; thin at HS+ (pitchers barely hit), kept light.
2. **Slump** — a stretch of rough outings, the ERA climbing; ★"I've lost it." ⚠
4. **Give up the big hit** — the bomb: walk-off, grand slam, the one pitch you replay all night; one strike away → blown save; ★"I lost us the game." ⚠
5. **Lose my command → lose the zone** — walk the bases loaded, the free pass that beats you; ★"I can't find the plate." (Ankiel territory — see §6) ⚠
6. **Get benched → PULLED** — the long walk off the mound, hand the manager the ball, the bullpen door; ★"I'm not trusted to finish." ⚠ *(special slug, §5)*
7. **Nervous** — pregame on the bump vs a stacked lineup / scouts behind the plate; "what if I walk the first guy."
8. **Get hit → I HIT A BATTER** — drilled a guy; now the wildness fear; ★"what if I do it again." *(special slug, §5)*
9. **Start slow** — shaky first inning, behind in every count; "settle it before it snowballs."
10. **Fall behind early** — spotted them 4 in the first; "no lead is safe, but I have to stop the bleeding."

### Catcher (locus: over-control / the field general) — 10 cells
1. **Strikeout** — punched out to end the inning right before you go catch; "I failed, now I have to lead them."
2. **Slump** — 0-for-20 while carrying the staff; "not helping us score *and* responsible for everyone." ⚠
3. **Error** — passed ball / blocked ball gets by and the run scores from third; ★"that run's on me."
4. **Give up the big hit** — you put down the sign and he went yard; "I called the wrong pitch."
5. **Lose my command → THE THROWING YIPS** — can't make the routine throw back to the pitcher / down to second; ★"the throw I've made ten thousand times." ⚠⚠ *(withheld — §6)*
6. **Benched** — pulled for a pinch-hitter / sat for the other catcher; "they don't trust me to call this game."
7. **Nervous** — catching a big arm you haven't caught; "what if I can't handle him."
8. **Get hit → FOUL TIP / CROSSED UP** — wear one off the mask or the bare hand; get back down, call the next one. *(special slug, §5)*
9. **Start slow** — early passed ball, can't get comfortable receiving; "set the tone behind the plate."
10. **Fall behind early** — managing a rattled pitcher's psyche *and* your own; the field-general load lands on you.

### Infield (locus: tension / the routine play) — 10 cells
1. **Strikeout** — golden-sombrero territory, third K of the night; ★"I can't buy a hit."
2. **Slump** — 0-for-20, hitting it right at people, gripping tighter every AB; ★"I'm lost." ⚠
3. **Error** — **the E6 / E5 / E4 on the board** — booted grounder or the throw that sails; your number lit up; ★"everyone saw it, it's recorded."
4. **Give up the big hit** — hard shot through the hole scores the go-ahead run; "should I have had it?"
5. **Lose my command → THE THROWING YIPS** — suddenly can't make the throw to first you've always made; Sax / Knoblauch territory; ★"my hands won't work." ⚠⚠ *(withheld — §6)*
6. **Benched** — benched / pinch-hit for after the error or the slump; ★"I lost my spot." ⚠
7. **Nervous** — tight hands, "please don't hit it to me first."
8. **Get hit by a pitch** — drilled by a 90 up and in; get back in the box and dig back in.
9. **Start slow** — first grounder eats you up / slow feet early; "let the game come to you."
10. **Fall behind early** — the pull to press at the plate and force plays in the field to answer single-handedly.

### Outfield (locus: drift / track it off the bat) — 10 cells
1. **Strikeout** — caught staring at strike three, the lazy walk back out; "carry the 0-fer out there with me."
2. **Slump** — 0-for-20, pressing, expanding the zone; ★"I'm just an out now." ⚠
3. **Error** — drop a routine fly / lose it in the sun or lights / lazy fly drops in; ★"how do you miss that."
4. **Give up the big hit** — ball over your head off the bat / a gapper splits you and clears the bases; the long run, the wrong read.
5. **Lose my command** — throw sails to the wrong base / airmail the cutoff; the relay that lets the runner take an extra base. *(not the clinical yips — a bad throw, ships normally)*
6. **Benched** — sat / late-inning defensive replacement *for* you; "I'm a liability out there now."
7. **Nervous** — pregame in a big park / scouts with radar guns; "don't let me misjudge one early."
8. **Get hit by a pitch** — wear one, take the base, shake it off, stay in the at-bat.
9. **Start slow** — misjudge the first ball off the bat / flat-footed first inning; "lock in before the big one comes."
10. **Fall behind early** — the urge to do too much, overrun a ball / force a throw to get it back.

> **Relabel-risk note (sports-psych):** #7 nervous, #9 start slow, #10
> fall-behind are most prone to one generic script across positions. Keep them,
> but FV-94 must author position-distinct (pitcher: "the mound is yours";
> catcher: "you run this"; infielder: "let it come to you"; outfielder: "stay
> engaged through the quiet").

---

## 5. Slug scheme (multi-sport-safe) + fragment map + special cases

Hockey = `session-{position}-{frag}`; basketball = `bb-{position}-{frag}`.
**Baseball owns its own prefix — `bsb-` — never `bb-` (basketball's).**

**Fragment map (`BASEBALL_ADVERSITY_SLUG_FRAGMENTS`):**

```
"I strike out."          → "strikeout"
"I'm in a slump."        → "slump"
"I make an error."       → "error"
"I give up the big hit." → "big-hit"
"I lose my command."     → "lose-command"
"I get benched."         → "benched"
"I feel nervous."        → "nervous"
"I get hit by a pitch."  → "hbp"
"I start slow."          → "start-slow"
"We fall behind early."  → "fall-behind-early"
```

**Position-specific special cases (analog of goalie→pulled, Big→fouled-out)** —
canonical `key` is unchanged (drives the slug + `state.adversity`); only the
displayed `label` and a couple of slugs diverge:

```ts
cellSlugFor(adversity, role) {
  const frag = BASEBALL_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "strikeout";
  // Pitcher × benched → pulled (a pitcher is pulled, not benched)
  if (role === "Pitcher" && frag === "benched") return "bsb-pitcher-pulled";
  // Pitcher × hbp → hit-batter (a pitcher throws it, he doesn't wear it)
  if (role === "Pitcher" && frag === "hbp")     return "bsb-pitcher-hit-batter";
  // Catcher × hbp → foul-tip / crossed up (a catcher wears foul tips)
  if (role === "Catcher" && frag === "hbp")     return "bsb-catcher-foul-tip";
  return `bsb-${role.toLowerCase()}-${frag}`;
}
```

**`roleAdversities` overrides (label + omissions):**
- **Pitcher (9):** omit `"I make an error."`; labels — "I get pulled.", "I lose
  the zone.", "I hit a batter.".
- **Catcher (10 authored; 9 selectable until sign-off):** label "I take a foul
  tip."; **omit `"I lose my command."` (the yips) from the picker until clinical
  sign-off** (§6).
- **Infield (10 authored; 9 selectable until sign-off):** **omit `"I lose my
  command."` (the yips) from the picker until clinical sign-off** (§6).
- **Outfield (10):** no omissions; "I lose my command." ships (it's a bad
  throw, not the clinical yips).

**Full slug grid (39 cells authored):**
`bsb-pitcher-{strikeout, slump, big-hit, lose-command, pulled, nervous,
hit-batter, start-slow, fall-behind-early}` (9) ·
`bsb-catcher-{strikeout, slump, error, big-hit, lose-command*, benched,
nervous, foul-tip, start-slow, fall-behind-early}` (10) ·
`bsb-infield-{strikeout, slump, error, big-hit, lose-command*, benched,
nervous, hbp, start-slow, fall-behind-early}` (10) ·
`bsb-outfield-{strikeout, slump, error, big-hit, lose-command, benched,
nervous, hbp, start-slow, fall-behind-early}` (10).
`*` = authored but withheld from the picker pending clinical sign-off (§6).

The parameterized integrity test (FV-99) asserts this 39-slug grid + the three
special-case slugs.

---

## 6. Clinical gate (sports-psychologist) — for the FV-94 reframe stage

**All 10 labels are normal competitive adversities, safe to ship as
SITUATIONS with reframes deferred.** The care lives in the *reframe* (FV-94).
These cells sit nearest rumination / contingent-self-worth / performance-
anxiety territory; their reframe **must be sports-psychologist-authored,
explicitly age-calibrated, and routed past the credentialed advisor when
seated:**

**⚠⚠ HIGHEST — the throwing yips (route; do NOT glibly hand-author):**
1. **Catcher × lose-command** — the sudden, inexplicable loss of a routine
   throw (Mackey Sasser territory).
2. **Infield × lose-command** — Steve Sax / Chuck Knoblauch territory; the
   career-ender.

The yips sit on the clinical line. The taxonomy is safe because it labels the
cell neutrally ("I lose my command / my throw"), NOT "the yips," and keeps the
yips as a *false story to reject*. **Until the clinical advisor (Open Items) is
seated, these two cells are authored carefully but WITHHELD from the selectable
adversities via `roleAdversities` — the exact FV-119 pattern basketball used
for its two intense Big cells.** Pitcher × lose-command (losing the zone,
Ankiel territory) is the near-cousin: it ships, but gets the same caution if
the script tips from "I lost the zone tonight" toward "I've lost it for good."

**⚠ HIGH — global-verdict / identity-level risk:**
3. **Pitcher × big-hit** (the walk-off bomb / blown save) — "I lost us the
   game," the closer's one-bad-night-from-infamy spiral; heaviest-use pitcher
   cell.
4. **Slump (#2), all positions** — the 0-for-20 that lives behind your eyes for
   two weeks; the compounding press is exactly contingent-self-worth ("I can't
   hit anymore / I'm lost / I'm just an out now"). Baseball's signature
   rumination cell and the single best fit for the compete-from-victory
   message.
5. **Removal cells** — Pitcher × pulled + Infield × benched — the brain reads
   removal as "I'm not trusted / I lost my spot / I don't belong."

**Common thread:** the risk is never the *event* — it's the *global, stable,
identity-level* false story. The taxonomy keeps those as false stories *to be
rejected*; the gate exists so FV-94 actually rejects them.
**Routing reminder:** if any reframe drifts toward persistent hopelessness or
self-harm-adjacent content, it does NOT get hand-authored — it routes to the
crisis-resource path the kids-privacy-officer governs.

---

## 7. Age calibration (one note for the FV-94 authors)

The 39 cells are one taxonomy; **register and stakes** shift across the band:
- **13–15** (Little League → travel/club): concrete language; stakes are the
  top travel team and the varsity jump, not the draft. Bind responsibility
  tightly ("your next pitch, your next at-bat"). Yips cells: "the throw felt
  weird tonight," never a label; lean hardest on the sports-psych guardrail.
- **16–18** (showcase + recruiting): the pressure band — radar gun, exit velo,
  the 60, the showcase as a job interview, the verbal commit, the
  draft-vs-college fork. Contingent-self-worth risk peaks here.
- **18–21** (college + pro grind; legal adults): autonomy and ownership —
  weekend rotation, the transfer portal, redshirt, JUCO, the minor-league bus,
  DFA'd / released, Tommy John / arm care. Fully insider vocabulary is fine;
  do NOT use 18–21-only terms (portal, DFA, JUCO, the bigs) in 13–15 content.

**Verify-current-rules note:** US baseball pathways change fast — confirm
current Perfect Game/showcase structure, MLB draft round count + bonus slots,
the NCAA recruiting calendar, NIL, the portal, JUCO eligibility, and pro
roster/release rules before any cell cites a specific mechanism.

---

## 8. Downstream handoff & dependencies

- **FV-94 (clip scripts):** writes the 39 scripts from the §4 grid + 4 VIZ
  blocks + pre-practice focus presets, through **content-curator +
  baseball-expert** (voice/authenticity) and **sports-psychologist** (§6 gated
  reframes) + **youth-pastor** (scripture). Apply the ★ must-fix tags and §6
  gate. Reuse the sport-neutral faith clips (openers, shared-opening,
  reset-plan, prayer, sendoff, cue words, self-talk).
- **FV-95 (audio):** renders + masters the clips (ash voice, OpenAI TTS,
  EQ/master, spectral QA); derives `MANIFEST_VERSION`.
- **FV-97 (enum):** adds `baseball` to the `Sport` union + the DB sport enum.
- **FV-98 (routing):** baseball in the onboarding selector + sport-aware
  content/pregame routing.
- **FV-99 (QA):** the parameterized integrity test asserts baseball's 39-cell
  grid + the three special-case slugs + the two withheld yips cells.
- **FV-100 (gate):** founder + product-strategist launch-tier-vs-v2 decision —
  stays OPEN; authoring this content does not change MVP scope.

---

## 9. KC decision points — ✅ all confirmed 2026-06-10

1. **Positions:** ✅ Pitcher / Catcher / Infield / Outfield (4).
2. **Adversity model:** ✅ Model (a) — one shared 10-list + per-position
   scripts + targeted overrides.
3. **Pitcher cell count:** ✅ ships **9** (drops the fielding-error cell).
4. **Slug prefix:** ✅ `bsb-` (basketball owns `bb-`).
5. **Special cases:** ✅ Pitcher × benched → pulled; Pitcher × hbp →
   hit-batter; Catcher × hbp → foul-tip.
6. **Clinical gate:** ✅ the two throwing-yips cells (Catcher + Infield ×
   lose-command) authored but withheld via `roleAdversities` until clinical
   sign-off (FV-119 pattern).
