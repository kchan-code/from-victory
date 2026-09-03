import Image from "next/image";
import Link from "next/link";

// Absolute /# form so these resolve to the homepage anchors from the
// sub-pages (/parents, /pricing, /teams) that also render this footer.
const productLinks = [
  { href: "/#how", label: "How it works" },
  { href: "/#app", label: "The app" },
  { href: "/hockey", label: "Hockey" },
  { href: "/signup", label: "Start free trial" },
  { href: "https://shop.fromvictoryapp.com/", label: "Shop" },
];

const forLinks = [
  { href: "/#how", label: "For the Athlete" },
  { href: "/parents", label: "For Parents" },
  { href: "/teams", label: "For Teams & Churches" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
  { href: "/signin", label: "Sign in" },
];

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/delete-account", label: "Delete Account" },
];

export function Footer() {
  return (
    <footer className="border-t border-hairline py-14 pb-10 bg-onyx">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-10 sm:gap-14 mb-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
          <div>
            <Image
              src="/logo-stacked.svg"
              alt="From Victory"
              width={140}
              height={80}
              className="h-20 w-auto mb-5"
            />
            <div className="font-display font-bold text-[12px] tracking-[0.16em] uppercase text-cream/70 leading-[1.55] max-w-[320px]">
              Rooted in the Word.
              <br />
              Fueled by the Spirit.
              <br />
              Built for Victory.
            </div>
          </div>
          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="For" links={forLinks} />
          <FooterColumn title="Company" links={companyLinks} />
        </div>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-8 border-t border-hairline font-mono text-[11px] tracking-[0.14em] uppercase text-cream/50 font-semibold">
          <div>© 2026 From Victory LLC · All rights reserved</div>
          {/* FV-512: 44px tap targets (was 18px icon + 14px gap). Padding
              grows the hit area to 44x44px without enlarging the icon
              glyph itself, so the visual weight of the row barely moves. */}
          <div className="flex text-cream/50">
            <a
              href="https://www.instagram.com/fromvictory"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex h-[44px] w-[44px] items-center justify-center hover:text-cream"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://x.com/fromvictoryapp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="inline-flex h-[44px] w-[44px] items-center justify-center hover:text-cream"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com/channel/UCzf2kE-zUfScbYTQxG603Lw"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="inline-flex h-[44px] w-[44px] items-center justify-center hover:text-cream"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <rect x="2" y="6" width="20" height="12" rx="3" />
                <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@fromvictoryapp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="inline-flex h-[44px] w-[44px] items-center justify-center hover:text-cream"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="font-mono text-[10px] tracking-[0.20em] uppercase text-cream/50 font-semibold m-0 mb-[18px]">
        {title}
      </h3>
      {/* FV-512: 44px tap targets (was ~21px text-line links, gap-3
          between). The old gap is dropped in favor of padding baked into
          each link's own box, so the hit area — not just the glyph —
          reaches 44px; the column runs somewhat taller as a result. */}
      <ul className="list-none p-0 m-0 flex flex-col">
        {links.map((l) => {
          const isRoute = l.href.startsWith("/");
          const className =
            "flex min-h-[44px] items-center font-body text-[14px] text-cream/70 no-underline hover:text-cream transition-colors duration-fast ease-out";
          return (
            <li key={l.label}>
              {isRoute ? (
                <Link href={l.href} className={className}>
                  {l.label}
                </Link>
              ) : (
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {l.label}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
