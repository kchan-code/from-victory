# From Victory — Lead Agent Context

## Mission
A daily-discipline + mental-toughness + Christian faith app for youth athletes,
launching with hockey (U13–U15). Parent buys, kid uses. Help young athletes
build identity, resilience, and faith through small daily reps.

## Brand Spine
"From Victory" = from Christ's victory (1 Corinthians 15:57, Romans 8:37).
We operate FROM a place of already-won victory, not striving TOWARD it.
Identity precedes performance. A kid who gets cut, benched, or loses is
still loved and still operating from victory.

All content, copy, and UX reflects this frame. Mental toughness is not
self-reliance. It is resting in identity, then competing freely.

## Founder Context
KC (GitHub: kchan-code). Hockey dad. Building this to a working state, then
recruiting a credible chaplain or sports psychologist advisor. Reserve 2–5%
equity for that advisory hire. The product-strategist agent should flag any
feature that needs clinical or theological credibility we don't yet have.

## Audience
- Buyer: parents (evangelical / non-denominational Protestant lean)
- User: their kids, U13–U15 for MVP
- Phase 2 extends to U16–U18. Phase 3 is a separate B2C product for 18–20.
- Influencers: coaches, team chaplains, hockey associations

## Denominational Tone
Evangelical / non-denominational Protestant. NIV translation by default.
Personal, relational, scripture-applied-to-real-life. Avoid Catholic-specific
language (Mass, saints, rosary) and Reformed-specific framing (TULIP,
catechism quotes). Stay accessible across Protestant traditions.

## Tech Stack (do not deviate without product-strategist approval)
- Frontend: Next.js 14 (App Router), Tailwind CSS, TypeScript strict
- Mobile delivery: PWA (installable to home screen). No native iOS/Android in MVP.
- Backend: Supabase (Postgres + Auth + Storage)
- Payments: Stripe Billing
- Hosting: Vercel (auto-deploy from main)
- Notifications: Web Push API
- Single repo, monorepo layout

## Repo Structure
from-victory/
├── CLAUDE.md
├── .claude/
│   ├── agents/             # subagent definitions
│   ├── commands/           # slash commands
│   └── settings.json       # tool permissions
├── .github/workflows/      # CI gates
├── apps/web/               # Next.js app
├── packages/content/       # devotionals + exercises (sport-agnostic JSON)
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── README.md

## Subagents
| Agent | Owns |
|---|---|
| product-strategist | MVP scope, scope-creep killer |
| frontend-engineer | Next.js, Tailwind, mobile-first UI, PWA shell |
| backend-engineer | Supabase schema, RLS, auth, Stripe webhooks |
| content-curator | Devotionals, journal prompts, mental skill exercises |
| qa-reviewer | Playwright E2E, accessibility, smoke tests |
| kids-privacy-officer | COPPA/GDPR-K review on every PR. Has veto. |

Delegate to subagents proactively. The lead orchestrates, doesn't do
everything itself.

## Workflow Rules (NON-NEGOTIABLE)
1. Never edit `main` directly. Every task starts with `git checkout -b feature/<name>`.
2. Commit in small logical units. Conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`.
3. Open a PR for every change. Never merge locally and push. Merge through GitHub UI.
4. CI must pass before merge. Build, typecheck, tests, kids-privacy-officer review.
5. Hotfixes get a `hotfix/<name>` branch, same flow. No exceptions.

## MVP Scope (locked — kill scope creep ruthlessly)
- Parent signup + Stripe subscription ($8.99/mo or $79/yr)
- Parent creates kid account (no email for kid)
- One daily devotional, hockey-themed, faith-tied (30 days seeded at launch)
- One daily journal prompt (text input, kid-only readable)
- Streak counter
- Parent dashboard: streak + journal entry count (NOT content)
- Push notifications via Web Push
- One landing page
- COPPA-compliant onboarding for under-13 kids
- Crisis-resource keyword detection (Option C — see below)

Out of scope for MVP: video, audio narration, community feed, coach view,
team mode, native app wrap, multi-sport expansion, AI-personalized content,
free tier, social sign-in.

## Non-Negotiable Constraints

### Child Safety + Privacy
- Minimal kid PII: first name, birthdate, parent link. No email, no phone,
  no address, no photos, no long-term IP-derived data.
- COPPA applies to kids under 13. Verifiable parental consent at kid-account
  creation. No behavioral analytics, no third-party tracking, no ads ever
  on minor accounts.
- Journal entries are kid-only readable. RLS enforced at the database level.
- Parent dashboard reads metadata (count, dates) from a separate view,
  never journal content.
- kids-privacy-officer reviews every migration and every PR touching user
  data. Block on violations.

### Journal Safety Architecture (Option C)
- Kid writes privately. Default: nobody else reads it. Ever.
- Server-side keyword detection runs on entry submission. Detection
  vocabulary is in `packages/content/safety-keywords.json`. Reviewed
  quarterly with a clinical advisor (TBD).
- If detected, the kid sees an in-line resource screen: 988 Suicide &
  Crisis Lifeline, Crisis Text Line, "talk to a trusted adult" prompt.
  No parent alert. No third party notified.
- Every detection event is logged (event only, NOT content) for forensic
  and product improvement purposes.
- We are NOT a mental health service. TOS makes this explicit. Marketing
  copy never claims therapy, treatment, or clinical care.

### Content Voice
- Brand frame: identity → performance. FROM victory.
- Scripture: NIV default. Cite chapter and verse.
- Tone: personal, conversational, real. No churchy jargon without context
  a 13-year-old at a 7th-grade reading level can follow.
- Hockey examples for MVP. Underlying content structure is sport-agnostic
  so swapping examples per sport in v2 is trivial.

### COPPA Implementation Specifics
- Birthdate captured at kid account creation.
- Under-13 path: verifiable parental consent required (Stripe $0.01 charge
  + refund is the industry-accepted method; confirm with attorney).
- Under-13 accounts: no behavioral analytics, no third-party profiling SDKs,
  no ads, no email collection.
- 13+ minor accounts: still no behavioral analytics on minors, but lighter
  consent flow.
- Parent controls account deletion. Cascading delete of all kid data within
  30 days of request.

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

## Code Conventions
- TypeScript strict mode
- Server Components by default, Client Components only when interactivity is required
- Tailwind utility classes inline. No CSS modules unless asked.
- Supabase types generated and committed: `supabase gen types typescript --local`
- Conventional commits enforced
- No `any` type without a `// reason:` comment explaining why