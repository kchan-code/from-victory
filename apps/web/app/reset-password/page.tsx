import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Choose a new password · From Victory",
};

export default async function ResetPasswordPage() {
  // The /auth/callback route handler exchanges the recovery code into a
  // session before redirecting here. If we don't have a user here, the
  // link was missing, malformed, or expired.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell title="That reset link can't be used">
        <p className="font-body text-cream/85 text-[15px] leading-relaxed mb-6">
          The link may have expired, already been used, or never finished
          loading. Reset links are valid for one hour.
        </p>
        <Link
          href="/forgot-password"
          className="text-gold hover:text-gold-bright no-underline font-heading font-semibold text-[14px]"
        >
          Request a fresh link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something memorable. After you save it, you'll be signed in."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
