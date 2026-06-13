# From Victory · Script Book · Shared (cross-sport)


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

## Audio Clips

## Shared Structural Clips

### Shared · Opening
<!-- slug: shared-opening | file: components/pregame/audio/clips.ts -->

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
### Shared · Reset Plan
<!-- slug: shared-reset-plan | file: components/pregame/audio/clips.ts -->

1. When the moment hits, come back to what is true.
_(pause)_
2. Breathe. Reset your body. Say the truth. Make the next play.
_(pause)_
### Shared · Prayer (Guided)
<!-- slug: shared-prayer | file: components/pregame/audio/clips.ts -->

1. Let's pray. Father, thank you that I do not have to earn my worth tonight. It is already secure in you. Free me to play brave, play loose, and give everything I have. When pressure comes, help me breathe, reset, and respond with faith. Help me serve my team, honor my coaches, and compete in a way that points back to you. In Jesus' name, Amen.
_(pause)_
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
### Shared · Prayer (Self-guided)
<!-- slug: shared-prayer-selfguided | file: components/pregame/audio/clips.ts -->

1. Take a moment with God.
_(pause)_
2. You do not need perfect words. He already knows what you are carrying.
_(pause)_
3. Thank him. Give him the pressure. Ask for courage. Ask to play free and serve your team.
_(pause)_
4. Now pray in your own words.
_(pause)_
### Shared · Cue Word Intro
<!-- slug: shared-cue-word-intro-pre | file: components/pregame/audio/clips.ts -->

1. When the pressure builds.
_(pause)_
2. Come back to your breath and speak your cue word.
_(pause)_
### Shared · Cue Word Send-off
<!-- slug: shared-cue-word-sendoff-pre | file: components/pregame/audio/clips.ts -->

1. Remember your cue word:
_(pause)_
### Shared · Viz Intro
<!-- slug: shared-viz-intro | file: components/pregame/audio/clips.ts -->

1. Now, visualize this scenario.
_(pause)_
### Shared · Anchor Intro
<!-- slug: shared-anchor-intro | file: components/pregame/audio/clips.ts -->

1. Remember your anchor.
_(pause)_
### Shared · Self-Talk Intro
<!-- slug: shared-selftalk-intro | file: components/pregame/audio/clips.ts -->

1. Now, say it to yourself.
_(pause)_
