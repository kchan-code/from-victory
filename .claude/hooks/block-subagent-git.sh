#!/usr/bin/env bash
# PreToolUse(Bash) hook — From Victory subagent git guard (FV-45).
#
# Subagents must NOT run state-changing git. The LEAD owns all git
# (branch/commit/push/checkout/stash/rebase/merge); subagents return their file
# edits to the lead, which integrates and commits. This replaces the
# instruction-only control ("the brief said don't") that repeatedly failed and
# tangled the repo. See CLAUDE.md → "Agent Orchestration → Orchestration
# mechanics".
#
# Mechanism: the PreToolUse payload carries `agent_id` ONLY for SUBAGENT tool
# calls; it is empty/absent for the main (lead) agent. We deny when
# (agent_id present) AND (command is a state-changing git op). Read-only git
# (status/log/diff/show/branch --list, etc.) is left alone.
#
# Fails OPEN: any parse problem or a missing `agent_id` → allow. The guard can
# therefore never block the lead, and at worst becomes a no-op if the harness
# payload schema ever changes (the lead-owns-git policy + worktree isolation are
# the primary controls; this is the mechanical backstop).
#
# Reads the JSON payload on stdin. On a blocked call, prints a PreToolUse
# hookSpecificOutput with permissionDecision:"deny" on stdout; otherwise silent.
set -euo pipefail

payload="$(cat)"

python3 - "$payload" <<'PY'
import json, re, sys

try:
    data = json.loads(sys.argv[1])
except Exception:
    sys.exit(0)  # unparseable → allow (fail open)

# Subagent calls carry a non-empty agent_id; the main/lead agent does not.
agent_id = (data.get("agent_id") or "").strip()
if not agent_id:
    sys.exit(0)  # lead → allow

cmd = ((data.get("tool_input") or {}).get("command") or "")

# State-changing git subcommands. Permits intervening flags (e.g. `git -C path`,
# `git -c k=v`) between `git` and the subcommand, and matches anywhere in a
# compound command (`cd x && git commit ...`). Read-only git is not listed.
MUTATE = (
    r"\bgit\b(?:\s+-[^\s]+(?:\s+[^\s-][^\s]*)?)*\s+"
    r"(commit|push|checkout|switch|branch|stash|reset|rebase|merge|cherry-pick)\b"
)
if re.search(MUTATE, cmd):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                "Subagents must not run state-changing git (commit/push/checkout/"
                "switch/branch/stash/reset/rebase/merge/cherry-pick). Return your "
                "file edits to the lead — the lead owns all git. "
                "See CLAUDE.md → Agent Orchestration → Orchestration mechanics."
            ),
        }
    }))
sys.exit(0)
PY
