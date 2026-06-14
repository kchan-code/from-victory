# From Victory · Script Book · Baseball


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

## Audio Clips

## VIZ Clips (position)

### Baseball · Pitcher · VIZ
<!-- slug: viz-pitcher | file: components/pregame/audio/clips-baseball.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause)_
2. You hear the ball popping into leather in warmups.
_(pause)_
3. Hear the chatter across the infield, a bat in the rack.
_(pause)_
4. You feel the dirt under your cleats.
_(pause)_
5. Feel your glove on your hand.
_(pause)_
6. Feel your jersey, light on your shoulders.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. You step on the rubber, get your sign, and come set. Slow breath. The mound is yours.
_(pause)_
9. Into your windup. Smooth, balanced, nothing rushed — you've thrown this a thousand times.
_(pause)_
10. First pitch. Fastball down the middle, right where you want it. You attack the zone.
_(pause)_
11. It pops the mitt. Strike one. Your catcher fires it back, and you're already locked on the next one.
_(pause)_
12. Curveball, two strikes. You stay tall, trust the grip, and snap it off clean.
_(pause)_
13. He swings through it. Strike three. One pitch at a time — that's how it goes all night.
_(pause)_
14. See yourself own the mound.
_(pause)_
15. You win the first pitch, every hitter, all night — get ahead, attack the zone, work downhill. Your catcher puts down the sign, and you trust it without a second thought.
_(pause)_
16. When a hit drops or a guy reaches, you don't carry it. You step back on the rubber, take your breath, and go again. Next pitch, next out.
_(pause)_
17. Now visualize the next play.
_(pause)_
18. Runner on, three-ball count, the lineup's best hitter digging in. You don't try to be perfect. You trust your stuff, hit your spot, and get the soft ground ball — out of the inning, still in command.
_(pause)_
### Baseball · Catcher · VIZ
<!-- slug: viz-catcher | file: components/pregame/audio/clips-baseball.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause)_
2. You hear the ball popping into leather in warmups.
_(pause)_
3. Hear the chatter across the infield, a bat in the rack.
_(pause)_
4. You feel the dirt under your cleats.
_(pause)_
5. Feel your glove on your hand.
_(pause)_
6. Feel your jersey, light on your shoulders.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. Now visualize the first pitch. You set up behind the plate, give the target low and away.
_(pause)_
9. The pitch comes. You receive it quiet, stick the borderline strike, and frame it back to the zone.
_(pause)_
10. Next one's in the dirt. You drop and block it, keep it in front, and it dies right there.
_(pause)_
11. You catch the clean one, snap it back to the mound, and reset the sign.
_(pause)_
12. Runner takes a lead. You stay low, ready, the whole field in front of you.
_(pause)_
13. He goes. You come up clean, footwork quick, and throw a strike down to the bag.
_(pause)_
14. See yourself run the game back there.
_(pause)_
15. You frame the borderline and steal the strike, you block everything in the dirt, and you call each pitch with conviction.
_(pause)_
16. You control the run game, you keep the staff calm, and you lead from behind the plate.
_(pause)_
17. Now visualize the next play.
_(pause)_
18. Runner on third, contact play on. The ball comes home, you catch it clean, hold the tag, and you make the out.
_(pause)_
### Baseball · Infield · VIZ
<!-- slug: viz-infield | file: components/pregame/audio/clips-baseball.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause)_
2. You hear the ball popping into leather in warmups.
_(pause)_
3. Hear the chatter across the infield, a bat in the rack.
_(pause)_
4. You feel the dirt under your cleats.
_(pause)_
5. Feel your glove on your hand.
_(pause)_
6. Feel your jersey, light on your shoulders.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. The pitcher comes set. You take your ready hop as he releases, weight forward, on the balls of your feet.
_(pause)_
9. It's hit your way — a two-hopper into the hole. You read the bounce early and get a good hop.
_(pause)_
10. You field it clean, soft hands, the ball into your glove and out, working through it.
_(pause)_
11. You set your feet, line up the throw, and let it go with intent across the diamond.
_(pause)_
12. It beats the runner by a step. One out. You reset and find the ball again.
_(pause)_
13. You exhale, glance to your pitcher, and get back on your toes for the next one.
_(pause)_
14. See yourself quiet hands, sure feet.
_(pause)_
15. The routine play is your play — you stay down, field it clean, and throw with intent, the same every time.
_(pause)_
16. A grounder up the middle, you flip it to the bag, turn two, and the inning is over before it starts.
_(pause)_
17. Now visualize the next play.
_(pause)_
18. A tough in-between hop with the runner going — you stay down, take what the ball gives you, knock it down, and still get your out.
_(pause)_
### Baseball · Outfield · VIZ
<!-- slug: viz-outfield | file: components/pregame/audio/clips-baseball.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause)_
2. You hear the ball popping into leather in warmups.
_(pause)_
3. Hear the chatter across the infield, a bat in the rack.
_(pause)_
4. You feel the dirt under your cleats.
_(pause)_
5. Feel your glove on your hand.
_(pause)_
6. Feel your jersey, light on your shoulders.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. You jog out to your spot as the first inning starts, settling in, eyes in on the hitter.
_(pause)_
9. The first one's hit your way — you read it off the bat and your first step is back.
_(pause)_
10. You take the route, no drifting, square to the ball the whole way.
_(pause)_
11. You catch it at full speed and come up throwing.
_(pause)_
12. You hit the cutoff man clean, right on line.
_(pause)_
13. Loud, ready, you reset for the next pitch.
_(pause)_
14. See yourself track it, run it down.
_(pause)_
15. You read it off the bat, take the right route, and catch it at full speed.
_(pause)_
16. You come up and hit the cutoff — then you stay loud, stay ready, locked in through the quiet.
_(pause)_
17. Now visualize the next play.
_(pause)_
18. One gets into the gap and tests you — you read it, run it down, and play it clean off the wall to the cutoff.
_(pause)_
## Hard Moment Clips — Pitcher

### Baseball · Pitcher · strikeout
<!-- slug: hm-bsb-pitcher-strikeout | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are up with a runner on. The pitch looks low, you hold off, and the ump rings you up. You drop the bat and start the walk back to the dugout.
_(pause)_
3. Feel what your body does. Face gets hot. Shoulders drop on the walk back. I can't get anything done up here.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That at-bat is over. Grab your glove and get your head back on the mound.
_(pause)_
6. You hit on the mound, not in the box. Next inning, one pitch at a time, trust your stuff.
_(pause)_
7. Speak the truth. That strikeout is real and it is over. It is not your identity. Get back on the mound and go again.
_(pause)_
### Baseball · Pitcher · slump
<!-- slug: hm-bsb-pitcher-slump | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You take the mound for another start. The ERA is climbing, the last three outings were rough, and before you even throw a pitch you feel it — here we go again.
_(pause)_
3. Feel what your body does. Grip tightens on the ball. Shoulders ride up. Breath goes short. And the voice shows up right on cue — "I've lost it, it's gone." That's the slump talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The slump is real, but it isn't on the mound with you right now. Right now there's one hitter, one pitch. That's the whole job. Throw it.
_(pause)_
6. Stop steering it. Loosen the grip, trust your stuff, find the mitt, and let it go. One target, one pitch — nothing past that.
_(pause)_
7. Speak the truth. This is a rough stretch, and a rough stretch is real. It is not who you are. Your worth was never riding on this outing — you're secure before the first pitch and after the last one, win or lose. One pitch at a time. Reset and go again.
_(pause)_
### Baseball · Pitcher · big-hit
<!-- slug: hm-bsb-pitcher-big-hit | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are one strike away. You come back to the fastball, and he turns on it — barrels it. You watch it carry, all the way over the fence. Walk-off.
_(pause)_
3. Feel what your body does. Shoulders drop. The ball goes heavy in your hand. Your throat tightens, and the thought shows up — I lost us the game.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That pitch is over — it's one pitch, not the whole night. You made him earn it and he did, and that's baseball. The next time the ball is in your hand, you compete again.
_(pause)_
6. Slow it down. You don't have to be perfect — you have to throw one good pitch. Find the mitt, trust your stuff, and let the rest go. The mitt, not the fence.
_(pause)_
7. Speak the truth. That pitch tonight is real, and it's over. It doesn't decide what you're worth, and it is not your identity. You're secure no matter how that ball carried. Reset and go again.
_(pause)_
### Baseball · Pitcher · lose-command
<!-- slug: hm-bsb-pitcher-lose-command | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You miss with the fastball, then miss again. You start aiming it, guiding it to the mitt, and the next two go to the backstop. Ball four. Bases loaded on walks.
_(pause)_
3. Feel what your body does. Your grip squeezes the seams. Your shoulders ride up toward your ears. Your breath goes shallow. And the thought shows up: the zone is gone and I can't find it. Notice that thought. It's loud right now, but it's not a fact — it's just the miss talking.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That walk is over. There's nothing left to fix in it. Get back on the rubber, take the sign, and give this one pitch everything — just to the mitt.
_(pause)_
6. Loosen the grip and slow it down. You're not aiming it tonight. Quit steering the ball — trust your arm and let it go to the glove. One target, one pitch.
_(pause)_
7. Speak the truth. Losing the zone tonight is real, and it's only tonight — it is not who you are. Your worth doesn't ride on this inning; you're already secure, so you can throw free. One pitch, trust your arm. Reset and go again.
_(pause)_
### Baseball · Pitcher · pulled
<!-- slug: hm-bsb-pitcher-pulled | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are walking off the mound. You hand the manager the ball. The bullpen door swings open behind you, and the dugout is quiet as you sit down.
_(pause)_
3. Feel what your body does. Throat tightens. Eyes drop to the dirt. Shoulders cave. I'm not good enough to be out there.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That outing is over — it ends at the mound, not in the rest of your night. Coming out tonight is a call about this game, not about you. Sit tall and stay in it with your guys.
_(pause)_
6. Don't grip the next chance and try to be perfect to make up for this. The next time the ball's in your hand, it's one pitch — slow it down, trust your stuff, hit the mitt.
_(pause)_
7. Speak the truth. Getting pulled tonight is real, and it stings. It is not who you are, and it does not touch your worth — you are secure no matter how tonight goes. Reset and go again.
_(pause)_
### Baseball · Pitcher · nervous
<!-- slug: hm-bsb-pitcher-nervous | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are on the bump, first pitch against the top of a stacked lineup. The gun is up behind the plate. You miss with the first three, and now it's 3-0 on the leadoff guy.
_(pause)_
3. Feel what your body does. Chest tightens. Grip squeezes the ball. Shoulders climb up toward your ears. I'm going to walk the yard and they'll see I don't belong here.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That count is over. Step off, get the sign, and throw the next one to the mitt.
_(pause)_
6. Stop steering it. Slow your tempo, pick the glove, and let one clean pitch go.
_(pause)_
7. Speak the truth. The nerves are real and the gun is real. They are not your identity. Reset and go again, one pitch.
_(pause)_
### Baseball · Pitcher · hit-batter
<!-- slug: hm-bsb-pitcher-hit-batter | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You come inside and miss. The pitch rides in and drills the batter. He goes down, shakes it off, and takes his base. Now you have to throw the next one.
_(pause)_
3. Feel what your body does. Chest tightens. Grip squeezes the ball. Front shoulder flies open early. I can't trust myself inside — what if I do it again.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That pitch is over. He took his base. Get the sign, get back on the rubber, and throw the next one with conviction.
_(pause)_
6. Don't aim it. Aiming is what misses. Pick your spot, trust your mechanics, and let it go — full, not careful.
_(pause)_
7. Speak the truth. Hitting him is real. It is not your identity. Commit to the next pitch and go again.
_(pause)_
### Baseball · Pitcher · start-slow
<!-- slug: hm-bsb-pitcher-start-slow | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You walk the leadoff hitter on four pitches. Now you are behind in the count again, the zone feels small, and the game is speeding up on you.
_(pause)_
3. Feel what your body does. Grip tightens on the ball. Breath gets short. Tempo races. I don't have it today.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That walk is over. Step off the rubber, get the sign, and throw one good pitch to your spot.
_(pause)_
6. Slow it down. One pitch, your tempo, and trust the mitt where it sets up.
_(pause)_
7. Speak the truth. A rough start is real. It is not your identity. Slow your tempo, hit your spot, and go again.
_(pause)_
### Baseball · Pitcher · fall-behind-early
<!-- slug: hm-bsb-pitcher-fall-behind-early | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You hang a fastball and they line it into the gap. Two more cross before you get the third out. You walk off the mound down four in the first.
_(pause)_
3. Feel what your body does. Grip tightens on the seams. Shoulders climb toward your ears. I already lost this game for us.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That inning is over. Get the next hitter — down in the zone, one pitch, trust the mitt.
_(pause)_
6. Slow your tempo. Stop trying to get all four runs back with one pitch. Just compete for this one.
_(pause)_
7. Speak the truth. That inning is real, and it is over. It is not your identity. Reset and go again.
_(pause)_
## Hard Moment Clips — Catcher

### Baseball · Catcher · strikeout
<!-- slug: hm-bsb-catcher-strikeout | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're up with two outs to end the inning. The pitch breaks, you swing through it, and the ump punches you out. Now you've got to strap the gear back on and go run the staff.
_(pause)_
3. Feel what your body does. Jaw sets. Chest goes tight pulling the mask down. I just failed, and now they need me to lead this.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That at-bat is over. Get the gear on, get behind the plate, and run the next half-inning.
_(pause)_
6. Slow it down. Don't carry the strikeout into your sequence. One sign, one pitch, work with your guy.
_(pause)_
7. Speak the truth. That strikeout is real and it's over. It is not who you are. Get behind the plate and call the next pitch.
_(pause)_
### Baseball · Catcher · slump
<!-- slug: hm-bsb-catcher-slump | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You ground into the third inning-ender, 0-for-20 now. You jog out, strap the gear back on, and squat to call the next half-inning with the whole staff on your shoulders.
_(pause)_
3. Feel what your body does. Shoulders sag behind the plate. Your grip tightens on the bat in your head, not the mitt in your hand. The voice says I'm gone, I've got nothing tonight. That's the slump talking, not the truth.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That at-bat is over, and the offense isn't your job right now. Put down a sign and catch this pitch.
_(pause)_
6. You don't have to carry the whole game. One pitch, one target, frame it clean — that's the only job behind the plate right now.
_(pause)_
7. Speak the truth. Tonight's slump is real. It is not who you are, and it doesn't move what you're worth — you're secure whether the hits fall or not. Catch this pitch, call this game. Reset and go again.
_(pause)_
### Baseball · Catcher · error
<!-- slug: hm-bsb-catcher-error | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You set up for the curveball and it short-hops you. The ball kicks off your chest protector to the backstop, and the runner scores from third before you can get to it.
_(pause)_
3. Feel what your body does. Throat tightens. Hands grip the mitt harder. That run is on me.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That run is over. Get back behind the plate and call the next pitch.
_(pause)_
6. Don't try to be perfect on every block. Body in front, chin down, smother the next one.
_(pause)_
7. Speak the truth. That run is over. It is not who you are. Get back behind the plate and run the game.
_(pause)_
### Baseball · Catcher · big-hit
<!-- slug: hm-bsb-catcher-big-hit | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You put down the sign. He sat dead-red on it and put it over the wall. You watch him round the bases as the run scores.
_(pause)_
3. Feel what your body does. Mask feels heavy. Throat tightens. Glove hand drops. I called the wrong pitch.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That pitch is over. Get a new ball, set the target, and call the next one with conviction.
_(pause)_
6. Stop hunting the perfect pitch. Trust the sequence, trust your guy, and put down the next sign clean.
_(pause)_
7. Speak the truth. That home run is real. It is not your identity. Reset the count and call the next pitch.
_(pause)_
### Baseball · Catcher · lose-command
<!-- slug: hm-bsb-catcher-lose-command | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You drop into the crouch, catch strike three, and go to throw it back to your pitcher. The easy toss. It sails over his head to the screen.
_(pause)_
3. Feel what your body does. The hand grips the seams too tight. The shoulder locks up. The throat goes dry. And the thought shows up fast: my throw is gone. Let it show up. You don't have to believe it.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That throw is over. One throw tonight got away from you — not the throw you've made ten thousand times. Tonight, this one. That's all this is.
_(pause)_
6. Don't speed up to fix it. Speeding up is what got loose. Slow down, breathe out, find his glove, and let this next one go easy to the target.
_(pause)_
7. Speak the truth. That throw tonight got away. It is not your identity, and it is not your worth — you are secure before this throw and after it. Find the glove. Reset and go again.
_(pause)_
### Baseball · Catcher · benched
<!-- slug: hm-bsb-catcher-benched | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are catching a tight game. Coach calls time, walks out, and sends in the other catcher. You hand off the gear and walk back to the dugout.
_(pause)_
3. Feel what your body does. Throat tightens. Shoulders drop. Eyes go to the ground. I lost the staff. They don't trust me back there.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That call is over. Get on the rail, lock onto the pitcher, and stay in the game from here.
_(pause)_
6. Don't press to prove a point. Read every sequence, log what's working, and be ready when your name is called.
_(pause)_
7. Speak the truth. Getting benched is real. It is not your identity. Stay locked in, stay ready, and go again.
_(pause)_
### Baseball · Catcher · nervous
<!-- slug: hm-bsb-catcher-nervous | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You set up low and away. He uncorks one harder than anything you've caught, and it tails late. You stab at it and it clanks off the heel of your glove to the backstop.
_(pause)_
3. Feel what your body does. Shoulders creep up. Hands get tight. Breath goes shallow. I can't handle this guy.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That ball is over. Reset behind the plate and call the next one.
_(pause)_
6. Soft hands. Let it travel, give him a quiet target, and trust your glove to do the work.
_(pause)_
7. Speak the truth. That ball got by you, and it is over. It is not who you are. Get back behind the plate and catch the next one.
_(pause)_
### Baseball · Catcher · foul-tip
<!-- slug: hm-bsb-catcher-foul-tip | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You set up low and away. The pitch crosses you up and catches you flush on the bare hand. It stings and you come out of your crouch.
_(pause)_
3. Feel what your body does. Hand throbs. Jaw clenches. Shoulders pull in. I'm going to flinch on the next one.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That pitch is over. Shake the hand out, get back down, and put down the next sign.
_(pause)_
6. Don't catch soft. Give him a firm target, sit behind it, and stick the next strike.
_(pause)_
7. Speak the truth. The sting is real and it's over. It is not who you are. Get back down, call the next one, and go again.
_(pause)_
### Baseball · Catcher · start-slow
<!-- slug: hm-bsb-catcher-start-slow | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You set up inside, the fastball runs in on you, and it handcuffs you and skips to the backstop. The runner moves up. First inning, and you still can't feel the ball in your mitt.
_(pause)_
3. Feel what your body does. Hands grip tight. Shoulders climb. Breathing goes shallow. I'm too slow back here, the pitcher can't trust me.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That ball in the dirt is over. New ball, fresh sign, give him a steady target down the middle.
_(pause)_
6. Soft hands. Stop reaching for it — let the ball travel and receive it quiet. One pitch, frame it clean.
_(pause)_
7. Speak the truth. That ball getting by you is real. It is not who you are. Reset your target and catch the next one.
_(pause)_
### Baseball · Catcher · fall-behind-early
<!-- slug: hm-bsb-catcher-fall-behind-early | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are behind the plate, down three in the second. Your pitcher just walked the bases loaded, and you can see his shoulders drop. He looks in at you for the sign and he's shaking his head before you even put it down.
_(pause)_
3. Feel what your body does. Chest tightens under the gear. Your hand grips the ball too hard on the throwback. If I can't settle him, this whole thing is on me.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That inning is still going, but the last pitch is over. Step out, call time, and walk it out to the mound.
_(pause)_
6. Slow it down. You don't have to fix the score. Give him one target, one pitch, and trust your glove to hold it.
_(pause)_
7. Speak the truth. Falling behind early is real. It is not your identity. Get back there, steady him one pitch at a time, and go again.
_(pause)_
## Hard Moment Clips — Infield

### Baseball · Infield · strikeout
<!-- slug: hm-bsb-infield-strikeout | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are up with a chance to put one in play. The pitch starts middle and breaks down, and you wave over the top of it. Strike three. Third punch-out of the night, walking back to the dugout.
_(pause)_
3. Feel what your body does. Jaw sets. Hands grip the bat too tight. Shoulders drop on the walk back. I can't buy a hit tonight.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That at-bat is over. Glove on, get your feet moving, and be ready on the next pitch.
_(pause)_
6. Don't carry the bat into the field. Reset between the lines, read the hop, and trust your hands on the next ball hit your way.
_(pause)_
7. Speak the truth. Three strikeouts is real. It is not your identity. Get back in the field, win the next play, and go again.
_(pause)_
### Baseball · Infield · slump
<!-- slug: hm-bsb-infield-slump | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You step in 0-for-20. You barber a fastball you should crush, but you roll over it and beat it into the ground, right at the shortstop. Another loud out.
_(pause)_
3. Feel what your body does. Shoulders tighten. Your hands choke up hard on the knob. And the voice shows up: I'm lost. I can't hit anymore. Hear it for what it is — a thought, not a fact. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That at-bat is over. It's one at-bat tonight — not a verdict, not who you are. Step out of the box, one slow breath, and step back in.
_(pause)_
6. Loosen your grip. This pitch only: stay inside the ball, shorten your swing, drive a strike back up the middle. One good swing, nothing more.
_(pause)_
7. Speak the truth. The slump is real, but it's this stretch — not forever, and not who you are. Your worth was settled before this at-bat and it holds after it, whatever the scoreboard says. You're secure. Reset and go again.
_(pause)_
### Baseball · Infield · error
<!-- slug: hm-bsb-infield-error | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You take a routine grounder, and it kicks off the heel of your glove. Or the throw sails, pulls the first baseman off the bag — and the E lights up on the board with your number on it.
_(pause)_
3. Feel what your body does. Ears go hot. Hands feel stiff in the glove. Everyone saw it, and it's up there for good.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That error is over. Get your feet ready and want the next ball hit to you.
_(pause)_
6. Don't play scared of the next one. Stay low, charge it, and trust your hands.
_(pause)_
7. Speak the truth. That error is real, and it's on the board. It is not your identity. Reset and go again.
_(pause)_
### Baseball · Infield · big-hit
<!-- slug: hm-bsb-infield-big-hit | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are holding at double-play depth. A ball gets ripped on the dirt to your backhand side, just past your dive, through the hole. It rolls to the wall and the go-ahead run scores.
_(pause)_
3. Feel what your body does. Stomach drops. Feet plant and go heavy. Shoulders sink as you watch it skip past. I should have had that. I cost us the game.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That ball is over. Get back on your toes and expect the next one hit right at you.
_(pause)_
6. Stop replaying the dive. Get low, move your feet, and trust your first step on the next one.
_(pause)_
7. Speak the truth. That hit is real, and it is over. It is not who you are. Reset, get ready, and go again.
_(pause)_
### Baseball · Infield · lose-command
<!-- slug: hm-bsb-infield-lose-command | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You field a routine grounder and set to throw to first. The throw you've made ten thousand times sails wide, or dies in the dirt halfway there.
_(pause)_
3. Feel what your body does. The grip goes tight. The shoulder locks. The hands start to shake, and the thought shows up fast: "My hands won't work right now." That's the feeling in this moment. It is not a fact about you.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That throw is over — it doesn't get the next one. Field the next ball clean and make the simple throw to first.
_(pause)_
6. Slow it down. Loosen the grip, pick a small target on the chest, and throw through it instead of aiming at it.
_(pause)_
7. Speak the truth. One bad throw tonight is real. It is not who you are, and it doesn't change that you're secure. Loosen up, trust your hands, and make the next one. Reset and go again.
_(pause)_
### Baseball · Infield · benched
<!-- slug: hm-bsb-infield-benched | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You boot the ground ball, or you go down again at the plate. An inning later, coach reads a new name at your spot. You walk to the bench and watch someone else take the field.
_(pause)_
3. Feel what your body does. Heat in your face. Stomach drops. Eyes stuck on the dirt. And the voice shows up fast: I lost my spot. I'm done here. Hear it for what it is — a loud thought after a hard inning, not a fact.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That at-bat is over, and so is that inning. They are behind you now. You are still in this dugout, still in this game. Read the hitters, talk the situation out loud, and be ready when your name comes back.
_(pause)_
6. Slow it down. This is one night, not the season — one inning, not your career. Stay loud on the rail, keep your glove warm, and be the first one up when they need you.
_(pause)_
7. Speak the truth. The bench tonight is real. It is not who you are. Your spot can be lost and earned back, but your worth was never on that line — you compete from a victory that is already yours, win or sit. Reset and go again when they call you.
_(pause)_
### Baseball · Infield · nervous
<!-- slug: hm-bsb-infield-nervous | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You set up before the first pitch, hoping it goes anywhere but to you. Then the batter chops a routine two-hopper right at you, and you feel your hands tighten before the ball even gets there.
_(pause)_
3. Feel what your body does. Hands grip tight. Breath goes shallow. Weight sinks back onto your heels. I can't be trusted with a routine ball.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That play is over. Get back in your ready position and want the next one hit to you.
_(pause)_
6. Soft hands. Stay low, charge the ball, and field it out front instead of waiting on your heels.
_(pause)_
7. Speak the truth. The nerves are real, and one ground ball does not decide who you are. It is not your identity. Reset and go again.
_(pause)_
### Baseball · Infield · hbp
<!-- slug: hm-bsb-infield-hbp | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are dug in at the plate. A fastball rides up and in, and you can't get the hands out. It catches you on the elbow and drops you back.
_(pause)_
3. Feel what your body does. Elbow stings. Breath catches. Hands clamp down. I flinched, I should've gotten out of the way.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That at-bat is over. Drop the bat, take your base, and run.
_(pause)_
6. Shake the arm out and loosen the hands. The ball off you doesn't change how you field — soft hands, stay low, play the next ground ball clean.
_(pause)_
7. Speak the truth. That sting is real. It is not your identity. Take your base, loosen up, and play the next ball clean.
_(pause)_
### Baseball · Infield · start-slow
<!-- slug: hm-bsb-infield-start-slow | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You take the field still feeling slow, and the first grounder is on you fast. You're late getting your feet going, the ball eats you up on a short hop, and it kicks off your glove into the grass.
_(pause)_
3. Feel what your body does. Hands tighten. Feet feel stuck in cement. I can't get going today.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That error is over. Reset your feet and get ready for the next ball.
_(pause)_
6. Don't press to make it up. Stay low, work through the ball, and let the next hop come to you.
_(pause)_
7. Speak the truth. That error is over. Get your feet moving early and field the next one clean.
_(pause)_
### Baseball · Infield · fall-behind-early
<!-- slug: hm-bsb-infield-fall-behind-early | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are at short, down three in the second. A routine two-hopper comes right at you and you rush it to make something happen. The ball kicks off the heel of your glove into the outfield.
_(pause)_
3. Feel what your body does. Chest tightens. Hands start to grip. Feet get quick and sloppy. I have to fix this whole game by myself.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That error is over. Reset your feet and play the next ground ball clean.
_(pause)_
6. Slow it down. You do not have to answer the deficit on one play. Stay back, field it through, make the routine throw.
_(pause)_
7. Speak the truth. That error is real and it is over. It is not your identity. Get back in your stance, breathe, and play the next one clean.
_(pause)_
## Hard Moment Clips — Outfield

### Baseball · Outfield · strikeout
<!-- slug: hm-bsb-outfield-strikeout | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You take strike three looking, frozen on a pitch you should have hammered. You drop your head and start the long walk out to your position, and you carry the 0-fer out there with you.
_(pause)_
3. Feel what your body does. Shoulders drop. Feet go flat in the grass. Eyes drift in. I'm not a hitter today.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That at-bat is over. You play defense now — read the hitter, get on your toes before the pitch.
_(pause)_
6. Don't drift out here. Every pitch, move your feet and expect the ball off the bat.
_(pause)_
7. Speak the truth. That strikeout is real and it's over. It is not who you are. Get your feet moving, win the next pitch, and go again.
_(pause)_
### Baseball · Outfield · slump
<!-- slug: hm-bsb-outfield-slump | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are 0-for-20 and pressing. The pitcher spins one low and away, off the plate, and you chase it — out in front, rolling it over to short. The long walk back to the dugout.
_(pause)_
3. Feel what your body does. Hands grip tighter. Shoulders climb up by your ears. And the voice shows up: I'm just an out now. Hear it — that's the slump talking, not the truth.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That at-bat is over. Shrink the zone back down and hunt one good pitch to drive.
_(pause)_
6. Stop pressing. You don't fix twenty swings in one. Let the ball travel, take your walk if it's there, and go run one down in the gap.
_(pause)_
7. Speak the truth. The slump is real, but it's tonight, not forever — and it is not who you are. Your name doesn't change with your line. Shrink the zone, control this at-bat, reset and go again.
_(pause)_
### Baseball · Outfield · error
<!-- slug: hm-bsb-outfield-error | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You drift back on a routine fly to the gap. You lose it in the lights for a half-second, get your glove up late, and it clanks off the heel and drops. The runner is already rounding second.
_(pause)_
3. Feel what your body does. Throat tightens. Glove hand goes stiff. Feet stop moving. How do you miss that.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That error is over. Hit your cutoff, get back to depth, and read the next one off the bat.
_(pause)_
6. Don't play scared out there. First step in, trust your read, and let your feet take you to the ball.
_(pause)_
7. Speak the truth. That error is real and it is over. It is not who you are. Reset and go again.
_(pause)_
### Baseball · Outfield · big-hit
<!-- slug: hm-bsb-outfield-big-hit | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You read it in. The ball carries over your head and splits the gap. You turn and run, and by the time you hit the cutoff, two have scored and they're standing on third.
_(pause)_
3. Feel what your body does. Chest tightens. First step locks. Throat goes dry. I can't read a ball off the bat.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That ball is over. Reset your depth and play the next pitch off the bat.
_(pause)_
6. Slow your first read. Trust your break going back, find the wall early, and hit your cutoff.
_(pause)_
7. Speak the truth. That gapper is over. It is not who you are. Reset your feet, trust the next read, and go again.
_(pause)_
### Baseball · Outfield · lose-command
<!-- slug: hm-bsb-outfield-lose-command | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You run down the ball in the gap and come up throwing. The throw sails high over the cutoff man, and the runner reads it and takes the extra base.
_(pause)_
3. Feel what your body does. Shoulder tightens. Your grip squeezes the seams. I can't trust my arm when it matters.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That throw is over. Back up the play, then get yourself behind the next ball.
_(pause)_
6. Slow it down. Next ball, throw on a line through the cutoff man and let the relay do the work.
_(pause)_
7. Speak the truth. That throw is over. It is not your identity. Hit the cutoff man and make the next play.
_(pause)_
### Baseball · Outfield · benched
<!-- slug: hm-bsb-outfield-benched | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are jogging in from right field. The coach is sending a defensive replacement out for the last two innings. You pass him on the warning track and take the long walk to the dugout.
_(pause)_
3. Feel what your body does. Face goes hot. Shoulders drop on the walk in. Hands feel useless without a glove. I'm a liability out there now.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That decision is made, and it's over. Stay in the game from the rail — read the count, talk up the next guy, be ready.
_(pause)_
6. Don't press to earn it back. When you get back out there, trust your first read, take the clean route, hit the cutoff.
_(pause)_
7. Speak the truth. Getting pulled is real. It is not your identity. Stay locked in, take the next route clean, and go again.
_(pause)_
### Baseball · Outfield · nervous
<!-- slug: hm-bsb-outfield-nervous | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are tracking a deep fly ball with the scouts' guns on you. You take a bad first step in, drift back too late, and the ball drops behind you for a double.
_(pause)_
3. Feel what your body does. Chest tightens. Feet get heavy reading the ball. I can't trust my reads with them watching.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That misplay is over. Get behind the next ball and hit your cutoff.
_(pause)_
6. Stop drifting. Read it off the bat, trust your first step, and run.
_(pause)_
7. Speak the truth. That misplay is real. It is not your identity. Trust the read, run hard, and go again.
_(pause)_
### Baseball · Outfield · hbp
<!-- slug: hm-bsb-outfield-hbp | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are dug in at the plate. The pitch rides in on your hands and catches you on the elbow. The sting shoots up your arm and you drop the bat.
_(pause)_
3. Feel what your body does. Elbow throbs. Breath catches. Shoulders pull in. I'm rattled now, I'll bail on the next inside pitch.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That pitch is over, and the base is yours. Shake out the arm and take your base.
_(pause)_
6. Don't carry the sting out to the grass. Settle the breath, get your lead, and put your eyes back on the ball.
_(pause)_
7. Speak the truth. The pitch stung, and now you're on base. It is not who you are. Reset and go again.
_(pause)_
### Baseball · Outfield · start-slow
<!-- slug: hm-bsb-outfield-start-slow | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are in left, first inning. The ball jumps off the bat and you read it late, take a flat-footed first step, and have to drift back on your heels to glove it.
_(pause)_
3. Feel what your body does. Shoulders tense. Feet feel stuck in the grass. I'm not even awake out here yet.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That read is over. Get on your toes and play the next one off the bat.
_(pause)_
6. Stop pressing. First step back, trust your read, and get behind the ball early.
_(pause)_
7. Speak the truth. One slow read is real, and it is over. It is not who you are. Reset and go again.
_(pause)_
### Baseball · Outfield · fall-behind-early
<!-- slug: hm-bsb-outfield-fall-behind-early | file: components/pregame/audio/clips-baseball.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are in right field, down a few early. A ball drops in front of you and you charge it hard, trying to make something happen, and it skips past your glove to the wall.
_(pause)_
3. Feel what your body does. Chest tightens. Hands start gripping for a throw before you have the ball. I have to get all these runs back myself.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That misplay is over. Get behind the next ball, field it clean, and hit the cutoff man.
_(pause)_
6. Slow it down. You don't have to get it all back on one play. Stay back, take the sure out, trust your throw.
_(pause)_
7. Speak the truth. Falling behind is real, and so is that misplay. It is not your identity. Stay back, make the next clean play, and go again.
_(pause)_
