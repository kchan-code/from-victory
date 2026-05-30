---
description: Branch, commit, push, and open a PR for the current working changes — the From Victory release flow in one step.
argument-hint: [optional short description of the change]
---

Run the From Victory PR/release flow for the current working-tree changes.
Optional context from the user: `$ARGUMENTS`

Follow the project workflow rules in CLAUDE.md (never edit main directly,
conventional commits, PR for every change, merge through the GitHub UI). Do
this efficiently — most of it is one pass of Bash calls.

## Steps

1. **Survey.** `git status --short` + `git --no-pager diff --stat`. Identify what
   changed and infer the conventional-commit type (feat/fix/chore/test/docs) and
   scope. If `$ARGUMENTS` is given, use it to shape the subject. If nothing is
   staged or modified, stop and say so.

2. **Branch.** If on `main`, create a branch named for the change
   (`feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `hotfix/<slug>`). If already on
   a feature branch, stay on it.

3. **Commit.** Stage the relevant files (don't blindly `git add -A` if there are
   unrelated untracked files — the repo intentionally keeps `docs/` working files
   untracked). Write a real conventional-commit message: a tight subject line and
   a body explaining what + why. End with the Co-Authored-By trailer per the
   harness git rules.

4. **Audio guard.** If any committed `*.mp3` changed, confirm `AUDIO_CACHE_BUST`
   in `apps/web/components/pregame/audio-mapping.ts` was bumped in this change;
   if not, bump it before committing.

5. **Verify (fast gates).** From `apps/web/`: `npm run typecheck` and
   `npm run lint`. Run `npm run build` too if the change touches runtime React /
   routing / server actions. Don't push if a gate is red — fix first.

6. **Push + PR.** `git push -u origin <branch>`, then `gh pr create` with a clear
   title (the commit subject) and a body covering What / Why / Verify. Use the
   markdown PR-body conventions and the 🤖 trailer.

7. **Privacy gate.** If the diff touches any of `apps/web/**`, `supabase/**`,
   `packages/content/**`, `.claude/agents/**`, `CLAUDE.md`, or `docs/brand.md`,
   invoke the **kids-privacy-officer** subagent against the branch diff and post
   its verdict as a PR comment (CLAUDE.md workflow rule #6). The
   privacy-review-reminder hook will also nudge you after `gh pr create`.

8. **Hand off.** Report the PR URL and what still needs the user: merging via the
   GitHub UI (their call, not yours), and any prod-only verification. Do NOT merge
   locally. After they confirm merge, offer to sync `main` and delete the branch.

Keep the user in the loop with the PR link and a one-line summary of what shipped.
