# From Victory — App UI Kit

Mobile-first, dark-mode-first prototype of the From Victory app.

## Files
| File | Role |
|---|---|
| `index.html` | Live entry point. Mounts the React app inside a 402×874 iOS frame. |
| `ios-frame.jsx` | iOS 26 device frame (status bar + home indicator). |
| `Icon.jsx` | `<Icon name=… size=… filled=…>` — 24×24 line set (Lucide-inspired) + filled variant for selected tab state. |
| `Components.jsx` | Atoms: `<Button>`, `<Chip>`, `<Card>`, `<Eyebrow>`, `<VerseRef>`, `<RhythmRing>`, `<ModuleTile>`, `<FlameMark>`. Also exposes `window.FV` — runtime copy of design tokens. |
| `AppShell.jsx` | `<TopBar>`, `<TabBar>`, `<Screen>` chrome. |
| `TodayScreen.jsx` | Home — identity hero + rhythm card + module grid + game-day banner. |
| `DevotionalScreen.jsx` | Scripture surface — verse card, reflection, prompt → journal. |
| `PregameScreen.jsx` | Coach-mode breath surface (Inhale / Hold / Exhale), 3-breath counter. |
| `JournalScreen.jsx` | Private composer + prompt chip + past entries. |
| `ProfileScreen.jsx` | "You" — identity card, rhythm-not-streak stats, training paths, account rows. |
| `App.jsx` | Routes between tabs + overlay screens. Includes the inline `<TrainScreen>`. |

## Navigation
- Bottom tabs: **Today · Train · Journal · Word · You** (5 tabs).
- The pre-game reset is reachable from the **Today** game-day banner CTA or the first card on the **Train** tab.
- Back arrow on overlay screens returns to Today.

## Faithful to the brand brief
- **No streak counter.** The home surface is a *rhythm ring* (cobalt arc), and Profile shows "Days this week" and "Rhythm last 30" — never "X-day streak."
- **No emoji, no shame copy, no exclamation marks** in body. The only uppercase CTA is `PRE-GAME RESET` on game-day surfaces.
- **One gold element per view max.** Cobalt is used only for progress / focus.
- **Scripture in serif (`Source Serif 4`)**, references in mono gold, app UI in `Sora` / `Manrope`.

## Known cuts
- Real device safe-area gutters use the iOS frame's defaults. The bottom tab bar sits inside the frame's safe area.
- No real auth, no real persistence — `Save entry` does nothing.
- Hockey is the only sport tile that's active; the others are flagged "soon" per the brand brief.

## Adapting for production
- Tokens are in `../../colors_and_type.css`. Variant maps (`FV` object in `Components.jsx`) shadow them for runtime JSX use — keep the two in sync.
- Icons are inline SVG paths. Swap `Icon.jsx` for Lucide-React in a real codebase.
- Type families are Google Fonts substitutes — see `../../README.md` § Type Substitutions before shipping.
