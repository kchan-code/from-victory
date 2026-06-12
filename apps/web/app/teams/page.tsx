import type { Metadata } from "next";
import Link from "next/link";
import { FlameMark } from "@/components/ui";
import { LandingIconDefs } from "@/components/landing/icons";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { Footer } from "@/components/landing/Footer";
import { SvgIcon } from "@/components/landing/SvgIcon";

const siteUrl = "https://www.fromvictoryapp.com";

export const metadata: Metadata = {
  title: "For Teams & Churches · From Victory",
  description:
    "Bring From Victory to your team, school, or church. Team and group pricing is in development. Contact us to learn more.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/teams`,
    siteName: "From Victory",
    title: "For Teams & Churches · From Victory",
    description:
      "Team and group pricing is coming. Contact us to learn more.",
    images: [
      {
        url: `${siteUrl}/from-victory-social-preview.jpg`,
        width: 1200,
        height: 630,
      },
    ],
  },
};

// This page is a minimal placeholder — FV-234 replaces it with full team pricing.
export default function TeamsPage() {
  return (
    <>
      <LandingIconDefs />
      <ScrollNav />

      <section className="relative min-h-[80dvh] pt-[168px] md:pt-[140px] pb-24 flex items-center overflow-hidden isolate">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 fv-hero-bg" />
        </div>
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 w-full">
          <div className="max-w-[640px]">
            <div className="mb-8 inline-block">
              <FlameMark size={48} />
            </div>

            <div className="inline-flex items-center gap-3 mb-7">
              <span className="fv-pulse-dot" />
              <span className="fv-eyebrow">For Teams &amp; Churches</span>
            </div>

            <h1 className="fv-h-hero mb-[26px] max-w-[20ch]">
              Team pricing is{" "}
              <em>on the way.</em>
            </h1>

            <p className="max-w-[48ch] mb-9 text-cream/70 text-[clamp(16px,1.4vw,19px)] leading-[1.55]">
              We&apos;re building a team and group option for coaches, chaplains,
              schools, and churches. If you&apos;d like to bring From Victory to
              your team, reach out — we&apos;re talking to early partners now.
            </p>

            <div className="flex flex-wrap gap-3">
              {/* Routes to the waitlist form (which has a Coach role option)
                  rather than a mailto — hello@ has no verified email route
                  yet (only privacy@ is routed), and a bouncing mailto loses
                  the lead. FV-234 builds the real intake. */}
              <a
                href="/#waitlist"
                className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
              >
                Request team pricing
                <SvgIcon name="arrow" size={16} />
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2.5 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-charcoal active:scale-[0.97]"
              >
                Back to home
              </Link>
            </div>

            <div className="mt-10 pt-8 border-t border-hairline">
              <p className="font-body text-[13.5px] text-cream/40 max-w-[40ch]">
                Individual subscriptions are available now — $49/yr or $5/mo,
                14-day free trial.{" "}
                <Link
                  href="/pricing"
                  className="text-cream/60 hover:text-cream underline underline-offset-2 transition-colors duration-fast ease-out"
                >
                  See individual pricing.
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
