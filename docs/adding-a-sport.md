# How to Add a Sport to From Victory

This document provides step-by-step instructions for adding a new sport (hockey, basketball, golf, football, swimming, track-field, lacrosse, tennis, etc.) to the From Victory app. The process spans configuration, audio pipeline, content, database schema, and QA.

## Overview: Live vs. Dormant Sports

- **Live sports** (hockey, basketball, golf) appear in `SUPPORTED_SPORTS` and are athlete-selectable at onboarding and in settings.
- **Dormant v2 sports** (baseball, football, swimming, track-field, lacrosse) are fully authored and have clip assets generated, but are NOT athlete-selectable — they live behind a future go-live migration and feature flag.

Both paths follow the same steps below; the **Live vs. Dormant** distinction is noted where it matters (primarily steps 1 and 9).

---

## Checklist: Adding a Sport

### Step 1: Add to the Sport Union and Registry Type

**File:** `apps/web/components/pregame/sport-registry.ts` (lines 27-31)

Export the `Sport` type union with the new sport:

```typescript
export type Sport = "hockey" | "basketball" | "baseball" | "golf" | "football" | "swimming" | "track-field" | "lacrosse" | "tennis";
```

**Note:** The `Sport` union holds ALL sports (live and dormant). `SUPPORTED_SPORTS` (step 2) controls which are athlete-selectable.

### Step 2: Conditionally Add to SUPPORTED_SPORTS (Live Sports Only)

**File:** `apps/web/lib/sports.ts` (line 16)

For **live sports**, add to the constant array:

```typescript
export const SUPPORTED_SPORTS = ["hockey", "basketball", "golf", "tennis"] as const;
```

For **dormant v2 sports**, skip this step. They remain absent from `SUPPORTED_SPORTS` and are never athlete-selectable until a future activation migration and feature flag land.

**Rationale:** 
- `SUPPORTED_SPORTS` gates the sport-picker UI and validation.
- Absent from this list forces a `Record<Sport, …>` exhaustiveness check to fail until the sport gets a registry entry (step 3).
- Dormant sports are intentionally NOT here until their go-live day.

### Step 3: Create the SportConfig Object

**File:** `apps/web/components/pregame/sport-registry.ts`

Define a per-sport configuration object. Use an existing sport's config as a template. Key fields:

#### Required Fields:

- **`displayName`** — "Tennis", "Football", etc. (human-readable label for athlete-facing UI).
- **`sportKey`** — must match the `Sport` union entry (e.g., "tennis", "football").
- **`roles`** (optional) — array of position/role strings (`["Guard", "Wing", "Big"]` for basketball; omit for no-role sports like golf or swimming).
- **`roleLabel`** (optional, if roles present) — label for the role selector ("Position", "Player type", etc.).
- **`roleContent`** (optional, if roles present) — `Record<role, { title, scenes[] }>` for position-specific visualization copy.
- **`adversities`** — ordered array of Hard Moment option strings (e.g., `["I turn the ball over.", "I miss an open shot.", ...]`).
- **`adversitySlugFragments`** — `Record<adversity_string, slug_fragment>` mapping (e.g., `{ "I turn the ball over.": "turnover", ... }`).
- **`cellSlugFor`** — function `(adversity: string, role?: string | null) => string` that composes the final clip slug for a (adversity, role) pair.
  - For hockey: `session-{role}-{fragment}` or special case (e.g., goalie-benched → "session-goalie-pulled").
  - For basketball: `bb-{role}-{fragment}`.
  - For golf: `hm-glf-{profile}-{fragment}` (directly the hard-moment slug, no composite).
- **`vizSlugFor`** (optional) — function `(role?: string | null) => string` to derive the visualization clip slug if the sport has role-specific viz.
- **`practiceFocusOptions`** — ordered array of pre-practice focus-picker options.
- **`practiceFocusSlugs`** — `Record<option_string, slug>` mapping for pre-practice clips.
- **`needs`** — ordered array of "Today's Focus" need options (e.g., "Confidence", "Calm", "Better decisions with the ball").
- **`anchors`** — ordered array of reset-anchor options (e.g., "Tap stick twice", "Long exhale", "Say cue word").
- **`selfTalkOptions`** — ordered array of self-talk phrases. Include sport-specific version of the shift/possession/shot phrase (e.g., "You're okay. Next shot." for golf).
- **`practiceOpenerSlugs`** — `{ "dialed-in": string, "not-feeling-it": string }` mapping to pre-practice opener clip slugs.
- **`audioScript`** — `AudioSegment[]` array for the text-mode audio script (fallback timer in `AudioSessionScreen`). Use hockey's `AUDIO_SCRIPT` as the template; override segments 80/120/165 with sport-specific body text if needed.
- **`cueWordHelper`** — hint text below the cue-word picker (e.g., "The one you'd say to yourself on the walk to the next shot." for golf).
- **`cardShareHint`** — secondary hint below the Pre-Game Card header (e.g., "Screenshot it. Open it before your tee time." for golf).

#### Optional Fields:

- **`roleAdversities`** (optional) — `Record<role, AdversityOption[]>` for role-specific Hard Moment label overrides or clinical gatekeeping (e.g., Goalie sees "I get pulled." instead of "I get benched."; certain intense cells are WITHHELD from the picker via `roleAdversities` until clinical sign-off).
- **`positivePlaysCopy`** (optional) — custom picker copy for positive-plays screen (e.g., golf says "Shots" instead of "Plays"; absent → `DEFAULT_POSITIVE_PLAYS_COPY`).

**Example (Tennis):**

```typescript
export const TENNIS_CONFIG: SportConfig = {
  displayName: "Tennis",
  sportKey: "tennis",
  roles: ["Baseline Player", "Serve-and-Volley", "All-Court"] as const,
  roleLabel: "Player Style",
  roleContent: {
    "Baseline Player": { title: "...", scenes: [...] },
    // ...
  },
  adversities: ["I double fault.", "I miss a forehand.", ...],
  adversitySlugFragments: { "I double fault.": "double-fault", ... },
  cellSlugFor(adversity: string, role?: string | null): string {
    const frag = TENNIS_ADVERSITY_SLUG_FRAGMENTS[adversity] ?? "miss-forehand";
    const roleStr = role ? role.toLowerCase().replace(/-/g, "") : "baseline";
    return `tn-${roleStr}-${frag}`;
  },
  // ... rest of the config
};
```

### Step 4: Register the SportConfig in SPORT_REGISTRY

**File:** `apps/web/components/pregame/sport-registry.ts` (near the end of the file)

Add the sport to the `SPORT_REGISTRY` export (typically a `Record<Sport, SportConfig>`):

```typescript
export const SPORT_REGISTRY: Record<Sport, SportConfig> = {
  hockey: HOCKEY_CONFIG,
  basketball: BASKETBALL_CONFIG,
  baseball: BASEBALL_CONFIG,
  golf: GOLF_CONFIG,
  football: FOOTBALL_CONFIG,
  swimming: SWIMMING_CONFIG,
  "track-field": TRACKFIELD_CONFIG,
  lacrosse: LACROSSE_CONFIG,
  tennis: TENNIS_CONFIG,
};
```

**Note:** The registry must have an entry for every sport in the `Sport` union, even if the sport is dormant. This ensures exhaustiveness checks in the codebase (e.g., `Record<Sport, …>` used in pregame state machines) cannot compile without a config entry for every sport.

### Step 5: Create Hard-Moment Clip Scripts

**File:** `apps/web/components/pregame/audio/clips-{sport}.ts`

Create a new file exporting an array of `AudioScript` objects for each hard-moment cell (one per adversity × role combination, e.g., 10 adversities × 3 roles = 30 clips for a team sport with roles).

**Structure of each hard-moment clip:**

- **`slug`** — unique identifier matching the sport's `cellSlugFor` output (e.g., `"hm-tn-baseline-double-fault"` for tennis).
- **`voice`** — `"ash"` (the OpenAI TTS voice used across all clips).
- **`instructions`** — `SCRIPT_INSTRUCTIONS` (default) or sport-specific instruction overrides for cells with bespoke narration/truth tuning.
- **`speed`** — typically `1.1` (slightly faster).
- **`postFilter`** — `CLIP_LOUDNORM_FILTER` (EBU R128 loudness normalization).
- **`segments`** — array of audio segments (`{ type: "speech" | "silence", text?: string, durationSec?: number, instructions?: string, mark?: { phase: "hardMoment" }, ... }`).

**Segment structure for a hard-moment clip:**

```typescript
segments: [
  { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
  { type: "silence", durationSec: 0.4 },
  { type: "speech", text: "You are in the baseline rally...", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
  { type: "silence", durationSec: 1.5 },
  { type: "speech", text: "Your hand tightens on the racket. The ball feels fast...", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
  { type: "silence", durationSec: 2 },
  { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
  { type: "silence", durationSec: 3 },
  { type: "speech", text: "That error is over. The next point is in front of you.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
  { type: "silence", durationSec: 2 },
  { type: "speech", text: "Step back, take a breath, and commit to the next point.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
  { type: "silence", durationSec: 2 },
],
```

**File template:** See `apps/web/components/pregame/audio/clips-golf.ts` or `clips-baseball.ts` for complete examples.

### Step 6: Create Visualization Segment Definitions

**File:** `apps/web/components/pregame/audio/segments-{sport}.ts`

Define the sport-specific VIZ (visualization) segments — the mental rehearsal copy that the athlete hears for each role. Export named constants (e.g., `BASELINE_VIZ`, `VOLLEYER_VIZ`, `ALLCOURT_VIZ` for tennis).

**Example structure:**

```typescript
import type { AudioSegment } from "./types";

export const BASELINE_VIZ: AudioSegment[] = [
  {
    type: "speech",
    text: "See the court in front of you. Feel the baseline under your feet. ...",
    speed: 1.1,
    instructions: VISUALIZATION_INSTRUCTIONS,
  },
  { type: "silence", durationSec: 1 },
  { type: "speech", text: "You are ready. This is your game.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
  // ...
];

export const VOLLEYER_VIZ: AudioSegment[] = [
  // ... different scene for serve-and-volley style
];

export const ALLCOURT_VIZ: AudioSegment[] = [
  // ... balanced copy for all-court players
];
```

### Step 7: Create Positive-Plays Visualization Clips (if applicable)

**File:** `apps/web/components/pregame/audio/clips-viz-{sport}.ts` (optional)

If the sport has role-specific positive-play scenarios (like golf's 21 viz clips), define them here as a exported array `{SPORT_UPPER}_VIZ_CLIP_SCRIPTS`.

**Not all sports need this.** Hockey has generalized viz clips (one per position); basketball reuses hockey's clips; golf has sport-specific clips because its player-profile taxonomy differs.

**Example entry:**

```typescript
{
  slug: "viz-tn-baseline-slice-approach",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself at the baseline, opponent deep. ...", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    // ...
  ],
}
```

### Step 8: Register Clips in the Barrel Export

**File:** `apps/web/components/pregame/audio/clips.ts`

Import the sport's clip array and register it into the main `CLIP_SCRIPTS` object (or the appropriate manifest).

**Example (if the pattern uses a barrel array like `clips-golf.ts`):**

```typescript
import { TENNIS_PREGAME_CLIP_SCRIPTS } from "./clips-tennis.ts";
import { TENNIS_VIZ_CLIP_SCRIPTS } from "./clips-viz-tennis.ts";

// Inside the export array (or as a separate registration):
export const CLIP_SCRIPTS: AudioScript[] = [
  // ... existing clips
  ...HOCKEY_PREGAME_CLIP_SCRIPTS,
  ...BASKETBALL_PREGAME_CLIP_SCRIPTS,
  ...BASEBALL_PREGAME_CLIP_SCRIPTS,
  ...GOLF_PREGAME_CLIP_SCRIPTS,
  ...FOOTBALL_PREGAME_CLIP_SCRIPTS,
  ...SWIMMING_PREGAME_CLIP_SCRIPTS,
  ...TRACKFIELD_PREGAME_CLIP_SCRIPTS,
  ...LACROSSE_PREGAME_CLIP_SCRIPTS,
  ...TENNIS_PREGAME_CLIP_SCRIPTS,
  ...TENNIS_VIZ_CLIP_SCRIPTS,
];
```

### Step 9: Create the Database Enablement Migration

**File:** `supabase/migrations/{timestamp}_add_{sport}_to_sport_enum.sql`

Create a migration that widens the `sport_valid_values` CHECK constraint to allow the new sport. For live sports only (dormant sports are added in a separate migration or step).

**For a live sport (e.g., tennis):**

```sql
-- =============================================================================
-- Migration: {timestamp}_add_tennis_to_sport_enum.sql
--
-- Purpose:
--   Tennis goes live. Widen the sport_valid_values CHECK constraint to add
--   'tennis' to the athlete-selectable sport list.
--
-- Safety:
--   This is an additive-only ALTER — it widens the allowed set. No existing
--   row can violate the new constraint. Backward-compatible.
-- =============================================================================

begin;

alter table public.profiles
  drop constraint if exists sport_valid_values;

alter table public.profiles
  add constraint sport_valid_values
    check (
      sport is null
      or sport in ('hockey', 'basketball', 'golf', 'tennis')
    );

-- Add player-type positions for tennis to the profiles_position_values constraint
-- (if tennis has position/role dimension — skip if it's no-role like swimming).
alter table public.profiles
  drop constraint if exists profiles_position_values;

alter table public.profiles
  add constraint profiles_position_values
    check (
      position is null
      or position in (
        -- Hockey
        'Forward', 'Defense', 'Goalie',
        -- Basketball
        'Guard', 'Wing', 'Big',
        -- Baseball (v2 — dormant)
        'Pitcher', 'Catcher', 'Infield', 'Outfield',
        -- Golf (v2)
        'Bomber', 'Ball-Striker', 'Scrambler',
        -- Tennis (live)
        'Baseline Player', 'Serve-and-Volley', 'All-Court'
      )
    );

commit;
```

**Note on dormant sports:** When a v2 sport is authored but not yet live, this migration is typically skipped. The sport remains absent from `sport_valid_values` until the go-live day, when a separate migration (or a feature-flag activation) enables it.

### Step 10: Update Athlete Data Validation Tests

**File:** `apps/web/__tests__/athlete-quiz-schema.test.ts`

The athlete-quiz-schema test mirrors the `sport_valid_values` and `profiles_position_values` CHECK constraints and asserts that registry roles are a subset of the position whitelist.

**Verify or update:**

```typescript
const ALLOWED_SPORTS = ["hockey", "basketball", "golf", "tennis"];
const ALLOWED_POSITIONS = {
  // ... existing
  tennis: ["Baseline Player", "Serve-and-Volley", "All-Court"],
};
```

(This test typically auto-passes if the registry and migrations are in sync.)

### Step 11: Audio Generation and Rendering

**Command:**

```bash
npm run audio:generate -- --mode clips --slug {sport}
```

This renders the sport's clip MP3s from the `clips-{sport}.ts` AudioScript objects using the TTS pipeline (OpenAI voice, EBU R128 loudnorm, ffmpeg mastering).

**Output:**
- Content-addressed MP3s in `apps/web/public/audio/pregame/clips/hm-{sport}-*.mp3` (+ `.json` manifest sidecars).
- `manifest.json` updated with clip metadata (hash, duration, etc.).
- `MANIFEST_VERSION` printed to stdout (used to bump the service-worker cache key in `apps/web/public/sw.js` and `apps/web/components/pregame/audio-mapping.ts`).

**Steps:**

1. Generate clips:
   ```bash
   npm run audio:generate -- --mode clips
   ```

2. Copy the `MANIFEST_VERSION` output to both:
   - `apps/web/components/pregame/audio-mapping.ts` → `const MANIFEST_VERSION = "..."`
   - `apps/web/public/sw.js` → `const MANIFEST_VERSION = "..."`

3. Verify clips in the browser (open DevTools > Application > Cache Storage) or smoke-test the pregame flow.

### Step 12: Content Pipeline (Content Trio + Sport Expert Review)

**Orchestration:** The lead agent invokes `content-curator` (who coordinates `sports-psychologist`, `youth-pastor`, and the relevant sport-expert) to produce athlete-facing training content in one voice.

**Deliverables:**
- Training session daily copy (the mental skill + scripture foundation).
- Hard-moment clip scripts (cells in `clips-{sport}.ts`) — authored by the content trio, verified by the sport-expert for domain authenticity (positions, adversities, examples, vocabulary).
- Visualization copy (segments in `segments-{sport}.ts`).
- Pre-practice focus options and audio clips.

**See also:** `docs/pregame-scripts.md` for the content editing workflow.

### Step 13: Clinical Gating and QA

**Checklist:**

- [ ] **Clinical sign-off** — each hard-moment cell reviewed by a clinical advisor (sports psychologist or mental-health clinician) to flag high-intensity or potentially distressing content.
- [ ] **Sport-expert authenticity review** — hockey-expert, basketball-expert, etc. verify the content rings true to real players at that position, level, and age.
- [ ] **Athlete-facing UI smoke test** — manually test the pregame flow on at least one mobile browser (Safari iOS, Chrome Android) to verify:
  - Sport appears in onboarding and settings.
  - Position picker shows the correct roles.
  - Hard-moment clips load and play correctly (audio seams, timing, loudness).
  - Text-mode fallback (if audio fails) displays correctly.
- [ ] **E2E test coverage** — add Playwright E2E tests for the new sport's flow (onboarding, sport selection, pregame clip playback).
- [ ] **Accessibility review** — verify audio captions, text-mode fallback, and keyboard navigation work for athletes with visual/auditory disabilities.

### Step 14: Live-Sport Activation (if applicable)

**For dormant v2 sports going live:**

1. Add the sport to `SUPPORTED_SPORTS` (step 2, if not done earlier).
2. Run the DB enablement migration (step 9).
3. Deploy to production.
4. Toggle feature flag or infrastructure setting (if one exists) to make the sport visible in the athlete-facing UI.

**For MVP launch sports (hockey, basketball, golf):** Already live; no activation step needed.

---

## Files Summary

| File | Purpose | Live | Dormant |
|------|---------|------|---------|
| `apps/web/lib/sports.ts` | `SUPPORTED_SPORTS` type + `DEFAULT_SPORT` | Add to array | Omit |
| `apps/web/components/pregame/sport-registry.ts` | `Sport` union, `SPORT_REGISTRY`, `*_CONFIG` objects | ✓ | ✓ |
| `apps/web/components/pregame/audio/clips-{sport}.ts` | Hard-moment cell AudioScript objects | ✓ | ✓ |
| `apps/web/components/pregame/audio/segments-{sport}.ts` | Role-specific VIZ AudioSegment definitions | ✓ | ✓ |
| `apps/web/components/pregame/audio/clips-viz-{sport}.ts` | Role-specific positive-play viz clips (optional) | ✓ | ✓ |
| `apps/web/components/pregame/audio/clips.ts` | Barrel exports of all clip scripts | ✓ | ✓ |
| `supabase/migrations/*_*_db_enablement.sql` | Widen `sport_valid_values` CHECK | ✓ | — (deferred) |
| `docs/pregame-scripts.md` | Content editing reference (if edits needed) | ✓ | ✓ |

---

## Content Source of Truth

Sport-specific content (training sessions, Hard-Moment scenarios, visualization copy) is authored in:

- **`docs/scripts/{sport}-module-map.md`** — the taxonomy and content spec (e.g., `docs/golf-module-map.md` for golf).
- **Daily training** — seeded in migrations (e.g., `20260613030000_seed_training_sessions_golf_days_1_30.sql` for golf).
- **Pregame/pre-practice clips** — authored in `clips-{sport}.ts` and `segments-{sport}.ts`, verified by the content trio and sport-expert.

Before adding a new sport, ensure the taxonomy and content spec exist; coordinate with content-curator, sports-psychologist, youth-pastor, and the relevant sport-expert.

---

## Testing Checklist

- [ ] TypeScript strict mode: no `any`, all `Record<Sport, …>` entries filled.
- [ ] `npm run typecheck` passes for the sport registry and clips.
- [ ] `npm run lint` passes (no forbidden patterns like `// ignore` or `@ts-ignore`).
- [ ] Audio clips generated without errors; all MP3s exist in `public/audio/pregame/clips/`.
- [ ] `MANIFEST_VERSION` updated in both `audio-mapping.ts` and `sw.js`.
- [ ] Pregame flow tested manually on mobile (sport picker → position picker → audio playback).
- [ ] Text-mode fallback tested (audio silently fails; fallback timer displays correctly).
- [ ] Database migration applies cleanly: `supabase db push` (or production apply if already deployed).
- [ ] No regression in other sports' flows.

---

## Troubleshooting

### TypeScript errors on `SPORT_REGISTRY`

**Error:** `Property 'tennis' is missing in type 'Record<Sport, SportConfig>'`

**Fix:** Ensure every entry in the `Sport` union has a corresponding key in `SPORT_REGISTRY`. Check that the key name matches exactly (case-sensitive).

### Audio clips not rendering

**Error:** `CLIP_SCRIPTS not found` or clip slug mismatch.

**Fix:**
1. Verify `clips-{sport}.ts` exports an array (e.g., `TENNIS_PREGAME_CLIP_SCRIPTS`).
2. Verify the import in `clips.ts` matches the export name.
3. Check that all clip slugs match the outputs of `cellSlugFor()` in the registry.
4. Re-run `npm run audio:generate -- --mode clips`.

### Clips play but audio quality is poor / too loud / too quiet

**Fix:** Adjust the `CLIP_LOUDNORM_FILTER` EBU R128 target in `apps/web/components/pregame/audio/loudnorm.ts` (e.g., change `-16 LUFS` to `-14 LUFS` for louder clips). Then regenerate: `npm run audio:generate -- --mode clips`.

### Sport appears in the picker but has no content

**Likely causes:**
1. Sport added to `SUPPORTED_SPORTS` but no registry entry exists → typecheck error (fix: add `*_CONFIG` and register in `SPORT_REGISTRY`).
2. Clips not generated → audio playback fails silently → text-mode fallback shows.
3. Database migration not applied → fresh athlete row creation fails.

**Fix:** Re-run steps 3, 11, and 9 in order.

---

## Reference: Example Live-Sport Flow

**Adding tennis as a live sport (onboarding release):**

1. ✓ Step 1: Add `"tennis"` to `Sport` union.
2. ✓ Step 2: Add `"tennis"` to `SUPPORTED_SPORTS` array.
3. ✓ Step 3–4: Create `TENNIS_CONFIG` and register in `SPORT_REGISTRY`.
4. ✓ Step 5–7: Create `clips-tennis.ts`, `segments-tennis.ts`, and `clips-viz-tennis.ts`.
5. ✓ Step 8: Import and register into `CLIP_SCRIPTS` barrel.
6. ✓ Step 9: Create migration to widen `sport_valid_values` → `'tennis'`.
7. ✓ Step 11: Render audio clips; update `MANIFEST_VERSION`.
8. ✓ Step 12: Content trio authors 30-day sessions; sport-expert signs off.
9. ✓ Step 13: Clinical review, QA, E2E testing.
10. ✓ Step 14: Deploy to production.

**Result:** Tennis appears in the sport picker on onboarding; athletes can select it, choose their player style, and run pregame sessions with tennis-specific content.

---

## References

- **Brand & Voice:** `docs/brand.md`, `CLAUDE.md` (Brand Spine, Voice Modes).
- **Golf (v2 reference implementation):** `docs/golf-module-map.md`, FV-264–272.
- **Baseball (v2 reference):** `docs/baseball-taxonomy-FV-93.md`, FV-92–100.
- **Pregame Script Editing:** `docs/pregame-scripts.md`, `docs/pregame-script-style.md`.
- **Audio Pipeline:** `apps/web/scripts/generate-pregame-audio.ts`, `apps/web/components/pregame/audio/loudnorm.ts`.
- **Supabase RLS & Migrations:** `supabase/migrations/`, `CLAUDE.md` (Audience Language, Non-Negotiable Constraints).
