# Parallel multi-session development

How to run **several Claude Code sessions at once**, each working a different
Linear `FV-` issue, without tangling the repo. This is the paved path for the
"Orchestration mechanics" rules in `CLAUDE.md` — applied at the *session* level
(you, running N terminals), not just the agent level.

> **Why this exists.** Every bad git tangle traced to one cause: **multiple
> sessions sharing a single working directory.** One session runs `git checkout`
> and yanks the branch out from under another session's in-flight work. A Claude
> session cannot see that another session just switched branches. Physically
> separate them.

---

## The one rule

**One git worktree per session. Never share a checkout.**

```
one directory  ⇄  one branch  ⇄  one session  ⇄  one FV issue
```

Keep the original clone (`~/Claude/FromVictory`) parked on `main` as a clean
reference — you never type work into it. Every FV gets its own sibling worktree.

---

## Starting a session

### The helper (one command)

From the main clone:

```bash
bin/new-fv.sh 7 stripe-checkout          # FV-7, branch feat/fv-7-stripe-checkout
```

It fetches origin, creates `../FromVictory-fv7` on `feat/fv-7-stripe-checkout`
off `origin/main`, runs `npm ci`, and prints the next steps. Skip the install
(content/docs sessions don't need `node_modules`) with `SKIP_INSTALL=1`.

Then:
1. `cd ../FromVictory-fv7`
2. open a session here: `claude`
3. tell it: **"Work FV-7."**
4. move FV-7 → **In Progress** in Linear (so no other session double-grabs it).

### Manual equivalent

```bash
git fetch origin
git worktree add ../FromVictory-fv7 -b feat/fv-7-stripe-checkout origin/main
cd ../FromVictory-fv7 && npm ci
claude
```

---

## What can run in parallel — route by `area:` label

Linear's `area:` labels are the routing system: different area = different files
= safe to run side by side. A clean 3-session slate is one issue each from:

| Area | Touches | Example |
|---|---|---|
| `area:backend` | `supabase/**`, `lib/actions`, `lib/supabase` | FV-7 Stripe |
| `area:content` | `supabase/migrations/**` (SQL seed) | FV-9 days 11–30 |
| `area:frontend` | `apps/web/components`, routes | FV-17 pregame timer |

Three areas, no shared files → three sessions, zero collisions.

## What must serialize — never two sessions at once

- **Backend / the live Supabase DB.** There is ONE remote project
  (`kumrgeosgzdlxgljbyju`). Concurrent migrations corrupt each other. **One
  backend/migration session at a time.**
- **Audio pipeline.** `AUDIO_CACHE_BUST`, `audio-mapping.ts`, committed MP3s, the
  generation script. One audio session at a time.
- **Hot files** (a collision the moment two branches edit them):
  `PracticeFlow.tsx`, `useClipPlayer.ts`, `screens-b.tsx`, `shared.tsx`,
  `types.ts`, `audio-mapping.ts`, **`CLAUDE.md`**, **`package.json` / lockfile**.
- **Dependency chains are not parallel work.** If FV-A blocks FV-B in Linear, do
  A, then B. (E.g. the Basketball cluster: scope-lock → engine-decouple KEYSTONE
  → per-sport content/audio.)

**The check before adding another session:** does the new FV share an `area:`
label or a hot file with a running session? Different area → go. Same area or
shared hot file → set a **Linear dependency** and do it next, not now.

---

## Keeping worktrees in sync (avoid the squash-merge conflict)

Squash-merge is the trap: when a PR squash-merges to `main`, every *other* live
branch now carries duplicate-content commits, and your local `main` ref goes
stale. Counter it:

- **Small, short-lived PRs.** The longer a branch lives, the more `main` drifts.
- **After any merge, resync each active worktree** *before* you push:
  ```bash
  git fetch origin && git rebase origin/main
  ```
- **Always diff against `origin/main`, not local `main`:**
  `git diff origin/main...HEAD`. A worktree's local `main` ref goes stale fast.
- **Don't stack a PR on another that's about to squash-merge.** If you must, the
  post-squash recovery is `git rebase --onto origin/main <old-base> <branch>`
  (replays only your unique commits onto the new `main`).

---

## Shared global state to respect across sessions

- **Linear is the coordinator.** Set an issue *In Progress* before you start it.
  Use dependencies to serialize collisions. Don't have two sessions edit the same
  issue.
- **Vercel:** each PR gets its own preview; `main` **auto-deploys to prod on
  merge** — a merge from session A ships live while session B is still working.
- **Auto-memory** (`MEMORY.md`) is shared across this project's sessions —
  insights persist, but two sessions writing memory can race. Let it settle.

---

## What's enforced vs. what's on you

- **Enforced (FV-45):** *inside* a session, subagents cannot run state-changing
  git — a `PreToolUse` hook blocks it (`.claude/hooks/block-subagent-git.sh`).
  The session lead owns git per worktree; agents return file edits.
- **On you (the human):** the *session-level* discipline — one worktree per
  session, route by `area:`, set Linear deps for collisions, resync on merge. No
  hook can stop you opening two sessions in one folder; that's the habit.

---

## The merge funnel is still you

Parallelism speeds up *building*, not *merging*. Tier-2 work (payments, auth,
RLS, by-ear audio, brand/voice content) gates on KC, and KC clicks merge. Two
levers: lean on **Tier-1 auto-merge** for low-risk work (docs/tests/CI/
content-data) so it doesn't wait, and **batch reviews** instead of
context-switching per PR. Realistic ceiling for a solo founder: **2–4 concurrent
sessions** on genuinely independent areas before review + context-switching
become the bottleneck.

---

## Cleanup (when a PR merges)

```bash
git worktree remove ../FromVictory-fv7
git branch -D feat/fv-7-stripe-checkout      # branch was squash-merged; -D is expected
git fetch --prune                            # drop the deleted remote ref
```

---

## Quick reference

```
START   bin/new-fv.sh <n> <slug>      # worktree + branch + npm ci
            cd ../FromVictory-fv<n> && claude → "Work FV-<n>"
            Linear: FV-<n> → In Progress
PARALLEL  different area: label + no shared hot file
SERIALIZE backend/DB · audio · CLAUDE.md · lockfile · dependency chains
SYNC    after each merge:  git fetch origin && git rebase origin/main
DIFF    git diff origin/main...HEAD          # never local main
DONE    git worktree remove <path> && git branch -D <branch>
CEILING ~2–4 concurrent sessions (the merge funnel is KC)
```
