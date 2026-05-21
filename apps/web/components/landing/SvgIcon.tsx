type IconName =
  | "arrow"
  | "play"
  | "wind"
  | "book"
  | "pen"
  | "target"
  | "flame"
  | "bell"
  | "home"
  | "zap"
  | "user"
  | "shield"
  | "link"
  | "pulse"
  | "anchor"
  | "check"
  | "chev";

interface SvgIconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function SvgIcon({ name, size = 16, className }: SvgIconProps) {
  return (
    <svg width={size} height={size} aria-hidden className={className}>
      <use href={`#i-${name}`} />
    </svg>
  );
}
