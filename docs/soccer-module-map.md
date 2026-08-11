# Soccer Module Map — Review & Ratification (Soccer v2, FV-72..81)
<!-- REVIEW BUNDLE · 2026-08-10 · The taxonomy contract every soccer clip keys off -->
<!-- Round-trip: this is a DECISION document, not prose — the Ratification block at the
     bottom lists the 15 calls that are yours. Edit anything inline and/or answer the
     ratification items; on your go, this becomes docs/soccer-module-map.md and the
     script-book drafting wave starts (85 clips: 45 HM + 4 flagships + 28 plays + 8 pre-practice). -->

> **Why this gates everything:** positions, slugs, the adversity grid, and the gated-cell
> roster cascade into all 85 clips. Ratifying first is what kept football and lacrosse from
> re-cuts. The two calls the expert most wants your eyes on: the **4-position fold**
> (winger→Forward, fullback→Defender, one Midfielder) and the **shootout-miss withhold**
> (argued on "no next rep" architectural grounds — challenge welcome).

---

# Soccer Module Map — Positions × Adversities (Soccer v2, FV-72..81)

**Status: RATIFIED — KC review-bundle round-trip, 2026-08-10.** KC hand-edited the full document (register, de-gendered duel language, Americanization, focus-cue relabels) and amended ratification item 9: the 7th play in every library is a RECOVERY play that returns the athlete to the position's normal process — never payback, redemption, or proof the mistake no longer matters. All other ratification items stand as proposed.
Soccer is a **v2 / DORMANT** sport (launch stays locked hockey + basketball + golf + football,
`SUPPORTED_SPORTS` in `apps/web/lib/sports.ts`). This document is the content contract the
**script book (`docs/scripts/soccer.md`)** and the **engine wiring (`SOCCER_CONFIG` in
`apps/web/components/pregame/sport-registry.ts`)** plug into. Non-goals: the clip scripts
themselves, the audio render, the daily-training 30.

**Scope: OUTDOOR 11-a-side SOCCER, boys' and girls' (one taxonomy — see §7).** Futsal and
indoor/arena soccer are different games and are out of scope — see §10.

Mirrors the engine shape every sport uses — **N positions × M adversities = N×M hard-moment
cells** — like hockey (Forward/Defense/Goalie), basketball (Guard/Wing/Big), baseball (4),
lacrosse (5), football (7). Same discipline as every prior taxonomy: **a position's problems
are specific** — a keeper's soft goal conceded ≠ a striker's missed sitter, and you do not
reuse one for the other.

**Authored by the trio under lead orchestration:**
- **soccer-expert** — game authenticity: positions, VIZ libraries, the adversity list,
  per-position manifestations, slug scheme, vocabulary, age/level fit.
- **sports-psychologist** (co-author at the script-book stage) — per-position psychological
  distinctness and the clinical gate on downstream reframes (§4). The shootout-miss and
  handling-collapse cells route here, **never** to the soccer-expert.
- **youth-pastor** — scripture (openers inherit; see §6).
- **product-strategist** — scope: 4 positions is the scope-minimal position-true set (§1);
  soccer does not need 5.

**Registry-shaped.** Every section maps onto a `SportConfig` field (`roles`, `roleContent`,
`adversities`, `roleAdversities`, `adversitySlugFragments`, `cellSlugFor`, `vizSlugFor`,
`practiceFocusOptions`, `needs`, `anchors`, `selfTalkOptions`, `cueWordHelper`,
`cardShareHint`, `practiceOpenerSlugs`, `audioScript`). The wiring issue populates
`SOCCER_CONFIG` from §1, §2, §3, §5, §6 and the Appendix.

---

## 1. Positions (4 — soccer compresses cleanly) — RATIFY

`Role = "Forward" | "Midfielder" | "Defender" | "Goalkeeper"`

Soccer looks like an 8-position sport on a tactics board (GK / CB / FB / #6 / #8 / #10 /
winger / #9) and is a **4-position sport in an athlete's mouth**. Ask a serious ECNL or
MLS NEXT player what they play and you get "center mid," "outside back," "keeper," "up top"
— and every roster, ID-camp form, and college recruiting profile they have ever filled out
grouped them as **Forward / Midfielder / Defender / Goalkeeper**. That is the athlete-facing
grouping, and it is also the grouping that survives the app's real test.

The test (lacrosse doctrine, unchanged): **distinctness of the first-rep VIZ and the
emotional center — not distinctness of the shirt number.**

| Position | One-line identity (13–21 competitive) | Identity fuses to | Collapse reflex (sports-psych, to confirm at the book stage) |
|---|---|---|---|
| **Forward** (striker + **winger** lens) | Lives on the last shoulder and in the box — the runs, the 1v1s out wide, the finish. Judged by a number. | *goals — "you're only as good as your last goal"* | **force it / chase it** — shoots from everywhere, drops deep to touch the ball, takes the low-percentage shot to get "one back" |
| **Midfielder** (#6 / #8 / **#10** lenses) | The engine and the connector — receive under pressure, break lines, win it back, cover ground for 90. | *my touches, my work rate, "I run the game"* | **over-extend / over-play** — tries to be everywhere, hits the Hollywood ball, presses alone and leaves the shape |
| **Defender** (CB + **fullback/wingback** lens) | Last line and first pass — the duel, the header, the line, and playing out from the back under a press. | *"nothing gets past me"* | **overcommit / gamble** — dives in, steps out of the line, then chases after losing the ball |
| **Goalkeeper** | The most exposed role in the app. Alone. One mistake is a goal, on the scoreboard, with nobody who can undo it. Also starts every attack. | *the goals conceded; the one that got past* | **shrink / freeze or over-anticipate** — stops coming for crosses, stays on the line, guesses a corner, stops demanding the ball after a soft one |

### Where the wingers go (RATIFY)

**Winger folds into Forward as a variant lens — not a fifth position.** Reasoning:

- **Same emotional center.** The winger's wound is *end product* — "I beat the defender and
  produced nothing," "I got taken off because the trick didn't come off." The striker's is
  *the number*. Both are the attacking player's wound: **I am judged on what I produce in
  the final third, and today I produced nothing.** That center — not the zone of the pitch
  — is what the VIZ block and the adversity column encode.
- **Captured without a new block.** The Forward library carries a dedicated winger play
  (`take-him-on`) and the `marked-out` adversity has an explicit winger reading (the
  fullback who wins every duel and the crosses that keep hitting the first defender).
- **Scope math.** A 5th block = +1 flagship + 7 more viz plays + a full 10-cell adversity
  column + ~18 more renders + a broken integrity-test parity, for a role that shares
  Forward's core wound. This is the exact call lacrosse made on LSM and basketball made on
  1–5.
- **Roster reality.** Most US club sides run a 4-3-3 or 4-2-3-1 where players rotate
  between the wing and the middle across a season and often within a match. A player who is
  a left winger in September is a left #8 in March. The bucket has to hold that.

**Flip condition (worth naming now):** if beta wingers report the Forward block reads
striker-only — specifically, that the flagship and the hard moments are all *box* content
and none of it is *touchline* content — the fix is a winger-flavored second half of the
Forward library, not a 5th position. Escalate to a 5th block only if that fails.

### Where the fullbacks go (RATIFY)

**Fullback / wingback folds into Defender as a variant lens.** The fullback's distinct
world — the overlap, the cross, tracking back for 90, getting beaten for pace by a quick
winger — is *flavor on the same wound*: **my matchup got past me and it cost us.** It is carried
by a dedicated fullback play (`overlap-cross`) and by fullback readings of `turned` (beaten
for pace on the outside, not turned in behind) and `giveaway` (the cross that hits the first
defender). Same call as lacrosse's LSM.

### Why attacking and defensive mids do NOT split (RATIFY)

The strongest argument for a 5th/6th block in soccer is the **#6 vs #10** split: the
holding mid's wound (I lost it in a dangerous area / I do the work nobody notices) genuinely
differs from the playmaker's (I went missing when we needed a moment). It still folds:

- The **#8 sits between them and is the majority position** in US youth soccer. Splitting
  #6/#10 leaves the box-to-box player — the largest group — with no home.
- The split is **fully carried by the library halves.** The Midfielder library deliberately
  runs #10-flavored plays (`through-ball`, `switch-play`, `half-turn`) *and* #6-flavored
  plays (`win-it-back`, `beat-the-press`) in one block, and the athlete picks the three that
  are actually their game. That is the FV-144 model doing exactly what it exists to do.
- Both readings of the wound share one reframe shape: *the ball is gone, the shape is not;
  next ball, simple and forward.*

### Why the Goalkeeper is unambiguously its own position

No argument needed, but state it for the record: the keeper is the only player in the app's
entire sport set whose **single error is a scored goal with no possibility of a teammate
undoing it**, whose first-rep VIZ (set, hands, save; claim the cross; start the attack) is
rehearsed by nobody else, and whose "benched" is not a bench at all (§9). If soccer had to
ship one position, it would be this one.

**Athlete-facing labels (`roles`):** `Forward` · `Midfielder` · `Defender` · `Goalkeeper`
**`roleLabel`:** `"Position"`

> **DB note for the wiring issue:** `Forward` already exists in the
> `profiles_position_values` whitelist (hockey). `Midfielder`, `Defender`, and `Goalkeeper`
> are new values — note that soccer says **Defender** (not hockey's "Defense") and
> **Goalkeeper** (not hockey's "Goalie"). Do not reuse hockey's strings; a soccer player
> reading "Goalie" in a picker clocks it instantly. Keeper is acceptable slang in *script
> prose*; the picker label is "Goalkeeper."

---

## 2. Viz positive-play libraries (RATIFY the theme names)

Per the locked pregame scaling architecture and the KC directive of 2026-07-18, each
(sport, position) carries the **positive-play library** the athlete multi-selects up to 3
plays from (FV-144); the chosen clips **replace** the flagship `viz-soc-{pos}` at runtime.
The flagship is the nothing-picked fallback only. Per `docs/adding-a-sport.md` Step 7 the
contract is flagship + **~7 plays per position** (hard floor 5), each spanning the
position's real game: **core reps + at least one situational moment + one recovery
play**. Soccer ships **7 per position (28 plays + 4 flagships = 32 viz clips)**.

**In every position the 7th play is the recovery play** — it begins after a mistake and
returns the athlete to the position's normal process. The next action must not be framed as
payback, redemption, or proof that the mistake no longer matters. It may end in an ordinary
completed action rather than a goal, tackle, or save. Because soccer offers fewer immediate
repeat chances than many sports, the useful rehearsal is *how to re-enter the match without
forcing the next moment.*

**Organizing lens (authoring only, not a runtime axis):** each position's 7 split into a
**core-game half** and a **moment half**. The runtime consumes one flat
`viz-soc-{pos}-{play}` list registered in `POSITIVE_PLAYS`.

`roleContent.title` (picker-card identity line):
Forward → *"Threaten in behind. Combine. Finish."* · Midfielder → *"Receive. Connect.
Recover."* · Defender → *"Protect the space. Start the next attack."* ·
Goalkeeper → *"Set the angle. Communicate. Distribute."*

### Forward — *"Threaten in behind" / "Create the next action"*

1. **Run in behind, finish across the keeper** `run-in-behind` *(core)*
   The ball comes over the top and you time the run from the last shoulder, staying onside.
   One touch sets the ball, then you pass it across the goalkeeper into the far corner.
2. **Attack the near post, first-time finish** `near-post-finish` *(core)*
   The wide player looks up and drives the ball into the six-yard box.
   You get across the marker at the near post and redirect it before the goalkeeper sets.
3. **Beat the fullback and get to the byline** `take-him-on` *(core — winger lens)*
   You receive wide on the touchline, facing up the fullback, one on one.
   Drop the shoulder, push the ball past the fullback, reach the byline, and cut it back.
4. **Hold it up, lay it off, spin in behind** `hold-and-spin` *(core)*
   The long ball comes into your chest with a center back tight behind you.
   You absorb the contact, shield it, make the simple layoff, then turn into the space behind.
5. **Angle the press, win the ball high** `press-and-finish` *(core / two-way)*
   The goalkeeper rolls it to the center back and you press on an angle that removes the
   inside pass. A heavy touch lets you win the ball and finish from close range.
6. **The penalty — choose the target before the run-up** `penalty` *(situational)*
   You place the ball on the spot and pick your side on the walk back, before you turn.
   Steady run-up, eyes on the ball, side-foot it low and hard inside the post.
7. **Reset after missing from close range** `next-chance` *(recovery)*
   You put a close-range chance over the bar, then return to the press and make the next run.
   When another cross arrives, you get across the marker, set the standing foot, and direct
   the finish on target before returning to your position.

*Reserve themes for the book:* the back-post header from a cross; the one-touch give-and-go
through the middle; the offside-flag run you keep making anyway.

### Midfielder — *"Receive and connect" / "Recover the shape"*

1. **Receive on the half-turn, break the line** `half-turn` *(core)*
   You check away and come back to the ball with your body already open, shoulder checked.
   First touch out of your feet, then the pass through the line into the striker's run.
2. **The switch of play** `switch-play` *(core)*
   The ball comes to you with one side congested. You check the far side and drive the
   switch into the wide player's path.
3. **Weight the pass behind the line** `through-ball` *(core — #10 lens)*
   You receive between the lines while the center backs are square. You weight the pass
   through the gap and into the forward's run.
4. **Win it back in front of the back four** `win-it-back` *(core — #6 lens)*
   You read the pass into the forward and step into the lane before it arrives. You secure
   the ball, make the simple pass, and return to the midfield shape.
5. **Arrive late in the box and finish** `late-run-finish` *(core — #8 lens)*
   The ball goes wide and you continue the run, arriving as the cross comes in. You meet it
   near the edge of the six-yard box and direct the finish on target.
6. **Receive and play through the press** `beat-the-press` *(situational)*
   The keeper rolls it to you in your own third with a presser closing on your back.
   One touch to turn out of the pressure, and suddenly the whole pitch is in front of you.
7. **Recover the shape after giving it away** `next-touch` *(recovery)*
   You are dispossessed in midfield. You recover through the center, identify the runner,
   and help slow the transition. When the ball returns later, you shoulder-check and make
   the simple forward pass without trying to force a compensating play.

*Reserve themes:* the long diagonal from a set-piece restart; the tactical recovery run
that kills the counter; the tackle-and-go that starts your own attack.

### Defender — *"Protect the space" / "Start the next attack"*

1. **Defend the 1v1 — show the attacker wide** `one-v-one-stand` *(core)*
   The winger runs at you with space and the touchline nearby. You manage the distance,
   show the attacker outside, and stay on your feet until support arrives.
2. **Attack the header** `win-the-header` *(core)*
   The corner comes in and you locate the attacker you're marking early, then attack the flight of the ball.
   You attack the front of the ball at the top of your jump and head it clear and long.
3. **Read it early, step in and intercept** `read-and-intercept` *(core)*
   You see the pass into the forward's feet before it is played and move into the lane. You
   intercept cleanly, get your head up, and make the first pass.
4. **Play out under pressure** `play-out` *(core)*
   Their forward presses from your weak side and removes the easy pass. Your first touch
   opens the body, and the next pass finds the midfielder's back foot.
5. **Overlap and deliver** `overlap-cross` *(core — fullback lens)*
   Your winger moves inside and you overlap into the space outside.
   The ball is played into your path and you whip it first-time across the six-yard box.
6. **Recover the run and delay the attacker** `recovery-tackle` *(situational)*
   The runner gains half a yard behind you. You recover inside the attacker, slow the path
   to goal, and make the tackle only when the touch separates from the foot.
7. **Reset the matchup after getting turned** `next-duel` *(recovery)*
   The forward turns you and the defense has to recover. At the next stoppage you reset the
   line and adjust the distance. On the next duel, you stay patient, show the attacker away
   from goal, and return to the defensive shape when the ball moves.

*Reserve themes:* the goal-line block; the header at the back post from an attacking corner;
the offside-line step-up on the whole back four's call.

### Goalkeeper — *"Set the angle" / "Organize and distribute"*

1. **Set the angle and control the shot** `set-and-save` *(core)*
   The shot comes from the edge of the box and you're already set, weight forward.
   You move both hands through the ball and bring it into the body — held, no rebound.
2. **Come and claim the cross** `claim-the-cross` *(core)*
   The corner is swung into traffic and you call **keeper's** before leaving the line.
   You come through the crowd at the top of your jump and take it cleanly out of the air.
3. **Close the space and smother the touch** `off-your-line` *(situational)*
   The ball goes over the top and the forward runs through on goal. You close the space,
   set as the touch comes, and smother the ball without leading into the attacker.
4. **Start the attack** `distribution` *(core)*
   You collect the ball and the short option is covered. You scan upfield and throw into the
   fullback's path to begin the next attack.
5. **Set the wall, save the free kick** `wall-and-freekick` *(core / situational)*
   Free kick just outside the box — you set the wall, point, count, and get your angle.
   The shot goes over the wall toward your side, and you move across to push it around the post.
6. **Set for the penalty and react** `penalty-save` *(situational)*
   The shooter places the ball on the spot. You stay on the line, set as the run-up begins,
   read the strike, and drive toward the shot.
7. **Reset after conceding a soft goal** `next-save` *(recovery)*
   A shot gets through that you expected to save. You retrieve the ball, organize the restart,
   and re-establish the angle. On the next shot, you set, control it, and distribute to the
   first available outlet.

*Reserve themes:* the double save on the rebound; the sweeper-keeper clearance outside the
box; the shot from a tight angle you take away at the near post.

> **Authoring note (all 28 plays):** 9–10 short numbered lines, pure chosen-scenario
> rehearsal, "See yourself…" / "See the…" opener, beat-by-beat present tense, and ends on
> the position's next normal responsibility. A recovery play does not need a highlight to
> resolve. **No arrival context, no scripture, no identity language** (Step 7).
> The book also picks the flagship-5 scenes per position for `roleContent.scenes`.

---

## 3. Adversity taxonomy — shared 10 + per-position manifestation (RATIFY)

**Model (a), like every prior sport:** one shared canonical adversity list + per-position
*scripts* + label-only `roleAdversities` overrides and a set of special-case slugs. Do not
author 4 disjoint lists — it quadruples the surface and breaks the parameterized integrity
test. A giveaway is a giveaway; the midfielder's loose pass in front of the back four and
the goalkeeper's pass out of the box are the *same category* read through different
identities.

**Soccer's grid is uniform (4 × 10 = 40, no drops).** Unlike football (offense and defense
are different sports) or lacrosse (the FOGO is never "shut off"), **every soccer player
attacks and defends in the same continuous 90 minutes**, so every cell has a true reading
for every position. The nearest precedent is golf's uniform grid. This is a feature: the
integrity test stays fully parameterized.

### The shared 10 canonical adversities (first-person, soccer voice)

```ts
ADVERSITIES = [
  "I give the ball away.",     // 1  the loose pass, the heavy touch, dispossessed
  "I miss a big chance.",      // 2  the sitter, the free header, the spot kick in open play
  "I get beaten one-v-one.",   // 3  turned, skinned, marked out of it — the duel lost
  "I get booked.",             // 4  the yellow; the foul that gives up a free kick or a penalty
  "The goal is on me.",        // 5  SOCCER SIGNATURE — the magnified single error that ends up in the net
  "Coach yells.",              // 6  external pressure (shared motif)
  "I get benched.",            // 7  removal / not in the XI / subbed off (shared motif)
  "I feel nervous.",           // 8  pre-performance arousal (shared motif)
  "I start slow.",             // 9  cold, out of rhythm, can't get into the game (shared motif)
  "We fall behind early.",     // 10 the early deficit, and goals are scarce (shared motif)
];
```

**Mapping to the standardized motif table** (`docs/pregame-script-style.md`):
`I give the ball away` → *turnover* motif · `I miss a big chance` → *missed-chance* motif ·
`I get beaten one-v-one` → *beaten/cooked* motif (name the lost duel, correct the spacing or
body position, and return to the defensive job) · `I get booked` → *penalty/whistle* motif
(name the foul, adjust the challenge, and compete within the yellow-card constraint) ·
`Coach yells` / `I get benched` / `I feel nervous` /
`I start slow` / `We fall behind early` → their shared motifs directly.

**`The goal is on me.` is the one soccer-signature cell with no cross-sport analog** and
gets its reframes authored fresh in the motif *shape* (name the factual responsibility →
separate correction from condemnation → identify the next position-specific action). It
exists because of soccer's defining fact: **goals are scarce, so a
single error is magnified out of all proportion, and there are few possessions in which to
"make it back."** Every other sport in the app gives the athlete another possession within
seconds. Soccer might not give them another one for twenty minutes. That scarcity is the
emotional core the whole soccer track has to respect, and this is the cell that carries it.

**What got folded (not standalone shared cells):**
- **The own goal** → the Defender reading of `The goal is on me.` (special-case slug). It is
  too narrow and too rare to be its own shared cell, and too devastating to be a footnote.
- **The soft goal / the howler** → the Goalkeeper reading of `The goal is on me.`
  (special-case slug), exactly as the hockey goalie's `soft-goal` works.
- **The goal drought** → the Forward reading of `I start slow.` (special-case slug), scoped
  to the **in-match** drought ("no goals in five and today the ball keeps not falling for
  me"). The **multi-week** drought is a slow arc and routes to **daily training + postgame**,
  not the pregame reset (the football-slump precedent — see §4).
- **Going missing / can't get into the game** → the Midfielder reading of `I start slow.`
  (special-case slug). This is one of the truest sensations in the sport and deserves the
  distinct slug.
- **The missed penalty in open play** → a reading of `I miss a big chance.` (there is still
  a match to play). The **shootout** miss is a different animal and is **gated** — see §4.
- **The offside flag** → a Forward reading of `I miss a big chance.` / `I start slow.`, not
  its own cell.
- **The red card / sent off** → deliberately **NOT** in the shared 10. A red card ends the
  athlete's match, so there is no next rep to reset into; the pregame architecture has
  nothing to give it. It belongs to postgame. The yellow — the *"one more and I'm off"*
  tightrope — is the one that lives in a pregame reset, and that is `I get booked.`

### The 4 × 10 grid — per-position manifestation

One line per cell (the script-book authoring seed). ★ = identity-level phrase the book must
render as a *false story to reject*, **never as the label**. ⚠ = ships, but the reframe is
clinically gated + sports-psych-authored (§4). Cells rerouted to a special-case slug are
marked → `slug`.

**Forward (locus: the number / "I produced nothing") — 10 cells**
1. **Give the ball away** — the heavy first touch with your back to goal, or forcing the
   shot when the square ball was on; possession gone in their half.
2. **Miss a big chance** → `hm-soc-fwd-sitter` — six yards out, open net, over the bar, and
   the whole sideline saw it; ★"I'm a striker who can't score." ⚠ *(heaviest forward cell)*
3. **Beaten one-v-one** → `hm-soc-fwd-marked-out` — the center back wins every duel and you
   disappear for 40 minutes; *(winger lens: the fullback shuts you down and every cross hits
   the nearest defender)*; ★"I'm invisible out here." ⚠
4. **Booked** — kicked all half, you retaliate, or the frustration foul chasing back; now
   you can't commit for the next 60 minutes.
5. **The goal is on me** — you gave it away on the halfway line and it's in your net twelve
   seconds later; *(or: your mark at the corner scored while you switched off)*. **Thinnest
   cell in the grid — lowest authoring priority; do not force it if it reads strained.**
6. **Coach yells** — hooked with a message about your press, or "you're not holding it up."
7. **Benched** — not in the starting XI, or your number goes up on 60 and you make the walk
   off in front of everyone; ★"they don't rate me anymore." ⚠
8. **Nervous** — showcase weekend, coaches on the touchline, and your first touch is the
   whole first impression.
9. **Start slow** → `hm-soc-fwd-drought` — nothing's fallen for you in weeks and today the
   ball won't sit down; the number is louder than the game. ⚠
10. **Fall behind early** — the pull to drop deep, chase the ball, and try to be the whole
    comeback yourself — the exact opposite of what the position needs.

**Midfielder (locus: the engine / "I lost it and it cost us") — 10 cells**
1. **Give the ball away** — the loose pass in front of your own back four that becomes a
   chance ten seconds later; ★"nobody can play through me." ⚠ *(heaviest midfield cell)*
2. **Miss a big chance** — the late run into the box and you snatch at it, or the shot from
   the edge that ends up in the second row.
3. **Beaten one-v-one** — the runner goes past you and you're chasing shoulders; *(#6 lens:
   turned in the middle and the pitch opens behind you)*.
4. **Booked** — the tactical foul, or a reckless one early; now you're on a yellow for 70
   minutes and you can't go into a single tackle the way you want to. *(Soccer's foul-
   trouble analog — but it is **not** foul trouble: nobody fouls out, you just carry the
   tightrope. Author it as the tightrope, not as a foul count.)*
5. **The goal is on me** — you didn't track the runner from midfield, or you switched off on
   the second ball at a set piece, and the runner scored.
6. **Coach yells** — "you're hiding," "show for it," "get tighter" — the correction that
   lands in front of the whole group.
7. **Benched** — substituted at halftime, which is its own kind of public; or not in the XI at
   all this week.
8. **Nervous** — first start in the middle at this level; "what if I can't handle the speed
   of it."
9. **Start slow** → `hm-soc-mid-cant-get-into-it` — no touches, always a second late,
   the game happening past you; *(this is soccer's truest texture — long stretches with
   nothing to show for the work)*; ★"I don't belong at this speed." ⚠
10. **Fall behind early** — the urge to force every ball forward, hit the Hollywood pass,
    press alone and leave the shape.

**Defender (CB + fullback lens; locus: last line / "it got past me") — 10 cells**
1. **Give the ball away** — the pass out from the back intercepted in your own third under
   the press; *(fullback lens: the cross that keeps hitting the first defender)*.
2. **Miss a big chance** — the free header at the back post from a corner, and you put it
   wide; the one chance a defender gets all game.
3. **Beaten one-v-one** → `hm-soc-def-turned` — turned and beaten in behind by a quick
   striker, and you cannot get back; *(fullback lens: beaten for pace on the outside)*;
   ★"I'm too slow for this level." ⚠
4. **Booked** — the recovery challenge you mistimed, the cynical foul that stops a promising
   attack; or you went for the ball, brought the attacker down in the box, and conceded a
   penalty.
5. **The goal is on me** → `hm-soc-def-goal-on-me` — the own goal off your shin, the
   deflection, the marker you lost at the corner; the goal that everyone can see is yours;
   ★"I lost us that one." ⚠
6. **Coach yells** — called out for the line, the shape, or "who has the runner?" — and
   you cannot erase it because the goal is already on the board.
7. **Benched** — dropped after being beaten twice last week; ★"they don't trust me at the
   back." ⚠
8. **Nervous** — marking a committed forward you've heard about all week; college coaches
   behind your goal.
9. **Start slow** — a step slow to the first two duels, feet not moving, and the winger can
   feel it; "settle it before it turns into a goal."
10. **Fall behind early** — the anchor weight lands on you: push the line, go long, step out
    and gamble — and the space behind you gets bigger every time.

**Goalkeeper (locus: exposure / "there's nowhere to hide") — 10 cells + 1 gated**
1. **Give the ball away** → `hm-soc-gk-played-into-trouble` — you play it short under the
   press and it gets picked off **inside your own box**; the modern keeper's nightmare, and
   every academy and ECNL side asks you to do it anyway.
2. **Miss a big chance** → `hm-soc-gk-dropped-cross` — you came for the cross and didn't get
   there; you flapped at it in a crowd; the ball you had and didn't take.
3. **Beaten one-v-one** → `hm-soc-gk-beaten-near-post` — beaten at your near post, or through
   your hands; ★"that's a save I make in my sleep." ⚠
4. **Booked** → `hm-soc-gk-penalty-conceded` — you came through the striker, the whistle goes,
   the spot kick is given and the card is out; "I gave them the goal for free."
5. **The goal is on me** → `hm-soc-gk-soft-goal` — the soft one; it squirms under you, it
   sits on the scoreboard, the walk back to the goal line is long and there is not one
   teammate on the pitch who can undo it; ★"I lost us that one." ⚠ *(the single most
   position-true cell in the whole soccer map)*
6. **Coach yells** — the goalkeeper coach, the head coach, or your own back line turning around
   to look at you.
7. **Benched** → `hm-soc-gk-dropped` — **you lose the shirt.** Not a shift, not a rotation —
   the whole match in a tracksuit, maybe the whole season as the #2; ★"I'm the backup now." ⚠
8. **Nervous** — facing a side that scores four a game; scouts behind your net; "what if the
   first one is a soft one."
9. **Start slow** — thirty minutes without a touch, cold, standing in the rain — and then the
   first shot arrives and it's a good one. *(Uniquely a keeper's problem: long inactivity,
   then one decisive moment. Author it distinctly; do not reuse the outfield script.)*
10. **Fall behind early** — the last-line weight: hold everything from here, organize a back
    four that's rattled, and start every attack yourself.
- **⚠⚠ GATED (withheld):** *The hands desert you* → `hm-soc-gk-handling-yips` (§4).

> **Relabel-risk note (for the script book):** `coach-yells`, `nervous`, `start-slow`, and
> `fall-behind-early` are the cells most likely to collapse into one generic script across
> positions. Keep them, but author them position-distinct — Forward: check the line and make
> the next useful run; Midfielder: show for the ball and play the simple forward option;
> Defender: settle the feet and manage the distance; Goalkeeper: set the angle and make the
> defensive calls before the next ball arrives.

> **Authoring notes (soccer-expert, 2026-08-10):**
> - **`I get booked` must not be written as hockey's penalty box or basketball's foul
>   trouble.** There is no box, no penalty kill, no foul-out. The consequence is *carrying
>   a yellow* — you stay on, and the whole shape of your game narrows for an hour. That
>   restraint-under-pressure is the actual adversity. (A second yellow = a red = the match is
>   over for you; the reframe may name the stake but the cell rehearses staying on.)
> - **There is no "shift," no "shot clock," no "possession count," and no timeout.** The
>   clock runs up and stoppage time is the referee's. Never write "run out the clock."
>   The available reset windows are real and specific: the walk back to halfway after a goal,
>   the goal kick, the throw-in, the substitution board, and the whistle for a stoppage.
>   Use those.
> - **Do not over-salt the vocabulary.** A serious player can smell a jargon costume
>   instantly. One or two true terms per cell (the box, the far post, the 50-50, playing out)
>   beats five.
> - **US register, not British.** The product says pitch/box/kit sparingly and says
>   *soccer*, *cleats*, *field* naturally too. Avoid heavy British slang ("the gaffer," "he
>   megged me," "having a stinker") in athlete-facing copy unless a script's register calls
>   for it. The one exception worth keeping: **"clean sheet"** — universal in the US game.
> - **Watch-item (yips-gate routing):** a genuine *can't-strike-a-pass* collapse under the
>   press — the routine 10-yard ball that suddenly won't go — is yips-class and routes to
>   the §4 gate if authoring ever drifts there. An ordinary giveaway under pressure
>   (`hm-soc-def-giveaway`, `hm-soc-gk-played-into-trouble`) stays ungated and ships.

**Authored / selectable counts:** Forward 10 · Midfielder 10 · Defender 10 · Goalkeeper 10
(+1 gated) = **41 grid cells**, plus **4 gated shootout cells** (§4) = **45 authored,
40 selectable** until clinical sign-off. The integrity test asserts this grid, the 12
special-case slugs, and the 5 withheld cells.

---

## 4. Gated identity-collapse candidates (FV-119-class) — RATIFY the roster

**All 10 shared labels are normal competitive adversities, safe to ship as SITUATIONS with
reframes deferred.** The care lives in the *reframe*. The taxonomy is safe because it labels
every cell **neutrally** (the situation) and keeps the collapse story as a *false story to
reject*. Two tiers of gate, following the golf `first-tee` / baseball `lose-command` /
football `big-hit` precedents and the `docs/pregame-script-style.md` "gated cells" section
(worth-register authorized; never the FV-339 blockquote verbatim; never name "the yips").

### ⚠⚠ HIGHEST — WITHHELD from the picker until clinical sign-off

**1. Goalkeeper — the hands desert you** (`hm-soc-gk-handling-yips`) — **RECOMMEND WITHHOLD.**
The motor-anxiety cell: the ball starts going *through* hands that have caught ten thousand
of them; you stop coming for crosses; you stop trusting the catch and start parrying
everything. This is soccer's exact analog of the baseball throwing yips and the golf shank
umbrella, and it is amplified by the position's isolation — there is no teammate to hide
behind while you work it out and no substitution pattern that gives you a breather.
**Distinct from the ordinary soft goal** (`hm-soc-gk-soft-goal`) — a single error, painful
but event-level — **which ships.** Withheld via `roleAdversities` omission; authored so the
grid and integrity test are complete.

**2. The missed penalty in the shootout** (`hm-soc-{fwd|mid|def}-shootout`, plus the keeper's
variant `hm-soc-gk-shootout`) — **RECOMMEND WITHHOLD — for a structural reason, not a
motor-anxiety one, and this is the most important judgment call in the document.**

Every hard-moment cell in this app ends on **"next rep."** That is the architecture. The
shootout miss is the one soccer moment where **there is no next rep** — the match ends, the
season often ends, and the athlete walks back to the halfway line past ten teammates in a
silence they will remember for years. A cell whose closing beat is structurally unavailable
should not be hand-authored by a sport expert and shipped into a picker; the coping response
it actually needs ("walk back, hold your head up, face them, and let this not become who
you are") is an identity-level and grief-adjacent reframe, and it belongs to the
sports-psychologist plus a credentialed advisor. It also has a scapegoat aftermath — the
teammates, the parents in the car, the group chat — that no other cell in the app carries.

Withhold, author for the record, and **route**. Two sub-recommendations for the trio:
- The **in-run-of-play** missed penalty (a spot kick saved or skied in the 60th minute with
  thirty minutes still to play) is an ordinary competitive adversity and **ships** as a
  reading of `I miss a big chance.` The distinction is *is there a next rep*, and it is a
  clean line.
- **Taking** a penalty is prime **positive-play** material and ships in the viz libraries
  (`viz-soc-fwd-penalty`, `viz-soc-gk-penalty-save`). Rehearsing the setup, run-up, strike,
  or save mechanics is appropriate; rehearsing the miss that ends the season is not.
  Do not let the two get confused at the authoring stage.
- The shootout may be a better fit for a **postgame "For the Ride Home" module** than for a
  pregame rehearsal cell. Flagged for the postgame owner; not proposed as scope here.

**3. The academy release / "I got cut"** — **RECOMMEND: NOT A PREGAME CELL AT ALL.**
This is the harshest thing in American youth soccer and the single most identity-fused event
in the sport: a 15- or 16-year-old is called into a meeting and released from a program they
have organized their entire life, their family's money, their schooling, and their friendships
around. It is real, it is common, and the app should absolutely speak to it — but it is a
**slow-arc, life-level event, not a between-plays adversity**, exactly like football's
"I lost my starting job" slump. It has no reset window and no next rep. Route it to
**daily training** (a Locate → Reclaim → Re-enter shape) and to **postgame / ride-home**,
with the reframe sports-psych-authored and clinically read. It is **not** in the pregame 10
and should not be added there.

**Watch the line explicitly here:** "I got released and I don't know who I am without this"
is normal grief and is authorable with care. If a draft tips toward *persistent
hopelessness*, it is no longer hand-authorable and routes (see Routing reminder).

**4. Heading / head-collision contact — RECOMMEND: NO WITHHELD CELL, A STANDING GUARDRAIL
INSTEAD.** The brief asks whether soccer needs a football-`big-hit`-class withheld cell. My
read: **no.** Football needs one because *absorbing and delivering contact is a core identity
moment* in that sport — the de-cleater, the willingness to line up again. Soccer has real
contact (the aerial duel, the keeper diving at feet, the 50-50 in the middle), but **no
soccer player builds identity on absorbing hits**, and there is no signature contact moment
that an athlete would pick out of a picker. Adding a `big-hit` cell would be importing
football's taxonomy, which is exactly the failure mode this document exists to prevent.

What soccer **does** need is a **standing guardrail on the whole track**, in the shape of
football's OL body-composition rule:

> **No soccer script may valorize playing on after a head impact.** Nothing may praise or
> imply: heading through a knock, going back up for the next header with your head ringing,
> playing on after a head clash, "shake it off," "you're fine," or the keeper's dive at feet
> as toughness-through-injury. Head-injury protocols and youth heading restrictions are real
> and evolving (US Soccer restricts heading at the youngest ages and limits practice heading
> into the early teens — **verify current rules before any script names a mechanism**), and
> our 13–15 band sits right at that boundary. Physical courage in soccer ships as
> **competitive courage only** — *electing* the 50-50, standing up in the duel, going in
> where it hurts on a ball you have chosen to compete for — and every courage script pairs
> with the message that **telling a trainer, coach, or parent that something doesn't feel
> right is strength, never weakness.** Any drift routes to the sports-psychologist + the
> crisis-resource path (Option C).

**5. Also flag-and-route, never a cell — body composition / energy availability.** Soccer is
a year-round, high-volume endurance sport, and leanness pressure is real across both the
boys' and girls' game (RED-S / relative energy deficiency, amenorrhea, disordered eating).
**There is no `body-comp`, `get-fitter`, `weight`, or `leanness` cell, and no reframe may
instruct, praise, or imply a body-weight or body-fat target.** Standing guardrail on the
entire soccer track; any drift routes. *(Related: ACL injury and return-to-play, which
disproportionately affects girls' soccer, is a medical and rehab domain, not content. It may
appear as *context* in a daily-training piece about identity when you cannot play — never as
advice.)*

### ⚠ HIGH — global-verdict / identity-level (ship, reframe gated + sports-psych-authored)

Ship live, but the reframe must be sports-psychologist-authored, age-calibrated, and routed
past the credentialed advisor when seated:

- **Goalkeeper × soft-goal** (`The goal is on me`) — the purest exposure wound in the app.
  One error, one goal, nowhere to hide, no teammate who can undo it, and a long walk while
  the other side celebrates. This cell is the reason soccer belongs in this product.
- **Goalkeeper × dropped ("I lose the shirt")** and every **benched** cell — removal read as
  a verdict on worth. Note the keeper's removal is categorically worse than any other sport's
  in the app (§9).
- **Forward × sitter** and **Forward × drought** — "you're only as good as your last goal" is
  the most identity-fused sentence in the sport, and it is said out loud, by adults, to
  sixteen-year-olds.
- **Forward × marked-out** — erased for a half; ★"I'm invisible out here."
- **Defender × goal-on-me (own goal)** and **Defender × turned** — the highly visible,
  on-the-scoreboard mistake.
- **Midfielder × giveaway** (in front of the back four) and **Midfielder × can't-get-into-it**
  — the "nobody can play through me" / "I don't belong at this speed" pair.

**Registry mechanism (all withholds):** the gated umbrella `"I miss in the shootout."`
(fragment `shootout`) and the keeper's `"I lose my hands."` (fragment `lose-hands`) carry
canonical keys in `adversitySlugFragments` so `cellSlugFor` resolves them for the grid and
the integrity test, and **every role omits them from its `roleAdversities` array** → fully
withheld from the Step-02 picker (FV-119 pattern). Outfield positions carry **no** yips-class
cell — the striker's cold spell is a *slump* flavor of `drought`, which ships, exactly as
lacrosse ruled for Attack and Midfield.

**Routing reminder (non-negotiable):** if any reframe drifts toward head-injury
minimization, playing-hurt-as-toughness, persistent hopelessness, disordered eating or body
image, self-harm-adjacent content, or abuse (including from a coach or a soccer parent), it
does **not** get hand-authored — it routes to the crisis-resource path the
kids-privacy-officer governs (Option C): 988 Suicide & Crisis Lifeline, Crisis Text Line
(text HOME to 741741), and a "talk to a trusted adult" prompt. We are not a clinical service.

---

## 5. Slug scheme (multi-sport-safe)

Hockey = `session-{role}-{frag}` · basketball `bb-` · baseball `bsb-` · golf `glf-` ·
football `ftb-` · swimming `swm-` · track `trf-` · lacrosse `lax-` · tennis `tn-` (reserved).

**Soccer owns `soc-`.** Verified free of collision against every prefix above (grepped
`sport-registry.ts` and the clip sources). Three letters, parallel to `bsb`/`glf`/`ftb`/`lax`,
and unambiguous against `session-`.

**Position slug tokens (explicit, not `role.toLowerCase()`):**
`Forward → fwd` · `Midfielder → mid` · `Defender → def` · `Goalkeeper → gk`

**Patterns:**

```
composite cell key      soc-{pos}-{fragment}            e.g. soc-gk-soft-goal
hard-moment clip        hm-soc-{pos}-{fragment}         e.g. hm-soc-fwd-sitter
viz flagship            viz-soc-{pos}                   e.g. viz-soc-gk
viz positive play       viz-soc-{pos}-{play}            e.g. viz-soc-gk-claim-the-cross
pre-practice focus      pp-soc-focus-{slug}             e.g. pp-soc-focus-one-v-one
pre-practice opener     pp-soc-opener-get-to            (dialed-in inherits pp-opener-dialed-in)
```

**Soccer ships compositional-only** (golf / football / lacrosse precedent): `cellSlugFor`
returns the `hm-soc-*` hard-moment slug directly — no composite render.

```ts
cellSlugFor(adversity: string, role?: string | null): string {
  const frag = SOCCER_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "giveaway";
  const pos  = SOCCER_ROLE_TOKENS[role ?? "Midfielder"];        // fwd | mid | def | gk
  const special = SOCCER_SPECIAL_CASE_SLUGS[pos]?.[frag];       // see Appendix
  return special ?? `hm-soc-${pos}-${frag}`;
}
```

> **Naming-collision note:** `viz-soc-fwd` (flagship) and `viz-soc-fwd-run-in-behind` (play)
> share a prefix but resolve by exact slug match, exactly as hockey's `viz-forward` /
> `viz-forward-win-the-wall` do. No change needed; noted so nobody "fixes" it.

---

## 6. Openers — inherit the shared verse-per-need set (CONFIRM)

**Soccer inherits the shared pregame openers unchanged.** The canonical verse-per-need map
(`docs/pregame-script-style.md` §"Canonical verse map") is sport-neutral and applies as-is:
Be Vocal → Psalm 118:6 · Calm → Philippians 4:6–7 · Compete Level → Colossians 3:23–24 ·
Confidence → Hebrews 12:1–2 (the spine verse) · Courage → Isaiah 41:10 · Decisions →
Proverbs 3:5–6 · Hope → Isaiah 40:29–31 · Joy → 1 Thessalonians 5:16–18 · Leadership →
Mark 10:43–45 · Reset → Romans 8:1. **When a verse changes for one sport, it changes for
all.** Soccer uses the shared `opener-*` clips at launch (as baseball, golf, lacrosse, and
the other v2 sports do).

**Future sport-specific opener clips (`opener-soc-*`) — pattern, not v1 scope.** Basketball
and football authored their own sets purely for sport-specific *application language*.
Soccer would eventually warrant its own set for the needs whose application language is most
sport-shaped, and soccer has unusually good raw material here:
- **Reset** (Romans 8:1) — **the walk back to the halfway line after conceding.** This is
  the single best reset image in any sport in the app: a built-in, universal, roughly
  thirty-second window in which the whole team walks back together and the game restarts
  from the center circle. "No condemnation" delivered onto that walk would be the strongest
  opener in the product.
- **Hope** (Isaiah 40:29–31) — the 80th minute, one goal down, legs gone, and the game is
  still there because it is soccer.
- **Courage** (Isaiah 41:10) — the walk to the penalty spot; going in for the 50-50; the
  keeper coming for the cross.
- **Decisions** (Proverbs 3:5–6) — head up, the simple pass vs. the killer ball.
File as a follow-up only if the shared openers read generic to a real soccer player; not
required to ship the module.

---

## 7. Age calibration + register — and the gender note

The 45 cells are one taxonomy; **register and stakes** shift across the band. **US soccer
sanctioning and pathways change fast — verify current details before any cell names a
mechanism:** ECNL / GA / MLS NEXT structures, the academy-vs-high-school rules, NCAA
recruiting calendars and contact periods, NIL, the transfer portal, homegrown and loan rules,
and the NWSL's entry mechanism (the college draft was eliminated in the 2024 CBA).

- **13–15 — club and travel soccer, academy entry.** Concrete, low-jargon. The near horizon
  is making the top team at your club, the first ID camp, the first showcase weekend, the
  move into an academy (MLS NEXT / ECNL / GA), maybe ODP. Pay-to-play and the family's
  Saturday are already real. **Keep recruiting weight OUT of this band** — it lands wrong
  and it is the age where the goal-fusion risk is highest.
- **16–18 — the recruiting and academy machine.** The pressure band. ECNL/GA showcases, MLS
  NEXT, college ID camps, the verbal-commitment timeline, the **academy-vs-high-school
  tension** (many academies bar high-school play, so the athlete gives up their school team,
  their friends' Friday nights, and the identity that came with it), youth national-team
  call-ups, and the fork between the pro route (homegrown, a move to Europe) and college.
  This is also where **release** happens. Heaviest identity pressure in the whole band.
- **18–21 — college and the pro grind (legal adults).** NCAA D1/D2/D3, NAIA, JUCO — deep
  squads, heavy rotation, redshirts, and the **transfer portal**; NIL. The pro alternative:
  MLS, MLS NEXT Pro, USL, the academy-to-first-team jump, loans, overseas moves — where the
  economics are brutal and being released is routine. Autonomy, ownership, roster churn.
- **22–25** (eligible per the 13–25 band): extended collegiate, semi-pro, USL, overseas, and
  **transition out of the sport** — the release that is final. Content must ring true here
  without excluding the 14-year-old.

### Gender: one taxonomy, no fork (RATIFY)

**Boys' and girls' soccer are the same game.** Same laws, same field, same ball at this age,
same eleven positions, same duels, same shootouts, same clean sheets. **No gender fork is
needed — unlike lacrosse**, where the men's and women's games are materially different
sports with different rules, sticks, contact, and field roles. The 45 cells, the 28 viz
plays, and every reframe apply to both without translation.

**Register considerations the script book must honor:**

1. **Pronouns.** Do not default to "he/him" in duel language — soccer's duels get written as
   "he takes me," "my man," "he's got half a yard." Write **second person and the role**:
   *"the striker," "the winger," "whoever's on you," "your marker," "the runner."* This
   costs nothing and is the single biggest tell. *(Note for the lead: the lacrosse map is
   he/him throughout because it is scoped to the boys' game. Soccer must not copy that
   pattern.)*
2. **Pathway language must be gender-safe.** **MLS NEXT is boys only.** Do not put a girl in
   MLS NEXT. ECNL and GA run both. The girls' apex pathway runs college → NWSL; the boys'
   increasingly bypasses college for the academy/homegrown/Europe route. **Default to
   generic pathway nouns** — "your club," "the showcase," "the ID camp," "the academy,"
   "the next level" — and name a specific league only when a cell truly needs it, in which
   case prefer ECNL/GA.
3. **Do not write "the women's game" or "the men's game" as a modifier** in athlete-facing
   copy. She is a soccer player. He is a soccer player.
4. **The clinical adjacencies weight differently but apply to both** (§4): energy
   availability / leanness pressure and ACL are more prevalent in the girls' game;
   heading-collision and the release culture cut across both. All are guardrails, not cells.

---

## 8. Naming: the product says "Soccer"

**`displayName: "Soccer"`.** The audience is US-based, the app already uses **"Football"**
for American football (live sport, `FOOTBALL_CONFIG`), and the picker cannot show two
"Football" entries. Every athlete-facing surface — the sport picker, settings, the pregame
card, the postgame modules — says **Soccer**, and the script prose uses soccer-side terms
(field is fine alongside pitch; cleats; the box; the keeper).

**International consideration (one paragraph, no scope proposed).** A meaningful slice of
serious US juniors live in both vocabularies — an MLS NEXT player who watches the Premier
League every weekend, a dual-national at an ECNL club, an academy player already on trial
abroad. They will say "football," "boots," "the gaffer," and "a stinker" among themselves and
will not be confused by "Soccer" in a US app; they will, however, notice if the copy is
*wrong* — if it says "field goal," or "quarter," or treats a booking like foul trouble.
The right posture is **soccer-side labels with globally-correct game logic**: get the laws,
the positions, the restarts, and the pathways right, and the vocabulary shell can stay
American. If a future international or dual-vocabulary variant is ever wanted, it is a
labeling and copy-register question on top of this same taxonomy, not a new module map — and
it is a separate decision for KC, not proposed here.

---

## 9. Postgame + pre-practice fit

**Does soccer have benching? Yes — and it manifests in ways no other sport in the app
shares.** The postgame "The Bench" module and the `benched` hard-moment cells must describe
the real thing:

- **Not in the matchday squad at all.** The team sheet goes up, or the group chat lists who's
  traveling, and your name isn't on it. You may not even go to the game. This is the version
  that hurts most at 16–18 and it has no hockey or basketball equivalent — there is no
  "healthy scratch who still dresses."
- **Named as a sub and never used.** You warm up three times down the touchline, jog back and
  forth in front of both sets of parents, the fourth official holds the board up for someone
  else, and the whistle goes. Ninety minutes of visible, public not-being-chosen. This is the
  most common and most under-written soccer benching.
- **Subbed off.** Your number goes up on the board and you make the walk off in front of
  everyone, sometimes to applause you don't want, sometimes at halftime — which is its own
  category of public. **The key structural fact:** in academy, college, and laws-of-the-game
  formats, being substituted is **terminal for that match** — you are not coming back on. In
  US high school and much of youth club soccer, re-entry is allowed with format-specific
  limits. **Verify the current rule for the level before any script names a mechanism** — but
  author the emotional truth for the level that matters most to a 16–18 athlete: *when they
  take you off, that's your game, done.* That is why a soccer hook lands harder than a hockey
  benching (a shift) or a basketball benching (a rotation).
- **The goalkeeper's version is categorically worse.** There is no keeper rotation. You do not
  come on for the last twenty. The #2 keeper can go an entire season without a competitive
  minute while training every single day, and "losing the shirt" can mean losing it for
  months. Author `hm-soc-gk-dropped` with that specific weight — it is not "I got benched."

**Eyebrow overrides: RECOMMEND NONE.** Soccer uses the team-sport defaults — **The Win /
The Loss / The Bench / The Bad Game / The Hard Night**. All five are true: soccer plays
games (a soccer player says "I had a bad game" as readily as "a bad match"), has a bench,
and loses. Golf overrode two eyebrows because it has no bench and plays rounds; soccer has
no such mismatch. *(One optional variant flagged and not recommended: "The Bench" could read
"Left Out" to catch the not-in-the-squad case. Recommend against — it breaks cross-sport
consistency for a nuance the module body already carries.)*

**Two postgame-body notes for whoever authors the soccer five:**
- **After the Loss** must respect the scarcity. A soccer loss is usually 1-0 or 2-1 and there
  is usually one identifiable moment. The temptation is to write "it was a team effort" as a
  dodge; the honest version names that one moment, refuses it a verdict on the athlete, and
  does not pretend the athlete didn't cause it. This is the sport where "it's not on you" is
  most likely to be a lie the athlete can see through.
- **The Hard Night** is where the **shootout miss** and the **release** most plausibly live
  (§4) — flagged to the postgame owner, not proposed as scope here.

**Pre-practice fit.** Soccer's Pre-Practice "Lock In" surface fits unusually well: a serious
club or academy player trains **four to five times a week plus a match**, and for academy
players the session is often a 45–90 minute drive each way. The audio lands in the car on the
way to training, which is exactly the surface's design point. Two authoring notes:
- **No whistle in the opener** unless it's true (the FV-469 lesson). A soccer session usually
  opens with boots going on at the side of the field, a ball at your feet, and the first
  rondo — not a whistle. Write the opener onto **the first touch and the first rondo**.
- The `not-feeling-it` opener (`pp-soc-opener-get-to`) has real material in soccer: the drive,
  the rain, the fourth session of the week, the legs from Saturday's match. The "get to" turn
  lands hard here.

---

## 10. Deferred-scope stubs (DO NOT BLEND)

1. **Futsal and indoor/arena soccer** — materially different games (smaller sided, walls or
   boards, different ball, different tactical demands, different rules). Legitimate future
   variants, **never silently blended into this 11-a-side taxonomy**. Separate future issue
   if KC opens it.
2. **A 5th "Winger" position block** — deferred, with the explicit flip condition in §1. Not
   proposed.
3. **A 6th "#6 / holding mid" split** — deferred; carried by the Midfielder library halves.
4. **The multi-week goal drought and the academy release** — routed to **daily training +
   postgame**, not the pregame grid (§4). Filed as separate content work.
5. **The shootout as a postgame / ride-home module** — flagged to the postgame owner (§4, §9).
   Not proposed here.
6. **Sport-specific openers `opener-soc-*`** — pattern documented (§6), not v1 scope.
7. **International / dual-vocabulary register variant** — noted (§8), no scope proposed.

---

## 11. Downstream handoff & dependencies

Map these workstreams onto the Soccer (v2) project issues **FV-72..81** (the lead assigns
issue numbers; the workstreams and their order are what this document fixes):

- **Script book (`docs/scripts/soccer.md`).** Authors the 45 hard-moment cells from the §3
  grid + the 4 flagships and 28 viz plays (§2) + the pre-practice focus presets (Appendix),
  through **content-curator + soccer-expert** (voice/authenticity), **sports-psychologist**
  (§4 gated reframes), **youth-pastor** (scripture). Apply the ★ must-fix tags, the §4 gate,
  the §7 gender-register rules, and `docs/pregame-script-style.md` throughout — including the
  **FV-412 intrusive-thought rule** (line-3 thoughts are behavioral reads or generic doubt
  only; no capability, status, or other-party-trust verdicts). Picks the flagship-5 scenes
  per position for `roleContent.scenes`. Reuses the sport-neutral faith clips (openers,
  shared-opening, reset-plan, prayer, sendoff, cue words, self-talk).
- **Engine wiring.** Adds `soccer` to the `Sport` union; populates `SOCCER_CONFIG` in
  `sport-registry.ts` from §1/§2/§3/§5/§6 and the Appendix; registers it in `SPORT_REGISTRY`;
  creates `clips-soccer.ts` (hard moments), `segments-soccer.ts` (flagship VIZ), and
  `clips-viz-soccer.ts` (the 28 plays); **registers all 28 plays in `POSITIVE_PLAYS`** in
  `positive-plays.ts` — without this the picker is skipped and the sport silently degrades to
  flagship-only (Step 7); barrel-exports through `clips.ts`. The parameterized integrity test
  asserts the 4×10 grid, the 12 special-case slugs, and the **5 withheld cells**.
  **Soccer stays absent from `SUPPORTED_SPORTS` and from the DB `sport_valid_values` CHECK**
  until KC flips it live (baseball / football / lacrosse precedent). Stage the
  `POSITIVE_PLAYS` entries **with** the wiring PR so book, clips, and picker land as one
  reviewable unit.
- **Audio render.** Renders + masters the clips (ash voice, OpenAI TTS, EQ/master, spectral
  QA); derives `MANIFEST_VERSION` and bumps it in **both** `audio-mapping.ts` and
  `public/sw.js` (the `audio-cache-bust` CI gate). ⚠ **Dormant-manifest landmine:** a full
  `--mode clips` regen renders every dormant v2 sport — kill the render after the soccer clips
  write and patch `manifest.json` surgically. ⚠ **FV-467 batch-render bug** (truncates after
  the first slug) is open — plan around it.
- **Daily training (30 days).** Per the 2026-07-19 sport-agnostic-dailies direction, soccer
  dailies should follow whatever KC lands on for the neutralize-in-place call rather than
  authoring a soccer-specific 30 from scratch. Confirm before starting.
- **Postgame five.** Team-sport defaults, soccer bodies (§9).
- **Go-live gate.** Founder + product-strategist launch-tier decision + **clinical sign-off
  on the 5 withheld cells** before they leave the withheld state, plus the §4 standing
  guardrails (head impact, body composition) verified across every authored script.

---

## Appendix — Registry picker candidates (for the book + the wiring issue)

Soccer-true analogs of the hockey / basketball / baseball / lacrosse picker lists, so the
`SOCCER_CONFIG` work has them ready. Final wording confirmed by content-curator +
soccer-expert at the script-book stage.

**Fragment map (`SOCCER_ADVERSITY_SLUG_FRAGMENTS`):**
```
"I give the ball away."      → "giveaway"
"I miss a big chance."       → "missed-chance"
"I get beaten one-v-one."    → "beaten"
"I get booked."              → "booked"
"The goal is on me."         → "goal-on-me"
"Coach yells."               → "coach-yells"
"I get benched."             → "benched"
"I feel nervous."            → "nervous"
"I start slow."              → "start-slow"
"We fall behind early."      → "fall-behind-early"
"I miss in the shootout."    → "shootout"     // gated umbrella; WITHHELD (§4)
"I lose my hands."           → "lose-hands"   // gated, GK only; WITHHELD (§4)
```

**Special-case slugs (`cellSlugFor` — the goalie-pulled precedent):**
```
Forward    × missed-chance  → hm-soc-fwd-sitter
Forward    × beaten         → hm-soc-fwd-marked-out
Forward    × start-slow     → hm-soc-fwd-drought
Midfielder × start-slow     → hm-soc-mid-cant-get-into-it
Defender   × beaten         → hm-soc-def-turned
Defender   × goal-on-me     → hm-soc-def-goal-on-me
Goalkeeper × giveaway       → hm-soc-gk-played-into-trouble
Goalkeeper × missed-chance  → hm-soc-gk-dropped-cross
Goalkeeper × beaten         → hm-soc-gk-beaten-near-post
Goalkeeper × booked         → hm-soc-gk-penalty-conceded
Goalkeeper × goal-on-me     → hm-soc-gk-soft-goal
Goalkeeper × benched        → hm-soc-gk-dropped
--- WITHHELD (authored, omitted from every roleAdversities array) ---
{fwd,mid,def} × shootout    → hm-soc-{fwd,mid,def}-shootout
Goalkeeper    × shootout    → hm-soc-gk-shootout
Goalkeeper    × lose-hands  → hm-soc-gk-handling-yips
No position drops a cell — the 4 × 10 grid is uniform.
```

**`roleAdversities` label-only overrides** (the `key` stays canonical so `cellSlugFor` and
`state.adversity` resolve the same cell — the hockey / baseball / golf mechanism):
- **Forward:** `missed-chance` → *"I miss a sitter."* · `beaten` → *"I get marked out of the
  game."* · `start-slow` → *"The goals aren't coming."*
- **Midfielder:** `start-slow` → *"I can't get into the game."*
- **Defender:** `beaten` → *"I get turned."*
- **Goalkeeper:** `giveaway` → *"I play us into trouble."* · `missed-chance` → *"I don't
  claim the cross."* · `beaten` → *"One gets past me."* · `booked` → *"I give away a
  penalty."* · `goal-on-me` → *"I let in a soft one."* · `benched` → *"I lose the shirt."*

**`needs` (Today's Focus — swap the one sport-specific need, keep the 9 shared):**
"Confidence", "Calm", "Compete level", "Reset after mistakes", "Physical courage",
**"Better decisions on the ball"** *(← soccer swap for hockey's "Better puck decisions")*,
"Leadership", "Joy", "Hope", "Be more Vocal".
*(The `NeedToday` union is a hot type — keep it stable; confirm at wiring. "Physical courage"
scripts stay on the **competitive-courage layer** only — §4.)*

**`anchors` (reset anchors a soccer player would actually use on the field):**
Shared: "Long exhale", "Press thumb to palm", "Say cue word".
Soccer-specific: **"Touch the grass"** (universal — outfield and keeper), **"Reset on the
walk back"** (the walk to halfway after a goal, the jog back into shape — soccer's built-in
reset window), **"Clap your gloves"** (goalkeeper).
*Rejected as inauthentic: anything requiring the ball ("roll the studs over it") — the whole
point of a reset anchor in soccer is that you usually **don't** have the ball.*

**`selfTalkOptions` (swap the sport-cadence line, keep the 6 shared):**
**"You're okay. Next ball."** *(← soccer's next-rep phrase; this is literally what a soccer
coach shouts. "Next play" and "next action" are the alternates; "next ball" is the truest.)*,
"Breathe. Do your job.", "Stay steady. Make the next play.", "You don't need to do too much.",
"Compete, recover, go again.", "Your identity is secure. Play free."

**`practiceFocusOptions` (7 → `pp-soc-focus-*`):**
```
"First touch into space"        → pp-soc-focus-first-touch-into-space
"Stay patient in the 1v1"       → pp-soc-focus-patient-in-the-one-v-one
"Scan before I receive"         → pp-soc-focus-scan-before-receive
"Talk early"                    → pp-soc-focus-talk-early
"Recover shape after losing it" → pp-soc-focus-recover-shape
"Move after I pass"             → pp-soc-focus-move-after-pass
"Finish on balance"             → pp-soc-focus-finish-on-balance
```
*Reserves if a slot opens: "Press, then recover" (`press-recover`), "Play the simple pass
first" (`simple-pass`), "Set before the shot" (`gk-hands`, goalkeeper-flavored).*

**`practiceOpenerSlugs`:** `"dialed-in"` → shared **`pp-opener-dialed-in`** ·
`"not-feeling-it"` → **`pp-soc-opener-get-to`** (authored at the book stage; write it onto
the drive, the boots going on, and the first rondo — **no whistle**, per FV-469).

**`cueWordHelper`:** *"The one you'd say to yourself on the walk back to halfway."*
**`cardShareHint`:** *"Screenshot it. Open it before kick-off."*

**`audioScript`:** mirror the basketball / baseball / lacrosse segment structure — segments
0 / 35 / 210 / 250 / 275 sport-neutral; **80 / 120 / 165 soccer-specific**:
`80` → *"See the field"* · `120` → *"Your first touch"* · `165` → *"Play your position ·
{{role}}"*. Until rendered, `SOCCER_CONFIG` satisfies the type with the shared `AUDIO_SCRIPT`
placeholder, as `BASEBALL_CONFIG` does.

**`positivePlaysCopy`:** absent → `DEFAULT_POSITIVE_PLAYS_COPY` ("Plays" is correct for
soccer; no golf-style override needed).

**Content totals for scoping:** 45 hard-moment clips (40 selectable) · 4 flagship VIZ ·
28 positive-play VIZ · 7 pre-practice focus · 1 pre-practice opener = **85 soccer clips**.

---

## Ratification block

**RATIFIED by KC 2026-08-10** (item 9 amended per the recovery-play doctrine above):

1. **Position set (4): Forward / Midfielder / Defender / Goalkeeper** — and the three folds:
   **Winger → Forward** (variant lens + `take-him-on` play), **Fullback/Wingback → Defender**
   (variant lens + `overlap-cross` play), **#6 / #8 / #10 → one Midfielder** (carried by the
   library halves). Not 5, not 6. (§1)
2. **Athlete-facing labels** `Forward` / `Midfielder` / `Defender` / `Goalkeeper` — and the
   deliberate divergence from hockey's "Defense" and "Goalie" (new DB whitelist values). (§1)
3. **Adversity model:** Model (a) — one shared **10**-adversity list + per-position scripts +
   label-only `roleAdversities` overrides + 12 special-case slugs; **uniform 4 × 10 grid, no
   drops**; 45 authored / 40 selectable. (§3, Appendix)
4. **The soccer-signature cell `"The goal is on me."`** as the 5th shared adversity — the
   magnified-single-error cell that carries soccer's scarcity, and the parent of the own goal
   and the keeper's soft goal. (§3)
5. **`I get booked.` is authored as the yellow-card tightrope, not as foul trouble** — and
   the **red card is deliberately excluded** from the pregame 10 (no next rep). (§3)
6. **Gated roster — WITHHELD from the picker until clinical sign-off (5 cells):**
   (a) **Goalkeeper handling collapse** (`hm-soc-gk-handling-yips`) — yips-class;
   (b) **the shootout miss**, all four positions (`hm-soc-{fwd,mid,def,gk}-shootout`) —
   withheld on the **structural "no next rep"** ground, not the motor-anxiety ground.
   Outfield positions carry no yips cell. (§4)
7. **Academy release / "I got cut" is NOT a pregame cell** — routed to daily training +
   postgame as a slow arc (football-slump precedent). (§4)
8. **No football-style `big-hit` cell for soccer** — replaced by a **standing head-impact
   guardrail** (no playing-on-after-head-contact valorization; competitive courage only;
   reporting-is-strength) plus a **standing body-composition / energy-availability
   guardrail**. Both are flag-and-route, never cells. (§4)
9. **Viz contract: 4 flagships + 7 plays per position (28), with the 7th always a recovery
   play that returns to normal process rather than redeeming the mistake**, with the theme
   names as listed and all 28 registered in `POSITIVE_PLAYS`. (§2)
10. **Slug prefix `soc-` / `hm-soc-` / `viz-soc-` / `pp-soc-`**, position tokens
    `fwd`/`mid`/`def`/`gk`, and **compositional-only** rendering (golf / football / lacrosse
    precedent). (§5)
11. **Openers inherit the shared verse-per-need set unchanged**; `opener-soc-*` is a
    documented future pattern, not v1 scope. (§6)
12. **No gender fork** — boys' and girls' soccer are one taxonomy — plus the three binding
    register rules: **no default he/him in duel language**, **MLS NEXT is boys-only so
    pathway nouns default to generic / ECNL / GA**, and **no "the women's game" modifier**.
    (§7)
13. **Athlete-facing label is "Soccer"** (American football keeps "Football"); soccer-side
    vocabulary with globally-correct game logic; no international variant proposed. (§8)
14. **Postgame: team-sport eyebrow defaults, no overrides** — with the soccer benching
    realities (not in the squad / unused sub / subbed off is terminal / the keeper loses the
    shirt) written into the module bodies and the `benched` cells. (§9)
15. **Deferred stubs** — futsal/indoor, a 5th Winger block, a #6 split, the drought/release
    slow arcs, the shootout-as-postgame, `opener-soc-*`, and the international register
    variant — all explicitly out of scope here. (§10)

Downstream (script book, engine wiring, render) starts only after KC ratifies this contract.

### Files referenced
- `/Users/kinnychanhome/Claude/FromVictory/docs/lacrosse-module-map.md` — structural template.
- `/Users/kinnychanhome/Claude/FromVictory/docs/football-module-map.md` — the ⚠⚠ conditional-withhold + standing-guardrail precedent (§6 big-hit, OL body-comp).
- `/Users/kinnychanhome/Claude/FromVictory/docs/adding-a-sport.md` — the 14-step runbook; Step 3 `SportConfig` fields and the Step 7 VIZ content contract.
- `/Users/kinnychanhome/Claude/FromVictory/docs/pregame-script-style.md` — voice canon, standardized reframe motifs, the gated-cells section, FV-412 intrusive-thought rule.
- `/Users/kinnychanhome/Claude/FromVictory/docs/scripts/hockey.md` — play-theme granularity reference ("VIZ Clips — Positive Plays").
- `/Users/kinnychanhome/Claude/FromVictory/apps/web/components/pregame/sport-registry.ts` — the `SportConfig` shape `SOCCER_CONFIG` populates; slug-prefix collision check (`soc-` verified free against `session-`, `bb-`, `bsb-`, `glf-`, `ftb-`, `swm-`, `trf-`, `lax-`, `tn-`).
- `/Users/kinnychanhome/Claude/FromVictory/apps/web/components/pregame/positive-plays.ts` — the `viz-soc-*` registration target.
- `/Users/kinnychanhome/Claude/FromVictory/apps/web/lib/sports.ts` — `SUPPORTED_SPORTS`; soccer stays absent (dormant).
- `/Users/kinnychanhome/Claude/FromVictory/CLAUDE.md` — audience language (athlete/player/you, never "kid"), brand spine, MVP scope.

---

**Two things I want the lead to notice above everything else in this document:**

First, **the goalkeeper is the best fit for this product of any position in any sport we've
built.** One error, one goal, on the scoreboard, in front of everyone, with no teammate who
can undo it and no possession-count to make it back — and then a long walk and the next ball.
"Your identity is secure; compete from victory" was practically written for that walk. If
soccer ever needs a proof-of-concept cell to show KC, it is `hm-soc-gk-soft-goal`.

Second, **the shootout call in §4 is the one I most want challenged.** I recommend withholding
it, and my reasoning is architectural rather than clinical — the app's reset shape has no
"next rep" to offer there. If the sports-psychologist can author a coping response that
doesn't depend on a next rep, that changes the recommendation, and I'd rather that argument
happen now than after 45 cells are rendered.
