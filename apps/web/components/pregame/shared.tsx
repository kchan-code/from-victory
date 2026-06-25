"use client";

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Icon — Lucide-style line set, sized via prop. Subset used across pregame.
// ---------------------------------------------------------------------------

const ICONS: Record<string, string> = {
  arrowLeft: "M19 12H5 M11 6l-6 6 6 6",
  arrowRight: "M5 12h14 M13 6l6 6-6 6",
  close: "M6 6l12 12M6 18L18 6",
  check: "M4 12l5 5L20 6",
  edit: "M12 19l7-7-3-3-7 7v3h3z M14 7l3 3",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  ear: "M16 9a4 4 0 1 0-8 0v6a3 3 0 0 0 6 0c0-2 2-2 2-4 0-1 0-2 0-2z",
  hand: "M7 11V5a2 2 0 0 1 4 0v6 M11 11V3a2 2 0 0 1 4 0v8 M15 11V5a2 2 0 0 1 4 0v9a7 7 0 0 1-7 7 6 6 0 0 1-6-6c0-1 0-3-2-4",
  stick: "M3 21l8-8 M14 10l3-3 4 4-3 3z M11 13l3 3",
  bolt: "M13 2L4 14h6l-2 8 9-12h-6l2-8z",
  pin: "M12 21v-7 M8 14h8a3 3 0 0 0 0-6h-1V3H9v5H8a3 3 0 0 0 0 6z",
  flame: "M12 3c-2 4-5 6-5 10a5 5 0 1 0 10 0c0-2-1.5-3.5-3-5 .5 2.5-1 4-1 4s-2-1-1-9z",
  cross: "M12 3v18 M5 9h14",
  shield: "M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z",
  target: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  refresh: "M3 12a9 9 0 0 1 15-6.7L21 8 M21 4v4h-4 M21 12a9 9 0 0 1-15 6.7L3 16 M3 20v-4h4",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6",
  clock: "M12 7v5l3 2",
  play: "M7 5v14l12-7z",
  pause: "M9 5v14M15 5v14",
  whistle: "M14 6l8-4-2 6-6 1z M9 10a6 6 0 1 0 6 6",
};

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 22,
  className = "",
  strokeWidth = 1.75,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const path = ICONS[name];
  if (!path) return null;
  const segments = path.split(" M").map((seg, i) => (i === 0 ? seg : "M" + seg));
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {segments.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Text labels
// ---------------------------------------------------------------------------

export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/50 ${className}`}
    >
      {children}
    </div>
  );
}

export function VerseRef({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
      {children}
    </div>
  );
}

export function SectionLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cream/50 ${className}`}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Button — primary | secondary | ghost | coach
// ---------------------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "ghost" | "coach";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill font-heading font-semibold transition-transform duration-fast ease-out active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_SIZES: Record<"sm" | "md", string> = {
  sm: "px-4 py-2.5 text-[13px]",
  md: "px-[22px] py-3.5 text-[15px]",
};

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-gold text-onyx border border-gold",
  secondary: "bg-transparent text-cream border border-hairline-strong",
  ghost: "bg-transparent text-cream/70 border border-transparent !px-1 !py-2",
  coach:
    "bg-onyx text-cream border border-gold !rounded-[10px] font-display font-extrabold uppercase tracking-[0.14em] !text-[14px] !px-[26px] !py-4",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  onClick,
  full,
  className = "",
  leading,
  trailing,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  full?: boolean;
  className?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${BUTTON_BASE} ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${full ? "w-full" : ""} ${className}`}
    >
      {leading}
      <span>{children}</span>
      {trailing}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Card — base elevated container with optional verse/prayer accent gradient
// ---------------------------------------------------------------------------

const CARD_ACCENTS = {
  verse:
    "bg-[radial-gradient(120%_80%_at_30%_0%,rgba(223,175,55,0.07),transparent_60%),var(--fv-charcoal)]",
  prayer:
    "bg-[radial-gradient(120%_90%_at_50%_0%,rgba(36,91,255,0.10),transparent_70%),var(--fv-charcoal)]",
} as const;

export function Card({
  children,
  accent,
  className = "",
}: {
  children: ReactNode;
  accent?: keyof typeof CARD_ACCENTS;
  className?: string;
}) {
  const bg = accent ? CARD_ACCENTS[accent] : "bg-charcoal";
  return (
    <div
      className={`rounded-[14px] border border-hairline p-5 ${bg} ${className}`}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pregame screen header — sticky, with back button + label + thin progress bar
// ---------------------------------------------------------------------------

export function PregameHeader({
  step,
  total,
  label,
  onBack,
  onClose,
}: {
  step: number;
  total: number;
  label: string;
  onBack?: () => void;
  onClose?: () => void;
}) {
  const pct = Math.min(100, Math.max(0, (step / total) * 100));
  return (
    <div className="sticky top-0 z-10 border-b border-hairline bg-onyx/80 backdrop-blur-md">
      <div className="flex items-center gap-3 px-[18px] pb-3 pt-[58px]">
        {/* -m-1.25 pulls in negative margin so the 44px hit area doesn't
            shift layout; the visible circle stays h-[34px] w-[34px]. */}
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          aria-label="Back"
          className="flex h-[44px] w-[44px] flex-none -m-[5px] items-center justify-center rounded-pill text-cream transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx disabled:text-cream/30"
        >
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
            <Icon name="arrowLeft" size={16} />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-gold">
            Pre-Game Reset
          </div>
          <div className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/50">
            {String(step).padStart(2, "0")} / {String(total).padStart(2, "0")} · {label}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-[44px] w-[44px] flex-none -m-[5px] items-center justify-center rounded-pill text-cream/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
              <Icon name="close" size={16} />
            </span>
          </button>
        )}
      </div>
      <div className="h-0.5 bg-cream/[0.06]">
        <div
          className="h-full bg-gold transition-[width] duration-base ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selectable card — large tappable choice with check indicator
// ---------------------------------------------------------------------------

export function SelectCard({
  label,
  sub,
  selected,
  onClick,
  icon,
  compact,
}: {
  label: string;
  sub?: string;
  selected?: boolean;
  onClick: () => void;
  icon?: IconName;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!selected}
      className={`flex w-full items-center gap-3 rounded-[12px] border text-left transition-colors duration-fast ${
        compact ? "px-3.5 py-3" : "px-4 py-3.5"
      } ${
        selected
          ? "border-gold/55 bg-gold/[0.06]"
          : "border-hairline bg-charcoal"
      }`}
    >
      {icon && (
        <div
          className={`flex h-8 w-8 flex-none items-center justify-center rounded-[8px] ${
            selected ? "bg-gold/[0.10] text-gold" : "bg-cream/[0.04] text-cream/70"
          }`}
        >
          <Icon name={icon} size={16} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div
          className={`font-heading font-semibold leading-tight text-cream ${
            compact ? "text-[14px]" : "text-[15px]"
          }`}
        >
          {label}
        </div>
        {sub && (
          <div className="mt-1 font-body text-[12px] leading-snug text-cream/50">
            {sub}
          </div>
        )}
      </div>
      <span
        className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border-[1.5px] transition-colors duration-fast ${
          selected ? "border-gold bg-gold" : "border-cream/20 bg-transparent"
        }`}
      >
        {selected && <Icon name="check" size={11} strokeWidth={3} className="text-onyx" />}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// SelectChip — compact pill choice (game-type, role)
// ---------------------------------------------------------------------------

export function SelectChip({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onClick: () => void;
  /**
   * When true, the chip is dimmed and non-interactive — used by multi-select
   * pickers to enforce a cap (unselected chips disable once the cap is hit;
   * selected chips are never disabled so they can always be removed). FV-144.
   */
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={!!selected}
      className={`rounded-pill border px-3.5 py-2.5 font-heading text-[13px] font-medium transition-colors duration-fast ${
        selected
          ? "border-gold/55 bg-gold/[0.08] text-gold"
          : "border-hairline bg-charcoal text-cream/70"
      } ${disabled ? "cursor-not-allowed opacity-35" : ""}`}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// BottomBar — sticky action area with optional secondary row
// ---------------------------------------------------------------------------

export function BottomBar({
  children,
  secondary,
}: {
  children: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-10 mt-auto flex flex-col gap-2.5 bg-gradient-to-t from-onyx from-60% to-transparent px-5 pb-8 pt-3.5">
      {children}
      {secondary}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScreenBody — scrollable content area above the BottomBar
// ---------------------------------------------------------------------------

export function ScreenBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex-1 overflow-y-auto px-5 pb-[130px] pt-5 ${className}`}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StackedHero — big stacked display headline (e.g. BREATHE / FOCUS / COMPETE)
// ---------------------------------------------------------------------------

export function StackedHero({
  lines,
  goldIndex,
}: {
  lines: string[];
  goldIndex?: number;
}) {
  return (
    <div className="flex flex-col gap-0.5 leading-[0.95]">
      {lines.map((line, i) => (
        <div
          key={i}
          className={`font-display text-[56px] font-extrabold uppercase tracking-[0.02em] ${
            i === goldIndex ? "text-gold" : "text-cream"
          }`}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScriptureCard — gold mono ref + serif italic verse + optional footnote
// ---------------------------------------------------------------------------

export function ScriptureCard({
  reference,
  verse,
  footnote,
  className = "",
}: {
  reference: string;
  verse: string;
  footnote?: string;
  className?: string;
}) {
  return (
    <Card accent="verse" className={`!p-[22px] ${className}`}>
      <VerseRef>{reference}</VerseRef>
      <p className="mt-3.5 font-scripture text-[19px] italic leading-[1.5] text-cream">
        {verse}
      </p>
      {footnote && (
        <p className="mt-3.5 font-body text-[13px] leading-[1.5] text-cream/50">
          {footnote}
        </p>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PregameShell — flex column container the screens render into
// ---------------------------------------------------------------------------

export function PregameShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-onyx text-cream">
      {children}
    </div>
  );
}
