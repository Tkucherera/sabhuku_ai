import { Footer } from "../ui/footer";
import { Nav } from "../ui/nav";
import { TeamGrid } from "./TeamGrid";
import { TeamHero } from "./TeamHero";
import { TeamValues } from "./TeamValues";
import { teamMembers, teamValues } from "./teamData";

export function AboutUs() {
  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <TeamHero />
      <TeamGrid members={teamMembers} />
      <TeamValues values={teamValues} />
      <Footer />
    </main>
  );
}
