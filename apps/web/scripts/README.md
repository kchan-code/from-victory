# apps/web/scripts

Dev-time tooling. Not bundled into the deployed app; runs locally only.

## generate-pregame-audio.ts

Generates pregame audio MP3s + sidecar JSON timelines from typed
`AudioScript` objects in `apps/web/components/pregame/audio/`.

### One-time setup

```sh
brew install ffmpeg                 # also installs ffprobe
echo "OPENAI_API_KEY=sk-..." >> apps/web/.env.local
```

### Run

From `apps/web/`:

```sh
npm run audio:generate              # generate all scripts
npm run audio:generate -- --dry-run # validate + estimate cost only
npm run audio:generate -- --slug breath-threshold
npm run audio:generate -- --keep-segments  # leave per-segment files for inspection
```

Output lands in `apps/web/public/audio/pregame/`:

- `<slug>.mp3` — final concatenated audio (TTS speech + silence pads)
- `<slug>.json` — phase timeline runtime uses to sync visuals to playback

Commit both files. Production never calls OpenAI; Vercel just serves the
committed static assets.

### Cost reference

`gpt-4o-mini-tts` runs around $0.60 per million characters. The breath
threshold script is ~200 chars → fractions of a cent per regeneration.
The full 30 pregame combo set will be ~$0.03 total once it lands.

### Adding a new script

1. Author the script as a typed `AudioScript` (see `audio/types.ts`).
2. Add the import to `SCRIPTS` in `generate-pregame-audio.ts`.
3. Run `npm run audio:generate -- --slug <new-slug>`.
4. Commit the MP3 + JSON.

## qa-audio-levels.ts

Measures every clip's loudness and true-peak after a (re)generation batch and
emits a per-clip report flagging clips off the -16 LUFS target or at clipping risk.

Reporting only — never auto-fixes levels.

### Run

From `apps/web/`:

```sh
npm run audio:qa                            # measure all (manifest clips + legacy top-level MP3s)
npm run audio:qa -- --clips-only            # manifest clips only
npm run audio:qa -- --legacy-only           # legacy top-level MP3s only
npm run audio:qa -- --csv                   # emit CSV (slug, LUFS-I, true-peak, flags)
npm run audio:qa -- --csv --out report.csv  # also write to file
```

### Columns

| Column | What it measures |
|---|---|
| `LUFS-I` | Integrated loudness in LUFS via ffmpeg `ebur128` filter (EBU R128 gated). Target: -16 LUFS. Flagged outside ±2 dB (-18 to -14). |
| `TruePeak` | True-peak dBFS via `ebur128=peak=true` (EBU R128 inter-sample peak estimator). Flagged > -0.5 dBFS (clipping risk). |
| `flags` | `ok` or one/both of `LUFS(...)` and `PEAK(...)` with values. `ERROR` if the file is missing or ffmpeg failed. |

### Measurement note

`LUFS-I` is the correct broadcast-standard metric for perceived loudness — it
uses EBU R128 gating to ignore silence and quiet passages, which RMS-average
dB (`volumedetect mean_volume`) does not. Short clips measured via `volumedetect`
can read artificially low if they contain leading/trailing silence. `ebur128`
handles this correctly and produces the number that actually matches the loudnorm
pipeline's `-16 LUFS` target.

### Exit code

Exits 1 if any clips were flagged or errored. This makes it suitable for
non-blocking CI reporting (capture the report, emit it as an artifact, but do
not block the build on a level warning — use a separate `|| true` step).
