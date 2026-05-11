import { TeamMemberCard } from "./TeamMemberCard";
import type { TeamMember } from "./teamData";

export function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <section className="bg-white px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">People</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-950">The team behind the platform</h2>
          <p className="mt-4 text-lg text-slate-600">
            A compact team with a broad mission: make AI assets easier to find, understand, share, and deploy.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <TeamMemberCard key={member.name} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}
