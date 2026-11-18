# Contributing

The full PR process (branching, PR template, review order, privacy gate) is in
`CLAUDE.md`. This file covers merge gates that need a specific comment format.

## Cross-model review marker

The `cross-model-review` commit status (published by
`.github/workflows/cross-model-review.yml`) stays red until the PR has a
comment from **@kchan-code** recording a clean review of the PR's current head
commit by a model from a different family than the one that wrote the code:

```
CROSS-MODEL-REVIEW: CLEAN
REVIEWER-MODEL: gpt-5.6-sol-high
CODER-MODEL: claude-opus-5-5
Head: 0123456789abcdef0123456789abcdef01234567
```

- Each `KEY: value` must be on its own line (no bold, no trailing text).
- The comment must contain the PR's **full 40-character head SHA**. A new push
  changes the head SHA, so the status goes red again until a new marker naming
  the new SHA is posted.
- Model family comes from the model id after removing an optional provider
  prefix (`xai/`, `anthropic/`, `openai/`, `google/`) and an optional `cursor-`
  prefix. The id must then be a family name, alone or followed by `-`:
  `claude`, `grok`, `gpt` or `codex` (one family), `gemini`. For example,
  `cursor-grok-4.6-high` and `xai/grok-4.7` are both grok. Any id that does not
  classify (for example `composer-2.5`, or `openai/claude-…` where the provider
  contradicts the name) fails the gate. Reviewer and coder must be in different
  families.
- If several markers name the same SHA, the newest wins, so a later
  non-`CLEAN` marker (for example `CROSS-MODEL-REVIEW: ISSUES`) blocks again.
  Markers posted in the same second are ordered by comment id; if they still
  cannot be ordered, the gate fails.
- Any comment on the PR (posting, editing, or deleting a marker) re-evaluates
  the status in place. No re-run is needed.
- Dependabot PRs are exempt only when the PR was opened by `dependabot[bot]`
  and every commit on it, including the head commit, is authored by
  `dependabot[bot]`, committed by `dependabot[bot]` or `web-flow` (the
  committer GitHub records on commits it signs, which is what Dependabot's
  commits show), and has a signature GitHub reports as `valid`. A human author
  or committer on any commit removes the exemption.

### Changes to the gate only take effect after merge

The job that publishes the status runs the gate script from `main`, never from
the PR. It is triggered by `pull_request_target` and `issue_comment` (both run
the workflow file from `main`) and checks out `main` explicitly. Editing
`.github/scripts/cross-model-review.cjs` or the workflow in a PR therefore
changes nothing for that PR; the PR's own copy only runs in the read-only
`cross-model-review logic unit tests` job.

**Bootstrap.** The PR that first adds this workflow cannot be gated by it,
because `main` does not have the workflow yet, so no `cross-model-review` status
is posted on that PR. Check it by hand from a checkout of the PR branch
(read-only, needs `gh`):

```bash
PR=675
SHA=$(gh pr view "$PR" --json headRefOid -q .headRefOid)
gh api --paginate --slurp "repos/kchan-code/from-victory/issues/$PR/comments" \
  | node -e 'const { decide } = require("./.github/scripts/cross-model-review.cjs"); let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => console.log(decide({ headSha: process.argv[1], comments: JSON.parse(s).flat() })));' "$SHA"
```

After it merges, post or edit any comment on an open PR to confirm the status
appears, then make `cross-model-review` a required status check. Making it
required before the merge would block the bootstrap PR, which never gets the
status.

**Known limit: the status can be forged by a same-repo PR.** Anyone who can
push a branch to this repository can add or edit a workflow that runs on
`pull_request` and posts a green `cross-model-review` status (or a job with that
name) on their own PR. The required check would then pass with no marker.
GitHub Actions cannot prevent this, and this gate does not detect it. A green
`cross-model-review` is therefore not proof of a review on any PR that changes
`.github/workflows/**`: open the PR's comments and confirm the marker yourself
before merging such a PR.
