# Swimming — Post-Game "For the Ride Home" Module DRAFTS (FV-281)

**Status: DRAFTS for go-live wiring — NOT wired now.** Authored 2026-06-13.
Swimming is a **v2 / DORMANT** sport (launch is locked hockey + basketball,
FV-26). These five modules are the swimming analog of the live hockey /
basketball / golf postgame debrief set in
`apps/web/lib/postgame/modules.ts` (FV-225).

**Why these are DRAFTS, not committed code:** `PostgameModule.sport` is typed
against the **live `Sport` union** (`@/lib/sports`). Swimming is intentionally
NOT in that union yet (it joins `SUPPORTED_SPORTS` only at go-live — see the
swimming module-map §8 enum dependency). Wiring `sport: "swimming"` today would
not typecheck. These drafts are held here so the go-live PR can paste them into
`modules.ts` (as `SWIMMING_WIN`, `SWIMMING_LOSS`, `SWIMMING_BENCHING`,
`SWIMMING_BAD_GAME`, `SWIMMING_PRAISE`, added to `POSTGAME_MODULES`) the moment
the `swimming` enum lands.

**Mirror discipline (matches the golf modules exactly):**
- Scenario types reuse the live `PostgameScenario` union: `win | loss |
  benching | bad-game | praise`.
- Swimming has **no team bench** — like golf, the `benching` and `bad-game`
  modules carry **`eyebrow` overrides** for individual-sport framing (golf's
  `benching` is "Didn't Qualify"; golf's `bad-game` is "The Bad Round").
- Scripture is **VERBATIM NIV**, copied character-for-character from the existing
  modules in `modules.ts` (Psalm 34:18, Psalm 139:1-3, Lamentations 3:22-23,
  James 1:17, Habakkuk 3:17-18).
- `bodyMd` shape: `### What happened` / `### What's true`, a `>` blockquote reset
  line, the protect-lines preserved. ≤190-word body ceiling (praise / loss / win
  may run to the ≤220 individual-sport ceiling).
- Anti-prosperity discipline: NO turnaround / bounce-back / "claim it" / "God
  gives the time back" language. Praise is IN the hard night, never FOR a better
  swim.
- **Both swimming safety rails honored** (swimming module-map §6): **NO
  breath-hold / hypoxic / underwater language** (RAIL 1 — all references are to
  the swim, the touch, the clock, never a held breath) and **NO weight / suit /
  food / body-composition content** (RAIL 2).

**Trio + sign-off:** full trio cycle under content-curator orchestration —
youth-pastor (scripture + the Habakkuk "yet" engine + anti-prosperity guardrails)
+ sports-psychologist (ache-named-first, anti-bypassing, the plateau-adjacent
care on the bad-swim module) + content-curator integration; swimming-expert
texture (the touch, the heat sheet, the ready room, the bus home, the relay, the
seed time, four turns and a wall). The **Praise Anyway** module carries the
`CLINICAL_SIGN_OFF_REQUIRED` note (below), the same as the live golf/hockey/
basketball praise modules.

---

## Module S-a — Swimming · After the Win (scenario: `win`)

- **slug:** `swimming-after-the-win`
- **scenario:** `win`
- **title:** `After the Win`
- **eyebrow:** *(none — the default win eyebrow stands)*
- **scriptureRef:** `James 1:17`
- **scriptureText (verbatim NIV):**
  `Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.`

**bodyMd:**
```md
### What happened

You won. Maybe it was the best time on the board, the cut you finally got,
or the relay your leg brought home. The body's still buzzing.

Good. Sit in it. Name what actually went right — the 5am sets that built it,
the turn you nailed, the teammate on the next leg, the work nobody saw.

### What's true

The clock couldn't drop you after a swim that added time, and it can't crown
you after this. That's the freedom.

Every good gift comes down from a Father who doesn't change like shifting
shadows. The swim, the body, this whole meet — gift, not wages. God didn't
hand you the drop because you earned it; the best time and your standing with
Him were never on the same heat sheet. The Father you'd thank tonight is the
same One who was close in the car after the swim that wouldn't drop. He didn't
change. Only the number did.

Enjoy it tonight, then let it rest — the time doesn't owe you a sequel. And
race like someone who's added before, who knows the next heat can go the other
way.

> The win is real. It is not the crown on you.

Take the swim — and let the thank-you travel past the heat sheet.
```
*(Word count: ~185, within the ≤220 individual-sport ceiling. Rails: no held
breath, no body/suit/weight reference. Anti-prosperity: "gift, not wages,"
"God didn't hand you the drop because you earned it," "never on the same heat
sheet" — directly mirrors the golf win module's seam.)*

---

## Module S-b — Swimming · The Loss (scenario: `loss`)

- **slug:** `swimming-the-loss`
- **scenario:** `loss`
- **title:** `After the Loss`
- **eyebrow:** *(none — the default loss eyebrow stands)*
- **scriptureRef:** `Psalm 34:18`
- **scriptureText (verbatim NIV):**
  `The Lord is close to the brokenhearted and saves those who are crushed in spirit.`

**bodyMd:**
```md
### What happened

You got beat. Maybe the touch went the other way by a hundredth, maybe the
swim added time when it had to drop, maybe your name sat too low on the heat
sheet to matter. Now it's just you, the bus home, and a quiet you can't talk
your way out of.

Let it be what it is. A loss is allowed to hurt. The clock doesn't care how
many 5am practices it cost — it just posts the number, and that's a lonely
kind of sting. It mattered. That's why it aches.

### What's true

Here's what the swim doesn't get to do: it doesn't get to tell you who you
are. The clock reports what happened in the water. It can't reach the part of
you that's settled in Christ.

The Psalms don't rush you past this. David wrote that God is *close* to the
brokenhearted — not impressed by the ones who shrug it off, close to the ones
who feel it. He's near you tonight, on the bus, in the quiet.

So feel it tonight. You're not asked to feel it forever.

> The loss is real. It is not the verdict on you.

Tomorrow the pool is waiting and so is the next race. Tonight, you're already
held.
```
*(Word count: ~200, within the ≤220 ceiling. Required phrases present: "not
impressed by the ones who shrug it off" and "You're not asked to feel it
forever." Reset blockquote: "The loss is real. It is not the verdict on you."
Texture: the touch that went the other way, the bus home, the heat sheet. Rails:
no held breath, no body/weight reference.)*

---

## Module S-c — Swimming · Left Off the Relay (scenario: `benching`, eyebrow override)

- **slug:** `swimming-left-off-the-relay`
- **scenario:** `benching`
- **title:** `Left Off the Relay`
- **eyebrow:** `Didn't Make the Cut`  *(swimming has no bench — overrides the
  default "The Bench"; the golf "Didn't Qualify" precedent. Alternate wording on
  file: "Off the Relay" — KC's call at wiring.)*
- **scriptureRef:** `Psalm 139:1-3`
- **scriptureText (verbatim NIV):**
  `You have searched me, Lord, and you know me. You know when I sit and when I rise; you perceive my thoughts from afar. You discern my going out and my lying down; you are familiar with all my ways.`

**bodyMd:**
```md
### What happened

Your time wasn't fast enough. The travel squad got posted and your name
wasn't on it — or the A-relay went to someone else, or you missed finals by a
tenth. Now you're in the car and the question won't quit: *am I even fast
enough for this?*

That's a real question, and it's a hard seat. You're allowed to be frustrated.
Doing the work and missing the spot by a tenth is its own kind of loud.

### What's true

But hear the trap in it. A seed time can decide your spot this week. It cannot
decide your worth. Those are two different things, and the night keeps trying
to blur them.

David wrote Psalm 139 about a God who already knows him completely — sitting,
rising, every honest corner. Your time got read. *You* didn't. The One who
matters most has known you all the way down since long before this week's
results.

> A coach reads your seed time. He doesn't write who you are.

Tomorrow you can ask what it takes to make it next time. Tonight, you're
already known.
```
*(Word count: ~195, within ceiling. eyebrow handles the individual-sport
framing. Reset blockquote: "A coach reads your seed time. He doesn't write who
you are." — exactly mirrors golf's "A coach reads your card. He doesn't write who
you are." Texture: travel squad / A-relay / missed finals by a tenth — the
individual-sport benching analog. Rails honored.)*

---

## Module S-d — Swimming · The Swim That Wouldn't Drop (scenario: `bad-game`, eyebrow override)

- **slug:** `swimming-the-swim-that-wouldnt-drop`
- **scenario:** `bad-game`
- **title:** `The Swim That Wouldn't Drop`
- **eyebrow:** `The Bad Swim`  *(swimming swims races, not games — overrides the
  default "The Bad Game"; the golf "The Bad Round" precedent.)*
- **scriptureRef:** `Lamentations 3:22-23`
- **scriptureText (verbatim NIV):**
  `Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.`

**bodyMd:**
```md
### What happened

You couldn't find it today. The swim that added time, the touch that came up
slow, the race that felt heavy and wrong from the first wall. You replayed it
on the walk back from the blocks, and you're replaying it now, and your head
only keeps the worst splits.

That loop is normal. A swim like that earns a little ache. Don't fake being
fine.

### What's true

But watch what the loop is doing. It's taking what *happened* and quietly
turning it into who you *are*. *I'm done. I've lost it.* That's the lie under
the replay, and it's louder at night.

Lamentations was written from real wreckage — a city in ruins, no spin on it.
And right in the middle, the writer says God's mercies are *new every morning.*
Not earned by a faster swim. New tomorrow because He is faithful, not because
you were.

> A bad swim is information. It is not your identity.

Hit the pool tomorrow with clear eyes. Tonight, the morning's already coming.
```
*(Word count: ~185, within ceiling. Required phrase present: "Don't fake being
fine." Reset blockquote: "A bad swim is information. It is not your identity." —
mirrors golf's "A blow-up round is information. It is not your identity." Texture:
added time, the swim that felt awful, the replay loop. Note: this is the
postgame, single-swim ache — distinct from the season-long PLATEAU cell, which is
WITHHELD and clinically gated in the pregame taxonomy §6; this module stays at the
single-bad-swim level and must not drift into the no-drop-season verdict. Rails:
no held breath, no body/weight reference.)*

---

## Module S-e — Swimming · Praise Anyway (scenario: `praise`) — `CLINICAL_SIGN_OFF_REQUIRED`

> **CLINICAL_SIGN_OFF_REQUIRED:** this module (and its hockey/basketball/golf
> mirrors) reaches a minor at a night-time, post-loss low point. It must NOT roll
> out to a broad athlete base before the pending clinical-advisor sign-off
> (CLAUDE.md Open Items; tracked alongside the golf FV-296 gate). The content
> itself names the ache, permits it, and never forces a bypass — but the clinical
> gate is a standing requirement, not satisfied by this draft. `grep
> CLINICAL_SIGN_OFF_REQUIRED` for all such modules. Highest anti-prosperity
> guardrail load in the app — the FV-225 banned-pattern scan covers it.

- **slug:** `swimming-praise-anyway`
- **scenario:** `praise`
- **title:** `Praise Anyway`
- **eyebrow:** *(none — the default praise eyebrow stands)*
- **scriptureRef:** `Habakkuk 3:17-18`
- **scriptureText (verbatim NIV, FULL string):**
  `Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior.`

**bodyMd:**
```md
### What happened

The swim never came. You're in the car — or the back of the bus — bag still
wet, the window dark, the slow number still sitting behind your eyes.

And you might still feel bad tonight, and that's okay. Name the ache first.
Don't talk yourself out of it.

### What's true

Habakkuk looked at empty fields and ruined vines and said *yet I will rejoice*
— not because the harvest came, but because his God hadn't moved.

> Praise on a hard night is real. It is not a trade for a better one.

That's the whole thing. You're not praising to earn a drop next time. You're
praising because He's good — and those were never the same thing.

Nothing on the heat sheet changes when you say it. The same God you'd thank
after your best swim is the same God in this quiet car. He didn't change. Only
the night did.

So lean on Him, not on yourself. The thank-you isn't gritted teeth — it's
weight handed over.

Say the thank-you with empty hands — and mean it.
```
*(Word count: ~180, within the ≤220 praise ceiling. All required phrases present:
"Name the ache" first; "you might still feel bad tonight, and that's okay";
blockquote "Praise on a hard night is real. It is not a trade for a better one.";
"You're not praising ... because He's good — and those were never the same
thing."; "He didn't change. Only the night did."; "yet I will rejoice"; closer
"Say the thank-you with empty hands — and mean it." Anti-prosperity: "You're not
praising to earn a drop next time" — praise IN the loss, never FOR a better swim;
no turnaround / bounce-back / claim-it language. Rails: no held breath, no
body/weight reference.)*

---

## Wiring checklist (for the go-live PR — DO NOT run now)

When the `swimming` enum lands in `@/lib/sports` (module-map §8), the go-live PR:
1. Pastes the five modules above into `apps/web/lib/postgame/modules.ts` as
   `SWIMMING_WIN`, `SWIMMING_LOSS`, `SWIMMING_BENCHING`, `SWIMMING_BAD_GAME`,
   `SWIMMING_PRAISE` (constant style + header comments matching the golf block).
2. Adds them to the `POSTGAME_MODULES` array in scenario order (win → loss →
   benching → bad-game → praise), grouped after the golf block.
3. Confirms `modulesForSport("swimming")` returns the five and the picker page
   resolves (it 404s/redirects gracefully today because the array is empty for
   swimming).
4. Re-runs the FV-225 anti-prosperity banned-pattern scan over the new bodies
   (highest load on `swimming-praise-anyway`).
5. Routes the `swimming-praise-anyway` module through the
   `CLINICAL_SIGN_OFF_REQUIRED` gate before any broad rollout.
6. **Verifies both swimming safety rails** over the final copy: RAIL 1 (no
   breath-hold / hypoxic / underwater language) and RAIL 2 (no weight / suit /
   food / body-composition content).
7. kids-privacy-officer review (privacy-sensitive path: `apps/web/**`) + qa-reviewer
   before merge. Tier-2 (athlete-facing brand/voice CONTENT) — KC-gated.

### Files referenced
- `apps/web/lib/postgame/modules.ts` — the live registry these mirror; paste
  target at go-live (`PostgameModule` shape, `PostgameScenario` union,
  `POSTGAME_MODULES`, `modulesForSport`, `eyebrow` override mechanism).
- `docs/swimming-module-map.md` — the FV-274 taxonomy (the §8 enum dependency
  that gates wiring; the §6 safety rails these drafts honor).
- `.claude/agents/swimming-expert.md` — the two hard safety rails + swimming
  texture source.
- `CLAUDE.md` — audience language (athlete/swimmer/you, never "kid"), anti-
  prosperity discipline, brand spine.
- `docs/brand.md` — voice modes, words to use/avoid.
