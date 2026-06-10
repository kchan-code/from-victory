# From Victory

A daily-discipline, mental-toughness, and Christian faith app for athletes ages 13-21 — launching with hockey and basketball. Parent buys, athlete uses. Identity precedes performance: we operate **from** Christ's victory, not toward it (Hebrews 12:1-2).

See [CLAUDE.md](./CLAUDE.md) for full mission, scope, and non-negotiable constraints (minor data protection, journal safety, content voice).

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
├── supabase/             # Migrations
└── .github/              # CI gates (build, typecheck, lint, audio-cache-bust, privacy-verdict)
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
# Edit .env.local and fill in Supabase + Stripe values (see comments in the file).
```

Start the local Supabase stack ([Supabase CLI](https://supabase.com/docs/guides/cli) required):

```bash
supabase start                    # starts local Postgres, Auth, Studio
supabase db push                  # apply all migrations
supabase gen types typescript --local > apps/web/lib/supabase/database.types.ts
```

For local Stripe webhook testing ([Stripe CLI](https://docs.stripe.com/stripe-cli) required):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the printed whsec_... value into STRIPE_WEBHOOK_SECRET in .env.local
```

For end-to-end tests:

```bash
cp apps/web/.env.test.example apps/web/.env.test.local
# Fill in the test credentials before running npm test
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
4. CI must pass before merge — build, typecheck, tests, `privacy-verdict` status check.

## Child safety

This product serves minors (13-17). Journal entries are athlete-only readable, enforced at the database level via Supabase RLS. The parent dashboard reads metadata only. No third-party analytics or ad SDKs on minor accounts, ever (California AADC / GDPR-K compliance floor). Every PR touching user data, auth, journal, migrations, or third-party SDKs is reviewed by the `kids-privacy-officer` subagent; the `privacy-verdict` required CI check enforces an explicit `VERDICT: APPROVED` before merge.

If you're contributing: read the relevant sections of [CLAUDE.md](./CLAUDE.md) before opening a PR.
