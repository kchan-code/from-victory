import Link from "next/link";

import { AuthShell, type AuthStep } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { TrialDisclosure } from "@/components/auth/TrialDisclosure";
import { redirectIfAuthed } from "@/lib/auth/guards";
import { isAdultSignupEnabled } from "@/lib/flags";

export const metadata = {
  title: "Create your parent account",
};

// FV-515: parent path. Account → Athlete → Trial.
const PARENT_STEPS: AuthStep[] = [
  { label: "Account", current: true },
  { label: "Athlete" },
  { label: "Trial" },
];

export default async function SignUpPage() {
  await redirectIfAuthed();

  // KC decision (FV-515): the parent form stays immediately visible — no
  // interstitial chooser, zero added friction for the primary buyer. The
  // 18+ athlete path renders as a clearly-labeled secondary card on the
  // same screen, flag-gated exactly as the entry link was before.
  const adultSignupEnabled = isAdultSignupEnabled();

  return (
    <AuthShell
      title="Create your parent account"
      subtitle="You buy the subscription. Your athlete trains. Identity precedes performance."
      steps={adultSignupEnabled ? PARENT_STEPS : undefined}
    >
      <SignUpForm
        afterSubmit={
          adultSignupEnabled ? (
            <TrialDisclosure>
              After you create your account, add your athlete from your
              dashboard. 14 days free for first-time subscribers, then
              $5/mo or $49/yr, cancel anytime. Card required — it will be
              charged automatically when the trial ends unless you cancel
              first.
            </TrialDisclosure>
          ) : undefined
        }
      />
      {/* FV-326/FV-515: 18+ self-serve entry — shown only when
          ENABLE_ADULT_SIGNUP is on, so the parent flow is unchanged until
          the feature is live. Same screen as the parent form (no blocking
          chooser); a clearly-labeled secondary card, not a second
          competing CTA. */}
      {adultSignupEnabled ? (
        <div className="mt-8 border-t border-hairline pt-6">
          <div className="rounded-xl border border-hairline px-5 py-4">
            <p className="font-body text-cream/70 text-[14px] leading-relaxed m-0">
              Are you the athlete, and 18 or older?{" "}
              <Link
                href="/signup/athlete"
                className="text-gold hover:text-gold-bright no-underline font-semibold"
              >
                Create your own account
              </Link>
            </p>
          </div>
        </div>
      ) : null}
    </AuthShell>
  );
}
