import { Users } from "lucide-react";

export function TeamHero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 ring-1 ring-white/15 mb-6">
            <Users className="w-4 h-4" />
            Meet our team
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.03]">
            Builders shaping practical AI for African teams.
          </h1>
          <p className="mt-6 text-xl text-slate-300 max-w-3xl">
            SABHUKU AI is built by a focused core team and a growing contributor community working across models, datasets, tutorials, and deployment infrastructure.
          </p>
        </div>
      </div>
    </section>
  );
}
