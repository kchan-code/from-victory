import type { Metadata } from "next";
import {
  Big_Shoulders_Display,
  JetBrains_Mono,
  Manrope,
  Sora,
  Source_Serif_4,
} from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "From Victory",
  description:
    "Daily discipline, mental toughness, and faith for young athletes — from Christ's victory.",
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
      </body>
    </html>
  );
}
