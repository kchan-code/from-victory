---
description: Branch, commit, push, and open a PR for the current working changes — the From Victory release flow in one step.
argument-hint: [optional short description of the change]
---

Run the From Victory PR/release flow for the current working-tree changes.
Optional context from the user: `$ARGUMENTS`

Follow the project workflow rules in CLAUDE.md (never edit main directly,
conventional commits, PR for every change, merge through the GitHub UI). Do
this efficiently — most of it is one pass of Bash calls.

Config lives in CLAUDE.md → **Project Workflow Config** (verify commands, privacy
paths, branch form, project guards). Read it; don't hardcode.

## Steps

0. **Read the issue.** If `$ARGUMENTS` contains a Linear issue id (e.g. `FV-12`),
   or one is inferable from the current branch name, fetch it via the Linear MCP
   (`get_issue`). Echo its **acceptance criteria** and **non-goals** before doing
   anything — these seed the PR template's *Acceptance criteria checked* and
   *Intentionally not done* sections. If no issue id is present, proceed but note
   "No issue — <reason>" for the PR's Linear-issue field.

1. **Survey.** `git status --short` + `git --no-pager diff --stat`. Identify what
   changed and infer the conventional-commit type (feat/fix/chore/test/docs) and
   scope. Check the diff for changes that escaped the issue's scope. If
   `$ARGUMENTS` shapes the subject, use it. If nothing is staged/modified, stop.

2. **Branch.** If on `main`, create a branch in the configured form
   (`<type>/fv-<n>-<slug>` so Linear auto-links). If on a feature branch, stay.

3. **Commit.** Stage the relevant files (don't blindly `git add -A` if there are
   unrelated untracked files — the repo intentionally keeps `docs/` working files
   untracked). Write a real conventional-commit message with the issue id in the
   subject (`feat(scope): … (FV-12)`); body explains what + why. End with the
   Co-Authored-By trailer per the harness git rules.

4. **Project guards.** Run any guards in CLAUDE.md → Project Workflow Config →
   Project-specific guards (e.g. for From Victory: if a committed `*.mp3` changed,
   bump `AUDIO_CACHE_BUST`).

5. **Verify (narrowest useful).** Run the Verify commands from Project Workflow
   Config — fast gates always; full gates only when the change touches
   runtime/routing/server-actions/schema. Prefer the narrowest command for the
   files touched. If a broad check is known-red for unrelated reasons (e.g. the
   Preview Supabase env gap), record that for the PR body rather than blocking.
   Don't push if a relevant gate is red — fix first.

6. **Push + PR.** `git push -u origin <branch>`, then `gh pr create`. The body
   MUST fill `.github/pull_request_template.md` completely: pull *Acceptance
   criteria* + the `Closes FV-###` line from Step 0; populate *Agent involvement*
   from which subagents were invoked this session; attach the preview URL (or say
   why N/A); for any deferred scope, file a follow-up Linear issue via `save_issue`
   and link it under *Follow-up issues created*. Title carries the issue id.

7. **Review gate.** Run the review gate from Project Workflow Config: general
   `/review` (issue-scoped) → if the diff touches a Privacy-sensitive path,
   invoke **kids-privacy-officer** → post each verdict as a PR comment (3-group
   format) for the audit trail. The privacy-review-reminder hook also nudges
   after `gh pr create`.

8. **Merge per tier (CLAUDE.md → Merge Authority & Risk Tiers).** If the PR is
   **Tier 1** and auto-merge is enabled, `gh pr merge --auto` (merges itself on
   green CI + clean reviews — don't wait on KC). **NEVER issue `gh pr merge
   --auto` on a PR that touches a Privacy-sensitive path until kids-privacy-
   officer has posted `VERDICT: APPROVED` — such PRs are Tier-2 until then (the
   Privacy-override hard rule).** If **Tier 2**, hand off: report
   the PR URL + what needs KC (the merge is their call), and any prod-only
   verification. Never merge a Tier-2 PR yourself. After merge, offer to sync
   `main` and delete the branch.

Keep the user in the loop with the PR link and a one-line summary of what shipped.
