import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { PairingPanel } from "@/components/dashboard/PairingPanel";
import { requireParent } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Pair a device",
};

type Params = {
  params: { id: string };
};

export default async function PairAthletePage({ params }: Params) {
  await requireParent();

  const supabase = createClient();
  // RLS scopes this to linked athletes; an unlinked id returns null.
  const { data: athlete } = await supabase
    .from("profiles")
    .select("id, first_name")
    .eq("id", params.id)
    .eq("role", "athlete")
    .maybeSingle();

  if (!athlete) notFound();

  return (
    <AuthShell
      title={`Pair ${athlete.first_name}'s device`}
      footer={
        <Link
          href="/dashboard"
          className="text-cream/70 hover:text-cream no-underline"
        >
          Back to dashboard
        </Link>
      }
    >
      <PairingPanel
        athleteId={athlete.id}
        athleteFirstName={athlete.first_name}
      />
    </AuthShell>
  );
}
