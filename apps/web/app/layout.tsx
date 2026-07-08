import type { Metadata } from "next";
import {
  Big_Shoulders_Display,
  JetBrains_Mono,
  Manrope,
  Sora,
  Source_Serif_4,
} from "next/font/google";
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
  "A Christ-centered mindset app for athletes who compete from identity, not performance.";
const socialTitle = "From Victory | Compete from Victory";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "From Victory | Christian Athlete Mindset App",
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
      // SVG is the source of truth for browsers that support it.
      { url: "/app-icon.svg", type: "image/svg+xml" },
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
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen bg-onyx text-cream antialiased">
        {children}
        {/* FV-105: service worker registration — runs after window load, renders nothing */}
        <ServiceWorkerRegistrar />
        {/* FV-395: Vercel Web Analytics — public-marketing-only via beforeSend allowlist, renders nothing */}
        <AnalyticsMount />
      </body>
    </html>
  );
}
