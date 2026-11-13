import Image from "next/image";
import { PLAY_STORE_URL } from "@/lib/marketing/play-store";

// Cropped "Get it on Google Play" lockup with the built-in clear space
// removed, so the artwork is 44px tall and lines up with the App Store
// badge (132×44). The file's pixels are higher resolution; display size
// is 148×44. The unmodified badge with Google's padding still sits at
// get-it-on-google-play.png. Guidelines: https://play.google.com/intl/en_us/badges/

const BADGE_HEIGHT = 44;
const BADGE_WIDTH = 148;

export function GooglePlayBadge() {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block shrink-0 leading-none"
    >
      <Image
        src="/images/badges/google-play-badge-cropped.png"
        alt="Get it on Google Play"
        width={BADGE_WIDTH}
        height={BADGE_HEIGHT}
        unoptimized
        className="block h-11 w-[148px]"
        style={{ height: BADGE_HEIGHT, width: BADGE_WIDTH }}
      />
    </a>
  );
}
