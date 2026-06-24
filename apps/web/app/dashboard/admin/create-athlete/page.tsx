import { AuthShell } from "@/components/auth/AuthShell";
import { CreateAthleteDirectForm } from "@/components/admin/CreateAthleteDirectForm";
import { requireAdminParent } from "@/lib/auth/admin";

export const metadata = {
  title: "Create athlete (admin) · From Victory",
  robots: { index: false, follow: false },
};

export default async function AdminCreateAthletePage() {
  // notFound() for non-admins. Hidden surface.
  await requireAdminParent();

  return (
    <AuthShell
      title="Create athlete directly"
      subtitle="Admin-only beta-testing path. Creates an athlete with a username + password (no pairing link needed)."
    >
      <CreateAthleteDirectForm />
    </AuthShell>
  );
}
