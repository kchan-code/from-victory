import { AppPreview } from "@/components/landing/AppPreview";
import { Audiences } from "@/components/landing/Audiences";
import { Faith } from "@/components/landing/Faith";
import { Footer } from "@/components/landing/Footer";
import { Framework } from "@/components/landing/Framework";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingIconDefs } from "@/components/landing/icons";
import { Posture } from "@/components/landing/Posture";
import { Problem } from "@/components/landing/Problem";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { Sports } from "@/components/landing/Sports";
import { Waitlist } from "@/components/landing/Waitlist";
import { WhySport } from "@/components/landing/WhySport";

export default function LandingPage() {
  return (
    <>
      <LandingIconDefs />
      <ScrollNav />
      <a id="top" />
      <Hero />
      <Problem />
      <WhySport />
      <Framework />
      <HowItWorks />
      <AppPreview />
      <Posture />
      <Sports />
      <Audiences />
      <Faith />
      <Waitlist />
      <Footer />
    </>
  );
}
