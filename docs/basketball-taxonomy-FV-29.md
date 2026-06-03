# Basketball Taxonomy — Positions × Adversities (FV-29)

**Status: SPEC for KC's sign-off (kc-gate). Decision artifact only.**
Authored 2026-06-02. Non-goals: the clip scripts (FV-30) and audio render
(FV-31) — this defines the taxonomy they consume.

Mirrors hockey's **3 positions × 10 adversities = 30 hard-moment cells**.
Same discipline as FRO-10: a position's problems are specific — a guard's
adversity ≠ a big's.

**Authored by the trio under lead orchestration:**
- **basketball-expert** — game authenticity (positions, VIZ cues, the 10
  adversities, the 3×10 manifestations, slug scheme).
- **sports-psychologist** — per-position psychological distinctness, age
  fit, and the clinical gate on downstream reframes. Verdict: *approved
  with conditions* (below).
- **product-strategist** — scope. Verdict: *3×10=30 is the correct
  scope-minimal shape; hold the line* (below).

---

## 1. Positions (3 — matches the engine shape) — CONFIRM WITH KC

`Role = "Guard" | "Wing" | "Big"`

The right 3-bucket compression of basketball's positionless modern reality;
each bucket has a genuinely distinct **emotional center** (the point of the
FRO-10 discipline), mapping to hockey's Forward/Defense/Goalie *as roles,
not as a copy*:

| Position | Covers | Identity fuses to | Collapse reflex (per sports-psych) |
|---|---|---|---|
| **Guard** | 1 / lead / combo | control, decisions, running the team | **over-grip** — does *too much* to fix it |
| **Wing** | 2 / 3 | shot confidence + perimeter D | **withdrawal** — does *too little*, disappears |
| **Big** | 4 / 5 | physical presence + rim protection | **throttled aggression** — plays soft, game shrinks |

> **product-strategist (hold the line):** do NOT expand to the traditional
> 1–5. 5 positions → 5×10 = 50 cells (+20 scripts, +20 audio renders, broken
> integrity-test parity). The 1–5 split is *basketball* nuance, not
> *mental-toughness* nuance — it belongs inside a Guard/Wing/Big bucket as a
> per-cell script nuance, or as a v2 follow-up after PMF. Lock basketball as
> **strict hockey parity** in the FV-26 scope text.

---

## 2. ROLE_CONTENT (courage/identity title + 5 present-tense VIZ scenes)

The analog of hockey's `ROLE_CONTENT` (e.g. Forward → "Win a puck race.").
Concrete, present-tense, said-out-loud-able, position-true.

```ts
Guard: {
  title: "Run the team with poise.",
  scenes: ["Push the pace.", "See the floor.", "Take care of the rock.",
           "Get downhill.", "Talk on defense."],
},
Wing: {
  title: "Stay ready. Stay aggressive.",
  scenes: ["Feet set, shoot it.", "Sprint the lane.", "Take the next open shot.",
           "Lock up your man.", "Crash and close out."],
},
Big: {
  title: "Own the paint.",
  scenes: ["Seal and post strong.", "Hit the glass.", "Protect the rim.",
           "Roll hard, finish.", "Move your feet, stay vertical."],
},
```

Guard cues = pace/vision/ball-security; Wing = aggression-while-cold +
guarding the assignment; Big = physicality/glass + the foul-vs-aggression
balance ("stay vertical" = contest without fouling).

---

## 3. The 10 shared adversity labels (first-person, basketball)

Same first-person voice as hockey ("I turn the puck over."). Slot-for-slot
this preserves the engine's adversity *categories* so the
need × position × adversity resolution shape is identical to hockey — only
the strings + fragments change.

```ts
ADVERSITIES = [
  "I turn the ball over.",          // ball security / decision failure
  "I miss an open shot.",           // the cold-shooter / blown chance
  "I get cooked off the dribble.",  // beaten on D, ends up on a highlight
  "I get into foul trouble.",       // the aggression tightrope (Big owns it)
  "Coach yells.",                   // external pressure (shared w/ hockey)
  "I get benched.",                 // minutes / depth-chart anxiety
  "I feel nervous.",                // pre-performance arousal (shared)
  "I miss two free throws.",        // the silent gym, exposed at the line
  "I start slow.",                  // out of rhythm
  "We fall behind early.",          // momentum / the early deficit
];
```

**Slot-8 decision (endorsed): keep "I miss two free throws."** It replaces
hockey's "I get hit." (no clean basketball cognate — contact is whistled,
not a hit). Free throws span all 3 positions and are basketball's purest
*isolation-under-evaluation* moment — clock stopped, gym quiet, pure
self-efficacy on display. sports-psych: a *richer* mental-skills target than
the physical analog (the Gallwey interference / yips mechanism lives here).
Alternative if KC prefers a physicality slot: "I get bullied in the paint."
(Big-owned) — **not recommended** (dead cell for 2 of 3 positions).

> **product-strategist:** exactly 10, shared labels with per-position
> *scripts*. Do NOT make position-specific adversity *sets* (3 disjoint
> 10-lists) — that breaks the matrix-completeness test and triples authoring
> surface. The goalie-pulled precedent proves shared-label / per-position-
> script is the right mechanism.

---

## 4. The 3×10 grid — per-position manifestation (the FRO-10 discipline)

One line per cell: how that adversity specifically hits THAT position, so
FV-30 writes distinct, position-true scripts. ⚠ = carries a clinical gate
(see §6). ★ = identity-level phrase that FV-30 must render as a *false story
to reject*, never as the label (sports-psych must-fix tag).

### Guard (locus: control / over-responsibility)
1. **Turnover** — live-dribble steal or telegraphed pass picked off; ★"I lost us that possession / I can't be trusted with the rock." (13-15: bound responsibility — "your next read, not the scoreboard.")
2. **Missed open shot** — wide-open pull-up rims out; "now they'll sag off me."
3. **Cooked off dribble** — crossed over and blown by for a layup; "everyone saw it."
4. **Foul trouble** — two quick reach-ins; must guard soft, can't pick up full-court — defensive identity handcuffed.
5. **Coach yells** — called out for a bad PnR read, pulled to the sideline; "Coach doesn't trust me to run this."
6. **Benched** — subbed after a TO, backup runs the offense; ★"I lost the keys to the team." ⚠
7. **Nervous** — tight handle, racing thoughts in warmups; "what if I cough it up first possession."
8. **Miss two FTs** — at the line to ice it, both clank; "I'm the guard, I'm supposed to close."
9. **Start slow** — over-dribbling, can't get the team into anything; "it's on me to fix it."
10. **Fall behind early** — the whole team looks at you to stop the bleeding; leadership weight lands on you.

### Wing (locus: confidence / withdrawal)
1. **Turnover** — stripped on a drive / bad cross-court swing; "I tried to do too much."
2. **Missed open shot** — cold catch-and-shoot; the danger is the NEXT one — ★"I'm bricking, I shouldn't shoot" → stops shooting, disappears; "only as good as my last make." ⚠ (FRO-11 cell)
3. **Cooked off dribble** — guarding their best scorer, beaten on a closeout, on someone's mixtape; ★"I'm a liability." ⚠
4. **Foul trouble** — hand-check fouls on a quicker scorer; the "D" half of 3-and-D is gone.
5. **Coach yells** — called out for not closing out / passing up an open shot; "I can't do anything right."
6. **Benched** — pulled because the shot isn't falling; "I'm only as good as my last make."
7. **Nervous** — pregame, doubting the stroke vs a ranked opponent / scouts in the gym.
8. **Miss two FTs** — fouled on a jumper, both miss; "even my free shot won't fall."
9. **Start slow** — first touches feel off; the trap is going quiet for the half; "I'm invisible."
10. **Fall behind early** — the pull is to force shots to single-handedly answer the run.

### Big (locus: aggression-throttling / spatial exposure)
1. **Turnover** — charge on a roll / offensive foul / stripped backing down; "keep it out of my hands."
2. **Missed open shot** — blown layup, missed putback, or bricked open three you're now asked to shoot; "I can't even finish at the rim."
3. **Cooked off dribble** — switched onto a guard, blown by — the modern-big squeeze; "they'll hunt me every time."
4. **Foul trouble** — **the Big's defining adversity.** Two early fouls → bench; back in, plays tentative, stops contesting/boxing out — the whole game shrinks. ⚠
5. **Coach yells** — called out for soft screens / getting outrebounded; "I'm getting pushed around."
6. **Benched → FOULED OUT** — removed by the rules, can't return; ★"I let my team down / I'm the weak link." ⚠ (special-case slug, see §5)
7. **Nervous** — vs a bigger, more physical matchup; "what if I get bullied inside."
8. **Miss two FTs** — bigs get *targeted* (hack-a); at the line in the bonus, both miss; "they fouled me on purpose because I'm the weak link."
9. **Start slow** — not establishing position early, beaten to spots and the glass; "I'm letting them set the tone in the paint."
10. **Fall behind early** — the anchor-of-the-defense weight (protect the rim, control the glass) lands on you.

> **Relabel-risk note (sports-psych):** #5 coach-yells, #7 nervous, and #10
> fall-behind are the cells most prone to becoming one generic script across
> positions. They're legitimate to keep, but the FV-30 brief must author them
> position-distinct (guard hears "you don't control this team," wing hears
> "you're not producing," big hears "you're soft").

---

## 5. Slug scheme (multi-sport-safe) + fragment map + special case

Today's hockey clips are `hm-{position}-{frag}` (e.g. `hm-goalie-pulled`),
not sport-namespaced. For a multi-sport registry, basketball slugs must never
collide with hockey's. **Two options — KC / content-curator call:**

- **Option A (recommended for launch): prefix only the new sport.** Keep
  hockey as-is; basketball = **`bb-{position}-{frag}`**. Zero churn on the 30
  live hockey clips, manifest, and integrity test. Lowest MVP risk.
- **Option B: retro-namespace both** → `hm-{sport}-{position}-{frag}`.
  Cleaner long-term, but a migration touching every hockey slug + manifest +
  `audio-mapping.ts` + the test. File as a follow-up when a 3rd sport (tennis,
  v2) lands. *(This also dovetails with the tennis map's FV-28 generalization
  recommendation — see `docs/tennis-module-map.md` §3.)*

**Fragment map (`ADVERSITY_SLUG_FRAGMENTS`, basketball):**

```
"I turn the ball over."          → "turnover"
"I miss an open shot."           → "missed-shot"
"I get cooked off the dribble."  → "got-cooked"
"I get into foul trouble."       → "foul-trouble"
"Coach yells."                   → "coach-yells"
"I get benched."                 → "benched"
"I feel nervous."                → "nervous"
"I miss two free throws."        → "missed-fts"
"I start slow."                  → "start-slow"
"We fall behind early."          → "fall-behind-early"
```

**Position-specific special case (analog of goalie→pulled):**
**Big × "I get benched." → `bb-big-fouled-out`** (a big is removed by the
*rules*, not benched — a richer, more authentic adversity). Mirrors the
hockey `cellSlugFor` divergence:

```ts
// Big × "I get benched." → fouled-out (removed by the rules, not benched)
if (position === "Big" && frag === "benched") return "bb-big-fouled-out";
return `bb-${position.toLowerCase()}-${frag}`;
```

The integrity-test analog: the Big × benched template references
`bb-big-fouled-out` (and NOT `bb-big-benched`). Full 30-slug grid =
`bb-{guard|wing|big}-{frag}` for the 10 fragments, with that one divergence.

---

## 6. Clinical gate (sports-psychologist) — for the FV-30 reframe stage

**All 10 labels are normal competitive adversities, safe to ship as
SITUATIONS with reframes deferred. Nothing to drop or reword at the label
level.** The care lives in the *reframe* (FV-30). These four cells sit
nearest rumination / contingent-self-worth territory — their FV-30 reframe
**must be sports-psychologist-authored, explicitly 13-15-calibrated, and
routed past the credentialed advisor when seated:**

1. **Wing × missed open shot** — the cold-shooter spiral + "only as good as
   my last make" (the FRO-11 cell; break the make→worth contingency).
2. **Wing × cooked off dribble** — "I'm a liability" defender-shame spiral.
3. **Big × foul trouble** — "I'm the weak link" global verdict on a role
   mechanic; heaviest-use cell, get it right.
4. **Removal cells** — Big benched/fouled-out + Guard "I lost the keys" —
   the brain reads removal as "I'm not trusted / I don't belong."

**Common thread:** the risk is never the *event*, it's the *global, stable,
identity-level* false story ("I'm useless / a liability / the weak link / I
don't belong"). The taxonomy is safe because it keeps those as false stories
*to be rejected*; the gate exists so FV-30 actually rejects them.
**Routing reminder:** if any reframe ever drifts toward persistent
hopelessness or self-harm-adjacent content, it does NOT get hand-authored —
it routes to the crisis-resource path the kids-privacy-officer governs.

---

## 7. Downstream handoff & dependencies

- **FV-28 (keystone registry):** consumes §1 positions, §2 ROLE_CONTENT, §3
  adversities, §5 slug scheme. *Engine work is currently collision-blocked by
  the live pre-practice (FRO-22) session in the pregame hot files — do not
  start until that clears.*
- **FV-30 (clip scripts):** writes the 30 scripts from the §4 grid, through
  **content-curator + basketball-expert** for voice/authenticity and
  **sports-psychologist** for the §6 gated reframes (+ youth-pastor for
  scripture). Apply the §4 ★ must-fix tags and §6 gate.
- **FV-31 (audio):** renders + masters the 30 clips; bump `AUDIO_CACHE_BUST`.
- **FV-34 (QA):** the parameterized integrity test must assert basketball's
  3×10=30 + the Big-fouled-out special case.

---

## 8. KC decision points (sign-off)

1. **Positions:** confirm **Guard / Wing / Big** (recommended).
2. **Slot 8:** confirm **"I miss two free throws."** (recommended) vs the
   physicality alternative.
3. **Slug scheme:** **Option A `bb-…`** for launch (recommended) vs Option B
   migration.
4. **Special case:** confirm **Big × benched → fouled-out**.
5. Lock basketball as **strict hockey parity (3×10)** in the FV-26 scope text.
