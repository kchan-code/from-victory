# From Victory · Script Book · Track & Field

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

## Text-mode fallback (Track & Field)

These lines appear on-screen in text mode (no audio). Tokens like `{{role}}`, `{{adversity}}`, etc. are substituted at runtime — edit them as-is.

<!-- audioScript#0 | eyebrow: Identity -->
1. ${SCRIPTURE_REF} — ${SCRIPTURE_TEXT} You are not playing to become enough. In Christ, you are already loved. Receive that before you compete.

<!-- audioScript#1 | eyebrow: Settle -->
2. Sit tall. Long exhale. Lead your body back to ready. Four counts in. Six counts out. Let your shoulders drop.

<!-- audioScript#2 | eyebrow: See the track -->
3. See the track. Hear the meet PA echo, a starter's whistle in the distance, spikes on the apron. Smell the infield. Feel your spikes bite, the chalk on your hands, the moment before you go. You belong here. You are ready.

<!-- audioScript#3 | eyebrow: Your first rep -->
4. The starter raises the gun, or the official calls your name. Settle. Slow breath. Then go — explode, commit, finish all the way through. One rep. Recover. Next rep.

<!-- audioScript#4 | eyebrow: Compete in your event · {{role}} -->
5. {{roleScenes}}

<!-- audioScript#5 | eyebrow: If this happens -->
6. {{adversity}} See it. Feel it. Breathe. Speak truth. Take the next faithful action. Your mistake is real. It is not your identity.

<!-- audioScript#6 | eyebrow: Coach yourself -->
7. {{selfTalk}} When pressure hits, return here. Your anchor: {{anchor}}. Your cue word: {{cueWord}}.

<!-- audioScript#7 | eyebrow: Send-off -->
8. Lord, help me compete with courage, humility, and joy. Help me run the race in front of me, respond well to a bad one, and remember that my worth is secure in You. Amen. Play from victory.
---

## Audio Clips

## VIZ Clips (event group)

### Track & Field · Sprint · VIZ
<!-- slug: viz-trf-sprint | file: components/pregame/audio/clips-trackfield.ts -->

1. Keep your eyes closed. See yourself walking out onto the track toward your event.
_(pause: 1s)_
2. You hear the meet PA echo across the infield, and somewhere off in the distance, a starter's whistle.
_(pause: 1s)_
3. Hear the meet settle around you. Spikes clicking on the track and the runway apron, your teammates talking low.
_(pause: 2s)_
4. You see the bright chalk lines on the infield and catch the smell of it, fresh and dry.
_(pause: 2.2s)_
5. You feel your spikes bite into the track, firm and ready under you.
_(pause: 2.2s)_
6. You settle into your spot — the blocks, the ring, the top of the runway — and let everything else go quiet.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You back into the blocks and set your feet. Slow breath. This race is yours.
_(pause: 0.25s)_
9. Set position — hips up, eyes down. The gun. You explode out, driving low and powerful.
_(pause: 2s)_
10. You rise up out of the drive, hit top speed, and stay loose — fast hands, loose face.
_(pause: 2s)_
11. You hold your form, relaxed and powerful, every stride clean and quick.
_(pause: 2s)_
12. You run all the way through the line and lean, don't reach. One race at a time — that's how it goes all meet.
_(pause: 2s)_
13. See yourself explode and stay relaxed.
_(pause: 2s)_
14. Set in the blocks. React, drive, rise up. Fast hands, loose face — relaxed and powerful all the way down.
_(pause: 2s)_
15. Run through the line. Lean, don't reach. And if the runner beside you goes out hard, you don't tighten up and chase — you run your own race, relaxed and fast, all the way through.
_(pause: 2s)_
16. Now visualize the next rep.
_(pause: 0.8s)_
17. The final, the fastest heat, the lane next to you loaded. You don't press. You set clean, explode out, rise up, and stay loose — fast hands, loose face, leaning through the line. Your race, full speed to the end.
_(pause: 2s)_
### Track & Field · Dist · VIZ
<!-- slug: viz-trf-dist | file: components/pregame/audio/clips-trackfield.ts -->

1. Keep your eyes closed. See yourself walking out onto the track toward your event.
_(pause: 1s)_
2. You hear the meet PA echo across the infield, and somewhere off in the distance, a starter's whistle.
_(pause: 1s)_
3. Hear the meet settle around you. Spikes clicking on the track and the runway apron, your teammates talking low.
_(pause: 2s)_
4. You see the bright chalk lines on the infield and catch the smell of it, fresh and dry.
_(pause: 2.2s)_
5. You feel your spikes bite into the track, firm and ready under you.
_(pause: 2.2s)_
6. You settle into your spot — the blocks, the ring, the top of the runway — and let everything else go quiet.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You step to the line and find your spot in the field. Slow breath. You know exactly how this race unfolds.
_(pause: 0.25s)_
9. The gun. You go out controlled, settle into your pace, and let the early scramble pass.
_(pause: 2s)_
10. You relax the shoulders, breathe, and drop right onto your rhythm, stride after stride.
_(pause: 2s)_
11. You stay in contact, stay patient, sitting easy off the leaders, the laps clicking by.
_(pause: 2s)_
12. At the bell, you make your move on time and empty the tank to the line. One lap at a time — that's how it goes all meet.
_(pause: 2s)_
13. See yourself run your race, your way.
_(pause: 2s)_
14. Settle into your pace. Relax the shoulders, breathe. Stay in contact, stay patient — every lap, the same.
_(pause: 2s)_
15. Make your move on time. Empty the tank at the bell. And when the early pace is too hot, you don't get pulled off your plan — you run your own race and trust the work to bring you back.
_(pause: 2s)_
16. Now visualize the next rep.
_(pause: 0.8s)_
17. The longest race on your card, the field tearing out hard early. You don't chase it. You settle into your pace, relax the shoulders, breathe, and stay patient — then make your move on time and empty the tank at the bell, running them down to the line.
_(pause: 2s)_
### Track & Field · Hurdle · VIZ
<!-- slug: viz-trf-hurdle | file: components/pregame/audio/clips-trackfield.ts -->

1. Keep your eyes closed. See yourself walking out onto the track toward your event.
_(pause: 1s)_
2. You hear the meet PA echo across the infield, and somewhere off in the distance, a starter's whistle.
_(pause: 1s)_
3. Hear the meet settle around you. Spikes clicking on the track and the runway apron, your teammates talking low.
_(pause: 2s)_
4. You see the bright chalk lines on the infield and catch the smell of it, fresh and dry.
_(pause: 2.2s)_
5. You feel your spikes bite into the track, firm and ready under you.
_(pause: 2.2s)_
6. You settle into your spot — the blocks, the ring, the top of the runway — and let everything else go quiet.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You back into the blocks and set your feet. Slow breath. Your steps are dialed in.
_(pause: 0.25s)_
9. The gun. You drive out, hit your count, and attack the first hurdle, aggressive and tall.
_(pause: 2s)_
10. Lead leg snaps down. Trail leg comes through, quick and clean, and you're back into your stride.
_(pause: 2s)_
11. You run between the barriers, three steps, rhythm locked, attacking each one the same way.
_(pause: 2s)_
12. You clear the last one clean and sprint off it all the way through the line. One race at a time — that's how it goes all meet.
_(pause: 2s)_
13. See yourself trust your steps.
_(pause: 2s)_
14. Attack the first hurdle. Lead leg snaps down. Trail leg comes through — quick, clean, right back into the rhythm.
_(pause: 2s)_
15. Run between the barriers. Sprint off the last one. And if you nick a hurdle along the way, you don't flinch or shorten up — you stay aggressive, hit your steps, and run right through it.
_(pause: 2s)_
16. Now visualize the next rep.
_(pause: 0.8s)_
17. The final, the field stacked, the first hurdle coming up fast. You don't stutter. You drive out, attack the first one tall, snap the lead leg down, bring the trail through, and run the rhythm between the barriers — sprinting off the last one all the way through the line.
_(pause: 2s)_
### Track & Field · Jump · VIZ
<!-- slug: viz-trf-jump | file: components/pregame/audio/clips-trackfield.ts -->

1. Keep your eyes closed. See yourself walking out onto the track toward your event.
_(pause: 1s)_
2. You hear the meet PA echo across the infield, and somewhere off in the distance, a starter's whistle.
_(pause: 1s)_
3. Hear the meet settle around you. Spikes clicking on the track and the runway apron, your teammates talking low.
_(pause: 2s)_
4. You see the bright chalk lines on the infield and catch the smell of it, fresh and dry.
_(pause: 2.2s)_
5. You feel your spikes bite into the track, firm and ready under you.
_(pause: 2.2s)_
6. You settle into your spot — the blocks, the ring, the top of the runway — and let everything else go quiet.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You stand at the top of the runway and find your mark. Slow breath. This attempt is yours.
_(pause: 0.25s)_
9. You start the approach, building speed, staying tall and under control down the runway.
_(pause: 2s)_
10. You hit the board at full speed, right on your mark, no reaching, no chopping.
_(pause: 2s)_
11. You commit and explode up, driving off the board, riding the speed into the air.
_(pause: 2s)_
12. You land it clean, get up, and walk back ready for the next one. One attempt at a time — that's how it goes all meet.
_(pause: 2s)_
13. See yourself commit down the runway.
_(pause: 2s)_
14. Find your mark. Build the approach, stay tall. Hit the board, full speed — no reaching, no backing off.
_(pause: 2s)_
15. Commit and explode up. And if you foul or come up short, you let it go — next attempt, fresh start. Same mark, same full-speed approach, full commitment again.
_(pause: 2s)_
16. Now visualize the next rep.
_(pause: 0.8s)_
17. Your last attempt, the standings on the line, the runway quiet in front of you. You don't steer it. You find your mark, build the approach tall, hit the board at full speed, and commit and explode up — and whatever the last one was, this one is a fresh start.
_(pause: 2s)_
### Track & Field · Throw · VIZ
<!-- slug: viz-trf-throw | file: components/pregame/audio/clips-trackfield.ts -->

1. Keep your eyes closed. See yourself walking out onto the track toward your event.
_(pause: 1s)_
2. You hear the meet PA echo across the infield, and somewhere off in the distance, a starter's whistle.
_(pause: 1s)_
3. Hear the meet settle around you. Spikes clicking on the track and the runway apron, your teammates talking low.
_(pause: 2s)_
4. You see the bright chalk lines on the infield and catch the smell of it, fresh and dry.
_(pause: 2.2s)_
5. You feel your spikes bite into the track, firm and ready under you.
_(pause: 2.2s)_
6. You settle into your spot — the blocks, the ring, the top of the runway — and let everything else go quiet.
_(pause: 2s)_
7. You tell yourself, You belong here.
_(pause: 1.25s)_
8. You step into the ring and settle in. Slow breath. This throw is yours.
_(pause: 0.25s)_
9. You start slow and controlled, balanced at the back, building into the throw with patience.
_(pause: 2s)_
10. Slow, then violent — you stay back, load up, and then rip it through the middle.
_(pause: 2s)_
11. You finish tall and through, big and explosive, driving everything out in front of you.
_(pause: 2s)_
12. You stay in the ring, watch it sail, and step out clean. One throw at a time — that's how it goes all meet.
_(pause: 2s)_
13. See yourself be big and explosive.
_(pause: 2s)_
14. Settle in the ring. Slow, then violent. Stay back, then rip it — patient at the start, all power at the finish.
_(pause: 2s)_
15. Finish tall and through. And if one comes out flat or sails wide, you don't grip it tighter — next throw, let it go. Settle back in, slow then violent, and let it fly free.
_(pause: 2s)_
16. Now visualize the next rep.
_(pause: 0.8s)_
17. Your last throw, the board on the line, the ring quiet around you. You don't muscle it. You settle in, start slow and balanced, stay back, then rip it violent through the middle — finishing tall and through, big and explosive, and letting the last one go.
_(pause: 2s)_
## Hard Moment Clips

### Track & Field · Jump · foul
<!-- slug: hm-trf-jump-foul | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You hit the board flying, the jump feels huge, the best one all day. Then you look back and the red flag goes up. Your toe was over the line. No mark — it counts for nothing.
_(pause: 1.5s)_
3. Your eyes lock on the board, replaying your last three steps. Your shoulders sag as the flag stays up. The thought hits: my best jump and it doesn't even count.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That jump is over and the flag is up — nothing left to argue. You have attempts left in this round. The distance is clearly in you; you just showed it.
_(pause: 2s)_
6. Next attempt, walk back to the top of the runway, breathe out long, and settle your steps. Don't pull back scared of the board — trust your mark and hit it clean.
_(pause: 2s)_
7. The board reports an attempt; it can't measure a jumper. Set your start mark and run the next one.
_(pause: 1.5s)_
### Track & Field · Jump · no-height
<!-- slug: hm-trf-jump-no-height | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You passed up to a higher mark, and you've missed your first two. Now one attempt stands between you and no mark for the whole meet — and standing at the top, the approach you've run a thousand times suddenly feels far away.
_(pause: 1.5s)_
3. Your breath sits high in your chest. Your feet shuffle at the start, like you can't find where the run-up begins. The thought hits: I can't make myself commit to it.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Slow everything down. This is the gap between the warm-up and the one attempt that counts — it happens to real jumpers, and it's happening to your run-up today, not to who you are.
_(pause: 2s)_
6. Next attempt, you don't have to fix your approach standing here. Take it one jump at a time. Slow your routine all the way down, pick one small target down the runway, and run through it, not at it.
_(pause: 2s)_
7. Take what's bugging your approach to your coach this week and work it there. For now, set your mark and run the next one.
_(pause: 1.5s)_
### Track & Field · Jump · out-leaned
<!-- slug: hm-trf-jump-out-leaned | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're sitting in first, your mark holding up all flight. Then the last jumper steps up on their final attempt, hits it perfect, and buries your mark by a couple centimeters. First place, gone on the last jump of the day.
_(pause: 1.5s)_
3. Your chest tightens as they celebrate. Your jaw sets and your eyes drop to the board. The thought hits: I had it, I was right there, and it got taken at the buzzer.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That flight is over and their jump was theirs. You can't out-jump a mark that's already landed. He won that flight; he doesn't own your next meet.
_(pause: 2s)_
6. Next meet, you control your own attempts and not theirs — so spend nothing replaying the one that beat you. You jumped well enough to lead a whole flight; carry that forward.
_(pause: 2s)_
7. Their mark reports their attempt; it can't name you. Hold your head up and run your own day.
_(pause: 1.5s)_
### Track & Field · Jump · bad-heat
<!-- slug: hm-trf-jump-bad-heat | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You drew the early flight. You're jumping cold while the seeded athletes wait their turn, and the runway feels foreign — no one ahead of you to chase, no big marks on the board to measure against.
_(pause: 1.5s)_
3. Your eyes drift to the empty board and your shoulders drop. Your legs feel a little flat at the top of the runway. The thought hits: what's the point, the real flight hasn't even started.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The flight order doesn't decide your mark — the board takes every jump the same way, early flight or late. A big mark thrown down early still stands, and it forces the seeded jumpers to come find you.
_(pause: 2s)_
6. Next attempt, bring your own runway with you. Run your full approach, hit your steps, and attack the board — set the bar instead of chasing it.
_(pause: 2s)_
7. The seeding reports where they think you are; it can't measure a jumper. Settle at the top and run your own runway.
_(pause: 1.5s)_
### Track & Field · Jump · nervous
<!-- slug: hm-trf-jump-nervous | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You stand at the top of the runway, the board sixty feet away, the flight watching from the side. You rock onto your steps and for a second you can't feel where they are — just your heart pounding and the long strip of track in front of you.
_(pause: 1.5s)_
3. Your heart thumps and your hands buzz at your sides. Your legs feel light and quick underneath you. The thought hits: what if I'm off my steps with everyone watching.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves aren't a warning — they're energy your body brought because this matters. Let them sharpen you.
_(pause: 2s)_
6. Next attempt, you don't have to force the jump — just run your approach. Lock your eyes down the runway, hit your rhythm off the first step, and let the speed carry you to the board.
_(pause: 2s)_
7. Find your start mark under your feet. Trust the steps you've drilled a thousand times and go.
_(pause: 1.5s)_
### Track & Field · Jump · start-slow
<!-- slug: hm-trf-jump-start-slow | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Your first attempt comes out flat and short, well under your average. You feel it the second you land — that wasn't you. And now you're chasing the round, sitting near the bottom of the board with two attempts left.
_(pause: 1.5s)_
3. Your jaw tightens at the short mark. Your weight shifts forward, itching to swing for a huge one and make it all back at once. The thought hits: I have to get it all back on the next jump.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That attempt is over and it's just one mark on the board. A flat opener is a start, not the round.
_(pause: 2s)_
6. Next attempt, don't try to win the round back with one giant leap — that's how you press the board and scratch. Take it one jump at a time. Settle your steps, hit your rhythm, and trust your approach.
_(pause: 2s)_
7. The distance comes back on its own. You don't have to rescue the round — run one clean approach and go again.
_(pause: 1.5s)_
### Track & Field · Jump · off-pace
<!-- slug: hm-trf-jump-off-pace | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. All day your steps are off. You're either way behind the board and leaving distance on the runway, or you're reaching and fouling. You can't find your approach, and every attempt feels like a guess instead of a rhythm.
_(pause: 1.5s)_
3. Your shoulders climb between attempts and your run-up turns stuttery and rushed. The thought hits: I can't even find my own steps today.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Those attempts are behind you. Steps drift in a meet — that's normal, and the fix is one attempt, not the whole day.
_(pause: 2s)_
6. Next attempt, simplify it. Set your start mark, run your first few steps with confidence, and let the speed build into the board — don't steer it, just run it.
_(pause: 2s)_
7. Find the rhythm on one attempt and the rest follow. Breathe out long and run the next one.
_(pause: 1.5s)_
### Track & Field · Throw · foul
<!-- slug: hm-trf-throw-foul | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The throw rockets out there, your best of the day, way past your marks. And then your momentum carries your foot over the toe board — red flag, no mark. The biggest throw of the meet, and it counts for nothing.
_(pause: 1.5s)_
3. Your eyes lock on the ring, replaying the finish. Your hands drop to your sides as the flag stays up. The thought hits: my biggest throw and I fouled it away.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That throw is over and the flag is up — nothing left to argue. You have throws left in this round. The distance is clearly in you; you just showed it.
_(pause: 2s)_
6. Next throw, step out of the ring, shake out your arms, breathe out long. Don't pull back scared of the board — stay tall, control your finish, keep it behind the toe board, and let it go clean.
_(pause: 2s)_
7. The board reports an attempt; it can't measure a thrower. Step back in and let the next one rip.
_(pause: 1.5s)_
### Track & Field · Throw · no-height
<!-- slug: hm-trf-throw-no-height | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You've fouled your first two. The third is your last chance at a fair mark, and a scratch means you leave with nothing on the board — and standing in the ring, the throw you've made a thousand times suddenly feels far away.
_(pause: 1.5s)_
3. Your breath sits high in your chest. Your feet feel unsure at the back of the ring, like you can't commit to the drive. The thought hits: I can't make myself drive through it.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Slow everything down. This is the gap between the warm-up and the one throw that counts — it happens to real throwers, and it's happening to your run-up today, not to who you are.
_(pause: 2s)_
6. Next throw, you don't have to fix your technique standing here. Take it one throw at a time. Slow your setup all the way down, pick one simple thing, stay inside the ring, and let an easy, committed throw go.
_(pause: 2s)_
7. Take what's bugging your run-up to your coach this week and work it there. For now, step back in and throw the next one.
_(pause: 1.5s)_
### Track & Field · Throw · out-leaned
<!-- slug: hm-trf-throw-out-leaned | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're winning into the final round, your mark holding all day. Then the thrower behind you steps into the ring and uncorks a bomb — a personal best, right at the end — and bumps you out of first on the last throw of the competition.
_(pause: 1.5s)_
3. Your chest tightens as it lands. Your jaw sets and your eyes drop to the board. The thought hits: I led the whole comp and it got taken on the last throw.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That round is over and their throw was theirs. You can't out-throw a mark that's already landed. He won that round; he doesn't own your next meet.
_(pause: 2s)_
6. Next meet, you control your own throws and not theirs — so spend nothing replaying the one that beat you. You threw well enough to lead a whole competition; carry that forward.
_(pause: 2s)_
7. Their mark reports their attempt; it can't name you. Hold your head up and throw your own day.
_(pause: 1.5s)_
### Track & Field · Throw · bad-heat
<!-- slug: hm-trf-throw-bad-heat | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You throw first in the order, cold, with no big marks ahead of you to chase or measure against. The board is empty, the seeded throwers are waiting their turn, and the ring feels foreign with no rhythm set yet.
_(pause: 1.5s)_
3. Your eyes drift to the empty board and your shoulders drop. Your arm feels a little flat warming up. The thought hits: what's the point, the real throwers haven't even gone.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The throwing order doesn't decide your mark — the board takes every throw the same way, first in the order or last. A big mark thrown first still stands, and it forces the seeded throwers to come find you.
_(pause: 2s)_
6. Next throw, bring your own ring with you. Run your full setup, drive through your finish, and attack the board — set the mark instead of chasing it.
_(pause: 2s)_
7. The order reports where they think you are; it can't measure a thrower. Settle in the ring and throw your own mark.
_(pause: 1.5s)_
### Track & Field · Throw · nervous
<!-- slug: hm-trf-throw-nervous | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You step into the ring, chalk on your hands, the competition watching from the side. You settle the implement against your neck, and suddenly it feels heavy and unfamiliar — like your body forgot a motion it knows cold.
_(pause: 1.5s)_
3. Your heart thumps and your hands buzz against the implement. Your legs feel light underneath you in the ring. The thought hits: what if I rush it and let go too early with everyone watching.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves aren't a warning — they're energy your body brought because this matters. Let them sharpen you.
_(pause: 2s)_
6. Next throw, you don't have to force it — just run your sequence. Stay patient in the back, build through your feet and hips, and let the finish rip on its own.
_(pause: 2s)_
7. Feel your feet planted in the back of the ring. Trust the motion you've drilled a thousand times and go.
_(pause: 1.5s)_
### Track & Field · Throw · start-slow
<!-- slug: hm-trf-throw-start-slow | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Your opener is well short of your average. You feel it leave your hand wrong, and it lands soft. Now you're pressing to make the final, sitting near the bottom of the board with your throws running out.
_(pause: 1.5s)_
3. Your jaw tightens at the short mark. Your grip clenches, itching to muscle the next one as hard as you can and make it all back. The thought hits: I have to get it all back on the next throw.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That throw is over and it's just one mark on the board. A short opener is a start, not the round.
_(pause: 2s)_
6. Next throw, don't try to win it back by throwing harder — muscling it is exactly how the throw gets short and the foot drifts over the board. Take it one throw at a time. Stay smooth, trust your sequence, and let it build.
_(pause: 2s)_
7. The distance comes back on its own. You don't have to rescue the round — let one smooth throw go and go again.
_(pause: 1.5s)_
### Track & Field · Throw · off-pace
<!-- slug: hm-trf-throw-off-pace | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Attempt after attempt comes out flat and short. You know the big throw is in you — you've hit it in practice all week — but today you can't reach the mark you know you have, and the round is slipping by.
_(pause: 1.5s)_
3. Your shoulders climb between throws and your sequence feels rushed and disconnected. The thought hits: the big one just isn't coming today.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Those throws are behind you. Distance comes and goes within a comp — that's normal, and the fix is one throw, not the whole day.
_(pause: 2s)_
6. Next throw, simplify it. Stay patient in the back, build smooth through your feet, and let the finish do the work — don't force the distance, just run the sequence.
_(pause: 2s)_
7. Find the rhythm on one throw and the big one shows up. Breathe out long and step back in.
_(pause: 1.5s)_
### Track & Field · Sprint · false-start
<!-- slug: hm-trf-sprint-false-start | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The gun cracks and your body twitches a hair early. Then a second shot. The official's arm comes up and points down your lane. You're out — months of work erased before you ran a single step.
_(pause: 1.5s)_
3. Heat floods up your neck as you straighten up out of the blocks and your hands shake. The thought hits: I never even got to run, and now it's gone. That's the shock talking, not the truth. Let it pass.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That call is made and it cannot be undone. Standing on the track arguing it in your head only carries it into the next race. Breathe out long and let this one go.
_(pause: 2s)_
6. Take the lesson, not the spiral. Next time you set in the blocks, get still and wait for the gun — weight settled, eyes down the track, move only on the shot. You can't jump what you don't anticipate.
_(pause: 2s)_
7. All that training is still in you and it isn't going anywhere — it's in your legs, ready for the next gun.
_(pause: 2s)_
8. That false start was a call on a race, not a verdict on you. A race you never got to run cannot name you — your worth was settled before you ever stepped into the blocks. Set in the blocks and run the next one.
_(pause: 1.5s)_
### Track & Field · Sprint · handoff
<!-- slug: hm-trf-sprint-handoff | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're flying into the exchange zone and you reach back for the stick. It isn't there. The timing breaks, the pass dies in your hand, and three teammates' race dies with it.
_(pause: 1.5s)_
3. Your stomach drops as your hand closes on nothing and you can't look back at the relay. The thought hits: I cost everyone, I ruined it for the whole team. That's the guilt talking, not the truth. Let it pass.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That exchange is over and it's behind you on the track. The catastrophe in your head isn't real, and your teammates are still your teammates. Breathe out long and let it be done.
_(pause: 2s)_
6. Take it to your next handoff. Run your acceleration, trust the call, reach back on the cue and feel the stick hit your palm. An exchange is won in the rhythm, not the panic — settle it and own your leg.
_(pause: 2s)_
7. One blown handoff doesn't decide whether you belong on this relay — you're on it before the pass and after it. Settle in and run your leg.
_(pause: 1.5s)_
### Track & Field · Sprint · out-leaned
<!-- slug: hm-trf-sprint-out-leaned | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You ran dead even with them the whole hundred. You hit the line together, you throw your chest, and the photo says you lost by inches. Second, by a lean.
_(pause: 1.5s)_
3. Your chest heaves past the line and your hands fall to your knees. Your eyes lock on the place beside your name. The thought hits: I had them and I gave it away at the tape.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That race is over and the time is on the board. He won that lean; he doesn't own the next one. You have more racing today.
_(pause: 2s)_
6. Next race, don't replay the tape on a loop — run all the way through the line, drive your last steps, and time the lean so you win the last inch instead of giving it away.
_(pause: 2s)_
7. The tape reports a race; it can't name a runner. Walk it off on the infield, let one long exhale settle you, and go again.
_(pause: 1.5s)_
### Track & Field · Sprint · bad-heat
<!-- slug: hm-trf-sprint-bad-heat | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. They put you in lane one on the tight inside turn while the runner you have to beat drew lane four with the gentle curve. The draw feels rigged against you before the gun even fires.
_(pause: 1.5s)_
3. Your jaw sets as you stare down the cramped lane, and your eyes keep drifting right to lane four. The thought hits: the draw beat me before I ran.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The lane assignment doesn't decide your race. The clock takes everyone's time the same way, lane one or lane four. Settle into your blocks and bring your race no matter what's beside you.
_(pause: 2s)_
6. Run your own lane, not theirs. Stay low and patient through the tight turn, run the inside line clean, and unload on the straight.
_(pause: 2s)_
7. A great race out of lane one still crashes the next seeding. The lane sheet reports where they think you are. It cannot run the race for you, and it cannot run it for them.
_(pause: 1.5s)_
### Track & Field · Sprint · hit-wall
<!-- slug: hm-trf-sprint-hit-wall | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're out front at eighty meters and then your arms turn to concrete. Your form falls apart, your stride shortens, and everyone you passed comes streaming back at you over the last twenty.
_(pause: 1.5s)_
3. Your shoulders climb up around your ears and your arms thrash to find the speed that left. The thought hits: I always tie up at the end, I can't finish. That's the panic talking, not the truth. Let it pass.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That race is over and the time is on the board. Climb down off the effort, walk the infield, and let one long exhale clear it.
_(pause: 2s)_
6. Tying up is a relaxation problem, not a willpower problem. When the burn hits, you don't grip harder — you stay tall and loose: drop the shoulders, relax the face and hands, and let the speed flow instead of forcing it.
_(pause: 2s)_
7. Next race, run the first part within yourself so you have something left, then carry your form through the line. Speed comes from staying smooth, not from clenching.
_(pause: 2s)_
8. That tie-up was one race, not a fact about who you are. The clock reports a race; it cannot name a runner. Walk it off and run the next one.
_(pause: 1.5s)_
### Track & Field · Sprint · nervous
<!-- slug: hm-trf-sprint-nervous | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're walking to the blocks and the stadium goes quiet. The starter is waiting. You settle your feet on the pedals and your legs feel like they belong to someone else.
_(pause: 1.5s)_
3. Your hands are buzzing against the track and your feet won't sit still on the pedals. The thought hits: what if I'm tight off the gun and it's over before I find my speed.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you. One slow breath out behind the blocks, feet set on the pedals, and the buzz turns into power.
_(pause: 2s)_
6. You don't have to manage the whole race standing here. React to the gun, drive low out of the blocks, and let your speed come up underneath you.
_(pause: 2s)_
7. The work is already in your legs. Set in the blocks, react to the gun, and go.
_(pause: 1.5s)_
### Track & Field · Sprint · start-slow
<!-- slug: hm-trf-sprint-start-slow | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The gun goes and you're a beat behind everyone. Your first steps are heavy, you come up out of your drive too soon, and you're already buried in the field before you've hit top speed.
_(pause: 1.5s)_
3. Your eyes lock on the gap opening in front of you and your stride goes frantic, clawing to get it back. The thought hits: I lost it on the start, it's already gone.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That race is over and the slow start is behind you. Walk the infield and let one long exhale clear it. You have more racing today.
_(pause: 2s)_
6. Pressing to make it back is exactly what kept you behind. Next race, react to the gun, stay low and patient through your drive, and let the speed build under you so you never have to chase.
_(pause: 2s)_
7. Get out clean and there's nothing to claw back. Nail the next start, and go again.
_(pause: 1.5s)_
### Track & Field · Sprint · off-pace
<!-- slug: hm-trf-sprint-off-pace | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You hit two hundred of the four hundred feeling great, right on the runner ahead. Then the last hundred the bottom drops out — your legs flood, your turnover dies, and the field swallows you down the home straight.
_(pause: 1.5s)_
3. Your legs turn to lead and your stride collapses inward as they come past on both sides. The thought hits: I went out too hard, I always fade.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That race is over and the fade is behind you. Walk the infield, let one long exhale settle you, and let the home straight go. You have more racing today.
_(pause: 2s)_
6. The four hundred is won by pace, not by the first two hundred. Next race, run the opening within yourself, stay tall and relaxed at the two-fifty, and save the gear that carries you through the line.
_(pause: 2s)_
7. Distribute the effort and the back half holds. Run your own pace next time, and go again.
_(pause: 1.5s)_
### Track & Field · Dist · hit-wall
<!-- slug: hm-trf-dist-hit-wall | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. At the twelve hundred of the sixteen hundred your legs flood and your lungs close down. The pace you've held all year is suddenly impossible, and the pack you were tucked into starts to inch away.
_(pause: 1.5s)_
3. Your stride shortens and your shoulders climb toward your ears. Your lungs scream and your legs go heavy. The thought hits: I'm done, I can't hold this, I'm falling off. That's the pain talking, not the truth. Let it pass.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. This is the part of the race you trained for — the wall is the test, not the end. It comes for everyone here, and it's happening to your legs right now, not to who you are. Breathe out long and bring your focus back to this one lap.
_(pause: 2s)_
6. Don't try to win it all back at once — that's how a distance race falls apart. Stay tall, relax your face and shoulders, and shorten the race down to the next hundred meters. Just get to the next mark, then the next.
_(pause: 2s)_
7. Then ride the bell. When the last lap comes, you don't need a hero surge — you need your rhythm back. Find your turnover, lock onto the runner ahead, and reel them in stride by stride.
_(pause: 2s)_
8. The clock reports a race, but it cannot name a runner — you're secure whether you held the pace or not. That wall is behind you. Break the spiral here and run the next lap.
_(pause: 1.5s)_
### Track & Field · Dist · handoff
<!-- slug: hm-trf-dist-handoff | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. On the distance medley exchange your timing is off. You come in hot, your incoming runner is gassed, you stutter in the zone — and the lead you were handed leaks away in the fumble.
_(pause: 1.5s)_
3. Your stomach drops as the baton bobbles in the pass and your eyes won't find the runner who handed it off clean. The thought hits: I cost everyone, I let the whole relay down.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That exchange is over and you still have a whole leg to run. The voice saying you ruined it for everyone isn't telling the truth, and your teammates are still your teammates. Breathe out long.
_(pause: 2s)_
6. Run the leg you've still got. Settle into your pace, hunt the runners ahead one at a time, and give your team back the ground in the only place you can — on the track now.
_(pause: 2s)_
7. A clean leg answers a sloppy exchange. Run the leg in front of you, and go again.
_(pause: 1.5s)_
### Track & Field · Dist · out-leaned
<!-- slug: hm-trf-dist-out-leaned | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You led the whole last lap, you held the front, and you can hear them coming. In the final fifty someone with a fresher gear blows past you, and you cross the line a step behind after leading all the way.
_(pause: 1.5s)_
3. Your whole body burns from the front-running and your eyes lock on the back that just passed you. The thought hits: I did all the work and they stole it at the end.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He won that finish. He does not own the next one. Walk it off on the infield and let one long exhale settle you. Leading takes guts — the kick is just a skill you build next.
_(pause: 2s)_
6. Take it to your next race. If you're going to lead, lead honest and start your drive earlier so there's no gear left to out-kick. Or sit one stride back and time your own finish.
_(pause: 2s)_
7. Either way, you train the closing speed that beat you. Build the kick, and go again.
_(pause: 1.5s)_
### Track & Field · Dist · bad-heat
<!-- slug: hm-trf-dist-bad-heat | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're trapped on the rail in lane one, bodies stacked on your shoulder and a runner right on your back. The pace is winding up, the move is going, and you have nowhere to go.
_(pause: 1.5s)_
3. Your shoulders tense, hemmed in by the pack, and your eyes dart for a gap that isn't there. The thought hits: I'm boxed, I'm stuck, the race is leaving without me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Being boxed is a position, not a verdict — it changes every few strides. Don't spend your race fighting the wall of bodies. Hold your rhythm on the rail and wait for the gap.
_(pause: 2s)_
6. Be patient, then decisive. Ease back a half-step to find the lane, swing wide off the turn when it clears, and go through clean.
_(pause: 2s)_
7. The runner who keeps their head in the box is the one who's there at the bell. Find your gap, and go again.
_(pause: 1.5s)_
### Track & Field · Dist · nervous
<!-- slug: hm-trf-dist-nervous | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're on the starting line, the field crowds in around you, elbows close. You're not afraid of the race — you're afraid of how much the next few laps are going to hurt. The whole grind is still in front of you, and your stomach is in your throat.
_(pause: 1.5s)_
3. Your heart thumps, your legs feel heavy already, and your mind runs ahead to the worst of it. The thought hits: how am I going to hold pace when it really starts to hurt.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you. One slow breath out on the line, feet set under you, and bring your focus to just the first lap.
_(pause: 2s)_
6. Don't run the whole race standing here — you can't carry all of it at once. Break it into laps. Settle into pace, hold your rhythm, and take it one lap at a time.
_(pause: 2s)_
7. You've trained every meter of it. Settle on the line, run the first lap, and go.
_(pause: 1.5s)_
### Track & Field · Dist · start-slow
<!-- slug: hm-trf-dist-start-slow | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. The gun goes and the pace crawls. The pack jogs the first lap, you're stuck in the middle of it with nowhere to run, and the leaders start to string out and gap the field while you're trapped behind the crawl.
_(pause: 1.5s)_
3. Your stride goes choppy and bottled up and your jaw tightens as the leaders pull away. The thought hits: the slow start trapped me, the race is gone up front.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. A slow first lap is a tactic, not a sentence — the race always comes back together. Don't burn a panicked surge to chase a gap this early. Hold your position and let the pace come to you.
_(pause: 2s)_
6. Move with purpose, not panic. Stay out of the box on the rail, drift up to the leaders over the next lap, and be there when the real racing starts.
_(pause: 2s)_
7. A slow start rewards the runner who's patient and positioned. Settle into position, and go again.
_(pause: 1.5s)_
### Track & Field · Dist · off-pace
<!-- slug: hm-trf-dist-off-pace | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You glance at your watch at the mile mark and you're four seconds off the split you needed for the standard. The math is already against the time you came here to run, and there's a long way still to go.
_(pause: 1.5s)_
3. Your jaw tightens doing the math mid-stride and the urge surges to sprint and rip the gap back all at once. The thought hits: I'm off pace, I have to make up the whole gap right now.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Four seconds off is not a hole you dig out of in one lap. Sprinting to erase it now is exactly how a distance race falls apart. Settle, and bring your focus back to your rhythm.
_(pause: 2s)_
6. Claw it back in pieces, lap by lap — don't lunge for it all at once. Lock onto your target split, build through the middle, and trust your finish.
_(pause: 2s)_
7. The time comes back in increments, not one heroic surge. Settle onto your pace, and go again.
_(pause: 1.5s)_
### Track & Field · Hurdle · false-start
<!-- slug: hm-trf-hurdle-false-start | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You break a hair early at the gun. The second shot fires and the official's arm points down your lane. You're disqualified before you ever reached the first barrier — the whole race gone in a twitch.
_(pause: 1.5s)_
3. Heat floods up your neck as you come off the blocks and your hands won't stop shaking. The thought hits: I never even cleared a hurdle, and now it's over. That's the shock talking, not the truth. Let it pass.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That call is made and it cannot be undone. Standing on the track arguing it in your head only carries it into the next race. Breathe out long, drop your shoulders, and let this one go.
_(pause: 2s)_
6. Take the lesson, not the spiral. Next time you set, get still and wait for the gun — weight settled, eyes on the first hurdle, move only on the shot. You can't jump what you don't anticipate.
_(pause: 2s)_
7. All that work on your steps and your trail leg is still in you. The call didn't take your training — it's in your legs, ready for the next gun.
_(pause: 2s)_
8. A race you never got to run cannot name you — your worth was settled before you ever stepped into the blocks. That start is behind you. Take the lesson and run the next gun.
_(pause: 1.5s)_
### Track & Field · Hurdle · handoff
<!-- slug: hm-trf-hurdle-handoff | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. On the relay your exchange is sloppy. The timing's off, the stick bobbles between your legs, you fight to hang onto it — and the smooth pass you drilled all season turns into a scramble.
_(pause: 1.5s)_
3. Your stomach drops as the stick juggles in your hands and your eyes won't find your teammate. The thought hits: I cost us the race, I let the whole team down.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That exchange is over and it's behind you. The voice saying you ruined it for everyone isn't telling the truth, and your teammates are still your teammates. Breathe out long.
_(pause: 2s)_
6. Take it to your next handoff. Hit your acceleration, trust the cue, and feel the stick settle clean in your palm. A pass is won in the rhythm, not the grab.
_(pause: 2s)_
7. One bad exchange doesn't decide whether you belong on this relay. Settle the exchange, run your leg free, and go again.
_(pause: 1.5s)_
### Track & Field · Hurdle · out-leaned
<!-- slug: hm-trf-hurdle-out-leaned | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You and the next lane clear the last hurdle dead even and sprint for the line together. You throw everything you have at the tape, and they get the lean. Second, by the length of a chest.
_(pause: 1.5s)_
3. Your chest heaves past the line and your eyes lock on the place beside your name. The thought hits: I cleared it with them and gave it away at the tape.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. He won that lean. He does not own the next one. Walk it off on the infield and let one long exhale settle you. You have more racing today.
_(pause: 2s)_
6. Don't replay the tape on a loop. Take it to your next race — clear that last barrier clean, sprint your steps all the way through the line, and time the lean.
_(pause: 2s)_
7. Win the last inch instead of giving it away. Run through the tape next time, and go again.
_(pause: 1.5s)_
### Track & Field · Hurdle · foul
<!-- slug: hm-trf-hurdle-foul | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You clip the seventh barrier hard. It cracks against your lead leg, knocks you off your rhythm, and you stumble sideways — out of the race you were winning, fighting just to stay on your feet.
_(pause: 1.5s)_
3. Your stride scatters as you catch your balance and the field pulls past while you reset. The thought hits: I just threw away the whole race on one hurdle.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That hurdle is behind you and there are barriers left. Hitting one is a single mistake, not the whole race. Get your stride back and attack the next one right now.
_(pause: 2s)_
6. Don't chop and reach in fear of the next barrier — that's how you clip another. Find your steps, run tall at the hurdle, and snap the lead leg down.
_(pause: 2s)_
7. Rhythm beats hesitation, every time. Attack the next barrier, and go again.
_(pause: 1.5s)_
### Track & Field · Hurdle · bad-heat
<!-- slug: hm-trf-hurdle-bad-heat | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You drew the outside lane, way out wide. You can't see the field to gauge your rhythm off anyone — no one beside you to run with, just you and ten barriers stretching out alone.
_(pause: 1.5s)_
3. Your eyes keep darting inward looking for someone to chase and you feel exposed out there. The thought hits: I can't run blind, the draw beat me.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. The lane assignment doesn't decide your race — the clock takes every time the same, lane eight or lane four. Breathe out, settle into your blocks, and bring your race no matter who you can see.
_(pause: 2s)_
6. You never needed anyone else's rhythm — you race the hurdles. Lock onto your own steps, attack each barrier on your count, and run your pattern.
_(pause: 2s)_
7. Out front and blind is just you against the clock, the way it always was. Run your own steps, and go again.
_(pause: 1.5s)_
### Track & Field · Hurdle · hit-wall
<!-- slug: hm-trf-hurdle-hit-wall | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Coming off hurdle eight in the four hundred hurdles your legs lock up. The lactic floods in, your steps to the next barrier fall apart, and the stagger you built over the first three hundred evaporates as the field closes.
_(pause: 1.5s)_
3. Your legs turn to stone, your stride pattern scatters, and the barriers rush up too fast. The thought hits: I'm dying, I can't hold my steps, it's all coming back.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. This is the part of the race you trained for. The back-half lockup is the test, not the end. It comes for every four-hundred hurdler, and it's hitting your legs right now — not who you are.
_(pause: 2s)_
6. Don't panic when the steps shorten — that's normal this late. Stay tall, relax your shoulders, and commit hard to the next hurdle. Clear it, get to the one after.
_(pause: 2s)_
7. Run the race two barriers at a time to the line. Attack the next barrier, and go again.
_(pause: 1.5s)_
### Track & Field · Hurdle · nervous
<!-- slug: hm-trf-hurdle-nervous | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You're setting in the blocks staring down ten barriers stretching away from you. The first one looks close and tall. Your trail leg feels like it forgot the pattern you've drilled a thousand times.
_(pause: 1.5s)_
3. Your hands buzz on the track and your trail leg won't settle on the pedal. The thought hits: what if I'm off my steps to the first one and the whole rhythm's gone.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. These nerves are energy, not danger. Let them sharpen you. One slow breath out behind the blocks, feet set on the pedals, and the buzz turns into power.
_(pause: 2s)_
6. You don't have to think about all ten hurdles standing here — you just have to get to the first one. Drive low out of the blocks, hit your steps to barrier one, and let the pattern take over.
_(pause: 2s)_
7. Your body knows it. Set in the blocks, attack the first hurdle, and go.
_(pause: 1.5s)_
### Track & Field · Hurdle · start-slow
<!-- slug: hm-trf-hurdle-start-slow | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. You come out of the blocks flat. Your steps to the first hurdle are wrong — you're too close, crowded on the barrier — and you have to stutter and chop just to get up and over it.
_(pause: 1.5s)_
3. Your rhythm jams up at the first barrier and the stutter costs you a beat on the field. The thought hits: my steps are off, the whole race is wrecked now.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. That race is over and the rough start is behind you. Walk the infield and let one long exhale clear it. One bad approach doesn't erase the pattern you own. You have more racing today.
_(pause: 2s)_
6. Take it to your next race. Drive hard and tall out of the blocks, trust your count to the first barrier, and hit it in stride — when the first hurdle is clean, the whole rhythm follows.
_(pause: 2s)_
7. Set the pattern early and ride it. Nail the next approach, and go again.
_(pause: 1.5s)_
### Track & Field · Hurdle · off-pace
<!-- slug: hm-trf-hurdle-off-pace | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause: 0.4s)_
2. Mid-race your three-step pattern between the hurdles falls apart. You're caught between steps at every barrier now, reaching and reaching, jamming the takeoff, fighting the spacing instead of flowing through it.
_(pause: 1.5s)_
3. Your stride goes ragged, stretching for each hurdle, and every barrier feels like a fresh fight. The thought hits: I've lost my rhythm, I can't get it back.
_(pause: 2s)_
4. Now the reset. Return to your anchor.
_(pause: 2s)_
5. Losing the rhythm is a tempo problem, not a verdict — and you rebuild it one barrier at a time. Don't fight the whole race in your head. Bring your focus down to the very next hurdle.
_(pause: 2s)_
6. Climb back onto the pattern barrier by barrier. Run tall, snap the lead leg down, and re-establish your count to the next one — then the one after that.
_(pause: 2s)_
7. The rhythm is still in your body; reach back for it stride by stride. Find your count again, and go again.
_(pause: 1.5s)_
