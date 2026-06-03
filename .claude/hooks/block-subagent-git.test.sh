#!/usr/bin/env bash
# Unit test for block-subagent-git.sh (FV-45).
# Pipes mock PreToolUse payloads to the hook and asserts deny/allow.
# Run: .claude/hooks/block-subagent-git.test.sh   (exit 0 = pass)
set -uo pipefail

HOOK="$(cd "$(dirname "$0")" && pwd)/block-subagent-git.sh"
pass=0; fail=0

# assert <name> <expect: deny|allow> <payload-json>
assert() {
  local name="$1" expect="$2" payload="$3" out
  out="$(printf '%s' "$payload" | "$HOOK" 2>/dev/null || true)"
  local got="allow"
  printf '%s' "$out" | grep -q '"permissionDecision": *"deny"' && got="deny"
  if [ "$got" = "$expect" ]; then
    pass=$((pass+1)); printf '  ok   %-46s [%s]\n' "$name" "$expect"
  else
    fail=$((fail+1)); printf '  FAIL %-46s expected %s, got %s\n' "$name" "$expect" "$got"
  fi
}

SUB='"agent_id":"sub-abc","agent_type":"audio-engineer",'

# Subagent + state-changing git → DENY
assert "subagent git commit"          deny  "{$SUB\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git commit -m x\"}}"
assert "subagent git push"            deny  "{$SUB\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git push -u origin feat/x\"}}"
assert "subagent git checkout -b"     deny  "{$SUB\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git checkout -b feat/y\"}}"
assert "subagent compound && git"     deny  "{$SUB\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"cd apps/web && git stash\"}}"
assert "subagent git -C path checkout" deny "{$SUB\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git -C apps/web checkout main\"}}"
assert "subagent git rebase"          deny  "{$SUB\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git rebase --onto main old HEAD\"}}"

# Subagent + read-only git or non-git → ALLOW
assert "subagent git status"          allow "{$SUB\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git status --short\"}}"
assert "subagent git log"             allow "{$SUB\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git log --oneline -5\"}}"
assert "subagent git diff"            allow "{$SUB\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git diff HEAD\"}}"
assert "subagent npm test"            allow "{$SUB\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"npm run test\"}}"

# Main/lead agent (no agent_id) + state-changing git → ALLOW (lead owns git)
assert "lead git commit (no agent_id)" allow "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git commit -m x\"}}"
assert "lead git push (no agent_id)"   allow "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git push\"}}"
assert "lead empty agent_id"           allow "{\"agent_id\":\"\",\"tool_input\":{\"command\":\"git checkout -b z\"}}"

# Malformed payload → ALLOW (fail open)
assert "unparseable payload"          allow "not json {"

echo ""
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ]
