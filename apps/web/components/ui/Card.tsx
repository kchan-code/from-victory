import { type HTMLAttributes, type ReactNode } from "react";

type Accent = "verse" | "prayer";
type Padding = "sm" | "md" | "lg";
type Radius = "md" | "lg" | "xl";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  accent?: Accent;
  padding?: Padding;
  radius?: Radius;
}

const paddingClass: Record<Padding, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const radiusClass: Record<Radius, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
};

const accentClass: Record<Accent, string> = {
  verse: "fv-card-verse",
  prayer: "fv-card-prayer",
};

export function Card({
  children,
  accent,
  padding = "md",
  radius = "md",
  className,
  ...rest
}: CardProps) {
  const classes = [
    "border border-hairline",
    accent ? accentClass[accent] : "bg-charcoal",
    paddingClass[padding],
    radiusClass[radius],
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
