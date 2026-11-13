import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { APP_STORE_URL } from "@/lib/marketing/app-store";
import { PLAY_STORE_URL } from "@/lib/marketing/play-store";
import {
  parseUpdatePlatformParam,
  resolveUpdateRequired,
} from "@/lib/native-build-gate";

export const metadata = {
  title: "Update required",
  robots: { index: false, follow: false },
};

/**
 * /update-required (FV-717): shown to a store app whose build is below the
 * server's minimum for its platform. middleware.ts redirects every page
 * navigation from such a build here.
 *
 * Public on purpose (no auth guard): the gate applies before sign-in too, and
 * a guard would bounce a signed-out shell to /signin, which middleware would
 * send straight back here.
 *
 * Which store to link: the request's own User-Agent decides when it says the
 * app is gated. If it does not (a service worker re-issued the navigation and
 * dropped the shell's UA, FV-489), the `?p=` platform middleware put on the
 * redirect is used instead. Without either, the visitor is sent home. This
 * page therefore NEVER redirects a visitor who arrived from the gate, which
 * is what rules out a loop with middleware. It is harmless for anyone to open
 * `?p=ios` directly: they see a link to the public store listing.
 *
 * The store link is a plain <a>: neither store host is in the shell's
 * allowNavigation list (apps/native/capacitor.config.ts), so the tap leaves
 * the WebView and opens the store. No price, no purchase path, no billing
 * language: this screen is seen by athletes of every age.
 */
export default async function UpdateRequiredPage(props: {
  searchParams?: Promise<{ p?: string | string[] }>;
}) {
  const userAgent = (await headers()).get("user-agent");
  const platform =
    resolveUpdateRequired(userAgent) ??
    parseUpdatePlatformParam((await props.searchParams)?.p);
  if (platform === null) redirect("/");

  const store =
    platform === "ios"
      ? { href: APP_STORE_URL, label: "Update on the App Store" }
      : { href: PLAY_STORE_URL, label: "Update on Google Play" };

  return (
    <main
      id="main-content"
      className="min-h-screen bg-onyx flex flex-col px-5 pb-[calc(48px+env(safe-area-inset-bottom,0px))]"
    >
      <header className="flex items-center gap-2 pt-[52px] pb-0">
        <Image
          src="/logo-icon.svg"
          alt=""
          width={64}
          height={36}
          className="block h-9 w-auto"
          priority
        />
        <Image
          src="/logo-wordmark.svg"
          alt="From Victory"
          width={100}
          height={32}
          className="block h-7 w-auto translate-y-[2px]"
          priority
        />
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-[420px] mx-auto w-full pt-8 pb-10">
        <p className="font-mono font-semibold text-[11px] uppercase tracking-[0.22em] text-gold mb-4">
          Update required
        </p>
        <h1 className="font-display font-extrabold uppercase tracking-[0.03em] text-cream text-[32px] sm:text-[36px] leading-[1.05] mb-5">
          Update the app to keep training.
        </h1>
        <p className="font-body text-cream/70 text-[15px] leading-relaxed mb-8">
          This version of From Victory is no longer supported. Your account
          and everything in it stay exactly as they are.
        </p>
        <a
          href={store.href}
          data-testid="update-required-store-link"
          data-platform={platform}
          className="inline-flex items-center justify-center font-heading font-semibold text-[15px] text-onyx bg-gold border border-gold rounded-pill px-6 min-h-[48px] no-underline hover:bg-gold-bright transition-colors duration-base ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx active:scale-[0.98]"
        >
          {store.label}
        </a>
      </div>
    </main>
  );
}
