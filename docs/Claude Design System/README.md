# From Victory — Design System

A faith-based mental-toughness and daily-mindset training app for athletes.
Hockey is the first content path; the brand is sport-neutral and scalable.

> **Public tagline:** Your Identity Is Secure. Compete From Victory.
> **Internal anchor:** Rooted in the Word. Fueled by the Spirit. Built for Victory.
> **Audience:** Athletes ages 13–21 (MVP launches with hockey), with parents as the buyer.

---

## What this design system covers

| File / folder | What's in it |
|---|---|
| `README.md` | You are here. Brand, content, visual & icon fundamentals. |
| `SKILL.md` | Agent-skill entry point — read first when invoking the skill. |
| `colors_and_type.css` | Single source of truth for color / type / spacing / motion tokens. |
| `assets/` | Logo lockups, icon set, brand textures. |
| `fonts/` | (Empty — using Google Fonts substitutes. See *Type Substitutions* below.) |
| `preview/` | Static HTML cards that populate the Design System review tab. |
| `ui_kits/from-victory-app/` | The mobile-first app UI kit — JSX components + interactive index. |

## Sources used

- **Brand doc** *(authoritative)*: `uploads/From_Victory_Comprehensive_Design_Document.docx` (extracted to `uploads/design_doc.txt`).
- **Codebase**: <https://github.com/kchan-code/from-victory> — Next.js 14 skeleton (App Router, Tailwind, TypeScript). At time of writing the repo is scaffolding only (no implemented UI), so the visual system here is built **from the brand doc**, not reverse-engineered from screens. Once the repo has real components, those should override the placeholders here.
- For deeper context including COPPA/journal-safety architecture, see [`CLAUDE.md`](https://github.com/kchan-code/from-victory/blob/main/CLAUDE.md) in the repo.

---

## Brand foundation

| | |
|---|---|
| **Product** | Mental toughness + mindset training app with faith built in — *not* a devotional with sports language. |
| **Foundation** | Secure identity in Christ. |
| **Method** | Daily discipline. |
| **Outcomes** | Mental toughness, confidence, resilience. |
| **Personality** | Bold warrior × calm champion × premium app polish. Disciplined, never harsh. |
| **Comparators** | Closer to Nike, Strava, WHOOP, Hallow, Headspace than to traditional Bible / youth-ministry brands. |

### Core product concepts
Daily rhythm (not shame-based streaks) · Pre-game mindset · Post-game reset · Scripture reflection · Prayer · Journaling · Locked themed progression (athlete-selectable themes land V1.1) · Weekly rhythm review (V1.1).

### Non-negotiables
- **No shame-based design.** No streak-breaking guilt, faith rankings, "spiritual scores," "God points," or anything that implies identity is earned through app usage.
- **No cheesy Christian imagery, athlete silhouettes, shields, crowns, or hockey-specific visuals in the master brand.**
- **Cross belongs in the wordmark, not the icon.** The T in VICTORY *is* the cross; the icon (open-book V + flame) stays subtle.
- **Cobalt is for UI accents only** — progress, focus, interaction. Never the primary logo color.

---

## CONTENT FUNDAMENTALS

### Voice modes (the same product speaks in four)
| Mode | When | Sounds like |
|---|---|---|
| **Mentor** *(default)* | Most app surfaces, onboarding, settings, devotional intros. | Steady. Wise. Encouraging. Short sentences. |
| **Coach** | Pre-game, drills, training modules, focus timers. | Direct. Imperative. Disciplined. "Lock in." "Three breaths. Reset." |
| **Devotional guide** | Scripture reflection, journaling prompts, prayer. | Biblical, honest, formative. Lower stakes, slower cadence. |
| **Teammate** | Encouragement, gentle re-engagement after a missed day. | Simple. No shame. "Glad you're back. Pick up where you are today." |

### Casing
- **Section labels / chips / tabs:** UPPERCASE, tracked +16%, geometric sans. (`fv-eyebrow`, `fv-micro`)
- **Screen titles:** Title Case in headings.
- **Body & prompts:** Sentence case. We don't shout in body copy.
- **Buttons:** Sentence case for soft CTAs (`Start today's rhythm`), UPPERCASE only for the primary "compete" CTA on game-day surfaces (`PRE-GAME RESET`).

### Person & tone
- **"You"**, never "thee/thou." Direct address.
- **"We"** sparingly, only when the product team is genuinely speaking (e.g. crisis-resource screens, privacy explainers).
- Reading level: ~7th grade. A 13-year-old should feel met, not lectured.
- Cite scripture as `Chapter Verse` in mono, e.g. `ROMANS 8:37` — NIV by default.

### Emoji & punctuation
- **No emoji.** Not in copy, not in notifications, not in UI labels. The brand carries itself through type and spacing.
- **No exclamation marks** in body. One is allowed as a Coach-mode imperative on a game-day screen, never twice in the same view.
- Em-dashes are fine. Avoid ellipses (they read as guilt-tripping).

### Words to use
> Rhythm · Discipline · Reset · Return · Identity · Confidence · Resilience · Focus · Growth · Training · From Victory

### Words to **never** use
> Spiritual score · Faith rank · God points · Worth score · Better Christian level · Streak broken · "You failed" · "You missed" · "Don't lose your…"

### Tone in practice

| Surface | Don't | Do |
|---|---|---|
| Missed-day re-entry | "You broke your 12-day streak 😞" | "Glad you're back. Today's rhythm is ready." |
| Push notification | "Don't lose your faith streak!" | "Two minutes. Pre-game reset is waiting." |
| Empty journal | "No entries yet. Start writing!" | "Your journal is yours. Write when you have something." |
| Devotional intro | "Today's word from God for YOU 🙏" | "ROMANS 8:37 — More than conquerors." |
| Onboarding line | "Build your faith muscle every day!" | "Daily reps. Steady identity. Built for the long season." |

---

## VISUAL FOUNDATIONS

### Mood
Premium athletic on a near-black stage. Sharp geometry for performance moments, soft rounded surfaces for journaling and prayer. No gradients-as-decoration, no purple-blue tech sheen, no church Photoshop tropes. When in doubt: **more black, more space, less ornament.**

### Color
- **Backgrounds** are Onyx (`#050505`) or Deep Charcoal (`#101010`). Pure black is reserved for splash and full-bleed photo overlays.
- **Foreground** is Clean White (`#F7F7F7`), never `#fff` — it's softer on OLED.
- **Warm Athletic Gold** (`#DFAF37`) is the brand accent and only the brand accent. One gold element per view, max — the eye should know exactly where to go. Use the Bright Gold Highlight (`#F4C24F`) only for hover/active states on gold.
- **Electric Cobalt** (`#245BFF`) is reserved for *progress* and *interaction feedback* — ring progress, focus rings, selected states. Never on logo, never as a brand surface.
- **Navy** (`#071A33`) and **Deep Purple** (`#24113F`) are depth options for hero / splash / prayer screens — used as flat fills, never gradients.
- Light mode exists as a fallback (white bg, near-black logo). The system is **dark-mode-first** and most surfaces will only ever ship dark.

### Type system
Tokens live in `colors_and_type.css`. Three roles:
1. **Athletic display** (`--font-display`) — wordmark, big stat numerals, section markers. Uppercase, tracked, sparingly used.
2. **Geometric sans** (`--font-heading`) — app headings, button labels. Confident but not harsh.
3. **Humanist sans** (`--font-body`) — body, journaling, settings, scripture-adjacent UI. Calm and accessible.
4. **Restrained serif** (`--font-scripture`) — Scripture verses *only*. Never UI chrome.
5. **Mono** (`--font-mono`) — verse references (`ROMANS 8:37`), tags, metadata.

**Type substitutions (flag for the user):**
The brand doc doesn't specify exact font files. The system uses these Google Fonts as stand-ins; please supply the licensed brand fonts when ready:
- Display → **Big Shoulders Display** *(replace with a custom athletic premium sans — e.g. Sequel Sans, Druk Wide, or a bespoke wordmark cut)*
- Heading → **Sora** *(replace with the chosen geometric sans — Söhne, Inter Display, Aeonik are common premium options)*
- Body → **Manrope** *(replace with the chosen humanist — e.g. Inter, Söhne, GT Walsheim)*
- Scripture → **Source Serif 4** *(replace if a different serif is selected)*
- Mono → **JetBrains Mono** *(stand-in for any geometric mono)*

### Spacing
8pt grid with a 4px micro step. Tokens `--s-1` (4px) through `--s-11` (96px). Layout *gaps* are spec'd in tokens, not magic numbers. The system breathes — generous spacing is part of the calm.

### Backgrounds
- **Default:** solid Onyx. No noise, no texture, no pattern.
- **Reflection / prayer surfaces:** Deep Charcoal with a subtle radial vignette (~5% gold or navy at center → onyx edges). Used to slow the eye. Never used on training screens.
- **Game-day / Pre-game:** full-bleed photographic background (athlete in motion or empty rink/court, desaturated cool, ~40% black overlay) with type + UI floated on top. Imagery should be high-grain, cinematic, never stocky.
- **Photography color vibe:** cool, low-saturation, slight grain. B&W or near-B&W is preferred. Warm tones reserved for portraits when the moment is reflective.
- **No repeating patterns. No illustrated decoration.** The only repeating motif allowed is the flame, used at <5% opacity as a watermark behind hero stats.

### Borders, cards, surfaces
- **Hairlines, not boxes.** Borders are 1px `rgba(247,247,247,0.08)` (`--border`). On hover/focus they lift to `0.14`.
- **Card radius:** `--r-md` (14px) default. Journaling and prayer cards use `--r-lg` (20px). Sheets and bottom modals use `--r-xl` (28px) on the top corners only.
- **No drop shadows on dark surfaces.** Depth is layered tint: `bg → bg-elev-1 → bg-elev-2 → bg-elev-3`. Drop shadow appears only when a surface floats above photography (`--shadow-2`) or as a gold focus glow on the primary CTA (`--shadow-glow-gold`).
- **No left-border-accent cards.** That tropes the design and we don't use it.

### Hover, press, focus
- **Hover (pointer devices):** background lifts one elevation step, or text shifts to `--accent-hot`. Never opacity-fade — that reads cheap.
- **Press:** scale `0.97`, duration `--d-fast`, ease `--ease-out`. Buttons darken to `--fv-gold-deep` for press fill, not lighter.
- **Focus:** 2px cobalt ring (`--fv-cobalt`) with 2px offset (`box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--fv-cobalt)`). Cobalt earns its keep here — focus is *interaction*, not branding.

### Motion
- **Default easing:** `--ease-out` (`cubic-bezier(0.2, 0.7, 0.2, 1)`). Confident, not bouncy.
- **Page transitions:** 220ms cross-fade + 8px vertical translate. No slide-over.
- **Reflection surfaces** (scripture reveal, prayer screens): 720ms gentle fade with `--ease-soft`. We slow the eye down on purpose.
- **No bouncy springs.** No rubber-band. No "fun" UI motion. The brand is steady.
- **Reduced motion:** respect `prefers-reduced-motion` — fades only, no translates.

### Transparency & blur
- Used for **two** things only: (1) sticky headers/tab bars over scrolling content (10–14px backdrop blur, 60% Onyx), (2) bottom-sheet scrims (Onyx at 72%, `--fv-overlay`).
- Never used as decoration. Never frosted-glass cards.

### Iconography (summary — full section below)
24×24 line icons, 1.75px stroke, rounded caps. Lucide is the working set. Custom marks (flame, open-book V, scripture-mark) live alongside.

### Layout rules
- Mobile-first. Phone safe area + 20px horizontal gutters by default.
- **Top bar:** 56px, transparent, with backdrop blur when content scrolls under.
- **Bottom tab bar:** 76px including safe area, 4 tabs in V1 (Today, Train, Journal, You).
- Primary CTA always **bottom-anchored** on training screens, **inline-trailing** on reading/journaling screens.
- One screen, one job. Never stack training + reading + nav controls competing for the same thumb.

### Layout vocabulary
- **Rhythm card** — daily check-in tile. `--r-lg`, charcoal, 1 hairline, gold ring-progress in top-right.
- **Verse card** — scripture surface. `--r-lg`, charcoal w/ subtle vignette, serif body, gold verse-ref label.
- **Module tile** — training module entry point. Square-ish, `--r-md`, icon top-left, time-to-complete bottom-right in mono.
- **Game-day banner** — full-bleed photo, 16:9 or full-screen, type bottom-left, single CTA bottom-right.

### Gamification visuals
- **Rhythm ring** (not a streak counter). Cobalt arc filling clockwise. Empty state reads "Today's rhythm" — *not* "Day 0 of streak."
- **Return badges** — earned on coming back, not punished for leaving. Gold pip in corner of profile avatar.
- **No flame counts.** The flame is a brand symbol, not a streak unit.

---

## ICONOGRAPHY

### Working icon set
- **Primary:** [Lucide](https://lucide.dev) — 24×24, 1.75px stroke, rounded line caps. Loaded via CDN in UI kits (`https://unpkg.com/lucide-static@latest`). Free, MIT, sport- and church-neutral.
- **Substitution flag:** Lucide is the placeholder set. If the team adopts a custom or licensed set, swap by replacing the `<use>` references in `ui_kits/from-victory-app/Icon.jsx`.

### Custom brand icons (in `assets/`)
All logo files are **vector SVG** — scale freely, edit colors at the file level.

- `logo-stacked.svg` — primary lockup, gold icon + white wordmark, transparent background. Use this for nearly everything.
- `logo-stacked-onyx.svg` — same lockup with onyx baked in as the background. Use for splash, app store hero, slide titles where the surrounding context isn't already onyx.
- `logo-stacked-mono-white.svg` — one-color white version. Use on photography, dark colored backgrounds where gold isn't allowed (sponsorship co-marks, etc.), or where you need a single-ink press output.
- `logo-stacked-mono-black.svg` — one-color black version. Light-mode marketing surfaces only.
- `logo-icon.svg` — icon only: open-book V + centered flame. Use for app icon, social avatar, favicon, in-app branding spots.
- `logo-icon-mono-white.svg` / `logo-icon-mono-black.svg` — single-ink icon variants.
- `mark-flame.svg` — flame extracted from the icon. Use as a small section marker (16–20px) or as a watermark behind hero stats at ≤8% opacity.

### Rules
- **No emoji.** Anywhere. Not in copy, not in notifications.
- **No unicode pictographs** as icons (no ⚡, ✓ in body, no 🏒).
- Icons are line-only on dark surfaces. Filled icons are reserved for the **selected** state in the bottom tab bar (gold fill).
- Icon-only buttons are 44×44 minimum hit target.
- Never tint icons gold unless the entire control is the brand CTA. Default icon color is `--fg-2`.

### The flame as motif
The flame may appear:
- As the logo (always).
- As a section marker in scripture / prayer screens, 16px, gold.
- As a watermark behind a hero stat, ≤5% opacity.

The flame may **not** appear:
- As a streak counter.
- As a decorative repeating pattern.
- Animated as fire VFX. (It's a symbol, not effect.)

---

## Index

- [`SKILL.md`](./SKILL.md) — agent-skill entrypoint
- [`colors_and_type.css`](./colors_and_type.css) — design tokens
- [`assets/`](./assets/) — logos, brand marks
- [`preview/`](./preview/) — review cards (Design System tab)
- [`ui_kits/from-victory-app/`](./ui_kits/from-victory-app/) — mobile app UI kit (interactive)

### How to explore further
- Read the brand doc in full: `uploads/design_doc.txt`.
- Browse the upstream codebase: <https://github.com/kchan-code/from-victory>. The `CLAUDE.md` there has product-strategy, COPPA, and content-voice context that goes deeper than this design system needs to. Recommended reading before building anything user-facing.
