"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  children: ReactNode;
  pendingLabel: string;
};

export function SubmitButton({ children, pendingLabel }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-gold text-onyx border border-gold font-heading font-semibold text-[15px] rounded-pill px-6 py-3 transition-colors duration-base ease-out hover:bg-gold-bright disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
