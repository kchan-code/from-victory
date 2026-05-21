import { AthleteClaimForm } from "@/components/auth/AthleteClaimForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata = {
  title: "Welcome · From Victory",
};

type Search = {
  searchParams: { code?: string | string[] };
};

function readCode(raw: string | string[] | undefined): string | null {
  if (typeof raw !== "string") return null;
  if (raw.length === 0) return null;
  return raw;
}

export default async function PairClaimPage({ searchParams }: Search) {
  const code = readCode(searchParams.code);

  if (!code) {
    return <InvalidLink reason="missing" />;
  }

  const service = createServiceClient();
  const { data: pairing } = await service
    .from("device_pairings")
    .select("code, athlete_id, expires_at, consumed_at")
    .eq("code", code)
    .maybeSingle();

  if (!pairing) {
    return <InvalidLink reason="not_found" />;
  }
  if (pairing.consumed_at !== null) {
    return <InvalidLink reason="used" />;
  }
  if (new Date(pairing.expires_at).getTime() < Date.now()) {
    return <InvalidLink reason="expired" />;
  }

  const { data: athlete } = await service
    .from("profiles")
    .select("first_name")
    .eq("id", pairing.athlete_id)
    .single();

  if (!athlete) {
    return <InvalidLink reason="not_found" />;
  }

  return (
    <AuthShell
      title={`Welcome, ${athlete.first_name}.`}
      subtitle="Set a password to start training. You'll use this every time you sign in on this phone."
    >
      <AthleteClaimForm code={code} />
    </AuthShell>
  );
}

function InvalidLink({
  reason,
}: {
  reason: "missing" | "not_found" | "used" | "expired";
}) {
  const messages: Record<typeof reason, string> = {
    missing:
      "This page expects a pairing link. Ask your parent to send you a fresh one from their dashboard.",
    not_found:
      "We don't recognise this pairing link. Ask your parent to send a fresh one.",
    used:
      "This pairing link has already been used. If this device is yours, head to sign in. Otherwise, ask your parent for a new link.",
    expired:
      "This pairing link has expired. Ask your parent for a fresh one — they only last 24 hours.",
  };

  return (
    <AuthShell title="That link can't be used">
      <p className="font-body text-cream/80 text-[15px] leading-relaxed">
        {messages[reason]}
      </p>
    </AuthShell>
  );
}
