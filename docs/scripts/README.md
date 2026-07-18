# From Victory · Script Books

These Markdown files ARE the audio scripts. KC edits them; audio generation reads
them automatically. No separate "apply" command needed in the normal editing workflow.

## Files

| File | Sport / Category | Status |
|---|---|---|
| [hockey.md](./hockey.md) | Hockey need-openers (editable), flagship VIZ + positive-play library, hard-moment clips, legacy full-session cells | LIVE |
| [basketball.md](./basketball.md) | Basketball need-openers (editable), flagship VIZ + positive-play library, hard-moment clips | LIVE |
| [baseball.md](./baseball.md) | Baseball flagship VIZ + hard-moment clips (⚠ play library pending FV-424) | Audio rendered; sport not selectable |
| [golf.md](./golf.md) | Golf flagship VIZ + positive-play library, hard-moment clips | LIVE |
| [football.md](./football.md) | Football flagship VIZ + hard-moment clips (play library = FV-423) | DORMANT (first audio rendered, PR #364) |
| [swimming.md](./swimming.md) | Swimming flagship VIZ + hard-moment clips (⚠ play library pending FV-426) | DORMANT (no audio yet) |
| [track-field.md](./track-field.md) | Track & Field flagship VIZ + hard-moment clips (⚠ play library pending FV-427) | DORMANT (no audio yet) |
| [lacrosse.md](./lacrosse.md) | Lacrosse VIZ play library (thin — FV-425) + hard-moment clips | DORMANT (no audio yet) |

> **Every sport book carries the full viz contract:** flagship `viz-{role}`
> clip (fallback) **+ a ~7-play positive-play library per position** (the
> FV-144 chooseable scenarios) + the hard-moment grid. See
> `docs/adding-a-sport.md` Step 7. Books marked ⚠ predate this rule.
| [pre-practice.md](./pre-practice.md) | All pre-practice "Lock In" clips | LIVE (hockey/bb/golf) |
| [shared.md](./shared.md) | Breath threshold + shared structural + anchor/self-talk/cue-word clips | LIVE |

## Workflow (KC's editing flow)

```
# 1. Open the script book for the sport you want to edit
open docs/scripts/hockey.md   # or basketball.md, golf.md, etc.

# 2. Edit the numbered prose lines — that's it.
#    DO NOT change ### titles, <!-- slug ... --> comments,
#    _(pause)_ markers, or line numbers.
#    The words you write are the words that get spoken.
#    This works for EVERY clip type — including viz-* and shared-* clips.

# 3. Render audio (reads your .md edits directly at render time — no separate apply step)
cd apps/web

#    For LIVE sports (hockey, basketball, golf, baseball):
npm run audio:generate -- --mode clips
#    Then bump MANIFEST_VERSION per the FV-142 rule (the generator prints the new value).

#    For DORMANT sports (football, swimming, track-field):
#    Edit freely. The first audio render is the go-live pass.
```

## Maintenance commands (engineers / content leads)

```
# Check which clips will render with .md prose (reports diffs, no TTS/ffmpeg)
cd apps/web
npm run audio:check

# Validate fallback bodies without spending TTS budget (text-mode fallback sync only)
npm run audio:generate -- --sync-only

# Sync text-mode fallback bodies from .md to TS (dry-run preview)
npm run scripts:apply

# Sync text-mode fallback bodies from .md to TS (write)
npm run scripts:apply -- --write

# Seed new book files (only writes files that do NOT already exist)
npm run scripts:export

# Regenerate ALL books from TS source (engineers only — overwrites existing prose)
npm run scripts:export -- --force
```

## Editing openers

The need-openers (identity scripture monologues that precede the session) are in
`hockey.md` ("Need Openers" section) and `basketball.md` ("Need Openers" section).
Edit them exactly like any other numbered prose line. The generator will detect
the change and re-TTS that opener; openers whose book prose matches the TS source
are passed through with a loudnorm normalization pass only (no re-TTS, no churn).

The breath-threshold script is in `shared.md` under "Breath Threshold".

Wordless audio (music beds, wordless breath tones) is intentionally NOT in these
books — it has no spoken words to edit.

## Out of scope for these script books

- **Daily training sessions** — text lives in Supabase seed SQL
  (`supabase/migrations/` seed files). Edit there directly.
- **Postgame "For the Ride Home" modules** — text lives in
  `apps/web/lib/postgame/modules.ts` and the draft Markdown files
  (`docs/*-postgame-drafts.md`). Edit there directly.

## Stats (at last export)

Total CLIP_SCRIPTS registered: 488
