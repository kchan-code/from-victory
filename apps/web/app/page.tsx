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
import { Visualization } from "@/components/landing/Visualization";
import { Waitlist } from "@/components/landing/Waitlist";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";

// Canonical for the landing page — UTM/source-parameterized URLs all
// consolidate here (FV-418).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// FV-514 homepage IA restructure (8 sections) + FV-534 (9 sections):
//   1. Hero                4. Method              7. PricingSummary
//   2. PregameSample       5. AppPreview          8. Founder (+ beta quote)
//   3. Visualization       6. ParentTrust         9. Faq + Waitlist
// Visualization (FV-534, KC direction: the audio-guided visualization
// story is the differentiator) sits directly after the playable sample so
// its "real pauses, game speed" claim is demonstrable one scroll up. The
// four FV-514-retired thesis-restatement sections and the (empty) quote
// carousel still do not render here.
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
        <Visualization />
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
