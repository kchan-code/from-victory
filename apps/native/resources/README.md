# Native icon / splash sources

Copied from `apps/web/public` PWA icons for later brand-asset generation:

| File | Source |
|---|---|
| `icon.png` | `apps/web/public/icon-512.png` |
| `icon-maskable.png` | `apps/web/public/icon-maskable.png` |
| `splash.png` | placeholder from `icon-512.png` (replace with a real splash art before store screenshots) |

Default Capacitor launcher mipmaps / iOS AppIcon still ship in `android/` /
`ios/`. When preparing store submission, regenerate platform assets (e.g.
`npx @capacitor/assets generate` from this folder) on a machine with the
asset tooling — not required for `assembleDebug`.
