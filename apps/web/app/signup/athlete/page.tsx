import { notFound } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { AdultSignUpForm } from "@/components/auth/AdultSignUpForm";
import { redirectIfAuthed } from "@/lib/auth/guards";
import { isAdultSignupEnabled } from "@/lib/flags";

export const metadata = {
  title: "Create your athlete account · From Victory",
};

export default async function AdultSignUpPage() {
  // Dark until ENABLE_ADULT_SIGNUP is flipped — 404 rather than expose the
  // route while the pre-ENABLE gating is unmet (FV-328 / FV-329).
  if (!isAdultSignupEnabled()) notFound();
  await redirectIfAuthed();

  return (
    <AuthShell
      title="Create your athlete account"
      subtitle="You train. You own it. Identity precedes performance."
    >
      <AdultSignUpForm />
    </AuthShell>
  );
}
