# Track & Field — Post-Game "For the Ride Home" Module DRAFTS (FV-TRF)

**Status: DRAFTS for go-live wiring — NOT wired now.** Authored 2026-06-13.
Track & field is a **v2 / DORMANT** sport (launch is locked hockey + basketball,
FV-26). These five modules are the track & field analog of the live hockey /
basketball / golf postgame debrief set in
`apps/web/lib/postgame/modules.ts` (FV-225).

**Why these are DRAFTS, not committed code:** `PostgameModule.sport` is typed
against the **live `Sport` union** (`@/lib/sports`). Track & field is
intentionally NOT in that union yet (it joins `SUPPORTED_SPORTS` only at go-live
— see the track & field module-map §8 enum dependency). Wiring `sport:
"track-field"` today would not typecheck. These drafts are held here so the
go-live PR can paste them into `modules.ts` (as `TRACKFIELD_WIN`,
`TRACKFIELD_LOSS`, `TRACKFIELD_BENCHING`, `TRACKFIELD_BAD_GAME`,
`TRACKFIELD_PRAISE`, added to `POSTGAME_MODULES`) the moment the track & field
enum lands.

**Mirror discipline (matches the golf + swimming modules exactly):**
- Scenario types reuse the live `PostgameScenario` union: `win | loss |
  benching | bad-game | praise`.
- Track & field has **no team bench** — like golf and swimming, the `benching`
  and `bad-game` modules carry **`eyebrow` overrides** for individual-sport
  framing (golf's `benching` is "Didn't Qualify" / swimming's is "Didn't Make the
  Cut"; golf's `bad-game` is "The Bad Round" / swimming's is "The Bad Swim").
- Scripture is **VERBATIM NIV**, copied character-for-character from the existing
  modules in `modules.ts` (Psalm 34:18, Psalm 139:1-3, Lamentations 3:22-23,
  James 1:17, Habakkuk 3:17-18).
- `bodyMd` shape: `### What happened` / `### What's true`, a `>` blockquote reset
  line, the protect-lines preserved. ≤190-word body ceiling (praise / loss / win
  may run to the ≤220 individual-sport ceiling).
- Anti-prosperity discipline: NO turnaround / bounce-back / "claim it" / "God
  gives the mark back" language. Praise is IN the hard night, never FOR a better
  mark.
- **The RED-S body-composition rail honored** (track & field module-map §6): **NO
  weight / leanness / "racing weight" / food / body-composition language anywhere**
  — all references are to the race, the mark, the lean, the clock, the runway, the
  ring, never a body or a number on a scale.

**Trio + sign-off:** full trio cycle under content-curator orchestration —
youth-pastor (scripture + the Habakkuk "yet" engine + anti-prosperity guardrails)
+ sports-psychologist (ache-named-first, anti-bypassing, the no-height-adjacent
care on the bad-race module) + content-curator integration; standing track coach
texture (the lean at the line, the heat sheet, the blocks, the bus home, the
relay, the seed time, the runway, the ring, the foul). The **Praise Anyway**
module carries the `CLINICAL_SIGN_OFF_REQUIRED` note (below), the same as the live
golf/hockey/basketball praise modules. *(No track-field-expert agent exists — see
module-map §8; the texture pass here was a standing track coach, NOT a clinician.)*

---

## Module T-a — Track & Field · After the Win (scenario: `win`)

- **slug:** `track-field-after-the-win`
- **scenario:** `win`
- **title:** `After the Win`
- **eyebrow:** *(none — the default win eyebrow stands)*
- **scriptureRef:** `James 1:17`
- **scriptureText (verbatim NIV):**
  `Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.`

**bodyMd:**
```md
### What happened

You won. Maybe it was the PR, the win at the line, the relay your leg brought
home, or the mark that finally came. The body's still buzzing.

Good. Sit in it. Name what actually went right — the reps that built it, the
start you nailed, the teammate on the next leg, the work nobody saw.

### What's true

The clock couldn't drop you after a race that got away, and it can't crown you
after this. That's the freedom.

Every good gift comes down from a Father who doesn't change like shifting
shadows. The race, the mark, this whole meet — gift, not wages. God didn't hand
you the result because you earned it; the win and your standing with Him were
never on the same results page. The Father you'd thank tonight is the same One
who was close in the car after the race that got away. He didn't change. Only
the number did.

Enjoy it tonight, then let it rest — the mark doesn't owe you a sequel. And win
like someone who's come up short before, who knows the next meet can go the
other way.

> The win is real. It is not the crown on you.

Take the mark — and let the thank-you travel past the results page.
```
*(Word count: ~190, within the ≤220 individual-sport ceiling. Rails: no body /
weight / leanness reference. Anti-prosperity: "gift, not wages," "God didn't hand
you the result because you earned it," "never on the same results page" —
directly mirrors the golf / swimming win modules' seam. Texture: the PR, the win
at the line, the relay, the mark that finally came.)*

---

## Module T-b — Track & Field · The Loss (scenario: `loss`)

- **slug:** `track-field-the-loss`
- **scenario:** `loss`
- **title:** `After the Loss`
- **eyebrow:** *(none — the default loss eyebrow stands)*
- **scriptureRef:** `Psalm 34:18`
- **scriptureText (verbatim NIV):**
  `The Lord is close to the brokenhearted and saves those who are crushed in spirit.`

**bodyMd:**
```md
### What happened

You got beat. Maybe the race got away on the last stretch, maybe you got
out-leaned at the line by inches, maybe your name sat too low on the heat sheet
to matter. Now it's just you, the long bus home, and a quiet you can't talk your
way out of.

Let it be what it is. A loss is allowed to hurt. The clock doesn't care how many
reps it cost — it just posts the number, and that's a lonely kind of sting. It
mattered. That's why it aches.

### What's true

Here's what the race doesn't get to do: it doesn't get to tell you who you are.
The clock reports what happened on the track. It can't reach the part of you
that's settled in Christ.

The Psalms don't rush you past this. David wrote that God is *close* to the
brokenhearted — not impressed by the ones who shrug it off, close to the ones
who feel it. He's near you tonight, on the bus, in the quiet.

So feel it tonight. You're not asked to feel it forever.

> The loss is real. It is not the verdict on you.

Tomorrow the track is waiting and so is the next race. Tonight, you're already
held.
```
*(Word count: ~205, within the ≤220 ceiling. Required phrases present: "not
impressed by the ones who shrug it off" and "You're not asked to feel it
forever." Reset blockquote: "The loss is real. It is not the verdict on you."
Texture: the race that got away, getting out-leaned, the long bus home, the heat
sheet. Rails: no body / weight reference.)*

---

## Module T-c — Track & Field · Didn't Make the Relay (scenario: `benching`, eyebrow override)

- **slug:** `track-field-didnt-make-the-relay`
- **scenario:** `benching`
- **title:** `Didn't Make the Relay`
- **eyebrow:** `Off the Squad`  *(track & field has no bench — overrides the
  default "The Bench"; the golf "Didn't Qualify" / swimming "Didn't Make the Cut"
  precedent. Alternate wording on file: "Didn't Make the Relay" — KC's call at
  wiring.)*
- **scriptureRef:** `Psalm 139:1-3`
- **scriptureText (verbatim NIV):**
  `You have searched me, Lord, and you know me. You know when I sit and when I rise; you perceive my thoughts from afar. You discern my going out and my lying down; you are familiar with all my ways.`

**bodyMd:**
```md
### What happened

Your time wasn't fast enough. The relay got set and your name wasn't on it — or
you didn't make the travel squad, or your seed left you off the regional team.
Now you're in the car and the question won't quit: *am I even fast enough for
this?*

That's a real question, and it's a hard seat. You're allowed to be frustrated.
Doing the work and missing the spot by a tenth is its own kind of loud.

### What's true

But hear the trap in it. A seed time can decide your spot this week. It cannot
decide your worth. Those are two different things, and the night keeps trying to
blur them.

David wrote Psalm 139 about a God who already knows him completely — sitting,
rising, every honest corner. Your time got read. *You* didn't. The One who
matters most has known you all the way down since long before this week's
results.

> A coach reads your seed time. He doesn't write who you are.

Tomorrow you can ask what it takes to make it next time. Tonight, you're already
known.
```
*(Word count: ~195, within ceiling. eyebrow handles the individual-sport framing.
Reset blockquote: "A coach reads your seed time. He doesn't write who you are." —
mirrors golf's "A coach reads your card. He doesn't write who you are." and
swimming's "A coach reads your seed time. He doesn't write who you are." Texture:
left off the 4x4, didn't make the travel squad / regional team, seed wasn't fast
enough — the individual-sport benching analog. Rails honored.)*

---

## Module T-d — Track & Field · The Race That Fell Apart (scenario: `bad-game`, eyebrow override)

- **slug:** `track-field-the-race-that-fell-apart`
- **scenario:** `bad-game`
- **title:** `The Race That Fell Apart`
- **eyebrow:** `The Bad Race`  *(track & field runs races / contests attempts, not
  games — overrides the default "The Bad Game"; the golf "The Bad Round" /
  swimming "The Bad Swim" precedent.)*
- **scriptureRef:** `Lamentations 3:22-23`
- **scriptureText (verbatim NIV):**
  `Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.`

**bodyMd:**
```md
### What happened

You couldn't find it today. The false start that ended it before it began, the
no-height that left you with nothing, the race you tied up in and watched the
field go. You replayed it on the walk back to the tent, and you're replaying it
now, and your head only keeps the worst of it.

That loop is normal. A meet like that earns a little ache. Don't fake being fine.

### What's true

But watch what the loop is doing. It's taking what *happened* and quietly turning
it into who you *are*. *I'm done. I've got nothing.* That's the lie under the
replay, and it's louder at night.

Lamentations was written from real wreckage — a city in ruins, no spin on it. And
right in the middle, the writer says God's mercies are *new every morning.* Not
earned by a better race. New tomorrow because He is faithful, not because you
were.

> A bad race is information. It is not your identity.

Hit the track tomorrow with clear eyes. Tonight, the morning's already coming.
```
*(Word count: ~190, within ceiling. Required phrase present: "Don't fake being
fine." Reset blockquote: "A bad race is information. It is not your identity." —
mirrors golf's "A blow-up round is information. It is not your identity." and
swimming's "A bad swim is information. It is not your identity." Texture: the
false start / DQ, the no-height, the race you tied up in, the replay loop. Note:
this is the postgame, single-meet ache — distinct from the season-long NO-HEIGHT
cell, which is WITHHELD and clinically gated in the pregame taxonomy §6; this
module stays at the single-bad-meet level and must not drift into the no-mark-
season verdict. Rails: no body / weight reference.)*

---

## Module T-e — Track & Field · Praise Anyway (scenario: `praise`) — `CLINICAL_SIGN_OFF_REQUIRED`

> **CLINICAL_SIGN_OFF_REQUIRED:** this module (and its hockey/basketball/golf/
> swimming mirrors) reaches a minor at a night-time, post-loss low point. It must
> NOT roll out to a broad athlete base before the pending clinical-advisor sign-off
> (CLAUDE.md Open Items; tracked alongside the golf FV-296 gate). The content
> itself names the ache, permits it, and never forces a bypass — but the clinical
> gate is a standing requirement, not satisfied by this draft. `grep
> CLINICAL_SIGN_OFF_REQUIRED` for all such modules. Highest anti-prosperity
> guardrail load in the app — the FV-225 banned-pattern scan covers it.

- **slug:** `track-field-praise-anyway`
- **scenario:** `praise`
- **title:** `Praise Anyway`
- **eyebrow:** *(none — the default praise eyebrow stands)*
- **scriptureRef:** `Habakkuk 3:17-18`
- **scriptureText (verbatim NIV, FULL string):**
  `Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior.`

**bodyMd:**
```md
### What happened

The race never came. You're in the car — or the back of the bus — gear still
packed, the window dark, the slow number still sitting behind your eyes.

And you might still feel bad tonight, and that's okay. Name the ache first.
Don't talk yourself out of it.

### What's true

Habakkuk looked at empty fields and ruined vines and said *yet I will rejoice* —
not because the harvest came, but because his God hadn't moved.

> Praise on a hard night is real. It is not a trade for a better one.

That's the whole thing. You're not praising to earn a faster mark next time.
You're praising because He's good — and those were never the same thing.

Nothing on the results page changes when you say it. The same God you'd thank
after your best race is the same God in this quiet car. He didn't change. Only
the night did.

So lean on Him, not on yourself. The thank-you isn't gritted teeth — it's weight
handed over.

Say the thank-you with empty hands — and mean it.
```
*(Word count: ~180, within the ≤220 praise ceiling. All required phrases present:
"Name the ache" first; "you might still feel bad tonight, and that's okay";
blockquote "Praise on a hard night is real. It is not a trade for a better one.";
"You're not praising ... because He's good — and those were never the same
thing."; "He didn't change. Only the night did."; "yet I will rejoice"; closer
"Say the thank-you with empty hands — and mean it." Anti-prosperity: "You're not
praising to earn a faster mark next time" — praise IN the loss, never FOR a better
mark; no turnaround / bounce-back / claim-it language. Rails: no body / weight
reference.)*

---

## Wiring checklist (for the go-live PR — DO NOT run now)

When the track & field enum lands in `@/lib/sports` (module-map §8), the go-live
PR:
1. Pastes the five modules above into `apps/web/lib/postgame/modules.ts` as
   `TRACKFIELD_WIN`, `TRACKFIELD_LOSS`, `TRACKFIELD_BENCHING`,
   `TRACKFIELD_BAD_GAME`, `TRACKFIELD_PRAISE` (constant style + header comments
   matching the golf block).
2. Adds them to the `POSTGAME_MODULES` array in scenario order (win → loss →
   benching → bad-game → praise), grouped after the golf block.
3. Confirms `modulesForSport("track-field")` returns the five and the picker page
   resolves (it 404s/redirects gracefully today because the array is empty for
   track & field).
4. Re-runs the FV-225 anti-prosperity banned-pattern scan over the new bodies
   (highest load on `track-field-praise-anyway`).
5. Routes the `track-field-praise-anyway` module through the
   `CLINICAL_SIGN_OFF_REQUIRED` gate before any broad rollout.
6. **Verifies the RED-S body-composition rail** over the final copy: NO weight /
   leanness / "racing weight" / food / body-composition language anywhere.
7. kids-privacy-officer review (privacy-sensitive path: `apps/web/**`) +
   qa-reviewer before merge. Tier-2 (athlete-facing brand/voice CONTENT) —
   KC-gated.
8. **Confirms the agent-roster prerequisite (module-map §8):** a
   `track-field-expert` agent should be recruited / created before go-live to run
   the script-verification pass; this draft's texture was a standing track coach
   stopgap.

### Files referenced
- `apps/web/lib/postgame/modules.ts` — the live registry these mirror; paste
  target at go-live (`PostgameModule` shape, `PostgameScenario` union,
  `POSTGAME_MODULES`, `modulesForSport`, `eyebrow` override mechanism).
- `docs/golf-module-map.md` + the live `GOLF_*` modules — the non-positional
  individual-sport precedent (eyebrow overrides, the loss/benching/bad-game/win/
  praise set).
- `fv-trackfield-module-map.md` — the FV-TRF taxonomy (the §8 enum dependency that
  gates wiring; the §6 no-height withhold + the RED-S rail these drafts honor; the
  §8 no-track-field-expert note).
- `docs/swimming-postgame-drafts.md` — the most recent same-format individual-sport
  postgame-draft precedent (mirrored structure + the DRAFT-for-go-live framing).
- `CLAUDE.md` — audience language (athlete/runner/jumper/thrower/you, never
  "kid"), anti-prosperity discipline, brand spine.
- `docs/brand.md` — voice modes, words to use/avoid.
