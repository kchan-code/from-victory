#!/usr/bin/env bash
# new-fv.sh — spin up an isolated git worktree for one Linear FV issue, so each
# Claude Code session works on its own checkout/branch. See docs/parallel-sessions.md.
#
# Usage:
#   bin/new-fv.sh <number> <slug> [type]
#     <number>  the FV issue number (digits)        e.g. 7
#     <slug>    short kebab-case slug                e.g. stripe-checkout
#     [type]    branch type prefix (default: feat)   e.g. fix | chore | feat
#
#   SKIP_INSTALL=1 bin/new-fv.sh 9 days-11-30-content   # skip `npm ci` (content/docs)
#
# Creates  ../<repo>-fv<number>  on branch  <type>/fv-<number>-<slug>  off
# origin/main, runs `npm ci` (unless SKIP_INSTALL), and prints next steps.
# One worktree per session — never share a checkout.
set -euo pipefail

usage() { echo "usage: bin/new-fv.sh <number> <slug> [type=feat]   (SKIP_INSTALL=1 to skip npm ci)" >&2; exit 2; }
[ "$#" -ge 2 ] || usage
num="$1"; slug="$2"; type="${3:-feat}"

[[ "$num"  =~ ^[0-9]+$        ]] || { echo "error: <number> must be digits (the FV issue number)"   >&2; exit 1; }
[[ "$slug" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "error: <slug> must be lowercase kebab-case"        >&2; exit 1; }
[[ "$type" =~ ^(feat|fix|chore|docs|test|refactor)$ ]] || { echo "error: <type> must be one of feat|fix|chore|docs|test|refactor" >&2; exit 1; }

# Must be inside the repo. Always anchor the new worktree to the MAIN worktree
# (first entry of `git worktree list`), so naming is consistent no matter which
# worktree this is run from.
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "error: not inside the git repo" >&2; exit 1; }
main_wt="$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
parent="$(dirname "$main_wt")"
base="$(basename "$main_wt")"

branch="${type}/fv-${num}-${slug}"
wt="${parent}/${base}-fv${num}"

[ -e "$wt" ] && { echo "error: worktree path already exists: $wt" >&2; exit 1; }
if git show-ref --verify --quiet "refs/heads/${branch}"; then
  echo "error: branch already exists: ${branch}" >&2; exit 1
fi

echo "→ git fetch origin --prune"
git -C "$main_wt" fetch origin --prune

echo "→ git worktree add ${wt}  (${branch} off origin/main)"
git -C "$main_wt" worktree add "$wt" -b "$branch" origin/main

if [ "${SKIP_INSTALL:-0}" = "1" ]; then
  echo "→ skipping npm ci (SKIP_INSTALL=1)"
else
  echo "→ npm ci  (in $wt)"
  ( cd "$wt" && npm ci )
fi

cat <<EOF

✓ worktree ready
    path:   $wt
    branch: $branch

next:
  1) cd "$wt"
  2) start a session here:   claude
  3) tell it:                Work FV-${num}.
  4) Linear:                 move FV-${num} → In Progress (so no other session grabs it)

when the PR merges:
  git worktree remove "$wt" && git branch -D "$branch" && git fetch --prune
EOF
