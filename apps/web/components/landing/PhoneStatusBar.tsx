// Static iPhone-style status bar used inside phone mockups.
// Time stays "9:41" (canonical Apple-keynote time).

interface PhoneStatusBarProps {
  small?: boolean;
  lightOnDark?: boolean;
}

export function PhoneStatusBar({
  small = false,
  lightOnDark = false,
}: PhoneStatusBarProps) {
  const padding = small ? "px-[22px] pt-3 pb-1.5" : "px-[26px] pt-3.5 pb-2";
  const fontSize = small ? "text-[12px]" : "text-[13px]";
  const colorClass = lightOnDark ? "text-cream" : "";

  return (
    <div
      className={`relative flex justify-between items-center font-heading font-semibold text-cream z-[4] ${padding} ${fontSize} ${colorClass}`}
    >
      <span>9:41</span>
      <span className="inline-flex gap-[5px] items-center opacity-85">
        {/* Signal bars */}
        <svg width="14" height="10" viewBox="0 0 14 10">
          <path
            d="M1 8h2v1H1zM4 6h2v3H4zM7 4h2v5H7zM10 2h2v7h-2z"
            fill="currentColor"
          />
        </svg>
        {/* Battery */}
        <svg width="22" height="10" viewBox="0 0 22 10">
          <rect
            x="1"
            y="2"
            width="17"
            height="6"
            rx="1.5"
            stroke="currentColor"
            fill="none"
          />
          <rect x="3" y="3.5" width="10" height="3" fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}
