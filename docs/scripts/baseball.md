# From Victory · Script Book · Baseball


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

## Audio Clips

## VIZ Clips (position)

### Baseball · Pitcher · VIZ
<!-- slug: viz-pitcher | file: components/pregame/audio/clips-baseball.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball popping into leather in warmups.
_(pause: 1s)_
3. Hear the chatter across the infield, a bat in the rack.
_(pause: 2s)_
4. You feel the dirt under your cleats.
_(pause: 2.2s)_
5. Feel your glove on your hand.
_(pause: 2.2s)_
6. Feel your jersey, light on your shoulders.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You step on the rubber, get your sign, and come set. Slow breath. The mound is yours.
_(pause: 0.25s)_
9. Into your windup. Smooth, balanced, nothing rushed — you've thrown this a thousand times.
_(pause: 2s)_
10. First pitch. Fastball down the middle, right where you want it. You attack the zone.
_(pause: 2s)_
11. It pops the mitt. Strike one. Your catcher fires it back, and you're already locked on the next one.
_(pause: 2s)_
12. Curveball, two strikes. You stay tall, trust the grip, and snap it off clean.
_(pause: 2s)_
13. He swings through it. Strike three. One pitch at a time — that's how it goes all night.
_(pause: 2s)_
14. See yourself own the mound.
_(pause: 2s)_
15. You win the first pitch, every hitter, all night — get ahead, attack the zone, work downhill. Your catcher puts down the sign, and you trust it without a second thought.
_(pause: 2s)_
16. When a hit drops or a guy reaches, you don't carry it. You step back on the rubber, take your breath, and go again. Next pitch, next out.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. Runner on, three-ball count, the lineup's best hitter digging in. You don't try to be perfect. You trust your stuff, hit your spot, and get the soft ground ball — out of the inning, still in command.
_(pause: 2s)_
### Baseball · Catcher · VIZ
<!-- slug: viz-catcher | file: components/pregame/audio/clips-baseball.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball popping into leather in warmups.
_(pause: 1s)_
3. Hear the chatter across the infield, a bat in the rack.
_(pause: 2s)_
4. You feel the dirt under your cleats.
_(pause: 2.2s)_
5. Feel your glove on your hand.
_(pause: 2.2s)_
6. Feel your jersey, light on your shoulders.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. Now visualize the first pitch. You set up behind the plate, give the target low and away.
_(pause: 0.25s)_
9. The pitch comes. You receive it quiet, stick the borderline strike, and frame it back to the zone.
_(pause: 2s)_
10. Next one's in the dirt. You drop and block it, keep it in front, and it dies right there.
_(pause: 2s)_
11. You catch the clean one, snap it back to the mound, and reset the sign.
_(pause: 2s)_
12. Runner takes a lead. You stay low, ready, the whole field in front of you.
_(pause: 2s)_
13. He goes. You come up clean, footwork quick, and throw a strike down to the bag.
_(pause: 2s)_
14. See yourself run the game back there.
_(pause: 2s)_
15. You frame the borderline and steal the strike, you block everything in the dirt, and you call each pitch with conviction.
_(pause: 2s)_
16. You control the run game, you keep the staff calm, and you lead from behind the plate.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. Runner on third, contact play on. The ball comes home, you catch it clean, hold the tag, and you make the out.
_(pause: 2s)_
### Baseball · Infield · VIZ
<!-- slug: viz-infield | file: components/pregame/audio/clips-baseball.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball popping into leather in warmups.
_(pause: 1s)_
3. Hear the chatter across the infield, a bat in the rack.
_(pause: 2s)_
4. You feel the dirt under your cleats.
_(pause: 2.2s)_
5. Feel your glove on your hand.
_(pause: 2.2s)_
6. Feel your jersey, light on your shoulders.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. The pitcher comes set. You take your ready hop as he releases, weight forward, on the balls of your feet.
_(pause: 0.25s)_
9. It's hit your way — a two-hopper into the hole. You read the bounce early and get a good hop.
_(pause: 2s)_
10. You field it clean, soft hands, the ball into your glove and out, working through it.
_(pause: 2s)_
11. You set your feet, line up the throw, and let it go with intent across the diamond.
_(pause: 2s)_
12. It beats the runner by a step. One out. You reset and find the ball again.
_(pause: 2s)_
13. You exhale, glance to your pitcher, and get back on your toes for the next one.
_(pause: 2s)_
14. See yourself quiet hands, sure feet.
_(pause: 2s)_
15. The routine play is your play — you stay down, field it clean, and throw with intent, the same every time.
_(pause: 2s)_
16. A grounder up the middle, you flip it to the bag, turn two, and the inning is over before it starts.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. A tough in-between hop with the runner going — you stay down, take what the ball gives you, knock it down, and still get your out.
_(pause: 2s)_
### Baseball · Outfield · VIZ
<!-- slug: viz-outfield | file: components/pregame/audio/clips-baseball.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball popping into leather in warmups.
_(pause: 1s)_
3. Hear the chatter across the infield, a bat in the rack.
_(pause: 2s)_
4. You feel the dirt under your cleats.
_(pause: 2.2s)_
5. Feel your glove on your hand.
_(pause: 2.2s)_
6. Feel your jersey, light on your shoulders.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You jog out to your spot as the first inning starts, settling in, eyes in on the hitter.
_(pause: 0.25s)_
9. The first one's hit your way — you read it off the bat and your first step is back.
_(pause: 2s)_
10. You take the route, no drifting, square to the ball the whole way.
_(pause: 2s)_
11. You catch it at full speed and come up throwing.
_(pause: 2s)_
12. You hit the cutoff man clean, right on line.
_(pause: 2s)_
13. Loud, ready, you reset for the next pitch.
_(pause: 2s)_
14. See yourself track it, run it down.
_(pause: 2s)_
15. You read it off the bat, take the right route, and catch it at full speed.
_(pause: 2s)_
16. You come up and hit the cutoff — then you stay loud, stay ready, locked in through the quiet.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. One gets into the gap and tests you — you read it, run it down, and play it clean off the wall to the cutoff.
_(pause: 2s)_
## Hard Moment Clips — Pitcher

### Baseball · Pitcher · strikeout
<!-- slug: hm-bsb-pitcher-strikeout | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are up with a runner on. The pitch looks low, you hold off, and the ump rings you up. You drop the bat and start the walk back to the dugout.
_(pause: 1.5s)_
3. Your eyes stay on the umpire a beat too long. Your bat drags in the dirt. The thought hits: I can't get anything done up here.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That at-bat is over. You win this game on the mound, not in the box.
_(pause: 2s)_
6. Next inning, step on the rubber, take the sign, and throw the first one to the mitt with conviction.
_(pause: 2s)_
### Baseball · Pitcher · slump
<!-- slug: hm-bsb-pitcher-slump | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You take the mound for another start. The ERA is climbing, the last three outings were rough, and before you even throw a pitch you feel it — here we go again.
_(pause: 1.5s)_
3. Your grip strangles the ball before you're even set. Your eyes keep drifting to the scoreboard. The thought hits: nothing is working right now.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The slump isn't on the mound with you right now. There's one hitter, one pitch. That's the whole job.
_(pause: 2s)_
6. Loosen the grip, find the mitt, and let it go — one target, nothing past that.
_(pause: 2s)_
### Baseball · Pitcher · big-hit
<!-- slug: hm-bsb-pitcher-big-hit | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are one strike away. You come back to the fastball, and he turns on it — barrels it. You watch it carry, all the way over the fence. Walk-off.
_(pause: 1.5s)_
3. You follow the ball over the wall and your eyes drop to the dirt. The new ball goes heavy in your hand. The thought hits: I lost us the game.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He won that pitch. He does not own the next one.
_(pause: 2s)_
6. Slow it down. You don't have to be perfect — throw one good pitch to the mitt, not the fence.
_(pause: 2s)_
### Baseball · Pitcher · lose-command
<!-- slug: hm-bsb-pitcher-lose-command | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You miss with the fastball, then miss again. The next two get away from you too. Ball four. The walks are stacking up.
_(pause: 1.5s)_
3. Your fingers squeeze the seams and your front side flies open. Your tempo races between pitches. The thought hits: I can't find the plate right now.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. One wild inning is not the arm you've trusted ten thousand times. Tonight, this one pitch. That's all this is.
_(pause: 2s)_
6. Loosen the grip and slow your tempo. Find the mitt and let one go clean — one target, one pitch.
_(pause: 2s)_
### Baseball · Pitcher · pulled
<!-- slug: hm-bsb-pitcher-pulled | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are walking off the mound. You hand the manager the ball. The bullpen door swings open behind you, and the dugout is quiet as you sit down.
_(pause: 1.5s)_
3. Your eyes drop to the dirt and your jaw sets. You sink onto the bench like it's swallowing you. The thought hits: I'm not good enough to be out there.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Coming out is a call about this game, not about you. It ends at the mound, not the rest of your night.
_(pause: 2s)_
6. Sit tall, stay in it with your guys, and read the at-bats so you're sharp when the ball's in your hand again.
_(pause: 2s)_
### Baseball · Pitcher · nervous
<!-- slug: hm-bsb-pitcher-nervous | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are on the bump, first pitch against the top of a stacked lineup. The gun is up behind the plate. You miss with the first three, and now it's 3-0 on the leadoff guy.
_(pause: 1.5s)_
3. Your grip squeezes the ball and your front shoulder pulls toward the dugout. Your eyes keep darting to the radar gun. The thought hits: I'm going to walk the yard and they'll see I don't belong here.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you.
_(pause: 2s)_
6. Step off, get the sign, slow your tempo, and throw one clean pitch to the mitt.
_(pause: 2s)_
### Baseball · Pitcher · hit-batter
<!-- slug: hm-bsb-pitcher-hit-batter | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You come inside and miss. The pitch rides in and drills the batter. He goes down, shakes it off, and takes his base. Now you have to throw the next one.
_(pause: 1.5s)_
3. Your front shoulder flies open early and your grip clamps the ball. Your eyes follow him jogging to first. The thought hits: I can't trust myself inside — what if I do it again.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That pitch is over. He took his base.
_(pause: 2s)_
6. Get the sign, get back on the rubber, pick your spot, and let the next one go with conviction, not caution.
_(pause: 2s)_
### Baseball · Pitcher · start-slow
<!-- slug: hm-bsb-pitcher-start-slow | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You walk the leadoff hitter on four pitches. Now you are behind in the count again, the zone feels small, and the game is speeding up on you.
_(pause: 1.5s)_
3. Your grip tightens and your tempo races between pitches. Your feet rush off the rubber before you're set. The thought hits: I don't have it today.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That walk is over. You build this start one pitch at a time, not all at once.
_(pause: 2s)_
6. Step off, slow your breathing, get the sign, and throw one good pitch clean to your spot.
_(pause: 2s)_
### Baseball · Pitcher · fall-behind-early
<!-- slug: hm-bsb-pitcher-fall-behind-early | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You hang a fastball and they line it into the gap. Two more cross before you get the third out. You walk off the mound down four in the first.
_(pause: 1.5s)_
3. Your grip clamps the seams and your shoulders climb toward your ears. Your eyes stay on the scoreboard on the walk off. The thought hits: I already lost this game for us.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That inning is over. You don't get four runs back with one pitch — get one out, then one more.
_(pause: 2s)_
6. Slow your tempo and compete for this hitter — down in the zone, one pitch, trust the mitt.
_(pause: 2s)_
## Hard Moment Clips — Catcher

### Baseball · Catcher · strikeout
<!-- slug: hm-bsb-catcher-strikeout | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're up with two outs to end the inning. The pitch breaks, you swing through it, and the ump punches you out. Now you've got to strap the gear back on and go run the staff.
_(pause: 1.5s)_
3. Your jaw sets as you pull the mask down. Your chest stays tight buckling the gear. The thought hits: I just failed, and now they need me to lead this.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That at-bat is over. You catch this game from behind the plate, not in the box.
_(pause: 2s)_
6. Get the gear on, set a firm target, and frame the first strike clean — one sign, one pitch with your guy.
_(pause: 2s)_
### Baseball · Catcher · slump
<!-- slug: hm-bsb-catcher-slump | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You ground into the third inning-ender, 0-for-20 now. You jog out, strap the gear back on, and squat to call the next half-inning with the whole staff on your shoulders.
_(pause: 1.5s)_
3. You drop into the crouch and your eyes drift to the on-deck circle instead of the mitt. Your hands feel heavy giving the sign. The thought hits: I can't find a hit tonight.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The offense isn't your job right now. Put down a sign and catch this pitch.
_(pause: 2s)_
6. You don't have to carry the whole game — one pitch, one target, frame it clean. That's the only job behind the plate.
_(pause: 2s)_
### Baseball · Catcher · error
<!-- slug: hm-bsb-catcher-error | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You set up for the curveball and it short-hops you. The ball kicks off your chest protector to the backstop, and the runner scores from third before you can get to it.
_(pause: 1.5s)_
3. Your hands clamp the mitt and your eyes chase the ball to the screen. Your throat tightens watching the run cross. The thought hits: that run is on me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That run is over. It does not get the next pitch.
_(pause: 2s)_
6. New ball, fresh sign — body in front, chin down, and smother the next one.
_(pause: 2s)_
### Baseball · Catcher · big-hit
<!-- slug: hm-bsb-catcher-big-hit | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You put down the sign. He sat dead-red on it and put it over the wall. You watch him round the bases as the run scores.
_(pause: 1.5s)_
3. Your glove hand drops and the mask feels heavy. Your eyes follow him around the bases. The thought hits: I called the wrong pitch.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That pitch is over. One call doesn't decide the sequence ahead of you.
_(pause: 2s)_
6. New ball, firm target — trust your guy and put down the next sign clean, one pitch at a time.
_(pause: 2s)_
### Baseball · Catcher · lose-command
<!-- slug: hm-bsb-catcher-lose-command | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You drop into the crouch, catch strike three, and go to throw it back to your pitcher. The easy toss. It sails over his head to the screen.
_(pause: 1.5s)_
3. Your hand grips the seams too tight and your shoulder locks on the release. Your eyes flick to the screen where the ball went. The thought hits: my throw is gone tonight.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. One throw got away from you tonight — not the throw you've made ten thousand times. Tonight, this one. That's all this is.
_(pause: 2s)_
6. Slow down, breathe out, find his glove, and let the next one go easy.
_(pause: 2s)_
7. Your worth was secure before this throw and it's secure after it, so you can throw free.
_(pause: 1.5s)_
### Baseball · Catcher · benched
<!-- slug: hm-bsb-catcher-benched | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are catching a tight game. Coach calls time, walks out, and sends in the other catcher. You hand off the gear and walk back to the dugout.
_(pause: 1.5s)_
3. Your eyes go to the ground as you peel off the gear. Your shoulders drop handing it over. The thought hits: I lost the staff. They don't trust me back there.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The bench has your gear for a few innings. It does not have your mind. The next chance may come fast.
_(pause: 2s)_
6. Get on the rail, read every sequence, log what's working, and be ready — locked in, not pressing — when your name is called.
_(pause: 2s)_
### Baseball · Catcher · nervous
<!-- slug: hm-bsb-catcher-nervous | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You set up low and away. He uncorks one harder than anything you've caught, and it tails late. You stab at it and it clanks off the heel of your glove to the backstop.
_(pause: 1.5s)_
3. Your hands tighten and you start stabbing at the ball instead of letting it come. Your shoulders creep up toward your ears. The thought hits: I can't handle this guy.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you.
_(pause: 2s)_
6. Soft hands. Give him a quiet target, let it travel, and catch the next one clean.
_(pause: 2s)_
### Baseball · Catcher · foul-tip
<!-- slug: hm-bsb-catcher-foul-tip | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You set up low and away. The pitch crosses you up and catches you flush on the bare hand. It stings and you come out of your crouch.
_(pause: 1.5s)_
3. Your bare hand throbs and you tuck it behind your back. Your jaw clenches as you stand out of the crouch. The thought hits: I'm going to flinch on the next one.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That pitch is over. The sting doesn't catch the next one for you.
_(pause: 2s)_
6. Shake the hand out, get back down, give him a firm target, and stick the next strike with conviction.
_(pause: 2s)_
### Baseball · Catcher · start-slow
<!-- slug: hm-bsb-catcher-start-slow | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You set up inside, the fastball runs in on you, and it handcuffs you and skips to the backstop. The runner moves up. First inning, and you still can't feel the ball in your mitt.
_(pause: 1.5s)_
3. Your hands grip tight and you reach for the ball instead of letting it travel. Your shoulders climb on every pitch. The thought hits: I'm too slow back here, the pitcher can't trust me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That ball is over. One pitch doesn't set the tempo for the night.
_(pause: 2s)_
6. New ball, fresh sign, soft hands — let it come, receive it quiet, and frame one clean to settle him.
_(pause: 2s)_
### Baseball · Catcher · fall-behind-early
<!-- slug: hm-bsb-catcher-fall-behind-early | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are behind the plate, down three in the second. Your pitcher just walked the bases loaded, and you can see his shoulders drop. He looks in at you for the sign and he's shaking his head before you even put it down.
_(pause: 1.5s)_
3. Your hand grips the ball too hard on the throwback. Your eyes flick from him to the scoreboard and back. The thought hits: if I can't settle him, this whole thing is on me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That deficit is not yours to fix on one pitch. Get one out, then get one more.
_(pause: 2s)_
6. Call time, walk it to the mound, give him one target — one pitch at a time, with conviction.
_(pause: 2s)_
## Hard Moment Clips — Infield

### Baseball · Infield · strikeout
<!-- slug: hm-bsb-infield-strikeout | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are up with a chance to put one in play. The pitch starts middle and breaks down, and you wave over the top of it. Strike three. Third punch-out of the night, walking back to the dugout.
_(pause: 1.5s)_
3. Your hands strangle the bat and your jaw sets on the walk back. Your eyes stay down on the dirt. The thought hits: I can't buy a hit tonight.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That at-bat is over. You win the next play in the field, not in the box.
_(pause: 2s)_
6. Glove on, get on your toes, read the hop, and attack the next ground ball with your hands.
_(pause: 2s)_
### Baseball · Infield · slump
<!-- slug: hm-bsb-infield-slump | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You step in 0-for-20. You get a fastball you should crush, but you roll over it and beat it into the ground, right at the shortstop. Another loud out.
_(pause: 1.5s)_
3. Your hands choke up hard on the knob and your front shoulder flies open early. The thought hits: I can't find a hit right now.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. One at-bat is not a verdict. It's this stretch, not forever.
_(pause: 2s)_
6. Step out, one slow breath, step back in — stay inside the ball, shorten up, and drive one good pitch back up the middle.
_(pause: 2s)_
### Baseball · Infield · error
<!-- slug: hm-bsb-infield-error | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You take a routine grounder, and it kicks off the heel of your glove. Or the throw sails, pulls the first baseman off the bag — and the E lights up on the board with your number on it.
_(pause: 1.5s)_
3. Your ears go hot and your glove hand clamps stiff. The thought hits: everyone saw it, and it's up there for good.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That error is over. The board can't field the next ball — you can.
_(pause: 2s)_
6. Want the next one hit to you: glove out front, soft hands, work through the ball, and finish the throw.
_(pause: 2s)_
### Baseball · Infield · big-hit
<!-- slug: hm-bsb-infield-big-hit | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are holding at double-play depth. A ball gets ripped on the dirt to your backhand side, just past your dive, through the hole. It rolls to the wall and the go-ahead run scores.
_(pause: 1.5s)_
3. Your feet plant heavy and your eyes stay stuck on the ball skipping past. The thought hits: I should have had that, I cost us the game.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He hit that one through. He does not own the next ball off the bat.
_(pause: 2s)_
6. Stop replaying the dive. Get on your toes, get low, trust your first step, and expect the next one right at you.
_(pause: 2s)_
### Baseball · Infield · lose-command
<!-- slug: hm-bsb-infield-lose-command | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You field a routine grounder and set to throw to first. The throw you've made ten thousand times sails wide, or dies in the dirt halfway there.
_(pause: 1.5s)_
3. Your grip squeezes the seams and the shoulder locks before you let go. The thought hits: my hands won't work right now.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That throw doesn't get the next one. One off-line throw tonight is just that — a throw.
_(pause: 2s)_
6. Slow it down. Loosen the grip, pick a small target on the chest, and throw through it.
_(pause: 2s)_
7. Your worth was never riding on this throw. Field the next one clean and make the simple play to first.
_(pause: 1.5s)_
### Baseball · Infield · benched
<!-- slug: hm-bsb-infield-benched | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You boot the ground ball, or you go down again at the plate. An inning later, coach reads a new name at your spot. You walk to the bench and watch someone else take the field.
_(pause: 1.5s)_
3. Your face goes hot and your eyes stay down on the dirt. The thought hits: I lost my spot, I'm done here.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The bench has your body for a couple innings. It does not have your mind. The next chance may come fast.
_(pause: 2s)_
6. Stay loud on the rail, read the hitters, talk the situation out loud, and be the first one up when they need you.
_(pause: 2s)_
### Baseball · Infield · nervous
<!-- slug: hm-bsb-infield-nervous | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You set up before the first pitch, hoping it goes anywhere but to you. Then the batter chops a routine two-hopper right at you, and you feel your hands tighten before the ball even gets there.
_(pause: 1.5s)_
3. Your hands grip tight and your weight sinks back onto your heels. The thought hits: I can't be trusted with a routine ball.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you.
_(pause: 2s)_
6. Get in your ready position and want the next one: soft hands, stay low, charge it, field it out front, not on your heels.
_(pause: 2s)_
### Baseball · Infield · hbp
<!-- slug: hm-bsb-infield-hbp | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are dug in at the plate. A fastball rides up and in, and you can't get the hands out. It catches you on the elbow and drops you back.
_(pause: 1.5s)_
3. The elbow stings and your hands clamp down on the bat. The thought hits: I flinched, I should've gotten out of the way.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That pitch is over, and the base is yours. The sting doesn't change how you field.
_(pause: 2s)_
6. Shake the arm out, take your base, and on the next grounder: soft hands, stay low, play it clean.
_(pause: 2s)_
### Baseball · Infield · start-slow
<!-- slug: hm-bsb-infield-start-slow | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You take the field still feeling slow, and the first grounder is on you fast. You're late getting your feet going, the ball eats you up on a short hop, and it kicks off your glove into the grass.
_(pause: 1.5s)_
3. Your feet feel stuck in cement and your hands tighten late. The thought hits: I can't get going today.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. One slow first step is over. It doesn't set the tempo for the night.
_(pause: 2s)_
6. Don't press to make it up. Feet moving early, glove out front, work through the ball, and field it clean.
_(pause: 2s)_
### Baseball · Infield · fall-behind-early
<!-- slug: hm-bsb-infield-fall-behind-early | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are at short, down three in the second. A routine two-hopper comes right at you and you rush it to make something happen. The ball kicks off the heel of your glove into the outfield.
_(pause: 1.5s)_
3. Your feet get quick and sloppy and your hands grip before you have it. The thought hits: I have to fix this whole game by myself.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That deficit is not yours to answer on one play. Get one clean out, then the next.
_(pause: 2s)_
6. Slow it down. Reset your feet, let the next one come to you, work through the ball, and make the routine throw.
_(pause: 2s)_
## Hard Moment Clips — Outfield

### Baseball · Outfield · strikeout
<!-- slug: hm-bsb-outfield-strikeout | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You take strike three looking, frozen on a pitch you should have hammered. You drop your head and start the long walk out to your position, and you carry the 0-fer out there with you.
_(pause: 1.5s)_
3. Your shoulders drop and your eyes drift in toward the infield. The thought hits: I'm not a hitter today.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That at-bat is over. You play defense now, and that's the only job out here.
_(pause: 2s)_
6. Read the hitter, get on your toes before the pitch, take the clean route, and hit your cutoff.
_(pause: 2s)_
### Baseball · Outfield · slump
<!-- slug: hm-bsb-outfield-slump | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are 0-for-20 and pressing. The pitcher spins one low and away, off the plate, and you chase it — out in front, rolling it over to short. The long walk back to the dugout.
_(pause: 1.5s)_
3. Your hands grip tighter and your shoulders climb up by your ears. The thought hits: I'm making the same out every time.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The slump is tonight, not forever.
_(pause: 2s)_
6. Stop pressing — you don't fix twenty swings in one. Shrink the zone, let the ball travel, and hunt one good pitch.
_(pause: 2s)_
### Baseball · Outfield · error
<!-- slug: hm-bsb-outfield-error | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You drift back on a routine fly to the gap. You get your glove up late, and it clanks off the heel and drops. The runner is already rounding second.
_(pause: 1.5s)_
3. Your glove hand goes stiff and your feet stop moving as it falls. The thought hits: how do you miss that.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That ball dropped. It does not catch the next one for you.
_(pause: 2s)_
6. First step in, trust your read, let your feet take you to the ball, and hit your cutoff clean.
_(pause: 2s)_
### Baseball · Outfield · big-hit
<!-- slug: hm-bsb-outfield-big-hit | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You read it in. The ball carries over your head and splits the gap. You turn and run, and by the time you hit the cutoff, two have scored and they're standing on third.
_(pause: 1.5s)_
3. Your first step locks the wrong way and your throat goes dry chasing it. The thought hits: I can't read a ball off the bat.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. One bad read is over. The next ball off the bat is a fresh read.
_(pause: 2s)_
6. Reset your depth, get on your toes, trust your break going back, and hit your cutoff.
_(pause: 2s)_
### Baseball · Outfield · lose-command
<!-- slug: hm-bsb-outfield-lose-command | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You run down the ball in the gap and come up throwing. The throw sails high over the cutoff man, and the runner reads it and takes the extra base.
_(pause: 1.5s)_
3. Your grip squeezes the seams and you rush the release. The thought hits: that throw got away from me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. One throw over the cutoff doesn't get the next one. It's a throw, not a verdict.
_(pause: 2s)_
6. Slow it down. Back up the play, then on the next ball, throw on a line through the cutoff and let the relay do the work.
_(pause: 2s)_
### Baseball · Outfield · benched
<!-- slug: hm-bsb-outfield-benched | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are jogging in from right field. The coach is sending a defensive replacement out for the last two innings. You pass him on the warning track and take the long walk to the dugout.
_(pause: 1.5s)_
3. Your shoulders drop on the walk in and your hands feel useless without a glove. The thought hits: I'm a liability out there now.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The bench has your body for two innings. It does not have your mind. The next chance may come fast.
_(pause: 2s)_
6. Read the count, talk up the next guy, and be ready — first read, clean route, hit your cutoff when you're back out there.
_(pause: 2s)_
### Baseball · Outfield · nervous
<!-- slug: hm-bsb-outfield-nervous | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are tracking a deep fly ball with the scouts' guns on you. You take a bad first step in, drift back too late, and the ball drops behind you for a double.
_(pause: 1.5s)_
3. Your feet get heavy reading the ball and your chest pulls tight. The thought hits: I can't trust my reads with them watching.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen the read.
_(pause: 2s)_
6. Read it off the bat, trust your first step, get behind it, and hit your cutoff.
_(pause: 2s)_
### Baseball · Outfield · hbp
<!-- slug: hm-bsb-outfield-hbp | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are dug in at the plate. The pitch rides in on your hands and catches you on the elbow. The sting shoots up your arm and you drop the bat.
_(pause: 1.5s)_
3. The elbow throbs and your shoulders pull in tight. The thought hits: I'm rattled now, I'll bail on the next inside pitch.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That pitch is over, and the base is yours. The sting doesn't carry out to the grass.
_(pause: 2s)_
6. Shake out the arm, settle the breath, and on the next ball in the gap, take the clean route and hit your cutoff.
_(pause: 2s)_
### Baseball · Outfield · start-slow
<!-- slug: hm-bsb-outfield-start-slow | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are in left, first inning. The ball jumps off the bat and you read it late, take a flat-footed first step, and have to drift back on your heels to glove it.
_(pause: 1.5s)_
3. Your feet feel stuck in the grass and your shoulders tense reading it late. The thought hits: I'm not even awake out here yet.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. One late read is over. It doesn't set the tempo for the night.
_(pause: 2s)_
6. Get on your toes before the pitch, first step back, trust your read, take the clean route, and hit your cutoff.
_(pause: 2s)_
### Baseball · Outfield · fall-behind-early
<!-- slug: hm-bsb-outfield-fall-behind-early | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You are in right field, down a few early. A ball drops in front of you and you charge it hard, trying to make something happen, and it skips past your glove to the wall.
_(pause: 1.5s)_
3. Your hands start gripping for a throw before you have the ball. The thought hits: I have to get all these runs back myself.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That deficit is not yours to answer on one play. Get the sure out, then the next.
_(pause: 2s)_
6. Slow it down. Get behind the next ball, field it clean, take the sure out, and hit the cutoff man.
_(pause: 2s)_
