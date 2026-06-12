"use client";
// client: manages answered/pending local state; calls server action on tap

/**
 * NextGamePrompt (FV-240)
 *
 * Optional one-tap row shown inside the CompletionMoment celebration surface.
 * The athlete taps one of four coarse answers and the screen collapses to a
 * quiet confirmation. Skippable — if the athlete ignores it, nothing is stored
 * and no nag appears on the next visit.
 *
 * UX principles applied:
 *   - Skippable: rendered as a quiet optional block, never a wall.
 *   - Disappears once answered — single-tap, done.
 *   - Tap-first: four big pill buttons, no keyboard required.
 *   - Bottom-anchored within the card for thumb reach.
 *   - Calm: muted palette, small eyebrow, no animation on this secondary surface.
 *   - Athlete-voice: "you" / direct address; no "kid".
 *
 * Confirmation copy:
 *   - Stored answers (tonight/tomorrow/this_weekend): "Got it — we'll remind you."
 *   - "Not sure": "All good — ask me again anytime." (no reminder is stored;
 *     promising one would be false.)
 */

import { useState, useTransition } from "react";

import { saveNextGame } from "@/lib/actions/next-game";
import {
  type NextGameAnswer,
  NEXT_GAME_ANSWERS,
} from "@/lib/daily/next-game-shared";

// Re-export for callers that import from this module (backward compat).
export type { NextGameAnswer };
export { NEXT_GAME_ANSWERS };

// ---------------------------------------------------------------------------
// Answer options — label is what the athlete reads; value is sent to the action
// ---------------------------------------------------------------------------

const OPTIONS: { label: string; value: NextGameAnswer }[] = [
  { label: "Tonight", value: "tonight" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "This weekend", value: "this_weekend" },
  { label: "Not sure", value: "not_sure" },
];

// ---------------------------------------------------------------------------
// Confirmation copy — branched by answer so we don't promise a reminder when
// the athlete picked "Not sure" (nothing is stored in that case).
// ---------------------------------------------------------------------------

function confirmationText(answer: NextGameAnswer): string {
  if (answer === "not_sure") {
    return "All good — ask me again anytime.";
  }
  return "Got it — we’ll remind you.";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NextGamePrompt() {
  const [answeredWith, setAnsweredWith] = useState<NextGameAnswer | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAnswer(value: NextGameAnswer) {
    // Optimistically collapse — the UI responds immediately regardless of
    // save outcome. If it fails, the worst outcome is the athlete doesn't
    // receive a game-day nudge (no data loss, no harmful state).
    setAnsweredWith(value);
    startTransition(async () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await saveNextGame(value, tz);
      // No error handling beyond silent failure — this is an optional
      // convenience feature, not a critical data path.
    });
  }

  if (answeredWith !== null) {
    return (
      <p
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/40 text-center mt-5"
        role="status"
        aria-live="polite"
      >
        {confirmationText(answeredWith)}
      </p>
    );
  }

  return (
    <div
      className="mt-5 pt-4 border-t border-hairline"
      data-testid="next-game-prompt"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/40 text-center mb-3">
        When&apos;s your next game?
      </p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            disabled={isPending}
            onClick={() => handleAnswer(value)}
            data-testid={`next-game-option-${value}`}
            className="min-h-[44px] font-heading font-semibold text-[13px] text-cream/80 bg-onyx border border-hairline rounded-pill px-4 py-2.5 transition-colors duration-fast ease-out hover:border-gold/40 hover:text-cream active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
