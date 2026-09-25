# apps/web/scripts

Dev-time tooling. Not bundled into the deployed app; runs locally only.

> **Requires Node.js ≥ 22.6.** The `audio:*` and `scripts:*` npm scripts run
> `.ts` files directly via `node --experimental-strip-types`, which only exists
> in Node 22.6+. The repo's `.nvmrc` pins 20 (the app's runtime), so for these
> scripts switch to a newer Node first (e.g. `nvm use 22`). Running them on
> Node 20 fails with an unknown-flag / unsupported-syntax error.

## provision-play-review-account.ts

Provisions the Google Play Console "App access" reviewer test account: one
parent + one linked 13-17 minor athlete, entitled via a durable `access_grants`
comp row (no Stripe checkout, works regardless of `ENFORCE_SUBSCRIPTION_GATING`).
**Tier-2, prod-user-data — KC runs this or explicitly approves the run.** See
the script's header comment for the full design rationale and
`docs/play-review-access-grant.sql` for the SQL-only grant revoke/re-grant
companion.

```sh
npm run provision:play-review -- --dry-run       # preview, no writes
npm run provision:play-review                    # create/update both accounts + grant
npm run provision:play-review -- --revoke-grant   # turn off entitlement, keep both accounts
npm run provision:play-review -- --teardown       # delete both accounts (irreversible)
```

Requires `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in
`apps/web/.env.local` (or exported), pointed at the target project.

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

ElevenLabs (see `bakeoff-voices.ts` below) is roughly two orders of magnitude
more expensive per character: $0.10 per 1k characters (`eleven_multilingual_v2`
/ `eleven_v3`) or $0.05 per 1k for the `eleven_flash_*` models. `estimateCostUsd`
in `scripts/lib/tts.ts` takes an optional `provider` (+ `modelId` for the flash
discount) to estimate either.

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

## bakeoff-voices.ts

ElevenLabs voice bake-off (FV-285). Renders a fixed backbone set of pregame
`AudioScript`s — `breath-threshold`, `shared-opening`, `shared-prayer`,
`shared-sendoff`, `hm-forward-nervous`, `opener-shared-confidence` — through
one or more candidate ElevenLabs voices, level-matches each candidate against
a loudnorm-passed copy of the currently-shipped ("ash", OpenAI) master, and
writes a README with duration/chars/cost/LUFS-I/dBTP per variant so KC can A/B
by ear. **Never calls OpenAI.** Only calls ElevenLabs, build-time, same as the
rest of this pipeline — no athlete data is ever involved.

Provider selection lives in `scripts/lib/tts.ts`: `synthesizeSpeech()` picks
OpenAI (default, unchanged) or ElevenLabs via `TTS_PROVIDER=elevenlabs` env or
an explicit `provider` field per call. `npm run audio:generate` is byte-for-byte
unchanged unless `TTS_PROVIDER` is set. `bakeoff-voices.ts` always forces
`provider: "elevenlabs"` per call, regardless of `TTS_PROVIDER`.

### One-time setup

```sh
echo "ELEVENLABS_API_KEY=..." >> apps/web/.env.local
```

`ELEVENLABS_VOICE_ID` and `ELEVENLABS_MODEL_ID` are optional env defaults —
`ELEVENLABS_VOICE_ID` is only used as a fallback when a script's `voice` field
is an OpenAI voice name (e.g. running `TTS_PROVIDER=elevenlabs npm run
audio:generate` directly, with no bake-off `--voices` override).

### Run

From `apps/web/` (Node ≥ 22.6 — `source ~/.nvm/nvm.sh; nvm use 22` or newer):

```sh
npm run audio:bakeoff -- --list-voices                      # browse ElevenLabs voice_id/name/labels/category
npm run audio:bakeoff -- --dry-run                           # validate + print chars/cost per provider, no API calls, no key needed
npm run audio:bakeoff -- --voices 21m00Tcm4TlvDq8ikWAM:Bella,pNInz6obpgDQGcFmaJgB:Adam
npm run audio:bakeoff -- --voices <id>:<label> --model eleven_v3
npm run audio:bakeoff -- --voices <id>:<label> --slugs breath-threshold,shared-opening
npm run audio:bakeoff -- --voices <id>:<label> --out docs/audio-ab-fv285 --keep-segments
```

Output lands in `<repo>/docs/audio-ab-fv285/<slug>/` (default `--out`; a relative
`--out` resolves against the repo root, not `apps/web/`, so the root `.gitignore`
always covers the MP3s):

- `current-ash.mp3` — the currently-shipped master, loudnorm-passed the same
  way as the candidates
- `<label>.mp3` — one file per `--voices` candidate
- `README.md` at the top of `--out` — the run's summary table (committable;
  the MP3s are gitignored, see root `.gitignore`)

### How to listen

Open the output folder and A/B each slug's files back-to-back, ideally on
phone headphones (the actual delivery surface). The tool's numbers only rule
out clipping (dBTP should be < 0) and gross level mismatches — the final
quality call is by ear, and it's KC's.
