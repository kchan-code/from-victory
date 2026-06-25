# Audio Pack Design — iOS Native Offline Download

**Status: design-only — do NOT implement here.**
This document specifies the pack grouping strategy, manifest schema extension,
and MANIFEST_VERSION parity model for the native iOS shell. It is input to the
next PR (NativeCacheStrategy implementation + Filesystem download flow).

---

## 1. Problem

The web PWA uses Cache Storage + Service Worker for offline audio. On the iOS
native shell (Option C hybrid — Capacitor), the SW never runs over
`capacitor://`. Clips must be downloaded to the device filesystem before the
session starts, and `useClipPlayer` must read from local file paths rather than
network URLs.

The full clip corpus is 372 clips / ~224 MB of active content (orphaned files
add ~105 MB more on disk — see §3). Downloading everything on first launch is
too heavy. The solution is named **packs**: grouped bundles that can be
downloaded independently, stored as a single file or directory, and cached
indefinitely as long as the MANIFEST_VERSION matches.

---

## 2. Corpus inventory (as of MANIFEST_VERSION a11286fc)

All sizes are on-disk MP3 bytes. Active = referenced by at least one manifest
template. Orphaned clips (in manifest.clips but in zero templates) are noted.

### Slug-prefix → sport mapping

| Prefix(es) | Sport / role | Active clips | Active size |
|---|---|---|---|
| `shared-*`, `anc-*`, `st-*`, `cw-*` | Sport-neutral session infrastructure | 52 | 4.0 MB |
| `pp-*` (no sport prefix) | Sport-neutral pre-practice | 20 | 7.0 MB |
| `opener-*` (non-bb) | Shared + hockey openers (9 needs) | 10 | 9.6 MB |
| `viz-forward`, `viz-defense`, `viz-goalie` | Hockey flagship viz | 3 | 4.6 MB |
| `viz-forward-*`, `viz-defense-*`, `viz-goalie-*` | Hockey positive-play viz | 28 | 24.6 MB |
| `hm-forward-*`, `hm-defense-*`, `hm-goalie-*` | Hockey HM cells | 30 | 21.2 MB |
| `opener-bb-*` | Basketball openers (9 needs) | 9 | 8.8 MB |
| `viz-guard*`, `viz-wing*`, `viz-big*` | Basketball viz | 27 | 28.5 MB |
| `hm-bb-*` | Basketball HM cells | 30 | 20.1 MB |
| `pp-bb-*` | Basketball pre-practice | 12 | 2.1 MB |
| `hm-bsb-*` | Baseball HM cells | 39 | 40.3 MB |
| `viz-pitcher*`, `viz-infield*`, `viz-outfield*`, `viz-catcher*` | Baseball viz | 4 | 7.9 MB |
| `pp-baseball-*` | Baseball pre-practice | 12 | 3.2 MB |
| `hm-glf-*` | Golf HM cells | 30 | 29.2 MB |
| `viz-scrambler*` | Golf viz | 8 | 9.4 MB |
| `pp-golf-*` | Golf pre-practice | 12 | 2.6 MB |

**Orphaned (manifest catalog but zero templates):** `bb-guard-*`, `bb-wing-*`,
`bb-big-*` — 30 clips, ~105 MB. These are a legacy naming pass that was
superseded by `hm-bb-*`. They should be excluded from all packs and from any
future `--mode clips` regen that cleans up the catalog.

---

## 3. Proposed pack grouping

### Pack: `shared` (required for every sport)

Contains all sport-neutral infrastructure: session shell, anchors, self-talk,
cue words, pre-practice common clips, and the sport-neutral (hockey) openers
which are also used as fallbacks for v2 sports.

Hockey viz is included in the shared pack — the three flagship `viz-*` clips
(`viz-forward`, `viz-defense`, `viz-goalie`) are tiny (4.6 MB) and function as
the default viz for all hockey sessions. The full positive-play viz set
(`viz-forward-*` etc., 24.6 MB) is larger — those go in the hockey sport pack
since they are only needed when the athlete picks specific positive plays.

| Slug groups | Clips | Size |
|---|---|---|
| `shared-*` (session shell) | 10 | 2.6 MB |
| `anc-*` (anchors) | 12 | 0.4 MB |
| `st-*` (self-talk) | 10 | 0.5 MB |
| `cw-*` (cue words, 10 words × reset+sendoff) | 20 | 0.5 MB |
| `pp-*` neutral (pre-practice shell + focus options) | 20 | 7.0 MB |
| `opener-*` non-bb (hockey + shared openers) | 10 | 9.6 MB |
| `viz-forward`, `viz-defense`, `viz-goalie` (flagship only) | 3 | 4.6 MB |
| **Pack total** | **85 clips** | **~25 MB** |

### Pack: `sport-hockey`

Hockey-specific content: HM cells + positive-play viz variants.
Requires `shared` pack as prerequisite.

| Slug groups | Clips | Size |
|---|---|---|
| `hm-forward-*`, `hm-defense-*`, `hm-goalie-*` | 30 | 21.2 MB |
| `viz-forward-*`, `viz-defense-*`, `viz-goalie-*` (PP variants) | 28 | 24.6 MB |
| **Pack total** | **58 clips** | **~46 MB** |

### Pack: `sport-basketball`

Basketball-specific content. Requires `shared` pack.
Note: basketball HM clips (`hm-bb-*`) have not been voice-rendered yet as of
this writing — they exist in the manifest catalog but the MP3s are placeholders.
The `bb-*` orphans should be excluded.

| Slug groups | Clips | Size |
|---|---|---|
| `hm-bb-*` | 30 | 20.1 MB |
| `viz-guard*`, `viz-wing*`, `viz-big*` | 27 | 28.5 MB |
| `opener-bb-*` | 9 | 8.8 MB |
| `pp-bb-*` | 12 | 2.1 MB |
| **Pack total** | **78 clips** | **~60 MB** |

### Pack: `sport-baseball`

Baseball-specific content. Requires `shared` pack.

| Slug groups | Clips | Size |
|---|---|---|
| `hm-bsb-*` | 39 | 40.3 MB |
| `viz-pitcher*`, `viz-infield*`, `viz-outfield*`, `viz-catcher*` | 4 | 7.9 MB |
| `pp-baseball-*` | 12 | 3.2 MB |
| **Pack total** | **55 clips** | **~51 MB** |

### Pack: `sport-golf`

Golf-specific content. Requires `shared` pack.

| Slug groups | Clips | Size |
|---|---|---|
| `hm-glf-*` | 30 | 29.2 MB |
| `viz-scrambler*` | 8 | 9.4 MB |
| `pp-golf-*` | 12 | 2.6 MB |
| **Pack total** | **50 clips** | **~41 MB** |

### V2 dormant sports (football, swimming, track)

No clips rendered yet. Packs will follow the same pattern when content is
production-ready. Size estimate: similar to golf (~40–60 MB per sport).

---

## 4. Download strategy

### When to download

- **`shared` pack**: downloaded at first app launch (before the athlete picks a
  sport). It is small enough (~25 MB) to download on any connection without
  explicit athlete permission. Show a "preparing audio" indicator.
- **Sport pack**: downloaded the first time the athlete opens the pregame flow
  for that sport, or proactively if the athlete's sport is known at onboarding.
  Ask for permission on cellular (show estimated size); auto-download on WiFi.
- **Future enhancement**: the athlete can manually pre-download packs from a
  Settings screen, or the app can prompt when storage is sufficient.

### What the athlete needs per session

- `shared` pack: always required.
- Their sport's pack: required for HM cells and sport-specific viz.
- No session requires more than two packs.

### Storage budget

Worst-case for a fully-downloaded app (all four live sports):
`shared` 25 MB + `hockey` 46 MB + `basketball` 60 MB + `baseball` 51 MB +
`golf` 41 MB = ~223 MB. Comparable to a single podcast episode or a medium-size
game. Reasonable for an athlete who uses the app daily.

---

## 5. manifest.json schema extension: `packs` field

The generator writes `manifest.json`. To support pack-aware downloads, add a
top-level `packs` field to the manifest schema:

```jsonc
{
  "version": "p7",
  "manifestVersion": "...",
  "packs": {
    "shared": {
      "slugs": ["shared-opening", "anc-long-exhale", "st-01", "cw-steady-reset", ...],
      "sizeBytes": 26214400
    },
    "sport-hockey": {
      "requires": ["shared"],
      "slugs": ["hm-forward-nervous", "viz-forward-win-the-wall", ...],
      "sizeBytes": 48234496
    },
    "sport-basketball": {
      "requires": ["shared"],
      "slugs": ["hm-bb-guard-turnover", "viz-guard-pick-and-roll", "opener-bb-courage", ...],
      "sizeBytes": 62914560
    },
    "sport-baseball": {
      "requires": ["shared"],
      "slugs": ["hm-bsb-catcher-nervous", ...],
      "sizeBytes": 53477376
    },
    "sport-golf": {
      "requires": ["shared"],
      "slugs": ["hm-glf-scrambler-nervous", ...],
      "sizeBytes": 43057152
    }
  },
  "clips": { ... },
  "templates": [ ... ]
}
```

### Generator changes (audio-pack-design only — not implemented here)

The generator would:
1. Classify each rendered slug into a pack by prefix match (the table in §2 is
   the classification rule).
2. Compute `sizeBytes` by summing the on-disk MP3 bytes for all slugs in the pack.
3. Write `packs` to `manifest.json` alongside the existing `clips` and `templates`
   fields. The schema is additive — p6 consumers that don't know about `packs`
   continue to work unchanged.
4. Exclude orphaned slug groups (`bb-*`) from all pack slug lists.

### NativeCacheStrategy consumption

The native download flow reads `manifest.packs` to:
1. Enumerate the `slugs` in the required pack(s).
2. For each slug, find `manifest.clips[slug].url` → download and write to
   `<appDataDir>/audio/<pack>/<filename>`.
3. Persist a `downloaded_packs.json` sidecar that records which pack versions
   have been fully downloaded.

The `resolve(url)` method maps `/audio/pregame/clips/<slug>.<hash>.mp3` →
`file://<appDataDir>/audio/<pack>/<slug>.<hash>.mp3` using the
`downloaded_packs.json` index.

---

## 6. MANIFEST_VERSION parity when the SW doesn't run

On web, `MANIFEST_VERSION` serves two purposes:
1. Cache rotation: the SW audio cache is named `fv-audio-<MANIFEST_VERSION>`.
2. Manifest URL busting: `manifest.json?mv=<MANIFEST_VERSION>` forces CDN +
   browser to fetch the updated catalog when any clip changes.

On native, the SW is absent (`capacitor://` is not intercepted). MANIFEST_VERSION
still matters for purpose 2 — but the mechanism changes:

### How parity works on native

1. **Manifest fetch**: `NativeCacheStrategy.resolve()` maps the manifest URL
   (`/audio/pregame/clips/manifest.json?mv=<X>`) to a local path. The `?mv=`
   query parameter is stripped at write time; the local path is keyed only by
   the pack name + a `manifest.json` filename.

2. **Version check**: `NativeCacheStrategy.warm()` fetches the manifest from
   network when online, checks if the `manifestVersion` field in the
   freshly-fetched manifest matches the locally-stored version (read from
   `downloaded_packs.json`). On mismatch, it re-downloads the affected packs.

3. **No SW needed**: the cache rotation that the SW handles via the
   `fv-audio-<mv>` cache name is replaced by the `downloaded_packs.json` version
   field. When `manifestVersion` changes, `warm()` invalidates the local files
   and triggers a re-download of the changed packs.

4. **Per-pack versioning (future enhancement)**: the `packs` field in
   `manifest.json` could carry a per-pack content hash (computed from the
   slugs' individual hash8 values) so only changed packs are re-downloaded on a
   manifest update — not the full corpus. Not required for v1 native.

### The two-file sync invariant

The existing invariant — `MANIFEST_VERSION` must match between
`audio-mapping.ts` and `sw.js` — still applies for the web PWA and is enforced
by the `audio-cache-bust` CI job. On native, `sw.js` is not served. The
invariant for native is: the `manifestVersion` embedded in the locally-stored
`manifest.json` must match the value at `manifest.json?mv=<X>` fetched from the
network. The CI job does not need to change — it still guards the web path.

---

## 7. What the implementing PR needs

1. `NativeCacheStrategy` in `apps/web/lib/audio/cache-strategy.ts`:
   - `warm(urls, onProgress)`: for each URL, check `downloaded_packs.json` →
     skip if present + version matches → download to filesystem if not.
   - `check(urls)`: count URLs present in `downloaded_packs.json` index.
   - `resolve(url)`: map `/audio/pregame/clips/<slug>.<hash>.mp3` →
     `file://<appDataDir>/audio/<slug>.<hash>.mp3`.
   - `isCached(url)`: lookup in `downloaded_packs.json` index.
   - Requires `@capacitor/filesystem` in `package.json` (product-strategist
     approval gating this PR).

2. `isNativeShell()` in `cache-strategy.ts`: refine to use
   `Capacitor.isNativePlatform()` once `@capacitor/core` is installed, replacing
   the current `window.Capacitor` property-existence check.

3. Pre-session download UI: a "Downloading audio for offline play" sheet shown
   the first time an athlete opens pregame on native, using `strategy.warm()`
   with the `onProgress` callback.

4. `manifest.json` generator update: add `packs` field per §5 schema (a separate
   audio-engineer PR — no API calls, generator-only change).
