import type { Metadata } from "next";
import { LandingIconDefs } from "@/components/landing/icons";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";
import { ContactForm } from "@/components/landing/ContactForm";

const siteUrl = "https://www.fromvictoryapp.com";

export const metadata: Metadata = {
  title: "Contact · From Victory",
  description:
    "Questions about From Victory? Reach out — we read every message. Parents, athletes, coaches, teams, and churches all welcome.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/contact`,
    siteName: "From Victory",
    title: "Contact · From Victory",
    description:
      "Questions about From Victory? Reach out — we read every message. Parents, athletes, coaches, teams, and churches all welcome.",
    images: [
      {
        url: `${siteUrl}/from-victory-social-preview.jpg`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact · From Victory",
    description:
      "Questions about From Victory? Reach out — we read every message. Parents, athletes, coaches, teams, and churches all welcome.",
    images: [`${siteUrl}/from-victory-social-preview.jpg`],
  },
};

export default function ContactPage() {
  return (
    <>
      <LandingIconDefs />
      <ScrollNav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-[168px] md:pt-[140px] pb-24 overflow-hidden isolate">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 fv-hero-bg" />
        </div>
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <div className="inline-flex items-center gap-3 mb-7">
              <span className="fv-pulse-dot" />
              <span className="fv-eyebrow">Contact</span>
            </div>
            <h1 className="fv-h-hero mb-[26px] max-w-[16ch]">
              Get in touch.
            </h1>
            <p className="max-w-[50ch] mb-12 text-cream/70 text-[clamp(16px,1.4vw,19px)] leading-[1.55]">
              Questions about the app, pricing, sports, or group options for
              teams and churches — we read every message and will get back to
              you.
            </p>

            {/* Form constrained to a readable width */}
            <div className="max-w-[580px]">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
