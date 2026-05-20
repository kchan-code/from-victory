import { type ReactNode } from "react";

type Tone = "default" | "gold";

interface EyebrowProps {
  children: ReactNode;
  tone?: Tone;
}

const toneClass: Record<Tone, string> = {
  default: "text-cream/50",
  gold: "text-gold",
};

export function Eyebrow({ children, tone = "default" }: EyebrowProps) {
  const classes = [
    "font-mono text-[10px] font-semibold uppercase tracking-[0.18em]",
    toneClass[tone],
  ].join(" ");

  return <div className={classes}>{children}</div>;
}
