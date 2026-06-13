import { AuthShell } from "@/components/auth/AuthShell";
import { GrantsManager } from "@/components/admin/GrantsManager";
import { requireAdminParent } from "@/lib/auth/admin";
import { listCompGrants } from "@/lib/actions/grants";

export const metadata = {
  title: "Comp grants (admin) · From Victory",
  robots: { index: false, follow: false },
};

export default async function AdminGrantsPage() {
  // notFound() for non-admins. Hidden surface.
  await requireAdminParent();

  // Fetch current grants server-side so the initial render is populated.
  // On grant/revoke, the Client Component calls router.refresh() which
  // re-runs this Server Component and re-hydrates the list.
  const result = await listCompGrants();
  const grants = result?.ok ? result.grants : [];

  return (
    <AuthShell
      title="Free-access grants"
      subtitle="Hand out comp accounts to beta testers, coaches, and friends & family. Revoke any time."
    >
      <GrantsManager initialGrants={grants} />
    </AuthShell>
  );
}
