# From Victory · Script Book · Lacrosse

> **DORMANT** — no audio rendered yet for this sport. Edit freely; the first audio render is the go-live pass.
> Scope: BOYS' / MEN'S FIELD LACROSSE (per `docs/lacrosse-module-map.md` §6 — girls'/box lacrosse are separate future sports, never blended here).

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
   - **DORMANT sports** (football, swimming, track-field, lacrosse): edit freely. The first
     audio render is the go-live pass.
   - To preview which clips will render with your edits (no TTS budget spent):
     ```
     npm run audio:check
     ```

> Note: daily-training sessions (Supabase seed SQL) and postgame modules
> (`lib/postgame/modules.ts`) are NOT in these books — edit those directly.

> Openers: lacrosse inherits the shared `opener-*` clips (the canonical
> verse-per-need set) — no lacrosse-specific opener sections in this book,
> per `docs/lacrosse-module-map.md` §5.

---

## Text-mode fallback (Lacrosse)

These lines appear on-screen in text mode (no audio). Tokens like `{{role}}`, `{{adversity}}`, etc. are substituted at runtime — edit them as-is.

<!-- audioScript#0 | eyebrow: Identity -->
1. ${SCRIPTURE_REF} — ${SCRIPTURE_TEXT} You are not playing to become enough. In Christ, you are already loved. Receive that before you compete.

<!-- audioScript#1 | eyebrow: Settle -->
2. Sit tall. Long exhale. Lead your body back to ready. Four counts in. Six counts out. Let your shoulders drop.

<!-- audioScript#2 | eyebrow: See the field -->
3. See the field. Hear the ball snapping into pockets in warmups, cleats on the turf. Feel your gloves, your stick, the ground under you. You belong here. You are ready.

<!-- audioScript#3 | eyebrow: Your first touch -->
4. First whistle. Run hard to your spot. Eyes up. Win your first touch — a clean catch, a ground ball, one simple play. Recover. Next play.

<!-- audioScript#4 | eyebrow: Play your position · {{role}} -->
5. {{roleScenes}}

<!-- audioScript#5 | eyebrow: If this happens -->
6. {{adversity}} See it. Feel it. Breathe. Speak truth. Take the next faithful action. Your mistake is real. It is not your identity.

<!-- audioScript#6 | eyebrow: Coach yourself -->
7. {{selfTalk}} When pressure hits, return here. Your anchor: {{anchor}}. Your cue word: {{cueWord}}.

<!-- audioScript#7 | eyebrow: Send-off -->
8. Lord, help me compete with courage, humility, and joy. Help me play the next play in front of me, respond well to mistakes, and remember that my worth is secure in You. Amen. Play from victory.
---

## Audio Clips

## VIZ Clips (position × library)

### Lacrosse · Attack · VIZ — Beat your man
<!-- slug: viz-lax-attack-beat-your-man | file: components/pregame/audio/clips-lacrosse.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball snapping into pockets in warmups.
_(pause: 1s)_
3. Hear cleats on the turf, a coach calling out the lines.
_(pause: 2s)_
4. You feel the field under your feet.
_(pause: 2.2s)_
5. Feel your gloves close around the shaft.
_(pause: 2.2s)_
6. Feel your helmet settle, the chin strap snug.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You set up at X, ball in your stick. Slow breath. Your matchup is on you, and that's exactly how you want it.
_(pause: 0.25s)_
9. You split dodge from X, get your feet past him, and roll back the moment he overplays.
_(pause: 2s)_
10. You turn the corner at GLE, hands free, and finish low to high — far pipe.
_(pause: 2s)_
11. The net snaps. You beat him clean, and everyone on the field knows it.
_(pause: 2s)_
12. Next possession, the two-man game — you slip the pick, turn the corner, and bury it through contact.
_(pause: 2s)_
13. See yourself take your man, again and again.
_(pause: 2s)_
14. Question-mark from up top, bull dodge from X, face dodge through the alley — you get to your spots, absorb the check, and finish with your hands free.
_(pause: 2s)_
15. And when the slide comes early and the lane closes, you don't force it. You pull it out, move it, and take him again next time.
_(pause: 2s)_
16. Now visualize the next play.
_(pause: 0.8s)_
17. Late game, they put their best pole on you and shade the double. You beat the shut-off, catch on the move, and finish before the slide arrives — one dodge, one finish, still yours.
_(pause: 2s)_
### Lacrosse · Attack · VIZ — See the field
<!-- slug: viz-lax-attack-see-the-field | file: components/pregame/audio/clips-lacrosse.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball snapping into pockets in warmups.
_(pause: 1s)_
3. Hear cleats on the turf, a coach calling out the lines.
_(pause: 2s)_
4. You feel the field under your feet.
_(pause: 2.2s)_
5. Feel your gloves close around the shaft.
_(pause: 2.2s)_
6. Feel your helmet settle, the chin strap snug.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You set up at X, ball in your stick. Slow breath. You see the whole offense in front of you.
_(pause: 0.25s)_
9. You drive hard from X and feel the defense tilt — the slide is coming.
_(pause: 2s)_
10. You draw the pole all the way in, then snap the feed to the crease.
_(pause: 2s)_
11. Your man catches and finishes in one touch. You made that goal happen.
_(pause: 2s)_
12. Next trip, you skip it to the weakside shooter for a catch-and-shoot — right on his hands, top shelf.
_(pause: 2s)_
13. See yourself run the offense.
_(pause: 2s)_
14. You hit the cutter coming off the crease, you come off a pick off-ball and bury the catch-and-shoot, you one-more it on the man-up until the open man has it.
_(pause: 2s)_
15. And when the defense takes the feed away, you don't press. You settle it, wind it, and run the set on time.
_(pause: 2s)_
16. Now visualize the next play.
_(pause: 0.8s)_
17. Their clear breaks out and you ride hard from the front — you force the errant pass, win it back, and find the open man before their defense can breathe.
_(pause: 2s)_
### Lacrosse · Midfield · VIZ — Push the ball
<!-- slug: viz-lax-midfield-push-the-ball | file: components/pregame/audio/clips-lacrosse.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball snapping into pockets in warmups.
_(pause: 1s)_
3. Hear cleats on the turf, a coach calling out the lines.
_(pause: 2s)_
4. You feel the field under your feet.
_(pause: 2.2s)_
5. Feel your gloves close around the shaft.
_(pause: 2.2s)_
6. Feel your helmet settle, the chin strap snug.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You break the midline on the fly, fresh legs. Slow breath. The middle of the field is yours.
_(pause: 0.25s)_
9. A ground ball squirts loose at the midline. You get low, scoop it clean through traffic, and push.
_(pause: 2s)_
10. You're up the field in three strides, drawing a pole, numbers ahead.
_(pause: 2s)_
11. You hit the trailer, fill the lane, and the break ends in the back of the net.
_(pause: 2s)_
12. Next shift, you dodge from up top, split the short-stick, get downhill, and rip it far pipe off the run.
_(pause: 2s)_
13. See yourself push the pace.
_(pause: 2s)_
14. Off the faceoff wing you take it end to end, you invert and dodge the pole from X, you sub on fresh and go before the defense sets.
_(pause: 2s)_
15. And when the break isn't there, you don't force the hero pass. You slow it down, settle it, and let the offense work.
_(pause: 2s)_
16. Now visualize the next play.
_(pause: 0.8s)_
17. Tie game, you trail the break — you catch the swing pass, step into a time-and-room shot, and put it away like you've done it a thousand times.
_(pause: 2s)_
### Lacrosse · Midfield · VIZ — Cover both ends
<!-- slug: viz-lax-midfield-cover-both-ends | file: components/pregame/audio/clips-lacrosse.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball snapping into pockets in warmups.
_(pause: 1s)_
3. Hear cleats on the turf, a coach calling out the lines.
_(pause: 2s)_
4. You feel the field under your feet.
_(pause: 2.2s)_
5. Feel your gloves close around the shaft.
_(pause: 2.2s)_
6. Feel your helmet settle, the chin strap snug.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You pick up your man at the midline as the ball turns over. Slow breath. Both ends of this field belong to you.
_(pause: 0.25s)_
9. Their middie dodges and you slide over, break up the lane, and force the bad feed.
_(pause: 2s)_
10. The ball hits the turf and you're on it — man-ball, scoop, protect it.
_(pause: 2s)_
11. You start the break the other way and hit the outlet before their ride can set.
_(pause: 2s)_
12. Deep in the fourth, gassed at the end of a long defensive possession, you dig in, keep your feet moving, and get the stop.
_(pause: 2s)_
13. See yourself own both ends.
_(pause: 2s)_
14. You ride your man hard on the clear and force the turnover, you win the wing battle at the faceoff, you match their best middie and keep him topside all night.
_(pause: 2s)_
15. And when your legs are screaming, you don't cheat the backcheck. One more sprint, take away the middle, then get off and recover.
_(pause: 2s)_
16. Now visualize the next play.
_(pause: 0.8s)_
17. Their fast break is coming downhill — you backcheck through the middle, force it wide, and turn their best chance into a low-angle nothing shot.
_(pause: 2s)_
### Lacrosse · Defense · VIZ — Lock him down
<!-- slug: viz-lax-defense-lock-him-down | file: components/pregame/audio/clips-lacrosse.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball snapping into pockets in warmups.
_(pause: 1s)_
3. Hear cleats on the turf, a coach calling out the lines.
_(pause: 2s)_
4. You feel the field under your feet.
_(pause: 2.2s)_
5. Feel your gloves close around the long pole.
_(pause: 2.2s)_
6. Feel your helmet settle, the chin strap snug.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You pick up their attackman at X, pole out in front. Slow breath. This matchup is yours all night.
_(pause: 0.25s)_
9. He drives topside and you move your feet, stay in his hands, and force him back behind the cage.
_(pause: 2s)_
10. He tries again — you break down, throw one clean poke, and knock the ball off his bottom hand.
_(pause: 2s)_
11. You take away his strong hand, ride him off his spot, and the possession dies with him standing at X.
_(pause: 2s)_
12. The slide call comes and you're there on time — you wall up, force the bad shot, and your goalie eats it easy.
_(pause: 2s)_
13. See yourself erase your man.
_(pause: 2s)_
14. You approach under control, no wild trail check, keep him topside where your help lives, and quarterback the slide package loud enough for the whole defense to hear.
_(pause: 2s)_
15. And when he does beat you a step, you don't panic and you don't chase the highlight check. You recover to his hands, trust the slide, and win the next one.
_(pause: 2s)_
16. Now visualize the next play.
_(pause: 0.8s)_
17. Last two minutes, one-goal game, their best dodger isolates on you — you move your feet, force him to his weak hand, deny the shot he wants, and the stop is yours.
_(pause: 2s)_
### Lacrosse · Defense · VIZ — Take it the other way
<!-- slug: viz-lax-defense-take-it-the-other-way | file: components/pregame/audio/clips-lacrosse.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball snapping into pockets in warmups.
_(pause: 1s)_
3. Hear cleats on the turf, a coach calling out the lines.
_(pause: 2s)_
4. You feel the field under your feet.
_(pause: 2.2s)_
5. Feel your gloves close around the long pole.
_(pause: 2.2s)_
6. Feel your helmet settle, the chin strap snug.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You line up on the faceoff wing, long pole in your gloves. Slow breath. The ground ball is about to be yours.
_(pause: 0.25s)_
9. The ball spills to the wing and you win it in traffic — low hips, two hands, scoop through.
_(pause: 2s)_
10. You protect it through the check, look up, and the field opens in front of you.
_(pause: 2s)_
11. You push past midfield, draw a short stick, and feed the break — shot, goal, started by your stick.
_(pause: 2s)_
12. Next possession you throw a lift check at the perfect moment, strip it clean, and go the other way with it.
_(pause: 2s)_
13. See yourself turn defense into offense.
_(pause: 2s)_
14. You jump the passing lane, you clean up the clear under a hard ride, you stand a middie up in transition and force the reset — your pole is a weapon at both ends.
_(pause: 2s)_
15. And when the numbers aren't there, you don't force the carry. You find the outlet, move it smart, and get back to your end.
_(pause: 2s)_
16. Now visualize the next play.
_(pause: 0.8s)_
17. A caused turnover in your own end — you scoop it, beat the first rider, carry it over midfield with your head up, and hit the open middie in stride for the finish.
_(pause: 2s)_
### Lacrosse · FOGO · VIZ — Win the clamp
<!-- slug: viz-lax-fogo-win-the-clamp | file: components/pregame/audio/clips-lacrosse.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball snapping into pockets in warmups.
_(pause: 1s)_
3. Hear cleats on the turf, a coach calling out the lines.
_(pause: 2s)_
4. You feel the field under your feet.
_(pause: 2.2s)_
5. Feel your gloves close around the shaft.
_(pause: 2.2s)_
6. Feel your helmet settle, the chin strap snug.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You walk to the X and set your feet at the dot. Slow breath. This draw is one rep, and it's yours.
_(pause: 0.25s)_
9. Down, set — the whistle blows and your clamp fires first.
_(pause: 2s)_
10. You beat him to the ball and rake it back to your wing side, clean.
_(pause: 2s)_
11. Your wing scoops it, and your offense has the ball because of you.
_(pause: 2s)_
12. Next draw he counters fast, so you adjust — over the top, win the pull, exit to open field with it on your stick.
_(pause: 2s)_
13. See yourself win the dot.
_(pause: 2s)_
14. You read his tendency between draws, get lower than him on the whistle, win the leverage battle, and come out clean, draw after draw.
_(pause: 2s)_
15. And when he wins the clamp, you don't quit on the rep. You tie him up, let your wing win the fifty-fifty, and reset for the next whistle.
_(pause: 2s)_
16. Now visualize the next play.
_(pause: 0.8s)_
17. Fourth quarter, one-goal game, the big draw — quick hands on the whistle, clamp, pop it to space, scoop, and your team has the ball when it matters most.
_(pause: 2s)_
### Lacrosse · FOGO · VIZ — Win the wing
<!-- slug: viz-lax-fogo-win-the-wing | file: components/pregame/audio/clips-lacrosse.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball snapping into pockets in warmups.
_(pause: 1s)_
3. Hear cleats on the turf, a coach calling out the lines.
_(pause: 2s)_
4. You feel the field under your feet.
_(pause: 2.2s)_
5. Feel your gloves close around the shaft.
_(pause: 2.2s)_
6. Feel your helmet settle, the chin strap snug.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You crouch at the dot with your wings set. Slow breath. Whatever happens on this whistle, the ball comes out yours.
_(pause: 0.25s)_
9. The whistle blows, the clamp battle stalls, and the ball squirts into the scrum.
_(pause: 2s)_
10. You stay on it — low hips, feet churning, and you come out of the pile with the ball in your stick.
_(pause: 2s)_
11. You hit your outlet, get off the field clean, and let the offense run.
_(pause: 2s)_
12. Next draw you win it forward, scoop it in stride, and push it yourself — the defense isn't set, and you feed the fast break before they can slide.
_(pause: 2s)_
13. See yourself win the battle after the whistle.
_(pause: 2s)_
14. You win the wing exchange with your middie, you battle the fifty-fifty until it's yours, you draw the violation and take the free possession.
_(pause: 2s)_
15. And after a loss at the dot, you reset fast — next whistle, quicker hands, and the last draw stays behind you.
_(pause: 2s)_
16. Now visualize the next play.
_(pause: 0.8s)_
17. The ball is loose on the wing with their pole bearing down — you get there first, body between him and the ball, scoop through clean, and turn one ground ball into the possession that becomes a goal.
_(pause: 2s)_
### Lacrosse · Goalie · VIZ — Make the save
<!-- slug: viz-lax-goalie-make-the-save | file: components/pregame/audio/clips-lacrosse.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball snapping into pockets in warmups.
_(pause: 1s)_
3. Hear cleats on the turf, a coach calling out the lines.
_(pause: 2s)_
4. You feel the crease dirt under your feet.
_(pause: 2.2s)_
5. Feel your gloves close around the shaft.
_(pause: 2.2s)_
6. Feel your chest pad settle, the helmet snug.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You step into the cage and set your angle. Slow breath. The next shot is all that exists.
_(pause: 0.25s)_
9. Their shooter winds up from twelve yards and you track it all the way off the stick.
_(pause: 2s)_
10. Your hands drive to the ball — stick-side high, and you smother it.
_(pause: 2s)_
11. Save. You hear your defense exhale, and your eyes are already up the field.
_(pause: 2s)_
12. Next possession, a low bouncer through traffic — you find it late, drop the stick, and kick it out to the corner, no rebound.
_(pause: 2s)_
13. See yourself own the cage.
_(pause: 2s)_
14. You set your angle early, square up to every shot, take away the far pipe, and beat the step-down shooters with your hands, quarter after quarter.
_(pause: 2s)_
15. And when one gets by you, you don't replay it. You set your feet, call out the defense, and take the next shot as its own.
_(pause: 2s)_
16. Now visualize the next play.
_(pause: 0.8s)_
17. Man-down, point-blank on the crease — you hold your ground, force his hands, make the desperation save, and steer the rebound to the corner where your pole cleans it up.
_(pause: 2s)_
### Lacrosse · Goalie · VIZ — Start the clear
<!-- slug: viz-lax-goalie-start-the-clear | file: components/pregame/audio/clips-lacrosse.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball snapping into pockets in warmups.
_(pause: 1s)_
3. Hear cleats on the turf, a coach calling out the lines.
_(pause: 2s)_
4. You feel the crease dirt under your feet.
_(pause: 2.2s)_
5. Feel your gloves close around the shaft.
_(pause: 2.2s)_
6. Feel your chest pad settle, the helmet snug.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You set up in the cage and call out the defense — who's hot, who has two. Slow breath. This defense runs on your voice.
_(pause: 0.25s)_
9. The shot comes and you make the save, ball socked away in your stick.
_(pause: 2s)_
10. Your eyes are up before the whistle — the break middie is streaking up the wing.
_(pause: 2s)_
11. You hit him in stride. Save and go, and four seconds later it's a scoring chance at the other end.
_(pause: 2s)_
12. Next stop, their ride comes hard — you stay patient behind the cage, find the open man through the pressure, and the clear goes off clean.
_(pause: 2s)_
13. See yourself run the field from the crease.
_(pause: 2s)_
14. You direct the slide package before the shot, you control every rebound to the corner, you quarterback the clear past midfield — the whole field organized from your voice.
_(pause: 2s)_
15. And when a clear gets rode and turned, you don't go quiet. You reset the defense, call the next slide, and take the next save.
_(pause: 2s)_
16. Now visualize the next play.
_(pause: 0.8s)_
17. First save of the game, early — warm hands, clean catch, one crisp outlet to the wing, and the whole defense settles because you did.
_(pause: 2s)_
## Hard Moment Clips — Attack

### Lacrosse · Attack · turnover
<!-- slug: hm-lax-attack-turnover | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You force the dodge into the double at the top of the box. Two poles close and the ball pops loose. They scoop it, and it's a fast break the other way while you're still standing there.
_(pause: 1.5s)_
3. Your stick drops to your hip and your feet stop moving. Your eyes chase the ball up the field. The thought hits: I can't be trusted with the ball.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That turnover is over. It bought them one possession, not the rest of your night.
_(pause: 2s)_
6. Next touch, take what's there — move it early if the double comes, dodge when the matchup is yours, and ride hard the second it's loose.
_(pause: 2s)_
### Lacrosse · Attack · shut-off
<!-- slug: hm-lax-attack-shut-off | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Their best pole picks you up at the midline and never leaves. He face-guards you a full quarter — no touches, no looks, the offense running five-on-five while you drag him around the field.
_(pause: 1.5s)_
3. Your gloves squeeze a shaft you haven't used in ten minutes and your eyes keep drifting to the bench. The thought hits: I'm invisible out here — I'm nothing without the ball.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. A shut-off is the opposite of invisible — they spent their best defender on you because you're the one they fear. Every yard you drag him opens the field for five teammates.
_(pause: 2s)_
6. Next possession, make it cost them — set the pick at X, cut hard through the crease, and be ready the instant one feed sneaks through.
_(pause: 2s)_
### Lacrosse · Attack · penalty
<!-- slug: hm-lax-attack-penalty | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Off-ball, you shove your man in the back right in front of the ref. Flag down. You jog to the box and watch their extra-man offense set up, your team a man down because of you.
_(pause: 1.5s)_
3. From the box your knee won't stop bouncing and your eyes lock on the penalty clock. The thought hits: if they score here, that's on me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The whistle happened. Learn from it, then compete clean.
_(pause: 2s)_
6. When the door opens, sprint out ready — find the ball, settle into your spot, and play the next possession with your feet instead of your hands.
_(pause: 2s)_
### Lacrosse · Attack · coach-yells
<!-- slug: hm-lax-attack-coach-yells | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You forced another dodge into the slide and coach pulls you for a shift. He's loud about it — the whole sideline hears exactly what he thinks of that decision.
_(pause: 1.5s)_
3. Your chin drops and you pick at the mesh of your pocket instead of looking at him. The thought hits: he doesn't trust my hands anymore.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The volume is not the verdict. Take the correction. Leave the shame.
_(pause: 2s)_
6. When you go back on, prove the read, not the point — take the first open look, move it when the double comes, and let the game come back to you.
_(pause: 2s)_
### Lacrosse · Attack · benched
<!-- slug: hm-lax-attack-benched | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. A cold stretch, and coach sits you. You stand at the box and watch the second unit run your offense — and score without you. The bench gets longer every minute you're on it.
_(pause: 1.5s)_
3. Your helmet is still on and your gloves stay wrapped around your stick like you're going back any second. The thought hits: that's it, I lost my spot.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The bench has your body for a stretch. It does not have your mind.
_(pause: 2s)_
6. Watch their poles like a scout — where the slide comes from, who recovers slow — and carry that with you the moment your name is called.
_(pause: 2s)_
### Lacrosse · Attack · nervous
<!-- slug: hm-lax-attack-nervous | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Warmups are done and you can see him across the field — the lockdown pole they send at everyone's best attackman. College coaches are on the hill with clipboards, and everyone knows who he's covering.
_(pause: 1.5s)_
3. Your mouth is dry and you keep re-taping the same spot on your shaft. The thought hits: what if he erases me today, in front of all of them.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you.
_(pause: 2s)_
6. First possession, touch the ball early — one clean catch, one simple pass, one hard cut — and let the game get small again.
_(pause: 2s)_
### Lacrosse · Attack · start-slow
<!-- slug: hm-lax-attack-start-slow | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Your first dodge gets stripped. Your next shot sails high and wide. Ten minutes in, nothing has found the corner and your hands feel like they belong to somebody else.
_(pause: 1.5s)_
3. You're gripping the shaft tighter on every touch and rushing your release before the shot is there. The thought hits: I'm pressing already, and it's still the first quarter.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Cold hands warm up by playing, not by squeezing. The first quarter is not the game.
_(pause: 2s)_
6. Next touch, slow it down — catch it clean, make the easy pass, cut without the ball, and let your shot come back one simple play at a time.
_(pause: 2s)_
### Lacrosse · Attack · fall-behind-early
<!-- slug: hm-lax-attack-fall-behind-early | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. It's four to nothing before you've settled in. Every trip down the field you can feel it — the pull to force your dodge, to answer the whole run yourself, right now.
_(pause: 1.5s)_
3. Your first step is firing before the play develops and your eyes have stopped scanning for the open man. The thought hits: I have to get these goals back myself.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That run is over. Get one good possession, then get the next one.
_(pause: 2s)_
6. Take what the defense gives — dodge when it's there, feed when the slide comes — and let the comeback stack one possession at a time.
_(pause: 2s)_
### Lacrosse · Attack · rode-out
<!-- slug: hm-lax-attack-rode-out | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The clear comes to you at the midline and their ride swarms. You catch it, get pinned on the sideline, and throw it away — ten seconds later it's in your own net.
_(pause: 1.5s)_
3. Your eyes drop to the turf and your jog back to X slows to a walk. The thought hits: I gave it right back — I handed them that goal.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That clear is over and it's already on the board. The next one only needs your feet.
_(pause: 2s)_
6. Next ride, do the simple thing — come back hard to the ball, protect it through the check, and move it early before the pressure closes.
_(pause: 2s)_
## Hard Moment Clips — Midfield

### Lacrosse · Midfield · turnover
<!-- slug: hm-lax-midfield-turnover | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Transition, numbers coming, and you try the cross-field feed over two heads. It hangs. Their pole picks it out of the air, and now the break is going the other direction.
_(pause: 1.5s)_
3. Your gloves smack together and you're stuck at midfield watching the play run away from you. The thought hits: I tried to do too much again.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That feed is over. One turnover doesn't get to call the rest of your game.
_(pause: 2s)_
6. Next transition, take the simple outlet first — hit the closest stick, fill your lane, and let the break come from your legs, not one hero pass.
_(pause: 2s)_
### Lacrosse · Midfield · dodged
<!-- slug: hm-lax-midfield-dodged | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're the short stick and they hunt you. Their best middie takes you topside, blows past your hip, and scores — right in front of your bench.
_(pause: 1.5s)_
3. Your feet felt stuck in the turf, and now your head is on a swivel to see who saw it. The thought hits: I got cooked, and everybody watched it happen.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He won that dodge. He does not own the next one.
_(pause: 2s)_
6. Next matchup, sit lower in your stance, give a step of cushion, and force him into the slide — make him beat five of you this time.
_(pause: 2s)_
### Lacrosse · Midfield · penalty
<!-- slug: hm-lax-midfield-penalty | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're late on the slide, so you reach — the slash catches his gloves and the flag flies. Man-down, and their extra-man unit jogs on while you kneel at the box.
_(pause: 1.5s)_
3. Your head shakes inside your helmet and you slap the turf once with your glove. The thought hits: I just handed them a goal — that's my man-down.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The whistle happened. Learn from it, then compete clean.
_(pause: 2s)_
6. Out of the box, sprint back into the play — leave earlier on the next slide, arrive under control, and trust your feet instead of your reach.
_(pause: 2s)_
### Lacrosse · Midfield · shut-off
<!-- slug: hm-lax-midfield-shut-off | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. They put a pole on you up top and he's in your gloves on every touch. Your dodge — the thing you're out there for — isn't there. You can't get your hands free to shoot or even feed.
_(pause: 1.5s)_
3. You keep switching hands without going anywhere and your feet are dancing in place. The thought hits: they took my dodge away, and I've got nothing else.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He took one tool, not the toolbox. A pole chasing you up top means a short stick is alone somewhere else.
_(pause: 2s)_
6. Move the fight — invert from X, set the pick to force the switch, cut backdoor while he ball-watches, and take your dodge back the moment he rests.
_(pause: 2s)_
### Lacrosse · Midfield · failed-clear
<!-- slug: hm-lax-midfield-failed-clear | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Two minutes of defense and you're gassed, hands on your shorts. The save comes, the outlet finds you, and coach wants it pushed. Halfway up the sideline your legs die and the ride strips it clean.
_(pause: 1.5s)_
3. Your lungs are burning and your stick feels like it weighs ten pounds. The thought hits: no legs, no clear — I've got nothing left.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Empty legs mean you defended. They come back one shift at a time.
_(pause: 2s)_
6. Next clear on tired legs, skip the hero run — bang it ahead to the open outlet early, get to the box, and let fresh legs carry it over.
_(pause: 2s)_
### Lacrosse · Midfield · coach-yells
<!-- slug: hm-lax-midfield-coach-yells | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The whistle stops play and coach subs you off at the box for the offensive specialist — again. On your way past he barks about your last feed, and the bench goes quiet.
_(pause: 1.5s)_
3. You drop onto the bench and yank your helmet half off, jaw working. The thought hits: I'm just a legs guy to him — he doesn't see the rest of my game.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The volume is not the verdict. Take the correction. Leave the shame.
_(pause: 2s)_
6. Next run, play your whole game loud — win the ground ball, make the smart feed, finish the backcheck — and let the film argue for you.
_(pause: 2s)_
### Lacrosse · Midfield · benched
<!-- slug: hm-lax-midfield-benched | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The rotation tightens and your runs stop coming. You watch two full quarters from the box, helmet on, waiting for a tap that doesn't come.
_(pause: 1.5s)_
3. You bounce on your toes at every whistle, then rock back on your heels when it's not you. The thought hits: I lost the run, and I don't know when it's coming back.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Stay in it. The next run can come off a single whistle.
_(pause: 2s)_
6. Be the first one who knows the plan — track the matchups, keep your legs warm at the box, and hit the field at full speed, not half.
_(pause: 2s)_
### Lacrosse · Midfield · nervous
<!-- slug: hm-lax-midfield-nervous | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. First midfield, opening whistle, and you're matched against their top line. Everyone will see your motor tonight — both ends, every shift, no place to hide in the middle of the field.
_(pause: 1.5s)_
3. Your legs feel light and buzzy in warmups and you keep checking your stick like it changed. The thought hits: what if I'm gassed by the second quarter and everyone sees it.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you.
_(pause: 2s)_
6. First shift, spend it simple — win your first ground ball, make one clean outlet, finish the backcheck — and let your motor find its rhythm.
_(pause: 2s)_
### Lacrosse · Midfield · start-slow
<!-- slug: hm-lax-midfield-start-slow | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Your legs are flat from the first whistle. You're a step late to the ground ball, a step behind your man, a step slow filling the lane — both ends, all first quarter.
_(pause: 1.5s)_
3. Your strides feel heavy and short, and you're watching plays happen a beat before you react. The thought hits: I need to get my motor going before this becomes a hole.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Flat legs are a first-quarter fact, not the whole night. Your motor warms up by running.
_(pause: 2s)_
6. Pick one sprint to win right now — next ground ball, next backcheck — and let one full-speed play drag the rest of your game up with it.
_(pause: 2s)_
### Lacrosse · Midfield · fall-behind-early
<!-- slug: hm-lax-midfield-fall-behind-early | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Down four in the first quarter, and the runner in you wants to fix it alone — take every wing, push every clear, dodge every possession, end to end until the scoreboard changes.
_(pause: 1.5s)_
3. You're still on the field when your shift should be over, chest heaving, waving off the sub. The thought hits: if I come off, we don't come back.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That run is over. One stop, one clear, then one score.
_(pause: 2s)_
6. Trust the rotation — take your shift, empty it at both ends, get off, and come back fresh enough to actually win your matchup.
_(pause: 2s)_
## Hard Moment Clips — Defense

### Lacrosse · Defense · turnover
<!-- slug: hm-lax-defense-turnover | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You win the ground ball, and their ride is on you before you look up. You force the outlet through a stick and it deflects straight to their attackman — a free possession, twelve yards from your own goal.
_(pause: 1.5s)_
3. Your pole hangs in the air where the pass left it and your feet backpedal hard toward the crease. The thought hits: I gave them a free one at the worst spot on the field.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The giveaway is done. What happens next is defense, and defense is your job.
_(pause: 2s)_
6. Sprint to your spot, call out the hot slide, and take the next ten seconds back — the stop is still there to be made.
_(pause: 2s)_
### Lacrosse · Defense · dodged
<!-- slug: hm-lax-defense-dodged | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Their attackman takes you topside and beats you to GLE — or out in the open field, a quicker middie splits you at the midline. Either way it ends the same. The ball is in your net, and it was your man.
_(pause: 1.5s)_
3. Your feet felt like they were in cement, and now your pole drags as you circle behind the cage. The thought hits: I'm a liability out here.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He won that dodge. He does not own the next one.
_(pause: 2s)_
6. Next approach, break down two steps earlier, force him to his weak hand, and let your feet do the talking — no lunge, no gamble.
_(pause: 2s)_
### Lacrosse · Defense · penalty
<!-- slug: hm-lax-defense-penalty | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. He drives, you're beat by half a step, and your cross-check lands square in his numbers. Flag down. A one-minute personal, and you watch from the box while your defense kills a full minute of six-on-five.
_(pause: 1.5s)_
3. Your gloves grip the railing and your eyes bounce between the penalty clock and the crease. The thought hits: a whole minute, and it's on me if they bury one.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The whistle happened. Learn from it, then compete clean.
_(pause: 2s)_
6. When you step back on, play position first — feet to his hips, pole on his gloves, and make him earn every yard without giving the ref a reason.
_(pause: 2s)_
### Lacrosse · Defense · shut-off
<!-- slug: hm-lax-defense-shut-off | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You win the ground ball and take off — the pole pushing pace, your weapon. But their middies wall off the middle, there's no outlet, and they ride you backward until the push dies at midfield.
_(pause: 1.5s)_
3. Your legs are still churning with nowhere to go, and you're checking over both shoulders for help that isn't there. The thought hits: I killed our break — I should have gotten it off my stick.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. A dead break isn't a dead possession. You kept the ball; the game just slowed down.
_(pause: 2s)_
6. Next push, read it early — numbers ahead, go; wall coming, hit the middie behind you and let the offense settle it.
_(pause: 2s)_
### Lacrosse · Defense · failed-clear
<!-- slug: hm-lax-defense-failed-clear | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You lift his gloves, strip it clean, and the stop is right there — then your clear sails over the middie's head at midfield. They scoop it and score in transition before your defense can turn around.
_(pause: 1.5s)_
3. You're frozen at midfield watching it happen, pole slack in your hands. The thought hits: I turned a stop into a goal.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The takeaway was real, and the throw was one throw. Neither one gets to run your next shift.
_(pause: 2s)_
6. Next clear, eyes up before the stick moves — closest outlet first, run it yourself if the lane is there, and make the simple play that gets it out.
_(pause: 2s)_
### Lacrosse · Defense · coach-yells
<!-- slug: hm-lax-defense-coach-yells | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The slide was yours and you were late — goal. Next possession, you lose the man-ball at your own feet. Coach is screaming your name across the field, and the whole defense hears every word.
_(pause: 1.5s)_
3. You crouch lower in your stance and stare at the turf while he goes. The thought hits: I can't do anything right back here tonight.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The volume is not the verdict. Take the correction. Leave the shame.
_(pause: 2s)_
6. Reset your feet and your voice — call the next slide before coach can, get two hands on the next ground ball, and stack one clean possession.
_(pause: 2s)_
### Lacrosse · Defense · benched
<!-- slug: hm-lax-defense-benched | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Beaten twice in a quarter, and coach makes the change. You watch the third pole take your matchup, and every slide call from the sideline sounds like a sentence about you.
_(pause: 1.5s)_
3. Your helmet stays buckled and you chew your mouthpiece, eyes locked on the man who isn't yours right now. The thought hits: they don't trust me on-ball anymore.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The bench has your body for a few shifts. It does not have your mind.
_(pause: 2s)_
6. Stand next to the coordinator and talk the defense — then when your number comes back, win the first touch and let the trust follow.
_(pause: 2s)_
### Lacrosse · Defense · nervous
<!-- slug: hm-lax-defense-nervous | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Their attackman is committed to a D1 school, and coach gives him to you. All week you've watched his film. Now he's across the field in warmups, and he looks even quicker in person.
_(pause: 1.5s)_
3. You keep re-gripping the pole and rolling your neck against the pads. The thought hits: what if he takes me every single time.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you.
_(pause: 2s)_
6. Win the first five seconds of the first matchup — good approach, low stance, pole on his gloves — and let the night start on your terms.
_(pause: 2s)_
### Lacrosse · Defense · start-slow
<!-- slug: hm-lax-defense-start-slow | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. First quarter, and your feet aren't moving. Your man gets topside once, then again. You're half a step late to the slide, half a step slow to the ground ball — nothing terrible yet, but it's coming.
_(pause: 1.5s)_
3. Your heels keep landing flat and your stance rises a little more every possession. The thought hits: settle down before this snowballs into a bad night.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. A slow first quarter is a warning light, not a wreck. You fix it with your feet.
_(pause: 2s)_
6. Next possession, drop your hips, take two hard approach steps, and win one on-ball stop — the night settles when your stance does.
_(pause: 2s)_
### Lacrosse · Defense · fall-behind-early
<!-- slug: hm-lax-defense-fall-behind-early | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Down four early, and the weight lands where it always lands — on the defense. Hold the crease, quarterback the slides, keep it from getting worse while the offense finds itself.
_(pause: 1.5s)_
3. Your shoulders ride up around your ears and your slide calls get quieter every possession. The thought hits: if I crack back here, this game is gone.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That run is over. Get one stop, then get the ball out clean.
_(pause: 2s)_
6. Shrink the job — win this possession, talk the slide package loud, clear it clean, and let the scoreboard catch up on its own time.
_(pause: 2s)_
### Lacrosse · Defense · clear-yips
<!-- ⚠⚠ CLINICALLY GATED — authored but WITHHELD from the Step-02 picker (roleAdversities omission in sport-registry.ts, FV-119 pattern) until clinical-advisor sign-off. See docs/lacrosse-module-map.md §4. Worth-register authorized in this cell only, per docs/pregame-script-style.md "The gated cells". Do not enable without KC + clinical. -->
<!-- slug: hm-lax-defense-clear-yips | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The save is made, the ride is soft, and the outlet is ten easy yards — a pass you've thrown your whole life. It bounces. The next one you double-clutch and airmail. Now the easiest throw on the field is the one you can't feel.
_(pause: 1.5s)_
3. Your top hand strangles the pole and your feet stop moving before every throw. The thought hits: something is wrong with me — I can't even make the easy one anymore.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. This is one hard night in your hands, not the thousands of clean outlets you've already thrown. It doesn't get to become the truth about you.
_(pause: 2s)_
6. Next clear, shrink it — soft top hand, pick one number to hit, step at him, and let it go without a rehearsal.
_(pause: 2s)_
7. Your worth was settled before warmups and it does not ride on this throw, so throw it free.
_(pause: 2s)_
## Hard Moment Clips — FOGO

### Lacrosse · FOGO · turnover
<!-- slug: hm-lax-fogo-turnover | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You win the clamp clean — the hard part is done. Then you rush the exit, and their wing lifts your gloves and pops it loose. They scoop it going the other way, and your win turns into their break.
_(pause: 1.5s)_
3. Your eyes drop to where the ball was and your feet stall at the dot. The thought hits: I won the clamp and still lost the ball.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The exit is a skill, same as the clamp. One rushed exit is a rep to clean up, not a mark against the win.
_(pause: 2s)_
6. Next draw, finish the whole rep — clamp it, protect it with your frame, and exit only when your feet are under you.
_(pause: 2s)_
### Lacrosse · FOGO · lose-draws
<!-- slug: hm-lax-fogo-lose-draws | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Three straight draws, three straight losses. His clamp is just quicker tonight. Every loss sends their offense the other way, and you can feel the whole sideline doing the math.
_(pause: 1.5s)_
3. Your forearms burn from squeezing the shaft and you're leaning over the dot before the whistle. The thought hits: I'm losing us this game at the X.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He won those draws. He does not own the next one.
_(pause: 2s)_
6. Change the picture — new counter, lower stance, quicker first move — and make the next whistle a brand-new rep.
_(pause: 2s)_
### Lacrosse · FOGO · violation
<!-- slug: hm-lax-fogo-violation | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Biggest draw of the fourth quarter, and the ref flags you — early movement. Faceoff violation. You never even got to clamp, and the ball walks straight to their offense for free.
_(pause: 1.5s)_
3. Your hands flip the stick over in disgust and your jaw clenches under the chin strap. The thought hits: I gave one away without even fighting for it.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The whistle happened. Learn from it, then compete clean.
_(pause: 2s)_
6. Next draw, take the extra half-second in your stance — still hands, let the whistle fire you, and win it fair off the first move.
_(pause: 2s)_
### Lacrosse · FOGO · coach-yells
<!-- slug: hm-lax-fogo-coach-yells | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Three losses at the dot and coach meets you at the sideline with an earful — the possession game is bleeding out, and in his eyes that's your column of the stat sheet.
_(pause: 1.5s)_
3. You stand there nodding inside your helmet, gloves flexing on the shaft. The thought hits: one more lost draw and I'm done out here.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The volume is not the verdict. Take the correction. Leave the shame.
_(pause: 2s)_
6. Pull one adjustment out of what he said — quicker hands, a new counter — and bring exactly that to the next whistle.
_(pause: 2s)_
### Lacrosse · FOGO · off-the-dot
<!-- slug: hm-lax-fogo-off-the-dot | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Timeout, big draw coming, and coach sends the other FOGO to the X. Your one job, the reason you dress, and the biggest rep of the night belongs to somebody else while you watch from the box.
_(pause: 1.5s)_
3. You're standing at the box with your stick flipped upside down, butt-end in the turf. The thought hits: I have one job, and I just lost it.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Coach picked a matchup for one whistle. He did not close the book on you.
_(pause: 2s)_
6. Watch the draw you didn't take — his clamp timing, the wing setup — and be sharper for the next one, because the next one is coming.
_(pause: 2s)_
### Lacrosse · FOGO · nervous
<!-- slug: hm-lax-fogo-nervous | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Their FOGO is committed — everybody has heard of him. Warmups are over, the opening draw is yours, and the whole bench is watching one rep at the X to see what kind of night this will be.
_(pause: 1.5s)_
3. Your heart bangs under your pads and your fingers keep finding a new grip on the shaft. The thought hits: what if he clamps me clean in front of everyone.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you.
_(pause: 2s)_
6. Make the first rep simple — low stance, fast hands on the whistle, and fight for the tie if the win isn't there. Your wings can finish what you start.
_(pause: 2s)_
### Lacrosse · FOGO · start-slow
<!-- slug: hm-lax-fogo-start-slow | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You drop the first draw. Then the second. Two possessions handed over before your legs are even warm, and the early hole is starting to dig itself at your feet.
_(pause: 1.5s)_
3. You're choking down lower on the shaft than usual and jumping a hair early on the whistle. The thought hits: find the ball fast, before it's three-nothing.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Two draws are two reps, not a night. The whistle count ahead of you is long.
_(pause: 2s)_
6. Reset your setup — feet, grip, breath — and win one clean clamp. One draw turns the dot around.
_(pause: 2s)_
### Lacrosse · FOGO · behind-at-the-dot
<!-- slug: hm-lax-fogo-behind-at-the-dot | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Your team is down three, and now every draw feels like it has to be a win-and-go — clamp it, push it, make the comeback happen yourself, one whistle at a time.
_(pause: 1.5s)_
3. You're sprinting to the X before the ref is set and crouching before your wings are even on. The thought hits: the only way back into this game runs through me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That run is over. Win one clean draw, then the next one.
_(pause: 2s)_
6. Play your rep, not the scoreboard — clamp for the ball, not the hero exit, and let the possessions stack the way they always do.
_(pause: 2s)_
### Lacrosse · FOGO · clamp-yips
<!-- ⚠⚠ CLINICALLY GATED — authored but WITHHELD from the Step-02 picker (roleAdversities omission in sport-registry.ts, FV-119 pattern) until clinical-advisor sign-off. See docs/lacrosse-module-map.md §4. Worth-register authorized in this cell only, per docs/pregame-script-style.md "The gated cells". Do not enable without KC + clinical. -->
<!-- slug: hm-lax-fogo-clamp-yips | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. It's the move you've made ten thousand times — whistle, clamp, ball. And tonight it won't fire. You're not getting beaten by him; your hands just aren't going. Draw after draw, the clamp you own isn't there.
_(pause: 1.5s)_
3. Your knuckles are white inside your gloves and you're rehearsing the move in the air between whistles. The thought hits: it's gone — the one thing I do is gone.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. This is one loud night in your hands, not the ten thousand reps that built your clamp. A skill this trained does not dissolve in a night.
_(pause: 2s)_
6. Strip the rep down — one cue, hands only, fight for the tie and trust your wings — and let the clamp come back on its own clock.
_(pause: 2s)_
7. Nothing at the dot tonight can add to you or subtract from you — you were whole before the first whistle, so fight free.
_(pause: 2s)_
## Hard Moment Clips — Goalie

### Lacrosse · Goalie · throw-away
<!-- slug: hm-lax-goalie-throw-away | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The save is yours, clean. Then the one job after the save — you look off the easy outlet and float the clear into the middle. Their middie picks it and buries it before you're even reset.
_(pause: 1.5s)_
3. Your stick checks up mid-follow-through and your feet are still turned the wrong way in the crease. The thought hits: I did the hard part and gave it away on the easy one.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That clear is gone. It does not take the save with it, and it does not get the next one.
_(pause: 2s)_
6. Next save, breathe before you throw — eyes up, hit the safe outlet first, and make them earn their possessions the long way.
_(pause: 2s)_
### Lacrosse · Goalie · beaten-clean
<!-- slug: hm-lax-goalie-beaten-clean | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Twelve yards, glove side — the shot you eat all practice, the save you make. Tonight it beats you clean over the shoulder, and the cage rings behind you while their bench spills onto the field.
_(pause: 1.5s)_
3. Your head snaps around to look at the net and your gloves squeeze the shaft at your chest. The thought hits: that's a save I make.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He won that shot. He does not own the next one.
_(pause: 2s)_
6. Set your feet, find your angle early, and track the next ball all the way off the stick — your save is still your save.
_(pause: 2s)_
### Lacrosse · Goalie · man-down
<!-- slug: hm-lax-goalie-man-down | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Your pole is in the box and their man-up unit goes to work. The ball zips around the perimeter faster than the slides can rotate, and the backside shooter buries the open look.
_(pause: 1.5s)_
3. You're pointing out the late rotation while the net is still shaking, and your voice comes out thin. The thought hits: I'm supposed to hold the man-down, and they got exactly the look they wanted.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Six on five is tilted math. A man-up goal against is the odds catching you, not the cage falling apart.
_(pause: 2s)_
6. Talk the kill louder — call the rotations early, take away the inside look, and make the even-strength save that swings it back.
_(pause: 2s)_
### Lacrosse · Goalie · soft-goal
<!-- slug: hm-lax-goalie-soft-goal | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. A low, harmless shot from up top — the kind you swallow a hundred times a week. It skips once, sneaks under your stick, and sits in the net. The scoreboard doesn't know it was soft. It just says goal.
_(pause: 1.5s)_
3. You stand frozen on the goal line staring at the ball and your shoulders fold in. The thought hits: I lost us that one, and everyone knows it.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That goal is on the board and it's done growing. The only save that exists now is the next one.
_(pause: 2s)_
6. Reset loud — call the defense back to work, set your angle early, and be square for the next shot, because it's coming.
_(pause: 2s)_
### Lacrosse · Goalie · failed-clear
<!-- slug: hm-lax-goalie-failed-clear | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Save, possession, the whole field ahead — and the ride swallows it. Your outlet gets jumped, the second look isn't there, and the count forces a throw that never had a chance. Turned over, right back in your end.
_(pause: 1.5s)_
3. Your eyes sweep the field twice and find nobody, and your grip climbs the shaft. The thought hits: I can't even get us out of our own end.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. One dead clear is one dead clear. The next one starts fresh off your next save.
_(pause: 2s)_
6. Slow the panic, not the ball — save, breathe, first open stick, and if nothing is there, step out and carry it to the wing yourself to buy time.
_(pause: 2s)_
### Lacrosse · Goalie · coach-yells
<!-- slug: hm-lax-goalie-coach-yells | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The soft one went in two minutes ago and coach hasn't let it go — he's on you from the sideline about the goal, about the quiet crease, about the slides you didn't call. Every word carries.
_(pause: 1.5s)_
3. You're re-tucking the same glove strap over and over and your eyes stay fixed on the far end. The thought hits: he's on me, and I can't erase the one that's already in.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The volume is not the verdict. Take the correction. Leave the shame.
_(pause: 2s)_
6. Give him what he actually asked for — a loud crease. Call the first slide early, name the shooters, and let your voice reset the defense.
_(pause: 2s)_
### Lacrosse · Goalie · pulled
<!-- slug: hm-lax-goalie-pulled | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Five goals in, coach calls time and points to the backup. You hand over the crease in front of everyone and make the long walk to the bench, helmet still on so nobody sees your face.
_(pause: 1.5s)_
3. You sit at the end of the bench, stick flat across your knees, watching someone else warm up in your cage. The thought hits: I got yanked — I'm done here.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The bench has your body for now. It does not have your worth.
_(pause: 2s)_
6. Stay in the game from the bench — tell your defense what you see, back your guy loudly, and be ready if the crease comes back to you tonight.
_(pause: 2s)_
### Lacrosse · Goalie · nervous
<!-- slug: hm-lax-goalie-nervous | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Their offense averages double digits, and there are scouts standing behind your cage with folders. Warmup shots feel fast tonight. The first real one will be faster.
_(pause: 1.5s)_
3. Your knees keep bouncing in your stance and your top glove is sweating through. The thought hits: what if I let in an early soft one with them standing right there.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you.
_(pause: 2s)_
6. Want the first shot — track it hard off the stick, whatever it is — and let one early save settle the whole cage.
_(pause: 2s)_
### Lacrosse · Goalie · start-slow
<!-- slug: hm-lax-goalie-start-slow | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Two goals in the first six minutes and the shots keep coming — your defense is leaking dodges, and you're seeing more rubber in one quarter than most goalies see in a half.
_(pause: 1.5s)_
3. Your feet are half a beat late setting the angle and you're guessing before shooters release. The thought hits: it's going to be one of those nights.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. A heavy first quarter is shot volume, not a sentence. You only ever have to stop the next one.
_(pause: 2s)_
6. Shrink the game to one ball — set early, square up, track it all the way in — and let the saves pile up one at a time.
_(pause: 2s)_
### Lacrosse · Goalie · fall-behind-early
<!-- slug: hm-lax-goalie-fall-behind-early | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Down four before the first horn, and the weight of it settles in the crease with you — steady the defense, start every clear, be the wall the comeback gets built on.
_(pause: 1.5s)_
3. Your stance is getting taller and tighter each possession and your outlet passes are getting rushed. The thought hits: if I don't hold this line, nobody will.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That run is over. Make one save, then start one clean clear.
_(pause: 2s)_
6. Lead the way back in order — next save, next outlet, loud crease — and let the offense handle the scoring part.
_(pause: 2s)_
### Lacrosse · Goalie · save-yips
<!-- ⚠⚠ CLINICALLY GATED — authored but WITHHELD from the Step-02 picker (roleAdversities omission in sport-registry.ts, FV-119 pattern) until clinical-advisor sign-off. See docs/lacrosse-module-map.md §4. Worth-register authorized in this cell only, per docs/pregame-script-style.md "The gated cells". Do not enable without KC + clinical. -->
<!-- slug: hm-lax-goalie-save-yips | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The shots aren't special tonight — you just aren't catching up to them. You flinch on the high ones, freeze on the bounce, and somewhere in the second quarter you realize you've stopped seeing the ball leave the stick.
_(pause: 1.5s)_
3. Your eyes are guessing instead of tracking and your hands are locked at your chest. The thought hits: I can't stop anything — I've lost it.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Tonight your eyes are flooded, not broken. Ten thousand tracked shots don't unlearn themselves in a quarter.
_(pause: 2s)_
6. Make the game tiny — track one ball all the way into your stick, any save at all — and build back from that one.
_(pause: 2s)_
7. You were secure before the first shot and you're secure after the last one, so see the next ball free.
_(pause: 2s)_
