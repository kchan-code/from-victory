const siteUrl = "https://www.fromvictoryapp.com";
const siteDescription =
  "A Christ-centered mindset app for athletes who compete from identity, not performance.";

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
      price: "5.00",
      priceCurrency: "USD",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    {
      "@type": "Offer",
      price: "49.00",
      priceCurrency: "USD",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
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
