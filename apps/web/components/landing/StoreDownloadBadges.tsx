import { AppStoreBadge } from "@/components/landing/AppStoreBadge";
import { GooglePlayBadge } from "@/components/landing/GooglePlayBadge";
import type { StorePlatform } from "@/lib/marketing/store-platform";

/** iPhone/iPad: App Store. Android: Google Play. Desktop and unknown: both. */
export function StoreDownloadBadges({ platform }: { platform: StorePlatform }) {
  const showAppStore = platform !== "android";
  const showPlay = platform !== "ios";
  return (
    <div
      className="flex flex-wrap items-center gap-3"
      data-testid="store-badges"
    >
      {showAppStore ? <AppStoreBadge /> : null}
      {showPlay ? <GooglePlayBadge /> : null}
    </div>
  );
}
