# FV-294 Handoff — Golf pregame: un-trap golfers + individual-sport authenticity

**Issue:** [FV-294](https://linear.app/adeptiv/issue/FV-294) — *Golf pregame individual-sport authenticity + generalizable non-team-sport structure* (Urgent, `kc-gate`, `area:content`, `area:audio`).
**Branch (this PR):** `fix/fv-294-untrap-golfers` (off `origin/main` @ c53ea0b).
**Status:** **Step 1 of 3 shipped in this PR** (the hard blocker). The content is **drafted for KC review**. The rest is engineering + render, **gated on KC's by-ear on the 21 plays**.

---

## TL;DR for the next agent

FV-294 has three parts. This PR does the **urgent** one and **stages** the other two:

1. ✅ **Un-trap golfers (DONE, this PR).** Golfers could not finish pregame. Fixed with a registry-derived flow gate. Ships now — it is the live-bug fix and is safe to merge on its own.
2. 📝 **21 golf positive plays — DRAFTED, awaiting KC review** → [`docs/golf-positive-plays-DRAFT.md`](golf-positive-plays-DRAFT.md). KC by-ears the titles + imagery, THEN it goes to audio render + wiring.
3. ⏳ **Remaining engineering + render — NOT STARTED** (needs swap, self-talk fix, `positivePlaysCopy`, integrity-grid extension, send-off verify, 21 viz + "Trust my swing" opener render, MANIFEST bump). Spec below. Do this AFTER KC approves the plays.

---

## 1. The hard blocker — un-trap golfers (DONE in this PR)

### The bug (was live on `main`)
Golf declares roles (`Bomber` / `Ball-Striker` / `Scrambler`), so `PregameFlow` kept the `positivePlays` step. But `positive-plays.ts` has **zero golf entries**, so:
- the picker rendered empty, AND
- the step is `required: (s) => s.positivePlays.length > 0` — which an empty picker can never satisfy.

→ A golfer reached **Step 04 and could not advance**. Golf was selectable (FV-270) with a non-completable pregame. The integrity assertion that would have caught it (`playlist-integrity.test.ts`) only looped hockey + basketball.

### The fix (committed here)
Gate the `positivePlays` step on **whether plays actually exist for every role**, not on whether the sport declares roles.

- `positive-plays.ts` — new `sportHasPositivePlays(roles)` helper. Returns true only when **every** role has ≥1 play (`every`, not `some` — the athlete could pick any role, so the step is only safe to show when no role yields an empty picker).
- `PregameFlow.tsx` — `position` step still gates on `hasRoles`; `positivePlays` now gates on `sportHasPositivePlays(roles)`. Golf skips the step cleanly and plays its **flagship profile viz** (empty `positivePlays` → `resolvePlaylist` keeps the baked-in `viz-*` — the FV-144 backward-compat path). **Re-enables automatically** once the 21 golf plays land — no flow change needed then.
- `__tests__/sport-registry.test.ts` — the missing regression guard: *the positivePlays step is never shown with an empty picker.* Asserts golf currently skips, the `every`-semantics, and (looping `SUPPORTED_SPORTS`) that any sport showing the picker has plays for all roles.

**No behavior change** for hockey, basketball, or no-ask sports. Verified: typecheck clean, 472 pregame tests + 81 sport-registry tests pass, lint clean.

> ⚠️ When the 21 golf plays land, the test `"returns false when a sport declares roles but ships no plays (golf today)"` **will flip** — update that expectation to `true` (and extend the integrity grid to golf, FV-271). It is intentionally a point-in-time assertion that documents the current state; the durable guard is the `SUPPORTED_SPORTS` loop.

---

## 2. The 21 positive plays — DRAFTED, awaiting KC review

**Artifact:** [`docs/golf-positive-plays-DRAFT.md`](golf-positive-plays-DRAFT.md) — finalized by the content trio (golf-expert authenticity → sports-psychologist imagery craft → content-curator one-voice integration). Supersedes the earlier untracked working copy of the same filename.

- **7 plays per profile** (Bomber / Ball-Striker / Scrambler), 21 total. Good-imagery only — no shank / yips / OB / three-putt (those stay in the gated adversity cell, so **none of the 21 need the FV-119 clinical gate**).
- Slugs follow the live `viz-{bomber|ballstriker|scrambler}-*` convention.
- Built to the sports-psychologist's 5-segment arc (orient → POV beats → outcome → settled close), de-corned voice (no stapled identity closer, no theology in the viz body — the opener already carried it), ~50-60s each.

**Authenticity fixes the golf-expert made vs. the prior draft** (all in the finalized doc): `stinger` → `knockdown` (the iron a junior actually flights into a green); `slider` → `breaker`/`breaking putt` (golfer-native, "slider" is baseball slang); Bomber #6 title dropped "nerves" (a positive-play title shouldn't carry adversity framing); the 3 recovery plays (Bomber #7, Ball-Striker #6, Scrambler #6) start **from the recovery decision**, never rehearsing the bad swing.

**KC's call before render:** the titles + imagery prose (the prose IS what gets recorded). Any line you want changed, change it in the doc; it's plain editable text.

---

## 3. Remaining engineering + render (NOT started — do after KC approves §2)

Straight from the FV-294 acceptance criteria. Group by file:

### `sport-registry.ts` — `GOLF_CONFIG`
- **`needs`:** drop `"Leadership"`, `"Physical courage"`, `"Be more Vocal"` (team-sport needs); add `"Trust my swing"`. Target 8 needs: Confidence, Calm, Compete level, Reset after mistakes, **Trust my swing**, Better course management, Joy, Hope.
- **`selfTalkOptions`:** `"Stay steady. Make the next play."` → `"Stay steady. Play the next shot."` (golf-wrong, missed in the original FV-266 swap).
- **`positivePlaysCopy?`** (new optional `SportConfig` field — generalizes to swimming/tennis, mirrors `cueWordHelper` / `cardShareHint`): `{ label; heading; sub }`. Golf: "shots you'll hit / tee off" register. Team sports keep "plays" via a sensible default in `screens-a.tsx` (~453-459).

### `types.ts` — the "Trust my swing" need (sport-specific, existing pattern)
Plug into `NeedToday` union + `NEEDS` + `NEED_VERSE` + `NEED_OPENER_SLUGS`. Verse: youth-pastor recommends **Isaiah 41:10** or **Proverbs 3:5-6** (see Part 2 of the draft for the theology flag — "Trust my swing" must not read as self-trust over God-trust; the framing handles it). See draft Part 2 for the exact `NEED_VERSE` text + the eyebrow decision.

### `positive-plays.ts`
- Add the 21 golf entries (slug + role + canonical title, verbatim from the approved draft).
- **Ball-Striker hyphen:** the `viz-<role.toLowerCase()>-` slug-prefix integrity assertion expects `viz-ball-striker-` for the hyphenated role, but the live slug token is `ballstriker` (hyphen stripped, matching `cellSlugFor`). Reconcile the integrity assertion to the `ballstriker` token — don't rename the slugs.

### `screens-a.tsx`
- Wire `positivePlaysCopy` into the `PositivePlaysScreen` (~453-459) with the team-sport default.

### `PregameFlow.tsx`
- **No change needed** — the gate added in this PR auto-includes the step once golf has plays for all 3 roles.

### Integrity test (close the gap — FV-271)
- Extend the non-empty-plays + `viz-<role>-` prefix assertions in `playlist-integrity.test.ts` to golf. Flip the `sport-registry.test.ts` golf expectation noted in §1.

### Render (audio-engineer) — MANIFEST bump
- 21 positive-play viz clips (`viz-bomber-*` / `viz-ballstriker-*` / `viz-scrambler-*`).
- "Trust my swing" opener — **KC by-ear:** reuse an existing opener clip (ship now, no render) **or** author a new "commitment, not contact" opener (see draft Part 2 options A/B).
- **VERIFY** the golf send-off (`GOLF_AUDIO_SCRIPT`) doesn't say "serve my team" (individual sport) — re-render if so.
- Bases on the golf manifest from #233 (FV-266). Follow the **scoped-render technique** (see [`docs/v2-script-review`](../docs) memory / `MANIFEST_VERSION` discipline): a full `--mode clips` regen renders the dormant football/swim/track + baseball-anchor clips, so comment those spreads/entries out, render, restore; gate with a "would-render" scan before + zero-dormant manifest check after. Update `MANIFEST_VERSION` in `audio-mapping.ts` **and** `public/sw.js` to the new `manifest.json` value.

---

## 4. Sequencing & gates

1. ✅ **This PR** (un-trap) → merge. Tier-2 (athlete-facing flow) but low-risk and pure-gating; safe to merge ahead of the content.
2. ⏳ **KC by-ears** the 21 plays (§2) + the "Trust my swing" content + the opener route.
3. ⏳ **Engineering PR** (§3 code) → **render PR** (§3 audio, MANIFEST bump).
4. Golf is then fully individual-sport-correct. The generalizable `positivePlaysCopy` + has-plays gate are reusable for swimming/tennis when they launch.

**KC-gate (Tier-2):** this is `kc-gate` + `area:content` + `area:audio`. Nothing past step 1 merges without KC's by-ear on the plays + audio.
