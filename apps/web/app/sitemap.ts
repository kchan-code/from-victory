import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/resources/articles";

const siteUrl = "https://www.fromvictoryapp.com";

// Honest lastModified dates (FV-418). Previously every entry was
// `new Date()` — every deploy claimed every page changed, which teaches
// crawlers to ignore our lastmod entirely. Bump these when a page
// meaningfully changes; article dates come from the registry.
const MARKETING_UPDATED = new Date("2026-07-09");
const LEGAL_UPDATED = new Date("2026-06-24");

export default function sitemap(): MetadataRoute.Sitemap {
  const articleEntries: MetadataRoute.Sitemap = getAllArticles().map(
    (article) => ({
      url: `${siteUrl}/resources/${article.slug}`,
      lastModified: new Date(article.dateModified),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }),
  );

  return [
    {
      url: siteUrl,
      lastModified: MARKETING_UPDATED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/parents`,
      lastModified: MARKETING_UPDATED,
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
      url: `${siteUrl}/resources`,
      lastModified: MARKETING_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...articleEntries,
    {
      url: `${siteUrl}/pregame-ritual-christian-athlete`,
      lastModified: MARKETING_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/christian-athlete-apps`,
      lastModified: MARKETING_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: LEGAL_UPDATED,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: LEGAL_UPDATED,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
