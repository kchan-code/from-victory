/**
 * Which store badge an invite (or similar) page should show.
 *
 *   ios: iPhone, iPad, iPod. iPadOS desktop mode reports a Macintosh
 *     user agent; a touch Mac user agent is treated as an iPad.
 *   android: Android phones and tablets.
 *   unknown: desktop and anything else. Show both stores.
 *
 * This does not claim which countries a store listing covers.
 */
export type StorePlatform = "ios" | "android" | "unknown";

export function detectStorePlatform(
  userAgent: string | null | undefined,
  maxTouchPoints = 0,
): StorePlatform {
  const ua = userAgent ?? "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  // iPadOS 13+ "Request Desktop Website" drops iPad from the UA.
  if (/Macintosh/i.test(ua) && maxTouchPoints > 1) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "unknown";
}
