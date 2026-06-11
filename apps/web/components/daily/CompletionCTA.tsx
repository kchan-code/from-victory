"use client";

import { useTransition, useState } from "react";

import { RhythmRingAnimated } from "@/components/ui/RhythmRingAnimated";
import { completeDailySession } from "@/lib/actions/daily-session";
import { TOTAL_TRAINING_DAYS } from "@/lib/daily/progression";

// Rhythm-framing only — no streak language per brand non-negotiable.
// Day-30 copy is intentionally brief — the all-complete banner carries the full closure.
const MILESTONE_COPY: Record<number, string> = {
  7: "One week in. You're building something real.",
  14: "Two weeks strong. Your rhythm is taking shape.",
  30: "All 30. The work is yours — keep showing up.",
};

interface Props {
  dayNumber: number;
  completedCount: number;
}

export function CompletionCTA({ dayNumber, completedCount }: Props) {
  const [isPending, startTransition] = useTransition();
  const [justCompleted, setJustCompleted] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const newCompletedCount = completedCount + 1;
  const prevPct = Math.round((completedCount / TOTAL_TRAINING_DAYS) * 100);
  const newPct = Math.round((newCompletedCount / TOTAL_TRAINING_DAYS) * 100);
  const isMilestone = [7, 14, 30].includes(newCompletedCount);

  function handleComplete() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100, 30, 60]);
    }
    setSaveFailed(false);
    setJustCompleted(true);
    startTransition(async () => {
      try {
        await completeDailySession();
      } catch {
        // Roll back the optimistic overlay so the athlete can retry.
        setJustCompleted(false);
        setSaveFailed(true);
      }
    });
  }

  if (justCompleted) {
    return (
      <CompletionMoment
        dayNumber={dayNumber}
        newCompletedCount={newCompletedCount}
        prevPct={prevPct}
        newPct={newPct}
        isMilestone={isMilestone}
        milestoneCopy={MILESTONE_COPY[newCompletedCount]}
        isPending={isPending}
      />
    );
  }

  return (
    <div className="mb-6">
      {saveFailed && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-danger text-center mb-3">
          Couldn&apos;t save — tap to try again
        </p>
      )}
      {!saveFailed && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/40 text-center mb-3">
          Ready to move forward?
        </p>
      )}
      <button
        type="button"
        onClick={handleComplete}
        disabled={isPending}
        data-testid="complete-session-btn"
        className="w-full min-h-[56px] font-heading font-semibold text-[16px] text-onyx bg-gold rounded-pill px-6 py-4 transition-colors duration-fast ease-out hover:bg-gold-bright active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed"
      >
        {saveFailed ? `Retry Day ${dayNumber}` : `Complete Day ${dayNumber}`}
      </button>
    </div>
  );
}

interface MomentProps {
  dayNumber: number;
  newCompletedCount: number;
  prevPct: number;
  newPct: number;
  isMilestone: boolean;
  milestoneCopy?: string;
  isPending: boolean;
}

function CompletionMoment({
  dayNumber,
  newCompletedCount,
  prevPct,
  newPct,
  isMilestone,
  milestoneCopy,
  isPending,
}: MomentProps) {
  return (
    <div
      className={[
        "relative mb-6 rounded-2xl p-7 text-center overflow-hidden",
        isMilestone
          ? "fv-milestone-bg border border-gold/30"
          : "bg-charcoal border border-hairline",
      ].join(" ")}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Gold radial glow bloom — CSS-only, ~800ms ease-out */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none animate-glow-bloom"
        style={{
          background:
            "radial-gradient(65% 55% at 50% 40%, rgba(223,175,55,0.20) 0%, transparent 70%)",
        }}
      />

      {/* Ring animating from previous arc position to new */}
      <div
        className={[
          "flex justify-center mb-5 relative z-10",
          isMilestone ? "animate-ring-pulse" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <RhythmRingAnimated
          pct={newPct}
          from={prevPct}
          size={88}
          stroke={7}
          dayNumber={newCompletedCount}
          totalDays={TOTAL_TRAINING_DAYS}
        />
      </div>

      {/* "Day N done." */}
      <p className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[32px] sm:text-[36px] leading-[1.1] mb-3 relative z-10">
        Day {dayNumber} done.
      </p>

      {/* Milestone copy */}
      {isMilestone && milestoneCopy && (
        <p className="font-body text-cream/75 text-[15px] leading-relaxed relative z-10">
          {milestoneCopy}
        </p>
      )}

      {isPending && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/40 mt-4 relative z-10">
          Saving…
        </p>
      )}
    </div>
  );
}
