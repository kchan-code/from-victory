# From Victory · Script Book · Track & Field

> **DORMANT** — no audio rendered yet for this sport. Edit freely; the first audio render is the go-live pass.

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
_(pause)_
2. You hear the meet PA echo across the infield, and somewhere off in the distance, a starter's whistle.
_(pause)_
3. Hear the meet settle around you. Spikes clicking on the track and the runway apron, your teammates talking low.
_(pause)_
4. You see the bright chalk lines on the infield and catch the smell of it, fresh and dry.
_(pause)_
5. You feel your spikes bite into the track, firm and ready under you.
_(pause)_
6. You settle into your spot — the blocks, the ring, the top of the runway — and let everything else go quiet.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. You back into the blocks and set your feet. Slow breath. This race is yours.
_(pause)_
9. Set position — hips up, eyes down. The gun. You explode out, driving low and powerful.
_(pause)_
10. You rise up out of the drive, hit top speed, and stay loose — fast hands, loose face.
_(pause)_
11. You hold your form, relaxed and powerful, every stride clean and quick.
_(pause)_
12. You run all the way through the line and lean, don't reach. One race at a time — that's how it goes all meet.
_(pause)_
13. See yourself explode and stay relaxed.
_(pause)_
14. Set in the blocks. React, drive, rise up. Fast hands, loose face — relaxed and powerful all the way down.
_(pause)_
15. Run through the line. Lean, don't reach. And if the runner beside you goes out hard, you don't tighten up and chase — you run your own race, relaxed and fast, all the way through.
_(pause)_
16. Now visualize the next rep.
_(pause)_
17. The final, the fastest heat, the lane next to you loaded. You don't press. You set clean, explode out, rise up, and stay loose — fast hands, loose face, leaning through the line. Your race, full speed to the end.
_(pause)_
### Track & Field · Dist · VIZ
<!-- slug: viz-trf-dist | file: components/pregame/audio/clips-trackfield.ts -->

1. Keep your eyes closed. See yourself walking out onto the track toward your event.
_(pause)_
2. You hear the meet PA echo across the infield, and somewhere off in the distance, a starter's whistle.
_(pause)_
3. Hear the meet settle around you. Spikes clicking on the track and the runway apron, your teammates talking low.
_(pause)_
4. You see the bright chalk lines on the infield and catch the smell of it, fresh and dry.
_(pause)_
5. You feel your spikes bite into the track, firm and ready under you.
_(pause)_
6. You settle into your spot — the blocks, the ring, the top of the runway — and let everything else go quiet.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. You step to the line and find your spot in the field. Slow breath. You know exactly how this race unfolds.
_(pause)_
9. The gun. You go out controlled, settle into your pace, and let the early scramble pass.
_(pause)_
10. You relax the shoulders, breathe, and drop right onto your rhythm, stride after stride.
_(pause)_
11. You stay in contact, stay patient, sitting easy off the leaders, the laps clicking by.
_(pause)_
12. At the bell, you make your move on time and empty the tank to the line. One lap at a time — that's how it goes all meet.
_(pause)_
13. See yourself run your race, your way.
_(pause)_
14. Settle into your pace. Relax the shoulders, breathe. Stay in contact, stay patient — every lap, the same.
_(pause)_
15. Make your move on time. Empty the tank at the bell. And when the early pace is too hot, you don't get pulled off your plan — you run your own race and trust the work to bring you back.
_(pause)_
16. Now visualize the next rep.
_(pause)_
17. The longest race on your card, the field tearing out hard early. You don't chase it. You settle into your pace, relax the shoulders, breathe, and stay patient — then make your move on time and empty the tank at the bell, running them down to the line.
_(pause)_
### Track & Field · Hurdle · VIZ
<!-- slug: viz-trf-hurdle | file: components/pregame/audio/clips-trackfield.ts -->

1. Keep your eyes closed. See yourself walking out onto the track toward your event.
_(pause)_
2. You hear the meet PA echo across the infield, and somewhere off in the distance, a starter's whistle.
_(pause)_
3. Hear the meet settle around you. Spikes clicking on the track and the runway apron, your teammates talking low.
_(pause)_
4. You see the bright chalk lines on the infield and catch the smell of it, fresh and dry.
_(pause)_
5. You feel your spikes bite into the track, firm and ready under you.
_(pause)_
6. You settle into your spot — the blocks, the ring, the top of the runway — and let everything else go quiet.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. You back into the blocks and set your feet. Slow breath. Your steps are dialed in.
_(pause)_
9. The gun. You drive out, hit your count, and attack the first hurdle, aggressive and tall.
_(pause)_
10. Lead leg snaps down. Trail leg comes through, quick and clean, and you're back into your stride.
_(pause)_
11. You run between the barriers, three steps, rhythm locked, attacking each one the same way.
_(pause)_
12. You clear the last one clean and sprint off it all the way through the line. One race at a time — that's how it goes all meet.
_(pause)_
13. See yourself trust your steps.
_(pause)_
14. Attack the first hurdle. Lead leg snaps down. Trail leg comes through — quick, clean, right back into the rhythm.
_(pause)_
15. Run between the barriers. Sprint off the last one. And if you nick a hurdle along the way, you don't flinch or shorten up — you stay aggressive, hit your steps, and run right through it.
_(pause)_
16. Now visualize the next rep.
_(pause)_
17. The final, the field stacked, the first hurdle coming up fast. You don't stutter. You drive out, attack the first one tall, snap the lead leg down, bring the trail through, and run the rhythm between the barriers — sprinting off the last one all the way through the line.
_(pause)_
### Track & Field · Jump · VIZ
<!-- slug: viz-trf-jump | file: components/pregame/audio/clips-trackfield.ts -->

1. Keep your eyes closed. See yourself walking out onto the track toward your event.
_(pause)_
2. You hear the meet PA echo across the infield, and somewhere off in the distance, a starter's whistle.
_(pause)_
3. Hear the meet settle around you. Spikes clicking on the track and the runway apron, your teammates talking low.
_(pause)_
4. You see the bright chalk lines on the infield and catch the smell of it, fresh and dry.
_(pause)_
5. You feel your spikes bite into the track, firm and ready under you.
_(pause)_
6. You settle into your spot — the blocks, the ring, the top of the runway — and let everything else go quiet.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. You stand at the top of the runway and find your mark. Slow breath. This attempt is yours.
_(pause)_
9. You start the approach, building speed, staying tall and under control down the runway.
_(pause)_
10. You hit the board at full speed, right on your mark, no reaching, no chopping.
_(pause)_
11. You commit and explode up, driving off the board, riding the speed into the air.
_(pause)_
12. You land it clean, get up, and walk back ready for the next one. One attempt at a time — that's how it goes all meet.
_(pause)_
13. See yourself commit down the runway.
_(pause)_
14. Find your mark. Build the approach, stay tall. Hit the board, full speed — no reaching, no backing off.
_(pause)_
15. Commit and explode up. And if you foul or come up short, you let it go — next attempt, fresh start. Same mark, same full-speed approach, full commitment again.
_(pause)_
16. Now visualize the next rep.
_(pause)_
17. Your last attempt, the standings on the line, the runway quiet in front of you. You don't steer it. You find your mark, build the approach tall, hit the board at full speed, and commit and explode up — and whatever the last one was, this one is a fresh start.
_(pause)_
### Track & Field · Throw · VIZ
<!-- slug: viz-trf-throw | file: components/pregame/audio/clips-trackfield.ts -->

1. Keep your eyes closed. See yourself walking out onto the track toward your event.
_(pause)_
2. You hear the meet PA echo across the infield, and somewhere off in the distance, a starter's whistle.
_(pause)_
3. Hear the meet settle around you. Spikes clicking on the track and the runway apron, your teammates talking low.
_(pause)_
4. You see the bright chalk lines on the infield and catch the smell of it, fresh and dry.
_(pause)_
5. You feel your spikes bite into the track, firm and ready under you.
_(pause)_
6. You settle into your spot — the blocks, the ring, the top of the runway — and let everything else go quiet.
_(pause)_
7. You tell yourself, You belong here.
_(pause)_
8. You step into the ring and settle in. Slow breath. This throw is yours.
_(pause)_
9. You start slow and controlled, balanced at the back, building into the throw with patience.
_(pause)_
10. Slow, then violent — you stay back, load up, and then rip it through the middle.
_(pause)_
11. You finish tall and through, big and explosive, driving everything out in front of you.
_(pause)_
12. You stay in the ring, watch it sail, and step out clean. One throw at a time — that's how it goes all meet.
_(pause)_
13. See yourself be big and explosive.
_(pause)_
14. Settle in the ring. Slow, then violent. Stay back, then rip it — patient at the start, all power at the finish.
_(pause)_
15. Finish tall and through. And if one comes out flat or sails wide, you don't grip it tighter — next throw, let it go. Settle back in, slow then violent, and let it fly free.
_(pause)_
16. Now visualize the next rep.
_(pause)_
17. Your last throw, the board on the line, the ring quiet around you. You don't muscle it. You settle in, start slow and balanced, stay back, then rip it violent through the middle — finishing tall and through, big and explosive, and letting the last one go.
_(pause)_
## Hard Moment Clips

### Track & Field · Jump · foul
<!-- slug: hm-trf-jump-foul | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You hit the board flying, the jump feels huge, the best one all day. Then you look back and the red flag goes up. Your toe was over the line. No mark — it counts for nothing.
_(pause)_
3. Feel what your body does. Your stomach drops watching that flag. Your eyes stay locked on the board, replaying the steps. And the voice lands flat — my best jump and it doesn't even count. That's the sting talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That jump is over and the flag is up — nothing left to argue. You have attempts left in this round. Walk back to the top of the runway, breathe out long, and let the scratch go.
_(pause)_
6. Take it one attempt at a time. The distance is clearly in you — you just showed it. Don't pull back scared of the board; settle your steps, trust your mark, and hit it clean on the next attempt.
_(pause)_
7. Speak the truth. That scratch is real and it is over. It is not your identity. The board reports an attempt, but it cannot name an athlete — you're secure before the jump and after it. Reset and go again.
_(pause)_
### Track & Field · Jump · no-height
<!-- slug: hm-trf-jump-no-height | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You passed up to a higher mark, and you've missed your first two. Now one attempt stands between you and no mark for the whole meet — and standing at the top, the approach you've run a thousand times suddenly feels far away.
_(pause)_
3. Feel what your body does. Your breath sits high in your chest. Your steps feel unsure, like you can't quite find the start of the run-up. And the thought arrives fast — I can't make myself commit to it. Let it arrive. It's a feeling in this moment, not a fact about you.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Slow everything down. This is the gap between the warm-up and the one attempt that counts — it happens to real jumpers, and it is happening to your run-up today, not to who you are. Breathe out, and let this be just one attempt.
_(pause)_
6. You don't have to fix your approach standing here. Take your medicine — one attempt at a time. Slow your routine all the way down, pick one small target down the runway, and run through it, not at it. Then walk and let the round settle you.
_(pause)_
7. Speak the truth. This hard attempt is real, and it is over once you take it. It is not a verdict on you, and it is not your identity — you're secure before you ever step on the runway. Take what's bugging your approach to your coach this week and work it there. For now, reset and run the next one.
_(pause)_
### Track & Field · Jump · out-leaned
<!-- slug: hm-trf-jump-out-leaned | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're sitting in first, your mark holding up all flight. Then the last jumper steps up on their final attempt, hits it perfect, and buries your mark by a couple centimeters. First place, gone on the last jump of the day.
_(pause)_
3. Feel what your body does. Your chest tightens watching them celebrate. Your jaw sets. And the voice lands flat — I had it, I was right there, and it got taken at the buzzer. That's the disappointment talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That flight is over and their jump was theirs. You can't out-jump a mark that's already landed. Breathe out, let your shoulders drop, and bring your eyes back to your own day.
_(pause)_
6. Take what's real — you jumped well enough to lead a whole flight. Carry that forward. The next meet you control your own attempts; you can't control theirs, so spend nothing replaying the one that beat you.
_(pause)_
7. Speak the truth. Getting jumped on the last attempt is real, and it stings. It is not your identity. Their mark reports their attempt; it cannot name you — you're secure win or lose. Hold your head up, and go again.
_(pause)_
### Track & Field · Jump · bad-heat
<!-- slug: hm-trf-jump-bad-heat | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You drew the early flight. You're jumping cold while the seeded athletes wait their turn, and the runway feels foreign — no one ahead of you to chase, no big marks on the board to measure against.
_(pause)_
3. Feel what your body does. Your energy sags looking at the empty board. Your legs feel a little flat at the top of the runway. And the voice lands flat — what's the point, the real flight hasn't even started. That's the seeding talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The flight order doesn't decide your mark — the board takes every jump the same way, early flight or late. Breathe out, settle at the top of the runway, and bring your jump no matter who's watching.
_(pause)_
6. Bring your own runway with you. Run your full approach, hit your steps, attack the board — a big mark in an early flight still stands, and it forces the seeded jumpers to come find you. Set the bar instead of chasing it.
_(pause)_
7. Speak the truth. The early flight is real and it does not define you. It is not your identity. The seeding reports where they think you are; it cannot name an athlete. Run your own runway, and go again.
_(pause)_
### Track & Field · Jump · nervous
<!-- slug: hm-trf-jump-nervous | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You stand at the top of the runway, the board sixty feet away, the flight watching from the side. You rock onto your steps and for a second you can't feel where they are — just your heart pounding and the long strip of track in front of you.
_(pause)_
3. Feel what your body does. Your heart thumps. Your hands buzz at your sides. Your legs feel light and quick underneath you. What if I'm off my steps with everyone watching. That's the fear talking, not the truth.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath, let the buzz settle into your legs, and find your start mark under your feet.
_(pause)_
6. You don't have to force the jump — you just have to run your approach. Lock your eyes down the runway, hit your rhythm off the first step, and let the speed carry you to the board. Trust the steps you've drilled a thousand times.
_(pause)_
7. Speak the truth. The nerves are real, and they are not your identity. The flight doesn't get to name you and neither does this jump. Settle on your steps, run your approach, and go.
_(pause)_
### Track & Field · Jump · start-slow
<!-- slug: hm-trf-jump-start-slow | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your first attempt comes out flat and short, well under your average. You feel it the second you land — that wasn't you. And now you're chasing the round, sitting near the bottom of the board with two attempts left.
_(pause)_
3. Feel what your body does. Your jaw tightens looking at the short mark. The urge surges to swing for a huge one to make it all back at once. I have to get it all back on the next jump. That's the pressing talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That attempt is over and it's just one mark on the board. A flat opener is a start, not the round. Walk back to the top of the runway and let it be a fresh attempt.
_(pause)_
6. Don't try to win the round back with one giant leap — that's how you press the board and scratch. Take it one attempt at a time. Settle your steps, hit your rhythm, trust your approach, and the distance comes back on its own.
_(pause)_
7. Speak the truth. The slow start is real and it is over. It is not your identity. The board reports an attempt, but it cannot name an athlete — you don't have to rescue the round to be secure. One clean approach, and go again.
_(pause)_
### Track & Field · Jump · off-pace
<!-- slug: hm-trf-jump-off-pace | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. All day your steps are off. You're either way behind the board and leaving distance on the runway, or you're reaching and fouling. You can't find your approach, and every attempt feels like a guess instead of a rhythm.
_(pause)_
3. Feel what your body does. Your shoulders climb between attempts. Your run-up feels rushed and stuttery. And the voice lands flat — I can't even find my own steps today. That's the frustration talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those attempts are behind you. Steps drift in a meet — that's normal, and the fix is one attempt, not the whole day. Walk back to your start mark and breathe out long.
_(pause)_
6. Simplify the next one. Set your start mark, run through your first few steps with confidence, and let the speed build into the board — don't steer it, just run it. Find the rhythm on one attempt and the rest follow.
_(pause)_
7. Speak the truth. The off day is real and each attempt is over when it lands. It is not your identity. The board reports an attempt; it cannot name an athlete. Find your rhythm on the next one, and go again.
_(pause)_
### Track & Field · Throw · foul
<!-- slug: hm-trf-throw-foul | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The throw rockets out there, your best of the day, way past your marks. And then your momentum carries your foot over the toe board — red flag, no mark. The biggest throw of the meet, and it counts for nothing.
_(pause)_
3. Feel what your body does. Your stomach drops watching that flag go up. Your eyes stay locked on the ring, replaying the finish. And the voice lands flat — my biggest throw and I fouled it away. That's the sting talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That throw is over and the flag is up — nothing left to argue. You have throws left in this round. Step out of the ring, shake out your arms, breathe out long, and let the scratch go.
_(pause)_
6. Take it one throw at a time. The distance is clearly in you — you just showed it. Don't pull back scared of the board; stay tall, control your finish, keep it behind the toe board, and let the next one go clean.
_(pause)_
7. Speak the truth. That scratch is real and it is over. It is not your identity. The board reports an attempt, but it cannot name an athlete — you're secure before the throw and after it. Reset and go again.
_(pause)_
### Track & Field · Throw · no-height
<!-- slug: hm-trf-throw-no-height | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You've fouled your first two. The third is your last chance at a fair mark, and a scratch means you leave with nothing on the board — and standing in the ring, the throw you've made a thousand times suddenly feels far away.
_(pause)_
3. Feel what your body does. Your breath sits high in your chest. Your run-up feels unsure, like you can't quite commit to it. And the thought arrives fast — I can't make myself drive through it. Let it arrive. It's a feeling in this moment, not a fact about you.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Slow everything down. This is the gap between the warm-up and the one throw that counts — it happens to real throwers, and it is happening to your run-up today, not to who you are. Breathe out, and let this be just one throw.
_(pause)_
6. You don't have to fix your technique standing here. Take your medicine — one throw at a time. Slow your setup all the way down, pick one simple thing, stay inside the ring, and let an easy, committed throw go. Then step out and let the round settle you.
_(pause)_
7. Speak the truth. This hard attempt is real, and it is over once you take it. It is not a verdict on you, and it is not your identity — you're secure before you ever step in the ring. Take what's bugging your run-up to your coach this week and work it there. For now, reset and throw the next one.
_(pause)_
### Track & Field · Throw · out-leaned
<!-- slug: hm-trf-throw-out-leaned | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're winning into the final round, your mark holding all day. Then the thrower behind you steps into the ring and uncorks a bomb — a personal best, right at the end — and bumps you out of first on the last throw of the competition.
_(pause)_
3. Feel what your body does. Your chest tightens watching it land. Your jaw sets. And the voice lands flat — I led the whole comp and it got taken on the last throw. That's the disappointment talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That round is over and their throw was theirs. You can't out-throw a mark that's already landed. Breathe out, let your shoulders drop, and bring your eyes back to your own day.
_(pause)_
6. Take what's real — you threw well enough to lead a whole competition. Carry that forward. Next meet you control your own throws; you can't control theirs, so spend nothing replaying the one that beat you.
_(pause)_
7. Speak the truth. Getting out-thrown on the last throw is real, and it stings. It is not your identity. Their mark reports their attempt; it cannot name you — you're secure win or lose. Hold your head up, and go again.
_(pause)_
### Track & Field · Throw · bad-heat
<!-- slug: hm-trf-throw-bad-heat | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You throw first in the order, cold, with no big marks ahead of you to chase or measure against. The board is empty, the seeded throwers are waiting their turn, and the ring feels foreign with no rhythm set yet.
_(pause)_
3. Feel what your body does. Your energy sags looking at the empty board. Your arm feels a little flat warming up. And the voice lands flat — what's the point, the real throwers haven't even gone. That's the seeding talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The throwing order doesn't decide your mark — the board takes every throw the same way, first in the order or last. Breathe out, settle in the ring, and bring your throw no matter who's watching.
_(pause)_
6. Bring your own ring with you. Run your full setup, drive through your finish, attack the board — a big mark thrown first still stands, and it forces the seeded throwers to come find you. Set the mark instead of chasing it.
_(pause)_
7. Speak the truth. Throwing first is real and it does not define you. It is not your identity. The order reports where they think you are; it cannot name an athlete. Throw your own mark, and go again.
_(pause)_
### Track & Field · Throw · nervous
<!-- slug: hm-trf-throw-nervous | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You step into the ring, chalk on your hands, the competition watching from the side. You settle the implement against your neck, and suddenly it feels heavy and unfamiliar — like your body forgot a motion it knows cold.
_(pause)_
3. Feel what your body does. Your heart thumps. Your hands buzz against the implement. Your legs feel light underneath you in the ring. What if I rush it and let go too early with everyone watching. That's the fear talking, not the truth.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath, let the buzz settle into your legs, and feel your feet planted in the back of the ring.
_(pause)_
6. You don't have to force the throw — you just have to run your sequence. Stay patient in the back, build through your feet and hips, and let the finish rip on its own. Trust the motion you've drilled a thousand times.
_(pause)_
7. Speak the truth. The nerves are real, and they are not your identity. The competition doesn't get to name you and neither does this throw. Settle in the ring, run your sequence, and go.
_(pause)_
### Track & Field · Throw · start-slow
<!-- slug: hm-trf-throw-start-slow | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Your opener is well short of your average. You feel it leave your hand wrong, and it lands soft. Now you're pressing to make the final, sitting near the bottom of the board with your throws running out.
_(pause)_
3. Feel what your body does. Your jaw tightens looking at the short mark. The urge surges to muscle the next one as hard as you can to make it all back. I have to get it all back on the next throw. That's the pressing talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That throw is over and it's just one mark on the board. A short opener is a start, not the round. Step back to the ring and let it be a fresh throw.
_(pause)_
6. Don't try to win it back by throwing harder — muscling it is exactly how the throw gets short and the foot drifts over the board. Take it one throw at a time. Stay smooth, trust your sequence, let it build, and the distance comes back.
_(pause)_
7. Speak the truth. The slow start is real and it is over. It is not your identity. The board reports an attempt, but it cannot name an athlete — you don't have to rescue the round to be secure. One smooth throw, and go again.
_(pause)_
### Track & Field · Throw · off-pace
<!-- slug: hm-trf-throw-off-pace | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Attempt after attempt comes out flat and short. You know the big throw is in you — you've hit it in practice all week — but today you can't reach the mark you know you have, and the round is slipping by.
_(pause)_
3. Feel what your body does. Your shoulders climb between throws. Your sequence feels rushed and disconnected. And the voice lands flat — the big one just isn't coming today. That's the frustration talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those throws are behind you. Distance comes and goes within a comp — that's normal, and the fix is one throw, not the whole day. Step back to the ring and breathe out long.
_(pause)_
6. Simplify the next one. Stay patient in the back, build smooth through your feet, and let the finish do the work — don't force the distance, just run the sequence. Find the rhythm on one throw and the big one shows up.
_(pause)_
7. Speak the truth. The off day is real and each attempt is over when it lands. It is not your identity. The board reports an attempt; it cannot name an athlete. Find your rhythm on the next one, and go again.
_(pause)_
### Track & Field · Sprint · false-start
<!-- slug: hm-trf-sprint-false-start | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The gun cracks and your body twitches a hair early. Then a second shot. The official's arm comes up and points down your lane. You're out — months of work erased before you ran a single step.
_(pause)_
3. Feel what your body does. Heat floods up your neck as you straighten up out of the blocks. Your hands shake. And the voice lands flat — I never even got to run, and now it's gone. That's the shock talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That call is made and it cannot be undone. Standing on the track arguing it in your head only carries it into the next race. Breathe out long, drop your shoulders, and let this one go.
_(pause)_
6. Take the lesson, not the spiral. Next time you set in the blocks, get still and wait for the gun — weight settled, eyes down the track, move only on the shot. You can't jump what you don't anticipate.
_(pause)_
7. All that training is still in you and it isn't going anywhere. The work didn't disappear with the call — it's in your legs, ready for the next gun.
_(pause)_
8. Speak the truth. That false start is real and it is over. It is not your identity. A race you never got to run cannot name you — your worth was settled before you ever stepped into the blocks. Reset and go again.
_(pause)_
### Track & Field · Sprint · handoff
<!-- slug: hm-trf-sprint-handoff | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're flying into the exchange zone and you reach back for the stick. It isn't there. The timing breaks, the pass dies in your hand, and three teammates' race dies with it.
_(pause)_
3. Feel what your body does. Your stomach drops as your hand closes on nothing. You can't look at the relay. And the voice lands flat — I cost everyone, I ruined it for the whole team. That's the guilt talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That exchange is over and it's behind you on the track. The catastrophe in your head — I ruined everything — isn't real, and your teammates are still your teammates. Breathe out long and let it be done right now.
_(pause)_
6. Take it to your next handoff. Run your acceleration, trust the call, reach back on the cue and feel the stick hit your palm. An exchange is won in the rhythm, not the panic — settle it and own your leg.
_(pause)_
7. Speak the truth. That blown handoff is real and it is over. It is not your identity, and one bad exchange doesn't decide whether you belong on this relay — you're secure before the pass and after it. Reset and go again.
_(pause)_
### Track & Field · Sprint · out-leaned
<!-- slug: hm-trf-sprint-out-leaned | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You ran dead even with them the whole hundred. You hit the line together, you throw your chest, and the photo says you lost by inches. Second, by a lean.
_(pause)_
3. Feel what your body does. Your chest heaves past the line. Your eyes lock on the place beside your name. And the voice lands flat — I had them and I gave it away at the tape. That's the sting talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That race is over and the time is on the board. Walk it off on the infield and let one long exhale settle you. You have more racing today.
_(pause)_
6. Don't replay the tape on a loop. Take it to your next race instead — run all the way through the line, drive your last steps, time the lean so you win the last inch instead of giving it away.
_(pause)_
7. Speak the truth. That lean at the line is real and it is over. It is not your identity. The tape reports a race, but it cannot name a runner — you're secure before the finish and after it. Reset and go again.
_(pause)_
### Track & Field · Sprint · bad-heat
<!-- slug: hm-trf-sprint-bad-heat | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. They put you in lane one on the tight inside turn while the runner you have to beat drew lane four with the gentle curve. The draw feels rigged against you before the gun even fires.
_(pause)_
3. Feel what your body does. Your jaw tightens looking down the cramped lane. You start running their race in your head instead of yours. And the voice lands flat — the draw beat me before I ran. That's the excuse talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The lane assignment doesn't decide your race — the clock takes everyone's time the same way, lane one or lane four. Breathe out, settle into your blocks, and bring your race no matter what's beside you.
_(pause)_
6. Run your own lane, not theirs. Stay low and patient through the tight turn, run the inside line clean, and unload on the straight. A great race out of lane one still crashes the next seeding.
_(pause)_
7. Speak the truth. The bad draw is real and it does not define you. It is not your identity. The lane sheet reports where they think you are; it cannot name a runner. Run your own race, and go again.
_(pause)_
### Track & Field · Sprint · hit-wall
<!-- slug: hm-trf-sprint-hit-wall | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're out front at eighty meters and then your arms turn to concrete. Your form falls apart, your stride shortens, and everyone you passed comes streaming back at you over the last twenty.
_(pause)_
3. Feel what your body does. Your shoulders climb up around your ears. Your arms thrash to find the speed that left. And the voice lands flat — I always tie up at the end, I can't finish. That's the panic talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That race is over and the time is on the board. Climb down off the effort, walk the infield, and let one long exhale clear it. You have more racing today.
_(pause)_
6. Tying up is a relaxation problem, not a willpower problem. When the burn hits, you don't grip harder — you stay tall and loose: drop the shoulders, relax the face and hands, and let the speed flow instead of forcing it.
_(pause)_
7. Take it to your next race. Run the first part within yourself so you have something left, then carry your form through the line. Speed comes from staying smooth, not from clenching.
_(pause)_
8. Speak the truth. That tie-up is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure however the last fifty came. Reset and go again.
_(pause)_
### Track & Field · Sprint · nervous
<!-- slug: hm-trf-sprint-nervous | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're walking to the blocks and the stadium goes quiet. The starter is waiting. You settle your feet on the pedals and your legs feel like they belong to someone else.
_(pause)_
3. Feel what your body does. Your heart slams in your chest. Your hands buzz against the track. Your stomach is light. What if I'm tight off the gun and it's over before I find my speed. That's the fear talking, not the truth.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath out behind the blocks, feel your feet on the pedals, and let the buzz settle into power.
_(pause)_
6. You don't have to manage the whole race standing here — you just have to react. See the start, drive low out of the blocks, and let your speed come up underneath you. Trust the work. It's already in your legs.
_(pause)_
7. Speak the truth. The nerves are real, and they are not your identity. The stadium doesn't get to name you and neither does this race. Settle in the blocks, react to the gun, and go.
_(pause)_
### Track & Field · Sprint · start-slow
<!-- slug: hm-trf-sprint-start-slow | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The gun goes and you're a beat behind everyone. Your first steps are heavy, you come up out of your drive too soon, and you're already buried in the field before you've hit top speed.
_(pause)_
3. Feel what your body does. You feel the gap open in front of you. Your stride gets frantic, pressing to claw it back. And the voice lands flat — I lost it on the start, it's already gone. That's the panic talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That race is over and the slow start is behind you. Walk the infield and let one long exhale clear it. You have more racing today.
_(pause)_
6. Pressing to make it back is exactly what kept you behind. Take it to your next race: react to the gun, stay low and patient through your drive phase, and let the speed build under you. Get out clean so you never have to chase.
_(pause)_
7. Speak the truth. The slow start is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure however you came off the line. Nail the next start, and go again.
_(pause)_
### Track & Field · Sprint · off-pace
<!-- slug: hm-trf-sprint-off-pace | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You hit two hundred of the four hundred feeling great, right on the runner ahead. Then the last hundred the bottom drops out — your legs flood, your turnover dies, and the field swallows you down the home straight.
_(pause)_
3. Feel what your body does. Your legs go to lead and your stride collapses inward. You feel them coming past on both sides. And the voice lands flat — I went out too hard, I always fade. That's the doubt talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That race is over and the fade is behind you. Walk the infield, let one long exhale settle you, and let the home straight go. You have more racing today.
_(pause)_
6. The four hundred is won by pace, not by the first two hundred. Next race, run the opening within yourself, stay tall and relaxed at the two-fifty, and save the gear that carries you through the line. Distribute the effort and the back half holds.
_(pause)_
7. Speak the truth. That fade is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure however the last hundred came. Reset and go again.
_(pause)_
### Track & Field · Dist · hit-wall
<!-- slug: hm-trf-dist-hit-wall | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. At the twelve hundred of the sixteen hundred your legs flood and your lungs close down. The pace you've held all year is suddenly impossible, and the pack you were tucked into starts to inch away.
_(pause)_
3. Feel what your body does. Your stride shortens and your shoulders creep up. The lungs scream and the legs go heavy. And the voice lands flat — I'm done, I can't hold this, I'm falling off. That's the pain talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. This is the part of the race you trained for — the wall is the test, not the end. It comes for everyone here, and it's happening to your legs right now, not to who you are. Breathe out long and bring your focus back to this one lap.
_(pause)_
6. Don't try to win it all back at once — that's how a distance race falls apart. Stay tall, relax your face and shoulders, and shorten the race down to the next hundred meters. Just get to the next mark, then the next.
_(pause)_
7. Then ride the bell. When the last lap comes, you don't need a hero surge — you need your rhythm back. Find your turnover, lock onto the runner ahead, and reel them in stride by stride.
_(pause)_
8. Speak the truth. That wall is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure whether you held the pace or not. Break the spiral here. Reset and go again.
_(pause)_
### Track & Field · Dist · handoff
<!-- slug: hm-trf-dist-handoff | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. On the distance medley exchange your timing is off. You come in hot, your incoming runner is gassed, you stutter in the zone — and the lead you were handed leaks away in the fumble.
_(pause)_
3. Feel what your body does. Your stomach drops in the bobble of the pass. You can't look at the runner who handed it off clean. And the voice lands flat — I cost everyone, I let the whole relay down. That's the guilt talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That exchange is over and you still have a whole leg to run. The catastrophe in your head — I ruined it for everyone — isn't real, and your teammates are still your teammates. Breathe out long and bring your focus to the race in front of you.
_(pause)_
6. Run the leg you've still got. Settle into your pace, hunt the runners ahead one at a time, and give your team back the ground in the only place you can — on the track now. A clean leg answers a sloppy exchange.
_(pause)_
7. Speak the truth. That blown handoff is real and it is over. It is not your identity, and one bad exchange doesn't decide whether you belong on this relay — you're secure before the pass and after it. Reset and go again.
_(pause)_
### Track & Field · Dist · out-leaned
<!-- slug: hm-trf-dist-out-leaned | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You led the whole last lap, you held the front, and you can hear them coming. In the final fifty someone with a fresher gear blows past you, and you cross the line a step behind after leading all the way.
_(pause)_
3. Feel what your body does. Your whole body burns from the front-running. Your eyes lock on the back that just passed you. And the voice lands flat — I did all the work and they stole it at the end. That's the sting talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That race is over and the time is on the board. Walk it off on the infield and let one long exhale settle you. Leading takes guts — the kick is just a skill you build next.
_(pause)_
6. Take it to your next race. If you're going to lead, lead honest and start your drive earlier so there's no gear left to out-kick. Or sit one stride back and time your own finish. Either way, you train the closing speed that beat you.
_(pause)_
7. Speak the truth. That out-kick at the line is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure before the finish and after it. Reset and go again.
_(pause)_
### Track & Field · Dist · bad-heat
<!-- slug: hm-trf-dist-bad-heat | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're trapped on the rail in lane one, bodies stacked on your shoulder and a runner right on your back. The pace is winding up, the move is going, and you have nowhere to go.
_(pause)_
3. Feel what your body does. Your shoulders tense, hemmed in by the pack. You start to panic, looking for a gap that isn't there. And the voice lands flat — I'm boxed, I'm stuck, the race is leaving without me. That's the panic talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Being boxed is a position, not a verdict — it changes every few strides. Don't spend your race fighting the wall of bodies. Stay relaxed on the rail, hold your rhythm, and wait for the gap to open.
_(pause)_
6. Be patient, then decisive. Ease back a half-step to find the lane, swing wide off the turn when it clears, and go through clean. The runner who keeps their head in the box is the one who's there at the bell.
_(pause)_
7. Speak the truth. Getting boxed in is real and it is over. It is not your identity. The pack reports a moment in a race; it cannot name a runner. Find your gap, run your race, and go again.
_(pause)_
### Track & Field · Dist · nervous
<!-- slug: hm-trf-dist-nervous | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're on the starting line, the field crowds in around you, elbows close. You're not afraid of the race — you're afraid of how much the next few laps are going to hurt. The whole grind is still in front of you, and your stomach is in your throat.
_(pause)_
3. Feel what your body does. Your heart thumps. Your legs feel heavy already. The mind runs ahead to the worst of it. How am I going to hold pace when it really starts to hurt. That's the dread talking, not the truth.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath out on the line, feel your feet under you, and bring your focus to just the first lap.
_(pause)_
6. Don't run the whole race standing here — you can't carry all of it at once. Break it into laps. Settle into pace, hold your rhythm, and take it one lap at a time. You've trained every meter of it.
_(pause)_
7. Speak the truth. The nerves are real, and they are not your identity. The dread of the distance doesn't get to name you and neither does this race. Settle on the line, run the first lap, and go.
_(pause)_
### Track & Field · Dist · start-slow
<!-- slug: hm-trf-dist-start-slow | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. The gun goes and the pace crawls. The pack jogs the first lap, you're stuck in the middle of it with nowhere to run, and the leaders start to string out and gap the field while you're trapped behind the crawl.
_(pause)_
3. Feel what your body does. Your stride feels choppy and bottled up. The frustration rises as the leaders pull away. And the voice lands flat — the slow start trapped me, the race is gone up front. That's the panic talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. A slow first lap is a tactic, not a sentence — the race always comes back together. Don't burn a panicked surge to chase a gap this early. Stay relaxed, hold your position, and let the pace come to you.
_(pause)_
6. Move with purpose, not panic. Stay out of the box on the rail, drift up to the leaders over the next lap, and be there when the real racing starts. A slow start rewards the runner who's patient and positioned.
_(pause)_
7. Speak the truth. The slow start is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure however the pace went out. Settle into position, and go again.
_(pause)_
### Track & Field · Dist · off-pace
<!-- slug: hm-trf-dist-off-pace | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You glance at your watch at the mile mark and you're four seconds off the split you needed for the standard. The math is already against the time you came here to run, and there's a long way still to go.
_(pause)_
3. Feel what your body does. Your jaw tightens doing the math mid-stride. The urge surges to sprint and rip the gap back all at once. I'm off pace, I have to make up the whole gap right now. That's the panic talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Four seconds off is not a hole you dig out of in one lap. Sprinting to erase it now is exactly how a distance race falls apart. Settle, and bring your focus back to your rhythm.
_(pause)_
6. Claw it back in pieces, lap by lap — don't lunge for it all at once. Lock onto your target split, build through the middle, and trust your finish. The time comes back in increments, not in one heroic surge.
_(pause)_
7. Speak the truth. Being off pace is real and that moment is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure whether you hit the standard today or not. Settle onto your pace, and go again.
_(pause)_
### Track & Field · Hurdle · false-start
<!-- slug: hm-trf-hurdle-false-start | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You break a hair early at the gun. The second shot fires and the official's arm points down your lane. You're disqualified before you ever reached the first barrier — the whole race gone in a twitch.
_(pause)_
3. Feel what your body does. Heat floods up your neck as you come out of the blocks. Your hands shake. And the voice lands flat — I never even cleared a hurdle, and now it's over. That's the shock talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That call is made and it cannot be undone. Standing on the track arguing it in your head only carries it into the next race. Breathe out long, drop your shoulders, and let this one go.
_(pause)_
6. Take the lesson, not the spiral. Next time you set, get still and wait for the gun — weight settled, eyes on the first hurdle, move only on the shot. You can't jump what you don't anticipate.
_(pause)_
7. All that work on your steps and your trail leg is still in you. The call didn't take your training — it's in your legs, ready for the next gun.
_(pause)_
8. Speak the truth. That false start is real and it is over. It is not your identity. A race you never got to run cannot name you — your worth was settled before you ever stepped into the blocks. Reset and go again.
_(pause)_
### Track & Field · Hurdle · handoff
<!-- slug: hm-trf-hurdle-handoff | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. On the relay your exchange is sloppy. The timing's off, the stick bobbles between your legs, you fight to hang onto it — and the smooth pass you drilled all season turns into a scramble.
_(pause)_
3. Feel what your body does. Your stomach drops as the stick juggles in your hands. You can't look at your teammate. And the voice lands flat — I cost us the race, I let the whole team down. That's the guilt talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That exchange is over and it's behind you. The catastrophe in your head — I ruined it for everyone — isn't real, and your teammates are still your teammates. Breathe out long and let the bobble go.
_(pause)_
6. Take it to your next handoff. Hit your acceleration, trust the cue, and feel the stick settle clean in your palm. A pass is won in the rhythm, not the grab — settle the exchange and run your leg free.
_(pause)_
7. Speak the truth. That blown handoff is real and it is over. It is not your identity, and one bad exchange doesn't decide whether you belong on this relay — you're secure before the pass and after it. Reset and go again.
_(pause)_
### Track & Field · Hurdle · out-leaned
<!-- slug: hm-trf-hurdle-out-leaned | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You and the next lane clear the last hurdle dead even and sprint for the line together. You throw everything you have at the tape, and they get the lean. Second, by the length of a chest.
_(pause)_
3. Feel what your body does. Your chest heaves past the line. Your eyes lock on the place beside your name. And the voice lands flat — I cleared it with them and gave it away at the tape. That's the sting talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That race is over and the time is on the board. Walk it off on the infield and let one long exhale settle you. You have more racing today.
_(pause)_
6. Don't replay the tape on a loop. Take it to your next race — clear that last barrier clean and sprint your steps all the way through the line, and time the lean so you win the last inch instead of giving it away.
_(pause)_
7. Speak the truth. That lean at the line is real and it is over. It is not your identity. The tape reports a race, but it cannot name a runner — you're secure before the finish and after it. Reset and go again.
_(pause)_
### Track & Field · Hurdle · foul
<!-- slug: hm-trf-hurdle-foul | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You clip the seventh barrier hard. It cracks against your lead leg, knocks you off your rhythm, and you stumble sideways — out of the race you were winning, fighting just to stay on your feet.
_(pause)_
3. Feel what your body does. Your stride scatters as you catch your balance. The field pulls past while you reset. And the voice lands flat — I just threw away the whole race on one hurdle. That's the panic talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That hurdle is behind you and there are barriers left. Hitting one is a single mistake, not the whole race. Get your stride back and attack the next one right now.
_(pause)_
6. Don't chop and reach in fear of the next barrier — that's how you clip another. Find your steps, run tall at the hurdle, and snap the lead leg down. Rhythm beats hesitation, every time.
_(pause)_
7. Speak the truth. That hit hurdle is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure however that barrier came. Attack the next one, and go again.
_(pause)_
### Track & Field · Hurdle · bad-heat
<!-- slug: hm-trf-hurdle-bad-heat | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You drew the outside lane, way out wide. You can't see the field to gauge your rhythm off anyone — no one beside you to run with, just you and ten barriers stretching out alone.
_(pause)_
3. Feel what your body does. Your eyes keep darting inward, looking for someone to chase. You feel exposed and alone out there. And the voice lands flat — I can't run blind, the draw beat me. That's the excuse talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. The lane assignment doesn't decide your race — the clock takes every time the same way, lane eight or lane four. Breathe out, settle into your blocks, and bring your race no matter who you can see.
_(pause)_
6. You never needed to race anyone else's rhythm — you race the hurdles. Lock onto your own steps, attack each barrier on your count, and run your pattern. Out front and blind is just you against the clock, the way it always was.
_(pause)_
7. Speak the truth. The bad draw is real and it does not define you. It is not your identity. The lane sheet reports where they think you are; it cannot name a runner. Run your own steps, and go again.
_(pause)_
### Track & Field · Hurdle · hit-wall
<!-- slug: hm-trf-hurdle-hit-wall | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Coming off hurdle eight in the four hundred hurdles your legs lock up. The lactic floods in, your steps to the next barrier fall apart, and the stagger you built over the first three hundred evaporates as the field closes.
_(pause)_
3. Feel what your body does. Your legs go to stone and your stride pattern scatters. The barriers seem to rush up too fast. And the voice lands flat — I'm dying, I can't hold my steps, it's all coming back. That's the pain talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. This is the part of the race you trained for — the back-half lockup is the test, not the end. It comes for every four-hundred hurdler, and it's happening to your legs right now, not to who you are. Breathe out and bring your focus to the next barrier.
_(pause)_
6. Don't panic over the steps when they shorten — that's normal this late. Stay tall, relax your shoulders, and commit hard to the next hurdle. Clear it, get to the one after, and run the race two barriers at a time to the line.
_(pause)_
7. Speak the truth. That back-half lockup is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure whether your steps held or not. Attack the next barrier, and go again.
_(pause)_
### Track & Field · Hurdle · nervous
<!-- slug: hm-trf-hurdle-nervous | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You're setting in the blocks staring down ten barriers stretching away from you. The first one looks close and tall. Your trail leg feels like it forgot the pattern you've drilled a thousand times.
_(pause)_
3. Feel what your body does. Your heart slams. Your hands buzz on the track. Your stomach is light. What if I'm off my steps to the first one and the whole rhythm's gone. That's the fear talking, not the truth.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Those nerves aren't a warning — they're energy your body brought because this matters. Take one slow breath out behind the blocks, feel your feet on the pedals, and let the buzz settle into power.
_(pause)_
6. You don't have to think about all ten hurdles standing here — you just have to get to the first one. Drive low out of the blocks, hit your steps to barrier one, and let the pattern take over. Your body knows it. Trust the reps.
_(pause)_
7. Speak the truth. The nerves are real, and they are not your identity. The ten barriers don't get to name you and neither does this race. Settle in the blocks, attack the first hurdle, and go.
_(pause)_
### Track & Field · Hurdle · start-slow
<!-- slug: hm-trf-hurdle-start-slow | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. You come out of the blocks flat. Your steps to the first hurdle are wrong — you're too close, crowded on the barrier — and you have to stutter and chop just to get up and over it.
_(pause)_
3. Feel what your body does. Your rhythm jams up at the first barrier. You feel the stutter cost you a beat on the field. And the voice lands flat — my steps are off, the whole race is wrecked now. That's the panic talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. That race is over and the rough start is behind you. Walk the infield and let one long exhale clear it. One bad approach doesn't erase the pattern you own. You have more racing today.
_(pause)_
6. Take it to your next race. Drive hard and tall out of the blocks, trust your count to the first barrier, and hit it in stride — when the first hurdle is clean, the whole rhythm follows. Set the pattern early and ride it.
_(pause)_
7. Speak the truth. Being off your steps early is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure however you came off the line. Nail the next approach, and go again.
_(pause)_
### Track & Field · Hurdle · off-pace
<!-- slug: hm-trf-hurdle-off-pace | file: components/pregame/audio/clips-trackfield.ts -->

1. Now rehearse the hard moment.
_(pause)_
2. Mid-race your three-step pattern between the hurdles falls apart. You're caught between steps at every barrier now, reaching and reaching, jamming the takeoff, fighting the spacing instead of flowing through it.
_(pause)_
3. Feel what your body does. Your stride goes ragged, stretching for each hurdle. Every barrier feels like a fresh fight. And the voice lands flat — I've lost my rhythm, I can't get it back. That's the doubt talking, not the truth. Let it pass.
_(pause)_
4. Now the reset. Return to your anchor.
_(pause)_
5. Losing the rhythm is a tempo problem, not a verdict — and you can rebuild it one barrier at a time. Don't fight the whole race in your head. Bring your focus down to the very next hurdle.
_(pause)_
6. Climb back onto the pattern barrier by barrier. Run tall, snap the lead leg down, and re-establish your count to the next one — then the one after that. The rhythm is still in your body; reach back for it stride by stride.
_(pause)_
7. Speak the truth. Losing your rhythm is real and it is over. It is not your identity. The clock reports a race, but it cannot name a runner — you're secure whether the pattern held or not. Find your count again, and go again.
_(pause)_
