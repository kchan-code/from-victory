# FV-144 — Athlete-selectable positive-play picker (MULTI-select) — Session Handoff

**Handed off:** 2026-06-09. **Owner cadence:** athlete-facing UI = Tier-2 (KC by-ear / KC-gated merge). Vercel auto-deploys from `main`.

> Start here, then read `docs/pregame-handoff.md` (the prior arc) and the memory
> note `project_pregame-scaling-architecture.md` for the full pregame backstory.

---

## 0. TL;DR

Build the **athlete-selectable positive-play picker** and pull it into MVP. The
FV-136 re-record (shipped, PR #146) authored a per-position **library** of
positive-play visualization clips (`viz-<position>-<play>`, 8-10 per position).
Today the session plays **one hardcoded flagship** viz per position. KC's call
(2026-06-09): let the athlete **see all of their position's plays and pick
SEVERAL**; the session runs each picked play in sequence. This is the v2 issue
**FV-144**, pulled into MVP as **multi-select**.

No audio regen needed — all 52 viz clips are already generated + content-hashed.
This is a **runtime/UI-only** feature.

---

## 1. The decision (KC, verbatim intent)

- "update to screen so it shows all of them for each position" + **"Pick several
  (multi-select)"**.
- So: a selection step shows the athlete every positive play for their position
  (by title); the athlete picks **one or more**; the session plays each picked
  play in sequence as the positive/mastery imagery. The existing adversity
  rehearsal beat stays (the locked model = pick BOTH positive plays AND an
  adversity).

---

## 2. Where things stand (context)

- **The library exists:** `apps/web/components/pregame/audio/clips-viz.ts` —
  **52** `viz-<position>-<play>` AudioScripts (Defense 9, Forward 10, Goalie 9,
  Guard 8, Wing 8, Big 8), each with a human-readable title. All generated,
  loudnorm'd, content-hashed (`manifestVersion 824fc8f9`), live on prod.
- **Today's behavior:** the session plays ONE hardcoded flagship viz per
  position — the `vizSlug` field in `PHASE2_TEMPLATES`
  (`apps/web/scripts/generate-pregame-audio.ts`). Current flagships:
  D→`viz-defense-retrieval`, F→`viz-forward-win-the-wall`,
  G→`viz-goalie-track-and-save`, Guard→`viz-guard-pick-and-roll`,
  Wing→`viz-wing-catch-and-shoot`, Big→`viz-big-roll-and-finish`.
- **The runtime already supports multi-clip playlists** — the compositional
  clip-playlist scales; adding more viz clips to a session is purely additive
  (memory: `project_pregame-scaling-architecture.md`). `resolvePlaylist()` in
  `audio-playlist.ts` assembles the ordered clip list.

---

## 3. The build (spec)

1. **Selection screen.** Add a `PositivePlaysScreen` to the **setup flow in
   `apps/web/components/pregame/screens-a.tsx`** (NOT `screens-b.tsx` — that's
   display/session). screens-a holds the setup steps through the HardMoment /
   adversity picker; **mirror that picker's look + interaction**, but
   **multi-select**. Show every positive play for the athlete's position, by
   title. (A prior build pass confirmed screens-a is the right home.)
2. **Position → plays mapping.** Derive from `clips-viz.ts` (all `viz-<role>-*`
   for the athlete's role). If a clean registry helper doesn't exist, add a
   small data-driven one (consider co-locating with `sport-registry.ts`).
3. **State.** Add the picked viz slugs to the pregame setup state
   (`types.ts` `PregameState` — HOT file; add e.g. `positivePlays: string[]`).
4. **Wire into the playlist.** Thread the picked viz slugs into
   `resolvePlaylist()` (`audio-playlist.ts`) so the session plays each picked
   viz clip **in sequence**, replacing the single hardcoded flagship. Preserve
   the rest: opener → **[picked viz plays]** → adversity rehearsal + reset →
   prayer/sendoff.
5. **Fallback.** If nothing is picked, keep the flagship default (don't break
   the existing path). Pre-selecting the flagship by default is a reasonable UX.
6. **Mobile-first, dark-mode-first, accessible** (`docs/brand.md`).

### The one real design decision → KC by-ear
**Session length.** Each viz play ≈ 60-75s, so multi-select can balloon the
~5-min session. Pick a sensible posture and surface it to KC: a **soft cap**
(e.g. up to 2-3), and/or a **sensible default selection**, and/or clear
**length feedback** in the picker. Don't over-build — propose, let KC decide.

---

## 4. Key files

- `apps/web/components/pregame/screens-a.tsx` — **the picker UI goes here** (HOT)
- `apps/web/components/pregame/screens-b.tsx` — display/session (HOT) — touch only if needed
- `apps/web/components/pregame/audio-playlist.ts` — `resolvePlaylist()` (HOT)
- `apps/web/components/pregame/types.ts` — `PregameState` (HOT)
- `apps/web/components/pregame/audio/clips-viz.ts` — the 52 viz clips + titles
- `apps/web/components/pregame/sport-registry.ts` — taxonomy (position → plays helper?)
- `apps/web/scripts/generate-pregame-audio.ts` — `PHASE2_TEMPLATES` flagships (the fallback)
- Tests: `__tests__/audio-playlist.test.ts`, `playlist-integrity.test.ts`, `sport-registry.test.ts`

---

## 5. Sibling task — cue-word slotting (KC also wants this, "slot into MVP now")

Wire the two generated-but-unused cue-word scaffold clips into the session:
`shared-cue-word-intro-pre` (before the cue-word reset moment) +
`shared-cue-word-sendoff-pre` (after the prayer/sendoff). Expand the
`{{cueReset}}`/`{{cueSendoff}}` sentinels to the athlete's chosen
`cw-<word>` clip in the playlist. **It touches the SAME `screens-b.tsx`/template
flow** → do it **sequentially with FV-144** (same hot files; do NOT open two
branches on screens-a/-b at once). Suggested order: FV-144 picker first, then
cue-word slotting (or fold into one PR if cohesive).

---

## 6. Gotchas / rules

- **Hot files — serialize, don't parallel-branch:** `screens-a.tsx`,
  `screens-b.tsx`, `audio-playlist.ts`, `types.ts`.
- **No audio regen** — all viz clips already exist + hashed; selection is
  runtime-only. No `MANIFEST_VERSION` bump.
- **Tier-2 (athlete-facing):** review order qa-reviewer → kids-privacy-officer
  (apps/web path) → KC by-ear → KC-gated merge. Build to that bar.
- **Lead owns git.** Spawn file-editing agents with `isolation: "worktree"`;
  they return diffs, the lead commits. (The first build pass was stopped to hand
  off — its WIP worktree is throwaway; build fresh from this spec.)
- **Agent isolation worktrees fork off `origin/main`, not a local feature
  commit** — verify the base before trusting agent output (bit us in FV-136).
- **Vercel Preview lacks Supabase env** — athlete pages 500 in preview; verify
  on prod after merge.
- Branch: `feat/fv-144-positive-play-picker`; PR `Closes FV-144`.

---

## 7. Priority context — do NOT lose the thread

FV-144 + the cue-word slotting are **athlete-facing polish KC pulled into MVP**.
The actual MVP critical path is **FV-7 Stripe — Urgent, In Review, blocked by
FV-6** (`/api/webhooks` middleware-matcher fix). Nothing ships a sellable MVP
without payments + access gating. After this pregame polish, **Stripe (FV-6 →
FV-7) is the next big rock.** (product-strategist had scoped FV-144 to v2 for
exactly this reason; KC consciously overrode — fine, just keep Stripe visible.)

---

## 8. Pregame arc status (shipped this session, for context)

- **FV-136 re-record** → PR #146 (merged): 52-viz library + reconciled hm cells
  + prayer/reset/selfguided → md; 240-clip catalog, `manifestVersion 824fc8f9`.
- **FV-119 gate** → PR #147 (merged): the 2 intense Big clips
  (`hm-bb-big-fouled-out`, `hm-bb-big-fall-behind-early`) withheld from the Big
  picker until clinical sign-off (delete `roleAdversities.Big` in
  `sport-registry.ts` to re-enable).
- **Open follow-ups:** FV-148 (sibling brand sweep — re-fix the guard/wing
  works-framing floors), FV-149 (52-scenario beat sweep), FV-150 (exhale beat),
  FV-151 (bustUrl/viz unit tests), FV-152 (generator resume skips on
  file-existence not script-change — `rm` changed clips before any re-record).
- **FV-119 clinical** still needs a recruited advisor to re-enable the 2 clips.
