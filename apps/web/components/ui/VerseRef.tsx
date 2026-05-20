import { type ReactNode } from "react";

interface VerseRefProps {
  children: ReactNode;
}

export function VerseRef({ children }: VerseRefProps) {
  return (
    <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
      {children}
    </div>
  );
}
