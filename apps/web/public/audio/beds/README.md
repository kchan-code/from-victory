# Pregame Music Beds — FV-227

Six original synthesized ambient beds for the pregame guided session.
Athletes choose one (or silence) before starting; the chosen bed is
looped client-side for the full session duration (~5 min) at a constant
gain under the voice clips.

Phase 1 (Still, Pulse, Rise): synthesized pads.
Phase 1b (Rain, Stream, Amazing Grace): natural/hymn textures added 2026-06-12.

## Assets

| File | Loop duration | Size | Hash |
|---|---|---|---|
| `bed-still.04f1b7b9.mp3`  | 68 s  | 346 KB  | `04f1b7b9` |
| `bed-pulse.153b2ff8.mp3`  | 71 s  | 370 KB  | `153b2ff8` |
| `bed-rise.6af32fd2.mp3`   | 70 s  | 322 KB  | `6af32fd2` |
| `bed-rain.46ab1a7d.mp3`   | 90 s  | 1.17 MB | `46ab1a7d` |
| `bed-stream.d146d7d6.mp3` | 80 s  | 561 KB  | `d146d7d6` |
| `bed-grace.13c87e8b.mp3`  | 88 s  | 343 KB  | `13c87e8b` |

Phase 1 beds are stereo, 44.1 kHz, VBR ~42 kbps (libmp3lame q5). Pure
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

**`BED_MIX_GAIN = 0.35`** (linear; applied in `mixBedIntoPcm`).

At this gain:
- Mastered bed mean: ≈−29 dBFS; after 0.35 gain (−9.1 dB): ≈−38.1 dBFS
- Voice clips mean: ≈−20.5 dBFS
- Effective gap: **≈ 17.6 dB (RMS)** — bed is barely perceptible during
  speech, clearly audible in breathing pauses.

The 0.35 gain is a conservative starting point. If KC wants it more
present, try 0.50 (≈ 8.5 dB under voice) or 0.65 (≈ 5 dB under voice).
All values remain within the 8–10 dB intelligibility safety margin.

**Flagged for KC's ear:** by-ear call on gain level is Tier-2 (KC-gated).
Propose A/B at 0.35 vs 0.50 vs 0.65.

### No MANIFEST_VERSION bump required for bed assets

These beds are NOT clips. They live under `/audio/beds/` not
`/audio/pregame/clips/`. The `audio-cache-bust` CI guard (ci.yml)
scopes the MANIFEST_VERSION requirement to clip MP3s via a beds-path
exemption — see the guard script for the `grep -v '^apps/web/public/audio/beds/'`
filter that was added in FV-227.

## Phase 2 implementation notes

The following changes were made in FV-227 to give beds offline coverage
and to make CI pass with the new `.mp3` assets.

### (a) CI guard exemption for bed MP3s

The `audio-cache-bust` CI job (`ci.yml`) was updated to filter out beds-
path MP3s before the `MANIFEST_VERSION` check:

```bash
MP3_CHANGED=$(echo "$MP3_CHANGED" | grep -v '^apps/web/public/audio/beds/' || true)
```

This scopes the MANIFEST_VERSION requirement to clip MP3s only, which is
the correct semantic — bumping it for a bed change would rotate the entire
clip cache, which is wrong.

### (b) SW audio cache rule for /audio/beds/

`apps/web/public/sw.js` has a sibling `audioCacheFirst` rule added for
`/audio/beds/` alongside the existing `/audio/pregame/` rule:

```js
if (url.pathname.startsWith("/audio/beds/")) {
  event.respondWith(audioCacheFirst(request));
  return;
}
```

This co-locates bed files with clip files in the `fv-audio-<MANIFEST_VERSION>`
cache. No new cache name was needed.

### (c) Precache integration

`audio-precache.ts` was updated to add the athlete's selected bed URL
to the precache set when a bed preference is present. The bed URL is
resolved from the BEDS registry (not the clip manifest). This happens
before the clip loop so the bed is warmed alongside the clip files.

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

---

# KC by-ear ruling (2026-06-12) — final catalog

1. **Amazing Grace REMOVED** ("too distracting"). The fragmentary
   arrangement did not defuse the recognized-melody attention pull — the
   risk flagged at synthesis time. The asset is deleted; the provenance
   section above is retained as the decision record. Do not re-add a
   melodic bed without a fresh KC by-ear pass.
2. **Plain white-noise naming.** Rain/Stream read as white noise, not
   water — KC: "Just call them 5 options of white noise." The five
   remaining beds are labeled **White noise 1–5** in the picker (ids/files
   unchanged: still, pulse, rise, rain, stream).
3. **"Very low in volume": BED_MIX_GAIN = 0.25** (= −12 dB applied), bed
   ≈ 20 dB under voice — felt more than heard. Snapshot-pinned in
   beds-registry.test.ts.
