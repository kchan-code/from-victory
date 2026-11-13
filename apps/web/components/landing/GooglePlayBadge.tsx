import Image from "next/image";
import { PLAY_STORE_URL } from "@/lib/marketing/play-store";

// Official "Get it on Google Play" badge (English). Artwork is Google's PNG,
// unmodified, including the built-in clear space, from
// https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png
// Guidelines: https://play.google.com/intl/en_us/badges/
// The file is 646×250 with the lockup inset. At 66px tall the lockup is
// about 44px, matching the App Store badge and the tap-target floor.

const BADGE_HEIGHT = 66;
// 646 / 250 * 66, rounded. Keeps the official aspect ratio.
const BADGE_WIDTH = 171;

export function GooglePlayBadge() {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block leading-none"
    >
      <Image
        src="/images/badges/get-it-on-google-play.png"
        alt="Get it on Google Play"
        width={BADGE_WIDTH}
        height={BADGE_HEIGHT}
        unoptimized
        className="block h-[66px] w-auto"
        style={{ height: BADGE_HEIGHT, width: "auto" }}
      />
    </a>
  );
}
