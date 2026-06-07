"use client"; // client: useFormStatus for pending state on the complete-session submit

import { useFormStatus } from "react-dom";

interface CompleteSessionButtonProps {
  dayNumber: number;
}

function SubmitButton({ dayNumber }: CompleteSessionButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="complete-session-btn"
      className="w-full min-h-[56px] font-heading font-semibold text-[16px] text-onyx bg-gold rounded-pill px-6 py-4 transition-colors duration-fast ease-out hover:bg-gold-bright active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed"
    >
      {pending ? "Saving…" : `Complete Day ${dayNumber}`}
    </button>
  );
}

export function CompleteSessionButton({ dayNumber }: CompleteSessionButtonProps) {
  return <SubmitButton dayNumber={dayNumber} />;
}
