# Tennis Module Map (v2)

**Status: v2 / post-MVP. Discovery artifact, not a build commitment.**
Authored 2026-06-02. Mirrors the "Basketball at Launch (MVP)" epic
(FV-26..34) but adapted for an **individual sport**. The actual tennis
*build* gates through **product-strategist** (scope) + **KC** (founder
call), exactly as basketball did with the FV-26 founder decision.

Companion: `.claude/agents/tennis-expert.md` (the domain-authenticity agent,
created alongside this map).

---

## 1. Why tennis fits From Victory (strategic)

Tennis is the **purest fit** the brand has. The athlete is alone on court,
no teammate to blame, no bench to hide on, and — at junior levels — no coach
to look at. The scoring system lets you stand two points from winning and
still lose. The sport is famously "90% mental." There is nowhere to hide and
no performance to hide behind — which is precisely the soil
"your identity is secure, compete from victory" is built for.

Market notes: large, paying, faith-aligned junior-tennis families; an
intense tennis-parent culture (relevant — **the parent is the buyer**);
year-round, expensive, individual specialization.

## 2. Scope discipline (read before building)

- **Tennis is v2.** It is NOT a launch sport. It does not enter MVP without a
  product-strategist pass + an explicit founder call (the tennis analog of
  FV-26).
- Per **FRO-21**, once the engine is sport-ready (the basketball keystone
  **FV-28**) and basketball has landed, adding a sport should be a **pure
  data/content problem** — define styles + adversities, author + render
  clips, seed daily content. Tennis must add **zero new tech/deps**.
- The one architectural risk tennis surfaces (§3) is the most valuable thing
  this map contributes *now*, pre-build — it should feed FV-28's design.

## 3. The architectural wrinkle tennis surfaces (feed into FV-28 NOW)

Hockey and basketball are team sports with **positions**. Tennis has none —
its meaningful axis is **playing style/archetype**, plus an orthogonal
**discipline** axis (singles vs doubles).

If the per-sport registry (FV-28) hardcodes "position" semantics, tennis
forces a *second* refactor. **Recommendation, even before tennis is
greenlit:** design FV-28 so the dimension is a neutral, sport-defined
**"role/archetype"** (data, not engine-coded), with an optional
**discipline** field. Then tennis — and any future individual sport (golf,
wrestling, track, swimming) — drops in as pure config. This is a cheap
generalization now vs. an expensive one later.

## 4. Module breakdown (basketball issue → tennis analog)

| # | Basketball analog | Tennis work | Tennis-specific delta |
|---|---|---|---|
| 1 | FV-26 scope-lock | Founder call to admit tennis to a launch tier | Stays **v2** unless KC + product-strategist greenlight |
| 2 | FV-27 sport schema | Add `tennis` to the `sport` enum | May want a `discipline` (singles/doubles); **defer player-style to pregame selection** (like position) rather than onboarding |
| 3 | FV-28 registry (KEYSTONE) | Add the tennis config entry | **Hard dep on FV-28 generalizing "position" → role/archetype** (§3) |
| 4 | FV-29 taxonomy | Define tennis styles × adversities | §5 draft; styles not positions; self-officiating + scoring-pressure adversities are unique |
| 5 | FV-30 clip scripts | VIZ block per style + hard-moment cells (style × adversity) | Faith clips (openers/prayer/reset/sendoff) reused as-is |
| 6 | FV-31 render audio | Generate + master via existing pipeline; bump `AUDIO_CACHE_BUST` | Same ash voice / OpenAI TTS / EQ / spectral QA |
| 7 | FV-32 daily content | 30 days of tennis daily sessions | Faith + mental-skill spine is sport-neutral; examples/vocab are not |
| 8 | FV-33 onboarding/routing | Sport selector lists tennis; route by sport | Trivial once FV-27/FV-33 generalize |
| 9 | FV-34 dual→tri-sport QA | Parameterized integrity test loops tennis too | Confirms hockey + basketball non-regressed |

## 5. Proposed taxonomy (draft — for tennis-expert + content-trio refinement)

**Player styles** (the "position" analog — 3, to match the engine's
3-position shape; singles default):

1. **Baseliner / counterpuncher** (the grinder)
2. **Aggressive baseliner / all-court** (the shotmaker)
3. **Big server / serve-based** (the front-runner)

**Adversities** (target ~10 to mirror the 3×10 matrix; each split per style
by the content trio — sports-psychologist owns the skill, youth-pastor the
scripture, tennis-expert verifies authenticity):

- Double fault on a big point (server's world)
- Serving for the set/match and getting broken
- The bad line call / opponent hooking (self-officiated juniors)
- The choke — tightening with the lead / on match point
- The spiral / tanking — checking out mid-match, wanting to quit
- Down a set or down a break — the comeback mindset
- The unforced-error storm — can't find the court
- Playing the pusher / a style you hate — patience & frustration
- Playing scared with parents / a crowd watching
- The bagel/breadstick blowout — getting embarrassed
- First-round-out / losing to a lower UTR (ranking pressure)

(Pick ~10, map per style. A counterpuncher's adversity ≠ a big server's —
same discipline as the hockey goalie lesson, FRO-10.)

## 6. Dependencies & sequencing

- **Hard dependency:** FV-28 (general per-sport registry). Do NOT start
  tennis engine work until FV-28 generalizes "position."
- **Soft input now:** this map → FV-28 design (the §3 generalization).
- Then: schema/routing are small generalizations of FV-27/FV-33; the content
  chain (taxonomy → scripts → audio → daily) is parallel-safe content work
  on independent areas.

## 7. Proposed Linear issues (ready to file under a new "Tennis (v2)" project)

1. **Tennis taxonomy — styles + adversity scenarios** (content; tennis-expert + trio)
2. **Generalize per-sport registry for non-positional sports** (depends on / amends FV-28)
3. **Tennis pregame clip scripts — VIZ + style×adversity cells** (content/audio)
4. **Render tennis pregame audio + bump AUDIO_CACHE_BUST** (audio)
5. **Tennis daily training content (days 1-30)** (content)
6. **Add `tennis` to sport enum + optional discipline** (backend; small)
7. **Tennis in onboarding sport selector + routing** (frontend; small)
8. **Tri-sport QA — extend parameterized integrity test to tennis** (frontend/QA)
9. **(Gate) Founder + product-strategist scope decision: tennis launch tier vs v2** (chore)

## 8. Open questions for KC

- **Launch tier or strictly v2?** (Recommend v2 until basketball ships.)
- **3 styles, or more?** Singles-only for tennis v1, doubles as a later
  discipline? (Recommend 3 styles, singles-first.)
- **Capture player style at onboarding or pregame?** (Recommend pregame,
  like position — keeps onboarding to 2 taps.)
- **Recruit a tennis advisor** (mirrors the chaplain / sport-psych advisory
  hire; tennis-expert is NOT a clinician)?
