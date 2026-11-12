import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { WelcomeForm } from "@/components/auth/WelcomeForm";
import { SessionCheckError, requireOnboarding } from "@/lib/auth/guards";
import { isAdultSignupEnabled } from "@/lib/flags";

// FV-672 (spec FV-569 §5.2): finish setting up a verified account that has no
// profile yet (Apple / Google sign-in, or a verified email that never
// finished). Per-request, personal, never indexed. No analytics: the
// allow-list in lib/analytics/allowed-routes.ts is deny-by-default and does not
// include /welcome. Also in the SW bypass list (public/sw.js +
// lib/sw/route-strategy.ts), so it is never served from Cache Storage.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finish setting up",
  robots: { index: false, follow: false },
};

type Props = { searchParams: { as?: string } };

export default async function WelcomePage({ searchParams }: Props) {
  let email: string | null;
  try {
    ({ email } = await requireOnboarding());
  } catch (err) {
    if (!(err instanceof SessionCheckError)) throw err;
    // FV-656 pattern: a failed read is "couldn't check", never "set up now".
    return (
      <AuthShell title="We couldn't check your account">
        <p
          role="alert"
          data-testid="welcome-status-unknown"
          className="font-body text-cream/70 text-[14px] leading-relaxed mb-4"
        >
          We couldn&rsquo;t check your account. Please try again.
        </p>
        {/* Plain <a>: retry must be a full request so the check re-runs. */}
        <a
          href="/welcome"
          data-testid="welcome-status-unknown-retry"
          className="inline-flex items-center font-heading font-semibold text-[13px] text-gold underline underline-offset-2 hover:text-gold-bright min-h-[44px]"
        >
          Try again
        </a>
      </AuthShell>
    );
  }

  const adultEnabled = isAdultSignupEnabled();
  const defaultRole =
    adultEnabled && searchParams.as === "adult" ? "adult_athlete" : "parent";

  return (
    <AuthShell
      title="Finish setting up"
      subtitle="A few details and you're in."
    >
      <WelcomeForm
        email={email}
        defaultRole={defaultRole}
        adultEnabled={adultEnabled}
      />
    </AuthShell>
  );
}
