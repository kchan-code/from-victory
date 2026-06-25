import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { redirectIfAuthed } from "@/lib/auth/guards";
import { isAdultSignupEnabled } from "@/lib/flags";

export const metadata = {
  title: "Create your parent account · From Victory",
};

export default async function SignUpPage() {
  await redirectIfAuthed();

  return (
    <AuthShell
      title="Create your parent account"
      subtitle="You buy the subscription. Your athlete trains. Identity precedes performance."
    >
      <SignUpForm />
      {/* FV-326: 18+ self-serve entry — shown only when ENABLE_ADULT_SIGNUP is on,
          so the parent flow is unchanged until the feature is live. */}
      {isAdultSignupEnabled() ? (
        <p className="mt-6 border-t border-hairline pt-6 font-body text-[14px] text-cream/60 text-center">
          Are you the athlete, and 18 or older?{" "}
          <Link
            href="/signup/athlete"
            className="text-gold hover:text-gold-bright no-underline"
          >
            Create your own account
          </Link>
        </p>
      ) : null}
    </AuthShell>
  );
}
