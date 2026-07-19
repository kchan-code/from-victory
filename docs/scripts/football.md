# From Victory · Script Book · Football

> **DORMANT** — no audio rendered yet for this sport. Edit freely; the first audio render is the go-live pass.

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

## Text-mode fallback (Football)

These lines appear on-screen in text mode (no audio). Tokens like `{{role}}`, `{{adversity}}`, etc. are substituted at runtime — edit them as-is.

<!-- audioScript#0 | eyebrow: Identity -->
1. ${SCRIPTURE_REF} — ${SCRIPTURE_TEXT} You are not playing to become enough. In Christ, you are already loved. Receive that before you compete.

<!-- audioScript#1 | eyebrow: Settle -->
2. Sit tall. Long exhale. Lead your body back to ready. Four counts in. Six counts out. Let your shoulders drop.

<!-- audioScript#2 | eyebrow: See the field -->
3. See the field under the lights. Hear the crowd, the chatter in the huddle, cleats biting the turf. Feel your helmet, the pads settling on your shoulders. You belong here. You are ready.

<!-- audioScript#3 | eyebrow: Your first snap -->
4. The ball is about to snap. First play. Eyes up, read your keys, do your job full speed, finish to the whistle. Recover. Next play.

<!-- audioScript#4 | eyebrow: Play your position · {{role}} -->
5. {{roleScenes}}

<!-- audioScript#5 | eyebrow: If this happens -->
6. {{adversity}} See it. Feel it. Breathe. Speak truth. Take the next faithful action. Your mistake is real. It is not your identity.

<!-- audioScript#6 | eyebrow: Coach yourself -->
7. {{selfTalk}} When pressure hits, return here. Your anchor: {{anchor}}. Your cue word: {{cueWord}}.

<!-- audioScript#7 | eyebrow: Send-off -->
8. Lord, help me compete with courage, humility, and joy. Help me play the snap in front of me, respond well to a bad one, and remember that my worth is secure in You. Amen. Play from victory.
---

## Audio Clips

## VIZ Clips (role)

### Football · QB · VIZ
<!-- slug: viz-ftb-qb | file: components/pregame/audio/clips-football.ts -->

1. Keep your eyes closed. See yourself walking out of the locker room toward the field.
_(pause: 1s)_
2. You hear your cleats on the concrete — sharp, even — then the soft give of turf under your feet.
_(pause: 1s)_
3. Hear the crowd settling in, the low hum under the Friday-night lights.
_(pause: 2s)_
4. You snap your chinstrap and feel it tighten under your jaw.
_(pause: 2.2s)_
5. Feel the weight of your pads settle square on your shoulders.
_(pause: 2.2s)_
6. Feel the cool air on your face mask, your jersey loose across your chest.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You break the huddle and walk it to the line. Slow breath. The offense is yours.
_(pause: 0.25s)_
9. You get under center, eyes up, reading the defense — you've seen this look a thousand times.
_(pause: 2s)_
10. Snap. You drop clean, feet set, and step into the pocket.
_(pause: 2s)_
11. Your first read is open. You don't hesitate — you trust it and let it go.
_(pause: 2s)_
12. The ball comes off your hand with conviction, tight spiral, right on the numbers.
_(pause: 2s)_
13. Caught, first down. You jog back to the huddle in command. One play at a time — that's how it goes all night.
_(pause: 2s)_
14. See yourself lead the huddle.
_(pause: 2s)_
15. Eyes up, read it out. You trust your first read and throw it with conviction — every snap, all night.
_(pause: 2s)_
16. You protect the football, and when a play breaks down, you don't carry it. Next play, you lead them — calm voice, clear eyes, back to the line.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. Third and long, the blitz is coming, the whole stadium loud. You don't panic. You read it pre-snap, slide the protection, take your drop, and find the open man underneath — first down, still in control.
_(pause: 2s)_
### Football · RB · VIZ
<!-- slug: viz-ftb-rb | file: components/pregame/audio/clips-football.ts -->

1. Keep your eyes closed. See yourself walking out of the locker room toward the field.
_(pause: 1s)_
2. You hear your cleats on the concrete — sharp, even — then the soft give of turf under your feet.
_(pause: 1s)_
3. Hear the crowd settling in, the low hum under the Friday-night lights.
_(pause: 2s)_
4. You snap your chinstrap and feel it tighten under your jaw.
_(pause: 2.2s)_
5. Feel the weight of your pads settle square on your shoulders.
_(pause: 2.2s)_
6. Feel the cool air on your face mask, your jersey loose across your chest.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You set in the backfield, eyes on the front. Slow breath. You see the whole field.
_(pause: 0.25s)_
9. Snap. The handoff is clean — you secure it, two hands, high and tight.
_(pause: 2s)_
10. You read your blocks, press the hole, and let it open in front of you.
_(pause: 2s)_
11. You plant and cut downhill, hitting it fast, getting north and south.
_(pause: 2s)_
12. You break into the second level, lower your pad level, and finish the run forward.
_(pause: 2s)_
13. Five extra yards after contact. You pop up, flip the ball to the ref, and jog back. One carry at a time — that's how it goes all night.
_(pause: 2s)_
14. See yourself run downhill, ball secure.
_(pause: 2s)_
15. You read your blocks and hit the hole fast — two hands, high and tight, every carry.
_(pause: 2s)_
16. You finish every run forward, and when they need you in protection, you pick up the blitz — square up, strike inside, and stay between the rusher and your quarterback.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. Short yardage, everyone in the box, the game on the line. You don't dance. You take the handoff, secure it tight, press the hole, and finish forward through the line — first down, chains move.
_(pause: 2s)_
### Football · WR · VIZ
<!-- slug: viz-ftb-wr | file: components/pregame/audio/clips-football.ts -->

1. Keep your eyes closed. See yourself walking out of the locker room toward the field.
_(pause: 1s)_
2. You hear your cleats on the concrete — sharp, even — then the soft give of turf under your feet.
_(pause: 1s)_
3. Hear the crowd settling in, the low hum under the Friday-night lights.
_(pause: 2s)_
4. You snap your chinstrap and feel it tighten under your jaw.
_(pause: 2.2s)_
5. Feel the weight of your pads settle square on your shoulders.
_(pause: 2.2s)_
6. Feel the cool air on your face mask, your jersey loose across your chest.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You line up wide, check the formation and the corner's leverage. Slow breath. This route is yours.
_(pause: 0.25s)_
9. Snap. You explode off the line and win at the release, clean and fast.
_(pause: 2s)_
10. You stem upfield, sell it vertical, then stick your foot and break — full speed, no drifting.
_(pause: 2s)_
11. You come open. The ball is in the air, and you look it all the way in.
_(pause: 2s)_
12. Snatch it out of the air with your hands, tuck it away, and turn upfield.
_(pause: 2s)_
13. You get vertical and finish the run. First down. You hand the ball back and reset. One route at a time — that's how it goes all night.
_(pause: 2s)_
14. See yourself run it, catch it, finish.
_(pause: 2s)_
15. You win at the line and run the route full speed — no tipping it off, every rep the same.
_(pause: 2s)_
16. You look it all the way in, catch it, tuck it, and go. Next route, you find the soft spot and stay open.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. Press coverage, the corner jamming you at the line, the throw coming your way. You don't get rattled. You beat the jam with your hands, stack him, run through the catch point, and look it in — chains move, your ball.
_(pause: 2s)_
### Football · OL · VIZ
<!-- slug: viz-ftb-ol | file: components/pregame/audio/clips-football.ts -->

1. Keep your eyes closed. See yourself walking out of the locker room toward the field.
_(pause: 1s)_
2. You hear your cleats on the concrete — sharp, even — then the soft give of turf under your feet.
_(pause: 1s)_
3. Hear the crowd settling in, the low hum under the Friday-night lights.
_(pause: 2s)_
4. You snap your chinstrap and feel it tighten under your jaw.
_(pause: 2.2s)_
5. Feel the weight of your pads settle square on your shoulders.
_(pause: 2.2s)_
6. Feel the cool air on your face mask, your jersey loose across your chest.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You get in your stance, hand in the dirt, eyes on your man. Slow breath. This is your phone booth.
_(pause: 0.25s)_
9. You hear the cadence and know your assignment cold — you've run this block a thousand times.
_(pause: 2s)_
10. Snap. You fire off low and hard, set your feet, and punch with both hands inside.
_(pause: 2s)_
11. You get your hat across, take leverage, and move your man off the ball.
_(pause: 2s)_
12. You feel the back run off your hip, and you drive your feet, finishing to the whistle.
_(pause: 2s)_
13. The whistle blows. You let go, help a teammate up, and walk back. One rep at a time — that's how it goes all night.
_(pause: 2s)_
14. See yourself protect the man behind you.
_(pause: 2s)_
15. You set your feet and punch, you know your assignment, and you move people off the ball — every snap, the same.
_(pause: 2s)_
16. You finish to the whistle, and you play it as five as one — all five hats moving together, no gaps, no one left free.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. Third and long, they're bringing pressure off the edge, the crowd loud. You don't get beat. You set quick, anchor strong, keep your eyes inside-out, and pass off the stunt clean — pocket stays firm, the throw gets out.
_(pause: 2s)_
### Football · DL · VIZ
<!-- slug: viz-ftb-dl | file: components/pregame/audio/clips-football.ts -->

1. Keep your eyes closed. See yourself walking out of the locker room toward the field.
_(pause: 1s)_
2. You hear your cleats on the concrete — sharp, even — then the soft give of turf under your feet.
_(pause: 1s)_
3. Hear the crowd settling in, the low hum under the Friday-night lights.
_(pause: 2s)_
4. You snap your chinstrap and feel it tighten under your jaw.
_(pause: 2.2s)_
5. Feel the weight of your pads settle square on your shoulders.
_(pause: 2.2s)_
6. Feel the cool air on your face mask, your jersey loose across your chest.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You get in your stance across the ball, eyes on the football. Slow breath. You live in their backfield.
_(pause: 0.25s)_
9. You key the ball, coiled and ready — the second it moves, you're gone.
_(pause: 2s)_
10. Snap. You get off first, low and fast, beating the lineman off the ball.
_(pause: 2s)_
11. You work your hands, shed the block, and stay square in your gap.
_(pause: 2s)_
12. You find the ball, run to it, and arrive with everyone — full motor to the whistle.
_(pause: 2s)_
13. Play dead. You peel off, get back to the huddle, and reset. One rep at a time — that's how it goes all night.
_(pause: 2s)_
14. See yourself get off and win the rep.
_(pause: 2s)_
15. First off the ball, you beat your man and stay in your gap — disciplined, every snap.
_(pause: 2s)_
16. You run to the football, and you bring it every snap — full motor, never a play off, chasing it down sideline to sideline.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. Third and long, everyone knows you are rushing the passer. You get off on the ball, attack half a man, win with your hands, and close the pocket — the quarterback has nowhere clean to step.
_(pause: 2s)_
### Football · LB · VIZ
<!-- slug: viz-ftb-lb | file: components/pregame/audio/clips-football.ts -->

1. Keep your eyes closed. See yourself walking out of the locker room toward the field.
_(pause: 1s)_
2. You hear your cleats on the concrete — sharp, even — then the soft give of turf under your feet.
_(pause: 1s)_
3. Hear the crowd settling in, the low hum under the Friday-night lights.
_(pause: 2s)_
4. You snap your chinstrap and feel it tighten under your jaw.
_(pause: 2.2s)_
5. Feel the weight of your pads settle square on your shoulders.
_(pause: 2.2s)_
6. Feel the cool air on your face mask, your jersey loose across your chest.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You walk into the box and get everyone lined up. Slow breath. You're the quarterback of this defense.
_(pause: 0.25s)_
9. You read your keys — the guard, the backfield — diagnosing it before the snap.
_(pause: 2s)_
10. Snap. It's run. You see your key pull and trigger downhill, no hesitation.
_(pause: 2s)_
11. You fill your fit, take on the blocker, and keep your shoulders square.
_(pause: 2s)_
12. You shed, find the back, and run through the tackle — wrap up, drive your feet, finish.
_(pause: 2s)_
13. Stop for a short gain. You pop up, signal the call, and reset the front. One rep at a time — that's how it goes all night.
_(pause: 2s)_
14. See yourself be the quarterback of the D.
_(pause: 2s)_
15. You read your keys and fill your fit downhill, and on pass you cover with your eyes — never fooled, every snap.
_(pause: 2s)_
16. Before the snap you get everyone lined up, and when the ball's loose you run and hit — square, wrapped, finished.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. They show run and try to fool you with play action, the crowd roaring. You stay disciplined. You read your key, see the pull is a fake, drop into your zone, eyes on the quarterback, and break on the throw — pass broken up, third down stop.
_(pause: 2s)_
### Football · DB · VIZ
<!-- slug: viz-ftb-db | file: components/pregame/audio/clips-football.ts -->

1. Keep your eyes closed. See yourself walking out of the locker room toward the field.
_(pause: 1s)_
2. You hear your cleats on the concrete — sharp, even — then the soft give of turf under your feet.
_(pause: 1s)_
3. Hear the crowd settling in, the low hum under the Friday-night lights.
_(pause: 2s)_
4. You snap your chinstrap and feel it tighten under your jaw.
_(pause: 2.2s)_
5. Feel the weight of your pads settle square on your shoulders.
_(pause: 2.2s)_
6. Feel the cool air on your face mask, your jersey loose across your chest.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You line up over your man, press alignment, eyes on his hips. Slow breath. This is your island.
_(pause: 0.25s)_
9. You trust your technique — patient feet, eyes on the man, not the noise.
_(pause: 2s)_
10. Snap. He releases. You mirror him, stay in phase, hip to hip down the field.
_(pause: 2s)_
11. He breaks. You plant, drive on the ball, and close the cushion.
_(pause: 2s)_
12. The ball comes. You find it late through his hands, and you break it up clean.
_(pause: 2s)_
13. Incomplete. You flip your hips, jog back to the line, and lock in again. One rep at a time — that's how it goes all night.
_(pause: 2s)_
14. See yourself lock down your island.
_(pause: 2s)_
15. You trust your technique, keep your eyes on your man, and drive on the ball — patient, in phase, every snap.
_(pause: 2s)_
16. And if one gets caught on you, short memory — next rep, you're right back on him. When it's run, you come up and make the tackle in space, square and sure.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. Their best receiver, the game on the line, the throw going up to your side. You don't gamble. You stay in phase, eyes back to find it, high-point the ball at the catch point, and knock it away — incomplete, your island holds.
_(pause: 2s)_
## Hard Moment Clips

### Football · DL · beat
<!-- slug: hm-ftb-dl-beat | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The tackle reaches you on the snap, gets his head across, and hooks you inside. He seals you out of your gap. The back hits the lane you were supposed to own, clean, and he's into the second level.
_(pause: 1.5s)_
3. Your hands drop off his pads and your feet get stuck in the block. You stand there a beat watching the run hit your gap. The thought hits: he owned me on that one.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That rep is over. One block he won doesn't decide the next one.
_(pause: 2s)_
6. Next snap, beat him off the ball. Get your hands inside first, lock him out, and hold your gap. Don't let him get his head across — strike, control, play your edge.
_(pause: 2s)_
### Football · DL · film-mistake
<!-- slug: hm-ftb-dl-film-mistake | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You crashed inside chasing the ball instead of staying home on the edge. The quarterback pulled it and kept it around the side you vacated. Now it's Monday, the room is dark, and the film stops on the gap you abandoned.
_(pause: 1.5s)_
3. Your jaw tightens in the dark room and your eyes stay locked on the frozen frame as it rewinds. The thought hits: how did I leave that edge.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That snap is graded and gone. Film is where you learn the edge, not where you serve a sentence for it.
_(pause: 2s)_
6. Here's the fix. Edge is yours — stay home, squeeze, keep contain. Let the ball come to you instead of chasing it inside. Trust your run fit and make the QB give it up.
_(pause: 2s)_
### Football · DL · big-play
<!-- slug: hm-ftb-dl-big-play | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You get reached and washed down the line. The edge isn't set, and the back sees it — he hits the crease and he's gone. A five-yard gain turns into sixty, all the way to the house, and it started right where you were.
_(pause: 1.5s)_
3. Your hands hang heavy and your feet feel rooted to the spot he sealed you, and you watch the back cross the goal line. The thought hits: I gave up that gap.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That run is over. It does not get the next series. Eleven play defense, not just you — get to the huddle and breathe.
_(pause: 2s)_
6. Next snap, set the edge first. Get off the ball, hands inside, and force it back to your help. Hold your gap — they need your job done, not a hero.
_(pause: 2s)_
### Football · DL · benched
<!-- slug: hm-ftb-dl-benched | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The rotation pulls you and sends in the fresh body. You stand on the sideline and watch the defense get a stop without you on the field. The word is rotation — but you're starting to wonder if it's becoming demotion.
_(pause: 1.5s)_
3. Your arms fold across your chest and your grip tightens on the facemask of the helmet you're not wearing. The thought hits: the rotation went by me twice.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The bench has your body for a series. It does not have your mind. Stay in it — your number may come back fast.
_(pause: 2s)_
6. When you go back in, win your first rep. Don't make up for the bench in one play — get off the ball, hands inside, hold your gap. One clean snap earns the next one.
_(pause: 2s)_
### Football · DL · nervous
<!-- slug: hm-ftb-dl-nervous | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. First series, and you're lined up across from a tackle a full year older. You're not sure your get-off is enough to beat him to the spot tonight. The ball's about to be snapped and the doubt is loud.
_(pause: 1.5s)_
3. Your down hand presses hard into the turf and your weight rocks too far forward in your stance. The thought hits: what if my first step is a tick too slow against him.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you. Take one slow breath, settle into your stance, and lock your eyes on the ball.
_(pause: 2s)_
6. Your edge is your get-off — so use it. Key the ball, not the count, and fire on first movement. Be first off the line and you're in his pads before he's set.
_(pause: 2s)_
### Football · DL · big-hit
<!-- slug: hm-ftb-dl-big-hit | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. They down-block and double you, the tackle and guard working together to move you off the spot. You fight to stay square as the pile closes around the gap.
_(pause: 1.5s)_
3. Your base starts to give and your feet slide under the pressure. The thought hits: I cannot let two of them move me again.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That double-team is over. Reset your base and play the next one with your technique.
_(pause: 2s)_
6. If something feels off, speak up.
_(pause: 1.2s)_
7. Get your hands inside first, drop your base, keep your feet driving, and stay square in the gap.
_(pause: 2s)_
### Football · DL · start-slow
<!-- slug: hm-ftb-dl-start-slow | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Your first few snaps, your get-off is late. You're a tick behind the count all series — reacting to the ball instead of jumping it. You haven't felt the backfield once. The tackle is getting set before you even move.
_(pause: 1.5s)_
3. Your steps feel heavy and a half-beat slow, and you're pressing your stance to make up the jump. The thought hits: I can't find my get-off tonight.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Those snaps are over and there's a whole game left. A slow start is just a start, not the night.
_(pause: 2s)_
6. Get your get-off back the simple way. Eyes on the ball, weight loaded, fire on first movement — first step, not first thought. Be quick off the line and you're back in the backfield.
_(pause: 2s)_
### Football · DL · fall-behind-early
<!-- slug: hm-ftb-dl-fall-behind-early | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The offense is going up-tempo, snapping it fast, and they're gashing you while you're down. No time to sub, no time to catch your breath. Your motor is the only thing keeping you in the play, snap after snap.
_(pause: 1.5s)_
3. Your chest heaves between snaps and your hands find your knees on the walk back to the ball. The thought hits: they're rolling and I've got nothing left.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That run is over. Get one stop, then get one more. You don't have to stop the whole drive — you have to win this one snap.
_(pause: 2s)_
6. Get to the line, one breath, eyes on the ball. Fire off and play your one gap hard — full motor, this snap only.
_(pause: 2s)_
### Football · DL · trench-battle
<!-- slug: hm-ftb-dl-trench-battle | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Third and long. Everyone in the stadium knows you're rushing the passer. You go one-on-one with the tackle — and he stones you. Square, anchored, no push. The quarterback steps up clean and delivers, no pressure off the edge.
_(pause: 1.5s)_
3. Your hands stall against his chest and your rush dies on contact. The thought hits: he stoned me with the whole stadium knowing the call.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That rush is over. One pass-rush he won doesn't decide the next one.
_(pause: 2s)_
6. Next obvious passing down, beat him with a plan, not just effort. Set up the speed, then counter inside — get him leaning and take the edge he gives you. One move to a counter, hands and get-off.
_(pause: 2s)_
### Football · LB · turnover
<!-- slug: hm-ftb-lb-turnover | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You drop into the flat and the quarterback throws it right to you. The pick is in front of you, the field wide open, a pick-six waiting. The ball hits your hands — and you drop the gift. The takeaway that flips the game, gone.
_(pause: 1.5s)_
3. Your hands sting and your shoulders drop as you stare at the grass where the ball fell. The thought hits: I had the whole game right there.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That play is over. A dropped pick doesn't get the next snap.
_(pause: 2s)_
6. The takeaway is still out there. Read your keys, break on the ball, and when the next one comes near you, attack it and squeeze it away — finish the play.
_(pause: 2s)_
### Football · LB · beat
<!-- slug: hm-ftb-lb-beat | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're matched on the slot, a faster guy than you. He runs the option route, breaks one way, and you bite. By the time you flip your hips, he's wide open in the space you were supposed to cover. Easy completion.
_(pause: 1.5s)_
3. Your legs feel a step behind and you reach late as the ball arrives. The thought hits: I bit, and he was gone.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He won that route. He does not own the next one. Clear it and get your eyes back to your keys.
_(pause: 2s)_
6. Next time in coverage, don't guess — read his stem and stay patient. Keep leverage, drive on the break instead of jumping it, and let his quickness work into your help.
_(pause: 2s)_
### Football · LB · film-mistake
<!-- slug: hm-ftb-lb-film-mistake | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You filled the wrong gap. The back read it and bounced to the one you left open. It's the film room now, the clip frozen on you out of your fit, the long run unspooling behind your mistake.
_(pause: 1.5s)_
3. Your stomach drops in the dark room as the clip rewinds to you out of your fit. The thought hits: how did I blow that fit.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The grade is in and that fit is behind you. You watch the miss to fix the read, not to relive it.
_(pause: 2s)_
6. Here's the fix. Read your keys, trust your fit, fill your gap with your eyes — see the back, hit the right hole, and be downhill and decisive when the run shows.
_(pause: 2s)_
### Football · LB · big-play
<!-- slug: hm-ftb-lb-big-play | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You busted the coverage and lost the back out of the backfield. He slips into the open field, the ball drops in, and there's no one between him and the end zone. You watch him run it all the way in. The walk back is the loneliest one in football.
_(pause: 1.5s)_
3. Your legs feel like lead on the long walk back and your eyes keep pulling to the scoreboard. The thought hits: that one was on me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That touchdown is over. One play does not lose a game. Eleven play defense, not just you — get to the huddle and breathe.
_(pause: 2s)_
6. Next snap, lock your eyes on your keys and carry your man all the way through. Communicate the call, stay on top of the back, do your one job — clean coverage, not a hero.
_(pause: 2s)_
### Football · LB · benched
<!-- slug: hm-ftb-lb-benched | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. It's a passing down and the defense goes to nickel. The coach trusts the other backer in coverage and takes you off the field. You stand next to him on the sideline, watching your snaps shrink down each obvious passing situation.
_(pause: 1.5s)_
3. You pace a step behind the coach, eyes on the nickel taking your snaps. The thought hits: the nickel went out there without me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The bench has your body for this package. It does not have your mind. Stay in it — early downs are coming.
_(pause: 2s)_
6. When you're back in on early downs, win your fit. Don't prove the whole thing in one play — read your keys, fill downhill, make the tackle. One clean snap earns more snaps.
_(pause: 2s)_
### Football · LB · nervous
<!-- slug: hm-ftb-lb-nervous | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're the MIKE. You get the call from the sideline and the whole defense is yours to line up. You're pointing guys into place, checking the formation, and the weight of running all eleven sits on you before the first snap.
_(pause: 1.5s)_
3. Your eyes dart across the formation and the call sticks in your throat as the play clock winds down. The thought hits: what if I get us lined up wrong with everyone watching me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you. Take one slow breath, settle, and trust the prep you put in all week.
_(pause: 2s)_
6. You don't have to run a perfect defense — make the call and play your fit. Get the front set, communicate loud, then key the ball and trigger downhill. Make the call, then go play fast.
_(pause: 2s)_
### Football · LB · big-hit
<!-- slug: hm-ftb-lb-big-hit | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Power play. The guard pulls into your gap, and your read tells you to trigger downhill and take on the block so the ball has to turn.
_(pause: 1.5s)_
3. Your feet hesitate for half a beat as the guard closes, and your body wants to slip around the block instead of owning the fit. The thought hits: beat him to the spot and play it clean.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That collision is over. Reset your eyes and trust the fit you trained.
_(pause: 2s)_
6. If something feels off, speak up.
_(pause: 1.2s)_
7. See the pull, trigger downhill, strike with your hands, keep your outside arm free, and force the ball to your help.
_(pause: 2s)_
### Football · LB · start-slow
<!-- slug: hm-ftb-lb-start-slow | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Early in the game, you're a step slow reading your keys. You're reacting to the play instead of triggering on it — seeing it late, arriving late. The offense is moving the ball right at your indecision.
_(pause: 1.5s)_
3. Your feet feel heavy and unsure, and you're thinking your way through the read instead of playing it. The thought hits: I can't read it fast enough tonight.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Those snaps are over and the game is long. A slow read early is just a start, not the night.
_(pause: 2s)_
6. Stop guessing and get back to your keys. Read the guard, read the back, and trigger downhill the second it shows. See it, trust it, play fast — react to the read, not the doubt.
_(pause: 2s)_
### Football · LB · fall-behind-early
<!-- slug: hm-ftb-lb-fall-behind-early | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The offense is rolling and the defense is pressing — heads down, voices sharp, assignments getting muddy in the huddle. You're the MIKE, and everyone is waiting for your call.
_(pause: 1.5s)_
3. Your jaw is tight and your eyes keep darting to the scoreboard. The huddle is loud and scattered around you. The thought hits: I can't get them settled.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Shrink it down to one snap. You don't have to fix the whole game in the huddle — you lead the next play. Steady your voice and make the call.
_(pause: 2s)_
6. Make the call clear and loud, get everyone's eyes, then play your own fit fast. One clean snap gives the defense something solid to build on.
_(pause: 2s)_
### Football · LB · trench-battle
<!-- slug: hm-ftb-lb-trench-battle | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The pulling guard kicks you out, the tackle climbs and seals you in — you get caught in the wash between two blocks. The back runs through the exact crease your fit was supposed to close. You never got off the block to make the play.
_(pause: 1.5s)_
3. Your hands are pinned in the block and your feet stall in the wash. You feel the back blow past behind you. The thought hits: they washed me right out of the play.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That rep is over. One block that sealed you doesn't decide the next one — clear it and get your eyes back to your keys.
_(pause: 2s)_
6. Next time the blocks come, beat them with your eyes and your hands. Read the puller, take on the kick-out square, keep your outside arm free to spill it — strike, shed, and find the ball.
_(pause: 2s)_
### Football · DB · turnover
<!-- slug: hm-ftb-db-turnover | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The ball's in the air and it's yours. You've read it, you've broken on it, the interception is right there to end the drive. And it goes straight through your hands. The takeaway you'll see on film all week, dropped.
_(pause: 1.5s)_
3. Your hands sting and your head drops. You're staring at the turf where it fell. The thought hits: I had the pick and I let it go.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That play is over. Short memory — the next rep comes whether you're ready or not, so let this one go.
_(pause: 2s)_
6. The takeaway is still out there. Trust your read, break on the next ball, and when it's in the air, attack it and look it all the way in.
_(pause: 2s)_
### Football · DB · beat
<!-- slug: hm-ftb-db-beat | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. One step is all it takes. The receiver gets on top of you, half a stride, and the ball's already in the air over your head. There is no help — corner is football's goalie, alone on the island, and the whole stadium is watching the ball drop in behind you.
_(pause: 1.5s)_
3. Your legs are burning as you chase, and your eyes are stuck on the ball sailing over you. The thought hits: everyone just saw me get beat.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Short memory is the corner's whole game. The play is over the instant the whistle blows.
_(pause: 2s)_
6. Next snap, get back on your island and trust your technique. Patient feet at the line, eyes on his hips, stay on top and don't peek. Play your leverage and run with him.
_(pause: 2s)_
### Football · DB · film-mistake
<!-- slug: hm-ftb-db-film-mistake | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You played the route wrong and passed off a man you should've carried. The film room is dark, and the clip freezes on the receiver running free through the zone you blew, the open grass where you should've been.
_(pause: 1.5s)_
3. Your face flushes in the dark room as the clip catches the receiver running free through your zone. The thought hits: how did I blow that coverage.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That coverage is on tape and it's done. The room is where you sharpen your eyes, not where you sit in the mistake.
_(pause: 2s)_
6. Here's the fix. Know your help, communicate the call, carry your man through your zone with your eyes on his route. Pass him off clean or run with him — no in-between.
_(pause: 2s)_
### Football · DB · big-play
<!-- slug: hm-ftb-db-big-play | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You got beat, the safety couldn't get over in time, and it's six the other way. A bust at corner is loud — there's not much behind you. You watch him cross the goal line and the scoreboard flips.
_(pause: 1.5s)_
3. Your legs still burn from the chase and your eyes drop to the turf as the number flips. The thought hits: that's six the other way, and it went through me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That touchdown is over. One play does not lose a game. Eleven play defense, not just you — get back to your island and breathe.
_(pause: 2s)_
6. Next snap, trust your technique and play your leverage. Patient feet, eyes on his hips, stay on top and break on the ball. Do your one job — tight coverage, not a gamble.
_(pause: 2s)_
### Football · DB · benched
<!-- slug: hm-ftb-db-benched | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You got beat early and the coaches lost confidence. Now they're rolling the coverage to your side or sitting you down, and the quarterback isn't even testing you anymore. The ball goes everywhere but your way.
_(pause: 1.5s)_
3. Your hands settle on your hips and your jaw works under the chinstrap between snaps. The thought hits: another series gone and I'm still on the sideline.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The bench has your body for a series. It does not have your mind. Stay locked in, watch their splits, and be ready when they call your number.
_(pause: 2s)_
6. When you're back on your island, win the first rep clean. Don't gamble to win trust back in one play — patient feet, tight leverage, eyes on his hips. One clean snap earns the next ball your way.
_(pause: 2s)_
### Football · DB · nervous
<!-- slug: hm-ftb-db-nervous | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're matched on their number one all night, and you know he's faster than you. You're standing on the island before the first snap, and the only thought is getting beat deep with everyone watching the ball go over your head.
_(pause: 1.5s)_
3. Your feet feel restless at the line and your eyes stay glued to his hips as he settles across from you. The thought hits: what if he runs right by me on the first play.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you. Settle your feet and lock your eyes on his hips.
_(pause: 2s)_
6. You don't have to be faster than him — play your technique. Patient feet at the line, stay on top, eyes on his hips, trust your leverage and run with him stride for stride.
_(pause: 2s)_
### Football · DB · big-hit
<!-- slug: hm-ftb-db-big-hit | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The run breaks to the perimeter and you are the force player in space. The back is coming fast, and your job is to close the angle, keep leverage, and make a sound tackle.
_(pause: 1.5s)_
3. Your feet stall as the space disappears and your body wants to wait for someone else to arrive. The thought hits: close the space without losing control.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That open-field rep is over. Do not let it make you wait on the next one.
_(pause: 2s)_
6. If something feels off, speak up.
_(pause: 1.2s)_
7. Trigger downhill, break down under control, keep leverage to your help, wrap, and run your feet through the tackle.
_(pause: 2s)_
### Football · DB · start-slow
<!-- slug: hm-ftb-db-start-slow | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. They came right at you the first two series and completed both. Now you're playing tentative, sitting back off the line, afraid to get beat — the worst way for a corner to play.
_(pause: 1.5s)_
3. Your feet are flat and hesitant at the line, and you catch yourself guessing instead of trusting. The thought hits: two series, two completions, both right at me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Those two snaps are over. Short memory — the next ball comes whether you're ready or not, so let them go.
_(pause: 2s)_
6. Play on the balls of your feet, not your heels. Get back in his face, patient feet, eyes on his hips, trust your technique. Play forward, not scared.
_(pause: 2s)_
### Football · DB · fall-behind-early
<!-- slug: hm-ftb-db-fall-behind-early | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The offense is up and throwing on you every down. The deep shots keep coming, one after another, testing your island over and over. One more beat-deep and it's a blowout. The pressure sits on every snap.
_(pause: 1.5s)_
3. Your chest is tight before the snap and your legs feel heavy with every deep ball coming your way. The thought hits: every snap it's another deep shot at me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Shrink it down to one snap. You don't have to stop the whole comeback — you cover this one rep. Settle your feet and lock onto his hips.
_(pause: 2s)_
6. The deep shot is coming — so be ready for it. Patient feet, stay on top, eyes on his hips, don't peek at the quarterback. Cover this one route clean, then the next one.
_(pause: 2s)_
### Football · DB · trench-battle
<!-- slug: hm-ftb-db-trench-battle | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The offense runs outside and the receiver gets into your chest before you can set the edge. He turns your shoulders, the back cuts outside of you, and the run spills down the sideline through the space you were supposed to close.
_(pause: 1.5s)_
3. Your outside foot gets pinned and you feel the back race past your leverage. The thought hits: I lost the edge and gave him the sideline.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That edge is gone. One block does not decide the next run-support rep — reset your alignment and get your eyes back to your key.
_(pause: 2s)_
6. Next perimeter run, trigger sooner, strike the blocker with your hands, keep your outside arm free, and force the ball back inside to your help.
_(pause: 2s)_
### Football · QB · pick
<!-- slug: hm-ftb-qb-pick | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You drop back and let it go over the middle. The ball hangs. The safety reads it the whole way, jumps the route, and picks it clean. The sideline goes quiet, and both phones just caught it.
_(pause: 1.5s)_
3. Your stomach drops as he runs it back and your jaw locks. The thought hits: I put that one right on him.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That throw is over and it's on the scoreboard. Defense is on the field, and the next series is clean. Let it go.
_(pause: 2s)_
6. Don't try to win it all back on the next throw — the hero ball is exactly how you throw a second one. Take the easy completion, get the offense moving, and do your job one snap at a time.
_(pause: 2s)_
### Football · QB · beat
<!-- slug: hm-ftb-qb-beat | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. They disguised it. The look you read pre-snap rotated the second you snapped it. You stared down your first read, and the corner you never accounted for broke on the ball. They had you the whole way.
_(pause: 1.5s)_
3. Your face goes hot and you keep replaying the coverage you missed. The thought hits: they're a step ahead of me out here.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He won that disguise. He does not own the next snap. Getting fooled once is information, not a verdict.
_(pause: 2s)_
6. Now use it. Read the safeties before the snap, take what they give you, and work through your progression instead of locking on. Let the read come to you.
_(pause: 2s)_
### Football · QB · film-mistake
<!-- slug: hm-ftb-qb-film-mistake | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Monday film. The room goes quiet. Coach freezes the frame and clicks back to it twice — your receiver wide open on the back side, and you never saw him because you locked onto the wrong half of the field.
_(pause: 1.5s)_
3. Your throat goes dry in the dark room and you feel every eye on the frozen frame. The thought hits: I missed the read, and everyone can see it.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That rep is on tape and the grade is in. Film makes the miss visible so the next read can be better — sit up and look at it straight.
_(pause: 2s)_
6. Stay with the clip. Mark the read, work the full field on the next install, and carry that correction into the next rep.
_(pause: 2s)_
### Football · QB · big-play
<!-- slug: hm-ftb-qb-big-play | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're climbing the pocket and never feel the edge rusher. He rakes the ball loose, it hits the turf, and their end scoops it and runs it sixty yards the other way. Score off you. A two-possession swing with your name on it.
_(pause: 1.5s)_
3. Your chest goes tight and your hand keeps closing on a ball that's already sixty yards the other way. The thought hits: I never felt him coming off the edge.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That play is over and it's on the board. It does not get the next series too. Points come in drives, not in one hero throw.
_(pause: 2s)_
6. When you get the ball back, get the offense breathing. Take the checkdown, move the chains, feel the rush and get it out clean. Stack one good play, then the next.
_(pause: 2s)_
### Football · QB · pulled
<!-- slug: hm-ftb-qb-pulled | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Coach taps the backup and sends him in mid-series. You jog off, and now you're standing on the sideline holding your helmet, watching the offense move the ball without you under center.
_(pause: 1.5s)_
3. Your throat tightens and your eyes drop to the grass. The thought hits: I want my reps back.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The bench has your body for a series. It does not have your mind. Get on the headset, watch the coverages, and stay in it with your guys.
_(pause: 2s)_
6. Don't sulk and don't press to prove a point when you get back in. Read what the defense is doing, log it, and be ready to lead the next drive cold — stay ready for the one snap when it comes.
_(pause: 2s)_
### Football · QB · nervous
<!-- slug: hm-ftb-qb-nervous | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Pregame. The whole offense rides on you tonight. Every eye in town is on the guy under center, and your hands are already sweating through warmups before a single snap.
_(pause: 1.5s)_
3. Your palms are damp on the laces. Your knee bounces in the stance. The thought hits: what if I come out flat with all of them watching.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you. Feel your cleats in the grass and step into your first read.
_(pause: 2s)_
6. First snap, take the easy completion. Clean footwork, good read, hit the underneath throw and let the game settle you.
_(pause: 2s)_
### Football · QB · big-hit
<!-- slug: hm-ftb-qb-big-hit | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The pocket collapses faster than you read it. You set to throw and take a clean shot from the blind side you never saw coming. You hit the turf hard, and the rush is suddenly loud in your mind.
_(pause: 1.5s)_
3. Your breath comes fast as you get up, and your eyes want to leave the coverage and find the rush. The thought hits: I do not want to take that shot again.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That sack is over. Do not let the rush take your eyes off the next throw.
_(pause: 2s)_
6. If something feels off, speak up.
_(pause: 1.2s)_
7. Trust your protection, climb the pocket, keep your eyes downfield, and deliver on time.
_(pause: 2s)_
### Football · QB · start-slow
<!-- slug: hm-ftb-qb-start-slow | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Three-and-out. Then another three-and-out. You've opened flat — no rhythm, no completion you can build on — and the crowd is restless before you've even moved the ball.
_(pause: 1.5s)_
3. Your grip squeezes the ball too hard. Your tempo races ahead of the play. The thought hits: I have to flip this on the next drive before it buries us.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Two quiet drives are a start, not the game. A slow open is just an open.
_(pause: 2s)_
6. Next drive, stop hunting the big throw. Slow your feet, take the completion underneath, get one first down, then the next.
_(pause: 2s)_
### Football · QB · fall-behind-early
<!-- slug: hm-ftb-qb-fall-behind-early | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're down fourteen before you've even found the field. The sideline gets quiet, and every eye turns to you to be the one who single-handedly brings it all back.
_(pause: 1.5s)_
3. Your jaw locks behind the facemask. Your eyes keep darting to the scoreboard. The thought hits: I have to make this all up right now, by myself.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That run is over. Fourteen doesn't come back on one play — get one first down, then the next. Bring your focus down to just this snap.
_(pause: 2s)_
6. Next snap, take what they give you, trust your guys to make plays, and move the chains. The hero ball is the wrong call when you're chasing.
_(pause: 2s)_
### Football · RB · fumble
<!-- slug: hm-ftb-rb-fumble | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You break into the open field and reach to extend the run. The ball comes loose, bounces once, and they fall on it. The one thing your coach pulls guys for, and it just happened in front of him.
_(pause: 1.5s)_
3. Your stomach drops as you scramble for a ball that's already gone. Your eyes find your coach on the sideline. The thought hits: I have to earn that carry back.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That carry is over and it's on the board. It does not get the rest of your game. There's more football and your next carry is coming.
_(pause: 2s)_
6. When the ball's back in your hands, high and tight — five points of pressure, covered through the whole run. Don't run scared and don't press. Hit the hole and finish forward.
_(pause: 2s)_
### Football · RB · beat
<!-- slug: hm-ftb-rb-beat | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. It's your block to make. The linebacker comes clean off the edge because you whiffed it, and your quarterback eats the sack. You know the film room is going to land right on you for that one.
_(pause: 1.5s)_
3. Your ears go hot watching your QB climb up. Your fists clench at your sides. The thought hits: I let him down.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That rep is over. A missed block is one rep, not a verdict on your game. Lock into the next assignment.
_(pause: 2s)_
6. Next pickup, read the front, square up the blitz, get your feet set and deliver a strike. Do your job and finish the block.
_(pause: 2s)_
### Football · RB · film-mistake
<!-- slug: hm-ftb-rb-film-mistake | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Film session. Coach freezes the frame. The play was designed to bounce outside, you cut it back, ran straight into your own blocker, and left a wide-open touchdown on the field. Frozen there for the room.
_(pause: 1.5s)_
3. Your neck goes hot and you slide down in the seat as the clip freezes on you. The thought hits: I ran us right out of a touchdown.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That cutback is graded and behind you. The clip is a teacher, not a verdict — look at it straight and take the coaching.
_(pause: 2s)_
6. Next install, see the design, trust your read, and hit the right hole. Carry that correction into the next rep.
_(pause: 2s)_
### Football · RB · big-play
<!-- slug: hm-ftb-rb-big-play | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Fourth quarter, you're winning, and they punch the ball out. It hits the turf, their guy scoops it, and runs it back for six. The lead you were protecting just flipped, on a play with your name on it.
_(pause: 1.5s)_
3. Your stomach drops as he crosses the goal line and your eyes lock onto the replay you can't stop running. The thought hits: I coughed up the lead.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That play is over and it's on the board. The game isn't over — there's time on the clock and your offense gets the ball back.
_(pause: 2s)_
6. When you're back in, ball high and tight, five points of pressure. Hit the hole hard, finish every run forward, and protect it — trust the next carry.
_(pause: 2s)_
### Football · RB · benched
<!-- slug: hm-ftb-rb-benched | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The other back catches fire, and the carries start drying up. You stand on the sideline watching your touches — and your tape — go to someone else, series after series.
_(pause: 1.5s)_
3. Your grip tightens on your helmet as he rips off a run, and your eyes drop to the grass. The thought hits: the carries are going somewhere else.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The bench has your body for a series. It does not have your mind. Stay locked in, read the front, and be ready the moment your number comes back.
_(pause: 2s)_
6. Next carry, don't press to prove a point. Hit the hole, protect the ball, finish forward — let one clean rep speak for itself.
_(pause: 2s)_
### Football · RB · nervous
<!-- slug: hm-ftb-rb-nervous | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. First carry is coming. The defense is keying on you all night, the box is loaded, and you can feel yourself gripping the ball too tight before the handoff is even in your gut.
_(pause: 1.5s)_
3. Your hands squeeze the air where the ball will be, and your feet feel heavy in the backfield. The thought hits: what if they stuff me right out of the gate.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you. Feel your feet under you and settle into your stance.
_(pause: 2s)_
6. First touch, take the handoff clean, ball high and tight, read your blocks, and get downhill. You don't have to break a long one to start.
_(pause: 2s)_
### Football · RB · big-hit
<!-- slug: hm-ftb-rb-big-hit | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You hit the hole and the linebacker meets you square. You protect the ball, keep your head up, and finish the run through contact before going down.
_(pause: 1.5s)_
3. Your breath comes fast as you get up, and the next collision is already in your mind. The thought hits: I might pull back on the next carry.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That collision is over. Do not let it make you hesitate on the next carry.
_(pause: 2s)_
6. If something feels off, speak up.
_(pause: 1.2s)_
7. Take the next handoff high and tight, keep your eyes up, hit the crease, and finish forward.
_(pause: 2s)_
### Football · RB · start-slow
<!-- slug: hm-ftb-rb-start-slow | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Stuffed on your first three carries. No creases, nothing open, the line losing the early reps. You start pressing — bouncing runs that should hit inside, instead of trusting the next one.
_(pause: 1.5s)_
3. Your grip tightens on the ball. Your feet get quick and impatient behind the line. The thought hits: I have to break one before they give up on the run.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Three stuffed carries are a start, not the game. Backs wear a defense down.
_(pause: 2s)_
6. Next carry, stop bouncing for the home run. Press the hole, trust your blocks, take the four yards that are there — the crease comes when you stay downhill.
_(pause: 2s)_
### Football · RB · fall-behind-early
<!-- slug: hm-ftb-rb-fall-behind-early | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Down two scores early, and the game script abandons the run. The offense goes pass-heavy, your role shrinks, and you find yourself standing on the sideline watching it happen.
_(pause: 1.5s)_
3. Your chest tightens watching from the grass. Your eyes follow the ball without you in it. The thought hits: the run game just left the plan.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The deficit and the game plan are real, but they don't shrink you. Stay locked in, stay warm — one play swings the script.
_(pause: 2s)_
6. When you're in, run your routes out of the backfield, pick up the blitz clean, and protect your QB. Be reliable and the carries come back.
_(pause: 2s)_
### Football · RB · trench-battle
<!-- slug: hm-ftb-rb-trench-battle | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Fourth-and-one, short-yardage package, the whole stadium knows it's coming to you. You hit the hole and meet the linebacker square — and he stands you straight up, stops you short of the sticks.
_(pause: 1.5s)_
3. Your jaw clamps shut. Your legs feel stopped cold under the pile. The thought hits: I couldn't get one yard when it mattered.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That rep is over. One stop in short yardage is one carry, not the story of your game. Stay ready for the next time they hand it to you there.
_(pause: 2s)_
6. Next short-yardage rep, pad level lower than his, feet churning, run behind your shoulders and fall forward. Win the leverage, not the staredown.
_(pause: 2s)_
### Football · WR · turnover
<!-- slug: hm-ftb-wr-turnover | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You catch the slant clean and turn upfield thinking yards. You never see the safety closing — and he punches the ball out from behind. A catch that became a giveaway, fumbled away in the open field.
_(pause: 1.5s)_
3. Your stomach drops watching them recover it. Heat floods up your neck. The thought hits: I gave it right back.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That play is over and it's on the board. Let the giveaway go.
_(pause: 2s)_
6. Next catch, secure it first, then go. Tuck it high and tight after the grab, get north, and protect it through contact — finish the catch before the run.
_(pause: 2s)_
### Football · WR · beat
<!-- slug: hm-ftb-wr-beat | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The corner gets his hands on you at the line and rides your hip the whole route. You never come open. The QB checks it down to someone else — and on that play, you didn't exist.
_(pause: 1.5s)_
3. Your jaw tightens jogging back to the line. Your hands flex at your sides. The thought hits: he rode my hip the whole route.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He won that rep. He does not own the next one. Reset for the next route.
_(pause: 2s)_
6. Next route, vary your release, get your hands inside his, stem him off the line and stack him at the top. Run it crisp — win your leverage.
_(pause: 2s)_
### Football · WR · film-mistake
<!-- slug: hm-ftb-wr-film-mistake | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Monday film. The room goes quiet, and coach freezes the frame on your drop — the ball right on your hands, your eyes already turned upfield before you looked it in. He clicks back to it twice.
_(pause: 1.5s)_
3. Your stomach knots in the dark room and you drop your eyes from the screen. The thought hits: I looked away before I even had it.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That drop is graded and gone. Film shows you the fix — eyes all the way in — it doesn't sit you in the miss. You've caught ten thousand of these.
_(pause: 2s)_
6. On the next target, watch it all the way into the tuck before you think about running. Look it in, squeeze it, then go — catch first, run second.
_(pause: 2s)_
### Football · WR · big-play
<!-- slug: hm-ftb-wr-big-play | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You've beaten the coverage clean, wide open down the field. The throw is perfect, right in your hands, nobody near you — and you drop the touchdown. The clip everyone is going to replay.
_(pause: 1.5s)_
3. Your hands keep clenching on nothing and your eyes stay on the grass where it bounced. The thought hits: I had that one.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That ball is over and the play is dead. One drop, even a big one, is one rep — it does not get the rest of your game. There's more football, and your number gets called again.
_(pause: 2s)_
6. When it comes back your way, track the ball all the way into the tuck before you think about running. Stay ready for the next target and catch it clean.
_(pause: 2s)_
### Football · WR · benched
<!-- slug: hm-ftb-wr-benched | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. After the drop, the ball stops coming your way. You run great routes into a void — you're open and the quarterback looks somewhere else. Nobody benched you on paper, but the trust is quiet right now.
_(pause: 1.5s)_
3. Your shoulders sink coming back to the huddle uncovered again, and your breath goes short. The thought hits: the ball has stopped coming my way.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Trust goes quiet for a stretch, but it doesn't disappear — it comes back to the guy who keeps getting open. Run the next route like the ball's coming.
_(pause: 2s)_
6. Keep running everything full speed, win at the top of your routes, finish your blocks downfield. Snap off the break, hands ready — the targets come back to guys who keep showing up open.
_(pause: 2s)_
### Football · WR · nervous
<!-- slug: hm-ftb-wr-nervous | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. First target is coming up on the script — the route depends on you. You're standing at the line and all you can think about is your hands, worried about the catch before the ball is even snapped.
_(pause: 1.5s)_
3. Your fingers flex and stretch at your sides, and your eyes keep dropping to your own hands. The thought hits: what if I drop the first one with everyone watching.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you. Feel your feet at the line and lock onto your release.
_(pause: 2s)_
6. Don't think about your hands — let them work. Get off the line clean, run the route crisp, eyes through the ball into the tuck, and catch it first. Trust what you've trained.
_(pause: 2s)_
### Football · WR · big-hit
<!-- slug: hm-ftb-wr-big-hit | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You run the dig into traffic, secure the ball, and take contact as you come through the catch point. The hit is loud, and the next route over the middle is already in your mind.
_(pause: 1.5s)_
3. Your shoulders tighten before the next snap and your eyes want to find the safety instead of the ball. The thought hits: I do not want to take that hit again.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That hit is over. Do not let it pull your eyes off the next ball.
_(pause: 2s)_
6. If something feels off, speak up.
_(pause: 1.2s)_
7. Run the route at full speed, see the ball through the catch, secure it, and get north.
_(pause: 2s)_
### Football · WR · start-slow
<!-- slug: hm-ftb-wr-start-slow | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. No targets through the whole first quarter. You're cold, you've been blocking and decoying, and when your number finally gets called you realize you're not warmed into the game yet.
_(pause: 1.5s)_
3. Your hands feel a step behind and your first step out of the break is heavy. The thought hits: I'm cold, I'm going to botch the one chance I get.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. A quiet quarter is just the game flow, not a verdict on your night. Treat this rep like the first one of the day.
_(pause: 2s)_
6. Run the route full speed, snap it off the break, eyes through the ball all the way in, and catch the simple one to get warm. One clean rep wakes you up.
_(pause: 2s)_
### Football · WR · fall-behind-early
<!-- slug: hm-ftb-wr-fall-behind-early | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Down multiple scores, and the offense goes pass-heavy and desperate. Every throw your way suddenly feels like it has to be a big one, like you have to make a play every single snap.
_(pause: 1.5s)_
3. Your hands grab early and you're already turning to run before you catch it. The thought hits: I have to break a big one right now to get us back.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That deficit doesn't come back on one catch — it comes back in drives, one first down at a time. Bring it down to just this route.
_(pause: 2s)_
6. Don't try to do too much with every ball. Run your route clean, catch it first, then take what the field gives you. Move the chains and let the offense climb back.
_(pause: 2s)_
### Football · WR · trench-battle
<!-- slug: hm-ftb-wr-trench-battle | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Perimeter run, and your job was to seal the corner. The defensive back beats you to the spot, sheds you, and drops your back for a loss. A block nobody films — but the coach grades it.
_(pause: 1.5s)_
3. Your ears go hot watching the tackle behind the line, and your hands are still grabbing at air. The thought hits: I cost my guy the run.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That block is over. One lost rep on the edge is one assignment, not your day. Lock into the next one.
_(pause: 2s)_
6. Next perimeter run, break down under control, get your hat across, stay on your feet and run your feet through the block. Win the leverage and sustain it.
_(pause: 2s)_
### Football · OL · beat
<!-- slug: hm-ftb-ol-beat | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Your guy hits you with a move you watched on tape all week, and you still bite. He's past you with a free run at the quarterback. The one job — keep him clean — and you just failed it in front of everyone.
_(pause: 1.5s)_
3. Your face gets hot turning to watch the pressure, and your hands are still out where he isn't. The thought hits: I got beat clean.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He won that rep. He does not own the next one. Reset your eyes for the next snap.
_(pause: 2s)_
6. Now answer it. Set with patience, hands inside, anchor your base, mirror his feet — you know his move now. Trust your technique and win the next rep clean.
_(pause: 2s)_
### Football · OL · film-mistake
<!-- slug: hm-ftb-ol-film-mistake | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Film. Coach freezes it on the stunt. You and the guard both blocked the same man and left the looper unblocked, and the room watches your quarterback get crushed — on a protection call that was yours.
_(pause: 1.5s)_
3. Your ears burn as the room watches the looper come free, and you know the communication started with you. The thought hits: I missed the call, and everyone saw the result.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The call was missed and it is on tape. Film gives you the correction; it does not define the kind of lineman you are.
_(pause: 2s)_
6. Stay with the clip. Communicate the front, pass off the stunt, take your man, and trust the guard to take his on the next rep.
_(pause: 2s)_
### Football · OL · big-play
<!-- slug: hm-ftb-ol-big-play | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Red zone, you get beat clean off the edge, and your quarterback goes down before he can set — strip-sack, ball on the ground. The drive dies right there, on a rep with your name on it.
_(pause: 1.5s)_
3. Your shoulders drop as you watch the pile, and your hands still hang out where the edge should have been. The thought hits: I let my quarterback down.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That rep is over and it's done. The way you protect him now is the next rep, not the last one.
_(pause: 2s)_
6. Next pass set, patient feet, hands inside, anchor against the bull and mirror the speed. Keep the pocket clean and give him his throwing lane — eyes up, base down, win your rep.
_(pause: 2s)_
### Football · OL · benched
<!-- slug: hm-ftb-ol-benched | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The o-line coach rotates the other tackle in — and then doesn't rotate you back. Standing on the sideline, you realize the depth-chart battle you thought you'd won is wide open again.
_(pause: 1.5s)_
3. You watch him take rep after rep of yours, your hands hanging loose at your sides. The thought hits: the second unit took my reps that series.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The bench has your body for a series. It does not have your mind. Stay locked in and watch the front.
_(pause: 2s)_
6. Don't press to prove a point when you get back out there. Set clean, anchor your base, finish your man — let your tape win the spot back, one solid rep at a time.
_(pause: 2s)_
### Football · OL · nervous
<!-- slug: hm-ftb-ol-nervous | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Big rivalry game. You're matched up all night with their best edge rusher, and you're carrying it before the kickoff — the knowledge that one slip leaves your quarterback on his back.
_(pause: 1.5s)_
3. Your stomach is tight in the locker room and your hands flex and clench. The thought hits: what if he wins all night and it's on me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you. Feel your base under you and narrow it to one rep at a time.
_(pause: 2s)_
6. You don't have to shut him out all night in your head right now — you have to win the first rep. Patient set, hands inside, anchor your base. One snap, then the next.
_(pause: 2s)_
### Football · OL · big-hit
<!-- slug: hm-ftb-ol-big-hit | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The defensive tackle gets under your pads and drives the bull rush through the middle. Your base narrows, you give ground, and the pocket starts collapsing into your quarterback.
_(pause: 1.5s)_
3. Your feet scramble underneath you and your hips rise as you fight to stop the rush. The thought hits: he walked me straight back that time.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That rep is over. Reset your base and do not carry the lost anchor into the next snap.
_(pause: 2s)_
6. If something feels off, speak up.
_(pause: 1.2s)_
7. Win with leverage: hips down, hands inside, feet under you, and re-anchor before he reaches the pocket.
_(pause: 2s)_
### Football · OL · start-slow
<!-- slug: hm-ftb-ol-start-slow | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. First series, and the defense's tempo and stunts have you a half-beat slow. Every snap the pocket is muddy, somebody's leaking through, and you're playing catch-up before you've settled in.
_(pause: 1.5s)_
3. Your sets are rushed, your hands are late, and your feet feel heavy under you. The thought hits: I'm a step behind all of them tonight.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. One muddy series isn't the game — the front line settles in as it goes. Let the next snap be a fresh one.
_(pause: 2s)_
6. Slow yourself back down. Patient set, eyes on the front, communicate the stunt, hands inside. Win one clean rep and the tempo stops feeling fast.
_(pause: 2s)_
### Football · OL · fall-behind-early
<!-- slug: hm-ftb-ol-fall-behind-early | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Down two scores, and everyone in the stadium knows it's a passing down. You're pass-blocking a rush that's teeing off, ears pinned, coming after your quarterback on every single snap.
_(pause: 1.5s)_
3. Your chest tightens before the snap and your eyes start jumping across the whole front. The thought hits: if one of us slips, he's down again.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The deficit is real, but it doesn't change your job — it narrows it. You don't block the scoreboard, you block one man. Bring your eyes to your guy.
_(pause: 2s)_
6. Even on a known passing down, win your one rep. Patient set, hands inside, anchor your base, mirror him. Hold the edge of the pocket and trust the four next to you.
_(pause: 2s)_
### Football · OL · trench-battle
<!-- slug: hm-ftb-ol-trench-battle | file: components/pregame/audio/clips-football.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You and the nose are nose-to-nose every snap. On a critical short-yardage rep he stones you at the point of attack, and the run gets blown up right there before it starts.
_(pause: 1.5s)_
3. Your jaw clamps watching the back get stopped, and your hands feel beaten to the punch. The thought hits: I got moved off the ball.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That rep is over. One lost rep at the point of attack is one snap, and the next one's yours to win. Reset your eyes for the line.
_(pause: 2s)_
6. Win it with leverage, not by trying to overpower him. First step low and quick, hands inside on his pads, hips through and roll — get under his pad level, drive your feet, and beat him to the punch.
_(pause: 2s)_

## VIZ Clips — Positive Plays (FV-423)

Athlete-chooseable rehearsal scenarios (FV-144): the athlete picks up to 3 and
they replace the flagship viz. 7 per position.

### Football · QB · rhythm-throw · viz play
<!-- slug: viz-ftb-qb-rhythm-throw | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself under center, reading the coverage before the snap.
_(pause: 2s)_
2. You check the safeties — two-high, the middle open.
_(pause: 2.5s)_
3. You already know where you're going with it.
_(pause: 2s)_
4. Snap. Clean three-step drop, feet set.
_(pause: 2s)_
5. Your first read clears at the top of his route.
_(pause: 2.5s)_
6. You don't wait. You trust it and let it go.
_(pause: 2s)_
7. Tight spiral, right on the numbers, on time.
_(pause: 2s)_
8. Caught in stride, first down.
_(pause: 3s)_
9. You jog back to the huddle and get the next call.
_(pause: 2s)_
10. Read it, set your feet, and deliver it on time.
_(pause: 2.5s)_

### Football · QB · play-action-shot · viz play
<!-- slug: viz-ftb-qb-play-action-shot | file: components/pregame/audio/clips-viz-football.ts -->

1. See the play-action shot called, and know the top is there to take.
_(pause: 2s)_
2. Snap. You open with the fake and ride the mesh, hiding the ball.
_(pause: 2.5s)_
3. The linebackers bite downhill on the run.
_(pause: 2s)_
4. You pull it and set your feet.
_(pause: 2s)_
5. Your receiver has a step on the safety, down the sideline.
_(pause: 2.5s)_
6. You drop it in over his outside shoulder.
_(pause: 2s)_
7. The ball hangs, then falls right into his hands.
_(pause: 2s)_
8. He runs under it in stride and finishes the play.
_(pause: 3s)_
9. You reset and get ready for the next snap.
_(pause: 2.5s)_

### Football · QB · rpo-read · viz play
<!-- slug: viz-ftb-qb-rpo-read | file: components/pregame/audio/clips-viz-football.ts -->

1. See the RPO called — hand it off, or pull and throw the bubble.
_(pause: 2s)_
2. Snap. You ride the mesh with the back and read the box.
_(pause: 2.5s)_
3. The linebacker triggers down hard to fill the run.
_(pause: 2s)_
4. That's your throw key. You pull it clean.
_(pause: 2s)_
5. Your eyes snap out to the bubble.
_(pause: 2s)_
6. The numbers are yours — the flat is wide open.
_(pause: 2.5s)_
7. You put it out quick and flat, on his hip.
_(pause: 2s)_
8. Caught with grass ahead, first down and more.
_(pause: 3s)_
9. Right read, right throw. Simple and clean.
_(pause: 2.5s)_

### Football · QB · scramble · viz play
<!-- slug: viz-ftb-qb-scramble | file: components/pregame/audio/clips-viz-football.ts -->

1. See the pocket start to break down around you.
_(pause: 2s)_
2. Snap. You take your drop, but the edge caves.
_(pause: 2s)_
3. You feel the rush before you see it.
_(pause: 2s)_
4. You climb up and slide out of the pocket, still square.
_(pause: 2.5s)_
5. Your eyes stay downfield, not on the rush.
_(pause: 2.5s)_
6. A receiver breaks his route off and works back to you.
_(pause: 2s)_
7. You reset your feet and deliver on the move.
_(pause: 2.5s)_
8. Complete, past the sticks. First down.
_(pause: 3s)_
9. You stayed composed, reset your feet, and completed the play.
_(pause: 2.5s)_

### Football · QB · take-the-checkdown · viz play
<!-- slug: viz-ftb-qb-take-the-checkdown | file: components/pregame/audio/clips-viz-football.ts -->

1. See the deep shot called, but stay ready to take what they give.
_(pause: 2s)_
2. Snap. Clean drop, eyes down the field.
_(pause: 2s)_
3. The coverage rolls and takes your deep man away.
_(pause: 2.5s)_
4. Nothing's there down the field — and that's fine.
_(pause: 2s)_
5. You come off it instead of forcing it into coverage.
_(pause: 2.5s)_
6. Your back leaks out of the backfield, wide open.
_(pause: 2s)_
7. You drop it to him soft and let him work.
_(pause: 2s)_
8. Eight easy yards. Second and short.
_(pause: 3s)_
9. The safe throw kept the drive alive.
_(pause: 2s)_
10. Take the available throw and keep the offense on schedule.
_(pause: 2.5s)_

### Football · QB · two-minute-drive · viz play
<!-- slug: viz-ftb-qb-two-minute-drive | file: components/pregame/audio/clips-viz-football.ts -->

1. See the two-minute drive, down four, with time and field position to manage.
_(pause: 2s)_
2. You break the huddle, communicate the call, and get everyone lined up.
_(pause: 2.5s)_
3. First snap, you hit the quick out and he steps out of bounds.
_(pause: 2s)_
4. The clock stops. You move them to the line fast.
_(pause: 2s)_
5. Next play, you find the seam over the middle and move the ball into scoring range.
_(pause: 2.5s)_
6. You spike it, catch your breath, and read the call.
_(pause: 2s)_
7. Under a minute now, ball at the twenty.
_(pause: 2s)_
8. You take the snap, climb the pocket, and put the fade where only your receiver can reach it.
_(pause: 2.5s)_
9. Your receiver secures it in the end zone.
_(pause: 3s)_
10. You managed the clock, made the reads, and finished the drive.
_(pause: 2.5s)_

### Football · QB · bounce-back-throw · viz play
<!-- slug: viz-ftb-qb-bounce-back-throw | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself right after a throw sails on you, incomplete.
_(pause: 2s)_
2. The throw is over. You get your eyes back to the next call.
_(pause: 2.5s)_
3. Next snap. You get back under center, eyes up.
_(pause: 2s)_
4. Same clean footwork, same easy read.
_(pause: 2s)_
5. Your first option opens on the hitch.
_(pause: 2.5s)_
6. You trust it and drive the throw on a line.
_(pause: 2s)_
7. Caught, moving the chains.
_(pause: 3s)_
8. The completion puts you back into the flow of the offense.
_(pause: 2s)_
9. You return to the huddle ready for the next snap.
_(pause: 2.5s)_

### Football · RB · inside-zone · viz play
<!-- slug: viz-ftb-rb-inside-zone | file: components/pregame/audio/clips-viz-football.ts -->

1. See the inside zone called, and trust the blocks to open it.
_(pause: 2s)_
2. You set your depth, eyes on the front.
_(pause: 2s)_
3. Snap. The handoff is clean — two hands, high and tight.
_(pause: 2.5s)_
4. You press the line right at the guard's hip.
_(pause: 2s)_
5. The hole shows late, the cutback lane opening.
_(pause: 2.5s)_
6. You plant hard and cut downhill, no dancing.
_(pause: 2s)_
7. North and south now, pad level low.
_(pause: 2s)_
8. You break the arm tackle at the second level.
_(pause: 2.5s)_
9. Five more yards after contact, finished forward.
_(pause: 3s)_
10. You pop up and flip the ball to the ref.
_(pause: 2.5s)_

### Football · RB · outside-zone · viz play
<!-- slug: viz-ftb-rb-outside-zone | file: components/pregame/audio/clips-viz-football.ts -->

1. See the outside zone, and read the edge before you bounce it.
_(pause: 2s)_
2. Snap. You take the handoff clean, ball high and tight.
_(pause: 2s)_
3. You aim for the tight end's outside hip.
_(pause: 2s)_
4. You press it, stretching the front sideways.
_(pause: 2.5s)_
5. The end sets hard — the edge is closed.
_(pause: 2s)_
6. So you plant and cut it up in the crease inside.
_(pause: 2.5s)_
7. You slice through the seam, downhill fast.
_(pause: 2s)_
8. You lower your pad level and fall forward past the safety.
_(pause: 3s)_
9. You take the crease inside and move the chains.
_(pause: 2.5s)_

### Football · RB · check-release-screen · viz play
<!-- slug: viz-ftb-rb-check-release-screen | file: components/pregame/audio/clips-viz-football.ts -->

1. See the screen called your way, and sell the block first.
_(pause: 2s)_
2. Snap. You slip the rusher and drift to the flat.
_(pause: 2s)_
3. You turn and open your hands for the ball.
_(pause: 2s)_
4. The pass is soft, right into your chest.
_(pause: 2.5s)_
5. Your linemen are out in front, setting up their blocks.
_(pause: 2s)_
6. You follow their hips and let it set up.
_(pause: 2.5s)_
7. You cut off the last block and get upfield.
_(pause: 2s)_
8. Open grass now — you hit it full speed.
_(pause: 3s)_
9. You follow the blocks and finish the play for a big gain.
_(pause: 2.5s)_

### Football · RB · blitz-pickup · viz play
<!-- slug: viz-ftb-rb-blitz-pickup | file: components/pregame/audio/clips-viz-football.ts -->

1. See the blitz coming, and know your job is to protect.
_(pause: 2s)_
2. You scan the front and read the pressure pre-snap.
_(pause: 2.5s)_
3. Snap. The linebacker fires through the A-gap.
_(pause: 2s)_
4. You step up and meet him square in the hole.
_(pause: 2.5s)_
5. Low pad level, hands inside, feet driving.
_(pause: 2s)_
6. You stop his charge and hold your ground in protection.
_(pause: 2.5s)_
7. Your quarterback steps up into clean space.
_(pause: 2s)_
8. The ball gets out downfield for a completion.
_(pause: 3s)_
9. The protection holds and the quarterback completes the throw.
_(pause: 2.5s)_

### Football · RB · short-yardage · viz play
<!-- slug: viz-ftb-rb-short-yardage | file: components/pregame/audio/clips-viz-football.ts -->

1. See fourth and one, with the offense needing a yard.
_(pause: 2s)_
2. Everyone in the stadium knows it's coming to you.
_(pause: 2.5s)_
3. Snap. Clean handoff, ball locked away high and tight.
_(pause: 2s)_
4. You take one hard step and press the line.
_(pause: 2s)_
5. No dancing — you get downhill right now.
_(pause: 2.5s)_
6. You hit the pile low, legs churning.
_(pause: 2s)_
7. You keep your feet driving through contact.
_(pause: 2.5s)_
8. You fall forward, past the line. First down.
_(pause: 3s)_
9. You get the yard and move the chains.
_(pause: 2.5s)_

### Football · RB · take-what-is-there · viz play
<!-- slug: viz-ftb-rb-take-what-is-there | file: components/pregame/audio/clips-viz-football.ts -->

1. See the run called inside, and take the yards that are there.
_(pause: 2s)_
2. Snap. Handoff clean, two hands, high and tight.
_(pause: 2s)_
3. You press the hole, but it's clogged inside.
_(pause: 2.5s)_
4. The edge looks tempting — the bounce is right there.
_(pause: 2s)_
5. You don't chase it. That's how runs go backward.
_(pause: 2.5s)_
6. You stick your foot and take the tough gain up the middle.
_(pause: 2s)_
7. Four hard yards, downhill, pad level low.
_(pause: 2s)_
8. You finish forward and fall for one more.
_(pause: 3s)_
9. Second and short beats a run for a loss.
_(pause: 2s)_
10. The smart yards keep the chains moving.
_(pause: 2.5s)_

### Football · RB · next-carry-clean · viz play
<!-- slug: viz-ftb-rb-next-carry-clean | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself get stuffed at the line, no gain.
_(pause: 2s)_
2. You let that carry go — it's already behind you.
_(pause: 2.5s)_
3. Next play, same call, same trust in the blocks.
_(pause: 2s)_
4. Snap. Clean handoff, ball high and tight.
_(pause: 2s)_
5. You press the hole a beat longer this time.
_(pause: 2.5s)_
6. It opens late, and you cut downhill hard.
_(pause: 2s)_
7. You burst through the second level clean.
_(pause: 2.5s)_
8. A big gain to answer the stuff.
_(pause: 3s)_
9. One patient carry, and you broke it.
_(pause: 2.5s)_

### Football · WR · beat-the-press · viz play
<!-- slug: viz-ftb-wr-beat-the-press | file: components/pregame/audio/clips-viz-football.ts -->

1. See the corner pressed up on you, and know you'll win the release.
_(pause: 2s)_
2. You set your stance, weight balanced, eyes on his hands.
_(pause: 2.5s)_
3. Snap. You attack his leverage with a quick jab.
_(pause: 2s)_
4. You swipe his hands off and burst past him clean.
_(pause: 2.5s)_
5. You stack him, getting on top and even.
_(pause: 2s)_
6. You're a full step ahead now, running free.
_(pause: 2s)_
7. The ball drops in over your shoulder.
_(pause: 2.5s)_
8. You look it in and squeeze it home.
_(pause: 3s)_
9. Caught clean, off the press, and gone.
_(pause: 2.5s)_

### Football · WR · slant-yac · viz play
<!-- slug: viz-ftb-wr-slant-yac | file: components/pregame/audio/clips-viz-football.ts -->

1. See the slant called and focus first on winning the route.
_(pause: 2s)_
2. Snap. You take three hard steps upfield.
_(pause: 2s)_
3. You break flat across the linebacker's face.
_(pause: 2.5s)_
4. The ball is there quick, on your frame.
_(pause: 2s)_
5. Late hands, you snatch it out of the air.
_(pause: 2.5s)_
6. You tuck it and turn upfield in one move.
_(pause: 2s)_
7. You slip the first tackle and get vertical.
_(pause: 2.5s)_
8. You get vertical and finish the run upfield.
_(pause: 3s)_
9. A quick throw turned into a big gain.
_(pause: 2.5s)_

### Football · WR · deep-ball · viz play
<!-- slug: viz-ftb-wr-deep-ball | file: components/pregame/audio/clips-viz-football.ts -->

1. See the go route called, and trust yourself to run under it.
_(pause: 2s)_
2. Snap. You explode off the line, full speed.
_(pause: 2s)_
3. You get on top of the corner, even, then past.
_(pause: 2.5s)_
4. You find the ball over your outside shoulder.
_(pause: 2s)_
5. You track it in the air without breaking stride.
_(pause: 2.5s)_
6. You adjust late, hands up, eyes locked on it.
_(pause: 2s)_
7. The ball drops into your hands in stride.
_(pause: 2.5s)_
8. You look it all the way in and tuck it.
_(pause: 3s)_
9. You secure the catch and finish the route into the end zone.
_(pause: 2.5s)_

### Football · WR · contested-catch · viz play
<!-- slug: viz-ftb-wr-contested-catch | file: components/pregame/audio/clips-viz-football.ts -->

1. See the fade called to your back shoulder, one-on-one.
_(pause: 2s)_
2. Snap. You release up the sideline and create position on the corner.
_(pause: 2s)_
3. You feel the corner draped on your hip.
_(pause: 2.5s)_
4. The ball comes back-shoulder, away from him.
_(pause: 2s)_
5. You throttle down and come back to it.
_(pause: 2.5s)_
6. You go up strong and high-point it at the top.
_(pause: 2s)_
7. Two hands, you rip it down through the contest.
_(pause: 2.5s)_
8. You get your feet in and hang on through the ground.
_(pause: 3s)_
9. You secure the catch through contact and complete the play.
_(pause: 2.5s)_

### Football · WR · stalk-block · viz play
<!-- slug: viz-ftb-wr-stalk-block | file: components/pregame/audio/clips-viz-football.ts -->

1. See the run called your way, and know your block springs it.
_(pause: 2s)_
2. Snap. You release like it's a route to hold the corner.
_(pause: 2.5s)_
3. He backpedals, respecting the deep ball.
_(pause: 2s)_
4. You break down under control, feet chopping.
_(pause: 2s)_
5. You fit your hands inside his chest, eyes up.
_(pause: 2.5s)_
6. You mirror him and wall him off from the play.
_(pause: 2s)_
7. Your back cuts off your block, up the sideline.
_(pause: 2.5s)_
8. He races past into open grass, gone.
_(pause: 3s)_
9. Your block gives the back room to get up the sideline.
_(pause: 2.5s)_

### Football · WR · third-down-move-chains · viz play
<!-- slug: viz-ftb-wr-third-down-move-chains | file: components/pregame/audio/clips-viz-football.ts -->

1. See third and long, and know the throw is coming to you.
_(pause: 2s)_
2. Snap. You release clean and get vertical fast.
_(pause: 2s)_
3. You read the coverage dropping off soft.
_(pause: 2.5s)_
4. You find the marker and settle in the soft spot.
_(pause: 2s)_
5. You sit down just past the sticks, facing the ball.
_(pause: 2.5s)_
6. The pass hits you square in the numbers.
_(pause: 2s)_
7. You secure it first, then turn and fall forward.
_(pause: 2.5s)_
8. Past the line to gain. First down.
_(pause: 3s)_
9. You secure the catch beyond the marker and move the chains.
_(pause: 2.5s)_

### Football · WR · run-the-next-one-clean · viz play
<!-- slug: viz-ftb-wr-run-the-next-one-clean | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself drop a ball you should have had, clean off your hands.
_(pause: 2s)_
2. The drop is over. You get back to the huddle and listen for the next call.
_(pause: 2.5s)_
3. You do not protect against another drop or carry the frustration into the next route.
_(pause: 2s)_
4. Next play, you line up and run it full speed.
_(pause: 2s)_
5. Snap. You beat the press and stem it hard.
_(pause: 2.5s)_
6. You snap your break, coming open again.
_(pause: 2s)_
7. This time you look it all the way in.
_(pause: 2.5s)_
8. You show your hands late, look it in, and secure it.
_(pause: 3s)_
9. You complete the next catch and reset for the next play.
_(pause: 2.5s)_

### Football · OL · pass-set-anchor · viz play
<!-- slug: viz-ftb-ol-pass-set-anchor | file: components/pregame/audio/clips-viz-football.ts -->

1. See the drop-back called and focus on your pass set.
_(pause: 2s)_
2. You set in your stance, hand down, eyes on the rusher.
_(pause: 2.5s)_
3. Snap. You kick and slide, staying square.
_(pause: 2s)_
4. He comes with speed, aiming for your edge.
_(pause: 2s)_
5. You mirror his rush, feet quiet, hands ready.
_(pause: 2.5s)_
6. He tries to bull you — you punch inside and anchor.
_(pause: 2s)_
7. Your base sinks, and he stalls against you.
_(pause: 2.5s)_
8. The pocket stays firm behind you.
_(pause: 3s)_
9. The pocket stays firm and the throw gets out clean.
_(pause: 2.5s)_

### Football · OL · drive-block · viz play
<!-- slug: viz-ftb-ol-drive-block | file: components/pregame/audio/clips-viz-football.ts -->

1. See the run called to your gap and focus on winning your leverage.
_(pause: 2s)_
2. You get in your stance, eyes on your man.
_(pause: 2s)_
3. Snap. You fire off low and hard, first off the ball.
_(pause: 2.5s)_
4. You get your hat across his front.
_(pause: 2s)_
5. Hands inside, you take his chest and lift.
_(pause: 2.5s)_
6. You drive your feet in short, choppy steps.
_(pause: 2s)_
7. You move him off the ball, opening the hole.
_(pause: 2.5s)_
8. Your back runs off your hip through the gap.
_(pause: 3s)_
9. You sustain the block through the whistle and the back hits the gap.
_(pause: 2.5s)_

### Football · OL · reach-block · viz play
<!-- slug: viz-ftb-ol-reach-block | file: components/pregame/audio/clips-viz-football.ts -->

1. See the zone run called, and know you'll reach the edge.
_(pause: 2s)_
2. Snap. You take a quick play-side step, flat and fast.
_(pause: 2.5s)_
3. You get your head across his outside shoulder.
_(pause: 2s)_
4. He tries to fight over the top to the sideline.
_(pause: 2.5s)_
5. You stay on his edge, hands inside, feet running.
_(pause: 2s)_
6. You gain leverage and turn his shoulders.
_(pause: 2s)_
7. You seal him inside, away from the play.
_(pause: 2.5s)_
8. The back bends it right off your block.
_(pause: 3s)_
9. Edge sealed. He hits the crease clean.
_(pause: 2.5s)_

### Football · OL · pull-and-kick · viz play
<!-- slug: viz-ftb-ol-pull-and-kick | file: components/pregame/audio/clips-viz-football.ts -->

1. See the trap called, and picture yourself leading the play.
_(pause: 2s)_
2. Snap. You pull flat down the line, quick and low.
_(pause: 2.5s)_
3. You keep your eyes in the hole for your man.
_(pause: 2s)_
4. The end crashes down, right into your path.
_(pause: 2.5s)_
5. You square up and strike him with your inside hands.
_(pause: 2s)_
6. You kick him out, sealing the wall.
_(pause: 2.5s)_
7. The crease opens up right behind you.
_(pause: 2s)_
8. Your back shoots through it downhill.
_(pause: 3s)_
9. Your kick-out opens the crease and the back gets downhill.
_(pause: 2.5s)_

### Football · OL · pass-off-the-stunt · viz play
<!-- slug: viz-ftb-ol-pass-off-the-stunt | file: components/pregame/audio/clips-viz-football.ts -->

1. See the twist coming, and trust your rules to pass it off.
_(pause: 2s)_
2. Snap. You set to your man and stay square.
_(pause: 2s)_
3. The end crashes inside, the tackle looping behind.
_(pause: 2.5s)_
4. You feel the pick and don't chase it.
_(pause: 2s)_
5. You pass the crasher to your guard, eyes outside.
_(pause: 2.5s)_
6. You slide to pick up the looper coming free.
_(pause: 2s)_
7. You punch him inside and ride him wide.
_(pause: 2.5s)_
8. No free rusher gets through. The pocket holds.
_(pause: 3s)_
9. You and the guard sort the stunt and keep the pocket clean.
_(pause: 2.5s)_

### Football · OL · combo-climb · viz play
<!-- slug: viz-ftb-ol-combo-climb | file: components/pregame/audio/clips-viz-football.ts -->

1. See the double-team called, and know you'll climb to the backer.
_(pause: 2s)_
2. Snap. You and your guard hit the down lineman together.
_(pause: 2.5s)_
3. Four hands, one man — you jolt him off the ball.
_(pause: 2s)_
4. You feel your guard take over the block.
_(pause: 2.5s)_
5. You come off late, eyes up to the second level.
_(pause: 2s)_
6. The linebacker fills downhill toward the gap.
_(pause: 2.5s)_
7. You climb clean and fit your hands on him.
_(pause: 2s)_
8. You wall him off and run your feet.
_(pause: 3s)_
9. Both defenders blocked. The back cuts through.
_(pause: 2.5s)_

### Football · OL · win-the-next-rep · viz play
<!-- slug: viz-ftb-ol-win-the-next-rep | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself get beat on a rep, your man winning clean.
_(pause: 2s)_
2. That snap is over. You reset your stance and your eyes.
_(pause: 2.5s)_
3. You do not over-set or change your technique trying to make up for it.
_(pause: 2s)_
4. Next play, you get back in your stance, eyes calm.
_(pause: 2s)_
5. Snap. You set quick, hands loaded, base under you.
_(pause: 2.5s)_
6. He tries the same speed rush again.
_(pause: 2s)_
7. This time you punch first and lock him out.
_(pause: 2.5s)_
8. You anchor, mirror, and ride him past the pocket.
_(pause: 3s)_
9. You keep the pocket clean on the next rep.
_(pause: 2.5s)_

### Football · DL · get-off · viz play
<!-- slug: viz-ftb-dl-get-off | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself across the ball, coiled and ready to win the get-off.
_(pause: 2s)_
2. You key the football, weight loaded, eyes on the tip of the ball.
_(pause: 2.5s)_
3. Snap. You fire off first, low and hard, beating the guard to the spot.
_(pause: 2s)_
4. Your hands land inside his chest before he can set.
_(pause: 2s)_
5. You lock him out, hold your gap, and feel the run develop.
_(pause: 2.5s)_
6. The back cuts toward your gap. You shed the block clean.
_(pause: 2s)_
7. You come off square, eyes on the ball carrier.
_(pause: 2s)_
8. You break down, wrap him up, and drive your feet through the tackle.
_(pause: 3s)_
9. Stopped for no gain. You peel off and get back to the huddle, ready for the next one.
_(pause: 2s)_

### Football · DL · stack-shed · viz play
<!-- slug: viz-ftb-dl-stack-shed | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself head-up on the lineman, ready to take him on and read it.
_(pause: 2s)_
2. Snap. He fires out at you, hat down, trying to move you.
_(pause: 2s)_
3. You strike first — hands inside, pad under pad, and you anchor.
_(pause: 2.5s)_
4. You stack him up and hold your ground at the line.
_(pause: 2s)_
5. You keep your eyes in the backfield, reading the back through the block.
_(pause: 2.5s)_
6. He commits to your side. You shed hard toward the ball.
_(pause: 2s)_
7. You come off the block clean, square to the ball carrier.
_(pause: 2s)_
8. You fill the lane, wrap up, and finish the tackle for no gain.
_(pause: 3s)_
9. The pile stops at the line. You come off it and get set for the next snap.
_(pause: 2s)_

### Football · DL · win-the-edge · viz play
<!-- slug: viz-ftb-dl-win-the-edge | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself on the edge, third and long, ready to rush the passer.
_(pause: 2s)_
2. You know it's a pass. You get off on the ball, first step upfield.
_(pause: 2s)_
3. You attack half the man, aiming for his outside shoulder.
_(pause: 2.5s)_
4. He kicks to set, but your get-off already has him beat.
_(pause: 2s)_
5. You dip your shoulder, bend the edge, and turn the corner tight.
_(pause: 2.5s)_
6. His hands miss as you rip through and flatten to the quarterback.
_(pause: 2s)_
7. You close the space fast — he's still looking downfield.
_(pause: 2s)_
8. You get home clean, wrap him up, and bring him down.
_(pause: 3s)_
9. Sack. You pop up and get back to the huddle for the next rush.
_(pause: 2s)_

### Football · DL · hands-up · viz play
<!-- slug: viz-ftb-dl-hands-up | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself rushing the passer, working to win your lane.
_(pause: 2s)_
2. Snap. You get off and press the tackle, working your hands.
_(pause: 2s)_
3. He mirrors you and stays square — no clean lane home.
_(pause: 2.5s)_
4. You feel the quarterback set to throw, still just out of reach.
_(pause: 2s)_
5. You stop trying to run through and get your eyes on the ball.
_(pause: 2.5s)_
6. You throw your hands straight up into the passing lane.
_(pause: 2s)_
7. The throw comes — and you get a piece of it at the line.
_(pause: 2s)_
8. The ball flutters and falls incomplete, batted down.
_(pause: 3s)_
9. The ball falls incomplete and the defense gets off the field.
_(pause: 2s)_

### Football · DL · goal-line · viz play
<!-- slug: viz-ftb-dl-goal-line | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself on the goal line, with the offense trying to run through your gap.
_(pause: 2s)_
2. They're going to run it right at you. You get low in your stance.
_(pause: 2.5s)_
3. Snap. The line fires out to move you off the ball.
_(pause: 2s)_
4. You strike first, hands inside, and drop your base.
_(pause: 2s)_
5. You drop your base, hold your ground, and keep the gap closed.
_(pause: 2.5s)_
6. The back dives for the line, looking for a crease.
_(pause: 2s)_
7. There's no crease. You've clogged it up with the whole front.
_(pause: 2s)_
8. You come off the block and meet him in the hole, head up and low.
_(pause: 3s)_
9. Stopped short. Goal-line stand. The defense holds.
_(pause: 2s)_

### Football · DL · contain-scramble · viz play
<!-- slug: viz-ftb-dl-contain-scramble | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself rushing, disciplined, staying in your rush lane.
_(pause: 2s)_
2. Snap. You get off and press your rush up the field.
_(pause: 2s)_
3. The pocket starts to break down and the quarterback feels it.
_(pause: 2.5s)_
4. He steps up, looking to escape and make a play with his legs.
_(pause: 2s)_
5. You don't chase the sack out of your lane — you stay home.
_(pause: 2.5s)_
6. You keep your rush lane, squeeze him back inside, no escape.
_(pause: 2s)_
7. He's got nowhere to run. You close from your edge.
_(pause: 2s)_
8. You corral him and wrap him up before he crosses the line.
_(pause: 3s)_
9. You keep contain and stop the scramble before the line.
_(pause: 2s)_

### Football · DL · pursue-backside · viz play
<!-- slug: viz-ftb-dl-pursue-backside | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself on the backside of a run, ready to chase it flat down the line.
_(pause: 2s)_
2. Snap. The tackle reaches you and seals you from your gap.
_(pause: 2s)_
3. For a beat, you're hooked and the run is going away from you.
_(pause: 2s)_
4. You rip off the block and get back into pursuit.
_(pause: 2.5s)_
5. You run flat down the line of scrimmage and stay in the play.
_(pause: 2s)_
6. The back cuts back, looking for the backside crease.
_(pause: 2s)_
7. You close the backside crease as the back cuts toward it.
_(pause: 2.5s)_
8. You run him down from behind and drag him to the turf.
_(pause: 3s)_
9. You recover from the block and make the tackle on the cutback.
_(pause: 2s)_

### Football · LB · read-and-fill · viz play
<!-- slug: viz-ftb-lb-read-and-fill | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself in the box, eyes on your keys, ready for the snap.
_(pause: 2s)_
2. You read the guard and the backfield, patient at the snap.
_(pause: 2.5s)_
3. The guard down-blocks and the back presses the hole — it's a run.
_(pause: 2s)_
4. You trigger downhill, no hesitation, filling your gap.
_(pause: 2s)_
5. A lineman climbs to block you. You take him on with your hands.
_(pause: 2.5s)_
6. You keep your shoulders square and stay clean off the block.
_(pause: 2s)_
7. You shed, find the back, and close the space fast.
_(pause: 2s)_
8. Head up, you wrap him up and drive your feet through the tackle.
_(pause: 3s)_
9. Stopped for a short gain. You pop up and signal the next call.
_(pause: 2s)_

### Football · LB · take-on-lead · viz play
<!-- slug: viz-ftb-lb-take-on-lead | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself reading a power play developing right at you.
_(pause: 2s)_
2. Snap. You see the guard pull and the lead blocker climbing to you.
_(pause: 2.5s)_
3. You trigger downhill and meet the block in the hole, not on your heels.
_(pause: 2s)_
4. You strike the blocker with your hands, pad under pad.
_(pause: 2s)_
5. You keep your outside arm free and hold your leverage.
_(pause: 2.5s)_
6. You force the run back inside, to your help.
_(pause: 2s)_
7. The back has to cut it up into the traffic.
_(pause: 2s)_
8. Your help is there, and you come off to finish the tackle.
_(pause: 3s)_
9. Short gain, run defended. You reset the front and get the call in.
_(pause: 2s)_

### Football · LB · zone-drop · viz play
<!-- slug: viz-ftb-lb-zone-drop | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself dropping into your zone, eyes up on the quarterback.
_(pause: 2s)_
2. Snap. You read pass and open into your drop, feeling the routes.
_(pause: 2.5s)_
3. A receiver crosses into your zone — you carry him with your eyes.
_(pause: 2s)_
4. You settle in the window and keep your eyes on the quarterback.
_(pause: 2.5s)_
5. He winds up to throw over the middle.
_(pause: 2s)_
6. You read his eyes and break the instant the ball leaves his hand.
_(pause: 2s)_
7. You drive downhill on the throw, closing the window.
_(pause: 2s)_
8. You arrive as the ball does and knock it away clean.
_(pause: 3s)_
9. Incomplete. Third down stop. You made them punt.
_(pause: 2s)_

### Football · LB · cover-the-back · viz play
<!-- slug: viz-ftb-lb-cover-the-back | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself matched on the back, ready to run with him in coverage.
_(pause: 2s)_
2. Snap. He slips out of the backfield on a route to the flat.
_(pause: 2s)_
3. You don't bite on the play fake — you stay locked on the back.
_(pause: 2.5s)_
4. You open your hips and run with him step for step.
_(pause: 2s)_
5. He tries to break it upfield on a wheel.
_(pause: 2s)_
6. You stay on top and keep your leverage, no separation.
_(pause: 2.5s)_
7. The quarterback looks, but there's no window to throw.
_(pause: 2s)_
8. He comes off it, and the back is covered all the way.
_(pause: 3s)_
9. The quarterback comes off the route because you stay in coverage.
_(pause: 2s)_

### Football · LB · blitz · viz play
<!-- slug: viz-ftb-lb-blitz | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself walked up, timing the snap, ready to bring the blitz.
_(pause: 2s)_
2. You get the call and creep toward your gap late.
_(pause: 2.5s)_
3. Snap. You time it clean and shoot the A-gap downhill.
_(pause: 2s)_
4. You're through the line before the guard can pick you up.
_(pause: 2s)_
5. You bend flat to the quarterback, eyes on the ball.
_(pause: 2.5s)_
6. He never sees you coming downhill through the pocket.
_(pause: 2s)_
7. You close the last step and wrap him up clean.
_(pause: 2s)_
8. You bring him down before he can get the throw off.
_(pause: 3s)_
9. Sack. You pop up and get the defense lined up again.
_(pause: 2s)_

### Football · LB · goal-line · viz play
<!-- slug: viz-ftb-lb-goal-line | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself stacked in the box on the goal line, ready to fill your gap.
_(pause: 2s)_
2. They're going to try to pound it in. You get downhill in your stance.
_(pause: 2.5s)_
3. Snap. You read run and trigger fast, no false steps.
_(pause: 2s)_
4. You beat the blocker to the hole and fill it downhill.
_(pause: 2s)_
5. You meet the back in the gap before he reaches the line.
_(pause: 2.5s)_
6. Head up, you get your pads under his and stand him up.
_(pause: 2s)_
7. You wrap, squeeze, and drive your feet.
_(pause: 2s)_
8. He doesn't get across. Your help swarms to finish it.
_(pause: 3s)_
9. Goal-line stand. The defense holds and takes over the ball.
_(pause: 2s)_

### Football · LB · recover-play-action · viz play
<!-- slug: viz-ftb-lb-recover-play-action | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself reading run, then catching yourself on the play fake.
_(pause: 2s)_
2. Snap. The line shows run and you take a step downhill.
_(pause: 2s)_
3. It's play-action — the back doesn't have it, the quarterback pulls it.
_(pause: 2s)_
4. For a beat, you're out of your drop and a step out of position.
_(pause: 2s)_
5. You don't panic or grab — you get your eyes back to your keys.
_(pause: 2.5s)_
6. You flip and drop back into your zone, recovering fast.
_(pause: 2s)_
7. You find the crosser and read the quarterback's eyes.
_(pause: 2s)_
8. He throws, and you break on it, driving through the window.
_(pause: 3s)_
9. You recover into the window and knock the pass away.
_(pause: 2s)_

### Football · DB · press-man · viz play
<!-- slug: viz-ftb-db-press-man | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself pressed over your man, eyes on his hips and feet balanced.
_(pause: 2s)_
2. Snap. He releases, and you don't lunge — patient feet.
_(pause: 2.5s)_
3. You mirror his first move and get your hands on him at the line.
_(pause: 2s)_
4. You stay hip to hip, running with him stride for stride.
_(pause: 2s)_
5. He can't stack you — you're in phase the whole way.
_(pause: 2.5s)_
6. He breaks, and you drive on it, closing the cushion.
_(pause: 2s)_
7. The ball comes on his break, in front of you.
_(pause: 2s)_
8. You drive through his hands and knock it away clean.
_(pause: 3s)_
9. Incomplete. You reset and get ready for the next coverage call.
_(pause: 2s)_

### Football · DB · off-break · viz play
<!-- slug: viz-ftb-db-off-break | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself in off coverage, reading the route through his stem.
_(pause: 2s)_
2. Snap. You backpedal, patient, keeping your cushion.
_(pause: 2.5s)_
3. You read his stem and feel the route developing underneath.
_(pause: 2s)_
4. He sits down in the hook, and the quarterback loads to throw.
_(pause: 2.5s)_
5. You plant off your cushion and break downhill on the ball.
_(pause: 2s)_
6. You close the ground fast, driving on the catch point.
_(pause: 2s)_
7. You arrive as the ball does, right on his hands.
_(pause: 2s)_
8. You arrive through the hands and break the pass up.
_(pause: 3s)_
9. Incomplete. You read the route and close the window.
_(pause: 2s)_

### Football · DB · pick · viz play
<!-- slug: viz-ftb-db-pick | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself reading the concept and holding your leverage long enough to invite the throw.
_(pause: 2s)_
2. Snap. You get depth and keep your eyes on the quarterback.
_(pause: 2.5s)_
3. You read the route combination and see the throw before it comes.
_(pause: 2s)_
4. You recognize the throw and drive in front of the receiver.
_(pause: 2s)_
5. The ball's in the air, and you're already breaking to it.
_(pause: 2.5s)_
6. You attack it at the high point with both hands.
_(pause: 2s)_
7. You pick it clean and tuck it away.
_(pause: 2s)_
8. You get your feet under you and turn upfield with the ball.
_(pause: 3s)_
9. You secure the interception and get the offense the ball back.
_(pause: 2s)_

### Football · DB · run-support · viz play
<!-- slug: viz-ftb-db-run-support | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself reading run, coming downhill as the force in the alley.
_(pause: 2s)_
2. Snap. You read run and trigger, driving toward the line.
_(pause: 2s)_
3. The back breaks outside, looking for room in the alley.
_(pause: 2.5s)_
4. You fill fast but under control, breaking down as you close.
_(pause: 2s)_
5. You keep leverage, forcing him back inside to your help.
_(pause: 2.5s)_
6. You square him up, head up, in a good tackling position.
_(pause: 2s)_
7. You wrap him up and drive your feet on contact.
_(pause: 2s)_
8. You bring him down in space, a sure open-field tackle.
_(pause: 3s)_
9. Short gain. You reset and get the next coverage call.
_(pause: 2s)_

### Football · DB · set-the-edge · viz play
<!-- slug: viz-ftb-db-set-the-edge | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself as the force player on the edge of a perimeter run.
_(pause: 2s)_
2. Snap. The run breaks your way and the receiver comes to block you.
_(pause: 2.5s)_
3. You trigger down and meet him before he gets into your chest.
_(pause: 2s)_
4. You strike him with your hands and keep your outside arm free.
_(pause: 2.5s)_
5. You hold the edge — you don't get turned or reached.
_(pause: 2s)_
6. You force the ball back inside, to your help.
_(pause: 2s)_
7. The back has to cut up into the traffic.
_(pause: 2s)_
8. You shed the block and come off to help finish the tackle.
_(pause: 3s)_
9. You keep the edge set and force the run back to your help.
_(pause: 2s)_

### Football · DB · clutch-deep · viz play
<!-- slug: viz-ftb-db-clutch-deep | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself matched on their best receiver late in the game, with no help over the top.
_(pause: 2s)_
2. Snap. He releases hard, trying to get on top of you.
_(pause: 2.5s)_
3. You stay patient, in phase, eyes on his hips, not the noise.
_(pause: 2s)_
4. He goes vertical, and you run with him stride for stride.
_(pause: 2.5s)_
5. The ball goes up deep toward your side.
_(pause: 2s)_
6. You stay on top, get your eyes back, and find the ball.
_(pause: 2s)_
7. You stay in phase, find the ball, and play through his hands at the catch point.
_(pause: 2s)_
8. You knock it away clean as it comes down.
_(pause: 3s)_
9. Incomplete. You finish the rep and reset for the next snap.
_(pause: 2s)_

### Football · DB · recover-in-phase · viz play
<!-- slug: viz-ftb-db-recover-in-phase | file: components/pregame/audio/clips-viz-football.ts -->

1. See yourself on your man, then feeling him get a step on your break.
_(pause: 2s)_
2. Snap. He releases and stems you, and you open your hips too early.
_(pause: 2s)_
3. For a beat, he's got half a step and you're trailing.
_(pause: 2s)_
4. You do not grab or look back too early. You keep running to recover.
_(pause: 2.5s)_
5. You dig, get back to his hip, and recover into phase.
_(pause: 2s)_
6. You close the cushion, running stride for stride again.
_(pause: 2s)_
7. The ball's in the air, a step ahead of you.
_(pause: 2s)_
8. You get your eyes back, find it, and rake it away at the catch point.
_(pause: 3s)_
9. Incomplete. You recover your position and finish through the catch point.
_(pause: 2s)_
