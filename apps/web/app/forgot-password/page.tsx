import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { redirectIfAuthed } from "@/lib/auth/guards";

export const metadata = {
  title: "Reset your password",
};

export default async function ForgotPasswordPage() {
  await redirectIfAuthed();

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email on your parent account. We'll send a reset link if we find a match."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
