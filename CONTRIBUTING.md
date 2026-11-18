# Contributing

The full PR process (branching, PR template, review order, privacy gate) is in
`CLAUDE.md`. This file covers merge gates that need a specific comment format.

## Cross-model review marker

The `cross-model-review` check (`.github/workflows/cross-model-review.yml`)
fails until the PR has a comment from **@kchan-code** recording a clean review
of the PR's current head commit by a model from a different family than the
one that wrote the code:

```
CROSS-MODEL-REVIEW: CLEAN
REVIEWER-MODEL: gpt-5.6-sol-high
CODER-MODEL: claude-opus-5-5
Head: 0123456789abcdef0123456789abcdef01234567
```

- Each `KEY: value` must be on its own line (no bold, no trailing text).
- The comment must contain the PR's **full 40-character head SHA**. A new push
  changes the head SHA, so the check fails again until a new marker naming the
  new SHA is posted.
- Model family comes from the id prefix: `claude-*`, `grok-*`, `gpt-*` or
  `codex*` (one family), `gemini-*`, and everything else is `other`. Reviewer
  and coder must be in different families; two `other` ids count as the same
  family.
- If several markers name the same SHA, the newest one wins, so a later
  non-`CLEAN` marker (for example `CROSS-MODEL-REVIEW: ISSUES`) blocks again.
- Posting, editing, or deleting a marker re-runs the check automatically.
- Dependabot PRs are exempt.
