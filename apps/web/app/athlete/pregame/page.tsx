import { redirect } from "next/navigation";

import { PregameFlow } from "@/components/pregame/PregameFlow";
import { requireAthlete } from "@/lib/auth/guards";

export const metadata = {
  title: "Pregame · From Victory",
};

export default async function PregamePage() {
  const { profile } = await requireAthlete();

  // First-run gate: an athlete must choose their sport before reaching
  // sport-keyed pregame content. Mirrors the /athlete dashboard gate (FV-33);
  // closes the deep-link bypass of /athlete/pregame.
  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  return (
    <PregameFlow athleteFirstName={profile.first_name} sport={profile.sport} />
  );
}
