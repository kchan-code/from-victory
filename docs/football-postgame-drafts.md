# Football "For the Ride Home" — Postgame Module DRAFTS

> **STATUS: DRAFTS FOR GO-LIVE WIRING — NOT YET IN `modules.ts`.**
>
> These five football postgame modules are **draft copy only**. They are NOT
> wired into `apps/web/lib/postgame/modules.ts` and must NOT be added until
> football go-live, because `PostgameModule.sport` is typed against the **LIVE**
> `Sport` union (`hockey | basketball | golf`) and **football is DORMANT** — it
> is not in `SUPPORTED_SPORTS` and not in the `Sport` type. Adding a
> `sport: "football"` module today would not typecheck. At go-live, after the
> football enum/routing lands and the clinical gate clears (see the module-map
> §6/§8), these get pasted into `modules.ts` as `FOOTBALL_*` consts mirroring the
> `GOLF_*` blocks, appended to `POSTGAME_MODULES`, and verified.
>
> **Structure mirrors the golf modules exactly:** `slug`, `sport`, `scenario`,
> `title`, optional `eyebrow` override, `scriptureRef`, verbatim-NIV
> `scriptureText`, and `bodyMd` (### What happened / ### What's true, a `>`
> blockquote reset, ≤190 words — loss/win/praise may run to ≤220 like golf).
>
> **Eyebrow note:** football is a **team sport**, so the team-sport-default
> `SCENARIO_EYEBROW` map (`win`→"The Win", `loss`→"The Loss",
> `benching`→"The Bench", `bad-game`→"The Bad Game", `praise`→"The Hard Night")
> fits — **no `eyebrow` overrides are needed** (unlike golf, which overrode
> `benching`→"Didn't Qualify" and `bad-game`→"The Bad Round" because golf has no
> bench and plays rounds). Football has a real bench / depth chart and plays
> games, so the defaults are correct.
>
> Anti-prosperity discipline is held throughout (no "God's favor / God showed up
> / came through for you / God on your side / claim it / turnaround / bounce-
> back"); the praise module carries the highest guardrail load and a
> `CLINICAL_SIGN_OFF_REQUIRED` note.

---

## 1 — football-after-the-win (`win`)

- **slug:** `football-after-the-win`
- **sport:** `football` *(go-live only)*
- **scenario:** `win`
- **title:** After the Win
- **eyebrow:** *(none — team-sport default "The Win")*
- **scriptureRef:** James 1:17
- **scriptureText (VERBATIM NIV):**
  `Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.`

**bodyMd:**

```md
### What happened

You won. Maybe it was the game ball, the comeback drive you led in the
fourth, the stop on fourth down that ended it. The body's still buzzing.

Good. Sit in it. Name what actually went right — the reps that built it,
the block that sprung the run, the teammate, the prep nobody saw.

### What's true

The scoreboard couldn't drop you after a loss, and it can't crown you
after this. That's the freedom.

Every good gift comes down from a Father who doesn't change like shifting
shadows. The win, the body, the guys in that locker room, this whole
night — gift, not wages. The Father you'd thank tonight is the same One
who was close in the car after the last loss. He didn't change. Only the
scoreboard did. You don't need a speech. Just: thank you.

Enjoy it tonight, then let it rest — the win doesn't owe you a sequel.
And win like someone who's lost before — someone two lockers down
might've had their worst night.

> The win is real. It is not the crown on you.

Take the win — and let the thank-you travel past the scoreboard.
```

---

## 2 — football-the-loss (`loss`)

- **slug:** `football-the-loss`
- **sport:** `football` *(go-live only)*
- **scenario:** `loss`
- **title:** After the Loss
- **eyebrow:** *(none — team-sport default "The Loss")*
- **scriptureRef:** Psalm 34:18
- **scriptureText (VERBATIM NIV):**
  `The Lord is close to the brokenhearted and saves those who are crushed in spirit.`

**bodyMd:**

```md
### What happened

You lost. The locker room went quiet, the pads came off slow, and now the
bus is dark and nobody's saying much — or it's the long ride home in the
car, the scoreboard still burning behind your eyes.

Let it be what it is. A loss is allowed to hurt. You don't have to talk
yourself out of it on the ride home, and you don't have to pretend it
didn't matter. It mattered. That's why it stings.

### What's true

Here's what the night doesn't get to do: it doesn't get to tell you who
you are. The scoreboard reports what happened on the field. It can't reach
the part of you that's settled in Christ.

The Psalms don't rush you past this. David wrote that God is *close* to the
brokenhearted — not impressed by the ones who shrug it off, close to the
ones who feel it. He's near you tonight, on the bus, in the quiet.

So feel it tonight. You're not asked to feel it forever.

> The loss is real. It is not the verdict on you.

Tomorrow the film is waiting and so is the next rep. Tonight, you're
already held.
```

---

## 3 — football-glued-to-the-bench (`benching`)

- **slug:** `football-glued-to-the-bench`
- **sport:** `football` *(go-live only)*
- **scenario:** `benching`
- **title:** Glued to the Bench
- **eyebrow:** *(none — team-sport default "The Bench"; football has a real
  bench / depth chart, so no override is needed)*
- **scriptureRef:** Psalm 139:1-3
- **scriptureText (VERBATIM NIV):**
  `You have searched me, Lord, and you know me. You know when I sit and when I rise; you perceive my thoughts from afar. You discern my going out and my lying down; you are familiar with all my ways.`

**bodyMd:**

```md
### What happened

The depth chart went up and your name slid down. Snap after snap, you
watched your reps go to someone else — or you stood on the sideline the
whole night in a clean jersey. Now you're on the ride home and the
question won't quit: *does he even trust me?*

That's a real question, and it's a hard seat. You're allowed to be
frustrated. Sitting when you're built to compete is its own kind of loud.

### What's true

But hear the trap in it. The depth chart can decide your snaps tonight. It
cannot decide your worth. Those are two different things, and the night
keeps trying to blur them.

David wrote Psalm 139 about a God who already knows him completely —
sitting, rising, every honest corner. You weren't invisible out there. The
One who matters most didn't just see your snaps — he's known you all the
way down since long before tonight.

> A coach sets your snaps. He doesn't set your standing.

Tomorrow you can ask him what he wants to see. Tonight, you're already
seen.
```

---

## 4 — football-the-bad-game (`bad-game`)

- **slug:** `football-the-bad-game`
- **sport:** `football` *(go-live only)*
- **scenario:** `bad-game`
- **title:** The Bad Game
- **eyebrow:** *(none — team-sport default "The Bad Game"; football plays games)*
- **scriptureRef:** Lamentations 3:22-23
- **scriptureText (VERBATIM NIV):**
  `Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.`

**bodyMd:**

```md
### What happened

You couldn't find it tonight. The missed assignment that sprung the
touchdown, the drop on third down, the blown coverage that's going to live
on the install tape. You replayed it on the sideline, and you're replaying
it now, and the film in your head only keeps the worst snaps.

That loop is normal. A game like that earns a little ache. Don't fake
being fine.

### What's true

But watch what the loop is doing. It's taking what *happened* and quietly
turning it into who you *are*. *I'm a liability. I cost us.* That's the lie
under the replay, and it's louder at night.

Lamentations was written from real wreckage — a city in ruins, no spin on
it. And right in the middle, the writer says God's mercies are *new every
morning.* Not earned by a better game. New tomorrow because He is faithful,
not because you were.

> A bad game is information. It is not your identity.

Watch the film tomorrow with clear eyes. Tonight, the morning's already
coming.
```

---

## 5 — football-praise-anyway (`praise`)

> **CLINICAL_SIGN_OFF_REQUIRED.** This module (and its hockey/basketball/golf
> mirrors) reaches a minor at a night-time, post-loss low point. It must NOT
> roll out to a broad athlete base before the pending clinical-advisor sign-off
> (CLAUDE.md Open Items). It is the **highest anti-prosperity-risk module in the
> app** — it must read as praise **IN** the loss, never **FOR** a better outcome.
> The content names the ache first, permits it ("you might still feel bad
> tonight, and that's okay"), and never forces a bypass — but the clinical gate
> is a standing requirement, not satisfied by this draft. At go-live the wired
> const carries the same `CLINICAL_SIGN_OFF_REQUIRED` comment block as
> `GOLF_PRAISE`, and is covered by the FV-225 banned-pattern (anti-prosperity)
> scan — no "God's favor / God showed up / came through for you / claim it /
> turnaround / bounce-back / next time it'll be different" language.

- **slug:** `football-praise-anyway`
- **sport:** `football` *(go-live only)*
- **scenario:** `praise`
- **title:** Praise Anyway
- **eyebrow:** *(none — team-sport default "The Hard Night")*
- **scriptureRef:** Habakkuk 3:17-18
- **scriptureText (VERBATIM NIV — full verse string):**
  `Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior.`

**bodyMd:**

```md
### What happened

The win never came. You're in the car — or the back of the bus — pads
still heavy, the window dark, the score sitting heavy in your chest. Four
quarters left it all out there, and it didn't go your way.

And you might still feel bad tonight, and that's okay. Name the ache
first. Don't talk yourself out of it.

### What's true

Habakkuk looked at empty fields and ruined vines and said *yet I will
rejoice* — not because the harvest came, but because his God hadn't moved.

> Praise on a hard night is real. It is not a trade for a better one.

That's the whole thing. You're not praising because the night was good.
You're praising because He's good — and those were never the same thing.

Nothing on the scoreboard changes when you say it. The same God you'd
thank after a win is the same God on this dark bus. He didn't change.
Only the night did.

So lean on Him, not on yourself. The thank-you isn't gritted teeth — it's
weight handed over.

Say the thank-you with empty hands — and mean it.
```

---

### Go-live wiring checklist (when football leaves DORMANT)

1. Land the football enum (`football` into `lib/sports.ts` `SUPPORTED_SPORTS` /
   `Sport`) + DB sport CHECK widening + routing — see module-map §8.
2. Clear the §6 clinical gate (big-hit competitive-courage-only + OL body-comp;
   and the praise-module `CLINICAL_SIGN_OFF_REQUIRED` above).
3. Paste these five as `FOOTBALL_WIN / FOOTBALL_LOSS / FOOTBALL_BENCHING /
   FOOTBALL_BAD_GAME / FOOTBALL_PRAISE` consts in `modules.ts`, mirroring the
   `GOLF_*` blocks (copy the `CLINICAL_SIGN_OFF_REQUIRED` comment onto
   `FOOTBALL_PRAISE`).
4. Append to `POSTGAME_MODULES` in scenario order (win → loss → benching →
   bad-game → praise), keeping the win-leads / praise-trails ordering the
   `modulesForSport` doc comment requires.
5. Run the FV-225 anti-prosperity banned-pattern scan + the postgame E2E spec;
   kids-privacy-officer review (privacy path).

### Verbatim NIV source (copied from existing `modules.ts` consts)
- James 1:17 — from `GOLF_WIN` / `HOCKEY_WIN` / `BASKETBALL_WIN`.
- Psalm 34:18 — from `GOLF_LOSS` / `HOCKEY_LOSS` / `BASKETBALL_LOSS`.
- Psalm 139:1-3 — from `GOLF_BENCHING` / `HOCKEY_BENCHING` / `BASKETBALL_BENCHING`.
- Lamentations 3:22-23 — from `GOLF_BAD_GAME` / `HOCKEY_BAD_GAME` / `BASKETBALL_BAD_GAME`.
- Habakkuk 3:17-18 — from `GOLF_PRAISE` / `HOCKEY_PRAISE` / `BASKETBALL_PRAISE`.
