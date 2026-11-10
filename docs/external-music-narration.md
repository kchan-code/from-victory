# External music with guided narration

Tracking: [FV-635](https://linear.app/adeptiv/issue/FV-635/allow-external-music-to-continue-underneath-guided-narration).

Status: implementation under review; not released. Requested by KC on November 9, 2026: keep music from Spotify, Apple Music, or another music app playing underneath the From Victory voice. Silent reading mode is not a substitute.

## Behavior and scope

New native builds use an app-local narration player for the breathing introduction, Pregame, and Pre-Practice. The web app still resolves the existing personalized clips and assembles one WAV, preserving the narration and pauses. On native, decoding uses an offline audio context, and the app does not add a built-in music bed or take over the external music app's media controls.

iOS uses a mixable playback audio session. Android requests transient focus that permits the other player to lower its volume instead of stopping. The external player controls its response; music providers that pause on focus loss cannot be forced to continue. Users start their music in its own app, then return to From Victory.

Browsers, installed PWAs, and older native builds retain their current audio behavior. They are not guaranteed to mix with another app. New native binaries and the corresponding hosted web changes are both required; a website deployment alone does not enable this feature for existing store builds.

No provider login, music library access, recording, provider SDK, or listening-history collection is involved. External music playback and volume remain controlled by the music app and phone. A separate Narration volume slider adjusts only From Victory’s gain, from mute to full. Phone volume changes both sources. The chosen narration level stays in memory across guided steps and pause/resume, with no storage, server write, or telemetry; a fresh app page starts at full volume.

## Native bridge contract

The injected Capacitor plugin is `FVNarration` on both platforms:

- `begin({sessionId, byteLength})`: replace the active session with a bounded temporary WAV upload.
- `append({sessionId, index, data})`: append ordered base64 chunks, with zero-based indexes.
- `prepare({sessionId})`: validate complete bytes, prepare playback, return `{duration}` in seconds.
- `play({sessionId})`, `pause({sessionId})`: control only this narration session.
- `setVolume({sessionId, volume})`: optional capability on newer builds, accepts finite numbers from 0 to 1 and returns `{volume}`. It changes only prepared narration gain, including while paused or playing. Invalid or stale-session calls are rejected without changing playback or other audio.
- `getStatus({sessionId})`: return `{position, duration, state, volume?, error?}`; times in seconds and state one of ready, playing, paused, ended, error.
- `dispose({sessionId})`: stop and remove that session's temporary data. An old session ID must never stop a newer session.

Volume capability is detected separately: older narration bridges keep their existing native player and do not fall back to HTML playback. Volume adjustment errors remain local to the control and do not terminate the session.

Maximum WAV: 64 MiB. Maximum decoded chunk: 192 KiB (256 KiB base64). No file paths or URLs are accepted from JavaScript. Session IDs are ephemeral playback handles, not athlete identifiers. Native code releases its audio session/focus on pause, completion, disposal, and interruption. Route loss pauses narration rather than unexpectedly switching to the speaker.

## Release verification

Run on actual iPhone and Android devices with Spotify and Apple Music, plus another background-capable audio app where available. These are required before claiming support:

1. Start external music, enter From Victory, open the breathing introduction, then Pregame. Confirm music survives preparation and narration is audible over it.
2. Repeat Pre-Practice. Check personalized narration, progress, pause/resume, and one completion only.
3. Pause narration and confirm external music continues/recover its volume. Finish and leave the flow; no abandoned narration or temporary playback session should remain.
4. Change setup quickly and leave during preparation; a stale upload must not resume or cancel the next session.
5. Lock the screen for at least 60 seconds, unlock, and verify narration continuity and accurate state. Verify the external music app retains its controls.
6. Interrupt with a call and disconnect headphones/Bluetooth. Narration must pause; resumption must be intentional.
7. Adjust narration while music plays; mute/unmute, pause/resume, and move from breathing into the guided session. Verify the chosen gain carries forward without changing music or restarting playback. Rapid slider changes must settle on the latest requested level.
8. Verify browser/PWA and old native shell regressions separately. Do not treat unit tests or a successful native compile as cross-app audio proof.

Native plugin and Android foreground-media permission changes require product/privacy review and KC approval before merge under `docs/native-capacitor.md`. Store release is a separate step.

## Review and validation — November 9, 2026

Product scope approved; QA found no remaining code defects after lifecycle and breathing-control fixes; privacy review verdict APPROVED. These are code reviews, not evidence of device audio coexistence.

- Web: focused bridge/player/breathing/service-worker regression tests passed; typecheck, lint, and production build passed.
- iOS: simulator SDK compile passed with code signing disabled; plists validated.
- Android: debug APK built; all 8 unit tests passed, including 7 transfer validation tests.
- Not performed: physical Spotify/Apple Music mixing, call/headphone/lock-screen checks, authenticated mobile browser smoke, store release.

The feature remains a draft until device verification and KC approval. No native version bump or store submission is included.

## User test feedback — November 10, 2026

KC reports “music works” on the corrected iPhone-only test harness and requests relative volume controls. This is user-reported music coexistence, not proof of a particular provider, screen-lock duration, call interruption, or headphone route change. The first harness mistakenly treated Capacitor’s local media URL response as an HTTP failure; the corrected generated-only harness serves the same WAV bytes as a binary asset and validates its RIFF/WAVE header. Actual simulator native preparation succeeded before reinstalling. No production asset was changed.

Product approved one Narration volume slider plus clear phone/music control instructions. No provider-specific music-volume control is added. The normal app has not yet been restored on the test phone: the current local development profile lacks the app’s Associated Domains entitlement. No Apple account capability changes or store release have been performed.

Volume increment validation: 40 focused web tests passed across 9 files; production web build including typecheck and lint passed. Android debug build and all 14 unit tests passed. iOS simulator SDK compile passed. QA and privacy approved the increment. Updated physical-device slider behavior is not yet user-verified.
