# Pregame Audio — Session Handoff

**Goal of the next session:** finalize the pregame scripts → ship the crisis footer (FV-146) → turn the scripts into audio → ship to prod.
**Owner cadence:** athlete-facing content + by-ear audio = Tier-2 (KC-gated merge). Vercel auto-deploys from `main`.
**Date handed off:** 2026-06-08.

---

## 0. TL;DR

The FV-136 pregame visualization rebuild is **fully drafted and heavily edited by KC**, captured in **`docs/pregame-scripts.md`** (the canonical, human-readable source — KC's words + per-line timing). **Nothing is in `clips.ts` or audio yet** — this is all pre-audio draft, by design ("edit scripts fully before audio creation"). The architecture is locked; the reviews are done. What's left is: finish the script edits, build the footer, generate the audio, ship.

Do these in order (footer can run in parallel):
1. **Finalize scripts** — apply the reviewer punch-list (§3), lock `docs/pregame-scripts.md`.
2. **Ship the footer** — FV-146 (self-contained frontend; HIGH safety gate on the audio ship).
3. **Create the audio** — md → `clips.ts` → MP3s, bundling per-clip hashing (FV-142) + QA (FV-143).
4. **Ship** — content PR(s), reviews, KC-gated merge, deploy.

---

## 1. Where things stand (current state)

- **Scripts:** `docs/pregame-scripts.md` is canonical. It holds **52 visualization positive-play scenarios** (Hockey: Defense/Forward/Goalie; Basketball: Guard/Wing/Big) + the **live clips** (hard moments hockey+basketball, shared beats, openers, personalization). KC's latest pass added a "See yourself…" imagery on-ramp to every viz scenario, reworked the hard-moment reset lines + prayer/sendoff/opening, and set per-line timing (`[Ns]`).
  - **Structured snapshots** (derived from the md): `docs/pregame-viz-scenarios.json` (52 scenarios, `lines`+`beats`), `docs/pregame-live-current.json` (live clips, lines), `docs/pregame-live-beats.json`. **The md is the source of truth** — if it diverges, re-parse it (see §6); treat the JSON as a convenience snapshot.
- **Nothing shipped:** no new content in `apps/web/components/pregame/audio/clips.ts`, no regenerated MP3s, no footer. The live-clip edits KC made are NOT yet in `clips.ts`.
- **Reviews complete (this session):**
  - youth-pastor + sports-psychologist gave content feedback (no edits) → punch-list in §3.
  - kids-privacy-officer assessed the crisis-off-ramp gap → **FV-146** (HIGH), mechanism decided.

---

## 2. The work, in order

### Step 1 — Finalize the scripts  *(content; KC owns voice; content trio assists)*
- Edit `docs/pregame-scripts.md` in a **plain-text editor (VS Code), not Word** (Word mangles the round-trip — style bleed, fused lines, smart quotes). The md format + parse workflow is in §6.
- Apply the **reviewer punch-list** (§3). These are content-voice calls → content-curator can orchestrate youth-pastor / sports-psychologist / hockey-expert / basketball-expert to draft revisions on request; KC approves (Tier-2).
- When done, **re-parse the md → rebuild the structured library** (§6) so the audio step has clean data.

### Step 2 — Ship the footer (FV-146)  *(frontend; parallelizable; HIGH gate)*
- **Spec is locked in FV-146.** Crisis-resource **footer at the very bottom of the pregame completion card** (`apps/web/components/pregame/screens-b.tsx`, terminal `done` phase ~:1544 / final DONE ~:1697).
- Reuse `apps/web/components/safety/ResourceScreen.tsx` content **inline**: 988 (call/text) + Crisis Text Line + "talk to a trusted adult" + the existing "nothing here is shared with your parent" line. Calm "you're not alone" register, not urgency theatre.
- **Display-only, every session, NOT tied to which clip was picked** (a door, not a signal). No detection, no logging, no parent alert.
- Gate: privacy-path PR → **kids-privacy-officer `VERDICT: APPROVED` required**. This blocks the audio cutover, not the script editing.

### Step 3 — Create the audio  *(audio-engineer owns; KC by-ear approval)*
This is the "re-record everything" pass. Convert the finalized md → clip scripts → MP3s.
- **Viz scenarios → new `viz-<position>-<play>` clips.** Each scenario = an `AudioScript` whose `segments` alternate `speech` (each line) + `silence` (each `[Ns]` beat). These **replace the old monolithic per-position VIZ** (`FORWARD_VIZ`/`DEFENSE_VIZ`/`GOALIE_VIZ` + basketball in `segments.ts`). Keep each play a **discrete clip** so the v2 selectable picker (FV-144) is additive.
- **Live edits → update existing clips** in `clips.ts` (the hard-moment / shared / opener content KC reworked).
- Pipeline: `apps/web/scripts/generate-pregame-audio.ts` (gpt-4o-mini-tts voice **"ash"**, per-segment speed/instructions, emits MP3 + sidecar timeline). Runtime composition: `audio-mapping.ts`, `audio-playlist.ts`, `useClipPlayer.ts`.
- **Bundle FV-142 (per-clip content-hashed filenames)** with this regen so it's the **last** global regen. Use **FV-143 (level-QA script)** to QA the batch (−16 LUFS).
- **AUDIO_CACHE_BUST parity:** any committed `*.mp3` change requires bumping `AUDIO_CACHE_BUST` in **both** `apps/web/components/pregame/audio-mapping.ts` **and** `apps/web/public/sw.js` (CI's `audio-cache-bust` job enforces — FV-106). (FV-142 may retire the global bust; until it lands, keep parity.)
- KC gives the **by-ear** call on pacing/voice quality (Tier-2).

### Step 4 — Ship
- Branch per CLAUDE.md (`feat/fv-136-...`); small logical commits; PR fills the template.
- **Gate order:** content trio review → qa-reviewer → kids-privacy-officer (privacy path) → KC-gated merge.
- **Hard pre-cutover gates:** FV-146 footer present **and** FV-119 clinical sign-off on the two intense clips (`hm-bb-big-fouled-out`, `hm-bb-big-fall-behind-early`) before they ship as live audio.
- Verify on **prod after merge** (Vercel Preview lacks Supabase env — athlete pages can't render in preview).

---

## 3. Reviewer punch-list (apply during Step 1)

**Theology (youth-pastor) — ship-worthy; one real flag:**
- A few reworked Big-cluster / FT-revenge resets re-ground worth in the *next performance* (works-framing) after the identity line was trimmed: **`hm-bb-big-missed-fts`, `hm-bb-big-missed-shot`, `hm-bb-big-turnover`**. Don't restore the old formula — just keep a "floor that isn't the next rep," the way the *good* trimmed clips already do (`hm-bb-big-fall-behind-early`, `hm-goalie-start-slow`, `hm-bb-big-fouled-out`).
- Watch **"earned"** language creeping in (brand resists it).
- **KEEP (do not touch):** the "So now you are free…" opening beat, `shared-sendoff`, `shared-prayer`/`-selfguided`, and the openers (strongest gospel writing in the product).

**Mental skills (sports-psychologist) — psychologically sound; tune:**
- **"Don't ___" reset lines** → use the positive twin (negation is weak under pressure): `hm-defense-bad-penalty`, `hm-forward-bad-penalty`, `hm-defense-beaten-wide`, `hm-forward-get-hit`, `hm-goalie-get-hit`, `hm-goalie-turnover`.
- **"see yourself calm/clear" on-ramps** prescribe an emotional *state* a dysregulated 13-15 may already be failing → prefer readiness/action verbs ("ready," "set," "first to it"): `viz-defense-retrieval`, `viz-defense-breakout`, `viz-defense-angle-wide-boxout`.
- **Pacing:** the *payoff/result* line often deserves the **longest** beat; 2s is short for picturing movement-through-space under audio. (KC already varied beats — good; spot-check the payoff lines + spatial sequences.)
- **Structural gap:** no guided breath *between* the adversity rehearsal and the hype send-off — a single guided exhale after the worst image would close the loop (confirm against the actual clip stitch order in the audio pipeline).
- **KEEP:** nerves-as-energy framing, the 4-in/6-out breath, clutch-FT routines, and the "Now rehearse the hard moment / Now the reset" scaffolding labels.

**Routed to other desks:**
- **Clinical advisor (FV-119):** depth-of-induction on `hm-bb-big-fouled-out` + `hm-bb-big-fall-behind-early` (most intense authored distress, youngest cohort). Paired with FV-146.
- **kids-privacy-officer (FV-146):** crisis footer — **decided** (see §2 Step 2).

---

## 4. Locked decisions — do NOT re-litigate

- **Don't re-architect the pregame runtime.** The compositional clip-playlist already scales (basketball reached hockey parity via config + content). Spend the "re-record everything" budget on content quality, not a rewrite. (memory: `project_pregame-scaling-architecture.md`)
- **Viz = two selectable libraries per position:** positive plays (FV-136) + adversities (existing hard moments). The athlete picks **both**. The selection picker + multi-scenario = **v2** (FV-144).
- **Per-clip content-hashing (FV-142)** is bundled with this regen and is the **last** global regen.
- **Crisis door = display-only footer** on the completion card (FV-146), every session, **not** conditional on clip selection — *door, not signal*. No detection/logging/parent-alert.
- **Brand spine:** identity precedes performance; compete FROM Christ's finished victory (Hebrews 12:1-2). No-shame / rhythm framing. Visualization = positive/mastery imagery ("see yourself do it *well*"); adversity is a separate beat. NIV, evangelical/non-denom (avoid Catholic-specific / Reformed-distinctive framing).

---

## 5. Linear issues

| Issue | What | Status / note |
|---|---|---|
| **FV-136** | Per-position positive-play viz library (the scripts) | Backlog — this handoff executes it |
| **FV-146** | Crisis-resource footer on completion card | **HIGH** — gate on audio ship; spec locked |
| **FV-142** | Per-clip content-hashed audio filenames | Do **with** the regen (last global bust) |
| **FV-143** | Automated −16 LUFS level-QA script | Use to QA the batch |
| **FV-138** | Identity→performance arc | Folded into the content pass |
| **FV-141** | Hype "leave it all out there" send-off | Folded in |
| **FV-119** | Clinical-advisor review of intense pregame cells | Pair with FV-146 before cutover |
| **FV-137** | Visualization-familiarity scaffolding | **v2** |
| **FV-144** | Athlete-selectable session (pick play + adversity) | **v2** |
| **FV-145** | Pipeline hygiene (split clips.ts, manifest CI) | Backlog (sport #3) |

---

## 6. The md ↔ structured round-trip (how to read/apply script edits)

**`docs/pregame-scripts.md` format:**
- `## N · Section` (1 = Visualization; 2-9 = live clips)
- `### Position — Sport` (viz only)
- `**Title**  ` + `` `slug` `` (the slug is the anchor — keep it; don't retype)
- `N. <spoken line>  [Ns]` — numbered spoken line; the trailing `[Ns]` is the **pause that follows it** (the beat to picture it). Default `[2s]`.

**To apply edits:** re-parse the md — anchor on each `` `slug` `` line; numbered lines are speech; strip the trailing `[Ns]` for the beat. Group viz by position from the slug (`viz-<pos>-...`). This rebuilds `pregame-viz-scenarios.json` + `pregame-live-current.json`. (A from-scratch parser is ~40 lines of Python; this session used `difflib` to diff vs the prior snapshot — diffs are clean line-by-line because it's plain text.)

**To turn a viz scenario into a clip:** `AudioScript` = `{ slug, voice:"ash", instructions, segments:[ {speech, text, ...}, {silence, durationSec}, ... ] }` — one `speech` per line, one `silence` per `[Ns]` beat, in order. Pattern-match the existing `viz-*`/`hm-*` exports in `clips.ts`.

---

## 7. Gotchas / risks

- **`/tmp` is ephemeral.** This session's working files (parse/build scripts, the JSONs) are gone next session. `docs/pregame-scripts.md` (+ the `docs/pregame-*.json` snapshots) are the durable source.
- **Don't edit scripts in Word.** Word bled a heading style across the whole basketball section, fused new-scenario lines, and converted smart quotes — the round-trip needed heavy reconstruction. Plain-text md = clean diff.
- **AUDIO_CACHE_BUST parity** (`audio-mapping.ts` ↔ `public/sw.js`) — CI enforces; bump both on any mp3 change (until FV-142 retires the global bust).
- **Hot files — serialize, don't parallel-branch:** `clips.ts`, `segments.ts`, `screens-b.tsx`, `audio-mapping.ts`. FV-136/138/141 + the footer touch overlapping files.
- **Privacy-verdict gate is SHA-aware** — run kids-privacy-officer **last**, re-post `VERDICT:` after each new push (unbolded, at line-start).
- **Lead owns 100% of git.** Subagents return diffs; spawn file-editing agents with `isolation: "worktree"`.
- **Vercel Preview lacks Supabase env** — athlete pages 500 in preview; verify on prod after merge.

---

## 8. Key files

- **Scripts:** `docs/pregame-scripts.md` (canonical) · `docs/pregame-viz-scenarios.json` / `pregame-live-current.json` / `pregame-live-beats.json` (snapshots)
- **Brand / rules:** `docs/brand.md` · `CLAUDE.md`
- **Audio content:** `apps/web/components/pregame/audio/clips.ts` (clip library) · `segments.ts` / `segments-basketball.ts` (shared runs) · `instructions.ts` (voice steering)
- **Pipeline:** `apps/web/scripts/generate-pregame-audio.ts` (generator) · `audio-mapping.ts` (`AUDIO_CACHE_BUST`) · `audio-playlist.ts` · `useClipPlayer.ts` · `apps/web/public/sw.js` (cache-bust parity)
- **Footer:** `apps/web/components/pregame/screens-b.tsx` (completion card) · `apps/web/components/safety/ResourceScreen.tsx` (reuse)
- **Memory:** `project_pregame-scaling-architecture.md`, `project_audio-in-mvp-scope.md`, `project_pregame-playlist-rearchitecture.md`, `project_clip-player-ios-constraints.md`, `feedback_pregame-content-opt-in.md`
