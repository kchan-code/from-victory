interface RhythmRingProps {
  pct: number;
  size?: number;
  stroke?: number;
  label?: string;
  /**
   * When provided, the ring center shows "{dayNumber} / {totalDays}" instead
   * of the raw completion percentage. Use on the athlete home hub where
   * day-position is the meaningful rhythm signal. Omit on the parent
   * dashboard (which uses the pct-only / no-label variant).
   */
  dayNumber?: number;
  totalDays?: number;
}

export function RhythmRing({
  pct,
  size = 96,
  stroke = 8,
  label,
  dayNumber,
  totalDays,
}: RhythmRingProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  // Always show at least a tiny 4° spark so the ring is never a void circle
  // on day 1 / 0% — gives the athlete visual presence from the first open.
  const MIN_ARC_DEG = 4;
  const minOffset = circumference * (1 - MIN_ARC_DEG / 360);
  const rawOffset = circumference * (1 - clamped / 100);
  const offset = clamped === 0 ? minOffset : rawOffset;

  // Aria label adapts to whichever center mode is active.
  const ariaLabel =
    dayNumber !== undefined && totalDays !== undefined
      ? `Day ${dayNumber} of ${totalDays}${label ? ` — ${label}` : " — your rhythm"}`
      : `${clamped}% ${label ?? "rhythm"}`;

  const useDayCenter = dayNumber !== undefined && totalDays !== undefined;

  return (
    <div
      className="relative flex-none"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(247,247,247,0.06)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress arc — cobalt is UI-progress-only per brand rules */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="stroke-cobalt transition-[stroke-dashoffset] duration-prayer ease-out"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
        {useDayCenter ? (
          /*
           * Day-position center (athlete home hub).
           * Hero: the day number — large, one fixation.
           * Subordinate: "/ 30" fraction — smaller, gold-muted.
           * dayNumber always starts at 1, never 0 — positive framing guaranteed.
           */
          <>
            <div className="flex items-baseline leading-none" style={{ gap: size * 0.025 }}>
              <span
                className="font-display font-extrabold text-cream leading-none"
                style={{ fontSize: size * 0.30 }}
              >
                {dayNumber}
              </span>
              <span
                className="font-mono text-gold/70 leading-none"
                style={{ fontSize: size * 0.165 }}
              >
                /{totalDays}
              </span>
            </div>
            {label !== undefined && (
              <span
                className="font-mono uppercase tracking-[0.13em] text-cream/70 text-center leading-none"
                style={{ fontSize: Math.max(10, size * 0.125), marginTop: size * 0.04 }}
              >
                {label}
              </span>
            )}
          </>
        ) : (
          /*
           * Percentage center (parent dashboard, default fallback).
           * Preserved exactly as before so size=64/no-label usage is unchanged.
           */
          <>
            <span
              className="font-display font-extrabold text-cream leading-none"
              style={{ fontSize: size * 0.24 }}
            >
              {clamped}
              <span className="opacity-60" style={{ fontSize: size * 0.13 }}>
                %
              </span>
            </span>
            {label !== undefined && (
              <span
                className="font-mono uppercase tracking-[0.13em] text-cream/70 text-center leading-none"
                style={{ fontSize: Math.max(10, size * 0.125), marginTop: size * 0.04 }}
              >
                {label}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
