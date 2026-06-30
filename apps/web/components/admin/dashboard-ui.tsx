// Owner-dashboard presentational primitives.
//
// All pure Server Components — no "use client", no interactivity. Charts are
// hand-rolled inline SVG (same approach as components/ui/RhythmRing.tsx) so the
// dashboard adds ZERO new dependency. Colors come from brand tokens: gold is the
// signature accent, cobalt is reserved for progress/interaction, cream/silver
// for text, hairline borders, charcoal surfaces. Dark-mode-first throughout.

import type { ReactNode } from "react";

import type {
  FunnelStep,
  LabeledCount,
  TrendPoint,
  WeekPoint,
} from "@/lib/admin/metrics-core";

type Accent = "gold" | "cobalt" | "success" | "danger" | "warning" | "silver";

const accentText: Record<Accent, string> = {
  gold: "text-gold",
  cobalt: "text-cobalt-bright",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  silver: "text-silver",
};

const accentStroke: Record<Accent, string> = {
  gold: "var(--fv-gold)",
  cobalt: "var(--fv-cobalt-bright)",
  success: "var(--fv-success)",
  danger: "var(--fv-danger)",
  warning: "var(--fv-warning)",
  silver: "var(--fv-silver)",
};

const accentFill: Record<Accent, string> = {
  gold: "rgba(223,175,55,0.14)",
  cobalt: "rgba(36,91,255,0.16)",
  success: "rgba(79,199,138,0.14)",
  danger: "rgba(229,86,76,0.14)",
  warning: "rgba(232,163,58,0.14)",
  silver: "rgba(217,220,225,0.10)",
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        {eyebrow ? (
          <p className="font-mono font-semibold uppercase tracking-[0.18em] text-[10px] text-gold mb-1.5">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display font-bold uppercase tracking-[0.06em] text-cream text-[18px] leading-none">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-charcoal border border-hairline rounded-2xl p-5 ${className}`}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI stat card
// ---------------------------------------------------------------------------
export function MetricCard({
  label,
  value,
  sub,
  accent = "gold",
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: Accent;
  trend?: TrendPoint[];
}) {
  return (
    <div className="bg-charcoal border border-hairline rounded-xl p-5 flex flex-col justify-between min-h-[132px] relative overflow-hidden">
      <p
        className={`font-mono font-semibold uppercase tracking-[0.16em] text-[10px] ${accentText[accent]}`}
      >
        {label}
      </p>
      <div className="mt-3">
        <p className="font-display font-extrabold text-cream text-[34px] leading-none tabular-nums">
          {value}
        </p>
        {sub ? (
          <p className="font-body text-cream/55 text-[12px] leading-snug mt-1.5">
            {sub}
          </p>
        ) : null}
      </div>
      {trend && trend.length > 1 ? (
        <div className="absolute inset-x-0 bottom-0 h-9 opacity-70 pointer-events-none">
          <AreaTrend data={trend} accent={accent} height={36} flush />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Area / line trend (time series)
// ---------------------------------------------------------------------------
export function AreaTrend({
  data,
  accent = "gold",
  height = 64,
  flush = false,
  ariaLabel,
}: {
  data: TrendPoint[];
  accent?: Accent;
  height?: number;
  flush?: boolean;
  ariaLabel?: string;
}) {
  const W = 100;
  const H = 100;
  const pad = flush ? 0 : 6;
  const values = data.map((d) => d.value);
  const max = Math.max(1, ...values);
  const n = data.length;
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(d.value).toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const last = data[n - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      role="img"
      aria-label={ariaLabel ?? `Trend, latest value ${last?.value ?? 0}`}
      className="block"
    >
      <path d={area} fill={accentFill[accent]} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={accentStroke[accent]}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Vertical bar series (e.g. the 30-day completion funnel)
// ---------------------------------------------------------------------------
export function BarSeries({
  data,
  accent = "cobalt",
  height = 120,
  ariaLabel,
}: {
  data: { label: string | number; value: number }[];
  accent?: Accent;
  height?: number;
  ariaLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const gap = 0.18; // fraction of slot used as gap
  const slot = 100 / n;
  const barW = slot * (1 - gap);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      width="100%"
      height={height}
      role="img"
      aria-label={ariaLabel ?? "Bar series"}
      className="block"
    >
      {data.map((d, i) => {
        const h = (d.value / max) * 96;
        const xPos = i * slot + (slot - barW) / 2;
        return (
          <rect
            key={i}
            x={xPos}
            y={100 - h}
            width={barW}
            height={Math.max(h, d.value > 0 ? 1.2 : 0)}
            rx={0.8}
            fill={accentStroke[accent]}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Horizontal labeled bars (e.g. sport mix, plan mix, waitlist breakdown)
// ---------------------------------------------------------------------------
export function HBars({
  data,
  accent = "gold",
  emptyLabel = "No data yet",
}: {
  data: LabeledCount[];
  accent?: Accent;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (data.length === 0) {
    return <p className="font-body text-cream/45 text-[13px]">{emptyLabel}</p>;
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-body text-cream/80 text-[13px] truncate capitalize">
                {d.label}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-cream/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((d.count / max) * 100)}%`,
                  backgroundColor: accentStroke[accent],
                }}
              />
            </div>
          </div>
          <span className="font-mono font-semibold text-cream text-[13px] tabular-nums">
            {d.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Stat row (compact label/value list inside a panel)
// ---------------------------------------------------------------------------
export function StatRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: Accent;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-hairline last:border-0">
      <span className="font-body text-cream/70 text-[13px]">{label}</span>
      <span
        className={`font-mono font-semibold text-[14px] tabular-nums ${
          accent ? accentText[accent] : "text-cream"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conversion funnel (ordered steps with rate-of-previous)
// ---------------------------------------------------------------------------
export function FunnelBars({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(1, steps[0]?.count ?? 1);
  return (
    <ul className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <li key={s.label}>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-body text-cream/80 text-[13px]">{s.label}</span>
            <span className="font-mono text-cream/60 text-[12px] tabular-nums">
              {s.count.toLocaleString()}
              {i > 0 ? (
                <span className="text-cream/40"> · {s.rateOfPrev}% of prev</span>
              ) : null}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-cream/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round((s.count / top) * 100)}%`,
                backgroundColor: i === 0 ? "var(--fv-gold)" : "var(--fv-cobalt-bright)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Weekly bar series with axis labels (adapts WeekPoint[])
// ---------------------------------------------------------------------------
export function WeekBars({
  data,
  accent = "cobalt",
  height = 120,
  label,
}: {
  data: WeekPoint[];
  accent?: Accent;
  height?: number;
  label?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d) => (
          <div key={d.week} className="flex-1 flex flex-col items-center justify-end h-full">
            <span className="font-mono text-[10px] text-cream/50 tabular-nums mb-1">
              {d.value}
            </span>
            <div
              className="w-full rounded-t-[3px]"
              style={{
                height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 1)}%`,
                backgroundColor: accentStroke[accent],
                opacity: 0.85,
              }}
              title={`Week of ${d.week}: ${d.value}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {data.map((d) => (
          <span
            key={d.week}
            className="flex-1 text-center font-mono text-[9px] text-cream/35 tabular-nums"
          >
            {d.week.slice(5)}
          </span>
        ))}
      </div>
      {label ? (
        <p className="font-body text-cream/45 text-[11px] mt-2 text-center">{label}</p>
      ) : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "gold",
}: {
  children: ReactNode;
  tone?: "gold" | "cobalt" | "warning";
}) {
  const tones = {
    gold: "text-gold border-gold/30 bg-gold/[0.08]",
    cobalt: "text-cobalt-bright border-cobalt/30 bg-cobalt/[0.10]",
    warning: "text-warning border-warning/30 bg-warning/[0.08]",
  } as const;
  return (
    <span
      className={`inline-flex items-center font-mono font-semibold uppercase tracking-[0.12em] text-[9px] px-2 py-1 rounded-pill border ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// "Needs instrumentation" empty state — for metrics that require the proposed
// activity_events table (true DAU, pregame usage, weekly cohorts).
// ---------------------------------------------------------------------------
export function NeedsInstrumentation({
  title,
  what,
}: {
  title: string;
  what: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-cobalt/30 bg-cobalt/[0.04] px-5 py-6">
      <div className="flex items-center gap-2 mb-2">
        <Badge tone="cobalt">Needs instrumentation</Badge>
        <span className="font-display font-bold uppercase tracking-[0.04em] text-cream/80 text-[13px]">
          {title}
        </span>
      </div>
      <p className="font-body text-cream/55 text-[12.5px] leading-relaxed">{what}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Privacy-suppressed placeholder
// ---------------------------------------------------------------------------
export function Suppressed({ note }: { note?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-hairline-strong bg-cream/[0.02] px-4 py-5 text-center">
      <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-cream/40 mb-1">
        Hidden
      </p>
      <p className="font-body text-cream/50 text-[12px] leading-snug">
        {note ?? "Too few records to show without risking re-identification."}
      </p>
    </div>
  );
}
