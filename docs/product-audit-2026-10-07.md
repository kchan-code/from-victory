# Product audit and plan while App Review is pending

*2026-10-07 · Discovery-mode deliverable · Lead agent · All claims verified against `main` at `3ecf496` and the live site, plus a full local walk of the parent and athlete flows on a fresh local Supabase stack.*

## 1. Where the product stands

- iOS 1.0 (build 6) has been in `WAITING_FOR_REVIEW` since 2026-09-27 (FV-210, manual release). Every engineering hour in September went to Apple billing. CI on `main` is fully green, including the non-required E2E and RLS harness jobs.
- The web product is live and buyable. Seven sports ship at full parity (30 daily sessions each, verified in the seeded catalog; pregame play libraries; pre-practice; text post-game).
- The last athlete beta synthesis (2026-09-08) produced five issues: FV-563, FV-564, FV-565, FV-566, FV-567. All five are still Backlog. Two KC-reported bugs from the same window (FV-576, FV-543) are also unfixed.

**Method.** Public site read at phone width (home, pricing, parents, hockey, resources, signup, sign-in, 18+ signup). Then a complete local run against `main`: parent signup → add athlete → pairing link → athlete claim → sport → quiz → hub → daily training → completion → journey, settings, ride home → full 11-step pregame setup → review → audio screen → parent dashboard and athlete detail after activity. Production usage numbers were not pulled; see §6.

## 2. Findings, ranked

### Must fix now (reachable by any new parent, athlete, or Apple reviewer)

**F1. The trial promise is inconsistent across the funnel.** FV-574 (merged in the FV-210 arc) made new trials 7 days for one athlete. The in-app surfaces say 7 (`/signup`, `/subscribe`). Every marketing surface still says 14, and so does the 18+ signup page: 27 files in `apps/web` still contain "14-day" or "14 days" (home hero, pricing summary, pricing page, parents, all seven sport pages, FAQ, structured data, waitlist, resources, `/signup/athlete`). `docs/gtm/product-truths.md` (2026-09-12) explicitly called this a 2x overclaim that had to be reconciled "in the same launch window, not after." It was not. A parent reads 14 on the homepage, 7 on the signup page, and a family with two athletes gets no trial at all while the pricing page says "14-day free trial" next to "each additional athlete." Marketing copy is Delvox-engine owned, so this needs KC to run the engine; the in-app `/signup/athlete` line and `CLAUDE.md` can be fixed in-repo.

**F2. The daily-training completion moment crashes.** FV-576 (reported by KC 2026-09-12, no priority set). Reproduced locally: complete a day, tap any "When's your next game?" answer, and the whole page falls to the error boundary ("Something went wrong"). Root cause is `lib/actions/next-game.ts` re-exporting a non-async value from a `"use server"` file; the client also ignores failures. `git log` shows the file is unchanged since 2026-06-12 (FV-240), so the prompt has never worked in production. This is the emotional peak of the daily loop and it ends in an error screen, and an Apple reviewer using the demo account can hit it.

**F3. The completion overlay shows the wrong day.** New. After completing Day 1 the overlay reads "Day 2 done." with ring "2/30", because `CompletionCTA` renders `dayNumber` and `completedCount` from props that refresh under the open overlay. Day 2's full content also swaps in underneath the overlay. Fix: snapshot the values at click time.

**F4. Pregame Review screen shows the spine verse, not the chosen focus verse.** FV-543 (filed 2026-09-01, no priority). Reproduced: Focus = Confidence, Review card still prints "Run with perseverance, eyes fixed on Jesus." `ReviewScreen` renders `SCRIPTURE_SHORT` unconditionally at `screens-b.tsx:510`; the pattern to copy already exists two screens later.

**F5. The sport picker's back arrow signs the athlete out.** New. On the first-run "What sport do you play?" screen the top-left ← icon is a `signOut` form (`SportPicker.tsx:138-153`, aria-label "Sign out"). A 13-year-old who just claimed their account and taps ← is logged out at step one of onboarding.

### Should fix soon (friction KC's beta testers already named)

**F6. Pregame setup is 11 steps before any audio.** Counted live: start screen (plus a 5-step coachmark tour on first run) → Breathe (3 rounds, ~30s, skippable) → Focus → Position → Positive Plays → Hard Moment → Reset Anchor → Self-Talk → Cue Word → Close → Review → Audio. Roughly a dozen taps minimum. The 2026-09-08 synthesis said exactly this ("too many prompts"). FV-563 (saved replay primary + focused edit) is the right fix and is spec'd. FV-253 (PR #504, approved, held behind the iOS review) removes the Position and Focus re-asks for returning athletes and is the prerequisite FV-563 is serialized behind.

**F7. Tools are offered without being taught.** Reset Anchor ("Press thumb to palm") and Cue Word appear with no explanation of how to use them. FV-566 covers it. The copy is KC-gated.

**F8. The parent, who pays, never sees the headline feature.** The dashboard and athlete detail show daily-training rhythm only (sessions complete, last trained, a 1–30 day grid). Pregame and pre-practice runs are invisible to the buyer. FV-246 covers the weekly digest side; nothing covers the dashboard. For a product whose differentiator is the pregame session, the payer has no evidence it is being used.

**F9. No transactional email.** There is no welcome email, no pairing-link email, and no trial-ending reminder (FV-194). The weekly digest is the only parent email. A 7-day trial with a card on file and no reminder is both a churn risk and a complaint risk.

**F10. Copy and polish on first-run surfaces (new, small).** Parent dashboard greets a brand-new account with "Welcome back"; the pair screen prints its instruction sentence twice; delete-account copy still mentions "journals" (descoped FV-135); the "No athletes yet" line claims "we don't collect anything else" though a username is collected; the subscription card never mentions the trial. Em-dashes appear in 25 app-side files despite the FV-550 sweep (that sweep covered marketing only). On the Positive Plays step the "Pick at least one" hint collides with the sticky CONTINUE bar at 375px.

**F11. Settings is missing the two cheap trust items.** No Legal & About entry (FV-162) and no always-on "Get help" crisis entry (FV-163). Crisis resources only appear on the Ride Home page. Both are small and both read well to a reviewer.

### Housekeeping

- FV-289 ("insert intro line when visualization starts") is done in code (`shared-viz-intro` clip, `audio-playlist.ts:415`) and can be closed.
- Launch-tier gate issues for sports that are already live can be closed: FV-100 (baseball), FV-81 (soccer), FV-272 (golf). FV-21's title still says "beyond hockey + basketball."
- Nine public surfaces say the app is not in the App Store (seven sport pages, the comparison article, `lib/gtm/page-titles.ts`). They all go stale the moment Apple approves. See §4.
- The homepage H1 drifted from the locked casing; PR #531 (Cursor) is open and small.

## 3. What is working well

The content is strong and on-voice at every step we read (Day 1 and Day 2 bodies, the hard-moment and self-talk menus, the Ride Home modules with the crisis block). Pairing works end to end, the device remembers the athlete at sign-in, and the hub declutter (one hero tile, icon grid, no bottom nav) lands. The local stack, migrations, and seed catalog all reproduce production cleanly, and CI is green across the board.

## 4. Plan for the review window

Assume two to four weeks. Web deploys change what the reviewer sees inside the WebView shell, so keep deploys to bug fixes and copy truth, not architecture. The two large arcs that should **not** start now: the ElevenLabs regen chain (FV-559/560/561/562, by-ear, KC-gated, binary-affecting via `MANIFEST_VERSION`) and the Next 16 upgrade (FV-421).

### Week 1: truth and trust (all small, all reachable by a reviewer)

| Order | Issue | Why first | Owner / gate |
|---|---|---|---|
| 1 | FV-576 next-game crash | Core loop ends in an error screen; four months old; reviewer-reachable | frontend-engineer → qa → privacy (touches `apps/web`) |
| 2 | New: completion overlay stale props (F3) | Same screen, same PR is tempting but keep separate | frontend-engineer |
| 3 | FV-543 Review verse | One-line fix with a test | frontend-engineer |
| 4 | New: sport-picker back arrow (F5) | First-run athlete trap | frontend-engineer |
| 5 | New: trial-copy reconcile (F1) | In-repo: `/signup/athlete`, `CLAUDE.md`. Marketing: KC runs the Delvox engine, then one PR across the 27 files | KC (engine) + frontend-engineer, kc-gate |
| 6 | New: first-run copy batch (F10) | Cheap credibility | frontend-engineer |
| 7 | FV-253 PR #504 | Already approved. Recommend KC lift the hold: it only removes re-asks and is well inside the reviewed purpose envelope | KC |

### Weeks 2–3: the athlete's voice (the September beta synthesis)

| Order | Issue | Notes |
|---|---|---|
| 8 | FV-563 saved replay primary + focused edit | Biggest UX lever. Hot files (`PregameFlow`, `screens-a/b`, `types`); serialize after FV-253 lands. KC approves the changed primary path |
| 9 | FV-566 explain anchors and cue words | Content trio + basketball-expert; KC copy gate. Independent of 8 at the content stage, collides at the UI stage |
| 10 | FV-162 + FV-163 Settings Legal/About + Get help | Small, parallel, privacy-reviewed |
| 11 | FV-564 athlete-ended prayer hold | Discovery/prototype only (playlist split in `audio-playlist.ts`, hold in `useClipPlayer`). No asset regen |
| 12 | FV-565 map new situations to truthful content | Discovery; feeds FV-501. Content trio |
| 13 | FV-567 tool explanations as resources + social | Independent area (`/resources`, Delvox). Good parallel stream |

### Parallel: the buyer's loop

| Issue | Notes |
|---|---|
| New: parent dashboard shows pregame and pre-practice participation (F8) | Counts and dates only, never selections. Needs the privacy decision FV-246 already frames; do both together |
| FV-194 transactional email: welcome + pairing link + trial-ending reminder | Resend is already wired for the digest |
| FV-605 expired Apple transaction reports success | Small, Apple-path, lands before public release |

### Approval-day runbook (prepare now, execute on approval)

New issue. Flip the nine "not in stores" surfaces to the App Store link plus badge (DPLA §9.4 allows badges, never "partnership" language), add a dated `product-truths.md` entry, remove the App Review allowlist entry (per FV-210 notes), and re-check the 7-day trial copy against the App Store listing. Draft the PR on a branch now so approval day is a merge, not a writing session.

### Hygiene (one sitting)

Close FV-289, FV-100, FV-81, FV-272; retitle FV-21; merge or close PR #531; set priorities on FV-576 and FV-543 (both currently "No priority").

## 5. Issues filed from this audit

Filed 2026-10-07:

| Issue | Finding | Priority |
|---|---|---|
| FV-609 | Trial copy reconcile, 27 files + CLAUDE.md (F1) | High, kc-gate |
| FV-610 | Completion overlay shows next day's number (F3) | High |
| FV-611 | Sport-picker back arrow signs the athlete out (F5) | High |
| FV-612 | First-run copy batch incl. Positive Plays hint collision (F10) | Medium |
| FV-613 | Parent dashboard shows pregame and pre-practice participation (F8) | High, kc-gate, privacy |
| FV-614 | App Store approval-day runbook (§4) | High, kc-gate |

Existing issues this audit re-ranks (no edits made to them): FV-576 and FV-543 should carry High; FV-253's hold is KC's call; FV-563 is the first feature after the week-1 fixes.

## 6. Limits of this audit

- Production usage was not queried. Before committing the week-2 order, KC should read `/dashboard/admin/metrics` for DAU and pregame completions; if pregame completions are low relative to pregame starts, FV-563 moves ahead of everything in week 2.
- Stripe checkout and the Apple purchase surfaces were not exercised locally (no keys in the local env). Trial findings come from code and the live public pages.
- Audio was not played in this run; the audio screen rendered correctly with a 6:07 duration (copy says "Five minutes").
- The browser automation could not land taps on the breath-skip link; a direct DOM click worked, so this is a tooling artifact, not a product bug, and is not reported above.
