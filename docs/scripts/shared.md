# From Victory · Script Book · Shared (cross-sport)


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

## Breath Threshold

### breath-threshold
<!-- slug: breath-threshold | file: components/pregame/audio/clips.ts -->

1. Breathe first and reset. 4 seconds in, 6 seconds out, from the diaphragm, not the chest.
_(pause: 1s)_
2. Inhale.
_(pause: 4s)_
3. Exhale.
_(pause: 6s)_
4. Inhale.
_(pause: 4s)_
5. Exhale. Release.
_(pause: 6s)_
6. Inhale.
_(pause: 4s)_
7. Exhale.
_(pause: 6s)_
_(pause: 0.8s)_
8. Ready. Now set your focus.
## Shared Structural Clips

### Shared · Opening
<!-- slug: shared-opening | file: components/pregame/audio/clips.ts -->

1. Now, take two breaths. Four in. Six out.
_(pause: 0.8s)_
2. Inhale.
_(pause: 4s)_
3. Exhale.
_(pause: 6s)_
4. Inhale.
_(pause: 4s)_
5. Exhale.
_(pause: 6s)_
6. Remember what is true.
_(pause: 0.8s)_
7. The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.
_(pause: 1s)_
### Shared · Reset Plan
<!-- slug: shared-reset-plan | file: components/pregame/audio/clips.ts -->

1. When the moment hits, come back to what is true.
_(pause: 1s)_
2. Breathe. Reset your body. Say the truth. Make the next play.
_(pause: 1.5s)_
### Shared · Prayer (Guided)
<!-- slug: shared-prayer | file: components/pregame/audio/clips.ts -->

1. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause: 2s)_
### Shared · Send-off
<!-- slug: shared-sendoff | file: components/pregame/audio/clips.ts -->

1. You are secure. Now play from victory.
### Anchor · long-exhale
<!-- slug: anc-long-exhale | file: components/pregame/audio/clips.ts -->

1. Long exhale.
### Anchor · tap-stick-twice
<!-- slug: anc-tap-stick-twice | file: components/pregame/audio/clips.ts -->

1. Tap your stick twice.
### Anchor · touch-glove
<!-- slug: anc-touch-glove | file: components/pregame/audio/clips.ts -->

1. Touch your glove.
### Anchor · press-thumb-to-palm
<!-- slug: anc-press-thumb-to-palm | file: components/pregame/audio/clips.ts -->

1. Press your thumb to your palm.
### Anchor · look-at-tape
<!-- slug: anc-look-at-tape | file: components/pregame/audio/clips.ts -->

1. Look at your tape.
### Anchor · take-a-drink
<!-- slug: anc-take-a-drink | file: components/pregame/audio/clips.ts -->

1. Take a drink from your bottle.
### Self-Talk · 01
<!-- slug: st-01 | file: components/pregame/audio/clips.ts -->

1. You're okay. Next shift.
### Self-Talk · 02
<!-- slug: st-02 | file: components/pregame/audio/clips.ts -->

1. Breathe. Do your job.
### Self-Talk · 03
<!-- slug: st-03 | file: components/pregame/audio/clips.ts -->

1. Stay steady. Make the next play.
### Self-Talk · 04
<!-- slug: st-04 | file: components/pregame/audio/clips.ts -->

1. You don't need to do too much.
### Self-Talk · 05
<!-- slug: st-05 | file: components/pregame/audio/clips.ts -->

1. Compete, recover, go again.
### Self-Talk · 06
<!-- slug: st-06 | file: components/pregame/audio/clips.ts -->

1. Your identity is secure. Play free.
### Self-Talk · 07
<!-- slug: st-07 | file: components/pregame/audio/clips.ts -->

1. You are secure. Take the next faithful action.
### Cue Word · steady · reset
<!-- slug: cw-steady-reset | file: components/pregame/audio/clips.ts -->

1. Steady.
### Cue Word · steady · sendoff
<!-- slug: cw-steady-sendoff | file: components/pregame/audio/clips.ts -->

1. Steady.
### Cue Word · courage · reset
<!-- slug: cw-courage-reset | file: components/pregame/audio/clips.ts -->

1. Courage.
### Cue Word · courage · sendoff
<!-- slug: cw-courage-sendoff | file: components/pregame/audio/clips.ts -->

1. Courage.
### Cue Word · simple · reset
<!-- slug: cw-simple-reset | file: components/pregame/audio/clips.ts -->

1. Simple.
### Cue Word · simple · sendoff
<!-- slug: cw-simple-sendoff | file: components/pregame/audio/clips.ts -->

1. Simple.
### Cue Word · attack · reset
<!-- slug: cw-attack-reset | file: components/pregame/audio/clips.ts -->

1. Attack.
### Cue Word · attack · sendoff
<!-- slug: cw-attack-sendoff | file: components/pregame/audio/clips.ts -->

1. Attack.
### Cue Word · next · reset
<!-- slug: cw-next-reset | file: components/pregame/audio/clips.ts -->

1. Next.
### Cue Word · next · sendoff
<!-- slug: cw-next-sendoff | file: components/pregame/audio/clips.ts -->

1. Next.
### Cue Word · serve · reset
<!-- slug: cw-serve-reset | file: components/pregame/audio/clips.ts -->

1. Serve.
### Cue Word · serve · sendoff
<!-- slug: cw-serve-sendoff | file: components/pregame/audio/clips.ts -->

1. Serve.
### Cue Word · compete · reset
<!-- slug: cw-compete-reset | file: components/pregame/audio/clips.ts -->

1. Compete.
### Cue Word · compete · sendoff
<!-- slug: cw-compete-sendoff | file: components/pregame/audio/clips.ts -->

1. Compete.
### Cue Word · faithful · reset
<!-- slug: cw-faithful-reset | file: components/pregame/audio/clips.ts -->

1. Faithful.
### Cue Word · faithful · sendoff
<!-- slug: cw-faithful-sendoff | file: components/pregame/audio/clips.ts -->

1. Faithful.
### Cue Word · free · reset
<!-- slug: cw-free-reset | file: components/pregame/audio/clips.ts -->

1. Free.
### Cue Word · free · sendoff
<!-- slug: cw-free-sendoff | file: components/pregame/audio/clips.ts -->

1. Free.
### Cue Word · relentless · reset
<!-- slug: cw-relentless-reset | file: components/pregame/audio/clips.ts -->

1. Relentless.
### Cue Word · relentless · sendoff
<!-- slug: cw-relentless-sendoff | file: components/pregame/audio/clips.ts -->

1. Relentless.
### Anchor · bounce-ball-twice
<!-- slug: anc-bounce-ball-twice | file: components/pregame/audio/clips.ts -->

1. Bounce the ball twice.
### Anchor · tap-floor
<!-- slug: anc-tap-floor | file: components/pregame/audio/clips.ts -->

1. Tap the floor.
### Anchor · look-at-rim
<!-- slug: anc-look-at-rim | file: components/pregame/audio/clips.ts -->

1. Look at the rim.
### Self-Talk Basketball · 01
<!-- slug: st-bb-01 | file: components/pregame/audio/clips.ts -->

1. You're okay. Next possession.
### Anchor · tap-bat-twice
<!-- slug: anc-tap-bat-twice | file: components/pregame/audio/clips.ts -->

1. Tap your bat twice.
### Anchor · look-at-the-pitcher
<!-- slug: anc-look-at-the-pitcher | file: components/pregame/audio/clips.ts -->

1. Look at the pitcher.
### Self-Talk Baseball · 01
<!-- slug: st-bsb-01 | file: components/pregame/audio/clips.ts -->

1. You're okay. Next at-bat.
### Anchor · glf-regrip
<!-- slug: anc-glf-regrip | file: components/pregame/audio/clips.ts -->

1. Re-grip the club.
### Anchor · glf-glove-tap
<!-- slug: anc-glf-glove-tap | file: components/pregame/audio/clips.ts -->

1. Glove tap.
### Anchor · glf-step-back
<!-- slug: anc-glf-step-back | file: components/pregame/audio/clips.ts -->

1. Step back, then step in.
### Self-Talk Golf · 01
<!-- slug: st-glf-01 | file: components/pregame/audio/clips.ts -->

1. You're okay. Next shot.
### Anchor · ftb-chinstrap
<!-- slug: anc-ftb-chinstrap | file: components/pregame/audio/clips.ts -->

1. Snap the chinstrap.
### Anchor · ftb-tap-helmet
<!-- slug: anc-ftb-tap-helmet | file: components/pregame/audio/clips.ts -->

1. Tap the helmet.
### Anchor · ftb-break-huddle
<!-- slug: anc-ftb-break-huddle | file: components/pregame/audio/clips.ts -->

1. Clap and break the huddle.
### Self-Talk Football · 01
<!-- slug: st-ftb-01 | file: components/pregame/audio/clips.ts -->

1. You're okay. Next play.
### Shared · Prayer (Self-guided)
<!-- slug: shared-prayer-selfguided | file: components/pregame/audio/clips.ts -->

1. Take a moment with God.
_(pause: 1s)_
2. You do not need perfect words. He already knows what you are carrying.
_(pause: 1s)_
3. Thank him. Give him the pressure. Ask for courage. Ask to play free and serve your team.
_(pause: 1s)_
4. Now pray in your own words.
_(pause: 30s)_
### Shared · Cue Word Intro
<!-- slug: shared-cue-word-intro-pre | file: components/pregame/audio/clips.ts -->

1. When the pressure builds.
_(pause: 0.5s)_
2. Come back to your breath and speak your cue word.
_(pause: 0.8s)_
### Shared · Cue Word Send-off
<!-- slug: shared-cue-word-sendoff-pre | file: components/pregame/audio/clips.ts -->

1. Remember your cue word:
_(pause: 0.3s)_
### Shared · Viz Intro
<!-- slug: shared-viz-intro | file: components/pregame/audio/clips.ts -->

1. Now, visualize this scenario.
_(pause: 0.6s)_
### Shared · Anchor Intro
<!-- slug: shared-anchor-intro | file: components/pregame/audio/clips.ts -->

1. Remember your anchor.
_(pause: 0.6s)_
### Shared · Self-Talk Intro
<!-- slug: shared-selftalk-intro | file: components/pregame/audio/clips.ts -->

1. Now, say it to yourself.
_(pause: 0.6s)_

## Need Openers (shared)

Sport-NEUTRAL openers (FV-466) — the fallback for every sport without its
own opener set (football, golf, basketball "Calm", baseball, lacrosse,
swimming, track & field). Hockey keeps its own openers in hockey.md;
basketball keeps opener-bb-* in basketball.md. Edits here must contain NO
sport-specific vocabulary — a golfer, a swimmer, and a linebacker should
all nod.

### Shared Opener · be-vocal
<!-- slug: opener-shared-be-vocal | file: components/pregame/audio/opener-shared-be-vocal.ts -->

1. Close your eyes. Drop your shoulders.
_(pause: 1s)_
2. Psalm 118 is a song of trust under pressure — the writer is surrounded and pushed hard, but because the Lord is with him, fear of people does not rule him.
_(pause: 1s)_
3. Hear this from Psalm 118:6. The Lord is with me; I will not be afraid. What can people do to me?
_(pause: 1s)_
4. Fear wants you quiet. It tells you not to draw attention, not to be wrong out loud, not to look like you are trying too hard.
_(pause: 1s)_
5. But in Christ, you do not have to protect your image. You are already secure.
_(pause: 1s)_
6. So speak. Call it early. Warn them. Encourage them. Let your teammates hear you.
_(pause: 1s)_
7. Talking is competing. Your voice shapes the moment before it even arrives. It helps your team win.
_(pause: 1s)_
8. Be loud early. Be clear. Be steady. Let your voice set the tone.
_(pause: 1s)_

### Shared Opener · hope
<!-- slug: opener-shared-hope | file: components/pregame/audio/opener-shared-hope.ts -->

1. Close your eyes. Take one full breath.
_(pause: 1s)_
2. Hear this from Isaiah 40. God was speaking to a people in exile — worn down, far from home, and out of strength: Even youths grow tired and weary, and young men stumble and fall. But those who hope in the Lord will renew their strength. They will soar on wings like eagles. They will run and not grow weary. They will walk and not be faint.
_(pause: 1s)_
3. Isaiah does not pretend you will never get tired. He says even the young grow weary. Even strong people stumble.
_(pause: 1s)_
4. But your strength is not limited to what you can manufacture in yourself. The Lord renews those who wait on Him, trust Him, and depend on Him.
_(pause: 1s)_
5. So when your legs feel heavy, when the day feels long, when you feel like you are running out — do not quit inside. Hope in the Lord.
_(pause: 1s)_
6. Take the next step. Push through the next stretch. Trust the One who renews your strength.
_(pause: 1s)_

### Shared Opener · joy
<!-- slug: opener-shared-joy | file: components/pregame/audio/opener-shared-joy.ts -->

1. Close your eyes. Let your face soften.
_(pause: 1s)_
2. Hear this from 1 Thessalonians 5. Paul was writing to a young church facing real hardship: Rejoice always. Pray continually. Give thanks in all circumstances. For this is God’s will for you in Christ Jesus.
_(pause: 1s)_
3. Joy does not mean you fake a smile or pretend the hard moment did not happen. It means staying connected to God in the middle of what is hard — Paul ties joy to prayer and thanksgiving.
_(pause: 1s)_
4. So remember the gift. A body that can move. A team around you. A sport you love. A chance to compete.
_(pause: 1s)_
5. The scoreboard matters, but it is not the whole story. Keep perspective. Give thanks. You get to do this today.
_(pause: 1s)_
6. Compete with joy. Pray as you go. Give it everything, and take the next moment free.
_(pause: 1s)_

### Shared Opener · leadership
<!-- slug: opener-shared-leadership | file: components/pregame/audio/opener-shared-leadership.ts -->

1. Close your eyes. Take a long breath.
_(pause: 1s)_
2. Hear this from Mark 10. The disciples were arguing about who would be greatest. Jesus called them over and said, Whoever wants to become great among you must be your servant. For even the Son of Man did not come to be served, but to serve, and to give His life as a ransom for many.
_(pause: 1s)_
3. Jesus does not call leaders to be soft. He calls them to serve. To use what they have been given — a role, a voice, trust, respect — to lift the people around them.
_(pause: 1s)_
4. So lead by serving. Talk early. Bring energy. Pick up a teammate after a mistake. Do the simple thing that helps the group.
_(pause: 1s)_
5. The title, the role, the trust — none of it is for standing above the team. It is for helping the team move forward.
_(pause: 1s)_
6. Lead like Christ. Strong enough to serve. Free enough to put the team first.
_(pause: 1s)_

### Shared Opener · decisions
<!-- slug: opener-shared-decisions | file: components/pregame/audio/opener-shared-decisions.ts -->

1. Close your eyes. Soften your jaw.
_(pause: 1s)_
2. Hear this from Proverbs 3:5–6. Trust in the Lord with all your heart and lean not on your own understanding. In all your ways submit to Him, and He will make your paths straight.
_(pause: 1s)_
3. This does not mean God promises you the perfect read every time. It means you do not have to control everything in your own strength.
_(pause: 1s)_
4. You have prepared. You have trained. Now give the outcome to God and trust the work.
_(pause: 1s)_
5. When it speeds up, do not freeze trying to make the perfect decision. See it. Trust it. Move.
_(pause: 1s)_
6. Head up. Stay loose. See what’s in front of you. Make the next faithful move.
_(pause: 1s)_

### Shared Opener · courage
<!-- slug: opener-shared-courage | file: components/pregame/audio/opener-shared-courage.ts -->

1. Close your eyes. Plant both feet on the floor.
_(pause: 1s)_
2. Hear this from Isaiah 41:10. God spoke to His people in exile, facing real enemies and real fear: Do not fear, for I am with you. Do not be dismayed, for I am your God. I will strengthen you and help you. I will uphold you with my righteous right hand.
_(pause: 1s)_
3. God knows the pressure is real. He does not downplay it. Instead, He says you are not alone in it. He strengthens. He helps. He upholds.
_(pause: 1s)_
4. So when it gets heavy, when coach is on you, when the moment is hard, you do not have to back away.
_(pause: 1s)_
5. Courage is not pretending fear is gone. Courage is moving forward because the One with you is greater than what is in front of you.
_(pause: 1s)_
6. Be brave. Step into the battle. Compete with courage. God is with you.
_(pause: 1s)_

### Shared Opener · reset
<!-- slug: opener-shared-reset | file: components/pregame/audio/opener-shared-reset.ts -->

1. Close your eyes. Let your hands rest open.
_(pause: 1s)_
2. Hear this from Romans 8:1. Paul has just named the struggle with his own failure. Then he opens chapter 8 with this: Therefore, there is now no condemnation for those who are in Christ Jesus.
_(pause: 1s)_
3. No condemnation does not mean no consequences. If you make the mistake, it still costs you. But it means the verdict on you was already settled at the cross.
_(pause: 1s)_
4. The mistake you make tonight cannot reopen a case God has already closed.
_(pause: 1s)_
5. So when the mistake happens, do not carry condemnation into the next one. Learn what you need. Drop what you do not.
_(pause: 1s)_
6. You are free to go hard. Do not hold on. Breathe, reset, and go again.
_(pause: 1s)_

### Shared Opener · compete-level
<!-- slug: opener-shared-compete-level | file: components/pregame/audio/opener-shared-compete-level.ts -->

1. Close your eyes. Sit forward.
_(pause: 1s)_
2. Hear this from Colossians 3:23–24. Whatever you do, work at it with all your heart, as working for the Lord and not for people. It is the Lord Christ you are serving.
_(pause: 1s)_
3. This is not about earning God’s love. In Christ, you already have it.
_(pause: 1s)_
4. This is about who your effort is for. Every rep. Every effort. Every hard moment. Every ounce you give.
_(pause: 1s)_
5. The coach is not your final audience. The crowd is not your final audience. You compete before the Lord, who already calls you His.
_(pause: 1s)_
6. So bring your full compete. Fight for every inch. Commit to every rep. Finish strong. Give the next moment everything you have.
_(pause: 1s)_

### Shared Opener · calm
<!-- slug: opener-shared-calm | file: components/pregame/audio/opener-shared-calm.ts -->

1. Close your eyes. Let your shoulders drop.
_(pause: 1s)_
2. Hear this from Philippians 4. Paul wrote it from prison, not comfort: Do not be anxious about anything, but in every situation, bring your requests to God. And the peace of God, which transcends all understanding, will guard your heart and your mind in Christ Jesus.
_(pause: 1s)_
3. That peace does not mean you stop feeling nerves. It means Christ can hold you steady while the pressure is still real.
_(pause: 1s)_
4. When the pressure comes, you do not have to carry it alone. Give it all to God — the nerves, the outcome, the mistakes, the moments you cannot control.
_(pause: 1s)_
5. Then compete free. Free from anxiety. Free from fear. Free to take the next moment with a clear mind and a steady heart.
_(pause: 1s)_
6. Come back to your breath. Come back to right now. This breath. This moment. This effort.
_(pause: 1s)_

### Shared Opener · confidence
<!-- slug: opener-shared-confidence | file: components/pregame/audio/opener-shared-confidence.ts -->

1. Close your eyes. Sit tall.
_(pause: 1s)_
2. Hear this from Hebrews 12. Written to believers worn down by hardship: Let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith.
_(pause: 1s)_
3. Hebrews uses athletic language. Jesus is the pioneer — the One who ran before us, opened the way, endured the cross, and finished His race for us.
_(pause: 1s)_
4. That is where your confidence starts. Not in chasing a perfect day, but in Christ — the One who holds you secure as you run yours.
_(pause: 1s)_
5. So when it gets hard, when the trial comes, run with perseverance. Endure the hard stretch, and fix your eyes on Him.
_(pause: 1s)_
6. Stay steady. Go hard. Be bold and fearless. Let it all go, because God already holds the outcome.
_(pause: 1s)_
