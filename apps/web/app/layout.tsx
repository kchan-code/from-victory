import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen bg-onyx text-cream antialiased">
        {children}
      </body>
    </html>
  );
}
