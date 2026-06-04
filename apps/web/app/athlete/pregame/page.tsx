import { PregameFlow } from "@/components/pregame/PregameFlow";
import { requireAthlete } from "@/lib/auth/guards";

export const metadata = {
  title: "Pregame · From Victory",
};

export default async function PregamePage() {
  const { profile } = await requireAthlete();

  return (
    <PregameFlow athleteFirstName={profile.first_name} sport={profile.sport} />
  );
}
