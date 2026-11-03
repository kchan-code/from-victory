"use client";

/**
 * SeatSelectionPanel — "choose who stays active" island (FV-585, KC
 * decision D2).
 *
 * Renders only when the parent dashboard determines the account is over its
 * plan's athlete capacity (`seat-state.ts` status `"selection_required"` or
 * `"selected"`). This is a CAPACITY-SELECTION moment, not a payment failure —
 * copy and tone must never read as punishment. Nothing is deleted; every
 * profile and its history stays saved regardless of which box is checked.
 *
 * Pattern: a small client island backed by a server action (`setActiveSeats`),
 * mirroring DigestToggle's shape but using `useTransition` + a plain async
 * call instead of `useFormState`, since `setActiveSeats` takes a typed array
 * argument rather than `FormData`.
 *
 * A11y: one `<fieldset>`/`<legend>` group of labeled checkboxes (each row is
 * a full `<label>` so the whole row is the tap target, not just the 20px
 * box — thumb-first per the athlete-UX brief, even though this screen is
 * parent-facing). A single `aria-live="polite"` status region announces the
 * limit, the zero-selection hint, and save results so a screen-reader parent
 * gets the same feedback a sighted parent sees.
 */

import { useState, useTransition } from "react";

import {
  setActiveSeats,
  type SetActiveSeatsResult,
} from "@/lib/actions/seat-selection";

export interface SeatAthleteOption {
  id: string;
  firstName: string;
}

interface SeatSelectionPanelProps {
  athletes: SeatAthleteOption[];
  capacity: number;
  initialActiveIds: string[];
}

type ErrorCode = Extract<SetActiveSeatsResult, { ok: false }>["code"];

function errorCopy(code: ErrorCode, capacity: number): string {
  switch (code) {
    case "over_capacity":
      return `Pick up to ${capacity}.`;
    case "write_failed":
      return "Couldn't save. Try again.";
    case "selection_not_needed":
      return "Your plan already covers everyone here — refresh to see the update.";
    case "invalid_input":
    case "not_parent":
    case "unlinked_athlete":
    default:
      return "Something went wrong. Try again.";
  }
}

export function SeatSelectionPanel({
  athletes,
  capacity,
  initialActiveIds,
}: SeatSelectionPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialActiveIds),
  );
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);

  const atLimit = selected.size >= capacity;

  function toggle(id: string) {
    setResult(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size >= capacity) {
        // Disabled checkboxes prevent this in practice; kept as a safe no-op.
        return prev;
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const ids = Array.from(selected);
      const response = await setActiveSeats(ids);
      if (response.ok) {
        setResult({ tone: "success", text: "Saved." });
      } else {
        setResult({ tone: "error", text: errorCopy(response.code, capacity) });
      }
    });
  }

  const liveMessage = result
    ? result.text
    : atLimit
      ? "Limit reached."
      : selected.size === 0
        ? "No one will be active until you pick someone."
        : "";

  return (
    <fieldset className="mt-4" disabled={pending}>
      <legend className="font-mono font-semibold uppercase tracking-[0.14em] text-[11px] text-cream/60 mb-3">
        Active athletes ({selected.size}/{capacity})
      </legend>

      <div className="flex flex-col divide-y divide-hairline bg-onyx border border-hairline rounded-xl px-4">
        {athletes.map((athlete) => {
          const checked = selected.has(athlete.id);
          const disabledByLimit = !checked && atLimit;
          return (
            <label
              key={athlete.id}
              htmlFor={`seat-${athlete.id}`}
              className={[
                "flex items-center gap-3 min-h-[44px] py-2.5 cursor-pointer",
                disabledByLimit || pending ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            >
              <input
                id={`seat-${athlete.id}`}
                type="checkbox"
                checked={checked}
                disabled={pending || disabledByLimit}
                onChange={() => toggle(athlete.id)}
                data-testid={`seat-checkbox-${athlete.id}`}
                className="h-5 w-5 flex-shrink-0 accent-cobalt cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="font-body text-cream text-[15px] leading-tight">
                {athlete.firstName}
              </span>
            </label>
          );
        })}
      </div>

      <p
        aria-live="polite"
        role="status"
        data-testid="seat-selection-status"
        className={[
          "font-body text-[13px] leading-relaxed mt-3 min-h-[1.25em]",
          result?.tone === "error" ? "text-red-400" : "text-cream/60",
        ].join(" ")}
      >
        {liveMessage}
      </p>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        data-testid="seat-selection-save"
        className="mt-2 inline-flex items-center justify-center font-heading font-semibold text-[14px] text-onyx bg-gold border border-gold rounded-pill px-5 min-h-[44px] hover:bg-gold-bright transition-colors duration-base ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </fieldset>
  );
}
