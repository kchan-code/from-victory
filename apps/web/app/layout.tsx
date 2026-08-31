import type { Metadata } from "next";
import {
  Big_Shoulders_Display,
  JetBrains_Mono,
  Manrope,
  Sora,
  Source_Serif_4,
} from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AnalyticsMount } from "./_components/AnalyticsMount";
import { ServiceWorkerRegistrar } from "./_components/ServiceWorkerRegistrar";

const bigShoulders = Big_Shoulders_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  variable: "--font-big-shoulders",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-sora",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-manrope",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-source-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

const fontVariables = [
  bigShoulders.variable,
  sora.variable,
  manrope.variable,
  sourceSerif.variable,
  jetbrainsMono.variable,
].join(" ");

const siteUrl = "https://www.fromvictoryapp.com";
const socialImage = `${siteUrl}/from-victory-social-preview.jpg`;
const socialDescription =
  "See the first moment before you compete. Guided visualization for athletes 13+ across seven sports. Your identity is secure. Compete From Victory.";
const socialTitle = "From Victory | Visualize and Compete From Victory";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "From Victory | Visualize and Compete From Victory",
    template: "%s · From Victory",
  },
  description: socialDescription,
  openGraph: {
    type: "website",
    url: `${siteUrl}/`,
    siteName: "From Victory",
    title: socialTitle,
    description: socialDescription,
    images: [
      {
        url: socialImage,
        secureUrl: socialImage,
        type: "image/jpeg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description: socialDescription,
    images: [socialImage],
  },
  icons: {
    icon: [
      // SVG is the source of truth for browsers that support it. This is
      // the icon-only mark (open-book V + centered flame) per
      // docs/brand.md §8, which names favicon explicitly — not
      // app-icon.svg, which is the flame alone.
      { url: "/logo-icon.svg", type: "image/svg+xml" },
      // PNG fallbacks (and what the manifest route exposes as the
      // installable home-screen icon).
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      // iOS requires PNG for apple-touch-icon — SVG does not render on
      // the home screen. 180x180 is the canonical Apple size.
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="min-h-screen bg-onyx text-cream antialiased">
        {/* FV-511: first-party, non-tracking `js`-class script. Next.js
            injects `beforeInteractive` scripts into <head> and runs them
            before hydration regardless of tree position, so `.js
            .fv-reveal` in globals.css can hide entrance-animated sections
            only once JS is actually running — no-JS visitors never see
            the hidden state. suppressHydrationWarning above scopes only
            the <html> className mismatch this intentionally causes;
            nothing else is suppressed. */}
        <Script id="fv-js-class" strategy="beforeInteractive">
          {"document.documentElement.classList.add('js');"}
        </Script>
        {/* FV-511: skip link — first focusable element in body, visually
            hidden until keyboard-focused. Targets #main-content, which
            every route's <main> carries. Cobalt per docs/brand.md §9
            (UI interaction accent, never the logo). */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:inline-flex focus:min-h-[44px] focus:items-center focus:rounded-lg focus:bg-cobalt focus:px-5 focus:py-3 focus:font-heading focus:text-[15px] focus:font-semibold focus:text-cream focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cobalt-bright focus:ring-offset-2 focus:ring-offset-onyx"
        >
          Skip to main content
        </a>
        {children}
        {/* FV-105: service worker registration — runs after window load, renders nothing */}
        <ServiceWorkerRegistrar />
        {/* FV-395: Vercel Web Analytics — public-marketing-only via beforeSend allowlist, renders nothing */}
        <AnalyticsMount />
      </body>
    </html>
  );
}
