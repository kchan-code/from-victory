"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  deleteAthlete,
  type DeleteAthleteState,
} from "@/lib/actions/account";

const initialState: DeleteAthleteState = null;

function ConfirmButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="font-heading font-semibold text-[13px] text-white bg-red-600/90 border border-red-500/60 rounded-pill px-4 py-2 transition-colors duration-fast ease-out hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Deleting…" : "Delete permanently"}
    </button>
  );
}

/**
 * Per-athlete destructive control. Collapsed to a "Remove" link until the
 * parent opens it; deletion then requires typing the athlete's first name.
 */
export function DeleteAthleteButton({
  athleteId,
  firstName,
}: {
  athleteId: string;
  firstName: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, formAction] = useFormState(deleteAthlete, initialState);

  const matches = typed.trim().toLowerCase() === firstName.trim().toLowerCase();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-heading font-semibold text-[13px] text-cream/50 hover:text-red-400 bg-transparent border border-transparent rounded-pill px-3 py-2 transition-colors duration-fast ease-out"
      >
        Remove
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="athlete_id" value={athleteId} />
      <p className="font-body text-[13px] text-cream/70 text-right max-w-[260px]">
        This permanently deletes {firstName}&rsquo;s account, journal, and all
        training history. This cannot be undone.
      </p>
      <input
        type="text"
        name="confirm"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        aria-label={`Type ${firstName} to confirm`}
        placeholder={`Type "${firstName}" to confirm`}
        className="w-[260px] bg-onyx border border-hairline focus:border-red-500/60 rounded-lg px-3 py-2 font-body text-[14px] text-cream placeholder:text-cream/35 outline-none transition-colors duration-fast"
      />
      {state && !state.ok ? (
        <p className="font-body text-[13px] text-red-400 text-right" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          className="font-heading font-semibold text-[13px] text-cream/70 hover:text-cream bg-onyx border border-hairline rounded-pill px-4 py-2 transition-colors duration-fast ease-out"
        >
          Cancel
        </button>
        <ConfirmButton disabled={!matches} />
      </div>
    </form>
  );
}
