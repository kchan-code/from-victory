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
