import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { InvitePanel } from "@/components/dashboard/InvitePanel";
import { requireParent } from "@/lib/auth/guards";
import { getInviteStatusMap } from "@/lib/invites/status";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Invite athlete",
};

type Params = {
  params: { id: string };
};

/**
 * Invite / recovery page for one athlete (FV-630). The route keeps its
 * legacy `/pair` path so existing bookmarks and dashboard links still work.
 */
export default async function InviteAthletePage({ params }: Params) {
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

  const statusMap = await getInviteStatusMap();
  const status = statusMap ? (statusMap.get(athlete.id) ?? null) : null;
  const ready = status?.state === "ready";

  return (
    <AuthShell
      title={
        ready
          ? `${athlete.first_name}'s account`
          : `Invite ${athlete.first_name}`
      }
      footer={
        <Link
          href="/dashboard"
          className="text-cream/70 hover:text-cream no-underline"
        >
          Back to dashboard
        </Link>
      }
    >
      <InvitePanel
        athleteId={athlete.id}
        athleteFirstName={athlete.first_name}
        status={status}
      />
    </AuthShell>
  );
}
