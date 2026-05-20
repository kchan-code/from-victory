import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "coach";
type Size = "sm" | "md";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  leading?: ReactNode;
  trailing?: ReactNode;
  full?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-gold text-onyx border-gold font-heading font-semibold rounded-pill",
  secondary:
    "bg-transparent text-cream border-hairline-strong font-heading font-semibold rounded-pill",
  ghost:
    "bg-transparent text-cream/70 border-transparent font-heading font-semibold rounded-pill",
  coach:
    "bg-onyx text-cream border-gold font-display font-extrabold uppercase tracking-[0.14em] rounded-md",
};

const sizeClass: Record<Variant, Record<Size, string>> = {
  primary:   { sm: "text-[13px] px-4 py-2.5", md: "text-[15px] px-[22px] py-3.5" },
  secondary: { sm: "text-[13px] px-4 py-2.5", md: "text-[15px] px-[22px] py-3.5" },
  ghost:     { sm: "text-[13px] px-1 py-2",   md: "text-[15px] px-1 py-2" },
  coach:     { sm: "text-[13px] px-5 py-3",   md: "text-[14px] px-[26px] py-4" },
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  leading,
  trailing,
  full = false,
  className,
  ...rest
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center gap-2 border transition-transform duration-fast ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx",
    variantClass[variant],
    sizeClass[variant][size],
    full ? "w-full" : "w-auto",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {leading}
      {children}
      {trailing}
    </button>
  );
}
