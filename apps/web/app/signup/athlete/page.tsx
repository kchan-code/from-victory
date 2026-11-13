import { notFound } from "next/navigation";

import { AuthShell, type AuthStep } from "@/components/auth/AuthShell";
import { AdultSignUpForm } from "@/components/auth/AdultSignUpForm";
import {
  IosSignupSubscriptionNote,
  TrialDisclosure,
} from "@/components/auth/TrialDisclosure";
import { redirectIfAuthed } from "@/lib/auth/guards";
import { isAdultSignupEnabled } from "@/lib/flags";
import { getRequestShellCapability } from "@/lib/native-shell";

export const metadata = {
  title: "Create your athlete account",
};

// FV-515: adult self-serve path. Account › Trial.
const ADULT_STEPS: AuthStep[] = [
  { label: "Account", current: true },
  { label: "Trial" },
];

export default async function AdultSignUpPage() {
  // Dark until ENABLE_ADULT_SIGNUP is flipped. 404 rather than expose the
  // route while the pre-ENABLE gating is unmet (FV-328 / FV-329).
  if (!isAdultSignupEnabled()) notFound();
  await redirectIfAuthed();

  // Same native-shell rule as the parent form: web price and trial length
  // on the website only. ios-iap points at the in-app step. A restricted
  // shell shows no price.
  const shellCapability = getRequestShellCapability();

  return (
    <AuthShell
      title="Create your athlete account"
      subtitle="You train. You own it. Identity precedes performance."
      steps={ADULT_STEPS}
    >
      <AdultSignUpForm
        afterSubmit={
          shellCapability === null ? (
            <TrialDisclosure detail="Free trial for first-time subscribers. Next, you pick a plan." />
          ) : shellCapability === "ios-iap" ? (
            <IosSignupSubscriptionNote />
          ) : undefined
        }
      />
    </AuthShell>
  );
}
