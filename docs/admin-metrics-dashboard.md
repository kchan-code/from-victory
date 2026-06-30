# Owner Metrics Dashboard — recommendations + design spec

**Status:** v1 built on `feat/admin-metrics-dashboard` (hidden route, owner-gated).
**Route:** `/dashboard/admin/metrics` — 404s for everyone not in `ADMIN_EMAILS`.
**Audience:** KC (owner), as the single operator. Tier-2 (touches auth gate +
aggregates minor data) → KC-gated + kids-privacy-officer before merge.

---

## 1. The one thing to understand first

From Victory persists **almost no product analytics today.** The only durable
engagement signal in the database is `athlete_sessions` (daily-training
`started_at` / `completed_at`). Everything else an analytics dashboard normally
leans on is **not recorded**:

- No generic **app-open / page-view** events → true DAU/WAU/MAU is *not*
  computable. What we can compute is "training-active" (opened a daily session),
  which is a useful proxy but narrower.
- **Pregame guided audio** — the premium differentiator — writes nothing. Zero
  signal on starts, completions, or clip-vs-timer fallback.
- **Pre-practice** and **postgame debrief** — nothing.
- **Push click-through** — not captured.
- Journal + safety detection are **built but dormant** (FV-135) → `safety_events`
  has zero rows in production.

So this dashboard is honestly two things at once:
1. A **real, working v1** over what *is* recorded (the daily-training loop,
   subscriptions, onboarding funnel, waitlist, deletions).
2. A **map of the instrumentation gap** — every panel that needs the proposed
   `activity_events` table is labelled "Needs instrumentation," not faked.

The single highest-leverage thing to add is the **`activity_events` table**
(§5). It converts the dashboard from "daily-training only" to a true product
analytics surface.

---

## 2. North-star metric

**Weekly Active Trainers** — distinct athletes who *complete* ≥1 training session
in a trailing 7-day window.

Why this and not subscribers or accounts:
- It is the literal thing the parent pays for ("the athlete trains").
- It is the one real engagement signal we persist today.
- It is **rhythm-safe**: an athlete who returns after two weeks off re-enters the
  count cleanly — no streak to break, no punishment for a gap. It rewards
  participation and return, exactly the gamification rule in CLAUDE.md.
- Completions (not opens) are the bar because a completed session is the unit of
  delivered value (mental skill + scripture absorbed).

As `activity_events` lands, evolve toward **"% of paid athletes who are Weekly
Active Trainers"** (the engagement-to-revenue ratio). The raw count is the
headline number from day one. Never render it as a leaderboard or per-athlete
ranking.

---

## 3. Metrics catalog

Legend — **now** = computable from today's schema · **effort** = derivable with
more query work · **instrument** = needs `activity_events`.

### Acquisition
| Metric | Definition | Avail | Pri |
|---|---|---|---|
| New parent (buyer) accounts / wk | `profiles role=parent` by `created_at` | now | P0 |
| New athlete accounts / wk | `profiles role=athlete` by `created_at` | now | P0 |
| Signup → subscription rate | active+trialing subs ÷ parent count | now | P1 |
| Waitlist demand by role & sport | `waitlist_signups` grouped | now | P1 |

### Activation (the product's #1 leak)
| Metric | Definition | Avail | Pri |
|---|---|---|---|
| Athlete-creation rate | parents with ≥1 athlete ÷ all parents | now | P0 |
| Device-pairing claim rate | `device_pairings` consumed ÷ total (+ expired-unclaimed) | now | P0 |
| Sport-selection completion | `sport_selected_at` not null ÷ athletes | now | P0 |
| Personalization-quiz completion | `focus_area` not null ÷ athletes (rate only) | now | P1 |
| Activated athletes | completed ≥1 session ÷ athletes | now | P0 |
| Time-to-first-completed-session | median(`first completed_at − created_at`) | effort | P1 |

The Overview ships these as a single **conversion funnel**: parent signed up →
athlete created → started ≥1 → completed ≥1.

### Engagement
| Metric | Definition | Avail | Pri |
|---|---|---|---|
| **Weekly Active Trainers** (north star) | distinct completing ≥1 in 7d | now | P0 |
| Daily completion rate | completed ÷ started sessions (by sport) | now | P0 |
| Sessions / active athlete / wk | rhythm intensity (distribution, not just mean) | now | P1 |
| Content drop-off by day | started vs completed across the 30-day arc | now | P1 |
| Pregame audio start/complete | `activity_events` pregame_* events | instrument | P0 |
| True DAU / WAU / MAU | distinct `app_open` per window | instrument | P0 |

### Retention
| Metric | Definition | Avail | Pri |
|---|---|---|---|
| Week-1 return rate | of prior-week cohort, % active the next week | now | P0 |
| Resurrection | returned after a 14+ day gap | now | P1 |
| Rhythm depth distribution | athletes bucketed by lifetime completions | now | P1 |
| Progression depth | athlete count by deepest day reached | now | P1 |
| Full weekly cohorts (W0→W4) | sign-up week × weeks-since grid | instrument | P0 |

### Revenue
| Metric | Definition | Avail | Pri |
|---|---|---|---|
| Active subscriptions | status in active/trialing | now | P0 |
| Approx MRR / ARR | seat-aware estimate from list prices (flagged) | now* | P0 |
| Plan mix (monthly/annual) | by `price_id` via env price IDs | now | P1 |
| Seat mix | parents by athlete count (1 / 2 / 3+) | now | P1 |
| New subscriptions / wk | `subscriptions.created_at` | now | P1 |
| Cancellation queue + churned | `cancel_at_period_end`, status=canceled | now | P0 |

\* **MRR is an estimate, not truth.** The `subscriptions` mirror stores only
`price_id` — additional-athlete pricing is Stripe **tiered/quantity** pricing, so
the dollar amount lives in Stripe, not in our DB. v1 estimates MRR from the
published list prices (`$5/$3` monthly, `$49/$29` annual) × seat counts and
labels it "Estimate — verify in Stripe." For exact MRR, either (a) store
`unit_amount`/`quantity` on the `subscriptions` row from the webhook, or (b) read
it live from the Stripe API. Recommended: option (a) — one column add, no extra
API calls.

### Safety & Trust
| Metric | Definition | Avail | Pri |
|---|---|---|---|
| Deletion rate | account vs athlete-only deletions / wk | now | P0 |
| Auth rate-limit hits | `auth_rate_limit_events` by action | now | P2 |
| Push opt-in rate | `push_subscriptions` ÷ athletes | now | P1 |
| Safety detections | category × week, suppressed <5 (dormant) | instrument | P1 |

---

## 4. What's built in v1

- `apps/web/lib/admin/metrics-core.ts` — pure, unit-tested shaping (16 tests).
- `apps/web/lib/admin/metrics.ts` — server-only data layer via `createServiceClient`.
- `apps/web/components/admin/dashboard-ui.tsx` — hand-rolled SVG/CSS chart kit
  (no new dependency): `MetricCard`, `AreaTrend`, `BarSeries`, `WeekBars`,
  `HBars`, `FunnelBars`, `NeedsInstrumentation`, `Suppressed`.
- `apps/web/components/admin/tabs.tsx` — the five tab panels.
- `apps/web/app/dashboard/admin/metrics/page.tsx` — gated page + tab/range
  controls (URL-param driven, no client JS) + access-log line.

Every "now" metric above is live in v1. Every "instrument" metric renders a
labelled empty state pointing at §5.

---

## 5. The #1 recommendation: `activity_events` instrumentation

One append-only, **event-only, no-content** table is the single highest-leverage
addition. It unlocks true DAU/WAU/MAU, the pregame-audio funnel, push
click-through, and honest retention cohorts.

```sql
create table public.activity_events (
  id            bigint generated always as identity primary key,
  athlete_id    uuid not null references public.profiles(id) on delete cascade,
  event_name    text not null check (event_name in (
                  'app_open','daily_start','daily_complete',
                  'pregame_start','pregame_complete',
                  'practice_start','practice_complete',
                  'postgame_open','push_click')),
  surface       text check (surface in ('hub','daily','pregame','practice','postgame','push')),
  sport         text,                          -- low-cardinality dimension, not PII
  audio_mode    text check (audio_mode in ('clip','timer')),
  network_mode  text check (network_mode in ('online','offline')),
  meta          jsonb,                          -- allow-listed low-cardinality slugs/bools ONLY
  occurred_at   timestamptz not null default now()
);
alter table public.activity_events enable row level security;
-- No client policies. Writes via service-role server actions only; reads
-- via the owner dashboard (service-role) only. Cascade honors the deletion
-- promise for free.
create index activity_events_athlete_idx  on public.activity_events (athlete_id);
create index activity_events_name_time_idx on public.activity_events (event_name, occurred_at);
```

**What to log (fire-and-forget server actions):**
- `app_open` on each route mount that passes `requireAthlete()` (hub, daily,
  pregame, practice, postgame), debounced ~1/30min/surface. → true DAU/WAU/MAU
  and retention cohorts.
- `pregame_start` / `pregame_complete` at PregameFlow entry and the final
  sendoff; `meta` carries position/adversity/anchor slugs, prayer style,
  `audio_mode`, `network_mode`. → the #1 gap closed.
- pregame audio completion via `useClipPlayer` `onComplete` → `clips_played`,
  `audio_completed` booleans/ints in `meta`. **Never** clip audio, only slugs.
- `practice_*`, `push_click` (`?src=push` on the notification URL).
- `postgame_open` — **confirm with KC first**; postgame's "no order, no tracking"
  was a deliberate design choice.

**Privacy guardrails (non-negotiable):** event-only, never content; `meta` keys
are an *enforced allow-list* of low-cardinality slugs/ints/bools (reject anything
else in the server action); RLS on, no client policies; cascade delete.

Second recommendation: add `unit_amount` + `quantity` to `subscriptions` (set
from the Stripe webhook) so MRR becomes exact rather than estimated.

---

## 6. Privacy guardrails (kids-privacy-officer: APPROVED under these conditions)

An aggregate owner dashboard is acceptable **only** if:
1. **Server Component + `requireAdminParent()` gate** (404 to non-admins) +
   `createServiceClient()` server-only. No weaker gate.
2. **Aggregate-only.** No per-athlete row, name, birthdate, or UUID leaves the
   server. All GROUP BY/COUNT happens server-side before serialization.
3. **No journal content, ever** — not a snippet, not a character count, not a
   keyword. The only journal signal permitted is the *count* of completed
   sessions.
4. **Small-N suppression at <5** for any minor-identifying segment (sport,
   position, focus area, safety category). v1 enforces `SMALL_N = 5`.
5. **Safety events**: aggregate counts only, bucketed **no finer than weekly**,
   suppressed <5; never `athlete_id`, never `detected_at` at event resolution,
   never a keyword. (Consider <10 for crisis/self_harm specifically.) No safety
   signal is ever shown to a parent — owner-only surface.
6. **Access logging** (GDPR Art. 30): every view writes a structured server log
   line — timestamp, admin email, tab, range. v1 does this via `console.log`;
   wire to a log drain before any external audit.

All six are implemented in v1.

---

## 7. Design spec

**Brand application.** Dark-mode-first (`onyx`/`charcoal`), **gold** as the
signature accent (north star, eyebrows), **cobalt** strictly for progress/data
bars and interaction (never the logo), `cream`/`silver` text, `hairline`
borders, mono for labels/eyebrows, display for big numerals. Premium athletic,
not churchy. It's KC's tool but it *reads* as From Victory.

**Information architecture.** One hidden route, sticky top bar (logo lockup +
"Owner metrics" chip + date-range picker), a five-tab strip, then the active
panel. Tabs and range are URL params (`?tab=…&range=7|30|90`) so the whole thing
is a pure Server Component with zero client JS. Default tab Overview, default
range 30 days; the north star is always a fixed trailing 7-day window.

**Tabs.**
1. **Overview** — KC's 60-second check: north star + headline KPIs across every
   pillar + the activation funnel.
2. **Engagement** — weekly completions, 30-day content drop-off, completion by
   sport (suppressed <5), pregame-usage (instrument).
3. **Retention** — week-1 return, resurrection, rhythm depth, progression depth,
   full cohort grid (instrument).
4. **Revenue** — subs, estimated MRR/ARR, new-subs/wk, plan mix, seat mix, churn.
5. **Safety & Trust** — guardrail banner, safety detections (dormant/suppressed),
   deletions, auth-abuse, push opt-in.

**Component inventory** (all built): `MetricCard` (KPI stat + optional inline
sparkline), `AreaTrend` (SVG area/line), `BarSeries` (vertical bars),
`WeekBars` (labelled weekly bars), `HBars` (horizontal labelled bars),
`FunnelBars` (conversion steps), `NeedsInstrumentation` + `Suppressed` empty
states, `Panel` + `SectionHeader` + `StatRow` + `Badge` layout primitives.

**States.** Loading → skeleton (`loading.tsx`, mirrors the KPI grid). Empty →
encouraging zero-state copy (pre-launch small N). Privacy → `<5` / "Hidden"
placeholders. Instrument → labelled cobalt-dashed empty state.

**Responsive.** Desktop-first owner tool; KPI grid collapses 4→2 columns on
mobile, charts are width-fluid SVG, top bar wraps. Fully usable on a phone.

---

## 8. How to enable

1. Set `ADMIN_EMAILS` (comma-separated) on Vercel to include KC's login email.
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL` are present
   (already required for the existing admin create-athlete / grants tools).
3. Visit `/dashboard/admin/metrics` while signed in as that email. Everyone else
   gets a 404.

`STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_ANNUAL` enable plan-mix labels and
the MRR estimate; without them, MRR shows "—" and plans group as "Subscription."

---

## 9. Verification + follow-ups

**Verified:** `tsc` 0 errors · `next lint` clean · 16/16 unit tests on the pure
core (`__tests__/admin-metrics.test.ts`) · production build green
(`/dashboard/admin/metrics` compiles as a dynamic route).

**Follow-ups to file:**
- `activity_events` table + event wiring (§5) — the big unlock.
- `subscriptions.unit_amount` + `quantity` for exact MRR.
- Move in-process aggregation to SQL views/RPCs once the user base outgrows
  a single-query fetch (v1 is correct for a beta cohort).
- Arrow-key `role=tablist` semantics on the tab strip (v1 uses accessible links).
- Time-to-first-session (median activation latency) once `activity_events` lands.
