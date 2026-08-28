# Native icon / splash sources

Copied from `apps/web/public` PWA icons for later brand-asset generation:

| File | Source |
|---|---|
| `icon.png` | `apps/web/public/icon-512.png` |
| `icon-maskable.png` | `apps/web/public/icon-maskable.png` |
| `splash.png` | `apps/web/public/logo-stacked.svg`, rendered 2732×2732 on `#050505` |

The iOS AppIcon (1024×1024, opaque RGB) is a brand asset rendered from
`apps/web/public/app-icon.svg` (icon-only mark — per `docs/brand.md` §8
the icon-only lockup is for app icon / favicon / social profile use).

The Splash imageset (iOS, 2732×2732) and the Android `drawable*/splash.png`
density buckets are rendered from `apps/web/public/logo-stacked.svg` — the
**primary stacked lockup** (icon above FROM / VICTORY), which `docs/brand.md`
§8 specifies for splash, hero, and onboarding surfaces. Centered on `#050505`
at ~56% of the shorter viewport dimension, matching the flame-only splash it
replaced (FV — TestFlight was showing the icon-only mark on open, not the
full logo). Regenerate from that SVG if the brand mark changes: render on a
`#050505` canvas at each target's exact pixel size (see the density table
next to `android/app/src/main/res/drawable*/splash.png`), keeping the logo
centered and comfortably clear of the edges. Default Capacitor launcher
mipmaps (app icon, not splash) still ship in `android/`. When preparing a
Play store-listing refresh, regenerate Android launcher icons (e.g.
`npx @capacitor/assets generate` from this folder) on a machine with the
asset tooling — not required for `assembleDebug`.
