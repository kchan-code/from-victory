# Marketing-site conversion audit & redesign plan

*2026-08-29 · Discovery-mode deliverable · Source prompt: KC's conversion-redesign brief · All code claims verified against the repo at `main` (8293c8d)*

## 1. Verdict on the brief

The brief is sound and executable. Its audit findings are almost entirely accurate against the code — 9 of its 10 claims verified with file-level evidence. Its guardrails (no rebrand, no new positioning, no invented proof, no new dependencies, no tracking) match the repo's own governance exactly. Its five-issue Discovery→Delivery structure matches the repo workflow.

It needs **six corrections** before execution (§3), the most important being: the beta testimonial quote is currently prohibited by the GTM claims discipline and needs KC + Delvox-engine sign-off, not just in-repo approval; and the 18+ signup path is feature-flagged, so hero routing depends on confirming the production flag.

## 2. Verified findings (prompt claim → code truth)

| # | Prompt claim | Verdict | Evidence |
|---|---|---|---|
| 1 | Mobile nav shows only logo, Sports, Sign in | **Confirmed** (<640px) | `ScrollNav.tsx:110-160` — Pricing + trial `hidden sm:`, For Parents `hidden md:`, Resources `hidden lg:`. No hamburger, no drawer. Under 640px there is **no nav path to /pricing or /signup at all** |
| 2 | Hero CTA says "your athlete", routes to parent signup | **Confirmed** | `Hero.tsx:43-49` → `/signup`; `/signup` is the parent form (`app/signup/page.tsx:16-20`) |
| 3 | 18+ athlete path is below the first signup screen | **Worse than claimed** | `/signup/athlete` is never linked from the homepage; only entry is a link inside `/signup` (`app/signup/page.tsx:23-33`), gated by `ENABLE_ADULT_SIGNUP` (`lib/flags.ts:17-19`); route 404s when off |
| 4 | Trial CTA at top, then nothing until near the bottom | **Confirmed** | Sections 2–9 (of 10) contain zero conversion CTAs; on mobile the nav trial button is hidden too, so ~8 sections have no path to signup |
| 5 | Playable sample almost two screens down | **Partially** | `PregameSample` is already **section 2 of 10** (`app/page.tsx:34`). The distance is hero height, not section order — the fix is a shorter hero, not moving the sample. Its context blurb is `hidden lg:block` so mobile gets only the bare player |
| 6 | Hero renders hidden while reveal animation runs | **Confirmed** | `Reveal.tsx` + `globals.css:362-368` (`opacity:0; translateY(16px)`), wraps the entire hero copy column and mockups (`Hero.tsx:19,65`). SSR markup is invisible until JS adds `.in` — real no-JS/hydration blank-hero risk on the LCP element. `prefers-reduced-motion` **is** respected (JS + CSS) |
| 7 | Six-screen preview lacks accessible controls | **Confirmed** | `AppPreview.tsx:34` bare `overflow-x` scroller; no buttons, no progress, nothing focusable. Fake phone internals **are** exposed to screen readers (six "9:41"s, "Complete Day 8", fake journal entries) — unlike the hero mockups which are correctly `aria-hidden` (`Hero.tsx:66`) |
| 8 | No `<main>` landmark, no skip link | **Confirmed** | `app/page.tsx` is a bare fragment; ~25 other routes have `<main>` — the homepage is the outlier. Zero skip links exist anywhere in the app |
| 9 | Sub-44px targets | **Confirmed** | Nav Sports trigger ~32px, Sign in ~38px, footer links ~21px, footer social icons 18px, waitlist role radios ~34px. (Existing good patterns to copy: audio button 48px, FAQ summaries `min-h-[44px]`, hero CTAs ~55px) |
| 10 | Pricing page duplicates the feature list per interval | **Confirmed** | One array `annualFeatures` rendered twice (`pricing/page.tsx:162-177`, `223-238`); no toggle; trial stated 7+ times, cancel-anytime 5 times; value prop restated in three formats. The page's own copy admits it: "the only difference is the billing interval" (`:280-283`) |
| 11 | Waitlist defaults to Hockey | **Confirmed** | `WaitlistForm.tsx:227` `defaultValue="Hockey"`; live sports listed as selectable "— available now" options that still submit to the waitlist; the live-7 list is hand-maintained, **not** derived from `SUPPORTED_SPORTS` (drift risk — nav and adult signup do derive it) |
| 12 | Too much competing gold in the first viewport | **Confirmed** | Two solid-gold buttons + ~11 gold accents in the hero (pulse dot with animated glow, radial wash, watermark, italic accent, 8 mockup golds) |

**Content redundancy (supports the 30–40% height cut):** identity/rhythm re-explained across 6 of 10 sections; Hebrews 12:1-2 quoted verbatim twice; trial-pricing line duplicated verbatim (`Hero.tsx:59` = `Waitlist.tsx:58`); `Problem → Framework → HowItWorks → AppPreview → Faith` is five consecutive restatements of the thesis before any second CTA.

## 3. Corrections to the brief before execution

1. **The beta quote cannot ship on in-repo approval alone.** `docs/gtm/voice-and-guardrails.md` guardrail 5: "No invented proof — no testimonials, ratings, user counts, or retention claims until a real cohort exists." `docs/gtm/product-truths.md` (2026-08-24) permits exactly one beta framing: *"shaped by athlete beta feedback" without quoting or counting testers*. Shipping the quote requires (a) the athlete's confirmed permission, (b) KC amending the guardrail via the Delvox engine, (c) a dated product-truths entry. **Recommendation:** build the founder/beta-proof section now using the already-approved "shaped by athlete beta feedback" framing, with a reserved slot for the quote once cleared.
2. **Copy ownership.** Per CLAUDE.md/AGENTS.md GTM clause, no positioning, tagline, or marketing copy may be invented in this repo. The redesign is a *restructure* — reuse and relocate existing approved copy (homepage, /parents, /pricing, `docs/gtm/pages/`). Any net-new headline (parent-trust strip, pricing-summary heading) is an ask to KC to run the engine. Also: kc-voice bans em-dashes and emoji in customer-facing copy — applies to every moved/edited string.
3. **The homepage H1 and title are pinned.** "Visualize and Compete From Victory" (product-truths 2026-08-26) is asserted by `__tests__/seo-geo-pass.test.ts`. The restructure must not touch H1/title/meta.
4. **Hebrews 12:1-2 must stay on the homepage** (CLAUDE.md canonical: "Spine verse (home page)"). The brief's 8-section order omits the Faith section — fold the spine verse into the method section ("Scripture as the foundation") or a condensed faith block; deduplicate to one verbatim quote, don't delete it.
5. **18+ routing depends on the production flag.** Adult self-serve is live per product-truths (2026-07-22), but the code gates everything on `ENABLE_ADULT_SIGNUP`. Confirm the Vercel production env has it `true` before building hero routing; render the athlete CTA server-side behind the same flag so the site stays truthful if it's ever off. Note: AGENTS.md/CLAUDE.md still call 18+ self-serve "post-MVP" — stale; product-truths wins.
6. **The waitlist "email + sport only" rule conflicts with the ICP.** `docs/gtm/icp.md` names the waitlist hand-raise — *type (Athlete/Parent/Coach) + primary sport* — as an explicit targeting signal. Keep the role radio (it's operationally necessary for GTM); make first name optional or drop it. KC's call, flagged in the waitlist issue.

**Also noted:** the updated live-app screenshots referenced in the brief are **not in the repo or this session** — commit them (e.g. `apps/web/public/images/screens/`) or share them before the carousel issue; they're the best candidate to replace the fake JSX phone internals with real, honestly-labeled product images.

## 4. Target homepage architecture

Current 10 sections + footer → 8 sections, mapped:

| New | Section | From |
|---|---|---|
| 1 | Hero (short: H1, one-line sub, primary parent CTA + 18+ path, price/trial line) | Hero, cut ~40%; SSR-visible; one dominant gold (the CTA); mockup golds dimmed or single mockup |
| 2 | Playable pregame sample + context line (mobile too) + contextual CTA | PregameSample (already here; un-hide blurb, add CTA) |
| 3 | Three-part method: daily mental-skill training · Scripture as the foundation (spine verse lives here) · game-day + practice application | Problem + Framework + HowItWorks + Faith → one section |
| 4 | Accessible product preview (rebuilt carousel, real screenshots) | AppPreview |
| 5 | Parent trust strip: metadata-not-content, no ads, no data sold, no tracking, not therapy, 13+ floor → links to /parents + /privacy | New assembly from existing approved lines on /parents + /pricing |
| 6 | Pricing summary: trial, $5/mo · $49/yr first athlete, $3/$29 additional, cancel anytime → /pricing | New assembly from pricing-hero copy |
| 7 | Founder + beta proof ("shaped by athlete beta feedback"; quote slot pending approval) | Founder |
| 8 | FAQ + final CTA + waitlist (non-live sports only) | Faq + Waitlist |

CTA cadence: hero → after sample → after preview → final. Mobile nav carries a compact trial pill at all widths (fixes the mid-page dead zone without inventing a floating widget; a scroll-triggered floating CTA stays a follow-up evaluation).

## 5. Linear issues (Discovery output)

All are Tier-2 / KC-gated (public marketing surface) with the full gate chain: frontend-engineer implements → `npm run typecheck` / `lint` / targeted tests / `build` → issue-scoped `/review` → qa-reviewer → kids-privacy-officer (`VERDICT: APPROVED`, unbolded, line-start) → KC merge. No new dependencies anywhere.

### FV-A `feat/fv-<n>-marketing-a11y-reveal` — landmarks, skip link, entrance-animation fix
- `<main id="main-content">` on the homepage; visible-on-focus skip link in `app/layout.tsx` (benefits all routes); heading-level audit.
- Hero (and any above-fold content) renders visible in SSR: remove `fv-reveal` from hero copy + mockups, keep reveal for below-fold sections only; preserve the existing double `prefers-reduced-motion` handling; no-JS renders everything.
- Files: `app/layout.tsx`, `app/page.tsx`, `components/landing/Reveal.tsx`, `Hero.tsx`, `globals.css`. Tests: new homepage smoke (landmark, single h1, hero visible without `.in`).

### FV-B `feat/fv-<n>-mobile-nav-menu` — accessible mobile navigation
- Hamburger below `md`: Sports, For the Athlete, For Parents, Pricing, Resources, Sign in, Start free trial. Labeled trigger with `aria-expanded`, focus containment + return, Escape-to-close, background scroll lock, cobalt focus, all targets ≥44px; compact gold trial pill visible in the bar at all widths; nav otherwise neutral.
- Fix sub-44px nav targets (Sports trigger, Sign in). Footer target sizes → same PR if small, else follow-up.
- Files: `ScrollNav.tsx` (hot file — serialize), `Footer.tsx`. Tests: extend `scroll-nav-sports-menu.test.tsx`; new mobile-menu tests (Escape, focus return, scroll lock).

### FV-C `feat/fv-<n>-app-preview-carousel` — accessible product preview
- One full phone per mobile viewport, scroll-snap (keep), 44px prev/next, "1 of 6" progress, keyboard operable, concise carousel name/description; fake phone internals `aria-hidden` with one short accessible description per slide (mirror the hero's existing pattern).
- Replace JSX fake-UI internals with KC's updated real screenshots (blocked on assets landing in repo). No video.
- Files: `AppPreview.tsx` only — parallelizable with FV-B.

### FV-D `feat/fv-<n>-homepage-ia` — homepage restructure + CTA cadence (the big one)
- Implement §4 order; consolidate the five thesis restatements; one verbatim Hebrews 12:1-2; parent-trust strip and pricing summary assembled from existing approved copy; founder + beta framing; contextual CTAs; one dominant gold per view; ~30–40% mobile height cut with deeper content moved to /parents, /pricing, sport pages — not deleted.
- Guards: H1/title/meta unchanged (seo-geo-pass pins); `AttributionCapture` mount preserved (feeds Stripe checkout metadata — revenue attribution breaks silently if dropped); `landing-faq.test.tsx` verbatim copy pins; `landing-truthfulness.e2e.ts` must stay green.
- Files: `app/page.tsx`, most of `components/landing/*`. Depends on FV-A/B/C. Any net-new headline → KC/engine first.

### FV-E `feat/fv-<n>-signup-routing` — parent vs 18+ athlete routing + handoff
- Precondition: confirm `ENABLE_ADULT_SIGNUP=true` in production.
- Hero: primary parent CTA + flag-gated secondary "Athlete 18+" path → `/signup/athlete`. `/signup`: upfront two-path chooser (flag-gated) before the parent form. Both paths: lightweight progress indicator (parent: Account → Athlete → Trial; adult: Account → Trial), what-happens-next line, trial/billing expectations using the existing FTC-compliant card-required disclosure (`SubscribeForm.tsx:239-240`) — **never** "no credit card required" (a card is required: `lib/actions/subscription.ts:244-251`). No social sign-in. Age rules untouched.
- Files: `Hero.tsx` (serialize after FV-D), `app/signup/*`, `components/auth/AuthShell.tsx`. backend-engineer consulted (auth-adjacent); product-strategist pre-check (presentation of shipped behavior, no scope change).

### FV-F `feat/fv-<n>-pricing-simplify` — pricing page one-plan redesign
- One plan card; annual/monthly segmented control (annual default; reuse the accessible radiogroup pattern from `SubscribeForm.tsx:186-223`; SSR shows annual, control enhances); one shared feature list; first + additional athlete prices; one primary CTA with trial + cancel terms adjacent; monthly never hidden; keep data-practices section, promises (no ads / no data sold / no tracking / cancel anytime), FAQ; cut ~half the discrete card units.
- Follow-up issue (not this diff): dedupe the third pricing copy on `/parents:325-401`.
- Files: `app/pricing/page.tsx` + one new client component. Independent of homepage stream.

### FV-G `feat/fv-<n>-waitlist-cleanup` — waitlist for non-live sports only
- Derive options from `SUPPORTED_SPORTS`; waitlist select lists **only** non-live sports (Swimming, Wrestling, Volleyball, Track & field, Tennis, Other); no live default and no Hockey default; a visitor arriving with or selecting a live sport is routed to the trial CTA instead; keep consent language and honeypot; keep the `/teams` deep-link (`?role=coach&intent=group-pricing`) working; fields: email + sport + role (ICP signal — see §3.6), first name KC's call.
- Update `landing-truthfulness.e2e.ts` waitlist assertions and add a `WaitlistForm` unit test (none exists).
- Files: `WaitlistForm.tsx`, `Waitlist.tsx`, `lib/actions/waitlist.ts` (validation list). Independent stream.

**Sequencing:** FV-A → FV-B ∥ FV-C → FV-D → FV-E, with FV-F and FV-G runnable in parallel any time (independent areas). ScrollNav and Hero are the hot files: nothing else touches them while B (nav) and D/E (hero) are open.

## 6. Verification (every delivery PR)

375×812 / 768 / 1280+; no horizontal overflow; critical content visible with JS disabled; keyboard-only pass; mobile-menu focus containment; carousel SR output; 200% zoom; reduced motion; WCAG AA contrast; no color-only state. From `apps/web`: `npm run typecheck`, `npm run lint`, targeted `npm test`, `npm run build` for routing/SSR changes. Guard rails that must stay green: `seo-geo-pass`, `landing-faq` copy pins, `landing-truthfulness` e2e, `scroll-nav-sports-menu`, native-shell route pins (`/`, `/parents`, `/pricing` unchanged), `analytics-allowed-routes`.

After each ship: record the change in `docs/gtm/product-truths.md` (dated, factual).

## 7. Open questions for KC

1. **Beta quote:** approve the two-step path (ship "shaped by athlete beta feedback" now; add the quote after athlete permission + engine guardrail amendment)?
2. **`ENABLE_ADULT_SIGNUP`** — confirm it is `true` in Vercel production.
3. **Screenshots:** commit the updated live-app screenshots (which screens, what naming) so FV-C can use real product images.
4. **Waitlist fields:** keep the role radio (GTM hand-raise signal) against the brief's email+sport-only rule?
5. **Net-new headlines** for the parent-trust and pricing-summary strips: reuse existing lines, or run the Delvox engine for two short headings?
6. **Mobile persistent CTA:** nav-bar trial pill (recommended, restrained) vs a scroll-triggered floating button (follow-up evaluation)?
