import { AuthShell } from "@/components/auth/AuthShell";
import { AthleteForm } from "@/components/dashboard/AthleteForm";
import { requireParent } from "@/lib/auth/guards";

export const metadata = {
  title: "Add an athlete",
};

export default async function NewAthletePage() {
  await requireParent();

  return (
    <AuthShell
      title="Add an athlete"
      subtitle="We only need a first name and a birthdate. No email, no last name, no photos."
    >
      <AthleteForm />
    </AuthShell>
  );
}
