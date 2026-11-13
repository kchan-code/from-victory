import Link from "next/link";

import { AuthShell, type AuthStep } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { TrialDisclosure } from "@/components/auth/TrialDisclosure";
import { Icon } from "@/components/ui";
import { redirectIfAuthed } from "@/lib/auth/guards";
import { isAdultSignupEnabled } from "@/lib/flags";
import { getRequestShellCapability } from "@/lib/native-shell";

export const metadata = {
  title: "Create your parent account",
};

// FV-515: parent path. Account › Athlete › Trial.
const PARENT_STEPS: AuthStep[] = [
  { label: "Account", current: true },
  { label: "Athlete" },
  { label: "Trial" },
];

export default async function SignUpPage() {
  await redirectIfAuthed();

  // The parent form stays immediately visible. The 18+ path is a row under
  // the subtitle, only when adult signup is enabled.
  const adultSignupEnabled = isAdultSignupEnabled();
  // Web and PWA show the 7-day price line. A native shell does not: ios-iap
  // takes price and trial from StoreKit, and a restricted shell shows no price.
  const showWebTrialCopy = getRequestShellCapability() === null;

  return (
    <AuthShell
      title="Create your parent account"
      subtitle="You buy the subscription. Your athlete trains. Identity precedes performance."
      steps={adultSignupEnabled ? PARENT_STEPS : undefined}
    >
      {adultSignupEnabled ? (
        <Link
          href="/signup/athlete"
          data-testid="signup-adult-entry"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3.5 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
        >
          <span className="font-heading font-semibold text-[14px] leading-snug text-cream">
            Training yourself and 18 or older? Create your own account
          </span>
          <Icon name="arrowRight" size={18} className="shrink-0 text-gold" />
        </Link>
      ) : null}
      <SignUpForm
        afterSubmit={
          showWebTrialCopy ? (
            <TrialDisclosure detail="Free trial for first-time subscribers with one athlete. Next, add your athlete from your dashboard." />
          ) : undefined
        }
      />
    </AuthShell>
  );
}
