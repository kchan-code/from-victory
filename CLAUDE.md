# From Victory — Lead Agent Context

## Mission
A daily-discipline, mental-toughness, and Christian faith app for young
athletes, launching with hockey for ages 11-14. The parent buys, the
young athlete uses: one hockey-themed devotional, one private journal
prompt, and a streak counter. Built on the brand frame that identity
precedes performance — we operate FROM Christ's victory, not toward it.

## Brand Spine
"From Victory" = from Christ's victory (1 Corinthians 15:57, Romans 8:37).
We operate FROM a place of already-won victory, not striving TOWARD it.
Identity precedes performance. An athlete who gets cut, benched, or loses
is still loved and still operating from victory.

All content, copy, and UX reflects this frame. Mental toughness is not
self-reliance. It is resting in identity, then competing freely.

## Founder Context
KC (GitHub: kchan-code). Hockey dad. Building this to a working state,
then recruiting a credible chaplain or sports psychologist advisor.
Reserve 2-5% equity for that advisory hire. The product-strategist
agent flags any feature that needs clinical or theological credibility
we don't yet have.

## Audience

### Primary: young athletes ages 11-14 (U13-U15)
- Serious about their sport. Often training 10+ hours/week.
- Bullshit detectors are sharp. Down-talk loses them immediately.
- Capable of real content, not watered-down kid content.
- Developing both as athletes AND as disciples. Treat them as both.
- Phase 2 extends to ages 15-17 (U16-U18).
- Phase 3: separate B2C product for ages 18-20.

### Secondary: parents (the buyer)
- Evangelical / non-denominational Protestant lean.
- Buys the subscription. Reads the parent dashboard.
- Not the primary user. Doesn't read the devotionals.

### Influencers: coaches, team chaplains, hockey associations
- Distribution channel. Not direct users in MVP.

## Audience language (CRITICAL — applies to ALL agents)

Different contexts require different terms. Keep these straight.

| Context | Term to use | Example |
|---|---|---|
| Athlete-facing content (devotionals, prompts, in-app UI) | "athlete," "young athlete," "player," direct "you" | "When you step on the ice tonight..." |
| Parent-facing copy (dashboard, marketing, onboarding) | "your child," "your athlete," "your kid" | "Track your athlete's daily streak" |
| Legal / data / privacy / COPPA / TOS / RLS policies | "kid," "child," "minor" | "Kid accounts cannot collect email." |

**Do not use "kid," "kiddo," "youngster," or "young person" in any
athlete-facing content.** A serious 13-year-old AAA player does not
see themselves as a kid; calling them one is a credibility leak.

The kids-privacy-officer agent keeps the legal terminology because that's
the regulatory language (COPPA = Children's Online Privacy Protection Act).
That's correct in its domain. Content trio uses "athlete."

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
| content-curator | Orchestrates devotional content; integrates sports-psychologist + youth-pastor outputs into one voice |
| sports-psychologist | Mental skills content (Dweck, Gallwey, Loehr, etc.). Co-author. |
| youth-pastor | Scripture and theological framing (Keller, Lewis). Co-author. |
| qa-reviewer | Playwright E2E, accessibility, smoke tests |
| kids-privacy-officer | COPPA/GDPR-K review on every PR. Has veto. |

Delegate to subagents proactively. Lead orchestrates, doesn't do
everything itself.

The content trio (content-curator + sports-psychologist + youth-pastor)
works together: curator briefs both specialists, they return raw material,
curator integrates into a single devotional in one voice.

## Workflow Rules (NON-NEGOTIABLE)
1. Never edit `main` directly. Every task starts with `git checkout -b feature/<name>`.
2. Commit in small logical units. Conventional commits: feat:, fix:, chore:, test:, docs:.
3. Open a PR for every change. Never merge locally and push. Merge through GitHub UI.
4. CI must pass before merge. Build, typecheck, tests, kids-privacy-officer review.
5. Hotfixes get a hotfix/<name> branch, same flow. No exceptions.

## MVP Scope (locked — kill scope creep ruthlessly)
- Parent signup + Stripe subscription ($8.99/mo or $79/yr)
- Parent creates athlete account (no email for the athlete)
- One daily devotional, hockey-themed, faith-tied (30 days seeded at launch)
- One daily journal prompt (text input, athlete-only readable)
- Streak counter
- Parent dashboard: streak + journal entry count (NOT content)
- Push notifications via Web Push
- One landing page
- COPPA-compliant onboarding for under-13 athletes
- Crisis-resource keyword detection (Option C — see below)

Out of scope for MVP: video, audio narration, community feed, coach view,
team mode, native app wrap, multi-sport expansion, AI-personalized content,
free tier, social sign-in.

## Non-Negotiable Constraints

### Child Safety + Privacy
- Minimal athlete PII: first name, birthdate, parent link. No email, no
  phone, no address, no photos, no long-term IP-derived data.
- COPPA applies to athletes under 13. Verifiable parental consent at
  athlete-account creation. No behavioral analytics, no third-party
  tracking, no ads ever on minor accounts.
- Journal entries are athlete-only readable. RLS enforced at the database
  level.
- Parent dashboard reads metadata (count, dates) from a separate view,
  never journal content.
- kids-privacy-officer reviews every migration and every PR touching user
  data. Block on violations.

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

### Content Voice
- Brand frame: identity → performance. FROM victory.
- Scripture: NIV default. Cite chapter and verse.
- Tone: personal, conversational, real. No churchy jargon without context
  a 13-year-old at a 7th-grade reading level can follow.
- Athlete-facing content uses "athlete" or "you," never "kid."
- Hockey examples for MVP. Underlying content structure is sport-agnostic
  so swapping examples per sport in v2 is trivial.

### COPPA Implementation Specifics
- Birthdate captured at athlete-account creation.
- Under-13 path: verifiable parental consent required (Stripe $0.01 charge
  + refund is the industry-accepted method; confirm with attorney).
- Under-13 accounts: no behavioral analytics, no third-party profiling
  SDKs, no ads, no email collection.
- 13+ minor accounts: still no behavioral analytics on minors, but lighter
  consent flow.
- Parent controls account deletion. Cascading delete of all athlete data
  within 30 days of request.

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
- Server Components by default, Client Components only when interactivity is needed
- Tailwind utility classes inline. No CSS modules unless asked.
- Supabase types generated and committed: `supabase gen types typescript --local`
- Conventional commits enforced
- No `any` type without a `// reason:` comment