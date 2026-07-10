import type { Metadata } from "next";
import { AppPreview } from "@/components/landing/AppPreview";
import { Faq } from "@/components/landing/Faq";
import { Faith } from "@/components/landing/Faith";
import { Footer } from "@/components/landing/Footer";
import { Founder } from "@/components/landing/Founder";
import { Framework } from "@/components/landing/Framework";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingIconDefs } from "@/components/landing/icons";
import { PregameSample } from "@/components/landing/PregameSample";
import { Problem } from "@/components/landing/Problem";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { StructuredData } from "@/components/landing/StructuredData";
import { Testimonials } from "@/components/landing/Testimonials";
import { Waitlist } from "@/components/landing/Waitlist";
import { AttributionCapture } from "@/components/marketing/AttributionCapture";

// Canonical for the landing page — UTM/source-parameterized URLs all
// consolidate here (FV-418).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <>
      <StructuredData />
      <AttributionCapture />
      <LandingIconDefs />
      <ScrollNav />
      <a id="top" />
      <Hero />
      <PregameSample />
      <Problem />
      <Framework />
      <HowItWorks />
      <AppPreview />
      <Faith />
      <Testimonials />
      <Founder />
      <Faq />
      <Waitlist />
      <Footer />
    </>
  );
}
