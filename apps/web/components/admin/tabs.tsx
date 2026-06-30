// Owner-dashboard tab panels. Pure Server Components — each takes the already
// computed AdminMetrics (server-side, aggregate-only) and renders. No data
// access, no client JS. activity_events-backed panels show live data when events
// exist and an "awaiting events" state until they do.

import type { AdminMetrics } from "@/lib/admin/metrics-core";

import {
  AreaTrend,
  BarSeries,
  Badge,
  FunnelBars,
  HBars,
  MetricCard,
  NeedsInstrumentation,
  Panel,
  SectionHeader,
  StatRow,
  WaitingForEvents,
  WeekBars,
} from "./dashboard-ui";

const pctStr = (n: number) => `${n}%`;
const num = (n: number) => n.toLocaleString();
const usd = (n: number | null) => (n === null ? "—" : `$${n.toLocaleString()}`);

// ===========================================================================
// OVERVIEW
// ===========================================================================
export function OverviewTab({ m }: { m: AdminMetrics }) {
  const k = m.kpis;
  const a = m.activation;
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="★ Weekly Active Trainers"
          value={num(k.weeklyActiveTrainers)}
          sub={`${pctStr(k.totalAthletes ? Math.round((k.weeklyActiveTrainers / k.totalAthletes) * 100) : 0)} of athletes · completed a session in 7d`}
          accent="gold"
          trend={k.weeklyActiveTrend.map((w) => ({ date: w.week, value: w.value }))}
        />
        <MetricCard
          label="Activated athletes"
          value={pctStr(k.activationRate)}
          sub={`${num(a.activated)} of ${num(k.totalAthletes)} completed ≥1 session`}
          accent="cobalt"
        />
        <MetricCard
          label="Active subscriptions"
          value={num(k.activeSubscriptions)}
          sub={`${num(m.revenue.active)} active · ${num(m.revenue.trialing)} trialing`}
          accent="success"
        />
        <MetricCard
          label="Approx MRR"
          value={usd(m.revenue.estMrr)}
          sub="Estimate — verify in Stripe"
          accent="gold"
        />
        <MetricCard
          label="Signup → subscription"
          value={pctStr(k.signupToSubRate)}
          sub={`${num(k.activeSubscriptions)} of ${num(k.totalParents)} parents pay`}
          accent="silver"
        />
        <MetricCard
          label="Athlete creation rate"
          value={pctStr(a.parentSetupRate)}
          sub="Parents who created ≥1 athlete"
          accent="silver"
        />
        <MetricCard
          label="Device pairing claim"
          value={pctStr(a.pairingClaimRate)}
          sub={`${num(a.pairingExpiredUnclaimed)} expired unclaimed`}
          accent="silver"
        />
        <MetricCard
          label="Push opt-in"
          value={pctStr(a.pushOptInRate)}
          sub={`${num(a.pushOptIn)} athletes · re-engagement ceiling`}
          accent="silver"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel>
          <SectionHeader
            eyebrow="The product's #1 leak"
            title="Activation funnel"
            action={<Badge tone="gold">parent buys → athlete trains</Badge>}
          />
          <FunnelBars steps={a.funnel} />
          <p className="font-body text-cream/45 text-[11px] mt-4 leading-relaxed">
            Each step is the share of the previous one. A parent who pays but
            never creates the athlete account — or whose athlete never completes
            a first session — gets zero value. This funnel is where to fight
            churn first.
          </p>
        </Panel>
        <Panel>
          <SectionHeader eyebrow={`last ${m.rangeDays} days`} title="New athletes" />
          <AreaTrend
            data={m.acquisition.newAthletes}
            accent="cobalt"
            height={120}
            ariaLabel="New athlete accounts per day"
          />
          <div className="mt-4">
            <StatRow label="New parents (buyers)" value={num(sum(m.acquisition.newParents))} />
            <StatRow label="New athletes (users)" value={num(sum(m.acquisition.newAthletes))} />
            <StatRow label="Waitlist leads" value={num(m.acquisition.waitlistTotal)} accent="gold" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ===========================================================================
// ENGAGEMENT
// ===========================================================================
export function EngagementTab({ m }: { m: AdminMetrics }) {
  const e = m.engagement;
  const inst = m.instrumented;
  const maxCompleted = Math.max(1, ...e.dayDropoff.map((d) => d.completed));
  const medianCompleted = median(e.dayDropoff.map((d) => d.completed));
  const hasPregame = inst.pregameStarts > 0 || inst.pregameCompletes > 0;
  return (
    <div className="flex flex-col gap-8">
      {/* TRUE activity from activity_events (app_open). */}
      <div>
        <SectionHeader
          eyebrow="from activity_events"
          title="Active athletes (app opens)"
          action={inst.hasEvents ? <Badge tone="cobalt">live</Badge> : <Badge tone="warning">awaiting events</Badge>}
        />
        {inst.hasEvents ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="DAU" value={num(inst.dau)} sub="distinct app-opens today" accent="gold" trend={inst.appOpenTrend} />
            <MetricCard label="WAU" value={num(inst.wau)} sub="…in the last 7 days" accent="cobalt" />
            <MetricCard label="MAU" value={num(inst.mau)} sub="…in the last 30 days" accent="cobalt" />
            <MetricCard label="Stickiness" value={pctStr(inst.stickiness)} sub="DAU ÷ MAU" accent="silver" />
          </div>
        ) : (
          <WaitingForEvents what="True DAU/WAU/MAU fill in as athletes open the app. The activity_events instrumentation is live; events appear once the migration is applied in prod and the first app_open lands." />
        )}
      </div>

      {/* Session-based engagement (always available from athlete_sessions). */}
      <div>
        <SectionHeader eyebrow="from the daily loop" title="Daily training" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Daily completion rate" value={pctStr(e.completionRate)} sub="completed ÷ started" accent="gold" />
          <MetricCard label="Sessions / active athlete" value={String(e.avgSessionsPerActiveAthlete)} sub="rhythm intensity (not a streak)" accent="cobalt" />
          <MetricCard label="Training-active 30d" value={num(e.mau)} sub="opened a daily session" accent="silver" />
          <MetricCard label="Daily stickiness" value={pctStr(e.stickiness)} sub="daily ÷ monthly (sessions)" accent="silver" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel>
          <SectionHeader eyebrow="last 8 weeks" title="Sessions completed / week" />
          <WeekBars data={e.completionsWeekly} accent="cobalt" height={150} />
        </Panel>
        <Panel>
          <SectionHeader eyebrow="30-day arc" title="Content drop-off by day" />
          <BarSeries
            data={e.dayDropoff.map((d) => ({ label: d.day, value: d.completed }))}
            accent="gold"
            height={150}
            ariaLabel="Completions by training day 1 to 30"
          />
          <div className="flex justify-between mt-1.5 font-mono text-[9px] text-cream/35">
            <span>Day 1</span><span>Day 10</span><span>Day 20</span><span>Day 30</span>
          </div>
          <p className="font-body text-cream/45 text-[11px] mt-3">
            Where the bars fall off is where athletes stop. Peak {maxCompleted} ·
            median {medianCompleted} completions/day.
          </p>
        </Panel>
      </div>

      <Panel>
        <SectionHeader eyebrow="by sport" title="Completion by sport" action={<Badge>N&lt;5 suppressed</Badge>} />
        <ul className="flex flex-col">
          {e.sportSegments.length === 0 ? (
            <p className="font-body text-cream/45 text-[13px]">No sessions yet.</p>
          ) : (
            e.sportSegments.map((s) => (
              <div key={s.sport} className="flex items-center justify-between py-3 border-b border-hairline last:border-0">
                <span className="font-mono uppercase tracking-[0.12em] text-[11px] text-cream/70">{s.sport}</span>
                {s.suppressed ? (
                  <span className="font-mono text-cream/40 text-[12px]">&lt;5 athletes</span>
                ) : (
                  <span className="font-mono text-cream text-[13px] tabular-nums">
                    {pctStr(s.completionRate)} <span className="text-cream/40">· {num(s.started)} started</span>
                  </span>
                )}
              </div>
            ))
          )}
        </ul>
      </Panel>

      <Panel>
        <SectionHeader
          eyebrow="from activity_events"
          title="Pregame guided-audio funnel"
          action={<Badge tone="gold">premium</Badge>}
        />
        {hasPregame ? (
          <>
            <FunnelBars
              steps={[
                { label: "Started", count: inst.pregameStarts, rateOfPrev: 100, rateOfTop: 100 },
                {
                  label: "Completed the audio",
                  count: inst.pregameCompletes,
                  rateOfPrev: inst.pregameCompletionRate,
                  rateOfTop: inst.pregameCompletionRate,
                },
              ]}
            />
            <div className="mt-6">
              <SectionHeader eyebrow="last 8 weeks" title="Pregame completions / week" />
              <WeekBars data={inst.pregameCompletesWeekly} accent="gold" height={120} />
            </div>
            <p className="font-body text-cream/45 text-[11px] mt-3">
              {pctStr(inst.pregameCompletionRate)} of started sessions finished the
              audio in the last {m.rangeDays} days. Clip-vs-timer split is the next
              dimension to add.
            </p>
          </>
        ) : (
          <WaitingForEvents
            what={
              inst.hasEvents
                ? "Events are flowing, but no pregame session has been run yet in this window."
                : "Pregame start/complete events appear here once the migration is applied in prod and athletes run the guided audio."
            }
          />
        )}
      </Panel>

      {inst.hasEvents &&
      inst.practiceStarts + inst.postgameOpens + inst.pushClicks > 0 ? (
        <p className="font-body text-cream/40 text-[11px]">
          Other surfaces — practice {num(inst.practiceStarts)} · postgame{" "}
          {num(inst.postgameOpens)} · push-clicks {num(inst.pushClicks)} (wiring is
          a follow-up; counts shown when present).
        </p>
      ) : null}
    </div>
  );
}

// ===========================================================================
// RETENTION
// ===========================================================================
export function RetentionTab({ m }: { m: AdminMetrics }) {
  const r = m.retention;
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Week-1 return rate"
          value={r.returnRateW1 === null ? "—" : pctStr(r.returnRateW1)}
          sub="returned & trained the next week"
          accent="gold"
        />
        <MetricCard label="Resurrected" value={num(r.resurrection)} sub="returned after a 14+ day gap" accent="success" />
        <MetricCard label="Lapsed (7d quiet)" value={num(r.lapsed7d)} sub="started, silent 7+ days — gently re-invite" accent="warning" />
        <MetricCard label="Deepest depth" value={`${maxDepth(r.progressionDepth)}/30`} sub="furthest day reached by anyone" accent="silver" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel>
          <SectionHeader eyebrow="rhythm, not streaks" title="Rhythm depth distribution" />
          <HBars data={r.rhythmDistribution} accent="gold" />
          <p className="font-body text-cream/45 text-[11px] mt-4">
            How many sessions each athlete has completed in their lifetime.
            &ldquo;Not started&rdquo; is the activation gap; the deeper buckets
            are the formed habit.
          </p>
        </Panel>
        <Panel>
          <SectionHeader eyebrow="30-day arc" title="Progression depth" />
          <BarSeries
            data={r.progressionDepth.map((d) => ({ label: d.day, value: d.count }))}
            accent="cobalt"
            height={150}
            ariaLabel="Number of athletes by deepest day reached"
          />
          <p className="font-body text-cream/45 text-[11px] mt-3">
            Athletes grouped by the furthest training day they&rsquo;ve reached.
            A wall at a given day flags content worth re-cutting.
          </p>
        </Panel>
      </div>

      <NeedsInstrumentation
        title="Full weekly retention cohorts (W0→W1→W2→W4)"
        what="A true cohort grid (sign-up week × weeks-since) needs a per-day activity signal that survives content changes — the activity_events table. Today only a coarse week-1 return rate is derivable from athlete_sessions. Time-to-first-session (median activation latency) also lands once app_open / daily_complete events exist."
      />
    </div>
  );
}

// ===========================================================================
// REVENUE
// ===========================================================================
export function RevenueTab({ m }: { m: AdminMetrics }) {
  const rev = m.revenue;
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active subscriptions" value={num(m.kpis.activeSubscriptions)} sub={`${num(rev.active)} active · ${num(rev.trialing)} trialing`} accent="success" />
        <MetricCard label="Approx MRR" value={usd(rev.estMrr)} sub="Estimate — verify in Stripe" accent="gold" />
        <MetricCard label="Approx ARR" value={usd(rev.estArr)} sub="MRR × 12, estimate" accent="gold" />
        <MetricCard label="Cancellation queue" value={num(rev.cancelAtPeriodEnd)} sub="cancel at period end" accent="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel>
          <SectionHeader eyebrow="last 8 weeks" title="New subscriptions / week" />
          <WeekBars data={rev.newSubsWeekly} accent="gold" height={150} />
        </Panel>
        <Panel>
          <SectionHeader eyebrow="active + trialing" title="Plan mix" />
          <HBars data={rev.planMix} accent="cobalt" emptyLabel="No active plans yet" />
          <div className="mt-5">
            <SectionHeader title="Seat mix" />
            <HBars data={rev.seatMix} accent="gold" emptyLabel="No subscriptions yet" />
          </div>
        </Panel>
      </div>

      <Panel>
        <SectionHeader title="Churn & status" />
        <StatRow label="Past due" value={num(rev.pastDue)} accent={rev.pastDue > 0 ? "warning" : undefined} />
        <StatRow label="Canceled" value={num(rev.canceled)} accent={rev.canceled > 0 ? "danger" : undefined} />
        <StatRow label="Scheduled to cancel" value={num(rev.cancelAtPeriodEnd)} />
        <p className="font-body text-cream/45 text-[11px] mt-4 leading-relaxed">
          {rev.estimateBasis}
        </p>
      </Panel>
    </div>
  );
}

// ===========================================================================
// SAFETY & TRUST
// ===========================================================================
export function TrustTab({ m }: { m: AdminMetrics }) {
  const t = m.trust;
  const weeks = [...new Set(t.safetyWeekly.map((c) => c.week))];
  const categories = [...new Set(t.safetyWeekly.map((c) => c.category))];
  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-warning/30 bg-warning/[0.06] px-5 py-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge tone="warning">Guardrail</Badge>
          <span className="font-display font-bold uppercase tracking-[0.04em] text-cream/85 text-[13px]">
            Aggregate, event-only — never content
          </span>
        </div>
        <p className="font-body text-cream/60 text-[12.5px] leading-relaxed">
          Safety figures are crisis-keyword <em>detection counts</em> only —
          never the journal text, never which athlete, never a keyword. Weekly
          buckets below {m.smallN} are hidden so no individual can be
          re-identified. No parent is ever shown a safety signal about their
          athlete; this surface is yours alone.
        </p>
      </div>

      {t.journalDormant ? (
        <Panel>
          <SectionHeader title="Safety detections" action={<Badge tone="cobalt">dormant</Badge>} />
          <p className="font-body text-cream/55 text-[13px] leading-relaxed">
            The private journal and its safety-keyword detection are built but
            currently <strong className="text-cream/80">dormant</strong> (FV-135) —
            zero entries are written, so there are no detection events to report.
            When the journal is re-wired, this panel populates automatically with
            suppressed weekly category counts.
          </p>
        </Panel>
      ) : (
        <Panel>
          <SectionHeader eyebrow="weekly · suppressed < 5" title="Safety detections by category" />
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="font-mono uppercase tracking-[0.12em] text-[10px] text-cream/40 py-2 pr-4">Week</th>
                  {categories.map((c) => (
                    <th key={c} className="font-mono uppercase tracking-[0.12em] text-[10px] text-cream/40 py-2 px-3">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => (
                  <tr key={w} className="border-t border-hairline">
                    <td className="font-mono text-[12px] text-cream/60 py-2 pr-4 tabular-nums">{w.slice(5)}</td>
                    {categories.map((c) => {
                      const cell = t.safetyWeekly.find((x) => x.week === w && x.category === c);
                      return (
                        <td key={c} className="font-mono text-[13px] py-2 px-3 tabular-nums">
                          {cell?.count === null ? <span className="text-cream/30">&lt;5</span> : <span className="text-cream">{cell?.count ?? 0}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel>
          <SectionHeader eyebrow="last 8 weeks" title="Account & athlete deletions" />
          <WeekBars data={t.deletionsWeekly} accent="danger" height={130} />
          <p className="font-body text-cream/45 text-[11px] mt-3">
            The hard churn / trust signal. Parents control deletion; all data
            cascades within 30 days.
          </p>
        </Panel>
        <Panel>
          <SectionHeader eyebrow={`last ${m.rangeDays} days`} title="Auth rate-limit hits" />
          {t.authAbuse.length === 0 ? (
            <p className="font-body text-cream/45 text-[13px]">No rate-limit events — clean.</p>
          ) : (
            <HBars data={t.authAbuse} accent="warning" />
          )}
          <p className="font-body text-cream/45 text-[11px] mt-3">
            A spike on sign-in or pairing means abuse or a broken client — an
            ops signal, not user analytics.
          </p>
        </Panel>
      </div>
    </div>
  );
}

// --- small helpers ---
function sum(points: { value: number }[]): number {
  return points.reduce((acc, p) => acc + p.value, 0);
}
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  if (s.length % 2) return s[mid] ?? 0;
  return Math.round(((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2);
}
function maxDepth(depth: { day: number; count: number }[]): number {
  const reached = depth.filter((d) => d.count > 0).map((d) => d.day);
  return reached.length ? Math.max(...reached) : 0;
}
