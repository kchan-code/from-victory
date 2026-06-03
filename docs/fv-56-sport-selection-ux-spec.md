# FV-56 — Sport-Selection UX Spec

**Issue:** [FV-56](https://linear.app/adeptiv/issue/FV-56) — "Sport-selection UX — athlete
picks at first-run + changes in Settings (spec for FV-33)"
**Project:** Basketball at Launch (MVP) · **Priority:** High · **Gate:** kc-gate
**Status:** Spec + mock. **No production code.** Implementation lands in FV-33
(first-run) and a Settings sibling issue (see §6).
**Builds on:** [FV-27](https://linear.app/adeptiv/issue/FV-27) — `profiles.sport`
data model (shipped, PR #85). This spec does **not** re-open FV-27.
**Blocks:** [FV-33](https://linear.app/adeptiv/issue/FV-33) — onboarding selector +
sport-aware content/pregame routing.
**Mock:** [`fv-56-sport-selection-mock.html`](fv-56-sport-selection-mock.html) (open in a browser).

---

## 0. Summary of decisions made in this spec

| # | Decision |
|---|---|
| D1 | The first-run picker is a **full-screen gate** at `/athlete/onboarding/sport`, shown before the Today dashboard. Not a card, not a modal. |
| D2 | **Hockey is pre-selected** on the gate. There is **no SKIP** — but a hockey athlete clears it in one tap, so the cost of "no skip" is ~zero. The top-left exit affordance **signs out** (the athlete is already authenticated; there is no "back" to go to). |
| D3 | First-run is detected by an **additive, nullable `profiles.sport_selected_at timestamptz`** column. `NULL` ⇒ show the gate. **Recommended, not built here** — FV-33 owns the migration. This is additive, **NOT** an FV-27 reopen. (See §1.1; alternatives weighed.) |
| D4 | A **new minimal athlete Settings page** at `/athlete/settings`, reached via a gear in the `/athlete` header, hosts the change-sport control + sign-out. None exists today. |
| D5 | Changing sport runs **picker → confirm**. The confirm copy states the data rule plainly: daily content re-keys to the new sport; **rhythm and training position are NOT reset.** |
| D6 | The picker renders its options **from `SUPPORTED_SPORTS`** (FV-27's source of truth), so a 3rd sport (tennis, v2) needs no redesign. Tennis is **not** built or mocked for MVP — forward-compat is asserted, not implemented. |
| D7 | The **Settings change-sport build is a separate sibling issue**, not folded silently into FV-33 (whose AC is onboarding selector + routing only). See §6. |

---

## 1. First-run sport-picker

### 1.1 The first-run detection problem (and the recommendation)

Hockey is FV-27's interim default. So at the data layer, an athlete who *actively
chose* hockey is **indistinguishable** from one who *never chose* — both have
`sport = 'hockey'`. A gate keyed on `sport` alone would never fire (or would fire
forever). We need a separate "has chosen" signal.

**Recommendation — D3: add an additive, nullable timestamp.**

```
profiles.sport_selected_at  timestamptz  NULL
```

Gate logic (server-side):

```
if profile.sport_selected_at IS NULL  → redirect to /athlete/onboarding/sport
else                                  → render /athlete (Today dashboard)
```

On picker submit, write **both** `sport` and `sport_selected_at = now()` in one update.

**Why a server column, not a client flag:** the device ↔ account mapping is not
1:1. A localStorage / cookie flag re-triggers the gate on every new device, browser
clear, or **PWA reinstall** — a real failure mode for an installable app — and it
can't be reasoned about server-side for routing. The server is the truth.

**Why not re-key the gate on something already in FV-27:** there is no existing
"chosen" signal; `sport` defaults to a real value. Adding the column is the minimal
honest fix. It is **additive** — it does not change FV-27's `sport` column, its
default, its CHECK, or its RLS — so it does **not** violate build-mode A.

**Ownership:** this spec *names and recommends* the column. The actual schema choice
(this column vs. a generic `onboarded_at`) and the migration are **FV-33 +
backend-engineer** to land. A timestamp is not a new PII class; athlete-write RLS
mirrors the existing `sport` rule.

> **Open question handed to FV-33/backend:** column name — `sport_selected_at`
> (per-concern, explicit) vs. a generic `onboarded_at` (reusable if a future
> first-run step is added). This spec leans `sport_selected_at`; defer the final call.

### 1.2 Placement & route

A **dedicated full-screen route**: `/athlete/onboarding/sport`. Not a dashboard
card, not a modal overlay. Reasons: clean back-stack, testable in isolation, and it
keeps the server-rendered `/athlete` home free of a new client boundary. The
`onboarding/` path segment leaves room for future first-run steps (each its own
issue — see §6).

The gate renders **only** the picker — no header logo, no bottom nav, no sign-out
button in chrome. The single top-left affordance exits via sign-out.

### 1.3 Screen — copy strings (exact)

| Element | String |
|---|---|
| Eyebrow (mono, gold) | `YOUR SPORT` |
| Heading | `What sport do you play?` |
| Subcopy | `Your content trains around your game.` |
| Hockey label / sub | `Hockey` / `Ice, skates, the full shift.` |
| Basketball label / sub | `Basketball` / `The court, your game, your role.` |
| Primary CTA | `CONTINUE` |
| Exit affordance (aria-label) | `Sign out` |
| Error (inline) | `Couldn't save your sport — try again.` |

**Voice notes:** flat and functional, Mentor mode. No "welcome," no "choose your
path"/journey framing, no emoji, no exclamation. Audience-safe: "you"/"player",
never "kid." Sub-labels are sensory and brief, not slogans.

### 1.4 Behavior

- **Default state:** Hockey pre-selected (active/gold). The screen is therefore
  never truly blocking — one tap on `CONTINUE` clears it for a hockey athlete; a
  basketball athlete taps Basketball, then `CONTINUE`.
- **Submit:** `CONTINUE` enters an in-button loading state (full-width preserved, no
  tap-target shrink). Server action writes `sport` + `sport_selected_at`. On success
  → redirect to `/athlete`. On error → inline `role="alert"` message below the cards;
  the selection is preserved; the athlete retries.
- **No SKIP.** Content is sport-keyed, so a sport is required before the dashboard.
  Hockey-preselected makes the friction negligible.
- **Exit = sign out.** The top-left arrow calls the existing sign-out action (do
  **not** route to `/pair` or `/signup` — the athlete is already authenticated/paired).
  `aria-label="Sign out"`.

### 1.5 Accessibility

- Container `role="radiogroup"` `aria-label="Select your sport"`; each card
  `<button type="button" role="radio" aria-checked>`.
- Focus ring mirrors the shipped picker exactly:
  `focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx`.
- Keyboard: Tab between options, Space/Enter selects, Tab reaches `CONTINUE`. No
  autofocus on load (the athlete reads first).
- Targets ≥ 44px. Error container `role="alert"`.
- Test IDs: `sport-option-hockey`, `sport-option-basketball`, `sport-continue-btn`.

---

## 2. Settings change-sport surface

### 2.1 Entry point (new)

**No athlete Settings page exists today** — the only account control is a Sign-out
button in the `/athlete` header (`apps/web/app/athlete/page.tsx:26-33`). FV-33's
sibling (§6) introduces a minimal one.

- Add a **gear icon** to the `/athlete` header, to the **left of** the existing
  Sign-out button (both fit on 375px; sign-out is high-consequence and stays one tap
  away). Gear → `/athlete/settings`. 44×44 hit target.
- `/athlete/settings` is server-rendered; shows current sport + a `Change` row, and
  Sign-out.

### 2.2 Settings page (minimal)

```
SETTINGS
Your account

SPORT
┌───────────────────────────────────────┐
│  Sport            Hockey      Change →  │   ← whole row is the tap target
└───────────────────────────────────────┘

ACCOUNT
[ Sign out ]   (full-width ghost button)
```

The sport row shows the capitalized display name ("Hockey" / "Basketball") and a
right-aligned gold `Change ›` affordance. Tapping the row opens the change flow.
Test ID: `settings-sport-change-btn`.

### 2.3 Change flow — picker → confirm

**Step 1 — Picker.** Identical to §1's picker with three differences: (a) the
**current** sport is pre-selected (reflects `profiles.sport`, not always hockey);
(b) eyebrow `CHANGE YOUR SPORT`; (c) heading `Switch to a different sport?`. If the
athlete taps `CONTINUE` on the sport they already have → no-op, return to Settings
(no write, no confirm).

**Step 2 — Confirm** (only when the pick differs from current):

| Element | String (basketball example) |
|---|---|
| Eyebrow | `CONFIRM CHANGE` |
| Heading | `Switch to Basketball?` (sport-name interpolated) |
| Body | `Your daily content switches to basketball. Your rhythm and where you are in your training stay the same.` |
| Primary CTA | `YES, SWITCH` |
| Secondary CTA | `Keep Hockey` (current-sport name interpolated) |

On `YES, SWITCH`: write `sport` + `sport_selected_at = now()`; redirect to
`/athlete/settings` with a brief `role="status"` toast: `Switched to basketball.`
(lowercase, calm — confirmation, not celebration). Back from confirm → picker
(selection preserved); back from picker → Settings.
Test IDs: `sport-confirm-switch-btn`, `sport-confirm-keep-btn`.

### 2.4 The sport-switch data rule (decided — deliverable item 2)

Switching `profiles.sport` changes **two** things and resets **nothing**:

- **Changes:** the sport-keyed daily content (`training_sessions_catalog` keyed on
  `(day_number, sport)`) and the pregame's positions/adversities. On the next daily
  session the athlete receives Day-N content for the **new** sport, where N is their
  unchanged `day_number`.
- **Does NOT change / reset:** `day_number` (place in the 30-day arc) and **rhythm**
  (participation history) are **sport-agnostic**. Per CLAUDE.md gamification rules,
  rhythm reflects participation, not sport — switching sport must never reset
  progress or rhythm. The confirm copy ("your rhythm and where you are in your
  training stay the same") is the plain statement of that guarantee. It is total or
  it is not made — do not soften to "most of your progress stays."

**Implementation note for FV-33/backend:** the daily/pregame content query must read
`profile.sport` **at fetch time**. Do not cache `sport` into a session-level or
cached profile object that would go stale on switch.

> **Open question handed to FV-33/FV-28:** if the new sport's catalog has a gap at
> the athlete's current `day_number`, what is served? That is content-completeness —
> [FV-28](https://linear.app/adeptiv/issue/FV-28)'s per-sport registry problem, not
> this spec's. Named here so it isn't lost.

---

## 3. Existing hockey athletes

They are **not** force-re-picked, and the change is **non-disruptive**:

- Because `sport_selected_at` is new, it is `NULL` for all existing athletes at
  deploy, so the gate technically fires once for everyone. This is correct and
  honest: they never affirmatively chose; they were defaulted. The gate is a
  one-screen, hockey-preselected, one-tap moment (~3 seconds). The copy ("What sport
  do you play?") reads as a feature being introduced, **not** an error — no apology,
  no "sorry for the interruption," no "new feature" interstitial.
- After they clear it, it never shows again. They change sport only if they choose
  to, via Settings. The gear is a quiet entry point, **not** an alert or nudge.

---

## 4. Forward-compatibility (tennis, v2)

- The picker renders options from **`SUPPORTED_SPORTS`** (`apps/web/lib/sports.ts`),
  not hardcoded two-way branches. Adding a 3rd sport = one entry there + its
  label/sub strings + the DB CHECK value. No flow/layout redesign.
- The vertical `flex-col gap` stack scales to 3 cards (~200px total at 64px each) on
  375px — no scroll, no truncation, no horizontal grid (which would unbalance tap
  targets and break sub-label legibility). See mock frame 5.
- **No copy hardcodes "two."** Every non-option string is sport-agnostic or
  interpolated ("Switch to Tennis?", "...switches to tennis...").
- **Tennis is NOT built or shipped for MVP.** The mock's tennis frame is a
  forward-compat illustration only; `SUPPORTED_SPORTS` stays `["hockey","basketball"]`.

---

## 5. Guardrails honored

- **Audience language:** "you"/"player" throughout; never "kid"/"kiddo"/"youngster."
- **Brand/visual:** dark-mode-first, premium athletic; gold/black signature, one gold
  element per view; cobalt only for progress/focus (here, focus rings); no emoji, no
  shame/streak language, Mentor-mode copy. Mirrors the shipped `StatePickerScreen`.
- **Privacy:** the picker adds **no** tracking/analytics, **no** new PII class, **no**
  third-party SDK. `sport` is low-sensitivity and already approved on FV-27.
  `sport_selected_at` is a timestamp under the same athlete-write RLS. Any
  `apps/web/**` that lands in the *build* issues gets kids-privacy-officer review.

---

## 6. Hand-off to build

This spec **blocks FV-33**. Split the **builds** so each diff matches its issue:

- **FV-33 (existing):** onboarding sport selector (§1) + sport-aware content/pregame
  routing + the `sport_selected_at` migration (§1.1). AC already covers the selector;
  routing/migration are in its lane.
- **Sibling issue to file (recommended by product-strategist):**
  - **Title:** `Settings: athlete change-sport surface (impl of FV-56 §2)`
  - **Scope:** build the new minimal `/athlete/settings` page + header gear + the
    change-sport picker→confirm flow per §2; re-keys sport-scoped content; does NOT
    reset rhythm/progress. **Blocked-by FV-56.** Project: Basketball at Launch (MVP).
    kc-gate (athlete-facing, `apps/web/**`, same `sport_selected_at` column).
  - *Do not fold this into FV-33 silently — it widens FV-33's AC and includes
    creating a Settings surface that doesn't exist yet.*

### Anchor files (for the implementer)

- `apps/web/app/athlete/page.tsx` — current Today home; gate redirect added here (or
  in a layout wrapping the `/athlete` segment); header gets the gear.
- `apps/web/lib/auth/guards.ts:42-65` — `requireAthlete()` currently selects
  `id, role, first_name`; add `sport, sport_selected_at` to the select + return.
- `apps/web/components/pregame/PracticeFlow.tsx:52-155` — `StatePickerScreen`: the
  exact affordance pattern to mirror.
- `apps/web/lib/sports.ts` — `SUPPORTED_SPORTS` drives the options (forward-compat).
- `supabase/migrations/20260602000000_athlete_sport.sql` — FV-27 schema; **do not
  modify**; the new column is a **new** migration.

---

## 7. Intentionally not done (this pass)

- Selector/routing implementation → **FV-33**.
- `sport_selected_at` migration → recommended; landed by **FV-33 + backend-engineer**
  (additive; not an FV-27 reopen).
- Settings change-sport **build** + the Settings page it needs → **sibling issue** (§6).
- Tennis / 3-option **build** → **v2**; spec asserts forward-compat, ships no tennis.
- Sport-switch content-gap handling across catalogs → **FV-28 / FV-33** open question.
- README drift (line 3 still says hockey-only / U13–U15 / COPPA / Romans 8:37 vs. the
  current 13–21 / Hebrews 12:1-2 / basketball-in-MVP reality) → **separate docs
  issue**, flagged by product-strategist; not fixed in this diff.
