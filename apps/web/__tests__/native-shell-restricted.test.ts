import { describe, it, expect } from "vitest";

import { isRestrictedShell } from "@/lib/native-shell-restricted";

describe("isRestrictedShell (FV-659)", () => {
  it("is true for legacy-native and android-play (identical treatment today)", () => {
    expect(isRestrictedShell("legacy-native")).toBe(true);
    expect(isRestrictedShell("android-play")).toBe(true);
  });

  it("is false for ios-iap and the browser (null)", () => {
    expect(isRestrictedShell("ios-iap")).toBe(false);
    expect(isRestrictedShell(null)).toBe(false);
  });
});
