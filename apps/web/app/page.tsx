import { AppPreview } from "@/components/landing/AppPreview";
import { Faith } from "@/components/landing/Faith";
import { Footer } from "@/components/landing/Footer";
import { Framework } from "@/components/landing/Framework";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingIconDefs } from "@/components/landing/icons";
import { Problem } from "@/components/landing/Problem";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { Sports } from "@/components/landing/Sports";
import { Waitlist } from "@/components/landing/Waitlist";

export default function LandingPage() {
  return (
    <>
      <LandingIconDefs />
      <ScrollNav />
      <a id="top" />
      <Hero />
      <Problem />
      <Framework />
      <HowItWorks />
      <AppPreview />
      <Sports />
      <Faith />
      <Waitlist />
      <Footer />
    </>
  );
}
