# From Victory · Script Book · Pre-Practice


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

## Hockey Pre-Practice Clips

### Pre-Practice Hockey · opener-dialed-in
<!-- slug: pp-opener-dialed-in | file: components/pregame/audio/clips.ts -->

1. Before you step in, remember where you stand. Christ has already spoken for you.
_(pause: 1.2s)_
2. You are loved, held, and sent — before the first whistle, before the first touch, before anything goes right or wrong.
_(pause: 1.2s)_
3. So compete like someone who has been set free.
_(pause: 1.2s)_
4. Not reckless. Not careless. Free.
_(pause: 1.2s)_
5. Free to play hard. Free to take the open chance. Free to recover when something breaks down. Free to give your whole effort without handing your worth to the result.
_(pause: 1.2s)_
6. Step in with courage.
_(pause: 1.2s)_
7. Play the game in front of you.
_(pause: 1.2s)_
8. Christ has already won the victory you needed most.
### Pre-Practice Hockey · opener-dialed-in-2
<!-- slug: pp-opener-dialed-in-2 | file: components/pregame/audio/clips.ts -->

1. Before you start, settle this.
_(pause: 1.2s)_
2. You do not have to earn anyone's approval today.
_(pause: 1.2s)_
3. Not the coach's. Not the crowd's. Not your teammates'. Not even your own.
_(pause: 1.2s)_
4. In Christ, your worth is already secure. Not because you performed. Not because you proved yourself. Because Jesus has already won what you could never earn.
_(pause: 1.2s)_
5. So put down the weight of proving who you are.
_(pause: 1.2s)_
6. Play for Him — not to make Him love you, but because He already does.
_(pause: 1.2s)_
7. That is what makes you free.
_(pause: 1.2s)_
8. Free to compete with courage. Free to make a mistake and come back. Free to give everything without fear deciding how far you go.
_(pause: 1.2s)_
9. So step in.
_(pause: 1.2s)_
10. No holding back. No playing small. No carrying the last play.
_(pause: 1.2s)_
11. Give everything you have.
_(pause: 1.2s)_
12. Play from victory.
### Pre-Practice Hockey · opener-dialed-in-3
<!-- slug: pp-opener-dialed-in-3 | file: components/pregame/audio/clips.ts -->

1. Take a breath.
_(pause: 1.2s)_
2. You get to do this today.
_(pause: 1.2s)_
3. A body that can move. A game you love. A chance to compete, serve, and lay it all down.
_(pause: 1.2s)_
4. That is a gift.
_(pause: 1.2s)_
5. Do not spend it protecting comfort.
_(pause: 1.2s)_
6. Bring the whole thing to God — your effort, your nerves, your joy, your edge. He already knows what you are worth. He already called you loved before you laced up.
_(pause: 1.2s)_
7. So you are not performing for approval.
_(pause: 1.2s)_
8. You are free.
_(pause: 1.2s)_
9. And free does not mean casual.
_(pause: 1.2s)_
10. Free means full.
_(pause: 1.2s)_
11. Full speed. Full heart. Full compete.
_(pause: 1.2s)_
12. Not half-speed to avoid a mistake. Not playing small to look composed. Not holding something back so failure hurts less.
_(pause: 1.2s)_
13. Step in grateful.
_(pause: 1.2s)_
14. Compete with courage.
_(pause: 1.2s)_
15. Empty the tank.
_(pause: 1.2s)_
16. First rep, all of it.
_(pause: 1.2s)_
17. Now go.
### Pre-Practice Hockey · opener-get-to
<!-- slug: pp-opener-get-to | file: components/pregame/audio/clips.ts -->

1. You showed up on a day you did not feel like it.
_(pause: 1s)_
2. That matters.
_(pause: 1s)_
3. Do not wait for the feeling to lead.
_(pause: 1s)_
4. Move first.
_(pause: 1s)_
5. First stride. First battle. First puck.
_(pause: 1s)_
6. Let your body wake up while you work.
_(pause: 1s)_
7. God is not asking you to fake energy. Bring faithful effort with what you have today.
_(pause: 1s)_
8. A body that can move. A game you love. A chance to get better.
_(pause: 1s)_
9. Start small.
_(pause: 1s)_
10. Win the first drill.
_(pause: 1s)_
11. Feet moving. Stick down. First to the puck.
_(pause: 1s)_
12. First rep.
_(pause: 1s)_
13. Go.
### Pre-Practice Hockey · name-standard
<!-- slug: pp-name-standard | file: components/pregame/audio/clips.ts -->

1. Today, every rep has a purpose.
_(pause: 1s)_
2. Skate it like it matters. Handle the puck like it matters. Make the habit real.
_(pause: 1s)_
3. No wasted reps.
### Pre-Practice Hockey · goal-fusion
<!-- slug: pp-goal-fusion | file: components/pregame/audio/clips.ts -->

1. The standard today is simple.
_(pause: 1s)_
2. Game-speed reps. Clean habits. No coasting.
### Pre-Practice Hockey · choose-focus-lead
<!-- slug: pp-choose-focus-lead | file: components/pregame/audio/clips.ts -->

1. You chose the word you want to carry into this practice. Let it set the tone.
_(pause: 0.5s)_
### Pre-Practice Hockey · choose-focus-tail
<!-- slug: pp-choose-focus-tail | file: components/pregame/audio/clips.ts -->

_(pause: 0.5s)_
1. Bring it from the start. Let that word shape the way you compete.
### Pre-Practice Hockey · focus-relentless
<!-- slug: pp-focus-relentless | file: components/pregame/audio/clips.ts -->

1. Relentless.
### Pre-Practice Hockey · focus-hungry
<!-- slug: pp-focus-hungry | file: components/pregame/audio/clips.ts -->

1. Hungry.
### Pre-Practice Hockey · focus-head-up-every-breakout
<!-- slug: pp-focus-head-up-every-breakout | file: components/pregame/audio/clips.ts -->

1. Head up every breakout.
### Pre-Practice Hockey · focus-feet-always-moving
<!-- slug: pp-focus-feet-always-moving | file: components/pregame/audio/clips.ts -->

1. Feet always moving.
### Pre-Practice Hockey · focus-hard-first-pass
<!-- slug: pp-focus-hard-first-pass | file: components/pregame/audio/clips.ts -->

1. Hard first pass.
### Pre-Practice Hockey · focus-win-every-race-to-the-puck
<!-- slug: pp-focus-win-every-race-to-the-puck | file: components/pregame/audio/clips.ts -->

1. Win every race to the puck.
### Pre-Practice Hockey · focus-full-reps-no-glide
<!-- slug: pp-focus-full-reps-no-glide | file: components/pregame/audio/clips.ts -->

1. Full reps, no glide.
### Pre-Practice Hockey · be-vocal
<!-- slug: pp-be-vocal | file: components/pregame/audio/clips.ts -->

1. Talking is part of competing.
_(pause: 1s)_
2. Call "man on." Call "time." Call support.
_(pause: 1s)_
3. You are free to speak.
_(pause: 1s)_
4. Be loud early. Help your team play faster.
### Pre-Practice Hockey · see-it-go
<!-- slug: pp-see-it-go | file: components/pregame/audio/clips.ts -->

1. See one rep.
_(pause: 1s)_
2. First stride. Stick down. Finish through the puck.
_(pause: 1s)_
3. If it goes bad, read it, drop it, and go again.
_(pause: 1s)_
4. Next rep.
### Pre-Practice Hockey · focus-talk-every-shift
<!-- slug: pp-focus-talk-every-shift | file: components/pregame/audio/clips.ts -->

1. Talk every shift.
### Pre-Practice Hockey · prayer
<!-- slug: pp-prayer | file: components/pregame/audio/clips.ts -->

1. Let's pray. Father, thank you that my worth was settled before I got here, and it will hold long after I leave.
_(pause: 1s)_
2. Thank you for this work — the quiet reps, the hidden effort, the chances to get better when no one is keeping score.
_(pause: 1s)_
3. Help me bring full effort today. Not to prove myself, but because this body, this sport, and this opportunity are gifts from you.
_(pause: 1s)_
4. When a rep goes bad, help me drop it fast, learn from it, and go again.
_(pause: 1s)_
5. Good reps or rough ones, nothing changes how you see me in Christ.
_(pause: 1s)_
6. Help me train with courage, discipline, and joy.
_(pause: 1s)_
7. Let this effort honor you.
_(pause: 1s)_
8. In Jesus' name, Amen.
### Pre-Practice Hockey · prayer-selfguided
<!-- slug: pp-prayer-selfguided | file: components/pregame/audio/clips.ts -->

1. How you practice is how you play.
_(pause: 1s)_
2. This work matters, even when no one is keeping score. The clean reps build you. The rough reps teach you. None of them define you.
_(pause: 1s)_
3. So take a moment with God.
_(pause: 1s)_
4. Thank him that your worth is already settled in Christ. Ask for focus, discipline, and full effort. Give him whatever you are carrying today.
_(pause: 1s)_
5. Then pray in your own words.
_(pause: 18s)_
## Basketball Pre-Practice Clips

### Pre-Practice Basketball · opener-get-to
<!-- slug: pp-bb-opener-get-to | file: components/pregame/audio/clips.ts -->

1. You showed up on a day you did not feel like it.
_(pause: 1s)_
2. That matters.
_(pause: 1s)_
3. Do not wait for the feeling to lead.
_(pause: 1s)_
4. Move first.
_(pause: 1s)_
5. Talk on defense. Sprint through the rep. Let your body wake up while you work.
_(pause: 1s)_
6. Whatever you do, do it with everything — for the Lord, not for a mood.
_(pause: 1s)_
7. God is not asking you to fake energy. Bring faithful effort with what you have today.
_(pause: 1s)_
8. A body that can move. A ball in your hands. A game you love. A chance to get better.
_(pause: 1s)_
9. Start small.
_(pause: 1s)_
10. Win the first drill.
_(pause: 1s)_
11. First rep.
_(pause: 1s)_
12. Go.
### Pre-Practice Basketball · name-standard
<!-- slug: pp-bb-name-standard | file: components/pregame/audio/clips.ts -->

1. The standard today is simple.
_(pause: 1s)_
2. Game-speed reps. Clean footwork. No drifting.
### Pre-Practice Basketball · goal-fusion
<!-- slug: pp-bb-goal-fusion | file: components/pregame/audio/clips.ts -->

1. The simple reps are not filler.
_(pause: 1s)_
2. Closeouts. Loose balls. Footwork. Finishes.
_(pause: 1s)_
3. Do them full now, so they are there when it counts.
### Pre-Practice Basketball · be-vocal
<!-- slug: pp-bb-be-vocal | file: components/pregame/audio/clips.ts -->

1. Talking is part of competing.
_(pause: 1s)_
2. Call the ball. Call the screen. Call the help.
_(pause: 1s)_
3. You do not have to stay quiet to protect how you look.
_(pause: 1s)_
4. You are free to speak.
_(pause: 1s)_
5. So be loud early.
_(pause: 1s)_
6. Let your voice bring energy, clarity, and confidence to the floor.
### Pre-Practice Basketball · see-it-go
<!-- slug: pp-bb-see-it-go | file: components/pregame/audio/clips.ts -->

1. See one rep.
_(pause: 1s)_
2. Game speed. Clean feet. Full focus.
_(pause: 1s)_
3. If it goes bad, learn fast and drop it.
_(pause: 1s)_
4. Next rep.
### Pre-Practice Basketball · focus-relentless
<!-- slug: pp-bb-focus-relentless | file: components/pregame/audio/clips.ts -->

1. Relentless.
### Pre-Practice Basketball · focus-hungry
<!-- slug: pp-bb-focus-hungry | file: components/pregame/audio/clips.ts -->

1. Hungry.
### Pre-Practice Basketball · focus-talk-every-possession
<!-- slug: pp-bb-focus-talk-every-possession | file: components/pregame/audio/clips.ts -->

1. Talk every possession.
### Pre-Practice Basketball · focus-guard-your-yard
<!-- slug: pp-bb-focus-guard-your-yard | file: components/pregame/audio/clips.ts -->

1. Guard your yard.
### Pre-Practice Basketball · focus-hit-the-glass
<!-- slug: pp-bb-focus-hit-the-glass | file: components/pregame/audio/clips.ts -->

1. Hit the glass.
### Pre-Practice Basketball · focus-sprint-every-transition
<!-- slug: pp-bb-focus-sprint-every-transition | file: components/pregame/audio/clips.ts -->

1. Sprint every transition.
### Pre-Practice Basketball · focus-box-out-every-shot
<!-- slug: pp-bb-focus-box-out-every-shot | file: components/pregame/audio/clips.ts -->

1. Box out every shot.
## Baseball Pre-Practice Clips

### Pre-Practice Baseball · opener-get-to
<!-- slug: pp-baseball-opener-get-to | file: components/pregame/audio/clips.ts -->

1. Be honest — you're not really feeling it today. That's allowed. You showed up anyway. That already counts.
_(pause: 1.2s)_
2. Here's the thing nobody tells you: the feeling shows up after you move, not before. You don't wait to want it. You commit to the first rep, go full, and let the rest catch up.
_(pause: 1s)_
3. Whatever you do, you do it with everything — for the Lord, not for a mood. The flat day counts to him exactly as much as the good one. He's not grading how you feel.
_(pause: 1.2s)_
4. And somewhere under the drag — a body that works, a game you actually love. That's real. Let it pull you. Not guilt. Just true.
_(pause: 1s)_
5. So don't try to fix the whole practice. Just win the first round in the cage. First ten minutes, full — feet moving, first to every ground ball.
_(pause: 0.8s)_
6. First rep. Go.
### Pre-Practice Baseball · name-standard
<!-- slug: pp-baseball-name-standard | file: components/pregame/audio/clips.ts -->

1. Whatever you do here is what shows up when it's tight. The rep you give now is the at-bat you'll have with the game on the line. Your hands don't know the difference between a drill and the bottom of the seventh.
_(pause: 1s)_
2. So the bar today is simple. Full reps. Full compete. No coasting.
### Pre-Practice Baseball · goal-fusion
<!-- slug: pp-baseball-goal-fusion | file: components/pregame/audio/clips.ts -->

1. That drill you've run a thousand times — the boring one, nobody watching — you're not getting it over with. You're rehearsing the at-bat you actually want, early, while it's quiet.
_(pause: 1s)_
2. That ground ball in the hole, that backhand pick, that two-strike at-bat you'd rather skip — that's the one that decides a playoff game. Win it now, at practice, full every time, and the one with everything on the line is just one you've already done.
_(pause: 1s)_
3. Not the perfect rep. The full one. That's all today asks.
### Pre-Practice Baseball · be-vocal
<!-- slug: pp-baseball-be-vocal | file: components/pregame/audio/clips.ts -->

1. One more thing nobody says out loud. Out there, talking is competing — calling for the ball, 'I got it,' 'two,' 'four's the play,' 'back' on the runner. Coaches notice who talks. But most players go quiet — not because they don't know the call. Because being loud feels like drawing eyes, sounding dumb, looking like you're trying too hard.
_(pause: 1.2s)_
2. That's the same trap. Going quiet is protecting how you look — and you already settled that. What they think of you isn't the scoreboard you're playing to.
_(pause: 0.8s)_
3. So talk. 'I'm here.' 'One out.' 'I got it.' Be the loud one. The players who run the field with their voice — call the cutoff, call the situation, talk every pitch — they're the ones coaches build around and hand the team to. Not because they asked for it. Because they were already doing the job.
_(pause: 0.8s)_
4. Quiet's the easy hide. Don't take it.
### Pre-Practice Baseball · see-it-go
<!-- slug: pp-baseball-see-it-go | file: components/pregame/audio/clips.ts -->

1. See one rep. You, full compete, that focus locked in, nothing saved for the bench.
_(pause: 1.5s)_
2. A rep's going to go bad. Some will. That's information, not a verdict — read it, drop it, next rep.
_(pause: 1s)_
3. You're not out here to prove who you are. You already know.
### Pre-Practice Baseball · focus-relentless
<!-- slug: pp-baseball-focus-relentless | file: components/pregame/audio/clips.ts -->

1. Relentless.
### Pre-Practice Baseball · focus-hungry
<!-- slug: pp-baseball-focus-hungry | file: components/pregame/audio/clips.ts -->

1. Hungry.
### Pre-Practice Baseball · focus-stay-in-the-box
<!-- slug: pp-baseball-focus-stay-in-the-box | file: components/pregame/audio/clips.ts -->

1. Stay in the box.
### Pre-Practice Baseball · focus-read-the-pitch
<!-- slug: pp-baseball-focus-read-the-pitch | file: components/pregame/audio/clips.ts -->

1. Read the pitch.
### Pre-Practice Baseball · focus-soft-hands
<!-- slug: pp-baseball-focus-soft-hands | file: components/pregame/audio/clips.ts -->

1. Soft hands.
### Pre-Practice Baseball · focus-quick-feet
<!-- slug: pp-baseball-focus-quick-feet | file: components/pregame/audio/clips.ts -->

1. Quick feet.
### Pre-Practice Baseball · focus-one-pitch-at-a-time
<!-- slug: pp-baseball-focus-one-pitch-at-a-time | file: components/pregame/audio/clips.ts -->

1. One pitch at a time.
## Golf Pre-Practice Clips

### Pre-Practice Golf · opener-get-to
<!-- slug: pp-golf-opener-get-to | file: components/pregame/audio/clips.ts -->

1. You showed up on a day you did not feel like it.
_(pause: 1s)_
2. That matters.
_(pause: 1s)_
3. Do not wait for the feeling to lead.
_(pause: 1s)_
4. Start with one clear target.
_(pause: 1s)_
5. Go through the routine.
_(pause: 1s)_
6. Make one committed swing.
_(pause: 1s)_
7. Let your body and mind wake up while you work.
_(pause: 1s)_
8. Whatever you do, do it with everything — for the Lord, not for a mood.
_(pause: 1s)_
9. God is not asking you to fake energy. Bring faithful effort with what you have today.
_(pause: 1s)_
10. A body that can move. A game you love. A chance to get better.
_(pause: 1s)_
11. Let that pull you.
_(pause: 1s)_
12. Not guilt. Just truth.
_(pause: 1s)_
13. Do not try to fix the whole session.
_(pause: 1s)_
14. Win the first ten minutes.
_(pause: 1s)_
15. Pick a target. Commit to the swing. Learn from the result.
_(pause: 1s)_
16. First ball.
_(pause: 1s)_
17. Begin.
### Pre-Practice Golf · name-standard
<!-- slug: pp-golf-name-standard | file: components/pregame/audio/clips.ts -->

1. The standard today is simple.
_(pause: 1s)_
2. Every ball gets a target. Every swing gets commitment.
_(pause: 1s)_
3. No rushing. No chasing.
### Pre-Practice Golf · goal-fusion
<!-- slug: pp-golf-goal-fusion | file: components/pregame/audio/clips.ts -->

1. The simple reps are not filler.
_(pause: 1s)_
2. Short putts. Half-wedges. Bunker shots. Alignment.
_(pause: 1s)_
3. Do them with a target and a routine.
_(pause: 1s)_
4. That is how practice shows up on the course.
### Pre-Practice Golf · full-routine
<!-- slug: pp-golf-full-routine | file: components/pregame/audio/clips.ts -->

1. Do not waste the range by raking and swinging.
_(pause: 1s)_
2. Pick a target. Set your body. Commit to the shot.
_(pause: 1s)_
3. Some balls get the full routine. Every ball gets attention.
_(pause: 1s)_
4. That is what holds on the first tee.
_(pause: 1s)_
5. Build it now.
### Pre-Practice Golf · see-it-go
<!-- slug: pp-golf-see-it-go | file: components/pregame/audio/clips.ts -->

1. See one shot.
_(pause: 1s)_
2. Pick the target. Feel the setup. Commit to the swing.
_(pause: 1s)_
3. Watch the ball honestly. Take the feedback without chasing it.
_(pause: 1s)_
4. Good shot or bad shot, it does not define you.
_(pause: 1s)_
5. Next ball.
### Pre-Practice Golf · focus-committed-to-every-shot
<!-- slug: pp-golf-focus-committed-to-every-shot | file: components/pregame/audio/clips.ts -->

1. Committed to every shot.
### Pre-Practice Golf · focus-one-shot-at-a-time
<!-- slug: pp-golf-focus-one-shot-at-a-time | file: components/pregame/audio/clips.ts -->

1. One shot at a time.
### Pre-Practice Golf · focus-pick-a-small-target
<!-- slug: pp-golf-focus-pick-a-small-target | file: components/pregame/audio/clips.ts -->

1. Pick a small target.
### Pre-Practice Golf · focus-full-routine-every-ball
<!-- slug: pp-golf-focus-full-routine-every-ball | file: components/pregame/audio/clips.ts -->

1. Full routine, every ball.
### Pre-Practice Golf · focus-take-my-medicine
<!-- slug: pp-golf-focus-take-my-medicine | file: components/pregame/audio/clips.ts -->

1. Take my medicine.
### Pre-Practice Golf · focus-speed-on-every-putt
<!-- slug: pp-golf-focus-speed-on-every-putt | file: components/pregame/audio/clips.ts -->

1. Speed on every putt.
### Pre-Practice Golf · focus-reset-between-shots
<!-- slug: pp-golf-focus-reset-between-shots | file: components/pregame/audio/clips.ts -->

1. Reset between shots.

## Football Pre-Practice Clips

### Pre-Practice Football · opener-get-to
<!-- slug: pp-football-opener-get-to | file: components/pregame/audio/clips.ts -->

1. Be honest — you're not really feeling it today. The pads feel heavy and your legs are flat.
_(pause: 1.2s)_
2. You do not need to feel ready before you start. Give the first rep your full attention and let the practice build from there.
_(pause: 1s)_
3. Work at it with your whole heart, for the Lord. Your job today is not to manufacture a mood; it is to be faithful with the rep in front of you.
_(pause: 1.2s)_
4. Start with what you can control: your stance, your feet, your eyes, and your effort.
_(pause: 1s)_
5. Do not try to fix the whole practice at once. Get through the first individual period one rep at a time — feet moving, eyes up, assignment finished.
_(pause: 0.8s)_
6. First rep. Go.
### Pre-Practice Football · name-standard
<!-- slug: pp-football-name-standard | file: components/pregame/audio/clips.ts -->

1. Name today's standard before practice starts. Get aligned, know the assignment, and give each rep your full attention.
_(pause: 1s)_
2. The standard is simple: no drifting through reps and no finishing halfway.
### Pre-Practice Football · goal-fusion
<!-- slug: pp-football-goal-fusion | file: components/pregame/audio/clips.ts -->

1. Connect this drill to the play you want to make in a game. Do not rush through it just because you have done it before.
_(pause: 1s)_
2. Fit the block with the right leverage, run the route at game speed, or break on the ball with your eyes right. Practice the detail now so it is available when the game speeds up.
_(pause: 1s)_
3. You do not need a perfect practice. You need honest, complete reps.
### Pre-Practice Football · be-vocal
<!-- slug: pp-football-be-vocal | file: components/pregame/audio/clips.ts -->

1. Use your voice today. Echo the call, communicate shifts and motion, and call "ball" when it is in the air.
_(pause: 1.2s)_
2. Do not assume your teammate saw what you saw. Clear communication helps everyone play faster.
_(pause: 0.8s)_
3. Make the call that belongs to your position, repeat the check, and keep talking through the rep.
_(pause: 0.8s)_
4. Be clear, be early, and make sure the player next to you has the information.
### Pre-Practice Football · see-it-go
<!-- slug: pp-football-see-it-go | file: components/pregame/audio/clips.ts -->

1. See one rep. Get lined up correctly, read your key, move your feet, and finish the assignment.
_(pause: 1.5s)_
2. Some reps will go badly. Take the coaching, make the correction, and reset before the next one.
_(pause: 1s)_
3. You do not need to prove your worth in practice. You are here to learn, compete, and do the work in front of you.
### Pre-Practice Football · focus-run-to-the-ball
<!-- slug: pp-football-focus-run-to-the-ball | file: components/pregame/audio/clips.ts -->

1. Run to the ball.
### Pre-Practice Football · focus-finish-every-rep
<!-- slug: pp-football-focus-finish-every-rep | file: components/pregame/audio/clips.ts -->

1. Finish every rep.
### Pre-Practice Football · focus-eyes-up
<!-- slug: pp-football-focus-eyes-up | file: components/pregame/audio/clips.ts -->

1. Eyes up.
### Pre-Practice Football · focus-win-my-one-on-one
<!-- slug: pp-football-focus-win-my-one-on-one | file: components/pregame/audio/clips.ts -->

1. Win my one-on-one.
### Pre-Practice Football · focus-play-fast
<!-- slug: pp-football-focus-play-fast | file: components/pregame/audio/clips.ts -->

1. Play fast.
### Pre-Practice Football · focus-ball-security
<!-- slug: pp-football-focus-ball-security | file: components/pregame/audio/clips.ts -->

1. Ball security.
### Pre-Practice Football · focus-next-play
<!-- slug: pp-football-focus-next-play | file: components/pregame/audio/clips.ts -->

1. Next play.
