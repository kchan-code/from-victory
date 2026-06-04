import { redirect } from "next/navigation";

import { PracticeFlow } from "@/components/pregame/PracticeFlow";
import { requireAthlete } from "@/lib/auth/guards";

export const metadata = {
  title: "Pre-Practice · From Victory",
};

export default async function PracticePage() {
  const { profile } = await requireAthlete();

  // First-run gate: an athlete must choose their sport before reaching
  // sport-keyed pre-practice content (FV-33). Mirrors the /athlete dashboard
  // gate; closes the deep-link bypass of /athlete/practice.
  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  return <PracticeFlow sport={profile.sport} />;
}
