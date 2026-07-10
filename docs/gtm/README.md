# GTM handoff — From Victory ⇄ Delvox GTM Engine

**Snapshot date: 2026-07-08.** This folder is a dated export from the Delvox GTM Engine
(github.com/kchan-code/delvox-engine), the system that owns From Victory's go-to-market
strategy. The engine is the source of truth; this folder is its read-only mirror in the
app repo. When the two disagree, the engine wins.

## The contract between the two repos

| Owns | Delvox GTM Engine | This repo (From Victory app) |
|---|---|---|
| Positioning, brand messaging, ICP | ✅ (KC-approved artifacts, `brand.md` / `icp.md` here) | consume, never revise |
| Content strategy + finished copy | ✅ (produced + KC-gated in the engine) | consume |
| Site pages | writes them as ready HTML (`pages/`) | ✅ implement + publish |
| Social publishing | ✅ (Publer pipeline, in progress) | — |
| Product truths (features, changes) | consume via profile refresh | ✅ record in `product-truths.md` |
| Waitlist, app features, site build | — | ✅ |

## What's in this snapshot

- `brand.md` — KC-approved positioning + brand messaging. The identity: "from victory,
  not for victory"; Christ-centered without being performance-centered.
- `icp.md` — personas: the believing athlete, the sports parent, the huddle leader.
- `pillars.md` + `editorial-calendar.md` — the content plan the copy derives from.
- `pages/` — **two KC-approved pages, ready to publish on fromvictoryapp.com** (FAQ
  schema markup inline; publish as-is, do not rewrite the copy):
  - `fv-crrc-w1-page.html` — the pregame ritual anchor (the guided visualization session)
  - `fv-believer-w1-page-comparison.html` — the three-app comparison
- `copy-paste-sheet.md` — the same approved content in manual-posting form.
- `parked-social-drafts.md` — IG/TikTok captions drafted and voice-passed but NOT yet
  approved as assets (the engine's channel/media support for IG lands shortly). Treat as
  preview, not publishable.
- `voice-and-guardrails.md` — the voice rules any copy in this repo must follow.
- `product-truths.md` — **the reverse pipe. When a feature ships or changes here, record
  it there.** The engine reads it on refresh; this is how marketing stays true to the
  product.

## Refresh protocol

This is a snapshot, not a live sync. When the engine produces new approved artifacts, KC
re-exports this folder. If something here looks stale, ask KC rather than improvising.
