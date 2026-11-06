import { createHash } from "crypto";

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { InviteSetupForm } from "@/components/auth/InviteSetupForm";
import { normalizeInviteCode } from "@/lib/invites/code";
import { inviteAppPath } from "@/lib/invites/universal-link";
import { createServiceClient } from "@/lib/supabase/service";

const siteUrl = "https://www.fromvictoryapp.com";
const appSocialImage = `${siteUrl}/og-app-1200x630.png`;

// LEGACY pairing link (`/pair?code=`, FV-177). FV-630 replaced it with
// `/invite#code=` readable invites; links already sent keep working here
// until they expire (7-day TTL). Claims go through the same atomic
// claimAthleteInvite path, so a set-up account keeps its username.
// Uses the Kinny-signed app card, not the marketing website card.
export const metadata: Metadata = {
  title: "Welcome",
  openGraph: {
    type: "website",
    url: `${siteUrl}/pair`,
    siteName: "From Victory",
    images: [
      {
        url: appSocialImage,
        secureUrl: appSocialImage,
        type: "image/png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [appSocialImage],
  },
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

  // A readable FV-630 code pasted into the old URL shape: hand it to /invite
  // (fragment, not query) without any lookup here, so the readable-code path
  // is always the rate-limited one.
  const readable = normalizeInviteCode(code);
  if (readable) {
    redirect(inviteAppPath(readable));
  }

  // FV-177: pairing codes are stored hashed (sha256 hex). Hash the inbound
  // raw code from the URL and look up by code_sha256. The raw code is never
  // stored or logged here; it is passed to the claim form, which re-validates
  // it atomically in the claimPairing server action.
  const codeHash = createHash("sha256").update(code).digest("hex");

  const service = createServiceClient();
  const { data: pairing } = await service
    .from("device_pairings")
    .select("athlete_id, expires_at, consumed_at")
    .eq("code_sha256", codeHash)
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
    .select("first_name, username")
    .eq("id", pairing.athlete_id)
    .single();

  if (!athlete) {
    return <InvalidLink reason="not_found" />;
  }

  const mode = athlete.username ? "recovery" : "invite";

  return (
    <AuthShell title={`Welcome, ${athlete.first_name}.`}>
      <InviteSetupForm
        code={code}
        firstName={athlete.first_name}
        mode={mode}
        username={mode === "recovery" ? athlete.username : null}
      />
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
      "This page expects an invite link. Ask your parent to create a new invite from their dashboard.",
    not_found:
      "We don't recognise this link. Ask your parent to create a new invite.",
    used:
      "This link has already been used. If your account is set up, sign in with your username. Otherwise, ask your parent for a new invite.",
    expired:
      "This link has expired. Ask your parent to create a new invite.",
  };

  return (
    <AuthShell title="That link can't be used">
      <p className="font-body text-cream/80 text-[15px] leading-relaxed">
        {messages[reason]}
      </p>
    </AuthShell>
  );
}
