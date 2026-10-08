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
 *   - Disappears only after the save succeeds. A failed save keeps the
 *     options up, with an inline error, so the athlete can retry.
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

import { useRef, useState } from "react";

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

const SAVE_ERROR = "Couldn't save. Tap an answer to try again.";

/** Next.js redirect()/notFound() must keep propagating from a server action. */
function isNextControlFlow(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest = "digest" in error ? error.digest : undefined;
  if (typeof digest === "string") {
    return (
      digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")
    );
  }
  if (error instanceof Error) {
    return (
      error.message.startsWith("NEXT_REDIRECT") ||
      error.message.startsWith("NEXT_NOT_FOUND")
    );
  }
  return false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NextGamePrompt() {
  const [answeredWith, setAnsweredWith] = useState<NextGameAnswer | null>(null);
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // State updates lag a same-tick double tap. This ref closes that gap.
  const inFlight = useRef(false);

  function handleAnswer(value: NextGameAnswer) {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaveError(false);
    setPending(true);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    void (async () => {
      try {
        const result = await saveNextGame(value, tz);
        if (!result.ok) {
          setSaveError(true);
          return;
        }
        setAnsweredWith(value);
      } catch (error) {
        if (isNextControlFlow(error)) throw error;
        setSaveError(true);
      } finally {
        inFlight.current = false;
        setPending(false);
      }
    })();
  }

  if (answeredWith !== null) {
    return (
      <p
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/55 text-center mt-5"
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
      aria-busy={pending}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/55 text-center mb-3">
        When&apos;s your next game?
      </p>
      {pending && (
        <p
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/55 text-center mb-3"
          role="status"
          data-testid="next-game-saving"
        >
          Saving…
        </p>
      )}
      {saveError && (
        <p
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-danger text-center mb-3"
          role="alert"
          data-testid="next-game-error"
        >
          {SAVE_ERROR}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            disabled={pending}
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
