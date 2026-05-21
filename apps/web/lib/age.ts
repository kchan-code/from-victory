/**
 * Compute years between two YYYY-MM-DD-style dates using UTC getters.
 *
 * Both arguments are interpreted in UTC. Mixing UTC getters with locally-
 * constructed `new Date()` would create a timezone bypass at midnight near
 * a 13th birthday — see PR #20 kids-privacy-officer HIGH #1.
 *
 * Callers should pass a `now` constructed in UTC (e.g. `new Date()` is fine
 * because the underlying Date object holds a UTC epoch — only its getters
 * are zone-aware, which is what we control here).
 */
export function yearsBetweenUTC(birthdate: Date, now: Date): number {
  let years = now.getUTCFullYear() - birthdate.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birthdate.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getUTCDate() < birthdate.getUTCDate())
  ) {
    years--;
  }
  return years;
}

/**
 * Parse a YYYY-MM-DD birthdate string and compute age against current UTC
 * date. Returns null if the input doesn't parse. Used both server-side
 * (createAthlete validation) and to render age in the parent dashboard.
 */
export function ageFromBirthdate(birthdate: string): number | null {
  const d = new Date(`${birthdate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return yearsBetweenUTC(d, new Date());
}
