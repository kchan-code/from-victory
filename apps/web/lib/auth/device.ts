import "server-only";

import { cookies } from "next/headers";

/**
 * Device-pairing cookie. Binds a physical device (browser) to a single
 * athlete account so that subsequent /signin visits can show
 * "Welcome back, Jordan" + password-only instead of an email field.
 *
 * Important: this cookie is NOT auth. It only tells the UI which sign-in
 * form to render. Real authentication is the Supabase session cookies
 * managed by @supabase/ssr. Tampering with this cookie has zero blast
 * radius — the only effect is which form the user sees next.
 */
const COOKIE_NAME = "fv_device_athlete_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function getDeviceAthleteId(): string | null {
  const store = cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export function setDeviceAthleteId(athleteId: string): void {
  const store = cookies();
  store.set(COOKIE_NAME, athleteId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
}

export function clearDeviceAthleteId(): void {
  const store = cookies();
  store.delete(COOKIE_NAME);
}
