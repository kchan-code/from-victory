# Brock audio preview — FV-560

This branch is a preview candidate, not a production release. Do not merge or deploy
with `--prod` until the device checks and release reviews are complete.

## Pinned candidate

- Catalog: `7df251b1`, 759 clips.
- Immutable Storage manifest:
  `manifests/7df251b1.5b6b75a49e07ee908266ee6c57990dca72eb919fe0aa0c31ddf62d31ca9d2497.json`.
- Shared opening, Zamboni pronunciation, and prayer pause B approved by KC.
- 34 corrected clips; 725 unchanged from the original Brock batch.
- Local finalized audio and provenance remain outside git under
  `.audio-renders/brock-2026-11-03/finalized/`.

The browser and service worker use the same exact public manifest key. Both audio
cache-version constants are `7df251b1`. Legacy top-level audio remains local; this
preview does not rewrite legacy fallback narration or implement native caching.

## Packaging and verification

The root and `apps/web` `.vercelignore` files exclude local render work, environment
files, test sessions, and hashed MP3s under `public/audio/pregame/clips`. The catalog
JSON is included. Hashed clips are served from the verified Storage publication,
not uploaded again in the Vercel bundle. Existing Ash files are not deleted from
the checkout or Storage, and top-level fallback MP3s remain in the deployment.

Local Brock MP3 copies in `apps/web/public/audio/pregame/clips` exist only so the
existing playlist integrity suite can check every path against real files. They
are untracked; do not stage them. A clean checkout will need the exact verified
finalized corpus hydrated locally before running these file-existence tests.
That limitation must be resolved explicitly before any merge-ready release; this
preview does not weaken the integrity test to hide absent files.

Before deployment, independently verify all published hashes and the manifest.
Run from `apps/web`:

```sh
npm run typecheck
npm run lint
npm test -- __tests__/audio-hosting.test.ts __tests__/audio-storage.test.ts components/pregame/__tests__/playlist-integrity.test.ts components/pregame/__tests__/audio-playlist.test.ts components/pregame/__tests__/useClipPlayer-truth-remember.test.tsx components/pregame/__tests__/useClipPlayer-timeout.test.tsx
npm run build
```

Use the existing Vercel project with the Preview environment. The lead supplies
its required environment variables securely; do not upload `.env` files or copy
credentials into source. Verify the generated deployment file list before
uploading. The current branch alone does not prove hosted-object availability or
successful deployment.

## Phone acceptance

Use the HTTPS preview URL in Safari with the designated test athlete account.
Existing App Store installations remain on production and do not test this
preview. Preview account activity may write normal session-completion metadata;
use the designated test account, not a real athlete's account.

1. Sign in and open `/athlete/pregame`. Complete a full session with narrated
   prayer. Verify Brock, opening cadence, uninterrupted transitions, pause/resume,
   prayer pause before Amen, and the send-off.
2. Run a saved session again. Verify the network requests use the pinned Storage
   manifest and hashed clip URLs; there must be no missing-file fallback.
3. Open `/athlete/practice`. Complete the real pre-practice flow and check its
   separate prayer and all transitions. This route requires an authenticated
   athlete and active access.
4. Check lock-screen/background/foreground and interrupted network playback.
5. For browser/PWA offline acceptance, warm the chosen session, confirm service
   worker control, then test the supported saved-session offline flow. A LAN HTTP
   test cannot establish this. Do not claim native offline support; native cache
   strategy is a separate unresolved capability.
6. Record device, OS/browser, preview URL, manifest version, selected sport and
   flow, and result. Representative basketball/defense listening remains needed
   for the propagated combined clips; corpus hashing alone is not an ear review.

## Rollback boundary

Production is unchanged until an explicit release. Discarding this preview leaves
the production Ash deployment untouched. For a later release rollback, redeploy
the preceding Ash application/catalog/configuration together. Do not merely set
the hosting key to null while leaving this Brock catalog: hashed Brock files are
intentionally absent from the deployment bundle. Retain the prior Ash assets and
immutable Storage objects. No deletion is part of this preview.
