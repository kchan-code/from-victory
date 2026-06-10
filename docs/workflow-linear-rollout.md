# Default Workflow → Linear Rollout — Implementation Plan

Status: **APPROVED-PLAN, NOT YET EXECUTED.** Nothing in this doc has been written
to the repo or to Linear. This is the approve-then-execute package for rolling
KC's "Default Workflow" (Linear-issue-driven dev + PR/Review standards) into
From Victory and, portably, across all vibecoding projects.

Produced 2026-05-31 via a 4-agent analysis workflow (repo-gap · Linear-loop ·
portability → synthesis).

---

## Decisions (locked 2026-05-31)

- **Execution:** HOLD. Save the plan first; execute on a later explicit go.
- **Scope leash:** **Advisory first.** Reviewers FLAG over-scope and log it in the
  PR's "Intentionally not done" + "Follow-up issues created" fields; they do NOT
  block an over-scoped PR. Revisit tightening to enforced if scope-creep persists.
- **Seed issues:** **All ~18** (across all 4 milestones) when the Linear writes happen.
- **Adopted defaults (recommended, not overridden):** one Linear Project per repo +
  4 milestones, **no cycles**; the built-in `/review` skill as the issue-scoped
  reviewer; branch form `<type>/fv-<n>-<slug>`.
- **Merge mechanism: (a) GitHub auto-merge** (locked 2026-05-31). Tier-1 PRs use
  `gh pr merge --auto` and merge themselves once CI is green + required reviews
  pass — KC is off the critical path for low-risk work. PREREQUISITE (KC, in
  GitHub UI): enable Settings → General → "Allow auto-merge", and ensure the
  `main` ruleset's required status checks are set so auto-merge waits for CI.
- **Parallel-velocity levers (added 2026-05-31):** the workflow now also encodes the
  three things that actually deliver parallel velocity (Linear alone does not) —
  a **merge-authority / risk-tier policy** (stop being the merge funnel for low-risk
  work), **stream-boundary rules** (route concurrent streams to non-colliding areas),
  and **Discovery vs Delivery modes** (don't let issue-scoping kill exploratory arcs).
  See §3b B6–B8 and §8. **One open sub-decision for KC:** how much merge authority to
  delegate (GitHub auto-merge vs lead-merges-Tier-1 vs keep all merges manual).

---

## 1. TL;DR

- **Add the missing traceability layer.** From Victory already has strong
  engineering discipline (branch-off-main, conventional commits, PR-per-change,
  narrow verify gates, 9-agent orchestration + privacy veto) but zero issue
  traceability and no PR contract. This bolts a Linear-issue → branch → PR →
  auto-transition loop and a 10-section PR template onto that spine — not a rebuild.
- **3 new artifacts, 3 edits.** New: `.github/pull_request_template.md`, an
  `## Issue-Scoped Workflow` block and `## PR Review Standard` block in `CLAUDE.md`.
  Edited: `ship.md` (Linear-aware + template-aware), and one-line review-format
  notes in `qa-reviewer.md` + `kids-privacy-officer.md`.
- **Reconcile the real tension (advisory).** "Review against the linked issue ONLY /
  no opportunistic refactor" collides with the 9-agent "large arcs from small
  requests" habit. Resolution: qa-reviewer + kids-privacy-officer stay mandatory
  cross-cutting vetoes (their scope expansion is "severe" by definition); the
  general issue-scoped `/review` owns the default-case linked-issue-only pass;
  deferred scope becomes follow-up Linear issues logged in the PR. **Advisory, not
  blocking**, per the locked decision.
- **Linear is a clean slate.** The "From Victory" team exists with default states
  (`In Review` + `Done` already present — auto-transitions work with zero new
  states), 3 default labels, no projects/milestones/cycles.
- **Portable.** PR template + the two CLAUDE.md prose blocks are byte-identical
  across repos; everything project-specific collapses into one
  `## Project Workflow Config` block. Ship as a copy-in `vibe-workflow-kit`.

---

## 2. Gap summary — satisfied vs. real gaps

| Spec area | Already satisfied | Real gap |
|---|---|---|
| Before editing | `ship.md` surveys git status; CLAUDE.md encodes current patterns | No Linear issue read; acceptance criteria / non-goals not first-class |
| While editing | Style/architecture/naming + test-when-logic-changes covered | No diff-scope discipline rule (distinct from product scope-creep); collides with "large arcs" habit |
| Before PR | Narrow verify (typecheck/lint always, build only when runtime touched); audio guard | **No PR template exists**; ship.md emits ad-hoc What/Why/Verify (3 fields vs. 10) |
| PR Standard | What/Why + weak agent trailer | 7 of 10 fields absent: Linear issue, AC checked, screenshots/preview, Risk, Intentionally-not-done, Agent involvement (as section), Follow-ups |
| PR Review Standard | Two reviewer agents w/ structured verdicts; severity ladder ≈ 3 groups | Neither uses the exact 3-group format; neither reviews "against linked issue only"; "bad abstractions / loading-error states / future-agent maintainability" have no owner |
| Verification | Closest to spec; narrow-by-default already | No "known-broken broad check → say so plainly" convention (the Vercel Preview env gap is exactly this) |

**One-liner:** the engineering hygiene is already there; what's missing is the
*issue contract* at the front and the *PR contract* at the back, plus a named
format for the review in the middle.

---

## 3. The artifacts (ready to drop in)

### (a) `.github/pull_request_template.md` — full text

```markdown
<!-- vibe-workflow-kit v1.0.0 -->
<!--
PR Standard — fill every section. Delete a section only if you write why it
does not apply (e.g. "Risk: none — docs only"). Empty sections fail review.
-->

## What changed
<!-- The actual change, in plain language. One or two sentences. -->

## Why
<!-- The problem or goal. Link the reasoning, not just the symptom. -->

## Linear issue
<!-- Use the magic word so Linear auto-links and transitions on merge.
     "Closes FV-12". Use "Part of FV-12" for one of several PRs on a big issue. -->
Closes FV-

## Acceptance criteria checked
<!-- Copy each criterion from the Linear issue and check it off. If one is
     intentionally deferred, move it to "Intentionally not done" and say why. -->
- [ ]
- [ ]

## Screenshots / Loom / preview URL
<!-- Required for any user-visible change. Before/after for UI. Paste the
     Vercel/preview URL. "N/A — no UI change" is valid. If preview is known
     broken (e.g. Preview env gap), say so here. -->

## Risk
<!-- What could break, blast radius, rollback. "Low — additive only" is fine if
     true. Call out data migrations, auth, payments, RLS/permissions explicitly. -->

## How to test
<!-- Exact steps a reviewer runs. Commands + click-path. If a broad check is
     known-red for unrelated reasons, say so and list the targeted checks that
     DID pass for the code you touched. -->

## Intentionally not done
<!-- Scope you deliberately left out, and why. This is where the "large arc"
     instinct gets logged instead of bloating the diff. -->

## Agent involvement
<!-- Which agents/subagents touched this and for what (author, review, content,
     privacy). "None — hand-written" is valid. -->

## Follow-up issues created
<!-- Linear issues filed for deferred work or things you noticed but did not fix.
     Link them. "None" is valid. -->
```

### (b) `CLAUDE.md` additions

**B1 — new `## Issue-Scoped Workflow`** (insert after `## Workflow Rules (NON-NEGOTIABLE)`):

```markdown
## Issue-Scoped Workflow

Every change is scoped to one Linear issue. The issue is the contract — the
diff should match it and nothing else. (For a trivial mechanical change with no
issue, state that in the PR's Linear-issue field as "No issue — <reason>".)

**Before editing.** Read the Linear issue, the linked spec, and the existing
files you are about to touch. Restate the acceptance criteria and the non-goals
in your own words. Check how the codebase already solves this kind of problem
before introducing a new pattern (grep first). Run `git status` so you do not
disturb unrelated work in progress (the repo intentionally keeps `docs/` working
files untracked).

**While editing.** Implement only the stated acceptance criteria. Do not change
unrelated files. Do not refactor opportunistically. Preserve existing behavior
unless the issue explicitly changes it. Follow existing code style, architecture,
naming, and UI conventions. Add or update tests when the change affects logic,
data flow, permissions, integrations, or user-visible behavior. Scope you are
tempted to add becomes a follow-up issue, not a bigger diff.

**Before opening a PR.** Run the narrowest useful checks for the files you
touched (see Project Workflow Config → Verify). Review the full diff for changes
that escaped the issue's scope. Confirm the PR description follows
`.github/pull_request_template.md` — every section filled.

**Verification discipline.** Use the narrowest useful verification command for
the task. If a broad check (full build, whole test suite, Vercel Preview) is
already known to be red for reasons unrelated to your change — e.g. the Preview
Supabase env gap — say so plainly in the PR's How-to-test / Risk and list the
targeted checks that DID pass for the code you touched.

**Branch + issue linkage.** Branch names contain the Linear issue id so Linear
auto-links the PR: `<type>/fv-<n>-<slug>` (e.g. `feat/fv-12-stripe-checkout`).
PR title carries the id: `feat(pregame): wire Stripe checkout (FV-12)`. PR body
carries the magic word `Closes FV-12`. Opening the PR moves the issue to
In Review; merging it moves the issue to Done — no manual status change needed.
```

**B2 — new `## PR Review Standard`** (insert after `## Issue-Scoped Workflow`):

```markdown
## PR Review Standard

Review the PR against the linked Linear issue **only**. The question is "does
this correctly and safely deliver this issue?" — not "what else could be better
here?"

Look for: acceptance-criteria gaps, bugs, broken data flow, unnecessary scope
expansion, security issues, bad abstractions, missing loading/error states, and
code that will be hard for a future agent to modify safely.

Do **not** suggest unrelated improvements unless they are severe (a real bug, a
security hole, data loss, a privacy/RLS regression). Drive-by refactor
suggestions are noise.

Return feedback in exactly three groups:

1. **Must fix before merge** — blocks merge. Bugs, security, AC not met,
   data-flow breaks, privacy/RLS regressions.
2. **Should fix soon** — not a blocker; file a follow-up Linear issue. Tech debt,
   missing edge-case handling, weak tests.
3. **Safe to merge** — observations and nits the author may take or leave.

**Scope-leash mode: ADVISORY.** An over-scoped PR (diff exceeds the linked
issue's acceptance criteria) is FLAGGED in group 2 and the extra scope is logged
in the PR's "Intentionally not done" / "Follow-up issues created" fields — it is
NOT blocked on scope alone. (Revisit tightening to blocking if scope-creep
persists.)

**Two reviewer tiers.** qa-reviewer and kids-privacy-officer are mandatory
cross-cutting gates: they review against global standards (regression/a11y/test
pyramid; minor-data-protection + RLS) and MAY exceed issue scope, because a
safety, privacy, or regression finding is "severe" by definition and belongs in
group 1. The general issue-scoped review (the default-case `/review` pass) is
the one bound strictly to the linked issue's AC. Both map output onto the three
groups. The privacy veto is never suppressed to satisfy "issue-scoped only."
```

**B3 — append to `## Agent Orchestration` "Rules of the road":**

```markdown
- **Specialist invocation does not license scope expansion.** Invoking a
  specialist (content trio, frontend, backend, audio) returns work scoped to the
  current issue's acceptance criteria. Anything the specialist surfaces beyond
  that becomes a follow-up Linear issue logged in the PR's "Intentionally not
  done" / "Follow-up issues created" fields — not extra commits in this diff.
```

**B4 — add rule 7 to `## Workflow Rules (NON-NEGOTIABLE)`:**

```markdown
7. Every PR fills `.github/pull_request_template.md` completely. The Linear-issue
   field uses a magic word (`Closes FV-###`); the branch name contains the issue
   id so Linear auto-links and auto-transitions In Review → Done.
```

**B5 — new `## Project Workflow Config`** (the portability seam; insert before `## Open Items`). The ONLY per-repo block:

```markdown
## Project Workflow Config
<!-- vibe-workflow-kit v1.0.0 — the ONLY per-project block. Prose sections above
     are identical across repos; edit values here only. -->

- **Default branch:** `main`
- **App path(s):** `apps/web`
- **Linear team:** From Victory (`9fdb8aa8-8b16-4f44-9ce0-0ace088c4ae1`)
- **Issue-id prefix:** `FV`
- **Branch naming:** `<type>/fv-<n>-<slug>` e.g. `feat/fv-12-stripe-checkout`
- **Verify — fast gates (always), from `apps/web/`:** `npm run typecheck`, `npm run lint`
- **Verify — full (runtime / routing / server-action / schema changes):** `npm run build` (+ `npm test` when tests cover the path)
- **Verify — narrowest:** prefer a single test file or `tsc` on touched paths over the whole suite.
- **Review gate (before merge):** general `/review` (issue-scoped) → qa-reviewer → kids-privacy-officer (if privacy path) → merge via GitHub UI
- **Privacy-sensitive paths (trigger kids-privacy-officer):** `apps/web/**`, `supabase/**`, `.claude/agents/**`, `CLAUDE.md`, `docs/brand.md`
- **Project-specific guards:** if any committed `*.mp3` changed, bump `AUDIO_CACHE_BUST` in `apps/web/components/pregame/audio-mapping.ts`
- **Agent roster:** see `## Subagents` and `## Agent Orchestration` in this file.
```

**B6 — new `## Merge Authority & Risk Tiers`** (the "stop being the funnel" policy):

```markdown
## Merge Authority & Risk Tiers

The goal is to keep KC off the critical path for low-risk work and reserve his
attention for high-stakes calls. Every PR is one of two tiers.

**Tier 1 — auto/lead merge (no KC gate).** Merges as soon as CI is green AND the
issue-scoped `/review` is clean AND (if it touches a privacy path) kids-privacy-
officer is clean. No waiting on KC. Tier 1 = work that CI + the gates fully
verify and that can't quietly harm a user:
  - docs, tests, CI/infra, isolated chores/dependency bumps
  - content-DATA additions that pass `playlist-integrity` / schema guards
  - isolated bug fixes with a regression test, in a single non-hot file
  - anything labeled `tier:auto`

**Tier 2 — KC-gated (explicit approval before merge).** Waits for KC:
  - payments/Stripe, auth, RLS, DB migrations (`supabase/**`)
  - by-ear audio quality calls (`area:audio` quality, not asset plumbing)
  - athlete-facing brand/voice CONTENT, or any product-scope change
  - any privacy/clinical finding ≥ HIGH, or a public/marketing surface
  - anything labeled `kc-gate`

**Mechanism (KC's open sub-decision).** This repo uses GitHub rulesets + merge-
via-UI, so today the lead CANNOT merge. To actually remove KC as the Tier-1 gate,
pick one: (a) enable **GitHub auto-merge** (PR merges itself when CI green +
required reviews pass), (b) grant the lead `gh pr merge` rights for Tier-1 PRs
only, or (c) keep all merges manual (status quo — KC stays the funnel). Default
until KC chooses: (c). The policy above is inert without (a) or (b).
```

**B7 — new `## Stream Boundaries & Parallel Work`** (so concurrent streams don't collide):

```markdown
## Stream Boundaries & Parallel Work

Parallel streams only go faster if they don't fight over the same files. Route
concurrent work accordingly.

**Independent areas — safe to run concurrent streams:**
  - audio clip generation + `components/pregame/audio/clips.ts` + clip assets
  - `supabase/migrations/**` (backend/schema)
  - `.github/**` + CI (infra)
  - `docs/**`

**Collision-prone hot files — serialize, do NOT parallelize:**
  - `components/pregame/screens-b.tsx`, `useClipPlayer.ts`, `PracticeFlow.tsx`
  - `components/pregame/shared.tsx`, `types.ts`, `audio-mapping.ts`
  - `CLAUDE.md`, `package.json` / lockfile
  (proven by the #71/#73/#74 branch tangles + the vitest/playwright lockfile conflict.)

**Rules.** Route concurrent Linear issues to independent areas. When two issues
touch the same hot file, set a Linear dependency (one blocks the other) and run
them sequentially — do not open two branches on the same hot file. As the app
grows, invest in subsystem boundaries (e.g. isolate the pregame audio engine
behind a stable interface) to convert today's hot files into independent modules
— that conversion, not the tracker, is what raises the parallelism ceiling.
```

**B8 — add to `## Issue-Scoped Workflow` (a Modes note):**

```markdown
**Two modes — name which one you're in.**
- **Delivery (default):** issue-scoped, tight diffs, parallelizable. All the
  rules above apply.
- **Discovery / spike:** explicit + time-boxed exploration to figure out WHAT to
  build (e.g. a "should we re-architect X?" arc). The issue-scoped diff rules
  relax, but the DELIVERABLE is a set of well-formed Linear issues — not a merged
  multi-PR arc that bypassed tracking. Discovery ends by filing issues; delivery
  then executes them. Don't let issue-scoping suppress valuable exploration, and
  don't let exploration ship straight to main untracked.
```

### (c) Edits to `.claude/commands/ship.md`

- **New Step 0 — "Read the issue."** If `$ARGUMENTS` contains a Linear issue id, or
  one is inferable from the branch name, fetch it via the Linear MCP `get_issue`.
  Echo the acceptance criteria + non-goals before surveying the diff. These seed
  the PR template's *Acceptance criteria checked* + *Intentionally not done*. If
  no issue id, proceed but note "No issue" for the PR body.
- **Step 2 (branch):** branch name must contain the issue id — `<type>/fv-<n>-<slug>`.
- **Step 4 (audio guard):** replace the hardcoded `AUDIO_CACHE_BUST` paragraph with
  "Run any project-specific guards listed in `CLAUDE.md` → Project Workflow Config."
- **Step 5 (verify):** replace hardcoded commands with "Run the Verify commands
  from Project Workflow Config. Fast gates always; full only when the change
  touches runtime/routing/server-actions/schema. Narrowest useful command. If a
  broad check is known-red for unrelated reasons, record that for the PR body."
- **Step 6 (PR body):** "Fill `.github/pull_request_template.md` completely. Pull
  *Acceptance criteria* + the `Closes FV-###` line from Step 0; populate *Agent
  involvement* from subagents invoked this session; attach the preview URL (or say
  why not); file follow-up Linear issues via `save_issue` for deferred scope and
  link them under *Follow-up issues created*."
- **Step 7 (privacy gate):** "If the diff touches any Privacy-sensitive path in
  Project Workflow Config, invoke the configured review gate (`/review` →
  qa-reviewer → kids-privacy-officer)."

Everything else (survey, conventional commits, push, never-merge-locally) stays.

### (d) Agent-def one-line notes

- **`qa-reviewer.md`** — under Output format: "Map your verdict onto the PR Review
  Standard's three groups: BLOCK → (1) Must fix before merge, SUGGEST_REVISION →
  (2) Should fix soon, APPROVED → (3) Safe to merge. Where a linked Linear issue
  is supplied, check its acceptance criteria first; flag any AC gap as group 1."
- **`kids-privacy-officer.md`** — under Output format: "Map severity onto the three
  groups: CRITICAL/HIGH → (1) Must fix before merge, MEDIUM → (2) Should fix soon,
  LOW/clean → (3) Safe to merge. Keep the CI-parseable `VERDICT:` line and the
  veto. As a cross-cutting safety gate you MAY exceed the linked issue's scope;
  privacy/RLS findings are severe by definition."

---

## 4. Linear setup for From Victory

**Team:** From Victory (`9fdb8aa8-8b16-4f44-9ce0-0ace088c4ae1`). States already
include `In Review` + `Done` → no new states.

**Project:** `From Victory — MVP` (state: In Progress). One project per repo.

**Milestones (project milestones, not cycles):**
- **M0 — Workflow bootstrap** (do first; makes every other issue runnable)
- **M1 — Payments & Access** (the headline MVP gap)
- **M2 — Content Complete** (days 11-30, goalie scenarios, 13-15 sign-off)
- **M3 — Pre-GA Hardening** (security debt, deletion follow-ups, Next 15)
- **M4 — Polish & Debt** (frontend P1/P2, timer leak, clip Phase 5)

**Labels (keep the 3 defaults Bug/Feature/Improvement, add):**
- *Type:* `Chore`, `Content`, `Security`, `Privacy`
- *Area:* `area:frontend`, `area:backend`, `area:audio`, `area:content`, `area:infra`
- *Gate:* `needs-privacy-review`, `needs-clinical-signoff`, `blocked`

**Issue template** (Team → Templates): Outcome / Context-Why / Acceptance
Criteria / Non-Goals / Spec-Links / Agent-Specialist / Verification — stable
headings so `get_issue` parses reliably.

**Seed issue list (ALL ~18, per locked decision — create on go):**

*M0 — Workflow bootstrap*
- **`Add .github/pull_request_template.md`** — Chore, area:infra, **High**. ← FIRST; everything depends on it.
- `Bake branch/PR Linear conventions into CLAUDE.md + /ship` — Chore, area:infra, High.
- `Configure Linear↔GitHub integration + labels + issue template` — Chore, area:infra, High (manual setup).
- `Relay second beta-tester issue` — placeholder, priority TBD (KC holding).

*M1 — Payments & Access*
- `Stripe payments — parent signup + subscription` — Feature, area:backend, needs-privacy-review, **Urgent** (likely splits).
- `Middleware matcher: exclude /api/webhooks` — Bug, area:backend, **Urgent** (prereq, must merge before any Stripe webhook PR).
- `deleteAccount must cancel Stripe subscription before deleting parent` — Bug, area:backend, needs-privacy-review, High.

*M2 — Content Complete*
- `Days 11-30 daily training content` — Content, area:content, High.
- `Goalie-specific adversity scenarios` — Content, area:content, Medium.
- `13-15 goal-fusion / clinical sign-off` — Improvement, area:content, needs-clinical-signoff, Medium.
- `Quarterly safety-keyword vocab review` — Privacy, area:content, needs-clinical-signoff, Low.

*M3 — Pre-GA Hardening*
- `Pre-GA security hardening bundle` — Security, area:backend, needs-privacy-review, High (rate-limit /pair + /signin, HMAC device cookie, log-retention TTL, `__Host-` prefix).
- `Account-deletion durable audit table + rate limiting` — Security, area:backend, needs-privacy-review, High.
- `PR-06 journal hardening` — Improvement, area:backend, Medium (length cap + composite index).
- `Next 14 → 15 upgrade` — Security, area:infra, Medium.

*M4 — Polish & Debt*
- `Pregame text-mode timer leak` — Bug, area:frontend, Medium (same intervalRef leak fixed in #74, still in pregame).
- `Frontend P1/P2 backlog` — Improvement, area:frontend, Medium (split as picked up).
- `Clip engine Phase 5: retire baked session-*.mp3` — Chore, area:audio, Low.
- `Git LFS for audio assets` — Chore, area:infra, Low.
- `Multi-sport content authoring` — Feature, area:content, Low (v2).

---

## 5. Portability — the reusable kit

**Standalone repo `kchan-code/vibe-workflow-kit`:**

```
vibe-workflow-kit/
├── VERSION                      # 1.0.0 — bumped on every kit change
├── install.sh                   # copies droppable files in; prints CLAUDE.md merge steps
├── templates/
│   ├── pull_request_template.md # → .github/ (verbatim, agnostic)
│   ├── ci.yml                   # → .github/workflows/ (lockfile-detect pattern)
│   ├── ship.md                  # → .claude/commands/ (config-driven)
│   └── CLAUDE.workflow.md       # the 3 blocks to paste into CLAUDE.md
└── README.md                    # the split table + "fill the config block" guide
```

- **Agnostic vs specific:** PR template + the two prose blocks are byte-identical
  everywhere; everything that varies lives in the one `## Project Workflow Config`
  block (verify commands, branch, Linear team id + prefix, privacy paths, guards,
  roster). A bare repo deletes the privacy/audio/roster lines and fills verify.
- **Distribution = copy-in**, not submodule/npm (vibecoding repos are
  heterogeneous; some have no `package.json`). `install.sh` copies the droppable
  files and *prints* `CLAUDE.workflow.md` for hand-merge (never clobber CLAUDE.md).
- **Drift control:** a `<!-- vibe-workflow-kit vX.Y.Z -->` marker in each artifact;
  a `kit-check` that diffs local markers/agnostic files vs the kit's VERSION and
  opens a "kit drift" Linear issue. Agnostic blocks are read-only in consuming
  repos; edit upstream, bump VERSION, re-install. Only the config block is local.
- **Applying to a new project:** create a Linear Project under a team, clone the
  milestone/label/issue-template scaffold, run `install.sh`, fill the config block,
  set the branch convention + magic words. The loop mechanic is identical.

---

## 6. Rollout sequence

**Phase A — Repo artifacts** (additive; one feature branch + PR; no Linear writes):
1. `.github/pull_request_template.md` (3a).
2. CLAUDE.md sections + edits (3b: B1–B5).
3. `ship.md` (3c) + the two agent-def notes (3d).
4. Narrow verify (typecheck/lint — docs/markdown + command file, no build needed).
   Open PR, dogfood the new template by hand. `/review` → qa-reviewer →
   kids-privacy-officer (touches `CLAUDE.md` + `.claude/agents/**` → privacy path)
   → merge via GitHub UI.

**Phase B — Linear setup** (needs explicit go before any write):
5. Create Project `From Victory — MVP` + M0–M4.
6. Add Type/Area/Gate labels + the issue template.
7. Configure Linear↔GitHub auto-transitions.
8. Create the ~18 seed issues — starting with `Add .github/pull_request_template.md`
   (close it against the Phase-A PR to prove the loop end-to-end), then the rest.

**Phase C — Portability** (after the loop runs once in-repo): stand up
`kchan-code/vibe-workflow-kit` (extract the proven agnostic artifacts) +
`install.sh` + drift check. Separate green light.

**Gates:** Phase A is safe on approval (additive, reversible, behind a PR). Phase B
writes to Linear — do not create the project/milestones/labels/issues until KC
says go. Phase C is a new repo — separate green light.

---

## 7. Open decisions — RESOLVED

1. Project vs milestones vs cycles → **Project + 4 milestones, no cycles** (default).
2. Issue-scoped strictness → **Advisory** (flag + log, don't block).
3. Issue-scoped reviewer → **built-in `/review`** (default).
4. Seed scope → **All ~18 issues**.
5. Branch convention → **`<type>/fv-<n>-<slug>`** (default).

Execution: **on hold** pending KC's go.

---

## 8. Parallel-velocity levers — the part that delivers what KC asked for

Linear/this workflow is **necessary scaffolding** for scaling the build, but it is a
tracking + coordination layer — it does not, by itself, make parallel multi-agent
streams go faster. The actual velocity comes from three levers, now encoded above:

1. **Stop being the merge funnel (B6).** The single biggest unlock. Today every
   stream routes through KC for merge approval + by-ear calls + scope decisions —
   so adding agents just stacks PRs behind one person. The risk-tier policy lets
   low-risk, CI-verifiable work merge without KC, reserving his attention for the
   high-stakes calls (audio by-ear, payments, privacy, product scope). **This is a
   trust decision, not a tool** — it only takes effect once KC picks a merge
   mechanism (B6's open sub-decision).
2. **Non-colliding stream boundaries (B7).** Parallel branches on the same hot file
   = conflicts/rebases/force-pushes (which ate real time this session). Route
   concurrent streams to independent areas; serialize work on hot files via Linear
   dependencies; and over time invest in subsystem boundaries so more areas become
   independent. The tracker makes the dependency graph visible; the architecture is
   what actually raises the ceiling.
3. **Small, issue-scoped diffs (the core workflow).** Bounded diffs collide less and
   review faster — this is the workflow's direct contribution to (1) and (2).

**Honest bottom line.** With these three in place, the answer to "will this help me
build in parallel with more agents and greater velocity?" is **yes** — because it
makes work organized, separable, and *un-bottlenecked*. Without lever 1 especially,
the workflow organizes the queue but you stay the ceiling. Treat Linear as the
scaffolding that makes the three levers visible and possible — not as the velocity
engine itself.

**Modes caveat (B8).** KC's real build style is big exploratory arcs (discovery).
Delivery-mode issue-scoping is for executing *known* work in parallel; it must not
suppress the exploration that's been working. Keep both modes conscious.
