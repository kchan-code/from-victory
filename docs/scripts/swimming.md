# From Victory · Script Book · Swimming

> **DORMANT** — no audio rendered yet for this sport. Edit freely; the first audio render is the go-live pass.

## HOW TO EDIT

**This file IS the script.** Edit the numbered prose lines — those words are exactly what gets spoken.

1. Edit **only** the numbered prose lines (e.g. `1. Your sentence here.`).
2. Do NOT change `### titles`, `<!-- slug ... -->` comments, `_(pause)_` markers, or line numbers.
3. One numbered line = one complete sentence (no line breaks within a numbered item).
4. For text-mode fallback lines, same rules apply to the numbered body lines.
5. That's it for editing. The generator reads your prose directly from this file at render time — no separate apply step. Works for EVERY clip type (inline, visualization/viz-*, and shared-* clips).
6. When you're ready to render audio, run from `apps/web/`:
   - **LIVE sports** (hockey, basketball, golf, baseball):
     ```
     npm run audio:generate -- --mode clips
     ```
     Then bump `MANIFEST_VERSION` per the FV-142 rule (the generator prints the new value).
   - **DORMANT sports** (football, swimming, track-field): edit freely. The first
     audio render is the go-live pass.
   - To preview which clips will render with your edits (no TTS budget spent):
     ```
     npm run audio:check
     ```

> Note: daily-training sessions (Supabase seed SQL) and postgame modules
> (`lib/postgame/modules.ts`) are NOT in these books — edit those directly.

---

## Text-mode fallback (Swimming)

These lines appear on-screen in text mode (no audio). Tokens like `{{role}}`, `{{adversity}}`, etc. are substituted at runtime — edit them as-is.

<!-- audioScript#0 | eyebrow: Identity -->
1. ${SCRIPTURE_REF} — ${SCRIPTURE_TEXT} You are not playing to become enough. In Christ, you are already loved. Receive that before you compete.

<!-- audioScript#1 | eyebrow: Settle -->
2. Sit tall on the deck. Long exhale. Lead your body back to ready. Four counts in. Six counts out. Let your shoulders drop.

<!-- audioScript#2 | eyebrow: See the pool -->
3. See the pool. Hear the natatorium echo, a whistle, water lapping the gutters. Smell the chlorine. Feel your cap and goggles seated, the cool air on your shoulders behind the blocks. You belong here. You are ready.

<!-- audioScript#3 | eyebrow: Your first race -->
4. They call your heat. Step up behind the blocks. Slow breath on the deck. Take your mark. Explode off the start, find your stroke, hold your form all the way to the wall. One race. Recover. Next race.

<!-- audioScript#4 | eyebrow: Swim your race · {{role}} -->
5. {{roleScenes}}

<!-- audioScript#5 | eyebrow: If this happens -->
6. {{adversity}} See it. Feel it. Breathe. Speak truth. Take the next faithful action. Your mistake is real. It is not your identity.

<!-- audioScript#6 | eyebrow: Coach yourself -->
7. {{selfTalk}} When pressure hits, return here. Your anchor: {{anchor}}. Your cue word: {{cueWord}}.

<!-- audioScript#7 | eyebrow: Send-off -->
8. Lord, help me compete with courage, humility, and joy. Help me swim the race in front of me, respond well to a bad one, and remember that my worth is secure in You. Amen. Play from victory.
---

## Audio Clips

## VIZ Clips (specialty)

### Swimming · Sprint · VIZ
<!-- slug: viz-swm-sprint | file: components/pregame/audio/clips-swimming.ts -->

1. Keep your eyes closed. See yourself walking onto the pool deck toward your lane.
_(pause)_
2. You hear the natatorium hum — water lapping the gutters, a whistle echoing off the far wall.
_(pause)_
3. Hear the meet settle around you. A starter's voice somewhere, your teammates talking low.
_(pause)_
4. You smell the chlorine, sharp and clean, and feel the warm, damp air on your skin.
_(pause)_
5. You snap your cap into place and feel it settle snug over your ears.
_(pause)_
6. You seat your goggles, press them firm, and the deck goes quiet and clear.
_(pause)_
7. You step up behind the blocks. You tell yourself, You belong here.
_(pause)_
8. You step up onto the block and find your set position. Slow breath. This race is yours.
_(pause)_
9. The horn. You explode off the block, arms driving, into a tight, clean entry.
_(pause)_
10. You break out powerful and on top of the water, already into your stroke.
_(pause)_
11. You hold your form — high tempo, no spin, every stroke clean and connected.
_(pause)_
12. You drive through the finish, reach long, and touch the wall. One race at a time — that's how it goes all meet.
_(pause)_
13. See yourself explode and hold the touch.
_(pause)_
14. Quick to the blocks. Rip the start, clean break. Hold your stroke, no spin — every length, top speed.
_(pause)_
15. Drive through the finish, reach for the wall. And if the swimmer beside you goes out fast, you don't chase their race — you swim your own, full speed, all the way through the touch.
_(pause)_
16. Now visualize the next race.
_(pause)_
17. The final, the fastest heat, the lane next to you loaded. You don't tighten up. You rip the start, break out clean, hold your tempo with no spin, and drive long through the wall — your race, your touch, full speed to the end.
_(pause)_
### Swimming · Dist · VIZ
<!-- slug: viz-swm-dist | file: components/pregame/audio/clips-swimming.ts -->

1. Keep your eyes closed. See yourself walking onto the pool deck toward your lane.
_(pause)_
2. You hear the natatorium hum — water lapping the gutters, a whistle echoing off the far wall.
_(pause)_
3. Hear the meet settle around you. A starter's voice somewhere, your teammates talking low.
_(pause)_
4. You smell the chlorine, sharp and clean, and feel the warm, damp air on your skin.
_(pause)_
5. You snap your cap into place and feel it settle snug over your ears.
_(pause)_
6. You seat your goggles, press them firm, and the deck goes quiet and clear.
_(pause)_
7. You step up behind the blocks. You tell yourself, You belong here.
_(pause)_
8. You step up onto the block and settle into your set. Slow breath. You know exactly how this race unfolds.
_(pause)_
9. The horn. You start smooth, break out controlled, and drop right onto your rhythm.
_(pause)_
10. You lock the pace, stroke long and relaxed, breathing easy and steady on the line.
_(pause)_
11. You stay right on the black line, turn after turn, the rhythm carrying you.
_(pause)_
12. You build through the back half, find another gear, and bring it home strong to the wall. One length at a time — that's how it goes all meet.
_(pause)_
13. See yourself settle in and hold the pace.
_(pause)_
14. Find your rhythm early. Lock the pace, breathe easy and relaxed. Stay on the line — every length, the same.
_(pause)_
15. Build through the back half, bring it home strong. And when it starts to hurt in the middle, you don't panic — you stay on your pace, stay on the line, and trust the work to carry you to the wall.
_(pause)_
16. Now visualize the next race.
_(pause)_
17. The longest race on your card, the field going out hard early. You don't get pulled off your plan. You settle onto your rhythm, hold your pace, breathe easy on the line, and build through the back half — passing them late, home strong to the wall.
_(pause)_
### Swimming · Stroke · VIZ
<!-- slug: viz-swm-stroke | file: components/pregame/audio/clips-swimming.ts -->

1. Keep your eyes closed. See yourself walking onto the pool deck toward your lane.
_(pause)_
2. You hear the natatorium hum — water lapping the gutters, a whistle echoing off the far wall.
_(pause)_
3. Hear the meet settle around you. A starter's voice somewhere, your teammates talking low.
_(pause)_
4. You smell the chlorine, sharp and clean, and feel the warm, damp air on your skin.
_(pause)_
5. You snap your cap into place and feel it settle snug over your ears.
_(pause)_
6. You seat your goggles, press them firm, and the deck goes quiet and clear.
_(pause)_
7. You step up behind the blocks. You tell yourself, You belong here.
_(pause)_
8. You step up onto the block and find your set. Slow breath. You own this stroke.
_(pause)_
9. The horn. You start clean and break out into the stroke you've drilled a thousand times.
_(pause)_
10. You feel the water — long, clean, holding your tempo, the stroke smooth and powerful.
_(pause)_
11. Into the wall — a legal turn, hands and feet right, and a sharp, powerful breakout off the wall.
_(pause)_
12. You finish the stroke full and strong, reach long, and touch with two hands, clean. One race at a time — that's how it goes all meet.
_(pause)_
13. See yourself trust the stroke you own.
_(pause)_
14. Feel the water, long and clean. Hold your tempo. Legal turn, sharp breakout — every wall, dialed in.
_(pause)_
15. Finish the stroke, full and strong. Two hands, clean touch. You make every turn legal and every finish legal — nothing left to chance, the race is yours on technique.
_(pause)_
16. Now visualize the next race.
_(pause)_
17. The race on the line, tight to the wall at every turn. You don't rush it sloppy. You feel the water, hold your tempo, hit each turn legal, break out sharp, and finish full and strong — two hands, clean touch, your stroke all the way through.
_(pause)_
### Swimming · Im · VIZ
<!-- slug: viz-swm-im | file: components/pregame/audio/clips-swimming.ts -->

1. Keep your eyes closed. See yourself walking onto the pool deck toward your lane.
_(pause)_
2. You hear the natatorium hum — water lapping the gutters, a whistle echoing off the far wall.
_(pause)_
3. Hear the meet settle around you. A starter's voice somewhere, your teammates talking low.
_(pause)_
4. You smell the chlorine, sharp and clean, and feel the warm, damp air on your skin.
_(pause)_
5. You snap your cap into place and feel it settle snug over your ears.
_(pause)_
6. You seat your goggles, press them firm, and the deck goes quiet and clear.
_(pause)_
7. You step up behind the blocks. You tell yourself, You belong here.
_(pause)_
8. You step up onto the block and find your set. Slow breath. Four strokes, one race, all yours.
_(pause)_
9. The horn. You fly out controlled — smooth and rhythmic, not over-spent, riding clean on top of the water.
_(pause)_
10. Legal turn, and you roll smooth into the backstroke, steady and long on the line.
_(pause)_
11. Into your breast leg — you own it, strong pull, clean timing, holding ground or making it up.
_(pause)_
12. You bring it home freestyle, every transition clean, and drive through to the wall. One race at a time — that's how it goes all meet.
_(pause)_
13. See yourself master the whole race.
_(pause)_
14. Fly out controlled. Smooth into the back. Own your breast leg — each stroke its own job, done right.
_(pause)_
15. Bring it home freestyle. Clean every transition. And if one stroke isn't your strongest, you don't lose the race there — you hold steady through it and make it up where you're strong.
_(pause)_
16. Now visualize the next race.
_(pause)_
17. The final, a deep field, every leg a battle. You don't get rushed off your plan. You fly out controlled, roll smooth into the back, own your breast leg, and bring it home freestyle — every transition clean, driving through to the wall.
_(pause)_
## Hard Moment Clips

### Swimming · Stroke · touched-out
<!-- slug: hm-swm-stroke-touched-out | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The hundred fly, and you and the next lane surge to the wall together. Your timing's a hair off the touch — you glide a stroke too long, they punch it in, and the board flips them ahead of you by a fingertip.
_(pause)_
3. Your hand reaches into a long, dead glide and your eyes lock on their lane, then the board. The thought hits: I had them and I gave it away at the touch.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. He won that touch. He does not own the next one. The walk back behind the blocks is your reset.
_(pause)_
6. A touch is won before the wall, not at it. Next race, hold your stroke long and strong into the finish, and time it so you attack the wall instead of gliding into it.
_(pause)_
7. The board reports a swim, not a swimmer. You stood secure before this race and you stand secure after it.
_(pause)_
### Swimming · Stroke · false-start
<!-- slug: hm-swm-stroke-false-start | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. On the blocks for the hundred breast, your best event, keyed up and ready. You rock forward a hair early. The whistle blows, the official points, and just like that your race is scratched off the sheet before it ever started.
_(pause)_
3. Your foot is already coming off the block as the whistle catches you, and heat floods your face in front of the whole deck. The thought hits: all that work, gone, and I never even swam.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The whistle happened. Learn from it, then compete clean. That scratch is final for this event, and it stays in this event — it doesn't get your next race.
_(pause)_
6. Don't carry the early start onto your next block by waiting a beat to make up for it. Set, still, eyes down, and go on the horn — react to the sound, not to the fear of jumping it.
_(pause)_
7. A scratched race is one moment on a sheet, not a verdict on you. You're secure with no time on the board at all.
_(pause)_
### Swimming · Stroke · dq
<!-- slug: hm-swm-stroke-dq | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You swam a clean race — felt fast, hit your splits. Then one hand touched a beat before the other on the breast turn, or one too many dolphin kicks off the fly wall. The flag goes up, and the whole swim is wiped off the sheet.
_(pause)_
3. Your chest still heaves from the effort as you stare at the official and it sinks in. The thought hits: I did the work and it counts for nothing.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Take the correction. Leave the grudge. That swim is erased on the sheet — and it stays on the sheet, not on you.
_(pause)_
6. On your next turn, square both hands to the wall and count your kicks off the break — legal first, fast second. Clean technique is how the time stays on the board.
_(pause)_
7. An erased time still happened in your body, and a swim wiped from a sheet can't name a swimmer. You're secure.
_(pause)_
### Swimming · Stroke · plateau
<!-- slug: hm-swm-stroke-plateau | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your hundred back has sat at the same time for two seasons. The stroke feels good. The work is there. And the clock keeps handing you the same number, meet after meet, no matter what you pour into it.
_(pause)_
3. Your shoulders sink as you read the board and a tiredness sits behind your eyes. The thought hits: maybe this is just as far as I go.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. A plateau is real, and it is not the end of your story. Times break loose in jumps, not inches — every swimmer hits this wall.
_(pause)_
6. This isn't yours to crack alone tonight, and not on this block. Bring the stuck time to your coach this week — let them look at your walls, your tempo, your training — and let this race just be one honest swim.
_(pause)_
7. The clock reports a time, not a ceiling. Your worth was never the number on the board.
_(pause)_
### Swimming · Stroke · bad-turn
<!-- slug: hm-swm-stroke-bad-turn | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Two hundred breast, and your turn comes in a beat slow off the wall. The timing breaks, your tempo stalls, and the back half never finds the rhythm again — you're swimming uphill the rest of the way in.
_(pause)_
3. Your hands feel heavy and a stroke behind, and you can sense the lane next to you pull even. The thought hits: I broke my own race at the wall.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That turn is over and it's behind you in the pool. One slow wall doesn't define the swim.
_(pause)_
6. Next race, attack the wall — drive your feet down, push off tight and streamlined, and let your first two strokes set the tempo instead of chasing it.
_(pause)_
7. The clock reports a swim, it cannot name a swimmer. You're the same whether the turn was sharp or slow.
_(pause)_
### Swimming · Stroke · mind-wanders
<!-- slug: hm-swm-stroke-mind-wanders | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Last twenty-five of the hundred fly. Your stroke shortens, your arms stop clearing the water, and your tempo falls apart. The smooth rhythm you had is gone, and it turns into pure survival just to reach the wall.
_(pause)_
3. Your arms stop clearing the water and your tempo goes ragged and short. The thought hits: I always fall apart at the end.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The back half is a tempo problem, not a willpower problem. Name that, and it gets fixable.
_(pause)_
6. Next race, when the burn comes, hold your stroke long — full pull, hands clearing the water — and keep your rhythm instead of chopping it short.
_(pause)_
7. The clock reports a swim, it cannot name a swimmer. You're secure however the last twenty-five came.
_(pause)_
### Swimming · Stroke · goggles
<!-- slug: hm-swm-stroke-goggles | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your goggles slip on the dive and sit half-off your eyes. You swim the whole fly race half-blind, water blurring everything, guessing your turn off the flags and hunting for a wall you can't quite see.
_(pause)_
3. Your eyes sting and squint as you hunt blind for the wall, and your rhythm tightens with the guessing. The thought hits: I can't race like this.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. A slipped goggle is gear, not you. That race is over and the goggles are off now.
_(pause)_
6. Next time, snug them tight under your cap and trust your stroke count into the wall — you've felt your way home a thousand times in practice. You can swim by feel.
_(pause)_
7. The clock reports a swim, it cannot name a swimmer, and a gear slip doesn't either. You're secure.
_(pause)_
### Swimming · Stroke · slow-heat
<!-- slug: hm-swm-stroke-slow-heat | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're seeded into a slow heat off a meet where your stroke felt off. The fast swimmers are in a later heat, and you're racing the clock alone, with no one next to you to pull you down to your time.
_(pause)_
3. Your shoulders slump on the deck and you feel a little forgotten back in this heat. The thought hits: I don't even belong in the real race.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The seed sheet is just a starting point, not a sentence. Times don't care which heat you swim them in.
_(pause)_
6. Race the clock, not the bodies. Lock onto your own splits, hold your stroke long and strong, and chase the number you came for. A best time from a slow heat counts exactly the same.
_(pause)_
7. The clock reports a swim, it cannot name a swimmer, and a seed line can't either. You're secure.
_(pause)_
### Swimming · Stroke · ready-room
<!-- slug: hm-swm-stroke-ready-room | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Behind the blocks, your heat about to be called. You can already feel that the stroke isn't quite there today, and you can't tell if your feel for the water will show up when the horn goes.
_(pause)_
3. Your heart thumps, your hands fidget at your cap, your stomach is light. The thought hits: what if the feel just isn't there when I dive in.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. These nerves are energy, not danger. Let them sharpen you. Roll your shoulders back once and take one slow, easy breath of the deck air.
_(pause)_
6. You can't will the feel into your hands standing here, so stop auditing it. Trust your start, hold your stroke long off the dive, and let the feel come to you the way it always has, stroke by stroke.
_(pause)_
7. The feel comes and goes; your worth never did. Step up, react to the horn, and go.
_(pause)_
### Swimming · Stroke · go-out-slow
<!-- slug: hm-swm-stroke-go-out-slow | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. In warm-up the stroke wasn't there — the catch felt empty, your hands slipping through the water with nothing to grab. Now you're on the blocks, not knowing which version of your stroke shows up when you dive.
_(pause)_
3. Your hands feel far away and unsure on the start, and your stomach knots. The thought hits: my stroke left me on the day it counts.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Warm-up was warm-up. An empty catch in warm-up is information, not a forecast for the race.
_(pause)_
6. You don't have to fix your stroke standing here. Off the dive, reach long, find the catch on your very first pull, and let the race wake it up — the feel often shows up the second the gun goes.
_(pause)_
7. The clock reports a swim, it cannot name a swimmer. You're secure whichever version of the stroke shows up.
_(pause)_
### Swimming · Im · touched-out
<!-- slug: hm-swm-im-touched-out | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Coming home freestyle in the two hundred IM, stroke-for-stroke with the next lane after four legs of fighting. You drive to the wall together and lose the touch by the length of a hand. So close, and second on the board.
_(pause)_
3. Your whole body burns from all four strokes as your eyes snap to the board, then their lane. The thought hits: I gave it everything and still came up a hand short.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. He won that touch. He does not own the next one. The walk back behind the blocks is your reset.
_(pause)_
6. The IM is won across four strokes, not just the last wall. Next time, build your free leg from the last turn so you arrive with speed — and drive the finish in long instead of gliding the last stroke.
_(pause)_
7. The board reports a swim, not a swimmer. You stood secure before this race and you stand secure after it.
_(pause)_
### Swimming · Im · false-start
<!-- slug: hm-swm-im-false-start | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. On the blocks before the four hundred IM, the longest puzzle of the meet, everything you've trained for. You move early. The whistle blows, the official points, and your race is scratched before the fly even starts.
_(pause)_
3. Your weight tips off the block as the whistle catches you, and heat floods your face. The thought hits: all those four-stroke sets, gone, and I never swam a stroke.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The whistle happened. Learn from it, then compete clean. That scratch is final for this event, and it stays in this event — it doesn't get your next race.
_(pause)_
6. Don't carry the early start onto your next block by hesitating to make up for it. Set, still, eyes down, and go on the horn — react to the sound, not to the fear of jumping it.
_(pause)_
7. A scratched race is one moment on a sheet, not a verdict on you. You're secure with no time on the board at all.
_(pause)_
### Swimming · Im · dq
<!-- slug: hm-swm-im-dq | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You swam all four strokes clean and fast. Then you left the wall onto your back a hair before fully touching on the back-to-breast change — or your breast kick went illegal. The flag goes up, and the whole medley is wiped out on a transition rule.
_(pause)_
3. Your chest still heaves from four legs of work as you stare at the official and it lands. The thought hits: I did all of it and it counts for nothing.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Take the correction. Leave the grudge. That swim is erased on the sheet — and it stays on the sheet, not on you.
_(pause)_
6. The IM lives in the transitions — next race, fully touch before you turn, and keep every changeover legal. Clean transitions are how the four-stroke time stays on the board.
_(pause)_
7. An erased time still happened in your body, and a swim wiped from a sheet can't name a swimmer. You're secure.
_(pause)_
### Swimming · Im · plateau
<!-- slug: hm-swm-im-plateau | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your two hundred IM hasn't dropped in a year. You train four strokes against swimmers who train one, and the all-around time sits stuck while the specialists pass you in their own events. The math feels like it's against you.
_(pause)_
3. Your shoulders sink at the board and a tiredness sits behind your eyes. The thought hits: maybe doing all four just means I'm never the best at any.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. A plateau is real, and it is not the end of your story. The all-rounder's time breaks loose in jumps, often when one weak leg finally clicks.
_(pause)_
6. This isn't yours to crack alone tonight, and not on this block. Bring the stuck time to your coach this week — let them find the leg that's leaking time — and let this race just be one honest swim.
_(pause)_
7. The clock reports a time, not a ceiling. Being an all-rounder is a strength, not a verdict on you.
_(pause)_
### Swimming · Im · bad-turn
<!-- slug: hm-swm-im-bad-turn | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The back-to-breast transition comes a half-second clumsy — you fumble the changeover, your rhythm breaks at the wall, and you carry the stumble straight into your weakest leg, already behind before the breast even starts.
_(pause)_
3. Your first breast strokes come scrambled and out of sync, and you can feel the lanes pulling even. The thought hits: I broke my own race at the changeover.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That transition is over and it's behind you in the pool. One clumsy changeover doesn't define the medley.
_(pause)_
6. Next race, rehearse the back-to-breast in your head before you dive — touch, drop the hips, set the breast tempo on stroke one. Smooth transitions are free speed.
_(pause)_
7. The clock reports a swim, it cannot name a swimmer. You're the same whether the changeover was clean or clumsy.
_(pause)_
### Swimming · Im · mind-wanders
<!-- slug: hm-swm-im-mind-wanders | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Somewhere in the middle of the medley you lose the thread of the race. You forget to attack the transition, your strokes blur together, and the four-stroke shape of the swim falls apart right where it should tighten.
_(pause)_
3. Your tempo drifts and your focus scatters between strokes. The thought hits: I drift right when I need to lock in.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That race is over and the time is on the board. The IM rewards a swimmer with a job for every length.
_(pause)_
6. Next race, give each leg one cue — long fly, steady back, snap the breast, finish the free — and ride the transitions instead of drifting through them.
_(pause)_
7. The clock reports a swim, it cannot name a swimmer. You're secure however the middle of the race went.
_(pause)_
### Swimming · Im · goggles
<!-- slug: hm-swm-im-goggles | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your goggles fail off the fly dive and fill with water. You swim three strokes' worth of a four-stroke race unable to see your turns clearly, guessing every wall, fighting just to keep the medley together half-blind.
_(pause)_
3. Your eyes sting and squint at each wall, and your transitions tighten with the guesswork. The thought hits: I can't run the IM blind.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. A flooded goggle is gear, not you. That race is over and the goggles are off now.
_(pause)_
6. Next time, snug them tight under your cap and trust your stroke count into every wall — you've felt your way through all four legs a thousand times. You can swim it by feel.
_(pause)_
7. The clock reports a swim, it cannot name a swimmer, and a gear failure doesn't either. You're secure.
_(pause)_
### Swimming · Im · slow-heat
<!-- slug: hm-swm-im-slow-heat | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're seeded mid-pack in a slow heat, racing a clock instead of bodies — in the one event that's supposed to be all yours, the medley where you do everything. The fast IMers are swimming later, without you.
_(pause)_
3. Your shoulders slump on the deck and you feel forgotten in your own event. The thought hits: even my race isn't the real race.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The seed sheet is a starting point, not a sentence. Times don't care which heat you swim them in.
_(pause)_
6. Race the clock, not the bodies. Lock onto your splits, attack every transition, and chase the number you came for. A best time in the IM from a slow heat counts exactly the same.
_(pause)_
7. The clock reports a swim, it cannot name a swimmer, and a seed line can't either. You're secure.
_(pause)_
### Swimming · Im · ready-room
<!-- slug: hm-swm-im-ready-room | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Behind the blocks before the IM, your heat about to be called. You're already bracing for the breast leg everyone can see — the part of the race you can't hide, the one where the gap always seems to open.
_(pause)_
3. Your heart thumps, your hands fidget at your cap, your stomach is light. The thought hits: what if the breast leg gives me away again, right out in the open.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. These nerves are energy, not danger. Let them sharpen you. Roll your shoulders back once and take one slow, easy breath of the deck air.
_(pause)_
6. You don't have to swim a perfect breast leg — you have to swim your race. Set up the fly and back so you arrive strong, hold the breast tempo you own, and trust your free to bring it home.
_(pause)_
7. One exposed leg doesn't name you, and neither does the clock — it reports a swim, not a swimmer. Step up, react to the horn, and go.
_(pause)_
### Swimming · Im · go-out-slow
<!-- slug: hm-swm-im-go-out-slow | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your breast split is the slow leg again. You watch the gap open exactly where you knew it would, the lanes pulling away as you grind through the one stroke that won't come, and your weak leg costs you the race.
_(pause)_
3. Your stroke labors and your arms feel heavy, and your eyes catch the lanes slipping ahead. The thought hits: my weak leg always sinks me.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That race is over and the time is on the board. A weak leg is the all-rounder's next gain, not your ceiling.
_(pause)_
6. Next race, swim the breast you have with tempo and a long line, and take the work to practice where weak legs get built. The other three legs are yours.
_(pause)_
7. One slow split is one leg of one race. It never had a vote on what you're worth.
_(pause)_
### Swimming · Sprint · touched-out
<!-- slug: hm-swm-sprint-touched-out | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You and lane five are dead even at the flags. You glide a half-stroke into the wall. They punch the touch. You look up at the board, and it has them by four hundredths.
_(pause)_
3. Your chest heaves over the lane rope and your eyes lock on that second-place number. The thought hits: I glided, I gave it away by a fingertip.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That swim is over and the time is on the board. You have more racing today.
_(pause)_
6. Don't replay the touch on a loop. Take it to your next race instead: finish on a full stroke into the wall, no glide, drive your hand through the touchpad.
_(pause)_
7. Win the last inch next time. The clock reports a swim, it cannot name a swimmer.
_(pause)_
### Swimming · Sprint · false-start
<!-- slug: hm-swm-sprint-false-start | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The horn fires, and then a second whistle behind it. Someone twitched on the blocks, and the official's arm swings around and points at your lane. Your fifty is gone before you swam a single stroke of it.
_(pause)_
3. Heat floods up your neck as you climb back onto the deck, and your hands shake. The thought hits: I never even got to race, and now it's over.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That call is made and it cannot be undone. Arguing it in your head only carries it into the next race.
_(pause)_
6. Take the lesson, not the spiral. Next time on the blocks, get set and go still: weight settled, eyes down, move only on the beep.
_(pause)_
7. You can't lose what you don't anticipate. A race you never swam can't tell you who you are.
_(pause)_
### Swimming · Sprint · dq
<!-- slug: hm-swm-sprint-dq | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You touched it dropping a hand, or your relay take-off read early on the pad. The swim is a best time and it counts for nothing. And on a relay, three teammates are looking at the scratched line where your time should be.
_(pause)_
3. Your stomach drops when you see the DQ, and you can't look at your relay. The thought hits: I cost everyone, I ruined it for the whole team.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That swim is wiped from the board, and it does not get the rest of your session. Let it be done right now.
_(pause)_
6. One DQ doesn't write your meet, and your teammates are still your teammates. Go find your relay, own the one detail, and move on together.
_(pause)_
7. Lock the fix in for next time: two hands on the wall, square and flat, and stay on the block until your leg-off has clearly touched.
_(pause)_
8. One scratched time doesn't decide whether you belong on this team. You were theirs before the swim, and you still are.
_(pause)_
### Swimming · Sprint · plateau
<!-- slug: hm-swm-sprint-plateau | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You've gone twenty-three four in the fifty free at four straight meets. The work has been the same. The taper came and went. You look up at the board, and the clock just will not move.
_(pause)_
3. Your shoulders sink at the same time again and there's a heaviness behind your eyes. The thought hits: maybe this is just as fast as I get. Let it arrive — it's a feeling in this moment, not a fact about you.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. A plateau is a place on the road, not the end of it. Swimmers sit on a time and then break through — it's happening to your clock right now, not to who you are.
_(pause)_
6. Take what's stuck — the start, the back half, the finish — to your coach this week and find the next gear. The work isn't lost; it's the base your next drop is built on.
_(pause)_
7. The plateau is real, and it is not forever. The clock reports a swim; it cannot name a swimmer, and one stuck number can't touch what you're worth. You're secure whether the time drops today or not — bring it to your coach, and for now, race the next one.
_(pause)_
### Swimming · Sprint · bad-turn
<!-- slug: hm-swm-sprint-bad-turn | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. In the hundred you carry the wall too far. Your feet plant flat instead of loaded, and your push off is dead. The one turn you get bleeds away the lead you built on that first fifty.
_(pause)_
3. You feel the field pull even off the wall and your stroke gets frantic trying to make it back. The thought hits: I just gave away the whole race on one wall.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That swim is over and the turn is behind you. You have more racing today.
_(pause)_
6. Take it to your next race. See the flags, find your spot, snap the turn tight and load both feet on the wall.
_(pause)_
7. Explode off the push. That's where you get the lead back, on the wall, not by thrashing.
_(pause)_
### Swimming · Sprint · goggles
<!-- slug: hm-swm-sprint-goggles | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You hit the water hard off the blocks, and your goggles fill instantly. Cold water sloshes against your eyes. You're racing the hundred half-blind now, sighting the lane line by feel.
_(pause)_
3. Your eyes sting and everything blurs, and your stroke hitches as you try to find the wall. The thought hits: I can't even see, this race is wrecked.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The goggles are already gone, and you can't fix them mid-race. The race is still yours to swim, blurry or not.
_(pause)_
6. Swim by feel. You know this distance in your body. Count your strokes off the flags, find the black line under you, and ride it to the wall.
_(pause)_
7. Race what you feel, not what you see. The next wall is the only thing in front of you.
_(pause)_
### Swimming · Sprint · slow-heat
<!-- slug: hm-swm-sprint-slow-heat | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're seeded out in lane one, a full second back of the fast heat. The swimmers you want to chase race later, in a different heat. You're up here racing the clock alone, with no one beside you to pull you along.
_(pause)_
3. Your shoulders sag looking at the empty lanes around you, and your legs feel flat behind the blocks. The thought hits: what's the point, I'm not even in the real race.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The heat sheet doesn't decide your swim. The clock takes everyone's time the same way, lane one or lane four.
_(pause)_
6. Race the clock, not the lane next to you. Lock onto your own splits, attack your own walls, and drop a time that crashes the next seeding.
_(pause)_
7. A fast swim in a slow heat still moves you up. The sheet reports where they think you are; it doesn't get the last word.
_(pause)_
### Swimming · Sprint · ready-room
<!-- slug: hm-swm-sprint-ready-room | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. They call your heat and your legs go light underneath you. The fifty is so short there's no room to settle into it, it's over in a breath. And your hands won't stop shaking as you step up onto the block.
_(pause)_
3. Your heart slams in your chest and your hands buzz on the front of the block. The thought hits: what if I'm tight off the start and it's over before I find it.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. These nerves aren't a warning. They're energy your body brought because this matters. Let the buzz settle into power.
_(pause)_
6. You don't have to manage the whole fifty, you just have to react. See the start, explode off the block, swim long and fast off the breakout.
_(pause)_
7. Trust the speed you trained. It's already in you, and the ready room doesn't get to name you.
_(pause)_
### Swimming · Sprint · go-out-slow
<!-- slug: hm-swm-sprint-go-out-slow | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your reaction off the block is a beat late. Your break is flat, no pop off the entry, and you surface behind the field. You're chasing from stroke one in a race that's too short to chase anyone down.
_(pause)_
3. You feel the gap open in front of you and your stroke gets frantic, spinning to claw it back. The thought hits: I lost it on the start, it's already gone.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That swim is over and the slow start is behind you. You have more racing today.
_(pause)_
6. Take it to your next race. Lock in on the start: react to the beep, drive the block, sharp streamline into a clean break.
_(pause)_
7. Get out front early so you never have to chase. Nail the next start, and go again.
_(pause)_
### Swimming · Dist · false-start
<!-- slug: hm-swm-dist-false-start | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. One early move on the blocks before the longest race of the meet, and the whistle cuts it dead. The official's arm points your way. The whole grind you came here to swim is over before it even began.
_(pause)_
3. Heat floods up your neck climbing back onto the deck, and your hands shake. The thought hits: all that yardage, all that prep, gone on one twitch.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That call is made and it cannot be undone. Replaying it on the deck only carries it into the next race.
_(pause)_
6. Take the lesson, not the spiral. Next time on the blocks, get set and go perfectly still: weight settled, eyes down, move only on the beep.
_(pause)_
7. All that training is still in you, and it isn't going anywhere. A race you never swam can't name you.
_(pause)_
### Swimming · Dist · dq
<!-- slug: hm-swm-dist-dq | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. A flip turn somewhere in the middle eight hundred rolls past vertical, or a hand slips a wall. The official saw it. A sixteen-minute swim, length after grinding length, is wiped clean off the board.
_(pause)_
3. Your stomach drops when you see the DQ, and your legs are wrecked and now they were for nothing. The thought hits: sixteen minutes of pain and it all counts for zero.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That swim is wiped from the board, and it does not get the rest of your meet. Let it be done right now.
_(pause)_
6. The work was never for nothing. Every length built the engine you carry into the next race. The board can erase a time, but it can't erase what that swim made you.
_(pause)_
7. Lock the fix in for next time: flip turns square and under control, two hands flat on every wall, legal and clean, length after length.
_(pause)_
8. One scratched swim doesn't erase what you're worth. You compete from a victory that's already yours, time or no time.
_(pause)_
### Swimming · Dist · plateau
<!-- slug: hm-swm-dist-plateau | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You've held the same mile time all season while your lanemate dropped fifteen seconds. The yardage is brutal, the sets are honest, and the clock keeps saying it isn't paying out.
_(pause)_
3. Your shoulders sink at the same time again, heavy in the chest watching your lanemate drop. The thought hits: maybe all this yardage isn't taking me anywhere. Let it arrive — it's a feeling in this moment, not a fact about you.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. A plateau is a place on the road, not the end of it. Distance breakthroughs come in big steps after long flat stretches — it's happening to your clock, not to who you are. Your lanemate's time is theirs, not a measure of you.
_(pause)_
6. Take what's stuck — your pacing, your back half, your turns — to your coach this week and find the next gear. Every honest length is base your next drop is built on.
_(pause)_
7. The plateau is real, and it is not forever. The clock reports a swim; it cannot name a swimmer, and your worth never rode on a number on the board. You're secure whether the time drops today or not — bring it to your coach, and for now, race the next one.
_(pause)_
### Swimming · Dist · bad-turn
<!-- slug: hm-swm-dist-bad-turn | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Somewhere around the seven hundred you misjudge the wall. You short the flip, plant flat, and push off weak. The clean rhythm you spent six lengths building falls apart in one bad turn.
_(pause)_
3. Your stroke stutters as you scramble for the rhythm and the fatigue rushes in. The thought hits: I broke my pace, the rest of this swim is a slog now.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That wall is behind you and there's a lot of pool left. One bad turn in a distance swim is a single length, not the whole race.
_(pause)_
6. Rebuild the rhythm one length at a time. Find your stroke count, lengthen out, feel the catch and the steady tempo come back.
_(pause)_
7. The pace is still in your body. Climb back onto it stroke by stroke, and hit the next wall clean.
_(pause)_
### Swimming · Dist · mind-wanders
<!-- slug: hm-swm-dist-mind-wanders | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. At the three hundred the pool goes silent. It's just you and the black line on the bottom, length after length. And before you catch it, your mind drifts somewhere else and your pace drifts with it.
_(pause)_
3. Your stroke goes soft and absent, and you realize you've stopped counting. The thought hits: I checked out, I let the pace slip, I can't even stay in my own race.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Drifting in the long middle is normal. Every distance swimmer does it. The work isn't to never drift; it's to come back, and you just came back.
_(pause)_
6. Anchor your mind to something small and repeating. Count your strokes per length. Feel the catch, feel the finish, feel the next turn.
_(pause)_
7. One length at a time, back on the line and back on pace. That coming-back is the whole skill.
_(pause)_
### Swimming · Dist · goggles
<!-- slug: hm-swm-dist-goggles | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your goggles fog at the two hundred and stay fogged for thirteen more lengths. The black line blurs to a smear. You're swimming the rest of the mile reading the bottom by memory.
_(pause)_
3. You squint into the blur trying to find the wall and your turns get tentative. The thought hits: I can barely see, the rest of this swim is ruined.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. You can't clear them mid-race, so stop fighting them. The mile is still yours to swim, fogged or clear.
_(pause)_
6. Swim by feel, you know this pool. Count your strokes off the flags into every wall, time your turns by rhythm, trust the line you've memorized.
_(pause)_
7. Race what you feel, not what you see. Settle in and swim it home.
_(pause)_
### Swimming · Dist · slow-heat
<!-- slug: hm-swm-dist-slow-heat | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Distance heats swim slow-to-fast, so you're in the early heat with half the pool still empty. The stands are quiet, the fast swimmers are hours away, and you're chasing a pace target with no one near you.
_(pause)_
3. Your shoulders sag in the empty, quiet pool, and your legs feel flat behind the blocks. The thought hits: what's the point, no one's even watching this heat.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The heat sheet doesn't decide your swim. The clock takes every time the same way, early heat or final.
_(pause)_
6. Race your pace plan, not the lanes around you. Lock onto your splits, hit your target every hundred, and drop a time that turns heads later when they read the sheet.
_(pause)_
7. A fast swim in an early heat still stands. Race your own pace, and go again.
_(pause)_
### Swimming · Dist · ready-room
<!-- slug: hm-swm-dist-ready-room | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Behind the blocks before the five hundred, your stomach turns over. You're not afraid of the swim — you're afraid of how long the next five-plus minutes of pain are going to last. The whole grind is still in front of you.
_(pause)_
3. Your hand finds the block and your legs already feel heavy on the deck. The thought hits: how am I going to hold pace when it really starts to hurt.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. These nerves are energy, not danger. Your body brought them because this matters. Let them sharpen you.
_(pause)_
6. Don't swim the whole five hundred standing here — you can't carry all of it at once. Off the first wall, settle into pace, hold your splits, and take it one hundred at a time.
_(pause)_
7. You've trained every yard of this. The dread of the distance can ride along, but it doesn't set your pace — you do. Settle on the block, swim the first length, and go.
_(pause)_
### Swimming · Dist · go-out-slow
<!-- slug: hm-swm-dist-go-out-slow | file: components/pregame/audio/clips-swimming.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your first two hundred is two seconds off your pace plan. You glance at the clock on the turn and the math is already against the time you came here to swim. The swim is barely started and you're behind it.
_(pause)_
3. Your jaw tightens mid-stroke and your turnover starts to surge to rip it all back. The thought hits: I'm behind, I have to make up the whole gap right now.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Two seconds early in a long race is not a hole you dig out in one length. Sprinting to erase it now is exactly how a distance swim falls apart.
_(pause)_
6. Get back on pace length by length — don't lunge for it all at once. Lock onto your target split, build through the middle, and trust your back-half.
_(pause)_
7. The time comes back in pieces, not in one heroic surge. The clock reports a swim; it can't name the swimmer. Settle onto your pace, and go again.
_(pause)_
