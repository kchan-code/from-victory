const ICONS = {
  home: "M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9z",
  homeOutline:
    "M3 11l9-7 9 7M5 11v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9 M9 22v-7h6v7",
  train: "M4 5h12a3 3 0 0 1 3 3v11l-4-2H4z M8 10h7 M8 14h5",
  book:
    "M3 6a2 2 0 0 1 2-2h6v17H5a2 2 0 0 0-2 2V6z M21 6a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2V6z",
  journal:
    "M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M16 4v3h3 M8 11h8 M8 15h6",
  profile: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c1.5-4 5-6 8-6s6.5 2 8 6",
  arrowRight: "M5 12h14 M13 6l6 6-6 6",
  arrowLeft: "M19 12H5 M11 6l-6 6 6 6",
  play: "M7 5v14l12-7z",
  pause: "M7 5h4v14H7z M13 5h4v14h-4z",
  clock: "M12 7v5l3 2",
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10 21a2 2 0 0 0 4 0",
  check: "M4 12l5 5L20 6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  close: "M6 6l12 12M6 18L18 6",
  settings:
    "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  edit: "M12 19l7-7-3-3-7 7v3h3z M14 7l3 3",
  flame: "M12 3c-2 4-5 6-5 10a5 5 0 1 0 10 0c0-2-1.5-3.5-3-5 .5 2.5-1 4-1 4s-2-1-1-9z",
  whistle: "M14 6l8-4-2 6-6 1z M9 10a6 6 0 1 0 6 6",
  // journey / road-traveled (FV-190)
  map: "M9 4v16l6-3 6 3V7l-6-3-6 3z M9 4L3 7v16l6-3",
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
  strokeWidth?: number;
  className?: string;
}

export function Icon({
  name,
  size = 22,
  color = "currentColor",
  filled = false,
  strokeWidth = 1.75,
  className,
}: IconProps) {
  const path = ICONS[name];

  if (filled) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        aria-hidden
        className={className}
      >
        <path d={path} />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={path} />
    </svg>
  );
}
