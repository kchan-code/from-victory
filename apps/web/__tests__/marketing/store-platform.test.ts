import { describe, expect, it } from "vitest";

import { detectStorePlatform } from "@/lib/marketing/store-platform";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36";
const DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

describe("detectStorePlatform", () => {
  it("maps iPhone, iPad, and iPod to the App Store", () => {
    expect(detectStorePlatform(IPHONE)).toBe("ios");
    expect(detectStorePlatform(IPAD)).toBe("ios");
    expect(detectStorePlatform("Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)")).toBe(
      "ios",
    );
  });

  it("maps a touch Macintosh UA to iPadOS desktop mode", () => {
    expect(detectStorePlatform(DESKTOP, 5)).toBe("ios");
    expect(detectStorePlatform(DESKTOP, 0)).toBe("unknown");
  });

  it("maps Android phones and tablets to Google Play", () => {
    expect(detectStorePlatform(ANDROID)).toBe("android");
    expect(
      detectStorePlatform("Mozilla/5.0 (Linux; Android 13; SM-X800) AppleWebKit/537.36"),
    ).toBe("android");
  });

  it("maps desktop and empty user agents to both stores", () => {
    expect(detectStorePlatform(DESKTOP)).toBe("unknown");
    expect(
      detectStorePlatform(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      ),
    ).toBe("unknown");
    expect(detectStorePlatform("")).toBe("unknown");
    expect(detectStorePlatform(null)).toBe("unknown");
    expect(detectStorePlatform(undefined)).toBe("unknown");
  });
});
