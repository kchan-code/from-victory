#!/usr/bin/env bash
# sync-codex.sh — deterministic generator for the committed Codex mirror
# (FV-432; enforcement model revised by FV-462).
#
# Sources of truth (Claude side, canonical)  →  Generated targets (Codex side):
#   CLAUDE.md                                →  AGENTS.md
#   .claude/agents/<name>.md                 →  .codex/agents/<name>.toml
#   .claude/skills/from-victory-design/SKILL.md
#                                            →  .agents/skills/from-victory-design/SKILL.md
#   (template in this script)                →  .codex/README.md
#
# Claude-side hooks are intentionally NOT mirrored (FV-462): the harnesses use
# different enforcement mechanisms. See "Enforcement model" in .codex/README.md.
#
# Sanctioned transformations (the ONLY differences allowed; see .codex/README.md):
#   T1  CLAUDE.md            → AGENTS.md
#   T2  .claude/             → .codex/          (lowercase)
#   T3  "Claude Code session"→ "Codex session"
#   T4  design-system path is NOT renamed — docs/Claude Design System/ is the
#       real directory and stays verbatim.
#   T5  agent .md → .toml: frontmatter name/description → TOML keys; body →
#       developer_instructions with T1-T3 applied. tools: maps to the Codex
#       sandbox: agents whose tools include neither Edit nor Write generate
#       `sandbox_mode = "read-only"`; Edit/Write agents omit the override and
#       inherit the parent workspace-write sandbox. Claude `model:` is DROPPED —
#       never translated into guessed Codex model names.
#   T6  hooks are NOT mirrored (harness-specific enforcement — FV-462). The
#       Codex boundary is the documented workspace-write sandbox (protected
#       read-only paths .git/.codex/.agents) plus per-agent sandbox_mode; the
#       Claude boundary remains .claude/hooks/** (untouched by this script).
#
# Modes:
#   bin/sync-codex.sh           regenerate the mirror in place
#   bin/sync-codex.sh --check   regenerate to a temp dir, diff against the
#                               working tree, exit non-zero on any drift
#
# Never edit AGENTS.md, .codex/**, or .agents/** by hand — edit the Claude-side
# source and re-run this script. `.hash` (untracked, provenance unknown) is
# intentionally not generated, read, or touched.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-generate}"

# Sandbox-mapping expectations (FV-462). Overridable ONLY for the test harness
# (bin/sync-codex.test.sh); production runs use the defaults. Adding a new
# Edit/Write agent or changing the roster size is a deliberate governance event:
# update these expectations consciously in the same PR.
EXPECTED_WRITERS="${SYNC_CODEX_EXPECT_WRITERS-audio-engineer
backend-engineer
frontend-engineer
qa-reviewer}"
EXPECTED_READONLY_COUNT="${SYNC_CODEX_EXPECT_READONLY_COUNT-15}"

# T1-T3. T4 is deliberately absent (real path kept). Order-independent: the
# three patterns cannot overlap (case-sensitive, distinct tokens).
transform() {
  sed -e 's|\.claude/|.codex/|g' \
      -e 's|CLAUDE\.md|AGENTS.md|g' \
      -e 's|Claude Code session|Codex session|g'
}

# Refuse to embed bodies that would corrupt a TOML multiline basic string.
toml_hazard_check() { # $1=file
  if grep -q '"""' "$1" || grep -q '\\' "$1"; then
    echo "ERROR: $1 contains \"\"\" or a backslash — TOML embedding would corrupt it." >&2
    echo "Extend sync-codex.sh with proper escaping before syncing this file." >&2
    exit 1
  fi
}

# Fail loud on agent .md shapes the parser cannot represent faithfully
# (qa-reviewer findings, PR #379): missing frontmatter would silently produce
# an empty agent; YAML folded/literal description scalars would leak '>'/'|'.
frontmatter_guard() { # $1=file
  if [ "$(head -1 "$1")" != "---" ]; then
    echo "ERROR: $1 does not start with '---' frontmatter — refusing to generate an empty agent." >&2
    exit 1
  fi
  if ! awk 'NR>1 && /^---$/ {found=1; exit} END {exit found?0:1}' "$1"; then
    echo "ERROR: $1 has an unterminated frontmatter block." >&2
    exit 1
  fi
  if awk 'fm<2 && /^---$/ {fm++; next} fm==1 && /^description:[ ]*[>|]/ {found=1; exit} END {exit found?0:1}' "$1"; then
    echo "ERROR: $1 uses a YAML folded/literal description scalar (>|) — unsupported; use plain indented continuation lines." >&2
    exit 1
  fi
}

# T5 sandbox mapping (FV-462): read the single-line `tools:` frontmatter field.
# Fails loud when the field is missing or empty — a Claude agent without an
# explicit tools list cannot be mapped to a Codex sandbox faithfully.
tools_of() { # $1=file → prints the tools list
  local line
  line="$(awk 'fm<2 && /^---$/ {fm++; next} fm==1 && /^tools:/ {sub(/^tools:[ ]*/, ""); print; found=1; exit} END {exit found?0:1}' "$1")" || {
    echo "ERROR: $1 has no parseable single-line 'tools:' frontmatter field — cannot map a Codex sandbox_mode." >&2
    exit 1
  }
  if [ -z "$line" ]; then
    echo "ERROR: $1 has an empty 'tools:' frontmatter field — cannot map a Codex sandbox_mode." >&2
    exit 1
  fi
  printf '%s' "$line"
}

# True (exit 0) when the tools list grants write capability. Word-boundary
# match so a hypothetical tool named e.g. "Editor" would not silently count.
is_writer() { # $1=tools list
  printf '%s' "$1" | grep -qE '(^|[, ])(Edit|Write)($|[, ])'
}

generate_into() { # $1 = destination root
  local out="$1"
  mkdir -p "$out/.codex/agents" "$out/.agents/skills/from-victory-design"

  # ── AGENTS.md ────────────────────────────────────────────────────────────
  transform < "$ROOT/CLAUDE.md" > "$out/AGENTS.md"

  # ── .codex/agents/*.toml (one per .claude/agents/*.md, sorted) ──────────
  local md name desc tools body_file
  local writers="" readers="" reader_count=0
  for md in "$ROOT"/.claude/agents/*.md; do
    name="$(basename "$md" .md)"
    toml_hazard_check "$md"
    frontmatter_guard "$md"
    tools="$(tools_of "$md")"

    # frontmatter description: the `description:` line plus indented
    # continuation lines, joined and whitespace-squeezed.
    desc="$(awk '
      /^---$/ { fm++; next }
      fm == 1 && /^description:/ { grab = 1; sub(/^description:[ ]*/, ""); buf = $0; next }
      fm == 1 && grab && /^[a-z_]+:/ { grab = 0 }
      fm == 1 && grab { sub(/^[ ]+/, ""); buf = buf " " $0 }
      END { print buf }
    ' "$md")"
    # escape TOML basic-string specials in the description
    desc="${desc//\\/\\\\}"
    desc="${desc//\"/\\\"}"

    # body: everything after the SECOND --- only (a bare --- inside the body
    # is a markdown horizontal rule and must survive — qa-reviewer finding),
    # leading blank lines stripped, T1-T3 applied.
    body_file="$(mktemp)"
    awk 'fm < 2 && /^---$/ { fm++; next } fm >= 2 { print }' "$md" \
      | sed '/./,$!d' | transform > "$body_file"

    {
      printf 'name = "%s"\n' "$name"
      printf 'description = "%s"\n' "$desc"
      if is_writer "$tools"; then
        writers="${writers}${name}"$'\n'
      else
        # No Edit/Write on the Claude side → mechanically read-only on Codex.
        printf 'sandbox_mode = "read-only"\n'
        readers="${readers}${name}"$'\n'
        reader_count=$((reader_count + 1))
      fi
      printf 'developer_instructions = """\n'
      cat "$body_file"
      printf '"""\n'
    } > "$out/.codex/agents/$name.toml"
    rm -f "$body_file"
  done

  # ── sandbox-mapping assertions (FV-462): fail loud on any deviation ──────
  local expected_sorted actual_sorted
  expected_sorted="$(printf '%s\n' "$EXPECTED_WRITERS" | sed '/^$/d' | sort)"
  actual_sorted="$(printf '%s' "$writers" | sed '/^$/d' | sort)"
  if [ "$expected_sorted" != "$actual_sorted" ]; then
    echo "SANDBOX MAPPING MISMATCH: Edit/Write agents differ from the expected writer set." >&2
    diff <(printf '%s\n' "$expected_sorted") <(printf '%s\n' "$actual_sorted") >&2 || true
    echo "If a writer agent was legitimately added/removed, update EXPECTED_WRITERS in bin/sync-codex.sh in the same PR." >&2
    exit 1
  fi
  if [ "$reader_count" -ne "$EXPECTED_READONLY_COUNT" ]; then
    echo "SANDBOX MAPPING MISMATCH: expected $EXPECTED_READONLY_COUNT read-only agents, generated $reader_count." >&2
    echo "If the roster legitimately changed, update EXPECTED_READONLY_COUNT in bin/sync-codex.sh in the same PR." >&2
    exit 1
  fi

  # ── hooks: intentionally NOT mirrored (FV-462) ───────────────────────────
  # The copied block-subagent-git.sh could not work on Codex (documented
  # PreToolUse payload has no agent_id; the script fails open without it), and
  # the privacy reminder is superseded by the REQUIRED privacy-verdict CI gate
  # (FV-460). Retire any previously generated hook files in-place so --check
  # (which regenerates fresh) stays in agreement.
  rm -f "$out/.codex/hooks.json" \
        "$out/.codex/hooks/block-subagent-git.sh" \
        "$out/.codex/hooks/block-subagent-git.test.sh" \
        "$out/.codex/hooks/privacy-review-reminder.sh"
  rmdir "$out/.codex/hooks" 2>/dev/null || true

  # ── design skill (T4: real path preserved, so this is a near-verbatim copy)
  transform < "$ROOT/.claude/skills/from-victory-design/SKILL.md" \
    > "$out/.agents/skills/from-victory-design/SKILL.md"

  # ── README documenting the mechanism ─────────────────────────────────────
  cat > "$out/.codex/README.md" <<'README'
# Codex mirror — generated configuration (FV-432, enforcement model FV-462)

Everything in `.codex/`, `.agents/`, and the root `AGENTS.md` is **generated**
by `bin/sync-codex.sh` from the Claude-side sources of truth. Never edit these
files directly — edit the source and re-run the script:

| Source (canonical)                              | Target (generated)                              |
|-------------------------------------------------|--------------------------------------------------|
| `CLAUDE.md`                                      | `AGENTS.md`                                      |
| `.claude/agents/<name>.md`                       | `.codex/agents/<name>.toml`                      |
| `.claude/skills/from-victory-design/SKILL.md`    | `.agents/skills/from-victory-design/SKILL.md`    |
| template inside `bin/sync-codex.sh`              | this README                                      |

## Sanctioned transformations

- **T1** `CLAUDE.md` → `AGENTS.md` (self-references, including inside agent bodies)
- **T2** `.claude/` → `.codex/` (lowercase)
- **T3** "Claude Code session" → "Codex session"
- **T4** the design-system path is **not** renamed — `docs/Claude Design System/`
  is the real directory and stays verbatim
- **T5** agent conversion: frontmatter `name`/`description` → TOML keys; body →
  `developer_instructions` (TOML multiline basic string) with T1–T3 applied.
  `tools:` maps to the Codex sandbox (see "Enforcement model" below): no
  Edit/Write → `sandbox_mode = "read-only"`; Edit/Write → no override
  (inherits the parent workspace-write mode). Claude `model:` is dropped and
  is NEVER translated into guessed Codex model names.
- **T6** Claude-side hooks are intentionally **not** mirrored. The two
  harnesses use different enforcement mechanisms by design — see below.

No other differences between source and mirror are permitted; `--check`
enforces this (and CI runs it on every PR — the "Codex mirror sync check" job).

## Enforcement model (FV-461 discovery → FV-462)

The two harnesses enforce the same From Victory rules through different,
harness-native mechanisms — intentionally:

- **Claude Code:** `.claude/hooks/block-subagent-git.sh` (PreToolUse) blocks
  subagent git state changes; proven by its test suite and live behavior.
  That hook is Claude-specific: its subagent discriminator (`agent_id` in the
  PreToolUse payload) does not exist in Codex's documented PreToolUse schema,
  so a copy of it on the Codex side would silently fail open. It is therefore
  NOT copied here.
- **Codex:** the documented `workspace-write` sandbox is the mechanical
  boundary — `.git`, `.codex`, and `.agents` are recursively read-only
  protected paths, so no agent (lead or subagent) can mutate git state from
  inside the sandbox. On top of that, the 15 custom agents whose Claude
  definitions grant no Edit/Write tool are generated with
  `sandbox_mode = "read-only"`; the 4 implementation agents (audio-engineer,
  backend-engineer, frontend-engineer, qa-reviewer) inherit the parent
  workspace-write mode so they can edit files — but still cannot touch the
  protected paths.
- **Lead git flow on Codex:** in-sandbox `.git` writes are blocked for the
  lead too; the exact approval-path behavior for lead-authorized git
  operations is recorded per the FV-462 live validation (see the FV-462
  Linear issue for the 4-cell matrix and its results).
- **Out of posture:** dangerous/full-access mode bypasses the sandbox
  entirely and is UNSUPPORTED for From Victory subagent work. A sandbox
  denial is a sandbox denial — it does not indicate any hook fired.
- **Privacy review:** the authoritative mechanical control is the REQUIRED
  `privacy-verdict` CI check (FV-460), which covers the canonical paths AND
  this mirror (`AGENTS.md`, `.codex/agents/**`). The Claude-side advisory
  reminder hook is not mirrored: its output contract is unproven on Codex and
  the CI gate supersedes its function.

## Verifying / re-running

```
bin/sync-codex.sh          # regenerate in place
bin/sync-codex.sh --check  # exit non-zero if the committed mirror has drifted
bin/sync-codex.test.sh     # generator unit tests (mapping, guards, disposition)
```

`--check` also runs the roster assertion (every `.claude/agents/*.md` has
exactly one `.codex/agents/*.toml`, 1:1 by name, no strays) and the sandbox
mapping assertion (exactly the 4 named writer agents; exactly 15 read-only).

## `.hash`

An untracked root file `.hash` (contents `808e3331`, mtime 2026-06-22) has
unknown provenance — it is NOT generated by this script, NOT committed
(root `.gitignore` ignores it), and must not be regenerated or interpreted
until its producer is identified (KC decision, 2026-07-20).
README
}

roster_assert() { # $1 = generated root
  local src tgt
  src="$(ls "$ROOT"/.claude/agents/*.md | xargs -n1 basename | sed 's/\.md$//' | sort)"
  tgt="$(ls "$1"/.codex/agents/*.toml | xargs -n1 basename | sed 's/\.toml$//' | sort)"
  if [ "$src" != "$tgt" ]; then
    echo "ROSTER MISMATCH between .claude/agents and generated .codex/agents:" >&2
    diff <(echo "$src") <(echo "$tgt") >&2 || true
    return 1
  fi
  echo "roster OK: $(echo "$src" | wc -l | tr -d ' ') agents, 1:1 by name"
}

case "$MODE" in
  generate)
    generate_into "$ROOT"
    roster_assert "$ROOT"
    echo "Codex mirror regenerated at $ROOT"
    ;;
  --check)
    TMP="$(mktemp -d)"
    trap 'rm -rf "$TMP"' EXIT
    generate_into "$TMP"
    roster_assert "$TMP"
    drift=0
    diff -r "$TMP/AGENTS.md" "$ROOT/AGENTS.md" || drift=1
    diff -r "$TMP/.codex" "$ROOT/.codex" || drift=1
    diff -r "$TMP/.agents" "$ROOT/.agents" || drift=1
    if [ "$drift" -ne 0 ]; then
      echo "DRIFT: committed Codex mirror does not match regeneration from sources." >&2
      echo "Run bin/sync-codex.sh and commit the result." >&2
      exit 1
    fi
    echo "check OK: mirror matches sources"
    ;;
  *)
    echo "usage: bin/sync-codex.sh [--check]" >&2
    exit 2
    ;;
esac
