#!/usr/bin/env bash
# sync-codex.test.sh — generator unit tests (FV-462).
#
# Covers: the T5 sandbox mapping (15 read-only / 4 named writers on the real
# roster; shape behavior on synthetic roots), fail-loud guards (missing tools,
# missing/unterminated frontmatter, folded description scalars), hook
# disposition (no hooks generated), and the pre-existing roster/HR-survival
# guarantees. Zero dependencies; run directly: bin/sync-codex.test.sh
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0

ok()   { PASS=$((PASS + 1)); printf '  ok   %-52s\n' "$1"; }
fail() { FAIL=$((FAIL + 1)); printf '  FAIL %-52s\n' "$1"; }

# Build an isolated synthetic source root with the script installed, so tests
# never touch the real repo. Callers add .claude/agents/*.md then run gen.
make_root() { # prints the new root
  local t
  t="$(mktemp -d)"
  mkdir -p "$t/bin" "$t/.claude/agents" "$t/.claude/skills/from-victory-design"
  cp "$ROOT/bin/sync-codex.sh" "$t/bin/"
  printf '# skill\nSee docs/Claude Design System/README.md\n' \
    > "$t/.claude/skills/from-victory-design/SKILL.md"
  printf '# CLAUDE.md test source\n' > "$t/CLAUDE.md"
  printf '%s' "$t"
}

agent_md() { # $1=dir $2=name $3=tools-line-value
  printf -- '---\nname: %s\ndescription: test agent\ntools: %s\n---\nbody of %s\n' \
    "$2" "$3" "$2" > "$1/.claude/agents/$2.md"
}

# ── 1. Real-roster mapping: 15 read-only / 4 named writers ───────────────────
T="$(mktemp -d)"
mkdir -p "$T/bin"
cp -R "$ROOT/.claude" "$T/.claude"
cp "$ROOT/CLAUDE.md" "$T/CLAUDE.md"
cp "$ROOT/bin/sync-codex.sh" "$T/bin/"
if "$T/bin/sync-codex.sh" > /dev/null 2>&1; then
  ro_count=$(grep -l '^sandbox_mode = "read-only"$' "$T"/.codex/agents/*.toml | wc -l | tr -d ' ')
  [ "$ro_count" = "15" ] && ok "real roster: exactly 15 read-only agents" \
                         || fail "real roster: expected 15 read-only, got $ro_count"
  writer_files=$(grep -L '^sandbox_mode = "read-only"$' "$T"/.codex/agents/*.toml \
    | xargs -n1 basename | sed 's/\.toml$//' | sort | tr '\n' ' ')
  [ "$writer_files" = "audio-engineer backend-engineer frontend-engineer qa-reviewer " ] \
    && ok "real roster: writers are exactly the 4 expected names" \
    || fail "real roster: writer set was [$writer_files]"
else
  fail "real roster: generation failed unexpectedly"
  fail "real roster: writer assertion unreachable"
fi
rm -rf "$T"

# ── 2. Read-only agent gets the override; writer omits it (synthetic) ────────
T="$(make_root)"
agent_md "$T" reader "Read, Glob, Grep"
agent_md "$T" writerly "Read, Glob, Grep, Bash, Edit, Write"
if SYNC_CODEX_EXPECT_WRITERS="writerly" SYNC_CODEX_EXPECT_READONLY_COUNT=1 \
   "$T/bin/sync-codex.sh" > /dev/null 2>&1; then
  grep -q '^sandbox_mode = "read-only"$' "$T/.codex/agents/reader.toml" \
    && ok "synthetic: non-writer gets sandbox_mode read-only" \
    || fail "synthetic: reader missing sandbox_mode"
  grep -q 'sandbox_mode' "$T/.codex/agents/writerly.toml" \
    && fail "synthetic: writer must NOT carry sandbox_mode" \
    || ok "synthetic: writer omits the override (inherits parent)"
else
  fail "synthetic: generation failed unexpectedly"
  fail "synthetic: writer-omission assertion unreachable"
fi
rm -rf "$T"

# ── 3. Missing tools frontmatter fails loud ──────────────────────────────────
T="$(make_root)"
printf -- '---\nname: toolless\ndescription: no tools here\n---\nbody\n' \
  > "$T/.claude/agents/toolless.md"
out="$("$T/bin/sync-codex.sh" 2>&1)" && fail "guard: missing tools should fail" \
  || { printf '%s' "$out" | grep -q "no parseable single-line 'tools:'" \
       && ok "guard: missing tools fails loud" \
       || fail "guard: missing tools failed without the expected message"; }
rm -rf "$T"

# ── 4. Empty tools frontmatter fails loud ────────────────────────────────────
T="$(make_root)"
printf -- '---\nname: emptytools\ndescription: d\ntools:\n---\nbody\n' \
  > "$T/.claude/agents/emptytools.md"
"$T/bin/sync-codex.sh" > /dev/null 2>&1 && fail "guard: empty tools should fail" \
  || ok "guard: empty tools fails loud"
rm -rf "$T"

# ── 5. Writer-set mismatch fails loud (unexpected writer) ────────────────────
T="$(make_root)"
agent_md "$T" sneaky-writer "Read, Edit"
"$T/bin/sync-codex.sh" > /dev/null 2>&1 && fail "assert: unexpected writer should fail" \
  || ok "assert: unexpected writer fails the mapping assertion"
rm -rf "$T"

# ── 6. Read-only count mismatch fails loud ───────────────────────────────────
T="$(make_root)"
agent_md "$T" lone-reader "Read, Glob, Grep"
SYNC_CODEX_EXPECT_WRITERS="" SYNC_CODEX_EXPECT_READONLY_COUNT=2 \
  "$T/bin/sync-codex.sh" > /dev/null 2>&1 && fail "assert: reader-count mismatch should fail" \
  || ok "assert: read-only count mismatch fails loud"
rm -rf "$T"

# ── 7. Hook disposition: nothing hook-shaped is generated ────────────────────
T="$(make_root)"
agent_md "$T" solo "Read, Glob, Grep"
if SYNC_CODEX_EXPECT_WRITERS="" SYNC_CODEX_EXPECT_READONLY_COUNT=1 \
   "$T/bin/sync-codex.sh" > /dev/null 2>&1; then
  [ ! -e "$T/.codex/hooks.json" ] && [ ! -d "$T/.codex/hooks" ] \
    && ok "disposition: no hooks.json and no .codex/hooks generated" \
    || fail "disposition: hook artifacts were generated"
else
  fail "disposition: generation failed unexpectedly"
fi
rm -rf "$T"

# ── 8. Retirement: stale generated hook files are removed in-place ───────────
T="$(make_root)"
agent_md "$T" solo "Read, Glob, Grep"
mkdir -p "$T/.codex/hooks"
printf 'stale\n' > "$T/.codex/hooks.json"
printf 'stale\n' > "$T/.codex/hooks/block-subagent-git.sh"
printf 'stale\n' > "$T/.codex/hooks/block-subagent-git.test.sh"
printf 'stale\n' > "$T/.codex/hooks/privacy-review-reminder.sh"
if SYNC_CODEX_EXPECT_WRITERS="" SYNC_CODEX_EXPECT_READONLY_COUNT=1 \
   "$T/bin/sync-codex.sh" > /dev/null 2>&1; then
  [ ! -e "$T/.codex/hooks.json" ] && [ ! -d "$T/.codex/hooks" ] \
    && ok "retirement: stale hook files removed in-place" \
    || fail "retirement: stale hook files survived"
else
  fail "retirement: generation failed unexpectedly"
fi
rm -rf "$T"

# ── 9. Pre-existing guards still fire (regression) ───────────────────────────
T="$(make_root)"
printf 'no frontmatter\n' > "$T/.claude/agents/bad.md"
"$T/bin/sync-codex.sh" > /dev/null 2>&1 && fail "regression: missing frontmatter should fail" \
  || ok "regression: missing frontmatter still fails loud"
rm -rf "$T"

T="$(make_root)"
printf -- '---\nname: hr\ndescription: d\ntools: Read\n---\nline one\n\n---\n\nafter hr\n' \
  > "$T/.claude/agents/hr.md"
if SYNC_CODEX_EXPECT_WRITERS="" SYNC_CODEX_EXPECT_READONLY_COUNT=1 \
   "$T/bin/sync-codex.sh" > /dev/null 2>&1; then
  grep -q -- '^---$' "$T/.codex/agents/hr.toml" && grep -q 'after hr' "$T/.codex/agents/hr.toml" \
    && ok "regression: markdown horizontal rule survives in body" \
    || fail "regression: horizontal rule was swallowed"
else
  fail "regression: HR generation failed unexpectedly"
fi
rm -rf "$T"

echo
echo "  $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
