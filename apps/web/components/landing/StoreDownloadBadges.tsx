import { AppStoreBadge } from "@/components/landing/AppStoreBadge";
import { GooglePlayBadge } from "@/components/landing/GooglePlayBadge";
import type { StorePlatform } from "@/lib/marketing/store-platform";

type Props = {
  /** null while the device is still unknown. Renders a skeleton, not both badges. */
  platform: StorePlatform | null;
  className?: string;
};

/** iPhone/iPad: App Store. Android: Google Play. Desktop and unknown: both. */
export function StoreDownloadBadges({ platform, className }: Props) {
  if (!platform) {
    return (
      <div
        data-testid="store-badges-skeleton"
        aria-hidden="true"
        className="h-11 w-[132px] rounded-lg bg-cream/10"
      />
    );
  }

  const showAppStore = platform !== "android";
  const showPlay = platform !== "ios";
  return (
    <div
      className={`flex flex-nowrap items-center ${className ?? "gap-3"}`}
      data-testid="store-badges"
    >
      {showAppStore ? <AppStoreBadge /> : null}
      {showPlay ? <GooglePlayBadge /> : null}
    </div>
  );
}
