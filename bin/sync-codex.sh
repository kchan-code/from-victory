#!/usr/bin/env bash
# sync-codex.sh — deterministic generator for the committed Codex mirror (FV-432).
#
# Sources of truth (Claude side, canonical)  →  Generated targets (Codex side):
#   CLAUDE.md                                →  AGENTS.md
#   .claude/agents/<name>.md                 →  .codex/agents/<name>.toml
#   .claude/hooks/*.sh                       →  .codex/hooks/*.sh   (byte copy)
#   .claude/skills/from-victory-design/SKILL.md
#                                            →  .agents/skills/from-victory-design/SKILL.md
#   (template in this script)                →  .codex/hooks.json
#   (template in this script)                →  .codex/README.md
#
# Sanctioned transformations (the ONLY differences allowed; see .codex/README.md):
#   T1  CLAUDE.md            → AGENTS.md
#   T2  .claude/             → .codex/          (lowercase)
#   T3  "Claude Code session"→ "Codex session"
#   T4  design-system path is NOT renamed — docs/Claude Design System/ is the
#       real directory and stays verbatim.
#   T5  agent .md → .toml: frontmatter name/description → TOML keys; body →
#       developer_instructions with T1-T3 applied. frontmatter tools:/model:
#       are DROPPED (no known Codex equivalent — documented loss).
#   T6  hooks byte-copied; hooks.json uses repo-relative hook paths.
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

generate_into() { # $1 = destination root
  local out="$1"
  mkdir -p "$out/.codex/agents" "$out/.codex/hooks" \
           "$out/.agents/skills/from-victory-design"

  # ── AGENTS.md ────────────────────────────────────────────────────────────
  transform < "$ROOT/CLAUDE.md" > "$out/AGENTS.md"

  # ── .codex/agents/*.toml (one per .claude/agents/*.md, sorted) ──────────
  local md name desc body_file
  for md in $(ls "$ROOT"/.claude/agents/*.md | sort); do
    name="$(basename "$md" .md)"
    toml_hazard_check "$md"

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

    # body: everything after the closing ---, leading blank lines stripped,
    # T1-T3 applied.
    body_file="$(mktemp)"
    awk '/^---$/ { fm++; next } fm >= 2 { print }' "$md" \
      | sed '/./,$!d' | transform > "$body_file"

    {
      printf 'name = "%s"\n' "$name"
      printf 'description = "%s"\n' "$desc"
      printf 'developer_instructions = """\n'
      cat "$body_file"
      printf '"""\n'
    } > "$out/.codex/agents/$name.toml"
    rm -f "$body_file"
  done

  # ── hooks: byte-identical copies ─────────────────────────────────────────
  local h
  for h in "$ROOT"/.claude/hooks/*.sh; do
    cp "$h" "$out/.codex/hooks/$(basename "$h")"
    chmod +x "$out/.codex/hooks/$(basename "$h")"
  done

  # ── hooks.json: repo-relative paths (T6) ─────────────────────────────────
  # NOTE: earlier local mirrors used machine-absolute paths. Relative paths
  # are the committable form; if a Codex session shows hooks NOT firing,
  # see .codex/README.md ("hooks.json paths") before changing anything.
  cat > "$out/.codex/hooks.json" <<'JSON'
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "'.codex/hooks/block-subagent-git.sh'"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "'.codex/hooks/privacy-review-reminder.sh'"
          }
        ]
      }
    ]
  }
}
JSON

  # ── design skill (T4: real path preserved, so this is a near-verbatim copy)
  transform < "$ROOT/.claude/skills/from-victory-design/SKILL.md" \
    > "$out/.agents/skills/from-victory-design/SKILL.md"

  # ── README documenting the mechanism ─────────────────────────────────────
  cat > "$out/.codex/README.md" <<'README'
# Codex mirror — generated configuration (FV-432)

Everything in `.codex/`, `.agents/`, and the root `AGENTS.md` is **generated**
by `bin/sync-codex.sh` from the Claude-side sources of truth. Never edit these
files directly — edit the source and re-run the script:

| Source (canonical)                              | Target (generated)                              |
|-------------------------------------------------|--------------------------------------------------|
| `CLAUDE.md`                                      | `AGENTS.md`                                      |
| `.claude/agents/<name>.md`                       | `.codex/agents/<name>.toml`                      |
| `.claude/hooks/*.sh`                             | `.codex/hooks/*.sh` (byte-identical)             |
| `.claude/skills/from-victory-design/SKILL.md`    | `.agents/skills/from-victory-design/SKILL.md`    |
| template inside `bin/sync-codex.sh`              | `.codex/hooks.json`, this README                 |

## Sanctioned transformations

- **T1** `CLAUDE.md` → `AGENTS.md` (self-references, including inside agent bodies)
- **T2** `.claude/` → `.codex/` (lowercase)
- **T3** "Claude Code session" → "Codex session"
- **T4** the design-system path is **not** renamed — `docs/Claude Design System/`
  is the real directory and stays verbatim
- **T5** agent conversion: frontmatter `name`/`description` → TOML keys; body →
  `developer_instructions` (TOML multiline basic string) with T1–T3 applied.
  **Known loss:** frontmatter `tools:` and `model:` are dropped — the deployed
  Codex agent format observed in production carries no equivalent keys, so
  Codex agents run without the Claude-side tool/model restrictions. If Codex
  gains support for them, extend T5 rather than hand-editing TOMLs.
- **T6** hooks are byte-copies; `hooks.json` uses **repo-relative** hook paths
  so the file is identical on every machine.

No other differences between source and mirror are permitted; `--check`
enforces this.

## Verifying / re-running

```
bin/sync-codex.sh          # regenerate in place
bin/sync-codex.sh --check  # exit non-zero if the committed mirror has drifted
```

`--check` also runs the roster assertion (every `.claude/agents/*.md` has
exactly one `.codex/agents/*.toml`, 1:1 by name, no strays).

## hooks.json paths

Earlier (pre-FV-432) local mirrors hardcoded machine-absolute hook paths.
The committed file uses repo-relative paths — the only form that is identical
across machines. **If a Codex session's hooks do not fire** (test: a Codex
subagent running a state-changing `git` command should be blocked), the
relative paths are the first suspect: run the hook directly to confirm it
works, then raise it with KC before reintroducing absolute paths (they cannot
be committed; they would drift per machine).

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
