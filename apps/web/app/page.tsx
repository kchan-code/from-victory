import type { Metadata } from "next";
import { AppPreview } from "@/components/landing/AppPreview";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";
import { Founder } from "@/components/landing/Founder";
import { Hero } from "@/components/landing/Hero";
import { LandingIconDefs } from "@/components/landing/icons";
import { Method } from "@/components/landing/Method";
import { ParentTrust } from "@/components/landing/ParentTrust";
import { PregameSample } from "@/components/landing/PregameSample";
import { PricingSummary } from "@/components/landing/PricingSummary";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { StructuredData } from "@/components/landing/StructuredData";
import { Waitlist } from "@/components/landing/Waitlist";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";

// Canonical for the landing page — UTM/source-parameterized URLs all
// consolidate here (FV-418).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// FV-514 homepage IA restructure — 8 sections (was 10):
//   1. Hero               4. AppPreview          7. Founder (+ beta quote)
//   2. PregameSample       5. ParentTrust         8. Faq + Waitlist
//   3. Method                 6. PricingSummary
// The four consecutive thesis-restatement sections and the (empty) quote
// carousel component no longer render here — see the build notes for what
// moved where.
export default function LandingPage() {
  return (
    <>
      <StructuredData />
      <AttributionCapture />
      <LandingIconDefs />
      <ScrollNav />
      <a id="top" />
      <main id="main-content">
        <Hero />
        <PregameSample />
        <Method />
        <AppPreview />
        <ParentTrust />
        <PricingSummary />
        <Founder />
        <Faq />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}
