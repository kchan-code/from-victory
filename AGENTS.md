# From Victory — Lead Agent Context

## Mission
A daily mental toughness training app with faith built in, for athletes
ages 13-21. Launch sports live in production: hockey, basketball, golf, and
football (source of truth: `SUPPORTED_SPORTS` in `apps/web/lib/sports.ts`). The parent
buys (for MVP), the athlete
trains: one daily training session combining a mental skill, a scripture
foundation, and a private journal reflection. Built on the brand spine
that identity precedes performance — we operate FROM Christ's victory,
not toward it.

This is a mental toughness training app with faith as the foundation.
It is NOT a devotional app with sports language added. The ordering
matters and shapes every product decision.

## Brand Spine
"From Victory" anchored in Hebrews 12:1-2 — "Let us run with perseverance
the race marked out for us, fixing our eyes on Jesus, the pioneer and
perfecter of faith." We run the race God has marked out, eyes on the One
who already ran his for us. We compete FROM that completed work, not
toward a victory we are trying to earn. Identity precedes performance.
An athlete who gets cut, benched, or loses is still loved and still
operating from victory.

### Canonical phrases
- Public tagline: "Your Identity Is Secure. Compete From Victory."
- Internal anchor: "Rooted in the Word. Fueled by the Spirit. Built for
  Victory."
- Spine verse (home page): Hebrews 12:1-2

Use these exactly. Don't paraphrase.

## Brand Document
The full brand identity is at `docs/brand.md`. Every agent that works on
content, copy, voice, UI, or visual identity reads it. The PDF source
lives at `docs/From_Victory_Comprehensive_Design_Document.pdf`.

The visual design system (SVG logos, CSS tokens, preview cards, mobile
UI kit) is at `docs/Claude Design System/`. Invoke via the
`/from-victory-design` skill for in-session design help.

## Founder Context
KC (GitHub: kchan-code). Hockey dad. Building this to a working state,
then recruiting a credible chaplain or sports psychologist advisor.
Reserve 2-5% equity for that advisory hire. The product-strategist
agent flags any feature that needs clinical or theological credibility
we don't yet have.

## Audience

### Primary: athletes ages 13-21
A wide band — middle school through college. Frameworks hold across the
range; examples and register do not. Content calibrates per piece.
- 13-15 (U15): younger, simpler register, concrete examples
- 16-18 (U18 / junior): recruiting, cuts, depth charts, identity pressure
- 18-21 (junior / college; legal adults): autonomy, performance stakes,
  owning their own faith

These are serious athletes. Many train 10+ hours/week, compete in scouted
leagues, think about junior, prep school, or college. Bullshit detectors
are sharp across the whole band. Down-talk loses them.

### Buyer (MVP): parents
Evangelical / non-denominational Protestant lean. Buys the subscription,
reads the parent dashboard. Not the primary user. (Future fork: 18+
athletes self-onboard and self-pay. Not MVP scope.)

### Influencers: coaches, team chaplains, hockey + basketball associations
Distribution channel. Not direct users in MVP.

## Audience language (CRITICAL — applies to ALL agents)

| Context | Term to use | Example |
|---|---|---|
| Athlete-facing content (training, prompts, in-app UI) | "athlete," "young athlete," "player," direct "you" | "When you step on the ice tonight..." |
| Parent-facing copy (dashboard, marketing, onboarding) | "your child," "your athlete" | "Track your athlete's rhythm" |
| Legal / data / privacy / TOS / RLS policies | "minor" (13-17), "user"/"adult" (18+) | "Minor accounts (13-17) are not shown ads." |

**Never use "kid," "kiddo," "youngster," or "young person" in
athlete-facing content.** A serious AAA player does not see themselves as
a kid; calling them one is a credibility leak.

The kids-privacy-officer agent is named for legacy reasons. Its real
domain is now minor data protection (13-17) plus general data protection.
Its internal COPPA-under-13 references are stale — see Open Items.

## Denominational Tone
Evangelical / non-denominational Protestant. NIV translation by default.
Personal, relational, scripture-applied-to-real-life. Avoid Catholic-
specific language (Mass, saints, rosary) and Reformed-distinctive framing
(TULIP, catechism quotes, covenant theology). Stay accessible across
Protestant traditions.

## Tech Stack (do not deviate without product-strategist approval)
- Frontend: Next.js 14 (App Router), Tailwind CSS, TypeScript strict
- Mobile delivery: PWA (installable to home screen). No native iOS/Android
  in MVP.
- Backend: Supabase (Postgres + Auth + Storage)
- Payments: Stripe Billing
- Hosting: Vercel (auto-deploy from main)
- Notifications: Web Push API
- Single repo, monorepo layout

## Repo Structure
from-victory/
├── AGENTS.md
├── docs/
│   ├── brand.md
│   └── From_Victory_Comprehensive_Design_Document.pdf
├── .codex/
│   ├── agents/             # subagent definitions
│   ├── commands/           # slash commands
│   └── settings.json       # tool permissions
├── .github/
│   ├── workflows/          # CI gates
│   └── scripts/            # CI helper scripts (privacy-verdict.cjs)
├── apps/web/               # Next.js app
├── bin/                    # repo helper scripts (new-fv.sh)
├── supabase/
│   └── migrations/
├── vercel.json
└── README.md

## Subagents
| Agent | Owns |
|---|---|
| product-strategist | MVP scope, scope-creep killer |
| frontend-engineer | Next.js, Tailwind, mobile-first UI, PWA shell, brand visual application |
| backend-engineer | Supabase schema, RLS, auth, Stripe webhooks |
| audio-engineer | Pregame guided-audio pipeline: TTS generation, ffmpeg/EQ mastering, AudioScript.postFilter, regeneration, MANIFEST_VERSION, spectral QA |
| content-curator | Orchestrates training content; integrates sports-psychologist + youth-pastor outputs into one voice across the four voice modes |
| sports-psychologist | Mental skills content (Dweck, Gallwey, Loehr, etc.). Co-author. |
| youth-pastor | Scripture and theological framing (Keller, Lewis). Co-author. |
| hockey-expert | Hockey domain authenticity: the game, age/development roadmap, positions, league + recruiting culture. Advises the content trio; verifies sport-specific scripts. NOT a clinician. |
| basketball-expert | Basketball domain authenticity: the game, age/development roadmap, positions, league + recruiting culture. Advises the content trio; verifies sport-specific scripts. NOT a clinician. |
| qa-reviewer | Playwright E2E, accessibility, smoke tests |
| kids-privacy-officer | Minor (13-17) + general data-protection review on every PR. Has veto. |

The content trio (content-curator + sports-psychologist + youth-pastor)
works together: curator briefs both specialists, they return raw material,
curator integrates into a single training session in one voice.

For sport-specific content, content-curator also pulls in the relevant
**sport-expert** (hockey-expert / basketball-expert / golf-expert /
football-expert) for domain
authenticity — realistic positions, adversities, vocabulary, and
age/level fit. The sport-expert advises and verifies; it does NOT write
the mental skill (sports-psychologist) or the scripture (youth-pastor),
and it is not a clinician. One sport-expert per live sport. Hockey,
basketball, golf, and football are the live sports (source of truth:
`SUPPORTED_SPORTS`) — the pregame engine resolves each from a
per-sport config registry (see MVP Scope). Sports beyond the live set are v2.

## Agent Orchestration
The lead agent is the **sole orchestrator**. Subagents are leaf workers — they
cannot invoke each other, so every handoff routes through the lead.
"Coordination" is the lead invoking the right specialist at the right time and
integrating the result. Agents return findings/work to the lead; the lead is
accountable for the outcome.

Standing invocation policy — apply these by default, not by memory:

| Trigger | Invoke (before the work / before merge) |
|---|---|
| New feature, scope expansion, new dependency, or tech-stack deviation | product-strategist (has veto) — BEFORE building |
| UI / Next.js / Tailwind / PWA / accessibility work in `apps/web` | frontend-engineer (athlete-UX lens + build-note checklist) |
| Supabase schema / RLS / migration / auth / Stripe / server action | backend-engineer |
| Pregame audio pipeline / TTS / ffmpeg / EQ / `MANIFEST_VERSION` | audio-engineer |
| Athlete-facing training, journal, or scripture content | content-curator (orchestrates sports-psychologist + youth-pastor) |
| Sport-specific content (hockey/basketball/golf/football scenarios, positions, examples, pregame scripts) | content-curator + the relevant sport-expert (hockey-expert / basketball-expert / golf-expert / football-expert) for authenticity |
| Any PR touching runtime or tested code — before privacy + merge | qa-reviewer |
| Any PR touching `apps/web/**`, `supabase/**`, `.codex/agents/**`, `AGENTS.md`, `docs/brand.md` | kids-privacy-officer (also nudged by the privacy-review hook) |

Rules of the road:
- **Reviewer order:** qa-reviewer → kids-privacy-officer → merge (via GitHub UI).
- The lead may do small/mechanical work directly, but **delegates substantial
  engineering to the owning agent** so its encoded discipline (athlete-UX lens,
  RLS rules, audio QA) actually gets applied — not bypassed for speed.
- product-strategist and kids-privacy-officer hold vetoes; respect them.
- Don't add a new agent to fix a coordination gap — fix the invocation policy
  here first.
- **Specialist invocation does not license scope expansion.** Invoking a
  specialist (content trio, frontend, backend, audio) returns work scoped to the
  current issue's acceptance criteria. Anything the specialist surfaces beyond
  that becomes a follow-up Linear issue logged in the PR's "Intentionally not
  done" / "Follow-up issues created" fields — not extra commits in this diff.

### Orchestration mechanics — git ownership, isolation, worktrees (NON-NEGOTIABLE)

These are the MECHANICAL rules that keep parallel agent work from tangling the
repo. They exist because instruction-only control ("the brief said don't commit")
has failed repeatedly — a subagent with Bash will run git anyway when it decides
that "preserves the work." Enforce mechanically, not by reminder.

1. **The lead owns 100% of git.** Only the lead runs `git` / `gh` state changes —
   branch, commit, push, PR, checkout, stash, rebase, merge. Subagents return
   **file edits / diffs** to the lead; the lead integrates and commits. Never
   trust an agent's "I committed it" — if agents never touch git there is nothing
   to verify after the fact. A `PreToolUse` hook
   (`.codex/hooks/block-subagent-git.sh`) denies state-changing git to subagents
   as a backstop; it fails OPEN, so it can never block the lead.
2. **File-editing agents run in worktree isolation.** Spawn any agent that edits
   files with the Agent tool's `isolation: "worktree"`, so its filesystem and git
   are sandboxed and it cannot switch the shared branch or stomp the main tree.
3. **One git worktree per concurrent session/stream.** Never share a working
   directory across sessions — cross-session branch-switching drops agents onto
   the wrong branch mid-operation. Each parallel session/issue gets its own
   `git worktree add` (the FV-30 pattern). This also isolates untracked-file
   pileups per worktree.

Recovery playbooks (for when it still happens):
- **Stacked-PR conflict after a squash-merge:** the squashed base no longer
  matches your branch's copies of those commits. `git rebase --onto main
  <old-base> <branch>` replays only your unique commits onto the new `main`.
  Better: don't stack across a *pending* squash-merge unless necessary — wait for
  the base to merge, then branch off `main`.
- **Verify agent source-quotes against source before acting.** Review/expert
  agents can fabricate line-level "verbatim" quotes; confirm against the file
  (e.g. a verbatim-extraction diff) before filing an issue or editing.
- **Privacy `VERDICT:` lines must be unbolded at line-start.** The CI gate regex
  (`^[ \t>]*VERDICT:`) rejects `**VERDICT: APPROVED**` — the bold breaks the anchor.

## Workflow Rules (NON-NEGOTIABLE)
1. Never edit `main` directly. Every task starts with `git checkout -b feature/<name>`.
2. Commit in small logical units. Conventional commits: feat:, fix:, chore:, test:, docs:.
3. Open a PR for every change. Never merge locally and push. Merge through GitHub UI.
4. CI must pass before merge. Build, typecheck, tests, lint.
5. Hotfixes get a hotfix/<name> branch, same flow. No exceptions.
6. Before merging any PR that touches `apps/web/**`, `supabase/**`,
   `.codex/agents/**`, `AGENTS.md`, or `docs/brand.md`, invoke the
   kids-privacy-officer subagent from a Codex session against the
   PR diff. Findings posted as a PR comment for audit trail. The
   `privacy-verdict` CI check (`.github/workflows/privacy-verdict.yml`)
   is a required status check in the `main` ruleset and enforces
   `VERDICT: APPROVED` before merge — live as of FV-4 (2026-06-10).
7. Every PR fills `.github/pull_request_template.md` completely. The Linear-issue
   field uses a magic word (`Closes FV-###`); the branch name contains the issue
   id so Linear auto-links and auto-transitions In Review → Done.

## Issue-Scoped Workflow

Every change is scoped to one Linear issue. The issue is the contract — the
diff should match it and nothing else. (For a trivial mechanical change with no
issue, state that in the PR's Linear-issue field as "No issue — <reason>".)

**Before editing.** Read the Linear issue, the linked spec, and the existing
files you are about to touch. Restate the acceptance criteria and the non-goals
in your own words. Check how the codebase already solves this kind of problem
before introducing a new pattern (grep first). Run `git status` so you do not
disturb unrelated work in progress (the repo intentionally keeps `docs/` working
files untracked).

**While editing.** Implement only the stated acceptance criteria. Do not change
unrelated files. Do not refactor opportunistically. Preserve existing behavior
unless the issue explicitly changes it. Follow existing code style, architecture,
naming, and UI conventions. Add or update tests when the change affects logic,
data flow, permissions, integrations, or user-visible behavior. Scope you are
tempted to add becomes a follow-up issue, not a bigger diff.

**Before opening a PR.** Run the narrowest useful checks for the files you
touched (see Project Workflow Config → Verify). Review the full diff for changes
that escaped the issue's scope. Confirm the PR description follows
`.github/pull_request_template.md` — every section filled.

**Verification discipline.** Use the narrowest useful verification command for
the task. If a broad check (full build, whole test suite, Vercel Preview) is
already known to be red for reasons unrelated to your change — e.g. the Preview
Supabase env gap — say so plainly in the PR's How-to-test / Risk and list the
targeted checks that DID pass for the code you touched.

**Branch + issue linkage.** Branch names contain the Linear issue id so Linear
auto-links the PR: `<type>/fv-<n>-<slug>` (e.g. `feat/fv-12-stripe-checkout`).
PR title carries the id: `feat(pregame): wire Stripe checkout (FV-12)`. PR body
carries the magic word `Closes FV-12`. Opening the PR moves the issue to
In Review; merging it moves the issue to Done — no manual status change needed.

**Two modes — name which one you're in.**
- **Delivery (default):** issue-scoped, tight diffs, parallelizable. All the
  rules above apply.
- **Discovery / spike:** explicit + time-boxed exploration to figure out WHAT to
  build (e.g. a "should we re-architect X?" arc). The issue-scoped diff rules
  relax, but the DELIVERABLE is a set of well-formed Linear issues — not a merged
  multi-PR arc that bypassed tracking. Discovery ends by filing issues; delivery
  then executes them.

## PR Review Standard

Review the PR against the linked Linear issue **only**. The question is "does
this correctly and safely deliver this issue?" — not "what else could be better
here?"

Look for: acceptance-criteria gaps, bugs, broken data flow, unnecessary scope
expansion, security issues, bad abstractions, missing loading/error states, and
code that will be hard for a future agent to modify safely.

Do **not** suggest unrelated improvements unless they are severe (a real bug, a
security hole, data loss, a privacy/RLS regression). Drive-by refactor
suggestions are noise.

Return feedback in exactly three groups:

1. **Must fix before merge** — blocks merge. Bugs, security, AC not met,
   data-flow breaks, privacy/RLS regressions.
2. **Should fix soon** — not a blocker; file a follow-up Linear issue. Tech debt,
   missing edge-case handling, weak tests.
3. **Safe to merge** — observations and nits the author may take or leave.

**Scope-leash mode: ADVISORY.** An over-scoped PR (diff exceeds the linked
issue's acceptance criteria) is FLAGGED in group 2 and the extra scope is logged
in the PR's "Intentionally not done" / "Follow-up issues created" fields — it is
NOT blocked on scope alone. (Revisit tightening to blocking if scope-creep
persists.)

**Two reviewer tiers.** qa-reviewer and kids-privacy-officer are mandatory
cross-cutting gates: they review against global standards (regression / a11y /
test pyramid; minor-data-protection + RLS) and MAY exceed issue scope, because a
safety, privacy, or regression finding is "severe" by definition and belongs in
group 1. The general issue-scoped review (the default-case `/review` pass) is
bound strictly to the linked issue's AC. Both map output onto the three groups.
The privacy veto is never suppressed to satisfy "issue-scoped only."

## MVP Scope (locked — kill scope creep ruthlessly)
- Parent signup + Stripe subscription (first athlete $5/mo or $49/yr; each additional athlete $3/mo or $29/yr; 14-day first-time trial)
- Parent creates athlete account (no email for the athlete)
- One daily training session, themed per live sport (hockey, basketball,
  golf, football — see `SUPPORTED_SPORTS`), faith-
  foundational (30 days of content per sport, seeded at launch).
  Structure: mental skill + scripture foundation. (Journal prompt was
  shipped and then descoped per FV-135 — do not re-wire without KC.)
- Athlete-private journal — **built, dormant, descoped** (FV-135).
  Infrastructure exists in `apps/web/lib/safety/`; no production
  callers. Do not wire without KC.
- **Rhythm visualization** (not a streak counter). Visualizes
  participation and return, never punishes missed days. Internal data
  can track streaks; user-facing concept is rhythm.
- Parent dashboard: rhythm + entry count metadata (NEVER journal content)
- Push notifications via Web Push
- One landing page
- Age-gated onboarding (13+ floor); minor protections for 13-17
- Crisis-resource keyword detection (Option C — see below)
- **Pregame guided audio session** (~5 min). Athlete makes setup
  selections — including **choosing up to 3 positive plays from their
  position's play library and the challenge to rehearse** (FV-144) — then
  a real audio narration delivers the chosen visualizations, coping plan,
  and send-off. The chosen play clips replace the flagship `viz-{role}`
  arrival clip (flagship = nothing-picked fallback only). Sport-aware
  (hockey, basketball, golf, football), resolved from a per-sport config registry.
  Added to MVP 2026-05-24 in response to direct beta-tester feedback.
  Shipped as a compositional clip playlist — per-position/adversity
  personalization, ash voice via OpenAI TTS, runtime-stitched and
  content-addressed (see MANIFEST_VERSION). A text-mode timer remains as
  the fallback when the clip player can't load audio.
  **Every sport ships the full viz content contract** — flagship + ~7-play
  positive-play library per position + hard-moment grid + pre-practice
  (see `docs/adding-a-sport.md` Step 7; CI-enforced for live sports) — a
  sport without its play library is incomplete, not shippable.

Out of scope for MVP: video, daily training session audio (Daily
Training and the Post-Game Debrief are text-only for MVP — narration
lives in the two guided performance-prep audio surfaces: Game-Day
Pregame at `/athlete/pregame` and Pre-Practice "Lock In" at
`/athlete/practice`, distinct athlete-facing experiences sharing one
engine), community feed, coach
view, team mode, native app wrap, sports beyond the live set (hockey,
basketball, golf, football) — additional sports are v2 (FV-21), AI-personalized content, free tier, social sign-in,
progressive training plans (that's v2), leaderboards (never), 18+
self-onboard/self-pay fork (post-MVP).

## Non-Negotiable Constraints

### Child Safety + Privacy
- Minimal athlete PII: first name, birthdate, parent link, and a self-chosen
  username (a pseudonymous login handle — no real name required, no email,
  never shown to third parties; added in FV-320 for cross-device login,
  kids-privacy-officer-reviewed). No phone, no address, no photos, no
  long-term IP-derived data.
- Journal entries are athlete-only readable. RLS enforced at the DB level.
- Parent dashboard reads metadata (count, dates) from a separate view,
  never journal content.
- kids-privacy-officer reviews every migration and every PR touching user
  data. Block on violations.

### Minor Data Protection (13-17)
- All athletes are 13+, so COPPA (under-13) does not apply. No verifiable-
  parental-consent machinery needed. This simplifies onboarding. Confirm
  with attorney before relying on it.
- Minors 13-17 still carry protections: state age-appropriate design codes
  (CA, FL, TX, others), GDPR-K (under-16 in parts of the EU), platform
  policies. No behavioral analytics, no third-party tracking, no ads on
  any 13-17 account.
- Athletes 18+ are legal adults. A future fork treats 18+ differently
  (self-onboard, self-pay). For MVP, the parent is the buyer across the
  whole band.
- Birthdate captured at account creation to confirm 13+ and apply 13-17
  protections.
- Parent controls deletion. Cascading delete of all athlete data within
  30 days of request.

### Journal Safety Architecture (Option C)
> **STATUS: BUILT, DORMANT, DESCOPED (FV-135).** `apps/web/lib/safety/`
> has zero production callers. Do not wire without KC.

- Athlete writes privately. Default: nobody else reads it. Ever.
- Server-side keyword detection runs on entry submission. Detection
  vocabulary is in `apps/web/lib/safety/safety-keywords.json`. Reviewed
  quarterly with a clinical advisor (TBD).
- If detected, the athlete sees an in-line resource screen: 988 Suicide
  & Crisis Lifeline, Crisis Text Line, "talk to a trusted adult" prompt.
  No parent alert. No third party notified.
- Every detection event is logged (event only, NOT content) for forensic
  and product-improvement purposes.
- We are NOT a mental health service. TOS makes this explicit. Marketing
  never claims therapy, treatment, or clinical care.

### Gamification (NON-NEGOTIABLE)
- Reward participation and return, never identity or spiritual worth
- No streaks-as-punishment. Use rhythm framing.
- No leaderboards, no athlete-to-athlete comparison, no public scoring
- An athlete returning after a gap sees encouragement, not "streak broken"

### Brand voice modes
The content trio flexes between four modes depending on context. See
docs/brand.md "Voice Modes" for the full table. Default mode is Mentor.

### Content Voice
- Brand frame: identity → performance. FROM victory.
- Scripture: NIV default. Cite chapter and verse.
- Reading level: accessible across the whole 13-21 band. Clear, direct
  prose. Calibrate by age — simpler and more concrete for 13-15, more
  depth and nuance for 16-21. Never down-talk any age.
- Athlete-facing content uses "athlete" or "you," never "kid."
- Examples drawn from the live sports (hockey, basketball, golf,
  football) for MVP. Underlying content structure is
  sport-agnostic so adding more sports in v2 is trivial.

### Visual Design
- Dark-mode-first across all athlete-facing surfaces. Light mode is
  optional and secondary.
- Brand colors per docs/brand.md. Gold/black is signature. Cobalt for UI
  progress only, never logo.
- Premium athletic feel, never churchy ministry aesthetic.

## Definition of Done (every feature)
- Code merged to main via PR
- All CI checks green (build, typecheck, tests, kids-privacy-officer)
- Smoke-tested on at least one mobile browser (Safari iOS, Chrome Android)
- README updated if setup steps changed
- No new third-party SDK without product-strategist approval

## Project Workflow Config
<!-- vibe-workflow-kit v1.0.0 — the ONLY per-project block. Prose workflow
     sections above are identical across repos; edit values here only. -->

- **Default branch:** `main`
- **App path(s):** `apps/web`
- **Linear team:** From Victory (`9fdb8aa8-8b16-4f44-9ce0-0ace088c4ae1`)
- **Issue-id prefix:** `FV`
- **Branch naming:** `<type>/fv-<n>-<slug>` e.g. `feat/fv-12-stripe-checkout`
- **Verify — fast gates (always), from `apps/web/`:** `npm run typecheck`, `npm run lint`
- **Verify — full (runtime / routing / server-action / schema changes):** `npm run build` (+ `npm test` when tests cover the path)
- **Verify — narrowest:** prefer a single test file or `tsc` on touched paths over the whole suite.
- **Review gate (before merge):** general `/review` (issue-scoped) → qa-reviewer → kids-privacy-officer (if privacy path) → merge
- **Privacy-sensitive paths (trigger kids-privacy-officer):** `apps/web/**`, `supabase/**`, `.codex/agents/**`, `AGENTS.md`, `docs/brand.md`
- **Project-specific guards (FV-142):** if any committed `*.mp3` changed, update `MANIFEST_VERSION` in `apps/web/components/pregame/audio-mapping.ts` **and** the matching `const MANIFEST_VERSION` in `apps/web/public/sw.js` to the new `manifestVersion` value from `manifest.json` (the hand-rolled SW can't import the TS constant; CI's `audio-cache-bust` job enforces they match). Clip filenames are content-addressed (`<slug>.<hash8>.mp3`) so the generator derives `MANIFEST_VERSION` automatically — it is printed to stdout after `npm run audio:generate -- --mode clips`.
- **Agent roster:** see `## Subagents` and `## Agent Orchestration` in this file.

## Merge Authority & Risk Tiers

The goal is to keep KC off the critical path for low-risk work and reserve his
attention for high-stakes calls. Every PR is one of two tiers.

**Tier 1 — auto-merge (no KC gate).** Mechanism: GitHub auto-merge
(`gh pr merge --auto`) — the PR merges itself once CI is green AND the
issue-scoped `/review` is clean AND (if it touches a privacy path) the
kids-privacy-officer is clean. No waiting on KC. Tier 1 = work CI + the gates
fully verify and that can't quietly harm a user:
  - docs, tests, CI/infra, isolated chores / dependency bumps
  - content-DATA additions that pass the `playlist-integrity` / schema guards
  - isolated bug fixes with a regression test, in a single non-hot file
  - anything labeled `tier:auto`

**Privacy override (HARD RULE).** A PR whose diff touches any Privacy-sensitive
path (see Project Workflow Config) is NEVER Tier-1 and NEVER auto-merges until
the kids-privacy-officer has posted `VERDICT: APPROVED`. The `privacy-verdict`
required status check (live as of FV-4 / 2026-06-10) enforces this
mechanically — `gh pr merge --auto` is safe because auto-merge cannot complete
until the check turns green. Tier shorthand never demotes a privacy review: a
"docs," "chore," "dependency bump," or "content-DATA" diff that ALSO touches a
privacy path is Tier-2 until privacy is APPROVED. A privacy `VERDICT: BLOCKED`
/ `CHANGES_REQUESTED` halts the merge regardless of tier or green CI.

**Tier 2 — KC-gated (explicit approval before merge).** Waits for KC:
  - payments/Stripe, auth, RLS, DB migrations (`supabase/**`)
  - by-ear audio quality calls (`area:audio` quality, not asset plumbing)
  - athlete-facing brand/voice CONTENT, or any product-scope change
  - any privacy/clinical finding ≥ HIGH, or a public/marketing surface
  - anything labeled `kc-gate`

**Prerequisite:** GitHub "Allow auto-merge" is enabled and the `main` ruleset
requires `privacy-verdict` and `Audio cache-bust guard` as status checks (active
as of FV-4 / 2026-06-10). Auto-merge waits for all required checks before
completing.

## Stream Boundaries & Parallel Work

Parallel streams only go faster if they don't fight over the same files.

> **Running multiple sessions on different FVs?** The full operating model —
> one worktree per session, routing by `area:` label, serialize-vs-parallelize,
> resync-on-merge, and the `bin/new-fv.sh` helper — is in
> `docs/parallel-sessions.md`. The rules below are the file-collision summary it
> builds on.

**Independent areas — safe to run concurrent streams:**
audio clip generation + `components/pregame/audio/clips.ts` + clip assets;
`supabase/migrations/**`; `.github/**` + CI; `docs/**`.

**Collision-prone hot files — serialize, do NOT parallelize:**
`components/pregame/screens-b.tsx`, `useClipPlayer.ts`, `PracticeFlow.tsx`,
`shared.tsx`, `types.ts`, `audio-mapping.ts`, `AGENTS.md`, `package.json`/lockfile.

Route concurrent Linear issues to independent areas. When two issues touch the
same hot file, set a Linear dependency (one blocks the other) and run them
sequentially — do not open two branches on the same hot file. As the app grows,
invest in subsystem boundaries so today's hot files become independent modules —
that conversion, not the tracker, is what raises the parallelism ceiling.

## Open Items (ask KC before assuming)
- Domain: fromvictory.com or fromvictory.app (purchase pending)
- USPTO trademark search (pending)
- Clinical advisor for safety-keyword vocabulary (pending recruit)
- Stripe price IDs (set on first Stripe project setup)
- Brand font licenses (design system pins Big Shoulders Display / Sora /
  Manrope / Source Serif 4 / JetBrains Mono as Google Fonts stand-ins —
  swap for licensed brand fonts when chosen)
- 18+ athlete fork (self-onboard, self-pay) — design later, post-MVP.

## Code Conventions
- TypeScript strict mode
- Server Components by default, Client Components only when interactivity is needed
- Tailwind utility classes inline. No CSS modules unless asked.
- Supabase types generated and committed: `supabase gen types typescript --local`
- Conventional commits enforced
- No `any` type without a `// reason:` comment

## GTM source of truth — the Delvox GTM Engine

Go-to-market strategy for this app — positioning, brand messaging, ICP, content plan,
and all publishable marketing copy — is owned by the **Delvox GTM Engine**
(github.com/kchan-code/delvox-engine, KC's agent-driven GTM system), not this repo. Its
KC-approved artifacts are mirrored here under `docs/gtm/` and are the contract:

1. **Never invent or revise positioning, taglines, ICP, or marketing copy in this repo.**
   Read `docs/gtm/brand.md`, `icp.md`, and `voice-and-guardrails.md` first; if what you
   need isn't there, ask KC to run the engine rather than improvising. When this repo
   and `docs/gtm/` disagree, `docs/gtm/` wins; when `docs/gtm/` seems stale, ask KC.
2. **This repo's GTM job is implementation:** publish the ready pages in
   `docs/gtm/pages/` on fromvictoryapp.com exactly as written (they carry FAQ schema
   inline), build the waitlist, ship the product. UI strings and microcopy written here
   follow `docs/gtm/voice-and-guardrails.md`.
3. **Product truths flow back.** When a feature ships, changes, or is cut, record it in
   `docs/gtm/product-truths.md` (dated, factual, no spin). The engine reads that file to
   keep marketing true to the product — a feature missing there is a feature missing
   from all marketing.
4. **Approval gate:** KC approves all customer-facing marketing copy in the engine
   before it reaches this repo. Don't create parallel approval paths here.
