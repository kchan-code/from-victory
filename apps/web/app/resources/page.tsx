// /resources — SEO cornerstone index (FV-238).
// Server Component. Public — no auth required.
// AUTHORED copy in this file is flagged inline for KC review.

import type { Metadata } from "next";
import Link from "next/link";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";
import { LandingIconDefs } from "@/components/landing/icons";
import { getAllArticles, type Article } from "@/lib/resources/articles";

const siteUrl = "https://www.fromvictoryapp.com";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

// AUTHORED metadata description:
export const metadata: Metadata = {
  title: "Resources · From Victory",
  description:
    "Articles on faith, mental toughness, and competing as a Christian athlete. Free evergreen resources from From Victory.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/resources`,
    siteName: "From Victory",
    title: "Resources · From Victory",
    description:
      "Articles on faith, mental toughness, and competing as a Christian athlete. Free evergreen resources from From Victory.",
    images: [
      {
        url: `${siteUrl}/from-victory-social-preview.jpg`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resources · From Victory",
    description:
      "Articles on faith, mental toughness, and competing as a Christian athlete.",
    images: [`${siteUrl}/from-victory-social-preview.jpg`],
  },
};

// ---------------------------------------------------------------------------
// Audience label helper
// ---------------------------------------------------------------------------

function audienceLabel(audience: Article["audience"]): string {
  return audience === "athlete" ? "For athletes" : "For parents";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ResourcesPage() {
  const articles = getAllArticles();

  return (
    <>
      <LandingIconDefs />
      <ScrollNav />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-[168px] md:pt-[140px] pb-20 overflow-hidden isolate">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 fv-hero-bg" />
        </div>
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            {/* AUTHORED eyebrow + heading: */}
            <div className="inline-flex items-center gap-3 mb-7">
              <span className="fv-pulse-dot" />
              <span className="fv-eyebrow">Resources</span>
            </div>
            <h1 className="fv-h-hero mb-[22px] max-w-[22ch]">
              Faith, mental toughness,{" "}
              <em>and competing free.</em>
            </h1>
            {/* AUTHORED subhead: */}
            <p className="max-w-[50ch] text-cream/70 text-[clamp(16px,1.4vw,19px)] leading-[1.55]">
              Evergreen articles on the mental and spiritual side of
              competition — for athletes and the parents raising them.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Article cards ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 md:py-28 bg-charcoal border-t border-hairline">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {articles.map((article) => (
              <Reveal key={article.slug}>
                <Link
                  href={`/resources/${article.slug}`}
                  className="group block bg-onyx border border-hairline rounded-lg p-7 h-full no-underline transition-colors duration-base ease-out hover:border-hairline-strong"
                >
                  {/* Audience tag */}
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/40 font-semibold mb-4">
                    {audienceLabel(article.audience)}
                  </div>
                  <h2 className="font-heading font-semibold text-[18px] leading-[1.25] text-cream tracking-[-0.005em] mb-3 group-hover:text-gold transition-colors duration-fast">
                    {article.title}
                  </h2>
                  <p className="font-body text-[13.5px] leading-[1.6] text-cream/60 m-0">
                    {article.excerpt}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
