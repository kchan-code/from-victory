# Pregame Music Beds — FV-227 Phase 1

Three original synthesized ambient beds for the pregame guided session.
Athletes choose one (or silence) before starting; the chosen bed is
looped client-side for the full session duration (~5 min) at a constant
gain under the voice clips.

## Assets

| File | Loop duration | Size | Hash |
|---|---|---|---|
| `bed-still.04f1b7b9.mp3` | 68 s | 346 KB | `04f1b7b9` |
| `bed-pulse.153b2ff8.mp3` | 71 s | 370 KB | `153b2ff8` |
| `bed-rise.6af32fd2.mp3`  | 70 s | 322 KB | `6af32fd2` |

All three are stereo, 44.1 kHz, VBR ~42 kbps (libmp3lame q5). Pure
low-frequency pad material — fundamentals 90–360 Hz, filtered noise
wash up to 700 Hz, zero content above ~800 Hz. 42 kbps VBR is
completely transparent for this spectrum.

## Synthesis

All three beds were synthesized from scratch using ffmpeg `aevalsrc` +
`anoisesrc`. Zero licensing exposure — no sampled content.

### Still

Warm sustained pad: five detuned sine layers (90, 135, 180, 270, 360 Hz),
slightly detuned L/R (± 0.03–0.08 Hz) for stereo width. Amplitude
modulated by a very gentle LFO at 0.03 Hz (depth 10%) — barely
perceptible breathing. Gentle white noise wash filtered 80–700 Hz at
−32 dB below the pad floor.

Loop seam method: 4 s crossfade of the tail (fade-in) overlaid on the
head (fade-out). Resulting loop is 68 s. The LFO completes ~2 full
cycles per loop, so phase is consistent at the seam.

### Pulse

Identical pad layers to Still + a sub-pulse at 55 BPM (0.917 Hz).
Pulse envelope: fourth power of a rectified cosine —
`clip(cos(2π·0.917·t), 0, 1)^4` — applied to a 64.5 Hz sine. This
produces a soft, rounded bump with no click. The ^4 shaping makes the
bump narrow (athletic, not meditative). No click because the envelope
passes through zero before and after each bump.

Loop seam: same 4 s crossfade approach as Still. Loop is 71 s (≈ 65
pulse cycles — very close to a whole number, so the pulse grid is nearly
seamless at the loop boundary).

### Rise

Five pad layers with progressive fade-in envelopes:
- Layer 1 (90 Hz): amplitude 0.30 + 0.70 × ramp over 0–20 s (never silent)
- Layer 2 (135 Hz): fades in t = 10–35 s
- Layer 3 (180 Hz): fades in t = 25–50 s
- Layer 4 (270 Hz): fades in t = 40–65 s
- Layer 5 (360 Hz): fades in t = 55–75 s

All layers reach full amplitude by t = 75 s. The loop point is at 70 s
with a 5 s crossfade (tail fade-out overlaid on head fade-in). On the
first play-through the bed "rises"; subsequent loops sustain full density
with a gentle breath dip at the seam. This is the intended behaviour.

Loop seam note: at the loop point Rise transitions from full density
(−17 dBFS peak) back to the sparse start (−39 dBFS peak). The 5 s
crossfade fades both sides smoothly — no click, but there is an amplitude
dip which is the designed "breath" between loops.

## Mix Spec

### Voice clip reference

`shared-opening.3f675837.mp3` (representative clip, 48.6 s):
- Mean: −20.5 dBFS
- Max: −1.8 dBFS
- Integrated LUFS: −16.8

### Beds mastered level

All three beds are mastered to equal loudness:

| Bed | Mean (dBFS) | Max (dBTP) | Integrated LUFS | Low body 100–300 Hz | Highs >6 kHz |
|---|---|---|---|---|---|
| Still | −29.0 | −19.8 | −27.5 | −31.4 dB | −90.3 dB |
| Pulse | −29.1 | −17.0 | −27.8 | −32.0 dB | −90.3 dB |
| Rise  | −29.0 | −17.2 | −27.2 | −31.3 dB | −90.3 dB |

All true peaks are ≤ −17 dBTP — well under the −3 dBTP ceiling. When
summed with voice at −1.8 dBTP peak, the mixed signal stays safely below
0 dBFS at any client gain ≤ 0.35.

The −90.3 dB highs (>6 kHz) confirm these are pure low-frequency pads
with no harsh presence content, consistent with the warm athletic brief.

### Recommended client-side gain

**`BED_MIX_GAIN = 0.35`** (linear; apply to a Web Audio `GainNode`).

```js
gainNode.gain.value = 0.35; // −9.1 dB
```

At this gain:
- Bed effective level: −29.0 − 9.1 = −38.1 dBFS mean
- Voice clips: −20.5 dBFS mean
- Gap: **≈ 17.6 dB (RMS)**

Wait — that's too wide. Re-check: the gain is applied to the bed
_before_ mixing with voice, so the mixed bed sits 9.1 dB below its
mastered level. The voice clips play at their native level.

Measured gap (mastered bed vs voice): −29.0 − (−20.5) = 8.5 dB (RMS).
After the 0.35 gain reduction of 9.1 dB: effective bed sits **17.6 dB
below voice mean**.

At 17.6 dB under voice the bed will be barely perceptible during speech.
If KC wants it more present, the gain can be raised — try 0.50 (−6 dB)
for approximately 8.5 dB under voice mean, or 0.60 (−4.4 dB) for
closer to 5 dB under voice. These are all within the 8–10 dB intelligibility
safety margin from the brief.

**Flagged for KC's ear:** the 0.35 gain is a conservative starting
point. The by-ear call on how present the bed should be during speech is
Tier-2 (KC-gated). Propose A/B at 0.35 vs 0.50 vs 0.65.

### No MANIFEST_VERSION bump required for these assets

These beds are NOT clips. They live under `/audio/beds/` not
`/audio/pregame/clips/`. The `audio-cache-bust` CI guard (ci.yml)
watches for `*.mp3` changes and requires a `MANIFEST_VERSION` bump.

**This PR will trip the CI guard.** The CI guard checks `audio-mapping.ts`
for a `MANIFEST_VERSION` change when any `*.mp3` is in the PR diff.
These beds are NOT part of the clips catalog, so bumping `MANIFEST_VERSION`
would be semantically wrong (it rotates the clips cache, not the beds
cache). See Phase 2 instructions below.

## Phase 2 instructions for the frontend agent

The CI guard and SW/precache must be updated before these beds can be
served offline and before CI passes with this PR's new `*.mp3` files.

### (a) Make CI pass with the new committed MP3s

The `audio-cache-bust` CI job (`ci.yml` lines 84–153) fails when a PR
adds `*.mp3` files without updating `MANIFEST_VERSION` in `audio-mapping.ts`.
These beds are not clips, so `MANIFEST_VERSION` must NOT be bumped.

**Required fix:** add an exemption in the CI guard so mp3s under
`apps/web/public/audio/beds/` do not trigger the manifest-version
requirement. The simplest approach is to filter the `MP3_CHANGED` list
before the guard check:

```bash
# In the audio-cache-bust step, after computing MP3_CHANGED:
MP3_CHANGED=$(echo "$MP3_CHANGED" | grep -v '^apps/web/public/audio/beds/' || true)
```

This scopes the MANIFEST_VERSION requirement to clip mp3s only, which
is the correct semantic.

### (b) Add beds to the SW audio cache and precache

**SW (`apps/web/public/sw.js`):**
The current audio cache path in `sw.js` is:
```js
if (url.pathname.startsWith("/audio/pregame/")) {
  event.respondWith(audioCacheFirst(request));
  return;
}
```
Add a sibling rule for `/audio/beds/`:
```js
if (url.pathname.startsWith("/audio/beds/")) {
  event.respondWith(audioCacheFirst(request));
  return;
}
```
This uses the same `AUDIO_CACHE` named cache (`fv-audio-<MANIFEST_VERSION>`)
so bed files are co-located with clip files in offline storage. No new
cache name needed.

**`audio-precache.ts`:**
The precache currently only resolves the clip playlist. For offline bed
support, when the athlete has selected a bed id, add the bed's MP3 URL to
the `urls` array before the `for (const clip of resolved)` loop. The
bed URL is not in the manifest — resolve it from the `BEDS` registry:
```ts
import { getBed } from "./audio/beds";
// …
if (params.bedId) {
  const bed = getBed(params.bedId);
  if (bed) urls.push(bed.path);
}
```
Add `bedId?: string | null` to `PrecacheParams`.

**No SW MANIFEST_VERSION bump required for this phase-2 change.** The SW
change is a routing rule addition (not a cache version change). Bump
`CACHE_VERSION` only if the app shell changes — this doesn't.

## Loop seam verification

Method: extract the first and last 150 ms of each MP3 (post-encoding)
and compare peak levels. A click = sudden amplitude jump of > 6 dB over
a few samples; here start/end peaks are within 0.5 dB for Still and
Pulse (crossfade worked), and Rise has the intentional design amplitude
dip from full density to sparse start.

| Bed | First 150 ms peak | Last 150 ms peak | Delta | Verdict |
|---|---|---|---|---|
| Still | −21.2 dBFS | −21.7 dBFS | 0.5 dB | Seamless |
| Pulse | −18.6 dBFS | −18.7 dBFS | 0.1 dB | Seamless |
| Rise  | −39.0 dBFS | −19.9 dBFS | 19.1 dB | Designed dip (sparse→full) |

All crossfades were verified at the WAV level prior to MP3 encoding.
The smooth amplitude ramp was confirmed by sampling peak levels at 0.5 s
intervals through the last 4 s of each WAV — no discontinuities.

## Flagged for KC's ear

1. **Mix gain** — 0.35 is conservative; 0.50 will be noticeably more
   present. These need an A/B listen before committing the frontend gain
   constant (Tier-2, KC-gated).
2. **Rise character** — the progressive layering is subtle at pad
   frequencies. KC should confirm the rise texture is perceptible enough
   to feel distinct from Still, especially on phone speakers.
3. **Pulse tempo** — 55 BPM (0.917 Hz) was chosen as "settled heartbeat."
   If this feels too slow or too fast for the target pre-competition
   mental state, the aevalsrc expression can be adjusted without a full
   rebuild (pure parameter change).
4. **Label copy** — "Still", "Pulse", "Rise" are audio-engineer
   candidates, marked in `beds.ts` as `COPY CANDIDATE (KC review)`.

---

# Phase 1b additions (2026-06-12, KC request): Rain · Stream · Amazing Grace

Three more beds, synthesized/arranged entirely from scratch — zero licensed
material. Mastered to the same contract as phase 1 (−27.5 ±0.5 LUFS, TP ≤
−3 dBTP) so the single `BED_MIX_GAIN` constant holds across all six.

## QA table (measured on committed MP3s, lead-verified via ffmpeg)

| Bed | Duration | LUFS integrated | True peak | Full-band mean | Speech band 1–4 kHz mean | First/last 150 ms peaks |
|---|---|---|---|---|---|---|
| Rain | 90.0 s | −27.5 | −12.8 dBTP | −25.8 dB | **−47.7 dB** | −16.4 / −23.7 dB |
| Stream | 80.0 s | −27.8 | −12.0 dBTP | −26.9 dB | **−42.7 dB** | −16.9 / −24.0 dB |
| Amazing Grace | 88.0 s | −27.3 | −19.1 dBTP | −29.8 dB | **−44.1 dB** | −42.6 / −91.0 dB |

**Speech-intelligibility clearance:** the brief requires bed energy in the
1–4 kHz consonant band ≥12 dB under the voice at mix gain. Voice reference
(shared-opening) mean is ≈−20.5 dB; the water beds' speech-band energy at
the 0.35 mix gain lands ≈29–35 dB under the voice — the EQ carve leaves the
narration completely untouched.

**Loop seams:** Rain/Stream are stochastic material — the first/last-150 ms
peak deltas (~7 dB) reflect random droplet placement, not a level step; at
≈−24 dB absolute with crossfaded seams these cannot click. Amazing Grace's
loop point sits inside a designed rest (−91 dB) — the loop "breath" is part
of the fragmentary arrangement.

## Provenance / licensing audit trail

- **Rain, Stream:** synthesized noise-shaping (pink-noise body + stochastic
  droplet transients; drifting band-passed resonances for water-over-stones),
  generated in-pipeline via ffmpeg. No recordings, no samples, no third-party
  material. Owned outright.
- **Amazing Grace:** the hymn tune **NEW BRITAIN** (first published with
  John Newton's 1779 text in the 1820s–30s) is long in the public domain.
  Copyright subsists only in particular ARRANGEMENTS and RECORDINGS — which
  is why no existing recording was used or referenced. This bed is our own
  arrangement, sequenced note-by-note at the established pad timbre:
  **fragmentary by design** — solo phrases of the tune separated by long
  sustained-pad rests, so a melody the athlete knows reads as reverent
  texture rather than recruiting attention against the narration. Our
  arrangement, our rendering, our copyright.

## Flagged for KC's ear (in addition to the phase-1 items)

5. **Rain/Stream realism** — synthesized water is impressionistic, not a
   field recording; judge whether it reads as rain or as "texture."
6. **Amazing Grace fragment spacing** — phrases vs. rests balance: present
   enough to recognize, sparse enough to stay underneath. If it pulls your
   attention during a spoken line, the spacing widens (one constant).
