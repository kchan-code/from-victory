import { AthleteUsernameSignInForm } from "./AthleteUsernameSignInForm";
import { SignInForm } from "./SignInForm";
import { SsoButtons } from "./SsoButtons";
import type { SsoEntry } from "@/lib/auth/sso-visibility";

const headingClass =
  "mb-5 font-display font-semibold uppercase tracking-[0.10em] text-[12px] text-cream/80";

/**
 * FV-674 (spec FV-569 §3): one door for both adult roles, replacing the
 * Parent/Athlete tabs (FV-320).
 *
 * Primary section: Apple, Google, "or use email", email + password.
 * Secondary section: the under-18 username form. It never receives an SSO
 * entry and renders no SSO buttons, whatever the flags or UA say (R5): a
 * minor athlete has no Apple/Google door, structurally.
 */
export function SignInSections({
  sso,
  legacyNative = false,
}: {
  sso: SsoEntry;
  /** Forwarded to SignInForm (FV-621). */
  legacyNative?: boolean;
}) {
  return (
    <div>
      <section aria-labelledby="signin-primary-heading" data-testid="signin-primary">
        <h2 id="signin-primary-heading" className={headingClass}>
          Parent or Athlete 18+
        </h2>
        <SsoButtons entry={sso} />
        <SignInForm legacyNative={legacyNative} />
      </section>

      <section
        aria-labelledby="signin-under18-heading"
        data-testid="signin-under18"
        className="mt-8 border-t border-hairline pt-6"
      >
        <h2 id="signin-under18-heading" className={headingClass}>
          Athlete under 18? Sign in with your username
        </h2>
        <AthleteUsernameSignInForm />
      </section>

      {/* FV-630: the in-app front door for a new athlete. */}
      <div className="mt-8 pt-6 border-t border-hairline">
        <a
          href="/invite"
          data-testid="signin-have-invite"
          className="flex w-full items-center justify-center min-h-[44px] bg-charcoal text-cream border border-hairline hover:border-cream/30 font-heading font-semibold text-[15px] rounded-pill px-6 no-underline transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
        >
          I have an invite
        </a>
      </div>
    </div>
  );
}
