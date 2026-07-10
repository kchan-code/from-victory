import type { MetadataRoute } from "next";

const siteUrl = "https://www.fromvictoryapp.com";

export default function robots(): MetadataRoute.Robots {
  // Public marketing surfaces are open to all crawlers, including AI/answer
  // engines — a deliberate GEO decision (FV-418): for an unknown brand,
  // being ingested and cited by AI answers is upside. The explicit bot
  // rules below are semantically identical to "*" and exist to document
  // that intent in code.
  const PUBLIC_RULE = {
    allow: "/",
    disallow: [
      "/athlete/",
      "/dashboard/",
      "/pair",
      "/signup",
      "/signin",
      "/subscribe",
      "/api/",
    ],
  };

  return {
    rules: [
      { userAgent: "*", ...PUBLIC_RULE },
      { userAgent: "GPTBot", ...PUBLIC_RULE },
      { userAgent: "OAI-SearchBot", ...PUBLIC_RULE },
      { userAgent: "ClaudeBot", ...PUBLIC_RULE },
      { userAgent: "PerplexityBot", ...PUBLIC_RULE },
      { userAgent: "Google-Extended", ...PUBLIC_RULE },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
