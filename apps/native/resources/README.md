# Native icon / splash sources

Copied from `apps/web/public` PWA icons for later brand-asset generation:

| File | Source |
|---|---|
| `icon.png` | `apps/web/public/logo-icon.svg`, rendered 1024×1024 on `#050505` at 93% canvas width |
| `icon-maskable.png` | `apps/web/public/icon-maskable.png` |
| `splash.png` | `apps/web/public/logo-stacked.svg`, rendered 2732×2732 on `#050505` |

## App icon (iOS AppIcon, Android launcher)

Per `docs/brand.md` §8, the **icon-only mark** (open-book V + centered flame,
no wordmark, no cross) is the correct lockup for app icon / favicon / social
profile use — `apps/web/public/logo-icon.svg`. An earlier pass wired the app
icon to `apps/web/public/app-icon.svg` (a bare flame, missing the V/open-book
wings entirely) and the Android launcher mipmaps were still the unmodified
Capacitor scaffold icon (never replaced with a brand asset). Both are fixed:

- **iOS** `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`
  — 1024×1024, opaque RGB (no alpha channel — Apple rejects one), logo-icon
  centered at ~93% of canvas width on `#050505`. (Went through several
  passes on KC's on-device feedback: 56% -> 78% -> 93%. iOS applies its own
  corner rounding, so unlike Android's adaptive icon there's no safe-zone
  constraint forcing extra margin — the wing tips sit close to the raw
  canvas edges at 93%, but at mid-height, well clear of where the corner
  curve actually cuts in, so nothing clips. This is now a deliberately
  tight, edge-to-edge look (KC's call, not the design-safe default — 78-82%
  reads as more comfortable if this ever gets revisited).)
- **Android legacy** `android/app/src/main/res/mipmap-*/ic_launcher.png` and
  `ic_launcher_round.png` — same composition and 93% width as iOS, rendered
  per density (48/72/96/144/192px). Both files share one raster; there's no
  separate pre-circle-cropped variant.
- **Android adaptive** `android/app/src/main/res/mipmap-*/ic_launcher_foreground.png`
  — transparent background, logo-icon at ~52% of canvas width (the max
  that stays inside the 66/108 adaptive-icon safe-zone circle for this
  mark's aspect ratio, with a small buffer — bumped up from an initial,
  overly conservative ~48%), paired with the solid-color background layer
  at `android/app/src/main/res/values/ic_launcher_background.xml`
  (`#050505`, was the Capacitor-default `#FFFFFF`).

Regenerate from `logo-icon.svg` if the brand mark changes: render a large
master (≥1024px) per variant (opaque `#050505` for iOS/legacy, transparent
for the Android foreground layer) and downsample to each target's exact
pixel size — don't render tiny targets directly, Chromium headless
screenshots below roughly 250px on a side can come back blank (viewport/
screenshot-size mismatch below its minimum window size).
`android/app/src/main/res/drawable/ic_launcher_background.xml` and
`drawable-v24/ic_launcher_foreground.xml` are unused Android Studio
scaffold leftovers (the adaptive icon XMLs reference the `values/` color and
the `mipmap/` foreground PNGs, not these) — safe to ignore or delete, not
part of the live icon.

## Splash

The Splash imageset (iOS, 2732×2732) and the Android `drawable*/splash.png`
density buckets are rendered from `apps/web/public/logo-stacked.svg` — the
**primary stacked lockup** (icon above FROM / VICTORY), which `docs/brand.md`
§8 specifies for splash, hero, and onboarding surfaces (a prior pass had the
icon-only mark here instead — TestFlight was showing just the flame on
open). Centered on `#050505` at ~56% of the shorter viewport dimension.
Regenerate from that SVG if the brand mark changes: render on a `#050505`
canvas at each target's exact pixel size (see the density table next to
`android/app/src/main/res/drawable*/splash.png`), keeping the logo centered
and comfortably clear of the edges.

## Regenerating with tooling

When preparing a Play store-listing refresh, regenerate Android assets
(e.g. `npx @capacitor/assets generate` from this folder) on a machine with
the asset tooling — not required for `assembleDebug`.
