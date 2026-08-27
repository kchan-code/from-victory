const siteUrl = "https://www.fromvictoryapp.com";
const siteDescription =
  "Mental-toughness training for athletes 13+. Hockey-first among live sports. Identity in Christ, not performance.";

function offerPriceValidUntil(): string {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!;
}

export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "From Victory",
  url: siteUrl,
  description: siteDescription,
  // PNG, not SVG — Google ignores SVG for Organization.logo (qa-reviewer, FV-397)
  logo: `${siteUrl}/icon-512.png`,
  sameAs: [
    "https://www.instagram.com/fromvictory",
    "https://x.com/fromvictoryapp",
    "https://www.youtube.com/channel/UCzf2kE-zUfScbYTQxG603Lw",
    "https://www.tiktok.com/@fromvictoryapp",
  ],
};

export const SOFTWARE_APPLICATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "From Victory",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description: siteDescription,
  offers: [
    {
      "@type": "Offer",
      name: "14-day free trial",
      description:
        "14-day free trial for first-time subscribers. Then $5/month or $49/year for the first athlete. Cancel anytime.",
      price: "0",
      priceCurrency: "USD",
      priceValidUntil: offerPriceValidUntil(),
    },
    {
      "@type": "Offer",
      name: "Monthly — first athlete",
      description:
        "14-day free trial, then $5/month for the first athlete. Cancel anytime.",
      price: "5.00",
      priceCurrency: "USD",
      priceValidUntil: offerPriceValidUntil(),
    },
    {
      "@type": "Offer",
      name: "Annual — first athlete",
      description:
        "14-day free trial, then $49/year for the first athlete. Cancel anytime.",
      price: "49.00",
      priceCurrency: "USD",
      priceValidUntil: offerPriceValidUntil(),
    },
    {
      "@type": "Offer",
      name: "Monthly — additional athlete",
      description: "$3/month for each additional athlete on the same plan.",
      price: "3.00",
      priceCurrency: "USD",
      priceValidUntil: offerPriceValidUntil(),
    },
    {
      "@type": "Offer",
      name: "Annual — additional athlete",
      description: "$29/year for each additional athlete on the same plan.",
      price: "29.00",
      priceCurrency: "USD",
      priceValidUntil: offerPriceValidUntil(),
    },
  ],
};

export function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ORGANIZATION_JSON_LD),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(SOFTWARE_APPLICATION_JSON_LD),
        }}
      />
    </>
  );
}
