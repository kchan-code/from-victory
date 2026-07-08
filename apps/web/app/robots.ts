import type { MetadataRoute } from "next";

const siteUrl = "https://www.fromvictoryapp.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/athlete/", "/dashboard/", "/pair", "/signup", "/signin", "/subscribe", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
