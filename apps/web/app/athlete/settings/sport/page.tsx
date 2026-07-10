import { redirect } from "next/navigation";

import ChangeSportFlow from "@/components/athlete/ChangeSportFlow";
import { requireAthlete } from "@/lib/auth/guards";

export const metadata = {
  title: "Change sport",
};

export default async function ChangeSportPage() {
  const { profile } = await requireAthlete();

  // An athlete who hasn't chosen a sport yet belongs on the first-run picker,
  // not the settings change-flow.
  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  return <ChangeSportFlow currentSport={profile.sport} />;
}
