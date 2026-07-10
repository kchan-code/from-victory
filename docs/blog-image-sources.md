# Blog image sources (FV-416)

Editorial imagery for the marketing/blog pages, served self-hosted from
`apps/web/public/images/blog/`. Two kinds:

## Photography — Unsplash

All five photographs were downloaded from Unsplash on 2026-07-09 under the
[Unsplash License](https://unsplash.com/license) (free for commercial use, no
attribution required, irrevocable). Selection rules applied: no identifiable
people (empty venues / equipment only — avoids model-release questions), no
prominent team or sponsor branding, nothing marked Unsplash+ (premium).

Treatment (per the design system's photography spec — desaturated, cinematic,
fine grain): ffmpeg `hue=s=0.15–0.65`, slight darken/contrast, `noise=alls=4–6`,
resized to 1600w.

| File | Unsplash photo | Used on |
|---|---|---|
| `pre-game-nerves.jpg` | https://unsplash.com/photos/8bjeUy7S-G8 | /resources/pre-game-nerves-christian-athlete-routine |
| `bible-verses-before-a-game.jpg` | https://unsplash.com/photos/tVhueFPfd1w | /resources/bible-verses-for-athletes-before-a-game |
| `bounce-back.jpg` | https://unsplash.com/photos/nYg4BDP86Aw | /resources/how-to-bounce-back-after-a-bad-game |
| `when-your-athlete-gets-cut.jpg` | https://unsplash.com/photos/GMAZXSMM7yg | /resources/when-your-athlete-gets-cut-a-parents-guide |
| `sports-psychology-and-faith.jpg` | https://unsplash.com/photos/DT6tSBz1Hi4 | /resources/sports-psychology-and-faith-do-they-mix |

## App screenshots — our own UI

Captured from the landing page's phone mockups (the app's sanctioned UI
imagery) at 3x scale via `apps/web/scripts/capture-blog-screenshots.mjs`
against a local dev server. Regenerate with that script if the mockups change.

| File | Source | Used on |
|---|---|---|
| `app-pregame-session.png` | AppPreview card 03 (pregame audio) | /pregame-ritual-christian-athlete |
| `app-today-home.png` | Hero front phone (Today dashboard) | /christian-athlete-apps |
