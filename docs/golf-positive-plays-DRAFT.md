# Golf Pregame — Individual-Sport Authenticity (FV-294)

**DRAFT for KC by-ear.** Edit freely — it's plain text; the prose below IS what gets
recorded. Once you approve, the next agent wires it into `clips-viz-golf.ts` +
`positive-plays.ts` + `GOLF_CONFIG`, renders the audio, and re-enables the step (full
engineering spec in [`fv-294-handoff.md`](fv-294-handoff.md)).

**Status (2026-06-20):**
- ✅ **The Step-04 trap is already fixed** — shipped in `fix/fv-294-untrap-golfers`. Golfers
  can finish pregame now; golf temporarily **skips** the positive-plays step and plays its
  flagship profile viz. These 21 plays, once approved + rendered, **re-enable** the step
  automatically (no further flow change).
- 📝 **Part 1 below = FINAL, render-ready** — authored by the content trio (golf-expert
  authenticity → sports-psychologist imagery craft → content-curator one-voice integration),
  matched to the hockey gold standard `viz-forward-win-the-wall` and the de-corn voice spec.
- ⏳ **Parts 2–3** (the "Trust my swing" need + step copy) are unchanged from the prior draft
  and still stand — they execute with the wiring PR after you approve.

Good-imagery only — no shank/yips/panic (that stays in the gated adversity cell).

---

## DECISIONS FOR YOU (everything else just executes)

1. **The 21 viz scripts (Part 1)** — review/edit wording. Three things to settle:
   - **Bomber #6 title** — went with **"Rip it on your line, first tee"** (the script no
     longer leans on nerves, and "smother the nerves" risks rehearsing the anxiety we're
     avoiding). Flag if you want the athlete's-own-language "buzz" version back.
   - **Two authenticity title/slug fixes applied** (per golf-expert, not just by-ear):
     `stinger → knockdown` (Ball-Striker #4) and `slider → breaker` (Scrambler #2). These
     change the slug — flag if you'd rather keep the old ones.
   - **The 3 recovery shots** (Bomber #7, Ball-Striker #6, Scrambler #6) all start FROM the
     recovery and never rehearse the bad swing. Scrambler #6 keeps "wild drive" only in its
     retrospective closer (the title names it). Confirm you're good with that one mention.
2. **"Trust my swing" opener** — route to the shared decisions opener now (no render, ships
   immediately) **OR** author a bespoke `opener-trust-swing` (richer, +render + your by-ear).
   Spine sketched in Part 2.
3. **Keep the eyebrow** on the "Trust my swing" verse? youth-pastor strongly recommends yes —
   it holds the line against "self-trust over God-trust" (see Part 2 flag).
4. **Step copy** — golf-specific ("Picture the shots you'll hit") vs the generalized
   individual-sport default ("Picture the moments you'll own"). Part 3.

---

# PART 1 — 21 positive-play visualization scripts (FINAL)

Ash voice, ~50–60s each. Five-segment arc (ORIENT → POV execution beats → OUTCOME → CLOSE),
`_(pause: Ns)_` markers between every spoken line (de-corn book grammar). No theology inside
the clip — the opener carries it. No stapled identity/worth closer; each clip lands on quiet,
earned ownership of the shot. Slugs `viz-{bomber|ballstriker|scrambler}-*`.

---

## BOMBER — power / distance / commitment off the tee

### `viz-bomber-stripe-the-fairway` — "Stripe a drive down the middle"

See yourself on the tee, driver in hand, and know this one splits the middle.
_(pause: 2s)_
The fairway opens wide in front of you. You tee it high.
_(pause: 2s)_
One slow breath, and you pick your line — a target way out past the bunkers.
_(pause: 2.5s)_
Into your routine. No steering, no holding back.
_(pause: 2s)_
Free, full release. You let it go.
_(pause: 2.5s)_
You catch it flush — the strike runs all the way up the shaft.
_(pause: 3s)_
The ball climbs, holds your line, and splits the middle.
_(pause: 2s)_
It runs out forever. Dead center, miles down there.
_(pause: 2s)_
You pick up your tee and walk off easy. That's the one you came for.
_(pause: 3s)_

### `viz-bomber-walk-up-tall` — "Bomb it past the group, walk up tall"

See the group's balls already out in the fairway, and know yours flies past them all.
_(pause: 2s)_
You're up. You don't try to do too much — you just commit.
_(pause: 2s)_
Pick your line. Slow breath. Tee it high.
_(pause: 2.5s)_
Free, full swing. You turn through it and let it fly.
_(pause: 2s)_
Flush. The ball jumps off the face and keeps climbing.
_(pause: 2.5s)_
It carries past every other ball out there.
_(pause: 3s)_
You don't say a word. You don't need to.
_(pause: 2s)_
You pick up your tee and walk up the fairway, tall and easy. Longest one out here.
_(pause: 3s)_

### `viz-bomber-high-draw` — "Flush a high draw around the corner"

See the dogleg bending left, and know you're going to turn the corner.
_(pause: 2s)_
The hole bends left around the trees. You pick your start line, out over the corner.
_(pause: 2s)_
You set up for the draw, a touch closed, and trust the shape.
_(pause: 2.5s)_
Slow breath. Into your swing, free and full.
_(pause: 2s)_
You release it hard, right-to-left.
_(pause: 2.5s)_
The ball starts at the corner, climbs, and turns over.
_(pause: 3s)_
It draws around the trees and lands in the heart of the fairway.
_(pause: 2s)_
You cut the hole in half. Just a wedge from here.
_(pause: 2s)_
You called the shape, and the ball did exactly what you saw.
_(pause: 3s)_

### `viz-bomber-long-iron-par5` — "Reach the par 5 in two"

See the green sitting out there in two, and know you've got the number to get home.
_(pause: 2s)_
A big drive left you a long way back, but the green is reachable.
_(pause: 2s)_
Long iron, maybe a hybrid. You pick the fat of the green, away from trouble.
_(pause: 2.5s)_
Slow breath. Smooth and full, no lunge at it.
_(pause: 2s)_
You sweep it off the turf, flush.
_(pause: 2.5s)_
The ball comes off low and hot, then climbs.
_(pause: 3s)_
It carries the front, lands soft, and settles on the green.
_(pause: 2s)_
On in two. An eagle look, two-putt birdie at worst.
_(pause: 2s)_
You stayed patient and let the swing do it.
_(pause: 3s)_

### `viz-bomber-wedge-tap-in` — "Stuff a wedge to tap-in range"

See the flag close in front of you, and know this wedge stops next to it.
_(pause: 2s)_
Your drive left a perfect number — full wedge, nothing in between.
_(pause: 2s)_
You check the flag, the wind, and pick a landing spot short of the pin.
_(pause: 2.5s)_
Slow breath. A controlled, committed swing.
_(pause: 2s)_
You nip it clean, ball then turf.
_(pause: 2.5s)_
It flies on the flag, takes one hop, and checks.
_(pause: 3s)_
The ball drifts toward the hole and stops a foot away.
_(pause: 2s)_
Tap-in birdie. You barely have to mark it.
_(pause: 2s)_
Bombed and dialed in. The whole hole, yours.
_(pause: 3s)_

### `viz-bomber-rip-it-first-tee` — "Rip it on your line, first tee"

See yourself on the first tee, locked onto your line, and know it's flying straight.
_(pause: 2s)_
First tee of the round. You feel the buzz, and you go anyway.
_(pause: 2s)_
You pick a target down the left side and lock onto it.
_(pause: 2.5s)_
Tee it high. One slow breath. Quiet hands.
_(pause: 2s)_
Into your swing — you don't kill it, you just start it on line.
_(pause: 2.5s)_
Free, full release. You rip it.
_(pause: 3s)_
The ball comes off pure and tracks your line, dead center.
_(pause: 2s)_
You're off and running. The hardest tee shot of the day, behind you.
_(pause: 2s)_
You stepped up and committed. First swing of the day, flushed.
_(pause: 3s)_

> **Good-imagery flag (Bomber #6):** kept ONE light, non-pathologizing nod ("You feel the
> buzz, and you go anyway") and cut all the prior draft's nerve-language ("Smother the
> nerves," "they don't get a vote"). The clip rehearses only the committed swing + good
> outcome. Title by-ear in Decisions #1.

### `viz-bomber-take-your-medicine` — "Take your medicine, punch out, save par"

See yourself in the trees, already planning the smart way out, and know you save par.
_(pause: 2s)_
You walk in and look. The hero shot through the gap isn't there.
_(pause: 2s)_
You don't chase it. You take your medicine.
_(pause: 2.5s)_
You find the safe gap back to the fairway and commit to it.
_(pause: 2s)_
Punch out, low and clean. Back in play.
_(pause: 2.5s)_
Now a wedge, a number you own. You knock it onto the green.
_(pause: 2s)_
Two putts. You walk off with a par you stole.
_(pause: 2s)_
One swing contained. No snowman, no spiral, just a smart par.
_(pause: 3s)_

> **Recovery-shot guardrail (Bomber #7):** the clip starts FROM the recovery decision ("You
> walk in and look") and never rehearses the wild swing. The prior draft's "The big stick got
> away from you" opener is cut.

---

## BALL-STRIKER — precision / proximity / repeatable swing

### `viz-ballstriker-small-target` — "Pick a small target and flush it"

See the smallest target out there, and know the ball flies dead on that line.
_(pause: 2s)_
You stand behind it and narrow your aim — not the fairway, one branch on a far tree.
_(pause: 2s)_
You pick the smallest target and commit to it.
_(pause: 2.5s)_
Into your setup. Tempo, balance, nothing forced. Slow breath.
_(pause: 2s)_
One smooth swing.
_(pause: 2.5s)_
You flush it — pure contact, ball then ground.
_(pause: 3s)_
The ball flies dead on your line.
_(pause: 2s)_
It lands in the short grass, right where you looked.
_(pause: 2s)_
Exactly the shot you saw. Small target, smooth swing.
_(pause: 3s)_

### `viz-ballstriker-fat-of-the-green` — "Hit the fat of the green, hole after hole"

See the fat of the green, and know your iron finds it again.
_(pause: 2s)_
The pin is tucked, trouble short and right. The flag is bait, and you don't take it.
_(pause: 2s)_
You aim at the fat of the green — middle, safe, plenty of room.
_(pause: 2.5s)_
Slow breath. Your same smooth swing.
_(pause: 2s)_
You stripe the iron, flush off the turf.
_(pause: 2.5s)_
It flies on your number and lands safely on the green.
_(pause: 3s)_
Thirty feet, uphill, an easy two-putt.
_(pause: 2s)_
Green in regulation. And you'll do it on the next one too.
_(pause: 2s)_
Boring, repeatable golf. That's how the round stacks up.
_(pause: 3s)_

### `viz-ballstriker-stick-it-pin-high` — "Stick an iron to ten feet, pin high"

See a number you love, and know this iron finishes pin high.
_(pause: 2s)_
Perfect distance. The exact club, the exact swing you've made a thousand times.
_(pause: 2s)_
You pick your line at the flag and trust the number.
_(pause: 2.5s)_
Slow breath. Tempo and balance.
_(pause: 2s)_
One smooth swing. You catch it flush.
_(pause: 2.5s)_
The ball leaves on a tight, boring flight, straight at the stick.
_(pause: 3s)_
It lands pin high, takes a hop, and settles.
_(pause: 2s)_
Ten feet, dead level. A clean look at birdie.
_(pause: 2s)_
Pin high, the right distance. The flush strike said so.
_(pause: 3s)_

### `viz-ballstriker-knockdown` — "Pure a knockdown under the wind"

See the wind in the trees, and know you're flighting this one under it.
_(pause: 2s)_
The wind is up, into your face. So you take it out of the air.
_(pause: 2s)_
Ball back, hands forward, one more club. You know this shot.
_(pause: 2.5s)_
Slow breath. A shorter, controlled swing — chest leads, hands quiet.
_(pause: 2s)_
You pinch it off the turf, low and pure.
_(pause: 2.5s)_
The ball comes out flat, boring under the wind.
_(pause: 3s)_
It bores through, lands, and chases toward the flag.
_(pause: 2s)_
Pin high. The wind never touched it.
_(pause: 2s)_
You took one more club and swung easy. That's command.
_(pause: 3s)_

> **Authenticity fix (Ball-Striker #4):** slug `viz-ballstriker-stinger` → **`-knockdown`**;
> all "stinger" language → "knockdown" (a stinger is a low driver/long-iron bullet; these
> beats are a knockdown into a green). Decisions #1.

### `viz-ballstriker-two-putt-walk` — "Two-putt from distance, walk to the next tee"

See the long putt ahead, calm and unhurried over the ball, and know two putts is plenty.
_(pause: 2s)_
You striped it on, but you're forty feet away. This isn't about holing it — it's speed.
_(pause: 2s)_
You read the slope, pick your line, and see the ball dying near the cup.
_(pause: 2.5s)_
Slow breath. Soft hands, smooth stroke.
_(pause: 2s)_
You roll it on your line with perfect pace.
_(pause: 2.5s)_
The ball tracks up, slows, and trickles to a foot.
_(pause: 3s)_
You tap in for par. Stress-free, clean.
_(pause: 2s)_
No three-jack. Your number stays intact.
_(pause: 2s)_
Striped it, lagged it, walked. A round that holds.
_(pause: 3s)_

### `viz-ballstriker-let-it-go` — "Trust the stock swing, let a loose one go"

See yourself settled over the next ball, the last shot already gone, and know this one's pure.
_(pause: 2s)_
You let it go. One shot doesn't touch the rest of the round.
_(pause: 2s)_
No tinkering, no fixing, no chasing it. You trust your stock swing.
_(pause: 2.5s)_
You step to this ball clean, a small target picked out. Slow breath.
_(pause: 2s)_
The same smooth tempo as always.
_(pause: 2.5s)_
You flush it, dead on line.
_(pause: 3s)_
Right back to striping it.
_(pause: 2s)_
The next swing is the only one that matters, and you made it count.
_(pause: 3s)_

> **Recovery-shot guardrail (Ball-Striker #6):** the clip starts from the next ball, settled;
> the previous loose swing is offscreen and past ("already gone"). Nothing rehearses the miss.

### `viz-ballstriker-paint-the-fairway` — "Paint the fairway off a tight tee"

See the tight fairway ahead, and know you commit instead of steer.
_(pause: 2s)_
Tight tee shot, trouble both sides. You don't steer — steering is how you miss.
_(pause: 2s)_
You pick a small target down the middle and aim hard at it.
_(pause: 2.5s)_
Slow breath. Your normal, free, smooth swing.
_(pause: 2s)_
You make a full, committed pass — no flinch, no holding off.
_(pause: 2.5s)_
You flush it. The ball flies your line and never wavers.
_(pause: 3s)_
It paints the fairway, dead center.
_(pause: 2s)_
Tight hole, full commit, fairway found.
_(pause: 2s)_
You trusted the swing instead of protecting it.
_(pause: 3s)_

---

## SCRAMBLER — short game / recovery / feel / grit

### `viz-scrambler-up-and-down-short-sided` — "Get up and down from short-sided"

See yourself short-sided off the green, already seeing the shot, and know you get up and down.
_(pause: 2s)_
Little green to work with. This is your ground.
_(pause: 2s)_
You walk up and look. You see the shot before you hit it.
_(pause: 2.5s)_
You pick your landing spot, feel the speed, soft hands.
_(pause: 2s)_
Slow breath. A smooth, accelerating little swing.
_(pause: 2.5s)_
You slide the club under it. The ball pops up soft.
_(pause: 3s)_
It lands on your spot, checks, and trickles toward the hole.
_(pause: 2s)_
It settles two feet away. You tap in for par.
_(pause: 2s)_
Up and down, the way you find a way.
_(pause: 3s)_

### `viz-scrambler-roll-in-the-breaker` — "Roll in a breaking putt from twelve feet"

See yourself reading the break, calm and certain over the line, and know it drops.
_(pause: 2s)_
Twelve feet for par — right to left, downhill.
_(pause: 2s)_
You crouch behind it and read the slope. You see the break.
_(pause: 2.5s)_
You pick your spot up the hill and trust it. Soft hands.
_(pause: 2s)_
Smooth stroke. You start it on your line with perfect pace.
_(pause: 2.5s)_
The ball rolls out, holds the line, then takes the break.
_(pause: 3s)_
It curls down toward the hole and drops, dead center.
_(pause: 2s)_
Par saved.
_(pause: 2s)_
You read it, trusted it, and rolled it pure.
_(pause: 3s)_

> **Authenticity fix (Scrambler #2):** slug `viz-scrambler-roll-in-the-slider` →
> **`-the-breaker`**; "slider" (player slang, confusable with a baseball pitch) → "breaking
> putt" / "the break." Decisions #1.

### `viz-scrambler-hole-the-bunker-shot` — "Hole a bunker shot to save par"

See yourself stepping into the bunker, the shot already pictured, and know it's a save.
_(pause: 2s)_
Greenside bunker, good lie, the flag close. You love this shot.
_(pause: 2s)_
You dig your feet in, open the face, and pick your spot in the sand.
_(pause: 2.5s)_
Slow breath. You commit and accelerate through.
_(pause: 2s)_
You splash the sand. The ball rides out on a cushion.
_(pause: 2.5s)_
It floats up soft, lands just on the green, and releases.
_(pause: 3s)_
It tracks toward the flag — and drops.
_(pause: 2s)_
Holed it. Par from the sand.
_(pause: 2s)_
There's always a way to par. Even from down there.
_(pause: 3s)_

### `viz-scrambler-lag-it-stone-dead` — "Lag it stone dead from across the green"

See the long putt across the green, hands soft, all your focus on speed — and know it dies by the hole.
_(pause: 2s)_
Fifty feet, two tiers. This is all feel. You're going to cozy it up.
_(pause: 2s)_
You walk the line, feel the slope through your feet, see the ball dying by the cup.
_(pause: 2.5s)_
Slow breath. Soft hands. Let the speed match the green.
_(pause: 2s)_
You roll it with a smooth, free stroke.
_(pause: 2.5s)_
The ball climbs the tier, crests, and feeds down the slope.
_(pause: 3s)_
It dies right next to the hole. Stone dead.
_(pause: 2s)_
A tap-in from there. No three-putt.
_(pause: 2s)_
That touch is yours. You felt it the whole way.
_(pause: 3s)_

### `viz-scrambler-chip-in-from-rough` — "Chip in from the rough"

See yourself in the rough by the green, calm, finding the way — and know this one goes in.
_(pause: 2s)_
Thick stuff, a tough lie. You don't get tight. You get creative.
_(pause: 2s)_
You read the lie, see the ball pop out and release down the slope to the cup.
_(pause: 2.5s)_
You pick your landing spot, soft hands, feel the speed.
_(pause: 2s)_
Slow breath. A committed swing through the grass.
_(pause: 2.5s)_
The ball comes out, carries onto the green, and starts rolling.
_(pause: 3s)_
It tracks down the slope, breaks toward the hole — and disappears.
_(pause: 2s)_
Chipped in from trouble. Par, out of nowhere.
_(pause: 2s)_
There's always a shot. You found it.
_(pause: 3s)_

### `viz-scrambler-grind-out-par` — "Grind out a par after a wild drive"

See yourself already mapping your way to par, calm, and know you grind one out.
_(pause: 2s)_
You're scrambling now. This is where you live — one smart shot at a time, no hero stuff.
_(pause: 2s)_
You punch out to a number you love. Back in play.
_(pause: 2.5s)_
Now a wedge — you pick your spot, soft hands, and pitch it on.
_(pause: 2s)_
It lands soft and settles fifteen feet below the hole.
_(pause: 2.5s)_
Slow breath. You read the putt, trust your speed, and roll it pure.
_(pause: 3s)_
It drops in the side door. Par.
_(pause: 2s)_
Wild drive, scrappy par. You stole one.
_(pause: 2s)_
You don't need it perfect. You find a way and sign for the number.
_(pause: 3s)_

> **Recovery-shot guardrail (Scrambler #6):** the clip starts from the recovery ("You're
> scrambling now"); the wild drive is never rehearsed. "Wild drive" survives only in the
> retrospective closer because the title itself names it (Decisions #1).

### `viz-scrambler-four-footer` — "Drain the four-footer to keep the round alive"

See yourself over the short putt, settled, certain it's going in — and know it does.
_(pause: 2s)_
Four feet for par. The kind you make.
_(pause: 2s)_
You don't rush it and you don't freeze. You go through your routine.
_(pause: 2.5s)_
You read the little break, pick the edge, and see it falling.
_(pause: 2s)_
Slow breath. Quiet hands, eyes still.
_(pause: 2.5s)_
You make a smooth, confident stroke.
_(pause: 3s)_
The ball rolls true, catches the edge you picked.
_(pause: 2s)_
And it drops. Center cut, bottom of the cup.
_(pause: 2s)_
Par holds. The round stays alive.
_(pause: 3s)_

---

## Voice mode + by-ear summary (Part 1)

**Voice mode:** Mentor in the calm rehearsal register the gold-standard hockey viz uses —
second-person present, settled, unhurried, never hyped; a light Coach edge only inside the
execution beats. Zero Devotional-guide voice inside the clips (theology stays in the opener);
every stapled identity/worth closer from the prior draft was cut. Pacing matches the gold
standard (2s/2.5s/3s, 3s reserved for the climactic contact/release beat). ~50–60s each.

**By-ear calls:** see Decisions #1 — Bomber #6 title, the two slug fixes (knockdown / breaker),
the three recovery-shot framings, and whether to keep "Slow breath" as an explicit beat (kept,
since it's a real golf pre-shot action).

---

# PART 2 — "Trust my swing" need (replaces "Physical courage" for golf)

Golf has no bodily contact — the golf-true "courage" is **commitment**: trusting the swing,
not steering. Final golf needs (8): Confidence · Calm · Compete level · Reset after mistakes
· **Trust my swing** · Better course management · Joy · Hope.

### NEED_VERSE entry
- **Reference:** Proverbs 3:5-6 (NIV)
- **Eyebrow:** "Trust is something you lean into, not something you manufacture."
- **Verse:** "Trust in the Lord with all your heart and lean not on your own understanding;
  in all your ways submit to him."

*Why this verse:* "Lean not on your own understanding" IS "don't steer." It's the same verse
the other decision/commitment needs use across every sport (puck decisions, decisions with
the ball, at the plate, course management) — so "Trust my swing" joins an established family.

### THEOLOGY FLAG (the one to hold the line on)
"Trust my swing" can read as self-trust over God-trust — the works-righteousness failure the
brand exists to prevent. **Resolution = ordering:** you trust the trained swing *FROM*
security in Christ (good stewardship of a gift), never *FOR* security (idol). The flinch /
the steer / the mid-swing manipulation are what a golfer does when he's trying to *generate*
a security he doesn't have. Secure in Christ, you have nothing to protect over the ball — so
you can let the swing go. **Keep the eyebrow** — without it the bare verse leaves the
self-trust door slightly open.

### Opener — TWO OPTIONS (your call)
- **A — ship now, no render:** route "Trust my swing" to the shared decisions opener
  (`opener-decisions`, same Proverbs 3:5-6 family). Live immediately. (NOTE: do NOT reuse
  `opener-courage` — it's all bodily contact, "the hit," "the corner," wrong frame.)
- **B — author `opener-trust-swing` (richer, +render):** ~55-60s spine —
  (0-12s) settle + identity-secure ("who you are is already decided; you're not swinging to
  earn anything") → (12-32s) the verse in context ("a life that's stopped trying to steer its
  own outcome") → (32-48s) therefore free to commit ("you've trained this swing ten thousand
  times; trusting it isn't arrogance, it's refusing to lean on your own understanding in the
  half-second you've got") → (48-58s) let it go ("nothing to protect, nothing to prove; set
  up, trust what's trained, let it go").

---

# PART 3 — Step copy (per-sport `positivePlaysCopy`, generalizes to swimming/tennis)

Current copy is team-sport ("Positive **Plays**," "Picture the **plays you'll make**," "see
yourself **nail**"). New per-sport `positivePlaysCopy` field; team sports keep the current
strings as default.

**Golf:**
- Step label: "Step 04 · Shots"
- Heading: "Picture the shots you'll hit."
- Subhead: "Pick up to {MAX} you want to see yourself pure today. We'll rehearse each one in
  the guided session."
- Empty-state: "Choose 1 to {MAX} shots to rehearse before your tee time."

**Generalized individual-sport default (swimming / tennis / track):**
- Step label: "Step 04 · Moments"
- Heading: "Picture the moments you'll own."
- Subhead: "Pick up to {MAX} you want to see yourself execute today. We'll rehearse each one
  in the guided session."
- Empty-state: "Choose 1 to {MAX} moments to rehearse before you start."

*(Generic avoids "shots" — wrong for swimming/track. "Moments you'll own" / "execute" reads
across every individual sport.)*
