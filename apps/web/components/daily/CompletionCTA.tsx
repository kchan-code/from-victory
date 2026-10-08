"use client";

import { useTransition, useState } from "react";

import { RhythmRingAnimated } from "@/components/ui/RhythmRingAnimated";
import { NextGamePrompt } from "@/components/daily/NextGamePrompt";
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
  /** Fired once, synchronously, when the celebration overlay opens. */
  onCelebrate?: () => void;
  /** Fired if the save fails and the overlay is rolled back. */
  onCelebrateAbort?: () => void;
}

interface CelebrationSnapshot {
  dayNumber: number;
  newCompletedCount: number;
  prevPct: number;
  newPct: number;
  isMilestone: boolean;
  milestoneCopy?: string;
}

/**
 * Capture the day that was just finished. completeDailySession revalidates
 * the page, so later props are the NEXT day. The overlay must keep this
 * snapshot or it renames the finished day (Day 1 done becomes Day 2 done).
 */
function snapshotCelebration(
  dayNumber: number,
  completedCount: number,
): CelebrationSnapshot {
  const newCompletedCount = completedCount + 1;
  const prevPct = Math.round((completedCount / TOTAL_TRAINING_DAYS) * 100);
  const newPct = Math.round((newCompletedCount / TOTAL_TRAINING_DAYS) * 100);
  const isMilestone =
    newCompletedCount === 7 ||
    newCompletedCount === 14 ||
    newCompletedCount === 30;
  return {
    dayNumber,
    newCompletedCount,
    prevPct,
    newPct,
    isMilestone,
    milestoneCopy: MILESTONE_COPY[newCompletedCount],
  };
}

export function CompletionCTA({
  dayNumber,
  completedCount,
  onCelebrate,
  onCelebrateAbort,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [celebration, setCelebration] = useState<CelebrationSnapshot | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  function handleComplete() {
    if (celebration) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100, 30, 60]);
    }
    setSaveFailed(false);
    setCelebration(snapshotCelebration(dayNumber, completedCount));
    onCelebrate?.();
    startTransition(async () => {
      try {
        await completeDailySession();
      } catch {
        // Roll back the optimistic overlay so the athlete can retry.
        setCelebration(null);
        setSaveFailed(true);
        onCelebrateAbort?.();
      }
    });
  }

  if (celebration) {
    return (
      <CompletionMoment
        dayNumber={celebration.dayNumber}
        newCompletedCount={celebration.newCompletedCount}
        prevPct={celebration.prevPct}
        newPct={celebration.newPct}
        isMilestone={celebration.isMilestone}
        milestoneCopy={celebration.milestoneCopy}
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
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/55 text-center mb-3">
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
      data-testid="completion-moment"
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
      <p
        className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[32px] sm:text-[36px] leading-[1.1] mb-3 relative z-10"
        data-testid="completion-day-label"
      >
        Day {dayNumber} done.
      </p>

      {/* Milestone copy */}
      {isMilestone && milestoneCopy && (
        <p className="font-body text-cream/75 text-[15px] leading-relaxed relative z-10">
          {milestoneCopy}
        </p>
      )}

      {isPending && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/55 mt-4 relative z-10">
          Saving…
        </p>
      )}

      {/* FV-240: optional one-tap "next game" prompt.
          Shown once per completion moment; disappears on answer or if ignored.
          Skippable — rendered as a quiet secondary block, not a wall. */}
      {!isPending && (
        <div className="relative z-10">
          <NextGamePrompt />
        </div>
      )}
    </div>
  );
}

function AllCompleteBanner() {
  return (
    <div className="fv-milestone-bg border border-gold/30 rounded-2xl p-7 text-center mb-6">
      <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
        30 Days Complete
      </p>
      <p className="font-display font-extrabold uppercase tracking-[0.02em] text-cream text-[22px] leading-[1.15] mb-3">
        Your rhythm is built.
      </p>
      <p className="font-body text-cream/65 text-[15px] leading-relaxed">
        You finished all 30 sessions. The work you put in is yours —
        keep showing up.
      </p>
    </div>
  );
}

interface SlotProps {
  dayNumber: number;
  completedCount: number;
  allComplete: boolean;
}

/**
 * Keeps the celebration mounted after the server refresh.
 * Finishing day 30 sets allComplete, which used to swap this slot for the
 * closure banner and drop the "Day 30 done" overlay. A fresh visit with
 * all 30 already done still shows that banner.
 */
export function DailyCompletionSlot({
  dayNumber,
  completedCount,
  allComplete,
}: SlotProps) {
  const [celebrating, setCelebrating] = useState(false);

  if (allComplete && !celebrating) {
    return <AllCompleteBanner />;
  }

  return (
    <CompletionCTA
      dayNumber={dayNumber}
      completedCount={completedCount}
      onCelebrate={() => setCelebrating(true)}
      onCelebrateAbort={() => setCelebrating(false)}
    />
  );
}
