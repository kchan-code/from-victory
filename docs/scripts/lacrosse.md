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

## VIZ Clips — Flagships (position)

### Lacrosse · Attack · VIZ (flagship)
<!-- slug: viz-lax-attack | file: components/pregame/audio/clips-viz-lacrosse.ts -->

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
7. You settle your breathing and prepare for the first possession.
_(pause: 1.25s)_
8. You set up at X with the ball and identify where the first slide will come from.
_(pause: 0.25s)_
9. You split dodge from X, gain a step, and roll back when the defender overplays.
_(pause: 2s)_
10. You turn the corner at GLE, free your hands, and finish low to high at the far pipe.
_(pause: 2s)_
11. The shot reaches the net, and you return to your spot for the next call.
_(pause: 2s)_
12. Next possession, you slip the pick in the two-man game and catch on the move.
_(pause: 2s)_
13. You keep the stick protected through contact and finish inside the far pipe.
_(pause: 2s)_
14. See the next possession develop from up top.
_(pause: 2s)_
15. You use a question-mark dodge to gain separation, and when the double commits, you feed the crease on time.
_(pause: 2s)_
16. When the slide arrives early and closes the lane, you pull the ball out and move it to the open side.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. On the next look, you work away from the shut-off, catch on the move, and release the shot before the slide arrives.
_(pause: 2s)_

### Lacrosse · Midfield · VIZ (flagship)
<!-- slug: viz-lax-midfield | file: components/pregame/audio/clips-viz-lacrosse.ts -->

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
7. You settle your breathing and prepare for the first shift.
_(pause: 1.25s)_
8. You cross midfield on the run and scan the numbers ahead.
_(pause: 0.25s)_
9. A ground ball comes loose at midfield. You get low, scoop through it with two hands, and move it forward.
_(pause: 2s)_
10. You carry into space, draw the pole, and keep your head up.
_(pause: 2s)_
11. You hit the trailer in stride, fill the next lane, and the offense finishes the break.
_(pause: 2s)_
12. Next shift, you split the short-stick from up top, get downhill, and shoot far pipe on the run.
_(pause: 2s)_
13. You recover through midfield and pick up the next assignment.
_(pause: 2s)_
14. See the next defensive possession turn into transition.
_(pause: 2s)_
15. You ride the ball carrier, disrupt the outlet, scoop the ground ball, and move it to the open wing.
_(pause: 2s)_
16. When the numbers disappear, you pull the ball out and let the offense get organized.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. You trail the next break, catch the swing pass, and step into a time-and-room shot to the far side.
_(pause: 2s)_

### Lacrosse · Defense · VIZ (flagship)
<!-- slug: viz-lax-defense | file: components/pregame/audio/clips-viz-lacrosse.ts -->

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
7. You settle your breathing and prepare for the first matchup.
_(pause: 1.25s)_
8. You pick up the attackman at X, keep the pole in front, and confirm where your help is.
_(pause: 0.25s)_
9. He drives topside. You move your feet, stay on his hands, and force him behind the cage.
_(pause: 2s)_
10. He tries again. You break down and place one controlled poke on his bottom hand.
_(pause: 2s)_
11. You take away his strong hand, and he moves the ball back up top.
_(pause: 2s)_
12. On the next dodge, you arrive with the slide, close his hands, and force a low-angle shot the goalie handles.
_(pause: 2s)_
13. The defense collects the ball and starts the clear.
_(pause: 2s)_
14. See yourself communicate through the next possession.
_(pause: 2s)_
15. You approach under control, steer him to his weak hand, call the slide, then scoop the loose ball and hit the outlet.
_(pause: 2s)_
16. When he gains a step, you recover to his hands and trust the slide instead of reaching for a desperate check.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. On a late possession, you keep your leverage, force the dodger to his weak hand, and make him move the ball away from the cage.
_(pause: 2s)_

### Lacrosse · FOGO · VIZ (flagship)
<!-- slug: viz-lax-fogo | file: components/pregame/audio/clips-viz-lacrosse.ts -->

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
7. You settle your breathing and check your grip and stance.
_(pause: 1.25s)_
8. You walk to the X, set your feet at the dot, and prepare for one draw.
_(pause: 0.25s)_
9. Down, set. On the whistle, your clamp gets to the ball first.
_(pause: 2s)_
10. You control the ball and rake it toward your wing.
_(pause: 2s)_
11. Your wing scoops through it and moves the ball to the offense.
_(pause: 2s)_
12. On the next draw, he counters quickly. You go over the top, stop his exit, and pull the ball to space.
_(pause: 2s)_
13. You scoop, protect the stick, and make the outlet.
_(pause: 2s)_
14. See another draw stall under both sticks.
_(pause: 2s)_
15. You stay low, keep pressure on his hands, and direct the loose ball toward your wing.
_(pause: 2s)_
16. When he wins the clamp, you stop the exit, keep the ball contested, and let the wing matchup decide possession.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. On a late draw, you clamp, direct the ball to space, scoop it, and make the short outlet.
_(pause: 2s)_

### Lacrosse · Goalie · VIZ (flagship)
<!-- slug: viz-lax-goalie | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. Keep your eyes closed. See yourself walking onto the field.
_(pause: 1s)_
2. You hear the ball snapping into pockets in warmups.
_(pause: 1s)_
3. Hear cleats on the turf, a coach calling out the lines.
_(pause: 2s)_
4. You feel the crease under your feet.
_(pause: 2.2s)_
5. Feel your gloves close around the shaft.
_(pause: 2.2s)_
6. Feel your chest protector settle, the helmet snug.
_(pause: 2s)_
7. You settle your breathing and set your stance.
_(pause: 1.25s)_
8. You step into the cage, call the hot defender and the second slide, and set your angle.
_(pause: 0.25s)_
9. A shooter winds up from twelve yards, and you track the release off the stick.
_(pause: 2s)_
10. You step toward the shot, drive both hands stick-side high, and control it in the pocket.
_(pause: 2s)_
11. You look upfield and hit the breaking midfielder on the wing.
_(pause: 2s)_
12. The outlet starts transition before the ride can organize.
_(pause: 2s)_
13. On the next shot, you stay square, get the stick to the low bounce first, and control the rebound.
_(pause: 2s)_
14. See the next possession develop from behind the defense.
_(pause: 2s)_
15. You set the angle early, stay square, drive both hands to the step-down shot, and direct the rebound to the corner.
_(pause: 2s)_
16. When one gets by you, you reset your feet, make the defensive calls, and prepare for the next shot.
_(pause: 2s)_
17. Now visualize the next play.
_(pause: 0.8s)_
18. On a man-down feed to the crease, you hold the angle, step to the shot, and steer the rebound to the pole in the corner.
_(pause: 2s)_

## VIZ Clips — Positive Plays (position × library)

### Lacrosse · Attack · VIZ — Beat your man
<!-- slug: viz-lax-attack-beat-your-man | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself at X with the ball, reading your matchup and the first slide.
_(pause: 2s)_
2. You split dodge, gain a step, and roll back when the defender overplays.
_(pause: 2s)_
3. You turn the corner at GLE, free your hands, and finish low to high at the far pipe.
_(pause: 2.5s)_
4. The shot reaches the net, and you return to X for the next possession.
_(pause: 2s)_
5. Next possession, you slip the pick in the two-man game and catch on the move.
_(pause: 2.5s)_
6. You protect the stick through contact and release the shot before the recovery arrives.
_(pause: 2.5s)_
7. When the slide comes early and closes the lane, you keep the stick protected.
_(pause: 2s)_
8. You pull the ball out and move it to the open side.
_(pause: 2.5s)_
9. On the next possession, the defender denies you at X.
_(pause: 2s)_
10. You cut away from the shut-off, catch on the move, and release before the slide arrives.
_(pause: 2.5s)_

### Lacrosse · Attack · VIZ — See the field
<!-- slug: viz-lax-attack-see-the-field | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself at X, scanning the crease and the adjacent slide.
_(pause: 2s)_
2. You drive from X and see the crease defender begin to slide.
_(pause: 2s)_
3. You carry the slide far enough, then deliver the feed to the crease.
_(pause: 2.5s)_
4. Your teammate catches and finishes before the defense can recover.
_(pause: 2s)_
5. Next trip, you send the skip pass to the weak-side shooter's outside shoulder.
_(pause: 2.5s)_
6. On the man-up, you move it one more until the open player has the catch-and-shoot look.
_(pause: 2.5s)_
7. When the defense takes away the inside feed, you keep possession.
_(pause: 2s)_
8. You pull the ball out and restart the set.
_(pause: 2.5s)_
9. On the clear, you take an angle that steers the ball carrier toward the sideline.
_(pause: 2s)_
10. The pass goes to the sideline, where you intercept it and move it to the open teammate.
_(pause: 2.5s)_

### Lacrosse · Attack · VIZ — Finish on the crease
<!-- slug: viz-lax-attack-finish-on-crease | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself on the crease, sealing the defender and showing a target.
_(pause: 2s)_
2. The ball is up top, and your teammate begins the dodge.
_(pause: 2s)_
3. Your defender leaves to slide.
_(pause: 2.5s)_
4. You keep position, turn your shoulders, and open the stick to the feed.
_(pause: 2.5s)_
5. The feed arrives low and firm.
_(pause: 2s)_
6. You receive it with soft hands and keep the head of the stick protected.
_(pause: 2.5s)_
7. You release it in one motion without winding up.
_(pause: 3s)_
8. The quick stick travels low to high inside the far pipe.
_(pause: 3s)_
9. You catch and release before the defender can recover to the crease.
_(pause: 2.5s)_

### Lacrosse · Attack · VIZ — Time and room, step in and rip
<!-- slug: viz-lax-attack-time-and-room | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself up top with the ball and space in front of you.
_(pause: 2s)_
2. The defense stays below you and leaves room for the shot.
_(pause: 2s)_
3. You set your feet and bring your hands away from your body.
_(pause: 2s)_
4. You load on the back foot and step toward the target.
_(pause: 2.5s)_
5. Your hips and shoulders move through the shot together.
_(pause: 2s)_
6. You finish over the front foot with an overhand release.
_(pause: 2.5s)_
7. The ball travels off-stick high.
_(pause: 3s)_
8. The shot reaches the corner before the goalie can set to it.
_(pause: 2s)_
9. You used the available space and completed the shooting motion on balance.
_(pause: 2.5s)_

### Lacrosse · Attack · VIZ — Ride hard, force the turnover
<!-- slug: viz-lax-attack-ride-force-turnover | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself as the first rider, taking away the middle of the field.
_(pause: 2s)_
2. The goalie makes the save and looks for the first outlet.
_(pause: 2s)_
3. You approach on an angle that sends the ball carrier toward the sideline.
_(pause: 2.5s)_
4. He turns his shoulders and looks for the next pass.
_(pause: 2s)_
5. You close on his hands and delay the release.
_(pause: 2.5s)_
6. Under pressure, he sends the pass up the sideline.
_(pause: 2s)_
7. You read the pass and catch it cleanly out of the air.
_(pause: 3s)_
8. You protect the stick and look inside from thirty yards out.
_(pause: 2s)_
9. You move it to the open teammate before the defense finishes matching up.
_(pause: 3s)_

### Lacrosse · Attack · VIZ — Bury the man-up look
<!-- slug: viz-lax-attack-man-up-finish | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself on the man-up, set on the wing as the ball moves around the perimeter.
_(pause: 2s)_
2. The unit keeps the passes firm and moves the defense with each catch.
_(pause: 2s)_
3. The rotation leaves your side open for a moment.
_(pause: 2.5s)_
4. The ball swings to you as the defender begins to close out.
_(pause: 2s)_
5. You catch with your hands ready and step toward the cage.
_(pause: 2.5s)_
6. You have room to release before the rotation reaches you.
_(pause: 2s)_
7. You shoot overhand before the defender closes the space.
_(pause: 3s)_
8. The shot stays low and reaches the far pipe.
_(pause: 2.5s)_
9. You complete the catch-and-shoot look created by the ball movement.
_(pause: 2.5s)_

### Lacrosse · Attack · VIZ — Miss the doorstep, bury the next
<!-- slug: viz-lax-attack-next-look-clean | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself get open on the crease for a close-range feed.
_(pause: 2s)_
2. The feed reaches your stick, and you release before controlling it.
_(pause: 2s)_
3. The shot misses high.
_(pause: 2s)_
4. The ball goes out of bounds, and you turn and ride.
_(pause: 2.5s)_
5. On a later possession, you seal the defender and show your stick again.
_(pause: 2.5s)_
6. The feed returns to the same area.
_(pause: 2s)_
7. You receive it first, keep the hands soft, and make a compact release.
_(pause: 3s)_
8. The quick stick stays low and inside the pipe.
_(pause: 3s)_
9. You run through the crease and pick up the next assignment.
_(pause: 2.5s)_

### Lacrosse · Midfield · VIZ — Push the ball
<!-- slug: viz-lax-midfield-push-the-ball | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself crossing midfield with the ball and scanning the numbers ahead.
_(pause: 2s)_
2. A ground ball comes loose at midfield. You get low and scoop through it with two hands.
_(pause: 2.5s)_
3. You carry into space, draw the pole, and keep your head up.
_(pause: 2s)_
4. You hit the trailer in stride and fill the next lane.
_(pause: 2.5s)_
5. Next shift, you split the short-stick from up top and get downhill.
_(pause: 2.5s)_
6. You keep the stick protected, draw the next defender, and move the ball to the open side.
_(pause: 2.5s)_
7. When the defense matches up and the break is gone, you keep possession.
_(pause: 2s)_
8. You pull the ball out and let the offense get organized.
_(pause: 2.5s)_
9. On the next transition, you trail the play and catch the swing pass.
_(pause: 2s)_
10. You set your feet and take the time-and-room shot to the far side.
_(pause: 2.5s)_

### Lacrosse · Midfield · VIZ — Cover both ends
<!-- slug: viz-lax-midfield-cover-both-ends | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See the ball turn over and pick up the nearest midfielder at the midline.
_(pause: 2s)_
2. The midfielder dodges, and you close the lane without overcommitting.
_(pause: 2.5s)_
3. The pass hits the turf. You call man-ball, scoop through it, and protect the stick.
_(pause: 2s)_
4. You move it to the first outlet and start transition.
_(pause: 2.5s)_
5. On a long defensive possession, you stay connected to the matchup and keep the middle closed.
_(pause: 2.5s)_
6. On the faceoff wing, you box out, track the loose ball, and help secure possession.
_(pause: 2.5s)_
7. Late in the shift, you take the direct route through the middle on the backcheck.
_(pause: 2s)_
8. You force the ball wide, communicate the matchup, then sub through the box.
_(pause: 2.5s)_
9. On the next fast break, you again recover through the middle and identify the most dangerous player.
_(pause: 2s)_
10. The offense is pushed to a low-angle shot that the goalie can track.
_(pause: 2.5s)_

### Lacrosse · Midfield · VIZ — Shoot it on the run
<!-- slug: viz-lax-midfield-shoot-on-the-run | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself filling the lane as the ball swings your way.
_(pause: 2s)_
2. You catch on the move with the stick protected to the outside.
_(pause: 2s)_
3. You keep running and bring your hands away from your body.
_(pause: 2.5s)_
4. You load through the hips without shortening your stride.
_(pause: 2.5s)_
5. Your shoulders and hips turn through the release.
_(pause: 2s)_
6. You release the shot without breaking stride.
_(pause: 3s)_
7. The ball travels overhand toward the far side.
_(pause: 2.5s)_
8. The shot reaches the open space before the goalie finishes moving across.
_(pause: 2.5s)_
9. You complete the shooting motion on balance and continue through the play.
_(pause: 2.5s)_

### Lacrosse · Midfield · VIZ — Both ends in one shift
<!-- slug: viz-lax-midfield-both-ends-shift | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself pick up your man as the ball turns over.
_(pause: 2s)_
2. Their midfielder drives, and you arrive with the first slide.
_(pause: 2s)_
3. You close his hands and force the pass away from the crease.
_(pause: 2.5s)_
4. The pass hits the turf, and you scoop through it with two hands.
_(pause: 2.5s)_
5. You protect the stick and carry into the open side of the field.
_(pause: 2s)_
6. You cross midfield and identify the advantage.
_(pause: 2.5s)_
7. You draw the final defender and pass to the trailer.
_(pause: 3s)_
8. The trailer catches in stride and finishes the transition chance.
_(pause: 3s)_
9. You recover through the middle and prepare for the next substitution.
_(pause: 2.5s)_

### Lacrosse · Midfield · VIZ — Win the ground-ball scrum
<!-- slug: viz-lax-midfield-ground-ball-scrum | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See a loose ball between several players and approach under control.
_(pause: 2s)_
2. You call man-ball and identify the opponent nearest the ball.
_(pause: 2s)_
3. You get your hips low and box the opponent away from the ball.
_(pause: 2.5s)_
4. You keep both hands on the stick and scoop through the ball.
_(pause: 3s)_
5. Contact arrives as you bring the stick tight to your body.
_(pause: 2.5s)_
6. You move out of traffic and protect the head of the stick.
_(pause: 2.5s)_
7. You get your head up and find the open outlet on the wing.
_(pause: 2s)_
8. You deliver the pass to the outside shoulder.
_(pause: 3s)_
9. The outlet receives it and carries the ball into the offensive half.
_(pause: 2.5s)_

### Lacrosse · Midfield · VIZ — Slide early, rotate, get the stop
<!-- slug: viz-lax-midfield-slide-and-rotate | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself off-ball, set as the first slide.
_(pause: 2s)_
2. Their midfielder gains a step and turns toward the middle.
_(pause: 2s)_
3. You leave on the call and meet the dodger before the crease.
_(pause: 2.5s)_
4. You break down, get to his hands, and stop his path to the cage.
_(pause: 3s)_
5. He moves the ball to the player you left.
_(pause: 2.5s)_
6. The second slide and adjacent defenders rotate behind you.
_(pause: 2s)_
7. You recover to the open player created by the rotation.
_(pause: 2.5s)_
8. You close under control and take away the quick feed inside.
_(pause: 3s)_
9. The ball moves back outside, and the defense returns to its shape.
_(pause: 2.5s)_

### Lacrosse · Midfield · VIZ — Cough one up, clear the next clean
<!-- slug: viz-lax-midfield-next-clear-clean | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself receive the outlet near the sideline and turn upfield.
_(pause: 2s)_
2. The ride closes the sideline and removes your forward outlet.
_(pause: 2s)_
3. You force a pass into the middle, and their midfielder intercepts it.
_(pause: 2s)_
4. Possession changes. You sprint back, communicate, and match up.
_(pause: 2.5s)_
5. Later, your defense regains the ball and the outlet comes to you again.
_(pause: 2.5s)_
6. You check the field before the catch and see the sideline pressure coming.
_(pause: 2.5s)_
7. You come back to the ball, move it to the goalie, and cut into space.
_(pause: 2.5s)_
8. The goalie finds the open midfielder, and you fill the next lane.
_(pause: 3s)_
9. The ball crosses midfield, and the offense settles into its set.
_(pause: 2.5s)_

### Lacrosse · Defense · VIZ — Lock him down
<!-- slug: viz-lax-defense-lock-him-down | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself pick up the attackman at X with the pole out in front.
_(pause: 2s)_
2. He drives topside. You move your feet, stay on his hands, and force him behind the cage.
_(pause: 2.5s)_
3. He tries again. You break down and place one controlled poke on his bottom hand.
_(pause: 2.5s)_
4. You take away his strong hand, and he moves the ball back up top.
_(pause: 2.5s)_
5. On the next dodge, you arrive with the slide and force a low-angle shot the goalie handles.
_(pause: 2.5s)_
6. You approach under control, steer him to his weak hand, and make the slide call early.
_(pause: 2.5s)_
7. When he gains a step, you recover to his hands without reaching across his body.
_(pause: 2s)_
8. The slide stops the ball, and you rotate to the open player.
_(pause: 2.5s)_
9. On a late possession, the attackman isolates at X again.
_(pause: 2s)_
10. You maintain leverage, force him to his weak hand, and make him move the ball away from the cage.
_(pause: 2.5s)_

### Lacrosse · Defense · VIZ — Take it the other way
<!-- slug: viz-lax-defense-take-it-the-other-way | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See the ball spill toward the faceoff wing with the long pole in your hands.
_(pause: 2s)_
2. You get your hips low, use two hands, and scoop through traffic.
_(pause: 2s)_
3. You protect the stick through contact and look for the first outlet.
_(pause: 2.5s)_
4. You carry past midfield, draw the short-stick, and move the ball to the open lane.
_(pause: 2.5s)_
5. Next possession, a controlled lift check dislodges the ball.
_(pause: 2.5s)_
6. You scoop it, protect the pole, and identify whether the numbers support transition.
_(pause: 2.5s)_
7. When the numbers are even, you make the short outlet instead of forcing the carry.
_(pause: 2s)_
8. You move the ball, cross midfield, and return to the defensive side through the box.
_(pause: 2.5s)_
9. On the next clear, you scoop a loose ball and move away from the first rider.
_(pause: 2s)_
10. You cross midfield with your head up and hit the open midfielder in stride.
_(pause: 2.5s)_

### Lacrosse · Defense · VIZ — Shut down the 1v1 at X
<!-- slug: viz-lax-defense-shutdown-1v1-x | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself pick up the attackman at X and confirm where your help is.
_(pause: 2s)_
2. With the pole in front, you set your approach angle.
_(pause: 2s)_
3. He drives topside, and you move your feet to maintain leverage.
_(pause: 2.5s)_
4. You stay on his hands and keep your hips between him and GLE.
_(pause: 2.5s)_
5. With the topside route closed, he rolls back behind the cage.
_(pause: 2s)_
6. You arrive first and close the path to GLE.
_(pause: 3s)_
7. A controlled poke moves his hands away from the shooting angle.
_(pause: 2.5s)_
8. He moves the ball back up top.
_(pause: 3s)_
9. You recover below GLE, check the crease, and call the next matchup.
_(pause: 2.5s)_

### Lacrosse · Defense · VIZ — Slide, recover, deny the feed
<!-- slug: viz-lax-defense-slide-recover | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself off-ball, set as the first slide.
_(pause: 2s)_
2. Their attackman gains a step toward the crease.
_(pause: 2s)_
3. You leave on the call and meet the dodger before the crease.
_(pause: 2.5s)_
4. You close his hands and force him to move the ball.
_(pause: 3s)_
5. He passes to the player you left.
_(pause: 2.5s)_
6. The defense rotates, and you recover to the next open player.
_(pause: 2.5s)_
7. You arrive under control as he receives the pass.
_(pause: 2.5s)_
8. With the pole on his hands, you take away the feed to the crease.
_(pause: 3s)_
9. He moves the ball outside, and the defense returns to its shape.
_(pause: 2.5s)_

### Lacrosse · Defense · VIZ — Win the gritty ground ball, clear it
<!-- slug: viz-lax-defense-ground-ball-clear | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See a loose ball at the edge of the crease and approach under control.
_(pause: 2s)_
2. An attackman closes from the other side.
_(pause: 2s)_
3. You get low, establish body position, and scoop through the ball with two hands.
_(pause: 3s)_
4. Contact arrives as you bring the stick close to your body.
_(pause: 2.5s)_
5. With the ball secure, you move behind the cage to create an outlet angle.
_(pause: 2.5s)_
6. You protect the pole and move away from the first rider.
_(pause: 2.5s)_
7. You get your head up and find the midfielder flashing toward the midline.
_(pause: 2.5s)_
8. You deliver the outlet to his outside shoulder.
_(pause: 3s)_
9. The ball crosses midfield, and you set your feet back on the defensive side.
_(pause: 2.5s)_

### Lacrosse · Defense · VIZ — Man-down, hold the middle
<!-- slug: viz-lax-defense-man-down-hold | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself in the man-down shape, protecting the middle of the field.
_(pause: 2s)_
2. Their extra-man unit moves the ball around the perimeter.
_(pause: 2s)_
3. You sink toward the hole with the stick in the inside passing lane.
_(pause: 2.5s)_
4. As the ball swings, you rotate with the unit.
_(pause: 2.5s)_
5. You keep the stick up and maintain the crease lane.
_(pause: 2s)_
6. They force the inside feed, and you deflect it.
_(pause: 3s)_
7. The ball stays loose near the crease.
_(pause: 2s)_
8. You scoop through it as the penalty expires.
_(pause: 2.5s)_
9. You move the ball to the outlet and the unit returns to even strength.
_(pause: 2.5s)_

### Lacrosse · Defense · VIZ — Beaten once, win the next matchup
<!-- slug: viz-lax-defense-win-next-matchup | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself matched up on a quick dodger at X.
_(pause: 2s)_
2. He uses a jab step, gains topside, and reaches GLE.
_(pause: 2s)_
3. He finishes the shot before the slide arrives.
_(pause: 2s)_
4. The goal is recorded, and you return to the huddle for the next call.
_(pause: 2.5s)_
5. On a later possession, the same dodger starts from X.
_(pause: 2.5s)_
6. You break down earlier and keep a better cushion.
_(pause: 2.5s)_
7. You maintain topside leverage and steer him to his weak hand.
_(pause: 3s)_
8. He cannot reach GLE and moves the ball back up top.
_(pause: 3s)_
9. You recover below GLE, check the crease, and prepare for the next dodge.
_(pause: 2.5s)_

### Lacrosse · FOGO · VIZ — Win the clamp
<!-- slug: viz-lax-fogo-win-the-clamp | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself set your feet at the dot and check your grip and stance.
_(pause: 2s)_
2. Down, set. On the whistle, your clamp gets to the ball first.
_(pause: 2s)_
3. You control the ball and rake it toward your wing.
_(pause: 2.5s)_
4. Your wing scoops through it and moves the ball to the offense.
_(pause: 2.5s)_
5. On the next draw, he counters quickly. You go over the top and stop his exit.
_(pause: 2.5s)_
6. You pull the ball into space, scoop it, and make the short outlet.
_(pause: 2.5s)_
7. When he wins the clamp, you move immediately to the tie-up.
_(pause: 2s)_
8. You keep the ball contested and direct it toward the wing matchup.
_(pause: 2.5s)_
9. On a late draw, you clamp and direct the ball away from pressure.
_(pause: 2.5s)_
10. You scoop it, protect the stick, and make the outlet.
_(pause: 2.5s)_

### Lacrosse · FOGO · VIZ — Win the wing
<!-- slug: viz-lax-fogo-win-the-wing | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See the clamp battle stall and the ball move loose toward the wing.
_(pause: 2s)_
2. You keep your hips low, stay connected to the play, and box out the nearest opponent.
_(pause: 2.5s)_
3. Your wing scoops through the ball and sends it to the outlet.
_(pause: 2.5s)_
4. On the next draw, you direct the ball forward and scoop it in stride.
_(pause: 2.5s)_
5. You carry with your head up and move it to the open lane in transition.
_(pause: 2.5s)_
6. On another tie-up, you and the wing midfielder keep the ball on your side of the scrum.
_(pause: 2.5s)_
7. After a lost draw, you review the exit and reset your stance.
_(pause: 2s)_
8. You prepare for the next whistle without changing the whole plan.
_(pause: 2s)_
9. The next ball moves to the wing, and you establish body position between the pole and the ball.
_(pause: 2.5s)_
10. You scoop through it and move the ball to the nearest outlet.
_(pause: 2.5s)_

### Lacrosse · FOGO · VIZ — Counter and win the pull
<!-- slug: viz-lax-fogo-counter-the-clamp | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself set at the dot, ready with a counter if he beats you to the clamp.
_(pause: 2s)_
2. Down, set. On the whistle, his clamp gets to the ball first.
_(pause: 2s)_
3. You recognize the loss and move immediately to the counter.
_(pause: 2.5s)_
4. You go over the top and place pressure on the back of his stick.
_(pause: 2.5s)_
5. You stop the exit and keep the ball under both sticks.
_(pause: 2.5s)_
6. You re-clamp and pull the ball toward your hand.
_(pause: 2.5s)_
7. You use your body to protect the ball and step away from the dot.
_(pause: 2.5s)_
8. Your wing moves alongside you as an outlet.
_(pause: 2s)_
9. You make the short pass and prepare for the next substitution.
_(pause: 3s)_

### Lacrosse · FOGO · VIZ — Win it forward, push the break
<!-- slug: viz-lax-fogo-win-and-go | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself set at the X with a forward exit available.
_(pause: 2s)_
2. Down, set. On the whistle, you clamp and direct the ball forward.
_(pause: 2.5s)_
3. You scoop through it in stride and protect the stick.
_(pause: 2.5s)_
4. You look up and identify the transition numbers.
_(pause: 2.5s)_
5. The trailing midfielder fills the lane behind you.
_(pause: 2.5s)_
6. You carry to the top of the box and draw the defender.
_(pause: 2.5s)_
7. When he commits, you feed the trailing midfielder in stride.
_(pause: 2.5s)_
8. He catches on the run and releases before the slide arrives.
_(pause: 2s)_
9. You clear toward the sideline and prepare to sub off.
_(pause: 3s)_

### Lacrosse · FOGO · VIZ — Close it out at the dot
<!-- slug: viz-lax-fogo-close-it-out | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself walk to the X for a late draw with your team protecting a lead.
_(pause: 2s)_
2. You identify the defensive-side exit and check the wing alignment.
_(pause: 2.5s)_
3. Down, set. On the whistle, you stay low and clamp toward the defensive side.
_(pause: 2.5s)_
4. You keep the exit simple and rake the ball away from pressure.
_(pause: 2.5s)_
5. The pole on the wing moves to the ball.
_(pause: 2.5s)_
6. He scoops through it and moves to the outlet.
_(pause: 2.5s)_
7. The clear moves up the sideline before the ride can trap it.
_(pause: 2.5s)_
8. The offense settles into its possession set and uses the clock.
_(pause: 2s)_
9. You return to the sideline and prepare for the next whistle.
_(pause: 3s)_

### Lacrosse · FOGO · VIZ — Read the counter and adjust
<!-- slug: viz-lax-fogo-read-and-adjust | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself between draws, reviewing the opponent's clamp and exit.
_(pause: 2s)_
2. The opponent has favored a quick clamp with an exit to his right.
_(pause: 2.5s)_
3. You choose an over-the-top counter to stop that exit.
_(pause: 2.5s)_
4. Down, set. You remain still and react when the whistle sounds.
_(pause: 2.5s)_
5. His clamp arrives first, and you move directly to the planned counter.
_(pause: 2.5s)_
6. You get over his stick and stop the ball from reaching his exit.
_(pause: 2.5s)_
7. You redirect the ball away from his pressure.
_(pause: 2.5s)_
8. You rake it to space, scoop through it, and protect the stick.
_(pause: 2s)_
9. You make the short outlet and record the adjustment for the next draw.
_(pause: 3s)_

### Lacrosse · FOGO · VIZ — Win the next one clean
<!-- slug: viz-lax-fogo-win-the-next-one | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself return to the X after losing the previous three draws.
_(pause: 2s)_
2. You review the common exit, then focus on this setup.
_(pause: 2.5s)_
3. You adjust the grip and lower the stance without rushing the whistle.
_(pause: 2.5s)_
4. Down, set. On the whistle, you get under his hands and clamp.
_(pause: 2.5s)_
5. The ball stays under your stick as you turn toward the wing.
_(pause: 2.5s)_
6. You rake it toward your wing and away from the counter.
_(pause: 2.5s)_
7. Your wing establishes position and scoops through the loose ball.
_(pause: 2.5s)_
8. The ball moves to the outlet, and you clear the scrum.
_(pause: 2s)_
9. You return to the sideline and prepare for the next draw on its own.
_(pause: 3s)_

### Lacrosse · Goalie · VIZ — Make the save
<!-- slug: viz-lax-goalie-make-the-save | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself set the angle in the cage and check the shooter's hands.
_(pause: 2s)_
2. The shooter winds up from twelve yards, and you track the release off the stick.
_(pause: 2.5s)_
3. You step toward the ball, drive both hands stick-side high, and control it in the pocket.
_(pause: 2s)_
4. You secure the ball and look immediately for the first outlet.
_(pause: 2.5s)_
5. Next possession, a low bouncer comes through traffic. You stay square and get the stick to the ball first.
_(pause: 2.5s)_
6. Your body follows the stick, and you control the rebound in front of you.
_(pause: 2.5s)_
7. On a later shot, the ball reaches the net before you get across.
_(pause: 2s)_
8. You retrieve it, reset your feet, and make the defensive calls for the restart.
_(pause: 2.5s)_
9. On the next crease feed, you hold the angle and step toward the shooter's hands.
_(pause: 2s)_
10. You meet the shot with stick and body and steer the rebound toward the pole in the corner.
_(pause: 2.5s)_

### Lacrosse · Goalie · VIZ — Start the clear
<!-- slug: viz-lax-goalie-start-the-clear | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself set in the cage, calling the hot defender and the second slide.
_(pause: 2s)_
2. The shot comes from up top, and you secure it in the pocket.
_(pause: 2.5s)_
3. Your eyes move upfield as the break midfielder runs the wing.
_(pause: 2.5s)_
4. You deliver the outlet in stride before the ride can close the lane.
_(pause: 2.5s)_
5. On the next clear, the ride takes away the first pass, so you carry behind the cage and keep scanning.
_(pause: 2.5s)_
6. You call the redirect and find the defender on the weak side.
_(pause: 2.5s)_
7. When a clear is ridden into a turnover, you communicate the matchups immediately.
_(pause: 2s)_
8. You reset the defense, call the next slide, and set your angle.
_(pause: 2.5s)_
9. On the next save, you control the ball and return to the simple outlet on the wing.
_(pause: 2.5s)_
10. The outlet crosses midfield, and you return to the crease.
_(pause: 2.5s)_

### Lacrosse · Goalie · VIZ — Stone the doorstep
<!-- slug: viz-lax-goalie-doorstep | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself set in the crease as the ball moves inside.
_(pause: 2s)_
2. Their attackman catches on the crease, five feet from the cage.
_(pause: 2.5s)_
3. You hold the angle instead of retreating toward the goal line.
_(pause: 2.5s)_
4. You step toward his hands and reduce the open cage.
_(pause: 2.5s)_
5. You track the head of his stick through the release.
_(pause: 2.5s)_
6. Both hands drive to the ball, with your body behind the stick.
_(pause: 2.5s)_
7. You control the ball against your chest and keep it in the pocket.
_(pause: 2.5s)_
8. You check the crease and wait for the outlet to separate.
_(pause: 2s)_
9. You make the outlet call and begin the clear.
_(pause: 3s)_

### Lacrosse · Goalie · VIZ — Stop the low bouncer
<!-- slug: viz-lax-goalie-low-bouncer | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself set square to a shooter winding up from ten yards.
_(pause: 2s)_
2. His hands drop through the release, and you track the ball low.
_(pause: 2.5s)_
3. The shot is aimed to bounce near your feet.
_(pause: 2.5s)_
4. You keep your eyes on the ball and step toward the bounce.
_(pause: 2.5s)_
5. The stick arrives first, with both hands driving toward the ball.
_(pause: 2.5s)_
6. You stay square so the body follows directly behind the stick.
_(pause: 2.5s)_
7. The ball settles in front of you without a rebound to the crease.
_(pause: 2.5s)_
8. You scoop it, bring the stick to protection, and check the outlets.
_(pause: 2s)_
9. You reset your feet and make the clear call.
_(pause: 3s)_

### Lacrosse · Goalie · VIZ — Hold the man-down kill
<!-- slug: viz-lax-goalie-man-down-kill | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself in the cage with a defender serving a penalty.
_(pause: 2s)_
2. Their extra-man unit moves the ball around the perimeter.
_(pause: 2.5s)_
3. You move on your arc and stay square to each catch.
_(pause: 2.5s)_
4. The first shot comes from up top, and you direct the rebound to the corner.
_(pause: 2.5s)_
5. The defense moves the rebound up the sideline while the penalty continues.
_(pause: 2.5s)_
6. On the next possession, the ball moves skip-side.
_(pause: 2.5s)_
7. You read the feed to the crease and set the angle before the catch.
_(pause: 2.5s)_
8. You step to the release and control the ball without a rebound.
_(pause: 2s)_
9. The penalty expires, and you make the outlet as the team returns to even strength.
_(pause: 3s)_

### Lacrosse · Goalie · VIZ — Command the defense, no shot
<!-- slug: viz-lax-goalie-command-the-defense | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself set in the middle of the crease with the offense arranged around you.
_(pause: 2s)_
2. Their attackman catches at X, and you identify the on-ball matchup.
_(pause: 2.5s)_
3. You call the hot defender and the second slide before the dodge begins.
_(pause: 2.5s)_
4. He dodges, and the first slide leaves on your call.
_(pause: 2.5s)_
5. You call the rotation, and the adjacent defenders fill behind the slide.
_(pause: 2.5s)_
6. The ball moves outside as the defense returns to its shape.
_(pause: 2.5s)_
7. The offense forces a feed inside, and the pole intercepts it.
_(pause: 2.5s)_
8. You call the clear as the pole moves the ball away from the crease.
_(pause: 2s)_
9. You return to your angle and organize the outlets.
_(pause: 3s)_

### Lacrosse · Goalie · VIZ — Soft one behind you, next save
<!-- slug: viz-lax-goalie-next-save | file: components/pregame/audio/clips-viz-lacrosse.ts -->

1. See yourself return to the crease after a shot you expected to save reaches the net.
_(pause: 2s)_
2. The goal is recorded. You retrieve the ball and reset the cage.
_(pause: 2.5s)_
3. You set your feet on the arc and establish the angle early.
_(pause: 2.5s)_
4. You call the hot defender and the second slide for the restart.
_(pause: 2.5s)_
5. The next shot comes from the wing.
_(pause: 2.5s)_
6. You stay square with both hands ready and track the release.
_(pause: 2.5s)_
7. You step toward the shot and drive the stick to the ball.
_(pause: 2.5s)_
8. You control the ball against your chest.
_(pause: 2s)_
9. You secure the ball and give the first outlet call.
_(pause: 3s)_
## Hard Moment Clips — Attack

### Lacrosse · Attack · turnover
<!-- slug: hm-lax-attack-turnover | file: components/pregame/audio/clips-lacrosse.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You force the dodge into the double at the top of the box. Two poles close and the ball pops loose. They scoop it, and it's a fast break the other way while you're still standing there.
_(pause: 1.5s)_
3. Your stick drops to your hip and your feet stop moving. Your eyes chase the ball up the field. The thought hits: I forced that right into the double.
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
3. Your gloves squeeze a shaft you haven't used in ten minutes and your eyes keep drifting to the bench. The thought hits: I've barely touched it all quarter.
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
3. Your chin drops and you pick at the mesh of your pocket instead of looking at him. The thought hits: the ball stopped coming to my side.
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
3. Your helmet is still on and your gloves stay wrapped around your stick like you're going back any second. The thought hits: the second unit's out there running my offense.
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
3. You keep switching hands without going anywhere and your feet are dancing in place. The thought hits: they scouted my dodge and sat on it all night.
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
3. You drop onto the bench and yank your helmet half off, jaw working. The thought hits: every call for me tonight is run, clear, run again.
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
3. You bounce on your toes at every whistle, then rock back on your heels when it's not you. The thought hits: two quarters, and my run still hasn't come.
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
3. Your feet felt like they were in cement, and now your pole drags as you circle behind the cage. The thought hits: he went right through my check.
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
3. Your shoulders tighten under your pads and the next slide call catches in your throat. The thought hits: every mistake back here feels louder right now.
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
3. Your helmet stays buckled and you chew your mouthpiece, eyes locked on the man who isn't yours right now. The thought hits: the third pole has my matchup now.
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
3. Your forearms burn from squeezing the shaft and you're leaning over the dot before the whistle. The thought hits: he's beating me to the clamp tonight.
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
3. You stand there nodding inside your helmet, gloves flexing on the shaft. The thought hits: three straight lost, and the whistle's coming again.
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
3. You're standing at the box with your stick flipped upside down, butt-end in the turf. The thought hits: the biggest draw of the night, and it isn't mine.
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
3. Your eyes sweep the field twice and find nobody, and your grip climbs the shaft. The thought hits: the ride has taken away every first look.
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
3. You sit at the end of the bench, stick flat across your knees, watching someone else warm up in your cage. The thought hits: I got pulled in front of everyone.
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
