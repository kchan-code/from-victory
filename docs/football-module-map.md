# Football Taxonomy — Position Groups × Adversities (FV-FOOTBALL)

**Status: RATIFIED-CANDIDATE — pending KC sign-off (kc-gate).**
Authored 2026-06-13. Football is a **v2 / DORMANT** sport (launch is locked
hockey + basketball, FV-26; golf moved toward go-live on the 2026-06-12
directive). This document is the taxonomy contract the football build consumes
regardless of launch timing — it defines the position groups (roles),
adversities, the matrix, the slug scheme, vocabulary, the clinical gate, and age
fit that the downstream clip-script and audio-render stages depend on.
**Non-goals:** the clip scripts and the audio themselves. **The whole track is
DORMANT** pending audio render + clinical sign-off + KC go-live (see §6, §8).

Mirrors the engine shape — **N roles × M adversities = N×M hard-moment cells** —
exactly as the other sports do: hockey (Forward/Defense/Goalie), basketball
(Guard/Wing/Big), baseball (Pitcher/Catcher/Infield/Outfield), golf
(Bomber/Ball-Striker/Scrambler). Football is **deeply positional** — the engine's
"position" dimension maps to **position group**, and football is the most
positional sport in the catalog. Same discipline as the baseball doc: a role's
problems are specific — a quarterback's pick-six ≠ an offensive lineman's lost
trench battle, and you do not reuse one for the other.

**Authored by the trio under lead orchestration:**
- **football-expert** — game authenticity (position groups, VIZ cues, the
  adversity list, the per-role manifestations, slug scheme, vocabulary, age
  fit). The big-hit / contact content routes to the sports-psychologist for the
  reframe, not the football-expert.
- **sports-psychologist** — per-role psychological distinctness (the
  collapse-reflex column, §1) and the clinical gate on downstream reframes (§6).
  The big-hit cells (concussion-adjacent / playing-hurt) route here, never to
  the football-expert.
- **product-strategist** — scope. Football runs **7 roles** (one more than
  baseball's four) because football genuinely fields seven non-interchangeable
  position-group games — offense and defense are different sports, and neither
  side compresses below the splits in §1 without flattening a real VIZ block. A
  **Specialist** (K/P) role is documented as a future eighth (§1) but is NOT in
  v1.

**KC decision points (open — §9):** the 7 roles (QB/RB/WR/OL/DL/LB/DB), the
shared-adversity model (model a), the adversity count (10) + the per-role
drops/reroutes, the `ftb-`/`hm-ftb-` slug prefix, and the clinical gate (the
big-hit competitive-courage-only withhold + the OL body-comp flag-and-route).

---

## 1. Position groups (7 — football is deeply positional) — CANDIDATE

`Role = "QB" | "RB" | "WR" | "OL" | "DL" | "LB" | "DB"`

Football is not a continuous-flow game that compresses to three buckets. It is
**discrete, specialized, and platooned** — offense and defense never share the
field, and within each unit the position groups live separate games with
separate emotional centers and separate first-rep visualizations. You cannot
rehearse "read the coverage, deliver the throw" (QB) and "win my one-on-one in
the run fit" (DL) in one VIZ block. Seven is the smallest grouping that stays
position-true; finer splits (slot vs. boundary corner, guard vs. tackle, 3-tech
vs. edge) are **in-script nuance**, not new VIZ blocks (see the scope math
below).

The **collapse reflex** is the false move the role reaches for under
pressure — identity-protection dressed as strategy. The downstream reframes
reject it; the VIZ (§2) pre-loads the antidote. (sports-psychologist mechanism
in the right column.)

| Role | Token | roleLabel | Covers | Identity fuses to | Collapse reflex (the mechanism) |
|---|---|---|---|---|---|
| **QB** | `qb` | Position | the quarterback | *the offense flows through me; I'm the trigger and the face of every result* | **over-press / hero-throw** — after a mistake the answer is "make a bigger play," forcing the ball into coverage to erase the last one. Contingent self-worth welded to the result of every snap; the checkdown feels like an admission of failure, so the gunslinger doubles down. Turns one bad read into two. |
| **Running Back** | `rb` | Position | RB / FB / tailback | *I carry the load; ball security and toughness are who I am* | **press / bounce-everything** — after a stuffed run or a fumble, abandons the called gap and tries to bounce every carry to the perimeter for the highlight, instead of taking the tough four yards. Identity fused to production, so a quiet stat line reads as being phased out. |
| **Receiver / WR-TE** | `wr` | Position | WR / TE / slot | *I'm a playmaker; targets and contested catches are my proof* | **target-hunger / drop-spiral** — one drop becomes alligator arms on the next ball; pouts back to the huddle, freezes out of the next route, presses for targets to "get my number back" instead of running the called route clean. |
| **Offensive Line** | `ol` | Position | OT / OG / C | *I protect; nobody knows my name until I lose, and then everybody does* | **anonymous-until-blamed / over-set** — the rep is invisible when won and a sack on SportsCenter when lost; after a beat, over-sets and lunges, opening the counter. Worth tied to a stat that doesn't exist on the sheet, so a clean game feels like nothing and one loss feels like everything. |
| **Defensive Line / Edge** | `dl` | Position | DT / DE / EDGE / nose | *I win the line of scrimmage; the get-off and the one-on-one are mine* | **freelance / chase-the-sack** — after getting reached or pancaked, abandons the gap to chase a sack or a tackle for loss, blowing the run fit and giving up the cutback lane. The motor turns into freelancing; the discipline goes first. |
| **Linebacker** | `lb` | Position | MLB / ILB / OLB | *I'm the quarterback of the defense; I diagnose and I finish* | **over-pursuit / guess** — after a missed tackle or a blown read, starts guessing the play pre-snap and over-running fits to make up for it, taking false steps and getting caught in the wash. The need to be the finisher pulls him out of his keys. |
| **Defensive Back** | `db` | Position | CB / S / nickel | *I'm on an island; my mistakes are six points, alone, in the open* | **grab / gamble** — after getting beat, either grabs at the next route (flags) or gambles on a pick to redeem the burn, leaving the top off the coverage. The corner's amnesia is the goal; the collapse is the opposite — replaying the burn while the next snap is already coming. |

> **Future role — Specialist (K/P), token `sp` (documented, NOT in v1).** The
> kicker / punter is a genuinely distinct emotional game (the isolated,
> binary, ice-the-kicker moment — closest to golf's first-tee and the free
> throw), and its adversity set ("I miss the kick," "I shank the punt," "the
> block") does not map cleanly onto any of the seven above. It is documented
> here so the build reserves the `sp` token and the eighth VIZ block, but it is
> **out of v1 scope** — added only if KC greenlights a specialist track. Its
> miss/ice content brushes the same isolation/binary-outcome line as the
> first-tee gate (route to sports-psychologist when built).

Every player on the field also lives the universal layer — everyone can turn it
over, get beat, start slow, fall behind early, feel nervous — that's the
shared adversity layer (§3), not an eighth role.

> **Why 7, not fewer (and not 11) — the scope math.** Each role = +1 VIZ block +
> a full adversity column + that many renders + broken integrity-test parity.
> - **Collapse offense to "skill / line" and defense to "front / back"? (no).**
>   That fuses the QB's read-and-deliver game with the RB's ball-security game,
>   and the DL's trench game with the LB's diagnose-and-finish game — four
>   non-interchangeable VIZ blocks crushed into two. The whole point of the
>   role dimension is the first-rep rehearsal, and those rehearsals are distinct.
> - **Split OL into tackle/guard/center, or DB into corner/safety? (no).** Real
>   flavor, but the shared center holds — OL is "I protect, invisible until I
>   lose"; DB is "I'm on an island, my mistake is six points." The tackle-vs-
>   guard and corner-vs-safety flavor lives in the cell **script**, not a new
>   block.
> - **Split WR and TE? (no).** The TE's run-block snaps overlap the OL trench
>   layer and its route snaps overlap WR; it is a hybrid that reads cleanly as
>   "Receiver" with TE flavor in-script. A standalone TE block would duplicate
>   two existing columns.
> Everything finer than these 7 is per-cell script nuance.

---

## 2. ROLE_CONTENT (courage/identity title + 5 present-tense VIZ scenes)

The analog of hockey/baseball/golf `ROLE_CONTENT`. Concrete, present-tense,
said-out-loud-able, role-true. These are the athlete's **first-rep
rehearsal** — the good imagery, not the adversity. (Candidate wording; final
confirmed by content-curator + football-expert at the script stage.)

```ts
QB: {
  title: "Run the offense.",
  scenes: ["Read it pre-snap.", "Trust the progression.", "Deliver on time.",
           "Throw it away, live to the next down.", "Next play, next drive."],
},
RB: {
  title: "Hit it downhill.",
  scenes: ["See the hole.", "Press the line, then cut.", "Two hands, ball secure.",
           "Finish forward, every carry.", "Pick up the blitz."],
},
WR: {
  title: "Win my route.",
  scenes: ["Beat the press.", "Run it full speed.", "Snap the break.",
           "Late hands, look it in.", "Drop or not, run the next one clean."],
},
OL: {
  title: "Protect and finish.",
  scenes: ["Set the edge.", "Hands inside, anchor.", "Drive my feet.",
           "Pass it off clean.", "Lose one, win the next rep."],
},
DL: {
  title: "Win the line of scrimmage.",
  scenes: ["Get off on the ball.", "Win my one-on-one.", "Stay in my gap.",
           "Get hands up if I can't get home.", "Beat one block, then the next."],
},
LB: {
  title: "Diagnose and finish.",
  scenes: ["Read my keys.", "Trust my fit.", "Trigger downhill.",
           "Wrap up, drive my feet.", "Missed it — back to my keys."],
},
DB: {
  title: "Lock my one-on-one.",
  scenes: ["Eyes on my key.", "Phase, then play the ball.", "Trust my technique.",
           "Beat or burn, flush it.", "Next snap, short memory."],
},
```

The reset cues are pre-loaded into the VIZ on purpose — each role's collapse
reflex is named so the rehearsal builds the antidote in: QB "throw it away,
live to the next down" (anti-hero-throw); WR "drop or not, run the next one
clean" (anti-drop-spiral); OL "lose one, win the next rep" (anti-anonymous-
until-blamed); DL "stay in my gap" (anti-freelance); LB "missed it — back to my
keys" (anti-guess); DB "beat or burn, flush it" (the corner's amnesia, anti-
gamble). RB "two hands, ball secure" pre-loads ball security ahead of the fumble
cell.

---

## 3. The shared adversity labels (first-person, football voice) — 10 cells

Same first-person voice as hockey/basketball/baseball/golf. Slot-for-slot this
preserves the engine's adversity *categories* so the `need × role × adversity`
resolution shape is identical to every other sport — only the strings + fragments
change. Football balances the **universal layer** (anyone can get beat, start
slow, feel nervous) against the **role-specific failure shapes**.

**Count: 10** (matches hockey/basketball/baseball/golf, keeps integrity-test
parity). Football has more candidate adversities than slots, so the discipline is
in what gets **folded** and **rerouted per role** (§5).

```ts
ADVERSITIES = [
  "I turn the ball over.",            // 1  INT / fumble — the giveaway that swings the game ⚠
  "I get beat.",                      // 2  beaten in coverage / blown by / pancaked — my man won
  "I make a mistake on film.",        // 3  the assignment bust everyone sees on the install tape ⚠
  "I give up the big play.",          // 4  the explosive / the TD / the chunk that went over me ⚠
  "I get benched.",                   // 5  depth chart, reps go to someone else, healthy scratch
  "I feel nervous.",                  // 6  pre-game / pre-snap arousal (shared)
  "I take a big hit.",                // 7  the de-cleater / the blindside / getting laid out ⚠⚠ (see §6)
  "I start slow.",                    // 8  three-and-out / missed early, cold out of the gate (shared)
  "We fall behind early.",            // 9  down two scores in the first quarter, the climb (shared)
  "I lose a battle in the trenches.", // 10 beaten in the run fit / at the point of attack
];
```

**Adversity label notes:**
- **#7 "I take a big hit"** is football's signature physical-courage moment
  **and** the cell that brushes the **concussion / playing-hurt** medical line.
  It ships as **competitive courage ONLY** — the willingness to be physical, to
  get back up, to not flinch from contact you've chosen — and **never** as
  concussion management, "play through your head ringing," or any
  playing-hurt-as-toughness story. Its reframe is **clinically gated** and may be
  **conditionally withheld** (§6). It is football's analog of golf's `first-tee`
  (shank/yips) and baseball's `lose-command` (throwing-yips) umbrella — the cell
  where the body's involuntary stakes outrun a hand-authored reframe.
- **#3 "I make a mistake on film"** is football-distinct: the install/film-room
  culture means a bust is *reviewed in front of the room*, which is its own kind
  of exposure (closest to golf's "four hours alone with your card," inverted —
  here the whole unit watches).

**What got folded (not standalone cells):**
- **The dropped pass / the missed tackle** are *role readings of* "I make a
  mistake on film" (#3) and "I get beat" (#2) — a WR's drop and a DB's missed
  tackle are the same exposure category through different identities, flavored
  per role in §4, not separate cells.
- **The penalty (the flag that wipes the play / extends a drive)** lives inside
  "I make a mistake on film" (#3) as an intensifier, not its own cell.
- **The sack allowed** is the OL/QB reading of "I lose a battle in the trenches"
  (#10) and "I give up the big play" (#4); flavored per role, not a cell.
- **The missed kick / shanked punt** is reserved for the future **Specialist**
  role (§1), NOT folded into the seven — it does not map cleanly onto any of
  them.

> **Model (a), recommended (like baseball / golf §3):** one shared 10-list +
> per-role scripts + label-only `roleAdversities` overrides + a small set of
> per-role **key reroutes** (§5, where a role genuinely doesn't have a cell — a
> QB never fights a trench battle the way a lineman does). Do NOT author 7
> disjoint 10-lists (model b) — it 7×s the surface and breaks the parameterized
> integrity test. "I get beat" is "I get beat"; the QB getting picked and the DB
> getting burned are the *same category* read through different identities — a
> per-role **script**, not a separate cell. The goalie-pulled / Big-fouled-out /
> pitcher-error / golf-`first-tee` precedents prove shared-label-with-per-role-
> override is right.

---

## 4. The 7×~10 grid — per-role manifestation (67 authored cells)

One line per cell: how that adversity hits THAT role, so the script stage writes
distinct, role-true scripts. ⚠ = clinical gate on the reframe (§6).
⚠⚠ = big-hit / contact-injury territory (highest gate; competitive-courage layer
ONLY, conditional withhold). ★ = identity-level phrase the script must render as
a *false story to reject*, never as the label.

**Cell counts per role (67 total):** QB 9, RB 10, WR 10, OL 9, DL 9, LB 10,
DB 10. The drops/reroutes (§5) account for the off-10 roles: QB drops the
literal `trench-battle` (rerouted to a QB-true `qb-pick` flavor and folded — see
§5), and OL and DL each drop the literal skill-position `turnover` (rerouted to
their trench cell). Where a role plays all ten, it ships all ten.

### QB (locus: over-press / hero-throw) — 9 cells
1. **Turnover → the pick** *(relabel "I throw a pick" / "I throw a pick-six")* — the ball you forced into coverage, six the other way; ★"I always force it when it matters." ⚠
2. **Get beat** — read it wrong, the coverage rotated and you never saw the robber; "I got fooled."
3. **Mistake on film** — the wrong check, the blown protection ID, the bust the whole room watches Monday. ⚠
4. **Give up the big play** — the deep ball you hung up, the strip-sack returned; the swing play that flipped it. ⚠
5. **Benched → pulled** *(relabel "I get pulled")* — the hook after two bad series, the backup warming up, the headset taken; ★"if I get pulled, I'm done here." 
6. **Nervous** — first start, the crowd, the third-and-long with the game on it; "what if I throw it here." *(reframe: "you don't need the perfect throw — take the completion in front of you.")*
7. **Big hit** — the blindside sack, getting drilled in the pocket and having to stand back in there next snap. ⚠⚠ *(competitive courage only — see §6)*
8. **Start slow** — three-and-out, three-and-out, the offense stalled and the booing starts; "settle the feet before this buries us."
9. **Fall behind early** — down 14 in the first, starts pressing every throw to climb out single-handed; the exact opposite of what the moment needs.
   *(QB drops the literal trench-battle cell — he doesn't fight at the point of attack; that pressure is read into #4/#7. See §5.)*

### RB (locus: press / bounce-everything) — 10 cells
1. **Turnover → the fumble** *(relabel "I put the ball on the ground")* — the cough-up at the goal line, the strip in traffic; ★"they can't trust me with it." ⚠
2. **Get beat** — whiffed the blitz pickup, your back got your QB killed; "I had one job in protection."
3. **Mistake on film** — wrong gap, missed the check, the cut that should've been the read. ⚠
4. **Give up the big play** — the missed block that sprung the sack-fumble; the play that turned because of you. ⚠
5. **Benched** — the carries went to the other back, you're on the sideline watching your touches go away; ★"they're phasing me out."
6. **Nervous** — first carry of a big game, ball security on the brain; "don't put it on the ground." *(reframe: "two hands, take what's there.")*
7. **Big hit** — the de-cleater in the hole, the linebacker filling downhill; getting back up and asking for the next carry. ⚠⚠ *(competitive courage only — see §6)*
8. **Start slow** — stuffed on the first few carries, the run game cold; "trust the gap, the yards will come."
9. **Fall behind early** — down two scores, the run game gets shelved, starts bouncing everything for the home-run instead of the tough four. ★"if we're not running, I don't matter."
10. **Trench battle** — beaten on the short-yardage dive, stuffed at the goal line, the back's version of losing at the point of attack.

### WR (locus: target-hunger / drop-spiral) — 10 cells
1. **Turnover** — the catch-and-fumble after the grab, or the tipped ball that became a pick; "I had it and gave it away." ⚠
2. **Get beat** — the corner blanketed you all day, jammed at the line, never got off press; "he owned me."
3. **Mistake on film** — wrong route, wrong depth, the bust that left the QB throwing to nobody. ⚠
4. **Give up the big play** — the route you rounded that got picked, the block you missed on the screen. ⚠
5. **Benched** — the targets and the snaps went to the other guy; ★"if I'm not getting the ball, what am I out here for."
6. **Nervous** — the ball coming your way in the moment, hands tight; "what if I drop this one." *(reframe: "late hands, look it in — run the route, the catch follows.")*
7. **Big hit** — the crossing route over the middle, the safety teeing off; going back across the middle next time anyway. ⚠⚠ *(competitive courage only — see §6)*
8. **Start slow** — targeted early and dropped it / nothing thrown your way; "stay in the route, your number's coming."
9. **Fall behind early** — pressing for targets to spark the comeback, freelancing routes, drifting off the called concept.
10. **Trench battle** — the WR's version: beaten on the stalk/crack block, the perimeter run that died because you lost your man.
    *(★"one drop and I'm done for the day" — the drop-spiral story — is the WR's signature false story to reject across #1/#3/#6.)*

### OL (locus: anonymous-until-blamed / over-set) — 9 cells
1. **Get beat** — the rep where your guy won clean, beat you inside or with speed; the exposure of the one thing nobody notices until it fails. ★"nobody knows my name until I lose."
2. **Mistake on film** — the missed assignment, the wrong slide, the blitz you didn't pass off — and now it's the teaching clip. ⚠
3. **Give up the big play** — the sack you allowed that became a strip, the pressure that ended the drive; your number in the box score for the wrong reason. ⚠
4. **Benched** — the rotation took your reps, the younger tackle is in; the quiet demotion no stat sheet explains.
5. **Nervous** — first start at left tackle, the speed rusher across from you, the whole pass-pro on your island; "what if I get him killed." *(reframe: "hands inside, anchor — win this rep, not the game.")*
6. **Big hit** — the bull rush that put you on your back, the rep you got pancaked on the cut-up for the whole room to see; getting back in your stance. ⚠⚠ *(competitive courage only — see §6)*
7. **Start slow** — beaten on the first series, the edge rusher feeling fast; "settle the feet, the second rep is yours."
8. **Fall behind early** — the offense goes pass-heavy obvious, the rush pins its ears back, the pressure mounts; over-setting and lunging to compensate.
9. **Trench battle** — *(canonical reroute target — see §5)* — beaten at the point of attack, blown off the ball in the run game, the rep where the play died at your gap; the lineman's core adversity. ★"I got moved off the ball." ⚠
   *(OL drops the literal skill-position `turnover` — a lineman doesn't carry the ball; that cell reroutes to `trench-battle` per §5.)*

### DL (locus: freelance / chase-the-sack) — 9 cells
1. **Get beat** — reached, hooked, or driven off the ball; your one-on-one won by the man across from you. ★"he handled me all day."
2. **Mistake on film** — out of your gap, the cutback lane you gave up freelancing for the sack; the bust the D-line coach circles. ⚠
3. **Give up the big play** — the QB escaped your rush lane, the screen you ran yourself out of, the long TD on the play you abandoned your gap. ⚠
4. **Benched** — the rotation pulled you for fresh legs, the snaps thinning; "if I'm not producing, I'm off the field."
5. **Nervous** — third-and-long, everyone expecting the rush, you on the edge one-on-one; "what if I get stoned here." *(reframe: "get off on the ball — win the get-off, the rest follows.")*
6. **Big hit** — the double-team that buried you, the cut block at the knees, the trap that de-cleated you; reloading and getting off on the next snap. ⚠⚠ *(competitive courage only — see §6)*
7. **Start slow** — no push early, the run game working you; "win the get-off, the sacks come later."
8. **Fall behind early** — the offense gets pass-happy, you start pinning your ears back and freelancing for the strip-sack, giving up the draw and the scramble lane.
9. **Trench battle** — *(canonical reroute target — see §5)* — beaten at the point of attack, reached and sealed, the run lane that opened because you lost your gap; the D-lineman's core adversity. ⚠
   *(DL drops the literal skill-position `turnover`; it reroutes to `trench-battle` per §5.)*

### LB (locus: over-pursuit / guess) — 10 cells
1. **Turnover** — the fumble you couldn't corral, the tipped pick you dropped; "I had the takeaway and gave it back."
2. **Get beat** — beaten in coverage by the back/tight end, lost in the zone; "I bit on the play-action."
3. **Mistake on film** — the wrong gap fit, the false step, the run that hit where you should've been. ⚠
4. **Give up the big play** — the screen you over-ran, the wheel route you lost, the explosive that went through your fit. ⚠
5. **Benched** — the nickel package took you off the field, the reps went to the coverage 'backer; "I'm a two-down player now."
6. **Nervous** — green-dot, the defense in your headset, the call on you; "what if I get us lined up wrong." *(reframe: "read your keys — trust the fit, don't guess.")*
7. **Big hit** — meeting the pulling guard in the hole, the block you took on to make the tackle; getting up and fitting it again. ⚠⚠ *(competitive courage only — see §6)*
8. **Start slow** — out of position early, a step late to the fit; "back to your keys, the reads will come."
9. **Fall behind early** — starts guessing the play pre-snap to make a splash, over-running fits, getting caught in the wash.
10. **Trench battle** — taking on the lead block, getting washed out by the down lineman or the puller; the second-level version of losing the point of attack.

### DB (locus: grab / gamble) — 10 cells
1. **Turnover** — the pick you dropped, the punt you muffed, the strip you couldn't finish; "I had the ball and let it go."
2. **Get beat** — burned deep, beaten on the double-move, the corner's nightmare in the open; ★"he's been in my head since the first route."
3. **Mistake on film** — the blown coverage, the wrong leverage, the bust everyone sees on the all-22. ⚠
4. **Give up the big play** — the six over the top, the TD with you trailing; the explosive that's entirely on you, alone, in space. ⚠
5. **Benched** — beaten enough that the other corner's in, the safety help shaded your way; "they don't trust me on the island anymore."
6. **Nervous** — their best receiver, prime time, man coverage, no help; "what if he beats me deep." *(reframe: "eyes on your key — trust your technique, play the next ball.")*
7. **Big hit** — coming up to fill in run support, taking on the lead block / the crackback; the corner who'll still tackle. ⚠⚠ *(competitive courage only — see §6)*
8. **Start slow** — beaten early and rattled, the receiver feeling it; "short memory — the next snap is clean."
9. **Fall behind early** — the offense throwing to climb back, starts gambling for the pick and grabbing routes, leaving the top off the coverage.
10. **Trench battle** — the DB's run-support version: losing the edge / the force, getting kicked out or reached on the perimeter run.
    *(★"once a receiver's in my head the whole game's gone" — the burn-replay story — is the DB's signature false story to reject; the corner's amnesia is the whole game, per §2.)*

> **Relabel-risk note (sports-psych):** #6 nervous, #8 start slow, #9 fall-behind
> are most prone to one generic script across all seven roles. Keep them, but the
> script stage must author role-distinct (see the per-role reframe cues above).
> #7 big-hit is the relabel risk in the *other* direction — it must NOT be
> flattened into generic "courage" across roles, and it carries the §6 contact-
> injury gate; the QB-in-the-pocket hit, the RB-in-the-hole hit, and the DB-in-
> run-support hit are different competitive-courage moments and different gate
> reads.

---

## 5. Slug scheme (multi-sport-safe) + fragment map + per-role drops/reroutes

Hockey = `session-{role}-{frag}`; basketball = `bb-{role}-{frag}`; baseball =
`bsb-{role}-{frag}`; golf = `glf-{role}-{frag}`. **Football owns its own
prefix — `ftb-` for the composite cell key, `hm-ftb-` for the hard-moment clip**
(the same hm-/composite split baseball and golf use: `cellSlugFor` returns the
`ftb-*` composite key; the audio stage renders both `hm-ftb-{token}-{frag}` and
the full `ftb-{token}-{frag}` composite). Three-letter `ftb-` avoids any
"football"/"foot" ambiguity and parallels `bsb-`/`glf-`.

**Role slug tokens** (lowercased role): `qb`, `rb`, `wr`, `ol`, `dl`, `lb`, `db`
(+ reserved future `sp`).

**Fragment map (`FOOTBALL_ADVERSITY_SLUG_FRAGMENTS`):**

```
"I turn the ball over."             → "turnover"
"I get beat."                       → "beat"
"I make a mistake on film."         → "film-mistake"
"I give up the big play."           → "big-play"
"I get benched."                    → "benched"
"I feel nervous."                   → "nervous"
"I take a big hit."                 → "big-hit"
"I start slow."                     → "start-slow"
"We fall behind early."             → "fall-behind-early"
"I lose a battle in the trenches."  → "trench-battle"
```

**Per-role drops & key reroutes** (unlike golf, football is NOT uniform — some
roles genuinely don't have a cell, the pitcher-error precedent):

| Role | Drop / reroute | Mechanism |
|---|---|---|
| **QB** | drops literal `trench-battle` (a QB doesn't fight at the point of attack) → **reroute to a QB-true `qb-pick` flavor**; `turnover` **relabel → "I throw a pick"**; `benched` **relabel → "I get pulled"** (`pulled`) | reroute = `cellSlugFor` maps QB × `trench-battle` to the `qb-pick` key so no orphan clip; turnover/benched relabels are label-only on the same `turnover`/`benched` keys |
| **RB** | `turnover` **relabel → "I put the ball on the ground" (fumble)** | label-only on the `turnover` key |
| **OL** | drops literal `turnover` (a lineman doesn't carry the ball) → **reroute to `ol-trench-battle`** | the canonical-key reroute: `cellSlugFor` maps OL × `turnover` to the `trench-battle` key |
| **DL** | drops literal `turnover` → **reroute to `dl-trench-battle`** | same canonical-key reroute as OL |

```ts
// Per-role reroute table (the pitcher-error precedent: a cell that does not
// exist for a role maps to that role's nearest canonical key, so no orphan clip
// and the integrity test stays parameterized).
const FOOTBALL_KEY_REROUTES: Partial<Record<Role, Record<string, string>>> = {
  QB: { "trench-battle": "qb-pick" }, // QB has no point-of-attack fight; folds to the pick flavor
  OL: { turnover: "trench-battle" },  // a lineman doesn't carry the ball
  DL: { turnover: "trench-battle" },  // a lineman doesn't carry the ball
};

cellSlugFor(adversity, role) {
  const frag = FOOTBALL_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "beat";
  const roleStr = role ? role.toLowerCase() : "qb";
  const rerouted = FOOTBALL_KEY_REROUTES[role]?.[frag] ?? frag;
  return `ftb-${roleStr}-${rerouted}`; // e.g. ftb-ol-trench-battle for OL × turnover
}
```

**`roleAdversities` overrides (label-only relabels + the drops):**
- **QB:** relabel `turnover` → "I throw a pick," `benched` → "I get pulled."
  Drop `trench-battle` from the picker (rerouted to `qb-pick`; no selectable
  trench cell for the QB).
- **RB:** relabel `turnover` → "I put the ball on the ground."
- **WR:** relabel `beat` → "A corner shuts me down," `turnover` → "I cough it up
  after the catch" (Receiver-true wording on the same keys).
- **OL:** drop `turnover` from the picker (rerouted to `ol-trench-battle`);
  relabel `beat` → "My guy wins the rep."
- **DL:** drop `turnover` from the picker (rerouted to `dl-trench-battle`);
  relabel `beat` → "I get reached / hooked."
- **LB:** relabel `trench-battle` → "I get washed out by a block."
- **DB:** relabel `beat` → "I get burned," `trench-battle` → "I lose the edge
  in run support."

(All relabels keep `key` = the canonical adversity string so `cellSlugFor` +
`state.adversity` resolve the same `ftb-*` cell — the same mechanism hockey /
baseball / golf use. Drops remove the entry from the `roleAdversities` array; the
reroute means the dropped key still resolves to a real authored clip.)

**Authored hard-moment grid — 67 cells:**
- `ftb-qb-{pick, beat, film-mistake, big-play, pulled, nervous, big-hit*, start-slow, fall-behind-early}` + `ftb-qb-qb-pick` reroute target = **9** (no literal trench cell)
- `ftb-rb-{turnover(fumble), beat, film-mistake, big-play, benched, nervous, big-hit*, start-slow, fall-behind-early, trench-battle}` = **10**
- `ftb-wr-{turnover, beat, film-mistake, big-play, benched, nervous, big-hit*, start-slow, fall-behind-early, trench-battle}` = **10**
- `ftb-ol-{beat, film-mistake, big-play, benched, nervous, big-hit*, start-slow, fall-behind-early, trench-battle}` = **9** (turnover rerouted in)
- `ftb-dl-{beat, film-mistake, big-play, benched, nervous, big-hit*, start-slow, fall-behind-early, trench-battle}` = **9** (turnover rerouted in)
- `ftb-lb-{turnover, beat, film-mistake, big-play, benched, nervous, big-hit*, start-slow, fall-behind-early, trench-battle}` = **10**
- `ftb-db-{turnover, beat, film-mistake, big-play, benched, nervous, big-hit*, start-slow, fall-behind-early, trench-battle}` = **10**

`*` = `big-hit` is authored for every role but ships **competitive-courage layer
only** and is **conditionally withheld** from the picker for any role whose
big-hit reframe cannot stay on the competitive-courage layer (§6). The hard-moment
clips are `hm-ftb-{token}-{frag}`; the composite playlist cells are
`ftb-{token}-{frag}`. The parameterized integrity test asserts this 67-cell grid,
the QB/OL/DL reroutes, and the big-hit withholds.

---

## 6. Clinical gate (sports-psychologist) — for the reframe stage

**All 10 labels are normal competitive adversities, safe to ship as SITUATIONS
with reframes deferred.** The care lives in the *reframe*. As in baseball and
golf, the taxonomy is safe because it labels every cell **neutrally** (the
situation), never as a medical event, and keeps the catastrophic story as a
*false story to reject*. These cells sit nearest contact-injury / contingent-
self-worth / performance-anxiety territory and their reframe **must be
sports-psychologist-authored, explicitly age-calibrated, and routed past the
credentialed advisor when seated.** *(The sports-psychologist is a drafter, not a
licensed clinician; this gate exists so credentialed sign-off is structurally
enforced, not remembered.)*

**⚠⚠ HIGHEST — the big hit (#7, all roles) — COMPETITIVE COURAGE ONLY, never
the medical layer (route; do NOT glibly hand-author):**
Football's `big-hit` cell is the sport's signature physical-courage moment AND
the place the content can do real-world harm if it slips off the competitive
layer. **Hard rules:**
1. **It ships as competitive courage ONLY** — the chosen willingness to be
   physical, to get back up, to line up for the next snap after a clean, hard,
   legal hit. The good imagery is *electing* contact, not *enduring* injury.
2. **It NEVER touches concussion, head injury, "play through your head
   ringing," "shake it off," "be tough," or any playing-hurt-as-toughness
   story.** This is the single hardest line in the football track: the culture
   glorifies exactly the message we must not send. A reframe that even implies
   minimizing a head injury, hiding symptoms, or out-toughing pain is
   **out of bounds** and routes to a credentialed read before any ship.
3. **Conditional withhold (FV-119 / baseball-yips / golf-first-tee precedent):**
   for **any role whose big-hit reframe cannot be kept strictly on the
   competitive-courage layer** without brushing concussion/playing-hurt, the
   `big-hit` cell is **authored but WITHHELD from the selectable adversities via
   `roleAdversities` omission** until the clinical advisor (CLAUDE.md Open Items)
   clears it. The clip stays authored at `ftb-{role}-big-hit` so the grid is
   complete and the integrity test asserts the withhold; it is simply not offered
   to the athlete until a credentialed advisor reads the reframe. Route to
   sports-psychologist + the pending clinical advisor; do NOT let the
   football-expert hand-author the reframe.
4. **The real-world prompt is allowed and encouraged:** identity-anchoring
   ("getting up is courage; you are not your last hit") plus a prompt to tell a
   trainer / coach / parent about anything that doesn't feel right physically.
   The content must make reporting an injury read as strength, never weakness.

**⚠⚠ ALSO HIGHEST — Offensive Line body composition / mass-gain — FLAG AND
ROUTE, NEVER A CELL:**
OL identity is bound up with size and "getting bigger," which brushes
disordered-eating / body-image territory for minors. **There is NO `body-comp`
or "I need to get bigger" cell, and no reframe may instruct, praise, or imply a
weight-gain or weight-loss target.** If any OL script drifts toward body
composition, mass-gain, "eat to get to 300," or weight as worth, it is
**flagged and routed** to the sports-psychologist + the crisis-resource path the
kids-privacy-officer governs (Option C) — it is never hand-authored as content.
This is a standing guardrail on the entire OL column.

**⚠ HIGH — global-verdict / identity-level risk (ship, but the reframe is gated
and must be sports-psychologist-authored + age-calibrated):**
1. **Turnover (#1) — QB pick / RB fumble, all giveaway cells.** The giveaway
   that swings the game is exactly contingent-self-worth + rumination ("I always
   force it," "they can't trust me with the ball"). The reframe's job is to break
   the compound — stop the next-snap hero-throw / bounce-everything cascade, not
   erase the turnover ("the pick is on the film; it is not on you. The next snap
   is a new down.").
2. **Mistake on film (#3), all roles.** Football-distinct: the bust is reviewed
   *in front of the unit*. The risk is the shame-spiral of being the teaching
   clip; the reframe keeps it event-level and blocks ★"the whole room thinks I'm
   a liability."
3. **Give up the big play (#4) — DB six over the top, OL sack-to-strip.** The
   explosive that's "entirely on me, alone, in space" (the DB) and the sack with
   your number on it (the OL) are the heaviest identity-level cells; the global
   "it's all on me" story is the risk, not the single play.
4. **Benched / pulled (#5), all roles.** The depth-chart demotion read as a
   verdict on worth; ★"they don't trust me anymore." Lands hardest at 16-18 (the
   recruiting band — see §7).

*Slow-arc cell (not in the 10, flagged for daily-training):* **the slump / "I
lost my starting job."** The stretch where the reps don't come back, the depth
chart slides, the confidence is gone for weeks. It is a slow-arc trigger, not a
between-snaps one, so it lives in daily-training with a Locate → Reclaim →
Re-enter shape, not the pregame reset. Watch the line: "I lost my spot" is
normal; if a script tips toward *persistent hopelessness*, it is no longer
hand-authorable (see routing).

**Routing reminder (non-negotiable):** if any reframe drifts toward concussion
minimization, playing-hurt-as-toughness, persistent hopelessness, anhedonia
beyond a normal post-game week, self-harm-adjacent content, disordered eating /
body-image obsession (especially the OL column), or abuse (including from a coach
or football parent), it does NOT get hand-authored — it routes to the
crisis-resource path the kids-privacy-officer governs (Option C): 988 Suicide &
Crisis Lifeline, Crisis Text Line (text HOME to 741741), and a "talk to a trusted
adult" prompt. We are not a clinical service; the big-hit, OL body-comp, and
turnover/benched cells are the most likely to brush this line, so their scripts
get the tightest sports-psych guardrail and a credentialed read before ship.

---

## 7. Age calibration (one note for the script authors)

The 67 cells are one taxonomy; **register and stakes** shift across the band.
(Football structures change fast — **verify current details** before any cell
cites a mechanism: state high-school classification + playoff formats, 7-on-7
circuits, the recruiting calendar / contact periods, camp + combine timing,
NIL/transfer-portal rules at the college layer.)

- **13–15 — youth / middle-school / freshman football, the first real depth
  chart.** Concrete, low-jargon. Stakes are making the team, earning a starting
  spot, the first time you're on film, the first big hit. **The recruiting and
  depth-chart weight does NOT land here — keep it light.** Bind responsibility
  tightly ("your next snap, your next assignment"). The big-hit cell: framed as
  ordinary chosen toughness and getting back up, never a label, lean hardest on
  the §6 guardrail (and the "tell an adult if something doesn't feel right" prompt
  matters most at this age). Do not import 16-18 recruiting framing.
- **16–18 — varsity + the recruiting grind (contingent-self-worth PEAK).** The
  danger band: varsity depth charts, the camp circuit, 7-on-7, the offer / no-offer
  silence, the film that gets cut up for recruiters, the position battle that
  decides Friday nights and the scholarship. **This is where the depth-chart and
  recruiting weight lands** — the `benched` and `mistake-on-film` cells land
  hardest here ("the rep a coach is watching to decide the offer"). Every
  identity-level cell needs its most careful *worth-is-not-on-the-depth-chart*
  reframe here, and reframes must never add "you blew the offer" weight.
- **18–21 — college + the portal era (legal adults).** Autonomy and ownership:
  the two-deep, the scout-team grind, the transfer-portal decision, NIL, the
  position room politics, a coordinator with opinions about your future. Fully
  insider vocabulary is fine; do NOT use 18–21-only terms (the portal, NIL, the
  two-deep, scout team) in 13–15 content.

---

## 8. Downstream handoff & dependencies (all DORMANT pending KC go-live)

- **Clip scripts:** writes the 67 scripts from the §4 grid + 7 VIZ blocks + the
  §-Appendix practice-focus presets, through **content-curator + football-expert**
  (voice/authenticity) and **sports-psychologist** (§6 gated reframes) +
  **youth-pastor** (scripture). Apply the ★ must-fix tags and the §6 gate. Reuse
  the sport-neutral faith clips (openers, shared-opening, reset-plan, prayer,
  sendoff, cue words, self-talk). The `big-hit` reframe (competitive-courage line)
  and the OL body-comp guardrail are the must-route items.
- **Audio render:** renders + masters the 67 clips (ash voice, OpenAI TTS,
  EQ/master, spectral QA); derives `MANIFEST_VERSION`. **DORMANT** — no render
  until KC go-live.
- **Pre-practice "Lock In":** the football focus presets + opener + beats (see
  Appendix practice-focus candidates).
- **Daily training:** 30-day arc; the **slump / lost-my-spot** (§6) is the
  football-distinct daily-training topic flagged for the content trio +
  youth-pastor.
- **Enum:** adds `football` to the `Sport` union (`sport-registry.ts` /
  `lib/sports.ts`) + the DB sport CHECK constraint — only at go-live. Today
  football is intentionally **not** in `SUPPORTED_SPORTS`.
- **Routing / go-live:** football in the onboarding selector (`SUPPORTED_SPORTS`)
  + sport-aware content/pregame routing; populates `FOOTBALL_CONFIG` in
  `sport-registry.ts` from §5 and the Appendix. **Gated on KC go-live.**
- **QA:** the parameterized integrity test asserts football's 67-cell grid + the
  QB/OL/DL reroutes + the `big-hit` withholds + the label-only `roleAdversities`
  relabels.
- **Founder gate:** the launch-tier decision — **football stays DORMANT until
  audio render + clinical sign-off (the §6 big-hit + OL body-comp gates) + KC
  go-live**; logged here for the audit trail.

---

## 9. KC decision points — flagged for sign-off

1. **Roles:** 7 — **QB / RB / WR / OL / DL / LB / DB** (§1). Recommend confirm.
   Football is the most positional sport in the catalog; offense and defense are
   different games and neither side compresses below these seven. A **Specialist
   (K/P, `sp`)** is documented as a future eighth but recommended **OUT of v1**.
2. **Adversity model:** **Model (a)** — one shared 10-list + per-role scripts +
   label-only `roleAdversities` overrides + a small per-role key-reroute table
   (§3, §5). Recommend confirm; model (b) 7×s the surface and breaks the
   integrity test.
3. **Adversity count + drops:** **10** adversities, **67 authored cells**
   (QB 9, RB 10, WR 10, OL 9, DL 9, LB 10, DB 10). The hard calls: QB drops the
   literal trench cell (reroute → `qb-pick`); OL and DL drop the literal
   `turnover` (reroute → their trench cell); turnover/benched relabel per role
   (pick / pulled / fumble). Recommend confirm.
4. **Slug prefix:** **`ftb-`** composite / **`hm-ftb-`** hard-moment (§5).
   Recommend confirm (baseball owns `bsb-`, golf `glf-`, basketball `bb-`, hockey
   `session-`).
5. **Clinical gate (the withholds + guardrails):**
   - **Big hit (#7):** ships **competitive courage ONLY**, never the
     concussion/playing-hurt layer; **conditionally withheld** for any role whose
     reframe can't stay on the competitive layer, via `roleAdversities` omission
     until clinical-advisor sign-off — the FV-119 / baseball-yips / golf-first-tee
     pattern (§6). Recommend confirm.
   - **OL body composition / mass-gain:** **flag-and-route, NEVER a cell** —
     standing guardrail on the entire OL column (§6). Recommend confirm.
   - **Recruiting / depth-chart weight:** lands at **16-18, not 13-15** (§7).
     Recommend confirm.
6. **DORMANT status:** the whole football track stays **DORMANT** pending audio
   render + clinical sign-off + KC go-live (§8). Recommend confirm — football is
   NOT in `SUPPORTED_SPORTS` and ships no content until KC flips the gate.

---

## Appendix — Registry picker candidates (for the script / pre-practice / go-live work)

Football-true analogs of the hockey/basketball/baseball/golf picker lists, so the
`FOOTBALL_CONFIG` registry work has them ready. Final wording confirmed by
content-curator + football-expert at the script stage.

**Practice-focus presets (`practiceFocusOptions` → `pp-football-focus-*`):**
```
"Relentless"             → "pp-football-focus-relentless"
"Finish every rep"       → "pp-football-focus-finish-every-rep"
"Eyes up"                → "pp-football-focus-eyes-up"
"Win my one-on-one"      → "pp-football-focus-win-my-one-on-one"
"Full speed, full motor" → "pp-football-focus-full-speed-full-motor"
"Ball security"          → "pp-football-focus-ball-security"
"Next play"              → "pp-football-focus-next-play"
```
(7 presets, matching the other sports' count. "Ball security" and "Win my
one-on-one" are the football-distinct ones — ball security is the universal RB/
ball-carrier discipline; the one-on-one is the trench/coverage core. "Next play"
encodes the short-memory reset that is the whole football mental game.)

**Reset anchors (`anchors`):** "Long exhale", "Press thumb to palm", "Say cue
word" are shared/sport-neutral. Football-specific:
```
"Snap the chinstrap"
"Tap the helmet"
"Clap and break the huddle"   (re-set between plays)
```

**Self-talk (`selfTalkOptions`):** swap the sport-cadence line, keep the 6
sport-neutral.
```
"You're okay. Next play."          // (football cadence — replaces "Next shift/possession/at-bat/shot")
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
"Physical courage",                 // ← strong native fit in football (unlike golf)
"Better reads"                      // ← football swap (hockey "Better puck decisions")
"Leadership", "Joy", "Hope", "Be more Vocal"
```
> **Note for content-curator at the registry stage:** unlike golf, "Physical
> courage" is a **strong native fit** in football and should stay. The
> football-specific swap is **"Better reads"** (the QB/LB/DB diagnosis need),
> replacing hockey's "Better puck decisions." Keep the `NeedToday` union stable.

**`cueWordHelper`:** `"The one you'd say to yourself walking back to the huddle."`
(Football's reset window is the walk back to the huddle / to the line between
plays — the cue word lives there, not "between shifts"/"at the line"/"on the
walk to the next shot".)

**`cardShareHint`:** `"Screenshot it. Open it before kickoff."`

**Practice openers (`practiceOpenerSlugs`):** `"dialed-in"` reuses the
sport-neutral `pp-opener-dialed-in`; `"not-feeling-it"` → `pp-football-opener-get-to`
(authored at the pre-practice stage).

**`audioScript`:** the football text-mode script mirrors the
basketball/baseball/golf segment structure (segments 0/35/210/250/275
sport-neutral; 80/120/165 football-specific — "see the field / first snap / play
your position"). Until rendered, `FOOTBALL_CONFIG` can satisfy the type with the
shared `AUDIO_SCRIPT` placeholder, exactly as `BASEBALL_CONFIG` does today.

---

### Files referenced
- `docs/baseball-taxonomy-FV-93.md` — structural template (mirrored sections 1-9).
- `docs/golf-module-map.md` — most recent same-format precedent (mirrored shape).
- `.claude/agents/football-expert.md` — football domain knowledge source (the
  FV-200..208 football track).
- `apps/web/components/pregame/sport-registry.ts` — the `SportConfig` shape the
  go-live work populates `FOOTBALL_CONFIG` onto from §5 and the Appendix.
- `apps/web/lib/sports.ts` — the `SUPPORTED_SPORTS` / `Sport` union football
  joins only at go-live (today: NOT a member; football is DORMANT).
- `CLAUDE.md` — audience-language rules (athlete/player/you, never "kid") +
  brand spine.
- `docs/brand.md` — voice modes, words to use/avoid.
