# From Victory · Script Book · Hockey


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

## Text-mode fallback (Hockey)

These lines appear on-screen in text mode (no audio). Tokens like `{{role}}`, `{{adversity}}`, etc. are substituted at runtime — edit them as-is.

<!-- audioScript#0 | eyebrow: Identity -->
1. ${SCRIPTURE_REF} — ${SCRIPTURE_TEXT} You are not playing to become enough. In Christ, you are already loved. Receive that before you compete.

<!-- audioScript#1 | eyebrow: Settle -->
2. Sit tall. Long exhale. Lead your body back to ready. Four counts in. Six counts out. Let your shoulders drop.

<!-- audioScript#2 | eyebrow: See the rink -->
3. See the ice. Hear the skates. Feel your gloves, your stick, your edges. You belong here. You are ready.

<!-- audioScript#3 | eyebrow: Your first shift -->
4. Your line is called. Three hard strides. Eyes up. Shoulder check. Simple, strong play. Recover. Next action.

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

## Need Openers (hockey)

### Hockey Opener · be-vocal
<!-- slug: opener-be-vocal | file: components/pregame/audio/opener-be-vocal.ts -->

1. Close your eyes. Drop your shoulders.
_(pause)_
2. Out there, talking is competing. The loud player moves the puck before it even arrives. Tonight, that's the job — be the one who talks.
_(pause)_
3. And here is what Paul wrote in Romans 8. For everyone in Christ, there is now no condemnation. None. The verdict on you was settled at the cross — before you ever stepped on the ice.
_(pause)_
4. So when that voice tells you to stay quiet — don't risk it, don't be the one who's wrong out loud — hear it for what it is. That is not you. That is the part of you that has to look good. And that part is already settled.
_(pause)_
5. So tonight, be the loud one. Man on. Time. Heads up. D to D on the breakout. Free to be wrong, free to speak, free to move the play before it even happens.
_(pause)_
6. What anyone out there thinks of you is not the verdict on you. You have nothing left to protect. You are free to speak.
_(pause)_
### Hockey Opener · hope
<!-- slug: opener-hope | file: components/pregame/audio/opener-hope.ts -->

1. Close your eyes. Take one full breath.
_(pause)_
2. Listen to what Isaiah wrote in chapter 40. He was speaking to a people in exile, out of strength, far from home. Even youths grow tired and weary, and young men stumble and fall. But those who hope in the LORD will renew their strength. They will soar on wings like eagles. They will run and not grow weary. They will walk and not be faint.
_(pause)_
3. Soar on wings like eagles does not mean you will never feel tired in your shift. It does not mean prayer is a performance hack. Look at what Isaiah just said — even young men stumble and fall. The source of endurance is not your willpower. It is the God who renews you when you depend on him.
_(pause)_
4. Hope is not believing in yourself. It is waiting on the God who is bigger than what you face.
_(pause)_
### Hockey Opener · joy
<!-- slug: opener-joy | file: components/pregame/audio/opener-joy.ts -->

1. Close your eyes. Let your face soften.
_(pause)_
2. Listen to what Paul wrote in 1 Thessalonians 5. He was writing to a young church facing real hardship. Be joyful always, pray continually, give thanks in all circumstances. For this is God's will for you in Christ Jesus.
_(pause)_
3. Be joyful always does not mean fake a smile or pretend the loss did not hurt. Look at how Paul ties it together. Joy, prayer, thanksgiving. The athlete who prays continually and gives thanks even after a tough shift is the athlete who can carry joy into the next one. Joy is not the absence of hardship. It is what you have when you stay connected to God in the middle of it.
_(pause)_
4. Joy is not a mood that changes with the scoreboard. It is a posture you take toward the God who is always with you.
_(pause)_
### Hockey Opener · leadership
<!-- slug: opener-leadership | file: components/pregame/audio/opener-leadership.ts -->

1. Close your eyes. Take a long breath.
_(pause)_
2. Listen to what Jesus said in Mark 10. His disciples were arguing about who would be greatest. Jesus called them over and said this. Whoever wants to become great among you must be your servant, and whoever wants to be first must be slave of all. For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.
_(pause)_
3. To serve does not mean to be soft. Jesus was not weak. It means using whatever you have been given — the C, the A, a top-line spot, a loud voice — to lift the player next to you, not to stand above them. The fourth-line winger is not ordinary. The backup goalie is not ordinary. Lead like that is true.
_(pause)_
4. Real leadership is not standing above your team. It is standing under them — the way Christ stood under you.
_(pause)_
### Hockey Opener · decisions
<!-- slug: opener-decisions | file: components/pregame/audio/opener-decisions.ts -->

1. Close your eyes. Soften your jaw.
_(pause)_
2. Listen to what Solomon wrote in Proverbs 3. Trust in the Lord with all your heart and lean not on your own understanding. In all your ways submit to him, and he will make your paths straight.
_(pause)_
3. He will make your paths straight does not mean God promises you the right read on every shift. It means you can stop white-knuckling the game. The athlete who has to control every decision plays tight. The athlete who trusts God can release the death grip on outcome and actually see the ice.
_(pause)_
4. Trust does not mean knowing every play before it happens. It means leaning on God instead of leaning on yourself.
_(pause)_
### Hockey Opener · courage
<!-- slug: opener-courage | file: components/pregame/audio/opener-courage.ts -->

1. Close your eyes. Plant both feet on the floor.
_(pause)_
2. Listen to what God said through Isaiah 41 to a people in exile, facing real enemies, real loss. So do not fear, for I am with you. Do not be dismayed, for I am your God. I will strengthen you and help you. I will uphold you with my righteous right hand.
_(pause)_
3. Do not fear does not mean stop feeling nervous. The hit is still coming. The net is still crowded. It means you are not alone in the moment. The God who upheld Israel in exile upholds you in the corner, on the puck race, into the slot.
_(pause)_
4. Courage is not the absence of fear. It is moving forward because the One with you is bigger than what is in front of you.
_(pause)_
### Hockey Opener · reset
<!-- slug: opener-reset | file: components/pregame/audio/opener-reset.ts -->

1. Close your eyes. Let your hands rest open.
_(pause)_
2. Listen to what Paul wrote at the start of Romans 8. He has just spent a whole chapter naming his own failure. Then he opens chapter 8 with this. Therefore, there is now no condemnation for those who are in Christ Jesus.
_(pause)_
3. No condemnation does not mean no consequences. The puck still goes the other way when you turn it over. It means the verdict on you was already settled at the cross. The mistake you make tonight cannot reopen a case God has already closed.
_(pause)_
4. Your mistakes are real. The verdict is not. Reset and go again.
_(pause)_
### Hockey Opener · compete-level
<!-- slug: opener-compete-level | file: components/pregame/audio/opener-compete-level.ts -->

1. Close your eyes. Sit forward.
_(pause)_
2. Listen to what Paul wrote in Colossians 3. Whatever you do, work at it with all your heart, as working for the Lord, not for human masters, since you know that you will receive an inheritance from the Lord as a reward. It is the Lord Christ you are serving.
_(pause)_
3. Working for the Lord does not mean playing harder to earn his love. You already have it. It means every battle on the wall, every backcheck, every shift is offered up to the One who gave you the body to play. Effort becomes worship. The coach is not your final audience. God is.
_(pause)_
4. You are not competing for an audience. You are competing for an Audience of One who already calls you His.
_(pause)_
### Hockey Opener · calm
<!-- slug: opener-calm | file: components/pregame/audio/opener-calm.ts -->

1. Close your eyes. Let your shoulders drop.
_(pause)_
2. Listen to what Paul wrote in Philippians 4. Not from a quiet life. From a Roman prison. Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.
_(pause)_
3. Peace that transcends understanding does not mean you stop feeling nerves. It means a peace that does not match what is in front of you can guard you while you compete. The pressure is still real. So is the One holding you steady inside it.
_(pause)_
4. Peace is not the absence of pressure. It is the presence of Christ when pressure comes.
_(pause)_
### Hockey Opener · confidence
<!-- slug: opener-confidence | file: components/pregame/audio/opener-confidence.ts -->

1. Close your eyes. Sit tall.
_(pause)_
2. Listen to what the writer of Hebrews said to a group of believers worn down by hardship. Hebrews 12. Let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith.
_(pause)_
3. Fix your eyes on Jesus does not mean think positive thoughts about Jesus while you play. It means your confidence is not built on your last shift or your stat line. It is built on the one who already ran his race for you.
_(pause)_
4. Your confidence is not in what you can do. It is in who already loves you.
_(pause)_
## VIZ Clips — Flagship (position)

### Hockey · Forward · VIZ (flagship)
<!-- slug: viz-forward | file: components/pregame/audio/clips.ts -->

1. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
2. You smell the ice, the zamboni.
_(pause)_
3. Hear the skates carving in warmup.
_(pause)_
4. You feel your edges. Feel your gloves.
_(pause)_
5. Feel your stick.
_(pause)_
6. Feel the weight of your helmet.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. Now visualize that your line is called.
_(pause)_
9. You hop the boards. You see the play.
_(pause)_
10. Three hard strides into the play.
_(pause)_
11. Your eyes are up. You shoulder check.
_(pause)_
12. Take the puck and make the simple, strong play.
_(pause)_
13. Get back hard on the change.
_(pause)_
14. See yourself win a puck race along the wall.
_(pause)_
15. You get there first, get low, take the body.
_(pause)_
16. You make a play. Drive inside, hard to the net. Shoot, and score.
_(pause)_
17. Now visualize the next play.
_(pause)_
18. Your teammate has the puck. It turns over. You backcheck harder than everyone else and stop the goal.
_(pause)_
### Hockey · Defense · VIZ (flagship)
<!-- slug: viz-defense | file: components/pregame/audio/clips.ts -->

1. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
2. You smell the ice, the zamboni.
_(pause)_
3. Hear the skates carving in warmup.
_(pause)_
4. You feel your edges. Feel your gloves.
_(pause)_
5. Feel your stick.
_(pause)_
6. Feel the weight of your helmet.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. Now visualize that your line is called.
_(pause)_
9. You hop the boards. Get to your gap.
_(pause)_
10. Shoulder check before the puck arrives.
_(pause)_
11. See the play develop.
_(pause)_
12. Hold your line. Make a simple first pass.
_(pause)_
13. Box out at the net front. Go again.
_(pause)_
14. See yourself shoulder check before you pick up the puck.
_(pause)_
15. You retrieve the puck, calm and strong.
_(pause)_
16. You make the first pass, clean and on the tape.
_(pause)_
17. Now visualize the next play.
_(pause)_
18. You hold your gap, you stay between the man and the net, and you box out in front.
_(pause)_
### Hockey · Goalie · VIZ (flagship)
<!-- slug: viz-goalie | file: components/pregame/audio/clips.ts -->

1. See the crease.
_(pause)_
2. The blue paint under your skates.
_(pause)_
3. The crossbar behind your head.
_(pause)_
4. Hear the anthem fade out.
_(pause)_
5. Feel your glove.
_(pause)_
6. Feel your blocker.
_(pause)_
7. Feel the weight of your pads, settled and ready.
_(pause)_
8. You belong here.
_(pause)_
9. Puck drops.
_(pause)_
10. Set your feet in the crease.
_(pause)_
11. Square to the shooter.
_(pause)_
12. Track the puck all the way in.
_(pause)_
13. Make the first save, calm and big.
_(pause)_
14. Control the rebound. Cover, or steer it to the corner.
_(pause)_
15. Reset. Eyes back to the puck.
_(pause)_
16. Set your feet.
_(pause)_
17. Track the puck.
_(pause)_
18. Control the rebound.
_(pause)_
19. Reset after traffic.
_(pause)_
20. Next shot only.
_(pause)_
## VIZ Clips — Positive Plays

### Hockey · Defense · retrieval (viz play)
<!-- slug: viz-defense-retrieval | file: components/pregame/audio/clips-viz.ts -->

1. See yourself as the first player back, on your toes and ready for it.
_(pause)_
2. The puck is dumped in behind you.
_(pause)_
3. You shoulder-check over your inside shoulder.
_(pause)_
4. You turn and sprint back for it.
_(pause)_
5. You shoulder-check again — you know where the forecheck is.
_(pause)_
6. You feel him coming, but you are not rushed.
_(pause)_
7. At the puck, you sell up the wall.
_(pause)_
8. The forechecker leans. You cut back into space.
_(pause)_
9. Clean pickup, head up.
_(pause)_
10. Tape-to-tape pass to your winger.
_(pause)_
### Hockey · Defense · walk-the-line (viz play)
<!-- slug: viz-defense-walk-the-line | file: components/pregame/audio/clips-viz.ts -->

1. See the puck come to you at the blue line, with the whole play in front of you.
_(pause)_
2. The puck rims around the wall to you at the point.
_(pause)_
3. It's bouncing — you settle it down.
_(pause)_
4. You pull it off the wall, along the blue line.
_(pause)_
5. You open up, eyes on the lane.
_(pause)_
6. A teammate ties up the net-front.
_(pause)_
7. You walk the line one more step, into the seam.
_(pause)_
8. You fire it through — a hard shot, on net, low.
_(pause)_
9. Stick on the ice for the rebound.
_(pause)_
### Hockey · Defense · gap-up (viz play)
<!-- slug: viz-defense-gap-up | file: components/pregame/audio/clips-viz.ts -->

1. See the rush coming at you, and feel yourself ready to control the space.
_(pause)_
2. They break out, you swing back.
_(pause)_
3. You skate it backward, eyes on the puck carrier's chest.
_(pause)_
4. You close your gap — one stick-length, then tighter.
_(pause)_
5. He tries to beat you wide.
_(pause)_
6. You match his speed, angle him to the wall.
_(pause)_
7. You stand him up at the line. No entry.
_(pause)_
8. The puck dies in the corner.
_(pause)_
9. Your partner is there. You win it back.
_(pause)_
### Hockey · Defense · breakout (viz play)
<!-- slug: viz-defense-breakout | file: components/pregame/audio/clips-viz.ts -->

1. See yourself below the goal line, pressure coming, eyes up and ready to move it.
_(pause)_
2. You retrieve it low, under pressure from F1.
_(pause)_
3. You shoulder-check — F2 is reading your first option.
_(pause)_
4. You take it behind the net, holding the puck.
_(pause)_
5. D-to-D, hard pass to your partner.
_(pause)_
6. He's got a step now, the forecheck overcommitted.
_(pause)_
7. You skate to support, an option up the wall.
_(pause)_
8. He hits you in stride at the hash marks.
_(pause)_
9. You chip it out, clean. Zone exit, on the tape.
_(pause)_
### Hockey · Defense · long-shift (viz play)
<!-- slug: viz-defense-long-shift | file: components/pregame/audio/clips-viz.ts -->

1. See yourself late in a hard shift, tired but still responsible.
_(pause)_
2. They keep it in at your line — you can't get the clear.
_(pause)_
3. The shift gets long. They cycle low and you're pinned in your zone.
_(pause)_
4. Your legs are burning. You want the change. It's not there yet.
_(pause)_
5. You stay above your check. Box out. Battle for body position.
_(pause)_
6. You don't cheat for offense — you defend, take away the next pass.
_(pause)_
7. The puck squirts loose to your corner.
_(pause)_
8. You get to it, shoulder-check, and chip it hard off the glass and out.
_(pause)_
9. Clean clear. You're first to the bench.
_(pause)_
10. Fresh legs jump on. Long shift, no goal against.
_(pause)_
11. You did your job. That's the change you earned.
_(pause)_
### Hockey · Defense · pinch-score (viz play)
<!-- slug: viz-defense-pinch-score | file: components/pregame/audio/clips-viz.ts -->

1. See the puck near the wall and know this is your chance to keep the play alive.
_(pause)_
2. The puck's chipped up the wall, trying to leave the zone.
_(pause)_
3. You're the D at the blue line. You read it early.
_(pause)_
4. You shoulder-check — your center is high, covering for you.
_(pause)_
5. You step down and pinch, pin it on the wall.
_(pause)_
6. You win the battle and knock it to the middle.
_(pause)_
7. You walk off the wall into the slot.
_(pause)_
8. You snap a low shot through the traffic.
_(pause)_
9. It tips in. You kept it alive and buried it.
_(pause)_
### Hockey · Defense · penalty-kill-clear (viz play)
<!-- slug: viz-defense-penalty-kill-clear | file: components/pregame/audio/clips-viz.ts -->

1. See yourself on the penalty kill, locked into your lane and your job.
_(pause)_
2. You are on the penalty kill. They set up high.
_(pause)_
3. You stay in the shot lane, stick out front.
_(pause)_
4. The puck moves to the half wall. You do not chase.
_(pause)_
5. You keep the box tight and protect the middle.
_(pause)_
6. The shot comes from the point. You get in the lane.
_(pause)_
7. It hits your shin pad and drops loose.
_(pause)_
8. You win the race and chip it hard down the ice.
_(pause)_
9. Your bench taps their sticks. Kill the next one.
_(pause)_
### Hockey · Defense · vocal-breakout (viz play)
<!-- slug: viz-defense-vocal-breakout | file: components/pregame/audio/clips-viz.ts -->

1. See yourself as the calm voice on the ice, helping everyone play faster.
_(pause)_
2. Your partner goes back for the puck.
_(pause)_
3. You shoulder-check and read the forecheck.
_(pause)_
4. You call it early: "Reverse."
_(pause)_
5. He hears you and banks it behind the net.
_(pause)_
6. You collect it in stride, head up.
_(pause)_
7. The winger is posted on the wall. Your center is low.
_(pause)_
8. You call "wall" and put it on the tape.
_(pause)_
9. Clean exit. Your voice made the game slower.
_(pause)_
### Hockey · Defense · angle-wide-boxout (viz play)
<!-- slug: viz-defense-angle-wide-boxout | file: components/pregame/audio/clips-viz.ts -->

1. See the rush building, and feel yourself set, square, and ready to angle him off.
_(pause)_
2. They come through the neutral zone with speed.
_(pause)_
3. You hold the middle and match his pace.
_(pause)_
4. You do not lunge. You do not open the inside lane.
_(pause)_
5. You angle him wide toward the boards.
_(pause)_
6. He shoots from outside the dot. Low danger.
_(pause)_
7. Your goalie makes the save. The rebound drops in front.
_(pause)_
8. You tie up his stick and take his body.
_(pause)_
9. Your partner collects the puck.
_(pause)_
10. Middle protected. Rebound won. Job done.
_(pause)_
### Hockey · Forward · win-the-wall (viz play)
<!-- slug: viz-forward-win-the-wall | file: components/pregame/audio/clips-viz.ts -->

1. See the puck go into your corner and know you are going to win the race.
_(pause)_
2. The puck's chipped into your corner.
_(pause)_
3. You get there first, low and strong.
_(pause)_
4. You take the body, pin your check, protect the puck.
_(pause)_
5. You pull it off the wall to the middle.
_(pause)_
6. You drive the net, hard, inside hand.
_(pause)_
7. You go to the backhand, around the goalie's pad.
_(pause)_
8. The puck crosses the line.
_(pause)_
9. The puck is in. You earned that one.
_(pause)_
### Hockey · Forward · give-and-go (viz play)
<!-- slug: viz-forward-give-and-go | file: components/pregame/audio/clips-viz.ts -->

1. See open ice ahead of you and feel your speed starting to build.
_(pause)_
2. You carry it through the neutral zone, speed building.
_(pause)_
3. You shoulder-check — your winger is filling the lane.
_(pause)_
4. You give it to him and accelerate.
_(pause)_
5. You hit the soft spot in the D, between the two defenders.
_(pause)_
6. His return pass is on your tape, flat.
_(pause)_
7. One touch to settle it, the goalie sliding.
_(pause)_
8. You roof it over the blocker.
_(pause)_
9. Top corner. Bar down.
_(pause)_
### Hockey · Forward · backcheck-strip (viz play)
<!-- slug: viz-forward-backcheck-strip | file: components/pregame/audio/clips-viz.ts -->

1. See the turnover happen and feel yourself commit to getting back hard.
_(pause)_
2. The puck turns over at their blue line.
_(pause)_
3. They're on the rush, you're the high forward.
_(pause)_
4. You turn and skate, full speed, back through center.
_(pause)_
5. You track the puck-carrier on his inside hand.
_(pause)_
6. You catch him at the top of the circle.
_(pause)_
7. Active stick — you lift his, then poke the puck free.
_(pause)_
8. You knock it to the corner, kill the rush.
_(pause)_
9. You jump back to the bench. Clean change.
_(pause)_
### Hockey · Forward · net-front (viz play)
<!-- slug: viz-forward-net-front | file: components/pregame/audio/clips-viz.ts -->

1. See yourself at the net-front, ready to make a hard play in traffic.
_(pause)_
2. The point man winds up for the shot.
_(pause)_
3. You set up at the net-front, stick on the ice.
_(pause)_
4. You find a lane, body between the D and the goalie.
_(pause)_
5. The shot comes — you get a piece, tip it down.
_(pause)_
6. The goalie kicks out a rebound.
_(pause)_
7. You're already on it, hands quick.
_(pause)_
8. You bang it home before he resets.
_(pause)_
9. The puck is in. Net-front work paid off.
_(pause)_
### Hockey · Forward · faceoff-win-shot (viz play)
<!-- slug: viz-forward-faceoff-win-shot | file: components/pregame/audio/clips-viz.ts -->

1. See yourself over the dot, set, calm, and ready for the puck drop.
_(pause)_
2. You're at the dot in the O-zone. You set your grip.
_(pause)_
3. You read the linesman's hand. You win it clean back to your D.
_(pause)_
4. You release off the dot and find the soft ice in the slot.
_(pause)_
5. Your D walks the line and the lane opens.
_(pause)_
6. The puck comes down to the tape in the middle.
_(pause)_
7. One touch, you bury it bar-down.
_(pause)_
### Hockey · Forward · 2on1-pass-finish (viz play)
<!-- slug: viz-forward-2on1-pass-finish | file: components/pregame/audio/clips-viz.ts -->

1. See the odd-man rush opening up, with space and speed in front of you.
_(pause)_
2. You jump the gap and it's a 2-on-1 the other way.
_(pause)_
3. You read the D — he sinks to take the pass.
_(pause)_
4. You're patient. You drive the soft ice and hold the puck.
_(pause)_
5. He commits to you. The lane to your winger opens.
_(pause)_
6. You slide it flat across, right onto his tape.
_(pause)_
7. He one-times it home. You made that play.
_(pause)_
### Hockey · Forward · forecheck-strip (viz play)
<!-- slug: viz-forward-forecheck-strip | file: components/pregame/audio/clips-viz.ts -->

1. See yourself as F1, first into the zone, setting the pressure.
_(pause)_
2. You're F1, first man in on the forecheck.
_(pause)_
3. You take the right angle and cut off his strong-side option.
_(pause)_
4. You close hard and pin him to the wall.
_(pause)_
5. You lift his stick and steal the puck off the boards.
_(pause)_
6. You spin off pressure, low to the net.
_(pause)_
7. You tuck it short side. Forecheck to goal.
_(pause)_
### Hockey · Forward · cycle-low-high (viz play)
<!-- slug: viz-forward-cycle-low-high | file: components/pregame/audio/clips-viz.ts -->

1. See the puck below the goal line and feel your line ready to build pressure.
_(pause)_
2. The puck is below the goal line. You get there first.
_(pause)_
3. You protect it with your body, shoulder into pressure.
_(pause)_
4. You hear your teammate call for the cycle.
_(pause)_
5. You leave it soft off the wall and roll high.
_(pause)_
6. The puck moves low to high to your D.
_(pause)_
7. You drive through the defender's hands to the net-front.
_(pause)_
8. The shot comes through traffic.
_(pause)_
9. You screen the goalie and hunt the rebound.
_(pause)_
10. Possession kept. Pressure built. That is winning hockey.
_(pause)_
### Hockey · Forward · 3on2-middle-drive (viz play)
<!-- slug: viz-forward-3on2-middle-drive | file: components/pregame/audio/clips-viz.ts -->

1. See the rush forming, and know your middle-lane drive can open everything.
_(pause)_
2. You cross the red line with speed. It is a 3-on-2.
_(pause)_
3. Your winger has the puck wide. You read the gap.
_(pause)_
4. You drive the middle lane hard, stick on the ice.
_(pause)_
5. Both defenders feel you coming through the slot.
_(pause)_
6. The far winger delays into open ice.
_(pause)_
7. The pass goes across. The shot comes.
_(pause)_
8. You stop at the net-front, ready for the rebound.
_(pause)_
9. The puck kicks loose. You bury it from the top of the crease.
_(pause)_
### Hockey · Forward · dzone-faceoff-win (viz play)
<!-- slug: viz-forward-dzone-faceoff-win | file: components/pregame/audio/clips-viz.ts -->

1. See the defensive-zone draw and feel the importance of doing your job.
_(pause)_
2. Defensive-zone draw. Late in the period.
_(pause)_
3. You set your feet and know your job.
_(pause)_
4. The puck drops. You tie up hard.
_(pause)_
5. Your winger jumps through and wins the loose puck.
_(pause)_
6. You support low and protect the middle.
_(pause)_
7. The puck goes wall-side, then out.
_(pause)_
8. You clear the zone and get fresh legs on.
_(pause)_
9. Small play. Big moment. You did your job.
_(pause)_
### Hockey · Goalie · track-and-save (viz play)
<!-- slug: viz-goalie-track-and-save | file: components/pregame/audio/clips-viz.ts -->

1. See the play enter your zone and feel yourself settled in your crease.
_(pause)_
2. The puck comes up the wall into the zone.
_(pause)_
3. You set your depth, square to the puck.
_(pause)_
4. You stay big, hands out front, weight on the balls of your feet.
_(pause)_
5. The shooter loads up from the top of the circle.
_(pause)_
6. You track it off his blade, all the way in.
_(pause)_
7. You take it in the chest, smother it.
_(pause)_
8. The whistle blows. You've got it.
_(pause)_
9. You're calm. Set for the next one.
_(pause)_
### Hockey · Goalie · rebound-control (viz play)
<!-- slug: viz-goalie-rebound-control | file: components/pregame/audio/clips-viz.ts -->

1. See the shooter on the wing and feel yourself ready to control the puck.
_(pause)_
2. Shot from the wing, low and hard.
_(pause)_
3. You drop into your butterfly, sealed to the ice.
_(pause)_
4. You take it off the pad.
_(pause)_
5. You angle the pad, steer the rebound to the corner.
_(pause)_
6. No second chance — the puck dies in the boards.
_(pause)_
7. You push back to your feet.
_(pause)_
8. You re-center on your post, depth set.
_(pause)_
9. Eyes back on the puck. Next shot only.
_(pause)_
### Hockey · Goalie · post-to-post (viz play)
<!-- slug: viz-goalie-post-to-post | file: components/pregame/audio/clips-viz.ts -->

1. See the puck below the goal line and feel yourself sealed and patient.
_(pause)_
2. The puck swings low, below the goal line.
_(pause)_
3. You seal the near post, leak nothing short side.
_(pause)_
4. The pass goes cross-ice, backdoor.
_(pause)_
5. You push post to post, square on arrival.
_(pause)_
6. You're set before the shot — not sliding through it.
_(pause)_
7. You take it on the blocker, controlled.
_(pause)_
8. You direct it high glass, out of danger.
_(pause)_
9. You reset to center. You held your ground.
_(pause)_
### Hockey · Goalie · breakaway (viz play)
<!-- slug: viz-goalie-breakaway | file: components/pregame/audio/clips-viz.ts -->

1. See the player coming in alone and feel your body stay big and quiet.
_(pause)_
2. He's behind the D, in alone, gathering speed.
_(pause)_
3. You set your depth at the top of the crease.
_(pause)_
4. You match his pace as he comes, staying patient.
_(pause)_
5. Stay big. Hands out front. Don't bite on the first move.
_(pause)_
6. He pulls it to his forehand, tries to go five-hole.
_(pause)_
7. You stay on your feet, then close the seal.
_(pause)_
8. The puck hits your pads and dies.
_(pause)_
9. You cover it up. You won that one-on-one.
_(pause)_
### Hockey · Goalie · glove-freeze (viz play)
<!-- slug: viz-goalie-glove-freeze | file: components/pregame/audio/clips-viz.ts -->

1. See the shot developing through traffic and feel your glove ready out front.
_(pause)_
2. Puck's in the corner, they're working it for a shot.
_(pause)_
3. You're square, gloves out front, tracking it through.
_(pause)_
4. The shot comes hard, glove side, high.
_(pause)_
5. You catch it clean. The leather snaps shut.
_(pause)_
6. You hold it. The whistle goes.
_(pause)_
7. You stayed square. You held it. Faceoff.
_(pause)_
### Hockey · Goalie · scramble-save (viz play)
<!-- slug: viz-goalie-scramble-save | file: components/pregame/audio/clips-viz.ts -->

1. See the crease get messy and know you are going to keep fighting for the puck.
_(pause)_
2. It's a scramble in your crease. The puck's loose.
_(pause)_
3. The first shot beats you and you're down and out.
_(pause)_
4. You don't quit on it. You drive to your post.
_(pause)_
5. You throw the pad across and seal the ice.
_(pause)_
6. The puck hits you and stays out.
_(pause)_
7. You found it, you covered it. Whistle. Breathe.
_(pause)_
### Hockey · Goalie · screen-traffic (viz play)
<!-- slug: viz-goalie-screen-traffic | file: components/pregame/audio/clips-viz.ts -->

1. See bodies in front of you and feel yourself working to find the puck.
_(pause)_
2. There's a shot coming and a body in your sightline.
_(pause)_
3. You don't fight the screen. You move to find the puck.
_(pause)_
4. You drop and look around the hip, eyes on the release.
_(pause)_
5. You see it late and get a piece — it's off your chest.
_(pause)_
6. You smother the rebound before a stick can find it.
_(pause)_
7. You read it through the traffic. Save and freeze.
_(pause)_
### Hockey · Goalie · play-puck-breakout (viz play)
<!-- slug: viz-goalie-play-puck-breakout | file: components/pregame/audio/clips-viz.ts -->

1. See the dump-in coming and know you can help your team before pressure arrives.
_(pause)_
2. The puck is dumped in hard around the glass.
_(pause)_
3. You leave your crease and get behind it early.
_(pause)_
4. You stop it clean behind the net.
_(pause)_
5. You shoulder-check. F1 is coming.
_(pause)_
6. You make the simple play to your defenseman's forehand.
_(pause)_
7. He collects it with time. The forecheck slows down.
_(pause)_
8. You get back to your crease, square and ready.
_(pause)_
9. You helped your team break out before the pressure arrived.
_(pause)_
### Hockey · Goalie · pk-seam-save (viz play)
<!-- slug: viz-goalie-pk-seam-save | file: components/pregame/audio/clips-viz.ts -->

1. See the power play moving the puck and feel yourself patient through the seam.
_(pause)_
2. They are on the power play, moving the puck around the outside.
_(pause)_
3. You stay patient, square to the puck.
_(pause)_
4. The pass goes across the seam.
_(pause)_
5. You push hard, eyes arriving before your body.
_(pause)_
6. You get set on your edge before the release.
_(pause)_
7. The one-timer comes. You take it in the chest.
_(pause)_
8. No rebound. Whistle.
_(pause)_
9. You stayed patient. You beat the pass.
_(pause)_
## Hard Moment Clips — Forward

### Hockey · Forward · nervous
<!-- slug: hm-forward-nervous | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are on the bench before the first shift. Your hands feel light. Your legs feel shaky. Your heart is up in your throat.
_(pause)_
3. Feel what your body does. Shallow breath. Stomach tight. I am not ready for this.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Come back to your breath. Come back to right now.
_(pause)_
6. Being nervous is energy, not danger. Let it sharpen you. First shift, move your feet, get to the wall, and touch the game early.
_(pause)_
### Hockey · Forward · missed-chance
<!-- slug: hm-forward-missed-chance | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are alone in the slot. The pass finds your tape. You shoot. It rings off the post.
_(pause)_
3. Feel what your body does. Stomach drop. Heat in your face. I should have buried that.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That chance is over. The next puck is still yours.
_(pause)_
6. Speak the truth. That shot is gone. Stay ready for the next look.
_(pause)_
### Hockey · Forward · turnover
<!-- slug: hm-forward-turnover | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You have the puck at the offensive blue line. You try to force it through a stick. It pops loose and goes the other way. They are on the rush.
_(pause)_
3. Feel what your body does. Stomach drop. Heat in your face. I just gave them that.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That turnover is over. Sprint back into this play.
_(pause)_
6. Speak the truth. That turnover is over. Get back, get organized, and make the next simple play.
_(pause)_
### Hockey · Forward · beaten-wide
<!-- slug: hm-forward-beaten-wide | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are backchecking through the neutral zone. The winger has the puck and a step. You reach. He goes by you on the outside.
_(pause)_
3. Feel what your body does. Lungs burn. Legs heavy. I am a step slow tonight.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That rush is over. Get your feet moving and take the next backcheck.
_(pause)_
6. Speak the truth. He had a step. It is not your identity. Reset and go again.
_(pause)_
### Hockey · Forward · bad-penalty
<!-- slug: hm-forward-bad-penalty | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are chasing the play. You reach with your stick. The whistle blows. The ref points at you. Two minutes.
_(pause)_
3. Feel what your body does. Heat in your face. Stomach drop. I just hurt my team.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The whistle is over. Breathe, own the next shift, and compete clean.
_(pause)_
6. Play brave next shift. Compete the same way.
_(pause)_
7. The whistle happened. Learn from it, then compete the next shift clean.
_(pause)_
### Hockey · Forward · coach-yells
<!-- slug: hm-forward-coach-yells | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You come back to the bench. The coach is loud. Sharp. Maybe your name. Maybe not. The whole bench can hear it.
_(pause)_
3. Feel what your body does. Tight jaw. Heat in your chest. He is going to bury me.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That correction is over. Take what helps and come back to now.
_(pause)_
6. The volume is not the verdict. Take the correction, keep your feet moving, and answer with your next shift.
_(pause)_
### Hockey · Forward · benched
<!-- slug: hm-forward-benched | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Two shifts go by. Then three. The line goes out without you. You sit on the bench. The door does not open.
_(pause)_
3. Feel what your body does. Heat in your chest. Tight in your throat. He doesn't trust me.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Stay in the game from here. Watch the pace, stay loud, and be ready when the door opens.
_(pause)_
6. The bench has your body for a shift. It does not have your mind. Stay loud, watch the pace, and be ready to bring energy on the next shift.
_(pause)_
### Hockey · Forward · get-hit
<!-- slug: hm-forward-get-hit | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are on the wall. You don't see him coming. He finishes his check. You hit the boards hard. The puck is gone.
_(pause)_
3. Feel what your body does. Wind out of your lungs. Heat in your shoulder. I should have seen him.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That hit is over. Breathe, get your body back, and return to the next battle.
_(pause)_
6. Go get the next puck battle. Get back to the wall.
_(pause)_
7. Speak the truth. You got hit. It is not your identity. Reset and go again.
_(pause)_
### Hockey · Forward · start-slow
<!-- slug: hm-forward-start-slow | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. First period is half over. You have not touched the puck cleanly. Your legs feel a step behind. Nothing is coming easy.
_(pause)_
3. Feel what your body does. Tight grip on the stick. Shoulders up. I am not in this game.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The slow start is over. Build the game from this next shift.
_(pause)_
6. Loose hands. Simple plays. Let the game come to you.
_(pause)_
7. Speak the truth. You do not need to chase the game. Let it come to you. Win one wall battle, make one simple play, and build from there.
_(pause)_
### Hockey · Forward · first-goal-against
<!-- slug: hm-forward-first-goal-against | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The puck goes in behind your goalie. The other bench celebrates. The horn sounds. You skate back to center ice.
_(pause)_
3. Feel what your body does. Stomach drop. Heat in your chest. Here we go again.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That goal is over. Come back to the next shift.
_(pause)_
6. They scored first. Come back with one strong shift.
_(pause)_
## Hard Moment Clips — Defense

### Hockey · Defense · beaten-wide
<!-- slug: hm-defense-beaten-wide | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are back in your zone. The puck carrier comes wide. He has speed. You lose the angle. He has a step on you.
_(pause)_
3. Feel what your body does. Stomach drop. Burn in your chest. I lost my gap.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That rush is over. Get your feet back under you and take the next matchup.
_(pause)_
6. Stay loose. Match his feet. Hold your gap.
_(pause)_
7. Speak the truth. That turnover is over. Get back, get organized, and make the next simple play.
_(pause)_
### Hockey · Defense · turnover
<!-- slug: hm-defense-turnover | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You retrieve the puck behind your net. You try to make the pass through the slot. It hits a stick. The other team has it in front.
_(pause)_
3. Feel what your body does. Stomach drop. Heat in your face. I just put my goalie in a bad spot.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That turnover is over. Get back into structure and make the next simple play.
_(pause)_
6. Next breakout, simple and strong. Off the glass if it's there.
_(pause)_
7. That turnover is over. Get back, get organized, and make the next simple play.
_(pause)_
### Hockey · Defense · missed-chance
<!-- slug: hm-defense-missed-chance | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You walk the blue line. The lane opens. You step in and shoot. It misses the net wide.
_(pause)_
3. Feel what your body does. Stomach drop. Heat in your face. I should have hit the net.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That shot is over. The next play is still yours.
_(pause)_
6. That shot is gone. Stay ready for the next look.
_(pause)_
### Hockey · Defense · bad-penalty
<!-- slug: hm-defense-bad-penalty | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The puck carrier cuts inside. You bring your stick up. The whistle blows. The ref points at you. Two minutes.
_(pause)_
3. Feel what your body does. Heat in your face. Tight in your chest. I just put us down a man.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The whistle is over. Breathe, own the next shift, and compete clean.
_(pause)_
6. Play hard next shift. Play your gap the same way.
_(pause)_
7. The whistle happened. Learn from it, then compete the next shift clean.
_(pause)_
### Hockey · Defense · coach-yells
<!-- slug: hm-defense-coach-yells | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You come off the ice. The coach is loud. Sharp. Maybe your name. Maybe not. The whole bench can hear it.
_(pause)_
3. Feel what your body does. Tight jaw. Heat in your chest. He doesn't trust me back there.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That correction is over. Take what helps and come back to now.
_(pause)_
6. The volume is not the verdict. Hear the correction, leave the shame, and play the next shift steady.
_(pause)_
### Hockey · Defense · benched
<!-- slug: hm-defense-benched | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your partner goes out with someone else. Then again. You sit on the bench. The door does not open.
_(pause)_
3. Feel what your body does. Heat in your chest. Tight in your throat. He doesn't trust me.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Stay in the game from here. Watch, talk, and be ready when the door opens.
_(pause)_
6. The bench has your body for a shift. It does not have your mind. Watch the forecheck, talk to your partner, and be ready when the door opens.
_(pause)_
### Hockey · Defense · nervous
<!-- slug: hm-defense-nervous | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are on the bench before the first shift. Your legs feel heavy. Your hands feel light. Your heart is up in your throat.
_(pause)_
3. Feel what your body does. Shallow breath. Stomach tight. I am going to get exposed out there.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Come back to your breath. Come back to right now.
_(pause)_
6. Being nervous is energy, not danger. Let it sharpen you. First shift, skate forward, hold your gap, and make the simple play.
_(pause)_
### Hockey · Defense · get-hit
<!-- slug: hm-defense-get-hit | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are back for the puck. You don't see him coming. He finishes his check. You hit the boards hard. The puck is gone.
_(pause)_
3. Feel what your body does. Wind out of your lungs. Heat in your shoulder. I should have shoulder checked.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That hit is over. Breathe, get your body back, and return to the next puck.
_(pause)_
6. Don't rim it soft next time. Make the strong play.
_(pause)_
7. Speak the truth. You got hit. It is not your identity. Reset and go again.
_(pause)_
### Hockey · Defense · start-slow
<!-- slug: hm-defense-start-slow | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. First period is half over. Your gap has been late. Your passes have been off. Nothing is coming easy.
_(pause)_
3. Feel what your body does. Tight grip on the stick. Shoulders up. I am behind out there.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The slow start is over. Build the game from this next shift.
_(pause)_
6. Skate first. Stick on the puck. Simple breakouts.
_(pause)_
7. The first few shifts are gone. Your job is the next gap, the next pass, the next battle. Reset and play free.
_(pause)_
### Hockey · Defense · first-goal-against
<!-- slug: hm-defense-first-goal-against | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The puck goes in behind your goalie. The other bench celebrates. The horn sounds. You skate back to center ice.
_(pause)_
3. Feel what your body does. Stomach drop. Heat in your chest. We couldn't hold them.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That goal is over. Come back to the next shift.
_(pause)_
6. Stay loose. Hold your gap. Play the next shift, not the last one.
_(pause)_
7. They scored first. Come back with one strong shift.
_(pause)_
## Hard Moment Clips — Goalie

### Hockey · Goalie · coach-yells
<!-- slug: hm-goalie-coach-yells | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. A goal goes in. The whistle blows. You hear your coach from the bench. Loud. Sharp. Maybe your name. Maybe not. The whole rink can hear it.
_(pause)_
3. Feel what your body does. Tight jaw. Heat in your chest. He does not trust me.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That correction is over. Take what helps and come back to the next shot.
_(pause)_
6. The volume is not the verdict. Take what helps, let the rest pass, and meet the next shot square.
_(pause)_
### Hockey · Goalie · turnover
<!-- slug: hm-goalie-turnover | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are behind the net with the puck. You try to move it up the wall. It hits a forechecker's stick. The other team has it on top of your crease.
_(pause)_
3. Feel what your body does. Stomach drop. Heat in your face. I just handed them a goal.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That turnover is over. Get set, find the puck, and make the next save.
_(pause)_
6. Decide early next time. Play the puck strong or leave it.
_(pause)_
7. Speak the truth. That turnover is over. Get back, get organized, and make the next simple play.
_(pause)_
### Hockey · Goalie · missed-chance
<!-- slug: hm-goalie-missed-chance | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The puck carrier comes in alone. You step out for the poke check. Your stick catches nothing. He walks around you.
_(pause)_
3. Feel what your body does. Stomach drop. Heat in your face. I should have stayed in my net.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That choice is over. Reset your depth and meet the next one.
_(pause)_
6. That chance is gone. Stay patient for the next one.
_(pause)_
### Hockey · Goalie · beaten-wide
<!-- slug: hm-goalie-beaten-wide | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The pass goes from one side of the crease to the other. You push across. You are late. The puck is in the back of the net before you set.
_(pause)_
3. Feel what your body does. Stomach drop. Heat in your chest. I was too slow across.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That pass is over. Reset your edges and trust the next push.
_(pause)_
6. Don't cheat the next pass. Stay square. Trust your push.
_(pause)_
7. Speak the truth. He beat you across. It is not your identity. Reset and go again.
_(pause)_
### Hockey · Goalie · bad-penalty
<!-- slug: hm-goalie-bad-penalty | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The puck is in your feet. You flip it over the glass. The whistle blows. The ref points at you. Two minutes for delay of game.
_(pause)_
3. Feel what your body does. Heat in your face. Tight in your chest. I just hurt my team.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The whistle is over. Breathe, trust your reads, and meet the next puck.
_(pause)_
6. Don't play tight on the PK. Trust your reads.
_(pause)_
7. The whistle happened. Learn from it, then compete the next shift clean.
_(pause)_
### Hockey · Goalie · pulled
<!-- slug: hm-goalie-pulled | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The coach taps your backup. You skate to the bench. You sit at the end. The game keeps going without you.
_(pause)_
3. Feel what your body does. Heat in your chest. Tight in your throat. He gave up on me.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Stay in the game from here. Support your teammate and keep your mind ready.
_(pause)_
6. The bench has your body, but it does not have your worth. Stay present, support your teammate, and keep your mind in the game.
_(pause)_
### Hockey · Goalie · nervous
<!-- slug: hm-goalie-nervous | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You are in your crease before the puck drops. Your hands feel light. Your chest feels tight. Your heart is up in your throat.
_(pause)_
3. Feel what your body does. Shallow breath. Tight shoulders. I am not ready for this.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Come back to your breath. Come back to right now.
_(pause)_
6. Being nervous is energy, not danger. Let it sharpen you. Set your depth, quiet your hands, and track the first puck all the way in.
_(pause)_
### Hockey · Goalie · get-hit
<!-- slug: hm-goalie-get-hit | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. There is traffic in your crease. A body comes through. You take the contact. You lose the puck.
_(pause)_
3. Feel what your body does. Wind out of your lungs. Heat in your chest. I am going to get run again.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That contact is over. Breathe, get set, and find the puck again.
_(pause)_
6. Stay square on the next screen. Stay big. Track the puck.
_(pause)_
7. Speak the truth. You got hit. It is not your identity. Reset and go again.
_(pause)_
### Hockey · Goalie · start-slow
<!-- slug: hm-goalie-start-slow | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. First period is half over. The puck has felt small. You have been late on a shot or two. Nothing is coming easy.
_(pause)_
3. Feel what your body does. Tight in your glove hand. Shoulders up. I am not in this game.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The slow start is over. Build the game from this next shot.
_(pause)_
6. Active feet. Stay big. Track the puck all the way in.
_(pause)_
7. Speak the truth. You are not the last shot. You are not the last goal. Reset your depth, find the puck, and meet the next one.
_(pause)_
### Hockey · Goalie · first-goal-against
<!-- slug: hm-goalie-first-goal-against | file: components/pregame/audio/clips.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The puck is in the back of your net. The other team celebrates behind you. You fish it out of the mesh. You skate to the top of your crease.
_(pause)_
3. Feel what your body does. Stomach drop. Heat in your chest. I should have had that.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That goal is over. Come back to the next puck.
_(pause)_
6. Don't over-commit on the next shot. Stay patient. Let it come to you.
_(pause)_
7. They scored first. The game is still in front of you.
_(pause)_
## Full-Session Cells (legacy, not used in compositional path)

### Hockey · Forward · missed-chance (full session)
<!-- slug: session-forward-missed-chance | file: components/pregame/audio/session-forward-missed-chance.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. You see the play.
_(pause)_
17. Three hard strides into the play.
_(pause)_
18. Your eyes are up. You shoulder check.
_(pause)_
19. Take the puck and make the simple, strong play.
_(pause)_
20. Get back hard on the change.
_(pause)_
21. See yourself win a puck race along the wall.
_(pause)_
22. You get there first, get low, take the body.
_(pause)_
23. You make a play. Drive inside, hard to the net. Shoot, and score.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your teammate has the puck. It turns over. You backcheck harder than everyone else and stop the goal.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You are alone in the slot. The pass finds your tape. You shoot. It rings off the post.
_(pause)_
28. Feel what your body does. Stomach drop. Heat in your face. I should have buried that.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Speak the truth. Your mistake is real. It is not your identity. Reset and go again.
_(pause)_
32. When the moment hits, come back to what is true.
_(pause)_
33. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
34. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
35. You are secure. Now play from victory.
### Hockey · Forward · turnover (full session)
<!-- slug: session-forward-turnover | file: components/pregame/audio/session-forward-turnover.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. You see the play.
_(pause)_
17. Three hard strides into the play.
_(pause)_
18. Your eyes are up. You shoulder check.
_(pause)_
19. Take the puck and make the simple, strong play.
_(pause)_
20. Get back hard on the change.
_(pause)_
21. See yourself win a puck race along the wall.
_(pause)_
22. You get there first, get low, take the body.
_(pause)_
23. You make a play. Drive inside, hard to the net. Shoot, and score.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your teammate has the puck. It turns over. You backcheck harder than everyone else and stop the goal.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You have the puck at the offensive blue line. You try to force it through a stick. It pops loose and goes the other way. They are on the rush.
_(pause)_
28. Feel what your body does. Stomach drop. Heat in your face. I just gave them that.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Speak the truth. Your mistake is real. It is not your identity. Reset and go again.
_(pause)_
32. When the moment hits, come back to what is true.
_(pause)_
33. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
34. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
35. You are secure. Now play from victory.
### Hockey · Forward · beaten-wide (full session)
<!-- slug: session-forward-beaten-wide | file: components/pregame/audio/session-forward-beaten-wide.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. You see the play.
_(pause)_
17. Three hard strides into the play.
_(pause)_
18. Your eyes are up. You shoulder check.
_(pause)_
19. Take the puck and make the simple, strong play.
_(pause)_
20. Get back hard on the change.
_(pause)_
21. See yourself win a puck race along the wall.
_(pause)_
22. You get there first, get low, take the body.
_(pause)_
23. You make a play. Drive inside, hard to the net. Shoot, and score.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your teammate has the puck. It turns over. You backcheck harder than everyone else and stop the goal.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You are backchecking through the neutral zone. The winger has the puck and a step. You reach. He goes by you on the outside.
_(pause)_
28. Feel what your body does. Lungs burn. Legs heavy. I am a step slow tonight.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Speak the truth. He had a step. It is not your identity. Reset and go again.
_(pause)_
32. When the moment hits, come back to what is true.
_(pause)_
33. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
34. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
35. You are secure. Now play from victory.
### Hockey · Forward · bad-penalty (full session)
<!-- slug: session-forward-bad-penalty | file: components/pregame/audio/session-forward-bad-penalty.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. You see the play.
_(pause)_
17. Three hard strides into the play.
_(pause)_
18. Your eyes are up. You shoulder check.
_(pause)_
19. Take the puck and make the simple, strong play.
_(pause)_
20. Get back hard on the change.
_(pause)_
21. See yourself win a puck race along the wall.
_(pause)_
22. You get there first, get low, take the body.
_(pause)_
23. You make a play. Drive inside, hard to the net. Shoot, and score.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your teammate has the puck. It turns over. You backcheck harder than everyone else and stop the goal.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You are chasing the play. You reach with your stick. The whistle blows. The ref points at you. Two minutes.
_(pause)_
28. Feel what your body does. Heat in your face. Stomach drop. I just hurt my team.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Don't play scared next shift. Compete the same way.
_(pause)_
32. Speak the truth. You took the penalty. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Hockey · Forward · coach-yells (full session)
<!-- slug: session-forward-coach-yells | file: components/pregame/audio/session-forward-coach-yells.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. You see the play.
_(pause)_
17. Three hard strides into the play.
_(pause)_
18. Your eyes are up. You shoulder check.
_(pause)_
19. Take the puck and make the simple, strong play.
_(pause)_
20. Get back hard on the change.
_(pause)_
21. See yourself win a puck race along the wall.
_(pause)_
22. You get there first, get low, take the body.
_(pause)_
23. You make a play. Drive inside, hard to the net. Shoot, and score.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your teammate has the puck. It turns over. You backcheck harder than everyone else and stop the goal.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You come back to the bench. The coach is loud. Sharp. Maybe your name. Maybe not. The whole bench can hear it.
_(pause)_
28. Feel what your body does. Tight jaw. Heat in your chest. He is going to bury me.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Speak the truth. The coach is loud. It is not your identity. Reset and go again.
_(pause)_
32. When the moment hits, come back to what is true.
_(pause)_
33. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
34. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
35. You are secure. Now play from victory.
### Hockey · Forward · benched (full session)
<!-- slug: session-forward-benched | file: components/pregame/audio/session-forward-benched.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. You see the play.
_(pause)_
17. Three hard strides into the play.
_(pause)_
18. Your eyes are up. You shoulder check.
_(pause)_
19. Take the puck and make the simple, strong play.
_(pause)_
20. Get back hard on the change.
_(pause)_
21. See yourself win a puck race along the wall.
_(pause)_
22. You get there first, get low, take the body.
_(pause)_
23. You make a play. Drive inside, hard to the net. Shoot, and score.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your teammate has the puck. It turns over. You backcheck harder than everyone else and stop the goal.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Two shifts go by. Then three. The line goes out without you. You sit on the bench. The door does not open.
_(pause)_
28. Feel what your body does. Heat in your chest. Tight in your throat. He doesn't trust me.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Speak the truth. You are sitting. It is not your identity. Reset and go again.
_(pause)_
32. When the moment hits, come back to what is true.
_(pause)_
33. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
34. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
35. You are secure. Now play from victory.
### Hockey · Forward · nervous (full session)
<!-- slug: session-forward-nervous | file: components/pregame/audio/session-forward-nervous.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. You see the play.
_(pause)_
17. Three hard strides into the play.
_(pause)_
18. Your eyes are up. You shoulder check.
_(pause)_
19. Take the puck and make the simple, strong play.
_(pause)_
20. Get back hard on the change.
_(pause)_
21. See yourself win a puck race along the wall.
_(pause)_
22. You get there first, get low, take the body.
_(pause)_
23. You make a play. Drive inside, hard to the net. Shoot, and score.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your teammate has the puck. It turns over. You backcheck harder than everyone else and stop the goal.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You are on the bench before the first shift. Your hands feel light. Your legs feel shaky. Your heart is up in your throat.
_(pause)_
28. Feel what your body does. Shallow breath. Stomach tight. I am not ready for this.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Speak the truth. Your body is awake. It is not your identity. Reset and go again.
_(pause)_
32. When the moment hits, come back to what is true.
_(pause)_
33. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
34. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
35. You are secure. Now play from victory.
### Hockey · Forward · get-hit (full session)
<!-- slug: session-forward-get-hit | file: components/pregame/audio/session-forward-get-hit.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. You see the play.
_(pause)_
17. Three hard strides into the play.
_(pause)_
18. Your eyes are up. You shoulder check.
_(pause)_
19. Take the puck and make the simple, strong play.
_(pause)_
20. Get back hard on the change.
_(pause)_
21. See yourself win a puck race along the wall.
_(pause)_
22. You get there first, get low, take the body.
_(pause)_
23. You make a play. Drive inside, hard to the net. Shoot, and score.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your teammate has the puck. It turns over. You backcheck harder than everyone else and stop the goal.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You are on the wall. You don't see him coming. He finishes his check. You hit the boards hard. The puck is gone.
_(pause)_
28. Feel what your body does. Wind out of your lungs. Heat in your shoulder. I should have seen him.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Don't avoid the next puck battle. Get back to the wall.
_(pause)_
32. Speak the truth. You got hit. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Hockey · Forward · start-slow (full session)
<!-- slug: session-forward-start-slow | file: components/pregame/audio/session-forward-start-slow.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. You see the play.
_(pause)_
17. Three hard strides into the play.
_(pause)_
18. Your eyes are up. You shoulder check.
_(pause)_
19. Take the puck and make the simple, strong play.
_(pause)_
20. Get back hard on the change.
_(pause)_
21. See yourself win a puck race along the wall.
_(pause)_
22. You get there first, get low, take the body.
_(pause)_
23. You make a play. Drive inside, hard to the net. Shoot, and score.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your teammate has the puck. It turns over. You backcheck harder than everyone else and stop the goal.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. First period is half over. You have not touched the puck cleanly. Your legs feel a step behind. Nothing is coming easy.
_(pause)_
28. Feel what your body does. Tight grip on the stick. Shoulders up. I am not in this game.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Loose hands. Simple plays. Let the game come to you.
_(pause)_
32. Speak the truth. You started slow. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Hockey · Forward · first-goal-against (full session)
<!-- slug: session-forward-first-goal-against | file: components/pregame/audio/session-forward-first-goal-against.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. You see the play.
_(pause)_
17. Three hard strides into the play.
_(pause)_
18. Your eyes are up. You shoulder check.
_(pause)_
19. Take the puck and make the simple, strong play.
_(pause)_
20. Get back hard on the change.
_(pause)_
21. See yourself win a puck race along the wall.
_(pause)_
22. You get there first, get low, take the body.
_(pause)_
23. You make a play. Drive inside, hard to the net. Shoot, and score.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. Your teammate has the puck. It turns over. You backcheck harder than everyone else and stop the goal.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. The puck goes in behind your goalie. The other bench celebrates. The horn sounds. You skate back to center ice.
_(pause)_
28. Feel what your body does. Stomach drop. Heat in your chest. Here we go again.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Speak the truth. They scored first. It is not your identity. Reset and go again.
_(pause)_
32. When the moment hits, come back to what is true.
_(pause)_
33. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
34. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
35. You are secure. Now play from victory.
### Hockey · Defense · beaten-wide (full session)
<!-- slug: session-defense-beaten-wide | file: components/pregame/audio/session-defense-beaten-wide.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. Get to your gap.
_(pause)_
17. Shoulder check before the puck arrives.
_(pause)_
18. See the play develop.
_(pause)_
19. Hold your line. Make a simple first pass.
_(pause)_
20. Box out at the net front. Go again.
_(pause)_
21. See yourself shoulder check before you pick up the puck.
_(pause)_
22. You retrieve the puck, calm and strong.
_(pause)_
23. You make the first pass, clean and on the tape.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. You hold your gap, you stay between the man and the net, and you box out in front.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You are back in your zone. The puck carrier comes wide. He has speed. You lose the angle. He has a step on you.
_(pause)_
28. Feel what your body does. Stomach drop. Burn in your chest. I lost my gap.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Stay loose. Don't back up. Hold your gap.
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
### Hockey · Defense · turnover (full session)
<!-- slug: session-defense-turnover | file: components/pregame/audio/session-defense-turnover.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. Get to your gap.
_(pause)_
17. Shoulder check before the puck arrives.
_(pause)_
18. See the play develop.
_(pause)_
19. Hold your line. Make a simple first pass.
_(pause)_
20. Box out at the net front. Go again.
_(pause)_
21. See yourself shoulder check before you pick up the puck.
_(pause)_
22. You retrieve the puck, calm and strong.
_(pause)_
23. You make the first pass, clean and on the tape.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. You hold your gap, you stay between the man and the net, and you box out in front.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You retrieve the puck behind your net. You try to make the pass through the slot. It hits a stick. The other team has it in front.
_(pause)_
28. Feel what your body does. Stomach drop. Heat in your face. I just put my goalie in a bad spot.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Next breakout, simple and strong. Off the glass if it's there.
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
### Hockey · Defense · missed-chance (full session)
<!-- slug: session-defense-missed-chance | file: components/pregame/audio/session-defense-missed-chance.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. Get to your gap.
_(pause)_
17. Shoulder check before the puck arrives.
_(pause)_
18. See the play develop.
_(pause)_
19. Hold your line. Make a simple first pass.
_(pause)_
20. Box out at the net front. Go again.
_(pause)_
21. See yourself shoulder check before you pick up the puck.
_(pause)_
22. You retrieve the puck, calm and strong.
_(pause)_
23. You make the first pass, clean and on the tape.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. You hold your gap, you stay between the man and the net, and you box out in front.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You walk the blue line. The lane opens. You step in and shoot. It misses the net wide.
_(pause)_
28. Feel what your body does. Stomach drop. Heat in your face. I should have hit the net.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Speak the truth. You missed the net. It is not your identity. Reset and go again.
_(pause)_
32. When the moment hits, come back to what is true.
_(pause)_
33. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
34. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
35. You are secure. Now play from victory.
### Hockey · Defense · bad-penalty (full session)
<!-- slug: session-defense-bad-penalty | file: components/pregame/audio/session-defense-bad-penalty.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. Get to your gap.
_(pause)_
17. Shoulder check before the puck arrives.
_(pause)_
18. See the play develop.
_(pause)_
19. Hold your line. Make a simple first pass.
_(pause)_
20. Box out at the net front. Go again.
_(pause)_
21. See yourself shoulder check before you pick up the puck.
_(pause)_
22. You retrieve the puck, calm and strong.
_(pause)_
23. You make the first pass, clean and on the tape.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. You hold your gap, you stay between the man and the net, and you box out in front.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. The puck carrier cuts inside. You bring your stick up. The whistle blows. The ref points at you. Two minutes.
_(pause)_
28. Feel what your body does. Heat in your face. Tight in your chest. I just put us down a man.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Don't ease up next shift. Play your gap the same way.
_(pause)_
32. Speak the truth. You took the penalty. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Hockey · Defense · coach-yells (full session)
<!-- slug: session-defense-coach-yells | file: components/pregame/audio/session-defense-coach-yells.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. Get to your gap.
_(pause)_
17. Shoulder check before the puck arrives.
_(pause)_
18. See the play develop.
_(pause)_
19. Hold your line. Make a simple first pass.
_(pause)_
20. Box out at the net front. Go again.
_(pause)_
21. See yourself shoulder check before you pick up the puck.
_(pause)_
22. You retrieve the puck, calm and strong.
_(pause)_
23. You make the first pass, clean and on the tape.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. You hold your gap, you stay between the man and the net, and you box out in front.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You come off the ice. The coach is loud. Sharp. Maybe your name. Maybe not. The whole bench can hear it.
_(pause)_
28. Feel what your body does. Tight jaw. Heat in your chest. He doesn't trust me back there.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Speak the truth. The coach is loud. It is not your identity. Reset and go again.
_(pause)_
32. When the moment hits, come back to what is true.
_(pause)_
33. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
34. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
35. You are secure. Now play from victory.
### Hockey · Defense · benched (full session)
<!-- slug: session-defense-benched | file: components/pregame/audio/session-defense-benched.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. Get to your gap.
_(pause)_
17. Shoulder check before the puck arrives.
_(pause)_
18. See the play develop.
_(pause)_
19. Hold your line. Make a simple first pass.
_(pause)_
20. Box out at the net front. Go again.
_(pause)_
21. See yourself shoulder check before you pick up the puck.
_(pause)_
22. You retrieve the puck, calm and strong.
_(pause)_
23. You make the first pass, clean and on the tape.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. You hold your gap, you stay between the man and the net, and you box out in front.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. Your partner goes out with someone else. Then again. You sit on the bench. The door does not open.
_(pause)_
28. Feel what your body does. Heat in your chest. Tight in your throat. He doesn't trust me.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Speak the truth. You are sitting. It is not your identity. Reset and go again.
_(pause)_
32. When the moment hits, come back to what is true.
_(pause)_
33. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
34. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
35. You are secure. Now play from victory.
### Hockey · Defense · nervous (full session)
<!-- slug: session-defense-nervous | file: components/pregame/audio/session-defense-nervous.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. Get to your gap.
_(pause)_
17. Shoulder check before the puck arrives.
_(pause)_
18. See the play develop.
_(pause)_
19. Hold your line. Make a simple first pass.
_(pause)_
20. Box out at the net front. Go again.
_(pause)_
21. See yourself shoulder check before you pick up the puck.
_(pause)_
22. You retrieve the puck, calm and strong.
_(pause)_
23. You make the first pass, clean and on the tape.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. You hold your gap, you stay between the man and the net, and you box out in front.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You are on the bench before the first shift. Your legs feel heavy. Your hands feel light. Your heart is up in your throat.
_(pause)_
28. Feel what your body does. Shallow breath. Stomach tight. I am going to get exposed out there.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Speak the truth. Your body is awake. It is not your identity. Reset and go again.
_(pause)_
32. When the moment hits, come back to what is true.
_(pause)_
33. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
34. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
35. You are secure. Now play from victory.
### Hockey · Defense · get-hit (full session)
<!-- slug: session-defense-get-hit | file: components/pregame/audio/session-defense-get-hit.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. Get to your gap.
_(pause)_
17. Shoulder check before the puck arrives.
_(pause)_
18. See the play develop.
_(pause)_
19. Hold your line. Make a simple first pass.
_(pause)_
20. Box out at the net front. Go again.
_(pause)_
21. See yourself shoulder check before you pick up the puck.
_(pause)_
22. You retrieve the puck, calm and strong.
_(pause)_
23. You make the first pass, clean and on the tape.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. You hold your gap, you stay between the man and the net, and you box out in front.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. You are back for the puck. You don't see him coming. He finishes his check. You hit the boards hard. The puck is gone.
_(pause)_
28. Feel what your body does. Wind out of your lungs. Heat in your shoulder. I should have shoulder checked.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Don't rim it soft next time. Make the strong play.
_(pause)_
32. Speak the truth. You got hit. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Hockey · Defense · start-slow (full session)
<!-- slug: session-defense-start-slow | file: components/pregame/audio/session-defense-start-slow.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. Get to your gap.
_(pause)_
17. Shoulder check before the puck arrives.
_(pause)_
18. See the play develop.
_(pause)_
19. Hold your line. Make a simple first pass.
_(pause)_
20. Box out at the net front. Go again.
_(pause)_
21. See yourself shoulder check before you pick up the puck.
_(pause)_
22. You retrieve the puck, calm and strong.
_(pause)_
23. You make the first pass, clean and on the tape.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. You hold your gap, you stay between the man and the net, and you box out in front.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. First period is half over. Your gap has been late. Your passes have been off. Nothing is coming easy.
_(pause)_
28. Feel what your body does. Tight grip on the stick. Shoulders up. I am behind out there.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Skate first. Stick on the puck. Simple breakouts.
_(pause)_
32. Speak the truth. You started slow. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Hockey · Defense · first-goal-against (full session)
<!-- slug: session-defense-first-goal-against | file: components/pregame/audio/session-defense-first-goal-against.ts -->

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
8. Keep your eyes closed. See yourself running onto the ice.
_(pause)_
9. You smell the ice, the zamboni.
_(pause)_
10. Hear the skates carving in warmup.
_(pause)_
11. You feel your edges. Feel your gloves.
_(pause)_
12. Feel your stick.
_(pause)_
13. Feel the weight of your helmet.
_(pause)_
14. You tell yourself, You belong here.
_(pause)_
15. Now visualize that your line is called.
_(pause)_
16. You hop the boards. Get to your gap.
_(pause)_
17. Shoulder check before the puck arrives.
_(pause)_
18. See the play develop.
_(pause)_
19. Hold your line. Make a simple first pass.
_(pause)_
20. Box out at the net front. Go again.
_(pause)_
21. See yourself shoulder check before you pick up the puck.
_(pause)_
22. You retrieve the puck, calm and strong.
_(pause)_
23. You make the first pass, clean and on the tape.
_(pause)_
24. Now visualize the next play.
_(pause)_
25. You hold your gap, you stay between the man and the net, and you box out in front.
_(pause)_
26. Now rehearse the hard moment.
_(pause)_
27. The puck goes in behind your goalie. The other bench celebrates. The horn sounds. You skate back to center ice.
_(pause)_
28. Feel what your body does. Stomach drop. Heat in your chest. We couldn't hold them.
_(pause)_
29. Now the reset. Return to your anchor.
_(pause)_
30. The last play is over. Reset and play the play you're in.
_(pause)_
31. Stay loose. Hold your gap. Play the next shift, not the last one.
_(pause)_
32. Speak the truth. They scored first. It is not your identity. Reset and go again.
_(pause)_
33. When the moment hits, come back to what is true.
_(pause)_
34. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
35. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
36. You are secure. Now play from victory.
### Hockey · Goalie · coach-yells (full session)
<!-- slug: session-goalie-coach-yells | file: components/pregame/audio/session-goalie-coach-yells.ts -->

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
8. See the crease.
_(pause)_
9. The blue paint under your skates.
_(pause)_
10. The crossbar behind your head.
_(pause)_
11. Hear the anthem fade out.
_(pause)_
12. Feel your glove.
_(pause)_
13. Feel your blocker.
_(pause)_
14. Feel the weight of your pads, settled and ready.
_(pause)_
15. You belong here.
_(pause)_
16. Puck drops.
_(pause)_
17. Set your feet in the crease.
_(pause)_
18. Square to the shooter.
_(pause)_
19. Track the puck all the way in.
_(pause)_
20. Make the first save, calm and big.
_(pause)_
21. Control the rebound. Cover, or steer it to the corner.
_(pause)_
22. Reset. Eyes back to the puck.
_(pause)_
23. Set your feet.
_(pause)_
24. Track the puck.
_(pause)_
25. Control the rebound.
_(pause)_
26. Reset after traffic.
_(pause)_
27. Next shot only.
_(pause)_
28. Now rehearse the hard moment.
_(pause)_
29. A goal goes in. The whistle blows. You hear your coach from the bench. Loud. Sharp. Maybe your name. Maybe not. The whole rink can hear it.
_(pause)_
30. Feel what your body does. Tight jaw. Heat in your chest. He does not trust me.
_(pause)_
31. Now the reset. Return to your anchor.
_(pause)_
32. The last play is over. Reset and play the play you're in.
_(pause)_
33. Speak the truth. The coach is loud. It is not your identity. Reset and go again.
_(pause)_
34. When the moment hits, come back to what is true.
_(pause)_
35. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
36. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
37. You are secure. Now play from victory.
### Hockey · Goalie · turnover (full session)
<!-- slug: session-goalie-turnover | file: components/pregame/audio/session-goalie-turnover.ts -->

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
8. See the crease.
_(pause)_
9. The blue paint under your skates.
_(pause)_
10. The crossbar behind your head.
_(pause)_
11. Hear the anthem fade out.
_(pause)_
12. Feel your glove.
_(pause)_
13. Feel your blocker.
_(pause)_
14. Feel the weight of your pads, settled and ready.
_(pause)_
15. You belong here.
_(pause)_
16. Puck drops.
_(pause)_
17. Set your feet in the crease.
_(pause)_
18. Square to the shooter.
_(pause)_
19. Track the puck all the way in.
_(pause)_
20. Make the first save, calm and big.
_(pause)_
21. Control the rebound. Cover, or steer it to the corner.
_(pause)_
22. Reset. Eyes back to the puck.
_(pause)_
23. Set your feet.
_(pause)_
24. Track the puck.
_(pause)_
25. Control the rebound.
_(pause)_
26. Reset after traffic.
_(pause)_
27. Next shot only.
_(pause)_
28. Now rehearse the hard moment.
_(pause)_
29. You are behind the net with the puck. You try to move it up the wall. It hits a forechecker's stick. The other team has it on top of your crease.
_(pause)_
30. Feel what your body does. Stomach drop. Heat in your face. I just handed them a goal.
_(pause)_
31. Now the reset. Return to your anchor.
_(pause)_
32. The last play is over. Reset and play the play you're in.
_(pause)_
33. Don't freeze next time. Play the puck strong or leave it.
_(pause)_
34. Speak the truth. Your mistake is real. It is not your identity. Reset and go again.
_(pause)_
35. When the moment hits, come back to what is true.
_(pause)_
36. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
37. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
38. You are secure. Now play from victory.
### Hockey · Goalie · missed-chance (full session)
<!-- slug: session-goalie-missed-chance | file: components/pregame/audio/session-goalie-missed-chance.ts -->

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
8. See the crease.
_(pause)_
9. The blue paint under your skates.
_(pause)_
10. The crossbar behind your head.
_(pause)_
11. Hear the anthem fade out.
_(pause)_
12. Feel your glove.
_(pause)_
13. Feel your blocker.
_(pause)_
14. Feel the weight of your pads, settled and ready.
_(pause)_
15. You belong here.
_(pause)_
16. Puck drops.
_(pause)_
17. Set your feet in the crease.
_(pause)_
18. Square to the shooter.
_(pause)_
19. Track the puck all the way in.
_(pause)_
20. Make the first save, calm and big.
_(pause)_
21. Control the rebound. Cover, or steer it to the corner.
_(pause)_
22. Reset. Eyes back to the puck.
_(pause)_
23. Set your feet.
_(pause)_
24. Track the puck.
_(pause)_
25. Control the rebound.
_(pause)_
26. Reset after traffic.
_(pause)_
27. Next shot only.
_(pause)_
28. Now rehearse the hard moment.
_(pause)_
29. The puck carrier comes in alone. You step out for the poke check. Your stick catches nothing. He walks around you.
_(pause)_
30. Feel what your body does. Stomach drop. Heat in your face. I should have stayed in my net.
_(pause)_
31. Now the reset. Return to your anchor.
_(pause)_
32. The last play is over. Reset and play the play you're in.
_(pause)_
33. Speak the truth. You missed the puck. It is not your identity. Reset and go again.
_(pause)_
34. When the moment hits, come back to what is true.
_(pause)_
35. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
36. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
37. You are secure. Now play from victory.
### Hockey · Goalie · beaten-wide (full session)
<!-- slug: session-goalie-beaten-wide | file: components/pregame/audio/session-goalie-beaten-wide.ts -->

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
8. See the crease.
_(pause)_
9. The blue paint under your skates.
_(pause)_
10. The crossbar behind your head.
_(pause)_
11. Hear the anthem fade out.
_(pause)_
12. Feel your glove.
_(pause)_
13. Feel your blocker.
_(pause)_
14. Feel the weight of your pads, settled and ready.
_(pause)_
15. You belong here.
_(pause)_
16. Puck drops.
_(pause)_
17. Set your feet in the crease.
_(pause)_
18. Square to the shooter.
_(pause)_
19. Track the puck all the way in.
_(pause)_
20. Make the first save, calm and big.
_(pause)_
21. Control the rebound. Cover, or steer it to the corner.
_(pause)_
22. Reset. Eyes back to the puck.
_(pause)_
23. Set your feet.
_(pause)_
24. Track the puck.
_(pause)_
25. Control the rebound.
_(pause)_
26. Reset after traffic.
_(pause)_
27. Next shot only.
_(pause)_
28. Now rehearse the hard moment.
_(pause)_
29. The pass goes from one side of the crease to the other. You push across. You are late. The puck is in the back of the net before you set.
_(pause)_
30. Feel what your body does. Stomach drop. Heat in your chest. I was too slow across.
_(pause)_
31. Now the reset. Return to your anchor.
_(pause)_
32. The last play is over. Reset and play the play you're in.
_(pause)_
33. Don't cheat the next pass. Stay square. Trust your push.
_(pause)_
34. Speak the truth. He beat you across. It is not your identity. Reset and go again.
_(pause)_
35. When the moment hits, come back to what is true.
_(pause)_
36. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
37. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
38. You are secure. Now play from victory.
### Hockey · Goalie · bad-penalty (full session)
<!-- slug: session-goalie-bad-penalty | file: components/pregame/audio/session-goalie-bad-penalty.ts -->

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
8. See the crease.
_(pause)_
9. The blue paint under your skates.
_(pause)_
10. The crossbar behind your head.
_(pause)_
11. Hear the anthem fade out.
_(pause)_
12. Feel your glove.
_(pause)_
13. Feel your blocker.
_(pause)_
14. Feel the weight of your pads, settled and ready.
_(pause)_
15. You belong here.
_(pause)_
16. Puck drops.
_(pause)_
17. Set your feet in the crease.
_(pause)_
18. Square to the shooter.
_(pause)_
19. Track the puck all the way in.
_(pause)_
20. Make the first save, calm and big.
_(pause)_
21. Control the rebound. Cover, or steer it to the corner.
_(pause)_
22. Reset. Eyes back to the puck.
_(pause)_
23. Set your feet.
_(pause)_
24. Track the puck.
_(pause)_
25. Control the rebound.
_(pause)_
26. Reset after traffic.
_(pause)_
27. Next shot only.
_(pause)_
28. Now rehearse the hard moment.
_(pause)_
29. The puck is in your feet. You flip it over the glass. The whistle blows. The ref points at you. Two minutes for delay of game.
_(pause)_
30. Feel what your body does. Heat in your face. Tight in your chest. I just hurt my team.
_(pause)_
31. Now the reset. Return to your anchor.
_(pause)_
32. The last play is over. Reset and play the play you're in.
_(pause)_
33. Don't play tight on the PK. Trust your reads.
_(pause)_
34. Speak the truth. You took the penalty. It is not your identity. Reset and go again.
_(pause)_
35. When the moment hits, come back to what is true.
_(pause)_
36. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
37. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
38. You are secure. Now play from victory.
### Hockey · Goalie · pulled (full session)
<!-- slug: session-goalie-pulled | file: components/pregame/audio/session-goalie-pulled.ts -->

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
8. See the crease.
_(pause)_
9. The blue paint under your skates.
_(pause)_
10. The crossbar behind your head.
_(pause)_
11. Hear the anthem fade out.
_(pause)_
12. Feel your glove.
_(pause)_
13. Feel your blocker.
_(pause)_
14. Feel the weight of your pads, settled and ready.
_(pause)_
15. You belong here.
_(pause)_
16. Puck drops.
_(pause)_
17. Set your feet in the crease.
_(pause)_
18. Square to the shooter.
_(pause)_
19. Track the puck all the way in.
_(pause)_
20. Make the first save, calm and big.
_(pause)_
21. Control the rebound. Cover, or steer it to the corner.
_(pause)_
22. Reset. Eyes back to the puck.
_(pause)_
23. Set your feet.
_(pause)_
24. Track the puck.
_(pause)_
25. Control the rebound.
_(pause)_
26. Reset after traffic.
_(pause)_
27. Next shot only.
_(pause)_
28. Now rehearse the hard moment.
_(pause)_
29. The coach taps your backup. You skate to the bench. You sit at the end. The game keeps going without you.
_(pause)_
30. Feel what your body does. Heat in your chest. Tight in your throat. He gave up on me.
_(pause)_
31. Now the reset. Return to your anchor.
_(pause)_
32. The last play is over. Reset and play the play you're in.
_(pause)_
33. Speak the truth. You got pulled. It is not your identity. Reset and go again.
_(pause)_
34. When the moment hits, come back to what is true.
_(pause)_
35. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
36. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
37. You are secure. Now play from victory.
### Hockey · Goalie · nervous (full session)
<!-- slug: session-goalie-nervous | file: components/pregame/audio/session-goalie-nervous.ts -->

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
8. See the crease.
_(pause)_
9. The blue paint under your skates.
_(pause)_
10. The crossbar behind your head.
_(pause)_
11. Hear the anthem fade out.
_(pause)_
12. Feel your glove.
_(pause)_
13. Feel your blocker.
_(pause)_
14. Feel the weight of your pads, settled and ready.
_(pause)_
15. You belong here.
_(pause)_
16. Puck drops.
_(pause)_
17. Set your feet in the crease.
_(pause)_
18. Square to the shooter.
_(pause)_
19. Track the puck all the way in.
_(pause)_
20. Make the first save, calm and big.
_(pause)_
21. Control the rebound. Cover, or steer it to the corner.
_(pause)_
22. Reset. Eyes back to the puck.
_(pause)_
23. Set your feet.
_(pause)_
24. Track the puck.
_(pause)_
25. Control the rebound.
_(pause)_
26. Reset after traffic.
_(pause)_
27. Next shot only.
_(pause)_
28. Now rehearse the hard moment.
_(pause)_
29. You are in your crease before the puck drops. Your hands feel light. Your chest feels tight. Your heart is up in your throat.
_(pause)_
30. Feel what your body does. Shallow breath. Tight shoulders. I am not ready for this.
_(pause)_
31. Now the reset. Return to your anchor.
_(pause)_
32. The last play is over. Reset and play the play you're in.
_(pause)_
33. Speak the truth. Your body is awake. It is not your identity. Reset and go again.
_(pause)_
34. When the moment hits, come back to what is true.
_(pause)_
35. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
36. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
37. You are secure. Now play from victory.
### Hockey · Goalie · get-hit (full session)
<!-- slug: session-goalie-get-hit | file: components/pregame/audio/session-goalie-get-hit.ts -->

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
8. See the crease.
_(pause)_
9. The blue paint under your skates.
_(pause)_
10. The crossbar behind your head.
_(pause)_
11. Hear the anthem fade out.
_(pause)_
12. Feel your glove.
_(pause)_
13. Feel your blocker.
_(pause)_
14. Feel the weight of your pads, settled and ready.
_(pause)_
15. You belong here.
_(pause)_
16. Puck drops.
_(pause)_
17. Set your feet in the crease.
_(pause)_
18. Square to the shooter.
_(pause)_
19. Track the puck all the way in.
_(pause)_
20. Make the first save, calm and big.
_(pause)_
21. Control the rebound. Cover, or steer it to the corner.
_(pause)_
22. Reset. Eyes back to the puck.
_(pause)_
23. Set your feet.
_(pause)_
24. Track the puck.
_(pause)_
25. Control the rebound.
_(pause)_
26. Reset after traffic.
_(pause)_
27. Next shot only.
_(pause)_
28. Now rehearse the hard moment.
_(pause)_
29. There is traffic in your crease. A body comes through. You take the contact. You lose the puck.
_(pause)_
30. Feel what your body does. Wind out of your lungs. Heat in your chest. I am going to get run again.
_(pause)_
31. Now the reset. Return to your anchor.
_(pause)_
32. The last play is over. Reset and play the play you're in.
_(pause)_
33. Don't flinch on the next screen. Stay big. Track the puck.
_(pause)_
34. Speak the truth. You got hit. It is not your identity. Reset and go again.
_(pause)_
35. When the moment hits, come back to what is true.
_(pause)_
36. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
37. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
38. You are secure. Now play from victory.
### Hockey · Goalie · start-slow (full session)
<!-- slug: session-goalie-start-slow | file: components/pregame/audio/session-goalie-start-slow.ts -->

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
8. See the crease.
_(pause)_
9. The blue paint under your skates.
_(pause)_
10. The crossbar behind your head.
_(pause)_
11. Hear the anthem fade out.
_(pause)_
12. Feel your glove.
_(pause)_
13. Feel your blocker.
_(pause)_
14. Feel the weight of your pads, settled and ready.
_(pause)_
15. You belong here.
_(pause)_
16. Puck drops.
_(pause)_
17. Set your feet in the crease.
_(pause)_
18. Square to the shooter.
_(pause)_
19. Track the puck all the way in.
_(pause)_
20. Make the first save, calm and big.
_(pause)_
21. Control the rebound. Cover, or steer it to the corner.
_(pause)_
22. Reset. Eyes back to the puck.
_(pause)_
23. Set your feet.
_(pause)_
24. Track the puck.
_(pause)_
25. Control the rebound.
_(pause)_
26. Reset after traffic.
_(pause)_
27. Next shot only.
_(pause)_
28. Now rehearse the hard moment.
_(pause)_
29. First period is half over. The puck has felt small. You have been late on a shot or two. Nothing is coming easy.
_(pause)_
30. Feel what your body does. Tight grip on the stick. Shoulders up. I am not in this game.
_(pause)_
31. Now the reset. Return to your anchor.
_(pause)_
32. The last play is over. Reset and play the play you're in.
_(pause)_
33. Active feet. Stay big. Track the puck all the way in.
_(pause)_
34. Speak the truth. You started slow. It is not your identity. Reset and go again.
_(pause)_
35. When the moment hits, come back to what is true.
_(pause)_
36. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
37. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
38. You are secure. Now play from victory.
### Hockey · Goalie · first-goal-against (full session)
<!-- slug: session-goalie-first-goal-against | file: components/pregame/audio/session-goalie-first-goal-against.ts -->

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
8. See the crease.
_(pause)_
9. The blue paint under your skates.
_(pause)_
10. The crossbar behind your head.
_(pause)_
11. Hear the anthem fade out.
_(pause)_
12. Feel your glove.
_(pause)_
13. Feel your blocker.
_(pause)_
14. Feel the weight of your pads, settled and ready.
_(pause)_
15. You belong here.
_(pause)_
16. Puck drops.
_(pause)_
17. Set your feet in the crease.
_(pause)_
18. Square to the shooter.
_(pause)_
19. Track the puck all the way in.
_(pause)_
20. Make the first save, calm and big.
_(pause)_
21. Control the rebound. Cover, or steer it to the corner.
_(pause)_
22. Reset. Eyes back to the puck.
_(pause)_
23. Set your feet.
_(pause)_
24. Track the puck.
_(pause)_
25. Control the rebound.
_(pause)_
26. Reset after traffic.
_(pause)_
27. Next shot only.
_(pause)_
28. Now rehearse the hard moment.
_(pause)_
29. The puck is in the back of your net. The other team celebrates behind you. You fish it out of the mesh. You skate to the top of your crease.
_(pause)_
30. Feel what your body does. Stomach drop. Heat in your chest. I should have had that.
_(pause)_
31. Now the reset. Return to your anchor.
_(pause)_
32. The last play is over. Reset and play the play you're in.
_(pause)_
33. Don't over-commit on the next shot. Stay patient. Let it come to you.
_(pause)_
34. Speak the truth. The puck got past you. It is not your identity. Reset and go again.
_(pause)_
35. When the moment hits, come back to what is true.
_(pause)_
36. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
37. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
38. You are secure. Now play from victory.
