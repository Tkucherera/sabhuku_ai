import { CheckCircle2 } from "lucide-react";
import type { TeamValue } from "./teamData";

export function TeamValues({ values }: { values: TeamValue[] }) {
  return (
    <section className="bg-slate-50 px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">How we work</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-950">
              Small team, clear principles.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="rounded-lg border border-slate-200 bg-white p-6">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <h3 className="mt-5 text-lg font-bold text-slate-950">{value.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
