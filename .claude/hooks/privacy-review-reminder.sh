#!/usr/bin/env bash
# PostToolUse(Bash) hook — From Victory privacy gate.
#
# After a `gh pr create`, if the PR's branch diff touches privacy-sensitive
# paths, inject a reminder so the kids-privacy-officer review is never forgotten
# (CLAUDE.md workflow rule #6). It only nudges — the actual review + PR comment
# is done by the assistant (or /ship). Manual privacy review while pre-MVP.
#
# Reads the hook payload as JSON on stdin; prints a PostToolUse
# hookSpecificOutput.additionalContext object on stdout when it should fire.
set -euo pipefail

payload="$(cat)"

# Parse with python3 (no jq dependency). Pull command + cwd on separate calls
# so spaces in the command don't get word-split.
CMD="$(printf '%s' "$payload" | python3 -c 'import sys,json; ti=json.load(sys.stdin).get("tool_input",{}) or {}; print((ti.get("command","") or "").replace(chr(10)," "))' 2>/dev/null || true)"
CWD="$(printf '%s' "$payload" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("cwd","") or "")' 2>/dev/null || true)"

case "$CMD" in
  *"gh pr create"*) ;;
  *) exit 0 ;;
esac

repo="${CLAUDE_PROJECT_DIR:-$CWD}"
# Prefer a local main ref; fall back to origin/main so the gate still fires in
# a fresh/detached checkout that has no local main.
base="main"
git -C "$repo" rev-parse --verify --quiet main >/dev/null 2>&1 || base="origin/main"
files="$(git -C "$repo" diff --name-only "${base}...HEAD" 2>/dev/null || true)"

if printf '%s\n' "$files" | grep -qE '^(apps/web/|supabase/|packages/content/|\.claude/agents/|CLAUDE\.md|docs/brand\.md)'; then
  python3 -c '
import json
msg = ("PRIVACY GATE (CLAUDE.md rule #6): this PR touches privacy-sensitive "
       "paths (apps/web, supabase, packages/content, .claude/agents, CLAUDE.md, "
       "or docs/brand.md). Before merge, invoke the kids-privacy-officer subagent "
       "against the branch diff and post its verdict as a PR comment for the audit "
       "trail.")
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PostToolUse",
        "additionalContext": msg,
    }
}))
'
fi
exit 0
