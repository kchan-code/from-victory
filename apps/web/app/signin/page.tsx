import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";
import { redirectIfAuthed } from "@/lib/auth/guards";

export const metadata = {
  title: "Sign in · From Victory",
};

export default async function SignInPage() {
  await redirectIfAuthed();

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your parent account.">
      <SignInForm />
    </AuthShell>
  );
}
