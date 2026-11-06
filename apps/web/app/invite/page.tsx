import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { InviteFlow } from "@/components/auth/InviteFlow";
import { isNativeShell } from "@/lib/native-shell";
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
      footer={
        <Link href="/signin" className="text-cream/70 hover:text-cream no-underline">
          Already set up? Sign in
        </Link>
      }
    >
      {signedIn ? (
        <p
          role="note"
          className="mb-6 rounded-[10px] border border-hairline bg-onyx px-3.5 py-3 font-body text-[13px] text-cream/70"
        >
          Someone is signed in on this device. Finishing this invite signs
          them out here and signs in the invited athlete.
        </p>
      ) : null}
      <InviteFlow nativeShell={nativeShell} />
    </AuthShell>
  );
}
