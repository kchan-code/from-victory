"use client";
// client: calls clearAthleteCache() + clearPregameSession() (localStorage)
// in the submit handler before the signOut server action fires. Cannot do
// this server-side.

import { clearAthleteCache } from "@/lib/pregame/athlete-cache";
import { clearPregameSession } from "@/lib/pregame/session-cache";
import { signOut } from "@/lib/actions/auth";

interface SignOutButtonProps {
  /** Tailwind class string forwarded to the <button>. Matches existing sign-out
   *  button styling at each surface — caller provides it so we don't bake in
   *  a single visual style that diverges between dashboard / athlete / daily. */
  className?: string;
  /** Button label. Defaults to "Sign out". */
  children?: React.ReactNode;
}

/**
 * SignOutButton (FV-154)
 *
 * Wraps the `signOut` server action in a `<form>` and calls
 * `clearAthleteCache()` on submit so the `fv_athlete_cache` localStorage
 * entry (athlete first name + sport, written by PregameClientShell for
 * offline fallback) is wiped before the server redirects away from the
 * authenticated surface.
 *
 * Usage — drop in wherever a raw `<form action={signOut}>` existed:
 *   <SignOutButton className="...existing-button-classes..." />
 *
 * The className prop forwards the exact button Tailwind classes from the
 * original call site so the visual output is identical.
 */
export function SignOutButton({ className, children = "Sign out" }: SignOutButtonProps) {
  function handleSubmit() {
    // Clear offline caches synchronously on submit, before the server action
    // redirects. Both are no-ops if localStorage is unavailable (private
    // browsing, SSR guard hit somehow).
    clearAthleteCache();
    clearPregameSession();
  }

  return (
    <form action={signOut} onSubmit={handleSubmit}>
      <button
        type="submit"
        className={className}
        data-testid="sign-out-btn"
      >
        {children}
      </button>
    </form>
  );
}
