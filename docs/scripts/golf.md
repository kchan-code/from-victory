# From Victory · Script Book · Golf


## HOW TO EDIT

**This file IS the script.** Edit the numbered prose lines — those words are exactly what gets spoken.

1. Edit **only** the numbered prose lines (e.g. `1. Your sentence here.`).
2. Keep the `### titles` and `<!-- slug ... -->` comments. You CAN add or remove numbered lines — the book defines the structure now (no TS reconcile) — and tune the gap between lines via `_(pause: Ns)_` (e.g. `_(pause: 1.5s)_`).
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

## Text-mode fallback (Golf)

These lines appear on-screen in text mode (no audio). Tokens like `{{role}}`, `{{adversity}}`, etc. are substituted at runtime — edit them as-is.

<!-- audioScript#0 | eyebrow: Identity -->
1. ${SCRIPTURE_REF} — ${SCRIPTURE_TEXT} You are not playing to become enough. In Christ, you are already loved. Receive that before you compete.

<!-- audioScript#1 | eyebrow: Settle -->
2. Sit tall. Long exhale. Lead your body back to ready. Four counts in. Six counts out. Let your shoulders drop.

<!-- audioScript#2 | eyebrow: See the course -->
3. See the first tee. Hear the quiet of the morning, the strike of a ball on the range. Feel the grip in your hands, your spikes settling into the turf. You belong here. You are ready.

<!-- audioScript#3 | eyebrow: Your first tee shot -->
4. You step onto the first tee. Slow breath. Pick your target, commit to the number, and make one free, committed swing. The ball finds the short grass. You walk after it, in control. Next shot.

<!-- audioScript#4 | eyebrow: Play your game · {{role}} -->
5. {{roleScenes}}

<!-- audioScript#5 | eyebrow: If this happens -->
6. {{adversity}} See it. Feel it. Breathe. Speak truth. Take the next faithful action. Your mistake is real. It is not your identity.

<!-- audioScript#6 | eyebrow: Coach yourself -->
7. {{selfTalk}} When pressure hits, return here. Your anchor: {{anchor}}. Your cue word: {{cueWord}}.

<!-- audioScript#7 | eyebrow: Send-off -->
8. Lord, help me compete with courage, humility, and joy. Help me play the shot in front of me, respond well to a bad one, and remember that my worth is secure in You. Amen. Play from victory.
---

## Audio Clips

## VIZ Clips (profile)

### Golf · Bomber · VIZ
<!-- slug: viz-bomber | file: components/pregame/audio/clips-golf.ts -->

1. Keep your eyes closed. See yourself walking to the first tee.
_(pause: 1s)_
2. You hear the range behind you — the clean strike of a ball, then quiet.
_(pause: 1s)_
3. Hear the morning settle. A cart somewhere far off, your group talking low.
_(pause: 2s)_
4. You feel the cool air, the dew still on the grass.
_(pause: 2.2s)_
5. Feel the grip of the club settle into your hands.
_(pause: 2.2s)_
6. Feel the strap of your bag, light on your shoulder.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You step onto the first tee and tee it high. Slow breath. The fairway is wide, and it's yours.
_(pause: 0.25s)_
9. Into your swing. Free, full, nothing held back — you've hit this a thousand times.
_(pause: 2s)_
10. You catch it flush. The ball climbs and splits the fairway, long and straight.
_(pause: 2s)_
11. You feel the strike all the way up the shaft. You walk off the tee in control.
_(pause: 2s)_
12. Wedge in for your second. You pick your number, commit, and knock it close. One swing at a time — that's how it goes all day.
_(pause: 2s)_
13. See yourself step up and trust it.
_(pause: 2s)_
14. You pick your line, commit to the number, and make a free, full release — every tee, all day. No steering, no backing off.
_(pause: 2s)_
15. And when you miss — because you will — you take your medicine. You pitch out, take your bogey, and you don't chase it. Next tee, next swing.
_(pause: 2s)_
16. Now visualize the next shot.
_(pause: 0.8s)_
17. A tight driving hole, trouble down both sides, the group watching. You don't overswing and you don't bail out. You pick a smaller target, commit all the way, and trust it — fairway found, still in control.
_(pause: 2s)_
### Golf · Ball-Striker · VIZ
<!-- slug: viz-ballstriker | file: components/pregame/audio/clips-golf.ts -->

1. Keep your eyes closed. See yourself walking to the first tee.
_(pause: 1s)_
2. You hear the range behind you — the clean strike of a ball, then quiet.
_(pause: 1s)_
3. Hear the morning settle. A cart somewhere far off, your group talking low.
_(pause: 2s)_
4. You feel the cool air, the dew still on the grass.
_(pause: 2.2s)_
5. Feel the grip of the club settle into your hands.
_(pause: 2.2s)_
6. Feel the strap of your bag, light on your shoulder.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You step onto the first tee. Pick the smallest target you can find. Slow breath.
_(pause: 0.25s)_
9. One smooth swing — tempo, balance, nothing forced. You flush it.
_(pause: 2s)_
10. The ball flies on your line and settles in the short grass, right where you looked.
_(pause: 2s)_
11. Second shot, you've got a number. Pick the spot, repeat the swing, stripe the iron.
_(pause: 2s)_
12. It covers the flag, pin high. You walk after it knowing exactly what you did. Stripe it, walk, repeat.
_(pause: 2s)_
13. See yourself flush it, hole to hole.
_(pause: 2s)_
14. You pick a small target, make one smooth swing, hit your number, and walk. Fairways and greens, the same swing every time.
_(pause: 2s)_
15. And the one loose swing that shows up — you let it go. One shot doesn't touch the rest of the round. You step to the next ball clean.
_(pause: 2s)_
16. Now visualize the next shot.
_(pause: 0.8s)_
17. A long iron to a tucked pin, water short. You don't aim at the flag. You pick the fat of the green, make your smooth swing, and take your two-putt par — precise, patient, nothing forced.
_(pause: 2s)_
### Golf · Scrambler · VIZ
<!-- slug: viz-scrambler | file: components/pregame/audio/clips-golf.ts -->

1. Keep your eyes closed. See yourself walking to the first tee.
_(pause: 1s)_
2. You hear the range behind you — the clean strike of a ball, then quiet.
_(pause: 1s)_
3. Hear the morning settle. A cart somewhere far off, your group talking low.
_(pause: 2s)_
4. You feel the cool air, the dew still on the grass.
_(pause: 2.2s)_
5. Feel the grip of the club settle into your hands.
_(pause: 2.2s)_
6. Feel the strap of your bag, light on your shoulder.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You step onto the first tee. You see the shot before you hit it. Slow breath.
_(pause: 0.25s)_
9. Smooth swing, just get it in play — you find the short grass.
_(pause: 2s)_
10. Your approach drifts a touch and you miss the green. No problem. This is your ground.
_(pause: 2s)_
11. You see the chip, feel the speed, soft hands — the ball checks and trickles to a foot.
_(pause: 2s)_
12. You tap in for par. Up and down, the way you always find a way. That's your game.
_(pause: 2s)_
13. See yourself find a way to par.
_(pause: 2s)_
14. You see the shot and feel the shot. Soft hands, good speed. You get it up and down from anywhere, and you roll the next one pure.
_(pause: 2s)_
15. And when the saves don't fall early, you don't panic. The feel comes back. You keep grinding out the number, one shot at a time.
_(pause: 2s)_
16. Now visualize the next shot.
_(pause: 0.8s)_
17. Short-sided in the rough, little green to work with, the round on the line. You don't force the hero shot. You see it, trust your hands, land it soft, and watch it release to gimme range — another save, another par.
_(pause: 2s)_
## Hard Moment Clips — Bomber

### Golf · Bomber · three-putt
<!-- slug: hm-glf-bomber-three-putt | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You smoked the drive and left yourself a flick in for two. Then you race the first putt eight feet by, miss the comebacker, and tap in for bogey. You walk off the green shaking your head.
_(pause: 1.5s)_
3. Your jaw tightens and the putter hangs heavy in your hands. Your eyes stay locked on the hole you just gave away. The thought hits: all that work off the tee, for nothing.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That hole is over and it's already on the card. The walk to the next tee is your reset.
_(pause: 2s)_
6. The tee shot was never the problem and it isn't the answer either. Don't chase the three back with a bigger swing. Same tempo, smart line, commit to the next shot.
_(pause: 2s)_
7. That three-putt is real and it is over. Your standing was never riding on a scorecard. Play the next shot free, and go again.
_(pause: 1.5s)_
### Golf · Bomber · blow-up
<!-- slug: hm-glf-bomber-blow-up | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Reachable par-5, you bombed the drive, and you go for it in two. The long iron leaks into the hazard. You drop, chunk the next one, and walk off with a seven on a hole you thought was a birdie.
_(pause: 1.5s)_
3. Heat climbs up your neck and your hands strangle the grip. You replay the greedy second shot on a loop. The thought hits: I always blow up the big hole. That's the anger talking, not the truth.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The triple is on the card. It is not on you, and it does not get the next hole. Sign it later. Right now it is over.
_(pause: 2s)_
6. One bad hole becomes a bad nine when you press to win it all back at once. The walk to the next tee ends this hole. New hole, new number, one shot.
_(pause: 2s)_
7. Stand on that next tee and play the percentages. The smart shot now is worth more than the hero shot you wish you'd hit back there. Pick the club that finds the fairway and commit.
_(pause: 2s)_
8. That blow-up hole is real and it is over. It doesn't change what you're worth — you compete from a victory that's already yours, seven or birdie. Break the spiral here, and go again.
_(pause: 1.5s)_
### Golf · Bomber · ob
<!-- slug: hm-glf-bomber-ob | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Pressure ratchets up and the two-way miss shows up. You snap one dead left, out of bounds. You re-tee, hitting three, stroke and distance, with the whole group watching you reload.
_(pause: 1.5s)_
3. Your pulse pounds in your ears and your grip pressure spikes for the re-tee. The thought hits: I have to make up for that, fast — swing harder, get the yards back right now.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That ball is gone and the penalty is already counted. There is nothing to win back on this swing — there is only this swing. Step off and re-tee like it's the first ball of the day.
_(pause: 2s)_
6. Take your medicine. The fastest way home is the fairway, not the hero recovery. If you're already in trouble, pitch out, take your one shot, and walk off with a number you can live with.
_(pause: 2s)_
7. That OB is real and it is over. The lost yards don't lower your worth — you're secure before the re-tee and after it. Smart swing, in play, and go again.
_(pause: 1.5s)_
### Golf · Bomber · duff-chip
<!-- slug: hm-glf-bomber-duff-chip | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You missed the green and you're short-sided, no green to work with. You set up over the little chip, decelerate, and chunk it — the ball barely moves, still short of the putting surface.
_(pause: 1.5s)_
3. Your stomach sinks and your wrists go stiff and quick. You can't look at your playing partners. The thought hits: I have no hands when it actually matters.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That chip is over and you still have one in your hand. Walk up to the ball, reset your feet, and pick a clean landing spot.
_(pause: 2s)_
6. Don't try to be a hero to erase the chunk. Soft hands, accelerate through the ball, land it on your spot and let it run. Get it on the green and take your putt.
_(pause: 2s)_
7. One chunked chip is real and it is over. It was never a measure of who you are. Commit to the next one, and go again.
_(pause: 1.5s)_
### Golf · Bomber · short-putt
<!-- slug: hm-glf-bomber-short-putt | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You bombed it down there and stuffed the approach to four feet. The birdie putt is right there. You pull it, the ball slides past the edge, and you tap in for a par that feels like a loss.
_(pause: 1.5s)_
3. Your shoulders slump over the hole and the putter feels foreign in your hands. The thought hits: I do the hard part and miss the easy one — what is the point.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That putt is over and the par is on the card. Pull the ball out of the cup, walk to the next tee, and let the green go.
_(pause: 2s)_
6. Don't go to the next tee swinging out of your shoes to make a birdie back. The four-footer doesn't owe you the long ball. Same routine, same line, one committed stroke.
_(pause: 2s)_
7. That missed putt is real and it is over. You don't have to earn your standing on the next hole — you already have it. Go again.
_(pause: 1.5s)_
### Golf · Bomber · first-tee
<!-- slug: hm-glf-bomber-first-tee | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. On the range an hour ago, you were flushing driver. Now you're on the first tee with the group watching, and the same swing comes off cold — a top, a wipe off the planet, nothing like the range.
_(pause: 1.5s)_
3. Your hands go cold and a little unsure and your breath sits high in your chest. The thought hits: my swing left me on the one tee that matters. It's a feeling in this moment, not a fact about you.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That tee shot is over. The gap between the range and the first tee happens to real players — it's happening to your hands today, not to who you are. Breathe out, and let it be just one swing.
_(pause: 2s)_
6. You don't have to fix your swing standing here. Slow your pre-shot routine all the way down, pick one small target, and make an easy, committed pass — no harder, just smoother.
_(pause: 2s)_
7. That cold first swing is real, and it is over. It is not a verdict on you — you're secure before you ever tee it up. Take what's bugging you to your coach this week and work the mechanics there; for now, play the next shot.
_(pause: 1.5s)_
### Golf · Bomber · outplayed
<!-- slug: hm-glf-bomber-outplayed | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You step on the tee and rip it. Then your playing partner steps up and matches you, dead center, every hole — same length and he keeps it in play all day. The one edge you count on, gone.
_(pause: 1.5s)_
3. Your chest tightens watching his ball fly and you start trying to out-hit him on every tee. The thought hits: if I'm not longer than him, what am I out here.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He won that hole. He does not own the next one. You don't play him, you play the course and your number — bring your eyes back to your own ball and your own line.
_(pause: 2s)_
6. Don't reach for ten extra yards to answer him — that's how the wheels come off. Hit your shot, play your game, and let his round be his. The card only asks for your number.
_(pause: 2s)_
7. Getting outdriven is real, and it stings. Your length was never the thing that named you — you're more than your driver. Play your own game, and go again.
_(pause: 1.5s)_
### Golf · Bomber · nervous
<!-- slug: hm-glf-bomber-nervous | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. First tee, driver in your hands, the starter and the next group standing right there, waiting on the tee. You stand over the ball and the only thought is the big miss — the snipe left, the block right, in front of everybody.
_(pause: 1.5s)_
3. Your heart thumps, your hands buzz on the grip, your stomach goes light. The thought hits: what if I hit the big one right here, with all of them watching.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you. Take one slow breath, let the buzz settle into your feet, and step into your routine.
_(pause: 2s)_
6. Don't try to kill it. You don't need your hardest swing here — you need your shot. Pick a target down the left side, make a smooth pass, and just start it on line.
_(pause: 2s)_
7. The nerves are real, and they are not your identity. The crowd doesn't get to name you and neither does this tee shot. Smooth swing, start it on line, and go.
_(pause: 1.5s)_
### Golf · Bomber · start-slow
<!-- slug: hm-glf-bomber-start-slow | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You come out of the gate chasing the perfect tee shot and you can't find it. A pulled drive, a scramble, a bogey. Then a wild one and a double. Two holes in, you're already three over.
_(pause: 1.5s)_
3. Your grip is white-knuckle tight and your tempo is racing ahead of you. The thought hits: I have to settle the driver before it buries this whole round.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Those two holes are over and there are plenty left. A slow start is just a start, not the round. Step on this tee and let it be a fresh hole.
_(pause: 2s)_
6. Stop trying to swing your way back to even with one huge drive. Slow your tempo, take the club that finds the fairway, and play this one hole. The round settles when you do.
_(pause: 2s)_
7. The slow start is real and it is over. You don't have to rescue the round to be secure — you already are. One smooth swing, one hole, and go again.
_(pause: 1.5s)_
### Golf · Bomber · fall-behind
<!-- slug: hm-glf-bomber-fall-behind | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You do the math on the back of the card and you're well over your number. So you reach for driver on every tee and take dead aim at every flag, trying to claw it all back by yourself.
_(pause: 1.5s)_
3. Your jaw is locked and you're swinging faster every hole, turning every shot into a hero shot. The thought hits: I have to make this all up right now, single-handed.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That number doesn't come back in one heroic hole — it comes back in pars, one at a time. Stop staring at the total and bring your focus down to just this shot.
_(pause: 2s)_
6. The hero line is exactly the wrong play when you're chasing. Take the fairway, take the fat part of the green, and make your pars. Let the round come to you instead of forcing it.
_(pause: 2s)_
7. Being behind your number is real. The scorecard doesn't get to name you. Play smart pars, one shot at a time, and go again.
_(pause: 1.5s)_
## Hard Moment Clips — Ball-Striker

### Golf · Ball-Striker · three-putt
<!-- slug: hm-glf-ballstriker-three-putt | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You striped an iron in to twenty feet, dead at the flag. Then you race the first putt four feet by, and you miss the comebacker. Three-jack. A green you flushed, and you walk off with bogey.
_(pause: 1.5s)_
3. Your jaw tightens and your grip chokes the putter on the walk off. The thought hits: I hit sixteen greens and I'm shooting seventy-five, I got robbed. That's the injustice talking, not the truth.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That hole is over. It's in your pocket and it doesn't get the next tee. Walk to the box and breathe out.
_(pause: 2s)_
6. Drop the scorecard math. You're not owed a number — you're playing the next shot. Small target, one smooth swing, and let the three-putt go.
_(pause: 2s)_
7. The three-putt is real and it is over. The number on the card isn't your worth — you're secure before this round and after it. Go again.
_(pause: 1.5s)_
### Golf · Ball-Striker · blow-up
<!-- slug: hm-glf-ballstriker-blow-up | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. One loose swing puts you in the trees. The smart play is to pitch out. But you won't accept the bogey, so you go for the gap — and clip a branch back into deeper trouble. Now you're scrambling for double, maybe worse.
_(pause: 1.5s)_
3. Heat climbs into your chest, the grip strangles the club, your breath goes short and quick. The thought hits: one bad swing and the whole round's gone. That's the spiral talking, not a fact.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That swing is over. The trouble is in front of you now, not the swing that put you there. Stop the bleeding right here.
_(pause: 2s)_
6. Take your medicine. Accept the bogey. Pick the safe gap back to the short grass, smallest target you can find, and chip out clean. One swing in play.
_(pause: 2s)_
7. One bad hole is one bad hole. It does not get to write the round. Get the ball back in the fairway and play the next shot from there.
_(pause: 2s)_
8. The blow-up is real and it is over. One number on the card doesn't name you — you're secure no matter what this hole costs. Go again.
_(pause: 1.5s)_
### Golf · Ball-Striker · ob
<!-- slug: hm-glf-ballstriker-ob | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You flush it for a living, and then one leaks dead right and crosses the white stakes. Out of bounds. Stroke and distance. You're re-teeing, already lying three before the hole has even started.
_(pause: 1.5s)_
3. Your stomach drops watching it sail and your hands go stiff reaching for another ball. The thought hits: that's not who I am, I don't hit it there. It's one swing, not a verdict.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That ball is gone. It's a penalty, not a referendum on your swing. Tee another one and breathe.
_(pause: 2s)_
6. Don't steer the re-tee. Trust the swing you own. Pick a small target down the fairway and make one committed pass.
_(pause: 2s)_
7. The wild one is real and it is over. One swing doesn't move your worth — tee it up, commit, and play the next shot clean.
_(pause: 1.5s)_
### Golf · Ball-Striker · duff-chip
<!-- slug: hm-glf-ballstriker-duff-chip | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You missed the green — rare for you — and now you're standing over a chip you resent even needing. You decelerate, catch it fat, and the ball trickles a few feet. Still short-sided. Still not up and down.
_(pause: 1.5s)_
3. Your ears go hot and your hands fidget on the wedge. The thought hits: I shouldn't even be down here. That's the resentment talking, and it won't help you hit the next one.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That chip is over. You're here now, not where you wish you were. Read the lie in front of you and breathe out.
_(pause: 2s)_
6. Stop fighting being down here. The up-and-down is gone — now protect the bogey so it doesn't become a double. Pick a landing spot and make one committed stroke, accelerating through the ball.
_(pause: 2s)_
7. The duffed chip is real and it is over. Where the ball ends up was never where your worth sits. Accept the spot you're in, commit to the next one, and go again.
_(pause: 1.5s)_
### Golf · Ball-Striker · short-putt
<!-- slug: hm-glf-ballstriker-short-putt | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You flushed it to four feet. A kick-in for birdie, the reward for striping it all day. You stand over it, push it, and it slides past the edge. The proximity earned nothing.
_(pause: 1.5s)_
3. Your shoulders slump over the ball and your hands go tight on the grip. The thought hits: what's the point of striping it if the putter gives it all back. That's the bitterness talking, not the truth.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That putt is over. The ball-striking didn't owe you the make — both are just shots. Walk to the next tee and let it go.
_(pause: 2s)_
6. Quit grading your swing by the putter. Next green: pick your start line, trust your speed, and roll one ball at a time.
_(pause: 2s)_
7. The missed short one is real and it is over. A putter that went cold doesn't lower your worth — you're secure either way. Go again.
_(pause: 1.5s)_
### Golf · Ball-Striker · first-tee
<!-- slug: hm-glf-ballstriker-first-tee | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. First tee, strangers watching, your name just called. The swing you've made ten thousand times on the range is the one thing you live on — and standing here, you can't feel where it is.
_(pause: 1.5s)_
3. Your grip is choking the club and your hands feel a foot away, like they belong to someone else. The thought hits: if I can't trust the swing, I have nothing. That's the feeling in this moment, not a fact about you.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. This is happening to your hands right now, on this tee. It is nerves on the first tee, nothing more — not a verdict, not the swing you own.
_(pause: 2s)_
6. You don't have to fix anything here. Soften the grip, breathe out long, pick the widest target you've got, and let an easy swing go. Mechanics are a range job, not yours on this tee.
_(pause: 2s)_
7. The first-tee nerves are real, and they pass. Your worth was settled long before you reached this tee, and it holds however this ball comes off. Breathe, find your target, and swing.
_(pause: 1.5s)_
### Golf · Ball-Striker · outplayed
<!-- slug: hm-glf-ballstriker-outplayed | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You out-struck him all day. He sprayed it everywhere and got up and down from spots that should've cost him. You sign for the higher number. He's shaking hands and you're standing there knowing you hit it better.
_(pause: 1.5s)_
3. Your jaw clamps and a slow burn sits in your chest as you sign the card. The thought hits: I'm the better player and I lost — I did everything right and it didn't count.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That round is over and the card is signed. He shot the lower number today — that's golf, and it's only today. Shake his hand and mean it.
_(pause: 2s)_
6. Let the injustice story go. The score isn't a referee on your swing. Take what's real — your ball-striking held — and go sharpen the short game that beat you.
_(pause: 2s)_
7. The number isn't a verdict on the player you are. Striking it that well was real too. Log what cost you strokes and put it in tomorrow's work.
_(pause: 1.5s)_
### Golf · Ball-Striker · nervous
<!-- slug: hm-glf-ballstriker-nervous | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. It's the round that counts, and you're standing on the first fairway already protecting the number. Every swing feels like it has to be perfect. One loose one and you think the whole card is gone.
_(pause: 1.5s)_
3. Your grip squeezes before you take it back and your breath goes shallow over the ball. The thought hits: I just can't make a mistake today.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. You're chasing one clean number, not a flawless round. There's only this shot. Step into your routine and breathe out.
_(pause: 2s)_
6. These nerves are energy, not danger. Soften the grip, pick a small target, and make one smooth pass. You're allowed to miss one.
_(pause: 2s)_
7. A perfect round was never the price of admission. Play the shot in front of you, then walk and find the next one.
_(pause: 1.5s)_
### Golf · Ball-Striker · start-slow
<!-- slug: hm-glf-ballstriker-start-slow | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. First couple holes, one iron comes off the toe and finds a bunker. Not even a bad number — just one loose contact. And the perfectionism alarm is already screaming about the whole front nine.
_(pause: 1.5s)_
3. Your shoulders tense between shots and your grip pressure creeps up. The thought hits: here we go, my swing's off, it's going to be one of those days.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That swing is over. One loose iron is information, not a sentence on the round. Walk to the next shot and read your lie.
_(pause: 2s)_
6. Don't audit your whole swing on the second hole. Small target, one smooth pass, and let the loose one go. The round is long.
_(pause: 2s)_
7. One toe-strike doesn't decide the next seventeen holes. Pick your target, commit, and hit the next one.
_(pause: 1.5s)_
### Golf · Ball-Striker · fall-behind
<!-- slug: hm-glf-ballstriker-fall-behind | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're a few over, well back of the number you need, and you can feel the precision starting to curdle. You stop playing the fat of the green. You aim at a tucked flag you should be playing away from, trying to get it all back with your irons.
_(pause: 1.5s)_
3. Your hands grab at the grip and the swing goes quick and grabby. The thought hits: I have to get it all back right now, with my irons.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That run is over. The deficit doesn't come back on one hero swing. Get one good shot, then get the next one.
_(pause: 2s)_
6. Aim at the center, not the flag. Play your shot, stack a few smooth swings, and let the pars do the work. The number comes back one good shot at a time.
_(pause: 2s)_
7. Being behind is real, but it's not playing your next shot — you are. Trust the swing you own and pick the smart target.
_(pause: 1.5s)_
## Hard Moment Clips — Scrambler

### Golf · Scrambler · three-putt
<!-- slug: hm-glf-scrambler-three-putt | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You lag the first putt to four feet — routine. You pull the next one, it slides by, and now you're standing over a three-footer coming back. You tap it in for three. A three-jack, on the green, where you never give them away.
_(pause: 1.5s)_
3. Your hands go cold over the ball and your breath gets shallow. The thought hits: if I can't putt, I've got nothing — the putter was the whole thing.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That hole is over. Walk to the next tee, take one breath, and play the next hole on its own.
_(pause: 2s)_
6. One three-putt isn't a verdict on your stroke. See the line, free up your hands, good speed. The next short one is a fresh chance to roll it pure.
_(pause: 2s)_
7. Hear this plainly: the putter comes and goes, but your worth never rode on it — that was settled before you ever stood over a putt. Pick your line and roll the next one.
_(pause: 1.5s)_
### Golf · Scrambler · blow-up
<!-- slug: hm-glf-scrambler-blow-up | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're in trouble off the tee — usual story, and usually you escape with bogey. But the punch-out catches a branch, the next one's fat, the chip runs long, and you walk off with a triple on the card. The save just didn't come.
_(pause: 1.5s)_
3. Your grip squeezes the club and heat climbs your neck on the walk. The thought hits: I always find a way — except this time I didn't.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That hole is done — it stays on that card and it goes no further. The next tee shot is its own shot, nothing to make up.
_(pause: 2s)_
6. Stop chasing it back. Pick the smart play, commit, and swing easy. One good shot in the fairway is how the bleeding stops. The next save is still there for you.
_(pause: 2s)_
7. Hear this plainly: one number doesn't say who you are. You were secure before this shot and you're secure after it. Play the smart one and move on.
_(pause: 1.5s)_
### Golf · Scrambler · ob
<!-- slug: hm-glf-scrambler-ob | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Long par four, a course that makes you hit driver — the club you don't trust. You step up, the swing feels loose, and you watch it sail right, over the stakes. Out of bounds. You're re-teeing, hitting three.
_(pause: 1.5s)_
3. Your hands feel unsure on the grip and your throat goes dry reaching for another ball. The thought hits: I can't scramble from out of bounds — this is the part of my game that isn't there.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That ball is gone and that swing is over. Tee the next one and give it a clear, simple target down the fairway.
_(pause: 2s)_
6. You don't need the perfect drive — you need it in play. See the shot, soft grip, smooth tempo, and trust it. Get it in the short grass and you'll save the rest, like you always do.
_(pause: 2s)_
7. Hear this plainly: the big stick coming and going doesn't move your worth — that was secure before you pulled driver. One ball in play, then go to work.
_(pause: 1.5s)_
### Golf · Scrambler · duff-chip
<!-- slug: hm-glf-scrambler-duff-chip | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Short-sided in the rough, the kind of up-and-down you live for. You set up over it — and you catch it heavy. The ball moves two feet. The chip you make in your sleep, duffed, with the green right there in front of you.
_(pause: 1.5s)_
3. Your hands have gone numb on the wedge and your face is hot standing over it again. The thought hits: the up-and-down is the one thing I do, and if that's gone, what do I have? That's the miss talking, not the truth. Let it pass.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That chip is over — one swing tonight, not the thousands you've holed. Step to the next one and read the shot fresh.
_(pause: 2s)_
6. Next shot, don't grab the wedge tighter to make it perfect. Soft hands, see the landing spot, let the bounce do the work, and save the next one clean.
_(pause: 2s)_
7. The short game is something you do, not the whole of who you are. Your worth held when the wedge let you down — it was never riding on one chip. Soft hands, see the shot, and go again.
_(pause: 1.5s)_
### Golf · Scrambler · short-putt
<!-- slug: hm-glf-scrambler-short-putt | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You've got three feet for par to save the hole. Your bread and butter. You read it, set the line, make your stroke — and you pull it. It slides under the hole, never touches the cup. A short one, the kind you make in your sleep, just missed.
_(pause: 1.5s)_
3. Your hands go still and cold over the next one and your breath holds. The thought hits: those are automatic for me — where did the feel go.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That putt is over. Mark it, breathe, and walk to the next tee clean.
_(pause: 2s)_
6. One miss doesn't take your stroke. See the line, soft hands, good speed, let it roll. The next short one is a fresh chance to pour it in.
_(pause: 2s)_
7. Hear this plainly: the feel comes and goes hole to hole, but your worth doesn't — it was never on the line. Read the next one, trust your stroke, and roll it.
_(pause: 1.5s)_
### Golf · Scrambler · first-tee
<!-- slug: hm-glf-scrambler-first-tee | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. First tee, strangers watching, your name just called. On the range the soft hands were right there. Now you stand over a little pitch and the touch you had an hour ago feels far away — the feel just isn't where it was.
_(pause: 1.5s)_
3. Your hands are tight and unsure on the grip and the touch that was there on the range has gone quiet. The thought hits: my hands won't do it. That's the feeling in this moment, not a fact about you.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. This shot is just this shot. You don't have to chase the range feel back right now. Breathe out, pick a simple, safe shot, and let it go.
_(pause: 2s)_
6. This is happening to your hands, not a verdict on you, and it is not yours to fix on the tee. Take what the course gives you here, and take the feel to your coach to sort — not under the gun.
_(pause: 2s)_
7. The feel being off right now is real, and it will pass. You are secure before this shot and after it, hands cold or warm — that was never on the line. Play the simple one and keep walking.
_(pause: 1.5s)_
### Golf · Scrambler · outplayed
<!-- slug: hm-glf-scrambler-outplayed | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Your playing partner has striped it all day — fairways, greens, pin high every time. You've been grinding out saves from everywhere, scrambling to stay close, playing defense the whole round. And you're still waiting for it to catch up to you.
_(pause: 1.5s)_
3. Your shoulders ride up watching his ball fly and your jaw sets on every walk. The thought hits: I'm getting out-struck all day — sooner or later they're going to find me out.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. His ball isn't your business. Play your number, your shot, your card — that's the only game you're in.
_(pause: 2s)_
6. Scrambling isn't surviving — it's a skill, and it's yours. See the shot, soft hands, good speed, get it up and down. Every save you make is a real shot scored. Keep stacking them.
_(pause: 2s)_
7. Hear this plainly: how he hits it doesn't name you, and there's no one to be found out as — you were never hiding. Play your game and finish the hole.
_(pause: 1.5s)_
### Golf · Scrambler · nervous
<!-- slug: hm-glf-scrambler-nervous | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're on the range before the round, hitting little chips and putts, hunting for the feel. Some are crisp, some aren't. And the dread creeps in before you've even teed off: what if the touch isn't there today.
_(pause: 1.5s)_
3. Your stomach knots over a warm-up putt and your hands check the grip again and again. The thought hits: if the feel isn't here, I've got nothing today.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. You can't will the feel into your hands before the first tee. Stop auditing it. Trust that it shows up shot by shot, the way it always has.
_(pause: 2s)_
6. You don't need it perfect — you need it in play. See the shot, soft hands, good speed, and let it go. Get the ball moving and you'll save the rest as you go.
_(pause: 2s)_
7. Hear this plainly: your worth isn't riding on whether the magic shows up today — it was settled long before the first tee. Play the shot in front of you.
_(pause: 1.5s)_
### Golf · Scrambler · start-slow
<!-- slug: hm-glf-scrambler-start-slow | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Three holes in, you've already missed two greens and the saves haven't dropped. A chip runs eight feet by, the par putt slides past. Normally one falls early and you settle in — and it just hasn't come yet.
_(pause: 1.5s)_
3. Your grip tightens on the wedge and your shoulders climb. The thought hits: I need one to fall just to feel like myself out here.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Those holes are over. There's a long way to go. Walk to the next shot and play it on its own.
_(pause: 2s)_
6. You don't need a save to feel like yourself — you already are yourself. See the shot, soft hands, good speed, commit. The next one is a fresh chance to drop one.
_(pause: 2s)_
7. Hear this plainly: you don't have to earn your way back to feeling like yourself — that was never on the line. Play the next shot free.
_(pause: 1.5s)_
### Golf · Scrambler · fall-behind
<!-- slug: hm-glf-scrambler-fall-behind | file: components/pregame/audio/clips-golf.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Long, demanding course — the kind that tests the ball-striking, with no easy bailouts to scramble from. You glance at the number and you're well over, behind where you need to be. A track that won't let you save your way around it.
_(pause: 1.5s)_
3. Your chest goes tight on the tee and your hands grip down hard. The thought hits: I'm in over my head here — this is where I get found out.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The number on the card is behind you. It's not playing the next shot — you are. Step up and play this one shot, right here.
_(pause: 2s)_
6. Play your game, not the scoreboard's. See the shot, soft hands, good speed, commit to the smart target. One shot, then the next. The course doesn't get to name you.
_(pause: 2s)_
7. Hear this plainly: there's no one here to be found out as, and your worth isn't on this card — it was secure before the first tee and it holds at the last. Play one shot, your game.
_(pause: 1.5s)_
