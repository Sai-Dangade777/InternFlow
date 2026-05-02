const sections = [
  {
    id: "overview",
    label: "Overview",
    description: "Program snapshot"
  },
  {
    id: "referrals",
    label: "Referral Intake",
    description: "Submission + AI prefill"
  },
  {
    id: "workflow",
    label: "Workflow & SLA",
    description: "Stages + risk"
  },
  {
    id: "onboarding",
    label: "Onboarding",
    description: "Joining + access"
  },
  {
    id: "compliance",
    label: "Compliance & Audit",
    description: "NDA + trail"
  }
];

export default function SectionNav({ activeSection, onChange }) {
  return (
    <nav className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
      <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Sections</p>
      <div className="mt-3 grid gap-2">
        {sections.map((section) => {
          const isActive = section.id === activeSection;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onChange(section.id)}
              className={`flex flex-col gap-1 rounded-xl border px-3 py-2 text-left transition ${
                isActive
                  ? "border-emerald-400/80 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
              }`}
            >
              <span className="text-sm font-semibold">{section.label}</span>
              <span className="text-[11px] text-slate-500">{section.description}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
