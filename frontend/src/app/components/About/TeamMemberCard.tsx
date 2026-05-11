import type { TeamMember } from "./teamData";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="aspect-[4/3] bg-slate-100">
        {member.imageUrl ? (
          <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-slate-900 to-emerald-700 text-white">
            <span className="text-5xl font-extrabold tracking-normal">{getInitials(member.name)}</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{member.name}</h2>
          <p className="mt-1 text-sm font-semibold text-blue-700">{member.role}</p>
          <p className="mt-3 text-sm font-medium text-slate-700">{member.focus}</p>
          <p className="mt-4 text-slate-600 leading-7">{member.bio}</p>
        </div>

        {member.links.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {member.links.map(({ label, href, Icon }) => (
              <a
                key={`${member.name}-${label}`}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer" : undefined}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label={`${member.name} ${label}`}
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
