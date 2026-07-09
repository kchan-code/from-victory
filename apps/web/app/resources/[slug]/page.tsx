// /resources/[slug] — individual article page (FV-238).
// Server Component. Public — no auth required.
// generateStaticParams drives SSG for all five articles.
// AUTHORED copy in this file: internal-link labels and "More resources" label.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";
import { LandingIconDefs } from "@/components/landing/icons";
import { ArticleBody } from "@/components/resources/ArticleBody";
import {
  getArticleBySlug,
  getAllSlugs,
  getAllArticles,
  type Article,
} from "@/lib/resources/articles";

const siteUrl = "https://www.fromvictoryapp.com";

// ---------------------------------------------------------------------------
// Static params — pre-render all five slugs
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// Per-article metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  const pageTitle = `${article.title} · From Victory`;
  const ogUrl = `${siteUrl}/resources/${article.slug}`;

  return {
    title: pageTitle,
    description: article.metaDescription,
    openGraph: {
      type: "article",
      url: ogUrl,
      siteName: "From Victory",
      title: pageTitle,
      description: article.metaDescription,
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
      title: pageTitle,
      description: article.metaDescription,
      images: [`${siteUrl}/from-victory-social-preview.jpg`],
    },
  };
}

// ---------------------------------------------------------------------------
// JSON-LD Article schema
// ---------------------------------------------------------------------------

function ArticleJsonLd({ article }: { article: Article }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    url: `${siteUrl}/resources/${article.slug}`,
    publisher: {
      "@type": "Organization",
      name: "From Victory",
      url: siteUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ---------------------------------------------------------------------------
// Audience label helper
// ---------------------------------------------------------------------------

function audienceLabel(audience: Article["audience"]): string {
  return audience === "athlete" ? "For athletes" : "For parents";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Related articles: up to 2 others, same audience first
  const others = getAllArticles()
    .filter((a) => a.slug !== article.slug)
    .sort((a, b) => {
      if (a.audience === article.audience && b.audience !== article.audience)
        return -1;
      if (b.audience === article.audience && a.audience !== article.audience)
        return 1;
      return 0;
    })
    .slice(0, 2);

  return (
    <>
      <ArticleJsonLd article={article} />
      <LandingIconDefs />
      <ScrollNav />

      <main>
        {/* ── Article header ──────────────────────────────────────────── */}
        <section className="relative pt-[168px] md:pt-[140px] pb-12 overflow-hidden isolate">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 fv-hero-bg" />
          </div>
          <div className="mx-auto max-w-[800px] px-5 sm:px-8">
            <Reveal>
              <div className="flex items-center gap-4 mb-7">
                {/* Back link — AUTHORED label: cream/55 base meets WCAG AA; hover stays cream/70+ */}
                <Link
                  href="/resources"
                  className="font-mono text-[11px] tracking-[0.16em] uppercase text-cream/55 hover:text-cream/70 transition-colors duration-fast no-underline"
                >
                  ← Resources
                </Link>
                <span className="text-cream/20" aria-hidden="true">
                  /
                </span>
                {/* Audience tag — cream/55 matches back-link base */}
                <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-cream/55">
                  {audienceLabel(article.audience)}
                </span>
              </div>
              <h1 className="fv-h-article mb-0 max-w-[30ch]">{article.title}</h1>
            </Reveal>
          </div>
        </section>

        {/* ── Article body ────────────────────────────────────────────── */}
        <section className="py-12 sm:py-16 border-t border-hairline">
          <div className="mx-auto max-w-[800px] px-5 sm:px-8">
            {/* Readable line-length column */}
            <div className="max-w-[68ch]">
              <ArticleBody markdown={article.bodyMd} />
            </div>
          </div>
        </section>

        {/* ── Internal footer links ─────────────────────────────────── */}
        <section className="border-t border-hairline py-10 bg-charcoal">
          <div className="mx-auto max-w-[800px] px-5 sm:px-8">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {/* AUTHORED link labels: */}
              <Link
                href="/parents"
                className="font-body text-[14px] text-cream/60 hover:text-cream no-underline transition-colors duration-fast"
              >
                For parents →
              </Link>
              <Link
                href="/pricing"
                className="font-body text-[14px] text-cream/60 hover:text-cream no-underline transition-colors duration-fast"
              >
                Pricing →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Related articles ──────────────────────────────────────── */}
        {others.length > 0 && (
          <section className="py-14 sm:py-20 border-t border-hairline">
            <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
              {/* AUTHORED section label: real <h2> for correct heading hierarchy
                  (h1 article title → h2 "More resources" → h3 card titles).
                  Visual styling kept identical to the old <p> label. */}
              <h2 className="font-mono text-[10px] tracking-[0.20em] uppercase text-cream/55 font-semibold mb-7">
                More resources
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {others.map((rel) => (
                  <Reveal key={rel.slug}>
                    <Link
                      href={`/resources/${rel.slug}`}
                      className="group block bg-charcoal border border-hairline rounded-lg p-6 no-underline transition-colors duration-base ease-out hover:border-hairline-strong"
                    >
                      {/* Eyebrow: cream/50 meets WCAG AA on charcoal at 10px bold */}
                      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold mb-3">
                        {audienceLabel(rel.audience)}
                      </div>
                      <h3 className="font-heading font-semibold text-[17px] leading-[1.3] text-cream tracking-[-0.005em] group-hover:text-gold transition-colors duration-fast">
                        {rel.title}
                      </h3>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
