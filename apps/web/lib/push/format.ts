/**
 * Shared formatting helpers for push-reminder UI.
 */

/** Format a 0-23 hour as "7:00 AM" / "7:00 PM". */
export function formatHour(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:00 ${period}`;
}
