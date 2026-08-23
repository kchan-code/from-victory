# Pregame "Carry-In" — Design Plan (arrival-state support)

**Status:** DESIGN — nothing here is implemented. KC decisions required before build are in §9.
**Origin:** Direct beta-tester feedback (2026-08): *"It would be great if the app could help
me when certain thoughts come in my head before the game"* — examples given: I'm playing
injured; I'm in a slump; the other team is bigger/stronger/faster; I'm tired; I didn't get a
good night's sleep; I'm jealous of another player; coach is showing favoritism to others.
**Process:** Lead-orchestrated design pass with product-strategist, sports-psychologist,
youth-pastor, content-curator, frontend-engineer, and kids-privacy-officer. Disagreements
between agents and how the lead resolved them are logged in §12.

---

## 1. Diagnosis — these are not adversities

Every cell in the shipped hard-moment grid is a **discrete in-game event** the athlete
rehearses recovering from ("I turn the puck over." → scene → feel/false-story → reset →
truth). The seven requested themes are **arrival states** — conditions the athlete is
already inside of when they open the app. They have no scene, no "next rep" that resolves
them, and no future tense.

Running them through the hard-moment shape would be worse than not shipping them: line 2
("scene") would have the athlete vividly picture *being* tired / in a slump / passed over —
which is not rehearsal, it is guided rumination (Nolen-Hoeksema; Watkins' concrete-vs-
abstract processing). The right intervention minutes before competition is the opposite
mode: **name it → separate fact from story → set it down → adjust → step in**. Acknowledge,
defuse the forecast, narrow to controllables, end on action.

| | Hard moment (shipped) | Carry-in (this design) |
|---|---|---|
| Object | An event that hasn't happened | A state that already has |
| Shape | 5-beat scene rehearsal | 5-beat name/separate/set-down/adjust/step-in |
| Dimensioned by | sport × position | sport only for one theme; otherwise neither |
| Athlete's job | rehearse a reset | put something down |
| Selection | required step | optional, never blocks |

## 2. Product verdict

**Ship a new, small, mostly sport-neutral clip family ("Carry-In", `carry-*` slugs) plus an
optional picker folded into the existing Today's Focus screen. Zero new setup steps. Zero
persistence. Phased by theme, not by shape.**

Rejected alternatives (product-strategist holds a standing veto on all three):

- **New adversity cells in the hard-moment grid.** ~7 themes × 7 sports × ~4.4 positions ≈
  216 clips of scene-rehearsal for states that have no scene. Category error and a 100×
  content bill. The grid stays clean at exactly 10 in-game adversities per sport.
- **A dedicated new setup step.** FV-306 removed the bed picker for "too many inputs."
  Adding a required-viewing screen back — even an advanceable one — repeats that mistake and
  renumbers every hardcoded "Step 0X" label downstream.
- **Daily-surface Scenario Modules.** Explicitly blocked on an unresolved kids-privacy
  question (docs/feature-roadmap.md), needs its own schema, and answers the wrong need —
  the tester said *before the game*. (This feature stays distinguishable from that block
  only under the §8 privacy requirements; see §8.4.)

Precedents this design stands on: the sport-neutral shared clip tier (`opener-shared-*`,
FV-466); the pre-practice 2-option state picker ("dialed-in" / "not-feeling-it") — ephemeral,
never persisted; the `{{anchor}}`/`{{selfTalk}}` optional-sentinel drop semantics in
`resolvePlaylist`; and the `bedId` precedent for a `PregameState` field deliberately
excluded from session persistence.

## 3. Taxonomy — seven themes → clips

Naming rule for the family (hold this in review): **a carry-in label names the situation or
the feeling, never a verdict about the self.** Making an athlete tap "I don't belong here"
installs the verdict before a line of audio plays (FV-412 logic applied to the picker).

| Theme (beta wording) | Clip(s) | Picker label | Sport axis | Phase |
|---|---|---|---|---|
| In a slump | `carry-{sport}-slump` ×7 | `I've been in a slump.` | **Per-sport** (Beat 4 must be sport-true process; a neutral version collapses to "trust the process") | 1 ⚠ |
| Tired | `carry-empty` | `I'm running on empty.` | Shared | 1 |
| Didn't sleep well | `carry-short-sleep` | `I barely slept.` | Shared | 1 |
| Other team bigger/stronger/faster | `carry-outsized` | `They're bigger than us.` | Shared (team/contact sports) | 1 |
| — individual-sport equivalent | `carry-outclassed` | `This field is stacked.` | Shared (golf has no opponent body; the golfer's version is the stacked field / low seed. Also serves showcases.) | 1 |
| Jealous of another player | `carry-jealousy` | `I'm jealous of another player.` | Shared | 1.1 ⚠ KC-gated |
| Coach favoritism | `carry-favoritism` | `Feels like coach has favorites.` | Shared | 1.1 ⚠⚠ KC + advisor-gated |
| Playing injured | **No clip. Ever.** Routing card only (§6). | `I'm not 100%.` | — | 1 (card only) |

**v1 = 11 rendered clips** (7 slump + empty + short-sleep + outsized + outclassed) + 1
static routing card. v1.1 adds 2 shared clips if gates clear. Compare ~216 for the naive
grid version — a ~95% reduction that is not a compromise: arrival states are carried by the
person, not produced by the role. A goalie and a winger arrive on five hours' sleep
identically.

Label notes: baseball's existing HM adversity is literally `"I'm in a slump."` — the
carry-in label uses past-continuous (`I've been in a slump.`) to avoid the verbatim
collision and to mark carried-in vs. in-game. Rejected labels (verdicts): "We're
overmatched.", "Everyone here is better than me.", "Coach doesn't like me." The
`Feels like…` framing on favoritism *is* the defusion, on the label. Tired/short-sleep ship
as two chips per sports-psychologist (different report, different forecast); KC may collapse
them to one (`carry-empty`) if the picker feels crowded — flagged in §9.

## 4. Clip family spec

### 4.1 The five beats (~75–95s, 12–16 short lines, ~180–210 words)

```
1. NAME        [Mentor]      The state as reported, plainly. 2 short sentences.
                             No diagnosis, no euphemism, no elaboration. Never staged
                             as a scene — a state statement, not sensory rehearsal.
2. SEPARATE    [Mentor]      Split the FACT from the STORY. The fact stands ("you
                             slept five hours"; "they are bigger" — arguing a checkable
                             fact away destroys trust instantly). The story — the
                             same-day forecast ("so today is already gone") — is named
                             with the existing `The thought hits:` convention and refused.
3. SET IT DOWN [Mentor / Devotional guide]
                             One short truth that lets the athlete put it down without
                             pretending it away. Load states (slump, empty, short-sleep,
                             outsized, outclassed): NO scripture — plain truth that
                             inherits shared-opening's worth line. Heart states
                             (jealousy, favoritism): one verse, one line of context,
                             one line of application — three lines max (§9 decision 2).
4. ADJUST      [Coach]       What actually changes today, concretely. 2–3 controllables
                             this state does NOT touch. This is the credibility hinge:
                             a 17-year-old on five hours who is told nothing changed
                             stops trusting the app. Something did change; say what.
5. STEP IN     [Coach]       The first five minutes in the building. Named actions,
                             if-then shaped where natural. Movement-first.
```

Family-wide hard rules (from sports-psychologist; each one is load-bearing):

- **No scene rehearsal, no "why."** No causal exploration of the slump, the coach, the
  envy. Concrete-processing mode only.
- **No fixing.** No mechanics, no sleep-hygiene advice, no team-politics strategy, no
  talk-to-your-coach coaching. Wrong surface, wrong hour.
- **Ends on action, always.** A carry-in clip that ends on a feeling has made things worse.
- **Never last in the session** — see placement, §4.2.
- **Single-select.** You set down one thing. Also caps added runtime at ~90s.
- **Age register:** written to hold 13–25 with a 15-year-old floor test; never a
  band-specific noun (coach's-dad politics, portal, scholarship each narrow the clip to one
  band). Never prescribe an action a 14-year-old can't take.

### 4.2 Playlist slot — after `shared-opening`, before `shared-viz-intro`

```
opener-{need} → shared-opening → {{carry}} → [shared-viz-intro] → viz… → hm-… →
{{anchor}} → {{selfTalk}} → {{cueReset}} → shared-reset-plan → shared-prayer → … → shared-sendoff
```

- **Before visualization, or the visualization reads as denial** — rehearsing success over
  an un-set-down "I'm on five hours" is the exact toxic-positivity failure the brand bans.
  This is the decisive argument.
- **After `shared-opening`, or Beat 3 has nothing to inherit** — shared-opening line 7 is
  the worth truth; the carry clip applies it rather than re-preaching it (placement
  doctrine: weight lands once, in the opener).
- **Never after the hard moment** — it would collide with reset-plan/prayer for the close
  and leave the heavy thing near the end of the arc.

Mechanism: `{{carry}}` is a sentinel with the exact drop-semantics of `{{anchor}}` /
`{{selfTalk}}` in `resolvePlaylist` — nothing picked → sentinel dropped → session is
byte-identical to today. No scaffold intro clip needed (only one carry clip ever plays;
Beat 1 is its own lead-in). Defensive presence-check at the injection site (the
`shared-viz-intro` pattern) so an older cached manifest degrades cleanly.

**Session budget:** ~+90s on a ~300s session when selected. Options: accept ~6:00–6:30 when
chosen, or cap positive plays at 2 when a carry-in is selected. KC's call (§9 decision 4).
The picker shows the added time using the existing `estMin` pattern.

### 4.3 Voice modes and banned-phrase tripwires per theme

| Theme | Mode arc | Highest-risk banned/corn phrases (refuse in review) |
|---|---|---|
| Slump | Mentor → Mentor (no verse) → **Coach, heavy** | "Trust the process." · "You're due." (gambler's fallacy) · "You're a natural, it'll come back." · any promise the drought ends tonight |
| Empty / short-sleep | **Teammate** → Mentor (no verse) → Coach | "Toughen up." · "No excuses." · "Leave it at the door." · "Everyone's tired." · sleep-hygiene lecture · decrement statistics (nocebo) · anything a 15-year-old could apply to *pain* rather than fatigue |
| Outsized / outclassed | Mentor (brief) → Mentor (no verse) → **Coach throughout** | **David-and-Goliath** (promises the giant falls; call it out by name — it will be suggested; refuse it) · "God is on our side." (banned verbatim in brand.md) · "Size doesn't matter." · "the gap is in your head" (at U15 the gap is frequently real; name it, then relocate confidence) |
| Jealousy | Mentor → **Devotional guide, full weight** → Coach | "You're better than him anyway." (validates the comparison — direct no-comparison violation) · "Be happy for him!" (commands an emotion) · "Your time will come." · shame register ("a real Christian wouldn't feel this") · 1 Samuel 18 / Saul-envying-David as anchor (casts the athlete as villain, ranks the players theologically) |
| Favoritism | Mentor, **strictly neutral** → Devotional guide → Coach | **"God has a plan."** (clamps a lid on real injustice) · "God will make coach see you." · "Keep a good attitude and you'll get your chance." · David-to-the-throne payoff · never adjudicate the coach in either direction; never counsel confrontation, never counsel silence — "worth saying to your parents" is the release valve |

Family-wide, in force: the four canonical banned closers, the tagline as closer,
`Feel what your body does.`, no "kid," no outcome promises. Prosperity-drift risk ranking
(review weight, highest first): injured > outsized > slump > favoritism > tired/sleep >
jealousy (whose failure mode is moralizing/shame, not prosperity).

## 5. Psychology × scripture per theme (content-trio raw material, condensed)

| Theme | Psychological mechanism | Right-sized move | Scripture (heart states + injured-card only) | Line-5-motif candidates |
|---|---|---|---|---|
| Slump | Outcome-attachment (Bandura: results = most fragile efficacy source) + attention collapsed narrow-internal (Nideffer/Gallwey) + permanence attribution (Dweck's fixed-mindset move: run of events → trait) | Break permanence in one sentence; re-aim attention outward onto a task cue; never quantify the slump | *(none in-cell; Lam 3:22-23 held for a future daily module)* | "A cold stretch is a record of what already happened. It gets no vote in the next shift." |
| Outsized / outclassed | Threat appraisal (Blascovich): demands > resources — and the perception is usually *true* | Raise perceived resources (preparation, role, owned counters); separate the domain size governs (collisions) from what it doesn't (reads, timing, position); arousal reappraisal (Jamieson/Brooks) | *(none in-cell; Ps 20:7 — "some trust in chariots" — reserved if a verse is ever added: it declines to say the chariots lose)* | "They're bigger. Size decides collisions. It doesn't decide reads." |
| Empty (tired) | Perception of effort is the limiter (Marcora) and it is expectancy-shifted; warm-up heaviness poorly predicts first-period output | Normalize sensation, decline the forecast, movement-first cue; hard tired-vs-hurt boundary | *(none in-cell; Matt 11:28 register — rest from the wrong load — informs Beat 3 without quoting)* | "Heavy legs in warmup are a bad predictor of the first shift." |
| Short-sleep | Interpretive bias + documented nocebo channel: one short night costs mood, patience, late-decision quality — not trained gross-motor skill; athletes forecast a skill catastrophe | One honest sentence of cost, refuse the catastrophe, point at a sleep-insensitive controllable | *(none in-cell; Ps 127:1-2 informs; the "grants sleep to those he loves" clause is a love-status-readout hazard for 13-15 — paraphrase around it if ever used)* | "One short night shows up in your mood and your patience long before it shows up in your hands." |
| Jealousy | Social-comparison threat to identity; benign-vs-malicious envy (van de Ven) — same trigger, framing decides which; concealed because athletes believe it makes them a bad teammate/Christian, and concealment strengthens it | De-shame in one line; convert to benign envy aimed at a self-referenced standard; one concrete act of goodwill (available even when the feeling isn't); never name/characterize the other athlete | **John 3:27** ("A person can receive only what is given them from heaven") — the passage's own setting IS a jealousy scene (John's disciples upset the crowds left for Jesus). Backup: John 21:20-22 ("what is that to you?"). | "You want what he has because you want to be good. Keep the wanting. Aim it at your own game." |
| Favoritism | Perceived-injustice rumination (uniquely sticky; licenses disengagement) + external locus (Rotter) → hedged audition-play, self-fulfilling. The perception may be accurate — never argue it away | Validate without ruling ("that may be exactly what's happening"), locus shift to what-I-do-with-what-I'm-given, implementation intention for the minutes they actually get | **1 Sam 16:7** ("People look at the outward appearance, but the LORD looks at the heart") — God's evaluation differs from the visible one, with **no promotion promised**. Backup: 1 Pet 5:6-7. (Col 3:23-24 is the shipped Compete-Level opener — repetition-lint collision; do not reuse.) | "That may be exactly what's happening. It still doesn't get a vote in how you play tonight." |
| Injured (card) | — (not a reframe; see §6) | Route to trainer/coach/parent; reporting-as-strength | **2 Cor 12:9** available for the card's register only — Paul *named* the thorn out loud; the passage is about God not removing it, never about anesthetizing it. No grit theology. | (card copy, §6) |

Escalation valves the scripts must carry (one plain line, no lecture): chronic exhaustion
every week → tell parents/coach (overtraining is real); slump become hopelessness → trusted
adult; favoritism become targeting/humiliation → parent + adult outside the program, and
that content exits this family entirely.

## 6. Playing injured — routing card, never audio (HARD RULE)

The existing exclusion (football-module-map §6.3, soccer/track maps, clips-football
headers: never concussion, playing-hurt, or pain-tolerance framing; reporting must read as
strength) is **strengthened** for this surface:

- **The clip is not authored at all** — not even authored-and-withheld. A pregame clip
  addressed to an athlete who is dressed and hurting has exactly one available behavioral
  output — *go play* — which is pain-tolerance framing regardless of wording. An
  authored-but-withheld file is one routine config edit away from shipping that.
  (Content-curator proposed authored-but-withheld per FV-119; sports-psychologist and
  product-strategist argued not-authored; the lead adopts the stricter position.)
- **What ships instead:** picker chip `I'm not 100%.` (never "I'm playing injured" — that
  phrasing presupposes the decision) → a **static, non-audio routing card**: tell your
  athletic trainer, coach, or a parent before warm-up; saying it is the strong move, not
  the soft one; the people who need to know can't know unless you tell them. No reframe,
  no "you can do this," no narration. The athlete may continue the flow afterward — they
  just don't get performance content about their body. Card copy is KC-approved before
  ship (§9 decision 5).
- **13-15 vs 18-25:** the younger cut's action is "tell a parent or the trainer now, let
  them decide"; the older athlete is often the decision-maker — the card respects that
  autonomy while keeping honesty the strong play. If two cuts are impractical for a static
  card, write to the younger register.
- **Parked, clinically owned:** the narrow addressable version ("cleared by a
  trainer/doctor and still not 100%" — an expectation/role-adjustment problem, not a pain
  problem) waits for the clinical advisor (Open Items) and is theirs to write or approve.
  Related-but-different: fear of re-injury after return (kinesiophobia) is Scenario-Module
  territory, not a 90-second pregame cell. Both filed as blocked issues, not TODOs.
- Any path that implies *concealing* an injury routes to the trusted-adult pattern —
  never to a reframe.

## 7. UX — folded into Today's Focus, zero new steps

Frontend-engineer compared four placements (new FlowStep; second group on HardMomentScreen;
PregameStart affordance; Today's-Focus disclosure) against FV-306, time-to-audio,
discoverability, and the re-run/prepare-ahead paths. **Recommendation: a collapsed
disclosure on `TodaysFocusScreen` (Step 02)** — after Breathe (body settles before the mind
is asked to name anything), at the first real decision point, before the athlete's need
pick. HardMomentScreen is rejected on category grounds (its frame is hypothetical —
"could happen today" — and these are already-true states); PregameStart is the protected
calm-threshold screen and must not gain a fifth affordance.

```
┌─────────────────────────────────────┐
│  Step 02 · Today's Focus            │  ← unchanged header/progress
├─────────────────────────────────────┤
│  ANYTHING YOU'RE CARRYING IN        │  ← collapsed by default; one small
│  TODAY?                        ›    │    always-visible row, text-cream/45
│                                     │
│  ── expanded ──                     │
│  BEFORE YOU PLAY                    │  ← SectionLabel
│  [I've been in a slump.]            │  ← SelectChip grid, role="group",
│  [I'm running on empty.]            │    single-select, toggle-off = skip,
│  [I barely slept.]                  │    nothing pre-selected
│  [They're bigger than us.]          │
│  [This field is stacked.]           │
│  [I'm not 100%.]                    │  ← → routing card, not a clip
│                                     │
│  ┌───────────────────────────────┐  │
│  │ HEARD.                        │  │  ← gold confirm card, matches
│  │ We'll help you set that down  │  │    HardMomentScreen's "Locked in"
│  │ before you play.              │  │
│  └───────────────────────────────┘  │
│                                     │
│  What do you need most today?       │  ← existing heading + need chips,
│  [Confidence] [Calm] …              │    UNCHANGED; CONTINUE still gates
└─────────────────────────────────────┘    only on state.need
```

Interaction rules:

- **Selecting nothing is the default and costs nothing** — the athlete who needs nothing
  sees one quiet line, ignores it, and proceeds; no skip button exists because not opening
  the disclosure *is* skipping (no shame surface, per the gamification rule).
- Single-select; tapping the selected chip deselects. Never gates CONTINUE
  (`required` unchanged). Never re-prompted, never counted, never displayed as history.
- Confirm-card register: warm, non-clinical, never echoes the label back coldly, never
  congratulates ("Good for you" would score an internal state).
- a11y: disclosure is a real `<button aria-expanded aria-controls>`; chip group carries
  `role="group" aria-label`; chips are the existing `SelectChip` `<button aria-pressed>`;
  reveal-in-place CSS transition respecting `prefers-reduced-motion`; reuse the existing
  arrow icon rotated, no new ICONS entry.
- ReviewScreen: one conditional row (only when set). **PregameCardScreen: the pick does
  NOT appear on the shareable card** — re-displaying "coach favoritism" on a screenshot-able
  keepsake reads clinical and leaks a private moment.
- Final athlete-facing copy (disclosure line, chip labels, confirm card) is
  content-curator + KC sign-off; the labels in §3 are the working set.

**Open UX question (deliberate, for KC):** "Run it like last time" and "Play saved offline"
skip all setup screens, so a re-run athlete is never asked — correct, since yesterday's
state must not auto-apply (§8), but it means the re-run path has no way to name something
new. A possible scoped follow-up: a one-tap "anything new today?" micro-prompt on the
re-run path. Not in v1.

## 8. Engineering + privacy (kids-privacy-officer verdict: CONDITIONAL — the conditions are these)

### 8.1 Hard privacy requirements (each individually blocking; severity per the privacy review)

1. **[CRITICAL] Never in `activity_events` or any service-role/admin-visible table.** Do
   NOT add an `arrival_state`/`carry` key to `META_KEY_ALLOWLIST` in
   `apps/web/lib/activity/event-core.ts` (the `focus_area` exclusion is the precedent).
   "Jealous of a teammate" / "not 100%" tied to `athlete_id` in a 90-day-retained,
   human-reviewable table is persistent wellbeing data on a minor — the exact thing the
   no-behavioral-analytics rule exists to prevent. If aggregate usage data is ever wanted,
   it is a separate, count-only, athlete-unlinked metric with its own privacy review.
2. **[HARD] Ephemeral client state only.** Excluded from `session-cache.ts` persistence
   (the `bedId`/FV-306 allowlist-omission precedent) — "run it like last time" never
   replays yesterday's "tired," and `beginFromSaved` must not carry the field. Never
   synced to Supabase in any table; any future "pregame history" needs a fresh review.
3. **[HARD] Never surfaced to the parent dashboard**, directly or as aggregation/counts.
   `athlete-detail-core.ts`'s column allowlist is not extended. An athlete's "jealous of a
   teammate" must not be parent-reportable in any form — a distress-category label is more
   revealing than the journal's blank entry-count.
4. **[HARD] Never in analytics or logs.** `/athlete/pregame` stays off
   `analytics/allowed-routes.ts`; no console/error-tracking breadcrumb may include the
   selected value (Sentry-context objects are the classic accidental leak — flag in PR review).
5. **[HARD] Preset-only, no free text, ever** (FV-343 pattern). Free text would create a
   safety-scanning obligation the dormant Option C machinery is not wired to meet.
6. No repeat-selection nagging, streak-adjacent artifacts, or "you picked tired 9 times"
   surfacing. Rhythm framing; the picker has no memory.

Data-sensitivity classification for the record: outsized/outclassed LOW · slump LOW-MED ·
tired/sleep MED (health-adjacent if ever trended) · jealousy and favoritism MED-HIGH
(peer/adult-authority relational distress; favoritism carries a distinct retaliation-risk
vector if ever visible to any adult) · injured CRITICAL-adjacent.

### 8.2 Why this stays distinguishable from the blocked Scenario Modules question

Preset (no free text) + transient (one tap coloring one ~90s clip, not a 600-word module
the athlete sits with) + zero persistence. **If any of those three slip — or the clips grow
toward per-option branching narrative depth — this inherits the Scenario Modules block and
routes back through product-strategist + kids-privacy-officer as a scope change.** No
Option-C keyword/resource wiring is needed for six of seven themes (preset selection isn't
crisis language, and a resource interstitial on every "jealous" tap would itself be a
surveillance-feeling flag); the injured chip's routing card (§6) is the one special path.
No attorney sign-off needed pre-ship *provided* §8.1 holds; clinical-advisor pass on
injured/jealousy/favoritism copy once the advisor is seated (log in "Intentionally not
done" until then).

### 8.3 Engineering touch list (single serialized stream — crosses hot files)

- `types.ts` (hot): `carryIn: string | null` on `PregameState` + `INITIAL_STATE` + options
  registry ref. **No `FLOW` change** — no renumbering, no step-count test churn.
- `screens-a.tsx`: `CarryInDisclosure` subcomponent colocated with `TodaysFocusScreen`
  (local `useState` for expand/collapse; only the value goes through `set`).
- New `arrival-states.ts` (or `carry-in.ts`) registry mirroring `positive-plays.ts`
  (sport → available options + label + slug or card-route). Lesson learned there applies
  verbatim: **an unregistered clip is unreachable.**
- `audio-playlist.ts`: `{{carry}}` sentinel with `{{anchor}}`-style drop semantics;
  injection after `shared-opening`, before `shared-viz-intro`; slug resolved per theme
  (per-sport for slump via the registry); presence-checked so old manifests degrade.
  Dimensional (p2+) branch only.
- Param threading — **the likeliest silent bug**: `AudioSessionScreen`'s resolve call,
  `audio-precache.ts` (`checkPregameAudioCached`/`precachePregameAudio`), `ReviewScreen`'s
  cache-check effect + download tap, `PregameFlow.tsx`'s `isSavedSessionCached`. Miss the
  precache param and offline "ready" under-reports. Simplest safe course: precache the
  shared `carry-*` clips unconditionally alongside other `shared-*` clips.
- `screens-b.tsx` (hot): ReviewScreen conditional row; PregameCard untouched (§7).
- Generation: clips authored in `docs/scripts/` books first (script-book lint extended to
  `carry-*`), rendered via `npm run audio:generate -- --mode clips`; `MANIFEST_VERSION`
  bumped in `audio-mapping.ts` **and** `public/sw.js` (audio-cache-bust CI).
- Tests: `playlist-integrity` — every registered carry option resolves to a real non-zero
  catalog clip (single-dimension check, not a matrix row) + updated catalog totals;
  resolver unit tests — clip appears at the right slot when set, and the **unset path is
  byte-identical to today** (protects 100% of current athletes); a test asserting the
  session-cache allowlist does NOT contain `carryIn`; preset-only/flow-step tests
  unaffected (no FLOW change).
- `docs/adding-a-sport.md` Step 7: contract goes four-part → **five-part** (every new
  sport owes one `carry-{sport}-slump`), CI-enforced — otherwise the next sport ships
  without it, the exact failure mode that produced the 2026-07-18 directive.

### 8.4 Merge tiering

Every PR here touches `apps/web/**` → privacy path → **Tier 2, no auto-merge before
`VERDICT: APPROVED`**; content PRs are athlete-facing voice → KC-gated by definition; audio
PRs additionally ride the cache-bust guard.

## 9. Decisions required from KC (blocking, in order)

1. **Injured arrival path.** Ratify: no clip ever authored; `I'm not 100%.` chip → static
   routing card (copy to KC for approval); "cleared-but-limited" clip parked for the
   clinical advisor. (§6)
2. **Doctrine extension — the one-verse ceiling.** Heart states (jealousy, favoritism) may
   carry one verse + context + application (3 lines max) and one plain earned worth clause
   in-cell; load states carry none and inherit `shared-opening`. This extends the placement
   doctrine the same way the gated HM cells do — ratify or require full inheritance. (§4.1)
3. **FV-412 rule 2a scope clause.** Authorize, for carry cells only, `The thought hits:`
   lines that are (a) same-day performance forecasts or (b) restatement of the
   athlete-selected state — defusing a disclosed thought, not installing one. The three
   banned verdict classes stay fully in force. (§4.1)
4. **Session budget.** Accept ~6:00–6:30 when a carry-in is selected, or cap positive plays
   at 2 in that case. (§4.2)
5. **Jealousy + favoritism go/no-go** (Phase 1.1). Jealousy: worked script in Appendix A
   for review. Favoritism: authored-but-withheld (FV-119) until KC + clinical advisor sign
   off — it is the theme most likely to be overheard by a parent and misread in either
   direction. (§3, §5)
6. **Tired/short-sleep as two chips or one.** Design ships two; collapse to `carry-empty`
   alone if the picker feels crowded. (§3)
7. **Final athlete-facing copy** — disclosure line, chip labels, confirm card, routing
   card. (§7)

## 10. Phased Linear breakdown (titles TBD numbers; branch naming per convention)

**Phase 0 — decisions (no code):** the §9 items as one KC-decision issue (or split 1/2/5).

**Phase 1 — architecture + 5 safe themes (after decisions 1–4, 6–7):**
- feat: `carryIn` state + arrival-states registry + `{{carry}}` sentinel in resolver
  (AC: unset path byte-identical; typecheck across all sports; nothing persisted — includes
  the session-cache-exclusion test and the event-core allowlist untouched).
- feat: Today's-Focus disclosure UI (AC: zero new steps; never gates; a11y per §7;
  qa-reviewer axe pass).
- content: author 10 scripts + routing-card copy in the script books (AC: content trio +
  each sport-expert verifies the 7 slump Beat-4s; lint green; KC voice approval; §4.3
  banned-phrase review).
- feat: render + wire 11 clips (AC: MANIFEST_VERSION dual-bump; playlist-integrity +
  audio-cache-bust green; precache includes carry clips; session ≤ budget per decision 4).
- docs: adding-a-sport Step 7 five-part contract + CI guard; product-truths entry
  (dated, factual) so GTM stays true.

**Phase 1.1 — heart states (only if decision 5 = GO):** author + gate `carry-jealousy`,
`carry-favoritism` (withheld until the gate flips).

**Phase 2 — backlog, file don't schedule:** per-position slump for widest-gap roles
(hockey G / baseball P / soccer GK, +3 clips) only if beta pushes; re-run path
"anything new today?" micro-prompt; cleared-but-limited clip (clinical advisor);
kinesiophobia Scenario Module (blocked on the Scenario Modules privacy question);
pre-practice carry-in (reconcile with the existing 2-option state picker, don't stack).

## 11. The seven constraints that keep this net-positive (sports-psychologist; relaxing any one flips the recommendation to "don't ship")

1. Optional and skippable, nothing pre-selected, skipping unpunished and unprompted.
2. One selection, fixed enum, no free text.
3. 60–95 seconds, hard cap — duration is the difference between defusion and rumination.
4. No "why," no causal exploration, no advice.
5. Always terminates in a concrete first action.
6. Never last in the audio arc — the session ends on plays, reset plan, and prayer.
7. Never tracked, displayed, compared, or surfaced to a parent.

The case *for* shipping: the thought is already there (suppression instructions backfire —
Wegner), naming a feeling measurably dampens the response (affect labeling, Lieberman), and
the beta ask confirms these thoughts already occupy the pregame window. The case against is
real — an unbounded check-in is a rumination primer — and the constraints above are the
entire difference between the two.

## 12. Agent consensus log (what disagreed, and the lead's resolution)

| Question | Positions | Resolution |
|---|---|---|
| Picker placement | curator + psych: new optional step after Step 02 · strategist (veto) + frontend: fold into Today's Focus | **Disclosure on Today's Focus.** Satisfies every psych constraint (optional, single, skippable, post-breath); avoids renumbering churn; respects the FV-306 precedent and the standing veto. |
| Injured clip | curator: author-but-withhold (FV-119) · psych + strategist: never author | **Never author.** A withheld file is one config edit from shipping pain-tolerance framing. Routing card only. |
| Tired vs sleep | curator: merge (`carry-empty`) · psych: two cells ("merging makes both vague") | **Two clips** — honors the beta wording verbatim at +1 shared clip; KC may collapse (decision 6). |
| Clip count | frontend costed 1 shared clip · psych sketched 42 (6×7) · curator: 12 | **11 + card** (curator's model, minus `carry-limited`, plus the sleep split): per-sport only where Beat 4 demands it (slump); shared elsewhere. |
| Beat structure | psych: 6-beat with in-family anchor-reset line · curator: 5-beat, no anchor line | **Curator's 5 beats** as the spine with psych's hard rules layered on (`The thought hits:` in Beat 2, ends-on-action, no scene/why). Whether Beat 3 opens with the anchor-return line is left to the content trio in drafting — reusing the trained ritual is attractive but must not push clips past 95s. |

Unanimous across all six: arrival states are not adversities; the hard-moment grid is not
extended; ephemeral/no-persistence is load-bearing; injured is never a pregame reframe.

---

## Appendix A — worked example: `carry-jealousy` (content-curator draft; provisional pending KC decisions 2/3/5)

```
### Carry · Jealousy
<!-- slug: carry-jealousy | file: components/pregame/audio/clips-carry.ts -->

1. Before we go any further, name what you walked in with.
_(pause: 1s)_
2. The list went up. His name was where you wanted yours. And something in you went sideways.
_(pause: 1.5s)_
3. You don't have to pretend that isn't there. Say it plainly. You wanted what he got.
_(pause: 1.5s)_
4. Here is what jealousy does. It takes your eyes off your own work and puts them on his.
_(pause: 1s)_
5. Then it tells you a story — that what he got was taken from you. That there is one good thing here and he is holding it.
_(pause: 1.5s)_
6. That is the part that is not true. His name on that list did not cost you yours.
_(pause: 2s)_
7. Hear this from John 3:27. John the Baptist's own guys came to him upset that the crowds were leaving him for Jesus. He did not argue his case. He said: A person can receive only what is given them from heaven.
_(pause: 1.5s)_
8. What he has was given to him. What you have was given to you. Neither of you built it out of nothing.
_(pause: 1.5s)_
9. So you can stop defending a spot you were never asked to earn.
_(pause: 2s)_
10. Now the adjustment for today. Jealousy makes you play for the wrong audience — trying to prove something to someone who is not watching.
_(pause: 1s)_
11. You do not need to outshine him today. You need to do your job today.
_(pause: 1.5s)_
12. So here is how you walk in. Say his name in your head once and wish him a good day. Out loud, if you can manage it.
_(pause: 1s)_
13. Then let his day be his.
_(pause: 1.5s)_
14. Warm up like it means something. Be worth playing with in the first ten minutes. Compete for the first one.
_(pause: 2s)_
```

Beat map: 1–3 NAME · 4–6 SEPARATE · 7–9 SET IT DOWN · 10–11 ADJUST · 12–14 STEP IN.
Voice: 1–6 Mentor · 7–9 Devotional guide · 10–14 Coach. It never ranks the two athletes:
it names the comparison (3), falsifies the zero-sum premise under envy (6), and converts
the comparison into an available act of goodwill rather than a commanded feeling (12).
Sport- and age-neutral throughout ("the list" is true of a lineup, a starting five, a
pairing sheet, a heat sheet, a depth chart). Known trim: ~215 words sits at the top of the
band; line 7's context clause is the cut point, not the quote.

## Appendix B — worked example: short-sleep, hockey register (sports-psychologist draft; label/slug per §3 final)

```
1. One thing you carried in.
_(pause: 0.4s)_
2. You did not sleep much last night. You are in the room anyway, taped and dressed.
_(pause: 1.5s)_
3. Your eyes feel heavy under the lights. Your legs feel a half-step away from you. The thought hits: I'm going to feel this in the third.
_(pause: 2s)_
4. One short night shows up in your mood and your patience long before it shows up in your hands. Your reads are still trained.
_(pause: 2s)_
5. Tonight you control your first step, your shoulder check, and how fast you get back. None of those needed a full night.
_(pause: 2s)_
6. First shift, move your feet early and make the simple play. Let the game wake you up.
```

(Line 2 plants the one fact that matters — *you showed up* — a mastery micro-deposit for
one clause. Line 3's quoted thought is the forecast the clip defuses. Lines 4–6 concede the
real cost, then hand back sleep-insensitive controllables and a movement-first cue. Note:
drafted sport-flavored; §3 ships short-sleep as a *shared* clip, so the final draft
generalizes "shoulder check / first shift" to sport-neutral actions or this becomes the
hockey register reference for the shared script.)
