# From Victory — Lead Agent Context

## Mission
A daily mental toughness training app with faith built in, for athletes
ages 13-21 launching with hockey. The parent buys (for MVP), the athlete
trains: one daily training session combining a mental skill, a scripture
foundation, and a private journal reflection. Built on the brand spine
that identity precedes performance — we operate FROM Christ's victory,
not toward it.

This is a mental toughness training app with faith as the foundation.
It is NOT a devotional app with sports language added. The ordering
matters and shapes every product decision.

## Brand Spine
"From Victory" = from Christ's victory (1 Corinthians 15:57, Romans 8:37).
We operate FROM a place of already-won victory, not striving TOWARD it.
Identity precedes performance. An athlete who gets cut, benched, or loses
is still loved and still operating from victory.

### Canonical phrases
- Public tagline: "Your Identity Is Secure. Compete From Victory."
- Internal anchor: "Rooted in the Word. Fueled by the Spirit. Built for
  Victory."

Use these exactly. Don't paraphrase.

## Brand Document
The full brand identity is at `docs/brand.md`. Every agent that works on
content, copy, voice, UI, or visual identity reads it. The PDF source
lives at `docs/From_Victory_Comprehensive_Design_Document.pdf`.

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

### Influencers: coaches, team chaplains, hockey associations
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
├── CLAUDE.md
├── docs/
│   ├── brand.md
│   └── From_Victory_Comprehensive_Design_Document.pdf
├── .claude/
│   ├── agents/             # subagent definitions
│   ├── commands/           # slash commands
│   └── settings.json       # tool permissions
├── .github/workflows/      # CI gates
├── apps/web/               # Next.js app
├── packages/content/       # training content (sport-agnostic JSON)
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── README.md

## Subagents
| Agent | Owns |
|---|---|
| product-strategist | MVP scope, scope-creep killer |
| frontend-engineer | Next.js, Tailwind, mobile-first UI, PWA shell, brand visual application |
| backend-engineer | Supabase schema, RLS, auth, Stripe webhooks |
| content-curator | Orchestrates training content; integrates sports-psychologist + youth-pastor outputs into one voice across the four voice modes |
| sports-psychologist | Mental skills content (Dweck, Gallwey, Loehr, etc.). Co-author. |
| youth-pastor | Scripture and theological framing (Keller, Lewis). Co-author. |
| qa-reviewer | Playwright E2E, accessibility, smoke tests |
| kids-privacy-officer | Minor (13-17) + general data-protection review on every PR. Has veto. |

The content trio (content-curator + sports-psychologist + youth-pastor)
works together: curator briefs both specialists, they return raw material,
curator integrates into a single training session in one voice.

## Workflow Rules (NON-NEGOTIABLE)
1. Never edit `main` directly. Every task starts with `git checkout -b feature/<name>`.
2. Commit in small logical units. Conventional commits: feat:, fix:, chore:, test:, docs:.
3. Open a PR for every change. Never merge locally and push. Merge through GitHub UI.
4. CI must pass before merge. Build, typecheck, tests, lint.
5. Hotfixes get a hotfix/<name> branch, same flow. No exceptions.
6. Privacy review is manual while pre-MVP. Before merging any PR that
   touches `apps/web/**`, `supabase/**`, `packages/content/**`,
   `.claude/agents/**`, `CLAUDE.md`, or `docs/brand.md`, invoke the
   kids-privacy-officer subagent from a Claude Code session against the
   PR diff. Findings posted as a PR comment for audit trail.
   The automated CI gate will return when schema/auth/journal code lands
   (see `.github/workflows/ci.yml` note for re-enabling reference).

## MVP Scope (locked — kill scope creep ruthlessly)
- Parent signup + Stripe subscription ($8.99/mo or $79/yr)
- Parent creates athlete account (no email for the athlete)
- One daily training session, hockey-themed, faith-foundational (30 days
  of content seeded at launch). Structure: mental skill + scripture
  foundation + journal prompt.
- Athlete-private journal entry per session
- **Rhythm visualization** (not a streak counter). Visualizes
  participation and return, never punishes missed days. Internal data
  can track streaks; user-facing concept is rhythm.
- Parent dashboard: rhythm + entry count metadata (NEVER journal content)
- Push notifications via Web Push
- One landing page
- Age-gated onboarding (13+ floor); minor protections for 13-17
- Crisis-resource keyword detection (Option C — see below)

Out of scope for MVP: video, audio narration, community feed, coach view,
team mode, native app wrap, multi-sport expansion, AI-personalized content,
free tier, social sign-in, progressive training plans (that's v2),
leaderboards (never), 18+ self-onboard/self-pay fork (post-MVP).

## Non-Negotiable Constraints

### Child Safety + Privacy
- Minimal athlete PII: first name, birthdate, parent link. No email,
  no phone, no address, no photos, no long-term IP-derived data.
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
- Athlete writes privately. Default: nobody else reads it. Ever.
- Server-side keyword detection runs on entry submission. Detection
  vocabulary is in `packages/content/safety-keywords.json`. Reviewed
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
- Hockey examples for MVP. Underlying content structure is sport-agnostic
  so swapping examples per sport in v2 is trivial.

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

## Open Items (ask KC before assuming)
- Domain: fromvictory.com or fromvictory.app (purchase pending)
- USPTO trademark search (pending)
- Clinical advisor for safety-keyword vocabulary (pending recruit)
- Stripe price IDs (set on first Stripe project setup)
- Logo SVG vectors (designer producing from PDF spec)
- Brand font licenses (using Inter as placeholder until decided)
- 18+ athlete fork (self-onboard, self-pay) — design later, post-MVP.

## Code Conventions
- TypeScript strict mode
- Server Components by default, Client Components only when interactivity is needed
- Tailwind utility classes inline. No CSS modules unless asked.
- Supabase types generated and committed: `supabase gen types typescript --local`
- Conventional commits enforced
- No `any` type without a `// reason:` comment