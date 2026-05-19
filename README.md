# From Victory

A daily-discipline, mental-toughness, and Christian faith app for youth athletes — launching with hockey (U13–U15). Parent buys, kid uses. Identity precedes performance: we operate **from** Christ's victory, not toward it (1 Corinthians 15:57, Romans 8:37).

See [CLAUDE.md](./CLAUDE.md) for full mission, scope, and non-negotiable constraints (COPPA, journal safety, content voice).

## Tech stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, TypeScript strict
- **Mobile delivery:** PWA (no native iOS/Android in MVP)
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Payments:** Stripe Billing
- **Hosting:** Vercel (auto-deploy from `main`)

## Repo layout

```
from-victory/
├── apps/web/             # Next.js app
├── packages/content/     # Devotionals + exercises (sport-agnostic JSON)
├── supabase/             # Migrations + seed
└── .github/workflows/    # CI gates (build, typecheck, test, lint, kids-privacy-officer)
```

## Prerequisites

- **Node.js 20+** (see `.nvmrc`)
- **npm 10+** (ships with Node 20)

## Setup

```bash
git clone <repo-url> from-victory
cd from-victory
nvm use            # optional, picks up .nvmrc
npm install
cp apps/web/.env.example apps/web/.env.local
```

## Common commands

Run from the repo root:

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Start the Next.js dev server on `:3000`       |
| `npm run build`    | Production build of the web app               |
| `npm run typecheck`| Run `tsc --noEmit` against `apps/web`         |
| `npm run lint`     | Run `next lint`                               |
| `npm test`         | Run tests across workspaces (when present)    |

## Workflow rules

These are non-negotiable. See [CLAUDE.md](./CLAUDE.md) for the full version.

1. Never edit `main` directly. Branch off with `feature/<name>` or `hotfix/<name>`.
2. Commit in small logical units. Conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`.
3. Every change goes through a PR. Merge through the GitHub UI.
4. CI must pass before merge — build, typecheck, tests, kids-privacy-officer review.

## Child safety

This product serves minors. Journal entries are kid-only readable, enforced at the database level via Supabase RLS. The parent dashboard reads metadata only. No third-party analytics or ad SDKs on minor accounts, ever. Every PR that touches user data, auth, journal entries, migrations, or third-party SDKs is reviewed by the `kids-privacy-officer` subagent in CI.

If you're contributing: read the relevant sections of [CLAUDE.md](./CLAUDE.md) before opening a PR.
