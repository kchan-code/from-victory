import SportPicker from "@/components/athlete/SportPicker";
import { requireAthlete } from "@/lib/auth/guards";

export const metadata = {
  title: "Your sport · From Victory",
};

// No gate redirect here — this route IS the first-run destination.
// The gate that lands athletes here lives in /athlete/page.tsx.
export default async function SportOnboardingPage() {
  const { profile } = await requireAthlete();

  return <SportPicker currentSport={profile.sport} />;
}
