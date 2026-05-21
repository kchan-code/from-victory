import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { redirectIfAuthed } from "@/lib/auth/guards";

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
    </AuthShell>
  );
}
