import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/resources/articles";

const siteUrl = "https://www.fromvictoryapp.com";

// Honest lastModified dates (FV-418). Previously every entry was
// `new Date()` — every deploy claimed every page changed, which teaches
// crawlers to ignore our lastmod entirely. Bump these when a page
// meaningfully changes; article dates come from the registry.
const MARKETING_UPDATED = new Date("2026-07-09");
const SEO_REFRESH = new Date("2026-08-26");
const SPORT_PAGES_ADDED = new Date("2026-08-27");

// Build-time only. A crawler once saw /sitemap.xml 500; keep this route
// a static list with a hardcoded article fallback so it cannot throw.
export const dynamic = "force-static";

const ARTICLE_FALLBACK: { slug: string; dateModified: string }[] = [
  {
    slug: "bible-verses-for-athletes-before-a-game",
    dateModified: "2026-08-26",
  },
  {
    slug: "pre-game-nerves-christian-athlete-routine",
    dateModified: "2026-08-26",
  },
  { slug: "how-to-bounce-back-after-a-bad-game", dateModified: "2026-08-26" },
  {
    slug: "when-your-athlete-gets-cut-a-parents-guide",
    dateModified: "2026-08-26",
  },
  {
    slug: "sports-psychology-and-faith-do-they-mix",
    dateModified: "2026-08-26",
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  let articleEntries: MetadataRoute.Sitemap;
  try {
    articleEntries = getAllArticles().map((article) => ({
      url: `${siteUrl}/resources/${article.slug}`,
      lastModified: new Date(article.dateModified),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    articleEntries = ARTICLE_FALLBACK.map((article) => ({
      url: `${siteUrl}/resources/${article.slug}`,
      lastModified: new Date(article.dateModified),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  }

  return [
    {
      url: siteUrl,
      lastModified: SEO_REFRESH,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/parents`,
      lastModified: SEO_REFRESH,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      // FV-545 — the athlete wisdom page.
      url: `${siteUrl}/athletes`,
      lastModified: "2026-09-01",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: MARKETING_UPDATED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/teams`,
      lastModified: MARKETING_UPDATED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: MARKETING_UPDATED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: MARKETING_UPDATED,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/hockey`,
      lastModified: SEO_REFRESH,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...(
      ["basketball", "golf", "football", "baseball", "lacrosse", "soccer"] as const
    ).map((sport) => ({
      url: `${siteUrl}/${sport}`,
      lastModified: SPORT_PAGES_ADDED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteUrl}/resources`,
      lastModified: SEO_REFRESH,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...articleEntries,
    {
      url: `${siteUrl}/pregame-ritual-christian-athlete`,
      lastModified: SEO_REFRESH,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/christian-athlete-apps`,
      lastModified: SEO_REFRESH,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: SEO_REFRESH,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: SEO_REFRESH,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
