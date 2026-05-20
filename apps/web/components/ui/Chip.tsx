import { type ReactNode } from "react";

type Variant = "default" | "gold" | "cobalt" | "solid";

interface ChipProps {
  children: ReactNode;
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  default: "bg-surface-1 text-cream/70 border-hairline",
  gold: "bg-transparent text-gold border-gold/50",
  cobalt: "bg-cobalt/10 text-cobalt-bright border-cobalt/40",
  solid: "bg-gold text-onyx border-gold",
};

export function Chip({ children, variant = "default" }: ChipProps) {
  const classes = [
    "inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1.5 rounded-pill border",
    variantClass[variant],
  ].join(" ");

  return <span className={classes}>{children}</span>;
}
