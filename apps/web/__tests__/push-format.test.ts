/**
 * Unit tests for the shared push-reminder hour formatter (FV-244).
 * Pins the 12-hour conversion edge cases after extracting formatHour into
 * lib/push/format.ts (was duplicated in ReminderSettings.tsx + settings/page.tsx).
 */

import { describe, it, expect } from "vitest";

import { formatHour } from "@/lib/push/format";

describe("formatHour", () => {
  it("renders midnight (0) as 12:00 AM", () => {
    expect(formatHour(0)).toBe("12:00 AM");
  });

  it("renders noon (12) as 12:00 PM", () => {
    expect(formatHour(12)).toBe("12:00 PM");
  });

  it("renders morning hours with AM", () => {
    expect(formatHour(7)).toBe("7:00 AM");
    expect(formatHour(11)).toBe("11:00 AM");
  });

  it("renders afternoon/evening hours with PM and 12-hour conversion", () => {
    expect(formatHour(13)).toBe("1:00 PM");
    expect(formatHour(19)).toBe("7:00 PM");
    expect(formatHour(23)).toBe("11:00 PM");
  });
});
