# From Victory · Script Book · Basketball


## HOW TO EDIT

1. Edit **only** the numbered prose lines (e.g. `1. Your sentence here.`).
2. Do NOT change `### titles`, `<!-- slug ... -->` comments, `_(pause)_` markers, or line numbers.
3. One numbered line = one complete sentence (no line breaks within a numbered item).
4. For text-mode fallback lines, same rules apply to the numbered body lines.
5. When done editing, run from `apps/web/`:
   ```
   npm run scripts:apply            # dry-run — shows what will change
   npm run scripts:apply -- --write # write the changes into the TS source
   ```
6. For LIVE sports (hockey, basketball, golf) also run:
   ```
   npm run audio:generate -- --mode clips
   ```
   Then bump `MANIFEST_VERSION` per the FV-142 rule (the generator prints the new value).
7. DORMANT sports (football, swimming, track-field): just apply and wait for the audio render pass.

---

## Text-mode fallback (Basketball)

These lines appear on-screen in text mode (no audio). Tokens like `{{role}}`, `{{adversity}}`, etc. are substituted at runtime — edit them as-is.

<!-- audioScript#0 | eyebrow: Identity -->
1. ${SCRIPTURE_REF} — ${SCRIPTURE_TEXT} You are not playing to become enough. In Christ, you are already loved. Receive that before you compete.

<!-- audioScript#1 | eyebrow: Settle -->
2. Sit tall. Long exhale. Lead your body back to ready. Four counts in. Six counts out. Let your shoulders drop.

<!-- audioScript#2 | eyebrow: See the gym -->
3. See the floor. Hear the squeak, the bounce, the rim. Feel the ball in your hands, your shoes on the hardwood. You belong here. You are ready.

<!-- audioScript#3 | eyebrow: Your first possession -->
4. You check in at the scorer's table. Sprint the lane. Eyes up. Find the open man. Simple, strong play. Recover. Next action.

<!-- audioScript#4 | eyebrow: Play your role · {{role}} -->
5. {{roleScenes}}

<!-- audioScript#5 | eyebrow: If this happens -->
6. {{adversity}} See it. Feel it. Breathe. Speak truth. Take the next faithful action. Your mistake is real. It is not your identity.

<!-- audioScript#6 | eyebrow: Coach yourself -->
7. {{selfTalk}} When pressure hits, return here. Your anchor: {{anchor}}. Your cue word: {{cueWord}}.

<!-- audioScript#7 | eyebrow: Send-off -->
8. Lord, help me compete with courage, humility, and joy. Help me serve my team, respond well to mistakes, and remember that my worth is secure in You. Amen. Play from victory.
---

## Audio Clips

## VIZ Clips — Flagship (position)

### Basketball · Guard · VIZ (flagship)
<!-- slug: viz-guard | file: components/pregame/audio/clips.ts -->

1. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
2. You hear the ball on the floor in warmups.
_(pause)_
3. Hear the squeak of shoes, the rim after a shot.
_(pause)_
4. You feel the ball in your hands. Feel the grip.
_(pause)_
5. Feel your feet under you.
_(pause)_
6. Feel your jersey, light on your shoulders.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. Now visualize the tip. You bring the ball up.
_(pause)_
9. You push the pace up the floor.
_(pause)_
10. Your eyes are up. You see the floor.
_(pause)_
11. You take care of the rock. Strong with the ball.
_(pause)_
12. Get downhill. Make the simple, strong play.
_(pause)_
13. Get back on defense. Talk, be loud.
_(pause)_
14. See yourself run the team with poise.
_(pause)_
15. You push the pace, you see the floor, you take care of the rock.
_(pause)_
16. You get downhill, draw two, and hit the open man.
_(pause)_
17. Now visualize the next play.
_(pause)_
18. They push the ball back at you. You pick up early, you talk, and you turn them away.
_(pause)_
### Basketball · Wing · VIZ (flagship)
<!-- slug: viz-wing | file: components/pregame/audio/clips.ts -->

1. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
2. You hear the ball on the floor in warmups.
_(pause)_
3. Hear the squeak of shoes, the rim after a shot.
_(pause)_
4. You feel the ball in your hands. Feel the grip.
_(pause)_
5. Feel your feet under you.
_(pause)_
6. Feel your jersey, light on your shoulders.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. Now visualize the first possession. You spot up on the wing.
_(pause)_
9. The ball swings to you. Feet set, shoot it.
_(pause)_
10. You sprint the lane in transition.
_(pause)_
11. You take the next open shot. No hesitation.
_(pause)_
12. You lock up your man. Stay in front.
_(pause)_
13. Box out, then close out hard.
_(pause)_
14. See yourself stay ready and stay aggressive.
_(pause)_
15. Feet set, you shoot it. You sprint the lane.
_(pause)_
16. You take the next open shot, and you lock up your man.
_(pause)_
17. Now visualize the next play.
_(pause)_
18. Your man catches it. You stay down, you contest, and you crash the glass.
_(pause)_
### Basketball · Big · VIZ (flagship)
<!-- slug: viz-big | file: components/pregame/audio/clips.ts -->

1. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
2. You hear the ball on the floor in warmups.
_(pause)_
3. Hear the squeak of shoes, the rim after a shot.
_(pause)_
4. You feel the ball in your hands. Feel the grip.
_(pause)_
5. Feel your feet under you.
_(pause)_
6. Feel your jersey, light on your shoulders.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. Now visualize the tip. You go up and win it.
_(pause)_
9. You seal your man and post strong.
_(pause)_
10. You hit the glass. Two hands, strong.
_(pause)_
11. You roll hard to the rim and finish.
_(pause)_
12. On defense, you move your feet and stay vertical.
_(pause)_
13. You protect the rim. Straight up, no foul.
_(pause)_
14. See yourself own the paint.
_(pause)_
15. You seal and post strong, you hit the glass, you protect the rim.
_(pause)_
16. You roll hard and finish through contact.
_(pause)_
17. Now visualize the next play.
_(pause)_
18. They attack the paint. You move your feet, you stay vertical, and you wall up without fouling.
_(pause)_
## VIZ Clips — Positive Plays

### Basketball · Guard · pick-and-roll (viz play)
<!-- slug: viz-guard-pick-and-roll | file: components/pregame/audio/clips-viz.ts -->

1. See yourself bringing the ball up, calm, with the floor spread in front of you.
_(pause)_
2. You bring it up, eyes on the floor.
_(pause)_
3. You call for the screen. Your big climbs up to set it.
_(pause)_
4. You wait for the screen to hit. You do not leave early.
_(pause)_
5. You snake off the pick, shoulder past his man.
_(pause)_
6. The big drops back in coverage.
_(pause)_
7. You see the gap open in the lane.
_(pause)_
8. You get downhill, two feet in the paint.
_(pause)_
9. The low defender steps toward you.
_(pause)_
10. You read it calmly — finish if he stays, pass if he commits.
_(pause)_
11. Tonight, he stays. You lay it in soft off the glass.
_(pause)_
12. Good read. Good pace. Next possession.
_(pause)_
### Basketball · Guard · transition-pullup (viz play)
<!-- slug: viz-guard-transition-pullup | file: components/pregame/audio/clips-viz.ts -->

1. See the rebound hit your hands and feel the floor open in transition.
_(pause)_
2. You snatch the rebound and push.
_(pause)_
3. You see numbers, and the defense is backpedaling.
_(pause)_
4. One dribble, two, eating up the floor.
_(pause)_
5. The defender keeps giving ground.
_(pause)_
6. You feel your feet hit the spot just inside the line.
_(pause)_
7. You rise up, balanced, eyes on the rim.
_(pause)_
8. Clean release.
_(pause)_
9. It drops.
_(pause)_
10. You sprint back, already talking on defense.
_(pause)_
### Basketball · Guard · live-steal (viz play)
<!-- slug: viz-guard-live-steal | file: components/pregame/audio/clips-viz.ts -->

1. See yourself picking up full court, low, active, and ready to pressure.
_(pause)_
2. You pick up your man full court.
_(pause)_
3. You're in a stance, chest in front, feet active.
_(pause)_
4. He tries to turn the corner.
_(pause)_
5. You cut him off with your chest, not your hands.
_(pause)_
6. He puts his head down to dribble.
_(pause)_
7. You time the bounce, dig down once, and knock it loose.
_(pause)_
8. You scoop it on the run, no one between you and the rim.
_(pause)_
9. You finish it strong on the other end.
_(pause)_
10. Feet first. Hands second. Clean defense.
_(pause)_
### Basketball · Guard · drive-and-kick (viz play)
<!-- slug: viz-guard-drive-and-kick | file: components/pregame/audio/clips-viz.ts -->

1. See the closeout coming and know you are ready to attack the advantage.
_(pause)_
2. You catch it at the top, your man closes out hard.
_(pause)_
3. You rip through and attack his front foot.
_(pause)_
4. You turn the corner, downhill into the paint.
_(pause)_
5. The low man slides over to stop the drive.
_(pause)_
6. You see your shooter spot up in the corner.
_(pause)_
7. You hang, draw the second defender.
_(pause)_
8. You whip the kick-out on a rope.
_(pause)_
9. He catches it in rhythm and buries it.
_(pause)_
10. You created the shot by making the right read.
_(pause)_
### Basketball · Guard · press-break (viz play)
<!-- slug: viz-guard-press-break | file: components/pregame/audio/clips-viz.ts -->

1. See the press coming at you, and feel yourself calm with the ball.
_(pause)_
2. They pick you up full court.
_(pause)_
3. You come back to the ball, low and strong.
_(pause)_
4. Two defenders start to shade you toward the sideline.
_(pause)_
5. You do not panic.
_(pause)_
6. You retreat dribble once and create space.
_(pause)_
7. Your teammate flashes to the middle.
_(pause)_
8. You hit him on time, away from pressure.
_(pause)_
9. The ball moves ahead. The press is broken.
_(pause)_
10. You sprint into spacing and get the team organized.
_(pause)_
11. Calm with the ball. Simple play. Pressure handled.
_(pause)_
### Basketball · Guard · run-the-set (viz play)
<!-- slug: viz-guard-run-the-set | file: components/pregame/audio/clips-viz.ts -->

1. See the game speeding up and feel yourself ready to settle the team.
_(pause)_
2. The game is speeding up. Your team needs a good possession.
_(pause)_
3. You bring it across half court under control.
_(pause)_
4. You raise your hand and call the set.
_(pause)_
5. You move the ball early and cut through.
_(pause)_
6. The ball reverses. The defense shifts.
_(pause)_
7. You get it back and make the simple read.
_(pause)_
8. Your teammate gets a clean look in rhythm.
_(pause)_
9. Good possession. You led without forcing.
_(pause)_
### Basketball · Guard · clutch-free-throws (viz play)
<!-- slug: viz-guard-clutch-free-throws | file: components/pregame/audio/clips-viz.ts -->

1. See yourself at the line in a tight game, with your routine ready.
_(pause)_
2. Tie game, under ten seconds, you drive hard and the whistle blows.
_(pause)_
3. Two shots. The other gym is loud behind the rim.
_(pause)_
4. You step to the line and the ref hands you the ball.
_(pause)_
5. Three dribbles, spin it, breath out — your routine, the same every time.
_(pause)_
6. Legs are tired, but you bend your knees and use them anyway.
_(pause)_
7. Eyes on the back of the rim.
_(pause)_
8. First one is pure.
_(pause)_
9. Same breath, same hold.
_(pause)_
10. Second one drops through.
_(pause)_
11. You backpedal on defense, calm and ready for the next stop.
_(pause)_
### Basketball · Guard · ices-it-late (viz play)
<!-- slug: viz-guard-ices-it-late | file: components/pregame/audio/clips-viz.ts -->

1. See the trap coming late, and feel yourself strong with the ball.
_(pause)_
2. Up two, final seconds, and they trap you full-court to take the ball.
_(pause)_
3. Two defenders come hard — you stay low, protect the ball, and do not panic.
_(pause)_
4. You keep your dribble alive and get fouled.
_(pause)_
5. They have to put you on the line to stop the clock.
_(pause)_
6. Bonus, two shots. You walk up calm.
_(pause)_
7. Routine, breath, eyes up.
_(pause)_
8. First one is good.
_(pause)_
9. Same rhythm. Second one through.
_(pause)_
10. Game is not over because you celebrated. Game is over because you took care of the ball.
_(pause)_
### Basketball · Wing · catch-and-shoot (viz play)
<!-- slug: viz-wing-catch-and-shoot | file: components/pregame/audio/clips-viz.ts -->

1. See yourself spaced on the wing, ready before the ball arrives.
_(pause)_
2. You space to the wing, ready.
_(pause)_
3. The ball swings around the horn.
_(pause)_
4. Your feet are ready before the ball arrives. Hands up, knees loaded.
_(pause)_
5. The pass hits your hands.
_(pause)_
6. The closeout flies at you a beat too late.
_(pause)_
7. You go straight up into your shot.
_(pause)_
8. Smooth release over the contest.
_(pause)_
9. You hold your follow-through.
_(pause)_
10. It drops, and you sprint back on defense.
_(pause)_
### Basketball · Wing · attack-closeout (viz play)
<!-- slug: viz-wing-attack-closeout | file: components/pregame/audio/clips-viz.ts -->

1. See the skip pass coming and feel the closeout flying at you.
_(pause)_
2. The skip pass finds you on the wing.
_(pause)_
3. You shot-fake. Your man flies by, out of control.
_(pause)_
4. You rip through and put it on the floor, downhill.
_(pause)_
5. Two dribbles into the gap, into the paint.
_(pause)_
6. The big steps up off your roller.
_(pause)_
7. You read his chest. If he stays back, you finish. If he steps up, you drop it off.
_(pause)_
8. Tonight, he is late.
_(pause)_
9. You gather under the rim.
_(pause)_
10. You finish high off the glass through contact.
_(pause)_
11. Strong attack. Right read.
_(pause)_
### Basketball · Wing · denial-deflection (viz play)
<!-- slug: viz-wing-denial-deflection | file: components/pregame/audio/clips-viz.ts -->

1. See your matchup trying to get open, and feel yourself locked into the lane.
_(pause)_
2. Your man wants the ball on the wing.
_(pause)_
3. You're in the passing lane, hand in, denying.
_(pause)_
4. You feel him cut, and you stay attached — ball, you, man.
_(pause)_
5. The pass comes anyway, lazy, into the gap.
_(pause)_
6. You jump the lane and deflect it loose.
_(pause)_
7. You corral it and turn upcourt.
_(pause)_
8. You push it ahead.
_(pause)_
9. Your team gets a clean finish on the break.
_(pause)_
10. Defense created offense.
_(pause)_
### Basketball · Wing · backdoor-cut (viz play)
<!-- slug: viz-wing-backdoor-cut | file: components/pregame/audio/clips-viz.ts -->

1. See your defender overplaying, and feel the backdoor lane open.
_(pause)_
2. You're on the wing, and your man overplays the pass.
_(pause)_
3. You feel him cheat, top hand in the lane.
_(pause)_
4. You plant hard and cut backdoor behind him.
_(pause)_
5. You flash open down the lane, hand ready.
_(pause)_
6. The bounce pass leads you to the rim.
_(pause)_
7. You catch it in stride.
_(pause)_
8. One step, eyes up.
_(pause)_
9. You finish at the rim before the help arrives.
_(pause)_
10. You did not stand. You cut with purpose.
_(pause)_
### Basketball · Wing · closeout-contain (viz play)
<!-- slug: viz-wing-closeout-contain | file: components/pregame/audio/clips-viz.ts -->

1. See the ball skip to the corner and feel yourself ready to close out under control.
_(pause)_
2. The ball skips to your man in the corner.
_(pause)_
3. You sprint the first steps, then chop your feet.
_(pause)_
4. High hand. No fly-by.
_(pause)_
5. He shot-fakes. You stay down.
_(pause)_
6. He drives baseline.
_(pause)_
7. You slide and cut him off.
_(pause)_
8. He picks up the ball with nowhere to go.
_(pause)_
9. You contest the pass and your team resets the defense.
_(pause)_
10. Disciplined closeout. No foul. No blow-by.
_(pause)_
### Basketball · Wing · relocate-catch-shoot (viz play)
<!-- slug: viz-wing-relocate-catch-shoot | file: components/pregame/audio/clips-viz.ts -->

1. See yourself move after the pass, staying active and ready.
_(pause)_
2. You catch on the wing and the closeout comes hard.
_(pause)_
3. You make the simple pass to the top.
_(pause)_
4. You do not stand and watch.
_(pause)_
5. You slide to the corner.
_(pause)_
6. Your hands are ready. Your feet are already set.
_(pause)_
7. The ball swings back to you.
_(pause)_
8. You catch in rhythm, eyes on the rim.
_(pause)_
9. Smooth release.
_(pause)_
10. It drops, and you sprint back on defense.
_(pause)_
11. Pass. Move. Be ready.
_(pause)_
### Basketball · Wing · clutch-free-throws (viz play)
<!-- slug: viz-wing-clutch-free-throws | file: components/pregame/audio/clips-viz.ts -->

1. See yourself at the line on the road, with the gym trying to shake you.
_(pause)_
2. Late in a road game, you catch on the wing and rise into your jumper.
_(pause)_
3. It falls, and the contact comes — and-1.
_(pause)_
4. The home crowd gets loud, trying to pull you out of your routine.
_(pause)_
5. You step up, settle your feet, and let the noise wash past you.
_(pause)_
6. One dribble, deep breath, the same stroke you shoot in an empty gym.
_(pause)_
7. Elbow in, follow through, hold it.
_(pause)_
8. Bottom of the net.
_(pause)_
9. You turn and sprint back, calm and locked in.
_(pause)_
### Basketball · Wing · late-jumper (viz play)
<!-- slug: viz-wing-late-jumper | file: components/pregame/audio/clips-viz.ts -->

1. See the ball find you late, with space to rise into your shot.
_(pause)_
2. Under thirty seconds, a one-possession game, the ball finds you on the wing.
_(pause)_
3. Your man flies at the closeout, hand up, trying to run you off the line.
_(pause)_
4. One hard jab.
_(pause)_
5. You rise up clean over the contest.
_(pause)_
6. Elbow in, eyes on the rim, the same shot you have practiced over and over.
_(pause)_
7. It leaves your hand soft, perfect rotation.
_(pause)_
8. It drops clean.
_(pause)_
9. You turn and sprint back, already onto the next stop.
_(pause)_
### Basketball · Big · roll-and-finish (viz play)
<!-- slug: viz-big-roll-and-finish | file: components/pregame/audio/clips-viz.ts -->

1. See yourself sprinting into the screen, ready to create contact and roll hard.
_(pause)_
2. You climb up and set a wall of a screen.
_(pause)_
3. Your guard rubs his man off you.
_(pause)_
4. You feel the hit, then you roll hard to the rim.
_(pause)_
5. The low man tags you, then recovers out.
_(pause)_
6. You're open, sealing down the middle.
_(pause)_
7. The pocket pass hits you on the roll.
_(pause)_
8. You catch it on the move.
_(pause)_
9. Two feet. Strong base.
_(pause)_
10. You go up strong through the contact.
_(pause)_
11. The ball drops. Strong finish.
_(pause)_
### Basketball · Big · post-seal-dropstep (viz play)
<!-- slug: viz-big-post-seal-dropstep | file: components/pregame/audio/clips-viz.ts -->

1. See yourself beating your man down the floor and earning deep position.
_(pause)_
2. You sprint the floor and beat your man down.
_(pause)_
3. You did the work before the catch.
_(pause)_
4. You sit him on your back, seal deep, hands high.
_(pause)_
5. Your guard hits you on the block.
_(pause)_
6. You feel where he is playing you — high side.
_(pause)_
7. You drop step baseline into the open lane.
_(pause)_
8. One strong dribble, into your body.
_(pause)_
9. You go up off two feet and finish over him.
_(pause)_
10. Early work. Deep catch. Strong finish.
_(pause)_
### Basketball · Big · boxout-outlet (viz play)
<!-- slug: viz-big-boxout-outlet | file: components/pregame/audio/clips-viz.ts -->

1. See the shot go up and feel yourself ready to own the glass.
_(pause)_
2. The shot goes up from the wing.
_(pause)_
3. You find your man, put a body on him, and hit him first.
_(pause)_
4. You feel him try to slip around.
_(pause)_
5. You stay attached.
_(pause)_
6. The ball comes off long to your side.
_(pause)_
7. You go get it at its highest point, two hands.
_(pause)_
8. You land, chin it, and pivot away from pressure.
_(pause)_
9. You see your guard leaking out.
_(pause)_
10. You hit the outlet ahead and start the break.
_(pause)_
11. The possession ends because you did your work on the glass.
_(pause)_
### Basketball · Big · rim-protect-and-go (viz play)
<!-- slug: viz-big-rim-protect-and-go | file: components/pregame/audio/clips-viz.ts -->

1. See the guard coming downhill and feel yourself ready to protect the rim.
_(pause)_
2. Their guard turns the corner, downhill at you.
_(pause)_
3. You're in drop coverage, walling up the paint.
_(pause)_
4. You hold your ground, feet set, chest square.
_(pause)_
5. He gathers and goes up at the rim.
_(pause)_
6. You meet him vertical, hands high, no reach.
_(pause)_
7. He has to finish over length.
_(pause)_
8. The shot comes off.
_(pause)_
9. You secure it with two hands.
_(pause)_
10. Outlet ahead. Your stop started the break.
_(pause)_
### Basketball · Big · rescreen-roll (viz play)
<!-- slug: viz-big-rescreen-roll | file: components/pregame/audio/clips-viz.ts -->

1. See yourself coming into the screen with purpose, ready to create an advantage.
_(pause)_
2. You sprint into the screen, feet set, wide base.
_(pause)_
3. Your guard waits until you make contact.
_(pause)_
4. The defender fights over the top.
_(pause)_
5. You turn and re-screen, changing the angle.
_(pause)_
6. Now your guard gets downhill.
_(pause)_
7. You roll hard into the open lane.
_(pause)_
8. The help steps up.
_(pause)_
9. Your teammate gets the corner three.
_(pause)_
10. Your screen created the shot. That is winning basketball.
_(pause)_
### Basketball · Big · short-roll-read (viz play)
<!-- slug: viz-big-short-roll-read | file: components/pregame/audio/clips-viz.ts -->

1. See the defense step toward your guard and feel the pocket open for you.
_(pause)_
2. You set the screen high. Your guard turns the corner.
_(pause)_
3. Both defenders step toward him.
_(pause)_
4. You slip into the pocket, hands ready.
_(pause)_
5. The pass hits you at the free-throw line.
_(pause)_
6. You land on two feet and read the low man.
_(pause)_
7. He steps up to stop you.
_(pause)_
8. You drop the pass to your teammate under the rim.
_(pause)_
9. Easy finish.
_(pause)_
10. You made the right read.
_(pause)_
### Basketball · Big · clutch-free-throws (viz play)
<!-- slug: viz-big-clutch-free-throws | file: components/pregame/audio/clips-viz.ts -->

1. See yourself at the line late, with everyone expecting the miss.
_(pause)_
2. They put you on the line on purpose, late, hoping you'll miss.
_(pause)_
3. The whole gym knows the plan.
_(pause)_
4. You step up slow, set your feet wide, and breathe it all the way down.
_(pause)_
5. Spin the ball, find your line, same routine you grind after every practice.
_(pause)_
6. You shot these when no one was watching.
_(pause)_
7. Push it soft off the fingertips.
_(pause)_
8. First one drops.
_(pause)_
9. Same motion, no rush.
_(pause)_
10. Second one falls clean.
_(pause)_
11. You did your job. Now get back and protect the paint.
_(pause)_
### Basketball · Big · game-sealing-block (viz play)
<!-- slug: viz-big-game-sealing-block | file: components/pregame/audio/clips-viz.ts -->

1. See the final possession coming at the rim, and feel yourself ready to wall up.
_(pause)_
2. Final possession, you're guarding the rim, protecting a two-point lead.
_(pause)_
3. Their guard turns the corner and comes downhill at you full speed.
_(pause)_
4. You slide over, feet set, hands straight up.
_(pause)_
5. Vertical. No reach.
_(pause)_
6. He goes up to finish.
_(pause)_
7. You wall up, stay vertical, and take away the finish.
_(pause)_
8. All contest. No whistle.
_(pause)_
9. The rebound falls to your hands.
_(pause)_
10. You rip it down strong.
_(pause)_
11. Outlet it ahead, and the game is yours.
_(pause)_
## Hard Moment Clips — Guard

### Basketball · Guard · turnover
<!-- slug: hm-bb-guard-turnover | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are running the offense. You try to force a pass through traffic. They pick it off and go the other way for a layup.
_(pause)_
3. Feel what your body does. Jaw clenches. Legs go heavy on the backpedal. I can't be trusted with the rock.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That turnover is over. Sprint back and lead the next possession.
_(pause)_
6. Slow it down. Next possession, get the team into something simple.
_(pause)_
7. Speak the truth. That turnover is over. Get back, get organized, and make the next simple play.
_(pause)_
### Basketball · Guard · missed-shot
<!-- slug: hm-bb-guard-missed-shot | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You come off the screen wide open. Feet set, clean look, the shot you've made a thousand times. It rims out.
_(pause)_
3. Feel what your body does. Shoulders drop. A flush climbs up your neck. Now they'll sag off me. I'm not a shooter today.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That shot is over. The next read is still yours.
_(pause)_
6. The read was right. Same shot, next time it's open. Don't shrink it, don't force a worse one.
_(pause)_
7. That shot is gone. Stay ready for the next look.
_(pause)_
### Basketball · Guard · got-cooked
<!-- slug: hm-bb-guard-got-cooked | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're up on the ball. He hits you with the crossover, gets your hips turned, and blows by for the layup.
_(pause)_
3. Feel what your body does. Face goes hot. Eyes want to drop to the floor. Everyone saw it. The whole gym saw me get cooked.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That drive is over. Get your feet set and take the next matchup.
_(pause)_
6. Next possession, get in your stance and stay in front. Take it away with your feet, not a reach.
_(pause)_
7. They won that moment. They do not own the next one. Get your feet set and compete again.
_(pause)_
### Basketball · Guard · foul-trouble
<!-- slug: hm-bb-guard-foul-trouble | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Two quick reach-ins and the whistle's on you. Now you're guarding soft, can't pick up full-court, playing scared of the third.
_(pause)_
3. Feel what your body does. Hands pull back on their own. A jolt of caution down your arms. I can't even play D without fouling.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those whistles are over. Defend with your feet and stay in control.
_(pause)_
6. Play angles, not reaches. Beat them to the spot, contest straight up, hands high. Defend with your feet.
_(pause)_
7. The whistle happened. Learn from it, then compete the next possession clean.
_(pause)_
### Basketball · Guard · coach-yells
<!-- slug: hm-bb-guard-coach-yells | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You make a bad read on the pick-and-roll. Coach yells your name and pulls you to the sideline. You're standing there while the game goes on.
_(pause)_
3. Feel what your body does. Neck goes hot. Chest tightens against the breath. Coach doesn't trust me to run this.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That correction is over. Take the read and come back to now.
_(pause)_
6. The correction is about the read, not about you. Take it, slow the game down, and get the team into the next action.
_(pause)_
### Basketball · Guard · benched
<!-- slug: hm-bb-guard-benched | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. After a turnover, coach calls your number. You come out, and the backup brings the ball up. You watch the offense run without you.
_(pause)_
3. Feel what your body does. Heat in your chest. Tight in your throat. And the thought lands. They don't trust me to run it.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Stay in the game from here. Watch their guard, talk, and be ready to organize.
_(pause)_
6. The bench has your body for a stretch. It does not have your mind. Watch their guard, talk from the sideline, and be ready to organize the next possession.
_(pause)_
### Basketball · Guard · nervous
<!-- slug: hm-bb-guard-nervous | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. It's warmups. Your handle feels tight, your thoughts are racing, your heart is already going before the ball's even tipped.
_(pause)_
3. Feel what your body does. Heart pounding in your ears. Fingers buzzing on the ball. What if I cough it up first possession.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Come back to your breath. Come back to the ball.
_(pause)_
6. These nerves are readiness, not a warning. The same energy that feels like fear is the energy that makes you quick. First possession, just get the team into something simple.
_(pause)_
### Basketball · Guard · missed-fts
<!-- slug: hm-bb-guard-missed-fts | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Tight game, late. You're at the line to ice it. The gym goes quiet. First one is short. Second one clanks off the front rim.
_(pause)_
3. Feel what your body does. Stomach sinks. Ears ringing in the quiet. I'm the guard, I'm supposed to close.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those free throws are over. Get back and guard the next possession.
_(pause)_
6. Get back on defense. Next time at the line, same routine. Breathe, eyes on the rim, shoot it the way you always do.
_(pause)_
7. Those shots are gone. Trust your routine on the next ones.
_(pause)_
### Basketball · Guard · start-slow
<!-- slug: hm-bb-guard-start-slow | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. First few minutes and nothing's clicking. You're over-dribbling, pounding the ball, can't get anyone a clean look.
_(pause)_
3. Feel what your body does. Grip tightens on the ball. Breath gets short and high. It's on me to fix it.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The slow start is over. Let the offense breathe from this possession.
_(pause)_
6. Stop trying to fix it alone. Give it up, move it, let the offense breathe. The fix is doing less, not more.
_(pause)_
### Basketball · Guard · fall-behind-early
<!-- slug: hm-bb-guard-fall-behind-early | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. They go on a quick run. You're down early, and you can feel the whole team look to you to stop the bleeding.
_(pause)_
3. Feel what your body does. Shoulders climb toward your ears. A weight settles across your back. This whole deficit is on me to fix.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That run is over. Lead this possession.
_(pause)_
6. You don't owe them the whole deficit. You owe them the next possession. One stop. One good look. One at a time.
_(pause)_
7. Speak the truth. The deficit is real. It is not yours alone to carry, and it is not who you are. Reset and go again.
_(pause)_
## Hard Moment Clips — Wing

### Basketball · Wing · turnover
<!-- slug: hm-bb-wing-turnover | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You drive the lane and get stripped. Or you throw the cross-court swing and they jump it. The ball is gone the other way.
_(pause)_
3. Feel what your body does. Arms go limp at your sides. Feet slow on the sprint back. I tried to do too much.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That turnover is over. Sprint back, then cut hard and show your hands.
_(pause)_
6. Sprint back, then get right back into it. Cut hard, show your hands, ask for the ball on the next trip.
_(pause)_
7. Speak the truth. The turnover is real. It is not your identity. Reset and go again.
_(pause)_
### Basketball · Wing · missed-shot
<!-- slug: hm-bb-wing-missed-shot | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You catch it open in your spot. Clean look. Cold off the bench, you brick it. Front rim, nothing.
_(pause)_
3. Feel what your body does. Hands go cold. A flush of doubt up the back of your neck. I'm bricking, I shouldn't shoot.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That shot is over. Relocate and be ready for the next one.
_(pause)_
6. Your make doesn't decide your worth, so the miss can't either. Relocate, show your hands, and take the next open one with the same confidence.
_(pause)_
7. That shot is gone. Stay ready for the next look.
_(pause)_
### Basketball · Wing · got-cooked
<!-- slug: hm-bb-wing-got-cooked | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're on their best scorer. You close out, he rips by you, and finishes over the help. The bench reacts. That one's on the highlight.
_(pause)_
3. Feel what your body does. Heat floods your face. Your feet feel stuck to the floor. I'm a liability.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That closeout is over. Get your stance back and take the matchup again.
_(pause)_
6. One beat doesn't make you a liability. Get into your stance, take the matchup again, and contest the very next closeout.
_(pause)_
7. Speak the truth. Getting beat on one closeout is real. It does not make you a liability, and it is not who you are. Reset and go again.
_(pause)_
### Basketball · Wing · foul-trouble
<!-- slug: hm-bb-wing-foul-trouble | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Two quick hand-check fouls on a faster guy. The whistle keeps finding you. You feel the bench getting close.
_(pause)_
3. Feel what your body does. Arms freeze at your sides. A flicker of panic before every closeout. I can't even guard anymore.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those whistles are over. Defend smarter and stay in front.
_(pause)_
6. Don't back off — defend smarter. Move your feet, stay in front, hands up and back, and contest straight up without reaching.
_(pause)_
7. The whistle happened. Learn from it, then compete the next possession clean.
_(pause)_
### Basketball · Wing · coach-yells
<!-- slug: hm-bb-wing-coach-yells | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Coach stops the play and barks your name. You didn't close out. You passed up the open one. The whole gym hears it.
_(pause)_
3. Feel what your body does. Ears go hot. Your eyes drop to your shoes. I can't do anything right.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That correction is over. Take the note and come back to now.
_(pause)_
6. Coach is correcting the play, not naming you. Take the note, close out hard, and shoot the next open one free.
_(pause)_
### Basketball · Wing · benched
<!-- slug: hm-bb-wing-benched | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your shot isn't falling, so coach pulls you. You sit down at the end of the bench and watch the game go on without you.
_(pause)_
3. Feel what your body does. A hollow drop behind your ribs. Your gaze fixed on the floor in front of the bench. I'm only as good as my last make.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Stay in the game from here. Stay connected, talk, and be ready when your name is called.
_(pause)_
6. The bench has your body for a stretch. It does not have your mind. Stay connected, talk on defense, and be ready when your name is called.
_(pause)_
### Basketball · Wing · nervous
<!-- slug: hm-bb-wing-nervous | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're in warmups against a ranked team. Scouts are in the gym. Your stroke feels tight and you start doubting the shot before tip-off.
_(pause)_
3. Feel what your body does. Shallow breath. Hands light. I'm not ready for this.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Come back to your breath. Come back to your spot.
_(pause)_
6. This is energy, not a warning. Let it sharpen you — get to your spots, hunt your first catch, and let the first shot go free.
_(pause)_
### Basketball · Wing · missed-fts
<!-- slug: hm-bb-wing-missed-fts | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You get fouled on a jumper. Two shots, gym goes quiet, all eyes on you. First one rims out. Second one too.
_(pause)_
3. Feel what your body does. The gym goes silent and loud at once. Your mouth goes dry. Even my free shot won't fall.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those free throws are over. Trust your routine and keep attacking.
_(pause)_
6. Two misses don't break your stroke. Keep attacking, keep getting to the line, and trust your routine on the next ones.
_(pause)_
7. Those shots are gone. Trust your routine on the next ones.
_(pause)_
### Basketball · Wing · start-slow
<!-- slug: hm-bb-wing-start-slow | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your first few touches feel off. The ball isn't finding you and the half is slipping by. You can feel yourself going quiet.
_(pause)_
3. Feel what your body does. Your body goes quiet and small. Energy draining from your legs. I'm invisible out here.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The slow start is over. Get loud and earn the next touch.
_(pause)_
6. Don't disappear — get loud. Sprint the lanes, cut hard, call for the ball, and demand your next touch.
_(pause)_
### Basketball · Wing · fall-behind-early
<!-- slug: hm-bb-wing-fall-behind-early | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. They go on a run and you're down early. You can feel the pull to force a shot, to answer it all by yourself, right now.
_(pause)_
3. Feel what your body does. A hot urgency surges through your chest. Your hands itch for the ball. I have to fix this myself.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That run is over. Stay aggressive inside the offense.
_(pause)_
6. You don't have to hero-ball this. Stay aggressive inside the offense — move the ball, trust your read, and take the open one in rhythm.
_(pause)_
7. Speak the truth. The deficit is real. It is not yours to answer alone, and it is not who you are. Reset and go again.
_(pause)_
## Hard Moment Clips — Big

### Basketball · Big · turnover
<!-- slug: hm-bb-big-turnover | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You roll to the rim and the help steps in. You bowl him over. Whistle. Charge. The ball goes the other way.
_(pause)_
3. Feel what your body does. Shoulders curl inward. A heavy thud of frustration in your chest. Keep it out of my hands.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That turnover is over. Sprint back, protect the paint, and ask for it again.
_(pause)_
6. You want the ball again. Seal your man, call for it, and roll hard into the next play.
_(pause)_
7. Speak the truth. The turnover is real. It is not your identity. Reset and go again.
_(pause)_
### Basketball · Big · missed-shot
<!-- slug: hm-bb-big-missed-shot | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Wide open under the rim. The layup rolls off. You get the board and the putback rims out too.
_(pause)_
3. Feel what your body does. Your hands feel like stone. Heat creeping up from your collar. I can't even finish at the rim.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That finish is over. Run the floor and get back to the glass.
_(pause)_
6. You go right back at it. Run the rim, demand the ball deep, and crash the offensive glass on the next miss.
_(pause)_
7. Speak the truth. The miss is real. Finishing is your job, not your worth, and it is not who you are. Reset and go again.
_(pause)_
### Basketball · Big · got-cooked
<!-- slug: hm-bb-big-got-cooked | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The switch leaves you on their quick guard. He sizes you up, crosses over, and blows by you to the rim.
_(pause)_
3. Feel what your body does. Legs feel slow and rooted. A flush of exposure across your face. They'll hunt me every time.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That switch is over. Get your base back and take the next matchup.
_(pause)_
6. Next switch, you give him a cushion. Drop, contain, wall him off, and stay vertical at the rim. Make him finish over a wall.
_(pause)_
7. Speak the truth. One blow-by is real. It does not mean they own you. Reset and go again.
_(pause)_
### Basketball · Big · foul-trouble
<!-- slug: hm-bb-big-foul-trouble | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Two quick fouls and the coach sits you. You come back in scared to touch anybody. You stop contesting. You stop boxing out.
_(pause)_
3. Feel what your body does. Your arms go stiff and cautious. A cold hesitation before every box out. I'm the weak link.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those whistles are over. Defend with your feet and stay in the game.
_(pause)_
6. You can compete hard and stay disciplined at the same time. Stay vertical, hands straight up, beat them to the spot and box out clean. That's how you stay on the floor and help your team.
_(pause)_
7. The whistle happened. Learn from it, then compete the next possession clean.
_(pause)_
### Basketball · Big · coach-yells
<!-- slug: hm-bb-big-coach-yells | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Their five just grabbed another offensive board. The coach turns and barks down the bench, loud enough for everyone. Box out! You're getting pushed around in there.
_(pause)_
3. Feel what your body does. Your face burns. Shoulders pull down under the words. I'm getting pushed around.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That correction is over. Take what helps and answer with your body.
_(pause)_
6. Coach is correcting the possession, not naming you. Answer with your body — screen, box out, protect the paint.
_(pause)_
### Basketball · Big · fouled-out
<!-- slug: hm-bb-big-fouled-out | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The whistle blows. Number six. You're done. You walk off, the game still going, and you can't go back in.
_(pause)_
3. Feel what your body does. The walk off the floor feels long and slow. A lump rising in your throat. I let my team down.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The floor is gone, but your voice is still in the game.
_(pause)_
6. You're still in this game. On your feet on the bench. Loud on defense, talking coverages, lifting the next big up. Your team needs your voice and your presence.
_(pause)_
7. Speak the truth. Fouling out is real. It cost you the floor — it did not cost you who you are. Your team still needs you. Reset, and go again with your voice.
_(pause)_
### Basketball · Big · nervous
<!-- slug: hm-bb-big-nervous | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Warmups. You watch their big across the floor. He's taller, he's heavier, and he's already pushing your teammates around.
_(pause)_
3. Feel what your body does. A buzz of adrenaline through your arms. Pulse loud in your chest. What if I get bullied inside.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Come back to your breath. Come back to your base.
_(pause)_
6. You get to the spot first. Beat him to your position, get your body low, and hold your ground with your feet and base — not by reaching. Be ready for the contact instead of bracing against it.
_(pause)_
7. Being nervous is energy, not danger. Let it sharpen you. Get low, hold your ground, and meet the first contact with your base.
_(pause)_
### Basketball · Big · missed-fts
<!-- slug: hm-bb-big-missed-fts | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. They grab you off the ball on purpose. Bonus. Two shots. You step to the line and both clang off the rim.
_(pause)_
3. Feel what your body does. The hush of the gym presses on you. Your hands go heavy at the line. They fouled me on purpose because I'm the weak link.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those free throws are over. Get back, protect the rim, and stay aggressive.
_(pause)_
6. You go right back in. Get back, protect the rim, then seal deep and demand the ball. Compete because it's your job, not to get even.
_(pause)_
7. Speak the truth. Two misses are real. They are not the weak-link verdict, and they are not who you are. Reset and go again.
_(pause)_
### Basketball · Big · start-slow
<!-- slug: hm-bb-big-start-slow | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. First few minutes and you're a step late to everything. He beats you to his spot. He beats you to the glass. They score twice inside.
_(pause)_
3. Feel what your body does. Your steps feel a half-beat behind. A tightness winding across your shoulders. I'm letting them set the tone in the paint.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The slow start is over. Set the tone from this possession.
_(pause)_
6. You take the tone back. Establish position early, get the first hit on every box out, and set it from here.
_(pause)_
### Basketball · Big · fall-behind-early
<!-- slug: hm-bb-big-fall-behind-early | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Down ten early. They're scoring in the paint and crashing the offensive glass, and you're the one back there. It feels like the rim is yours to hold and it's slipping.
_(pause)_
3. Feel what your body does. The weight of the paint settles on your shoulders. Breath shortening as the lead grows. It's all on me to hold the paint.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That run is over. Own this possession.
_(pause)_
6. You don't carry the scoreboard. You own the next possession. Wall up the rim, contest vertical, secure one rebound. Then the next one.
_(pause)_
7. Speak the truth. The deficit is real. The paint is your job, not your worth, and it is not who you are. Reset and go again.
_(pause)_
## Full-Session Cells (legacy, not used in compositional path)

### Basketball · Guard · turnover (full session)
<!-- slug: bb-guard-turnover | file: components/pregame/audio/session-guard-turnover.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You bring the ball up.
_(pause)_
16. You push the pace up the floor.
_(pause)_
17. Your eyes are up. You see the floor.
_(pause)_
18. You take care of the rock. Strong with the ball.
_(pause)_
19. Get downhill. Make the simple, strong play.
_(pause)_
20. Get back on defense. Talk, be loud.
_(pause)_
21. See yourself run the team with poise.
_(pause)_
22. You push the pace, you see the floor, you take care of the rock.
_(pause)_
23. You get downhill, draw two, and hit the open man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They push the ball back at you. You pick up early, you talk, and you turn them away.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You are running the offense. You try to force a pass through traffic. They pick it off and go the other way for a layup.
_(pause)_
28. Feel what your body does. Jaw clenches. Legs go heavy on the backpedal. I can't be trusted with the rock.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Slow it down. Next possession, get the team into something simple.
_(pause)_
32. Speak the truth. Your mistake is real. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Guard · missed-shot (full session)
<!-- slug: bb-guard-missed-shot | file: components/pregame/audio/session-guard-missed-shot.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You bring the ball up.
_(pause)_
16. You push the pace up the floor.
_(pause)_
17. Your eyes are up. You see the floor.
_(pause)_
18. You take care of the rock. Strong with the ball.
_(pause)_
19. Get downhill. Make the simple, strong play.
_(pause)_
20. Get back on defense. Talk, be loud.
_(pause)_
21. See yourself run the team with poise.
_(pause)_
22. You push the pace, you see the floor, you take care of the rock.
_(pause)_
23. You get downhill, draw two, and hit the open man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They push the ball back at you. You pick up early, you talk, and you turn them away.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You come off the screen wide open. Feet set, clean look, the shot you've made a thousand times. It rims out.
_(pause)_
28. Feel what your body does. Shoulders drop. A flush climbs up your neck. Now they'll sag off me. I'm not a shooter today.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. The read was right. Same shot, next time it's open. Don't shrink it, don't force a worse one.
_(pause)_
32. Speak the truth. One miss is real. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Guard · got-cooked (full session)
<!-- slug: bb-guard-got-cooked | file: components/pregame/audio/session-guard-got-cooked.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You bring the ball up.
_(pause)_
16. You push the pace up the floor.
_(pause)_
17. Your eyes are up. You see the floor.
_(pause)_
18. You take care of the rock. Strong with the ball.
_(pause)_
19. Get downhill. Make the simple, strong play.
_(pause)_
20. Get back on defense. Talk, be loud.
_(pause)_
21. See yourself run the team with poise.
_(pause)_
22. You push the pace, you see the floor, you take care of the rock.
_(pause)_
23. You get downhill, draw two, and hit the open man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They push the ball back at you. You pick up early, you talk, and you turn them away.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You're up on the ball. He hits you with the crossover, gets your hips turned, and blows by for the layup.
_(pause)_
28. Feel what your body does. Face goes hot. Eyes want to drop to the floor. Everyone saw it. The whole gym saw me get cooked.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Next possession, get in your stance and stay in front. Take it away with your feet, not a reach.
_(pause)_
32. Speak the truth. Getting beat is real. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Guard · foul-trouble (full session)
<!-- slug: bb-guard-foul-trouble | file: components/pregame/audio/session-guard-foul-trouble.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You bring the ball up.
_(pause)_
16. You push the pace up the floor.
_(pause)_
17. Your eyes are up. You see the floor.
_(pause)_
18. You take care of the rock. Strong with the ball.
_(pause)_
19. Get downhill. Make the simple, strong play.
_(pause)_
20. Get back on defense. Talk, be loud.
_(pause)_
21. See yourself run the team with poise.
_(pause)_
22. You push the pace, you see the floor, you take care of the rock.
_(pause)_
23. You get downhill, draw two, and hit the open man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They push the ball back at you. You pick up early, you talk, and you turn them away.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Two quick reach-ins and the whistle's on you. Now you're guarding soft, can't pick up full-court, playing scared of the third.
_(pause)_
28. Feel what your body does. Hands pull back on their own. A jolt of caution down your arms. I can't even play D without fouling.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Play angles, not reaches. Beat them to the spot, contest straight up, hands high. Defend with your feet.
_(pause)_
32. Speak the truth. The fouls are real. They are not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Guard · coach-yells (full session)
<!-- slug: bb-guard-coach-yells | file: components/pregame/audio/session-guard-coach-yells.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You bring the ball up.
_(pause)_
16. You push the pace up the floor.
_(pause)_
17. Your eyes are up. You see the floor.
_(pause)_
18. You take care of the rock. Strong with the ball.
_(pause)_
19. Get downhill. Make the simple, strong play.
_(pause)_
20. Get back on defense. Talk, be loud.
_(pause)_
21. See yourself run the team with poise.
_(pause)_
22. You push the pace, you see the floor, you take care of the rock.
_(pause)_
23. You get downhill, draw two, and hit the open man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They push the ball back at you. You pick up early, you talk, and you turn them away.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You make a bad read on the pick-and-roll. Coach yells your name and pulls you to the sideline. You're standing there while the game goes on.
_(pause)_
28. Feel what your body does. Neck goes hot. Chest tightens against the breath. Coach doesn't trust me to run this.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. The correction is about the read, not about you. Take it, run it clean, get the team into the next one.
_(pause)_
32. Speak the truth. Coach is correcting the read. He is not correcting who you are. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Guard · benched (full session)
<!-- slug: bb-guard-benched | file: components/pregame/audio/session-guard-benched.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You bring the ball up.
_(pause)_
16. You push the pace up the floor.
_(pause)_
17. Your eyes are up. You see the floor.
_(pause)_
18. You take care of the rock. Strong with the ball.
_(pause)_
19. Get downhill. Make the simple, strong play.
_(pause)_
20. Get back on defense. Talk, be loud.
_(pause)_
21. See yourself run the team with poise.
_(pause)_
22. You push the pace, you see the floor, you take care of the rock.
_(pause)_
23. You get downhill, draw two, and hit the open man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They push the ball back at you. You pick up early, you talk, and you turn them away.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. After a turnover, coach calls your number. You come out, and the backup brings the ball up. You watch the offense run without you.
_(pause)_
28. Feel what your body does. Heat in your chest. Tight in your throat. And the thought lands. They don't trust me to run it.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. You're still on this team, still in this game. Stay in it from the bench. Talk, watch their guard, be ready to check back in.
_(pause)_
32. Speak the truth. Coming out is a stretch of the game, not a verdict on you. You did not lose who you are. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Guard · nervous (full session)
<!-- slug: bb-guard-nervous | file: components/pregame/audio/session-guard-nervous.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You bring the ball up.
_(pause)_
16. You push the pace up the floor.
_(pause)_
17. Your eyes are up. You see the floor.
_(pause)_
18. You take care of the rock. Strong with the ball.
_(pause)_
19. Get downhill. Make the simple, strong play.
_(pause)_
20. Get back on defense. Talk, be loud.
_(pause)_
21. See yourself run the team with poise.
_(pause)_
22. You push the pace, you see the floor, you take care of the rock.
_(pause)_
23. You get downhill, draw two, and hit the open man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They push the ball back at you. You pick up early, you talk, and you turn them away.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. It's warmups. Your handle feels tight, your thoughts are racing, your heart is already going before the ball's even tipped.
_(pause)_
28. Feel what your body does. Heart pounding in your ears. Fingers buzzing on the ball. What if I cough it up first possession.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. These nerves are readiness, not a warning. The same energy that feels like fear is the energy that makes you quick. First possession, just get the team into something simple.
_(pause)_
32. Speak the truth. The nerves are real. They are not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Guard · missed-fts (full session)
<!-- slug: bb-guard-missed-fts | file: components/pregame/audio/session-guard-missed-fts.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You bring the ball up.
_(pause)_
16. You push the pace up the floor.
_(pause)_
17. Your eyes are up. You see the floor.
_(pause)_
18. You take care of the rock. Strong with the ball.
_(pause)_
19. Get downhill. Make the simple, strong play.
_(pause)_
20. Get back on defense. Talk, be loud.
_(pause)_
21. See yourself run the team with poise.
_(pause)_
22. You push the pace, you see the floor, you take care of the rock.
_(pause)_
23. You get downhill, draw two, and hit the open man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They push the ball back at you. You pick up early, you talk, and you turn them away.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Tight game, late. You're at the line to ice it. The gym goes quiet. First one is short. Second one clanks off the front rim.
_(pause)_
28. Feel what your body does. Stomach sinks. Ears ringing in the quiet. I'm the guard, I'm supposed to close.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Get back on defense. Next time at the line, same routine. Breathe, eyes on the rim, shoot it the way you always do.
_(pause)_
32. Speak the truth. Two misses at the line is a moment in the game, not a measure of the closer. Missing the shot did not unmake you. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Guard · start-slow (full session)
<!-- slug: bb-guard-start-slow | file: components/pregame/audio/session-guard-start-slow.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You bring the ball up.
_(pause)_
16. You push the pace up the floor.
_(pause)_
17. Your eyes are up. You see the floor.
_(pause)_
18. You take care of the rock. Strong with the ball.
_(pause)_
19. Get downhill. Make the simple, strong play.
_(pause)_
20. Get back on defense. Talk, be loud.
_(pause)_
21. See yourself run the team with poise.
_(pause)_
22. You push the pace, you see the floor, you take care of the rock.
_(pause)_
23. You get downhill, draw two, and hit the open man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They push the ball back at you. You pick up early, you talk, and you turn them away.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. First few minutes and nothing's clicking. You're over-dribbling, pounding the ball, can't get anyone a clean look.
_(pause)_
28. Feel what your body does. Grip tightens on the ball. Breath gets short and high. It's on me to fix it.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Stop trying to fix it alone. Give it up, move it, let the offense breathe. The fix is doing less, not more.
_(pause)_
32. Speak the truth. A slow start is real. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Guard · fall-behind-early (full session)
<!-- slug: bb-guard-fall-behind-early | file: components/pregame/audio/session-guard-fall-behind-early.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You bring the ball up.
_(pause)_
16. You push the pace up the floor.
_(pause)_
17. Your eyes are up. You see the floor.
_(pause)_
18. You take care of the rock. Strong with the ball.
_(pause)_
19. Get downhill. Make the simple, strong play.
_(pause)_
20. Get back on defense. Talk, be loud.
_(pause)_
21. See yourself run the team with poise.
_(pause)_
22. You push the pace, you see the floor, you take care of the rock.
_(pause)_
23. You get downhill, draw two, and hit the open man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They push the ball back at you. You pick up early, you talk, and you turn them away.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. They go on a quick run. You're down early, and you can feel the whole team look to you to stop the bleeding.
_(pause)_
28. Feel what your body does. Shoulders climb toward your ears. A weight settles across your back. This whole deficit is on me to fix.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. You don't owe them the whole deficit. You owe them the next possession. One stop. One good look. One at a time.
_(pause)_
32. Speak the truth. The deficit is real. It is not yours alone to carry, and it is not who you are. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Wing · turnover (full session)
<!-- slug: bb-wing-turnover | file: components/pregame/audio/session-wing-turnover.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the first possession. You spot up on the wing.
_(pause)_
16. The ball swings to you. Feet set, shoot it.
_(pause)_
17. You sprint the lane in transition.
_(pause)_
18. You take the next open shot. No hesitation.
_(pause)_
19. You lock up your man. Stay in front.
_(pause)_
20. Box out, then close out hard.
_(pause)_
21. See yourself stay ready and stay aggressive.
_(pause)_
22. Feet set, you shoot it. You sprint the lane.
_(pause)_
23. You take the next open shot, and you lock up your man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your man catches it. You stay down, you contest, and you crash the glass.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You drive the lane and get stripped. Or you throw the cross-court swing and they jump it. The ball is gone the other way.
_(pause)_
28. Feel what your body does. Arms go limp at your sides. Feet slow on the sprint back. I tried to do too much.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Sprint back, then get right back into it. Cut hard, show your hands, ask for the ball on the next trip.
_(pause)_
32. Speak the truth. The turnover is real. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Wing · missed-shot (full session)
<!-- slug: bb-wing-missed-shot | file: components/pregame/audio/session-wing-missed-shot.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the first possession. You spot up on the wing.
_(pause)_
16. The ball swings to you. Feet set, shoot it.
_(pause)_
17. You sprint the lane in transition.
_(pause)_
18. You take the next open shot. No hesitation.
_(pause)_
19. You lock up your man. Stay in front.
_(pause)_
20. Box out, then close out hard.
_(pause)_
21. See yourself stay ready and stay aggressive.
_(pause)_
22. Feet set, you shoot it. You sprint the lane.
_(pause)_
23. You take the next open shot, and you lock up your man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your man catches it. You stay down, you contest, and you crash the glass.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You catch it open in your spot. Clean look. Cold off the bench, you brick it. Front rim, nothing.
_(pause)_
28. Feel what your body does. Hands go cold. A flush of doubt up the back of your neck. I'm bricking, I shouldn't shoot.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Your make doesn't decide your worth, so the miss can't either. Relocate, show your hands, and take the next open one with the same confidence.
_(pause)_
32. Speak the truth. The miss is real. It does not vote on whether you take the next one, and it does not name you. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Wing · got-cooked (full session)
<!-- slug: bb-wing-got-cooked | file: components/pregame/audio/session-wing-got-cooked.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the first possession. You spot up on the wing.
_(pause)_
16. The ball swings to you. Feet set, shoot it.
_(pause)_
17. You sprint the lane in transition.
_(pause)_
18. You take the next open shot. No hesitation.
_(pause)_
19. You lock up your man. Stay in front.
_(pause)_
20. Box out, then close out hard.
_(pause)_
21. See yourself stay ready and stay aggressive.
_(pause)_
22. Feet set, you shoot it. You sprint the lane.
_(pause)_
23. You take the next open shot, and you lock up your man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your man catches it. You stay down, you contest, and you crash the glass.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You're on their best scorer. You close out, he rips by you, and finishes over the help. The bench reacts. That one's on the highlight.
_(pause)_
28. Feel what your body does. Heat floods your face. Your feet feel stuck to the floor. I'm a liability.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. One beat doesn't make you a liability. Get into your stance, take the matchup again, and contest the very next closeout.
_(pause)_
32. Speak the truth. Getting beat on one closeout is real. It does not make you a liability, and it is not who you are. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Wing · foul-trouble (full session)
<!-- slug: bb-wing-foul-trouble | file: components/pregame/audio/session-wing-foul-trouble.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the first possession. You spot up on the wing.
_(pause)_
16. The ball swings to you. Feet set, shoot it.
_(pause)_
17. You sprint the lane in transition.
_(pause)_
18. You take the next open shot. No hesitation.
_(pause)_
19. You lock up your man. Stay in front.
_(pause)_
20. Box out, then close out hard.
_(pause)_
21. See yourself stay ready and stay aggressive.
_(pause)_
22. Feet set, you shoot it. You sprint the lane.
_(pause)_
23. You take the next open shot, and you lock up your man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your man catches it. You stay down, you contest, and you crash the glass.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Two quick hand-check fouls on a faster guy. The whistle keeps finding you. You feel the bench getting close.
_(pause)_
28. Feel what your body does. Arms freeze at your sides. A flicker of panic before every closeout. I can't even guard anymore.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Don't back off — defend smarter. Move your feet, stay in front, hands up and back, and contest straight up without reaching.
_(pause)_
32. Speak the truth. The fouls are real. They are not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Wing · coach-yells (full session)
<!-- slug: bb-wing-coach-yells | file: components/pregame/audio/session-wing-coach-yells.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the first possession. You spot up on the wing.
_(pause)_
16. The ball swings to you. Feet set, shoot it.
_(pause)_
17. You sprint the lane in transition.
_(pause)_
18. You take the next open shot. No hesitation.
_(pause)_
19. You lock up your man. Stay in front.
_(pause)_
20. Box out, then close out hard.
_(pause)_
21. See yourself stay ready and stay aggressive.
_(pause)_
22. Feet set, you shoot it. You sprint the lane.
_(pause)_
23. You take the next open shot, and you lock up your man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your man catches it. You stay down, you contest, and you crash the glass.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Coach stops the play and barks your name. You didn't close out. You passed up the open one. The whole gym hears it.
_(pause)_
28. Feel what your body does. Ears go hot. Your eyes drop to your shoes. I can't do anything right.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Coach is coaching what you do, not deciding who you are. Take the note, close out hard, and shoot the next open one without flinching.
_(pause)_
32. Speak the truth. The correction is real. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Wing · benched (full session)
<!-- slug: bb-wing-benched | file: components/pregame/audio/session-wing-benched.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the first possession. You spot up on the wing.
_(pause)_
16. The ball swings to you. Feet set, shoot it.
_(pause)_
17. You sprint the lane in transition.
_(pause)_
18. You take the next open shot. No hesitation.
_(pause)_
19. You lock up your man. Stay in front.
_(pause)_
20. Box out, then close out hard.
_(pause)_
21. See yourself stay ready and stay aggressive.
_(pause)_
22. Feet set, you shoot it. You sprint the lane.
_(pause)_
23. You take the next open shot, and you lock up your man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your man catches it. You stay down, you contest, and you crash the glass.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Your shot isn't falling, so coach pulls you. You sit down at the end of the bench and watch the game go on without you.
_(pause)_
28. Feel what your body does. A hollow drop behind your ribs. Your gaze fixed on the floor in front of the bench. I'm only as good as my last make.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Your worth wasn't on the scoreboard, so the bench can't take it. Stay locked in, talk on defense from your seat, and be ready the second your name is called.
_(pause)_
32. Speak the truth. Sitting down is real. The bench can hold your spot, but it cannot hold your worth — that was never on the scoreboard. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Wing · nervous (full session)
<!-- slug: bb-wing-nervous | file: components/pregame/audio/session-wing-nervous.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the first possession. You spot up on the wing.
_(pause)_
16. The ball swings to you. Feet set, shoot it.
_(pause)_
17. You sprint the lane in transition.
_(pause)_
18. You take the next open shot. No hesitation.
_(pause)_
19. You lock up your man. Stay in front.
_(pause)_
20. Box out, then close out hard.
_(pause)_
21. See yourself stay ready and stay aggressive.
_(pause)_
22. Feet set, you shoot it. You sprint the lane.
_(pause)_
23. You take the next open shot, and you lock up your man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your man catches it. You stay down, you contest, and you crash the glass.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You're in warmups against a ranked team. Scouts are in the gym. Your stroke feels tight and you start doubting the shot before tip-off.
_(pause)_
28. Feel what your body does. Shallow breath. Hands light. I'm not ready for this.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. This is energy, not a warning. Let it sharpen you — get to your spots, hunt your first catch, and let the first shot go free.
_(pause)_
32. Speak the truth. Your body is awake. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Wing · missed-fts (full session)
<!-- slug: bb-wing-missed-fts | file: components/pregame/audio/session-wing-missed-fts.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the first possession. You spot up on the wing.
_(pause)_
16. The ball swings to you. Feet set, shoot it.
_(pause)_
17. You sprint the lane in transition.
_(pause)_
18. You take the next open shot. No hesitation.
_(pause)_
19. You lock up your man. Stay in front.
_(pause)_
20. Box out, then close out hard.
_(pause)_
21. See yourself stay ready and stay aggressive.
_(pause)_
22. Feet set, you shoot it. You sprint the lane.
_(pause)_
23. You take the next open shot, and you lock up your man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your man catches it. You stay down, you contest, and you crash the glass.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You get fouled on a jumper. Two shots, gym goes quiet, all eyes on you. First one rims out. Second one too.
_(pause)_
28. Feel what your body does. The gym goes silent and loud at once. Your mouth goes dry. Even my free shot won't fall.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Two misses don't break your stroke. Keep attacking, keep getting to the line, and trust your routine on the next ones.
_(pause)_
32. Speak the truth. The misses are real. They are not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Wing · start-slow (full session)
<!-- slug: bb-wing-start-slow | file: components/pregame/audio/session-wing-start-slow.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the first possession. You spot up on the wing.
_(pause)_
16. The ball swings to you. Feet set, shoot it.
_(pause)_
17. You sprint the lane in transition.
_(pause)_
18. You take the next open shot. No hesitation.
_(pause)_
19. You lock up your man. Stay in front.
_(pause)_
20. Box out, then close out hard.
_(pause)_
21. See yourself stay ready and stay aggressive.
_(pause)_
22. Feet set, you shoot it. You sprint the lane.
_(pause)_
23. You take the next open shot, and you lock up your man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your man catches it. You stay down, you contest, and you crash the glass.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Your first few touches feel off. The ball isn't finding you and the half is slipping by. You can feel yourself going quiet.
_(pause)_
28. Feel what your body does. Your body goes quiet and small. Energy draining from your legs. I'm invisible out here.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Don't disappear — get loud. Sprint the lanes, cut hard, call for the ball, and demand your next touch.
_(pause)_
32. Speak the truth. The slow start is real. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Wing · fall-behind-early (full session)
<!-- slug: bb-wing-fall-behind-early | file: components/pregame/audio/session-wing-fall-behind-early.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the first possession. You spot up on the wing.
_(pause)_
16. The ball swings to you. Feet set, shoot it.
_(pause)_
17. You sprint the lane in transition.
_(pause)_
18. You take the next open shot. No hesitation.
_(pause)_
19. You lock up your man. Stay in front.
_(pause)_
20. Box out, then close out hard.
_(pause)_
21. See yourself stay ready and stay aggressive.
_(pause)_
22. Feet set, you shoot it. You sprint the lane.
_(pause)_
23. You take the next open shot, and you lock up your man.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your man catches it. You stay down, you contest, and you crash the glass.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. They go on a run and you're down early. You can feel the pull to force a shot, to answer it all by yourself, right now.
_(pause)_
28. Feel what your body does. A hot urgency surges through your chest. Your hands itch for the ball. I have to fix this myself.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. You don't have to hero-ball this. Stay aggressive inside the offense — move the ball, trust your read, and take the open one in rhythm.
_(pause)_
32. Speak the truth. The deficit is real. It is not yours to answer alone, and it is not who you are. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Big · turnover (full session)
<!-- slug: bb-big-turnover | file: components/pregame/audio/session-big-turnover.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You go up and win it.
_(pause)_
16. You seal your man and post strong.
_(pause)_
17. You hit the glass. Two hands, strong.
_(pause)_
18. You roll hard to the rim and finish.
_(pause)_
19. On defense, you move your feet and stay vertical.
_(pause)_
20. You protect the rim. Straight up, no foul.
_(pause)_
21. See yourself own the paint.
_(pause)_
22. You seal and post strong, you hit the glass, you protect the rim.
_(pause)_
23. You roll hard and finish through contact.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They attack the paint. You move your feet, you stay vertical, and you wall up without fouling.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You roll to the rim and the help steps in. You bowl him over. Whistle. Charge. The ball goes the other way.
_(pause)_
28. Feel what your body does. Shoulders curl inward. A heavy thud of frustration in your chest. Keep it out of my hands.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. You want the ball again. Seal your man, call for it, roll hard, and finish strong through contact.
_(pause)_
32. Speak the truth. The turnover is real. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Big · missed-shot (full session)
<!-- slug: bb-big-missed-shot | file: components/pregame/audio/session-big-missed-shot.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You go up and win it.
_(pause)_
16. You seal your man and post strong.
_(pause)_
17. You hit the glass. Two hands, strong.
_(pause)_
18. You roll hard to the rim and finish.
_(pause)_
19. On defense, you move your feet and stay vertical.
_(pause)_
20. You protect the rim. Straight up, no foul.
_(pause)_
21. See yourself own the paint.
_(pause)_
22. You seal and post strong, you hit the glass, you protect the rim.
_(pause)_
23. You roll hard and finish through contact.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They attack the paint. You move your feet, you stay vertical, and you wall up without fouling.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Wide open under the rim. The layup rolls off. You get the board and the putback rims out too.
_(pause)_
28. Feel what your body does. Your hands feel like stone. Heat creeping up from your collar. I can't even finish at the rim.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. You go right back at it. Run the rim, demand the ball deep, and crash the offensive glass on the next miss.
_(pause)_
32. Speak the truth. The miss is real. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Big · got-cooked (full session)
<!-- slug: bb-big-got-cooked | file: components/pregame/audio/session-big-got-cooked.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You go up and win it.
_(pause)_
16. You seal your man and post strong.
_(pause)_
17. You hit the glass. Two hands, strong.
_(pause)_
18. You roll hard to the rim and finish.
_(pause)_
19. On defense, you move your feet and stay vertical.
_(pause)_
20. You protect the rim. Straight up, no foul.
_(pause)_
21. See yourself own the paint.
_(pause)_
22. You seal and post strong, you hit the glass, you protect the rim.
_(pause)_
23. You roll hard and finish through contact.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They attack the paint. You move your feet, you stay vertical, and you wall up without fouling.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. The switch leaves you on their quick guard. He sizes you up, crosses over, and blows by you to the rim.
_(pause)_
28. Feel what your body does. Legs feel slow and rooted. A flush of exposure across your face. They'll hunt me every time.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Next switch, you give him a cushion. Drop, contain, wall him off, and stay vertical at the rim. Make him finish over a wall.
_(pause)_
32. Speak the truth. One blow-by is real. It does not mean they own you. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Big · foul-trouble (full session)
<!-- slug: bb-big-foul-trouble | file: components/pregame/audio/session-big-foul-trouble.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You go up and win it.
_(pause)_
16. You seal your man and post strong.
_(pause)_
17. You hit the glass. Two hands, strong.
_(pause)_
18. You roll hard to the rim and finish.
_(pause)_
19. On defense, you move your feet and stay vertical.
_(pause)_
20. You protect the rim. Straight up, no foul.
_(pause)_
21. See yourself own the paint.
_(pause)_
22. You seal and post strong, you hit the glass, you protect the rim.
_(pause)_
23. You roll hard and finish through contact.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They attack the paint. You move your feet, you stay vertical, and you wall up without fouling.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Two quick fouls and the coach sits you. You come back in scared to touch anybody. You stop contesting. You stop boxing out.
_(pause)_
28. Feel what your body does. Your arms go stiff and cautious. A cold hesitation before every box out. I'm the weak link.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. You can compete hard and stay disciplined at the same time. Stay vertical, hands straight up, beat them to the spot and box out clean. That's how you stay on the floor and help your team.
_(pause)_
32. Speak the truth. The fouls are real. They put you in foul trouble, not in question — they do not make you the weak link. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Big · coach-yells (full session)
<!-- slug: bb-big-coach-yells | file: components/pregame/audio/session-big-coach-yells.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You go up and win it.
_(pause)_
16. You seal your man and post strong.
_(pause)_
17. You hit the glass. Two hands, strong.
_(pause)_
18. You roll hard to the rim and finish.
_(pause)_
19. On defense, you move your feet and stay vertical.
_(pause)_
20. You protect the rim. Straight up, no foul.
_(pause)_
21. See yourself own the paint.
_(pause)_
22. You seal and post strong, you hit the glass, you protect the rim.
_(pause)_
23. You roll hard and finish through contact.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They attack the paint. You move your feet, you stay vertical, and you wall up without fouling.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Their five just grabbed another offensive board. The coach turns and barks down the bench, loud enough for everyone. Box out! You're getting pushed around in there.
_(pause)_
28. Feel what your body does. Your face burns. Shoulders pull down under the words. I'm getting pushed around.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. You answer with your body, physical and under control. Set a hard, legal screen. Hit first on the box out. Own the glass on the next possession.
_(pause)_
32. Speak the truth. One soft screen is real. It does not make you soft. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Big · fouled-out (full session)
<!-- slug: bb-big-fouled-out | file: components/pregame/audio/session-big-fouled-out.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You go up and win it.
_(pause)_
16. You seal your man and post strong.
_(pause)_
17. You hit the glass. Two hands, strong.
_(pause)_
18. You roll hard to the rim and finish.
_(pause)_
19. On defense, you move your feet and stay vertical.
_(pause)_
20. You protect the rim. Straight up, no foul.
_(pause)_
21. See yourself own the paint.
_(pause)_
22. You seal and post strong, you hit the glass, you protect the rim.
_(pause)_
23. You roll hard and finish through contact.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They attack the paint. You move your feet, you stay vertical, and you wall up without fouling.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. The whistle blows. Number six. You're done. You walk off, the game still going, and you can't go back in.
_(pause)_
28. Feel what your body does. The walk off the floor feels long and slow. A lump rising in your throat. I let my team down.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. You're still in this game. On your feet on the bench. Loud on defense, talking coverages, lifting the next big up. Your team needs your voice and your presence.
_(pause)_
32. Speak the truth. Fouling out is real. It cost you the floor — it did not cost you who you are. Your team still needs you. Reset, and go again with your voice.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Big · nervous (full session)
<!-- slug: bb-big-nervous | file: components/pregame/audio/session-big-nervous.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You go up and win it.
_(pause)_
16. You seal your man and post strong.
_(pause)_
17. You hit the glass. Two hands, strong.
_(pause)_
18. You roll hard to the rim and finish.
_(pause)_
19. On defense, you move your feet and stay vertical.
_(pause)_
20. You protect the rim. Straight up, no foul.
_(pause)_
21. See yourself own the paint.
_(pause)_
22. You seal and post strong, you hit the glass, you protect the rim.
_(pause)_
23. You roll hard and finish through contact.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They attack the paint. You move your feet, you stay vertical, and you wall up without fouling.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Warmups. You watch their big across the floor. He's taller, he's heavier, and he's already pushing your teammates around.
_(pause)_
28. Feel what your body does. A buzz of adrenaline through your arms. Pulse loud in your chest. What if I get bullied inside.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. You get to the spot first. Beat him to your position, get your body low, and hold your ground with your feet and base — not by reaching. Be ready for the contact instead of bracing against it.
_(pause)_
32. Speak the truth. Your body is awake. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Big · missed-fts (full session)
<!-- slug: bb-big-missed-fts | file: components/pregame/audio/session-big-missed-fts.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You go up and win it.
_(pause)_
16. You seal your man and post strong.
_(pause)_
17. You hit the glass. Two hands, strong.
_(pause)_
18. You roll hard to the rim and finish.
_(pause)_
19. On defense, you move your feet and stay vertical.
_(pause)_
20. You protect the rim. Straight up, no foul.
_(pause)_
21. See yourself own the paint.
_(pause)_
22. You seal and post strong, you hit the glass, you protect the rim.
_(pause)_
23. You roll hard and finish through contact.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They attack the paint. You move your feet, you stay vertical, and you wall up without fouling.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. They grab you off the ball on purpose. Bonus. Two shots. You step to the line and both clang off the rim.
_(pause)_
28. Feel what your body does. The hush of the gym presses on you. Your hands go heavy at the line. They fouled me on purpose because I'm the weak link.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. You make them pay the other way. Get back, protect the rim, then seal deep and demand the ball. Make being fouled cost them.
_(pause)_
32. Speak the truth. The misses are real. They are not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Big · start-slow (full session)
<!-- slug: bb-big-start-slow | file: components/pregame/audio/session-big-start-slow.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You go up and win it.
_(pause)_
16. You seal your man and post strong.
_(pause)_
17. You hit the glass. Two hands, strong.
_(pause)_
18. You roll hard to the rim and finish.
_(pause)_
19. On defense, you move your feet and stay vertical.
_(pause)_
20. You protect the rim. Straight up, no foul.
_(pause)_
21. See yourself own the paint.
_(pause)_
22. You seal and post strong, you hit the glass, you protect the rim.
_(pause)_
23. You roll hard and finish through contact.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They attack the paint. You move your feet, you stay vertical, and you wall up without fouling.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. First few minutes and you're a step late to everything. He beats you to his spot. He beats you to the glass. They score twice inside.
_(pause)_
28. Feel what your body does. Your steps feel a half-beat behind. A tightness winding across your shoulders. I'm letting them set the tone in the paint.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. You take the tone back. Establish position early, beat him to the spot, and get the first hit on every box out. Set it from here.
_(pause)_
32. Speak the truth. The slow start is real. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Basketball · Big · fall-behind-early (full session)
<!-- slug: bb-big-fall-behind-early | file: components/pregame/audio/session-big-fall-behind-early.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause)_
2. Inhale.
_(pause)_
3. Exhale.
_(pause)_
4. Inhale.
_(pause)_
5. Exhale.
_(pause)_
6. Remember what is true.
_(pause)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause)_
8. Keep your eyes closed. See yourself walking into the gym.
_(pause)_
9. You hear the ball on the floor in warmups.
_(pause)_
10. Hear the squeak of shoes, the rim after a shot.
_(pause)_
11. You feel the ball in your hands. Feel the grip.
_(pause)_
12. Feel your feet under you.
_(pause)_
13. Feel your jersey, light on your shoulders.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize the tip. You go up and win it.
_(pause)_
16. You seal your man and post strong.
_(pause)_
17. You hit the glass. Two hands, strong.
_(pause)_
18. You roll hard to the rim and finish.
_(pause)_
19. On defense, you move your feet and stay vertical.
_(pause)_
20. You protect the rim. Straight up, no foul.
_(pause)_
21. See yourself own the paint.
_(pause)_
22. You seal and post strong, you hit the glass, you protect the rim.
_(pause)_
23. You roll hard and finish through contact.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. They attack the paint. You move your feet, you stay vertical, and you wall up without fouling.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Down ten early. They're scoring in the paint and crashing the offensive glass, and you're the one back there. It feels like the rim is yours to hold and it's slipping.
_(pause)_
28. Feel what your body does. The weight of the paint settles on your shoulders. Breath shortening as the lead grows. It's all on me to hold the paint.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. You don't carry the scoreboard. You own the next possession. Wall up the rim, contest vertical, secure one rebound. Then the next one.
_(pause)_
32. Speak the truth. The deficit is real. The paint is your job, not your worth, and it is not who you are. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
