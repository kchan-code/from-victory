// Admin owner-metrics — PURE CORE.
//
// No server imports, no next/headers, no DB client. Takes plain rows fetched
// elsewhere and shapes them into the dashboard model. Fully unit-testable in a
// node env. The server entry point that supplies a service-role client lives in
// ./metrics.ts (mirrors the lib/dashboard/rhythm-core.ts vs rhythm.ts split).
//
// PRIVACY INVARIANTS (enforced here and in metrics.ts):
//   - This module never receives or shapes journal content. There is no
//     `content` field anywhere in its inputs or outputs.
//   - safety_events are counted EVENT-ONLY (category + timestamp) and bucketed
//     no finer than WEEKLY, with any value below SMALL_N suppressed, so a small
//     beta cohort can't be re-identified.
//   - Every per-athlete signal is aggregated to a count/rate before it leaves
//     this module. Nothing here returns an athlete-identifying row.

import { TOTAL_TRAINING_DAYS } from "@/lib/daily/progression";

// ---------------------------------------------------------------------------
// Privacy: small-N suppression. Any *segmented* count over minor (13-17) data
// below this threshold is hidden so a handful of beta users can't be singled
// out. Headline totals (all athletes, all events) are not segmented and are not
// suppressed. Confirmed against the kids-privacy-officer guardrail (N<5).
// ---------------------------------------------------------------------------
export const SMALL_N = 5;

// FV-135: the private journal and its safety-keyword detection are built but
// DORMANT (zero production writes). This is a product-scope fact, not something
// to infer from whether safety_events happens to be empty. Flip to true only
// when the journal is re-wired (with KC).
export const JOURNAL_ACTIVE = false;

/** Hide a segmented count when the cohort is too small to be non-identifying. */
export function suppressSmallN(count: number): number | null {
  return count < SMALL_N ? null : count;
}

// ---------------------------------------------------------------------------
// Estimated-MRR price book (USD). Published list prices — KC can edit in one
// place. Additional-athlete pricing is per seat beyond the first. Real billing
// uses Stripe tiered/quantity pricing, so this is always an ESTIMATE; the UI
// flags it and points to Stripe for the source of truth.
// ---------------------------------------------------------------------------
export const PRICE_BOOK = {
  monthly: { first: 5, additional: 3 },
  annual: { first: 49, additional: 29 },
};

// ---------------------------------------------------------------------------
// Raw input row shapes — exactly the columns metrics.ts selects. Keeping these
// minimal is itself a privacy control: we never select more than we aggregate.
// ---------------------------------------------------------------------------
// `adult_athlete` (FV-325, dark behind ENABLE_ADULT_SIGNUP) is an athlete-class
// account — the adult buys AND trains. They are counted as trainers below;
// the parent-funnel metrics stay parent-scoped (adults self-pay via their own
// subscription row, attributed in revenue). Including the role here keeps adults
// from silently vanishing from every KPI the moment the flag flips on.
export type ProfileRow = {
  role: "parent" | "athlete" | "adult_athlete";
  created_at: string;
  sport: string | null;
};

/** Athlete-class roles — everyone who actually trains in the app. */
const ATHLETE_ROLES: ReadonlySet<ProfileRow["role"]> = new Set(["athlete", "adult_athlete"]);

export type SessionRow = {
  athlete_id: string;
  catalog_id: string;
  started_at: string;
  completed_at: string | null;
};

export type CatalogRow = { id: string; day_number: number; sport: string };

export type SubscriptionRow = {
  parent_id: string;
  status: string;
  price_id: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
};

export type WaitlistRow = { role: string; sport: string; created_at: string };

export type SafetyEventRow = { category: string; detected_at: string };

export type DeletionRow = { event_type: string; created_at: string };

export type ParentLinkRow = { parent_id: string };

export type PairingRow = { consumed_at: string | null; expires_at: string };

export type AuthEventRow = { action: string; created_at: string };

// ---------------------------------------------------------------------------
// Output model
// ---------------------------------------------------------------------------
export type TrendPoint = { date: string; value: number };
export type WeekPoint = { week: string; value: number };
export type LabeledCount = { label: string; count: number };
export type FunnelStep = { label: string; count: number; rateOfPrev: number; rateOfTop: number };

export type AdminMetrics = {
  generatedAt: string;
  rangeDays: number;
  smallN: number;

  kpis: {
    /** NORTH STAR — distinct athletes who COMPLETED ≥1 session in the last 7 days. */
    weeklyActiveTrainers: number;
    /** 4-week trend of Weekly Active Trainers (one point per trailing week). */
    weeklyActiveTrend: WeekPoint[];
    activeToday: number;
    active7d: number;
    active30d: number;
    stickiness: number;
    totalAthletes: number;
    totalParents: number;
    activeSubscriptions: number;
    activationRate: number;
    /** active+trialing parents ÷ total parents. */
    signupToSubRate: number;
  };

  acquisition: {
    newParents: TrendPoint[];
    newAthletes: TrendPoint[];
    waitlistTotal: number;
    waitlistByRole: LabeledCount[];
    waitlistBySport: LabeledCount[];
  };

  activation: {
    totalAthletes: number;
    started: number;
    activated: number;
    activationRate: number;
    parentSetupRate: number;
    pairingClaimRate: number;
    pairingExpiredUnclaimed: number;
    sportSelectedRate: number;
    quizCompleteRate: number;
    pushOptIn: number;
    pushOptInRate: number;
    /** Ordered conversion funnel for the Overview. */
    funnel: FunnelStep[];
  };

  engagement: {
    dau: number;
    wau: number;
    mau: number;
    stickiness: number;
    activeTrend: TrendPoint[];
    completionsWeekly: WeekPoint[];
    completionRate: number;
    avgSessionsPerActiveAthlete: number;
    /** Per-day started vs completed across the 30-day arc (content drop-off). */
    dayDropoff: { day: number; started: number; completed: number }[];
    /**
     * Per-sport completion. Discriminated on `suppressed` so the suppressed
     * counts are STRUCTURALLY absent (not merely hidden in the UI) — a future
     * client component can't read a below-SMALL_N count off the shape.
     */
    sportSegments: (
      | { sport: string; suppressed: true }
      | { sport: string; suppressed: false; started: number; completionRate: number }
    )[];
  };

  retention: {
    rhythmDistribution: LabeledCount[];
    lapsed7d: number;
    returnRateW1: number | null;
    resurrection: number;
    /** Athlete count whose deepest completed day_number == day (1..30). */
    progressionDepth: { day: number; count: number }[];
  };

  revenue: {
    active: number;
    trialing: number;
    pastDue: number;
    canceled: number;
    cancelAtPeriodEnd: number;
    planMix: LabeledCount[];
    newSubsWeekly: WeekPoint[];
    /** Parents bucketed by seat count (athletes on the account). */
    seatMix: LabeledCount[];
    /** Estimated monthly recurring revenue (USD) — null when plan prices unknown. */
    estMrr: number | null;
    estArr: number | null;
    estimateBasis: string;
    subsCountedInEstimate: number;
  };

  trust: {
    /** Total crisis-keyword detections in range. Event-only, never content. */
    safetyEventsTotal: number;
    /** Weekly category counts; any value < SMALL_N suppressed to null. */
    safetyWeekly: { week: string; category: string; count: number | null }[];
    deletionsWeekly: WeekPoint[];
    authAbuse: LabeledCount[];
    /** Journal + safety detection are built but dormant (FV-135). */
    journalDormant: boolean;
  };
};

// ---------------------------------------------------------------------------
// Date helpers (UTC). `now` is injected for testability.
// ---------------------------------------------------------------------------
const DAY_MS = 24 * 60 * 60 * 1000;

export function toDayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD (timestamps stored UTC)
}

function dayKeyOf(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** UTC Monday that starts the week containing `d`, as YYYY-MM-DD. */
function weekStartKey(d: Date): string {
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (u.getUTCDay() + 6) % 7; // 0 = Monday
  return dayKeyOf(new Date(u.getTime() - dow * DAY_MS));
}

/** Contiguous YYYY-MM-DD keys for the last `days` days, oldest → newest. */
export function dayRange(now: Date, days: number): string[] {
  const keys: string[] = [];
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let i = days - 1; i >= 0; i--) {
    keys.push(dayKeyOf(new Date(end.getTime() - i * DAY_MS)));
  }
  return keys;
}

/** Contiguous week-start keys for the last `weeks` weeks, oldest → newest. */
export function weekRange(now: Date, weeks: number): string[] {
  const thisWeek = weekStartKey(now);
  const start = new Date(`${thisWeek}T00:00:00Z`).getTime();
  const keys: string[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    keys.push(dayKeyOf(new Date(start - i * 7 * DAY_MS)));
  }
  return keys;
}

export function bucketDaily(iso: string[], now: Date, days: number): TrendPoint[] {
  const counts = new Map<string, number>();
  for (const t of iso) counts.set(toDayKey(t), (counts.get(toDayKey(t)) ?? 0) + 1);
  return dayRange(now, days).map((date) => ({ date, value: counts.get(date) ?? 0 }));
}

export function bucketWeekly(iso: string[], now: Date, weeks: number): WeekPoint[] {
  const counts = new Map<string, number>();
  for (const t of iso) {
    const k = weekStartKey(new Date(t));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return weekRange(now, weeks).map((week) => ({ week, value: counts.get(week) ?? 0 }));
}

function withinDays(iso: string, now: Date, days: number): boolean {
  return now.getTime() - new Date(iso).getTime() <= days * DAY_MS;
}

function distinctActiveWithin(sessions: SessionRow[], now: Date, days: number): number {
  const ids = new Set<string>();
  const cutoff = now.getTime() - days * DAY_MS;
  for (const s of sessions) {
    const opened = new Date(s.started_at).getTime();
    const done = s.completed_at ? new Date(s.completed_at).getTime() : -Infinity;
    if (opened >= cutoff || done >= cutoff) ids.add(s.athlete_id);
  }
  return ids.size;
}

function distinctCompletedWithin(sessions: SessionRow[], now: Date, days: number): Set<string> {
  const ids = new Set<string>();
  const cutoff = now.getTime() - days * DAY_MS;
  for (const s of sessions) {
    if (s.completed_at && new Date(s.completed_at).getTime() >= cutoff) ids.add(s.athlete_id);
  }
  return ids;
}

const pct = (num: number, den: number): number => (den === 0 ? 0 : Math.round((num / den) * 100));

function labeledCounts(values: string[]): LabeledCount[] {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Main shaping function. All inputs are already-fetched rows; no I/O here.
// ---------------------------------------------------------------------------
export function shapeAdminMetrics(input: {
  now: Date;
  rangeDays: number;
  profiles: ProfileRow[];
  sessions: SessionRow[];
  catalog: CatalogRow[];
  subscriptions: SubscriptionRow[];
  waitlist: WaitlistRow[];
  pushOptInCount: number;
  safetyEvents: SafetyEventRow[];
  deletions: DeletionRow[];
  parentLinks: ParentLinkRow[];
  pairings: PairingRow[];
  authEvents: AuthEventRow[];
  athleteSportSelectedCount: number;
  athleteQuizCompleteCount: number;
  planLabelFor: (priceId: string | null) => string;
}): AdminMetrics {
  const { now, rangeDays } = input;
  const athletes = input.profiles.filter((p) => ATHLETE_ROLES.has(p.role));
  const parents = input.profiles.filter((p) => p.role === "parent");
  const totalAthletes = athletes.length;
  const totalParents = parents.length;

  // ---- Engagement core (derived from athlete_sessions) ----
  const dau = distinctActiveWithin(input.sessions, now, 1);
  const wau = distinctActiveWithin(input.sessions, now, 7);
  const mau = distinctActiveWithin(input.sessions, now, 30);
  const weeklyActiveTrainers = distinctCompletedWithin(input.sessions, now, 7).size;

  const startedAthleteIds = new Set(input.sessions.map((s) => s.athlete_id));
  const started = startedAthleteIds.size;
  const completedSessions = input.sessions.filter((s) => s.completed_at);
  const completionRate = pct(completedSessions.length, input.sessions.length);

  const completedCountByAthlete = new Map<string, number>();
  for (const s of completedSessions) {
    completedCountByAthlete.set(s.athlete_id, (completedCountByAthlete.get(s.athlete_id) ?? 0) + 1);
  }
  const activated = completedCountByAthlete.size;
  const avgSessionsPerActiveAthlete =
    activated === 0 ? 0 : Math.round((completedSessions.length / activated) * 10) / 10;

  // Weekly Active Trainers — 4-week trend.
  const weeklyActiveTrend = weekRange(now, 4).map((week) => {
    const weekStart = new Date(`${week}T00:00:00Z`).getTime();
    const weekEnd = weekStart + 7 * DAY_MS;
    const ids = new Set<string>();
    for (const s of completedSessions) {
      const t = new Date(s.completed_at as string).getTime();
      if (t >= weekStart && t < weekEnd) ids.add(s.athlete_id);
    }
    return { week, value: ids.size };
  });

  // Daily active trend over the selected range.
  const dayKeys = dayRange(now, rangeDays);
  const activeByDay = new Map<string, Set<string>>(dayKeys.map((k) => [k, new Set()]));
  for (const s of input.sessions) {
    const keys = new Set<string>([toDayKey(s.started_at)]);
    if (s.completed_at) keys.add(toDayKey(s.completed_at));
    for (const k of keys) activeByDay.get(k)?.add(s.athlete_id);
  }
  const activeTrend: TrendPoint[] = dayKeys.map((date) => ({ date, value: activeByDay.get(date)?.size ?? 0 }));
  const completionsWeekly = bucketWeekly(completedSessions.map((s) => s.completed_at as string), now, 8);

  // ---- Activation funnel ----
  const catalogById = new Map(input.catalog.map((c) => [c.id, c]));
  const parentsWithAthlete = new Set(input.parentLinks.map((l) => l.parent_id)).size;
  const pairingsConsumed = input.pairings.filter((p) => p.consumed_at).length;
  const pairingExpiredUnclaimed = input.pairings.filter(
    (p) => !p.consumed_at && new Date(p.expires_at).getTime() < now.getTime(),
  ).length;
  const parentSetupRate = pct(parentsWithAthlete, totalParents);
  const pairingClaimRate = pct(pairingsConsumed, input.pairings.length);
  const sportSelectedRate = pct(input.athleteSportSelectedCount, totalAthletes);
  const quizCompleteRate = pct(input.athleteQuizCompleteCount, totalAthletes);
  const activationRate = pct(activated, totalAthletes);

  const funnelCounts = [
    { label: "Parent signed up", count: totalParents },
    { label: "Athlete created", count: totalAthletes },
    { label: "Started ≥1 session", count: started },
    { label: "Completed ≥1 session", count: activated },
  ];
  const top = funnelCounts[0]?.count ?? 1;
  const funnel: FunnelStep[] = funnelCounts.map((s, i) => ({
    label: s.label,
    count: s.count,
    rateOfPrev: i === 0 ? 100 : pct(s.count, funnelCounts[i - 1]?.count ?? 0),
    rateOfTop: pct(s.count, top),
  }));

  // ---- Retention ----
  let with1to5 = 0, with6to15 = 0, with16plus = 0;
  for (const [, n] of completedCountByAthlete) {
    if (n >= 16) with16plus++;
    else if (n >= 6) with6to15++;
    else if (n >= 1) with1to5++;
  }
  const rhythmDistribution: LabeledCount[] = [
    { label: "Not started", count: Math.max(0, totalAthletes - activated) },
    { label: "1–5", count: with1to5 },
    { label: "6–15", count: with6to15 },
    { label: "16–30", count: with16plus },
  ];

  const activeLast7 = distinctCompletedWithinOrStarted(input.sessions, now, 0, 7);
  const lapsed7d = [...startedAthleteIds].filter((id) => !activeLast7.has(id)).length;

  const priorWindow = distinctCompletedWithinOrStarted(input.sessions, now, 7, 14);
  const returned = [...priorWindow].filter((id) => activeLast7.has(id)).length;
  const returnRateW1 = priorWindow.size === 0 ? null : pct(returned, priorWindow.size);

  // Resurrection: active in last 7d, silent for the prior 14 days, but active before that.
  const gap7to21 = distinctCompletedWithinOrStarted(input.sessions, now, 7, 21);
  const everBefore21 = new Set<string>();
  for (const s of input.sessions) {
    const opened = new Date(s.started_at).getTime();
    if (opened < now.getTime() - 21 * DAY_MS) everBefore21.add(s.athlete_id);
  }
  const resurrection = [...activeLast7].filter(
    (id) => !gap7to21.has(id) && everBefore21.has(id),
  ).length;

  // Progression depth: deepest completed day per athlete.
  const maxDayByAthlete = new Map<string, number>();
  for (const s of completedSessions) {
    const c = catalogById.get(s.catalog_id);
    if (!c) continue;
    maxDayByAthlete.set(s.athlete_id, Math.max(maxDayByAthlete.get(s.athlete_id) ?? 0, c.day_number));
  }
  const depthCounts = new Map<number, number>();
  for (const [, d] of maxDayByAthlete) depthCounts.set(d, (depthCounts.get(d) ?? 0) + 1);
  const progressionDepth = Array.from({ length: TOTAL_TRAINING_DAYS }, (_, i) => ({
    day: i + 1,
    count: depthCounts.get(i + 1) ?? 0,
  }));

  // ---- Content: per-day drop-off + sport segments ----
  const startedByDay = new Map<number, number>();
  const completedByDay = new Map<number, number>();
  const startedBySport = new Map<string, number>();
  const completedBySport = new Map<string, number>();
  for (const s of input.sessions) {
    const c = catalogById.get(s.catalog_id);
    if (!c) continue;
    startedByDay.set(c.day_number, (startedByDay.get(c.day_number) ?? 0) + 1);
    startedBySport.set(c.sport, (startedBySport.get(c.sport) ?? 0) + 1);
    if (s.completed_at) {
      completedByDay.set(c.day_number, (completedByDay.get(c.day_number) ?? 0) + 1);
      completedBySport.set(c.sport, (completedBySport.get(c.sport) ?? 0) + 1);
    }
  }
  const dayDropoff = Array.from({ length: TOTAL_TRAINING_DAYS }, (_, i) => ({
    day: i + 1,
    started: startedByDay.get(i + 1) ?? 0,
    completed: completedByDay.get(i + 1) ?? 0,
  }));
  const sportSegments = [...startedBySport.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([sport, s]) =>
      s < SMALL_N
        ? ({ sport, suppressed: true } as const)
        : ({
            sport,
            suppressed: false,
            started: s,
            completionRate: pct(completedBySport.get(sport) ?? 0, s),
          } as const),
    );

  // ---- Revenue ----
  const subStatus = (st: string) => input.subscriptions.filter((s) => s.status === st).length;
  const activeOrTrialing = input.subscriptions.filter((s) => s.status === "active" || s.status === "trialing");
  const seatByParent = new Map<string, number>();
  for (const l of input.parentLinks) seatByParent.set(l.parent_id, (seatByParent.get(l.parent_id) ?? 0) + 1);

  const planMixMap = new Map<string, number>();
  let estMrr = 0;
  let subsCountedInEstimate = 0;
  for (const s of activeOrTrialing) {
    const label = input.planLabelFor(s.price_id);
    planMixMap.set(label, (planMixMap.get(label) ?? 0) + 1);
    const seats = seatByParent.get(s.parent_id) ?? 1;
    if (label === "Monthly") {
      estMrr += PRICE_BOOK.monthly.first + Math.max(0, seats - 1) * PRICE_BOOK.monthly.additional;
      subsCountedInEstimate++;
    } else if (label === "Annual") {
      estMrr += (PRICE_BOOK.annual.first + Math.max(0, seats - 1) * PRICE_BOOK.annual.additional) / 12;
      subsCountedInEstimate++;
    }
  }
  const mrrKnown = subsCountedInEstimate > 0;
  const planMix = [...planMixMap.entries()].map(([label, count]) => ({ label, count }));

  const seatTier = new Map<string, number>();
  for (const [, n] of seatByParent) {
    const key = n >= 3 ? "3+ athletes" : n === 2 ? "2 athletes" : "1 athlete";
    seatTier.set(key, (seatTier.get(key) ?? 0) + 1);
  }
  const seatMix: LabeledCount[] = ["1 athlete", "2 athletes", "3+ athletes"]
    .map((label) => ({ label, count: seatTier.get(label) ?? 0 }))
    .filter((s) => s.count > 0);

  // ---- Trust / safety (weekly, suppressed < SMALL_N) ----
  const inRange = (iso: string) => withinDays(iso, now, rangeDays);
  const safetyInRange = input.safetyEvents.filter((e) => inRange(e.detected_at));
  const weeks = weekRange(now, Math.max(4, Math.ceil(rangeDays / 7)));
  const safetyCells = new Map<string, number>();
  const categories = new Set<string>();
  for (const e of safetyInRange) {
    categories.add(e.category);
    const key = `${weekStartKey(new Date(e.detected_at))}|${e.category}`;
    safetyCells.set(key, (safetyCells.get(key) ?? 0) + 1);
  }
  const safetyWeekly: { week: string; category: string; count: number | null }[] = [];
  for (const week of weeks) {
    for (const category of categories) {
      const raw = safetyCells.get(`${week}|${category}`) ?? 0;
      safetyWeekly.push({ week, category, count: raw < SMALL_N ? null : raw });
    }
  }

  const deletionsWeekly = bucketWeekly(
    input.deletions.filter((d) => inRange(d.created_at)).map((d) => d.created_at),
    now,
    8,
  );
  const authAbuse = labeledCounts(input.authEvents.filter((e) => inRange(e.created_at)).map((e) => e.action));

  return {
    generatedAt: now.toISOString(),
    rangeDays,
    smallN: SMALL_N,
    kpis: {
      weeklyActiveTrainers,
      weeklyActiveTrend,
      activeToday: dau,
      active7d: wau,
      active30d: mau,
      stickiness: pct(dau, mau),
      totalAthletes,
      totalParents,
      activeSubscriptions: activeOrTrialing.length,
      activationRate,
      signupToSubRate: pct(activeOrTrialing.length, totalParents),
    },
    acquisition: {
      newParents: bucketDaily(parents.map((p) => p.created_at), now, rangeDays),
      newAthletes: bucketDaily(athletes.map((a) => a.created_at), now, rangeDays),
      waitlistTotal: input.waitlist.length,
      waitlistByRole: labeledCounts(input.waitlist.map((w) => w.role)),
      waitlistBySport: labeledCounts(input.waitlist.map((w) => w.sport)),
    },
    activation: {
      totalAthletes,
      started,
      activated,
      activationRate,
      parentSetupRate,
      pairingClaimRate,
      pairingExpiredUnclaimed,
      sportSelectedRate,
      quizCompleteRate,
      pushOptIn: input.pushOptInCount,
      pushOptInRate: pct(input.pushOptInCount, totalAthletes),
      funnel,
    },
    engagement: {
      dau,
      wau,
      mau,
      stickiness: pct(dau, mau),
      activeTrend,
      completionsWeekly,
      completionRate,
      avgSessionsPerActiveAthlete,
      dayDropoff,
      sportSegments,
    },
    retention: {
      rhythmDistribution,
      lapsed7d,
      returnRateW1,
      resurrection,
      progressionDepth,
    },
    revenue: {
      active: subStatus("active"),
      trialing: subStatus("trialing"),
      pastDue: subStatus("past_due"),
      canceled: subStatus("canceled"),
      cancelAtPeriodEnd: input.subscriptions.filter((s) => s.cancel_at_period_end).length,
      planMix,
      newSubsWeekly: bucketWeekly(input.subscriptions.map((s) => s.created_at), now, 8),
      seatMix,
      // ARR is derived from the rounded MRR so the two headline numbers stay
      // internally consistent (shown MRR × 12 == shown ARR).
      estMrr: mrrKnown ? Math.round(estMrr) : null,
      estArr: mrrKnown ? Math.round(estMrr) * 12 : null,
      estimateBasis: mrrKnown
        ? `Estimate from published list prices over ${subsCountedInEstimate} active/trialing plan(s) with known price IDs. Excludes comps, discounts, proration. Verify in Stripe.`
        : "Plan price IDs not configured in this environment — set STRIPE_PRICE_ID_MONTHLY/ANNUAL to estimate MRR. Verify in Stripe.",
      subsCountedInEstimate,
    },
    trust: {
      safetyEventsTotal: safetyInRange.length,
      safetyWeekly,
      deletionsWeekly,
      authAbuse,
      journalDormant: !JOURNAL_ACTIVE,
    },
  };
}

/**
 * Distinct athletes active (opened OR completed) in the window [now-hi, now-lo)
 * days ago. lo=0 → "within the last `hi` days".
 */
function distinctCompletedWithinOrStarted(
  sessions: SessionRow[],
  now: Date,
  loDays: number,
  hiDays: number,
): Set<string> {
  const hi = now.getTime() - loDays * DAY_MS;
  const lo = now.getTime() - hiDays * DAY_MS;
  const ids = new Set<string>();
  for (const s of sessions) {
    const opened = new Date(s.started_at).getTime();
    const done = s.completed_at ? new Date(s.completed_at).getTime() : -Infinity;
    if ((opened >= lo && opened < hi) || (done >= lo && done < hi)) ids.add(s.athlete_id);
  }
  return ids;
}
