// Owner-metrics pure core. Imports from lib/admin/metrics-core (no server-only,
// no createClient) so it runs in the vitest node env. The service-role wrapper
// (metrics.ts) only wires createServiceClient() and is covered by integration.

import { describe, it, expect } from "vitest";

import {
  shapeAdminMetrics,
  type AuthEventRow,
  type CatalogRow,
  type DeletionRow,
  type PairingRow,
  type ParentLinkRow,
  type ProfileRow,
  type SafetyEventRow,
  type SessionRow,
  type SubscriptionRow,
  type WaitlistRow,
} from "@/lib/admin/metrics-core";

const NOW = new Date("2026-06-30T12:00:00Z");

// Plan resolver standing in for env-configured Stripe price IDs.
const planLabelFor = (id: string | null) =>
  id === "m" ? "Monthly" : id === "a" ? "Annual" : "Subscription";

const catalog: CatalogRow[] = [
  { id: "hk1", day_number: 1, sport: "hockey" },
  { id: "hk2", day_number: 2, sport: "hockey" },
  { id: "hk3", day_number: 3, sport: "hockey" },
  { id: "bk1", day_number: 1, sport: "basketball" },
];

const profiles: ProfileRow[] = [
  { role: "parent", created_at: "2026-06-25T00:00:00Z", sport: null },
  { role: "parent", created_at: "2026-06-25T00:00:00Z", sport: null },
  { role: "parent", created_at: "2026-06-25T00:00:00Z", sport: null },
  { role: "athlete", created_at: "2026-06-25T00:00:00Z", sport: "hockey" },
  { role: "athlete", created_at: "2026-06-25T00:00:00Z", sport: "hockey" },
  { role: "athlete", created_at: "2026-06-25T00:00:00Z", sport: "hockey" },
  { role: "athlete", created_at: "2026-06-25T00:00:00Z", sport: "hockey" },
  { role: "athlete", created_at: "2026-06-25T00:00:00Z", sport: "basketball" },
  { role: "athlete", created_at: "2026-06-25T00:00:00Z", sport: "basketball" },
];

const sessions: SessionRow[] = [
  { athlete_id: "A1", catalog_id: "hk1", started_at: "2026-06-29T08:00:00Z", completed_at: "2026-06-29T08:10:00Z" },
  { athlete_id: "A1", catalog_id: "hk2", started_at: "2026-06-30T08:00:00Z", completed_at: "2026-06-30T08:10:00Z" },
  { athlete_id: "A2", catalog_id: "hk1", started_at: "2026-06-28T08:00:00Z", completed_at: "2026-06-28T08:10:00Z" },
  { athlete_id: "A3", catalog_id: "hk1", started_at: "2026-06-29T08:00:00Z", completed_at: null }, // started, never completed
  { athlete_id: "A4", catalog_id: "hk1", started_at: "2026-06-10T08:00:00Z", completed_at: "2026-06-10T08:10:00Z" }, // in 30d, not 7d
  { athlete_id: "A5", catalog_id: "bk1", started_at: "2026-06-30T09:00:00Z", completed_at: "2026-06-30T09:10:00Z" },
  // A6 has no sessions
];

const parentLinks: ParentLinkRow[] = [
  { parent_id: "P1" },
  { parent_id: "P1" }, // P1 has 2 seats
  { parent_id: "P2" }, // P2 has 1 seat
  { parent_id: "P3" },
  { parent_id: "P3" },
  { parent_id: "P3" }, // P3 has 3 seats
];

const subscriptions: SubscriptionRow[] = [
  { parent_id: "P1", status: "active", price_id: "m", cancel_at_period_end: false, created_at: "2026-06-20T00:00:00Z" },
  { parent_id: "P2", status: "trialing", price_id: "m", cancel_at_period_end: false, created_at: "2026-06-28T00:00:00Z" },
  { parent_id: "P3", status: "active", price_id: "a", cancel_at_period_end: true, created_at: "2026-06-10T00:00:00Z" },
];

const pairings: PairingRow[] = [
  { consumed_at: "2026-06-26T00:00:00Z", expires_at: "2026-06-27T00:00:00Z" },
  { consumed_at: "2026-06-27T00:00:00Z", expires_at: "2026-06-28T00:00:00Z" },
  { consumed_at: null, expires_at: "2026-06-20T00:00:00Z" }, // unclaimed + expired
];

const safetyEvents: SafetyEventRow[] = [
  { category: "crisis", detected_at: "2026-06-29T00:00:00Z" },
  { category: "crisis", detected_at: "2026-06-29T00:00:00Z" },
  { category: "crisis", detected_at: "2026-06-29T00:00:00Z" },
];

const waitlist: WaitlistRow[] = [
  { role: "parent", sport: "hockey", created_at: "2026-06-20T00:00:00Z" },
  { role: "coach", sport: "soccer", created_at: "2026-06-21T00:00:00Z" },
];

const deletions: DeletionRow[] = [
  { event_type: "athlete_deleted", created_at: "2026-06-28T00:00:00Z" },
];

const authEvents: AuthEventRow[] = [
  { action: "sign_in", created_at: "2026-06-29T00:00:00Z" },
  { action: "sign_in", created_at: "2026-06-29T00:00:00Z" },
];

function build() {
  return shapeAdminMetrics({
    now: NOW,
    rangeDays: 30,
    profiles,
    sessions,
    catalog,
    subscriptions,
    waitlist,
    pushOptInCount: 2,
    safetyEvents,
    deletions,
    parentLinks,
    pairings,
    authEvents,
    athleteSportSelectedCount: 5,
    athleteQuizCompleteCount: 3,
    planLabelFor,
  });
}

describe("shapeAdminMetrics — headline KPIs", () => {
  const m = build();

  it("north star = distinct athletes who COMPLETED a session in the last 7 days", () => {
    // A1 (06-29, 06-30), A2 (06-28), A5 (06-30) = 3. A4 (06-10) excluded.
    expect(m.kpis.weeklyActiveTrainers).toBe(3);
  });

  it("counts parents and athletes by role", () => {
    expect(m.kpis.totalParents).toBe(3);
    expect(m.kpis.totalAthletes).toBe(6);
  });

  it("activation rate = completed ≥1 session ÷ all athletes", () => {
    // A1,A2,A4,A5 completed → 4 of 6 = 67%.
    expect(m.activation.activated).toBe(4);
    expect(m.kpis.activationRate).toBe(67);
  });

  it("30-day active (MAU proxy) counts opened-or-completed", () => {
    // A1..A5 all active within 30d (A6 never).
    expect(m.kpis.active30d).toBe(5);
  });

  it("active subscriptions = active + trialing; signup→sub over parents", () => {
    expect(m.kpis.activeSubscriptions).toBe(3);
    expect(m.kpis.signupToSubRate).toBe(100);
  });
});

describe("activation funnel + onboarding", () => {
  const m = build();

  it("funnel steps carry the right counts in order", () => {
    expect(m.activation.funnel.map((s) => s.count)).toEqual([3, 6, 5, 4]);
  });

  it("device-pairing claim rate + expired-unclaimed", () => {
    expect(m.activation.pairingClaimRate).toBe(67); // 2 of 3
    expect(m.activation.pairingExpiredUnclaimed).toBe(1);
  });

  it("parent-setup, sport-selection and quiz rates", () => {
    expect(m.activation.parentSetupRate).toBe(100); // 3 of 3 parents have an athlete
    expect(m.activation.sportSelectedRate).toBe(83); // 5 of 6
    expect(m.activation.quizCompleteRate).toBe(50); // 3 of 6
  });
});

describe("engagement", () => {
  const m = build();

  it("completion rate = completed ÷ started sessions", () => {
    // 5 completed of 6 session rows = 83%.
    expect(m.engagement.completionRate).toBe(83);
  });

  it("sport segments: suppress < 5, expose ≥ 5", () => {
    const hockey = m.engagement.sportSegments.find((s) => s.sport === "hockey");
    const basketball = m.engagement.sportSegments.find((s) => s.sport === "basketball");
    expect(hockey?.suppressed).toBe(false); // 5 hockey starts
    expect(hockey?.completionRate).toBe(80); // 4 of 5
    expect(basketball?.suppressed).toBe(true); // 1 basketball start
  });

  it("per-day drop-off tracks started vs completed by catalog day", () => {
    const day1 = m.engagement.dayDropoff.find((d) => d.day === 1);
    expect(day1).toEqual({ day: 1, started: 5, completed: 4 });
  });
});

describe("revenue — seat-aware MRR estimate", () => {
  const m = build();

  it("estimates MRR from list prices and seat counts", () => {
    // P1 monthly 2 seats: 5 + 3 = 8
    // P2 monthly 1 seat (trialing, still counted): 5
    // P3 annual 3 seats: (49 + 2*29)/12 = 107/12 = 8.9167
    // total ≈ 21.92 → 22
    expect(m.revenue.estMrr).toBe(22);
    expect(m.revenue.estArr).toBe(264);
    expect(m.revenue.subsCountedInEstimate).toBe(3);
  });

  it("buckets parents by seat tier", () => {
    expect(m.revenue.seatMix).toEqual([
      { label: "1 athlete", count: 1 },
      { label: "2 athletes", count: 1 },
      { label: "3+ athletes", count: 1 },
    ]);
  });

  it("returns null MRR when no plan price IDs are known", () => {
    const unknown = shapeAdminMetrics({
      now: NOW,
      rangeDays: 30,
      profiles,
      sessions,
      catalog,
      subscriptions: subscriptions.map((s) => ({ ...s, price_id: null })),
      waitlist,
      pushOptInCount: 2,
      safetyEvents,
      deletions,
      parentLinks,
      pairings,
      authEvents,
      athleteSportSelectedCount: 5,
      athleteQuizCompleteCount: 3,
      planLabelFor,
    });
    expect(unknown.revenue.estMrr).toBeNull();
  });
});

describe("privacy — safety events are weekly + suppressed below SMALL_N", () => {
  const m = build();

  it("counts the total but hides any weekly cell below 5", () => {
    expect(m.trust.safetyEventsTotal).toBe(3);
    // 3 crisis events in one week → cell suppressed to null.
    const crisisCells = m.trust.safetyWeekly.filter((c) => c.category === "crisis");
    expect(crisisCells.some((c) => c.count !== null)).toBe(false);
  });

  it("flags journal/safety dormant when there are zero events", () => {
    const empty = shapeAdminMetrics({
      now: NOW,
      rangeDays: 30,
      profiles,
      sessions,
      catalog,
      subscriptions,
      waitlist,
      pushOptInCount: 2,
      safetyEvents: [],
      deletions,
      parentLinks,
      pairings,
      authEvents,
      athleteSportSelectedCount: 5,
      athleteQuizCompleteCount: 3,
      planLabelFor,
    });
    expect(empty.trust.journalDormant).toBe(true);
  });
});
