"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  children: ReactNode;
  pendingLabel: string;
  /**
   * Additional disable condition beyond the form's own pending state (e.g. an
   * unchecked required confirmation — FV-586). Defaults to false so every
   * existing call site is unaffected.
   */
  disabled?: boolean;
};

export function SubmitButton({ children, pendingLabel, disabled = false }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-gold text-onyx border border-gold font-heading font-semibold text-[15px] rounded-pill px-6 py-3 transition-colors duration-base ease-out hover:bg-gold-bright disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
