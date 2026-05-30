import { PracticeFlow } from "@/components/pregame/PracticeFlow";
import { requireAthlete } from "@/lib/auth/guards";

export const metadata = {
  title: "Pre-Practice · From Victory",
};

export default async function PracticePage() {
  await requireAthlete();

  return <PracticeFlow />;
}
