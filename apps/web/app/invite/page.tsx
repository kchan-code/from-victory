import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { InviteFlow } from "@/components/auth/InviteFlow";
import { ClearOfflinePregameOnMount } from "@/components/pregame/ClearOfflinePregameOnMount";
import { isNativeShell } from "@/lib/native-shell";
import { detectStorePlatform } from "@/lib/marketing/store-platform";
import { createClient } from "@/lib/supabase/server";

const siteUrl = "https://www.fromvictoryapp.com";
const appSocialImage = `${siteUrl}/og-app-1200x630.png`;

// FV-630: the URL a parent texts (`/invite#code=...`). The code lives in the
// fragment, so this server render never sees it; link previews unfurl this
// generic app card. Same Kinny-signed app card as /pair and /signin.
export const metadata: Metadata = {
  title: "Your invite",
  openGraph: {
    type: "website",
    url: `${siteUrl}/invite`,
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
  robots: { index: false, follow: false },
};

// Per-request: the native-shell UA hint and session state differ per caller.
export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const nativeShell = isNativeShell();
  const initialPlatform = detectStorePlatform(headers().get("user-agent"));

  // Someone already signed in on this device (a parent on their own phone, or
  // another athlete) is told up front that finishing setup switches the
  // device to this athlete. Presentation only — no redirect.
  let signedIn = false;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = user !== null;
  } catch {
    signedIn = false;
  }

  return (
    <AuthShell
      title="Your invite"
      compact
      footer={
        <Link href="/signin" className="text-cream/70 hover:text-cream no-underline">
          Already set up? Sign in
        </Link>
      }
    >
      {/* FV-625: finishing an invite can switch the signed-in athlete on this
          device without passing /signin — drop the previous athlete's
          offline-pregame entry first (see the component's doc). */}
      <ClearOfflinePregameOnMount />
      <InviteFlow
        nativeShell={nativeShell}
        initialPlatform={initialPlatform}
        signedIn={signedIn}
      />
    </AuthShell>
  );
}
