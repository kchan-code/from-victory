# Native icon / splash sources

Copied from `apps/web/public` PWA icons for later brand-asset generation:

| File | Source |
|---|---|
| `icon.png` | `apps/web/public/icon-512.png` |
| `icon-maskable.png` | `apps/web/public/icon-maskable.png` |
| `splash.png` | placeholder from `icon-512.png` (replace with a real splash art before store screenshots) |

The iOS AppIcon (1024×1024, opaque RGB) and Splash imageset (2732×2732,
flame centered on `#050505`) are brand assets rendered from
`apps/web/public/app-icon.svg` — regenerate from that SVG if the brand
mark changes. Default Capacitor launcher mipmaps still ship in `android/`.
When preparing a Play store-listing refresh, regenerate Android assets
(e.g. `npx @capacitor/assets generate` from this folder) on a machine with
the asset tooling — not required for `assembleDebug`.
