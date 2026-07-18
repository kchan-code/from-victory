// FV-415 part 2 — the year-over-year usage panel. Pure Server Component
// (no "use client", no data access) rendering the exact all-events
// active-athletes series from lib/admin/metrics.ts's `longRange` field. Only
// rendered by the page when a >90d range is selected (365d / 3y).
//
// Raw-sourced points (last 90 days, from activity_events) and rollup-sourced
// points (older, from activity_rollup's event_name-IS-NULL row) are drawn in
// visually distinct colors so it's never ambiguous which table a bar came
// from — both are EXACT counts, this is provenance, not a confidence signal.

import type { UsageTrend } from "@/lib/admin/metrics-core";

import { Badge, Panel, SectionHeader } from "./dashboard-ui";

const GRAIN_LABEL: Record<UsageTrend["grain"], string> = {
  day: "daily",
  week: "weekly",
  month: "monthly",
};

export function LongRangeTrend({
  data,
  rangeLabel,
}: {
  data: UsageTrend;
  rangeLabel: string;
}) {
  if (data.points.length === 0) {
    return null;
  }

  const max = Math.max(1, ...data.points.map((p) => p.activeAthletes));
  const first = data.points[0];
  const last = data.points[data.points.length - 1];
  const hasRaw = data.points.some((p) => p.source === "raw");
  const hasRollup = data.points.some((p) => p.source === "rollup");

  return (
    <Panel>
      <SectionHeader
        eyebrow={`${rangeLabel} · ${GRAIN_LABEL[data.grain]}`}
        title="Active athletes — year-over-year"
        action={<Badge tone="cobalt">exact, from activity_rollup</Badge>}
      />
      <div className="flex items-end gap-[2px]" style={{ height: 160 }}>
        {data.points.map((p) => (
          <div
            key={p.period}
            className="flex-1 flex flex-col items-center justify-end h-full"
            title={`${p.period}: ${p.activeAthletes} active athlete(s) (${p.source === "raw" ? "raw activity_events" : "activity_rollup"})`}
          >
            <div
              className="w-full rounded-t-[2px]"
              style={{
                height: `${Math.max((p.activeAthletes / max) * 100, p.activeAthletes > 0 ? 2 : 0.5)}%`,
                backgroundColor:
                  p.source === "raw" ? "var(--fv-gold)" : "var(--fv-cobalt-bright)",
                opacity: p.source === "raw" ? 0.9 : 0.7,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 font-mono text-[10px] text-cream/40 tabular-nums">
        <span>{first?.period}</span>
        <span>{last?.period}</span>
      </div>
      <div className="flex items-center gap-4 mt-3">
        {hasRaw ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-cream/50">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--fv-gold)" }}
            />
            raw (last 90d)
          </span>
        ) : null}
        {hasRollup ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-cream/50">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--fv-cobalt-bright)" }}
            />
            archived (activity_rollup)
          </span>
        ) : null}
      </div>
      <p className="font-body text-cream/45 text-[11px] mt-3 leading-relaxed">
        Exact count(distinct athlete_id) per {data.grain} across all events —
        never a sum, never suppressed. Every other tab on this page stays
        capped at the last 90 days (raw activity_events); this is the only
        long-range view, made possible by the rollup captured before the
        90-day raw prune.
      </p>
    </Panel>
  );
}
