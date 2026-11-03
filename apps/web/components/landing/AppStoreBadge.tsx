import Image from "next/image";
import { FlameMark } from "@/components/ui";
import { APP_STORE_URL } from "@/lib/marketing/app-store";

// Official "Download on the App Store" badge (US English, preferred black
// lockup). Artwork is Apple's SVG, unmodified, from
// https://toolbox.marketingtools.apple.com/api/badges/download-on-the-app-store/black/en-us
// Guidelines: https://developer.apple.com/app-store/marketing/guidelines/
// Minimum on-screen height is 40px. 44px keeps the artwork proportional
// and meets the site's tap-target floor. Clear space around the badge is
// the caller's job (at least one-quarter of the rendered height).

const BADGE_HEIGHT = 44;
// Native art is 119.66407 x 40. Width at 44px height, rounded.
const BADGE_WIDTH = 132;

export function AppStoreBadge() {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block leading-none"
    >
      <Image
        src="/images/badges/download-on-the-app-store.svg"
        alt="Download on the App Store"
        width={BADGE_WIDTH}
        height={BADGE_HEIGHT}
        unoptimized
        className="block h-11 w-auto"
        style={{ height: BADGE_HEIGHT, width: "auto" }}
      />
    </a>
  );
}

/** Sport-landing availability card. One source so the seven pages cannot drift. */
export function AppStoreAvailabilityCard() {
  return (
    <>
      <div className="flex items-center gap-2.5 mb-5">
        <FlameMark size={16} />
        <span className="fv-eyebrow gold">On the US App Store</span>
      </div>
      <p className="font-body text-[15px] leading-[1.6] text-cream/80 m-0">
        From Victory is available on the US App Store. It is not on Google Play.
        You can also open it in the browser.
      </p>
      {/* 16px is more than one-quarter of the 44px badge. */}
      <div className="mt-4 mb-4">
        <AppStoreBadge />
      </div>
      <p className="font-body text-[15px] leading-[1.6] text-cream/80 m-0">
        Play hard, fearless, and free.
      </p>
    </>
  );
}
