interface RhythmRingProps {
  pct: number;
  size?: number;
  stroke?: number;
  label?: string;
}

export function RhythmRing({
  pct,
  size = 96,
  stroke = 8,
  label,
}: RhythmRingProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative flex-none"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${clamped}% ${label ?? "rhythm"}`}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(247,247,247,0.06)"
          strokeWidth={stroke}
          fill="none"
        />
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
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
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cream/50 mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
