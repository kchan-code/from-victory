import { notFound } from "next/navigation";

import { AuthShell, type AuthStep } from "@/components/auth/AuthShell";
import { AdultSignUpForm } from "@/components/auth/AdultSignUpForm";
import { TrialDisclosure } from "@/components/auth/TrialDisclosure";
import { redirectIfAuthed } from "@/lib/auth/guards";
import { isAdultSignupEnabled } from "@/lib/flags";

export const metadata = {
  title: "Create your athlete account",
};

// FV-515: adult self-serve path. Account → Trial.
const ADULT_STEPS: AuthStep[] = [
  { label: "Account", current: true },
  { label: "Trial" },
];

export default async function AdultSignUpPage() {
  // Dark until ENABLE_ADULT_SIGNUP is flipped — 404 rather than expose the
  // route while the pre-ENABLE gating is unmet (FV-328 / FV-329).
  if (!isAdultSignupEnabled()) notFound();
  await redirectIfAuthed();

  return (
    <AuthShell
      title="Create your athlete account"
      subtitle="You train. You own it. Identity precedes performance."
      steps={ADULT_STEPS}
    >
      <AdultSignUpForm
        afterSubmit={
          <TrialDisclosure>
            After you create your account, you&apos;ll head to checkout. 14
            days free for first-time subscribers, then $5/mo or $49/yr,
            cancel anytime. Card required. It will be charged
            automatically when the trial ends unless you cancel first.
          </TrialDisclosure>
        }
      />
    </AuthShell>
  );
}
