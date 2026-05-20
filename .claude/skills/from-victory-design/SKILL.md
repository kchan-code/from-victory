---
name: from-victory-design
description: Use this skill to generate well-branded interfaces and assets for From Victory — a faith-based Christian athlete mental-toughness and daily-mindset training app. Contains brand guidelines, color and type tokens, fonts, logos, iconography, and a mobile UI kit for building production interfaces or throwaway prototypes/mocks.
user-invocable: true
---

The design system lives at `docs/Claude Design System/` in the repo root. This SKILL.md is a thin pointer so the skill is invokable as `/from-victory-design`; all assets and documentation are at that path.

Read `docs/Claude Design System/README.md` first — it has the full brand spine, content-voice rules, visual foundations, iconography, and a manifest of everything else in this skill.

## What's there
- `docs/Claude Design System/README.md` — brand, content, visual & icon fundamentals (READ FIRST).
- `docs/Claude Design System/colors_and_type.css` — design tokens (CSS vars for color, type, spacing, radii, elevation, motion).
- `docs/Claude Design System/assets/` — logos (icon + wordmark + stacked, mono variants), flame mark.
- `docs/Claude Design System/preview/` — review cards documenting every token category.
- `docs/Claude Design System/ui_kits/from-victory-app/` — the canonical mobile-first UI kit (cleaner componentized React JSX). This is the source for porting to `apps/web/`.

## How to use this skill

**If creating visual artifacts** (slides, mocks, throwaway prototypes, marketing pages, presentation decks, app screen comps):
- Link to or inline `docs/Claude Design System/colors_and_type.css` and use its CSS vars. Don't reinvent tokens.
- Copy logos and the flame mark from `docs/Claude Design System/assets/` into your output. **Never hand-draw the From Victory logo in SVG** — use the provided files.
- Compose UI from the kit in `docs/Claude Design System/ui_kits/from-victory-app/` (`<Button>`, `<RhythmRing>`, `<Card>`, `<VerseRef>`, etc.) when working in React. Read the kit's `README.md` for the component inventory.
- Save outputs as static HTML files. Show the user what you've built.

**If working on production code:**
- Copy assets out and follow the token names in `docs/Claude Design System/colors_and_type.css`. Adapt them to your styling layer (Tailwind config, CSS Modules, etc.).
- Read `docs/Claude Design System/README.md` § CONTENT FUNDAMENTALS before writing any UI copy — voice and casing rules are strict (no emoji, no shame-based language, no streak vocabulary).

**If invoked without specific guidance:**
Ask the user what they want to build or design. Suggested clarifying questions:
- Surface? (App screen, landing page, slide deck, social asset, onboarding flow?)
- Mode? (Mentor / Coach / Devotional / Teammate — the four voice modes.)
- Sport context? (Hockey is the launched path; brand should stay sport-neutral.)
- Audience? (Athlete 13–21 / parent buyer / coach.)
- Variations needed? Tweaks needed?
Then act as an expert designer for the brand and output HTML artifacts or production code as appropriate.

## Inviolable rules (don't break these)
1. **No emoji.** Anywhere.
2. **No streak language or shame-based copy.** Use "rhythm," "return," "today's reps." Never "streak broken," "you missed," "don't lose your…"
3. **The cross belongs in the wordmark, not the icon.** Never add a cross to the standalone V+flame mark.
4. **Cobalt is for UI accents only** (progress, focus, selected state). Never on the logo, never as a brand surface fill.
5. **One gold element per view, max.** The eye should know exactly where to go.
6. **Scripture uses the serif (`--font-scripture`), references use mono gold.** UI uses `Sora` / `Manrope`.
7. **No drop shadows on dark surfaces as decoration.** Depth = surface tint stack + 1px hairlines. Shadows only when floating over photography or for gold-glow CTA focus.

## Scope alignment (read before designing screens)
V1 ships:
- 4 bottom tabs: Today, Train, Journal, You (Word tab is V2)
- Pre-game and Post-game rituals (athlete-triggered, no game-schedule data model)
- Single "Growing" content tone (faith-intensity selector is V1.1)
- Locked themed progression on Train (athlete-selectable themes are V1.1)
- Audience 13–21
- Authoritative scope is in [`CLAUDE.md`](../../../CLAUDE.md) — when this skill's docs conflict with CLAUDE.md, CLAUDE.md wins.
